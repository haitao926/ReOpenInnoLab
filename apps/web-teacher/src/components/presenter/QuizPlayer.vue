<template>
  <div class="quiz-player">
    <div v-if="loading" class="loading">
      <el-skeleton :rows="3" animated />
    </div>

    <div v-else class="quiz-content">
      <div v-if="currentQuestionIndex < questions.length" class="question-container">
        <div class="question-header">
          <span class="question-number">题目 {{ currentQuestionIndex + 1 }} / {{ questions.length }}</span>
          <el-progress
            :percentage="progressPercentage"
            :stroke-width="6"
            :show-text="false"
          />
        </div>

        <div class="question-body">
          <h3>{{ currentQuestion.question }}</h3>

          <!-- Single/Multiple Choice -->
          <div v-if="['single', 'multiple'].includes(currentQuestion.type)" class="options">
            <el-radio-group v-if="currentQuestion.type === 'single'" v-model="answer">
              <el-radio
                v-for="(option, index) in currentQuestion.options"
                :key="index"
                :label="option"
                class="option-item"
              >
                {{ String.fromCharCode(65 + index) }}. {{ option }}
              </el-radio>
            </el-radio-group>

            <el-checkbox-group v-else v-model="multipleAnswers">
              <el-checkbox
                v-for="(option, index) in currentQuestion.options"
                :key="index"
                :label="option"
                class="option-item"
              >
                {{ String.fromCharCode(65 + index) }}. {{ option }}
              </el-checkbox>
            </el-checkbox-group>
          </div>

          <!-- True/False -->
          <div v-else-if="currentQuestion.type === 'true-false'" class="true-false">
            <el-radio-group v-model="answer">
              <el-radio :label="true" class="option-item">
                <span class="option-icon">✓</span> 正确
              </el-radio>
              <el-radio :label="false" class="option-item">
                <span class="option-icon">✗</span> 错误
              </el-radio>
            </el-radio-group>
          </div>

          <!-- Fill in the blank -->
          <div v-else-if="currentQuestion.type === 'fill'" class="fill-blank">
            <el-input
              v-model="fillAnswer"
              placeholder="请输入答案"
              @keyup.enter="nextQuestion"
            />
          </div>

          <!-- Essay -->
          <div v-else-if="currentQuestion.type === 'essay'" class="essay">
            <el-input
              v-model="essayAnswer"
              type="textarea"
              :rows="4"
              placeholder="请输入您的答案"
            />
          </div>
        </div>

        <div class="question-actions">
          <el-button v-if="currentQuestionIndex > 0" @click="prevQuestion">
            上一题
          </el-button>
          <el-button
            v-if="currentQuestionIndex < questions.length - 1"
            type="primary"
            @click="nextQuestion"
            :disabled="!hasAnswer"
          >
            下一题
          </el-button>
          <el-button
            v-else
            type="primary"
            @click="submitQuiz"
            :disabled="!hasAnswer"
          >
            提交
          </el-button>
        </div>

        <div v-if="showExplanation" class="explanation">
          <el-alert
            type="info"
            :title="currentQuestion.explanation"
            :closable="false"
          />
        </div>
      </div>

      <!-- Quiz Complete -->
      <div v-else class="quiz-complete">
        <el-result icon="success" title="测验完成！">
          <template #sub-title>
            <p>您已完成所有题目</p>
          </template>
        </el-result>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Question } from '@/types/experience'

const props = defineProps<{
    questions: Question[]
    config?: {
      showExplanation?: boolean
      allowBack?: boolean
      timeLimit?: number
    }
  }>()

const emit = defineEmits<{
    complete: [result: any]
    progress: [progress: number]
  }>()

// 状态
const loading = ref(false)
const currentQuestionIndex = ref(0)
const answer = ref<any>(null)
const multipleAnswers = ref<string[]>([])
const fillAnswer = ref('')
const essayAnswer = ref('')
const userAnswers = ref<any[]>([])
const showExplanation = ref(false)

// 计算属性
const currentQuestion = computed(() => {
  return props.questions[currentQuestionIndex.value] || {}
})

const progressPercentage = computed(() => {
  return Math.round(((currentQuestionIndex.value + 1) / props.questions.length) * 100)
})

const hasAnswer = computed(() => {
  switch (currentQuestion.value.type) {
    case 'single':
    case 'true-false':
      return answer.value !== null
    case 'multiple':
      return multipleAnswers.value.length > 0
    case 'fill':
      return fillAnswer.value.trim() !== ''
    case 'essay':
      return essayAnswer.value.trim() !== ''
    default:
      return false
  }
})

// 方法
const nextQuestion = () => {
  saveAnswer()

  if (currentQuestionIndex.value < props.questions.length - 1) {
    currentQuestionIndex.value++
    loadAnswer()
  }
}

const prevQuestion = () => {
  if (props.config?.allowBack && currentQuestionIndex.value > 0) {
    saveAnswer()
    currentQuestionIndex.value--
    loadAnswer()
  }
}

const saveAnswer = () => {
  const answerData: any = {
    questionId: currentQuestion.value.id,
    questionIndex: currentQuestionIndex.value
  }

  switch (currentQuestion.value.type) {
    case 'single':
    case 'true-false':
      answerData.answer = answer.value
      break
    case 'multiple':
      answerData.answer = [...multipleAnswers.value]
      break
    case 'fill':
      answerData.answer = fillAnswer.value
      break
    case 'essay':
      answerData.answer = essayAnswer.value
      break
  }

  userAnswers.value[currentQuestionIndex.value] = answerData
  emit('progress', progressPercentage.value)
}

const loadAnswer = () => {
  const saved = userAnswers.value[currentQuestionIndex.value]
  if (!saved) {
    clearAnswer()
    return
  }

  switch (currentQuestion.value.type) {
    case 'single':
    case 'true-false':
      answer.value = saved.answer
      break
    case 'multiple':
      multipleAnswers.value = [...saved.answer]
      break
    case 'fill':
      fillAnswer.value = saved.answer
      break
    case 'essay':
      essayAnswer.value = saved.answer
      break
  }
}

const clearAnswer = () => {
  answer.value = null
  multipleAnswers.value = []
  fillAnswer.value = ''
  essayAnswer.value = ''
  showExplanation.value = false
}

const submitQuiz = () => {
  saveAnswer()

  const result = {
    totalQuestions: props.questions.length,
    answers: userAnswers.value,
    score: calculateScore(),
    timeSpent: 0 // TODO: Track time
  }

  emit('complete', result)
}

const calculateScore = () => {
  let score = 0
  userAnswers.value.forEach((answer, index) => {
    const question = props.questions[index]
    if (!question || !answer) return

    const correct = checkAnswer(question, answer.answer)
    if (correct) {
      score += question.points || 10
    }
  })
  return score
}

const checkAnswer = (question: Question, userAnswer: any): boolean => {
  switch (question.type) {
    case 'single':
    case 'true-false':
      return userAnswer === question.answer
    case 'multiple':
      if (!Array.isArray(question.answer) || !Array.isArray(userAnswer)) {
        return false
      }
      return JSON.stringify(question.answer.sort()) === JSON.stringify(userAnswer.sort())
    case 'fill':
      // For fill-in-blank, check if answer contains correct value
      const correctAnswers = (question.answer as string).split('|')
      return correctAnswers.some(ans => ans.toLowerCase().trim() === userAnswer.toLowerCase().trim())
    case 'essay':
      // Essay questions require manual grading
      return false
    default:
      return false
  }
}

// 监听题目变化
watch(
  () => currentQuestionIndex.value,
  () => {
    showExplanation.value = false
  }
)
</script>

<style lang="scss" scoped>
  .quiz-player {
    padding: var(--spacing-lg);
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .loading {
    flex: 1;
  }

  .quiz-content {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .question-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .question-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-lg);

    .question-number {
      font-weight: var(--font-weight-medium);
      color: var(--text-secondary);
    }

    .el-progress {
      flex: 1;
      max-width: 300px;
    }
  }

  .question-body {
    flex: 1;

    h3 {
      margin: 0 0 var(--spacing-lg) 0;
      color: var(--text-primary);
      line-height: var(--line-height-relaxed);
    }
  }

  .options,
  .true-false {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .option-item {
    padding: var(--spacing-base);
    border: 1px solid var(--edu-color-gray-200);
    border-radius: var(--radius-base);
    transition: all var(--edu-duration-fast);

    &:hover {
      border-color: var(--edu-primary-300);
      background-color: var(--edu-primary-50);
    }

    .option-icon {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      margin-right: var(--spacing-sm);
    }
  }

  .fill-blank,
  .essay {
    max-width: 600px;
  }

  .question-actions {
    display: flex;
    justify-content: space-between;
    padding-top: var(--spacing-lg);
    border-top: 1px solid var(--edu-color-gray-200);
  }

  .explanation {
    margin-top: var(--spacing-lg);
  }

  .quiz-complete {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>