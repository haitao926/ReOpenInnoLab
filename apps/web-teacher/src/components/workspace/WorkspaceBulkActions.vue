<template>
  <div class="workspace-bulk-actions" :class="bulkActionsClasses">
    <!-- 主要操作栏 -->
    <div class="workspace-bulk-actions__main">
      <!-- 选择信息 -->
      <div class="selection-info">
        <el-checkbox
          :model-value="allSelected"
          :indeterminate="isIndeterminate"
          @change="handleSelectAll"
        >
          <span class="selection-text">
            已选择 <strong>{{ selectedCount }}</strong> 项
            <span v-if="totalCount > 0">，共 {{ totalCount }} 项</span>
          </span>
        </el-checkbox>

        <el-button
          v-if="selectedCount > 0"
          text
          size="small"
          @click="handleClearSelection"
        >
          清空选择
        </el-button>
      </div>

      <!-- 批量操作按钮 -->
      <div class="bulk-actions">
        <el-button-group v-if="compact">
          <el-tooltip
            v-for="action in visibleActions"
            :key="action.command"
            :content="action.tooltip || action.label"
            placement="top"
          >
            <el-button
              :type="action.type || 'default'"
              :size="size"
              :disabled="action.disabled || selectedCount === 0"
              :loading="action.loading"
              @click="handleAction(action.command)"
            >
              <el-icon v-if="action.icon">
                <component :is="action.icon" />
              </el-icon>
            </el-button>
          </el-tooltip>

          <el-dropdown
            v-if="hasMoreActions"
            @command="handleDropdownAction"
            trigger="click"
          >
            <el-button :size="size" :disabled="selectedCount === 0">
              更多<el-icon><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="action in moreActions"
                  :key="action.command"
                  :command="action.command"
                  :disabled="action.disabled"
                  :divided="action.divided"
                >
                  <el-icon v-if="action.icon">
                    <component :is="action.icon" />
                  </el-icon>
                  {{ action.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-button-group>

        <div v-else class="action-buttons">
          <el-button
            v-for="action in visibleActions"
            :key="action.command"
            :type="action.type || 'default'"
            :size="size"
            :disabled="action.disabled || selectedCount === 0"
            :loading="action.loading"
            @click="handleAction(action.command)"
          >
            <el-icon v-if="action.icon">
              <component :is="action.icon" />
            </el-icon>
            {{ action.label }}
          </el-button>

          <el-dropdown
            v-if="hasMoreActions"
            @command="handleDropdownAction"
            trigger="click"
          >
            <el-button :size="size" :disabled="selectedCount === 0">
              更多操作<el-icon><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="action in moreActions"
                  :key="action.command"
                  :command="action.command"
                  :disabled="action.disabled"
                  :divided="action.divided"
                >
                  <el-icon v-if="action.icon">
                    <component :is="action.icon" />
                  </el-icon>
                  {{ action.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- 操作确认对话框 -->
      <el-dialog
        v-model="confirmDialogVisible"
        :title="confirmDialogTitle"
        width="400px"
        :before-close="handleConfirmCancel"
      >
        <div class="confirm-content">
          <el-icon class="confirm-icon" :class="confirmIconClass">
            <component :is="confirmIcon" />
          </el-icon>
          <p class="confirm-message">{{ confirmMessage }}</p>
          <div v-if="confirmDetails && confirmDetails.length > 0" class="confirm-details">
            <ul>
              <li v-for="detail in confirmDetails" :key="detail">{{ detail }}</li>
            </ul>
          </div>
        </div>

        <template #footer>
          <div class="confirm-actions">
            <el-button @click="handleConfirmCancel">取消</el-button>
            <el-button
              :type="confirmButtonType"
              :loading="confirmLoading"
              @click="handleConfirmOk"
            >
              {{ confirmButtonText }}
            </el-button>
          </div>
        </template>
      </el-dialog>
    </div>

    <!-- 统计信息 -->
    <div v-if="showStats && stats && stats.length > 0" class="workspace-bulk-actions__stats">
      <div class="stats-container">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="stat-item"
        >
          <span class="stat-label">{{ stat.label }}</span>
          <span class="stat-value" :class="stat.valueClass">{{ stat.value }}</span>
        </div>
      </div>
    </div>

    <!-- 快速筛选 -->
    <div v-if="showQuickFilter && quickFilters && quickFilters.length > 0" class="workspace-bulk-actions__quick-filter">
      <div class="quick-filter-container">
        <span class="quick-filter-label">快速筛选：</span>
        <div class="quick-filter-buttons">
          <el-button
            v-for="filter in quickFilters"
            :key="filter.value"
            :type="activeQuickFilter === filter.value ? 'primary' : 'default'"
            size="small"
            @click="handleQuickFilter(filter.value)"
          >
            {{ filter.label }}
            <span v-if="filter.count" class="filter-count">({{ filter.count }})</span>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  ArrowDown,
  Delete,
  Download,
  Upload,
  Edit,
  Share,
  CopyDocument,
  FolderAdd,
  Flag,
  Warning,
  QuestionFilled,
  CircleCheckFilled,
  InfoFilled
} from '@element-plus/icons-vue'

interface BulkAction {
  command: string
  label: string
  icon?: any
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  tooltip?: string
  disabled?: boolean
  loading?: boolean
  divided?: boolean
  confirm?: {
    title?: string
    message?: string
    type?: 'warning' | 'danger' | 'info'
    buttonText?: string
    details?: string[]
  }
  dropdown?: boolean
  maxDisplay?: number
}

interface Stat {
  label: string
  value: string | number
  valueClass?: string
}

interface QuickFilter {
  label: string
  value: string
  count?: number
}

interface Props {
  // 选择状态
  selectedCount: number
  totalCount: number
  allSelected: boolean
  isIndeterminate: boolean

  // 操作配置
  actions: BulkAction[]
  maxVisibleActions?: number

  // 统计信息
  showStats?: boolean
  stats?: Stat[]

  // 快速筛选
  showQuickFilter?: boolean
  quickFilters?: QuickFilter[]
  activeQuickFilter?: string

  // 样式配置
  size?: 'large' | 'default' | 'small'
  compact?: boolean
  position?: 'top' | 'bottom' | 'fixed'
  sticky?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  maxVisibleActions: 4,
  showStats: false,
  showQuickFilter: false,
  size: 'default',
  compact: false,
  position: 'top',
  sticky: false
})

const emit = defineEmits<{
  selectAll: [selected: boolean]
  clearSelection: []
  action: [command: string, selectedItems?: any[]]
  quickFilter: [value: string]
}>()

// 确认对话框状态
const confirmDialogVisible = ref(false)
const confirmAction = ref<BulkAction | null>(null)
const confirmLoading = ref(false)

const bulkActionsClasses = computed(() => [
  `workspace-bulk-actions--${props.position}`,
  {
    'workspace-bulk-actions--sticky': props.sticky,
    'workspace-bulk-actions--compact': props.compact,
    'workspace-bulk-actions--has-selection': props.selectedCount > 0,
    'workspace-bulk-actions--hidden': props.selectedCount === 0 && props.position === 'fixed'
  }
])

const visibleActions = computed(() => {
  const maxDisplay = props.maxVisibleActions
  return props.actions
    .filter(action => !action.dropdown)
    .slice(0, maxDisplay)
})

const moreActions = computed(() => {
  const maxDisplay = props.maxVisibleActions
  return props.actions
    .filter(action => action.dropdown)
    .concat(props.actions.filter(action => !action.dropdown).slice(maxDisplay))
})

const hasMoreActions = computed(() => {
  return moreActions.value.length > 0
})

// 确认对话框相关计算属性
const confirmDialogTitle = computed(() => {
  return confirmAction.value?.confirm?.title || `确认${confirmAction.value?.label}`
})

const confirmMessage = computed(() => {
  if (confirmAction.value?.confirm?.message) {
    return confirmAction.value.confirm.message
  }

  const actionLabel = confirmAction.value?.label || '操作'
  return `确定要${actionLabel}选中的 ${props.selectedCount} 项吗？`
})

const confirmIcon = computed(() => {
  const type = confirmAction.value?.confirm?.type || 'warning'
  switch (type) {
    case 'danger':
      return Warning
    case 'info':
      return InfoFilled
    case 'success':
      return CircleCheckFilled
    default:
      return QuestionFilled
  }
})

const confirmIconClass = computed(() => {
  const type = confirmAction.value?.confirm?.type || 'warning'
  return `confirm-icon--${type}`
})

const confirmButtonType = computed(() => {
  const type = confirmAction.value?.confirm?.type || 'warning'
  return type === 'danger' ? 'danger' : 'primary'
})

const confirmButtonText = computed(() => {
  return confirmAction.value?.confirm?.buttonText || confirmAction.value?.label || '确认'
})

const confirmDetails = computed(() => {
  return confirmAction.value?.confirm?.details
})

const handleSelectAll = (selected: boolean) => {
  emit('selectAll', selected)
}

const handleClearSelection = () => {
  emit('clearSelection')
}

const handleAction = (command: string) => {
  const action = props.actions.find(a => a.command === command)
  if (!action) return

  if (action.confirm) {
    confirmAction.value = action
    confirmDialogVisible.value = true
  } else {
    emit('action', command)
  }
}

const handleDropdownAction = (command: string) => {
  handleAction(command)
}

const handleQuickFilter = (value: string) => {
  emit('quickFilter', value)
}

const handleConfirmOk = async () => {
  if (!confirmAction.value) return

  confirmLoading.value = true

  try {
    emit('action', confirmAction.value.command)
    confirmDialogVisible.value = false
    confirmAction.value = null
  } finally {
    confirmLoading.value = false
  }
}

const handleConfirmCancel = () => {
  if (confirmLoading.value) return
  confirmDialogVisible.value = false
  confirmAction.value = null
}
</script>

<style lang="scss" scoped>
.workspace-bulk-actions {
  background-color: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-base);
  padding: var(--spacing-base);
  margin-bottom: var(--spacing-base);
  transition: all var(--edu-duration-normal) var(--edu-easing-in-out);

  &--sticky {
    position: sticky;
    top: 0;
    z-index: var(--edu-z-sticky);
    box-shadow: var(--edu-shadow-md);
  }

  &--fixed {
    position: fixed;
    bottom: var(--spacing-xl);
    left: 50%;
    transform: translateX(-50%);
    z-index: var(--edu-z-fixed);
    box-shadow: var(--edu-shadow-xl);
    min-width: 600px;
    max-width: 90vw;

    &.workspace-bulk-actions--hidden {
      transform: translateX(-50%) translateY(120%);
      opacity: 0;
    }
  }

  &--compact {
    padding: var(--spacing-sm) var(--spacing-base);
  }

  &--has-selection {
    border-color: var(--edu-primary-200);
    background-color: var(--edu-primary-50);
  }

  &__main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-base);
  }

  &__stats {
    margin-top: var(--spacing-sm);
    padding-top: var(--spacing-sm);
    border-top: 1px solid var(--border-color);
  }

  &__quick-filter {
    margin-top: var(--spacing-sm);
    padding-top: var(--spacing-sm);
    border-top: 1px solid var(--border-color);
  }
}

.selection-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
  flex: 1;
}

.selection-text {
  font-size: var(--font-size-sm);
  color: var(--text-primary);

  strong {
    color: var(--edu-primary);
    font-weight: var(--font-weight-semibold);
  }
}

.bulk-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
  flex-shrink: 0;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.stats-container {
  display: flex;
  align-items: center;
  gap: var(--spacing-xl);
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.stat-value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);

  &.stat-value--primary {
    color: var(--edu-primary);
  }

  &.stat-value--success {
    color: var(--edu-success);
  }

  &.stat-value--warning {
    color: var(--edu-warning);
  }

  &.stat-value--danger {
    color: var(--edu-danger);
  }
}

.quick-filter-container {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
  flex-wrap: wrap;
}

.quick-filter-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
}

.quick-filter-buttons {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.filter-count {
  margin-left: var(--spacing-xs);
  font-size: var(--font-size-xs);
  opacity: 0.8;
}

// 确认对话框样式
.confirm-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-base);
  text-align: center;
}

.confirm-icon {
  font-size: 48px;
  margin-bottom: var(--spacing-sm);

  &.confirm-icon--warning {
    color: var(--edu-warning);
  }

  &.confirm-icon--danger {
    color: var(--edu-danger);
  }

  &.confirm-icon--info {
    color: var(--edu-info);
  }

  &.confirm-icon--success {
    color: var(--edu-success);
  }
}

.confirm-message {
  margin: 0;
  font-size: var(--font-size-base);
  color: var(--text-primary);
  line-height: var(--line-height-relaxed);
}

.confirm-details {
  margin-top: var(--spacing-sm);
  text-align: left;

  ul {
    margin: 0;
    padding-left: var(--spacing-lg);
    color: var(--text-secondary);
    font-size: var(--font-size-sm);

    li {
      margin-bottom: var(--spacing-xs);

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}

// 响应式适配
@media (max-width: 768px) {
  .workspace-bulk-actions {
    &--fixed {
      min-width: auto;
      left: var(--spacing-base);
      right: var(--spacing-base);
      transform: none;
      max-width: none;
      bottom: var(--spacing-base);

      &.workspace-bulk-actions--hidden {
        transform: translateY(120%);
      }
    }

    &__main {
      flex-direction: column;
      align-items: stretch;
      gap: var(--spacing-sm);
    }

    &__stats,
    &__quick-filter {
      margin-top: var(--spacing-sm);
      padding-top: var(--spacing-sm);
    }
  }

  .selection-info {
    justify-content: space-between;
  }

  .bulk-actions {
    justify-content: center;
  }

  .action-buttons {
    justify-content: center;
  }

  .stats-container {
    justify-content: space-around;
    gap: var(--spacing-base);
  }

  .quick-filter-container {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .quick-filter-buttons {
    width: 100%;
    justify-content: flex-start;
  }
}

// 深色模式适配
[data-theme="dark"] {
  .workspace-bulk-actions {
    background-color: var(--bg-elevated);
    border-color: var(--border-color);

    &--has-selection {
      background-color: rgba(133, 190, 255, 0.1);
      border-color: var(--edu-primary-400);
    }

    &__stats,
    &__quick-filter {
      border-top-color: var(--border-color);
    }
  }
}
</style>