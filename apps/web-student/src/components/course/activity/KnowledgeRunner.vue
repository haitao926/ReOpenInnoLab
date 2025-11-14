<template>
  <div class="knowledge-runner">
    <!-- AI助手 -->
    <ContextAwareAIAssistant
      :activity-context="context"
      :show-label="false"
      :position="'bottom-right'"
      :floating-hints="true"
      :auto-open="false"
    />

    <!-- 加载状态 -->
    <div v-if="loading" class="knowledge-loading">
      <el-loading-service />
      <p>正在加载知识内容...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="knowledge-error">
      <el-result
        icon="error"
        title="加载失败"
        :sub-title="error"
      >
        <template #extra>
          <el-button type="primary" @click="retryLoading">重新加载</el-button>
        </template>
      </el-result>
    </div>

    <!-- 知识内容渲染 -->
    <div v-else-if="content" class="knowledge-content">
      <!-- 视频内容 -->
      <div v-if="config.contentType === 'video' && config.videoConfig" class="video-content">
        <VideoPlayer
          :config="config.videoConfig"
          @progress="handleVideoProgress"
          @complete="handleVideoComplete"
        />
      </div>

      <!-- PPT内容 -->
      <div v-else-if="config.contentType === 'ppt' && config.pptConfig" class="ppt-content">
        <PPTViewer
          :config="config.pptConfig"
          @slide-change="handleSlideChange"
          @complete="handlePPTComplete"
        />
      </div>

      <!-- 文本内容 -->
      <div v-else-if="config.contentType === 'text'" class="text-content">
        <div class="text-body" v-html="content"></div>
        <div class="text-actions">
          <el-button type="primary" @click="markAsComplete">
            <el-icon><Check /></el-icon>
            完成学习
          </el-button>
        </div>
      </div>

      <!-- 文档内容 -->
      <div v-else-if="config.contentType === 'document'" class="document-content">
        <DocumentViewer
          :content="content"
          :format="documentFormat"
          @progress="handleDocumentProgress"
          @complete="handleDocumentComplete"
        />
      </div>

      <!-- 交互式内容 -->
      <div v-else-if="config.contentType === 'interactive'" class="interactive-content">
        <InteractiveViewer
          :content="content"
          @progress="handleInteractiveProgress"
          @complete="handleInteractiveComplete"
        />
      </div>

      <!-- 关键点提示 -->
      <div v-if="config.keyPoints?.length" class="key-points">
        <h4>
          <el-icon><Star /></el-icon>
          关键要点
        </h4>
        <ul>
          <li v-for="point in config.keyPoints" :key="point">{{ point }}</li>
        </ul>
      </div>

      <!-- 扩展资源 -->
      <div v-if="config.resources?.length" class="knowledge-resources">
        <h4>
          <el-icon><FolderOpened /></el-icon>
          扩展资源
        </h4>
        <div class="resources-grid">
          <div
            v-for="resource in config.resources"
            :key="resource.id"
            class="resource-item"
            @click="openResource(resource)"
          >
            <EduCard variant="bordered" size="sm">
              <div class="resource-content">
                <div class="resource-icon">
                  <el-icon><component :is="getResourceIcon(resource.type)" /></el-icon>
                </div>
                <div class="resource-info">
                  <h5>{{ resource.title }}</h5>
                  <p class="resource-description">{{ resource.description }}</p>
                </div>
              </div>
            </EduCard>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="knowledge-empty">
      <el-empty description="暂无可用的知识内容" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Check, Star, FolderOpened, Document, VideoCamera, Monitor, MagicStick } from '@element-plus/icons-vue'

import type { KnowledgeConfig, ActivityContext, ActivityResult } from '@/types/course'
import { resourceResolver } from '@/utils/activity-utils'

// 导入子组件（稍后创建）
// import VideoPlayer from './players/VideoPlayer.vue'
// import PPTViewer from './players/PPTViewer.vue'
// import DocumentViewer from './players/DocumentViewer.vue'
// import InteractiveViewer from './players/InteractiveViewer.vue'

// 导入AI助手
import ContextAwareAIAssistant from '@/components/ai/ContextAwareAIAssistant.vue'

import EduCard from '@reopeninnolab/ui-kit'

interface Props {
  config: KnowledgeConfig
  context: ActivityContext
}

interface Emits {
  'complete': [result: ActivityResult]
  'error': [error: Error | string]
  'progress': [progress: number]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const loading = ref(false)
const error = ref<string | null>(null)
const content = ref<any>(null)
const progress = ref(0)

// 计算属性
const documentFormat = computed(() => {
  // 根据资源URL或元数据推断文档格式
  if (props.config.contentUrl) {
    const extension = props.config.contentUrl.split('.').pop()?.toLowerCase()
    return extension || 'txt'
  }
  return 'txt'
})

// 方法
const loadContent = async () => {
  if (!props.config.contentUrl) {
    // 如果没有内容URL，可能是纯文本内容
    content.value = generateDefaultContent()
    return
  }

  loading.value = true
  error.value = null

  try {
    // 创建资源引用
    const resourceRef = {
      type: props.config.contentType as any,
      domain: 'course' as const,
      id: props.config.contentUrl,
      metadata: {
        title: props.context.activity.title,
        description: props.context.activity.description
      }
    }

    // 解析资源
    const resourceData = await resourceResolver.resolveResource(resourceRef)
    content.value = resourceData.content

    ElMessage.success('知识内容加载成功')
  } catch (err) {
    console.error('Failed to load knowledge content:', err)
    error.value = err instanceof Error ? err.message : '加载失败'
    emit('error', error.value)
  } finally {
    loading.value = false
  }
}

const generateDefaultContent = () => {
  // 生成默认的文本内容
  return `
    <div class="default-knowledge-content">
      <h2>${props.context.activity.title}</h2>
      <div class="knowledge-description">
        <p>${props.context.activity.description}</p>
      </div>

      ${props.context.activity.objectives.length > 0 ? `
        <div class="knowledge-objectives">
          <h3>学习目标</h3>
          <ul>
            ${props.context.activity.objectives.map(obj => `<li>${obj}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      <div class="knowledge-instructions">
        <h3>学习说明</h3>
        <p>${props.context.activity.instructions || '请仔细阅读相关材料并完成学习任务。'}</p>
      </div>
    </div>
  `
}

const retryLoading = () => {
  loadContent()
}

const markAsComplete = () => {
  const result: ActivityResult = {
    success: true,
    score: 100,
    maxScore: 100,
    feedback: '知识学习已完成',
    analytics: {
      timeSpent: 0, // 实际应该记录学习时间
      interactions: 1,
      errors: 0,
      hints: 0,
      retries: 0
    }
  }

  emit('complete', result)
  ElMessage.success('学习完成！')
}

// 视频事件处理
const handleVideoProgress = (currentTime: number, duration: number) => {
  const progressPercent = (currentTime / duration) * 100
  progress.value = Math.round(progressPercent)
  emit('progress', progress.value)
}

const handleVideoComplete = () => {
  markAsComplete()
}

// PPT事件处理
const handleSlideChange = (currentSlide: number, totalSlides: number) => {
  const progressPercent = (currentSlide / totalSlides) * 100
  progress.value = Math.round(progressPercent)
  emit('progress', progress.value)
}

const handlePPTComplete = () => {
  markAsComplete()
}

// 文档事件处理
const handleDocumentProgress = (scrollProgress: number) => {
  progress.value = Math.round(scrollProgress)
  emit('progress', progress.value)
}

const handleDocumentComplete = () => {
  markAsComplete()
}

// 交互式内容事件处理
const handleInteractiveProgress = (progressPercent: number) => {
  progress.value = Math.round(progressPercent)
  emit('progress', progress.value)
}

const handleInteractiveComplete = (score?: number, feedback?: string) => {
  const result: ActivityResult = {
    success: true,
    score: score || 100,
    maxScore: 100,
    feedback: feedback || '交互式学习已完成',
    analytics: {
      timeSpent: 0,
      interactions: 1,
      errors: 0,
      hints: 0,
      retries: 0
    }
  }

  emit('complete', result)
}

const getResourceIcon = (type: string) => {
  const iconMap = {
    document: Document,
    video: VideoCamera,
    link: Monitor,
    image: Document,
    interactive: MagicStick
  }
  return iconMap[type as keyof typeof iconMap] || Document
}

const openResource = (resource: any) => {
  if (resource.url) {
    window.open(resource.url, '_blank')
  } else {
    ElMessage.info(`查看资源: ${resource.title}`)
  }
}

// 生命周期
onMounted(() => {
  loadContent()
})
</script>

<style scoped lang="scss">
.knowledge-runner {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 400px;
}

.knowledge-loading,
.knowledge-error,
.knowledge-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 16px;
  color: var(--edu-text-secondary);
}

.knowledge-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.video-content,
.ppt-content,
.document-content,
.interactive-content {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
}

.text-content {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);

  .text-body {
    font-size: 15px;
    line-height: 1.7;
    color: var(--edu-text-primary);
    margin-bottom: 24px;

    :deep(h2) {
      font-size: 18px;
      font-weight: 600;
      color: var(--edu-text-primary);
      margin: 24px 0 16px 0;
      border-bottom: 1px solid var(--edu-border-color);
      padding-bottom: 8px;
    }

    :deep(h3) {
      font-size: 16px;
      font-weight: 600;
      color: var(--edu-text-primary);
      margin: 20px 0 12px 0;
    }

    :deep(p) {
      margin: 0 0 12px 0;

      &:last-child {
        margin-bottom: 0;
      }
    }

    :deep(ul), :deep(ol) {
      margin: 12px 0;
      padding-left: 24px;
    }

    :deep(li) {
      margin-bottom: 6px;
    }
  }

  .text-actions {
    display: flex;
    justify-content: center;
    padding-top: 16px;
    border-top: 1px solid var(--edu-border-color);
  }
}

.key-points,
.knowledge-resources {
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--edu-border-color);

  h4 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: var(--edu-text-primary);
    margin: 0 0 16px 0;
  }
}

.key-points {
  ul {
    margin: 0;
    padding-left: 20px;

    li {
      color: var(--edu-text-primary);
      margin-bottom: 8px;
      line-height: 1.5;

      &:last-child {
        margin-bottom: 0;
      }

      &::marker {
        color: var(--edu-warning-500);
      }
    }
  }
}

.resources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
}

.resource-item {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  }
}

.resource-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
}

.resource-icon {
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

.resource-info {
  flex: 1;
  min-width: 0;
}

.resource-info h5 {
  font-size: 14px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin: 0 0 4px 0;
}

.resource-description {
  font-size: 12px;
  color: var(--edu-text-secondary);
  margin: 0;
  line-height: 1.4;
}

.default-knowledge-content {
  h2 {
    font-size: 20px;
    font-weight: 700;
    color: var(--edu-text-primary);
    margin: 0 0 16px 0;
    border-bottom: 2px solid var(--edu-primary-500);
    padding-bottom: 8px;
  }

  .knowledge-description,
  .knowledge-objectives,
  .knowledge-instructions {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--edu-text-primary);
    margin: 0 0 12px 0;
  }

  p {
    font-size: 15px;
    line-height: 1.6;
    color: var(--edu-text-primary);
    margin: 0;
  }

  ul {
    margin: 0;
    padding-left: 20px;

    li {
      color: var(--edu-text-primary);
      margin-bottom: 6px;
      line-height: 1.5;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .knowledge-runner {
    gap: 20px;
  }

  .text-content {
    padding: 20px;
  }

  .resources-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .resource-content {
    padding: 12px;
    gap: 10px;
  }

  .resource-icon {
    width: 28px;
    height: 28px;
  }
}
</style>