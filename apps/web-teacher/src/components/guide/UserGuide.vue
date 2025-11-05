<template>
  <div class="user-guide">
    <!-- 引导覆盖层 -->
    <transition name="guide-overlay">
      <div
        v-if="currentStep !== null"
        class="guide-overlay"
        @click="handleOverlayClick"
      >
        <!-- 高亮区域 -->
        <div
          v-if="currentStepData"
          class="guide-highlight"
          :style="highlightStyle"
        ></div>

        <!-- 引导提示框 -->
        <div
          v-if="currentStepData"
          class="guide-tooltip"
          :class="tooltipPosition"
          :style="tooltipStyle"
        >
          <div class="guide-tooltip__header">
            <div class="guide-step-info">
              <span class="guide-step-number">{{ currentStep + 1 }}/{{ totalSteps }}</span>
              <span class="guide-step-title">{{ currentStepData.title }}</span>
            </div>
            <button
              type="button"
              class="guide-close"
              @click="skipGuide"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="guide-tooltip__content">
            <div class="guide-description">{{ currentStepData.description }}</div>

            <!-- 可选的内容区域 -->
            <div v-if="currentStepData.content" class="guide-content">
              <component :is="currentStepData.content" />
            </div>

            <!-- 交互元素 -->
            <div v-if="currentStepData.interactive" class="guide-interactive">
              <component
                :is="currentStepData.interactive"
                @action="handleInteractiveAction"
              />
            </div>
          </div>

          <div class="guide-tooltip__footer">
            <div class="guide-progress">
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: `${((currentStep + 1) / totalSteps) * 100}%` }"
                ></div>
              </div>
              <span class="progress-text">{{ progressPercent }}%</span>
            </div>

            <div class="guide-actions">
              <button
                type="button"
                class="guide-btn guide-btn--secondary"
                @click="previousStep"
                :disabled="currentStep === 0"
              >
                上一步
              </button>

              <button
                type="button"
                class="guide-btn guide-btn--primary"
                @click="nextStep"
              >
                {{ isLastStep ? '完成' : '下一步' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 导航点 -->
        <div class="guide-dots">
          <button
            v-for="(_, index) in totalSteps"
            :key="index"
            type="button"
            class="guide-dot"
            :class="{ 'is-active': index === currentStep }"
            @click="goToStep(index)"
          >
            <span class="sr-only">步骤 {{ index + 1 }}</span>
          </button>
        </div>
      </div>
    </transition>

    <!-- 引导触发按钮 -->
    <button
      v-if="showTrigger && currentStep === null"
      type="button"
      class="guide-trigger"
      @click="startGuide"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
      <span>使用帮助</span>
    </button>

    <!-- 快捷键提示 -->
    <div
      v-if="showKeyboardHints && currentStep === null"
      class="keyboard-hints"
    >
      <button
        type="button"
        class="keyboard-hint"
        @click="showKeyboardShortcuts"
      >
        <kbd>?</kbd>
        <span>快捷键</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'

interface GuideStep {
  id: string
  title: string
  description: string
  target?: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  offset?: { x: number; y: number }
  content?: any
  interactive?: any
  action?: string
  beforeShow?: () => Promise<void>
  afterShow?: () => void
}

interface Props {
  steps: GuideStep[]
  autoStart?: boolean
  showTrigger?: boolean
  showKeyboardHints?: boolean
  storageKey?: string
}

interface Emits {
  (e: 'guideStart'): void
  (e: 'guideEnd', completed: boolean): void
  (e: 'stepChange', step: number): void
  (e: 'action', action: string): void
}

const props = withDefaults(defineProps<Props>(), {
  autoStart: false,
  showTrigger: true,
  showKeyboardHints: true,
  storageKey: 'user-guide-completed'
})

const emit = defineEmits<Emits>()

// Refs
const currentStep = ref<number | null>(null)
const isGuideActive = ref(false)

// 计算属性
const totalSteps = computed(() => props.steps.length)
const currentStepData = computed(() =>
  currentStep.value !== null ? props.steps[currentStep.value] : null
)
const isLastStep = computed(() =>
  currentStep.value !== null && currentStep.value === totalSteps.value - 1
)
const progressPercent = computed(() =>
  currentStep.value !== null ? Math.round(((currentStep.value + 1) / totalSteps.value) * 100) : 0
)

// 高亮样式
const highlightStyle = computed(() => {
  if (!currentStepData.value?.target) return {}

  const element = document.querySelector(currentStepData.value.target) as HTMLElement
  if (!element) return {}

  const rect = element.getBoundingClientRect()
  const offset = currentStepData.value.offset || { x: 0, y: 0 }

  return {
    top: `${rect.top + offset.y}px`,
    left: `${rect.left + offset.x}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`
  }
})

// 提示框位置
const tooltipPosition = computed(() => {
  return currentStepData.value?.position || 'bottom'
})

// 提示框样式
const tooltipStyle = computed(() => {
  if (!currentStepData.value?.target) {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    }
  }

  const element = document.querySelector(currentStepData.value.target) as HTMLElement
  if (!element) return {}

  const rect = element.getBoundingClientRect()
  const offset = currentStepData.value.offset || { x: 0, y: 0 }
  const position = tooltipPosition.value

  let top = 0
  let left = 0
  let transform = ''

  switch (position) {
    case 'top':
      top = rect.top - 20 + offset.y
      left = rect.left + rect.width / 2 + offset.x
      transform = 'translate(-50%, -100%)'
      break
    case 'bottom':
      top = rect.bottom + 20 + offset.y
      left = rect.left + rect.width / 2 + offset.x
      transform = 'translate(-50%, 0)'
      break
    case 'left':
      top = rect.top + rect.height / 2 + offset.y
      left = rect.left - 20 + offset.x
      transform = 'translate(-100%, -50%)'
      break
    case 'right':
      top = rect.top + rect.height / 2 + offset.y
      left = rect.right + 20 + offset.x
      transform = 'translate(0, -50%)'
      break
    default:
      // center
      top = '50%'
      left = '50%'
      transform = 'translate(-50%, -50%)'
  }

  return {
    top: `${top}px`,
    left: `${left}px`,
    transform
  }
})

// 方法
const startGuide = async () => {
  if (totalSteps.value === 0) return

  currentStep.value = 0
  isGuideActive.value = true
  emit('guideStart')

  // 添加body样式
  document.body.style.overflow = 'hidden'

  await executeStep()
}

const endGuide = (completed: boolean = true) => {
  currentStep.value = null
  isGuideActive.value = false
  document.body.style.overflow = ''

  if (completed) {
    // 标记完成
    localStorage.setItem(props.storageKey, 'true')
    ElMessage.success('引导完成！')
  }

  emit('guideEnd', completed)
}

const nextStep = async () => {
  if (currentStep.value === null) return

  if (isLastStep.value) {
    endGuide(true)
  } else {
    currentStep.value++
    await executeStep()
    emit('stepChange', currentStep.value)
  }
}

const previousStep = async () => {
  if (currentStep.value === null || currentStep.value === 0) return

  currentStep.value--
  await executeStep()
  emit('stepChange', currentStep.value)
}

const goToStep = async (step: number) => {
  if (step < 0 || step >= totalSteps.value) return

  currentStep.value = step
  await executeStep()
  emit('stepChange', step)
}

const skipGuide = () => {
  endGuide(false)
}

const handleOverlayClick = (e: MouseEvent) => {
  // 点击遮罩层，如果是移动端则跳过，桌面端不做处理
  if (window.innerWidth <= 768) {
    skipGuide()
  }
}

const handleInteractiveAction = (action: string) => {
  if (currentStepData.value?.action) {
    emit('action', currentStepData.value.action)
  }
  emit('action', action)
}

const executeStep = async () => {
  if (currentStep.value === null || !currentStepData.value) return

  // 执行beforeShow钩子
  if (currentStepData.value.beforeShow) {
    await currentStepData.value.beforeShow()
  }

  // 等待DOM更新
  await new Promise(resolve => setTimeout(resolve, 100))

  // 滚动到目标元素
  if (currentStepData.value.target) {
    const element = document.querySelector(currentStepData.value.target) as HTMLElement
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      })
    }
  }

  // 执行afterShow钩子
  if (currentStepData.value.afterShow) {
    currentStepData.value.afterShow()
  }
}

const showKeyboardShortcuts = () => {
  // 显示快捷键面板
  emit('action', 'show-keyboard-shortcuts')
}

// 键盘事件处理
const handleKeydown = (e: KeyboardEvent) => {
  if (!isGuideActive.value) return

  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      e.preventDefault()
      nextStep()
      break
    case 'ArrowLeft':
    case 'ArrowUp':
      e.preventDefault()
      previousStep()
      break
    case 'Escape':
      e.preventDefault()
      skipGuide()
      break
    case 'Enter':
    case ' ':
      e.preventDefault()
      nextStep()
      break
  }
}

// 检查是否已完成引导
const isGuideCompleted = () => {
  return localStorage.getItem(props.storageKey) === 'true'
}

// 监听器
watch(currentStep, (newStep) => {
  if (newStep !== null) {
    // 添加ARIA标签
    document.documentElement.setAttribute('aria-live', 'polite')
    document.documentElement.setAttribute('aria-busy', 'true')
  } else {
    document.documentElement.removeAttribute('aria-live')
    document.documentElement.removeAttribute('aria-busy')
  }
})

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)

  // 自动开始引导
  if (props.autoStart && !isGuideCompleted()) {
    setTimeout(() => {
      startGuide()
    }, 1000)
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<style lang="scss" scoped>
.user-guide {
  position: relative;
}

.guide-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: var(--edu-z-guide);
  background: rgba(0, 0, 0, 0.5);
}

.guide-highlight {
  position: absolute;
  border: 3px solid var(--edu-primary-500);
  border-radius: var(--edu-radius-base);
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
  pointer-events: none;
  transition: all 0.3s var(--edu-ease-in-out);
}

.guide-tooltip {
  position: absolute;
  z-index: calc(var(--edu-z-guide) + 1);
  background: white;
  border-radius: var(--edu-radius-lg);
  box-shadow: var(--edu-shadow-xl);
  max-width: 400px;
  min-width: 300px;
  pointer-events: auto;

  &--top {
    &::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
      border-top: 8px solid white;
    }
  }

  &--bottom {
    &::before {
      content: '';
      position: absolute;
      top: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
      border-bottom: 8px solid white;
    }
  }

  &--left {
    &::after {
      content: '';
      position: absolute;
      right: -8px;
      top: 50%;
      transform: translateY(-50%);
      width: 0;
      height: 0;
      border-top: 8px solid transparent;
      border-bottom: 8px solid transparent;
      border-left: 8px solid white;
    }
  }

  &--right {
    &::before {
      content: '';
      position: absolute;
      left: -8px;
      top: 50%;
      transform: translateY(-50%);
      width: 0;
      height: 0;
      border-top: 8px solid transparent;
      border-bottom: 8px solid transparent;
      border-right: 8px solid white;
    }
  }
}

.guide-tooltip__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-base);
  border-bottom: 1px solid var(--edu-border-light);
}

.guide-step-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.guide-step-number {
  background: var(--edu-primary-100);
  color: var(--edu-primary-600);
  padding: 2px var(--spacing-xs);
  border-radius: var(--radius-base);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.guide-step-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--edu-text-primary);
}

.guide-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
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

  svg {
    width: 16px;
    height: 16px;
  }
}

.guide-tooltip__content {
  padding: var(--spacing-base) var(--spacing-lg);
}

.guide-description {
  color: var(--edu-text-secondary);
  line-height: var(--edu-leading-relaxed);
  margin-bottom: var(--spacing-base);
}

.guide-content {
  margin-bottom: var(--spacing-base);
}

.guide-interactive {
  margin-top: var(--spacing-base);
}

.guide-tooltip__footer {
  padding: var(--spacing-base) var(--spacing-lg) var(--spacing-lg);
  border-top: 1px solid var(--edu-border-light);
}

.guide-progress {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-base);
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: var(--edu-bg-tertiary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--edu-primary-500);
  transition: width 0.3s var(--edu-easing-in-out);
}

.progress-text {
  font-size: var(--font-size-xs);
  color: var(--edu-text-secondary);
  font-weight: var(--font-weight-medium);
  min-width: 40px;
}

.guide-actions {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-sm);
}

.guide-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--edu-radius-base);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &--secondary {
    background: var(--edu-bg-tertiary);
    color: var(--edu-text-secondary);

    &:hover:not(:disabled) {
      background: var(--edu-bg-quaternary);
      color: var(--edu-text-primary);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &--primary {
    background: var(--edu-primary-500);
    color: white;

    &:hover {
      background: var(--edu-primary-600);
    }
  }
}

.guide-dots {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: var(--spacing-xs);
}

.guide-dot {
  width: 8px;
  height: 8px;
  border: none;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &.is-active {
    background: white;
    transform: scale(1.2);
  }

  &:hover {
    background: rgba(255, 255, 255, 0.8);
  }
}

.guide-trigger {
  position: fixed;
  bottom: 80px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-base);
  background: var(--edu-primary-500);
  color: white;
  border: none;
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  box-shadow: var(--edu-shadow-lg);
  transition: all var(--edu-duration-normal) var(--edu-easing-bounce);
  z-index: var(--edu-z-sticky);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--edu-shadow-xl);
  }

  svg {
    width: 16px;
    height: 16px;
  }
}

.keyboard-hints {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: var(--edu-z-sticky);
}

.keyboard-hint {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--edu-bg-secondary);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--edu-radius-base);
  font-size: var(--font-size-xs);
  color: var(--edu-text-secondary);
  cursor: pointer;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    background: var(--edu-bg-tertiary);
    color: var(--edu-text-primary);
  }

  kbd {
    display: inline-block;
    padding: 2px 6px;
    background: var(--edu-bg-primary);
    border: 1px solid var(--edu-border-base);
    border-radius: 3px;
    font-family: monospace;
    font-size: 11px;
    color: var(--edu-text-primary);
  }
}

/* 过渡动画 */
.guide-overlay-enter-active,
.guide-overlay-leave-active {
  transition: opacity 0.3s var(--edu-ease-in-out);
}

.guide-overlay-enter-from,
.guide-overlay-leave-to {
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .guide-tooltip {
    max-width: calc(100vw - 40px);
    min-width: calc(100vw - 40px);
    margin: 20px;
  }

  .guide-trigger {
    bottom: 20px;
    right: 20px;
  }

  .keyboard-hints {
    display: none;
  }
}

/* 深色模式适配 */
[data-theme="dark"] {
  .guide-tooltip {
    background: var(--edu-bg-primary);
    border: 1px solid var(--edu-border-dark);
  }

  .guide-tooltip__header,
  .guide-tooltip__footer {
    border-color: var(--edu-border-dark);
  }

  .guide-close:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .progress-bar {
    background: var(--edu-bg-quaternary);
  }

  .guide-btn--secondary {
    background: var(--edu-bg-quaternary);
    color: var(--edu-text-secondary);

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  .keyboard-hint {
    background: var(--edu-bg-secondary);
    border-color: var(--edu-border-dark);

    &:hover {
      background: var(--edu-bg-tertiary);
    }

    kbd {
      background: var(--edu-bg-primary);
      border-color: var(--edu-border-base);
    }
  }
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

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .guide-overlay,
  .guide-highlight,
  .guide-tooltip,
  .guide-btn,
  .guide-trigger,
  .guide-dot,
  .keyboard-hint {
    transition-duration: 0.01ms !important;
  }

  .progress-fill {
    transition: none;
  }
}
</style>