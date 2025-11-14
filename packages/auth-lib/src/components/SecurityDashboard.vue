<template>
  <div class="security-dashboard">
    <!-- 仪表板头部 -->
    <div class="security-dashboard__header">
      <h3 class="security-dashboard__title">
        <el-icon><Shield /></el-icon>
        安全监控中心
      </h3>
      <div class="security-dashboard__actions">
        <el-button
          size="small"
          type="primary"
          :loading="refreshing"
          @click="refreshData"
        >
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button
          size="small"
          @click="toggleSettings"
        >
          <el-icon><Setting /></el-icon>
          设置
        </el-button>
      </div>
    </div>

    <!-- 风险评分卡片 -->
    <div class="security-dashboard__risk-card">
      <div class="risk-score__display">
        <div class="risk-score__gauge">
          <svg viewBox="0 0 200 120" class="risk-gauge">
            <path
              d="M 30 100 A 70 70 0 0 1 170 100"
              fill="none"
              :stroke="gaugeBackgroundColor"
              stroke-width="20"
              stroke-linecap="round"
            />
            <path
              d="M 30 100 A 70 70 0 0 1 170 100"
              fill="none"
              :stroke="gaugeColor"
              stroke-width="20"
              stroke-linecap="round"
              :stroke-dasharray="gaugeDashArray"
              class="risk-gauge__fill"
            />
            <text
              x="100"
              y="80"
              text-anchor="middle"
              class="risk-gauge__score"
              :fill="gaugeColor"
            >
              {{ overallRiskScore }}
            </text>
            <text
              x="100"
              y="100"
              text-anchor="middle"
              class="risk-gauge__label"
            >
              风险评分
            </text>
          </svg>
        </div>
        <div class="risk-score__details">
          <h4>整体风险等级：{{ riskLevelText }}</h4>
          <p>{{ riskDescription }}</p>
          <div class="risk-score__factors">
            <div
              v-for="factor in riskFactors"
              :key="factor.type"
              class="risk-factor"
              :class="`risk-factor--${factor.severity}`"
            >
              <span class="risk-factor__type">{{ factorTypeText(factor.type) }}</span>
              <span class="risk-factor__score">{{ factor.score }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 威胁指示器 -->
    <div class="security-dashboard__threats">
      <h4>威胁监控</h4>
      <div class="threat-indicators">
        <div
          v-for="(indicator, key) in threatIndicators"
          :key="key"
          class="threat-indicator"
          :class="{
            'threat-indicator--active': indicator,
            'threat-indicator--warning': isWarningThreat(key)
          }"
        >
          <el-icon>
            <component :is="getThreatIcon(key, indicator)" />
          </el-icon>
          <span class="threat-indicator__label">{{ threatLabelText(key) }}</span>
          <span class="threat-indicator__status">
            {{ indicator ? '检测到' : '正常' }}
          </span>
        </div>
      </div>
    </div>

    <!-- 登录活动时间线 -->
    <div class="security-dashboard__timeline">
      <div class="timeline__header">
        <h4>登录活动</h4>
        <el-select
          v-model="timelineFilter"
          size="small"
          @change="filterTimeline"
        >
          <el-option label="全部" value="all" />
          <el-option label="成功登录" value="success" />
          <el-option label="失败登录" value="failed" />
          <el-option label="可疑活动" value="suspicious" />
        </el-select>
      </div>
      <div class="timeline__content">
        <div
          v-for="attempt in filteredTimeline"
          :key="attempt.timestamp"
          class="timeline-item"
          :class="`timeline-item--${attempt.success ? 'success' : 'failed'}`"
        >
          <div class="timeline-item__icon">
            <el-icon>
              <component :is="attempt.success ? 'CircleCheck' : 'CircleClose'" />
            </el-icon>
          </div>
          <div class="timeline-item__content">
            <div class="timeline-item__header">
              <span class="timeline-item__method">{{ methodText(attempt.method) }}</span>
              <span class="timeline-item__time">{{ formatTime(attempt.timestamp) }}</span>
            </div>
            <div class="timeline-item__details">
              <span>{{ attempt.location?.city || '未知位置' }}</span>
              <span>{{ attempt.device?.type || '未知设备' }}</span>
              <span v-if="attempt.riskScore" class="timeline-item__risk">
                风险: {{ attempt.riskScore }}
              </span>
            </div>
            <div
              v-if="attempt.reason"
              class="timeline-item__reason"
            >
              {{ attempt.reason }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 设备信任管理 -->
    <div class="security-dashboard__devices">
      <div class="devices__header">
        <h4>设备管理</h4>
        <el-button
          size="small"
          type="primary"
          @click="showAddDeviceDialog = true"
        >
          添加设备
        </el-button>
      </div>
      <div class="devices__grid">
        <div
          v-for="device in trustedDevices"
          :key="device.id"
          class="device-card"
          :class="{ 'device-card--current': device.isCurrent }"
        >
          <div class="device-card__icon">
            <component :is="getDeviceIcon(device.type)" />
          </div>
          <div class="device-card__info">
            <h5 class="device-card__name">{{ device.name }}</h5>
            <p class="device-card__type">{{ deviceTypeText(device.type) }}</p>
            <p class="device-card__last-seen">
              最后使用: {{ formatRelativeTime(device.lastActive) }}
            </p>
          </div>
          <div class="device-card__trust">
            <el-tag
              :type="device.trustLevel > 0.7 ? 'success' : device.trustLevel > 0.4 ? 'warning' : 'danger'"
              size="small"
            >
              信任度: {{ Math.round(device.trustLevel * 100) }}%
            </el-tag>
          </div>
          <div class="device-card__actions">
            <el-button
              v-if="!device.isCurrent"
              size="small"
              type="danger"
              link
              @click="removeDevice(device.id)"
            >
              移除
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 安全建议 -->
    <div class="security-dashboard__recommendations">
      <h4>安全建议</h4>
      <div class="recommendations__list">
        <div
          v-for="recommendation in recommendations"
          :key="recommendation.title"
          class="recommendation-item"
          :class="`recommendation-item--${recommendation.type}`"
        >
          <div class="recommendation-item__icon">
            <el-icon>
              <component :is="getRecommendationIcon(recommendation.type)" />
            </el-icon>
          </div>
          <div class="recommendation-item__content">
            <h5 class="recommendation-item__title">{{ recommendation.title }}</h5>
            <p class="recommendation-item__description">{{ recommendation.description }}</p>
            <div class="recommendation-item__actions">
              <el-button
                v-for="action in recommendation.actions"
                :key="action.label"
                :type="action.type"
                size="small"
                @click="handleRecommendationAction(action)"
              >
                {{ action.label }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 设置对话框 -->
    <el-dialog
      v-model="showSettingsDialog"
      title="安全设置"
      width="600px"
    >
      <el-form :model="securitySettings" label-width="120px">
        <el-form-item label="实时监控">
          <el-switch v-model="securitySettings.realTimeMonitoring" />
        </el-form-item>
        <el-form-item label="异常提醒">
          <el-switch v-model="securitySettings.anomalyAlerts" />
        </el-form-item>
        <el-form-item label="位置检查">
          <el-switch v-model="securitySettings.locationCheck" />
        </el-form-item>
        <el-form-item label="设备验证">
          <el-switch v-model="securitySettings.deviceVerification" />
        </el-form-item>
        <el-form-item label="风险阈值">
          <el-slider
            v-model="securitySettings.riskThreshold"
            :min="0"
            :max="100"
            :step="5"
            show-input
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSettingsDialog = false">取消</el-button>
        <el-button type="primary" @click="saveSettings">保存</el-button>
      </template>
    </el-dialog>

    <!-- 添加设备对话框 -->
    <el-dialog
      v-model="showAddDeviceDialog"
      title="添加受信任设备"
      width="500px"
    >
      <el-form :model="newDevice" label-width="100px">
        <el-form-item label="设备名称">
          <el-input v-model="newDevice.name" placeholder="例如：我的iPhone" />
        </el-form-item>
        <el-form-item label="设备类型">
          <el-select v-model="newDevice.type" placeholder="选择设备类型">
            <el-option label="手机" value="mobile" />
            <el-option label="平板" value="tablet" />
            <el-option label="笔记本" value="laptop" />
            <el-option label="台式机" value="desktop" />
          </el-select>
        </el-form-item>
        <el-form-item label="需要MFA">
          <el-switch v-model="newDevice.requiresMFA" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDeviceDialog = false">取消</el-button>
        <el-button type="primary" @click="addDevice">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSecurityMonitor } from '../composables/useSecurityMonitor'
import type {
  SecurityDashboard,
  LoginAttempt,
  TrustedDevice,
  SecurityRecommendation,
  ThreatIndicators
} from '../types'

interface Props {
  userId?: string
  realTime?: boolean
  refreshInterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  realTime: true,
  refreshInterval: 30000 // 30秒
})

const emit = defineEmits<{
  threatDetected: [threat: string, details: any]
  deviceAdded: [device: TrustedDevice]
  deviceRemoved: [deviceId: string]
  settingsChanged: [settings: any]
}>()

// Composables
const {
  currentRiskScore,
  activeThreats,
  securityRecommendations,
  loginAttempts,
  trustedDevices,
  startMonitoring,
  stopMonitoring,
  refreshSecurityData
} = useSecurityMonitor()

// 响应式状态
const refreshing = ref(false)
const showSettingsDialog = ref(false)
const showAddDeviceDialog = ref(false)
const timelineFilter = ref('all')
const refreshTimer = ref<NodeJS.Timeout | null>(null)

const securitySettings = ref({
  realTimeMonitoring: true,
  anomalyAlerts: true,
  locationCheck: true,
  deviceVerification: true,
  riskThreshold: 70
})

const newDevice = ref({
  name: '',
  type: 'mobile',
  requiresMFA: false
})

// 计算属性
const overallRiskScore = computed(() => Math.round(currentRiskScore.value?.value || 0))

const riskLevelText = computed(() => {
  const score = overallRiskScore.value
  if (score < 30) return '低风险'
  if (score < 60) return '中等风险'
  if (score < 80) return '高风险'
  return '极高风险'
})

const riskDescription = computed(() => {
  const score = overallRiskScore.value
  if (score < 30) return '您的账户安全性良好，未检测到明显威胁。'
  if (score < 60) return '检测到一些异常活动，建议提高警惕。'
  if (score < 80) return '发现可疑活动，请立即检查账户安全设置。'
  return '检测到严重安全威胁，建议立即采取保护措施。'
})

const riskFactors = computed(() => currentRiskScore.value?.factors || [])

const gaugeColor = computed(() => {
  const score = overallRiskScore.value
  if (score < 30) return '#38a169' // 绿色
  if (score < 60) return '#ed8936' // 橙色
  if (score < 80) return '#e53e3e' // 红色
  return '#c53030' // 深红色
})

const gaugeBackgroundColor = computed(() => '#e2e8f0')

const gaugeDashArray = computed(() => {
  const circumference = 2 * Math.PI * 70 * 0.5 // 半圆周长
  const score = overallRiskScore.value
  const dashLength = (circumference * score) / 100
  return `${dashLength} ${circumference}`
})

const threatIndicators = computed(() => ({
  bruteForce: activeThreats.value.includes('bruteForce'),
  unusualLocation: activeThreats.value.includes('unusualLocation'),
  deviceAnomaly: activeThreats.value.includes('deviceAnomaly'),
  timeAnomaly: activeThreats.value.includes('timeAnomaly'),
  networkAnomaly: activeThreats.value.includes('networkAnomaly')
}))

const recommendations = computed(() => securityRecommendations.value || [])

const filteredTimeline = computed(() => {
  const attempts = loginAttempts.value || []
  if (timelineFilter.value === 'all') return attempts

  return attempts.filter(attempt => {
    switch (timelineFilter.value) {
      case 'success':
        return attempt.success
      case 'failed':
        return !attempt.success
      case 'suspicious':
        return attempt.riskScore > 60
      default:
        return true
    }
  })
})

// 方法
const refreshData = async () => {
  refreshing.value = true
  try {
    await refreshSecurityData()
  } finally {
    refreshing.value = false
  }
}

const toggleSettings = () => {
  showSettingsDialog.value = true
}

const saveSettings = () => {
  localStorage.setItem('security_dashboard_settings', JSON.stringify(securitySettings.value))
  emit('settingsChanged', securitySettings.value)
  showSettingsDialog.value = false

  // 如果禁用实时监控，停止定时刷新
  if (!securitySettings.value.realTimeMonitoring) {
    stopAutoRefresh()
  } else {
    startAutoRefresh()
  }
}

const addDevice = () => {
  if (!newDevice.value.name) {
    return
  }

  const device: TrustedDevice = {
    id: 'device_' + Date.now(),
    name: newDevice.value.name,
    type: newDevice.value.type as any,
    platform: navigator.platform,
    browser: navigator.userAgent.split(' ').pop(),
    lastActive: new Date(),
    trustLevel: 0.8,
    trustedSince: new Date(),
    nickname: newDevice.value.name,
    requiresMFA: newDevice.value.requiresMFA,
    isCurrent: false
  }

  trustedDevices.value.push(device)
  localStorage.setItem('trusted_devices', JSON.stringify(trustedDevices.value))

  emit('deviceAdded', device)
  showAddDeviceDialog.value = false

  // 重置表单
  newDevice.value = {
    name: '',
    type: 'mobile',
    requiresMFA: false
  }
}

const removeDevice = (deviceId: string) => {
  const index = trustedDevices.value.findIndex(d => d.id === deviceId)
  if (index > -1) {
    trustedDevices.value.splice(index, 1)
    localStorage.setItem('trusted_devices', JSON.stringify(trustedDevices.value))
    emit('deviceRemoved', deviceId)
  }
}

const filterTimeline = () => {
  // 过滤逻辑已在计算属性中实现
}

const handleRecommendationAction = (action: any) => {
  // 处理建议操作
  console.log('Recommendation action:', action)

  // 根据操作类型执行相应逻辑
  switch (action.action) {
    case 'enable_mfa':
      // 跳转到MFA设置页面
      break
    case 'change_password':
      // 跳转到密码修改页面
      break
    case 'review_devices':
      // 滚动到设备管理区域
      break
    default:
      console.log('Unknown action:', action.action)
  }
}

// 工具函数
const factorTypeText = (type: string) => {
  const types = {
    device: '设备',
    location: '位置',
    behavior: '行为',
    time: '时间',
    network: '网络'
  }
  return types[type as keyof typeof types] || type
}

const threatLabelText = (key: string) => {
  const labels = {
    bruteForce: '暴力破解',
    unusualLocation: '异常位置',
    deviceAnomaly: '设备异常',
    timeAnomaly: '时间异常',
    networkAnomaly: '网络异常'
  }
  return labels[key as keyof typeof labels] || key
}

const methodText = (method: string) => {
  const methods = {
    password: '密码',
    biometric: '生物识别',
    passkey: 'Passkey',
    mfa: '多因子认证',
    sms: '短信验证',
    email: '邮箱验证'
  }
  return methods[method as keyof typeof methods] || method
}

const deviceTypeText = (type: string) => {
  const types = {
    mobile: '手机',
    tablet: '平板',
    laptop: '笔记本',
    desktop: '台式机'
  }
  return types[type as keyof typeof types] || type
}

const formatTime = (timestamp: Date | string) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatRelativeTime = (timestamp: Date | string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 30) return `${diffDays}天前`
  return date.toLocaleDateString('zh-CN')
}

const getThreatIcon = (key: string, active: boolean) => {
  if (active) {
    return 'Warning'
  }
  return 'CircleCheck'
}

const getDeviceIcon = (type: string) => {
  const icons = {
    mobile: 'Iphone',
    tablet: 'Ipad',
    laptop: 'Computer',
    desktop: 'Monitor'
  }
  return icons[type as keyof typeof icons] || 'Monitor'
}

const getRecommendationIcon = (type: string) => {
  const icons = {
    info: 'InfoFilled',
    warning: 'Warning',
    critical: 'CircleCloseFilled'
  }
  return icons[type as keyof typeof icons] || 'InfoFilled'
}

const isWarningThreat = (key: string) => {
  const warningThreats = ['timeAnomaly', 'networkAnomaly']
  return warningThreats.includes(key)
}

const startAutoRefresh = () => {
  if (props.realTime && securitySettings.value.realTimeMonitoring) {
    refreshTimer.value = setInterval(refreshData, props.refreshInterval)
  }
}

const stopAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

// 生命周期
onMounted(async () => {
  // 加载设置
  const savedSettings = localStorage.getItem('security_dashboard_settings')
  if (savedSettings) {
    securitySettings.value = { ...securitySettings.value, ...JSON.parse(savedSettings) }
  }

  // 初始化监控
  await startMonitoring()

  // 启动自动刷新
  startAutoRefresh()
})

// 监听设置变化
watch(() => securitySettings.value.realTimeMonitoring, (newValue) => {
  if (newValue) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
})

// 监听威胁变化
watch(activeThreats, (newThreats) => {
  if (newThreats.length > 0) {
    newThreats.forEach(threat => {
      emit('threatDetected', threat, { timestamp: new Date() })
    })
  }
})

// 清理定时器
const cleanup = () => {
  stopAutoRefresh()
  stopMonitoring()
}
</script>

<style scoped lang="scss">
.security-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--auth-spacing-lg);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--auth-spacing-xl);
  }

  &__title {
    display: flex;
    align-items: center;
    gap: var(--auth-spacing-sm);
    font-size: var(--auth-font-size-xl);
    font-weight: 600;
    margin: 0;
  }

  &__actions {
    display: flex;
    gap: var(--auth-spacing-sm);
  }

  &__risk-card {
    background: var(--auth-secondary);
    border-radius: var(--auth-radius-lg);
    padding: var(--auth-spacing-xl);
    margin-bottom: var(--auth-spacing-xl);
    box-shadow: var(--auth-shadow-md);
  }

  &__threats {
    background: var(--auth-secondary);
    border-radius: var(--auth-radius-lg);
    padding: var(--auth-spacing-lg);
    margin-bottom: var(--auth-spacing-xl);
    box-shadow: var(--auth-shadow-md);
  }

  &__timeline {
    background: var(--auth-secondary);
    border-radius: var(--auth-radius-lg);
    padding: var(--auth-spacing-lg);
    margin-bottom: var(--auth-spacing-xl);
    box-shadow: var(--auth-shadow-md);
  }

  &__devices {
    background: var(--auth-secondary);
    border-radius: var(--auth-radius-lg);
    padding: var(--auth-spacing-lg);
    margin-bottom: var(--auth-spacing-xl);
    box-shadow: var(--auth-shadow-md);
  }

  &__recommendations {
    background: var(--auth-secondary);
    border-radius: var(--auth-radius-lg);
    padding: var(--auth-spacing-lg);
    box-shadow: var(--auth-shadow-md);
  }
}

.risk-score__display {
  display: flex;
  align-items: center;
  gap: var(--auth-spacing-xl);
}

.risk-score__gauge {
  width: 200px;
  height: 120px;
}

.risk-gauge {
  width: 100%;
  height: 100%;

  &__fill {
    transition: stroke-dasharray 0.5s ease;
  }

  &__score {
    font-size: 24px;
    font-weight: bold;
  }

  &__label {
    font-size: 12px;
    fill: var(--auth-gray-500);
  }
}

.risk-score__details {
  flex: 1;
}

.risk-score__factors {
  display: flex;
  flex-wrap: wrap;
  gap: var(--auth-spacing-sm);
  margin-top: var(--auth-spacing-md);
}

.risk-factor {
  display: flex;
  align-items: center;
  gap: var(--auth-spacing-xs);
  padding: var(--auth-spacing-xs) var(--auth-spacing-sm);
  border-radius: var(--auth-radius-sm);
  font-size: var(--auth-font-size-sm);

  &--low {
    background: rgba(72, 187, 120, 0.1);
    color: var(--auth-success);
  }

  &--medium {
    background: rgba(237, 137, 54, 0.1);
    color: var(--auth-warning);
  }

  &--high {
    background: rgba(252, 129, 129, 0.1);
    color: var(--auth-danger);
  }

  &__type {
    font-weight: 500;
  }

  &__score {
    font-weight: bold;
  }
}

.threat-indicators {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--auth-spacing-md);
  margin-top: var(--auth-spacing-md);
}

.threat-indicator {
  display: flex;
  align-items: center;
  gap: var(--auth-spacing-sm);
  padding: var(--auth-spacing-md);
  border-radius: var(--auth-radius-md);
  border: 1px solid var(--auth-gray-200);
  transition: all var(--auth-transition-fast);

  &--active {
    border-color: var(--auth-danger);
    background: rgba(252, 129, 129, 0.05);
  }

  &--warning {
    border-color: var(--auth-warning);
    background: rgba(237, 137, 54, 0.05);
  }

  &__label {
    flex: 1;
    font-weight: 500;
  }

  &__status {
    font-size: var(--auth-font-size-sm);
    font-weight: 600;
  }
}

.timeline__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--auth-spacing-lg);
}

.timeline__content {
  max-height: 400px;
  overflow-y: auto;
}

.timeline-item {
  display: flex;
  gap: var(--auth-spacing-md);
  padding: var(--auth-spacing-md);
  border-radius: var(--auth-radius-md);
  margin-bottom: var(--auth-spacing-sm);

  &--success {
    background: rgba(72, 187, 120, 0.05);
  }

  &--failed {
    background: rgba(252, 129, 129, 0.05);
  }

  &__icon {
    color: var(--auth-gray-400);
  }

  .timeline-item--success &__icon {
    color: var(--auth-success);
  }

  .timeline-item--failed &__icon {
    color: var(--auth-danger);
  }

  &__content {
    flex: 1;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--auth-spacing-xs);
  }

  &__method {
    font-weight: 600;
  }

  &__time {
    font-size: var(--auth-font-size-sm);
    color: var(--auth-gray-500);
  }

  &__details {
    display: flex;
    gap: var(--auth-spacing-md);
    font-size: var(--auth-font-size-sm);
    color: var(--auth-gray-600);
  }

  &__risk {
    color: var(--auth-warning);
    font-weight: 600;
  }

  &__reason {
    font-size: var(--auth-font-size-sm);
    color: var(--auth-danger);
    margin-top: var(--auth-spacing-xs);
  }
}

.devices__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--auth-spacing-lg);
}

.devices__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--auth-spacing-md);
}

.device-card {
  display: flex;
  align-items: center;
  gap: var(--auth-spacing-md);
  padding: var(--auth-spacing-md);
  border: 2px solid var(--auth-gray-200);
  border-radius: var(--auth-radius-md);
  transition: all var(--auth-transition-fast);

  &:hover {
    border-color: var(--auth-primary-solid);
    transform: translateY(-1px);
  }

  &--current {
    border-color: var(--auth-success);
    background: rgba(72, 187, 120, 0.05);
  }

  &__icon {
    font-size: 24px;
    color: var(--auth-gray-600);
  }

  &__info {
    flex: 1;
  }

  &__name {
    font-weight: 600;
    margin: 0 0 var(--auth-spacing-xs) 0;
  }

  &__type {
    font-size: var(--auth-font-size-sm);
    color: var(--auth-gray-500);
    margin: 0 0 var(--auth-spacing-xs) 0;
  }

  &__last-seen {
    font-size: var(--auth-font-size-xs);
    color: var(--auth-gray-400);
    margin: 0;
  }

  &__trust {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--auth-spacing-xs);
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: var(--auth-spacing-xs);
  }
}

.recommendations__list {
  display: flex;
  flex-direction: column;
  gap: var(--auth-spacing-md);
  margin-top: var(--auth-spacing-lg);
}

.recommendation-item {
  display: flex;
  gap: var(--auth-spacing-md);
  padding: var(--auth-spacing-md);
  border-radius: var(--auth-radius-md);
  border-left: 4px solid;

  &--info {
    background: rgba(49, 130, 206, 0.05);
    border-left-color: var(--auth-info);
  }

  &--warning {
    background: rgba(237, 137, 54, 0.05);
    border-left-color: var(--auth-warning);
  }

  &--critical {
    background: rgba(252, 129, 129, 0.05);
    border-left-color: var(--auth-danger);
  }

  &__icon {
    font-size: 20px;
    margin-top: 2px;
  }

  .recommendation-item--info &__icon {
    color: var(--auth-info);
  }

  .recommendation-item--warning &__icon {
    color: var(--auth-warning);
  }

  .recommendation-item--critical &__icon {
    color: var(--auth-danger);
  }

  &__content {
    flex: 1;
  }

  &__title {
    font-weight: 600;
    margin: 0 0 var(--auth-spacing-xs) 0;
  }

  &__description {
    color: var(--auth-gray-600);
    margin: 0 0 var(--auth-spacing-md) 0;
  }

  &__actions {
    display: flex;
    gap: var(--auth-spacing-sm);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .security-dashboard {
    padding: var(--auth-spacing-md);
  }

  .risk-score__display {
    flex-direction: column;
    text-align: center;
  }

  .threat-indicators {
    grid-template-columns: 1fr;
  }

  .devices__grid {
    grid-template-columns: 1fr;
  }

  .timeline-item__header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--auth-spacing-xs);
  }

  .timeline-item__details {
    flex-direction: column;
    gap: var(--auth-spacing-xs);
  }
}
</style>