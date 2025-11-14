<template>
  <div class="policy-management">
    <div class="page-header">
      <el-row :gutter="16" justify="space-between">
        <el-col :span="8">
          <el-input
            v-model="searchQuery"
            placeholder="搜索策略..."
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="typeFilter" placeholder="策略类型" clearable @change="handleFilter">
            <el-option label="全部" value="" />
            <el-option label="安全策略" value="security" />
            <el-option label="访问控制" value="access" />
            <el-option label="数据保护" value="data" />
            <el-option label="内容过滤" value="content" />
          </el-select>
        </el-col>
        <el-col :span="12" style="text-align: right;">
          <el-button type="primary" @click="handleAddPolicy">
            <el-icon><Plus /></el-icon>
            新增策略
          </el-button>
        </el-col>
      </el-row>
    </div>

    <el-table
      v-loading="loading"
      :data="filteredPolicies"
      style="width: 100%"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="策略名称" min-width="200" />
      <el-table-column prop="type" label="类型" width="120">
        <template #default="{ row }">
          <el-tag :type="getTypeColor(row.type)">
            {{ getTypeText(row.type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-switch
            v-model="row.enabled"
            @change="handleToggleStatus(row)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="priority" label="优先级" width="100" />
      <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
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
          <el-button type="info" size="small" @click="handleView(row)">
            查看
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

    <PolicyFormDialog
      v-model="dialogVisible"
      :policy="selectedPolicy"
      @success="handleFormSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/date'
import PolicyFormDialog from '@/components/policy/PolicyFormDialog.vue'

interface Policy {
  id: string
  name: string
  type: 'security' | 'access' | 'data' | 'content'
  enabled: boolean
  priority: number
  description: string
  rules: any[]
  updatedAt: string
}

const searchQuery = ref('')
const typeFilter = ref('')
const loading = ref(false)
const policies = ref<Policy[]>([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const dialogVisible = ref(false)
const selectedPolicy = ref<Policy | null>(null)

const filteredPolicies = computed(() => {
  let filtered = policies.value

  if (searchQuery.value) {
    filtered = filtered.filter(policy =>
      policy.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      policy.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  if (typeFilter.value) {
    filtered = filtered.filter(policy => policy.type === typeFilter.value)
  }

  return filtered
})

const getTypeColor = (type: string) => {
  switch (type) {
    case 'security': return 'danger'
    case 'access': return 'warning'
    case 'data': return 'primary'
    case 'content': return 'success'
    default: return 'info'
  }
}

const getTypeText = (type: string) => {
  switch (type) {
    case 'security': return '安全策略'
    case 'access': return '访问控制'
    case 'data': return '数据保护'
    case 'content': return '内容过滤'
    default: return '未知'
  }
}

const loadPolicies = async () => {
  loading.value = true
  try {
    // Mock data - replace with actual API call
    policies.value = [
      {
        id: '1',
        name: '强密码策略',
        type: 'security',
        enabled: true,
        priority: 1,
        description: '要求用户密码包含大小写字母、数字和特殊字符',
        rules: [{ minLength: 8, requireUppercase: true, requireNumbers: true }],
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: '2',
        name: 'IP白名单策略',
        type: 'access',
        enabled: true,
        priority: 2,
        description: '仅允许白名单IP访问管理系统',
        rules: [{ allowedIPs: ['192.168.1.0/24'] }],
        updatedAt: '2024-01-14T15:30:00Z'
      }
    ]
    total.value = policies.value.length
  } catch (error) {
    ElMessage.error('加载策略列表失败')
    console.error('Failed to load policies:', error)
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

const handleAddPolicy = () => {
  selectedPolicy.value = null
  dialogVisible.value = true
}

const handleEdit = (policy: Policy) => {
  selectedPolicy.value = policy
  dialogVisible.value = true
}

const handleView = (policy: Policy) => {
  ElMessage.info(`查看策略详情: ${policy.name}`)
}

const handleDelete = async (policy: Policy) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除策略 "${policy.name}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    // Mock delete - replace with actual API call
    const index = policies.value.findIndex(p => p.id === policy.id)
    if (index > -1) {
      policies.value.splice(index, 1)
      total.value--
    }

    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleToggleStatus = async (policy: Policy) => {
  try {
    // Mock toggle - replace with actual API call
    ElMessage.success(`策略 "${policy.name}" 已${policy.enabled ? '启用' : '禁用'}`)
  } catch (error) {
    policy.enabled = !policy.enabled
    ElMessage.error('状态更新失败')
  }
}

const handleFormSuccess = () => {
  dialogVisible.value = false
  loadPolicies()
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  loadPolicies()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  loadPolicies()
}

onMounted(() => {
  loadPolicies()
})
</script>

<style scoped lang="scss">
.policy-management {
  .page-header {
    margin-bottom: 24px;
  }

  .pagination {
    margin-top: 24px;
    text-align: right;
  }
}
</style>