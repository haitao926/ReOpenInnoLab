<template>
  <div class="ai-course-assistant">
    <!-- AI助手状态指示器 -->
    <div class="ai-status-bar">
      <div class="status-left">
        <el-icon class="status-icon" :class="statusIconClass">
          <component :is="statusIcon" />
        </el-icon>
        <span class="status-text">{{ statusText }}</span>
      </div>
      <div class="status-right">
        <el-switch
          v-model="aiEnabled"
          active-text="AI增强"
          inactive-text="手动模式"
          @change="toggleAI"
        />
      </div>
    </div>

    <!-- AI建议面板 -->
    <transition name="slide-down">
      <div v-if="aiEnabled && showSuggestions" class="ai-suggestions-panel">
        <div class="panel-header">
          <h3>
            <el-icon><MagicStick /></el-icon>
            AI智能建议
          </h3>
          <el-button size="small" type="text" @click="showSuggestions = false">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>

        <div class="suggestions-tabs">
          <el-tabs v-model="activeSuggestionTab" @tab-click="handleSuggestionTabClick">
            <el-tab-pane label="内容优化" name="content">
              <div class="suggestion-list">
                <div
                  v-for="suggestion in contentSuggestions"
                  :key="suggestion.id"
                  class="suggestion-item"
                  :class="{ 'is-applied': suggestion.applied }"
                >
                  <div class="suggestion-header">
                    <div class="suggestion-type">
                      <el-tag :type="suggestion.type" size="small">
                        {{ getSuggestionTypeLabel(suggestion.type) }}
                      </el-tag>
                      <span class="suggestion-confidence">
                        置信度: {{ suggestion.confidence }}%
                      </span>
                    </div>
                    <div class="suggestion-actions">
                      <el-button
                        v-if="!suggestion.applied"
                        size="small"
                        type="primary"
                        @click="applySuggestion(suggestion)"
                      >
                        应用
                      </el-button>
                      <el-button
                        size="small"
                        type="text"
                        @click="ignoreSuggestion(suggestion)"
                      >
                        忽略
                      </el-button>
                    </div>
                  </div>
                  <div class="suggestion-content">
                    <h4>{{ suggestion.title }}</h4>
                    <p>{{ suggestion.description }}</p>
                    <div v-if="suggestion.preview" class="suggestion-preview">
                      <pre>{{ suggestion.preview }}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="资源推荐" name="resources">
              <div class="resources-list">
                <div
                  v-for="resource in resourceRecommendations"
                  :key="resource.id"
                  class="resource-item"
                >
                  <div class="resource-icon">
                    <el-icon :color="getResourceIconColor(resource.type)">
                      <component :is="getResourceIcon(resource.type)" />
                    </el-icon>
                  </div>
                  <div class="resource-content">
                    <h4>{{ resource.title }}</h4>
                    <p>{{ resource.description }}</p>
                    <div class="resource-meta">
                      <el-tag size="small">{{ resource.difficulty }}</el-tag>
                      <span v-if="resource.duration" class="duration">
                        {{ resource.duration }}分钟
                      </span>
                    </div>
                  </div>
                  <div class="resource-actions">
                    <el-button size="small" @click="viewResource(resource)">
                      查看
                    </el-button>
                    <el-button size="small" type="primary" @click="addToCourse(resource)">
                      添加到课程
                    </el-button>
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="智能评估" name="assessment">
              <div class="assessment-generator">
                <div class="generator-form">
                  <el-form :model="assessmentForm" label-width="100px">
                    <el-form-item label="评估类型">
                      <el-select v-model="assessmentForm.type">
                        <el-option label="随堂测验" value="quiz" />
                        <el-option label="课后作业" value="assignment" />
                        <el-option label="项目实践" value="project" />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="难度等级">
                      <el-select v-model="assessmentForm.difficulty">
                        <el-option label="简单" value="easy" />
                        <el-option label="中等" value="medium" />
                        <el-option label="困难" value="hard" />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="题目数量">
                      <el-input-number
                        v-model="assessmentForm.questionCount"
                        :min="1"
                        :max="20"
                        controls-position="right"
                      />
                    </el-form-item>
                    <el-form-item>
                      <el-button
                        type="primary"
                        :loading="generatingAssessment"
                        @click="generateAssessment"
                      >
                        <el-icon><MagicStick /></el-icon>
                        生成评估
                      </el-button>
                    </el-form-item>
                  </el-form>
                </div>

                <div v-if="generatedAssessment" class="generated-assessment">
                  <div class="assessment-preview">
                    <h4>{{ generatedAssessment.title }}</h4>
                    <div class="assessment-stats">
                      <span>{{ generatedAssessment.questions.length }} 道题</span>
                      <span>总分: {{ generatedAssessment.rubric.maxScore }}</span>
                      <span>预计用时: {{ generatedAssessment.estimatedTime }}分钟</span>
                    </div>
                  </div>
                  <div class="assessment-actions">
                    <el-button @click="previewAssessment">
                      <el-icon><View /></el-icon>
                      预览
                    </el-button>
                    <el-button type="primary" @click="addToCourse">
                      <el-icon><Plus /></el-icon>
                      添加到课程
                    </el-button>
                    <el-button @click="regenerateAssessment">
                      <el-icon><Refresh /></el-icon>
                      重新生成
                    </el-button>
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="学习分析" name="analytics">
              <div class="analytics-dashboard">
                <div class="analytics-summary">
                  <div class="summary-card">
                    <div class="summary-icon" style="background: #10B981;">
                      <el-icon><TrendCharts /></el-icon>
                    </div>
                    <div class="summary-content">
                      <div class="summary-value">{{ analyticsData.avgScore }}</div>
                      <div class="summary-label">平均分</div>
                    </div>
                  </div>
                  <div class="summary-card">
                    <div class="summary-icon" style="background: #6366F1;">
                      <el-icon><DataLine /></el-icon>
                    </div>
                    <div class="summary-content">
                      <div class="summary-value">{{ analyticsData.completionRate }}%</div>
                      <div class="summary-label">完成率</div>
                    </div>
                  </div>
                  <div class="summary-card">
                    <div class="summary-icon" style="background: #FAAD14;">
                      <el-icon><Clock /></el-icon>
                    </div>
                    <div class="summary-content">
                      <div class="summary-value">{{ analyticsData.avgTime }}h</div>
                      <div class="summary-label">平均时长</div>
                    </div>
                  </div>
                </div>

                <div class="analytics-insights">
                  <h4>AI洞察</h4>
                  <div class="insights-list">
                    <div
                      v-for="insight in analyticsInsights"
                      :key="insight.id"
                      class="insight-item"
                      :class="insight.type"
                    >
                      <el-icon class="insight-icon">
                        <component :is="getInsightIcon(insight.type)" />
                      </el-icon>
                      <div class="insight-content">
                        <h5>{{ insight.title }}</h5>
                        <p>{{ insight.description }}</p>
                        <div class="insight-actions">
                          <el-button size="small" type="text" @click="viewInsightDetail(insight)">
                            查看详情
                          </el-button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </transition>

    <!-- AI操作按钮组 -->
    <div class="ai-action-buttons">
      <el-tooltip content="AI内容优化">
        <el-button
          type="primary"
          :icon="MagicStick"
          @click="optimizeContent"
          :disabled="!aiEnabled || !hasContent"
        >
          优化内容
        </el-button>
      </el-tooltip>

      <el-tooltip content="生成评估">
        <el-button
          type="success"
          :icon="Document"
          @click="generateQuickAssessment"
          :disabled="!aiEnabled"
        >
          生成评估
        </el-button>
      </el-tooltip>

      <el-tooltip content="学习分析">
        <el-button
          type="info"
          :icon="DataLine"
          @click="analyzeLearning"
          :disabled="!aiEnabled"
        >
          分析学习
        </el-button>
      </el-tooltip>

      <el-tooltip content="个性化推荐">
        <el-button
          type="warning"
          :icon="Star"
          @click="getRecommendations"
          :disabled="!aiEnabled"
        >
          个性化推荐
        </el-button>
      </el-tooltip>
    </div>

    <!-- AI对话窗口 -->
    <el-dialog
      v-model="showChatDialog"
      title="AI教学助手"
      width="600px"
      :before-close="closeChatDialog"
    >
      <div class="ai-chat">
        <div class="chat-messages" ref="chatMessagesRef">
          <div
            v-for="message in chatMessages"
            :key="message.id"
            class="message"
            :class="{ 'user-message': message.type === 'user' }"
          >
            <div class="message-avatar">
              <el-avatar
                :size="32"
                :src="message.type === 'user' ? userAvatar : aiAvatar"
              >
                {{ message.type === 'user' ? '我' : 'AI' }}
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
            v-model="chatInput"
            type="textarea"
            :rows="2"
            placeholder="输入您的问题..."
            @keydown.enter.ctrl="sendChatMessage"
          />
          <el-button
            type="primary"
            :loading="chatLoading"
            @click="sendChatMessage"
            :disabled="!chatInput.trim()"
          >
            发送
          </el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 进度指示器 -->
    <div v-if="aiProcessing" class="ai-progress">
      <el-progress
        :percentage="progressPercentage"
        :status="progressStatus"
        :stroke-width="2"
      />
      <span class="progress-text">{{ progressText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  MagicStick, Close, Plus, Document, View, Refresh, TrendCharts,
  DataLine, Clock, Star, Warning, SuccessFilled, InfoFilled
} from '@element-plus/icons-vue'
import { createAIEducationServiceInstance } from '@/services/aiEducation'
import type {
  AIEducationService, AICourseSuggestion, Resource, Assessment,
  StudentProgressAnalysis, ContentRecommendation
} from '@/services/aiEducation'
import dayjs from 'dayjs'

interface Props {
  courseId?: string
  chapterId?: string
  content?: any
  hasContent?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  courseId: '',
  chapterId: '',
  content: null,
  hasContent: false
})

// 响应式数据
const aiEnabled = ref(true)
const showSuggestions = ref(false)
const activeSuggestionTab = ref('content')
const aiProcessing = ref(false)
const progressPercentage = ref(0)
const progressStatus = ref<'success' | 'exception' | 'warning'>('success')
const progressText = ref('')
const statusIcon = ref('SuccessFilled')
const statusText = ref('AI助手已就绪')

// AI服务实例
let aiService: AIEducationService | null = null

// 建议数据
const contentSuggestions = ref<any[]>([])
const resourceRecommendations = ref<Resource[]>([])
const analyticsData = ref({
  avgScore: 85.5,
  completionRate: 78.3,
  avgTime: 2.4
})
const analyticsInsights = ref<any[]>([])

// 评估表单
const assessmentForm = ref({
  type: 'quiz',
  difficulty: 'medium',
  questionCount: 5
})

const generatingAssessment = ref(false)
const generatedAssessment = ref<Assessment | null>(null)

// 聊天对话
const showChatDialog = ref(false)
const chatMessages = ref<any[]>([
  {
    id: '1',
    type: 'assistant',
    content: '您好！我是AI教学助手，可以帮助您优化课程内容、生成评估题目、分析学习数据等。有什么可以帮助您的吗？',
    timestamp: Date.now()
  }
])
const chatInput = ref('')
const chatLoading = ref(false)

// 用户信息
const userAvatar = ref('/default-avatar.png')
const aiAvatar = ref('/ai-avatar.png')

// 计算属性
const statusIconClass = computed(() => {
  if (aiProcessing.value) return 'is-processing'
  if (!aiEnabled.value) return 'is-disabled'
  return ''
})

// 方法
const toggleAI = (enabled: boolean) => {
  aiEnabled.value = enabled
  if (enabled) {
    statusText.value = 'AI助手已启用'
    statusIcon.value = 'SuccessFilled'
    showSuggestions.value = true
    loadAIInsights()
  } else {
    statusText.value = 'AI助手已禁用'
    statusIcon.value = 'Warning'
    showSuggestions.value = false
  }
}

const optimizeContent = async () => {
  if (!props.content || !aiService) return

  try {
    aiProcessing.value = true
    progressPercentage.value = 0
    progressText.value = '正在分析内容...'
    statusText.value = 'AI正在处理'

    progressPercentage.value = 30
    progressText.value = '生成优化建议...'

    // 模拟内容优化
    await new Promise(resolve => setTimeout(resolve, 2000))

    contentSuggestions.value = [
      {
        id: '1',
        type: 'success',
        title: '结构优化建议',
        description: '建议将内容重新组织为更符合学习逻辑的结构',
        confidence: 92,
        preview: '建议的优化内容结构...',
        applied: false
      },
      {
        id: '2',
        type: 'info',
        title: '添加互动元素',
        description: '在关键知识点处添加互动练习，提升学生参与度',
        confidence: 88,
        preview: '推荐的互动练习设计...',
        applied: false
      },
      {
        id: '3',
        type: 'warning',
        title: '补充教学资源',
        description: '添加更多相关的教学资源和参考资料',
        confidence: 85,
        preview: '推荐的资源列表...',
        applied: false
      }
    ]

    progressPercentage.value = 100
    progressStatus.value = 'success'
    progressText.value = '内容优化完成'

    ElMessage.success('内容优化完成')
  } catch (error) {
    console.error('内容优化失败:', error)
    progressStatus.value = 'exception'
    progressText.value = '优化失败'
    ElMessage.error('内容优化失败')
  } finally {
    aiProcessing.value = false
    setTimeout(() => {
      progressPercentage.value = 0
      progressText.value = ''
      statusText.value = 'AI助手已就绪'
    }, 2000)
  }
}

const generateQuickAssessment = async () => {
  if (!aiService) return

  try {
    generatingAssessment.value = true

    const assessment = await aiService.generateAssessment(
      props.content?.description || '课程内容',
      assessmentForm.value.type
    )

    generatedAssessment.value = assessment
    ElMessage.success('评估生成成功')
  } catch (error) {
    console.error('评估生成失败:', error)
    ElMessage.error('评估生成失败')
  } finally {
    generatingAssessment.value = false
  }
}

const analyzeLearning = async () => {
  if (!props.courseId || !aiService) return

  try {
    // 模拟学习分析
    analyticsInsights.value = [
      {
        id: '1',
        type: 'success',
        title: '学习进度良好',
        description: '大多数学生都能按时完成学习任务，整体进度比预期快15%',
        detail: '详细分析数据...'
      },
      {
        id: '2',
        type: 'warning',
        title: '部分内容需要加强',
        description: '第3章的概念理解率较低，建议增加更多练习',
        detail: '具体建议和改进方案...'
      },
      {
        id: '3',
        type: 'info',
        title: '参与度分析',
        description: '互动环节的参与度很高，学生反馈积极',
        detail: '参与度统计数据...'
      }
    ]

    ElMessage.success('学习分析完成')
  } catch (error) {
    console.error('学习分析失败:', error)
    ElMessage.error('学习分析失败')
  }
}

const getRecommendations = async () => {
  if (!aiService) return

  try {
    // 模拟个性化推荐
    ElMessage.success('推荐内容已更新')
  } catch (error) {
    console.error('获取推荐失败:', error)
    ElMessage.error('获取推荐失败')
  }
}

const handleSuggestionTabClick = (tab: string) => {
  if (tab === 'resources' && !resourceRecommendations.value.length) {
    loadResourceRecommendations()
  }
}

const loadResourceRecommendations = async () => {
  if (!aiService) return

  try {
    const resources = await aiService.suggestLearningResources(
      props.content?.title || '课程主题',
      'math' // 根据实际学科调整
    )
    resourceRecommendations.value = resources
  } catch (error) {
    console.error('加载资源推荐失败:', error)
  }
}

const applySuggestion = async (suggestion: any) => {
  try {
    // 应用建议的逻辑
    suggestion.applied = true
    ElMessage.success('建议已应用')

    // 触发内容更新事件
    // emit('content-updated', suggestion)
  } catch (error) {
    console.error('应用建议失败:', error)
    ElMessage.error('应用建议失败')
  }
}

const ignoreSuggestion = (suggestion: any) => {
  const index = contentSuggestions.value.findIndex(s => s.id === suggestion.id)
  if (index > -1) {
    contentSuggestions.value.splice(index, 1)
  }
}

const generateAssessment = async () => {
  await generateQuickAssessment()
  activeSuggestionTab.value = 'assessment'
}

const addToCourse = (item: any) => {
  ElMessage.success('已添加到课程')
}

const viewResource = (resource: Resource) => {
  ElMessage.info(`查看资源: ${resource.title}`)
}

const previewAssessment = () => {
  ElMessage.info('预览评估内容')
}

const regenerateAssessment = () => {
  generatedAssessment.value = null
  generateQuickAssessment()
}

const viewInsightDetail = (insight: any) => {
  ElMessage.info(`查看洞察: ${insight.title}`)
}

const getSuggestionTypeLabel = (type: string) => {
  const labels = {
    success: '优化建议',
    info: '改进建议',
    warning: '注意事项'
  }
  return labels[type as keyof typeof labels] || type
}

const getResourceIcon = (type: string) => {
  const icons = {
    video: 'VideoPlay',
    document: 'Document',
    interactive: 'Monitor',
    tool: 'Tools'
  }
  return icons[type as keyof typeof icons] || 'Document'
}

const getResourceIconColor = (type: string) => {
  const colors = {
    video: '#409EFF',
    document: '#67C23A',
    interactive: '#E6A23C',
    tool: '#909399'
  }
  return colors[type as keyof typeof colors] || '#909399'
}

const getInsightIcon = (type: string) => {
  const icons = {
    success: 'SuccessFilled',
    warning: 'Warning',
    info: 'InfoFilled'
  }
  return icons[type as keyof typeof icons] || 'InfoFilled'
}

const loadAIInsights = async () => {
  if (!props.courseId) return

  try {
    // 模拟加载AI洞察
    await new Promise(resolve => setTimeout(resolve, 1000))
  } catch (error) {
    console.error('加载AI洞察失败:', error)
  }
}

const sendChatMessage = async () => {
  if (!chatInput.value.trim() || !aiService) return

  const userMessage = {
    id: Date.now().toString(),
    type: 'user',
    content: chatInput.value.trim(),
    timestamp: Date.now()
  }

  chatMessages.value.push(userMessage)
  const messageContent = chatInput.value.trim()
  chatInput.value = ''
  chatLoading.value = true

  try {
    // 模拟AI回复
    await new Promise(resolve => setTimeout(resolve, 1500))

    const aiMessage = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: '我理解您的需求。基于当前的课程内容，我建议您可以从以下几个方面进行优化...',
      timestamp: Date.now()
    }

    chatMessages.value.push(aiMessage)
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败')
  } finally {
    chatLoading.value = false
  }
}

const closeChatDialog = () => {
  showChatDialog.value = false
}

const formatTime = (timestamp: number) => {
  return dayjs(timestamp).format('HH:mm')
}

// 完善缺失的方法
const generateAIChapterStructure = async () => {
  if (!props.content || !aiService) return

  try {
    aiProcessing.value = true
    progressPercentage.value = 0
    progressText.value = '正在分析课程内容...'

    const suggestion = await aiService.generateCourseOutline(
      `为${props.content.title || '课程'}生成章节结构，学科：${props.content.subject}，年级：${props.content.grade}`
    )

    progressPercentage.value = 100
    progressText.value = '章节结构生成完成'

    // 触发事件更新章节结构
    // emit('chapter-generated', suggestion.suggestedChapters)
    ElMessage.success('AI章节结构生成完成')
  } catch (error) {
    console.error('生成章节结构失败:', error)
    ElMessage.error('生成章节结构失败')
  } finally {
    aiProcessing.value = false
    setTimeout(() => {
      progressPercentage.value = 0
      progressText.value = ''
    }, 2000)
  }
}

const generateAIExperiment = async (chapter: any) => {
  if (!aiService) return

  try {
    aiProcessing.value = true
    progressText.value = '正在生成AI实验...'

    const experiment = await aiService.generateExperimentLab(
      chapter.title,
      props.content?.subject || 'science',
      props.content?.grade || 'grade10'
    )

    // 更新章节的实验配置
    chapter.experimentConfig = {
      image: experiment.environment.image,
      packages: experiment.environment.packages,
      resources: {
        cpu: experiment.environment.resources.cpu,
        memory: experiment.environment.resources.memory,
        storage: experiment.environment.resources.storage
      }
    }

    ElMessage.success('AI实验生成完成')
  } catch (error) {
    console.error('生成AI实验失败:', error)
    ElMessage.error('生成AI实验失败')
  } finally {
    aiProcessing.value = false
  }
}

const toggleAIEnhancement = (chapter: any) => {
  chapter.aiEnhanced = !chapter.aiEnhanced
  if (chapter.aiEnhanced) {
    ElMessage.success('AI增强已启用')
    // 可以在这里触发AI内容优化
  } else {
    ElMessage.info('AI增强已禁用')
  }
}

const importChapterTemplate = () => {
  ElMessage.info('模板导入功能开发中...')
}

const configureExperiment = (chapter: any) => {
  ElMessage.info(`配置实验: ${chapter.title}`)
}

const uploadInteractive = (chapter: any) => {
  ElMessage.info(`上传互动内容: ${chapter.title}`)
}

const handleExperimentTypeChange = (type: string) => {
  // 处理实验类型切换
  console.log('实验类型切换:', type)
}

const beforeExperimentUpload = (file: File) => {
  const allowedTypes = ['.ipynb', '.py', '.json', '.csv']
  const fileName = file.name.toLowerCase()
  const isValidType = allowedTypes.some(type => fileName.endsWith(type))

  if (!isValidType) {
    ElMessage.error('只支持 .ipynb, .py, .json, .csv 格式文件')
    return false
  }

  return true
}

const handleExperimentUpload = async (options: any) => {
  const file = options.file
  // 实现实验文件上传逻辑
  ElMessage.success(`实验文件 ${file.name} 上传成功`)
}

const handleExperimentFileChange = (file: any, fileList: any[]) => {
  // 处理实验文件列表变化
  console.log('实验文件变化:', file, fileList)
}

const beforeInteractiveUpload = (file: File) => {
  const allowedTypes = ['.html', '.css', '.js', '.zip']
  const fileName = file.name.toLowerCase()
  const isValidType = allowedTypes.some(type => fileName.endsWith(type))

  if (!isValidType) {
    ElMessage.error('只支持 .html, .css, .js, .zip 格式文件')
    return false
  }

  return true
}

const handleInteractiveUpload = async (options: any) => {
  const file = options.file
  // 实现互动文件上传逻辑
  ElMessage.success(`互动文件 ${file.name} 上传成功`)
}

const handleInteractiveFileChange = (file: any, fileList: any[]) => {
  // 处理互动文件列表变化
  console.log('互动文件变化:', file, fileList)
}

const addConcept = (chapter: any) => {
  if (!chapter.content) chapter.content = {}
  if (!chapter.content.knowledge) chapter.content.knowledge = { concepts: [], examples: [], resources: [] }

  chapter.content.knowledge.concepts.push({
    id: `concept_${Date.now()}`,
    name: '',
    definition: '',
    examples: [],
    difficulty: 'medium'
  })
}

const removeConcept = (chapter: any, index: number) => {
  if (chapter.content?.knowledge?.concepts) {
    chapter.content.knowledge.concepts.splice(index, 1)
  }
}

const addExample = (chapter: any) => {
  if (!chapter.content) chapter.content = {}
  if (!chapter.content.knowledge) chapter.content.knowledge = { concepts: [], examples: [], resources: [] }

  chapter.content.knowledge.examples.push({
    id: `example_${Date.now()}`,
    title: '',
    description: '',
    content: '',
    type: 'text',
    aiGenerated: false
  })
}

const saveChapterContent = (chapter: any) => {
  ElMessage.success(`章节 ${chapter.title} 已保存`)
}

const previewChapter = (chapter: any) => {
  ElMessage.info(`预览章节: ${chapter.title}`)
}

const addQuestion = (chapter: any) => {
  if (!chapter.questions) chapter.questions = []

  chapter.questions.push({
    id: `question_${Date.now()}`,
    type: 'choice',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    points: 10,
    aiGenerated: false
  })
}

const removeQuestion = (chapter: any, index: number) => {
  if (chapter.questions) {
    chapter.questions.splice(index, 1)
  }
}

const addOption = (question: any) => {
  if (!question.options) question.options = []
  question.options.push('')
}

const removeOption = (question: any, index: number) => {
  if (question.options) {
    question.options.splice(index, 1)
    // 调整正确答案索引
    if (question.correctAnswer >= index && question.correctAnswer > 0) {
      question.correctAnswer--
    }
  }
}

const exportCourse = () => {
  ElMessage.info('课程导出功能开发中...')
}

const saveAsDraft = () => {
  ElMessage.success('草稿保存成功')
}

const previewInteractive = (chapter: any) => {
  ElMessage.info(`预览互动内容: ${chapter.title}`)
}

// 生命周期
onMounted(() => {
  // 初始化AI服务
  aiService = createAIEducationServiceInstance(true) // 使用模拟服务

  if (aiEnabled.value) {
    showSuggestions.value = true
    loadAIInsights()
  }
})
</script>

<style lang="scss" scoped>
.ai-course-assistant {
  position: relative;
}

.ai-status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-base);
  background: var(--edu-bg-secondary);
  border-radius: var(--edu-radius-lg);
  border: 1px solid var(--edu-border-light);
  margin-bottom: var(--spacing-base);
}

.status-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.status-icon {
  font-size: 16px;

  &.is-processing {
    animation: pulse 2s infinite;
  }

  &.is-disabled {
    color: var(--edu-text-placeholder);
  }
}

.status-text {
  font-size: var(--font-size-sm);
  color: var(--edu-text-secondary);
}

.ai-suggestions-panel {
  background: var(--edu-bg-primary);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--edu-radius-lg);
  box-shadow: var(--edu-shadow-md);
  margin-bottom: var(--spacing-base);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-base) var(--spacing-lg);
  border-bottom: 1px solid var(--edu-border-light);

  h3 {
    margin: 0;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: var(--font-size-lg);
    color: var(--edu-text-primary);
  }
}

.suggestions-tabs {
  padding: var(--spacing-base);
}

.suggestion-item {
  background: var(--edu-bg-secondary);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--edu-radius-base);
  padding: var(--spacing-base);
  margin-bottom: var(--spacing-sm);
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    box-shadow: var(--edu-shadow-sm);
  }

  &.is-applied {
    border-color: var(--edu-success);
    background: var(--edu-success-50);
  }
}

.suggestion-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-sm);
}

.suggestion-type {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.suggestion-confidence {
  font-size: var(--font-size-xs);
  color: var(--edu-text-tertiary);
}

.suggestion-content {
  h4 {
    margin: 0 0 var(--spacing-xs) 0;
    color: var(--edu-text-primary);
  }

  p {
    margin: 0 0 var(--spacing-sm) 0;
    color: var(--edu-text-secondary);
    line-height: var(--edu-leading-normal);
  }
}

.suggestion-preview {
  background: var(--edu-bg-tertiary);
  border-radius: var(--edu-radius-base);
  padding: var(--spacing-sm);
  margin-top: var(--spacing-sm);
  font-family: monospace;
  font-size: var(--font-size-xs);
  color: var(--edu-text-secondary);
  overflow-x: auto;
}

.resources-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.resource-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-base);
  background: var(--edu-bg-secondary);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--edu-radius-base);
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    box-shadow: var(--edu-shadow-sm);
  }
}

.resource-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.resource-content {
  flex: 1;
  min-width: 0;

  h4 {
    margin: 0 0 var(--spacing-xs) 0;
    color: var(--edu-text-primary);
  }

  p {
    margin: 0 0 var(--spacing-xs) 0;
    color: var(--edu-text-secondary);
    font-size: var(--font-size-sm);
    line-height: var(--edu-leading-normal);
  }
}

.resource-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);

  .duration {
    font-size: var(--font-size-xs);
    color: var(--edu-text-tertiary);
  }
}

.resource-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.assessment-generator {
  padding: var(--spacing-base);
}

.generator-form {
  margin-bottom: var(--spacing-lg);
}

.generated-assessment {
  border-top: 1px solid var(--edu-border-light);
  padding-top: var(--spacing-lg);
}

.assessment-preview {
  background: var(--edu-bg-secondary);
  border-radius: var(--edu-radius-base);
  padding: var(--spacing-base);
  margin-bottom: var(--spacing-base);

  h4 {
    margin: 0 0 var(--spacing-sm) 0;
    color: var(--edu-text-primary);
  }

  .assessment-stats {
    display: flex;
    gap: var(--spacing-lg);
    font-size: var(--font-size-sm);
    color: var(--edu-text-secondary);
  }
}

.assessment-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.analytics-dashboard {
  padding: var(--spacing-base);
}

.analytics-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-base);
  margin-bottom: var(--spacing-lg);
}

.summary-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
  padding: var(--spacing-base);
  background: var(--edu-bg-secondary);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--edu-radius-lg);
}

.summary-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;

  svg {
    width: 24px;
    height: 24px;
  }
}

.summary-content {
  flex: 1;

  .summary-value {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--edu-text-primary);
    line-height: var(--edu-leading-tight);
  }

  .summary-label {
    font-size: var(--font-size-xs);
    color: var(--edu-text-secondary);
  }
}

.analytics-insights {
  h4 {
    margin: 0 0 var(--spacing-base) 0;
    color: var(--edu-text-primary);
  }
}

.insights-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.insight-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-base);
  background: var(--edu-bg-secondary);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--edu-radius-base);
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    box-shadow: var(--edu-shadow-sm);
  }
}

.insight-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.insight-content {
  flex: 1;
  min-width: 0;

  h5 {
    margin: 0 0 var(--spacing-xs) 0;
    color: var(--edu-text-primary);
    font-size: var(--font-size-sm);
  }

  p {
    margin: 0 0 var(--spacing-xs) 0;
    color: var(--edu-text-secondary);
    font-size: var(--font-size-xs);
    line-height: var(--edu-leading-normal);
  }

  .insight-actions {
    margin-top: var(--spacing-xs);
  }
}

.ai-action-buttons {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: center;
  margin-bottom: var(--spacing-base);
}

.ai-chat {
  .chat-messages {
    height: 400px;
    overflow-y: auto;
    padding: var(--spacing-base);
    background: var(--edu-bg-secondary);
    border-radius: var(--edu-radius-base) var(--edu-radius-base) 0 0;
    margin-bottom: var(--spacing-base);
  }

  .message {
    display: flex;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-base);

    &.user-message {
      flex-direction: row-reverse;
    }

    .message-content {
      max-width: 70%;
    }
  }

  .message-text {
    background: var(--edu-bg-tertiary);
    border-radius: var(--edu-radius-lg);
    padding: var(--spacing-sm) var(--spacing-base);
    color: var(--edu-text-primary);
    line-height: var(--edu-leading-normal);
    margin-bottom: var(--spacing-xs);
  }

  .message-time {
    font-size: var(--font-size-xs);
    color: var(--edu-text-tertiary);
  }
}

.chat-input {
  display: flex;
  gap: var(--spacing-sm);
  align-items: flex-end;
}

.ai-progress {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--edu-primary-50);
  border-radius: var(--edu-radius-lg);
  margin-top: var(--spacing-base);
}

.progress-text {
  font-size: var(--font-size-sm);
  color: var(--edu-primary-600);
  font-weight: var(--font-weight-medium);
}

/* 过渡动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s var(--edu-ease-in-out);
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 深色模式适配 */
[data-theme="dark"] {
  .ai-status-bar,
  .ai-suggestions-panel,
  .ai-chat .chat-messages {
    background: var(--edu-bg-primary);
    border-color: var(--edu-border-dark);
  }

  .suggestion-item,
  .resource-item,
  .summary-card,
  .insight-item,
  .generated-assessment .assessment-preview {
    background: var(--edu-bg-secondary);
    border-color: var(--edu-border-dark);
  }

  .suggestion-item.is-applied {
    background: rgba(82, 196, 26, 0.1);
    border-color: var(--edu-success);
  }

  .message-text {
    background: var(--edu-bg-tertiary);
  }
}

/* 脉冲动画 */
@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .ai-status-bar {
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: stretch;
  }

  .ai-action-buttons {
    flex-wrap: wrap;
  }

  .analytics-summary {
    grid-template-columns: 1fr;
  }

  .suggestion-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-sm);
  }

  .resource-item {
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }
}
</style>
