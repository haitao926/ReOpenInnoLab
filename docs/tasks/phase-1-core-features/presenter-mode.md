# Presenter播放模式实现任务

**优先级**: 🔴 **最高优先级**
**阶段**: Phase 1 - 核心业务闭环
**预估工作量**: 4-5周
**影响范围**: apps/web-teacher/src/views/presenter/
**当前状态**: 完全缺失

---

## 📋 任务描述

实现教师端的课堂播放模式，这是课程全景设计的核心功能。教师可以通过全屏界面进行课程播放、环节切换、批注操作、学生状态监控等课堂教学活动。

## 🎯 验收标准

### 核心功能验收
- [ ] 全屏播放界面完整实现
- [ ] 五环节内容正确渲染和切换
- [ ] 播放控制（上一段/下一段/暂停/结束）
- [ ] 实时批注和激光笔工具
- [ ] 学生状态面板显示
- [ ] AI助手实时建议
- [ ] 键盘快捷键支持

### 用户体验验收
- [ ] 界面响应延迟 < 200ms
- [ ] 环节切换动画流畅
- [ ] 批注操作精确无延迟
- [ ] 支持遥控器操作
- [ ] 全屏模式稳定运行

### 兼容性验收
- [ ] Chrome 90+ 完全支持
- [ ] Firefox 88+ 完全支持
- [ ] Safari 14+ 基础支持
- [ ] 触摸设备适配

## 🔧 技术实现要点

### 1. 主播放界面架构
```vue
<!-- apps/web-teacher/src/views/presenter/PresenterMode.vue -->
<template>
  <div class="presenter-mode" :class="{ 'fullscreen': isFullscreen }">
    <!-- 顶部控制栏 -->
    <header class="presenter-header">
      <div class="section-info">
        <h2>{{ currentSection.title }}</h2>
        <span class="section-type">{{ currentSection.type }}</span>
      </div>

      <div class="controls">
        <el-button-group>
          <el-button @click="previousSection" :disabled="isFirstSection">
            <el-icon><ArrowLeft /></el-icon>
            上一段
          </el-button>
          <el-button @click="togglePlay" :type="isPlaying ? 'danger' : 'primary'">
            <el-icon><VideoPlay v-if="!isPlaying" /><VideoPause v-else /></el-icon>
            {{ isPlaying ? '暂停' : '播放' }}
          </el-button>
          <el-button @click="nextSection" :disabled="isLastSection">
            下一段
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </el-button-group>

        <el-button @click="endLesson" type="warning">结束上课</el-button>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="presenter-main">
      <div class="content-area">
        <SectionRenderer
          :section="currentSection"
          :annotations="currentAnnotations"
          @annotation-add="handleAnnotationAdd"
          @annotation-update="handleAnnotationUpdate"
        />
      </div>

      <!-- 侧边栏 -->
      <aside class="presenter-sidebar">
        <!-- 学生状态面板 -->
        <StudentStatusPanel
          :lesson-id="lessonId"
          :current-section="currentSectionIndex"
        />

        <!-- AI助手面板 -->
        <AIPanel
          :section="currentSection"
          :student-states="studentStates"
          @suggestion-apply="applyAISuggestion"
        />

        <!-- 教学提示 -->
        <TeachingTips :section="currentSection" />
      </aside>
    </main>

    <!-- 底部状态栏 -->
    <footer class="presenter-footer">
      <div class="section-nav">
        <el-progress
          :percentage="progressPercentage"
          :stroke-width="4"
        />
        <div class="section-list">
          <button
            v-for="(section, index) in sections"
            :key="index"
            :class="['section-item', {
              'active': index === currentSectionIndex,
              'completed': index < currentSectionIndex
            }]"
            @click="jumpToSection(index)"
          >
            {{ section.type }}
          </button>
        </div>
      </div>

      <div class="footer-controls">
        <el-button @click="toggleAnnotationMode" :type="annotationMode ? 'primary' : 'default'">
          <el-icon><EditPen /></el-icon>
          批注
        </el-button>
        <el-button @click="toggleLaserPointer" :type="laserPointerMode ? 'primary' : 'default'">
          <el-icon><Pointer /></el-icon>
          激光笔
        </el-button>
        <el-button @click="toggleFullscreen">
          <el-icon><FullScreen /></el-icon>
          {{ isFullscreen ? '退出全屏' : '全屏' }}
        </el-button>
      </div>
    </footer>

    <!-- 批注层 -->
    <AnnotationLayer
      v-if="annotationMode"
      :annotations="currentAnnotations"
      @annotation-add="handleAnnotationAdd"
      @annotation-delete="handleAnnotationDelete"
    />

    <!-- 激光笔 -->
    <LaserPointer
      v-if="laserPointerMode"
      @pointer-move="handleLaserMove"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { SectionRenderer } from '@/components/presenter'
import { StudentStatusPanel } from '@/components/presenter'
import { AIPanel } from '@/components/presenter'
import { AnnotationLayer } from '@/components/presenter'
import { LaserPointer } from '@/components/presenter'
import { TeachingTips } from '@/components/presenter'
import { usePresenterStore } from '@/stores/presenter'
import { useClassroomStore } from '@/stores/classroom'
import type { CourseSection, Annotation, StudentState } from '@/types/presenter'

const route = useRoute()
const router = useRouter()
const presenterStore = usePresenterStore()
const classroomStore = useClassroomStore()

// 状态管理
const lessonId = route.params.lessonId as string
const currentSectionIndex = ref(0)
const isPlaying = ref(false)
const isFullscreen = ref(false)
const annotationMode = ref(false)
const laserPointerMode = ref(false)
const currentAnnotations = ref<Annotation[]>([])
const studentStates = ref<StudentState[]>([])

// 计算属性
const sections = computed(() => presenterStore.currentCourse?.sections || [])
const currentSection = computed(() => sections.value[currentSectionIndex.value])
const isFirstSection = computed(() => currentSectionIndex.value === 0)
const isLastSection = computed(() => currentSectionIndex.value === sections.value.length - 1)
const progressPercentage = computed(() =>
  ((currentSectionIndex.value + 1) / sections.value.length) * 100
)

// 方法
const startLesson = async () => {
  try {
    await classroomStore.startLesson(lessonId)
    isPlaying.value = true
    presenterStore.startSection(currentSectionIndex.value)

    // 广播开始事件到学生端
    await classroomStore.broadcastEvent({
      type: 'lesson:start',
      data: { lessonId, sectionIndex: 0 }
    })
  } catch (error) {
    ElMessage.error('开始上课失败：' + error.message)
  }
}

const nextSection = async () => {
  if (isLastSection.value) return

  try {
    // 保存当前环节的批注
    await presenterStore.saveAnnotations(currentSectionIndex.value, currentAnnotations.value)

    // 切换到下一环节
    currentSectionIndex.value++
    presenterStore.startSection(currentSectionIndex.value)

    // 广播切换事件
    await classroomStore.broadcastEvent({
      type: 'lesson:next',
      data: { sectionIndex: currentSectionIndex.value }
    })

    // 加载新环节的批注
    currentAnnotations.value = await presenterStore.loadAnnotations(currentSectionIndex.value)
  } catch (error) {
    ElMessage.error('切换环节失败：' + error.message)
  }
}

const previousSection = async () => {
  if (isFirstSection.value) return

  try {
    await presenterStore.saveAnnotations(currentSectionIndex.value, currentAnnotations.value)
    currentSectionIndex.value--
    presenterStore.startSection(currentSectionIndex.value)

    await classroomStore.broadcastEvent({
      type: 'lesson:previous',
      data: { sectionIndex: currentSectionIndex.value }
    })

    currentAnnotations.value = await presenterStore.loadAnnotations(currentSectionIndex.value)
  } catch (error) {
    ElMessage.error('切换环节失败：' + error.message)
  }
}

const togglePlay = async () => {
  if (isPlaying.value) {
    await pauseLesson()
  } else {
    if (currentSectionIndex.value === 0 && !presenterStore.lessonStarted) {
      await startLesson()
    } else {
      await resumeLesson()
    }
  }
}

const pauseLesson = async () => {
  try {
    await classroomStore.pauseLesson(lessonId)
    isPlaying.value = false

    await classroomStore.broadcastEvent({
      type: 'lesson:pause',
      data: { reason: 'teacher_pause' }
    })
  } catch (error) {
    ElMessage.error('暂停失败：' + error.message)
  }
}

const endLesson = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要结束当前课程吗？结束后学生将无法继续参与课堂。',
      '确认结束',
      { type: 'warning' }
    )

    await classroomStore.endLesson(lessonId)
    isPlaying.value = false

    await classroomStore.broadcastEvent({
      type: 'lesson:end',
      data: { summary: presenterStore.generateLessonSummary() }
    })

    // 跳转到课程报告页面
    router.push(`/lessons/${lessonId}/report`)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('结束课程失败：' + error.message)
    }
  }
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

// 键盘快捷键处理
const handleKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowLeft':
      if (!event.ctrlKey) previousSection()
      break
    case 'ArrowRight':
      if (!event.ctrlKey) nextSection()
      break
    case ' ':
      event.preventDefault()
      togglePlay()
      break
    case 'Escape':
      if (isFullscreen.value) toggleFullscreen()
      break
    case 'F11':
      event.preventDefault()
      toggleFullscreen()
      break
    case 'a':
    case 'A':
      if (event.ctrlKey) {
        event.preventDefault()
        annotationMode.value = !annotationMode.value
      }
      break
    case 'l':
    case 'L':
      if (event.ctrlKey) {
        event.preventDefault()
        laserPointerMode.value = !laserPointerMode.value
      }
      break
  }
}

// 生命周期
onMounted(async () => {
  // 加载课程数据
  await presenterStore.loadLesson(lessonId)

  // 键盘事件监听
  document.addEventListener('keydown', handleKeydown)

  // 检查全屏状态
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })

  // 自动开始播放
  if (route.query.autostart === 'true') {
    await startLesson()
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)

  // 清理资源
  if (isPlaying.value) {
    classroomStore.pauseLesson(lessonId)
  }
})
</script>

<style scoped lang="scss">
.presenter-mode {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #000;
  color: #fff;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;

  &.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9999;
  }
}

.presenter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  .section-info {
    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }

    .section-type {
      display: inline-block;
      padding: 4px 12px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      font-size: 12px;
      text-transform: uppercase;
      margin-left: 12px;
    }
  }
}

.presenter-main {
  flex: 1;
  display: flex;
  overflow: hidden;

  .content-area {
    flex: 1;
    position: relative;
    overflow: hidden;
  }

  .presenter-sidebar {
    width: 320px;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(10px);
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }
}

.presenter-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  .section-nav {
    flex: 1;

    .section-list {
      display: flex;
      gap: 8px;
      margin-top: 8px;

      .section-item {
        padding: 6px 12px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        color: #fff;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        &.active {
          background: var(--el-color-primary);
          border-color: var(--el-color-primary);
        }

        &.completed {
          background: rgba(103, 194, 58, 0.8);
          border-color: #67c23a;
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .presenter-sidebar {
    width: 280px;
  }
}

@media (max-width: 768px) {
  .presenter-header {
    padding: 12px 16px;

    .section-info h2 {
      font-size: 18px;
    }
  }

  .presenter-sidebar {
    position: absolute;
    right: -320px;
    top: 0;
    height: 100%;
    transition: right 0.3s ease;
    z-index: 100;

    &.show {
      right: 0;
    }
  }

  .presenter-footer {
    padding: 12px 16px;
    flex-direction: column;
    gap: 12px;
  }
}
</style>
```

### 2. 环节渲染器
```vue
<!-- apps/web-teacher/src/components/presenter/SectionRenderer.vue -->
<template>
  <div class="section-renderer" :class="sectionTypeClass">
    <!-- 课程引入环节 -->
    <IntroductionRenderer
      v-if="section.type === 'introduction'"
      :section="section"
      :annotations="filteredAnnotations"
      @annotation-add="$emit('annotation-add', $event)"
    />

    <!-- 新知讲解环节 -->
    <KnowledgeRenderer
      v-else-if="section.type === 'knowledge'"
      :section="section"
      :annotations="filteredAnnotations"
      @annotation-add="$emit('annotation-add', $event)"
    />

    <!-- 体验理解环节 -->
    <ExperienceRenderer
      v-else-if="section.type === 'experience'"
      :section="section"
      :annotations="filteredAnnotations"
      @annotation-add="$emit('annotation-add', $event)"
    />

    <!-- 实验活动环节 -->
    <ExperimentRenderer
      v-else-if="section.type === 'experiment'"
      :section="section"
      :annotations="filteredAnnotations"
      @annotation-add="$emit('annotation-add', $event)"
    />

    <!-- 作业测试环节 -->
    <AssignmentRenderer
      v-else-if="section.type === 'assignment'"
      :section="section"
      :annotations="filteredAnnotations"
      @annotation-add="$emit('annotation-add', $event)"
    />

    <!-- 未知环节类型 -->
    <div v-else class="unknown-section">
      <h3>未知环节类型: {{ section.type }}</h3>
      <pre>{{ section }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IntroductionRenderer } from './renderers'
import { KnowledgeRenderer } from './renderers'
import { ExperienceRenderer } from './renderers'
import { ExperimentRenderer } from './renderers'
import { AssignmentRenderer } from './renderers'
import type { CourseSection, Annotation } from '@/types/presenter'

interface Props {
  section: CourseSection
  annotations: Annotation[]
}

const props = defineProps<Props>()
defineEmits<{
  'annotation-add': [annotation: Annotation]
}>()

const sectionTypeClass = computed(() => `section-${props.section.type}`)

const filteredAnnotations = computed(() =>
  props.annotations.filter(ann => ann.sectionIndex === props.section.index)
)
</script>

<style scoped lang="scss">
.section-renderer {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.unknown-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 32px;
  color: #666;

  h3 {
    margin-bottom: 16px;
  }

  pre {
    background: rgba(0, 0, 0, 0.1);
    padding: 16px;
    border-radius: 8px;
    max-width: 600px;
    overflow: auto;
  }
}
</style>
```

### 3. 状态管理Store
```typescript
// apps/web-teacher/src/stores/presenter.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Course, CourseSection, Annotation, LessonSession } from '@/types/presenter'
import { classroomApi, courseApi } from '@/api'

export const usePresenterStore = defineStore('presenter', () => {
  // 状态
  const currentCourse = ref<Course | null>(null)
  const currentSession = ref<LessonSession | null>(null)
  const currentSectionIndex = ref(0)
  const annotations = ref<Record<number, Annotation[]>>({})
  const startTime = ref<Date | null>(null)
  const sectionTimings = ref<Record<number, { start: Date, end?: Date }>>({})

  // 计算属性
  const currentSection = computed(() =>
    currentCourse.value?.sections[currentSectionIndex.value]
  )

  const progressPercentage = computed(() => {
    if (!currentCourse.value) return 0
    return ((currentSectionIndex.value + 1) / currentCourse.value.sections.length) * 100
  })

  const lessonStarted = computed(() => !!startTime.value)

  // 方法
  const loadLesson = async (lessonId: string) => {
    try {
      // 获取课程信息
      const lesson = await classroomApi.getLesson(lessonId)
      currentCourse.value = await courseApi.getCourse(lesson.courseId)
      currentSession.value = lesson

      // 加载已保存的批注
      const savedAnnotations = await classroomApi.getLessonAnnotations(lessonId)
      annotations.value = savedAnnotations.reduce((acc, ann) => {
        if (!acc[ann.sectionIndex]) acc[ann.sectionIndex] = []
        acc[ann.sectionIndex].push(ann)
        return acc
      }, {} as Record<number, Annotation[]>)

    } catch (error) {
      console.error('加载课程失败:', error)
      throw error
    }
  }

  const startSection = async (sectionIndex: number) => {
    currentSectionIndex.value = sectionIndex

    if (!startTime.value) {
      startTime.value = new Date()
    }

    sectionTimings.value[sectionIndex] = {
      start: new Date()
    }

    // 记录环节开始事件
    if (currentSession.value) {
      await classroomApi.recordSectionEvent(currentSession.value.id, {
        type: 'section_start',
        sectionIndex,
        timestamp: new Date()
      })
    }
  }

  const saveAnnotations = async (sectionIndex: number, sectionAnnotations: Annotation[]) => {
    try {
      annotations.value[sectionIndex] = sectionAnnotations

      if (currentSession.value) {
        await classroomApi.saveLessonAnnotations(currentSession.value.id, sectionAnnotations)
      }
    } catch (error) {
      console.error('保存批注失败:', error)
      throw error
    }
  }

  const loadAnnotations = async (sectionIndex: number): Promise<Annotation[]> => {
    return annotations.value[sectionIndex] || []
  }

  const generateLessonSummary = () => {
    if (!currentSession.value || !currentCourse.value) return null

    const duration = startTime.value ?
      Date.now() - startTime.value.getTime() : 0

    return {
      lessonId: currentSession.value.id,
      courseId: currentCourse.value.id,
      duration,
      sections: currentCourse.value.sections.map((section, index) => ({
        index,
        type: section.type,
        title: section.title,
        timing: sectionTimings.value[index]
      })),
      annotationCount: Object.values(annotations.value).flat().length
    }
  }

  return {
    // 状态
    currentCourse,
    currentSession,
    currentSectionIndex,
    annotations,
    startTime,
    sectionTimings,

    // 计算属性
    currentSection,
    progressPercentage,
    lessonStarted,

    // 方法
    loadLesson,
    startSection,
    saveAnnotations,
    loadAnnotations,
    generateLessonSummary
  }
})
```

## 📁 新增文件结构

```
apps/web-teacher/src/
├── views/
│   └── presenter/
│       ├── PresenterMode.vue           # 主播放界面 ⭐
│       └── index.ts                    # 导出文件
├── components/
│   └── presenter/
│       ├── SectionRenderer.vue         # 环节渲染器 ⭐
│       ├── StudentStatusPanel.vue      # 学生状态面板 ⭐
│       ├── AIPanel.vue                 # AI助手面板 ⭐
│       ├── AnnotationLayer.vue         # 批注层 ⭐
│       ├── LaserPointer.vue            # 激光笔工具 ⭐
│       ├── TeachingTips.vue            # 教学提示 ⭐
│       ├── renderers/                  # 各环节渲染器
│       │   ├── IntroductionRenderer.vue
│       │   ├── KnowledgeRenderer.vue
│       │   ├── ExperienceRenderer.vue
│       │   ├── ExperimentRenderer.vue
│       │   └── AssignmentRenderer.vue
│       └── index.ts
├── stores/
│   └── presenter.ts                    # Presenter状态管理 ⭐
├── types/
│   └── presenter.ts                    # Presenter类型定义 ⭐
└── api/
    └── classroom.ts                    # 课堂相关API ⭐
```

## 🔗 依赖关系

**前置依赖**:
- [x] Vue 3 + TypeScript 环境就绪
- [x] Element Plus UI库集成
- [x] Pinia状态管理配置
- [x] 基础路由系统

**后端依赖**:
- [ ] classroom-service WebSocket接口
- [ ] 课程数据API接口
- [ ] 批注数据存储接口
- [ ] AI服务集成接口

**横向依赖**:
- [ ] 学生端实时同步功能
- [ ] 资源渲染系统
- [ ] 五环节内容结构

## 🧪 测试要求

### 单元测试
- [ ] PresenterMode组件渲染测试
- [ ] 环节切换逻辑测试
- [ ] 批注功能测试
- [ ] 键盘快捷键测试

### 集成测试
- [ ] WebSocket连接测试
- [ ] 状态同步测试
- [ ] 资源加载测试

### E2E测试
- [ ] 完整课堂流程测试
- [ ] 多设备兼容性测试
- [ ] 性能压力测试

## 📝 开发步骤

### Week 1: 基础框架搭建
1. 创建PresenterMode主界面组件
2. 实现基础的全屏布局
3. 添加播放控制功能
4. 实现键盘快捷键支持

### Week 2: 环节渲染系统
1. 开发SectionRenderer组件
2. 实现各环节渲染器
3. 添加环节切换动画
4. 集成资源加载机制

### Week 3: 交互功能实现
1. 开发批注系统
2. 实现激光笔工具
3. 添加学生状态面板
4. 集成AI助手功能

### Week 4: 实时通信集成
1. WebSocket集成和状态同步
2. 与后端API对接
3. 错误处理和容错机制
4. 性能优化

### Week 5: 测试和优化
1. 单元测试和集成测试
2. E2E测试和兼容性测试
3. 性能优化和内存管理
4. 文档编写

## 🚨 风险与注意事项

1. **性能风险**: 全屏模式可能消耗大量内存，需要注意资源管理
2. **兼容性风险**: 不同浏览器的全屏API实现可能不一致
3. **实时性风险**: WebSocket连接的稳定性影响用户体验
4. **状态管理风险**: 复杂的课堂状态需要仔细设计数据流

## 📚 参考资料

- [Fullscreen API文档](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API)
- [WebSocket最佳实践](https://web.dev/websocket/)
- [Vue 3组件设计模式](https://vuejs.org/guide/components/registration.html)
- [Pinia状态管理](https://pinia.vuejs.org/)

---

**任务创建**: 2025-11-08
**预计完成**: 2025-12-06
**当前状态**: 🔄 未开始
**负责人**: 前端开发团队