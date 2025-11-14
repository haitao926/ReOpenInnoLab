<template>
  <TeacherWorkspaceLayout
    title="课程编辑器"
    subtitle="创建和编辑课程内容，五环节AI赋能教学设计"
    v-model:leftCollapsed="leftSidebarCollapsed"
    v-model:rightCollapsed="rightSidebarCollapsed"
  >
    <template #header-controls>
      <div class="editor-actions">
        <el-button @click="saveVersion" :loading="courseStore.loading">
          <el-icon><Document /></el-icon>
          保存版本
        </el-button>
        <el-button
          type="primary"
          @click="publishCourse"
          :loading="courseStore.loading"
          :disabled="!courseStore.isDraftMode"
        >
          <el-icon><Upload /></el-icon>
          发布课程
        </el-button>
        <el-button @click="previewCourse">
          <el-icon><View /></el-icon>
          预览
        </el-button>
        <el-dropdown @command="handleMoreAction">
          <el-button>
            更多<el-icon><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="version">版本管理</el-dropdown-item>
              <el-dropdown-item command="export">导出ACL</el-dropdown-item>
              <el-dropdown-item command="validate">验证课程</el-dropdown-item>
              <el-dropdown-item command="settings">课程设置</el-dropdown-item>
              <el-dropdown-item command="help" divided>使用帮助</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </template>

    <template #summary>
      <EduCard
        v-for="card in summaryCards"
        :key="card.id"
        class="summary-card"
        variant="glass"
        size="sm"
        :hoverable="true"
        body-class="summary-card__body"
      >
        <div class="summary-card__content">
          <span class="summary-card__icon" :style="{ background: card.gradient }">
            <el-icon><component :is="card.icon" /></el-icon>
          </span>
          <div class="summary-card__text">
            <span class="summary-card__value">{{ card.value }}</span>
            <span class="summary-card__label">{{ card.label }}</span>
          </div>
        </div>
      </EduCard>
    </template>

    <template #left>
      <div class="sidebar-section">
        <div class="section-header">
          <h4 class="section-title">五环节结构</h4>
          <el-button size="small" @click="resetToDefaultModules">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </div>

        <div class="modules-tree">
          <div
            v-for="(module, key) in courseStore.editor?.fiveModules"
            :key="key"
            class="module-item"
            :class="{
              'is-current': selectedModuleKey === key,
              'is-active': isModuleActive(key)
            }"
            @click="selectModule(key)"
          >
            <div class="module-header">
              <div class="module-info">
                <el-icon :color="getModuleTypeColor(module.type)">
                  <component :is="getModuleIcon(module.type)" />
                </el-icon>
                <span class="module-title">{{ module.title }}</span>
              </div>
              <div class="module-meta">
                <el-tag size="small" :type="getModuleTagType(module.type)">
                  {{ getModuleDuration(module.duration) }}
                </el-tag>
              </div>
            </div>

            <div class="module-stats">
              <span class="stat-item">
                <el-icon size="12"><Target /></el-icon>
                {{ module.objectives.length }}目标
              </span>
              <span class="stat-item">
                <el-icon size="12"><Folder /></el-icon>
                {{ module.resources.length }}资源
              </span>
            </div>
          </div>
        </div>

        <div class="sidebar-section">
          <h4 class="section-title">课程信息</h4>
          <div class="course-info">
            <div class="info-item">
              <span class="label">状态:</span>
              <el-tag
                :type="courseStore.currentCourse?.status === 'PUBLISHED' ? 'success' : 'warning'"
                size="small"
              >
                {{ getStatusText(courseStore.currentCourse?.status) }}
              </el-tag>
            </div>
            <div class="info-item">
              <span class="label">版本:</span>
              <span class="value">{{ courseStore.editor?.version.current || '1.0.0' }}</span>
            </div>
            <div class="info-item">
              <span class="label">总时长:</span>
              <span class="value">{{ totalDuration }}分钟</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #main>
      <div v-if="!selectedModuleKey" class="welcome-screen">
        <div class="welcome-content">
          <div class="welcome-icon">
            <el-icon size="64" color="#409EFF"><EditPen /></el-icon>
          </div>
          <h2>欢迎使用五环节课程编辑器</h2>
          <p>选择左侧的环节开始编辑课程内容，或使用AI智能生成</p>
          <div class="welcome-actions">
            <el-button type="primary" @click="generateWithAI">
              <el-icon><MagicStick /></el-icon>
              AI智能生成
            </el-button>
            <el-button @click="loadTemplate">
              <el-icon><Grid /></el-icon>
              使用模板
            </el-button>
          </div>
        </div>
      </div>

      <div v-else class="module-editor">
        <div class="editor-header">
          <div class="editor-title">
            <el-icon :color="getModuleTypeColor(getCurrentModule()?.type)">
              <component :is="getModuleIcon(getCurrentModule()?.type)" />
            </el-icon>
            <span>{{ getCurrentModule()?.title }}</span>
            <el-tag :type="getModuleTagType(getCurrentModule()?.type)" size="small">
              {{ getModuleTypeLabel(getCurrentModule()?.type) }}
            </el-tag>
          </div>

          <div class="editor-actions">
            <el-button size="small" @click="aiGenerateModule">
              <el-icon><MagicStick /></el-icon>
              AI生成
            </el-button>
            <el-button size="small" @click="saveModuleChanges">
              <el-icon><Check /></el-icon>
              保存
            </el-button>
          </div>
        </div>

        <div class="editor-content">
          <el-tabs v-model="activeEditorTab" type="card">
            <el-tab-pane label="基本设置" name="basic">
              <div class="module-settings">
                <el-form :model="getCurrentModule()" label-width="100px">
                  <el-form-item label="环节标题">
                    <el-input v-model="getCurrentModule().title" @input="updateModuleBasicInfo" />
                  </el-form-item>
                  <el-form-item label="时长(分钟)">
                    <el-input-number v-model="getCurrentModule().duration" @change="updateModuleBasicInfo" />
                  </el-form-item>
                  <el-form-item label="学习目标">
                    <el-input
                      type="textarea"
                      :model-value="getCurrentModule().objectives.join('\n')"
                      @input="handleObjectivesChange"
                      :rows="4"
                      placeholder="每行一个学习目标"
                    />
                  </el-form-item>
                </el-form>
              </div>
            </el-tab-pane>

            <el-tab-pane label="内容编辑" name="content">
              <div class="content-editor">
                <el-input
                  type="textarea"
                  v-model="moduleContent"
                  :rows="12"
                  placeholder="编辑环节内容..."
                  @input="handleContentChange"
                />
                <div class="content-tools">
                  <el-button size="small" @click="formatContent">格式化</el-button>
                  <el-button size="small" @click="previewContent">预览</el-button>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="资源配置" name="resources">
              <div class="resources-panel">
                <div class="resources-header">
                  <el-button type="primary" size="small" @click="addResource">
                    <el-icon><Plus /></el-icon>
                    添加资源
                  </el-button>
                </div>
                <div class="resources-list">
                  <div
                    v-for="resource in getCurrentModule().resources"
                    :key="resource.id"
                    class="resource-item"
                  >
                    <el-icon><Document /></el-icon>
                    <span>{{ resource.title }}</span>
                    <el-button type="danger" size="small" text @click="removeResource(resource.id)">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                  <div v-if="getCurrentModule().resources.length === 0" class="empty-resources">
                    暂无资源
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="AI配置" name="ai">
              <div class="ai-settings">
                <el-form label-width="100px">
                  <el-form-item label="AI提示词">
                    <el-input
                      type="textarea"
                      :model-value="getCurrentModule().aiHints.join('\n')"
                      @input="handleAIHintsChange"
                      :rows="4"
                      placeholder="每行一个AI提示词"
                    />
                  </el-form-item>
                  <el-form-item label="课堂活动">
                    <el-input
                      type="textarea"
                      :model-value="getCurrentModule().classroomActions.join('\n')"
                      @input="handleClassroomActionsChange"
                      :rows="4"
                      placeholder="每行一个课堂活动建议"
                    />
                  </el-form-item>
                </el-form>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </template>

    <template #right>
      <div class="sidebar-section">
        <h4 class="section-title">AI助手</h4>
        <div class="ai-assistant">
          <el-button type="primary" size="small" @click="generateModuleContent">
            <el-icon><MagicStick /></el-icon>
            生成内容
          </el-button>
          <el-button size="small" @click="generateObjectives">
            <el-icon><Target /></el-icon>
            生成目标
          </el-button>
          <el-button size="small" @click="generateResources">
            <el-icon><Folder /></el-icon>
            推荐资源
          </el-button>
        </div>
      </div>

      <div class="sidebar-section">
        <h4 class="section-title">快速预览</h4>
        <div class="quick-preview">
          <div class="preview-card" v-if="getCurrentModule()">
            <h5>{{ getCurrentModule()?.title }}</h5>
            <div class="preview-meta">
              <el-tag size="small">{{ getModuleTypeLabel(getCurrentModule()?.type) }}</el-tag>
              <span class="duration">{{ getCurrentModule()?.duration }}分钟</span>
            </div>
            <p class="preview-description">
              {{ getCurrentModule()?.objectives.slice(0, 2).join('；') }}
            </p>
          </div>
          <div v-else class="empty-preview">
            选择环节查看预览
          </div>
        </div>
      </div>

      <div class="sidebar-section">
        <h4 class="section-title">操作记录</h4>
        <div class="activity-list">
          <div
            v-for="activity in recentActivities"
            :key="activity.id"
            class="activity-item"
          >
            <el-icon size="14" :color="activity.color">
              <component :is="activity.icon" />
            </el-icon>
            <span class="activity-text">{{ activity.text }}</span>
            <span class="activity-time">{{ formatTime(activity.time) }}</span>
          </div>
        </div>
      </div>
    </template>
  </TeacherWorkspaceLayout>

  <!-- 版本管理对话框 -->
  <el-dialog v-model="versionDialogVisible" title="版本管理" width="800px">
    <div class="version-manager">
      <el-timeline>
        <el-timeline-item
          v-for="version in courseVersions"
          :key="version.id"
          :type="version.status === 'PUBLISHED' ? 'success' : 'primary'"
          @click="selectVersion(version)"
        >
          <div class="version-item">
            <div class="version-header">
              <span class="version-number">v{{ version.version }}</span>
              <el-tag :type="version.status === 'PUBLISHED' ? 'success' : 'warning'" size="small">
                {{ version.status === 'PUBLISHED' ? '已发布' : '草稿' }}
              </el-tag>
            </div>
            <div class="version-meta">
              <span>{{ version.createdAt }}</span>
              <span v-if="version.publishedAt">发布于: {{ version.publishedAt }}</span>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </div>
  </el-dialog>

  <!-- ACL预览对话框 -->
  <el-dialog v-model="aclPreviewVisible" title="ACL内容预览" width="80%">
    <el-input
      type="textarea"
      :model-value="JSON.stringify(aclContent, null, 2)"
      :rows="20"
      readonly
    />
    <template #footer>
      <el-button @click="aclPreviewVisible = false">关闭</el-button>
      <el-button type="primary" @click="copyACL">复制</el-button>
    </template>
  </el-dialog>
</template>
            <el-button type="primary" size="small" @click="addChapter">
              <el-icon><Plus /></el-icon>
              添加章节
            </el-button>
            <el-button size="small" @click="showTemplateDialog = true">
              <el-icon><Grid /></el-icon>
              从模板添加
            </el-button>
          </div>
        </div>
      </div>

      <div class="sidebar-section">
        <h4 class="section-title">快速工具</h4>
        <div class="quick-tools">
          <el-button v-for="tool in quickTools" :key="tool.id" size="small" @click="useTool(tool)">
            <el-icon><component :is="tool.icon" /></el-icon>
            {{ tool.name }}
          </el-button>
        </div>
      </div>
    </template>

    <template #right>
      <div class="sidebar-section">
        <h4 class="section-title">预览</h4>
        <div class="preview-container">
          <div class="preview-header">
            <span class="preview-title">{{ currentChapter?.title || '选择章节查看预览' }}</span>
            <div class="preview-controls">
              <el-button-group size="small">
                <el-button :type="previewMode === 'desktop' ? 'primary' : ''" @click="previewMode = 'desktop'">
                  <el-icon><Monitor /></el-icon>
                </el-button>
                <el-button :type="previewMode === 'tablet' ? 'primary' : ''" @click="previewMode = 'tablet'">
                  <el-icon><Iphone /></el-icon>
                </el-button>
                <el-button :type="previewMode === 'mobile' ? 'primary' : ''" @click="previewMode = 'mobile'">
                  <el-icon><Cellphone /></el-icon>
                </el-button>
              </el-button-group>
            </div>
          </div>
          <div class="preview-content" :class="`preview-${previewMode}`">
            <div v-if="currentChapter" class="chapter-preview">
              <div class="chapter-content" v-html="currentChapter.content || '<p>暂无内容</p>'"></div>
            </div>
            <div v-else class="empty-preview">
              <el-empty description="请选择章节查看预览" />
            </div>
          </div>
        </div>
      </div>

      <div class="sidebar-section">
        <h4 class="section-title">AI 助手</h4>
        <div class="ai-assistant">
          <div class="ai-input">
            <el-input
              v-model="aiPrompt"
              placeholder="让AI帮您完善课程内容..."
              @keyup.enter="generateAIContent"
            >
              <template #append>
                <el-button @click="generateAIContent" :loading="aiGenerating">
                  <el-icon><MagicStick /></el-icon>
                </el-button>
              </template>
            </el-input>
          </div>
          <div class="ai-suggestions">
            <div
              v-for="suggestion in aiSuggestions"
              :key="suggestion.id"
              class="suggestion-item"
              @click="applyAISuggestion(suggestion)"
            >
              <el-icon><component :is="suggestion.icon" /></el-icon>
              <span>{{ suggestion.text }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="sidebar-section">
        <h4 class="section-title">资源库</h4>
        <div class="resource-list">
          <div
            v-for="resource in resources"
            :key="resource.id"
            class="resource-item"
            @click="insertResource(resource)"
          >
            <div class="resource-icon" :style="{ backgroundColor: resource.color }">
              <el-icon><component :is="resource.icon" /></el-icon>
            </div>
            <div class="resource-info">
              <span class="resource-name">{{ resource.name }}</span>
              <span class="resource-type">{{ resource.type }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div class="editor-content">
      <!-- 课程基本信息编辑区 -->
      <EduCard
        v-if="editingMode === 'basic'"
        class="editor-section"
        variant="elevated"
        :hoverable="false"
      >
        <template #header>
          <div class="section-header">
            <h3 class="section-title">课程基本信息</h3>
            <el-button type="text" @click="editingMode = 'content'">
              下一步<el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
        </template>

        <el-form :model="courseForm" :rules="courseRules" label-width="100px">
          <el-form-item label="课程标题" prop="title">
            <el-input v-model="courseForm.title" placeholder="请输入课程标题" />
          </el-form-item>

          <el-form-item label="学科" prop="subject">
            <el-select v-model="courseForm.subject" placeholder="请选择学科">
              <el-option
                v-for="subject in subjectOptions"
                :key="subject.value"
                :label="subject.label"
                :value="subject.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="年级" prop="grade">
            <el-select v-model="courseForm.grade" placeholder="请选择年级">
              <el-option
                v-for="grade in gradeOptions"
                :key="grade.value"
                :label="grade.label"
                :value="grade.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="课程描述" prop="description">
            <el-input
              v-model="courseForm.description"
              type="textarea"
              :rows="4"
              placeholder="请输入课程描述"
            />
          </el-form-item>

          <el-form-item label="课程封面">
            <el-upload
              class="cover-uploader"
              action="#"
              :show-file-list="false"
              :on-success="handleCoverSuccess"
              :before-upload="beforeCoverUpload"
            >
              <img v-if="courseForm.cover" :src="courseForm.cover" class="cover-image" />
              <el-icon v-else class="cover-uploader-icon"><Plus /></el-icon>
            </el-upload>
          </el-form-item>

          <el-form-item label="课程标签">
            <el-tag
              v-for="tag in courseForm.tags"
              :key="tag"
              closable
              @close="removeTag(tag)"
              class="course-tag"
            >
              {{ tag }}
            </el-tag>
            <el-input
              v-if="tagInputVisible"
              ref="tagInputRef"
              v-model="tagInputValue"
              size="small"
              style="width: 100px"
              @keyup.enter="handleInputConfirm"
              @blur="handleInputConfirm"
            />
            <el-button v-else size="small" @click="showTagInput">
              + 添加标签
            </el-button>
          </el-form-item>
        </el-form>
      </EduCard>

      <!-- 章节内容编辑区 -->
      <div v-else class="editor-main">
        <EduCard class="editor-section chapter-editor" variant="elevated" :hoverable="false">
          <template #header>
            <div class="section-header">
              <div class="section-info">
                <h3 class="section-title">
                  {{ currentChapter?.title || '选择章节开始编辑' }}
                </h3>
                <p class="section-description">
                  {{ currentChapter?.type ? getChapterTypeName(currentChapter.type) : '章节内容编辑' }}
                </p>
              </div>
              <div class="section-actions">
                <el-button @click="editingMode = 'basic'">
                  <el-icon><ArrowLeft /></el-icon>
                  基本信息
                </el-button>
              </div>
            </div>
          </template>

          <div v-if="currentChapter" class="chapter-editor-content">
            <!-- 工具栏 -->
            <div class="editor-toolbar">
              <el-button-group>
                <el-button size="small" @click="insertElement('text')">
                  <el-icon><Document /></el-icon>
                </el-button>
                <el-button size="small" @click="insertElement('image')">
                  <el-icon><Picture /></el-icon>
                </el-button>
                <el-button size="small" @click="insertElement('video')">
                  <el-icon><VideoCamera /></el-icon>
                </el-button>
                <el-button size="small" @click="insertElement('activity')">
                  <el-icon><Grid /></el-icon>
                </el-button>
              </el-button-group>

              <el-divider direction="vertical" />

              <el-button size="small" @click="toggleAIAssistant">
                <el-icon><MagicStick /></el-icon>
                AI 助手
              </el-button>
            </div>

            <!-- 富文本编辑器 -->
            <div class="editor-area">
              <el-input
                v-model="currentChapter.content"
                type="textarea"
                :rows="20"
                placeholder="开始编写章节内容..."
                class="content-editor"
              />
            </div>

            <!-- 章节设置 -->
            <div class="chapter-settings">
              <el-form :model="currentChapter" label-width="100px">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="预计时长">
                      <el-input-number
                        v-model="currentChapter.duration"
                        :min="5"
                        :max="180"
                        placeholder="分钟"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="难度等级">
                      <el-select v-model="currentChapter.difficulty" placeholder="选择难度">
                        <el-option label="简单" value="easy" />
                        <el-option label="中等" value="medium" />
                        <el-option label="困难" value="hard" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-form-item label="学习目标">
                  <el-input
                    v-model="currentChapter.objectives"
                    type="textarea"
                    :rows="3"
                    placeholder="描述本章节的学习目标"
                  />
                </el-form-item>
              </el-form>
            </div>
          </div>

          <div v-else class="empty-editor">
            <el-empty description="请从左侧选择章节开始编辑" />
          </div>
        </EduCard>
      </div>
    </div>

    <!-- 模板选择对话框 -->
    <el-dialog v-model="showTemplateDialog" title="选择章节模板" width="600px">
      <div class="template-grid">
        <div
          v-for="template in chapterTemplates"
          :key="template.id"
          class="template-card"
          @click="applyTemplate(template)"
        >
          <div class="template-icon">
            <el-icon><component :is="template.icon" /></el-icon>
          </div>
          <h4 class="template-title">{{ template.name }}</h4>
          <p class="template-description">{{ template.description }}</p>
        </div>
      </div>
    </el-dialog>
  </TeacherWorkspaceLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document, Upload, View, ArrowDown, Edit, MoreFilled,
  Plus, Grid, MagicStick, Picture, VideoCamera, Monitor,
  Target, Folder, Refresh, Check, EditPen
} from '@element-plus/icons-vue'

import TeacherWorkspaceLayout from '@/components/layout/TeacherWorkspaceLayout.vue'
import { EduCard } from '@reopeninnolab/ui-kit'
import { useCourseStore, type ModuleConfig } from '@/stores/course'
import { aclValidator, type AiCourseLayout } from '@reopeninnolab/acl-sdk'

// 使用内置组件避免创建过多文件

interface Activity {
  id: string
  text: string
  icon: any
  color: string
  time: Date
}

interface SummaryCard {
  id: string
  label: string
  value: string | number
  icon: any
  gradient: string
}

const route = useRoute()
const router = useRouter()
const courseStore = useCourseStore()

// 响应式数据
const courseId = computed(() => route.params.id as string)
const leftSidebarCollapsed = ref(false)
const rightSidebarCollapsed = ref(false)
const selectedModuleKey = ref('')
const activeEditorTab = ref('basic')
const moduleContent = ref('')
const versionDialogVisible = ref(false)
const templateDialogVisible = ref(false)
const aclPreviewVisible = ref(false)
const recentActivities = ref<Activity[]>([])
const courseVersions = ref([])

// 计算属性
const currentCourse = computed(() => courseStore.currentCourse)
const totalDuration = computed(() => {
  if (!courseStore.editor?.fiveModules) return 0
  return Object.values(courseStore.editor.fiveModules)
    .reduce((total, module) => total + module.duration, 0)
})

const totalResources = computed(() => {
  if (!courseStore.editor?.fiveModules) return 0
  return Object.values(courseStore.editor.fiveModules)
    .reduce((total, module) => total + module.resources.length, 0)
})

const totalObjectives = computed(() => {
  if (!courseStore.editor?.fiveModules) return 0
  return Object.values(courseStore.editor.fiveModules)
    .reduce((total, module) => total + module.objectives.length, 0)
})

const aclContent = computed(() => courseStore.generateAclFromEditor())

const summaryCards = computed<SummaryCard[]>(() => [
  {
    id: 'duration',
    label: '总时长',
    value: `${totalDuration.value}分钟`,
    icon: 'Clock',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    id: 'objectives',
    label: '学习目标',
    value: totalObjectives.value,
    icon: 'Target',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  {
    id: 'resources',
    label: '教学资源',
    value: totalResources.value,
    icon: 'Folder',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  },
  {
    id: 'modules',
    label: '教学环节',
    value: '5个',
    icon: 'Grid',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
  }
])

// 生命周期
onMounted(async () => {
  if (courseId.value) {
    await courseStore.fetchCourseById(courseId.value)
    addActivity('加载课程', 'Document', '#409EFF')
  } else {
    courseStore.initializeEditor()
    addActivity('新建课程', 'Plus', '#67C23A')
  }
})

// 监听课程变化
watch(() => courseStore.editor, (newEditor) => {
  if (newEditor) {
    // 将objectives数组转换为文本显示
    Object.values(newEditor.fiveModules).forEach(module => {
      if (!('objectivesText' in module)) {
        (module as any).objectivesText = module.objectives.join('\n')
      }
      if (!('aiHintsText' in module)) {
        (module as any).aiHintsText = module.aiHints.join('\n')
      }
      if (!('classroomActionsText' in module)) {
        (module as any).classroomActionsText = module.classroomActions.join('\n')
      }
    })
  }
}, { immediate: true, deep: true })

// 模块相关方法
function getCurrentModule(): ModuleConfig | undefined {
  if (!selectedModuleKey.value || !courseStore.editor) return undefined
  return courseStore.editor.fiveModules[selectedModuleKey.value as keyof typeof courseStore.editor.fiveModules]
}

function selectModule(key: string) {
  selectedModuleKey.value = key
  addActivity(`选择环节: ${getModuleTypeLabel(getCurrentModule()?.type)}`, 'Edit', '#E6A23C')
}

function isModuleActive(key: string): boolean {
  const module = courseStore.editor?.fiveModules[key as keyof typeof courseStore.editor.fiveModules]
  return module ? (module.objectives.length > 0 || module.resources.length > 0) : false
}

function updateModule(moduleKey: string, updates: Partial<ModuleConfig>) {
  if (!courseStore.editor) return

  const module = courseStore.editor.fiveModules[moduleKey as keyof typeof courseStore.editor.fiveModules]
  Object.assign(module, updates)

  addActivity(`更新环节: ${module.title}`, 'Edit', '#E6A23C')
}

function resetToDefaultModules() {
  courseStore.initializeEditor(currentCourse.value)
  addActivity('重置环节结构', 'Refresh', '#F56C6C')
}

// 环节类型相关方法
function getModuleIcon(type?: string): any {
  const icons: Record<string, any> = {
    introduction: VideoCamera,
    knowledge: Document,
    experience: Picture,
    experiment: Monitor,
    assignment: Edit
  }
  return icons[type || ''] || Document
}

function getModuleTypeColor(type?: string): string {
  const colors: Record<string, string> = {
    introduction: '#67C23A',
    knowledge: '#409EFF',
    experience: '#E6A23C',
    experiment: '#F56C6C',
    assignment: '#909399'
  }
  return colors[type || ''] || '#909399'
}

function getModuleTagType(type?: string): string {
  const types: Record<string, string> = {
    introduction: 'success',
    knowledge: 'primary',
    experience: 'warning',
    experiment: 'danger',
    assignment: 'info'
  }
  return types[type || ''] || 'info'
}

function getModuleTypeLabel(type?: string): string {
  const labels: Record<string, string> = {
    introduction: '课程引入',
    knowledge: '新知讲解',
    experience: '体验理解',
    experiment: '实验活动',
    assignment: '作业测试'
  }
  return labels[type || ''] || '未知'
}

function getModuleDuration(duration?: number): string {
  return duration ? `${duration}分钟` : '未设置'
}

function getStatusText(status?: string): string {
  const statusMap: Record<string, string> = {
    'DRAFT': '草稿',
    'PUBLISHED': '已发布',
    'ARCHIVED': '已归档'
  }
  return statusMap[status || ''] || '未知'
}

// AI相关方法
async function generateWithAI() {
  try {
    ElMessage.info('AI正在生成完整课程结构...')
    // TODO: 集成真实的AI服务
    addActivity('AI生成课程', 'MagicStick', '#409EFF')
    ElMessage.success('AI课程生成完成')
  } catch (error) {
    ElMessage.error('AI生成失败')
  }
}

async function aiGenerateModule() {
  const module = getCurrentModule()
  if (!module) return

  try {
    ElMessage.info(`AI正在生成${module.title}内容...`)
    // TODO: 集成真实的AI服务
    addActivity(`AI生成${module.title}`, 'MagicStick', '#409EFF')
    ElMessage.success(`${module.title}生成完成`)
  } catch (error) {
    ElMessage.error('AI生成失败')
  }
}

function handleAIGeneration(type: string) {
  // 处理AI助手生成请求
  console.log('AI生成类型:', type)
}

function applyAISuggestion(suggestion: any) {
  // 应用AI建议
  console.log('应用AI建议:', suggestion)
}

// 保存和发布
async function saveVersion() {
  try {
    await courseStore.saveVersion()
    addActivity('保存版本', 'Document', '#67C23A')
    ElMessage.success('版本保存成功')
  } catch (error) {
    // 错误已在store中处理
  }
}

async function saveModuleChanges() {
  const module = getCurrentModule()
  if (!module) return

  try {
    await courseStore.saveVersion()
    addActivity(`保存${module.title}`, 'Check', '#67C23A')
    ElMessage.success('模块保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

async function publishCourse() {
  if (!currentCourse.value) {
    ElMessage.error('没有课程数据')
    return
  }

  try {
    await ElMessageBox.confirm('确定要发布此课程吗？发布后学生即可访问。', '发布确认', {
      type: 'warning'
    })

    await courseStore.publishCourse()
    addActivity('发布课程', 'Upload', '#E6A23C')
    ElMessage.success('课程发布成功')
  } catch (error) {
    if (error !== 'cancel') {
      // 错误已在store中处理
    }
  }
}

// 更多操作
async function handleMoreAction(command: string) {
  switch (command) {
    case 'version':
      versionDialogVisible.value = true
      break
    case 'export':
      exportACL()
      break
    case 'validate':
      validateCourse()
      break
    case 'settings':
      openSettings()
      break
    case 'help':
      openHelp()
      break
  }
}

function exportACL() {
  const acl = courseStore.generateAclFromEditor()
  if (!acl) {
    ElMessage.error('无法生成ACL内容')
    return
  }

  const blob = new Blob([JSON.stringify(acl, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${courseStore.editor?.basicInfo.title || '课程'}_${Date.now()}.acl.json`
  link.click()
  URL.revokeObjectURL(url)

  addActivity('导出ACL', 'Download', '#909399')
  ElMessage.success('ACL文件导出成功')
}

function validateCourse() {
  const acl = courseStore.generateAclFromEditor()
  if (!acl) {
    ElMessage.error('无法生成ACL内容')
    return
  }

  const validation = aclValidator.validate(acl)
  if (validation.isValid) {
    ElMessage.success('课程验证通过')
    addActivity('验证课程', 'Check', '#67C23A')
  } else {
    const errorMessages = validation.errors.slice(0, 3).map(e => e.message).join('；')
    ElMessage.error(`验证失败: ${errorMessages}`)
    addActivity('验证失败', 'Close', '#F56C6C')
  }
}

function openSettings() {
  // 打开课程设置
  ElMessage.info('课程设置功能开发中...')
}

function openHelp() {
  // 打开帮助文档
  window.open('/help/course-editor', '_blank')
}

function previewCourse() {
  if (!aclContent.value) {
    ElMessage.error('无法生成预览内容')
    return
  }

  aclPreviewVisible.value = true
  addActivity('预览课程', 'View', '#409EFF')
}

// 模板相关
function loadTemplate() {
  templateDialogVisible.value = true
}

function applyTemplate(template: any) {
  // 应用课程模板
  console.log('应用模板:', template)
  addActivity('应用模板', 'Grid', '#E6A23C')
  ElMessage.success('模板应用成功')
}

// 版本管理
async function loadVersion(version: any) {
  try {
    // 加载指定版本
    console.log('加载版本:', version)
    addActivity(`切换版本: ${version.version}`, 'Refresh', '#409EFF')
    ElMessage.success('版本加载成功')
  } catch (error) {
    ElMessage.error('版本加载失败')
  }
}

// 活动记录
function addActivity(text: string, icon: any, color: string) {
  recentActivities.value.unshift({
    id: Date.now().toString(),
    text,
    icon,
    color,
    time: new Date()
  })

  // 最多保留20条记录
  if (recentActivities.value.length > 20) {
    recentActivities.value = recentActivities.value.slice(0, 20)
  }
}

function formatTime(time: Date): string {
  const now = new Date()
  const diff = now.getTime() - time.getTime()
  const minutes = Math.floor(diff / 60000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}小时前`
  return time.toLocaleDateString()
}

// 模块编辑相关方法
function updateModuleBasicInfo() {
  const module = getCurrentModule()
  if (module) {
    updateModule(selectedModuleKey.value, {
      title: module.title,
      duration: module.duration
    })
  }
}

function handleObjectivesChange(value: string) {
  const module = getCurrentModule()
  if (module) {
    const objectives = value.split('\n').filter(obj => obj.trim())
    updateModule(selectedModuleKey.value, { objectives })
  }
}

function handleContentChange(value: string) {
  const module = getCurrentModule()
  if (module) {
    updateModule(selectedModuleKey.value, {
      content: { ...module.content, text: value }
    })
  }
}

function handleAIHintsChange(value: string) {
  const module = getCurrentModule()
  if (module) {
    const aiHints = value.split('\n').filter(hint => hint.trim())
    updateModule(selectedModuleKey.value, { aiHints })
  }
}

function handleClassroomActionsChange(value: string) {
  const module = getCurrentModule()
  if (module) {
    const classroomActions = value.split('\n').filter(action => action.trim())
    updateModule(selectedModuleKey.value, { classroomActions })
  }
}

function formatContent() {
  // 简单的内容格式化
  moduleContent.value = moduleContent.value
    .split('\n')
    .filter(line => line.trim())
    .join('\n\n')
}

function previewContent() {
  ElMessage.info('内容预览功能开发中...')
}

function addResource() {
  ElMessage.info('资源添加功能开发中...')
}

function removeResource(resourceId: string) {
  const module = getCurrentModule()
  if (module) {
    module.resources = module.resources.filter(r => r.id !== resourceId)
    addActivity(`删除资源`, 'Delete', '#F56C6C')
  }
}

// AI生成方法
function generateModuleContent() {
  const module = getCurrentModule()
  if (module) {
    ElMessage.info(`正在生成${module.title}的内容...`)
    // TODO: 集成AI服务
  }
}

function generateObjectives() {
  const module = getCurrentModule()
  if (module) {
    ElMessage.info(`正在生成${module.title}的学习目标...`)
    // TODO: 集成AI服务
  }
}

function generateResources() {
  const module = getCurrentModule()
  if (module) {
    ElMessage.info(`正在推荐${module.title}的教学资源...`)
    // TODO: 集成AI服务
  }
}

// 版本管理方法
function selectVersion(version: any) {
  loadVersion(version)
  versionDialogVisible.value = false
}

function copyACL() {
  if (aclContent.value) {
    navigator.clipboard.writeText(JSON.stringify(aclContent.value, null, 2))
    ElMessage.success('ACL内容已复制到剪贴板')
  }
}
</script>

<style scoped>
.editor-actions {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

.summary-card {
  transition: transform 0.3s ease;
}

.summary-card:hover {
  transform: translateY(-2px);
}

.summary-card__content {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.summary-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius-md);
  color: white;
  font-size: 20px;
}

.summary-card__text {
  display: flex;
  flex-direction: column;
}

.summary-card__value {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1;
}

.summary-card__label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-top: var(--spacing-xs);
}

.sidebar-section {
  margin-bottom: var(--spacing-lg);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.section-title {
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-primary);
}

.modules-tree {
  display: grid;
  gap: var(--spacing-sm);
}

.module-item {
  padding: var(--spacing-md);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all 0.3s ease;
}

.module-item:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.module-item.is-current {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.module-item.is-active {
  border-color: var(--color-success);
}

.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.module-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.module-title {
  font-weight: 600;
  color: var(--color-text-primary);
}

.module-stats {
  display: flex;
  gap: var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.course-info {
  display: grid;
  gap: var(--spacing-sm);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-item .label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.info-item .value {
  font-weight: 600;
  color: var(--color-text-primary);
}

.welcome-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
}

.welcome-content {
  text-align: center;
  max-width: 400px;
}

.welcome-icon {
  margin-bottom: var(--spacing-lg);
}

.welcome-content h2 {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-text-primary);
}

.welcome-content p {
  margin: 0 0 var(--spacing-xl) 0;
  color: var(--color-text-secondary);
}

.welcome-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
}

.module-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) 0;
  margin-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
}

.editor-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-primary);
}

.editor-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.editor-content {
  flex: 1;
  overflow: hidden;
}

.quick-preview {
  background: var(--color-background);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
}

.preview-card {
  margin-bottom: var(--spacing-md);
}

.preview-card h5 {
  margin: 0 0 var(--spacing-xs) 0;
  color: var(--color-text-primary);
}

.preview-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
}

.duration {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.preview-description {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-regular);
  line-height: 1.4;
}

.empty-preview {
  text-align: center;
  padding: var(--spacing-lg) 0;
}

.activity-list {
  display: grid;
  gap: var(--spacing-xs);
  max-height: 200px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs);
  font-size: var(--font-size-sm);
  border-radius: var(--border-radius-sm);
  transition: background-color 0.3s ease;
}

.activity-item:hover {
  background: var(--color-background-light);
}

.activity-text {
  flex: 1;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-time {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  white-space: nowrap;
}

/* 模块编辑器样式 */
.module-settings {
  padding: var(--spacing-md);
}

.content-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.content-tools {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
  justify-content: flex-end;
}

.resources-panel {
  padding: var(--spacing-md);
  height: 100%;
}

.resources-header {
  margin-bottom: var(--spacing-md);
}

.resources-list {
  max-height: 300px;
  overflow-y: auto;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  margin-bottom: var(--spacing-xs);
}

.resource-item span {
  flex: 1;
}

.empty-resources {
  text-align: center;
  color: var(--color-text-secondary);
  padding: var(--spacing-lg) 0;
}

.ai-settings {
  padding: var(--spacing-md);
}

.ai-assistant {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

/* 版本管理样式 */
.version-manager {
  max-height: 400px;
  overflow-y: auto;
}

.version-item {
  cursor: pointer;
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  transition: background-color 0.3s ease;
}

.version-item:hover {
  background: var(--color-background-light);
}

.version-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
}

.version-number {
  font-weight: 600;
  color: var(--color-text-primary);
}

.version-meta {
  display: flex;
  gap: var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .editor-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .editor-actions {
    align-self: stretch;
    justify-content: flex-end;
  }
}

@media (max-width: 768px) {
  .editor-actions {
    flex-direction: column;
    width: 100%;
  }

  .welcome-actions {
    flex-direction: column;
  }

  .module-stats {
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .summary-card__content {
    flex-direction: column;
    text-align: center;
  }
}
</style>
