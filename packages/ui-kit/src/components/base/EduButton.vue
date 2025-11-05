<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || loading"
    :type="type"
    @click="handleClick"
  >
    <span v-if="loading" class="edu-button__loading">
      <svg class="edu-button__spinner" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="31.416" stroke-dashoffset="31.416">
          <animate attributeName="stroke-dashoffset" dur="0.75s" values="31.416;15.708;0" repeatCount="indefinite" />
        </circle>
      </svg>
    </span>

    <span v-if="$slots.icon && !loading" class="edu-button__icon">
      <slot name="icon"></slot>
    </span>

    <span class="edu-button__content">
      <slot></slot>
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'danger'
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl'
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
  block?: boolean
  rounded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'base',
  disabled: false,
  loading: false,
  type: 'button',
  block: false,
  rounded: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonClasses = computed(() => [
  'edu-button',
  `edu-button--${props.variant}`,
  `edu-button--${props.size}`,
  {
    'edu-button--disabled': props.disabled,
    'edu-button--loading': props.loading,
    'edu-button--block': props.block,
    'edu-button--rounded': props.rounded
  }
])

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<style lang="scss" scoped>
.edu-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  border: none;
  border-radius: var(--radius-base);
  font-family: var(--font-family-sans);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  cursor: pointer;
  transition: all var(--edu-duration-normal) var(--edu-easing-in-out);
  position: relative;
  white-space: nowrap;
  user-select: none;

  &:focus-visible {
    outline: 2px solid var(--edu-primary-500);
    outline-offset: 2px;
  }

  // 尺寸变体
  &--xs {
    height: var(--btn-height-xs);
    padding: 0 var(--btn-padding-x-sm);
    font-size: var(--font-size-xs);
  }

  &--sm {
    height: var(--btn-height-sm);
    padding: 0 var(--btn-padding-x-sm);
    font-size: var(--font-size-sm);
  }

  &--base {
    height: var(--btn-height-base);
    padding: 0 var(--btn-padding-x-base);
    font-size: var(--font-size-base);
  }

  &--lg {
    height: var(--btn-height-lg);
    padding: 0 var(--btn-padding-x-lg);
    font-size: var(--font-size-lg);
  }

  &--xl {
    height: var(--btn-height-xl);
    padding: 0 var(--btn-padding-x-lg);
    font-size: var(--font-size-xl);
  }

  // 主要按钮
  &--primary {
    background-color: var(--btn-primary-bg);
    color: var(--text-on-primary);

    &:hover:not(:disabled) {
      background-color: var(--btn-primary-bg-hover);
      transform: translateY(-1px);
      box-shadow: var(--edu-shadow-md);
    }

    &:active:not(:disabled) {
      background-color: var(--btn-primary-bg-active);
      transform: translateY(0);
    }

    &:disabled {
      background-color: var(--btn-primary-bg-disabled);
      color: var(--text-disabled);
      cursor: not-allowed;
    }
  }

  // 次要按钮
  &--secondary {
    background-color: transparent;
    color: var(--edu-primary-500);
    border: 1px solid var(--btn-secondary-border);

    &:hover:not(:disabled) {
      background-color: var(--edu-primary-50);
      border-color: var(--btn-secondary-border-hover);
    }

    &:active:not(:disabled) {
      background-color: var(--edu-primary-100);
    }

    &:disabled {
      border-color: var(--btn-secondary-border-disabled);
      color: var(--text-disabled);
      cursor: not-allowed;
    }
  }

  // 轮廓按钮
  &--outline {
    background-color: transparent;
    color: var(--edu-primary-500);
    border: 1px solid var(--edu-primary-500);

    &:hover:not(:disabled) {
      background-color: var(--edu-primary-500);
      color: var(--text-on-primary);
    }

    &:disabled {
      color: var(--text-disabled);
      border-color: var(--text-disabled);
      cursor: not-allowed;
    }
  }

  // 文本按钮
  &--text {
    background-color: transparent;
    color: var(--edu-primary-500);
    padding: 0;

    &:hover:not(:disabled) {
      background-color: var(--edu-primary-50);
    }

    &:disabled {
      color: var(--text-disabled);
      cursor: not-allowed;
    }
  }

  // 危险按钮
  &--danger {
    background-color: var(--edu-color-error-default);
    color: var(--text-on-primary);

    &:hover:not(:disabled) {
      background-color: var(--edu-color-error-dark);
      transform: translateY(-1px);
      box-shadow: var(--edu-shadow-md);
    }

    &:active:not(:disabled) {
      background-color: var(--edu-color-error-default);
      transform: translateY(0);
    }

    &:disabled {
      background-color: var(--edu-color-error-light);
      color: var(--text-disabled);
      cursor: not-allowed;
    }
  }

  // 块级按钮
  &--block {
    width: 100%;
  }

  // 圆角按钮
  &--rounded {
    border-radius: var(--radius-full);
  }

  // 加载状态
  &--loading {
    cursor: wait;
    opacity: var(--btn-loading-opacity);
  }

  // 禁用状态
  &--disabled {
    cursor: not-allowed;
    pointer-events: none;
  }
}

.edu-button__loading {
  display: flex;
  align-items: center;
  animation: spin 1s linear infinite;
}

.edu-button__spinner {
  width: var(--btn-spinner-size);
  height: var(--btn-spinner-size);
  color: currentColor;
}

.edu-button__icon {
  display: flex;
  align-items: center;

  svg {
    width: var(--btn-icon-size-base);
    height: var(--btn-icon-size-base);
  }

  // 不同尺寸的图标大小
  .edu-button--xs & {
    svg {
      width: var(--btn-icon-size-xs);
      height: var(--btn-icon-size-xs);
    }
  }

  .edu-button--sm & {
    svg {
      width: var(--btn-icon-size-sm);
      height: var(--btn-icon-size-sm);
    }
  }

  .edu-button--lg & {
    svg {
      width: var(--btn-icon-size-lg);
      height: var(--btn-icon-size-lg);
    }
  }
}

.edu-button__content {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 深色模式适配
[data-theme="dark"] {
  .edu-button {
    &--secondary {
      &:hover:not(:disabled) {
        background-color: rgba(255, 255, 255, 0.08);
      }
    }

    &--text {
      &:hover:not(:disabled) {
        background-color: rgba(255, 255, 255, 0.08);
      }
    }
  }
}
</style>