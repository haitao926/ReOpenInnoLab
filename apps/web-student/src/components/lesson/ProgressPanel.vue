<template>
  <div class="progress-panel">
    <div class="panel-header">
      <h3>课程进度</h3>
      <span>{{ progress }}%</span>
    </div>
    <el-progress :percentage="progress" :stroke-width="8" text-inside />
    <div class="sections-nav">
      <button
        v-for="(section, index) in sections"
        :key="section.id || index"
        type="button"
        class="section-item"
        :class="{
          active: index === currentIndex,
          completed: index < currentIndex
        }"
        @click="emitSelect(index)"
      >
        <div class="section-icon">
          <el-icon>
            <component :is="getSectionIcon(section.type)" />
          </el-icon>
        </div>
        <div class="section-info">
          <p class="section-title">{{ section.title }}</p>
          <p class="section-type">{{ getSectionTypeName(section.type) }}</p>
        </div>
        <span class="section-duration">{{ section.duration || 0 }}′</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LessonSection } from '@/types/lesson'

interface Props {
  sections: LessonSection[]
  currentIndex: number
  progress: number
}

const props = defineProps<Props>()
const emit = defineEmits<{ (e: 'select', index: number): void }>()

const sectionTypeMap: Record<string, { name: string; icon: string }> = {
  introduction: { name: '课程引入', icon: 'VideoPlay' },
  knowledge: { name: '新知讲解', icon: 'Reading' },
  experience: { name: '体验理解', icon: 'Monitor' },
  experiment: { name: '实验活动', icon: 'SetUp' },
  assignment: { name: '作业测试', icon: 'EditPen' }
}

const getSectionIcon = (type: string) => sectionTypeMap[type]?.icon || 'Document'
const getSectionTypeName = (type: string) => sectionTypeMap[type]?.name || '未知环节'

const emitSelect = (index: number) => {
  emit('select', index)
}
</script>

<style scoped lang="scss">
.progress-panel {
  background: white;
  border-radius: 16px;
  padding: 20px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.06);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #0f172a;
  }

  span {
    font-size: 14px;
    color: #3b82f6;
    font-weight: 600;
  }
}

.sections-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #e5e7eb;
  background: transparent;
  border-radius: 12px;
  padding: 12px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #bfdbfe;
    background: #eff6ff;
  }

  &.active {
    border-color: #3b82f6;
    background: #eff6ff;
  }

  &.completed {
    border-color: #22c55e;
    background: #f0fdf4;
  }
}

.section-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;

  .section-item.active & {
    background: #dbeafe;
    color: #1d4ed8;
  }

  .section-item.completed & {
    background: #dcfce7;
    color: #15803d;
  }
}

.section-info {
  flex: 1;

  .section-title {
    margin: 0;
    font-size: 15px;
    font-weight: 500;
    color: #0f172a;
  }

  .section-type {
    margin: 0;
    font-size: 12px;
    color: #64748b;
  }
}

.section-duration {
  font-size: 12px;
  color: #94a3b8;
}
</style>
