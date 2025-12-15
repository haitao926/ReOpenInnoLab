<template>
  <div
    :class="containerClasses"
    :style="containerStyles"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDensity } from '@/composables/useDensity'

interface Props {
  variant?: 'default' | 'card' | 'list' | 'table' | 'compact'
  spacing?: 'xs' | 'sm' | 'base' | 'lg' | 'xl'
  padding?: 'xs' | 'sm' | 'base' | 'lg' | 'xl'
  gap?: 'xs' | 'sm' | 'base' | 'lg' | 'xl'
  rounded?: 'none' | 'sm' | 'base' | 'lg' | 'xl'
  background?: 'none' | 'primary' | 'secondary' | 'surface' | 'elevated'
  border?: boolean
  hoverable?: boolean
  transition?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  spacing: 'base',
  padding: undefined,
  gap: undefined,
  rounded: 'base',
  background: 'none',
  border: false,
  hoverable: false,
  transition: true
})

const { isCompact, currentConfig } = useDensity()

const containerClasses = computed(() => {
  const classes = [
    'density-container',
    `density-container--${props.variant}`,
    `density-container--spacing-${props.spacing}`,
    {
      'density-container--compact': isCompact.value,
      'density-container--border': props.border,
      'density-container--hoverable': props.hoverable,
      'density-container--transition': props.transition,
      'density-container--padded': props.padding !== undefined
    }
  ]

  // 添加圆角类
  if (props.rounded !== 'none') {
    classes.push(`density-container--rounded-${props.rounded}`)
  }

  // 添加背景类
  if (props.background !== 'none') {
    classes.push(`density-container--bg-${props.background}`)
  }

  return classes
})

const containerStyles = computed(() => {
  const styles: Record<string, string> = {}

  // 设置间距，如果未指定则使用默认值
  const gapSize = props.gap || 'base'
  styles['--container-gap'] = currentConfig.value.gap[gapSize]

  // 设置内边距（如果指定）
  if (props.padding !== undefined) {
    styles['--container-padding'] = currentConfig.value.padding[props.padding]
  }

  // 根据密度调整字体大小
  if (isCompact.value) {
    styles['--container-font-size'] = currentConfig.value.fontSize.base
    styles['--container-line-height'] = currentConfig.value.lineHeight.normal
  } else {
    styles['--container-font-size'] = '16px'
    styles['--container-line-height'] = '1.5'
  }

  return styles
})
</script>

<style scoped lang="scss">
.density-container {
  display: flex;
  flex-direction: column;
  gap: var(--container-gap);
  font-size: var(--container-font-size);
  line-height: var(--container-line-height);
  transition: all var(--edu-duration-normal) var(--edu-easing-in-out);

  // 变体样式
  &--default {
    // 默认容器样式
  }

  &--card {
    padding: var(--density-card-padding);
    border-radius: var(--density-radius-lg);
    background: var(--edu-bg-primary);
    box-shadow: var(--edu-shadow-sm);
  }

  &--list {
    padding: var(--density-padding-base);
    background: transparent;
  }

  &--table {
    background: var(--edu-bg-primary);
    border-radius: var(--density-radius-base);
    overflow: hidden;
  }

  &--compact {
    // 紧凑模式特殊样式
    --density-card-padding: var(--density-padding-base);
    --density-card-gap: var(--density-spacing-base);
  }

  // 间距变体
  &--spacing-xs { gap: var(--density-spacing-xs); }
  &--spacing-sm { gap: var(--density-spacing-sm); }
  &--spacing-base { gap: var(--density-spacing-base); }
  &--spacing-lg { gap: var(--density-spacing-lg); }
  &--spacing-xl { gap: var(--density-spacing-xl); }

  // 圆角变体
  &--rounded-sm { border-radius: var(--density-radius-sm); }
  &--rounded-base { border-radius: var(--density-radius-base); }
  &--rounded-lg { border-radius: var(--density-radius-lg); }
  &--rounded-xl { border-radius: var(--density-radius-xl); }

  // 背景变体
  &--bg-primary {
    background: var(--edu-primary-50);
    color: var(--edu-primary-700);
  }

  &--bg-secondary {
    background: var(--edu-secondary-50);
    color: var(--edu-secondary-700);
  }

  &--bg-surface {
    background: var(--edu-bg-secondary);
  }

  &--bg-elevated {
    background: var(--edu-bg-elevated);
  }

  // 边框
  &--border {
    border: 1px solid var(--edu-border-light);
  }

  // 悬停效果
  &--hoverable {
    cursor: pointer;
    transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--edu-shadow-md);
    }

    &:active {
      transform: translateY(0);
    }
  }

  // 过渡效果
  &--transition {
    transition: all var(--edu-duration-normal) var(--edu-easing-in-out);
  }

  // 内边距
  &--padded {
    padding: var(--container-padding);
  }

  // 水平布局
  &--horizontal {
    flex-direction: row;
    align-items: center;
  }

  // 居中对齐
  &--center {
    align-items: center;
    justify-content: center;
  }

  // 两端对齐
  &--between {
    justify-content: space-between;
  }

  // 均匀分布
  &--around {
    justify-content: space-around;
  }

  // 垂直居中
  &--center-vertical {
    justify-content: center;
  }

  // 响应式间距调整 - 使用标准断点
  @media (max-width: 475px) {
    &--spacing-sm { gap: var(--density-spacing-xs); }
    &--spacing-base { gap: var(--density-spacing-sm); }
    &--spacing-lg { gap: var(--density-spacing-base); }
    &--spacing-xl { gap: var(--density-spacing-lg); }
    &--padded {
      padding: var(--density-padding-xs);
    }
  }

  @media (min-width: 476px) and (max-width: 768px) {
    &--spacing-sm { gap: var(--density-spacing-sm); }
    &--spacing-base { gap: var(--density-spacing-base); }
    &--spacing-lg { gap: var(--density-spacing-lg); }
    &--spacing-xl { gap: var(--density-spacing-xl); }
    &--padded {
      padding: var(--density-padding-sm);
    }
  }

  @media (min-width: 769px) and (max-width: 1024px) {
    &--spacing-lg { gap: var(--density-spacing-lg); }
    &--spacing-xl { gap: var(--density-spacing-xl); }
    &--padded {
      padding: var(--density-padding-base);
    }
  }
}

// 深色模式适配
[data-theme="dark"] {
  .density-container {
    &--bg-primary {
      background: rgba(33, 150, 243, 0.1);
      color: #90caf9;
    }

    &--bg-secondary {
      background: rgba(82, 196, 26, 0.1);
      color: #a3d977;
    }

    &--border {
      border-color: var(--border-color);
    }
  }
}
</style>