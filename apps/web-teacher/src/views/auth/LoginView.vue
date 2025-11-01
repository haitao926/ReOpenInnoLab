<template>
  <div class="login-view">
    <div class="login-container">
      <div class="login-card">
        <!-- Logo 和标题 -->
        <div class="login-header">
          <div class="logo">
            <img src="/logo.svg" alt="Logo" class="logo-image" />
          </div>
          <h1 class="login-title">开源浦育</h1>
          <p class="login-subtitle">智能教育基础设施</p>
        </div>

        <!-- 登录表单 -->
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
              placeholder="用户名 / 邮箱"
              prefix-icon="User"
              size="large"
              clearable
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="密码"
              prefix-icon="Lock"
              size="large"
              show-password
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <el-form-item>
            <div class="form-options">
              <el-checkbox v-model="loginForm.remember">
                记住我
              </el-checkbox>
              <el-link type="primary" @click="showForgotPassword">
                忘记密码？
              </el-link>
            </div>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              style="width: 100%"
              :loading="loading"
              @click="handleLogin"
            >
              登录
            </el-button>
          </el-form-item>

          <div class="divider">
            <span>或</span>
          </div>

          <!-- 第三方登录 -->
          <div class="third-party-login">
            <el-button
              size="large"
              style="width: 100%"
              @click="loginWithGoogle"
            >
              <el-icon><Google /></el-icon>
              Google 登录
            </el-button>
          </div>
        </el-form>

        <!-- 注册链接 -->
        <div class="register-link">
          <span>还没有账号？</span>
          <el-link type="primary" @click="goToRegister">
            立即注册
          </el-link>
        </div>
      </div>

      <!-- 背景装饰 -->
      <div class="background-decoration">
        <div class="decoration-shape shape-1"></div>
        <div class="decoration-shape shape-2"></div>
        <div class="decoration-shape shape-3"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { UserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'

interface LoginForm {
  username: string
  password: string
  remember: boolean
}

const router = useRouter()
const route = useRoute()
const userStore = UserStore()
const appStore = useAppStore()

// 响应式数据
const loginFormRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive<LoginForm>({
  username: '',
  password: '',
  remember: false
})

// 表单验证规则
const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名或邮箱', trigger: 'blur' },
    { min: 3, message: '用户名至少 3 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 个字符', trigger: 'blur' }
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
      remember: loginForm.remember
    })

    ElMessage.success('登录成功')

    // 重定向到目标页面
    const redirect = route.query.redirect as string
    router.push(redirect || '/dashboard')
  } catch (error: any) {
    console.error('登录失败:', error)
    ElMessage.error(error.message || '登录失败，请检查用户名和密码')
  } finally {
    loading.value = false
  }
}

const loginWithGoogle = () => {
  ElMessage.info('Google 登录功能开发中...')
}

const showForgotPassword = () => {
  ElMessage.info('忘记密码功能开发中...')
}

const goToRegister = () => {
  router.push('/register')
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
    ElMessage.warning('登录会话已过期，请重新登录')
  } else if (error === 'access_denied') {
    ElMessage.error('访问被拒绝，请先登录')
  }
})
</script>

<style lang="scss" scoped>
.login-view {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-primary-300) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.login-container {
  position: relative;
  z-index: 10;
}

.login-card {
  background: var(--color-white);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 400px;
  backdrop-filter: blur(10px);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;

  .logo {
    margin-bottom: 16px;

    .logo-image {
      width: 64px;
      height: 64px;
    }
  }

  .login-title {
    font-size: 28px;
    font-weight: 600;
    color: var(--edu-text-primary);
    margin: 0 0 8px 0;
  }

  .login-subtitle {
    font-size: 16px;
    color: var(--edu-text-secondary);
    margin: 0;
  }
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.divider {
  display: flex;
  align-items: center;
  margin: 24px 0;
  color: var(--edu-text-placeholder);
  font-size: 14px;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--edu-border-color);
  }

  span {
    padding: 0 16px;
  }
}

.third-party-login {
  .el-button {
    justify-content: flex-start;
    gap: 8px;
  }
}

.register-link {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: var(--edu-text-secondary);

  .el-link {
    margin-left: 4px;
  }
}

.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
  overflow: hidden;
}

.decoration-shape {
  position: absolute;
  opacity: 0.1;
  animation: float 6s ease-in-out infinite;

  &.shape-1 {
    width: 80px;
    height: 80px;
    background: var(--color-white);
    border-radius: 50%;
    top: 10%;
    left: 10%;
    animation-delay: 0s;
  }

  &.shape-2 {
    width: 120px;
    height: 120px;
    background: var(--color-white);
    border-radius: 50%;
    top: 60%;
    right: 15%;
    animation-delay: 2s;
  }

  &.shape-3 {
    width: 60px;
    height: 60px;
    background: var(--color-white);
    border-radius: 50%;
    bottom: 20%;
    left: 20%;
    animation-delay: 4s;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

// 深色模式适配
[data-theme="dark"] {
  .login-card {
    background: var(--color-gray-800);
    border: 1px solid var(--edu-border-color);
  }

  .login-title {
    color: var(--edu-text-primary);
  }
}

// 响应式设计
@media (max-width: 480px) {
  .login-card {
    padding: 32px 24px;
    margin: 20px;
  }

  .login-header {
    .login-title {
      font-size: 24px;
    }

    .login-subtitle {
      font-size: 14px;
    }
  }

  .form-options {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .third-party-login {
    .el-button {
      font-size: 14px;
    }
  }
}
</style>