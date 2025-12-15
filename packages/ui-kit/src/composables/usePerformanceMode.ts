import { ref, readonly } from 'vue'

const isLowPerf = ref(false)

// Initial detection logic
if (typeof navigator !== 'undefined') {
  // Heuristic 1: Low CPU core count often correlates with lower GPU performance
  // Devices with < 4 logical processors are likely older or budget devices
  const lowCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4
  
  // Heuristic 2: User preference for reduced motion
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Set initial state
  if (lowCores || reducedMotion) {
    isLowPerf.value = true
  }
}

export function usePerformanceMode() {
  const setLowPerf = (value: boolean) => {
    isLowPerf.value = value
  }

  const togglePerfMode = () => {
    isLowPerf.value = !isLowPerf.value
  }

  return {
    isLowPerf: readonly(isLowPerf),
    setLowPerf,
    togglePerfMode
  }
}
