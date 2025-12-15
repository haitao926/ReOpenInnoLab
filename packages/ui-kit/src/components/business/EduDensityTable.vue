<template>
  <div class="density-table-container">
    <table
      :class="tableClasses"
      :style="tableStyles"
    >
      <thead :class="headerClasses">
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            :class="getHeaderCellClasses(column)"
            :style="getCellStyle(column.width)"
          >
            <div class="header-cell-content">
              <span class="header-text">{{ column.title }}</span>
              <el-icon
                v-if="column.sortable"
                class="sort-icon"
                :class="getSortIconClass(column.key)"
                @click="handleSort(column.key)"
              >
                <ArrowUp />
              </el-icon>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, index) in data"
          :key="row.id || index"
          :class="getRowClasses(row, index)"
          @click="handleRowClick(row, index)"
        >
          <td
            v-for="column in columns"
            :key="column.key"
            :class="getCellClasses(column)"
            :style="getCellStyle(column.width)"
          >
            <slot
              :name="`cell-${column.key}`"
              :row="row"
              :column="column"
              :value="getCellValue(row, column.key)"
            >
              {{ getCellValue(row, column.key) }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 空状态 -->
    <div v-if="!data || data.length === 0" class="empty-state">
      <el-icon class="empty-icon"><Document /></el-icon>
      <p class="empty-text">暂无数据</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDensity } from '@/composables/useDensity'
import { ArrowUp, Document } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

interface Column {
  key: string
  title: string
  width?: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  fixed?: 'left' | 'right'
}

interface Row {
  id?: string | number
  [key: string]: any
}

interface Props {
  columns: Column[]
  data: Row[]
  stripe?: boolean
  hover?: boolean
  bordered?: boolean
  size?: 'small' | 'middle' | 'large'
  emptyText?: string
  height?: string
  maxHeight?: string
  selectable?: boolean
  selectedRowKeys?: (string | number)[]
}

const props = withDefaults(defineProps<Props>(), {
  stripe: false,
  hover: true,
  bordered: true,
  size: 'middle',
  emptyText: '暂无数据',
  selectable: false,
  selectedRowKeys: () => []
})

const emit = defineEmits<{
  'row-click': [row: Row, index: number]
  'sort-change': [column: string, order: 'asc' | 'desc']
  'selection-change': [selectedRowKeys: (string | number)[]]
}>()

const { isCompact, currentConfig } = useDensity()

// 排序状态
const sortState = ref<Record<string, 'asc' | 'desc'>>({})

const tableClasses = computed(() => [
  'density-table',
  `density-table--${props.size}`,
  {
    'density-table--striped': props.stripe,
    'density-table--hoverable': props.hover,
    'density-table--bordered': props.bordered,
    'density-table--compact': isCompact.value,
    'density-table--selectable': props.selectable
  }
])

const tableStyles = computed(() => ({
  '--table-cell-height': currentConfig.value.table.cellHeight,
  '--table-cell-padding': currentConfig.value.table.cellPadding,
  '--table-font-size': isCompact.value ? currentConfig.value.fontSize.sm : currentConfig.value.fontSize.base,
  '--table-line-height': isCompact.value ? currentConfig.value.lineHeight.tight : currentConfig.value.lineHeight.normal,
  '--table-border-radius': isCompact.value ? currentConfig.value.borderRadius.sm : currentConfig.value.borderRadius.base,
  height: props.height,
  maxHeight: props.maxHeight
}))

const headerClasses = computed(() => [
  'density-table__header',
  {
    'density-table__header--compact': isCompact.value
  }
])

// 获取表头单元格类名
const getHeaderCellClasses = (column: Column) => [
  'table-header-cell',
  `table-header-cell--${column.align || 'left'}`,
  {
    'table-header-cell--sortable': column.sortable,
    'table-header-cell--sorted': sortState.value[column.key] !== undefined,
    'table-header-cell--fixed': column.fixed
  }
]

// 获取排序图标类名
const getSortIconClass = (columnKey: string) => [
  'sort-icon',
  {
    'sort-icon--asc': sortState.value[columnKey] === 'asc',
    'sort-icon--desc': sortState.value[columnKey] === 'desc'
  }
]

// 获取行类名
const getRowClasses = (row: Row, index: number) => [
  'table-row',
  {
    'table-row--striped': props.stripe && index % 2 === 1,
    'table-row--selected': props.selectedRowKeys.includes(row.id || index),
    'table-row--clickable': true
  }
]

// 获取单元格类名
const getCellClasses = (column: Column) => [
  'table-cell',
  `table-cell--${column.align || 'left'}`,
  {
    'table-cell--fixed': column.fixed
  }
]

// 获取单元格样式
const getCellStyle = (width?: string) => {
  if (!width) return {}
  return {
    width: width,
    minWidth: width,
    maxWidth: width
  }
}

// 获取单元格值
const getCellValue = (row: Row, key: string) => {
  return row[key]
}

// 处理排序
const handleSort = (columnKey: string) => {
  const currentOrder = sortState.value[columnKey]
  let newOrder: 'asc' | 'desc' = 'asc'

  if (currentOrder === 'asc') {
    newOrder = 'desc'
  } else if (currentOrder === 'desc') {
    newOrder = 'asc'
  } else {
    newOrder = 'asc'
  }

  sortState.value[columnKey] = newOrder
  emit('sort-change', columnKey, newOrder)
}

// 处理行点击
const handleRowClick = (row: Row, index: number) => {
  emit('row-click', row, index)

  if (props.selectable) {
    const currentSelected = [...props.selectedRowKeys]
    const rowKey = row.id || index

    const indexInSelected = currentSelected.indexOf(rowKey)
    if (indexInSelected > -1) {
      currentSelected.splice(indexInSelected, 1)
    } else {
      currentSelected.push(rowKey)
    }

    emit('selection-change', currentSelected)
  }
}
</script>

<style scoped lang="scss">
.density-table-container {
  position: relative;
  width: 100%;
  overflow: auto;
  border-radius: var(--table-border-radius);
  background: var(--edu-bg-primary);
}

.density-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: var(--table-font-size);
  line-height: var(--table-line-height);
  transition: all var(--edu-duration-normal) var(--edu-easing-in-out);

  &--bordered {
    border: 1px solid var(--edu-border-light);
  }

  &--selectable {
    .table-row {
      cursor: pointer;
      user-select: none;
    }
  }

  &--compact {
    font-size: var(--density-font-size-sm);
    line-height: var(--density-line-height-tight);
  }
}

.density-table__header {
  background: var(--edu-bg-secondary);
  border-bottom: 1px solid var(--edu-border-light);
  position: sticky;
  top: 0;
  z-index: 10;
  transition: all var(--edu-duration-normal) var(--edu-easing-in-out);

  &--compact {
    background: var(--edu-bg-tertiary);
  }
}

.table-header-cell {
  padding: var(--table-cell-padding);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  text-align: left;
  border-bottom: 1px solid var(--edu-border-light);
  height: var(--table-cell-height);
  position: relative;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &--center {
    text-align: center;
  }

  &--right {
    text-align: right;
  }

  &--sortable {
    cursor: pointer;
    user-select: none;

    &:hover {
      background: var(--edu-bg-tertiary);
    }
  }

  &--sorted {
    color: var(--edu-primary-500);
  }

  &--fixed {
    position: sticky;
    background: inherit;
    z-index: 11;
  }
}

.header-cell-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--density-spacing-xs);
}

.header-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sort-icon {
  font-size: 12px;
  color: var(--text-tertiary);
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    color: var(--text-secondary);
  }

  &--asc,
  &--desc {
    color: var(--edu-primary-500);
  }

  &--asc {
    transform: rotate(0deg);
  }

  &--desc {
    transform: rotate(180deg);
  }
}

.table-row {
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &--striped {
    background: var(--edu-bg-secondary);
  }

  &--hoverable:hover {
    background: var(--edu-bg-tertiary);
  }

  &--selected {
    background: var(--edu-primary-50);
    color: var(--edu-primary-700);
  }

  &--clickable {
    cursor: pointer;
  }
}

.table-cell {
  padding: var(--table-cell-padding);
  border-bottom: 1px solid var(--edu-border-light);
  color: var(--text-primary);
  height: var(--table-cell-height);
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &--center {
    text-align: center;
  }

  &--right {
    text-align: right;
  }

  &--fixed {
    position: sticky;
    background: inherit;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  color: var(--text-tertiary);
  min-height: 200px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: var(--spacing-base);
  opacity: 0.5;
}

.empty-text {
  font-size: var(--font-size-base);
  margin: 0;
}

// 深色模式适配
[data-theme="dark"] {
  .density-table-container {
    background: var(--bg-surface);
  }

  .density-table {
    background: var(--bg-surface);
    color: var(--text-primary);
  }

  .density-table__header {
    background: var(--bg-elevated);
    border-bottom-color: var(--border-color);
  }

  .table-header-cell {
    background: var(--bg-elevated);
    color: var(--text-primary);
    border-bottom-color: var(--border-color);

    &--sortable:hover {
      background: var(--bg-surface);
    }
  }

  .table-row {
    &--striped {
      background: var(--bg-surface);
    }

    &--hoverable:hover {
      background: rgba(255, 255, 255, 0.02);
    }

    &--selected {
      background: rgba(33, 150, 243, 0.1);
      color: #90caf9;
    }
  }

  .table-cell {
    color: var(--text-primary);
    border-bottom-color: var(--border-color);
  }
}

// 响应式适配
@media (max-width: 768px) {
  .density-table-container {
    font-size: var(--density-font-size-sm);
  }

  .header-cell-content {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--density-spacing-xs);
  }

  .sort-icon {
    align-self: flex-end;
  }
}

@media (max-width: 480px) {
  .table-header-cell,
  .table-cell {
    padding: var(--density-padding-sm);
  }

  .header-cell-content {
    font-size: var(--density-font-size-xs);
  }
}
</style>