<template>
  <div class="auth-layout">
    <!-- 动态背景层 -->
    <div class="auth-background">
      <div class="gradient-layer layer-1"></div>
      <div class="gradient-layer layer-2"></div>
      <div class="gradient-layer layer-3"></div>
      <div class="pattern-overlay"></div>
    </div>

    <!-- 主要内容区域 -->
    <div class="auth-content">
      <!-- 左侧品牌展示区 -->
      <div class="auth-hero-section">
        <!-- 左上角Logo区域 -->
        <div class="logo-section">
          <div class="logo-container">
            <img src="/brand-logo.png" alt="ReOpenInnoLab Logo" class="brand-logo-img" />
          </div>
        </div>

        <div class="brand-typography">
          <h1 class="brand-title">
            <span class="brand-name">开源浦育</span>
            <span class="brand-subtitle">ReOpenInnoLab</span>
          </h1>
          <p class="brand-description">创新教育平台，开启智慧教学新体验</p>
        </div>

        <!-- 核心价值展示 -->
        <div class="value-propositions">
          <div class="value-item">
            <div class="value-icon">
              <el-icon><DataAnalysis /></el-icon>
            </div>
            <span class="value-text">智能分析</span>
          </div>
          <div class="value-item">
            <div class="value-icon">
              <el-icon><Monitor /></el-icon>
            </div>
            <span class="value-text">互动体验</span>
          </div>
          <div class="value-item">
            <div class="value-icon">
              <el-icon><Star /></el-icon>
            </div>
            <span class="value-text">创新教学</span>
          </div>
        </div>
      </div>

      <!-- 右侧登录表单区 -->
      <div class="auth-form-section">
        <div class="auth-container">
          <div class="form-branding">
            <div class="form-logo">
              <div class="form-logo-icon">
                <img src="/brand-logo.png" alt="ReOpenInnoLab Icon" />
              </div>
              <div class="form-logo-text">
                <span class="form-logo-title">ReOpenInnoLab</span>
                <span class="form-logo-subtitle">智能教育教师端</span>
              </div>
            </div>
          </div>
          <!-- 欢迎区域 -->
          <div class="welcome-area">
            <div class="welcome-content">
              <h2 class="welcome-title">教师登录</h2>
            </div>
          </div>

          <!-- 登录表单 -->
          <div class="form-area">
            <EnhancedLoginForm
              ref="loginFormRef"
              user-type="teacher"
              :loading="loading"
              :loading-text="'正在登录...'"
              :show-multiple-methods="false"
              :show-third-party="false"
              :show-register="false"
              :remember-text="'记住我'"
              :forgot-password-text="'忘记密码？'"
              :submit-button-text="'教师登录'"
              :security-tip-text="'您的教学数据将被安全加密保护'"
              @submit="handleLogin"
              @forgot-password="showForgotPassword"
              @clear-error="clearError"
            />
          </div>

          <!-- 统一页脚 -->
          <div class="auth-footer">
            <div class="footer-links">
              <a href="#" class="footer-link" @click.prevent="handleLink('privacy')">
                <el-icon><Lock /></el-icon>
                隐私政策
              </a>
              <a href="#" class="footer-link" @click.prevent="handleLink('terms')">
                <el-icon><Document /></el-icon>
                服务条款
              </a>
              <a href="#" class="footer-link" @click.prevent="handleLink('help')">
                <el-icon><QuestionFilled /></el-icon>
                帮助中心
              </a>
              <a href="#" class="footer-link" @click.prevent="handleLink('contact')">
                <el-icon><Message /></el-icon>
                联系我们
              </a>
            </div>
            <div class="footer-copyright">
              <p>© 2024 开源浦育. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { EnhancedLoginForm } from '@reopeninnolab/ui-kit'
import { useUserStore } from '@/stores/user'
import { DataAnalysis, Monitor, Star, Lock, Document, QuestionFilled, Message } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loginFormRef = ref()
const loading = ref(false)
const errorMessage = ref('')

const brandConfig = computed(() => ({
  mainTitle: '开源浦育',
  subTitle: 'ReOpenInnoLab',
  description: '创新教育平台，开启智慧教学新体验'
}))

const welcomeConfig = computed(() => ({
  title: '教师登录',
  subtitle: '请登录以访问教学管理功能'
}))

const handleLogin = async (credentials: any) => {
  errorMessage.value = ''
  loading.value = true

  try {
    console.log('Login credentials received:', credentials)
    console.log('  - credentials.username:', credentials.username)
    console.log('  - credentials.email:', credentials.email)
    console.log('  - credentials.password:', credentials.password ? '[HIDDEN]' : 'EMPTY')
    console.log('  - credentials.rememberMe:', credentials.rememberMe)

    const loginData = {
      username: credentials.username,
      password: credentials.password,
      role: 'teacher',
      remember: credentials.rememberMe
    }
    console.log('Login data to send:', loginData)

    await userStore.login(loginData)
    console.log('登录成功')

    const redirect = route.query.redirect as string
    router.push(redirect || '/dashboard')

  } catch (error: any) {
    console.error('登录失败:', error)
    throw error
  } finally {
    loading.value = false
  }
}

const showForgotPassword = () => {
  console.log('密码重置功能')
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

  console.log(`即将跳转到${type === 'privacy' ? '隐私政策' : type === 'terms' ? '服务条款' : type === 'help' ? '帮助中心' : '联系我们'}页面`)

  setTimeout(() => {
    router.push(linkMap[type])
  }, 500)
}
</script>

<style scoped lang="scss">
@import "@/assets/styles/variables.scss";

.auth-layout {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  font-family: 'Inter', 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
  --brand-blue: #2563eb;
  --brand-blue-rgb: 37, 99, 235;
  --brand-indigo-rgb: 79, 70, 229;
  --brand-purple: #7c3aed;
  --brand-purple-rgb: 124, 58, 237;
  --brand-orange: #fb923c;
  --brand-orange-rgb: 251, 146, 60;
  --brand-orange-deep-rgb: 249, 115, 22;
  --brand-slate: #0f172a;
  --brand-card-bg: #f8fafc;
  --brand-card-border: rgba(15, 23, 42, 0.08);
}

// 动态背景层
.auth-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.gradient-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.8;
}

.layer-1 {
  background: linear-gradient(135deg,
    rgba(var(--brand-blue-rgb), 0.98) 0%,
    rgba(var(--brand-indigo-rgb), 0.96) 30%,
    rgba(var(--brand-purple-rgb), 0.92) 60%,
    rgba(var(--brand-orange-rgb), 0.88) 85%,
    rgba(var(--brand-orange-deep-rgb), 0.85) 100%
  );
  animation: gradientShift 15s ease-in-out infinite alternate;
}

.layer-2 {
  background: radial-gradient(circle at 30% 20%,
    rgba(var(--brand-blue-rgb), 0.55) 0%,
    rgba(var(--brand-indigo-rgb), 0.35) 30%,
    transparent 60%
  );
  animation: floatAnimation 20s ease-in-out infinite;
}

.layer-3 {
  background: radial-gradient(circle at 70% 80%,
    rgba(var(--brand-purple-rgb), 0.35) 0%,
    rgba(var(--brand-blue-rgb), 0.22) 35%,
    rgba(var(--brand-orange-rgb), 0.16) 55%,
    transparent 70%
  );
  animation: floatAnimation 25s ease-in-out infinite reverse;
}

.pattern-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 2px, transparent 2px),
    radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.1) 2px, transparent 2px);
  background-size: 60px 60px;
  animation: patternMove 30s linear infinite;
}

// 主要内容区域
.auth-content {
  position: relative;
  z-index: 10;
  display: flex;
  min-height: 100vh;
}

// 左侧品牌展示区
.auth-hero-section {
  flex: 1.8;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 3rem 2rem;
  position: relative;
  color: #ffffff;
}

// Logo区域
.logo-section {
  position: absolute;
  top: 2rem;
  left: 2rem;
}

.logo-container {
  position: relative;
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 20px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.1),
    0 2px 8px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.4);
    transform: translateY(-2px) scale(1.02);
    box-shadow:
      0 16px 48px rgba(0, 0, 0, 0.15),
      0 4px 16px rgba(0, 0, 0, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.4);
  }

  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(135deg,
      rgba(var(--brand-blue-rgb), 0.35) 0%,
      rgba(var(--brand-purple-rgb), 0.3) 55%,
      rgba(var(--brand-orange-rgb), 0.3) 100%
    );
    border-radius: 22px;
    z-index: -1;
    opacity: 0.8;
    transition: opacity 0.3s ease;
  }

  &:hover::before {
    opacity: 1;
  }
}

.brand-logo-img {
  width: 160px;
  height: 80px;
  object-fit: contain;
  filter: brightness(1.1) contrast(1.05) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
    filter: brightness(1.2) contrast(1.1) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
  }
}

.brand-typography {
  text-align: center;
  max-width: 600px;
  margin-bottom: 3rem;
}

.brand-title {
  font-size: 3.5rem;
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
  font-size: 1.5rem;
  font-weight: 300;
  opacity: 0.95;
  letter-spacing: 0.2em;
  margin-top: 0.5rem;
  background: linear-gradient(135deg, var(--brand-orange) 0%, var(--brand-purple) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-description {
  font-size: 1.2rem;
  line-height: 1.7;
  color: #f8fafc;
  margin: 0;
  font-weight: 400;
  max-width: 500px;
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
    box-shadow: 0 20px 40px rgba(var(--brand-orange-rgb), 0.4);
    border-color: rgba(255, 255, 255, 0.5);
  }
}

.value-icon {
  font-size: 2rem;
  color: #ffffff;
  opacity: 0.95;
  transition: all 0.3s ease;
}

.value-item:hover .value-icon {
  opacity: 1;
  transform: scale(1.1);
  color: var(--brand-orange);
}

.value-text {
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  text-align: center;
  letter-spacing: 0.01em;
}

// 右侧登录表单区
.auth-form-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(140deg,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(248, 250, 252, 0.95) 60%,
    rgba(237, 242, 255, 0.92) 100%
  );
  backdrop-filter: blur(20px);
  position: relative;
  overflow: hidden;
}

.auth-form-section::before,
.auth-form-section::after {
  content: '';
  position: absolute;
  border-radius: 999px;
  filter: blur(45px);
  opacity: 0.55;
  pointer-events: none;
}

.auth-form-section::before {
  width: 55%;
  height: 55%;
  top: -10%;
  right: -15%;
  background: radial-gradient(circle,
    rgba(var(--brand-blue-rgb), 0.5) 0%,
    transparent 70%
  );
}

.auth-form-section::after {
  width: 45%;
  height: 45%;
  bottom: -15%;
  left: -10%;
  background: radial-gradient(circle,
    rgba(var(--brand-orange-rgb), 0.35) 0%,
    transparent 75%
  );
}

.auth-container {
  width: 100%;
  max-width: 420px;
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid var(--brand-card-border);
  box-shadow:
    0 25px 60px rgba(15, 23, 42, 0.15),
    0 10px 25px rgba(var(--brand-blue-rgb), 0.08);
  position: relative;
  isolation: isolate;
}

.auth-container::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 30px;
  background: linear-gradient(135deg,
    rgba(var(--brand-blue-rgb), 0.25) 0%,
    rgba(var(--brand-purple-rgb), 0.25) 50%,
    rgba(var(--brand-orange-rgb), 0.3) 100%
  );
  z-index: -1;
  opacity: 0.8;
}

.auth-container::after {
  content: '';
  position: absolute;
  width: 140px;
  height: 140px;
  bottom: 1.5rem;
  right: 1.5rem;
  background: radial-gradient(circle,
    rgba(var(--brand-purple-rgb), 0.25) 0%,
    transparent 70%
  );
  z-index: -1;
}

.form-branding {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-radius: 20px;
  background: linear-gradient(120deg,
    rgba(var(--brand-blue-rgb), 0.08),
    rgba(var(--brand-purple-rgb), 0.08)
  );
  border: 1px solid rgba(var(--brand-blue-rgb), 0.15);
  box-shadow: 0 15px 25px rgba(var(--brand-blue-rgb), 0.08);
}

.form-logo {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

.form-logo-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: radial-gradient(circle at 30% 30%,
    rgba(var(--brand-orange-rgb), 0.85),
    rgba(var(--brand-purple-rgb), 0.75)
  );
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  box-shadow:
    0 12px 25px rgba(var(--brand-orange-rgb), 0.25),
    0 4px 10px rgba(var(--brand-blue-rgb), 0.12);
}

.form-logo-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(15, 23, 42, 0.25));
}

.form-logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.form-logo-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
}

.form-logo-subtitle {
  font-size: 0.85rem;
  color: #64748b;
}


// 欢迎区域
.welcome-area {
  text-align: center;
  margin-bottom: 1rem;
}

.welcome-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.welcome-subtitle {
  font-size: 1rem;
  color: #64748b;
  margin: 0;
}

// 表单区域
.form-area {
  width: 100%;
}

// 页脚
.auth-footer {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.footer-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  text-decoration: none;
  font-size: 0.875rem;
  transition: all 0.2s ease;

  &:hover {
    color: #3b82f6;
  }
}

.footer-copyright {
  text-align: center;
  color: #94a3b8;
  font-size: 0.75rem;
  margin: 0;
}

// 动画
@keyframes gradientShift {
  0%, 100% {
    transform: translateX(0) translateY(0) scale(1);
    filter: hue-rotate(0deg) brightness(1);
  }
  20% {
    transform: translateX(-15px) translateY(-8px) scale(1.05);
    filter: hue-rotate(8deg) brightness(1.1);
  }
  40% {
    transform: translateX(8px) translateY(-12px) scale(1.03);
    filter: hue-rotate(-5deg) brightness(1.05);
  }
  60% {
    transform: translateX(-8px) translateY(6px) scale(1.02);
    filter: hue-rotate(3deg) brightness(0.95);
  }
  80% {
    transform: translateX(5px) translateY(-4px) scale(1.01);
    filter: hue-rotate(-2deg) brightness(1.02);
  }
}

@keyframes floatAnimation {
  0%, 100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.6;
  }
  25% {
    transform: translate(20px, -15px) scale(1.1);
    opacity: 0.7;
  }
  50% {
    transform: translate(30px, -25px) scale(1.2);
    opacity: 0.8;
  }
  75% {
    transform: translate(15px, -10px) scale(1.1);
    opacity: 0.7;
  }
}


@keyframes patternMove {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 60px 60px;
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
    padding: 2rem 1rem;
  }

  .auth-form-section {
    flex: 1;
    padding: 2rem 1rem;
  }

  .brand-title {
    font-size: 2.5rem;
  }

  .brand-subtitle {
    font-size: 1.2rem;
  }

  .value-propositions {
    flex-direction: column;
    gap: 1rem;
  }

  .logo-container {
    padding: 0.75rem 1rem;
  }

  .brand-logo-img {
    width: 140px;
    height: 70px;
  }
}

@media (max-width: 768px) {
  .auth-hero-section {
    min-height: 30vh;
    padding: 1.5rem;
  }

  .auth-form-section {
    padding: 1.5rem;
  }

  .brand-title {
    font-size: 2rem;
  }

  .brand-subtitle {
    font-size: 1rem;
  }

  .brand-description {
    font-size: 1rem;
  }

  .value-item {
    min-width: 120px;
    padding: 1rem;
  }

  .auth-container {
    padding: 1.5rem;
  }

  .footer-links {
    gap: 1rem;
  }

  .logo-container {
    padding: 0.5rem 0.75rem;
  }

  .brand-logo-img {
    width: 120px;
    height: 60px;
  }

  .form-logo-icon {
    width: 44px;
    height: 44px;
  }

  .form-branding {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .auth-hero-section {
    min-height: 25vh;
    padding: 1rem;
  }

  .auth-form-section {
    padding: 1rem;
  }

  .brand-title {
    font-size: 1.8rem;
  }

  .brand-subtitle {
    font-size: 0.9rem;
  }

  .value-propositions {
    gap: 0.75rem;
  }

  .value-item {
    padding: 0.75rem;
    min-width: 100px;
  }

  .value-icon {
    font-size: 1.5rem;
  }

  .value-text {
    font-size: 0.875rem;
  }

  .auth-container {
    padding: 1rem;
  }

  .footer-links {
    flex-direction: column;
    gap: 0.5rem;
  }

  .logo-container {
    padding: 0.4rem 0.6rem;
  }

  .brand-logo-img {
    width: 100px;
    height: 50px;
  }

  .form-logo-icon {
    width: 40px;
    height: 40px;
  }

  .form-branding {
    padding: 0.75rem;
  }

  .form-logo {
    gap: 0.6rem;
  }

  .welcome-title {
    font-size: 1.6rem;
  }

  // 在小屏幕上确保品牌卡片始终可见
  .form-branding {
    order: -1;
    margin-bottom: 0.5rem;
  }
}
</style>
