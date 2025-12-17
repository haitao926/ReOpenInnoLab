<template>
  <TeacherWorkspaceLayout
    title="资源中心"
    subtitle="教学资源库"
    :leftCollapsible="false"
    :rightCollapsible="true"
    v-model:rightCollapsed="rightCollapsed"
  >
    <!-- 左侧筛选区 (Transparent Tree) -->
    <template #left>
      <div class="filter-sidebar">
        <!-- 资源库分类 -->
        <div class="filter-section">
          <div class="filter-title">资源库</div>
          <div class="filter-menu">
            <div class="filter-item" :class="{ active: currentLib === 'all' }" @click="currentLib = 'all'">
              <el-icon><Menu /></el-icon>
              <span>全部资源</span>
            </div>
            <div class="filter-item" :class="{ active: currentLib === 'mine' }" @click="currentLib = 'mine'">
              <el-icon><User /></el-icon>
              <span>我的上传</span>
            </div>
            <div class="filter-item" :class="{ active: currentLib === 'shared' }" @click="currentLib = 'shared'">
              <el-icon><Share /></el-icon>
              <span>校本共享</span>
            </div>
            <div class="filter-item" :class="{ active: currentLib === 'fav' }" @click="currentLib = 'fav'">
              <el-icon><Star /></el-icon>
              <span>我的收藏</span>
            </div>
          </div>
        </div>

        <!-- 格式筛选 -->
        <div class="filter-section mt-6">
          <div class="filter-title">文件类型</div>
          <div class="filter-tree">
             <div class="filter-tree-item" :class="{ active: filterType === '' }" @click="filterType = ''">
                <el-icon><Files /></el-icon> <span>全部类型</span>
             </div>
             <div class="filter-tree-item" :class="{ active: filterType === 'document' }" @click="filterType = 'document'">
                <el-icon><Document /></el-icon> <span>文档</span>
             </div>
             <div class="filter-tree-item" :class="{ active: filterType === 'video' }" @click="filterType = 'video'">
                <el-icon><VideoPlay /></el-icon> <span>视频</span>
             </div>
             <div class="filter-tree-item" :class="{ active: filterType === 'image' }" @click="filterType = 'image'">
                <el-icon><Picture /></el-icon> <span>图片</span>
             </div>
          </div>
        </div>
        
        <!-- 学科筛选 -->
        <div class="filter-section mt-6">
           <div class="filter-title">学科</div>
           <div class="grade-tags">
              <div 
                class="mini-tag" 
                :class="{ active: filterSubject === '' }"
                @click="filterSubject = ''"
              >全部</div>
              <div 
                v-for="sub in subjects" 
                :key="sub.value"
                class="mini-tag"
                :class="{ active: filterSubject === sub.value }"
                @click="filterSubject = sub.value"
              >
                {{ sub.label }}
              </div>
           </div>
        </div>
      </div>
    </template>

    <!-- 右侧详情栏 (Preview & Info) -->
    <template #right>
       <div class="right-sidebar-panel" v-if="selectedResource">
          <div class="file-preview-header">
             <div class="file-icon-lg" :class="selectedResource.type">
                <el-icon><component :is="getFileIcon(selectedResource.type)" /></el-icon>
             </div>
             <h3 class="file-title">{{ selectedResource.title }}</h3>
          </div>
          
          <div class="file-info-list">
             <div class="info-row">
                <span class="label">类型</span>
                <span class="val">{{ selectedResource.type }}</span>
             </div>
             <div class="info-row">
                <span class="label">大小</span>
                <span class="val">{{ formatFileSize(selectedResource.size) }}</span>
             </div>
             <div class="info-row">
                <span class="label">上传者</span>
                <span class="val">{{ selectedResource.author }}</span>
             </div>
             <div class="info-row">
                <span class="label">时间</span>
                <span class="val">{{ formatDate(selectedResource.updatedAt) }}</span>
             </div>
          </div>
          
          <div class="file-actions">
             <el-button type="primary" block @click="downloadResource(selectedResource)">下载文件</el-button>
             <el-button block @click="shareResource(selectedResource)">分享链接</el-button>
          </div>
       </div>
       <div v-else class="empty-right-panel">
          <el-icon><Pointer /></el-icon>
          <p>选择文件查看详情</p>
       </div>
    </template>

    <!-- 主画布 -->
    <div class="resource-canvas">
      
      <!-- 头部 -->
      <div class="canvas-header">
         <div class="search-bar-floating">
            <el-icon class="search-icon"><Search /></el-icon>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="搜索文件名、标签..." 
              class="search-input-clean"
            />
            <button class="search-btn" v-if="searchQuery" @click="searchQuery=''">
               <el-icon><Close /></el-icon>
            </button>
         </div>
         
         <div class="quick-actions-row">
            <button class="action-card" @click="openUploadDialog">
               <div class="icon-box blue"><el-icon><Upload /></el-icon></div>
               <span>上传文件</span>
            </button>
            <button class="action-card" @click="openImportDialog">
               <div class="icon-box green"><el-icon><FolderOpened /></el-icon></div>
               <span>新建文件夹</span>
            </button>
         </div>
      </div>

      <!-- 工具栏 -->
      <div class="canvas-toolbar">
         <div class="left-stat">
            <el-breadcrumb separator="/">
               <el-breadcrumb-item>根目录</el-breadcrumb-item>
               <el-breadcrumb-item v-if="filterType">{{ filterType }}</el-breadcrumb-item>
            </el-breadcrumb>
         </div>
         <div class="right-tools">
            <div class="view-toggles">
               <button :class="{ active: viewMode === 'grid' }" @click="viewMode = 'grid'"><el-icon><Grid /></el-icon></button>
               <button :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'"><el-icon><List /></el-icon></button>
            </div>
         </div>
      </div>

      <!-- 内容区 -->
      <div class="canvas-content">
         <!-- Empty -->
         <div v-if="filteredResources.length === 0" class="empty-placeholder">
            <el-empty description="文件夹为空" />
            <el-button type="primary" @click="openUploadDialog">上传第一个文件</el-button>
         </div>

         <!-- Grid View -->
         <div v-else-if="viewMode === 'grid'" class="grid-layout">
            <div 
              v-for="res in filteredResources" 
              :key="res.id" 
              class="file-card"
              :class="{ active: selectedResource?.id === res.id }"
              @click="selectResource(res)"
              @dblclick="viewResource(res)"
            >
               <div class="file-thumb">
                  <div class="file-type-icon" :class="res.type">
                     <el-icon><component :is="getFileIcon(res.type)" /></el-icon>
                  </div>
               </div>
               <div class="file-name">{{ res.title }}</div>
               <div class="file-meta">{{ formatFileSize(res.size) }}</div>
            </div>
         </div>

         <!-- List View -->
         <div v-else class="list-layout table-container">
            <el-table :data="filteredResources" style="width: 100%" @row-click="selectResource">
               <el-table-column width="40">
                  <template #default="{ row }">
                     <el-icon><component :is="getFileIcon(row.type)" /></el-icon>
                  </template>
               </el-table-column>
               <el-table-column prop="title" label="名称" min-width="200" />
               <el-table-column prop="size" label="大小" width="100">
                  <template #default="{ row }">{{ formatFileSize(row.size) }}</template>
               </el-table-column>
               <el-table-column prop="updatedAt" label="修改日期" width="160">
                  <template #default="{ row }">{{ formatDate(row.updatedAt) }}</template>
               </el-table-column>
               <el-table-column label="操作" width="100" align="right">
                  <template #default="{ row }">
                     <el-button link type="primary" @click.stop="downloadResource(row)">下载</el-button>
                  </template>
               </el-table-column>
            </el-table>
         </div>
      </div>

    </div>
  </TeacherWorkspaceLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Menu, User, Share, Star, Search, Upload, FolderOpened,
  Grid, List, Document, VideoPlay, Picture, Files, Pointer, Close
} from '@element-plus/icons-vue'
import TeacherWorkspaceLayout from '@/components/layout/TeacherWorkspaceLayout.vue'

// State
const rightCollapsed = ref(false)
const currentLib = ref('all')
const filterType = ref('')
const filterSubject = ref('')
const searchQuery = ref('')
const viewMode = ref<'grid' | 'list'>('grid')
const selectedResource = ref<any>(null)

// Mock Data
const subjects = [
  { label: '语文', value: 'chinese' },
  { label: '数学', value: 'math' },
  { label: '英语', value: 'english' }
]

const resources = ref([
  { id: 1, title: '高中数学必修一课件.ppt', type: 'document', size: 15678912, updatedAt: new Date(), author: '张老师' },
  { id: 2, title: '化学实验演示.mp4', type: 'video', size: 234567890, updatedAt: new Date(), author: '李老师' },
  { id: 3, title: '生物细胞结构图.png', type: 'image', size: 2456789, updatedAt: new Date(), author: '王老师' }
])

const filteredResources = computed(() => {
   return resources.value.filter(r => {
      const matchSearch = !searchQuery.value || r.title.includes(searchQuery.value)
      const matchType = !filterType.value || r.type === filterType.value
      return matchSearch && matchType
   })
})

// Methods
const selectResource = (res: any) => {
   selectedResource.value = res
   rightCollapsed.value = false // Open detail panel
}

const getFileIcon = (type: string) => ({ document: 'Document', video: 'VideoPlay', image: 'Picture' }[type] || 'Files')
const formatFileSize = (bytes: number) => {
   if (bytes === 0) return '0 B'
   const k = 1024
   const sizes = ['B', 'KB', 'MB', 'GB']
   const i = Math.floor(Math.log(bytes) / Math.log(k))
   return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
const formatDate = (d: Date) => d.toLocaleDateString()

const openUploadDialog = () => ElMessage.info('上传')
const openImportDialog = () => ElMessage.info('新建文件夹')
const viewResource = (res: any) => ElMessage.success(`打开: ${res.title}`)
const downloadResource = (res: any) => ElMessage.success(`下载: ${res.title}`)
const shareResource = (res: any) => ElMessage.success('链接已复制')

</script>

<style scoped lang="scss">
/* Reuse Global Styles */
.filter-sidebar { padding: 8px 0; display: flex; flex-direction: column; gap: 24px; }
.filter-section { display: flex; flex-direction: column; gap: 12px; }
.filter-title { font-size: 12px; font-weight: 700; color: #94A3B8; padding-left: 12px; text-transform: uppercase; }
.filter-menu, .filter-tree { display: flex; flex-direction: column; gap: 4px; }

.filter-item, .filter-tree-item {
  display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 8px; cursor: pointer; color: #475569; font-size: 14px; transition: all 0.2s;
  &:hover { background: #F1F5F9; color: #0F172A; }
  &.active { background: #E0E7FF; color: #4F46E5; font-weight: 500; }
}

.grade-tags { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 12px; }
.mini-tag {
  padding: 4px 10px; background: white; border: 1px solid #E2E8F0; border-radius: 12px; font-size: 12px; color: #64748B; cursor: pointer;
  &:hover { border-color: #94A3B8; }
  &.active { background: #4F46E5; border-color: #4F46E5; color: white; }
}

/* Canvas */
.resource-canvas { display: flex; flex-direction: column; gap: 24px; max-width: 1200px; margin: 0 auto; width: 100%; }
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
  &.green { background: #DCFCE7; color: #16A34A; }
}

.canvas-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.view-toggles { background: #F1F5F9; padding: 2px; border-radius: 6px; display: flex; }
.view-toggles button { background: none; border: none; padding: 6px; border-radius: 4px; color: #94A3B8; cursor: pointer; &.active { background: white; color: #0F172A; box-shadow: 0 1px 2px rgba(0,0,0,0.05); } }

/* Grid */
.grid-layout { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 20px; }
.file-card {
   background: white; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; align-items: center; text-align: center; border: 1px solid transparent; cursor: pointer; transition: all 0.2s;
   &:hover { background: #F8FAFC; transform: translateY(-2px); }
   &.active { border-color: #4F46E5; background: #E0E7FF; }
}
.file-thumb { height: 80px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
.file-type-icon { 
   font-size: 64px; color: #CBD5E1; 
   &.document { color: #3B82F6; } &.video { color: #F43F5E; } &.image { color: #10B981; }
}
.file-name { font-size: 14px; color: #334155; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; width: 100%; height: 40px; }
.file-meta { font-size: 12px; color: #94A3B8; }

/* Right Panel */
.right-sidebar-panel { padding: 16px; }
.file-preview-header { display: flex; flex-direction: column; align-items: center; padding: 24px 0; border-bottom: 1px solid #F1F5F9; margin-bottom: 16px; }
.file-icon-lg { font-size: 80px; margin-bottom: 16px; &.document { color: #3B82F6; } &.video { color: #F43F5E; } }
.file-title { font-size: 16px; font-weight: 600; text-align: center; }

.file-info-list { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
.info-row { display: flex; justify-content: space-between; font-size: 13px; }
.label { color: #94A3B8; } .val { color: #334155; font-weight: 500; }

.file-actions { display: flex; flex-direction: column; gap: 8px; }
.empty-right-panel { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #94A3B8; gap: 8px; }

/* Table */
.table-container { background: white; border-radius: 12px; overflow: hidden; }
</style>