<template>
  <div class="score-trend-chart">
    <div class="chart-header">
      <h3 class="chart-title">{{ title }}</h3>
      <div class="chart-controls">
        <el-select
          v-model="selectedTimeRange"
          size="small"
          @change="handleTimeRangeChange"
        >
          <el-option
            v-for="range in timeRanges"
            :key="range.value"
            :label="range.label"
            :value="range.value"
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

    <!-- 图表说明 -->
    <div class="chart-legend">
      <div class="legend-item">
        <div class="legend-color" style="background: #6366F1;"></div>
        <span>平均分</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #10B981;"></div>
        <span>最高分</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #F97316;"></div>
        <span>最低分</span>
      </div>
    </div>

    <!-- 数据统计 -->
    <div class="chart-stats">
      <div class="stat-item">
        <div class="stat-value">{{ averageScore.toFixed(1) }}</div>
        <div class="stat-label">平均分</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ trendDirection === 'up' ? '+' : '' }}{{ trendPercent.toFixed(1) }}%</div>
        <div class="stat-label">较上期</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ totalAssignments }}</div>
        <div class="stat-label">作业数</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  ToolboxComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

// 注册ECharts组件
use([
  CanvasRenderer,
  LineChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  ToolboxComponent
])

interface Props {
  title?: string
  data?: any[]
  loading?: boolean
  height?: string
}

interface Emits {
  (e: 'timeRangeChange', range: string): void
  (e: 'subjectChange', subject: string): void
  (e: 'chartClick', params: any): void
}

const props = withDefaults(defineProps<Props>(), {
  title: '成绩趋势',
  data: () => [],
  loading: false,
  height: '400px'
})

const emit = defineEmits<Emits>()

// Refs
const chartRef = ref()

// 响应式数据
const selectedTimeRange = ref('month')
const selectedSubject = ref('all')

// 时间范围选项
const timeRanges = ref([
  { label: '最近一周', value: 'week' },
  { label: '最近一月', value: 'month' },
  { label: '最近三月', value: 'quarter' },
  { label: '最近一年', value: 'year' }
])

// 学科选项
const subjects = ref([
  { label: '全部学科', value: 'all' },
  { label: '语文', value: 'chinese' },
  { label: '数学', value: 'math' },
  { label: '英语', value: 'english' },
  { label: '物理', value: 'physics' },
  { label: '化学', value: 'chemistry' },
  { label: '生物', value: 'biology' }
])

// 模拟数据
const mockData = ref<any[]>([])

// 计算属性
const averageScore = computed(() => {
  if (mockData.value.length === 0) return 0
  const scores = mockData.value.map(item => item.averageScore)
  return scores.reduce((sum, score) => sum + score, 0) / scores.length
})

const trendDirection = computed(() => {
  if (mockData.value.length < 2) return 'up'
  const recent = mockData.value[mockData.value.length - 1]?.averageScore || 0
  const previous = mockData.value[mockData.value.length - 2]?.averageScore || 0
  return recent >= previous ? 'up' : 'down'
})

const trendPercent = computed(() => {
  if (mockData.value.length < 2) return 0
  const recent = mockData.value[mockData.value.length - 1]?.averageScore || 0
  const previous = mockData.value[mockData.value.length - 2]?.averageScore || 0
  if (previous === 0) return 0
  return ((recent - previous) / previous) * 100
})

const totalAssignments = computed(() => {
  return mockData.value.reduce((total, item) => total + (item.assignments || 0), 0)
})

// 图表配置
const chartOption = computed(() => ({
  backgroundColor: 'transparent',
  title: {
    text: '',
    show: false
  },
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
        result += `<div style="margin: 4px 0;">${marker}${param.seriesName}: ${param.value}分</div>`
      })

      return result
    }
  },
  legend: {
    data: ['平均分', '最高分', '最低分'],
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
    data: mockData.value.map(item => item.date),
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
  yAxis: {
    type: 'value',
    min: 0,
    max: 100,
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
    },
    splitLine: {
      lineStyle: {
        color: '#F0F0F0',
        type: 'dashed'
      }
    }
  },
  series: [
    {
      name: '平均分',
      type: 'line',
      smooth: true,
      data: mockData.value.map(item => item.averageScore),
      itemStyle: {
        color: '#6366F1'
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
              color: 'rgba(99, 102, 241, 0.3)'
            },
            {
              offset: 1,
              color: 'rgba(99, 102, 241, 0.05)'
            }
          ]
        }
      },
      lineStyle: {
        width: 3
      },
      symbol: 'circle',
      symbolSize: 6
    },
    {
      name: '最高分',
      type: 'line',
      smooth: true,
      data: mockData.value.map(item => item.maxScore),
      itemStyle: {
        color: '#10B981'
      },
      lineStyle: {
        width: 2,
        type: 'dashed'
      },
      symbol: 'circle',
      symbolSize: 4
    },
    {
      name: '最低分',
      type: 'line',
      smooth: true,
      data: mockData.value.map(item => item.minScore),
      itemStyle: {
        color: '#F97316'
      },
      lineStyle: {
        width: 2,
        type: 'dashed'
      },
      symbol: 'circle',
      symbolSize: 4
    }
  ],
  dataZoom: [
    {
      type: 'inside',
      start: 0,
      end: 100
    },
    {
      type: 'slider',
      show: false,
      start: 0,
      end: 100
    }
  ],
  toolbox: {
    show: false,
    feature: {
      dataZoom: {
        yAxisIndex: 'none'
      },
      restore: {},
      saveAsImage: {}
    }
  }
}))

// 方法
const generateMockData = () => {
  const now = new Date()
  const data = []
  let days = 30

  switch (selectedTimeRange.value) {
    case 'week':
      days = 7
      break
    case 'quarter':
      days = 90
      break
    case 'year':
      days = 365
      break
  }

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    const baseScore = 75
    const variation = Math.random() * 20 - 10
    const averageScore = Math.max(0, Math.min(100, baseScore + variation))

    data.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      averageScore: Math.round(averageScore * 10) / 10,
      maxScore: Math.round(Math.min(100, averageScore + Math.random() * 15 + 5)),
      minScore: Math.round(Math.max(0, averageScore - Math.random() * 15 - 5)),
      assignments: Math.floor(Math.random() * 5) + 1
    })
  }

  mockData.value = data
}

const handleTimeRangeChange = (range: string) => {
  generateMockData()
  emit('timeRangeChange', range)
}

const handleSubjectChange = (subject: string) => {
  generateMockData()
  emit('subjectChange', subject)
}

const handleChartClick = (params: any) => {
  emit('chartClick', params)
}

const resizeChart = () => {
  if (chartRef.value) {
    chartRef.value.resize()
  }
}

// 监听数据变化
watch(() => props.data, (newData) => {
  if (newData && newData.length > 0) {
    mockData.value = newData
  } else {
    generateMockData()
  }
}, { immediate: true })

// 生命周期
onMounted(() => {
  generateMockData()

  // 监听窗口大小变化
  window.addEventListener('resize', resizeChart)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeChart)
})
</script>

<style lang="scss" scoped>
.score-trend-chart {
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

.chart-legend {
  display: flex;
  justify-content: center;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-base);
  background: var(--edu-bg-secondary);
  border-radius: var(--edu-radius-base);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--edu-text-secondary);
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.chart-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-base);
  margin-top: var(--spacing-lg);
}

.stat-item {
  text-align: center;
  padding: var(--spacing-base);
  background: var(--edu-bg-secondary);
  border-radius: var(--edu-radius-base);
  border: 1px solid var(--edu-border-light);
}

.stat-value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--edu-text-primary);
  margin-bottom: var(--spacing-xs);
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--edu-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .score-trend-chart {
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
    height: 300px;
  }

  .chart-legend {
    flex-wrap: wrap;
    gap: var(--spacing-base);
  }

  .chart-stats {
    grid-template-columns: 1fr;
  }
}

/* 深色模式适配 */
[data-theme="dark"] {
  .score-trend-chart {
    background: var(--edu-bg-primary);
    border-color: var(--edu-border-dark);
  }

  .chart-legend {
    background: var(--edu-bg-secondary);
  }

  .stat-item {
    background: var(--edu-bg-secondary);
    border-color: var(--edu-border-dark);
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
