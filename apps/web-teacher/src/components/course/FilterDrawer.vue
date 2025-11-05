<template>
  <el-drawer
    v-model="drawerVisible"
    :title="title"
    direction="rtl"
    size="400px"
    class="course-filter-drawer"
    :show-close="true"
    :before-close="handleClose"
  >
    <div class="filter-drawer-content">
      <!-- 快速筛选 -->
      <div class="filter-section">
        <div class="section-header">
          <h4 class="section-title">快速筛选</h4>
          <el-button
            type="text"
            size="small"
            @click="resetQuickFilters"
            :disabled="!hasActiveQuickFilters"
          >
            重置
          </el-button>
        </div>
        <div class="filter-tags">
          <el-tag
            v-for="filter in quickFilters"
            :key="filter.key"
            :type="activeQuickFilters.includes(filter.key) ? 'primary' : 'info'"
            :effect="activeQuickFilters.includes(filter.key) ? 'dark' : 'plain'"
            :hit="true"
            @click="toggleQuickFilter(filter.key)"
            class="filter-tag"
          >
            {{ filter.label }}
          </el-tag>
        </div>
      </div>

      <!-- 学科筛选 -->
      <div class="filter-section">
        <div class="section-header">
          <h4 class="section-title">学科筛选</h4>
          <el-checkbox
            v-model="subjectFilterExpanded"
            @change="handleSubjectExpanded"
            class="expand-checkbox"
          >
            展开全部
          </el-checkbox>
        </div>
        <div class="subject-options">
          <div
            v-for="subject in displaySubjects"
            :key="subject.id"
            class="subject-option"
            :class="{ active: selectedSubjects.includes(subject.id) }"
            @click="toggleSubject(subject.id)"
          >
            <span
              v-if="subject.color"
              class="subject-color"
              :style="{ backgroundColor: subject.color }"
            ></span>
            <span class="subject-name">{{ subject.name }}</span>
            <span v-if="subject.courseCount" class="subject-count">
              ({{ subject.courseCount }})
            </span>
            <el-icon
              v-show="selectedSubjects.includes(subject.id)"
              class="selected-icon"
            >
              <Check />
            </el-icon>
          </div>
        </div>
        <el-button
          v-if="subjects.length > displayLimit && !subjectFilterExpanded"
          type="text"
          size="small"
          @click="subjectFilterExpanded = true"
          class="expand-btn"
        >
          显示更多 ({{ subjects.length - displayLimit }})
        </el-button>
      </div>

      <!-- 年级筛选 -->
      <div class="filter-section">
        <div class="section-header">
          <h4 class="section-title">年级筛选</h4>
          <el-button
            type="text"
            size="small"
            @click="selectedGrades = []"
            :disabled="selectedGrades.length === 0"
          >
            清空
          </el-button>
        </div>
        <el-checkbox-group v-model="selectedGrades" class="grade-group">
          <el-checkbox
            v-for="grade in gradeOptions"
            :key="grade.value"
            :label="grade.value"
            :value="grade.value"
          >
            {{ grade.label }}
          </el-checkbox>
        </el-checkbox-group>
      </div>

      <!-- 状态筛选 -->
      <div class="filter-section">
        <div class="section-header">
          <h4 class="section-title">课程状态</h4>
          <el-button
            type="text"
            size="small"
            @click="selectedStatuses = []"
            :disabled="selectedStatuses.length === 0"
          >
            清空
          </el-button>
        </div>
        <el-checkbox-group v-model="selectedStatuses" class="status-group">
          <el-checkbox
            v-for="status in statusOptions"
            :key="status.value"
            :label="status.value"
            :value="status.value"
          >
            <div class="status-option">
              <span class="status-indicator" :class="`status-${status.value}`"></span>
              <span>{{ status.label }}</span>
            </div>
          </el-checkbox>
        </el-checkbox-group>
      </div>

      <!-- 创建时间范围 -->
      <div class="filter-section">
        <div class="section-header">
          <h4 class="section-title">创建时间</h4>
          <el-button
            type="text"
            size="small"
            @click="dateRange = []"
            :disabled="dateRange.length === 0"
          >
            清空
          </el-button>
        </div>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          size="small"
          value-format="YYYY-MM-DD"
          class="date-picker"
        />
      </div>

      <!-- 已应用筛选器 -->
      <div v-if="hasActiveFilters" class="filter-section">
        <div class="section-header">
          <h4 class="section-title">已应用筛选</h4>
          <el-button type="text" size="small" @click="resetAllFilters">
            重置全部
          </el-button>
        </div>
        <div class="active-filters">
          <el-tag
            v-for="filter in activeFiltersList"
            :key="filter.key"
            closable
            type="primary"
            size="small"
            @close="removeFilter(filter.key)"
            class="active-filter-tag"
          >
            {{ filter.label }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 底部操作区 -->
    <template #footer>
      <div class="drawer-footer">
        <div class="filter-summary">
          <span class="summary-text">
            共找到 <strong>{{ filteredCount }}</strong> 个课程
          </span>
        </div>
        <div class="drawer-actions">
          <el-button @click="handleClose">取消</el-button>
          <el-button type="primary" @click="applyFilters">应用筛选</el-button>
        </div>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Check } from '@element-plus/icons-vue'
import type { Subject } from '@/api/subjects'

interface QuickFilter {
  key: string
  label: string
}

interface GradeOption {
  label: string
  value: string
}

interface StatusOption {
  label: string
  value: string
}

interface Props {
  modelValue: boolean
  subjects: Subject[]
  gradeOptions: GradeOption[]
  initialFilters?: {
    quickFilters?: string[]
    subjects?: string[]
    grades?: string[]
    statuses?: string[]
    dateRange?: string[]
  }
  filteredCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  initialFilters: () => ({}),
  filteredCount: 0
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'apply-filters': [filters: CourseFilters]
}>()

interface CourseFilters {
  quickFilters: string[]
  subjects: string[]
  grades: string[]
  statuses: string[]
  dateRange: string[]
}

// 响应式数据
const drawerVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const activeQuickFilters = ref<string[]>(props.initialFilters.quickFilters || [])
const selectedSubjects = ref<string[]>(props.initialFilters.subjects || [])
const selectedGrades = ref<string[]>(props.initialFilters.grades || [])
const selectedStatuses = ref<string[]>(props.initialFilters.statuses || [])
const dateRange = ref<string[]>(props.initialFilters.dateRange || [])
const subjectFilterExpanded = ref(false)

const displayLimit = 8

// 快速筛选选项
const quickFilters: QuickFilter[] = [
  { key: 'active', label: '进行中' },
  { key: 'completed', label: '已完成' },
  { key: 'draft', label: '草稿' },
  { key: 'archived', label: '已归档' },
  { key: 'recent', label: '最近创建' },
  { key: 'popular', label: '热门课程' }
]

// 状态选项
const statusOptions: StatusOption[] = [
  { label: '进行中', value: 'active' },
  { label: '已完成', value: 'completed' },
  { label: '草稿', value: 'draft' },
  { label: '已归档', value: 'archived' }
]

// 计算属性
const displaySubjects = computed(() => {
  if (subjectFilterExpanded.value) {
    return props.subjects
  }
  return props.subjects.slice(0, displayLimit)
})

const hasActiveQuickFilters = computed(() => activeQuickFilters.value.length > 0)

const hasActiveFilters = computed(() => (
  activeQuickFilters.value.length > 0 ||
  selectedSubjects.value.length > 0 ||
  selectedGrades.value.length > 0 ||
  selectedStatuses.value.length > 0 ||
  dateRange.value.length > 0
))

const activeFiltersList = computed(() => {
  const filters: Array<{ key: string; label: string }> = []

  // 快速筛选
  activeQuickFilters.value.forEach(key => {
    const filter = quickFilters.find(f => f.key === key)
    if (filter) {
      filters.push({ key: `quick:${key}`, label: filter.label })
    }
  })

  // 学科
  selectedSubjects.value.forEach(subjectId => {
    const subject = props.subjects.find(s => s.id === subjectId)
    if (subject) {
      filters.push({ key: `subject:${subjectId}`, label: subject.name })
    }
  })

  // 年级
  selectedGrades.value.forEach(grade => {
    const gradeOption = props.gradeOptions.find(g => g.value === grade)
    if (gradeOption) {
      filters.push({ key: `grade:${grade}`, label: gradeOption.label })
    }
  })

  // 状态
  selectedStatuses.value.forEach(status => {
    const statusOption = statusOptions.find(s => s.value === status)
    if (statusOption) {
      filters.push({ key: `status:${status}`, label: statusOption.label })
    }
  })

  // 日期范围
  if (dateRange.value.length === 2) {
    filters.push({
      key: 'dateRange',
      label: `${dateRange.value[0]} 至 ${dateRange.value[1]}`
    })
  }

  return filters
})

const title = computed(() => `高级筛选${hasActiveFilters.value ? ' (已应用)' : ''}`)

// 方法
const toggleQuickFilter = (key: string) => {
  const index = activeQuickFilters.value.indexOf(key)
  if (index > -1) {
    activeQuickFilters.value.splice(index, 1)
  } else {
    activeQuickFilters.value.push(key)
  }
}

const toggleSubject = (subjectId: string) => {
  const index = selectedSubjects.value.indexOf(subjectId)
  if (index > -1) {
    selectedSubjects.value.splice(index, 1)
  } else {
    selectedSubjects.value.push(subjectId)
  }
}

const resetQuickFilters = () => {
  activeQuickFilters.value = []
}

const removeFilter = (filterKey: string) => {
  const [type, key] = filterKey.split(':')

  switch (type) {
    case 'quick':
      const quickIndex = activeQuickFilters.value.indexOf(key)
      if (quickIndex > -1) {
        activeQuickFilters.value.splice(quickIndex, 1)
      }
      break
    case 'subject':
      const subjectIndex = selectedSubjects.value.indexOf(key)
      if (subjectIndex > -1) {
        selectedSubjects.value.splice(subjectIndex, 1)
      }
      break
    case 'grade':
      const gradeIndex = selectedGrades.value.indexOf(key)
      if (gradeIndex > -1) {
        selectedGrades.value.splice(gradeIndex, 1)
      }
      break
    case 'status':
      const statusIndex = selectedStatuses.value.indexOf(key)
      if (statusIndex > -1) {
        selectedStatuses.value.splice(statusIndex, 1)
      }
      break
    case 'dateRange':
      dateRange.value = []
      break
  }
}

const resetAllFilters = () => {
  activeQuickFilters.value = []
  selectedSubjects.value = []
  selectedGrades.value = []
  selectedStatuses.value = []
  dateRange.value = []
}

const handleSubjectExpanded = () => {
  subjectFilterExpanded.value = !subjectFilterExpanded.value
}

const applyFilters = () => {
  const filters: CourseFilters = {
    quickFilters: activeQuickFilters.value,
    subjects: selectedSubjects.value,
    grades: selectedGrades.value,
    statuses: selectedStatuses.value,
    dateRange: dateRange.value
  }

  emit('apply-filters', filters)
  handleClose()
}

const handleClose = () => {
  drawerVisible.value = false
}

// 监听外部筛选器变化
watch(() => props.initialFilters, (newFilters) => {
  if (newFilters.quickFilters) activeQuickFilters.value = [...newFilters.quickFilters]
  if (newFilters.subjects) selectedSubjects.value = [...newFilters.subjects]
  if (newFilters.grades) selectedGrades.value = [...newFilters.grades]
  if (newFilters.statuses) selectedStatuses.value = [...newFilters.statuses]
  if (newFilters.dateRange) dateRange.value = [...newFilters.dateRange]
}, { deep: true })
</script>

<style scoped lang="scss">
.course-filter-drawer {
  :deep(.el-drawer__header) {
    margin-bottom: 0;
    padding-bottom: var(--spacing-lg);
    border-bottom: 1px solid var(--edu-border-light);
  }

  :deep(.el-drawer__body) {
    padding: 0;
  }
}

.filter-drawer-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: 0 var(--spacing-lg);
  height: 100%;
  overflow-y: auto;
}

.filter-section {
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-sm);

    .section-title {
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-semibold);
      color: var(--text-primary);
      margin: 0;
    }

    .expand-checkbox {
      font-size: var(--font-size-sm);
    }
  }
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);

  .filter-tag {
    cursor: pointer;
    transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

    &:hover {
      transform: translateY(-1px);
    }
  }
}

.subject-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.subject-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-base);
  border-radius: var(--radius-md);
  border: 1px solid var(--edu-border-light);
  cursor: pointer;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    border-color: var(--edu-primary-300);
    background: rgba(99, 102, 241, 0.04);
  }

  &.active {
    border-color: var(--edu-primary-500);
    background: rgba(99, 102, 241, 0.08);
  }

  .subject-color {
    width: 12px;
    height: 12px;
    border-radius: var(--radius-sm);
    flex-shrink: 0;
  }

  .subject-name {
    flex: 1;
    font-size: var(--font-size-sm);
  }

  .subject-count {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
  }

  .selected-icon {
    color: var(--edu-primary-600);
    font-size: 16px;
  }
}

.expand-btn {
  width: 100%;
  margin-top: var(--spacing-xs);
}

.grade-group,
.status-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);

  :deep(.el-checkbox) {
    margin-right: 0;
  }
}

.status-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);

  .status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;

    &.status-active {
      background: var(--edu-success-500);
    }

    &.status-completed {
      background: var(--edu-primary-500);
    }

    &.status-draft {
      background: var(--edu-warning-500);
    }

    &.status-archived {
      background: var(--edu-text-tertiary);
    }
  }
}

.date-picker {
  width: 100%;
}

.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);

  .active-filter-tag {
    background: var(--edu-primary-100);
    border-color: var(--edu-primary-300);
    color: var(--edu-primary-700);
  }
}

.drawer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg);
  border-top: 1px solid var(--edu-border-light);
  background: var(--edu-bg-tertiary);
}

.filter-summary {
  .summary-text {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);

    strong {
      color: var(--edu-primary-600);
    }
  }
}

.drawer-actions {
  display: flex;
  gap: var(--spacing-sm);
}

// 响应式适配
@media (max-width: 768px) {
  .course-filter-drawer {
    :deep(.el-drawer) {
      width: 100% !important;
    }
  }

  .filter-drawer-content {
    padding: 0 var(--spacing-base);
  }

  .filter-tags {
    .filter-tag {
      font-size: var(--font-size-xs);
    }
  }
}
</style>