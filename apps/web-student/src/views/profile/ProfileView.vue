<template>
  <StudentCourseLayout>
    <div class="profile-view">
      <div class="profile-header">
        <div class="profile-avatar">
          <div class="avatar-circle">
            <img v-if="userStore.user?.avatar" :src="userStore.user.avatar" :alt="userStore.user.name" />
            <span v-else class="avatar-text">{{ getInitials(userStore.user?.name) }}</span>
          </div>
        </div>
        <div class="profile-info">
          <h2>{{ userStore.user?.name }}</h2>
          <p>{{ userStore.user?.email }}</p>
          <div class="profile-meta">
            <span class="meta-item">
              <el-icon><School /></el-icon>
              {{ userStore.user?.school }}
            </span>
            <span class="meta-item" v-if="userStore.user?.grade">
              <el-icon><Notebook /></el-icon>
              {{ userStore.user?.grade }}{{ userStore.user?.class ? ` ${userStore.user.class}` : '' }}
            </span>
            <span class="meta-item" v-if="userStore.user?.studentId">
              <el-icon><User /></el-icon>
              学号：{{ userStore.user?.studentId }}
            </span>
          </div>
        </div>
        <div class="profile-actions">
          <el-button @click="editProfile">
            <el-icon><Edit /></el-icon>
            编辑资料
          </el-button>
        </div>
      </div>

      <div class="profile-content">
        <div class="stats-section">
          <h3>学习统计</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">
                <el-icon><Reading /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ userStats.totalCourses }}</div>
                <div class="stat-label">总课程数</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <el-icon><Check /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ userStats.completedCourses }}</div>
                <div class="stat-label">已完成课程</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <el-icon><Clock /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ userStats.totalHours }}h</div>
                <div class="stat-label">学习时长</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ userStats.averageScore }}分</div>
                <div class="stat-label">平均成绩</div>
              </div>
            </div>
          </div>
        </div>

        <div class="achievements-section">
          <h3>成就徽章</h3>
          <div class="achievements-grid">
            <div class="achievement-card earned">
              <div class="achievement-icon">🏆</div>
              <div class="achievement-info">
                <h4>初学者</h4>
                <p>完成第一个课程</p>
              </div>
            </div>
            <div class="achievement-card earned">
              <div class="achievement-icon">⭐</div>
              <div class="achievement-info">
                <h4>连续学习</h4>
                <p>连续7天登录学习</p>
              </div>
            </div>
            <div class="achievement-card">
              <div class="achievement-icon">🚀</div>
              <div class="achievement-info">
                <h4>实验达人</h4>
                <p>完成10个实验</p>
              </div>
            </div>
            <div class="achievement-card">
              <div class="achievement-icon">💡</div>
              <div class="achievement-info">
                <h4>创新思维</h4>
                <p>提出5个创意方案</p>
              </div>
            </div>
          </div>
        </div>

        <div class="recent-activity">
          <h3>最近活动</h3>
          <div class="activity-list">
            <div class="activity-item">
              <div class="activity-icon">
                <el-icon><Document /></el-icon>
              </div>
              <div class="activity-content">
                <div class="activity-title">完成了作业：Python变量练习</div>
                <div class="activity-time">2小时前</div>
              </div>
              <div class="activity-score">85分</div>
            </div>
            <div class="activity-item">
              <div class="activity-icon">
                <el-icon><Monitor /></el-icon>
              </div>
              <div class="activity-content">
                <div class="activity-title">完成了实验：数据分析基础</div>
                <div class="activity-time">昨天</div>
              </div>
              <div class="activity-score">92分</div>
            </div>
            <div class="activity-item">
              <div class="activity-icon">
                <el-icon><Reading /></el-icon>
              </div>
              <div class="activity-content">
                <div class="activity-title">学习了课程：AI创意编程</div>
                <div class="activity-time">2天前</div>
              </div>
              <div class="activity-progress">已完成80%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </StudentCourseLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  School,
  Notebook,
  User,
  Edit,
  Reading,
  Check,
  Clock,
  TrendCharts,
  Document,
  Monitor
} from '@element-plus/icons-vue'
import StudentCourseLayout from '@/components/layout/StudentCourseLayout.vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const userStats = ref({
  totalCourses: 8,
  completedCourses: 5,
  totalHours: 24,
  averageScore: 87
})

const getInitials = (name?: string): string => {
  if (!name) return 'U'
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
}

const editProfile = () => {
  // TODO: 实现编辑个人资料功能
  console.log('编辑个人资料')
}
</script>

<style scoped lang="scss">
.profile-view {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.profile-header {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  padding: 32px;
  backdrop-filter: blur(14px);
  display: flex;
  align-items: center;
  gap: 24px;
}

.profile-avatar {
  flex-shrink: 0;
}

.avatar-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--edu-primary-500), var(--edu-primary-600));
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 3px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-text {
    color: white;
    font-size: 24px;
    font-weight: 600;
  }
}

.profile-info {
  flex: 1;
}

.profile-info h2 {
  font-size: 24px;
  font-weight: 700;
  color: var(--edu-text-primary);
  margin: 0 0 4px 0;
}

.profile-info p {
  font-size: 16px;
  color: var(--edu-text-secondary);
  margin: 0 0 16px 0;
}

.profile-meta {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--edu-text-secondary);

  .el-icon {
    color: var(--edu-primary-500);
  }
}

.profile-actions {
  flex-shrink: 0;
}

.profile-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
}

.stats-section,
.achievements-section,
.recent-activity {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  padding: 24px;
  backdrop-filter: blur(14px);
}

.stats-section h3,
.achievements-section h3,
.recent-activity h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin: 0 0 20px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--edu-bg-color);
  border-radius: 12px;
  border: 1px solid var(--edu-border-color);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--edu-primary-500), var(--edu-primary-600));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: var(--edu-text-primary);
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: var(--edu-text-secondary);
  margin-top: 4px;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.achievement-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--edu-bg-color);
  border-radius: 12px;
  border: 1px solid var(--edu-border-color);
  opacity: 0.6;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &.earned {
    opacity: 1;
    border-color: var(--edu-primary-200);
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(99, 102, 241, 0.1));
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.achievement-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.achievement-info h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin: 0 0 4px 0;
}

.achievement-info p {
  font-size: 14px;
  color: var(--edu-text-secondary);
  margin: 0;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--edu-bg-color);
  border-radius: 12px;
  border: 1px solid var(--edu-border-color);
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--edu-primary-500), var(--edu-primary-600));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--edu-text-primary);
  margin-bottom: 4px;
}

.activity-time {
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.activity-score,
.activity-progress {
  font-size: 14px;
  font-weight: 600;
  color: var(--edu-primary-600);
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }

  .profile-meta {
    justify-content: center;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .achievements-grid {
    grid-template-columns: 1fr;
  }

  .activity-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .activity-score,
  .activity-progress {
    align-self: flex-end;
  }
}
</style>