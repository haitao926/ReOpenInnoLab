<template>
  <TeacherWorkspaceLayout
    title="交互体验管理"
    subtitle="沉浸式互动内容库"
    :leftCollapsible="false"
    :rightCollapsible="false"
  >
    <!-- 左侧筛选区 -->
    <template #left>
      <div class="filter-sidebar">
        <!-- 资源类型 -->
        <div class="filter-section">
          <div class="filter-title">资源类型</div>
          <div class="filter-menu">
            <div class="filter-item" :class="{ active: filterType === '' }" @click="filterType = ''">
              <el-icon><Menu /></el-icon>
              <span>全部内容</span>
            </div>
            <div class="filter-item" :class="{ active: filterType === 'html' }" @click="filterType = 'html'">
              <el-icon><Document /></el-icon>
              <span>HTML 单页</span>
            </div>
            <div class="filter-item" :class="{ active: filterType === 'simulation' }" @click="filterType = 'simulation'">
              <el-icon><Monitor /></el-icon>
              <span>物理/化学模拟</span>
            </div>
            <div class="filter-item" :class="{ active: filterType === 'game' }" @click="filterType = 'game'">
              <el-icon><VideoPlay /></el-icon>
              <span>教育游戏</span>
            </div>
          </div>
        </div>

        <!-- 学科筛选 -->
        <div class="filter-section mt-6">
          <div class="filter-title">学科分类</div>
          <div class="filter-tree">
             <div 
               v-for="sub in subjects" 
               :key="sub.value"
               class="filter-tree-item"
               :class="{ active: filterSubject === sub.value }"
               @click="filterSubject = filterSubject === sub.value ? '' : sub.value"
             >
                <span class="tree-dot" :style="{ background: getSubjectColor(sub.value) }"></span>
                <span class="tree-text">{{ sub.label }}</span>
             </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 右侧画布 -->
    <div class="experience-canvas">
      
      <!-- 头部 -->
      <div class="canvas-header">
         <div class="search-bar-floating">
            <el-icon class="search-icon"><Search /></el-icon>
            <input 
              v-model="searchKeyword" 
              type="text" 
              placeholder="搜索互动资源..." 
              class="search-input-clean"
            />
            <button class="search-btn" v-if="searchKeyword" @click="searchKeyword=''">
               <el-icon><Close /></el-icon>
            </button>
         </div>
         
         <div class="quick-actions-row">
            <button class="action-card" @click="showUploadModal = true">
               <div class="icon-box blue"><el-icon><Upload /></el-icon></div>
               <span>上传 H5 内容</span>
            </button>
            <button class="action-card" @click="batchImport">
               <div class="icon-box purple"><el-icon><Connection /></el-icon></div>
               <span>连接外部资源</span>
            </button>
         </div>
      </div>

      <!-- 工具栏 -->
      <div class="canvas-toolbar">
         <div class="left-stat">共 {{ filteredContentList.length }} 个互动资源</div>
         <div class="right-tools">
            <div class="view-toggles">
               <button :class="{ active: viewMode === 'card' }" @click="viewMode = 'card'"><el-icon><Grid /></el-icon></button>
               <button :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'"><el-icon><List /></el-icon></button>
            </div>
         </div>
      </div>

      <!-- 内容区 -->
      <div class="canvas-content">
         <!-- Empty State -->
         <div v-if="filteredContentList.length === 0" class="empty-placeholder">
            <el-empty description="暂无相关资源" />
            <el-button type="primary" @click="showUploadModal = true">上传资源</el-button>
         </div>

         <!-- Card Grid -->
         <div v-if="viewMode === 'card'" class="grid-layout">
            <div 
              v-for="content in filteredContentList" 
              :key="content.id" 
              class="clean-card"
              @click="previewContent(content)"
            >
               <div class="card-thumb" :class="content.type">
                  <div class="thumb-icon">
                     <el-icon><component :is="getContentIcon(content.type)" /></el-icon>
                  </div>
                  <div class="thumb-overlay">
                     <el-button circle icon="View" @click.stop="previewContent(content)" />
                     <el-button circle icon="Edit" @click.stop="editContent(content)" />
                  </div>
               </div>
               <div class="card-body">
                  <div class="exp-title">{{ content.title }}</div>
                  <div class="exp-meta">
                     <el-tag size="small" :type="getTypeVariant(content.type)">{{ getTypeLabel(content.type) }}</el-tag>
                     <span class="exp-author">{{ content.author }}</span>
                  </div>
               </div>
            </div>
         </div>

         <!-- List View -->
         <div v-else class="list-layout">
            <div 
               v-for="content in filteredContentList" 
               :key="content.id" 
               class="clean-list-item"
               @click="previewContent(content)"
            >
               <div class="list-icon-box" :class="content.type">
                  <el-icon><component :is="getContentIcon(content.type)" /></el-icon>
               </div>
               <div class="list-main">
                  <div class="list-title">{{ content.title }}</div>
                  <div class="list-desc">{{ content.description }}</div>
               </div>
               <div class="list-meta">
                  <el-tag size="small" :type="getTypeVariant(content.type)">{{ getTypeLabel(content.type) }}</el-tag>
                  <span class="ml-4 text-xs text-gray-400">{{ formatDate(content.createdAt) }}</span>
               </div>
               <div class="list-action">
                  <el-button circle size="small" icon="Edit" @click.stop="editContent(content)" />
               </div>
            </div>
         </div>
      </div>

    </div>

    <!-- Upload Dialog -->
    <el-dialog v-model="showUploadModal" title="上传互动内容" width="500px">
       <div class="upload-area">
          <el-icon class="upload-icon"><Upload /></el-icon>
          <div class="upload-text">拖拽文件到此处或点击上传</div>
          <div class="upload-hint">支持 .html, .zip, .mp4 格式</div>
       </div>
       <template #footer>
          <el-button @click="showUploadModal = false">取消</el-button>
          <el-button type="primary">开始上传</el-button>
       </template>
    </el-dialog>

  </TeacherWorkspaceLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search, Grid, List, Plus, Upload, Connection,
  Menu, Document, Monitor, VideoPlay, Close
} from '@element-plus/icons-vue'
import TeacherWorkspaceLayout from '@/components/layout/TeacherWorkspaceLayout.vue'
import { formatDate } from '@/utils/date'
import { subjects } from '@/config/courseData'

// State
const searchKeyword = ref('')
const viewMode = ref<'card' | 'list'>('card')
const filterType = ref('')
const filterSubject = ref('')
const showUploadModal = ref(false)

// Mock Data
const contentList = ref([
    {
        id: '1', title: 'AI 神经网络可视化', description: '交互式神经网络层级演示', type: 'simulation',
        subject: 'ai', author: '王老师', createdAt: new Date()
    },
    {
        id: '2', title: 'Python 排序算法演示', description: '冒泡排序与快速排序对比', type: 'html',
        subject: 'cs', author: '李老师', createdAt: new Date()
    },
    {
        id: '3', title: '太阳系引力模拟', description: '基于 WebGL 的引力场模拟', type: 'game',
        subject: 'physics', author: '张老师', createdAt: new Date()
    }
])

const filteredContentList = computed(() => {
    return contentList.value.filter(item => {
        const matchesSearch = !searchKeyword.value || item.title.includes(searchKeyword.value)
        const matchesType = !filterType.value || item.type === filterType.value
        const matchesSubject = !filterSubject.value || item.subject === filterSubject.value
        return matchesSearch && matchesType && matchesSubject
    })
})

// Methods
const batchImport = () => ElMessage.info('批量导入功能')
const previewContent = (c: any) => ElMessage.success(`预览: ${c.title}`)
const editContent = (c: any) => ElMessage.info(`编辑: ${c.title}`)

// Helpers
const getTypeVariant = (type: string) => ({ html: 'primary', simulation: 'success', game: 'warning' }[type] || 'info')
const getTypeLabel = (type: string) => ({ html: 'HTML', simulation: '模拟', game: '游戏' }[type] || type)
const getContentIcon = (type: string) => ({ html: 'Document', simulation: 'Monitor', game: 'VideoPlay' }[type] || 'Document')
const getSubjectColor = (sub: string) => {
  const map: Record<string, string> = {
    chinese: '#f56a00', // Orange
    math: '#1890ff',    // Blue
    english: '#52c41a', // Green
    physics: '#722ed1', // Purple
    chemistry: '#eb2f96', // Magenta
    biology: '#faad14', // Yellow-Orange
    ai: '#4F46E5',      // Indigo
    cs: '#10B981'       // Emerald
  }
  return map[sub] || '#94A3B8'
}

</script>

<style scoped lang="scss">
/* Reuse Global Layout Styles */

/* Left Sidebar */
.filter-sidebar { padding: 8px 0; display: flex; flex-direction: column; gap: 24px; }
.filter-section { display: flex; flex-direction: column; gap: 12px; }
.filter-title { font-size: 12px; font-weight: 700; color: #94A3B8; padding-left: 12px; text-transform: uppercase; }
.filter-menu, .filter-tree { display: flex; flex-direction: column; gap: 4px; }

.filter-item, .filter-tree-item {
  display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 8px; cursor: pointer; color: #475569; font-size: 14px; transition: all 0.2s;
  &:hover { background: #F1F5F9; color: #0F172A; }
  &.active { background: #E0E7FF; color: #4F46E5; font-weight: 500; }
}
.tree-dot { width: 8px; height: 8px; border-radius: 50%; }

/* Right Canvas */
.experience-canvas { display: flex; flex-direction: column; gap: 24px; max-width: 1200px; margin: 0 auto; width: 100%; }
.canvas-header { display: flex; flex-direction: column; gap: 24px; padding-bottom: 24px; border-bottom: 1px solid #F1F5F9; }

.search-bar-floating {
  background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); padding: 8px 16px; display: flex; align-items: center; gap: 12px;
  &:focus-within { box-shadow: 0 8px 30px rgba(99, 102, 241, 0.1); }
}
.search-input-clean { border: none; outline: none; font-size: 16px; flex: 1; color: #0F172A; }
.search-icon { font-size: 20px; color: #94A3B8; }
.search-btn { background: none; border: none; cursor: pointer; color: #94A3B8; padding: 4px; &:hover { color: #64748B; } }

.quick-actions-row { display: flex; gap: 16px; }
.action-card {
  flex: 1; background: white; border: 1px solid #F1F5F9; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: all 0.2s;
  &:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.03); border-color: #E2E8F0; }
}
.icon-box {
  width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px;
  &.blue { background: #E0E7FF; color: #4F46E5; }
  &.purple { background: #F3E8FF; color: #9333EA; }
  &.orange { background: #FFEDD5; color: #F97316; }
}

.canvas-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.left-stat { font-size: 14px; color: #64748B; }
.view-toggles { background: #F1F5F9; padding: 2px; border-radius: 6px; display: flex; }
.view-toggles button { background: none; border: none; padding: 6px; border-radius: 4px; color: #94A3B8; cursor: pointer; &.active { background: white; color: #0F172A; box-shadow: 0 1px 2px rgba(0,0,0,0.05); } }

/* Content */
.grid-layout { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 24px; }
.clean-card {
   background: white; border-radius: 16px; overflow: hidden; cursor: pointer; transition: all 0.3s; border: 1px solid transparent;
   &:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0,0,0,0.06); .thumb-overlay { opacity: 1; } }
}

.card-thumb {
   height: 140px; display: flex; align-items: center; justify-content: center; position: relative;
   &.html { background: #E0E7FF; color: #4F46E5; }
   &.simulation { background: #DCFCE7; color: #16A34A; }
   &.game { background: #FEF3C7; color: #D97706; }
}
.thumb-icon { font-size: 48px; opacity: 0.8; }
.thumb-overlay {
   position: absolute; inset: 0; background: rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; gap: 12px; opacity: 0; transition: opacity 0.2s;
}

.card-body { padding: 16px; }
.exp-title { font-size: 15px; font-weight: 600; color: #0F172A; margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.exp-meta { display: flex; justify-content: space-between; align-items: center; }
.exp-author { font-size: 12px; color: #94A3B8; }

/* List */
.list-layout { display: flex; flex-direction: column; gap: 8px; }
.clean-list-item {
   display: flex; align-items: center; gap: 16px; background: white; padding: 12px 16px; border-radius: 8px; border: 1px solid transparent; cursor: pointer; transition: all 0.2s;
   &:hover { background: #F8FAFC; border-color: #E2E8F0; }
}
.list-icon-box {
   width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px;
   &.html { background: #E0E7FF; color: #4F46E5; }
   &.simulation { background: #DCFCE7; color: #16A34A; }
   &.game { background: #FEF3C7; color: #D97706; }
}
.list-main { flex: 1; }
.list-title { font-size: 14px; font-weight: 600; color: #0F172A; }
.list-desc { font-size: 12px; color: #64748B; }

/* Upload Area */
.upload-area { border: 2px dashed #E2E8F0; border-radius: 12px; padding: 40px; text-align: center; color: #64748B; cursor: pointer; &:hover { border-color: #4F46E5; background: #F5F3FF; } }
.upload-icon { font-size: 48px; color: #94A3B8; margin-bottom: 16px; }
.upload-hint { font-size: 12px; color: #94A3B8; margin-top: 8px; }

.empty-placeholder { display: flex; flex-direction: column; align-items: center; padding: 60px 0; gap: 16px; }
</style>