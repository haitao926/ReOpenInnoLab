<template>
  <aside class="management-sidebar-left">
    <!-- 筛选器区块 -->
    <SidebarSection
      v-if="hasSection(LeftSidebarSection.FILTERS)"
      :title="getSectionTitle(LeftSidebarSection.FILTERS)"
      :icon="getSectionIcon(LeftSidebarSection.FILTERS)"
      :collapsible="getSectionConfig(LeftSidebarSection.FILTERS).collapsible"
      :default-collapsed="getSectionConfig(LeftSidebarSection.FILTERS).defaultCollapsed"
    >
      <template #content>
        <slot name="filters" :data="getSectionData(LeftSidebarSection.FILTERS)">
          <div class="default-filters">
            <el-select
              v-model="localFilters.subject"
              placeholder="选择学科"
              clearable
              size="small"
              style="width: 100%; margin-bottom: 12px;"
            >
              <el-option
                v-for="subject in subjectOptions"
                :key="subject.value"
                :label="subject.label"
                :value="subject.value"
              />
            </el-select>

            <el-select
              v-model="localFilters.status"
              placeholder="状态"
              clearable
              size="small"
              style="width: 100%; margin-bottom: 12px;"
            >
              <el-option label="全部" value="" />
              <el-option label="进行中" value="active" />
              <el-option label="已完成" value="completed" />
              <el-option label="已归档" value="archived" />
            </el-select>

            <el-date-picker
              v-model="localFilters.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              size="small"
              style="width: 100%;"
            />
          </div>
        </slot>
      </template>
    </SidebarSection>

    <!-- 快捷操作区块 -->
    <SidebarSection
      v-if="hasSection(LeftSidebarSection.QUICK_ACTIONS)"
      :title="getSectionTitle(LeftSidebarSection.QUICK_ACTIONS)"
      :icon="getSectionIcon(LeftSidebarSection.QUICK_ACTIONS)"
      :collapsible="getSectionConfig(LeftSidebarSection.QUICK_ACTIONS).collapsible"
      :default-collapsed="getSectionConfig(LeftSidebarSection.QUICK_ACTIONS).defaultCollapsed"
    >
      <template #content>
        <slot name="quick-actions" :data="getSectionData(LeftSidebarSection.QUICK_ACTIONS)">
          <div class="quick-actions">
            <el-button
              type="primary"
              size="small"
              style="width: 100%; margin-bottom: 8px;"
              @click="$emit('quick-action', 'create')"
            >
              <el-icon><Plus /></el-icon>
              新建
            </el-button>
            <el-button
              type="default"
              size="small"
              style="width: 100%; margin-bottom: 8px;"
              @click="$emit('quick-action', 'import')"
            >
              <el-icon><Upload /></el-icon>
              导入
            </el-button>
            <el-button
              type="default"
              size="small"
              style="width: 100%;"
              @click="$emit('quick-action', 'export')"
            >
              <el-icon><Download /></el-icon>
              导出
            </el-button>
          </div>
        </slot>
      </template>
    </SidebarSection>

    <!-- 教学动态区块 -->
    <SidebarSection
      v-if="hasSection(LeftSidebarSection.ACTIVITY)"
      :title="getSectionTitle(LeftSidebarSection.ACTIVITY)"
      :icon="getSectionIcon(LeftSidebarSection.ACTIVITY)"
      :collapsible="getSectionConfig(LeftSidebarSection.ACTIVITY).collapsible"
      :default-collapsed="getSectionConfig(LeftSidebarSection.ACTIVITY).defaultCollapsed"
    >
      <template #content>
        <slot name="activity" :data="getSectionData(LeftSidebarSection.ACTIVITY)">
          <div class="activity-feed">
            <div v-for="item in defaultActivity" :key="item.id" class="activity-item">
              <div class="activity-dot" :class="item.type"></div>
              <div class="activity-content">
                <div class="activity-title">{{ item.title }}</div>
                <div class="activity-time">{{ item.time }}</div>
              </div>
            </div>
          </div>
        </slot>
      </template>
    </SidebarSection>

    <!-- 模板区块 -->
    <SidebarSection
      v-if="hasSection(LeftSidebarSection.TEMPLATES)"
      :title="getSectionTitle(LeftSidebarSection.TEMPLATES)"
      :icon="getSectionIcon(LeftSidebarSection.TEMPLATES)"
      :collapsible="getSectionConfig(LeftSidebarSection.TEMPLATES).collapsible"
      :default-collapsed="getSectionConfig(LeftSidebarSection.TEMPLATES).defaultCollapsed"
    >
      <template #content>
        <slot name="templates" :data="getSectionData(LeftSidebarSection.TEMPLATES)">
          <div class="template-list">
            <div v-for="template in defaultTemplates" :key="template.id" class="template-item">
              <el-icon><Document /></el-icon>
              <span>{{ template.name }}</span>
            </div>
          </div>
        </slot>
      </template>
    </SidebarSection>

    <!-- 分类区块 -->
    <SidebarSection
      v-if="hasSection(LeftSidebarSection.CATEGORIES)"
      :title="getSectionTitle(LeftSidebarSection.CATEGORIES)"
      :icon="getSectionIcon(LeftSidebarSection.CATEGORIES)"
      :collapsible="getSectionConfig(LeftSidebarSection.CATEGORIES).collapsible"
      :default-collapsed="getSectionConfig(LeftSidebarSection.CATEGORIES).defaultCollapsed"
    >
      <template #content>
        <slot name="categories" :data="getSectionData(LeftSidebarSection.CATEGORIES)">
          <div class="category-list">
            <div v-for="category in defaultCategories" :key="category.id" class="category-item">
              <el-icon><Folder /></el-icon>
              <span>{{ category.name }}</span>
              <span class="category-count">({{ category.count }})</span>
            </div>
          </div>
        </slot>
      </template>
    </SidebarSection>

    <!-- 最近使用区块 -->
    <SidebarSection
      v-if="hasSection(LeftSidebarSection.RECENT)"
      :title="getSectionTitle(LeftSidebarSection.RECENT)"
      :icon="getSectionIcon(LeftSidebarSection.RECENT)"
      :collapsible="getSectionConfig(LeftSidebarSection.RECENT).collapsible"
      :default-collapsed="getSectionConfig(LeftSidebarSection.RECENT).defaultCollapsed"
    >
      <template #content>
        <slot name="recent" :data="getSectionData(LeftSidebarSection.RECENT)">
          <div class="recent-list">
            <div v-for="item in defaultRecent" :key="item.id" class="recent-item">
              <el-icon><Clock /></el-icon>
              <span>{{ item.name }}</span>
              <span class="recent-time">{{ item.time }}</span>
            </div>
          </div>
        </slot>
      </template>
    </SidebarSection>

    <!-- 通知区块 -->
    <SidebarSection
      v-if="hasSection(LeftSidebarSection.NOTIFICATIONS)"
      :title="getSectionTitle(LeftSidebarSection.NOTIFICATIONS)"
      :icon="getSectionIcon(LeftSidebarSection.NOTIFICATIONS)"
      :collapsible="getSectionConfig(LeftSidebarSection.NOTIFICATIONS).collapsible"
      :default-collapsed="getSectionConfig(LeftSidebarSection.NOTIFICATIONS).defaultCollapsed"
    >
      <template #content>
        <slot name="notifications" :data="getSectionData(LeftSidebarSection.NOTIFICATIONS)">
          <div class="notification-list">
            <div v-for="notification in defaultNotifications" :key="notification.id" class="notification-item">
              <div class="notification-dot" :class="notification.type"></div>
              <div class="notification-content">
                <div class="notification-title">{{ notification.title }}</div>
                <div class="notification-time">{{ notification.time }}</div>
              </div>
            </div>
          </div>
        </slot>
      </template>
    </SidebarSection>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Plus, Upload, Download, Document, Folder, Clock } from '@element-plus/icons-vue'
import SidebarSection from './SidebarSection.vue'
import {
  LeftSidebarSection,
  type LeftSidebarSectionConfig,
  LEFT_SIDEBAR_DEFAULTS
} from '@/constants/managementSidebar'

interface Filters {
  subject?: string
  status?: string
  dateRange?: [Date, Date] | null
}

interface Props {
  sections?: LeftSidebarSectionConfig[]
  subjectOptions?: Array<{ label: string; value: string }>
  initialFilters?: Filters
}

const props = withDefaults(defineProps<Props>(), {
  sections: () => [],
  subjectOptions: () => [
    { label: '数学', value: 'math' },
    { label: '语文', value: 'chinese' },
    { label: '英语', value: 'english' },
    { label: '物理', value: 'physics' },
    { label: '化学', value: 'chemistry' },
    { label: '生物', value: 'biology' }
  ],
  initialFilters: () => ({})
})

const emit = defineEmits<{
  'quick-action': [action: string]
  'filter-change': [filters: Filters]
}>()

// 本地筛选器状态
const localFilters = ref<Filters>({
  subject: props.initialFilters.subject || '',
  status: props.initialFilters.status || '',
  dateRange: props.initialFilters.dateRange || null
})

// 监听筛选器变化
watch(localFilters, (newFilters) => {
  emit('filter-change', newFilters)
}, { deep: true })

// 检查是否有指定区块
const hasSection = (type: LeftSidebarSection) => {
  return props.sections.some(section => section.type === type)
}

// 获取区块配置
const getSectionConfig = (type: LeftSidebarSection) => {
  const section = props.sections.find(s => s.type === type)
  return {
    ...LEFT_SIDEBAR_DEFAULTS[type],
    ...section
  }
}

// 获取区块标题
const getSectionTitle = (type: LeftSidebarSection) => {
  return getSectionConfig(type).title
}

// 获取区块图标
const getSectionIcon = (type: LeftSidebarSection) => {
  return getSectionConfig(type).icon
}

// 获取区块数据
const getSectionData = (type: LeftSidebarSection) => {
  const section = props.sections.find(s => s.type === type)
  return section?.data
}

// 默认数据
const defaultActivity = [
  { id: 1, title: '张三提交了作业', time: '2分钟前', type: 'info' },
  { id: 2, title: '新课程发布成功', time: '1小时前', type: 'success' },
  { id: 3, title: '实验报告待批改', time: '3小时前', type: 'warning' }
]

const defaultTemplates = [
  { id: 1, name: '课程计划模板' },
  { id: 2, name: '作业评分模板' },
  { id: 3, name: '实验报告模板' }
]

const defaultCategories = [
  { id: 1, name: '必修课程', count: 12 },
  { id: 2, name: '选修课程', count: 8 },
  { id: 3, name: '实验课程', count: 6 }
]

const defaultRecent = [
  { id: 1, name: '高等数学', time: '昨天' },
  { id: 2, name: '物理实验', time: '3天前' },
  { id: 3, name: '英语作文', time: '一周前' }
]

const defaultNotifications = [
  { id: 1, title: '系统维护通知', time: '1小时前', type: 'info' },
  { id: 2, title: '新功能上线', time: '1天前', type: 'success' },
  { id: 3, title: '作业截止提醒', time: '2天前', type: 'warning' }
]
</script>

<style scoped lang="scss">
.management-sidebar-left {
  display: flex;
  flex-direction: column;
  gap: var(--density-gap-base, 16px);
  height: 100%;
}

.default-filters {
  display: flex;
  flex-direction: column;
}

.quick-actions {
  display: flex;
  flex-direction: column;
}

.activity-feed {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 0;
}

.activity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;

  &.info {
    background-color: var(--edu-primary-500);
  }

  &.success {
    background-color: var(--edu-success-500);
  }

  &.warning {
    background-color: var(--edu-warning-500);
  }
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-title {
  font-size: var(--density-font-size-sm, 14px);
  color: var(--edu-text-primary);
  margin-bottom: 2px;
}

.activity-time {
  font-size: var(--density-font-size-xs, 12px);
  color: var(--edu-text-secondary);
}

.template-list,
.category-list,
.recent-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.template-item,
.category-item,
.recent-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: var(--density-radius-base, 6px);
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--edu-bg-secondary);
  }

  span {
    font-size: var(--density-font-size-sm, 14px);
    color: var(--edu-text-primary);
  }
}

.category-count,
.recent-time {
  margin-left: auto;
  font-size: var(--density-font-size-xs, 12px);
  color: var(--edu-text-secondary);
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 0;
}

.notification-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;

  &.info {
    background-color: var(--edu-primary-500);
  }

  &.success {
    background-color: var(--edu-success-500);
  }

  &.warning {
    background-color: var(--edu-warning-500);
  }
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: var(--density-font-size-sm, 14px);
  color: var(--edu-text-primary);
  margin-bottom: 2px;
}

.notification-time {
  font-size: var(--density-font-size-xs, 12px);
  color: var(--edu-text-secondary);
}

// 紧凑模式适配
[data-density="compact"] {
  .management-sidebar-left {
    gap: var(--density-gap-sm, 8px);
  }

  .activity-item,
  .notification-item {
    padding: 6px 0;
  }

  .template-item,
  .category-item,
  .recent-item {
    padding: 6px 8px;
  }
}
</style>