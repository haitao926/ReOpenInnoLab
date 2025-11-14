<template>
  <div class="global-status">
    <!-- 全局加载状态 -->
    <transition name="loading-fade">
      <div
        v-if="globalLoading.loading"
        class="global-loading"
        :class="{ 'with-progress': config.enableProgress }"
      >
        <div class="loading-backdrop" @click="handleLoadingBackdropClick">
          <div class="loading-content" @click.stop>
            <div class="loading-icon">
              <el-icon class="loading-spinner">
                <Loading />
              </el-icon>
            </div>
            <div class="loading-info">
              <div class="loading-message">{{ globalLoading.message || '加载中...' }}</div>
              <div v-if="config.enableProgress" class="loading-progress">
                <el-progress
                  :percentage="globalLoading.progress"
                  :show-text="false"
                  :stroke-width="3"
                />
                <span class="progress-text">{{ globalLoading.progress }}%</span>
              </div>
            </div>
            <div class="loading-actions">
              <el-button
                v-if="hasCancelableTasks"
                text
                type="info"
                size="small"
                @click="cancelAllTasks"
              >
                取消全部
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 错误通知容器 -->
    <div class="error-notifications">
      <transition-group name="error-slide" tag="div">
        <div
          v-for="error in recentErrors"
          :key="error.id"
          class="error-notification"
          :class="`error-${error.severity}`"
          @click="showErrorDetails(error.id)"
        >
          <div class="error-icon">
            <component :is="getErrorIcon(error.type)" />
          </div>
          <div class="error-content">
            <div class="error-title">{{ error.title }}</div>
            <div class="error-message">{{ error.message }}</div>
          </div>
          <div class="error-actions">
            <el-button
              v-if="error.retryAction && !error.resolved"
              text
              type="primary"
              size="small"
              @click.stop="retryError(error.id)"
            >
              重试
            </el-button>
            <el-button
              text
              type="info"
              size="small"
              @click.stop="dismissError(error.id)"
            >
              关闭
            </el-button>
          </div>
        </div>
      </transition-group>
    </div>

    <!-- 任务列表浮窗 -->
    <transition name="tasks-fade">
      <div
        v-if="showTasksPanel"
        class="tasks-panel"
        @click="handleTasksBackdropClick"
      >
        <div class="tasks-content" @click.stop>
          <div class="tasks-header">
            <h3>任务管理</h3>
            <div class="tasks-stats">
              <el-tag type="primary" size="small">
                运行中: {{ runningTasks.length }}
              </el-tag>
              <el-tag type="success" size="small">
                已完成: {{ completedTasksCount }}
              </el-tag>
              <el-tag type="danger" size="small">
                失败: {{ failedTasks.length }}
              </el-tag>
            </div>
            <el-button
              text
              type="info"
              size="small"
              @click="toggleTasksPanel"
            >
              <el-icon><Close /></el-icon>
            </el-button>
          </div>

          <div class="tasks-list">
            <div v-if="tasks.length === 0" class="tasks-empty">
              <el-empty description="暂无任务" />
            </div>

            <div
              v-for="task in tasks"
              :key="task.id"
              class="task-item"
              :class="`task-${task.status}`"
            >
              <div class="task-icon">
                <el-icon v-if="task.status === 'running'" class="task-running">
                  <Loading />
                </el-icon>
                <el-icon v-else-if="task.status === 'completed'" class="task-completed">
                  <CircleCheck />
                </el-icon>
                <el-icon v-else-if="task.status === 'failed'" class="task-failed">
                  <CircleClose />
                </el-icon>
                <el-icon v-else-if="task.status === 'cancelled'" class="task-cancelled">
                  <Close />
                </el-icon>
                <el-icon v-else class="task-pending">
                  <Clock />
                </el-icon>
              </div>

              <div class="task-content">
                <div class="task-name">{{ task.name }}</div>
                <div v-if="task.description" class="task-description">
                  {{ task.description }}
                </div>
                <div v-if="task.status === 'running' && config.enableProgress" class="task-progress">
                  <el-progress
                    :percentage="task.progress"
                    :show-text="false"
                    :stroke-width="4"
                  />
                  <span class="progress-text">{{ task.progress }}%</span>
                </div>
                <div v-if="task.error" class="task-error">
                  {{ task.error }}
                </div>
              </div>

              <div class="task-actions">
                <el-button
                  v-if="task.status === 'running' && task.cancelable"
                  text
                  type="warning"
                  size="small"
                  @click="cancelTask(task.id)"
                >
                  取消
                </el-button>
                <el-button
                  v-if="task.status === 'failed' && task.retryable"
                  text
                  type="primary"
                  size="small"
                  @click="retryTask(task.id)"
                >
                  重试
                </el-button>
                <el-button
                  text
                  type="info"
                  size="small"
                  @click="removeTask(task.id)"
                >
                  移除
                </el-button>
              </div>
            </div>
          </div>

          <div class="tasks-footer">
            <el-button text type="info" size="small" @click="clearCompletedTasks">
              清除已完成
            </el-button>
            <el-button text type="danger" size="small" @click="clearAllTasks">
              清除全部
            </el-button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 状态指示器 -->
    <div class="status-indicators">
      <!-- 错误计数器 -->
      <el-badge
        v-if="errorCount > 0"
        :value="errorCount"
        :max="99"
        type="danger"
        class="status-badge"
      >
        <el-button
          :icon="Warning"
          circle
          type="danger"
          size="small"
          @click="showErrorsPanel"
          class="status-button"
        />
      </el-badge>

      <!-- 任务计数器 -->
      <el-badge
        v-if="runningTasks.length > 0"
        :value="runningTasks.length"
        :max="9"
        type="primary"
        class="status-badge"
      >
        <el-button
          :icon="Loading"
          circle
          type="primary"
          size="small"
          @click="toggleTasksPanel"
          class="status-button task-indicator"
        />
      </el-badge>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Loading, Close, Warning, CircleCheck, CircleClose, Clock,
  InfoFilled, WarningFilled, Connection, Setting
} from '@element-plus/icons-vue'
import { useErrorHandler } from '@/services/error/error-handler.service'
import { useLoadingManager } from '@/services/loading/loading-manager.service'
import type { LoadingTask } from '@/services/loading/loading-manager.service'
import type { AppError, ErrorType } from '@/services/error/error-handler.service'

// 使用错误和加载管理器
const errorHandler = useErrorHandler()
const loadingManager = useLoadingManager()

// 组件状态
const showTasksPanel = ref(false)
const config = ref({
  enableProgress: true,
  showErrors: true,
  showLoadingOverlay: true
})

// 计算属性
const errors = computed(() => errorHandler.errors)
const unresolvedErrors = computed(() => Array.isArray(errorHandler.unresolvedErrors) ? errorHandler.unresolvedErrors : [])
const errorCount = computed(() => unresolvedErrors.value.length)
const recentErrors = computed(() => Array.isArray(unresolvedErrors.value) ? unresolvedErrors.value.slice(0, 5) : [])

const tasks = computed(() => loadingManager.tasks)
const runningTasks = computed(() => loadingManager.runningTasks)
const failedTasks = computed(() => loadingManager.failedTasks)
const globalLoading = computed(() => loadingManager.globalLoading)

const hasCancelableTasks = computed(() =>
  runningTasks.value.some(task => task.cancelable)
)

const completedTasksCount = computed(() =>
  tasks.value.filter(task => task.status === 'completed').length
)

// 方法
const getErrorIcon = (type: ErrorType) => {
  const iconMap = {
    network: Connection,
    api: Warning,
    validation: InfoFilled,
    permission: WarningFilled,
    system: Setting,
    user: InfoFilled,
    timeout: Clock,
    offline: Connection
  }
  return iconMap[type] || Warning
}

const handleLoadingBackdropClick = () => {
  // 点击背景时的处理，可以配置是否允许关闭
  if (runningTasks.value.every(task => task.cancelable)) {
    cancelAllTasks()
  }
}

const handleTasksBackdropClick = () => {
  toggleTasksPanel()
}

const toggleTasksPanel = () => {
  showTasksPanel.value = !showTasksPanel.value
}

const showErrorsPanel = () => {
  // 可以扩展显示错误详情面板
  if (recentErrors.value.length > 0) {
    showErrorDetails(recentErrors.value[0].id)
  }
}

const showErrorDetails = (id: string) => {
  errorHandler.showErrorDetails(id)
}

const retryError = async (id: string) => {
  const error = errors.value.find(e => e.id === id)
  if (error?.retryAction) {
    try {
      await error.retryAction()
      errorHandler.resolveError(id)
      ElMessage.success('重试成功')
    } catch {
      ElMessage.error('重试失败')
    }
  }
}

const dismissError = (id: string) => {
  errorHandler.removeError(id)
}

const cancelTask = async (id: string) => {
  loadingManager.cancelTask(id)
}

const retryTask = async (id: string) => {
  try {
    await loadingManager.retryTask(id)
    ElMessage.success('任务已重新开始')
  } catch (error) {
    ElMessage.error('重试失败')
  }
}

const removeTask = (id: string) => {
  loadingManager.removeTask(id)
}

const cancelAllTasks = () => {
  ElMessageBox.confirm('确定要取消所有可取消的任务吗？', '确认操作', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    runningTasks.value.forEach(task => {
      if (task.cancelable) {
        cancelTask(task.id)
      }
    })
    ElMessage.success('已取消所有任务')
  }).catch(() => {
    // 用户取消
  })
}

const clearCompletedTasks = () => {
  loadingManager.clearCompletedTasks()
  ElMessage.success('已清除完成的任务')
}

const clearAllTasks = () => {
  ElMessageBox.confirm('确定要清除所有任务吗？', '确认操作', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    loadingManager.clearAllTasks()
    ElMessage.success('已清除所有任务')
    showTasksPanel.value = false
  }).catch(() => {
    // 用户取消
  })
}

const showErrorsManagement = () => {
  ElMessageBox.confirm(
    `当前有 ${errorCount.value} 个未解决错误，是否查看详情？`,
    '错误提醒',
    {
      confirmButtonText: '查看详情',
      cancelButtonText: '稍后处理',
      type: 'warning'
    }
  ).then(() => {
    if (recentErrors.value.length > 0) {
      showErrorDetails(recentErrors.value[0].id)
    }
  }).catch(() => {
    // 用户选择稍后处理
  })
}

// 键盘快捷键
const handleKeydown = (e: KeyboardEvent) => {
  // Ctrl/Cmd + Shift + T 显示任务面板
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
    e.preventDefault()
    toggleTasksPanel()
  }

  // Ctrl/Cmd + Shift + E 显示错误面板
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
    e.preventDefault()
    if (errorCount.value > 0) {
      showErrorsManagement()
    }
  }

  // ESC 关闭面板
  if (e.key === 'Escape') {
    if (showTasksPanel.value) {
      showTasksPanel.value = false
    }
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)

  // 监听配置变化
  const loadingConfig = loadingManager.getConfig()
  config.value.enableProgress = loadingConfig.enableProgress
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped lang="scss">
.global-status {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 9999;
}

// 全局加载状态
.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: auto;
  z-index: 9999;

  &.with-progress {
    .loading-content {
      min-width: 320px;
    }
  }
}

.loading-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-content {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  min-width: 200px;
  text-align: center;
}

.loading-icon {
  .loading-spinner {
    font-size: 48px;
    color: var(--edu-primary-500);
    animation: spin 1s linear infinite;
  }
}

.loading-info {
  .loading-message {
    font-size: 16px;
    font-weight: 600;
    color: var(--edu-text-primary);
    margin-bottom: 8px;
  }

  .loading-progress {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 200px;

    .progress-text {
      font-size: 12px;
      color: var(--edu-text-secondary);
      min-width: 40px;
      text-align: right;
    }
  }
}

// 错误通知
.error-notifications {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 1000;
  pointer-events: auto;
  max-width: 400px;
}

.error-notification {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 4px solid;

  &:hover {
    transform: translateX(-4px);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
  }

  &.error-critical {
    border-left-color: var(--edu-danger-500);
  }

  &.error-high {
    border-left-color: var(--edu-warning-500);
  }

  &.error-medium {
    border-left-color: var(--edu-info-500);
  }

  &.error-low {
    border-left-color: var(--edu-success-500);
  }
}

.error-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .el-icon {
    font-size: 18px;
  }
}

.error-content {
  flex: 1;
  min-width: 0;

  .error-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--edu-text-primary);
    margin-bottom: 4px;
  }

  .error-message {
    font-size: 12px;
    color: var(--edu-text-secondary);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.error-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}

// 任务面板
.tasks-panel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: auto;
  z-index: 9998;
}

.tasks-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
}

.tasks-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tasks-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid var(--edu-border-color);

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--edu-text-primary);
  }

  .tasks-stats {
    display: flex;
    gap: 8px;
  }
}

.tasks-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.tasks-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
}

.task-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: var(--edu-bg-color);
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(99, 102, 241, 0.08);
  }

  &.task-running {
    border-left: 3px solid var(--edu-primary-500);
  }

  &.task-completed {
    border-left: 3px solid var(--edu-success-500);
  }

  &.task-failed {
    border-left: 3px solid var(--edu-danger-500);
  }

  &.task-cancelled {
    border-left: 3px solid var(--edu-text-tertiary);
  }
}

.task-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .task-running {
    color: var(--edu-primary-500);
    animation: spin 1s linear infinite;
  }

  .task-completed {
    color: var(--edu-success-500);
  }

  .task-failed {
    color: var(--edu-danger-500);
  }

  .task-cancelled {
    color: var(--edu-text-tertiary);
  }

  .task-pending {
    color: var(--edu-text-secondary);
  }
}

.task-content {
  flex: 1;
  min-width: 0;

  .task-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--edu-text-primary);
    margin-bottom: 4px;
  }

  .task-description {
    font-size: 12px;
    color: var(--edu-text-secondary);
    margin-bottom: 8px;
  }

  .task-progress {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;

    .progress-text {
      font-size: 11px;
      color: var(--edu-text-secondary);
      min-width: 32px;
    }
  }

  .task-error {
    font-size: 11px;
    color: var(--edu-danger-600);
    background: rgba(239, 68, 68, 0.1);
    padding: 4px 8px;
    border-radius: 4px;
  }
}

.task-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}

.tasks-footer {
  display: flex;
  justify-content: space-between;
  padding: 16px 20px;
  border-top: 1px solid var(--edu-border-color);
  background: var(--edu-bg-color);
}

// 状态指示器
.status-indicators {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: auto;
  z-index: 1000;
}

.status-badge {
  :deep(.el-badge__content) {
    font-size: 10px;
  }
}

.status-button {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  }

  &.task-indicator {
    :deep(.el-icon) {
      animation: pulse 2s infinite;
    }
  }
}

// 动画
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.loading-fade-enter-active,
.loading-fade-leave-active {
  transition: opacity 0.3s ease;
}

.loading-fade-enter-from,
.loading-fade-leave-to {
  opacity: 0;
}

.error-slide-enter-active,
.error-slide-leave-active {
  transition: all 0.3s ease;
}

.error-slide-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.error-slide-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.tasks-fade-enter-active,
.tasks-fade-leave-active {
  transition: opacity 0.3s ease;
}

.tasks-fade-enter-from,
.tasks-fade-leave-to {
  opacity: 0;
}

// 响应式设计
@media (max-width: 768px) {
  .error-notifications {
    right: 12px;
    left: 12px;
    max-width: none;
  }

  .error-notification {
    padding: 12px;
  }

  .tasks-content {
    width: 95%;
    max-height: 90vh;
  }

  .status-indicators {
    bottom: 16px;
    right: 16px;
  }

  .loading-content {
    padding: 24px;
    min-width: 280px;
  }
}
</style>