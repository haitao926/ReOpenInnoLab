<template>
  <div class="workspace-list-shell">
    <!-- 列表容器 -->
    <div class="workspace-list-shell__container" :class="containerClasses">
      <!-- 表格视图 -->
      <el-table
        v-if="viewMode === 'table'"
        :data="data"
        :loading="loading"
        :height="height"
        :max-height="maxHeight"
        :stripe="stripe"
        :border="border"
        :size="size"
        :show-header="showHeader"
        :highlight-current-row="highlightCurrentRow"
        :row-class-name="rowClassName"
        :cell-class-name="cellClassName"
        :header-row-class-name="headerRowClassName"
        :header-cell-class-name="headerCellClassName"
        class="workspace-list-shell__table"
        v-bind="$attrs"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
        @row-click="handleRowClick"
      >
        <!-- 选择列 -->
        <el-table-column
          v-if="selectable"
          type="selection"
          width="55"
          :selectable="isRowSelectable"
          fixed="left"
        />

        <!-- 展开列 -->
        <el-table-column
          v-if="expandable"
          type="expand"
          width="50"
          fixed="left"
        >
          <template #default="{ row, $index }">
            <slot name="expand" :row="row" :index="$index"></slot>
          </template>
        </el-table-column>

        <!-- 序号列 -->
        <el-table-column
          v-if="showIndex"
          type="index"
          label="序号"
          width="80"
          :index="indexMethod"
          fixed="left"
        />

        <!-- 动态列渲染 -->
        <el-table-column
          v-for="column in columns"
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          :min-width="column.minWidth"
          :fixed="column.fixed"
          :sortable="column.sortable"
          :align="column.align || 'left'"
          :show-overflow-tooltip="column.showOverflowTooltip !== false"
          :class-name="column.className"
          :label-class-name="column.labelClassName"
        >
          <template #default="{ row, column: col, $index }">
            <slot
              :name="`cell-${column.prop}`"
              :row="row"
              :column="col"
              :index="$index"
              :value="row[column.prop]"
            >
              <!-- 默认渲染逻辑 -->
              <span v-if="column.type === 'status'" class="status-cell">
                <el-tag
                  :type="getStatusType(row[column.prop])"
                  size="small"
                  :effect="row[column.prop]?.effect || 'light'"
                >
                  {{ getStatusText(row[column.prop]) }}
                </el-tag>
              </span>

              <span v-else-if="column.type === 'date'" class="date-cell">
                {{ formatDate(row[column.prop], column.format) }}
              </span>

              <span v-else-if="column.type === 'number'" class="number-cell">
                {{ formatNumber(row[column.prop], column.format) }}
              </span>

              <span v-else-if="column.type === 'tags'" class="tags-cell">
                <el-tag
                  v-for="(tag, index) in row[column.prop]"
                  :key="index"
                  :type="tag.type || 'info'"
                  size="small"
                  class="tag-item"
                >
                  {{ tag.text || tag }}
                </el-tag>
              </span>

              <span v-else-if="column.type === 'progress'" class="progress-cell">
                <el-progress
                  :percentage="row[column.prop]"
                  :stroke-width="column.strokeWidth || 8"
                  :color="getProgressColor(row[column.prop])"
                  :show-text="column.showProgressText !== false"
                />
              </span>

              <span v-else-if="column.type === 'avatar'" class="avatar-cell">
                <el-avatar :size="column.avatarSize || 32" :src="row[column.prop]">
                  {{ row[column.nameField] || 'U' }}
                </el-avatar>
              </span>

              <span v-else class="text-cell">
                {{ row[column.prop] }}
              </span>
            </slot>
          </template>
        </el-table-column>

        <!-- 操作列 -->
        <el-table-column
          v-if="actions && actions.length > 0"
          label="操作"
          :width="actionColumnWidth"
          :fixed="actionFixed"
          align="center"
        >
          <template #default="{ row, $index }">
            <slot name="actions" :row="row" :index="$index">
              <div class="action-buttons">
                <el-button
                  v-for="action in getVisibleActions(row)"
                  :key="action.command"
                  :type="action.type || 'text'"
                  :size="action.size || 'small'"
                  :disabled="action.disabled?.(row)"
                  :loading="action.loading?.(row)"
                  @click="handleAction(action.command, row, $index)"
                >
                  <el-icon v-if="action.icon">
                    <component :is="action.icon" />
                  </el-icon>
                  {{ action.label }}
                </el-button>

                <el-dropdown
                  v-if="hasMoreActions(row)"
                  @command="(command) => handleDropdownAction(command, row, $index)"
                  trigger="click"
                >
                  <el-button type="text" size="small">
                    更多<el-icon><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item
                        v-for="action in getMoreActions(row)"
                        :key="action.command"
                        :command="action.command"
                        :divided="action.divided"
                        :disabled="action.disabled?.(row)"
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
            </slot>
          </template>
        </el-table-column>
      </el-table>

      <!-- 列表视图（自定义行） -->
      <div v-else-if="viewMode === 'list'" class="workspace-list-shell__list">
        <div
          v-for="(item, index) in data"
          :key="getRowKey(item, index)"
          class="workspace-list-shell__list-item"
          :class="[rowClassName?.(item, index), { 'is-selected': isRowSelected(item) }]"
          @click="handleRowClick(item, index)"
        >
          <slot name="list-item" :row="item" :index="index">
            <!-- 默认列表项渲染 -->
            <div class="list-item-content">
              <div class="list-item-main">
                <h4 class="list-item-title">{{ item[titleField] }}</h4>
                <p v-if="subtitleField && item[subtitleField]" class="list-item-subtitle">
                  {{ item[subtitleField] }}
                </p>
              </div>
              <div class="list-item-meta">
                <span v-if="dateField && item[dateField]" class="list-item-date">
                  {{ formatDate(item[dateField]) }}
                </span>
                <span v-if="statusField" class="list-item-status">
                  <el-tag
                    :type="getStatusType(item[statusField])"
                    size="small"
                  >
                    {{ getStatusText(item[statusField]) }}
                  </el-tag>
                </span>
              </div>
            </div>
          </slot>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && (!data || data.length === 0)" class="workspace-list-shell__empty">
      <slot name="empty">
        <div class="empty-state">
          <el-icon class="empty-state__icon">
            <component :is="emptyIcon" />
          </el-icon>
          <p class="empty-state__text">{{ emptyText }}</p>
          <el-button v-if="emptyAction" type="primary" @click="emptyAction.handler">
            {{ emptyAction.label }}
          </el-button>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'

interface Column {
  prop: string
  label: string
  width?: number | string
  minWidth?: number | string
  fixed?: boolean | 'left' | 'right'
  sortable?: boolean | 'custom'
  align?: 'left' | 'center' | 'right'
  showOverflowTooltip?: boolean
  className?: string
  labelClassName?: string
  type?: 'text' | 'status' | 'date' | 'number' | 'tags' | 'progress' | 'avatar'
  format?: string
  strokeWidth?: number
  showProgressText?: boolean
  avatarSize?: number
  nameField?: string
}

interface Action {
  command: string
  label: string
  type?: string
  size?: string
  icon?: any
  disabled?: (row: any) => boolean
  loading?: (row: any) => boolean
  show?: (row: any) => boolean
  divided?: boolean
  dropdown?: boolean
}

interface EmptyAction {
  label: string
  handler: () => void
}

interface Props {
  viewMode: 'table' | 'list'
  data: any[]
  loading?: boolean
  height?: string | number
  maxHeight?: string | number
  stripe?: boolean
  border?: boolean
  size?: 'large' | 'default' | 'small'
  showHeader?: boolean
  highlightCurrentRow?: boolean
  selectable?: boolean
  expandable?: boolean
  showIndex?: boolean

  // 表格配置
  columns: Column[]
  actions?: Action[]
  actionColumnWidth?: number | string
  actionFixed?: boolean | 'left' | 'right'

  // 列表配置
  titleField?: string
  subtitleField?: string
  dateField?: string
  statusField?: string

  // 行配置
  rowKey?: string | ((row: any) => string)
  rowClassName?: string | ((row: any, index: number) => string)
  cellClassName?: string | ((row: any, column: any, rowIndex: number, columnIndex: number) => string)
  headerRowClassName?: string
  headerCellClassName?: string | ((row: any, column: any, rowIndex: number, columnIndex: number) => string)

  // 选择配置
  selectedRows?: any[]
  isRowSelectable?: (row: any, index: number) => boolean

  // 空状态配置
  emptyText?: string
  emptyIcon?: any
  emptyAction?: EmptyAction

  // 样式配置
  compact?: boolean
  bordered?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  stripe: true,
  border: false,
  size: 'default',
  showHeader: true,
  highlightCurrentRow: false,
  selectable: false,
  expandable: false,
  showIndex: false,
  actionColumnWidth: 200,
  actionFixed: 'right',
  titleField: 'title',
  subtitleField: 'subtitle',
  rowKey: 'id',
  selectedRows: () => [],
  emptyText: '暂无数据',
  compact: false,
  bordered: false
})

const emit = defineEmits([
  'selectionChange',
  'sortChange',
  'rowClick',
  'action',
  'expandChange'
])

const containerClasses = computed(() => [
  `workspace-list-shell--${props.viewMode}`,
  {
    'workspace-list-shell--compact': props.compact,
    'workspace-list-shell--bordered': props.bordered,
    'workspace-list-shell--selectable': props.selectable
  }
])

const getRowKey = (row: any, index: number) => {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(row)
  }
  return row[props.rowKey] || index
}

const isRowSelected = (row: any) => {
  return props.selectedRows.some(selected => {
    const rowKey = getRowKey(row, -1)
    const selectedKey = getRowKey(selected, -1)
    return rowKey === selectedKey
  })
}

const handleSelectionChange = (selection: any[]) => {
  emit('selectionChange', selection)
}

const handleSortChange = (sort: { column: any; prop: string; order: string | null }) => {
  emit('sortChange', sort)
}

const handleRowClick = (row: any, column?: any, event?: MouseEvent) => {
  emit('rowClick', row, column, event)
}

const handleAction = (command: string, row: any, index: number) => {
  emit('action', command, row, index)
}

const handleDropdownAction = (command: string, row: any, index: number) => {
  emit('action', command, row, index)
}

const indexMethod = (index: number) => {
  return index + 1
}

const getVisibleActions = (row: any) => {
  if (!props.actions) return []
  return props.actions.filter(action => !action.dropdown && (!action.show || action.show(row)))
}

const getMoreActions = (row: any) => {
  if (!props.actions) return []
  return props.actions.filter(action => action.dropdown && (!action.show || action.show(row)))
}

const hasMoreActions = (row: any) => {
  return getMoreActions(row).length > 0
}

// 格式化函数
const getStatusType = (status: any) => {
  if (typeof status === 'object' && status.type) {
    return status.type
  }
  return 'info'
}

const getStatusText = (status: any) => {
  if (typeof status === 'object' && status.text) {
    return status.text
  }
  return status
}

const formatDate = (date: string | Date, format = 'YYYY-MM-DD HH:mm') => {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return String(date)

  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatNumber = (num: number, format?: string) => {
  if (typeof num !== 'number') return String(num)
  return num.toLocaleString('zh-CN')
}

const getProgressColor = (percentage: number) => {
  if (percentage < 30) return '#f56565'
  if (percentage < 70) return '#ed8936'
  return '#48bb78'
}
</script>

<style lang="scss" scoped>
.workspace-list-shell {
  position: relative;
  width: 100%;

  &__container {
    background-color: var(--bg-elevated);
    border-radius: var(--radius-base);
    overflow: hidden;
  }

  &--bordered {
    border: 1px solid var(--border-color);
  }

  &--compact {
    :deep(.el-table) {
      .el-table__row {
        height: 44px;
      }
    }
  }

  &__table {
    :deep(.el-table) {
      --el-table-header-bg-color: var(--bg-secondary);
      --el-table-border-color: var(--border-color);
      --el-table-text-color: var(--text-primary);
      --el-table-header-text-color: var(--text-secondary);

      font-size: var(--font-size-sm);

      .el-table__header {
        th {
          background-color: var(--bg-secondary);
          border-bottom: 1px solid var(--border-color);
          font-weight: var(--font-weight-semibold);
          color: var(--text-secondary);
        }
      }

      .el-table__body {
        tr {
          transition: background-color var(--edu-duration-fast) var(--edu-easing-in-out);

          &:hover {
            background-color: var(--bg-secondary);
          }

          &.is-selected {
            background-color: var(--edu-primary-50);
          }
        }
      }

      .status-cell,
      .date-cell,
      .number-cell,
      .text-cell,
      .tags-cell,
      .progress-cell,
      .avatar-cell {
        display: flex;
        align-items: center;
      }
    }
  }

  &__list {
    .workspace-list-shell__list-item {
      padding: var(--spacing-base);
      border-bottom: 1px solid var(--border-color);
      transition: background-color var(--edu-duration-fast) var(--edu-easing-in-out);
      cursor: pointer;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background-color: var(--bg-secondary);
      }

      &.is-selected {
        background-color: var(--edu-primary-50);
      }
    }

    .list-item-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-base);
    }

    .list-item-main {
      flex: 1;
      min-width: 0;
    }

    .list-item-title {
      margin: 0;
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-medium);
      color: var(--text-primary);
    }

    .list-item-subtitle {
      margin: var(--spacing-xs) 0 0 0;
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }

    .list-item-meta {
      display: flex;
      align-items: center;
      gap: var(--spacing-base);
      flex-shrink: 0;
    }

    .list-item-date {
      font-size: var(--font-size-xs);
      color: var(--text-tertiary);
    }
  }

  &__empty {
    padding: var(--spacing-5x);
    text-align: center;
  }

  .action-buttons {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    flex-wrap: wrap;
  }

  .tag-item {
    margin-right: var(--spacing-xs);

    &:last-child {
      margin-right: 0;
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-base);
  color: var(--text-tertiary);

  &__icon {
    font-size: 48px;
    opacity: 0.5;
  }

  &__text {
    margin: 0;
    font-size: var(--font-size-base);
  }
}

// 响应式适配
@media (max-width: 768px) {
  .workspace-list-shell {
    &__table {
      :deep(.el-table) {
        font-size: var(--font-size-xs);

        .el-table__row {
          height: auto;
          min-height: 48px;
        }
      }
    }

    &__list {
      .list-item-content {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-sm);
      }

      .list-item-meta {
        align-self: stretch;
        justify-content: space-between;
      }
    }
  }
}
</style>