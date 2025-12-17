<template>
  <div
    :class="courseCardClasses"
    @click="handleClick"
    :style="cardStyles"
  >
    <!-- 背景渐变 -->
    <div class="edu-course-card__background">
      <div class="edu-course-card__gradient"></div>
      <div class="edu-course-card__pattern"></div>
    </div>

    <!-- 波纹效果 -->
    <div
      v-if="showRipple && rippleCoords"
      class="edu-course-card__ripple"
      :style="rippleStyles"
    ></div>

    <!-- 光效 -->
    <div class="edu-course-card__shine"></div>

    <!-- 主要内容 -->
    <div class="edu-course-card__content">
      <!-- 顶部区域 -->
      <div class="edu-course-card__header">
        <div class="edu-course-card__subject-info">
          <div class="edu-course-card__subject-icon" :class="`subject-${subject}`">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path :d="getSubjectIcon(subject)"/>
            </svg>
          </div>
          <div class="edu-course-card__subject-meta">
            <span class="edu-course-card__subject-tag">{{ getSubjectName(subject) }}</span>
            <span class="edu-course-card__grade">{{ grade }}</span>
          </div>
        </div>
        <div class="edu-course-card__status">
          <div :class="getStatusClass(status)">
            <span>{{ getStatusText(status) }}</span>
          </div>
        </div>
      </div>

      <!-- 课程信息 -->
      <div class="edu-course-card__info">
        <h3 class="edu-course-card__title">{{ title }}</h3>
        <p class="edu-course-card__description">{{ description }}</p>

        <!-- 课程统计 -->
        <div class="edu-course-card__stats">
          <div class="edu-course-card__stat">
            <svg class="edu-course-card__stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="m23 11-6-6m0 0 6-6m-6 6h6"/>
            </svg>
            <span>{{ studentCount }}名学生</span>
          </div>
          <div class="edu-course-card__stat">
            <svg class="edu-course-card__stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="9" x2="15" y2="9"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            <span>{{ chapterCount }}章节</span>
          </div>
          <div class="edu-course-card__stat">
            <svg class="edu-course-card__stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>{{ duration }}小时</span>
          </div>
        </div>
      </div>

      <!-- 底部操作区 -->
      <div class="edu-course-card__footer">
        <div class="edu-course-card__progress">
          <div class="edu-course-card__progress-bar">
            <div
              class="edu-course-card__progress-fill"
              :style="{ width: `${progress}%` }"
            ></div>
          </div>
          <span class="edu-course-card__progress-text">完成度 {{ progress }}%</span>
        </div>
        <div class="edu-course-card__actions">
          <button
            class="edu-course-card__action-btn edu-course-card__action-btn--primary"
            @click.stop="handleAction('continue')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            {{ progress > 0 ? '继续' : '开始' }}
          </button>
          <button
            class="edu-course-card__action-btn edu-course-card__action-btn--secondary"
            @click.stop="handleAction('details')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="1"/>
              <circle cx="19" cy="12" r="1"/>
              <circle cx="5" cy="12" r="1"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 装饰元素 -->
    <div class="edu-course-card__decoration">
      <div class="edu-course-card__decoration-dot edu-course-card__decoration-dot--1"></div>
      <div class="edu-course-card__decoration-dot edu-course-card__decoration-dot--2"></div>
      <div class="edu-course-card__decoration-dot edu-course-card__decoration-dot--3"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  id: string
  title: string
  description: string
  subject: string
  grade: string
  status: 'active' | 'completed' | 'draft' | 'archived'
  studentCount: number
  chapterCount: number
  duration: number
  progress: number
  coverImage?: string
  variant?: 'default' | 'featured' | 'compact'
  hoverable?: boolean
  clickable?: boolean
  showRipple?: boolean
  accentColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  hoverable: true,
  clickable: true,
  showRipple: false,
  accentColor: ''
})

const emit = defineEmits<{
  click: [courseId: string]
  action: [action: string, courseId: string]
}>()

const rippleCoords = ref<{ x: number; y: number } | null>(null)

const courseCardClasses = computed(() => [
  'edu-course-card',
  `edu-course-card--${props.variant}`,
  `edu-course-card--${props.status}`,
  {
    'edu-course-card--hoverable': props.hoverable,
    'edu-course-card--clickable': props.clickable,
    'edu-course-card--ripple': props.showRipple
  }
])

const cardStyles = computed(() => {
  const styles: Record<string, string> = {}

  if (props.accentColor) {
    styles['--course-accent-color'] = props.accentColor
  }

  return styles
})

const rippleStyles = computed(() => {
  if (!rippleCoords.value) return {}

  return {
    left: `${rippleCoords.value.x}px`,
    top: `${rippleCoords.value.y}px`
  }
})

const getSubjectName = (subject: string): string => {
  const subjects: Record<string, string> = {
    math: '数学',
    physics: '物理',
    chemistry: '化学',
    biology: '生物',
    language: '语文',
    history: '历史',
    geography: '地理',
    english: '英语',
    art: '美术',
    music: '音乐',
    pe: '体育',
    it: '信息技术'
  }
  return subjects[subject] || subject
}

const getSubjectIcon = (subject: string): string => {
  const icons: Record<string, string> = {
    math: 'M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z',
    physics: 'M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z',
    chemistry: 'M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z',
    biology: 'M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z',
    language: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
    history: 'M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z',
    geography: 'M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z',
    english: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
    art: 'M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z',
    music: 'M9 18V5l12-2v13',
    pe: 'M13.73 21a2 2 0 0 1-3.46 0',
    it: 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z'
  }
  return icons[subject] || 'M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z'
}

const getStatusClass = (status: string): string => {
  return `edu-course-card__status--${status}`
}

const getStatusText = (status: string): string => {
  const statusTexts: Record<string, string> = {
    active: '进行中',
    completed: '已完成',
    draft: '草稿',
    archived: '已归档'
  }
  return statusTexts[status] || status
}

const createRipple = (event: MouseEvent) => {
  if (!props.showRipple) return

  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  rippleCoords.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }

  setTimeout(() => {
    rippleCoords.value = null
  }, 600)
}

const handleClick = (event: MouseEvent) => {
  if (!props.disabled) {
    createRipple(event)
    if (props.clickable) {
      emit('click', props.id)
    }
  }
}

const handleAction = (action: string) => {
  emit('action', action, props.id)
}
</script>

<style lang="scss" scoped>
.edu-course-card {
  position: relative;
  width: 100%;
  border-radius: var(--edu-radius-xl);
  overflow: hidden;
  transition: all 0.4s var(--edu-ease-smooth);
  cursor: pointer;
  background: var(--edu-bg-primary);
  border: 1px solid var(--edu-border-light);

  // 变体样式
  &--default {
    height: 280px;
  }

  &--featured {
    height: 320px;
    box-shadow: var(--edu-shadow-lg);

    &:hover {
      box-shadow: var(--edu-shadow-xl);
      transform: translateY(-4px);
    }
  }

  &--compact {
    height: 200px;
  }

  // 状态样式
  &--active {
    border-color: var(--edu-primary);

    .edu-course-card__status--active {
      background: var(--edu-gradient-primary);
      color: white;
    }
  }

  &--completed {
    border-color: var(--edu-success);

    .edu-course-card__status--completed {
      background: var(--edu-gradient-secondary);
      color: white;
    }
  }

  &--draft {
    border-color: var(--edu-warning);

    .edu-course-card__status--draft {
      background: var(--edu-warning);
      color: white;
    }
  }

  &--archived {
    opacity: 0.7;
    border-color: var(--edu-border-dark);
  }

  // 交互状态
  &--hoverable:hover {
    transform: translateY(-2px);
    box-shadow: var(--edu-shadow-xl);
  }

  // 背景
  &__background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
  }

  &__gradient {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg,
      var(--course-accent-color, var(--edu-primary)) 0%,
      rgba(91, 143, 249, 0.1) 50%,
      transparent 100%);
    opacity: 0.1;
  }

  &__pattern {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image:
      radial-gradient(circle at 20% 20%, rgba(91, 143, 249, 0.05) 0%, transparent 8%),
      radial-gradient(circle at 80% 80%, rgba(91, 143, 249, 0.05) 0%, transparent 8%),
      radial-gradient(circle at 40% 40%, rgba(91, 143, 249, 0.03) 0%, transparent 6%);
    background-size: 60px 60px, 80px 80px, 40px 40px;
  }

  // 波纹效果
  &__ripple {
    position: absolute;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(91, 143, 249, 0.3);
    transform: translate(-50%, -50%) scale(0);
    animation: course-ripple 0.6s ease-out;
    pointer-events: none;
    z-index: 20;
  }

  @keyframes course-ripple {
    to {
      transform: translate(-50%, -50%) scale(8);
      opacity: 0;
    }
  }

  // 光效
  &__shine {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      105deg,
      transparent 40%,
      rgba(255, 255, 255, 0.1) 45%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(255, 255, 255, 0.1) 55%,
      transparent 60%
    );
    transform: rotate(-45deg);
    animation: course-shine 4s infinite;
    pointer-events: none;
    z-index: 2;
  }

  @keyframes course-shine {
    0% {
      transform: translateX(-100%) translateY(-100%) rotate(-45deg);
    }
    100% {
      transform: translateX(100%) translateY(100%) rotate(-45deg);
    }
  }

  // 内容区域
  &__content {
    position: relative;
    z-index: 10;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: var(--edu-spacing-lg);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--edu-spacing-base);
  }

  &__subject-info {
    display: flex;
    align-items: center;
    gap: var(--edu-spacing-sm);
  }

  &__subject-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--edu-radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 20px;

    &.subject-math { background: linear-gradient(135deg, var(--edu-color-subject-math), var(--edu-color-subject-math-light)); }
    &.subject-physics { background: linear-gradient(135deg, var(--edu-color-subject-physics), var(--edu-color-subject-physics-light)); }
    &.subject-chemistry { background: linear-gradient(135deg, var(--edu-color-subject-chemistry), var(--edu-color-subject-chemistry-light)); }
    &.subject-biology { background: linear-gradient(135deg, var(--edu-color-subject-biology), var(--edu-color-subject-biology-light)); }
    &.subject-language { background: linear-gradient(135deg, var(--edu-color-subject-language), var(--edu-color-subject-language-light)); }
    &.subject-history { background: linear-gradient(135deg, var(--edu-color-subject-history), var(--edu-color-subject-history-light)); }
    &.subject-geography { background: linear-gradient(135deg, var(--edu-color-subject-geography), var(--edu-color-subject-geography-light)); }
    &.subject-english { background: linear-gradient(135deg, var(--edu-color-subject-english), var(--edu-color-subject-english-light)); }
    &.subject-art { background: linear-gradient(135deg, var(--edu-color-subject-art), var(--edu-color-subject-art-light)); }
    &.subject-music { background: linear-gradient(135deg, var(--edu-color-subject-music), var(--edu-color-subject-music-light)); }
    &.subject-pe { background: linear-gradient(135deg, var(--edu-color-subject-pe), var(--edu-color-subject-pe-light)); }
    &.subject-it { background: linear-gradient(135deg, var(--edu-color-subject-it), var(--edu-color-subject-it-light)); }

    svg {
      width: 24px;
      height: 24px;
    }
  }

  &__subject-meta {
    display: flex;
    flex-direction: column;
    gap: var(--edu-spacing-xs);
  }

  &__subject-tag {
    font-size: var(--edu-text-sm);
    font-weight: 600;
    color: var(--edu-text-primary);
  }

  &__grade {
    font-size: var(--edu-text-xs);
    color: var(--edu-text-secondary);
  }

  &__status {
    &--active,
    &--completed,
    &--draft {
      padding: var(--edu-spacing-xs) var(--edu-spacing-sm);
      border-radius: var(--edu-radius-full);
      font-size: var(--edu-text-xs);
      font-weight: 500;
    }

    &--archived {
      padding: var(--edu-spacing-xs) var(--edu-spacing-sm);
      border-radius: var(--edu-radius-full);
      font-size: var(--edu-text-xs);
      font-weight: 500;
      background: var(--edu-bg-tertiary);
      color: var(--edu-text-secondary);
    }
  }

  &__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    margin-bottom: var(--edu-spacing-base);
  }

  &__title {
    font-size: var(--edu-text-xl);
    font-weight: 600;
    color: var(--edu-text-primary);
    margin: 0 0 var(--edu-spacing-sm) 0;
    line-height: var(--edu-leading-tight);
  }

  &__description {
    font-size: var(--edu-text-sm);
    color: var(--edu-text-secondary);
    margin: 0 0 var(--edu-spacing-base) 0;
    line-height: var(--edu-leading-normal);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__stats {
    display: flex;
    gap: var(--edu-spacing-base);
    margin-top: auto;
  }

  &__stat {
    display: flex;
    align-items: center;
    gap: var(--edu-spacing-xs);
    font-size: var(--edu-text-xs);
    color: var(--edu-text-secondary);
  }

  &__stat-icon {
    width: 14px;
    height: 14px;
    opacity: 0.6;
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--edu-spacing-base);
  }

  &__progress {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--edu-spacing-xs);
  }

  &__progress-bar {
    height: 6px;
    background: var(--edu-bg-tertiary);
    border-radius: var(--edu-radius-full);
    overflow: hidden;
  }

  &__progress-fill {
    height: 100%;
    background: var(--edu-gradient-primary);
    border-radius: var(--edu-radius-full);
    transition: width 0.6s var(--edu-ease-smooth);
    position: relative;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
      animation: progress-shimmer 2s infinite;
    }
  }

  @keyframes progress-shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  &__progress-text {
    font-size: var(--edu-text-xs);
    color: var(--edu-text-secondary);
  }

  &__actions {
    display: flex;
    gap: var(--edu-spacing-sm);
  }

  &__action-btn {
    display: flex;
    align-items: center;
    gap: var(--edu-spacing-xs);
    padding: var(--edu-spacing-sm) var(--edu-spacing-base);
    border-radius: var(--edu-radius-base);
    border: none;
    font-size: var(--edu-text-sm);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s var(--edu-ease-smooth);

    svg {
      width: 16px;
      height: 16px;
    }

    &--primary {
      background: var(--edu-gradient-primary);
      color: white;
      box-shadow: 0 4px 12px rgba(91, 143, 249, 0.3);

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(91, 143, 249, 0.4);
      }
    }

    &--secondary {
      background: var(--edu-bg-tertiary);
      color: var(--edu-text-secondary);

      &:hover {
        background: var(--edu-bg-quaternary);
        color: var(--edu-text-primary);
      }
    }
  }

  // 装饰元素
  &__decoration {
    position: absolute;
    top: 0;
    right: 0;
    width: 100px;
    height: 100px;
    z-index: 5;
  }

  &__decoration-dot {
    position: absolute;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--edu-primary);
    opacity: 0.1;

    &--1 {
      top: 20px;
      right: 20px;
      animation: float 3s ease-in-out infinite;
    }

    &--2 {
      top: 40px;
      right: 40px;
      animation: float 3s ease-in-out infinite 0.5s;
    }

    &--3 {
      top: 30px;
      right: 60px;
      animation: float 3s ease-in-out infinite 1s;
    }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
}

// 深色模式适配
[data-theme="dark"] {
  .edu-course-card {
    background: var(--edu-dark-bg-secondary);
    border-color: var(--edu-dark-border-light);

    &__subject-tag {
      color: var(--edu-dark-text-primary);
    }

    &__grade {
      color: var(--edu-dark-text-secondary);
    }

    &__title {
      color: var(--edu-dark-text-primary);
    }

    &__description {
      color: var(--edu-dark-text-secondary);
    }

    &__stat {
      color: var(--edu-dark-text-secondary);
    }

    &__progress-text {
      color: var(--edu-dark-text-secondary);
    }

    &__action-btn--secondary {
      background: var(--edu-dark-bg-tertiary);
      color: var(--edu-dark-text-secondary);

      &:hover {
        background: var(--edu-dark-bg-quaternary);
        color: var(--edu-dark-text-primary);
      }
    }
  }
}
</style>
