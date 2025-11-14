<template>
  <div class="tenant-list">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ t('tenants.title') }}</h1>
        <p class="text-gray-600 mt-1">管理所有租户账户和配置</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">
        创建租户
      </el-button>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <el-card class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">总租户数</p>
            <p class="text-2xl font-bold text-gray-900">{{ statistics.totalTenants }}</p>
            <p class="text-xs text-green-600 mt-1">+{{ statistics.recentSignups }} 本月新增</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <el-icon size="24" color="#3b82f6"><OfficeBuilding /></el-icon>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">活跃租户</p>
            <p class="text-2xl font-bold text-gray-900">{{ statistics.activeTenants }}</p>
            <p class="text-xs text-gray-600 mt-1">{{ Math.round((statistics.activeTenants / statistics.totalTenants) * 100) }}% 活跃率</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <el-icon size="24" color="#10b981"><CircleCheck /></el-icon>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">试用租户</p>
            <p class="text-2xl font-bold text-gray-900">{{ statistics.trialTenants }}</p>
            <p class="text-xs text-orange-600 mt-1">需要关注</p>
          </div>
          <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <el-icon size="24" color="#f59e0b"><Clock /></el-icon>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">过期租户</p>
            <p class="text-2xl font-bold text-gray-900">{{ statistics.expiredTenants }}</p>
            <p class="text-xs text-red-600 mt-1">需要处理</p>
          </div>
          <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
            <el-icon size="24" color="#ef4444"><WarningFilled /></el-icon>
          </div>
        </div>
      </el-card>
    </div>

    <!-- Filters -->
    <el-card class="mb-6">
      <el-form :model="filters" inline>
        <el-form-item label="搜索">
          <el-input
            v-model="filters.search"
            placeholder="租户名称、代码或邮箱"
            :prefix-icon="Search"
            clearable
            @input="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable @change="loadTenants">
            <el-option
              v-for="status in statusOptions"
              :key="status.value"
              :label="status.label"
              :value="status.value"
            >
              <el-tag :type="status.color" size="small">{{ status.label }}</el-tag>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="套餐">
          <el-select v-model="filters.plan" placeholder="全部套餐" clearable @change="loadTenants">
            <el-option
              v-for="plan in planOptions"
              :key="plan.value"
              :label="plan.label"
              :value="plan.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="行业">
          <el-select v-model="filters.industry" placeholder="全部行业" clearable filterable @change="loadTenants">
            <el-option
              v-for="industry in industryOptions"
              :key="industry"
              :label="industry"
              :value="industry"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button :icon="Refresh" @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Tenant Table -->
    <el-card>
      <el-table
        v-loading="isLoading"
        :data="tenants"
        style="width: 100%"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="logo" label="Logo" width="80">
          <template #default="{ row }">
            <el-avatar :size="40" :src="row.logo">
              {{ row.name.charAt(0) }}
            </el-avatar>
          </template>
        </el-table-column>

        <el-table-column prop="name" label="租户信息" min-width="200">
          <template #default="{ row }">
            <div>
              <div class="font-medium">{{ row.displayName || row.name }}</div>
              <div class="text-sm text-gray-500">{{ row.code }}</div>
              <div class="text-xs text-gray-400">{{ row.contactEmail }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="plan" label="套餐" width="120">
          <template #default="{ row }">
            <el-tag :type="getPlanTagType(row.plan)" size="small">
              {{ getPlanLabel(row.plan) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="usage" label="使用情况" width="150">
          <template #default="{ row }">
            <div class="space-y-1">
              <div class="flex items-center justify-between text-xs">
                <span>用户</span>
                <span>{{ (row.usage?.users || 0) }}/{{ (row.quotas?.max_users || 0) }}</span>
              </div>
              <el-progress
                :percentage="getUsagePercentage(row, 'users')"
                :stroke-width="4"
                :show-text="false"
              />
              <div class="flex items-center justify-between text-xs">
                <span>存储</span>
                <span>{{ (row.usage?.storage_gb || 0) }}GB/{{ (row.quotas?.storage_gb || 0) }}GB</span>
              </div>
              <el-progress
                :percentage="getUsagePercentage(row, 'storage_gb')"
                :stroke-width="4"
                :show-text="false"
              />
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="创建时间" width="120" sortable="custom">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column prop="trialEndsAt" label="试用期" width="120">
          <template #default="{ row }">
            <div v-if="row.status === 'trial'">
              <div class="text-sm">{{ formatDate(row.trialEndsAt) }}</div>
              <div class="text-xs" :class="getTrialDaysClass(row)">
                剩余 {{ getTrialDaysRemaining(row) }} 天
              </div>
            </div>
            <div v-else class="text-gray-400 text-sm">-</div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button-group size="small">
              <el-button :icon="View" @click="viewTenant(row)">详情</el-button>
              <el-button :icon="Edit" @click="editTenant(row)" />
              <el-dropdown @command="(command) => handleAction(command, row)">
                <el-button :icon="MoreFilled" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="approve" v-if="row.status === 'pending'">
                      <el-icon><Check /></el-icon>
                      审批通过
                    </el-dropdown-item>
                    <el-dropdown-item command="reject" v-if="row.status === 'pending'">
                      <el-icon><Close /></el-icon>
                      拒绝申请
                    </el-dropdown-item>
                    <el-dropdown-item command="suspend" v-if="row.status === 'active'">
                      <el-icon><VideoPlay /></el-icon>
                      暂停租户
                    </el-dropdown-item>
                    <el-dropdown-item command="activate" v-if="row.status === 'suspended'">
                      <el-icon><VideoPlay /></el-icon>
                      激活租户
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided v-if="hasDeletePermission">
                      <el-icon><Delete /></el-icon>
                      删除租户
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="flex items-center justify-between mt-6">
        <div class="text-sm text-gray-600">
          显示 {{ pagination.pageSize * (pagination.page - 1) + 1 }} -
          {{ Math.min(pagination.pageSize * pagination.page, pagination.total) }}
          共 {{ pagination.total }} 条记录
        </div>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="sizes, prev, pager, next, jumper"
          @size-change="loadTenants"
          @current-change="loadTenants"
        />
      </div>
    </el-card>

    <!-- Create/Edit Tenant Dialog -->
    <TenantFormDialog
      v-model="showCreateDialog"
      :tenant="editingTenant"
      @success="handleTenantSuccess"
    />

    <!-- Tenant Detail Dialog -->
    <TenantDetailDialog
      v-model="showDetailDialog"
      :tenant="selectedTenant"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { Plus, Search, Refresh, View, Edit, MoreFilled, Check, Close, Delete, VideoPlay, OfficeBuilding, CircleCheck, Clock, WarningFilled } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/date'
import { tenantApi } from '@/api/tenant'
import TenantFormDialog from '@/components/tenant/TenantFormDialog.vue'
import TenantDetailDialog from '@/components/tenant/TenantDetailDialog.vue'
import type { Tenant, TenantQuery, TenantStatistics } from '@/types/tenant'

const { t } = useI18n()
const router = useRouter()
const { hasPermission } = useAuth()

// State
const isLoading = ref(false)
const tenants = ref<Tenant[]>([])
const statistics = ref<TenantStatistics>({
  totalTenants: 0,
  activeTenants: 0,
  trialTenants: 0,
  expiredTenants: 0,
  planDistribution: {} as any,
  statusDistribution: {} as any,
  recentSignups: 0,
  topIndustries: [],
  topCountries: []
})

const filters = reactive<TenantQuery>({
  search: '',
  status: undefined,
  plan: undefined,
  industry: undefined
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const editingTenant = ref<Tenant | null>(null)
const selectedTenant = ref<Tenant | null>(null)

// Computed
const hasDeletePermission = computed(() => hasPermission('tenant:delete'))

const statusOptions = [
  { value: 'pending', label: '待审核', color: 'warning' },
  { value: 'active', label: '正常', color: 'success' },
  { value: 'trial', label: '试用中', color: 'primary' },
  { value: 'suspended', label: '已暂停', color: 'danger' },
  { value: 'expired', label: '已过期', color: 'danger' },
  { value: 'inactive', label: '未激活', color: 'info' }
]

const planOptions = [
  { value: 'starter', label: '入门版' },
  { value: 'basic', label: '基础版' },
  { value: 'pro', label: '专业版' },
  { value: 'enterprise', label: '企业版' },
  { value: 'custom', label: '定制版' }
]

const industryOptions = computed(() => {
  const industries = new Set<string>()
  tenants.value.forEach(tenant => {
    if (tenant.industry) industries.add(tenant.industry)
  })
  return Array.from(industries)
})

// Methods
const loadTenants = async () => {
  try {
    isLoading.value = true
    const params = {
      ...filters,
      page: pagination.page,
      pageSize: pagination.pageSize
    }

    const response = await tenantApi.getTenants(params)
    tenants.value = response.items
    pagination.total = response.total
  } catch (error) {
    ElMessage.error('加载租户列表失败')
    console.error('Failed to load tenants:', error)
  } finally {
    isLoading.value = false
  }
}

const loadStatistics = async () => {
  try {
    const stats = await tenantApi.getStatistics()
    statistics.value = stats
  } catch (error) {
    console.error('Failed to load statistics:', error)
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadTenants()
}

const resetFilters = () => {
  Object.assign(filters, {
    search: '',
    status: undefined,
    plan: undefined,
    industry: undefined
  })
  pagination.page = 1
  loadTenants()
}

const handleSortChange = ({ prop, order }) => {
  filters.sortBy = prop
  filters.sortOrder = order === 'ascending' ? 'ASC' : 'DESC'
  loadTenants()
}

const viewTenant = (tenant: Tenant) => {
  selectedTenant.value = tenant
  showDetailDialog.value = true
}

const editTenant = (tenant: Tenant) => {
  editingTenant.value = tenant
  showCreateDialog.value = true
}

const handleAction = async (command: string, tenant: Tenant) => {
  switch (command) {
    case 'approve':
      await approveTenant(tenant)
      break
    case 'reject':
      await rejectTenant(tenant)
      break
    case 'suspend':
      await suspendTenant(tenant)
      break
    case 'activate':
      await activateTenant(tenant)
      break
    case 'delete':
      await deleteTenant(tenant)
      break
  }
}

const approveTenant = async (tenant: Tenant) => {
  try {
    await tenantApi.approveTenant(tenant.id)
    ElMessage.success('租户已批准')
    loadTenants()
    loadStatistics()
  } catch (error) {
    ElMessage.error('批准租户失败')
  }
}

const rejectTenant = async (tenant: Tenant) => {
  try {
    const { value: reason } = await ElMessageBox.prompt('请输入拒绝原因', '拒绝租户申请', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /.+/,
      inputErrorMessage: '请输入拒绝原因'
    })

    await tenantApi.rejectTenant(tenant.id, { reason })
    ElMessage.success('租户申请已拒绝')
    loadTenants()
    loadStatistics()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('拒绝租户失败')
    }
  }
}

const suspendTenant = async (tenant: Tenant) => {
  try {
    const { value: reason } = await ElMessageBox.prompt('请输入暂停原因', '暂停租户', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /.+/,
      inputErrorMessage: '请输入暂停原因'
    })

    await tenantApi.updateTenantStatus(tenant.id, { status: 'suspended', reason })
    ElMessage.success('租户已暂停')
    loadTenants()
    loadStatistics()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('暂停租户失败')
    }
  }
}

const activateTenant = async (tenant: Tenant) => {
  try {
    await tenantApi.updateTenantStatus(tenant.id, { status: 'active' })
    ElMessage.success('租户已激活')
    loadTenants()
    loadStatistics()
  } catch (error) {
    ElMessage.error('激活租户失败')
  }
}

const deleteTenant = async (tenant: Tenant) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除租户 "${tenant.name}" 吗？此操作不可撤销。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    await tenantApi.deleteTenant(tenant.id)
    ElMessage.success('租户已删除')
    loadTenants()
    loadStatistics()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除租户失败')
    }
  }
}

const handleTenantSuccess = () => {
  showCreateDialog.value = false
  editingTenant.value = null
  loadTenants()
  loadStatistics()
}

// Utility methods
const getPlanLabel = (plan: string) => {
  return planOptions.find(p => p.value === plan)?.label || plan
}

const getPlanTagType = (plan: string) => {
  const types: Record<string, string> = {
    starter: 'info',
    basic: 'primary',
    pro: 'warning',
    enterprise: 'success',
    custom: 'danger'
  }
  return types[plan] || 'info'
}

const getStatusLabel = (status: string) => {
  return statusOptions.find(s => s.value === status)?.label || status
}

const getStatusTagType = (status: string) => {
  return statusOptions.find(s => s.value === status)?.color || 'info'
}

const getUsagePercentage = (tenant: Tenant, resource: string) => {
  const used = tenant.usage?.[resource] || 0
  const quota = tenant.quotas?.[resource] || 0
  if (quota === -1) return 0 // Unlimited
  return Math.min(100, Math.round((used / quota) * 100))
}

const getTrialDaysRemaining = (tenant: Tenant) => {
  if (!tenant.trialEndsAt) return 0
  const now = new Date()
  const trialEnd = new Date(tenant.trialEndsAt)
  const diffTime = trialEnd.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
}

const getTrialDaysClass = (tenant: Tenant) => {
  const daysRemaining = getTrialDaysRemaining(tenant)
  if (daysRemaining <= 3) return 'text-red-600'
  if (daysRemaining <= 7) return 'text-orange-600'
  return 'text-green-600'
}

onMounted(() => {
  loadTenants()
  loadStatistics()
})
</script>

<style scoped>
.tenant-list {
  max-width: 1400px;
  margin: 0 auto;
}

.stat-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

:deep(.el-progress-bar__outer) {
  border-radius: 2px;
}

:deep(.el-progress-bar__inner) {
  border-radius: 2px;
}

.space-y-1 > * + * {
  margin-top: 0.25rem;
}
</style>