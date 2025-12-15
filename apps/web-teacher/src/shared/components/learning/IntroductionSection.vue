<template>
  <div class="introduction-section">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      :disabled="readonly"
    >
      <!-- 基本信息 -->
      <el-card class="section-card">
        <template #header>
          <div class="card-header">
            <el-icon><VideoPlay /></el-icon>
            <span>引入内容</span>
          </div>
        </template>

        <!-- 视频资源 -->
        <el-form-item label="引入视频" prop="video">
          <div v-if="formData.video" class="video-preview">
            <video
              :src="formData.video.url"
              :poster="formData.video.cover"
              controls
              class="video-player"
            />
            <div class="video-info">
              <h4>{{ formData.video.title }}</h4>
              <p>时长：{{ formatDuration(formData.video.duration) }}</p>
              <el-button
                v-if="!readonly"
                type="danger"
                size="small"
                @click="removeVideo"
              >
                删除视频
              </el-button>
            </div>
          </div>
          <el-upload
            v-else
            class="video-uploader"
            :action="uploadUrl"
            :show-file-list="false"
            accept="video/*"
            :on-success="handleVideoUpload"
          >
            <el-button type="primary">
              <el-icon><Upload /></el-icon>
              上传视频
            </el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持 mp4, avi, mov 格式，文件大小不超过 500MB
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <!-- 引入文本 -->
        <el-form-item label="引入描述" prop="text">
          <el-input
            v-model="formData.text"
            type="textarea"
            :rows="4"
            placeholder="请输入课程引入描述，说明本节课的学习背景和意义..."
          />
        </el-form-item>

        <!-- 学习目标 -->
        <el-form-item label="学习目标" prop="objectives">
          <div class="objectives-list">
            <div
              v-for="(objective, index) in formData.objectives"
              :key="index"
              class="objective-item"
            >
              <el-input
                v-model="formData.objectives[index]"
                placeholder="请输入学习目标..."
              />
              <el-button
                v-if="!readonly && formData.objectives.length > 1"
                type="text"
                size="small"
                @click="removeObjective(index)"
              >
                删除
              </el-button>
            </div>
            <el-button
              v-if="!readonly"
              type="dashed"
              size="small"
              @click="addObjective"
            >
              添加目标
            </el-button>
          </div>
        </el-form-item>

        <!-- 关键问题 -->
        <el-form-item label="关键问题" prop="keyQuestions">
          <div class="questions-list">
            <div
              v-for="(question, index) in formData.keyQuestions"
              :key="index"
              class="question-item"
            >
              <el-input
                v-model="formData.keyQuestions[index]"
                placeholder="请输入关键问题..."
              />
              <el-button
                v-if="!readonly && formData.keyQuestions.length > 1"
                type="text"
                size="small"
                @click="removeQuestion(index)"
              >
                删除
              </el-button>
            </div>
            <el-button
              v-if="!readonly"
              type="dashed"
              size="small"
              @click="addQuestion"
            >
              添加问题
            </el-button>
          </div>
        </el-form-item>
      </el-card>

      <!-- 图片资源 -->
      <el-card class="section-card">
        <template #header>
          <div class="card-header">
            <el-icon><Picture /></el-icon>
            <span>辅助图片</span>
          </div>
        </template>

        <div class="images-grid">
          <div
            v-for="(image, index) in formData.images"
            :key="image.id"
            class="image-item"
          >
            <el-image
              :src="image.url"
              :alt="image.alt"
              fit="cover"
              class="image-preview"
            />
            <div class="image-info">
              <el-input
                v-model="image.alt"
                placeholder="图片描述"
                size="small"
              />
              <el-button
                v-if="!readonly"
                type="danger"
                size="small"
                @click="removeImage(index)"
              >
                删除
              </el-button>
            </div>
          </div>
          <div
            v-if="!readonly"
            class="image-upload"
          >
            <el-upload
              class="image-uploader"
              :action="uploadUrl"
              :show-file-list="false"
              accept="image/*"
              :on-success="handleImageUpload"
            >
              <el-icon><Plus /></el-icon>
              <div class="upload-text">上传图片</div>
            </el-upload>
          </div>
        </div>
      </el-card>
    </el-form>

    <!-- 操作按钮 -->
    <div v-if="!readonly" class="section-actions">
      <el-button @click="handleReset">重置</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { VideoPlay, Picture, Upload, Plus } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'
import type { IntroductionData } from '@/shared/types/course'

// Props
const props = defineProps<{
  data?: IntroductionData
  config?: any
  readonly?: boolean
}>()

// Emits
const emit = defineEmits<{
  saved: [data: IntroductionData]
  changed: [data: IntroductionData]
}>()

// 表单引用
const formRef = ref<FormInstance>()

// 上传地址
const uploadUrl = '/api/upload/resource'

// 表单数据
const formData = reactive<IntroductionData>({
  video: undefined,
  images: [],
  text: '',
  objectives: [''],
  keyQuestions: ['']
})

// 表单验证规则
const rules = {
  text: [
    { required: true, message: '请输入课程引入描述', trigger: 'blur' }
  ],
  objectives: [
    { required: true, message: '请至少添加一个学习目标', trigger: 'change' }
  ],
  keyQuestions: [
    { required: true, message: '请至少添加一个关键问题', trigger: 'change' }
  ]
}

// 方法
const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const handleVideoUpload = (response: any) => {
  formData.video = {
    id: response.id,
    url: response.url,
    title: response.name,
    duration: response.duration,
    cover: response.cover
  }
  handleChange()
}

const removeVideo = () => {
  formData.video = undefined
  handleChange()
}

const handleImageUpload = (response: any) => {
  formData.images.push({
    id: response.id,
    url: response.url,
    title: response.name,
    alt: ''
  })
  handleChange()
}

const removeImage = (index: number) => {
  formData.images.splice(index, 1)
  handleChange()
}

const addObjective = () => {
  formData.objectives.push('')
}

const removeObjective = (index: number) => {
  formData.objectives.splice(index, 1)
  handleChange()
}

const addQuestion = () => {
  formData.keyQuestions.push('')
}

const removeQuestion = (index: number) => {
  formData.keyQuestions.splice(index, 1)
  handleChange()
}

const handleReset = () => {
  if (props.data) {
    Object.assign(formData, props.data)
  } else {
    Object.assign(formData, {
      video: undefined,
      images: [],
      text: '',
      objectives: [''],
      keyQuestions: ['']
    })
  }
}

const handleSave = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    // 过滤空的目标和问题
    const cleanData = {
      ...formData,
      objectives: formData.objectives.filter(o => o.trim()),
      keyQuestions: formData.keyQuestions.filter(q => q.trim())
    }

    emit('saved', cleanData)
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('Validation failed:', error)
  }
}

const handleChange = () => {
  emit('changed', formData)
}

// 监听数据变化
watch(
  () => props.data,
  (newData) => {
    if (newData) {
      Object.assign(formData, {
        video: newData.video || undefined,
        images: newData.images || [],
        text: newData.text || '',
        objectives: newData.objectives?.length ? newData.objectives : [''],
        keyQuestions: newData.keyQuestions?.length ? newData.keyQuestions : ['']
      })
    }
  },
  { immediate: true, deep: true }
)

// 初始化
onMounted(() => {
  if (props.data) {
    Object.assign(formData, props.data)
  }
})
</script>

<style scoped lang="scss">
.introduction-section {
  .section-card {
    margin-bottom: var(--spacing-lg);

    .card-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      font-weight: var(--font-weight-semibold);
    }
  }

  .video-preview {
    display: flex;
    gap: var(--spacing-md);

    .video-player {
      width: 400px;
      height: 225px;
      border-radius: var(--border-radius-base);
    }

    .video-info {
      flex: 1;

      h4 {
        margin: 0 0 var(--spacing-xs) 0;
      }
    }
  }

  .objectives-list,
  .questions-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);

    .objective-item,
    .question-item {
      display: flex;
      gap: var(--spacing-sm);
      align-items: center;
    }
  }

  .images-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--spacing-md);

    .image-item {
      position: relative;

      .image-preview {
        width: 100%;
        height: 150px;
        border-radius: var(--border-radius-base);
      }

      .image-info {
        margin-top: var(--spacing-xs);
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
      }
    }

    .image-upload {
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px dashed var(--border-color);
      border-radius: var(--border-radius-base);
      height: 150px;

      :deep(.image-uploader) {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;

        .el-icon {
          font-size: 28px;
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-xs);
        }

        .upload-text {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }
      }
    }
  }

  .section-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-xl);
  }
}
</style>