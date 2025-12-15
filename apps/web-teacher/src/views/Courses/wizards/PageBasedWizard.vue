<template>
  <div class="page-based-wizard">
    <!-- 顶部进度条 -->
    <div class="wizard-header">
      <div class="wizard-steps">
        <div
          v-for="(step, index) in steps"
          :key="step.key"
          class="step-item"
          :class="{
            active: currentStep === index,
            completed: currentStep > index
          }"
          @click="canNavigate(index) && (currentStep = index)"
        >
          <div class="step-indicator">
            <el-icon v-if="currentStep > index"><Check /></el-icon>
            <span v-else>{{ index + 1 }}</span>
          </div>
          <span class="step-label">{{ step.label }}</span>
          <div v-if="index < steps.length - 1" class="step-line"></div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="wizard-content">
      <transition name="fade-slide" mode="out-in">
        <!-- 步骤 1: 基本信息 -->
        <div v-if="currentStep === 0" key="step1" class="step-panel">
          <div class="panel-header">
            <h2>课程基本信息</h2>
            <p>设置课程的名称、学科和适用年级</p>
          </div>
          <el-form :model="courseStore.editor?.basicInfo" label-position="top" class="wizard-form" v-if="courseStore.editor">
            <el-form-item label="课程名称" required>
              <el-input
                v-model="courseStore.editor.basicInfo.title"
                placeholder="例如：AI 视觉识别入门"
                size="large"
              />
            </el-form-item>
            <div class="form-row">
              <el-form-item label="课程代码" required>
                <el-input
                  v-model="courseStore.editor.basicInfo.code"
                  placeholder="例如：AI-101"
                  size="large"
                />
              </el-form-item>
              <el-form-item label="学科" required>
                <el-select v-model="courseStore.editor.basicInfo.subject" placeholder="选择学科" size="large">
                  <el-option v-for="sub in subjects" :key="sub" :label="sub" :value="sub" />
                </el-select>
              </el-form-item>
              <el-form-item label="年级" required>
                <el-select v-model="courseStore.editor.basicInfo.gradeBand" placeholder="选择年级" size="large">
                  <el-option v-for="grade in gradeBandOptions" :key="grade.value" :label="grade.label" :value="grade.value" />
                </el-select>
              </el-form-item>
            </div>
            <el-form-item label="课程简介" required>
              <el-input
                v-model="courseStore.editor.basicInfo.description"
                type="textarea"
                :rows="4"
                placeholder="简要描述课程的学习目标和内容..."
              />
            </el-form-item>
          </el-form>
        </div>

        <!-- 步骤 2: 选择模板 -->
        <div v-else-if="currentStep === 1" key="step2" class="step-panel">
          <div class="panel-header">
            <h2>选择课程模板</h2>
            <p>从预设模板开始，或创建一个空白课程</p>
          </div>
          <div class="template-grid">
            <div
              v-for="tpl in templates"
              :key="tpl.id"
              class="template-card"
              :class="{ selected: selectedTemplate === tpl.id }"
              @click="selectTemplate(tpl.id)"
            >
              <div class="template-icon" :style="{ background: tpl.color }">
                <el-icon><component :is="tpl.icon" /></el-icon>
              </div>
              <h3>{{ tpl.name }}</h3>
              <p>{{ tpl.desc }}</p>
              <div class="selection-indicator" v-if="selectedTemplate === tpl.id">
                <el-icon><Check /></el-icon>
              </div>
            </div>
          </div>
        </div>

        <!-- 步骤 3: 五环节结构 -->
        <div v-else-if="currentStep === 2" key="step3" class="step-panel">
          <div class="panel-header">
            <h2>五环节课程结构</h2>
            <p>配置课程的五个核心环节：引入、新知、体验、实验、作业</p>
          </div>
          <div class="modules-container" v-if="courseStore.editor">
            <div
              v-for="(module, key) in courseStore.editor.fiveModules"
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

        <!-- 步骤 4: 资源配置 -->
        <div v-else-if="currentStep === 3" key="step4" class="step-panel">
          <div class="panel-header">
            <h2>教学资源配置</h2>
            <p>为各环节添加教学资源（视频、图片、文档等）</p>
          </div>
          <div class="resources-container" v-if="courseStore.editor">
            <el-tabs v-model="activeResourceTab" type="card" class="resource-tabs">
              <el-tab-pane
                v-for="(module, key) in courseStore.editor.fiveModules"
                :key="key"
                :label="getModuleTitle(module.type)"
                :name="key"
              >
                <div class="resource-panel">
                  <div class="resource-actions">
                    <el-button type="primary" size="small" @click="openResourceSelector(key)">
                      <el-icon><Plus /></el-icon> 添加资源
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
                      <el-empty description="暂无资源" image-size="60" />
                    </div>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>

        <!-- 步骤 5: AI配置 -->
        <div v-else-if="currentStep === 4" key="step5" class="step-panel">
          <div class="panel-header">
            <h2>AI辅助教学配置</h2>
            <p>配置AI教学助手和个性化学习策略</p>
          </div>
          <div class="ai-config-form">
            <el-form label-position="top">
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
                <el-slider v-model="aiConfig.interventionThreshold" show-input />
              </el-form-item>
              <el-form-item label="学习路径优化">
                <el-switch v-model="aiConfig.pathOptimization" />
              </el-form-item>
              <el-form-item label="难度自适应">
                <el-switch v-model="aiConfig.adaptiveDifficulty" />
              </el-form-item>
            </el-form>
          </div>
        </div>

        <!-- 步骤 6: 预览发布 -->
        <div v-else-if="currentStep === 5" key="step6" class="step-panel">
          <div class="panel-header">
            <h2>课程预览</h2>
            <p>预览完整的课程结构和配置</p>
          </div>
          <div class="course-preview" v-if="courseStore.editor">
            <div class="preview-section">
              <h4>基本信息</h4>
              <el-descriptions :column="2" border>
                <el-descriptions-item label="课程名称">{{ courseStore.editor.basicInfo.title }}</el-descriptions-item>
                <el-descriptions-item label="课程代码">{{ courseStore.editor.basicInfo.code }}</el-descriptions-item>
                <el-descriptions-item label="学科">{{ courseStore.editor.basicInfo.subject }}</el-descriptions-item>
                <el-descriptions-item label="年级">{{ getGradeLabel(courseStore.editor.basicInfo.gradeBand) }}</el-descriptions-item>
              </el-descriptions>
            </div>
            <div class="preview-section">
              <h4>五环节结构</h4>
              <el-timeline>
                <el-timeline-item
                  v-for="(module, key) in courseStore.editor.fiveModules"
                  :key="key"
                  :type="getTimelineType(module.type)"
                  :color="getTimelineColor(module.type)"
                >
                  <h4>{{ module.title }}</h4>
                  <p>{{ module.duration }}分钟 | {{ module.resources.length }}个资源</p>
                </el-timeline-item>
              </el-timeline>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- 底部操作栏 -->
    <div class="wizard-footer">
      <el-button v-if="currentStep > 0" @click="currentStep--">上一步</el-button>
      <el-button type="primary" @click="handleNext" :loading="loading">
        {{ currentStep === steps.length - 1 ? '完成创建' : '下一步' }}
      </el-button>
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
  import { ref, reactive, onMounted, computed } from 'vue'
  import { Check, VideoPlay, Grid, Edit, Plus, Delete, Picture, Document as DocumentIcon, Headset, Monitor } from '@element-plus/icons-vue'
  import { ElMessage } from 'element-plus'
  import { useCourseStore, gradeBandOptions, getGradeLabel } from '@/stores/course'
  import ResourceSelector from '@/components/resources/ResourceSelector.vue'

  const emit = defineEmits(['close', 'complete'])
  const courseStore = useCourseStore()

  const currentStep = ref(0)
  const selectedTemplate = ref('')
  const loading = ref(false)
  const activeResourceTab = ref('introduction')
  const resourceSelectorVisible = ref(false)
  const selectedModuleKey = ref('')

  const steps = [
    { key: 'basic', label: '基本信息' },
    { key: 'template', label: '选择模板' },
    { key: 'modules', label: '五环节结构' },
    { key: 'resources', label: '资源配置' },
    { key: 'ai', label: 'AI配置' },
    { key: 'preview', label: '预览发布' }
  ]

  const subjects = ['数学', '物理', '化学', '生物', '语文', '英语', '历史', '地理', '政治', '人工智能', '编程']

  const templates = [
    { id: 'blank', name: '空白课程', desc: '从零开始设计课程结构', icon: 'Edit', color: '#e2e8f0' },
    { id: 'ai-intro', name: 'AI 导论', desc: '包含基础概念和体验活动的标准结构', icon: 'Grid', color: '#dbeafe' },
    { id: 'project', name: '项目制学习', desc: '以项目为核心的PBL课程模板', icon: 'VideoPlay', color: '#fce7f3' }
  ]
  
  const aiConfig = reactive({
    generationStrategy: 'balanced',
    assessmentTypes: ['formative'],
    interventionThreshold: 70,
    pathOptimization: true,
    adaptiveDifficulty: true
  })

  onMounted(() => {
    courseStore.initializeEditor()
  })

  const canNavigate = (index: number) => {
    return index < currentStep.value
  }

  const selectTemplate = (id: string) => {
    selectedTemplate.value = id
    // Here you could trigger logic to populate the courseStore based on template
    ElMessage.success(`已选择模板: ${id}`)
  }

  const handleNext = async () => {
    if (currentStep.value < steps.length - 1) {
      // Validation logic here
      if (currentStep.value === 0) {
        if (!courseStore.editor?.basicInfo.title) {
          ElMessage.warning('请输入课程名称')
          return
        }
      }
      currentStep.value++
    } else {
      loading.value = true
      // Simulate creation
      setTimeout(() => {
        loading.value = false
        ElMessage.success('课程创建成功！')
        emit('complete')
      }, 1500)
    }
  }

  // Helper functions
  const getModuleTitle = (type: string) => {
    const titles: Record<string, string> = {
      introduction: '课程引入',
      knowledge: '新知讲解',
      experience: '体验理解',
      experiment: '实验活动',
      assignment: '作业测试'
    }
    return titles[type] || type
  }

  const getModuleTagType = (type: string) => {
    const types: Record<string, string> = {
      introduction: 'success',
      knowledge: 'primary',
      experience: 'warning',
      experiment: 'danger',
      assignment: 'info'
    }
    return types[type] || 'info'
  }
  
  const getTimelineType = (type: string) => getModuleTagType(type)
  const getTimelineColor = (type: string) => {
     const colors: Record<string, string> = {
      introduction: '#67C23A',
      knowledge: '#409EFF',
      experience: '#E6A23C',
      experiment: '#F56C6C',
      assignment: '#909399'
    }
    return colors[type]
  }

  const getResourceTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      video: '#409EFF',
      image: '#67C23A',
      document: '#E6A23C',
      audio: '#F56C6C',
      simulation: '#909399'
    }
    return colors[type] || '#909399'
  }

  const getResourceIcon = (type: string) => {
    const icons: Record<string, any> = {
      video: VideoPlay,
      image: Picture,
      document: DocumentIcon,
      audio: Headset,
      simulation: Monitor
    }
    return icons[type] || DocumentIcon
  }

  const openResourceSelector = (key: string) => {
    selectedModuleKey.value = key
    resourceSelectorVisible.value = true
  }

  const handleResourceSelection = (resources: any[]) => {
    if (courseStore.editor && selectedModuleKey.value) {
      const module = courseStore.editor.fiveModules[selectedModuleKey.value]
      if (module) {
        module.resources.push(...resources)
      }
    }
    resourceSelectorVisible.value = false
  }

  const removeResource = (moduleKey: string, resourceId: string) => {
    if (courseStore.editor) {
      const module = courseStore.editor.fiveModules[moduleKey]
      if (module) {
        module.resources = module.resources.filter(r => r.id !== resourceId)
      }
    }
  }
</script>

<style scoped lang="scss">
  .page-based-wizard {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: white;
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .wizard-header {
    padding: 24px;
    border-bottom: 1px solid var(--border-color);
    background: #f8fafc;
  }

  .wizard-steps {
    display: flex;
    justify-content: center;
    gap: 16px;
  }

  .step-item {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    opacity: 0.6;
    transition: all 0.3s;
    
    &.active {
      opacity: 1;
      font-weight: 600;
      .step-indicator {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }
    }
    
    &.completed {
      opacity: 1;
      .step-indicator {
        background: #10b981; /* Green-500 */
        color: white;
        border-color: #10b981;
      }
    }
  }

  .step-indicator {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid #cbd5e1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.3s;
  }

  .step-line {
    width: 40px;
    height: 2px;
    background: #e2e8f0;
    margin-left: 8px;
  }

  .wizard-content {
    flex: 1;
    overflow-y: auto;
    padding: 32px;
    background: #f8fafc;
  }

  .step-panel {
    max-width: 900px;
    margin: 0 auto;
    background: white;
    padding: 32px;
    border-radius: 16px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  }

  .panel-header {
    margin-bottom: 32px;
    text-align: center;
    
    h2 {
      font-size: 24px;
      margin-bottom: 8px;
      color: #1e293b;
    }
    
    p {
      color: #64748b;
    }
  }

  .wizard-form {
    max-width: 600px;
    margin: 0 auto;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }

  .template-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 24px;
  }

  .template-card {
    border: 2px solid #e2e8f0;
    border-radius: 16px;
    padding: 24px;
    cursor: pointer;
    transition: all 0.3s;
    text-align: center;
    
    &:hover {
      border-color: var(--primary-color);
      transform: translateY(-4px);
    }
    
    &.selected {
      border-color: var(--primary-color);
      background: #eff6ff;
    }
  }

  .template-icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    margin: 0 auto 16px;
  }

  .module-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
  }

  .module-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .module-info {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .module-title {
      font-weight: 600;
      font-size: 16px;
    }
  }

  .module-duration {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #64748b;
  }

  .wizard-footer {
    padding: 16px 32px;
    background: white;
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .resource-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #f8fafc;
    border-radius: 8px;
    margin-bottom: 8px;
    
    .resource-icon {
      font-size: 24px;
    }
    
    .resource-info {
      flex: 1;
      
      .resource-title {
        font-weight: 500;
      }
      
      .resource-type {
        font-size: 12px;
        color: #94a3b8;
      }
    }
  }
  
  .preview-section {
    margin-bottom: 32px;
    
    h4 {
      margin-bottom: 16px;
      font-size: 18px;
      border-left: 4px solid var(--primary-color);
      padding-left: 12px;
    }
  }
</style>
