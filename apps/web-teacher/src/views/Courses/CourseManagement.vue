<template>
  <CanvasWorkspaceLayout
    title="课程工作台"
    subtitle="管理您的 AI 赋能教学课程"
    v-model:leftCollapsed="leftSidebarCollapsed"
    v-model:rightCollapsed="rightSidebarCollapsed"
  >
    <template #header-controls>
      <WorkspacePrimaryToolbar
        :create-button-text="'创建课程'"
        :import-button-text="'导入课程'"
        :show-ai-button="true"
        :ai-active="aiAssistantVisible"
        @create="createCourse"
        @import="importCourse"
        @ai="toggleAIAssistant"
      />
    </template>

    <template #summary>
      <EduCard
        v-for="card in summaryCards"
        :key="card.id"
        class="summary-card"
        variant="glass"
        size="sm"
        :hoverable="true"
        body-class="summary-card__body"
      >
        <div class="summary-card__content">
          <span class="summary-card__icon" :style="{ background: card.gradient }">
            <el-icon><component :is="card.icon" /></el-icon>
          </span>
          <div class="summary-card__text">
            <span class="summary-card__value">{{ card.value }}</span>
            <span class="summary-card__label">{{ card.label }}</span>
          </div>
        </div>
      </EduCard>
    </template>

    <template #main>
      <EduCard variant="glass" class="course-section-card">
        <section class="course-content">
          <!-- 课程列表 -->
          <el-table v-if="viewMode === 'table'" :data="paginatedCourses" style="width: 100%">
            <el-table-column prop="title" label="课程名称" min-width="200">
              <template #default="{ row }">
                <div class="course-info">
                  <div class="course-main-info">
                    <h4 class="course-title">{{ row.title }}</h4>
                  </div>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <div v-else class="courses-grid">
            <div
              v-for="course in paginatedCourses"
              :key="course.id"
              class="course-card"
              @click="viewCourse(course.id)"
            >
              <div class="course-card__content">
                <h4 class="course-card__title">{{ course.title }}</h4>
              </div>
            </div>
          </div>
        </section>
      </EduCard>
    </template>
  </CanvasWorkspaceLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Plus,
  Cpu,
  TrendCharts,
  User
} from '@element-plus/icons-vue'

import CanvasWorkspaceLayout from '@/components/layout/CanvasWorkspaceLayout.vue'
import WorkspacePrimaryToolbar from '@/components/workspace/WorkspacePrimaryToolbar.vue'
import { EduCard } from '@reopeninnolab/ui-kit'

const router = useRouter()
const viewMode = ref<'table' | 'grid'>('table')
const leftSidebarCollapsed = ref(false)
const rightSidebarCollapsed = ref(false)
const aiAssistantVisible = ref(false)

const summaryCards = computed(() => [
  {
    id: 'courses',
    label: '本学科课程数',
    value: '5',
    icon: Cpu,
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  },
  {
    id: 'progress',
    label: '平均项目进度',
    value: '75%',
    icon: TrendCharts,
    gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)'
  },
  {
    id: 'students',
    label: '覆盖学生',
    value: '120 人',
    icon: User,
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
  }
])

const courses = ref([
  {
    id: '1',
    title: '演示课程 - 物理基础',
    description: '这是一个演示课程',
    progress: 80
  },
  {
    id: '2',
    title: '演示课程 - 化学实验',
    description: '化学实验操作演示',
    progress: 60
  }
])

const paginatedCourses = computed(() => courses.value)

const createCourse = () => {
  ElMessage.info('创建课程功能开发中...')
}

const importCourse = () => {
  ElMessage.info('课程导入功能开发中...')
}

const toggleAIAssistant = () => {
  aiAssistantVisible.value = !aiAssistantVisible.value
}

const viewCourse = (id: string) => {
  router.push(`/courses/${id}`)
}
</script>

<style scoped>
.summary-card {
  width: 100%;
}

.summary-card__content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.summary-card__icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.summary-card__text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-card__value {
  font-size: 22px;
  font-weight: 700;
}

.summary-card__label {
  font-size: 13px;
  color: var(--edu-text-secondary);
}

.course-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.course-section-card {
  width: 100%;
}

.course-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.course-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.course-card {
  display: flex;
  flex-direction: column;
  background: var(--edu-bg-primary);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--edu-radius-lg);
  padding: 20px;
  cursor: pointer;
  transition: all var(--edu-duration-fast);
}

.course-card:hover {
  box-shadow: var(--edu-shadow-md);
  transform: translateY(-2px);
}

.course-card__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
</style>