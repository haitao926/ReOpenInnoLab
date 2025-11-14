import { ref, computed, onMounted, onUnmounted } from 'vue'

export function useAnimationSettings() {
  // 响应式状态
  const reducedMotion = ref(false)
  const prefersDark = ref(false)
  const highPerformance = ref(true)
  const frameRate = ref(60)
  const batteryLevel = ref(1.0)
  const isLowPowerMode = ref(false)

  // 动画设置
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

  // 计算属性
  const prefersReducedMotion = computed(() => reducedMotion.value)

  const shouldUseHighQuality = computed(() => {
    return (
      !reducedMotion.value &&
      highPerformance.value &&
      !isLowPowerMode.value &&
      batteryLevel.value > 0.2 &&
      animationSettings.value.quality === 'high'
    )
  })

  const adaptiveAnimationDuration = computed(() => {
    if (reducedMotion.value) return 0
    if (isLowPowerMode.value) return animationSettings.value.animationDuration * 2
    return animationSettings.value.animationDuration
  })

  const adaptiveParticleCount = computed(() => {
    if (!shouldUseHighQuality.value) {
      return Math.floor(animationSettings.value.particleCount * 0.5)
    }
    return animationSettings.value.particleCount
  })

  // 方法
  const detectMotionPreferences = () => {
    // 检测减少动画偏好
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotion.value = motionQuery.matches

    motionQuery.addEventListener('change', (e) => {
      reducedMotion.value = e.matches
      updateAnimationSettings()
    })

    // 检测颜色主题偏好
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')
    prefersDark.value = darkQuery.matches

    darkQuery.addEventListener('change', (e) => {
      prefersDark.value = e.matches
    })
  }

  const detectPerformance = () => {
    // 检测设备性能
    const startMark = 'performance-test-start'
    const endMark = 'performance-test-end'

    performance.mark(startMark)

    // 执行一些计算来测试性能
    const testArray = new Array(1000000).fill(0).map((_, i) => i)
    testArray.reduce((sum, num) => sum + num, 0)

    performance.mark(endMark)
    performance.measure('performance-test', startMark, endMark)

    const measure = performance.getEntriesByName('performance-test')[0]
    const duration = measure.duration

    // 根据执行时间判断性能
    highPerformance.value = duration < 100

    // 检测帧率
    detectFrameRate()

    // 检测电池状态
    detectBatteryStatus()

    updateAnimationSettings()
  }

  const detectFrameRate = () => {
    let lastTime = performance.now()
    let frameCount = 0
    const testDuration = 1000

    const countFrames = (currentTime: number) => {
      frameCount++

      if (currentTime - lastTime >= testDuration) {
        frameRate.value = Math.round((frameCount * 1000) / (currentTime - lastTime))
        updateAnimationSettings()
        return
      }

      requestAnimationFrame(countFrames)
    }

    requestAnimationFrame(countFrames)
  }

  const detectBatteryStatus = async () => {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery()

        batteryLevel.value = battery.level
        isLowPowerMode.value = battery.level < 0.2 || !battery.charging

        battery.addEventListener('levelchange', () => {
          batteryLevel.value = battery.level
          isLowPowerMode.value = battery.level < 0.2 || !battery.charging
          updateAnimationSettings()
        })

        battery.addEventListener('chargingchange', () => {
          isLowPowerMode.value = battery.level < 0.2 || !battery.charging
          updateAnimationSettings()
        })
      } catch (error) {
        console.warn('Battery API not available')
      }
    }
  }

  const updateAnimationSettings = () => {
    // 根据各种条件调整动画设置
    if (reducedMotion.value) {
      animationSettings.value = {
        ...animationSettings.value,
        enableParticles: false,
        enableAurora: false,
        enableGeometricShapes: false,
        enableLightRays: false,
        enableCursorEffects: false,
        enableTransitions: false,
        quality: 'low'
      }
      return
    }

    if (isLowPowerMode.value || batteryLevel.value < 0.3) {
      animationSettings.value = {
        ...animationSettings.value,
        enableParticles: false,
        enableAurora: false,
        enableLightRays: false,
        enableCursorEffects: false,
        particleCount: 20,
        quality: 'low',
        animationDuration: 150
      }
      return
    }

    if (!highPerformance.value || frameRate.value < 30) {
      animationSettings.value = {
        ...animationSettings.value,
        enableAurora: false,
        particleCount: 25,
        quality: 'medium',
        animationDuration: 200
      }
      return
    }

    // 高性能模式
    animationSettings.value = {
      ...animationSettings.value,
      enableParticles: true,
      enableAurora: true,
      enableGeometricShapes: true,
      enableLightRays: true,
      enableCursorEffects: true,
      enableTransitions: true,
      particleCount: 80,
      maxFrameRate: 60,
      quality: 'high',
      animationDuration: 300
    }
  }

  const createOptimizedAnimation = (
    element: HTMLElement,
    keyframes: Keyframe[],
    options?: KeyframeAnimationOptions
  ): Animation => {
    const optimizedOptions: KeyframeAnimationOptions = {
      duration: adaptiveAnimationDuration.value,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      fill: 'forwards',
      ...options
    }

    // 如果用户偏好减少动画，返回空动画
    if (reducedMotion.value) {
      optimizedOptions.duration = 0
    }

    return element.animate(keyframes, optimizedOptions)
  }

  const createSpringAnimation = (
    element: HTMLElement,
    properties: Record<string, string | number>,
    config?: {
      tension?: number
      friction?: number
      mass?: number
    }
  ): Animation => {
    const {
      tension = 300,
      friction = 10,
      mass = 1
    } = config || {}

    // 计算弹簧参数
    const dampingRatio = friction / (2 * Math.sqrt(tension * mass))
    const naturalFreq = Math.sqrt(tension / mass)
    const duration = Math.min(2000, (4 / dampingRatio) * 1000)

    const keyframes: Keyframe[] = [
      { ...properties },
      { ...properties, offset: 0.8 },
      { ...properties }
    ]

    return createOptimizedAnimation(element, keyframes, {
      duration,
      easing: `cubic-bezier(0.175, 0.885, ${0.32 - dampingRatio * 0.1}, ${1.275 - dampingRatio * 0.2})`
    })
  }

  const createStaggeredAnimation = (
    elements: HTMLElement[],
    keyframes: Keyframe[],
    staggerDelay: number = 100
  ): Animation[] => {
    return elements.map((element, index) => {
      const delay = index * staggerDelay
      return createOptimizedAnimation(element, keyframes, { delay })
    })
  }

  const createParallaxEffect = (
    element: HTMLElement,
    intensity: number = 0.5
  ): void => {
    if (reducedMotion.value) return

    const handleMouseMove = (event: MouseEvent) => {
      const { clientX, clientY } = event
      const { innerWidth, innerHeight } = window

      const centerX = innerWidth / 2
      const centerY = innerHeight / 2

      const moveX = (clientX - centerX) * intensity
      const moveY = (clientY - centerY) * intensity

      element.style.transform = `translate(${moveX}px, ${moveY}px)`
    }

    element.addEventListener('mousemove', handleMouseMove)

    // 返回清理函数
    return () => {
      element.removeEventListener('mousemove', handleMouseMove)
    }
  }

  const createScrollTriggeredAnimation = (
    element: HTMLElement,
    keyframes: Keyframe[],
    triggerPoint: number = 0.8
  ): IntersectionObserver => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            createOptimizedAnimation(entry.target as HTMLElement, keyframes)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: triggerPoint }
    )

    observer.observe(element)
    return observer
  }

  const optimizeForMobile = () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

    if (isMobile) {
      animationSettings.value = {
        ...animationSettings.value,
        enableParticles: false,
        enableAurora: false,
        enableLightRays: false,
        enableCursorEffects: false,
        particleCount: 20,
        quality: 'medium',
        animationDuration: 200
      }
    }
  }

  const setQualityPreset = (preset: 'performance' | 'balanced' | 'quality') => {
    switch (preset) {
      case 'performance':
        animationSettings.value = {
          ...animationSettings.value,
          enableParticles: false,
          enableAurora: false,
          enableGeometricShapes: false,
          enableLightRays: false,
          enableCursorEffects: false,
          quality: 'low',
          animationDuration: 150,
          maxFrameRate: 30
        }
        break

      case 'balanced':
        animationSettings.value = {
          ...animationSettings.value,
          enableParticles: true,
          enableAurora: false,
          enableGeometricShapes: true,
          enableLightRays: false,
          enableCursorEffects: true,
          quality: 'medium',
          animationDuration: 250,
          maxFrameRate: 45,
          particleCount: 40
        }
        break

      case 'quality':
        animationSettings.value = {
          ...animationSettings.value,
          enableParticles: true,
          enableAurora: true,
          enableGeometricShapes: true,
          enableLightRays: true,
          enableCursorEffects: true,
          quality: 'high',
          animationDuration: 300,
          maxFrameRate: 60,
          particleCount: 80
        }
        break
    }
  }

  // 性能监控
  const startPerformanceMonitoring = () => {
    const measurePerformance = () => {
      const memory = (performance as any).memory
      if (memory) {
        const memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit

        if (memoryUsage > 0.8) {
          // 内存使用过高，降低动画质量
          setQualityPreset('performance')
        }
      }

      // 检查帧率
      if (frameRate.value < 20) {
        setQualityPreset('performance')
      }
    }

    // 每5秒检查一次性能
    const interval = setInterval(measurePerformance, 5000)

    return () => clearInterval(interval)
  }

  // 生命周期
  onMounted(() => {
    detectMotionPreferences()
    detectPerformance()
    optimizeForMobile()

    const cleanupMonitoring = startPerformanceMonitoring()

    onUnmounted(() => {
      cleanupMonitoring?.()
    })
  })

  return {
    // 状态
    reducedMotion,
    prefersDark,
    highPerformance,
    frameRate,
    batteryLevel,
    isLowPowerMode,
    animationSettings,

    // 计算属性
    prefersReducedMotion,
    shouldUseHighQuality,
    adaptiveAnimationDuration,
    adaptiveParticleCount,

    // 方法
    updateAnimationSettings,
    createOptimizedAnimation,
    createSpringAnimation,
    createStaggeredAnimation,
    createParallaxEffect,
    createScrollTriggeredAnimation,
    setQualityPreset,
    startPerformanceMonitoring
  }
}