<template>
  <div class="workspace-filter-bar" :class="filterBarClasses">
    <!-- 主筛选栏 -->
    <div class="workspace-filter-bar__main">
      <!-- 搜索框 -->
      <div v-if="showSearch" class="filter-item filter-item--search">
        <el-input
          :model-value="searchKeyword"
          :placeholder="searchPlaceholder"
          :size="size"
          :clearable="searchClearable"
          :prefix-icon="Search"
          class="search-input"
          @update:model-value="handleSearchChange"
          @clear="handleSearchClear"
        />
      </div>

      <!-- 筛选器组 -->
      <div class="filter-group">
        <!-- 快速筛选 -->
        <div v-if="quickFilters && quickFilters.length > 0" class="filter-item filter-item--quick">
          <el-select
            :model-value="quickFilterValue"
            :placeholder="quickFilterPlaceholder"
            :size="size"
            :clearable="quickFilterClearable"
            class="filter-select"
            @update:model-value="handleQuickFilterChange"
          >
            <el-option
              v-for="option in quickFilters"
              :key="option.value"
              :label="option.label"
              :value="option.value"
              :disabled="option.disabled"
            >
              <span v-if="option.icon" class="option-icon">
                <el-icon>
                  <component :is="option.icon" />
                </el-icon>
              </span>
              {{ option.label }}
              <span v-if="option.count" class="option-count">({{ option.count }})</span>
            </el-option>
          </el-select>
        </div>

        <!-- 日期筛选 -->
        <div v-if="showDateFilter" class="filter-item filter-item--date">
          <el-date-picker
            :model-value="dateRange"
            type="daterange"
            :size="size"
            :start-placeholder="dateStartPlaceholder"
            :end-placeholder="dateEndPlaceholder"
            :shortcuts="dateShortcuts"
            :clearable="dateClearable"
            class="date-picker"
            @update:model-value="handleDateChange"
          />
        </div>

        <!-- 分类筛选 -->
        <div v-if="categories && categories.length > 0" class="filter-item filter-item--category">
          <el-select
            :model-value="categoryValue"
            :placeholder="categoryPlaceholder"
            :size="size"
            :clearable="categoryClearable"
            :multiple="categoryMultiple"
            class="filter-select"
            @update:model-value="handleCategoryChange"
          >
            <el-option
              v-for="category in categories"
              :key="category.value"
              :label="category.label"
              :value="category.value"
              :disabled="category.disabled"
            >
              <span v-if="category.color" class="option-color" :style="{ backgroundColor: category.color }"></span>
              {{ category.label }}
              <span v-if="category.count" class="option-count">({{ category.count }})</span>
            </el-option>
          </el-select>
        </div>

        <!-- 状态筛选 -->
        <div v-if="statuses && statuses.length > 0" class="filter-item filter-item--status">
          <el-select
            :model-value="statusValue"
            :placeholder="statusPlaceholder"
            :size="size"
            :clearable="statusClearable"
            :multiple="statusMultiple"
            class="filter-select"
            @update:model-value="handleStatusChange"
          >
            <el-option
              v-for="status in statuses"
              :key="status.value"
              :label="status.label"
              :value="status.value"
              :disabled="status.disabled"
            >
              <el-tag
                :type="status.type || 'info'"
                size="small"
                class="status-tag"
              >
                {{ status.label }}
              </el-tag>
              <span v-if="status.count" class="option-count">({{ status.count }})</span>
            </el-option>
          </el-select>
        </div>

        <!-- 自定义筛选器插槽 -->
        <slot name="filters"></slot>
      </div>

      <!-- 操作按钮 -->
      <div class="filter-actions">
        <el-button
          v-if="showAdvancedFilter"
          text
          :size="size"
          @click="toggleAdvancedFilter"
        >
          <el-icon><Filter /></el-icon>
          高级筛选
          <el-icon v-if="showAdvanced" class="arrow-icon">
            <ArrowUp />
          </el-icon>
          <el-icon v-else class="arrow-icon">
            <ArrowDown />
          </el-icon>
        </el-button>

        <el-button
          v-if="hasActiveFilters"
          text
          :size="size"
          @click="handleReset"
        >
          <el-icon><RefreshLeft /></el-icon>
          重置
        </el-button>

        <el-tooltip content="刷新数据" placement="top">
          <el-button
            text
            :size="size"
            :loading="loading"
            @click="handleRefresh"
          >
            <el-icon><Refresh /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <!-- 高级筛选面板 -->
    <el-collapse-transition>
      <div v-if="showAdvancedFilter && showAdvanced" class="workspace-filter-bar__advanced">
        <slot name="advanced">
          <div class="advanced-filters">
            <!-- 标签筛选 -->
            <div v-if="tags && tags.length > 0" class="advanced-filter-item">
              <label class="filter-label">标签</label>
              <div class="tags-container">
                <el-tag
                  v-for="tag in tags"
                  :key="tag.value"
                  :type="tag.type || 'info'"
                  :effect="selectedTags.includes(tag.value) ? 'dark' : 'plain'"
                  :closable="selectedTags.includes(tag.value)"
                  size="small"
                  class="tag-item"
                  @click="handleTagClick(tag.value)"
                  @close="handleTagRemove(tag.value)"
                >
                  {{ tag.label }}
                </el-tag>
              </div>
            </div>

            <!-- 数值范围筛选 -->
            <div v-if="showRangeFilter" class="advanced-filter-item">
              <label class="filter-label">{{ rangeLabel }}</label>
              <div class="range-container">
                <el-input-number
                  :model-value="rangeMin"
                  :placeholder="rangeMinPlaceholder"
                  :size="size"
                  :min="rangeMinLimit"
                  :max="rangeMaxLimit"
                  class="range-input"
                  @update:model-value="handleRangeMinChange"
                />
                <span class="range-separator">-</span>
                <el-input-number
                  :model-value="rangeMax"
                  :placeholder="rangeMaxPlaceholder"
                  :size="size"
                  :min="rangeMinLimit"
                  :max="rangeMaxLimit"
                  class="range-input"
                  @update:model-value="handleRangeMaxChange"
                />
              </div>
            </div>

            <!-- 自定义高级筛选插槽 -->
            <slot name="custom-advanced"></slot>
          </div>
        </slot>
      </div>
    </el-collapse-transition>

    <!-- 活跃筛选标签 -->
    <div v-if="hasActiveFilters && showActiveFilters" class="workspace-filter-bar__active">
      <div class="active-filters">
        <span class="active-filters__label">当前筛选：</span>
        <div class="active-filters__tags">
          <!-- 搜索关键词标签 -->
          <el-tag
            v-if="searchKeyword"
            closable
            size="small"
            @close="handleSearchClear"
          >
            搜索: {{ searchKeyword }}
          </el-tag>

          <!-- 其他筛选标签 -->
          <el-tag
            v-for="filter in activeFilters"
            :key="filter.key"
            closable
            size="small"
            @close="handleFilterRemove(filter.key)"
          >
            {{ filter.label }}: {{ filter.value }}
          </el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Search,
  Filter,
  ArrowUp,
  ArrowDown,
  RefreshLeft,
  Refresh
} from '@element-plus/icons-vue'

interface FilterOption {
  label: string
  value: string | number
  disabled?: boolean
  icon?: any
  count?: number
  color?: string
}

interface StatusOption extends FilterOption {
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
}

interface TagOption extends FilterOption {
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
}

interface DateShortcut {
  text: string
  value: Date | (() => Date)
}

interface ActiveFilter {
  key: string
  label: string
  value: string
}

interface Props {
  // 搜索配置
  searchKeyword?: string
  searchPlaceholder?: string
  searchClearable?: boolean
  showSearch?: boolean

  // 快速筛选配置
  quickFilters?: FilterOption[]
  quickFilterValue?: string | number
  quickFilterPlaceholder?: string
  quickFilterClearable?: boolean

  // 日期筛选配置
  dateRange?: [Date, Date] | null
  showDateFilter?: boolean
  dateStartPlaceholder?: string
  dateEndPlaceholder?: string
  dateShortcuts?: DateShortcut[]
  dateClearable?: boolean

  // 分类筛选配置
  categories?: FilterOption[]
  categoryValue?: string | number | (string | number)[]
  categoryPlaceholder?: string
  categoryClearable?: boolean
  categoryMultiple?: boolean

  // 状态筛选配置
  statuses?: StatusOption[]
  statusValue?: string | number | (string | number)[]
  statusPlaceholder?: string
  statusClearable?: boolean
  statusMultiple?: boolean

  // 标签筛选配置
  tags?: TagOption[]
  selectedTags?: (string | number)[]

  // 范围筛选配置
  showRangeFilter?: boolean
  rangeLabel?: string
  rangeMin?: number
  rangeMax?: number
  rangeMinPlaceholder?: string
  rangeMaxPlaceholder?: string
  rangeMinLimit?: number
  rangeMaxLimit?: number

  // 显示控制
  showAdvancedFilter?: boolean
  showActiveFilters?: boolean
  loading?: boolean
  size?: 'large' | 'default' | 'small'
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  searchPlaceholder: '搜索关键词...',
  searchClearable: true,
  showSearch: true,
  quickFilterPlaceholder: '快速筛选',
  quickFilterClearable: true,
  dateStartPlaceholder: '开始日期',
  dateEndPlaceholder: '结束日期',
  dateClearable: true,
  categoryPlaceholder: '选择分类',
  categoryClearable: true,
  categoryMultiple: false,
  statusPlaceholder: '选择状态',
  statusClearable: true,
  statusMultiple: false,
  selectedTags: () => [],
  rangeLabel: '数值范围',
  rangeMinPlaceholder: '最小值',
  rangeMaxPlaceholder: '最大值',
  rangeMinLimit: 0,
  rangeMaxLimit: 100,
  showAdvancedFilter: true,
  showActiveFilters: true,
  loading: false,
  size: 'default',
  compact: false
})

const emit = defineEmits<{
  'update:searchKeyword': [value: string]
  'update:quickFilterValue': [value: string | number]
  'update:dateRange': [value: [Date, Date] | null]
  'update:categoryValue': [value: string | number | (string | number)[]]
  'update:statusValue': [value: string | number | (string | number)[]]
  'update:selectedTags': [value: (string | number)[]]
  'update:rangeMin': [value: number]
  'update:rangeMax': [value: number]
  search: [keyword: string]
  quickFilterChange: [value: string | number]
  dateChange: [value: [Date, Date] | null]
  categoryChange: [value: string | number | (string | number)[]]
  statusChange: [value: string | number | (string | number)[]]
  tagClick: [value: string | number]
  tagRemove: [value: string | number]
  rangeMinChange: [value: number]
  rangeMaxChange: [value: number]
  reset: []
  refresh: []
}>()

const showAdvanced = ref(false)

const filterBarClasses = computed(() => [
  'workspace-filter-bar',
  {
    'workspace-filter-bar--compact': props.compact,
    'workspace-filter-bar--loading': props.loading,
    'workspace-filter-bar--has-active': hasActiveFilters.value
  }
])

const hasActiveFilters = computed(() => {
  return props.searchKeyword ||
         props.quickFilterValue ||
         props.dateRange ||
         props.categoryValue ||
         props.statusValue ||
         (props.selectedTags && props.selectedTags.length > 0) ||
         props.rangeMin !== undefined ||
         props.rangeMax !== undefined
})

const activeFilters = computed(() => {
  const filters: ActiveFilter[] = []

  if (props.quickFilterValue) {
    const filter = props.quickFilters?.find(f => f.value === props.quickFilterValue)
    if (filter) {
      filters.push({ key: 'quickFilter', label: '快速筛选', value: filter.label })
    }
  }

  if (props.dateRange) {
    filters.push({
      key: 'dateRange',
      label: '日期范围',
      value: `${props.dateRange[0].toLocaleDateString()} - ${props.dateRange[1].toLocaleDateString()}`
    })
  }

  if (props.categoryValue) {
    const values = Array.isArray(props.categoryValue) ? props.categoryValue : [props.categoryValue]
    const labels = values.map(v => {
      const category = props.categories?.find(c => c.value === v)
      return category?.label || v
    })
    filters.push({ key: 'category', label: '分类', value: labels.join(', ') })
  }

  if (props.statusValue) {
    const values = Array.isArray(props.statusValue) ? props.statusValue : [props.statusValue]
    const labels = values.map(v => {
      const status = props.statuses?.find(s => s.value === v)
      return status?.label || v
    })
    filters.push({ key: 'status', label: '状态', value: labels.join(', ') })
  }

  if (props.selectedTags && props.selectedTags.length > 0) {
    const labels = props.selectedTags.map(v => {
      const tag = props.tags?.find(t => t.value === v)
      return tag?.label || v
    })
    filters.push({ key: 'tags', label: '标签', value: labels.join(', ') })
  }

  if (props.rangeMin !== undefined || props.rangeMax !== undefined) {
    const min = props.rangeMin !== undefined ? props.rangeMin : '不限'
    const max = props.rangeMax !== undefined ? props.rangeMax : '不限'
    filters.push({ key: 'range', label: props.rangeLabel, value: `${min} - ${max}` })
  }

  return filters
})

const handleSearchChange = (value: string) => {
  emit('update:searchKeyword', value)
  emit('search', value)
}

const handleSearchClear = () => {
  emit('update:searchKeyword', '')
  emit('search', '')
}

const handleQuickFilterChange = (value: string | number) => {
  emit('update:quickFilterValue', value)
  emit('quickFilterChange', value)
}

const handleDateChange = (value: [Date, Date] | null) => {
  emit('update:dateRange', value)
  emit('dateChange', value)
}

const handleCategoryChange = (value: string | number | (string | number)[]) => {
  emit('update:categoryValue', value)
  emit('categoryChange', value)
}

const handleStatusChange = (value: string | number | (string | number)[]) => {
  emit('update:statusValue', value)
  emit('statusChange', value)
}

const handleTagClick = (value: string | number) => {
  const currentTags = [...(props.selectedTags || [])]
  const index = currentTags.indexOf(value)

  if (index > -1) {
    currentTags.splice(index, 1)
  } else {
    currentTags.push(value)
  }

  emit('update:selectedTags', currentTags)
  emit('tagClick', value)
}

const handleTagRemove = (value: string | number) => {
  const currentTags = [...(props.selectedTags || [])]
  const index = currentTags.indexOf(value)

  if (index > -1) {
    currentTags.splice(index, 1)
  }

  emit('update:selectedTags', currentTags)
  emit('tagRemove', value)
}

const handleRangeMinChange = (value: number) => {
  emit('update:rangeMin', value)
  emit('rangeMinChange', value)
}

const handleRangeMaxChange = (value: number) => {
  emit('update:rangeMax', value)
  emit('rangeMaxChange', value)
}

const toggleAdvancedFilter = () => {
  showAdvanced.value = !showAdvanced.value
}

const handleReset = () => {
  emit('update:searchKeyword', '')
  emit('update:quickFilterValue', '')
  emit('update:dateRange', null)
  emit('update:categoryValue', props.categoryMultiple ? [] : '')
  emit('update:statusValue', props.statusMultiple ? [] : '')
  emit('update:selectedTags', [])
  emit('update:rangeMin', undefined)
  emit('update:rangeMax', undefined)
  emit('reset')
}

const handleRefresh = () => {
  emit('refresh')
}

const handleFilterRemove = (key: string) => {
  switch (key) {
    case 'quickFilter':
      emit('update:quickFilterValue', '')
      break
    case 'dateRange':
      emit('update:dateRange', null)
      break
    case 'category':
      emit('update:categoryValue', props.categoryMultiple ? [] : '')
      break
    case 'status':
      emit('update:statusValue', props.statusMultiple ? [] : '')
      break
    case 'tags':
      emit('update:selectedTags', [])
      break
    case 'range':
      emit('update:rangeMin', undefined)
      emit('update:rangeMax', undefined)
      break
  }
}
</script>

<style lang="scss" scoped>
.workspace-filter-bar {
  background-color: var(--bg-elevated);
  border-radius: var(--radius-base);
  padding: var(--spacing-base);
  margin-bottom: var(--spacing-base);

  &--compact {
    padding: var(--spacing-sm) var(--spacing-base);
  }

  &--loading {
    position: relative;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(2px);
      z-index: 1;
      border-radius: inherit;
    }
  }

  &__main {
    display: flex;
    align-items: center;
    gap: var(--spacing-base);
    flex-wrap: wrap;
  }

  &__advanced {
    margin-top: var(--spacing-base);
    padding-top: var(--spacing-base);
    border-top: 1px solid var(--border-color);
  }

  &__active {
    margin-top: var(--spacing-base);
    padding-top: var(--spacing-base);
    border-top: 1px solid var(--border-color);
  }
}

.filter-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
  flex-wrap: wrap;
  flex: 1;
}

.filter-item {
  display: flex;
  align-items: center;

  &--search {
    min-width: 280px;
  }

  &--quick,
  &--date,
  &--category,
  &--status {
    min-width: 160px;
  }
}

.search-input {
  width: 100%;
}

.filter-select {
  width: 100%;
}

.date-picker {
  width: 100%;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

.arrow-icon {
  margin-left: var(--spacing-xs);
  font-size: 12px;
  transition: transform var(--edu-duration-fast) var(--edu-easing-in-out);
}

.advanced-filters {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
}

.advanced-filter-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.filter-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.tag-item {
  cursor: pointer;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    opacity: 0.8;
  }
}

.range-container {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.range-input {
  flex: 1;
}

.range-separator {
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

.active-filters {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-base);
  flex-wrap: wrap;
}

.active-filters__label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  align-self: center;
}

.active-filters__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  flex: 1;
}

// 下拉选项样式
.option-icon {
  margin-right: var(--spacing-xs);
  color: var(--icon-color-primary);
}

.option-color {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: var(--spacing-xs);
  border: 1px solid var(--border-color);
}

.option-count {
  margin-left: var(--spacing-xs);
  color: var(--text-tertiary);
  font-size: var(--font-size-xs);
}

.status-tag {
  margin-right: var(--spacing-xs);
}

// 响应式适配
@media (max-width: 768px) {
  .workspace-filter-bar {
    padding: var(--spacing-sm);

    &__main {
      flex-direction: column;
      align-items: stretch;
      gap: var(--spacing-sm);
    }

    &__advanced,
    &__active {
      margin-top: var(--spacing-sm);
      padding-top: var(--spacing-sm);
    }
  }

  .filter-group {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-sm);
  }

  .filter-item {
    &--search {
      min-width: auto;
    }

    &--quick,
    &--date,
    &--category,
    &--status {
      min-width: auto;
    }
  }

  .filter-actions {
    justify-content: space-between;
    margin-top: var(--spacing-sm);
  }

  .active-filters {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .active-filters__label {
    margin-bottom: var(--spacing-xs);
  }
}

// 深色模式适配
[data-theme="dark"] {
  .workspace-filter-bar {
    background-color: var(--bg-elevated);
    border: 1px solid var(--border-color);

    &--loading {
      &::after {
        background: rgba(0, 0, 0, 0.8);
      }
    }

    &__advanced,
    &__active {
      border-top-color: var(--border-color);
    }
  }
}
</style>