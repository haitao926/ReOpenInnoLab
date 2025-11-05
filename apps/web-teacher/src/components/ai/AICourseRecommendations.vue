<template>
  <div class="ai-course-recommendations">
    <!-- 推荐头部 -->
    <header class="recommendations-header">
      <div class="header-content">
        <div class="header-title">
          <el-icon class="header-icon"><MagicStick /></el-icon>
          <h2>AI 课程推荐</h2>
        </div>
        <p class="header-subtitle">基于您的教学风格和学生需求，为您推荐最适合的课程内容</p>
      </div>
      <div class="header-controls">
        <el-select
          v-model="selectedSubject"
          placeholder="选择学科"
          clearable
          @change="handleSubjectChange"
        >
          <el-option
            v-for="subject in availableSubjects"
            :key="subject.id"
            :label="subject.name"
            :value="subject.id"
          />
        </el-select>
        <el-button @click="refreshRecommendations" :loading="isLoading">
          <el-icon><Refresh /></el-icon>
          刷新推荐
        </el-button>
      </div>
    </header>

    <!-- 推荐过滤器 -->
    <div class="recommendations-filters" role="group" aria-label="推荐过滤器">
      <div class="filter-group">
        <label class="filter-label">难度级别</label>
        <div class="filter-options">
          <el-tag
            v-for="level in difficultyLevels"
            :key="level.value"
            :class="{ 'filter-tag--active': selectedDifficulty === level.value }"
            class="filter-tag"
            @click="toggleDifficulty(level.value)"
          >
            {{ level.label }}
          </el-tag>
        </div>
      </div>
      <div class="filter-group">
        <label class="filter-label">课程类型</label>
        <div class="filter-options">
          <el-tag
            v-for="type in courseTypes"
            :key="type.value"
            :class="{ 'filter-tag--active': selectedTypes.includes(type.value) }"
            class="filter-tag"
            @click="toggleCourseType(type.value)"
          >
            {{ type.label }}
          </el-tag>
        </div>
      </div>
      <div class="filter-group">
        <label class="filter-label">学生特点</label>
        <div class="filter-options">
          <el-tag
            v-for="characteristic in studentCharacteristics"
            :key="characteristic.value"
            :class="{ 'filter-tag--active': selectedCharacteristics.includes(characteristic.value) }"
            class="filter-tag"
            @click="toggleCharacteristic(characteristic.value)"
          >
            {{ characteristic.label }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 推荐内容 -->
    <main class="recommendations-content">
      <!-- 推荐统计 -->
      <div class="recommendations-stats">
        <div class="stat-item">
          <div class="stat-value">{{ totalRecommendations }}</div>
          <div class="stat-label">推荐课程</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ averageMatch }}%</div>
          <div class="stat-label">平均匹配度</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ newCount }}</div>
          <div class="stat-label">新增内容</div>
        </div>
      </div>

      <!-- 推荐列表 -->
      <div class="recommendations-list" role="list" aria-label="推荐课程列表">
        <div
          v-for="(recommendation, index) in filteredRecommendations"
          :key="recommendation.id"
          class="recommendation-card"
          role="listitem"
        >
          <div class="recommendation-header">
            <div class="recommendation-meta">
              <h3 class="recommendation-title">{{ recommendation.title }}</h3>
              <div class="recommendation-badges">
                <el-tag
                  v-for="badge in recommendation.badges"
                  :key="badge.type"
                  :type="badge.variant"
                  size="small"
                >
                  {{ badge.label }}
                </el-tag>
              </div>
            </div>
            <div class="recommendation-score">
              <div class="score-circle" :style="{ color: getMatchColor(recommendation.matchScore) }">
                {{ recommendation.matchScore }}%
              </div>
              <div class="score-label">匹配度</div>
            </div>
          </div>

          <div class="recommendation-content">
            <p class="recommendation-description">{{ recommendation.description }}</p>

            <!-- AI 推荐理由 -->
            <div class="recommendation-reason">
              <div class="reason-header">
                <el-icon><TrendCharts /></el-icon>
                <span>AI 推荐理由</span>
              </div>
              <ul class="reason-list">
                <li v-for="reason in recommendation.reasons" :key="reason">{{ reason }}</li>
              </ul>
            </div>

            <!-- 课程预览 -->
            <div class="recommendation-preview">
              <div class="preview-stats">
                <div class="preview-stat">
                  <span class="preview-label">课时</span>
                  <span class="preview-value">{{ recommendation.duration }}</span>
                </div>
                <div class="preview-stat">
                  <span class="preview-label">难度</span>
                  <span class="preview-value">{{ recommendation.difficulty }}</span>
                </div>
                <div class="preview-stat">
                  <span class="preview-label">适合年级</span>
                  <span class="preview-value">{{ recommendation.gradeLevel }}</span>
                </div>
                <div class="preview-stat">
                  <span class="preview-label">学生反馈</span>
                  <span class="preview-value">{{ recommendation.studentRating }}/5.0</span>
                </div>
              </div>
            </div>
          </div>

          <div class="recommendation-actions">
            <el-button @click="viewDetail(recommendation)">
              <el-icon><View /></el-icon>
              查看详情
            </el-button>
            <el-button type="primary" @click="adoptCourse(recommendation)">
              <el-icon><Check /></el-icon>
              采用课程
            </el-button>
            <el-dropdown @command="handleMoreAction">
              <el-button>
                更多
                <el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="{ action: 'similar', item: recommendation }">
                    查看相似课程
                  </el-dropdown-item>
                  <el-dropdown-item :command="{ action: 'save', item: recommendation }">
                    收藏推荐
                  </el-dropdown-item>
                  <el-dropdown-item :command="{ action: 'feedback', item: recommendation }">
                    提供反馈
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <el-skeleton animated>
          <template #template>
            <div class="skeleton-card">
              <el-skeleton-item variant="h3" style="width: 50%" />
              <el-skeleton-item variant="text" style="width: 100%" />
              <el-skeleton-item variant="text" style="width: 80%" />
              <el-skeleton-item variant="button" style="width: 120px; margin-top: 16px" />
            </div>
          </template>
        </el-skeleton>
      </div>

      <!-- 空状态 -->
      <div v-else-if="filteredRecommendations.length === 0" class="empty-state">
        <el-icon class="empty-icon"><DocumentRemove /></el-icon>
        <h3>暂无推荐课程</h3>
        <p>请调整筛选条件或刷新推荐</p>
        <el-button type="primary" @click="resetFilters">
          重置筛选
        </el-button>
      </div>
    </main>

    <!-- 课程详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      :title="selectedRecommendation?.title"
      width="800px"
      destroy-on-close
    >
      <CourseDetailPanel
        v-if="selectedRecommendation"
        :course="selectedRecommendation"
        @adopt="handleAdoptFromDetail"
        @close="showDetailDialog = false"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  MagicStick,
  Refresh,
  TrendCharts,
  View,
  Check,
  ArrowDown,
  DocumentRemove
} from '@element-plus/icons-vue'

import CourseDetailPanel from './CourseDetailPanel.vue'

interface CourseRecommendation {
  id: string
  title: string
  description: string
  matchScore: number
  subject: string
  difficulty: string
  duration: string
  gradeLevel: string
  studentRating: number
  badges: Array<{
    type: string
    label: string
    variant: string
  }>
  reasons: string[]
  prerequisites: string[]
  learningObjectives: string[]
  resources: Array<{
    type: string
    title: string
    url: string
  }>
  isNew: boolean
  lastUpdated: string
}

interface FilterOption {
  value: string
  label: string
}

const props = defineProps<{
  initialSubject?: string
  userProfile?: any
}>()

const emit = defineEmits<{
  'course-adopted': [course: CourseRecommendation]
  'recommendation-filtered': [filters: any]
}>()

// 响应式数据
const isLoading = ref(false)
const selectedRecommendation = ref<CourseRecommendation | null>(null)
const showDetailDialog = ref(false)

const selectedSubject = ref(props.initialSubject || '')
const selectedDifficulty = ref('')
const selectedTypes = ref<string[]>([])
const selectedCharacteristics = ref<string[]>([])

const recommendations = ref<CourseRecommendation[]>([])

// 筛选选项
const availableSubjects = ref([
  { id: 'math', name: '数学' },
  { id: 'physics', name: '物理' },
  { id: 'chemistry', name: '化学' },
  { id: 'biology', name: '生物' },
  { id: 'language', name: '语文' },
  { id: 'english', name: '英语' },
  { id: 'history', name: '历史' },
  { id: 'geography', name: '地理' },
  { id: 'it', name: '信息技术' }
])

const difficultyLevels = ref<FilterOption[]>([
  { value: 'beginner', label: '入门' },
  { value: 'intermediate', label: '中级' },
  { value: 'advanced', label: '高级' },
  { value: 'expert', label: '专家' }
])

const courseTypes = ref<FilterOption[]>([
  { value: 'theory', label: '理论课' },
  { value: 'lab', label: '实验课' },
  { value: 'project', label: '项目课' },
  { value: 'seminar', label: '研讨课' },
  { value: 'review', label: '复习课' }
])

const studentCharacteristics = ref<FilterOption[]>([
  { value: 'visual-learner', label: '视觉学习者' },
  { value: 'auditory-learner', label: '听觉学习者' },
  { value: 'kinesthetic-learner', label: '动觉学习者' },
  { value: 'fast-learner', label: '快速学习' },
  { value: 'careful-learner', label: '仔细学习' },
  { value: 'creative', label: '创新型' },
  { value: 'analytical', label: '分析型' }
])

// 计算属性
const filteredRecommendations = computed(() => {
  let filtered = recommendations.value

  if (selectedSubject.value) {
    filtered = filtered.filter(rec => rec.subject === selectedSubject.value)
  }

  if (selectedDifficulty.value) {
    filtered = filtered.filter(rec => rec.difficulty === selectedDifficulty.value)
  }

  if (selectedTypes.value.length > 0) {
    filtered = filtered.filter(rec =>
      rec.badges.some(badge => selectedTypes.value.includes(badge.type))
    )
  }

  if (selectedCharacteristics.value.length > 0) {
    filtered = filtered.filter(rec =>
      rec.reasons.some(reason =>
        selectedCharacteristics.value.some(char => reason.includes(char))
      )
    )
  }

  return filtered.sort((a, b) => b.matchScore - a.matchScore)
})

const totalRecommendations = computed(() => filteredRecommendations.value.length)

const averageMatch = computed(() => {
  if (filteredRecommendations.value.length === 0) return 0
  const sum = filteredRecommendations.value.reduce((acc, rec) => acc + rec.matchScore, 0)
  return Math.round(sum / filteredRecommendations.value.length)
})

const newCount = computed(() => {
  return filteredRecommendations.value.filter(rec => rec.isNew).length
})

// 方法
const loadRecommendations = async () => {
  try {
    isLoading.value = true

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1500))

    // 模拟推荐数据
    const mockRecommendations: CourseRecommendation[] = [
      {
        id: '1',
        title: '基于AI的数学建模入门',
        description: '通过实际案例和AI工具，引导学生学习数学建模的基本方法和应用。',
        matchScore: 92,
        subject: 'math',
        difficulty: 'intermediate',
        duration: '8课时',
        gradeLevel: '高中',
        studentRating: 4.7,
        badges: [
          { type: 'ai-powered', label: 'AI增强', variant: 'primary' },
          { type: 'interactive', label: '互动性强', variant: 'success' },
          { type: 'new', label: '新课', variant: 'info' }
        ],
        reasons: [
          '根据您的教学历史，您偏好理论与实践结合的教学方式',
          '学生的学习数据显示，他们对实际应用类课程兴趣较高',
          'AI工具可以显著提升数学建模的教学效果'
        ],
        prerequisites: ['基础代数', '函数概念'],
        learningObjectives: [
          '掌握数学建模的基本流程',
          '学会使用AI工具辅助建模',
          '培养解决实际问题的能力'
        ],
        resources: [
          { type: 'video', title: '数学建模入门视频', url: '#' },
          { type: 'document', title: '建模案例集', url: '#' },
          { type: 'tool', title: 'AI建模工具', url: '#' }
        ],
        isNew: true,
        lastUpdated: '2024-01-15'
      },
      {
        id: '2',
        title: '物理实验数据分析与可视化',
        description: '结合现代数据分析技术，提升物理实验的教学效果和学生理解。',
        matchScore: 88,
        subject: 'physics',
        difficulty: 'advanced',
        duration: '12课时',
        gradeLevel: '高中',
        studentRating: 4.5,
        badges: [
          { type: 'data-driven', label: '数据驱动', variant: 'success' },
          { type: 'hands-on', label: '实践性强', variant: 'warning' }
        ],
        reasons: [
          '您的学生在实验数据分析方面需要提升',
          '可视化工具能够帮助学生更好地理解物理概念',
          '符合现代物理教学的发展趋势'
        ],
        prerequisites: ['基础物理概念', '统计学基础'],
        learningObjectives: [
          '掌握实验数据的处理方法',
          '学会数据可视化技术',
          '提升实验报告撰写能力'
        ],
        resources: [
          { type: 'software', title: '数据分析软件', url: '#' },
          { type: 'dataset', title: '实验数据集', url: '#' }
        ],
        isNew: false,
        lastUpdated: '2024-01-10'
      },
      {
        id: '3',
        title: '化学分子结构可视化教学',
        description: '利用3D可视化技术，让抽象的分子结构变得直观易懂。',
        matchScore: 85,
        subject: 'chemistry',
        difficulty: 'beginner',
        duration: '6课时',
        gradeLevel: '初中',
        studentRating: 4.8,
        badges: [
          { type: 'visual', label: '可视化', variant: 'info' },
          { type: 'interactive', label: '互动性', variant: 'primary' },
          { type: 'popular', label: '热门', variant: 'danger' }
        ],
        reasons: [
          '您之前教授的课程中学生反馈需要更多视觉辅助',
          '3D可视化对化学学习效果显著',
          '适合初中生的认知水平'
        ],
        prerequisites: ['基础化学概念'],
        learningObjectives: [
          '理解分子结构的基本概念',
          '掌握分子模型的搭建方法',
          '培养空间想象能力'
        ],
        resources: [
          { type: 'model', title: '3D分子模型', url: '#' },
          { type: 'simulation', title: '分子运动模拟', url: '#' }
        ],
        isNew: false,
        lastUpdated: '2024-01-08'
      }
    ]

    recommendations.value = mockRecommendations

  } catch (error) {
    ElMessage.error('加载推荐失败，请重试')
  } finally {
    isLoading.value = false
  }
}

const refreshRecommendations = () => {
  loadRecommendations()
}

const handleSubjectChange = () => {
  emit('recommendation-filtered', {
    subject: selectedSubject.value,
    difficulty: selectedDifficulty.value,
    types: selectedTypes.value,
    characteristics: selectedCharacteristics.value
  })
}

const toggleDifficulty = (value: string) => {
  selectedDifficulty.value = selectedDifficulty.value === value ? '' : value
}

const toggleCourseType = (value: string) => {
  const index = selectedTypes.value.indexOf(value)
  if (index > -1) {
    selectedTypes.value.splice(index, 1)
  } else {
    selectedTypes.value.push(value)
  }
}

const toggleCharacteristic = (value: string) => {
  const index = selectedCharacteristics.value.indexOf(value)
  if (index > -1) {
    selectedCharacteristics.value.splice(index, 1)
  } else {
    selectedCharacteristics.value.push(value)
  }
}

const resetFilters = () => {
  selectedSubject.value = ''
  selectedDifficulty.value = ''
  selectedTypes.value = []
  selectedCharacteristics.value = []
}

const getMatchColor = (score: number) => {
  if (score >= 90) return '#67c23a'
  if (score >= 80) return '#e6a23c'
  if (score >= 70) return '#f56c6c'
  return '#909399'
}

const viewDetail = (recommendation: CourseRecommendation) => {
  selectedRecommendation.value = recommendation
  showDetailDialog.value = true
}

const adoptCourse = (recommendation: CourseRecommendation) => {
  ElMessage.success(`已采用课程：${recommendation.title}`)
  emit('course-adopted', recommendation)
}

const handleAdoptFromDetail = (recommendation: CourseRecommendation) => {
  showDetailDialog.value = false
  adoptCourse(recommendation)
}

const handleMoreAction = ({ action, item }: { action: string; item: CourseRecommendation }) => {
  switch (action) {
    case 'similar':
      ElMessage.info('正在查找相似课程...')
      break
    case 'save':
      ElMessage.success('已收藏推荐')
      break
    case 'feedback':
      ElMessage.info('反馈功能开发中...')
      break
  }
}

// 生命周期
onMounted(() => {
  loadRecommendations()
})

// 监听筛选条件变化
watch([selectedSubject, selectedDifficulty, selectedTypes, selectedCharacteristics], () => {
  handleSubjectChange()
})
</script>

<style scoped lang="scss">
.ai-course-recommendations {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--edu-bg-primary);
}

.recommendations-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--density-padding-xl);
  background: linear-gradient(135deg, var(--edu-primary-50) 0%, var(--edu-secondary-50) 100%);
  border-bottom: 1px solid var(--edu-border-light);
  gap: var(--density-spacing-lg);
}

.header-content {
  flex: 1;
}

.header-title {
  display: flex;
  align-items: center;
  gap: var(--density-spacing-sm);
  margin-bottom: var(--density-spacing-sm);
}

.header-icon {
  font-size: 24px;
  color: var(--edu-primary-600);
}

.header-title h2 {
  margin: 0;
  font-size: var(--density-font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--edu-text-primary);
}

.header-subtitle {
  margin: 0;
  font-size: var(--density-font-size-base);
  color: var(--edu-text-secondary);
  line-height: var(--density-line-height-relaxed);
}

.header-controls {
  display: flex;
  gap: var(--density-spacing-sm);
  align-items: center;
}

.recommendations-filters {
  padding: var(--density-padding-lg) var(--density-padding-xl);
  background: var(--edu-bg-secondary);
  border-bottom: 1px solid var(--edu-border-light);
}

.filter-group {
  margin-bottom: var(--density-spacing-lg);

  &:last-child {
    margin-bottom: 0;
  }
}

.filter-label {
  display: block;
  font-size: var(--density-font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--edu-text-secondary);
  margin-bottom: var(--density-spacing-sm);
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--density-spacing-sm);
}

.filter-tag {
  cursor: pointer;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);
  user-select: none;

  &:hover {
    transform: translateY(-1px);
  }

  &--active {
    background: var(--edu-primary-500);
    color: white;
    border-color: var(--edu-primary-500);
  }
}

.recommendations-content {
  flex: 1;
  padding: var(--density-padding-xl);
  overflow-y: auto;
}

.recommendations-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--density-spacing-lg);
  margin-bottom: var(--density-spacing-xl);
  padding: var(--density-padding-lg);
  background: var(--edu-bg-secondary);
  border-radius: var(--density-radius-lg);
  border: 1px solid var(--edu-border-light);
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: var(--density-font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--edu-primary-600);
  margin-bottom: var(--density-spacing-xs);
}

.stat-label {
  font-size: var(--density-font-size-sm);
  color: var(--edu-text-secondary);
}

.recommendations-list {
  display: grid;
  gap: var(--density-spacing-lg);
}

.recommendation-card {
  background: var(--edu-bg-primary);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--density-radius-lg);
  padding: var(--density-padding-lg);
  transition: all var(--edu-duration-normal) var(--edu-easing-in-out);

  &:hover {
    border-color: var(--edu-primary-300);
    box-shadow: var(--edu-shadow-md);
    transform: translateY(-2px);
  }
}

.recommendation-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--density-spacing-base);
  gap: var(--density-spacing-base);
}

.recommendation-meta {
  flex: 1;
}

.recommendation-title {
  margin: 0 0 var(--density-spacing-sm) 0;
  font-size: var(--density-font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--edu-text-primary);
  line-height: var(--density-line-height-tight);
}

.recommendation-badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--density-spacing-xs);
}

.recommendation-score {
  text-align: center;
  flex-shrink: 0;
}

.score-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 3px solid currentColor;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--density-font-size-lg);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--density-spacing-xs);
}

.score-label {
  font-size: var(--density-font-size-xs);
  color: var(--edu-text-secondary);
}

.recommendation-content {
  margin-bottom: var(--density-spacing-base);
}

.recommendation-description {
  margin: 0 0 var(--density-spacing-base) 0;
  color: var(--edu-text-secondary);
  line-height: var(--density-line-height-relaxed);
}

.recommendation-reason {
  background: var(--edu-bg-secondary);
  border-radius: var(--density-radius-base);
  padding: var(--density-padding-base);
  margin-bottom: var(--density-spacing-base);
}

.reason-header {
  display: flex;
  align-items: center;
  gap: var(--density-spacing-sm);
  font-weight: var(--font-weight-medium);
  color: var(--edu-text-primary);
  margin-bottom: var(--density-spacing-sm);
}

.reason-list {
  margin: 0;
  padding-left: var(--density-spacing-lg);
  color: var(--edu-text-secondary);
  font-size: var(--density-font-size-sm);

  li {
    margin-bottom: var(--density-spacing-xs);

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.recommendation-preview {
  background: var(--edu-bg-tertiary);
  border-radius: var(--density-radius-base);
  padding: var(--density-padding-base);
}

.preview-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--density-spacing-base);
}

.preview-stat {
  text-align: center;
}

.preview-label {
  display: block;
  font-size: var(--density-font-size-xs);
  color: var(--edu-text-tertiary);
  margin-bottom: var(--density-spacing-xs);
}

.preview-value {
  font-size: var(--density-font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--edu-text-primary);
}

.recommendation-actions {
  display: flex;
  gap: var(--density-spacing-sm);
  justify-content: flex-end;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl);
  text-align: center;
  color: var(--edu-text-secondary);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: var(--density-spacing-lg);
  opacity: 0.5;
}

.skeleton-card {
  padding: var(--density-padding-lg);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--density-radius-lg);
  margin-bottom: var(--density-spacing-lg);
}

// 响应式适配
@media (max-width: 768px) {
  .recommendations-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--density-spacing-base);
  }

  .header-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-options {
    gap: var(--density-spacing-xs);
  }

  .recommendation-header {
    flex-direction: column;
    align-items: stretch;
  }

  .recommendation-score {
    align-self: center;
  }

  .recommendation-actions {
    flex-direction: column;
  }

  .preview-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

// 深色模式适配
[data-theme="dark"] {
  .recommendations-header {
    background: linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(82, 196, 26, 0.1) 100%);
  }

  .recommendations-filters,
  .recommendations-stats,
  .recommendation-reason,
  .recommendation-preview {
    background: var(--bg-elevated);
    border-color: var(--border-color);
  }
}

// 减少动画
@media (prefers-reduced-motion: reduce) {
  .recommendation-card,
  .filter-tag {
    transition: none;
  }
}
</style>