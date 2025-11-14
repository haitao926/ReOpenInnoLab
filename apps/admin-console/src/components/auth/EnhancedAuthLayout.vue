<template>
  <div class="enhanced-auth-layout" :class="{ 'dark-theme': isDarkMode }">
    <!-- 动态粒子背景 -->
    <div class="particle-background">
      <canvas ref="particleCanvas" class="particle-canvas"></canvas>
    </div>

    <!-- 浮动几何形状装饰 -->
    <div class="floating-shapes">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
      <div class="shape shape-4"></div>
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
    <div class="auth-content">
      <!-- 左侧品牌展示区 -->
      <div class="auth-hero-section">
        <div class="hero-content">
          <!-- Logo动画 -->
          <div class="logo-container">
            <div class="logo-animation">
              <div class="logo-core">
                <el-icon size="48"><Trophy /></el-icon>
              </div>
              <div class="logo-ring"></div>
              <div class="logo-particles"></div>
            </div>
          </div>

          <!-- 动态文字 -->
          <div class="hero-text">
            <h1 class="hero-title">
              <span class="title-main">{{ brandConfig.mainTitle }}</span>
              <span class="title-sub">{{ brandConfig.subTitle }}</span>
            </h1>
            <p class="hero-description">{{ brandConfig.description }}</p>
          </div>

          <!-- 特性展示 -->
          <div class="features-showcase">
            <div class="feature-item" v-for="(feature, index) in features" :key="index">
              <div class="feature-icon">
                <el-icon><component :is="feature.icon" /></el-icon>
              </div>
              <span class="feature-text">{{ feature.text }}</span>
            </div>
          </div>

          <!-- 统计数据动画 -->
          <div class="stats-container" v-if="showStats">
            <div class="stat-item" v-for="(stat, index) in stats" :key="index">
              <div class="stat-number">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧登录表单区 -->
      <div class="auth-form-section">
        <div class="auth-container">
          <!-- 欢迎信息 -->
          <div class="welcome-section">
            <div class="welcome-header">
              <h2 class="welcome-title">{{ welcomeConfig.title }}</h2>
              <p class="welcome-subtitle">{{ welcomeConfig.subtitle }}</p>
            </div>

            <!-- 用户类型指示器 -->
            <div class="user-type-indicator">
              <div class="indicator-dot"></div>
              <span class="indicator-text">{{ userTypeText }}</span>
            </div>
          </div>

          <!-- 登录表单插槽 -->
          <div class="form-section">
            <slot name="form">
              <div class="default-form">
                <p>请插入登录表单</p>
              </div>
            </slot>
          </div>

          <!-- 增强的页脚 -->
          <div class="enhanced-footer">
            <div class="footer-security">
              <div class="security-item">
                <el-icon><Lock /></el-icon>
                <span>SSL加密</span>
              </div>
              <div class="security-item">
                <el-icon><Key /></el-icon>
                <span>安全认证</span>
              </div>
              <div class="security-item">
                <el-icon><Clock /></el-icon>
                <span>24/7监控</span>
              </div>
            </div>

            <div class="footer-links">
              <a href="#" class="footer-link" @click.prevent="handleLink('privacy')">
                隐私政策
              </a>
              <a href="#" class="footer-link" @click.prevent="handleLink('terms')">
                服务条款
              </a>
              <a href="#" class="footer-link" @click.prevent="handleLink('help')">
                帮助中心
              </a>
            </div>

            <div class="footer-copyright">
              <p>© 2024 {{ brandConfig.mainTitle }}. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 全屏加载动画 -->
    <div class="loading-overlay" v-if="isLoading" @click.stop>
      <div class="loading-content">
        <div class="loading-spinner"></div>
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
  Trophy,
  Sunny,
  Moon,
  Lock,
  Clock,
  DataAnalysis,
  Monitor,
  User,
  Star,
  Key
} from '@element-plus/icons-vue'

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
  showStats: true,
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

// 用户类型文本
const userTypeText = computed(() => {
  const typeMap = {
    teacher: '教师账户',
    student: '学生账户',
    admin: '管理员账户'
  }
  return typeMap[props.userType]
})

// 特性配置
const features = ref<Feature[]>([
  { icon: DataAnalysis, text: '智能数据分析' },
  { icon: Monitor, text: '互动实验室' },
  { icon: User, text: '个性化学习' },
  { icon: Star, text: '创新教学模式' }
])

// 统计数据
const stats = ref<Stat[]>([
  { value: '10,000+', label: '活跃用户' },
  { value: '500+', label: '精品课程' },
  { value: '50+', label: '合作院校' }
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

// 粒子动画
let animationId: number
const initParticleAnimation = () => {
  const canvas = particleCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const resizeCanvas = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }

  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)

  const particles: Array<{
    x: number
    y: number
    vx: number
    vy: number
    size: number
    opacity: number
  }> = []

  // 创建粒子
  for (let i = 0; i < 50; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.5 + 0.2
    })
  }

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    particles.forEach(particle => {
      particle.x += particle.vx
      particle.y += particle.vy

      if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
      if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1

      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`
      ctx.fill()
    })

    animationId = requestAnimationFrame(animate)
  }

  animate()
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

.enhanced-auth-layout {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  font-family: 'Inter', 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
  transition: all 0.3s ease;
}

// 粒子背景
.particle-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.particle-canvas {
  width: 100%;
  height: 100%;
}

// 浮动几何形状
.floating-shapes {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  pointer-events: none;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(45deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  backdrop-filter: blur(10px);
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  width: 300px;
  height: 300px;
  top: 10%;
  left: 5%;
  animation-delay: 0s;
}

.shape-2 {
  width: 200px;
  height: 200px;
  top: 60%;
  right: 10%;
  animation-delay: 1s;
}

.shape-3 {
  width: 150px;
  height: 150px;
  bottom: 20%;
  left: 15%;
  animation-delay: 2s;
}

.shape-4 {
  width: 250px;
  height: 250px;
  top: 30%;
  right: 5%;
  animation-delay: 3s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

// 主题切换
.theme-toggle {
  position: absolute;
  top: 2rem;
  right: 2rem;
  z-index: 100;
}

.theme-btn {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
  }
}

// 主要内容
.auth-content {
  position: relative;
  z-index: 10;
  display: flex;
  min-height: 100vh;
}

// 品牌展示区
.auth-hero-section {
  flex: 1.2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  position: relative;
  overflow: hidden;
}

.hero-content {
  text-align: center;
  max-width: 600px;
}

// Logo动画
.logo-container {
  margin-bottom: 3rem;
}

.logo-animation {
  position: relative;
  display: inline-block;
}

.logo-core {
  position: relative;
  z-index: 3;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-ring {
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 25px;
  animation: ringRotate 3s linear infinite;
}

.logo-particles {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes ringRotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
  50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.8; }
}

// 动态文字
.hero-text {
  margin-bottom: 3rem;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 900;
  margin: 0 0 1rem 0;
  line-height: 1.1;
}

.title-main {
  display: block;
  background: linear-gradient(45deg, #ffffff, #f0f0f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.title-sub {
  display: block;
  font-size: 1.8rem;
  font-weight: 300;
  opacity: 0.9;
  letter-spacing: 3px;
  margin-top: 0.5rem;
}

.hero-description {
  font-size: 1.2rem;
  line-height: 1.6;
  opacity: 0.9;
  margin: 0;
  font-weight: 300;
}

// 特性展示
.features-showcase {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.15);
  }
}

.feature-icon {
  font-size: 2rem;
  opacity: 0.9;
}

.feature-text {
  font-size: 0.9rem;
  font-weight: 500;
  text-align: center;
}

// 统计数据
.stats-container {
  display: flex;
  justify-content: space-around;
  gap: 2rem;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
  font-weight: 300;
}

// 登录表单区
.auth-form-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
}

.auth-container {
  width: 100%;
  max-width: 500px;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 24px;
  padding: 3rem;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
    background-size: 200% 100%;
    animation: gradientShift 3s ease infinite;
  }
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

// 欢迎区域
.welcome-section {
  text-align: center;
  margin-bottom: 2rem;
}

.welcome-header {
  margin-bottom: 1.5rem;
}

.welcome-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-subtitle {
  font-size: 1rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

.user-type-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 20px;
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #667eea;
  animation: dotPulse 2s ease-in-out infinite;
}

.indicator-text {
  font-size: 0.9rem;
  color: #667eea;
  font-weight: 500;
}

@keyframes dotPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

// 表单区域
.form-section {
  margin-bottom: 2rem;
}

// 增强页脚
.enhanced-footer {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e2e8f0;
}

.footer-security {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.security-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-size: 0.85rem;

  .el-icon {
    font-size: 16px;
  }
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.footer-link {
  color: #64748b;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s ease;

  &:hover {
    color: #667eea;
  }
}

.footer-copyright {
  text-align: center;

  p {
    margin: 0;
    font-size: 0.85rem;
    color: #94a3b8;
  }
}

// 全屏加载
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-content {
  text-align: center;
  color: white;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 1.1rem;
  margin: 0;
}

// 通知容器
.notification-container {
  position: fixed;
  top: 2rem;
  right: 2rem;
  z-index: 1000;
  max-width: 400px;
}

// 暗色主题
.dark-theme {
  .auth-form-section {
    background: rgba(30, 41, 59, 0.95);
  }

  .auth-container {
    background: rgba(30, 41, 59, 0.98);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .welcome-subtitle {
    color: #cbd5e1;
  }

  .footer-security,
  .footer-link,
  .footer-copyright p {
    color: #cbd5e1;
  }

  .enhanced-footer {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
}

// 响应式设计
@media (max-width: 1024px) {
  .auth-content {
    flex-direction: column;
  }

  .auth-hero-section {
    flex: none;
    min-height: 40vh;
    padding: 2rem;
  }

  .auth-form-section {
    flex: 1;
    padding: 2rem 1rem;
  }

  .auth-container {
    padding: 2rem;
    max-width: 400px;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .title-sub {
    font-size: 1.4rem;
  }

  .features-showcase {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .auth-hero-section {
    min-height: 30vh;
    padding: 1.5rem;
  }

  .hero-title {
    font-size: 2rem;
  }

  .title-sub {
    font-size: 1.2rem;
  }

  .hero-description {
    font-size: 1rem;
  }

  .auth-container {
    padding: 1.5rem;
  }

  .footer-security {
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }

  .footer-links {
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }

  .theme-toggle {
    top: 1rem;
    right: 1rem;
  }

  .notification-container {
    top: 1rem;
    right: 1rem;
    left: 1rem;
    max-width: none;
  }
}

@media (max-width: 480px) {
  .auth-container {
    padding: 1rem;
  }

  .stats-container {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>