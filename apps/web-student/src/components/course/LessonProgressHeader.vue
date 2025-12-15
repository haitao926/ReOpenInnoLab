<template>
  <div class="lesson-progress-header">
    <div class="progress-info">
      <el-progress 
        :percentage="percentage" 
        :status="status"
        :stroke-width="8"
        :show-text="false"
      />
      <span class="progress-text">{{ completed }} / {{ total }} 节</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  total?: number
  completed?: number
}

const props = withDefaults(defineProps<Props>(), {
  total: 0,
  completed: 0
})

const percentage = computed(() => {
  if (props.total === 0) return 0
  return Math.min(100, Math.round((props.completed / props.total) * 100))
})

const status = computed(() => {
  return percentage.value >= 100 ? 'success' : ''
})
</script>

<style scoped lang="scss">
.lesson-progress-header {
  width: 200px;
}

.progress-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-text {
  font-size: 12px;
  color: var(--edu-text-secondary);
  text-align: right;
}
</style>
