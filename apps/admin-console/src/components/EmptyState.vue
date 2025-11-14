<template>
  <div class="empty-state">
    <div class="empty-state-content">
      <div class="empty-state-icon">
        <el-icon :size="iconSize">
          <component :is="icon" />
        </el-icon>
      </div>
      <h3 v-if="title" class="empty-state-title">{{ title }}</h3>
      <p v-if="description" class="empty-state-description">{{ description }}</p>
      <div v-if="$slots.actions" class="empty-state-actions">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  icon?: string
  title?: string
  description?: string
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  icon: 'Document',
  size: 'medium'
})

const iconSize = computed(() => {
  switch (props.size) {
    case 'small':
      return 48
    case 'large':
      return 96
    default:
      return 64
  }
})
</script>

<style scoped>
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  min-height: 300px;
}

.empty-state-content {
  max-width: 400px;
}

.empty-state-icon {
  color: #9ca3af;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state-title {
  font-size: 20px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.empty-state-description {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 24px;
  line-height: 1.6;
}

.empty-state-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

/* Dark theme */
:global(.html.dark) .empty-state-title {
  color: #f3f4f6;
}

:global(.html.dark) .empty-state-description {
  color: #9ca3af;
}

:global(.html.dark) .empty-state-icon {
  color: #6b7280;
}
</style>