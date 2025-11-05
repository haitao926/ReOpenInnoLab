<template>
  <div class="learning-progress-chart">
    <div class="chart-header">
      <h3 class="chart-title">{{ title }}</h3>
      <div class="chart-controls">
        <el-select
          v-model="selectedClass"
          size="small"
          @change="handleClassChange"
        >
          <el-option
            v-for="cls in classes"
            :key="cls.id"
            :label="cls.name"
            :value="cls.id"
          />
        </el-select>
        <el-select
          v-model="selectedSubject"
          size="small"
          @change="handleSubjectChange"
        >
          <el-option
            v-for="subject in subjects"
            :key="subject.value"
            :label="subject.label"
            :value="subject.value"
          />
        </el-select>
      </div>
    </div>

    <div class="chart-container">
      <v-chart
        ref="chartRef"
        :option="chartOption"
        :loading="loading"
        class="chart"
        autoresize
        @click="handleChartClick"
      />
    </div>

    <!-- 学习进度统计 -->
    <div class="progress-summary">
      <div class="summary-item">
        <div class="summary-icon" style="background: #52C41A;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <div class="summary-content">
          <div class="summary-value">{{ completionRate }}%</div>
          <div class="summary-label">完成率</div>
        </div>
      </div>

      <div class="summary-item">
        <div class="summary-icon" style="background: #1890FF;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <polyline points="17 5 12 10 7 5"/>
            <polyline points="17 19 12 14 7 19"/>
          </svg>
        </div>
        <div class="summary-content">
          <div class="summary-value">{{ averageScore }}分</div>
          <div class="summary-label">平均分</div>
        </div>
      </div>

      <div class="summary-item">
        <div class="summary-icon" style="background: #FAAD14;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div class="summary-content">
          <div class="summary-value">{{ studyTime }}h</div>
          <div class="summary-label">学习时长</div>
        </div>
      </div>
    </div>

    <!-- 学生详情列表 -->
    <div class="student-details">
      <div class="details-header">
        <h4>学生学习详情</h4>
        <el-input
          v-model="searchQuery"
          size="small"
          placeholder="搜索学生姓名"
          prefix-icon="Search"
          clearable
        />
      </div>

      <div class="student-list">
        <div
          v-for="student in filteredStudents"
          :key="student.id"
          class="student-item"
          @click="showStudentDetail(student)"
        >
          <div class="student-avatar">
            <img :src="student.avatar" :alt="student.name" />
          </div>
          <div class="student-info">
            <div class="student-name">{{ student.name }}</div>
            <div class="student-progress">完成度: {{ student.progress }}%</div>
          </div>
          <div class="student-score">
            <div class="score-value">{{ student.score }}分</div>
            <div class="score-trend" :class="getTrendClass(student.trend)">
              {{ getTrendIcon(student.trend) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

// 注册ECharts组件
use([
  CanvasRenderer,
  BarChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent
])

interface Props {
  title?: string
  data?: any[]
  loading?: boolean
  height?: string
}

interface Emits {
  (e: 'classChange', classId: string): void
  (e: 'subjectChange', subject: string): void
  (e: 'studentClick', student: any): void
}

const props = withDefaults(defineProps<Props>(), {
  title: '学习进度',
  data: () => [],
  loading: false,
  height: '300px'
})

const emit = defineEmits<Emits>()

// Refs
const chartRef = ref()

// 响应式数据
const selectedClass = ref('class1')
const selectedSubject = ref('all')
const searchQuery = ref('')

// 班级选项
const classes = ref([
  { id: 'class1', name: '高一1班' },
  { id: 'class2', name: '高一2班' },
  { id: 'class3', name: '高一3班' }
])

// 学科选项
const subjects = ref([
  { label: '全部学科', value: 'all' },
  { label: '语文', value: 'chinese' },
  { label: '数学', value: 'math' },
  { label: '英语', value: 'english' }
])

// 模拟数据
const progressData = ref<any[]>([])
const students = ref<any[]>([])

// 计算属性
const completionRate = computed(() => {
  if (progressData.value.length === 0) return 0
  const total = progressData.value.reduce((sum, item) => sum + item.completion, 0)
  return Math.round(total / progressData.value.length)
})

const averageScore = computed(() => {
  if (students.value.length === 0) return 0
  const total = students.value.reduce((sum, student) => sum + student.score, 0)
  return Math.round(total / students.value.length)
})

const studyTime = computed(() => {
  return students.value.reduce((total, student) => total + student.studyTime, 0)
})

const filteredStudents = computed(() => {
  if (!searchQuery.value) return students.value
  return students.value.filter(student =>
    student.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// 图表配置
const chartOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderColor: 'transparent',
    textStyle: {
      color: '#fff',
      fontSize: 12
    },
    formatter: (params: any) => {
      const date = params[0]?.axisValue || ''
      let result = `<div style="margin-bottom: 8px; font-weight: bold;">${date}</div>`

      params.forEach((param: any) => {
        const marker = `<span style="display:inline-block;margin-right:4px;border-radius:50%;width:10px;height:10px;background-color:${param.color};"></span>`
        result += `<div style="margin: 4px 0;">${marker}${param.seriesName}: ${param.value}%</div>`
      })

      return result
    }
  },
  legend: {
    data: ['完成度', '平均分'],
    show: false
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '10%',
    top: '10%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: progressData.value.map(item => item.date),
    axisLine: {
      lineStyle: {
        color: '#E8E8E8'
      }
    },
    axisTick: {
      show: false
    },
    axisLabel: {
      color: '#666',
      fontSize: 12
    }
  },
  yAxis: [
    {
      type: 'value',
      name: '完成度(%)',
      min: 0,
      max: 100,
      position: 'left',
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: '#666',
        fontSize: 12,
        formatter: '{value}%'
      },
      splitLine: {
        lineStyle: {
          color: '#F0F0F0',
          type: 'dashed'
        }
      }
    },
    {
      type: 'value',
      name: '平均分',
      min: 0,
      max: 100,
      position: 'right',
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: '#666',
        fontSize: 12,
        formatter: '{value}分'
      }
    }
  ],
  series: [
    {
      name: '完成度',
      type: 'line',
      smooth: true,
      data: progressData.value.map(item => item.completion),
      itemStyle: {
        color: '#52C41A'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            {
              offset: 0,
              color: 'rgba(82, 196, 26, 0.3)'
            },
            {
              offset: 1,
              color: 'rgba(82, 196, 26, 0.05)'
            }
          ]
        }
      },
      lineStyle: {
        width: 3
      }
    },
    {
      name: '平均分',
      type: 'bar',
      yAxisIndex: 1,
      data: progressData.value.map(item => item.averageScore),
      itemStyle: {
        color: '#1890FF',
        opacity: 0.7
      },
      barWidth: '40%'
    }
  ]
}))

// 方法
const generateMockData = () => {
  const data = []
  const now = new Date()

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    data.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      completion: Math.round(Math.random() * 30 + 60), // 60-90%
      averageScore: Math.round(Math.random() * 20 + 70) // 70-90分
    })
  }

  progressData.value = data

  // 生成学生数据
  const studentNames = ['张小明', '李小红', '王大伟', '赵小华', '刘小芳', '陈小军', '周小丽', '吴小强']
  const mockStudents = studentNames.map((name, index) => ({
    id: `student${index + 1}`,
    name,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
    progress: Math.round(Math.random() * 40 + 50), // 50-90%
    score: Math.round(Math.random() * 30 + 60), // 60-90分
    trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
    studyTime: Math.round(Math.random() * 50 + 20) // 20-70小时
  }))

  students.value = mockStudents
}

const getTrendClass = (trend: string) => {
  return {
    'trend-up': trend === 'up',
    'trend-down': trend === 'down',
    'trend-stable': trend === 'stable'
  }
}

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'up':
      return '↑'
    case 'down':
      return '↓'
    default:
      return '→'
  }
}

const handleClassChange = (classId: string) => {
  generateMockData()
  emit('classChange', classId)
}

const handleSubjectChange = (subject: string) => {
  generateMockData()
  emit('subjectChange', subject)
}

const handleChartClick = (params: any) => {
  // 处理图表点击
}

const showStudentDetail = (student: any) => {
  emit('studentClick', student)
}

const resizeChart = () => {
  if (chartRef.value) {
    chartRef.value.resize()
  }
}

// 监听数据变化
watch(() => props.data, (newData) => {
  if (newData && newData.length > 0) {
    progressData.value = newData
  } else {
    generateMockData()
  }
}, { immediate: true })

// 生命周期
onMounted(() => {
  generateMockData()
  window.addEventListener('resize', resizeChart)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeChart)
})
</script>

<style lang="scss" scoped>
.learning-progress-chart {
  background: var(--edu-bg-primary);
  border-radius: var(--edu-radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--edu-shadow-sm);
  border: 1px solid var(--edu-border-light);
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
}

.chart-title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--edu-text-primary);
}

.chart-controls {
  display: flex;
  gap: var(--spacing-sm);
}

.chart-container {
  height: v-bind(height);
  margin-bottom: var(--spacing-lg);
  border-radius: var(--edu-radius-base);
  overflow: hidden;
}

.chart {
  height: 100%;
  width: 100%;
}

.progress-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-base);
  margin-bottom: var(--spacing-lg);
}

.summary-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-base);
  background: var(--edu-bg-secondary);
  border-radius: var(--edu-radius-base);
  border: 1px solid var(--edu-border-light);
}

.summary-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;

  svg {
    width: 20px;
    height: 20px;
  }
}

.summary-content {
  flex: 1;
  min-width: 0;
}

.summary-value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--edu-text-primary);
  line-height: var(--edu-leading-tight);
}

.summary-label {
  font-size: var(--font-size-xs);
  color: var(--edu-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.student-details {
  background: var(--edu-bg-secondary);
  border-radius: var(--edu-radius-base);
  padding: var(--spacing-base);
}

.details-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-base);

  h4 {
    margin: 0;
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--edu-text-primary);
  }
}

.student-list {
  max-height: 300px;
  overflow-y: auto;
}

.student-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  border-radius: var(--edu-radius-base);
  cursor: pointer;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    background-color: var(--edu-bg-tertiary);
  }
}

.student-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.student-info {
  flex: 1;
  min-width: 0;
}

.student-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--edu-text-primary);
  margin-bottom: 2px;
}

.student-progress {
  font-size: var(--font-size-xs);
  color: var(--edu-text-secondary);
}

.student-score {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

.score-value {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--edu-text-primary);
}

.score-trend {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);

  &.trend-up {
    color: var(--edu-success);
  }

  &.trend-down {
    color: var(--edu-error);
  }

  &.trend-stable {
    color: var(--edu-warning);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .learning-progress-chart {
    padding: var(--spacing-base);
  }

  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .chart-controls {
    width: 100%;
    justify-content: space-between;
  }

  .chart-container {
    height: 250px;
  }

  .progress-summary {
    grid-template-columns: 1fr;
  }

  .details-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }
}

/* 深色模式适配 */
[data-theme="dark"] {
  .learning-progress-chart {
    background: var(--edu-bg-primary);
    border-color: var(--edu-border-dark);
  }

  .summary-item {
    background: var(--edu-bg-secondary);
    border-color: var(--edu-border-dark);
  }

  .student-details {
    background: var(--edu-bg-secondary);
  }

  .student-item:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
}

/* 加载状态 */
:deep(.chart-loading) {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--edu-text-secondary);
}
</style>