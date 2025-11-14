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
        <slot name="hero">
          <div class="default-hero">
            <h1>开源浦育</h1>
            <p>ReOpenInnoLab</p>
          </div>
        </slot>
      </div>

      <!-- 右侧登录表单区 -->
      <div class="auth-form-section">
        <div class="auth-container">
          <slot name="form">
            <div class="default-form">
              <h2>欢迎登录</h2>
              <p>请输入您的账户信息</p>
            </div>
          </slot>

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

    <!-- 浮动通知容器 -->
    <div class="notification-container">
      <slot name="notifications">
        <div class="default-notifications"></div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Lock, Document, QuestionFilled, Message } from '@element-plus/icons-vue'

interface Props {
  theme?: 'light' | 'dark'
  showPattern?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'light',
  showPattern: true
})

const emit = defineEmits<{
  linkClick: [type: 'privacy' | 'terms' | 'help' | 'contact']
}>()

const handleLink = (type: 'privacy' | 'terms' | 'help' | 'contact') => {
  emit('linkClick', type)
}
</script>

<style scoped lang="scss">
@use "@/assets/styles/variables.scss";

.auth-layout {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  font-family: 'Inter', 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
}

// 动态背景层
.auth-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.gradient-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.layer-1 {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  opacity: 0.9;
}

.layer-2 {
  background: radial-gradient(circle at 20% 80%, rgba(255, 216, 155, 0.3) 0%, transparent 50%);
  opacity: 0.6;
}

.layer-3 {
  background: radial-gradient(circle at 80% 20%, rgba(240, 147, 251, 0.2) 0%, transparent 50%);
  opacity: 0.4;
}

.pattern-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="%23ffffff" fill-opacity="0.05"><circle cx="5" cy="5" r="2"/><circle cx="25" cy="5" r="2"/><circle cx="45" cy="5" r="2"/><circle cx="5" cy="25" r="2"/><circle cx="25" cy="25" r="2"/><circle cx="45" cy="25" r="2"/><circle cx="5" cy="45" r="2"/><circle cx="25" cy="45" r="2"/><circle cx="45" cy="45" r="2"/></g></svg>') repeat;
  opacity: 0.3;
}

// 主要内容区域
.auth-content {
  position: relative;
  z-index: 10;
  display: flex;
  min-height: 100vh;
}

// 品牌展示区域
.auth-hero-section {
  flex: 1.2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: white;
  position: relative;
  overflow: hidden;
}

.default-hero {
  text-align: center;

  h1 {
    font-size: 3.5rem;
    font-weight: 900;
    margin: 0 0 1rem 0;
    background: linear-gradient(45deg, #ffffff, #f0f0f0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  p {
    font-size: 1.5rem;
    margin: 0;
    opacity: 0.9;
    font-weight: 300;
    letter-spacing: 2px;
  }
}

// 登录表单区域
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

.default-form {
  text-align: center;
  margin-bottom: 2rem;

  h2 {
    font-size: 1.8rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    background: linear-gradient(135deg, #667eea, #764ba2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  p {
    font-size: 1rem;
    color: #64748b;
    margin: 0;
    line-height: 1.5;
  }
}

// 统一页脚
.auth-footer {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e2e8f0;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.footer-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s ease;

  &:hover {
    color: #667eea;
  }

  .el-icon {
    font-size: 14px;
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

// 通知容器
.notification-container {
  position: fixed;
  top: 2rem;
  right: 2rem;
  z-index: 1000;
  max-width: 400px;
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

  .default-hero h1 {
    font-size: 2.5rem;
  }

  .default-hero p {
    font-size: 1.2rem;
  }
}

@media (max-width: 768px) {
  .auth-hero-section {
    min-height: 30vh;
    padding: 1.5rem;
  }

  .default-hero h1 {
    font-size: 2rem;
  }

  .default-hero p {
    font-size: 1rem;
  }

  .auth-container {
    padding: 1.5rem;
  }

  .footer-links {
    flex-direction: column;
    gap: 1rem;
    align-items: center;
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
}
</style>