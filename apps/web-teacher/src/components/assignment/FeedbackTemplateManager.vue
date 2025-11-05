<template>
  <div class="feedback-template-manager">
    <!-- 模板管理头部 -->
    <div class="manager-header">
      <div class="header-left">
        <h4>评语模板管理</h4>
        <p>创建、编辑和管理AI评语模板</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          新建模板
        </el-button>
        <el-button @click="importTemplates">
          <el-icon><Upload /></el-icon>
          导入模板
        </el-button>
        <el-button @click="exportTemplates">
          <el-icon><Download /></el-icon>
          导出模板
        </el-button>
      </div>
    </div>

    <!-- 筛选和搜索 -->
    <div class="template-filters">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-select
            v-model="filters.category"
            placeholder="选择分类"
            clearable
            @change="loadTemplates"
          >
            <el-option
              v-for="category in categories"
              :key="category.value"
              :label="category.label"
              :value="category.value"
            />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select
            v-model="filters.subject"
            placeholder="选择学科"
            clearable
            @change="loadTemplates"
          >
            <el-option
              v-for="subject in subjects"
              :key="subject.value"
              :label="subject.label"
              :value="subject.value"
            />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select
            v-model="filters.gradeLevel"
            placeholder="选择年级"
            clearable
            @change="loadTemplates"
          >
            <el-option
              v-for="grade in gradeLevels"
              :key="grade.value"
              :label="grade.label"
              :value="grade.value"
            />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-input
            v-model="filters.search"
            placeholder="搜索模板"
            clearable
            @input="searchTemplates"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
      </el-row>
    </div>

    <!-- 模板列表 -->
    <div class="template-list">
      <div
        v-for="template in filteredTemplates"
        :key="template.id"
        class="template-card"
        :class="{ 'template-card--public': template.settings.isPublic }"
      >
        <div class="template-header">
          <div class="template-info">
            <h5>{{ template.name }}</h5>
            <div class="template-meta">
              <el-tag
                :type="getCategoryType(template.category.main)"
                size="small"
              >
                {{ getCategoryName(template.category) }}
              </el-tag>
              <el-tag v-if="template.category.subject" size="small" type="info">
                {{ template.category.subject }}
              </el-tag>
              <el-tag v-if="template.settings.isPublic" size="small" type="success">
                公开
              </el-tag>
            </div>
          </div>
          <div class="template-actions">
            <el-dropdown @command="(command) => handleTemplateAction(command, template)">
              <el-button size="small" text>
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">
                    <el-icon><Edit /></el-icon>
                    编辑
                  </el-dropdown-item>
                  <el-dropdown-item command="duplicate">
                    <el-icon><CopyDocument /></el-icon>
                    复制
                  </el-dropdown-item>
                  <el-dropdown-item command="export">
                    <el-icon><Download /></el-icon>
                    导出
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <div class="template-content">
          <p class="template-description">{{ template.description }}</p>
          <div class="template-preview">
            <div class="preview-label">模板预览:</div>
            <div class="preview-content">{{ template.template }}</div>
          </div>
        </div>

        <div class="template-footer">
          <div class="template-stats">
            <div class="stat-item">
              <span class="stat-label">使用次数:</span>
              <span class="stat-value">{{ template.usage.usedCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">平均评分:</span>
              <el-rate
                v-model="template.usage.averageRating"
                disabled
                size="small"
                show-score
                text-color="#ff9900"
              />
            </div>
            <div class="stat-item">
              <span class="stat-label">效果:</span>
              <el-progress
                :percentage="Math.round(template.usage.effectiveness * 100)"
                :stroke-width="4"
                :show-text="false"
              />
              <span class="effectiveness-text">
                {{ Math.round(template.usage.effectiveness * 100) }}%
              </span>
            </div>
          </div>
          <div class="template-tags">
            <el-tag
              v-for="tag in template.metadata.tags"
              :key="tag"
              size="small"
              type="info"
              effect="plain"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div
      v-if="filteredTemplates.length === 0"
      class="empty-state"
    >
      <el-empty description="暂无模板">
        <el-button type="primary" @click="showCreateDialog = true">
          创建第一个模板
        </el-button>
      </el-empty>
    </div>

    <!-- 创建/编辑模板对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingTemplate ? '编辑模板' : '新建模板'"
      width="80%"
      :close-on-click-modal="false"
    >
      <TemplateForm
        :template="editingTemplate"
        :categories="categories"
        :subjects="subjects"
        :grade-levels="gradeLevels"
        @template-saved="onTemplateSaved"
        @cancel="showCreateDialog = false"
      />
    </el-dialog>

    <!-- 模板预览对话框 -->
    <el-dialog
      v-model="showPreviewDialog"
      title="模板预览"
      width="70%"
    >
      <TemplatePreview
        v-if="previewingTemplate"
        :template="previewingTemplate"
        @close="showPreviewDialog = false"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Upload, Download, Search, MoreFilled, Edit, CopyDocument, Delete
} from '@element-plus/icons-vue'
import aiFeedbackService from '@/services/aiFeedbackService'
import type { FeedbackTemplate, TemplateFilters } from '@/types/feedback'
import TemplateForm from './TemplateForm.vue'
import TemplatePreview from './TemplatePreview.vue'

// 响应式数据
const templates = ref<FeedbackTemplate[]>([])
const filteredTemplates = ref<FeedbackTemplate[]>([])
const editingTemplate = ref<FeedbackTemplate | null>(null)
const previewingTemplate = ref<FeedbackTemplate | null>(null)

// UI状态
const showCreateDialog = ref(false)
const showPreviewDialog = ref(false)

// 筛选条件
const filters = ref<TemplateFilters>({
  category: undefined,
  subject: undefined,
  gradeLevel: undefined,
  search: ''
})

// 分类选项
const categories = [
  { value: { main: 'academic', sub: 'general' }, label: '学术-通用' },
  { value: { main: 'academic', sub: 'math' }, label: '学术-数学' },
  { value: { main: 'academic', sub: 'science' }, label: '学术-科学' },
  { value: { main: 'behavioral', sub: 'participation' }, label: '行为-参与' },
  { value: { main: 'skill', sub: 'critical_thinking' }, label: '技能-批判思维' },
  { value: { main: 'creative', sub: 'innovation' }, label: '创意-创新' },
  { value: { main: 'collaborative', sub: 'teamwork' }, label: '协作-团队合作' }
]

// 学科选项
const subjects = [
  { value: 'chinese', label: '语文' },
  { value: 'math', label: '数学' },
  { value: 'english', label: '英语' },
  { value: 'physics', label: '物理' },
  { value: 'chemistry', label: '化学' },
  { value: 'biology', label: '生物' },
  { value: 'history', label: '历史' },
  { value: 'geography', label: '地理' },
  { value: 'politics', label: '政治' },
  { value: 'art', label: '艺术' },
  { value: 'music', label: '音乐' },
  { value: 'pe', label: '体育' },
  { value: 'it', label: '信息技术' }
]

// 年级选项
const gradeLevels = [
  { value: 'grade1', label: '一年级' },
  { value: 'grade2', label: '二年级' },
  { value: 'grade3', label: '三年级' },
  { value: 'grade4', label: '四年级' },
  { value: 'grade5', label: '五年级' },
  { value: 'grade6', label: '六年级' },
  { value: 'grade7', label: '七年级' },
  { value: 'grade8', label: '八年级' },
  { value: 'grade9', label: '九年级' },
  { value: 'grade10', label: '高一' },
  { value: 'grade11', label: '高二' },
  { value: 'grade12', label: '高三' }
]

// 计算属性
const loading = ref(false)

// 方法
const loadTemplates = async () => {
  try {
    loading.value = true
    const templateList = await aiFeedbackService.getFeedbackTemplates(filters.value)
    templates.value = templateList
    applyFilters()
  } catch (error) {
    console.error('加载模板失败:', error)
    ElMessage.error('加载模板失败')
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  filteredTemplates.value = templates.value.filter(template => {
    // 分类筛选
    if (filters.value.category) {
      if (template.category.main !== filters.value.category?.main ||
          template.category.sub !== filters.value.category?.sub) {
        return false
      }
    }

    // 学科筛选
    if (filters.value.subject && template.category.subject !== filters.value.subject) {
      return false
    }

    // 年级筛选
    if (filters.value.gradeLevel && template.category.gradeLevel !== filters.value.gradeLevel) {
      return false
    }

    // 搜索筛选
    if (filters.value.search) {
      const search = filters.value.search.toLowerCase()
      return template.name.toLowerCase().includes(search) ||
             template.description.toLowerCase().includes(search) ||
             template.metadata.tags.some(tag => tag.toLowerCase().includes(search))
    }

    return true
  })
}

const searchTemplates = () => {
  applyFilters()
}

const getCategoryName = (category: any): string => {
  const categoryMap: Record<string, string> = {
    academic: '学术',
    behavioral: '行为',
    skill: '技能',
    creative: '创意',
    collaborative: '协作'
  }
  return categoryMap[category.main] || category.main
}

const getCategoryType = (category: string): string => {
  const typeMap: Record<string, string> = {
    academic: 'primary',
    behavioral: 'success',
    skill: 'warning',
    creative: 'danger',
    collaborative: 'info'
  }
  return typeMap[category] || 'info'
}

const handleTemplateAction = async (command: string, template: FeedbackTemplate) => {
  switch (command) {
    case 'edit':
      editingTemplate.value = template
      showCreateDialog.value = true
      break

    case 'duplicate':
      await duplicateTemplate(template)
      break

    case 'export':
      await exportSingleTemplate(template)
      break

    case 'delete':
      await deleteTemplate(template)
      break

    case 'preview':
      previewingTemplate.value = template
      showPreviewDialog.value = true
      break
  }
}

const duplicateTemplate = async (template: FeedbackTemplate) => {
  try {
    const duplicatedTemplate = {
      ...template,
      name: `${template.name} (副本)`,
      metadata: {
        ...template.metadata,
        createdBy: 'current_user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }

    delete (duplicatedTemplate as any).id
    await aiFeedbackService.createFeedbackTemplate(duplicatedTemplate)
    ElMessage.success('模板复制成功')
    await loadTemplates()
  } catch (error) {
    console.error('复制模板失败:', error)
    ElMessage.error('复制模板失败')
  }
}

const exportSingleTemplate = async (template: FeedbackTemplate) => {
  try {
    const data = JSON.stringify(template, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${template.name}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    ElMessage.success('模板导出成功')
  } catch (error) {
    console.error('导出模板失败:', error)
    ElMessage.error('导出模板失败')
  }
}

const deleteTemplate = async (template: FeedbackTemplate) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除模板 "${template.name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消'
      }
    )

    const success = await aiFeedbackService.deleteFeedbackTemplate(template.id)
    if (success) {
      ElMessage.success('模板删除成功')
      await loadTemplates()
    } else {
      ElMessage.error('删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除模板失败:', error)
      ElMessage.error('删除模板失败')
    }
  }
}

const importTemplates = async () => {
  try {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const data = JSON.parse(text)

        if (Array.isArray(data)) {
          // 批量导入
          for (const templateData of data) {
            await aiFeedbackService.createFeedbackTemplate(templateData)
          }
          ElMessage.success(`成功导入 ${data.length} 个模板`)
        } else {
          // 单个导入
          await aiFeedbackService.createFeedbackTemplate(data)
          ElMessage.success('模板导入成功')
        }

        await loadTemplates()
      } catch (error) {
        console.error('导入模板失败:', error)
        ElMessage.error('导入失败，请检查文件格式')
      }
    }
    input.click()
  } catch (error) {
    console.error('导入模板失败:', error)
    ElMessage.error('导入失败')
  }
}

const exportTemplates = async () => {
  try {
    const data = JSON.stringify(filteredTemplates.value, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `feedback_templates_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    ElMessage.success('模板导出成功')
  } catch (error) {
    console.error('导出模板失败:', error)
    ElMessage.error('导出失败')
  }
}

const onTemplateSaved = async (templateData: any) => {
  try {
    if (editingTemplate.value) {
      // 更新现有模板
      await aiFeedbackService.updateFeedbackTemplate(editingTemplate.value.id, templateData)
      ElMessage.success('模板更新成功')
    } else {
      // 创建新模板
      await aiFeedbackService.createFeedbackTemplate(templateData)
      ElMessage.success('模板创建成功')
    }

    showCreateDialog.value = false
    editingTemplate.value = null
    await loadTemplates()
  } catch (error) {
    console.error('保存模板失败:', error)
    ElMessage.error('保存失败')
  }
}

// 事件发射
const emit = defineEmits<{
  'template-created': [template: FeedbackTemplate]
  'template-updated': [template: FeedbackTemplate]
  'template-deleted': [templateId: string]
}>()

// 生命周期
onMounted(() => {
  loadTemplates()
})
</script>

<style scoped lang="scss">
.feedback-template-manager {
  .manager-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;

    .header-left {
      h4 {
        margin: 0 0 0.5rem 0;
        color: var(--edu-text-primary);
      }

      p {
        margin: 0;
        color: var(--edu-text-secondary);
        font-size: 0.9rem;
      }
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }
  }

  .template-filters {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: var(--edu-bg-secondary);
    border-radius: var(--edu-radius-base);
  }

  .template-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 1rem;
  }

  .template-card {
    border: 1px solid var(--edu-border-light);
    border-radius: var(--edu-radius-base);
    padding: 1rem;
    background: var(--edu-bg-primary);
    transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

    &:hover {
      border-color: var(--edu-primary-300);
      box-shadow: var(--edu-shadow-md);
    }

    &--public {
      border-left: 4px solid var(--edu-success-500);
    }

    .template-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;

      .template-info {
        h5 {
          margin: 0 0 0.5rem 0;
          color: var(--edu-text-primary);
          font-size: 1.1rem;
        }

        .template-meta {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
      }
    }

    .template-content {
      margin-bottom: 1rem;

      .template-description {
        margin: 0 0 1rem 0;
        color: var(--edu-text-secondary);
        font-size: 0.9rem;
        line-height: 1.5;
      }

      .template-preview {
        .preview-label {
          font-size: 0.85rem;
          color: var(--edu-text-tertiary);
          margin-bottom: 0.5rem;
        }

        .preview-content {
          padding: 0.75rem;
          background: var(--edu-bg-secondary);
          border-radius: var(--edu-radius-sm);
          border-left: 3px solid var(--edu-primary-500);
          color: var(--edu-text-secondary);
          font-size: 0.9rem;
          line-height: 1.4;
          max-height: 100px;
          overflow-y: auto;
        }
      }
    }

    .template-footer {
      .template-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        margin-bottom: 1rem;

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;

          .stat-label {
            font-size: 0.8rem;
            color: var(--edu-text-tertiary);
            margin-bottom: 0.25rem;
          }

          .stat-value {
            font-weight: 600;
            color: var(--edu-text-primary);
          }

          .effectiveness-text {
            font-size: 0.8rem;
            color: var(--edu-text-secondary);
            margin-top: 0.25rem;
          }
        }
      }

      .template-tags {
        display: flex;
        gap: 0.25rem;
        flex-wrap: wrap;
      }
    }
  }

  .empty-state {
    padding: 3rem;
    text-align: center;
  }

  // 响应式适配
  @media (max-width: 768px) {
    .manager-header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;

      .header-actions {
        justify-content: stretch;
      }
    }

    .template-filters {
      .el-row {
        .el-col {
          margin-bottom: 0.5rem;
        }
      }
    }

    .template-list {
      grid-template-columns: 1fr;
    }

    .template-card {
      .template-stats {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }
    }
  }
}
</style>