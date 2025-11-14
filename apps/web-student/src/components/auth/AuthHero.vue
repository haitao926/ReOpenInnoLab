<template>
  <div class="auth-hero">
    <div class="hero-content">
      <!-- 品牌标志 -->
      <div class="brand-logo">
        <h1>{{ brandName }}</h1>
        <p>{{ brandSubtitle }}</p>
      </div>

      <!-- 特色功能展示 -->
      <div class="hero-features" v-if="showFeatures">
        <div class="feature-item" v-for="feature in features" :key="feature.id">
          <el-icon :size="24">
            <component :is="feature.icon" />
          </el-icon>
          <div>
            <h4>{{ feature.title }}</h4>
            <p>{{ feature.description }}</p>
          </div>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="hero-stats" v-if="showStats">
        <div class="stat-item" v-for="stat in stats" :key="stat.id">
          <div class="stat-number">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>

      <!-- 个性化欢迎 -->
      <div class="personalized-welcome" v-if="showPersonalizedGreeting">
        <h3>{{ greetingText }}</h3>
        <p>{{ welcomeMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Star, Trophy, UserFilled, Lock, Monitor, CircleCheck } from '@element-plus/icons-vue'

interface Props {
  brandName?: string
  brandSubtitle?: string
  showFeatures?: boolean
  showStats?: boolean
  showPersonalizedGreeting?: boolean
  userType?: 'student' | 'teacher' | 'admin'
}

const props = withDefaults(defineProps<Props>(), {
  brandName: '开源浦育',
  brandSubtitle: 'ReOpenInnoLab',
  showFeatures: true,
  showStats: true,
  showPersonalizedGreeting: false,
  userType: 'student'
})

const currentTime = ref(new Date())
const hour = computed(() => currentTime.value.getHours())

const greetingTime = computed(() => {
  if (hour.value < 6) return 'night'
  if (hour.value < 12) return 'morning'
  if (hour.value < 18) return 'afternoon'
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

const welcomeMessage = computed(() => {
  const userTypeText = props.userType === 'teacher' ? '老师' : props.userType === 'admin' ? '管理员' : '同学'
  const messages = {
    morning: `美好的一天开始了！${userTypeText}今天也要加油哦！`,
    afternoon: `下午好！${userTypeText}记得适当休息。`,
    evening: `晚上好！${userTypeText}今天辛苦了。`,
    night: `夜深了，${userTypeText}注意休息。`
  }
  return messages[greetingTime.value as keyof typeof messages]
})

// 根据用户类型定制特色功能
const features = computed(() => {
  const baseFeatures = [
    {
      id: 1,
      icon: Star,
      title: '智能学习',
      description: 'AI驱动的个性化学习体验'
    },
    {
      id: 2,
      icon: Trophy,
      title: '成就系统',
      description: '记录每一次进步与成长'
    },
    {
      id: 3,
      icon: CircleCheck,
      title: '安全可靠',
      description: '企业级安全保护'
    }
  ]

  if (props.userType === 'teacher') {
    return [
      {
        id: 1,
        icon: Star,
        title: '智能教学',
        description: 'AI辅助教学设计与评估'
      },
      {
        id: 2,
        icon: Trophy,
        title: '教学管理',
        description: '高效的课程与班级管理'
      },
      {
        id: 3,
        icon: UserFilled,
        title: '师生互动',
        description: '便捷的沟通与协作工具'
      }
    ]
  }

  return baseFeatures
})

const stats = [
  {
    id: 1,
    value: '10K+',
    label: '活跃用户'
  },
  {
    id: 2,
    value: '500+',
    label: '精品课程'
  },
  {
    id: 3,
    value: '99.9%',
    label: '满意度'
  }
]

onMounted(() => {
  // 每分钟更新时间以保持个性化欢迎的准确性
  setInterval(() => {
    currentTime.value = new Date()
  }, 60000)
})
</script>

<style scoped lang="scss">
@import "@/assets/styles/variables.scss";

.auth-hero {
  width: 100%;
  max-width: 500px;
  position: relative;
  z-index: 2;
}

.hero-content {
  text-align: center;
}

// 品牌标志
.brand-logo {
  text-align: center;
  margin-bottom: 3rem;

  h1 {
    font-size: 3.5rem;
    font-weight: 900;
    margin: 0 0 1rem 0;
    background: linear-gradient(45deg, #ffffff, #f0f0f0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  p {
    font-size: 1.5rem;
    margin: 0;
    opacity: 0.9;
    font-weight: 300;
    letter-spacing: 2px;
  }
}

// 特色功能展示
.hero-features {
  margin-bottom: 3rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateX(5px);
  }

  h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1.2rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    opacity: 0.8;
    font-size: 0.95rem;
    line-height: 1.4;
  }
}

// 统计信息
.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  text-align: center;
}

.stat-item {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);

  .stat-number {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    background: linear-gradient(45deg, #ffd700, #ffed4e);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .stat-label {
    font-size: 0.9rem;
    opacity: 0.8;
  }
}

// 个性化欢迎
.personalized-welcome {
  padding: 2rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 2rem;

  h3 {
    font-size: 1.8rem;
    font-weight: 700;
    margin: 0 0 1rem 0;
    color: #ffffff;
  }

  p {
    font-size: 1.1rem;
    margin: 0;
    opacity: 0.9;
    line-height: 1.5;
    color: #ffffff;
  }
}

// 响应式设计
@media (max-width: 1024px) {
  .brand-logo h1 {
    font-size: 2.5rem;
  }

  .brand-logo p {
    font-size: 1.2rem;
  }

  .feature-item {
    margin-bottom: 1rem;
    padding: 1rem;
  }

  .hero-stats {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
  }
}

@media (max-width: 768px) {
  .brand-logo h1 {
    font-size: 2rem;
  }

  .brand-logo p {
    font-size: 1rem;
  }

  .feature-item {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }

  .hero-features {
    margin-bottom: 2rem;
  }

  .hero-stats {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .personalized-welcome {
    padding: 1.5rem;
  }
}
</style>