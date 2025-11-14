<template>
  <div class="notebook-uploader">
    <!-- 上传区域 -->
    <div
      class="upload-area"
      :class="{
        'upload-area--dragover': isDragOver,
        'upload-area--error': uploadError,
        'upload-area--success': uploadSuccess
      }"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
    >
      <div class="upload-content">
        <!-- 默认状态 -->
        <div v-if="!selectedFile && !isUploading" class="upload-placeholder">
          <div class="upload-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <div class="upload-text">
            <h3>上传 Jupyter Notebook</h3>
            <p>拖拽 .ipynb 文件到此处，或者 <button type="button" class="link-button" @click="triggerFileSelect">点击选择文件</button></p>
            <p class="upload-hint">支持 .ipynb 格式，最大 50MB</p>
          </div>
        </div>

        <!-- 文件已选择 -->
        <div v-else-if="selectedFile && !isUploading" class="file-selected">
          <div class="file-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <div class="file-info">
            <h4>{{ selectedFile.name }}</h4>
            <p>{{ formatFileSize(selectedFile.size) }}</p>
            <div v-if="notebookMetadata" class="metadata">
              <span>{{ notebookMetadata.cellCount }} 个单元格</span>
              <span>{{ notebookMetadata.codeCells }} 个代码单元格</span>
              <span>{{ notebookMetadata.markdownCells }} 个 Markdown 单元格</span>
            </div>
          </div>
          <div class="file-actions">
            <EduButton variant="text" size="small" @click="removeFile">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              移除
            </EduButton>
            <EduButton variant="text" size="small" @click="triggerFileSelect">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              重新选择
            </EduButton>
          </div>
        </div>

        <!-- 上传中 -->
        <div v-else-if="isUploading" class="upload-progress">
          <div class="progress-icon">
            <div class="spinner"></div>
          </div>
          <div class="progress-info">
            <h4>正在上传...</h4>
            <p>{{ uploadProgress ? `${uploadProgress}%` : '处理中...' }}</p>
            <div v-if="uploadProgress" class="progress-bar">
              <div class="progress-fill" :style="{ width: `${uploadProgress}%` }"></div>
            </div>
          </div>
        </div>

        <!-- 上传成功 -->
        <div v-else-if="uploadSuccess" class="upload-success">
          <div class="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div class="success-text">
            <h4>上传成功！</h4>
            <p>笔记本已成功上传并处理</p>
          </div>
        </div>
      </div>

      <!-- 隐藏的文件输入 -->
      <input
        ref="fileInput"
        type="file"
        class="file-input"
        accept=".ipynb"
        @change="handleFileSelect"
      />
    </div>

    <!-- 错误提示 -->
    <div v-if="uploadError" class="upload-error">
      <div class="error-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>
      <div class="error-message">
        <h4>上传失败</h4>
        <p>{{ uploadError }}</p>
      </div>
      <EduButton variant="text" @click="clearError">重试</EduButton>
    </div>

    <!-- 附件上传区域 -->
    <div v-if="showAttachments && selectedFile" class="attachments-section">
      <h4>附件文件（可选）</h4>
      <div class="attachments-upload-area">
        <div
          class="attachment-drop-zone"
          :class="{ 'attachment-drop-zone--dragover': isAttachmentDragOver }"
          @drop="handleAttachmentDrop"
          @dragover="handleAttachmentDragOver"
          @dragenter="handleAttachmentDragEnter"
          @dragleave="handleAttachmentDragLeave"
        >
          <div class="attachment-upload-content">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
            <p>拖拽附件文件到此处，或者 <button type="button" class="link-button" @click="triggerAttachmentSelect">选择文件</button></p>
            <p class="attachment-hint">支持数据集、图片、文档等，最多 10 个文件</p>
          </div>
          <input
            ref="attachmentInput"
            type="file"
            class="file-input"
            multiple
            @change="handleAttachmentSelect"
          />
        </div>

        <!-- 已选择的附件列表 -->
        <div v-if="attachments.length > 0" class="attachments-list">
          <div
            v-for="(attachment, index) in attachments"
            :key="index"
            class="attachment-item"
          >
            <div class="attachment-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                <polyline points="13 2 13 9 20 9"/>
              </svg>
            </div>
            <div class="attachment-info">
              <span class="attachment-name">{{ attachment.name }}</span>
              <span class="attachment-size">{{ formatFileSize(attachment.size) }}</span>
            </div>
            <button type="button" class="attachment-remove" @click="removeAttachment(index)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import EduButton from '@/components/ui/EduButton.vue'
import LabApiService, { type CreateLabTemplateDto } from '@/api/lab'

// Props
interface Props {
  showAttachments?: boolean
}

// Emits
interface Emits {
  (e: 'upload-success', template: any): void
  (e: 'upload-error', error: string): void
  (e: 'file-selected', file: File): void
}

const props = withDefaults(defineProps<Props>(), {
  showAttachments: false
})

const emit = defineEmits<Emits>()

// Refs
const fileInput = ref<HTMLInputElement>()
const attachmentInput = ref<HTMLInputElement>()
const selectedFile = ref<File>()
const attachments = ref<File[]>([])
const isDragOver = ref(false)
const isAttachmentDragOver = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const uploadError = ref<string>()
const uploadSuccess = ref(false)
const notebookMetadata = ref<any>()

// Computed
const hasFiles = computed(() => selectedFile.value || attachments.value.length > 0)

// Methods
const triggerFileSelect = () => {
  fileInput.value?.click()
}

const triggerAttachmentSelect = () => {
  attachmentInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    selectFile(file)
  }
}

const handleAttachmentSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])
  addAttachments(files)
}

const selectFile = async (file: File) => {
  // 验证文件
  const validation = LabApiService.validateNotebookFile(file)
  if (!validation.isValid) {
    uploadError.value = validation.errors.join(', ')
    return
  }

  selectedFile.value = file

  try {
    // 读取并解析 notebook
    const notebook = await LabApiService.readNotebookFile(file)
    notebookMetadata.value = LabApiService.extractNotebookMetadata(notebook)
    emit('file-selected', file)
  } catch (error) {
    uploadError.value = error instanceof Error ? error.message : '文件解析失败'
  }
}

const removeFile = () => {
  selectedFile.value = undefined
  notebookMetadata.value = undefined
  clearError()
}

const clearError = () => {
  uploadError.value = undefined
  uploadSuccess.value = false
}

// 拖拽处理
const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false

  const files = Array.from(event.dataTransfer?.files || [])
  const notebookFile = files.find(file => file.name.endsWith('.ipynb'))

  if (notebookFile) {
    selectFile(notebookFile)
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
}

const handleDragEnter = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
}

// 附件拖拽处理
const handleAttachmentDrop = (event: DragEvent) => {
  event.preventDefault()
  isAttachmentDragOver.value = false

  const files = Array.from(event.dataTransfer?.files || [])
  addAttachments(files)
}

const handleAttachmentDragOver = (event: DragEvent) => {
  event.preventDefault()
}

const handleAttachmentDragEnter = (event: DragEvent) => {
  event.preventDefault()
  isAttachmentDragOver.value = true
}

const handleAttachmentDragLeave = (event: DragEvent) => {
  event.preventDefault()
  isAttachmentDragOver.value = false
}

const addAttachments = (files: File[]) => {
  const remainingSlots = 10 - attachments.value.length
  const filesToAdd = files.slice(0, remainingSlots)

  if (filesToAdd.length < files.length) {
    console.warn('只能添加最多 10 个附件文件')
  }

  attachments.value.push(...filesToAdd)
}

const removeAttachment = (index: number) => {
  attachments.value.splice(index, 1)
}

// 工具方法
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 公开方法
const upload = async (labData: CreateLabTemplateDto): Promise<any> => {
  if (!selectedFile.value) {
    throw new Error('请选择要上传的 Notebook 文件')
  }

  isUploading.value = true
  uploadError.value = undefined
  uploadSuccess.value = false
  uploadProgress.value = 0

  try {
    const template = await LabApiService.createLabTemplate(
      labData,
      selectedFile.value,
      attachments.value
    )

    uploadSuccess.value = true
    emit('upload-success', template)

    // 重置状态
    setTimeout(() => {
      reset()
    }, 2000)

    return template
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '上传失败'
    uploadError.value = errorMessage
    emit('upload-error', errorMessage)
    throw error
  } finally {
    isUploading.value = false
  }
}

const reset = () => {
  selectedFile.value = undefined
  attachments.value = []
  notebookMetadata.value = undefined
  uploadError.value = undefined
  uploadSuccess.value = false
  uploadProgress.value = 0
  isUploading.value = false
}

// 暴露方法给父组件
defineExpose({
  upload,
  reset,
  hasFile: hasFiles,
  selectedFile: selectedFile,
  attachments: attachments
})
</script>

<style scoped>
.notebook-uploader {
  width: 100%;
}

.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  transition: all 0.2s ease;
  background-color: #f9fafb;
}

.upload-area:hover {
  border-color: #6366f1;
  background-color: #f3f4f6;
}

.upload-area--dragover {
  border-color: #6366f1;
  background-color: #ede9fe;
}

.upload-area--error {
  border-color: #ef4444;
  background-color: #fef2f2;
}

.upload-area--success {
  border-color: #10b981;
  background-color: #ecfdf5;
}

.upload-placeholder .upload-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 1rem;
  color: #6b7280;
}

.upload-text h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.upload-text p {
  margin: 0.25rem 0;
  color: #6b7280;
}

.upload-hint {
  font-size: 0.875rem;
  color: #9ca3af;
}

.link-button {
  background: none;
  border: none;
  color: #6366f1;
  text-decoration: underline;
  cursor: pointer;
  font: inherit;
}

.link-button:hover {
  color: #4f46e5;
}

.file-selected {
  display: flex;
  align-items: center;
  gap: 1rem;
  text-align: left;
}

.file-icon {
  width: 48px;
  height: 48px;
  color: #6366f1;
  flex-shrink: 0;
}

.file-info {
  flex: 1;
}

.file-info h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.file-info p {
  margin: 0 0 0.5rem 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.metadata {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.file-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.upload-progress {
  display: flex;
  align-items: center;
  gap: 1rem;
  text-align: left;
}

.progress-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.progress-info h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.progress-info p {
  margin: 0 0 0.5rem 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.progress-bar {
  width: 200px;
  height: 8px;
  background-color: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #6366f1;
  transition: width 0.3s ease;
}

.upload-success {
  display: flex;
  align-items: center;
  gap: 1rem;
  text-align: left;
}

.success-icon {
  width: 48px;
  height: 48px;
  color: #10b981;
  flex-shrink: 0;
}

.success-text h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.success-text p {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.file-input {
  display: none;
}

.upload-error {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.error-icon {
  width: 20px;
  height: 20px;
  color: #ef4444;
  flex-shrink: 0;
}

.error-message {
  flex: 1;
}

.error-message h4 {
  margin: 0 0 0.25rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

.error-message p {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.attachments-section {
  margin-top: 2rem;
}

.attachments-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.attachment-drop-zone {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.2s ease;
  background-color: #f9fafb;
}

.attachment-drop-zone:hover,
.attachment-drop-zone--dragover {
  border-color: #6366f1;
  background-color: #f3f4f6;
}

.attachment-upload-content svg {
  width: 32px;
  height: 32px;
  margin: 0 auto 0.75rem;
  color: #6b7280;
}

.attachment-upload-content p {
  margin: 0.25rem 0;
  color: #6b7280;
}

.attachment-hint {
  font-size: 0.75rem;
  color: #9ca3af;
}

.attachments-list {
  margin-top: 1rem;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  margin-bottom: 0.5rem;
}

.attachment-icon {
  width: 24px;
  height: 24px;
  color: #6b7280;
  flex-shrink: 0;
}

.attachment-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.attachment-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
}

.attachment-size {
  font-size: 0.75rem;
  color: #6b7280;
}

.attachment-remove {
  width: 20px;
  height: 20px;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.attachment-remove:hover {
  background-color: #e5e7eb;
  color: #ef4444;
}
</style>