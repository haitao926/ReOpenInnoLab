<template>
  <div class="quota-management">
    <div class="page-header">
      <el-row :gutter="16" justify="space-between">
        <el-col :span="8">
          <el-input
            v-model="searchQuery"
            placeholder="搜索配额..."
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="typeFilter" placeholder="配额类型" clearable @change="handleFilter">
            <el-option label="全部" value="" />
            <el-option label="存储空间" value="storage" />
            <el-option label="API调用" value="api" />
            <el-option label="用户数量" value="users" />
            <el-option label="带宽" value="bandwidth" />
          </el-select>
        </el-col>
        <el-col :span="12" style="text-align: right;">
          <el-button type="primary" @click="handleAddQuota">
            <el-icon><Plus /></el-icon>
            新增配额
          </el-button>
        </el-col>
      </el-row>
    </div>

    <el-table
      v-loading="loading"
      :data="filteredQuotas"
      style="width: 100%"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="tenant" label="租户" width="150" />
      <el-table-column prop="type" label="类型" width="120">
        <template #default="{ row }">
          <el-tag :type="getTypeColor(row.type)">
            {{ getTypeText(row.type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="limit" label="限制" width="120">
        <template #default="{ row }">
          {{ formatQuotaValue(row.type, row.limit) }}
        </template>
      </el-table-column>
      <el-table-column prop="used" label="已使用" width="120">
        <template #default="{ row }">
          {{ formatQuotaValue(row.type, row.used) }}
        </template>
      </el-table-column>
      <el-table-column label="使用率" width="150">
        <template #default="{ row }">
          <el-progress
            :percentage="getUsagePercentage(row.used, row.limit)"
            :status="getUsageStatus(getUsagePercentage(row.used, row.limit))"
          />
        </template>
      </el-table-column>
      <el-table-column prop="period" label="周期" width="100">
        <template #default="{ row }">
          {{ getPeriodText(row.period) }}
        </template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.updatedAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="handleEdit(row)">
            编辑
          </el-button>
          <el-button type="warning" size="small" @click="handleReset(row)">
            重置
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

    <QuotaFormDialog
      v-model="dialogVisible"
      :quota="selectedQuota"
      @success="handleFormSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/date'
import QuotaFormDialog from '@/components/quota/QuotaFormDialog.vue'

interface Quota {
  id: string
  tenant: string
  type: 'storage' | 'api' | 'users' | 'bandwidth'
  limit: number
  used: number
  period: 'daily' | 'monthly' | 'yearly'
  updatedAt: string
}

const searchQuery = ref('')
const typeFilter = ref('')
const loading = ref(false)
const quotas = ref<Quota[]>([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const dialogVisible = ref(false)
const selectedQuota = ref<Quota | null>(null)

const filteredQuotas = computed(() => {
  let filtered = quotas.value

  if (searchQuery.value) {
    filtered = filtered.filter(quota =>
      quota.tenant.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  if (typeFilter.value) {
    filtered = filtered.filter(quota => quota.type === typeFilter.value)
  }

  return filtered
})

const getTypeColor = (type: string) => {
  switch (type) {
    case 'storage': return 'primary'
    case 'api': return 'success'
    case 'users': return 'warning'
    case 'bandwidth': return 'danger'
    default: return 'info'
  }
}

const getTypeText = (type: string) => {
  switch (type) {
    case 'storage': return '存储空间'
    case 'api': return 'API调用'
    case 'users': return '用户数量'
    case 'bandwidth': return '带宽'
    default: return '未知'
  }
}

const formatQuotaValue = (type: string, value: number) => {
  switch (type) {
    case 'storage':
      return value >= 1024 * 1024 * 1024
        ? `${(value / (1024 * 1024 * 1024)).toFixed(1)}GB`
        : `${(value / (1024 * 1024)).toFixed(1)}MB`
    case 'api':
      return value >= 1000000
        ? `${(value / 1000000).toFixed(1)}M`
        : value >= 1000
        ? `${(value / 1000).toFixed(1)}K`
        : value.toString()
    case 'users':
      return `${value}人`
    case 'bandwidth':
      return value >= 1024 * 1024
        ? `${(value / (1024 * 1024)).toFixed(1)}GB`
        : `${(value / 1024).toFixed(1)}MB`
    default:
      return value.toString()
  }
}

const getUsagePercentage = (used: number, limit: number) => {
  return Math.round((used / limit) * 100)
}

const getUsageStatus = (percentage: number) => {
  if (percentage >= 90) return 'exception'
  if (percentage >= 70) return 'warning'
  return 'success'
}

const getPeriodText = (period: string) => {
  switch (period) {
    case 'daily': return '每日'
    case 'monthly': return '每月'
    case 'yearly': return '每年'
    default: return '未知'
  }
}

const loadQuotas = async () => {
  loading.value = true
  try {
    // Mock data - replace with actual API call
    quotas.value = [
      {
        id: '1',
        tenant: '默认租户',
        type: 'storage',
        limit: 10737418240, // 10GB
        used: 6442450944,   // 6GB
        period: 'monthly',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: '2',
        tenant: 'VIP租户',
        type: 'api',
        limit: 1000000,
        used: 750000,
        period: 'daily',
        updatedAt: '2024-01-15T09:30:00Z'
      }
    ]
    total.value = quotas.value.length
  } catch (error) {
    ElMessage.error('加载配额列表失败')
    console.error('Failed to load quotas:', error)
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

const handleAddQuota = () => {
  selectedQuota.value = null
  dialogVisible.value = true
}

const handleEdit = (quota: Quota) => {
  selectedQuota.value = quota
  dialogVisible.value = true
}

const handleReset = async (quota: Quota) => {
  try {
    await ElMessageBox.confirm(
      `确定要重置 "${quota.tenant}" 的 ${getTypeText(quota.type)} 配额吗？`,
      '重置确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    // Mock reset - replace with actual API call
    quota.used = 0
    quota.updatedAt = new Date().toISOString()

    ElMessage.success('配额重置成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('配额重置失败')
    }
  }
}

const handleDelete = async (quota: Quota) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除此配额吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    // Mock delete - replace with actual API call
    const index = quotas.value.findIndex(q => q.id === quota.id)
    if (index > -1) {
      quotas.value.splice(index, 1)
      total.value--
    }

    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleFormSuccess = () => {
  dialogVisible.value = false
  loadQuotas()
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  loadQuotas()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  loadQuotas()
}

onMounted(() => {
  loadQuotas()
})
</script>

<style scoped lang="scss">
.quota-management {
  .page-header {
    margin-bottom: 24px;
  }

  .pagination {
    margin-top: 24px;
    text-align: right;
  }
}
</style>