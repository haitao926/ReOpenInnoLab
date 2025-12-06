<template>
  <div class="experience-template-selector">
    <div class="selector-header">
      <h3>选择体验模板</h3>
      <div class="header-actions">
        <EduButton variant="outline" @click="createNew">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          创建新体验
        </EduButton>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-filters">
      <div class="search-bar">
        <EduInput
          v-model="searchQuery"
          placeholder="搜索体验模板..."
          :clearable="true"
          @input="handleSearch"
        >
          <template #prefix>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </template>
        </EduInput>
      </div>

      <div class="filters">
        <div class="filter-group">
          <label>类型</label>
          <select v-model="filters.type" @change="loadTemplates">
            <option value="">全部</option>
            <option value="quiz">测验</option>
            <option value="poll">投票</option>
            <option value="video">互动视频</option>
            <option value="custom">自定义 HTML</option>
          </select>
        </div>

        <div class="filter-group">
          <label>状态</label>
          <select v-model="filters.status" @change="loadTemplates">
            <option value="">全部</option>
            <option value="draft">草稿</option>
            <option value="published">已发布</option>
            <option value="archived">已归档</option>
          </select>
        </div>

        <div class="filter-group">
          <label>学科</label>
          <select v-model="filters.subject" @change="loadTemplates">
            <option value="">全部</option>
            <option value="math">数学</option>
            <option value="physics">物理</option>
            <option value="chemistry">化学</option>
            <option value="biology">生物</option>
            <option value="language">语文</option>
            <option value="english">英语</option>
            <option value="it">信息技术</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 模板列表 -->
    <div class="template-grid" v-loading="loading">
      <div
        v-for="template in filteredTemplates"
        :key="template.id"
        class="template-card"
        :class="{ 'template-card--selected': selectedId === template.id }"
        @click="selectTemplate(template)"
      >
        <div class="template-preview">
          <div class="preview-icon" :class="`preview-icon--${template.type}`">
            <component :is="getTypeIcon(template.type)" />
          </div>
          <div class="preview-overlay">
            <EduButton variant="text" size="sm" @click.stop="previewTemplate(template)">
              预览
            </EduButton>
          </div>
        </div>

        <div class="template-info">
          <div class="template-header">
            <h4>{{ template.title }}</h4>
            <div class="template-status" :class="`status--${template.status}`">
              {{ getStatusLabel(template.status) }}
            </div>
          </div>

          <p class="template-description">{{ template.description }}</p>

          <div class="template-meta">
            <span class="meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {{ template.metadata.estimatedDuration }} 分钟
            </span>
            <span class="meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                />
              </svg>
              {{ template.metadata.difficulty }}
            </span>
          </div>

          <div v-if="template.tags.length" class="template-tags">
            <span v-for="tag in template.tags.slice(0, 3)" :key="tag" class="tag">{{ tag }}</span>
            <span v-if="template.tags.length > 3" class="tag tag--more">
              +{{ template.tags.length - 3 }}
            </span>
          </div>
        </div>

        <div class="template-actions" @click.stop>
          <EduButton variant="text" size="sm" @click="editTemplate(template)">编辑</EduButton>
          <EduButton variant="text" size="sm" @click="duplicateTemplate(template)">复制</EduButton>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && filteredTemplates.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <p>没有找到匹配的体验模板</p>
        <EduButton variant="primary" @click="createNew">创建新体验</EduButton>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="pagination">
      <EduButton variant="outline" size="sm" :disabled="currentPage === 1" @click="prevPage">
        上一页
      </EduButton>
      <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
      <EduButton
        variant="outline"
        size="sm"
        :disabled="currentPage === totalPages"
        @click="nextPage"
      >
        下一页
      </EduButton>
    </div>

    <!-- 预览对话框 -->
    <teleport to="body">
      <div v-if="previewingTemplate" class="preview-overlay" @click="closePreview">
        <div class="preview-dialog" @click.stop>
          <div class="preview-header">
            <h3>{{ previewingTemplate.title }}</h3>
            <EduButton variant="text" @click="closePreview">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </EduButton>
          </div>
          <div class="preview-content">
            <ExperiencePreview
              v-if="previewingTemplate"
              :experience="previewingTemplate"
              :mode="'preview'"
            />
          </div>
          <div class="preview-footer">
            <EduButton variant="outline" @click="closePreview">关闭</EduButton>
            <EduButton variant="primary" @click="selectAndClose(previewingTemplate)">
              选择此模板
            </EduButton>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { EduButton, EduInput } from '@reopeninnolab/ui-kit'
import { ExperienceApiService } from '@/api/experience'
import ExperiencePreview from './ExperiencePreview.vue'
import type { ExperienceTemplate } from '@/types/experience'
import { useRouter } from 'vue-router'

const props = defineProps<{
    modelValue?: string
    multiple?: boolean
  }>()

const emit = defineEmits<{
    'update:modelValue': [value: string | string[] | undefined]
    select: [template: ExperienceTemplate]
  }>()

const router = useRouter()

// 状态
const templates = ref<ExperienceTemplate[]>([])
const loading = ref(false)
const selectedId = ref<string>()
const searchQuery = ref('')
const previewingTemplate = ref<ExperienceTemplate>()
const currentPage = ref(1)
const pageSize = 12
const total = ref(0)

// 筛选器
const filters = ref({
  type: '',
  status: '',
  subject: '',
  tags: [] as string[]
})

// 计算属性
const filteredTemplates = computed(() => {
  let result = templates.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      t =>
        t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }

  return result
})

const totalPages = computed(() => Math.ceil(total.value / pageSize))

// 方法
const loadTemplates = async () => {
  loading.value = true
  try {
    const response = await ExperienceApiService.getExperienceTemplates({
      page: currentPage.value,
      limit: pageSize,
      search: searchQuery.value || undefined,
      type: filters.value.type || undefined,
      status: (filters.value.status as any) || undefined,
      subject: filters.value.subject || undefined,
      tags: filters.value.tags.length > 0 ? filters.value.tags : undefined
    })

    templates.value = response.templates
    total.value = response.total
  } catch (error) {
    console.error('加载体验模板失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = debounce(() => {
  currentPage.value = 1
  loadTemplates()
}, 300)

const selectTemplate = (template: ExperienceTemplate) => {
  if (props.multiple) {
    // TODO: 支持多选
  } else {
    selectedId.value = template.id
    emit('update:modelValue', template.id)
    emit('select', template)
  }
}

const selectAndClose = (template: ExperienceTemplate) => {
  selectTemplate(template)
  closePreview()
}

const previewTemplate = (template: ExperienceTemplate) => {
  previewingTemplate.value = template
}

const closePreview = () => {
  previewingTemplate.value = undefined
}

const editTemplate = (template: ExperienceTemplate) => {
  router.push(`/experiences/${template.id}/edit`)
}

const duplicateTemplate = async (template: ExperienceTemplate) => {
  try {
    const duplicated = await ExperienceApiService.duplicateExperienceTemplate(template.id)
    templates.value.unshift(duplicated)
  } catch (error) {
    console.error('复制模板失败:', error)
  }
}

const createNew = () => {
  router.push('/experiences/create')
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    loadTemplates()
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    loadTemplates()
  }
}

const getTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    quiz: 'QuizIcon',
    poll: 'PollIcon',
    video: 'VideoIcon',
    custom: 'CodeIcon'
  }
  return icons[type] || 'DefaultIcon'
}

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    draft: '草稿',
    published: '已发布',
    archived: '已归档'
  }
  return labels[status] || status
}

function debounce<T extends(...args: unknown[]) => void>(func: T, wait: number) {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

// 监听 props 变化
watch(
  () => props.modelValue,
  newVal => {
    selectedId.value = newVal as string
  },
  { immediate: true }
)

// 生命周期
onMounted(() => {
  loadTemplates()
})
</script>

<style lang="scss" scoped>
  .experience-template-selector {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
    height: 100%;
  }

  .selector-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    h3 {
      margin: 0;
      color: var(--text-primary);
    }
  }

  .search-filters {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-base);
  }

  .search-bar {
    flex: 1;
  }

  .filters {
    display: flex;
    gap: var(--spacing-base);
    flex-wrap: wrap;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);

    label {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }

    select {
      padding: var(--spacing-xs) var(--spacing-sm);
      border: 1px solid var(--edu-color-gray-300);
      border-radius: var(--radius-base);
      background-color: var(--bg-elevated);
      color: var(--text-primary);
      min-width: 120px;
    }
  }

  .template-grid {
    flex: 1;
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--spacing-base);
  }

  .template-card {
    border: 1px solid var(--edu-color-gray-200);
    border-radius: var(--radius-lg);
    padding: var(--spacing-base);
    background-color: var(--bg-elevated);
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    position: relative;

    &:hover {
      border-color: var(--edu-primary-500);
      box-shadow: var(--edu-shadow-md);
    }

    &--selected {
      border-color: var(--edu-primary-500);
      background-color: var(--edu-primary-50);
    }
  }

  .template-preview {
    position: relative;
    height: 120px;
    border-radius: var(--radius-base);
    background-color: var(--edu-color-gray-100);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    .preview-icon {
      width: 48px;
      height: 48px;
      color: var(--edu-color-gray-400);

      &--quiz {
        color: var(--edu-color-blue-500);
      }

      &--poll {
        color: var(--edu-color-green-500);
      }

      &--video {
        color: var(--edu-color-purple-500);
      }

      &--custom {
        color: var(--edu-color-orange-500);
      }

      svg {
        width: 100%;
        height: 100%;
      }
    }

    .preview-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;

      .template-card:hover & {
        opacity: 1;
      }
    }
  }

  .template-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-base);
  }

  .template-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--spacing-sm);

    h4 {
      margin: 0;
      color: var(--text-primary);
      font-size: var(--font-size-base);
      line-height: var(--line-height-tight);
      flex: 1;
    }
  }

  .template-status {
    padding: 2px 8px;
    border-radius: var(--radius-full);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    white-space: nowrap;

    &--draft {
      background-color: var(--edu-color-gray-100);
      color: var(--text-secondary);
    }

    &--published {
      background-color: var(--edu-color-success-light);
      color: var(--edu-color-success-default);
    }

    &--archived {
      background-color: var(--edu-color-warning-light);
      color: var(--edu-color-warning-default);
    }
  }

  .template-description {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-relaxed);
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .template-meta {
    display: flex;
    gap: var(--spacing-base);
    flex-wrap: wrap;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    color: var(--text-tertiary);
    font-size: var(--font-size-xs);

    svg {
      width: 14px;
      height: 14px;
    }
  }

  .template-tags {
    display: flex;
    gap: var(--spacing-xs);
    flex-wrap: wrap;
  }

  .tag {
    padding: 2px 8px;
    background-color: var(--edu-color-blue-50);
    color: var(--edu-color-blue-600);
    border-radius: var(--radius-base);
    font-size: var(--font-size-xs);

    &--more {
      background-color: var(--edu-color-gray-100);
      color: var(--text-tertiary);
    }
  }

  .template-actions {
    display: flex;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-base);
    padding-top: var(--spacing-base);
    border-top: 1px solid var(--edu-color-gray-200);
  }

  .empty-state {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl);
    text-align: center;
    color: var(--text-tertiary);

    svg {
      width: 64px;
      height: 64px;
      margin-bottom: var(--spacing-base);
    }

    p {
      margin: 0 0 var(--spacing-base) 0;
    }
  }

  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-base);
  }

  .page-info {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
  }

  .preview-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .preview-dialog {
    background-color: var(--bg-primary);
    border-radius: var(--radius-lg);
    width: 90%;
    max-width: 800px;
    height: 80%;
    max-height: 600px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-lg);
    border-bottom: 1px solid var(--edu-color-gray-200);

    h3 {
      margin: 0;
      color: var(--text-primary);
    }
  }

  .preview-content {
    flex: 1;
    overflow: auto;
    padding: var(--spacing-lg);
  }

  .preview-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--spacing-sm);
    padding: var(--spacing-lg);
    border-top: 1px solid var(--edu-color-gray-200);
  }

  // 响应式设计
  @media (max-width: 1024px) {
    .template-grid {
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    }
  }

  @media (max-width: 768px) {
    .filters {
      flex-direction: column;
    }

    .template-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
