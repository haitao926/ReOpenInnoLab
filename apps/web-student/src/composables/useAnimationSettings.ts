import { ref, computed } from 'vue'

export function useAnimationSettings() {
  const reducedMotion = ref(false)
  const shouldUseHighQuality = ref(true)

  const animationSettings = ref({
    enableParticles: true,
    enableAurora: true,
    enableGeometricShapes: true,
    enableLightRays: true,
    enableCursorEffects: true,
    enableTransitions: true,
    animationDuration: 300,
    particleCount: 50,
    maxFrameRate: 60,
    quality: 'high' as 'high' | 'medium' | 'low'
  })

  return {
    reducedMotion,
    shouldUseHighQuality,
    animationSettings
  }
}