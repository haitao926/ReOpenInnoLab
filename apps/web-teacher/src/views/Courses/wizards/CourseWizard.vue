<template>
  <div class="course-wizard">
    <div class="wizard-header">
      <h2 class="wizard-title">
        <el-icon><Document /></el-icon>
        {{ isEditing ? '编辑课程' : '创建新课程' }}
      </h2>
      <div class="wizard-progress">
        <el-steps :active="currentStep" align-center>
          <el-step
            v-for="(step, index) in steps"
            :key="index"
            :title="step.title"
            :description="step.description"
          />
        </el-steps>
      </div>
    </div>

    <div class="wizard-layout">
      <div class="wizard-content">
        <!-- Step 1: Basic Info -->
        <div v-if="currentStep === 0" class="wizard-step">
          <div class="step-header">
            <div class="header-content">
              <div class="header-text">
                <h3>课程基本信息</h3>
                <p>设置课程的基本属性和目标受众</p>
              </div>
              <div class="ai-actions">
                <el-button
                  type="primary"
                  :icon="MagicStick"
                  @click="generateCourseDesign"
                  :loading="aiGenerating"
                  class="ai-design-button"
                >
                  <el-icon><MagicStick /></el-icon>
                  AI 智能设计
                </el-button>
              </div>
            </div>
          </div>

          <el-form :model="courseStore.editor?.basicInfo" :rules="basicInfoRules" ref="basicInfoRef" label-width="120px">
            <el-form-item label="课程名称" prop="title">
              <el-input v-model="courseStore.editor!.basicInfo.title" placeholder="请输入课程名称" />
            </el-form-item>

            <el-form-item label="课程代码" prop="code">
              <el-input v-model="courseStore.editor!.basicInfo.code" placeholder="请输入课程代码" />
            </el-form-item>

            <el-form-item label="课程描述" prop="description">
              <el-input type="textarea" v-model="courseStore.editor!.basicInfo.description" :rows="4" placeholder="请输入课程描述" />
            </el-form-item>

            <el-form-item label="学科分类" prop="subject">
              <el-select v-model="courseStore.editor!.basicInfo.subject" placeholder="请选择学科">
                <el-option
                  v-for="subject in subjects"
                  :key="subject"
                  :label="subject"
                  :value="subject"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="适用年级" prop="gradeBand">
              <el-select v-model="courseStore.editor!.basicInfo.gradeBand" placeholder="请选择年级">
                <el-option
                  v-for="grade in gradeBandOptions"
                  :key="grade.value"
                  :label="grade.label"
                  :value="grade.value"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="课程缩略图">
              <el-upload
                class="thumbnail-uploader"
                action="#"
                :show-file-list="false"
                :before-upload="beforeThumbnailUpload"
              >
                <img v-if="courseStore.editor?.basicInfo.thumbnail" :src="courseStore.editor.basicInfo.thumbnail" class="thumbnail" />
                <el-icon v-else class="thumbnail-uploader-icon"><Plus /></el-icon>
              </el-upload>
            </el-form-item>
          </el-form>
        </div>

        <!-- Step 2: Five Modules Structure -->
        <div v-if="currentStep === 1" class="wizard-step">
          <div class="step-header">
            <div class="header-text">
              <h3>五环节课程结构</h3>
              <p>配置课程的五个核心环节：引入、新知、体验、实验、作业</p>
            </div>
          </div>

          <div class="modules-container">
            <div
              v-for="(module, key) in courseStore.editor?.fiveModules"
              :key="key"
              class="module-card"
            >
              <div class="module-header">
                <div class="module-info">
                  <el-tag :type="getModuleTagType(module.type)">{{ getModuleTitle(module.type) }}</el-tag>
                  <span class="module-title">{{ module.title }}</span>
                </div>
                <div class="module-duration">
                  <el-input-number
                    v-model="module.duration"
                    :min="1"
                    :max="120"
                    size="small"
                    controls-position="right"
                  />
                  <span class="duration-label">分钟</span>
                </div>
              </div>

              <div class="module-content">
                <el-form-item label="学习目标">
                  <el-input
                    type="textarea"
                    v-model="module.objectivesText"
                    :rows="2"
                    placeholder="请输入学习目标，每行一个"
                  />
                </el-form-item>

                <el-form-item label="AI提示词">
                  <el-input
                    type="textarea"
                    v-model="module.aiHintsText"
                    :rows="2"
                    placeholder="请输入AI教学提示，每行一个"
                  />
                </el-form-item>

                <el-form-item label="课堂活动">
                  <el-input
                    type="textarea"
                    v-model="module.classroomActionsText"
                    :rows="2"
                    placeholder="请输入课堂活动建议，每行一个"
                  />
                </el-form-item>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: Resources -->
        <div v-if="currentStep === 2" class="wizard-step">
          <div class="step-header">
            <div class="header-text">
              <h3>教学资源配置</h3>
              <p>为各环节添加教学资源（视频、图片、文档等）</p>
            </div>
          </div>

          <div class="resources-container">
            <el-tabs v-model="activeResourceTab" type="card">
              <el-tab-pane
                v-for="(module, key) in courseStore.editor?.fiveModules"
                :key="key"
                :label="getModuleTitle(module.type)"
                :name="key"
              >
                <div class="resource-panel">
                  <div class="resource-actions">
                    <el-button type="primary" size="small" @click="openResourceSelector(key)">
                      <el-icon><Plus /></el-icon>
                      添加资源
                    </el-button>
                  </div>

                  <div class="resource-list">
                    <div
                      v-for="resource in module.resources"
                      :key="resource.id"
                      class="resource-item"
                    >
                      <el-icon class="resource-icon" :color="getResourceTypeColor(resource.type)">
                        <component :is="getResourceIcon(resource.type)" />
                      </el-icon>
                      <div class="resource-info">
                        <div class="resource-title">{{ resource.title }}</div>
                        <div class="resource-type">{{ resource.type }}</div>
                      </div>
                      <el-button type="danger" size="small" text @click="removeResource(key, resource.id)">
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>

                    <div v-if="module.resources.length === 0" class="empty-resources">
                      <el-empty description="暂无资源" />
                    </div>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>

        <!-- Step 4: AI Configuration -->
        <div v-if="currentStep === 3" class="wizard-step">
          <div class="step-header">
            <div class="header-text">
              <h3>AI辅助教学配置</h3>
              <p>配置AI教学助手和个性化学习策略</p>
            </div>
          </div>

          <el-form :model="aiConfig" label-width="140px">
            <el-form-item label="AI生成策略">
              <el-radio-group v-model="aiConfig.generationStrategy">
                <el-radio label="conservative">保守模式 - 优先准确性</el-radio>
                <el-radio label="balanced">平衡模式 - 兼顾创新与准确</el-radio>
                <el-radio label="creative">创新模式 - 鼓励创新内容</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="评估方式">
              <el-checkbox-group v-model="aiConfig.assessmentTypes">
                <el-checkbox label="formative">形成性评估</el-checkbox>
                <el-checkbox label="summative">总结性评估</el-checkbox>
                <el-checkbox label="diagnostic">诊断性评估</el-checkbox>
              </el-checkbox-group>
            </el-form-item>

            <el-form-item label="干预阈值">
              <el-slider
                v-model="aiConfig.interventionThreshold"
                :min="0"
                :max="100"
                :step="10"
                show-stops
                show-input
              />
            </el-form-item>

            <el-form-item label="学习路径优化">
              <el-switch v-model="aiConfig.pathOptimization" />
            </el-form-item>

            <el-form-item label="难度自适应">
              <el-switch v-model="aiConfig.adaptiveDifficulty" />
            </el-form-item>
          </el-form>
        </div>

        <!-- Step 5: Preview -->
        <div v-if="currentStep === 4" class="wizard-step">
          <div class="step-header">
            <div class="header-text">
              <h3>课程预览</h3>
              <p>预览完整的课程结构和配置</p>
            </div>
            <div class="preview-actions">
              <el-button @click="validateCourse">
                <el-icon><CircleCheck /></el-icon>
                验证课程
              </el-button>
            </div>
          </div>

          <div class="course-preview">
            <div class="preview-section">
              <h4>基本信息</h4>
              <el-descriptions :column="2" border>
                <el-descriptions-item label="课程名称">{{ courseStore.editor?.basicInfo.title }}</el-descriptions-item>
                <el-descriptions-item label="课程代码">{{ courseStore.editor?.basicInfo.code }}</el-descriptions-item>
                <el-descriptions-item label="学科">{{ courseStore.editor?.basicInfo.subject }}</el-descriptions-item>
                <el-descriptions-item label="年级">
                  {{ getGradeLabel(courseStore.editor?.basicInfo.gradeBand) || '未设置' }}
                </el-descriptions-item>
                <el-descriptions-item label="总时长" :span="2">{{ totalDuration }}分钟</el-descriptions-item>
              </el-descriptions>
            </div>

            <div class="preview-section">
              <h4>五环节结构</h4>
              <el-timeline>
                <el-timeline-item
                  v-for="(module, key) in courseStore.editor?.fiveModules"
                  :key="key"
                  :type="getTimelineType(module.type)"
                  :size="getTimelineSize(module.type)"
                >
                  <div class="timeline-content">
                    <div class="timeline-header">
                      <span class="timeline-title">{{ module.title }}</span>
                      <el-tag size="small">{{ module.duration }}分钟</el-tag>
                    </div>
                    <div class="timeline-description">
                      {{ module.objectives.length }}个学习目标，{{ module.resources.length }}个资源
                    </div>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </div>
          </div>
        </div>
      </div>

      <div class="wizard-sidebar">
        <div class="quick-actions">
          <h4>快速操作</h4>
          <el-button @click="saveAsDraft" :loading="courseStore.loading">
            <el-icon><Document /></el-icon>
            保存草稿
          </el-button>
          <el-button @click="previewAclContent" type="info">
            <el-icon><View /></el-icon>
            预览ACL
          </el-button>
        </div>

        <div class="course-summary" v-if="courseStore.editor">
          <h4>课程摘要</h4>
          <div class="summary-item">
            <span class="label">总时长:</span>
            <span class="value">{{ totalDuration }}分钟</span>
          </div>
          <div class="summary-item">
            <span class="label">环节:</span>
            <span class="value">5个</span>
          </div>
          <div class="summary-item">
            <span class="label">资源:</span>
            <span class="value">{{ totalResources }}个</span>
          </div>
        </div>
      </div>
    </div>

    <div class="wizard-footer">
      <div class="footer-left">
        <el-button
          @click="prevStep"
          :disabled="currentStep === 0"
          size="large"
          class="prev-button"
        >
          <el-icon><ArrowLeft /></el-icon>
          上一步
        </el-button>
      </div>

      <div class="footer-center">
        <div class="step-indicator">
          <span class="current-step">{{ currentStep + 1 }}</span>
          <span class="total-steps">/ {{ steps.length }}</span>
        </div>
      </div>

      <div class="footer-right">
        <el-button
          v-if="currentStep < steps.length - 1"
          type="primary"
          @click="nextStep"
          size="large"
          class="next-button"
          :loading="loading"
        >
          下一步
          <el-icon><ArrowRight /></el-icon>
        </el-button>

        <div v-else class="final-actions">
          <el-button @click="saveAsDraft" :loading="loading" size="large">
            <el-icon><Document /></el-icon>
            保存草稿
          </el-button>
          <el-button
            type="primary"
            @click="createCourse"
            :loading="loading"
            size="large"
            class="create-button"
          >
            <el-icon><Check /></el-icon>
            {{ isEditing ? '更新课程' : '创建课程' }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- Resource Selector Dialog -->
    <ResourceSelector
      v-model="resourceSelectorVisible"
      :module-key="selectedModuleKey"
      @confirm="handleResourceSelection"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElLoading } from 'element-plus'
import {
  Document, MagicStick, Plus, Delete, View, CircleCheck,
  VideoPlay, Picture, DocumentText, Headphones, Monitor,
  ArrowLeft, ArrowRight, Check
} from '@element-plus/icons-vue'
import { aiService } from '@/config/ai-config'
import { useCourseStore, type ModuleConfig, gradeBandOptions, getGradeLabel } from '@/stores/course'
import { aclValidator, type AiCourseLayout } from '@reopeninnolab/acl-sdk'
import ResourceSelector from '@/components/resources/ResourceSelector.vue'

interface Props {
  courseId?: string
}

const props = defineProps<Props>()
const router = useRouter()
const courseStore = useCourseStore()

// 步骤配置
const steps = [
  { title: '基本信息', description: '设置课程基本信息' },
  { title: '五环节结构', description: '配置课程五个核心环节' },
  { title: '资源配置', description: '添加教学资源' },
  { title: 'AI配置', description: '配置AI辅助教学' },
  { title: '预览确认', description: '预览并确认课程' }
]

// 状态
const currentStep = ref(0)
const aiGenerating = ref(false)
const loading = ref(false)
const activeResourceTab = ref('introduction')
const resourceSelectorVisible = ref(false)
const selectedModuleKey = ref('')

// 计算属性
const isEditing = computed(() => !!props.courseId)
const totalDuration = computed(() => {
  if (!courseStore.editor?.fiveModules) return 0
  return Object.values(courseStore.editor.fiveModules)
    .reduce((total, module) => total + module.duration, 0)
})

const totalResources = computed(() => {
  if (!courseStore.editor?.fiveModules) return 0
  return Object.values(courseStore.editor.fiveModules)
    .reduce((total, module) => total + module.resources.length, 0)
})

// 表单验证规则
const basicInfoRules = {
  title: [{ required: true, message: '请输入课程名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入课程代码', trigger: 'blur' }],
  description: [{ required: true, message: '请输入课程描述', trigger: 'blur' }],
  subject: [{ required: true, message: '请选择学科', trigger: 'change' }],
  gradeBand: [{ required: true, message: '请选择年级', trigger: 'change' }]
}

// AI配置
const aiConfig = ref({
  generationStrategy: 'balanced',
  assessmentTypes: ['formative'],
  interventionThreshold: 70,
  pathOptimization: true,
  adaptiveDifficulty: true
})

// 参考数据
const subjects = ['数学', '物理', '化学', '生物', '语文', '英语', '历史', '地理', '政治']

// 组件引用
const basicInfoRef = ref()

// 生命周期
onMounted(async () => {
  if (props.courseId) {
    await courseStore.fetchCourseById(props.courseId)
  } else {
    courseStore.initializeEditor()
  }
})

// 模块辅助方法
function getModuleTitle(type: string): string {
  const titles: Record<string, string> = {
    introduction: '课程引入',
    knowledge: '新知讲解',
    experience: '体验理解',
    experiment: '实验活动',
    assignment: '作业测试'
  }
  return titles[type] || type
}

function getModuleTagType(type: string): string {
  const types: Record<string, string> = {
    introduction: 'success',
    knowledge: 'primary',
    experience: 'warning',
    experiment: 'danger',
    assignment: 'info'
  }
  return types[type] || 'info'
}

function getTimelineType(type: string): string {
  const types: Record<string, string> = {
    introduction: 'success',
    knowledge: 'primary',
    experience: 'warning',
    experiment: 'danger',
    assignment: 'info'
  }
  return types[type] || 'primary'
}

function getTimelineSize(type: string): 'large' | 'normal' {
  return type === 'experiment' ? 'large' : 'normal'
}

function getResourceIcon(type: string): any {
  const icons: Record<string, any> = {
    video: VideoPlay,
    image: Picture,
    document: DocumentText,
    audio: Headphones,
    simulation: Monitor
  }
  return icons[type] || DocumentText
}

function getResourceTypeColor(type: string): string {
  const colors: Record<string, string> = {
    video: '#409EFF',
    image: '#67C23A',
    document: '#E6A23C',
    audio: '#F56C6C',
    simulation: '#909399'
  }
  return colors[type] || '#909399'
}

// 步骤控制
const nextStep = async () => {
  // 验证当前步骤
  if (currentStep.value === 0) {
    // 验证基本信息表单
    try {
      await basicInfoRef.value?.validate()
    } catch (error) {
      ElMessage.error('请完善必填信息')
      return
    }

    // 处理文本数组转换
    if (courseStore.editor) {
      Object.values(courseStore.editor.fiveModules).forEach(module => {
        module.objectives = module.objectivesText ? module.objectivesText.split('\n').filter(Boolean) : []
        module.aiHints = module.aiHintsText ? module.aiHintsText.split('\n').filter(Boolean) : []
        module.classroomActions = module.classroomActionsText ? module.classroomActionsText.split('\n').filter(Boolean) : []
      })
    }
  } else if (currentStep.value === 1) {
    // 验证五环节配置
    const editor = courseStore.editor
    if (!editor || !editor.fiveModules) {
      ElMessage.error('请配置五环节课程结构')
      return
    }

    // 检查每个模块是否有标题和时长
    const modules = Object.values(editor.fiveModules)
    for (const module of modules) {
      if (!module.title || module.title.trim() === '') {
        ElMessage.error('所有环节都需要配置标题')
        return
      }
      if (!module.duration || module.duration <= 0) {
        ElMessage.error('所有环节都需要配置有效时长')
        return
      }
    }
  } else if (currentStep.value === 2) {
    // 验证资源配置
    const editor = courseStore.editor
    if (!editor || !editor.fiveModules) return

    // 检查是否有至少一个资源（可选）
    let totalResources = 0
    Object.values(editor.fiveModules).forEach(module => {
      totalResources += module.resources?.length || 0
    })

    if (totalResources === 0) {
      ElMessage.warning('建议为各环节添加教学资源')
    }
  }

  // 进入下一步
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
  }
}

const prevStep = () => {
  currentStep.value--
}

// 资源管理
function openResourceSelector(moduleKey: string) {
  selectedModuleKey.value = moduleKey
  resourceSelectorVisible.value = true
}

function handleResourceSelection(resources: any[]) {
  if (selectedModuleKey.value && courseStore.editor) {
    const module = courseStore.editor.fiveModules[selectedModuleKey.value as keyof typeof courseStore.editor.fiveModules]
    module.resources.push(...resources)
  }
  resourceSelectorVisible.value = false
}

function removeResource(moduleKey: string, resourceId: string) {
  if (courseStore.editor) {
    const module = courseStore.editor.fiveModules[moduleKey as keyof typeof courseStore.editor.fiveModules]
    module.resources = module.resources.filter(r => r.id !== resourceId)
  }
}

// 缩略图上传
function beforeThumbnailUpload(file: File) {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('上传缩略图只能是图片格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('上传缩略图大小不能超过 2MB!')
    return false
  }

  // 创建预览URL
  const reader = new FileReader()
  reader.onload = (e) => {
    if (courseStore.editor) {
      courseStore.editor.basicInfo.thumbnail = e.target?.result as string
    }
  }
  reader.readAsDataURL(file)

  return false // 阻止自动上传
}

// AI功能
const generateCourseDesign = async () => {
  if (!courseStore.editor?.basicInfo.title ||
      !courseStore.editor?.basicInfo.subject ||
      !courseStore.editor?.basicInfo.gradeBand) {
    ElMessage.warning('请先填写课程基本信息')
    return
  }

  aiGenerating.value = true

  const loading = ElLoading.service({
    lock: true,
    text: 'AI正在生成课程设计方案，包含详细推理过程...',
    background: 'rgba(0, 0, 0, 0.7)'
  })

  try {
    // 构建详细的课程设计提示
    const gradeLabel = getGradeLabel(courseStore.editor.basicInfo.gradeBand) || courseStore.editor.basicInfo.gradeBand

    const designPrompt = `请为以下课程设计完整的教学方案：

课程标题：${courseStore.editor.basicInfo.title}
学科领域：${courseStore.editor.basicInfo.subject}
年级水平：${gradeLabel}
课程时长：${totalDuration.value}分钟
课程描述：${courseStore.editor.basicInfo.description || '无'}

请按照五环节教学结构设计课程：

1. 课程引入 (5分钟)
   - 设计引人入胜的开场活动
   - 激发学生学习兴趣

2. 新知讲解 (15分钟)
   - 核心概念和知识点
   - 逻辑清晰的结构安排

3. 体验理解 (10分钟)
   - 互动体验活动设计
   - 帮助学生深化理解

4. 实验活动 (10分钟)
   - 实践性操作或模拟实验
   - 培养动手能力

5. 作业测试 (5分钟)
   - 检验学习效果
   - 巩固所学知识

请为每个环节提供：
- 具体的学习目标 (至少3个)
- AI教学提示和建议
- 课堂活动指导
- 需要的教学资源

请以JSON格式返回设计方案，便于系统集成。`

    // 调用AI服务
    const response = await aiService.sendMessage(designPrompt, 'course-design', {
      systemPrompt: `你是一位专业的教学设计师，具有丰富的教育教学经验。
请详细分析课程设计需求，并提供完整的设计方案。
返回的JSON格式如下：
{
  "title": "课程标题",
  "description": "课程描述",
  "modules": {
    "introduction": {
      "title": "环节标题",
      "duration": 5,
      "objectives": ["目标1", "目标2", "目标3"],
      "aiHints": ["AI提示1", "AI提示2"],
      "classroomActions": ["活动1", "活动2"]
    },
    // 其他环节...
  }
}`,
      enableReasoning: true,
      temperature: 0.7,
      maxTokens: 2000
    })

    if (response.reasoning_content) {
      console.log('AI推理过程:', response.reasoning_content)
      ElMessage({
        message: 'AI推理过程已生成，查看控制台了解详细分析',
        type: 'info',
        duration: 3000
      })
    }

    // 解析并应用AI生成的内容
    if (response.content) {
      await applyAIGeneratedContent(response.content)
      ElMessage.success('AI课程设计方案已生成并应用到表单')
    }

  } catch (error) {
    console.error('AI课程设计失败:', error)
    ElMessage.error('AI课程设计失败，请检查网络连接或稍后重试')
  } finally {
    loading.close()
    aiGenerating.value = false
  }
}

// 应用AI生成的内容到表单
async function applyAIGeneratedContent(content: string) {
  try {
    // 尝试解析JSON响应
    let aiDesign: any

    try {
      aiDesign = JSON.parse(content)
    } catch (parseError) {
      console.warn('AI响应不是有效JSON，尝试提取JSON部分:', parseError)

      // 尝试从响应中提取JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        aiDesign = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('无法解析AI响应内容')
      }
    }

    if (!courseStore.editor) return

    // 更新课程基本信息
    if (aiDesign.title && !courseStore.editor.basicInfo.title.trim()) {
      courseStore.editor.basicInfo.title = aiDesign.title
    }

    if (aiDesign.description && !courseStore.editor.basicInfo.description.trim()) {
      courseStore.editor.basicInfo.description = aiDesign.description
    }

    // 应用五环节设计
    if (aiDesign.modules) {
      const moduleKeys = ['introduction', 'knowledge', 'experience', 'experiment', 'assignment']

      moduleKeys.forEach(key => {
        if (aiDesign.modules[key] && courseStore.editor!.fiveModules[key as keyof typeof courseStore.editor.fiveModules]) {
          const module = courseStore.editor!.fiveModules[key as keyof typeof courseStore.editor.fiveModules]
          const aiModule = aiDesign.modules[key]

          // 更新标题
          if (aiModule.title) {
            module.title = aiModule.title
          }

          // 更新时长
          if (aiModule.duration && aiModule.duration > 0) {
            module.duration = aiModule.duration
          }

          // 更新学习目标（转换为文本格式）
          if (aiModule.objectives && Array.isArray(aiModule.objectives)) {
            module.objectives = aiModule.objectives
            module.objectivesText = aiModule.objectives.join('\n')
          }

          // 更新AI提示
          if (aiModule.aiHints && Array.isArray(aiModule.aiHints)) {
            module.aiHints = aiModule.aiHints
            module.aiHintsText = aiModule.aiHints.join('\n')
          }

          // 更新课堂活动
          if (aiModule.classroomActions && Array.isArray(aiModule.classroomActions)) {
            module.classroomActions = aiModule.classroomActions
            module.classroomActionsText = aiModule.classroomActions.join('\n')
          }
        }
      })
    }

    console.log('AI设计内容已应用:', aiDesign)

  } catch (error) {
    console.error('应用AI生成内容失败:', error)
    ElMessage.warning('AI设计方案生成成功，但应用时出现错误，请手动调整')
  }
}

// 保存和创建
const saveAsDraft = async () => {
  try {
    loading.value = true

    if (isEditing.value && props.courseId) {
      // 编辑模式：先加载课程，然后更新编辑器，最后保存
      await courseStore.fetchCourseById(props.courseId)
      await courseStore.saveVersion() // 保存为新版本
      ElMessage.success('草稿更新成功')
    } else {
      // 创建模式：创建新课程
      const result = await courseStore.createCourse(true) // true表示包含内容
      ElMessage.success('草稿保存成功')
      // 跳转到编辑页面
      router.push(`/courses/${result.course.id}/edit`)
    }
  } catch (error) {
    console.error('保存草稿失败:', error)
    ElMessage.error('保存失败，请检查网络连接或稍后重试')
  } finally {
    loading.value = false
  }
}

const createCourse = async () => {
  try {
    loading.value = true

    // 最终验证
    if (!courseStore.editor) {
      ElMessage.error('课程编辑器未初始化')
      return
    }

    if (isEditing.value && props.courseId) {
      // 编辑模式：保存版本并发布
      await courseStore.fetchCourseById(props.courseId)
      await courseStore.saveVersion()
      await courseStore.publishCourse()
      ElMessage.success('课程更新并发布成功')
    } else {
      // 创建模式：创建并发布
      const result = await courseStore.createCourse(true) // true表示包含内容
      await courseStore.publishCourse()
      ElMessage.success('课程创建并发布成功')

      // 跳转到课程详情页
      router.push(`/courses/${result.course.id}`)
    }
  } catch (error) {
    console.error('创建课程失败:', error)
    ElMessage.error('创建失败，请检查信息是否完整或稍后重试')
  } finally {
    loading.value = false
  }
}


// 验证和预览
const validateCourse = () => {
  const aclContent = courseStore.generateAclFromEditor()
  if (!aclContent) {
    ElMessage.error('无法生成ACL内容')
    return
  }

  const validation = aclValidator.validate(aclContent)
  if (validation.isValid) {
    ElMessage.success('课程验证通过')
  } else {
    ElMessage.error(`课程验证失败：${validation.errors.slice(0, 3).map(e => e.message).join(', ')}`)
  }
}

const previewAclContent = () => {
  const aclContent = courseStore.generateAclFromEditor()
  if (aclContent) {
    console.log('ACL Content:', JSON.stringify(aclContent, null, 2))
    ElMessage.success('ACL内容已在控制台输出')
  } else {
    ElMessage.error('无法生成ACL内容')
  }
}
</script>

<style scoped>
.course-wizard {
  padding: var(--spacing-lg);
  max-width: 1400px;
  margin: 0 auto;
}

.wizard-header {
  margin-bottom: var(--spacing-xl);
}

.wizard-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-xl);
  color: var(--color-text-primary);
}

.wizard-progress {
  margin-top: var(--spacing-lg);
}

.wizard-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.wizard-content {
  background: var(--color-background);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}

.wizard-sidebar {
  background: var(--color-background);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  height: fit-content;
}

.step-header {
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-lg);
}

.header-text h3 {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
}

.header-text p {
  margin: 0;
  color: var(--color-text-regular);
  font-size: var(--font-size-sm);
}

.ai-actions {
  flex-shrink: 0;
}

.step-header h3 {
  margin: 0 0 var(--spacing-xs) 0;
  color: var(--color-text-primary);
}

.step-header p {
  margin: 0;
  color: var(--color-text-secondary);
}

.wizard-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xl) var(--spacing-2xl);
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(249, 250, 251, 0.9) 100%
  );
  border-top: 1px solid rgba(229, 231, 235, 0.6);
  border-radius: 0 0 var(--border-radius-xl) var(--border-radius-xl);
  backdrop-filter: blur(12px);
  box-shadow:
    0 -4px 6px -1px rgba(0, 0, 0, 0.1),
    0 -2px 4px -1px rgba(0, 0, 0, 0.06);
  position: sticky;
  bottom: 0;
  z-index: 100;
}

.footer-left,
.footer-right {
  flex: 1;
}

.footer-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.step-indicator {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-weight: 600;
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
}

.current-step {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 var(--spacing-sm);
  background: linear-gradient(135deg, var(--color-primary) 0%, #4f46e5 100%);
  color: white;
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-sm);
  box-shadow: 0 2px 4px rgba(79, 70, 229, 0.3);
}

.total-steps {
  color: var(--color-text-secondary);
  font-weight: 500;
}

.prev-button,
.next-button {
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.next-button {
  background: linear-gradient(135deg, var(--color-primary) 0%, #4f46e5 100%);
  border: none;
  box-shadow:
    0 4px 6px -1px rgba(79, 70, 229, 0.3),
    0 2px 4px -1px rgba(0, 0, 0, 0.1);
}

.next-button:hover:not(.is-loading) {
  transform: translateY(-2px);
  box-shadow:
    0 8px 12px -1px rgba(79, 70, 229, 0.4),
    0 4px 8px -1px rgba(0, 0, 0, 0.15);
}

.final-actions {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.create-button {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  color: white;
  font-weight: 600;
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  box-shadow:
    0 4px 6px -1px rgba(16, 185, 129, 0.3),
    0 2px 4px -1px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.create-button:hover:not(.is-loading) {
  transform: translateY(-2px);
  box-shadow:
    0 8px 12px -1px rgba(16, 185, 129, 0.4),
    0 4px 8px -1px rgba(0, 0, 0, 0.15);
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
}

.create-button:active:not(.is-loading) {
  transform: translateY(0);
}

/* AI设计按钮样式 */
.ai-design-button {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  border: none;
  color: white;
  font-weight: 600;
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  box-shadow:
    0 4px 6px -1px rgba(139, 92, 246, 0.3),
    0 2px 4px -1px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.ai-design-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.ai-design-button:hover:not(.is-loading) {
  transform: translateY(-2px);
  box-shadow:
    0 8px 12px -1px rgba(139, 92, 246, 0.4),
    0 4px 8px -1px rgba(0, 0, 0, 0.15);
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
}

.ai-design-button:hover:not(.is-loading)::before {
  left: 100%;
}

.ai-design-button:active:not(.is-loading) {
  transform: translateY(0);
}

/* AI动画效果 */
.ai-design-button .el-icon {
  animation: aiPulse 2s infinite;
}

@keyframes aiPulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.quick-actions h4 {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-text-primary);
}

/* 新增样式 */
.modules-container {
  display: grid;
  gap: var(--spacing-lg);
}

.module-card {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  transition: all 0.3s ease;
}

.module-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border-light);
}

.module-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.module-title {
  font-weight: 600;
  color: var(--color-text-primary);
}

.module-duration {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.duration-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.module-content {
  display: grid;
  gap: var(--spacing-md);
}

.resources-container {
  min-height: 400px;
}

.resource-panel {
  padding: var(--spacing-md);
}

.resource-actions {
  margin-bottom: var(--spacing-md);
}

.resource-list {
  display: grid;
  gap: var(--spacing-sm);
  min-height: 200px;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--color-background);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-sm);
  transition: all 0.3s ease;
}

.resource-item:hover {
  background: var(--color-background-light);
}

.resource-icon {
  font-size: 18px;
}

.resource-info {
  flex: 1;
}

.resource-title {
  font-weight: 500;
  color: var(--color-text-primary);
}

.resource-type {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.empty-resources {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 150px;
}

.course-preview {
  display: grid;
  gap: var(--spacing-xl);
}

.preview-section {
  background: var(--color-background);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
  border: 1px solid var(--color-border);
}

.preview-section h4 {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
}

.timeline-content {
  display: grid;
  gap: var(--spacing-xs);
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timeline-title {
  font-weight: 600;
  color: var(--color-text-primary);
}

.timeline-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.course-summary {
  margin-top: var(--spacing-xl);
  padding: var(--spacing-md);
  background: var(--color-background-light);
  border-radius: var(--border-radius-md);
}

.course-summary h4 {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-text-primary);
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xs) 0;
}

.summary-item .label {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.summary-item .value {
  font-weight: 600;
  color: var(--color-text-primary);
}

.thumbnail-uploader {
  display: inline-block;
}

.thumbnail-uploader :deep(.el-upload) {
  border: 1px dashed var(--color-border);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.thumbnail-uploader :deep(.el-upload:hover) {
  border-color: var(--color-primary);
}

.thumbnail-uploader-icon {
  font-size: 28px;
  color: var(--color-text-secondary);
  width: 120px;
  height: 120px;
  text-align: center;
  line-height: 120px;
}

.thumbnail {
  width: 120px;
  height: 120px;
  object-fit: cover;
  display: block;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .wizard-layout {
    grid-template-columns: 1fr;
  }

  .wizard-sidebar {
    order: -1;
  }
}

@media (max-width: 768px) {
  .course-wizard {
    padding: var(--spacing-md);
  }

  .wizard-layout {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }

  .wizard-content,
  .wizard-sidebar {
    padding: var(--spacing-md);
  }

  .module-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .resource-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }

  .timeline-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }

  .wizard-footer {
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }
}

/* 动画效果 */
.module-card {
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.resource-item {
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
