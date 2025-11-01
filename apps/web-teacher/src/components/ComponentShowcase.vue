<template>
  <div class="component-showcase">
    <el-container>
      <!-- 顶部导航 -->
      <el-header class="showcase-header">
        <h1>教育平台设计系统展示</h1>
        <div class="theme-controls">
          <el-switch
            v-model="isDarkMode"
            active-text="深色模式"
            inactive-text="浅色模式"
            @change="toggleDarkMode"
          />
        </div>
      </el-header>

      <el-main>
        <el-row :gutter="24">
          <!-- 按钮展示 -->
          <el-col :span="24">
            <el-card class="showcase-section">
              <template #header>
                <h2>按钮系统</h2>
              </template>
              <div class="button-showcase">
                <div class="button-group">
                  <h3>主要按钮</h3>
                  <el-button type="primary" size="small">小按钮</el-button>
                  <el-button type="primary">默认按钮</el-button>
                  <el-button type="primary" size="large">大按钮</el-button>
                </div>

                <div class="button-group">
                  <h3>功能按钮</h3>
                  <el-button type="success">成功</el-button>
                  <el-button type="warning">警告</el-button>
                  <el-button type="danger">危险</el-button>
                  <el-button type="info">信息</el-button>
                </div>

                <div class="button-group">
                  <h3>文本按钮</h3>
                  <el-button type="primary" text>主要文字</el-button>
                  <el-button type="success" text>成功文字</el-button>
                  <el-button link>链接按钮</el-button>
                </div>

                <div class="button-group">
                  <h3>状态按钮</h3>
                  <el-button type="primary" :loading="true">加载中</el-button>
                  <el-button type="primary" disabled>禁用状态</el-button>
                  <el-button type="primary" round>圆角按钮</el-button>
                </div>
              </div>
            </el-card>
          </el-col>

          <!-- 卡片展示 -->
          <el-col :span="12">
            <el-card class="showcase-section">
              <template #header>
                <h2>基础卡片</h2>
              </template>
              <div class="card-showcase">
                <el-card class="demo-card">
                  <h3>标准卡片</h3>
                  <p>这是一个标准的卡片组件，包含标题、内容和阴影效果。</p>
                  <el-button type="primary" size="small">操作按钮</el-button>
                </el-card>

                <el-card class="demo-card">
                  <h3>带图片的卡片</h3>
                  <img src="https://via.placeholder.com/300x150/5B8FF9/FFFFFF?text=课程封面" alt="课程封面" />
                  <p>支持图片展示的课程卡片。</p>
                </el-card>
              </div>
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card class="showcase-section">
              <template #header>
                <h2>玻璃质感卡片</h2>
              </template>
              <div class="glass-card-showcase">
                <div class="edu-card">
                  <h3>教育玻璃卡片</h3>
                  <p>采用玻璃质感设计，具有现代感和科技感。</p>
                  <div class="subject-tags">
                    <span class="edu-subject-tag math">数学</span>
                    <span class="edu-subject-tag physics">物理</span>
                    <span class="edu-subject-tag chemistry">化学</span>
                  </div>
                </div>

                <div class="edu-card">
                  <h3>课程信息卡片</h3>
                  <div class="course-info">
                    <div class="info-item">
                      <span class="label">课程时长:</span>
                      <span class="value">45分钟</span>
                    </div>
                    <div class="info-item">
                      <span class="label">适合年级:</span>
                      <span class="value">八年级</span>
                    </div>
                    <div class="info-item">
                      <span class="label">难度等级:</span>
                      <el-rate v-model="difficulty" disabled show-score />
                    </div>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>

          <!-- 导航展示 -->
          <el-col :span="24">
            <el-card class="showcase-section">
              <template #header>
                <h2>导航系统</h2>
              </template>
              <div class="navigation-showcase">
                <div class="nav-demo">
                  <h3>水平导航</h3>
                  <el-menu :default-active="activeMenu" mode="horizontal" class="demo-menu">
                    <el-menu-item index="1">课程管理</el-menu-item>
                    <el-menu-item index="2">班级管理</el-menu-item>
                    <el-menu-item index="3">实验中心</el-menu-item>
                    <el-menu-item index="4">作业批改</el-menu-item>
                    <el-menu-item index="5">数据分析</el-menu-item>
                  </el-menu>
                </div>

                <div class="nav-demo">
                  <h3>侧边导航</h3>
                  <el-menu :default-active="activeMenu" class="demo-menu demo-menu-vertical">
                    <el-menu-item index="1">
                      <el-icon><Document /></el-icon>
                      <span>课程管理</span>
                    </el-menu-item>
                    <el-menu-item index="2">
                      <el-icon><User /></el-icon>
                      <span>班级管理</span>
                    </el-menu-item>
                    <el-menu-item index="3">
                      <el-icon><Operation /></el-icon>
                      <span>实验中心</span>
                    </el-menu-item>
                    <el-sub-menu index="4">
                      <template #title>
                        <el-icon><Tools /></el-icon>
                        <span>工具箱</span>
                      </template>
                      <el-menu-item index="4-1">AI助手</el-menu-item>
                      <el-menu-item index="4-2">资源库</el-menu-item>
                      <el-menu-item index="4-3">模板库</el-menu-item>
                    </el-sub-menu>
                  </el-menu>
                </div>
              </div>
            </el-card>
          </el-col>

          <!-- 表格展示 -->
          <el-col :span="24">
            <el-card class="showcase-section">
              <template #header>
                <h2>表格系统</h2>
              </template>
              <div class="table-showcase">
                <el-table :data="tableData" style="width: 100%">
                  <el-table-column prop="name" label="课程名称" width="200" />
                  <el-table-column prop="subject" label="学科" width="120">
                    <template #default="scope">
                      <span :class="`edu-subject-tag ${scope.row.subject}`">
                        {{ getSubjectName(scope.row.subject) }}
                      </span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="grade" label="年级" width="100" />
                  <el-table-column prop="duration" label="时长" width="100" />
                  <el-table-column prop="status" label="状态" width="120">
                    <template #default="scope">
                      <el-tag :type="getStatusType(scope.row.status)">
                        {{ scope.row.status }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="progress" label="进度" width="200">
                    <template #default="scope">
                      <el-progress :percentage="scope.row.progress" :color="progressColor" />
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" fixed="right" width="200">
                    <template #default="scope">
                      <el-button type="primary" size="small">编辑</el-button>
                      <el-button type="success" size="small">预览</el-button>
                      <el-button type="danger" size="small">删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-card>
          </el-col>

          <!-- 表单展示 -->
          <el-col :span="12">
            <el-card class="showcase-section">
              <template #header>
                <h2>表单组件</h2>
              </template>
              <div class="form-showcase">
                <el-form :model="formData" label-width="80px">
                  <el-form-item label="课程名称">
                    <el-input v-model="formData.name" placeholder="请输入课程名称" />
                  </el-form-item>
                  <el-form-item label="学科选择">
                    <el-select v-model="formData.subject" placeholder="请选择学科">
                      <el-option label="数学" value="math" />
                      <el-option label="物理" value="physics" />
                      <el-option label="化学" value="chemistry" />
                      <el-option label="生物" value="biology" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="难度等级">
                    <el-rate v-model="formData.difficulty" />
                  </el-form-item>
                  <el-form-item label="课程描述">
                    <el-input v-model="formData.description" type="textarea" :rows="3" />
                  </el-form-item>
                  <el-form-item label="启用状态">
                    <el-switch v-model="formData.enabled" />
                  </el-form-item>
                  <el-form-item>
                    <el-button type="primary" @click="submitForm">提交</el-button>
                    <el-button>取消</el-button>
                  </el-form-item>
                </el-form>
              </div>
            </el-card>
          </el-col>

          <!-- 标签页展示 -->
          <el-col :span="12">
            <el-card class="showcase-section">
              <template #header>
                <h2>标签页</h2>
              </template>
              <div class="tabs-showcase">
                <el-tabs v-model="activeTab">
                  <el-tab-pane label="课程信息" name="info">
                    <div class="tab-content">
                      <h3>课程基本信息</h3>
                      <p>这里展示课程的基本信息内容，包括课程简介、学习目标、适用对象等。</p>
                    </div>
                  </el-tab-pane>
                  <el-tab-pane label="课程结构" name="structure">
                    <div class="tab-content">
                      <h3>课程结构</h3>
                      <p>这里展示课程的结构信息，包括章节安排、学习路径、知识点分布等。</p>
                    </div>
                  </el-tab-pane>
                  <el-tab-pane label="学习资源" name="resources">
                    <div class="tab-content">
                      <h3>学习资源</h3>
                      <p>这里展示课程相关的学习资源，包括课件、视频、实验材料、参考书目等。</p>
                    </div>
                  </el-tab-pane>
                </el-tabs>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
    </el-container>

    <!-- 悬浮AI助手 -->
    <div class="ai-assistant-float">
      <el-button type="primary" circle size="large" @click="showAIAssistant">
        <el-icon size="20"><ChatDotRound /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, User, Operation, Tools, ChatDotRound } from '@element-plus/icons-vue'

// 响应式数据
const isDarkMode = ref(false)
const activeMenu = ref('1')
const activeTab = ref('info')
const difficulty = ref(3)
const progressColor = '#5B8FF9'

// 表单数据
const formData = reactive({
  name: '',
  subject: '',
  difficulty: 3,
  description: '',
  enabled: true
})

// 表格数据
const tableData = ref([
  {
    name: '光的折射与反射',
    subject: 'physics',
    grade: '八年级',
    duration: '45分钟',
    status: '进行中',
    progress: 65
  },
  {
    name: '化学反应原理',
    subject: 'chemistry',
    grade: '九年级',
    duration: '60分钟',
    status: '已完成',
    progress: 100
  },
  {
    name: '数学函数基础',
    subject: 'math',
    grade: '八年级',
    duration: '50分钟',
    status: '未开始',
    progress: 0
  }
])

// 方法
const toggleDarkMode = (value: boolean) => {
  if (value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  ElMessage.success(value ? '已切换到深色模式' : '已切换到浅色模式')
}

const getSubjectName = (subject: string) => {
  const subjectMap = {
    math: '数学',
    physics: '物理',
    chemistry: '化学',
    biology: '生物'
  }
  return subjectMap[subject] || subject
}

const getStatusType = (status: string) => {
  const statusMap = {
    '进行中': 'warning',
    '已完成': 'success',
    '未开始': 'info'
  }
  return statusMap[status] || 'info'
}

const submitForm = () => {
  ElMessage.success('表单提交成功')
}

const showAIAssistant = () => {
  ElMessage.info('AI助手功能开发中...')
}
</script>

<style lang="scss" scoped>
.component-showcase {
  min-height: 100vh;
  background: var(--el-bg-color-page);
}

.showcase-header {
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;

  h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

.showcase-section {
  margin-bottom: 24px;

  .el-card__header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

.button-showcase {
  .button-group {
    margin-bottom: 24px;

    h3 {
      margin-bottom: 16px;
      font-size: 16px;
      font-weight: 500;
      color: var(--el-text-color-regular);
    }

    .el-button {
      margin-right: 12px;
      margin-bottom: 12px;
    }
  }
}

.card-showcase {
  .demo-card {
    margin-bottom: 16px;

    h3 {
      margin-bottom: 12px;
      font-size: 16px;
      font-weight: 600;
    }

    img {
      width: 100%;
      height: 150px;
      object-fit: cover;
      border-radius: 8px;
      margin-bottom: 12px;
    }

    p {
      color: var(--el-text-color-regular);
      margin-bottom: 16px;
    }
  }
}

.glass-card-showcase {
  .edu-card {
    margin-bottom: 16px;

    h3 {
      margin-bottom: 12px;
      font-size: 16px;
      font-weight: 600;
    }

    p {
      color: var(--el-text-color-regular);
      margin-bottom: 16px;
    }

    .subject-tags {
      .edu-subject-tag {
        margin-bottom: 8px;
      }
    }
  }

  .course-info {
    .info-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;

      .label {
        color: var(--el-text-color-secondary);
        font-size: 14px;
      }

      .value {
        color: var(--el-text-color-primary);
        font-weight: 500;
      }
    }
  }
}

.navigation-showcase {
  .nav-demo {
    margin-bottom: 32px;

    h3 {
      margin-bottom: 16px;
      font-size: 16px;
      font-weight: 500;
    }

    .demo-menu {
      border-radius: 8px;
      border: 1px solid var(--el-border-color);
    }

    .demo-menu-vertical {
      max-width: 200px;
    }
  }
}

.table-showcase {
  .el-table {
    border-radius: 8px;
    overflow: hidden;
  }
}

.form-showcase {
  .el-form {
    max-width: 400px;
  }
}

.tabs-showcase {
  .tab-content {
    padding: 16px 0;

    h3 {
      margin-bottom: 12px;
      font-size: 16px;
      font-weight: 600;
    }

    p {
      color: var(--el-text-color-regular);
      line-height: 1.6;
    }
  }
}

.ai-assistant-float {
  position: fixed;
  bottom: 32px;
  right: 32px;
  z-index: 9999;

  .el-button {
    width: 56px;
    height: 56px;
    box-shadow: 0 4px 20px rgba(91, 143, 249, 0.4);
    border: none;
    background: var(--edu-gradient-primary);

    &:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 30px rgba(91, 143, 249, 0.6);
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .showcase-header {
    padding: 0 16px;

    h1 {
      font-size: 20px;
    }
  }

  .showcase-section {
    .el-card__body {
      padding: 16px;
    }
  }

  .button-showcase {
    .button-group {
      .el-button {
        margin-right: 8px;
        margin-bottom: 8px;
      }
    }
  }

  .ai-assistant-float {
    bottom: 16px;
    right: 16px;

    .el-button {
      width: 48px;
      height: 48px;
    }
  }
}
</style>