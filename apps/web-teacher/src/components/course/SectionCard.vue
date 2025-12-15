<template>
  <div class="section-card-wrapper">
    <GlassSurface
      variant="card"
      :tinted="isActive"
      class="section-card"
      :class="[`section-type-${section.type}`, { 'is-active': isActive }]"
    >
      <div class="card-header">
        <div class="header-left">
          <el-icon class="type-icon" :size="20">
            <component :is="getTypeIcon(section.type)" />
          </el-icon>
          <span class="section-title">{{ section.title }}</span>
        </div>
        <div class="header-right">
          <el-tag size="small" :type="getTypeTag(section.type)">{{ getTypeText(section.type) }}</el-tag>
        </div>
      </div>
      
      <div class="card-content">
        <p class="section-desc">{{ section.description }}</p>
        <div class="meta-info">
          <span class="duration">
            <el-icon><Timer /></el-icon>
            {{ section.duration }} min
          </span>
          <span class="goals-count" v-if="section.goals.length">
            <el-icon><Aim /></el-icon>
            {{ section.goals.length }} 目标
          </span>
        </div>
      </div>

      <div class="card-actions">
        <slot name="actions">
          <el-button size="small" text @click="$emit('edit', section)">编辑</el-button>
          <el-button size="small" text type="danger" @click="$emit('delete', section)">删除</el-button>
        </slot>
      </div>
    </GlassSurface>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { GlassSurface } from '@reopeninnolab/ui-kit'
import { Monitor, Beaker, ChatDotRound, EditPen, Timer, Aim } from '@element-plus/icons-vue'
import type { ChapterInfo } from '@/composables/useCourseStructure'

interface Props {
  section: ChapterInfo
  isActive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false
})

defineEmits(['edit', 'delete'])

const getTypeIcon = (type: string) => {
  const map: Record<string, any> = {
    content: Monitor,
    experiment: Beaker,
    interactive: ChatDotRound,
    assessment: EditPen
  }
  return map[type] || Monitor
}

const getTypeTag = (type: string) => {
  const map: Record<string, string> = {
    content: 'info',
    experiment: 'success',
    interactive: 'warning',
    assessment: 'danger'
  }
  return map[type] || 'info'
}

const getTypeText = (type: string) => {
  const map: Record<string, string> = {
    content: '知识',
    experiment: '实验',
    interactive: '互动',
    assessment: '考核'
  }
  return map[type] || '未知'
}
</script>

<style scoped lang="scss">
.section-card-wrapper {
  margin-bottom: var(--edu-spacing-md);
}

.section-card {
  transition: all 0.3s ease;
  
  &.is-active {
    border-color: var(--edu-primary);
    transform: translateX(4px);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--edu-spacing-sm);
  padding-bottom: var(--edu-spacing-sm);
  border-bottom: 1px solid var(--edu-border-light);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--edu-spacing-sm);
  
  .type-icon {
    color: var(--edu-text-secondary);
  }
  
  .section-title {
    font-weight: 600;
    font-size: var(--edu-text-lg);
  }
}

.card-content {
  color: var(--edu-text-regular);
  margin-bottom: var(--edu-spacing-md);
  
  .section-desc {
    font-size: var(--edu-text-sm);
    color: var(--edu-text-secondary);
    margin-bottom: var(--edu-spacing-sm);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.meta-info {
  display: flex;
  gap: var(--edu-spacing-md);
  font-size: var(--edu-text-xs);
  color: var(--edu-text-secondary);
  
  span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--edu-spacing-sm);
  border-top: 1px solid var(--edu-border-light);
  padding-top: var(--edu-spacing-sm);
}

// Scoped Type Colors
.section-type-content {
  .type-icon { color: var(--edu-info); }
}
.section-type-experiment {
  .type-icon { color: var(--edu-success); }
}
.section-type-interactive {
  .type-icon { color: var(--edu-warning); }
}
.section-type-assessment {
  .type-icon { color: var(--edu-error); }
}
</style>
