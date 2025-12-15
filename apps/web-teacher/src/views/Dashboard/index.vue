<template>
  <TeacherWorkspaceLayout
    title="教学工作台"
    subtitle="今天 2024年5月20日 星期一"
    :leftCollapsible="false"
    :rightCollapsible="false"
  >
    <template #header-controls>
       <div class="header-actions">
         <EduButton variant="primary" icon="VideoPlay" @click="startInstantClass">
           快速开始上课
         </EduButton>
       </div>
    </template>

    <div class="dashboard-container page-surface">
      <!-- Top Row: Status & Stats -->
      <div class="stats-row">
        <GlassSurface variant="panel" class="stat-card">
          <div class="stat-icon blue">
            <el-icon><Reading /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">3</span>
            <span class="stat-label">进行中课程</span>
          </div>
        </GlassSurface>

        <GlassSurface variant="panel" class="stat-card">
          <div class="stat-icon orange">
            <el-icon><EditPen /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">12</span>
            <span class="stat-label">待批改作业</span>
          </div>
        </GlassSurface>

         <GlassSurface variant="panel" class="stat-card">
          <div class="stat-icon purple">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">45</span>
            <span class="stat-label">学生互动</span>
          </div>
        </GlassSurface>

        <GlassSurface variant="panel" class="stat-card action-card" @click="createNewCourse">
           <div class="action-content">
              <el-icon class="action-icon"><Plus /></el-icon>
              <span>创建新课程</span>
           </div>
        </GlassSurface>
      </div>

      <!-- Middle Row: Workbench -->
      <div class="workbench-grid">
        <!-- Main Column: Active Teaching -->
        <div class="main-column">
          <!-- Next Up Card -->
          <section class="mb-6">
            <h3 class="section-title">下一节课</h3>
            <GlassSurface variant="card" class="next-up-card" tinted>
               <div class="next-up-content">
                  <div class="time-badge">
                     <span class="time-big">10:10</span>
                     <span class="time-desc">25分钟后开始</span>
                  </div>
                  <div class="class-details">
                     <div class="class-tags">
                        <EduTag variant="primary" size="sm">人工智能基础</EduTag>
                        <EduTag variant="secondary" size="sm">高一(2)班</EduTag>
                     </div>
                     <h2 class="lesson-title">第三章：神经网络初探与实践</h2>
                     <p class="lesson-desc">本节课将带领学生使用 TensorFlow Playground 直观体验神经网络的训练过程。</p>
                  </div>
                  <div class="class-action">
                     <EduButton size="large" variant="primary" icon="VideoPlay" @click="enterClassroom">
                        进入教室
                     </EduButton>
                  </div>
               </div>
            </GlassSurface>
          </section>

          <!-- Timeline -->
          <section>
            <div class="flex justify-between items-center mb-4">
               <h3 class="section-title">今日日程</h3>
               <el-button link type="primary">查看全部</el-button>
            </div>
            
            <div class="schedule-list">
               <div v-for="item in scheduleItems" :key="item.id" class="schedule-item">
                  <div class="time-column">
                     <span class="start">{{ item.start }}</span>
                     <span class="end">{{ item.end }}</span>
                  </div>
                  <GlassSurface class="schedule-content" :variant="item.status === 'done' ? 'base' : 'card'">
                     <div class="schedule-dot" :class="item.status"></div>
                     <div class="schedule-texts">
                        <span class="sched-title">{{ item.title }}</span>
                        <span class="sched-sub">{{ item.class }} • {{ item.room }}</span>
                     </div>
                     <div class="sched-status">
                        <el-tag v-if="item.status === 'done'" type="info" size="small" effect="plain">已结束</el-tag>
                        <el-tag v-else-if="item.status === 'active'" type="success" size="small" effect="dark">进行中</el-tag>
                        <el-tag v-else type="primary" size="small" effect="light">未开始</el-tag>
                     </div>
                  </GlassSurface>
               </div>
            </div>
          </section>
        </div>

        <!-- Side Column: Quick Access -->
        <div class="side-column">
          <!-- Quick Courses -->
          <section class="mb-6">
             <h3 class="section-title">最近编辑</h3>
             <div class="course-list">
                <GlassSurface 
                  v-for="course in recentCourses" 
                  :key="course.id" 
                  variant="base" 
                  class="mini-course-card"
                  @click="goToCourse(course.id)"
                >
                   <div class="course-cover" :style="{ backgroundColor: course.color }">
                      <el-icon><component :is="course.icon" /></el-icon>
                   </div>
                   <div class="course-info">
                      <span class="c-name">{{ course.name }}</span>
                      <span class="c-update">2小时前更新</span>
                   </div>
                   <el-icon class="arrow-icon"><ArrowRight /></el-icon>
                </GlassSurface>
             </div>
          </section>

          <!-- Inboxes -->
          <section>
             <h3 class="section-title">消息通知</h3>
             <GlassSurface variant="panel" class="notification-panel">
                <div class="notif-item">
                   <div class="dot red"></div>
                   <span>张伟提交了作业《Python循环》</span>
                   <span class="time">5m</span>
                </div>
                 <div class="notif-item">
                   <div class="dot blue"></div>
                   <span>教务处：期中考试安排通知</span>
                   <span class="time">1h</span>
                </div>
                 <div class="notif-item">
                   <div class="dot"></div>
                   <span>系统：云实验环境维护完成</span>
                   <span class="time">2h</span>
                </div>
             </GlassSurface>
          </section>
        </div>
      </div>
    </div>
  </TeacherWorkspaceLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Reading,
  EditPen,
  User,
  Plus,
  VideoPlay,
  ArrowRight,
  Monitor,
  DataLine,
  Connection
} from '@element-plus/icons-vue'
import { EduButton, EduTag, GlassSurface } from '@reopeninnolab/ui-kit'
import TeacherWorkspaceLayout from '@/components/layout/TeacherWorkspaceLayout.vue'

const router = useRouter()

// Actions
const startInstantClass = () => {
    ElMessage.success('正在启动快速课堂...')
}

const createNewCourse = () => {
    router.push('/courses/create')
}

const enterClassroom = () => {
    ElMessage.success('进入教室: 神经网络初探')
}

const goToCourse = (id: string) => {
    router.push(`/courses/${id}`)
}

// Data
const scheduleItems = ref([
    { id: 1, start: '08:00', end: '08:45', title: 'Python 基础语法', class: '高一(1)班', room: '机房 A201', status: 'done' },
    { id: 2, start: '09:00', end: '09:45', title: 'Python 基础语法', class: '高一(3)班', room: '机房 A201', status: 'done' },
    { id: 3, start: '10:10', end: '10:55', title: '神经网络初探', class: '高一(2)班', room: 'AI 实验室', status: 'active' },
    { id: 4, start: '14:00', end: '14:45', title: '计算机视觉项目', class: '社团课', room: '创客空间', status: 'future' },
])

const recentCourses = ref([
    { id: 'c1', name: '人工智能基础概论', color: '#5B8FF9', icon: 'Monitor' },
    { id: 'c2', name: 'Python 数据分析', color: '#FAAD14', icon: 'DataLine' },
    { id: 'c3', name: '物联网实战', color: '#52C41A', icon: 'Connection' },
])

</script>

<style scoped lang="scss">
.dashboard-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--edu-space-section);
}

.section-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--edu-text-primary);
    margin-bottom: 12px;
}

/* Stats Row */
.stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    
    @media (max-width: 1024px) {
        grid-template-columns: repeat(2, 1fr);
    }
}

.stat-card {
    display: flex;
    align-items: center;
    padding: 20px;
    gap: 16px;
    transition: transform 0.2s;
    
    &:hover {
        transform: translateY(-2px);
    }
}

.stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    
    &.blue { background: rgba(91, 143, 249, 0.1); color: #5B8FF9; }
    &.orange { background: rgba(250, 173, 20, 0.1); color: #FAAD14; }
    &.purple { background: rgba(114, 46, 209, 0.1); color: #722ED1; }
}

.stat-info {
    display: flex;
    flex-direction: column;
    
    .stat-value {
        font-size: 24px;
        font-weight: 700;
        color: var(--edu-text-primary);
        line-height: 1.2;
    }
    
    .stat-label {
        font-size: 13px;
        color: var(--edu-text-secondary);
    }
}

.action-card {
    cursor: pointer;
    border: 2px dashed var(--edu-border-base) !important;
    background: transparent !important;
    justify-content: center;
    
    .action-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        color: var(--edu-text-secondary);
        
        .action-icon {
            font-size: 24px;
        }
    }
    
    &:hover {
        border-color: var(--edu-primary) !important;
        color: var(--edu-primary);
        
        .action-content { color: var(--edu-primary); }
    }
}

/* Workbench Grid */
.workbench-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 24px;
    
    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
}

/* Main Column */
.next-up-card {
    display: flex;
    padding: 0;
    overflow: hidden;
    
    .next-up-content {
        display: flex;
        width: 100%;
        padding: 24px;
        align-items: center;
        gap: 24px;
        
        @media (max-width: 768px) {
            flex-direction: column;
            align-items: flex-start;
        }
    }
}

.time-badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-right: 24px;
    border-right: 1px solid var(--edu-border-light);
    min-width: 100px;
    
    .time-big {
        font-size: 32px;
        font-weight: 700;
        color: var(--edu-primary);
        font-family: monospace;
    }
    
    .time-desc {
        font-size: 13px;
        color: var(--edu-success);
        font-weight: 500;
        background: rgba(82, 196, 26, 0.1);
        padding: 2px 8px;
        border-radius: 10px;
        margin-top: 4px;
    }

    @media (max-width: 768px) {
        border-right: none;
        border-bottom: 1px solid var(--edu-border-light);
        padding-right: 0;
        padding-bottom: 16px;
        width: 100%;
        flex-direction: row;
        justify-content: space-between;
    }
}

.class-details {
    flex: 1;
    
    .class-tags {
        display: flex;
        gap: 8px;
        margin-bottom: 8px;
    }
    
    .lesson-title {
        font-size: 20px;
        font-weight: 600;
        margin: 0 0 8px 0;
        color: var(--edu-text-primary);
    }
    
    .lesson-desc {
        font-size: 14px;
        color: var(--edu-text-secondary);
        margin: 0;
        line-height: 1.5;
    }
}

/* Schedule List */
.schedule-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.schedule-item {
    display: flex;
    gap: 16px;
}

.time-column {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    min-width: 50px;
    font-size: 13px;
    color: var(--edu-text-secondary);
    font-family: monospace;
    padding-top: 12px;
}

.schedule-content {
    flex: 1;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    position: relative;
    
    .schedule-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--edu-border-base);
        
        &.active { background: var(--edu-success); box-shadow: 0 0 0 4px rgba(82, 196, 26, 0.2); }
        &.future { background: var(--edu-primary); }
    }
    
    .schedule-texts {
        display: flex;
        flex-direction: column;
        flex: 1;
        
        .sched-title { font-weight: 500; color: var(--edu-text-primary); }
        .sched-sub { font-size: 12px; color: var(--edu-text-secondary); }
    }
}

/* Side Column */
.course-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.mini-course-card {
    padding: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: background 0.2s;
    
    &:hover {
        background: rgba(0,0,0,0.02);
        
        .arrow-icon { opacity: 1; transform: translateX(0); }
    }
}

.course-cover {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 20px;
}

.course-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    
    .c-name { font-weight: 500; font-size: 14px; color: var(--edu-text-primary); }
    .c-update { font-size: 12px; color: var(--edu-text-tertiary); }
}

.arrow-icon {
    opacity: 0;
    transform: translateX(-4px);
    transition: all 0.2s;
    color: var(--edu-text-placeholder);
}

.notification-panel {
    padding: 0 16px;
    
    .notif-item {
        padding: 12px 0;
        border-bottom: 1px solid var(--edu-border-light);
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: var(--edu-text-regular);
        
        &:last-child { border-bottom: none; }
        
        .dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--edu-border-base);
            
            &.red { background: var(--edu-error); }
            &.blue { background: var(--edu-info); }
        }
        
        span:not(.time) { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .time { font-size: 12px; color: var(--edu-text-tertiary); }
    }
}
</style>
