<template>
  <StudentCourseLayout>
    <div class="assignments-list">
      <div class="page-header">
        <h2>作业列表</h2>
        <p>查看和提交您的课程作业</p>
      </div>

      <div class="assignments-content">
        <div class="assignments-grid">
          <EduCard
            v-for="assignment in assignments"
            :key="assignment.id"
            variant="elevated"
            class="assignment-card"
            @click="viewAssignment(assignment)"
          >
            <div class="assignment-header">
              <div class="assignment-icon" :class="getAssignmentTypeClass(assignment.type)">
                <el-icon><component :is="getAssignmentIcon(assignment.type)" /></el-icon>
              </div>
              <div class="assignment-info">
                <h3>{{ assignment.title }}</h3>
                <p>{{ assignment.courseTitle }}</p>
              </div>
              <div class="assignment-status">
                <EduTag :variant="getStatusVariant(assignment.status)" size="xs">
                  {{ getStatusText(assignment.status) }}
                </EduTag>
              </div>
            </div>

            <div class="assignment-meta">
              <div class="meta-item">
                <el-icon><Clock /></el-icon>
                <span>截止时间：{{ formatDate(assignment.dueDate) }}</span>
              </div>
              <div class="meta-item">
                <el-icon><Document /></el-icon>
                <span>分数：{{ assignment.score || '未评分' }}</span>
              </div>
            </div>
          </EduCard>
        </div>
      </div>
    </div>
  </StudentCourseLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Clock, Document, EditPen, VideoPlay, Monitor } from '@element-plus/icons-vue'
import StudentCourseLayout from '@/components/layout/StudentCourseLayout.vue'
import EduCard from '@reopeninnolab/ui-kit'
import EduTag from '@reopeninnolab/ui-kit'

const router = useRouter()

interface Assignment {
  id: string
  title: string
  courseTitle: string
  type: 'homework' | 'quiz' | 'lab' | 'project'
  status: 'pending' | 'submitted' | 'graded' | 'overdue'
  dueDate: string
  score?: number
  description: string
}

const assignments = ref<Assignment[]>([
  {
    id: '1',
    title: 'Python变量练习',
    courseTitle: 'AI创意编程',
    type: 'homework',
    status: 'submitted',
    dueDate: '2024-01-20T23:59:59',
    score: 85,
    description: '完成Python变量和数据类型的练习题'
  },
  {
    id: '2',
    title: '控制结构测验',
    courseTitle: 'AI创意编程',
    type: 'quiz',
    status: 'pending',
    dueDate: '2024-01-25T23:59:59',
    description: '关于条件语句和循环的在线测验'
  },
  {
    id: '3',
    title: '数据分析实验',
    courseTitle: 'AI数据洞察',
    type: 'lab',
    status: 'overdue',
    dueDate: '2024-01-15T23:59:59',
    description: '使用Jupyter Notebook完成数据分析任务'
  }
])

const getAssignmentIcon = (type: string) => {
  switch (type) {
    case 'homework':
      return EditPen
    case 'quiz':
      return Document
    case 'lab':
      return Monitor
    case 'project':
      return VideoPlay
    default:
      return Document
  }
}

const getAssignmentTypeClass = (type: string) => {
  switch (type) {
    case 'homework':
      return 'type-homework'
    case 'quiz':
      return 'type-quiz'
    case 'lab':
      return 'type-lab'
    case 'project':
      return 'type-project'
    default:
      return 'type-default'
  }
}

const getStatusVariant = (status: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' | 'default' => {
  switch (status) {
    case 'graded':
      return 'success'
    case 'submitted':
      return 'info'
    case 'overdue':
      return 'danger'
    case 'pending':
      return 'warning'
    default:
      return 'default'
  }
}

const getStatusText = (status: string): string => {
  switch (status) {
    case 'graded':
      return '已评分'
    case 'submitted':
      return '已提交'
    case 'overdue':
      return '已逾期'
    case 'pending':
      return '待提交'
    default:
      return '未知'
  }
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const viewAssignment = (assignment: Assignment) => {
  router.push(`/assignments/${assignment.id}/submit`)
}

onMounted(() => {
  // 这里可以加载作业数据
})
</script>

<style scoped lang="scss">
.assignments-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  text-align: center;
}

.page-header h2 {
  font-size: 28px;
  font-weight: 700;
  color: var(--edu-text-primary);
  margin: 0 0 8px 0;
}

.page-header p {
  font-size: 16px;
  color: var(--edu-text-secondary);
  margin: 0;
}

.assignments-content {
  margin-top: 20px;
}

.assignments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.assignment-card {
  cursor: pointer;
  transition: all var(--edu-duration-normal) var(--edu-easing-smooth);
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-2px);
    border-color: var(--edu-primary-200);
    box-shadow: 0 8px 25px rgba(15, 23, 42, 0.12);
  }
}

.assignment-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.assignment-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  flex-shrink: 0;

  &.type-homework {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }

  &.type-quiz {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  &.type-lab {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }

  &.type-project {
    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  }
}

.assignment-info {
  flex: 1;
  min-width: 0;
}

.assignment-info h3 {
  font-size: 18px;
  font-weight: 700;
  color: var(--edu-text-primary);
  margin: 0 0 4px 0;
  line-height: 1.4;
}

.assignment-info p {
  font-size: 14px;
  color: var(--edu-text-secondary);
  margin: 0;
}

.assignment-status {
  flex-shrink: 0;
}

.assignment-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: rgba(15, 23, 42, 0.04);
  border-radius: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--edu-text-secondary);

  .el-icon {
    font-size: 14px;
    color: var(--edu-primary-500);
  }
}

@media (max-width: 768px) {
  .assignments-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .assignment-header {
    gap: 12px;
  }

  .assignment-icon {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }

  .assignment-info h3 {
    font-size: 16px;
  }

  .assignment-info p {
    font-size: 13px;
  }
}
</style>