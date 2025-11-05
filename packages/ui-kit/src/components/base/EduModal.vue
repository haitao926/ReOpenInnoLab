<template>
  <teleport to="body">
    <transition
      name="modal"
      appear
      @before-enter="handleBeforeEnter"
      @after-enter="handleAfterEnter"
      @before-leave="handleBeforeLeave"
      @after-leave="handleAfterLeave"
    >
      <div
        v-if="visible"
        ref="modalRef"
        class="edu-modal"
        :class="modalClasses"
        role="dialog"
        :aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="descriptionId"
        @keydown.esc="handleEscape"
      >
        <!-- 背景遮罩 -->
        <div
          class="edu-modal__overlay"
          @click="handleOverlayClick"
        ></div>

        <!-- 模态框内容 -->
        <div
          class="edu-modal__content"
          role="document"
          :style="contentStyles"
        >
          <!-- 标题栏 -->
          <header
            v-if="$slots.header || title"
            class="edu-modal__header"
          >
            <h2
              :id="titleId"
              class="edu-modal__title"
            >
              <slot name="header">{{ title }}</slot>
            </h2>
            <button
              type="button"
              class="edu-modal__close"
              :aria-label="closeAriaLabel"
              @click="handleClose"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </header>

          <!-- 主体内容 -->
          <main
            class="edu-modal__body"
            :id="descriptionId"
          >
            <slot></slot>
          </main>

          <!-- 底部操作区 -->
          <footer
            v-if="$slots.footer"
            class="edu-modal__footer"
          >
            <slot name="footer"></slot>
          </footer>

          <!-- 焦点陷阱 -->
          <div
            ref="focusTrapRef"
            tabindex="0"
            class="edu-modal__focus-trap"
            aria-hidden="true"
          ></div>
        </div>

        <!-- 屏幕阅读器通知 -->
        <div
          ref="srAnnouncementRef"
          class="sr-only"
          aria-live="assertive"
          aria-atomic="true"
        ></div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { accessibility } from '../../utils/accessibility'

interface Props {
  modelValue: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closable?: boolean
  maskClosable?: boolean
  center?: boolean
  fullscreen?: boolean
  destroyOnClose?: boolean
  lockScroll?: boolean
  customClass?: string
  closeAriaLabel?: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'open'): void
  (e: 'opened'): void
  (e: 'close'): void
  (e: 'closed'): void
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  size: 'md',
  closable: true,
  maskClosable: true,
  center: false,
  fullscreen: false,
  destroyOnClose: false,
  lockScroll: true,
  customClass: '',
  closeAriaLabel: '关闭对话框'
})

const emit = defineEmits<Emits>()

// Refs
const modalRef = ref<HTMLElement>()
const focusTrapRef = ref<HTMLElement>()
const srAnnouncementRef = ref<HTMLElement>()

// 生成唯一ID
const titleId = `modal-title-${Math.random().toString(36).substr(2, 9)}`
const descriptionId = `modal-description-${Math.random().toString(36).substr(2, 9)}`

// 焦点陷阱清理函数
let cleanupFocusTrap: (() => void) | null = null

// 计算属性
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const modalClasses = computed(() => [
  'edu-modal',
  `edu-modal--${props.size}`,
  {
    'edu-modal--center': props.center,
    'edu-modal--fullscreen': props.fullscreen,
    [props.customClass]: props.customClass
  }
])

const contentStyles = computed(() => {
  if (props.fullscreen) {
    return {
      width: '100vw',
      height: '100vh',
      margin: 0,
      borderRadius: 0
    }
  }

  const sizes = {
    sm: { width: '400px', maxWidth: '90vw' },
    md: { width: '520px', maxWidth: '90vw' },
    lg: { width: '800px', maxWidth: '90vw' },
    xl: { width: '1000px', maxWidth: '90vw' },
    full: { width: '100%', maxWidth: '100%' }
  }

  return {
    ...sizes[props.size],
    maxHeight: '90vh'
  }
})

// 监听visible变化
watch(visible, (newValue) => {
  if (newValue) {
    handleOpen()
  } else {
    handleClose()
  }
})

// 方法
const handleOpen = async () => {
  emit('open')

  // 锁定滚动
  if (props.lockScroll) {
    document.body.style.overflow = 'hidden'
  }

  // 等待DOM更新
  await nextTick()

  // 设置焦点陷阱
  if (modalRef.value) {
    cleanupFocusTrap = accessibility.setFocusTrap(modalRef.value)
  }

  // 通知屏幕阅读器
  announceToScreenReader(`对话框已打开：${props.title || '无标题对话框'}`)

  emit('opened')
}

const handleClose = () => {
  if (!visible.value) return

  emit('close')

  // 清理焦点陷阱
  if (cleanupFocusTrap) {
    cleanupFocusTrap()
    cleanupFocusTrap = null
  }

  // 恢复滚动
  if (props.lockScroll) {
    document.body.style.overflow = ''
  }

  // 通知屏幕阅读器
  announceToScreenReader('对话框已关闭')

  visible.value = false
  emit('closed')
}

const handleEscape = (e: KeyboardEvent) => {
  if (props.closable) {
    handleClose()
  }
}

const handleOverlayClick = () => {
  if (props.maskClosable) {
    handleClose()
  }
}

const handleBeforeEnter = () => {
  document.body.classList.add('edu-modal-open')
}

const handleAfterEnter = () => {
  // 动画完成后的处理
}

const handleBeforeLeave = () => {
  // 动画开始前的处理
}

const handleAfterLeave = () => {
  document.body.classList.remove('edu-modal-open')
}

const announceToScreenReader = (message: string) => {
  if (srAnnouncementRef.value) {
    srAnnouncementRef.value.textContent = message
    // 清空内容以便下次使用
    setTimeout(() => {
      if (srAnnouncementRef.value) {
        srAnnouncementRef.value.textContent = ''
      }
    }, 1000)
  }
}

// 生命周期
onMounted(() => {
  // 监听全局键盘事件
  document.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
  if (props.lockScroll) {
    document.body.style.overflow = ''
  }
  if (cleanupFocusTrap) {
    cleanupFocusTrap()
  }
})

const handleGlobalKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && visible.value && props.closable) {
    handleClose()
  }
}
</script>

<style lang="scss" scoped>
.edu-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: var(--edu-z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
}

.edu-modal--center {
  align-items: center;
}

.edu-modal__overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
}

.edu-modal__content {
  position: relative;
  background: var(--edu-bg-primary);
  border-radius: var(--edu-radius-lg);
  box-shadow: var(--edu-shadow-xl);
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  margin: var(--spacing-lg);
  animation: modal-enter 0.3s var(--edu-ease-out);
}

.edu-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-base);
  border-bottom: 1px solid var(--edu-border-light);
}

.edu-modal__title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--edu-text-primary);
  line-height: var(--edu-leading-tight);
}

.edu-modal__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  border-radius: var(--radius-base);
  color: var(--edu-text-secondary);
  cursor: pointer;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    background-color: var(--edu-bg-tertiary);
    color: var(--edu-text-primary);
  }

  &:focus-visible {
    outline: 2px solid var(--edu-primary-500);
    outline-offset: 2px;
  }

  svg {
    width: 16px;
    height: 16px;
  }
}

.edu-modal__body {
  flex: 1;
  padding: var(--spacing-lg);
  overflow-y: auto;
  color: var(--edu-text-primary);
  line-height: var(--edu-leading-normal);
}

.edu-modal__footer {
  padding: var(--spacing-base) var(--spacing-lg) var(--spacing-lg);
  border-top: 1px solid var(--edu-border-light);
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}

.edu-modal__focus-trap {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
}

/* 尺寸变体 */
.edu-modal--sm .edu-modal__content {
  width: 400px;
  max-width: 90vw;
}

.edu-modal--md .edu-modal__content {
  width: 520px;
  max-width: 90vw;
}

.edu-modal--lg .edu-modal__content {
  width: 800px;
  max-width: 90vw;
}

.edu-modal--xl .edu-modal__content {
  width: 1000px;
  max-width: 90vw;
}

.edu-modal--full .edu-modal__content {
  width: 100vw;
  height: 100vh;
  margin: 0;
  border-radius: 0;
  max-height: none;
}

.edu-modal--fullscreen {
  padding: 0;
}

.edu-modal--fullscreen .edu-modal__content {
  width: 100vw;
  height: 100vh;
  margin: 0;
  border-radius: 0;
}

/* 全局样式 */
.edu-modal-open {
  overflow: hidden;
}

/* 屏幕阅读器专用 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  border: 0;
  white-space: nowrap;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

/* 动画 */
@keyframes modal-enter {
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes modal-leave {
  0% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  100% {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
}

.modal-enter-active {
  animation: modal-enter 0.3s var(--edu-ease-out);
}

.modal-leave-active {
  animation: modal-leave 0.2s var(--edu-ease-in);
}

/* 过渡动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s var(--edu-ease-in-out);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .edu-modal__content {
  animation: modal-enter 0.3s var(--edu-ease-out);
}

.modal-leave-active .edu-modal__content {
  animation: modal-leave 0.2s var(--edu-ease-in);
}

/* 深色模式适配 */
[data-theme="dark"] {
  .edu-modal__content {
    background: var(--edu-bg-primary);
    border-color: var(--edu-border-dark);
  }

  .edu-modal__header {
    border-color: var(--edu-border-dark);
  }

  .edu-modal__footer {
    border-color: var(--edu-border-dark);
  }

  .edu-modal__close {
    color: var(--edu-text-secondary);

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
      color: var(--edu-text-primary);
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .edu-modal {
    padding: var(--spacing-base);
  }

  .edu-modal__content {
    margin: var(--spacing-base);
    max-height: 95vh;
  }

  .edu-modal__header,
  .edu-modal__body,
  .edu-modal__footer {
    padding-left: var(--spacing-base);
    padding-right: var(--spacing-base);
  }

  .edu-modal__title {
    font-size: var(--font-size-base);
  }
}

@media (max-width: 480px) {
  .edu-modal__content {
    margin: 0;
    width: 100vw;
    height: 100vh;
    max-height: none;
    border-radius: 0;
  }

  .edu-modal--fullscreen .edu-modal__content {
    border-radius: 0;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .edu-modal__overlay {
    background: rgba(0, 0, 0, 0.8);
  }

  .edu-modal__content {
    border: 2px solid var(--edu-text-primary);
  }

  .edu-modal__close:focus-visible {
    outline: 3px solid var(--edu-primary-500);
    outline-offset: 2px;
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .modal-enter-active,
  .modal-leave-active,
  .edu-modal__content,
  .edu-modal__close {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }

  @keyframes modal-enter,
  @keyframes modal-leave {
    animation-duration: 0.01ms !important;
  }
}

/* 打印样式 */
@media print {
  .edu-modal {
    position: static;
    width: 100%;
    height: auto;
    background: white;
  }

  .edu-modal__overlay {
    display: none;
  }

  .edu-modal__close {
    display: none;
  }
}
</style>
