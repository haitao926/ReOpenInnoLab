<template>
  <div class="lab-status-monitor">
    <!-- 实验状态卡片 -->
    <div class="status-card">
      <div class="card-header">
        <h4>实验状态</h4>
        <el-tag
          :type="getStatusVariant(currentSession?.status)"
          size="small"
        >
          {{ getStatusText(currentSession?.status) }}
        </el-tag>
      </div>

      <div class="status-content">
        <!-- 实验信息 -->
        <div v-if="currentSession" class="lab-info">
          <div class="info-item">
            <span class="label">会话ID:</span>
            <span class="value">{{ currentSession.id }}</span>
          </div>
          <div class="info-item">
            <span class="label">开始时间:</span>
            <span class="value">{{ formatTime(currentSession.startTime) }}</span>
          </div>
          <div v-if="currentSession.endTime" class="info-item">
            <span class="label">结束时间:</span>
            <span class="value">{{ formatTime(currentSession.endTime) }}</span>
          </div>
          <div v-if="currentSession.url" class="info-item">
            <span class="label">访问地址:</span>
            <el-button size="small" type="primary" link @click="openLabUrl">
              打开实验环境
            </el-button>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-status">
          <el-empty description="暂无活动实验" />
        </div>
      </div>
    </div>

    <!-- 资源使用情况 -->
    <div v-if="currentSession" class="resource-card">
      <div class="card-header">
        <h4>资源使用</h4>
        <el-button
          size="small"
          @click="refreshResourceUsage"
          :loading="refreshing"
        >
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>

      <div class="resource-content">
        <div class="resource-item">
          <div class="resource-header">
            <span class="resource-name">CPU</span>
            <span class="resource-value">{{ resourceUsage.cpu }}%</span>
          </div>
          <el-progress
            :percentage="resourceUsage.cpu"
            :color="getResourceColor(resourceUsage.cpu)"
            :show-text="false"
            :stroke-width="6"
          />
        </div>

        <div class="resource-item">
          <div class="resource-header">
            <span class="resource-name">内存</span>
            <span class="resource-value">{{ formatMemory(resourceUsage.memory) }}</span>
          </div>
          <el-progress
            :percentage="getMemoryPercentage(resourceUsage.memory)"
            :color="getResourceColor(getMemoryPercentage(resourceUsage.memory))"
            :show-text="false"
            :stroke-width="6"
          />
        </div>

        <div class="resource-item">
          <div class="resource-header">
            <span class="resource-name">磁盘</span>
            <span class="resource-value">{{ formatStorage(resourceUsage.disk) }}</span>
          </div>
          <el-progress
            :percentage="resourceUsage.disk"
            :color="getResourceColor(resourceUsage.disk)"
            :show-text="false"
            :stroke-width="6"
          />
        </div>

        <div v-if="resourceUsage.network !== undefined" class="resource-item">
          <div class="resource-header">
            <span class="resource-name">网络</span>
            <span class="resource-value">{{ formatNetwork(resourceUsage.network) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Agent状态 -->
    <div class="agent-card">
      <div class="card-header">
        <h4>实验代理</h4>
        <el-tag
          :type="agentStatus?.status === 'online' ? 'success' : 'danger'"
          size="small"
        >
          <el-icon>
            <component :is="agentStatus?.status === 'online' ? 'CircleCheck' : 'CircleClose'" />
          </el-icon>
          {{ agentStatus?.status === 'online' ? '在线' : '离线' }}
        </el-tag>
      </div>

      <div class="agent-content">
        <div v-if="agentStatus" class="agent-info">
          <div class="info-item">
            <span class="label">版本:</span>
            <span class="value">{{ agentStatus.version || '未知' }}</span>
          </div>
          <div class="info-item">
            <span class="label">最后心跳:</span>
            <span class="value">{{ formatTime(agentStatus.lastHeartbeat) }}</span>
          </div>
          <div v-if="agentStatus.capabilities" class="info-item">
            <span class="label">支持功能:</span>
            <div class="capabilities">
              <el-tag
                v-for="cap in agentStatus.capabilities"
                :key="cap"
                size="small"
                type="info"
              >
                {{ cap }}
              </el-tag>
            </div>
          </div>
        </div>

        <div v-else class="empty-agent">
          <el-empty description="Agent未连接" />
        </div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div v-if="currentSession" class="actions-card">
      <div class="card-header">
        <h4>快捷操作</h4>
      </div>

      <div class="actions-content">
        <div class="action-buttons">
          <el-button
            v-if="currentSession.status === 'running'"
            type="warning"
            size="small"
            @click="restartSession"
            :loading="actionLoading.restart"
          >
            <el-icon><RefreshRight /></el-icon>
            重启实验
          </el-button>

          <el-button
            v-if="currentSession.status === 'running'"
            type="danger"
            size="small"
            @click="stopSession"
            :loading="actionLoading.stop"
          >
            <el-icon><Close /></el-icon>
            停止实验
          </el-button>

          <el-button
            size="small"
            @click="viewLogs"
          >
            <el-icon><Document /></el-icon>
            查看日志
          </el-button>

          <el-button
            size="small"
            @click="exportData"
          >
            <el-icon><Download /></el-icon>
            导出数据
          </el-button>
        </div>
      </div>
    </div>

    <!-- 实时日志 -->
    <div v-if="currentSession" class="logs-card">
      <div class="card-header">
        <h4>实时日志</h4>
        <div class="logs-controls">
          <el-button size="small" @click="toggleAutoScroll">
            <el-icon>
              <component :is="autoScroll ? 'Bottom' : 'ArrowDown'" />
            </el-icon>
            {{ autoScroll ? '停止' : '开始' }}滚动
          </el-button>
          <el-button size="small" @click="clearLogs">
            <el-icon><Delete /></el-icon>
            清空
          </el-button>
        </div>
      </div>

      <div class="logs-content" ref="logsContainer">
        <div
          v-for="log in recentLogs"
          :key="log.timestamp.getTime()"
          class="log-item"
          :class="`log-level-${log.level}`"
        >
          <span class="log-time">{{ formatLogTime(log.timestamp) }}</span>
          <span class="log-level">{{ log.level.toUpperCase() }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>

        <div v-if="recentLogs.length === 0" class="logs-empty">
          暂无日志信息
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh,
  CircleCheck,
  CircleClose,
  RefreshRight,
  Close,
  Document,
  Download,
  Bottom,
  ArrowDown,
  Delete
} from '@element-plus/icons-vue'

import { useLabStore } from '@/stores/lab'
import type { LabSession, LabResourceUsage } from '@/types/course'

const labStore = useLabStore()

// 响应式数据
const refreshing = ref(false)
const autoScroll = ref(true)
const logsContainer = ref<HTMLElement>()
const actionLoading = ref({
  restart: false,
  stop: false
})

// 计算属性
const currentSession = computed(() => labStore.currentSession)
const resourceUsage = computed(() => labStore.resourceUsage)
const agentStatus = computed(() => labStore.agentStatus)
const recentLogs = computed(() => labStore.recentLogs)

// 方法
const getStatusVariant = (status?: string) => {
  switch (status) {
    case 'running':
      return 'success'
    case 'initializing':
      return 'warning'
    case 'stopped':
      return 'info'
    case 'error':
      return 'danger'
    default:
      return 'default'
  }
}

const getStatusText = (status?: string) => {
  switch (status) {
    case 'running':
      return '运行中'
    case 'initializing':
      return '初始化中'
    case 'stopped':
      return '已停止'
    case 'error':
      return '错误'
    default:
      return '未知'
  }
}

const formatTime = (date?: Date): string => {
  if (!date) return '-'
  return date.toLocaleString('zh-CN')
}

const formatMemory = (bytes: number): string => {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`
  return `${Math.round(bytes / (1024 * 1024))}MB`
}

const formatStorage = (bytes: number): string => {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`
  return `${Math.round(bytes / (1024 * 1024))}MB`
}

const formatNetwork = (bytes: number): string => {
  if (bytes < 1024) return `${bytes}B/s`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB/s`
  return `${Math.round(bytes / (1024 * 1024))}MB/s`
}

const getMemoryPercentage = (bytes: number): number => {
  // 假设最大内存为4GB
  const maxMemory = 4 * 1024 * 1024 * 1024
  return Math.round((bytes / maxMemory) * 100)
}

const getResourceColor = (percentage: number): string => {
  if (percentage < 50) return '#67c23a'
  if (percentage < 80) return '#e6a23c'
  return '#f56c6c'
}

const formatLogTime = (date: Date): string => {
  return date.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 操作方法
const openLabUrl = () => {
  if (currentSession.value?.url) {
    window.open(currentSession.value.url, '_blank')
  }
}

const refreshResourceUsage = async () => {
  if (!currentSession.value) return

  refreshing.value = true
  try {
    // 模拟刷新资源使用情况
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 更新资源使用情况（模拟数据）
    const newUsage: LabResourceUsage = {
      cpu: Math.round(Math.random() * 80),
      memory: Math.round(Math.random() * 2 * 1024 * 1024 * 1024), // 0-2GB
      disk: Math.round(Math.random() * 10), // 0-10GB
      network: Math.round(Math.random() * 1024 * 1024) // 0-1MB/s
    }

    labStore.updateResourceUsage(currentSession.value.id, newUsage)
    ElMessage.success('资源使用情况已更新')

  } catch (error) {
    ElMessage.error('刷新失败')
  } finally {
    refreshing.value = false
  }
}

const restartSession = async () => {
  if (!currentSession.value) return

  try {
    await ElMessageBox.confirm('确定要重启实验环境吗？', '重启确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    actionLoading.value.restart = true

    const success = await labStore.restartSession(currentSession.value.id)

    if (success) {
      ElMessage.success('实验环境重启成功')
    } else {
      ElMessage.error('重启失败')
    }

  } catch {
    // 用户取消
  } finally {
    actionLoading.value.restart = false
  }
}

const stopSession = async () => {
  if (!currentSession.value) return

  try {
    await ElMessageBox.confirm('确定要停止实验环境吗？', '停止确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    actionLoading.value.stop = true

    const success = await labStore.stopSession(currentSession.value.id)

    if (success) {
      ElMessage.success('实验环境已停止')
    } else {
      ElMessage.error('停止失败')
    }

  } catch {
    // 用户取消
  } finally {
    actionLoading.value.stop = false
  }
}

const viewLogs = () => {
  if (!currentSession.value) return

  // 可以打开一个详细的日志窗口
  ElMessage.info('打开详细日志窗口')
}

const exportData = () => {
  if (!currentSession.value) return

  try {
    const exportData = {
      session: currentSession.value,
      resourceUsage: resourceUsage.value,
      logs: recentLogs.value,
      timestamp: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `lab-data-${currentSession.value.id}.json`
    link.click()
    URL.revokeObjectURL(url)

    ElMessage.success('数据导出成功')

  } catch (error) {
    ElMessage.error('数据导出失败')
  }
}

const toggleAutoScroll = () => {
  autoScroll.value = !autoScroll.value
}

const clearLogs = () => {
  if (!currentSession.value) return

  labStore.clearLogs(currentSession.value.id)
  ElMessage.success('日志已清空')
}

const scrollToBottom = () => {
  if (autoScroll.value && logsContainer.value) {
    nextTick(() => {
      logsContainer.value!.scrollTop = logsContainer.value!.scrollHeight
    })
  }
}

// 监听日志变化，自动滚动到底部
watch(recentLogs, () => {
  scrollToBottom()
}, { deep: true })

// 生命周期
onMounted(() => {
  // 初始化时滚动到底部
  scrollToBottom()
})

onUnmounted(() => {
  // 清理资源
})
</script>

<style scoped lang="scss">
.lab-status-monitor {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: var(--edu-bg-color);
  border-radius: 12px;
}

.status-card,
.resource-card,
.agent-card,
.actions-card,
.logs-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  border: 1px solid var(--edu-border-color);
  overflow: hidden;
  backdrop-filter: blur(8px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(15, 23, 42, 0.04);
  border-bottom: 1px solid var(--edu-border-color);

  h4 {
    font-size: 16px;
    font-weight: 600;
    color: var(--edu-text-primary);
    margin: 0;
  }
}

.status-content,
.resource-content,
.agent-content,
.actions-content {
  padding: 20px;
}

.lab-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);

  &:last-child {
    border-bottom: none;
  }

  .label {
    color: var(--edu-text-secondary);
    font-size: 14px;
  }

  .value {
    color: var(--edu-text-primary);
    font-weight: 500;
    font-size: 14px;
  }
}

.capabilities {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.empty-status,
.empty-agent {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  color: var(--edu-text-secondary);
}

.resource-item {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}

.resource-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.resource-name {
  color: var(--edu-text-primary);
  font-weight: 500;
  font-size: 14px;
}

.resource-value {
  color: var(--edu-primary-600);
  font-weight: 600;
  font-size: 14px;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.logs-controls {
  display: flex;
  gap: 8px;
}

.logs-content {
  max-height: 300px;
  overflow-y: auto;
  padding: 16px 20px;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  background: rgba(15, 23, 42, 0.02);
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

// 响应式设计
@media (max-width: 768px) {
  .lab-status-monitor {
    padding: 12px;
    gap: 12px;
  }

  .card-header {
    padding: 12px 16px;
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .status-content,
  .resource-content,
  .agent-content,
  .actions-content {
    padding: 16px;
  }

  .action-buttons {
    flex-direction: column;
    gap: 8px;
  }

  .action-buttons .el-button {
    width: 100%;
  }

  .logs-content {
    max-height: 200px;
    padding: 12px 16px;
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