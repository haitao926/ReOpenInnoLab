<template>
  <EduCard
    :variant="variant"
    :hoverable="hoverable"
    class="timeline-section-card"
    :class="{ 'timeline-section-card--collapsed': isCollapsed }"
  >
    <template #header>
      <div class="timeline-header" @click="toggleCollapse">
        <div class="timeline-info">
          <div class="timeline-indicator">
            <span class="timeline-dot" :class="`timeline-dot--${status}`"></span>
            <div class="timeline-line" v-if="showLine"></div>
          </div>
          <div class="timeline-meta">
            <h3 class="timeline-title">{{ title }}</h3>
            <p class="timeline-subtitle">{{ subtitle }}</p>
          </div>
        </div>
        <div class="timeline-actions">
          <EduTag
            v-if="tag"
            :variant="tagVariant"
            size="xs"
            class="timeline-tag"
          >
            {{ tag }}
          </EduTag>
          <el-button
            type="text"
            size="small"
            class="collapse-btn"
            :class="{ 'collapse-btn--collapsed': isCollapsed }"
          >
            <el-icon>
              <ArrowDown v-if="!isCollapsed" />
              <ArrowRight v-else />
            </el-icon>
          </el-button>
        </div>
      </div>
    </template>

    <template #body>
      <div class="timeline-content" :class="{ 'timeline-content--collapsed': isCollapsed }">
        <div class="timeline-sections">
          <div
            v-for="(section, index) in sections"
            :key="section.id"
            class="timeline-section"
            :class="{ 'timeline-section--active': section.active }"
          >
            <div class="section-header" @click="toggleSection(section.id)">
              <div class="section-indicator">
                <span class="section-number">{{ index + 1 }}</span>
                <div class="section-connector" v-if="index < sections.length - 1"></div>
              </div>
              <div class="section-info">
                <h4 class="section-title">{{ section.title }}</h4>
                <p class="section-description">{{ section.description }}</p>
                <div class="section-meta">
                  <span v-if="section.duration" class="section-duration">
                    <el-icon><Clock /></el-icon>
                    {{ section.duration }}
                  </span>
                  <span v-if="section.difficulty" class="section-difficulty">
                    <el-icon><TrendCharts /></el-icon>
                    {{ section.difficulty }}
                  </span>
                  <span v-if="section.type" class="section-type">
                    <el-icon><Monitor /></el-icon>
                    {{ section.type }}
                  </span>
                </div>
              </div>
              <div class="section-actions">
                <el-button
                  v-if="section.configurable"
                  type="text"
                  size="small"
                  @click.stop="configureSection(section.id)"
                  class="config-btn"
                >
                  <el-icon><Setting /></el-icon>
                </el-button>
                <el-button
                  type="text"
                  size="small"
                  class="expand-btn"
                  :class="{ 'expand-btn--expanded': section.expanded }"
                >
                  <el-icon>
                    <ArrowDown v-if="!section.expanded" />
                    <ArrowUp v-else />
                  </el-icon>
                </el-button>
              </div>
            </div>

            <div
              v-if="section.expanded"
              class="section-content"
              :class="{ 'section-content--expanded': section.expanded }"
            >
              <div class="section-details">
                <div v-if="section.steps" class="section-steps">
                  <h5 class="details-title">实验步骤</h5>
                  <ol class="steps-list">
                    <li v-for="step in section.steps" :key="step.id" class="step-item">
                      <span class="step-text">{{ step.text }}</span>
                      <EduTag
                        v-if="step.type"
                        :variant="getStepVariant(step.type)"
                        size="xs"
                        class="step-tag"
                      >
                        {{ step.type }}
                      </EduTag>
                    </li>
                  </ol>
                </div>

                <div v-if="section.resources" class="section-resources">
                  <h5 class="details-title">所需资源</h5>
                  <div class="resources-grid">
                    <div
                      v-for="resource in section.resources"
                      :key="resource.id"
                      class="resource-item"
                    >
                      <div class="resource-icon" :style="{ backgroundColor: resource.color }">
                        <el-icon><component :is="resource.icon" /></el-icon>
                      </div>
                      <div class="resource-info">
                        <span class="resource-name">{{ resource.name }}</span>
                        <span class="resource-amount">{{ resource.amount }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="section.quota" class="section-quota">
                  <h5 class="details-title">资源配额</h5>
                  <div class="quota-info">
                    <div class="quota-item">
                      <span class="quota-label">CPU 配额</span>
                      <span class="quota-value">{{ section.quota.cpu }}</span>
                    </div>
                    <div class="quota-item">
                      <span class="quota-label">内存配额</span>
                      <span class="quota-value">{{ section.quota.memory }}</span>
                    </div>
                    <div class="quota-item">
                      <span class="quota-label">GPU 配额</span>
                      <span class="quota-value">{{ section.quota.gpu || '无' }}</span>
                    </div>
                    <div class="quota-item">
                      <span class="quota-label">存储配额</span>
                      <span class="quota-value">{{ section.quota.storage }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="section-actions-bar">
                <el-button
                  v-if="section.type === 'jupyter'"
                  type="primary"
                  size="small"
                  @click="launchJupyter(section.id)"
                >
                  <el-icon><Monitor /></el-icon>
                  启动 Jupyter
                </el-button>
                <el-button
                  v-if="section.type === 'model-training'"
                  type="success"
                  size="small"
                  @click="startTraining(section.id)"
                >
                  <el-icon><Cpu /></el-icon>
                  开始训练
                </el-button>
                <el-button
                  type="default"
                  size="small"
                  @click="editSection(section.id)"
                >
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </EduCard>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Clock,
  TrendCharts,
  Monitor,
  Setting,
  Edit,
  Cpu
} from '@element-plus/icons-vue'
import { EduCard, EduTag } from '@reopeninnolab/ui-kit'

interface Section {
  id: string
  title: string
  description: string
  duration?: string
  difficulty?: string
  type?: string
  configurable?: boolean
  active?: boolean
  expanded?: boolean
  steps?: Array<{
    id: string
    text: string
    type?: string
  }>
  resources?: Array<{
    id: string
    name: string
    amount: string
    color: string
    icon: string
  }>
  quota?: {
    cpu: string
    memory: string
    gpu?: string
    storage: string
  }
}

interface Props {
  title: string
  subtitle: string
  status?: 'active' | 'completed' | 'pending' | 'error'
  tag?: string
  tagVariant?: 'success' | 'warning' | 'error' | 'info'
  variant?: 'default' | 'elevated' | 'glass' | 'gradient'
  hoverable?: boolean
  collapsible?: boolean
  showLine?: boolean
  sections: Section[]
}

const props = withDefaults(defineProps<Props>(), {
  status: 'active',
  tagVariant: 'info',
  variant: 'elevated',
  hoverable: true,
  collapsible: true,
  showLine: true
})

const emit = defineEmits<{
  'section-toggle': [sectionId: string, expanded: boolean]
  'section-configure': [sectionId: string]
  'jupyter-launch': [sectionId: string]
  'training-start': [sectionId: string]
  'section-edit': [sectionId: string]
}>()

const isCollapsed = ref(false)

const toggleCollapse = () => {
  if (props.collapsible) {
    isCollapsed.value = !isCollapsed.value
  }
}

const toggleSection = (sectionId: string) => {
  const section = props.sections.find(s => s.id === sectionId)
  if (section) {
    section.expanded = !section.expanded
    emit('section-toggle', sectionId, section.expanded)
  }
}

const configureSection = (sectionId: string) => {
  emit('section-configure', sectionId)
}

const launchJupyter = (sectionId: string) => {
  emit('jupyter-launch', sectionId)
  ElMessage.success('正在启动 Jupyter 环境...')
}

const startTraining = (sectionId: string) => {
  emit('training-start', sectionId)
  ElMessage.success('正在启动模型训练...')
}

const editSection = (sectionId: string) => {
  emit('section-edit', sectionId)
}

const getStepVariant = (type: string): 'success' | 'warning' | 'error' | 'info' => {
  const variants: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    'input': 'info',
    'process': 'warning',
    'output': 'success',
    'analysis': 'info',
    'configuration': 'warning'
  }
  return variants[type] || 'info'
}
</script>

<style scoped lang="scss">
.timeline-section-card {
  transition: all var(--edu-duration-smooth) var(--edu-easing-in-out);

  &--collapsed {
    .timeline-content {
      max-height: 0;
      overflow: hidden;
    }
  }
}

.timeline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  padding: var(--spacing-sm) 0;

  &:hover {
    .timeline-title {
      color: var(--edu-primary-600);
    }
  }
}

.timeline-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
  flex: 1;
}

.timeline-indicator {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.timeline-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--edu-bg-primary);
  border: 3px solid var(--edu-border-base);
  position: relative;
  z-index: 2;

  &--active {
    border-color: var(--edu-success-500);
    background: var(--edu-success-500);
    box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1);
  }

  &--completed {
    border-color: var(--edu-primary-500);
    background: var(--edu-primary-500);
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
  }

  &--pending {
    border-color: var(--edu-warning-500);
    background: var(--edu-bg-primary);
    box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.1);
  }

  &--error {
    border-color: var(--edu-error-500);
    background: var(--edu-error-500);
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
  }
}

.timeline-line {
  width: 2px;
  height: 40px;
  background: var(--edu-border-light);
  margin-top: var(--spacing-xs);
}

.timeline-meta {
  flex: 1;
}

.timeline-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
  transition: color var(--edu-duration-fast) var(--edu-easing-in-out);
}

.timeline-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
  line-height: var(--leading-normal);
}

.timeline-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.timeline-tag {
  flex-shrink: 0;
}

.collapse-btn {
  transition: transform var(--edu-duration-fast) var(--edu-easing-in-out);

  &--collapsed {
    transform: rotate(-90deg);
  }
}

.timeline-content {
  transition: all var(--edu-duration-smooth) var(--edu-easing-in-out);
  overflow: hidden;

  &--collapsed {
    max-height: 0;
    padding: 0;
  }
}

.timeline-sections {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-base) 0;
}

.timeline-section {
  position: relative;
  border: 1px solid var(--edu-border-light);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &--active {
    border-color: var(--edu-primary-300);
    box-shadow: 0 0 0 1px var(--edu-primary-200);
  }

  &:hover {
    border-color: var(--edu-primary-400);
  }
}

.section-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
  padding: var(--spacing-base);
  background: var(--edu-bg-secondary);
  cursor: pointer;
  user-select: none;

  &:hover {
    background: var(--edu-bg-tertiary);
  }
}

.section-indicator {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.section-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--edu-primary-600);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  position: relative;
  z-index: 2;
}

.section-connector {
  width: 2px;
  height: 30px;
  background: var(--edu-border-light);
  margin-top: var(--spacing-xs);
  position: absolute;
  top: 32px;
  left: 50%;
  transform: translateX(-50%);
}

.section-info {
  flex: 1;
  min-width: 0;
}

.section-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.section-description {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-sm) 0;
  line-height: var(--leading-normal);
}

.section-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-base);
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);

  > span {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);

    .el-icon {
      width: 14px;
      height: 14px;
    }
  }
}

.section-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

.config-btn {
  color: var(--text-tertiary);

  &:hover {
    color: var(--edu-primary-600);
  }
}

.expand-btn {
  transition: transform var(--edu-duration-fast) var(--edu-easing-in-out);

  &--expanded {
    transform: rotate(180deg);
  }
}

.section-content {
  border-top: 1px solid var(--edu-border-light);
  background: var(--edu-bg-primary);
  transition: all var(--edu-duration-smooth) var(--edu-easing-in-out);

  &--expanded {
    display: block;
  }
}

.section-details {
  padding: var(--spacing-base);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.details-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-sm) 0;
}

.section-steps {
  .steps-list {
    margin: 0;
    padding: 0 0 0 var(--spacing-lg);
    list-style: none;

    .step-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-xs) 0;
      border-bottom: 1px solid var(--edu-border-light);

      &:last-child {
        border-bottom: none;
      }

      .step-text {
        font-size: var(--font-size-sm);
        color: var(--text-primary);
        line-height: var(--leading-normal);
      }

      .step-tag {
        flex-shrink: 0;
      }
    }
  }
}

.section-resources {
  .resources-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-sm);

    .resource-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm);
      background: var(--edu-bg-secondary);
      border-radius: var(--radius-md);

      .resource-icon {
        width: 32px;
        height: 32px;
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        flex-shrink: 0;

        .el-icon {
          width: 16px;
          height: 16px;
        }
      }

      .resource-info {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
        min-width: 0;

        .resource-name {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--text-primary);
        }

        .resource-amount {
          font-size: var(--font-size-xs);
          color: var(--text-tertiary);
        }
      }
    }
  }
}

.section-quota {
  .quota-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--spacing-sm);

    .quota-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-sm);
      background: var(--edu-bg-secondary);
      border-radius: var(--radius-md);

      .quota-label {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
      }

      .quota-value {
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
        color: var(--text-primary);
      }
    }
  }
}

.section-actions-bar {
  padding: var(--spacing-base);
  background: var(--edu-bg-secondary);
  border-top: 1px solid var(--edu-border-light);
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-end;
}

// 响应式适配
@media (max-width: 768px) {
  .timeline-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-sm);
  }

  .timeline-info {
    gap: var(--spacing-sm);
  }

  .timeline-actions {
    justify-content: space-between;
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-sm);
  }

  .section-meta {
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .section-actions-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .resources-grid {
    grid-template-columns: 1fr;
  }

  .quota-info {
    grid-template-columns: 1fr;
  }
}
</style>