<template>
  <div class="tenant-activity-logs">
    <div class="section-header">
      <h4>活动日志</h4>
      <el-button type="primary" size="small" @click="handleRefresh">
        刷新
      </el-button>
    </div>
    <el-table :data="logs" style="width: 100%">
      <el-table-column prop="user" label="用户" />
      <el-table-column prop="action" label="操作" />
      <el-table-column prop="resource" label="资源" />
      <el-table-column prop="ip" label="IP地址" />
      <el-table-column prop="timestamp" label="时间">
        <template #default="{ row }">
          {{ formatDate(row.timestamp) }}
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        small
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { formatDate } from '@/utils/date'

interface ActivityLog {
  id: string
  user: string
  action: string
  resource: string
  ip: string
  timestamp: string
}

defineProps<{
  tenantId: string
}>()

const logs = ref<ActivityLog[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const loadLogs = () => {
  // Mock data
  logs.value = [
    {
      id: '1',
      user: 'admin',
      action: '登录',
      resource: '系统',
      ip: '192.168.1.100',
      timestamp: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      user: 'teacher1',
      action: '创建课程',
      resource: '数学课程',
      ip: '192.168.1.101',
      timestamp: '2024-01-15T10:15:00Z'
    }
  ]
  total.value = logs.value.length
}

const handleRefresh = () => {
  loadLogs()
}

onMounted(() => {
  loadLogs()
})
</script>

<style scoped lang="scss">
.tenant-activity-logs {
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .pagination {
    margin-top: 16px;
    text-align: right;
  }
}
</style>