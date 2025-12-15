<template>
  <div class="crud-list" :class="{ 'is-loading': loading }">
    <!-- 头部工具栏 -->
    <div v-if="showHeader" class="crud-list__header">
      <div class="crud-list__header-left">
        <h2 v-if="config.title" class="crud-list__title">{{ config.title }}</h2>

        <!-- 批量操作 -->
        <div v-if="selectedItems.length > 0" class="crud-list__batch-actions">
          <span class="crud-list__batch-count">
            已选择 {{ selectedItems.length }} 项
          </span>
          <el-button
            v-for="action in batchActions"
            :key="action.key"
            :type="action.type"
            :icon="action.icon"
            size="small"
            @click="handleBatchAction(action)"
          >
            {{ action.label }}
          </el-button>
          <el-button size="small" @click="clearSelection">取消选择</el-button>
        </div>
      </div>

      <div class="crud-list__header-right">
        <!-- 视图模式切换 -->
        <el-radio-group
          v-if="viewModes.length > 1"
          v-model="currentViewMode"
          class="crud-list__view-modes"
        >
          <el-radio-button
            v-for="mode in viewModes"
            :key="mode"
            :label="mode"
          >
            <el-icon>
              <Grid v-if="mode === 'grid'" />
              <List v-else-if="mode === 'table'" />
              <Clock v-else-if="mode === 'timeline'" />
            </el-icon>
          </el-radio-button>
        </el-radio-group>

        <!-- 搜索 -->
        <el-input
          v-if="searchable"
          :model-value="searchKeyword"
          :placeholder="searchPlaceholder || '搜索...'"
          class="crud-list__search"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <!-- 操作按钮 -->
        <el-button
          v-for="action in headerActions"
          :key="action.key"
          :type="action.type || 'primary'"
          :icon="action.icon"
          @click="handleAction(action)"
        >
          {{ action.label }}
        </el-button>
      </div>
    </div>

    <!-- 过滤器 -->
    <div v-if="hasFilters" class="crud-list__filters">
      <slot name="filters">
        <CrudFilters
          :filters="filterDefinitions"
          :value="filters"
          @change="handleFilterChange"
        />
      </slot>
    </div>

    <!-- 主内容区 -->
    <div class="crud-list__content" :style="{ height: computedHeight }">
      <!-- 表格视图 -->
      <CrudTable
        v-if="currentViewMode === 'table'"
        :columns="columnDefinitions"
        :items="items"
        :loading="loading"
        :selection="allowSelection"
        :selected-items="selectedItems"
        :row-actions="rowActions"
        @selection-change="handleSelectionChange"
        @action="handleRowAction"
        @sort-change="handleSortChange"
      />

      <!-- 网格视图 -->
      <CrudGrid
        v-else-if="currentViewMode === 'grid'"
        :columns="columnDefinitions"
        :items="items"
        :loading="loading"
        :selection="allowSelection"
        :selected-items="selectedItems"
        :row-actions="rowActions"
        @selection-change="handleSelectionChange"
        @action="handleRowAction"
      />

      <!-- 时间线视图 -->
      <CrudTimeline
        v-else-if="currentViewMode === 'timeline'"
        :items="items"
        :loading="loading"
        :date-field="timelineDateField"
        :row-actions="rowActions"
        @action="handleRowAction"
      />

      <!-- 空状态 -->
      <el-empty
        v-if="!loading && items.length === 0"
        :description="emptyDescription"
      >
        <el-button
          v-if="createAction"
          type="primary"
          @click="handleAction(createAction)"
        >
          {{ createAction.label }}
        </el-button>
      </el-empty>
    </div>

    <!-- 底部分页 -->
    <div v-if="showFooter && pagination" class="crud-list__footer">
      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :page-sizes="pagination.pageSizes"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @update:current-page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, useSlots } from 'vue'
import { ElMessage } from 'element-plus'
import { Grid, List, Clock, Search } from '@element-plus/icons-vue'
import type { CrudConfig, CrudItem, ActionDefinition } from '@/shared/types/crud'
import CrudFilters from './CrudFilters.vue'
import CrudTable from './CrudTable.vue'
import CrudGrid from './CrudGrid.vue'
import CrudTimeline from './CrudTimeline.vue'

// Props
const props = withDefaults(defineProps<{
  config: CrudConfig
  items: CrudItem[]
  loading?: boolean
  height?: string | number
  showHeader?: boolean
  showFooter?: boolean
  selectedItems?: CrudItem[]
  currentPage?: number
  pageSize?: number
  total?: number
  filters?: Record<string, any>
  searchKeyword?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  viewMode?: string
}>(), {
  loading: false,
  showHeader: true,
  showFooter: true,
  currentPage: 1,
  pageSize: 20,
  total: 0,
  filters: () => ({}),
  searchKeyword: '',
  viewMode: 'table'
})

// Emits
const emit = defineEmits<{
  'update:selectedItems': [items: CrudItem[]]
  'update:currentPage': [page: number]
  'update:pageSize': [size: number]
  'update:filters': [filters: Record<string, any>]
  'update:searchKeyword': [keyword: string]
  'update:sortBy': [sortBy: string]
  'update:sortOrder': [order: 'asc' | 'desc']
  'update:viewMode': [mode: string]
  'action': [action: ActionDefinition, item?: CrudItem]
  'batch-action': [action: ActionDefinition, items: CrudItem[]]
  'selection-change': [items: CrudItem[]]
  'filter-change': [filters: Record<string, any>]
  'search': [keyword: string]
  'sort-change': [sortBy: string, sortOrder: 'asc' | 'desc']
  'page-change': [page: number, pageSize: number]
}>()

// Slots
const slots = useSlots()

// 计算属性
const currentViewMode = computed({
  get: () => props.viewMode,
  set: (value) => emit('update:viewMode', value)
})

const computedHeight = computed(() => {
  if (!props.height) return undefined
  return typeof props.height === 'number' ? `${props.height}px` : props.height
})

const viewModes = computed(() => props.config.list?.viewModes || ['table'])

const searchable = computed(() => props.config.list?.searchable !== false)

const searchPlaceholder = computed(() => props.config.list?.searchPlaceholder)

const allowSelection = computed(() => {
  return props.config.list?.batchActions && props.config.list.batchActions.length > 0
})

const hasFilters = computed(() => {
  return props.config.list?.filters && props.config.list.filters.length > 0
})

const filterDefinitions = computed(() => props.config.list?.filters || [])

const columnDefinitions = computed(() => props.config.list?.columns || [])

const headerActions = computed(() => {
  const actions = props.config.list?.actions || []
  return actions.filter(action => {
    if (typeof action.visible === 'function') {
      return action.visible()
    }
    return action.visible !== false
  })
})

const rowActions = computed(() => props.config.list?.rowActions || [])

const batchActions = computed(() => props.config.list?.batchActions || [])

const pagination = computed(() => props.config.list?.pagination)

const emptyDescription = computed(() => {
  if (props.searchKeyword || Object.keys(props.filters).some(key => props.filters[key])) {
    return '没有找到匹配的数据'
  }
  return '暂无数据'
})

const timelineDateField = computed(() => {
  // 找到日期类型的字段作为时间线字段
  const dateField = props.config.fields.find(field => field.type === 'date')
  return dateField?.key || 'createdAt'
})

const createAction = computed(() => {
  return headerActions.value.find(action => action.key === 'create')
})

// 事件处理
const handleAction = (action: ActionDefinition, item?: CrudItem) => {
  if (action.handler) {
    action.handler(item || {}, action)
  }
  emit('action', action, item)
}

const handleRowAction = (action: ActionDefinition, item: CrudItem) => {
  handleAction(action, item)
}

const handleBatchAction = async (action: ActionDefinition) => {
  try {
    if (action.key === 'delete') {
      await ElMessageBox.confirm(
        `确定要删除选中的 ${props.selectedItems.length} 项吗？`,
        '批量删除',
        {
          confirmButtonText: '删除',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    }

    if (action.handler) {
      await action.handler(props.selectedItems, action)
    }

    emit('batch-action', action, props.selectedItems)
  } catch (error) {
    // 用户取消操作
  }
}

const handleSelectionChange = (items: CrudItem[]) => {
  emit('update:selectedItems', items)
  emit('selection-change', items)
}

const handleFilterChange = (filters: Record<string, any>) => {
  emit('update:filters', filters)
  emit('filter-change', filters)
}

const handleSearch = (keyword: string) => {
  emit('update:searchKeyword', keyword)
  emit('search', keyword)
}

const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
  emit('update:sortBy', sortBy)
  emit('update:sortOrder', sortOrder)
  emit('sort-change', sortBy, sortOrder)
}

const handlePageChange = (page: number) => {
  emit('update:currentPage', page)
  emit('page-change', page, props.pageSize)
}

const handlePageSizeChange = (size: number) => {
  emit('update:pageSize', size)
  emit('update:currentPage', 1) // 重置页码
  emit('page-change', 1, size)
}

const clearSelection = () => {
  emit('update:selectedItems', [])
  emit('selection-change', [])
}

// 监听器
watch(() => props.currentPage, (newPage) => {
  emit('page-change', newPage, props.pageSize)
})
</script>

<style scoped lang="scss">
.crud-list {
  display: flex;
  flex-direction: column;
  height: 100%;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
    padding: var(--spacing-sm) 0;

    &-left {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    &-right {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }
  }

  &__title {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
  }

  &__batch-actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-xs) var(--spacing-sm);
    background-color: var(--color-primary-light-9);
    border-radius: var(--border-radius-base);
  }

  &__batch-count {
    font-size: var(--font-size-sm);
    color: var(--color-primary);
  }

  &__view-modes {
    margin-right: var(--spacing-sm);
  }

  &__search {
    width: 250px;
  }

  &__filters {
    margin-bottom: var(--spacing-md);
  }

  &__content {
    flex: 1;
    position: relative;
    overflow: hidden;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--border-color-light);
  }

  &.is-loading {
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255, 255, 255, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }
  }
}
</style>