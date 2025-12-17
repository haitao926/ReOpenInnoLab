<template>
  <TeacherWorkspaceLayout
    title="教学工作台"
    :leftCollapsible="false"
    :rightCollapsible="false"
  >
    <div class="dashboard-canvas">
      
      <!-- Greeting Header -->
      <div class="welcome-header">
         <h2 class="welcome-title">早安，张老师 👋</h2>
         <p class="welcome-sub">今天是 2025年12月17日 星期三，您有 3 节课需要处理</p>
      </div>

      <!-- Quick Actions Row -->
      <div class="action-grid">
         <div class="dash-action-card blue" @click="startInstantClass">
            <div class="act-icon"><el-icon><VideoPlay /></el-icon></div>
            <span>快速上课</span>
         </div>
         <div class="dash-action-card purple" @click="createNewCourse">
            <div class="act-icon"><el-icon><Plus /></el-icon></div>
            <span>新建课程</span>
         </div>
         <div class="dash-action-card orange">
            <div class="act-icon"><el-icon><EditPen /></el-icon></div>
            <span>批改作业</span>
            <span class="badge">12</span>
         </div>
         <div class="dash-action-card green">
            <div class="act-icon"><el-icon><DataAnalysis /></el-icon></div>
            <span>学情分析</span>
         </div>
      </div>

      <!-- Main Dashboard Grid -->
      <div class="dashboard-grid">
         
         <!-- Left Column: Schedule & Tasks -->
         <div class="main-column">
            <!-- Next Class -->
            <div class="section-block">
               <h3 class="section-header">下一节课</h3>
               <div class="next-class-card">
                  <div class="time-box">
                     <span class="t-start">10:10</span>
                     <span class="t-status">25分钟后</span>
                  </div>
                  <div class="class-detail">
                     <div class="c-tags">
                        <span class="tag-pill blue">人工智能基础</span>
                        <span class="tag-pill gray">高一(2)班</span>
                     </div>
                     <div class="c-title">第三章：神经网络初探与实践</div>
                     <div class="c-loc"><el-icon><Location /></el-icon> AI 实验室 A201</div>
                  </div>
                  <el-button type="primary" size="large" round @click="enterClassroom">进入教室</el-button>
               </div>
            </div>

            <!-- Schedule -->
            <div class="section-block mt-6">
               <h3 class="section-header">今日日程</h3>
               <div class="schedule-list">
                  <div class="schedule-row done">
                     <div class="s-time">08:00 - 08:45</div>
                     <div class="s-line"></div>
                     <div class="s-content">
                        <span class="s-title">Python 基础语法</span>
                        <span class="s-sub">高一(1)班 • 已结束</span>
                     </div>
                  </div>
                  <div class="schedule-row active">
                     <div class="s-time">10:10 - 10:55</div>
                     <div class="s-line"></div>
                     <div class="s-content">
                        <span class="s-title">神经网络初探</span>
                        <span class="s-sub">高一(2)班 • 即将开始</span>
                     </div>
                  </div>
                  <div class="schedule-row future">
                     <div class="s-time">14:00 - 14:45</div>
                     <div class="s-line"></div>
                     <div class="s-content">
                        <span class="s-title">计算机视觉项目</span>
                        <span class="s-sub">社团课 • 未开始</span>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         <!-- Right Column: Recent & Updates -->
         <div class="side-column">
            <div class="section-block">
               <h3 class="section-header">最近编辑</h3>
               <div class="recent-list">
                  <div class="recent-item" @click="goToCourse('c1')">
                     <div class="r-icon" style="background: #E0E7FF; color: #4F46E5"><el-icon><Monitor /></el-icon></div>
                     <div class="r-info">
                        <div class="r-name">人工智能基础概论</div>
                        <div class="r-time">2小时前</div>
                     </div>
                  </div>
                  <div class="recent-item" @click="goToCourse('c2')">
                     <div class="r-icon" style="background: #FEF3C7; color: #D97706"><el-icon><DataLine /></el-icon></div>
                     <div class="r-info">
                        <div class="r-name">Python 数据分析</div>
                        <div class="r-time">昨天</div>
                     </div>
                  </div>
               </div>
            </div>

            <div class="section-block mt-6">
               <h3 class="section-header">消息通知</h3>
               <div class="msg-list">
                  <div class="msg-item">
                     <div class="msg-dot red"></div>
                     <div class="msg-text">张伟提交了作业《Python循环》</div>
                     <div class="msg-time">5m</div>
                  </div>
                  <div class="msg-item">
                     <div class="msg-dot blue"></div>
                     <div class="msg-text">教务处：期中考试安排通知</div>
                     <div class="msg-time">1h</div>
                  </div>
               </div>
            </div>
         </div>

      </div>

    </div>
  </TeacherWorkspaceLayout>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  VideoPlay, Plus, EditPen, DataAnalysis,
  Location, Monitor, DataLine
} from '@element-plus/icons-vue'
import TeacherWorkspaceLayout from '@/components/layout/TeacherWorkspaceLayout.vue'

const router = useRouter()

const startInstantClass = () => ElMessage.success('启动快速课堂')
const createNewCourse = () => router.push('/courses/create')
const enterClassroom = () => ElMessage.success('进入教室')
const goToCourse = (id: string) => router.push(`/courses/${id}`)
</script>

<style scoped lang="scss">
.dashboard-canvas {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.welcome-header {
  margin-top: 8px;
}
.welcome-title { font-size: 24px; font-weight: 700; color: #0F172A; margin: 0 0 8px 0; }
.welcome-sub { color: #64748B; font-size: 14px; margin: 0; }

/* Quick Actions */
.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.dash-action-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  position: relative;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
  }
  
  .act-icon {
    width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px;
  }
  
  span { font-weight: 600; color: #334155; font-size: 15px; }
  
  .badge {
    position: absolute; top: 12px; right: 12px; background: #EF4444; color: white; font-size: 11px; padding: 2px 8px; border-radius: 10px;
  }
  
  &.blue .act-icon { background: #E0E7FF; color: #4F46E5; }
  &.purple .act-icon { background: #F3E8FF; color: #9333EA; }
  &.orange .act-icon { background: #FFEDD5; color: #F97316; }
  &.green .act-icon { background: #DCFCE7; color: #16A34A; }
}

/* Grid Layout */
.dashboard-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 32px;
}

.section-header { font-size: 16px; font-weight: 600; color: #0F172A; margin: 0 0 16px 0; }

/* Next Class */
.next-class-card {
  background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 24px;
  color: white;
  box-shadow: 0 10px 30px -10px rgba(79, 70, 229, 0.4);
}

.time-box {
  display: flex; flex-direction: column; align-items: center; padding-right: 24px; border-right: 1px solid rgba(255,255,255,0.2); min-width: 80px;
}
.t-start { font-size: 28px; font-weight: 700; font-family: monospace; }
.t-status { font-size: 12px; opacity: 0.9; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 10px; margin-top: 4px; }

.class-detail { flex: 1; }
.c-tags { display: flex; gap: 8px; margin-bottom: 8px; }
.tag-pill { font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 600; 
   &.blue { background: white; color: #4F46E5; }
   &.gray { background: rgba(255,255,255,0.2); color: white; }
}
.c-title { font-size: 18px; font-weight: 600; margin-bottom: 4px; }
.c-loc { font-size: 13px; opacity: 0.8; display: flex; align-items: center; gap: 4px; }

/* Schedule */
.schedule-list { display: flex; flex-direction: column; gap: 0; }
.schedule-row {
  display: flex; align-items: flex-start; gap: 16px; padding: 12px 0; position: relative;
  
  .s-time { width: 100px; font-size: 13px; color: #64748B; font-family: monospace; text-align: right; }
  .s-line { 
     width: 2px; background: #E2E8F0; align-self: stretch; position: relative; 
     &::before { content: ''; position: absolute; top: 6px; left: -4px; width: 10px; height: 10px; border-radius: 50%; background: #CBD5E1; border: 2px solid #F1F5F9; }
  }
  
  &.active .s-line::before { background: #22C55E; border-color: #DCFCE7; box-shadow: 0 0 0 4px rgba(34,197,94,0.1); }
  &.active .s-title { color: #0F172A; font-weight: 600; }
  
  .s-content { flex: 1; display: flex; flex-direction: column; }
  .s-title { font-size: 14px; font-weight: 500; color: #334155; }
  .s-sub { font-size: 12px; color: #94A3B8; }
}

/* Recent */
.recent-list { display: flex; flex-direction: column; gap: 12px; }
.recent-item {
  display: flex; align-items: center; gap: 12px; background: white; padding: 12px; border-radius: 12px; cursor: pointer; transition: all 0.2s;
  &:hover { background: #F8FAFC; }
}
.r-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
.r-info { display: flex; flex-direction: column; }
.r-name { font-size: 14px; font-weight: 500; color: #334155; }
.r-time { font-size: 12px; color: #94A3B8; }

/* Messages */
.msg-list { display: flex; flex-direction: column; gap: 12px; }
.msg-item { display: flex; align-items: center; gap: 12px; background: white; padding: 12px; border-radius: 12px; }
.msg-dot { width: 8px; height: 8px; border-radius: 50%; &.red { background: #EF4444; } &.blue { background: #3B82F6; } }
.msg-text { flex: 1; font-size: 13px; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.msg-time { font-size: 12px; color: #94A3B8; }

/* Responsive */
@media (max-width: 900px) {
  .dashboard-grid { grid-template-columns: 1fr; }
  .action-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>