<template>
  <div class="luxury-auth-layout" :class="{ 'dark-theme': isDarkMode }">
    <!-- 优雅的背景层 -->
    <div class="elegant-background">
      <div class="ambient-gradient"></div>
      <div class="organic-pattern"></div>
      <div class="light-beam"></div>
    </div>

    <!-- 主题切换按钮 -->
    <div class="theme-toggle">
      <el-button
        circle
        size="large"
        @click="toggleTheme"
        class="theme-btn"
        :icon="isDarkMode ? Sunny : Moon"
      />
    </div>

    <!-- 主要内容区域 -->
    <div class="auth-main-container">
      <!-- 左侧品牌展示区 -->
      <div class="brand-showcase">
        <div class="brand-content">
          <!-- 优雅的Logo展示 -->
          <div class="brand-logo-section">
            <div class="logo-wrapper" @mousemove="handleLogoMouseMove" @mouseleave="handleLogoMouseLeave">
              <div class="logo-container" :style="logo3DTransform">
                <div class="logo-image-wrapper">
                  <!-- <img :src="brandLogo" alt="ReOpenInnoLab Logo" class="brand-logo" /> -->
          <div class="brand-logo-placeholder">ReOpenInnoLab</div>
                  <div class="logo-shine"></div>
                </div>
                <div class="logo-aura"></div>
              </div>
            </div>
          </div>

          <!-- 品牌标题 -->
          <div class="brand-typography">
            <h1 class="brand-title">
              <span class="brand-name">{{ brandConfig.mainTitle }}</span>
              <span class="brand-subtitle">{{ brandConfig.subTitle }}</span>
            </h1>
            <p class="brand-description">{{ brandConfig.description }}</p>
          </div>

          <!-- 核心价值展示 -->
          <div class="value-propositions">
            <div class="value-item" v-for="(value, index) in coreValues" :key="index">
              <div class="value-icon">
                <el-icon><component :is="value.icon" /></el-icon>
              </div>
              <span class="value-text">{{ value.text }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧登录区域 -->
      <div class="login-section">
        <div class="login-container">
          <!-- 渐变装饰条 -->
          <div class="accent-bar"></div>

          <!-- 欢迎区域 -->
          <div class="welcome-area">
            <div class="welcome-content">
              <h2 class="welcome-title">{{ welcomeConfig.title }}</h2>
              <p class="welcome-subtitle">{{ welcomeConfig.subtitle }}</p>
            </div>
          </div>

          <!-- 登录表单插槽 -->
          <div class="form-area">
            <slot name="form">
              <div class="form-placeholder">
                <p>请插入登录表单</p>
              </div>
            </slot>
          </div>

          <!-- 底部信息 -->
          <div class="auth-footer">
            <div class="security-badges">
              <div class="badge">
                <el-icon><Lock /></el-icon>
                <span>企业级安全</span>
              </div>
              <div class="badge">
                <el-icon><Lock /></el-icon>
                <span>数据加密</span>
              </div>
            </div>

            <div class="footer-links">
              <a href="#" class="link" @click.prevent="handleLink('privacy')">隐私政策</a>
              <span class="separator">•</span>
              <a href="#" class="link" @click.prevent="handleLink('terms')">服务条款</a>
              <span class="separator">•</span>
              <a href="#" class="link" @click.prevent="handleLink('help')">帮助中心</a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 全屏加载 -->
    <div class="loading-overlay" v-if="isLoading" @click.stop>
      <div class="elegant-loading">
        <div class="loading-ring"></div>
        <p class="loading-text">{{ loadingText }}</p>
      </div>
    </div>

    <!-- 通知容器 -->
    <div class="notification-container">
      <slot name="notifications"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, nextTick } from 'vue'
import {
  Sunny,
  Moon,
  Lock,
  Clock,
  DataAnalysis,
  Monitor,
  User,
  Star
} from '@element-plus/icons-vue'
// import brandLogo from './assets/brand-logo.png'

interface BrandConfig {
  mainTitle: string
  subTitle: string
  description: string
}

interface WelcomeConfig {
  title: string
  subtitle: string
}

interface Feature {
  icon: any
  text: string
}

interface Stat {
  value: string
  label: string
}

interface Props {
  userType?: 'teacher' | 'student' | 'admin'
  theme?: 'light' | 'dark' | 'auto'
  showStats?: boolean
  isLoading?: boolean
  loadingText?: string
  brandConfig?: BrandConfig
  welcomeConfig?: WelcomeConfig
}

const props = withDefaults(defineProps<Props>(), {
  userType: 'teacher',
  theme: 'auto',
  showStats: false,
  isLoading: false,
  loadingText: '正在加载...',
  brandConfig: () => ({
    mainTitle: '开源浦育',
    subTitle: 'ReOpenInnoLab',
    description: '创新教育平台，开启智慧学习新体验'
  }),
  welcomeConfig: () => ({
    title: '欢迎回来',
    subtitle: '请登录您的账户以继续'
  })
})

const emit = defineEmits<{
  linkClick: [type: 'privacy' | 'terms' | 'help' | 'contact']
  themeChange: [theme: 'light' | 'dark']
}>()

// 响应式数据
const particleCanvas = ref<HTMLCanvasElement>()
const isDarkMode = ref(false)

// 3D Logo 效果
const logo3DTransform = ref('transform: rotateX(0deg) rotateY(0deg);')
const logoMousePosition = ref({ x: 0, y: 0 })

// Hero区域鼠标跟随效果
const heroMouseTransform = ref('transform: translate(0px, 0px);')
const heroMousePosition = ref({ x: 0, y: 0 })

// 用户类型文本
const userTypeText = computed(() => {
  const typeMap = {
    teacher: '教师账户',
    student: '学生账户',
    admin: '管理员账户'
  }
  return typeMap[props.userType]
})

// 核心价值展示
const coreValues = ref<Feature[]>([
  { icon: DataAnalysis, text: '智能分析' },
  { icon: Monitor, text: '互动体验' },
  { icon: Star, text: '创新教学' }
])

// 方法
const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  emit('themeChange', isDarkMode.value ? 'dark' : 'light')
  updateThemeClass()
}

const updateThemeClass = () => {
  document.documentElement.classList.toggle('dark', isDarkMode.value)
}

const handleLink = (type: 'privacy' | 'terms' | 'help' | 'contact') => {
  emit('linkClick', type)
}

// 3D Logo 鼠标跟随交互
const handleLogoMouseMove = (event: MouseEvent) => {
  const rect = event.currentTarget.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  const centerX = rect.width / 2
  const centerY = rect.height / 2

  const rotateX = ((y - centerY) / centerY) * 15 // 最大旋转15度
  const rotateY = ((centerX - x) / centerX) * 15 // 最大旋转15度

  logo3DTransform.value = `transform: rotateX(${rotateX}deg) rotateY(${rotateY}deg);`
  logoMousePosition.value = { x, y }
}

const handleLogoMouseLeave = () => {
  logo3DTransform.value = 'transform: rotateX(0deg) rotateY(0deg);'
  logoMousePosition.value = { x: 0, y: 0 }
}

// Hero区域鼠标跟随交互
const handleHeroMouseMove = (event: MouseEvent) => {
  const rect = event.currentTarget.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  const centerX = rect.width / 2
  const centerY = rect.height / 2

  const moveX = ((x - centerX) / centerX) * 10 // 最大移动10px
  const moveY = ((y - centerY) / centerY) * 10

  heroMouseTransform.value = `transform: translate(${moveX}px, ${moveY}px);`
  heroMousePosition.value = { x, y }
}

const handleHeroMouseLeave = () => {
  heroMouseTransform.value = 'transform: translate(0px, 0px);'
  heroMousePosition.value = { x: 0, y: 0 }
}

// 局域网优化：移除粒子动画以提升性能
// 粒子动画在局域网环境下可能造成不必要的性能开销
const initParticleAnimation = () => {
  // 暂时禁用粒子动画以优化局域网性能
  console.log('局域网模式：粒子动画已禁用以优化性能')
}

// 生命周期
onMounted(() => {
  nextTick(() => {
    initParticleAnimation()
  })

  // 检测系统主题
  if (props.theme === 'auto') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    isDarkMode.value = mediaQuery.matches
    mediaQuery.addEventListener('change', (e) => {
      isDarkMode.value = e.matches
      updateThemeClass()
    })
  }

  updateThemeClass()
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})
</script>

<style scoped lang="scss">
@use "@/assets/styles/variables.scss" as *;

.luxury-auth-layout {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
  transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
}

// 优雅的背景层
.elegant-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  overflow: hidden;
}

.ambient-gradient {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background:
    radial-gradient(circle at 20% 80%, rgba(120, 100, 255, 0.12) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 100, 180, 0.12) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(100, 200, 255, 0.10) 0%, transparent 50%);
  // 局域网优化：降低动画频率以减少CPU使用
  animation: ambientFlow 30s ease-in-out infinite;
}

.organic-pattern {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background:
    linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.015) 50%, transparent 70%),
    linear-gradient(-45deg, transparent 30%, rgba(255, 255, 255, 0.015) 50%, transparent 70%);
  background-size: 80px 80px, 80px 80px;
  opacity: 0.25;
  // 局域网优化：降低复杂度和频率
  animation: patternDrift 40s linear infinite;
}

.light-beam {
  position: absolute;
  top: -50%;
  right: -30%;
  width: 60%;
  height: 200%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, transparent 60%);
  transform: rotate(45deg);
  // 局域网优化：减少动画频率
  animation: beamSweep 12s ease-in-out infinite;
}

@keyframes ambientFlow {
  0%, 100% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.1); }
}

@keyframes patternDrift {
  0% { transform: translateX(0) translateY(0); }
  100% { transform: translateX(60px) translateY(60px); }
}

@keyframes beamSweep {
  0%, 100% { opacity: 0.3; transform: rotate(35deg) translateY(-10px); }
  50% { opacity: 0.1; transform: rotate(45deg) translateY(10px); }
}

// 主题切换
.theme-toggle {
  position: absolute;
  top: 2.5rem;
  right: 2.5rem;
  z-index: 100;
}

.theme-btn {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.9);
  transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: scale(1.08) translateY(-2px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }
}

// 主容器
.auth-main-container {
  position: relative;
  z-index: 10;
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(248, 250, 252, 0.95) 50%,
    rgba(241, 245, 249, 0.92) 100%
  );
}

// 品牌展示区
.brand-showcase {
  flex: 1.3;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  position: relative;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%) !important;
  color: #ffffff !important;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 1px;
    height: 80%;
    background: linear-gradient(to bottom,
      transparent 0%,
      rgba(255, 255, 255, 0.1) 20%,
      rgba(255, 255, 255, 0.1) 80%,
      transparent 100%
    );
  }
}

.brand-content {
  text-align: center;
  max-width: 580px;
  animation: fadeInUp 1.2s ease-out;
}

// Logo区域
.brand-logo-section {
  margin-bottom: 3.5rem;
}

.logo-wrapper {
  perspective: 1200px;
  cursor: pointer;
}

.logo-container {
  position: relative;
  display: inline-block;
  transition: transform 0.15s cubic-bezier(0.23, 1, 0.32, 1);
  transform-style: preserve-3d;
}

.logo-image-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 30px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.brand-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 20px;
  filter: brightness(1.1) contrast(1.05);
  transition: all 0.3s ease;
}

.brand-logo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 20px;
  padding: 20px;
  text-align: center;
}

.logo-shine {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 30%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 70%
  );
  animation: shineEffect 3s infinite;
}

.logo-aura {
  position: absolute;
  top: -20px;
  left: -20px;
  right: -20px;
  bottom: -20px;
  background: radial-gradient(circle, rgba(100, 126, 234, 0.08) 0%, transparent 70%);
  border-radius: 40px;
  animation: auraPulse 4s ease-in-out infinite;
}

@keyframes shineEffect {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes auraPulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
}

// 品牌文字
.brand-typography {
  margin-bottom: 3rem;
}

.brand-title {
  font-size: 3.2rem;
  font-weight: 800;
  margin: 0 0 1.5rem 0;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.brand-name {
  display: block;
  background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 50%, #e0e7ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-subtitle {
  display: block;
  font-size: 1.4rem;
  font-weight: 300;
  opacity: 0.95;
  letter-spacing: 0.2em;
  margin-top: 0.5rem;
  background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-description {
  font-size: 1.1rem;
  line-height: 1.7;
  color: #f8fafc !important;
  margin: 0;
  font-weight: 400;
  max-width: 480px;
  margin: 0 auto;
}

// 价值展示
.value-propositions {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.value-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  min-width: 140px;

  &:hover {
    transform: translateY(-4px) scale(1.02);
    background: rgba(255, 255, 255, 0.25);
    box-shadow: 0 20px 40px rgba(236, 72, 153, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
  }
}

.value-icon {
  font-size: 1.8rem;
  color: #ffffff !important;
  opacity: 0.95;
  transition: all 0.3s ease;
}

.value-item:hover .value-icon {
  opacity: 1;
  transform: scale(1.1);
  color: #fef3c7 !important;
}

.value-text {
  font-size: 0.9rem;
  font-weight: 600;
  color: #ffffff !important;
  text-align: center;
  letter-spacing: 0.01em;
}

// 登录区域
.login-section {
  flex: 0.9;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 3rem;
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(30px);
}

.login-container {
  width: 100%;
  max-width: 480px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 32px;
  padding: 3.5rem;
  box-shadow:
    0 32px 64px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.5);
  position: relative;
  overflow: hidden;
  animation: slideInRight 1s ease-out 0.3s both;
}

.accent-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg,
    #3b82f6 0%,
    #8b5cf6 50%,
    #f97316 100%
  );
  background-size: 200% 100%;
  animation: gradientFlow 4s ease infinite;
}

@keyframes gradientFlow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

// 欢迎区域
.welcome-area {
  text-align: center;
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.welcome-content {
  width: 100%;
}

.welcome-title {
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.01em;
}

.welcome-subtitle {
  font-size: 0.95rem;
  color: var(--edu-color-gray-500);
  margin: 0;
  line-height: 1.5;
  font-weight: 400;
}

.user-badge {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #bae6fd;
  border-radius: 20px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(66, 126, 234, 0.4), transparent);
    animation: badgeShimmer 3s infinite;
  }
}

.badge-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: #0277bd;
  letter-spacing: 0.05em;
}

@keyframes badgeShimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

// 表单区域
.form-area {
  margin-bottom: 2.5rem;
}

.form-placeholder {
  padding: 2rem;
  text-align: center;
  background: rgba(248, 250, 252, 0.5);
  border-radius: 16px;
  border: 2px dashed var(--edu-color-gray-300);
  color: var(--edu-color-gray-400);
  font-size: 0.95rem;
}

// 底部信息
.auth-footer {
  text-align: center;
}

.security-badges {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(248, 250, 252, 0.6);
  border: 1px solid rgba(203, 213, 225, 0.4);
  border-radius: 16px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(248, 250, 252, 0.8);
    transform: translateY(-1px);
  }

  .el-icon {
    font-size: 14px;
    color: var(--edu-primary-500);
  }

  span {
    font-size: 0.8rem;
    color: var(--edu-primary-600);
    font-weight: 500;
  }
}

.footer-links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  color: var(--edu-color-gray-400);
  font-size: 0.85rem;
  flex-wrap: wrap;

  .link {
    color: var(--edu-color-gray-500);
    text-decoration: none;
    font-weight: 400;
    transition: color 0.2s ease;

    &:hover {
      color: var(--edu-primary-500);
    }
  }

  .separator {
    color: var(--edu-color-gray-300);
    font-weight: 300;
    margin: 0 0.25rem;
  }
}

// 加载动画
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(20px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.elegant-loading {
  text-align: center;
  color: white;
}

.loading-ring {
  width: 60px;
  height: 60px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top: 3px solid #ffffff;
  border-radius: 50%;
  animation: elegantSpin 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
  margin: 0 auto 1.5rem;
}

.loading-text {
  font-size: 1rem;
  font-weight: 400;
  margin: 0;
  opacity: 0.9;
}

@keyframes elegantSpin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

// 通知容器
.notification-container {
  position: fixed;
  top: 2rem;
  right: 2rem;
  z-index: 1000;
  max-width: 420px;
}

// 动画
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

// 暗色主题
.dark-theme {
  background: linear-gradient(135deg,
    rgba(15, 23, 42, 0.98) 0%,
    rgba(30, 41, 59, 0.95) 50%,
    rgba(51, 65, 85, 0.92) 100%
  );

  .elegant-background {
    .ambient-gradient {
      background:
        radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(59, 130, 246, 0.08) 0%, transparent 50%);
    }

    .organic-pattern {
      background:
        linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.01) 50%, transparent 70%),
        linear-gradient(-45deg, transparent 30%, rgba(255, 255, 255, 0.01) 50%, transparent 70%);
      opacity: 0.2;
    }
  }

  .theme-btn {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.8);
  }

  .brand-showcase::before {
    background: linear-gradient(to bottom,
      transparent 0%,
      rgba(255, 255, 255, 0.06) 20%,
      rgba(255, 255, 255, 0.06) 80%,
      transparent 100%
    );
  }

  .brand-title {
    .brand-name {
      background: linear-gradient(135deg, var(--edu-color-gray-100) 0%, var(--edu-color-gray-200) 50%, var(--edu-color-gray-300) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .brand-subtitle {
      background: linear-gradient(135deg, var(--edu-color-gray-300) 0%, var(--edu-color-gray-200) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }

  .brand-description {
    color: var(--edu-color-gray-300);
  }

  .value-item {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);

    &:hover {
      background: rgba(255, 255, 255, 0.15);
    }
  }

  .value-icon,
  .value-text {
    color: var(--edu-color-gray-300);
  }

  .login-section {
    background: rgba(255, 255, 255, 0.05);
  }

  .login-container {
    background: rgba(30, 41, 59, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .welcome-title {
    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .welcome-subtitle {
    color: var(--edu-color-gray-400);
  }

  .user-badge {
    background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%);
    border: 1px solid #3b82f6;
  }

  .badge-text {
    color: #60a5fa;
  }

  .form-placeholder {
    background: rgba(30, 41, 59, 0.5);
    border-color: #475569;
    color: var(--edu-color-gray-400);
  }

  .badge {
    background: rgba(30, 41, 59, 0.5);
    border-color: rgba(148, 163, 184, 0.3);

    .el-icon {
      color: #60a5fa;
    }

    span {
      color: #93c5fd;
    }
  }

  .footer-links {
    .link {
      color: var(--edu-color-gray-400);

      &:hover {
        color: #60a5fa;
      }
    }

    .separator {
      color: #475569;
    }
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .brand-showcase {
    flex: 1;
  }

  .login-section {
    flex: 1;
  }
}

@media (max-width: 1024px) {
  .auth-main-container {
    flex-direction: column;
  }

  .brand-showcase {
    flex: none;
    min-height: 45vh;
    padding: 3rem 2rem;

    &::before {
      display: none;
    }
  }

  .login-section {
    flex: 1;
    padding: 3rem 2rem;
  }

  .brand-title {
    font-size: 2.8rem;
  }

  .brand-subtitle {
    font-size: 1.2rem;
  }

  .brand-description {
    font-size: 1rem;
  }
}

@media (max-width: 768px) {
  .brand-showcase {
    min-height: 35vh;
    padding: 2rem 1.5rem;
  }

  .login-section {
    padding: 2rem 1.5rem;
  }

  .brand-title {
    font-size: 2.4rem;
  }

  .brand-subtitle {
    font-size: 1.1rem;
  }

  .value-propositions {
    flex-direction: column;
    gap: 1rem;
  }

  .welcome-area {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .login-container {
    padding: 2.5rem 2rem;
  }

  .security-badges {
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }

  .footer-links {
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
  }

  .theme-toggle {
    top: 1.5rem;
    right: 1.5rem;
  }

  .notification-container {
    top: 1.5rem;
    right: 1.5rem;
    left: 1.5rem;
    max-width: none;
  }
}

@media (max-width: 480px) {
  .brand-showcase {
    min-height: 30vh;
    padding: 1.5rem;
  }

  .login-section {
    padding: 1.5rem;
  }

  .brand-title {
    font-size: 2rem;
  }

  .brand-subtitle {
    font-size: 1rem;
  }

  .brand-description {
    font-size: 0.9rem;
  }

  .login-container {
    padding: 2rem 1.5rem;
  }

  .logo-image-wrapper {
    width: 100px;
    height: 100px;
    border-radius: 24px;
  }
}
</style>
