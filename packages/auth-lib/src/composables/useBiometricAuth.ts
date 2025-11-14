import { ref, computed } from 'vue'
import type { BiometricInfo, AuthMethod, AuthResult } from '../types'

export function useBiometricAuth() {
  // 响应式状态
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  // 计算属性
  const isSupported = computed(() => {
    return !!(
      navigator.credentials &&
      navigator.publicKey &&
      window.PublicKeyCredential
    )
  })

  const availableBiometrics = computed(() => {
    return {
      fingerprint: getBiometricInfo('fingerprint'),
      face: getBiometricInfo('face'),
      voice: getBiometricInfo('voice'),
      passkey: getBiometricInfo('passkey'),
      iris: getBiometricInfo('iris')
    }
  })

  // 检查生物识别可用性
  const checkBiometricAvailability = async (type: AuthMethod): Promise<BiometricInfo> => {
    try {
      if (!isSupported.value) {
        return {
          type,
          available: false,
          enrolled: false,
          deviceSupported: false
        }
      }

      // 检查平台认证器可用性
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()

      // 检查是否有已注册的凭证
      const enrolled = await checkEnrolledCredentials(type)

      return {
        type,
        available,
        enrolled,
        deviceSupported: available,
        lastUsed: await getLastUsedTime(type)
      }
    } catch (err) {
      console.warn(`Failed to check ${type} availability:`, err)
      return {
        type,
        available: false,
        enrolled: false,
        deviceSupported: false
      }
    }
  }

  // 获取生物识别信息
  const getBiometricInfo = (type: AuthMethod): BiometricInfo => {
    const stored = localStorage.getItem(`biometric_${type}`)

    if (stored) {
      const info = JSON.parse(stored)
      return {
        ...info,
        deviceSupported: isSupported.value
      }
    }

    return {
      type,
      available: isSupported.value,
      enrolled: false,
      deviceSupported: isSupported.value
    }
  }

  // 检查已注册的凭证
  const checkEnrolledCredentials = async (type: AuthMethod): Promise<boolean> => {
    try {
      // 获取现有的凭证
      const credentials = await getCredentials(type)
      return credentials.length > 0
    } catch (err) {
      console.warn('Failed to check enrolled credentials:', err)
      return false
    }
  }

  // 获取凭证
  const getCredentials = async (type: AuthMethod): Promise<any[]> => {
    try {
      // 这里应该根据不同的生物识别类型获取相应的凭证
      // 实际实现需要与后端API集成
      const stored = localStorage.getItem(`credentials_${type}`)
      return stored ? JSON.parse(stored) : []
    } catch (err) {
      console.warn('Failed to get credentials:', err)
      return []
    }
  }

  // 注册生物识别
  const enroll = async (type: AuthMethod): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      if (!isSupported.value) {
        throw new Error('Device does not support biometric authentication')
      }

      // 创建注册凭证请求
      const credentialCreationOptions = await createCredentialCreationOptions(type)

      // 创建凭证
      const credential = await navigator.credentials.create({
        publicKey: credentialCreationOptions
      }) as PublicKeyCredential

      if (!credential) {
        throw new Error('Failed to create credential')
      }

      // 保存凭证信息
      await saveCredential(type, credential)

      // 更新生物识别信息
      const biometricInfo: BiometricInfo = {
        type,
        available: true,
        enrolled: true,
        deviceSupported: true,
        lastUsed: new Date()
      }

      localStorage.setItem(`biometric_${type}`, JSON.stringify(biometricInfo))

    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Enrollment failed')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // 认证
  const authenticate = async (
    type: AuthMethod,
    options: CredentialRequestOptions = {}
  ): Promise<AuthResult> => {
    isLoading.value = true
    error.value = null

    try {
      if (!isSupported.value) {
        throw new Error('Device does not support biometric authentication')
      }

      // 获取认证选项
      const credentialRequestOptions = await createCredentialRequestOptions(type, options)

      // 请求认证
      const credential = await navigator.credentials.get({
        publicKey: credentialRequestOptions
      }) as PublicKeyCredential

      if (!credential) {
        throw new Error('Authentication failed')
      }

      // 验证响应
      const verificationResult = await verifyAuthenticationResponse(credential)

      // 更新最后使用时间
      const biometricInfo = getBiometricInfo(type)
      biometricInfo.lastUsed = new Date()
      localStorage.setItem(`biometric_${type}`, JSON.stringify(biometricInfo))

      return {
        success: true,
        userId: verificationResult.userId,
        token: verificationResult.token,
        expiresAt: verificationResult.expiresAt
      }

    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Authentication failed')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // 创建凭证创建选项
  const createCredentialCreationOptions = async (type: AuthMethod): Promise<CredentialCreationOptions> => {
    // 这里应该从服务器获取挑战和其他参数
    const challenge = new Uint8Array(32)
    crypto.getRandomValues(challenge)

    const userId = new Uint8Array(16)
    crypto.getRandomValues(userId)

    const options: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'ReOpenInnoLab',
        id: window.location.hostname
      },
      user: {
        id: userId,
        name: 'user@example.com',
        displayName: 'User'
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        requireResidentKey: false
      },
      timeout: 60000,
      attestation: 'direct'
    }

    // 根据生物识别类型调整选项
    switch (type) {
      case 'fingerprint':
        options.authenticatorSelection.authenticatorAttachment = 'platform'
        break
      case 'face':
        options.authenticatorSelection.userVerification = 'required'
        break
      case 'passkey':
        options.authenticatorSelection.requireResidentKey = true
        break
    }

    return { publicKey: options }
  }

  // 创建凭证请求选项
  const createCredentialRequestOptions = async (
    type: AuthMethod,
    options: CredentialRequestOptions = {}
  ): Promise<CredentialRequestOptions> => {
    // 从服务器获取挑战
    const challenge = new Uint8Array(32)
    crypto.getRandomValues(challenge)

    // 获取允许的凭证ID
    const allowCredentials = await getAllowCredentials(type)

    const publicKeyOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      allowCredentials,
      userVerification: 'required',
      timeout: options.timeout || 60000
    }

    return {
      publicKey: publicKeyOptions,
      ...options
    }
  }

  // 获取允许的凭证
  const getAllowCredentials = async (type: AuthMethod): Promise<PublicKeyCredentialDescriptor[]> => {
    try {
      const credentials = await getCredentials(type)
      return credentials.map((cred: any) => ({
        id: base64urlToArrayBuffer(cred.id),
        type: 'public-key' as const,
        transports: ['internal', 'usb', 'nfc', 'ble'] as const[]
      }))
    } catch (err) {
      console.warn('Failed to get allow credentials:', err)
      return []
    }
  }

  // 保存凭证
  const saveCredential = async (type: AuthMethod, credential: PublicKeyCredential): Promise<void> => {
    try {
      const response = credential.response as AuthenticatorAttestationResponse

      const credentialData = {
        id: arrayBufferToBase64url(credential.rawId),
        type: credential.type,
        publicKey: arrayBufferToBase64url(response.getPublicKey()),
        createdAt: new Date().toISOString()
      }

      const existingCredentials = await getCredentials(type)
      existingCredentials.push(credentialData)

      localStorage.setItem(`credentials_${type}`, JSON.stringify(existingCredentials))

      // 这里还应该将凭证发送到服务器进行验证和存储
      // await api.saveCredential(type, credentialData)
    } catch (err) {
      console.error('Failed to save credential:', err)
      throw err
    }
  }

  // 验证认证响应
  const verifyAuthenticationResponse = async (credential: PublicKeyCredential): Promise<any> => {
    try {
      const response = credential.response as AuthenticatorAssertionResponse

      // 这里应该将认证响应发送到服务器进行验证
      // const verificationResult = await api.verifyAuthenticationResponse({
      //   credentialId: arrayBufferToBase64url(credential.rawId),
      //   authenticatorData: arrayBufferToBase64url(response.authenticatorData),
      //   clientDataJSON: arrayBufferToBase64url(response.clientDataJSON),
      //   signature: arrayBufferToBase64url(response.signature),
      //   userHandle: response.userHandle ? arrayBufferToBase64url(response.userHandle) : null
      // })

      // 模拟验证结果
      const verificationResult = {
        userId: 'user_123',
        token: 'jwt_token_' + Math.random().toString(36).substr(2, 9),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时后过期
      }

      return verificationResult
    } catch (err) {
      console.error('Failed to verify authentication response:', err)
      throw err
    }
  }

  // 移除凭证
  const removeCredential = async (type: AuthMethod, credentialId: string): Promise<void> => {
    try {
      const credentials = await getCredentials(type)
      const filteredCredentials = credentials.filter((cred: any) => cred.id !== credentialId)

      localStorage.setItem(`credentials_${type}`, JSON.stringify(filteredCredentials))

      // 如果没有其他凭证，更新生物识别状态
      if (filteredCredentials.length === 0) {
        const biometricInfo = getBiometricInfo(type)
        biometricInfo.enrolled = false
        biometricInfo.lastUsed = undefined
        localStorage.setItem(`biometric_${type}`, JSON.stringify(biometricInfo))
      }

      // 这里还应该从服务器移除凭证
      // await api.removeCredential(type, credentialId)
    } catch (err) {
      console.error('Failed to remove credential:', err)
      throw err
    }
  }

  // 获取最后使用时间
  const getLastUsedTime = async (type: AuthMethod): Promise<Date | undefined> => {
    try {
      const biometricInfo = getBiometricInfo(type)
      return biometricInfo.lastUsed ? new Date(biometricInfo.lastUsed) : undefined
    } catch (err) {
      console.warn('Failed to get last used time:', err)
      return undefined
    }
  }

  // 检查特定生物识别类型是否可用
  const isBiometricTypeAvailable = async (type: AuthMethod): Promise<boolean> => {
    try {
      const info = await checkBiometricAvailability(type)
      return info.available && info.deviceSupported
    } catch (err) {
      console.warn(`Failed to check ${type} availability:`, err)
      return false
    }
  }

  // 工具函数：ArrayBuffer转Base64URL
  const arrayBufferToBase64url = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer)
    let str = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      str += String.fromCharCode(bytes[i])
    }
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  }

  // 工具函数：Base64URL转ArrayBuffer
  const base64urlToArrayBuffer = (base64url: string): ArrayBuffer => {
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4)
    const binary = atob(padded)
    const buffer = new ArrayBuffer(binary.length)
    const bytes = new Uint8Array(buffer)

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }

    return buffer
  }

  // 初始化
  const initialize = async () => {
    if (!isSupported.value) {
      console.warn('WebAuthn is not supported on this device')
      return
    }

    // 检查平台认证器可用性
    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      console.log('Platform authenticator available:', available)
    } catch (err) {
      console.warn('Failed to check platform authenticator availability:', err)
    }
  }

  return {
    // 状态
    isLoading,
    error,

    // 计算属性
    isSupported,
    availableBiometrics,

    // 方法
    checkBiometricAvailability,
    getBiometricInfo,
    enroll,
    authenticate,
    getCredentials,
    removeCredential,
    isBiometricTypeAvailable,
    initialize
  }
}