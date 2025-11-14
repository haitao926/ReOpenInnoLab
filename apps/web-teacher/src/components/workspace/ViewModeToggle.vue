<template>
  <div class="view-mode-toggle" :class="toggleClasses">
    <el-button-group v-if="variant === 'button-group'">
      <el-tooltip
        v-for="mode in viewModes"
        :key="mode.value"
        :content="mode.tooltip || mode.label"
        placement="top"
      >
        <el-button
          :type="modelValue === mode.value ? 'primary' : 'default'"
          :icon="mode.icon"
          :size="size"
          :disabled="mode.disabled"
          @click="handleModeChange(mode.value)"
        >
          <span v-if="showLabel">{{ mode.label }}</span>
        </el-button>
      </el-tooltip>
    </el-button-group>

    <el-segmented
      v-else-if="variant === 'segmented'"
      :model-value="modelValue"
      :options="segmentedOptions"
      :size="size"
      :disabled="disabled"
      @change="handleModeChange"
    />

    <el-radio-group
      v-else-if="variant === 'radio'"
      :model-value="modelValue"
      :size="size"
      :disabled="disabled"
      @change="handleModeChange"
    >
      <el-radio-button
        v-for="mode in viewModes"
        :key="mode.value"
        :label="mode.value"
        :disabled="mode.disabled"
      >
        <el-icon class="mode-icon">
          <component :is="mode.icon" />
        </el-icon>
        <span v-if="showLabel">{{ mode.label }}</span>
      </el-radio-button>
    </el-radio-group>

    <div v-else-if="variant === 'toggle'" class="view-mode-toggle__switch">
      <div
        v-for="mode in viewModes"
        :key="mode.value"
        class="mode-item"
        :class="{ 'is-active': modelValue === mode.value, 'is-disabled': mode.disabled }"
        @click="handleModeChange(mode.value)"
      >
        <el-tooltip :content="mode.tooltip || mode.label" placement="top">
          <div class="mode-button">
            <el-icon class="mode-icon">
              <component :is="mode.icon" />
            </el-icon>
            <span v-if="showLabel" class="mode-label">{{ mode.label }}</span>
          </div>
        </el-tooltip>
      </div>
    </div>

    <!-- 状态信息 -->
    <div v-if="showStats" class="view-mode-toggle__stats">
      <span class="stats-item">
        <el-icon><Document /></el-icon>
        {{ total }} 项
      </span>
      <span v-if="selectedCount > 0" class="stats-item stats-item--selected">
        <el-icon><Check /></el-icon>
        已选择 {{ selectedCount }} 项
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Document, Check, Grid, List, Menu, Calendar } from '@element-plus/icons-vue'

interface ViewMode {
  value: string
  label: string
  icon: any
  tooltip?: string
  disabled?: boolean
}

interface Props {
  modelValue: string
  viewModes: ViewMode[]
  variant?: 'button-group' | 'segmented' | 'radio' | 'toggle'
  size?: 'large' | 'default' | 'small'
  showLabel?: boolean
  showStats?: boolean
  total?: number
  selectedCount?: number
  disabled?: boolean
  block?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'button-group',
  size: 'default',
  showLabel: false,
  showStats: false,
  total: 0,
  selectedCount: 0,
  disabled: false,
  block: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
}>()

const toggleClasses = computed(() => [
  `view-mode-toggle--${props.variant}`,
  {
    'view-mode-toggle--block': props.block,
    'view-mode-toggle--disabled': props.disabled,
    'view-mode-toggle--with-label': props.showLabel,
    'view-mode-toggle--with-stats': props.showStats
  }
])

const segmentedOptions = computed(() => {
  return props.viewModes.map(mode => ({
    label: mode.label,
    value: mode.value,
    icon: mode.icon,
    disabled: mode.disabled
  }))
})

const handleModeChange = (value: string) => {
  if (props.disabled) return
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<style lang="scss" scoped>
.view-mode-toggle {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);

  &--block {
    width: 100%;
    justify-content: center;
  }

  &--with-stats {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-sm);
  }

  &--toggle {
    .view-mode-toggle__switch {
      display: flex;
      background-color: var(--bg-secondary);
      border-radius: var(--radius-base);
      padding: var(--spacing-xs);
      border: 1px solid var(--border-color);
    }

    .mode-item {
      flex: 1;
      border-radius: var(--radius-sm);
      transition: all var(--edu-duration-fast) var(--edu-easing-in-out);
      cursor: pointer;

      &:not(.is-disabled):hover {
        background-color: var(--bg-tertiary);
      }

      &.is-active {
        background-color: var(--edu-primary);
        color: white;

        .mode-icon {
          color: white;
        }

        .mode-label {
          color: white;
        }
      }

      &.is-disabled {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
      }
    }

    .mode-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-sm) var(--spacing-base);
      border-radius: var(--radius-sm);
      transition: all var(--edu-duration-fast) var(--edu-easing-in-out);
    }

    .mode-icon {
      font-size: 16px;
      color: var(--icon-color-primary);
    }

    .mode-label {
      font-size: var(--font-size-sm);
      color: var(--text-primary);
      font-weight: var(--font-weight-medium);
    }
  }

  &__stats {
    display: flex;
    align-items: center;
    gap: var(--spacing-base);
    margin-top: var(--spacing-xs);
  }

  .stats-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);

    .el-icon {
      font-size: 12px;
    }

    &--selected {
      color: var(--edu-primary);
      font-weight: var(--font-weight-medium);
    }
  }
}

// 按钮组样式增强
:deep(.el-button-group) {
  .el-button {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);

    .el-icon {
      font-size: 16px;
    }

    &.is-active {
      background-color: var(--edu-primary);
      border-color: var(--edu-primary);

      .el-icon {
        color: white;
      }
    }
  }
}

// 分段控制器样式增强
:deep(.el-segmented) {
  background-color: var(--bg-secondary);
  border-color: var(--border-color);

  .el-segmented__item {
    .el-segmented__item-selected {
      background-color: var(--edu-primary);
      color: white;
    }

    .el-icon {
      margin-right: var(--spacing-xs);
    }
  }
}

// 单选按钮组样式增强
:deep(.el-radio-group) {
  .el-radio-button {
    .el-radio-button__inner {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      background-color: var(--bg-primary);
      border-color: var(--border-color);

      .el-icon {
        font-size: 16px;
      }
    }

    &.is-active {
      .el-radio-button__inner {
        background-color: var(--edu-primary);
        border-color: var(--edu-primary);
        color: white;
      }
    }
  }
}

// 响应式适配
@media (max-width: 768px) {
  .view-mode-toggle {
    &--with-label {
      .view-mode-toggle__switch {
        .mode-button {
          flex-direction: column;
          gap: var(--spacing-xs);
          padding: var(--spacing-sm);
        }

        .mode-label {
          font-size: var(--font-size-xs);
        }
      }
    }

    &__stats {
      justify-content: center;
      gap: var(--spacing-sm);
    }
  }

  :deep(.el-button-group) {
    .el-button {
      padding: var(--spacing-sm) var(--spacing-base);

      span {
        display: none;
      }
    }
  }

  :deep(.el-radio-group) {
    .el-radio-button {
      .el-radio-button__inner {
        padding: var(--spacing-sm) var(--spacing-base);

        span {
          display: none;
        }
      }
    }
  }
}
</style>