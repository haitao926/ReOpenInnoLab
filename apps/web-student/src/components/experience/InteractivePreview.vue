<template>
  <div class="interactive-preview">
    <div class="preview-header">
      <h4>{{ experience.title }}</h4>
      <div class="preview-controls">
        <el-button-group size="small">
          <el-button
            :type="previewMode === 'desktop' ? 'primary' : 'default'"
            @click="setPreviewMode('desktop')"
          >
            <el-icon><Monitor /></el-icon>
          </el-button>
          <el-button
            :type="previewMode === 'tablet' ? 'primary' : 'default'"
            @click="setPreviewMode('tablet')"
          >
            <el-icon><Iphone /></el-icon>
          </el-button>
          <el-button
            :type="previewMode === 'mobile' ? 'primary' : 'default'"
            @click="setPreviewMode('mobile')"
          >
            <el-icon><Cellphone /></el-icon>
          </el-button>
        </el-button-group>
        <el-button
          type="primary"
          size="small"
          @click="enterFullscreen"
        >
          <el-icon><FullScreen /></el-icon>
          全屏
        </el-button>
      </div>
    </div>

    <div class="preview-container" :class="`preview-${previewMode}`">
      <div class="preview-frame">
        <iframe
          :src="experience.url"
          :style="getFrameStyle()"
          frameborder="0"
          class="experience-frame"
          @load="onFrameLoad"
          @error="onFrameError"
        />

        <!-- 加载状态 -->
        <div v-if="loading" class="frame-loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          <p>正在加载体验内容...</p>
        </div>

        <!-- 错误状态 -->
        <div v-if="error" class="frame-error">
          <el-icon><WarningFilled /></el-icon>
          <p>加载失败：{{ errorMessage }}</p>
          <el-button size="small" @click="retryLoad">重试</el-button>
        </div>
      </div>
    </div>

    <div class="preview-info">
      <div class="info-item">
        <span class="info-label">技术栈：</span>
        <div class="tech-tags">
          <EduTag
            v-for="tech in experience.technologies"
            :key="tech"
            variant="info"
            size="xs"
          >
            {{ tech }}
          </EduTag>
        </div>
      </div>
      <div class="info-item">
        <span class="info-label">预计时长：</span>
        <span>{{ experience.estimatedDuration }} 分钟</span>
      </div>
      <div class="info-item">
        <span class="info-label">难度等级：</span>
        <EduTag
          :variant="getDifficultyVariant(experience.difficulty)"
          size="xs"
        >
          {{ experience.difficulty }}
        </EduTag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Monitor,
  Iphone,
  Cellphone,
  FullScreen,
  Loading,
  WarningFilled
} from '@element-plus/icons-vue'

import EduTag from '@reopeninnolab/ui-kit'

interface Experience {
  id: string
  title: string
  url: string
  technologies: string[]
  estimatedDuration: number
  difficulty: 'easy' | 'medium' | 'hard'
  description?: string
}

interface Props {
  experience: Experience
}

const props = defineProps<Props>()

const emit = defineEmits<{
  fullscreen: []
  start: []
}>()

// 响应式数据
const previewMode = ref<'desktop' | 'tablet' | 'mobile'>('desktop')
const loading = ref(false)
const error = ref(false)
const errorMessage = ref('')

// 计算属性
const getFrameStyle = () => {
  const styles = {
    desktop: {
      width: '100%',
      height: '400px'
    },
    tablet: {
      width: '768px',
      height: '500px',
      maxWidth: '100%'
    },
    mobile: {
      width: '375px',
      height: '600px',
      maxWidth: '100%'
    }
  }

  return styles[previewMode.value]
}

// 方法
const getDifficultyVariant = (difficulty: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' | 'default' => {
  switch (difficulty) {
    case 'easy':
      return 'success'
    case 'medium':
      return 'warning'
    case 'hard':
      return 'danger'
    default:
      return 'default'
  }
}

const setPreviewMode = (mode: 'desktop' | 'tablet' | 'mobile') => {
  previewMode.value = mode
  ElMessage.info(`切换到${mode === 'desktop' ? '桌面' : mode === 'tablet' ? '平板' : '手机'}预览模式`)
}

const enterFullscreen = () => {
  emit('fullscreen')
  ElMessage.info('进入全屏模式')
}

const onFrameLoad = () => {
  loading.value = false
  error.value = false
}

const onFrameError = () => {
  loading.value = false
  error.value = true
  errorMessage.value = '网络连接失败或内容加载错误'
}

const retryLoad = () => {
  loading.value = true
  error.value = false
  errorMessage.value = ''

  // 重新加载iframe
  const iframe = document.querySelector('.experience-frame') as HTMLIFrameElement
  if (iframe) {
    iframe.src = iframe.src
  }
}

// 初始化加载状态
loading.value = true
</script>

<style scoped lang="scss">
.interactive-preview {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  padding: 16px;
  backdrop-filter: blur(14px);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.preview-header h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin: 0;
}

.preview-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-container {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
  min-height: 200px;
}

.preview-frame {
  background: white;
  border-radius: 12px;
  border: 2px solid rgba(15, 23, 42, 0.1);
  overflow: hidden;
  position: relative;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.1);
}

.experience-frame {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
}

.frame-loading,
.frame-error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  gap: 12px;
  color: var(--edu-text-secondary);

  .el-icon {
    font-size: 32px;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

.frame-error {
  color: var(--edu-danger-500);

  .el-icon {
    color: var(--edu-danger-500);
  }
}

.preview-info {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.info-label {
  color: var(--edu-text-secondary);
  font-weight: 500;
  min-width: 60px;
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

// 响应式设计
@media (max-width: 768px) {
  .interactive-preview {
    padding: 12px;
  }

  .preview-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .preview-controls {
    width: 100%;
    justify-content: space-between;
  }

  .preview-container {
    margin-bottom: 12px;
  }

  .preview-info {
    flex-direction: column;
    gap: 8px;
  }

  .info-item {
    flex-wrap: wrap;
  }
}

// 预览模式特定样式
.preview-mobile {
  .preview-frame {
    background: #f8f9fa;
    border-radius: 20px;
    padding: 10px;

    &::before {
      content: '';
      display: block;
      width: 120px;
      height: 20px;
      background: #333;
      border-radius: 10px;
      margin: 0 auto 10px;
    }
  }
}

.preview-tablet {
  .preview-frame {
    background: #f8f9fa;
    border-radius: 16px;
    padding: 8px;
  }
}
</style>