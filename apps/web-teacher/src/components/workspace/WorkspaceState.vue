<template>
  <div class="workspace-state" :class="stateClasses">
    <!-- 加载状态 -->
    <div v-if="loading" class="workspace-state__loading">
      <div class="loading-container">
        <el-icon class="loading-icon" :class="{ 'loading-icon--spinning': true }">
          <Loading />
        </el-icon>
        <p class="loading-text">{{ loadingText }}</p>
        <p v-if="loadingSubtext" class="loading-subtext">{{ loadingSubtext }}</p>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="empty" class="workspace-state__empty">
      <div class="empty-container">
        <el-icon class="empty-icon">
          <component :is="emptyIcon" />
        </el-icon>
        <h3 v-if="emptyTitle" class="empty-title">{{ emptyTitle }}</h3>
        <p v-if="emptyDescription" class="empty-description">{{ emptyDescription }}</p>

        <!-- 操作按钮 -->
        <div v-if="emptyActions && emptyActions.length > 0" class="empty-actions">
          <el-button
            v-for="action in emptyActions"
            :key="action.key"
            :type="action.type || 'primary'"
            :size="action.size || 'default'"
            :icon="action.icon"
            :loading="action.loading"
            :disabled="action.disabled"
            @click="handleActionClick(action)"
          >
            {{ action.label }}
          </el-button>
        </div>

        <!-- 快速链接 -->
        <div v-if="quickLinks && quickLinks.length > 0" class="quick-links">
          <span class="quick-links__label">快速链接：</span>
          <div class="quick-links__list">
            <a
              v-for="link in quickLinks"
              :key="link.key"
              :href="link.url"
              class="quick-link"
              @click="handleLinkClick(link)"
            >
              <el-icon v-if="link.icon">
                <component :is="link.icon" />
              </el-icon>
              {{ link.label }}
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="workspace-state__error">
      <div class="error-container">
        <el-icon class="error-icon">
          <WarningFilled />
        </el-icon>
        <h3 v-if="errorTitle" class="error-title">{{ errorTitle }}</h3>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

        <!-- 错误详情 -->
        <el-collapse v-if="errorDetails && errorDetails.length > 0" class="error-details">
          <el-collapse-item title="查看详细信息" name="details">
            <div class="error-details__content">
              <div v-for="(detail, index) in errorDetails" :key="index" class="error-detail">
                <strong>{{ detail.label }}:</strong>
                <span>{{ detail.value }}</span>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>

        <!-- 错误操作 -->
        <div class="error-actions">
          <el-button
            v-if="showRetry"
            type="primary"
            :icon="Refresh"
            :loading="retrying"
            @click="handleRetry"
          >
            {{ retryText }}
          </el-button>
          <el-button
            v-if="showRefresh"
            :icon="RefreshRight"
            @click="handleRefresh"
          >
            刷新页面
          </el-button>
          <el-button
            v-if="showFeedback"
            :icon="ChatLineSquare"
            @click="handleFeedback"
          >
            问题反馈
          </el-button>
        </div>
      </div>
    </div>

    <!-- 网络异常状态 -->
    <div v-else-if="networkError" class="workspace-state__network">
      <div class="network-container">
        <el-icon class="network-icon">
          <Connection />
        </el-icon>
        <h3 class="network-title">网络连接异常</h3>
        <p class="network-message">请检查您的网络连接，然后重试</p>
        <div class="network-actions">
          <el-button type="primary" :icon="Refresh" :loading="retrying" @click="handleRetry">
            重新连接
          </el-button>
          <el-button :icon="Setting" @click="handleNetworkSettings">
            网络设置
          </el-button>
        </div>
      </div>
    </div>

    <!-- 权限不足状态 -->
    <div v-else-if="noPermission" class="workspace-state__permission">
      <div class="permission-container">
        <el-icon class="permission-icon">
          <Lock />
        </el-icon>
        <h3 class="permission-title">权限不足</h3>
        <p v-if="permissionMessage" class="permission-message">{{ permissionMessage }}</p>
        <div v-else class="permission-message">
          您没有访问此内容的权限，请联系管理员获取相应权限
        </div>
        <div class="permission-actions">
          <el-button type="primary" @click="handleRequestPermission">
            申请权限
          </el-button>
          <el-button @click="handleBack">
            返回上页
          </el-button>
        </div>
      </div>
    </div>

    <!-- 维护中状态 -->
    <div v-else-if="maintenance" class="workspace-state__maintenance">
      <div class="maintenance-container">
        <el-icon class="maintenance-icon">
          <Tools />
        </el-icon>
        <h3 class="maintenance-title">系统维护中</h3>
        <p class="maintenance-message">
          {{ maintenanceMessage || '系统正在维护升级中，预计很快恢复，请稍后再试' }}
        </p>
        <div v-if="maintenanceEndTime" class="maintenance-time">
          <span class="time-label">预计恢复时间：</span>
          <span class="time-value">{{ maintenanceEndTime }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Loading,
  DocumentAdd,
  FolderOpened,
  Search,
  WarningFilled,
  Refresh,
  RefreshRight,
  ChatLineSquare,
  Connection,
  Setting,
  Lock,
  Tools,
  DataBoard,
  Box,
  Picture,
  Calendar,
  User
} from '@element-plus/icons-vue'

interface EmptyAction {
  key: string
  label: string
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'text'
  size?: 'large' | 'default' | 'small'
  icon?: any
  loading?: boolean
  disabled?: boolean
  handler: () => void | Promise<void>
}

interface QuickLink {
  key: string
  label: string
  url?: string
  icon?: any
  handler?: () => void
}

interface ErrorDetail {
  label: string
  value: string
}

interface Props {
  // 状态控制
  loading?: boolean
  empty?: boolean
  error?: boolean
  networkError?: boolean
  noPermission?: boolean
  maintenance?: boolean

  // 加载状态配置
  loadingText?: string
  loadingSubtext?: string

  // 空状态配置
  emptyType?: 'data' | 'search' | 'filter' | 'create' | 'upload' | 'custom'
  emptyTitle?: string
  emptyDescription?: string
  emptyActions?: EmptyAction[]
  quickLinks?: QuickLink[]

  // 错误状态配置
  errorTitle?: string
  errorMessage?: string
  errorDetails?: ErrorDetail[]
  showRetry?: boolean
  showRefresh?: boolean
  showFeedback?: boolean
  retryText?: string

  // 权限状态配置
  permissionMessage?: string

  // 维护状态配置
  maintenanceMessage?: string
  maintenanceEndTime?: string

  // 通用配置
  retrying?: boolean
  size?: 'small' | 'default' | 'large'
  minHeight?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  empty: false,
  error: false,
  networkError: false,
  noPermission: false,
  maintenance: false,
  loadingText: '正在加载...',
  emptyType: 'data',
  showRetry: true,
  showRefresh: true,
  showFeedback: false,
  retryText: '重试',
  retrying: false,
  size: 'default',
  minHeight: 300
})

const emit = defineEmits<{
  retry: []
  refresh: []
  feedback: []
  requestPermission: []
  back: []
  networkSettings: []
  actionClick: [action: EmptyAction]
  linkClick: [link: QuickLink]
}>()

const stateClasses = computed(() => [
  `workspace-state--${props.size}`,
  {
    'workspace-state--loading': props.loading,
    'workspace-state--empty': props.empty,
    'workspace-state--error': props.error,
    'workspace-state--network': props.networkError,
    'workspace-state--permission': props.noPermission,
    'workspace-state--maintenance': props.maintenance
  }
])

const emptyIcon = computed(() => {
  switch (props.emptyType) {
    case 'search':
      return Search
    case 'filter':
      return DataBoard
    case 'create':
      return DocumentAdd
    case 'upload':
      return Box
    default:
      return FolderOpened
  }
})

const emptyTitle = computed(() => {
  if (props.emptyTitle) return props.emptyTitle

  switch (props.emptyType) {
    case 'search':
      return '未找到相关内容'
    case 'filter':
      return '没有符合筛选条件的内容'
    case 'create':
      return '创建您的第一个项目'
    case 'upload':
      return '上传您的第一个文件'
    default:
      return '暂无数据'
  }
})

const emptyDescription = computed(() => {
  if (props.emptyDescription) return props.emptyDescription

  switch (props.emptyType) {
    case 'search':
      return '请尝试使用不同的关键词进行搜索'
    case 'filter':
      return '请尝试调整筛选条件或重置筛选器'
    case 'create':
      return '开始创建您的第一个项目，开启协作之旅'
    case 'upload':
      return '选择文件开始上传，支持多种文件格式'
    default:
      return '这里还没有任何内容，稍后再来看看吧'
  }
})

const handleActionClick = async (action: EmptyAction) => {
  try {
    await action.handler()
    emit('actionClick', action)
  } catch (error) {
    console.error('Action failed:', error)
  }
}

const handleLinkClick = (link: QuickLink) => {
  if (link.handler) {
    link.handler()
  }
  emit('linkClick', link)
}

const handleRetry = () => {
  emit('retry')
}

const handleRefresh = () => {
  window.location.reload()
}

const handleFeedback = () => {
  emit('feedback')
}

const handleRequestPermission = () => {
  emit('requestPermission')
}

const handleBack = () => {
  emit('back')
}

const handleNetworkSettings = () => {
  emit('networkSettings')
}
</script>

<style lang="scss" scoped>
.workspace-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: v-bind('props.minHeight + "px"');
  padding: var(--spacing-2x);
  text-align: center;

  &--small {
    min-height: 200px;
    padding: var(--spacing-base);
  }

  &--large {
    min-height: 400px;
    padding: var(--spacing-3x);
  }
}

.loading-container,
.empty-container,
.error-container,
.network-container,
.permission-container,
.maintenance-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-base);
  max-width: 400px;
}

// 加载状态样式
.workspace-state__loading {
  .loading-icon {
    font-size: 48px;
    color: var(--edu-primary);

    &--spinning {
      animation: spin 1s linear infinite;
    }
  }

  .loading-text {
    margin: 0;
    font-size: var(--font-size-lg);
    color: var(--text-primary);
    font-weight: var(--font-weight-medium);
  }

  .loading-subtext {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }
}

// 空状态样式
.workspace-state__empty {
  .empty-icon {
    font-size: 64px;
    color: var(--text-tertiary);
    opacity: 0.6;
  }

  .empty-title {
    margin: 0;
    font-size: var(--font-size-xl);
    color: var(--text-primary);
    font-weight: var(--font-weight-semibold);
  }

  .empty-description {
    margin: 0;
    font-size: var(--font-size-base);
    color: var(--text-secondary);
    line-height: var(--line-height-relaxed);
  }

  .empty-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
    justify-content: center;
    margin-top: var(--spacing-base);
  }

  .quick-links {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-base);

    &__label {
      font-size: var(--font-size-sm);
      color: var(--text-tertiary);
    }

    &__list {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-base);
      justify-content: center;
    }
  }

  .quick-link {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    color: var(--edu-primary);
    text-decoration: none;
    font-size: var(--font-size-sm);
    transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

    &:hover {
      color: var(--edu-primary-dark);
      text-decoration: underline;
    }

    .el-icon {
      font-size: 14px;
    }
  }
}

// 错误状态样式
.workspace-state__error {
  .error-icon {
    font-size: 48px;
    color: var(--edu-danger);
  }

  .error-title {
    margin: 0;
    font-size: var(--font-size-xl);
    color: var(--text-primary);
    font-weight: var(--font-weight-semibold);
  }

  .error-message {
    margin: 0;
    font-size: var(--font-size-base);
    color: var(--text-secondary);
    line-height: var(--line-height-relaxed);
  }

  .error-details {
    width: 100%;
    margin-top: var(--spacing-sm);
  }

  .error-details__content {
    text-align: left;
  }

  .error-detail {
    display: flex;
    margin-bottom: var(--spacing-xs);
    font-size: var(--font-size-sm);

    strong {
      color: var(--text-secondary);
      min-width: 80px;
      margin-right: var(--spacing-sm);
    }

    span {
      color: var(--text-primary);
      font-family: monospace;
      word-break: break-all;
    }
  }

  .error-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
    justify-content: center;
    margin-top: var(--spacing-base);
  }
}

// 网络异常状态样式
.workspace-state__network {
  .network-icon {
    font-size: 48px;
    color: var(--edu-warning);
  }

  .network-title {
    margin: 0;
    font-size: var(--font-size-xl);
    color: var(--text-primary);
    font-weight: var(--font-weight-semibold);
  }

  .network-message {
    margin: 0;
    font-size: var(--font-size-base);
    color: var(--text-secondary);
    line-height: var(--line-height-relaxed);
  }

  .network-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
    justify-content: center;
    margin-top: var(--spacing-base);
  }
}

// 权限不足状态样式
.workspace-state__permission {
  .permission-icon {
    font-size: 48px;
    color: var(--edu-warning);
  }

  .permission-title {
    margin: 0;
    font-size: var(--font-size-xl);
    color: var(--text-primary);
    font-weight: var(--font-weight-semibold);
  }

  .permission-message {
    margin: 0;
    font-size: var(--font-size-base);
    color: var(--text-secondary);
    line-height: var(--line-height-relaxed);
    text-align: center;
  }

  .permission-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
    justify-content: center;
    margin-top: var(--spacing-base);
  }
}

// 维护中状态样式
.workspace-state__maintenance {
  .maintenance-icon {
    font-size: 48px;
    color: var(--edu-info);
  }

  .maintenance-title {
    margin: 0;
    font-size: var(--font-size-xl);
    color: var(--text-primary);
    font-weight: var(--font-weight-semibold);
  }

  .maintenance-message {
    margin: 0;
    font-size: var(--font-size-base);
    color: var(--text-secondary);
    line-height: var(--line-height-relaxed);
  }

  .maintenance-time {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-size-sm);
    color: var(--text-tertiary);

    .time-label {
      font-weight: var(--font-weight-medium);
    }

    .time-value {
      color: var(--edu-primary);
      font-weight: var(--font-weight-semibold);
    }
  }
}

// 动画
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 响应式适配
@media (max-width: 768px) {
  .workspace-state {
    min-height: 250px;
    padding: var(--spacing-base);
  }

  .loading-container,
  .empty-container,
  .error-container,
  .network-container,
  .permission-container,
  .maintenance-container {
    max-width: 100%;
  }

  .empty-icon,
  .error-icon,
  .network-icon,
  .permission-icon,
  .maintenance-icon {
    font-size: 48px;
  }

  .empty-actions,
  .error-actions,
  .network-actions,
  .permission-actions {
    flex-direction: column;
    width: 100%;
    max-width: 200px;
  }

  .quick-links__list {
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);
  }
}

// 深色模式适配
[data-theme="dark"] {
  .workspace-state__empty {
    .empty-icon {
      color: var(--text-tertiary);
      opacity: 0.4;
    }
  }
}
</style>