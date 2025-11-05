<template>
  <span :class="tagClasses" @click="handleClick">
    <span v-if="$slots.icon" class="edu-tag__icon">
      <slot name="icon"></slot>
    </span>

    <span class="edu-tag__content">
      <slot></slot>
    </span>

    <button
      v-if="closable"
      type="button"
      class="edu-tag__close"
      @click.stop="handleClose"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' |
           'physics' | 'chemistry' | 'math' | 'biology' | 'language' | 'history' |
           'geography' | 'english' | 'art' | 'music' | 'pe' | 'it'
  size?: 'xs' | 'sm' | 'base' | 'lg'
  closable?: boolean
  disabled?: boolean
  clickable?: boolean
  round?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'base',
  closable: false,
  disabled: false,
  clickable: false,
  round: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
  close: []
}>()

const tagClasses = computed(() => [
  'edu-tag',
  `edu-tag--${props.variant}`,
  `edu-tag--${props.size}`,
  {
    'edu-tag--closable': props.closable,
    'edu-tag--disabled': props.disabled,
    'edu-tag--clickable': props.clickable,
    'edu-tag--round': props.round
  }
])

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && props.clickable) {
    emit('click', event)
  }
}

const handleClose = () => {
  if (!props.disabled) {
    emit('close')
  }
}
</script>

<style lang="scss" scoped>
.edu-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--tag-icon-spacing);
  border-radius: var(--tag-radius);
  font-family: var(--font-family-sans);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-tight);
  white-space: nowrap;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);
  position: relative;

  &:focus-visible {
    outline: 2px solid var(--edu-primary-500);
    outline-offset: 1px;
  }

  // 尺寸变体
  &--xs {
    height: var(--tag-height-xs);
    padding: 0 var(--tag-padding-x-sm);
    font-size: var(--font-size-xs);
  }

  &--sm {
    height: var(--tag-height-sm);
    padding: 0 var(--tag-padding-x-sm);
    font-size: var(--font-size-xs);
  }

  &--base {
    height: var(--tag-height-base);
    padding: 0 var(--tag-padding-x-base);
    font-size: var(--font-size-sm);
  }

  &--lg {
    height: var(--tag-height-lg);
    padding: 0 var(--tag-padding-x-lg);
    font-size: var(--font-size-base);
  }

  // 默认样式
  &--default {
    background-color: var(--edu-color-gray-100);
    color: var(--edu-color-gray-700);
    border: 1px solid var(--edu-color-gray-200);

    &:hover:not(.edu-tag--disabled) {
      background-color: var(--edu-color-gray-200);
    }
  }

  // 主要标签
  &--primary {
    background-color: var(--edu-primary-50);
    color: var(--edu-primary-700);
    border: 1px solid var(--edu-primary-100);

    &:hover:not(.edu-tag--disabled) {
      background-color: var(--edu-primary-100);
    }
  }

  // 状态标签
  &--success {
    background-color: var(--tag-success-bg);
    color: var(--tag-success-color);
    border: 1px solid var(--edu-color-success-light);

    &:hover:not(.edu-tag--disabled) {
      background-color: var(--edu-color-success-default);
      color: var(--text-on-primary);
    }
  }

  &--warning {
    background-color: var(--tag-warning-bg);
    color: var(--tag-warning-color);
    border: 1px solid var(--edu-color-warning-light);

    &:hover:not(.edu-tag--disabled) {
      background-color: var(--edu-color-warning-default);
      color: var(--text-on-primary);
    }
  }

  &--error {
    background-color: var(--tag-error-bg);
    color: var(--tag-error-color);
    border: 1px solid var(--edu-color-error-light);

    &:hover:not(.edu-tag--disabled) {
      background-color: var(--edu-color-error-default);
      color: var(--text-on-primary);
    }
  }

  &--info {
    background-color: var(--edu-color-info-light);
    color: var(--edu-color-info-default);
    border: 1px solid var(--edu-color-info-light);

    &:hover:not(.edu-tag--disabled) {
      background-color: var(--edu-color-info-default);
      color: var(--text-on-primary);
    }
  }

  // 学科标签
  &--physics {
    background-color: var(--tag-physics-bg);
    color: var(--tag-physics-color);
    border: 1px solid var(--physics-light);

    &:hover:not(.edu-tag--disabled) {
      background-color: var(--physics-primary);
      color: var(--text-on-primary);
    }
  }

  &--chemistry {
    background-color: var(--tag-chemistry-bg);
    color: var(--tag-chemistry-color);
    border: 1px solid var(--chemistry-light);

    &:hover:not(.edu-tag--disabled) {
      background-color: var(--chemistry-primary);
      color: var(--text-on-primary);
    }
  }

  &--math {
    background-color: var(--tag-math-bg);
    color: var(--tag-math-color);
    border: 1px solid var(--math-light);

    &:hover:not(.edu-tag--disabled) {
      background-color: var(--math-primary);
      color: var(--text-on-primary);
    }
  }

  &--biology {
    background-color: var(--biology-light);
    color: var(--biology-primary);
    border: 1px solid var(--biology-light);

    &:hover:not(.edu-tag--disabled) {
      background-color: var(--biology-primary);
      color: var(--text-on-primary);
    }
  }

  &--language {
    background-color: var(--tag-language-light);
    color: var(--tag-language-color);
    border: 1px solid var(--language-light);

    &:hover:not(.edu-tag--disabled) {
      background-color: var(--language-primary);
      color: var(--text-on-primary);
    }
  }

  &--history {
    background-color: #fff3e0;
    color: #e65100;
    border: 1px solid #fff3e0;

    &:hover:not(.edu-tag--disabled) {
      background-color: #e65100;
      color: var(--text-on-primary);
    }
  }

  &--geography {
    background-color: #e1f5fe;
    color: #0277bd;
    border: 1px solid #e1f5fe;

    &:hover:not(.edu-tag--disabled) {
      background-color: #0277bd;
      color: var(--text-on-primary);
    }
  }

  &--english {
    background-color: #e8f5e8;
    color: #2e7d32;
    border: 1px solid #e8f5e8;

    &:hover:not(.edu-tag--disabled) {
      background-color: #2e7d32;
      color: var(--text-on-primary);
    }
  }

  &--art {
    background-color: var(--biology-light);
    color: var(--biology-primary);
    border: 1px solid var(--biology-light);

    &:hover:not(.edu-tag--disabled) {
      background-color: var(--biology-primary);
      color: var(--text-on-primary);
    }
  }

  &--music {
    background-color: #fce4ec;
    color: #c2185b;
    border: 1px solid #fce4ec;

    &:hover:not(.edu-tag--disabled) {
      background-color: #c2185b;
      color: var(--text-on-primary);
    }
  }

  &--pe {
    background-color: var(--math-light);
    color: var(--math-primary);
    border: 1px solid var(--math-light);

    &:hover:not(.edu-tag--disabled) {
      background-color: var(--math-primary);
      color: var(--text-on-primary);
    }
  }

  &--it {
    background-color: #eceff1;
    color: #455a64;
    border: 1px solid #eceff1;

    &:hover:not(.edu-tag--disabled) {
      background-color: #455a64;
      color: var(--text-on-primary);
    }
  }

  // 交互状态
  &--closable {
    padding-right: calc(var(--tag-padding-x-base) - 4px);
  }

  &--clickable {
    cursor: pointer;

    &:hover:not(.edu-tag--disabled) {
      transform: scale(1.05);
    }

    &:active:not(.edu-tag--disabled) {
      transform: scale(0.95);
    }
  }

  &--round {
    border-radius: var(--radius-full);
  }

  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
  }
}

.edu-tag__icon {
  display: flex;
  align-items: center;

  svg {
    width: var(--tag-icon-size);
    height: var(--tag-icon-size);
  }
}

.edu-tag__content {
  display: flex;
  align-items: center;
}

.edu-tag__close {
  background: none;
  border: none;
  padding: 2px;
  margin-left: var(--tag-icon-spacing);
  cursor: pointer;
  color: currentColor;
  opacity: 0.6;
  border-radius: var(--radius-sm);
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    opacity: 1;
    background-color: rgba(0, 0, 0, 0.1);
  }

  &:focus-visible {
    outline: 2px solid var(--edu-primary-500);
    outline-offset: 1px;
  }

  svg {
    width: 12px;
    height: 12px;
  }
}

// 深色模式适配
[data-theme="dark"] {
  .edu-tag {
    &--default {
      background-color: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.87);
      border-color: rgba(255, 255, 255, 0.2);

      &:hover:not(.edu-tag--disabled) {
        background-color: rgba(255, 255, 255, 0.15);
      }
    }

    &--primary {
      background-color: rgba(33, 150, 243, 0.2);
      color: #90caf9;
      border-color: rgba(33, 150, 243, 0.3);

      &:hover:not(.edu-tag--disabled) {
        background-color: rgba(33, 150, 243, 0.3);
      }
    }

    &--closable .edu-tag__close {
      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
    }
  }
}
</style>