<template>
  <div class="density-toggle">
    <el-tooltip
      :content="tooltipText"
      placement="bottom"
      :show-after="500"
    >
      <el-button
        type="text"
        size="small"
        class="density-toggle__button"
        @click="toggleDensity"
        :class="{ 'density-toggle__button--compact': isCompact }"
      >
        <el-icon class="density-toggle__icon">
          <component :is="iconComponent" />
        </el-icon>
        <span class="density-toggle__label">{{ densityLabel }}</span>
      </el-button>
    </el-tooltip>

    <!-- 快捷键提示 -->
    <el-tooltip
      content="快捷键: Ctrl+D"
      placement="right"
      :show-after="1000"
    >
      <div class="density-toggle__shortcut">
        <el-icon><Setting /></el-icon>
      </div>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDensity, type Density } from '@/composables/useDensity'
import { View, Expand, Setting } from '@element-plus/icons-vue'

interface Props {
  initialDensity?: Density
  showLabel?: boolean
  showShortcut?: boolean
  tooltip?: string
}

const props = withDefaults(defineProps<Props>(), {
  showLabel: true,
  showShortcut: false,
  tooltip: ''
})

// 使用密度切换逻辑
const {
  density,
  densityLabel,
  isCompact,
  isComfortable,
  setDensity,
  toggleDensity
} = useDensity(props.initialDensity)

// 计算图标
const iconComponent = computed(() => {
  return isCompact.value ? View : Expand
})

// 计算提示文本
const tooltipText = computed(() => {
  if (props.tooltip) {
    return props.tooltip
  }
  const targetMode = isCompact.value ? '舒适' : '紧凑'
  const sidebarAction = isCompact.value ? '展开侧边栏' : '收起侧边栏'
  return `切换到${targetMode}模式 (${densityLabel.value})，${sidebarAction}`
})

// 键盘快捷键处理
const handleKeydown = (event: KeyboardEvent) => {
  // Ctrl + D 快捷键切换密度
  if (event.ctrlKey && event.key === 'd') {
    event.preventDefault()
    toggleDensity()
  }
}

// 添加键盘事件监听
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleKeydown)
}
</script>

<style scoped lang="scss">
.density-toggle {
  display: flex;
  align-items: center;
  gap: var(--density-spacing-sm);
}

.density-toggle__button {
  display: flex;
  align-items: center;
  gap: var(--density-spacing-sm);
  padding: var(--density-padding-sm) var(--density-padding-base);
  border-radius: var(--density-radius-base);
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid var(--edu-border-light);

  &:hover {
    background: var(--edu-bg-secondary);
    color: var(--text-primary);
    border-color: var(--edu-border-base);
  }

  &:active {
    background: var(--edu-bg-tertiary);
    transform: translateY(1px);
  }

  &:focus-visible {
    outline: 2px solid var(--edu-primary-500);
    outline-offset: 2px;
  }

  // 紧凑模式特殊样式
  &--compact {
    padding: var(--density-padding-xs) var(--density-padding-sm);

    .density-toggle__label {
      font-size: var(--density-font-size-sm);
    }
  }
}

.density-toggle__icon {
  font-size: 16px;
  transition: transform var(--edu-duration-fast) var(--edu-easing-in-out);

  .density-toggle__button--compact & {
    transform: scale(0.9);
  }
}

.density-toggle__label {
  font-size: var(--density-font-size-sm);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);
}

.density-toggle__shortcut {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: var(--density-radius-sm);
  background: var(--edu-bg-secondary);
  color: var(--text-tertiary);
  font-size: 10px;
  opacity: 0.6;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    opacity: 1;
    color: var(--text-secondary);
    background: var(--edu-bg-tertiary);
  }

  .el-icon {
    font-size: 12px;
  }
}

// 响应式适配
@media (max-width: 768px) {
  .density-toggle__label {
    display: none;
  }

  .density-toggle__shortcut {
    display: none;
  }
}

// 深色模式适配
[data-theme="dark"] {
  .density-toggle__button {
    color: var(--text-secondary);
    border-color: var(--border-color);

    &:hover {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-primary);
    }

    &:active {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  .density-toggle__shortcut {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-tertiary);

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: var(--text-secondary);
    }
  }
}

// 动画效果
@keyframes density-switch {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.density-toggle__button:active {
  animation: density-switch 0.2s ease-in-out;
}
</style>