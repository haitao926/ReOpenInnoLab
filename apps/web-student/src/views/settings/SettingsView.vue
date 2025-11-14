<template>
  <StudentCourseLayout>
    <div class="settings-view">
      <div class="settings-header">
        <h2>系统设置</h2>
        <p>管理您的账户和偏好设置</p>
      </div>

      <div class="settings-content">
        <div class="settings-sections">
          <!-- 个人信息设置 -->
          <div class="settings-section">
            <div class="section-header">
              <h3>个人信息</h3>
              <p>管理您的基本信息</p>
            </div>
            <div class="section-content">
              <div class="info-item">
                <label>头像</label>
                <div class="avatar-upload">
                  <div class="avatar-preview">
                    <img v-if="userStore.user?.avatar" :src="userStore.user.avatar" :alt="userStore.user.name" />
                    <span v-else class="avatar-placeholder">{{ getInitials(userStore.user?.name) }}</span>
                  </div>
                  <el-button size="small" type="primary">更换头像</el-button>
                </div>
              </div>
              <div class="info-item">
                <label>姓名</label>
                <el-input v-model="formData.name" placeholder="请输入姓名" />
              </div>
              <div class="info-item">
                <label>邮箱</label>
                <el-input v-model="formData.email" placeholder="请输入邮箱" />
              </div>
              <div class="info-item">
                <label>学校</label>
                <el-input v-model="formData.school" placeholder="请输入学校名称" />
              </div>
            </div>
          </div>

          <!-- 学习偏好 -->
          <div class="settings-section">
            <div class="section-header">
              <h3>学习偏好</h3>
              <p>自定义您的学习体验</p>
            </div>
            <div class="section-content">
              <div class="setting-item">
                <div class="setting-info">
                  <h4>主题模式</h4>
                  <p>选择您喜欢的界面主题</p>
                </div>
                <el-radio-group v-model="formData.theme">
                  <el-radio label="light">浅色模式</el-radio>
                  <el-radio label="dark">深色模式</el-radio>
                  <el-radio label="auto">跟随系统</el-radio>
                </el-radio-group>
              </div>
              <div class="setting-item">
                <div class="setting-info">
                  <h4>语言设置</h4>
                  <p>选择界面显示语言</p>
                </div>
                <el-select v-model="formData.language" style="width: 200px">
                  <el-option label="简体中文" value="zh-CN" />
                  <el-option label="English" value="en-US" />
                </el-select>
              </div>
              <div class="setting-item">
                <div class="setting-info">
                  <h4>学习提醒</h4>
                  <p>接收学习进度和作业提醒</p>
                </div>
                <el-switch v-model="formData.notifications" />
              </div>
              <div class="setting-item">
                <div class="setting-info">
                  <h4>自动播放</h4>
                  <p>视频内容自动播放</p>
                </div>
                <el-switch v-model="formData.autoplay" />
              </div>
            </div>
          </div>

          <!-- 隐私与安全 -->
          <div class="settings-section">
            <div class="section-header">
              <h3>隐私与安全</h3>
              <p>管理您的隐私设置</p>
            </div>
            <div class="section-content">
              <div class="setting-item">
                <div class="setting-info">
                  <h4>个人资料可见性</h4>
                  <p>控制谁可以看到您的个人资料</p>
                </div>
                <el-select v-model="formData.profileVisibility" style="width: 200px">
                  <el-option label="所有人" value="public" />
                  <el-option label="仅同学" value="classmates" />
                  <el-option label="私密" value="private" />
                </el-select>
              </div>
              <div class="setting-item">
                <div class="setting-info">
                  <h4>学习数据分享</h4>
                  <p>允许系统使用您的学习数据改进服务</p>
                </div>
                <el-switch v-model="formData.dataSharing" />
              </div>
              <div class="setting-item">
                <div class="setting-info">
                  <h4>双因素认证</h4>
                  <p>增强账户安全性</p>
                </div>
                <el-switch v-model="formData.twoFactorAuth" />
              </div>
            </div>
          </div>

          <!-- 系统信息 -->
          <div class="settings-section">
            <div class="section-header">
              <h3>系统信息</h3>
              <p>查看系统和应用信息</p>
            </div>
            <div class="section-content">
              <div class="info-item">
                <label>应用版本</label>
                <div class="info-value">{{ appVersion }}</div>
              </div>
              <div class="info-item">
                <label>浏览器</label>
                <div class="info-value">{{ browserInfo }}</div>
              </div>
              <div class="info-item">
                <label>最后更新</label>
                <div class="info-value">{{ lastUpdate }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="settings-actions">
          <el-button @click="resetSettings">重置设置</el-button>
          <el-button type="primary" @click="saveSettings" :loading="saving">
            保存设置
          </el-button>
        </div>
      </div>
    </div>
  </StudentCourseLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import StudentCourseLayout from '@/components/layout/StudentCourseLayout.vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const saving = ref(false)
const formData = ref({
  name: '',
  email: '',
  school: '',
  theme: 'light',
  language: 'zh-CN',
  notifications: true,
  autoplay: false,
  profileVisibility: 'classmates',
  dataSharing: true,
  twoFactorAuth: false
})

const appVersion = computed(() => import.meta.env.VITE_APP_VERSION || '1.0.0')
const browserInfo = computed(() => {
  const ua = navigator.userAgent
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Safari')) return 'Safari'
  if (ua.includes('Edge')) return 'Edge'
  return 'Unknown'
})

const lastUpdate = computed(() => {
  return new Date().toLocaleDateString('zh-CN')
})

const getInitials = (name?: string): string => {
  if (!name) return 'U'
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
}

const resetSettings = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要重置所有设置吗？此操作不可撤销。',
      '重置设置',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 重置为默认值
    formData.value = {
      name: userStore.user?.name || '',
      email: userStore.user?.email || '',
      school: userStore.user?.school || '',
      theme: 'light',
      language: 'zh-CN',
      notifications: true,
      autoplay: false,
      profileVisibility: 'classmates',
      dataSharing: true,
      twoFactorAuth: false
    }

    ElMessage.success('设置已重置')
  } catch {
    // 用户取消
  }
}

const saveSettings = async () => {
  saving.value = true

  try {
    // 模拟保存设置
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 更新用户信息
    if (userStore.user) {
      userStore.user.name = formData.value.name
      userStore.user.email = formData.value.email
      userStore.user.school = formData.value.school
    }

    ElMessage.success('设置已保存')
  } catch (error) {
    ElMessage.error('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  // 初始化表单数据
  if (userStore.user) {
    formData.value.name = userStore.user.name
    formData.value.email = userStore.user.email
    formData.value.school = userStore.user.school
  }
})
</script>

<style scoped lang="scss">
.settings-view {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.settings-header {
  text-align: center;
}

.settings-header h2 {
  font-size: 28px;
  font-weight: 700;
  color: var(--edu-text-primary);
  margin: 0 0 8px 0;
}

.settings-header p {
  font-size: 16px;
  color: var(--edu-text-secondary);
  margin: 0;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.settings-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.settings-section {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  padding: 24px;
  backdrop-filter: blur(14px);
}

.section-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--edu-border-color);
}

.section-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin: 0 0 4px 0;
}

.section-header p {
  font-size: 14px;
  color: var(--edu-text-secondary);
  margin: 0;
}

.section-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 16px;

  label {
    min-width: 100px;
    font-size: 14px;
    font-weight: 500;
    color: var(--edu-text-primary);
  }

  .el-input {
    flex: 1;
    max-width: 400px;
  }
}

.avatar-upload {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.avatar-preview {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--edu-border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--edu-bg-color);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-placeholder {
    font-size: 24px;
    font-weight: 600;
    color: var(--edu-text-secondary);
  }
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid var(--edu-border-color);

  &:last-child {
    border-bottom: none;
  }
}

.setting-info h4 {
  font-size: 16px;
  font-weight: 500;
  color: var(--edu-text-primary);
  margin: 0 0 4px 0;
}

.setting-info p {
  font-size: 14px;
  color: var(--edu-text-secondary);
  margin: 0;
}

.info-value {
  color: var(--edu-text-secondary);
  font-size: 14px;
}

.settings-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(14px);
}

@media (max-width: 768px) {
  .settings-section {
    padding: 20px;
  }

  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;

    label {
      min-width: auto;
    }

    .el-input {
      max-width: 100%;
      width: 100%;
    }
  }

  .avatar-upload {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    width: 100%;
  }

  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .settings-actions {
    flex-direction: column;
  }

  .settings-actions .el-button {
    width: 100%;
  }
}
</style>