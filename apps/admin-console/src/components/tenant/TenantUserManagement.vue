<template>
  <div class="tenant-user-management">
    <div class="section-header">
      <h4>用户管理</h4>
      <el-button type="primary" size="small" @click="handleAddUser">
        添加用户
      </el-button>
    </div>
    <el-table :data="users" style="width: 100%">
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column prop="role" label="角色" />
      <el-table-column prop="status" label="状态">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'warning'">
            {{ row.status === 'active' ? '活跃' : '未激活' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button type="primary" size="small">编辑</el-button>
          <el-button type="danger" size="small">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface User {
  id: string
  username: string
  email: string
  role: string
  status: string
}

defineProps<{
  tenantId: string
}>()

const users = ref<User[]>([])

const loadUsers = () => {
  // Mock data
  users.value = [
    {
      id: '1',
      username: 'admin',
      email: 'admin@example.com',
      role: '管理员',
      status: 'active'
    },
    {
      id: '2',
      username: 'teacher1',
      email: 'teacher1@example.com',
      role: '教师',
      status: 'active'
    }
  ]
}

const handleAddUser = () => {
  // Handle add user
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped lang="scss">
.tenant-user-management {
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
}
</style>