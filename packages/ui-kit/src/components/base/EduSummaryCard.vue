<template>
  <div
    :class="summaryCardClasses"
    @click="handleClick"
    :style="cardStyles"
  >
    <!-- 波纹效果 -->
    <div
      v-if="showRipple && rippleCoords"
      class="edu-summary-card__ripple"
      :style="rippleStyles"
    ></div>

    <!-- 装饰性光效 -->
    <div v-if="variant === 'glass' || variant === 'gradient'" class="edu-summary-card__shine"></div>

    <!-- 主要内容 -->
    <div class="edu-summary-card__content">
      <!-- 图标区域 -->
      <div v-if="showIcon" class="edu-summary-card__icon" :style="iconStyles">
        <slot name="icon">
          <el-icon v-if="icon" :size="iconSize">
            <component :is="icon" />
          </el-icon>
        </slot>
      </div>

      <!-- 文本信息 -->
      <div class="edu-summary-card__text">
        <div class="edu-summary-card__value">
          <slot name="value">{{ displayValue }}</slot>
        </div>
        <div class="edu-summary-card__label">
          <slot name="label">{{ label }}</slot>
        </div>
        <div v-if="$slots.description" class="edu-summary-card__description">
          <slot name="description"></slot>
        </div>
      </div>

      <!-- 操作区域 -->
      <div v-if="$slots.actions || showTrend" class="edu-summary-card__actions">
        <slot name="actions">
          <div v-if="showTrend" class="edu-summary-card__trend" :class="trendClasses">
            <el-icon :size="trendIconSize">
              <component :is="trendIcon" />
            </el-icon>
            <span class="trend-value">{{ trendValue }}</span>
          </div>
        </slot>
      </div>
    </div>

    <!-- 底部区域 -->
    <div v-if="$slots.footer" class="edu-summary-card__footer">
      <slot name="footer"></slot>
    </div>

    <!-- 加载遮罩 -->
    <div v-if="loading" class="edu-summary-card__loading-overlay">
      <div class="edu-summary-card__loading-spinner"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import { TrendCharts, ArrowUp, ArrowDown, Minus } from '@element-plus/icons-vue'

interface Props {
  variant?: 'default' | 'bordered' | 'shadow' | 'elevated' | 'glass' | 'gradient'
  size?: 'sm' | 'md' | 'lg'
  value?: string | number
  label?: string
  description?: string
  icon?: any
  iconSize?: number
  iconBackground?: string
  showIcon?: boolean
  hoverable?: boolean
  clickable?: boolean
  loading?: boolean
  disabled?: boolean
  showRipple?: boolean
  // 趋势相关
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string | number
  showTrend?: boolean
  // 格式化
  format?: 'number' | 'percentage' | 'currency' | 'custom'
  prefix?: string
  suffix?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
  value: '',
  label: '',
  iconSize: 24,
  showIcon: true,
  hoverable: true,
  clickable: false,
  loading: false,
  disabled: false,
  showRipple: false,
  showTrend: false,
  format: 'number'
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const rippleCoords = ref<{ x: number; y: number } | null>(null)

const summaryCardClasses = computed(() => [
  'edu-summary-card',
  `edu-summary-card--${props.variant}`,
  `edu-summary-card--${props.size}`,
  {
    'edu-summary-card--hoverable': props.hoverable,
    'edu-summary-card--clickable': props.clickable,
    'edu-summary-card--loading': props.loading,
    'edu-summary-card--disabled': props.disabled,
    'edu-summary-card--ripple': props.showRipple,
    'edu-summary-card--with-icon': props.showIcon,
    'edu-summary-card--with-trend': props.showTrend
  }
])

const iconStyles = computed(() => {
  const styles: Record<string, string> = {}

  if (props.iconBackground) {
    styles.background = props.iconBackground
  }

  return styles
})

const cardStyles = computed(() => {
  const styles: Record<string, string> = {}

  if (props.iconBackground && props.showIcon) {
    styles['--edu-accent-color'] = props.iconBackground
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

const trendClasses = computed(() => [
  'trend-indicator',
  `trend-indicator--${props.trend}`
])

const trendIcon = computed(() => {
  switch (props.trend) {
    case 'up':
      return ArrowUp
    case 'down':
      return ArrowDown
    case 'stable':
    default:
      return Minus
  }
})

const trendIconSize = computed(() => {
  return props.size === 'sm' ? 14 : props.size === 'lg' ? 20 : 16
})

const displayValue = computed(() => {
  const val = props.value

  if (props.format === 'custom' || val === '') {
    return val
  }

  let formattedValue = ''

  switch (props.format) {
    case 'number':
      formattedValue = typeof val === 'number' ? val.toLocaleString() : String(val)
      break
    case 'percentage':
      formattedValue = `${val}%`
      break
    case 'currency':
      formattedValue = typeof val === 'number' ? `¥${val.toLocaleString()}` : `¥${val}`
      break
    default:
      formattedValue = String(val)
  }

  return `${props.prefix || ''}${formattedValue}${props.suffix || ''}`
})

const createRipple = (event: MouseEvent) => {
  if (!props.showRipple) return

  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  rippleCoords.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }

  // 清除之前的波纹
  setTimeout(() => {
    rippleCoords.value = null
  }, 600)
}

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    createRipple(event)

    if (props.clickable) {
      emit('click', event)
    }
  }
}
</script>

<style lang="scss" scoped>
.edu-summary-card {
  background-color: var(--card-bg);
  border-radius: var(--card-border-radius);
  box-shadow: var(--card-shadow);
  transition: all var(--edu-duration-normal) var(--edu-easing-in-out);
  position: relative;
  overflow: hidden;
  cursor: default;

  &:focus-visible {
    outline: 2px solid var(--edu-primary-500);
    outline-offset: 2px;
  }

  // 变体样式
  &--default {
    border: 1px solid var(--edu-border-light);
    background: var(--edu-bg-primary);
  }

  &--bordered {
    border: 2px solid var(--edu-border-base);
    box-shadow: none;
    background: var(--edu-bg-primary);
  }

  &--shadow {
    box-shadow: var(--edu-shadow-lg);
    border: none;
    background: var(--edu-bg-primary);
  }

  &--elevated {
    box-shadow: var(--edu-shadow-xl);
    border: none;
    background: var(--edu-bg-primary);
  }

  &--glass {
    background: var(--edu-glass-bg);
    backdrop-filter: var(--edu-glass-blur);
    border: var(--edu-glass-border);
    box-shadow: var(--edu-glass-shadow);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.4) 50%,
        transparent 100%
      );
      z-index: 1;
    }
  }

  &--gradient {
    border: none;
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--card-gradient);
      z-index: 0;
    }

    .edu-summary-card__content,
    .edu-summary-card__footer {
      position: relative;
      z-index: 1;
      color: white;
    }

    .edu-summary-card__value,
    .edu-summary-card__label {
      color: white;
    }

    .edu-summary-card__label {
      color: rgba(255, 255, 255, 0.8);
    }
  }

  // 尺寸样式
  &--sm {
    .edu-summary-card__value {
      font-size: var(--font-size-lg);
    }

    .edu-summary-card__label {
      font-size: var(--font-size-xs);
    }

    .edu-summary-card__icon {
      width: 36px;
      height: 36px;
    }
  }

  &--md {
    .edu-summary-card__value {
      font-size: var(--font-size-xl);
    }

    .edu-summary-card__label {
      font-size: var(--font-size-sm);
    }

    .edu-summary-card__icon {
      width: 48px;
      height: 48px;
    }
  }

  &--lg {
    .edu-summary-card__value {
      font-size: var(--font-size-2xl);
    }

    .edu-summary-card__label {
      font-size: var(--font-size-base);
    }

    .edu-summary-card__icon {
      width: 56px;
      height: 56px;
    }
  }

  // 交互状态
  &--hoverable {
    cursor: pointer;

    &:hover:not(.edu-summary-card--disabled) {
      transform: translateY(-2px);
      box-shadow: var(--edu-shadow-lg);

      .edu-summary-card--elevated & {
        box-shadow: var(--edu-shadow-2xl);
      }
    }
  }

  &--clickable {
    cursor: pointer;

    &:active:not(.edu-summary-card--disabled) {
      transform: translateY(0);
    }
  }

  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
  }

  &--loading {
    pointer-events: none;
  }
}

.edu-summary-card__content {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
  padding: var(--spacing-base);
}

.edu-summary-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-lg);
  color: #fff;
  flex-shrink: 0;
  font-size: 20px;
}

.edu-summary-card__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.edu-summary-card__value {
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  line-height: var(--line-height-tight);
}

.edu-summary-card__label {
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  line-height: var(--line-height-normal);
}

.edu-summary-card__description {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  line-height: var(--line-height-normal);
}

.edu-summary-card__actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}

.edu-summary-card__footer {
  border-top: 1px solid var(--edu-color-gray-100);
  padding: var(--spacing-sm) var(--spacing-base);
  background: var(--edu-bg-secondary);
}

// 趋势指示器
.trend-indicator {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);

  &--up {
    color: var(--edu-success);
  }

  &--down {
    color: var(--edu-error);
  }

  &--stable {
    color: var(--text-tertiary);
  }

  .trend-value {
    font-weight: var(--font-weight-semibold);
  }
}

// 波纹效果
.edu-summary-card__ripple {
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transform: translate(-50%, -50%) scale(0);
  animation: ripple-effect 0.6s ease-out;
  pointer-events: none;
  z-index: 10;
}

@keyframes ripple-effect {
  to {
    transform: translate(-50%, -50%) scale(4);
    opacity: 0;
  }
}

// 装饰性光效
.edu-summary-card__shine {
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
  animation: shine-effect 3s infinite;
  pointer-events: none;
  z-index: 2;
}

@keyframes shine-effect {
  0% {
    transform: translateX(-100%) translateY(-100%) rotate(-45deg);
  }
  100% {
    transform: translateX(100%) translateY(100%) rotate(-45deg);
  }
}

// 加载遮罩
.edu-summary-card__loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  border-radius: inherit;
}

.edu-summary-card__loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--edu-border-light);
  border-top: 2px solid var(--edu-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// 渐变变量
.edu-summary-card {
  --card-gradient: linear-gradient(135deg, var(--edu-primary) 0%, var(--edu-primary-light) 100%);
}

// 响应式适配
@media (max-width: 768px) {
  .edu-summary-card__content {
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
  }

  .edu-summary-card--lg {
    .edu-summary-card__icon {
      width: 48px;
      height: 48px;
    }
  }
}

// 深色模式适配
[data-theme="dark"] {
  .edu-summary-card {
    background-color: var(--card-bg);
    border-color: var(--border-color);

    &--default {
      border-color: var(--border-color);
    }

    &--bordered {
      border-color: var(--border-color-strong);
    }

    &--glass {
      background: var(--edu-dark-glass-bg);
      border: var(--edu-dark-glass-border);
      box-shadow: var(--edu-dark-glass-shadow);
    }

    &--hoverable {
      &:hover:not(.edu-summary-card--disabled) {
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
      }
    }
  }

  .edu-summary-card__footer {
    border-top-color: var(--border-color);
    background: var(--edu-bg-secondary);
  }

  .edu-summary-card__loading-overlay {
    background: rgba(0, 0, 0, 0.8);
  }

  .edu-summary-card__shine {
    background: linear-gradient(
      105deg,
      transparent 40%,
      rgba(255, 255, 255, 0.05) 45%,
      rgba(255, 255, 255, 0.1) 50%,
      rgba(255, 255, 255, 0.05) 55%,
      transparent 60%
    );
  }
}
</style>