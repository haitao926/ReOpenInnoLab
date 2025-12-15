<template>
  <DensityContainer
    variant="card"
    :gap="gap"
    :padding="padding"
    :rounded="rounded"
    :hoverable="hoverable"
    class="density-card-list"
  >
    <div
      v-for="card in cards"
      :key="card.id"
      class="density-card"
      :class="{
        'density-card--clickable': clickable,
        'density-card--selected': selectedCardIds.includes(card.id)
      }"
      @click="handleCardClick(card)"
    >
      <!-- 卡片头部 -->
      <header v-if="card.title || card.subtitle" class="card-header">
        <div class="card-title-section">
          <h3 v-if="card.title" class="card-title">{{ card.title }}</h3>
          <p v-if="card.subtitle" class="card-subtitle">{{ card.subtitle }}</p>
        </div>
        <div v-if="$slots.headerActions" class="card-header-actions">
          <slot name="headerActions" :card="card" />
        </div>
      </header>

      <!-- 卡片内容 -->
      <div class="card-content">
        <slot name="content" :card="card">
          <p v-if="card.description" class="card-description">{{ card.description }}</p>

          <!-- 标签 -->
          <div v-if="card.tags && card.tags.length > 0" class="card-tags">
            <EduTag
              v-for="tag in card.tags"
              :key="tag.id || tag"
              :variant="tag.variant || 'default'"
              :size="isCompact ? 'xs' : 'sm'"
              class="card-tag"
            >
              {{ tag.label || tag }}
            </EduTag>
          </div>

          <!-- 元数据 -->
          <div v-if="card.metadata" class="card-metadata">
            <div
              v-for="(value, key) in card.metadata"
              :key="key"
              class="metadata-item"
            >
              <span class="metadata-label">{{ key }}:</span>
              <span class="metadata-value">{{ value }}</span>
            </div>
          </div>
        </slot>
      </div>

      <!-- 卡片底部 -->
      <footer v-if="$slots.footer || card.actions" class="card-footer">
        <slot name="footer" :card="card">
          <div v-if="card.actions" class="card-actions">
            <el-button
              v-for="action in card.actions"
              :key="action.key"
              :type="action.type || 'default'"
              :size="isCompact ? 'small' : 'default'"
              :variant="action.variant"
              @click.stop="handleAction(action, card)"
            >
              {{ action.label }}
            </el-button>
          </div>
        </slot>
      </footer>

      <!-- 选择指示器 -->
      <div v-if="selectable && selectedCardIds.includes(card.id)" class="selection-indicator">
        <el-icon><Check /></el-icon>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!cards || cards.length === 0" class="empty-state">
      <el-icon class="empty-icon"><Document /></el-icon>
      <p class="empty-text">{{ emptyText }}</p>
      <el-button
        v-if="emptyAction"
        type="primary"
        @click="handleEmptyAction"
      >
        {{ emptyAction }}
      </el-button>
    </div>
  </DensityContainer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDensity } from '@/composables/useDensity'
import { Check, Document } from '@element-plus/icons-vue'
import { EduTag } from '@reopeninnolab/ui-kit'
import DensityContainer from './EduDensityContainer.vue'
import { ElMessage } from 'element-plus'

interface CardTag {
  id?: string
  label: string
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
}

interface CardAction {
  key: string
  label: string
  type?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'text' | 'default'
  variant?: 'default' | 'text' | 'dashed' | 'link'
  handler?: (card: any, action: CardAction) => void
}

interface Card {
  id: string | number
  title?: string
  subtitle?: string
  description?: string
  tags?: CardTag[]
  metadata?: Record<string, any>
  actions?: CardAction[]
  [key: string]: any
}

interface Props {
  cards: Card[]
  gap?: 'xs' | 'sm' | 'base' | 'lg' | 'xl'
  padding?: 'xs' | 'sm' | 'base' | 'lg' | 'xl'
  rounded?: 'none' | 'sm' | 'base' | 'lg' | 'xl'
  clickable?: boolean
  selectable?: boolean
  hoverable?: boolean
  multiSelect?: boolean
  emptyText?: string
  emptyAction?: string
  layout?: 'grid' | 'list'
  columns?: number
}

const props = withDefaults(defineProps<Props>(), {
  gap: 'base',
  padding: 'base',
  rounded: 'lg',
  clickable: false,
  selectable: false,
  hoverable: true,
  multiSelect: false,
  emptyText: '暂无内容',
  layout: 'grid',
  columns: 3
})

const emit = defineEmits<{
  'card-click': [card: Card, event: MouseEvent]
  'selection-change': [selectedIds: (string | number)[]]
  'action': [action: CardAction, card: Card]
  'empty-action': []
}>()

const { isCompact } = useDensity()

// 选中的卡片ID
const selectedCardIds = ref<(string | number)[]>([])

// 计算布局样式
const layoutStyles = computed(() => {
  if (props.layout === 'grid') {
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${props.columns}, 1fr)`,
      gap: isCompact.value ? 'var(--density-spacing-base)' : 'var(--density-card-gap)'
    }
  }
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: isCompact.value ? 'var(--density-spacing-sm)' : 'var(--density-card-gap)'
  }
})

// 处理卡片点击
const handleCardClick = (card: Card) => {
  emit('card-click', card, new MouseEvent('click'))

  if (props.selectable) {
    if (props.multiSelect) {
      const index = selectedCardIds.value.indexOf(card.id)
      if (index > -1) {
        selectedCardIds.value.splice(index, 1)
      } else {
        selectedCardIds.value.push(card.id)
      }
    } else {
      selectedCardIds.value = [card.id]
    }
    emit('selection-change', [...selectedCardIds.value])
  }
}

// 处理动作
const handleAction = (action: CardAction, card: Card) => {
  if (action.handler) {
    action.handler(card, action)
  }
  emit('action', action, card)
}

// 处理空状态动作
const handleEmptyAction = () => {
  emit('empty-action')
}
</script>

<style scoped lang="scss">
.density-card-list {
  width: 100%;
}

.density-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--edu-bg-primary);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--density-radius-lg);
  overflow: hidden;
  transition: all var(--edu-duration-normal) var(--edu-easing-in-out);

  &--clickable {
    cursor: pointer;

    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--edu-shadow-lg);
      border-color: var(--edu-primary-300);
    }

    &:active {
      transform: translateY(0);
    }
  }

  &--selected {
    border-color: var(--edu-primary-500);
    background: var(--edu-primary-50);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--density-spacing-base);
  padding: var(--density-card-padding);
  padding-bottom: calc(var(--density-card-padding) * 0.75);
}

.card-title-section {
  flex: 1;
  min-width: 0;
}

.card-title {
  margin: 0 0 var(--density-spacing-xs) 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  line-height: var(--density-line-height-tight);
}

.card-subtitle {
  margin: 0;
  font-size: var(--density-font-size-sm);
  color: var(--text-secondary);
  line-height: var(--density-line-height-normal);
}

.card-header-actions {
  display: flex;
  gap: var(--density-spacing-sm);
  flex-shrink: 0;
}

.card-content {
  flex: 1;
  padding: 0 var(--density-card-padding);
  padding-bottom: calc(var(--density-card-padding) * 0.75);
}

.card-description {
  margin: 0 0 var(--density-spacing-base) 0;
  font-size: var(--density-font-size-base);
  color: var(--text-secondary);
  line-height: var(--density-line-height-normal);
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--density-spacing-sm);
  margin-bottom: var(--density-spacing-base);
}

.card-tag {
  font-size: var(--density-font-size-xs);
}

.card-metadata {
  display: flex;
  flex-direction: column;
  gap: var(--density-spacing-xs);
  margin-bottom: var(--density-spacing-base);
}

.metadata-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--density-font-size-sm);
}

.metadata-label {
  color: var(--text-tertiary);
  font-weight: var(--font-weight-medium);
}

.metadata-value {
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--density-spacing-sm);
  padding: 0 var(--density-card-padding);
  padding-top: calc(var(--density-card-padding) * 0.75);
  border-top: 1px solid var(--edu-border-light);
}

.card-actions {
  display: flex;
  gap: var(--density-spacing-sm);
}

.selection-indicator {
  position: absolute;
  top: var(--density-spacing-sm);
  right: var(--density-spacing-sm);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--edu-primary-500);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  z-index: 10;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl);
  text-align: center;
  color: var(--text-tertiary);
  min-height: 300px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: var(--spacing-base);
  opacity: 0.5;
}

.empty-text {
  margin: 0 0 var(--spacing-base) 0;
  font-size: var(--font-size-base);
}

// 紧凑模式调整
.density-container--compact {
  .card-header {
    padding: var(--density-padding-base);
    padding-bottom: var(--density-padding-sm);
  }

  .card-title {
    font-size: var(--density-font-size-base);
  }

  .card-subtitle {
    font-size: var(--density-font-size-xs);
  }

  .card-content {
    padding: 0 var(--density-padding-base);
    padding-bottom: var(--density-padding-sm);
  }

  .card-description {
    font-size: var(--density-font-size-sm);
    margin-bottom: var(--density-spacing-sm);
  }

  .card-tags {
    gap: var(--density-spacing-xs);
    margin-bottom: var(--density-spacing-sm);
  }

  .card-metadata {
    gap: var(--density-spacing-xs);
    margin-bottom: var(--density-spacing-sm);
  }

  .card-footer {
    padding: 0 var(--density-padding-base);
    padding-top: var(--density-padding-sm);
  }

  .selection-indicator {
    width: 20px;
    height: 20px;
    font-size: 12px;
  }
}

// 深色模式适配
[data-theme="dark"] {
  .density-card {
    background: var(--bg-surface);
    border-color: var(--border-color);

    &--clickable:hover {
      background: var(--bg-elevated);
      border-color: var(--edu-primary-400);
    }

    &--selected {
      background: rgba(33, 150, 243, 0.1);
      border-color: var(--edu-primary-500);
    }
  }

  .card-header,
  .card-footer {
    border-color: var(--border-color);
  }

  .card-description {
    color: var(--text-secondary);
  }

  .metadata-label {
    color: var(--text-tertiary);
  }
}

// 响应式适配
@media (max-width: 1024px) {
  .density-card-list {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .density-card-list {
    grid-template-columns: 1fr;
  }

  .card-header {
    flex-direction: column;
    gap: var(--density-spacing-sm);
    align-items: stretch;
  }

  .card-header-actions {
    justify-content: flex-end;
  }

  .card-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .card-actions {
    justify-content: stretch;
  }
}

@media (max-width: 480px) {
  .card-header {
    padding: var(--density-padding-sm);
    padding-bottom: var(--density-padding-xs);
  }

  .card-content {
    padding: 0 var(--density-padding-sm);
    padding-bottom: var(--density-padding-xs);
  }

  .card-title {
    font-size: var(--density-font-size-sm);
  }

  .card-footer {
    padding: 0 var(--density-padding-sm);
    padding-top: var(--density-padding-xs);
  }

  .card-actions {
    flex-direction: column;
  }
}
</style>