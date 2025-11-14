<template>
  <StudentCourseLayout>
    <div class="course-detail">
      <div class="course-header">
        <h1>{{ courseStore.currentCourse?.title }}</h1>
        <p>{{ courseStore.currentCourse?.description }}</p>
        <div class="course-meta">
          <EduTag :variant="getSubjectVariant(courseStore.currentCourse?.subject || '')">
            {{ getSubjectName(courseStore.currentCourse?.subject || '') }}
          </EduTag>
          <span class="course-info">{{ courseStore.currentCourse?.className }}</span>
          <span class="course-info">{{ courseStore.currentCourse?.teacherName }}</span>
        </div>
      </div>

      <div class="course-content">
        <ChapterFlow
          :chapters="courseStore.currentChapters"
          @activity-open="openActivityDrawer"
          @complete="courseStore.completeChapter"
        />
      </div>
    </div>

    <ActivityDrawer
      v-model="activityDrawerVisible"
      :activity="currentActivity"
    />
  </StudentCourseLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import StudentCourseLayout from '@/components/layout/StudentCourseLayout.vue'
import ChapterFlow from '@/components/course/ChapterFlow.vue'
import ActivityDrawer from '@/components/course/ActivityDrawer.vue'
import EduTag from '@reopeninnolab/ui-kit'
import { useCourseStore } from '@/stores/course'

const route = useRoute()
const courseStore = useCourseStore()

const activityDrawerVisible = ref(false)
const currentActivity = ref<any>(null)

const getSubjectVariant = (subject: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' | 'default' => {
  const variants: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
    ai: 'primary',
    it: 'info',
    'data-science': 'success',
    robotics: 'warning',
    maker: 'danger'
  }
  return variants[subject] || 'default'
}

const getSubjectName = (subject: string): string => {
  const map: Record<string, string> = {
    ai: '人工智能',
    it: '信息技术',
    'data-science': '数据科学',
    robotics: '智能机器人',
    maker: '创客实践'
  }
  return map[subject] || '综合'
}

const openActivityDrawer = (activity: any) => {
  currentActivity.value = activity
  activityDrawerVisible.value = true
}

onMounted(async () => {
  const courseId = route.params.courseId as string
  if (courseId) {
    await courseStore.selectCourse(courseId)
  }
})

watch(() => route.params.courseId, async (newCourseId) => {
  if (newCourseId) {
    await courseStore.selectCourse(newCourseId as string)
  }
})
</script>

<style scoped lang="scss">
.course-detail {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.course-header {
  text-align: center;
}

.course-header h1 {
  font-size: 32px;
  font-weight: 700;
  color: var(--edu-text-primary);
  margin: 0 0 12px 0;
}

.course-header p {
  font-size: 18px;
  color: var(--edu-text-secondary);
  margin: 0 0 20px 0;
  line-height: 1.6;
}

.course-meta {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.course-info {
  font-size: 14px;
  color: var(--edu-text-secondary);
}

.course-content {
  min-height: 400px;
}

@media (max-width: 768px) {
  .course-header h1 {
    font-size: 24px;
  }

  .course-header p {
    font-size: 16px;
  }

  .course-meta {
    gap: 12px;
  }
}
</style>