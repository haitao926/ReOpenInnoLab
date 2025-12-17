<template>
  <div class="enhanced-login-form">
    <!-- 登录方式切换 -->
    <div class="login-methods" v-if="showMultipleMethods">
      <el-segmented
        v-model="currentMethod"
        :options="methodOptions"
        size="large"
        class="method-segmented"
      />
    </div>

    <!-- 表单内容 -->
    <el-form
      ref="formRef"
      :model="form"
      :rules="formRules"
      @submit.prevent="handleSubmit"
      size="large"
      class="login-form"
    >
      <!-- 账号密码登录 -->
      <div v-if="currentMethod === 'password'" class="password-login">
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            :placeholder="usernamePlaceholder"
            :prefix-icon="User"
            clearable
            class="enhanced-input"
            @blur="validateField('username')"
          >
            <template #suffix>
              <div class="input-suffix-animation" v-if="form.username">
                <el-icon color="var(--edu-color-success-default)"><CircleCheck /></el-icon>
              </div>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            :placeholder="passwordPlaceholder"
            :prefix-icon="Lock"
            show-password
            clearable
            class="enhanced-input"
            @keyup.enter="handleSubmit"
            @blur="validateField('password')"
          >
            <template #suffix>
              <div class="password-strength" v-if="form.password">
                <div class="strength-bar">
                  <div
                    class="strength-fill"
                    :class="passwordStrengthClass"
                    :style="{ width: passwordStrengthWidth }"
                  ></div>
                </div>
              </div>
            </template>
          </el-input>
        </el-form-item>

        <!-- 附加选项 -->
        <div class="form-options">
          <el-checkbox v-model="form.rememberMe" class="remember-checkbox">
            {{ rememberText }}
          </el-checkbox>
          <el-button
            text
            type="primary"
            class="forgot-password-btn"
            @click="$emit('forgot-password')"
          >
            {{ forgotPasswordText }}
          </el-button>
        </div>
      </div>

      <!-- 验证码登录 -->
      <div v-else-if="currentMethod === 'sms'" class="sms-login">
        <el-form-item prop="phone">
          <el-input
            v-model="form.phone"
            :placeholder="phonePlaceholder"
            :prefix-icon="Phone"
            clearable
            class="enhanced-input"
          >
            <template #prepend>
              <el-select v-model="form.countryCode" style="width: 100px">
                <el-option label="+86" value="+86" />
                <el-option label="+1" value="+1" />
              </el-select>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="smsCode">
          <div class="sms-input-group">
            <el-input
              v-model="form.smsCode"
              :placeholder="smsCodePlaceholder"
              :prefix-icon="Key"
              clearable
              class="enhanced-input sms-input"
            />
            <el-button
              :disabled="smsCountdown > 0"
              :loading="sendingSms"
              @click="sendSmsCode"
              class="sms-send-btn"
            >
              {{ smsButtonText }}
            </el-button>
          </div>
        </el-form-item>
      </div>

      <!-- 提交按钮 -->
      <el-form-item class="submit-item">
        <el-button
          type="primary"
          size="large"
          :loading="loading"
          @click="handleSubmit"
          class="submit-btn"
        >
          <span v-if="!loading">{{ submitButtonText }}</span>
          <span v-else>{{ loadingText }}</span>
        </el-button>
      </el-form-item>

      <!-- 第三方登录 -->
      <div class="third-party-login" v-if="showThirdParty">
        <div class="divider">
          <span>{{ thirdPartyDividerText }}</span>
        </div>
        <div class="third-party-buttons">
          <el-button
            v-for="provider in thirdPartyProviders"
            :key="provider.key"
            circle
            size="large"
            class="third-party-btn"
            @click="$emit('third-party-login', provider.key)"
          >
            <el-icon>
              <component :is="provider.icon" />
            </el-icon>
          </el-button>
        </div>
      </div>

      <!-- 注册链接 -->
      <div class="register-link" v-if="showRegister">
        <span class="register-text">{{ registerPrefixText }}</span>
        <el-button
          text
          type="primary"
          @click="$emit('register')"
          class="register-btn"
        >
          {{ registerButtonText }}
        </el-button>
      </div>
    </el-form>

    <!-- 安全提示 -->
    <div class="security-tips">
      <div class="tip-item">
        <el-icon><Lock /></el-icon>
        <span>{{ securityTipText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import {
  User,
  Lock,
  CircleCheck,
  Phone,
  Key,
  Message,
  Connection,
  UserFilled,
  Avatar
} from '@element-plus/icons-vue'

interface Form {
  username: string
  password: string
  phone: string
  countryCode: string
  smsCode: string
  rememberMe: boolean
}

interface ThirdPartyProvider {
  key: string
  name: string
  icon: any
}

interface Props {
  userType?: 'teacher' | 'student' | 'admin'
  loading?: boolean
  loadingText?: string
  showMultipleMethods?: boolean
  showThirdParty?: boolean
  showRegister?: boolean
  rememberText?: string
  forgotPasswordText?: string
  submitButtonText?: string
  thirdPartyDividerText?: string
  registerPrefixText?: string
  registerButtonText?: string
  securityTipText?: string
  thirdPartyProviders?: ThirdPartyProvider[]
}

const props = withDefaults(defineProps<Props>(), {
  userType: 'teacher',
  loading: false,
  loadingText: '正在登录...',
  showMultipleMethods: true,
  showThirdParty: true,
  showRegister: true,
  rememberText: '记住我',
  forgotPasswordText: '忘记密码？',
  submitButtonText: '登录',
  thirdPartyDividerText: '或使用以下方式登录',
  registerPrefixText: '还没有账户？',
  registerButtonText: '立即注册',
  securityTipText: '您的信息将被安全加密',
  thirdPartyProviders: () => [
    { key: 'wechat', name: '微信', icon: Message },
    { key: 'qq', name: 'QQ', icon: Connection },
    { key: 'github', name: 'GitHub', icon: UserFilled },
    { key: 'google', name: 'Google', icon: Avatar }
  ]
})

const emit = defineEmits<{
  submit: [form: any]
  'forgot-password': []
  register: []
  'third-party-login': [provider: string]
  clearError: []
}>()

// 响应式数据
const formRef = ref()
const currentMethod = ref<'password' | 'sms'>('password')
const sendingSms = ref(false)
const smsCountdown = ref(0)

const form = reactive<Form>({
  username: '',
  password: '',
  phone: '',
  countryCode: '+86',
  smsCode: '',
  rememberMe: false
})

// 表单验证规则
const formRules = computed(() => ({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  smsCode: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为6位数字', trigger: 'blur' }
  ]
}))

// 计算属性
const methodOptions = [
  { label: '密码登录', value: 'password' },
  { label: '验证码登录', value: 'sms' }
]

const usernamePlaceholder = computed(() => {
  const placeholders = {
    teacher: '请输入教师工号/邮箱',
    student: '请输入学号/邮箱',
    admin: '请输入管理员账号'
  }
  return placeholders[props.userType]
})

const passwordPlaceholder = '请输入密码'
const phonePlaceholder = '请输入手机号'
const smsCodePlaceholder = '请输入验证码'

// 密码强度计算
const passwordStrength = computed(() => {
  const password = form.password
  if (!password) return 0

  let strength = 0
  if (password.length >= 8) strength++
  if (/[a-z]/.test(password)) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++

  return Math.min(strength, 4)
})

const passwordStrengthClass = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 1) return 'weak'
  if (strength <= 2) return 'medium'
  if (strength <= 3) return 'strong'
  return 'very-strong'
})

const passwordStrengthWidth = computed(() => {
  return `${(passwordStrength.value / 4) * 100}%`
})

const smsButtonText = computed(() => {
  if (smsCountdown.value > 0) {
    return `${smsCountdown.value}s后重试`
  }
  return sendingSms.value ? '发送中...' : '获取验证码'
})

// 方法
const validateField = async (field: string) => {
  try {
    await formRef.value?.validateField(field)
  } catch (error) {
    // 验证失败
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()

    const submitData = {
      ...form,
      loginMethod: currentMethod.value,
      userType: props.userType
    }

    emit('submit', submitData)
  } catch (error) {
    // 表单验证失败
  }
}

const sendSmsCode = async () => {
  if (!form.phone) {
    await formRef.value?.validateField('phone')
    return
  }

  sendingSms.value = true

  try {
    // 这里应该调用发送短信的API
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 开始倒计时
    smsCountdown.value = 60
    const timer = setInterval(() => {
      smsCountdown.value--
      if (smsCountdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (error) {
    console.error('发送短信失败:', error)
  } finally {
    sendingSms.value = false
  }
}

// 监听方法切换，清空错误
watch(currentMethod, () => {
  emit('clearError')
  formRef.value?.clearValidate()
})
</script>

<style scoped lang="scss">
.enhanced-login-form {
  width: 100%;
}

// 登录方式切换
.login-methods {
  margin-bottom: 2rem;
}

.method-segmented {
  width: 100%;

  :deep(.el-segmented) {
    background: #f1f5f9;
    padding: 4px;
    border-radius: 12px;
  }

  :deep(.el-segmented__item) {
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.3s ease;
  }

  :deep(.el-segmented__item.is-selected) {
    background: white;
    color: #667eea;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  }
}

// 表单样式
.login-form {
  .el-form-item {
    margin-bottom: 1.5rem;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

// 增强输入框
.enhanced-input {
  :deep(.el-input__wrapper) {
    border-radius: 12px;
    padding: 16px 20px;
    border: 2px solid #e2e8f0;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

    &:hover {
      border-color: #cbd5e1;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    &.is-focus {
      border-color: #667eea;
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.15);
    }
  }

  :deep(.el-input__inner) {
    font-size: 16px;
    line-height: 1.5;
  }
}

// 输入框后缀动画
.input-suffix-animation {
  animation: checkmarkAppear 0.3s ease;
}

@keyframes checkmarkAppear {
  0% {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

// 密码强度指示器
.password-strength {
  display: flex;
  align-items: center;
  margin-left: 8px;
}

.strength-bar {
  width: 60px;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  border-radius: 2px;
  transition: all 0.3s ease;

  &.weak {
    background: #ef4444;
    width: 25%;
  }

  &.medium {
    background: #f59e0b;
    width: 50%;
  }

  &.strong {
    background: #10b981;
    width: 75%;
  }

  &.very-strong {
    background: #059669;
    width: 100%;
  }
}

// 表单选项
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.remember-checkbox {
  :deep(.el-checkbox__label) {
    color: #64748b;
    font-weight: 500;
  }
}

.forgot-password-btn {
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    transform: translateX(2px);
  }
}

// 短信登录
.sms-input-group {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.sms-input {
  flex: 1;
}

.sms-send-btn {
  flex-shrink: 0;
  height: 56px;
  padding: 0 20px;
  border-radius: 12px;
  font-weight: 500;
  white-space: nowrap;
}

// 提交按钮
.submit-item {
  margin-bottom: 2rem;
}

.submit-btn {
  width: 100%;
  height: 56px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  &.is-loading {
    transform: none;
  }
}

// 第三方登录
.third-party-login {
  margin: 2rem 0;
}

.divider {
  display: flex;
  align-items: center;
  margin: 2rem 0;
  color: #94a3b8;
  font-size: 14px;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e2e8f0;
  }

  span {
    padding: 0 16px;
    background: white;
  }
}

.third-party-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 1.5rem;
}

.third-party-btn {
  width: 48px;
  height: 48px;
  border: 2px solid #e2e8f0;
  background: white;
  transition: all 0.3s ease;

  &:hover {
    border-color: #667eea;
    color: #667eea;
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.2);
  }

  .el-icon {
    font-size: 20px;
  }
}

// 注册链接
.register-link {
  text-align: center;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.register-text {
  color: #64748b;
  font-size: 14px;
  margin-right: 8px;
}

.register-btn {
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    transform: translateX(2px);
  }
}

// 安全提示
.security-tips {
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(16, 185, 129, 0.05);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 8px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #059669;
  font-size: 13px;

  .el-icon {
    font-size: 14px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .form-options {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .sms-input-group {
    flex-direction: column;
    gap: 12px;
  }

  .sms-send-btn {
    width: 100%;
  }

  .third-party-buttons {
    gap: 12px;
  }

  .third-party-btn {
    width: 44px;
    height: 44px;

    .el-icon {
      font-size: 18px;
    }
  }
}
</style>