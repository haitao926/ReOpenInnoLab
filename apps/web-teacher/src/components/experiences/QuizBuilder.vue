<template>
  <div class="quiz-builder">
    <EduCard title="题目编辑" variant="default">
      <!-- 题目列表 -->
      <div class="questions-list">
        <transition-group name="question" tag="div">
          <div
            v-for="(question, index) in questions"
            :key="question.id"
            class="question-item"
            :class="{ 'question-item--expanded': expandedQuestion === question.id }"
          >
            <div class="question-header" @click="toggleQuestion(question.id)">
              <div class="question-number">{{ index + 1 }}</div>
              <div class="question-info">
                <h4>{{ question.question || '未命名题目' }}</h4>
                <div class="question-meta">
                  <span class="question-type">{{ getQuestionTypeLabel(question.type) }}</span>
                  <span class="question-points">{{ question.points }} 分</span>
                  <span v-if="question.timeLimit" class="question-time">
                    {{ question.timeLimit }} 秒
                  </span>
                </div>
              </div>
              <div class="question-actions" @click.stop>
                <EduButton variant="text" size="sm" @click="duplicateQuestion(index)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </EduButton>
                <EduButton variant="text" size="sm" @click="deleteQuestion(index)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path
                      d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                    />
                  </svg>
                </EduButton>
                <EduButton variant="text" size="sm">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    :class="{ 'rotate-180': expandedQuestion === question.id }"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </EduButton>
              </div>
            </div>

            <!-- 题目编辑区域 -->
            <div v-if="expandedQuestion === question.id" class="question-content">
              <div class="form-group">
                <label>题目类型</label>
                <select v-model="question.type" class="form-select">
                  <option value="single">单选题</option>
                  <option value="multiple">多选题</option>
                  <option value="true-false">判断题</option>
                  <option value="fill">填空题</option>
                  <option value="essay">简答题</option>
                </select>
              </div>

              <div class="form-group">
                <label>题目内容</label>
                <textarea
                  v-model="question.question"
                  class="form-textarea"
                  placeholder="请输入题目内容"
                  rows="3"
                ></textarea>
              </div>

              <!-- 选项编辑（单选/多选） -->
              <div v-if="['single', 'multiple'].includes(question.type)" class="form-group">
                <label>选项</label>
                <div class="options-list">
                  <div
                    v-for="(option, optIndex) in question.options"
                    :key="optIndex"
                    class="option-item"
                  >
                    <EduInput
                      v-model="question.options[optIndex]"
                      :placeholder="`选项 ${String.fromCharCode(65 + optIndex)}`"
                    />
                    <div class="option-answer">
                      <label v-if="question.type === 'single'">
                        <input
                          :checked="question.answer === option"
                          type="radio"
                          :name="`answer-${question.id}`"
                          @change="question.answer = option"
                        />
                      </label>
                      <label v-else>
                        <input
                          :checked="
                            Array.isArray(question.answer) && question.answer.includes(option)
                          "
                          type="checkbox"
                          @change="toggleMultipleAnswer(question, option)"
                        />
                      </label>
                    </div>
                    <EduButton
                      v-if="question.options.length > 2"
                      variant="text"
                      size="sm"
                      @click="removeOption(question, optIndex)"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </EduButton>
                  </div>
                  <EduButton
                    v-if="question.options.length < 8"
                    variant="outline"
                    size="sm"
                    @click="addOption(question)"
                  >
                    + 添加选项
                  </EduButton>
                </div>
              </div>

              <!-- 判断题答案 -->
              <div v-if="question.type === 'true-false'" class="form-group">
                <label>正确答案</label>
                <div class="true-false-options">
                  <label class="radio-label">
                    <input v-model="question.answer" type="radio" :value="true" />
                    正确
                  </label>
                  <label class="radio-label">
                    <input v-model="question.answer" type="radio" :value="false" />
                    错误
                  </label>
                </div>
              </div>

              <!-- 填空题答案 -->
              <div v-if="question.type === 'fill'" class="form-group">
                <label>参考答案</label>
                <EduInput
                  v-model="question.answer"
                  placeholder="请输入参考答案（多个答案用|分隔）"
                />
              </div>

              <!-- 简答题答案 -->
              <div v-if="question.type === 'essay'" class="form-group">
                <label>参考答案</label>
                <textarea
                  v-model="question.answer"
                  class="form-textarea"
                  placeholder="请输入参考答案要点"
                  rows="4"
                ></textarea>
              </div>

              <!-- 解释 -->
              <div class="form-group">
                <label>答案解释</label>
                <textarea
                  v-model="question.explanation"
                  class="form-textarea"
                  placeholder="可选：解释为什么这个答案是正确的"
                  rows="2"
                ></textarea>
              </div>

              <!-- 高级设置 -->
              <div class="form-row">
                <div class="form-group">
                  <label>分值</label>
                  <EduInput
                    v-model.number="question.points"
                    type="number"
                    :min="1"
                    placeholder="题目分值"
                  />
                </div>
                <div class="form-group">
                  <label>时间限制（秒）</label>
                  <EduInput
                    v-model.number="question.timeLimit"
                    type="number"
                    :min="0"
                    placeholder="0 表示不限时"
                  />
                </div>
              </div>

              <!-- 标签 -->
              <div v-if="question.hints && question.hints.length" class="form-group">
                <label>提示</label>
                <div class="hints-list">
                  <div
                    v-for="(hint, hintIndex) in question.hints"
                    :key="hintIndex"
                    class="hint-item"
                  >
                    <EduInput v-model="question.hints[hintIndex]" placeholder="提示内容" />
                    <EduButton variant="text" size="sm" @click="removeHint(question, hintIndex)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </EduButton>
                  </div>
                  <EduButton variant="outline" size="sm" @click="addHint(question)">
                    + 添加提示
                  </EduButton>
                </div>
              </div>
            </div>
          </div>
        </transition-group>
      </div>

      <!-- 添加题目按钮 -->
      <div class="add-question-section">
        <EduButton variant="outline" @click="addQuestion">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          添加题目
        </EduButton>
      </div>

      <!-- 批量操作 -->
      <div class="batch-actions">
        <EduButton variant="text" @click="shuffleQuestions">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="16 3 21 3 21 8" />
            <line x1="4" y1="20" x2="21" y2="3" />
            <polyline points="21 16 21 21 16 21" />
            <line x1="15" y1="15" x2="21" y2="21" />
            <line x1="4" y1="4" x2="9" y2="9" />
          </svg>
          随机排序
        </EduButton>
        <EduButton variant="text" @click="importQuestions">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          导入题目
        </EduButton>
        <EduButton variant="text" @click="exportQuestions">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          导出题目
        </EduButton>
      </div>
    </EduCard>

    <!-- 题目统计 -->
    <EduCard title="题目统计" variant="default" class="mt-4">
      <div class="quiz-stats">
        <div class="stat-item">
          <div class="stat-value">{{ questions.length }}</div>
          <div class="stat-label">总题数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ totalPoints }}</div>
          <div class="stat-label">总分值</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ getQuestionsByType('single') }}</div>
          <div class="stat-label">单选题</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ getQuestionsByType('multiple') }}</div>
          <div class="stat-label">多选题</div>
        </div>
      </div>
    </EduCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { EduButton, EduInput, EduCard } from '@reopeninnolab/ui-kit'
import type { Question } from '@/types/experience'

const props = defineProps<{
    modelValue: Question[]
  }>()

const emit = defineEmits<{
    'update:modelValue': [value: Question[]]
  }>()

const questions = ref<Question[]>(props.modelValue || [])
const expandedQuestion = ref<string>()

// 计算属性
const totalPoints = computed(() => {
  return questions.value.reduce((sum, q) => sum + q.points, 0)
})

// 方法
const addQuestion = () => {
  const newQuestion: Question = {
    id: Date.now().toString(),
    type: 'single',
    question: '',
    options: ['', '', ''],
    answer: '',
    explanation: '',
    points: 10,
    timeLimit: 0,
    hints: []
  }
  questions.value.push(newQuestion)
  expandedQuestion.value = newQuestion.id
  emitUpdate()
}

const deleteQuestion = (index: number) => {
  questions.value.splice(index, 1)
  emitUpdate()
}

const duplicateQuestion = (index: number) => {
  const original = questions.value[index]
  const duplicate: Question = {
    ...original,
    id: Date.now().toString(),
    question: original.question + ' (副本)'
  }
  questions.value.splice(index + 1, 0, duplicate)
  emitUpdate()
}

const toggleQuestion = (questionId: string) => {
  expandedQuestion.value = expandedQuestion.value === questionId ? undefined : questionId
}

const addOption = (question: Question) => {
  if (question.options) {
    question.options.push('')
  }
}

const removeOption = (question: Question, index: number) => {
  if (question.options && question.options.length > 2) {
    question.options.splice(index, 1)
  }
}

const toggleMultipleAnswer = (question: Question, option: string) => {
  if (!Array.isArray(question.answer)) {
    question.answer = []
  }
  const answers = question.answer as string[]
  const index = answers.indexOf(option)
  if (index > -1) {
    answers.splice(index, 1)
  } else {
    answers.push(option)
  }
}

const addHint = (question: Question) => {
  if (!question.hints) {
    question.hints = []
  }
  question.hints.push('')
}

const removeHint = (question: Question, index: number) => {
  if (question.hints) {
    question.hints.splice(index, 1)
  }
}

const getQuestionTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    single: '单选题',
    multiple: '多选题',
    'true-false': '判断题',
    fill: '填空题',
    essay: '简答题'
  }
  return labels[type] || type
}

const getQuestionsByType = (type: string): number => {
  return questions.value.filter(q => q.type === type).length
}

const shuffleQuestions = () => {
  for (let i = questions.value.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[questions.value[i], questions.value[j]] = [questions.value[j], questions.value[i]]
  }
  emitUpdate()
}

const importQuestions = () => {
  // TODO: 实现题目导入功能
  console.log('导入题目')
}

const exportQuestions = () => {
  // TODO: 实现题目导出功能
  console.log('导出题目')
}

const emitUpdate = () => {
  emit('update:modelValue', questions.value)
}

// 监听变化
watch(
  questions,
  () => {
    emitUpdate()
  },
  { deep: true }
)
</script>

<style lang="scss" scoped>
  .quiz-builder {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .questions-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-base);
  }

  .question-item {
    border: 1px solid var(--edu-color-gray-200);
    border-radius: var(--radius-lg);
    overflow: hidden;
    transition: all 0.3s ease;

    &--expanded {
      box-shadow: var(--edu-shadow-md);
    }
  }

  .question-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-base);
    padding: var(--spacing-base);
    background-color: var(--edu-color-gray-50);
    cursor: pointer;

    &:hover {
      background-color: var(--edu-color-gray-100);
    }
  }

  .question-number {
    width: 32px;
    height: 32px;
    background-color: var(--edu-primary-500);
    color: white;
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: var(--font-weight-bold);
    flex-shrink: 0;
  }

  .question-info {
    flex: 1;

    h4 {
      margin: 0 0 var(--spacing-xs) 0;
      color: var(--text-primary);
    }
  }

  .question-meta {
    display: flex;
    gap: var(--spacing-base);
    font-size: var(--font-size-sm);
  }

  .question-type {
    padding: 2px 8px;
    background-color: var(--edu-color-blue-50);
    color: var(--edu-color-blue-600);
    border-radius: var(--radius-base);
  }

  .question-points {
    color: var(--edu-color-success-default);
    font-weight: var(--font-weight-medium);
  }

  .question-time {
    color: var(--text-tertiary);
  }

  .question-actions {
    display: flex;
    gap: var(--spacing-xs);
    flex-shrink: 0;

    svg {
      width: 18px;
      height: 18px;

      &.rotate-180 {
        transform: rotate(180deg);
      }
    }
  }

  .question-content {
    padding: var(--spacing-base);
    background-color: var(--bg-elevated);
    border-top: 1px solid var(--edu-color-gray-200);
  }

  .options-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .option-item {
    display: flex;
    gap: var(--spacing-sm);
    align-items: center;
  }

  .option-answer {
    flex-shrink: 0;
  }

  .true-false-options {
    display: flex;
    gap: var(--spacing-lg);
  }

  .radio-label {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    cursor: pointer;
  }

  .hints-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .hint-item {
    display: flex;
    gap: var(--spacing-sm);
    align-items: center;
  }

  .add-question-section {
    display: flex;
    justify-content: center;
    padding: var(--spacing-lg);
    border: 2px dashed var(--edu-color-gray-300);
    border-radius: var(--radius-lg);
  }

  .batch-actions {
    display: flex;
    justify-content: center;
    gap: var(--spacing-base);
    padding-top: var(--spacing-lg);
    border-top: 1px solid var(--edu-color-gray-200);
  }

  .quiz-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: var(--spacing-lg);
    padding: var(--spacing-base);
  }

  .stat-item {
    text-align: center;

    .stat-value {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--edu-primary-500);
    }

    .stat-label {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      margin-top: var(--spacing-xs);
    }
  }

  // 动画
  .question-enter-active,
  .question-leave-active {
    transition: all 0.3s ease;
  }

  .question-enter-from {
    opacity: 0;
    transform: translateX(-30px);
  }

  .question-leave-to {
    opacity: 0;
    transform: translateX(30px);
  }

  .question-move {
    transition: transform 0.3s ease;
  }

  // 响应式设计
  @media (max-width: 768px) {
    .quiz-stats {
      grid-template-columns: repeat(2, 1fr);
    }

    .batch-actions {
      flex-wrap: wrap;
    }
  }
</style>
