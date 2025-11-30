<template>
  <div class="five-module-editor">
    <div class="modules-container">
      <div
        v-for="(module, key) in modules"
        :key="key"
        class="module-card"
        :class="{ 'module-card--expanded': expandedModule === key }"
      >
        <div class="module-header" @click="toggleModule(key)">
          <div class="module-info">
            <div class="module-icon" :class="`module-icon--${module.type}`">
              <component :is="getModuleIcon(module.type)" />
            </div>
            <div class="module-title-group">
              <h4>{{ module.title || getDefaultTitle(module.type) }}</h4>
              <div class="module-meta">
                <el-tag :type="getModuleTagType(module.type)" size="small">
                  {{ getModuleTypeLabel(module.type) }}
                </el-tag>
                <span class="duration-text">{{ module.duration }} 分钟</span>
              </div>
            </div>
          </div>
          <div class="module-actions">
            <el-button-group>
              <el-button
                v-if="module.type === 'experience' || module.type === 'experiment'"
                size="small"
                @click.stop="editModuleContent(module.type, key)"
              >
                <el-icon><Edit /></el-icon>
                编辑内容
              </el-button>
              <el-button size="small" @click.stop="configureModule(key)">
                <el-icon><Setting /></el-icon>
                配置
              </el-button>
            </el-button-group>
            <el-icon class="expand-icon" :class="{ 'expand-icon--expanded': expandedModule === key }">
              <ArrowDown />
            </el-icon>
          </div>
        </div>

        <!-- Expanded Content -->
        <div v-if="expandedModule === key" class="module-content">
          <!-- Basic Settings -->
          <div class="content-section">
            <h5>基本设置</h5>
            <el-form :model="module" label-width="100px" size="small">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="环节名称">
                    <el-input v-model="module.title" placeholder="请输入环节名称" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="时长(分钟)">
                    <el-input-number v-model="module.duration" :min="1" :max="180" />
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </div>

          <!-- Learning Objectives -->
          <div class="content-section">
            <h5>学习目标</h5>
            <div class="objectives-list">
              <div
                v-for="(objective, index) in module.objectives"
                :key="index"
                class="objective-item"
              >
                <el-input v-model="module.objectives[index]" placeholder="输入学习目标" />
                <el-button type="danger" size="small" text @click="removeObjective(key, index)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
              <el-button type="primary" size="small" plain @click="addObjective(key)">
                <el-icon><Plus /></el-icon>
                添加目标
              </el-button>
            </div>
          </div>

          <!-- Experience Module Specific -->
          <div v-if="module.type === 'experience'" class="content-section">
            <h5>体验内容</h5>
            <div v-if="module.experienceId" class="selected-experience">
              <div class="experience-info">
                <el-icon><Document /></el-icon>
                <div class="info-right">
                  <div class="experience-title">{{ selectedExperience?.title }}</div>
                  <div class="experience-type">{{ selectedExperience?.type }}</div>
                </div>
                <el-button size="small" @click="selectExperience">更换</el-button>
              </div>
            </div>
            <div v-else class="no-experience">
              <el-empty description="尚未选择体验模板" :image-size="100">
                <el-button type="primary" @click="selectExperience">选择体验模板</el-button>
              </el-empty>
            </div>
          </div>

          <!-- Experiment Module Specific -->
          <div v-if="module.type === 'experiment'" class="content-section">
            <h5>实验内容</h5>
            <div v-if="module.labTemplateId" class="selected-lab">
              <div class="lab-info">
                <el-icon><Monitor /></el-icon>
                <div class="info-right">
                  <div class="lab-title">{{ selectedLab?.title }}</div>
                  <div class="lab-meta">
                    <el-tag size="small">{{ selectedLab?.labType }}</el-tag>
                    <span>{{ selectedLab?.difficultyLevel }}</span>
                  </div>
                </div>
                <el-button size="small" @click="selectLabTemplate">更换</el-button>
              </div>
            </div>
            <div v-else class="no-lab">
              <el-empty description="尚未选择实验模板" :image-size="100">
                <el-button type="primary" @click="selectLabTemplate">选择实验模板</el-button>
              </el-empty>
            </div>
          </div>

          <!-- AI Hints -->
          <div class="content-section">
            <h5>AI 提示</h5>
            <div class="hints-list">
              <div
                v-for="(hint, index) in module.aiHints"
                :key="index"
                class="hint-item"
              >
                <el-input v-model="module.aiHints[index]" placeholder="输入AI提示" />
                <el-button type="danger" size="small" text @click="removeHint(key, index)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
              <el-button type="primary" size="small" plain @click="addHint(key)">
                <el-icon><Plus /></el-icon>
                添加提示
              </el-button>
            </div>
          </div>

          <!-- Resources -->
          <div class="content-section">
            <h5>教学资源</h5>
            <div class="resources-list">
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
              <el-button type="primary" size="small" plain @click="addResource(key)">
                <el-icon><Plus /></el-icon>
                添加资源
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Experience Template Selector -->
    <ExperienceTemplateSelector
      v-model="experienceSelectorVisible"
      :multiple="false"
      @select="handleExperienceSelect"
    />

    <!-- Lab Template Selector -->
    <LabTemplateSelector
      v-model="labSelectorVisible"
      :multiple="false"
      @select="handleLabSelect"
    />

    <!-- Module Configuration Dialog -->
    <el-dialog
      v-model="configDialogVisible"
      :title="`配置${getModuleTypeLabel(configuringModule?.type || '')}环节`"
      width="600px"
    >
      <div v-if="configuringModule" class="config-form">
        <el-form :model="configuringModule" label-width="120px">
          <el-form-item label="环节类型">
            <el-select v-model="configuringModule.type" @change="handleModuleTypeChange">
              <el-option label="课程引入" value="introduction" />
              <el-option label="新知讲解" value="knowledge" />
              <el-option label="互动体验" value="experience" />
              <el-option label="动手实验" value="experiment" />
              <el-option label="总结作业" value="assignment" />
            </el-select>
          </el-form-item>

          <el-form-item label="教学策略">
            <el-checkbox-group v-model="configuringModule.strategies">
              <el-checkbox label="interactive">互动式</el-checkbox>
              <el-checkbox label="collaborative">协作式</el-checkbox>
              <el-checkbox label="exploratory">探索式</el-checkbox>
              <el-checkbox label="practice">练习式</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-form-item label="评估方式">
            <el-radio-group v-model="configuringModule.assessment">
              <el-radio label="none">无需评估</el-radio>
              <el-radio label="auto">自动评估</el-radio>
              <el-radio label="manual">手动评估</el-radio>
              <el-radio label="peer">同伴互评</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="时间分配">
            <el-slider
              v-model="configuringModule.timeAllocation"
              :max="100"
              show-stops
              show-input
              :format-tooltip="val => `${val}%`"
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="configDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveModuleConfig">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Edit,
  Setting,
  ArrowDown,
  Document,
  Monitor,
  Delete,
  Plus,
  Picture,
  VideoPlay,
  DocumentText
} from '@element-plus/icons-vue'
import ExperienceTemplateSelector from '@/components/experiences/ExperienceTemplateSelector.vue'
import LabTemplateSelector from '@/components/lab/LabTemplateSelector.vue'
import { ExperienceApiService } from '@/api/experience'
import { LabApiService } from '@/api/lab'
import type { ExperienceTemplate, LabTemplate } from '@/types/experience'

const props = defineProps<{
    modelValue: Record<string, any>
  }>()

const emit = defineEmits<{
    'update:modelValue': [value: Record<string, any>]
  }>()

// 状态
const modules = ref(props.modelValue || getDefaultModules())
const expandedModule = ref<string>('')
const experienceSelectorVisible = ref(false)
const labSelectorVisible = ref(false)
const configDialogVisible = ref(false)
const configuringModule = ref<any>(null)
const currentModuleKey = ref('')
const selectedExperience = ref<ExperienceTemplate>()
const selectedLab = ref<LabTemplate>()

// 方法
function getDefaultModules() {
  return {
    introduction: {
      type: 'introduction',
      title: '课程引入',
      duration: 5,
      objectives: [],
      aiHints: [],
      strategies: ['interactive'],
      assessment: 'none',
      timeAllocation: 10,
      resources: []
    },
    knowledge: {
      type: 'knowledge',
      title: '新知讲解',
      duration: 15,
      objectives: [],
      aiHints: [],
      strategies: ['exploratory'],
      assessment: 'auto',
      timeAllocation: 30,
      resources: []
    },
    experience: {
      type: 'experience',
      title: '互动体验',
      duration: 10,
      objectives: [],
      aiHints: [],
      strategies: ['interactive', 'collaborative'],
      assessment: 'auto',
      timeAllocation: 20,
      experienceId: '',
      resources: []
    },
    experiment: {
      type: 'experiment',
      title: '动手实验',
      duration: 20,
      objectives: [],
      aiHints: [],
      strategies: ['practice', 'exploratory'],
      assessment: 'auto',
      timeAllocation: 30,
      labTemplateId: '',
      resources: []
    },
    assignment: {
      type: 'assignment',
      title: '总结作业',
      duration: 10,
      objectives: [],
      aiHints: [],
      strategies: ['practice'],
      assessment: 'manual',
      timeAllocation: 10,
      resources: []
    }
  }
}

function getModuleIcon(type: string) {
  const icons: Record<string, any> = {
    introduction: Document,
    knowledge: DocumentText,
    experience: VideoPlay,
    experiment: Monitor,
    assignment: Document
  }
  return icons[type] || Document
}

function getModuleTagType(type: string) {
  const types: Record<string, string> = {
    introduction: 'info',
    knowledge: 'success',
    experience: 'warning',
    experiment: 'danger',
    assignment: 'primary'
  }
  return types[type] || 'info'
}

function getModuleTypeLabel(type: string) {
  const labels: Record<string, string> = {
    introduction: '课程引入',
    knowledge: '新知讲解',
    experience: '互动体验',
    experiment: '动手实验',
    assignment: '总结作业'
  }
  return labels[type] || type
}

function getDefaultTitle(type: string) {
  return getModuleTypeLabel(type)
}

function toggleModule(key: string) {
  expandedModule.value = expandedModule.value === key ? '' : key
}

function configureModule(key: string) {
  currentModuleKey.value = key
  configuringModule.value = { ...modules.value[key] }
  configDialogVisible.value = true
}

function saveModuleConfig() {
  if (configuringModule.value && currentModuleKey.value) {
    modules.value[currentModuleKey.value] = { ...configuringModule.value }
    emitUpdate()
  }
  configDialogVisible.value = false
}

function handleModuleTypeChange() {
  // Handle type change if needed
  emitUpdate()
}

function selectExperience() {
  currentModuleKey.value = 'experience'
  experienceSelectorVisible.value = true
}

function selectLabTemplate() {
  currentModuleKey.value = 'experiment'
  labSelectorVisible.value = true
}

async function handleExperienceSelect(template: ExperienceTemplate) {
  selectedExperience.value = template
  if (modules.value.experience) {
    modules.value.experience.experienceId = template.id
    modules.value.experience.title = `体验: ${template.title}`
    emitUpdate()
  }
  experienceSelectorVisible.value = false
}

async function handleLabSelect(template: LabTemplate) {
  selectedLab.value = template
  if (modules.value.experiment) {
    modules.value.experiment.labTemplateId = template.id
    modules.value.experiment.title = `实验: ${template.title}`
    emitUpdate()
  }
  labSelectorVisible.value = false
}

function addObjective(key: string) {
  modules.value[key].objectives.push('')
  emitUpdate()
}

function removeObjective(key: string, index: number) {
  modules.value[key].objectives.splice(index, 1)
  emitUpdate()
}

function addHint(key: string) {
  modules.value[key].aiHints.push('')
  emitUpdate()
}

function removeHint(key: string, index: number) {
  modules.value[key].aiHints.splice(index, 1)
  emitUpdate()
}

function addResource(key: string) {
  // TODO: Open resource selector
  ElMessage.info('资源选择器待实现')
}

function removeResource(key: string, resourceId: string) {
  const index = modules.value[key].resources.findIndex((r: any) => r.id === resourceId)
  if (index > -1) {
    modules.value[key].resources.splice(index, 1)
    emitUpdate()
  }
}

function getResourceIcon(type: string) {
  const icons: Record<string, any> = {
    image: Picture,
    video: VideoPlay,
    document: Document,
    audio: Document,
    other: Document
  }
  return icons[type] || Document
}

function getResourceTypeColor(type: string) {
  const colors: Record<string, string> = {
    image: '#67C23A',
    video: '#E6A23C',
    document: '#409EFF',
    audio: '#F56C6C',
    other: '#909399'
  }
  return colors[type] || '#909399'
}

function editModuleContent(type: string, key: string) {
  if (type === 'experience') {
    selectExperience()
  } else if (type === 'experiment') {
    selectLabTemplate()
  }
}

function emitUpdate() {
  emit('update:modelValue', modules.value)
}

// Load selected templates
watch(
  () => modules.value.experience?.experienceId,
  async (id) => {
    if (id) {
      try {
        selectedExperience.value = await ExperienceApiService.getExperienceTemplate(id)
      } catch (error) {
        console.error('Failed to load experience template:', error)
      }
    }
  },
  { immediate: true }
)

watch(
  () => modules.value.experiment?.labTemplateId,
  async (id) => {
    if (id) {
      try {
        selectedLab.value = await LabApiService.getLabTemplate(id)
      } catch (error) {
        console.error('Failed to load lab template:', error)
      }
    }
  },
  { immediate: true }
)

// Sync with props
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      modules.value = { ...getDefaultModules(), ...val }
    }
  },
  { deep: true }
)
</script>

<style lang="scss" scoped>
  .five-module-editor {
    .modules-container {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-base);
    }

    .module-card {
      border: 1px solid var(--edu-color-gray-200);
      border-radius: var(--radius-lg);
      background-color: var(--bg-elevated);
      transition: all var(--edu-duration-fast);

      &:hover {
        box-shadow: var(--edu-shadow-sm);
      }

      &--expanded {
        box-shadow: var(--edu-shadow-md);
      }
    }

    .module-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-lg);
      cursor: pointer;

      &:hover {
        background-color: var(--edu-color-gray-50);
      }
    }

    .module-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-base);

      .module-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-lg);
        color: white;

        &--introduction {
          background-color: var(--edu-color-blue-500);
        }

        &--knowledge {
          background-color: var(--edu-color-green-500);
        }

        &--experience {
          background-color: var(--edu-color-yellow-500);
        }

        &--experiment {
          background-color: var(--edu-color-red-500);
        }

        &--assignment {
          background-color: var(--edu-color-purple-500);
        }

        svg {
          width: 24px;
          height: 24px;
        }
      }

      .module-title-group {
        h4 {
          margin: 0 0 var(--spacing-xs) 0;
          color: var(--text-primary);
        }

        .module-meta {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .duration-text {
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
        }
      }
    }

    .module-actions {
      display: flex;
      align-items: center;
      gap: var(--spacing-base);

      .expand-icon {
        transition: transform var(--edu-duration-fast);

        &--expanded {
          transform: rotate(180deg);
        }
      }
    }

    .module-content {
      padding: var(--spacing-lg);
      border-top: 1px solid var(--edu-color-gray-200);

      .content-section {
        margin-bottom: var(--spacing-lg);

        &:last-child {
          margin-bottom: 0;
        }

        h5 {
          margin: 0 0 var(--spacing-base) 0;
          color: var(--text-primary);
          font-size: var(--font-size-base);
        }
      }

      .objectives-list,
      .hints-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);

        .objective-item,
        .hint-item {
          display: flex;
          gap: var(--spacing-sm);
          align-items: center;
        }
      }

      .selected-experience,
      .selected-lab {
        .experience-info,
        .lab-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-base);
          padding: var(--spacing-base);
          background-color: var(--edu-color-gray-50);
          border-radius: var(--radius-base);

          .info-right {
            flex: 1;

            .experience-title,
            .lab-title {
              font-weight: var(--font-weight-medium);
              color: var(--text-primary);
            }

            .experience-type,
            .lab-meta {
              display: flex;
              align-items: center;
              gap: var(--spacing-sm);
              margin-top: var(--spacing-xs);
              font-size: var(--font-size-sm);
              color: var(--text-secondary);
            }
          }
        }
      }

      .no-experience,
      .no-lab {
        padding: var(--spacing-xl);
      }

      .resources-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);

        .resource-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-base);
          padding: var(--spacing-sm);
          background-color: var(--edu-color-gray-50);
          border-radius: var(--radius-base);

          .resource-icon {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: var(--edu-color-gray-200);
            border-radius: var(--radius-base);
          }

          .resource-info {
            flex: 1;

            .resource-title {
              font-weight: var(--font-weight-medium);
              color: var(--text-primary);
            }

            .resource-type {
              font-size: var(--font-size-xs);
              color: var(--text-secondary);
            }
          }
        }
      }
    }

    .config-form {
      padding: var(--spacing-lg);
    }
  }
</style>