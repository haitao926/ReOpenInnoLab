<template>
  <el-dialog v-model="visible" :title="quota ? '编辑配额' : '新增配额'" width="50%">
    <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
      <el-form-item label="租户" prop="tenant">
        <el-input v-model="form.tenant" />
      </el-form-item>
      <el-form-item label="配额类型" prop="type">
        <el-select v-model="form.type">
          <el-option label="存储空间" value="storage" />
          <el-option label="API调用" value="api" />
          <el-option label="用户数量" value="users" />
          <el-option label="带宽" value="bandwidth" />
        </el-select>
      </el-form-item>
      <el-form-item label="限制" prop="limit">
        <el-input-number v-model="form.limit" :min="0" />
      </el-form-item>
      <el-form-item label="周期" prop="period">
        <el-select v-model="form.period">
          <el-option label="每日" value="daily" />
          <el-option label="每月" value="monthly" />
          <el-option label="每年" value="yearly" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, reactive } from 'vue'

interface Quota {
  id: string
  tenant: string
  type: string
  limit: number
  used: number
  period: string
  updatedAt: string
}

const props = defineProps<{
  modelValue: boolean
  quota: Quota | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const formRef = ref()
const form = reactive({
  tenant: '',
  type: 'storage',
  limit: 0,
  period: 'monthly'
})

const rules = {
  tenant: [{ required: true, message: '请输入租户', trigger: 'blur' }],
  type: [{ required: true, message: '请选择配额类型', trigger: 'change' }],
  limit: [{ required: true, message: '请输入限制', trigger: 'blur' }],
  period: [{ required: true, message: '请选择周期', trigger: 'change' }]
}

const handleSubmit = async () => {
  await formRef.value.validate()
  emit('success')
}
</script>