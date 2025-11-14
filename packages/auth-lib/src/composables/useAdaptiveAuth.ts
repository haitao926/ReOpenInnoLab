import { ref, computed, watch } from 'vue'
import type {
  UserContext,
  DeviceFingerprint,
  BehaviorPattern,
  AuthMethod,
  RiskScore,
  AuthConfig
} from '../types'

export function useAdaptiveAuth() {
  // 响应式状态
  const userContext = ref<UserContext | null>(null)
  const deviceFingerprint = ref<DeviceFingerprint | null>(null)
  const behaviorPattern = ref<BehaviorPattern | null>(null)
  const riskScore = ref<RiskScore | null>(null)
  const authConfig = ref<AuthConfig | null>(null)

  // 加载状态
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  // 计算属性
  const recommendedAuthMethod = computed<AuthMethod>(() => {
    if (!userContext.value) return 'password'

    const { riskScore: score, preferredAuthMethod, deviceFingerprint: device } = userContext.value

    // 基于风险评分的推荐
    if (score < 0.3) {
      return device?.isTrusted ? 'biometric' : 'passwordless'
    }

    if (score < 0.6) {
      return 'password'
    }

    if (score < 0.8) {
      return 'mfa'
    }

    return 'adaptive' // 需要多重验证
  })

  const securityLevel = computed(() => {
    if (!riskScore.value) return 'medium'

    const score = riskScore.value.value

    if (score < 30) return 'low'
    if (score < 60) return 'medium'
    if (score < 80) return 'high'
    return 'critical'
  })

  const isHighRisk = computed(() => riskScore.value?.value || 0 > 70)

  // 生成设备指纹
  const generateDeviceFingerprint = async (): Promise<DeviceFingerprint> => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx?.fillText('device fingerprint', 10, 10)

    const fingerprint = {
      id: await generateHash(
        navigator.userAgent +
        screen.width + screen.height +
        new Date().getTimezoneOffset() +
        navigator.language +
        canvas.toDataURL()
      ),
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      isTrusted: false,
      trustScore: 0,
      lastSeen: new Date()
    }

    deviceFingerprint.value = fingerprint
    return fingerprint
  }

  // 分析用户行为模式
  const analyzeBehaviorPattern = async (): Promise<BehaviorPattern> => {
    const stored = localStorage.getItem('auth_behavior_pattern')

    if (stored) {
      const pattern = JSON.parse(stored)
      behaviorPattern.value = pattern
      return pattern
    }

    // 新用户默认模式
    const pattern: BehaviorPattern = {
      typingSpeed: 0,
      mouseMovementPattern: '',
      loginTimePattern: [],
      typicalLocations: [],
      deviceUsageDuration: 0,
      anomalyScore: 0
    }

    behaviorPattern.value = pattern
    return pattern
  }

  // 计算风险评分
  const calculateRiskScore = async (context: Partial<UserContext>): Promise<RiskScore> => {
    const factors = []
    let totalScore = 0

    // 设备风险评估
    if (context.deviceFingerprint) {
      const deviceRisk = assessDeviceRisk(context.deviceFingerprint)
      factors.push(deviceRisk)
      totalScore += deviceRisk.score
    }

    // 行为风险评估
    if (context.behaviorPattern) {
      const behaviorRisk = assessBehaviorRisk(context.behaviorPattern)
      factors.push(behaviorRisk)
      totalScore += behaviorRisk.score
    }

    // 时间风险评估
    const timeRisk = assessTimeRisk()
    factors.push(timeRisk)
    totalScore += timeRisk.score

    // 网络风险评估
    const networkRisk = await assessNetworkRisk()
    factors.push(networkRisk)
    totalScore += networkRisk.score

    const finalScore = Math.min(100, Math.max(0, totalScore / factors.length))

    const riskResult: RiskScore = {
      value: Math.round(finalScore),
      factors,
      recommendations: generateRecommendations(finalScore, factors),
      timestamp: new Date()
    }

    riskScore.value = riskResult
    return riskResult
  }

  // 设备风险评估
  const assessDeviceRisk = (device: DeviceFingerprint) => {
    if (device.isTrusted) {
      return {
        type: 'device' as const,
        score: 5,
        description: '受信任的设备',
        severity: 'low' as const
      }
    }

    // 检查是否为新设备
    const storedDevices = JSON.parse(localStorage.getItem('trusted_devices') || '[]')
    const knownDevice = storedDevices.find((d: any) => d.id === device.id)

    if (knownDevice) {
      return {
        type: 'device' as const,
        score: 15,
        description: '已知设备但未标记为受信任',
        severity: 'low' as const
      }
    }

    return {
      type: 'device' as const,
      score: 40,
      description: '新设备或未知设备',
      severity: 'medium' as const
    }
  }

  // 行为风险评估
  const assessBehaviorRisk = (behavior: BehaviorPattern) => {
    if (behavior.anomalyScore > 0.7) {
      return {
        type: 'behavior' as const,
        score: 60,
        description: '检测到异常行为模式',
        severity: 'high' as const
      }
    }

    if (behavior.anomalyScore > 0.4) {
      return {
        type: 'behavior' as const,
        score: 30,
        description: '行为模式略有异常',
        severity: 'medium' as const
      }
    }

    return {
      type: 'behavior' as const,
      score: 10,
      description: '正常行为模式',
      severity: 'low' as const
    }
  }

  // 时间风险评估
  const assessTimeRisk = () => {
    const currentHour = new Date().getHours()
    const stored = localStorage.getItem('auth_login_times')
    const loginTimes = stored ? JSON.parse(stored) : []

    // 检查是否为异常登录时间
    if (loginTimes.length > 0) {
      const typicalHours = loginTimes.map((time: number) => new Date(time).getHours())
      const isUnusualTime = !typicalHours.includes(currentHour) &&
                           (currentHour < 6 || currentHour > 22)

      if (isUnusualTime) {
        return {
          type: 'time' as const,
          score: 25,
          description: '异常登录时间',
          severity: 'medium' as const
        }
      }
    }

    return {
      type: 'time' as const,
      score: 5,
      description: '正常登录时间',
      severity: 'low' as const
    }
  }

  // 网络风险评估
  const assessNetworkRisk = async () => {
    try {
      // 检查网络连接类型
      const connection = (navigator as any).connection ||
                        (navigator as any).mozConnection ||
                        (navigator as any).webkitConnection

      if (connection) {
        if (connection.type === 'cellular') {
          return {
            type: 'network' as const,
            score: 20,
            description: '使用移动网络',
            severity: 'medium' as const
          }
        }
      }

      // 可以添加VPN检测、IP地理位置检查等
      return {
        type: 'network' as const,
        score: 5,
        description: '网络环境正常',
        severity: 'low' as const
      }
    } catch (error) {
      return {
        type: 'network' as const,
        score: 10,
        description: '无法评估网络风险',
        severity: 'low' as const
      }
    }
  }

  // 生成安全建议
  const generateRecommendations = (score: number, factors: any[]) => {
    const recommendations = []

    if (score > 70) {
      recommendations.push('建议启用多重身份验证')
      recommendations.push('请确认是否为本人操作')
    }

    if (score > 50) {
      recommendations.push('建议检查账户安全设置')
    }

    // 基于具体因素的建议
    factors.forEach(factor => {
      switch (factor.type) {
        case 'device':
          if (factor.severity === 'medium' || factor.severity === 'high') {
            recommendations.push('如果是常用设备，建议添加到受信任设备列表')
          }
          break
        case 'location':
          if (factor.severity === 'medium' || factor.severity === 'high') {
            recommendations.push('如果当前位置异常，请确认账户安全')
          }
          break
        case 'time':
          if (factor.severity === 'medium') {
            recommendations.push('如果非本人操作，请立即修改密码')
          }
          break
      }
    })

    return recommendations
  }

  // 更新用户上下文
  const updateContext = async (updates: Partial<UserContext>) => {
    isLoading.value = true
    error.value = null

    try {
      // 生成设备指纹
      if (!deviceFingerprint.value) {
        await generateDeviceFingerprint()
      }

      // 分析行为模式
      if (!behaviorPattern.value) {
        await analyzeBehaviorPattern()
      }

      // 创建完整的用户上下文
      const context: UserContext = {
        deviceFingerprint: deviceFingerprint.value!,
        behaviorPattern: behaviorPattern.value!,
        riskScore: 0,
        preferredAuthMethod: 'password',
        ...updates
      }

      // 计算风险评分
      const risk = await calculateRiskScore(context)
      context.riskScore = risk.value

      userContext.value = context

      // 保存到本地存储
      localStorage.setItem('auth_user_context', JSON.stringify(context))

      return context
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to update user context')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // 选择认证流程
  const selectAuthFlow = (context: UserContext): AuthMethod => {
    const { riskScore: score, preferredAuthMethod, deviceFingerprint: device } = context

    // 基于风险评分选择认证方法
    if (score < 0.3) {
      return device.isTrusted ? 'biometric' : 'passwordless'
    }

    if (score < 0.6) {
      return preferredAuthMethod || 'password'
    }

    if (score < 0.8) {
      return 'mfa'
    }

    return 'adaptive'
  }

  // 记录登录尝试
  const recordLoginAttempt = async (success: boolean, method: AuthMethod, details?: any) => {
    const attempt = {
      timestamp: Date.now(),
      success,
      method,
      details: details || {},
      deviceFingerprint: deviceFingerprint.value
    }

    const attempts = JSON.parse(localStorage.getItem('auth_login_attempts') || '[]')
    attempts.push(attempt)

    // 只保留最近100次尝试
    if (attempts.length > 100) {
      attempts.splice(0, attempts.length - 100)
    }

    localStorage.setItem('auth_login_attempts', JSON.stringify(attempts))

    // 更新行为模式
    if (success) {
      await updateBehaviorPattern(attempt)
    }
  }

  // 更新行为模式
  const updateBehaviorPattern = async (attempt: any) => {
    const currentPattern = behaviorPattern.value || await analyzeBehaviorPattern()

    // 更新登录时间模式
    currentPattern.loginTimePattern.push(attempt.timestamp)
    if (currentPattern.loginTimePattern.length > 20) {
      currentPattern.loginTimePattern.splice(0, currentPattern.loginTimePattern.length - 20)
    }

    behaviorPattern.value = currentPattern
    localStorage.setItem('auth_behavior_pattern', JSON.stringify(currentPattern))
  }

  // 工具函数：生成哈希
  const generateHash = async (input: string): Promise<string> => {
    const encoder = new TextEncoder()
    const data = encoder.encode(input)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // 初始化
  const initialize = async () => {
    isLoading.value = true

    try {
      // 恢复保存的用户上下文
      const stored = localStorage.getItem('auth_user_context')
      if (stored) {
        const context = JSON.parse(stored)
        userContext.value = context
        deviceFingerprint.value = context.deviceFingerprint
        behaviorPattern.value = context.behaviorPattern
      } else {
        // 创建新的上下文
        await updateContext({})
      }
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to initialize adaptive auth')
    } finally {
      isLoading.value = false
    }
  }

  // 监听风险评分变化
  watch(riskScore, (newScore) => {
    if (newScore && newScore.value > 80) {
      console.warn('High risk detected:', newScore)
    }
  })

  return {
    // 状态
    userContext,
    deviceFingerprint,
    behaviorPattern,
    riskScore,
    authConfig,
    isLoading,
    error,

    // 计算属性
    recommendedAuthMethod,
    securityLevel,
    isHighRisk,

    // 方法
    generateDeviceFingerprint,
    analyzeBehaviorPattern,
    calculateRiskScore,
    updateContext,
    selectAuthFlow,
    recordLoginAttempt,
    initialize
  }
}