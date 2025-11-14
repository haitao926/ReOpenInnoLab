<template>
  <el-dialog
    v-model="visible"
    title="上传教学资源"
    width="600px"
    :before-close="handleClose"
    destroy-on-close
  >
    <div class="resource-upload">
      <el-form :model="uploadForm" :rules="uploadRules" ref="uploadFormRef" label-width="100px">
        <el-form-item label="资源类型" prop="type">
          <el-select v-model="uploadForm.type" placeholder="请选择资源类型">
            <el-option
              v-for="type in resourceTypes"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            >
              <div class="resource-type-option">
                <el-icon :color="getResourceTypeColor(type.value)">
                  <component :is="getResourceIcon(type.value)" />
                </el-icon>
                <span>{{ type.label }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="资源文件" prop="file">
          <el-upload
            ref="uploadRef"
            class="upload-demo"
            drag
            :auto-upload="false"
            :show-file-list="false"
            :accept="getAcceptedTypes()"
            :on-change="handleFileChange"
            :before-upload="beforeUpload"
          >
            <div v-if="!uploadForm.file" class="upload-placeholder">
              <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
              <div class="el-upload__text">
                将文件拖到此处，或<em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  {{ getUploadTip() }}
                </div>
              </template>
            </div>

            <div v-else class="upload-file-info">
              <div class="file-preview">
                <el-icon :size="32" :color="getResourceTypeColor(uploadForm.type)">
                  <component :is="getResourceIcon(uploadForm.type)" />
                </el-icon>
              </div>
              <div class="file-details">
                <div class="file-name">{{ uploadForm.file.name }}</div>
                <div class="file-size">{{ formatFileSize(uploadForm.file.size) }}</div>
                <div class="file-actions">
                  <el-button type="danger" size="small" text @click="removeFile">
                    <el-icon><Delete /></el-icon>
                    移除
                  </el-button>
                </div>
              </div>
            </div>
          </el-upload>
        </el-form-item>

        <el-form-item label="资源标题" prop="title">
          <el-input
            v-model="uploadForm.title"
            placeholder="请输入资源标题"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="资源描述" prop="description">
          <el-input
            v-model="uploadForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入资源描述"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="学科分类" prop="subject">
          <el-select v-model="uploadForm.subject" placeholder="请选择学科">
            <el-option
              v-for="subject in subjects"
              :key="subject"
              :label="subject"
              :value="subject"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="适用年级" prop="grade">
          <el-select v-model="uploadForm.grade" placeholder="请选择年级">
            <el-option
              v-for="grade in grades"
              :key="grade"
              :label="grade"
              :value="grade"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="标签">
          <el-tag
            v-for="tag in uploadForm.tags"
            :key="tag"
            closable
            @close="removeTag(tag)"
            class="tag-item"
          >
            {{ tag }}
          </el-tag>
          <el-input
            v-if="inputVisible"
            ref="inputRef"
            v-model="inputValue"
            class="tag-input"
            size="small"
            @keyup.enter="handleInputConfirm"
            @blur="handleInputConfirm"
          />
          <el-button v-else size="small" @click="showInput">+ 添加标签</el-button>
        </el-form-item>
      </el-form>

      <!-- 缩略图上传（仅视频和图片） -->
      <div v-if="['video', 'image'].includes(uploadForm.type)" class="thumbnail-upload">
        <el-form label-width="100px">
          <el-form-item label="缩略图">
            <el-upload
              class="thumbnail-uploader"
              action="#"
              :show-file-list="false"
              :before-upload="beforeThumbnailUpload"
              accept="image/*"
            >
              <img v-if="uploadForm.thumbnail" :src="uploadForm.thumbnail" class="thumbnail" />
              <el-icon v-else class="thumbnail-uploader-icon"><Plus /></el-icon>
            </el-upload>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <template #footer>
      <div class="upload-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          @click="handleUpload"
          :loading="uploading"
          :disabled="!uploadForm.file"
        >
          {{ uploading ? '上传中...' : '开始上传' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, UploadInstance, UploadRawFile } from 'element-plus'
import {
  UploadFilled, Delete, Plus,
  VideoPlay, Picture, DocumentText, Headphones, Monitor
} from '@element-plus/icons-vue'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': []
}>()

// 状态
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const uploading = ref(false)
const uploadFormRef = ref<FormInstance>()
const uploadRef = ref<UploadInstance>()
const inputRef = ref()

// 表单数据
const uploadForm = ref({
  type: '',
  file: null as File | null,
  title: '',
  description: '',
  subject: '',
  grade: '',
  tags: [] as string[],
  thumbnail: ''
})

// 标签输入
const inputVisible = ref(false)
const inputValue = ref('')

// 资源类型配置
const resourceTypes = [
  { value: 'video', label: '视频', maxSize: 500 * 1024 * 1024 }, // 500MB
  { value: 'image', label: '图片', maxSize: 10 * 1024 * 1024 }, // 10MB
  { value: 'document', label: '文档', maxSize: 50 * 1024 * 1024 }, // 50MB
  { value: 'audio', label: '音频', maxSize: 100 * 1024 * 1024 }, // 100MB
  { value: 'simulation', label: '仿真', maxSize: 200 * 1024 * 1024 } // 200MB
]

// 参考数据
const subjects = ['数学', '物理', '化学', '生物', '语文', '英语', '历史', '地理', '政治']
const grades = ['小学1年级', '小学2年级', '小学3年级', '小学4年级', '小学5年级', '小学6年级', '初中1年级', '初中2年级', '初中3年级', '高中1年级', '高中2年级', '高中3年级']

// 表单验证规则
const uploadRules = {
  type: [{ required: true, message: '请选择资源类型', trigger: 'change' }],
  title: [{ required: true, message: '请输入资源标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入资源描述', trigger: 'blur' }],
  subject: [{ required: true, message: '请选择学科分类', trigger: 'change' }],
  grade: [{ required: true, message: '请选择适用年级', trigger: 'change' }]
}

// 计算属性
function getCurrentResourceType() {
  return resourceTypes.find(type => type.value === uploadForm.value.type)
}

function getCurrentMaxSize() {
  const type = getCurrentResourceType()
  return type?.maxSize || 10 * 1024 * 1024
}

// 方法
function getResourceIcon(type: string): any {
  const icons: Record<string, any> = {
    video: VideoPlay,
    image: Picture,
    document: DocumentText,
    audio: Headphones,
    simulation: Monitor
  }
  return icons[type] || DocumentText
}

function getResourceTypeColor(type: string): string {
  const colors: Record<string, string> = {
    video: '#409EFF',
    image: '#67C23A',
    document: '#E6A23C',
    audio: '#F56C6C',
    simulation: '#909399'
  }
  return colors[type] || '#909399'
}

function getAcceptedTypes(): string {
  const acceptMap: Record<string, string> = {
    video: 'video/*',
    image: 'image/*',
    document: '.pdf,.doc,.docx,.ppt,.pptx,.txt',
    audio: 'audio/*',
    simulation: '.html,.zip'
  }
  return acceptMap[uploadForm.value.type] || '*'
}

function getUploadTip(): string {
  const tips: Record<string, string> = {
    video: '支持 MP4、AVI、MOV 格式，最大 500MB',
    image: '支持 JPG、PNG、GIF 格式，最大 10MB',
    document: '支持 PDF、Word、PPT、TXT 格式，最大 50MB',
    audio: '支持 MP3、WAV、AAC 格式，最大 100MB',
    simulation: '支持 HTML、ZIP 格式，最大 200MB'
  }
  return tips[uploadForm.value.type] || '请选择合适的文件格式'
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function beforeUpload(file: UploadRawFile) {
  // 文件大小检查
  const maxSize = getCurrentMaxSize()
  if (file.size > maxSize) {
    ElMessage.error(`文件大小不能超过 ${formatFileSize(maxSize)}`)
    return false
  }

  // 文件类型检查
  const type = uploadForm.value.type
  if (!type) {
    ElMessage.error('请先选择资源类型')
    return false
  }

  return true
}

function handleFileChange(file: any) {
  if (beforeUpload(file.raw)) {
    uploadForm.value.file = file.raw

    // 自动填充标题
    if (!uploadForm.value.title) {
      uploadForm.value.title = file.name.replace(/\.[^/.]+$/, '')
    }
  }
}

function removeFile() {
  uploadForm.value.file = null
  uploadRef.value?.clearFiles()
}

function beforeThumbnailUpload(file: UploadRawFile) {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('缩略图只能是图片格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('缩略图大小不能超过 2MB!')
    return false
  }

  // 创建预览URL
  const reader = new FileReader()
  reader.onload = (e) => {
    uploadForm.value.thumbnail = e.target?.result as string
  }
  reader.readAsDataURL(file)

  return false // 阻止自动上传
}

// 标签管理
function removeTag(tag: string) {
  uploadForm.value.tags = uploadForm.value.tags.filter(t => t !== tag)
}

function showInput() {
  inputVisible.value = true
  nextTick(() => {
    inputRef.value?.focus()
  })
}

function handleInputConfirm() {
  if (inputValue.value && uploadForm.value.tags.length < 5) {
    uploadForm.value.tags.push(inputValue.value.trim())
  }
  inputVisible.value = false
  inputValue.value = ''
}

// 上传处理
async function handleUpload() {
  if (!uploadForm.value.file) {
    ElMessage.error('请选择要上传的文件')
    return
  }

  const valid = await uploadFormRef.value?.validate()
  if (!valid) return

  uploading.value = true

  try {
    // 这里应该调用真实的上传API
    // const result = await resourceApi.uploadResource(uploadData)

    // 模拟上传过程
    await simulateUpload()

    ElMessage.success('资源上传成功')

    // 重置表单
    resetForm()

    // 触发成功事件
    emit('success')

    // 关闭对话框
    handleClose()

  } catch (error) {
    console.error('上传失败:', error)
    ElMessage.error('资源上传失败，请稍后重试')
  } finally {
    uploading.value = false
  }
}

function simulateUpload(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 2000)
  })
}

function resetForm() {
  uploadForm.value = {
    type: '',
    file: null,
    title: '',
    description: '',
    subject: '',
    grade: '',
    tags: [],
    thumbnail: ''
  }
  uploadRef.value?.clearFiles()
}

function handleClose() {
  if (uploading.value) {
    ElMessageBox.confirm('正在上传中，确定要关闭吗？', '提示', {
      type: 'warning'
    }).then(() => {
      visible.value = false
      resetForm()
    })
  } else {
    visible.value = false
    resetForm()
  }
}
</script>

<style scoped>
.resource-upload {
  max-height: 70vh;
  overflow-y: auto;
}

.resource-type-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.upload-demo :deep(.el-upload-dragger) {
  width: 100%;
}

.upload-placeholder {
  padding: var(--spacing-lg);
  text-align: center;
}

.upload-file-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
}

.file-preview {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background-light);
  border-radius: var(--border-radius-sm);
}

.file-details {
  flex: 1;
}

.file-name {
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.file-size {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
}

.file-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.tag-item {
  margin-right: var(--spacing-xs);
  margin-bottom: var(--spacing-xs);
}

.tag-input {
  width: 100px;
  margin-right: var(--spacing-xs);
  margin-bottom: var(--spacing-xs);
}

.thumbnail-upload {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}

.thumbnail-uploader {
  display: inline-block;
}

.thumbnail-uploader :deep(.el-upload) {
  border: 1px dashed var(--color-border);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.thumbnail-uploader :deep(.el-upload:hover) {
  border-color: var(--color-primary);
}

.thumbnail-uploader-icon {
  font-size: 28px;
  color: var(--color-text-secondary);
  width: 100px;
  height: 100px;
  text-align: center;
  line-height: 100px;
}

.thumbnail {
  width: 100px;
  height: 100px;
  object-fit: cover;
  display: block;
}

.upload-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .upload-file-info {
    flex-direction: column;
    align-items: flex-start;
    text-align: center;
  }

  .file-preview {
    align-self: center;
  }

  .upload-footer {
    flex-direction: column;
  }

  .tag-input {
    width: 80px;
  }
}
</style>