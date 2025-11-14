<template>
  <div class="user-list">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ t('users.title') }}</h1>
        <p class="text-gray-600 mt-1">管理所有用户账户和权限</p>
      </div>
      <div class="flex gap-3">
        <el-button :icon="Download" @click="exportUsers">导出用户</el-button>
        <el-button :icon="Upload" @click="showImportDialog = true">导入用户</el-button>
        <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">
          创建用户
        </el-button>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <el-card class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">总用户数</p>
            <p class="text-2xl font-bold text-gray-900">{{ statistics.totalUsers }}</p>
            <p class="text-xs text-green-600 mt-1">+{{ statistics.newUsers }} 本月新增</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <el-icon size="24" color="#3b82f6"><User /></el-icon>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">活跃用户</p>
            <p class="text-2xl font-bold text-gray-900">{{ statistics.activeUsers }}</p>
            <p class="text-xs text-gray-600 mt-1">{{ Math.round((statistics.activeUsers / statistics.totalUsers) * 100) }}% 活跃率</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <el-icon size="24" color="#10b981"><UserFilled /></el-icon>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">管理员</p>
            <p class="text-2xl font-bold text-gray-900">{{ statistics.adminUsers }}</p>
            <p class="text-xs text-blue-600 mt-1">系统管理员</p>
          </div>
          <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <el-icon size="24" color="#8b5cf6"><Avatar /></el-icon>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">被锁用户</p>
            <p class="text-2xl font-bold text-gray-900">{{ statistics.lockedUsers }}</p>
            <p class="text-xs text-red-600 mt-1">需要处理</p>
          </div>
          <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
            <el-icon size="24" color="#ef4444"><Lock /></el-icon>
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
            placeholder="用户名、邮箱或姓名"
            :prefix-icon="Search"
            clearable
            @input="handleSearch"
          />
        </el-form-item>
        <el-form-item label="租户">
          <el-select v-model="filters.tenantId" placeholder="全部租户" clearable filterable @change="loadUsers">
            <el-option
              v-for="tenant in tenantOptions"
              :key="tenant.id"
              :label="tenant.name"
              :value="tenant.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="filters.role" placeholder="全部角色" clearable @change="loadUsers">
            <el-option
              v-for="role in roleOptions"
              :key="role.value"
              :label="role.label"
              :value="role.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable @change="loadUsers">
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
        <el-form-item label="注册时间">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="loadUsers"
          />
        </el-form-item>
        <el-form-item>
          <el-button :icon="Refresh" @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Batch Operations -->
    <div v-if="selectedUsers.length > 0" class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-sm text-blue-800">已选择 {{ selectedUsers.length }} 个用户</span>
          <el-button-group size="small">
            <el-button :icon="Check" @click="batchActivate">批量激活</el-button>
            <el-button :icon="Close" @click="batchDeactivate">批量停用</el-button>
            <el-button :icon="User" @click="batchAssignRole">分配角色</el-button>
            <el-button :icon="Message" @click="batchSendNotification">发送通知</el-button>
            <el-button :icon="Delete" type="danger" @click="batchDelete">批量删除</el-button>
          </el-button-group>
        </div>
        <el-button text @click="clearSelection">清除选择</el-button>
      </div>
    </div>

    <!-- User Table -->
    <el-card>
      <el-table
        v-loading="isLoading"
        :data="users"
        style="width: 100%"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column prop="avatar" label="头像" width="80">
          <template #default="{ row }">
            <el-avatar :size="40" :src="row.avatar">
              {{ row.name?.charAt(0) || row.username?.charAt(0) }}
            </el-avatar>
          </template>
        </el-table-column>

        <el-table-column prop="user" label="用户信息" min-width="200">
          <template #default="{ row }">
            <div>
              <div class="font-medium">{{ row.name || row.username }}</div>
              <div class="text-sm text-gray-500">@{{ row.username }}</div>
              <div class="text-xs text-gray-400">{{ row.email }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="tenant" label="租户" width="150">
          <template #default="{ row }">
            <div v-if="row.tenant">
              <div class="text-sm font-medium">{{ row.tenant.name }}</div>
              <div class="text-xs text-gray-500">{{ row.tenant.code }}</div>
            </div>
            <div v-else class="text-gray-400 text-sm">系统用户</div>
          </template>
        </el-table-column>

        <el-table-column prop="role" label="角色" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.role" :type="getRoleTagType(row.role)" size="small">
              {{ getRoleLabel(row.role) }}
            </el-tag>
            <span v-else class="text-gray-400 text-sm">-</span>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="lastLoginAt" label="最后登录" width="150" sortable="custom">
          <template #default="{ row }">
            <div v-if="row.lastLoginAt">
              <div class="text-sm">{{ formatDate(row.lastLoginAt) }}</div>
              <div class="text-xs text-gray-500">{{ formatRelativeTime(row.lastLoginAt) }}</div>
            </div>
            <div v-else class="text-gray-400 text-sm">从未登录</div>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="注册时间" width="120" sortable="custom">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button-group size="small">
              <el-button :icon="View" @click="viewUser(row)">详情</el-button>
              <el-button :icon="Edit" @click="editUser(row)" />
              <el-dropdown @command="(command) => handleAction(command, row)">
                <el-button :icon="MoreFilled" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="resetPassword">
                      <el-icon><Key /></el-icon>
                      重置密码
                    </el-dropdown-item>
                    <el-dropdown-item command="toggleStatus">
                      <el-icon><VideoPlay /></el-icon>
                      {{ row.isActive ? '停用' : '激活' }}
                    </el-dropdown-item>
                    <el-dropdown-item command="impersonate" v-if="hasImpersonatePermission">
                      <el-icon><User /></el-icon>
                      模拟登录
                    </el-dropdown-item>
                    <el-dropdown-item command="viewAudit">
                      <el-icon><Document /></el-icon>
                      查看日志
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided v-if="hasDeletePermission">
                      <el-icon><Delete /></el-icon>
                      删除用户
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
          @size-change="loadUsers"
          @current-change="loadUsers"
        />
      </div>
    </el-card>

    <!-- Create/Edit User Dialog -->
    <UserFormDialog
      v-model="showCreateDialog"
      :user="editingUser"
      :tenants="tenantOptions"
      @success="handleUserSuccess"
    />

    <!-- User Detail Dialog -->
    <UserDetailDialog
      v-model="showDetailDialog"
      :user="selectedUser"
    />

    <!-- Import Users Dialog -->
    <ImportUsersDialog
      v-model="showImportDialog"
      @success="handleImportSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { formatDate, formatRelativeTime } from '@/utils/date'
import {
  Plus, Search, Refresh, Download, Upload, View, Edit, MoreFilled,
  Check, Close, Delete, User, Key, VideoPlay, Document, UserFilled,
  Avatar, Lock, Message
} from '@element-plus/icons-vue'
import { userApi } from '@/api/user'
import { tenantApi } from '@/api/tenant'
import UserFormDialog from '@/components/user/UserFormDialog.vue'
import UserDetailDialog from '@/components/user/UserDetailDialog.vue'
import ImportUsersDialog from '@/components/user/ImportUsersDialog.vue'
import type { User, UserQuery, UserStatistics } from '@/types/user'
import type { Tenant } from '@/types/tenant'

const { t } = useI18n()
const router = useRouter()
const { hasPermission } = useAuth()

// State
const isLoading = ref(false)
const users = ref<User[]>([])
const selectedUsers = ref<User[]>([])
const tenantOptions = ref<Tenant[]>([])
const statistics = ref<UserStatistics>({
  totalUsers: 0,
  activeUsers: 0,
  adminUsers: 0,
  lockedUsers: 0,
  newUsers: 0
})

const filters = reactive<UserQuery>({
  search: '',
  tenantId: undefined,
  role: undefined,
  status: undefined,
  dateRange: undefined
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const showImportDialog = ref(false)
const editingUser = ref<User | null>(null)
const selectedUser = ref<User | null>(null)

// Computed
const hasDeletePermission = computed(() => hasPermission('user:delete'))
const hasImpersonatePermission = computed(() => hasPermission('user:impersonate'))

const roleOptions = [
  { value: 'super_admin', label: '超级管理员' },
  { value: 'admin', label: '管理员' },
  { value: 'teacher', label: '教师' },
  { value: 'student', label: '学生' },
  { value: 'assistant', label: '助教' },
  { value: 'guest', label: '访客' }
]

const statusOptions = [
  { value: 'active', label: '正常', color: 'success' },
  { value: 'inactive', label: '未激活', color: 'info' },
  { value: 'suspended', label: '已暂停', color: 'warning' },
  { value: 'locked', label: '已锁定', color: 'danger' }
]

// Methods
const loadUsers = async () => {
  try {
    isLoading.value = true
    const params = {
      ...filters,
      page: pagination.page,
      pageSize: pagination.pageSize
    }

    const response = await userApi.getUsers(params)
    users.value = response.items
    pagination.total = response.total
  } catch (error) {
    ElMessage.error('加载用户列表失败')
    console.error('Failed to load users:', error)
  } finally {
    isLoading.value = false
  }
}

const loadTenants = async () => {
  try {
    const response = await tenantApi.getTenants({ pageSize: 1000 })
    tenantOptions.value = response.items
  } catch (error) {
    console.error('Failed to load tenants:', error)
  }
}

const loadStatistics = async () => {
  try {
    const stats = await userApi.getStatistics()
    statistics.value = stats
  } catch (error) {
    console.error('Failed to load statistics:', error)
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadUsers()
}

const resetFilters = () => {
  Object.assign(filters, {
    search: '',
    tenantId: undefined,
    role: undefined,
    status: undefined,
    dateRange: undefined
  })
  pagination.page = 1
  loadUsers()
}

const handleSortChange = ({ prop, order }) => {
  filters.sortBy = prop
  filters.sortOrder = order === 'ascending' ? 'ASC' : 'DESC'
  loadUsers()
}

const handleSelectionChange = (selection: User[]) => {
  selectedUsers.value = selection
}

const clearSelection = () => {
  selectedUsers.value = []
}

const viewUser = (user: User) => {
  selectedUser.value = user
  showDetailDialog.value = true
}

const editUser = (user: User) => {
  editingUser.value = user
  showCreateDialog.value = true
}

const handleAction = async (command: string, user: User) => {
  switch (command) {
    case 'resetPassword':
      await resetPassword(user)
      break
    case 'toggleStatus':
      await toggleUserStatus(user)
      break
    case 'impersonate':
      await impersonateUser(user)
      break
    case 'viewAudit':
      await viewUserAudit(user)
      break
    case 'delete':
      await deleteUser(user)
      break
  }
}

const resetPassword = async (user: User) => {
  try {
    const { value: newPassword } = await ElMessageBox.prompt(
      '请输入新密码（留空则自动生成）',
      '重置密码',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: '留空自动生成'
      }
    )

    await userApi.resetPassword(user.id, { newPassword })
    ElMessage.success('密码重置成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('重置密码失败')
    }
  }
}

const toggleUserStatus = async (user: User) => {
  const newStatus = user.isActive ? 'suspended' : 'active'
  const action = user.isActive ? '停用' : '激活'

  try {
    await ElMessageBox.confirm(
      `确定要${action}用户 "${user.name || user.username}" 吗？`,
      `${action}确认`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await userApi.updateUser(user.id, { status: newStatus })
    ElMessage.success(`用户已${action}`)
    loadUsers()
    loadStatistics()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`${action}用户失败`)
    }
  }
}

const impersonateUser = async (user: User) => {
  try {
    await ElMessageBox.confirm(
      `确定要模拟登录用户 "${user.name || user.username}" 吗？`,
      '模拟登录确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // In a real implementation, this would create a session token for impersonation
    ElMessage.success('模拟登录成功')
    // Redirect to user's application
    // window.open(`/login-as/${user.id}`, '_blank')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('模拟登录失败')
    }
  }
}

const viewUserAudit = (user: User) => {
  router.push({
    name: 'AuditLogs',
    query: { userId: user.id }
  })
}

const deleteUser = async (user: User) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.name || user.username}" 吗？此操作不可撤销。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    await userApi.deleteUser(user.id)
    ElMessage.success('用户已删除')
    loadUsers()
    loadStatistics()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除用户失败')
    }
  }
}

// Batch operations
const batchActivate = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要激活选中的 ${selectedUsers.value.length} 个用户吗？`,
      '批量激活',
      { type: 'warning' }
    )

    // Implementation for batch activation
    ElMessage.success('批量激活成功')
    clearSelection()
    loadUsers()
    loadStatistics()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量激活失败')
    }
  }
}

const batchDeactivate = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要停用选中的 ${selectedUsers.value.length} 个用户吗？`,
      '批量停用',
      { type: 'warning' }
    )

    // Implementation for batch deactivation
    ElMessage.success('批量停用成功')
    clearSelection()
    loadUsers()
    loadStatistics()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量停用失败')
    }
  }
}

const batchAssignRole = async () => {
  // Implementation for batch role assignment
  ElMessage.info('批量角色分配功能开发中...')
}

const batchSendNotification = async () => {
  // Implementation for batch notification
  ElMessage.info('批量通知功能开发中...')
}

const batchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedUsers.value.length} 个用户吗？此操作不可撤销。`,
      '批量删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    // Implementation for batch deletion
    ElMessage.success('批量删除成功')
    clearSelection()
    loadUsers()
    loadStatistics()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败')
    }
  }
}

const exportUsers = async () => {
  try {
    // Implementation for user export
    ElMessage.info('用户导出功能开发中...')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

const handleUserSuccess = () => {
  showCreateDialog.value = false
  editingUser.value = null
  loadUsers()
  loadStatistics()
}

const handleImportSuccess = () => {
  showImportDialog.value = false
  loadUsers()
  loadStatistics()
}

// Utility methods
const getRoleLabel = (role: string) => {
  return roleOptions.find(r => r.value === role)?.label || role
}

const getRoleTagType = (role: string) => {
  const types: Record<string, string> = {
    super_admin: 'danger',
    admin: 'warning',
    teacher: 'primary',
    student: 'success',
    assistant: 'info',
    guest: ''
  }
  return types[role] || ''
}

const getStatusLabel = (status: string) => {
  return statusOptions.find(s => s.value === status)?.label || status
}

const getStatusTagType = (status: string) => {
  return statusOptions.find(s => s.value === status)?.color || ''
}

onMounted(() => {
  loadUsers()
  loadTenants()
  loadStatistics()
})
</script>

<style scoped>
.user-list {
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
</style>