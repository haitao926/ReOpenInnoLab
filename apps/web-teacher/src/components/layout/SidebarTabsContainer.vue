<template>
  <div class="sidebar-tabs-container">
    <!-- 模式切换按钮 -->
    <div class="sidebar-mode-switcher" v-if="showModeToggle">
      <button
        type="button"
        class="mode-btn"
        :class="{ active: mode === 'tabs' }"
        @click="switchMode('tabs')"
        :aria-pressed="mode === 'tabs'"
      >
        <el-icon><Grid /></el-icon>
        <span>标签页</span>
      </button>
      <button
        type="button"
        class="mode-btn"
        :class="{ active: mode === 'accordion' }"
        @click="switchMode('accordion')"
        :aria-pressed="mode === 'accordion'"
      >
        <el-icon><Fold /></el-icon>
        <span>手风琴</span>
      </button>
    </div>

    <!-- 标签页模式 -->
    <EduTabs
      v-if="mode === 'tabs'"
      :tabs="tabs"
      :active-id="activeTab"
      variant="minimal"
      size="sm"
      tab-position="top"
      @change="handleTabChange"
      class="sidebar-tabs"
    >
      <template #panel-0>
        <div class="sidebar-panel-content">
          <slot name="filters" />
        </div>
      </template>
      <template #panel-1>
        <div class="sidebar-panel-content">
          <slot name="quick-actions" />
        </div>
      </template>
      <template #panel-2>
        <div class="sidebar-panel-content">
          <slot name="recent" />
        </div>
      </template>
    </EduTabs>

    <!-- 手风琴模式 -->
    <EduAccordion
      v-else
      :items="accordionItems"
      :multiple="false"
      variant="minimal"
      size="sm"
      :default-active="activeAccordionItems"
      @change="handleAccordionChange"
      class="sidebar-accordion"
    >
      <template #content-filters>
        <div class="sidebar-panel-content">
          <slot name="filters" />
        </div>
      </template>
      <template #content-quick-actions>
        <div class="sidebar-panel-content">
          <slot name="quick-actions" />
        </div>
      </template>
      <template #content-recent>
        <div class="sidebar-panel-content">
          <slot name="recent" />
        </div>
      </template>
    </EduAccordion>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Grid, Fold } from '@element-plus/icons-vue'
import { EduTabs, EduAccordion } from '@reopeninnolab/ui-kit'

interface Props {
  defaultMode?: 'tabs' | 'accordion'
  showModeToggle?: boolean
  defaultTab?: number
  defaultAccordionItems?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  defaultMode: 'tabs',
  showModeToggle: true,
  defaultTab: 0,
  defaultAccordionItems: () => ['filters']
})

const emit = defineEmits<{
  modeChange: [mode: 'tabs' | 'accordion']
  tabChange: [tabId: number]
  accordionChange: [activeIds: string[]]
}>()

const mode = ref<'tabs' | 'accordion'>(props.defaultMode)
const activeTab = ref<number>(props.defaultTab)
const activeAccordionItems = ref<string[]>([...props.defaultAccordionItems])

// 标签页配置
const tabs = computed(() => [
  {
    id: 0,
    label: '筛选器',
    icon: 'Filter'
  },
  {
    id: 1,
    label: '快速操作',
    icon: 'Operation'
  },
  {
    id: 2,
    label: '最近活动',
    icon: 'Clock',
    badge: {
      text: '新',
      variant: 'success' as const
    }
  }
])

// 手风琴配置
const accordionItems = computed(() => [
  {
    id: 'filters',
    title: '筛选器',
    subtitle: '快速筛选和搜索',
    icon: 'Filter'
  },
  {
    id: 'quick-actions',
    title: '快速操作',
    subtitle: '常用功能快捷入口',
    icon: 'Operation'
  },
  {
    id: 'recent',
    title: '最近活动',
    subtitle: '近期操作记录',
    icon: 'Clock',
    badge: {
      text: '新',
      variant: 'success' as const
    }
  }
])

const switchMode = (newMode: 'tabs' | 'accordion') => {
  if (newMode !== mode.value) {
    mode.value = newMode
    emit('modeChange', newMode)
  }
}

const handleTabChange = (tabId: number) => {
  activeTab.value = tabId
  emit('tabChange', tabId)
}

const handleAccordionChange = (activeIds: string[]) => {
  activeAccordionItems.value = activeIds
  emit('accordionChange', activeIds)
}

// 监听模式变化，同步激活状态
watch(mode, (newMode) => {
  if (newMode === 'tabs') {
    // 从手风琴切换到标签页时，将手风琴的激活项映射到标签页
    if (activeAccordionItems.value.includes('filters')) activeTab.value = 0
    else if (activeAccordionItems.value.includes('quick-actions')) activeTab.value = 1
    else if (activeAccordionItems.value.includes('recent')) activeTab.value = 2
    else activeTab.value = 0
  } else {
    // 从标签页切换到手风琴时，将标签页的激活项映射到手风琴
    const mapping: Record<number, string> = {
      0: 'filters',
      1: 'quick-actions',
      2: 'recent'
    }
    activeAccordionItems.value = [mapping[activeTab.value] || 'filters']
  }
})

// 暴露方法
defineExpose({
  mode,
  activeTab,
  activeAccordionItems,
  switchMode,
  setActiveTab: (tabId: number) => {
    activeTab.value = tabId
    if (mode.value === 'accordion') {
      const mapping: Record<number, string> = {
        0: 'filters',
        1: 'quick-actions',
        2: 'recent'
      }
      activeAccordionItems.value = [mapping[tabId] || 'filters']
    }
  },
  setActiveAccordion: (itemId: string) => {
    activeAccordionItems.value = [itemId]
    if (mode.value === 'tabs') {
      const mapping: Record<string, number> = {
        'filters': 0,
        'quick-actions': 1,
        'recent': 2
      }
      activeTab.value = mapping[itemId] || 0
    }
  }
})
</script>

<style scoped lang="scss">
.sidebar-tabs-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: var(--spacing-sm);
}

.sidebar-mode-switcher {
  display: flex;
  gap: 2px;
  padding: 2px;
  background: rgba(15, 23, 42, 0.06);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-sm);

  .mode-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-sm);
    border: none;
    background: transparent;
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

    &:hover {
      color: var(--text-primary);
      background: rgba(255, 255, 255, 0.5);
    }

    &.active {
      background: var(--edu-color-white);
      color: var(--edu-primary-600);
      box-shadow: var(--edu-shadow-xs);
    }

    .el-icon {
      width: 14px;
      height: 14px;
    }
  }
}

.sidebar-tabs {
  flex: 1;

  :deep(.edu-tabs__header) {
    border-bottom: 1px solid var(--edu-border-light);
    margin-bottom: var(--spacing-sm);
  }

  :deep(.edu-tabs__tab) {
    padding: var(--spacing-sm) var(--spacing-base);
    font-size: var(--font-size-sm);
    border-bottom: 2px solid transparent;
  }

  :deep(.edu-tabs__tab--active) {
    border-bottom-color: var(--edu-primary-500);
    color: var(--edu-primary-600);
    background: rgba(99, 102, 241, 0.08);
  }

  :deep(.edu-tabs__tab:hover:not(.edu-tabs__tab--disabled)) {
    background: rgba(99, 102, 241, 0.05);
  }

  :deep(.edu-tabs__panel) {
    padding: 0;
  }
}

.sidebar-accordion {
  flex: 1;

  :deep(.edu-accordion__item) {
    border: none;
    background: transparent;
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  :deep(.edu-accordion__header) {
    padding: var(--spacing-sm) var(--spacing-base);
    background: rgba(15, 23, 42, 0.04);
    border-radius: var(--radius-md);
    border: none;
    transition: all var(--edu-duration-fast) var(--edu-easing-in-out);
  }

  :deep(.edu-accordion__header:hover:not(.edu-accordion__header--disabled)) {
    background: rgba(99, 102, 241, 0.08);
  }

  :deep(.edu-accordion__header--active) {
    background: rgba(99, 102, 241, 0.12);
    color: var(--edu-primary-700);
  }

  :deep(.edu-accordion__title-text) {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
  }

  :deep(.edu-accordion__subtitle) {
    font-size: var(--font-size-xs);
  }

  :deep(.edu-accordion__panel) {
    background: transparent;
  }

  :deep(.edu-accordion__content) {
    padding: var(--spacing-sm) 0;
  }
}

.sidebar-panel-content {
  height: 100%;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--edu-border-light) transparent;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--edu-border-light);
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--edu-border-base);
  }
}

// 响应式适配
@media (max-width: 768px) {
  .sidebar-mode-switcher {
    .mode-btn {
      padding: var(--spacing-xs) var(--spacing-xs);
      font-size: 10px;

      span {
        display: none;
      }

      .el-icon {
        width: 16px;
        height: 16px;
      }
    }
  }

  .sidebar-tabs {
    :deep(.edu-tabs__tab) {
      padding: var(--spacing-xs) var(--spacing-sm) !important;
      font-size: var(--font-size-xs) !important;
    }
  }

  .sidebar-accordion {
    :deep(.edu-accordion__header) {
      padding: var(--spacing-xs) var(--spacing-sm) !important;
    }

    :deep(.edu-accordion__title-text) {
      font-size: var(--font-size-xs) !important;
    }

    :deep(.edu-accordion__subtitle) {
      font-size: 10px !important;
    }
  }
}

// 键盘导航支持
.sidebar-mode-switcher .mode-btn {
  &:focus-visible {
    outline: 2px solid var(--edu-primary-500);
    outline-offset: 1px;
  }
}

// 深色模式适配
[data-theme="dark"] {
  .sidebar-mode-switcher {
    background: rgba(255, 255, 255, 0.1);

    .mode-btn {
      color: var(--text-secondary);

      &:hover {
        color: var(--text-primary);
        background: rgba(255, 255, 255, 0.1);
      }

      &.active {
        background: var(--edu-bg-secondary);
        color: var(--edu-primary-400);
        box-shadow: var(--edu-shadow-xs);
      }
    }
  }

  .sidebar-tabs {
    :deep(.edu-tabs__tab) {
      padding: var(--spacing-xs) var(--spacing-sm) !important;
      font-size: var(--font-size-xs) !important;
    }

    :deep(.edu-tabs__tab--active) {
      color: var(--edu-primary-400);
      background: rgba(99, 102, 241, 0.15);
    }

    :deep(.edu-tabs__tab:hover:not(.edu-tabs__tab--disabled)) {
      background: rgba(99, 102, 241, 0.1);
    }
  }

  .sidebar-accordion {
    :deep(.edu-accordion__header) {
      background: rgba(255, 255, 255, 0.05);
    }

    :deep(.edu-accordion__header:hover:not(.edu-accordion__header--disabled)) {
      background: rgba(99, 102, 241, 0.1);
    }

    :deep(.edu-accordion__header--active) {
      background: rgba(99, 102, 241, 0.15);
      color: var(--edu-primary-400);
    }
  }
}
</style>