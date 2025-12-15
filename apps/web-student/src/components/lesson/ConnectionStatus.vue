<template>
  <div class="connection-status" :class="statusClass">
    <el-icon>
      <component :is="statusIcon" />
    </el-icon>
    <div class="status-content">
      <span class="status-text">{{ statusText }}</span>
      <small v-if="detailText" class="status-detail">{{ detailText }}</small>
    </div>
    <el-button
      v-if="showRetry && canRetry"
      link
      size="small"
      type="primary"
      @click="$emit('retry')"
    >
      重试
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CircleCheck, Loading, CircleClose, RefreshRight, WarningFilled } from '@element-plus/icons-vue'
import type { ConnectionStatus } from '@shared-utils/websocket/types'

type LocalStatus = ConnectionStatus | 'idle'

interface Props {
  status: LocalStatus
  reconnectAttempts?: number
  lastError?: string | null
  showRetry?: boolean
}

const props = defineProps<Props>()

defineEmits<{ (e: 'retry'): void }>()

const statusMap: Record<LocalStatus, { text: string; icon: any; class: string }> = {
  connected: { text: '已连接', icon: CircleCheck, class: 'connected' },
  connecting: { text: '连接中…', icon: Loading, class: 'connecting' },
  disconnected: { text: '已断开', icon: CircleClose, class: 'disconnected' },
  reconnecting: { text: '重新连接…', icon: RefreshRight, class: 'reconnecting' },
  error: { text: '连接异常', icon: WarningFilled, class: 'error' },
  idle: { text: '未连接', icon: WarningFilled, class: 'idle' }
}

const statusText = computed(() => statusMap[props.status]?.text || '未知状态')
const statusIcon = computed(() => statusMap[props.status]?.icon || WarningFilled)
const statusClass = computed(() => statusMap[props.status]?.class || 'idle')

const detailText = computed(() => {
  if (props.status === 'reconnecting') {
    return `第 ${props.reconnectAttempts || 0} 次尝试`
  }
  if (props.status === 'error' && props.lastError) {
    return props.lastError
  }
  return ''
})

const canRetry = computed(() => ['disconnected', 'error', 'idle'].includes(props.status))
</script>

<style scoped lang="scss">
.connection-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(226, 232, 240, 0.8);

  &.connected {
    color: #0f766e;
    border-color: rgba(16, 185, 129, 0.4);
  }

  &.connecting,
  &.reconnecting {
    color: #92400e;
    border-color: rgba(251, 191, 36, 0.4);
  }

  &.disconnected,
  &.error,
  &.idle {
    color: #b91c1c;
    border-color: rgba(248, 113, 113, 0.4);
  }

  .status-content {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
  }

  .status-detail {
    font-size: 12px;
    color: rgba(15, 23, 42, 0.7);
  }
}
</style>
