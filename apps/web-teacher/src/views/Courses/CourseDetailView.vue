<template>
  <div class="course-detail-view" v-loading="loading">
    <div class="page-header">
      <div class="header-content">
        <div class="preview-section">
          <!-- 绿色虚线预览模态框 -->
          <div class="course-preview-modal">
            <div class="preview-modal-header">
              <span class="preview-title">课程预览</span>
              <el-button type="text" size="small" @click="togglePreview">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
            <div class="preview-modal-content" v-show="showPreview">
              <div class="course-structure-preview">
                <h4>课程结构</h4>
                <div class="structure-list">
                  <div v-for="chapter in chapters" :key="chapter.id" class="structure-item">
                    <div class="chapter-info">
                      <el-icon><Folder /></el-icon>
                      <span class="chapter-name">{{ chapter.title }}</span>
                      <el-tag :type="getChapterTypeTag(chapter.type)" size="small">
                        {{ getChapterTypeText(chapter.type) }}
                      </el-tag>
                    </div>
                    <div class="chapter-duration">{{ chapter.duration }} 分钟</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="header-main">
          <div class="breadcrumb">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ name: 'Courses' }">课程管理</el-breadcrumb-item>
              <el-breadcrumb-item>{{ courseInfo.title || '课程详情' }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="header-right">
            <h1 class="page-title">{{ courseInfo.title || '课程详情' }}</h1>
            <div class="course-meta">
              <el-tag :type="getSubjectTag(courseInfo.subject)" size="small">
                {{ getSubjectName(courseInfo.subject) }}
              </el-tag>
              <span class="meta-item">年级：{{ courseInfo.grade || '未设置' }}</span>
              <span class="meta-item">课时：{{ courseInfo.duration }} 课时</span>
              <el-tag v-if="courseInfo.status" :type="getStatusTag(courseInfo.status)" size="small">
                {{ getStatusText(courseInfo.status) }}
              </el-tag>
            </div>
            <div class="header-actions">
              <el-button type="primary" @click="editCourse">
                <el-icon><Edit /></el-icon>
                编辑课程
              </el-button>
              <el-button @click="goBack">
                <el-icon><ArrowLeft /></el-icon>
                返回列表
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-row :gutter="24">
      <el-col :md="16" :xs="24">
        <EduCard
          class="overview-card"
          variant="glass"
          :hoverable="true"
          bodyClass="overview-card__body"
        >
          <template #header>
            <div class="card-header">
              <span>课程简介</span>
              <EduTag variant="info" size="sm">版本 {{ courseInfo.version }}</EduTag>
            </div>
          </template>
          <p class="course-description">{{ courseInfo.description || '暂无课程描述。' }}</p>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">创建人</span>
              <span class="value">{{ courseInfo.createdBy || '未知' }}</span>
            </div>
            <div class="info-item">
              <span class="label">创建时间</span>
              <span class="value">{{ formatDate(courseInfo.createdAt) }}</span>
            </div>
            <div class="info-item">
              <span class="label">最近更新</span>
              <span class="value">{{ formatDate(courseInfo.updatedAt) }}</span>
            </div>
            <div class="info-item">
              <span class="label">难度等级</span>
              <span class="value">{{ getDifficultyText(courseInfo.difficulty) }}</span>
            </div>
          </div>
        </EduCard>

        <el-card class="structure-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>章节结构</span>
              <el-tag type="success" size="small">{{ chapters.length }} 个章节</el-tag>
            </div>
          </template>

          <el-collapse v-model="expandedChapters">
            <el-collapse-item
              v-for="chapter in chapters"
              :key="chapter.id"
              :name="chapter.id"
            >
              <template #title>
                <div class="chapter-title">
                  <span class="chapter-name">{{ chapter.title }}</span>
                  <el-tag :type="getChapterTypeTag(chapter.type)" size="small">
                    {{ getChapterTypeText(chapter.type) }}
                  </el-tag>
                  <span class="chapter-duration">{{ chapter.duration }} 分钟</span>
                </div>
              </template>
              <div class="chapter-content">
                <p class="chapter-description">{{ chapter.description || '暂无章节描述。' }}</p>
                <div class="chapter-meta">
                  <div class="meta-block">
                    <h4>学习目标</h4>
                    <ul>
                      <li v-for="goal in chapter.goals" :key="goal">{{ goal }}</li>
                    </ul>
                  </div>
                  <div v-if="chapter.type === 'experiment'" class="meta-block">
                    <h4>实验资源</h4>
                    <span>{{ chapter.resource || '未绑定实验' }}</span>
                  </div>
                  <div v-if="chapter.type === 'interactive'" class="meta-block">
                    <h4>互动体验</h4>
                    <span>{{ chapter.resource || '未配置体验资源' }}</span>
                  </div>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </el-card>
      </el-col>

      <el-col :md="8" :xs="24">
        <el-card class="summary-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>课程统计</span>
            </div>
          </template>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">{{ enrolledStudents }}</div>
              <div class="stat-label">已加入学生</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ scheduledClasses }}</div>
              <div class="stat-label">排课班级</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ completionRate }}%</div>
              <div class="stat-label">平均完成率</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ aiAssistUsage }} 次</div>
              <div class="stat-label">AI 辅助使用</div>
            </div>
          </div>
        </el-card>

        <el-card class="timeline-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>最近动态</span>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="item in timeline"
              :key="item.id"
              :timestamp="item.timestamp"
              :type="item.type"
            >
              <h4>{{ item.title }}</h4>
              <p>{{ item.description }}</p>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { format } from 'date-fns'
import { Folder, Close, Edit, ArrowLeft } from '@element-plus/icons-vue'
import { courseApi, type CourseResponse } from '@/api/course'
import { useCourseStore } from '@/stores/course'
import { EduCard, EduTag } from '@reopeninnolab/ui-kit'

interface CourseInfo {
  id: string
  title: string
  description: string
  subject: string
  grade: string
  duration: number
  difficulty: string
  status: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
  version: string
}

interface ChapterInfo {
  id: string
  title: string
  description: string
  type: 'content' | 'experiment' | 'interactive' | 'assessment'
  duration: number
  goals: string[]
  resource?: string
}

interface TimelineItem {
  id: string
  title: string
  description: string
  timestamp: string
  type?: 'primary' | 'success' | 'warning' | 'info'
}

const route = useRoute()
const router = useRouter()
const courseStore = useCourseStore()

// 状态管理
const loading = ref(true)
const showPreview = ref(true) // 预览模态框显示状态
const courseId = computed(() => route.params.id as string)
const currentCourse = ref<CourseResponse | null>(null)
const courseInfo = ref<CourseInfo>({
  id: '',
  title: '',
  description: '',
  subject: '',
  grade: '',
  duration: 0,
  difficulty: 'beginner',
  status: 'draft',
  createdBy: '',
  createdAt: new Date(),
  updatedAt: new Date(),
  version: '1.0.0'
})

// 数据状态
const chapters = ref<ChapterInfo[]>([])
const expandedChapters = ref<string[]>([])
const timeline = ref<TimelineItem[]>([])

// 统计数据
const enrolledStudents = ref(0)
const scheduledClasses = ref(0)
const completionRate = ref(0)
const aiAssistUsage = ref(0)

// 加载课程数据
const loadCourseData = async () => {
  if (!courseId.value) {
    ElMessage.error('课程ID不存在')
    router.push('/courses')
    return
  }

  try {
    loading.value = true

    // 使用真实API获取课程数据
    const courseData = await courseApi.getCourseById(courseId.value)
    currentCourse.value = courseData

    // 转换为界面需要的格式
    courseInfo.value = {
      id: courseData.id,
      title: courseData.title,
      description: courseData.description || '暂无描述',
      subject: courseData.subject,
      grade: courseData.gradeBand,
      duration: calculateCourseDuration(courseData),
      difficulty: getDifficultyFromMetadata(courseData.metadata),
      status: courseData.status.toLowerCase(),
      createdBy: getCreatorFromMetadata(courseData.metadata),
      createdAt: new Date(courseData.createdAt),
      updatedAt: new Date(courseData.updatedAt),
      version: courseData.versions?.[0]?.version || '1.0.0'
    }

    // 解析课程结构生成章节
    if (courseData.versions?.[0]) {
      await parseCourseStructure(courseData.versions[0])
    }

    // 生成时间轴数据
    generateTimelineData(courseData)

    // 模拟统计数据（实际应该从统计API获取）
    generateMockStats()

  } catch (error) {
    console.error('加载课程数据失败:', error)
    ElMessage.error('课程数据加载失败，请稍后重试')
    router.push('/courses')
  } finally {
    loading.value = false
  }
}

// 计算课程总时长
const calculateCourseDuration = (course: CourseResponse): number => {
  if (!course.versions?.[0]) return 0

  const version = course.versions[0]
  // 这里应该根据ACL内容或模块数据计算真实时长
  // 暂时返回估算值
  return 45 // 默认45分钟
}

// 从元数据获取难度等级
const getDifficultyFromMetadata = (metadata?: any): string => {
  return metadata?.difficulty || 'beginner'
}

// 从元数据获取创建者
const getCreatorFromMetadata = (metadata?: any): string => {
  return metadata?.createdBy || '未知'
}

// 解析课程结构生成章节
const parseCourseStructure = async (version: any) => {
  chapters.value = []

  try {
    // 如果有ACL内容，解析ACL
    if (version.aclJsonb) {
      const aclContent = JSON.parse(version.aclJsonb)

      if (aclContent.structure?.modules) {
        aclContent.structure.modules.forEach((module: any, index: number) => {
          chapters.value.push({
            id: module.id || `module-${index}`,
            title: module.title,
            description: module.description || `${module.title}内容`,
            type: getModuleTypeFromType(module.type),
            duration: module.duration || module.estimatedMinutes || 30,
            goals: module.objectives || module.learningGoals || []
          })
        })
      }
    }
  } catch (error) {
    console.error('解析课程结构失败:', error)
    // 解析失败时提供默认章节
    chapters.value = [
      {
        id: 'default-chapter',
        title: '课程内容',
        description: '课程主要内容章节',
        type: 'content',
        duration: 45,
        goals: ['完成课程学习']
      }
    ]
  }
}

// 根据模块类型获取章节类型
const getModuleTypeFromType = (moduleType: string): 'content' | 'experiment' | 'interactive' | 'assessment' => {
  const typeMap: Record<string, 'content' | 'experiment' | 'interactive' | 'assessment'> = {
    'INTRODUCTION': 'content',
    'KNOWLEDGE': 'content',
    'EXPERIENCE': 'interactive',
    'EXPERIMENT': 'experiment',
    'ASSIGNMENT': 'assessment'
  }
  return typeMap[moduleType] || 'content'
}

// 生成时间轴数据
const generateTimelineData = (course: CourseResponse) => {
  timeline.value = [
    {
      id: 'created',
      title: '课程创建',
      description: `课程 "${course.title}" 创建完成`,
      timestamp: format(new Date(course.createdAt), 'yyyy-MM-dd HH:mm'),
      type: 'primary'
    },
    {
      id: 'updated',
      title: '最后更新',
      description: '课程内容已更新',
      timestamp: format(new Date(course.updatedAt), 'yyyy-MM-dd HH:mm'),
      type: 'success'
    }
  ]

  // 如果有发布版本，添加发布记录
  if (course.status === 'PUBLISHED' && course.versions?.length) {
    const publishedVersion = course.versions.find(v => v.status === 'PUBLISHED')
    if (publishedVersion && publishedVersion.publishedAt) {
      timeline.value.push({
        id: 'published',
        title: '课程发布',
        description: `版本 ${publishedVersion.version} 已发布`,
        timestamp: format(new Date(publishedVersion.publishedAt), 'yyyy-MM-dd HH:mm'),
        type: 'success'
      })
    }
  }
}

// 生成模拟统计数据（实际应该从统计API获取）
const generateMockStats = () => {
  enrolledStudents.value = Math.floor(Math.random() * 50) + 10
  scheduledClasses.value = Math.floor(Math.random() * 10) + 1
  completionRate.value = Math.floor(Math.random() * 40) + 60
  aiAssistUsage.value = Math.floor(Math.random() * 80) + 20
}

// 监听路由参数变化
watch(courseId, (newId) => {
  if (newId) {
    loadCourseData()
  }
}, { immediate: true })

// 初始加载
onMounted(() => {
  loadCourseData()
})

// 生成模拟统计数据（实际应该从统计API获取）
const generateMockStats = () => {
  enrolledStudents.value = Math.floor(Math.random() * 50) + 10
  scheduledClasses.value = Math.floor(Math.random() * 10) + 1
  completionRate.value = Math.floor(Math.random() * 40) + 60
  aiAssistUsage.value = Math.floor(Math.random() * 80) + 20
}

const editCourse = () => {
  router.push({ name: 'CourseEdit', params: { id: courseId.value } })
}

const togglePreview = () => {
  showPreview.value = !showPreview.value
}

const goBack = () => {
  router.push({ name: 'Courses' })
}

const formatDate = (date: Date | string) => {
  if (!date) return '—'
  return format(new Date(date), 'yyyy-MM-dd HH:mm')
}

const getSubjectName = (subject: string) => {
  const map: Record<string, string> = {
    physics: '物理',
    chemistry: '化学',
    math: '数学',
    biology: '生物',
    language: '语文',
    history: '历史',
    geography: '地理',
    english: '英语'
  }
  return map[subject] || '通用'
}

const getSubjectTag = (subject: string) => {
  const map: Record<string, string> = {
    physics: 'physics',
    chemistry: 'chemistry',
    math: 'math',
    biology: 'biology'
  }
  return map[subject] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    draft: '草稿',
    reviewing: '待审核',
    published: '已发布',
    archived: '已归档'
  }
  return map[status] || status
}

const getStatusTag = (status: string) => {
  const map: Record<string, string> = {
    draft: 'info',
    reviewing: 'warning',
    published: 'success',
    archived: 'default'
  }
  return map[status] || 'info'
}

const getDifficultyText = (level: string) => {
  const map: Record<string, string> = {
    beginner: '入门',
    intermediate: '进阶',
    advanced: '高级'
  }
  return map[level] || '未知'
}

const getChapterTypeTag = (type: string) => {
  const map: Record<string, string> = {
    content: 'info',
    experiment: 'danger',
    interactive: 'warning',
    assessment: 'success'
  }
  return map[type] || 'info'
}

const getChapterTypeText = (type: ChapterInfo['type']) => {
  const map: Record<ChapterInfo['type'], string> = {
    content: '知识讲授',
    experiment: '实验活动',
    interactive: '互动体验',
    assessment: '评估考核'
  }
  return map[type]
}

const getChapterTypeTag = (type: ChapterInfo['type']) => {
  const map: Record<ChapterInfo['type'], string> = {
    content: 'info',
    experiment: 'success',
    interactive: 'warning',
    assessment: 'danger'
  }
  return map[type]
}
</script>

<style scoped lang="scss">
.course-detail-view {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
}

.page-header {
  margin-bottom: var(--spacing-lg);
}

.header-content {
  display: flex;
  gap: var(--spacing-lg);
  align-items: flex-start;
}

.preview-section {
  flex: 0 0 300px;
}

.header-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.header-right {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  align-items: flex-start;
}

.course-preview-modal {
  border: 2px dashed #10b981;
  border-radius: var(--edu-border-radius-xl);
  background: rgba(16, 185, 129, 0.05);
  padding: var(--spacing-md);
  min-width: 280px;
  box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.1);
}

.preview-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid rgba(16, 185, 129, 0.2);
}

.preview-title {
  font-weight: var(--font-weight-medium);
  color: #047857;
  font-size: var(--font-size-lg);
}

.preview-modal-content {
  color: var(--text-primary);
}

.course-structure-preview h4 {
  margin: 0 0 var(--spacing-md);
  color: #047857;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
}

.structure-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.structure-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm);
  background: rgba(255, 255, 255, 0.8);
  border-radius: var(--edu-border-radius-md);
  border: 1px solid rgba(16, 185, 129, 0.1);
}

.chapter-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.chapter-name {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.chapter-duration {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.page-title {
  margin: var(--spacing-xs) 0;
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.course-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  align-items: center;
  color: var(--text-secondary);
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xxs);
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
  align-items: flex-start;
  margin-top: var(--spacing-sm);
}

.overview-card,
.structure-card,
.summary-card,
.timeline-card {
  border-radius: var(--edu-border-radius-xl);
}

.course-description {
  margin-bottom: var(--spacing-lg);
  color: var(--text-secondary);
  line-height: 1.6;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--spacing-md);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxs);
}

.label {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.value {
  font-weight: var(--font-weight-medium);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chapter-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.chapter-duration {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.chapter-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) 0;
}

.chapter-meta {
  display: grid;
  gap: var(--spacing-md);
}

.meta-block h4 {
  margin: 0 0 var(--spacing-xs);
  font-size: var(--font-size-md);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

.stat-item {
  background: var(--edu-surface-subtle, rgba(255, 255, 255, 0.6));
  border-radius: var(--edu-border-radius-lg);
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxs);
  text-align: center;
}

.stat-value {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
}

.stat-label {
  color: var(--text-secondary);
}

.timeline-card :deep(.el-timeline-item__content) h4 {
  margin: 0 0 var(--spacing-xxs);
}

@media (max-width: 768px) {
  .course-detail-view {
    padding: var(--spacing-base);
  }

  .header-content {
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .preview-section {
    flex: none;
    width: 100%;
  }

  .course-preview-modal {
    min-width: auto;
  }

  .header-right {
    width: 100%;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .structure-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }

  .chapter-duration {
    align-self: flex-end;
  }
}
</style>
