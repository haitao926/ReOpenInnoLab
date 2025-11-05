<template>
  <div class="course-create-view">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">创建课程</h1>
        <p class="page-description">通过课程向导快速搭建 AI 赋能的教学流程</p>
      </div>
      <div class="header-actions">
        <el-button @click="backToList">
          <el-icon><ArrowLeft /></el-icon>
          返回课程列表
        </el-button>
      </div>
    </div>

    <div class="wizard-container">
      <CourseWizard />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import CourseWizard from '@/views/Course/CourseWizard.vue'

const router = useRouter()

const backToList = () => {
  router.push({ name: 'Courses' })
}
</script>

<style scoped lang="scss">
.course-create-view {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  max-width: 1280px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-lg);
}

.header-left {
  flex: 1;
}

.page-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs);
}

.page-description {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--font-size-lg);
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.wizard-container {
  background: var(--edu-surface-card, #ffffff);
  border-radius: var(--edu-border-radius-xl);
  box-shadow: var(--edu-shadow-lg);
  padding: var(--spacing-lg);
}
</style>
