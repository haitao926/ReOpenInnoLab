<template>
  <aside class="management-sidebar-right">
    <!-- 数据洞察区块 -->
    <SidebarSection
      v-if="hasSection(RightSidebarSection.INSIGHTS)"
      :title="getSectionTitle(RightSidebarSection.INSIGHTS)"
      :icon="getSectionIcon(RightSidebarSection.INSIGHTS)"
      :collapsible="getSectionConfig(RightSidebarSection.INSIGHTS).collapsible"
      :default-collapsed="getSectionConfig(RightSidebarSection.INSIGHTS).defaultCollapsed"
    >
      <template #content>
        <slot name="insights" :data="getSectionData(RightSidebarSection.INSIGHTS)">
          <div class="insights-list">
            <div v-for="insight in defaultInsights" :key="insight.id" class="insight-item">
              <div class="insight-icon" :style="{ backgroundColor: insight.color }">
                <el-icon><component :is="insight.icon" /></el-icon>
              </div>
              <div class="insight-content">
                <div class="insight-title">{{ insight.title }}</div>
                <div class="insight-value">{{ insight.value }}</div>
                <div class="insight-change" :class="insight.trend">
                  <el-icon><component :is="insight.trend === 'up' ? 'CaretTop' : 'CaretBottom'" /></el-icon>
                  {{ insight.change }}
                </div>
              </div>
            </div>
          </div>
        </slot>
      </template>
    </SidebarSection>

    <!-- 资源参考区块 -->
    <SidebarSection
      v-if="hasSection(RightSidebarSection.RESOURCES)"
      :title="getSectionTitle(RightSidebarSection.RESOURCES)"
      :icon="getSectionIcon(RightSidebarSection.RESOURCES)"
      :collapsible="getSectionConfig(RightSidebarSection.RESOURCES).collapsible"
      :default-collapsed="getSectionConfig(RightSidebarSection.RESOURCES).defaultCollapsed"
    >
      <template #content>
        <slot name="resources" :data="getSectionData(RightSidebarSection.RESOURCES)">
          <div class="resource-list">
            <div v-for="resource in defaultResources" :key="resource.id" class="resource-item">
              <div class="resource-icon">
                <el-icon><component :is="resource.icon" /></el-icon>
              </div>
              <div class="resource-content">
                <div class="resource-title">{{ resource.title }}</div>
                <div class="resource-desc">{{ resource.description }}</div>
              </div>
              <el-button
                type="text"
                size="small"
                @click="$emit('resource-action', 'open', resource.id)"
              >
                打开
              </el-button>
            </div>
          </div>
        </slot>
      </template>
    </SidebarSection>

    <!-- 协作记录区块 -->
    <SidebarSection
      v-if="hasSection(RightSidebarSection.COLLABORATION)"
      :title="getSectionTitle(RightSidebarSection.COLLABORATION)"
      :icon="getSectionIcon(RightSidebarSection.COLLABORATION)"
      :collapsible="getSectionConfig(RightSidebarSection.COLLABORATION).collapsible"
      :default-collapsed="getSectionConfig(RightSidebarSection.COLLABORATION).defaultCollapsed"
    >
      <template #content>
        <slot name="collaboration" :data="getSectionData(RightSidebarSection.COLLABORATION)">
          <div class="collaboration-list">
            <div v-for="item in defaultCollaboration" :key="item.id" class="collaboration-item">
              <el-avatar :size="32" :src="item.avatar">{{ item.name.charAt(0) }}</el-avatar>
              <div class="collaboration-content">
                <div class="collaboration-title">{{ item.name }}</div>
                <div class="collaboration-action">{{ item.action }}</div>
                <div class="collaboration-time">{{ item.time }}</div>
              </div>
            </div>
          </div>
        </slot>
      </template>
    </SidebarSection>

    </aside>
</template>

<script setup lang="ts">
import { Document, VideoPlay, DataAnalysis, User, TrendCharts, CaretTop, CaretBottom } from '@element-plus/icons-vue'
import SidebarSection from './SidebarSection.vue'
import {
  RightSidebarSection,
  type RightSidebarSectionConfig,
  RIGHT_SIDEBAR_DEFAULTS
} from '@/constants/managementSidebar'

interface Props {
  sections?: RightSidebarSectionConfig[]
}

const props = withDefaults(defineProps<Props>(), {
  sections: () => []
})

const emit = defineEmits<{
  'resource-action': [action: string, id: string | number]
  'collaboration-action': [action: string, data: any]
}>()

// 检查是否有指定区块
const hasSection = (type: RightSidebarSection) => {
  return props.sections.some(section => section.type === type)
}

// 获取区块配置
const getSectionConfig = (type: RightSidebarSection) => {
  const section = props.sections.find(s => s.type === type)
  return {
    ...RIGHT_SIDEBAR_DEFAULTS[type],
    ...section
  }
}

// 获取区块标题
const getSectionTitle = (type: RightSidebarSection) => {
  return getSectionConfig(type).title
}

// 获取区块图标
const getSectionIcon = (type: RightSidebarSection) => {
  return getSectionConfig(type).icon
}

// 获取区块数据
const getSectionData = (type: RightSidebarSection) => {
  const section = props.sections.find(s => s.type === type)
  return section?.data
}

// 默认数据
const defaultInsights = [
  {
    id: 1,
    title: '本月课程',
    value: '12',
    change: '+2',
    trend: 'up',
    icon: 'Reading',
    color: '#1890ff'
  },
  {
    id: 2,
    title: '学生人数',
    value: '156',
    change: '+8',
    trend: 'up',
    icon: 'User',
    color: '#52c41a'
  },
  {
    id: 3,
    title: '完成率',
    value: '89%',
    change: '+5%',
    trend: 'up',
    icon: 'TrendCharts',
    color: '#722ed1'
  }
]

const defaultResources = [
  {
    id: 1,
    title: '教学指南',
    description: '查看最新教学方法和技巧',
    icon: 'Document'
  },
  {
    id: 2,
    title: '视频教程',
    description: '观看操作演示视频',
    icon: 'VideoPlay'
  },
  {
    id: 3,
    title: '数据分析',
    description: '学生成绩分析报告',
    icon: 'DataAnalysis'
  }
]

const defaultCollaboration = [
  {
    id: 1,
    name: '张老师',
    action: '评论了您的课程计划',
    time: '10分钟前',
    avatar: ''
  },
  {
    id: 2,
    name: '李老师',
    action: '分享了新的教学资源',
    time: '1小时前',
    avatar: ''
  },
  {
    id: 3,
    name: '王老师',
    action: '请求协作批改作业',
    time: '2小时前',
    avatar: ''
  }
]
</script>

<style scoped lang="scss">
.management-sidebar-right {
  display: flex;
  flex-direction: column;
  gap: var(--density-gap-base, 16px);
  height: 100%;
}

// 数据洞察样式
.insights-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.insight-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: var(--density-radius-base, 8px);
  background: var(--edu-bg-secondary);
  transition: all 0.2s ease;

  &:hover {
    background: var(--edu-bg-tertiary);
    transform: translateY(-1px);
  }
}

.insight-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--density-radius-base, 8px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  flex-shrink: 0;
}

.insight-content {
  flex: 1;
  min-width: 0;
}

.insight-title {
  font-weight: var(--font-weight-medium);
  color: var(--edu-text-secondary);
  margin-bottom: 2px;
  font-size: var(--density-font-size-xs, 12px);
}

.insight-value {
  font-weight: var(--font-weight-bold);
  color: var(--edu-text-primary);
  margin-bottom: 2px;
  font-size: var(--density-font-size-lg, 18px);
}

.insight-change {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: var(--density-font-size-xs, 12px);

  &.up {
    color: var(--edu-success-500);
  }

  &.down {
    color: var(--edu-danger-500);
  }
}

// 资源列表样式
.resource-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: var(--density-radius-base, 8px);
  background: var(--edu-bg-secondary);
  transition: all 0.2s ease;

  &:hover {
    background: var(--edu-bg-tertiary);
    transform: translateY(-1px);
  }
}

.resource-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--density-radius-base, 8px);
  background: var(--edu-primary-50);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--edu-primary-500);
  font-size: 18px;
  flex-shrink: 0;
}

.resource-content {
  flex: 1;
  min-width: 0;
}

.resource-title {
  font-weight: var(--font-weight-medium);
  color: var(--edu-text-primary);
  margin-bottom: 2px;
}

.resource-desc {
  font-size: var(--density-font-size-sm, 14px);
  color: var(--edu-text-secondary);
  line-height: 1.4;
}

// 协作记录样式
.collaboration-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.collaboration-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 0;
}

.collaboration-content {
  flex: 1;
  min-width: 0;
}

.collaboration-title {
  font-weight: var(--font-weight-medium);
  color: var(--edu-text-primary);
  margin-bottom: 2px;
}

.collaboration-action {
  font-size: var(--density-font-size-sm, 14px);
  color: var(--edu-text-secondary);
  margin-bottom: 2px;
}

.collaboration-time {
  font-size: var(--density-font-size-xs, 12px);
  color: var(--edu-text-tertiary);
}


// 紧凑模式适配
[data-density="compact"] {
  .management-sidebar-right {
    gap: var(--density-gap-sm, 8px);
  }

  .insight-item {
    padding: 8px;
  }

  .insight-icon {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }

  .resource-item {
    padding: 8px;
  }

  .resource-icon {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }

  .collaboration-item {
    gap: 8px;
  }
}

// 深色模式适配
[data-theme="dark"] {
  .insight-item,
  .resource-item {
    background: var(--edu-bg-secondary-dark);

    &:hover {
      background: var(--edu-bg-tertiary-dark);
    }
  }

  .resource-icon {
    background: var(--edu-primary-900);
  }
}
</style>
