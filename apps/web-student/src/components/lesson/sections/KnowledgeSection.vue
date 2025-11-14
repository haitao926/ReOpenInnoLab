<template>
  <div class="knowledge-section">
    <div class="section-header">
      <h2>{{ section.title }}</h2>
      <div class="section-meta">
        <el-tag :type="getDifficultyType(section.data?.difficulty)">
          {{ getDifficultyText(section.data?.difficulty) }}
        </el-tag>
        <span class="duration">{{ formatDuration(section.duration) }}</span>
      </div>
    </div>

    <div class="content-container">
      <div class="main-content">
        <!-- 知识点卡片 -->
        <div class="knowledge-cards">
          <div
            v-for="(knowledge, index) in section.data?.knowledgePoints || []"
            :key="knowledge.id"
            class="knowledge-card"
          >
            <el-card class="glass-card knowledge-point-card">
              <template #header>
                <div class="card-header">
                  <div class="knowledge-index">{{ index + 1 }}</div>
                  <div class="knowledge-info">
                    <h3>{{ knowledge.title }}</h3>
                    <el-tag size="small" :type="getKnowledgeType(knowledge.type)">
                      {{ getKnowledgeTypeText(knowledge.type) }}
                    </el-tag>
                  </div>
                  <div class="knowledge-actions">
                    <el-button
                      size="small"
                      :type="knowledge.completed ? 'success' : 'primary'"
                      @click="toggleKnowledgeComplete(knowledge)"
                    >
                      {{ knowledge.completed ? '已掌握' : '标记掌握' }}
                    </el-button>
                  </div>
                </div>
              </template>

              <div class="knowledge-content">
                <!-- 知识点描述 -->
                <div class="knowledge-description">
                  <p>{{ knowledge.description }}</p>
                </div>

                <!-- 关键概念 -->
                <div class="key-concepts" v-if="knowledge.keyConcepts?.length">
                  <h4>关键概念</h4>
                  <div class="concept-tags">
                    <el-tag
                      v-for="concept in knowledge.keyConcepts"
                      :key="concept"
                      size="small"
                      class="concept-tag"
                    >
                      {{ concept }}
                    </el-tag>
                  </div>
                </div>

                <!-- 详细内容 -->
                <div class="knowledge-detail" v-if="knowledge.content">
                  <div class="detail-content" v-html="knowledge.content"></div>
                </div>

                <!-- 示例代码或公式 -->
                <div class="knowledge-example" v-if="knowledge.example">
                  <h4>示例</h4>
                  <el-alert
                    v-if="knowledge.example.type === 'code'"
                    :title="knowledge.example.title"
                    type="info"
                    show-icon
                    :closable="false"
                  >
                    <pre class="code-example">{{ knowledge.example.content }}</pre>
                  </el-alert>

                  <div v-else-if="knowledge.example.type === 'formula'" class="formula-example">
                    <div class="formula-content">{{ knowledge.example.content }}</div>
                  </div>
                </div>

                <!-- 练习题 -->
                <div class="practice-question" v-if="knowledge.practiceQuestion">
                  <h4>练习思考</h4>
                  <el-card class="question-card">
                    <p class="question-text">{{ knowledge.practiceQuestion.question }}</p>
                    <div class="question-options" v-if="knowledge.practiceQuestion.options">
                      <el-radio-group v-model="knowledge.practiceQuestion.userAnswer" @change="checkAnswer(knowledge)">
                        <el-radio
                          v-for="option in knowledge.practiceQuestion.options"
                          :key="option.value"
                          :label="option.value"
                          class="option-item"
                        >
                          {{ option.label }}
                        </el-radio>
                      </el-radio-group>
                    </div>
                    <div class="question-feedback" v-if="knowledge.practiceQuestion.feedback">
                      <el-alert
                        :title="knowledge.practiceQuestion.feedback.correct ? '回答正确！' : '再想想看'"
                        :type="knowledge.practiceQuestion.feedback.correct ? 'success' : 'warning'"
                        show-icon
                        :closable="false"
                      >
                        {{ knowledge.practiceQuestion.feedback.explanation }}
                      </el-alert>
                    </div>
                  </el-card>
                </div>

                <!-- 进度指示器 -->
                <div class="knowledge-progress">
                  <div class="progress-indicator">
                    <div
                      class="progress-bar"
                      :style="{ width: `${knowledge.progress || 0}%` }"
                    ></div>
                  </div>
                  <span class="progress-text">{{ knowledge.progress || 0 }}% 完成</span>
                </div>
              </div>
            </el-card>
          </div>
        </div>

        <!-- 知识点关系图 -->
        <div class="knowledge-map" v-if="section.data?.knowledgeMap">
          <el-card class="glass-card">
            <template #header>
              <div class="card-header">
                <el-icon class="header-icon"><Share /></el-icon>
                <span>知识点关系图</span>
              </div>
            </template>
            <div class="map-container">
              <!-- 这里可以集成图表库如 ECharts 或 D3.js -->
              <div class="simple-map">
                <div
                  v-for="node in section.data.knowledgeMap.nodes"
                  :key="node.id"
                  :class="['map-node', { active: node.active }]"
                  :style="{ left: node.x + 'px', top: node.y + 'px' }"
                  @click="selectMapNode(node)"
                >
                  {{ node.label }}
                </div>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 扩展阅读 -->
        <div class="extended-reading" v-if="section.data?.extendedResources?.length">
          <el-card class="glass-card">
            <template #header>
              <div class="card-header">
                <el-icon class="header-icon"><Reading /></el-icon>
                <span>扩展阅读</span>
              </div>
            </template>
            <div class="reading-list">
              <div
                v-for="resource in section.data.extendedResources"
                :key="resource.id"
                class="reading-item"
                @click="openResource(resource)"
              >
                <div class="resource-icon">
                  <el-icon>
                    <component :is="getResourceIcon(resource.type)" />
                  </el-icon>
                </div>
                <div class="resource-info">
                  <h4>{{ resource.title }}</h4>
                  <p>{{ resource.description }}</p>
                  <el-tag size="small" :type="getResourceTypeColor(resource.type)">
                    {{ resource.type }}
                  </el-tag>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>

      <div class="sidebar-content">
        <!-- 学习进度 -->
        <el-card class="progress-card glass-card">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><TrendCharts /></el-icon>
              <span>学习进度</span>
            </div>
          </template>

          <div class="progress-overview">
            <el-progress
              type="circle"
              :percentage="overallProgress"
              :width="100"
              :stroke-width="8"
            >
              <template #default="{ percentage }">
                <span class="progress-text">{{ percentage }}%</span>
              </template>
            </el-progress>

            <div class="progress-details">
              <div class="detail-item">
                <span class="label">已掌握知识点</span>
                <span class="value">{{ completedKnowledgeCount }}/{{ totalKnowledgeCount }}</span>
              </div>
              <div class="detail-item">
                <span class="label">学习时长</span>
                <span class="value">{{ formatDuration(studyTime) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">练习完成</span>
                <span class="value">{{ completedPractices }}/{{ totalPractices }}</span>
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
              @click="askQuestion"
              class="action-btn"
            >
              <el-icon><QuestionFilled /></el-icon>
              提问
            </el-button>

            <el-button
              type="info"
              @click="takeNotes"
              class="action-btn"
            >
              <el-icon><EditPen /></el-icon>
              记笔记
            </el-button>

            <el-button
              type="success"
              @click="reviewKnowledge"
              class="action-btn"
            >
              <el-icon><Refresh /></el-icon>
              复习
            </el-button>
          </div>
        </el-card>

        <!-- 知识点导航 -->
        <el-card class="navigation-card glass-card">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><Menu /></el-icon>
              <span>知识点导航</span>
            </div>
          </template>

          <div class="knowledge-nav">
            <div
              v-for="(knowledge, index) in section.data?.knowledgePoints || []"
              :key="knowledge.id"
              :class="['nav-item', { completed: knowledge.completed, current: currentKnowledgeIndex === index }]"
              @click="scrollToKnowledge(index)"
            >
              <div class="nav-index">{{ index + 1 }}</div>
              <div class="nav-content">
                <div class="nav-title">{{ knowledge.title }}</div>
                <div class="nav-progress">
                  <el-progress
                    :percentage="knowledge.progress || 0"
                    :stroke-width="4"
                    :show-text="false"
                  />
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Share, Reading, TrendCharts, Operation, QuestionFilled,
  EditPen, Refresh, Menu, Document, VideoPlay, Link
} from '@element-plus/icons-vue'
import type { LessonSection, SectionProgress, StudentData } from '@/types/lesson'

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
const studyTime = ref(0)
const currentKnowledgeIndex = ref(0)
let studyTimer: NodeJS.Timeout | null = null

// 计算属性
const totalKnowledgeCount = computed(() => props.section.data?.knowledgePoints?.length || 0)

const completedKnowledgeCount = computed(() => {
  return props.section.data?.knowledgePoints?.filter(k => k.completed).length || 0
})

const overallProgress = computed(() => {
  if (totalKnowledgeCount.value === 0) return 0
  return Math.round((completedKnowledgeCount.value / totalKnowledgeCount.value) * 100)
})

const totalPractices = computed(() => {
  return props.section.data?.knowledgePoints?.filter(k => k.practiceQuestion).length || 0
})

const completedPractices = computed(() => {
  return props.section.data?.knowledgePoints?.filter(k =>
    k.practiceQuestion && k.practiceQuestion.userAnswer
  ).length || 0
})

// 方法
const getDifficultyType = (difficulty: string) => {
  const typeMap: Record<string, string> = {
    'beginner': 'success',
    'intermediate': 'warning',
    'advanced': 'danger'
  }
  return typeMap[difficulty] || 'info'
}

const getDifficultyText = (difficulty: string) => {
  const textMap: Record<string, string> = {
    'beginner': '初级',
    'intermediate': '中级',
    'advanced': '高级'
  }
  return textMap[difficulty] || '未知'
}

const getKnowledgeType = (type: string) => {
  const typeMap: Record<string, string> = {
    'concept': 'primary',
    'skill': 'success',
    'application': 'warning',
    'theory': 'info'
  }
  return typeMap[type] || 'default'
}

const getKnowledgeTypeText = (type: string) => {
  const textMap: Record<string, string> = {
    'concept': '概念',
    'skill': '技能',
    'application': '应用',
    'theory': '理论'
  }
  return textMap[type] || '其他'
}

const formatDuration = (duration: number) => {
  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const toggleKnowledgeComplete = (knowledge: any) => {
  knowledge.completed = !knowledge.completed

  if (knowledge.completed) {
    knowledge.progress = 100
  }

  emit('interaction', {
    type: 'knowledge_complete',
    data: {
      sectionId: props.section.id,
      knowledgeId: knowledge.id,
      completed: knowledge.completed,
      progress: knowledge.progress
    }
  })

  updateProgress()
}

const checkAnswer = (knowledge: any) => {
  const question = knowledge.practiceQuestion
  const isCorrect = question.userAnswer === question.correctAnswer

  question.feedback = {
    correct: isCorrect,
    explanation: isCorrect ? question.explanation : question.hint
  }

  emit('interaction', {
    type: 'practice_answer',
    data: {
      sectionId: props.section.id,
      knowledgeId: knowledge.id,
      answer: question.userAnswer,
      correct: isCorrect
    }
  })

  if (isCorrect) {
    ElMessage.success('回答正确！')
    // 更新知识点进度
    knowledge.progress = Math.min((knowledge.progress || 0) + 25, 100)
    updateProgress()
  }
}

const selectMapNode = (node: any) => {
  emit('interaction', {
    type: 'knowledge_map_select',
    data: {
      sectionId: props.section.id,
      nodeId: node.id,
      nodeLabel: node.label
    }
  })
}

const openResource = (resource: any) => {
  emit('interaction', {
    type: 'resource_open',
    data: {
      sectionId: props.section.id,
      resourceId: resource.id,
      resourceType: resource.type,
      resourceUrl: resource.url
    }
  })

  // 实际应用中这里会打开资源
  ElMessage.info(`正在打开资源: ${resource.title}`)
}

const getResourceIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    'document': 'Document',
    'video': 'VideoPlay',
    'link': 'Link'
  }
  return iconMap[type] || 'Document'
}

const getResourceTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    'document': 'info',
    'video': 'success',
    'link': 'warning'
  }
  return colorMap[type] || 'default'
}

const askQuestion = () => {
  emit('interaction', {
    type: 'ask_question',
    data: {
      sectionId: props.section.id,
      context: 'knowledge_section'
    }
  })
}

const takeNotes = () => {
  emit('interaction', {
    type: 'take_notes',
    data: {
      sectionId: props.section.id,
      context: 'knowledge_section'
    }
  })
}

const reviewKnowledge = () => {
  emit('interaction', {
    type: 'review_knowledge',
    data: {
      sectionId: props.section.id
    }
  })
}

const scrollToKnowledge = (index: number) => {
  currentKnowledgeIndex.value = index
  // 滚动到对应的知识点卡片
  const cards = document.querySelectorAll('.knowledge-card')
  if (cards[index]) {
    cards[index].scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

const updateProgress = () => {
  const totalProgress = props.section.data?.knowledgePoints?.reduce((sum: number, k: any) =>
    sum + (k.progress || 0), 0) || 0

  const averageProgress = totalProgress / totalKnowledgeCount.value

  emit('progress-update', {
    ...props.progress,
    completionRate: Math.round(averageProgress),
    timeSpent: studyTime.value
  })
}

const startStudyTimer = () => {
  if (!studyTimer) {
    studyTimer = setInterval(() => {
      studyTime.value++
      if (studyTime.value % 30 === 0) { // 每30秒更新一次进度
        updateProgress()
      }
    }, 1000)
  }
}

// 生命周期
onMounted(() => {
  startStudyTimer()
})
</script>

<style scoped lang="scss">
.knowledge-section {
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

.knowledge-cards {
  .knowledge-card {
    margin-bottom: 24px;

    .knowledge-point-card {
      .card-header {
        display: flex;
        align-items: center;
        gap: 16px;

        .knowledge-index {
          width: 40px;
          height: 40px;
          background: #3b82f6;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 18px;
        }

        .knowledge-info {
          flex: 1;

          h3 {
            margin: 0 0 4px 0;
            font-size: 18px;
            color: #1f2937;
          }
        }
      }
    }

    .knowledge-content {
      > div {
        margin-bottom: 20px;

        &:last-child {
          margin-bottom: 0;
        }
      }

      .knowledge-description {
        p {
          color: #4b5563;
          line-height: 1.6;
          margin: 0;
        }
      }

      .key-concepts {
        h4 {
          margin: 0 0 12px 0;
          font-size: 16px;
          color: #374151;
        }

        .concept-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;

          .concept-tag {
            background: #eff6ff;
            color: #3b82f6;
            border: 1px solid #3b82f6;
          }
        }
      }

      .knowledge-detail {
        .detail-content {
          background: #f9fafb;
          padding: 16px;
          border-radius: 6px;
          border-left: 4px solid #3b82f6;
        }
      }

      .knowledge-example {
        h4 {
          margin: 0 0 12px 0;
          font-size: 16px;
          color: #374151;
        }

        .code-example {
          background: #1f2937;
          color: #f9fafb;
          padding: 16px;
          border-radius: 6px;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          overflow-x: auto;
          margin: 8px 0 0 0;
        }

        .formula-example {
          .formula-content {
            background: #f3f4f6;
            padding: 16px;
            border-radius: 6px;
            font-family: 'Times New Roman', serif;
            font-size: 18px;
            text-align: center;
          }
        }
      }

      .practice-question {
        h4 {
          margin: 0 0 12px 0;
          font-size: 16px;
          color: #374151;
        }

        .question-card {
          .question-text {
            margin: 0 0 16px 0;
            color: #1f2937;
            font-size: 16px;
            line-height: 1.5;
          }

          .question-options {
            margin-bottom: 16px;

            .option-item {
              display: block;
              margin-bottom: 12px;

              :deep(.el-radio__label) {
                color: #374151;
                line-height: 1.5;
              }
            }
          }
        }
      }

      .knowledge-progress {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #e5e7eb;

        .progress-indicator {
          flex: 1;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;

          .progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #3b82f6, #60a5fa);
            transition: width 0.3s ease;
          }
        }

        .progress-text {
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
          min-width: 50px;
        }
      }
    }
  }
}

.knowledge-map {
  .map-container {
    height: 300px;
    position: relative;

    .simple-map {
      position: relative;
      height: 100%;
      background: #f9fafb;
      border-radius: 6px;

      .map-node {
        position: absolute;
        padding: 8px 16px;
        background: white;
        border: 2px solid #e5e7eb;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        &.active {
          border-color: #3b82f6;
          background: #3b82f6;
          color: white;
        }
      }
    }
  }
}

.extended-reading {
  .reading-list {
    .reading-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s ease;

      &:hover {
        background: #f9fafb;
      }

      .resource-icon {
        width: 40px;
        height: 40px;
        background: #eff6ff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #3b82f6;
      }

      .resource-info {
        flex: 1;

        h4 {
          margin: 0 0 4px 0;
          font-size: 16px;
          color: #1f2937;
        }

        p {
          margin: 0 0 8px 0;
          color: #6b7280;
          font-size: 14px;
          line-height: 1.4;
        }
      }
    }
  }
}

.progress-card {
  .progress-overview {
    text-align: center;

    .progress-text {
      font-size: 16px;
      font-weight: 600;
      color: #3b82f6;
    }

    .progress-details {
      margin-top: 20px;

      .detail-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;

        .label {
          color: #6b7280;
          font-size: 14px;
        }

        .value {
          font-weight: 600;
          color: #374151;
          font-size: 14px;
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

.navigation-card {
  .knowledge-nav {
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-bottom: 8px;

      &:hover {
        background: #f9fafb;
      }

      &.completed {
        .nav-index {
          background: #10b981;
        }
      }

      &.current {
        background: #eff6ff;
        border: 1px solid #3b82f6;
      }

      .nav-index {
        width: 28px;
        height: 28px;
        background: #6b7280;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
      }

      .nav-content {
        flex: 1;

        .nav-title {
          font-size: 14px;
          color: #374151;
          margin-bottom: 4px;
        }

        .nav-progress {
          :deep(.el-progress-bar__outer) {
            height: 4px;
          }
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 1024px) {
  .knowledge-section {
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
  .knowledge-section {
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

    .knowledge-cards {
      .knowledge-card {
        .knowledge-point-card {
          .card-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
        }
      }
    }
  }
}
</style>