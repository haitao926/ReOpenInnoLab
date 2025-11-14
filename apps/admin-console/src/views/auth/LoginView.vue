<template>
  <div class="login-container">
    <div class="login-card">
      <!-- Logo and Title -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <el-icon size="32" color="white"><Monitor /></el-icon>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Admin Console</h1>
        <p class="text-gray-600">管理控制台登录</p>
      </div>

      <!-- Login Form -->
      <el-form
        ref="formRef"
        :model="loginForm"
        :rules="rules"
        @submit.prevent="handleLogin"
        size="large"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            :placeholder="t('auth.username')"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            :placeholder="t('auth.password')"
            :prefix-icon="Lock"
            show-password
            clearable
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <div class="flex items-center justify-between w-full">
            <el-checkbox v-model="loginForm.rememberMe">
              {{ t('auth.rememberMe') }}
            </el-checkbox>
            <el-button text type="primary">
              {{ t('auth.forgotPassword') }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="w-full"
            :loading="isLoading"
            @click="handleLogin"
          >
            {{ t('auth.login') }}
          </el-button>
        </el-form-item>
      </el-form>

      <!-- MFA Verification (shown when needed) -->
      <el-divider v-if="showMFA">双因素认证</el-divider>
      <el-form v-if="showMFA" @submit.prevent="handleMFAVerify">
        <el-form-item>
          <el-input
            v-model="mfaCode"
            placeholder="请输入6位验证码"
            maxlength="6"
            clearable
            @keyup.enter="handleMFAVerify"
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

      <!-- Language Switch -->
      <div class="text-center mt-6">
        <el-dropdown @command="changeLanguage">
          <span class="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
            <el-icon><Location /></el-icon>
            {{ currentLanguage }}
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="zh-CN">中文</el-dropdown-item>
              <el-dropdown-item command="en-US">English</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- Background Pattern -->
    <div class="bg-pattern"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock, Location, Monitor } from '@element-plus/icons-vue'
import { useAuth } from '@/composables/useAuth'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const { login, isLoading } = useAuth()

// Form state
const formRef = ref<FormInstance>()
const loginForm = reactive({
  username: '',
  password: '',
  rememberMe: false
})

// MFA state
const showMFA = ref(false)
const mfaCode = ref('')
const isMFAVerifying = ref(false)

// Form rules
const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, message: '用户名至少2个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6个字符', trigger: 'blur' }
  ]
}

// Computed
const currentLanguage = computed(() => {
  return locale.value === 'zh-CN' ? '中文' : 'English'
})

// Methods
const handleLogin = async () => {
  if (!formRef.value) return

  try {
    const valid = await formRef.value.validate()
    if (!valid) return

    // For demo purposes, simulate MFA requirement
    if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
      showMFA.value = true
      return
    }

    const success = await login(loginForm)
    if (success) {
      ElMessage.success('登录成功')

      const redirect = route.query.redirect as string
      router.push(redirect || { name: 'Dashboard' })
    }
  } catch (error: any) {
    ElMessage.error(error.message || t('auth.loginFailed'))
  }
}

const handleMFAVerify = async () => {
  if (!mfaCode.value || mfaCode.value.length !== 6) {
    ElMessage.error('请输入6位验证码')
    return
  }

  isMFAVerifying.value = true
  try {
    // Simulate MFA verification
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (mfaCode.value === '123456') {
      const success = await login(loginForm)
      if (success) {
        ElMessage.success('登录成功')
        const redirect = route.query.redirect as string
        router.push(redirect || { name: 'Dashboard' })
      }
    } else {
      ElMessage.error('验证码错误')
    }
  } catch (error) {
    ElMessage.error('验证失败，请重试')
  } finally {
    isMFAVerifying.value = false
  }
}

const changeLanguage = (lang: string) => {
  locale.value = lang
  localStorage.setItem('admin-locale', lang)
  ElMessage.success(lang === 'zh-CN' ? '已切换到中文' : 'Switched to English')
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 16px;
  padding: 48px 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 420px;
  position: relative;
  z-index: 1;
}

.bg-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

:deep(.el-form-item) {
  margin-bottom: 24px;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
  padding: 12px 16px;
}

:deep(.el-button) {
  border-radius: 8px;
  padding: 12px 20px;
  font-weight: 500;
}

:deep(.el-checkbox) {
  font-weight: normal;
}

@media (max-width: 480px) {
  .login-card {
    padding: 32px 24px;
  }
}
</style>