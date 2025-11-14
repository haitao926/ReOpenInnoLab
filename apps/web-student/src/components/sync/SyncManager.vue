<template>
  <div class="sync-manager">
    <!-- 同步状态指示器 -->
    <div class="sync-indicator" :class="statusClass">
      <el-icon v-if="syncStatus.isSyncing" class="is-spinning">
        <Loading />
      </el-icon>
      <el-icon v-else-if="syncStatus.hasErrors">
        <Warning />
      </el-icon>
      <el-icon v-else-if="syncStatus.pendingCount > 0">
        <CloudUpload />
      </el-icon>
      <el-icon v-else>
        <Check />
      </el-icon>

      <span class="sync-text">{{ statusText }}</span>

      <el-button
        v-if="syncStatus.pendingCount > 0 && !syncStatus.isSyncing"
        type="primary"
        size="small"
        @click="startSync"
        :loading="syncStatus.isSyncing"
      >
        立即同步
      </el-button>
    </div>

    <!-- 同步详情弹窗 -->
    <el-dialog
      v-model="showDetails"
      title="数据同步详情"
      width="600px"
    >
      <div class="sync-details">
        <!-- 同步状态概览 -->
        <div class="sync-overview">
          <div class="overview-item">
            <span class="label">网络状态:</span>
            <el-tag :type="syncStatus.isOnline ? 'success' : 'danger'">
              {{ syncStatus.isOnline ? '在线' : '离线' }}
            </el-tag>
          </div>
          <div class="overview-item">
            <span class="label">待同步项目:</span>
            <el-tag :type="syncStatus.pendingCount > 0 ? 'warning' : 'success'">
              {{ syncStatus.pendingCount }} 项
            </el-tag>
          </div>
          <div class="overview-item">
            <span class="label">上次同步:</span>
            <span class="value">{{ formatTime(syncStatus.lastSyncTime) }}</span>
          </div>
        </div>

        <!-- 同步历史 -->
        <div class="sync-history" v-if="syncHistory.length > 0">
          <h4>同步历史</h4>
          <el-timeline>
            <el-timeline-item
              v-for="(record, index) in syncHistory"
              :key="index"
              :timestamp="formatTime(record.timestamp)"
              :type="getTimelineType(record)"
            >
              <div class="sync-record">
                <div class="record-summary">
                  {{ record.summary }}
                </div>
                <div class="record-details" v-if="record.details">
                  成功: {{ record.details.success }},
                  失败: {{ record.details.failed }}
                </div>
                <div class="record-errors" v-if="record.details?.errors?.length > 0">
                  <el-alert
                    v-for="(error, idx) in record.details.errors.slice(0, 3)"
                    :key="idx"
                    :title="error.error"
                    type="error"
                    :closable="false"
                    size="small"
                  />
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>

        <!-- 手动操作 -->
        <div class="sync-actions">
          <el-button
            type="primary"
            @click="startSync"
            :loading="syncStatus.isSyncing"
            :disabled="!syncStatus.isOnline || syncStatus.pendingCount === 0"
          >
            <el-icon><Refresh /></el-icon>
            立即同步
          </el-button>

          <el-button
            type="info"
            @click="refreshStatus"
            :loading="refreshing"
          >
            <el-icon><Refresh /></el-icon>
            刷新状态
          </el-button>

          <el-button
            type="warning"
            @click="cleanupSyncedData"
            :disabled="syncStatus.isSyncing"
          >
            <el-icon><Delete /></el-icon>
            清理已同步数据
          </el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 同步进度提示 -->
    <el-snackbar
      v-model="showSyncProgress"
      :duration="0"
      v-if="syncStatus.isSyncing"
    >
      <template #content>
        <div class="sync-progress-content">
          <el-icon class="is-spinning"><Loading /></el-icon>
          <span>正在同步数据...</span>
        </div>
      </template>
    </el-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import {
  Loading,
  Warning,
  CloudUpload,
  Check,
  Refresh,
  Delete
} from '@element-plus/icons-vue'
import { useOfflineData } from '@/services/persistence/offline-data.service'

// 离线数据服务
const offlineData = useOfflineData()

// 响应式数据
const showDetails = ref(false)
const refreshing = ref(false)
const showSyncProgress = ref(false)

// 同步状态
const syncStatus = ref({
  isOnline: navigator.onLine,
  isSyncing: false,
  hasErrors: false,
  pendingCount: 0,
  lastSyncTime: null as string | null
})

// 同步历史
const syncHistory = ref<Array<{
  timestamp: string
  summary: string
  details?: {
    success: number
    failed: number
    errors: Array<{ item: any; error: string }>
  }
}>>([])

// 计算属性
const statusClass = computed(() => {
  if (syncStatus.value.isSyncing) return 'syncing'
  if (syncStatus.value.hasErrors) return 'error'
  if (syncStatus.value.pendingCount > 0) return 'pending'
  return 'synced'
})

const statusText = computed(() => {
  if (syncStatus.value.isSyncing) return '正在同步...'
  if (syncStatus.value.hasErrors) return '同步失败'
  if (syncStatus.value.pendingCount > 0) return `待同步 ${syncStatus.value.pendingCount} 项`
  return '已同步'
})

// 方法
const updateSyncStatus = async () => {
  try {
    const status = await offlineData.getSyncStatus()
    syncStatus.value = {
      ...syncStatus.value,
      ...status,
      isSyncing: false // 更新状态时停止同步状态
    }
  } catch (error) {
    console.error('获取同步状态失败:', error)
  }
}

const startSync = async () => {
  if (!syncStatus.value.isOnline) {
    ElMessage.warning('网络连接不可用，无法同步数据')
    return
  }

  if (syncStatus.value.pendingCount === 0) {
    ElMessage.info('没有需要同步的数据')
    return
  }

  syncStatus.value.isSyncing = true
  showSyncProgress.value = true

  try {
    ElNotification.info({
      title: '开始同步',
      message: '正在同步离线数据到服务器...',
      duration: 2000
    })

    const result = await offlineData.syncAllData()

    // 记录同步时间
    await offlineData.recordSyncTime()

    // 添加到同步历史
    syncHistory.value.unshift({
      timestamp: new Date().toISOString(),
      summary: result.failed === 0
        ? `成功同步 ${result.success} 项数据`
        : `同步完成: 成功 ${result.success} 项，失败 ${result.failed} 项`,
      details: result
    })

    // 限制历史记录数量
    if (syncHistory.value.length > 10) {
      syncHistory.value = syncHistory.value.slice(0, 10)
    }

    // 更新状态
    await updateSyncStatus()

    // 显示结果
    if (result.failed === 0) {
      ElNotification.success({
        title: '同步成功',
        message: `成功同步 ${result.success} 项数据`,
        duration: 3000
      })
    } else {
      ElNotification.warning({
        title: '同步部分失败',
        message: `成功 ${result.success} 项，失败 ${result.failed} 项`,
        duration: 5000
      })
    }

  } catch (error) {
    console.error('同步失败:', error)
    syncStatus.value.hasErrors = true

    ElNotification.error({
      title: '同步失败',
      message: '数据同步过程中发生错误，请稍后重试',
      duration: 5000
    })
  } finally {
    syncStatus.value.isSyncing = false
    showSyncProgress.value = false
  }
}

const refreshStatus = async () => {
  refreshing.value = true
  try {
    await updateSyncStatus()
    ElMessage.success('状态已更新')
  } catch (error) {
    ElMessage.error('更新状态失败')
  } finally {
    refreshing.value = false
  }
}

const cleanupSyncedData = async () => {
  try {
    await offlineData.cleanupSyncedData()
    await updateSyncStatus()
    ElMessage.success('已清理同步完成的数据')
  } catch (error) {
    ElMessage.error('清理数据失败')
  }
}

const formatTime = (timeString: string | null) => {
  if (!timeString) return '从未'

  const time = new Date(timeString)
  const now = new Date()
  const diff = now.getTime() - time.getTime()

  if (diff < 60 * 1000) {
    return '刚刚'
  } else if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))} 分钟前`
  } else if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))} 小时前`
  } else {
    return time.toLocaleDateString()
  }
}

const getTimelineType = (record: any) => {
  if (record.details?.failed > 0) return 'warning'
  if (record.details?.success > 0) return 'success'
  return 'info'
}

// 网络状态监听
const handleOnline = () => {
  syncStatus.value.isOnline = true
  ElMessage.success('网络连接已恢复')
}

const handleOffline = () => {
  syncStatus.value.isOnline = false
  ElMessage.warning('网络连接已断开')
}

// 生命周期
onMounted(async () => {
  // 初始化状态
  await updateSyncStatus()

  // 添加网络状态监听
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // 定期更新状态
  const statusInterval = setInterval(updateSyncStatus, 30000) // 30秒更新一次

  // 组件卸载时清理
  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
    clearInterval(statusInterval)
  })
})
</script>

<style scoped>
.sync-manager {
  display: inline-block;
}

.sync-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.sync-indicator.synced {
  background-color: var(--el-color-success-light-9);
  color: var(--el-color-success);
}

.sync-indicator.pending {
  background-color: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
}

.sync-indicator.syncing {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.sync-indicator.error {
  background-color: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

.sync-text {
  font-weight: 500;
}

.sync-details {
  .sync-overview {
    margin-bottom: 20px;
    padding: 16px;
    background-color: var(--el-fill-color-light);
    border-radius: 6px;
  }

  .overview-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .overview-item:last-child {
    margin-bottom: 0;
  }

  .label {
    font-weight: 500;
    color: var(--el-text-color-regular);
  }

  .value {
    color: var(--el-text-color-primary);
  }
}

.sync-history {
  margin-bottom: 20px;
}

.sync-history h4 {
  margin-bottom: 12px;
  color: var(--el-text-color-primary);
}

.sync-record {
  .record-summary {
    font-weight: 500;
    margin-bottom: 4px;
  }

  .record-details {
    font-size: 12px;
    color: var(--el-text-color-regular);
    margin-bottom: 4px;
  }

  .record-errors {
    margin-top: 8px;
  }

  .record-errors .el-alert {
    margin-bottom: 4px;
  }

  .record-errors .el-alert:last-child {
    margin-bottom: 0;
  }
}

.sync-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-light);
}

.sync-progress-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.is-spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>