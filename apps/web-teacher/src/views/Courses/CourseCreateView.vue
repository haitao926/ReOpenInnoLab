<template>
  <div class="course-create-view immersive">
    <PageBasedWizard />
  </div>
</template>

<script setup lang="ts">
import PageBasedWizard from './wizards/PageBasedWizard.vue'
</script>

<style scoped lang="scss">
.course-create-view {
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.wizard-container {
  background: var(--edu-surface-card, #ffffff);
  border-radius: var(--edu-border-radius-xl);
  box-shadow: var(--edu-shadow-lg);
  padding: var(--spacing-lg);
}
</style>
