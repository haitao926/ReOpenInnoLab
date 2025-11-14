<template>
  <div class="unified-layout" :class="layoutClasses">
    <!-- 顶部区域 -->
    <header v-if="showHeader" class="layout-header">
      <div class="header-content">
        <div class="header-left">
          <!-- 面包屑导航 -->
          <nav v-if="showBreadcrumb" class="breadcrumb-nav">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item
                v-for="item in breadcrumbItems"
                :key="item.path"
                :to="item.path ? { path: item.path } : undefined"
              >
                {{ item.title }}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </nav>

          <!-- 页面标题 -->
          <div v-if="title" class="page-title">
            <h1>{{ title }}</h1>
            <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>
          </div>
        </div>

        <div class="header-right">
          <!-- 页面操作按钮 -->
          <div v-if="pageActions.length > 0" class="page-actions">
            <el-button
              v-for="action in pageActions"
              :key="action.id"
              :type="action.type || 'default'"
              :size="action.size || 'default'"
              :icon="action.icon"
              :loading="action.loading"
              :disabled="action.disabled"
              @click="action.handler"
            >
              {{ action.label }}
            </el-button>
          </div>

          <!-- 页面状态指示器 -->
          <div v-if="showStatus" class="page-status">
            <el-tag
              :type="statusType"
              :size="statusSize"
              :effect="statusEffect"
            >
              {{ statusText }}
            </el-tag>
          </div>
        </div>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="layout-main" :class="mainClasses">
      <!-- 加载状态 -->
      <div v-if="loading" class="layout-loading">
        <el-loading-service :loading="true" />
        <div class="loading-text">
          <p>{{ loadingText }}</p>
          <el-progress
            v-if="showLoadingProgress"
            :percentage="loadingProgress"
            :show-text="false"
          />
        </div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="layout-error">
        <el-result
          :icon="errorIcon"
          :title="errorTitle"
          :sub-title="errorMessage"
        >
          <template #extra>
            <el-button
              v-if="showRetry"
              type="primary"
              @click="handleRetry"
              :loading="retrying"
            >
              {{ retryText }}
            </el-button>
            <el-button
              v-if="showBack"
              @click="handleBack"
            >
              {{ backText }}
            </el-button>
          </template>
        </el-result>
      </div>

      <!-- 空状态 -->
      <div v-else-if="empty" class="layout-empty">
        <el-empty
          :image="emptyImage"
          :image-size="emptyImageSize"
          :description="emptyDescription"
        >
          <template #extra>
            <el-button
              v-if="emptyAction"
              type="primary"
              @click="emptyAction.handler"
              :icon="emptyAction.icon"
            >
              {{ emptyAction.label }}
            </el-button>
          </template>
        </el-empty>
      </div>

      <!-- 正常内容 -->
      <div v-else class="layout-content">
        <slot />
      </div>
    </main>

    <!-- 底部区域 -->
    <footer v-if="showFooter" class="layout-footer">
      <div class="footer-content">
        <div class="footer-left">
          <slot name="footer-left">
            <p class="footer-text">© 2024 ReOpenInnoLab. All rights reserved.</p>
          </slot>
        </div>
        <div class="footer-right">
          <slot name="footer-right" />
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Component } from 'vue'

// Props
interface Props {
  // 布局控制
  variant?: 'default' | 'compact' | 'spacious' | 'full-width'
  padding?: 'none' | 'small' | 'medium' | 'large'
  maxWidth?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

  // 头部控制
  showHeader?: boolean
  showBreadcrumb?: boolean
  title?: string
  subtitle?: string

  // 页面操作
  pageActions?: Array<{
    id: string
    label: string
    type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'
    size?: 'large' | 'default' | 'small'
    icon?: Component
    loading?: boolean
    disabled?: boolean
    handler: () => void
  }>

  // 状态显示
  showStatus?: boolean
  statusType?: 'success' | 'warning' | 'danger' | 'info'
  statusSize?: 'large' | 'default' | 'small'
  statusEffect?: 'dark' | 'light' | 'plain'
  statusText?: string

  // 面包屑
  breadcrumbItems?: Array<{
    title: string
    path?: string
  }>

  // 加载状态
  loading?: boolean
  loadingText?: string
  showLoadingProgress?: boolean
  loadingProgress?: number

  // 错误状态
  error?: boolean
  errorType?: 'error' | 'warning' | 'info'
  errorTitle?: string
  errorMessage?: string
  showRetry?: boolean
  showBack?: boolean
  retryText?: string
  backText?: string
  onRetry?: () => void
  onBack?: () => void

  // 空状态
  empty?: boolean
  emptyImage?: string
  emptyImageSize?: number
  emptyDescription?: string
  emptyAction?: {
    label: string
    icon?: Component
    handler: () => void
  }

  // 底部控制
  showFooter?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  padding: 'medium',
  maxWidth: 'xl',
  showHeader: true,
  showBreadcrumb: false,
  showStatus: false,
  statusType: 'info',
  statusSize: 'default',
  statusEffect: 'plain',
  loading: false,
  loadingText: '加载中...',
  showLoadingProgress: false,
  loadingProgress: 0,
  error: false,
  errorType: 'error',
  errorTitle: '出错了',
  errorMessage: '页面加载失败，请稍后重试',
  showRetry: true,
  showBack: true,
  retryText: '重试',
  backText: '返回',
  empty: false,
  emptyImageSize: 120,
  emptyDescription: '暂无数据',
  showFooter: false
})

// 响应式数据
const router = useRouter()
const retrying = ref(false)

// 计算属性
const layoutClasses = computed(() => [
  `unified-layout--${props.variant}`,
  `unified-layout--padding-${props.padding}`,
  `unified-layout--max-width-${props.maxWidth}`
])

const mainClasses = computed(() => [
  props.loading ? 'layout-main--loading' : '',
  props.error ? 'layout-main--error' : '',
  props.empty ? 'layout-main--empty' : ''
])

const errorIcon = computed(() => {
  const iconMap = {
    error: 'error',
    warning: 'warning',
    info: 'info'
  }
  return iconMap[props.errorType] || 'error'
})

// 方法
const handleRetry = async () => {
  if (!props.onRetry) return

  retrying.value = true
  try {
    await props.onRetry()
  } finally {
    retrying.value = false
  }
}

const handleBack = () => {
  if (props.onBack) {
    props.onBack()
  } else {
    router.back()
  }
}
</script>

<style scoped lang="scss">
.unified-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;

  // 变体样式
  &--compact {
    .layout-header {
      padding: 12px 0;
    }

    .layout-main {
      padding: 16px 0;
    }
  }

  &--spacious {
    .layout-header {
      padding: 32px 0;
    }

    .layout-main {
      padding: 32px 0;
    }
  }

  &--full-width {
    .layout-content {
      max-width: none;
    }
  }

  // 内边距样式
  &--padding-none {
    .layout-header,
    .layout-main {
      padding: 0;
    }
  }

  &--padding-small {
    .layout-header {
      padding: 8px 0;
    }

    .layout-main {
      padding: 12px 0;
    }
  }

  &--padding-medium {
    .layout-header {
      padding: 16px 0;
    }

    .layout-main {
      padding: 20px 0;
    }
  }

  &--padding-large {
    .layout-header {
      padding: 24px 0;
    }

    .layout-main {
      padding: 32px 0;
    }
  }

  // 最大宽度样式
  &--max-width-sm .layout-content {
    max-width: 640px;
  }

  &--max-width-md .layout-content {
    max-width: 768px;
  }

  &--max-width-lg .layout-content {
    max-width: 1024px;
  }

  &--max-width-xl .layout-content {
    max-width: 1280px;
  }

  &--max-width-2xl .layout-content {
    max-width: 1536px;
  }
}

.layout-header {
  border-bottom: 1px solid var(--edu-border-color);
  background: white;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-content {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.header-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.breadcrumb-nav {
  font-size: 14px;
}

.page-title {
  h1 {
    font-size: 24px;
    font-weight: 600;
    color: var(--edu-text-primary);
    margin: 0;
    line-height: 1.2;
  }

  .page-subtitle {
    font-size: 14px;
    color: var(--edu-text-secondary);
    margin: 4px 0 0 0;
    line-height: 1.4;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.page-actions {
  display: flex;
  gap: 8px;
}

.layout-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.layout-content {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 20px;
  width: 100%;
}

.layout-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;

  .loading-text {
    margin-top: 16px;

    p {
      margin: 0 0 12px 0;
      color: var(--edu-text-secondary);
    }

    .el-progress {
      width: 200px;
    }
  }
}

.layout-error,
.layout-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.layout-footer {
  border-top: 1px solid var(--edu-border-color);
  background: var(--edu-background-light);
  margin-top: auto;
}

.footer-content {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .footer-text {
    margin: 0;
    font-size: 12px;
    color: var(--edu-text-disabled);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-right {
    width: 100%;
    justify-content: space-between;
  }

  .page-actions {
    flex-wrap: wrap;
  }

  .page-title h1 {
    font-size: 20px;
  }

  .footer-content {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }

  .layout-content {
    padding: 0 16px;
  }
}

@media (max-width: 480px) {
  .header-content {
    padding: 0 16px;
  }

  .page-actions {
    width: 100%;
    justify-content: center;
  }

  .layout-content {
    padding: 0 12px;
  }
}
</style>