<template>
  <TeacherWorkspaceLayout
    title="实验管理"
    subtitle="管理实验资源"
    :leftCollapsible="false"
    :rightCollapsible="false"
  >
    <!-- 左侧筛选区 (Transparent Tree) -->
    <template #left>
      <div class="filter-sidebar">
        <!-- 实验类型 -->
        <div class="filter-section">
          <div class="filter-title">实验类型</div>
          <div class="filter-menu">
            <div 
              class="filter-item" 
              :class="{ active: selectedType === '' }"
              @click="selectedType = ''"
            >
              <el-icon><Menu /></el-icon>
              <span>全部类型</span>
            </div>
            <div 
              class="filter-item" 
              :class="{ active: selectedType === 'playground' }"
              @click="selectedType = 'playground'"
            >
              <el-icon><Monitor /></el-icon>
              <span>编程练习</span>
            </div>
            <div 
              class="filter-item" 
              :class="{ active: selectedType === 'data-lab' }"
              @click="selectedType = 'data-lab'"
            >
              <el-icon><DataAnalysis /></el-icon>
              <span>数据实验</span>
            </div>
            <div 
              class="filter-item" 
              :class="{ active: selectedType === 'robotics' }"
              @click="selectedType = 'robotics'"
            >
              <el-icon><Cpu /></el-icon>
              <span>机器人</span>
            </div>
            <div 
              class="filter-item" 
              :class="{ active: selectedType === 'model-training' }"
              @click="selectedType = 'model-training'"
            >
              <el-icon><Connection /></el-icon>
              <span>模型训练</span>
            </div>
          </div>
        </div>

        <!-- 时长筛选 -->
        <div class="filter-section mt-6">
          <div class="filter-title">实验时长</div>
          <div class="filter-tree">
            <div class="filter-tree-item" :class="{ active: selectedDuration === '' }" @click="selectedDuration = ''">
              <span class="tree-dot" style="background: #94a3b8"></span>
              <span class="tree-text">全部时长</span>
            </div>
            <div class="filter-tree-item" :class="{ active: selectedDuration === 'short' }" @click="selectedDuration = 'short'">
              <span class="tree-dot" style="background: #22c55e"></span>
              <span class="tree-text">30分钟内</span>
            </div>
            <div class="filter-tree-item" :class="{ active: selectedDuration === 'medium' }" @click="selectedDuration = 'medium'">
              <span class="tree-dot" style="background: #eab308"></span>
              <span class="tree-text">30-60分钟</span>
            </div>
            <div class="filter-tree-item" :class="{ active: selectedDuration === 'long' }" @click="selectedDuration = 'long'">
              <span class="tree-dot" style="background: #ef4444"></span>
              <span class="tree-text">60分钟以上</span>
            </div>
          </div>
        </div>

        <!-- 年级筛选 -->
        <div class="filter-section mt-6">
           <div class="filter-title">适用年级</div>
           <div class="grade-tags">
              <div 
                class="mini-tag" 
                :class="{ active: selectedGrade === '' }"
                @click="selectedGrade = ''"
              >全部</div>
              <div 
                v-for="g in grades" 
                :key="g.value"
                class="mini-tag"
                :class="{ active: selectedGrade === g.value }"
                @click="selectedGrade = g.value"
              >
                {{ g.label }}
              </div>
           </div>
        </div>
      </div>
    </template>

    <!-- 右侧内容区 (Canvas) -->
    <div class="lab-canvas">
      
      <!-- 悬浮搜索栏 -->
      <div class="canvas-header">
         <div class="search-bar-floating">
            <el-icon class="search-icon"><Search /></el-icon>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="搜索实验名称、关键词..." 
              class="search-input-clean"
            />
            <button class="search-btn" v-if="searchQuery" @click="searchQuery=''">
               <el-icon><Close /></el-icon>
            </button>
         </div>
         
         <!-- 快捷操作 -->
         <div class="quick-actions-row">
            <button class="action-card" @click="createNewLab">
               <div class="icon-box blue"><el-icon><Plus /></el-icon></div>
               <span>创建实验</span>
            </button>
            <button class="action-card" @click="importLab">
               <div class="icon-box purple"><el-icon><Upload /></el-icon></div>
               <span>导入模板</span>
            </button>
            <button class="action-card">
               <div class="icon-box orange"><el-icon><MagicStick /></el-icon></div>
               <span>AI 生成实验</span>
            </button>
         </div>
      </div>

      <!-- 工具栏 -->
      <div class="canvas-toolbar">
         <div class="left-stat">
            共 {{ filteredLabs.length }} 个实验资源
         </div>
         <div class="right-tools">
            <div class="view-toggles">
               <button :class="{ active: viewMode === 'grid' }" @click="viewMode = 'grid'"><el-icon><Grid /></el-icon></button>
               <button :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'"><el-icon><List /></el-icon></button>
            </div>
         </div>
      </div>

      <!-- 列表内容 -->
      <div class="canvas-content">
         <div v-if="filteredLabs.length === 0" class="empty-placeholder">
            <el-empty description="暂无实验数据" />
            <el-button type="primary" @click="createNewLab">立即创建</el-button>
         </div>

         <!-- Grid View -->
         <div v-else-if="viewMode === 'grid'" class="grid-layout">
            <div 
              v-for="lab in filteredLabs" 
              :key="lab.id" 
              class="clean-card"
              @click="viewLabDetail(lab)"
            >
               <div class="card-thumb" :style="{ backgroundImage: `url(${lab.cover || defaultCover})` }">
                  <div class="thumb-badges">
                     <span class="badge-tag" :class="lab.type">{{ getTypeLabel(lab.type) }}</span>
                     <span v-if="lab.aiEnabled" class="badge-ai"><el-icon><MagicStick /></el-icon> AI</span>
                  </div>
                  <div class="thumb-overlay">
                     <el-button circle size="small" :icon="Edit" @click.stop="editLab(lab)" />
                     <el-button circle size="small" type="success" :icon="VideoPlay" @click.stop="runLab(lab)" />
                  </div>
               </div>
               <div class="card-body">
                  <h3 class="lab-title" :title="lab.title">{{ lab.title }}</h3>
                  <div class="lab-meta">
                     <span><el-icon><Timer /></el-icon> {{ getDurationName(lab.duration) }}</span>
                     <span><el-icon><User /></el-icon> {{ lab.usage }}</span>
                  </div>
               </div>
            </div>
         </div>

         <!-- List View -->
         <div v-else class="list-layout">
            <div 
               v-for="lab in filteredLabs" 
               :key="lab.id" 
               class="clean-list-item"
               @click="viewLabDetail(lab)"
            >
               <div class="list-cover" :style="{ backgroundImage: `url(${lab.cover || defaultCover})` }"></div>
               <div class="list-main">
                  <div class="list-title">{{ lab.title }}</div>
                  <div class="list-desc">{{ lab.description }}</div>
               </div>
               <div class="list-tags">
                  <el-tag size="small" effect="plain">{{ getTypeLabel(lab.type) }}</el-tag>
                  <el-tag v-if="lab.aiEnabled" size="small" type="success" effect="light">AI 辅助</el-tag>
               </div>
               <div class="list-meta">
                  <el-icon><Timer /></el-icon> {{ getDurationName(lab.duration) }}
               </div>
               <div class="list-action">
                  <el-button text circle :icon="MoreFilled" @click.stop />
               </div>
            </div>
         </div>
      </div>

    </div>
  </TeacherWorkspaceLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus, Upload, Search, Grid, List, MoreFilled, Monitor,
  MagicStick, Timer, User, VideoPlay, Edit, Close,
  Menu, DataAnalysis, Cpu, Connection
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

import TeacherWorkspaceLayout from '@/components/layout/TeacherWorkspaceLayout.vue'
import { useAppStore } from '@/stores/app'
import { storeToRefs } from 'pinia'

// Types
interface Lab {
  id: string
  title: string
  description: string
  subject: string
  grade: number
  duration: 'short' | 'medium' | 'long'
  type: 'playground' | 'data-lab' | 'robotics' | 'model-training'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  usage: number
  published: boolean
  aiEnabled?: boolean
  cover?: string
}

const router = useRouter()
const appStore = useAppStore()
const { selectedSubject: storeSubject } = storeToRefs(appStore)

// State
const viewMode = ref<'grid' | 'list'>('grid')
const searchQuery = ref('')
const selectedGrade = ref('')
const selectedDuration = ref('')
const selectedType = ref('')

// Constants / Mocks
const defaultCover = 'https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'

const grades = [
  { label: '初一', value: '7' },
  { label: '初二', value: '8' },
  { label: '初三', value: '9' },
  { label: '高一', value: '10' },
  { label: '高二', value: '11' },
  { label: '高三', value: '12' }
]

const labs = ref<Lab[]>([
  {
    id: 'lab-ai-prompts',
    title: '智能提示词调优实验',
    description: '通过多轮提示词对比与评分，优化生成式 AI 在课堂中的输出质量。',
    subject: 'ai',
    grade: 10,
    duration: 'medium',
    type: 'playground',
    difficulty: 'intermediate',
    tags: ['Prompt Engineering', 'AI 助手'],
    usage: 118,
    published: true,
    aiEnabled: true,
    cover: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'lab-ai-vision',
    title: 'AI 视觉巡线实训',
    description: '利用视觉识别模型，让机器人完成自主巡线并记录调试数据。',
    subject: 'ai',
    grade: 10,
    duration: 'long',
    type: 'robotics',
    difficulty: 'advanced',
    tags: ['OpenCV', '硬件调试'],
    usage: 134,
    published: true,
    aiEnabled: true,
    cover: 'https://images.unsplash.com/photo-1535378437327-10eff3b3ee38?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'lab-ai-cloud',
    title: 'AI 应用云端部署演练',
    description: '在沙箱环境中练习部署 AI 服务，并配置推理接口监控。',
    subject: 'ai',
    grade: 12,
    duration: 'medium',
    type: 'model-training',
    difficulty: 'intermediate',
    tags: ['DevOps', 'Serverless'],
    usage: 74,
    published: true,
    aiEnabled: false,
    cover: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80'
  }
])

// Computed
const filteredLabs = computed(() => {
  return labs.value.filter(lab => {
    const matchesSearch = !searchQuery.value || lab.title.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesGrade = !selectedGrade.value || lab.grade.toString() === selectedGrade.value
    const matchesDuration = !selectedDuration.value || lab.duration === selectedDuration.value
    const matchesType = !selectedType.value || lab.type === selectedType.value
    return matchesSearch && matchesGrade && matchesDuration && matchesType
  })
})

// Methods
const createNewLab = () => router.push('/labs/create')
const importLab = () => router.push('/labs/import')
const editLab = (lab: Lab) => router.push(`/labs/${lab.id}/edit`)
const viewLabDetail = (lab: Lab) => router.push(`/labs/${lab.id}`)
const runLab = (lab: Lab) => window.open(`/lab/run/${lab.id}`, '_blank')

// Helpers
const getTypeLabel = (type: string) => {
    const map: any = { playground: '编程', 'data-lab': '数据', robotics: '机器人', 'model-training': '模型' }
    return map[type] || type
}

const getDurationName = (d: string) => {
    const map: any = { short: '< 30min', medium: '30-60min', long: '> 60min' }
    return map[d] || d
}

</script>

<style scoped lang="scss">
/* Reuse styles from CourseManagementCrud - InnoFlow Design */

/* --- Left Sidebar (Filter) --- */
.filter-sidebar {
  padding: 8px 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-title {
  font-size: 12px;
  font-weight: 700;
  color: #94A3B8;
  padding-left: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-menu, .filter-tree {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  color: #475569;
  font-size: 14px;
  transition: all 0.2s;

  &:hover { background: #F1F5F9; color: #0F172A; }
  &.active { background: #E0E7FF; color: #4F46E5; font-weight: 500; }
}

.filter-tree-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 6px;
  font-size: 14px;
  color: #64748B;
  transition: all 0.2s;

  &:hover { background: #F8FAFC; color: #0F172A; }
  &.active { background: #F1F5F9; color: #0F172A; font-weight: 600; }
}

.tree-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tree-text {
  flex: 1;
}

.grade-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 12px;
}

.mini-tag {
  padding: 4px 10px;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  font-size: 12px;
  color: #64748B;
  cursor: pointer;
  transition: all 0.2s;

  &:hover { border-color: #94A3B8; }
  &.active { background: #4F46E5; border-color: #4F46E5; color: white; }
}

/* --- Right Canvas --- */
.lab-canvas {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.canvas-header {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #F1F5F9;
}

.search-bar-floating {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.04);
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: box-shadow 0.2s;

  &:focus-within {
    box-shadow: 0 8px 30px rgba(99, 102, 241, 0.1);
  }
}

.search-input-clean {
  border: none;
  outline: none;
  font-size: 16px;
  flex: 1;
  color: #0F172A;

  &::placeholder { color: #94A3B8; }
}

.search-icon { font-size: 20px; color: #94A3B8; }
.search-btn { background: none; border: none; cursor: pointer; color: #94A3B8; padding: 4px; &:hover { color: #64748B; } }

.quick-actions-row {
  display: flex;
  gap: 16px;
}

.action-card {
  flex: 1;
  background: white;
  border: 1px solid #F1F5F9;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    border-color: #E2E8F0;
  }
}

.icon-box {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  
  &.blue { background: #E0E7FF; color: #4F46E5; }
  &.purple { background: #F3E8FF; color: #9333EA; }
  &.orange { background: #FFEDD5; color: #F97316; }
}

.canvas-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.left-stat { font-size: 14px; color: #64748B; }

.view-toggles {
  background: #F1F5F9;
  padding: 2px;
  border-radius: 6px;
  display: flex;
  
  button {
    background: none;
    border: none;
    padding: 6px;
    border-radius: 4px;
    color: #94A3B8;
    cursor: pointer;
    
    &.active {
      background: white;
      color: #0F172A;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
  }
}

/* Grid */
.grid-layout {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
}

.clean-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid transparent;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 30px rgba(0,0,0,0.06);
    
    .thumb-overlay { opacity: 1; }
  }
}

.card-thumb {
  height: 160px;
  position: relative;
  background-size: cover;
  background-position: center;
}

.thumb-badges {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  gap: 4px;
}

.badge-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  background: rgba(0,0,0,0.6);
  color: white;
  backdrop-filter: blur(4px);
  
  &.playground { background: rgba(34, 197, 94, 0.9); }
  &.robotics { background: rgba(239, 68, 68, 0.9); }
  &.model-training { background: rgba(59, 130, 246, 0.9); }
}

.badge-ai {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  background: linear-gradient(135deg, #8B5CF6, #6366F1);
  color: white;
  display: flex;
  align-items: center;
  gap: 2px;
}

.thumb-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  opacity: 0;
  transition: opacity 0.2s;
  backdrop-filter: blur(2px);
}

.card-body { padding: 12px; }

.lab-title {
  font-size: 15px;
  font-weight: 600;
  color: #0F172A;
  margin: 0 0 8px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lab-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #64748B;
  
  span { display: flex; align-items: center; gap: 4px; }
}

/* List */
.list-layout {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.clean-list-item {
  display: flex;
  align-items: center;
  gap: 16px;
  background: white;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #F8FAFC;
    border-color: #E2E8F0;
  }
}

.list-cover {
  width: 60px;
  height: 40px;
  border-radius: 6px;
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
}

.list-main { flex: 1; }
.list-title { font-size: 14px; font-weight: 600; color: #0F172A; }
.list-desc { font-size: 12px; color: #64748B; }

.list-tags { display: flex; gap: 4px; }
.list-meta { font-size: 12px; color: #64748B; display: flex; align-items: center; gap: 4px; }

.empty-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 0;
  gap: 16px;
}
</style>