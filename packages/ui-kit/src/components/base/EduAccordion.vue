<template>
  <div class="edu-accordion" :class="accordionClasses">
    <div
      v-for="(item, index) in items"
      :key="item.id || index"
      class="edu-accordion__item"
      :class="{
        'edu-accordion__item--active': activeItems.includes(item.id),
        'edu-accordion__item--disabled': item.disabled
      }"
    >
      <!-- 手风琴标题 -->
      <button
        type="button"
        class="edu-accordion__header"
        :class="{
          'edu-accordion__header--active': activeItems.includes(item.id),
          'edu-accordion__header--disabled': item.disabled
        }"
        :aria-expanded="activeItems.includes(item.id)"
        :aria-controls="`panel-${item.id || index}`"
        :disabled="item.disabled"
        @click="handleToggle(item)"
      >
        <div class="edu-accordion__header-content">
          <div v-if="item.icon" class="edu-accordion__icon">
            <el-icon>
              <component :is="item.icon" />
            </el-icon>
          </div>
          <div class="edu-accordion__title">
            <span class="edu-accordion__title-text">{{ item.title }}</span>
            <span v-if="item.subtitle" class="edu-accordion__subtitle">{{ item.subtitle }}</span>
          </div>
          <div v-if="item.badge" class="edu-accordion__badge">
            <EduTag
              :variant="item.badge.variant || 'info'"
              size="xs"
            >
              {{ item.badge.text }}
            </EduTag>
          </div>
        </div>
        <div class="edu-accordion__indicator">
          <el-icon class="edu-accordion__indicator-icon">
            <ArrowDown />
          </el-icon>
        </div>
      </button>

      <!-- 手风琴内容 -->
      <Transition
        name="accordion"
        @before-enter="beforeEnter"
        @enter="enter"
        @after-enter="afterEnter"
        @before-leave="beforeLeave"
        @leave="leave"
        @after-leave="afterLeave"
      >
        <div
          v-show="activeItems.includes(item.id)"
          :id="`panel-${item.id || index}`"
          class="edu-accordion__panel"
          role="region"
        >
          <div class="edu-accordion__content">
            <slot :name="`content-${item.id}`" :item="item">
              <div v-if="item.content" v-html="item.content"></div>
            </slot>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import EduTag from './EduTag.vue'

interface AccordionItem {
  id: string
  title: string
  subtitle?: string
  content?: string
  icon?: string
  badge?: {
    text: string
    variant?: 'primary' | 'success' | 'warning' | 'error' | 'info'
  }
  disabled?: boolean
}

interface Props {
  items: AccordionItem[]
  multiple?: boolean
  collapsible?: boolean
  variant?: 'default' | 'bordered' | 'minimal'
  size?: 'sm' | 'md' | 'lg'
  defaultActive?: string[]
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false,
  collapsible: true,
  variant: 'default',
  size: 'md',
  defaultActive: () => [],
  disabled: false
})

const emit = defineEmits<{
  change: [activeIds: string[]]
  toggle: [item: AccordionItem, isActive: boolean]
}>()

const activeItems = ref<string[]>([...props.defaultActive])

const accordionClasses = computed(() => [
  'edu-accordion',
  `edu-accordion--${props.variant}`,
  `edu-accordion--${props.size}`,
  {
    'edu-accordion--disabled': props.disabled
  }
])

const handleToggle = (item: AccordionItem) => {
  if (item.disabled || props.disabled) return

  const isActive = activeItems.value.includes(item.id)

  if (props.multiple) {
    if (isActive) {
      activeItems.value = activeItems.value.filter(id => id !== item.id)
    } else {
      activeItems.value.push(item.id)
    }
  } else {
    if (isActive && props.collapsible) {
      activeItems.value = []
    } else if (!isActive) {
      activeItems.value = [item.id]
    }
  }

  emit('change', activeItems.value)
  emit('toggle', item, !isActive)
}

// 监听外部变化
watch(() => props.defaultActive, (newActive) => {
  activeItems.value = [...newActive]
}, { deep: true })

// 动画钩子
const beforeEnter = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = '0'
  element.style.overflow = 'hidden'
}

const enter = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = element.scrollHeight + 'px'
}

const afterEnter = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = ''
  element.style.overflow = ''
}

const beforeLeave = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = element.scrollHeight + 'px'
  element.style.overflow = 'hidden'
}

const leave = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = '0'
}

const afterLeave = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = ''
  element.style.overflow = ''
}

// 暴露方法
defineExpose({
  activeItems,
  expand: (id: string) => {
    if (!activeItems.value.includes(id)) {
      if (props.multiple) {
        activeItems.value.push(id)
      } else {
        activeItems.value = [id]
      }
      emit('change', activeItems.value)
    }
  },
  collapse: (id: string) => {
    activeItems.value = activeItems.value.filter(item => item !== id)
    emit('change', activeItems.value)
  },
  expandAll: () => {
    if (props.multiple) {
      activeItems.value = props.items.map(item => item.id)
      emit('change', activeItems.value)
    }
  },
  collapseAll: () => {
    activeItems.value = []
    emit('change', activeItems.value)
  }
})
</script>

<style scoped lang="scss">
.edu-accordion {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);

  &--default {
    .edu-accordion__item {
      border: 1px solid var(--edu-border-light);
      border-radius: var(--radius-lg);
      background: var(--edu-bg-primary);
      overflow: hidden;
      transition: all var(--edu-duration-normal) var(--edu-easing-smooth);
    }

    .edu-accordion__header {
      border-bottom: 1px solid var(--edu-border-light);
    }

    .edu-accordion__item--active {
      border-color: var(--edu-primary-200);
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
    }
  }

  &--bordered {
    .edu-accordion__item {
      border: 2px solid var(--edu-border-base);
      border-radius: var(--radius-lg);
      background: var(--edu-bg-primary);
      overflow: hidden;
    }

    .edu-accordion__item--active {
      border-color: var(--edu-primary-500);
    }
  }

  &--minimal {
    .edu-accordion__item {
      background: transparent;
      border: none;
    }

    .edu-accordion__header {
      background: rgba(15, 23, 42, 0.04);
      border-radius: var(--radius-md);
      border: none;
      transition: all var(--edu-duration-fast) var(--edu-easing-in-out);
    }

    .edu-accordion__header:hover,
    .edu-accordion__header--active {
      background: rgba(99, 102, 241, 0.12);
      color: var(--edu-primary-700);
    }

    .edu-accordion__panel {
      padding: 0;
      margin-top: var(--spacing-sm);
    }
  }

  &--sm {
    .edu-accordion__header {
      padding: var(--spacing-sm) var(--spacing-base);
    }

    .edu-accordion__content {
      padding: var(--spacing-sm) var(--spacing-base);
    }
  }

  &--md {
    .edu-accordion__header {
      padding: var(--spacing-base) var(--spacing-lg);
    }

    .edu-accordion__content {
      padding: var(--spacing-base) var(--spacing-lg);
    }
  }

  &--lg {
    .edu-accordion__header {
      padding: var(--spacing-lg) var(--spacing-xl);
    }

    .edu-accordion__content {
      padding: var(--spacing-lg) var(--spacing-xl);
    }
  }

  &--disabled {
    opacity: 0.6;
    pointer-events: none;
  }
}

.edu-accordion__item {
  transition: all var(--edu-duration-normal) var(--edu-easing-smooth);

  &--disabled {
    opacity: 0.5;
    pointer-events: none;
  }
}

.edu-accordion__header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-base);
  background: var(--edu-bg-primary);
  border: none;
  cursor: pointer;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);
  text-align: left;

  &:hover:not(.edu-accordion__header--disabled) {
    background: rgba(99, 102, 241, 0.05);
  }

  &:focus-visible {
    outline: 2px solid var(--edu-primary-500);
    outline-offset: 2px;
  }

  &--active {
    background: rgba(99, 102, 241, 0.08);
    color: var(--edu-primary-700);
  }

  &--disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
}

.edu-accordion__header-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex: 1;
  min-width: 0;
}

.edu-accordion__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  background: rgba(99, 102, 241, 0.1);
  color: var(--edu-primary-600);
  flex-shrink: 0;
}

.edu-accordion__title {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.edu-accordion__title-text {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-tight);
}

.edu-accordion__subtitle {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  line-height: var(--line-height-normal);
}

.edu-accordion__badge {
  flex-shrink: 0;
}

.edu-accordion__indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform var(--edu-duration-fast) var(--edu-easing-smooth);
}

.edu-accordion__indicator-icon {
  width: 16px;
  height: 16px;
  color: var(--text-tertiary);
  transition: transform var(--edu-duration-fast) var(--edu-easing-smooth);
}

.edu-accordion__header--active .edu-accordion__indicator-icon {
  transform: rotate(180deg);
  color: var(--edu-primary-600);
}

.edu-accordion__panel {
  background: var(--edu-bg-primary);
}

.edu-accordion__content {
  color: var(--text-primary);
  line-height: var(--line-height-relaxed);
  font-size: var(--font-size-sm);
}

// 动画
.accordion-enter-active,
.accordion-leave-active {
  transition: height var(--edu-duration-normal) var(--edu-easing-smooth);
}

.accordion-enter-from,
.accordion-leave-to {
  height: 0;
}

// 深色模式适配
[data-theme="dark"] {
  .edu-accordion {
    &--default {
      .edu-accordion__item {
        background: var(--edu-bg-secondary);
        border-color: var(--border-color);
      }

      .edu-accordion__header {
        border-bottom-color: var(--border-color);
      }

      .edu-accordion__item--active {
        border-color: var(--edu-primary-600);
        box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
      }
    }

    &--bordered {
      .edu-accordion__item {
        background: var(--edu-bg-secondary);
        border-color: var(--border-color);
      }

      .edu-accordion__item--active {
        border-color: var(--edu-primary-500);
      }
    }

    &--minimal {
      .edu-accordion__header {
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-primary);
      }

      .edu-accordion__header:hover,
      .edu-accordion__header--active {
        background: rgba(99, 102, 241, 0.2);
        color: var(--edu-primary-300);
      }
    }
  }

  .edu-accordion__header {
    background: var(--edu-bg-secondary);
    color: var(--text-primary);

    &:hover:not(.edu-accordion__header--disabled) {
      background: rgba(255, 255, 255, 0.05);
    }

    &--active {
      background: rgba(99, 102, 241, 0.15);
      color: var(--edu-primary-300);
    }
  }

  .edu-accordion__icon {
    background: rgba(99, 102, 241, 0.2);
    color: var(--edu-primary-400);
  }

  .edu-accordion__indicator-icon {
    color: var(--text-tertiary);
  }

  .edu-accordion__header--active .edu-accordion__indicator-icon {
    color: var(--edu-primary-400);
  }

  .edu-accordion__panel {
    background: var(--edu-bg-secondary);
  }

  .edu-accordion__content {
    color: var(--text-primary);
  }
}

// 响应式
@media (max-width: 768px) {
  .edu-accordion__header {
    padding: var(--spacing-sm) var(--spacing-base) !important;
  }

  .edu-accordion__content {
    padding: var(--spacing-sm) var(--spacing-base) !important;
  }

  .edu-accordion__title-text {
    font-size: var(--font-size-sm);
  }

  .edu-accordion__subtitle {
    font-size: var(--font-size-xs);
  }
}
</style>