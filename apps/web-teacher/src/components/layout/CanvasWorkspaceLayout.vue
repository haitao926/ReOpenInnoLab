<template>
  <div class="canvas-workspace">
    <!-- 顶部导航栏 -->
    <header class="workspace-header">
      <div class="header-left">
        <h1 class="page-title">{{ title }}</h1>
        <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>
      </div>
      <div class="header-right">
        <slot name="header-controls" />
      </div>
    </header>

    <!-- 摘要/统计区域 -->
    <section v-if="$slots.summary" class="workspace-summary">
      <slot name="summary" />
    </section>

    <!-- 主要内容区域 (包含侧边栏) -->
    <div class="workspace-body">
      <!-- 左侧边栏 -->
      <aside
        v-if="$slots.left"
        class="workspace-sidebar left"
        :class="{ collapsed: leftCollapsed }"
      >
        <div class="sidebar-content">
          <slot name="left" />
        </div>
        <div v-if="leftCollapsible" class="sidebar-toggle" @click="toggleLeft">
          <el-icon><component :is="leftCollapsed ? 'Expand' : 'Fold'" /></el-icon>
        </div>
      </aside>

      <!-- 中间内容 (可滚动) -->
      <main class="workspace-main">
        <div class="main-content-wrapper">
          <slot />
        </div>
      </main>

      <!-- 右侧边栏 -->
      <aside
        v-if="$slots.right"
        class="workspace-sidebar right"
        :class="{ collapsed: rightCollapsed }"
      >
        <div class="sidebar-content">
          <slot name="right" />
        </div>
        <div v-if="rightCollapsible" class="sidebar-toggle" @click="toggleRight">
          <el-icon><component :is="rightCollapsed ? 'Expand' : 'Fold'" /></el-icon>
        </div>
      </aside>
    </div>

    <!-- 底部区域 -->
    <footer v-if="$slots.footer" class="workspace-footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Expand, Fold } from '@element-plus/icons-vue'

const props = withDefaults(
  defineProps<{
      title?: string
      subtitle?: string
      leftCollapsed?: boolean
      rightCollapsed?: boolean
      leftCollapsible?: boolean
      rightCollapsible?: boolean
    }>(),
  {
    leftCollapsed: false,
    rightCollapsed: false,
    leftCollapsible: true,
    rightCollapsible: true
  }
)

const emit = defineEmits(['update:leftCollapsed', 'update:rightCollapsed'])

const leftCollapsed = ref(props.leftCollapsed)
const rightCollapsed = ref(props.rightCollapsed)

watch(
  () => props.leftCollapsed,
  val => (leftCollapsed.value = val)
)
watch(
  () => props.rightCollapsed,
  val => (rightCollapsed.value = val)
)

const toggleLeft = () => {
  leftCollapsed.value = !leftCollapsed.value
  emit('update:leftCollapsed', leftCollapsed.value)
}

const toggleRight = () => {
  rightCollapsed.value = !rightCollapsed.value
  emit('update:rightCollapsed', rightCollapsed.value)
}
</script>

<style scoped lang="scss">
  .canvas-workspace {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: transparent;
    padding: var(--spacing-lg);
    gap: var(--spacing-lg);
  }

  .workspace-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-shrink: 0;

    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 4px 0;
    }

    .page-subtitle {
      font-size: 14px;
      color: var(--text-secondary);
      margin: 0;
    }
  }

  .workspace-summary {
    flex-shrink: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-md);
  }

  .workspace-body {
    flex: 1;
    display: flex;
    gap: var(--spacing-lg);
    overflow: hidden; /* 关键：防止整体滚动 */
    min-height: 0; /* 关键：允许 flex 子项收缩 */
  }

  .workspace-sidebar {
    width: 280px;
    display: flex;
    flex-direction: column;
    background: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(10px);
    border-radius: var(--radius-lg);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: width 0.3s ease;
    position: relative;
    flex-shrink: 0;

    &.collapsed {
      width: 48px;

      .sidebar-content {
        opacity: 0;
        pointer-events: none;
      }
    }

    .sidebar-content {
      flex: 1;
      overflow-y: auto;
      padding: var(--spacing-md);
      transition: opacity 0.2s ease;
    }

    .sidebar-toggle {
      position: absolute;
      top: 12px;
      right: 12px;
      cursor: pointer;
      color: var(--text-secondary);

      &:hover {
        color: var(--brand-primary);
      }
    }
  }

  .workspace-main {
    flex: 1;
    overflow-y: auto; /* 关键：内部滚动 */
    padding-right: 4px; /* 避免滚动条遮挡 */

    .main-content-wrapper {
      min-height: 100%;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }
  }

  .workspace-footer {
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(10px);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-xl);
  }
</style>
