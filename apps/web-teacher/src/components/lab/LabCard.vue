<template>
  <div class="lab-card" :class="{ 'lab-card--selected': selected }">
    <!-- 卡片头部 -->
    <div class="lab-card__header">
      <!-- 缩略图 -->
      <div class="lab-thumbnail">
        <img
          v-if="lab.thumbnailUrl"
          :src="lab.thumbnailUrl"
          :alt="lab.title"
          @error="handleImageError"
        />
        <div v-else class="thumbnail-placeholder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="9" y1="9" x2="15" y2="9"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
        </div>
      </div>

      <!-- 实验类型标签 -->
      <div class="lab-type-badge">
        <span class="badge-text">{{ getLabTypeLabel(lab.labType) }}</span>
      </div>

      <!-- 状态指示器 -->
      <div class="lab-status">
        <div
          class="status-dot"
          :class="getStatusClass(lab.status)"
          :title="getStatusText(lab.status)"
        ></div>
      </div>
    </div>

    <!-- 卡片内容 -->
    <div class="lab-card__content">
      <!-- 标题 -->
      <h3 class="lab-title" :title="lab.title">{{ lab.title }}</h3>

      <!-- 描述 -->
      <p class="lab-description" :title="lab.description">
        {{ lab.description }}
      </p>

      <!-- 元数据 -->
      <div class="lab-metadata">
        <div class="metadata-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <span>{{ getDifficultyLabel(lab.difficultyLevel) }}</span>
        </div>

        <div v-if="lab.metadata?.cellCount" class="metadata-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="9" y1="9" x2="15" y2="9"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          <span>{{ lab.metadata.cellCount }} 个单元格</span>
        </div>

        <div v-if="lab.gradeBand" class="metadata-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
          <span>{{ getGradeBandLabel(lab.gradeBand) }}</span>
        </div>
      </div>

      <!-- 标签 -->
      <div v-if="lab.tags && lab.tags.length > 0" class="lab-tags">
        <span
          v-for="tag in lab.tags.slice(0, 3)"
          :key="tag"
          class="tag"
        >
          {{ tag }}
        </span>
        <span v-if="lab.tags.length > 3" class="tag tag--more">
          +{{ lab.tags.length - 3 }}
        </span>
      </div>
    </div>

    <!-- 卡片底部 -->
    <div class="lab-card__footer">
      <!-- 作者信息 -->
      <div class="lab-author">
        <div class="author-avatar">
          {{ getAuthorInitials(lab.createdBy) }}
        </div>
        <div class="author-info">
          <span class="author-name">{{ getAuthorName(lab.createdBy) }}</span>
          <span class="created-time">{{ formatRelativeTime(lab.createdAt) }}</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="lab-actions">
        <EduButton
          variant="text"
          size="small"
          @click="previewLab"
          :disabled="lab.status !== 'ready'"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <path d="M8 12s2-4 4-4 4 4 4 4-2 4-4 4z"/>
          </svg>
          预览
        </EduButton>

        <EduButton
          variant="text"
          size="small"
          @click="editLab"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          编辑
        </EduButton>

        <EduButton
          variant="text"
          size="small"
          @click="duplicateLab"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          复制
        </EduButton>

        <!-- 更多操作下拉菜单 -->
        <div class="more-actions" ref="moreActionsRef">
          <EduButton
            variant="text"
            size="small"
            @click="toggleMoreActions"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="1"/>
              <circle cx="12" cy="5" r="1"/>
              <circle cx="12" cy="19" r="1"/>
            </svg>
          </EduButton>

          <div v-if="showMoreActions" class="more-actions-dropdown">
            <button type="button" class="dropdown-item" @click="exportLab">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              导出
            </button>

            <button type="button" class="dropdown-item" @click="shareLab">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="18" cy="5" r="3"/>
                <circle cx="6" cy="12" r="3"/>
                <circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              分享
            </button>

            <div class="dropdown-divider"></div>

            <button type="button" class="dropdown-item dropdown-item--danger" @click="deleteLab">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              删除
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { EduButton } from '@reopeninnolab/ui-kit'
import type { LabTemplate } from '@/api/lab'

// Props
interface Props {
  lab: LabTemplate
  selected?: boolean
}

// Emits
interface Emits {
  (e: 'select', lab: LabTemplate): void
  (e: 'preview', lab: LabTemplate): void
  (e: 'edit', lab: LabTemplate): void
  (e: 'duplicate', lab: LabTemplate): void
  (e: 'delete', lab: LabTemplate): void
  (e: 'export', lab: LabTemplate): void
  (e: 'share', lab: LabTemplate): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const router = useRouter()

// Refs
const moreActionsRef = ref<HTMLElement>()
const showMoreActions = ref(false)
const thumbnailError = ref(false)

// Methods
const getLabTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    jupyter: 'Jupyter',
    python: 'Python',
    r: 'R语言',
    markdown: 'Markdown'
  }
  return labels[type] || type
}

const getDifficultyLabel = (level: string): string => {
  const labels: Record<string, string> = {
    beginner: '入门',
    intermediate: '中级',
    advanced: '高级',
    expert: '专家'
  }
  return labels[level] || level
}

const getGradeBandLabel = (gradeBand: string): string => {
  const labels: Record<string, string> = {
    primary: '小学',
    middle: '初中',
    high: '高中',
    university: '大学'
  }
  return labels[gradeBand] || gradeBand
}

const getStatusClass = (status: string): string => {
  const classes: Record<string, string> = {
    ready: 'status-dot--success',
    processing: 'status-dot--warning',
    preview_failed: 'status-dot--error'
  }
  return classes[status] || 'status-dot--default'
}

const getStatusText = (status: string): string => {
  const texts: Record<string, string> = {
    ready: '就绪',
    processing: '处理中',
    preview_failed: '预览失败'
  }
  return texts[status] || status
}

const getAuthorInitials = (authorId: string): string => {
  // 这是一个简化实现，实际应该从用户信息获取
  return authorId.slice(0, 2).toUpperCase()
}

const getAuthorName = (authorId: string): string => {
  // 这是一个简化实现，实际应该从用户信息获取
  return `用户 ${authorId.slice(-6)}`
}

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return '今天'
  } else if (diffDays === 1) {
    return '昨天'
  } else if (diffDays < 7) {
    return `${diffDays} 天前`
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} 周前`
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return `${months} 个月前`
  } else {
    const years = Math.floor(diffDays / 365)
    return `${years} 年前`
  }
}

const handleImageError = () => {
  thumbnailError.value = true
}

const toggleMoreActions = () => {
  showMoreActions.value = !showMoreActions.value
}

const closeMoreActions = () => {
  showMoreActions.value = false
}

// Event handlers
const previewLab = () => {
  emit('preview', props.lab)
}

const editLab = () => {
  emit('edit', props.lab)
}

const duplicateLab = () => {
  emit('duplicate', props.lab)
}

const deleteLab = () => {
  emit('delete', props.lab)
  closeMoreActions()
}

const exportLab = () => {
  emit('export', props.lab)
  closeMoreActions()
}

const shareLab = () => {
  emit('share', props.lab)
  closeMoreActions()
}

// 点击外部关闭下拉菜单
const handleClickOutside = (event: MouseEvent) => {
  if (moreActionsRef.value && !moreActionsRef.value.contains(event.target as Node)) {
    closeMoreActions()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.lab-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
  cursor: pointer;
  user-select: none;
}

.lab-card:hover {
  border-color: #6366f1;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
  transform: translateY(-2px);
}

.lab-card--selected {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.lab-card__header {
  position: relative;
  height: 160px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.lab-thumbnail {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.lab-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.7);
}

.thumbnail-placeholder svg {
  width: 48px;
  height: 48px;
}

.lab-type-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 500;
  backdrop-filter: blur(10px);
}

.lab-status {
  position: absolute;
  top: 12px;
  right: 12px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #9ca3af;
}

.status-dot--success {
  background: #10b981;
}

.status-dot--warning {
  background: #f59e0b;
}

.status-dot--error {
  background: #ef4444;
}

.lab-card__content {
  padding: 1.5rem;
}

.lab-title {
  margin: 0 0 0.75rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.lab-description {
  margin: 0 0 1rem 0;
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.lab-metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.metadata-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #6b7280;
  font-size: 0.75rem;
}

.metadata-item svg {
  width: 14px;
  height: 14px;
}

.lab-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tag {
  background: #f3f4f6;
  color: #374151;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.tag--more {
  background: #e5e7eb;
  color: #6b7280;
}

.lab-card__footer {
  padding: 0 1.5rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid #f3f4f6;
  padding-top: 1rem;
}

.lab-author {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.author-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #6366f1;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
}

.author-info {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
}

.created-time {
  font-size: 0.75rem;
  color: #6b7280;
}

.lab-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.more-actions {
  position: relative;
}

.more-actions-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  min-width: 160px;
  z-index: 50;
  padding: 0.5rem 0;
  margin-top: 0.25rem;
}

.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  text-align: left;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.dropdown-item:hover {
  background-color: #f9fafb;
}

.dropdown-item svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.dropdown-item--danger {
  color: #ef4444;
}

.dropdown-item--danger:hover {
  background-color: #fef2f2;
}

.dropdown-divider {
  height: 1px;
  background-color: #e5e7eb;
  margin: 0.5rem 0;
}
</style>