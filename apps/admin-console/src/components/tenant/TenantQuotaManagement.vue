<template>
  <div class="tenant-quota-management">
    <div class="section-header">
      <h4>配额设置</h4>
      <el-button type="primary" size="small" @click="handleAddQuota">
        添加配额
      </el-button>
    </div>
    <el-table :data="quotas" style="width: 100%">
      <el-table-column prop="type" label="配额类型" />
      <el-table-column prop="limit" label="限制" />
      <el-table-column prop="used" label="已使用" />
      <el-table-column label="使用率">
        <template #default="{ row }">
          <el-progress
            :percentage="Math.round((row.used / row.limit) * 100)"
            :status="getUsageStatus((row.used / row.limit) * 100)"
          />
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

interface Quota {
  id: string
  type: string
  limit: number
  used: number
}

defineProps<{
  tenantId: string
}>()

const quotas = ref<Quota[]>([])

const loadQuotas = () => {
  // Mock data
  quotas.value = [
    {
      id: '1',
      type: '存储空间',
      limit: 10737418240, // 10GB
      used: 6442450944   // 6GB
    },
    {
      id: '2',
      type: '用户数量',
      limit: 100,
      used: 45
    }
  ]
}

const getUsageStatus = (percentage: number) => {
  if (percentage >= 90) return 'exception'
  if (percentage >= 70) return 'warning'
  return 'success'
}

const handleAddQuota = () => {
  // Handle add quota
}

onMounted(() => {
  loadQuotas()
})
</script>

<style scoped lang="scss">
.tenant-quota-management {
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
}
</style>