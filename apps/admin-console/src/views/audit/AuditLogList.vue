<template>
  <div class="audit-log-list">
    <div class="page-header">
      <el-row :gutter="16" justify="space-between">
        <el-col :span="8">
          <el-input
            v-model="searchQuery"
            placeholder="搜索审计日志..."
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="actionFilter" placeholder="操作类型" clearable @change="handleFilter">
            <el-option label="全部" value="" />
            <el-option label="登录" value="login" />
            <el-option label="创建" value="create" />
            <el-option label="更新" value="update" />
            <el-option label="删除" value="delete" />
          </el-select>
        </el-col>
        <el-col :span="12" style="text-align: right;">
          <el-button type="primary" @click="handleExport">
            <el-icon><Download /></el-icon>
            导出日志
          </el-button>
        </el-col>
      </el-row>
    </div>

    <el-table
      v-loading="loading"
      :data="filteredLogs"
      style="width: 100%"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="user" label="用户" width="120" />
      <el-table-column prop="action" label="操作" width="100">
        <template #default="{ row }">
          <el-tag :type="getActionType(row.action)">
            {{ getActionText(row.action) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="resource" label="资源" width="150" />
      <el-table-column prop="ip" label="IP地址" width="120" />
      <el-table-column prop="userAgent" label="用户代理" min-width="200" show-overflow-tooltip />
      <el-table-column prop="timestamp" label="时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.timestamp) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="handleViewDetails(row)">
            详情
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

    <AuditLogDetailDialog
      v-model="detailDialogVisible"
      :log="selectedLog"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Download } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/date'
import AuditLogDetailDialog from '@/components/audit/AuditLogDetailDialog.vue'

interface AuditLog {
  id: string
  user: string
  action: 'login' | 'create' | 'update' | 'delete'
  resource: string
  ip: string
  userAgent: string
  timestamp: string
  details: any
}

const searchQuery = ref('')
const actionFilter = ref('')
const loading = ref(false)
const logs = ref<AuditLog[]>([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const detailDialogVisible = ref(false)
const selectedLog = ref<AuditLog | null>(null)

const filteredLogs = computed(() => {
  let filtered = logs.value

  if (searchQuery.value) {
    filtered = filtered.filter(log =>
      log.user.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  if (actionFilter.value) {
    filtered = filtered.filter(log => log.action === actionFilter.value)
  }

  return filtered
})

const getActionType = (action: string) => {
  switch (action) {
    case 'login': return 'success'
    case 'create': return 'primary'
    case 'update': return 'warning'
    case 'delete': return 'danger'
    default: return 'info'
  }
}

const getActionText = (action: string) => {
  switch (action) {
    case 'login': return '登录'
    case 'create': return '创建'
    case 'update': return '更新'
    case 'delete': return '删除'
    default: return '未知'
  }
}

const loadLogs = async () => {
  loading.value = true
  try {
    // Mock data - replace with actual API call
    logs.value = [
      {
        id: '1',
        user: 'admin',
        action: 'login',
        resource: '系统',
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: '2024-01-15T10:00:00Z',
        details: { success: true }
      },
      {
        id: '2',
        user: '张老师',
        action: 'create',
        resource: '课程',
        ip: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        timestamp: '2024-01-15T10:15:00Z',
        details: { courseId: '123' }
      }
    ]
    total.value = logs.value.length
  } catch (error) {
    ElMessage.error('加载审计日志失败')
    console.error('Failed to load audit logs:', error)
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

const handleViewDetails = (log: AuditLog) => {
  selectedLog.value = log
  detailDialogVisible.value = true
}

const handleExport = () => {
  ElMessage.success('日志导出中...')
  // Implement export logic
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  loadLogs()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  loadLogs()
}

onMounted(() => {
  loadLogs()
})
</script>

<style scoped lang="scss">
.audit-log-list {
  .page-header {
    margin-bottom: 24px;
  }

  .pagination {
    margin-top: 24px;
    text-align: right;
  }
}
</style>