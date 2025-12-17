<template>
  <div class="teacher-enhanced-login-form">
    <!-- 教师专属欢迎区 -->
    <div class="teacher-welcome">
      <div class="welcome-icon">
        <el-icon class="teacher-icon"><GraduationCap /></el-icon>
      </div>
      <div class="welcome-text">
        <h3>教师专用登录</h3>
        <p>使用您的教师工号或邮箱登录</p>
      </div>
    </div>

    <!-- 快速账号切换 -->
    <div class="quick-account-switch" v-if="recentAccounts.length > 0">
      <div class="recent-accounts">
        <span class="recent-label">最近登录：</span>
        <div class="account-chips">
          <el-chip
            v-for="account in recentAccounts"
            :key="account.id"
            :closable="true"
            @close="removeRecentAccount(account.id)"
            @click="selectRecentAccount(account)"
            class="account-chip"
            size="small"
          >
            <el-icon><User /></el-icon>
            {{ account.maskedEmail || account.maskedId }}
          </el-chip>
        </div>
      </div>
    </div>

    <!-- 登录方式切换 -->
    <div class="login-methods" v-if="showMultipleMethods">
      <el-segmented
        v-model="currentMethod"
        :options="methodOptions"
        size="large"
        class="method-segmented"
      />
    </div>

    <!-- 智能输入提示 -->
    <div class="smart-input-hint" v-if="showSmartHint">
      <el-alert
        :title="smartHintMessage"
        type="info"
        :closable="true"
        @close="showSmartHint = false"
        class="hint-alert"
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
          <div class="enhanced-input-wrapper">
            <el-input
              v-model="form.username"
              :placeholder="usernamePlaceholder"
              :prefix-icon="User"
              clearable
              class="enhanced-input"
              @blur="validateField('username')"
              @input="handleUsernameInput"
              @focus="handleUsernameFocus"
              ref="usernameInput"
            >
              <template #suffix>
                <div class="input-suffix-content">
                  <div class="input-validation" v-if="form.username">
                    <el-icon
                      v-if="usernameValidation.isValid"
                      class="validation-icon valid"
                    >
                      <CircleCheck />
                    </el-icon>
                    <el-icon
                      v-else-if="usernameValidation.showError"
                      class="validation-icon invalid"
                    >
                      <CircleClose />
                    </el-icon>
                  </div>
                  <div class="account-type" v-if="form.username && accountType">
                    <el-tag :type="accountType.tagType" size="small">
                      <el-icon><component :is="accountType.icon" /></el-icon>
                      {{ accountType.text }}
                    </el-tag>
                  </div>
                </div>
              </template>
            </el-input>

            <!-- 实时验证提示 -->
            <div class="field-hint" v-if="usernameValidation.message">
              <span :class="['hint-text', usernameValidation.type]">
                {{ usernameValidation.message }}
              </span>
            </div>
          </div>
        </el-form-item>

        <el-form-item prop="password">
          <div class="enhanced-input-wrapper">
            <el-input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              :placeholder="passwordPlaceholder"
              :prefix-icon="Lock"
              show-password
              clearable
              class="enhanced-input"
              @keyup.enter="handleSubmit"
              @blur="validateField('password')"
              @input="handlePasswordInput"
              ref="passwordInput"
            >
              <template #suffix>
                <div class="password-suffix-content">
                  <div class="password-strength-indicator" v-if="form.password">
                    <div class="strength-bar">
                      <div
                        class="strength-fill"
                        :class="passwordStrengthClass"
                        :style="{ width: passwordStrengthWidth }"
                      ></div>
                    </div>
                    <span class="strength-text" :class="passwordStrengthClass">
                      {{ passwordStrengthText }}
                    </span>
                  </div>
                </div>
              </template>
            </el-input>

            <!-- 密码提示 -->
            <div class="field-hint" v-if="passwordValidation.message">
              <span :class="['hint-text', passwordValidation.type]">
                {{ passwordValidation.message }}
              </span>
            </div>
          </div>
        </el-form-item>

        <!-- 安全提示 -->
        <div class="security-notice" v-if="showSecurityNotice">
          <el-alert
            title="安全提示"
            description="为了您的账户安全，请确保在安全的网络环境中登录"
            type="warning"
            :closable="true"
            @close="showSecurityNotice = false"
            class="security-alert"
          />
        </div>

        <!-- 增强的选项区域 -->
        <div class="enhanced-form-options">
          <div class="left-options">
            <el-checkbox v-model="form.rememberMe" class="remember-checkbox">
              <span class="checkbox-text">
                <el-icon><Lock /></el-icon>
                {{ rememberText }}
              </span>
            </el-checkbox>
          </div>
          <div class="right-options">
            <el-dropdown @command="handleSecurityAction" class="security-dropdown">
              <el-button text type="info" class="security-action-btn">
                <el-icon><Shield /></el-icon>
                账户安全
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="forgot-password">
                    <el-icon><Key /></el-icon>
                    忘记密码
                  </el-dropdown-item>
                  <el-dropdown-item command="login-history">
                    <el-icon><Clock /></el-icon>
                    登录记录
                  </el-dropdown-item>
                  <el-dropdown-item command="account-security">
                    <el-icon><Shield /></el-icon>
                    安全设置
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>

      <!-- 验证码登录 -->
      <div v-else-if="currentMethod === 'sms'" class="sms-login">
        <el-form-item prop="phone">
          <div class="enhanced-input-wrapper">
            <el-input
              v-model="form.phone"
              :placeholder="phonePlaceholder"
              :prefix-icon="Phone"
              clearable
              class="enhanced-input phone-input"
            >
              <template #prepend>
                <el-select v-model="form.countryCode" class="country-code-select">
                  <el-option label="+86" value="+86" />
                  <el-option label="+1" value="+1" />
                </el-select>
              </template>
              <template #suffix>
                <div class="phone-validation" v-if="form.phone">
                  <el-icon
                    v-if="phoneValidation.isValid"
                    class="validation-icon valid"
                  >
                    <CircleCheck />
                  </el-icon>
                  <el-icon
                    v-else-if="phoneValidation.showError"
                    class="validation-icon invalid"
                  >
                    <CircleClose />
                  </el-icon>
                </div>
              </template>
            </el-input>
            <div class="field-hint" v-if="phoneValidation.message">
              <span :class="['hint-text', phoneValidation.type]">
                {{ phoneValidation.message }}
              </span>
            </div>
          </div>
        </el-form-item>

        <el-form-item prop="smsCode">
          <div class="enhanced-input-wrapper">
            <div class="sms-input-group">
              <el-input
                v-model="form.smsCode"
                :placeholder="smsCodePlaceholder"
                :prefix-icon="Key"
                clearable
                class="enhanced-input sms-input"
                maxlength="6"
                @input="handleSmsCodeInput"
              />
              <el-button
                :disabled="smsCountdown > 0 || !phoneValidation.isValid"
                :loading="sendingSms"
                @click="sendSmsCode"
                class="sms-send-btn"
                :type="phoneValidation.isValid ? 'primary' : 'info'"
              >
                <el-icon v-if="!sendingSms && smsCountdown === 0"><Message /></el-icon>
                {{ smsButtonText }}
              </el-button>
            </div>
            <div class="field-hint" v-if="smsCodeValidation.message">
              <span :class="['hint-text', smsCodeValidation.type]">
                {{ smsCodeValidation.message }}
              </span>
            </div>
          </div>
        </el-form-item>
      </div>

      <!-- 智能登录按钮 -->
      <el-form-item class="submit-item">
        <el-button
          type="primary"
          size="large"
          :loading="loading"
          :disabled="!canSubmit"
          @click="handleSubmit"
          class="enhanced-submit-btn"
        >
          <template #icon>
            <el-icon v-if="!loading"><Right /></el-icon>
          </template>
          <span v-if="!loading">{{ enhancedSubmitText }}</span>
          <span v-else>{{ loadingText }}</span>
        </el-button>
      </el-form-item>

      <!-- 登录状态提示 -->
      <div class="login-status-hint" v-if="loginStatus.message">
        <el-alert
          :title="loginStatus.message"
          :type="loginStatus.type"
          :closable="true"
          @close="loginStatus.message = ''"
          :show-icon="true"
        />
      </div>
    </el-form>

    <!-- 教师专属功能入口 -->
    <div class="teacher-features">
      <div class="feature-entrances">
        <el-button text class="feature-btn" @click="showTeacherGuide">
          <el-icon><Reading /></el-icon>
          教师指南
        </el-button>
        <el-button text class="feature-btn" @click="showSupport">
          <el-icon><Service /></el-icon>
          技术支持
        </el-button>
        <el-button text class="feature-btn" @click="showSystemStatus">
          <el-icon><Monitor /></el-icon>
          系统状态
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import {
  User,
  Lock,
  CircleCheck,
  CircleClose,
  Phone,
  Key,
  Message,
  Clock,
  Shield,
  ArrowDown,
  Right,
  GraduationCap,
  Reading,
  Service,
  Monitor,
  MessageFilled,
  UserFilled,
  Avatar
} from '@element-plus/icons-vue'

interface RecentAccount {
  id: string
  maskedEmail?: string
  maskedId?: string
  lastLoginTime: string
}

interface Form {
  username: string
  password: string
  phone: string
  countryCode: string
  smsCode: string
  rememberMe: boolean
}

interface ValidationState {
  isValid: boolean
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  showError: boolean
}

const props = withDefaults(defineProps<{
  userType?: 'teacher' | 'student' | 'admin'
  loading?: boolean
  loadingText?: string
  showMultipleMethods?: boolean
  showThirdParty?: boolean
  showRegister?: boolean
  rememberText?: string
  forgotPasswordText?: string
  submitButtonText?: string
  securityTipText?: string
}>(), {
  userType: 'teacher',
  loading: false,
  loadingText: '正在登录...',
  showMultipleMethods: true,
  showThirdParty: false,
  showRegister: false,
  rememberText: '记住登录状态',
  forgotPasswordText: '忘记密码？',
  submitButtonText: '教师登录',
  securityTipText: '您的教学数据将被安全加密保护'
})

const emit = defineEmits<{
  submit: [form: any]
  'forgot-password': []
  register: []
  'third-party-login': [provider: string]
  clearError: []
  'teacher-guide': []
  support: []
  'system-status': []
  'login-history': []
  'account-security': []
}>()

// 响应式数据
const formRef = ref()
const usernameInput = ref()
const passwordInput = ref()
const currentMethod = ref<'password' | 'sms'>('password')
const sendingSms = ref(false)
const smsCountdown = ref(0)
const showPassword = ref(false)
const showSmartHint = ref(false)
const smartHintMessage = ref('')
const showSecurityNotice = ref(true)

const form = reactive<Form>({
  username: '',
  password: '',
  phone: '',
  countryCode: '+86',
  smsCode: '',
  rememberMe: false
})

// 验证状态
const usernameValidation = ref<ValidationState>({
  isValid: false,
  message: '',
  type: 'info',
  showError: false
})

const passwordValidation = ref<ValidationState>({
  isValid: false,
  message: '',
  type: 'info',
  showError: false
})

const phoneValidation = ref<ValidationState>({
  isValid: false,
  message: '',
  type: 'info',
  showError: false
})

const smsCodeValidation = ref<ValidationState>({
  isValid: false,
  message: '',
  type: 'info',
  showError: false
})

const loginStatus = ref({
  message: '',
  type: 'success' as 'success' | 'error' | 'warning' | 'info'
})

// 最近登录账户
const recentAccounts = ref<RecentAccount[]>([
  {
    id: '1',
    maskedEmail: 't***@school.edu',
    lastLoginTime: '2024-01-10 14:30'
  },
  {
    id: '2',
    maskedId: 'T20240***',
    lastLoginTime: '2024-01-09 09:15'
  }
])

// 计算属性
const methodOptions = [
  { label: '密码登录', value: 'password' },
  { label: '验证码登录', value: 'sms' }
]

const usernamePlaceholder = computed(() => {
  const placeholders = {
    teacher: '请输入教师工号或邮箱',
    student: '请输入学号或邮箱',
    admin: '请输入管理员账号'
  }
  return placeholders[props.userType]
})

const passwordPlaceholder = '请输入密码'
const phonePlaceholder = '请输入手机号'
const smsCodePlaceholder = '请输入6位验证码'

// 账号类型识别
const accountType = computed(() => {
  const username = form.username.trim()
  if (!username) return null

  if (username.includes('@')) {
    return {
      text: '邮箱登录',
      icon: MessageFilled,
      tagType: 'success'
    }
  } else if (/^[A-Za-z]\d{6,}$/.test(username) || /^T\d{6,}$/i.test(username)) {
    return {
      text: '工号登录',
      icon: UserFilled,
      tagType: 'primary'
    }
  }
  return null
})

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

const passwordStrengthText = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 1) return '弱'
  if (strength <= 2) return '中等'
  if (strength <= 3) return '强'
  return '很强'
})

const smsButtonText = computed(() => {
  if (smsCountdown.value > 0) {
    return `${smsCountdown.value}s后重试`
  }
  return sendingSms.value ? '发送中...' : '获取验证码'
})

const enhancedSubmitText = computed(() => {
  if (currentMethod.value === 'password') {
    if (accountType.value) {
      return `${accountType.value.text} - ${props.submitButtonText}`
    }
  }
  return props.submitButtonText
})

const canSubmit = computed(() => {
  if (currentMethod.value === 'password') {
    return usernameValidation.value.isValid && passwordValidation.value.isValid
  } else {
    return phoneValidation.value.isValid && smsCodeValidation.value.isValid
  }
})

// 表单验证规则
const formRules = computed(() => ({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度在 3 到 50 个字符', trigger: 'blur' }
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

// 方法
const handleUsernameInput = (value: string) => {
  const username = value.trim()

  if (!username) {
    usernameValidation.value = {
      isValid: false,
      message: '',
      type: 'info',
      showError: false
    }
    return
  }

  // 教师工号验证
  if (/^[A-Za-z]\d{6,}$/.test(username) || /^T\d{6,}$/i.test(username)) {
    usernameValidation.value = {
      isValid: true,
      message: '教师工号格式正确',
      type: 'success',
      showError: false
    }
    return
  }

  // 邮箱验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (emailRegex.test(username)) {
    if (username.toLowerCase().includes('.edu')) {
      usernameValidation.value = {
        isValid: true,
        message: '教育邮箱，可享受教师专属功能',
        type: 'success',
        showError: false
      }
    } else {
      usernameValidation.value = {
        isValid: true,
        message: '邮箱格式正确',
        type: 'success',
        showError: false
      }
    }
    return
  }

  usernameValidation.value = {
    isValid: false,
    message: '请输入有效的教师工号或邮箱',
    type: 'error',
    showError: true
  }
}

const handlePasswordInput = (value: string) => {
  const password = value

  if (!password) {
    passwordValidation.value = {
      isValid: false,
      message: '',
      type: 'info',
      showError: false
    }
    return
  }

  if (password.length < 6) {
    passwordValidation.value = {
      isValid: false,
      message: '密码至少需要6位字符',
      type: 'error',
      showError: true
    }
    return
  }

  if (passwordStrength.value <= 1) {
    passwordValidation.value = {
      isValid: true,
      message: '建议使用更强的密码组合',
      type: 'warning',
      showError: false
    }
  } else {
    passwordValidation.value = {
      isValid: true,
      message: '密码强度良好',
      type: 'success',
      showError: false
    }
  }
}

const handleUsernameFocus = () => {
  if (!form.username) {
    showSmartHint.value = true
    smartHintMessage.value = '支持教师工号（如T2024001）或教育邮箱登录'
  }
}

const validateField = async (field: string) => {
  try {
    await formRef.value?.validateField(field)
  } catch (error) {
    // 验证失败
  }
}

const handlePasswordFocus = () => {
  showSecurityNotice.value = true
}

const handlePhoneInput = (value: string) => {
  const phone = value.trim()

  if (!phone) {
    phoneValidation.value = {
      isValid: false,
      message: '',
      type: 'info',
      showError: false
    }
    return
  }

  const phoneRegex = /^1[3-9]\d{9}$/
  if (phoneRegex.test(phone)) {
    phoneValidation.value = {
      isValid: true,
      message: '手机号格式正确',
      type: 'success',
      showError: false
    }
  } else {
    phoneValidation.value = {
      isValid: false,
      message: '请输入正确的手机号',
      type: 'error',
      showError: true
    }
  }
}

const handleSmsCodeInput = (value: string) => {
  const code = value.trim()

  if (!code) {
    smsCodeValidation.value = {
      isValid: false,
      message: '',
      type: 'info',
      showError: false
    }
    return
  }

  if (/^\d{6}$/.test(code)) {
    smsCodeValidation.value = {
      isValid: true,
      message: '验证码格式正确',
      type: 'success',
      showError: false
    }
  } else {
    smsCodeValidation.value = {
      isValid: false,
      message: '请输入6位数字验证码',
      type: 'error',
      showError: true
    }
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()

    const submitData = {
      ...form,
      loginMethod: currentMethod.value,
      userType: props.userType,
      accountType: accountType.value?.text
    }

    // 显示登录中状态
    loginStatus.value = {
      message: '正在验证登录信息...',
      type: 'info'
    }

    emit('submit', submitData)
  } catch (error) {
    loginStatus.value = {
      message: '请检查输入信息是否正确',
      type: 'error'
    }
  }
}

const sendSmsCode = async () => {
  if (!form.phone) {
    await formRef.value?.validateField('phone')
    return
  }

  sendingSms.value = true

  try {
    // 模拟发送短信
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 开始倒计时
    smsCountdown.value = 60
    const timer = setInterval(() => {
      smsCountdown.value--
      if (smsCountdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)

    loginStatus.value = {
      message: '验证码已发送，请查收短信',
      type: 'success'
    }
  } catch (error) {
    loginStatus.value = {
      message: '验证码发送失败，请重试',
      type: 'error'
    }
  } finally {
    sendingSms.value = false
  }
}

const selectRecentAccount = (account: RecentAccount) => {
  form.username = account.maskedEmail || account.maskedId || ''
  usernameValidation.value = {
    isValid: true,
    message: '已选择最近登录账户',
    type: 'success',
    showError: false
  }

  // 聚焦到密码输入框
  nextTick(() => {
    passwordInput.value?.focus()
  })
}

const removeRecentAccount = (accountId: string) => {
  const index = recentAccounts.value.findIndex(acc => acc.id === accountId)
  if (index > -1) {
    recentAccounts.value.splice(index, 1)
  }
}

const handleSecurityAction = (command: string) => {
  switch (command) {
    case 'forgot-password':
      emit('forgot-password')
      break
    case 'login-history':
      emit('login-history')
      break
    case 'account-security':
      emit('account-security')
      break
  }
}

const showTeacherGuide = () => {
  emit('teacher-guide')
}

const showSupport = () => {
  emit('support')
}

const showSystemStatus = () => {
  emit('system-status')
}

// 监听方法切换，清空错误
watch(currentMethod, () => {
  emit('clearError')
  formRef.value?.clearValidate()
  loginStatus.value.message = ''
})
</script>

<style scoped lang="scss">
.teacher-enhanced-login-form {
  width: 100%;
  position: relative;
}

// 教师专属欢迎区
.teacher-welcome {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, var(--edu-color-primary-50) 0%, var(--edu-color-secondary-50) 100%);
  border-radius: 16px;
  border: 1px solid var(--edu-color-primary-200);

  .welcome-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: var(--edu-gradient-primary);
    display: flex;
    align-items: center;
    justify-content: center;

    .teacher-icon {
      font-size: 24px;
      color: white;
    }
  }

  .welcome-text {
    flex: 1;

    h3 {
      margin: 0 0 0.25rem 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--edu-primary-700);
    }

    p {
      margin: 0;
      font-size: 0.9rem;
      color: var(--edu-primary-600);
    }
  }
}

// 快速账号切换
.quick-account-switch {
  margin-bottom: 1.5rem;

  .recent-accounts {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;

    .recent-label {
      font-size: 0.85rem;
      color: #64748b;
      font-weight: 500;
    }

    .account-chips {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;

      .account-chip {
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
      }
    }
  }
}

// 智能输入提示
.smart-input-hint {
  margin-bottom: 1.5rem;

  .hint-alert {
    border-radius: 8px;
  }
}

// 登录方式切换
.login-methods {
  margin-bottom: 2rem;

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
      color: var(--edu-primary-500);
      box-shadow: 0 2px 8px rgba(14, 165, 233, 0.3);
    }
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

// 增强输入框包装器
.enhanced-input-wrapper {
  width: 100%;
}

.enhanced-input {
  :deep(.el-input__wrapper) {
    height: 52px;
    border-radius: 12px;
    padding: 14px 18px;
    border: 2px solid #e2e8f0;
    transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    background: rgba(255, 255, 255, 0.95);

    &:hover {
      border-color: #cbd5e1;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    &.is-focus {
      border-color: var(--edu-primary-500);
      box-shadow: 0 4px 20px rgba(14, 165, 233, 0.15);
      background: rgba(255, 255, 255, 1);
    }
  }

  :deep(.el-input__inner) {
    font-size: 16px;
    line-height: 1.4;
    color: #1e293b;
    font-weight: 400;
  }

  :deep(.el-input__prefix-icon) {
    color: #64748b;
    font-size: 20px;
  }
}

// 输入框后缀内容
.input-suffix-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-validation {
  display: flex;
  align-items: center;

  .validation-icon {
    font-size: 18px;
    transition: all 0.3s ease;

    &.valid {
      color: #10b981;
      animation: validPulse 0.6s ease;
    }

    &.invalid {
      color: #ef4444;
      animation: invalidShake 0.6s ease;
    }
  }
}

@keyframes validPulse {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes invalidShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

.account-type {
  .el-tag {
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
  }
}

// 密码后缀内容
.password-suffix-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.password-strength-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.strength-bar {
  width: 80px;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  border-radius: 3px;
  transition: all 0.4s ease;

  &.weak { background: #ef4444; }
  &.medium { background: #f59e0b; }
  &.strong { background: #10b981; }
  &.very-strong { background: #059669; }
}

.strength-text {
  font-size: 12px;
  font-weight: 600;

  &.weak { color: #ef4444; }
  &.medium { color: #f59e0b; }
  &.strong { color: #10b981; }
  &.very-strong { color: #059669; }
}

// 字段提示
.field-hint {
  margin-top: 0.5rem;
  padding-left: 2px;

  .hint-text {
    font-size: 13px;
    line-height: 1.4;

    &.success { color: #059669; }
    &.error { color: #dc2626; }
    &.warning { color: #d97706; }
    &.info { color: #6b7280; }
  }
}

// 安全提示
.security-notice {
  margin-bottom: 1.5rem;

  .security-alert {
    border-radius: 8px;
  }
}

// 增强选项区域
.enhanced-form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;

  .left-options {
    .remember-checkbox {
      :deep(.el-checkbox__label) {
        color: #374151;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 6px;
      }
    }
  }

  .right-options {
    .security-action-btn {
      color: #6b7280;
      font-weight: 500;
      transition: all 0.2s ease;

      &:hover {
        color: var(--edu-primary-500);
      }
    }
  }
}

// 短信登录
.phone-input {
  :deep(.el-input__wrapper) {
    height: 52px !important;
    border-radius: 12px !important;
  }

  :deep(.el-input__inner) {
    height: 52px;
  }

  :deep(.el-input-group__prepend) {
    background: rgba(248, 250, 252, 0.95) !important;
    border: 2px solid #e2e8f0 !important;
    border-right: 1px solid #e2e8f0 !important;
    border-radius: 12px 0 0 12px !important;
    padding: 0;
    display: flex;
    align-items: center;
  }
}

.country-code-select {
  width: 100px !important;

  :deep(.el-select__wrapper) {
    height: 52px !important;
    min-height: 52px !important;
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
  }

  :deep(.el-input__inner) {
    font-size: 16px !important;
    font-weight: 500;
    color: #1e293b;
    text-align: center;
    height: 52px;
    line-height: 52px;
  }
}

.sms-input-group {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.sms-input {
  flex: 1;

  :deep(.el-input__wrapper) {
    height: 52px;
    border-radius: 12px;
    padding: 14px 18px;
    border: 2px solid #e2e8f0;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    background: rgba(255, 255, 255, 0.95);

    &:hover {
      border-color: #cbd5e1;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    &.is-focus {
      border-color: var(--edu-primary-500);
      box-shadow: 0 4px 20px rgba(14, 165, 233, 0.15);
      background: rgba(255, 255, 255, 1);
    }
  }
}

.phone-validation {
  display: flex;
  align-items: center;
}

.sms-send-btn {
  flex-shrink: 0;
  height: 52px;
  padding: 0 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 15px;
  white-space: nowrap;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(14, 165, 233, 0.3);
  }
}

// 提交按钮
.submit-item {
  margin-bottom: 1.5rem;
}

.enhanced-submit-btn {
  width: 100%;
  height: 56px;
  border-radius: 14px;
  font-size: 17px;
  font-weight: 600;
  background: var(--edu-gradient-primary);
  border: none;
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
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
    transition: left 0.6s;
  }

  &:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 12px 35px rgba(14, 165, 233, 0.4);

    &::before {
      left: 100%;
    }
  }

  &:active:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

// 登录状态提示
.login-status-hint {
  margin-bottom: 1.5rem;
}

// 教师专属功能入口
.teacher-features {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;

  .feature-entrances {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    flex-wrap: wrap;

    .feature-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #6b7280;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;

      &:hover {
        color: var(--edu-primary-500);
        transform: translateY(-1px);
      }

      .el-icon {
        font-size: 16px;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .teacher-welcome {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }

  .enhanced-form-options {
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

  .feature-entrances {
    flex-direction: column;
    gap: 0.75rem;
  }
}

@media (max-width: 480px) {
  .enhanced-input {
    :deep(.el-input__wrapper) {
      height: 48px;
      padding: 12px 16px;
    }

    :deep(.el-input__inner) {
      font-size: 15px;
    }
  }

  .enhanced-submit-btn {
    height: 52px;
    font-size: 16px;
  }
}
</style>
