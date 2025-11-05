<template>
  <div class="edu-input" :class="inputClasses">
    <label v-if="label" :for="inputId" class="edu-input__label">
      {{ label }}
      <span v-if="required" class="edu-input__required">*</span>
    </label>

    <div class="edu-input__wrapper">
      <span v-if="$slots.prefix" class="edu-input__prefix">
        <slot name="prefix"></slot>
      </span>

      <input
        :id="inputId"
        ref="inputRef"
        v-model="inputValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :maxlength="maxlength"
        :class="inputElementClasses"
        @input="handleInput"
        @change="handleChange"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
      />

      <span v-if="$slots.suffix || showPasswordToggle || loading" class="edu-input__suffix">
        <button
          v-if="type === 'password' && showPasswordToggle"
          type="button"
          class="edu-input__password-toggle"
          @click="togglePasswordVisibility"
        >
          <svg v-if="showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
        </button>

        <span v-if="loading" class="edu-input__loading">
          <svg class="edu-input__spinner" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="31.416" stroke-dashoffset="31.416">
              <animate attributeName="stroke-dashoffset" dur="0.75s" values="31.416;15.708;0" repeatCount="indefinite" />
            </circle>
          </svg>
        </span>

        <slot name="suffix"></slot>
      </span>
    </div>

    <div v-if="showMessage" class="edu-input__message" :class="messageClasses">
      <svg v-if="error" class="edu-input__error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
      <svg v-else-if="success" class="edu-input__success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
      {{ message }}
    </div>

    <div v-if="showCharacterCount" class="edu-input__character-count">
      {{ characterCount }}/{{ maxlength }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Props {
  modelValue?: string | number
  type?: 'text' | 'password' | 'email' | 'tel' | 'url' | 'number'
  label?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  error?: boolean
  success?: boolean
  message?: string
  maxlength?: number
  showCharacterCount?: boolean
  showPasswordToggle?: boolean
  loading?: boolean
  size?: 'sm' | 'base' | 'lg'
  clearable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  readonly: false,
  required: false,
  error: false,
  success: false,
  showCharacterCount: false,
  showPasswordToggle: true,
  loading: false,
  size: 'base',
  clearable: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  input: [event: Event]
  change: [event: Event]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  keydown: [event: KeyboardEvent]
  clear: []
}>()

const inputRef = ref<HTMLInputElement>()
const focused = ref(false)
const showPassword = ref(false)

const inputId = computed(() => `edu-input-${Math.random().toString(36).substr(2, 9)}`)

const inputClasses = computed(() => [
  `edu-input--${props.size}`,
  {
    'edu-input--disabled': props.disabled,
    'edu-input--readonly': props.readonly,
    'edu-input--error': props.error,
    'edu-input--success': props.success,
    'edu-input--focused': focused.value,
    'edu-input--has-value': props.modelValue !== '' && props.modelValue != null
  }
])

const inputElementClasses = computed(() => [
  'edu-input__inner',
  {
    'edu-input__inner--has-prefix': !!props.$slots?.prefix,
    'edu-input__inner--has-suffix': !!props.$slots?.suffix || props.showPasswordToggle || props.loading
  }
])

const showMessage = computed(() => props.message && (props.error || props.success))
const messageClasses = computed(() => [
  'edu-input__message',
  {
    'edu-input__message--error': props.error,
    'edu-input__message--success': props.success
  }
])

const characterCount = computed(() => {
  const value = String(props.modelValue || '')
  return value.length
})

const inputValue = computed<string | number>({
  get: () => props.modelValue ?? '',
  set: value => emit('update:modelValue', value)
})

const handleInput = (event: Event) => {
  emit('input', event)
}

const handleChange = (event: Event) => {
  emit('change', event)
}

const handleFocus = (event: FocusEvent) => {
  focused.value = true
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  focused.value = false
  emit('blur', event)
}

const handleKeydown = (event: KeyboardEvent) => {
  emit('keydown', event)
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const focus = () => {
  inputRef.value?.focus()
}

const blur = () => {
  inputRef.value?.blur()
}

const select = () => {
  inputRef.value?.select()
}

// 暴露方法
defineExpose({
  focus,
  blur,
  select,
  inputRef
})

// 监听 type 变化重置密码可见性
watch(() => props.type, () => {
  if (props.type !== 'password') {
    showPassword.value = false
  }
})
</script>

<style lang="scss" scoped>
.edu-input {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  width: 100%;
}

.edu-input__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  line-height: var(--line-height-tight);
}

.edu-input__required {
  color: var(--edu-color-error-default);
  margin-left: 2px;
}

.edu-input__wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.edu-input__inner {
  width: 100%;
  height: var(--input-height-base);
  padding: 0 var(--input-padding-x);
  border: var(--input-border);
  border-radius: var(--radius-base);
  background-color: var(--input-bg);
  color: var(--input-color);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  transition: all var(--edu-duration-normal) var(--edu-easing-in-out);

  &::placeholder {
    color: var(--input-color-placeholder);
  }

  &:focus {
    outline: none;
    border: var(--input-border-focus);
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
  }

  &:disabled {
    background-color: var(--input-bg-disabled);
    color: var(--input-color-disabled);
    cursor: not-allowed;
  }

  &:readonly {
    background-color: var(--input-bg-readonly);
    cursor: default;
  }

  &--has-prefix {
    padding-left: calc(var(--input-padding-x) + var(--input-icon-size) + var(--input-icon-spacing));
  }

  &--has-suffix {
    padding-right: calc(var(--input-padding-x) + var(--input-icon-size) + var(--input-icon-spacing));
  }
}

// 尺寸变体
.edu-input--sm {
  .edu-input__inner {
    height: var(--input-height-sm);
    font-size: var(--font-size-sm);
  }
}

.edu-input--lg {
  .edu-input__inner {
    height: var(--input-height-lg);
    font-size: var(--font-size-lg);
  }
}

// 状态样式
.edu-input--error {
  .edu-input__inner {
    border-color: var(--input-border-error);
    box-shadow: 0 0 0 3px rgba(244, 67, 54, 0.1);

    &:focus {
      border-color: var(--input-border-error);
      box-shadow: 0 0 0 3px rgba(244, 67, 54, 0.2);
    }
  }
}

.edu-input--success {
  .edu-input__inner {
    border-color: var(--edu-color-success-default);
    box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);

    &:focus {
      border-color: var(--edu-color-success-default);
      box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2);
    }
  }
}

.edu-input__prefix,
.edu-input__suffix {
  position: absolute;
  display: flex;
  align-items: center;
  color: var(--input-icon-color);
  font-size: var(--input-icon-size);
}

.edu-input__prefix {
  left: var(--input-padding-x);
}

.edu-input__suffix {
  right: var(--input-padding-x);
  gap: var(--spacing-xs);
}

.edu-input__password-toggle {
  background: none;
  border: none;
  padding: 2px;
  cursor: pointer;
  color: var(--input-icon-color);
  border-radius: var(--radius-sm);
  transition: color var(--edu-duration-normal) var(--edu-easing-in-out);

  &:hover {
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

.edu-input__loading {
  display: flex;
  align-items: center;
  animation: spin 1s linear infinite;
}

.edu-input__spinner {
  width: 14px;
  height: 14px;
  color: var(--input-icon-color);
}

.edu-input__message {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
  line-height: var(--line-height-normal);
}

.edu-input__message--error {
  color: var(--edu-color-error-default);
}

.edu-input__message--success {
  color: var(--edu-color-success-default);
}

.edu-input__error-icon,
.edu-input__success-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.edu-input__character-count {
  align-self: flex-end;
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  line-height: var(--line-height-normal);
}

.edu-input--disabled {
  .edu-input__label {
    color: var(--text-disabled);
  }

  .edu-input__prefix,
  .edu-input__suffix {
    color: var(--text-disabled);
  }
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
  .edu-input__inner {
    &:focus {
      box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.2);
    }
  }

  .edu-input--error {
    .edu-input__inner {
      &:focus {
        box-shadow: 0 0 0 3px rgba(244, 67, 54, 0.3);
      }
    }
  }

  .edu-input--success {
    .edu-input__inner {
      &:focus {
        box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.3);
      }
    }
  }
}
</style>
