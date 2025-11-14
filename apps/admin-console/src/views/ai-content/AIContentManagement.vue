<template>
  <div class="ai-content-management">
    <div class="page-header">
      <el-row :gutter="16" justify="space-between">
        <el-col :span="8">
          <el-input
            v-model="searchQuery"
            placeholder="搜索AI内容..."
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="statusFilter" placeholder="审核状态" clearable @change="handleFilter">
            <el-option label="全部" value="" />
            <el-option label="待审核" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已拒绝" value="rejected" />
            <el-option label="需修改" value="needs_revision" />
          </el-select>
        </el-col>
        <el-col :span="12" style="text-align: right;">
          <el-button type="primary" @click="handleBatchReview" :disabled="selectedItems.length === 0">
            批量审核
          </el-button>
          <el-button type="success" @click="handleGenerateReport">
            <el-icon><Document /></el-icon>
            生成报告
          </el-button>
        </el-col>
      </el-row>
    </div>

    <el-table
      v-loading="loading"
      :data="filteredContent"
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="title" label="内容标题" min-width="200" />
      <el-table-column prop="type" label="内容类型" width="120" />
      <el-table-column prop="author" label="创建者" width="120" />
      <el-table-column prop="riskScore" label="风险评分" width="100">
        <template #default="{ row }">
          <el-tag :type="getRiskType(row.riskScore)">
            {{ row.riskScore }}/100
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="审核状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="handleView(row)">
            查看
          </el-button>
          <el-button
            :type="row.status === 'approved' ? 'warning' : 'success'"
            size="small"
            @click="handleReview(row)"
          >
            {{ row.status === 'approved' ? '重新审核' : '审核' }}
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

    <ContentReviewDialog
      v-model="reviewDialogVisible"
      :content="selectedContent"
      @success="handleReviewSuccess"
    />

    <BatchReviewDialog
      v-model="batchReviewDialogVisible"
      :contents="selectedItems"
      @success="handleBatchReviewSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Document } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/date'
import ContentReviewDialog from '@/components/ai-content/ContentReviewDialog.vue'
import BatchReviewDialog from '@/components/ai-content/BatchReviewDialog.vue'

interface AIContent {
  id: string
  title: string
  type: string
  author: string
  riskScore: number
  status: 'pending' | 'approved' | 'rejected' | 'needs_revision'
  content: string
  createdAt: string
  updatedAt: string
}

const searchQuery = ref('')
const statusFilter = ref('')
const loading = ref(false)
const contents = ref<AIContent[]>([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const selectedItems = ref<AIContent[]>([])
const reviewDialogVisible = ref(false)
const batchReviewDialogVisible = ref(false)
const selectedContent = ref<AIContent | null>(null)

const filteredContent = computed(() => {
  let filtered = contents.value

  if (searchQuery.value) {
    filtered = filtered.filter(content =>
      content.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      content.author.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  if (statusFilter.value) {
    filtered = filtered.filter(content => content.status === statusFilter.value)
  }

  return filtered
})

const getRiskType = (score: number) => {
  if (score >= 80) return 'danger'
  if (score >= 60) return 'warning'
  if (score >= 40) return 'info'
  return 'success'
}

const getStatusType = (status: string) => {
  switch (status) {
    case 'approved': return 'success'
    case 'rejected': return 'danger'
    case 'needs_revision': return 'warning'
    case 'pending': return 'info'
    default: return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'approved': return '已通过'
    case 'rejected': return '已拒绝'
    case 'needs_revision': return '需修改'
    case 'pending': return '待审核'
    default: return '未知'
  }
}

const loadContent = async () => {
  loading.value = true
  try {
    // Mock data - replace with actual API call
    contents.value = [
      {
        id: '1',
        title: '人工智能教学课件',
        type: '课件',
        author: '张老师',
        riskScore: 25,
        status: 'approved',
        content: '这是一个关于人工智能的教学课件...',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-16T09:30:00Z'
      },
      {
        id: '2',
        title: '机器学习实验指导',
        type: '实验指导',
        author: '李老师',
        riskScore: 45,
        status: 'pending',
        content: '机器学习实验的详细指导...',
        createdAt: '2024-01-14T14:30:00Z',
        updatedAt: '2024-01-14T14:30:00Z'
      }
    ]
    total.value = contents.value.length
  } catch (error) {
    ElMessage.error('加载AI内容失败')
    console.error('Failed to load AI content:', error)
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

const handleSelectionChange = (selection: AIContent[]) => {
  selectedItems.value = selection
}

const handleView = (content: AIContent) => {
  selectedContent.value = content
  reviewDialogVisible.value = true
}

const handleReview = (content: AIContent) => {
  selectedContent.value = content
  reviewDialogVisible.value = true
}

const handleBatchReview = () => {
  if (selectedItems.value.length === 0) {
    ElMessage.warning('请选择要审核的内容')
    return
  }
  batchReviewDialogVisible.value = true
}

const handleGenerateReport = () => {
  ElMessage.success('报告生成中...')
  // Implement report generation logic
}

const handleReviewSuccess = () => {
  reviewDialogVisible.value = false
  loadContent()
}

const handleBatchReviewSuccess = () => {
  batchReviewDialogVisible.value = false
  selectedItems.value = []
  loadContent()
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  loadContent()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  loadContent()
}

onMounted(() => {
  loadContent()
})
</script>

<style scoped lang="scss">
.ai-content-management {
  .page-header {
    margin-bottom: 24px;
  }

  .pagination {
    margin-top: 24px;
    text-align: right;
  }
}
</style>