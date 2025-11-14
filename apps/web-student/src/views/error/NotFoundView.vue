<template>
  <div class="not-found-page">
    <div class="not-found-content">
      <div class="error-illustration">
        <div class="error-number">404</div>
        <div class="error-icon">
          <el-icon size="80"><DocumentDelete /></el-icon>
        </div>
      </div>

      <div class="error-info">
        <h1>页面不存在</h1>
        <p>抱歉，您访问的页面可能已被移除或不存在</p>

        <div class="suggestions">
          <h3>您可以尝试：</h3>
          <ul>
            <li>检查URL是否正确</li>
            <li>返回学习控制台</li>
            <li>搜索您需要的内容</li>
            <li>联系技术支持</li>
          </ul>
        </div>

        <div class="action-buttons">
          <el-button type="primary" size="large" @click="goToDashboard">
            <el-icon><House /></el-icon>
            返回学习控制台
          </el-button>

          <el-button size="large" @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            返回上一页
          </el-button>

          <el-button size="large" @click="showSearch">
            <el-icon><Search /></el-icon>
            搜索内容
          </el-button>
        </div>
      </div>
    </div>

    <!-- 搜索对话框 -->
    <el-dialog
      v-model="searchDialogVisible"
      title="搜索内容"
      width="500px"
      align-center
    >
      <el-input
        v-model="searchQuery"
        placeholder="搜索课程、作业..."
        :prefix-icon="Search"
        @keyup.enter="performSearch"
        size="large"
      />
      <template #footer>
        <el-button @click="searchDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="performSearch">搜索</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  DocumentDelete, House, ArrowLeft, Search
} from '@element-plus/icons-vue'

const router = useRouter()
const searchDialogVisible = ref(false)
const searchQuery = ref('')

const goToDashboard = () => {
  router.push('/dashboard')
}

const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    goToDashboard()
  }
}

const showSearch = () => {
  searchDialogVisible.value = true
  searchQuery.value = ''
}

const performSearch = () => {
  if (!searchQuery.value.trim()) {
    ElMessage.warning('请输入搜索内容')
    return
  }

  searchDialogVisible.value = false

  // 跳转到搜索结果页面或触发全局搜索
  ElMessage.info(`搜索: ${searchQuery.value}`)

  // 这里可以集成真实的搜索功能
  // router.push(`/search?q=${encodeURIComponent(searchQuery.value)}`)
}
</script>

<style scoped lang="scss">
.not-found-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--edu-bg-color) 0%, rgba(99, 102, 241, 0.05) 100%);
  padding: 20px;
}

.not-found-content {
  text-align: center;
  max-width: 600px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 48px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.error-illustration {
  position: relative;
  margin-bottom: 32px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-number {
  font-size: 120px;
  font-weight: 800;
  color: var(--edu-primary-200);
  position: absolute;
  z-index: 1;
  line-height: 1;
}

.error-icon {
  position: relative;
  z-index: 2;
  color: var(--edu-primary-500);
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  padding: 20px;
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.2);
}

.error-info {
  color: var(--edu-text-primary);
}

.error-info h1 {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 16px 0;
  color: var(--edu-text-primary);
}

.error-info p {
  font-size: 18px;
  color: var(--edu-text-secondary);
  margin: 0 0 32px 0;
  line-height: 1.6;
}

.suggestions {
  text-align: left;
  background: rgba(15, 23, 42, 0.04);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 32px;
}

.suggestions h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin: 0 0 16px 0;
}

.suggestions ul {
  margin: 0;
  padding-left: 20px;
}

.suggestions li {
  font-size: 14px;
  color: var(--edu-text-secondary);
  margin-bottom: 8px;
  line-height: 1.5;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.action-buttons .el-button {
  width: 200px;
  justify-content: center;
}

@media (max-width: 768px) {
  .not-found-content {
    padding: 32px 24px;
    margin: 0 16px;
  }

  .error-illustration {
    height: 160px;
    margin-bottom: 24px;
  }

  .error-number {
    font-size: 80px;
  }

  .error-info h1 {
    font-size: 24px;
  }

  .error-info p {
    font-size: 16px;
  }

  .suggestions {
    padding: 20px;
    margin-bottom: 24px;
  }

  .action-buttons {
    gap: 8px;
  }

  .action-buttons .el-button {
    width: 100%;
  }
}
</style>