<template>
  <div class="sidebar-section" :class="{ 'sidebar-section--collapsed': isCollapsed }">
    <div class="sidebar-section__header" @click="handleToggle">
      <div class="sidebar-section__title">
        <el-icon v-if="icon" class="sidebar-section__icon">
          <component :is="icon" />
        </el-icon>
        <span class="sidebar-section__text">{{ title }}</span>
      </div>
      <el-button
        v-if="collapsible"
        type="text"
        size="small"
        class="sidebar-section__toggle"
        :class="{ 'sidebar-section__toggle--rotated': isCollapsed }"
      >
        <el-icon><ArrowDown /></el-icon>
      </el-button>
    </div>

    <Transition
      name="sidebar-section"
      @enter="onEnter"
      @after-enter="onAfterEnter"
      @leave="onLeave"
      @after-leave="onAfterLeave"
    >
      <div v-show="!isCollapsed" class="sidebar-section__content">
        <slot name="content" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'

interface Props {
  title: string
  icon?: string
  collapsible?: boolean
  defaultCollapsed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  collapsible: true,
  defaultCollapsed: false
})

const isCollapsed = ref(props.defaultCollapsed)

const emit = defineEmits<{
  'toggle': [collapsed: boolean]
}>()

const handleToggle = () => {
  if (props.collapsible) {
    isCollapsed.value = !isCollapsed.value
    emit('toggle', isCollapsed.value)
  }
}

// 动画回调
const onEnter = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = '0'
  element.style.overflow = 'hidden'
  // 强制重排
  element.offsetHeight
  element.style.transition = 'height 0.3s ease-in-out'
  element.style.height = element.scrollHeight + 'px'
}

const onAfterEnter = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = ''
  element.style.overflow = ''
  element.style.transition = ''
}

const onLeave = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = element.scrollHeight + 'px'
  element.style.overflow = 'hidden'
  // 强制重排
  element.offsetHeight
  element.style.transition = 'height 0.3s ease-in-out'
  element.style.height = '0'
}

const onAfterLeave = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = ''
  element.style.overflow = ''
  element.style.transition = ''
}

// 监听 defaultCollapsed 变化
watch(() => props.defaultCollapsed, (newValue) => {
  isCollapsed.value = newValue
})

// 暴露方法给父组件
defineExpose({
  collapse: () => {
    if (props.collapsible) {
      isCollapsed.value = true
      emit('toggle', true)
    }
  },
  expand: () => {
    if (props.collapsible) {
      isCollapsed.value = false
      emit('toggle', false)
    }
  },
  toggle: handleToggle,
  isCollapsed: () => isCollapsed.value
})
</script>

<style scoped lang="scss">
.sidebar-section {
  background: var(--edu-card-bg);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--density-radius-lg, 12px);
  overflow: hidden;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--edu-border-base);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  &--collapsed {
    .sidebar-section__content {
      display: none;
    }
  }
}

.sidebar-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--density-padding-base, 16px) var(--density-padding-lg, 20px);
  cursor: pointer;
  user-select: none;
  background: var(--edu-bg-primary);
  border-bottom: 1px solid var(--edu-border-light);
  transition: background-color 0.2s ease;

  &:hover {
    background: var(--edu-bg-secondary);
  }
}

.sidebar-section__title {
  display: flex;
  align-items: center;
  gap: var(--density-gap-sm, 8px);
  font-weight: var(--font-weight-medium);
  color: var(--edu-text-primary);
}

.sidebar-section__icon {
  font-size: 16px;
  color: var(--edu-primary-500);
}

.sidebar-section__text {
  font-size: var(--density-font-size-base, 14px);
}

.sidebar-section__toggle {
  padding: 4px;
  color: var(--edu-text-secondary);
  transition: all 0.2s ease;

  &:hover {
    color: var(--edu-text-primary);
    background: var(--edu-bg-tertiary);
  }

  &--rotated {
    transform: rotate(-90deg);
  }

  .el-icon {
    font-size: 14px;
  }
}

.sidebar-section__content {
  padding: var(--density-padding-base, 16px) var(--density-padding-lg, 20px);
}

// 折叠动画
.sidebar-section-enter-active,
.sidebar-section-leave-active {
  transition: height 0.3s ease-in-out;
}

.sidebar-section-enter-from,
.sidebar-section-leave-to {
  height: 0 !important;
}

// 紧凑模式适配
[data-density="compact"] {
  .sidebar-section {
    border-radius: var(--density-radius-base, 8px);
  }

  .sidebar-section__header {
    padding: var(--density-padding-sm, 8px) var(--density-padding-base, 12px);
  }

  .sidebar-section__content {
    padding: var(--density-padding-sm, 8px) var(--density-padding-base, 12px);
  }

  .sidebar-section__text {
    font-size: var(--density-font-size-sm, 12px);
  }

  .sidebar-section__icon {
    font-size: 14px;
  }

  .sidebar-section__toggle .el-icon {
    font-size: 12px;
  }
}

// 深色模式适配
[data-theme="dark"] {
  .sidebar-section {
    background: var(--edu-card-bg-dark);
    border-color: var(--edu-border-dark);
  }

  .sidebar-section__header {
    background: var(--edu-bg-primary-dark);
    border-bottom-color: var(--edu-border-dark);

    &:hover {
      background: var(--edu-bg-secondary-dark);
    }
  }
}
</style>