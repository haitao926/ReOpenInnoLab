<template>
  <el-dialog v-model="visible" :title="course ? '编辑课程' : '新增课程'" width="50%">
    <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
      <el-form-item label="课程名称" prop="title">
        <el-input v-model="form.title" />
      </el-form-item>
      <el-form-item label="讲师" prop="instructor">
        <el-input v-model="form.instructor" />
      </el-form-item>
      <el-form-item label="分类" prop="category">
        <el-input v-model="form.category" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="form.status">
          <el-option label="活跃" value="active" />
          <el-option label="未激活" value="inactive" />
          <el-option label="已归档" value="archived" />
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

interface Course {
  id: string
  title: string
  instructor: string
  category: string
  status: string
  studentCount: number
  createdAt: string
  updatedAt: string
}

const props = defineProps<{
  modelValue: boolean
  course: Course | null
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
  title: '',
  instructor: '',
  category: '',
  status: 'active'
})

const rules = {
  title: [{ required: true, message: '请输入课程名称', trigger: 'blur' }],
  instructor: [{ required: true, message: '请输入讲师', trigger: 'blur' }],
  category: [{ required: true, message: '请输入分类', trigger: 'blur' }]
}

const handleSubmit = async () => {
  await formRef.value.validate()
  emit('success')
}
</script>