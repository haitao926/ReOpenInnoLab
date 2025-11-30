<template>
  <div class="experience-monitoring-panel">
    <!-- 体验状态概览 -->
    <div class="monitoring-header">
      <div class="header-info">
        <h3>{{ experienceRun?.title || '体验监控' }}</h3>
        <div class="status-indicator" :class="`status--${experienceRun?.status}`">
          <div class="status-dot"></div>
          <span>{{ getStatusLabel(experienceRun?.status) }}</span>
        </div>
      </div>
      <div class="header-stats">
        <div class="stat-item">
          <div class="stat-value">{{ participantStats.total }}</div>
          <div class="stat-label">总人数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ participantStats.started }}</div>
          <div class="stat-label">已参与</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ participantStats.completed }}</div>
          <div class="stat-label">已完成</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ formatDuration(elapsedTime) }}</div>
          <div class="stat-label">运行时长</div>
        </div>
      </div>
    </div>

    <!-- 控制按钮 -->
    <div class="control-panel">
      <EduButton
        v-if="experienceRun?.status === 'ready'"
        variant="primary"
        :loading="actionLoading"
        @click="startExperience"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        开始体验
      </EduButton>
      <EduButton
        v-else-if="experienceRun?.status === 'running'"
        variant="outline"
        :loading="actionLoading"
        @click="pauseExperience"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="6" y="4" width="4" height="16" />
          <rect x="14" y="4" width="4" height="16" />
        </svg>
        暂停体验
      </EduButton>
      <EduButton
        v-else-if="experienceRun?.status === 'paused'"
        variant="primary"
        :loading="actionLoading"
        @click="resumeExperience"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        继续体验
      </EduButton>
      <EduButton
        variant="secondary"
        :loading="actionLoading"
        @click="showResults = true"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 11H3v10h6V11z" />
          <path d="M21 11h-6v10h6V11z" />
          <path d="M15 3H9v6h6V3z" />
          <line x1="3" y1="3" x2="21" y2="3" />
          <line x1="12" y1="3" x2="12" y2="9" />
          <line x1="12" y1="15" x2="12" y2="21" />
        </svg>
        查看结果
      </EduButton>
      <EduButton
        variant="outline"
        :loading="actionLoading"
        @click="showExportDialog = true"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        导出数据
      </EduButton>
    </div>

    <!-- 实时统计 -->
    <div class="stats-section">
      <div class="stats-grid">
        <!-- 测验统计 -->
        <EduCard v-if="experienceRun?.type === 'quiz'" title="测验统计" variant="default">
          <div class="quiz-stats">
            <div class="quiz-summary">
              <div class="summary-item">
                <div class="summary-label">平均分数</div>
                <div class="summary-value">{{ averageScore.toFixed(1) }}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">最高分</div>
                <div class="summary-value">{{ maxScore }}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">最低分</div>
                <div class="summary-value">{{ minScore }}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">完成率</div>
                <div class="summary-value">{{ completionRate }}%</div>
              </div>
            </div>
            <div class="question-analysis">
              <h4>题目分析</h4>
              <div
                v-for="(question, index) in questionStats"
                :key="index"
                class="question-stat"
              >
                <div class="question-header">
                  <span class="question-number">题目 {{ index + 1 }}</span>
                  <span class="question-type">{{ getQuestionTypeLabel(question.type) }}</span>
                </div>
                <div class="question-stats">
                  <div class="stat-row">
                    <span>正确率: {{ question.correctRate }}%</span>
                    <span>正确: {{ question.correctCount }}</span>
                    <span>错误: {{ question.incorrectCount }}</span>
                  </div>
                  <div v-if="question.type === 'multiple'" class="option-stats">
                    <div
                      v-for="(option, optIndex) in question.optionStats"
                      :key="optIndex"
                      class="option-stat"
                    >
                      <span class="option-label">{{ String.fromCharCode(65 + optIndex) }}</span>
                      <div class="option-bar">
                        <div
                          class="option-fill"
                          :style="{ width: `${(option.count / participantStats.started) * 100}%` }"
                        ></div>
                      </div>
                      <span class="option-count">{{ option.count }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </EduCard>

        <!-- 投票统计 -->
        <EduCard v-else-if="experienceRun?.type === 'poll'" title="投票统计" variant="default">
          <div class="poll-stats">
            <div
              v-for="(question, index) in pollStats"
              :key="index"
              class="poll-question"
            >
              <h4>{{ question.text }}</h4>
              <div class="poll-options">
                <div
                  v-for="(option, optIndex) in question.options"
                  :key="optIndex"
                  class="poll-option"
                >
                  <div class="option-info">
                    <span class="option-text">{{ option.text }}</span>
                    <span class="option-percentage">
                      {{ getPercentage(option.count, participantStats.started) }}%
                    </span>
                  </div>
                  <div class="option-bar">
                    <div
                      class="option-fill"
                      :style="{ width: `${getPercentage(option.count, participantStats.started)}%` }"
                    ></div>
                  </div>
                  <div class="option-count">{{ option.count }} 票</div>
                </div>
              </div>
            </div>
          </div>
        </EduCard>

        <!-- 互动视频统计 -->
        <EduCard v-else-if="experienceRun?.type === 'video'" title="视频统计" variant="default">
          <div class="video-stats">
            <div class="video-metrics">
              <div class="metric-item">
                <div class="metric-label">平均观看时长</div>
                <div class="metric-value">{{ formatDuration(avgWatchTime) }}</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">完成观看率</div>
                <div class="metric-value">{{ watchCompletionRate }}%</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">互动点击次数</div>
                <div class="metric-value">{{ totalInteractions }}</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">平均互动次数</div>
                <div class="metric-value">{{ avgInteractions.toFixed(1) }}</div>
              </div>
            </div>
            <div class="video-heatmap" v-if="videoHeatmap.length">
              <h4>观看进度热力图</h4>
              <div class="heatmap-container">
                <div class="heatmap-timeline">
                  <div
                    v-for="(point, index) in videoHeatmap"
                    :key="index"
                    class="heatmap-point"
                    :class="`heatmap--${getHeatmapLevel(point.intensity)}`"
                    :style="{ left: `${(point.time / videoDuration) * 100}%` }"
                    :title="`${point.viewers} 人在观看`"
                  ></div>
                </div>
                <div class="heatmap-labels">
                  <span>0:00</span>
                  <span>{{ formatDuration(videoDuration) }}</span>
                </div>
              </div>
            </div>
          </div>
        </EduCard>

        <!-- 自定义 HTML 统计 -->
        <EduCard v-else-if="experienceRun?.type === 'custom'" title="参与统计" variant="default">
          <div class="custom-stats">
            <div class="custom-metrics">
              <div class="metric-item">
                <div class="metric-label">活跃用户</div>
                <div class="metric-value">{{ activeUsers }}</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">总交互事件</div>
                <div class="metric-value">{{ totalEvents }}</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">平均停留时间</div>
                <div class="metric-value">{{ formatDuration(avgStayTime) }}</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">跳出率</div>
                <div class="metric-value">{{ bounceRate }}%</div>
              </div>
            </div>
            <div v-if="eventTypes.length" class="event-types">
              <h4>事件类型分布</h4>
              <div class="event-list">
                <div
                  v-for="eventType in eventTypes"
                  :key="eventType.type"
                  class="event-item"
                >
                  <span class="event-name">{{ eventType.type }}</span>
                  <div class="event-bar">
                    <div
                      class="event-fill"
                      :style="{ width: `${(eventType.count / totalEvents) * 100}%` }"
                    ></div>
                  </div>
                  <span class="event-count">{{ eventType.count }}</span>
                </div>
              </div>
            </div>
          </div>
        </EduCard>
      </div>
    </div>

    <!-- 参与者列表 -->
    <div class="participants-section">
      <EduCard title="参与者详情" variant="default">
        <div class="participants-toolbar">
          <EduInput
            v-model="searchQuery"
            placeholder="搜索学生姓名..."
            :clearable="true"
            size="sm"
          >
            <template #prefix>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </template>
          </EduInput>
          <select v-model="statusFilter" class="filter-select">
            <option value="">全部状态</option>
            <option value="not-started">未开始</option>
            <option value="in-progress">进行中</option>
            <option value="completed">已完成</option>
          </select>
          <select v-model="sortBy" class="sort-select">
            <option value="name">按姓名</option>
            <option value="status">按状态</option>
            <option value="score">按分数</option>
            <option value="startTime">按开始时间</option>
          </select>
        </div>

        <div class="participants-list" v-loading="loadingParticipants">
          <div
            v-for="participant in filteredParticipants"
            :key="participant.participantId"
            class="participant-item"
            :class="`participant--${participant.status}`"
            @click="selectParticipant(participant)"
          >
            <div class="participant-avatar">
              <img
                v-if="participant.avatar"
                :src="participant.avatar"
                :alt="participant.displayName"
              />
              <div v-else class="avatar-placeholder">
                {{ participant.displayName.charAt(0) }}
              </div>
            </div>
            <div class="participant-info">
              <div class="participant-name">{{ participant.displayName }}</div>
              <div class="participant-status">{{ getParticipantStatusText(participant.status) }}</div>
              <div v-if="participant.startedAt" class="participant-time">
                开始时间: {{ formatTime(participant.startedAt) }}
              </div>
              <div v-if="participant.score !== undefined" class="participant-score">
                得分: {{ participant.score }} / {{ maxPossibleScore }}
              </div>
            </div>
            <div class="participant-actions">
              <EduButton
                v-if="participant.status === 'completed'"
                variant="text"
                size="sm"
                @click.stop="viewParticipantResult(participant)"
              >
                查看结果
              </EduButton>
            </div>
          </div>
        </div>
      </EduCard>
    </div>

    <!-- 结果展示对话框 -->
    <teleport to="body">
      <div v-if="showResults" class="dialog-overlay" @click="showResults = false">
        <div class="dialog dialog--large" @click.stop>
          <div class="dialog-header">
            <h3>体验结果</h3>
            <EduButton variant="text" @click="showResults = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </EduButton>
          </div>
          <div class="dialog-body">
            <ExperienceResults
              v-if="experienceRun"
              :run-id="experienceRun.id"
              :type="experienceRun.type"
            />
          </div>
        </div>
      </div>
    </teleport>

    <!-- 导出数据对话框 -->
    <teleport to="body">
      <div v-if="showExportDialog" class="dialog-overlay" @click="showExportDialog = false">
        <div class="dialog" @click.stop>
          <div class="dialog-header">
            <h3>导出数据</h3>
            <EduButton variant="text" @click="showExportDialog = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </EduButton>
          </div>
          <div class="dialog-body">
            <div class="export-options">
              <h4>导出格式</h4>
              <div class="format-options">
                <label class="radio-label">
                  <input type="radio" v-model="exportFormat" value="xlsx" />
                  Excel (.xlsx)
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="exportFormat" value="csv" />
                  CSV (.csv)
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="exportFormat" value="json" />
                  JSON (.json)
                </label>
              </div>

              <h4>导出内容</h4>
              <div class="content-options">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="exportContent.includeSummary" />
                  包含统计摘要
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="exportContent.includeDetails" />
                  包含详细记录
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="exportContent.includeTimestamps" />
                  包含时间戳
                </label>
              </div>
            </div>
          </div>
          <div class="dialog-footer">
            <EduButton variant="outline" @click="showExportDialog = false">取消</EduButton>
            <EduButton variant="primary" :loading="actionLoading" @click="confirmExport">
              导出
            </EduButton>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { EduButton, EduInput, EduCard } from '@reopeninnolab/ui-kit'
import { ExperienceApiService } from '@/api/experience'
import ExperienceResults from './ExperienceResults.vue'
import type { ExperienceRun, ExperienceParticipant } from '@/types/experience'

const props = defineProps<{
    runId: string
  }>()

const emit = defineEmits<{
    participantSelected: [participant: ExperienceParticipant]
  }>()

// 状态
const experienceRun = ref<ExperienceRun>()
const participants = ref<ExperienceParticipant[]>([])
const loadingParticipants = ref(false)
const elapsedTime = ref(0)
const actionLoading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const sortBy = ref('name')
const showResults = ref(false)
const showExportDialog = ref(false)
const exportFormat = ref('xlsx')
const exportContent = ref({
  includeSummary: true,
  includeDetails: true,
  includeTimestamps: false
})

// 统计数据
const quizStats = ref<any[]>([])
const pollStats = ref<any[]>([])
const videoHeatmap = ref<any[]>([])
const videoDuration = ref(0)
const eventTypes = ref<any[]>([])
const avgWatchTime = ref(0)
const totalInteractions = ref(0)
const activeUsers = ref(0)
const totalEvents = ref(0)
const avgStayTime = ref(0)

// WebSocket 连接
let ws: WebSocket | null = null
let timer: number | null = null

// 计算属性
const participantStats = computed(() => {
  const total = participants.value.length
  const started = participants.value.filter(p => p.status !== 'not-started').length
  const completed = participants.value.filter(p => p.status === 'completed').length
  const inProgress = participants.value.filter(p => p.status === 'in-progress').length
  const notStarted = total - started

  return {
    total,
    started,
    completed,
    inProgress,
    notStarted
  }
})

const averageScore = computed(() => {
  const completed = participants.value.filter(p => p.status === 'completed' && p.score !== undefined)
  if (completed.length === 0) return 0
  return completed.reduce((sum, p) => sum + (p.score || 0), 0) / completed.length
})

const maxScore = computed(() => {
  const scores = participants.value.filter(p => p.score !== undefined).map(p => p.score || 0)
  return scores.length > 0 ? Math.max(...scores) : 0
})

const minScore = computed(() => {
  const scores = participants.value.filter(p => p.score !== undefined).map(p => p.score || 0)
  return scores.length > 0 ? Math.min(...scores) : 0
})

const maxPossibleScore = computed(() => {
  // 根据体验类型计算最高可能分数
  if (experienceRun.value?.type === 'quiz') {
    return quizStats.value.reduce((sum, q) => sum + (q.points || 10), 0)
  }
  return 100
})

const completionRate = computed(() => {
  const total = participantStats.value.total
  if (total === 0) return 0
  return Math.round((participantStats.value.completed / total) * 100)
})

const watchCompletionRate = computed(() => {
  const completed = participants.value.filter(p => p.progress === 100).length
  const started = participantStats.value.started
  return started > 0 ? Math.round((completed / started) * 100) : 0
})

const avgInteractions = computed(() => {
  const total = participantStats.value.started
  return total > 0 ? totalInteractions.value / total : 0
})

const bounceRate = computed(() => {
  // 跳出率 = 只访问一次就离开的用户 / 总用户
  const bounced = participants.value.filter(p => {
    if (!p.startedAt || !p.lastActivityAt) return false
    const duration = new Date(p.lastActivityAt).getTime() - new Date(p.startedAt).getTime()
    return duration < 30000 // 30秒内离开视为跳出
  }).length
  const total = participantStats.value.total
  return total > 0 ? Math.round((bounced / total) * 100) : 0
})

const filteredParticipants = computed(() => {
  let result = [...participants.value]

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(p =>
      p.displayName.toLowerCase().includes(query)
    )
  }

  // 状态过滤
  if (statusFilter.value) {
    result = result.filter(p => p.status === statusFilter.value)
  }

  // 排序
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.displayName.localeCompare(b.displayName)
      case 'status':
        return a.status.localeCompare(b.status)
      case 'score':
        const scoreA = a.score || 0
        const scoreB = b.score || 0
        return scoreB - scoreA
      case 'startTime':
        if (!a.startedAt && !b.startedAt) return 0
        if (!a.startedAt) return 1
        if (!b.startedAt) return -1
        return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      default:
        return 0
    }
  })

  return result
})

// 方法
const loadExperienceRun = async () => {
  try {
    experienceRun.value = await ExperienceApiService.getExperienceRun(props.runId)
    participants.value = await ExperienceApiService.getExperienceRunParticipants(props.runId)
    await loadStatistics()
  } catch (error) {
    console.error('加载体验运行信息失败:', error)
  }
}

const loadParticipants = async () => {
  loadingParticipants.value = true
  try {
    participants.value = await ExperienceApiService.getExperienceRunParticipants(props.runId)
  } catch (error) {
    console.error('加载参与者信息失败:', error)
  } finally {
    loadingParticipants.value = false
  }
}

const loadStatistics = async () => {
  try {
    const stats = await ExperienceApiService.getExperienceRunStatistics(props.runId)

    // 根据体验类型加载不同的统计
    if (experienceRun.value?.type === 'quiz') {
      quizStats.value = stats.questions || []
    } else if (experienceRun.value?.type === 'poll') {
      pollStats.value = stats.questions || []
    } else if (experienceRun.value?.type === 'video') {
      videoHeatmap.value = stats.heatmap || []
      videoDuration.value = stats.duration || 0
      avgWatchTime.value = stats.avgWatchTime || 0
      totalInteractions.value = stats.totalInteractions || 0
    } else if (experienceRun.value?.type === 'custom') {
      eventTypes.value = stats.eventTypes || []
      activeUsers.value = stats.activeUsers || 0
      totalEvents.value = stats.totalEvents || 0
      avgStayTime.value = stats.avgStayTime || 0
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const connectWebSocket = () => {
  const wsUrl = `${import.meta.env.VITE_WS_URL}/experiences/runs/${props.runId}/monitor`
  ws = new WebSocket(wsUrl)

  ws.onopen = () => {
    console.log('WebSocket 连接已建立')
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    handleWebSocketMessage(data)
  }

  ws.onerror = (error) => {
    console.error('WebSocket 错误:', error)
  }

  ws.onclose = () => {
    console.log('WebSocket 连接已关闭')
    // 5秒后重连
    setTimeout(connectWebSocket, 5000)
  }
}

const handleWebSocketMessage = (data: any) => {
  switch (data.type) {
    case 'runStatusChanged':
      if (experienceRun.value) {
        experienceRun.value.status = data.payload.status
        experienceRun.value.updatedAt = data.payload.timestamp
      }
      break

    case 'participantJoined':
      participants.value.push(data.payload.participant)
      break

    case 'participantUpdated':
      const index = participants.value.findIndex(
        p => p.participantId === data.payload.participant.participantId
      )
      if (index > -1) {
        participants.value[index] = data.payload.participant
      }
      break

    case 'statisticsUpdated':
      // 实时更新统计数据
      if (data.payload.type === 'quiz') {
        updateQuizStatistics(data.payload.data)
      } else if (data.payload.type === 'poll') {
        updatePollStatistics(data.payload.data)
      }
      break
  }
}

const updateQuizStatistics = (data: any) => {
  // 更新测验统计数据
  if (data.questionStats) {
    data.questionStats.forEach((stat: any, index: number) => {
      if (quizStats.value[index]) {
        Object.assign(quizStats.value[index], stat)
      }
    })
  }
}

const updatePollStatistics = (data: any) => {
  // 更新投票统计数据
  if (data.questionStats) {
    data.questionStats.forEach((stat: any, index: number) => {
      if (pollStats.value[index]) {
        Object.assign(pollStats.value[index], stat)
      }
    })
  }
}

const startTimer = () => {
  timer = setInterval(() => {
    elapsedTime.value++
  }, 1000)
}

const stopTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const startExperience = async () => {
  actionLoading.value = true
  try {
    await ExperienceApiService.startExperienceRun(props.runId)
  } catch (error) {
    console.error('开始体验失败:', error)
  } finally {
    actionLoading.value = false
  }
}

const pauseExperience = async () => {
  actionLoading.value = true
  try {
    await ExperienceApiService.pauseExperienceRun(props.runId)
  } catch (error) {
    console.error('暂停体验失败:', error)
  } finally {
    actionLoading.value = false
  }
}

const resumeExperience = async () => {
  actionLoading.value = true
  try {
    await ExperienceApiService.resumeExperienceRun(props.runId)
  } catch (error) {
    console.error('继续体验失败:', error)
  } finally {
    actionLoading.value = false
  }
}

const confirmExport = async () => {
  actionLoading.value = true
  try {
    const downloadUrl = await ExperienceApiService.exportExperienceRunData(props.runId, {
      format: exportFormat.value,
      content: exportContent.value
    })

    // 触发下载
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `experience-${props.runId}.${exportFormat.value}`
    link.click()

    showExportDialog.value = false
  } catch (error) {
    console.error('导出数据失败:', error)
  } finally {
    actionLoading.value = false
  }
}

const selectParticipant = (participant: ExperienceParticipant) => {
  emit('participantSelected', participant)
}

const viewParticipantResult = (participant: ExperienceParticipant) => {
  // TODO: 查看参与者详细结果
  console.log('查看结果:', participant)
}

const getStatusLabel = (status?: string): string => {
  const labels: Record<string, string> = {
    ready: '准备中',
    running: '运行中',
    paused: '已暂停',
    completed: '已完成',
    error: '发生错误'
  }
  return labels[status || ''] || status || ''
}

const getParticipantStatusText = (status: string): string => {
  const labels: Record<string, string> = {
    'not-started': '未开始',
    'in-progress': '进行中',
    'completed': '已完成',
    'error': '遇到错误'
  }
  return labels[status] || status
}

const getQuestionTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    single: '单选',
    multiple: '多选',
    'true-false': '判断',
    fill: '填空',
    essay: '问答'
  }
  return labels[type] || type
}

const getPercentage = (value: number, total: number): number => {
  return total > 0 ? Math.round((value / total) * 100) : 0
}

const getHeatmapLevel = (intensity: number): string => {
  if (intensity >= 0.8) return 'high'
  if (intensity >= 0.5) return 'medium'
  return 'low'
}

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours > 0 ? `${hours}:` : ''}${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

const formatTime = (timestamp: string): string => {
  return new Date(timestamp).toLocaleTimeString()
}

// 生命周期
onMounted(() => {
  loadExperienceRun()
  loadParticipants()
  connectWebSocket()
  startTimer()
})

onUnmounted(() => {
  if (ws) {
    ws.close()
  }
  stopTimer()
})

// 监听运行状态变化
watch(
  () => experienceRun.value?.status,
  (newStatus) => {
    if (newStatus === 'running') {
      startTimer()
    } else if (newStatus === 'completed' || newStatus === 'error') {
      stopTimer()
    }
  }
)
</script>

<style lang="scss" scoped>
  .experience-monitoring-panel {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
    height: 100%;
    overflow-y: auto;
  }

  .monitoring-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--spacing-lg);

    .header-info {
      h3 {
        margin: 0 0 var(--spacing-sm) 0;
        color: var(--text-primary);
      }

      .status-indicator {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: var(--radius-full);

          .status--ready & {
            background-color: var(--edu-color-gray-400);
          }

          .status--running & {
            background-color: var(--edu-color-success-default);
            animation: pulse 2s infinite;
          }

          .status--paused & {
            background-color: var(--edu-color-warning-default);
          }

          .status--completed & {
            background-color: var(--edu-color-blue-500);
          }

          .status--error & {
            background-color: var(--edu-color-error-default);
          }
        }
      }
    }

    .header-stats {
      display: flex;
      gap: var(--spacing-lg);

      .stat-item {
        text-align: center;

        .stat-value {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-bold);
          color: var(--edu-primary-500);
        }

        .stat-label {
          font-size: var(--font-size-xs);
          color: var(--text-secondary);
        }
      }
    }
  }

  .control-panel {
    display: flex;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
  }

  .stats-section {
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-lg);
    }
  }

  .quiz-stats {
    .quiz-summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--spacing-base);
      margin-bottom: var(--spacing-lg);

      .summary-item {
        text-align: center;
        padding: var(--spacing-sm);
        background-color: var(--edu-color-gray-50);
        border-radius: var(--radius-base);

        .summary-label {
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
          margin-bottom: var(--spacing-xs);
        }

        .summary-value {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-bold);
          color: var(--edu-primary-500);
        }
      }
    }

    .question-analysis {
      h4 {
        margin: 0 0 var(--spacing-base) 0;
        color: var(--text-primary);
      }

      .question-stat {
        margin-bottom: var(--spacing-lg);

        .question-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--spacing-sm);

          .question-number {
            font-weight: var(--font-weight-medium);
            color: var(--text-primary);
          }

          .question-type {
            font-size: var(--font-size-sm);
            color: var(--text-secondary);
          }
        }

        .stat-row {
          display: flex;
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-sm);
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
        }

        .option-stats {
          .option-stat {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
            margin-bottom: var(--spacing-xs);

            .option-label {
              width: 24px;
              height: 24px;
              display: flex;
              align-items: center;
              justify-content: center;
              background-color: var(--edu-color-blue-500);
              color: white;
              border-radius: var(--radius-base);
              font-size: var(--font-size-xs);
              font-weight: var(--font-weight-bold);
            }

            .option-bar {
              flex: 1;
              height: 8px;
              background-color: var(--edu-color-gray-200);
              border-radius: var(--radius-full);
              overflow: hidden;

              .option-fill {
                height: 100%;
                background-color: var(--edu-color-blue-500);
                transition: width var(--edu-duration-normal) var(--edu-easing-in-out);
              }
            }

            .option-count {
              font-size: var(--font-size-xs);
              color: var(--text-secondary);
              min-width: 30px;
              text-align: right;
            }
          }
        }
      }
    }
  }

  .poll-stats {
    .poll-question {
      margin-bottom: var(--spacing-lg);

      h4 {
        margin: 0 0 var(--spacing-base) 0;
        color: var(--text-primary);
      }

      .poll-option {
        margin-bottom: var(--spacing-sm);

        .option-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: var(--spacing-xs);

          .option-text {
            color: var(--text-primary);
          }

          .option-percentage {
            font-weight: var(--font-weight-medium);
            color: var(--edu-primary-500);
          }
        }

        .option-bar {
          height: 24px;
          background-color: var(--edu-color-gray-200);
          border-radius: var(--radius-base);
          overflow: hidden;

          .option-fill {
            height: 100%;
            background-color: var(--edu-primary-500);
            transition: width var(--edu-duration-normal) var(--edu-easing-in-out);
          }
        }

        .option-count {
          font-size: var(--font-size-xs);
          color: var(--text-secondary);
          margin-top: var(--spacing-xs);
        }
      }
    }
  }

  .video-stats {
    .video-metrics {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--spacing-base);
      margin-bottom: var(--spacing-lg);

      .metric-item {
        text-align: center;
        padding: var(--spacing-sm);
        background-color: var(--edu-color-gray-50);
        border-radius: var(--radius-base);

        .metric-label {
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
          margin-bottom: var(--spacing-xs);
        }

        .metric-value {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-bold);
          color: var(--edu-primary-500);
        }
      }
    }

    .video-heatmap {
      h4 {
        margin: 0 0 var(--spacing-base) 0;
        color: var(--text-primary);
      }

      .heatmap-container {
        .heatmap-timeline {
          position: relative;
          height: 40px;
          background-color: var(--edu-color-gray-200);
          border-radius: var(--radius-base);
          overflow: hidden;

          .heatmap-point {
            position: absolute;
            top: 0;
            bottom: 0;
            width: 4px;
            transform: translateX(-50%);

            &--high {
              background-color: var(--edu-color-red-500);
            }

            &--medium {
              background-color: var(--edu-color-yellow-500);
            }

            &--low {
              background-color: var(--edu-color-green-500);
            }
          }
        }

        .heatmap-labels {
          display: flex;
          justify-content: space-between;
          margin-top: var(--spacing-xs);
          font-size: var(--font-size-xs);
          color: var(--text-secondary);
        }
      }
    }
  }

  .custom-stats {
    .custom-metrics {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--spacing-base);
      margin-bottom: var(--spacing-lg);

      .metric-item {
        text-align: center;
        padding: var(--spacing-sm);
        background-color: var(--edu-color-gray-50);
        border-radius: var(--radius-base);

        .metric-label {
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
          margin-bottom: var(--spacing-xs);
        }

        .metric-value {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-bold);
          color: var(--edu-primary-500);
        }
      }
    }

    .event-types {
      h4 {
        margin: 0 0 var(--spacing-base) 0;
        color: var(--text-primary);
      }

      .event-list {
        .event-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-sm);

          .event-name {
            min-width: 100px;
            font-size: var(--font-size-sm);
            color: var(--text-primary);
          }

          .event-bar {
            flex: 1;
            height: 8px;
            background-color: var(--edu-color-gray-200);
            border-radius: var(--radius-full);
            overflow: hidden;

            .event-fill {
              height: 100%;
              background-color: var(--edu-primary-500);
              transition: width var(--edu-duration-normal) var(--edu-easing-in-out);
            }
          }

          .event-count {
            font-size: var(--font-size-xs);
            color: var(--text-secondary);
            min-width: 40px;
            text-align: right;
          }
        }
      }
    }
  }

  .participants-section {
    flex: 1;

    .participants-toolbar {
      display: flex;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-base);
    }

    .filter-select,
    .sort-select {
      padding: var(--spacing-xs) var(--spacing-sm);
      border: 1px solid var(--edu-color-gray-300);
      border-radius: var(--radius-base);
      background-color: var(--bg-elevated);
      color: var(--text-primary);
    }

    .participants-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .participant-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-base);
      padding: var(--spacing-base);
      border-radius: var(--radius-base);
      cursor: pointer;
      transition: background-color var(--edu-duration-fast) var(--edu-easing-in-out);

      &:hover {
        background-color: var(--edu-color-gray-50);
      }

      &--completed {
        .participant-status {
          color: var(--edu-color-success-default);
        }
      }
    }

    .participant-avatar {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-full);
      overflow: hidden;
      flex-shrink: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .avatar-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--edu-color-gray-300);
        color: var(--text-secondary);
        font-weight: var(--font-weight-bold);
      }
    }

    .participant-info {
      flex: 1;

      .participant-name {
        font-weight: var(--font-weight-medium);
        color: var(--text-primary);
      }

      .participant-status {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
      }

      .participant-time,
      .participant-score {
        font-size: var(--font-size-xs);
        color: var(--text-tertiary);
      }
    }
  }

  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .dialog {
    background-color: var(--bg-elevated);
    border-radius: var(--radius-lg);
    width: 90%;
    max-width: 600px;
    max-height: 80%;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    &--large {
      max-width: 1200px;
      width: 95%;
      max-height: 90%;
    }
  }

  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-lg);
    border-bottom: 1px solid var(--border-color);

    h3 {
      margin: 0;
      color: var(--text-primary);
    }
  }

  .dialog-body {
    padding: var(--spacing-lg);
    flex: 1;
    overflow-y: auto;
  }

  .dialog-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--spacing-sm);
    padding: var(--spacing-lg);
    border-top: 1px solid var(--border-color);
  }

  .export-options {
    h4 {
      margin: 0 0 var(--spacing-base) 0;
      color: var(--text-primary);
      font-size: var(--font-size-base);
    }

    .format-options,
    .content-options {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-lg);
    }

    .radio-label,
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      cursor: pointer;

      input[type='radio'],
      input[type='checkbox'] {
        width: 18px;
        height: 18px;
      }
    }
  }

  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
    100% {
      opacity: 1;
    }
  }
</style>