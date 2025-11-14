<template>
  <AuthLayout @link-click="handleFooterLink">
    <template #hero>
      <AuthHero
        :show-personalized-greeting="true"
        :show-stats="false"
        user-type="student"
      />
    </template>

    <template #form>
      <LoginForm
        ref="loginFormRef"
        user-type="student"
        :loading="userStore.loading"
        :error-message="errorMessage"
        :initial-email="loginForm.email"
        @submit="handleLogin"
        @forgot-password="forgotPassword"
        @register="goToRegister"
        @help="showHelp"
        @clear-error="clearError"
      />
    </template>

    <template #notifications>
      <NotificationSystem
        ref="notificationSystemRef"
        :show-global-loading="userStore.loading"
        loading-text="正在登录..."
        @notification-close="handleNotificationClose"
        @action-triggered="handleActionTriggered"
      />
    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AuthLayout from '@/components/auth/AuthLayout.vue'
import AuthHero from '@/components/auth/AuthHero.vue'
import LoginForm from '@/components/auth/LoginForm.vue'
import NotificationSystem from '@/components/auth/NotificationSystem.vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 组件引用
const loginFormRef = ref()
const notificationSystemRef = ref()

// 表单数据
const loginForm = reactive({
  email: '',
  password: ''
})

// 错误信息
const errorMessage = ref('')

// 方法
const loadUserData = () => {
  // 检查记住我状态
  const remembered = localStorage.getItem('remember_me')
  if (remembered === 'true') {
    const rememberedEmail = localStorage.getItem('remembered_email')
    if (rememberedEmail) {
      loginForm.email = rememberedEmail
    }
  }
}

// 登录处理
const handleLogin = async (credentials: { email: string; password: string; rememberMe: boolean }) => {
  errorMessage.value = ''

  try {
    await userStore.login({
      email: credentials.email,
      password: credentials.password
    })

    // 处理记住我
    if (credentials.rememberMe) {
      localStorage.setItem('remembered_email', credentials.email)
      localStorage.setItem('remember_me', 'true')
    } else {
      localStorage.removeItem('remembered_email')
      localStorage.removeItem('remember_me')
    }

    // 保存登录时间
    localStorage.setItem('last_login_time', new Date().toISOString())

    // 显示成功通知
    notificationSystemRef.value?.showSuccess(
      '登录成功',
      '欢迎回来！正在跳转到主页...',
      3000
    )

    setTimeout(() => {
      const redirect = route.query.redirect as string
      router.push(redirect || '/dashboard')
    }, 1500)

  } catch (error: any) {
    console.error('登录失败:', error)

    // 根据错误类型提供不同的提示
    let message = '登录失败，请检查网络连接或联系管理员'
    let type = 'error'

    if (error.response?.status === 401) {
      message = '邮箱或密码错误，请重试'
      type = 'warning'
    } else if (error.response?.status === 429) {
      message = '登录尝试过于频繁，请稍后再试'
      type = 'warning'
    }

    // 显示错误通知
    notificationSystemRef.value?.showLoginError(
      message,
      () => handleLogin(credentials), // 重试操作
      () => showContactSupport() // 联系支持
    )
  }
}

const forgotPassword = () => {
  notificationSystemRef.value?.showInfo(
    '密码重置',
    '请联系管理员重置密码，或使用密码找回功能',
    5000
  )
}

const goToRegister = () => {
  router.push('/register')
}

const showHelp = () => {
  notificationSystemRef.value?.showInfo(
    '需要帮助？',
    '如遇登录问题，请联系技术支持团队',
    5000
  )
}

const showContactSupport = () => {
  notificationSystemRef.value?.showInfo(
    '联系支持',
    '技术支持邮箱: support@reopeninno.com',
    8000
  )
}

const clearError = () => {
  errorMessage.value = ''
}

const handleFooterLink = (type: 'privacy' | 'terms' | 'help' | 'contact') => {
  const linkMap = {
    privacy: '/privacy',
    terms: '/terms',
    help: '/help',
    contact: '/contact'
  }

  notificationSystemRef.value?.showInfo(
    '页面跳转',
    `即将跳转到${type === 'privacy' ? '隐私政策' : type === 'terms' ? '服务条款' : type === 'help' ? '帮助中心' : '联系我们'}页面`,
    2000
  )

  setTimeout(() => {
    router.push(linkMap[type])
  }, 1000)
}

const handleNotificationClose = (id: string) => {
  console.log('Notification closed:', id)
}

const handleActionTriggered = (notification: any, action: any) => {
  console.log('Action triggered:', notification, action)
}

// 生命周期
onMounted(() => {
  loadUserData()

  // 欢迎消息
  setTimeout(() => {
    notificationSystemRef.value?.showInfo(
      '欢迎来到开源浦育',
      '开始您的学习之旅吧！',
      4000
    )
  }, 1000)
})
</script>

<style scoped lang="scss">
// 使用共享组件的样式，无需额外样式
</style>