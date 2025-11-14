<template>
  <div class="lab-runner">
    <!-- 实验配置检查 -->
    <div v-if="!config || !config.experimentType" class="lab-error">
      <el-result
        icon="warning"
        title="实验配置错误"
        sub-title="缺少必要的实验配置信息"
      >
        <template #extra>
          <el-button type="primary" @click="$emit('error', '实验配置不完整')">
            返回
          </el-button>
        </template>
      </el-result>
    </div>

    <!-- 实验初始化 -->
    <div v-else-if="status === 'initializing'" class="lab-initializing">
      <div class="init-loading">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <h3>正在初始化实验环境</h3>
        <p>{{ initStatusText }}</p>
        <el-progress :percentage="initProgress" :show-text="false" />
      </div>
    </div>

    <!-- 实验运行中 -->
    <div v-else-if="status === 'running'" class="lab-running">
      <!-- 实验控制栏 -->
      <div class="lab-controls">
        <div class="control-left">
          <el-tag type="success" size="sm">
            <el-icon><CircleCheck /></el-icon>
            实验运行中
          </el-tag>
          <span class="runtime-info">
            运行时间: {{ formatRuntime(labSession?.startTime) }}
          </span>
        </div>
        <div class="control-right">
          <el-button size="small" @click="showLogs = !showLogs">
            <el-icon><Document /></el-icon>
            {{ showLogs ? '隐藏' : '显示' }}日志
          </el-button>
          <el-button size="small" type="warning" @click="restartLab">
            <el-icon><RefreshRight /></el-icon>
            重启
          </el-button>
          <el-button size="small" type="danger" @click="stopLab">
            <el-icon><Close /></el-icon>
            停止
          </el-button>
        </div>
      </div>

      <!-- 实验内容区域 -->
      <div class="lab-content">
        <!-- Jupyter实验 -->
        <div v-if="config.experimentType === 'jupyter'" class="jupyter-lab">
          <JupyterViewer
            :session="labSession"
            :config="config.jupyterConfig"
            @output="handleJupyterOutput"
            @error="handleJupyterError"
          />
        </div>

        <!-- AI实验 -->
        <div v-else-if="config.experimentType === 'ai'" class="ai-lab">
          <AIExperimentRunner
            :config="config.aiConfig"
            :context="context"
            @complete="handleAIComplete"
            @error="handleAIError"
          />
        </div>

        <!-- 仿真实验 -->
        <div v-else-if="config.experimentType === 'simulation'" class="simulation-lab">
          <SimulationRunner
            :config="config.simulationConfig"
            @complete="handleSimulationComplete"
            @error="handleSimulationError"
          />
        </div>
      </div>

      <!-- 实验日志 -->
      <div v-if="showLogs" class="lab-logs">
        <div class="logs-header">
          <h4>
            <el-icon><Document /></el-icon>
            实验日志
          </h4>
          <el-button size="small" @click="clearLogs">清空</el-button>
        </div>
        <div class="logs-content">
          <div
            v-for="log in labLogs"
            :key="log.timestamp.getTime()"
            class="log-item"
            :class="`log-level-${log.level}`"
          >
            <span class="log-time">{{ formatLogTime(log.timestamp) }}</span>
            <span class="log-level">{{ log.level.toUpperCase() }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
          <div v-if="labLogs.length === 0" class="logs-empty">
            暂无日志信息
          </div>
        </div>
      </div>
    </div>

    <!-- 实验错误 -->
    <div v-else-if="status === 'error'" class="lab-error">
      <el-result
        icon="error"
        title="实验启动失败"
        :sub-title="errorMessage"
      >
        <template #extra>
          <el-button type="primary" @click="retryInitialization">重试</el-button>
          <el-button @click="$emit('error', errorMessage || '未知错误')">
            返回
          </el-button>
        </template>
      </el-result>
    </div>

    <!-- 实验已完成 -->
    <div v-else-if="status === 'completed'" class="lab-completed">
      <el-result
        icon="success"
        title="实验已完成"
        sub-title="实验环境已自动停止"
      >
        <template #extra>
          <el-button type="primary" @click="viewResults">查看结果</el-button>
          <el-button @click="restartLab">重新开始</el-button>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Loading,
  CircleCheck,
  Document,
  RefreshRight,
  Close
} from '@element-plus/icons-vue'

import type {
  ExperimentConfig,
  ActivityContext,
  ActivityResult,
  LabSession,
  LabLog
} from '@/types/course'

// 导入实验服务
import { labService } from '@/services/lab'
import { labLauncher } from '@/services/lab/lab-launcher'
import { useLabStore } from '@/stores/lab'

// 导入子组件
import AIExperimentRunner from '@/components/ai/AIExperimentRunner.vue'
// import JupyterViewer from './jupyter/JupyterViewer.vue'
// import SimulationRunner from './simulation/SimulationRunner.vue'

interface Props {
  config: ExperimentConfig
  context: ActivityContext
}

interface Emits {
  'complete': [result: ActivityResult]
  'error': [error: Error | string]
  'progress': [progress: number]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 服务
const labStore = useLabStore()

// 组件注册
const components = {
  AIExperimentRunner
}

// 响应式数据
const status = ref<'initializing' | 'running' | 'error' | 'completed'>('initializing')
const errorMessage = ref<string | null>(null)
const initProgress = ref(0)
const initStatusText = ref('正在连接实验服务...')
const labSession = ref<LabSession | null>(null)
const labLogs = ref<LabLog[]>([])
const showLogs = ref(false)

// 计算属性
const canStartLab = computed(() => {
  return props.config && props.config.experimentType
})

// 方法
const initializeLab = async () => {
  if (!canStartLab.value) {
    status.value = 'error'
    errorMessage.value = '实验配置不完整'
    return
  }

  status.value = 'initializing'
  initProgress.value = 0
  errorMessage.value = null
  initStatusText.value = '正在启动实验环境...'

  try {
    addLog('info', '开始启动实验环境...')

    // 使用LabLauncher启动实验
    const session = await labLauncher.launchLab(
      props.context.activityId,
      props.config,
      props.context,
      {
        studentId: 'current_student', // TODO: 从用户store获取
        enableMonitoring: true,
        enableLogging: true
      }
    )

    // 启动成功
    labSession.value = session
    status.value = 'running'
    initProgress.value = 100
    initStatusText.value = '实验环境就绪'

    // 更新labStore状态
    labStore.setActiveSession(session)
    labStore.setConnectionStatus(true)

    addLog('info', `实验环境启动成功: ${session.id}`)
    ElMessage.success('实验环境已就绪')

    // 开始监控启动状态
    monitorLaunchProgress()

  } catch (error) {
    console.error('Failed to initialize lab:', error)
    status.value = 'error'
    errorMessage.value = error instanceof Error ? error.message : '初始化失败'

    addLog('error', `实验初始化失败: ${errorMessage.value}`)
    ElMessage.error(`实验启动失败: ${errorMessage.value}`)
  }
}


const checkSessionStatus = (session: LabSession) => {
  // 使用labStore检查会话状态
  const storeSession = labStore.activeSession
  if (storeSession && storeSession.id === session.id) {
    // 可以在这里处理状态变化
    if (storeSession.status === 'error') {
      status.value = 'error'
      errorMessage.value = '实验环境出现错误'
    }
  }
}

const monitorLaunchProgress = () => {
  if (!labSession.value) return

  // 监控LabLauncher的启动状态
  const interval = setInterval(() => {
    if (status.value !== 'running') {
      clearInterval(interval)
      return
    }

    const launchStatus = labLauncher.getLaunchStatus(labSession.value!.id)

    if (launchStatus && launchStatus.progress !== undefined) {
      initProgress.value = launchStatus.progress
      initStatusText.value = launchStatus.stage || '正在处理...'

      if (launchStatus.error) {
        addLog('error', `启动错误: ${launchStatus.error}`)
      }
    }

    // 检查会话状态
    checkSessionStatus(labSession.value!)
  }, 1000)

  // 保存interval ID以便清理
  monitorLaunchProgress.interval = interval
}

const stopLab = async () => {
  if (!labSession.value) return

  try {
    addLog('info', '正在停止实验环境...')

    // 使用LabLauncher停止实验
    const success = await labLauncher.stopLab(labSession.value.id)

    if (success) {
      labSession.value.status = 'stopped'
      labSession.value.endTime = new Date()

      // 更新labStore状态
      labStore.clearActiveSession()

      status.value = 'completed'
      addLog('info', '实验环境已停止')

      ElMessage.info('实验环境已停止')
    } else {
      throw new Error('停止实验失败')
    }
  } catch (error) {
    console.error('Failed to stop lab:', error)
    addLog('error', `停止实验失败: ${error instanceof Error ? error.message : '未知错误'}`)
    ElMessage.error('停止实验环境失败')
  }
}

const restartLab = async () => {
  try {
    await ElMessageBox.confirm('确定要重启实验环境吗？当前进度可能会丢失。', '重启确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    if (!labSession.value) {
      await initializeLab()
      return
    }

    addLog('info', '正在重启实验环境...')

    // 使用LabLauncher重启实验
    const restartedSession = await labLauncher.restartLab(labSession.value.id)

    if (restartedSession) {
      labSession.value = restartedSession
      status.value = 'running'

      // 更新labStore状态
      labStore.setActiveSession(restartedSession)

      addLog('info', '实验环境重启成功')
      ElMessage.success('实验环境已重启')
    } else {
      throw new Error('重启实验失败')
    }
  } catch (error) {
    if (error instanceof Error && error.message !== 'cancel') {
      console.error('Failed to restart lab:', error)
      addLog('error', `重启实验失败: ${error.message}`)
      ElMessage.error('重启实验环境失败')
    }
  }
}

const retryInitialization = () => {
  initializeLab()
}

const viewResults = () => {
  const result: ActivityResult = {
    success: true,
    score: 100,
    maxScore: 100,
    feedback: '实验已完成',
    artifacts: [
      {
        id: 'lab_logs',
        name: '实验日志',
        type: 'data',
        content: labLogs.value,
        createdAt: new Date()
      }
    ],
    analytics: {
      timeSpent: labSession.value?.startTime ?
        Math.floor((Date.now() - labSession.value.startTime.getTime()) / 1000) : 0,
      interactions: labLogs.value.length,
      errors: labLogs.value.filter(log => log.level === 'error').length,
      hints: 0,
      retries: 1
    }
  }

  emit('complete', result)
}

// 事件处理
const handleJupyterOutput = (output: any) => {
  addLog('info', `Jupyter输出: ${JSON.stringify(output).substring(0, 100)}...`)
}

const handleJupyterError = (error: string) => {
  addLog('error', `Jupyter错误: ${error}`)
}

const handleAIComplete = (result: any) => {
  addLog('info', 'AI实验完成')
  viewResults()
}

const handleAIError = (error: string) => {
  addLog('error', `AI实验错误: ${error}`)
}

const handleSimulationComplete = (result: any) => {
  addLog('info', '仿真实验完成')
  viewResults()
}

const handleSimulationError = (error: string) => {
  addLog('error', `仿真实验错误: ${error}`)
}

// 日志管理
const addLog = (level: LabLog['level'], message: string) => {
  const log: LabLog = {
    timestamp: new Date(),
    level,
    message
  }

  labLogs.value.push(log)

  // 限制日志数量
  if (labLogs.value.length > 100) {
    labLogs.value = labLogs.value.slice(-100)
  }
}

const clearLogs = () => {
  labLogs.value = []
}

// 格式化工具
const formatRuntime = (startTime?: Date) => {
  if (!startTime) return '00:00:00'

  const duration = Math.floor((Date.now() - startTime.getTime()) / 1000)
  const hours = Math.floor(duration / 3600)
  const minutes = Math.floor((duration % 3600) / 60)
  const seconds = duration % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

const formatLogTime = (timestamp: Date) => {
  return timestamp.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 生命周期
onMounted(() => {
  initializeLab()
})

onUnmounted(() => {
  // 清理实验环境
  if (status.value === 'running' && labSession.value) {
    stopLab()
  }

  // 清理监控定时器
  if (monitorLaunchProgress.interval) {
    clearInterval(monitorLaunchProgress.interval)
  }

  // 清理labStore状态
  labStore.clearActiveSession()
})
</script>

<style scoped lang="scss">
.lab-runner {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 500px;
}

.lab-error,
.lab-completed {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.lab-initializing {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.init-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
  max-width: 300px;

  .loading-icon {
    font-size: 48px;
    color: var(--edu-primary-500);
    animation: spin 1s linear infinite;
  }

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: var(--edu-text-primary);
    margin: 0;
  }

  p {
    font-size: 14px;
    color: var(--edu-text-secondary);
    margin: 0;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.lab-running {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.lab-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  border: 1px solid var(--edu-border-color);
  backdrop-filter: blur(8px);
}

.control-left,
.control-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.runtime-info {
  font-size: 13px;
  color: var(--edu-text-secondary);
  font-family: 'Monaco', 'Menlo', monospace;
}

.lab-content {
  flex: 1;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);

  .jupyter-lab,
  .ai-lab,
  .simulation-lab {
    height: 500px;
  }
}

.lab-logs {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  border: 1px solid var(--edu-border-color);
  overflow: hidden;

  .logs-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: rgba(15, 23, 42, 0.04);
    border-bottom: 1px solid var(--edu-border-color);

    h4 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: var(--edu-text-primary);
      margin: 0;
    }
  }

  .logs-content {
    max-height: 300px;
    overflow-y: auto;
    padding: 12px 20px;
    font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.5;
  }

  .log-item {
    display: flex;
    gap: 12px;
    padding: 4px 0;
    border-bottom: 1px solid rgba(15, 23, 42, 0.06);

    &:last-child {
      border-bottom: none;
    }
  }

  .log-time {
    color: var(--edu-text-disabled);
    min-width: 80px;
  }

  .log-level {
    min-width: 50px;
    font-weight: 600;
  }

  .log-message {
    flex: 1;
    word-break: break-word;
  }

  .log-level-info .log-level {
    color: var(--edu-info-500);
  }

  .log-level-warn .log-level {
    color: var(--edu-warning-500);
  }

  .log-level-error .log-level {
    color: var(--edu-danger-500);
  }

  .logs-empty {
    text-align: center;
    color: var(--edu-text-disabled);
    padding: 40px 0;
    font-style: italic;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .lab-runner {
    gap: 16px;
  }

  .lab-controls {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .control-left,
  .control-right {
    justify-content: center;
  }

  .lab-content .jupyter-lab,
  .lab-content .ai-lab,
  .lab-content .simulation-lab {
    height: 400px;
  }

  .log-item {
    flex-direction: column;
    gap: 4px;
  }

  .log-time,
  .log-level {
    min-width: auto;
  }
}
</style>