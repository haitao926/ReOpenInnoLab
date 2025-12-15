<template>
  <div
    :class="cardClasses"
    @click="handleClick"
    :style="cardStyles"
  >
    <!-- 波纹效果 -->
    <div
      v-if="showRipple && rippleCoords"
      class="edu-card__ripple"
      :style="rippleStyles"
    ></div>

    <!-- 装饰性光效 -->
    <div v-if="variant === 'glass' || variant === 'gradient'" class="edu-card__shine"></div>

    <div v-if="$slots.header || title || showHeaderActions" class="edu-card__header">
      <div class="edu-card__header-content">
        <slot name="header">
          <h3 v-if="title" class="edu-card__title">{{ title }}</h3>
          <p v-if="subtitle" class="edu-card__subtitle">{{ subtitle }}</p>
        </slot>
      </div>

      <div v-if="$slots.actions || showHeaderActions" class="edu-card__actions">
        <slot name="actions">
          <button
            v-if="showMoreButton"
            type="button"
            class="edu-card__more-btn"
            @click.stop="toggleMoreMenu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="1"/>
              <circle cx="19" cy="12" r="1"/>
              <circle cx="5" cy="12" r="1"/>
            </svg>
          </button>
        </slot>
      </div>
    </div>

    <div v-if="$slots.default" class="edu-card__body" :class="bodyClasses">
      <slot></slot>
    </div>

    <div v-if="$slots.footer" class="edu-card__footer">
      <slot name="footer"></slot>
    </div>

    <!-- 更多菜单 -->
    <div v-if="showMoreMenu" class="edu-card__more-menu" @click.stop>
      <slot name="more-menu">
        <button type="button" @click="handleMoreAction('edit')">编辑</button>
        <button type="button" @click="handleMoreAction('delete')">删除</button>
      </slot>
    </div>

    <!-- 覆盖层用于点击关闭菜单 -->
    <div v-if="showMoreMenu" class="edu-card__overlay" @click="closeMoreMenu"></div>

    <!-- 加载遮罩 -->
    <div v-if="loading" class="edu-card__loading-overlay">
      <div class="edu-card__loading-spinner"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'

interface Props {
  variant?: 'default' | 'bordered' | 'shadow' | 'elevated' | 'glass' | 'gradient'
  size?: 'sm' | 'md' | 'lg'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  title?: string
  subtitle?: string
  hoverable?: boolean
  clickable?: boolean
  selectable?: boolean
  selected?: boolean
  loading?: boolean
  disabled?: boolean
  showHeaderActions?: boolean
  showMoreButton?: boolean
  bodyClass?: string
  glassEffect?: boolean
  gradientVariant?: 'primary' | 'secondary' | 'warm' | 'cool' | 'success'
  accentColor?: string
  showRipple?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
  padding: 'md',
  hoverable: false,
  clickable: false,
  selectable: false,
  selected: false,
  loading: false,
  disabled: false,
  showHeaderActions: false,
  showMoreButton: false,
  bodyClass: '',
  glassEffect: false,
  gradientVariant: 'primary',
  accentColor: '',
  showRipple: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
  moreAction: [action: string]
  select: []
}>()

const showMoreMenu = ref(false)
const rippleCoords = ref<{ x: number; y: number } | null>(null)

const cardClasses = computed(() => [
  'edu-card',
  `edu-card--${props.variant}`,
  `edu-card--${props.size}`,
  `edu-card--padding-${props.padding}`,
  {
    'edu-card--hoverable': props.hoverable,
    'edu-card--clickable': props.clickable,
    'edu-card--selectable': props.selectable,
    'edu-card--selected': props.selected,
    'edu-card--loading': props.loading,
    'edu-card--disabled': props.disabled,
    'edu-card--glass': props.glassEffect || props.variant === 'glass',
    'edu-card--ripple': props.showRipple
  }
])

const bodyClasses = computed(() => [
  'edu-card__body-content',
  props.bodyClass
])

import { usePerformanceMode } from '../../composables/usePerformanceMode'

const { isLowPerf } = usePerformanceMode()

const cardStyles = computed(() => {
  const styles: Record<string, string> = {}

  if (props.accentColor) {
    styles['--edu-accent-color'] = props.accentColor
  }

  // Handle Low Performance Mode for Glass Effect
  if ((props.variant === 'glass' || props.glassEffect) && isLowPerf.value) {
    styles['backdrop-filter'] = 'none'
    styles['--edu-glass-blur'] = 'none'
    styles['background-color'] = 'var(--edu-bg-primary)' // Fallback to solid background
    styles['opacity'] = '0.95'
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

    if (props.selectable) {
      emit('select')
    }
    if (props.clickable) {
      emit('click', event)
    }
  }
}

const toggleMoreMenu = () => {
  showMoreMenu.value = !showMoreMenu.value
}

const closeMoreMenu = () => {
  showMoreMenu.value = false
}

const handleMoreAction = (action: string) => {
  emit('moreAction', action)
  closeMoreMenu()
}

// 点击外部关闭菜单
document.addEventListener('click', (e) => {
  if (showMoreMenu.value && !(e.target as Element).closest('.edu-card')) {
    closeMoreMenu()
  }
})
</script>

<style lang="scss" scoped>
.edu-card {
  background-color: var(--card-bg);
  border-radius: var(--card-border-radius);
  box-shadow: var(--card-shadow);
  transition: all var(--edu-duration-normal) var(--edu-easing-in-out);
  position: relative;
  overflow: hidden;

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
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.4);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05); /* Match GlassSurface card variant */
    position: relative;
    overflow: visible; /* Changed to visible to allow hover effects */
    
    transition: all 0.3s ease;

    /* Highlight top border for glass effect */
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg,
        rgba(255, 255, 255, 0) 0%,
        rgba(255, 255, 255, 0.6) 50%,
        rgba(255, 255, 255, 0) 100%
      );
      z-index: 1;
      pointer-events: none;
    }
    
    /* Hover Effect from GlassSurface */
    &:hover:not(.edu-card--disabled) {
        background: rgba(255, 255, 255, 0.75);
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        border-color: rgba(255, 255, 255, 0.6);
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

    .edu-card__header,
    .edu-card__body,
    .edu-card__footer {
      position: relative;
      z-index: 1;
      color: white;
    }

    .edu-card__title {
      color: white;
    }

    .edu-card__subtitle {
      color: rgba(255, 255, 255, 0.8);
    }
  }

  // 尺寸样式
  &--sm {
    .edu-card__title {
      font-size: var(--font-size-lg);
    }
  }

  &--md {
    .edu-card__title {
      font-size: var(--font-size-xl);
    }
  }

  &--lg {
    .edu-card__title {
      font-size: var(--font-size-2xl);
    }
  }

  // 内边距样式
  &--padding-none {
    .edu-card__header,
    .edu-card__body,
    .edu-card__footer {
      padding: 0;
    }
  }

  &--padding-sm {
    .edu-card__header {
      padding: var(--spacing-sm);
    }
    .edu-card__body {
      padding: var(--spacing-sm);
    }
    .edu-card__footer {
      padding: var(--spacing-sm);
    }
  }

  &--padding-md {
    .edu-card__header {
      padding: var(--spacing-base);
    }
    .edu-card__body {
      padding: var(--spacing-base);
    }
    .edu-card__footer {
      padding: var(--spacing-base);
    }
  }

  &--padding-lg {
    .edu-card__header {
      padding: var(--spacing-xl);
    }
    .edu-card__body {
      padding: var(--spacing-xl);
    }
    .edu-card__footer {
      padding: var(--spacing-xl);
    }
  }

  // 交互状态
  &--hoverable {
    cursor: pointer;

    &:hover:not(.edu-card--disabled) {
      transform: translateY(-2px);
      box-shadow: var(--edu-shadow-lg);

      .edu-card--elevated & {
        box-shadow: var(--edu-shadow-2xl);
      }
    }
  }

  &--clickable {
    cursor: pointer;

    &:active:not(.edu-card--disabled) {
      transform: translateY(0);
    }
  }

  &--selectable {
    cursor: pointer;
    border: 2px solid transparent;

    &:hover:not(.edu-card--disabled) {
      border-color: var(--edu-primary-200);
    }

    &.edu-card--selected {
      border-color: var(--edu-primary-500);
      background-color: var(--edu-primary-50);
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

.edu-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-base);
  border-bottom: 1px solid var(--edu-color-gray-100);
}

.edu-card__header-content {
  flex: 1;
  min-width: 0;
}

.edu-card__title {
  margin: 0 0 var(--spacing-xs) 0;
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  line-height: var(--line-height-tight);
}

.edu-card__subtitle {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-normal);
}

.edu-card__actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

.edu-card__more-btn {
  background: none;
  border: none;
  padding: var(--spacing-xs);
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--icon-color-secondary);
  transition: all var(--edu-duration-normal) var(--edu-easing-in-out);

  &:hover {
    background-color: var(--edu-color-gray-100);
    color: var(--icon-color-primary);
  }

  &:focus-visible {
    outline: 2px solid var(--edu-primary-500);
    outline-offset: 1px;
  }

  svg {
    width: 16px;
    height: 16px;
  }
}

.edu-card__body {
  flex: 1;
}

.edu-card__body-content {
  color: var(--text-primary);
  line-height: var(--line-height-relaxed);
}

.edu-card__footer {
  border-top: 1px solid var(--edu-color-gray-100);
  padding-top: var(--spacing-base);
}

.edu-card__more-menu {
  position: absolute;
  top: var(--spacing-base);
  right: var(--spacing-base);
  background-color: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-base);
  box-shadow: var(--edu-shadow-lg);
  z-index: var(--edu-z-dropdown);
  min-width: 120px;
  overflow: hidden;

  button {
    display: block;
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-base);
    background: none;
    border: none;
    text-align: left;
    font-size: var(--font-size-sm);
    color: var(--text-primary);
    cursor: pointer;
    transition: background-color var(--edu-duration-fast) var(--edu-easing-in-out);

    &:hover {
      background-color: var(--edu-color-gray-100);
    }

    &:first-child {
      padding-top: var(--spacing-base);
    }

    &:last-child {
      padding-bottom: var(--spacing-base);
    }
  }
}

.edu-card__overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--edu-z-overlay);
  background: transparent;
}

// 加载状态
.edu-card--loading {
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.4) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    animation: loading-shimmer 1.5s infinite;
    z-index: 1;
    pointer-events: none;
  }
}

@keyframes loading-shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

// 波纹效果
.edu-card__ripple {
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
.edu-card__shine {
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
.edu-card__loading-overlay {
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

.edu-card__loading-spinner {
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
.edu-card {
  --card-gradient: linear-gradient(135deg, var(--edu-primary) 0%, var(--edu-primary-light) 100%);
}

.edu-card--gradient[data-gradient-variant="secondary"] {
  --card-gradient: linear-gradient(135deg, var(--edu-secondary) 0%, var(--edu-secondary-light) 100%);
}

.edu-card--gradient[data-gradient-variant="warm"] {
  --card-gradient: linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%);
}

.edu-card--gradient[data-gradient-variant="cool"] {
  --card-gradient: linear-gradient(135deg, #4ECDC4 0%, #44A3AA 100%);
}

.edu-card--gradient[data-gradient-variant="success"] {
  --card-gradient: linear-gradient(135deg, var(--edu-success) 0%, var(--edu-success-light) 100%);
}

// 自定义强调色
.edu-card {
  --edu-accent-color: var(--edu-primary);
}

.edu-card[data-accent-color] {
  border-color: var(--edu-accent-color);

  &.edu-card--selected {
    background-color: color-mix(in srgb, var(--edu-accent-color) 10%, transparent);
    border-color: var(--edu-accent-color);
  }
}

// 深色模式适配
[data-theme="dark"] {
  .edu-card {
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

    &--selectable {
      &:hover:not(.edu-card--disabled) {
        border-color: var(--edu-primary-400);
      }

      &.edu-card--selected {
        background-color: rgba(133, 190, 255, 0.1);
        border-color: var(--edu-primary-500);
      }
    }

    &--hoverable {
      &:hover:not(.edu-card--disabled) {
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
      }
    }
  }

  .edu-card__header {
    border-bottom-color: var(--border-color);
  }

  .edu-card__footer {
    border-top-color: var(--border-color);
  }

  .edu-card__more-btn {
    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }

  .edu-card__more-menu {
    background-color: var(--bg-elevated);
    border-color: var(--border-color-strong);

    button {
      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
    }
  }

  .edu-card__loading-overlay {
    background: rgba(0, 0, 0, 0.8);
  }

  .edu-card__shine {
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