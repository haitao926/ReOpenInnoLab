<template>
  <div
    class="glass-surface"
    :class="[
      `glass-${variant}`,
      { 'glass-tinted': tinted }
    ]"
    :style="glassStyle"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'base' | 'card' | 'panel'
  tinted?: boolean
  blur?: number
  forceLowPerf?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'base',
  tinted: false,
  blur: 10,
  forceLowPerf: false
})

// Simple performance check (mock for now, ideally could use a hook)
const isLowPerf = false 

const glassStyle = computed(() => {
  if (isLowPerf || props.forceLowPerf) {
    return {
      '--glass-blur': '0px',
      backdropFilter: 'none',
      backgroundColor: 'rgba(255, 255, 255, 0.95)'
    }
  }

  return {
    '--glass-blur': `${props.blur}px`,
    backdropFilter: `blur(${props.blur}px)`
  }
})
</script>

<style scoped lang="scss">
.glass-surface {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &.glass-base {
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  &.glass-card {
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.4);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
    
    &:hover {
        background: rgba(255, 255, 255, 0.75);
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    }
  }

  &.glass-panel {
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.6);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  }
  
  &.glass-tinted {
      // Add subtle tint via pseudo-element or directly
      // For simplicity, just mixing in a bit of primary color
      background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.8),
        rgba(var(--scene-rgb-reading, 91, 143, 249), 0.05)
      );
  }
}

// Dark mode adaptations if needed, relying on global CSS vars usually better
</style>
