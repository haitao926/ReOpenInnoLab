<template>
  <div class="tenant-detail">
    <div class="page-header">
      <el-page-header @back="goBack" :title="tenant?.name || '租户详情'">
        <template #content>
          <el-tag :type="getStatusType(tenant?.status)">
            {{ getStatusText(tenant?.status) }}
          </el-tag>
        </template>
      </el-page-header>
    </div>

    <el-row :gutter="24" class="detail-content">
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>基本信息</span>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="租户ID">{{ tenant?.id }}</el-descriptions-item>
            <el-descriptions-item label="名称">{{ tenant?.name }}</el-descriptions-item>
            <el-descriptions-item label="域名">{{ tenant?.domain }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusType(tenant?.status)">
                {{ getStatusText(tenant?.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDate(tenant?.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ formatDate(tenant?.updatedAt) }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="用户管理" name="users">
            <TenantUserManagement :tenant-id="tenantId" />
          </el-tab-pane>
          <el-tab-pane label="配额设置" name="quotas">
            <TenantQuotaManagement :tenant-id="tenantId" />
          </el-tab-pane>
          <el-tab-pane label="配置信息" name="config">
            <TenantConfiguration :tenant-id="tenantId" />
          </el-tab-pane>
          <el-tab-pane label="活动日志" name="logs">
            <TenantActivityLogs :tenant-id="tenantId" />
          </el-tab-pane>
        </el-tabs>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { Tenant } from '@/types/tenant'
import { tenantApi } from '@/api/tenant'
import { formatDate } from '@/utils/date'
import TenantUserManagement from '@/components/tenant/TenantUserManagement.vue'
import TenantQuotaManagement from '@/components/tenant/TenantQuotaManagement.vue'
import TenantConfiguration from '@/components/tenant/TenantConfiguration.vue'
import TenantActivityLogs from '@/components/tenant/TenantActivityLogs.vue'

const route = useRoute()
const router = useRouter()

const tenantId = route.params.id as string
const tenant = ref<Tenant | null>(null)
const loading = ref(false)
const activeTab = ref('users')

const goBack = () => {
  router.push({ name: 'Tenants' })
}

const getStatusType = (status?: string) => {
  switch (status) {
    case 'active': return 'success'
    case 'inactive': return 'warning'
    case 'suspended': return 'danger'
    default: return 'info'
  }
}

const getStatusText = (status?: string) => {
  switch (status) {
    case 'active': return '活跃'
    case 'inactive': return '未激活'
    case 'suspended': return '已暂停'
    default: return '未知'
  }
}

const loadTenant = async () => {
  loading.value = true
  try {
    const response = await tenantApi.getTenantById(tenantId)
    tenant.value = response.data
  } catch (error) {
    ElMessage.error('加载租户详情失败')
    console.error('Failed to load tenant:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadTenant()
})
</script>

<style scoped lang="scss">
.tenant-detail {
  .page-header {
    margin-bottom: 24px;
  }

  .detail-content {
    .el-card {
      height: fit-content;
    }
  }
}
</style>