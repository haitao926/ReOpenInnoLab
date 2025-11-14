<template>
  <section class="teacher-workspace" role="main" :aria-labelledby="title ? 'page-title' : undefined">
    <SkipLinks />

    <header class="workspace-header" role="banner">
      <div class="header-main">
        <div class="page-title-section">
          <h1 class="page-title" id="page-title">{{ title }}</h1>
          <p v-if="subtitle" class="page-subtitle" id="page-subtitle">{{ subtitle }}</p>
        </div>
        <div class="header-controls" role="toolbar" aria-label="页面操作和工具">
            <slot name="header-controls" />
        </div>
      </div>
      <div v-if="$slots['header-secondary']" class="header-secondary" role="complementary" aria-label="页面附加信息">
        <slot name="header-secondary" />
      </div>
    </header>

    <section v-if="$slots.summary" class="summary-strip" role="region" aria-label="数据摘要">
      <slot name="summary" />
    </section>

    <div class="workspace-body" :class="{ 'has-right-sidebar': $slots.right }">
      <aside
        v-if="$slots.left"
        id="sidebar"
        :class="['workspace-sidebar', 'workspace-sidebar--left', { collapsed: internalLeftCollapsed }]"
        role="complementary"
        :aria-label="internalLeftCollapsed ? '左侧边栏（已折叠）' : '左侧边栏'"
        :aria-expanded="!internalLeftCollapsed"
      >
        <div class="sidebar-inner">
          <button
            v-if="leftCollapsible"
            type="button"
            class="sidebar-toggle"
            @click="handleToggleLeft"
            :aria-expanded="!internalLeftCollapsed"
            :aria-label="internalLeftCollapsed ? '展开左侧边栏' : '折叠左侧边栏'"
            title="切换左侧边栏显示状态"
          >
            <el-icon><component :is="internalLeftCollapsed ? Expand : Fold" /></el-icon>
          </button>
          <div class="sidebar-content" role="navigation" aria-label="侧边栏导航">
            <slot name="left" />
          </div>
        </div>
      </aside>

      <main id="main-content" class="workspace-main" role="main" tabindex="-1">
        <slot />
      </main>

      <aside
        v-if="$slots.right"
        :class="['workspace-sidebar', 'workspace-sidebar--right', { collapsed: internalRightCollapsed }]"
        role="complementary"
        :aria-label="internalRightCollapsed ? '右侧边栏（已折叠）' : '右侧边栏'"
        :aria-expanded="!internalRightCollapsed"
      >
        <div class="sidebar-inner">
          <button
            v-if="rightCollapsible"
            type="button"
            class="sidebar-toggle"
            @click="handleToggleRight"
            :aria-expanded="!internalRightCollapsed"
            :aria-label="internalRightCollapsed ? '展开右侧边栏' : '折叠右侧边栏'"
            title="切换右侧边栏显示状态"
          >
            <el-icon><component :is="internalRightCollapsed ? Expand : Fold" /></el-icon>
          </button>
          <div class="sidebar-content" role="complementary">
            <slot name="right" />
          </div>
        </div>
      </aside>
    </div>

    <footer v-if="$slots.footer" class="workspace-footer">
      <slot name="footer" />
    </footer>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Expand, Fold } from '@element-plus/icons-vue'
import SkipLinks from '@/components/common/SkipLinks.vue'

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    leftCollapsed?: boolean
    rightCollapsed?: boolean
    leftCollapsible?: boolean
    rightCollapsible?: boolean
  }>(),
  {
    subtitle: '',
    leftCollapsed: false,
    rightCollapsed: false,
    leftCollapsible: true,
    rightCollapsible: true
  }
)

const emit = defineEmits<{
  (e: 'update:leftCollapsed', value: boolean): void
  (e: 'update:rightCollapsed', value: boolean): void
}>()

const internalLeftCollapsed = ref(props.leftCollapsed)
const internalRightCollapsed = ref(props.rightCollapsed)

// 监听外部侧边栏状态变化
watch(() => props.leftCollapsed, (newValue) => {
  internalLeftCollapsed.value = newValue
})

watch(() => props.rightCollapsed, (newValue) => {
  internalRightCollapsed.value = newValue
})

const handleToggleLeft = () => {
  const newState = !internalLeftCollapsed.value
  internalLeftCollapsed.value = newState
  emit('update:leftCollapsed', newState)
}

const handleToggleRight = () => {
  const newState = !internalRightCollapsed.value
  internalRightCollapsed.value = newState
  emit('update:rightCollapsed', newState)
}
</script>

<style scoped lang="scss">
.teacher-workspace {
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: 100vh; // 确保工作区占满视口高度
  overflow: hidden; // 防止工作区本身滚动
  padding: 24px; // 添加一些内边距
  box-sizing: border-box; // 确保padding包含在高度内
}

.workspace-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.page-title {
  margin: 0;
  font-size: clamp(24px, 2.6vw, 32px);
  font-weight: 700;
  color: var(--edu-text-primary);
}

.page-subtitle {
  margin: 0;
  font-size: 16px;
  color: var(--edu-text-secondary);
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-secondary {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.summary-strip {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.workspace-body {
  display: flex;
  gap: 20px;
  flex: 1; // 让工作区主体占用剩余空间
  min-height: 0; // 防止flex溢出
  overflow: hidden; // 防止整个flex容器溢出

  // 当有右栏时的布局
  &.has-right-sidebar {
    gap: 20px;
  }
}

.workspace-sidebar {
  background: transparent;
  border-radius: 0;
  border: none;
  box-shadow: none;
  transition: width 0.3s var(--edu-easing-smooth), padding 0.3s var(--edu-easing-smooth);
  flex-shrink: 0; // 防止侧边栏收缩
  width: 300px; // 固定宽度

  &.collapsed {
    width: 72px;
  }

  &--right {
    width: 320px; // 右侧边栏宽度

    &.collapsed {
      width: 72px;
    }
  }
}


.workspace-sidebar .sidebar-inner {
  position: relative;
  padding: 24px;
  height: 100%;
}

.workspace-sidebar.collapsed .sidebar-inner {
  padding-inline: 16px;
}

.sidebar-toggle {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: none;
  background: rgba(99, 102, 241, 0.12);
  color: #4f46e5;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease;
}

.sidebar-toggle:hover {
  background: rgba(79, 70, 229, 0.18);
}

.workspace-sidebar.collapsed .sidebar-content {
  display: none;
}

.workspace-main {
  flex: 1;
  background: transparent;
  border-radius: 0;
  border: none;
  box-shadow: none;
  padding: clamp(16px, 2vw, 24px);
  display: flex;
  flex-direction: column;
  gap: 20px;
  /* 只有这个区域可以滚动 */
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0; // 重要：防止flex子项溢出容器
  min-width: 0; // 防止flex子项溢出容器

  /* 确保标签页内容能够自然展开 */
  .main-tabs {
    flex: 1;
    min-height: 0; // 防止flex子项溢出
    display: flex;
    flex-direction: column;

    .el-tabs__content {
      flex: 1;
      min-height: 0; // 让标签页内容能够正确计算高度
    }

    .tab-content {
      min-height: 0; // 让标签页内容能够正确计算高度
    }
  }
}

.workspace-footer {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(228, 232, 247, 0.88) 100%);
  border-radius: 20px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  padding: 20px;
}

/* 响应式布局 - 使用标准断点 */
.workspace-body {
  @media (max-width: 768px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }

  @media (min-width: 769px) and (max-width: 1023px) {
    grid-template-columns: 280px minmax(0, 1fr);
    gap: 20px;
  }

  @media (min-width: 1024px) and (max-width: 1279px) {
    gap: 24px;
  }

  &.has-right-sidebar {
    @media (min-width: 769px) and (max-width: 1279px) {
      grid-template-columns: 280px minmax(0, 1fr);
    }

    @media (min-width: 1280px) {
      grid-template-columns: 300px minmax(0, 1fr) 320px;
      gap: 24px;
    }
  }
}

.workspace-sidebar {
  @media (max-width: 768px) {
    order: 2;
    width: 100% !important;
  }

  @media (min-width: 769px) {
    &--right {
      @media (max-width: 1279px) {
        display: none;
      }
    }
  }

  .sidebar-inner {
    @media (max-width: 768px) {
      padding: 20px;
    }

    @media (min-width: 769px) and (max-width: 1023px) {
      padding: 20px;
    }
  }

  .sidebar-toggle {
    @media (max-width: 768px) {
      display: none;
    }
  }

  &.collapsed {
    @media (max-width: 768px) {
      width: 100% !important;
    }

    .sidebar-content {
      @media (max-width: 768px) {
        display: block;
      }
    }
  }
}

.workspace-main {
  @media (max-width: 768px) {
    order: 1;
    padding: 20px;
  }

  @media (min-width: 769px) and (max-width: 1023px) {
    padding: 24px;
  }
}

.workspace-header {
  @media (max-width: 768px) {
    gap: 12px;
  }
}

.header-main {
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}

.header-controls {
  @media (max-width: 768px) {
    width: 100%;
    justify-content: flex-start;
  }
}

.summary-strip {
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  @media (min-width: 769px) and (max-width: 1023px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.workspace-footer {
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 16px;
    gap: 12px;
  }

  @media (min-width: 769px) and (max-width: 1023px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.page-title {
  @media (max-width: 768px) {
    font-size: 24px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .workspace-sidebar,
  .workspace-main,
  .summary-strip,
  .sidebar-toggle {
    transition: none !important;
  }
}
</style>
