<template>
  <div class="introduction-section">
    <div class="section-header">
      <h2>{{ section.title }}</h2>
      <div class="section-meta">
        <el-tag :type="getPriorityType(section.priority)">{{ getPriorityText(section.priority) }}</el-tag>
        <span class="duration">{{ formatDuration(section.duration) }}</span>
      </div>
    </div>

    <div class="content-container">
      <!-- 主要内容展示 -->
      <div class="main-content">
        <!-- 欢迎信息 -->
        <div class="welcome-card">
          <el-card class="glass-card">
            <template #header>
              <div class="card-header">
                <el-icon class="header-icon"><VideoPlay /></el-icon>
                <span>课程引入</span>
              </div>
            </template>

            <div class="welcome-content">
              <h3>{{ section.data?.welcomeMessage || '欢迎来到今天的课程！' }}</h3>
              <p class="course-overview">{{ section.data?.overview || '让我们开始今天的学习之旅' }}</p>

              <!-- 学习目标 -->
              <div class="learning-objectives" v-if="section.data?.objectives?.length">
                <h4>学习目标</h4>
                <ul>
                  <li v-for="objective in section.data.objectives" :key="objective.id">
                    <el-icon class="objective-icon"><Check /></el-icon>
                    {{ objective.text }}
                  </li>
                </ul>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 视频或媒体内容 -->
        <div class="media-content" v-if="section.data?.media">
          <el-card class="glass-card">
            <template #header>
              <div class="card-header">
                <el-icon class="header-icon"><VideoCamera /></el-icon>
                <span>课程视频</span>
              </div>
            </template>

            <div class="video-container">
              <video
                v-if="section.data.media.type === 'video'"
                :src="section.data.media.url"
                :poster="section.data.media.poster"
                controls
                @play="handleMediaPlay"
                @pause="handleMediaPause"
                @ended="handleMediaEnded"
                class="content-video"
              />

              <div v-else-if="section.data.media.type === 'image'" class="image-container">
                <img :src="section.data.media.url" :alt="section.data.media.alt" />
              </div>
            </div>
          </el-card>
        </div>

        <!-- 互动讨论区 -->
        <div class="discussion-area">
          <el-card class="glass-card">
            <template #header>
              <div class="card-header">
                <el-icon class="header-icon"><ChatDotRound /></el-icon>
                <span>课程讨论</span>
                <el-badge :value="discussionMessages.length" class="discussion-badge" />
              </div>
            </template>

            <div class="discussion-content">
              <!-- 讨论消息列表 -->
              <div class="message-list" ref="messageListRef">
                <div
                  v-for="message in discussionMessages"
                  :key="message.id"
                  :class="['message-item', { 'own-message': message.isOwn }]"
                >
                  <div class="message-avatar">
                    <el-avatar :size="32" :src="message.avatar">
                      {{ message.name.charAt(0) }}
                    </el-avatar>
                  </div>
                  <div class="message-content">
                    <div class="message-header">
                      <span class="message-name">{{ message.name }}</span>
                      <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                    </div>
                    <div class="message-text">{{ message.content }}</div>
                  </div>
                </div>
              </div>

              <!-- 发送消息 -->
              <div class="message-input">
                <el-input
                  v-model="newMessage"
                  type="textarea"
                  :rows="2"
                  placeholder="分享你的想法..."
                  maxlength="200"
                  show-word-limit
                  @keydown.ctrl.enter="sendMessage"
                />
                <div class="message-actions">
                  <el-button size="small" @click="sendMessage" :disabled="!newMessage.trim()">
                    发送
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 前置知识检查 -->
        <div class="knowledge-check" v-if="section.data?.prerequisites?.length">
          <el-card class="glass-card">
            <template #header>
              <div class="card-header">
                <el-icon class="header-icon"><DocumentChecked /></el-icon>
                <span>前置知识检查</span>
              </div>
            </template>

            <div class="knowledge-items">
              <div
                v-for="item in section.data.prerequisites"
                :key="item.id"
                class="knowledge-item"
              >
                <div class="knowledge-content">
                  <h4>{{ item.title }}</h4>
                  <p>{{ item.description }}</p>
                </div>
                <div class="knowledge-actions">
                  <el-button
                    size="small"
                    :type="item.confirmed ? 'success' : 'primary'"
                    @click="confirmKnowledge(item)"
                  >
                    {{ item.confirmed ? '已掌握' : '确认掌握' }}
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>

      <!-- 侧边进度信息 -->
      <div class="sidebar-content">
        <!-- 学习进度 -->
        <el-card class="progress-card glass-card">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><TrendCharts /></el-icon>
              <span>学习进度</span>
            </div>
          </template>

          <div class="progress-info">
            <el-progress
              type="circle"
              :percentage="progress.completionRate"
              :width="120"
              :stroke-width="8"
            >
              <template #default="{ percentage }">
                <span class="progress-text">{{ percentage }}%</span>
              </template>
            </el-progress>

            <div class="progress-stats">
              <div class="stat-item">
                <span class="stat-label">观看时长</span>
                <span class="stat-value">{{ formatDuration(watchTime) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">互动次数</span>
                <span class="stat-value">{{ interactionCount }}</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 快速操作 -->
        <el-card class="actions-card glass-card">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><Operation /></el-icon>
              <span>快速操作</span>
            </div>
          </template>

          <div class="action-buttons">
            <el-button
              type="primary"
              @click="raiseHand"
              :disabled="studentData.handRaised"
              class="action-btn"
            >
              <el-icon><Pointer /></el-icon>
              {{ studentData.handRaised ? '已举手' : '举手发言' }}
            </el-button>

            <el-button
              type="info"
              @click="takeNotes"
              class="action-btn"
            >
              <el-icon><EditPen /></el-icon>
              记录笔记
            </el-button>

            <el-button
              type="success"
              @click="markAsCompleted"
              :disabled="isCompleted"
              class="action-btn"
            >
              <el-icon><Select /></el-icon>
              {{ isCompleted ? '已完成' : '标记完成' }}
            </el-button>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  VideoPlay, VideoCamera, ChatDotRound, DocumentChecked, TrendCharts,
  Operation, Pointer, EditPen, Select, Check
} from '@element-plus/icons-vue'
import type { LessonSection, SectionProgress, StudentData } from '@/types/lesson'

interface DiscussionMessage {
  id: string
  name: string
  avatar?: string
  content: string
  timestamp: Date
  isOwn: boolean
}

interface Props {
  section: LessonSection
  progress: SectionProgress
  studentData: StudentData
}

interface Emits {
  (e: 'interaction', interaction: any): void
  (e: 'progress-update', progress: SectionProgress): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 状态
const newMessage = ref('')
const discussionMessages = ref<DiscussionMessage[]>([])
const watchTime = ref(0)
const isCompleted = ref(false)
const messageListRef = ref<HTMLElement>()
let watchTimer: NodeJS.Timeout | null = null

// 计算属性
const interactionCount = computed(() => {
  return props.studentData.interactions?.length || 0
})

// 方法
const getPriorityType = (priority: string) => {
  const typeMap: Record<string, string> = {
    'high': 'danger',
    'medium': 'warning',
    'low': 'info'
  }
  return typeMap[priority] || 'info'
}

const getPriorityText = (priority: string) => {
  const textMap: Record<string, string> = {
    'high': '重要',
    'medium': '中等',
    'low': '一般'
  }
  return textMap[priority] || '一般'
}

const formatDuration = (duration: number) => {
  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleMediaPlay = () => {
  startWatchTimer()

  emit('interaction', {
    type: 'media_play',
    data: {
      sectionId: props.section.id,
      mediaType: 'video'
    }
  })
}

const handleMediaPause = () => {
  stopWatchTimer()

  emit('interaction', {
    type: 'media_pause',
    data: {
      sectionId: props.section.id,
      watchTime: watchTime.value
    }
  })
}

const handleMediaEnded = () => {
  stopWatchTimer()

  emit('interaction', {
    type: 'media_complete',
    data: {
      sectionId: props.section.id,
      totalWatchTime: watchTime.value
    }
  })

  updateProgress(100)
}

const startWatchTimer = () => {
  if (!watchTimer) {
    watchTimer = setInterval(() => {
      watchTime.value++
      if (watchTime.value % 10 === 0) { // 每10秒更新一次进度
        const videoProgress = Math.min((watchTime.value / (props.section.duration * 60)) * 100, 100)
        updateProgress(videoProgress)
      }
    }, 1000)
  }
}

const stopWatchTimer = () => {
  if (watchTimer) {
    clearInterval(watchTimer)
    watchTimer = null
  }
}

const sendMessage = () => {
  if (!newMessage.value.trim()) return

  const message: DiscussionMessage = {
    id: `msg_${Date.now()}`,
    name: '当前学生', // 实际应从用户store获取
    content: newMessage.value.trim(),
    timestamp: new Date(),
    isOwn: true
  }

  discussionMessages.value.push(message)

  emit('interaction', {
    type: 'discussion_message',
    data: {
      sectionId: props.section.id,
      message: message.content
    }
  })

  newMessage.value = ''

  // 滚动到底部
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

const confirmKnowledge = (item: any) => {
  item.confirmed = true

  emit('interaction', {
    type: 'knowledge_confirm',
    data: {
      sectionId: props.section.id,
      knowledgeId: item.id,
      knowledgeTitle: item.title
    }
  })

  ElMessage.success('已确认掌握该知识点')
}

const raiseHand = () => {
  emit('interaction', {
    type: 'hand_raise',
    data: {
      sectionId: props.section.id,
      action: 'raise'
    }
  })
}

const takeNotes = () => {
  emit('interaction', {
    type: 'take_notes',
    data: {
      sectionId: props.section.id,
      action: 'open_notes'
    }
  })
}

const markAsCompleted = () => {
  isCompleted.value = true

  emit('interaction', {
    type: 'section_complete',
    data: {
      sectionId: props.section.id,
      completionTime: new Date(),
      totalWatchTime: watchTime.value
    }
  })

  updateProgress(100)
  ElMessage.success('已完成课程引入环节')
}

const updateProgress = (newProgress: number) => {
  const updatedProgress: SectionProgress = {
    ...props.progress,
    completionRate: Math.round(newProgress),
    timeSpent: watchTime.value
  }

  emit('progress-update', updatedProgress)
}

// 模拟接收其他学生的消息
const simulateIncomingMessages = () => {
  const sampleMessages = [
    '这个引入视频很精彩！',
    '我对这个知识点很感兴趣',
    '老师能再讲一下这个概念吗？',
    '之前学过类似的内容'
  ]

  // 模拟随机消息
  const messageTimer = setInterval(() => {
    if (Math.random() > 0.7 && discussionMessages.value.length < 10) {
      const message: DiscussionMessage = {
        id: `msg_${Date.now()}_${Math.random()}`,
        name: `同学${Math.floor(Math.random() * 5) + 1}`,
        content: sampleMessages[Math.floor(Math.random() * sampleMessages.length)],
        timestamp: new Date(),
        isOwn: false
      }

      discussionMessages.value.push(message)

      nextTick(() => {
        if (messageListRef.value) {
          messageListRef.value.scrollTop = messageListRef.value.scrollHeight
        }
      })
    }
  }, 15000) // 每15秒可能有一条消息

  // 组件卸载时清理
  onUnmounted(() => {
    clearInterval(messageTimer)
  })
}

// 生命周期
onMounted(() => {
  // 模拟一些初始讨论消息
  discussionMessages.value = [
    {
      id: 'msg_welcome',
      name: '老师',
      content: '欢迎同学们！今天我们要学习新的知识内容。',
      timestamp: new Date(Date.now() - 300000), // 5分钟前
      isOwn: false
    }
  ]

  // 启动模拟消息
  simulateIncomingMessages()
})
</script>

<style scoped lang="scss">
.introduction-section {
  padding: 24px;
  height: 100%;
  overflow-y: auto;

  .section-header {
    margin-bottom: 24px;

    h2 {
      margin: 0 0 12px 0;
      font-size: 32px;
      font-weight: 700;
      color: #1f2937;
    }

    .section-meta {
      display: flex;
      align-items: center;
      gap: 12px;

      .duration {
        color: #6b7280;
        font-size: 14px;
      }
    }
  }

  .content-container {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 24px;

    .main-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .sidebar-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
  }
}

.glass-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;

    .header-icon {
      color: #3b82f6;
    }
  }
}

.welcome-card {
  .welcome-content {
    h3 {
      margin: 0 0 16px 0;
      font-size: 24px;
      color: #1f2937;
    }

    .course-overview {
      font-size: 16px;
      color: #6b7280;
      line-height: 1.6;
      margin-bottom: 24px;
    }

    .learning-objectives {
      h4 {
        margin: 0 0 12px 0;
        font-size: 18px;
        color: #374151;
      }

      ul {
        margin: 0;
        padding: 0;
        list-style: none;

        li {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 6px;

          .objective-icon {
            color: #10b981;
            font-size: 16px;
          }
        }
      }
    }
  }
}

.media-content {
  .video-container {
    position: relative;
    border-radius: 8px;
    overflow: hidden;

    .content-video {
      width: 100%;
      max-height: 400px;
      border-radius: 8px;
    }

    .image-container {
      text-align: center;

      img {
        max-width: 100%;
        border-radius: 8px;
      }
    }
  }
}

.discussion-area {
  .discussion-content {
    display: flex;
    flex-direction: column;
    height: 400px;

    .message-list {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: #f9fafb;
      border-radius: 6px;
      margin-bottom: 16px;

      .message-item {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;

        &.own-message {
          flex-direction: row-reverse;

          .message-content {
            text-align: right;

            .message-header {
              justify-content: flex-end;
            }
          }
        }

        .message-content {
          flex: 1;

          .message-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 4px;

            .message-name {
              font-weight: 500;
              color: #374151;
            }

            .message-time {
              font-size: 12px;
              color: #9ca3af;
            }
          }

          .message-text {
            padding: 8px 12px;
            background: white;
            border-radius: 6px;
            color: #374151;
            line-height: 1.4;

            .message-item.own-message & {
              background: #3b82f6;
              color: white;
            }
          }
        }
      }
    }

    .message-input {
      .message-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 8px;
      }
    }
  }

  .discussion-badge {
    margin-left: auto;
  }
}

.knowledge-check {
  .knowledge-items {
    .knowledge-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      background: #f9fafb;
      border-radius: 6px;
      margin-bottom: 12px;

      .knowledge-content {
        flex: 1;

        h4 {
          margin: 0 0 8px 0;
          font-size: 16px;
          color: #374151;
        }

        p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }
      }

      .knowledge-actions {
        margin-left: 16px;
      }
    }
  }
}

.progress-card {
  .progress-info {
    text-align: center;

    .progress-text {
      font-size: 20px;
      font-weight: 600;
      color: #3b82f6;
    }

    .progress-stats {
      margin-top: 20px;

      .stat-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;

        .stat-label {
          color: #6b7280;
        }

        .stat-value {
          font-weight: 600;
          color: #374151;
        }
      }
    }
  }
}

.actions-card {
  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .action-btn {
      width: 100%;
      justify-content: flex-start;

      .el-icon {
        margin-right: 8px;
      }
    }
  }
}

// 响应式设计
@media (max-width: 1024px) {
  .introduction-section {
    .content-container {
      grid-template-columns: 1fr;

      .sidebar-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
    }
  }
}

@media (max-width: 768px) {
  .introduction-section {
    padding: 16px;

    .section-header {
      h2 {
        font-size: 24px;
      }
    }

    .content-container {
      gap: 16px;

      .sidebar-content {
        grid-template-columns: 1fr;
      }
    }

    .discussion-area {
      .discussion-content {
        height: 300px;
      }
    }
  }
}
</style>