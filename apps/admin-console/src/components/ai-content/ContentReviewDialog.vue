<template>
  <el-dialog v-model="visible" title="内容审核" width="60%">
    <div v-if="content">
      <p><strong>标题:</strong> {{ content.title }}</p>
      <p><strong>类型:</strong> {{ content.type }}</p>
      <p><strong>作者:</strong> {{ content.author }}</p>
      <p><strong>风险评分:</strong> {{ content.riskScore }}/100</p>
      <el-divider />
      <p><strong>内容:</strong></p>
      <div>{{ content.content }}</div>
    </div>
    <template #footer>
      <el-button @click="handleReject">拒绝</el-button>
      <el-button type="primary" @click="handleApprove">通过</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface AIContent {
  id: string
  title: string
  type: string
  author: string
  riskScore: number
  content: string
  status: string
}

const props = defineProps<{
  modelValue: boolean
  content: AIContent | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const handleApprove = () => {
  emit('success')
}

const handleReject = () => {
  emit('success')
}
</script>