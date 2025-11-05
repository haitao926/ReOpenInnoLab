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
                <h3>协作式学习</h3>
                <p>师生互动，实时反馈</p>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="9" y1="9" x2="15" y2="9"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
              </div>
              <div class="feature-content">
                <h3>完整课程体系</h3>
                <p>从基础到进阶的系统化内容</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 背景装饰 -->
      <div class="panel-decoration">
        <div class="decoration-circle circle-1"></div>
        <div class="decoration-circle circle-2"></div>
        <div class="decoration-circle circle-3"></div>
        <div class="decoration-grid"></div>
      </div>
    </div>

    <!-- 右侧登录表单 -->
    <div class="login-panel-right">
      <div class="login-container">
        <transition name="slide-enter" appear>
          <div class="login-card">
            <!-- 顶部信息 -->
            <div class="login-header">
              <h1 class="login-title">欢迎回来</h1>
              <p class="login-subtitle">登录您的教育账户</p>
            </div>

            <!-- 登录表单 -->
            <el-form
              ref="loginFormRef"
              :model="loginForm"
              :rules="loginRules"
              size="large"
              @submit.prevent="handleLogin"
              class="login-form"
            >
              <!-- 角色选择 -->
              <el-form-item prop="role">
                <el-radio-group v-model="loginForm.role" size="large" class="role-selector">
                  <el-radio-button value="teacher">
                    <el-icon><Trophy /></el-icon>
                    教师
                  </el-radio-button>
                  <el-radio-button value="student">
                    <el-icon><UserFilled /></el-icon>
                    学生
                  </el-radio-button>
                </el-radio-group>
              </el-form-item>

              <el-form-item prop="username">
                <el-input
                  v-model="loginForm.username"
                  placeholder="用户名 / 邮箱"
                  :prefix-icon="User"
                  size="large"
                  clearable
                  class="form-input"
                  :validate-event="true"
                  @blur="validateField('username')"
                >
                  <template #suffix>
                    <transition name="fade">
                      <el-icon
                        v-if="loginForm.username &&
                              (loginForm.username.includes('@') ?
                                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginForm.username) :
                                loginForm.username.length >= 3)"
                        class="validation-success"
                      >
                        <CircleCheck />
                      </el-icon>
                    </transition>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item prop="password">
                <el-input
                  v-model="loginForm.password"
                  type="password"
                  placeholder="密码"
                  :prefix-icon="Lock"
                  size="large"
                  show-password
                  class="form-input"
                  :validate-event="true"
                  @blur="validateField('password')"
                  @keyup.enter="handleLogin"
                >
                  <template #suffix>
                    <transition name="fade">
                      <el-icon
                        v-if="loginForm.password && loginForm.password.length >= 6"
                        class="validation-success"
                      >
                        <CircleCheck />
                      </el-icon>
                    </transition>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item>
                <div class="form-options">
                  <el-checkbox v-model="loginForm.remember" class="remember-checkbox">
                    记住我
                  </el-checkbox>
                  <el-link type="primary" @click="showForgotPassword" class="forgot-link">
                    忘记密码？
                  </el-link>
                </div>
              </el-form-item>

              <el-form-item>
                <transition name="button-fade" appear>
                  <el-button
                    type="primary"
                    size="large"
                    class="login-button"
                    :loading="loading"
                    :disabled="loading"
                    @click="handleLogin"
                  >
                    <template v-if="!loading">
                      <span class="button-text">登录</span>
                    </template>
                    <template v-else>
                      <span class="button-text">登录中...</span>
                    </template>
                  </el-button>
                </transition>
              </el-form-item>

              <div class="divider">
                <span>或</span>
              </div>

              <!-- 第三方登录 -->
              <div class="third-party-login">
                <el-button
                  size="large"
                  class="third-party-button"
                  @click="loginWithGoogle"
                >
                  <el-icon><svg viewBox="0 0 24 24" width="18" height="18">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg></el-icon>
                  Google 登录
                </el-button>
              </div>
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
import { User, Lock, UserFilled, Trophy, CircleCheck } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'

interface LoginForm {
  username: string
  password: string
  role: 'teacher' | 'student'
  remember: boolean
}

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const appStore = useAppStore()

// 响应式数据
const loginFormRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive<LoginForm>({
  username: '',
  password: '',
  role: 'teacher',
  remember: false
})

// 表单验证规则
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
  ],
  role: [
    { required: true, message: '请选择登录角色', trigger: 'change' }
  ]
}

// 事件处理
const handleLogin = async () => {
  if (!loginFormRef.value) return

  try {
    await loginFormRef.value.validate()
    loading.value = true

    // 调用登录接口
    await userStore.login({
      username: loginForm.username,
      password: loginForm.password,
      role: loginForm.role,
      remember: loginForm.remember
    })

    ElMessage({
      message: '登录成功',
      type: 'success'
    })

    // 重定向到目标页面
    const redirect = route.query.redirect as string
    router.push(redirect || '/dashboard')
  } catch (error: any) {
    console.error('登录失败:', error)

    // 根据不同的错误类型提供更友好的提示
    let errorMessage = '登录失败，请重试'

    if (error.response) {
      const status = error.response.status
      const data = error.response.data

      switch (status) {
        case 400:
          errorMessage = data?.message || '请求参数错误，请检查输入信息'
          break
        case 401:
          errorMessage = '用户名或密码错误，请重新输入'
          break
        case 403:
          errorMessage = '账户被禁用，请联系管理员'
          break
        case 404:
          errorMessage = '用户不存在，请检查用户名或注册账号'
          break
        case 429:
          errorMessage = '登录尝试过于频繁，请稍后再试'
          break
        case 500:
          errorMessage = '服务器内部错误，请稍后再试'
          break
        case 502:
        case 503:
          errorMessage = '服务暂时不可用，请稍后再试'
          break
        default:
          errorMessage = data?.message || `网络错误 (${status})`
      }
    } else if (error.request) {
      errorMessage = '网络连接失败，请检查网络设置'
    } else if (error.message) {
      errorMessage = error.message
    }

    ElMessage({
      message: errorMessage,
      type: 'error'
    })

    // 如果是网络错误，提供更详细的帮助信息
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
      setTimeout(() => {
        ElMessage({
          message: '请检查网络连接，或联系技术支持',
          type: 'info',
          duration: 5000
        })
      }, 1000)
    }
  } finally {
    loading.value = false
  }
}

const loginWithGoogle = () => {
  ElMessage({
    message: 'Google 登录功能开发中...',
    type: 'info'
  })
}

const showForgotPassword = () => {
  ElMessage({
    message: '忘记密码功能开发中...',
    type: 'info'
  })
}

const goToRegister = () => {
  router.push('/register')
}

// 验证单个字段
const validateField = (field: 'username' | 'password') => {
  if (!loginFormRef.value) return

  loginFormRef.value.validateField(field).catch(() => {
    // 忽略验证错误，这里只是为了触发验证
  })
}

// 生命周期
onMounted(async () => {
  // 如果已经登录，直接跳转
  if (userStore.isAuthenticated) {
    const redirect = route.query.redirect as string
    router.push(redirect || '/dashboard')
    return
  }

  // 初始化主题
  appStore.initializeTheme()

  // 检查URL参数中的错误信息
  const error = route.query.error as string
  if (error === 'session_expired') {
    ElMessage({
      message: '登录会话已过期，请重新登录',
      type: 'warning'
    })
  } else if (error === 'access_denied') {
    ElMessage({
      message: '访问被拒绝，请先登录',
      type: 'error'
    })
  }
})
</script>

<style lang="scss" scoped>
// 整体布局
.login-view {
  min-height: 100vh;
  display: flex;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

// 左侧面板
.login-panel-left {
  flex: 1.2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;

  @media (max-width: 1200px) {
    display: none;
  }
}

.panel-content {
  max-width: 500px;
  width: 100%;
  z-index: 2;
  position: relative;
}

.brand-section {
  text-align: center;
  margin-bottom: 60px;
}

.brand-logo {
  margin-bottom: 32px;
}

.logo-icon {
  width: 120px;
  height: 120px;
  margin: 0 auto 24px;

  svg {
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.3));
  }
}

.brand-title {
  font-size: 48px;
  font-weight: 700;
  margin: 0 0 12px 0;
  background: linear-gradient(45deg, #fff, #f0f0f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-subtitle {
  font-size: 18px;
  opacity: 0.9;
  margin: 0;
  font-weight: 300;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.features-section {
  margin-top: 60px;
}

.features-title {
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 40px;
  text-align: center;
  line-height: 1.2;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }
}

.feature-icon {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 28px;
    height: 28px;
    stroke-width: 2;
  }
}

.feature-content {
  flex: 1;

  h3 {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 8px 0;
  }

  p {
    font-size: 14px;
    opacity: 0.8;
    margin: 0;
    line-height: 1.5;
  }
}

// 右侧面板
.login-panel-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: #ffffff;
  position: relative;

  @media (max-width: 768px) {
    padding: 20px;
  }
}

.login-container {
  width: 100%;
  max-width: 420px;
}

.login-card {
  background: white;
  border-radius: 24px;
  padding: 48px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05);

  @media (max-width: 768px) {
    padding: 32px 24px;
  }
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-title {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 12px 0;
  line-height: 1.2;
}

.login-subtitle {
  font-size: 16px;
  color: #666666;
  margin: 0;
  font-weight: 400;
}

.login-form {
  margin-bottom: 32px;
}

.role-selector {
  width: 100%;
  margin-bottom: 24px;

  :deep(.el-radio-button) {
    flex: 1;
  }

  :deep(.el-radio-button__inner) {
    width: 100%;
    padding: 14px 20px;
    font-size: 16px;
    font-weight: 500;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.3s ease;

    .el-icon {
      font-size: 18px;
    }
  }

  :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-color: #667eea;
    color: white;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  }
}

.form-input {
  margin-bottom: 16px;

  :deep(.el-input__wrapper) {
    border-radius: 12px;
    padding: 16px 20px;
    border: 2px solid #e5e5e5;
    transition: all 0.3s ease;
    box-shadow: none;

    &:hover {
      border-color: #667eea;
    }

    &.is-focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
  }

  :deep(.el-input__inner) {
    font-size: 16px;
    color: #1a1a1a;

    &::placeholder {
      color: #999999;
    }
  }

  :deep(.el-input__prefix) {
    color: #667eea;
  }
}

.validation-success {
  color: #10b981;
  font-size: 16px;
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
}

.remember-checkbox {
  :deep(.el-checkbox__label) {
    color: #666666;
    font-size: 14px;
  }
}

.forgot-link {
  font-size: 14px;
  font-weight: 500;
}

.login-button {
  width: 100%;
  height: 56px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  margin-bottom: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
}

.button-text {
  color: white;
  font-weight: 600;
}

.divider {
  display: flex;
  align-items: center;
  margin: 24px 0;
  color: #999999;
  font-size: 14px;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e5e5e5;
  }

  span {
    padding: 0 16px;
  }
}

.third-party-login {
  margin-bottom: 24px;
}

.third-party-button {
  width: 100%;
  height: 52px;
  border-radius: 12px;
  border: 2px solid #e5e5e5;
  background: white;
  color: #666666;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    border-color: #667eea;
    color: #667eea;
    background: rgba(102, 126, 234, 0.05);
  }

  .el-icon {
    margin-right: 8px;
  }
}

.register-link {
  text-align: center;
  font-size: 14px;
  color: #666666;

  .register-link-button {
    margin-left: 4px;
    font-weight: 500;
  }
}

// 背景装饰
.panel-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;

  &.circle-1 {
    width: 200px;
    height: 200px;
    top: 10%;
    left: 10%;
    animation-delay: 0s;
  }

  &.circle-2 {
    width: 150px;
    height: 150px;
    top: 60%;
    right: 15%;
    animation-delay: 2s;
  }

  &.circle-3 {
    width: 100px;
    height: 100px;
    bottom: 20%;
    left: 25%;
    animation-delay: 4s;
  }
}

.decoration-grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: slideGrid 20s linear infinite;
}

// 动画
@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

@keyframes slideGrid {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(50px, 50px);
  }
}

.slide-enter-active {
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(50px);
}

.button-fade-enter-active {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.button-fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

// 响应式设计
@media (max-width: 1200px) {
  .login-view {
    background: white;
  }

  .login-panel-right {
    flex: 1;
  }
}

@media (max-width: 768px) {
  .login-panel-right {
    padding: 20px;
  }

  .login-card {
    padding: 32px 24px;
    border-radius: 16px;
  }

  .login-title {
    font-size: 28px;
  }

  .brand-title {
    font-size: 36px;
  }

  .features-title {
    font-size: 24px;
  }

  .feature-item {
    padding: 16px;
    gap: 16px;
  }

  .feature-icon {
    width: 48px;
    height: 48px;

    svg {
      width: 24px;
      height: 24px;
    }
  }
}
</style>