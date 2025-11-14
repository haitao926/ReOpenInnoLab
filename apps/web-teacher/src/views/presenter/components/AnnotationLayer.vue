<template>
  <div class="annotation-layer" ref="annotationLayer">
    <!-- 工具栏 -->
    <div class="annotation-toolbar" v-if="showToolbar">
      <div class="toolbar-section">
        <span class="toolbar-label">绘图工具</span>
        <el-button-group>
          <el-button
            size="small"
            :type="currentTool === 'pen' ? 'primary' : 'default'"
            @click="selectTool('pen')"
          >
            <el-icon><EditPen /></el-icon>
          </el-button>
          <el-button
            size="small"
            :type="currentTool === 'highlighter' ? 'primary' : 'default'"
            @click="selectTool('highlighter')"
          >
            <el-icon><Highlight /></el-icon>
          </el-button>
          <el-button
            size="small"
            :type="currentTool === 'eraser' ? 'primary' : 'default'"
            @click="selectTool('eraser')"
          >
            <el-icon><Delete /></el-icon>
          </el-button>
          <el-button
            size="small"
            :type="currentTool === 'text' ? 'primary' : 'default'"
            @click="selectTool('text')"
          >
            <el-icon><Document /></el-icon>
          </el-button>
          <el-button
            size="small"
            :type="currentTool === 'laser' ? 'primary' : 'default'"
            @click="selectTool('laser')"
          >
            <el-icon><Aim /></el-icon>
          </el-button>
        </el-button-group>
      </div>

      <div class="toolbar-section">
        <span class="toolbar-label">颜色</span>
        <div class="color-palette">
          <div
            v-for="color in colors"
            :key="color"
            class="color-item"
            :class="{ active: currentColor === color }"
            :style="{ backgroundColor: color }"
            @click="selectColor(color)"
          />
        </div>
      </div>

      <div class="toolbar-section">
        <span class="toolbar-label">粗细</span>
        <el-slider
          v-model="lineWidth"
          :min="1"
          :max="20"
          :step="1"
          :show-input="false"
          style="width: 100px"
        />
      </div>

      <div class="toolbar-section">
        <el-button size="small" @click="clearCanvas">
          <el-icon><Delete /></el-icon>
          清空
        </el-button>
        <el-button size="small" @click="undo">
          <el-icon><RefreshLeft /></el-icon>
          撤销
        </el-button>
        <el-button size="small" @click="redo">
          <el-icon><RefreshRight /></el-icon>
          重做
        </el-button>
        <el-button size="small" type="primary" @click="saveAnnotation">
          <el-icon><Check /></el-icon>
          保存
        </el-button>
        <el-button size="small" @click="$emit('close')">
          <el-icon><Close /></el-icon>
          关闭
        </el-button>
      </div>
    </div>

    <!-- 画布 -->
    <div class="canvas-container" ref="canvasContainer">
      <!-- 主绘图层 -->
      <canvas
        ref="drawingCanvas"
        class="drawing-canvas"
        @mousedown="startDrawing"
        @mousemove="draw"
        @mouseup="stopDrawing"
        @mouseout="stopDrawing"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      />

      <!-- 高亮层 -->
      <canvas
        ref="highlightCanvas"
        class="highlight-canvas"
        @mousedown="startDrawing"
        @mousemove="draw"
        @mouseup="stopDrawing"
        @mouseout="stopDrawing"
      />

      <!-- 文本层 -->
      <div
        v-for="text in textAnnotations"
        :key="text.id"
        class="text-annotation"
        :style="{
          left: text.x + 'px',
          top: text.y + 'px',
          color: text.color,
          fontSize: text.fontSize + 'px'
        }"
        @dblclick="editText(text)"
      >
        {{ text.content }}
      </div>

      <!-- 激光笔层 -->
      <div
        v-if="laserVisible"
        class="laser-pointer"
        :style="{
          left: laserPosition.x + 'px',
          top: laserPosition.y + 'px',
          backgroundColor: laserColor
        }"
      />

      <!-- 输入框（用于添加文本） -->
      <el-input
        v-if="showTextInput"
        ref="textInput"
        v-model="textInputValue"
        type="textarea"
        :rows="2"
        :style="{
          position: 'absolute',
          left: textInputPosition.x + 'px',
          top: textInputPosition.y + 'px',
          width: '200px',
          zIndex: 1000
        }"
        @blur="finishTextInput"
        @keydown.enter.exact="finishTextInput"
        @keydown.ctrl.enter.exact="finishTextInput"
        placeholder="输入文本..."
      />
    </div>

    <!-- 状态显示 -->
    <div class="annotation-status" v-if="showStatus">
      <span>{{ currentToolLabel }}</span>
      <span v-if="currentTool !== 'laser'">
        <div
          class="status-color"
          :style="{ backgroundColor: currentColor }"
        />
        {{ lineWidth }}px
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  EditPen,
  Highlight,
  Delete,
  Document,
  Aim,
  Check,
  Close,
  RefreshLeft,
  RefreshRight
} from '@element-plus/icons-vue'

interface TextAnnotation {
  id: string
  x: number
  y: number
  content: string
  color: string
  fontSize: number
}

interface DrawingAction {
  type: 'draw' | 'erase' | 'text' | 'clear'
  tool: string
  color: string
  lineWidth: number
  data: any
  timestamp: number
}

const props = defineProps({
  showToolbar: {
    type: Boolean,
    default: true
  },
  showStatus: {
    type: Boolean,
    default: true
  },
  initialColor: {
    type: String,
    default: '#ff4757'
  },
  initialLineWidth: {
    type: Number,
    default: 3
  }
})

const emit = defineEmits<{
  save: [annotation: {
    imageData: string
    actions: DrawingAction[]
    textAnnotations: TextAnnotation[]
    timestamp: number
  }]
  close: []
}>()

// 响应式数据
const annotationLayer = ref<HTMLElement>()
const canvasContainer = ref<HTMLElement>()
const drawingCanvas = ref<HTMLCanvasElement>()
const highlightCanvas = ref<HTMLCanvasElement>()
const textInput = ref<HTMLInputElement>()

const currentTool = ref<'pen' | 'highlighter' | 'eraser' | 'text' | 'laser'>('pen')
const currentColor = ref(props.initialColor)
const lineWidth = ref(props.initialLineWidth)

const isDrawing = ref(false)
const lastX = ref(0)
const lastY = ref(0)

const textAnnotations = ref<TextAnnotation[]>([])
const laserVisible = ref(false)
const laserPosition = ref({ x: 0, y: 0 })
const laserColor = ref('#ff0000')

const showTextInput = ref(false)
const textInputPosition = ref({ x: 0, y: 0 })
let textInputValue = ref('')

const drawingHistory = ref<DrawingAction[]>([])
const historyStep = ref(-1)

// 颜色配置
const colors = [
  '#ff4757', // 红色
  '#ff6348', // 橙红色
  '#ffa502', // 橙色
  '#ffdd59', // 黄色
  '#05c46b', // 绿色
  '#00d2d3', // 青色
  '#3742fa', // 蓝色
  '#5f27cd', // 紫色
  '#ffffff', // 白色
  '#2f3542', // 黑色
]

// 计算属性
const currentToolLabel = computed(() => {
  const labels = {
    pen: '画笔',
    highlighter: '荧光笔',
    eraser: '橡皮擦',
    text: '文本',
    laser: '激光笔'
  }
  return labels[currentTool.value]
})

// 方法
const selectTool = (tool: typeof currentTool.value) => {
  currentTool.value = tool

  if (tool === 'laser') {
    laserVisible.value = true
    hideCursor()
  } else {
    laserVisible.value = false
    showCursor()
  }

  if (tool === 'text') {
    if (canvasContainer.value) {
      canvasContainer.value.style.cursor = 'text'
    }
  } else if (tool === 'eraser') {
    if (canvasContainer.value) {
      canvasContainer.value.style.cursor = 'grab'
    }
  } else {
    if (canvasContainer.value) {
      canvasContainer.value.style.cursor = 'crosshair'
    }
  }
}

const selectColor = (color: string) => {
  currentColor.value = color
}

const startDrawing = (e: MouseEvent | TouchEvent) => {
  if (currentTool.value === 'laser') return
  if (currentTool.value === 'text') {
    handleTextClick(e)
    return
  }

  isDrawing.value = true

  const point = getEventPosition(e)
  lastX.value = point.x
  lastY.value = point.y

  const ctx = currentTool.value === 'highlighter' ? highlightCanvas.value?.getContext('2d') : drawingCanvas.value?.getContext('2d')
  if (!ctx) return

  ctx.beginPath()
  ctx.moveTo(point.x, point.y)
}

const draw = (e: MouseEvent | TouchEvent) => {
  if (!isDrawing.value) return
  if (currentTool.value === 'laser' || currentTool.value === 'text') return

  const point = getEventPosition(e)
  const ctx = currentTool.value === 'highlighter' ? highlightCanvas.value?.getContext('2d') : drawingCanvas.value?.getContext('2d')
  if (!ctx) return

  if (currentTool.value === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.lineWidth = lineWidth.value * 3
  } else {
    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = currentColor.value
    ctx.lineWidth = lineWidth.value

    if (currentTool.value === 'highlighter') {
      ctx.globalAlpha = 0.3
    } else {
      ctx.globalAlpha = 1
    }
  }

  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  ctx.beginPath()
  ctx.moveTo(lastX.value, lastY.value)
  ctx.lineTo(point.x, point.y)
  ctx.stroke()

  lastX.value = point.x
  lastY.value = point.y
}

const stopDrawing = () => {
  if (isDrawing.value) {
    isDrawing.value = false
    saveToHistory()
  }
}

const handleTouchStart = (e: TouchEvent) => {
  e.preventDefault()
  const touch = e.touches[0]
  const mouseEvent = new MouseEvent('mousedown', {
    clientX: touch.clientX,
    clientY: touch.clientY
  })
  startDrawing(mouseEvent)
}

const handleTouchMove = (e: TouchEvent) => {
  e.preventDefault()
  const touch = e.touches[0]
  const mouseEvent = new MouseEvent('mousemove', {
    clientX: touch.clientX,
    clientY: touch.clientY
  })
  draw(mouseEvent)
}

const handleTouchEnd = (e: TouchEvent) => {
  e.preventDefault()
  const mouseEvent = new MouseEvent('mouseup', {})
  stopDrawing()
}

const getEventPosition = (e: MouseEvent | TouchEvent): { x: number, y: number } => {
  const canvas = currentTool.value === 'highlighter' ? highlightCanvas.value : drawingCanvas.value
  if (!canvas) return { x: 0, y: 0 }

  const rect = canvas.getBoundingClientRect()
  let clientX, clientY

  if ('touches' in e) {
    clientX = e.touches[0].clientX
    clientY = e.touches[0].clientY
  } else {
    clientX = e.clientX
    clientY = e.clientY
  }

  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  }
}

const handleTextClick = (e: MouseEvent | TouchEvent) => {
  const point = getEventPosition(e)
  textInputPosition.value = point
  textInputValue = ''
  showTextInput.value = true

  nextTick(() => {
    textInput.value?.focus()
  })
}

const finishTextInput = () => {
  if (!textInputValue.value.trim()) {
    showTextInput.value = false
    return
  }

  const text: TextAnnotation = {
    id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    x: textInputPosition.value.x,
    y: textInputPosition.value.y,
    content: textInputValue.value.trim(),
    color: currentColor.value,
    fontSize: lineWidth.value * 4
  }

  textAnnotations.value.push(text)
  showTextInput.value = false

  saveToHistory()
}

const editText = (text: TextAnnotation) => {
  textInputPosition.value = { x: text.x, y: text.y }
  textInputValue = text.content
  showTextInput.value = true

  nextTick(() => {
    textInput.value?.focus()
    textInput.value?.select()
  })
}

const clearCanvas = () => {
  const drawingCtx = drawingCanvas.value?.getContext('2d')
  const highlightCtx = highlightCanvas.value?.getContext('2d')

  if (drawingCtx) {
    drawingCtx.clearRect(0, 0, drawingCanvas.value!.width, drawingCanvas.value!.height)
  }
  if (highlightCtx) {
    highlightCtx.clearRect(0, 0, highlightCanvas.value!.width, highlightCanvas.value!.height)
  }

  textAnnotations.value = []
  saveToHistory()
}

const saveToHistory = () => {
  const action: DrawingAction = {
    type: 'draw',
    tool: currentTool.value,
    color: currentColor.value,
    lineWidth: lineWidth.value,
    data: {
      canvasData: getCanvasData(),
      textAnnotations: [...textAnnotations.value]
    },
    timestamp: Date.now()
  }

  // 移除当前步骤之后的历史
  drawingHistory.value = drawingHistory.value.slice(0, historyStep.value + 1)
  drawingHistory.value.push(action)
  historyStep.value++
}

const undo = () => {
  if (historyStep.value <= 0) return

  historyStep.value--
  restoreFromHistory()
}

const redo = () => {
  if (historyStep.value >= drawingHistory.value.length - 1) return

  historyStep.value++
  restoreFromHistory()
}

const restoreFromHistory = () => {
  if (historyStep.value < 0) {
    clearCanvas()
    return
  }

  const action = drawingHistory.value[historyStep.value]
  if (!action) return

  // 恢复画布数据
  const img = new Image()
  img.onload = () => {
    const drawingCtx = drawingCanvas.value?.getContext('2d')
    const highlightCtx = highlightCanvas.value?.getContext('2d')

    if (drawingCtx && highlightCtx) {
      drawingCtx.clearRect(0, 0, drawingCanvas.value!.width, drawingCanvas.value!.height)
      highlightCtx.clearRect(0, 0, highlightCanvas.value!.width, highlightCanvas.value!.height)

      drawingCtx.drawImage(img, 0, 0)
    }
  }
  img.src = action.data.canvasData

  // 恢复文本注释
  textAnnotations.value = [...action.data.textAnnotations]
}

const getCanvasData = (): string => {
  // 合并两个画布的数据
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = drawingCanvas.value!.width
  tempCanvas.height = drawingCanvas.value!.height
  const tempCtx = tempCanvas.getContext('2d')

  if (tempCtx) {
    // 先绘制高亮层
    tempCtx.drawImage(highlightCanvas.value!, 0, 0)
    // 再绘制绘图层
    tempCtx.drawImage(drawingCanvas.value!, 0, 0)
  }

  return tempCanvas.toDataURL()
}

const saveAnnotation = () => {
  const annotation = {
    imageData: getCanvasData(),
    actions: drawingHistory.value,
    textAnnotations: textAnnotations.value,
    timestamp: Date.now()
  }

  emit('save', annotation)
  ElMessage.success('批注已保存')
}

const hideCursor = () => {
  if (canvasContainer.value) {
    canvasContainer.value.style.cursor = 'none'
  }
}

const showCursor = () => {
  if (canvasContainer.value) {
    canvasContainer.value.style.cursor = 'crosshair'
  }
}

// 初始化画布
const initCanvas = () => {
  if (!canvasContainer.value) return

  const rect = canvasContainer.value.getBoundingClientRect()
  const width = rect.width
  const height = rect.height

  // 设置画布大小
  if (drawingCanvas.value) {
    drawingCanvas.value.width = width
    drawingCanvas.value.height = height
  }

  if (highlightCanvas.value) {
    highlightCanvas.value.width = width
    highlightCanvas.value.height = height
  }

  // 设置高亮层样式
  if (highlightCanvas.value) {
    const ctx = highlightCanvas.value.getContext('2d')
    if (ctx) {
      ctx.globalAlpha = 0.3
    }
  }
}

// 处理窗口大小变化
const handleResize = () => {
  initCanvas()
}

// 生命周期
onMounted(() => {
  initCanvas()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// 监听工具变化
watch(currentTool, (newTool) => {
  if (newTool === 'laser') {
    document.addEventListener('mousemove', updateLaserPosition)
  } else {
    document.removeEventListener('mousemove', updateLaserPosition)
    laserVisible.value = false
  }
})

const updateLaserPosition = (e: MouseEvent) => {
  if (!canvasContainer.value || !laserVisible.value) return

  const rect = canvasContainer.value.getBoundingClientRect()
  laserPosition.value = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }
}
</script>

<style lang="scss" scoped>
.annotation-layer {
  position: relative;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  overflow: hidden;
}

.annotation-toolbar {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 12px 20px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  flex-wrap: wrap;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-label {
  font-size: 12px;
  color: #909399;
  font-weight: 500;
  min-width: 60px;
}

.color-palette {
  display: flex;
  gap: 4px;
}

.color-item {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }

  &.active {
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  }
}

.canvas-container {
  position: relative;
  flex: 1;
  overflow: hidden;
  cursor: crosshair;
}

.drawing-canvas,
.highlight-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.highlight-canvas {
  pointer-events: none;
}

.text-annotation {
  position: absolute;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;

  &:hover {
    background: rgba(240, 248, 255, 0.9);
    border-color: #409eff;
  }
}

.laser-pointer {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  pointer-events: none;
  z-index: 1000;
  box-shadow: 0 0 10px currentColor;
  animation: laserPulse 1s infinite alternate;
}

@keyframes laserPulse {
  from {
    transform: scale(1);
    opacity: 1;
  }
  to {
    transform: scale(1.2);
    opacity: 0.8;
  }
}

.annotation-status {
  position: absolute;
  bottom: 12px;
  left: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 16px;
  font-size: 12px;
  z-index: 10;

  .status-color {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 1px solid white;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .annotation-toolbar {
    padding: 8px 12px;
    gap: 16px;
  }

  .toolbar-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .toolbar-label {
    min-width: auto;
  }

  .color-palette {
    flex-wrap: wrap;
    max-width: 120px;
  }
}
</style>