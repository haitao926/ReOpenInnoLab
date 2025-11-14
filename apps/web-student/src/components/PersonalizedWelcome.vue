<template>
  <div class="personalized-welcome">
    <div class="welcome-header">
      <h2 class="welcome-title">{{ greetingText }}</h2>
      <p class="welcome-subtitle">{{ personalizedMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  userName?: string
  lastLogin?: Date
  showRecentActivity?: boolean
  showTips?: boolean
  showQuickActions?: boolean
  showAchievements?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showRecentActivity: false,
  showTips: false,
  showQuickActions: false,
  showAchievements: false
})

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

const personalizedMessage = computed(() => {
  if (props.lastLogin) {
    const daysSinceLastLogin = Math.floor(
      (currentTime.value.getTime() - props.lastLogin.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysSinceLastLogin === 0) {
      return '欢迎回来！今天也要加油哦！'
    } else if (daysSinceLastLogin === 1) {
      return '昨天见过面了，很高兴再次见到您！'
    } else if (daysSinceLastLogin < 7) {
      return `${daysSinceLastLogin}天没见了，欢迎回来！`
    } else {
      return '好久不见！欢迎回来，今天也要加油哦！'
    }
  }

  return '美好的一天开始了！今天也要加油哦！'
})
</script>

<style scoped lang="scss">
.personalized-welcome {
  text-align: center;
  margin-bottom: 2rem;
}

.welcome-header {
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
}
</style>