<template>
  <div class="lesson-section-renderer" :class="sectionTypeClass">
    <!-- 课程引入环节 -->
    <IntroductionSection
      v-if="section.type === 'introduction'"
      :section="section"
      :progress="sectionProgress"
      :student-data="studentData"
      @interaction="$emit('interaction', $event)"
      @progress-update="$emit('progress-update', $event)"
    />

    <!-- 新知讲解环节 -->
    <KnowledgeSection
      v-else-if="section.type === 'knowledge'"
      :section="section"
      :progress="sectionProgress"
      :student-data="studentData"
      @interaction="$emit('interaction', $event)"
      @progress-update="$emit('progress-update', $event)"
    />

    <!-- 体验理解环节 -->
    <ExperienceSection
      v-else-if="section.type === 'experience'"
      :section="section"
      :progress="sectionProgress"
      :student-data="studentData"
      @interaction="$emit('interaction', $event)"
      @progress-update="$emit('progress-update', $event)"
    />

    <!-- 实验活动环节 -->
    <ExperimentSection
      v-else-if="section.type === 'experiment'"
      :section="section"
      :progress="sectionProgress"
      :student-data="studentData"
      @interaction="$emit('interaction', $event)"
      @progress-update="$emit('progress-update', $event)"
    />

    <!-- 作业测试环节 -->
    <AssignmentSection
      v-else-if="section.type === 'assignment'"
      :section="section"
      :progress="sectionProgress"
      :student-data="studentData"
      @interaction="$emit('interaction', $event)"
      @progress-update="$emit('progress-update', $event)"
    />

    <!-- 未知环节类型 -->
    <div v-else class="unknown-section">
      <el-result
        icon="warning"
        title="未知环节类型"
        :sub-title="`环节类型: ${section.type}`"
      >
        <template #extra>
          <el-button type="primary" @click="reportIssue">
            报告问题
          </el-button>
        </template>
      </el-result>
    </div>

    <!-- 环节切换过渡动画 -->
    <transition name="section-fade" mode="out-in">
      <div v-if="isTransitioning" class="transition-overlay">
        <el-icon class="is-loading transition-icon"><Loading /></el-icon>
        <p>正在切换到{{ getSectionTypeName(nextSectionType) }}环节...</p>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import IntroductionSection from './sections/IntroductionSection.vue'
import KnowledgeSection from './sections/KnowledgeSection.vue'
import ExperienceSection from './sections/ExperienceSection.vue'
import ExperimentSection from './sections/ExperimentSection.vue'
import AssignmentSection from './sections/AssignmentSection.vue'
import type { LessonSection, SectionProgress, StudentData, StudentInteraction } from '@/types/lesson'

interface Props {
  section: LessonSection
  sectionProgress: SectionProgress
  studentData: StudentData
}

interface Emits {
  (e: 'interaction', interaction: Omit<StudentInteraction, 'timestamp'>): void
  (e: 'progress-update', progress: SectionProgress): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 状态
const isTransitioning = ref(false)
const nextSectionType = ref('')

// 计算属性
const sectionTypeClass = computed(() => `section-${props.section.type}`)

// 监听环节变化
watch(() => props.section.id, (newId, oldId) => {
  if (newId !== oldId && oldId) {
    isTransitioning.value = true
    nextSectionType.value = props.section.type

    // 模拟过渡时间
    setTimeout(() => {
      isTransitioning.value = false
      nextSectionType.value = ''
    }, 1000)
  }
}, { immediate: true })

// 方法
const getSectionTypeName = (type: string) => {
  const nameMap: Record<string, string> = {
    'introduction': '课程引入',
    'knowledge': '新知讲解',
    'experience': '体验理解',
    'experiment': '实验活动',
    'assignment': '作业测试'
  }
  return nameMap[type] || '未知环节'
}

const reportIssue = () => {
  emit('interaction', {
    type: 'error_report',
    data: {
      sectionId: props.section.id,
      sectionType: props.section.type,
      issue: 'Unknown section type',
      timestamp: new Date()
    }
  })

  ElMessage.info('问题已报告，老师会尽快处理')
}
</script>

<style scoped lang="scss">
.lesson-section-renderer {
  width: 100%;
  height: 100%;
  position: relative;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.unknown-section {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 32px;
}

.transition-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(4px);

  .transition-icon {
    font-size: 48px;
    color: #409eff;
    margin-bottom: 16px;
  }

  p {
    font-size: 16px;
    color: #606266;
    font-weight: 500;
  }
}

// 过渡动画
.section-fade-enter-active,
.section-fade-leave-active {
  transition: opacity 0.3s ease;
}

.section-fade-enter-from,
.section-fade-leave-to {
  opacity: 0;
}

// 不同环节类型的样式
.section-introduction {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.section-knowledge {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.section-experience {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.section-experiment {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
}

.section-assignment {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: white;
}

// 响应式设计
@media (max-width: 768px) {
  .lesson-section-renderer {
    border-radius: 0;
  }

  .transition-overlay {
    .transition-icon {
      font-size: 36px;
    }

    p {
      font-size: 14px;
      padding: 0 20px;
      text-align: center;
    }
  }
}
</style>