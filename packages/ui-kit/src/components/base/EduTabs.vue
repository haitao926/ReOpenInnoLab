<template>
  <div class="edu-tabs" :class="tabsClasses">
    <!-- 标签页头部 -->
    <div class="edu-tabs__header" :class="headerClasses">
      <div class="edu-tabs__nav" role="tablist">
        <button
          v-for="(tab, index) in tabs"
          :key="tab.id || index"
          type="button"
          class="edu-tabs__tab"
          :class="{
            'edu-tabs__tab--active': activeTab === (tab.id || index),
            'edu-tabs__tab--disabled': tab.disabled,
            'edu-tabs__tab--closable': tab.closable
          }"
          :aria-selected="activeTab === (tab.id || index)"
          :aria-controls="`panel-${tab.id || index}`"
          :disabled="tab.disabled"
          @click="handleTabClick(tab, index)"
          @keydown.enter="handleTabClick(tab, index)"
          @keydown.space.prevent="handleTabClick(tab, index)"
          :tabindex="activeTab === (tab.id || index) ? 0 : -1"
        >
          <div class="edu-tabs__tab-content">
            <div v-if="tab.icon" class="edu-tabs__tab-icon">
              <el-icon>
                <component :is="tab.icon" />
              </el-icon>
            </div>
            <span class="edu-tabs__tab-label">{{ tab.label }}</span>
            <span v-if="tab.badge" class="edu-tabs__tab-badge">
              <EduTag
                :variant="tab.badge.variant || 'info'"
                size="xs"
              >
                {{ tab.badge.text }}
              </EduTag>
            </span>
            <button
              v-if="tab.closable && !tab.disabled"
              type="button"
              class="edu-tabs__tab-close"
              :aria-label="`关闭 ${tab.label}`"
              @click.stop="handleClose(tab, index)"
            >
              <el-icon><Close /></el-icon>
            </button>
          </div>
        </button>
      </div>

      <!-- 额外操作区域 -->
      <div v-if="$slots.extra" class="edu-tabs__extra">
        <slot name="extra"></slot>
      </div>
    </div>

    <!-- 标签页内容 -->
    <div class="edu-tabs__content">
      <transition
        name="tab-fade"
        mode="out-in"
        @before-enter="beforeEnter"
        @enter="enter"
        @leave="leave"
      >
        <div
          :key="activeTab"
          :id="`panel-${activeTab}`"
          class="edu-tabs__panel"
          role="tabpanel"
        >
          <slot :name="`panel-${activeTab}`" :tab="getCurrentTab()">
            <div v-if="getCurrentTab()?.content" v-html="getCurrentTab().content"></div>
          </slot>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { Close } from '@element-plus/icons-vue'
import EduTag from './EduTag.vue'

interface TabItem {
  id?: string
  label: string
  content?: string
  icon?: string
  badge?: {
    text: string
    variant?: 'primary' | 'success' | 'warning' | 'error' | 'info'
  }
  disabled?: boolean
  closable?: boolean
}

interface Props {
  tabs: TabItem[]
  activeId?: string | number
  variant?: 'default' | 'card' | 'segmented' | 'minimal'
  size?: 'sm' | 'md' | 'lg'
  closable?: boolean
  animated?: boolean
  tabPosition?: 'top' | 'bottom' | 'left' | 'right'
  type?: 'line' | 'card' | 'border-card'
}

const props = withDefaults(defineProps<Props>(), {
  activeId: 0,
  variant: 'default',
  size: 'md',
  closable: false,
  animated: true,
  tabPosition: 'top',
  type: 'line'
})

const emit = defineEmits<{
  change: [activeId: string | number, tab: TabItem]
  tabClick: [tab: TabItem, index: number]
  close: [tab: TabItem, index: number]
  edit: [tab: TabItem, index: number]
}>()

const activeTab = ref<string | number>(props.activeId)

const tabsClasses = computed(() => [
  'edu-tabs',
  `edu-tabs--${props.variant}`,
  `edu-tabs--${props.size}`,
  `edu-tabs--position-${props.tabPosition}`,
  `edu-tabs--type-${props.type}`,
  {
    'edu-tabs--animated': props.animated
  }
])

const headerClasses = computed(() => [
  'edu-tabs__header',
  `edu-tabs__header--position-${props.tabPosition}`
])

const handleTabClick = (tab: TabItem, index: number) => {
  if (tab.disabled) return

  const tabId = tab.id || index
  if (activeTab.value !== tabId) {
    activeTab.value = tabId
    emit('change', tabId, tab)
  }
  emit('tabClick', tab, index)
}

const handleClose = (tab: TabItem, index: number) => {
  emit('close', tab, index)
}

const getCurrentTab = () => {
  const index = props.tabs.findIndex(tab => (tab.id || props.tabs.indexOf(tab)) === activeTab.value)
  return props.tabs[index] || props.tabs[0]
}

// 监听外部变化
watch(() => props.activeId, (newActiveId) => {
  activeTab.value = newActiveId
}, { immediate: true })

// 动画钩子
const beforeEnter = (el: Element) => {
  const element = el as HTMLElement
  element.style.opacity = '0'
  element.style.transform = 'translateX(20px)'
}

const enter = (el: Element) => {
  const element = el as HTMLElement
  nextTick(() => {
    element.style.transition = 'all 0.3s ease-in-out'
    element.style.opacity = '1'
    element.style.transform = 'translateX(0)'
  })
}

const leave = (el: Element) => {
  const element = el as HTMLElement
  element.style.transition = 'all 0.3s ease-in-out'
  element.style.opacity = '0'
  element.style.transform = 'translateX(-20px)'
}

// 暴露方法
defineExpose({
  activeTab,
  setActiveTab: (id: string | number) => {
    const tab = props.tabs.find(t => (t.id || props.tabs.indexOf(t)) === id)
    if (tab && !tab.disabled) {
      activeTab.value = id
      emit('change', id, tab)
    }
  },
  getCurrentTab,
  nextTab: () => {
    const currentIndex = props.tabs.findIndex(tab => (tab.id || props.tabs.indexOf(tab)) === activeTab.value)
    const nextIndex = (currentIndex + 1) % props.tabs.length
    const nextTab = props.tabs[nextIndex]
    if (nextTab && !nextTab.disabled) {
      handleTabClick(nextTab, nextIndex)
    }
  },
  prevTab: () => {
    const currentIndex = props.tabs.findIndex(tab => (tab.id || props.tabs.indexOf(tab)) === activeTab.value)
    const prevIndex = currentIndex === 0 ? props.tabs.length - 1 : currentIndex - 1
    const prevTab = props.tabs[prevIndex]
    if (prevTab && !prevTab.disabled) {
      handleTabClick(prevTab, prevIndex)
    }
  }
})
</script>

<style scoped lang="scss">
.edu-tabs {
  display: flex;
  flex-direction: column;
  background: var(--edu-bg-primary);

  &--position-left,
  &--position-right {
    flex-direction: row;

    .edu-tabs__header {
      flex-direction: column;
      border-bottom: none;
    }

    &.edu-tabs--position-left .edu-tabs__header {
      border-right: 1px solid var(--edu-border-light);
      order: 1;
    }

    &.edu-tabs--position-right .edu-tabs__header {
      border-left: 1px solid var(--edu-border-light);
      order: 2;
    }

    .edu-tabs__content {
      flex: 1;
      order: 2;
    }

    &.edu-tabs--position-right .edu-tabs__content {
      order: 1;
    }
  }

  &--position-bottom {
    flex-direction: column-reverse;

    .edu-tabs__header {
      border-bottom: none;
      border-top: 1px solid var(--edu-border-light);
    }
  }

  &--default {
    .edu-tabs__header {
      border-bottom: 1px solid var(--edu-border-light);
    }
  }

  &--card {
    .edu-tabs__nav {
      background: var(--edu-color-gray-50);
      border-radius: var(--radius-lg);
      padding: var(--spacing-xs);
      gap: var(--spacing-xs);
    }

    .edu-tabs__tab {
      border-radius: var(--radius-md);
      background: transparent;
      border: none;
      transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

      &:hover:not(.edu-tabs__tab--disabled) {
        background: var(--edu-color-gray-100);
      }

      &--active {
        background: var(--edu-bg-primary);
        box-shadow: var(--edu-shadow-sm);
        color: var(--edu-primary-700);
      }
    }
  }

  &--segmented {
    .edu-tabs__nav {
      background: var(--edu-color-gray-100);
      border-radius: var(--radius-lg);
      padding: var(--spacing-xs);
      gap: 0;
    }

    .edu-tabs__tab {
      border-radius: var(--radius-md);
      background: transparent;
      border: none;
      transition: all var(--edu-duration-fast) var(--edu-easing-in-out);
      position: relative;

      &:hover:not(.edu-tabs__tab--disabled) {
        background: rgba(255, 255, 255, 0.5);
      }

      &--active {
        background: var(--edu-bg-primary);
        box-shadow: var(--edu-shadow-sm);
        color: var(--edu-primary-700);
      }
    }
  }

  &--minimal {
    .edu-tabs__header {
      border-bottom: 2px solid var(--edu-border-light);
    }

    .edu-tabs__tab {
      border: none;
      background: none;
      color: var(--text-secondary);
      position: relative;

      &:hover:not(.edu-tabs__tab--disabled) {
        color: var(--text-primary);
      }

      &--active {
        color: var(--edu-primary-600);

        &::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--edu-primary-600);
          border-radius: var(--radius-sm) var(--radius-sm) 0 0;
        }
      }
    }
  }

  &--type-border-card {
    .edu-tabs__header {
      background: var(--edu-color-gray-50);
      border: 1px solid var(--edu-border-light);
      border-radius: var(--radius-lg);
      border-bottom: none;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }

    .edu-tabs__tab {
      border: none;
      background: transparent;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;

      &:hover:not(.edu-tabs__tab--disabled) {
        background: var(--edu-color-gray-100);
      }

      &--active {
        background: var(--edu-bg-primary);
        border-bottom-color: var(--edu-primary-600);
      }
    }
  }

  &--sm {
    .edu-tabs__tab {
      padding: var(--spacing-sm) var(--spacing-base);
      font-size: var(--font-size-sm);
    }
  }

  &--md {
    .edu-tabs__tab {
      padding: var(--spacing-base) var(--spacing-lg);
      font-size: var(--font-size-base);
    }
  }

  &--lg {
    .edu-tabs__tab {
      padding: var(--spacing-lg) var(--spacing-xl);
      font-size: var(--font-size-lg);
    }
  }
}

.edu-tabs__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--edu-bg-primary);
}

.edu-tabs__nav {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex: 1;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.edu-tabs__tab {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-base) var(--spacing-lg);
  border: none;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);
  white-space: nowrap;
  user-select: none;
  font-size: var(--font-size-base);
  line-height: var(--line-height-tight);
  border-radius: var(--radius-md);

  &:hover:not(.edu-tabs__tab--disabled) {
    color: var(--text-primary);
    background: rgba(99, 102, 241, 0.05);
  }

  &--active {
    color: var(--edu-primary-600);
    background: rgba(99, 102, 241, 0.08);
  }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  &:focus-visible {
    outline: 2px solid var(--edu-primary-500);
    outline-offset: 2px;
  }
}

.edu-tabs__tab-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.edu-tabs__tab-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
}

.edu-tabs__tab-label {
  font-weight: var(--font-weight-medium);
}

.edu-tabs__tab-badge {
  margin-left: var(--spacing-xs);
}

.edu-tabs__tab-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-left: var(--spacing-xs);
  border: none;
  background: none;
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    background: var(--edu-color-error-100);
    color: var(--edu-color-error-600);
  }

  &:focus-visible {
    outline: 2px solid var(--edu-primary-500);
    outline-offset: 1px;
  }

  .el-icon {
    width: 12px;
    height: 12px;
  }
}

.edu-tabs__extra {
  display: flex;
  align-items: center;
  margin-left: var(--spacing-base);
}

.edu-tabs__content {
  flex: 1;
  min-height: 0;
}

.edu-tabs__panel {
  padding: var(--spacing-lg) 0;
  color: var(--text-primary);
  line-height: var(--line-height-relaxed);
}

// 动画
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: all 0.3s ease-in-out;
}

.tab-fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.tab-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

// 深色模式适配
[data-theme="dark"] {
  .edu-tabs {
    background: var(--edu-bg-secondary);

    &--card {
      .edu-tabs__nav {
        background: rgba(255, 255, 255, 0.05);
      }

      .edu-tabs__tab {
        &:hover:not(.edu-tabs__tab--disabled) {
          background: rgba(255, 255, 255, 0.1);
        }

        &--active {
          background: var(--edu-bg-secondary);
          color: var(--edu-primary-400);
        }
      }
    }

    &--segmented {
      .edu-tabs__nav {
        background: rgba(255, 255, 255, 0.1);
      }

      .edu-tabs__tab {
        color: var(--text-secondary);

        &:hover:not(.edu-tabs__tab--disabled) {
          background: rgba(255, 255, 255, 0.15);
        }

        &--active {
          background: var(--edu-bg-secondary);
          color: var(--edu-primary-400);
        }
      }
    }

    &--minimal {
      .edu-tabs__header {
        border-bottom-color: var(--border-color);
      }

      .edu-tabs__tab {
        color: var(--text-secondary);

        &:hover:not(.edu-tabs__tab--disabled) {
          color: var(--text-primary);
        }

        &--active {
          color: var(--edu-primary-400);

          &::after {
            background: var(--edu-primary-400);
          }
        }
      }
    }

    &--type-border-card {
      .edu-tabs__header {
        background: rgba(255, 255, 255, 0.05);
        border-color: var(--border-color);
      }

      .edu-tabs__tab {
        &:hover:not(.edu-tabs__tab--disabled) {
          background: rgba(255, 255, 255, 0.1);
        }

        &--active {
          background: var(--edu-bg-secondary);
          border-bottom-color: var(--edu-primary-400);
        }
      }
    }
  }

  .edu-tabs__header {
    background: var(--edu-bg-secondary);
  }

  .edu-tabs__tab {
    color: var(--text-secondary);

    &:hover:not(.edu-tabs__tab--disabled) {
      color: var(--text-primary);
      background: rgba(255, 255, 255, 0.05);
    }

    &--active {
      color: var(--edu-primary-400);
      background: rgba(99, 102, 241, 0.15);
    }
  }

  .edu-tabs__tab-close {
    color: var(--text-tertiary);

    &:hover {
      background: rgba(239, 68, 68, 0.2);
      color: var(--edu-color-error-400);
    }
  }

  .edu-tabs__panel {
    color: var(--text-primary);
  }
}

// 响应式
@media (max-width: 768px) {
  .edu-tabs__nav {
    gap: var(--spacing-xs);
  }

  .edu-tabs__tab {
    padding: var(--spacing-sm) var(--spacing-base) !important;
    font-size: var(--font-size-sm);
  }

  .edu-tabs__content {
    padding: var(--spacing-base) 0;
  }
}
</style>