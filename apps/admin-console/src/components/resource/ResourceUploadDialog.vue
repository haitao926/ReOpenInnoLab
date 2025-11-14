<template>
  <el-dialog v-model="visible" title="上传资源" width="50%">
    <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
      <el-form-item label="文件" prop="file">
        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :on-change="handleFileChange"
          :file-list="fileList"
          action="#"
        >
          <el-button type="primary">选择文件</el-button>
        </el-upload>
      </el-form-item>
      <el-form-item label="资源名称" prop="name">
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input v-model="form.description" type="textarea" rows="3" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">上传</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, reactive } from 'vue'

const props = defineProps<{
  modelValue: boolean
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
const uploadRef = ref()
const fileList = ref([])
const form = reactive({
  name: '',
  description: ''
})

const rules = {
  name: [{ required: true, message: '请输入资源名称', trigger: 'blur' }]
}

const handleFileChange = (file: any) => {
  if (!form.name) {
    form.name = file.name
  }
}

const handleSubmit = async () => {
  await formRef.value.validate()
  emit('success')
}
</script>