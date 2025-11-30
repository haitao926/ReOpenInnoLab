<template>
  <div class="page-based-wizard">
    <!-- 顶部进度条 -->
    <div class="wizard-header">
      <div class="wizard-steps">
        <div
          v-for="(step, index) in steps"
          :key="step.key"
          class="step-item"
          :class="{
            active: currentStep === index,
            completed: currentStep > index
          }"
          @click="canNavigate(index) && (currentStep = index)"
        >
          <div class="step-indicator">
            <el-icon v-if="currentStep > index"><Check /></el-icon>
            <span v-else>{{ index + 1 }}</span>
          </div>
          <span class="step-label">{{ step.label }}</span>
          <div v-if="index < steps.length - 1" class="step-line"></div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="wizard-content">
      <transition name="fade-slide" mode="out-in">
        <!-- 步骤 1: 基本信息 -->
        <div v-if="currentStep === 0" key="step1" class="step-panel">
          <div class="panel-header">
            <h2>课程基本信息</h2>
            <p>设置课程的名称、学科和适用年级</p>
          </div>
          <el-form :model="courseData" label-position="top" class="wizard-form">
            <el-form-item label="课程名称">
              <el-input
                v-model="courseData.title"
                placeholder="例如：AI 视觉识别入门"
                size="large"
              />
            </el-form-item>
            <div class="form-row">
              <el-form-item label="学科">
                <el-select v-model="courseData.subject" placeholder="选择学科" size="large">
                  <el-option label="人工智能" value="ai" />
                  <el-option label="编程" value="coding" />
                  <el-option label="机器人" value="robotics" />
                </el-select>
              </el-form-item>
              <el-form-item label="年级">
                <el-select v-model="courseData.grade" placeholder="选择年级" size="large">
                  <el-option label="高一" value="10" />
                  <el-option label="高二" value="11" />
                  <el-option label="高三" value="12" />
                </el-select>
              </el-form-item>
            </div>
            <el-form-item label="课程简介">
              <el-input
                v-model="courseData.description"
                type="textarea"
                :rows="4"
                placeholder="简要描述课程的学习目标和内容..."
              />
            </el-form-item>
          </el-form>
        </div>

        <!-- 步骤 2: 选择模板 -->
        <div v-else-if="currentStep === 1" key="step2" class="step-panel">
          <div class="panel-header">
            <h2>选择课程模板</h2>
            <p>从预设模板开始，或创建一个空白课程</p>
          </div>
          <div class="template-grid">
            <div
              v-for="tpl in templates"
              :key="tpl.id"
              class="template-card"
              :class="{ selected: selectedTemplate === tpl.id }"
              @click="selectedTemplate = tpl.id"
            >
              <div class="template-icon" :style="{ background: tpl.color }">
                <el-icon><component :is="tpl.icon" /></el-icon>
              </div>
              <h3>{{ tpl.name }}</h3>
              <p>{{ tpl.desc }}</p>
              <div class="selection-indicator" v-if="selectedTemplate === tpl.id">
                <el-icon><Check /></el-icon>
              </div>
            </div>
          </div>
        </div>

        <!-- 步骤 3: 内容编辑 (占位) -->
        <div v-else-if="currentStep === 2" key="step3" class="step-panel">
          <div class="panel-header">
            <h2>规划课程内容</h2>
            <p>添加章节、实验和互动活动</p>
          </div>
          <div class="placeholder-editor">
            <el-empty description="课程编辑器加载中..." />
          </div>
        </div>
      </transition>
    </div>

    <!-- 底部操作栏 -->
    <div class="wizard-footer">
      <el-button v-if="currentStep > 0" @click="currentStep--">上一步</el-button>
      <el-button type="primary" @click="handleNext">
        {{ currentStep === steps.length - 1 ? '完成创建' : '下一步' }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive } from 'vue'
  import { Check, VideoPlay, Grid, Edit } from '@element-plus/icons-vue'
  import { ElMessage } from 'element-plus'

  const emit = defineEmits(['close', 'complete'])

  const currentStep = ref(0)
  const selectedTemplate = ref('')

  const steps = [
    { key: 'basic', label: '基本信息' },
    { key: 'template', label: '选择模板' },
    { key: 'content', label: '内容规划' },
    { key: 'preview', label: '预览发布' }
  ]

  const courseData = reactive({
    title: '',
    subject: '',
    grade: '',
    description: ''
  })

  const templates = [
    { id: 'blank', name: '空白课程', desc: '从零开始设计课程结构', icon: 'Edit', color: '#e2e8f0' },
    {
      id: 'ai-intro',
      name: 'AI 导论',
      desc: '包含基础概念和体验活动的标准结构',
      icon: 'Grid',
      color: '#dbeafe'
    },
    {
      id: 'project',
      name: '项目制学习',
      desc: '以项目为核心的PBL课程模板',
      icon: 'VideoPlay',
      color: '#fce7f3'
    }
  ]

  const canNavigate = (index: number) => {
    return index < currentStep
  }

  const handleNext = () => {
    if (currentStep.value < steps.length - 1) {
      currentStep.value++
    } else {
      ElMessage.success('课程创建成功！')
      emit('complete')
    }
  }
</script>

<style scoped lang="scss">
  .page-based-wizard {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: white;
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .wizard-header {
    padding: 24px;
    border-bottom: 1px solid var(--border-color);
  }

  .wizard-steps {
    display: flex;
    justify-content: center;
    gap: 16px;
  }

  .step-item {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    opacity: 0.6;
    transition: all 0.3s;

    &.active {
      opacity: 1;
      font-weight: 600;
      color: var(--brand-primary);

      .step-indicator {
        background: var(--brand-primary);
        color: white;
        border-color: var(--brand-primary);
      }
    }

    &.completed {
      opacity: 1;
      color: var(--success-color);

      .step-indicator {
        background: var(--success-color);
        color: white;
        border-color: var(--success-color);
      }
    }
  }

  .step-indicator {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }

  .step-line {
    width: 40px;
    height: 2px;
    background: var(--border-color);
    margin-left: 8px;
  }

  .wizard-content {
    flex: 1;
    padding: 40px;
    overflow-y: auto;
    display: flex;
    justify-content: center;
  }

  .step-panel {
    width: 100%;
    max-width: 800px;
  }

  .panel-header {
    text-align: center;
    margin-bottom: 40px;

    h2 {
      font-size: 24px;
      margin-bottom: 8px;
    }

    p {
      color: var(--text-secondary);
    }
  }

  .wizard-form {
    background: var(--bg-secondary);
    padding: 32px;
    border-radius: var(--radius-lg);
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }

  .template-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 24px;
  }

  .template-card {
    border: 2px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: 24px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    text-align: center;

    &:hover {
      border-color: var(--brand-primary);
      transform: translateY(-2px);
    }

    &.selected {
      border-color: var(--brand-primary);
      background: var(--brand-primary-light);
    }
  }

  .template-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    font-size: 24px;
  }

  .selection-indicator {
    position: absolute;
    top: 12px;
    right: 12px;
    color: var(--brand-primary);
  }

  .wizard-footer {
    padding: 24px;
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: flex-end;
    gap: 16px;
  }

  .fade-slide-enter-active,
  .fade-slide-leave-active {
    transition: all 0.3s ease;
  }

  .fade-slide-enter-from {
    opacity: 0;
    transform: translateX(20px);
  }

  .fade-slide-leave-to {
    opacity: 0;
    transform: translateX(-20px);
  }
</style>
