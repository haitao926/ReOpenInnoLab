<template>
  <el-dialog v-model="visible" title="用户详情" width="60%">
    <div v-if="user">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="用户名">{{ user.username }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ user.email }}</el-descriptions-item>
        <el-descriptions-item label="角色">{{ getRoleText(user.role) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(user.status)">
            {{ getStatusText(user.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(user.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="最后登录">{{ formatDate(user.lastLogin) }}</el-descriptions-item>
      </el-descriptions>

      <el-divider />

      <h4>权限信息</h4>
      <el-tag v-for="permission in user.permissions" :key="permission" class="mr-2 mb-2">
        {{ permission }}
      </el-tag>

      <el-divider />

      <h4>操作日志</h4>
      <el-table :data="user.activities" size="small">
        <el-table-column prop="action" label="操作" />
        <el-table-column prop="resource" label="资源" />
        <el-table-column prop="timestamp" label="时间">
          <template #default="{ row }">
            {{ formatDate(row.timestamp) }}
          </template>
        </el-table-column>
      </el-table>
    </div>
    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
      <el-button type="primary" @click="handleEdit">编辑</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatDate } from '@/utils/date'

interface User {
  id: string
  username: string
  email: string
  role: string
  status: string
  permissions: string[]
  activities: Array<{
    action: string
    resource: string
    timestamp: string
  }>
  createdAt: string
  lastLogin: string
}

const props = defineProps<{
  modelValue: boolean
  user: User | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  edit: [user: User]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const getRoleText = (role: string) => {
  const map: Record<string, string> = {
    admin: '管理员',
    teacher: '教师',
    student: '学生'
  }
  return map[role] || role
}

const getStatusType = (status: string) => {
  switch (status) {
    case 'active': return 'success'
    case 'inactive': return 'warning'
    case 'suspended': return 'danger'
    default: return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'active': return '活跃'
    case 'inactive': return '未激活'
    case 'suspended': return '已暂停'
    default: return '未知'
  }
}

const handleEdit = () => {
  if (props.user) {
    emit('edit', props.user)
  }
}
</script>

<style scoped lang="scss">
.mr-2 {
  margin-right: 8px;
}

.mb-2 {
  margin-bottom: 8px;
}
</style>