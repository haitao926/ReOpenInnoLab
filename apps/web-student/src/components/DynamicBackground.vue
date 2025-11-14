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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

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

// 响应式状态
const particleCanvas = ref<HTMLCanvasElement | null>(null)
const canvasWidth = ref(1920)
const canvasHeight = ref(1080)
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
  'gradient-background--vibrant': props.intensity === 'vibrant'
}))

const showParticles = computed(() =>
  !props.performanceMode && props.intensity !== 'subtle'
)

const showAurora = computed(() =>
  props.intensity === 'vibrant' && !props.performanceMode
)

const showLightRays = computed(() =>
  props.intensity !== 'subtle' && !props.performanceMode
)

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
    }
  ]
})

const auroraPaths = computed(() => [
  {
    path: 'M0,100 Q200,50 400,100 T800,100 T1200,100',
    opacity: 0.3,
    animation: 'M0,100 Q200,50 400,100 T800,100 T1200,100;M0,120 Q200,70 400,120 T800,120 T1200,120;M0,100 Q200,50 400,100 T800,100 T1200,100'
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
        animation: 'float 20s ease-in-out infinite'
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
        animation: 'lightRayMove 10s ease-in-out infinite'
      }
    }
  ]
})

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
  const particleCount = props.intensity === 'vibrant' ? 50 : 20
  particles.value = []

  for (let i = 0; i < particleCount; i++) {
    particles.value.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 1,
      speedX: (Math.random() - 0.5) * 0.2,
      speedY: (Math.random() - 0.5) * 0.2,
      opacity: Math.random() * 0.3 + 0.1
    })
  }

  animateParticles()
}

const animateParticles = () => {
  if (!particleCanvas.value) return

  const canvas = particleCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  particles.value.forEach(particle => {
    // 更新位置
    particle.x += particle.speedX
    particle.y += particle.speedY

    // 边界检查
    if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1
    if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1

    // 绘制粒子
    ctx.beginPath()
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`
    ctx.fill()
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

// 生命周期
onMounted(() => {
  // 初始化粒子系统
  if (showParticles.value) {
    initParticles()
  }

  // 监听窗口大小变化
  window.addEventListener('resize', resizeCanvas)
})

onUnmounted(() => {
  // 清理动画
  if (animationFrame.value) {
    cancelAnimationFrame(animationFrame.value)
  }

  window.removeEventListener('resize', resizeCanvas)
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
}

.gradient-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  transition: opacity 2s ease;
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

// 动画定义
@keyframes float {
  0%, 100% {
    transform: translateY(0px) scale(1);
  }
  50% {
    transform: translateY(-20px) scale(1.05);
  }
}

@keyframes lightRayMove {
  0%, 100% {
    transform: translateY(0) rotate(25deg);
  }
  50% {
    transform: translateY(50px) rotate(25deg);
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
}
</style>