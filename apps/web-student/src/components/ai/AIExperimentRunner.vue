<template>
  <div class="ai-experiment-runner">
    <!-- 实验配置检查 -->
    <div v-if="!config || !isValidConfig" class="config-error">
      <el-result
        icon="warning"
        title="AI实验配置错误"
        sub-title="缺少必要的AI实验配置信息"
      >
        <template #extra>
          <el-button type="primary" @click="$emit('error', 'AI实验配置不完整')">
            返回
          </el-button>
        </template>
      </el-result>
    </div>

    <!-- AI实验初始化 -->
    <div v-else-if="status === 'initializing'" class="ai-initializing">
      <div class="init-loading">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <h3>正在初始化AI实验环境</h3>
        <p>{{ initStatusText }}</p>
        <el-progress :percentage="initProgress" :show-text="false" />
        <div class="init-steps">
          <div
            v-for="(step, index) in initSteps"
            :key="index"
            class="init-step"
            :class="{
              completed: index < currentStep,
              active: index === currentStep,
              pending: index > currentStep
            }"
          >
            <el-icon>
              <Check v-if="index < currentStep" />
              <Loading v-else-if="index === currentStep" />
              <Clock v-else />
            </el-icon>
            <span>{{ step }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- AI实验运行中 -->
    <div v-else-if="status === 'running'" class="ai-running">
      <!-- 实验控制栏 -->
      <div class="experiment-controls">
        <div class="control-left">
          <el-tag type="success" size="small">
            <el-icon><CircleCheck /></el-icon>
            AI实验运行中
          </el-tag>
          <span class="model-info">
            模型: {{ config.modelProvider }}/{{ config.modelName }}
          </span>
          <span class="runtime-info">
            运行时间: {{ formatRuntime(session?.startTime) }}
          </span>
        </div>
        <div class="control-right">
          <el-button size="small" @click="showContext = !showContext">
            <el-icon><View /></el-icon>
            {{ showContext ? '隐藏' : '显示' }}上下文
          </el-button>
          <el-button size="small" @click="showHistory = !showHistory">
            <el-icon><Clock /></el-icon>
            {{ showHistory ? '隐藏' : '显示' }}历史
          </el-button>
          <el-button size="small" type="warning" @click="resetExperiment">
            <el-icon><RefreshRight /></el-icon>
            重置
          </el-button>
          <el-button size="small" type="danger" @click="stopExperiment">
            <el-icon><Close /></el-icon>
            停止
          </el-button>
        </div>
      </div>

      <div class="experiment-content">
        <!-- 左侧：交互区域 -->
        <div class="interaction-panel">
          <!-- AI上下文信息 -->
          <div v-if="showContext && aiContext" class="context-panel">
            <div class="panel-header">
              <h4>AI上下文</h4>
            </div>
            <div class="context-content">
              <div class="context-section">
                <h5>学习上下文</h5>
                <div class="context-item">
                  <span class="label">学习风格:</span>
                  <el-tag size="small">{{ aiContext.learningContext.learningStyle }}</el-tag>
                </div>
                <div class="context-item">
                  <span class="label">难度偏好:</span>
                  <el-tag size="small" :type="getDifficultyType(aiContext.learningContext.preferredDifficulty)">
                    {{ aiContext.learningContext.preferredDifficulty }}
                  </el-tag>
                </div>
                <div class="context-item">
                  <span class="label">节奏偏好:</span>
                  <el-tag size="small">{{ aiContext.learningContext.pacePreference }}</el-tag>
                </div>
              </div>

              <div class="context-section">
                <h5>行为上下文</h5>
                <div class="context-item">
                  <span class="label">参与度:</span>
                  <el-progress
                    :percentage="getEngagementPercentage(aiContext.behaviorContext.engagementLevel)"
                    :show-text="false"
                    :stroke-width="4"
                    class="mini-progress"
                  />
                </div>
                <div class="context-item">
                  <span class="label">帮助请求:</span>
                  <span>{{ aiContext.behaviorContext.helpRequests }}</span>
                </div>
              </div>

              <div class="context-section">
                <h5>环境上下文</h5>
                <div class="context-item">
                  <span class="label">设备:</span>
                  <span>{{ aiContext.environmentContext.device }}</span>
                </div>
                <div class="context-item">
                  <span class="label">时间段:</span>
                  <span>{{ aiContext.environmentContext.timeOfDay }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 交互模式选择 -->
          <div class="interaction-modes">
            <div class="mode-header">
              <h4>交互模式</h4>
            </div>
            <div class="mode-list">
              <div
                v-for="mode in availableModes"
                :key="mode.id"
                class="mode-item"
                :class="{ active: currentMode?.id === mode.id }"
                @click="switchMode(mode)"
              >
                <el-icon>
                  <component :is="mode.icon" />
                </el-icon>
                <div class="mode-info">
                  <div class="mode-name">{{ mode.name }}</div>
                  <div class="mode-description">{{ mode.description }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 交互界面 -->
          <div class="interaction-interface">
            <!-- 对话式交互 -->
            <div v-if="currentMode?.id === 'conversation'" class="conversation-interface">
              <div class="messages-container" ref="messagesContainer">
                <div
                  v-for="message in conversationMessages"
                  :key="message.id"
                  class="message-item"
                  :class="message.type"
                >
                  <div class="message-avatar">
                    <el-icon v-if="message.type === 'assistant'"><ChatDotRound /></el-icon>
                    <el-icon v-else><User /></el-icon>
                  </div>
                  <div class="message-content">
                    <div class="message-text">{{ message.content }}</div>
                    <div class="message-time">{{ formatMessageTime(message.timestamp) }}</div>
                  </div>
                </div>
              </div>
              <div class="input-area">
                <el-input
                  v-model="userInput"
                  type="textarea"
                  :rows="3"
                  placeholder="输入你的问题或想法..."
                  @keydown.enter.ctrl="sendMessage"
                  :disabled="isProcessing"
                />
                <div class="input-actions">
                  <el-button-group>
                    <el-button
                      size="small"
                      @click="sendQuickMessage('给我一个提示')"
                      :disabled="isProcessing"
                    >
                      提示
                    </el-button>
                    <el-button
                      size="small"
                      @click="sendQuickMessage('解释一下')"
                      :disabled="isProcessing"
                    >
                      解释
                    </el-button>
                    <el-button
                      size="small"
                      @click="sendQuickMessage('举个例子')"
                      :disabled="isProcessing"
                    >
                      举例
                    </el-button>
                  </el-button-group>
                  <el-button
                    type="primary"
                    @click="sendMessage"
                    :loading="isProcessing"
                    :disabled="!userInput.trim()"
                  >
                    发送
                  </el-button>
                </div>
              </div>
            </div>

            <!-- 指导式交互 -->
            <div v-else-if="currentMode?.id === 'tutorial'" class="tutorial-interface">
              <div class="tutorial-steps">
                <div
                  v-for="(step, index) in tutorialSteps"
                  :key="index"
                  class="tutorial-step"
                  :class="{
                    completed: index < currentTutorialStep,
                    active: index === currentTutorialStep,
                    pending: index > currentTutorialStep
                  }"
                >
                  <div class="step-header">
                    <el-icon>
                      <Check v-if="index < currentTutorialStep" />
                      <Loading v-else-if="index === currentTutorialStep" />
                      <Clock v-else />
                    </el-icon>
                    <span class="step-title">{{ step.title }}</span>
                  </div>
                  <div class="step-content">{{ step.content }}</div>
                  <div v-if="index === currentTutorialStep" class="step-actions">
                    <el-button size="small" @click="previousStep" :disabled="currentTutorialStep === 0">
                      上一步
                    </el-button>
                    <el-button size="small" type="primary" @click="nextStep">
                      {{ index === tutorialSteps.length - 1 ? '完成' : '下一步' }}
                    </el-button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 协作式交互 -->
            <div v-else-if="currentMode?.id === 'collaborative'" class="collaborative-interface">
              <div class="collaboration-workspace">
                <div class="workspace-area">
                  <div class="workspace-header">
                    <h4>协作工作区</h4>
                    <el-button size="small" @click="clearWorkspace">
                      清空
                    </el-button>
                  </div>
                  <div
                    class="workspace-content"
                    contenteditable="true"
                    ref="workspaceContent"
                    @input="onWorkspaceChange"
                    placeholder="在这里与AI协作..."
                  ></div>
                </div>
                <div class="ai-suggestions">
                  <h5>AI建议</h5>
                  <div class="suggestions-list">
                    <div
                      v-for="suggestion in aiSuggestions"
                      :key="suggestion.id"
                      class="suggestion-item"
                      @click="applySuggestion(suggestion)"
                    >
                      <div class="suggestion-text">{{ suggestion.text }}</div>
                      <div class="suggestion-type">{{ suggestion.type }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 苏格拉底式交互 -->
            <div v-else-if="currentMode?.id === 'socratic'" class="socratic-interface">
              <div class="socratic-dialogue">
                <div class="dialogue-phase">
                  <h4>{{ currentPhase.title }}</h4>
                  <p>{{ currentPhase.description }}</p>
                </div>
                <div class="dialogue-questions">
                  <div
                    v-for="question in currentPhase.questions"
                    :key="question.id"
                    class="question-item"
                  >
                    <div class="question-text">{{ question.text }}</div>
                    <div class="question-options">
                      <el-radio-group v-model="question.userAnswer" @change="onQuestionAnswer(question)">
                        <el-radio
                          v-for="option in question.options"
                          :key="option.value"
                          :label="option.value"
                        >
                          {{ option.text }}
                        </el-radio>
                      </el-radio-group>
                    </div>
                  </div>
                </div>
                <div class="dialogue-actions">
                  <el-button
                    type="primary"
                    @click="nextPhase"
                    :disabled="!isPhaseComplete"
                  >
                    下一阶段
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：历史和分析 -->
        <div v-if="showHistory" class="history-panel">
          <div class="panel-header">
            <h4>交互历史</h4>
            <el-button size="small" @click="exportHistory">
              导出
            </el-button>
          </div>
          <div class="history-content">
            <div
              v-for="interaction in interactionHistory"
              :key="interaction.id"
              class="history-item"
            >
              <div class="history-time">
                {{ formatHistoryTime(interaction.timestamp) }}
              </div>
              <div class="history-type">
                <el-tag size="small" :type="getInteractionTypeColor(interaction.type)">
                  {{ getInteractionTypeName(interaction.type) }}
                </el-tag>
              </div>
              <div class="history-content-text">
                {{ interaction.input.content }}
              </div>
              <div class="history-output">
                {{ interaction.output.content.substring(0, 100) }}...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 实验完成 -->
    <div v-else-if="status === 'completed'" class="experiment-completed">
      <el-result
        icon="success"
        title="AI实验已完成"
        sub-title="实验环境已自动停止"
      >
        <template #extra>
          <el-button type="primary" @click="viewResults">查看结果</el-button>
          <el-button @click="resetExperiment">重新开始</el-button>
        </template>
      </el-result>
    </div>

    <!-- 实验错误 -->
    <div v-else-if="status === 'error'" class="experiment-error">
      <el-result
        icon="error"
        title="AI实验启动失败"
        :sub-title="errorMessage"
      >
        <template #extra>
          <el-button type="primary" @click="retryInitialization">重试</el-button>
          <el-button @click="$emit('error', errorMessage || '未知错误')">
            返回
          </el-button>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Loading,
  CircleCheck,
  Close,
  RefreshRight,
  View,
  Clock,
  Check,
  ChatDotRound,
  User
} from '@element-plus/icons-vue'

import { contextAwareAIService } from '@/services/ai/context-aware-ai'
import type {
  AIContext,
  AIConversation,
  AIMessage,
  AIInteraction,
  EnhancedAIExperimentConfig,
  InteractionMode,
  AIInput,
  AIOutput
} from '@/types/ai'
import type { ActivityContext, ActivityResult } from '@/types/course'

// Props
interface Props {
  config: EnhancedAIExperimentConfig
  context: ActivityContext
}

interface Emits {
  'complete': [result: ActivityResult]
  'error': [error: Error | string]
  'progress': [progress: number]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const status = ref<'initializing' | 'running' | 'error' | 'completed'>('initializing')
const errorMessage = ref<string | null>(null)
const initProgress = ref(0)
const initStatusText = ref('正在初始化AI实验环境...')
const currentStep = ref(0)
const session = ref<any>(null)

// UI状态
const showContext = ref(true)
const showHistory = ref(false)
const isProcessing = ref(false)

// AI相关
const aiContext = ref<AIContext | null>(null)
const currentConversation = ref<AIConversation | null>(null)
const conversationMessages = ref<AIMessage[]>([])
const interactionHistory = ref<AIInteraction[]>([])
const currentMode = ref<InteractionMode | null>(null)
const availableModes = ref<InteractionMode[]>([])

// 交互数据
const userInput = ref('')
const tutorialSteps = ref<any[]>([])
const currentTutorialStep = ref(0)
const aiSuggestions = ref<any[]>([])
const currentPhase = ref<any>(null)

// UI引用
const messagesContainer = ref<HTMLElement>()
const workspaceContent = ref<HTMLElement>()

// 计算属性
const isValidConfig = computed(() => {
  return props.config &&
         props.config.modelProvider &&
         props.config.modelName &&
         props.config.interactionConfig &&
         props.config.interactionConfig.interactionModes.length > 0
})

const initSteps = computed(() => [
  '验证AI配置',
  '初始化上下文',
  '加载AI模型',
  '准备交互模式',
  '建立连接'
])

// 生命周期
onMounted(async () => {
  await initializeExperiment()
})

onUnmounted(() => {
  cleanup()
})

watch(() => props.config, async () => {
  if (isValidConfig.value) {
    await initializeExperiment()
  }
}, { deep: true })

// 方法
const initializeExperiment = async () => {
  if (!isValidConfig.value) {
    status.value = 'error'
    errorMessage.value = 'AI实验配置不完整'
    return
  }

  status.value = 'initializing'
  initProgress.value = 0
  currentStep.value = 0
  errorMessage.value = null

  try {
    // 步骤1: 验证AI配置
    await updateStep(0, '验证AI配置...')
    await validateAIConfig()
    await delay(500)

    // 步骤2: 初始化上下文
    await updateStep(1, '初始化AI上下文...')
    aiContext.value = await contextAwareAIService.initializeContext(props.context)
    await delay(800)

    // 步骤3: 加载AI模型
    await updateStep(2, '加载AI模型...')
    await loadAIModel()
    await delay(1000)

    // 步骤4: 准备交互模式
    await updateStep(3, '准备交互模式...')
    await prepareInteractionModes()
    await delay(600)

    // 步骤5: 建立连接
    await updateStep(4, '建立AI连接...')
    await establishConnection()
    await delay(400)

    // 初始化完成
    status.value = 'running'
    initProgress.value = 100
    initStatusText.value = 'AI实验环境就绪'

    ElMessage.success('AI实验环境已就绪')

    // 选择默认交互模式
    if (availableModes.value.length > 0) {
      await switchMode(availableModes.value[0])
    }

  } catch (error) {
    console.error('Failed to initialize AI experiment:', error)
    status.value = 'error'
    errorMessage.value = error instanceof Error ? error.message : '初始化失败'
    ElMessage.error(`AI实验初始化失败: ${errorMessage.value}`)
  }
}

const validateAIConfig = async () => {
  // 验证AI配置
  if (!props.config.modelProvider || !props.config.modelName) {
    throw new Error('AI模型配置不完整')
  }

  if (!props.config.interactionConfig || !props.config.interactionConfig.interactionModes) {
    throw new Error('交互模式配置不完整')
  }
}

const loadAIModel = async () => {
  // 模拟AI模型加载
  // 在实际实现中，这里会连接到真实的AI服务
  console.log(`Loading AI model: ${props.config.modelProvider}/${props.config.modelName}`)
}

const prepareInteractionModes = async () => {
  // 准备交互模式
  availableModes.value = props.config.interactionConfig.interactionModes.map(mode => ({
    ...mode,
    icon: getModeIcon(mode.id)
  }))

  // 初始化特定模式的内容
  await initializeModeContent()
}

const establishConnection = async () => {
  if (!aiContext.value) return

  try {
    // 创建AI对话
    currentConversation.value = await contextAwareAIService.getOrCreateConversation(
      getContextId(aiContext.value),
      'collaborative'
    )

    if (currentConversation.value) {
      conversationMessages.value = currentConversation.value.messages
    }

    // 创建会话记录
    session.value = {
      id: `ai_exp_${Date.now()}`,
      activityId: props.context.activityId,
      modelProvider: props.config.modelProvider,
      modelName: props.config.modelName,
      startTime: new Date(),
      status: 'running'
    }

  } catch (error) {
    throw new Error(`建立AI连接失败: ${error}`)
  }
}

const initializeModeContent = async () => {
  // 初始化指导式内容
  tutorialSteps.value = [
    {
      title: '理解问题',
      content: '首先，我们需要理解当前要解决的问题。请仔细阅读题目要求。'
    },
    {
      title: '分析需求',
      content: '分析问题的关键点和解题要求，确定需要哪些知识点。'
    },
    {
      title: '制定方案',
      content: '根据问题分析，制定合适的解决方案或实现步骤。'
    },
    {
      title: '实施验证',
      content: '按照方案实施，并验证结果的正确性。'
    }
  ]

  // 初始化苏格拉底式对话阶段
  currentPhase.value = {
    id: 'understanding',
    title: '理解阶段',
    description: '让我们通过问答来更好地理解问题',
    questions: [
      {
        id: 'q1',
        text: '你认为这个问题的关键是什么？',
        options: [
          { value: 'algorithm', text: '算法选择' },
          { value: 'data_structure', text: '数据结构' },
          { value: 'logic', text: '逻辑设计' },
          { value: 'optimization', text: '性能优化' }
        ],
        userAnswer: ''
      }
    ]
  }
}

const switchMode = async (mode: InteractionMode) => {
  if (!aiContext.value) return

  currentMode.value = mode

  // 重置模式相关状态
  userInput.value = ''
  currentTutorialStep.value = 0
  aiSuggestions.value = []

  // 发送模式切换消息
  const modeMessage: AIMessage = {
    id: generateMessageId(),
    type: 'assistant',
    content: `已切换到${mode.name}模式。${mode.description}`,
    timestamp: new Date(),
    metadata: {
      model: 'system',
      tokens: 0
    }
  }

  conversationMessages.value.push(modeMessage)

  await nextTick()
  scrollToBottom()
}

const sendMessage = async () => {
  if (!userInput.value.trim() || isProcessing.value || !aiContext.value) return

  const messageContent = userInput.value.trim()
  userInput.value = ''

  await processMessage(messageContent)
}

const sendQuickMessage = async (message: string) => {
  await processMessage(message)
}

const processMessage = async (content: string) => {
  if (!aiContext.value) return

  isProcessing.value = true

  try {
    // 添加用户消息
    const userMessage: AIMessage = {
      id: generateMessageId(),
      type: 'user',
      content,
      timestamp: new Date(),
      metadata: {
        tokens: content.length
      }
    }

    conversationMessages.value.push(userMessage)

    // 构建AI输入
    const aiInput: AIInput = {
      type: 'text',
      content,
      intent: inferIntent(content),
      confidence: 0.8
    }

    // 处理AI交互
    const output = await contextAwareAIService.processInteraction(
      aiInput,
      getContextId(aiContext.value)
    )

    // 添加AI响应
    const assistantMessage: AIMessage = {
      id: generateMessageId(),
      type: 'assistant',
      content: output.content,
      timestamp: new Date(),
      metadata: {
        tokens: output.metadata.tokens,
        processingTime: output.metadata.processingTime,
        confidence: output.metadata.confidence,
        model: output.metadata.model
      }
    }

    conversationMessages.value.push(assistantMessage)

    // 记录交互历史
    const interaction: AIInteraction = {
      id: generateInteractionId(),
      type: inferInteractionType(content),
      timestamp: new Date(),
      context: aiContext.value,
      input: aiInput,
      output,
      metadata: {
        processingTime: output.metadata.processingTime,
        confidence: output.metadata.confidence,
        model: output.metadata.model,
        tokens: output.metadata.tokens,
        success: true
      }
    }

    interactionHistory.value.push(interaction)

    await nextTick()
    scrollToBottom()

  } catch (error) {
    console.error('Failed to process message:', error)
    ElMessage.error('消息处理失败，请重试')
  } finally {
    isProcessing.value = false
  }
}

const nextStep = () => {
  if (currentTutorialStep.value < tutorialSteps.value.length - 1) {
    currentTutorialStep.value++
  } else {
    // 完成指导
    ElMessage.success('指导完成！')
  }
}

const previousStep = () => {
  if (currentTutorialStep.value > 0) {
    currentTutorialStep.value--
  }
}

const onWorkspaceChange = () => {
  if (!workspaceContent.value) return

  const content = workspaceContent.value.innerText
  // TODO: 分析内容并生成AI建议
  generateAISuggestions(content)
}

const generateAISuggestions = (content: string) => {
  // 模拟AI建议生成
  aiSuggestions.value = [
    {
      id: 'suggestion_1',
      text: '建议使用更清晰的变量名',
      type: '代码优化'
    },
    {
      id: 'suggestion_2',
      text: '考虑添加注释来解释逻辑',
      type: '可读性'
    }
  ]
}

const applySuggestion = (suggestion: any) => {
  if (workspaceContent.value) {
    const currentContent = workspaceContent.value.innerText
    workspaceContent.value.innerText = currentContent + '\n// ' + suggestion.text
  }

  // 移除已应用的建议
  const index = aiSuggestions.value.findIndex(s => s.id === suggestion.id)
  if (index > -1) {
    aiSuggestions.value.splice(index, 1)
  }
}

const clearWorkspace = () => {
  if (workspaceContent.value) {
    workspaceContent.value.innerText = ''
  }
  aiSuggestions.value = []
}

const onQuestionAnswer = (question: any) => {
  // 处理问题回答
  console.log('Question answered:', question.id, question.userAnswer)
}

const nextPhase = () => {
  // 进入下一个苏格拉底式对话阶段
  // TODO: 实现阶段切换逻辑
}

const stopExperiment = async () => {
  try {
    if (session.value) {
      session.value.status = 'completed'
      session.value.endTime = new Date()
    }

    status.value = 'completed'
    ElMessage.info('AI实验已停止')
  } catch (error) {
    console.error('Failed to stop experiment:', error)
    ElMessage.error('停止实验失败')
  }
}

const resetExperiment = async () => {
  try {
    await ElMessageBox.confirm('确定要重置AI实验吗？当前进度将会丢失。', '重置确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    // 重置状态
    conversationMessages.value = []
    interactionHistory.value = []
    userInput.value = ''
    currentTutorialStep.value = 0
    aiSuggestions.value = []

    // 重新初始化
    await initializeExperiment()
  } catch {
    // 用户取消
  }
}

const retryInitialization = () => {
  initializeExperiment()
}

const viewResults = () => {
  const result: ActivityResult = {
    success: true,
    score: 100,
    maxScore: 100,
    feedback: 'AI实验已完成',
    artifacts: [
      {
        id: 'ai_conversation',
        name: 'AI对话记录',
        type: 'data',
        content: conversationMessages.value,
        createdAt: new Date()
      },
      {
        id: 'ai_interactions',
        name: 'AI交互历史',
        type: 'data',
        content: interactionHistory.value,
        createdAt: new Date()
      }
    ],
    analytics: {
      timeSpent: session.value?.startTime ?
        Math.floor((Date.now() - session.value.startTime.getTime()) / 1000) : 0,
      interactions: interactionHistory.value.length,
      messages: conversationMessages.value.length,
      averageResponseTime: calculateAverageResponseTime(),
      engagementLevel: calculateEngagementLevel()
    }
  }

  emit('complete', result)
}

const exportHistory = () => {
  // 导出交互历史
  const data = {
    conversation: conversationMessages.value,
    interactions: interactionHistory.value,
    context: aiContext.value,
    session: session.value
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ai_experiment_${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)

  ElMessage.success('交互历史已导出')
}

// 辅助方法
const updateStep = async (stepIndex: number, statusText: string) => {
  currentStep.value = stepIndex
  initStatusText.value = statusText
  initProgress.value = Math.round(((stepIndex + 1) / initSteps.value.length) * 100)
}

const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const getContextId = (context: AIContext): string => {
  return `${context.userId}_${context.sessionId}`
}

const generateMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

const generateInteractionId = (): string => {
  return `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

const inferIntent = (content: string): string => {
  if (content.includes('提示') || content.includes('help')) return 'hint_request'
  if (content.includes('为什么') || content.includes('解释')) return 'explanation'
  if (content.includes('如何') || content.includes('怎么')) return 'guidance'
  return 'question'
}

const inferInteractionType = (content: string): any => {
  const intent = inferIntent(content)
  const typeMap: Record<string, any> = {
    'hint_request': 'hint_request',
    'explanation': 'explanation',
    'guidance': 'guidance',
    'question': 'question'
  }
  return typeMap[intent] || 'question'
}

const getModeIcon = (modeId: string): any => {
  const iconMap: Record<string, any> = {
    'conversation': ChatDotRound,
    'tutorial': Clock,
    'collaborative': User,
    'socratic': View
  }
  return iconMap[modeId] || ChatDotRound
}

const getDifficultyType = (difficulty: string): string => {
  switch (difficulty) {
    case 'easy': return 'success'
    case 'medium': return 'warning'
    case 'hard': return 'danger'
    default: return 'info'
  }
}

const getEngagementPercentage = (level: string): number => {
  switch (level) {
    case 'low': return 33
    case 'medium': return 66
    case 'high': return 100
    default: return 50
  }
}

const getInteractionTypeColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    'question': 'primary',
    'hint_request': 'warning',
    'explanation': 'info',
    'guidance': 'success'
  }
  return colorMap[type] || 'info'
}

const getInteractionTypeName = (type: string): string => {
  const nameMap: Record<string, string> = {
    'question': '提问',
    'hint_request': '求助',
    'explanation': '解释',
    'guidance': '指导'
  }
  return nameMap[type] || type
}

const formatRuntime = (startTime?: Date): string => {
  if (!startTime) return '00:00:00'

  const duration = Math.floor((Date.now() - startTime.getTime()) / 1000)
  const hours = Math.floor(duration / 3600)
  const minutes = Math.floor((duration % 3600) / 60)
  const seconds = duration % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

const formatMessageTime = (timestamp: Date): string => {
  return timestamp.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatHistoryTime = (timestamp: Date): string => {
  return timestamp.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const calculateAverageResponseTime = (): number => {
  if (interactionHistory.value.length === 0) return 0

  const totalTime = interactionHistory.value.reduce((sum, interaction) => {
    return sum + interaction.metadata.processingTime
  }, 0)

  return Math.round(totalTime / interactionHistory.value.length)
}

const calculateEngagementLevel = (): string => {
  if (!aiContext.value) return 'medium'

  const { behaviorContext } = aiContext.value
  if (behaviorContext.helpRequests > 5) return 'high'
  if (behaviorContext.helpRequests > 2) return 'medium'
  return 'low'
}

const isPhaseComplete = computed(() => {
  if (!currentPhase.value) return false
  return currentPhase.value.questions.every((q: any) => q.userAnswer)
})

const cleanup = () => {
  if (aiContext.value) {
    contextAwareAIService.cleanupContext(getContextId(aiContext.value))
  }
}
</script>

<style scoped lang="scss">
.ai-experiment-runner {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 500px;
}

.config-error,
.experiment-completed,
.experiment-error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
}

.ai-initializing {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
}

.init-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
  max-width: 400px;

  .loading-icon {
    font-size: 48px;
    color: var(--edu-primary-500);
    animation: spin 1s linear infinite;
  }

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: var(--edu-text-primary);
    margin: 0;
  }

  p {
    font-size: 14px;
    color: var(--edu-text-secondary);
    margin: 0;
  }
}

.init-steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.init-step {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;

  &.completed {
    color: var(--edu-success-600);
    background: rgba(16, 185, 129, 0.1);
  }

  &.active {
    color: var(--edu-primary-600);
    background: rgba(59, 130, 246, 0.1);
  }

  &.pending {
    color: var(--edu-text-disabled);
    background: var(--edu-background-light);
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.ai-running {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.experiment-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px 12px 0 0;
  border: 1px solid var(--edu-border-color);
  border-bottom: none;
  backdrop-filter: blur(8px);
}

.control-left,
.control-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.model-info,
.runtime-info {
  font-size: 13px;
  color: var(--edu-text-secondary);
  font-family: 'Monaco', 'Menlo', monospace;
}

.experiment-content {
  flex: 1;
  display: flex;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 0 0 12px 12px;
  border: 1px solid var(--edu-border-color);
  border-top: none;
  overflow: hidden;
}

.interaction-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--edu-border-color);
}

.context-panel {
  border-bottom: 1px solid var(--edu-border-color);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(15, 23, 42, 0.04);
  border-bottom: 1px solid var(--edu-border-color);

  h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--edu-text-primary);
  }
}

.context-content {
  padding: 12px 16px;
  max-height: 200px;
  overflow-y: auto;
}

.context-section {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }

  h5 {
    margin: 0 0 8px 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--edu-text-primary);
  }
}

.context-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;

  .label {
    font-size: 12px;
    color: var(--edu-text-secondary);
    min-width: 60px;
  }

  .mini-progress {
    flex: 1;
    max-width: 60px;
  }
}

.interaction-modes {
  border-bottom: 1px solid var(--edu-border-color);
}

.mode-list {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mode-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(59, 130, 246, 0.05);
  }

  &.active {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.3);
  }

  .mode-info {
    .mode-name {
      font-weight: 600;
      font-size: 14px;
      color: var(--edu-text-primary);
    }

    .mode-description {
      font-size: 12px;
      color: var(--edu-text-secondary);
      margin-top: 2px;
    }
  }
}

.interaction-interface {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.conversation-interface,
.tutorial-interface,
.collaborative-interface,
.socratic-interface {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;

  &.user {
    flex-direction: row-reverse;

    .message-content {
      background: #007bff;
      color: white;
    }
  }

  &.assistant {
    .message-content {
      background: #f8f9fa;
      color: #333;
    }
  }

  .message-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #e9ecef;
    color: #6c757d;
    font-size: 14px;
    flex-shrink: 0;
  }

  .message-content {
    max-width: 70%;
    padding: 12px 16px;
    border-radius: 16px;
    word-wrap: break-word;

    .message-text {
      font-size: 14px;
      line-height: 1.4;
      margin-bottom: 4px;
    }

    .message-time {
      font-size: 11px;
      opacity: 0.7;
    }
  }
}

.input-area {
  padding: 16px;
  border-top: 1px solid var(--edu-border-color);

  .input-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;
  }
}

.tutorial-steps {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.tutorial-step {
  margin-bottom: 20px;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid;

  &.completed {
    background: rgba(16, 185, 129, 0.1);
    border-left-color: var(--edu-success-500);
  }

  &.active {
    background: rgba(59, 130, 246, 0.1);
    border-left-color: var(--edu-primary-500);
  }

  &.pending {
    background: var(--edu-background-light);
    border-left-color: var(--edu-border-color);
  }

  .step-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;

    .step-title {
      font-weight: 600;
      font-size: 15px;
    }
  }

  .step-content {
    color: var(--edu-text-secondary);
    margin-bottom: 12px;
    line-height: 1.4;
  }

  .step-actions {
    display: flex;
    gap: 8px;
  }
}

.collaboration-workspace {
  flex: 1;
  display: flex;
  gap: 16px;
  padding: 16px;
}

.workspace-area {
  flex: 2;
  display: flex;
  flex-direction: column;

  .workspace-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    h4 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
    }
  }

  .workspace-content {
    flex: 1;
    padding: 12px;
    border: 1px solid var(--edu-border-color);
    border-radius: 8px;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 13px;
    line-height: 1.4;
    overflow-y: auto;
    white-space: pre-wrap;
    word-wrap: break-word;

    &:empty:before {
      content: attr(placeholder);
      color: var(--edu-text-disabled);
    }
  }
}

.ai-suggestions {
  flex: 1;
  display: flex;
  flex-direction: column;

  h5 {
    margin: 0 0 12px 0;
    font-size: 13px;
    font-weight: 600;
  }
}

.suggestions-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.suggestion-item {
  padding: 8px 12px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(59, 130, 246, 0.15);
  }

  .suggestion-text {
    font-size: 12px;
    margin-bottom: 4px;
  }

  .suggestion-type {
    font-size: 11px;
    color: var(--edu-primary-600);
  }
}

.socratic-dialogue {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.dialogue-phase {
  margin-bottom: 20px;

  h4 {
    margin: 0 0 8px 0;
    font-size: 16px;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: var(--edu-text-secondary);
    line-height: 1.4;
  }
}

.dialogue-questions {
  flex: 1;
  margin-bottom: 20px;
}

.question-item {
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(59, 130, 246, 0.05);
  border-radius: 8px;

  .question-text {
    font-weight: 600;
    margin-bottom: 12px;
  }

  .question-options {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

.dialogue-actions {
  text-align: center;
}

.history-panel {
  width: 300px;
  display: flex;
  flex-direction: column;
}

.history-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.history-item {
  margin-bottom: 16px;
  padding: 12px;
  background: var(--edu-background-light);
  border-radius: 8px;

  .history-time {
    font-size: 11px;
    color: var(--edu-text-disabled);
    margin-bottom: 4px;
  }

  .history-type {
    margin-bottom: 8px;
  }

  .history-content-text {
    font-weight: 600;
    margin-bottom: 4px;
    font-size: 13px;
  }

  .history-output {
    font-size: 12px;
    color: var(--edu-text-secondary);
    line-height: 1.3;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .experiment-content {
    flex-direction: column;
  }

  .interaction-panel {
    border-right: none;
    border-bottom: 1px solid var(--edu-border-color);
  }

  .history-panel {
    width: 100%;
    max-height: 200px;
  }

  .collaboration-workspace {
    flex-direction: column;
  }

  .workspace-area,
  .ai-suggestions {
    flex: 1;
  }
}
</style>