<template>
  <TeacherWorkspaceLayout
    title="学习分析"
    subtitle="查看课程成效、学生表现与 AI 辅助使用情况"
    v-model:leftCollapsed="leftSidebarCollapsed"
    v-model:rightCollapsed="rightSidebarCollapsed"
  >
    <!-- 头部控件 -->
    <template #header-controls>
      <el-select v-model="selectedRange" placeholder="选择时间范围" size="large">
        <el-option label="本周" value="7d"></el-option>
        <el-option label="本月" value="30d"></el-option>
        <el-option label="本学期" value="120d"></el-option>
      </el-select>
    </template>

    <!-- Summary Strip -->
    <template #summary>
      <div class="summary-cards">
        <div v-for="card in summaryCards" :key="card.id" class="summary-card">
          <div class="summary-icon" :style="{ background: card.gradient }">
            <el-icon><component :is="card.icon"></component></el-icon>
          </div>
          <div class="summary-content">
            <div class="summary-label">{{ card.label }}</div>
            <div class="summary-value">{{ card.value }}</div>
            <div class="summary-trend" :class="{ 'is-up': card.trend >= 0, 'is-down': card.trend < 0 }">
              <el-icon><component :is="card.trend >= 0 ? 'CaretTop' : 'CaretBottom'"></component></el-icon>
              {{ Math.abs(card.trend) }}&#37; vs. 上周期
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 左侧筛选栏 -->
    <template #left>
      <ManagementSidebarLeft
        :sections="leftSidebarSections"
        @quick-action="handleQuickAction"
        @filter-change="handleFilterChange"
      >
        <!-- 自定义筛选器插槽 -->
        <template #filters="{ data }">
          <div class="analytics-filters">
        <div class="filter-section">
          <h4 class="filter-title">分析视角</h4>
          <div class="perspective-tabs">
            <el-radio-group v-model="selectedPerspective" direction="vertical" size="small">
              <el-radio-button value="course">
                <el-icon><Reading></Reading></el-icon>
                课程分析
              </el-radio-button>
              <el-radio-button value="class">
                <el-icon><UserFilled></UserFilled></el-icon>
                班级分析
              </el-radio-button>
              <el-radio-button value="student">
                <el-icon><Avatar></Avatar></el-icon>
                学生分析
              </el-radio-button>
              <el-radio-button value="ai">
                <el-icon><MagicStick></MagicStick></el-icon>
                AI 使用分析
              </el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <div class="filter-section">
          <h4 class="filter-title">时间筛选</h4>
          <div class="date-options">
            <el-button
              v-for="option in dateOptions"
              :key="option.value"
              :type="selectedDateOption === option.value ? 'primary' : 'default'"
              size="small"
              @click="selectedDateOption = option.value"
            >
              {{ option.label }}
            </el-button>
          </div>
          <el-date-picker
            v-model="customDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 100%; margin-top: 8px"
          ></el-date-picker>
        </div>

        <div class="filter-section">
          <h4 class="filter-title">学科筛选</h4>
          <el-select v-model="selectedSubject" placeholder="选择学科" style="width: 100%">
            <el-option label="全部学科" value="all"></el-option>
            <el-option
              v-for="subject in subjects"
              :key="subject.value"
              :label="subject.label"
              :value="subject.value"
            ></el-option>
          </el-select>
        </div>

        <div class="filter-section">
          <h4 class="filter-title">对比分析</h4>
          <div class="comparison-options">
            <el-checkbox v-model="enableComparison">启用对比模式</el-checkbox>
            <el-select
              v-if="enableComparison"
              v-model="comparisonMetric"
              placeholder="选择对比指标"
              style="width: 100%; margin-top: 8px"
            >
              <el-option label="完成率" value="completion"></el-option>
              <el-option label="平均分" value="average"></el-option>
              <el-option label="活跃度" value="activity"></el-option>
            </el-select>
          </div>
        </div>
      </div>
        </template>
      </ManagementSidebarLeft>
    </template>

    <!-- 右侧栏 -->
    <template #right>
      <ManagementSidebarRight
        :sections="rightSidebarSections"
        @resource-action="handleResourceAction"
        @collaboration-action="handleCollaborationAction"
      >
        <!-- 自定义数据洞察插槽 -->
        <template #insights="{ data }">
          <div class="analytics-insights">
            <div class="quick-stats">
              <div class="stat-item">
                <div class="stat-label">数据分析量</div>
                <div class="stat-value">{{ dataAnalysisCount }} 项</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">报告生成</div>
                <div class="stat-value">{{ reportCount }} 份</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">洞察发现</div>
                <div class="stat-value">{{ insightCount }} 条</div>
              </div>
            </div>
          </div>
        </template>

        <!-- 自定义资源参考插槽 -->
        <template #resources="{ data }">
          <div class="analytics-resources">
            <h5>分析资源</h5>
            <div class="resource-list">
              <div v-for="resource in recommendedResources" :key="resource.id" class="resource-item">
                <div class="resource-icon" :style="{ backgroundColor: resource.color }">
                  <el-icon><component :is="resource.icon"></component></el-icon>
                </div>
                <div class="resource-content">
                  <div class="resource-title">{{ resource.title }}</div>
                  <div class="resource-desc">{{ resource.description }}</div>
                </div>
                <el-button text size="small" @click="openResource(resource)">查看</el-button>
              </div>
            </div>
          </div>
        </template>

        <!-- 自定义协作动态插槽 -->
        <template #collaboration="{ data }">
          <div class="analytics-collaboration">
            <h5>分析协作</h5>
            <div class="collaboration-list">
              <div v-for="item in collaborationItems" :key="item.id" class="collaboration-item">
                <div class="collaboration-icon">
                  <el-icon><component :is="item.icon"></component></el-icon>
                </div>
                <div class="collaboration-content">
                  <div class="collaboration-text">{{ item.text }}</div>
                  <div class="collaboration-time">{{ item.time }}</div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </ManagementSidebarRight>
    </template>

    <!-- 主内容区 -->
    <div class="analytics-content page-surface">
      <div class="content-tabs">
        <el-tabs v-model="activeTab" type="border-card">
          <!-- KPI 指标 -->
          <el-tab-pane label="核心指标" name="kpi">
            <div class="kpi-section">
              <div class="kpi-grid">
                <div v-for="kpi in kpiMetrics" :key="kpi.id" class="kpi-card">
                  <div class="kpi-header">
                    <h4 class="kpi-title">{{ kpi.title }}</h4>
                    <div class="kpi-value">{{ kpi.value }}</div>
                  </div>
                  <div class="kpi-body">
                    <div class="kpi-chart">
                      <div class="mini-chart" :id="'kpi-chart-' + kpi.id"></div>
                    </div>
                    <div class="kpi-details">
                      <div class="detail-item">
                        <span class="detail-label">目标值：</span>
                        <span class="detail-value">{{ kpi.target }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">达成率：</span>
                        <span class="detail-value" :class="getCompletionClass(kpi.completion)">
                          {{ kpi.completion }}&#37;
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 趋势分析 -->
          <el-tab-pane label="趋势分析" name="trends">
            <div class="trends-section">
              <div class="trends-header">
                <h3>关键指标趋势</h3>
                <div class="trends-controls">
                  <el-select v-model="trendMetric" placeholder="选择指标">
                    <el-option label="课程完成率" value="completion"></el-option>
                    <el-option label="学生活跃度" value="activity"></el-option>
                    <el-option label="平均成绩" value="performance"></el-option>
                  </el-select>
                </div>
              </div>
              <div class="trends-chart">
                <div id="trends-chart"></div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 对比分析 -->
          <el-tab-pane label="对比分析" name="comparison">
            <div class="comparison-section">
              <div class="comparison-header">
                <h3>数据对比</h3>
                <div class="comparison-controls">
                  <el-select v-model="comparisonType" placeholder="对比维度">
                    <el-option label="学科对比" value="subject"></el-option>
                    <el-option label="班级对比" value="class"></el-option>
                    <el-option label="时间对比" value="period"></el-option>
                  </el-select>
                </div>
              </div>
              <div class="comparison-chart">
                <div id="comparison-chart"></div>
              </div>
              <div class="comparison-table">
                <el-table :data="comparisonData" style="width: 100%">
                  <el-table-column prop="name" label="项目"></el-table-column>
                  <el-table-column prop="value1" label="当前值"></el-table-column>
                  <el-table-column prop="value2" label="对比值"></el-table-column>
                  <el-table-column prop="change" label="变化" width="100">
                    <template #default="{ row }">
                      <span :class="getChangeClass(row.change)">
                        {{ row.change > 0 ? '+' : '' }}{{ row.change }}&#37;
                      </span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </el-tab-pane>

          <!-- 预警提醒 -->
          <el-tab-pane label="预警提醒" name="alerts">
            <div class="alerts-section">
              <div class="alerts-header">
                <h3>系统预警</h3>
                <div class="alert-stats">
                  <el-tag :type="getAlertType(alertStats.critical)" size="small">
                    严重 {{ alertStats.critical }}
                  </el-tag>
                  <el-tag :type="getAlertType(alertStats.warning)" size="small">
                    警告 {{ alertStats.warning }}
                  </el-tag>
                  <el-tag type="info" size="small">
                    提示 {{ alertStats.info }}
                  </el-tag>
                </div>
              </div>
              <div class="alerts-list">
                <div
                  v-for="alert in alertList"
                  :key="alert.id"
                  class="alert-item"
                  :class="'alert-' + alert.level"
                >
                  <div class="alert-icon">
                    <el-icon><component :is="getAlertIcon(alert.level)"></component></el-icon>
                  </div>
                  <div class="alert-content">
                    <h4 class="alert-title">{{ alert.title }}</h4>
                    <p class="alert-description">{{ alert.description }}</p>
                    <div class="alert-time">{{ alert.time }}</div>
                  </div>
                  <div class="alert-actions">
                    <el-button type="text" size="small">查看详情</el-button>
                    <el-button type="text" size="small">忽略</el-button>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    </TeacherWorkspaceLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Reading, UserFilled, Avatar, MagicStick,
  Download, Document, Picture, Plus,
  Warning, InfoFilled, SuccessFilled,
  TrendCharts, DataAnalysis, Bell, FileText, Message
} from '@element-plus/icons-vue'

import TeacherWorkspaceLayout from '@/components/layout/TeacherWorkspaceLayout.vue'
import ManagementSidebarLeft from '@/components/layout/ManagementSidebarLeft.vue'
import ManagementSidebarRight from '@/components/layout/ManagementSidebarRight.vue'
import { PAGE_SIDEBAR_CONFIGS } from '@/constants/managementSidebar'

// 响应式数据
const selectedRange = ref('30d')
const selectedPerspective = ref('course')
const selectedSubject = ref('all')
const selectedDateOption = ref('7d')
const customDateRange = ref<[Date, Date] | null>(null)
const enableComparison = ref(false)
const comparisonMetric = ref('completion')
const activeTab = ref('kpi')
const trendMetric = ref('completion')
const comparisonType = ref('subject')
const exportFormats = ref(['pdf', 'excel'])
const leftSidebarCollapsed = ref(false)
const rightSidebarCollapsed = ref(false)

// 侧边栏配置
const leftSidebarSections = computed(() => PAGE_SIDEBAR_CONFIGS.analytics.left)
const rightSidebarSections = computed(() => PAGE_SIDEBAR_CONFIGS.analytics.right)

// 右侧栏数据
const dataAnalysisCount = ref(156)
const reportCount = ref(42)
const insightCount = ref(28)

const recommendedResources = ref([
  {
    id: 1,
    title: '数据分析指南',
    description: '学习数据分析和可视化的最佳实践',
    color: '#1890ff',
    icon: 'Document'
  },
  {
    id: 2,
    title: '报告模板',
    description: '专业的学习分析报告模板集合',
    color: '#52c41a',
    icon: 'FileText'
  },
  {
    id: 3,
    title: '研究方法',
    description: '教育研究方法论和统计分析技术',
    color: '#722ed1',
    icon: 'Book'
  }
])

const collaborationItems = ref([
  {
    id: 'collab-1',
    text: '教研组分享了新的分析模型',
    time: '3 小时前',
    icon: 'DataAnalysis'
  },
  {
    id: 'collab-2',
    text: '数据团队更新了分析工具',
    time: '1 天前',
    icon: 'TrendCharts'
  }
])

// 配置选项
const dateOptions = [
  { label: '最近7天', value: '7d' },
  { label: '最近30天', value: '30d' },
  { label: '本学期', value: '120d' },
  { label: '自定义', value: 'custom' }
]

const subjects = [
  { label: '语文', value: 'chinese' },
  { label: '数学', value: 'math' },
  { label: '英语', value: 'english' },
  { label: '物理', value: 'physics' },
  { label: '化学', value: 'chemistry' },
  { label: '生物', value: 'biology' }
]

// 模拟数据
const summaryCards = ref([
  {
    id: 1,
    label: '课程完成率',
    value: '78.5%',
    trend: 5.2,
    icon: 'TrendCharts',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    id: 2,
    label: '学生活跃度',
    value: '89.3%',
    trend: -2.1,
    icon: 'DataAnalysis',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  {
    id: 3,
    label: 'AI 使用率',
    value: '45.7%',
    trend: 12.8,
    icon: 'MagicStick',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  }
])

const kpiMetrics = ref([
  {
    id: 1,
    title: '课程完成率',
    value: '78.5%',
    target: '85%',
    completion: 92.4
  },
  {
    id: 2,
    title: '学生参与度',
    value: '89.3%',
    target: '90%',
    completion: 99.2
  },
  {
    id: 3,
    title: '平均成绩',
    value: '85.2',
    target: '80',
    completion: 106.5
  },
  {
    id: 4,
    title: '作业提交率',
    value: '92.1%',
    target: '95%',
    completion: 96.9
  }
])

const alertStats = ref({
  critical: 3,
  warning: 7,
  info: 12
})

const alertList = ref([
  {
    id: 1,
    title: '数学课程完成率低于阈值',
    description: '高三(2)班数学课程完成率仅为65%，低于设定的70%阈值',
    level: 'critical',
    time: '2小时前'
  },
  {
    id: 2,
    title: '学生活跃度下降',
    description: '本周学生平均活跃度较上周下降15%，需要关注',
    level: 'warning',
    time: '1天前'
  }
])

const subscriptions = ref([
  {
    id: 1,
    title: '周报订阅',
    description: '每周一自动发送学习分析周报',
    frequency: '每周一',
    enabled: true
  },
  {
    id: 2,
    title: '异常预警',
    description: '当关键指标出现异常时立即通知',
    frequency: '实时',
    enabled: true
  }
])

const aiSuggestions = ref([
  {
    id: 1,
    title: '优化课程结构',
    description: '建议调整课程章节顺序以提高学生参与度',
    type: 'optimization'
  },
  {
    id: 2,
    title: '个性化学习路径',
    description: '基于学生表现推荐个性化学习路径',
    type: 'personalization'
  }
])

const comparisonData = ref([
  { name: '语文', value1: 82.3, value2: 78.5, change: 3.8 },
  { name: '数学', value1: 76.5, value2: 79.2, change: -2.7 },
  { name: '英语', value1: 85.7, value2: 83.4, change: 2.3 }
])

// 计算属性
const getCompletionClass = (value: number) => {
  if (value >= 100) return 'excellent'
  if (value >= 90) return 'good'
  if (value >= 80) return 'normal'
  return 'poor'
}

const getChangeClass = (change: number) => {
  if (change > 5) return 'positive'
  if (change > 0) return 'positive'
  return 'negative'
}

const getAlertType = (level: string) => {
  switch (level) {
    case 'critical': return 'danger'
    case 'warning': return 'warning'
    default: return 'info'
  }
}

const getAlertIcon = (level: string) => {
  switch (level) {
    case 'critical': return 'Warning'
    case 'warning': return 'InfoFilled'
    default: return 'SuccessFilled'
  }
}

const getSuggestionIcon = (type: string) => {
  switch (type) {
    case 'optimization': return 'TrendCharts'
    case 'personalization': return 'Avatar'
    default: return 'Bell'
  }
}

// 方法
const exportReport = () => {
  ElMessage.success('报告导出成功')
}

const exportData = () => {
  ElMessage.success('数据导出成功')
}

const exportChart = () => {
  ElMessage.success('图表导出成功')
}

const addSubscription = () => {
  ElMessage.info('添加订阅功能')
}

const handleSubscriptionChange = (subscription: any) => {
  ElMessage.info(`订阅${subscription.enabled ? '已启用' : '已禁用'}: ${subscription.title}`)
}

// 侧边栏方法
const handleQuickAction = (action: string) => {
  switch (action) {
    case 'export':
      exportData()
      break
    case 'report':
      exportReport()
      break
    case 'chart':
      exportChart()
      break
  }
}

const handleFilterChange = (filters: any) => {
  console.log('Analytics filters changed:', filters)
}

const handleResourceAction = (action: string, id: string | number) => {
  console.log('Resource action:', action, id)
  if (action === 'open') {
    openResource(recommendedResources.value.find(r => r.id === id))
  }
}

const handleCollaborationAction = (action: string, data: any) => {
  console.log('Collaboration action:', action, data)
}

const openResource = (resource: any) => {
  if (resource) {
    ElMessage.info(`查看资源: ${resource.title}`)
  }
}

const initCharts = () => {
  // 初始化图表
  nextTick(() => {
    // 这里可以初始化 ECharts 图表
    console.log('初始化分析图表')
  })
}

onMounted(() => {
  initCharts()
})
</script>

<style scoped>
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--edu-color-white);
  border-radius: 12px;
  border: 1px solid var(--edu-border-light);
  box-shadow: var(--edu-shadow-sm);
}

.summary-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.summary-content {
  flex: 1;
}

.summary-label {
  font-size: 14px;
  color: var(--edu-text-secondary);
  margin-bottom: 4px;
}

.summary-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin-bottom: 4px;
}

.summary-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.summary-trend.is-up {
  color: var(--edu-success-600);
}

.summary-trend.is-down {
  color: var(--edu-danger-600);
}

.analytics-filters {
  padding: 20px;
}

.filter-section {
  margin-bottom: 24px;
}

.filter-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin-bottom: 12px;
}

.perspective-tabs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.date-options {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.analytics-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--edu-space-section);
}

.content-tabs {
  background: var(--edu-color-white);
  border-radius: 12px;
  border: 1px solid var(--edu-border-light);
  overflow: hidden;
}

.kpi-section {
  padding: 20px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.kpi-card {
  background: var(--edu-color-background);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--edu-border-light);
}

.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.kpi-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--edu-text-primary);
}

.kpi-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--edu-primary-600);
}

.kpi-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mini-chart {
  height: 80px;
  background: var(--edu-color-white);
  border-radius: 4px;
}

.kpi-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.detail-label {
  color: var(--edu-text-secondary);
}

.detail-value {
  font-weight: 500;
  color: var(--edu-text-primary);
}

.detail-value.excellent { color: var(--edu-success-600); }
.detail-value.good { color: var(--edu-primary-600); }
.detail-value.normal { color: var(--edu-warning-600); }
.detail-value.poor { color: var(--edu-danger-600); }

.trends-section,
.comparison-section,
.alerts-section {
  padding: 20px;
}

.trends-header,
.comparison-header,
.alerts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.trends-controls,
.comparison-controls {
  display: flex;
  gap: 12px;
}

.trends-chart,
.comparison-chart {
  height: 300px;
  background: var(--edu-color-background);
  border-radius: 8px;
  margin-bottom: 20px;
}

.comparison-table {
  margin-top: 20px;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  border-left: 4px solid;
}

.alert-critical {
  background: #fef2f2;
  border-left-color: var(--edu-danger-500);
}

.alert-warning {
  background: #fff8e6;
  border-left-color: var(--edu-warning-500);
}

.alert-info {
  background: #e8f5fe;
  border-left-color: var(--edu-info-500);
}

.alert-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.alert-critical .alert-icon { background: var(--edu-danger-500); }
.alert-warning .alert-icon { background: var(--edu-warning-500); }
.alert-info .alert-icon { background: var(--edu-info-500); }

.alert-content {
  flex: 1;
}

.alert-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin-bottom: 4px;
}

.alert-description {
  font-size: 13px;
  color: var(--edu-text-secondary);
  margin-bottom: 6px;
  line-height: 1.4;
}

.alert-time {
  font-size: 11px;
  color: var(--edu-text-tertiary);
}

.alert-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.alert-stats {
  display: flex;
  gap: 8px;
}

.analytics-sidebar {
  width: 100%;
  height: 100%;
}

.sidebar-section {
  padding: 16px;
}

.sidebar-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin-bottom: 12px;
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.format-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin-bottom: 8px;
}

.export-formats {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.subscription-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.subscription-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px;
  background: var(--edu-color-background);
  border-radius: 8px;
}

.subscription-info {
  flex: 1;
}

.subscription-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin-bottom: 4px;
}

.subscription-description {
  font-size: 12px;
  color: var(--edu-text-secondary);
  margin-bottom: 4px;
  line-height: 1.4;
}

.subscription-frequency {
  font-size: 11px;
  color: var(--edu-text-tertiary);
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: var(--edu-color-background);
  border-radius: 8px;
}

.suggestion-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.suggestion-content {
  flex: 1;
}

.suggestion-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin-bottom: 4px;
}

.suggestion-description {
  font-size: 12px;
  color: var(--edu-text-secondary);
  margin-bottom: 8px;
  line-height: 1.4;
}

.suggestion-actions {
  display: flex;
  gap: 8px;
}

.change.positive {
  color: var(--edu-success-600);
}

.change.negative {
  color: var(--edu-danger-600);
}

/* 使用标准侧栏样式 */
.analytics-filters {
  display: flex;
  flex-direction: column;
  gap: var(--sidebar-spacing-lg);
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: var(--sidebar-spacing-base);
}

.filter-title {
  font-size: var(--sidebar-font-size-base);
  font-weight: var(--sidebar-font-weight-semibold);
  color: var(--sidebar-text-primary);
  margin: 0 0 var(--sidebar-spacing-base) 0;
  padding: 0 var(--sidebar-spacing-sm);
  line-height: var(--sidebar-line-height-tight);
}

.perspective-tabs {
  display: flex;
  flex-direction: column;
  gap: var(--sidebar-spacing-sm);
}

.date-options {
  display: flex;
  flex-direction: column;
  gap: var(--sidebar-spacing-sm);
}

.comparison-options {
  display: flex;
  flex-direction: column;
  gap: var(--sidebar-spacing-base);
}

/* 右侧栏样式 */
.analytics-insights {
  display: flex;
  flex-direction: column;
  gap: var(--sidebar-spacing-base);
}

.quick-stats {
  display: flex;
  flex-direction: column;
  gap: var(--sidebar-spacing-base);
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--sidebar-spacing-sm) 0;
}

.stat-label {
  font-size: var(--sidebar-font-size-sm);
  color: var(--sidebar-text-secondary);
  font-weight: var(--sidebar-font-weight-normal);
}

.stat-value {
  font-weight: var(--sidebar-font-weight-semibold);
  color: var(--sidebar-text-primary);
  font-size: var(--sidebar-font-size-base);
}

.analytics-resources {
  display: flex;
  flex-direction: column;
  gap: var(--sidebar-spacing-base);
}

.resource-list {
  display: flex;
  flex-direction: column;
  gap: var(--sidebar-spacing-base);
}

.resource-item {
  display: flex;
  align-items: center;
  gap: var(--sidebar-spacing-sm);
  padding: var(--sidebar-spacing-sm);
  border-radius: var(--sidebar-radius-base);
  background: rgba(15, 23, 42, 0.04);
  transition: all var(--sidebar-transition-normal);

  &:hover {
    background: rgba(99, 102, 241, 0.08);
  }
}

.resource-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--sidebar-radius-base);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.resource-content {
  flex: 1;
  min-width: 0;
}

.resource-title {
  font-weight: var(--sidebar-font-weight-semibold);
  color: var(--sidebar-text-primary);
  margin-bottom: 2px;
  font-size: var(--sidebar-font-size-sm);
}

.resource-desc {
  font-size: var(--sidebar-font-size-xs);
  color: var(--sidebar-text-tertiary);
}

.analytics-collaboration {
  display: flex;
  flex-direction: column;
  gap: var(--sidebar-spacing-base);
}

.collaboration-list {
  display: flex;
  flex-direction: column;
  gap: var(--sidebar-spacing-base);
}

.collaboration-item {
  display: flex;
  gap: var(--sidebar-spacing-sm);
  align-items: flex-start;
}

.collaboration-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--sidebar-radius-base);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(99, 102, 241, 0.12);
  color: #4f46e5;
  flex-shrink: 0;
}

.collaboration-content {
  flex: 1;
  min-width: 0;
}

.collaboration-text {
  font-weight: var(--sidebar-font-weight-semibold);
  color: var(--sidebar-text-primary);
  margin-bottom: 2px;
  font-size: var(--sidebar-font-size-sm);
  line-height: var(--sidebar-line-height-tight);
}

.collaboration-time {
  font-size: var(--sidebar-font-size-xs);
  color: var(--sidebar-text-tertiary);
  line-height: var(--sidebar-line-height-normal);
}
</style>
