<template>
  <TeacherWorkspaceLayout
    title="资源中心"
    subtitle="统一管理校内外教学资源，快速关联课程流程"
  >
    <!-- 头部控件 -->
    <template #header-controls>
      <div class="status-switcher">
        <el-segmented v-model="resourceView" :options="viewOptions" size="large" />
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="openUploadDialog">
          <el-icon><Upload /></el-icon>
          上传资源
        </el-button>
        <el-button @click="openImportDialog">
          <el-icon><FolderOpened /></el-icon>
          批量导入
        </el-button>
      </div>
    </template>

    <!-- Summary Strip -->
    <template #summary>
      <div class="summary-metrics">
        <div class="summary-card" v-for="metric in summaryMetrics" :key="metric.id">
          <div class="summary-icon" :style="{ background: metric.gradient }">
            <el-icon><component :is="metric.icon" /></el-icon>
          </div>
          <div class="summary-content">
            <div class="summary-value">{{ metric.value }}</div>
            <div class="summary-label">{{ metric.label }}</div>
          </div>
        </div>
      </div>
    </template>

    <!-- 左侧筛选栏 -->
    <template #left>
      <div class="resource-filters">
        <div class="filter-section">
          <h4 class="filter-title">资源类型</h4>
          <div class="filter-options">
            <el-checkbox-group v-model="selectedTypes">
              <el-checkbox v-for="type in resourceTypes" :key="type.value" :label="type.label">
                {{ type.label }}
              </el-checkbox>
            </el-checkbox-group>
          </div>
        </div>

        <div class="filter-section">
          <h4 class="filter-title">学科分类</h4>
          <div class="filter-options">
            <el-radio-group v-model="selectedSubject">
              <el-radio v-for="subject in subjects" :key="subject.value" :label="subject.value">
                {{ subject.label }}
              </el-radio>
            </el-radio-group>
          </div>
        </div>

        <div class="filter-section">
          <h4 class="filter-title">资源状态</h4>
          <div class="filter-options">
            <el-select v-model="selectedStatus" placeholder="选择状态" style="width: 100%">
              <el-option v-for="status in statusOptions" :key="status.value" :label="status.label" :value="status.value" />
            </el-select>
          </div>
        </div>

        <div class="filter-section">
          <h4 class="filter-title">时间范围</h4>
          <div class="filter-options">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 100%"
            />
          </div>
        </div>
      </div>
    </template>

    <!-- 主内容区 -->
    <div class="resource-content">
      <div class="content-header">
        <div class="search-bar">
          <el-input
            v-model="searchQuery"
            placeholder="搜索资源..."
            :prefix-icon="Search"
            class="search-input"
          />
          <el-button @click="handleSearch" type="primary">
            搜索
          </el-button>
        </div>
        <div class="view-controls">
          <el-radio-group v-model="viewMode" size="small">
            <el-radio-button label="grid">网格</el-radio-button>
            <el-radio-button label="list">列表</el-radio-button>
          </el-radio-group>
          <el-dropdown @command="handleSort">
            <el-button type="text">
              排序 <el-icon><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="name">按名称</el-dropdown-item>
                <el-dropdown-item command="date">按日期</el-dropdown-item>
                <el-dropdown-item command="size">按大小</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- 资源列表 -->
      <div v-if="viewMode === 'grid'" class="resource-grid">
        <div v-for="resource in filteredResources" :key="resource.id" class="resource-card">
          <div class="card-header">
            <div class="file-icon" :class="resource.type">
              <el-icon><component :is="getFileIcon(resource.type)" /></el-icon>
            </div>
            <div class="file-menu">
              <el-dropdown @command="(cmd) => handleResourceAction(cmd, resource)">
                <el-button type="text" size="small">
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="view">查看</el-dropdown-item>
                    <el-dropdown-item command="download">下载</el-dropdown-item>
                    <el-dropdown-item command="share">分享</el-dropdown-item>
                    <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
          <div class="card-body">
            <h4 class="resource-title">{{ resource.title }}</h4>
            <p class="resource-description">{{ resource.description }}</p>
            <div class="resource-meta">
              <div class="meta-item">
                <el-icon><User /></el-icon>
                {{ resource.author }}
              </div>
              <div class="meta-item">
                <el-icon><Clock /></el-icon>
                {{ formatDate(resource.updatedAt) }}
              </div>
            </div>
            <div class="resource-tags">
              <el-tag v-for="tag in resource.tags" :key="tag" size="small" class="tag-item">
                {{ tag }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="resource-list">
        <el-table :data="filteredResources" style="width: 100%">
          <el-table-column prop="title" label="资源名称" min-width="200">
            <template #default="{ row }">
              <div class="resource-name">
                <el-icon><component :is="getFileIcon(row.type)" /></el-icon>
                <span>{{ row.title }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="类型" width="100" />
          <el-table-column prop="author" label="作者" width="120" />
          <el-table-column prop="size" label="大小" width="100">
            <template #default="{ row }">
              {{ formatFileSize(row.size) }}
            </template>
          </el-table-column>
          <el-table-column prop="updatedAt" label="更新时间" width="150">
            <template #default="{ row }">
              {{ formatDate(row.updatedAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button type="text" size="small" @click="viewResource(row)">查看</el-button>
              <el-button type="text" size="small" @click="downloadResource(row)">下载</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalResources"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 右侧推荐栏 -->
    <template #right>
      <div class="resource-sidebar">
        <SidebarTabsContainer>
          <!-- 推荐资源 -->
          <template #tab-recommendations>
            <div class="sidebar-section">
              <h4 class="sidebar-title">推荐资源</h4>
              <div class="recommendation-list">
                <div v-for="item in recommendedResources" :key="item.id" class="recommendation-item">
                  <div class="item-icon">
                    <el-icon><component :is="getFileIcon(item.type)" /></el-icon>
                  </div>
                  <div class="item-content">
                    <h5 class="item-title">{{ item.title }}</h5>
                    <p class="item-description">{{ item.description }}</p>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 引用统计 -->
          <template #tab-statistics>
            <div class="sidebar-section">
              <h4 class="sidebar-title">引用统计</h4>
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-value">{{ resourceStats.totalDownloads }}</div>
                  <div class="stat-label">总下载</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ resourceStats.totalViews }}</div>
                  <div class="stat-label">总查看</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ resourceStats.totalShares }}</div>
                  <div class="stat-label">总分享</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ resourceStats.avgRating }}</div>
                  <div class="stat-label">平均评分</div>
                </div>
              </div>
            </div>
          </template>

          <!-- 版权信息 -->
          <template #tab-copyright>
            <div class="sidebar-section">
              <h4 class="sidebar-title">版权信息</h4>
              <div class="copyright-info">
                <div class="info-item">
                  <span class="info-label">授权类型：</span>
                  <span class="info-value">教育用途</span>
                </div>
                <div class="info-item">
                  <span class="info-label">许可协议：</span>
                  <span class="info-value">CC BY-NC-SA 4.0</span>
                </div>
                <div class="info-item">
                  <span class="info-label">使用期限：</span>
                  <span class="info-value">永久有效</span>
                </div>
              </div>
            </div>
          </template>
        </SidebarTabsContainer>
      </div>
    </template>
  </TeacherWorkspaceLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Upload, FolderOpened, User, Clock, MoreFilled, ArrowDown } from '@element-plus/icons-vue'
import TeacherWorkspaceLayout from '@/components/layout/TeacherWorkspaceLayout.vue'
import SidebarTabsContainer from '@/components/layout/SidebarTabsContainer.vue'

// 响应式数据
const resourceView = ref('all')
const searchQuery = ref('')
const viewMode = ref('grid')
const currentPage = ref(1)
const pageSize = ref(20)
const selectedTypes = ref(['document', 'video', 'image', 'audio'])
const selectedSubject = ref('all')
const selectedStatus = ref('published')
const dateRange = ref<[Date, Date] | null>(null)

// 配置选项
const viewOptions = [
  { label: '全部资源', value: 'all' },
  { label: '我的资源', value: 'mine' },
  { label: '共享资源', value: 'shared' },
  { label: '收藏资源', value: 'favorites' }
]

const resourceTypes = [
  { label: '文档', value: 'document' },
  { label: '视频', value: 'video' },
  { label: '图片', value: 'image' },
  { label: '音频', value: 'audio' },
  { label: '课件', value: 'courseware' },
  { label: '试卷', value: 'exam' }
]

const subjects = [
  { label: '全部学科', value: 'all' },
  { label: '语文', value: 'chinese' },
  { label: '数学', value: 'math' },
  { label: '英语', value: 'english' },
  { label: '物理', value: 'physics' },
  { label: '化学', value: 'chemistry' },
  { label: '生物', value: 'biology' }
]

const statusOptions = [
  { label: '已发布', value: 'published' },
  { label: '草稿', value: 'draft' },
  { label: '已归档', value: 'archived' }
]

// 模拟数据
const mockResources = ref([
  {
    id: 1,
    title: '高中数学必修一课件合集',
    description: '包含必修一全部章节的PPT课件，配有习题和答案',
    type: 'courseware',
    author: '张老师',
    size: 15678912,
    updatedAt: new Date('2024-01-15'),
    tags: ['数学', '必修一', '课件'],
    downloads: 1234,
    views: 5678,
    rating: 4.8
  },
  {
    id: 2,
    title: '化学实验操作视频',
    description: '高中化学基础实验操作演示视频',
    type: 'video',
    author: '李老师',
    size: 234567890,
    updatedAt: new Date('2024-01-12'),
    tags: ['化学', '实验', '视频'],
    downloads: 890,
    views: 3456,
    rating: 4.6
  }
])

const summaryMetrics = ref([
  {
    id: 1,
    label: '总资源数',
    value: '1,234',
    icon: 'FolderOpened',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    id: 2,
    label: '本周新增',
    value: '+45',
    icon: 'Plus',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  {
    id: 3,
    label: '下载总量',
    value: '5,678',
    icon: 'Download',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  }
])

const recommendedResources = ref([
  {
    id: 1,
    title: '物理实验指导手册',
    description: '详细的高中物理实验操作步骤',
    type: 'document'
  },
  {
    id: 2,
    title: '英语听力训练材料',
    description: '高考英语听力专项训练音频',
    type: 'audio'
  }
])

const resourceStats = ref({
  totalDownloads: 5678,
  totalViews: 23456,
  totalShares: 891,
  avgRating: 4.7
})

// 计算属性
const filteredResources = computed(() => {
  let filtered = mockResources.value

  if (searchQuery.value) {
    filtered = filtered.filter(resource =>
      resource.title.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  return filtered
})

const totalResources = computed(() => filteredResources.value.length)

// 方法
const getFileIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    document: 'Document',
    video: 'VideoPlay',
    image: 'Picture',
    audio: 'Headphones',
    courseware: 'Reading',
    exam: 'EditPen'
  }
  return iconMap[type] || 'Document'
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('zh-CN').format(date)
}

const formatFileSize = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}

const openUploadDialog = () => {
  ElMessage.info('打开上传对话框')
}

const openImportDialog = () => {
  ElMessage.info('打开批量导入对话框')
}

const handleSearch = () => {
  ElMessage.success('搜索功能已执行')
}

const handleSort = (command: string) => {
  ElMessage.info(`按${command}排序`)
}

const handleResourceAction = (command: string, resource: any) => {
  ElMessage.info(`${command} 资源: ${resource.title}`)
}

const viewResource = (resource: any) => {
  ElMessage.info(`查看资源: ${resource.title}`)
}

const downloadResource = (resource: any) => {
  ElMessage.success(`开始下载: ${resource.title}`)
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

onMounted(() => {
  // 初始化数据
})
</script>

<style scoped>
.status-switcher {
  display: flex;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 12px;
  margin-left: 16px;
}

.summary-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--edu-color-white);
  border-radius: 12px;
  border: 1px solid var(--edu-border-light);
  box-shadow: var(--edu-shadow-sm);
}

.summary-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.summary-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--edu-text-primary);
}

.summary-label {
  font-size: 14px;
  color: var(--edu-text-secondary);
  margin-top: 4px;
}

.resource-filters {
  padding: 20px;
}

.filter-section {
  margin-bottom: 24px;
}

.filter-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin-bottom: 12px;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.resource-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.search-bar {
  display: flex;
  gap: 12px;
  flex: 1;
}

.search-input {
  max-width: 400px;
}

.view-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.resource-card {
  background: var(--edu-color-white);
  border-radius: 12px;
  border: 1px solid var(--edu-border-light);
  overflow: hidden;
  transition: all 0.3s ease;
}

.resource-card:hover {
  box-shadow: var(--edu-shadow-md);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--edu-border-light);
}

.file-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
}

.file-icon.document { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.file-icon.video { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.file-icon.image { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.file-icon.audio { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
.file-icon.courseware { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
.file-icon.exam { background: linear-gradient(135deg, #30cfd0 0%, #330867 100%); }

.card-body {
  padding: 16px;
}

.resource-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin-bottom: 8px;
}

.resource-description {
  font-size: 14px;
  color: var(--edu-text-secondary);
  margin-bottom: 12px;
  line-height: 1.5;
}

.resource-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.resource-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-item {
  font-size: 12px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.resource-sidebar {
  width: 100%;
  height: 100%;
}

.sidebar-section {
  padding: 16px;
}

.sidebar-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin-bottom: 12px;
}

.recommendation-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recommendation-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: var(--edu-color-background);
  border-radius: 8px;
}

.item-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.item-content {
  flex: 1;
}

.item-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin-bottom: 4px;
}

.item-description {
  font-size: 12px;
  color: var(--edu-text-secondary);
  line-height: 1.4;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stat-item {
  padding: 12px;
  background: var(--edu-color-background);
  border-radius: 8px;
  text-align: center;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--edu-primary-600);
}

.stat-label {
  font-size: 12px;
  color: var(--edu-text-secondary);
  margin-top: 4px;
}

.copyright-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.info-label {
  color: var(--edu-text-secondary);
}

.info-value {
  color: var(--edu-text-primary);
  font-weight: 500;
}

.resource-list {
  background: var(--edu-color-white);
  border-radius: 12px;
  border: 1px solid var(--edu-border-light);
  overflow: hidden;
}

.resource-name {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>