<template>
  <el-dialog v-model="visible" title="批量审核" width="50%">
    <div v-if="contents.length > 0">
      <p>已选择 {{ contents.length }} 个内容进行批量审核</p>
      <el-form :model="form" label-width="80px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="form.action">
            <el-radio label="approve">全部通过</el-radio>
            <el-radio label="reject">全部拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核意见">
          <el-input v-model="form.comment" type="textarea" rows="3" />
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

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
  contents: AIContent[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const form = ref({
  action: 'approve',
  comment: ''
})

const handleSubmit = () => {
  emit('success')
}
</script>