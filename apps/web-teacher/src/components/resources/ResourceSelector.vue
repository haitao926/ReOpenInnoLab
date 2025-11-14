<template>
  <el-dialog
    v-model="visible"
    title="选择教学资源"
    width="80%"
    :before-close="handleClose"
    destroy-on-close
  >
    <div class="resource-selector">
      <div class="selector-header">
        <div class="search-bar">
          <el-input
            v-model="searchQuery"
            placeholder="搜索资源..."
            :prefix-icon="Search"
            clearable
            @input="handleSearch"
          />
        </div>

        <div class="filter-tabs">
          <el-tabs v-model="activeTab" @tab-change="handleTabChange">
            <el-tab-pane label="全部资源" name="all" />
            <el-tab-pane label="视频" name="video" />
            <el-tab-pane label="图片" name="image" />
            <el-tab-pane label="文档" name="document" />
            <el-tab-pane label="音频" name="audio" />
            <el-tab-pane label="仿真" name="simulation" />
          </el-tabs>
        </div>

        <div class="filter-controls">
          <el-select v-model="subjectFilter" placeholder="学科" clearable>
            <el-option
              v-for="subject in subjects"
              :key="subject"
              :label="subject"
              :value="subject"
            />
          </el-select>

          <el-select v-model="gradeFilter" placeholder="年级" clearable>
            <el-option
              v-for="grade in grades"
              :key="grade"
              :label="grade"
              :value="grade"
            />
          </el-select>

          <el-button @click="refreshResources">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>

      <div class="selector-content">
        <div class="resource-grid" v-loading="loading">
          <div
            v-for="resource in filteredResources"
            :key="resource.id"
            class="resource-card"
            :class="{ selected: selectedResources.has(resource.id) }"
            @click="toggleResource(resource)"
          >
            <div class="resource-preview">
              <img
                v-if="resource.type === 'image' && resource.thumbnail"
                :src="resource.thumbnail"
                :alt="resource.title"
                class="preview-image"
              />
              <div v-else class="preview-icon">
                <el-icon :size="48" :color="getResourceTypeColor(resource.type)">
                  <component :is="getResourceIcon(resource.type)" />
                </el-icon>
              </div>

              <div class="resource-overlay">
                <el-icon
                  v-if="selectedResources.has(resource.id)"
                  class="check-icon"
                  size="24"
                  color="#67C23A"
                >
                  <Check />
                </el-icon>
              </div>
            </div>

            <div class="resource-info">
              <div class="resource-title" :title="resource.title">
                {{ resource.title }}
              </div>
              <div class="resource-meta">
                <el-tag size="small" :type="getTagType(resource.type)">
                  {{ getTagLabel(resource.type) }}
                </el-tag>
                <span class="resource-duration" v-if="resource.duration">
                  {{ resource.duration }}
                </span>
              </div>
              <div class="resource-description">
                {{ resource.description }}
              </div>
            </div>
          </div>

          <div v-if="filteredResources.length === 0" class="empty-state">
            <el-empty description="暂无资源">
              <el-button type="primary" @click="openUploadDialog">
                上传资源
              </el-button>
            </el-empty>
          </div>
        </div>
      </div>

      <div class="selector-footer">
        <div class="selected-summary">
          已选择 {{ selectedResources.size }} 个资源
        </div>

        <div class="footer-actions">
          <el-button @click="handleClose">取消</el-button>
          <el-button @click="openUploadDialog" type="info">
            <el-icon><Upload /></el-icon>
            上传资源
          </el-button>
          <el-button type="primary" @click="handleConfirm" :disabled="selectedResources.size === 0">
            确认选择 ({{ selectedResources.size }})
          </el-button>
        </div>
      </div>
    </div>

    <!-- 上传对话框 -->
    <ResourceUpload
      v-model="uploadDialogVisible"
      @success="handleUploadSuccess"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search, Refresh, Check, Upload,
  VideoPlay, Picture, DocumentText, Headphones, Monitor
} from '@element-plus/icons-vue'

interface Resource {
  id: string
  title: string
  description: string
  type: 'video' | 'image' | 'document' | 'audio' | 'simulation'
  url: string
  thumbnail?: string
  duration?: string
  size?: number
  subject?: string
  grade?: string
  tags?: string[]
  createdAt: string
}

interface Props {
  modelValue: boolean
  moduleKey?: string
  multiple?: boolean
  maxSelection?: number
}

const props = withDefaults(defineProps<Props>(), {
  multiple: true,
  maxSelection: 20
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': [resources: Resource[]]
}>()

// 状态
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const loading = ref(false)
const searchQuery = ref('')
const activeTab = ref('all')
const subjectFilter = ref('')
const gradeFilter = ref('')
const selectedResources = ref(new Set<string>())
const uploadDialogVisible = ref(false)

// 模拟资源数据
const resources = ref<Resource[]>([])

// 参考数据
const subjects = ['数学', '物理', '化学', '生物', '语文', '英语', '历史', '地理', '政治']
const grades = ['小学1年级', '小学2年级', '小学3年级', '小学4年级', '小学5年级', '小学6年级', '初中1年级', '初中2年级', '初中3年级', '高中1年级', '高中2年级', '高中3年级']

// 计算属性
const filteredResources = computed(() => {
  let result = resources.value

  // 类型筛选
  if (activeTab.value !== 'all') {
    result = result.filter(resource => resource.type === activeTab.value)
  }

  // 搜索筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(resource =>
      resource.title.toLowerCase().includes(query) ||
      resource.description.toLowerCase().includes(query) ||
      resource.tags?.some(tag => tag.toLowerCase().includes(query))
    )
  }

  // 学科筛选
  if (subjectFilter.value) {
    result = result.filter(resource => resource.subject === subjectFilter.value)
  }

  // 年级筛选
  if (gradeFilter.value) {
    result = result.filter(resource => resource.grade === gradeFilter.value)
  }

  return result
})

// 方法
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

function getTagType(type: string): string {
  const types: Record<string, string> = {
    video: 'primary',
    image: 'success',
    document: 'warning',
    audio: 'danger',
    simulation: 'info'
  }
  return types[type] || 'info'
}

function getTagLabel(type: string): string {
  const labels: Record<string, string> = {
    video: '视频',
    image: '图片',
    document: '文档',
    audio: '音频',
    simulation: '仿真'
  }
  return labels[type] || type
}

function toggleResource(resource: Resource) {
  if (selectedResources.value.has(resource.id)) {
    selectedResources.value.delete(resource.id)
  } else {
    if (!props.multiple) {
      selectedResources.value.clear()
    }
    if (selectedResources.value.size < props.maxSelection) {
      selectedResources.value.add(resource.id)
    } else {
      ElMessage.warning(`最多只能选择 ${props.maxSelection} 个资源`)
    }
  }
}

function handleSearch() {
  // 搜索逻辑已在计算属性中处理
}

function handleTabChange() {
  // 标签切换逻辑已在计算属性中处理
}

function refreshResources() {
  loadResources()
}

function openUploadDialog() {
  uploadDialogVisible.value = true
}

function handleClose() {
  visible.value = false
  selectedResources.value.clear()
}

function handleConfirm() {
  const selected = resources.value.filter(resource =>
    selectedResources.value.has(resource.id)
  )
  emit('confirm', selected)
  handleClose()
}

function handleUploadSuccess() {
  ElMessage.success('资源上传成功')
  loadResources()
}

// 加载资源数据
function loadResources() {
  loading.value = true

  // 模拟API调用
  setTimeout(() => {
    resources.value = generateMockResources()
    loading.value = false
  }, 500)
}

// 生成模拟资源数据
function generateMockResources(): Resource[] {
  const mockResources: Resource[] = []

  // 视频资源
  for (let i = 1; i <= 8; i++) {
    mockResources.push({
      id: `video-${i}`,
      title: `教学视频 ${i}`,
      description: `这是一个教学视频，用于讲解相关知识点`,
      type: 'video',
      url: `https://example.com/video-${i}.mp4`,
      thumbnail: `https://picsum.photos/200/150?random=${i}`,
      duration: `${5 + i}分钟`,
      size: 1024 * 1024 * (20 + i * 5),
      subject: subjects[i % subjects.length],
      grade: grades[i % grades.length],
      tags: ['教学', '视频'],
      createdAt: new Date().toISOString()
    })
  }

  // 图片资源
  for (let i = 1; i <= 6; i++) {
    mockResources.push({
      id: `image-${i}`,
      title: `教学图片 ${i}`,
      description: `教学用的插图或图表`,
      type: 'image',
      url: `https://picsum.photos/400/300?random=${i + 20}`,
      thumbnail: `https://picsum.photos/200/150?random=${i + 20}`,
      size: 1024 * (100 + i * 50),
      subject: subjects[(i + 2) % subjects.length],
      grade: grades[(i + 2) % grades.length],
      tags: ['图片', '插图'],
      createdAt: new Date().toISOString()
    })
  }

  // 文档资源
  for (let i = 1; i <= 5; i++) {
    mockResources.push({
      id: `document-${i}`,
      title: `教学文档 ${i}`,
      description: `课程讲义、练习册等文档资料`,
      type: 'document',
      url: `https://example.com/document-${i}.pdf`,
      size: 1024 * 1024 * (2 + i),
      subject: subjects[(i + 4) % subjects.length],
      grade: grades[(i + 4) % grades.length],
      tags: ['文档', '讲义'],
      createdAt: new Date().toISOString()
    })
  }

  // 音频资源
  for (let i = 1; i <= 4; i++) {
    mockResources.push({
      id: `audio-${i}`,
      title: `教学音频 ${i}`,
      description: `英语听力、音乐等音频资料`,
      type: 'audio',
      url: `https://example.com/audio-${i}.mp3`,
      duration: `${3 + i}分钟`,
      size: 1024 * 1024 * (5 + i * 2),
      subject: subjects[(i + 6) % subjects.length],
      grade: grades[(i + 6) % grades.length],
      tags: ['音频', '听力'],
      createdAt: new Date().toISOString()
    })
  }

  // 仿真资源
  for (let i = 1; i <= 3; i++) {
    mockResources.push({
      id: `simulation-${i}`,
      title: `虚拟实验 ${i}`,
      description: `交互式虚拟实验和仿真`,
      type: 'simulation',
      url: `https://example.com/simulation-${i}.html`,
      thumbnail: `https://picsum.photos/200/150?random=${i + 40}`,
      duration: `${10 + i}分钟`,
      subject: subjects[(i + 8) % subjects.length],
      grade: grades[(i + 8) % grades.length],
      tags: ['仿真', '实验'],
      createdAt: new Date().toISOString()
    })
  }

  return mockResources
}

// 监听对话框打开
watch(visible, (newVal) => {
  if (newVal) {
    loadResources()
    selectedResources.value.clear()
  }
})

// 生命周期
onMounted(() => {
  loadResources()
})
</script>

<style scoped>
.resource-selector {
  display: flex;
  flex-direction: column;
  height: 70vh;
}

.selector-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.search-bar {
  max-width: 300px;
}

.filter-controls {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

.selector-content {
  flex: 1;
  overflow: hidden;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-md);
  height: 100%;
  overflow-y: auto;
  padding: var(--spacing-sm);
}

.resource-card {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.resource-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.resource-card.selected {
  border-color: var(--color-success);
  box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.2);
}

.resource-preview {
  position: relative;
  width: 100%;
  height: 120px;
  overflow: hidden;
  background: var(--color-background-light);
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.resource-overlay {
  position: absolute;
  top: 0;
  right: 0;
  padding: var(--spacing-sm);
}

.check-icon {
  background: white;
  border-radius: 50%;
  padding: 2px;
}

.resource-info {
  padding: var(--spacing-md);
}

.resource-title {
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.resource-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
}

.resource-duration {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.resource-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-regular);
  line-height: 1.4;
  max-height: 2.8em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
}

.selector-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
  margin-top: var(--spacing-md);
}

.footer-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.selected-summary {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .resource-selector {
    height: 60vh;
  }

  .selector-header {
    gap: var(--spacing-sm);
  }

  .filter-controls {
    flex-wrap: wrap;
  }

  .resource-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: var(--spacing-sm);
  }

  .selector-footer {
    flex-direction: column;
    gap: var(--spacing-md);
    align-items: stretch;
  }

  .footer-actions {
    justify-content: center;
  }
}
</style>