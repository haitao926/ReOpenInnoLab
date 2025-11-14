<template>
  <el-dialog v-model="visible" title="审计日志详情" width="50%">
    <div v-if="log">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="ID">{{ log.id }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ log.user }}</el-descriptions-item>
        <el-descriptions-item label="操作">{{ getActionText(log.action) }}</el-descriptions-item>
        <el-descriptions-item label="资源">{{ log.resource }}</el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ log.ip }}</el-descriptions-item>
        <el-descriptions-item label="用户代理">{{ log.userAgent }}</el-descriptions-item>
        <el-descriptions-item label="时间">{{ formatDate(log.timestamp) }}</el-descriptions-item>
      </el-descriptions>
    </div>
    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatDate } from '@/utils/date'

interface AuditLog {
  id: string
  user: string
  action: string
  resource: string
  ip: string
  userAgent: string
  timestamp: string
  details: any
}

const props = defineProps<{
  modelValue: boolean
  log: AuditLog | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const getActionText = (action: string) => {
  const map: Record<string, string> = {
    login: '登录',
    create: '创建',
    update: '更新',
    delete: '删除'
  }
  return map[action] || action
}
</script>