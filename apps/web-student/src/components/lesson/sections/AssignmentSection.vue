<template>
  <div class="assignment-section">
    <div class="section-header">
      <h2>{{ section.title }}</h2>
      <div class="section-meta">
        <el-tag :type="getAssignmentType(section.data?.assignmentType)">
          {{ getAssignmentTypeText(section.data?.assignmentType) }}
        </el-tag>
        <el-tag :type="getDifficultyType(section.data?.difficulty)">
          {{ getDifficultyText(section.data?.difficulty) }}
        </el-tag>
        <span class="duration">{{ formatDuration(section.duration) }}</span>
      </div>
    </div>

    <div class="content-container">
      <div class="main-content">
        <!-- 作业说明 -->
        <el-card class="assignment-intro glass-card">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><EditPen /></el-icon>
              <span>作业说明</span>
            </div>
          </template>

          <div class="intro-content">
            <h3>{{ section.data?.assignmentTitle || '课堂作业' }}</h3>
            <p class="assignment-description">{{ section.data?.description || '完成以下作业以检验学习效果' }}</p>

            <div class="assignment-info">
              <div class="info-item">
                <span class="info-label">题目数量：</span>
                <span class="info-value">{{ assignmentQuestions.length }} 题</span>
              </div>
              <div class="info-item">
                <span class="info-label">总分：</span>
                <span class="info-value">{{ totalPoints }} 分</span>
              </div>
              <div class="info-item">
                <span class="info-label">及格分数：</span>
                <span class="info-value">{{ passingScore }} 分</span>
              </div>
              <div class="info-item">
                <span class="info-label">时间限制：</span>
                <span class="info-value">{{ formatDuration(section.duration) }}</span>
              </div>
            </div>

            <div class="assignment-instructions" v-if="section.data?.instructions">
              <h4>作业要求</h4>
              <ol>
                <li v-for="instruction in section.data.instructions" :key="instruction">
                  {{ instruction }}
                </li>
              </ol>
            </div>
          </div>
        </el-card>

        <!-- 作业题目 -->
        <div class="assignment-questions">
          <div
            v-for="(question, index) in assignmentQuestions"
            :key="question.id"
            class="question-card"
          >
            <el-card class="glass-card" :class="{ 'answered': question.answered }">
              <template #header>
                <div class="question-header">
                  <div class="question-number">{{ index + 1 }}.</div>
                  <div class="question-info">
                    <h4>{{ question.title }}</h4>
                    <div class="question-meta">
                      <el-tag size="small" :type="getQuestionTypeColor(question.type)">
                        {{ getQuestionTypeText(question.type) }}
                      </el-tag>
                      <span class="question-points">{{ question.points }} 分</span>
                    </div>
                  </div>
                  <div class="question-status">
                    <el-icon v-if="question.answered" class="status-icon answered"><Check /></el-icon>
                    <el-icon v-else class="status-icon unanswered"><Clock /></el-icon>
                  </div>
                </div>
              </template>

              <div class="question-content">
                <!-- 选择题 -->
                <div v-if="question.type === 'choice'" class="choice-question">
                  <div class="question-description">
                    <p>{{ question.description }}</p>
                  </div>
                  <div class="question-options">
                    <el-radio-group
                      v-model="question.userAnswer"
                      @change="answerQuestion(question)"
                      :disabled="submitted"
                    >
                      <el-radio
                        v-for="option in question.options"
                        :key="option.value"
                        :label="option.value"
                        class="option-item"
                      >
                        <span class="option-label">{{ option.label }}</span>
                        <span class="option-text">{{ option.text }}</span>
                      </el-radio>
                    </el-radio-group>
                  </div>
                </div>

                <!-- 多选题 -->
                <div v-else-if="question.type === 'multiple'" class="multiple-question">
                  <div class="question-description">
                    <p>{{ question.description }}</p>
                    <p class="hint">（可以选择多个答案）</p>
                  </div>
                  <div class="question-options">
                    <el-checkbox-group
                      v-model="question.userAnswers"
                      @change="answerQuestion(question)"
                      :disabled="submitted"
                    >
                      <el-checkbox
                        v-for="option in question.options"
                        :key="option.value"
                        :label="option.value"
                        class="option-item"
                      >
                        <span class="option-label">{{ option.label }}</span>
                        <span class="option-text">{{ option.text }}</span>
                      </el-checkbox>
                    </el-checkbox-group>
                  </div>
                </div>

                <!-- 填空题 -->
                <div v-else-if="question.type === 'fill'" class="fill-question">
                  <div class="question-description">
                    <p v-html="formatFillQuestion(question.description)"></p>
                  </div>
                  <div class="fill-answers">
                    <div
                      v-for="(blank, blankIndex) in question.blanks"
                      :key="blankIndex"
                      class="fill-item"
                    >
                      <el-input
                        v-model="blank.userAnswer"
                        :placeholder="`空格 ${blankIndex + 1}`"
                        @input="answerQuestion(question)"
                        :disabled="submitted"
                      />
                    </div>
                  </div>
                </div>

                <!-- 判断题 -->
                <div v-else-if="question.type === 'judge'" class="judge-question">
                  <div class="question-description">
                    <p>{{ question.description }}</p>
                  </div>
                  <div class="judge-options">
                    <el-radio-group
                      v-model="question.userAnswer"
                      @change="answerQuestion(question)"
                      :disabled="submitted"
                    >
                      <el-radio :label="true" class="judge-option">
                        <el-icon class="option-icon"><Check /></el-icon>
                        正确
                      </el-radio>
                      <el-radio :label="false" class="judge-option">
                        <el-icon class="option-icon"><Close /></el-icon>
                        错误
                      </el-radio>
                    </el-radio-group>
                  </div>
                </div>

                <!-- 简答题 -->
                <div v-else-if="question.type === 'essay'" class="essay-question">
                  <div class="question-description">
                    <p>{{ question.description }}</p>
                    <p class="hint">（请详细回答，不少于 {{ question.minWords || 50 }} 字）</p>
                  </div>
                  <div class="essay-answer">
                    <el-input
                      v-model="question.userAnswer"
                      type="textarea"
                      :rows="6"
                      placeholder="请输入你的答案..."
                      :maxlength="question.maxWords || 500"
                      show-word-limit
                      @input="answerQuestion(question)"
                      :disabled="submitted"
                    />
                  </div>
                </div>

                <!-- 编程题 -->
                <div v-else-if="question.type === 'coding'" class="coding-question">
                  <div class="question-description">
                    <p>{{ question.description }}</p>
                    <div class="coding-requirements" v-if="question.requirements">
                      <h5>要求：</h5>
                      <ul>
                        <li v-for="requirement in question.requirements" :key="requirement">
                          {{ requirement }}
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div class="coding-answer">
                    <div class="code-editor">
                      <div class="editor-header">
                        <el-select v-model="question.language" size="small">
                          <el-option label="Python" value="python" />
                          <el-option label="JavaScript" value="javascript" />
                          <el-option label="Java" value="java" />
                        </el-select>
                        <el-button size="small" @click="runCode(question)">
                          <el-icon><VideoPlay /></el-icon>
                          运行
                        </el-button>
                      </div>
                      <el-input
                        v-model="question.userAnswer"
                        type="textarea"
                        :rows="8"
                        placeholder="在此编写代码..."
                        class="code-textarea"
                        @input="answerQuestion(question)"
                        :disabled="submitted"
                      />
                      <div v-if="question.output" class="code-output">
                        <h6>运行结果：</h6>
                        <pre>{{ question.output }}</pre>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 答案反馈 -->
                <div v-if="submitted && question.feedback" class="question-feedback">
                  <el-alert
                    :title="question.feedback.correct ? '回答正确！' : '回答错误'"
                    :type="question.feedback.correct ? 'success' : 'error'"
                    show-icon
                    :closable="false"
                  >
                    <div v-if="question.feedback.explanation">
                      <strong>解析：</strong>{{ question.feedback.explanation }}
                    </div>
                    <div v-if="question.feedback.correctAnswer" class="correct-answer">
                      <strong>正确答案：</strong>{{ formatCorrectAnswer(question) }}
                    </div>
                  </el-alert>
                </div>
              </div>
            </el-card>
          </div>
        </div>

        <!-- 提交区域 -->
        <div class="submission-area">
          <el-card class="glass-card">
            <template #header>
              <div class="card-header">
                <el-icon class="header-icon"><DocumentChecked /></el-icon>
                <span>作业提交</span>
              </div>
            </template>

            <div class="submission-content">
              <div class="submission-summary">
                <div class="summary-stats">
                  <div class="stat-item">
                    <span class="stat-label">完成进度</span>
                    <span class="stat-value">{{ answeredCount }}/{{ assignmentQuestions.length }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">用时</span>
                    <span class="stat-value">{{ formatDuration(assignmentTime) }}</span>
                  </div>
                  <div class="stat-item" v-if="submitted">
                    <span class="stat-label">得分</span>
                    <span class="stat-value">{{ totalScore }}/{{ totalPoints }}</span>
                  </div>
                </div>

                <div class="progress-bar">
                  <el-progress
                    :percentage="progressPercentage"
                    :stroke-width="8"
                    :color="progressColor"
                  />
                </div>
              </div>

              <div class="submission-actions">
                <el-button
                  type="primary"
                  @click="submitAssignment"
                  :disabled="answeredCount === 0 || submitted"
                  size="large"
                >
                  <el-icon><DocumentChecked /></el-icon>
                  {{ submitted ? '已提交' : '提交作业' }}
                </el-button>

                <el-button
                  @click="saveDraft"
                  :disabled="submitted"
                >
                  <el-icon><Download /></el-icon>
                  保存草稿
                </el-button>

                <el-button
                  @click="resetAnswers"
                  :disabled="submitted"
                >
                  <el-icon><RefreshLeft /></el-icon>
                  重置答案
                </el-button>
              </div>
            </div>
          </el-card>
        </div>
      </div>

      <div class="sidebar-content">
        <!-- 倒计时 -->
        <el-card class="timer-card glass-card" v-if="!submitted">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><Timer /></el-icon>
              <span>剩余时间</span>
            </div>
          </template>

          <div class="timer-display">
            <div class="time-value" :class="{ 'warning': remainingTime < 300 }">
              {{ formatDuration(remainingTime) }}
            </div>
            <div class="time-label">时间限制：{{ formatDuration(section.duration) }}</div>
          </div>
        </el-card>

        <!-- 题目导航 -->
        <el-card class="navigation-card glass-card">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><Menu /></el-icon>
              <span>题目导航</span>
            </div>
          </template>

          <div class="question-nav">
            <div class="nav-grid">
              <div
                v-for="(question, index) in assignmentQuestions"
                :key="question.id"
                :class="['nav-item', {
                  'answered': question.answered,
                  'current': currentQuestionIndex === index
                }]"
                @click="scrollToQuestion(index)"
                :title="`题目 ${index + 1}`"
              >
                {{ index + 1 }}
              </div>
            </div>

            <div class="nav-legend">
              <div class="legend-item">
                <div class="legend-box default"></div>
                <span>未回答</span>
              </div>
              <div class="legend-item">
                <div class="legend-box answered"></div>
                <span>已回答</span>
              </div>
              <div class="legend-item">
                <div class="legend-box current"></div>
                <span>当前</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 快速工具 -->
        <el-card class="tools-card glass-card">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><Tools /></el-icon>
              <span>快速工具</span>
            </div>
          </template>

          <div class="assignment-tools">
            <el-button
              @click="askForHelp"
              class="tool-btn"
              :disabled="submitted"
            >
              <el-icon><QuestionFilled /></el-icon>
              寻求帮助
            </el-button>

            <el-button
              @click="viewHints"
              class="tool-btn"
              :disabled="submitted"
            >
              <el-icon><View /></el-icon>
              查看提示
            </el-button>

            <el-button
              @click="calculateScore"
              class="tool-btn"
              :disabled="answeredCount === 0"
            >
              <el-icon><Calculator /></el-icon>
              预估分数
            </el-button>

            <el-button
              @click="exportAnswers"
              class="tool-btn"
            >
              <el-icon><Download /></el-icon>
              导出答案
            </el-button>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  EditPen, Check, Clock, Close, VideoPlay, DocumentChecked, Timer,
  Menu, Tools, QuestionFilled, View, Calculator, Download, RefreshLeft
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
const assignmentTime = ref(0)
const remainingTime = ref(props.section.duration * 60) // 转换为秒
const submitted = ref(false)
const totalScore = ref(0)
const currentQuestionIndex = ref(0)
let assignmentTimer: NodeJS.Timeout | null = null

// 作业题目
const assignmentQuestions = ref([
  {
    id: 'q1',
    type: 'choice',
    title: '单选题示例',
    description: '以下哪个选项是正确的？',
    points: 10,
    options: [
      { value: 'a', label: 'A.', text: '选项A' },
      { value: 'b', label: 'B.', text: '选项B' },
      { value: 'c', label: 'C.', text: '选项C' },
      { value: 'd', label: 'D.', text: '选项D' }
    ],
    correctAnswer: 'b',
    userAnswer: '',
    answered: false,
    feedback: null
  },
  {
    id: 'q2',
    type: 'multiple',
    title: '多选题示例',
    description: '以下哪些选项是正确的？（多选）',
    points: 15,
    options: [
      { value: 'a', label: 'A.', text: '选项A' },
      { value: 'b', label: 'B.', text: '选项B' },
      { value: 'c', label: 'C.', text: '选项C' }
    ],
    correctAnswer: ['a', 'c'],
    userAnswers: [],
    answered: false,
    feedback: null
  },
  {
    id: 'q3',
    type: 'fill',
    title: '填空题示例',
    description: '请填写：Python是一种______编程语言。',
    points: 10,
    blanks: [
      { answer: '解释型', userAnswer: '' }
    ],
    answered: false,
    feedback: null
  },
  {
    id: 'q4',
    type: 'essay',
    title: '简答题示例',
    description: '请简述你对本课程的理解和收获。',
    points: 20,
    minWords: 50,
    maxWords: 300,
    userAnswer: '',
    answered: false,
    feedback: null
  }
])

// 计算属性
const totalPoints = computed(() => {
  return assignmentQuestions.value.reduce((sum, q) => sum + q.points, 0)
})

const passingScore = computed(() => Math.round(totalPoints.value * 0.6))

const answeredCount = computed(() => {
  return assignmentQuestions.value.filter(q => q.answered).length
})

const progressPercentage = computed(() => {
  return Math.round((answeredCount.value / assignmentQuestions.value.length) * 100)
})

const progressColor = computed(() => {
  if (progressPercentage.value === 100) return 'var(--edu-color-success-default)'
  if (progressPercentage.value >= 60) return 'var(--edu-primary-500)'
  return 'var(--edu-color-warning-default)'
})

// 方法
const getAssignmentType = (type: string) => {
  const typeMap: Record<string, string> = {
    'quiz': 'primary',
    'homework': 'success',
    'exam': 'danger',
    'practice': 'info'
  }
  return typeMap[type] || 'default'
}

const getAssignmentTypeText = (type: string) => {
  const textMap: Record<string, string> = {
    'quiz': '随堂测验',
    'homework': '课后作业',
    'exam': '正式考试',
    'practice': '练习题'
  }
  return textMap[type] || '其他'
}

const getDifficultyType = (difficulty: string) => {
  const typeMap: Record<string, string> = {
    'easy': 'success',
    'medium': 'warning',
    'hard': 'danger'
  }
  return typeMap[difficulty] || 'info'
}

const getDifficultyText = (difficulty: string) => {
  const textMap: Record<string, string> = {
    'easy': '简单',
    'medium': '中等',
    'hard': '困难'
  }
  return textMap[difficulty] || '未知'
}

const getQuestionTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    'choice': 'primary',
    'multiple': 'success',
    'fill': 'warning',
    'judge': 'info',
    'essay': 'danger',
    'coding': 'primary'
  }
  return colorMap[type] || 'default'
}

const getQuestionTypeText = (type: string) => {
  const textMap: Record<string, string> = {
    'choice': '单选题',
    'multiple': '多选题',
    'fill': '填空题',
    'judge': '判断题',
    'essay': '简答题',
    'coding': '编程题'
  }
  return textMap[type] || '其他'
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

const formatFillQuestion = (description: string) => {
  return description.replace(/\_\_\_/g, '<span class="blank-placeholder">_____</span>')
}

const formatCorrectAnswer = (question: any) => {
  if (question.type === 'multiple') {
    return question.correctAnswer.map((answer: string) => {
      const option = question.options.find((opt: any) => opt.value === answer)
      return option ? option.text : answer
    }).join(', ')
  } else {
    const option = question.options.find((opt: any) => opt.value === question.correctAnswer)
    return option ? option.text : question.correctAnswer
  }
}

const answerQuestion = (question: any) => {
  // 检查题目是否已回答
  let isAnswered = false

  switch (question.type) {
    case 'choice':
    case 'judge':
      isAnswered = question.userAnswer !== ''
      break
    case 'multiple':
      isAnswered = question.userAnswers.length > 0
      break
    case 'fill':
      isAnswered = question.blanks.every((blank: any) => blank.userAnswer.trim() !== '')
      break
    case 'essay':
    case 'coding':
      isAnswered = question.userAnswer.trim() !== ''
      break
  }

  question.answered = isAnswered

  emit('interaction', {
    type: 'question_answer',
    data: {
      sectionId: props.section.id,
      questionId: question.id,
      questionType: question.type,
      answer: question.type === 'multiple' ? question.userAnswers : question.userAnswer,
      answered: isAnswered
    }
  })

  updateProgress()
}

const runCode = (question: any) => {
  // 模拟代码运行
  question.output = '运行成功！'
  if (question.userAnswer.includes('print')) {
    question.output += '\nHello, World!'
  }

  emit('interaction', {
    type: 'code_run',
    data: {
      sectionId: props.section.id,
      questionId: question.id,
      code: question.userAnswer,
      output: question.output
    }
  })
}

const submitAssignment = async () => {
  if (answeredCount.value === 0) {
    ElMessage.warning('请先回答题目')
    return
  }

  try {
    await ElMessageBox.confirm(
      '确定要提交作业吗？提交后无法修改答案。',
      '确认提交',
      { type: 'warning' }
    )

      submitted.value = true

      // 计算得分
      totalScore.value = calculateTotalScore()

      // 生成答案反馈
      generateFeedback()

      emit('interaction', {
        type: 'assignment_submit',
        data: {
          sectionId: props.section.id,
          totalQuestions: assignmentQuestions.value.length,
          answeredCount: answeredCount.value,
          totalScore: totalScore.value,
          totalPoints: totalPoints.value,
          timeSpent: assignmentTime.value,
          answers: getAnswers()
        }
      })

      updateProgress()

      ElMessage.success('作业提交成功！')

      if (totalScore.value >= passingScore.value) {
        ElMessage({
          title: '恭喜通过！',
          message: `你的得分是 ${totalScore.value}/${totalPoints.value}`,
          type: 'success',
          duration: 5000
        })
      } else {
        ElMessage({
          title: '继续努力！',
          message: `你的得分是 ${totalScore.value}/${totalPoints.value}，未达到及格线 ${passingScore.value} 分`,
          type: 'warning',
          duration: 5000
        })
      }
    } catch {
      // 用户取消提交
    }
  }

const saveDraft = () => {
  emit('interaction', {
    type: 'assignment_save_draft',
    data: {
      sectionId: props.section.id,
      answers: getAnswers(),
      timeSpent: assignmentTime.value
    }
  })

  ElMessage.success('草稿已保存')
}

const resetAnswers = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要重置所有答案吗？此操作不可恢复。',
      '确认重置',
      { type: 'warning' }
    )

    assignmentQuestions.value.forEach(question => {
      question.userAnswer = ''
      question.userAnswers = []
      question.answered = false
      question.feedback = null
      if (question.blanks) {
        question.blanks.forEach((blank: any) => {
          blank.userAnswer = ''
        })
      }
    })

    updateProgress()
    ElMessage.success('答案已重置')
  } catch {
    // 用户取消重置
  }
}

const calculateTotalScore = () => {
  let score = 0

  assignmentQuestions.value.forEach(question => {
    let isCorrect = false

    switch (question.type) {
      case 'choice':
      case 'judge':
        isCorrect = question.userAnswer === question.correctAnswer
        break
      case 'multiple':
        isCorrect = JSON.stringify(question.userAnswers.sort()) === JSON.stringify(question.correctAnswer.sort())
        break
      case 'fill':
        isCorrect = question.blanks.every((blank: any, index: number) =>
          blank.userAnswer.toLowerCase().includes(question.blanks[index].answer.toLowerCase())
        )
        break
      default:
        // 简答题和编程题需要人工评分，这里给部分分数
        isCorrect = question.answered
        break
    }

    if (isCorrect) {
      score += question.points
    }
  })

  return score
}

const generateFeedback = () => {
  assignmentQuestions.value.forEach(question => {
    let isCorrect = false

    switch (question.type) {
      case 'choice':
      case 'judge':
        isCorrect = question.userAnswer === question.correctAnswer
        break
      case 'multiple':
        isCorrect = JSON.stringify(question.userAnswers.sort()) === JSON.stringify(question.correctAnswer.sort())
        break
      case 'fill':
        isCorrect = question.blanks.every((blank: any, index: number) =>
          blank.userAnswer.toLowerCase().includes(question.blanks[index].answer.toLowerCase())
        )
        break
      default:
        isCorrect = question.answered
        break
    }

    question.feedback = {
      correct: isCorrect,
      explanation: isCorrect ? '回答正确！' : '回答错误，请仔细审题。',
      correctAnswer: !isCorrect ? question.correctAnswer : null
    }
  })
}

const getAnswers = () => {
  return assignmentQuestions.value.map(question => ({
    questionId: question.id,
    type: question.type,
    answer: question.type === 'multiple' ? question.userAnswers : question.userAnswer,
    answered: question.answered
  }))
}

const scrollToQuestion = (index: number) => {
  currentQuestionIndex.value = index
  const questionCards = document.querySelectorAll('.question-card')
  if (questionCards[index]) {
    questionCards[index].scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

const askForHelp = () => {
  emit('interaction', {
    type: 'ask_help',
    data: {
      sectionId: props.section.id,
      context: 'assignment'
    }
  })

  ElMessage.info('帮助请求已发送给老师')
}

const viewHints = () => {
  emit('interaction', {
    type: 'view_hints',
    data: {
      sectionId: props.section.id
    }
  })

  ElMessage.info('提示：仔细阅读题目，理解要求后再作答')
}

const calculateScore = () => {
  if (answeredCount.value === 0) {
    ElMessage.warning('请先回答一些题目')
    return
  }

  const estimatedScore = calculateTotalScore()

  ElMessage({
    title: '预估分数',
    message: `根据当前答案，预估得分：${estimatedScore}/${totalPoints.value}`,
    type: estimatedScore >= passingScore.value ? 'success' : 'warning',
    duration: 5000
  })
}

const exportAnswers = () => {
  const answers = getAnswers()
  const exportData = {
    sectionId: props.section.id,
    sectionTitle: props.section.title,
    answers: answers,
    timeSpent: assignmentTime.value,
    timestamp: new Date()
  }

  const dataStr = JSON.stringify(exportData, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `assignment_${Date.now()}.json`
  link.click()
  URL.revokeObjectURL(url)

  emit('interaction', {
    type: 'answers_export',
    data: exportData
  })

  ElMessage.success('答案已导出')
}

const updateProgress = () => {
  emit('progress-update', {
    ...props.progress,
    completionRate: submitted.value ? 100 : progressPercentage.value,
    timeSpent: assignmentTime.value
  })
}

const startTimer = () => {
  assignmentTimer = setInterval(() => {
    if (!submitted.value) {
      assignmentTime.value++
      remainingTime.value = Math.max(0, remainingTime.value - 1)

      if (remainingTime.value === 0) {
        // 时间到，自动提交
        submitAssignment()
      } else if (remainingTime.value === 300) { // 5分钟警告
        ElMessage.warning('剩余时间不足5分钟，请抓紧时间提交！')
      }

      if (assignmentTime.value % 30 === 0) { // 每30秒更新一次进度
        updateProgress()
      }
    }
  }, 1000)
}

// 生命周期
onMounted(() => {
  startTimer()
})

onUnmounted(() => {
  if (assignmentTimer) {
    clearInterval(assignmentTimer)
  }
})
</script>

<style scoped lang="scss">
.assignment-section {
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

.assignment-intro {
  .intro-content {
    h3 {
      margin: 0 0 16px 0;
      font-size: 20px;
      color: #1f2937;
    }

    .assignment-description {
      color: #4b5563;
      line-height: 1.6;
      margin-bottom: 20px;
    }

    .assignment-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
      margin-bottom: 20px;

      .info-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .info-label {
          color: #6b7280;
          font-size: 14px;
        }

        .info-value {
          font-weight: 600;
          color: #374151;
        }
      }
    }

    .assignment-instructions {
      h4 {
        margin: 0 0 12px 0;
        font-size: 16px;
        color: #374151;
      }

      ol {
        margin: 0;
        padding-left: 20px;
        color: #4b5563;
        line-height: 1.6;

        li {
          margin-bottom: 8px;
        }
      }
    }
  }
}

.assignment-questions {
  .question-card {
    margin-bottom: 20px;

    .question-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;

      .question-number {
        width: 32px;
        height: 32px;
        background: #3b82f6;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        flex-shrink: 0;
      }

      .question-info {
        flex: 1;

        h4 {
          margin: 0 0 8px 0;
          font-size: 16px;
          color: #1f2937;
        }

        .question-meta {
          display: flex;
          align-items: center;
          gap: 12px;

          .question-points {
            color: #f59e0b;
            font-weight: 600;
          }
        }
      }

      .question-status {
        .status-icon {
          font-size: 20px;

          &.answered {
            color: var(--edu-color-success-default);
          }

          &.unanswered {
            color: #c0c4cc;
          }
        }
      }
    }

    .question-content {
      .question-description {
        margin-bottom: 16px;

        p {
          color: #374151;
          line-height: 1.6;
          margin: 0 0 8px 0;
        }

        .hint {
          color: #9ca3af;
          font-size: 14px;
          font-style: italic;
        }
      }

      :deep(.blank-placeholder) {
        background: #fef3c7;
        padding: 2px 4px;
        border-radius: 2px;
        font-weight: 600;
        color: #92400e;
      }

      .question-options {
        .option-item {
          display: block;
          margin-bottom: 12px;
          padding: 12px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          transition: all 0.2s ease;

          &:hover {
            border-color: #3b82f6;
            background: #eff6ff;
          }

          :deep(.el-radio__label),
          :deep(.el-checkbox__label) {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 8px;

            .option-label {
              font-weight: 600;
              color: #6b7280;
              min-width: 30px;
            }

            .option-text {
              color: #374151;
              line-height: 1.4;
            }
          }
        }
      }

      .fill-answers {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .fill-item {
          max-width: 300px;
        }
      }

      .judge-options {
        .judge-option {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-right: 24px;
          padding: 12px 16px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          margin-bottom: 12px;

          .option-icon {
            color: #6b7280;
          }
        }
      }

      .essay-answer {
        :deep(.el-textarea) {
          .el-textarea__inner {
            font-size: 15px;
            line-height: 1.6;
          }
        }
      }

      .coding-answer {
        .code-editor {
          .editor-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
          }

          .code-textarea {
            :deep(.el-textarea__inner) {
              font-family: 'Courier New', monospace;
              font-size: 14px;
              background: #1f2937;
              color: #f9fafb;
            }
          }

          .code-output {
            margin-top: 12px;
            padding: 12px;
            background: #f3f4f6;
            border-radius: 4px;

            h6 {
              margin: 0 0 8px 0;
              font-size: 14px;
              color: #374151;
            }

            pre {
              margin: 0;
              font-family: 'Courier New', monospace;
              font-size: 13px;
              color: #1f2937;
              white-space: pre-wrap;
            }
          }
        }
      }

      .question-feedback {
        margin-top: 16px;

        .correct-answer {
          margin-top: 8px;
          font-weight: 600;
        }
      }
    }

    &.answered {
      border-left: 4px solid var(--edu-color-success-default);
    }
  }
}

.submission-area {
  .submission-content {
    .submission-summary {
      margin-bottom: 20px;

      .summary-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 16px;
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
            color: #374151;
          }
        }
      }
    }

    .submission-actions {
      text-align: center;

      .el-button {
        margin: 0 8px;
      }
    }
  }
}

.timer-card {
  .timer-display {
    text-align: center;

    .time-value {
      font-size: 32px;
      font-weight: 700;
      color: #374151;
      margin-bottom: 8px;
      font-family: 'Courier New', monospace;

      &.warning {
        color: #ef4444;
        animation: pulse 1s infinite;
      }
    }

    .time-label {
      color: #6b7280;
      font-size: 14px;
    }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
}

.navigation-card {
  .question-nav {
    .nav-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
      margin-bottom: 16px;

      .nav-item {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;
        border: 2px solid #e5e7eb;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 14px;
        transition: all 0.2s ease;

        &:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        &.answered {
          background: var(--edu-color-success-default);
          border-color: var(--edu-color-success-default);
          color: white;
        }

        &.current {
          border-color: #3b82f6;
          background: #3b82f6;
          color: white;
        }
      }
    }

    .nav-legend {
      display: flex;
      justify-content: space-around;
      font-size: 12px;

      .legend-item {
        display: flex;
        align-items: center;
        gap: 4px;

        .legend-box {
          width: 12px;
          height: 12px;
          border-radius: 2px;

          &.default {
            background: white;
            border: 1px solid #e5e7eb;
          }

          &.answered {
            background: var(--edu-color-success-default);
          }

          &.current {
            background: #3b82f6;
          }
        }
      }
    }
  }
}

.tools-card {
  .assignment-tools {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .tool-btn {
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
  .assignment-section {
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
  .assignment-section {
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

    .assignment-intro {
      .intro-content {
        .assignment-info {
          grid-template-columns: 1fr;
        }
      }
    }

    .navigation-card {
      .question-nav {
        .nav-grid {
          grid-template-columns: repeat(4, 1fr);
        }
      }
    }
  }
}
</style>