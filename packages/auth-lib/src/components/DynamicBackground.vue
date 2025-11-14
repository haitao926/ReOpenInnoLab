<template>
  <div class="dynamic-background">
    <!-- 动态渐变背景 -->
    <div class="gradient-background" :class="backgroundClasses">
      <div
        v-for="(layer, index) in gradientLayers"
        :key="index"
        class="gradient-layer"
        :style="layer.style"
      ></div>
    </div>

    <!-- 粒子效果 -->
    <div v-if="showParticles" class="particles-container">
      <canvas
        ref="particleCanvas"
        class="particle-canvas"
        :width="canvasWidth"
        :height="canvasHeight"
      ></canvas>
    </div>

    <!-- 光晕效果 -->
    <div class="aurora-container" v-if="showAurora">
      <svg
        class="aurora-svg"
        :width="canvasWidth"
        :height="canvasHeight"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="auroraGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:0.3">
              <animate attributeName="stop-opacity" values="0.3;0.6;0.3" dur="8s" repeatCount="indefinite" />
            </stop>
            <stop offset="50%" style="stop-color:#764ba2;stop-opacity:0.4">
              <animate attributeName="stop-opacity" values="0.4;0.7;0.4" dur="10s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" style="stop-color:#f093fb;stop-opacity:0.3">
              <animate attributeName="stop-opacity" values="0.3;0.5;0.3" dur="12s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
        </defs>
        <path
          v-for="(aurora, index) in auroraPaths"
          :key="index"
          :d="aurora.path"
          fill="url(#auroraGradient)"
          :opacity="aurora.opacity"
        >
          <animate
            attributeName="d"
            :values="aurora.animation"
            dur="20s"
            repeatCount="indefinite"
          />
        </path>
      </svg>
    </div>

    <!-- 天气效果 -->
    <div v-if="weatherEffect" class="weather-effect">
      <component
        :is="weatherComponent"
        :intensity="weatherIntensity"
        :config="weatherConfig"
      />
    </div>

    <!-- 几何图形装饰 -->
    <div class="geometric-shapes">
      <div
        v-for="(shape, index) in geometricShapes"
        :key="index"
        class="geometric-shape"
        :class="`shape-${shape.type}`"
        :style="shape.style"
      >
        <component :is="shape.component" />
      </div>
    </div>

    <!-- 光线效果 -->
    <div v-if="showLightRays" class="light-rays">
      <div
        v-for="(ray, index) in lightRays"
        :key="index"
        class="light-ray"
        :style="ray.style"
      ></div>
    </div>

    <!-- 交互式光标跟随效果 -->
    <div
      v-if="showCursorEffect"
      ref="cursorEffect"
      class="cursor-effect"
      :style="cursorStyle"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useAnimationSettings } from '../composables/useAnimationSettings'

interface Props {
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
  weather?: any
  userTheme?: 'light' | 'dark' | 'auto'
  intensity?: 'subtle' | 'normal' | 'vibrant'
  enableInteractions?: boolean
  performanceMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  timeOfDay: 'morning',
  userTheme: 'light',
  intensity: 'normal',
  enableInteractions: true,
  performanceMode: false
})

// Composables
const { animationSettings, reducedMotion, prefersReducedMotion } = useAnimationSettings()

// 响应式状态
const particleCanvas = ref<HTMLCanvasElement | null>(null)
const cursorEffect = ref<HTMLElement | null>(null)
const canvasWidth = ref(1920)
const canvasHeight = ref(1080)
const mousePosition = ref({ x: 0, y: 0 })
const animationFrame = ref<number | null>(null)
const particles = ref<any[]>([])

// 计算属性
const backgroundClasses = computed(() => ({
  'gradient-background--morning': props.timeOfDay === 'morning',
  'gradient-background--afternoon': props.timeOfDay === 'afternoon',
  'gradient-background--evening': props.timeOfDay === 'evening',
  'gradient-background--night': props.timeOfDay === 'night',
  'gradient-background--dark': props.userTheme === 'dark',
  'gradient-background--subtle': props.intensity === 'subtle',
  'gradient-background--vibrant': props.intensity === 'vibrant',
  'gradient-background--reduced-motion': reducedMotion.value
}))

const showParticles = computed(() =>
  !props.performanceMode && !prefersReducedMotion.value && props.intensity !== 'subtle'
)

const showAurora = computed(() =>
  props.intensity === 'vibrant' && !props.performanceMode && !prefersReducedMotion.value
)

const showLightRays = computed(() =>
  props.intensity !== 'subtle' && !props.performanceMode
)

const showCursorEffect = computed(() =>
  props.enableInteractions && !prefersReducedMotion.value
)

const weatherEffect = computed(() => props.weather && !props.performanceMode)

const weatherComponent = computed(() => {
  if (!props.weather) return null
  const components = {
    rain: 'WeatherRain',
    snow: 'WeatherSnow',
    clouds: 'WeatherClouds',
    stars: 'WeatherStars'
  }
  return components[props.weather.type as keyof typeof components] || null
})

const weatherIntensity = computed(() => props.weather?.intensity || 'medium')

const weatherConfig = computed(() => props.weather?.config || {})

const gradientLayers = computed(() => {
  const baseColors = getTimeBasedColors()

  return [
    {
      style: {
        background: `linear-gradient(135deg, ${baseColors.primary} 0%, ${baseColors.secondary} 100%)`,
        opacity: 1
      }
    },
    {
      style: {
        background: `radial-gradient(circle at 20% 80%, ${baseColors.accent1} 0%, transparent 50%)`,
        opacity: props.intensity === 'vibrant' ? 0.6 : 0.3
      }
    },
    {
      style: {
        background: `radial-gradient(circle at 80% 20%, ${baseColors.accent2} 0%, transparent 50%)`,
        opacity: props.intensity === 'vibrant' ? 0.4 : 0.2
      }
    },
    {
      style: {
        background: `radial-gradient(circle at 40% 40%, ${baseColors.accent3} 0%, transparent 50%)`,
        opacity: 0.3
      }
    }
  ]
})

const auroraPaths = computed(() => [
  {
    path: 'M0,100 Q200,50 400,100 T800,100 T1200,100',
    opacity: 0.3,
    animation: 'M0,100 Q200,50 400,100 T800,100 T1200,100;M0,120 Q200,70 400,120 T800,120 T1200,120;M0,100 Q200,50 400,100 T800,100 T1200,100'
  },
  {
    path: 'M0,200 Q300,150 600,200 T1200,200',
    opacity: 0.2,
    animation: 'M0,200 Q300,150 600,200 T1200,200;M0,180 Q300,130 600,180 T1200,180;M0,200 Q300,150 600,200 T1200,200'
  }
])

const geometricShapes = computed(() => {
  if (props.intensity === 'subtle') return []

  return [
    {
      type: 'circle',
      component: 'div',
      style: {
        width: '300px',
        height: '300px',
        left: '10%',
        top: '20%',
        background: 'radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%)',
        animation: reducedMotion.value ? 'none' : 'float 20s ease-in-out infinite'
      }
    },
    {
      type: 'triangle',
      component: 'div',
      style: {
        width: '200px',
        height: '200px',
        right: '15%',
        top: '30%',
        background: 'linear-gradient(45deg, rgba(118, 75, 162, 0.1) 0%, transparent 70%)',
        clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
        animation: reducedMotion.value ? 'none' : 'rotate 25s linear infinite'
      }
    },
    {
      type: 'hexagon',
      component: 'div',
      style: {
        width: '150px',
        height: '150px',
        left: '70%',
        bottom: '20%',
        background: 'linear-gradient(60deg, rgba(240, 147, 251, 0.1) 0%, transparent 70%)',
        clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
        animation: reducedMotion.value ? 'none' : 'pulse 15s ease-in-out infinite'
      }
    }
  ]
})

const lightRays = computed(() => {
  if (props.intensity === 'subtle') return []

  return [
    {
      style: {
        left: '20%',
        top: '-10%',
        width: '2px',
        height: '40%',
        background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.3), transparent)',
        transform: 'rotate(25deg)',
        animation: reducedMotion.value ? 'none' : 'lightRayMove 10s ease-in-out infinite'
      }
    },
    {
      style: {
        right: '30%',
        top: '-10%',
        width: '1px',
        height: '35%',
        background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.2), transparent)',
        transform: 'rotate(-15deg)',
        animation: reducedMotion.value ? 'none' : 'lightRayMove 12s ease-in-out infinite 2s'
      }
    },
    {
      style: {
        left: '60%',
        top: '-10%',
        width: '1.5px',
        height: '30%',
        background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.25), transparent)',
        transform: 'rotate(-30deg)',
        animation: reducedMotion.value ? 'none' : 'lightRayMove 15s ease-in-out infinite 4s'
      }
    }
  ]
})

const cursorStyle = computed(() => ({
  left: `${mousePosition.value.x}px`,
  top: `${mousePosition.value.y}px`,
  opacity: showCursorEffect.value ? 1 : 0
}))

// 方法
const getTimeBasedColors = () => {
  const themes = {
    morning: {
      primary: '#667eea',
      secondary: '#a8edea',
      accent1: '#ffd89b',
      accent2: '#ff6b6b',
      accent3: '#4ecdc4'
    },
    afternoon: {
      primary: '#f093fb',
      secondary: '#f5576c',
      accent1: '#4facfe',
      accent2: '#00f2fe',
      accent3: '#43e97b'
    },
    evening: {
      primary: '#fa709a',
      secondary: '#fee140',
      accent1: '#30cfd0',
      accent2: '#330867',
      accent3: '#ff6a00'
    },
    night: {
      primary: '#1e3c72',
      secondary: '#2a5298',
      accent1: '#7f7fd5',
      accent2: '#86a8e7',
      accent3: '#91eae4'
    }
  }

  return themes[props.timeOfDay]
}

const initParticles = () => {
  if (!particleCanvas.value) return

  const canvas = particleCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 设置canvas尺寸
  resizeCanvas()

  // 创建粒子
  const particleCount = props.intensity === 'vibrant' ? 100 : 50
  particles.value = []

  for (let i = 0; i < particleCount; i++) {
    particles.value.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.5 + 0.2,
      pulse: Math.random() * Math.PI * 2
    })
  }

  animateParticles()
}

const animateParticles = () => {
  if (!particleCanvas.value || reducedMotion.value) return

  const canvas = particleCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  particles.value.forEach(particle => {
    // 更新位置
    particle.x += particle.speedX
    particle.y += particle.speedY
    particle.pulse += 0.01

    // 边界检查
    if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1
    if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1

    // 绘制粒子
    const pulseOpacity = particle.opacity + Math.sin(particle.pulse) * 0.2
    ctx.beginPath()
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, pulseOpacity)})`
    ctx.fill()

    // 绘制粒子间连线
    particles.value.forEach(otherParticle => {
      const distance = Math.sqrt(
        Math.pow(particle.x - otherParticle.x, 2) +
        Math.pow(particle.y - otherParticle.y, 2)
      )

      if (distance < 100 && distance > 0) {
        ctx.beginPath()
        ctx.moveTo(particle.x, particle.y)
        ctx.lineTo(otherParticle.x, otherParticle.y)
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * (1 - distance / 100)})`
        ctx.lineWidth = 0.5
        ctx.stroke()
      }
    })
  })

  animationFrame.value = requestAnimationFrame(animateParticles)
}

const resizeCanvas = () => {
  if (!particleCanvas.value) return

  const container = particleCanvas.value.parentElement
  if (!container) return

  canvasWidth.value = container.clientWidth
  canvasHeight.value = container.clientHeight

  particleCanvas.value.width = canvasWidth.value
  particleCanvas.value.height = canvasHeight.value
}

const handleMouseMove = (event: MouseEvent) => {
  if (!showCursorEffect.value) return

  mousePosition.value = {
    x: event.clientX,
    y: event.clientY
  }
}

const handleResize = () => {
  resizeCanvas()
}

// 生命周期
onMounted(async () => {
  await nextTick()

  // 初始化粒子系统
  if (showParticles.value) {
    initParticles()
  }

  // 添加事件监听
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('resize', handleResize)

  // 监听系统动画偏好
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  mediaQuery.addEventListener('change', () => {
    if (prefersReducedMotion.value) {
      cancelAnimationFrame(animationFrame.value!)
    }
  })
})

onUnmounted(() => {
  // 清理动画
  if (animationFrame.value) {
    cancelAnimationFrame(animationFrame.value)
  }

  // 移除事件监听
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('resize', handleResize)
})

// 监听性能模式变化
watch(() => props.performanceMode, (isPerformanceMode) => {
  if (isPerformanceMode) {
    // 停止所有动画
    if (animationFrame.value) {
      cancelAnimationFrame(animationFrame.value)
    }
    particles.value = []
  } else if (showParticles.value && !reducedMotion.value) {
    // 重新启动动画
    initParticles()
  }
})

// 监听减少动画偏好
watch(prefersReducedMotion, (shouldReduce) => {
  if (shouldReduce) {
    // 停止粒子动画
    if (animationFrame.value) {
      cancelAnimationFrame(animationFrame.value)
    }
  } else if (showParticles.value) {
    // 重新启动动画
    animateParticles()
  }
})
</script>

<style scoped lang="scss">
.dynamic-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 0;
}

.gradient-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  transition: all 1s ease;

  &--morning {
    --gradient-primary: #667eea;
    --gradient-secondary: #a8edea;
  }

  &--afternoon {
    --gradient-primary: #f093fb;
    --gradient-secondary: #f5576c;
  }

  &--evening {
    --gradient-primary: #fa709a;
    --gradient-secondary: #fee140;
  }

  &--night {
    --gradient-primary: #1e3c72;
    --gradient-secondary: #2a5298;
  }

  &--dark {
    --gradient-primary: #0f0c29;
    --gradient-secondary: #302b63;
  }

  &--subtle {
    opacity: 0.8;
  }

  &--vibrant {
    filter: saturate(1.2);
  }

  &--reduced-motion {
    * {
      animation: none !important;
      transition: none !important;
    }
  }
}

.gradient-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  transition: opacity 2s ease;

  &:nth-child(1) {
    z-index: 1;
  }

  &:nth-child(2) {
    z-index: 2;
  }

  &:nth-child(3) {
    z-index: 3;
  }

  &:nth-child(4) {
    z-index: 4;
  }
}

.particles-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 5;
  pointer-events: none;
}

.particle-canvas {
  width: 100%;
  height: 100%;
}

.aurora-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3;
  pointer-events: none;
  opacity: 0.6;
}

.aurora-svg {
  width: 100%;
  height: 100%;
}

.weather-effect {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 6;
  pointer-events: none;
}

.geometric-shapes {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  pointer-events: none;
}

.geometric-shape {
  position: absolute;
  filter: blur(40px);
  opacity: 0.7;
  mix-blend-mode: screen;
}

.light-rays {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 4;
  pointer-events: none;
  overflow: hidden;
}

.light-ray {
  position: absolute;
  transform-origin: top center;
  filter: blur(1px);
}

.cursor-effect {
  position: fixed;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  z-index: 7;
  transform: translate(-50%, -50%);
  transition: opacity 0.3s ease;
  mix-blend-mode: screen;
}

// 动画定义
@keyframes float {
  0%, 100% {
    transform: translateY(0px) scale(1);
  }
  33% {
    transform: translateY(-20px) scale(1.05);
  }
  66% {
    transform: translateY(10px) scale(0.95);
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.9;
  }
}

@keyframes lightRayMove {
  0%, 100% {
    transform: translateY(0) rotate(25deg);
    opacity: 0.3;
  }
  50% {
    transform: translateY(50px) rotate(25deg);
    opacity: 0.6;
  }
}

// 性能优化
@media (prefers-reduced-motion: reduce) {
  .dynamic-background {
    * {
      animation: none !important;
      transition: none !important;
    }
  }

  .cursor-effect {
    display: none;
  }
}

// 高性能设备优化
@media (min-resolution: 2dppx) {
  .geometric-shape {
    filter: blur(60px);
  }
}

// 移动设备优化
@media (max-width: 768px) {
  .particle-canvas {
    opacity: 0.5;
  }

  .aurora-container {
    opacity: 0.3;
  }

  .geometric-shape {
    opacity: 0.4;
  }

  .light-rays {
    display: none;
  }

  .cursor-effect {
    display: none;
  }
}
</style>