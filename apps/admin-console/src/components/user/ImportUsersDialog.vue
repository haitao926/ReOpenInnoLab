<template>
  <el-dialog v-model="visible" title="导入用户" width="50%">
    <div class="import-steps">
      <el-steps :active="currentStep" finish-status="success">
        <el-step title="下载模板" />
        <el-step title="上传文件" />
        <el-step title="预览数据" />
        <el-step title="完成导入" />
      </el-steps>

      <div class="step-content mt-6">
        <!-- Step 1: Download Template -->
        <div v-if="currentStep === 0">
          <p>请先下载用户导入模板，按照格式填写用户信息：</p>
          <el-button type="primary" @click="downloadTemplate">
            <el-icon><Download /></el-icon>
            下载模板
          </el-button>
        </div>

        <!-- Step 2: Upload File -->
        <div v-if="currentStep === 1">
          <p>上传填写好的Excel文件：</p>
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-success="handleUploadSuccess"
            :file-list="fileList"
            accept=".xlsx,.xls"
            drag
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                只能上传xlsx/xls文件，且不超过10MB
              </div>
            </template>
          </el-upload>
        </div>

        <!-- Step 3: Preview Data -->
        <div v-if="currentStep === 2">
          <p>预览将要导入的用户数据：</p>
          <el-table :data="previewData" style="width: 100%" max-height="300">
            <el-table-column prop="username" label="用户名" />
            <el-table-column prop="email" label="邮箱" />
            <el-table-column prop="role" label="角色" />
            <el-table-column prop="status" label="状态" />
          </el-table>
          <div class="mt-4">
            <p class="text-sm text-gray-600">
              共 {{ previewData.length }} 条数据将被导入
            </p>
          </div>
        </div>

        <!-- Step 4: Complete -->
        <div v-if="currentStep === 3">
          <el-result
            icon="success"
            title="导入成功"
            :sub-title="`成功导入 ${importResult.success} 条数据，失败 ${importResult.failed} 条数据`"
          >
            <template #extra>
              <el-button type="primary" @click="visible = false">完成</el-button>
            </template>
          </el-result>
        </div>
      </div>

      <div class="dialog-footer">
        <el-button v-if="currentStep > 0 && currentStep < 3" @click="prevStep">上一步</el-button>
        <el-button v-if="currentStep < 2" type="primary" @click="nextStep">下一步</el-button>
        <el-button v-if="currentStep === 2" type="primary" @click="handleImport" :loading="importing">
          开始导入
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Download, UploadFilled } from '@element-plus/icons-vue'

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

const currentStep = ref(0)
const uploadRef = ref()
const fileList = ref([])
const previewData = ref([])
const importing = ref(false)
const importResult = ref({
  success: 0,
  failed: 0
})

const downloadTemplate = () => {
  // Mock download template
  const link = document.createElement('a')
  link.href = '/templates/user-import-template.xlsx'
  link.download = 'user-import-template.xlsx'
  link.click()
}

const handleFileChange = (file: any) => {
  // Mock file processing
  setTimeout(() => {
    previewData.value = [
      { username: 'user1', email: 'user1@example.com', role: 'student', status: 'active' },
      { username: 'user2', email: 'user2@example.com', role: 'teacher', status: 'active' }
    ]
  }, 1000)
}

const handleUploadSuccess = () => {
  // Handle upload success
}

const nextStep = () => {
  if (currentStep.value < 3) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const handleImport = async () => {
  importing.value = true

  // Mock import process
  setTimeout(() => {
    importResult.value = {
      success: previewData.value.length,
      failed: 0
    }
    importing.value = false
    currentStep.value = 3
    emit('success')
  }, 2000)
}
</script>

<style scoped lang="scss">
.import-steps {
  .step-content {
    min-height: 200px;
  }

  .dialog-footer {
    margin-top: 24px;
    text-align: right;
  }
}

.mt-6 {
  margin-top: 24px;
}

.mt-4 {
  margin-top: 16px;
}
</style>