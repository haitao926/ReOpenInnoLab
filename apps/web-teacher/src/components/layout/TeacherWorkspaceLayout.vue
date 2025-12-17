<template>
  <section class="teacher-workspace" role="main">
    <EduSkipLinks />

    <div class="workspace-body" :class="{ 'has-right-sidebar': $slots.right }">
      <!-- Left Sidebar (Filters/Tree) -->
      <aside
        v-if="$slots.left"
        id="sidebar"
        :class="['workspace-sidebar', 'workspace-sidebar--left', { collapsed: internalLeftCollapsed }]"
      >
        <div class="sidebar-inner">
          <slot name="left" />
        </div>
      </aside>

      <!-- Main Canvas Content -->
      <main id="main-content" class="workspace-main" tabindex="-1">
        <slot />
      </main>

      <!-- Right Sidebar (Details/Inspector) -->
      <aside
        v-if="$slots.right"
        :class="['workspace-sidebar', 'workspace-sidebar--right', { collapsed: internalRightCollapsed }]"
      >
        <div class="sidebar-inner">
          <slot name="right" />
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Expand, Fold } from '@element-plus/icons-vue'
import { EduSkipLinks } from '@reopeninnolab/ui-kit'

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
  height: 100%;
  overflow: hidden; /* Prevent outer scroll, let areas scroll */
  background: transparent;
}

.workspace-mini-header {
  padding: 16px 24px 0 24px;
  flex-shrink: 0;
}

.mini-page-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin: 0;
}

.workspace-body {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

.workspace-sidebar {
  flex-shrink: 0;
  width: 240px; /* Standard width */
  border-right: 1px solid var(--edu-border-color-light); /* Minimal divider */
  background: transparent; /* Let parent bg show or transparent */
  transition: width 0.3s ease;
  overflow-y: auto;

  &.collapsed {
    width: 0;
    overflow: hidden;
    border: none;
  }

  &--right {
    width: 320px;
    border-left: 1px solid var(--edu-border-color-light);
    border-right: none;
  }
}

.sidebar-inner {
  padding: 16px;
  height: 100%;
  box-sizing: border-box;
}

.workspace-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px 24px; /* Standard internal padding */
  position: relative;
}

/* Mobile & Responsive */
@media (max-width: 768px) {
  .workspace-body {
    flex-direction: column;
  }
  .workspace-sidebar {
    width: 100%;
    height: auto;
    border-right: none;
    border-bottom: 1px solid var(--edu-border-color-light);
  }
}
</style>
