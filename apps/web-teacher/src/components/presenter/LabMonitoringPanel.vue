<template>
  <div class="lab-monitoring-panel">
    <!-- 实验状态概览 -->
    <div class="monitoring-header">
      <div class="header-info">
        <h3>{{ labRun?.title || '实验监控' }}</h3>
        <div class="status-indicator" :class="`status--${labRun?.status}`">
          <div class="status-dot"></div>
          <span>{{ getStatusLabel(labRun?.status) }}</span>
        </div>
      </div>
      <div class="header-stats">
        <div class="stat-item">
          <div class="stat-value">{{ participantStats.total }}</div>
          <div class="stat-label">总人数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ participantStats.started }}</div>
          <div class="stat-label">已开始</div>
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
        v-if="labRun?.status === 'ready'"
        variant="primary"
        :loading="actionLoading"
        @click="startExperiment"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        开始实验
      </EduButton>
      <EduButton
        v-else-if="labRun?.status === 'running'"
        variant="outline"
        :loading="actionLoading"
        @click="pauseExperiment"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="6" y="4" width="4" height="16" />
          <rect x="14" y="4" width="4" height="16" />
        </svg>
        暂停实验
      </EduButton>
      <EduButton
        v-else-if="labRun?.status === 'paused'"
        variant="primary"
        :loading="actionLoading"
        @click="resumeExperiment"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        继续实验
      </EduButton>
      <EduButton
        variant="secondary"
        :loading="actionLoading"
        @click="showExtendDialog = true"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2v20M2 12h20" />
        </svg>
        延长时间
      </EduButton>
      <EduButton
        variant="outline"
        :loading="actionLoading"
        @click="showCollectDialog = true"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        收集结果
      </EduButton>
    </div>

    <!-- 进度统计 -->
    <div class="progress-section">
      <EduCard title="整体进度" variant="default">
        <div class="progress-stats">
          <div class="overall-progress">
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: `${overallProgress}%` }"
              ></div>
            </div>
            <div class="progress-text">{{ overallProgress }}% 完成</div>
          </div>
          <div class="progress-breakdown">
            <div class="progress-item">
              <div class="progress-label">未开始</div>
              <div class="progress-count">{{ participantStats.notStarted }}</div>
            </div>
            <div class="progress-item">
              <div class="progress-label">进行中</div>
              <div class="progress-count">{{ participantStats.inProgress }}</div>
            </div>
            <div class="progress-item">
              <div class="progress-label">已完成</div>
              <div class="progress-count">{{ participantStats.completed }}</div>
            </div>
            <div class="progress-item">
              <div class="progress-label">遇到错误</div>
              <div class="progress-count">{{ participantStats.errored }}</div>
            </div>
          </div>
        </div>
      </EduCard>
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
            <option value="started">已开始</option>
            <option value="in-progress">进行中</option>
            <option value="completed">已完成</option>
            <option value="error">遇到错误</option>
          </select>
          <select v-model="sortBy" class="sort-select">
            <option value="name">按姓名</option>
            <option value="status">按状态</option>
            <option value="progress">按进度</option>
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
            </div>
            <div class="participant-progress">
              <div class="progress-circle">
                <svg viewBox="0 0 36 36">
                  <path
                    class="progress-bg"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    class="progress-bar-circle"
                    :stroke-dasharray="`${participant.progress || 0}, 100`"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div class="progress-value">{{ Math.round(participant.progress || 0) }}%</div>
              </div>
            </div>
            <div class="participant-actions">
              <EduButton
                v-if="participant.status === 'error'"
                variant="text"
                size="sm"
                @click.stop="resetParticipant(participant)"
              >
                重置
              </EduButton>
              <EduButton
                v-if="participant.status === 'in-progress'"
                variant="text"
                size="sm"
                @click.stop="viewParticipantDetail(participant)"
              >
                详情
              </EduButton>
            </div>
          </div>
        </div>
      </EduCard>
    </div>

    <!-- 错误提醒 -->
    <div v-if="errorList.length" class="error-section">
      <EduCard title="错误提醒" variant="default">
        <div class="error-list">
          <div
            v-for="error in errorList"
            :key="error.id"
            class="error-item"
            @click="selectError(error)"
          >
            <div class="error-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div class="error-info">
              <div class="error-student">{{ error.studentName }}</div>
              <div class="error-message">{{ error.errorMessage }}</div>
              <div class="error-time">{{ formatTime(error.timestamp) }}</div>
            </div>
            <div class="error-actions">
              <EduButton variant="text" size="sm" @click.stop="viewErrorDetail(error)">
                查看详情
              </EduButton>
            </div>
          </div>
        </div>
      </EduCard>
    </div>

    <!-- 延长时间对话框 -->
    <teleport to="body">
      <div v-if="showExtendDialog" class="dialog-overlay" @click="showExtendDialog = false">
        <div class="dialog" @click.stop>
          <div class="dialog-header">
            <h3>延长时间</h3>
            <EduButton variant="text" @click="showExtendDialog = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </EduButton>
          </div>
          <div class="dialog-body">
            <div class="form-group">
              <label>延长时长（分钟）</label>
              <EduInput
                v-model.number="extendMinutes"
                type="number"
                :min="1"
                :max="120"
                placeholder="请输入延长的分钟数"
              />
            </div>
            <div class="form-group">
              <label>原因（可选）</label>
              <textarea
                v-model="extendReason"
                class="form-textarea"
                placeholder="请说明延长时间的原因"
                rows="3"
              ></textarea>
            </div>
          </div>
          <div class="dialog-footer">
            <EduButton variant="outline" @click="showExtendDialog = false">取消</EduButton>
            <EduButton variant="primary" :loading="actionLoading" @click="confirmExtend">
              确认延长
            </EduButton>
          </div>
        </div>
      </div>
    </teleport>

    <!-- 收集结果对话框 -->
    <teleport to="body">
      <div v-if="showCollectDialog" class="dialog-overlay" @click="showCollectDialog = false">
        <div class="dialog" @click.stop>
          <div class="dialog-header">
            <h3>收集结果</h3>
            <EduButton variant="text" @click="showCollectDialog = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </EduButton>
          </div>
          <div class="dialog-body">
            <div class="collect-options">
              <label class="checkbox-label">
                <input type="checkbox" v-model="collectOptions.includeIncomplete" />
                包含未完成的实验结果
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="collectOptions.includeErrors" />
                包含错误日志
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="collectOptions.generateReport" />
                生成统计报告
              </label>
            </div>
          </div>
          <div class="dialog-footer">
            <EduButton variant="outline" @click="showCollectDialog = false">取消</EduButton>
            <EduButton variant="primary" :loading="actionLoading" @click="confirmCollect">
              开始收集
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
import { LabApiService } from '@/api/lab'
import type { LabRun, LabParticipant } from '@/types/experiment'

const props = defineProps<{
    runId: string
  }>()

const emit = defineEmits<{
    participantSelected: [participant: LabParticipant]
    errorSelected: [error: any]
  }>()

// 状态
const labRun = ref<LabRun>()
const participants = ref<LabParticipant[]>([])
const loadingParticipants = ref(false)
const elapsedTime = ref(0)
const actionLoading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const sortBy = ref('name')
const errorList = ref<any[]>([])
const showExtendDialog = ref(false)
const showCollectDialog = ref(false)
const extendMinutes = ref(15)
const extendReason = ref('')
const collectOptions = ref({
  includeIncomplete: false,
  includeErrors: true,
  generateReport: true
})

// WebSocket 连接
let ws: WebSocket | null = null
let timer: number | null = null

// 计算属性
const participantStats = computed(() => {
  const total = participants.value.length
  const started = participants.value.filter(p => p.status !== 'not-started').length
  const inProgress = participants.value.filter(p => p.status === 'in-progress').length
  const completed = participants.value.filter(p => p.status === 'completed').length
  const errored = participants.value.filter(p => p.status === 'error').length
  const notStarted = total - started

  return {
    total,
    started,
    inProgress,
    completed,
    errored,
    notStarted
  }
})

const overallProgress = computed(() => {
  const total = participants.value.length
  if (total === 0) return 0
  const completed = participants.value.filter(p => p.status === 'completed').length
  return Math.round((completed / total) * 100)
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
      case 'progress':
        return (b.progress || 0) - (a.progress || 0)
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
const loadLabRun = async () => {
  try {
    labRun.value = await LabApiService.getLabRun(props.runId)
    participants.value = await LabApiService.getLabRunParticipants(props.runId)
  } catch (error) {
    console.error('加载实验运行信息失败:', error)
  }
}

const loadParticipants = async () => {
  loadingParticipants.value = true
  try {
    participants.value = await LabApiService.getLabRunParticipants(props.runId)
  } catch (error) {
    console.error('加载参与者信息失败:', error)
  } finally {
    loadingParticipants.value = false
  }
}

const connectWebSocket = () => {
  const wsUrl = `${import.meta.env.VITE_WS_URL}/labs/runs/${props.runId}/monitor`
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
      if (labRun.value) {
        labRun.value.status = data.payload.status
        labRun.value.updatedAt = data.payload.timestamp
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

    case 'participantError':
      const error = {
        id: Date.now().toString(),
        participantId: data.payload.participantId,
        studentName: data.payload.displayName,
        errorMessage: data.payload.error,
        timestamp: data.payload.timestamp
      }
      errorList.value.unshift(error)
      if (errorList.value.length > 50) {
        errorList.value.pop()
      }
      break

    case 'progressUpdate':
      const progressIndex = participants.value.findIndex(
        p => p.participantId === data.payload.participantId
      )
      if (progressIndex > -1) {
        participants.value[progressIndex].progress = data.payload.progress
      }
      break
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

const startExperiment = async () => {
  actionLoading.value = true
  try {
    await LabApiService.startLabRun(props.runId)
  } catch (error) {
    console.error('开始实验失败:', error)
  } finally {
    actionLoading.value = false
  }
}

const pauseExperiment = async () => {
  actionLoading.value = true
  try {
    await LabApiService.pauseLabRun(props.runId)
  } catch (error) {
    console.error('暂停实验失败:', error)
  } finally {
    actionLoading.value = false
  }
}

const resumeExperiment = async () => {
  actionLoading.value = true
  try {
    await LabApiService.resumeLabRun(props.runId)
  } catch (error) {
    console.error('继续实验失败:', error)
  } finally {
    actionLoading.value = false
  }
}

const confirmExtend = async () => {
  actionLoading.value = true
  try {
    await LabApiService.extendLabRun(props.runId, {
      minutes: extendMinutes.value,
      reason: extendReason.value
    })
    showExtendDialog.value = false
  } catch (error) {
    console.error('延长时间失败:', error)
  } finally {
    actionLoading.value = false
  }
}

const confirmCollect = async () => {
  actionLoading.value = true
  try {
    const taskId = await LabApiService.collectLabRunResults(props.runId, collectOptions.value)
    showCollectDialog.value = false
    // TODO: 显示收集进度
    console.log('收集任务ID:', taskId)
  } catch (error) {
    console.error('收集结果失败:', error)
  } finally {
    actionLoading.value = false
  }
}

const selectParticipant = (participant: LabParticipant) => {
  emit('participantSelected', participant)
}

const selectError = (error: any) => {
  emit('errorSelected', error)
}

const viewParticipantDetail = (participant: LabParticipant) => {
  // TODO: 查看参与者详情
  console.log('查看详情:', participant)
}

const viewErrorDetail = (error: any) => {
  // TODO: 查看错误详情
  console.log('查看错误详情:', error)
}

const resetParticipant = async (participant: LabParticipant) => {
  try {
    await LabApiService.resetLabRunParticipant(props.runId, participant.participantId)
  } catch (error) {
    console.error('重置参与者失败:', error)
  }
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
    'started': '已开始',
    'in-progress': '进行中',
    'completed': '已完成',
    'error': '遇到错误'
  }
  return labels[status] || status
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
  loadLabRun()
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
  () => labRun.value?.status,
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
  .lab-monitoring-panel {
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

  .progress-section {
    .progress-stats {
      .overall-progress {
        display: flex;
        align-items: center;
        gap: var(--spacing-base);
        margin-bottom: var(--spacing-lg);

        .progress-bar {
          flex: 1;
          height: 12px;
          background-color: var(--edu-color-gray-200);
          border-radius: var(--radius-full);
          overflow: hidden;

          .progress-fill {
            height: 100%;
            background-color: var(--edu-primary-500);
            transition: width var(--edu-duration-normal) var(--edu-easing-in-out);
          }
        }

        .progress-text {
          font-weight: var(--font-weight-medium);
          color: var(--text-primary);
        }
      }

      .progress-breakdown {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
        gap: var(--spacing-base);

        .progress-item {
          text-align: center;
          padding: var(--spacing-sm);
          border-radius: var(--radius-base);
          background-color: var(--edu-color-gray-50);

          .progress-label {
            font-size: var(--font-size-xs);
            color: var(--text-secondary);
            margin-bottom: var(--spacing-xs);
          }

          .progress-count {
            font-size: var(--font-size-lg);
            font-weight: var(--font-weight-bold);
            color: var(--text-primary);
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

      &--error {
        .participant-status {
          color: var(--edu-color-error-default);
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

      .participant-time {
        font-size: var(--font-size-xs);
        color: var(--text-tertiary);
      }
    }

    .participant-progress {
      .progress-circle {
        width: 40px;
        height: 40px;
        position: relative;

        svg {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }

        .progress-bg {
          stroke: var(--edu-color-gray-200);
          fill: none;
          stroke-width: 3;
        }

        .progress-bar-circle {
          stroke: var(--edu-primary-500);
          fill: none;
          stroke-width: 3;
          transition: stroke-dasharray var(--edu-duration-normal) var(--edu-easing-in-out);
        }

        .progress-value {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
          color: var(--text-primary);
        }
      }
    }
  }

  .error-section {
    .error-list {
      max-height: 300px;
      overflow-y: auto;
    }

    .error-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-base);
      padding: var(--spacing-base);
      border-radius: var(--radius-base);
      background-color: var(--edu-color-error-light);
      cursor: pointer;

      &:hover {
        background-color: var(--edu-color-error-lighter);
      }
    }

    .error-icon {
      width: 20px;
      height: 20px;
      color: var(--edu-color-error-default);
      flex-shrink: 0;
    }

    .error-info {
      flex: 1;

      .error-student {
        font-weight: var(--font-weight-medium);
        color: var(--text-primary);
      }

      .error-message {
        font-size: var(--font-size-sm);
        color: var(--edu-color-error-default);
        margin: var(--spacing-xs) 0;
      }

      .error-time {
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
    max-width: 500px;
    max-height: 80%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
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

  .form-group {
    margin-bottom: var(--spacing-base);
  }

  .form-label {
    display: block;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
    margin-bottom: var(--spacing-xs);
  }

  .form-textarea {
    width: 100%;
    padding: var(--spacing-sm);
    border: 1px solid var(--edu-color-gray-300);
    border-radius: var(--radius-base);
    background-color: var(--bg-elevated);
    color: var(--text-primary);
    resize: vertical;
  }

  .collect-options {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    cursor: pointer;

    input[type='checkbox'] {
      width: 18px;
      height: 18px;
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