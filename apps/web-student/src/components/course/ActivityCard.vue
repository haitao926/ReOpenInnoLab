<template>
  <el-card
    class="activity-card"
    shadow="hover"
    @click="$emit('open')"
  >
    <div class="activity-header">
      <div class="activity-icon" :class="`activity-type-${$props.activity.type}`">
        <el-icon><component :is="getActivityIcon($props.activity.type)" /></el-icon>
      </div>
      <div class="activity-info">
        <h4 class="activity-title">{{ $props.activity.title }}</h4>
        <p class="activity-description">{{ $props.activity.description }}</p>
      </div>
      <div class="activity-status">
        <el-tag
          :type="getActivityStatusType($props.activity.status)"
          size="small"
        >
          {{ getActivityStatusText($props.activity.status) }}
        </el-tag>
      </div>
    </div>

    <div class="activity-meta">
      <div class="activity-duration">
        <el-icon><Clock /></el-icon>
        <span>预计时长：{{ $props.activity.estimatedDuration }} 分钟</span>
      </div>
      <div class="activity-difficulty">
        <el-icon><TrendCharts /></el-icon>
        <span>难度：{{ getDifficultyText($props.activity.difficulty) }}</span>
      </div>
    </div>

    <div v-if="$props.activity.resources && $props.activity.resources.length > 0" class="activity-resources">
      <h5>相关资源</h5>
      <div class="resource-list">
        <el-tag
          v-for="resource in $props.activity.resources"
          :key="resource.id"
          type="info"
          size="small"
          class="resource-tag"
        >
          {{ resource.name }}
        </el-tag>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import {
  Clock,
  TrendCharts,
  Monitor,
  VideoPlay,
  Document
} from '@element-plus/icons-vue'

interface ActivityResource {
  id: string
  name: string
  type: string
}

interface Activity {
  id: string
  type: 'lab' | 'experience' | 'assignment' | 'quiz'
  title: string
  description: string
  status: 'not-started' | 'in-progress' | 'completed'
  estimatedDuration: number
  difficulty: 'easy' | 'medium' | 'hard'
  resources?: ActivityResource[]
}

interface Props {
  activity: Activity
}

defineProps<Props>()

const emit = defineEmits<{
  open: []
}>()

// 方法
const getActivityIcon = (type: string) => {
  switch (type) {
    case 'lab':
      return Monitor
    case 'experience':
      return VideoPlay
    case 'assignment':
      return Document
    case 'quiz':
      return TrendCharts
    default:
      return Document
  }
}

const getActivityStatusType = (status: string): 'success' | 'primary' | 'info' | 'warning' | 'danger' => {
  switch (status) {
    case 'completed':
      return 'success'
    case 'in-progress':
      return 'primary'
    case 'not-started':
      return 'info'
    default:
      return 'info'
  }
}

const getActivityStatusText = (status: string): string => {
  switch (status) {
    case 'completed':
      return '已完成'
    case 'in-progress':
      return '进行中'
    case 'not-started':
      return '未开始'
    default:
      return '未知'
  }
}

const getDifficultyText = (difficulty: string): string => {
  switch (difficulty) {
    case 'easy':
      return '简单'
    case 'medium':
      return '中等'
    case 'hard':
      return '困难'
    default:
      return '未知'
  }
}
</script>

<style scoped lang="scss">
.activity-card {
  cursor: pointer;
  transition: all var(--edu-duration-normal) var(--edu-easing-smooth);
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-2px);
    border-color: var(--edu-primary-200);
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
  }
}

.activity-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.activity-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  flex-shrink: 0;

  &.activity-type-lab {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }

  &.activity-type-experience {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  &.activity-type-assignment {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }

  &.activity-type-quiz {
    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  }
}

.activity-info {
  flex: 1;
  min-width: 0;
}

.activity-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--edu-text-primary);
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.activity-description {
  font-size: 14px;
  color: var(--edu-text-secondary);
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.activity-status {
  flex-shrink: 0;
}

.activity-meta {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(15, 23, 42, 0.04);
  border-radius: 12px;
}

.activity-duration,
.activity-difficulty {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--edu-text-secondary);

  .el-icon {
    font-size: 14px;
    color: var(--edu-primary-500);
  }
}

.activity-resources {
  border-top: 1px solid rgba(15, 23, 42, 0.08);
  padding-top: 16px;
}

.activity-resources h5 {
  font-size: 14px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin: 0 0 8px 0;
}

.resource-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.resource-tag {
  font-size: 12px;
}

// 响应式设计
@media (max-width: 768px) {
  .activity-header {
    gap: 12px;
    margin-bottom: 12px;
  }

  .activity-icon {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }

  .activity-title {
    font-size: 16px;
  }

  .activity-description {
    font-size: 13px;
  }

  .activity-meta {
    flex-direction: column;
    gap: 8px;
    padding: 10px;
  }

  .activity-duration,
  .activity-difficulty {
    font-size: 12px;
  }

  .resource-list {
    gap: 6px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .activity-card {
    transition: none;
  }

  .activity-card:hover {
    transform: none;
  }
}
</style>