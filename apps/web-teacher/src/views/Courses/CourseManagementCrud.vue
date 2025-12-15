<template>
  <TeacherWorkspaceLayout
    title="课程管理"
    subtitle="管理您的课程资源，制定教学大纲"
    :leftCollapsible="false"
    :rightCollapsible="false"
  >
    <div class="course-layout">
      <!-- 侧边栏筛选 -->
      <aside class="nav-sidebar">
        <div class="sidebar-group">
          <h3 class="group-title">学科领域</h3>
          <div class="filter-chips">
            <div
              v-for="item in subjectOptions"
              :key="item.value"
              class="filter-chip"
              :class="{ active: filterSubject === item.value }"
              @click="filterSubject = item.value"
            >
              <span class="chip-label">{{ item.label }}</span>
              <span v-if="item.count" class="chip-count">{{ item.count }}</span>
            </div>
          </div>
        </div>

        <div class="sidebar-divider"></div>

        <div class="sidebar-group">
          <h3 class="group-title">年级筛选</h3>
          <div class="filter-chips">
            <div
              v-for="item in gradeOptions"
              :key="item.value"
              class="filter-chip"
              :class="{ active: filterGrade === item.value }"
              @click="filterGrade = item.value"
            >
              {{ item.label }}
            </div>
          </div>
        </div>

        <div class="sidebar-divider"></div>

        <div class="sidebar-group">
          <h3 class="group-title">发布状态</h3>
          <div class="status-filters">
            <el-radio-group v-model="filterStatus" size="small">
              <el-radio-button label="">全部</el-radio-button>
              <el-radio-button label="published">已发布</el-radio-button>
              <el-radio-button label="draft">草稿</el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <div class="nav-actions">
           <el-button link @click="resetFilters" size="small">清除筛选</el-button>
        </div>
      </aside>

      <!-- 主要内容区 -->
      <section class="course-main">
        <!-- 工具栏 -->
        <div class="main-toolbar card-surface">
          <div class="left-tools">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索课程名称或关键字..."
              class="search-input"
              size="large"
              clearable
            >
              <template #prefix>
                <el-icon class="search-icon"><Search /></el-icon>
              </template>
            </el-input>
          </div>
          
          <div class="right-tools">
            <div class="tool-group">
              <span class="tool-label">排序:</span>
              <el-select v-model="sortBy" size="default" style="width: 130px" class="sort-select">
                <el-option label="最近更新" value="updated" />
                <el-option label="学生人数" value="students" />
                <el-option label="创建时间" value="created" />
              </el-select>
            </div>

            <div class="view-toggle">
              <el-tooltip content="网格视图">
                <div 
                  class="toggle-btn" 
                  :class="{ active: viewMode === 'card' }"
                  @click="viewMode = 'card'"
                >
                  <el-icon><Grid /></el-icon>
                </div>
              </el-tooltip>
              <el-tooltip content="列表视图">
                <div 
                  class="toggle-btn" 
                  :class="{ active: viewMode === 'list' }"
                  @click="viewMode = 'list'"
                >
                  <el-icon><List /></el-icon>
                </div>
              </el-tooltip>
            </div>

            <el-button type="primary" size="default" class="create-btn" @click="handleCreate">
              <el-icon class="mr-1"><Plus /></el-icon> 新建课程
            </el-button>
          </div>
        </div>

        <!-- 课程列表内容 -->
        <div class="content-area">
          <!-- Loading State -->
          <div v-if="loading" class="skeleton-container">
            <el-skeleton :rows="3" animated v-for="i in 4" :key="i" class="course-skeleton"/>
          </div>

          <!-- Empty State -->
          <div v-else-if="filteredCourses.length === 0" class="empty-state">
             <img src="https://cdni.iconscout.com/illustration/premium/thumb/folder-is-empty-4064360-3363921.png" alt="Empty" class="empty-img"/>
             <h3>暂无相关课程</h3>
             <p>尝试调整筛选条件或创建一个新课程</p>
             <el-button type="primary" @click="resetFilters">重置筛选</el-button>
          </div>

          <!-- Grid View -->
          <div v-else-if="viewMode === 'card'" class="course-grid">
            <div 
              v-for="course in displayCourses" 
              :key="course.id" 
              class="course-card-item"
              @click="viewCourse(course)"
            >
              <div class="card-accent" :style="{ background: getSubjectColor(course.subject) }"></div>
              
              <div class="card-content">
                <div class="card-header">
                  <h3 class="course-title" :title="course.title">{{ course.title }}</h3>
                  <el-tag size="small" :type="getStatusType(course.status)">
                    {{ getStatusLabel(course.status) }}
                  </el-tag>
                </div>
                
                <div class="card-meta">
                  <span class="meta-item">{{ getSubjectLabel(course.subject) }}</span>
                  <span class="meta-divider">·</span>
                  <span class="meta-item">{{ getGradeLabel(course.grade) }}</span>
                </div>
                
                <div class="card-desc">{{ course.description || '暂无描述' }}</div>
                
                <div class="card-stats">
                  <div class="stat-group">
                    <el-icon><User /></el-icon>
                    <span>{{ course.studentCount }}</span>
                  </div>
                  <div class="stat-group">
                     <el-icon><Reading /></el-icon>
                     <span>{{ course.modules }}</span>
                  </div>
                  <div class="stat-group date-info">
                     {{ formatDate(course.updatedAt) }}
                  </div>
                </div>

                <div class="card-actions">
                  <el-button size="small" text @click.stop="viewCourse(course)">
                    <el-icon><View /></el-icon>
                    查看
                  </el-button>
                  <el-button size="small" text type="primary" @click.stop="editCourse(course)">
                    <el-icon><Edit /></el-icon>
                    编辑
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <!-- List View -->
          <div v-else class="course-list-view card-surface">
            <el-table :data="displayCourses" style="width: 100%" @row-click="viewCourse">
              <el-table-column label="课程信息" min-width="280">
                <template #default="{ row }">
                   <div class="list-course-info">
                     <div class="list-cover" :style="{ background: row.coverGradient || getRandomGradient(row.id) }">
                        <span class="list-cover-text">{{ row.title.charAt(0) }}</span>
                     </div>
                     <div class="list-text">
                        <div class="list-title">{{ row.title }}</div>
                        <div class="list-desc">{{ row.description }}</div>
                     </div>
                   </div>
                </template>
              </el-table-column>
              <el-table-column prop="subject" label="学科" width="100">
                <template #default="{ row }">
                  <el-tag size="small" effect="plain">{{ getSubjectLabel(row.subject) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="grade" label="年级" width="100">
                <template #default="{ row }">
                   {{ getGradeLabel(row.grade) }}
                </template>
              </el-table-column>
               <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                   <el-tag size="small" :type="getStatusType(row.status)" effect="light">
                      <span class="dot" :class="`bg-${getStatusType(row.status)}`"></span>
                      {{ getStatusLabel(row.status) }}
                   </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="统计" width="180">
                 <template #default="{ row }">
                    <div class="list-stats">
                       <span><el-icon><User /></el-icon> {{ row.studentCount }}</span>
                       <span><el-icon><Reading /></el-icon> {{ row.modules }}</span>
                    </div>
                 </template>
              </el-table-column>
              <el-table-column label="最后更新" width="150">
                 <template #default="{ row }">{{ formatDate(row.updatedAt) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="150" align="right">
                <template #default="{ row }">
                   <el-button link type="primary" @click.stop="editCourse(row)">编辑</el-button>
                   <el-button link type="danger" @click.stop="deleteCourse(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </section>
    </div>
  </TeacherWorkspaceLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Search, Grid, List, View, Edit, User, Reading, Filter, MoreFilled, Delete
} from '@element-plus/icons-vue'

import TeacherWorkspaceLayout from '@/components/layout/TeacherWorkspaceLayout.vue'
import { EduCard } from '@reopeninnolab/ui-kit'

const router = useRouter()

// State
const loading = ref(true)
const viewMode = ref<'card' | 'list'>('card')
const searchKeyword = ref('')
const filterSubject = ref('')
const filterGrade = ref<number | ''>('')
const filterStatus = ref('')
const sortBy = ref<'updated' | 'students' | 'created'>('updated')

// Mocks
const subjectOptions = [
  { label: '全部', value: '', count: 0 },
  { label: '语文', value: 'chinese', count: 12 },
  { label: '数学', value: 'math', count: 8 },
  { label: '英语', value: 'english', count: 5 },
  { label: '物理', value: 'physics', count: 4 },
  { label: '化学', value: 'chemistry', count: 3 },
  { label: '生物', value: 'biology', count: 6 },
  { label: '科普', value: 'science', count: 2 },
  { label: '人工智能', value: 'ai', count: 2 }
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
  { id: 1, title: 'AI 基础入门：神经网络初探', description: '深入浅出讲解人工智能核心概念，通过动手实验理解神经网络工作原理。适合初学者入门。', subject: 'ai', grade: 10, status: 'published', studentCount: 128, modules: 12, updatedAt: '2025-12-10T10:00:00', coverGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 2, title: '初中物理实验：力与运动', description: '涵盖牛顿运动定律的核心实验，包括小车滑行、自由落体等经典力学实验演示与操作。', subject: 'physics', grade: 8, status: 'in_progress', studentCount: 45, modules: 5, updatedAt: '2025-12-12T14:30:00', coverGradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
  { id: 3, title: '现代文学赏析：鲁迅专题', description: '精读鲁迅经典短篇小说，探讨其时代背景与文学价值，培养批判性思维。', subject: 'chinese', grade: 11, status: 'published', studentCount: 89, modules: 8, updatedAt: '2025-11-20T09:15:00', coverGradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)' },
  { id: 4, title: '化学元素周期律', description: '探索元素周期表的奥秘，理解原子结构与元素性质的周期性变化规律。', subject: 'chemistry', grade: 9, status: 'draft', studentCount: 0, modules: 3, updatedAt: '2025-12-13T11:20:00', coverGradient: 'linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)' },
  { id: 5, title: '高中英语听力进阶', description: '针对高考听力题型进行专项训练，包含日常对话、新闻广播等多种场景素材。', subject: 'english', grade: 12, status: 'published', studentCount: 210, modules: 20, updatedAt: '2025-10-05T16:45:00', coverGradient: 'linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%)' },
  { id: 6, title: '生物多样性与保护', description: '了解地球上的生物多样性，探讨生态系统的平衡与人类活动的影响。', subject: 'biology', grade: 7, status: 'in_progress', studentCount: 56, modules: 6, updatedAt: '2025-12-01T13:20:00', coverGradient: 'linear-gradient(to top, #cfd9df 0%, #e2ebf0 100%)' },
  { id: 7, title: '几何证明技巧', description: '掌握平面几何证明的核心方法，提升逻辑推理能力。', subject: 'math', grade: 8, status: 'published', studentCount: 78, modules: 10, updatedAt: '2025-11-15T08:00:00', coverGradient: 'linear-gradient(to top, #dad4ec 0%, #dad4ec 1%, #f3e7e9 100%)' }
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
    if (sortBy.value === 'created') return b.id - a.id
    // updated
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
})

// Methods
onMounted(() => {
  // Simulate API call
  setTimeout(() => {
    courses.value = mockCourses
    loading.value = false
  }, 600)
})

const handleCreate = () => router.push('/courses/create')

const viewCourse = (c: any) => {
   router.push(`/courses/${c.id}/panoramic`)
}

const editCourse = (c: any) => {
   router.push(`/courses/${c.id}/edit`)
}

const deleteCourse = (c: any) => {
  ElMessageBox.confirm(
    '确定要删除该课程吗？删除后不可恢复。',
    '警告',
    { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    courses.value = courses.value.filter(item => item.id !== c.id)
    ElMessage.success('课程已删除')
  }).catch(() => {})
}

const resetFilters = () => {
  filterSubject.value = ''
  filterGrade.value = ''
  filterStatus.value = ''
  searchKeyword.value = ''
}

// Visual Helpers
const getRandomGradient = (id: number) => {
  const gradients = [
    'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)',
    'linear-gradient(120deg, #f6d365 0%, #fda085 100%)',
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  ]
  return gradients[id % gradients.length]
}

const getStatusType = (status: string) => {
  const map: any = { draft: 'info', published: 'success', in_progress: 'primary', completed: 'warning' }
  return map[status] || 'info'
}

const getStatusLabel = (status: string) => {
  const map: any = { draft: '草稿', published: '已发布', in_progress: '进行中', completed: '已结束' }
  return map[status] || status
}

const getSubjectLabel = (val: string) => {
  const item = subjectOptions.find(o => o.value === val)
  return item ? item.label : val
}

const getGradeLabel = (val: number) => {
  if (val > 9) return `高${val - 9}`
  if (val > 6) return `初${val - 6}`
  return `${val}年级`
}

const formatDate = (str: string) => {
  return new Date(str).toLocaleDateString()
}
</script>

<style scoped lang="scss">
.course-layout {
  display: flex;
  gap: 24px;
  height: 100%;
  padding: 0  0 24px;
  max-width: 1600px;
  margin: 0 auto;
}

/* Sidebar Styling */
.nav-sidebar {
  width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-top: 8px;
}

.sidebar-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.group-title {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--edu-text-tertiary);
  font-weight: 700;
  margin: 0;
  padding-left: 4px;
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-chip {
  padding: 6px 12px;
  border-radius: 20px;
  background: var(--edu-bg-secondary);
  color: var(--edu-text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  user-select: none;

  &:hover {
    background: var(--edu-bg-hover);
    color: var(--edu-text-primary);
  }

  &.active {
    background: var(--edu-primary);
    color: white;
    box-shadow: 0 2px 8px rgba(var(--edu-primary-rgb), 0.3);
    
    .chip-count {
      background: rgba(255,255,255,0.2);
      color: white;
    }
  }
}

.chip-count {
  font-size: 11px;
  background: var(--edu-bg-tertiary);
  padding: 1px 6px;
  border-radius: 10px;
  color: var(--edu-text-tertiary);
}

.sidebar-divider {
  height: 1px;
  background: var(--edu-border-light);
  width: 100%;
}

/* Main Content Styling */
.course-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0; /* Prevent grid overflow */
}

.main-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid var(--edu-border-light);
  flex-wrap: wrap;
  gap: 16px;
}

.left-tools {
  flex: 1;
  min-width: 280px;
  max-width: 480px;
}

.search-input {
  :deep(.el-input__wrapper) {
     border-radius: 8px;
     box-shadow: none;
     background: var(--edu-bg-secondary);
     border: 1px solid transparent;
     transition: all 0.2s;
     
     &.is-focus {
       background: white;
       border-color: var(--edu-primary);
       box-shadow: 0 0 0 1px var(--edu-primary);
     }
  }
}

.right-tools {
  display: flex;
  align-items: center;
  gap: 16px;
}

.tool-group {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--edu-text-secondary);
}

.view-toggle {
  display: flex;
  background: var(--edu-bg-secondary);
  padding: 2px;
  border-radius: 8px;
}

.toggle-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  color: var(--edu-text-tertiary);
  transition: all 0.2s;
  
  &:hover {
    color: var(--edu-text-primary);
  }
  
  &.active {
    background: white;
    color: var(--edu-primary);
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
}

/* Grid View */
.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding-bottom: 40px;
}

.course-card-item {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
  cursor: pointer;
  border: 1px solid var(--edu-border-light);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }
}

.card-accent {
  height: 4px;
  width: 100%;
}

.card-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.course-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--edu-text-primary);
  line-height: 1.4;
  flex: 1;
  
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--edu-text-tertiary);
  
  .meta-divider {
    opacity: 0.5;
  }
}

.card-desc {
  font-size: 14px;
  color: var(--edu-text-secondary);
  line-height: 1.6;
  
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 44px;
}

.card-stats {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--edu-border-light);
  font-size: 13px;
  color: var(--edu-text-tertiary);
  
  .stat-group {
    display: flex;
    align-items: center;
    gap: 6px;
    
    &.date-info {
      margin-left: auto;
      font-size: 12px;
    }
  }
}

.card-actions {
  display: flex;
  gap: 8px;
  padding-top: 8px;
  
  .el-button {
    flex: 1;
  }
}

/* List View */
.course-list-view {
   padding: 0;
   overflow: hidden;
   border-radius: 12px;
}

.list-course-info {
   display: flex;
   align-items: center;
   gap: 12px;
}

.list-cover {
   width: 48px;
   height: 48px;
   border-radius: 8px;
   display: flex;
   align-items: center;
   justify-content: center;
   color: white;
   font-weight: 700; 
   font-size: 20px;
   flex-shrink: 0;
}

.list-text {
   display: flex;
   flex-direction: column;
   gap: 4px;
   overflow: hidden;
}

.list-title {
   font-weight: 600;
   color: var(--edu-text-primary);
   white-space: nowrap;
   overflow: hidden;
   text-overflow: ellipsis;
}

.list-desc {
   font-size: 12px;
   color: var(--edu-text-tertiary);
   white-space: nowrap;
   overflow: hidden;
   text-overflow: ellipsis;
}

.list-stats {
   display: flex;
   gap: 16px;
   color: var(--edu-text-secondary);
   font-size: 13px;
   
   span {
      display: flex;
      align-items: center;
      gap: 6px;
   }
}

.dot {
   display: inline-block;
   width: 6px;
   height: 6px;
   border-radius: 50%;
   margin-right: 6px;
   background: currentColor;
   
   &.bg-success { background: var(--el-color-success); }
   &.bg-primary { background: var(--el-color-primary); }
   &.bg-warning { background: var(--el-color-warning); }
   &.bg-info { background: var(--el-color-info); }
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  text-align: center;
  
  .empty-img {
     width: 180px;
     margin-bottom: 24px;
     opacity: 0.8;
  }
  
  h3 {
     font-size: 18px;
     color: var(--edu-text-primary);
     margin: 0 0 8px 0;
  }
  
  p {
     color: var(--edu-text-secondary);
     margin: 0 0 24px 0;
  }
}

/* Responsive */
@media (max-width: 768px) {
   .course-layout {
      flex-direction: column;
   }
   
   .nav-sidebar {
      width: 100%;
      flex-direction: row;
      overflow-x: auto;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--edu-border-light);
   }
   
   .sidebar-group {
      min-width: 140px;
   }
   
   .main-toolbar {
      flex-direction: column;
      align-items: stretch;
   }
   
   .right-tools {
      justify-content: space-between;
   }
}
</style>
