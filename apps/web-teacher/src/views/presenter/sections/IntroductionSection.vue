<template>
  <div class="introduction-section">
    <!-- 主要内容区 -->
    <div class="section-content">
      <!-- 钩子内容 -->
      <div class="hook-content" v-if="content">
        <!-- 问题式钩子 -->
        <div v-if="content.hookType === 'question'" class="question-hook">
          <div class="question-mark">?</div>
          <h2 class="question-text">{{ content.hookContent }}</h2>
          <div class="thinking-time">
            <el-icon><Timer /></el-icon>
            <span>请思考 30 秒</span>
          </div>
        </div>

        <!-- 故事式钩子 -->
        <div v-else-if="content.hookType === 'story'" class="story-hook">
          <div class="story-icon">
            <el-icon><Reading /></el-icon>
          </div>
          <div class="story-content">
            <p class="story-text">{{ content.hookContent }}</p>
          </div>
        </div>

        <!-- 视频式钩子 -->
        <div v-else-if="content.hookType === 'video'" class="video-hook">
          <MediaPlayer
            v-if="content.hookContent"
            :src="content.hookContent"
            :show-controls="true"
            :autoplay="false"
            @ended="onVideoEnded"
          />
        </div>

        <!-- 图片式钩子 -->
        <div v-else-if="content.hookType === 'image'" class="image-hook">
          <div class="image-container">
            <img :src="content.hookContent" alt="引入图片" class="hook-image" />
            <div class="image-caption">{{ content.imageCaption || '' }}</div>
          </div>
        </div>
      </div>

      <!-- 学习目标 -->
      <div class="learning-objectives" v-if="content && content.objectives">
        <h3 class="objectives-title">
          <el-icon><Target /></el-icon>
          本节课学习目标
        </h3>
        <div class="objectives-list">
          <div
            v-for="(objective, index) in content.objectives"
            :key="index"
            class="objective-item"
            :class="{ active: objectiveVisible[index] }"
          >
            <el-icon class="objective-icon"><Check /></el-icon>
            <span class="objective-text">{{ objective }}</span>
          </div>
        </div>
      </div>

      <!-- 先验知识 -->
      <div class="prerequisites" v-if="content && content.prerequisites">
        <h3 class="prerequisites-title">
          <el-icon><Collection /></el-icon>
          先备知识
        </h3>
        <div class="prerequisites-list">
          <el-tag
            v-for="(prereq, index) in content.prerequisites"
            :key="index"
            type="info"
            class="prerequisite-tag"
          >
            {{ prereq }}
          </el-tag>
        </div>
      </div>

      <!-- 互动元素 -->
      <div class="interactive-elements">
        <!-- 快速投票 -->
        <div v-if="showPoll" class="quick-poll">
          <h4>快速调查</h4>
          <p class="poll-question">{{ pollQuestion }}</p>
          <div class="poll-options">
            <el-button
              v-for="(option, index) in pollOptions"
              :key="index"
              :type="selectedPollOption === index ? 'primary' : 'default'"
              @click="selectPollOption(index)"
              class="poll-option"
            >
              {{ option }}
            </el-button>
          </div>
          <div class="poll-results" v-if="showPollResults">
            <div
              v-for="(result, index) in pollResults"
              :key="index"
              class="poll-result"
            >
              <span class="result-label">{{ pollOptions[index] }}:</span>
              <div class="result-bar">
                <div
                  class="result-fill"
                  :style="{ width: result.percentage + '%' }"
                ></div>
              </div>
              <span class="result-count">{{ result.count }}票</span>
            </div>
          </div>
        </div>

        <!-- 期望设定 -->
        <div class="expectations-setting">
          <h4>课堂期望</h4>
          <p class="expectations-prompt">你对这节课有什么期望？</p>
          <div class="expectations-input">
            <el-input
              v-model="expectationInput"
              type="textarea"
              :rows="3"
              placeholder="分享你的学习期望..."
              maxlength="200"
              show-word-limit
            />
            <el-button
              type="primary"
              @click="submitExpectation"
              :disabled="!expectationInput.trim()"
              size="small"
            >
              提交期望
            </el-button>
          </div>
          <div class="expectations-list" v-if="expectations.length > 0">
            <div
              v-for="(expectation, index) in expectations"
              :key="index"
              class="expectation-item"
            >
              <el-icon><ChatDotRound /></el-icon>
              <span>{{ expectation }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 侧边工具栏 -->
    <div class="section-tools" v-if="showTools">
      <el-button-group>
        <el-button size="small" @click="toggleTimer" :type="timerActive ? 'primary' : 'default'">
          <el-icon><Timer /></el-icon>
          计时器
        </el-button>
        <el-button size="small" @click="showPoll = !showPoll">
          <el-icon><PieChart /></el-icon>
          投票
        </el-button>
        <el-button size="small" @click="generateQuestion">
          <el-icon><QuestionFilled /></el-icon>
          提问
        </el-button>
        <el-button size="small" @click="nextSection">
          <el-icon><ArrowRight /></el-icon>
          开始上课
        </el-button>
      </el-button-group>

      <!-- 计时器显示 -->
      <div class="timer-display" v-if="timerActive">
        <div class="timer-time">{{ formatTime(timerSeconds) }}</div>
        <div class="timer-controls">
          <el-button size="small" @click="toggleTimerPlay">
            <el-icon v-if="timerPlaying"><VideoPause /></el-icon>
            <el-icon v-else><VideoPlay /></el-icon>
          </el-button>
          <el-button size="small" @click="resetTimer">
            <el-icon><RefreshRight /></el-icon>
          </el-button>
        </div>
      </div>
    </div>

    <!-- AI 助手建议 -->
    <div class="ai-suggestions" v-if="aiSuggestions.length > 0">
      <h4>
        <el-icon><MagicStick /></el-icon>
        AI 教学建议
      </h4>
      <div class="suggestions-list">
        <div
          v-for="(suggestion, index) in aiSuggestions"
          :key="index"
          class="suggestion-item"
        >
          <el-tag :type="suggestion.type" size="small">{{ suggestion.category }}</el-tag>
          <p class="suggestion-text">{{ suggestion.content }}</p>
          <el-button size="small" text @click="applySuggestion(suggestion)">
            采纳建议
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Timer,
  Reading,
  Target,
  Collection,
  Check,
  PieChart,
  QuestionFilled,
  ArrowRight,
  ChatDotRound,
  MagicStick,
  VideoPlay,
  VideoPause,
  RefreshRight
} from '@element-plus/icons-vue'
import MediaPlayer from '@/components/resources/MediaPlayer.vue'

interface IntroductionContent {
  hookType: 'question' | 'story' | 'video' | 'image'
  hookContent: string
  imageCaption?: string
  objectives: string[]
  prerequisites?: string[]
}

interface Props {
  content?: IntroductionContent
  showTools?: boolean
  aiEnabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showTools: true,
  aiEnabled: true
})

const emit = defineEmits<{
  next: []
  interaction: [type: string, data: any]
  aiSuggestion: [suggestion: any]
}>()

// 响应式数据
const objectiveVisible = ref<boolean[]>([])
const showPoll = ref(false)
const pollQuestion = ref('你对今天的内容了解多少？')
const pollOptions = ref(['完全陌生', '听说过', '了解一些', '很熟悉'])
const selectedPollOption = ref<number | null>(null)
const showPollResults = ref(false)
const pollResults = ref<Array<{ option: string, count: number, percentage: number }>>([])

const expectationInput = ref('')
const expectations = ref<string[]>([])

const timerActive = ref(false)
const timerPlaying = ref(false)
const timerSeconds = ref(0)
let timerInterval: NodeJS.Timeout | null = null

const aiSuggestions = ref<Array<{
  category: string
  type: string
  content: string
  action?: string
}>>([])

// 方法
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const onVideoEnded = () => {
  ElMessage.info('视频播放完成，准备进入学习目标')
  setTimeout(() => {
    revealObjectives()
  }, 1000)
}

const revealObjectives = () => {
  if (!props.content?.objectives) return

  props.content.objectives.forEach((_, index) => {
    setTimeout(() => {
      objectiveVisible.value[index] = true
    }, index * 800)
  })
}

const selectPollOption = (option: number) => {
  selectedPollOption.value = option

  // 模拟收集投票结果
  setTimeout(() => {
    collectPollResults()
  }, 2000)
}

const collectPollResults = () => {
  // 模拟投票结果
  const mockResults = [
    { count: 3, percentage: 15 },
    { count: 8, percentage: 40 },
    { count: 6, percentage: 30 },
    { count: 3, percentage: 15 }
  ]

  pollResults.value = mockResults.map((result, index) => ({
    option: pollOptions.value[index],
    ...result
  }))

  showPollResults.value = true

  emit('interaction', 'poll_completed', {
    question: pollQuestion.value,
    options: pollOptions.value,
    results: pollResults.value
  })
}

const submitExpectation = () => {
  if (!expectationInput.value.trim()) return

  expectations.value.push(expectationInput.value.trim())
  expectationInput.value = ''

  ElMessage.success('期望已提交，谢谢分享！')

  emit('interaction', 'expectation_submitted', {
    expectation: expectations.value[expectations.value.length - 1]
  })
}

const toggleTimer = () => {
  timerActive.value = !timerActive.value
  if (!timerActive.value) {
    resetTimer()
  }
}

const toggleTimerPlay = () => {
  timerPlaying.value = !timerPlaying.value

  if (timerPlaying.value) {
    startTimer()
  } else {
    pauseTimer()
  }
}

const startTimer = () => {
  if (timerInterval) return

  timerInterval = setInterval(() => {
    timerSeconds.value++
  }, 1000)
}

const pauseTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

const resetTimer = () => {
  pauseTimer()
  timerSeconds.value = 0
  timerPlaying.value = false
}

const generateQuestion = () => {
  // AI生成启发性问题
  const questions = [
    '你认为这个概念在生活中有哪些应用？',
    '能否举一个与此相关的实际例子？',
    '这个知识点和你之前学过的内容有什么联系？'
  ]

  const randomQuestion = questions[Math.floor(Math.random() * questions.length)]

  ElMessage({
    message: randomQuestion,
    type: 'info',
    duration: 0,
    showClose: true
  })

  emit('interaction', 'ai_question_generated', { question: randomQuestion })
}

const applySuggestion = (suggestion: any) => {
  ElMessage.success('已采纳AI建议')
  emit('aiSuggestion', suggestion)

  // 根据建议类型执行相应操作
  if (suggestion.action === 'reveal_objectives') {
    revealObjectives()
  } else if (suggestion.action === 'start_poll') {
    showPoll.value = true
  } else if (suggestion.action === 'set_timer') {
    timerActive.value = true
    timerSeconds.value = 300 // 5分钟
  }
}

const nextSection = () => {
  emit('next')
}

const generateAISuggestions = () => {
  if (!props.aiEnabled) return

  // 根据内容生成AI建议
  const suggestions = []

  if (props.content?.objectives && props.content.objectives.length > 3) {
    suggestions.push({
      category: '教学建议',
      type: 'info',
      content: '学习目标较多，建议分步骤展示，避免信息过载',
      action: 'reveal_objectives'
    })
  }

  if (props.content?.hookType === 'question') {
    suggestions.push({
      category: '互动建议',
      type: 'success',
      content: '问题式引入很好，建议给学生30秒思考时间，然后邀请分享',
      action: 'set_timer'
    })
  }

  if (props.content?.prerequisites && props.content.prerequisites.length > 0) {
    suggestions.push({
      category: '评估建议',
      type: 'warning',
      content: '建议通过快速投票了解学生对先备知识的掌握情况',
      action: 'start_poll'
    })
  }

  aiSuggestions.value = suggestions
}

// 生命周期
onMounted(() => {
  // 延迟显示学习目标
  setTimeout(() => {
    revealObjectives()
  }, 1000)

  // 生成AI建议
  setTimeout(() => {
    generateAISuggestions()
  }, 2000)
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})
</script>

<style lang="scss" scoped>
.introduction-section {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 40px;
  min-height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
    animation: float 20s ease-in-out infinite;
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

.section-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* 钩子内容样式 */
.hook-content {
  text-align: center;
  animation: fadeInUp 0.8s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.question-hook {
  .question-mark {
    font-size: 120px;
    font-weight: bold;
    color: rgba(255, 255, 255, 0.3);
    margin-bottom: 20px;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  .question-text {
    font-size: 32px;
    font-weight: 600;
    margin: 0 0 30px 0;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  }

  .thinking-time {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 18px;
    color: rgba(255, 255, 255, 0.8);
  }
}

.story-hook {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  max-width: 800px;
  margin: 0 auto;

  .story-icon {
    font-size: 48px;
    background: rgba(255, 255, 255, 0.2);
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .story-content {
    flex: 1;

    .story-text {
      font-size: 20px;
      line-height: 1.8;
      margin: 0;
      font-style: italic;
    }
  }
}

.video-hook {
  max-width: 900px;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.image-hook {
  .image-container {
    text-align: center;
    max-width: 900px;
    margin: 0 auto;

    .hook-image {
      max-width: 100%;
      height: auto;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    }

    .image-caption {
      margin-top: 16px;
      font-size: 16px;
      color: rgba(255, 255, 255, 0.8);
      font-style: italic;
    }
  }
}

/* 学习目标样式 */
.learning-objectives {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 32px;
  border: 1px solid rgba(255, 255, 255, 0.2);

  .objectives-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 24px 0;
  }

  .objectives-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .objective-item {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 18px;
    opacity: 0;
    transform: translateX(-20px);
    transition: all 0.6s ease;

    &.active {
      opacity: 1;
      transform: translateX(0);
    }

    .objective-icon {
      color: #4ade80;
      font-size: 20px;
      flex-shrink: 0;
    }

    .objective-text {
      line-height: 1.5;
    }
  }
}

/* 先备知识样式 */
.prerequisites {
  .prerequisites-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 16px 0;
    color: rgba(255, 255, 255, 0.9);
  }

  .prerequisites-list {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .prerequisite-tag {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
}

/* 互动元素样式 */
.interactive-elements {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.quick-poll {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);

  h4 {
    margin: 0 0 16px 0;
    font-size: 18px;
    font-weight: 600;
  }

  .poll-question {
    font-size: 16px;
    margin: 0 0 20px 0;
    color: rgba(255, 255, 255, 0.9);
  }

  .poll-options {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 20px;
  }

  .poll-option {
    flex: 1;
    min-width: 120px;
  }

  .poll-results {
    .poll-result {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;

      .result-label {
        min-width: 80px;
        font-size: 14px;
      }

      .result-bar {
        flex: 1;
        height: 8px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        overflow: hidden;

        .result-fill {
          height: 100%;
          background: #4ade80;
          transition: width 0.8s ease;
        }
      }

      .result-count {
        min-width: 40px;
        font-size: 12px;
        text-align: right;
      }
    }
  }
}

.expectations-setting {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);

  h4 {
    margin: 0 0 12px 0;
    font-size: 18px;
    font-weight: 600;
  }

  .expectations-prompt {
    margin: 0 0 16px 0;
    color: rgba(255, 255, 255, 0.9);
  }

  .expectations-input {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
  }

  .expectations-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 150px;
    overflow-y: auto;

    .expectation-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      font-size: 14px;
    }
  }
}

/* 侧边工具栏 */
.section-tools {
  position: fixed;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);

  .timer-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);

    .timer-time {
      font-size: 24px;
      font-weight: bold;
      font-family: 'Monaco', monospace;
    }

    .timer-controls {
      display: flex;
      gap: 4px;
    }
  }
}

/* AI建议样式 */
.ai-suggestions {
  background: rgba(16, 185, 129, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(16, 185, 129, 0.3);

  h4 {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 16px 0;
  }

  .suggestions-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .suggestion-item {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 16px;
    border: 1px solid rgba(255, 255, 255, 0.2);

    .suggestion-text {
      margin: 8px 0;
      line-height: 1.5;
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .introduction-section {
    padding: 20px;
    gap: 24px;
  }

  .question-hook .question-text {
    font-size: 24px;
  }

  .story-hook {
    flex-direction: column;
    text-align: center;
  }

  .learning-objectives,
  .prerequisites,
  .quick-poll,
  .expectations-setting {
    padding: 20px;
  }

  .section-tools {
    position: fixed;
    right: 10px;
    top: auto;
    bottom: 20px;
    transform: none;
    flex-direction: row;
  }

  .poll-options {
    flex-direction: column;
  }

  .poll-option {
    width: 100%;
  }
}
</style>