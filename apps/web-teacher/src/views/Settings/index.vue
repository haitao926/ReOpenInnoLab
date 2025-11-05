<template>
  <div class="settings">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">系统设置</h1>
        <p class="page-description">管理您的个人设置和系统偏好</p>
      </div>
    </div>

    <!-- 设置内容 -->
    <el-row :gutter="24">
      <!-- 左侧设置菜单 -->
      <el-col :xs="24" :sm="6" :md="4">
        <el-card class="settings-menu">
          <el-menu
            :default-active="activeTab"
            @select="handleTabSelect"
          >
            <el-menu-item index="profile">
              <el-icon><User /></el-icon>
              个人资料
            </el-menu-item>
            <el-menu-item index="account">
              <el-icon><Key /></el-icon>
              账号安全
            </el-menu-item>
            <el-menu-item index="preferences">
              <el-icon><Setting /></el-icon>
              偏好设置
            </el-menu-item>
            <el-menu-item index="notifications">
              <el-icon><Bell /></el-icon>
              通知设置
            </el-menu-item>
            <el-menu-item index="appearance">
              <el-icon><Picture /></el-icon>
              外观主题
            </el-menu-item>
          </el-menu>
        </el-card>
      </el-col>

      <!-- 右侧设置内容 -->
      <el-col :xs="24" :sm="18" :md="20">
        <!-- 个人资料 -->
        <el-card v-if="activeTab === 'profile'" class="settings-content">
          <template #header>
            <span class="card-title">个人资料</span>
          </template>

          <el-form
            ref="profileFormRef"
            :model="profileForm"
            :rules="profileRules"
            label-width="100px"
          >
            <el-row :gutter="24">
              <el-col :span="24">
                <el-form-item label="头像">
                  <div class="avatar-upload">
                    <el-avatar :size="80" :src="profileForm.avatar">
                      <el-icon><User /></el-icon>
                    </el-avatar>
                    <div class="avatar-actions">
                      <el-button size="small" type="primary">
                        上传头像
                      </el-button>
                      <el-button size="small" type="info">
                        重置
                      </el-button>
                    </div>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="姓名" prop="name">
                  <el-input v-model="profileForm.name" placeholder="请输入姓名" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="邮箱" prop="email">
                  <el-input v-model="profileForm.email" placeholder="请输入邮箱" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="手机号" prop="phone">
                  <el-input v-model="profileForm.phone" placeholder="请输入手机号" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="部门" prop="department">
                  <el-input v-model="profileForm.department" placeholder="请输入部门" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="个人简介">
              <el-input
                v-model="profileForm.bio"
                type="textarea"
                :rows="4"
                placeholder="请输入个人简介"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :loading="saving" @click="saveProfile">
                保存修改
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 账号安全 -->
        <el-card v-else-if="activeTab === 'account'" class="settings-content">
          <template #header>
            <span class="card-title">账号安全</span>
          </template>

          <!-- 密码修改 -->
          <div class="section">
            <h3 class="section-title">修改密码</h3>
            <el-form
              ref="passwordFormRef"
              :model="passwordForm"
              :rules="passwordRules"
              label-width="120px"
            >
              <el-form-item label="当前密码" prop="currentPassword">
                <el-input
                  v-model="passwordForm.currentPassword"
                  type="password"
                  placeholder="请输入当前密码"
                  show-password
                />
              </el-form-item>
              <el-form-item label="新密码" prop="newPassword">
                <el-input
                  v-model="passwordForm.newPassword"
                  type="password"
                  placeholder="请输入新密码"
                  show-password
                />
              </el-form-item>
              <el-form-item label="确认密码" prop="confirmPassword">
                <el-input
                  v-model="passwordForm.confirmPassword"
                  type="password"
                  placeholder="请确认新密码"
                  show-password
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="saving" @click="changePassword">
                  修改密码
                </el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 登录历史 -->
          <div class="section">
            <h3 class="section-title">登录历史</h3>
            <el-table :data="loginHistory" style="width: 100%">
              <el-table-column prop="time" label="登录时间" width="180" />
              <el-table-column prop="ip" label="IP地址" width="140" />
              <el-table-column prop="device" label="设备" width="120" />
              <el-table-column prop="location" label="地点" width="120" />
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">
                    {{ row.status === 'success' ? '成功' : '失败' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>

        <!-- 偏好设置 -->
        <el-card v-else-if="activeTab === 'preferences'" class="settings-content">
          <template #header>
            <span class="card-title">偏好设置</span>
          </template>

          <div class="section">
            <h3 class="section-title">界面偏好</h3>
            <el-form :model="preferencesForm" label-width="120px">
              <el-form-item label="默认页面">
                <el-select v-model="preferencesForm.defaultPage" style="width: 200px">
                  <el-option label="控制台" value="/dashboard" />
                  <el-option label="课程管理" value="/courses" />
                  <el-option label="班级管理" value="/classrooms" />
                </el-select>
              </el-form-item>

              <el-form-item label="侧边栏">
                <el-switch
                  v-model="preferencesForm.sidebarCollapsed"
                  active-text="收起"
                  inactive-text="展开"
                />
              </el-form-item>

              <el-form-item label="语言">
                <el-select v-model="preferencesForm.language" style="width: 200px">
                  <el-option label="简体中文" value="zh-CN" />
                  <el-option label="English" value="en-US" />
                </el-select>
              </el-form-item>

              <el-form-item>
                <el-button type="primary" @click="savePreferences">
                  保存偏好
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-card>

        <!-- 通知设置 -->
        <el-card v-else-if="activeTab === 'notifications'" class="settings-content">
          <template #header>
            <span class="card-title">通知设置</span>
          </template>

          <div class="section">
            <h3 class="section-title">通知类型</h3>
            <el-form :model="notificationsForm" label-width="120px">
              <el-form-item label="系统通知">
                <el-switch
                  v-model="notificationsForm.system"
                  active-text="开启"
                  inactive-text="关闭"
                />
              </el-form-item>

              <el-form-item label="课程提醒">
                <el-switch
                  v-model="notificationsForm.course"
                  active-text="开启"
                  inactive-text="关闭"
                />
              </el-form-item>

              <el-form-item label="作业提醒">
                <el-switch
                  v-model="notificationsForm.assignment"
                  active-text="开启"
                  inactive-text="关闭"
                />
              </el-form-item>

              <el-form-item label="邮件通知">
                <el-switch
                  v-model="notificationsForm.email"
                  active-text="开启"
                  inactive-text="关闭"
                />
              </el-form-item>

              <el-form-item>
                <el-button type="primary" @click="saveNotifications">
                  保存设置
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-card>

        <!-- 外观主题 -->
        <el-card v-else-if="activeTab === 'appearance'" class="settings-content">
          <template #header>
            <span class="card-title">外观主题</span>
          </template>

          <div class="section">
            <h3 class="section-title">主题设置</h3>
            <el-form :model="appearanceForm" label-width="120px">
              <el-form-item label="主题模式">
                <el-radio-group v-model="appearanceForm.theme" @change="changeTheme">
                  <el-radio-button label="light">浅色模式</el-radio-button>
                  <el-radio-button label="dark">深色模式</el-radio-button>
                  <el-radio-button label="auto">跟随系统</el-radio-button>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="主题色">
                <div class="color-options">
                  <div
                    v-for="color in themeColors"
                    :key="color.value"
                    class="color-option"
                    :class="{ active: appearanceForm.primaryColor === color.value }"
                    @click="changePrimaryColor(color.value)"
                  >
                    <div class="color-preview" :style="{ backgroundColor: color.value }"></div>
                    <span class="color-name">{{ color.name }}</span>
                  </div>
                </div>
              </el-form-item>

              <el-form-item>
                <el-button type="primary" @click="saveAppearance">
                  保存主题
                </el-button>
                <el-button @click="resetTheme">
                  重置为默认
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'

const userStore = useUserStore()
const appStore = useAppStore()

// 响应数据
const activeTab = ref('profile')
const saving = ref(false)
const profileFormRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()

// 个人资料表单
const profileForm = reactive({
  name: '',
  email: '',
  phone: '',
  department: '',
  bio: '',
  avatar: ''
})

// 密码表单
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 偏好设置表单
const preferencesForm = reactive({
  defaultPage: '/dashboard',
  sidebarCollapsed: false,
  language: 'zh-CN'
})

// 通知设置表单
const notificationsForm = reactive({
  system: true,
  course: true,
  assignment: true,
  email: true
})

// 外观设置表单
const appearanceForm = reactive({
  theme: 'light',
  primaryColor: '#5B8FF9'
})

// 主题颜色选项
const themeColors = [
  { name: '科技蓝', value: '#5B8FF9' },
  { name: '活力橙', value: '#FA8C16' },
  { name: '成功绿', value: '#52C41A' },
  { name: '警告黄', value: '#FAAD14' },
  { name: '玫瑰红', value: '#F5222D' },
  { name: '深紫色', value: '#722ED1' }
]

// 登录历史数据
const loginHistory = ref([
  {
    time: '2024-01-15 10:30:00',
    ip: '192.168.1.100',
    device: 'Chrome',
    location: '北京',
    status: 'success'
  },
  {
    time: '2024-01-14 15:45:00',
    ip: '192.168.1.101',
    device: 'Safari',
    location: '上海',
    status: 'success'
  },
  {
    time: '2024-01-13 09:20:00',
    ip: '192.168.1.102',
    device: 'Firefox',
    location: '广州',
    status: 'failed'
  }
])

// 表单验证规则
const profileRules: FormRules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号', trigger: 'blur' }
  ]
}

const passwordRules: FormRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 方法
const handleTabSelect = (key: string) => {
  activeTab.value = key
}

const saveProfile = async () => {
  if (!profileFormRef.value) return

  try {
    await profileFormRef.value.validate()
    saving.value = true

    // 调用更新用户信息接口
    await userStore.updateUserInfo(profileForm)
    ElMessage.success('个人资料更新成功')
  } catch (error: any) {
    console.error('更新个人资料失败:', error)
    ElMessage.error('更新失败，请重试')
  } finally {
    saving.value = false
  }
}

const changePassword = async () => {
  if (!passwordFormRef.value) return

  try {
    await passwordFormRef.value.validate()
    saving.value = true

    // 调用修改密码接口
    await userStore.changePassword(
      passwordForm.currentPassword,
      passwordForm.newPassword
    )

    ElMessage.success('密码修改成功')
    resetPasswordForm()
  } catch (error: any) {
    console.error('修改密码失败:', error)
    ElMessage.error('修改失败，请检查当前密码是否正确')
  } finally {
    saving.value = false
  }
}

const resetPasswordForm = () => {
  Object.assign(passwordForm, {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  if (passwordFormRef.value) {
    passwordFormRef.value.clearValidate()
  }
}

const savePreferences = async () => {
  try {
    // 保存到本地存储
    localStorage.setItem('user_preferences', JSON.stringify(preferencesForm))
    ElMessage.success('偏好设置已保存')
  } catch (error) {
    console.error('保存偏好设置失败:', error)
    ElMessage.error('保存失败，请重试')
  }
}

const saveNotifications = async () => {
  try {
    // 保存到本地存储
    localStorage.setItem('notification_settings', JSON.stringify(notificationsForm))
    ElMessage.success('通知设置已保存')
  } catch (error) {
    console.error('保存通知设置失败:', error)
    ElMessage.error('保存失败，请重试')
  }
}

const changeTheme = (theme: string) => {
  appearanceForm.theme = theme
  appStore.setTheme(theme as 'light' | 'dark' | 'auto')
}

const changePrimaryColor = (color: string) => {
  appearanceForm.primaryColor = color
  // 更新CSS变量
  document.documentElement.style.setProperty('--color-primary-500', color)
}

const saveAppearance = async () => {
  try {
    // 保存到本地存储
    localStorage.setItem('appearance_settings', JSON.stringify(appearanceForm))
    ElMessage.success('主题设置已保存')
  } catch (error) {
    console.error('保存主题设置失败:', error)
    ElMessage.error('保存失败，请重试')
  }
}

const resetTheme = () => {
  appearanceForm.theme = 'light'
  appearanceForm.primaryColor = '#5B8FF9'
  changeTheme('light')
  changePrimaryColor('#5B8FF9')
  saveAppearance()
}

// 生命周期
onMounted(async () => {
  try {
    // 加载用户信息
    if (userStore.user) {
      Object.assign(profileForm, {
        name: userStore.user.name,
        email: userStore.user.email,
        phone: userStore.user.profile?.phone || '',
        department: userStore.user.profile?.department || '',
        bio: userStore.user.profile?.bio || '',
        avatar: userStore.user.avatar || ''
      })
    }

    // 加载本地设置
    const savedPreferences = localStorage.getItem('user_preferences')
    if (savedPreferences) {
      Object.assign(preferencesForm, JSON.parse(savedPreferences))
    }

    const savedNotifications = localStorage.getItem('notification_settings')
    if (savedNotifications) {
      Object.assign(notificationsForm, JSON.parse(savedNotifications))
    }

    const savedAppearance = localStorage.getItem('appearance_settings')
    if (savedAppearance) {
      Object.assign(appearanceForm, JSON.parse(savedAppearance))
      changeTheme(appearanceForm.theme)
      changePrimaryColor(appearanceForm.primaryColor)
    }
  } catch (error) {
    console.error('加载设置失败:', error)
  }
})
</script>

<style lang="scss" scoped>
.settings {
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;

  .header-left {
    .page-title {
      font-size: 28px;
      font-weight: 600;
      color: var(--edu-text-primary);
      margin: 0 0 8px 0;
    }

    .page-description {
      font-size: 16px;
      color: var(--edu-text-secondary);
      margin: 0;
    }
  }
}

.settings-menu {
  .el-menu {
    border: none;

    .el-menu-item {
      height: 48px;
      line-height: 48px;
      margin-bottom: 4px;
      border-radius: 8px;
      transition: all 0.3s ease;

      &:hover,
      &.is-active {
        background: var(--color-primary-50);
        color: var(--color-primary-600);
      }
    }
  }
}

.settings-content {
  .card-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--edu-text-primary);
  }

  .section {
    margin-bottom: 32px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--edu-text-primary);
    margin: 0 0 16px 0;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--edu-border-color-light);
  }

  .avatar-upload {
    display: flex;
    align-items: center;
    gap: 16px;

    .avatar-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
  }

  .color-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 12px;
    margin-bottom: 24px;

    .color-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 12px;
      border: 2px solid var(--edu-border-color);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        border-color: var(--edu-border-color-dark);
      }

      &.active {
        border-color: var(--color-primary-500);
      }

      .color-preview {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2px solid var(--edu-border-color);
      }

      .color-name {
        font-size: 12px;
        color: var(--edu-text-secondary);
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .settings {
    padding: 16px;
  }

  .page-header {
    margin-bottom: 16px;
  }

  .settings-menu {
    margin-bottom: 16px;
  }
}

// 深色模式适配
[data-theme="dark"] {
  .settings-content {
    background: var(--color-gray-800);
    border-color: var(--edu-border-color);
  }

  .card-title,
  .section-title {
    color: var(--edu-text-primary);
  }
}
</style>