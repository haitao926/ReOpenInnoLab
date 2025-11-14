<template>
  <div class="loading-state">
    <div class="loading-content">
      <!-- Spinner -->
      <div class="loading-spinner">
        <el-icon :size="spinnerSize" class="is-loading">
          <Loading />
        </el-icon>
      </div>

      <!-- Loading text -->
      <div v-if="text" class="loading-text">{{ text }}</div>

      <!-- Additional content -->
      <div v-if="$slots.default" class="loading-extra">
        <slot />
      </div>

      <!-- Progress bar (if progress is provided) -->
      <div v-if="progress !== undefined" class="loading-progress">
        <el-progress
          :percentage="progress"
          :show-text="false"
          :stroke-width="4"
        />
        <div class="progress-text">{{ progress }}%</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Loading } from '@element-plus/icons-vue'

interface Props {
  text?: string
  size?: 'small' | 'medium' | 'large'
  progress?: number
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium'
})

const spinnerSize = computed(() => {
  switch (props.size) {
    case 'small':
      return 32
    case 'large':
      return 64
    default:
      return 48
  }
})
</script>

<style scoped>
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  min-height: 200px;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.loading-spinner {
  color: #3b82f6;
}

.loading-text {
  font-size: 14px;
  color: #6b7280;
}

.loading-extra {
  font-size: 12px;
  color: #9ca3af;
}

.loading-progress {
  width: 200px;
  margin-top: 8px;
}

.progress-text {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

/* Loading animation */
:deep(.el-icon.is-loading) {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Dark theme */
:global(.html.dark) .loading-text {
  color: #9ca3af;
}

:global(.html.dark) .progress-text {
  color: #9ca3af;
}
</style>