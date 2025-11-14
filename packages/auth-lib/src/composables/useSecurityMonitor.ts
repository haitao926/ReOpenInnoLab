import { ref, computed, watch } from 'vue'
import type {
  SecurityDashboard,
  LoginAttempt,
  TrustedDevice,
  SecurityRecommendation,
  ThreatIndicators,
  RiskScore,
  DeviceInfo
} from '../types'

export function useSecurityMonitor() {
  // 响应式状态
  const isMonitoring = ref(false)
  const currentRiskScore = ref<RiskScore | null>(null)
  const loginAttempts = ref<LoginAttempt[]>([])
  const trustedDevices = ref<TrustedDevice[]>([])
  const activeThreats = ref<string[]>([])
  const securityRecommendations = ref<SecurityRecommendation[]>([])
  const lastUpdateTime = ref<Date | null>(null)

  // 监控配置
  const monitoringConfig = ref({
    enableRealTimeMonitoring: true,
    enableAnomalyDetection: true,
    enableLocationTracking: true,
    enableDeviceFingerprinting: true,
    riskThreshold: 70,
    monitoringInterval: 30000, // 30秒
    maxAttemptsPerHour: 10,
    suspiciousLocationRadius: 500, // km
    unusualTimeThreshold: 6 // hours
  })

  // 计算属性
  const recentAttempts = computed(() => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    return loginAttempts.value.filter(attempt =>
      new Date(attempt.timestamp) > oneHourAgo
    )
  })

  const failedAttemptsCount = computed(() => {
    return recentAttempts.value.filter(attempt => !attempt.success).length
  })

  const suspiciousActivities = computed(() => {
    return recentAttempts.value.filter(attempt =>
      attempt.riskScore > monitoringConfig.value.riskThreshold
    )
  })

  // 启动安全监控
  const startMonitoring = async () => {
    if (isMonitoring.value) return

    isMonitoring.value = true
    console.log('Security monitoring started')

    // 初始化数据
    await initializeSecurityData()

    // 开始实时监控
    if (monitoringConfig.value.enableRealTimeMonitoring) {
      startRealTimeMonitoring()
    }

    // 检测异常
    if (monitoringConfig.value.enableAnomalyDetection) {
      await detectAnomalies()
    }
  }

  // 停止安全监控
  const stopMonitoring = () => {
    isMonitoring.value = false
    console.log('Security monitoring stopped')
    stopRealTimeMonitoring()
  }

  // 初始化安全数据
  const initializeSecurityData = async () => {
    try {
      // 加载登录尝试记录
      const storedAttempts = localStorage.getItem('security_login_attempts')
      if (storedAttempts) {
        loginAttempts.value = JSON.parse(storedAttempts)
      }

      // 加载受信任设备
      const storedDevices = localStorage.getItem('trusted_devices')
      if (storedDevices) {
        const devices = JSON.parse(storedDevices)
        trustedDevices.value = devices.map((device: any) => ({
          ...device,
          isCurrent: isCurrentDevice(device)
        }))
      }

      // 计算当前风险评分
      await calculateCurrentRiskScore()

      // 生成安全建议
      await generateSecurityRecommendations()

      lastUpdateTime.value = new Date()
    } catch (error) {
      console.error('Failed to initialize security data:', error)
    }
  }

  // 实时监控
  let monitoringInterval: NodeJS.Timeout | null = null

  const startRealTimeMonitoring = () => {
    if (monitoringInterval) return

    monitoringInterval = setInterval(async () => {
      if (isMonitoring.value) {
        await performSecurityCheck()
      }
    }, monitoringConfig.value.monitoringInterval)
  }

  const stopRealTimeMonitoring = () => {
    if (monitoringInterval) {
      clearInterval(monitoringInterval)
      monitoringInterval = null
    }
  }

  // 执行安全检查
  const performSecurityCheck = async () => {
    try {
      // 检测新的威胁
      await detectThreats()

      // 更新风险评分
      await calculateCurrentRiskScore()

      // 更新安全建议
      await generateSecurityRecommendations()

      lastUpdateTime.value = new Date()
    } catch (error) {
      console.error('Security check failed:', error)
    }
  }

  // 检测威胁
  const detectThreats = async () => {
    const threats: string[] = []

    // 检测暴力破解攻击
    if (failedAttemptsCount.value >= monitoringConfig.value.maxAttemptsPerHour) {
      threats.push('bruteForce')
    }

    // 检测异常位置
    if (monitoringConfig.value.enableLocationTracking) {
      const unusualLocation = await detectUnusualLocation()
      if (unusualLocation) {
        threats.push('unusualLocation')
      }
    }

    // 检测设备异常
    if (monitoringConfig.value.enableDeviceFingerprinting) {
      const deviceAnomaly = await detectDeviceAnomaly()
      if (deviceAnomaly) {
        threats.push('deviceAnomaly')
      }
    }

    // 检测时间异常
    const timeAnomaly = await detectTimeAnomaly()
    if (timeAnomaly) {
      threats.push('timeAnomaly')
    }

    // 检测网络异常
    const networkAnomaly = await detectNetworkAnomaly()
    if (networkAnomaly) {
      threats.push('networkAnomaly')
    }

    activeThreats.value = threats
  }

  // 检测异常位置
  const detectUnusualLocation = async (): Promise<boolean> => {
    try {
      const currentPosition = await getCurrentPosition()
      if (!currentPosition) return false

      // 获取历史位置
      const historicalLocations = loginAttempts.value
        .filter(attempt => attempt.success && attempt.location)
        .map(attempt => attempt.location!)

      if (historicalLocations.length === 0) return false

      // 检查当前位置是否在常用位置范围内
      const isUnusual = !historicalLocations.some(location => {
        const distance = calculateDistance(
          currentPosition.latitude,
          currentPosition.longitude,
          location.latitude,
          location.longitude
        )
        return distance <= monitoringConfig.value.suspiciousLocationRadius
      })

      return isUnusual
    } catch (error) {
      console.warn('Failed to detect unusual location:', error)
      return false
    }
  }

  // 检测设备异常
  const detectDeviceAnomaly = async (): Promise<boolean> => {
    try {
      const currentFingerprint = await generateDeviceFingerprint()
      const knownDevices = trustedDevices.value.map(device => device.id)

      // 如果设备不在已知设备列表中，标记为异常
      return !knownDevices.includes(currentFingerprint.id)
    } catch (error) {
      console.warn('Failed to detect device anomaly:', error)
      return false
    }
  }

  // 检测时间异常
  const detectTimeAnomaly = async (): Promise<boolean> => {
    try {
      const currentHour = new Date().getHours()

      // 获取历史登录时间
      const historicalHours = loginAttempts.value
        .filter(attempt => attempt.success)
        .map(attempt => new Date(attempt.timestamp).getHours())

      if (historicalHours.length === 0) return false

      // 检查当前时间是否在常用登录时间范围内
      const typicalHours = getTypicalLoginHours(historicalHours)
      const isUnusual = !typicalHours.includes(currentHour)

      return isUnusual
    } catch (error) {
      console.warn('Failed to detect time anomaly:', error)
      return false
    }
  }

  // 检测网络异常
  const detectNetworkAnomaly = async (): Promise<boolean> => {
    try {
      const connection = (navigator as any).connection ||
                        (navigator as any).mozConnection ||
                        (navigator as any).webkitConnection

      if (!connection) return false

      // 检测网络类型变化
      const storedNetworkType = localStorage.getItem('last_network_type')
      const currentNetworkType = connection.effectiveType

      if (storedNetworkType && storedNetworkType !== currentNetworkType) {
        localStorage.setItem('last_network_type', currentNetworkType)
        return true // 网络类型发生变化
      }

      localStorage.setItem('last_network_type', currentNetworkType)
      return false
    } catch (error) {
      console.warn('Failed to detect network anomaly:', error)
      return false
    }
  }

  // 检测异常
  const detectAnomalies = async () => {
    // 分析登录模式
    const loginPatterns = analyzeLoginPatterns()

    // 分析设备使用模式
    const devicePatterns = analyzeDevicePatterns()

    // 分析时间模式
    const timePatterns = analyzeTimePatterns()

    // 综合异常评分
    const anomalyScore = calculateAnomalyScore({
      loginPatterns,
      devicePatterns,
      timePatterns
    })

    if (anomalyScore > 0.7) {
      activeThreats.value.push('behavioralAnomaly')
    }
  }

  // 计算当前风险评分
  const calculateCurrentRiskScore = async () => {
    try {
      const factors = []
      let totalScore = 0

      // 失败尝试因子
      const failedAttemptsFactor = {
        type: 'loginAttempts' as const,
        score: Math.min(50, failedAttemptsCount.value * 5),
        description: `最近1小时内有${failedAttemptsCount.value}次失败登录`,
        severity: failedAttemptsCount.value > 5 ? 'high' as const : 'medium' as const
      }
      factors.push(failedAttemptsFactor)
      totalScore += failedAttemptsFactor.score

      // 威胁因子
      const threatFactor = {
        type: 'threats' as const,
        score: activeThreats.value.length * 15,
        description: `检测到${activeThreats.value.length}个威胁指标`,
        severity: activeThrusts.value.length > 2 ? 'high' as const : 'medium' as const
      }
      factors.push(threatFactor)
      totalScore += threatFactor.score

      // 可疑活动因子
      const suspiciousFactor = {
        type: 'suspiciousActivity' as const,
        score: Math.min(30, suspiciousActivities.value.length * 10),
        description: `发现${suspiciousActivities.value.length}次可疑活动`,
        severity: suspiciousActivities.value.length > 2 ? 'high' as const : 'medium' as const
      }
      factors.push(suspiciousFactor)
      totalScore += suspiciousFactor.score

      // 设备信任因子
      const deviceTrustFactor = calculateDeviceTrustFactor()
      factors.push(deviceTrustFactor)
      totalScore += deviceTrustFactor.score

      const finalScore = Math.min(100, Math.max(0, totalScore))

      currentRiskScore.value = {
        value: Math.round(finalScore),
        factors,
        recommendations: generateRecommendations(finalScore, factors),
        timestamp: new Date()
      }

    } catch (error) {
      console.error('Failed to calculate risk score:', error)
    }
  }

  // 生成安全建议
  const generateSecurityRecommendations = async () => {
    const recommendations: SecurityRecommendation[] = []

    if (!currentRiskScore.value) return

    const { value, factors } = currentRiskScore.value

    // 基于风险评分的通用建议
    if (value > 70) {
      recommendations.push({
        type: 'critical',
        title: '高风险警告',
        description: '检测到高风险活动，建议立即采取安全措施',
        actions: [
          {
            label: '修改密码',
            action: 'change_password',
            type: 'primary'
          },
          {
            label: '启用MFA',
            action: 'enable_mfa',
            type: 'primary'
          },
          {
            label: '查看活动',
            action: 'review_activity',
            type: 'secondary'
          }
        ],
        priority: 1
      })
    }

    // 基于具体因子的建议
    factors.forEach(factor => {
      switch (factor.type) {
        case 'loginAttempts':
          if (factor.score > 20) {
            recommendations.push({
              type: 'warning',
              title: '异常登录尝试',
              description: '检测到多次失败的登录尝试，可能存在暴力破解攻击',
              actions: [
                {
                  label: '修改密码',
                  action: 'change_password',
                  type: 'primary'
                },
                {
                  label: '启用账户锁定',
                  action: 'enable_account_lockout',
                  type: 'secondary'
                }
              ],
              priority: 2
            })
          }
          break

        case 'device':
          recommendations.push({
            type: 'info',
            title: '新设备登录',
            description: '建议检查新设备的合法性，或将其添加到受信任设备列表',
            actions: [
              {
                label: '管理设备',
                action: 'manage_devices',
                type: 'primary'
              }
            ],
            priority: 3
          })
          break
      }
    })

    // 通用安全建议
    if (trustedDevices.value.length === 0) {
      recommendations.push({
        type: 'info',
        title: '添加受信任设备',
        description: '为常用设备启用信任，简化后续登录流程',
        actions: [
          {
            label: '添加设备',
            action: 'add_trusted_device',
            type: 'primary'
          }
        ],
        priority: 4
      })
    }

    // 按优先级排序
    securityRecommendations.value = recommendations.sort((a, b) => a.priority - b.priority)
  }

  // 记录登录尝试
  const recordLoginAttempt = (attempt: Omit<LoginAttempt, 'timestamp'>) => {
    const loginAttempt: LoginAttempt = {
      ...attempt,
      timestamp: new Date()
    }

    loginAttempts.value.unshift(loginAttempt)

    // 只保留最近1000条记录
    if (loginAttempts.value.length > 1000) {
      loginAttempts.value = loginAttempts.value.slice(0, 1000)
    }

    // 保存到本地存储
    localStorage.setItem('security_login_attempts', JSON.stringify(loginAttempts.value))

    // 如果正在监控，立即执行安全检查
    if (isMonitoring.value) {
      performSecurityCheck()
    }
  }

  // 刷新安全数据
  const refreshSecurityData = async () => {
    await initializeSecurityData()
  }

  // 工具函数
  const isCurrentDevice = (device: any): boolean => {
    // 简单的当前设备检测
    const currentFingerprint = navigator.userAgent + screen.width + screen.height
    return device.id === currentFingerprint || device.name === '当前设备'
  }

  const getCurrentPosition = async (): Promise<{ latitude: number; longitude: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null)
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        () => {
          resolve(null)
        },
        { timeout: 5000 }
      )
    })
  }

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // 地球半径（公里）
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const toRad = (value: number): number => {
    return value * Math.PI / 180
  }

  const generateDeviceFingerprint = async () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx?.fillText('device fingerprint', 10, 10)

    return {
      id: await generateHash(
        navigator.userAgent +
        screen.width + screen.height +
        new Date().getTimezoneOffset() +
        navigator.language +
        canvas.toDataURL()
      ),
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  }

  const generateHash = async (input: string): Promise<string> => {
    const encoder = new TextEncoder()
    const data = encoder.encode(input)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  const getTypicalLoginHours = (hours: number[]): number[] => {
    // 找出最常用的登录时间
    const hourCounts = hours.reduce((acc, hour) => {
      acc[hour] = (acc[hour] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    const sortedHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6) // 取前6个最常用的时间
      .map(([hour]) => parseInt(hour))

    return sortedHours
  }

  const analyzeLoginPatterns = () => {
    // 分析登录模式的逻辑
    return {
      frequencyScore: 0.1,
      consistencyScore: 0.8,
      riskLevel: 'low'
    }
  }

  const analyzeDevicePatterns = () => {
    // 分析设备使用模式的逻辑
    return {
      diversityScore: 0.3,
      consistencyScore: 0.9,
      riskLevel: 'low'
    }
  }

  const analyzeTimePatterns = () => {
    // 分析时间模式的逻辑
    return {
      regularityScore: 0.7,
      anomalyScore: 0.2,
      riskLevel: 'medium'
    }
  }

  const calculateAnomalyScore = (patterns: any) => {
    // 计算异常评分的逻辑
    return 0.3
  }

  const calculateDeviceTrustFactor = () => {
    const trustedCount = trustedDevices.value.length
    const deviceScore = Math.max(0, 20 - trustedCount * 5) // 设备越少，风险越高

    return {
      type: 'device' as const,
      score: deviceScore,
      description: `受信任设备数量: ${trustedCount}`,
      severity: deviceScore > 15 ? 'medium' as const : 'low' as const
    }
  }

  const generateRecommendations = (score: number, factors: any[]) => {
    const recommendations = []

    if (score > 70) {
      recommendations.push('建议立即修改密码')
      recommendations.push('启用多重身份验证')
    }

    if (score > 50) {
      recommendations.push('检查账户活动记录')
      recommendations.push('更新安全设置')
    }

    return recommendations
  }

  // 监听配置变化
  watch(monitoringConfig, (newConfig) => {
    if (isMonitoring.value) {
      stopRealTimeMonitoring()
      if (newConfig.enableRealTimeMonitoring) {
        startRealTimeMonitoring()
      }
    }
  }, { deep: true })

  return {
    // 状态
    isMonitoring,
    currentRiskScore,
    loginAttempts,
    trustedDevices,
    activeThreats,
    securityRecommendations,
    lastUpdateTime,
    monitoringConfig,

    // 计算属性
    recentAttempts,
    failedAttemptsCount,
    suspiciousActivities,

    // 方法
    startMonitoring,
    stopMonitoring,
    refreshSecurityData,
    recordLoginAttempt,
    performSecurityCheck,
    detectThreats
  }
}