<template>
  <div
    ref="containerRef"
    class="virtual-scroller"
    :style="containerStyle"
    @scroll="handleScroll"
    @wheel="handleWheel"
  >
    <!-- 虚拟滚动容器 -->
    <div class="virtual-scroller__content" :style="contentStyle">
      <!-- 渲染的可见项目 -->
      <div
        v-for="item in visibleItems"
        :key="getItemKey(item)"
        class="virtual-scroller__item"
        :style="getItemStyle(item)"
        :data-index="getItemIndex(item)"
      >
        <slot
          name="item"
          :item="item"
          :index="getItemIndex(item)"
        >
          <div class="virtual-item-default">
            {{ getItemText(item) }}
          </div>
        </slot>
      </div>
    </div>

    <!-- 加载指示器 -->
    <div v-if="loading" class="virtual-scroller__loading">
      <div class="loading-indicator">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <span>加载中...</span>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && items.length === 0" class="virtual-scroller__empty">
      <slot name="empty">
        <div class="empty-state">
          <el-icon class="empty-icon"><DocumentRemove /></el-icon>
          <p>暂无数据</p>
        </div>
      </slot>
    </div>

    <!-- 上方加载更多 -->
    <div
      v-if="hasMoreUp && showLoadMoreUp"
      class="virtual-scroller__load-more virtual-scroller__load-more--top"
    >
      <el-button
        type="text"
        :loading="loadingUp"
        @click="loadMoreUp"
      >
        <el-icon><ArrowUp /></el-icon>
        加载更多
      </el-button>
    </div>

    <!-- 下方加载更多 -->
    <div
      v-if="hasMoreDown && showLoadMoreDown"
      class="virtual-scroller__load-more virtual-scroller__load-more--bottom"
    >
      <el-button
        type="text"
        :loading="loadingDown"
        @click="loadMoreDown"
      >
        <el-icon><ArrowDown /></el-icon>
        加载更多
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  onMounted,
  onUnmounted,
  nextTick
} from 'vue'
import {
  Loading,
  DocumentRemove,
  ArrowUp,
  ArrowDown
} from '@element-plus/icons-vue'

interface VirtualScrollerItem {
  [key: string]: any
}

interface Props {
  items: VirtualScrollerItem[]
  itemHeight: number | ((item: VirtualScrollerItem, index: number) => number)
  containerHeight?: number
  keyField?: string
  buffer?: number
  threshold?: number
  loading?: boolean
  hasMoreUp?: boolean
  hasMoreDown?: boolean
  showLoadMoreUp?: boolean
  showLoadMoreDown?: boolean
  loadingUp?: boolean
  loadingDown?: boolean
  horizontal?: boolean
  overscan?: number
}

interface Emits {
  'scroll': [event: Event]
  'load-more-up': []
  'load-more-down': []
  'item-visible': [item: VirtualScrollerItem, index: number]
  'item-hidden': [item: VirtualScrollerItem, index: number]
}

const props = withDefaults(defineProps<Props>(), {
  containerHeight: 400,
  keyField: 'id',
  buffer: 5,
  threshold: 100,
  hasMoreUp: false,
  hasMoreDown: false,
  showLoadMoreUp: true,
  showLoadMoreDown: true,
  loadingUp: false,
  loadingDown: false,
  horizontal: false,
  overscan: 3
})

const emit = defineEmits<Emits>()

// 响应式数据
const containerRef = ref<HTMLElement>()
const scrollTop = ref(0)
const containerHeight = ref(props.containerHeight)
const visibleStartIndex = ref(0)
const visibleEndIndex = ref(0)

// 计算属性
const containerStyle = computed(() => ({
  height: `${containerHeight.value}px`,
  overflow: 'auto',
  position: 'relative'
}))

const totalHeight = computed(() => {
  if (props.items.length === 0) return 0

  let height = 0
  for (let i = 0; i < props.items.length; i++) {
    height += getItemHeight(props.items[i], i)
  }
  return height
})

const contentStyle = computed(() => ({
  height: `${totalHeight.value}px`,
  position: 'relative',
  minHeight: '100%'
}))

const visibleItems = computed(() => {
  if (props.items.length === 0) return []

  const result: VirtualScrollerItem[] = []
  let currentHeight = 0
  let startIndex = -1
  let endIndex = -1

  // 找到可见范围的起始和结束索引
  for (let i = 0; i < props.items.length; i++) {
    const itemHeight = getItemHeight(props.items[i], i)
    const itemEnd = currentHeight + itemHeight

    if (itemEnd > scrollTop.value && currentHeight < scrollTop.value + containerHeight.value + props.buffer * itemHeight) {
      if (startIndex === -1) {
        startIndex = Math.max(0, i - props.overscan)
      }
      endIndex = Math.min(props.items.length - 1, i + props.overscan)
    }

    currentHeight = itemHeight
  }

  if (startIndex === -1) return result

  visibleStartIndex.value = startIndex
  visibleEndIndex.value = endIndex

  // 添加缓冲区项目
  for (let i = startIndex; i <= endIndex; i++) {
    result.push(props.items[i])
  }

  return result
})

// 方法
const getItemHeight = (item: VirtualScrollerItem, index: number): number => {
  if (typeof props.itemHeight === 'function') {
    return props.itemHeight(item, index)
  }
  return props.itemHeight as number
}

const getItemKey = (item: VirtualScrollerItem): string | number => {
  return item[props.keyField] ?? item
}

const getItemIndex = (item: VirtualScrollerItem): number => {
  if (props.keyField) {
    return props.items.findIndex(i => i[props.keyField] === item[props.keyField])
  }
  return props.items.indexOf(item)
}

const getItemStyle = (item: VirtualScrollerItem): Record<string, any> => {
  const index = getItemIndex(item)
  let offsetTop = 0

  for (let i = 0; i < index; i++) {
    offsetTop += getItemHeight(props.items[i], i)
  }

  const height = getItemHeight(item, index)

  return {
    position: 'absolute',
    top: `${offsetTop}px`,
    left: '0',
    right: '0',
    height: `${height}px`,
    zIndex: 1
  }
}

const getItemText = (item: VirtualScrollerItem): string => {
  if (typeof item === 'string') return item
  if (item.name) return item.name
  if (item.title) return item.title
  if (item.label) return item.label
  return JSON.stringify(item)
}

const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement
  scrollTop.value = target.scrollTop
  emit('scroll', event)

  // 检查是否需要加载更多
  checkLoadMore(target)
}

const handleWheel = (event: WheelEvent) => {
  // 处理边界情况的滚动
  const target = event.target as HTMLElement
  const { scrollTop, scrollHeight, clientHeight } = target

  if (event.deltaY < 0 && scrollTop === 0 && props.hasMoreUp) {
    event.preventDefault()
    loadMoreUp()
  } else if (event.deltaY > 0 && scrollTop + clientHeight >= scrollHeight - 1 && props.hasMoreDown) {
    event.preventDefault()
    loadMoreDown()
  }
}

const checkLoadMore = (element: HTMLElement) => {
  const { scrollTop, scrollHeight, clientHeight } = element

  // 检查上方
  if (scrollTop < props.threshold && props.hasMoreUp && !props.loadingUp) {
    emit('load-more-up')
  }

  // 检查下方
  if (scrollTop + clientHeight > scrollHeight - props.threshold && props.hasMoreDown && !props.loadingDown) {
    emit('load-more-down')
  }
}

const loadMoreUp = () => {
  emit('load-more-up')
}

const loadMoreDown = () => {
  emit('load-more-down')
}

const scrollToIndex = (index: number) => {
  if (index < 0 || index >= props.items.length) return

  let offsetTop = 0
  for (let i = 0; i < index; i++) {
    offsetTop += getItemHeight(props.items[i], i)
  }

  if (containerRef.value) {
    containerRef.value.scrollTop = offsetTop
  }
}

const scrollToItem = (item: VirtualScrollerItem) => {
  const index = getItemIndex(item)
  scrollToIndex(index)
}

const scrollToTop = () => {
  if (containerRef.value) {
    containerRef.value.scrollTop = 0
  }
}

const scrollToBottom = () => {
  if (containerRef.value) {
    containerRef.value.scrollTop = totalHeight.value
  }
}

const getVisibleRange = () => {
  return {
    start: visibleStartIndex.value,
    end: visibleEndIndex.value,
    items: visibleItems.value
  }
}

const updateContainerHeight = () => {
  if (containerRef.value && props.containerHeight === 'auto') {
    containerHeight.value = containerRef.value.clientHeight
  }
}

// 监听器
watch(
  () => props.items,
  () => {
    nextTick(() => {
      updateContainerHeight()
    })
  },
  { deep: true }
)

watch(
  () => props.containerHeight,
  (newHeight) => {
    if (newHeight !== 'auto') {
      containerHeight.value = newHeight
    }
  }
)

// 生命周期
onMounted(() => {
  updateContainerHeight()

  // 监听窗口大小变化
  window.addEventListener('resize', updateContainerHeight)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateContainerHeight)
})

// 暴露方法给父组件
defineExpose({
  scrollToIndex,
  scrollToItem,
  scrollToTop,
  scrollToBottom,
  getVisibleRange,
  updateContainerHeight
})
</script>

<style scoped lang="scss">
.virtual-scroller {
  position: relative;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.virtual-scroller__content {
  position: relative;
  min-height: 100%;
}

.virtual-scroller__item {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.virtual-item-default {
  padding: var(--density-padding-base);
  border-bottom: 1px solid var(--edu-border-light);
  background: var(--edu-bg-primary);
  display: flex;
  align-items: center;
  font-size: var(--density-font-size-base);
  color: var(--edu-text-primary);
}

.virtual-scroller__loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--density-spacing-sm);
  padding: var(--density-padding-lg);
  background: var(--edu-bg-primary);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--density-radius-base);
  box-shadow: var(--edu-shadow-md);
}

.loading-icon {
  font-size: 24px;
  color: var(--edu-primary-500);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.virtual-scroller__empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  text-align: center;
  z-index: 10;
}

.empty-state {
  padding: var(--density-spacing-2xl);
  color: var(--edu-text-tertiary);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: var(--density-spacing-base);
  opacity: 0.5;
}

.virtual-scroller__load-more {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  padding: var(--density-padding-base);
  background: var(--edu-bg-primary);
  border: 1px solid var(--edu-border-light);
  z-index: 5;

  &--top {
    top: 0;
  border-bottom: none;
    border-radius: 0 0 var(--density-radius-base) var(--density-radius-base);
  }

  &--bottom {
    bottom: 0;
    border-top: none;
    border-radius: var(--density-radius-base) var(--density-radius-base) 0 0;
  }
}

// 响应式适配
@media (max-width: 768px) {
  .virtual-item-default {
    padding: var(--density-padding-sm);
    font-size: var(--density-font-size-sm);
  }

  .loading-indicator {
    padding: var(--density-padding-base);
  }

  .virtual-scroller__load-more {
    padding: var(--density-padding-sm);
  }
}

// 深色模式适配
[data-theme="dark"] {
  .virtual-item-default {
    background: var(--bg-elevated);
    border-color: var(--border-color);
  }

  .loading-indicator,
  .virtual-scroller__load-more {
    background: var(--bg-elevated);
    border-color: var(--border-color);
  }
}

// 减少动画
@media (prefers-reduced-motion: reduce) {
  .loading-icon {
    animation: none;
  }
}

// 水平滚动支持
.virtual-scroller--horizontal {
  overflow-x: auto;
  overflow-y: hidden;

  .virtual-scroller__content {
    height: 100%;
    width: auto;
  }

  .virtual-scroller__item {
    position: relative;
    top: auto;
    left: auto;
    right: auto;
    display: inline-block;
    vertical-align: top;
  }
}
</style>