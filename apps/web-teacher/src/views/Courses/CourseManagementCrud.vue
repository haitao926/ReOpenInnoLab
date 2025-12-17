<template>
  <TeacherWorkspaceLayout
    title="课程管理"
    subtitle="管理您的课程资源"
    :leftCollapsible="false"
    :rightCollapsible="false"
  >
    <!-- 左侧筛选区 (Transparent File Tree Style) -->
    <template #left>
      <div class="filter-sidebar">
        <!-- 主分类 -->
        <div class="filter-section">
          <div class="filter-title">课程状态</div>
          <div class="filter-menu">
            <div 
              class="filter-item" 
              :class="{ active: filterStatus === '' }"
              @click="filterStatus = ''"
            >
              <el-icon><Menu /></el-icon>
              <span>全部课程</span>
            </div>
            <div 
              class="filter-item" 
              :class="{ active: filterStatus === 'published' }"
              @click="filterStatus = 'published'"
            >
              <el-icon><CircleCheck /></el-icon>
              <span>已发布</span>
            </div>
            <div 
              class="filter-item" 
              :class="{ active: filterStatus === 'draft' }"
              @click="filterStatus = 'draft'"
            >
              <el-icon><EditPen /></el-icon>
              <span>草稿箱</span>
            </div>
          </div>
        </div>

        <!-- 学科分类 (Tree Like) -->
        <div class="filter-section mt-6">
          <div class="filter-title">学科分类</div>
          <div class="filter-tree">
            <div 
              v-for="item in subjectOptions"
              :key="item.value"
              class="filter-tree-item"
              :class="{ active: filterSubject === item.value }"
              @click="toggleSubject(item.value)"
            >
              <span class="tree-dot" :style="{ background: item.color }"></span>
              <span class="tree-text">{{ item.label }}</span>
              <span class="tree-count" v-if="item.count">{{ item.count }}</span>
            </div>
          </div>
        </div>
        
         <!-- 年级 (Tags Style) -->
        <div class="filter-section mt-6">
           <div class="filter-title">年级筛选</div>
           <div class="grade-tags">
              <div 
                v-for="g in gradeOptions" 
                :key="g.value"
                class="mini-tag"
                :class="{ active: filterGrade === g.value }"
                @click="filterGrade = g.value"
              >
                {{ g.label }}
              </div>
           </div>
        </div>
      </div>
    </template>

    <!-- 右侧主要内容区 (Canvas Style) -->
    <div class="course-canvas">
      
      <!-- 顶部搜索栏 + 快捷入口 -->
      <div class="canvas-header">
         <div class="search-bar-floating">
            <el-icon class="search-icon"><Search /></el-icon>
            <input 
              v-model="searchKeyword" 
              type="text" 
              placeholder="搜索课程名称..." 
              class="search-input-clean"
            />
            <button class="search-btn" v-if="searchKeyword" @click="searchKeyword=''">
               <el-icon><Close /></el-icon>
            </button>
         </div>
         
         <!-- Quick Actions Row -->
         <div class="quick-actions-row">
            <button class="action-card" @click="handleCreate">
               <div class="icon-box blue"><el-icon><Plus /></el-icon></div>
               <span>新建课程</span>
            </button>
            <button class="action-card">
               <div class="icon-box orange"><el-icon><Files /></el-icon></div>
               <span>从模板创建</span>
            </button>
            <button class="action-card">
               <div class="icon-box green"><el-icon><Upload /></el-icon></div>
               <span>导入资源</span>
            </button>
         </div>
      </div>

      <!-- 排序与视图切换 -->
      <div class="canvas-toolbar">
         <div class="left-stat">
            共 {{ filteredCourses.length }} 个课程
         </div>
         <div class="right-tools">
            <el-dropdown trigger="click" @command="(val) => sortBy = val">
              <span class="sort-text">
                {{ getSortLabel(sortBy) }} <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="updated">最近更新</el-dropdown-item>
                  <el-dropdown-item command="students">学生人数</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            
            <div class="view-toggles">
               <button :class="{ active: viewMode === 'card' }" @click="viewMode = 'card'"><el-icon><Grid /></el-icon></button>
               <button :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'"><el-icon><List /></el-icon></button>
            </div>
         </div>
      </div>

      <!-- 内容列表 -->
      <div class="canvas-content" v-loading="loading">
         
         <!-- 空状态 -->
         <div v-if="!loading && filteredCourses.length === 0" class="empty-placeholder">
            <img src="https://illustrations.popsy.co/amber/surr-searching.svg" alt="Empty" class="empty-img" />
            <p>没有找到相关课程</p>
            <el-button type="primary" link @click="resetFilters">清空筛选条件</el-button>
         </div>

         <!-- 卡片视图 -->
         <div v-if="viewMode === 'card'" class="grid-layout">
            <div 
              v-for="course in displayCourses" 
              :key="course.id" 
              class="clean-card"
              @click="viewCourse(course)"
            >
               <div class="card-thumb">
                  <el-image :src="course.coverUrl" fit="cover" class="thumb-img" lazy>
                     <template #error>
                        <div class="thumb-placeholder" :style="{ background: course.coverGradient }">
                           {{ course.title.charAt(0) }}
                        </div>
                     </template>
                  </el-image>
                  <div class="thumb-tag" :class="course.status">{{ getStatusLabel(course.status) }}</div>
               </div>
               <div class="card-body">
                  <h3 class="course-name">{{ course.title }}</h3>
                  <div class="course-meta">
                     <span class="meta-item"><el-icon><User /></el-icon> {{ course.studentCount }}</span>
                     <span class="meta-item"><el-icon><Reading /></el-icon> {{ course.modules }}</span>
                  </div>
                  <div class="course-footer">
                     <span class="date">{{ formatDate(course.updatedAt) }}</span>
                     <button class="more-btn" @click.stop><el-icon><MoreFilled /></el-icon></button>
                  </div>
               </div>
            </div>
         </div>

         <!-- 列表视图 -->
         <div v-else class="list-layout">
            <div 
               v-for="course in displayCourses" 
               :key="course.id" 
               class="clean-list-item"
               @click="viewCourse(course)"
            >
               <div class="list-icon" :style="{ background: course.coverGradient }">
                  {{ course.title.charAt(0) }}
               </div>
               <div class="list-main">
                  <div class="list-title">{{ course.title }}</div>
                  <div class="list-sub">
                     <span class="tag-pill">{{ getSubjectLabel(course.subject) }}</span>
                     <span class="sep">·</span>
                     <span>{{ getGradeLabel(course.grade) }}</span>
                  </div>
               </div>
               <div class="list-meta">
                  <div class="meta-row">
                     <span class="label">学生</span>
                     <span class="val">{{ course.studentCount }}</span>
                  </div>
               </div>
               <div class="list-status">
                  <span class="status-dot" :class="course.status"></span>
                  {{ getStatusLabel(course.status) }}
               </div>
               <div class="list-date">
                  {{ formatDate(course.updatedAt) }}
               </div>
               <div class="list-action">
                   <el-button circle size="small" :icon="Edit" @click.stop="editCourse(course)" />
               </div>
            </div>
         </div>

      </div>

    </div>
  </TeacherWorkspaceLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Search, Grid, List, Edit, User, Reading, Loading,
  Filter, ArrowDown, Menu, CircleCheck, EditPen, Files, Upload,
  Close, MoreFilled
} from '@element-plus/icons-vue'

import TeacherWorkspaceLayout from '@/components/layout/TeacherWorkspaceLayout.vue'

const router = useRouter()

// State
const loading = ref(true)
const viewMode = ref<'card' | 'list'>('card')
const searchKeyword = ref('')
const filterSubject = ref('')
const filterGrade = ref<number | ''>('')
const filterStatus = ref('')
const sortBy = ref<'updated' | 'students'>('updated')

// Mocks
const subjectOptions = [
  { label: '语文', value: 'chinese', count: 12, color: '#f56a00' },
  { label: '数学', value: 'math', count: 8, color: '#1890ff' },
  { label: '英语', value: 'english', count: 5, color: '#52c41a' },
  { label: '物理', value: 'physics', count: 4, color: '#722ed1' },
  { label: '化学', value: 'chemistry', count: 3, color: '#eb2f96' },
  { label: '生物', value: 'biology', count: 6, color: '#faad14' },
  { label: '科普', value: 'science', count: 2, color: '#13c2c2' },
  { label: 'AI', value: 'ai', count: 2, color: '#2f54eb' }
]

const gradeOptions = [
  { label: '全部', value: '' },
  { label: '初一', value: 7 },
  { label: '初二', value: 8 },
  { label: '初三', value: 9 },
  { label: '高一', value: 10 },
  { label: '高二', value: 11 },
  { label: '高三', value: 12 }
]

const mockCourses = [
  { id: 1, title: 'AI 基础入门：神经网络初探', description: 'AI Intro', subject: 'ai', grade: 10, status: 'published', studentCount: 128, modules: 12, updatedAt: '2025-12-10T10:00:00', coverGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', coverUrl: 'https://picsum.photos/seed/ai-1/400/300' },
  { id: 2, title: '初中物理实验：力与运动', description: 'Physics Lab', subject: 'physics', grade: 8, status: 'in_progress', studentCount: 45, modules: 5, updatedAt: '2025-12-12T14:30:00', coverGradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', coverUrl: 'https://picsum.photos/seed/phy-2/400/300' },
  { id: 3, title: '现代文学赏析：鲁迅专题', description: 'Literature', subject: 'chinese', grade: 11, status: 'published', studentCount: 89, modules: 8, updatedAt: '2025-11-20T09:15:00', coverGradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)', coverUrl: 'https://picsum.photos/seed/lit-3/400/300' },
  { id: 4, title: '化学元素周期律', description: 'Chemistry', subject: 'chemistry', grade: 9, status: 'draft', studentCount: 0, modules: 3, updatedAt: '2025-12-13T11:20:00', coverGradient: 'linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)', coverUrl: 'https://picsum.photos/seed/chem-4/400/300' },
  { id: 5, title: '高中英语听力进阶', description: 'English Listening', subject: 'english', grade: 12, status: 'published', studentCount: 210, modules: 20, updatedAt: '2025-10-05T16:45:00', coverGradient: 'linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%)', coverUrl: 'https://picsum.photos/seed/eng-5/400/300' },
  { id: 6, title: '生物多样性与保护', description: 'Biodiversity', subject: 'biology', grade: 7, status: 'in_progress', studentCount: 56, modules: 6, updatedAt: '2025-12-01T13:20:00', coverGradient: 'linear-gradient(to top, #cfd9df 0%, #e2ebf0 100%)', coverUrl: 'https://picsum.photos/seed/bio-6/400/300' },
  { id: 7, title: '几何证明技巧', description: 'Geometry', subject: 'math', grade: 8, status: 'published', studentCount: 78, modules: 10, updatedAt: '2025-11-15T08:00:00', coverGradient: 'linear-gradient(to top, #dad4ec 0%, #dad4ec 1%, #f3e7e9 100%)', coverUrl: 'https://picsum.photos/seed/math-7/400/300' }
]

const courses = ref<any[]>([])

// Computed
const filteredCourses = computed(() => {
  return courses.value.filter(c => {
    const matchSearch = !searchKeyword.value || c.title.toLowerCase().includes(searchKeyword.value.toLowerCase())
    const matchSubject = !filterSubject.value || c.subject === filterSubject.value
    const matchGrade = !filterGrade.value || c.grade === filterGrade.value
    const matchStatus = !filterStatus.value || c.status === filterStatus.value
    return matchSearch && matchSubject && matchGrade && matchStatus
  })
})

const displayCourses = computed(() => {
  const list = [...filteredCourses.value]
  return list.sort((a, b) => {
    if (sortBy.value === 'students') return b.studentCount - a.studentCount
    // updated
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
})

// Methods
onMounted(() => {
  setTimeout(() => {
    courses.value = mockCourses
    loading.value = false
  }, 400)
})

const handleCreate = () => router.push('/courses/create')
const viewCourse = (c: any) => router.push(`/courses/${c.id}/panoramic`)
const editCourse = (c: any) => router.push(`/courses/${c.id}/edit`)
const resetFilters = () => {
  filterSubject.value = ''
  filterGrade.value = ''
  filterStatus.value = ''
  searchKeyword.value = ''
}
const toggleSubject = (val: string) => {
  filterSubject.value = filterSubject.value === val ? '' : val
}

// Helpers
const getSortLabel = (key: string) => ({ updated: '最近更新', students: '学生人数' }[key] || key)
const getStatusLabel = (s: string) => ({ draft: '草稿', published: '已发布', in_progress: '进行中' }[s] || s)
const getSubjectLabel = (val: string) => subjectOptions.find(o => o.value === val)?.label || val
const getGradeLabel = (val: number) => val > 9 ? `高${val - 9}` : (val > 6 ? `初${val - 6}` : `${val}年级`)
const formatDate = (str: string) => {
   const d = new Date(str)
   return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes()}`
}

</script>

<style scoped lang="scss">
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
  color: #94A3B8; /* Slate-400 */
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
  color: #475569; /* Slate-600 */
  font-size: 14px;
  transition: all 0.2s;

  &:hover {
    background: #F1F5F9; /* Slate-100 */
    color: #0F172A; /* Slate-900 */
  }

  &.active {
    background: #E0E7FF; /* Indigo-100 */
    color: #4F46E5; /* Indigo-600 */
    font-weight: 500;
  }
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

  &:hover {
    background: #F8FAFC;
    color: #0F172A;
  }

  &.active {
    background: #F1F5F9;
    color: #0F172A;
    font-weight: 600;
  }
}

.tree-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tree-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tree-count {
  font-size: 12px;
  color: #94A3B8;
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

  &:hover {
    border-color: #94A3B8;
  }

  &.active {
    background: #4F46E5;
    border-color: #4F46E5;
    color: white;
  }
}

/* --- Right Canvas --- */
.course-canvas {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1200px; /* Center content like Gaoding */
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

  &::placeholder {
    color: #94A3B8;
  }
}

.search-icon {
  font-size: 20px;
  color: #94A3B8;
}

.search-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #94A3B8;
  padding: 4px;
  
  &:hover { color: #64748B; }
}

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
  &.orange { background: #FFEDD5; color: #F97316; }
  &.green { background: #DCFCE7; color: #16A34A; }
}

/* Toolbar */
.canvas-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.left-stat {
  font-size: 14px;
  color: #64748B;
}

.right-tools {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sort-text {
  font-size: 14px;
  color: #475569;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &:hover { color: #0F172A; }
}

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

/* Content Grid */
.grid-layout {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
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
    
    .course-name { color: #4F46E5; }
  }
}

.card-thumb {
  height: 140px;
  position: relative;
  background: #F8FAFC;
}

.thumb-img {
  width: 100%;
  height: 100%;
  display: block;
}

.thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 32px;
  font-weight: 700;
}

.thumb-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  background: rgba(0,0,0,0.6);
  color: white;
  backdrop-filter: blur(4px);
  
  &.published { background: rgba(22, 163, 74, 0.9); }
  &.draft { background: rgba(100, 116, 139, 0.9); }
}

.card-body {
  padding: 12px;
}

.course-name {
  font-size: 15px;
  font-weight: 600;
  color: #0F172A;
  margin: 0 0 8px 0;
  line-height: 1.4;
  height: 42px; /* 2 lines */
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.course-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #64748B;
  margin-bottom: 12px;
  
  .meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.course-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #F1F5F9;
  padding-top: 8px;
}

.date {
  font-size: 12px;
  color: #94A3B8;
}

.more-btn {
  background: none;
  border: none;
  color: #94A3B8;
  cursor: pointer;
  padding: 4px;
  
  &:hover { color: #0F172A; }
}

/* List Layout */
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

.list-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  flex-shrink: 0;
}

.list-main {
  flex: 1;
}

.list-title {
  font-size: 14px;
  font-weight: 600;
  color: #0F172A;
  margin-bottom: 4px;
}

.list-sub {
  font-size: 12px;
  color: #64748B;
  
  .sep { margin: 0 4px; }
}

.list-meta {
  width: 120px;
  font-size: 13px;
  color: #64748B;
}

.list-status {
  width: 100px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #475569;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  
  &.published { background: #16A34A; }
  &.draft { background: #94A3B8; }
  &.in_progress { background: #4F46E5; }
}

.list-date {
  width: 120px;
  font-size: 13px;
  color: #94A3B8;
  text-align: right;
}

.list-action {
  width: 48px;
  text-align: right;
}

/* Empty State */
.empty-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 0;
  
  .empty-img {
    width: 200px;
    height: 150px;
    margin-bottom: 24px;
    opacity: 0.8;
  }
  
  p {
    color: #64748B;
    margin-bottom: 16px;
  }
}
</style>