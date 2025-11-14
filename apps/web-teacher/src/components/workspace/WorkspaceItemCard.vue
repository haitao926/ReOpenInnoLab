<template>
  <EduCard
    :variant="variant"
    :hoverable="hoverable"
    :selectable="selectable"
    :selected="selected"
    :loading="loading"
    :class="['workspace-item-card', `workspace-item-card--${type}`]"
    @click="handleClick"
  >
    <!-- 选择框 -->
    <template v-if="selectable" #actions>
      <el-checkbox
        :model-value="selected"
        @change="handleSelect"
        @click.stop
      />
    </template>

    <!-- 卡片头部 -->
    <template v-if="showHeader" #header>
      <div class="workspace-item-card__header">
        <div class="workspace-item-card__title-section">
          <h3 class="workspace-item-card__title">{{ title }}</h3>
          <div class="workspace-item-card__tags">
            <el-tag
              v-for="tag in primaryTags"
              :key="tag.text"
              :type="tag.type"
              size="small"
            >
              {{ tag.text }}
            </el-tag>
          </div>
        </div>

        <div class="workspace-item-card__actions" v-if="showActions">
          <el-dropdown @command="handleAction" trigger="click" @click.stop>
            <el-button text size="small">
              <el-icon><MoreFilled /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="action in actions"
                  :key="action.command"
                  :command="action.command"
                  :divided="action.divided"
                >
                  <el-icon v-if="action.icon">
                    <component :is="action.icon" />
                  </el-icon>
                  {{ action.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </template>

    <!-- 卡片主体 -->
    <div class="workspace-item-card__body">
      <!-- 描述信息 -->
      <p v-if="description" class="workspace-item-card__description">
        {{ description }}
      </p>

      <!-- 统计信息区域 -->
      <div v-if="stats && stats.length > 0" class="workspace-item-card__stats">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="workspace-item-card__stat"
        >
          <span class="workspace-item-card__stat-label">{{ stat.label }}</span>
          <div class="workspace-item-card__stat-value">
            <!-- 进度条类型 -->
            <el-progress
              v-if="stat.type === 'progress'"
              :percentage="stat.value"
              :stroke-width="6"
              :color="getProgressColor(stat.value)"
            />
            <!-- 数值类型 -->
            <span v-else-if="stat.type === 'number'" class="stat-number">
              {{ stat.value }}
            </span>
            <!-- 文本类型 -->
            <span v-else class="stat-text">{{ stat.value }}</span>
          </div>
        </div>
      </div>

      <!-- 自定义内容插槽 -->
      <div v-if="$slots.content" class="workspace-item-card__custom-content">
        <slot name="content"></slot>
      </div>

      <!-- 底部信息区 -->
      <div v-if="showFooter" class="workspace-item-card__footer">
        <div class="workspace-item-card__meta">
          <span v-if="date" class="workspace-item-card__date">
            <el-icon><Calendar /></el-icon>
            {{ date }}
          </span>
          <span v-if="author" class="workspace-item-card__author">
            <el-icon><User /></el-icon>
            {{ author }}
          </span>
        </div>

        <div class="workspace-item-card__status">
          <el-tag
            v-if="status"
            :type="status.type"
            size="small"
            :effect="status.effect || 'light'"
          >
            {{ status.text }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 快速操作按钮 -->
    <div v-if="quickActions && quickActions.length > 0" class="workspace-item-card__quick-actions">
      <el-button
        v-for="action in quickActions"
        :key="action.command"
        :type="action.type || 'text'"
        size="small"
        @click.stop="handleQuickAction(action.command)"
      >
        <el-icon v-if="action.icon">
          <component :is="action.icon" />
        </el-icon>
        {{ action.label }}
      </el-button>
    </div>
  </EduCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { EduCard } from '@reopeninnolab/ui-kit'
import { MoreFilled, Calendar, User } from '@element-plus/icons-vue'

interface Tag {
  text: string
  type: 'primary' | 'success' | 'warning' | 'danger' | 'info'
}

interface Stat {
  label: string
  value: string | number
  type?: 'text' | 'number' | 'progress'
  color?: string
}

interface Status {
  text: string
  type: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  effect?: 'light' | 'dark' | 'plain'
}

interface Action {
  command: string
  label: string
  icon?: any
  divided?: boolean
  type?: string
}

interface Props {
  type: 'course' | 'assignment' | 'resource' | 'classroom' | 'lab'
  title: string
  description?: string
  variant?: 'default' | 'bordered' | 'shadow' | 'elevated' | 'glass'
  hoverable?: boolean
  selectable?: boolean
  selected?: boolean
  loading?: boolean

  // 显示控制
  showHeader?: boolean
  showActions?: boolean
  showFooter?: boolean

  // 内容数据
  primaryTags?: Tag[]
  secondaryTags?: Tag[]
  stats?: Stat[]
  status?: Status
  date?: string
  author?: string

  // 操作配置
  actions?: Action[]
  quickActions?: Action[]

  // 自定义样式
  accentColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  hoverable: true,
  selectable: false,
  selected: false,
  loading: false,
  showHeader: true,
  showActions: true,
  showFooter: true,
  primaryTags: () => [],
  secondaryTags: () => [],
  stats: () => [],
  actions: () => [],
  quickActions: () => []
})

const emit = defineEmits<{
  click: [event: MouseEvent]
  select: [selected: boolean]
  action: [command: string]
  quickAction: [command: string]
}>()

const handleClick = (event: MouseEvent) => {
  emit('click', event)
}

const handleSelect = (selected: boolean) => {
  emit('select', selected)
}

const handleAction = (command: string) => {
  emit('action', command)
}

const handleQuickAction = (command: string) => {
  emit('quickAction', command)
}

const getProgressColor = (percentage: number) => {
  if (percentage < 30) return '#f56565'
  if (percentage < 70) return '#ed8936'
  return '#48bb78'
}
</script>

<style lang="scss" scoped>
.workspace-item-card {
  height: 100%;
  transition: all var(--edu-duration-normal) var(--edu-easing-in-out);

  &:hover {
    .workspace-item-card__quick-actions {
      opacity: 1;
      transform: translateY(0);
    }
  }

  // 不同类型的样式变体
  &--course {
    border-left: 4px solid var(--edu-primary-500);
  }

  &--assignment {
    border-left: 4px solid var(--edu-warning-500);

    &.workspace-item-card--urgent {
      border-left-color: var(--edu-danger-500);
      background: linear-gradient(90deg, rgba(239, 68, 68, 0.05) 0%, transparent 100%);
    }
  }

  &--resource {
    border-left: 4px solid var(--edu-success-500);
  }

  &--classroom {
    border-left: 4px solid var(--edu-secondary-500);
  }

  &--lab {
    border-left: 4px solid var(--edu-info-500);
  }
}

.workspace-item-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-base);
}

.workspace-item-card__title-section {
  flex: 1;
  min-width: 0;
}

.workspace-item-card__title {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  line-height: var(--line-height-tight);
}

.workspace-item-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.workspace-item-card__actions {
  flex-shrink: 0;
}

.workspace-item-card__body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
}

.workspace-item-card__description {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.workspace-item-card__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--spacing-base);
}

.workspace-item-card__stat {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.workspace-item-card__stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  font-weight: var(--font-weight-medium);
}

.workspace-item-card__stat-value {
  display: flex;
  align-items: center;
  min-height: 24px;
}

.stat-number {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.stat-text {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.workspace-item-card__custom-content {
  flex: 1;
}

.workspace-item-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-base);
  margin-top: auto;
  padding-top: var(--spacing-base);
  border-top: 1px solid var(--border-color);
}

.workspace-item-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-base);
  flex: 1;
}

.workspace-item-card__date,
.workspace-item-card__author {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);

  .el-icon {
    font-size: 12px;
  }
}

.workspace-item-card__status {
  flex-shrink: 0;
}

.workspace-item-card__quick-actions {
  display: flex;
  gap: var(--spacing-xs);
  opacity: 0;
  transform: translateY(4px);
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);
  margin-top: var(--spacing-base);
  padding-top: var(--spacing-base);
  border-top: 1px solid var(--border-color);
}

// 响应式适配
@media (max-width: 768px) {
  .workspace-item-card__stats {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }

  .workspace-item-card__footer {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .workspace-item-card__quick-actions {
    opacity: 1;
    transform: translateY(0);
  }

  .workspace-item-card__header {
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .workspace-item-card__actions {
    align-self: flex-end;
  }
}

// 深色模式适配
[data-theme="dark"] {
  .workspace-item-card__footer {
    border-top-color: var(--border-color);
  }

  .workspace-item-card__quick-actions {
    border-top-color: var(--border-color);
  }
}
</style>