// 用户上下文类型
export interface UserContext {
  deviceFingerprint: DeviceFingerprint
  behaviorPattern: BehaviorPattern
  riskScore: number
  preferredAuthMethod: AuthMethod
  userId?: string
  sessionId?: string
}

// 设备指纹信息
export interface DeviceFingerprint {
  id: string
  userAgent: string
  screenResolution: string
  timezone: string
  language: string
  platform: string
  isTrusted: boolean
  trustScore: number
  lastSeen: Date
}

// 行为模式
export interface BehaviorPattern {
  typingSpeed: number
  mouseMovementPattern: string
  loginTimePattern: number[]
  typicalLocations: GeoLocation[]
  deviceUsageDuration: number
  anomalyScore: number
}

// 地理位置信息
export interface GeoLocation {
  latitude: number
  longitude: number
  country: string
  city: string
  timestamp: Date
  isKnown: boolean
}

// 认证方法类型
export type AuthMethod =
  | 'password'
  | 'biometric'
  | 'passkey'
  | 'sms'
  | 'email'
  | 'mfa'
  | 'passwordless'
  | 'adaptive'

// 认证配置
export interface AuthConfig {
  allowedMethods: AuthMethod[]
  requiredSecurityLevel: SecurityLevel
  enableBiometric: boolean
  enableMFA: boolean
  sessionTimeout: number
  maxAttempts: number
  lockoutDuration: number
}

// 安全级别
export type SecurityLevel = 'low' | 'medium' | 'high' | 'critical'

// 风险评分
export interface RiskScore {
  value: number // 0-100
  factors: RiskFactor[]
  recommendations: string[]
  timestamp: Date
}

// 风险因素
export interface RiskFactor {
  type: 'location' | 'device' | 'behavior' | 'time' | 'network'
  score: number
  description: string
  severity: 'low' | 'medium' | 'high'
}

// 认证结果
export interface AuthResult {
  success: boolean
  userId?: string
  token?: string
  refreshToken?: string
  expiresAt?: Date
  mfaRequired?: boolean
  riskScore?: RiskScore
  nextSteps?: AuthStep[]
}

// 认证步骤
export interface AuthStep {
  type: AuthMethod
  required: boolean
  description: string
  component?: string
  props?: Record<string, any>
}

// 生物识别信息
export interface BiometricInfo {
  type: 'fingerprint' | 'face' | 'voice' | 'iris'
  available: boolean
  enrolled: boolean
  deviceSupported: boolean
  lastUsed?: Date
}

// 安全仪表板数据
export interface SecurityDashboard {
  loginAttempts: {
    successful: number
    failed: number
    suspicious: number
    locations: GeoLocation[]
    timeline: LoginAttempt[]
  }
  deviceTrust: {
    currentDevice: DeviceInfo
    trustedDevices: TrustedDevice[]
    newDevices: NewDevice[]
  }
  threatIndicators: {
    bruteForce: boolean
    unusualLocation: boolean
    deviceAnomaly: boolean
    timeAnomaly: boolean
    networkAnomaly: boolean
  }
  recommendations: SecurityRecommendation[]
}

// 设备信息
export interface DeviceInfo {
  id: string
  name: string
  type: 'desktop' | 'mobile' | 'tablet'
  platform: string
  browser: string
  location?: GeoLocation
  lastActive: Date
  trustLevel: number
}

// 受信任设备
export interface TrustedDevice extends DeviceInfo {
  trustedSince: Date
  nickname: string
  requiresMFA: boolean
}

// 新设备
export interface NewDevice extends DeviceInfo {
  verificationRequired: boolean
  verificationMethods: AuthMethod[]
}

// 登录尝试记录
export interface LoginAttempt {
  timestamp: Date
  success: boolean
  method: AuthMethod
  location: GeoLocation
  device: DeviceInfo
  riskScore: number
  reason?: string
}

// 安全建议
export interface SecurityRecommendation {
  type: 'info' | 'warning' | 'critical'
  title: string
  description: string
  actions: RecommendationAction[]
  priority: number
}

// 建议操作
export interface RecommendationAction {
  label: string
  action: string
  type: 'primary' | 'secondary' | 'danger'
}

// 个性化欢迎信息
export interface WelcomeInfo {
  userName: string
  preferredName?: string
  lastLogin?: Date
  loginStreak: number
  greetingTime: 'morning' | 'afternoon' | 'evening' | 'night'
  personalizedMessage: string
}

// 无障碍设置
export interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large'
  highContrast: boolean
  reducedMotion: boolean
  screenReader: boolean
  keyboardNavigation: boolean
}

// 主题配置
export interface ThemeConfig {
  mode: 'light' | 'dark' | 'auto'
  primaryColor: string
  accentColor: string
  customCSS?: string
  animations: boolean
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  metadata?: {
    timestamp: Date
    requestId: string
    version: string
  }
}

// 错误类型
export interface AuthError {
  code: string
  message: string
  field?: string
  retryable: boolean
  severity: 'info' | 'warning' | 'error'
  suggestions?: string[]
}

// 事件类型
export interface AuthEvent {
  type: string
  payload: any
  timestamp: Date
  userId?: string
  sessionId?: string
}