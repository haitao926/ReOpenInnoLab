<template>
  <div class="sso-callback">
    <div class="callback-content">
      <div v-if="isLoading" class="loading-state">
        <el-icon size="48" class="is-loading">
          <Loading />
        </el-icon>
        <h2 class="loading-title">正在处理SSO登录...</h2>
        <p class="loading-description">请稍候，正在验证您的身份</p>
      </div>

      <div v-else-if="error" class="error-state">
        <el-icon size="64" color="#ef4444">
          <CircleCloseFilled />
        </el-icon>
        <h2 class="error-title">登录失败</h2>
        <p class="error-message">{{ error }}</p>
        <div class="error-actions">
          <el-button type="primary" @click="retryLogin">
            重试登录
          </el-button>
          <el-button @click="goToNormalLogin">
            普通登录
          </el-button>
        </div>
      </div>

      <div v-else-if="requiresMFA" class="mfa-state">
        <el-icon size="48" color="#f59e0b">
          <Lock />
        </el-icon>
        <h2 class="mfa-title">需要双因素认证</h2>
        <p class="mfa-description">请选择一种认证方式完成登录</p>

        <el-form @submit.prevent="handleMFAVerify">
          <el-form-item>
            <el-select v-model="selectedMFAMethod" placeholder="选择认证方式" style="width: 100%">
              <el-option
                v-for="method in mfaMethods"
                :key="method"
                :label="getMFAMethodLabel(method)"
                :value="method"
              />
            </el-select>
          </el-form-item>

          <el-form-item v-if="selectedMFAMethod === 'totp'">
            <el-input
              v-model="mfaCode"
              placeholder="请输入6位验证码"
              maxlength="6"
              clearable
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              class="w-full"
              :loading="isMFAVerifying"
              @click="handleMFAVerify"
            >
              验证
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <div v-else class="success-state">
        <el-icon size="64" color="#10b981">
          <CircleCheckFilled />
        </el-icon>
        <h2 class="success-title">登录成功</h2>
        <p class="success-description">正在跳转到管理控制台...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Loading,
  CircleCloseFilled,
  Lock,
  CircleCheckFilled
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useSSO } from '@/services/sso'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { processCallback } = useSSO()

// State
const isLoading = ref(true)
const error = ref('')
const requiresMFA = ref(false)
const mfaMethods = ref<string[]>([])
const selectedMFAMethod = ref('')
const mfaCode = ref('')
const isMFAVerifying = ref(false)

// Methods
const processSSOCallback = async () => {
  try {
    isLoading.value = true
    error.value = ''

    const response = await processCallback()

    if (!response) {
      // Not an SSO callback, redirect to login
      router.push({ name: 'Login' })
      return
    }

    if (!response.success) {
      error.value = response.error || 'SSO登录失败'
      return
    }

    if (response.requiresMFA) {
      requiresMFA.value = true
      mfaMethods.value = response.mfaMethods || []
      return
    }

    // Login successful
    if (response.token && response.user) {
      authStore.token = response.token
      authStore.user = response.user
      authStore.permissions = response.user.permissions || []

      // Store in localStorage
      localStorage.setItem('admin_token', response.token)
      localStorage.setItem('admin_user', JSON.stringify(response.user))
      localStorage.setItem('admin_permissions', JSON.stringify(response.user.permissions || []))

      ElMessage.success('登录成功')

      // Redirect to intended destination
      const redirect = route.query.redirect as string || '/'
      router.push(redirect)
    }
  } catch (err: any) {
    console.error('SSO callback error:', err)
    error.value = err.message || '处理SSO回调时发生错误'
  } finally {
    isLoading.value = false
  }
}

const handleMFAVerify = async () => {
  if (!selectedMFAMethod.value) {
    ElMessage.error('请选择认证方式')
    return
  }

  if (selectedMFAMethod.value === 'totp' && (!mfaCode.value || mfaCode.value.length !== 6)) {
    ElMessage.error('请输入6位验证码')
    return
  }

  isMFAVerifying.value = true
  try {
    // In a real implementation, you would call the MFA verification API
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Simulate successful verification
    ElMessage.success('认证成功')
    router.push({ name: 'Dashboard' })
  } catch (err: any) {
    ElMessage.error(err.message || '认证失败')
  } finally {
    isMFAVerifying.value = false
  }
}

const getMFAMethodLabel = (method: string) => {
  const labels: Record<string, string> = {
    totp: 'Google Authenticator',
    sms: '短信验证',
    email: '邮箱验证',
    push: '推送通知'
  }
  return labels[method] || method
}

const retryLogin = () => {
  error.value = ''
  isLoading.value = true
  processSSOCallback()
}

const goToNormalLogin = () => {
  router.push({ name: 'Login' })
}

onMounted(() => {
  processSSOCallback()
})
</script>

<style scoped>
.sso-callback {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.callback-content {
  background: white;
  border-radius: 16px;
  padding: 48px 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 420px;
  text-align: center;
}

.loading-state,
.error-state,
.mfa-state,
.success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.loading-title,
.error-title,
.mfa-title,
.success-title {
  font-size: 24px;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.loading-description,
.error-message,
.mfa-description,
.success-description {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 24px;
}

.error-actions .el-button {
  min-width: 120px;
}

.is-loading {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-select),
:deep(.el-input__wrapper) {
  border-radius: 8px;
}

@media (max-width: 480px) {
  .callback-content {
    padding: 32px 24px;
  }

  .error-actions {
    flex-direction: column;
    align-items: center;
  }

  .error-actions .el-button {
    width: 100%;
  }
}
</style>