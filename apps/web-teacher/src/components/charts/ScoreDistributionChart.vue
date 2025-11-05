<template>
  <div class="score-distribution-chart">
    <div class="chart-header">
      <h3 class="chart-title">{{ title }}</h3>
      <div class="chart-controls">
        <el-select
          v-model="selectedChartType"
          size="small"
          @change="handleChartTypeChange"
        >
          <el-option label="柱状图" value="bar" />
          <el-option label="饼图" value="pie" />
          <el-option label="雷达图" value="radar" />
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

    <!-- 数据详情 -->
    <div class="distribution-details">
      <div class="detail-grid">
        <div
          v-for="(item, index) in distributionData"
          :key="item.range"
          class="detail-item"
          :class="{ 'is-highlighted': highlightedIndex === index }"
          @click="highlightSegment(index)"
        >
          <div
            class="detail-color"
            :style="{ backgroundColor: getColorByIndex(index) }"
          ></div>
          <div class="detail-content">
            <div class="detail-range">{{ item.range }}</div>
            <div class="detail-stats">
              <span class="detail-count">{{ item.count }}人</span>
              <span class="detail-percent">{{ item.percent }}%</span>
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
import { BarChart, PieChart, RadarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  ToolboxComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

// 注册ECharts组件
use([
  CanvasRenderer,
  BarChart,
  PieChart,
  RadarChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  ToolboxComponent
])

interface Props {
  title?: string
  data?: any[]
  loading?: boolean
  height?: string
}

interface Emits {
  (e: 'chartTypeChange', type: string): void
  (e: 'segmentClick', data: any): void
}

const props = withDefaults(defineProps<Props>(), {
  title: '成绩分布',
  data: () => [],
  loading: false,
  height: '350px'
})

const emit = defineEmits<Emits>()

// Refs
const chartRef = ref()
const highlightedIndex = ref(-1)

// 响应式数据
const selectedChartType = ref('bar')

// 模拟数据
const distributionData = ref([
  { range: '90-100分', count: 8, percent: 16.0 },
  { range: '80-89分', count: 15, percent: 30.0 },
  { range: '70-79分', count: 18, percent: 36.0 },
  { range: '60-69分', count: 6, percent: 12.0 },
  { range: '0-59分', count: 3, percent: 6.0 }
])

// 颜色配置
const colors = [
  '#52C41A', // 优秀 - 绿色
  '#1890FF', // 良好 - 蓝色
  '#FAAD14', // 中等 - 黄色
  '#FA8C16', // 及格 - 橙色
  '#F5222D'  // 不及格 - 红色
]

// 计算属性
const chartOption = computed(() => {
  const baseOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: selectedChartType.value === 'pie' ? 'item' : 'axis',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: 'transparent',
      textStyle: {
        color: '#fff',
        fontSize: 12
      }
    }
  }

  switch (selectedChartType.value) {
    case 'bar':
      return {
        ...baseOption,
        tooltip: {
          ...baseOption.tooltip,
          formatter: '{b}: {c}人 ({d}%)'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          top: '10%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: distributionData.value.map(item => item.range),
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
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          axisLabel: {
            color: '#666',
            fontSize: 12
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
            type: 'bar',
            data: distributionData.value.map((item, index) => ({
              value: item.count,
              itemStyle: {
                color: colors[index],
                opacity: highlightedIndex.value === -1 || highlightedIndex.value === index ? 1 : 0.5
              }
            })),
            barWidth: '60%',
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.1)'
              }
            }
          }
        ]
      }

    case 'pie':
      return {
        ...baseOption,
        tooltip: {
          ...baseOption.tooltip,
          formatter: '{a} <br/>{b}: {c}人 ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          data: distributionData.value.map(item => item.range)
        },
        series: [
          {
            name: '成绩分布',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['60%', '50%'],
            data: distributionData.value.map((item, index) => ({
              value: item.count,
              name: item.range,
              itemStyle: {
                color: colors[index],
                opacity: highlightedIndex.value === -1 || highlightedIndex.value === index ? 1 : 0.5
              }
            })),
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.2)'
              }
            },
            label: {
              formatter: '{b}\n{c}人\n({d}%)',
              fontSize: 12
            }
          }
        ]
      }

    case 'radar':
      return {
        ...baseOption,
        radar: {
          indicator: distributionData.value.map(item => ({
            name: item.range,
            max: Math.max(...distributionData.value.map(d => d.count)) + 5
          })),
          splitNumber: 4,
          axisName: {
            color: '#666',
            fontSize: 12
          },
          splitLine: {
            lineStyle: {
              color: '#E8E8E8'
            }
          },
          splitArea: {
            areaStyle: {
              color: ['#F5F5F5', '#FAFAFA']
            }
          }
        },
        series: [
          {
            type: 'radar',
            data: [
              {
                value: distributionData.value.map(item => item.count),
                name: '学生人数',
                itemStyle: {
                  color: '#5B8FF9'
                },
                areaStyle: {
                  color: 'rgba(91, 143, 249, 0.3)'
                }
              }
            ]
          }
        ]
      }

    default:
      return baseOption
  }
})

// 方法
const getColorByIndex = (index: number): string => {
  return colors[index] || '#999'
}

const highlightSegment = (index: number) => {
  highlightedIndex.value = highlightedIndex.value === index ? -1 : index
  emit('segmentClick', distributionData.value[index])
}

const handleChartTypeChange = (type: string) => {
  highlightedIndex.value = -1
  emit('chartTypeChange', type)
}

const handleChartClick = (params: any) => {
  if (params.dataIndex !== undefined) {
    highlightSegment(params.dataIndex)
  }
}

const resizeChart = () => {
  if (chartRef.value) {
    chartRef.value.resize()
  }
}

// 监听数据变化
watch(() => props.data, (newData) => {
  if (newData && newData.length > 0) {
    distributionData.value = newData
  }
}, { immediate: true })

// 生命周期
onMounted(() => {
  window.addEventListener('resize', resizeChart)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeChart)
})
</script>

<style lang="scss" scoped>
.score-distribution-chart {
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

.distribution-details {
  background: var(--edu-bg-secondary);
  border-radius: var(--edu-radius-base);
  padding: var(--spacing-base);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-sm);
}

.detail-item {
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

  &.is-highlighted {
    background-color: var(--edu-primary-50);
    border: 1px solid var(--edu-primary-200);
  }
}

.detail-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.detail-content {
  flex: 1;
  min-width: 0;
}

.detail-range {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--edu-text-primary);
  margin-bottom: 2px;
}

.detail-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-count {
  font-size: var(--font-size-xs);
  color: var(--edu-text-secondary);
}

.detail-percent {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--edu-text-tertiary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .score-distribution-chart {
    padding: var(--spacing-base);
  }

  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .chart-container {
    height: 280px;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}

/* 深色模式适配 */
[data-theme="dark"] {
  .score-distribution-chart {
    background: var(--edu-bg-primary);
    border-color: var(--edu-border-dark);
  }

  .distribution-details {
    background: var(--edu-bg-secondary);
  }

  .detail-item {
    &:hover {
      background-color: rgba(255, 255, 255, 0.05);
    }

    &.is-highlighted {
      background-color: rgba(91, 143, 249, 0.1);
      border-color: var(--edu-primary-600);
    }
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