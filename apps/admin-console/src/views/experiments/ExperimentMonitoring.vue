<template>
  <div class="experiment-monitoring">
    <div class="page-header">
      <el-row :gutter="16" justify="space-between">
        <el-col :span="8">
          <el-input
            v-model="searchQuery"
            placeholder="搜索实验..."
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="statusFilter" placeholder="实验状态" clearable @change="handleFilter">
            <el-option label="全部" value="" />
            <el-option label="进行中" value="running" />
            <el-option label="已完成" value="completed" />
            <el-option label="失败" value="failed" />
            <el-option label="等待中" value="pending" />
          </el-select>
        </el-col>
        <el-col :span="12" style="text-align: right;">
          <el-button type="primary" @click="refreshData">
            <el-icon><Refresh /></el-icon>
            刷新数据
          </el-button>
        </el-col>
      </el-row>
    </div>

    <el-row :gutter="24" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ stats.running }}</div>
            <div class="stat-label">进行中</div>
          </div>
          <el-icon class="stat-icon running"><Loading /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ stats.completed }}</div>
            <div class="stat-label">已完成</div>
          </div>
          <el-icon class="stat-icon completed"><CircleCheck /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ stats.failed }}</div>
            <div class="stat-label">失败</div>
          </div>
          <el-icon class="stat-icon failed"><CircleClose /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ stats.avgRuntime }}s</div>
            <div class="stat-label">平均运行时间</div>
          </div>
          <el-icon class="stat-icon runtime"><Timer /></el-icon>
        </el-card>
      </el-col>
    </el-row>

    <el-table
      v-loading="loading"
      :data="filteredExperiments"
      style="width: 100%"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="实验名称" min-width="200" />
      <el-table-column prop="user" label="用户" width="120" />
      <el-table-column prop="type" label="类型" width="120" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="progress" label="进度" width="120">
        <template #default="{ row }">
          <el-progress :percentage="row.progress" :status="getProgressStatus(row.status)" />
        </template>
      </el-table-column>
      <el-table-column prop="startTime" label="开始时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.startTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="runtime" label="运行时间" width="100">
        <template #default="{ row }">
          {{ formatRuntime(row.runtime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="handleView(row)">
            查看
          </el-button>
          <el-button v-if="row.status === 'running'" type="warning" size="small" @click="handleStop(row)">
            停止
          </el-button>
          <el-button v-if="row.status === 'failed'" type="info" size="small" @click="handleRestart(row)">
            重启
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Loading, CircleCheck, CircleClose, Timer } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/date'

interface Experiment {
  id: string
  name: string
  user: string
  type: string
  status: 'running' | 'completed' | 'failed' | 'pending'
  progress: number
  startTime: string
  endTime?: string
  runtime: number
}

interface Stats {
  running: number
  completed: number
  failed: number
  avgRuntime: number
}

const searchQuery = ref('')
const statusFilter = ref('')
const loading = ref(false)
const experiments = ref<Experiment[]>([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const stats = ref<Stats>({
  running: 0,
  completed: 0,
  failed: 0,
  avgRuntime: 0
})

const filteredExperiments = computed(() => {
  let filtered = experiments.value

  if (searchQuery.value) {
    filtered = filtered.filter(experiment =>
      experiment.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      experiment.user.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  if (statusFilter.value) {
    filtered = filtered.filter(experiment => experiment.status === statusFilter.value)
  }

  return filtered
})

const getStatusType = (status: string) => {
  switch (status) {
    case 'running': return 'primary'
    case 'completed': return 'success'
    case 'failed': return 'danger'
    case 'pending': return 'warning'
    default: return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'running': return '进行中'
    case 'completed': return '已完成'
    case 'failed': return '失败'
    case 'pending': return '等待中'
    default: return '未知'
  }
}

const getProgressStatus = (status: string) => {
  switch (status) {
    case 'completed': return 'success'
    case 'failed': return 'exception'
    default: return undefined
  }
}

const formatRuntime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`
}

const loadData = async () => {
  loading.value = true
  try {
    // Mock data - replace with actual API call
    experiments.value = [
      {
        id: '1',
        name: '机器学习模型训练',
        user: '张三',
        type: 'AI训练',
        status: 'running',
        progress: 75,
        startTime: '2024-01-15T10:00:00Z',
        runtime: 185
      },
      {
        id: '2',
        name: '化学反应模拟',
        user: '李四',
        type: '科学计算',
        status: 'completed',
        progress: 100,
        startTime: '2024-01-15T09:30:00Z',
        endTime: '2024-01-15T10:15:00Z',
        runtime: 2700
      }
    ]
    total.value = experiments.value.length

    // Update stats
    stats.value = {
      running: experiments.value.filter(e => e.status === 'running').length,
      completed: experiments.value.filter(e => e.status === 'completed').length,
      failed: experiments.value.filter(e => e.status === 'failed').length,
      avgRuntime: Math.round(experiments.value.reduce((sum, e) => sum + e.runtime, 0) / experiments.value.length)
    }
  } catch (error) {
    ElMessage.error('加载实验数据失败')
    console.error('Failed to load experiment data:', error)
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  loadData()
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleFilter = () => {
  currentPage.value = 1
}

const handleView = (experiment: Experiment) => {
  ElMessage.info(`查看实验详情: ${experiment.name}`)
  // Implement view logic
}

const handleStop = async (experiment: Experiment) => {
  try {
    await ElMessageBox.confirm(
      `确定要停止实验 "${experiment.name}" 吗？`,
      '停止确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    // Mock stop experiment - replace with actual API call
    experiment.status = 'failed'
    experiment.endTime = new Date().toISOString()

    ElMessage.success('实验已停止')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('停止实验失败')
    }
  }
}

const handleRestart = (experiment: Experiment) => {
  ElMessage.info(`重启实验: ${experiment.name}`)
  // Implement restart logic
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  loadData()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  loadData()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.experiment-monitoring {
  .page-header {
    margin-bottom: 24px;
  }

  .stats-row {
    margin-bottom: 24px;

    .stat-card {
      position: relative;
      overflow: hidden;

      .stat-content {
        position: relative;
        z-index: 2;

        .stat-number {
          font-size: 32px;
          font-weight: bold;
          color: #303133;
          line-height: 1;
        }

        .stat-label {
          font-size: 14px;
          color: #909399;
          margin-top: 8px;
        }
      }

      .stat-icon {
        position: absolute;
        right: 16px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 48px;
        opacity: 0.1;

        &.running { color: var(--edu-primary-500); }
        &.completed { color: var(--edu-color-success-default); }
        &.failed { color: #f56c6c; }
        &.runtime { color: var(--edu-color-warning-default); }
      }
    }
  }

  .pagination {
    margin-top: 24px;
    text-align: right;
  }
}
</style>