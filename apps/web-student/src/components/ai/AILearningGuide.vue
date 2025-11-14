<template>
  <div class="ai-learning-guide">
    <div class="guide-header">
      <h4>AI 学习助手</h4>
      <el-switch
        v-model="aiEnabled"
        size="small"
        @change="toggleAI"
      />
    </div>

    <Transition name="guide-content">
      <div v-if="aiEnabled" class="guide-content">
        <!-- AI 课程总结 -->
        <div class="ai-summary-section">
          <h5>课程要点总结</h5>
          <div class="summary-content">
            <div
              v-for="point in aiSummary"
              :key="point.id"
              class="summary-point"
            >
              <div class="point-icon">
                <el-icon><MagicStick /></el-icon>
              </div>
              <div class="point-content">
                <h6>{{ point.title }}</h6>
                <p>{{ point.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 知识点巩固建议 -->
        <div class="knowledge-reinforcement-section">
          <h5>知识点巩固</h5>
          <div class="suggestion-list">
            <div
              v-for="suggestion in aiSuggestions"
              :key="suggestion.id"
              class="suggestion-item"
              @click="applySuggestion(suggestion)"
            >
              <div class="suggestion-type">
                <EduTag
                  :variant="getSuggestionVariant(suggestion.type)"
                  size="xs"
                >
                  {{ suggestion.type }}
                </EduTag>
              </div>
              <div class="suggestion-content">
                <p>{{ suggestion.text }}</p>
                <div class="suggestion-meta">
                  <span class="difficulty">难度：{{ suggestion.difficulty }}</span>
                  <span class="duration">时长：{{ suggestion.duration }}分钟</span>
                </div>
              </div>
              <div class="suggestion-action">
                <el-button type="text" size="small">
                  开始练习
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- AI 对话 -->
        <div class="ai-chat-section">
          <h5>AI 问答</h5>
          <div class="chat-container">
            <div class="chat-messages" ref="chatMessagesRef">
              <div
                v-for="message in chatHistory"
                :key="message.id"
                :class="['chat-message', `message-${message.type}`]"
              >
                <div class="message-avatar">
                  <el-avatar v-if="message.type === 'user'" size="small">
                    <el-icon><User /></el-icon>
                  </el-avatar>
                  <el-avatar v-else size="small">
                    <el-icon><MagicStick /></el-icon>
                  </el-avatar>
                </div>
                <div class="message-content">
                  <div class="message-text">{{ message.content }}</div>
                  <div class="message-time">{{ formatTime(message.timestamp) }}</div>
                </div>
              </div>
            </div>

            <div class="chat-input">
              <el-input
                v-model="userQuestion"
                placeholder="向AI提问..."
                @keyup.enter="askAI"
                :disabled="chatLoading"
              >
                <template #append>
                  <el-button
                    @click="askAI"
                    :loading="chatLoading"
                    icon="Position"
                  />
                </template>
              </el-input>
            </div>
          </div>
        </div>

        <!-- 学习建议 -->
        <div class="learning-tips-section">
          <h5>个性化建议</h5>
          <div class="tips-content">
            <EduCard variant="bordered" size="sm">
              <div class="tip-item">
                <div class="tip-icon">
                  <el-icon><TrendCharts /></el-icon>
                </div>
                <div class="tip-content">
                  <h6>学习进度分析</h6>
                  <p>{{ learningProgressTip }}</p>
                </div>
              </div>
            </EduCard>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  MagicStick,
  User,
  TrendCharts
} from '@element-plus/icons-vue'

import EduTag from '@reopeninnolab/ui-kit'
import EduCard from '@reopeninnolab/ui-kit'
import {
  startAIConversation,
  sendAIMessage,
  getAISuggestions,
  askQuestion as askAIQuestion,
  type AIMessage,
  type AISuggestion
} from '@/api/ai'

interface Course {
  id: string
  title: string
}

interface Chapter {
  id: string
  title: string
}

interface Props {
  course?: Course | null
  chapter?: Chapter | null
}

const props = defineProps<Props>()

// 响应式数据
const aiEnabled = ref(true)
const userQuestion = ref('')
const chatLoading = ref(false)
const chatMessagesRef = ref<HTMLElement>()
const conversationId = ref<string>('')

const aiSummary = ref([
  {
    id: '1',
    title: 'Python基础语法',
    description: '掌握变量、数据类型、运算符等基本概念'
  },
  {
    id: '2',
    title: '控制结构',
    description: '理解条件语句和循环语句的使用方法'
  },
  {
    id: '3',
    title: '函数定义',
    description: '学会如何定义和调用函数，理解参数传递'
  }
])

const aiSuggestions = ref([
  {
    id: '1',
    type: '练习',
    text: '完成变量和数据类型的编程练习',
    difficulty: '简单',
    duration: 15
  },
  {
    id: '2',
    type: '复习',
    text: '回顾上节课的循环语句知识点',
    difficulty: '中等',
    duration: 10
  },
  {
    id: '3',
    type: '拓展',
    text: '探索Python的高级数据结构',
    difficulty: '困难',
    duration: 25
  }
])

const chatHistory = ref<AIMessage[]>([
  {
    id: '1',
    type: 'assistant',
    content: '你好！我是你的AI学习助手。有什么可以帮助你的吗？',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
  }
])

const learningProgressTip = computed(() => {
  return '你在Python基础语法方面表现不错，建议加强函数定义的练习。'
})

// 方法
const toggleAI = (enabled: boolean) => {
  ElMessage.info(enabled ? 'AI助手已启用' : 'AI助手已关闭')
}

const getSuggestionVariant = (type: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' | 'default' => {
  switch (type) {
    case '练习':
      return 'primary'
    case '复习':
      return 'success'
    case '拓展':
      return 'warning'
    default:
      return 'default'
  }
}

const applySuggestion = (suggestion: any) => {
  ElMessage.success(`开始${suggestion.type}：${suggestion.text}`)
}

const askAI = async () => {
  if (!userQuestion.value.trim()) {
    ElMessage.warning('请输入问题')
    return
  }

  const question = userQuestion.value.trim()
  userQuestion.value = ''

  // 添加用户消息
  chatHistory.value.push({
    id: Date.now().toString(),
    type: 'user',
    content: question,
    timestamp: new Date().toISOString()
  })

  chatLoading.value = true

  // 滚动到底部
  await nextTick()
  scrollToBottom()

  try {
    let aiResponse: AIMessage

    // 如果有对话ID，使用对话API
    if (conversationId.value) {
      aiResponse = await sendAIMessage(conversationId.value, question, {
        courseId: props.course?.id,
        chapterId: props.chapter?.id
      })
    } else {
      // 首次对话，启动新对话
      const conversation = await startAIConversation({
        courseId: props.course?.id,
        chapterId: props.chapter?.id
      })
      conversationId.value = conversation.conversationId

      // 发送第一条消息
      aiResponse = await sendAIMessage(conversation.conversationId, question, {
        courseId: props.course?.id,
        chapterId: props.chapter?.id
      })
    }

    chatHistory.value.push(aiResponse)

    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('AI响应失败:', error)

    // 降级到关键词回复
    let fallbackResponse = '这是一个很好的问题！让我来帮你解答。'

    if (question.includes('变量')) {
      fallbackResponse = '变量是用来存储数据的容器。在Python中，你可以直接给变量赋值，比如：x = 10。变量名应该具有描述性，方便理解代码的含义。'
    } else if (question.includes('循环')) {
      fallbackResponse = '循环用于重复执行代码块。Python主要有for循环和while循环。for循环通常用于遍历序列，while循环在条件为真时重复执行。'
    } else if (question.includes('函数')) {
      fallbackResponse = '函数是可重复使用的代码块。使用def关键字定义函数，可以有参数和返回值。函数有助于代码的模块化和复用。'
    }

    chatHistory.value.push({
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: fallbackResponse,
      timestamp: new Date().toISOString()
    })

    await nextTick()
    scrollToBottom()
  } finally {
    chatLoading.value = false
  }
}

const formatTime = (timestamp: string): string => {
  const now = new Date()
  const date = new Date(timestamp)
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`

  return `${Math.floor(hours / 24)}天前`
}

const scrollToBottom = () => {
  if (chatMessagesRef.value) {
    chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
  }
}

// 加载AI建议
const loadAISuggestions = async () => {
  try {
    const suggestions = await getAISuggestions({
      courseId: props.course?.id,
      chapterId: props.chapter?.id
    })

    if (suggestions.length > 0) {
      // 转换API建议为本地格式
      aiSuggestions.value = suggestions.map(suggestion => ({
        id: suggestion.id,
        type: suggestion.type === 'study' ? '复习' :
              suggestion.type === 'content' ? '学习' :
              suggestion.type === 'activity' ? '练习' : '建议',
        text: suggestion.description,
        difficulty: suggestion.priority === 'high' ? '困难' :
                  suggestion.priority === 'medium' ? '中等' : '简单',
        duration: 15
      }))
    }
  } catch (error) {
    console.error('加载AI建议失败:', error)
    // 保持默认建议
  }
}

// 生命周期
onMounted(async () => {
  scrollToBottom()
  await loadAISuggestions()
})
</script>

<style scoped lang="scss">
.ai-learning-guide {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(14px);
  overflow: hidden;
}

.guide-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(99, 102, 241, 0.04) 100%);
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.guide-header h4 {
  font-size: 16px;
  font-weight: 700;
  color: var(--edu-text-primary);
  margin: 0;
}

.guide-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.ai-summary-section,
.knowledge-reinforcement-section,
.ai-chat-section,
.learning-tips-section {
  h5 {
    font-size: 14px;
    font-weight: 600;
    color: var(--edu-text-primary);
    margin: 0 0 12px 0;
  }
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-point {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: rgba(15, 23, 42, 0.04);
  border-radius: 12px;
  transition: background-color var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    background: rgba(99, 102, 241, 0.08);
  }
}

.point-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--edu-primary-500) 0%, var(--edu-primary-600) 100%);
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
}

.point-content {
  flex: 1;
  min-width: 0;
}

.point-content h6 {
  font-size: 14px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin: 0 0 4px 0;
}

.point-content p {
  font-size: 12px;
  color: var(--edu-text-secondary);
  margin: 0;
  line-height: 1.4;
}

.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(15, 23, 42, 0.04);
  border-radius: 12px;
  cursor: pointer;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    background: rgba(99, 102, 241, 0.08);
    transform: translateY(-1px);
  }
}

.suggestion-type {
  flex-shrink: 0;
}

.suggestion-content {
  flex: 1;
  min-width: 0;
}

.suggestion-content p {
  font-size: 13px;
  color: var(--edu-text-primary);
  margin: 0 0 4px 0;
  line-height: 1.4;
}

.suggestion-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: var(--edu-text-secondary);
}

.suggestion-action {
  flex-shrink: 0;
}

.chat-container {
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 12px;
  overflow: hidden;
  background: white;
}

.chat-messages {
  height: 200px;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-message {
  display: flex;
  gap: 8px;
  align-items: flex-start;

  &.message-user {
    flex-direction: row-reverse;

    .message-content {
      background: var(--edu-primary-500);
      color: white;
    }
  }

  &.message-ai {
    .message-content {
      background: rgba(15, 23, 42, 0.04);
    }
  }
}

.message-avatar {
  flex-shrink: 0;
}

.message-content {
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.4;
}

.message-text {
  margin-bottom: 4px;
}

.message-time {
  font-size: 11px;
  opacity: 0.7;
}

.chat-input {
  padding: 12px;
  border-top: 1px solid rgba(15, 23, 42, 0.12);
}

.tips-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tip-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.tip-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
}

.tip-content {
  flex: 1;
  min-width: 0;
}

.tip-content h6 {
  font-size: 13px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin: 0 0 4px 0;
}

.tip-content p {
  font-size: 12px;
  color: var(--edu-text-secondary);
  margin: 0;
  line-height: 1.4;
}

// 过渡动画
.guide-content-enter-active,
.guide-content-leave-active {
  transition: all var(--edu-duration-normal) var(--edu-easing-smooth);
  overflow: hidden;
}

.guide-content-enter-from {
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
}

.guide-content-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
}

.guide-content-enter-to,
.guide-content-leave-from {
  max-height: 1000px;
  opacity: 1;
  transform: translateY(0);
}

// 响应式设计
@media (max-width: 768px) {
  .guide-header {
    padding: 12px 16px;
  }

  .guide-content {
    padding: 16px;
    gap: 20px;
  }

  .suggestion-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .suggestion-action {
    width: 100%;
  }

  .suggestion-action .el-button {
    width: 100%;
  }

  .chat-messages {
    height: 150px;
  }

  .message-content {
    max-width: 85%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .guide-content-enter-active,
  .guide-content-leave-active {
    transition: none;
  }

  .suggestion-item {
    transition: none;
  }

  .suggestion-item:hover {
    transform: none;
  }
}
</style>