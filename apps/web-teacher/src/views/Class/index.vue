<template>
  <TeacherWorkspaceLayout
    title="班级管理"
    subtitle="班级与学生管理"
    :leftCollapsible="false"
    :rightCollapsible="true"
    v-model:rightCollapsed="rightCollapsed"
  >
    <!-- 左侧筛选区 -->
    <template #left>
      <div class="filter-sidebar">
        <div class="filter-section">
          <div class="filter-title">班级视图</div>
          <div class="filter-menu">
            <div 
              class="filter-item" 
              :class="{ active: currentView === 'all' }"
              @click="currentView = 'all'"
            >
              <el-icon><School /></el-icon>
              <span>全部班级</span>
            </div>
            <div 
              class="filter-item" 
              :class="{ active: currentView === 'my' }"
              @click="currentView = 'my'"
            >
              <el-icon><User /></el-icon>
              <span>我管理的</span>
            </div>
            <div 
              class="filter-item" 
              :class="{ active: currentView === 'archived' }"
              @click="currentView = 'archived'"
            >
              <el-icon><Collection /></el-icon>
              <span>归档班级</span>
            </div>
          </div>
        </div>

        <div class="filter-section mt-6">
          <div class="filter-title">年级筛选</div>
          <div class="grade-tags">
            <div 
              v-for="g in grades" 
              :key="g.value"
              class="mini-tag"
              :class="{ active: filterGrade === g.value }"
              @click="filterGrade = filterGrade === g.value ? '' : g.value"
            >
              {{ g.label }}
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 右侧详情栏 (保留用于协作/资源) -->
    <template #right>
      <div class="right-sidebar-panel">
        <div class="panel-header">
          <h3>班级动态</h3>
        </div>
        <div class="activity-timeline">
           <div v-for="act in recentActivities" :key="act.id" class="timeline-item">
              <div class="timeline-dot" :class="act.type"></div>
              <div class="timeline-content">
                 <div class="timeline-text">{{ act.text }}</div>
                 <div class="timeline-time">{{ formatTime(act.timestamp) }}</div>
              </div>
           </div>
        </div>
      </div>
    </template>

    <!-- 主画布 -->
    <div class="class-canvas">
      
      <!-- 搜索与快捷栏 -->
      <div class="canvas-header">
         <div class="search-bar-floating">
            <el-icon class="search-icon"><Search /></el-icon>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="搜索班级名称、班主任..." 
              class="search-input-clean"
            />
         </div>
         
         <div class="quick-actions-row">
            <button class="action-card" @click="showCreateClassModal = true">
               <div class="icon-box blue"><el-icon><Plus /></el-icon></div>
               <span>新建班级</span>
            </button>
            <button class="action-card" @click="exportData">
               <div class="icon-box green"><el-icon><Download /></el-icon></div>
               <span>导出报表</span>
            </button>
         </div>
      </div>

      <!-- 数据概览卡片 (Horizontal Scroll) -->
      <div class="stats-row">
         <div class="stat-card">
            <div class="stat-icon purple"><el-icon><User /></el-icon></div>
            <div class="stat-info">
               <div class="stat-val">{{ summaryStats.totalStudents }}</div>
               <div class="stat-label">学生总数</div>
            </div>
         </div>
         <div class="stat-card">
            <div class="stat-icon blue"><el-icon><School /></el-icon></div>
            <div class="stat-info">
               <div class="stat-val">{{ summaryStats.totalClasses }}</div>
               <div class="stat-label">活跃班级</div>
            </div>
         </div>
         <div class="stat-card">
            <div class="stat-icon orange"><el-icon><TrendCharts /></el-icon></div>
            <div class="stat-info">
               <div class="stat-val">{{ summaryStats.averageProgress }}%</div>
               <div class="stat-label">平均进度</div>
            </div>
         </div>
      </div>

      <!-- 列表工具栏 -->
      <div class="canvas-toolbar">
         <div class="left-stat">班级列表</div>
         <div class="right-tools">
            <div class="view-toggles">
               <button :class="{ active: viewMode === 'card' }" @click="viewMode = 'card'"><el-icon><Grid /></el-icon></button>
               <button :class="{ active: viewMode === 'table' }" @click="viewMode = 'table'"><el-icon><List /></el-icon></button>
            </div>
         </div>
      </div>

      <!-- 列表内容 -->
      <div class="canvas-content">
         <!-- Card View -->
         <div v-if="viewMode === 'card'" class="grid-layout">
            <div 
              v-for="cls in filteredClasses" 
              :key="cls.id" 
              class="clean-card class-card"
              @click="viewClassDetail(cls)"
            >
               <div class="class-header">
                  <div class="class-icon">{{ cls.name.charAt(0) }}</div>
                  <div class="class-info">
                     <div class="class-name">{{ cls.name }}</div>
                     <div class="class-teacher">{{ cls.teacher?.name || '未分配' }}</div>
                  </div>
                  <el-tag size="small" :type="cls.status === 'active' ? 'success' : 'info'" class="status-tag">
                     {{ cls.status === 'active' ? '进行中' : '归档' }}
                  </el-tag>
               </div>
               
               <div class="class-stats-row">
                  <div class="c-stat">
                     <span class="val">{{ cls.studentCount }}</span>
                     <span class="lbl">学生</span>
                  </div>
                  <div class="c-stat">
                     <span class="val">{{ cls.courseCount }}</span>
                     <span class="lbl">课程</span>
                  </div>
                  <div class="c-stat">
                     <span class="val">{{ cls.averageProgress }}%</span>
                     <span class="lbl">进度</span>
                  </div>
               </div>

               <div class="class-footer">
                  <div class="avatars">
                     <!-- Mock avatars -->
                     <div class="mini-avatar" v-for="i in 3" :key="i" :style="{background: `hsl(${i*60}, 70%, 80%)`}"></div>
                     <div class="mini-avatar more">+</div>
                  </div>
                  <el-button link type="primary" size="small" @click.stop="manageClassStudents(cls)">管理</el-button>
               </div>
            </div>
         </div>

         <!-- Table View -->
         <div v-else class="list-layout table-container">
            <el-table :data="filteredClasses" style="width: 100%">
               <el-table-column prop="name" label="班级名称" min-width="140">
                  <template #default="{ row }">
                     <span class="font-bold">{{ row.name }}</span>
                  </template>
               </el-table-column>
               <el-table-column prop="grade" label="年级" width="100">
                  <template #default="{ row }">
                     {{ getGradeLabel(row.grade) }}
                  </template>
               </el-table-column>
               <el-table-column prop="teacher.name" label="班主任" width="120" />
               <el-table-column prop="studentCount" label="学生" width="80" align="center" />
               <el-table-column prop="status" label="状态" width="100">
                  <template #default="{ row }">
                     <el-tag size="small" :type="row.status === 'active' ? 'success' : 'info'">{{ row.status === 'active' ? '活跃' : '归档' }}</el-tag>
                  </template>
               </el-table-column>
               <el-table-column label="操作" width="180" align="right">
                  <template #default="{ row }">
                     <el-button link type="primary" size="small" @click="viewClassDetail(row)">详情</el-button>
                     <el-button link type="primary" size="small" @click="manageClassStudents(row)">学生</el-button>
                  </template>
               </el-table-column>
            </el-table>
         </div>
      </div>

    </div>

    <!-- Create Dialog (Keep existing logic) -->
    <el-dialog v-model="showCreateClassModal" title="新建班级" width="500px">
       <el-form :model="createClassForm" label-width="80px">
          <el-form-item label="班级名称">
             <el-input v-model="createClassForm.name" placeholder="例如：高一(3)班" />
          </el-form-item>
          <el-form-item label="年级">
             <el-select v-model="createClassForm.grade" class="w-full">
                <el-option v-for="g in grades" :key="g.value" :label="g.label" :value="g.value" />
             </el-select>
          </el-form-item>
       </el-form>
       <template #footer>
          <el-button @click="showCreateClassModal = false">取消</el-button>
          <el-button type="primary" @click="createClass">创建</el-button>
       </template>
    </el-dialog>

  </TeacherWorkspaceLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  School, User, Collection, Search, Plus, Download,
  Grid, List, TrendCharts, Clock
} from '@element-plus/icons-vue'
import TeacherWorkspaceLayout from '@/components/layout/TeacherWorkspaceLayout.vue'
import { grades } from '@/config/courseData'

// -- Types & State --
const router = useRouter()
const rightCollapsed = ref(true) // Default collapsed
const currentView = ref('all')
const filterGrade = ref('')
const searchQuery = ref('')
const viewMode = ref<'card' | 'table'>('card')
const showCreateClassModal = ref(false)

const createClassForm = reactive({ name: '', grade: '' })

// Mock Data
const classList = ref<any[]>([])
const recentActivities = ref([
   { id: 1, text: '张老师布置了数学作业', timestamp: Date.now() - 3600000, type: 'info' },
   { id: 2, text: '高一(2)班添加了3名学生', timestamp: Date.now() - 7200000, type: 'success' }
])

// Computed
const filteredClasses = computed(() => {
   return classList.value.filter(c => {
      const matchSearch = !searchQuery.value || c.name.includes(searchQuery.value)
      const matchGrade = !filterGrade.value || c.grade === filterGrade.value
      const matchView = currentView.value === 'all' ? true : (currentView.value === 'archived' ? c.status === 'archived' : c.status !== 'archived')
      return matchSearch && matchGrade && matchView
   })
})

const summaryStats = computed(() => ({
   totalStudents: classList.value.reduce((s, c) => s + c.studentCount, 0),
   totalClasses: classList.value.filter(c => c.status === 'active').length,
   averageProgress: 75
}))

// Methods
const formatTime = (ts: number) => {
   const min = Math.floor((Date.now() - ts) / 60000)
   return min < 60 ? `${min}分钟前` : `${Math.floor(min/60)}小时前`
}

const getGradeLabel = (val: string) => grades.find(g => g.value === val)?.label || val

const loadData = () => {
   // Mock load
   classList.value = [
      { id: 1, name: '高一(1)班', grade: 'grade10', studentCount: 45, courseCount: 8, averageProgress: 80, status: 'active', teacher: { name: '张老师' } },
      { id: 2, name: '高二(3)班', grade: 'grade11', studentCount: 42, courseCount: 6, averageProgress: 65, status: 'active', teacher: { name: '李老师' } },
      { id: 3, name: '高三(5)班', grade: 'grade12', studentCount: 50, courseCount: 10, averageProgress: 90, status: 'active', teacher: { name: '王老师' } }
   ]
}

const createClass = () => {
   ElMessage.success('创建成功')
   showCreateClassModal.value = false
}

const exportData = () => ElMessage.success('导出中...')
const viewClassDetail = (cls: any) => ElMessage.info(`查看 ${cls.name}`)
const manageClassStudents = (cls: any) => ElMessage.info(`管理 ${cls.name} 学生`)

onMounted(() => {
   loadData()
})
</script>

<style scoped lang="scss">
/* Reuse styles from LabLibrary & Global CSS */

/* Left Sidebar */
.filter-sidebar {
  padding: 8px 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.filter-section { display: flex; flex-direction: column; gap: 12px; }
.filter-title { font-size: 12px; font-weight: 700; color: #94A3B8; padding-left: 12px; text-transform: uppercase; }
.filter-menu { display: flex; flex-direction: column; gap: 4px; }

.filter-item {
  display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 8px; cursor: pointer; color: #475569; font-size: 14px; transition: all 0.2s;
  &:hover { background: #F1F5F9; color: #0F172A; }
  &.active { background: #E0E7FF; color: #4F46E5; font-weight: 500; }
}

.grade-tags { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 12px; }
.mini-tag {
  padding: 4px 10px; background: white; border: 1px solid #E2E8F0; border-radius: 12px; font-size: 12px; color: #64748B; cursor: pointer; transition: all 0.2s;
  &:hover { border-color: #94A3B8; }
  &.active { background: #4F46E5; border-color: #4F46E5; color: white; }
}

/* Right Sidebar Panel */
.right-sidebar-panel { padding: 16px; }
.panel-header h3 { margin: 0 0 16px 0; font-size: 16px; font-weight: 600; }
.activity-timeline { display: flex; flex-direction: column; gap: 16px; }
.timeline-item { display: flex; gap: 12px; }
.timeline-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 6px; flex-shrink: 0; 
   &.info { background: #3B82F6; } &.success { background: #22C55E; } 
}
.timeline-text { font-size: 13px; color: #334155; margin-bottom: 2px; }
.timeline-time { font-size: 11px; color: #94A3B8; }

/* Canvas */
.class-canvas {
  display: flex; flex-direction: column; gap: 24px; max-width: 1200px; margin: 0 auto; width: 100%;
}

.canvas-header {
  display: flex; flex-direction: column; gap: 24px; padding-bottom: 24px; border-bottom: 1px solid #F1F5F9;
}

.search-bar-floating {
  background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); padding: 8px 16px; display: flex; align-items: center; gap: 12px;
  &:focus-within { box-shadow: 0 8px 30px rgba(99, 102, 241, 0.1); }
}
.search-input-clean { border: none; outline: none; font-size: 16px; flex: 1; color: #0F172A; }
.search-icon { font-size: 20px; color: #94A3B8; }

.quick-actions-row { display: flex; gap: 16px; }
.action-card {
  flex: 1; background: white; border: 1px solid #F1F5F9; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: all 0.2s;
  &:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.03); border-color: #E2E8F0; }
}
.icon-box {
  width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px;
  &.blue { background: #E0E7FF; color: #4F46E5; }
  &.green { background: #DCFCE7; color: #16A34A; }
  &.orange { background: #FFEDD5; color: #F97316; }
  &.purple { background: #F3E8FF; color: #9333EA; }
}

/* Stats Row */
.stats-row { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 4px; }
.stat-card {
   flex: 1; min-width: 200px; background: white; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 16px; border: 1px solid transparent;
   &:hover { border-color: #F1F5F9; }
}
.stat-icon { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; 
   &.purple { background: #F3E8FF; color: #9333EA; }
   &.blue { background: #E0E7FF; color: #4F46E5; }
   &.orange { background: #FFEDD5; color: #F97316; }
}
.stat-val { font-size: 20px; font-weight: 700; color: #0F172A; }
.stat-label { font-size: 12px; color: #64748B; }

/* Grid */
.grid-layout { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.clean-card {
   background: white; border-radius: 16px; border: 1px solid transparent; cursor: pointer; transition: all 0.3s; padding: 20px; display: flex; flex-direction: column; gap: 16px;
   &:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0,0,0,0.06); }
}

.class-header { display: flex; align-items: center; gap: 12px; }
.class-icon { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #6366F1, #8B5CF6); color: white; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; }
.class-info { flex: 1; }
.class-name { font-size: 16px; font-weight: 600; color: #0F172A; }
.class-teacher { font-size: 12px; color: #64748B; }

.class-stats-row { display: flex; justify-content: space-between; background: #F8FAFC; padding: 12px; border-radius: 8px; }
.c-stat { display: flex; flex-direction: column; align-items: center; }
.c-stat .val { font-size: 14px; font-weight: 600; color: #334155; }
.c-stat .lbl { font-size: 11px; color: #94A3B8; }

.class-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 4px; }
.avatars { display: flex; }
.mini-avatar { width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; margin-left: -8px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: white; background: #CBD5E1; 
   &:first-child { margin-left: 0; }
   &.more { background: #94A3B8; }
}

.canvas-toolbar { display: flex; justify-content: space-between; margin-bottom: 8px; align-items: center; }
.left-stat { font-size: 14px; font-weight: 600; color: #64748B; }
.view-toggles { background: #F1F5F9; padding: 2px; border-radius: 6px; display: flex; }
.view-toggles button { background: none; border: none; padding: 6px; border-radius: 4px; color: #94A3B8; cursor: pointer; &.active { background: white; color: #0F172A; box-shadow: 0 1px 2px rgba(0,0,0,0.05); } }

/* Table */
.table-container { background: white; border-radius: 12px; padding: 0; overflow: hidden; border: 1px solid transparent; }
</style>