<template>
  <div class="biometric-auth">
    <!-- 生物识别方法选择器 -->
    <div class="biometric-auth__methods">
      <div
        v-for="method in availableMethods"
        :key="method.type"
        class="biometric-auth__method"
        :class="{
          'biometric-auth__method--available': method.available,
          'biometric-auth__method--enrolled': method.enrolled,
          'biometric-auth__method--active': activeMethod === method.type
        }"
        @click="selectMethod(method.type)"
      >
        <div class="biometric-auth__icon">
          <component :is="getMethodIcon(method.type)" />
        </div>
        <div class="biometric-auth__info">
          <h4 class="biometric-auth__name">{{ getMethodName(method.type) }}</h4>
          <p class="biometric-auth__status">{{ getMethodStatus(method) }}</p>
        </div>
        <div class="biometric-auth__actions">
          <el-button
            v-if="method.available && !method.enrolled"
            size="small"
            @click.stop="enrollMethod(method.type)"
          >
            注册
          </el-button>
          <el-button
            v-if="method.enrolled"
            size="small"
            type="primary"
            :loading="authenticating && activeMethod === method.type"
            @click.stop="authenticateWith(method.type)"
          >
            {{ authenticating && activeMethod === method.type ? '验证中...' : '验证' }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 生物识别验证界面 -->
    <div
      v-if="showAuthInterface"
      class="biometric-auth__interface"
    >
      <component
        :is="getAuthInterface(activeMethod)"
        :method="activeMethod"
        :loading="authenticating"
        @success="handleBiometricSuccess"
        @error="handleBiometricError"
        @cancel="cancelAuthentication"
      />
    </div>

    <!-- Passkey 认证 -->
    <PasskeyAuth
      v-if="showPasskey"
      @success="handlePasskeySuccess"
      @error="handlePasskeyError"
      @cancel="hidePasskey"
    />

    <!-- 生物识别状态指示器 -->
    <div
      v-if="authenticating"
      class="biometric-auth__indicator"
    >
      <div class="biometric-auth__pulse"></div>
      <span class="biometric-auth__indicator-text">
        {{ getAuthenticatingMessage() }}
      </span>
    </div>

    <!-- 错误提示 -->
    <div
      v-if="error"
      class="biometric-auth__error"
    >
      <el-alert
        :title="error.title"
        :description="error.message"
        type="error"
        :closable="true"
        @close="clearError"
      />
    </div>

    <!-- 成功提示 -->
    <div
      v-if="success"
      class="biometric-auth__success"
    >
      <el-alert
        title="验证成功"
        :description="success.message"
        type="success"
        :closable="true"
        @close="clearSuccess"
      />
    </div>

    <!-- 设置面板 -->
    <el-collapse v-model="activeSettings">
      <el-collapse-item title="高级设置" name="advanced">
        <div class="biometric-auth__settings">
          <el-form-item label="自动生物识别">
            <el-switch
              v-model="settings.autoBiometric"
              @change="updateSettings"
            />
          </el-form-item>
          <el-form-item label="备用密码">
            <el-switch
              v-model="settings.allowFallback"
              @change="updateSettings"
            />
          </el-form-item>
          <el-form-item label="设备信任">
            <el-switch
              v-model="settings.trustDevice"
              @change="updateSettings"
            />
          </el-form-item>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useBiometricAuth } from '../composables/useBiometricAuth'
import type { BiometricInfo, AuthMethod, BiometricError } from '../types'

// 组件导入
import PasskeyAuth from './PasskeyAuth.vue'
import FaceRecognitionAuth from './FaceRecognitionAuth.vue'
import FingerprintAuth from './FingerprintAuth.vue'
import VoiceAuth from './VoiceAuth.vue'

interface Props {
  autoAuthenticate?: boolean
  showSettings?: boolean
  fallbackMethod?: AuthMethod
  onSuccess?: (result: any) => void
  onError?: (error: any) => void
}

const props = withDefaults(defineProps<Props>(), {
  autoAuthenticate: false,
  showSettings: true,
  fallbackMethod: 'password'
})

const emit = defineEmits<{
  success: [result: any]
  error: [error: any]
  methodSelected: [method: AuthMethod]
  fallbackRequested: [method: AuthMethod]
}>()

// Composables
const {
  availableBiometrics,
  isSupported,
  enroll,
  authenticate,
  getCredentials,
  removeCredential
} = useBiometricAuth()

// 响应式状态
const activeMethod = ref<AuthMethod | null>(null)
const authenticating = ref(false)
const showAuthInterface = ref(false)
const showPasskey = ref(false)
const error = ref<BiometricError | null>(null)
const success = ref<any>(null)
const activeSettings = ref<string[]>([])

// 设置
const settings = ref({
  autoBiometric: true,
  allowFallback: true,
  trustDevice: false
})

// 计算属性
const availableMethods = computed(() => {
  const methods = [
    {
      type: 'fingerprint' as AuthMethod,
      name: '指纹识别',
      icon: 'Fingerprint',
      ...availableBiometrics.value.fingerprint
    },
    {
      type: 'face' as AuthMethod,
      name: '面部识别',
      icon: 'UserFilled',
      ...availableBiometrics.value.face
    },
    {
      type: 'voice' as AuthMethod,
      name: '声纹识别',
      icon: 'Microphone',
      ...availableBiometrics.value.voice
    },
    {
      type: 'passkey' as AuthMethod,
      name: 'Passkey',
      icon: 'Key',
      ...availableBiometrics.value.passkey
    }
  ]

  return methods.filter(method => method.deviceSupported)
})

// 方法
const selectMethod = (method: AuthMethod) => {
  activeMethod.value = method
  emit('methodSelected', method)

  const methodInfo = availableMethods.value.find(m => m.type === method)
  if (methodInfo?.enrolled) {
    startAuthentication(method)
  } else {
    showAuthInterface.value = true
  }
}

const enrollMethod = async (method: AuthMethod) => {
  try {
    authenticating.value = true
    await enroll(method)

    success.value = {
      message: `${getMethodName(method)}注册成功`
    }

    // 注册成功后自动认证
    if (settings.value.autoBiometric) {
      setTimeout(() => startAuthentication(method), 1000)
    }
  } catch (err) {
    error.value = {
      code: 'ENROLL_FAILED',
      title: '注册失败',
      message: `无法注册${getMethodName(method)}，请重试`,
      details: err
    }
  } finally {
    authenticating.value = false
  }
}

const startAuthentication = (method: AuthMethod) => {
  activeMethod.value = method

  if (method === 'passkey') {
    showPasskey.value = true
  } else {
    showAuthInterface.value = true
  }

  authenticateWith(method)
}

const authenticateWith = async (method: AuthMethod) => {
  try {
    authenticating.value = true
    clearError()

    const result = await authenticate(method, {
      userVerification: 'required',
      timeout: 60000
    })

    handleBiometricSuccess(result)
  } catch (err) {
    handleBiometricError(err)
  } finally {
    authenticating.value = false
  }
}

const handleBiometricSuccess = (result: any) => {
  success.value = {
    message: '生物识别验证成功',
    data: result
  }

  showAuthInterface.value = false
  showPasskey.value = false

  // 如果启用了设备信任，保存设备信息
  if (settings.value.trustDevice) {
    saveTrustedDevice(result)
  }

  emit('success', result)

  // 3秒后清除成功消息
  setTimeout(() => {
    clearSuccess()
  }, 3000)
}

const handleBiometricError = (err: any) => {
  console.error('Biometric authentication error:', err)

  let errorMessage = '生物识别验证失败'
  let errorTitle = '验证失败'

  // 根据错误类型提供具体的错误信息
  if (err.name === 'NotAllowedError') {
    errorMessage = '用户取消了生物识别验证'
  } else if (err.name === 'NotSupportedError') {
    errorMessage = '设备不支持此生物识别方法'
  } else if (err.name === 'SecurityError') {
    errorMessage = '安全验证失败，请重试'
  } else if (err.name === 'TimeoutError') {
    errorMessage = '验证超时，请重试'
  }

  error.value = {
    code: err.name || 'BIOMETRIC_ERROR',
    title: errorTitle,
    message: errorMessage,
    details: err
  }

  emit('error', err)

  // 如果启用了备用方法，提供备用选项
  if (settings.value.allowFallback && props.fallbackMethod) {
    setTimeout(() => {
      requestFallback()
    }, 2000)
  }
}

const handlePasskeySuccess = (result: any) => {
  handleBiometricSuccess(result)
}

const handlePasskeyError = (err: any) => {
  handleBiometricError(err)
}

const cancelAuthentication = () => {
  authenticating.value = false
  showAuthInterface.value = false
  showPasskey.value = false
  activeMethod.value = null
}

const hidePasskey = () => {
  showPasskey.value = false
  activeMethod.value = null
}

const requestFallback = () => {
  if (props.fallbackMethod) {
    emit('fallbackRequested', props.fallbackMethod)
  }
}

const clearError = () => {
  error.value = null
}

const clearSuccess = () => {
  success.value = null
}

const updateSettings = () => {
  localStorage.setItem('biometric_settings', JSON.stringify(settings.value))
}

const saveTrustedDevice = (authResult: any) => {
  const trustedDevices = JSON.parse(localStorage.getItem('trusted_devices') || '[]')
  const deviceInfo = {
    id: authResult.deviceId || generateDeviceId(),
    type: activeMethod.value,
    name: getMethodName(activeMethod.value!),
    trustedSince: new Date().toISOString(),
    lastUsed: new Date().toISOString()
  }

  // 更新或添加设备
  const existingIndex = trustedDevices.findIndex((d: any) => d.id === deviceInfo.id)
  if (existingIndex >= 0) {
    trustedDevices[existingIndex] = deviceInfo
  } else {
    trustedDevices.push(deviceInfo)
  }

  localStorage.setItem('trusted_devices', JSON.stringify(trustedDevices))
}

const generateDeviceId = () => {
  return 'device_' + Math.random().toString(36).substr(2, 9)
}

// 工具函数
const getMethodIcon = (method: AuthMethod) => {
  const icons = {
    fingerprint: 'Fingerprint',
    face: 'UserFilled',
    voice: 'Microphone',
    passkey: 'Key',
    iris: 'View'
  }
  return icons[method] || 'Lock'
}

const getMethodName = (method: AuthMethod) => {
  const names = {
    fingerprint: '指纹识别',
    face: '面部识别',
    voice: '声纹识别',
    passkey: 'Passkey',
    iris: '虹膜识别'
  }
  return names[method] || method
}

const getMethodStatus = (method: BiometricInfo) => {
  if (!method.deviceSupported) return '设备不支持'
  if (!method.enrolled) return '未注册'
  if (method.lastUsed) return `最后使用: ${formatDate(method.lastUsed)}`
  return '已注册'
}

const getAuthInterface = (method: AuthMethod | null) => {
  const interfaces = {
    fingerprint: FingerprintAuth,
    face: FaceRecognitionAuth,
    voice: VoiceAuth
  }
  return method ? interfaces[method as keyof typeof interfaces] : null
}

const getAuthenticatingMessage = () => {
  if (!activeMethod.value) return '验证中...'

  const messages = {
    fingerprint: '请放置您的手指',
    face: '请正对摄像头',
    voice: '请说出验证短语',
    passkey: '请确认您的身份'
  }

  return messages[activeMethod.value] || '验证中...'
}

const formatDate = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return new Date(date).toLocaleDateString()
}

// 生命周期
onMounted(async () => {
  // 加载设置
  const savedSettings = localStorage.getItem('biometric_settings')
  if (savedSettings) {
    settings.value = { ...settings.value, ...JSON.parse(savedSettings) }
  }

  // 如果启用自动认证且有已注册的生物识别方法
  if (props.autoAuthenticate && settings.value.autoBiometric) {
    const enrolledMethods = availableMethods.value.filter(m => m.enrolled)
    if (enrolledMethods.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 500)) // 等待界面加载
      selectMethod(enrolledMethods[0].type)
    }
  }
})

// 监听可用生物识别方法变化
watch(availableBiometrics, (newBiometrics) => {
  // 如果当前选中的方法不再可用，清除选择
  if (activeMethod.value && !newBiometrics[activeMethod.value as keyof typeof newBiometrics]?.deviceSupported) {
    activeMethod.value = null
    showAuthInterface.value = false
  }
}, { deep: true })
</script>

<style scoped lang="scss">
.biometric-auth {
  &__methods {
    display: flex;
    flex-direction: column;
    gap: var(--auth-spacing-md);
    margin-bottom: var(--auth-spacing-lg);
  }

  &__method {
    display: flex;
    align-items: center;
    padding: var(--auth-spacing-md);
    border: 2px solid var(--auth-gray-200);
    border-radius: var(--auth-radius-lg);
    cursor: pointer;
    transition: all var(--auth-transition-fast);

    &:hover {
      border-color: var(--auth-primary-solid);
      background: rgba(102, 126, 234, 0.05);
    }

    &--available {
      border-color: var(--auth-success);
    }

    &--enrolled {
      border-color: var(--auth-primary-solid);
      background: rgba(102, 126, 234, 0.1);
    }

    &--active {
      border-color: var(--auth-primary-solid);
      background: var(--auth-primary);
      color: white;

      .biometric-auth__name,
      .biometric-auth__status {
        color: white;
      }
    }
  }

  &__icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--auth-gray-100);
    border-radius: var(--auth-radius-md);
    margin-right: var(--auth-spacing-md);
    font-size: 24px;
    color: var(--auth-gray-600);

    .biometric-auth__method--enrolled & {
      background: var(--auth-primary);
      color: white;
    }

    .biometric-auth__method--active & {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }
  }

  &__info {
    flex: 1;
  }

  &__name {
    font-size: var(--auth-font-size-base);
    font-weight: 600;
    margin: 0 0 var(--auth-spacing-xs) 0;
    color: var(--auth-gray-900);
  }

  &__status {
    font-size: var(--auth-font-size-sm);
    margin: 0;
    color: var(--auth-gray-500);
  }

  &__actions {
    margin-left: var(--auth-spacing-md);
  }

  &__interface {
    margin: var(--auth-spacing-lg) 0;
    padding: var(--auth-spacing-lg);
    background: var(--auth-gray-50);
    border-radius: var(--auth-radius-lg);
  }

  &__indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--auth-spacing-md);
    padding: var(--auth-spacing-lg);
    background: rgba(102, 126, 234, 0.1);
    border-radius: var(--auth-radius-lg);
    margin: var(--auth-spacing-lg) 0;
  }

  &__pulse {
    width: 24px;
    height: 24px;
    background: var(--auth-primary-solid);
    border-radius: 50%;
    animation: pulse 1.5s ease-in-out infinite;
  }

  &__indicator-text {
    font-size: var(--auth-font-size-base);
    color: var(--auth-primary-solid);
    font-weight: 500;
  }

  &__error {
    margin: var(--auth-spacing-md) 0;
  }

  &__success {
    margin: var(--auth-spacing-md) 0;
  }

  &__settings {
    padding: var(--auth-spacing-md);
    background: var(--auth-gray-50);
    border-radius: var(--auth-radius-md);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .biometric-auth {
    &__method {
      flex-direction: column;
      text-align: center;
      gap: var(--auth-spacing-sm);
    }

    &__icon {
      margin-right: 0;
    }

    &__actions {
      margin-left: 0;
      width: 100%;
    }
  }
}
</style>