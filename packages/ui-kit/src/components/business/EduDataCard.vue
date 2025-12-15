<template>
  <div
    class="edu-data-card"
    :class="[
      `edu-data-card--${variant}`,
      `edu-data-card--${size}`,
      {
        'is-clickable': clickable,
        'is-loading': loading,
        'is-disabled': disabled
      }
    ]"
    @click="handleClick"
  >
    <!-- 加载状态 -->
    <div v-if="loading" class="edu-data-card__loading">
      <el-skeleton :rows="3" animated />
    </div>

    <!-- 卡片内容 -->
    <template v-else>
      <!-- 渐变背景 -->
      <div v-if="variant === 'gradient'" class="edu-data-card__gradient" :class="`gradient-${gradientType}`">
        <div class="edu-data-card__pattern"></div>
      </div>

      <!-- 玻璃态效果 -->
      <div v-if="variant === 'glass'" class="edu-data-card__glass-effect"></div>

      <!-- 悬浮效果 -->
      <div v-if="variant === 'hover'" class="edu-data-card__hover-effect">
        <div class="hover-background"></div>
      </div>

      <!-- 卡片头部 -->
      <div v-if="$slots.header || title || icon" class="edu-data-card__header">
        <div class="header-left">
          <div v-if="icon" class="card-icon">
            <el-icon :size="iconSize">
              <component :is="icon" />
            </el-icon>
          </div>
          <div class="header-content">
            <h3 v-if="title" class="card-title">{{ title }}</h3>
            <p v-if="subtitle" class="card-subtitle">{{ subtitle }}</p>
          </div>
        </div>
        <div class="header-right">
          <slot name="header" />
          <el-dropdown v-if="actions.length > 0" trigger="click" @command="handleAction">
            <el-button type="text" class="action-trigger">
              <el-icon><MoreFilled /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="action in actions"
                  :key="action.key"
                  :command="action.key"
                  :icon="action.icon"
                  :disabled="action.disabled"
                >
                  {{ action.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- 卡片主体 -->
      <div class="edu-data-card__body">
        <!-- 统计数据 -->
        <div v-if="stats" class="card-stats">
          <div v-for="(stat, index) in stats" :key="index" class="stat-item">
            <span class="stat-number" :class="`stat-number--${stat.type || 'default'}`">
              {{ stat.value }}
            </span>
            <span class="stat-label">{{ stat.label }}</span>
            <div v-if="stat.trend" class="stat-trend" :class="`trend-${stat.trend}`">
              <el-icon>
                <ArrowUp v-if="stat.trend === 'up'" />
                <ArrowDown v-if="stat.trend === 'down'" />
                <Minus v-if="stat.trend === 'stable'" />
              </el-icon>
              <span>{{ stat.trendValue }}</span>
            </div>
          </div>
        </div>

        <!-- 自定义内容 -->
        <slot />
      </div>

      <!-- 卡片底部 -->
      <div v-if="$slots.footer" class="edu-data-card__footer">
        <slot name="footer" />
      </div>

      <!-- 标签 -->
      <div v-if="tags && tags.length > 0" class="edu-data-card__tags">
        <el-tag
          v-for="tag in tags"
          :key="tag"
          :type="getTagType(tag)"
          size="small"
          effect="plain"
        >
          {{ tag }}
        </el-tag>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { MoreFilled, ArrowUp, ArrowDown, Minus } from '@element-plus/icons-vue'

// 接口定义
interface StatItem {
  value: string | number
  label: string
  type?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
}

interface ActionItem {
  key: string
  label: string
  icon?: any
  disabled?: boolean
}

// Props
const props = withDefaults(defineProps<{
  title?: string
  subtitle?: string
  icon?: any
  variant?: 'default' | 'gradient' | 'glass' | 'hover' | 'outlined'
  gradientType?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'small' | 'medium' | 'large'
  stats?: StatItem[]
  tags?: string[]
  clickable?: boolean
  loading?: boolean
  disabled?: boolean
  iconSize?: number
  actions?: ActionItem[]
}>(), {
  variant: 'default',
  gradientType: 'primary',
  size: 'medium',
  stats: () => [],
  tags: () => [],
  clickable: false,
  loading: false,
  disabled: false,
  iconSize: 24,
  actions: () => []
})

// Emits
const emit = defineEmits<{
  click: [event: MouseEvent]
  action: [key: string]
}>()

// 方法
const handleClick = (event: MouseEvent) => {
  if (!props.clickable || props.disabled) return
  emit('click', event)
}

const handleAction = (key: string) => {
  emit('action', key)
}

const getTagType = (tag: string) => {
  const tagTypes: Record<string, string> = {
    '优秀': 'success',
    '需要关注': 'warning',
    '待处理': 'info',
    '紧急': 'danger',
    '理科优势': 'primary',
    '文科优势': 'success',
    '勤奋努力': 'success',
    '需要辅导': 'warning'
  }
  return tagTypes[tag] || ''
}
</script>

<style scoped lang="scss">
.edu-data-card {
  position: relative;
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--card-border, var(--border-color-light));
  border-radius: var(--card-border-radius, var(--border-radius-base));
  padding: var(--card-padding, var(--spacing-md));
  transition: all 0.3s ease;
  overflow: hidden;

  &--clickable {
    cursor: pointer;

    &:hover {
      box-shadow: var(--card-shadow-hover, var(--box-shadow-light));
      transform: translateY(-2px);
    }
  }

  &--loading {
    pointer-events: none;
  }

  &--disabled {
    opacity: 0.6;
    pointer-events: none;
  }

  // 尺寸变体
  &--small {
    padding: var(--spacing-sm);

    .card-title {
      font-size: var(--font-size-base);
    }
  }

  &--large {
    padding: var(--spacing-lg);

    .card-title {
      font-size: var(--font-size-xl);
    }
  }

  // 渐变变体
  &--gradient {
    color: white;
    border: none;

    .edu-data-card__gradient {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: inherit;
      z-index: 0;

      &.gradient-primary {
        background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light-3) 100%);
      }

      &.gradient-success {
        background: linear-gradient(135deg, var(--color-success) 0%, var(--color-success-light-3) 100%);
      }

      &.gradient-warning {
        background: linear-gradient(135deg, var(--color-warning) 0%, var(--color-warning-light-3) 100%);
      }

      &.gradient-danger {
        background: linear-gradient(135deg, var(--color-danger) 0%, var(--color-danger-light-3) 100%);
      }

      &.gradient-info {
        background: linear-gradient(135deg, var(--color-info) 0%, var(--color-info-light-3) 100%);
      }

      .edu-data-card__pattern {
        position: absolute;
        top: 0;
        right: 0;
        width: 200px;
        height: 200px;
        background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
        opacity: 0.3;
      }
    }

    .card-title,
    .card-subtitle,
    .stat-number,
    .stat-label {
      color: white;
    }

    > * {
      position: relative;
      z-index: 1;
    }
  }

  // 玻璃态变体
  &--glass {
    background: rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.18);

    .edu-data-card__glass-effect {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%);
      border-radius: inherit;
      z-index: 0;
    }
  }

  // 悬浮变体
  &--hover {
    .edu-data-card__hover-effect {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 0;
      overflow: hidden;

      .hover-background {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: radial-gradient(circle, var(--color-primary-light-8) 0%, transparent 70%);
        transform: translate(-50%, -50%);
        transition: all 0.5s ease;
      }
    }

    &:hover {
      .hover-background {
        width: 400px;
        height: 400px;
      }
    }
  }

  // 轮廓变体
  &--outlined {
    background: transparent;
    border: 2px solid var(--color-primary);
  }
}

.edu-data-card__loading {
  padding: var(--spacing-md);
}

.edu-data-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-md);

  .header-left {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .card-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: var(--color-primary-light-9);
    border-radius: var(--border-radius-base);
    color: var(--color-primary);
  }

  .header-content {
    flex: 1;

    .card-title {
      margin: 0 0 var(--spacing-xs) 0;
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--text-color-primary);
    }

    .card-subtitle {
      margin: 0;
      font-size: var(--font-size-sm);
      color: var(--text-color-secondary);
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .action-trigger {
    color: var(--text-color-secondary);
  }
}

.edu-data-card__body {
  margin-bottom: var(--spacing-md);
}

.card-stats {
  display: flex;
  gap: var(--spacing-lg);

  .stat-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .stat-number {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);

    &--primary {
      color: var(--color-primary);
    }

    &--success {
      color: var(--color-success);
    }

    &--warning {
      color: var(--color-warning);
    }

    &--danger {
      color: var(--color-danger);
    }
  }

  .stat-label {
    font-size: var(--font-size-sm);
    color: var(--text-color-secondary);
  }

  .stat-trend {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-size-xs);

    &.trend-up {
      color: var(--color-success);
    }

    &.trend-down {
      color: var(--color-danger);
    }

    &.trend-stable {
      color: var(--text-color-secondary);
    }
  }
}

.edu-data-card__footer {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border-color-light);
}

.edu-data-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-sm);
}
</style>