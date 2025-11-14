<template>
  <div class="personalized-welcome">
    <!-- 动态欢迎消息 -->
    <div class="welcome__header">
      <div class="welcome__greeting">
        <h2 class="welcome__title">
          <span class="welcome__greeting-text">{{ greetingText }}</span>
          <span class="welcome__user-name">{{ displayName }}</span>
        </h2>
        <p class="welcome__subtitle">{{ personalizedMessage }}</p>
      </div>

      <!-- 用户头像 -->
      <div class="welcome__avatar">
        <div class="avatar__container">
          <img
            v-if="userAvatar"
            :src="userAvatar"
            :alt="displayName"
            class="avatar__image"
            @error="handleAvatarError"
          />
          <div v-else class="avatar__placeholder">
            <el-icon><User /></el-icon>
          </div>
          <div class="avatar__status" :class="`avatar__status--${accountStatus}`"></div>
        </div>
      </div>
    </div>

    <!-- 统计信息卡片 -->
    <div class="welcome__stats">
      <div class="stats__grid">
        <div
          v-for="stat in userStats"
          :key="stat.key"
          class="stat-card"
          :class="`stat-card--${stat.type}`"
        >
          <div class="stat-card__icon">
            <el-icon>
              <component :is="stat.icon" />
            </el-icon>
          </div>
          <div class="stat-card__content">
            <div class="stat-card__value">{{ stat.value }}</div>
            <div class="stat-card__label">{{ stat.label }}</div>
          </div>
          <div v-if="stat.trend" class="stat-card__trend">
            <el-icon :class="`trend--${stat.trend.direction}`">
              <component :is="stat.trend.icon" />
            </el-icon>
            <span class="trend__value">{{ stat.trend.value }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近活动 -->
    <div v-if="showRecentActivity" class="welcome__activity">
      <h3 class="activity__title">最近活动</h3>
      <div class="activity__timeline">
        <div
          v-for="activity in recentActivities"
          :key="activity.id"
          class="activity-item"
          :class="`activity-item--${activity.type}`"
        >
          <div class="activity-item__icon">
            <el-icon>
              <component :is="getActivityIcon(activity.type)" />
            </el-icon>
          </div>
          <div class="activity-item__content">
            <div class="activity-item__title">{{ activity.title }}</div>
            <div class="activity-item__description">{{ activity.description }}</div>
            <div class="activity-item__time">{{ formatRelativeTime(activity.timestamp) }}</div>
          </div>
          <div v-if="activity.action" class="activity-item__action">
            <el-button
              size="small"
              link
              @click="handleActivityAction(activity)"
            >
              {{ activity.action.label }}
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 个性化提示 -->
    <div v-if="showTips" class="welcome__tips">
      <div class="tips__container">
        <div class="tips__icon">
          <el-icon><Lightbulb /></el-icon>
        </div>
        <div class="tips__content">
          <h4 class="tips__title">{{ currentTip.title }}</h4>
          <p class="tips__description">{{ currentTip.description }}</p>
          <div v-if="currentTip.action" class="tips__action">
            <el-button
              size="small"
              type="primary"
              @click="handleTipAction(currentTip)"
            >
              {{ currentTip.action.label }}
            </el-button>
          </div>
        </div>
        <div class="tips__navigation">
          <el-button
            size="small"
            circle
            @click="previousTip"
          >
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <span class="tips__counter">{{ currentTipIndex + 1 }} / {{ tips.length }}</span>
          <el-button
            size="small"
            circle
            @click="nextTip"
          >
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
      </div>
    </div>

    <!-- 快速操作 -->
    <div v-if="showQuickActions" class="welcome__quick-actions">
      <h3 class="quick-actions__title">快速操作</h3>
      <div class="quick-actions__grid">
        <div
          v-for="action in quickActions"
          :key="action.key"
          class="quick-action-card"
          @click="handleQuickAction(action)"
        >
          <div class="quick-action-card__icon">
            <el-icon>
              <component :is="action.icon" />
            </el-icon>
          </div>
          <div class="quick-action-card__label">{{ action.label }}</div>
          <div v-if="action.badge" class="quick-action-card__badge">
            {{ action.badge }}
          </div>
        </div>
      </div>
    </div>

    <!-- 成就徽章 -->
    <div v-if="showAchievements && achievements.length > 0" class="welcome__achievements">
      <h3 class="achievements__title">最近成就</h3>
      <div class="achievements__list">
        <div
          v-for="achievement in achievements"
          :key="achievement.id"
          class="achievement-badge"
          :class="{
            'achievement-badge--new': achievement.isNew,
            'achievement-badge--rare': achievement.rarity === 'rare',
            'achievement-badge--legendary': achievement.rarity === 'legendary'
          }"
          :title="achievement.description"
        >
          <div class="achievement-badge__icon">
            <el-icon>
              <component :is="achievement.icon" />
            </el-icon>
          </div>
          <div class="achievement-badge__name">{{ achievement.name }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useUserPreferences } from '../composables/useUserPreferences'
import type { WelcomeInfo, UserStats, Activity, Tip, QuickAction, Achievement } from '../types'

interface Props {
  userName?: string
  preferredName?: string
  lastLogin?: Date
  showRecentActivity?: boolean
  showTips?: boolean
  showQuickActions?: boolean
  showAchievements?: boolean
  userAvatar?: string
  accountStatus?: 'active' | 'away' | 'busy' | 'offline'
}

const props = withDefaults(defineProps<Props>(), {
  showRecentActivity: true,
  showTips: true,
  showQuickActions: true,
  showAchievements: true,
  accountStatus: 'active'
})

const emit = defineEmits<{
  quickAction: [action: QuickAction]
  activityAction: [activity: Activity]
  tipAction: [tip: Tip]
  avatarError: []
}>()

// Composables
const { userPreferences, updatePreferences } = useUserPreferences()

// 响应式状态
const currentTipIndex = ref(0)
const avatarError = ref(false)

// 计算属性
const currentTime = computed(() => new Date())

const greetingTime = computed(() => {
  const hour = currentTime.value.getHours()
  if (hour < 6) return 'night'
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
})

const greetingText = computed(() => {
  const greetings = {
    morning: '早上好',
    afternoon: '下午好',
    evening: '晚上好',
    night: '夜深了'
  }
  return greetings[greetingTime.value as keyof typeof greetings]
})

const displayName = computed(() => {
  return props.preferredName || props.userName || '用户'
})

const personalizedMessage = computed(() => {
  const messages = {
    morning: [
      '美好的一天开始了！',
      '今天也要加油哦！',
      '早安！准备好开始新的一天了吗？'
    ],
    afternoon: [
      '下午好！记得适当休息。',
      '工作进展如何？',
      '午后时光，保持专注！'
    ],
    evening: [
      '晚上好！今天辛苦了。',
      '傍晚时分，整理一下今天的工作吧。',
      '傍晚好！享受这宁静的时刻。'
    ],
    night: [
      '夜深了，注意休息。',
      '还在忙碌吗？记得早点休息。',
      '晚上好！不要熬夜太晚哦。'
    ]
  }

  const timeMessages = messages[greetingTime.value as keyof typeof messages]
  const randomIndex = Math.floor(Math.random() * timeMessages.length)

  // 如果有上次登录时间，添加额外信息
  if (props.lastLogin) {
    const daysSinceLastLogin = Math.floor(
      (currentTime.value.getTime() - props.lastLogin.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysSinceLastLogin === 0) {
      return `欢迎回来！${timeMessages[randomIndex]}`
    } else if (daysSinceLastLogin === 1) {
      return `昨天见过面了！${timeMessages[randomIndex]}`
    } else if (daysSinceLastLogin < 7) {
      return `${daysSinceLastLogin}天没见了，欢迎回来！`
    } else {
      return `好久不见！欢迎回来，${timeMessages[randomIndex]}`
    }
  }

  return timeMessages[randomIndex]
})

const userStats = computed<UserStats[]>(() => [
  {
    key: 'loginStreak',
    label: '连续登录',
    value: `${calculateLoginStreak()}天`,
    icon: 'Calendar',
    type: 'success',
    trend: {
      direction: 'up',
      icon: 'ArrowUp',
      value: '+1'
    }
  },
  {
    key: 'totalLogins',
    label: '总登录次数',
    value: getTotalLogins().toString(),
    icon: 'UserFilled',
    type: 'info'
  },
  {
    key: 'securityLevel',
    label: '安全等级',
    value: getSecurityLevel(),
    icon: 'Shield',
    type: getSecurityLevelType()
  },
  {
    key: 'activeDevices',
    label: '活跃设备',
    value: getActiveDevicesCount().toString(),
    icon: 'Monitor',
    type: 'warning'
  }
])

const recentActivities = computed<Activity[]>(() => {
  // 模拟最近活动数据
  return [
    {
      id: '1',
      type: 'login',
      title: '登录成功',
      description: '使用生物识别登录',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      action: {
        label: '查看详情',
        action: 'view_login_details'
      }
    },
    {
      id: '2',
      type: 'security',
      title: '安全设置更新',
      description: '启用了双重验证',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      action: {
        label: '管理设置',
        action: 'manage_security'
      }
    },
    {
      id: '3',
      type: 'achievement',
      title: '获得新成就',
      description: '连续登录7天',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000)
    }
  ]
})

const tips = computed<Tip[]>(() => [
  {
    id: '1',
    title: '启用生物识别',
    description: '使用指纹或面部识别可以让登录更快速、更安全。',
    action: {
      label: '立即设置',
      action: 'setup_biometric'
    }
  },
  {
    id: '2',
    title: '添加受信任设备',
    description: '为常用设备启用信任，简化后续登录流程。',
    action: {
      label: '管理设备',
      action: 'manage_devices'
    }
  },
  {
    id: '3',
    title: '定期检查安全设置',
    description: '保持安全设置更新，确保账户安全。',
    action: {
      label: '检查设置',
      action: 'check_security'
    }
  },
  {
    id: '4',
    title: '了解新功能',
    description: '探索平台的新功能，提升使用体验。',
    action: {
      label: '了解更多',
      action: 'learn_more'
    }
  }
])

const currentTip = computed(() => tips.value[currentTipIndex.value])

const quickActions = computed<QuickAction[]>(() => [
  {
    key: 'profile',
    label: '个人资料',
    icon: 'User',
    action: 'edit_profile'
  },
  {
    key: 'security',
    label: '安全设置',
    icon: 'Lock',
    action: 'security_settings',
    badge: '新'
  },
  {
    key: 'devices',
    label: '设备管理',
    icon: 'Monitor',
    action: 'device_management'
  },
  {
    key: 'activity',
    label: '活动记录',
    icon: 'Document',
    action: 'view_activity'
  },
  {
    key: 'help',
    label: '帮助中心',
    icon: 'QuestionFilled',
    action: 'help_center'
  },
  {
    key: 'feedback',
    label: '意见反馈',
    icon: 'ChatDotRound',
    action: 'feedback'
  }
])

const achievements = computed<Achievement[]>(() => {
  // 模拟成就数据
  return [
    {
      id: '1',
      name: '安全先锋',
      icon: 'Shield',
      description: '启用了所有安全功能',
      rarity: 'common',
      isNew: false
    },
    {
      id: '2',
      name: '生物识别专家',
      icon: 'Fingerprint',
      description: '成功设置生物识别',
      rarity: 'rare',
      isNew: true
    },
    {
      id: '3',
      name: '连续一周',
      icon: 'Calendar',
      description: '连续登录7天',
      rarity: 'common',
      isNew: false
    }
  ]
})

// 方法
const calculateLoginStreak = (): number => {
  // 计算连续登录天数
  const loginHistory = JSON.parse(localStorage.getItem('login_history') || '[]')
  if (loginHistory.length === 0) return 0

  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()

  if (loginHistory[0] === today) return 1
  if (loginHistory[0] === yesterday) return 2

  return 1
}

const getTotalLogins = (): number => {
  const loginHistory = JSON.parse(localStorage.getItem('login_history') || '[]')
  return loginHistory.length
}

const getSecurityLevel = (): string => {
  const settings = JSON.parse(localStorage.getItem('security_settings') || '{}')

  let score = 0
  if (settings.biometricEnabled) score += 25
  if (settings.mfaEnabled) score += 30
  if (settings.trustedDevices > 0) score += 20
  if (settings.strongPassword) score += 25

  if (score >= 80) return '高'
  if (score >= 60) return '中'
  if (score >= 40) return '低'
  return '极低'
}

const getSecurityLevelType = (): 'success' | 'warning' | 'danger' | 'info' => {
  const level = getSecurityLevel()
  const types = {
    '高': 'success',
    '中': 'warning',
    '低': 'danger',
    '极低': 'danger'
  }
  return types[level as keyof typeof types] as 'success' | 'warning' | 'danger' | 'info'
}

const getActiveDevicesCount = (): number => {
  const devices = JSON.parse(localStorage.getItem('trusted_devices') || '[]')
  return devices.filter((device: any) => device.isActive).length
}

const handleAvatarError = () => {
  avatarError.value = true
  emit('avatarError')
}

const formatRelativeTime = (timestamp: Date): string => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`

  return timestamp.toLocaleDateString('zh-CN')
}

const getActivityIcon = (type: string) => {
  const icons = {
    login: 'CircleCheck',
    security: 'Lock',
    achievement: 'Trophy',
    device: 'Monitor',
    warning: 'Warning'
  }
  return icons[type as keyof typeof icons] || 'InfoFilled'
}

const handleActivityAction = (activity: Activity) => {
  if (activity.action) {
    emit('activityAction', activity)
  }
}

const handleTipAction = (tip: Tip) => {
  emit('tipAction', tip)
}

const handleQuickAction = (action: QuickAction) => {
  emit('quickAction', action)
}

const nextTip = () => {
  currentTipIndex.value = (currentTipIndex.value + 1) % tips.value.length
}

const previousTip = () => {
  currentTipIndex.value = currentTipIndex.value === 0
    ? tips.value.length - 1
    : currentTipIndex.value - 1
}

// 生命周期
onMounted(() => {
  // 记录本次登录
  const loginHistory = JSON.parse(localStorage.getItem('login_history') || '[]')
  const today = new Date().toDateString()

  if (!loginHistory.includes(today)) {
    loginHistory.unshift(today)
    if (loginHistory.length > 30) {
      loginHistory.pop()
    }
    localStorage.setItem('login_history', JSON.stringify(loginHistory))
  }

  // 自动切换提示
  setInterval(() => {
    if (props.showTips) {
      nextTip()
    }
  }, 10000) // 每10秒切换一次提示
})

// 监听用户偏好变化
watch(userPreferences, (newPreferences) => {
  // 根据用户偏好调整显示内容
  if (newPreferences.showTips !== props.showTips) {
    // 可以通过父组件更新props
  }
}, { deep: true })
</script>

<style scoped lang="scss">
.personalized-welcome {
  max-width: 800px;
  margin: 0 auto;
}

.welcome__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--auth-spacing-xl);
}

.welcome__greeting {
  flex: 1;
}

.welcome__title {
  font-size: var(--auth-font-size-3xl);
  font-weight: 700;
  margin: 0 0 var(--auth-spacing-sm) 0;
  line-height: 1.2;
  color: var(--auth-gray-900);
}

.welcome__greeting-text {
  background: var(--auth-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome__user-name {
  color: var(--auth-gray-900);
}

.welcome__subtitle {
  font-size: var(--auth-font-size-lg);
  color: var(--auth-gray-600);
  margin: 0;
  line-height: 1.5;
}

.welcome__avatar {
  margin-left: var(--auth-spacing-lg);
}

.avatar__container {
  position: relative;
  width: 80px;
  height: 80px;
}

.avatar__image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--auth-primary);
}

.avatar__placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: var(--auth-gray-200);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: var(--auth-gray-500);
  border: 3px solid var(--auth-primary);
}

.avatar__status {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 3px solid white;

  &--active {
    background: var(--auth-success);
  }

  &--away {
    background: var(--auth-warning);
  }

  &--busy {
    background: var(--auth-danger);
  }

  &--offline {
    background: var(--auth-gray-400);
  }
}

.welcome__stats {
  margin-bottom: var(--auth-spacing-xl);
}

.stats__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--auth-spacing-md);
}

.stat-card {
  display: flex;
  align-items: center;
  gap: var(--auth-spacing-md);
  padding: var(--auth-spacing-lg);
  background: var(--auth-secondary);
  border-radius: var(--auth-radius-lg);
  box-shadow: var(--auth-shadow-sm);
  transition: all var(--auth-transition-fast);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--auth-shadow-md);
  }

  &--success {
    border-left: 4px solid var(--auth-success);
  }

  &--info {
    border-left: 4px solid var(--auth-info);
  }

  &--warning {
    border-left: 4px solid var(--auth-warning);
  }

  &--danger {
    border-left: 4px solid var(--auth-danger);
  }
}

.stat-card__icon {
  font-size: 24px;
  color: var(--auth-primary);
}

.stat-card__content {
  flex: 1;
}

.stat-card__value {
  font-size: var(--auth-font-size-xl);
  font-weight: 700;
  color: var(--auth-gray-900);
  line-height: 1;
}

.stat-card__label {
  font-size: var(--auth-font-size-sm);
  color: var(--auth-gray-500);
  margin-top: var(--auth-spacing-xs);
}

.stat-card__trend {
  display: flex;
  align-items: center;
  gap: var(--auth-spacing-xs);
  font-size: var(--auth-font-size-sm);
}

.trend--up {
  color: var(--auth-success);
}

.trend--down {
  color: var(--auth-danger);
}

.welcome__activity {
  margin-bottom: var(--auth-spacing-xl);
}

.activity__title {
  font-size: var(--auth-font-size-lg);
  font-weight: 600;
  margin: 0 0 var(--auth-spacing-lg) 0;
  color: var(--auth-gray-900);
}

.activity__timeline {
  display: flex;
  flex-direction: column;
  gap: var(--auth-spacing-md);
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: var(--auth-spacing-md);
  padding: var(--auth-spacing-md);
  border-radius: var(--auth-radius-md);
  transition: background-color var(--auth-transition-fast);

  &:hover {
    background: var(--auth-gray-50);
  }

  &--login {
    border-left: 3px solid var(--auth-success);
  }

  &--security {
    border-left: 3px solid var(--auth-info);
  }

  &--achievement {
    border-left: 3px solid var(--auth-warning);
  }
}

.activity-item__icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--auth-gray-100);
  color: var(--auth-gray-600);
}

.activity-item--login .activity-item__icon {
  background: rgba(72, 187, 120, 0.1);
  color: var(--auth-success);
}

.activity-item--security .activity-item__icon {
  background: rgba(49, 130, 206, 0.1);
  color: var(--auth-info);
}

.activity-item--achievement .activity-item__icon {
  background: rgba(237, 137, 54, 0.1);
  color: var(--auth-warning);
}

.activity-item__content {
  flex: 1;
}

.activity-item__title {
  font-weight: 600;
  color: var(--auth-gray-900);
  margin-bottom: var(--auth-spacing-xs);
}

.activity-item__description {
  font-size: var(--auth-font-size-sm);
  color: var(--auth-gray-600);
  margin-bottom: var(--auth-spacing-xs);
}

.activity-item__time {
  font-size: var(--auth-font-size-xs);
  color: var(--auth-gray-400);
}

.activity-item__action {
  margin-top: var(--auth-spacing-xs);
}

.welcome__tips {
  margin-bottom: var(--auth-spacing-xl);
}

.tips__container {
  display: flex;
  align-items: flex-start;
  gap: var(--auth-spacing-md);
  padding: var(--auth-spacing-lg);
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  border-radius: var(--auth-radius-lg);
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.tips__icon {
  font-size: 24px;
  color: var(--auth-primary);
  margin-top: var(--auth-spacing-xs);
}

.tips__content {
  flex: 1;
}

.tips__title {
  font-size: var(--auth-font-size-base);
  font-weight: 600;
  color: var(--auth-gray-900);
  margin: 0 0 var(--auth-spacing-xs) 0;
}

.tips__description {
  font-size: var(--auth-font-size-sm);
  color: var(--auth-gray-600);
  margin: 0 0 var(--auth-spacing-md) 0;
  line-height: 1.5;
}

.tips__navigation {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--auth-spacing-xs);
}

.tips__counter {
  font-size: var(--auth-font-size-xs);
  color: var(--auth-gray-500);
}

.welcome__quick-actions {
  margin-bottom: var(--auth-spacing-xl);
}

.quick-actions__title {
  font-size: var(--auth-font-size-lg);
  font-weight: 600;
  margin: 0 0 var(--auth-spacing-lg) 0;
  color: var(--auth-gray-900);
}

.quick-actions__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--auth-spacing-md);
}

.quick-action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--auth-spacing-sm);
  padding: var(--auth-spacing-lg);
  background: var(--auth-secondary);
  border-radius: var(--auth-radius-lg);
  cursor: pointer;
  transition: all var(--auth-transition-fast);
  position: relative;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--auth-shadow-md);
    background: var(--auth-primary);
    color: white;
  }
}

.quick-action-card__icon {
  font-size: 24px;
  color: var(--auth-primary);
  transition: color var(--auth-transition-fast);

  .quick-action-card:hover & {
    color: white;
  }
}

.quick-action-card__label {
  font-size: var(--auth-font-size-sm);
  font-weight: 500;
  text-align: center;
  color: var(--auth-gray-700);
  transition: color var(--auth-transition-fast);

  .quick-action-card:hover & {
    color: white;
  }
}

.quick-action-card__badge {
  position: absolute;
  top: var(--auth-spacing-xs);
  right: var(--auth-spacing-xs);
  background: var(--auth-danger);
  color: white;
  font-size: var(--auth-font-size-xs);
  padding: 2px 6px;
  border-radius: var(--auth-radius-full);
  font-weight: 600;
}

.welcome__achievements {
  margin-bottom: var(--auth-spacing-xl);
}

.achievements__title {
  font-size: var(--auth-font-size-lg);
  font-weight: 600;
  margin: 0 0 var(--auth-spacing-lg) 0;
  color: var(--auth-gray-900);
}

.achievements__list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--auth-spacing-md);
}

.achievement-badge {
  display: flex;
  align-items: center;
  gap: var(--auth-spacing-sm);
  padding: var(--auth-spacing-sm) var(--auth-spacing-md);
  background: var(--auth-gray-100);
  border-radius: var(--auth-radius-full);
  border: 2px solid transparent;
  transition: all var(--auth-transition-fast);
  cursor: pointer;

  &:hover {
    transform: scale(1.05);
    border-color: var(--auth-primary);
  }

  &--new {
    background: linear-gradient(135deg, rgba(237, 137, 54, 0.1), rgba(237, 137, 54, 0.2));
    border-color: var(--auth-warning);
    animation: achievementPulse 2s ease-in-out infinite;
  }

  &--rare {
    background: linear-gradient(135deg, rgba(49, 130, 206, 0.1), rgba(49, 130, 206, 0.2));
    border-color: var(--auth-info);
  }

  &--legendary {
    background: linear-gradient(135deg, rgba(252, 129, 129, 0.1), rgba(252, 129, 129, 0.2));
    border-color: var(--auth-danger);
    animation: achievementShine 3s ease-in-out infinite;
  }
}

@keyframes achievementPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes achievementShine {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.achievement-badge__icon {
  font-size: 18px;
  color: var(--auth-gray-600);
}

.achievement-badge__name {
  font-size: var(--auth-font-size-sm);
  font-weight: 600;
  color: var(--auth-gray-700);
}

// 响应式设计
@media (max-width: 768px) {
  .welcome__header {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: var(--auth-spacing-md);
  }

  .welcome__avatar {
    margin-left: 0;
  }

  .stats__grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--auth-spacing-sm);
  }

  .quick-actions__grid {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: var(--auth-spacing-sm);
  }

  .tips__container {
    flex-direction: column;
    text-align: center;
  }

  .tips__navigation {
    flex-direction: row;
    justify-content: center;
  }
}
</style>