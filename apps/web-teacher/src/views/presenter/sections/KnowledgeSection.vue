<template>
  <div class="knowledge-section">
    <!-- 主要内容区 -->
    <div class="section-content">
      <!-- 内容展示区域 -->
      <div class="content-display">
        <!-- 多媒体内容渲染 -->
        <div class="media-container">
          <!-- 文本内容 -->
          <div v-if="content?.format === 'text'" class="text-content">
            <div class="content-text" v-html="renderedContent"></div>

            <!-- 示例展示 -->
            <div v-if="content?.examples && content.examples.length > 0" class="examples-section">
              <h4 class="examples-title">
                <el-icon><Document /></el-icon>
                示例说明
              </h4>
              <div class="examples-list">
                <div
                  v-for="(example, index) in content.examples"
                  :key="index"
                  class="example-item"
                  :class="{ active: activeExample === index }"
                  @click="setActiveExample(index)"
                >
                  <div class="example-title">{{ example.title }}</div>
                  <div class="example-description">{{ example.description }}</div>
                  <div class="example-code" v-if="example.code">
                    <pre><code>{{ example.code }}</code></pre>
                  </div>
                </div>
              </div>
            </div>

            <!-- 检查点 -->
            <div v-if="content?.checkpoints && content.checkpoints.length > 0" class="checkpoints-section">
              <h4 class="checkpoints-title">
                <el-icon><CircleCheck /></el-icon>
                知识检查点
              </h4>
              <div class="checkpoints-list">
                <div
                  v-for="(checkpoint, index) in content.checkpoints"
                  :key="index"
                  class="checkpoint-item"
                  :class="{ completed: checkpointCompleted[index] }"
                >
                  <div class="checkpoint-question">{{ checkpoint.question }}</div>
                  <div class="checkpoint-options" v-if="checkpoint.options">
                    <el-radio-group
                      v-model="checkpointAnswers[index]"
                      @change="checkAnswer(index)"
                    >
                      <el-radio
                        v-for="(option, optIndex) in checkpoint.options"
                        :key="optIndex"
                        :label="optIndex"
                        class="checkpoint-option"
                      >
                        {{ option }}
                      </el-radio>
                    </el-radio-group>
                  </div>
                  <div class="checkpoint-feedback" v-if="checkpointFeedback[index]">
                    <el-alert
                      :title="checkpointFeedback[index].message"
                      :type="checkpointFeedback[index].type"
                      :closable="false"
                      show-icon
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 视频内容 -->
          <div v-else-if="content?.format === 'video'" class="video-content">
            <MediaPlayer
              :src="content.content"
              :title="title"
              :show-controls="true"
              :autoplay="false"
              @timeupdate="onVideoTimeUpdate"
              @ended="onVideoEnded"
            />

            <!-- 视频章节 -->
            <div v-if="content.chapters && content.chapters.length > 0" class="video-chapters">
              <h4>视频章节</h4>
              <div class="chapters-list">
                <div
                  v-for="(chapter, index) in content.chapters"
                  :key="index"
                  class="chapter-item"
                  @click="seekToTime(chapter.startTime)"
                >
                  <div class="chapter-time">{{ formatTime(chapter.startTime) }}</div>
                  <div class="chapter-title">{{ chapter.title }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 音频内容 -->
          <div v-else-if="content?.format === 'audio'" class="audio-content">
            <div class="audio-player">
              <audio
                ref="audioElement"
                :src="content.content"
                controls
                class="audio-element"
                @timeupdate="onAudioTimeUpdate"
                @ended="onAudioEnded"
              />
            </div>

            <!-- 音频文稿 -->
            <div v-if="content.transcript" class="audio-transcript">
              <h4>音频文稿</h4>
              <div class="transcript-content">
                <div
                  v-for="(segment, index) in content.transcript"
                  :key="index"
                  class="transcript-segment"
                  :class="{ active: isCurrentTranscriptSegment(segment) }"
                >
                  <span class="segment-time">{{ formatTime(segment.startTime) }}</span>
                  <span class="segment-text">{{ segment.text }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 交互式内容 -->
          <div v-else-if="content?.format === 'interactive'" class="interactive-content">
            <HTMLExperience
              :url="content.content"
              :title="title"
              :interactive="true"
              :tracking="true"
              @interaction="onInteractiveInteraction"
            />
          </div>
        </div>
      </div>

      <!-- 侧边栏工具 -->
      <div class="knowledge-sidebar" v-if="showSidebar">
        <!-- 大纲导航 -->
        <div class="outline-navigation">
          <h4>内容大纲</h4>
          <div class="outline-list">
            <div
              v-for="(item, index) in outlineItems"
              :key="index"
              class="outline-item"
              :class="{ active: currentOutlineItem === index }"
              @click="scrollToOutlineItem(index)"
            >
              <div class="outline-level" :style="{ marginLeft: (item.level * 16) + 'px' }">
                {{ item.title }}
              </div>
            </div>
          </div>
        </div>

        <!-- 笔记区域 -->
        <div class="notes-section">
          <h4>
            <el-icon><EditPen /></el-icon>
            教学笔记
          </h4>
          <el-input
            v-model="teachingNotes"
            type="textarea"
            :rows="8"
            placeholder="在这里记录教学要点和注意事项..."
            class="notes-input"
          />
          <el-button
            type="primary"
            size="small"
            @click="saveNotes"
            class="save-notes-btn"
          >
            保存笔记
          </el-button>
        </div>

        <!-- 相关资源 -->
        <div v-if="relatedResources.length > 0" class="related-resources">
          <h4>
            <el-icon><Link /></el-icon>
            相关资源
          </h4>
          <div class="resources-list">
            <div
              v-for="resource in relatedResources"
              :key="resource.id"
              class="resource-item"
              @click="openResource(resource)"
            >
              <el-icon class="resource-icon"><component :is="getResourceIcon(resource.type)" /></el-icon>
              <div class="resource-info">
                <div class="resource-title">{{ resource.title }}</div>
                <div class="resource-type">{{ getResourceTypeLabel(resource.type) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部控制栏 -->
    <div class="section-controls">
      <div class="controls-left">
        <el-button @click="previousSection" :disabled="isFirstSection">
          <el-icon><ArrowLeft /></el-icon>
          上一环节
        </el-button>
      </div>

      <div class="controls-center">
        <el-button-group>
          <el-button @click="toggleWhiteboard" :type="showWhiteboard ? 'primary' : 'default'">
            <el-icon><Edit /></el-icon>
            白板
          </el-button>
          <el-button @click="takeScreenshot">
            <el-icon><Camera /></el-icon>
            截图
          </el-button>
          <el-button @click="generateQuestions">
            <el-icon><QuestionFilled /></el-icon>
            提问
          </el-button>
        </el-button-group>
      </div>

      <div class="controls-right">
        <el-button type="primary" @click="nextSection">
          下一环节
          <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 白板覆盖层 -->
    <div v-if="showWhiteboard" class="whiteboard-overlay">
      <div class="whiteboard-header">
        <span>教学白板</span>
        <el-button size="small" @click="toggleWhiteboard">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
      <AnnotationLayer
        @save="saveWhiteboardAnnotation"
        @close="toggleWhiteboard"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Document,
  CircleCheck,
  EditPen,
  Link,
  ArrowLeft,
  ArrowRight,
  Edit,
  Camera,
  QuestionFilled,
  Close,
  Picture,
  VideoPlay,
  Headphones,
  Monitor
} from '@element-plus/icons-vue'
import MediaPlayer from '@/components/resources/MediaPlayer.vue'
import HTMLExperience from '@/components/resources/HTMLExperience.vue'
import AnnotationLayer from '../components/AnnotationLayer.vue'

interface KnowledgeContent {
  format: 'text' | 'video' | 'audio' | 'interactive'
  content: string | MediaContent
  examples?: Example[]
  checkpoints?: Checkpoint[]
  chapters?: VideoChapter[]
  transcript?: AudioSegment[]
}

interface Example {
  id: string
  title: string
  description: string
  code?: string
  difficulty: 'easy' | 'medium' | 'hard'
}

interface Checkpoint {
  id: string
  question: string
  options?: string[]
  correctAnswer: number | string
  explanation?: string
}

interface VideoChapter {
  startTime: number
  title: string
  description?: string
}

interface AudioSegment {
  startTime: number
  endTime: number
  text: string
}

interface MediaContent {
  type: 'video' | 'audio' | 'image' | 'document'
  url: string
  duration?: number
}

interface OutlineItem {
  level: number
  title: string
  anchor: string
}

interface Resource {
  id: string
  type: 'video' | 'document' | 'link' | 'image'
  title: string
  url: string
}

interface Props {
  content?: KnowledgeContent
  title?: string
  showSidebar?: boolean
  isFirstSection?: boolean
  isLastSection?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '新知讲解',
  showSidebar: true,
  isFirstSection: false,
  isLastSection: false
})

const emit = defineEmits<{
  previous: []
  next: []
  interaction: [type: string, data: any]
  screenshot: [imageData: string]
  annotation: [annotation: any]
}>()

// 响应式数据
const audioElement = ref<HTMLAudioElement>()

const activeExample = ref(0)
const checkpointCompleted = ref<boolean[]>([])
const checkpointAnswers = ref<(number | string)[]>([])
const checkpointFeedback = ref<Array<{ type: string, message: string }>>([])

const currentOutlineItem = ref(0)
const teachingNotes = ref('')
const showWhiteboard = ref(false)

const relatedResources = ref<Resource[]>([
  {
    id: '1',
    type: 'document',
    title: '教学课件PPT',
    url: '/resources/slides.pdf'
  },
  {
    id: '2',
    type: 'video',
    title: '相关视频教程',
    url: '/resources/tutorial.mp4'
  }
])

const outlineItems = ref<OutlineItem[]>([])
const currentTime = ref(0)

// 计算属性
const renderedContent = computed(() => {
  if (!props.content || typeof props.content.content !== 'string') {
    return ''
  }

  // 简单的Markdown渲染
  return props.content.content
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*)\*/g, '<em>$1</em>')
    .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
})

// 方法
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

const setActiveExample = (index: number) => {
  activeExample.value = index
}

const checkAnswer = (checkpointIndex: number) => {
  const checkpoint = props.content?.checkpoints?.[checkpointIndex]
  if (!checkpoint) return

  const userAnswer = checkpointAnswers.value[checkpointIndex]
  const isCorrect = userAnswer === checkpoint.correctAnswer

  checkpointCompleted.value[checkpointIndex] = isCorrect

  checkpointFeedback.value[checkpointIndex] = {
    type: isCorrect ? 'success' : 'error',
    message: isCorrect
      ? '回答正确！'
      : `回答错误。${checkpoint.explanation || ''}`
  }

  emit('interaction', 'checkpoint_answered', {
    checkpointIndex,
    userAnswer,
    isCorrect
  })
}

const onVideoTimeUpdate = (time: number) => {
  currentTime.value = time
}

const onVideoEnded = () => {
  ElMessage.info('视频播放完成')
  emit('interaction', 'video_completed', { duration: currentTime.value })
}

const onAudioTimeUpdate = (time: number) => {
  currentTime.value = time
}

const onAudioEnded = () => {
  ElMessage.info('音频播放完成')
  emit('interaction', 'audio_completed', { duration: currentTime.value })
}

const seekToTime = (seconds: number) => {
  if (audioElement.value) {
    audioElement.value.currentTime = seconds
  }
  // 这里还需要处理视频的跳转
}

const isCurrentTranscriptSegment = (segment: AudioSegment): boolean => {
  return currentTime.value >= segment.startTime && currentTime.value <= segment.endTime
}

const scrollToOutlineItem = (index: number) => {
  currentOutlineItem.value = index
  const item = outlineItems.value[index]
  if (item) {
    const element = document.querySelector(item.anchor)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }
}

const saveNotes = () => {
  ElMessage.success('教学笔记已保存')
  emit('interaction', 'notes_saved', { notes: teachingNotes.value })
}

const getResourceIcon = (type: string) => {
  const icons = {
    video: VideoPlay,
    document: Picture,
    link: Link,
    image: Picture,
    audio: Headphones
  }
  return icons[type as keyof typeof icons] || Document
}

const getResourceTypeLabel = (type: string): string => {
  const labels = {
    video: '视频',
    document: '文档',
    link: '链接',
    image: '图片',
    audio: '音频'
  }
  return labels[type as keyof typeof labels] || type
}

const openResource = (resource: Resource) => {
  if (resource.type === 'link') {
    window.open(resource.url, '_blank')
  } else {
    ElMessage.info(`打开资源: ${resource.title}`)
  }

  emit('interaction', 'resource_opened', resource)
}

const toggleWhiteboard = () => {
  showWhiteboard.value = !showWhiteboard.value
}

const saveWhiteboardAnnotation = (annotation: any) => {
  emit('annotation', annotation)
  ElMessage.success('白板内容已保存')
}

const takeScreenshot = () => {
  // 这里应该实现截图功能
  ElMessage.info('截图功能开发中...')
  // emit('screenshot', imageData)
}

const generateQuestions = () => {
  // AI生成问题
  const questions = [
    '谁能用自己的话解释一下这个概念？',
    '这个知识点在实际应用中有什么例子？',
    '这个概念和我们之前学过的内容有什么联系？'
  ]

  const randomQuestion = questions[Math.floor(Math.random() * questions.length)]

  ElMessage({
    message: randomQuestion,
    type: 'info',
    duration: 0,
    showClose: true
  })

  emit('interaction', 'question_generated', { question: randomQuestion })
}

const onInteractiveInteraction = (data: any) => {
  emit('interaction', 'interactive_content', data)
}

const previousSection = () => {
  emit('previous')
}

const nextSection = () => {
  emit('next')
}

const generateOutline = () => {
  if (!props.content || typeof props.content.content !== 'string') {
    return
  }

  // 简单的大纲生成逻辑
  const content = props.content.content
  const headings = content.match(/^#+\s+(.+)$/gm) || []

  outlineItems.value = headings.map((heading, index) => {
    const level = (heading.match(/^#+/) || [''])[0].length
    const title = heading.replace(/^#+\s+/, '')
    return {
      level,
      title,
      anchor: `#heading-${index}`
    }
  })
}

// 生命周期
onMounted(() => {
  generateOutline()

  // 初始化检查点状态
  if (props.content?.checkpoints) {
    checkpointCompleted.value = new Array(props.content.checkpoints.length).fill(false)
    checkpointAnswers.value = new Array(props.content.checkpoints.length).fill(null)
    checkpointFeedback.value = new Array(props.content.checkpoints.length).fill(null)
  }
})
</script>

<style lang="scss" scoped>
.knowledge-section {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8f9fa;
}

.section-content {
  flex: 1;
  display: flex;
  gap: 24px;
  padding: 24px;
  overflow: hidden;
}

.content-display {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.media-container {
  flex: 1;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: auto;
}

.text-content {
  .content-text {
    font-size: 16px;
    line-height: 1.8;
    color: #303133;

    :deep(h1) {
      color: #409eff;
      border-bottom: 2px solid #409eff;
      padding-bottom: 8px;
      margin: 24px 0 16px 0;
    }

    :deep(h2) {
      color: #67c23a;
      margin: 20px 0 12px 0;
    }

    :deep(h3) {
      color: #e6a23c;
      margin: 16px 0 8px 0;
    }

    :deep(pre) {
      background: #f5f7fa;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      border: 1px solid #e4e7ed;
    }

    :deep(code) {
      background: #f5f7fa;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 14px;
      color: #e6a23c;
    }
  }
}

.examples-section {
  background: #f0f9ff;
  border-radius: 12px;
  padding: 20px;
  border-left: 4px solid #409eff;

  .examples-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 600;
    color: #409eff;
    margin: 0 0 16px 0;
  }

  .examples-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .example-item {
    background: white;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: #409eff;
      box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
    }

    &.active {
      border-color: #409eff;
      background: #f0f9ff;
    }

    .example-title {
      font-weight: 600;
      color: #303133;
      margin-bottom: 8px;
    }

    .example-description {
      color: #606266;
      margin-bottom: 12px;
      line-height: 1.5;
    }

    .example-code {
      background: #f5f7fa;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid #e4e7ed;

      pre {
        margin: 0;
        font-family: 'Monaco', 'Menlo', monospace;
        font-size: 14px;
        color: #303133;
      }
    }
  }
}

.checkpoints-section {
  background: #f0f9ff;
  border-radius: 12px;
  padding: 20px;
  border-left: 4px solid #67c23a;

  .checkpoints-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 600;
    color: #67c23a;
    margin: 0 0 16px 0;
  }

  .checkpoints-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .checkpoint-item {
    background: white;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    padding: 16px;

    &.completed {
      border-color: #67c23a;
      background: #f0f9ff;
    }

    .checkpoint-question {
      font-weight: 600;
      color: #303133;
      margin-bottom: 12px;
    }

    .checkpoint-options {
      margin-bottom: 12px;

      .checkpoint-option {
        display: block;
        margin-bottom: 8px;
      }
    }

    .checkpoint-feedback {
      margin-top: 12px;
    }
  }
}

.video-content,
.audio-content,
.interactive-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.video-chapters,
.audio-transcript {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;

  h4 {
    margin: 0 0 12px 0;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }
}

.chapters-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chapter-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #409eff;
  }

  .chapter-time {
    font-family: 'Monaco', monospace;
    font-size: 14px;
    color: #909399;
    min-width: 50px;
  }

  .chapter-title {
    flex: 1;
    color: #303133;
  }
}

.transcript-content {
  max-height: 300px;
  overflow-y: auto;
}

.transcript-segment {
  display: flex;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;

  &.active {
    background: #f0f9ff;
    padding: 8px 12px;
    border-radius: 6px;
    margin: 0 -12px;
  }

  .segment-time {
    font-family: 'Monaco', monospace;
    font-size: 12px;
    color: #909399;
    min-width: 50px;
  }

  .segment-text {
    flex: 1;
    color: #303133;
    line-height: 1.5;
  }
}

.knowledge-sidebar {
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.outline-navigation,
.notes-section,
.related-resources {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  h4 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 16px 0;
  }
}

.outline-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.outline-item {
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: #f5f7fa;
  }

  &.active {
    background: #e6f7ff;
    color: #409eff;
  }

  .outline-level {
    font-size: 14px;
    line-height: 1.4;
  }
}

.notes-input {
  margin-bottom: 12px;
}

.save-notes-btn {
  width: 100%;
}

.resources-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #e6f7ff;
  }

  .resource-icon {
    color: #409eff;
    font-size: 20px;
  }

  .resource-info {
    flex: 1;

    .resource-title {
      font-weight: 500;
      color: #303133;
      margin-bottom: 4px;
    }

    .resource-type {
      font-size: 12px;
      color: #909399;
    }
  }
}

.section-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: white;
  border-top: 1px solid #e4e7ed;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

.controls-left,
.controls-center,
.controls-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.whiteboard-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.whiteboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: white;
  color: #303133;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .section-content {
    flex-direction: column;
  }

  .knowledge-sidebar {
    width: 100%;
    order: -1;
  }

  .section-controls {
    flex-direction: column;
    gap: 12px;
  }

  .controls-left,
  .controls-center,
  .controls-right {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .section-content {
    padding: 16px;
    gap: 16px;
  }

  .media-container {
    padding: 16px;
  }

  .checkpoint-options {
    .checkpoint-option {
      display: block;
      margin-bottom: 8px;
    }
  }
}
</style>