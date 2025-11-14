<template>
  <div class="experience-section">
    <div class="section-header">
      <h2>{{ section.title }}</h2>
      <div class="section-meta">
        <el-tag :type="getInteractionType(section.data?.interactionType)">
          {{ getInteractionTypeText(section.data?.interactionType) }}
        </el-tag>
        <span class="duration">{{ formatDuration(section.duration) }}</span>
      </div>
    </div>

    <div class="content-container">
      <div class="main-content">
        <!-- 体验任务介绍 -->
        <el-card class="task-intro glass-card">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><Pointer /></el-icon>
              <span>体验任务</span>
            </div>
          </template>

          <div class="task-description">
            <h3>{{ section.data?.taskTitle || '互动体验' }}</h3>
            <p>{{ section.data?.taskDescription || '通过互动体验加深对知识的理解' }}</p>

            <div class="task-objectives" v-if="section.data?.objectives?.length">
              <h4>体验目标</h4>
              <ul>
                <li v-for="objective in section.data.objectives" :key="objective.id">
                  <el-icon class="objective-icon"><Star /></el-icon>
                  {{ objective.text }}
                </li>
              </ul>
            </div>
          </div>
        </el-card>

        <!-- 互动内容区域 -->
        <div class="interaction-area">
          <!-- 虚拟仿真体验 -->
          <div v-if="section.data?.interactionType === 'simulation'" class="simulation-container">
            <el-card class="glass-card">
              <template #header>
                <div class="card-header">
                  <el-icon class="header-icon"><Monitor /></el-icon>
                  <span>虚拟仿真</span>
                </div>
              </template>

              <div class="simulation-content">
                <div class="simulation-screen" ref="simulationScreen">
                  <!-- 3D模型或交互界面占位 -->
                  <div class="simulation-placeholder">
                    <el-icon class="simulation-icon"><Monitor /></el-icon>
                    <p>虚拟仿真环境</p>
                    <el-button type="primary" @click="startSimulation">开始体验</el-button>
                  </div>
                </div>

                <div class="simulation-controls">
                  <div class="control-panel">
                    <h4>控制面板</h4>
                    <div class="control-buttons">
                      <el-button-group>
                        <el-button @click="resetSimulation" :icon="RefreshLeft">重置</el-button>
                        <el-button @click="pauseSimulation" :icon="VideoPause">暂停</el-button>
                        <el-button @click="helpSimulation" :icon="QuestionFilled">帮助</el-button>
                      </el-button-group>
                    </div>
                  </div>

                  <div class="simulation-info">
                    <div class="info-item">
                      <span class="label">当前步骤</span>
                      <span class="value">{{ currentStep }} / {{ totalSteps }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">完成度</span>
                      <el-progress :percentage="simulationProgress" :stroke-width="8" />
                    </div>
                  </div>
                </div>
              </div>
            </el-card>
          </div>

          <!-- 交互式图表 -->
          <div v-else-if="section.data?.interactionType === 'chart'" class="chart-container">
            <el-card class="glass-card">
              <template #header>
                <div class="card-header">
                  <el-icon class="header-icon"><TrendCharts /></el-icon>
                  <span>交互式图表</span>
                </div>
              </template>

              <div class="chart-content">
                <div class="chart-area" ref="chartArea">
                  <!-- 图表占位 -->
                  <div class="chart-placeholder">
                    <el-icon class="chart-icon"><TrendCharts /></el-icon>
                    <p>交互式图表</p>
                    <p>点击图表元素进行交互</p>
                  </div>
                </div>

                <div class="chart-controls">
                  <el-button-group>
                    <el-button @click="changeChartType('line')">折线图</el-button>
                    <el-button @click="changeChartType('bar')">柱状图</el-button>
                    <el-button @click="changeChartType('pie')">饼图</el-button>
                  </el-button-group>
                </div>
              </div>
            </el-card>
          </div>

          <!-- 拖拽排序体验 -->
          <div v-else-if="section.data?.interactionType === 'dragdrop'" class="dragdrop-container">
            <el-card class="glass-card">
              <template #header>
                <div class="card-header">
                  <el-icon class="header-icon"><Sort /></el-icon>
                  <span>拖拽排序</span>
                </div>
              </template>

              <div class="dragdrop-content">
                <div class="instructions">
                  <h4>拖拽说明</h4>
                  <p>{{ section.data?.instructions || '请将下方的项目按正确顺序排列' }}</p>
                </div>

                <div class="dragdrop-area">
                  <div class="source-items">
                    <h5>待排序项目</h5>
                    <div class="item-list">
                      <div
                        v-for="item in dragItems"
                        :key="item.id"
                        :class="['drag-item', { dragging: item.isDragging }]"
                        draggable="true"
                        @dragstart="handleDragStart(item)"
                        @dragend="handleDragEnd(item)"
                      >
                        <el-icon class="item-icon"><Menu /></el-icon>
                        <span>{{ item.text }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="target-area">
                    <h5>排序结果</h5>
                    <div
                      class="drop-zone"
                      @dragover.prevent
                      @drop="handleDrop"
                    >
                      <div
                        v-for="(item, index) in sortedItems"
                        :key="item.id"
                        class="sorted-item"
                      >
                        <div class="item-order">{{ index + 1 }}</div>
                        <div class="item-content">{{ item.text }}</div>
                        <el-button
                          size="small"
                          type="danger"
                          :icon="Delete"
                          @click="removeSortedItem(item)"
                        />
                      </div>
                      <div v-if="sortedItems.length === 0" class="empty-zone">
                        将项目拖拽到这里
                      </div>
                    </div>
                  </div>
                </div>

                <div class="dragdrop-actions">
                  <el-button @click="checkSortOrder" type="primary">检查答案</el-button>
                  <el-button @click="resetDragDrop">重置</el-button>
                  <el-button @click="showHint" type="info">提示</el-button>
                </div>
              </div>
            </el-card>
          </div>

          <!-- 选择题互动 -->
          <div v-else-if="section.data?.interactionType === 'quiz'" class="quiz-container">
            <el-card class="glass-card">
              <template #header>
                <div class="card-header">
                  <el-icon class="header-icon"><QuestionFilled /></el-icon>
                  <span>互动测验</span>
                </div>
              </template>

              <div class="quiz-content">
                <div
                  v-for="(question, qIndex) in quizQuestions"
                  :key="question.id"
                  class="quiz-question"
                >
                  <div class="question-header">
                    <h4>{{ qIndex + 1 }}. {{ question.question }}</h4>
                    <el-tag :type="question.answered ? 'success' : 'warning'">
                      {{ question.answered ? '已回答' : '未回答' }}
                    </el-tag>
                  </div>

                  <div class="question-options">
                    <el-radio-group
                      v-model="question.userAnswer"
                      @change="answerQuestion(question)"
                      :disabled="question.answered"
                    >
                      <el-radio
                        v-for="option in question.options"
                        :key="option.value"
                        :label="option.value"
                        class="option-item"
                      >
                        {{ option.label }}
                      </el-radio>
                    </el-radio-group>
                  </div>

                  <div class="question-feedback" v-if="question.feedback">
                    <el-alert
                      :title="question.feedback.correct ? '回答正确！' : '再想想看'"
                      :type="question.feedback.correct ? 'success' : 'warning'"
                      show-icon
                      :closable="false"
                    >
                      {{ question.feedback.explanation }}
                    </el-alert>
                  </div>
                </div>

                <div class="quiz-summary">
                  <div class="summary-stats">
                    <div class="stat-item">
                      <span class="stat-label">回答进度</span>
                      <span class="stat-value">{{ answeredQuestions }} / {{ totalQuestions }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">正确率</span>
                      <span class="stat-value">{{ correctRate }}%</span>
                    </div>
                  </div>

                  <el-button
                    type="primary"
                    @click="submitQuiz"
                    :disabled="answeredQuestions < totalQuestions"
                  >
                    提交测验
                  </el-button>
                </div>
              </div>
            </el-card>
          </div>
        </div>

        <!-- 体验反馈 -->
        <el-card class="feedback-card glass-card">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><ChatDotRound /></el-icon>
              <span>体验反馈</span>
            </div>
          </template>

          <div class="feedback-content">
            <div class="feedback-form">
              <el-form :model="feedbackForm" label-width="80px">
                <el-form-item label="体验感受">
                  <el-rate
                    v-model="feedbackForm.rating"
                    :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
                    :texts="['很差', '较差', '一般', '不错', '很好']"
                    show-text
                  />
                </el-form-item>

                <el-form-item label="学习收获">
                  <el-checkbox-group v-model="feedbackForm.gains">
                    <el-checkbox label="concept">加深了概念理解</el-checkbox>
                    <el-checkbox label="skill">掌握了操作技能</el-checkbox>
                    <el-checkbox label="interest">提高了学习兴趣</el-checkbox>
                    <el-checkbox label="confidence">增强了学习信心</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>

                <el-form-item label="建议反馈">
                  <el-input
                    v-model="feedbackForm.suggestion"
                    type="textarea"
                    :rows="3"
                    placeholder="分享你的体验感受和建议..."
                    maxlength="300"
                    show-word-limit
                  />
                </el-form-item>
              </el-form>

              <div class="feedback-actions">
                <el-button type="primary" @click="submitFeedback">提交反馈</el-button>
                <el-button @click="resetFeedback">重置</el-button>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <div class="sidebar-content">
        <!-- 体验进度 -->
        <el-card class="progress-card glass-card">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><TrendCharts /></el-icon>
              <span>体验进度</span>
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
                <span class="label">互动次数</span>
                <span class="value">{{ interactionCount }}</span>
              </div>
              <div class="detail-item">
                <span class="label">体验时长</span>
                <span class="value">{{ formatDuration(experienceTime) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">完成度</span>
                <span class="value">{{ tasksCompleted }}/{{ totalTasks }}</span>
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
              @click="askForHelp"
              class="action-btn"
            >
              <el-icon><QuestionFilled /></el-icon>
              寻求帮助
            </el-button>

            <el-button
              type="info"
              @click="viewTutorial"
              class="action-btn"
            >
              <el-icon><VideoPlay /></el-icon>
              查看教程
            </el-button>

            <el-button
              type="success"
              @click="shareExperience"
              class="action-btn"
            >
              <el-icon><Share /></el-icon>
              分享体验
            </el-button>
          </div>
        </el-card>

        <!-- 体验统计 -->
        <el-card class="stats-card glass-card">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><DataAnalysis /></el-icon>
              <span>体验统计</span>
            </div>
          </template>

          <div class="experience-stats">
            <div class="stat-item">
              <div class="stat-icon">
                <el-icon><Pointer /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ clickCount }}</div>
                <div class="stat-label">点击次数</div>
              </div>
            </div>

            <div class="stat-item">
              <div class="stat-icon">
                <el-icon><Timer /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ avgResponseTime }}s</div>
                <div class="stat-label">平均响应时间</div>
              </div>
            </div>

            <div class="stat-item">
              <div class="stat-icon">
                <el-icon><Star /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ accuracy }}%</div>
                <div class="stat-label">操作准确率</div>
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
  Pointer, Monitor, TrendCharts, Sort, QuestionFilled, ChatDotRound,
  Operation, Share, DataAnalysis, Star, Menu, Delete, RefreshLeft,
  VideoPause, Timer, VideoPlay
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
const experienceTime = ref(0)
const currentStep = ref(1)
const totalSteps = ref(5)
const simulationProgress = ref(0)
const clickCount = ref(0)
const avgResponseTime = ref(0)
const accuracy = ref(0)
const interactionCount = ref(0)
const tasksCompleted = ref(0)
const totalTasks = ref(3)

// 拖拽相关
const dragItems = ref([
  { id: '1', text: '第一步：准备工作', isDragging: false },
  { id: '2', text: '第二步：执行操作', isDragging: false },
  { id: '3', text: '第三步：验证结果', isDragging: false },
  { id: '4', text: '第四步：总结分析', isDragging: false }
])

const sortedItems = ref([])

// 测验相关
const quizQuestions = ref([
  {
    id: 'q1',
    question: '体验这个互动过程的主要目的是什么？',
    options: [
      { value: 'a', label: 'A. 娱乐放松' },
      { value: 'b', label: 'B. 加深理解' },
      { value: 'c', label: 'C. 测试反应' },
      { value: 'd', label: 'D. 收集数据' }
    ],
    correctAnswer: 'b',
    userAnswer: '',
    answered: false,
    feedback: null
  }
])

// 反馈表单
const feedbackForm = ref({
  rating: 5,
  gains: [],
  suggestion: ''
})

// 计算属性
const overallProgress = computed(() => {
  return Math.round((tasksCompleted.value / totalTasks.value) * 100)
})

const answeredQuestions = computed(() => {
  return quizQuestions.value.filter(q => q.answered).length
})

const totalQuestions = computed(() => quizQuestions.value.length)

const correctRate = computed(() => {
  const correct = quizQuestions.value.filter(q => q.feedback?.correct).length
  return totalQuestions.value > 0 ? Math.round((correct / totalQuestions.value) * 100) : 0
})

// 方法
const getInteractionType = (type: string) => {
  const typeMap: Record<string, string> = {
    'simulation': 'primary',
    'chart': 'success',
    'dragdrop': 'warning',
    'quiz': 'info'
  }
  return typeMap[type] || 'default'
}

const getInteractionTypeText = (type: string) => {
  const textMap: Record<string, string> = {
    'simulation': '虚拟仿真',
    'chart': '交互图表',
    'dragdrop': '拖拽排序',
    'quiz': '互动测验'
  }
  return textMap[type] || '其他'
}

const formatDuration = (duration: number) => {
  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// 仿真相关方法
const startSimulation = () => {
  emit('interaction', {
    type: 'simulation_start',
    data: {
      sectionId: props.section.id,
      startTime: new Date()
    }
  })

  simulationProgress.value = 10
  updateProgress()
  ElMessage.success('仿真已开始')
}

const resetSimulation = () => {
  currentStep.value = 1
  simulationProgress.value = 0
  emit('interaction', {
    type: 'simulation_reset',
    data: {
      sectionId: props.section.id
    }
  })
}

const pauseSimulation = () => {
  emit('interaction', {
    type: 'simulation_pause',
    data: {
      sectionId: props.section.id,
      currentStep: currentStep.value,
      progress: simulationProgress.value
    }
  })
}

const helpSimulation = () => {
  emit('interaction', {
    type: 'simulation_help',
    data: {
      sectionId: props.section.id
    }
  })

  ElMessage.info('帮助信息已显示')
}

// 图表相关方法
const changeChartType = (type: string) => {
  emit('interaction', {
    type: 'chart_type_change',
    data: {
      sectionId: props.section.id,
      chartType: type
    }
  })

  ElMessage.success(`切换到${type}图表`)
}

// 拖拽相关方法
const handleDragStart = (item: any) => {
  item.isDragging = true
  clickCount.value++
  emit('interaction', {
    type: 'drag_start',
    data: {
      sectionId: props.section.id,
      itemId: item.id
    }
  })
}

const handleDragEnd = (item: any) => {
  item.isDragging = false
}

const handleDrop = (event: DragEvent) => {
  // 处理拖拽放置逻辑
  const draggedItem = dragItems.value.find(item => item.isDragging)
  if (draggedItem && !sortedItems.value.find(item => item.id === draggedItem.id)) {
    sortedItems.value.push({ ...draggedItem, isDragging: false })
    updateProgress()
  }
}

const removeSortedItem = (item: any) => {
  const index = sortedItems.value.findIndex(i => i.id === item.id)
  if (index > -1) {
    sortedItems.value.splice(index, 1)
    updateProgress()
  }
}

const checkSortOrder = () => {
  const correctOrder = ['1', '2', '3', '4']
  const userOrder = sortedItems.value.map(item => item.id)
  const isCorrect = JSON.stringify(userOrder) === JSON.stringify(correctOrder)

  emit('interaction', {
    type: 'dragdrop_check',
    data: {
      sectionId: props.section.id,
      userOrder,
      correct: isCorrect
    }
  })

  if (isCorrect) {
    ElMessage.success('排序正确！')
    tasksCompleted.value++
  } else {
    ElMessage.warning('排序不正确，请重试')
  }

  updateProgress()
}

const resetDragDrop = () => {
  sortedItems.value = []
  dragItems.value.forEach(item => item.isDragging = false)
}

const showHint = () => {
  ElMessage.info('提示：按照时间顺序进行排列')
}

// 测验相关方法
const answerQuestion = (question: any) => {
  question.answered = true
  const isCorrect = question.userAnswer === question.correctAnswer

  question.feedback = {
    correct: isCorrect,
    explanation: isCorrect ? '回答正确！这个体验的目的是加深理解。' : '再想想看，这个互动体验的主要目的应该是加深对知识的理解。'
  }

  emit('interaction', {
    type: 'quiz_answer',
    data: {
      sectionId: props.section.id,
      questionId: question.id,
      answer: question.userAnswer,
      correct: isCorrect
    }
  })

  interactionCount.value++
  updateProgress()
}

const submitQuiz = () => {
  const allCorrect = quizQuestions.value.every(q => q.feedback?.correct)

  if (allCorrect) {
    tasksCompleted.value++
    ElMessage.success('测验全部完成！')
  } else {
    ElMessage.info('测验已提交，继续努力！')
  }

  updateProgress()
}

// 反馈相关方法
const submitFeedback = () => {
  emit('interaction', {
    type: 'feedback_submit',
    data: {
      sectionId: props.section.id,
      feedback: feedbackForm.value
    }
  })

  ElMessage.success('反馈已提交，感谢你的参与！')
}

const resetFeedback = () => {
  feedbackForm.value = {
    rating: 5,
    gains: [],
    suggestion: ''
  }
}

// 其他操作方法
const askForHelp = () => {
  emit('interaction', {
    type: 'ask_help',
    data: {
      sectionId: props.section.id
    }
  })

  ElMessage.info('帮助请求已发送给老师')
}

const viewTutorial = () => {
  emit('interaction', {
    type: 'view_tutorial',
    data: {
      sectionId: props.section.id
    }
  })
}

const shareExperience = () => {
  emit('interaction', {
    type: 'share_experience',
    data: {
      sectionId: props.section.id,
      experience: '完成了互动体验环节'
    }
  })

  ElMessage.success('体验分享成功！')
}

const updateProgress = () => {
  const progressValue = overallProgress.value

  emit('progress-update', {
    ...props.progress,
    completionRate: progressValue,
    timeSpent: experienceTime.value
  })
}

const startExperienceTimer = () => {
  setInterval(() => {
    experienceTime.value++
    if (experienceTime.value % 10 === 0) {
      updateProgress()
    }
  }, 1000)
}

// 生命周期
onMounted(() => {
  startExperienceTimer()
})
</script>

<style scoped lang="scss">
.experience-section {
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

.task-intro {
  .task-description {
    h3 {
      margin: 0 0 16px 0;
      font-size: 20px;
      color: #1f2937;
    }

    p {
      color: #4b5563;
      line-height: 1.6;
      margin-bottom: 20px;
    }

    .task-objectives {
      h4 {
        margin: 0 0 12px 0;
        font-size: 16px;
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
          padding: 8px;
          background: #f9fafb;
          border-radius: 6px;

          .objective-icon {
            color: #f59e0b;
            font-size: 16px;
          }
        }
      }
    }
  }
}

.interaction-area {
  .simulation-content,
  .chart-content,
  .dragdrop-content,
  .quiz-content {
    .simulation-screen,
    .chart-area {
      height: 400px;
      background: #f9fafb;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;

      .simulation-placeholder,
      .chart-placeholder {
        text-align: center;

        .simulation-icon,
        .chart-icon {
          font-size: 64px;
          color: #9ca3af;
          margin-bottom: 16px;
        }

        p {
          color: #6b7280;
          margin-bottom: 20px;
        }
      }
    }

    .simulation-controls {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;

      .control-panel {
        h4 {
          margin: 0 0 12px 0;
          font-size: 16px;
          color: #374151;
        }
      }

      .simulation-info {
        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          .label {
            color: #6b7280;
            font-size: 14px;
          }

          .value {
            font-weight: 600;
            color: #374151;
          }
        }
      }
    }

    .chart-controls {
      text-align: center;
    }
  }
}

.dragdrop-content {
  .instructions {
    margin-bottom: 20px;

    h4 {
      margin: 0 0 8px 0;
      font-size: 16px;
      color: #374151;
    }

    p {
      color: #6b7280;
      margin: 0;
    }
  }

  .dragdrop-area {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;

    h5 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: #374151;
    }

    .item-list {
      .drag-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        margin-bottom: 8px;
        cursor: move;
        transition: all 0.2s ease;

        &:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        &.dragging {
          opacity: 0.5;
        }

        .item-icon {
          color: #9ca3af;
        }
      }
    }

    .drop-zone {
      min-height: 200px;
      background: #f9fafb;
      border: 2px dashed #d1d5db;
      border-radius: 6px;
      padding: 12px;

      .sorted-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        margin-bottom: 8px;

        .item-order {
          width: 24px;
          height: 24px;
          background: #3b82f6;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
        }

        .item-content {
          flex: 1;
        }
      }

      .empty-zone {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #9ca3af;
        font-style: italic;
      }
    }
  }

  .dragdrop-actions {
    text-align: center;
  }
}

.quiz-content {
  .quiz-question {
    margin-bottom: 24px;
    padding: 20px;
    background: #f9fafb;
    border-radius: 8px;

    .question-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;

      h4 {
        margin: 0;
        font-size: 16px;
        color: #1f2937;
        line-height: 1.5;
      }
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

  .quiz-summary {
    padding: 20px;
    background: #eff6ff;
    border-radius: 8px;

    .summary-stats {
      display: flex;
      justify-content: space-around;
      margin-bottom: 16px;

      .stat-item {
        text-align: center;

        .stat-label {
          display: block;
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 18px;
          font-weight: 600;
          color: #3b82f6;
        }
      }
    }
  }
}

.feedback-content {
  .feedback-form {
    .feedback-actions {
      text-align: center;
      margin-top: 20px;
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

.stats-card {
  .experience-stats {
    .stat-item {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;

      .stat-icon {
        width: 40px;
        height: 40px;
        background: #eff6ff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #3b82f6;
      }

      .stat-info {
        flex: 1;

        .stat-value {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 2px;
        }

        .stat-label {
          font-size: 12px;
          color: #6b7280;
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 1024px) {
  .experience-section {
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
  .experience-section {
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

    .dragdrop-content {
      .dragdrop-area {
        grid-template-columns: 1fr;
      }
    }

    .simulation-content {
      .simulation-controls {
        grid-template-columns: 1fr;
      }
    }
  }
}
</style>