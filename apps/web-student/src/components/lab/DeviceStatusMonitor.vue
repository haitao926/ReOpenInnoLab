<template>
  <div class="device-status-monitor">
    <div class="monitor-header">
      <h4>设备状态</h4>
    </div>

    <div class="status-content">
      <!-- CPU 使用率 -->
      <div class="status-item">
        <div class="status-label">CPU</div>
        <div class="status-value">
          <EduProgress
            :percentage="deviceMetrics.cpu"
            size="sm"
            :show-text="false"
            :stroke-color="getCpuColor()"
          />
          <span class="percentage">{{ deviceMetrics.cpu }}%</span>
        </div>
      </div>

      <!-- 内存使用 -->
      <div class="status-item">
        <div class="status-label">内存</div>
        <div class="status-value">
          <EduProgress
            :percentage="deviceMetrics.memory"
            size="sm"
            :show-text="false"
            :stroke-color="getMemoryColor()"
          />
          <span class="percentage">{{ deviceMetrics.memory }}%</span>
        </div>
      </div>

      <!-- 网络状态 -->
      <div class="status-item">
        <div class="status-label">网络</div>
        <div class="status-value">
          <div class="network-indicator" :class="networkStatus">
            <el-icon><component :is="getNetworkIcon()" /></el-icon>
            <span>{{ getNetworkText() }}</span>
          </div>
        </div>
      </div>

      <!-- 实验代理状态 -->
      <div class="status-item">
        <div class="status-label">实验代理</div>
        <div class="status-value">
          <EduTag
            :variant="getAgentVariant()"
            size="xs"
          >
            {{ getAgentText() }}
          </EduTag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Connection,
  WarningFilled,
  CircleCheckFilled,
  Loading
} from '@element-plus/icons-vue'

import EduProgress from '@reopeninnolab/ui-kit'
import EduTag from '@reopeninnolab/ui-kit'

interface DeviceMetrics {
  cpu: number
  memory: number
  uptime: number
}

const deviceMetrics = ref<DeviceMetrics>({
  cpu: 15,
  memory: 45,
  uptime: 0
})

const networkStatus = ref<'good' | 'poor' | 'offline'>('good')
const agentStatus = ref<'online' | 'offline' | 'connecting'>('online')

let updateInterval: number | null = null

// 计算属性
const getCpuColor = (): string => {
  const cpu = deviceMetrics.value.cpu
  if (cpu < 50) return 'var(--edu-success-500)'
  if (cpu < 80) return 'var(--edu-warning-500)'
  return 'var(--edu-danger-500)'
}

const getMemoryColor = (): string => {
  const memory = deviceMetrics.value.memory
  if (memory < 70) return 'var(--edu-success-500)'
  if (memory < 85) return 'var(--edu-warning-500)'
  return 'var(--edu-danger-500)'
}

const getNetworkIcon = () => {
  switch (networkStatus.value) {
    case 'good':
      return Connection
    case 'poor':
      return WarningFilled
    case 'offline':
      return Connection
    default:
      return Connection
  }
}

const getNetworkText = (): string => {
  switch (networkStatus.value) {
    case 'good':
      return '良好'
    case 'poor':
      return '较差'
    case 'offline':
      return '离线'
    default:
      return '未知'
  }
}

const getAgentVariant = (): 'primary' | 'success' | 'warning' | 'info' | 'danger' | 'default' => {
  switch (agentStatus.value) {
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

const getAgentText = (): string => {
  switch (agentStatus.value) {
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

// 方法
const updateMetrics = () => {
  // 模拟设备指标变化
  deviceMetrics.value.cpu = Math.floor(Math.random() * 30) + 10
  deviceMetrics.value.memory = Math.floor(Math.random() * 40) + 30
  deviceMetrics.value.uptime += 1

  // 模拟网络状态变化
  const rand = Math.random()
  if (rand > 0.95) {
    networkStatus.value = 'poor'
  } else {
    networkStatus.value = 'good'
  }
}

const checkAgentStatus = () => {
  // 模拟检查代理状态
  const rand = Math.random()
  if (rand > 0.9) {
    agentStatus.value = 'offline'
  } else {
    agentStatus.value = 'online'
  }
}

// 生命周期
onMounted(() => {
  // 开始定时更新
  updateInterval = window.setInterval(() => {
    updateMetrics()
    checkAgentStatus()
  }, 5000)
})

onUnmounted(() => {
  // 清理定时器
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>

<style scoped lang="scss">
.device-status-monitor {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(14px);
  overflow: hidden;
}

.monitor-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(99, 102, 241, 0.04) 100%);
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.monitor-header h4 {
  font-size: 16px;
  font-weight: 700;
  color: var(--edu-text-primary);
  margin: 0;
}

.status-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.status-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--edu-text-secondary);
  min-width: 60px;
}

.status-value {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.percentage {
  font-size: 12px;
  color: var(--edu-text-secondary);
  font-weight: 500;
  min-width: 32px;
  text-align: right;
}

.network-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--edu-text-secondary);

  &.good {
    color: var(--edu-success-600);
  }

  &.poor {
    color: var(--edu-warning-600);
  }

  &.offline {
    color: var(--edu-danger-600);
  }

  .el-icon {
    font-size: 14px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .monitor-header {
    padding: 12px 16px;
  }

  .status-content {
    padding: 16px;
    gap: 12px;
  }

  .status-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .status-value {
    width: 100%;
  }
}
</style>