<template>
  <el-dialog v-model="visible" :title="policy ? '编辑策略' : '新增策略'" width="60%">
    <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
      <el-form-item label="策略名称" prop="name">
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="策略类型" prop="type">
        <el-select v-model="form.type">
          <el-option label="安全策略" value="security" />
          <el-option label="访问控制" value="access" />
          <el-option label="数据保护" value="data" />
          <el-option label="内容过滤" value="content" />
        </el-select>
      </el-form-item>
      <el-form-item label="优先级" prop="priority">
        <el-input-number v-model="form.priority" :min="1" :max="10" />
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input v-model="form.description" type="textarea" rows="3" />
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

interface Policy {
  id: string
  name: string
  type: string
  enabled: boolean
  priority: number
  description: string
  rules: any[]
  updatedAt: string
}

const props = defineProps<{
  modelValue: boolean
  policy: Policy | null
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
  name: '',
  type: 'security',
  priority: 1,
  description: ''
})

const rules = {
  name: [{ required: true, message: '请输入策略名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择策略类型', trigger: 'change' }],
  priority: [{ required: true, message: '请输入优先级', trigger: 'blur' }]
}

const handleSubmit = async () => {
  await formRef.value.validate()
  emit('success')
}
</script>