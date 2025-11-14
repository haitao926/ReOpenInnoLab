<template>
  <el-dialog
    :model-value="modelValue"
    title="租户详情"
    width="1000px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div v-if="tenant" class="tenant-detail">
      <!-- 基本信息 -->
      <el-card class="mb-6">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">基本信息</h3>
            <el-tag :type="getStatusTagType(tenant.status)">
              {{ getStatusLabel(tenant.status) }}
            </el-tag>
          </div>
        </template>

        <el-row :gutter="24">
          <el-col :span="6">
            <div class="text-center">
              <el-avatar :size="80" :src="tenant.logo">
                {{ tenant.name.charAt(0) }}
              </el-avatar>
              <div class="mt-2 font-medium">{{ tenant.displayName || tenant.name }}</div>
              <div class="text-sm text-gray-500">{{ tenant.code }}</div>
            </div>
          </el-col>
          <el-col :span="18">
            <el-descriptions :column="3" border>
              <el-descriptions-item label="联系邮箱">
                {{ tenant.contactEmail }}
              </el-descriptions-item>
              <el-descriptions-item label="联系人">
                {{ tenant.contactPerson || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="联系电话">
                {{ tenant.contactPhone || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="所属行业">
                {{ tenant.industry || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="员工数量">
                {{ tenant.employeeCount || '-' }} 人
              </el-descriptions-item>
              <el-descriptions-item label="国家/地区">
                {{ tenant.country || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="域名">
                {{ tenant.domain || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="套餐类型">
                <el-tag :type="getPlanTagType(tenant.plan)" size="small">
                  {{ getPlanLabel(tenant.plan) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="月费">
                ¥{{ tenant.monthlyPrice || 0 }}/月
              </el-descriptions-item>
            </el-descriptions>
          </el-col>
        </el-row>

        <div v-if="tenant.description" class="mt-4 p-4 bg-gray-50 rounded-lg">
          <div class="text-sm font-medium text-gray-700 mb-2">描述信息</div>
          <div class="text-sm text-gray-600">{{ tenant.description }}</div>
        </div>
      </el-card>

      <!-- 套餐和配额 -->
      <el-row :gutter="24" class="mb-6">
        <el-col :span="12">
          <el-card>
            <template #header>
              <h3 class="text-lg font-semibold">配额使用情况</h3>
            </template>

            <div class="space-y-4">
              <div v-for="quota in quotaDisplay" :key="quota.key" class="quota-item">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium">{{ quota.label }}</span>
                  <span class="text-sm text-gray-600">
                    {{ quota.used }} / {{ quota.total === -1 ? '无限制' : quota.total }} {{ quota.unit }}
                  </span>
                </div>
                <el-progress
                  v-if="quota.total !== -1"
                  :percentage="quota.percentage"
                  :color="getProgressColor(quota.percentage)"
                  :stroke-width="8"
                />
                <div v-else class="text-xs text-green-600">无限制使用</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card>
            <template #header>
              <h3 class="text-lg font-semibold">功能开关</h3>
            </template>

            <div class="feature-grid">
              <div
                v-for="feature in featureDisplay"
                :key="feature.key"
                class="flex items-center justify-between p-3 border rounded-lg"
                :class="{ 'bg-green-50 border-green-200': feature.enabled }"
              >
                <span class="text-sm">{{ feature.label }}</span>
                <el-tag :type="feature.enabled ? 'success' : 'info'" size="small">
                  {{ feature.enabled ? '已启用' : '未启用' }}
                </el-tag>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 试用期和订阅信息 -->
      <el-card class="mb-6" v-if="tenant.trialEndsAt || tenant.subscriptionEndsAt">
        <template #header>
          <h3 class="text-lg font-semibold">订阅信息</h3>
        </template>

        <el-row :gutter="24">
          <el-col :span="12" v-if="tenant.trialEndsAt">
            <div class="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-medium text-orange-900">试用期</div>
                  <div class="text-sm text-orange-700 mt-1">
                    {{ formatDate(tenant.trialEndsAt) }} 到期
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-2xl font-bold" :class="getTrialDaysClass(tenant)">
                    {{ getTrialDaysRemaining(tenant) }}
                  </div>
                  <div class="text-xs text-orange-600">剩余天数</div>
                </div>
              </div>
            </div>
          </el-col>

          <el-col :span="12" v-if="tenant.subscriptionEndsAt">
            <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-medium text-blue-900">订阅期</div>
                  <div class="text-sm text-blue-700 mt-1">
                    {{ formatDate(tenant.subscriptionEndsAt) }} 到期
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-2xl font-bold text-blue-600">
                    {{ getSubscriptionDaysRemaining(tenant) }}
                  </div>
                  <div class="text-xs text-blue-600">剩余天数</div>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 最近活动 -->
      <el-card>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">最近活动</h3>
            <el-button text type="primary" @click="viewAuditLogs">查看全部</el-button>
          </div>
        </template>

        <el-table :data="recentActivities" style="width: 100%">
          <el-table-column prop="action" label="操作" width="120">
            <template #default="{ row }">
              <el-tag size="small" :type="getActionTagType(row.action)">
                {{ getActionLabel(row.action) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="operator" label="操作人" width="120" />
          <el-table-column prop="description" label="描述" />
          <el-table-column prop="ipAddress" label="IP地址" width="120" />
          <el-table-column prop="createdAt" label="时间" width="160">
            <template #default="{ row }">
              {{ formatDateTime(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column prop="success" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.success ? 'success' : 'danger'" size="small">
                {{ row.success ? '成功' : '失败' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="$emit('update:modelValue', false)">关闭</el-button>
        <el-button type="primary" @click="editTenant">编辑租户</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { formatDate, formatDateTime } from '@/utils/date'
import type { Tenant } from '@/types/tenant'

interface Props {
  modelValue: boolean
  tenant?: Tenant | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'edit', tenant: Tenant): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const router = useRouter()

// Mock recent activities - in real app, this would come from API
const recentActivities = ref([
  {
    action: 'login',
    operator: 'admin@company.com',
    description: '管理员登录',
    ipAddress: '192.168.1.100',
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    success: true
  },
  {
    action: 'create',
    operator: 'admin@company.com',
    description: '创建用户张三',
    ipAddress: '192.168.1.100',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    success: true
  },
  {
    action: 'update',
    operator: 'admin@company.com',
    description: '更新租户配置',
    ipAddress: '192.168.1.100',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    success: true
  }
])

// Computed
const quotaDisplay = computed(() => {
  if (!props.tenant) return []

  const quotas = props.tenant.quotas || {}
  const usage = props.tenant.usage || {}

  return [
    {
      key: 'max_users',
      label: '用户数',
      used: usage.max_users || 0,
      total: quotas.max_users || 0,
      unit: '人',
      percentage: getUsagePercentage('max_users')
    },
    {
      key: 'max_courses',
      label: '课程数',
      used: usage.max_courses || 0,
      total: quotas.max_courses || 0,
      unit: '门',
      percentage: getUsagePercentage('max_courses')
    },
    {
      key: 'max_students',
      label: '学生数',
      used: usage.max_students || 0,
      total: quotas.max_students || 0,
      unit: '人',
      percentage: getUsagePercentage('max_students')
    },
    {
      key: 'storage_gb',
      label: '存储空间',
      used: usage.storage_gb || 0,
      total: quotas.storage_gb || 0,
      unit: 'GB',
      percentage: getUsagePercentage('storage_gb')
    },
    {
      key: 'api_calls_per_month',
      label: 'API调用',
      used: usage.api_calls_per_month || 0,
      total: quotas.api_calls_per_month || 0,
      unit: '次',
      percentage: getUsagePercentage('api_calls_per_month')
    },
    {
      key: 'ai_tokens_per_month',
      label: 'AI Token',
      used: usage.ai_tokens_per_month || 0,
      total: quotas.ai_tokens_per_month || 0,
      unit: '个',
      percentage: getUsagePercentage('ai_tokens_per_month')
    }
  ].filter(item => item.total !== 0)
})

const featureDisplay = computed(() => {
  if (!props.tenant) return []

  const features = props.tenant.features || {}
  const featureMap = {
    ai_assistant: 'AI助手',
    virtual_lab: '虚拟实验',
    analytics: '数据分析',
    sso_integration: 'SSO集成',
    api_access: 'API访问',
    custom_branding: '自定义品牌',
    priority_support: '优先支持',
    data_export: '数据导出',
    user_management: '用户管理',
    course_management: '课程管理'
  }

  return Object.entries(featureMap).map(([key, label]) => ({
    key,
    label,
    enabled: features[key] === true
  }))
})

// Methods
const getUsagePercentage = (resource: string): number => {
  if (!props.tenant) return 0

  const used = props.tenant.usage?.[resource] || 0
  const quota = props.tenant.quotas?.[resource] || 0

  if (quota === -1) return 0 // Unlimited
  return Math.min(100, Math.round((used / quota) * 100))
}

const getProgressColor = (percentage: number): string => {
  if (percentage >= 90) return '#f56565' // red
  if (percentage >= 75) return '#ed8936' // orange
  if (percentage >= 50) return '#38b2ac' // teal
  return '#48bb78' // green
}

const getTrialDaysRemaining = (tenant: Tenant): number => {
  if (!tenant.trialEndsAt) return 0
  const now = new Date()
  const trialEnd = new Date(tenant.trialEndsAt)
  const diffTime = trialEnd.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
}

const getSubscriptionDaysRemaining = (tenant: Tenant): number => {
  if (!tenant.subscriptionEndsAt) return 0
  const now = new Date()
  const subEnd = new Date(tenant.subscriptionEndsAt)
  const diffTime = subEnd.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
}

const getTrialDaysClass = (tenant: Tenant): string => {
  const daysRemaining = getTrialDaysRemaining(tenant)
  if (daysRemaining <= 3) return 'text-red-600'
  if (daysRemaining <= 7) return 'text-orange-600'
  return 'text-green-600'
}

const getPlanLabel = (plan: string): string => {
  const labels: Record<string, string> = {
    starter: '入门版',
    basic: '基础版',
    pro: '专业版',
    enterprise: '企业版',
    custom: '定制版'
  }
  return labels[plan] || plan
}

const getPlanTagType = (plan: string): string => {
  const types: Record<string, string> = {
    starter: 'info',
    basic: 'primary',
    pro: 'warning',
    enterprise: 'success',
    custom: 'danger'
  }
  return types[plan] || 'info'
}

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: '待审核',
    active: '正常',
    trial: '试用中',
    suspended: '已暂停',
    expired: '已过期',
    inactive: '未激活'
  }
  return labels[status] || status
}

const getStatusTagType = (status: string): string => {
  const types: Record<string, string> = {
    pending: 'warning',
    active: 'success',
    trial: 'primary',
    suspended: 'danger',
    expired: 'danger',
    inactive: 'info'
  }
  return types[status] || 'info'
}

const getActionLabel = (action: string): string => {
  const labels: Record<string, string> = {
    login: '登录',
    logout: '退出',
    create: '创建',
    update: '更新',
    delete: '删除',
    view: '查看',
    approve: '审批',
    reject: '拒绝',
    export: '导出',
    import: '导入',
    assign: '分配',
    remove: '移除',
    enable: '启用',
    disable: '禁用'
  }
  return labels[action] || action
}

const getActionTagType = (action: string): string => {
  const types: Record<string, string> = {
    login: 'success',
    logout: 'info',
    create: 'primary',
    update: 'warning',
    delete: 'danger',
    approve: 'success',
    reject: 'danger',
    enable: 'success',
    disable: 'warning'
  }
  return types[action] || 'info'
}

const editTenant = () => {
  if (props.tenant) {
    emit('edit', props.tenant)
    emit('update:modelValue', false)
  }
}

const viewAuditLogs = () => {
  if (props.tenant) {
    router.push({
      name: 'AuditLogs',
      query: { resource: 'tenant', resourceId: props.tenant.id }
    })
  }
}
</script>

<style scoped>
.tenant-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.quota-item {
  margin-bottom: 16px;
}

.quota-item:last-child {
  margin-bottom: 0;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.space-y-4 > * + * {
  margin-top: 1rem;
}

:deep(.el-descriptions__label) {
  font-weight: 500;
}

:deep(.el-progress-bar__outer) {
  border-radius: 4px;
}

:deep(.el-progress-bar__inner) {
  border-radius: 4px;
}
</style>