<template>
  <div class="enhanced-course-wizard">
    <!-- 多学科模板选择 -->
    <div class="template-section">
      <div class="section-header">
        <h3>
          <el-icon><Collection /></el-icon>
          多学科课程模板
        </h3>
        <el-button
          type="primary"
          :loading="templateGenerating"
          @click="generateMultiSubjectTemplate"
        >
          <el-icon><MagicStick /></el-icon>
          AI智能生成
        </el-button>
      </div>

      <!-- 学科选择 -->
      <div class="subject-selection">
        <el-form :model="templateForm" label-width="100px">
          <el-row :gutter="16">
            <el-col :span="8">
              <el-form-item label="主学科">
                <el-select
                  v-model="templateForm.primarySubject"
                  placeholder="选择主学科"
                  @change="onPrimarySubjectChange"
                >
                  <el-option
                    v-for="subject in availableSubjects"
                    :key="subject.id"
                    :label="subject.name"
                    :value="subject.id"
                  >
                    <div class="subject-option">
                      <el-icon :style="{ color: subject.color }">
                        <component :is="subject.icon" />
                      </el-icon>
                      {{ subject.name }}
                    </div>
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="16">
              <el-form-item label="辅助学科">
                <el-select
                  v-model="templateForm.secondarySubjects"
                  multiple
                  placeholder="选择辅助学科"
                  :disabled="!templateForm.primarySubject"
                >
                  <el-option
                    v-for="subject in filteredSecondarySubjects"
                    :key="subject.id"
                    :label="subject.name"
                    :value="subject.id"
                  >
                    <div class="subject-option">
                      <el-icon :style="{ color: subject.color }">
                        <component :is="subject.icon" />
                      </el-icon>
                      {{ subject.name }}
                    </div>
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <el-col :span="8">
              <el-form-item label="年级">
                <el-select v-model="templateForm.gradeLevel" placeholder="选择年级">
                  <el-option
                    v-for="grade in grades"
                    :key="grade.value"
                    :label="grade.label"
                    :value="grade.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="时长(周)">
                <el-input-number
                  v-model="templateForm.duration"
                  :min="1"
                  :max="20"
                  controls-position="right"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="难度">
                <el-select v-model="templateForm.difficulty">
                  <el-option label="初级" value="beginner" />
                  <el-option label="中级" value="intermediate" />
                  <el-option label="高级" value="advanced" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="学习目标">
            <el-input
              v-model="templateForm.objectivesInput"
              type="textarea"
              :rows="2"
              placeholder="请输入课程学习目标，用逗号分隔"
              @blur="parseObjectives"
            />
          </el-form-item>
        </el-form>
      </div>

      <!-- 跨学科连接建议 -->
      <div
        v-if="crossDisciplinaryConnections.length > 0"
        class="connections-section"
      >
        <h4>
          <el-icon><Connection /></el-icon>
          跨学科连接建议
        </h4>
        <div class="connections-grid">
          <div
            v-for="connection in crossDisciplinaryConnections"
            :key="connection.id"
            class="connection-card"
          >
            <div class="connection-header">
              <span class="connection-title">{{ connection.title }}</span>
              <el-tag
                :type="connection.strength > 0.8 ? 'success' : connection.strength > 0.6 ? 'warning' : 'info'"
                size="small"
              >
                强度: {{ Math.round(connection.strength * 100) }}%
              </el-tag>
            </div>
            <p class="connection-description">{{ connection.description }}</p>
            <div class="connection-examples">
              <div
                v-for="example in connection.examples"
                :key="example.title"
                class="example-item"
              >
                <el-icon><Document /></el-icon>
                <span>{{ example.title }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 生成的模板预览 -->
      <div
        v-if="generatedTemplate"
        class="template-preview"
      >
        <div class="preview-header">
          <h4>{{ generatedTemplate.title }}</h4>
          <div class="preview-actions">
            <el-button @click="optimizeForLearningStyle">
              <el-icon><Setting /></el-icon>
              学习风格优化
            </el-button>
            <el-button @click="saveTemplate">
              <el-icon><Download /></el-icon>
              保存模板
            </el-button>
            <el-button type="primary" @click="applyTemplate">
              <el-icon><Check /></el-icon>
              应用模板
            </el-button>
          </div>
        </div>

        <div class="preview-content">
          <el-tabs v-model="activePreviewTab">
            <el-tab-pane label="概览" name="overview">
              <div class="template-overview">
                <p>{{ generatedTemplate.description }}</p>
                <div class="template-meta">
                  <el-tag>{{ generatedTemplate.primarySubject }}</el-tag>
                  <el-tag
                    v-for="subject in generatedTemplate.secondarySubjects"
                    :key="subject"
                    type="info"
                  >
                    {{ subject }}
                  </el-tag>
                  <el-tag type="success">{{ generatedTemplate.duration }}周</el-tag>
                  <el-tag type="warning">{{ generatedTemplate.difficulty }}</el-tag>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="章节结构" name="chapters">
              <div class="chapters-preview">
                <div
                  v-for="chapter in generatedTemplate.chapters"
                  :key="chapter.id"
                  class="chapter-preview"
                >
                  <div class="chapter-header">
                    <h5>{{ chapter.title }}</h5>
                    <el-tag size="small">{{ chapter.type }}</el-tag>
                    <span class="chapter-duration">{{ chapter.duration }}分钟</span>
                  </div>
                  <p>{{ chapter.description }}</p>
                  <div class="chapter-subjects">
                    <el-tag
                      v-for="subject in chapter.subjects"
                      :key="subject"
                      size="small"
                      type="info"
                    >
                      {{ getSubjectName(subject) }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="协作计划" name="collaboration">
              <div class="collaboration-preview">
                <h5>协作方式: {{ generatedTemplate.collaborationPlan.approach }}</h5>
                <div class="communication-tools">
                  <strong>沟通工具:</strong>
                  <el-tag
                    v-for="tool in generatedTemplate.collaborationPlan.communication.tools"
                    :key="tool"
                    size="small"
                  >
                    {{ tool }}
                  </el-tag>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>

    <!-- 版本对比 -->
    <div
      v-if="showVersionComparison"
      class="version-comparison-section"
    >
      <div class="section-header">
        <h3>
          <el-icon><Operation /></el-icon>
          版本对比
        </h3>
        <el-button @click="showVersionComparison = false">
          <el-icon><Close /></el-icon>
          关闭
        </el-button>
      </div>

      <div class="version-selector">
        <el-form :model="comparisonForm" inline>
          <el-form-item label="版本1">
            <el-select v-model="comparisonForm.version1">
              <el-option
                v-for="version in templateVersions"
                :key="version.version"
                :label="`${version.version} - ${version.title}`"
                :value="version.version"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="版本2">
            <el-select v-model="comparisonForm.version2">
              <el-option
                v-for="version in templateVersions"
                :key="version.version"
                :label="`${version.version} - ${version.title}`"
                :value="version.version"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              :disabled="!comparisonForm.version1 || !comparisonForm.version2"
              :loading="comparingVersions"
              @click="compareVersions"
            >
              开始对比
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 对比结果 -->
      <div
        v-if="versionComparisonResult"
        class="comparison-result"
      >
        <div class="comparison-summary">
          <h4>对比摘要</h4>
          <el-row :gutter="16">
            <el-col :span="6">
              <el-statistic title="总变更数" :value="versionComparisonResult.summary.totalChanges" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="新增内容" :value="versionComparisonResult.summary.additions" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="修改内容" :value="versionComparisonResult.summary.modifications" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="删除内容" :value="versionComparisonResult.summary.removals" />
            </el-col>
          </el-row>

          <div class="effort-indicator">
            <span>实施难度: </span>
            <el-tag
              :type="versionComparisonResult.summary.effortLevel === 'high' ? 'danger' :
                   versionComparisonResult.summary.effortLevel === 'medium' ? 'warning' : 'success'"
            >
              {{ versionComparisonResult.summary.effortLevel }}
            </el-tag>
          </div>
        </div>

        <div class="comparison-changes">
          <h4>详细变更</h4>
          <el-timeline>
            <el-timeline-item
              v-for="change in versionComparisonResult.changes"
              :key="change.description"
              :type="getChangeTypeColor(change.type)"
              :icon="getChangeTypeIcon(change.type)"
            >
              <div class="change-item">
                <div class="change-header">
                  <span class="change-type">{{ getChangeTypeName(change.type) }}</span>
                  <span class="change-component">{{ change.component }}</span>
                  <el-tag
                    :type="change.impact === 'high' ? 'danger' :
                         change.impact === 'medium' ? 'warning' : 'info'"
                    size="small"
                  >
                    影响: {{ change.impact }}
                  </el-tag>
                </div>
                <p class="change-description">{{ change.description }}</p>
                <div class="change-effort">
                  实施工作量: <el-tag size="small">{{ change.effort }}</el-tag>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>

        <div class="comparison-recommendations">
          <h4>建议</h4>
          <div
            v-for="recommendation in versionComparisonResult.recommendations"
            :key="recommendation.title"
            class="recommendation-card"
          >
            <div class="recommendation-header">
              <el-tag :type="getRecommendationTypeColor(recommendation.type)">
                {{ recommendation.type }}
              </el-tag>
              <span class="recommendation-title">{{ recommendation.title }}</span>
            </div>
            <p>{{ recommendation.description }}</p>
            <div class="recommendation-meta">
              <span>实施工作量: {{ recommendation.effort }}</span>
              <span>预计时间: {{ recommendation.timeline }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 学习风格优化对话框 -->
    <el-dialog
      v-model="showLearningStyleDialog"
      title="学习风格优化"
      width="500px"
    >
      <el-form :model="learningStyleForm" label-width="100px">
        <el-form-item label="学习风格">
          <el-select v-model="learningStyleForm.style">
            <el-option label="视觉型" value="visual" />
            <el-option label="听觉型" value="auditory" />
            <el-option label="动觉型" value="kinesthetic" />
            <el-option label="阅读型" value="reading" />
            <el-option label="混合型" value="mixed" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showLearningStyleDialog = false">取消</el-button>
        <el-button
          type="primary"
          :loading="optimizingForLearningStyle"
          @click="applyLearningStyleOptimization"
        >
          应用优化
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Collection, MagicStick, Connection, Document, Setting, Download, Check,
  Operation, Close, Plus, Edit, Delete
} from '@element-plus/icons-vue'
import { useSubjects } from '@/composables/useSubjects'
import aiCourseTemplateService, { type MultiSubjectTemplate } from '@/services/aiCourseTemplate'
import type { CourseSubject, CrossDisciplinaryConnection, VersionComparison } from '@/types/course'

// 响应式数据
const { subjects: availableSubjects } = useSubjects()
const templateGenerating = ref(false)
const comparingVersions = ref(false)
const optimizingForLearningStyle = ref(false)

const templateForm = ref({
  primarySubject: '' as CourseSubject,
  secondarySubjects: [] as CourseSubject[],
  gradeLevel: '',
  duration: 4,
  difficulty: 'intermediate' as const,
  objectivesInput: '',
  objectives: [] as string[]
})

const learningStyleForm = ref({
  style: 'mixed'
})

const comparisonForm = ref({
  version1: '',
  version2: ''
})

// 状态数据
const crossDisciplinaryConnections = ref<CrossDisciplinaryConnection[]>([])
const generatedTemplate = ref<MultiSubjectTemplate | null>(null)
const showVersionComparison = ref(false)
const showLearningStyleDialog = ref(false)
const activePreviewTab = ref('overview')
const templateVersions = ref<any[]>([])
const versionComparisonResult = ref<VersionComparison | null>(null)

// 年级配置
const grades = [
  { value: 'grade7', label: '七年级' },
  { value: 'grade8', label: '八年级' },
  { value: 'grade9', label: '九年级' },
  { value: 'grade10', label: '高一' },
  { value: 'grade11', label: '高二' },
  { value: 'grade12', label: '高三' }
]

// 计算属性
const filteredSecondarySubjects = computed(() => {
  if (!templateForm.value.primarySubject) return []
  return availableSubjects.value.filter(
    subject => subject.id !== templateForm.value.primarySubject
  )
})

// 方法
const parseObjectives = () => {
  const input = templateForm.value.objectivesInput.trim()
  if (input) {
    templateForm.value.objectives = input
      .split(/[，,、；;]/)
      .map(obj => obj.trim())
      .filter(obj => obj.length > 0)
  }
}

const onPrimarySubjectChange = async () => {
  if (templateForm.value.primarySubject && templateForm.value.secondarySubjects.length > 0) {
    await loadCrossDisciplinaryConnections()
  }
}

const generateMultiSubjectTemplate = async () => {
  if (!templateForm.value.primarySubject || templateForm.value.secondarySubjects.length === 0) {
    ElMessage.warning('请选择主学科和至少一个辅助学科')
    return
  }

  if (templateForm.value.objectives.length === 0) {
    ElMessage.warning('请输入学习目标')
    return
  }

  try {
    templateGenerating.value = true

    const template = await aiCourseTemplateService.generateMultiSubjectTemplate(
      [templateForm.value.primarySubject, ...templateForm.value.secondarySubjects],
      templateForm.value.objectives,
      templateForm.value.gradeLevel,
      templateForm.value.duration,
      {
        difficultyLevel: templateForm.value.difficulty,
        timeLimit: templateForm.value.duration * 7 * 24 * 60, // 转换为分钟
        resourceLimit: 20,
        accessibilityRequirements: [],
        technologyRequirements: [],
        curriculumStandards: [],
        languageRequirements: []
      }
    )

    generatedTemplate.value = template
    ElMessage.success('多学科模板生成成功')

    // 自动加载跨学科连接
    await loadCrossDisciplinaryConnections()

  } catch (error) {
    console.error('生成模板失败:', error)
    ElMessage.error('模板生成失败，请重试')
  } finally {
    templateGenerating.value = false
  }
}

const loadCrossDisciplinaryConnections = async () => {
  if (!templateForm.value.primarySubject || templateForm.value.secondarySubjects.length === 0) {
    return
  }

  try {
    const connections = await aiCourseTemplateService.suggestCrossDisciplinaryConnections(
      templateForm.value.primarySubject,
      templateForm.value.secondarySubjects
    )
    crossDisciplinaryConnections.value = connections
  } catch (error) {
    console.error('加载跨学科连接失败:', error)
  }
}

const optimizeForLearningStyle = () => {
  showLearningStyleDialog.value = true
}

const applyLearningStyleOptimization = async () => {
  if (!generatedTemplate.value) return

  try {
    optimizingForLearningStyle.value = true

    const optimized = await aiCourseTemplateService.optimizeTemplateForLearningStyle(
      generatedTemplate.value,
      learningStyleForm.value.style
    )

    generatedTemplate.value = optimized
    showLearningStyleDialog.value = false
    ElMessage.success('学习风格优化完成')

  } catch (error) {
    console.error('学习风格优化失败:', error)
    ElMessage.error('优化失败，请重试')
  } finally {
    optimizingForLearningStyle.value = false
  }
}

const saveTemplate = async () => {
  if (!generatedTemplate.value) return

  try {
    // 这里应该调用保存模板的API
    ElMessage.success('模板保存成功')
  } catch (error) {
    console.error('保存模板失败:', error)
    ElMessage.error('保存失败，请重试')
  }
}

const applyTemplate = () => {
  if (!generatedTemplate.value) return

  ElMessageBox.confirm(
    '应用模板将覆盖当前课程内容，是否继续？',
    '确认应用',
    {
      confirmButtonText: '应用',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 这里应该发出事件，将模板数据传递给父组件
    ElMessage.success('模板应用成功')
  }).catch(() => {
    // 用户取消
  })
}

const compareVersions = async () => {
  if (!comparisonForm.value.version1 || !comparisonForm.value.version2) {
    ElMessage.warning('请选择要对比的版本')
    return
  }

  if (comparisonForm.value.version1 === comparisonForm.value.version2) {
    ElMessage.warning('请选择不同的版本进行对比')
    return
  }

  try {
    comparingVersions.value = true

    const comparison = await aiCourseTemplateService.compareVersions(
      'template_id', // 这里应该是实际的模板ID
      comparisonForm.value.version1,
      comparisonForm.value.version2
    )

    versionComparisonResult.value = comparison
    ElMessage.success('版本对比完成')

  } catch (error) {
    console.error('版本对比失败:', error)
    ElMessage.error('版本对比失败，请重试')
  } finally {
    comparingVersions.value = false
  }
}

// 辅助方法
const getSubjectName = (subject: CourseSubject): string => {
  const names: Record<CourseSubject, string> = {
    chinese: '语文',
    math: '数学',
    english: '英语',
    physics: '物理',
    chemistry: '化学',
    biology: '生物',
    history: '历史',
    geography: '地理',
    politics: '政治',
    art: '艺术',
    music: '音乐',
    pe: '体育',
    it: '信息技术',
    comprehensive: '综合实践'
  }
  return names[subject] || subject
}

const getChangeTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    addition: 'success',
    modification: 'warning',
    removal: 'danger',
    restructure: 'primary'
  }
  return colors[type] || 'info'
}

const getChangeTypeIcon = (type: string) => {
  const icons: Record<string, any> = {
    addition: Plus,
    modification: Edit,
    removal: Delete,
    restructure: Operation
  }
  return icons[type] || Document
}

const getChangeTypeName = (type: string) => {
  const names: Record<string, string> = {
    addition: '新增',
    modification: '修改',
    removal: '删除',
    restructure: '重构'
  }
  return names[type] || type
}

const getRecommendationTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    adopt: 'success',
    modify: 'warning',
    reject: 'danger',
    pilot: 'info'
  }
  return colors[type] || 'info'
}

// 监听器
watch(
  () => templateForm.value.secondarySubjects,
  async (newSubjects) => {
    if (newSubjects.length > 0 && templateForm.value.primarySubject) {
      await loadCrossDisciplinaryConnections()
    }
  }
)

// 生命周期
onMounted(() => {
  // 初始化
})
</script>

<style scoped lang="scss">
.enhanced-course-wizard {
  .template-section {
    margin-bottom: 2rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;

    h3 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .el-icon {
        color: var(--edu-primary-500);
      }
    }
  }

  .subject-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .connections-section {
    margin-top: 1.5rem;
    padding: 1rem;
    background: var(--edu-bg-secondary);
    border-radius: var(--edu-radius-base);

    h4 {
      margin: 0 0 1rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  }

  .connections-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
  }

  .connection-card {
    padding: 1rem;
    background: var(--edu-bg-primary);
    border: 1px solid var(--edu-border-light);
    border-radius: var(--edu-radius-base);
    box-shadow: var(--edu-shadow-sm);

    .connection-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;

      .connection-title {
        font-weight: 600;
        color: var(--edu-text-primary);
      }
    }

    .connection-description {
      margin: 0.5rem 0;
      color: var(--edu-text-secondary);
      font-size: 0.9rem;
    }

    .connection-examples {
      .example-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.5rem;
        font-size: 0.85rem;
        color: var(--edu-text-tertiary);

        .el-icon {
          font-size: 1rem;
        }
      }
    }
  }

  .template-preview {
    margin-top: 1.5rem;
    border: 1px solid var(--edu-border-light);
    border-radius: var(--edu-radius-base);
    overflow: hidden;

    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: var(--edu-bg-secondary);
      border-bottom: 1px solid var(--edu-border-light);

      h4 {
        margin: 0;
      }

      .preview-actions {
        display: flex;
        gap: 0.5rem;
      }
    }

    .preview-content {
      padding: 1rem;

      .template-overview {
        .template-meta {
          margin-top: 1rem;
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
      }

      .chapters-preview {
        .chapter-preview {
          padding: 1rem;
          margin-bottom: 1rem;
          border: 1px solid var(--edu-border-light);
          border-radius: var(--edu-radius-base);

          .chapter-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.5rem;

            h5 {
              margin: 0;
            }

            .chapter-duration {
              margin-left: auto;
              color: var(--edu-text-tertiary);
              font-size: 0.9rem;
            }
          }

          .chapter-subjects {
            margin-top: 0.5rem;
            display: flex;
            gap: 0.25rem;
          }
        }
      }

      .collaboration-preview {
        .communication-tools {
          margin-top: 0.5rem;
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
      }
    }
  }

  .version-comparison-section {
    margin-top: 2rem;
    padding: 1.5rem;
    background: var(--edu-bg-secondary);
    border-radius: var(--edu-radius-base);

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;

      h3 {
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
    }

    .version-selector {
      margin-bottom: 1.5rem;
    }

    .comparison-result {
      .comparison-summary {
        margin-bottom: 2rem;

        h4 {
          margin: 0 0 1rem 0;
        }

        .effort-indicator {
          margin-top: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
      }

      .comparison-changes {
        margin-bottom: 2rem;

        h4 {
          margin: 0 0 1rem 0;
        }

        .change-item {
          .change-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.5rem;

            .change-type {
              font-weight: 600;
            }

            .change-component {
              color: var(--edu-text-secondary);
            }
          }

          .change-description {
            margin: 0.5rem 0;
            color: var(--edu-text-secondary);
          }

          .change-effort {
            font-size: 0.9rem;
            color: var(--edu-text-tertiary);
          }
        }
      }

      .comparison-recommendations {
        h4 {
          margin: 0 0 1rem 0;
        }

        .recommendation-card {
          padding: 1rem;
          margin-bottom: 1rem;
          border: 1px solid var(--edu-border-light);
          border-radius: var(--edu-radius-base);

          .recommendation-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.5rem;

            .recommendation-title {
              font-weight: 600;
            }
          }

          .recommendation-meta {
            margin-top: 0.5rem;
            display: flex;
            gap: 1rem;
            font-size: 0.9rem;
            color: var(--edu-text-tertiary);
          }
        }
      }
    }
  }

  // 响应式适配
  @media (max-width: 768px) {
    .connections-grid {
      grid-template-columns: 1fr;
    }

    .preview-header {
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;

      .preview-actions {
        width: 100%;
        justify-content: flex-end;
      }
    }

    .comparison-summary {
      .el-row {
        .el-col {
          margin-bottom: 1rem;
        }
      }
    }
  }
}
</style>