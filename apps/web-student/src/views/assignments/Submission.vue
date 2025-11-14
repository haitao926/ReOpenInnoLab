<template>
  <StudentCourseLayout>
    <div class="assignment-submission">
      <div class="submission-header">
        <h2>{{ assignment.title }}</h2>
        <div class="submission-meta">
          <EduTag :variant="getSubjectVariant(assignment.subject)">
            {{ getSubjectName(assignment.subject) }}
          </EduTag>
          <span class="due-date">
            <el-icon><Clock /></el-icon>
            截止时间：{{ formatDate(assignment.dueDate) }}
          </span>
          <EduTag :variant="getStatusVariant(assignment.status)" size="sm">
            {{ getStatusText(assignment.status) }}
          </EduTag>
        </div>
      </div>

      <div class="submission-content">
        <!-- 作业说明 -->
        <div class="assignment-description">
          <h3>作业说明</h3>
          <div class="description-content" v-html="assignment.description"></div>
        </div>

        <!-- 附件下载 -->
        <div v-if="assignment.attachments && assignment.attachments.length > 0" class="assignment-attachments">
          <h3>相关附件</h3>
          <div class="attachment-list">
            <div
              v-for="attachment in assignment.attachments"
              :key="attachment.id"
              class="attachment-item"
            >
              <div class="attachment-icon">
                <el-icon><Document /></el-icon>
              </div>
              <div class="attachment-info">
                <span class="attachment-name">{{ attachment.name }}</span>
                <span class="attachment-size">{{ formatFileSize(attachment.size) }}</span>
              </div>
              <el-button type="text" size="small" @click="downloadAttachment(attachment)">
                下载
              </el-button>
            </div>
          </div>
        </div>

        <!-- 提交区域 -->
        <div class="submission-area">
          <h3>作业提交</h3>

          <!-- 文件上传 -->
          <div class="upload-section">
            <el-upload
              v-model:file-list="submittedFiles"
              :action="uploadUrl"
              :before-upload="beforeUpload"
              :on-success="handleUploadSuccess"
              :on-remove="handleRemoveFile"
              multiple
              drag
              class="submission-upload"
            >
              <el-icon class="upload-icon"><UploadFilled /></el-icon>
              <div class="upload-text">
                <p>点击或拖拽文件到此处上传</p>
                <p class="upload-hint">支持多个文件上传，单个文件不超过100MB</p>
              </div>
            </el-upload>
          </div>

          <!-- 在线编辑器 -->
          <div v-if="assignment.allowOnlineEditor" class="editor-section">
            <h4>在线编辑</h4>
            <div class="editor-toolbar">
              <el-button-group>
                <el-button
                  v-for="lang in supportedLanguages"
                  :key="lang"
                  :type="currentLanguage === lang ? 'primary' : 'default'"
                  size="small"
                  @click="switchLanguage(lang)"
                >
                  {{ lang.toUpperCase() }}
                </el-button>
              </el-button-group>
            </div>
            <div class="editor-container">
              <textarea
                v-model="codeContent"
                class="code-editor"
                :placeholder="getEditorPlaceholder()"
              />
            </div>
          </div>

          <!-- 提交说明 -->
          <div class="submission-notes">
            <h4>提交说明</h4>
            <el-input
              v-model="submissionNotes"
              type="textarea"
              :rows="3"
              placeholder="请输入对作业的说明或备注（可选）"
            />
          </div>
        </div>

        <!-- 提交操作 -->
        <div class="submission-actions">
          <el-button size="large" @click="saveDraft">
            <el-icon><Document /></el-icon>
            保存草稿
          </el-button>
          <el-button
            type="primary"
            size="large"
            @click="submitAssignment"
            :disabled="!canSubmit"
            :loading="submitting"
          >
            <el-icon><Upload /></el-icon>
            提交作业
          </el-button>
        </div>
      </div>
    </div>
  </StudentCourseLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Clock, Document, UploadFilled, Upload } from '@element-plus/icons-vue'
import StudentCourseLayout from '@/components/layout/StudentCourseLayout.vue'
import EduTag from '@reopeninnolab/ui-kit'

const route = useRoute()
const router = useRouter()

interface Assignment {
  id: string
  title: string
  subject: string
  description: string
  dueDate: string
  status: 'pending' | 'submitted' | 'graded' | 'overdue'
  allowOnlineEditor: boolean
  attachments?: Attachment[]
}

interface Attachment {
  id: string
  name: string
  size: number
}

const assignment = ref<Assignment>({
  id: route.params.id as string,
  title: 'Python变量练习',
  subject: 'ai',
  description: '<p>请完成以下Python变量和数据类型的练习：</p><ul><li>创建不同类型的变量</li><li>理解变量命名规则</li><li>掌握数据类型转换</li></ul>',
  dueDate: '2024-01-20T23:59:59',
  status: 'pending',
  allowOnlineEditor: true,
  attachments: [
    {
      id: '1',
      name: '练习题库.pdf',
      size: 2048576
    },
    {
      id: '2',
      name: '参考资料.docx',
      size: 1024000
    }
  ]
})

const submittedFiles = ref([])
const codeContent = ref('')
const submissionNotes = ref('')
const currentLanguage = ref('python')
const submitting = ref(false)

const supportedLanguages = ['python', 'javascript', 'java']

const uploadUrl = '/api/upload'

const canSubmit = computed(() => {
  return submittedFiles.value.length > 0 || codeContent.value.trim() !== ''
})

const getSubjectVariant = (subject: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' | 'default' => {
  return subject === 'ai' ? 'primary' : 'info'
}

const getSubjectName = (subject: string): string => {
  return subject === 'ai' ? '人工智能' : '综合'
}

const getStatusVariant = (status: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' | 'default' => {
  switch (status) {
    case 'graded':
      return 'success'
    case 'submitted':
      return 'info'
    case 'overdue':
      return 'danger'
    case 'pending':
      return 'warning'
    default:
      return 'default'
  }
}

const getStatusText = (status: string): string => {
  switch (status) {
    case 'graded':
      return '已评分'
    case 'submitted':
      return '已提交'
    case 'overdue':
      return '已逾期'
    case 'pending':
      return '待提交'
    default:
      return '未知'
  }
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatFileSize = (size: number): string => {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

const getEditorPlaceholder = (): string => {
  const placeholders = {
    python: '# 在这里编写Python代码\n# 例如：\nname = "张三"\nage = 16\nprint(f"我的名字是{name}，今年{age}岁")',
    javascript: '// 在这里编写JavaScript代码\n// 例如：\nconst name = "张三";\nconst age = 16;\nconsole.log(`我的名字是${name}，今年${age}岁`);',
    java: '// 在这里编写Java代码\n// 例如：\npublic class Student {\n    public static void main(String[] args) {\n        String name = "张三";\n        int age = 16;\n        System.out.println("我的名字是" + name + "，今年" + age + "岁");\n    }\n}'
  }
  return placeholders[currentLanguage.value] || placeholders.python
}

const beforeUpload = (file: File) => {
  const isLt100M = file.size / 1024 / 1024 < 100
  if (!isLt100M) {
    ElMessage.error('文件大小不能超过100MB!')
    return false
  }
  return true
}

const handleUploadSuccess = (response: any, file: any) => {
  ElMessage.success(`${file.name} 上传成功`)
}

const handleRemoveFile = (file: any) => {
  ElMessage.info(`${file.name} 已移除`)
}

const switchLanguage = (lang: string) => {
  currentLanguage.value = lang
  ElMessage.info(`切换到 ${lang.toUpperCase()} 编辑器`)
}

const saveDraft = () => {
  ElMessage.success('草稿已保存')
}

const submitAssignment = async () => {
  if (!canSubmit.value) {
    ElMessage.warning('请先上传文件或填写内容')
    return
  }

  submitting.value = true

  try {
    // 模拟提交
    await new Promise(resolve => setTimeout(resolve, 2000))

    assignment.value.status = 'submitted'
    ElMessage.success('作业提交成功!')

    setTimeout(() => {
      router.push('/assignments')
    }, 1500)
  } catch (error) {
    ElMessage.error('提交失败，请重试')
  } finally {
    submitting.value = false
  }
}

const downloadAttachment = (attachment: Attachment) => {
  ElMessage.info(`开始下载：${attachment.name}`)
}

onMounted(() => {
  // 加载作业详情
})
</script>

<style scoped lang="scss">
.assignment-submission {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.submission-header {
  text-align: center;
}

.submission-header h2 {
  font-size: 28px;
  font-weight: 700;
  color: var(--edu-text-primary);
  margin: 0 0 12px 0;
}

.submission-meta {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.due-date {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--edu-text-secondary);
}

.assignment-description,
.assignment-attachments,
.submission-area {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  padding: 24px;
  backdrop-filter: blur(14px);
}

.assignment-description h3,
.assignment-attachments h3,
.submission-area h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin: 0 0 16px 0;
}

.description-content {
  font-size: 15px;
  line-height: 1.7;
  color: var(--edu-text-primary);

  :deep(p) {
    margin: 0 0 12px 0;
  }

  :deep(ul), :deep(ol) {
    margin: 12px 0;
    padding-left: 24px;
  }

  :deep(li) {
    margin-bottom: 6px;
  }
}

.attachment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(15, 23, 42, 0.04);
  border-radius: 8px;
  transition: background-color var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    background: rgba(99, 102, 241, 0.08);
  }
}

.attachment-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(99, 102, 241, 0.12);
  color: var(--edu-primary-600);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.attachment-info {
  flex: 1;
  min-width: 0;
}

.attachment-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--edu-text-primary);
  display: block;
  margin-bottom: 2px;
}

.attachment-size {
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.upload-section {
  margin-bottom: 32px;
}

.submission-upload {
  width: 100%;
}

.upload-icon {
  font-size: 48px;
  color: var(--edu-primary-500);
  margin-bottom: 16px;
}

.upload-text {
  text-align: center;
  color: var(--edu-text-primary);
}

.upload-text p {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 500;
}

.upload-hint {
  font-size: 14px !important;
  color: var(--edu-text-secondary) !important;
  font-weight: normal !important;
}

.editor-section {
  margin-bottom: 32px;
}

.editor-section h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin: 0 0 12px 0;
}

.editor-toolbar {
  margin-bottom: 12px;
}

.editor-container {
  border: 2px solid var(--edu-border-color);
  border-radius: 12px;
  overflow: hidden;
}

.code-editor {
  width: 100%;
  min-height: 200px;
  padding: 16px;
  font-family: var(--edu-font-family-mono);
  font-size: 14px;
  line-height: 1.5;
  border: none;
  outline: none;
  resize: vertical;
  background: var(--edu-bg-color);
  color: var(--edu-text-primary);
}

.submission-notes {
  margin-bottom: 32px;
}

.submission-notes h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin: 0 0 12px 0;
}

.submission-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

@media (max-width: 768px) {
  .submission-header {
    gap: 16px;
  }

  .submission-header h2 {
    font-size: 24px;
  }

  .submission-meta {
    gap: 12px;
    flex-direction: column;
    align-items: center;
  }

  .assignment-description,
  .assignment-attachments,
  .submission-area {
    padding: 20px;
  }

  .submission-actions {
    flex-direction: column;
    gap: 12px;
  }

  .submission-actions .el-button {
    width: 100%;
  }
}
</style>