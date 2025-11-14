<template>
  <div class="login-form-wrapper">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <h2 class="welcome-title">{{ welcomeTitle }}</h2>
      <p class="welcome-subtitle">{{ welcomeSubtitle }}</p>
    </div>

    <!-- 登录表单 -->
    <el-form
      ref="loginFormRef"
      :model="loginForm"
      :rules="loginRules"
      class="login-form"
      @submit.prevent="handleSubmit"
    >
      <el-form-item prop="email">
        <el-input
          v-model="loginForm.email"
          :placeholder="emailPlaceholder"
          size="large"
          :prefix-icon="Message"
          class="enhanced-input"
          :aria-label="emailPlaceholder"
          :loading="loading"
        />
      </el-form-item>

      <el-form-item prop="password">
        <el-input
          v-model="loginForm.password"
          type="password"
          :placeholder="passwordPlaceholder"
          size="large"
          :prefix-icon="Lock"
          show-password
          @keyup.enter="handleSubmit"
          class="enhanced-input"
          :aria-label="passwordPlaceholder"
          :loading="loading"
        />
      </el-form-item>

      <div class="form-options">
        <el-checkbox v-model="rememberMe" class="remember-checkbox" :disabled="loading">
          <span class="checkbox-label">
            <el-icon><Lock /></el-icon>
            {{ rememberMeText }}
          </span>
        </el-checkbox>
        <el-button link @click="handleForgotPassword" class="forgot-link" :disabled="loading">
          {{ forgotPasswordText }}
        </el-button>
      </div>

      <el-form-item>
        <el-button
          type="primary"
          size="large"
          :loading="loading"
          @click="handleSubmit"
          class="login-button enhanced-button"
          :aria-label="loginButtonText"
        >
          <el-icon v-if="!loading"><Right /></el-icon>
          {{ loading ? loadingText : loginButtonText }}
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 注册链接 -->
    <div class="register-section">
      <div class="register-content">
        <span class="register-text">{{ registerText }}</span>
        <el-button link @click="handleRegister" class="register-link" :disabled="loading">
          {{ registerButtonText }}
          <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      <div class="login-alternatives">
        <el-button link size="small" @click="handleHelp" class="help-link" :disabled="loading">
          <el-icon><QuestionFilled /></el-icon>
          {{ helpText }}
        </el-button>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="errorMessage" class="error-message" role="alert" aria-live="polite">
      <el-icon class="error-icon"><CircleCloseFilled /></el-icon>
      <span>{{ errorMessage }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import {
  Message, Lock, Right, QuestionFilled, ArrowRight, CircleCloseFilled
} from '@element-plus/icons-vue'

interface Props {
  userType?: 'student' | 'teacher' | 'admin'
  loading?: boolean
  errorMessage?: string
  initialEmail?: string
  showPersonalizedGreeting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  userType: 'student',
  loading: false,
  errorMessage: '',
  initialEmail: '',
  showPersonalizedGreeting: false
})

const emit = defineEmits<{
  submit: [credentials: { email: string; password: string; rememberMe: boolean }]
  forgotPassword: []
  register: []
  help: []
  clearError: []
}>()

// 表单引用
const loginFormRef = ref<FormInstance>()

// 表单数据
const loginForm = reactive({
  email: props.initialEmail,
  password: ''
})

// 记住我
const rememberMe = ref(false)

// 根据用户类型定制文案
const welcomeTitle = computed(() => {
  const titles = {
    student: '欢迎回来，同学',
    teacher: '欢迎回来，老师',
    admin: '欢迎回来，管理员'
  }
  return titles[props.userType]
})

const welcomeSubtitle = computed(() => {
  const subtitles = {
    student: '开始您的学习之旅吧！',
    teacher: '管理您的教学工作吧！',
    admin: '管理系统设置吧！'
  }
  return subtitles[props.userType]
})

const emailPlaceholder = '请输入邮箱地址'
const passwordPlaceholder = '请输入密码'
const rememberMeText = '记住我（30天）'
const forgotPasswordText = '忘记密码？'
const loginButtonText = '立即登录'
const loadingText = '登录中...'
const registerText = '还没有账号？'
const registerButtonText = '立即注册'
const helpText = '登录遇到问题？'

// 表单验证规则
const loginRules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位字符', trigger: 'blur' }
  ]
}

// 方法
const handleSubmit = async () => {
  if (!loginFormRef.value || props.loading) return

  try {
    await loginFormRef.value.validate()
    emit('submit', {
      email: loginForm.email,
      password: loginForm.password,
      rememberMe: rememberMe.value
    })
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

const handleForgotPassword = () => {
  emit('forgotPassword')
}

const handleRegister = () => {
  emit('register')
}

const handleHelp = () => {
  emit('help')
}

// 清除错误信息
const clearError = () => {
  if (props.errorMessage) {
    emit('clearError')
  }
}

// 监听输入变化以清除错误
const handleInputChange = () => {
  clearError()
}

// 暴露方法给父组件
defineExpose({
  clearForm: () => {
    loginForm.password = ''
    if (loginFormRef.value) {
      loginFormRef.value.clearValidate()
    }
  },
  setFocus: () => {
    const emailInput = loginFormRef.value?.$el?.querySelector('input[type="email"]')
    if (emailInput) {
      emailInput.focus()
    }
  }
})
</script>

<style scoped lang="scss">
@import "@/assets/styles/variables.scss";

.login-form-wrapper {
  width: 100%;
}

// 欢迎区域
.welcome-section {
  text-align: center;
  margin-bottom: 2rem;
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

// 表单样式
.login-form {
  margin-bottom: 2rem;

  :deep(.el-form-item) {
    margin-bottom: 1.5rem;
  }

  :deep(.el-input__wrapper) {
    background: rgba(255, 255, 255, 0.9) !important;
    border: 2px solid #e2e8f0;
    border-radius: 16px;
    padding: 0 20px;
    height: 56px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover:not(.is-disabled) {
      border-color: #a78bfa;
      box-shadow: 0 4px 12px rgba(167, 139, 250, 0.15);
      transform: translateY(-1px);
    }

    &.is-focus {
      border-color: #667eea;
      box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
    }

    &.is-disabled {
      background: rgba(248, 250, 252, 0.8) !important;
      border-color: #e2e8f0;
      cursor: not-allowed;
    }
  }

  :deep(.el-input__inner) {
    color: #1e293b;
    font-size: 1rem;
    font-weight: 500;

    &::placeholder {
      color: #94a3b8;
      font-weight: 400;
    }

    &:disabled {
      color: #94a3b8;
      cursor: not-allowed;
    }
  }

  :deep(.el-input__prefix) {
    color: #667eea;
  }
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;

  .remember-checkbox {
    :deep(.el-checkbox__label) {
      color: #374151;
      font-weight: 500;
    }

    :deep(.el-checkbox__input.is-disabled .el-checkbox__inner) {
      background-color: #f1f5f9;
      border-color: #e2e8f0;
      cursor: not-allowed;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  }

  .forgot-link {
    color: #667eea;
    font-weight: 600;
    font-size: 0.9rem;

    &:hover:not(.is-disabled) {
      color: #764ba2;
    }

    &.is-disabled {
      color: #94a3b8;
      cursor: not-allowed;
    }
  }
}

// 按钮样式
.enhanced-button {
  width: 100%;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffffff;
  box-shadow:
    0 8px 24px rgba(102, 126, 234, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }

  &:hover:not(.is-loading):not(.is-disabled) {
    background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
    box-shadow:
      0 12px 32px rgba(102, 126, 234, 0.4),
      0 0 0 1px rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);

    &::before {
      left: 100%;
    }
  }

  &:active:not(.is-loading):not(.is-disabled) {
    transform: translateY(0);
    box-shadow:
      0 4px 16px rgba(102, 126, 234, 0.3),
      0 0 0 1px rgba(255, 255, 255, 0.1);
  }

  &.is-loading {
    opacity: 0.8;
    cursor: wait;
  }

  &.is-disabled {
    background: #94a3b8;
    box-shadow: none;
    cursor: not-allowed;
  }
}

// 注册区域
.register-section {
  text-align: center;
  padding-top: 2rem;
  border-top: 1px solid #e2e8f0;
}

.register-content {
  margin-bottom: 1rem;
}

.register-text {
  color: #6b7280;
  font-size: 0.95rem;
}

.register-link {
  color: #667eea;
  font-weight: 700;
  font-size: 0.95rem;
  margin-left: 0.5rem;

  &:hover:not(.is-disabled) {
    color: #764ba2;
  }

  &.is-disabled {
    color: #94a3b8;
    cursor: not-allowed;
  }
}

.login-alternatives {
  margin-top: 1rem;
}

.help-link {
  color: #64748b;
  font-size: 0.9rem;

  &:hover:not(.is-disabled) {
    color: #667eea;
  }

  &.is-disabled {
    color: #94a3b8;
    cursor: not-allowed;
  }
}

// 错误消息
.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, rgba(252, 129, 129, 0.1), rgba(255, 255, 255, 0.95));
  border: 1px solid rgba(252, 129, 129, 0.2);
  border-radius: 12px;
  color: #dc2626;
  font-size: 0.9rem;
  animation: slideDown 0.3s ease;

  .error-icon {
    font-size: 16px;
    color: #dc2626;
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 安全提示
.security-tips {
  margin-top: 2rem;
}

.security-tip-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.security-features {
  display: flex;
  gap: 1rem;
  margin-top: 0.75rem;
  flex-wrap: wrap;
}

.security-feature {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: #64748b;
}

// 响应式设计
@media (max-width: 768px) {
  .form-options {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .remember-checkbox {
    text-align: center;
  }

  .forgot-link {
    text-align: center;
  }

  .security-features {
    flex-direction: column;
    gap: 0.5rem;
  }

  .welcome-title {
    font-size: 1.5rem;
  }

  .welcome-subtitle {
    font-size: 0.9rem;
  }
}

// 可访问性增强
:deep(.el-input__inner:focus-visible) {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}

:deep(.el-button:focus-visible) {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}

:deep(.el-checkbox__input:focus-visible .el-checkbox__inner) {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}
</style>