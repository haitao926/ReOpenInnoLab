<template>
  <div class="learning-analytics">
    <div class="analytics-toolbar">
      <el-segmented v-model="timeRange" :options="timeRangeOptions" size="large" />
      <div class="toolbar-meta">
        <span class="toolbar-updated">更新于 {{ lastUpdatedLabel }}</span>
        <el-button text class="toolbar-refresh" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <div class="analytics-highlights">
      <div class="highlight">
        <el-icon><TrendCharts /></el-icon>
        <span>平均课堂参与度 {{ averageEngagement }}%</span>
      </div>
      <div class="highlight" :class="{ 'highlight--alert': criticalAlertCount > 0 }">
        <el-icon><Warning /></el-icon>
        <span>{{ statusHeadline }}</span>
      </div>
    </div>

    <div class="summary-grid">
      <EduCard
        v-for="card in summaryCards"
        :key="card.id"
        class="summary-card"
        variant="glass"
        size="sm"
      >
        <div class="summary-card__icon" :class="`summary-card__icon--${card.id}`">
          <el-icon><component :is="card.icon" /></el-icon>
        </div>
        <div class="summary-card__content">
          <div class="summary-card__label">{{ card.label }}</div>
          <div class="summary-card__value">{{ card.value }}</div>
          <div class="summary-card__trend" :class="{ 'summary-card__trend--down': card.trend < 0 }">
            {{ formatTrend(card.trend) }}
            <span class="summary-card__hint">{{ card.trendLabel }}</span>
          </div>
        </div>
      </EduCard>
    </div>

    <div class="analytics-grid">
      <EduCard class="grid-card" variant="bordered" title="学科表现">
        <el-table :data="subjectPerformance" border size="small">
          <el-table-column prop="name" label="学科" width="140" />
          <el-table-column label="平均成绩" width="180">
            <template #default="{ row }">
              <div class="metric">
                <span class="metric__value">{{ row.avgScore }}分</span>
                <span
                  class="metric__trend"
                  :class="{ 'metric__trend--down': row.trend < 0 }"
                >
                  {{ formatTrend(row.trend) }}
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="作业完成率" width="200">
            <template #default="{ row }">
              <el-progress :percentage="row.completionRate" :stroke-width="6" />
            </template>
          </el-table-column>
          <el-table-column label="课堂参与度">
            <template #default="{ row }">
              <span>{{ row.engagement }}%</span>
            </template>
          </el-table-column>
        </el-table>
      </EduCard>

      <EduCard class="grid-card" variant="bordered" title="学习活跃趋势">
        <div class="trend-chart">
          <div v-for="point in engagementTrend" :key="point.id" class="trend-bar">
            <span class="trend-bar__value">{{ point.engagement }}%</span>
            <div class="trend-bar__column">
              <div class="trend-bar__fill" :style="{ height: `${point.engagement}%` }"></div>
            </div>
            <span class="trend-bar__label">{{ point.label }}</span>
          </div>
        </div>
        <div class="trend-footer">
          <span>任务完成度均值 {{ averageTaskCompletion }}%</span>
          <span>样本班级 {{ engagementTrend.length }} 个</span>
        </div>
      </EduCard>

      <EduCard class="grid-card" variant="bordered" title="学习预警">
        <template v-if="riskAlerts.length === 0">
          <el-empty description="暂无学习预警" />
        </template>
        <ul v-else class="alert-list">
          <li
            v-for="alert in riskAlerts"
            :key="alert.id"
            class="alert-item"
            :class="`alert-item--${alert.level}`"
          >
            <div class="alert-item__header">
              <strong>{{ alert.student }}</strong>
              <el-tag :type="alert.level === 'critical' ? 'danger' : 'warning'" size="small">
                {{ alert.level === 'critical' ? '高风险' : '预警' }}
              </el-tag>
            </div>
            <div class="alert-item__issue">{{ alert.issue }}</div>
            <div class="alert-item__action">建议：{{ alert.action }}</div>
          </li>
        </ul>
      </EduCard>

      <EduCard class="grid-card" variant="bordered" title="重点跟进学生">
        <ul class="focus-list">
          <li v-for="student in focusStudents" :key="student.id" class="focus-item">
            <div class="focus-item__header">
              <span class="focus-item__name">{{ student.name }}</span>
              <el-tag :type="getRiskTagType(student.riskLevel)" size="small">
                {{ riskLevelLabel[student.riskLevel] }}
              </el-tag>
            </div>
            <div class="focus-item__meta">
              <span>{{ student.className }}</span>
              <span>学习进度 {{ student.progress }}%</span>
            </div>
            <div class="focus-item__next">{{ student.nextStep }}</div>
          </li>
        </ul>
      </EduCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Component } from 'vue'
import { ElMessage } from 'element-plus'
import {
  DataAnalysis,
  TrendCharts,
  Document,
  Warning,
  Refresh
} from '@element-plus/icons-vue'
import { EduCard } from '@reopeninnolab/ui-kit'

type TimeRange = 'week' | 'month' | 'term'

type RiskLevel = 'high' | 'medium' | 'notice'

interface SummaryCard {
  id: string
  label: string
  value: string
  trend: number
  trendLabel: string
  icon: Component
}

interface SubjectPerformance {
  id: string
  name: string
  avgScore: number
  completionRate: number
  engagement: number
  trend: number
}

interface TrendPoint {
  id: string
  label: string
  engagement: number
  taskCompletion: number
}

interface RiskAlert {
  id: string
  student: string
  issue: string
  level: 'warning' | 'critical'
  action: string
}

interface FocusStudent {
  id: string
  name: string
  className: string
  riskLevel: RiskLevel
  progress: number
  nextStep: string
}

const timeRangeOptions: Array<{ label: string; value: TimeRange }> = [
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '本学期', value: 'term' }
]

const timeRange = ref<TimeRange>('week')
const lastUpdated = ref(new Date())

const riskLevelLabel: Record<RiskLevel, string> = {
  high: '高风险',
  medium: '需关注',
  notice: '观察中'
}

const summaryData: Record<TimeRange, SummaryCard[]> = {
  week: [
    { id: 'score', label: '平均成绩', value: '86分', trend: 2.4, trendLabel: '较上周', icon: DataAnalysis },
    { id: 'completion', label: '作业完成率', value: '92%', trend: 4.1, trendLabel: '任务完成', icon: Document },
    { id: 'engagement', label: '课堂参与度', value: '87%', trend: 1.8, trendLabel: '互动提问', icon: TrendCharts },
    { id: 'alerts', label: '预警学生', value: '6 人', trend: -1.5, trendLabel: '风险下降', icon: Warning }
  ],
  month: [
    { id: 'score', label: '平均成绩', value: '84分', trend: 3.6, trendLabel: '较上月', icon: DataAnalysis },
    { id: 'completion', label: '作业完成率', value: '89%', trend: 2.7, trendLabel: '任务完成', icon: Document },
    { id: 'engagement', label: '课堂参与度', value: '83%', trend: 2.1, trendLabel: '课堂互动', icon: TrendCharts },
    { id: 'alerts', label: '预警学生', value: '8 人', trend: -0.8, trendLabel: '风险下降', icon: Warning }
  ],
  term: [
    { id: 'score', label: '平均成绩', value: '81分', trend: 5.3, trendLabel: '较上学期', icon: DataAnalysis },
    { id: 'completion', label: '作业完成率', value: '85%', trend: 3.9, trendLabel: '任务完成', icon: Document },
    { id: 'engagement', label: '课堂参与度', value: '80%', trend: 3.4, trendLabel: '课堂互动', icon: TrendCharts },
    { id: 'alerts', label: '预警学生', value: '11 人', trend: -1.1, trendLabel: '风险下降', icon: Warning }
  ]
}

const subjectPerformanceData: Record<TimeRange, SubjectPerformance[]> = {
  week: [
    { id: 'math', name: '数学', avgScore: 88, completionRate: 95, engagement: 84, trend: 2.5 },
    { id: 'physics', name: '物理', avgScore: 82, completionRate: 89, engagement: 79, trend: 1.2 },
    { id: 'chemistry', name: '化学', avgScore: 85, completionRate: 91, engagement: 81, trend: 2.1 },
    { id: 'biology', name: '生物', avgScore: 80, completionRate: 87, engagement: 76, trend: -0.6 }
  ],
  month: [
    { id: 'math', name: '数学', avgScore: 86, completionRate: 92, engagement: 82, trend: 3.4 },
    { id: 'physics', name: '物理', avgScore: 79, completionRate: 85, engagement: 75, trend: 1.7 },
    { id: 'chemistry', name: '化学', avgScore: 83, completionRate: 88, engagement: 78, trend: 1.9 },
    { id: 'biology', name: '生物', avgScore: 78, completionRate: 82, engagement: 72, trend: -1.2 }
  ],
  term: [
    { id: 'math', name: '数学', avgScore: 84, completionRate: 89, engagement: 79, trend: 4.6 },
    { id: 'physics', name: '物理', avgScore: 77, completionRate: 81, engagement: 72, trend: 2.5 },
    { id: 'chemistry', name: '化学', avgScore: 80, completionRate: 84, engagement: 75, trend: 2.3 },
    { id: 'biology', name: '生物', avgScore: 75, completionRate: 79, engagement: 70, trend: -0.9 }
  ]
}

const engagementTrendData: Record<TimeRange, TrendPoint[]> = {
  week: [
    { id: 'mon', label: '周一', engagement: 82, taskCompletion: 88 },
    { id: 'tue', label: '周二', engagement: 85, taskCompletion: 90 },
    { id: 'wed', label: '周三', engagement: 88, taskCompletion: 92 },
    { id: 'thu', label: '周四', engagement: 84, taskCompletion: 89 },
    { id: 'fri', label: '周五', engagement: 86, taskCompletion: 91 }
  ],
  month: [
    { id: 'w1', label: '第1周', engagement: 78, taskCompletion: 84 },
    { id: 'w2', label: '第2周', engagement: 82, taskCompletion: 86 },
    { id: 'w3', label: '第3周', engagement: 85, taskCompletion: 88 },
    { id: 'w4', label: '第4周', engagement: 83, taskCompletion: 87 }
  ],
  term: [
    { id: 'm1', label: '9月', engagement: 74, taskCompletion: 80 },
    { id: 'm2', label: '10月', engagement: 78, taskCompletion: 83 },
    { id: 'm3', label: '11月', engagement: 81, taskCompletion: 85 },
    { id: 'm4', label: '12月', engagement: 83, taskCompletion: 87 }
  ]
}

const riskAlertsData: Record<TimeRange, RiskAlert[]> = {
  week: [
    { id: 'alert-1', student: '王浩', issue: '数学最近两次单元测试低于60分', level: 'critical', action: '安排一对一辅导并复盘错题' },
    { id: 'alert-2', student: '李雪', issue: '作业提交率 65%，课堂互动偏低', level: 'warning', action: '联系家长了解学习情况并给予鼓励' },
    { id: 'alert-3', student: '陈思', issue: '科学实验报告延期提交', level: 'warning', action: '提供模板示例，明确提交要求' }
  ],
  month: [
    { id: 'alert-1', student: '王浩', issue: '数学阶段性测试低于及格线', level: 'critical', action: '制定提分计划并跟踪进度' },
    { id: 'alert-2', student: '刘敏', issue: '物理课堂参与度低于 60%', level: 'warning', action: '指派课堂角色，提高参与感' }
  ],
  term: [
    { id: 'alert-1', student: '王浩', issue: '数学学期平均分 58，学习信心不足', level: 'critical', action: '安排学科导师结对帮扶' },
    { id: 'alert-2', student: '刘敏', issue: '理科综合作业完成率 68%', level: 'warning', action: '拆解任务并设置阶段目标' },
    { id: 'alert-3', student: '赵强', issue: '课堂迟到 3 次，注意力不集中', level: 'warning', action: '与班主任沟通生活作息情况' }
  ]
}

const focusStudentsData: Record<TimeRange, FocusStudent[]> = {
  week: [
    { id: 's-1', name: '王浩', className: '高一(1)班', riskLevel: 'high', progress: 54, nextStep: '今晚安排数学专项辅导，关注自信心建立' },
    { id: 's-2', name: '李雪', className: '高一(2)班', riskLevel: 'medium', progress: 68, nextStep: '跟进作业完成情况，提供学习激励' },
    { id: 's-3', name: '周晨', className: '高一(3)班', riskLevel: 'notice', progress: 72, nextStep: '提醒按时提交实验报告，提供模板' }
  ],
  month: [
    { id: 's-1', name: '王浩', className: '高一(1)班', riskLevel: 'high', progress: 58, nextStep: '持续开展错题本复盘，周五复查' },
    { id: 's-4', name: '刘敏', className: '高一(4)班', riskLevel: 'medium', progress: 64, nextStep: '鼓励课堂发言，给予积极反馈' }
  ],
  term: [
    { id: 's-1', name: '王浩', className: '高一(1)班', riskLevel: 'high', progress: 61, nextStep: '制定寒假提升计划，保持跟进' },
    { id: 's-4', name: '刘敏', className: '高一(4)班', riskLevel: 'medium', progress: 66, nextStep: '参与学习小组，跟踪参与度' },
    { id: 's-5', name: '赵强', className: '高一(2)班', riskLevel: 'notice', progress: 70, nextStep: '关注课堂纪律表现，及时反馈' }
  ]
}

const summaryCards = computed(() => summaryData[timeRange.value])
const subjectPerformance = computed(() => subjectPerformanceData[timeRange.value])
const engagementTrend = computed(() => engagementTrendData[timeRange.value])
const riskAlerts = computed(() => riskAlertsData[timeRange.value])
const focusStudents = computed(() => focusStudentsData[timeRange.value])

const averageEngagement = computed(() => {
  if (engagementTrend.value.length === 0) {
    return 0
  }
  const total = engagementTrend.value.reduce((sum, item) => sum + item.engagement, 0)
  return Math.round(total / engagementTrend.value.length)
})

const averageTaskCompletion = computed(() => {
  if (engagementTrend.value.length === 0) {
    return 0
  }
  const total = engagementTrend.value.reduce((sum, item) => sum + item.taskCompletion, 0)
  return Math.round(total / engagementTrend.value.length)
})

const criticalAlertCount = computed(() =>
  riskAlerts.value.filter(alert => alert.level === 'critical').length
)

const statusHeadline = computed(() =>
  criticalAlertCount.value > 0
    ? `有 ${criticalAlertCount.value} 名学生处于高风险，需要重点干预`
    : '暂无高风险学生，保持现有跟进节奏'
)

const lastUpdatedLabel = computed(() =>
  new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(lastUpdated.value)
)

const refreshData = () => {
  lastUpdated.value = new Date()
  ElMessage.success('学习分析数据已刷新')
}

const formatTrend = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`

const riskLevelTagType: Record<RiskLevel, 'danger' | 'warning' | 'info'> = {
  high: 'danger',
  medium: 'warning',
  notice: 'info'
}

const getRiskTagType = (level: RiskLevel) => riskLevelTagType[level]
</script>

<style scoped lang="scss">
.learning-analytics {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.analytics-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toolbar-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-secondary, #6b7280);
}

.toolbar-refresh {
  padding: 0;
}

.analytics-highlights {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.highlight {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--edu-surface-glass, rgba(255, 255, 255, 0.6));
  color: var(--text-primary, #1f2937);
}

.highlight--alert {
  background: rgba(244, 67, 54, 0.08);
  color: var(--edu-color-error-default, #e53935);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.summary-card {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 16px;
}

.summary-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: var(--edu-primary-soft, rgba(59, 130, 246, 0.12));
  color: var(--edu-primary-600, #2563eb);
}

.summary-card__icon--alerts {
  background: rgba(244, 67, 54, 0.12);
  color: var(--edu-color-error-default, #e53935);
}

.summary-card__content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-card__label {
  font-size: 14px;
  color: var(--text-secondary, #6b7280);
}

.summary-card__value {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
}

.summary-card__trend {
  font-size: 13px;
  color: var(--edu-color-success-default, #22c55e);
}

.summary-card__trend--down {
  color: var(--edu-color-error-default, #e53935);
}

.summary-card__hint {
  margin-left: 8px;
  color: var(--text-secondary, #6b7280);
}

.analytics-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

.metric {
  display: flex;
  align-items: center;
  gap: 8px;
}

.metric__value {
  font-weight: 600;
  color: var(--text-primary, #1f2937);
}

.metric__trend {
  font-size: 12px;
  color: var(--edu-color-success-default, #22c55e);
}

.metric__trend--down {
  color: var(--edu-color-error-default, #e53935);
}

.trend-chart {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  height: 200px;
  margin-bottom: 12px;
}

.trend-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.trend-bar__value {
  font-size: 14px;
  color: var(--text-primary, #1f2937);
}

.trend-bar__column {
  position: relative;
  width: 28px;
  height: 140px;
  border-radius: 14px;
  background: rgba(148, 163, 184, 0.16);
  overflow: hidden;
}

.trend-bar__fill {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(79, 70, 229, 0.9), rgba(129, 140, 248, 0.6));
}

.trend-bar__label {
  font-size: 13px;
  color: var(--text-secondary, #6b7280);
}

.trend-footer {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-secondary, #6b7280);
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item {
  padding: 12px;
  border-radius: 12px;
  background: rgba(59, 130, 246, 0.06);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.alert-item--critical {
  background: rgba(244, 67, 54, 0.08);
}

.alert-item__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
}

.alert-item__issue {
  font-size: 13px;
  color: var(--text-primary, #1f2937);
}

.alert-item__action {
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
}

.focus-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.focus-item {
  padding: 12px;
  border-radius: 12px;
  background: rgba(15, 118, 110, 0.06);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.focus-item__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.focus-item__name {
  font-weight: 600;
  color: var(--text-primary, #1f2937);
}

.focus-item__meta {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-secondary, #6b7280);
}

.focus-item__next {
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
}

@media (max-width: 960px) {
  .analytics-toolbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .trend-footer {
    flex-direction: column;
    gap: 6px;
  }
}
</style>
