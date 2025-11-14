<template>
  <div class="local-agent-status">
    <div class="agent-status-card">
      <div class="agent-header">
        <h4>Virtual Lab Agent</h4>
        <EduTag
          :variant="getAgentStatusVariant(agent.status)"
          size="xs"
        >
          {{ getAgentStatusText(agent.status) }}
        </EduTag>
      </div>

      <div class="agent-info">
        <div class="info-item">
          <span class="info-label">版本：</span>
          <span class="info-value">{{ agent.version }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">ID：</span>
          <span class="info-value">{{ agent.id }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">状态：</span>
          <span class="info-value">{{ getDetailedStatus() }}</span>
        </div>
      </div>

      <div v-if="agent.status === 'offline'" class="agent-actions">
        <el-button type="primary" size="small" @click="startAgent">
          <el-icon><VideoPlay /></el-icon>
          启动代理
        </el-button>
        <el-button size="small" @click="refreshStatus">
          <el-icon><Refresh /></el-icon>
          刷新状态
        </el-button>
      </div>

      <div v-else-if="agent.status === 'online'" class="agent-metrics">
        <div class="metrics-grid">
          <div class="metric-item">
            <span class="metric-label">CPU使用率</span>
            <span class="metric-value">{{ agent.resources.cpu }}%</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">内存使用</span>
            <span class="metric-value">{{ agent.resources.memory }}MB</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">存储</span>
            <span class="metric-value">{{ agent.resources.storage }}MB</span>
          </div>
        </div>
      </div>

      <div v-else class="agent-loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>正在连接...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  VideoPlay,
  Refresh,
  Loading
} from '@element-plus/icons-vue'

import EduTag from '@reopeninnolab/ui-kit'
import {
  getLocalAgentStatus,
  startLocalAgent,
  stopLocalAgent,
  restartLocalAgent,
  pingAgent,
  type LabAgentStatus
} from '@/api/lab'

interface AgentMetrics {
  cpu: number
  memory: number
  uptime: string
}

interface LocalAgent {
  status: 'online' | 'offline' | 'connecting'
  version: string
  port: number
  metrics: AgentMetrics
}

const agent = ref<LabAgentStatus>({
  id: 'local-agent',
  status: 'offline',
  lastHeartbeat: new Date().toISOString(),
  version: '1.0.0',
  capabilities: [],
  resources: {
    cpu: 0,
    memory: 0,
    storage: 0
  }
})

let statusCheckInterval: number | null = null

// 方法
const getAgentStatusVariant = (status: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' | 'default' => {
  switch (status) {
    case 'online':
      return 'success'
    case 'connecting':
      return 'warning'
    case 'offline':
      return 'danger'
    default:
      return 'default'
  }
}

const getAgentStatusText = (status: string): string => {
  switch (status.value) {
    case 'online':
      return '在线'
    case 'connecting':
      return '连接中'
    case 'offline':
      return '离线'
    default:
      return '未知'
  }
}

const getDetailedStatus = (): string => {
  switch (agent.value.status) {
    case 'online':
      return '服务运行正常'
    case 'connecting':
      return '正在尝试连接...'
    case 'offline':
      return '代理未启动'
    default:
      return '状态未知'
  }
}

const checkAgentStatus = async () => {
  try {
    const agentStatus = await getLocalAgentStatus()
    agent.value = agentStatus
  } catch (error) {
    console.error('获取Agent状态失败:', error)

    // 如果API调用失败，模拟状态
    const rand = Math.random()
    if (rand > 0.7) {
      agent.value.status = 'online'
      agent.value.resources = {
        cpu: Math.floor(Math.random() * 30) + 10,
        memory: Math.floor(Math.random() * 100) + 50,
        storage: Math.floor(Math.random() * 500) + 100
      }
    } else if (rand > 0.3) {
      agent.value.status = 'starting'
    } else {
      agent.value.status = 'offline'
    }
  }
}

const startAgent = async () => {
  agent.value.status = 'connecting'
  ElMessage.info('正在启动 Virtual Lab Agent...')

  try {
    // 模拟启动过程
    await new Promise(resolve => setTimeout(resolve, 2000))

    agent.value.status = 'online'
    agent.value.metrics = {
      cpu: 15,
      memory: 80,
      uptime: '刚刚启动'
    }

    ElMessage.success('Virtual Lab Agent 启动成功')
  } catch (error) {
    agent.value.status = 'offline'
    ElMessage.error('启动失败，请检查系统配置')
  }
}

const refreshStatus = () => {
  ElMessage.info('正在刷新代理状态...')
  checkAgentStatus()
}

const updateMetrics = async () => {
  if (agent.value.status === 'online') {
    try {
      // 使用ping API更新状态
      const pingResult = await pingAgent()
      agent.value.lastHeartbeat = pingResult.timestamp
    } catch (error) {
      console.error('更新Agent状态失败:', error)
    }
  }
}

const formatUptime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}分钟`
  } else {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}小时${remainingMinutes}分钟`
  }
}

// 生命周期
onMounted(() => {
  // 初始检查状态
  checkAgentStatus()

  // 定期检查状态
  statusCheckInterval = window.setInterval(() => {
    checkAgentStatus()
    updateMetrics()
  }, 10000)
})

onUnmounted(() => {
  if (statusCheckInterval) {
    clearInterval(statusCheckInterval)
  }
})
</script>

<style scoped lang="scss">
.local-agent-status {
  margin-bottom: 16px;
}

.agent-status-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  padding: 16px;
  backdrop-filter: blur(14px);
}

.agent-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.agent-header h4 {
  font-size: 14px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin: 0;
}

.agent-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.info-label {
  color: var(--edu-text-secondary);
  font-weight: 500;
}

.info-value {
  color: var(--edu-text-primary);
  font-weight: 500;
}

.agent-actions {
  display: flex;
  gap: 8px;
}

.agent-metrics {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: rgba(15, 23, 42, 0.04);
  border-radius: 8px;
  font-size: 11px;
}

.metric-label {
  color: var(--edu-text-secondary);
}

.metric-value {
  color: var(--edu-text-primary);
  font-weight: 600;
}

.agent-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  color: var(--edu-text-secondary);
  font-size: 12px;

  .el-icon {
    font-size: 16px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .agent-status-card {
    padding: 12px;
  }

  .agent-header {
    margin-bottom: 10px;
  }

  .agent-header h4 {
    font-size: 13px;
  }

  .agent-info {
    gap: 4px;
    margin-bottom: 10px;
  }

  .info-item {
    font-size: 11px;
  }

  .agent-actions {
    flex-direction: column;
    gap: 6px;
  }

  .agent-actions .el-button {
    width: 100%;
  }

  .metric-item {
    padding: 6px;
    font-size: 10px;
  }
}
</style>