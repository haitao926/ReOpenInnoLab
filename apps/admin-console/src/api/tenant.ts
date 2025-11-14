import { api } from '@/utils/request'
import type {
  Tenant,
  CreateTenantRequest,
  UpdateTenantRequest,
  TenantQuery,
  TenantListResponse,
  TenantStatistics,
  TenantQuotaCheck,
  TenantUsageUpdate,
  TenantStatusUpdate,
  TenantApproval,
  TenantRejection
} from '@/types/tenant'

export const tenantApi = {
  // 获取租户列表
  getTenants: async (params: TenantQuery = {}): Promise<TenantListResponse> => {
    const response = await api.get('/admin/tenants', { params })
    return response.data
  },

  // 获取租户详情
  getTenant: async (id: string): Promise<Tenant> => {
    const response = await api.get(`/admin/tenants/${id}`)
    return response.data
  },

  // 根据代码获取租户
  getTenantByCode: async (code: string): Promise<Tenant> => {
    const response = await api.get(`/admin/tenants/code/${code}`)
    return response.data
  },

  // 创建租户
  createTenant: async (data: CreateTenantRequest): Promise<Tenant> => {
    const response = await api.post('/admin/tenants', data)
    return response.data
  },

  // 更新租户
  updateTenant: async (id: string, data: UpdateTenantRequest): Promise<Tenant> => {
    const response = await api.put(`/admin/tenants/${id}`, data)
    return response.data
  },

  // 更新租户状态
  updateTenantStatus: async (id: string, data: TenantStatusUpdate): Promise<Tenant> => {
    const response = await api.put(`/admin/tenants/${id}/status`, data)
    return response.data
  },

  // 批准租户
  approveTenant: async (id: string, data?: TenantApproval): Promise<Tenant> => {
    const response = await api.post(`/admin/tenants/${id}/approve`, data || {})
    return response.data
  },

  // 拒绝租户
  rejectTenant: async (id: string, data: TenantRejection): Promise<Tenant> => {
    const response = await api.post(`/admin/tenants/${id}/reject`, data)
    return response.data
  },

  // 删除租户
  deleteTenant: async (id: string): Promise<void> => {
    await api.delete(`/admin/tenants/${id}`)
  },

  // 获取租户统计
  getStatistics: async (): Promise<TenantStatistics> => {
    const response = await api.get('/admin/tenants/statistics')
    return response.data
  },

  // 获取套餐列表
  getPlans: async (): Promise<{ plans: Array<{ value: string; label: string; description: string }> }> => {
    const response = await api.get('/admin/tenants/plans/list')
    return response.data
  },

  // 获取状态列表
  getStatuses: async (): Promise<{ statuses: Array<{ value: string; label: string; color: string }> }> => {
    const response = await api.get('/admin/tenants/statuses/list')
    return response.data
  },

  // 更新租户使用量
  updateUsage: async (id: string, resource: string, data: TenantUsageUpdate): Promise<void> => {
    await api.post(`/admin/tenants/${id}/usage/${resource}`, data)
  },

  // 检查配额
  checkQuota: async (id: string, resource: string, required?: number): Promise<TenantQuotaCheck> => {
    const params = { resource, required }
    const response = await api.get(`/admin/tenants/${id}/quotas/check`, { params })
    return response.data
  },

  // 获取租户的配额使用情况
  getQuotaUsage: async (id: string): Promise<{ quotas: Record<string, number>; usage: Record<string, number>; percentages: Record<string, number> }> => {
    const tenant = await api.get(`/admin/tenants/${id}`)
    return {
      quotas: tenant.data.quotas,
      usage: tenant.data.usage,
      percentages: tenant.data.usagePercentages || {}
    }
  }
}