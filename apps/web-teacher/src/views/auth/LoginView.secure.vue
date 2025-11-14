<template>
  <div class="login-view">
    <!-- 左侧装饰面板 -->
    <div class="login-panel-left">
      <div class="panel-content">
        <div class="brand-section">
          <div class="brand-logo">
            <div class="logo-icon">
              <svg viewBox="0 0 64 64" fill="none">
                <rect width="64" height="64" rx="16" fill="url(#gradient1)"/>
                <path d="M20 32h24M32 20v24M24 24l16 16M40 24L24 40" stroke="white" stroke-width="3" stroke-linecap="round"/>
                <defs>
                  <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 class="brand-title">开源浦育</h1>
            <p class="brand-subtitle">ReOpen Inno Lab</p>
          </div>
        </div>

        <div class="features-section">
          <h2 class="features-title">新一代智能教育平台</h2>
          <div class="features-list">
            <div class="feature-item">
              <div class="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div class="feature-content">
                <h3>AI 驱动教学</h3>
                <p>智能推荐个性化学习路径</p>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div class="feature-content">
                <h3>协作学习社区</h3>
                <p>师生互动，共同成长</p>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <div class="feature-content">
                <h3>虚拟实验室</h3>
                <p>安全便捷的在线实验环境</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧登录表单 -->
    <div class="login-panel-right">
      <div class="form-container">
        <transition name="fade" mode="out-in">
          <div key="login" class="login-form">
            <div class="form-header">
              <h2>欢迎回来</h2>
              <p>请登录您的账户以继续使用</p>
            </div>

            <el-form
              ref="loginFormRef"
              :model="loginForm"
              :rules="loginRules"
              size="large"
              @submit.prevent="handleLogin"
            >
              <el-form-item prop="username">
                <el-input
                  v-model="loginForm.username"
                  placeholder="用户名或邮箱"
                  prefix-icon="User"
                  :disabled="loading"
                  clearable
                  autocomplete="username"
                />
              </el-form-item>

              <el-form-item prop="password">
                <el-input
                  v-model="loginForm.password"
                  type="password"
                  placeholder="密码"
                  prefix-icon="Lock"
                  :disabled="loading"
                  show-password
                  autocomplete="current-password"
                  @keyup.enter="handleLogin"
                />
              </el-form-item>

              <el-form-item>
                <div class="form-options">
                  <el-checkbox v-model="loginForm.remember" :disabled="loading">
                    记住登录状态
                  </el-checkbox>
                  <el-link type="primary" @click="goToForgotPassword">
                    忘记密码？
                  </el-link>
                </div>
              </el-form-item>

              <el-form-item>
                <el-button
                  type="primary"
                  size="large"
                  :loading="loading"
                  @click="handleLogin"
                  class="login-button"
                >
                  {{ loading ? '登录中...' : '登录' }}
                </el-button>
              </el-form-item>
            </el-form>

            <!-- 注册链接 -->
            <div class="register-link">
              <span>还没有账号？</span>
              <el-link type="primary" @click="goToRegister" class="register-link-button">
                立即注册
              </el-link>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useSecureUserStore } from '@/stores/user.secure'
import { useAppStore } from '@/stores/app'

interface LoginForm {
  username: string
  password: string
  remember: boolean
}

const router = useRouter()
const route = useRoute()
const userStore = useSecureUserStore()
const appStore = useAppStore()

// 响应式数据
const loginFormRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive<LoginForm>({
  username: '',
  password: '',
  remember: false
})

// 表单验证规则 - 移除了角色验证
const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名或邮箱', trigger: 'blur' },
    { min: 3, message: '用户名至少 3 个字符', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!value) {
          callback(new Error('请输入用户名或邮箱'))
        } else if (value.includes('@')) {
          // 简单的邮箱格式验证
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(value)) {
            callback(new Error('请输入有效的邮箱地址'))
          } else {
            callback()
          }
        } else if (value.length < 3) {
          callback(new Error('用户名至少 3 个字符'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 个字符', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!value) {
          callback(new Error('请输入密码'))
        } else if (value.length < 6) {
          callback(new Error('密码至少 6 个字符'))
        } else if (value.length > 50) {
          callback(new Error('密码不能超过 50 个字符'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 事件处理
const handleLogin = async () => {
  if (!loginFormRef.value) return

  try {
    await loginFormRef.value.validate()
    loading.value = true

    // 调用安全的登录接口，不再传递角色
    await userStore.login({
      username: loginForm.username,
      password: loginForm.password,
      remember: loginForm.remember
    })

    ElMessage({
      message: '登录成功',
      type: 'success'
    })

    // 重定向到目标页面
    const redirect = route.query.redirect as string
    router.push(redirect || { name: 'Dashboard' })

  } catch (error: any) {
    console.error('登录失败:', error)

    // 显示更友好的错误消息
    let errorMessage = '登录失败，请检查您的凭据'

    if (error.response?.status === 429) {
      errorMessage = '登录尝试过于频繁，请稍后再试'
    } else if (error.response?.status === 401) {
      errorMessage = '用户名或密码错误'
    } else if (error.message) {
      errorMessage = error.message
    }

    ElMessage({
      message: errorMessage,
      type: 'error'
    })
  } finally {
    loading.value = false
  }
}

const goToRegister = () => {
  router.push({ name: 'Register' })
}

const goToForgotPassword = () => {
  router.push({ name: 'ForgotPassword' })
}

// 组件挂载时的处理
onMounted(async () => {
  try {
    // 初始化认证状态
    await userStore.initializeAuth()

    // 如果已经登录，重定向到仪表板
    if (userStore.isAuthenticated) {
      const redirect = route.query.redirect as string
      router.push(redirect || { name: 'Dashboard' })
    }
  } catch (error) {
    console.error('初始化认证状态失败:', error)
  }
})
</script>

<style scoped>
.login-view {
  min-height: 100vh;
  display: flex;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

/* 左侧面板 */
.login-panel-left {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  position: relative;
}

.panel-content {
  max-width: 500px;
  width: 100%;
  color: white;
  text-align: center;
}

.brand-section {
  margin-bottom: 4rem;
}

.brand-logo {
  margin-bottom: 2rem;
}

.logo-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.logo-icon svg {
  width: 40px;
  height: 40px;
}

.brand-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.brand-subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  font-weight: 300;
}

.features-section {
  text-align: left;
}

.features-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 2rem;
  text-align: center;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.feature-icon {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feature-icon svg {
  width: 20px;
  height: 20px;
}

.feature-content h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.feature-content p {
  font-size: 0.9rem;
  opacity: 0.8;
  line-height: 1.4;
}

/* 右侧面板 */
.login-panel-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.form-container {
  width: 100%;
  max-width: 400px;
}

.login-form {
  background: white;
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.form-header {
  text-align: center;
  margin-bottom: 2rem;
}

.form-header h2 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.form-header p {
  color: #6b7280;
  font-size: 0.95rem;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 1rem;
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: all 0.3s ease;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.register-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #6b7280;
  font-size: 0.9rem;
}

.register-link-button {
  font-weight: 600;
  margin-left: 0.5rem;
}

/* 表单样式调整 */
:deep(.el-form-item) {
  margin-bottom: 1.5rem;
}

:deep(.el-form-item__content) {
  line-height: normal;
}

:deep(.el-input__inner) {
  height: 48px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

:deep(.el-input__inner:focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

:deep(.el-checkbox) {
  font-weight: 500;
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .login-panel-left {
    display: none;
  }

  .login-panel-right {
    flex: 1;
  }
}

@media (max-width: 640px) {
  .login-view {
    padding: 1rem;
  }

  .login-form {
    padding: 1.5rem;
  }

  .form-header h2 {
    font-size: 1.5rem;
  }
}
</style>