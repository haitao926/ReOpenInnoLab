<template>
  <div class="resource-list">
    <div class="page-header">
      <el-row :gutter="16" justify="space-between">
        <el-col :span="8">
          <el-input
            v-model="searchQuery"
            placeholder="搜索资源..."
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="typeFilter" placeholder="资源类型" clearable @change="handleFilter">
            <el-option label="全部" value="" />
            <el-option label="文档" value="document" />
            <el-option label="视频" value="video" />
            <el-option label="音频" value="audio" />
            <el-option label="图片" value="image" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-col>
        <el-col :span="12" style="text-align: right;">
          <el-button type="primary" @click="handleUpload">
            <el-icon><Upload /></el-icon>
            上传资源
          </el-button>
        </el-col>
      </el-row>
    </div>

    <el-table
      v-loading="loading"
      :data="filteredResources"
      style="width: 100%"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="资源名称" min-width="200" />
      <el-table-column prop="type" label="类型" width="100">
        <template #default="{ row }">
          <el-icon :class="`type-icon type-${row.type}`">
            <component :is="getTypeIcon(row.type)" />
          </el-icon>
          {{ getTypeText(row.type) }}
        </template>
      </el-table-column>
      <el-table-column prop="size" label="大小" width="120">
        <template #default="{ row }">
          {{ formatFileSize(row.size) }}
        </template>
      </el-table-column>
      <el-table-column prop="uploadedBy" label="上传者" width="120" />
      <el-table-column prop="downloads" label="下载次数" width="100" />
      <el-table-column prop="uploadedAt" label="上传时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.uploadedAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="handleDownload(row)">
            下载
          </el-button>
          <el-button type="warning" size="small" @click="handleEdit(row)">
            编辑
          </el-button>
          <el-button type="danger" size="small" @click="handleDelete(row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <ResourceUploadDialog
      v-model="uploadDialogVisible"
      @success="handleUploadSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Upload, Document, VideoPlay, Headphones, Picture, Files } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/date'
import ResourceUploadDialog from '@/components/resource/ResourceUploadDialog.vue'

interface Resource {
  id: string
  name: string
  type: 'document' | 'video' | 'audio' | 'image' | 'other'
  size: number
  uploadedBy: string
  downloads: number
  uploadedAt: string
  url: string
}

const searchQuery = ref('')
const typeFilter = ref('')
const loading = ref(false)
const resources = ref<Resource[]>([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const uploadDialogVisible = ref(false)

const filteredResources = computed(() => {
  let filtered = resources.value

  if (searchQuery.value) {
    filtered = filtered.filter(resource =>
      resource.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  if (typeFilter.value) {
    filtered = filtered.filter(resource => resource.type === typeFilter.value)
  }

  return filtered
})

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'document': return Document
    case 'video': return VideoPlay
    case 'audio': return Headphones
    case 'image': return Picture
    default: return Files
  }
}

const getTypeText = (type: string) => {
  switch (type) {
    case 'document': return '文档'
    case 'video': return '视频'
    case 'audio': return '音频'
    case 'image': return '图片'
    default: return '其他'
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const loadResources = async () => {
  loading.value = true
  try {
    // Mock data - replace with actual API call
    resources.value = [
      {
        id: '1',
        name: '教学课件.pptx',
        type: 'document',
        size: 2048576,
        uploadedBy: '张老师',
        downloads: 15,
        uploadedAt: '2024-01-15T10:00:00Z',
        url: '/resources/1.pptx'
      },
      {
        id: '2',
        name: '实验演示.mp4',
        type: 'video',
        size: 52428800,
        uploadedBy: '李老师',
        downloads: 8,
        uploadedAt: '2024-01-14T14:30:00Z',
        url: '/resources/2.mp4'
      }
    ]
    total.value = resources.value.length
  } catch (error) {
    ElMessage.error('加载资源列表失败')
    console.error('Failed to load resources:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleFilter = () => {
  currentPage.value = 1
}

const handleUpload = () => {
  uploadDialogVisible.value = true
}

const handleDownload = (resource: Resource) => {
  // Mock download - replace with actual download logic
  ElMessage.success(`开始下载: ${resource.name}`)
  resource.downloads++
}

const handleEdit = (resource: Resource) => {
  ElMessage.info(`编辑资源: ${resource.name}`)
}

const handleDelete = async (resource: Resource) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除资源 "${resource.name}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    // Mock delete - replace with actual API call
    const index = resources.value.findIndex(r => r.id === resource.id)
    if (index > -1) {
      resources.value.splice(index, 1)
      total.value--
    }

    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleUploadSuccess = () => {
  uploadDialogVisible.value = false
  loadResources()
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  loadResources()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  loadResources()
}

onMounted(() => {
  loadResources()
})
</script>

<style scoped lang="scss">
.resource-list {
  .page-header {
    margin-bottom: 24px;
  }

  .type-icon {
    margin-right: 8px;

    &.type-document { color: #409eff; }
    &.type-video { color: #67c23a; }
    &.type-audio { color: #e6a23c; }
    &.type-image { color: #f56c6c; }
    &.type-other { color: #909399; }
  }

  .pagination {
    margin-top: 24px;
    text-align: right;
  }
}
</style>