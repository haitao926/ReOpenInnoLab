<template>
  <div class="component-showcase">
    <el-container>
      <!-- 顶部导航 -->
      <el-header class="showcase-header">
        <h1>教育平台设计系统展示</h1>
        <div class="theme-controls">
          <el-radio-group v-model="currentTheme" @change="handleThemeChange" size="large">
            <el-radio-button label="light">🌞 浅色</el-radio-button>
            <el-radio-button label="dark">🌙 深色</el-radio-button>
            <el-radio-button label="auto">🔄 自动</el-radio-button>
            <el-radio-button label="high-contrast">🔳 高对比</el-radio-button>
          </el-radio-group>

          <div class="theme-info">
            <el-tag v-if="appStore.isHighContrastMode" type="warning" effect="dark">
              ♿ 高对比模式已启用
            </el-tag>
            <el-tag v-else-if="appStore.isDarkMode" type="info" effect="dark">
              🌙 深色模式
            </el-tag>
            <el-tag v-else type="success" effect="dark">
              🌞 浅色模式
            </el-tag>
          </div>
        </div>
      </el-header>

      <el-main>
        <!-- 主题颜色展示 -->
        <el-row :gutter="24" class="theme-colors-section">
          <el-col :span="24">
            <el-card class="showcase-section">
              <template #header>
                <h2>🎨 主题色彩系统</h2>
              </template>

              <!-- 主色调 -->
              <div class="color-group">
                <h3>主色调</h3>
                <div class="color-grid primary-colors">
                  <div class="color-item" v-for="(color, shade) in primaryColors" :key="shade" :style="{ backgroundColor: color }">
                    <span class="color-shade">{{ shade }}</span>
                    <span class="color-value">{{ color }}</span>
                  </div>
                </div>
              </div>

              <!-- 语义色 -->
              <div class="color-group">
                <h3>语义色</h3>
                <div class="semantic-colors">
                  <div class="semantic-group">
                    <h4>成功</h4>
                    <div class="semantic-row">
                      <div class="semantic-color success" :style="{ backgroundColor: appStore.getThemeColor('semantic.success.default') }"></div>
                      <span>default</span>
                    </div>
                    <div class="semantic-row">
                      <div class="semantic-color success-light" :style="{ backgroundColor: appStore.getThemeColor('semantic.success.light') }"></div>
                      <span>light</span>
                    </div>
                    <div class="semantic-row">
                      <div class="semantic-color success-dark" :style="{ backgroundColor: appStore.getThemeColor('semantic.success.dark') }"></div>
                      <span>dark</span>
                    </div>
                  </div>

                  <div class="semantic-group">
                    <h4>警告</h4>
                    <div class="semantic-row">
                      <div class="semantic-color warning" :style="{ backgroundColor: appStore.getThemeColor('semantic.warning.default') }"></div>
                      <span>default</span>
                    </div>
                    <div class="semantic-row">
                      <div class="semantic-color warning-light" :style="{ backgroundColor: appStore.getThemeColor('semantic.warning.light') }"></div>
                      <span>light</span>
                    </div>
                    <div class="semantic-row">
                      <div class="semantic-color warning-dark" :style="{ backgroundColor: appStore.getThemeColor('semantic.warning.dark') }"></div>
                      <span>dark</span>
                    </div>
                  </div>

                  <div class="semantic-group">
                    <h4>错误</h4>
                    <div class="semantic-row">
                      <div class="semantic-color error" :style="{ backgroundColor: appStore.getThemeColor('semantic.error.default') }"></div>
                      <span>default</span>
                    </div>
                    <div class="semantic-row">
                      <div class="semantic-color error-light" :style="{ backgroundColor: appStore.getThemeColor('semantic.error.light') }"></div>
                      <span>light</span>
                    </div>
                    <div class="semantic-row">
                      <div class="semantic-color error-dark" :style="{ backgroundColor: appStore.getThemeColor('semantic.error.dark') }"></div>
                      <span>dark</span>
                    </div>
                  </div>

                  <div class="semantic-group">
                    <h4>信息</h4>
                    <div class="semantic-row">
                      <div class="semantic-color info" :style="{ backgroundColor: appStore.getThemeColor('semantic.info.default') }"></div>
                      <span>default</span>
                    </div>
                    <div class="semantic-row">
                      <div class="semantic-color info-light" :style="{ backgroundColor: appStore.getThemeColor('semantic.info.light') }"></div>
                      <span>light</span>
                    </div>
                    <div class="semantic-row">
                      <div class="semantic-color info-dark" :style="{ backgroundColor: appStore.getThemeColor('semantic.info.dark') }"></div>
                      <span>dark</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 学科色彩 -->
              <div class="color-group">
                <h3>学科色彩</h3>
                <div class="subject-colors">
                  <div v-for="(subject, key) in subjectColors" :key="key" class="subject-item">
                    <div class="subject-colors-row">
                      <div class="subject-color" :style="{ backgroundColor: subject.color }"></div>
                      <div class="subject-color light" :style="{ backgroundColor: subject.light }"></div>
                      <div class="subject-color dark" :style="{ backgroundColor: subject.dark }"></div>
                    </div>
                    <span class="subject-name">{{ subject.name }}</span>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

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
import { ref, reactive, computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { ElMessage } from 'element-plus'
import { Document, User, Operation, Tools, ChatDotRound } from '@element-plus/icons-vue'

// Store
const appStore = useAppStore()

// 响应式数据
const currentTheme = ref(appStore.theme)
const activeMenu = ref('1')
const activeTab = ref('info')
const difficulty = ref(3)

// 计算属性
const progressColor = computed(() => appStore.getThemeColor('primary.500') || '#5B8FF9')
const isDarkMode = computed(() => appStore.isDarkMode)

const primaryColors = computed(() => {
  const colors = appStore.getCurrentThemeColors()
  const primaryColors: Record<string, string> = {}

  // 提取主色调
  Object.keys(colors).forEach(key => {
    if (key.includes('primary') && key.includes('edu-color-primary')) {
      const shade = key.replace('--edu-color-primary-', '')
      primaryColors[shade] = colors[key]
    }
  })

  return primaryColors
})

const subjectColors = computed(() => {
  return {
    math: { name: '数学', color: '#FF6B6B', light: '#FF8787', dark: '#E55555' },
    physics: { name: '物理', color: '#4ECDC4', light: '#6DD8D0', dark: '#3DBCB3' },
    chemistry: { name: '化学', color: '#45B7D1', light: '#6BC5DA', dark: '#35A5C7' },
    biology: { name: '生物', color: '#96CEB4', light: '#AAD8C2', dark: '#7ABE9F' },
    language: { name: '语文', color: '#DDA0DD', light: '#E8B8E8', dark: '#D288D2' },
    history: { name: '历史', color: '#FFB347', light: '#FFC262', dark: '#FFA32C' },
    geography: { name: '地理', color: '#87CEEB', light: '#A3D9F0', dark: '#6BC3DB' },
    english: { name: '英语', color: '#98D8C8', light: '#B5E5D8', dark: '#7BC8B8' },
    art: { name: '美术', color: '#FF69B4', light: '#FF85C4', dark: '#FF4DA4' },
    music: { name: '音乐', color: '#DDA0DD', light: '#E8B8E8', dark: '#D288D2' },
    pe: { name: '体育', color: '#FFA07A', light: '#FFB59C', dark: '#FF8B58' },
    it: { name: '信息技术', color: '#708090', light: '#8A9AAA', dark: '#566676' }
  }
})

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
const handleThemeChange = (theme: string) => {
  appStore.setTheme(theme as 'light' | 'dark' | 'auto')
  ElMessage.success(`已切换到${theme === 'light' ? '浅色' : theme === 'dark' ? '深色' : '自动'}模式`)
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
  background: var(--edu-color-gray-50);
  position: relative;
  overflow: hidden;

  // 动态背景效果
  &::before {
    content: '';
    position: fixed;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background:
      radial-gradient(circle at 20% 80%, var(--edu-color-primary-100) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, var(--edu-color-secondary-100) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, var(--edu-color-info-light) 0%, transparent 50%);
    animation: backgroundFloat 20s ease-in-out infinite;
    opacity: 0.3;
    z-index: -1;
  }

  @keyframes backgroundFloat {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    33% { transform: translate(-20px, -20px) rotate(120deg); }
    66% { transform: translate(20px, -10px) rotate(240deg); }
  }
}

.showcase-header {
  background: var(--edu-color-white);
  border-bottom: 1px solid var(--edu-border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--edu-spacing-6);
  box-shadow: var(--edu-shadow-sm);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  position: relative;
  z-index: 10;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg,
      var(--edu-color-primary-500) 0%,
      var(--edu-color-secondary-500) 25%,
      var(--edu-color-info-500) 50%,
      var(--edu-color-warning-500) 75%,
      var(--edu-color-primary-500) 100%);
    background-size: 200% 100%;
    animation: gradientShift 6s linear infinite;
  }

  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
  }

  h1 {
    margin: 0;
    font-size: var(--edu-font-size-2xl);
    font-weight: var(--edu-font-weight-bold);
    background: linear-gradient(135deg,
      var(--edu-color-primary-500) 0%,
      var(--edu-color-primary-600) 25%,
      var(--edu-color-secondary-500) 75%,
      var(--edu-color-info-500) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    background-size: 200% 200%;
    animation: textGradient 4s ease-in-out infinite;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  @keyframes textGradient {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
}

.theme-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--edu-spacing-4);

  .el-radio-group {
    background: var(--edu-color-white);
    border-radius: var(--edu-border-radius-xl);
    padding: var(--edu-spacing-2);
    box-shadow: var(--edu-shadow-md);
    border: 1px solid var(--edu-border-color-light);

    .el-radio-button {
      transition: all var(--edu-duration-normal) var(--edu-easing-smooth);

      &:hover {
        transform: translateY(-1px);
        box-shadow: var(--edu-shadow-sm);
      }
    }
  }
}

.theme-info {
  display: flex;
  gap: var(--edu-spacing-2);

  .el-tag {
    border-radius: var(--edu-border-radius-full);
    font-weight: var(--edu-font-weight-medium);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid var(--edu-border-color-light);
    transition: all var(--edu-duration-normal) var(--edu-easing-smooth);

    &:hover {
      transform: scale(1.05);
      box-shadow: var(--edu-shadow-sm);
    }
  }
}

.showcase-section {
  margin-bottom: var(--edu-spacing-6);

  .el-card {
    border-radius: var(--edu-border-radius-xl);
    border: 1px solid var(--edu-border-color-light);
    box-shadow: var(--edu-shadow-md);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    transition: all var(--edu-duration-normal) var(--edu-easing-smooth);
    overflow: hidden;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg,
        transparent 0%,
        var(--edu-color-primary-200) 50%,
        transparent 100%);
      opacity: 0;
      transition: opacity var(--edu-duration-normal) var(--edu-easing-smooth);
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--edu-shadow-lg);
      border-color: var(--edu-color-primary-200);

      &::before {
        opacity: 1;
      }
    }

    .el-card__header {
      background: linear-gradient(135deg,
        var(--edu-color-white) 0%,
        var(--edu-color-gray-50) 100%);
      border-bottom: 1px solid var(--edu-border-color-light);
      padding: var(--edu-spacing-6);

      h2 {
    margin: 0;
    font-size: var(--edu-font-size-xl);
    font-weight: var(--edu-font-weight-semibold);
    color: var(--edu-color-gray-900);
  }
}

// 主题色彩样式
.theme-colors-section {
  margin-bottom: var(--edu-spacing-8);
}

.color-group {
  margin-bottom: var(--edu-spacing-8);

  h3 {
    font-size: var(--edu-font-size-lg);
    font-weight: var(--edu-font-weight-semibold);
    color: var(--edu-color-gray-800);
    margin-bottom: var(--edu-spacing-4);
    border-bottom: 2px solid var(--edu-color-primary-100);
    padding-bottom: var(--edu-spacing-2);
  }

  h4 {
    font-size: var(--edu-font-size-base);
    font-weight: var(--edu-font-weight-medium);
    color: var(--edu-color-gray-700);
    margin-bottom: var(--edu-spacing-3);
  }
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--edu-spacing-4);
  margin-bottom: var(--edu-spacing-6);
}

.color-item {
  height: 80px;
  border-radius: var(--edu-border-radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  font-size: var(--edu-font-size-xs);
  cursor: pointer;
  transition: all var(--edu-duration-normal) var(--edu-easing-smooth);
  border: 1px solid var(--edu-border-color);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.3) 50%,
      transparent 100%);
    transition: left var(--edu-duration-slow) var(--edu-easing-smooth);
  }

  &:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: var(--edu-shadow-lg);
    border-color: var(--edu-color-primary-300);
    z-index: 10;

    &::before {
      left: 100%;
    }

    .color-shade {
      font-weight: var(--edu-font-weight-semibold);
    }

    .color-value {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .color-shade {
    font-weight: var(--edu-font-weight-medium);
    margin-bottom: 2px;
  }

  .color-value {
    font-size: 10px;
    opacity: 0.8;
    transition: all var(--edu-duration-normal) var(--edu-easing-smooth);
    transform: translateY(2px);
  }
}

.color-shade {
  font-weight: var(--edu-font-weight-semibold);
}

.color-value {
  font-size: 10px;
  opacity: 0.8;
  margin-top: 2px;
}

.semantic-colors {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--edu-spacing-6);
}

.semantic-group {
  background: var(--edu-color-white);
  padding: var(--edu-spacing-4);
  border-radius: var(--edu-border-radius-lg);
  border: 1px solid var(--edu-border-color);
  box-shadow: var(--edu-shadow-sm);
}

.semantic-row {
  display: flex;
  align-items: center;
  gap: var(--edu-spacing-3);
  margin-bottom: var(--edu-spacing-2);
}

.semantic-color {
  width: 40px;
  height: 40px;
  border-radius: var(--edu-border-radius-md);
  border: 1px solid var(--edu-border-color);
  flex-shrink: 0;
}

.subject-colors {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--edu-spacing-4);
}

.subject-item {
  text-align: center;
  background: var(--edu-color-white);
  padding: var(--edu-spacing-4);
  border-radius: var(--edu-border-radius-lg);
  border: 1px solid var(--edu-border-color);
  box-shadow: var(--edu-shadow-sm);
  transition: transform var(--edu-duration-normal) var(--edu-easing-smooth);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--edu-shadow-md);
  }
}

.subject-colors-row {
  display: flex;
  justify-content: center;
  gap: var(--edu-spacing-2);
  margin-bottom: var(--edu-spacing-3);
}

.subject-color {
  width: 30px;
  height: 30px;
  border-radius: var(--edu-border-radius-sm);
  border: 1px solid var(--edu-border-color);

  &.light {
    opacity: 0.7;
  }

  &.dark {
    opacity: 0.9;
  }
}

.subject-name {
  font-size: var(--edu-font-size-sm);
  color: var(--edu-color-gray-600);
  font-weight: var(--edu-font-weight-medium);
}

.button-showcase {
  .button-group {
    margin-bottom: var(--edu-spacing-6);

    .el-button {
      border-radius: var(--edu-border-radius-lg);
      font-weight: var(--edu-font-weight-medium);
      transition: all var(--edu-duration-normal) var(--edu-easing-smooth);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid var(--edu-border-color-light);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg,
          transparent 0%,
          rgba(255, 255, 255, 0.2) 50%,
          transparent 100%);
        transition: left var(--edu-duration-slow) var(--edu-easing-smooth);
      }

      &:hover {
        transform: translateY(-1px);
        box-shadow: var(--edu-shadow-md);

        &::before {
          left: 100%;
        }
      }

      &:active {
        transform: scale(0.98);
      }

      // 主要按钮渐变背景
      &--primary {
        background: linear-gradient(135deg,
          var(--edu-color-primary-500) 0%,
          var(--edu-color-primary-600) 100%);
        border-color: var(--edu-color-primary-500);

        &:hover {
          background: linear-gradient(135deg,
            var(--edu-color-primary-600) 0%,
            var(--edu-color-primary-700) 100%);
        }
      }

      // 成功按钮渐变背景
      &--success {
        background: linear-gradient(135deg,
          var(--edu-color-success-default) 0%,
          var(--edu-color-success-dark) 100%);
        border-color: var(--edu-color-success-default);

        &:hover {
          background: linear-gradient(135deg,
            var(--edu-color-success-dark) 0%,
            var(--edu-color-success-default) 150%);
        }
      }

      // 警告按钮渐变背景
      &--warning {
        background: linear-gradient(135deg,
          var(--edu-color-warning-default) 0%,
          var(--edu-color-warning-dark) 100%);
        border-color: var(--edu-color-warning-default);

        &:hover {
          background: linear-gradient(135deg,
            var(--edu-color-warning-dark) 0%,
            var(--edu-color-warning-default) 150%);
        }
      }

      // 危险按钮渐变背景
      &--danger {
        background: linear-gradient(135deg,
          var(--edu-color-error-default) 0%,
          var(--edu-color-error-dark) 100%);
        border-color: var(--edu-color-error-default);

        &:hover {
          background: linear-gradient(135deg,
            var(--edu-color-error-dark) 0%,
            var(--edu-color-error-default) 150%);
        }
      }

      // 信息按钮渐变背景
      &--info {
        background: linear-gradient(135deg,
          var(--edu-color-info-default) 0%,
          var(--edu-color-info-dark) 100%);
        border-color: var(--edu-color-info-default);

        &:hover {
          background: linear-gradient(135deg,
            var(--edu-color-info-dark) 0%,
            var(--edu-color-info-default) 150%);
        }
      }
    }
  }
    margin-bottom: var(--edu-spacing-6);

    h3 {
      margin-bottom: var(--edu-spacing-4);
      font-size: var(--edu-font-size-base);
      font-weight: var(--edu-font-weight-medium);
      color: var(--edu-color-gray-700);
      border-bottom: 1px solid var(--edu-border-color-light);
      padding-bottom: var(--edu-spacing-2);
    }

    .el-button {
      margin-right: var(--edu-spacing-3);
      margin-bottom: var(--edu-spacing-3);
      transition: all var(--edu-duration-normal) var(--edu-easing-smooth);

      &:hover {
        transform: translateY(-1px);
        box-shadow: var(--edu-shadow-md);
      }
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
    margin-bottom: var(--edu-spacing-4);
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: var(--edu-border-radius-xl);
    padding: var(--edu-spacing-6);
    box-shadow: var(--edu-shadow-education);
    transition: all var(--edu-duration-normal) var(--edu-easing-smooth);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.5) 50%,
        transparent 100%);
    }

    &::after {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle,
        rgba(91, 143, 249, 0.1) 0%,
        transparent 70%);
      animation: cardFloat 15s ease-in-out infinite;
      opacity: 0;
      transition: opacity var(--edu-duration-normal) var(--edu-easing-smooth);
    }

    @keyframes cardFloat {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      33% { transform: translate(10px, -10px) rotate(120deg); }
      66% { transform: translate(-10px, 5px) rotate(240deg); }
    }

    &:hover {
      transform: translateY(-4px);
      box-shadow: var(--edu-shadow-xl);
      background: rgba(255, 255, 255, 0.95);
      border-color: var(--edu-color-primary-200);

      &::after {
        opacity: 1;
      }

      h3 {
        background: linear-gradient(135deg,
          var(--edu-color-primary-600) 0%,
          var(--edu-color-primary-500) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
    }

    h3 {
      margin-bottom: var(--edu-spacing-3);
      font-size: var(--edu-font-size-lg);
      font-weight: var(--edu-font-weight-semibold);
      color: var(--edu-color-gray-800);
      transition: all var(--edu-duration-normal) var(--edu-easing-smooth);
    }

    p {
      color: var(--edu-color-gray-600);
      margin-bottom: var(--edu-spacing-4);
      line-height: 1.6;
    }

    .subject-tags {
      display: flex;
      flex-wrap: wrap;
      gap: var(--edu-spacing-2);

      .edu-subject-tag {
        margin-bottom: 0;
        border-radius: var(--edu-border-radius-full);
        padding: var(--edu-spacing-1) var(--edu-spacing-3);
        font-size: var(--edu-font-size-xs);
        font-weight: var(--edu-font-weight-medium);
        transition: all var(--edu-duration-normal) var(--edu-easing-smooth);
        border: 1px solid var(--edu-border-color-light);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);

        &:hover {
          transform: scale(1.05);
          box-shadow: var(--edu-shadow-sm);
        }

        &.math {
          background: linear-gradient(135deg, var(--edu-color-subject-math) 0%, var(--edu-color-subject-math-light) 100%);
          color: white;
        }

        &.physics {
          background: linear-gradient(135deg, var(--edu-color-subject-physics) 0%, var(--edu-color-subject-physics-light) 100%);
          color: white;
        }

        &.chemistry {
          background: linear-gradient(135deg, var(--edu-color-subject-chemistry) 0%, var(--edu-color-subject-chemistry-light) 100%);
          color: white;
        }
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
  bottom: var(--edu-spacing-8);
  right: var(--edu-spacing-8);
  z-index: var(--edu-z-index-tooltip);

  .el-button {
    width: 56px;
    height: 56px;
    border: none;
    border-radius: var(--edu-border-radius-full);
    background: linear-gradient(135deg, var(--edu-color-primary-500) 0%, var(--edu-color-primary-400) 100%);
    box-shadow: var(--edu-shadow-lg);
    transition: all var(--edu-duration-normal) var(--edu-easing-smooth);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);

    &:hover {
      transform: scale(1.1) translateY(-2px);
      box-shadow: var(--edu-shadow-xl);
      background: linear-gradient(135deg, var(--edu-color-primary-600) 0%, var(--edu-color-primary-500) 100%);
    }

    &:active {
      transform: scale(0.95);
    }
  }
}

// 高对比模式特殊样式
:global([data-theme="high-contrast"]) {
  .component-showcase {
    .showcase-header {
      h1 {
        // 高对比模式下使用纯色，避免渐变影响可读性
        background: none;
        -webkit-text-fill-color: var(--edu-color-primary-500);
        font-weight: var(--edu-font-weight-bold);
      }
    }

    .color-item {
      border: 2px solid var(--edu-border-color);
    }

    .semantic-color,
    .subject-color {
      border: 2px solid var(--edu-border-color);
    }

    .demo-card,
    .edu-card,
    .showcase-card {
      border: 2px solid var(--edu-border-color);
    }

    .el-button {
      border-width: 2px;
      font-weight: var(--edu-font-weight-semibold);
    }

    .el-input__wrapper {
      border-width: 2px;
    }

    .el-table {
      .el-table__cell {
        border-width: 2px;
      }
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
}
</style>