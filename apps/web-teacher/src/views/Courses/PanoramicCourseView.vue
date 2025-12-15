<template>
  <TeacherWorkspaceLayout
    :title="pageTitle"
    subtitle="全景式课程编辑器：五环节教学流"
    :leftCollapsible="true"
    :rightCollapsible="true"
    v-model:leftCollapsed="leftCollapsed"
    v-model:rightCollapsed="rightCollapsed"
  >
    <!-- Header Controls -->
    <template #header-controls>
       <div class="flex gap-2">
          <EduButton variant="secondary" @click="saveDraft" :loading="saving">保存草稿</EduButton>
          <EduButton variant="primary" @click="publish" :loading="saving">发布课程</EduButton>
       </div>
    </template>

    <!-- Main Content: Panoramic Lane Container -->
    <div class="panoramic-container">
       <div class="panoramic-lanes">
          <!-- Lane 1: Introduction -->
          <div class="stage-column intro-stage">
             <div class="stage-header">
                <h3>课程引入</h3>
                <span class="duration-badge">{{ editor?.fiveModules.introduction.duration }} min</span>
             </div>
             <div class="stage-content">
                <GlassSurface 
                   v-for="res in editor?.fiveModules.introduction.resources" 
                   :key="res.id"
                   variant="card"
                   class="resource-card"
                >
                   {{ res.title }}
                </GlassSurface>
                <div class="add-placeholder" @click="openResourceDrawer('introduction')">
                   <el-icon><Plus /></el-icon> 添加资源
                </div>
             </div>
          </div>

          <!-- Lane 2: Knowledge -->
          <div class="stage-column knowledge-stage">
             <div class="stage-header">
                <h3>新知讲解</h3>
                <span class="duration-badge">{{ editor?.fiveModules.knowledge.duration }} min</span>
             </div>
             <div class="stage-content">
                 <GlassSurface 
                   v-for="res in editor?.fiveModules.knowledge.resources" 
                   :key="res.id"
                   variant="card"
                   class="resource-card"
                >
                   {{ res.title }}
                </GlassSurface>
                <div class="add-placeholder" @click="openResourceDrawer('knowledge')">
                   <el-icon><Plus /></el-icon> 添加资源
                </div>
             </div>
          </div>

          <!-- Lane 3: Experience -->
          <div class="stage-column experience-stage">
             <div class="stage-header">
                <h3>体验理解</h3>
                 <span class="duration-badge">{{ editor?.fiveModules.experience.duration }} min</span>
             </div>
             <div class="stage-content">
                 <GlassSurface 
                   v-for="res in editor?.fiveModules.experience.resources" 
                   :key="res.id"
                   variant="card"
                   class="resource-card"
                >
                   {{ res.title }}
                </GlassSurface>
                 <div class="add-placeholder" @click="openResourceDrawer('experience')">
                   <el-icon><Plus /></el-icon> 添加资源
                </div>
             </div>
          </div>

          <!-- Lane 4: Experiment -->
          <div class="stage-column experiment-stage">
             <div class="stage-header">
                <h3>实验活动</h3>
                 <span class="duration-badge">{{ editor?.fiveModules.experiment.duration }} min</span>
             </div>
             <div class="stage-content">
                 <GlassSurface 
                   v-for="res in editor?.fiveModules.experiment.resources" 
                   :key="res.id"
                   variant="card"
                   class="resource-card"
                >
                   {{ res.title }}
                </GlassSurface>
                 <div class="add-placeholder" @click="openResourceDrawer('experiment')">
                   <el-icon><Plus /></el-icon> 添加资源
                </div>
             </div>
          </div>

          <!-- Lane 5: Assignment -->
          <div class="stage-column assignment-stage">
             <div class="stage-header">
                <h3>作业测试</h3>
                 <span class="duration-badge">{{ editor?.fiveModules.assignment.duration }} min</span>
             </div>
             <div class="stage-content">
                 <GlassSurface 
                   v-for="res in editor?.fiveModules.assignment.resources" 
                   :key="res.id"
                   variant="card"
                   class="resource-card"
                >
                   {{ res.title }}
                </GlassSurface>
                 <div class="add-placeholder" @click="openResourceDrawer('assignment')">
                   <el-icon><Plus /></el-icon> 添加资源
                </div>
             </div>
          </div>
       </div>
    </div>

    <!-- Right Sidebar for Resource Drawer equivalent -->
    <template #right>
       <div class="resource-drawer">
          <h3>资源库</h3>
          <p class="text-secondary text-sm mb-4">拖拽或点击添加到当前环节: {{ currentActiveStage }}</p>
          
          <div class="resource-list">
             <div class="resource-item" @click="addMockResource('Video')">
                <el-icon><VideoPlay /></el-icon> 示例视频资源
             </div>
              <div class="resource-item" @click="addMockResource('Slide')">
                <el-icon><Monitor /></el-icon> 示例课件资源
             </div>
              <div class="resource-item" @click="addMockResource('Quiz')">
                <el-icon><EditPen /></el-icon> 示例测验题
             </div>
          </div>
       </div>
    </template>

  </TeacherWorkspaceLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useCourseStore } from '@/stores/course'
import { storeToRefs } from 'pinia'
import TeacherWorkspaceLayout from '@/components/layout/TeacherWorkspaceLayout.vue'
import { EduButton, GlassSurface } from '@reopeninnolab/ui-kit'
import { Plus, VideoPlay, Monitor, EditPen } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const courseStore = useCourseStore()
const { editor } = storeToRefs(courseStore)

const leftCollapsed = ref(true)
const rightCollapsed = ref(false)
const saving = ref(false)
const currentActiveStage = ref('introduction')

const pageTitle = computed(() => editor.value?.basicInfo.title || '未命名课程')

onMounted(async () => {
    const courseId = route.params.id as string
    if (courseId) {
        // Mock init for now or fetch real
        await courseStore.fetchCourseById(courseId)
        courseStore.initializeEditor(courseStore.currentCourse!)
    } else {
        courseStore.initializeEditor()
    }
})

const openResourceDrawer = (stage: string) => {
   currentActiveStage.value = stage
   rightCollapsed.value = false
}

const addMockResource = (type: string) => {
    const resource = {
        id: `res-${Date.now()}`,
        type: type,
        title: `新添加的 ${type} 资源`
    }
    courseStore.addResourceToModule(currentActiveStage.value as any, resource)
    ElMessage.success(`已添加 ${type} 到 ${currentActiveStage.value}`)
}

const saveDraft = async () => {
    saving.value = true
    await courseStore.saveVersion()
    saving.value = false
}

const publish = async () => {
    saving.value = true
    await courseStore.publishCourse()
    saving.value = false
}
</script>

<style scoped lang="scss">
.panoramic-container {
    height: 100%;
    overflow-x: auto;
    padding: 20px 0;
}

.panoramic-lanes {
    display: flex;
    gap: 20px;
    height: 100%;
    min-width: 1200px; /* Ensure horizontal scroll on small screens */
    padding: 0 20px;
}

.stage-column {
    flex: 1;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    border-top: 4px solid transparent;
    
    &.intro-stage { border-top-color: var(--edu-primary); background: linear-gradient(to bottom, rgba(91, 143, 249, 0.05), transparent); }
    &.knowledge-stage { border-top-color: var(--edu-warning); background: linear-gradient(to bottom, rgba(250, 173, 20, 0.05), transparent); }
    &.experience-stage { border-top-color: var(--edu-success); background: linear-gradient(to bottom, rgba(82, 196, 26, 0.05), transparent); }
    &.experiment-stage { border-top-color: #eb2f96; background: linear-gradient(to bottom, rgba(235, 47, 150, 0.05), transparent); }
    &.assignment-stage { border-top-color: #722ed1; background: linear-gradient(to bottom, rgba(114, 46, 209, 0.05), transparent); }
}

.stage-header {
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h3 { margin: 0; font-size: 16px; font-weight: 600; }
    .duration-badge { font-size: 12px; opacity: 0.7; background: rgba(0,0,0,0.05); padding: 2px 6px; border-radius: 4px; }
}

.stage-content {
    flex: 1;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
}

.resource-card {
    padding: 12px;
    cursor: grab;
    &:active { cursor: grabbing; }
}

.add-placeholder {
    border: 2px dashed rgba(0,0,0,0.1);
    border-radius: 8px;
    padding: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: var(--edu-text-secondary);
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
        border-color: var(--edu-primary);
        color: var(--edu-primary);
        background: rgba(91, 143, 249, 0.05);
    }
}

.resource-drawer {
    padding: 20px;
    height: 100%;
}

.resource-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.resource-item {
    padding: 12px;
    background: white;
    border: 1px solid var(--edu-border-base);
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
        border-color: var(--edu-primary);
        transform: translateX(4px);
    }
}
</style>
