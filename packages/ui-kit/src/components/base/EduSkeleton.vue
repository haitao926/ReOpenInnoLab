<template>
  <div class="edu-skeleton" :class="skeletonClasses">
    <!-- 骨架屏内容 -->
    <template v-if="variant === 'text'">
      <el-skeleton
        :animated="animated"
        :throttle="throttle"
      >
        <template #template>
          <div
            v-for="i in lines"
            :key="i"
            class="skeleton-text-line"
            :style="getTextLineStyle(i)"
          >
            <el-skeleton-item variant="text" />
          </div>
        </template>
      </el-skeleton>
    </template>

    <template v-else-if="variant === 'card'">
      <el-skeleton
        :animated="animated"
        :throttle="throttle"
      >
        <template #template>
          <div class="skeleton-card">
            <el-skeleton-item variant="image" class="skeleton-avatar" />
            <div class="skeleton-card-content">
              <el-skeleton-item variant="h3" class="skeleton-title" />
              <el-skeleton-item variant="text" class="skeleton-subtitle" />
              <div class="skeleton-text-lines">
                <el-skeleton-item variant="text" />
                <el-skeleton-item variant="text" />
                <el-skeleton-item variant="text" style="width: 60%" />
              </div>
              <div class="skeleton-actions">
                <el-skeleton-item variant="button" style="width: 80px" />
                <el-skeleton-item variant="button" style="width: 80px" />
              </div>
            </div>
          </div>
        </template>
      </el-skeleton>
    </template>

    <template v-else-if="variant === 'list'">
      <el-skeleton
        :animated="animated"
        :throttle="throttle"
      >
        <template #template>
          <div
            v-for="i in rows"
            :key="i"
            class="skeleton-list-item"
          >
            <el-skeleton-item variant="circle" class="skeleton-list-avatar" />
            <div class="skeleton-list-content">
              <el-skeleton-item variant="h3" class="skeleton-list-title" />
              <el-skeleton-item variant="text" class="skeleton-list-subtitle" />
              <el-skeleton-item variant="text" style="width: 70%" />
            </div>
          </div>
        </template>
      </el-skeleton>
    </template>

    <template v-else-if="variant === 'table'">
      <el-skeleton
        :animated="animated"
        :throttle="throttle"
      >
        <template #template>
          <div class="skeleton-table">
            <div class="skeleton-table-header">
              <el-skeleton-item variant="text" style="width: 120px" />
              <el-skeleton-item variant="text" style="width: 100px" />
              <el-skeleton-item variant="text" style="width: 80px" />
              <el-skeleton-item variant="text" style="width: 150px" />
            </div>
            <div
              v-for="i in rows"
              :key="i"
              class="skeleton-table-row"
            >
              <el-skeleton-item variant="text" />
              <el-skeleton-item variant="text" />
              <el-skeleton-item variant="text" />
              <el-skeleton-item variant="text" />
            </div>
          </div>
        </template>
      </el-skeleton>
    </template>

    <template v-else-if="variant === 'chart'">
      <div class="skeleton-chart">
        <div class="skeleton-chart-header">
          <el-skeleton-item variant="h3" style="width: 150px" />
          <el-skeleton-item variant="text" style="width: 100px" />
        </div>
        <div class="skeleton-chart-content">
          <div class="skeleton-chart-bars">
            <div
              v-for="i in 8"
              :key="i"
              class="skeleton-chart-bar"
              :style="{ height: `${Math.random() * 60 + 20}%` }"
            ></div>
          </div>
          <div class="skeleton-chart-legend">
            <el-skeleton-item variant="text" style="width: 80px" />
            <el-skeleton-item variant="text" style="width: 80px" />
            <el-skeleton-item variant="text" style="width: 80px" />
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="variant === 'form'">
      <el-skeleton
        :animated="animated"
        :throttle="throttle"
      >
        <template #template>
          <div class="skeleton-form">
            <div class="skeleton-form-group">
              <el-skeleton-item variant="text" style="width: 80px" />
              <el-skeleton-item variant="text" />
            </div>
            <div class="skeleton-form-group">
              <el-skeleton-item variant="text" style="width: 80px" />
              <el-skeleton-item variant="text" />
              <el-skeleton-item variant="text" style="width: 60%" />
            </div>
            <div class="skeleton-form-group">
              <el-skeleton-item variant="text" style="width: 80px" />
              <el-skeleton-item variant="text" />
              <el-skeleton-item variant="text" />
              <el-skeleton-item variant="text" />
            </div>
            <div class="skeleton-form-actions">
              <el-skeleton-item variant="button" style="width: 100px" />
              <el-skeleton-item variant="button" style="width: 80px" />
            </div>
          </div>
        </template>
      </el-skeleton>
    </template>

    <template v-else-if="variant === 'dashboard'">
      <div class="skeleton-dashboard">
        <!-- 统计卡片骨架 -->
        <div class="skeleton-stats-grid">
          <div
            v-for="i in 4"
            :key="i"
            class="skeleton-stat-card"
          >
            <el-skeleton-item variant="circle" class="skeleton-stat-icon" />
            <div class="skeleton-stat-content">
              <el-skeleton-item variant="h3" class="skeleton-stat-value" />
              <el-skeleton-item variant="text" class="skeleton-stat-label" />
            </div>
          </div>
        </div>

        <!-- 图表骨架 -->
        <div class="skeleton-dashboard-charts">
          <div class="skeleton-chart-card">
            <el-skeleton-item variant="h3" style="width: 120px" />
            <div class="skeleton-mini-chart"></div>
          </div>
          <div class="skeleton-chart-card">
            <el-skeleton-item variant="h3" style="width: 120px" />
            <div class="skeleton-mini-chart"></div>
          </div>
        </div>

        <!-- 列表骨架 -->
        <div class="skeleton-dashboard-list">
          <el-skeleton-item variant="h3" style="width: 150px" />
          <div
            v-for="i in 5"
            :key="i"
            class="skeleton-list-item-compact"
          >
            <el-skeleton-item variant="circle" class="skeleton-mini-avatar" />
            <div class="skeleton-compact-content">
              <el-skeleton-item variant="text" />
              <el-skeleton-item variant="text" style="width: 60%" />
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 自定义内容插槽 -->
    <template v-else>
      <slot>
        <el-skeleton
          :animated="animated"
          :throttle="throttle"
        >
          <template #template>
            <el-skeleton-item variant="text" />
          </template>
        </el-skeleton>
      </slot>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'text' | 'card' | 'list' | 'table' | 'chart' | 'form' | 'dashboard' | 'custom'
  animated?: boolean
  lines?: number
  rows?: number
  loading?: boolean
  throttle?: number
  width?: string | number
  height?: string | number
  shape?: 'circle' | 'rect' | 'round'
  size?: 'large' | 'default' | 'small'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'text',
  animated: true,
  lines: 3,
  rows: 3,
  loading: true,
  throttle: 400,
  shape: 'rect',
  size: 'default'
})

// 计算属性
const skeletonClasses = computed(() => [
  'edu-skeleton',
  `edu-skeleton--${props.variant}`,
  `edu-skeleton--${props.size}`,
  {
    'edu-skeleton--animated': props.animated,
    'edu-skeleton--loading': props.loading
  }
])

// 获取文本行样式
const getTextLineStyle = (lineIndex: number) => {
  if (props.lines === 1) return {}

  const widthVariations = ['100%', '90%', '75%', '85%', '60%']
  const widthIndex = (lineIndex - 1) % widthVariations.length
  return { width: widthVariations[widthIndex] }
}
</script>

<style scoped lang="scss">
.edu-skeleton {
  width: 100%;
  height: auto;

  &--loading {
    pointer-events: none;
  }

  &--small {
    font-size: var(--density-font-size-sm);
  }

  &--large {
    font-size: var(--density-font-size-lg);
  }
}

// 文本骨架
.skeleton-text-line {
  margin-bottom: var(--density-spacing-sm);

  &:last-child {
    margin-bottom: 0;
  }
}

// 卡片骨架
.skeleton-card {
  display: flex;
  align-items: flex-start;
  gap: var(--density-spacing-base);
  padding: var(--density-padding-lg);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--density-radius-lg);
  background: var(--edu-bg-primary);
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--density-radius-lg);
  flex-shrink: 0;
}

.skeleton-card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--density-spacing-sm);
}

.skeleton-title {
  margin-bottom: var(--density-spacing-xs) !important;
}

.skeleton-subtitle {
  margin-bottom: var(--density-spacing-base) !important;
}

.skeleton-text-lines {
  display: flex;
  flex-direction: column;
  gap: var(--density-spacing-xs);
}

.skeleton-actions {
  display: flex;
  gap: var(--density-spacing-sm);
  margin-top: var(--density-spacing-base);
}

// 列表骨架
.skeleton-list-item {
  display: flex;
  align-items: center;
  gap: var(--density-spacing-base);
  padding: var(--density-padding-base);
  border-bottom: 1px solid var(--edu-border-light);

  &:last-child {
    border-bottom: none;
  }
}

.skeleton-list-avatar {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.skeleton-list-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--density-spacing-xs);
}

.skeleton-list-title {
  margin-bottom: var(--density-spacing-xs) !important;
}

.skeleton-list-subtitle {
  margin-bottom: var(--density-spacing-xs) !important;
}

// 表格骨架
.skeleton-table {
  width: 100%;
  border: 1px solid var(--edu-border-light);
  border-radius: var(--density-radius-base);
  overflow: hidden;
}

.skeleton-table-header {
  display: flex;
  padding: var(--density-padding-base);
  background: var(--edu-bg-secondary);
  border-bottom: 1px solid var(--edu-border-light);
  gap: var(--density-spacing-base);
}

.skeleton-table-row {
  display: flex;
  padding: var(--density-padding-base);
  border-bottom: 1px solid var(--edu-border-light);
  gap: var(--density-spacing-base);

  &:last-child {
    border-bottom: none;
  }
}

// 图表骨架
.skeleton-chart {
  background: var(--edu-bg-primary);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--density-radius-lg);
  padding: var(--density-padding-lg);
}

.skeleton-chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--density-spacing-lg);
}

.skeleton-chart-content {
  display: flex;
  flex-direction: column;
  gap: var(--density-spacing-base);
}

.skeleton-chart-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 200px;
  padding: var(--density-padding-base);
  background: var(--edu-bg-secondary);
  border-radius: var(--density-radius-base);
}

.skeleton-chart-bar {
  width: 30px;
  background: linear-gradient(to top, var(--edu-primary-200), var(--edu-primary-100));
  border-radius: var(--density-radius-sm) var(--density-radius-sm) 0 0;
  transition: height var(--edu-duration-normal) var(--edu-easing-in-out);
}

.skeleton-chart-legend {
  display: flex;
  justify-content: center;
  gap: var(--density-spacing-lg);
}

// 表单骨架
.skeleton-form {
  background: var(--edu-bg-primary);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--density-radius-lg);
  padding: var(--density-padding-lg);
}

.skeleton-form-group {
  margin-bottom: var(--density-spacing-base);

  &:last-child {
    margin-bottom: 0;
  }
}

.skeleton-form-actions {
  display: flex;
  gap: var(--density-spacing-sm);
  margin-top: var(--density-spacing-lg);
}

// 仪表板骨架
.skeleton-dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--density-spacing-xl);
}

.skeleton-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--density-spacing-base);
}

.skeleton-stat-card {
  display: flex;
  align-items: center;
  gap: var(--density-spacing-base);
  padding: var(--density-padding-lg);
  background: var(--edu-bg-primary);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--density-radius-lg);
}

.skeleton-stat-icon {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.skeleton-stat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--density-spacing-xs);
}

.skeleton-stat-value {
  margin-bottom: var(--density-spacing-xs) !important;
}

.skeleton-stat-label {
  margin-bottom: 0 !important;
}

.skeleton-dashboard-charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--density-spacing-base);
}

.skeleton-chart-card {
  background: var(--edu-bg-primary);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--density-radius-lg);
  padding: var(--density-padding-lg);
  display: flex;
  flex-direction: column;
  gap: var(--density-spacing-base);
}

.skeleton-mini-chart {
  height: 120px;
  background: var(--edu-bg-secondary);
  border-radius: var(--density-radius-base);
}

.skeleton-dashboard-list {
  background: var(--edu-bg-primary);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--density-radius-lg);
  padding: var(--density-padding-lg);
  display: flex;
  flex-direction: column;
  gap: var(--density-spacing-base);
}

.skeleton-list-item-compact {
  display: flex;
  align-items: center;
  gap: var(--density-spacing-sm);
  padding: var(--density-padding-sm);
  border-bottom: 1px solid var(--edu-border-light);

  &:last-child {
    border-bottom: none;
  }
}

.skeleton-mini-avatar {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.skeleton-compact-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--density-spacing-xs);
}

// 动画效果
.edu-skeleton--animated {
  .skeleton-chart-bar {
    animation: pulse-bar 1.5s ease-in-out infinite;
  }

  @keyframes pulse-bar {
    0%, 100% {
      opacity: 0.6;
    }
    50% {
      opacity: 1;
    }
  }
}

// 响应式适配
@media (max-width: 768px) {
  .skeleton-stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }

  .skeleton-dashboard-charts {
    grid-template-columns: 1fr;
  }

  .skeleton-chart-bars {
    height: 150px;
  }

  .skeleton-chart-bar {
    width: 20px;
  }
}

@media (max-width: 480px) {
  .skeleton-stats-grid {
    grid-template-columns: 1fr;
  }

  .skeleton-card {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .skeleton-actions {
    justify-content: center;
  }

  .skeleton-form-actions {
    flex-direction: column;
  }
}

// 深色模式适配
[data-theme="dark"] {
  .skeleton-card,
  .skeleton-chart,
  .skeleton-form,
  .skeleton-stat-card,
  .skeleton-chart-card,
  .skeleton-dashboard-list {
    background: var(--bg-elevated);
    border-color: var(--border-color);
  }

  .skeleton-table-header {
    background: var(--bg-surface);
  }

  .skeleton-chart-bars {
    background: var(--bg-surface);
  }

  .skeleton-mini-chart {
    background: var(--bg-surface);
  }
}

// 减少动画
@media (prefers-reduced-motion: reduce) {
  .edu-skeleton--animated {
    .skeleton-chart-bar {
      animation: none;
    }
  }
}
</style>