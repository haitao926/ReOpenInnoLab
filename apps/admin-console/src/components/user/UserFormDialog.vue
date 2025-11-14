<template>
  <el-dialog v-model="visible" :title="user ? '编辑用户' : '创建用户'" width="50%">
    <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
      <el-form-item label="用户名" prop="username">
        <el-input v-model="form.username" :disabled="!!user" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="form.email" />
      </el-form-item>
      <el-form-item label="密码" prop="password" v-if="!user">
        <el-input v-model="form.password" type="password" />
      </el-form-item>
      <el-form-item label="角色" prop="role">
        <el-select v-model="form.role">
          <el-option label="管理员" value="admin" />
          <el-option label="教师" value="teacher" />
          <el-option label="学生" value="student" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="form.status">
          <el-option label="活跃" value="active" />
          <el-option label="未激活" value="inactive" />
          <el-option label="已暂停" value="suspended" />
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

interface User {
  id: string
  username: string
  email: string
  role: string
  status: string
}

const props = defineProps<{
  modelValue: boolean
  user: User | null
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
  username: '',
  email: '',
  password: '',
  role: 'student',
  status: 'active'
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const handleSubmit = async () => {
  await formRef.value.validate()
  emit('success')
}
</script>