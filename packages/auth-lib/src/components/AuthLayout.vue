<template>
  <div
    class="auth-layout"
    :class="layoutClasses"
    :data-theme="theme"
  >
    <!-- 动态背景 -->
    <div class="auth-layout__background">
      <DynamicBackground
        :timeOfDay="currentTime"
        :weather="weatherData"
        :userTheme="theme"
      />
    </div>

    <!-- 主要内容区域 -->
    <div class="auth-layout__container">
      <div class="auth-layout__content">
        <!-- 左侧品牌信息区 -->
        <div
          v-if="variant === 'split'"
          class="auth-layout__brand"
        >
          <slot name="brand">
            <BrandPanel
              :features="brandFeatures"
              :welcomeMessage="welcomeMessage"
            />
          </slot>
        </div>

        <!-- 右侧认证区域 -->
        <div
          class="auth-layout__auth"
          :class="authClasses"
        >
          <!-- 顶部导航 -->
          <div v-if="showHeader" class="auth-layout__header">
            <slot name="header">
              <AuthHeader
                :title="title"
                :showLanguageSelector="showLanguageSelector"
                :showThemeSelector="showThemeSelector"
                @language-changed="handleLanguageChange"
                @theme-changed="handleThemeChange"
              />
            </slot>
          </div>

          <!-- 认证卡片容器 -->
          <div class="auth-layout__card-container">
            <slot>
              <!-- 默认认证卡片 -->
              <AuthCard>
                <PersonalizedWelcome
                  v-if="showWelcome"
                  :userName="userName"
                  :lastLogin="lastLogin"
                  :currentTime="currentTime"
                />

                <LoginForm
                  :config="formConfig"
                  :loading="loading"
                  @login="handleLogin"
                  @error="handleError"
                />
              </AuthCard>
            </slot>
          </div>

          <!-- 底部信息 -->
          <div v-if="showFooter" class="auth-layout__footer">
            <slot name="footer">
              <AuthFooter
                :showPolicyLinks="showPolicyLinks"
                :showSupport="showSupport"
                :privacyVersion="privacyVersion"
              />
            </slot>
          </div>
        </div>
      </div>
    </div>

    <!-- 安全指示器 -->
    <SecurityIndicator
      v-if="showSecurityIndicator"
      :riskLevel="currentRiskLevel"
      :activeThreats="activeThreats"
      :recommendations="securityRecommendations"
      class="auth-layout__security-indicator"
    />

    <!-- 全局消息 -->
    <AuthNotifications
      :notifications="notifications"
      @close="removeNotification"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAdaptiveAuth } from '../composables/useAdaptiveAuth'
import { useSecurityMonitor } from '../composables/useSecurityMonitor'
import type {
  AuthLayoutVariant,
  ThemeConfig,
  SecurityLevel,
  AuthNotification,
  LoginFormConfig
} from '../types'

// 组件导入
import DynamicBackground from './DynamicBackground.vue'
import BrandPanel from './BrandPanel.vue'
import AuthCard from './AuthCard.vue'
import PersonalizedWelcome from './PersonalizedWelcome.vue'
import LoginForm from './LoginForm.vue'
import AuthHeader from './AuthHeader.vue'
import AuthFooter from './AuthFooter.vue'
import SecurityIndicator from './SecurityIndicator.vue'
import AuthNotifications from './AuthNotifications.vue'

interface Props {
  variant?: AuthLayoutVariant
  title?: string
  showHeader?: boolean
  showFooter?: boolean
  showWelcome?: boolean
  showSecurityIndicator?: boolean
  showLanguageSelector?: boolean
  showThemeSelector?: boolean
  showPolicyLinks?: boolean
  showSupport?: boolean
  formConfig?: LoginFormConfig
  brandFeatures?: any[]
  welcomeMessage?: string
  userName?: string
  lastLogin?: Date
  loading?: boolean
  theme?: 'light' | 'dark' | 'auto'
  privacyVersion?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'centered',
  showHeader: true,
  showFooter: true,
  showWelcome: true,
  showSecurityIndicator: false,
  showLanguageSelector: true,
  showThemeSelector: false,
  showPolicyLinks: true,
  showSupport: true,
  theme: 'light',
  privacyVersion: '1.0'
})

// 事件定义
const emit = defineEmits<{
  login: [credentials: any]
  error: [error: any]
  'language-changed': [language: string]
  'theme-changed': [theme: string]
}>()

// Composables
const { t } = useI18n()
const { userContext, updateContext } = useAdaptiveAuth()
const {
  currentRiskLevel,
  activeThreats,
  securityRecommendations,
  startMonitoring
} = useSecurityMonitor()

// 响应式数据
const notifications = ref<AuthNotification[]>([])
const currentTime = ref(new Date())
const weatherData = ref<any>(null)

// 计算属性
const layoutClasses = computed(() => ({
  [`auth-layout--${props.variant}`]: true,
  'auth-layout--with-security': props.showSecurityIndicator,
  'auth-layout--loading': props.loading
}))

const authClasses = computed(() => ({
  'auth-layout__auth--split': props.variant === 'split',
  'auth-layout__auth--centered': props.variant === 'centered',
  'auth-layout__auth--full': props.variant === 'full'
}))

// 方法
const handleLogin = async (credentials: any) => {
  try {
    emit('login', credentials)
  } catch (error) {
    handleError(error)
  }
}

const handleError = (error: any) => {
  const notification: AuthNotification = {
    id: Date.now().toString(),
    type: 'error',
    title: t('auth.error.title'),
    message: error.message || t('auth.error.default'),
    duration: 5000,
    closable: true
  }

  notifications.value.push(notification)
  emit('error', error)
}

const handleLanguageChange = (language: string) => {
  emit('language-changed', language)
}

const handleThemeChange = (theme: string) => {
  emit('theme-changed', theme)
}

const removeNotification = (id: string) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

const updateTime = () => {
  currentTime.value = new Date()
}

const loadWeatherData = async () => {
  try {
    // 这里可以集成天气API
    // weatherData.value = await weatherAPI.getCurrent()
  } catch (error) {
    console.warn('Failed to load weather data:', error)
  }
}

// 生命周期
onMounted(() => {
  // 启动时间更新
  const timeInterval = setInterval(updateTime, 1000)

  // 加载天气数据
  loadWeatherData()

  // 启动安全监控
  if (props.showSecurityIndicator) {
    startMonitoring()
  }

  // 清理定时器
  return () => {
    clearInterval(timeInterval)
  }
})

// 监听主题变化
watch(() => props.theme, (newTheme) => {
  document.documentElement.setAttribute('data-theme', newTheme)
}, { immediate: true })
</script>

<style scoped lang="scss">
.auth-layout {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  &__background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 0;
  }

  &__container {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 1200px;
    padding: var(--auth-spacing-lg);
  }

  &__content {
    display: flex;
    align-items: stretch;
    min-height: 600px;
    background: var(--auth-secondary);
    border-radius: var(--auth-radius-xl);
    box-shadow: var(--auth-shadow-xl);
    overflow: hidden;
  }

  &__brand {
    flex: 1;
    background: var(--auth-primary);
    color: white;
    padding: var(--auth-spacing-2xl);
    display: flex;
    align-items: center;
    justify-content: center;

    @media (max-width: 1024px) {
      display: none;
    }
  }

  &__auth {
    flex: 1;
    padding: var(--auth-spacing-2xl);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    max-width: 500px;

    &--centered {
      margin: 0 auto;
    }

    &--full {
      max-width: none;
    }
  }

  &__header {
    margin-bottom: var(--auth-spacing-xl);
  }

  &__card-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__footer {
    margin-top: var(--auth-spacing-lg);
  }

  &__security-indicator {
    position: fixed;
    top: var(--auth-spacing-lg);
    right: var(--auth-spacing-lg);
    z-index: 100;
  }

  // 布局变体
  &--split {
    .auth-layout__container {
      max-width: none;
      margin: var(--auth-spacing-xl);
    }
  }

  &--centered {
    .auth-layout__content {
      flex-direction: column;
      max-width: 500px;
      margin: 0 auto;
    }
  }

  &--full {
    .auth-layout__content {
      height: 100vh;
      border-radius: 0;
    }
  }

  // 响应式设计
  @media (max-width: 768px) {
    &__container {
      padding: var(--auth-spacing-md);
    }

    &__auth {
      padding: var(--auth-spacing-lg);
    }

    &__security-indicator {
      position: relative;
      top: auto;
      right: auto;
      margin-bottom: var(--auth-spacing-md);
    }
  }

  // 加载状态
  &--loading {
    pointer-events: none;
    opacity: 0.8;
  }
}
</style>