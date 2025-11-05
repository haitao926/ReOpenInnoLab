<template>
  <div class="error-boundary">
    <slot v-if="!hasError" />

    <!-- 错误页面 -->
    <div v-else class="error-fallback">
      <div class="error-content">
        <div class="error-icon">
          <el-icon size="64" color="#f56c6c">
            <WarningFilled />
          </el-icon>
        </div>

        <h2 class="error-title">出现了意外错误</h2>
        <p class="error-message">
          {{ errorMessage || '抱歉，应用程序遇到了一个意外错误。请刷新页面重试。' }}
        </p>

        <div class="error-actions">
          <el-button type="primary" @click="handleRefresh">
            <el-icon><Refresh /></el-icon>
            刷新页面
          </el-button>
          <el-button @click="handleGoHome">
            <el-icon><House /></el-icon>
            返回首页
          </el-button>
          <el-button
            v-if="showDetails"
            type="link"
            @click="toggleErrorDetails"
          >
            {{ showErrorDetails ? '隐藏' : '显示' }}错误详情
          </el-button>
        </div>

        <!-- 错误详情 -->
        <el-collapse-transition>
          <div v-if="showErrorDetails && errorDetails" class="error-details">
            <el-card>
              <template #header>
                <span>错误详情</span>
              </template>
              <pre class="error-stack">{{ errorDetails }}</pre>
            </el-card>
          </div>
        </el-collapse-transition>

        <!-- 问题反馈 -->
        <div class="error-feedback">
          <p class="feedback-text">如果问题持续存在，请联系技术支持：</p>
          <div class="feedback-actions">
            <el-button type="link" @click="handleReportBug">
              <el-icon><ChatDotSquare /></el-icon>
              报告问题
            </el-button>
            <el-button type="link" @click="handleContactSupport">
              <el-icon><Service /></el-icon>
              联系支持
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  WarningFilled,
  Refresh,
  House,
  ChatDotSquare,
  Service
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

// 响应式数据
const hasError = ref(false)
const errorMessage = ref('')
const errorDetails = ref('')
const showErrorDetails = ref(false)
const errorInfo = ref<any>(null)

// 计算属性
const showDetails = computed(() => {
  return import.meta.env.DEV || userStore.userRole === 'admin'
})

// 错误捕获
onErrorCaptured((error: Error, instance, info) => {
  console.error('ErrorBoundary caught an error:', error, info)

  hasError.value = true
  errorMessage.value = error.message || '未知错误'
  errorDetails.value = error.stack || ''
  errorInfo.value = { error, instance, info }

  // 在生产环境中发送错误报告
  if (import.meta.env.PROD) {
    reportError(error, info)
  }

  // 显示通知
  appStore.addNotification({
    type: 'error',
    title: '应用错误',
    message: '页面遇到了错误，请刷新重试',
    duration: 0 // 不自动消失
  })

  return false // 阻止错误继续向上传播
})

// 方法
const handleRefresh = () => {
  window.location.reload()
}

const handleGoHome = () => {
  hasError.value = false
  router.push({ name: 'Dashboard' })
}

const toggleErrorDetails = () => {
  showErrorDetails.value = !showErrorDetails.value
}

const handleReportBug = () => {
  // 创建问题报告
  const bugReport = {
    title: '应用错误报告',
    description: errorMessage.value,
    details: errorDetails.value,
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: new Date().toISOString()
  }

  console.log('Bug report:', bugReport)

  appStore.addNotification({
    type: 'info',
    title: '问题报告',
    message: '问题报告已记录，感谢您的反馈！'
  })
}

const handleContactSupport = () => {
  // 打开邮件客户端或跳转到支持页面
  const subject = encodeURIComponent('技术支持请求')
  const body = encodeURIComponent(`
错误信息：${errorMessage.value}
页面地址：${window.location.href}
用户代理：${navigator.userAgent}
时间：${new Date().toLocaleString()}
  `.trim())

  window.location.href = `mailto:support@reopeninnolab.com?subject=${subject}&body=${body}`
}

const reportError = async (error: Error, info: string) => {
  try {
    // 这里可以集成错误监控服务，如 Sentry
    // await errorReporting.captureException(error, { extra: { info } })
    console.log('Error reported to monitoring service')
  } catch (reportError) {
    console.error('Failed to report error:', reportError)
  }
}

// 重置错误状态
const resetError = () => {
  hasError.value = false
  errorMessage.value = ''
  errorDetails.value = ''
  showErrorDetails.value = false
  errorInfo.value = null
}

// 暴露重置方法供外部调用
defineExpose({
  resetError
})
</script>

<style scoped>
.error-boundary {
  min-height: 100%;
}

.error-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 20px;
}

.error-content {
  text-align: center;
  max-width: 600px;
  width: 100%;
}

.error-icon {
  margin-bottom: 24px;
}

.error-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 16px 0;
}

.error-message {
  font-size: 16px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
  margin: 0 0 32px 0;
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.error-details {
  margin-top: 24px;
  text-align: left;
}

.error-stack {
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
}

.error-feedback {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.feedback-text {
  font-size: 14px;
  color: var(--el-text-color-regular);
  margin: 0 0 16px 0;
}

.feedback-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .error-content {
    padding: 0 16px;
  }

  .error-title {
    font-size: 20px;
  }

  .error-message {
    font-size: 14px;
  }

  .error-actions {
    flex-direction: column;
    align-items: center;
  }

  .feedback-actions {
    flex-direction: column;
    align-items: center;
  }
}

/* 深色模式适配 */
.dark .error-stack {
  background: var(--el-fill-color-dark);
  color: var(--el-text-color-secondary);
}
</style>
