<template>
  <el-card
    :class="['course-entry-card', { 'is-active': active }]"
    @click="$emit('click')"
  >
    <div class="course-entry-content">
      <div class="course-header">
        <div class="course-title-section">
          <h4>{{ course.title }}</h4>
          <div class="course-meta">
            <el-tag :type="getSubjectVariant(course.subject)" size="small">
              {{ getSubjectName(course.subject) }}
            </el-tag>
            <span class="course-time">{{ course.schedule }}</span>
          </div>
        </div>
        <div class="course-status">
          <div class="status-indicator" :class="courseStatus">
            <el-icon><component :is="statusIcon" /></el-icon>
          </div>
        </div>
      </div>

      <div class="course-info">
        <p class="teacher-message">{{ course.teacherMessage }}</p>
        <div class="task-summary">
          <span class="task-count">今日任务：{{ course.taskCount }} 个</span>
          <el-progress
            :percentage="course.progress"
            :stroke-width="6"
            :show-text="false"
          />
        </div>
      </div>

      <div class="course-actions">
        <el-button
          :type="active ? 'primary' : 'default'"
          size="small"
          :disabled="!courseActive"
          @click.stop="$emit('enter-course')"
        >
          {{ getButtonText() }}
        </el-button>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  VideoPlay,
  Clock,
  Check,
  Lock
} from '@element-plus/icons-vue'

interface Course {
  id: string
  title: string
  description: string
  className: string
  subject: string
  schedule: string
  teacherMessage: string
  taskCount: number
  progress: number
  active: boolean
}

interface Props {
  course: Course
  active?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  active: false
})

const emit = defineEmits<{
  click: []
  'enter-course': []
}>()

// 计算属性
const courseStatus = computed(() => {
  if (!props.course.active) return 'inactive'
  if (props.course.progress === 100) return 'completed'
  if (props.course.progress > 0) return 'in-progress'
  return 'not-started'
})

const statusIcon = computed(() => {
  switch (courseStatus.value) {
    case 'inactive':
      return Lock
    case 'completed':
      return Check
    case 'in-progress':
      return VideoPlay
    case 'not-started':
      return Clock
    default:
      return Clock
  }
})

const courseActive = computed(() => {
  return props.course.active
})

// 方法
const getSubjectName = (subject: string): string => {
  const map: Record<string, string> = {
    ai: '人工智能',
    it: '信息技术',
    'data-science': '数据科学',
    robotics: '智能机器人',
    maker: '创客实践'
  }
  return map[subject] || '综合'
}

const getSubjectVariant = (subject: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' | 'default' => {
  const variants: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
    ai: 'primary',
    it: 'info',
    'data-science': 'success',
    robotics: 'warning',
    maker: 'danger'
  }
  return variants[subject] || 'default'
}

const getButtonText = (): string => {
  if (!props.course.active) return '等待开课'
  if (props.course.progress === 100) return '复习课程'
  if (props.active) return '继续学习'
  return '进入课程'
}
</script>

<style scoped lang="scss">
.course-entry-card {
  background: var(--fs-bg-glass);
  backdrop-filter: var(--fs-glass-backdrop);
  border: 1px solid var(--fs-border-primary);
  border-radius: var(--fs-radius-2xl);
  transition: var(--fs-transition-base);
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--fs-shadow-xl);
    border-color: var(--fs-border-secondary);
    background: var(--fs-bg-glass-hover);
  }

  &.is-active {
    border-color: var(--fs-primary-500);
    background: var(--fs-gradient-primary);
    background-size: 200% 200%;
    animation: fs-gradient-shift 3s ease infinite;

    .course-title-section h4 {
      color: white;
    }

    .course-time {
      color: rgba(255, 255, 255, 0.9);
    }

    .teacher-message {
      color: rgba(255, 255, 255, 0.85);
    }

    .task-count {
      color: rgba(255, 255, 255, 0.9);
    }
  }

  :deep(.el-card__body) {
    padding: 0;
  }
}

.course-entry-content {
  display: flex;
  flex-direction: column;
  gap: var(--fs-spacing-4);
  padding: var(--fs-spacing-5);
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--fs-spacing-4);
}

.course-title-section {
  flex: 1;
  min-width: 0;
}

.course-title-section h4 {
  font-size: var(--fs-text-lg);
  font-weight: var(--fs-font-weight-bold);
  color: var(--fs-text-primary);
  margin: 0 0 var(--fs-spacing-2) 0;
  line-height: var(--fs-line-height-snug);
}

.course-meta {
  display: flex;
  align-items: center;
  gap: var(--fs-spacing-3);
  flex-wrap: wrap;
}

.course-time {
  font-size: var(--fs-text-sm);
  color: var(--fs-text-secondary);
  font-weight: var(--fs-font-weight-medium);
}

.course-status {
  flex-shrink: 0;
}

.status-indicator {
  width: 36px;
  height: 36px;
  border-radius: var(--fs-radius-lg);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: var(--fs-text-base);
  box-shadow: var(--fs-shadow-sm);

  &.inactive {
    background: var(--fs-text-tertiary);
  }

  &.completed {
    background: var(--fs-gradient-success);
  }

  &.in-progress {
    background: var(--fs-gradient-primary);
  }

  &.not-started {
    background: var(--fs-gradient-warning);
  }
}

.course-info {
  display: flex;
  flex-direction: column;
  gap: var(--fs-spacing-3);
}

.teacher-message {
  font-size: var(--fs-text-sm);
  color: var(--fs-text-secondary);
  line-height: var(--fs-line-height-normal);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-summary {
  display: flex;
  flex-direction: column;
  gap: var(--fs-spacing-2);
}

.task-count {
  font-size: var(--fs-text-sm);
  color: var(--fs-text-secondary);
  font-weight: var(--fs-font-weight-medium);
}

.course-actions {
  display: flex;
  justify-content: flex-end;
}

// 响应式设计
@media (max-width: 768px) {
  .course-entry-content {
    padding: var(--fs-spacing-4);
    gap: var(--fs-spacing-3);
  }

  .course-header {
    gap: var(--fs-spacing-3);
  }

  .course-title-section h4 {
    font-size: var(--fs-text-base);
  }

  .status-indicator {
    width: 32px;
    height: 32px;
    font-size: var(--fs-text-sm);
  }

  .course-meta {
    gap: var(--fs-spacing-2);
  }

  .course-time {
    font-size: var(--fs-text-xs);
  }

  .teacher-message {
    font-size: var(--fs-text-xs);
  }
}

@media (prefers-reduced-motion: reduce) {
  .course-entry-card {
    transition: none;

    &:hover {
      transform: none;
    }

    &.is-active {
      animation: none;
    }
  }
}
</style>