<template>
  <div class="focused-layout" :data-layout="layoutMode" :class="sceneClass">
    <!-- 顶部进度栏 -->
    <header class="layout-header glass-surface">
      <div class="header-left">
        <el-button circle size="small" @click="toggleSidebar">
          <el-icon><Menu /></el-icon>
        </el-button>
        <span class="lesson-title">{{ currentLessonTitle }}</span>
      </div>
      
      <div class="header-center">
        <slot name="header-center">
          <LessonProgressHeader :total="10" :completed="Math.floor(progress / 10)" />
        </slot>
      </div>

      <div class="header-right">
        <el-button circle size="small" @click="toggleAI">
          <el-icon><ChatDotRound /></el-icon>
        </el-button>
        <el-avatar :size="32" :src="userAvatar" />
      </div>
    </header>

    <div class="layout-content">
      <!-- 左侧课程目录 (可折叠) -->
      <nav 
        class="layout-sidebar glass-surface" 
        :class="{ 'is-collapsed': leftCollapsed }"
      >
        <div class="sidebar-content">
          <!-- 目录列表插槽 -->
          <slot name="sidebar">
            <div class="placeholder-text">课程目录</div>
          </slot>
        </div>
      </nav>

      <!-- 主内容区 -->
      <main class="layout-main" ref="mainContent">
        <div class="content-wrapper">
          <slot />
        </div>
      </main>

      <!-- AI 助手 (可折叠) -->
      <aside 
        class="layout-assistant glass-surface"
        :class="{ 'is-collapsed': rightCollapsed }"
      >
        <div class="assistant-content">
          <!-- AI 助手插槽 -->
          <slot name="assistant">
             <AIAssistant />
          </slot>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Menu, ChatDotRound } from '@element-plus/icons-vue'
import LessonProgressHeader from '@/components/course/LessonProgressHeader.vue'
import AIAssistant from '@/components/course/AIAssistant.vue'

interface Props {
  layoutMode?: 'reading' | 'coding' | 'quiz'
  currentLessonTitle?: string
  progress?: number
  userAvatar?: string
}

const props = withDefaults(defineProps<Props>(), {
  layoutMode: 'reading',
  currentLessonTitle: '未命名课程',
  progress: 0,
  userAvatar: ''
})

const leftCollapsed = ref(false)
const rightCollapsed = ref(true)

const toggleSidebar = () => {
  leftCollapsed.value = !leftCollapsed.value
}

const toggleAI = () => {
  rightCollapsed.value = !rightCollapsed.value
}

const sceneClass = computed(() => `scene-${props.layoutMode}`)
</script>

<style scoped lang="scss">
.focused-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--edu-bg-secondary);
  transition: background 0.5s ease;
  
  // 场景背景适配
  &.scene-reading {
    background: var(--edu-bg-secondary);
  }
  &.scene-coding {
    background: #1e1e1e; // 暗色背景适合编程
    color: #fff;
  }
}

.layout-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--edu-spacing-lg);
  z-index: 10;
  border-bottom: 1px solid var(--edu-border-light);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
}

.layout-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

.layout-sidebar {
  width: 280px;
  border-right: 1px solid var(--edu-border-light);
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  transition: transform 0.3s ease, width 0.3s ease;
  z-index: 5;
  
  &.is-collapsed {
    width: 0;
    transform: translateX(-100%);
    overflow: hidden;
    border: none;
  }
}

.layout-main {
  flex: 1;
  overflow-y: auto;
  padding: var(--edu-spacing-lg);
  position: relative;
  transition: all 0.3s ease;
}

.content-wrapper {
  max-width: 1000px;
  margin: 0 auto;
  height: 100%;
}

.layout-assistant {
  width: 320px;
  border-left: 1px solid var(--edu-border-light);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  transition: transform 0.3s ease;
  z-index: 20;
  box-shadow: -4px 0 10px rgba(0,0,0,0.05);

  &.is-collapsed {
    transform: translateX(100%);
  }
}

.placeholder-text {
  padding: var(--edu-spacing-md);
  color: var(--edu-text-secondary);
  text-align: center;
}

// 响应式调整
@media (max-width: 768px) {
  .layout-sidebar {
    position: absolute;
    height: 100%;
    left: 0;
  }
  
  .layout-assistant {
    width: 100%;
  }
}
</style>
