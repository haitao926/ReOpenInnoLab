<template>
  <div class="chapter-flow">
    <!-- 章节列表 -->
    <div v-for="(chapter, index) in chapters" :key="chapter.id" class="chapter-item"
      :class="[
        `chapter-${chapter.type}`,
        `chapter-status-${chapter.status}`,
        { 'chapter-expanded': expandedChapters.includes(chapter.id) }
      ]"
    >
      <!-- 章节头部 -->
      <div class="chapter-header" @click="toggleChapter(chapter.id)">
        <div class="chapter-icon">
          <el-icon><component :is="getChapterIcon(chapter.type)" /></el-icon>
        </div>
        <div class="chapter-info">
          <h3 class="chapter-title">{{ chapter.title }}</h3>
          <p class="chapter-description">{{ chapter.description }}</p>
          <div class="chapter-meta">
            <span class="duration">{{ formatDuration(chapter.duration) }}</span>
            <span class="progress">进度: {{ chapter.progress }}%</span>
          </div>
        </div>
        <div class="chapter-status">
          <EduTag
            :variant="getStatusVariant(chapter.status)"
            size="xs"
          >
            {{ getStatusText(chapter.status) }}
          </EduTag>
          <el-icon
            class="expand-icon"
            :class="{ expanded: expandedChapters.includes(chapter.id) }"
          >
            <ArrowDown />
          </el-icon>
        </div>
      </div>

      <!-- 章节内容 -->
      <Transition name="chapter-content">
        <div v-if="expandedChapters.includes(chapter.id)" class="chapter-content">
          <!-- 学习目标 -->
          <div v-if="chapter.objectives?.length" class="chapter-objectives">
            <h4>
              <el-icon><Target /></el-icon>
              学习目标
            </h4>
            <ul>
              <li v-for="objective in chapter.objectives" :key="objective">
                {{ objective }}
              </li>
            </ul>
          </div>

          <!-- 知识点章节内容 -->
          <div v-if="chapter.type === 'knowledge'" class="knowledge-content">
            <h4>
              <el-icon><Reading /></el-icon>
              知识内容
            </h4>
            <div class="knowledge-points" v-if="chapter.knowledgePoints?.length">
              <div
                v-for="point in chapter.knowledgePoints"
                :key="point"
                class="knowledge-point"
              >
                <EduCard variant="bordered" size="sm">
                  <div class="point-content">
                    <div class="point-icon">
                      <el-icon><Check /></el-icon>
                    </div>
                    <span class="point-text">{{ point }}</span>
                  </div>
                </EduCard>
              </div>
            </div>
            <div class="chapter-text" v-if="chapter.content" v-html="chapter.content"></div>
          </div>

          <!-- 体验章节内容 -->
          <div v-if="chapter.type === 'experience'" class="experience-content">
            <h4>
              <el-icon><MagicStick /></el-icon>
              互动体验
            </h4>
            <p class="experience-description">{{ chapter.description }}</p>
          </div>

          <!-- 实验章节内容 -->
          <div v-if="chapter.type === 'experiment'" class="experiment-content">
            <h4>
              <el-icon><Monitor /></el-icon>
              实验活动
            </h4>
            <p class="experiment-description">{{ chapter.description }}</p>
          </div>

          <!-- 作业章节内容 -->
          <div v-if="chapter.type === 'assignment'" class="assignment-content">
            <h4>
              <el-icon><EditPen /></el-icon>
              作业任务
            </h4>
            <p class="assignment-description">{{ chapter.description }}</p>
          </div>

          <!-- 介绍章节内容 -->
          <div v-if="chapter.type === 'introduction'" class="introduction-content">
            <h4>
              <el-icon><InfoFilled /></el-icon>
              课程介绍
            </h4>
            <div class="introduction-text" v-if="chapter.content" v-html="chapter.content"></div>
            <p class="introduction-description">{{ chapter.description }}</p>
          </div>

          <!-- 活动列表 -->
          <div v-if="chapter.activities?.length" class="activities-section">
            <h4>
              <el-icon><List /></el-icon>
              学习活动 ({{ chapter.activities.length }})
            </h4>
            <div class="activity-list">
              <div
                v-for="activity in chapter.activities"
                :key="activity.id"
                class="activity-item"
              >
                <ActivityCard
                  :activity="activity"
                  :chapter-id="chapter.id"
                  @open="handleActivityOpen"
                />
              </div>
            </div>
          </div>

          <!-- AI提示 -->
          <div v-if="chapter.aiHints?.length" class="ai-hints-section">
            <h4>
              <el-icon><MagicStick /></el-icon>
              AI学习助手
            </h4>
            <div class="ai-hints">
              <div
                v-for="hint in chapter.aiHints"
                :key="hint.id"
                class="ai-hint"
                :class="`hint-priority-${hint.priority}`"
              >
                <EduCard variant="elevated" size="sm">
                  <div class="hint-content">
                    <div class="hint-header">
                      <span class="hint-title">{{ hint.title }}</span>
                      <EduTag :variant="getHintVariant(hint.priority)" size="xs">
                        {{ getHintPriorityText(hint.priority) }}
                      </EduTag>
                    </div>
                    <p class="hint-text">{{ hint.content }}</p>
                  </div>
                </EduCard>
              </div>
            </div>
          </div>

          <!-- 课堂活动 -->
          <div v-if="chapter.classroomActions?.length" class="classroom-actions-section">
            <h4>
              <el-icon><Users /></el-icon>
              课堂活动
            </h4>
            <div class="classroom-actions">
              <div
                v-for="action in chapter.classroomActions"
                :key="action.id"
                class="classroom-action"
              >
                <EduCard variant="bordered" size="sm">
                  <div class="action-content">
                    <div class="action-header">
                      <span class="action-title">{{ action.title }}</span>
                      <span class="action-duration">{{ action.duration }}分钟</span>
                    </div>
                    <p class="action-description">{{ action.description }}</p>
                  </div>
                </EduCard>
              </div>
            </div>
          </div>

          <!-- 章节操作 -->
          <div class="chapter-actions">
            <el-button
              v-if="chapter.status !== 'completed'"
              type="primary"
              size="large"
              @click="handleChapterComplete(chapter)"
              :disabled="!canCompleteChapter(chapter)"
              :loading="completingChapter === chapter.id"
            >
              <el-icon><Check /></el-icon>
              完成章节
            </el-button>

            <el-button
              v-if="chapter.status === 'completed'"
              type="success"
              size="large"
              disabled
            >
              <el-icon><Check /></el-icon>
              已完成
            </el-button>

            <el-button
              v-if="chapter.activities?.length"
              type="default"
              size="large"
              @click="startNextActivity(chapter)"
            >
              <el-icon><Right /></el-icon>
              开始活动
            </el-button>
          </div>
        </div>
      </Transition>
    </div>

    <!-- 分页控件 -->
    <div v-if="totalPages > 1" class="chapter-pagination">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="chapters.length"
        layout="prev, pager, next"
        small
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, toRefs } from 'vue'
import { ElMessage } from 'element-plus'
import {
  ArrowDown,
  Reading,
  Monitor,
  MagicStick,
  EditPen,
  Check,
  Lock,
  Target,
  List,
  InfoFilled,
  Users,
  Right
} from '@element-plus/icons-vue'

import type { Chapter, Activity, AIHint, ActivityContext } from '@/types/course'
import { createActivityContext } from '@/utils/activity-utils'
import EduCard from '@reopeninnolab/ui-kit'
import EduTag from '@reopeninnolab/ui-kit'
import ActivityCard from './ActivityCard.vue'

interface Props {
  chapters: Chapter[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'activity-open': [context: ActivityContext]
  'complete': [chapterId: string]
}>()

// 响应式数据
const expandedChapters = ref<string[]>([])
const completingChapter = ref<string | null>(null)

// 方法
const getChapterIcon = (type: Chapter['type']) => {
  switch (type) {
    case 'introduction':
      return InfoFilled
    case 'knowledge':
      return Reading
    case 'experience':
      return MagicStick
    case 'experiment':
      return Monitor
    case 'assignment':
      return EditPen
    default:
      return Reading
  }
}

const getStatusVariant = (status: Chapter['status']): 'primary' | 'success' | 'warning' | 'info' | 'danger' | 'default' => {
  switch (status) {
    case 'completed':
      return 'success'
    case 'in_progress':
      return 'primary'
    case 'available':
      return 'warning'
    case 'locked':
      return 'info'
    default:
      return 'default'
  }
}

const getStatusText = (status: Chapter['status']): string => {
  switch (status) {
    case 'completed':
      return '已完成'
    case 'in_progress':
      return '进行中'
    case 'available':
      return '可开始'
    case 'locked':
      return '未解锁'
    default:
      return '未知'
  }
}

const getHintVariant = (priority: AIHint['priority']): 'primary' | 'success' | 'warning' | 'info' | 'danger' | 'default' => {
  switch (priority) {
    case 'high':
      return 'danger'
    case 'medium':
      return 'warning'
    case 'low':
      return 'info'
    default:
      return 'default'
  }
}

const getHintPriorityText = (priority: AIHint['priority']): string => {
  switch (priority) {
    case 'high':
      return '重要'
    case 'medium':
      return '一般'
    case 'low':
      return '提示'
    default:
      return '未知'
  }
}

const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}分钟`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`
}

const toggleChapter = (chapterId: string) => {
  const index = expandedChapters.value.indexOf(chapterId)
  if (index > -1) {
    expandedChapters.value.splice(index, 1)
  } else {
    expandedChapters.value.push(chapterId)
  }
}

const canCompleteChapter = (chapter: Chapter): boolean => {
  // 检查章节状态
  if (chapter.status !== 'available' && chapter.status !== 'in_progress') {
    return false
  }

  // 检查是否有必须完成的活动
  if (chapter.activities?.length) {
    const incompleteActivities = chapter.activities.filter(
      activity => activity.status !== 'completed'
    )
    if (incompleteActivities.length > 0) {
      return false
    }
  }

  return true
}

const handleActivityOpen = (activity: Activity, chapterId: string) => {
  // 找到章节
  const chapter = props.chapters.find(ch => ch.id === chapterId)
  if (!chapter) {
    ElMessage.error('找不到章节信息')
    return
  }

  // 创建活动上下文
  const context = createActivityContext(
    chapter.courseId,
    chapterId,
    activity,
    chapter.title, // courseTitle 需要从外部传入
    chapter.title
  )

  emit('activity-open', context)
}

const handleChapterComplete = async (chapter: Chapter) => {
  if (!canCompleteChapter(chapter)) {
    ElMessage.warning('请先完成所有活动')
    return
  }

  completingChapter.value = chapter.id

  try {
    // 模拟完成章节
    await new Promise(resolve => setTimeout(resolve, 1000))

    emit('complete', chapter.id)
    ElMessage.success(`章节"${chapter.title}"已完成！`)
  } catch (error) {
    ElMessage.error('章节完成失败，请重试')
  } finally {
    completingChapter.value = null
  }
}

const startNextActivity = (chapter: Chapter) => {
  if (!chapter.activities?.length) {
    ElMessage.warning('该章节没有活动')
    return
  }

  // 找到下一个未完成的活动
  const nextActivity = chapter.activities.find(
    activity => activity.status !== 'completed'
  )

  if (nextActivity) {
    handleActivityOpen(nextActivity, chapter.id)
  } else {
    ElMessage.info('所有活动都已完成')
  }
}

// 自动展开第一个可用的章节
const expandFirstAvailableChapter = () => {
  const firstAvailable = props.chapters.find(ch =>
    ch.status === 'available' || ch.status === 'in_progress'
  )
  if (firstAvailable && !expandedChapters.value.includes(firstAvailable.id)) {
    expandedChapters.value.push(firstAvailable.id)
  }
}

// 监听章节变化，自动展开合适的章节
const { chapters } = toRefs(props)
watch(chapters, () => {
  expandFirstAvailableChapter()
}, { immediate: true })

// 初始化时展开第一个可用章节
expandFirstAvailableChapter()
</script>

<style scoped lang="scss">
.chapter-flow {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chapter-item {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  border: 2px solid rgba(15, 23, 42, 0.08);
  overflow: hidden;
  transition: all var(--edu-duration-normal) var(--edu-easing-smooth);
  backdrop-filter: blur(14px);

  &:hover {
    border-color: rgba(99, 102, 241, 0.2);
    box-shadow: 0 8px 32px rgba(15, 23, 42, 0.1);
  }

  &.chapter-status-completed {
    border-color: rgba(34, 197, 94, 0.3);
    background: rgba(34, 197, 94, 0.05);
  }

  &.chapter-status-locked {
    opacity: 0.7;
    border-color: rgba(156, 163, 175, 0.3);
  }
}

.chapter-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  cursor: pointer;
  transition: background-color var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    background: rgba(99, 102, 241, 0.05);
  }
}

.chapter-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--edu-primary-500) 0%, var(--edu-primary-600) 100%);
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;

  .chapter-introduction & {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .chapter-knowledge & {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }

  .chapter-experience & {
    background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  }

  .chapter-experiment & {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }

  .chapter-assignment & {
    background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  }
}

.chapter-info {
  flex: 1;
  min-width: 0;
}

.chapter-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--edu-text-primary);
  margin: 0 0 6px 0;
  line-height: 1.4;
}

.chapter-description {
  font-size: 14px;
  color: var(--edu-text-secondary);
  margin: 0 0 8px 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.chapter-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--edu-text-disabled);
}

.chapter-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.expand-icon {
  font-size: 16px;
  color: var(--edu-text-secondary);
  transition: transform var(--edu-duration-fast) var(--edu-easing-in-out);

  &.expanded {
    transform: rotate(180deg);
  }
}

.chapter-content {
  border-top: 1px solid rgba(15, 23, 42, 0.08);
  padding: 24px;
  background: rgba(255, 255, 255, 0.6);
}

.chapter-objectives,
.knowledge-content,
.experience-content,
.experiment-content,
.assignment-content,
.introduction-content,
.activities-section,
.ai-hints-section,
.classroom-actions-section {
  margin-bottom: 24px;

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

.knowledge-points {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.point-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
}

.point-icon {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  background: rgba(34, 197, 94, 0.15);
  color: rgb(34, 197, 94);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
}

.point-text {
  font-size: 14px;
  color: var(--edu-text-primary);
  font-weight: 500;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.introduction-text {
  font-size: 15px;
  line-height: 1.7;
  color: var(--edu-text-primary);

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

.chapter-actions {
  display: flex;
  justify-content: center;
  padding-top: 16px;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
}

// 过渡动画
.chapter-content-enter-active,
.chapter-content-leave-active {
  transition: all var(--edu-duration-normal) var(--edu-easing-smooth);
  overflow: hidden;
}

.chapter-content-enter-from {
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
}

.chapter-content-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
}

.chapter-content-enter-to,
.chapter-content-leave-from {
  max-height: 1000px;
  opacity: 1;
  transform: translateY(0);
}

// 响应式设计
@media (max-width: 768px) {
  .chapter-flow {
    gap: 16px;
  }

  .chapter-header {
    padding: 16px;
    gap: 12px;
  }

  .chapter-icon {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }

  .chapter-title {
    font-size: 18px;
  }

  .chapter-objectives {
    font-size: 13px;
  }

  .chapter-content {
    padding: 20px;
  }

  .knowledge-points {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .point-content {
    padding: 10px;
  }

  .point-text {
    font-size: 13px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .chapter-item,
  .chapter-header,
  .expand-icon,
  .chapter-content-enter-active,
  .chapter-content-leave-active {
    transition: none;
  }

  .expand-icon.expanded {
    transform: none;
  }
}

// 新增样式区域
.chapter-objectives {
  ul {
    margin: 0;
    padding-left: 20px;
  }

  li {
    color: var(--edu-text-primary);
    margin-bottom: 8px;
    line-height: 1.5;

    &::marker {
      color: var(--edu-primary-500);
    }
  }
}

.experience-description,
.experiment-description,
.assignment-description,
.introduction-description {
  color: var(--edu-text-primary);
  line-height: 1.6;
  font-size: 15px;
}

.chapter-text {
  color: var(--edu-text-primary);
  line-height: 1.7;
  font-size: 15px;
  margin-top: 16px;

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

.ai-hints {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px;
}

.ai-hint {
  .hint-content {
    .hint-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .hint-title {
      font-weight: 600;
      color: var(--edu-text-primary);
      font-size: 14px;
    }

    .hint-text {
      color: var(--edu-text-secondary);
      font-size: 13px;
      line-height: 1.5;
      margin: 0;
    }
  }

  &.hint-priority-high {
    .hint-content {
      border-left: 3px solid var(--edu-danger-500);
    }
  }

  &.hint-priority-medium {
    .hint-content {
      border-left: 3px solid var(--edu-warning-500);
    }
  }

  &.hint-priority-low {
    .hint-content {
      border-left: 3px solid var(--edu-info-500);
    }
  }
}

.classroom-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-content {
  .action-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .action-title {
    font-weight: 600;
    color: var(--edu-text-primary);
    font-size: 14px;
  }

  .action-duration {
    font-size: 12px;
    color: var(--edu-text-secondary);
    background: rgba(99, 102, 241, 0.1);
    padding: 2px 8px;
    border-radius: 12px;
  }

  .action-description {
    color: var(--edu-text-secondary);
    font-size: 13px;
    line-height: 1.5;
    margin: 0;
  }
}

// 分页样式
.chapter-pagination {
  display: flex;
  justify-content: center;
  padding: 20px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);

  :deep(.el-pagination) {
    --el-pagination-button-bg-color: transparent;
    --el-pagination-hover-color: var(--edu-primary-600);
  }
}
</style>