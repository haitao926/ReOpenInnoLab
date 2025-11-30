<template>
  <div class="lab-template-selector">
    <div class="selector-header">
      <h3>选择实验模板</h3>
      <div class="search-bar">
        <EduInput
          v-model="searchQuery"
          placeholder="搜索实验模板..."
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
    </div>

    <!-- 筛选器 -->
    <div class="filters">
      <div class="filter-group">
        <label>学科</label>
        <select v-model="filters.subject" @change="loadTemplates">
          <option value="">全部</option>
          <option value="physics">物理</option>
          <option value="chemistry">化学</option>
          <option value="math">数学</option>
          <option value="biology">生物</option>
          <option value="cs">计算机科学</option>
        </select>
      </div>
      <div class="filter-group">
        <label>难度</label>
        <select v-model="filters.difficulty" @change="loadTemplates">
          <option value="">全部</option>
          <option value="beginner">初级</option>
          <option value="intermediate">中级</option>
          <option value="advanced">高级</option>
          <option value="expert">专家</option>
        </select>
      </div>
      <div class="filter-group">
        <label>类型</label>
        <select v-model="filters.type" @change="loadTemplates">
          <option value="">全部</option>
          <option value="jupyter">Jupyter Notebook</option>
          <option value="python">Python</option>
          <option value="r">R 语言</option>
          <option value="markdown">Markdown</option>
        </select>
      </div>
    </div>

    <!-- 模板列表 -->
    <div class="template-list" v-loading="loading">
      <div
        v-for="template in filteredTemplates"
        :key="template.id"
        class="template-card"
        :class="{ 'template-card--selected': selectedId === template.id }"
        @click="selectTemplate(template)"
      >
        <div class="template-preview">
          <img
            v-if="template.thumbnailUrl"
            :src="template.thumbnailUrl"
            :alt="template.title"
            @error="handleImageError"
          />
          <div v-else class="preview-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div class="preview-overlay" @click.stop="previewTemplate(template)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11 8-11 8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>预览</span>
          </div>
        </div>

        <div class="template-info">
          <div class="template-header">
            <h4>{{ template.title }}</h4>
            <div class="template-meta">
              <span class="difficulty" :class="`difficulty--${template.difficultyLevel}`">
                {{ getDifficultyLabel(template.difficultyLevel) }}
              </span>
              <span class="type">{{ getTypeLabel(template.labType) }}</span>
            </div>
          </div>

          <p class="template-description">{{ template.description }}</p>

          <div class="template-stats">
            <div class="stat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="9" y1="9" x2="15" y2="9" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
              <span>{{ template.metadata?.cellCount || 0 }} 个单元格</span>
            </div>
            <div class="stat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{{ template.metadata?.estimatedDuration || '未知' }}</span>
            </div>
          </div>

          <div v-if="template.tags.length" class="template-tags">
            <span v-for="tag in template.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>

          <div v-if="template.aiDescription" class="ai-description">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <span>{{ template.aiDescription }}</span>
          </div>
        </div>

        <div class="template-actions" @click.stop>
          <EduButton variant="text" size="sm" @click.stop="previewTemplate(template)">
            预览
          </EduButton>
          <EduButton variant="text" size="sm" @click.stop="editTemplate(template)">编辑</EduButton>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && filteredTemplates.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <p>没有找到匹配的实验模板</p>
        <EduButton variant="primary" @click="createNew">创建新实验</EduButton>
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
            <iframe
              v-if="previewingTemplate.previewUrl"
              :src="previewingTemplate.previewUrl"
              class="preview-frame"
            ></iframe>
            <div v-else class="preview-placeholder-large">
              <p>暂无预览</p>
            </div>
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
import { LabApiService } from '@/api/lab'
import type { LabTemplate } from '@/types/experiment'
import { useRouter } from 'vue-router'

const props = defineProps<{
    modelValue?: string
    multiple?: boolean
  }>()

const emit = defineEmits<{
    'update:modelValue': [value: string | string[] | undefined]
    select: [template: LabTemplate]
  }>()

const router = useRouter()

// 状态
const templates = ref<LabTemplate[]>([])
const loading = ref(false)
const selectedId = ref<string>()
const searchQuery = ref('')
const previewingTemplate = ref<LabTemplate>()
const currentPage = ref(1)
const pageSize = 12
const total = ref(0)

// 筛选器
const filters = ref({
  subject: '',
  difficulty: '',
  type: '',
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
    const response = await LabApiService.getLabTemplates({
      page: currentPage.value,
      limit: pageSize,
      search: searchQuery.value || undefined,
      labType: filters.value.type || undefined,
      difficultyLevel: filters.value.difficulty || undefined,
      tags: filters.value.tags.length > 0 ? filters.value.tags : undefined
    })

    templates.value = response.templates
    total.value = response.total
  } catch (error) {
    console.error('加载实验模板失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = debounce(() => {
  currentPage.value = 1
  loadTemplates()
}, 300)

const selectTemplate = (template: LabTemplate) => {
  if (props.multiple) {
    // TODO: 支持多选
  } else {
    selectedId.value = template.id
    emit('update:modelValue', template.id)
    emit('select', template)
  }
}

const selectAndClose = (template: LabTemplate) => {
  selectTemplate(template)
  closePreview()
}

const previewTemplate = (template: LabTemplate) => {
  previewingTemplate.value = template
}

const closePreview = () => {
  previewingTemplate.value = undefined
}

const editTemplate = (template: LabTemplate) => {
  router.push(`/labs/${template.id}/edit`)
}

const createNew = () => {
  router.push('/labs/create')
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

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

const getDifficultyLabel = (difficulty: string): string => {
  const labels: Record<string, string> = {
    beginner: '初级',
    intermediate: '中级',
    advanced: '高级',
    expert: '专家'
  }
  return labels[difficulty] || difficulty
}

const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    jupyter: 'Jupyter',
    python: 'Python',
    r: 'R',
    markdown: 'Markdown'
  }
  return labels[type] || type
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
  .lab-template-selector {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
    height: 100%;
  }

  .selector-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-base);

    h3 {
      margin: 0;
      color: var(--text-primary);
    }
  }

  .search-bar {
    flex: 1;
    max-width: 400px;
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
    }
  }

  .template-list {
    flex: 1;
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
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
    height: 160px;
    border-radius: var(--radius-base);
    overflow: hidden;
    background-color: var(--edu-color-gray-100);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .preview-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--edu-color-gray-400);

      svg {
        width: 48px;
        height: 48px;
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
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      opacity: 0;
      transition: opacity 0.3s ease;

      svg {
        width: 32px;
        height: 32px;
        margin-bottom: var(--spacing-xs);
      }

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
      font-size: var(--font-size-lg);
      line-height: var(--line-height-tight);
    }
  }

  .template-meta {
    display: flex;
    gap: var(--spacing-xs);
    flex-shrink: 0;
  }

  .difficulty {
    padding: 2px 8px;
    border-radius: var(--radius-full);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);

    &--beginner {
      background-color: var(--edu-color-success-light);
      color: var(--edu-color-success-default);
    }

    &--intermediate {
      background-color: var(--edu-color-warning-light);
      color: var(--edu-color-warning-default);
    }

    &--advanced {
      background-color: var(--edu-color-error-light);
      color: var(--edu-color-error-default);
    }

    &--expert {
      background-color: var(--edu-color-purple-light);
      color: var(--edu-color-purple-default);
    }
  }

  .type {
    padding: 2px 8px;
    background-color: var(--edu-color-gray-100);
    color: var(--text-secondary);
    border-radius: var(--radius-full);
    font-size: var(--font-size-xs);
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

  .template-stats {
    display: flex;
    gap: var(--spacing-base);
  }

  .stat {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    color: var(--text-tertiary);
    font-size: var(--font-size-sm);

    svg {
      width: 16px;
      height: 16px;
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
  }

  .ai-description {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm);
    background-color: var(--edu-color-purple-50);
    border-radius: var(--radius-base);
    color: var(--edu-color-purple-700);
    font-size: var(--font-size-sm);

    svg {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      margin-top: 2px;
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
    max-width: 1200px;
    height: 80%;
    max-height: 800px;
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
    overflow: hidden;
  }

  .preview-frame {
    width: 100%;
    height: 100%;
    border: none;
  }

  .preview-placeholder-large {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-tertiary);
  }

  .preview-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--spacing-sm);
    padding: var(--spacing-lg);
    border-top: 1px solid var(--edu-color-gray-200);
  }
</style>
