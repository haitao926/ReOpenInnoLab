<template>
  <div class="error-boundary">
    <div v-if="hasError" class="error-content">
      <div class="error-icon">
        <el-icon size="64" color="#ef4444">
          <WarningFilled />
        </el-icon>
      </div>
      <h2 class="error-title">出现了一些问题</h2>
      <p class="error-message">
        {{ errorMessage || '页面加载时发生错误，请刷新页面重试' }}
      </p>
      <div class="error-actions">
        <el-button type="primary" @click="handleRefresh">
          刷新页面
        </el-button>
        <el-button @click="handleGoHome">
          返回首页
        </el-button>
        <el-button
          v-if="showDetails"
          text
          type="info"
          @click="showErrorDetails = !showErrorDetails"
        >
          {{ showErrorDetails ? '隐藏详情' : '显示详情' }}
        </el-button>
      </div>

      <!-- Error details (development only) -->
      <div v-if="showDetails && errorDetails" class="error-details">
        <pre>{{ errorDetails }}</pre>
      </div>
    </div>

    <!-- Normal content -->
    <slot v-else />
  </div>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, computed } from 'vue'
import { useRouter } from 'vue-router'
import { WarningFilled } from '@element-plus/icons-vue'
import { useMonitoring } from '@/services/monitoring'

interface Props {
  fallback?: string
  showDetails?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: false
})

const router = useRouter()
const { trackError } = useMonitoring()

// State
const hasError = ref(false)
const errorMessage = ref('')
const errorDetails = ref('')
const showErrorDetails = ref(false)

// Computed
const isDevelopment = computed(() => import.meta.env.DEV)

// Methods
const handleRefresh = () => {
  window.location.reload()
}

const handleGoHome = () => {
  hasError.value = false
  router.push({ name: 'Dashboard' })
}

const reset = () => {
  hasError.value = false
  errorMessage.value = ''
  errorDetails.value = ''
  showErrorDetails.value = false
}

// Error capture
onErrorCaptured((error: any) => {
  console.error('ErrorBoundary caught an error:', error)

  hasError.value = true
  errorMessage.value = error.message || '未知错误'

  if (isDevelopment.value) {
    errorDetails.value = error.stack || 'No stack trace available'
  }

  // Track error for monitoring
  trackError(error)

  // Prevent error from propagating
  return false
})

// Expose reset method
defineExpose({
  reset
})
</script>

<style scoped>
.error-boundary {
  height: 100%;
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  min-height: 400px;
}

.error-icon {
  margin-bottom: 24px;
}

.error-title {
  font-size: 24px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 16px;
}

.error-message {
  font-size: 16px;
  color: #6b7280;
  margin-bottom: 32px;
  max-width: 500px;
  line-height: 1.6;
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
  padding: 16px;
  background-color: #f3f4f6;
  border-radius: 8px;
  text-align: left;
  max-width: 600px;
  width: 100%;
}

.error-details pre {
  font-size: 12px;
  color: #374151;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}

/* Dark theme */
:global(.html.dark) .error-title {
  color: #f3f4f6;
}

:global(.html.dark) .error-message {
  color: #9ca3af;
}

:global(.html.dark) .error-details {
  background-color: #374151;
}

:global(.html.dark) .error-details pre {
  color: #f3f4f6;
}

@media (max-width: 640px) {
  .error-actions {
    flex-direction: column;
    align-items: center;
  }

  .error-actions .el-button {
    width: 200px;
  }
}
</style>