<template>
  <TeacherWorkspaceLayout
    title="系统设置"
    subtitle="个性化您的工作空间"
    :leftCollapsible="false"
    :rightCollapsible="false"
  >
    <!-- 左侧导航 -->
    <template #left>
      <div class="filter-sidebar">
        <div class="filter-section">
          <div class="filter-title">设置项</div>
          <div class="filter-menu">
            <div 
              class="filter-item" 
              :class="{ active: activeTab === 'profile' }"
              @click="activeTab = 'profile'"
            >
              <el-icon><User /></el-icon>
              <span>个人资料</span>
            </div>
            <div 
              class="filter-item" 
              :class="{ active: activeTab === 'account' }"
              @click="activeTab = 'account'"
            >
              <el-icon><Key /></el-icon>
              <span>账号安全</span>
            </div>
            <div 
              class="filter-item" 
              :class="{ active: activeTab === 'notifications' }"
              @click="activeTab = 'notifications'"
            >
              <el-icon><Bell /></el-icon>
              <span>通知偏好</span>
            </div>
            <div 
              class="filter-item" 
              :class="{ active: activeTab === 'appearance' }"
              @click="activeTab = 'appearance'"
            >
              <el-icon><Monitor /></el-icon>
              <span>外观显示</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 右侧内容 Canvas -->
    <div class="settings-canvas">
      
      <!-- 个人资料 -->
      <div v-if="activeTab === 'profile'" class="settings-panel">
         <div class="panel-header">
            <h3>个人资料</h3>
            <p>管理您的基本信息和联系方式</p>
         </div>
         
         <div class="clean-card form-card">
            <div class="avatar-section">
               <el-avatar :size="80" :src="profileForm.avatar" class="user-avatar-lg">
                  {{ profileForm.name?.charAt(0) }}
               </el-avatar>
               <div class="avatar-info">
                  <el-button type="primary" plain size="small">更换头像</el-button>
                  <span class="hint">支持 JPG, PNG 格式，最大 2MB</span>
               </div>
            </div>
            
            <div class="form-grid">
               <div class="form-group">
                  <label>姓名</label>
                  <el-input v-model="profileForm.name" placeholder="您的姓名" />
               </div>
               <div class="form-group">
                  <label>职位/头衔</label>
                  <el-input v-model="profileForm.title" placeholder="例如：高级教师" />
               </div>
               <div class="form-group full">
                  <label>个人简介</label>
                  <el-input 
                    v-model="profileForm.bio" 
                    type="textarea" 
                    :rows="3" 
                    placeholder="简短介绍一下自己..." 
                  />
               </div>
            </div>
            
            <div class="form-actions">
               <el-button type="primary" @click="saveProfile">保存更改</el-button>
            </div>
         </div>
      </div>

      <!-- 账号安全 -->
      <div v-if="activeTab === 'account'" class="settings-panel">
         <div class="panel-header">
            <h3>账号安全</h3>
            <p>保护您的账户安全，管理登录凭证</p>
         </div>
         
         <div class="clean-card form-card">
            <div class="section-block">
               <h4>修改密码</h4>
               <div class="form-grid">
                  <div class="form-group">
                     <label>当前密码</label>
                     <el-input type="password" show-password />
                  </div>
                  <div class="form-group">
                     <label>新密码</label>
                     <el-input type="password" show-password />
                  </div>
               </div>
               <div class="mt-4">
                  <el-button type="primary" plain>更新密码</el-button>
               </div>
            </div>
            
            <div class="divider"></div>
            
            <div class="section-block">
               <h4>两步验证</h4>
               <div class="flex-row">
                  <div class="text-info">
                     <p class="main-text">未开启两步验证</p>
                     <p class="sub-text">在登录时需要输入手机验证码，增加安全性</p>
                  </div>
                  <el-switch v-model="twoFactorEnabled" />
               </div>
            </div>
         </div>
      </div>

      <!-- 通知设置 -->
      <div v-if="activeTab === 'notifications'" class="settings-panel">
         <div class="panel-header">
            <h3>通知偏好</h3>
            <p>选择您希望接收的消息类型</p>
         </div>
         
         <div class="clean-card form-card">
            <div class="toggle-list">
               <div class="toggle-item">
                  <div class="toggle-info">
                     <span class="t-title">系统公告</span>
                     <span class="t-desc">平台升级、维护通知等重要信息</span>
                  </div>
                  <el-switch v-model="notifSettings.system" />
               </div>
               <div class="toggle-item">
                  <div class="toggle-info">
                     <span class="t-title">教学任务提醒</span>
                     <span class="t-desc">课程开始、作业截止提醒</span>
                  </div>
                  <el-switch v-model="notifSettings.teaching" />
               </div>
               <div class="toggle-item">
                  <div class="toggle-info">
                     <span class="t-title">学情异动预警</span>
                     <span class="t-desc">学生成绩大幅波动、缺勤提醒</span>
                  </div>
                  <el-switch v-model="notifSettings.alert" />
               </div>
            </div>
         </div>
      </div>

      <!-- 外观设置 -->
      <div v-if="activeTab === 'appearance'" class="settings-panel">
         <div class="panel-header">
            <h3>外观显示</h3>
            <p>自定义界面主题与色彩</p>
         </div>
         
         <div class="clean-card form-card">
            <div class="section-block">
               <h4>主题模式</h4>
               <div class="theme-options">
                  <div class="theme-opt light" :class="{ active: themeMode === 'light' }" @click="themeMode = 'light'">
                     <div class="preview"></div>
                     <span>浅色</span>
                  </div>
                  <div class="theme-opt dark" :class="{ active: themeMode === 'dark' }" @click="themeMode = 'dark'">
                     <div class="preview"></div>
                     <span>深色</span>
                  </div>
                  <div class="theme-opt auto" :class="{ active: themeMode === 'auto' }" @click="themeMode = 'auto'">
                     <div class="preview"></div>
                     <span>跟随系统</span>
                  </div>
               </div>
            </div>
            
            <div class="divider"></div>
            
            <div class="section-block">
               <h4>主题色</h4>
               <div class="color-picker-row">
                  <div 
                    v-for="color in themeColors" 
                    :key="color.val"
                    class="color-dot"
                    :style="{ background: color.val }"
                    :class="{ active: primaryColor === color.val }"
                    @click="primaryColor = color.val"
                  ></div>
               </div>
            </div>
         </div>
      </div>

    </div>
  </TeacherWorkspaceLayout>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Key, Bell, Monitor } from '@element-plus/icons-vue'
import TeacherWorkspaceLayout from '@/components/layout/TeacherWorkspaceLayout.vue'

// State
const activeTab = ref('profile')
const twoFactorEnabled = ref(false)
const themeMode = ref('light')
const primaryColor = ref('#6366F1')

const profileForm = reactive({
  name: '张老师',
  title: '高级教师',
  bio: '热爱教育，专注于人工智能与编程教学。',
  avatar: ''
})

const notifSettings = reactive({
  system: true,
  teaching: true,
  alert: false
})

const themeColors = [
  { val: '#6366F1' }, // Indigo
  { val: '#8B5CF6' }, // Violet
  { val: '#F97316' }, // Orange
  { val: '#10B981' }, // Green
  { val: '#3B82F6' }, // Blue
  { val: '#EC4899' }  // Pink
]

// Methods
const saveProfile = () => {
  ElMessage.success('个人资料已保存')
}

</script>

<style scoped lang="scss">
/* Reuse Global Styles */
.filter-sidebar { padding: 8px 0; display: flex; flex-direction: column; gap: 24px; }
.filter-section { display: flex; flex-direction: column; gap: 12px; }
.filter-title { font-size: 12px; font-weight: 700; color: #94A3B8; padding-left: 12px; text-transform: uppercase; }
.filter-menu { display: flex; flex-direction: column; gap: 4px; }

.filter-item {
  display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 8px; cursor: pointer; color: #475569; font-size: 14px; transition: all 0.2s;
  &:hover { background: #F1F5F9; color: #0F172A; }
  &.active { background: #E0E7FF; color: #4F46E5; font-weight: 500; }
}

/* Canvas */
.settings-canvas {
  max-width: 800px; margin: 0 auto; width: 100%; display: flex; flex-direction: column;
}

.settings-panel {
  animation: fadeIn 0.3s ease;
}

.panel-header {
  margin-bottom: 24px;
  h3 { font-size: 20px; font-weight: 700; color: #0F172A; margin: 0 0 4px 0; }
  p { color: #64748B; font-size: 14px; margin: 0; }
}

.clean-card {
  background: white; border-radius: 16px; padding: 32px; border: 1px solid #F1F5F9;
}

/* Profile Form */
.avatar-section {
  display: flex; align-items: center; gap: 24px; margin-bottom: 32px;
}
.user-avatar-lg { font-size: 24px; background: #E0E7FF; color: #4F46E5; font-weight: 700; }
.avatar-info {
  display: flex; flex-direction: column; gap: 8px; align-items: flex-start;
  .hint { font-size: 12px; color: #94A3B8; }
}

.form-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
}
.form-group {
  display: flex; flex-direction: column; gap: 8px;
  &.full { grid-column: span 2; }
  label { font-size: 14px; font-weight: 500; color: #334155; }
}

.form-actions { margin-top: 32px; display: flex; justify-content: flex-end; }

/* Security */
.divider { height: 1px; background: #F1F5F9; margin: 32px 0; }
.section-block h4 { font-size: 16px; font-weight: 600; color: #0F172A; margin: 0 0 16px 0; }
.flex-row { display: flex; justify-content: space-between; align-items: center; }
.text-info {
  .main-text { font-size: 14px; font-weight: 500; color: #334155; margin: 0; }
  .sub-text { font-size: 13px; color: #64748B; margin: 4px 0 0 0; }
}

/* Toggles */
.toggle-list { display: flex; flex-direction: column; gap: 24px; }
.toggle-item { display: flex; justify-content: space-between; align-items: center; }
.toggle-info {
  display: flex; flex-direction: column;
  .t-title { font-size: 14px; font-weight: 500; color: #334155; }
  .t-desc { font-size: 13px; color: #64748B; margin-top: 2px; }
}

/* Theme */
.theme-options { display: flex; gap: 16px; }
.theme-opt {
  flex: 1; border: 2px solid #E2E8F0; border-radius: 12px; padding: 12px; cursor: pointer; text-align: center;
  &:hover { border-color: #CBD5E1; }
  &.active { border-color: #4F46E5; background: #EEF2FF; }
  
  .preview { height: 60px; background: #F1F5F9; border-radius: 8px; margin-bottom: 8px; }
  &.dark .preview { background: #1E293B; }
  
  span { font-size: 13px; color: #475569; }
}

.color-picker-row { display: flex; gap: 12px; }
.color-dot {
  width: 32px; height: 32px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: all 0.2s;
  &:hover { transform: scale(1.1); }
  &.active { border-color: white; box-shadow: 0 0 0 2px #94A3B8; }
}

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>