<template>
  <div class="course-detail-view" v-loading="loading">
    <div class="page-header">
      <div class="header-left">
        <div class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ name: 'Courses' }">课程管理</el-breadcrumb-item>
            <el-breadcrumb-item>{{ courseInfo.title || '课程详情' }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
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

    <el-row :gutter="24">
      <el-col :md="16" :xs="24">
        <el-card class="overview-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>课程简介</span>
              <el-tag type="info" size="small">版本 {{ courseInfo.version }}</el-tag>
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
        </el-card>

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
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { format } from 'date-fns'

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

const loading = ref(true)
const courseId = computed(() => route.params.id as string)
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
const chapters = ref<ChapterInfo[]>([])
const expandedChapters = ref<string[]>([])
const timeline = ref<TimelineItem[]>([])

const enrolledStudents = ref(0)
const scheduledClasses = ref(0)
const completionRate = ref(0)
const aiAssistUsage = ref(0)

onMounted(() => {
  loadMockData()
})

const loadMockData = () => {
  loading.value = true

  courseInfo.value = {
    id: courseId.value,
    title: '高中物理 - 力学基础',
    description: '涵盖牛顿运动定律、动量守恒、功与能等核心知识，结合 AI 辅助与实验教学。',
    subject: 'physics',
    grade: '高一',
    duration: 12,
    difficulty: 'intermediate',
    status: 'published',
    createdBy: '张老师',
    createdAt: new Date('2024-01-05T10:00:00'),
    updatedAt: new Date('2024-02-18T14:30:00'),
    version: '1.2.0'
  }

  chapters.value = [
    {
      id: 'chapter-1',
      title: '牛顿运动定律概述',
      description: '介绍三大定律及其在生活中的应用案例。',
      type: 'content',
      duration: 45,
      goals: ['理解三大定律的内容', '能够辨识受力与运动关系']
    },
    {
      id: 'chapter-2',
      title: '弹簧振子实验',
      description: '通过实验验证胡克定律，并记录实验数据。',
      type: 'experiment',
      duration: 60,
      goals: ['学会设置虚拟实验参数', '掌握实验数据采集方法'],
      resource: 'lab://physics/spring-oscillation'
    },
    {
      id: 'chapter-3',
      title: '动量守恒互动体验',
      description: '通过互动模拟体验碰撞实验，加深对动量守恒的理解。',
      type: 'interactive',
      duration: 40,
      goals: ['理解动量守恒公式', '能在互动实验中设置初始条件'],
      resource: 'experience://physics/momentum-sim'
    }
  ]

  expandedChapters.value = chapters.value.map(chapter => chapter.id)

  timeline.value = [
    {
      id: '1',
      title: 'AI 自动生成课程章节',
      description: 'AI 助手为该课程生成了 3 个推荐章节',
      timestamp: '2024-02-12 09:30',
      type: 'primary'
    },
    {
      id: '2',
      title: '班级排课完成',
      description: '高一1班、高一2班已排课至本课程',
      timestamp: '2024-02-10 16:20',
      type: 'success'
    },
    {
      id: '3',
      title: '新增实验资源',
      description: '关联虚拟实验 “弹簧振子实验”',
      timestamp: '2024-02-08 11:05'
    }
  ]

  enrolledStudents.value = 64
  scheduledClasses.value = 2
  completionRate.value = 78
  aiAssistUsage.value = 12

  loading.value = false
}

const editCourse = () => {
  router.push({ name: 'CourseEdit', params: { id: courseId.value } })
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
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
}

.header-left {
  flex: 1 1 60%;
}

.page-title {
  margin: var(--spacing-xs) 0;
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
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

  .page-header {
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
