<template>
  <div class="dashboard-with-uikit">
    <!-- 顶部统计卡片 -->
    <div class="dashboard-stats">
      <EduDataCard
        v-for="stat in statsData"
        :key="stat.key"
        :title="stat.title"
        :subtitle="stat.subtitle"
        :icon="stat.icon"
        :variant="stat.variant"
        :gradient-type="stat.gradientType"
        :stats="stat.stats"
        :clickable="stat.clickable"
        @click="handleStatClick(stat)"
      />
    </div>

    <!-- 学习数据分析 -->
    <div class="dashboard-section">
      <h2>学习数据分析</h2>
      <div class="section-content">
        <!-- 玻璃态卡片 -->
        <EduDataCard
          title="学习进度"
          subtitle="本周学生学习进度分析"
          :icon="TrendCharts"
          variant="glass"
          size="large"
          :stats="progressStats"
        >
          <template #default>
            <div class="progress-chart">
              <!-- 这里可以放置实际的图表组件 -->
              <div class="chart-placeholder">
                <el-icon><DataAnalysis /></el-icon>
                <span>学习进度图表</span>
              </div>
            </div>
          </template>
        </EduDataCard>

        <!-- 悬浮交互卡片 -->
        <EduDataCard
          title="学生表现"
          subtitle="学生综合表现评估"
          :icon="User"
          variant="hover"
          :tags="['优秀学生', '需要关注', '进步明显']"
          :actions="cardActions"
          @action="handleCardAction"
        >
          <template #default>
            <div class="student-list">
              <div v-for="student in topStudents" :key="student.id" class="student-item">
                <el-avatar :src="student.avatar">{{ student.name[0] }}</el-avatar>
                <div class="student-info">
                  <div class="student-name">{{ student.name }}</div>
                  <div class="student-score">{{ student.score }}分</div>
                </div>
                <el-tag :type="getScoreType(student.score)">{{ getGrade(student.score) }}</el-tag>
              </div>
            </div>
          </template>
        </EduDataCard>
      </div>
    </div>

    <!-- 课程管理 -->
    <div class="dashboard-section">
      <h2>课程管理</h2>
      <div class="section-content">
        <EduDataCard
          v-for="course in courses"
          :key="course.id"
          :title="course.title"
          :subtitle="course.description"
          :icon="course.icon"
          variant="outlined"
          :stats="course.stats"
          clickable
          @click="handleCourseClick(course)"
        >
          <template #footer>
            <el-button type="primary" size="small">编辑课程</el-button>
            <el-button size="small">查看详情</el-button>
          </template>
        </EduDataCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Star,
  Trophy,
  Warning,
  TrendCharts,
  DataAnalysis,
  User,
  Reading,
  Science,
  Monitor
} from '@element-plus/icons-vue'
import { EduDataCard } from '@reopeninnolab/ui-kit'

// 路由
const router = useRouter()

// 统计数据
const statsData = ref([
  {
    key: 'excellent',
    title: '优秀表现',
    subtitle: '基于AI分析的学生优秀表现识别',
    icon: Star,
    variant: 'gradient',
    gradientType: 'primary',
    clickable: true,
    stats: [
      {
        value: 28,
        label: '名学生',
        type: 'primary',
        trend: 'up',
        trendValue: '12%'
      }
    ]
  },
  {
    key: 'completion',
    title: '完成目标',
    subtitle: '本周学习目标完成情况',
    icon: Trophy,
    variant: 'gradient',
    gradientType: 'success',
    clickable: true,
    stats: [
      {
        value: '85%',
        label: '完成率',
        type: 'success',
        trend: 'up',
        trendValue: '5%'
      }
    ]
  },
  {
    key: 'attention',
    title: '需要关注',
    subtitle: '学习进度较慢的学生',
    icon: Warning,
    variant: 'gradient',
    gradientType: 'warning',
    clickable: true,
    stats: [
      {
        value: 12,
        label: '名学生',
        type: 'warning',
        trend: 'down',
        trendValue: '3%'
      }
    ]
  }
])

// 进度统计
const progressStats = ref([
  {
    value: '156',
    label: '活跃学生',
    type: 'primary'
  },
  {
    value: '89%',
    label: '平均完成率',
    type: 'success'
  },
  {
    value: '4.2',
    label: '平均评分',
    type: 'warning'
  }
])

// 顶部学生
const topStudents = ref([
  { id: 1, name: '张小明', score: 98, avatar: '' },
  { id: 2, name: '李小红', score: 95, avatar: '' },
  { id: 3, name: '王小刚', score: 92, avatar: '' },
  { id: 4, name: '刘小美', score: 90, avatar: '' }
])

// 课程数据
const courses = ref([
  {
    id: 1,
    title: '数学基础',
    description: '小学五年级数学基础课程',
    icon: Reading,
    stats: [
      {
        value: 45,
        label: '学生数',
        type: 'primary'
      },
      {
        value: '92%',
        label: '完成率',
        type: 'success'
      }
    ]
  },
  {
    id: 2,
    title: '科学实验',
    description: '趣味科学实验课程',
    icon: Science,
    stats: [
      {
        value: 32,
        label: '学生数',
        type: 'primary'
      },
      {
        value: '88%',
        label: '完成率',
        type: 'success'
      }
    ]
  },
  {
    id: 3,
    title: '互动体验',
    description: '多媒体互动学习体验',
    icon: Monitor,
    stats: [
      {
        value: 58,
        label: '学生数',
        type: 'primary'
      },
      {
        value: '95%',
        label: '完成率',
        type: 'success'
      }
    ]
  }
])

// 卡片操作
const cardActions = ref([
  {
    key: 'refresh',
    label: '刷新数据',
    icon: 'Refresh'
  },
  {
    key: 'export',
    label: '导出报告',
    icon: 'Download'
  },
  {
    key: 'details',
    label: '查看详情',
    icon: 'View'
  }
])

// 方法
const handleStatClick = (stat: any) => {
  console.log('Stat clicked:', stat.key)
  // 跳转到详细页面
  router.push(`/analytics/${stat.key}`)
}

const handleCardAction = (key: string) => {
  console.log('Card action:', key)
  switch (key) {
    case 'refresh':
      // 刷新数据
      break
    case 'export':
      // 导出报告
      break
    case 'details':
      // 查看详情
      break
  }
}

const handleCourseClick = (course: any) => {
  router.push(`/courses/${course.id}`)
}

const getScoreType = (score: number) => {
  if (score >= 90) return 'success'
  if (score >= 80) return 'primary'
  if (score >= 70) return 'warning'
  return 'danger'
}

const getGrade = (score: number) => {
  if (score >= 90) return '优秀'
  if (score >= 80) return '良好'
  if (score >= 70) return '中等'
  return '及格'
}
</script>

<style scoped lang="scss">
.dashboard-with-uikit {
  padding: var(--spacing-lg);
  background: var(--bg-color-page);
  min-height: 100vh;
}

.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.dashboard-section {
  margin-bottom: var(--spacing-xl);

  h2 {
    margin: 0 0 var(--spacing-lg) 0;
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--text-color-primary);
  }

  .section-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: var(--spacing-lg);
  }
}

.progress-chart {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;

  .chart-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--text-color-secondary);

    .el-icon {
      font-size: 48px;
    }
  }
}

.student-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);

  .student-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
    background: var(--bg-color-page);
    border-radius: var(--border-radius-base);

    .student-info {
      flex: 1;

      .student-name {
        font-weight: var(--font-weight-medium);
      }

      .student-score {
        font-size: var(--font-size-sm);
        color: var(--text-color-secondary);
      }
    }
  }
}

@media (max-width: 768px) {
  .dashboard-stats {
    grid-template-columns: 1fr;
  }

  .section-content {
    grid-template-columns: 1fr;
  }
}
</style>