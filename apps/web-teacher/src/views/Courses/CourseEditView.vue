<template>
  <TeacherWorkspaceLayout
    title="课程编辑器"
    subtitle="创建和编辑课程内容，AI赋能教学设计"
    v-model:leftCollapsed="leftSidebarCollapsed"
    v-model:rightCollapsed="rightSidebarCollapsed"
  >
    <template #header-controls>
      <div class="editor-actions">
        <el-button @click="saveDraft" :loading="saving">
          <el-icon><Document /></el-icon>
          保存草稿
        </el-button>
        <el-button type="primary" @click="publishCourse" :loading="publishing">
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
              <el-dropdown-item command="export">导出课程</el-dropdown-item>
              <el-dropdown-item command="settings">课程设置</el-dropdown-item>
              <el-dropdown-item command="help">使用帮助</el-dropdown-item>
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
        <h4 class="section-title">课程结构</h4>
        <div class="chapter-tree">
          <el-tree
            ref="chapterTreeRef"
            :data="chapters"
            :props="treeProps"
            node-key="id"
            draggable
            :allow-drop="allowDrop"
            @node-click="selectChapter"
            @node-drop="handleNodeDrop"
            :default-expanded-keys="expandedKeys"
            :highlight-current="true"
          >
            <template #default="{ node, data }">
              <div class="chapter-node" :class="{ 'is-current': selectedChapterId === data.id }">
                <span class="node-icon">
                  <el-icon><component :is="getChapterIcon(data.type)" /></el-icon>
                </span>
                <span class="node-title">{{ data.title }}</span>
                <div class="node-actions">
                  <el-button type="text" size="small" @click.stop="editChapter(data)">
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-dropdown trigger="click" @command="(cmd) => handleChapterAction(cmd, data)">
                    <el-button type="text" size="small" @click.stop>
                      <el-icon><MoreFilled /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="add">添加子章节</el-dropdown-item>
                        <el-dropdown-item command="duplicate">复制章节</el-dropdown-item>
                        <el-dropdown-item command="delete" divided>删除章节</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>
            </template>
          </el-tree>

          <div class="tree-actions">
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
import { ref, computed, reactive, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import {
  ArrowLeft, Document, Upload, View, ArrowDown, Edit, MoreFilled,
  Plus, Grid, MagicStick, Picture, VideoCamera, Monitor, Iphone,
  Cellphone, FolderOpened, Reading, TrendCharts, User
} from '@element-plus/icons-vue'

import TeacherWorkspaceLayout from '@/components/layout/TeacherWorkspaceLayout.vue'
import { EduCard } from '@reopeninnolab/ui-kit'

interface Chapter {
  id: string
  title: string
  type: 'intro' | 'knowledge' | 'activity' | 'assignment'
  content: string
  duration: number
  difficulty: 'easy' | 'medium' | 'hard'
  objectives: string
  children?: Chapter[]
}

interface CourseForm {
  title: string
  subject: string
  grade: string
  description: string
  cover: string
  tags: string[]
}

interface Tool {
  id: string
  name: string
  icon: string
}

interface AISuggestion {
  id: string
  text: string
  icon: string
}

interface Resource {
  id: string
  name: string
  type: string
  icon: string
  color: string
}

interface Template {
  id: string
  name: string
  description: string
  icon: string
}

const route = useRoute()
const router = useRouter()
const chapterTreeRef = ref()
const tagInputRef = ref()

// 响应式数据
const courseId = computed(() => (route.params.id as string) || '')
const leftSidebarCollapsed = ref(false)
const rightSidebarCollapsed = ref(false)
const editingMode = ref<'basic' | 'content'>('basic')
const previewMode = ref<'desktop' | 'tablet' | 'mobile'>('desktop')
const selectedChapterId = ref<string>('')
const currentChapter = ref<Chapter | null>(null)
const saving = ref(false)
const publishing = ref(false)
const aiGenerating = ref(false)

const courseForm = reactive<CourseForm>({
  title: '',
  subject: '',
  grade: '',
  description: '',
  cover: '',
  tags: []
})

const courseRules = {
  title: [
    { required: true, message: '请输入课程标题', trigger: 'blur' },
    { min: 2, max: 50, message: '课程标题长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  subject: [
    { required: true, message: '请选择学科', trigger: 'change' }
  ],
  grade: [
    { required: true, message: '请选择年级', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入课程描述', trigger: 'blur' },
    { min: 10, max: 500, message: '课程描述长度在 10 到 500 个字符', trigger: 'blur' }
  ]
}

// 章节数据
const chapters = ref<Chapter[]>([
  {
    id: '1',
    title: '课程介绍',
    type: 'intro',
    content: '<p>欢迎来到本课程！在这个课程中，我们将一起探索...</p>',
    duration: 15,
    difficulty: 'easy',
    objectives: '了解课程目标和学习路径',
    children: [
      {
        id: '1-1',
        title: '课程概览',
        type: 'knowledge',
        content: '<p>本章节将介绍课程的整体安排...</p>',
        duration: 10,
        difficulty: 'easy',
        objectives: '了解课程结构和评价方式'
      },
      {
        id: '1-2',
        title: '学习资源',
        type: 'activity',
        content: '<p>课程所需的学习材料和工具...</p>',
        duration: 5,
        difficulty: 'easy',
        objectives: '准备学习环境和资源'
      }
    ]
  },
  {
    id: '2',
    title: '基础知识',
    type: 'knowledge',
    content: '<p>本章节将学习核心概念...</p>',
    duration: 45,
    difficulty: 'medium',
    objectives: '掌握基础理论和方法',
    children: [
      {
        id: '2-1',
        title: '概念定义',
        type: 'knowledge',
        content: '<p>详细定义课程涉及的核心概念...</p>',
        duration: 20,
        difficulty: 'medium',
        objectives: '理解并记忆重要概念'
      },
      {
        id: '2-2',
        title: '基础练习',
        type: 'assignment',
        content: '<p>通过练习巩固所学知识...</p>',
        duration: 25,
        difficulty: 'medium',
        objectives: '能够独立完成基础练习'
      }
    ]
  }
])

const expandedKeys = ref(['1', '2'])

// 其他数据
const tagInputVisible = ref(false)
const tagInputValue = ref('')
const aiPrompt = ref('')
const showTemplateDialog = ref(false)

const quickTools = ref<Tool[]>([
  { id: '1', name: 'AI生成', icon: 'MagicStick' },
  { id: '2', name: '模板库', icon: 'Grid' },
  { id: '3', name: '公式编辑器', icon: 'Document' },
  { id: '4', name: '绘图工具', icon: 'Picture' }
])

const aiSuggestions = ref<AISuggestion[]>([
  { id: '1', text: '为当前章节添加学习目标', icon: 'Target' },
  { id: '2', text: '生成章节测试题', icon: 'Document' },
  { id: '3', text: '优化教学流程设计', icon: 'Flow' }
])

const resources = ref<Resource[]>([
  { id: '1', name: '教学图片库', type: '图片', icon: 'Picture', color: '#4ECDC4' },
  { id: '2', name: '视频素材', type: '视频', icon: 'VideoCamera', color: '#45B7D1' },
  { id: '3', name: '互动组件', type: '组件', icon: 'Grid', color: '#96CEB4' }
])

const chapterTemplates = ref<Template[]>([
  { id: '1', name: '标准章节模板', description: '包含介绍、知识讲解、练习的标准结构', icon: 'Document' },
  { id: '2', name: '实践导向模板', description: '强调动手操作和实践环节', icon: 'Experiment' },
  { id: '3', name: '理论讲解模板', description: '适合理论知识传授的章节结构', icon: 'Reading' }
])

// 树形配置
const treeProps = {
  children: 'children',
  label: 'title'
}

// 计算属性
const summaryCards = computed(() => [
  {
    id: 'chapters',
    label: '章节数量',
    value: chapters.value.length,
    icon: FolderOpened,
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    id: 'content',
    label: '内容字数',
    value: chapters.value.reduce((sum, chapter) => sum + (chapter.content?.length || 0), 0),
    icon: Document,
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  {
    id: 'progress',
    label: '完成进度',
    value: '65%',
    icon: TrendCharts,
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  }
])

const subjectOptions = [
  { label: '物理', value: 'physics' },
  { label: '化学', value: 'chemistry' },
  { label: 'math', value: 'math' },
  { label: '生物', value: 'biology' },
  { label: '语文', value: 'language' },
  { label: '英语', value: 'english' }
]

const gradeOptions = [
  { label: '初一', value: '7' },
  { label: '初二', value: '8' },
  { label: '初三', value: '9' },
  { label: '高一', value: '10' },
  { label: '高二', value: '11' },
  { label: '高三', value: '12' }
]

// 方法
const saveDraft = async () => {
  try {
    saving.value = true
    // 模拟保存
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('草稿保存成功')
  } catch (error) {
    ElMessage.error('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

const publishCourse = async () => {
  try {
    publishing.value = true
    // 验证表单
    // 发布逻辑
    await new Promise(resolve => setTimeout(resolve, 2000))
    ElMessage.success('课程发布成功')
  } catch (error) {
    ElMessage.error('发布失败，请重试')
  } finally {
    publishing.value = false
  }
}

const previewCourse = () => {
  ElMessage.info('预览功能开发中...')
}

const handleMoreAction = (command: string) => {
  switch (command) {
    case 'version':
      ElMessage.info('版本管理功能开发中...')
      break
    case 'export':
      ElMessage.info('导出功能开发中...')
      break
    case 'settings':
      ElMessage.info('课程设置功能开发中...')
      break
    case 'help':
      ElMessage.info('使用帮助功能开发中...')
      break
  }
}

const selectChapter = (data: Chapter) => {
  selectedChapterId.value = data.id
  currentChapter.value = data
}

const addChapter = () => {
  const newChapter: Chapter = {
    id: Date.now().toString(),
    title: '新章节',
    type: 'knowledge',
    content: '<p>请编辑章节内容...</p>',
    duration: 30,
    difficulty: 'medium',
    objectives: ''
  }
  chapters.value.push(newChapter)
  nextTick(() => {
    selectChapter(newChapter)
  })
}

const editChapter = (chapter: Chapter) => {
  ElMessage.info(`编辑章节: ${chapter.title}`)
}

const handleChapterAction = async (command: string, data: Chapter) => {
  switch (command) {
    case 'add':
      addSubChapter(data)
      break
    case 'duplicate':
      duplicateChapter(data)
      break
    case 'delete':
      await deleteChapter(data)
      break
  }
}

const addSubChapter = (parent: Chapter) => {
  const newChapter: Chapter = {
    id: Date.now().toString(),
    title: '新子章节',
    type: 'knowledge',
    content: '<p>请编辑子章节内容...</p>',
    duration: 20,
    difficulty: 'medium',
    objectives: ''
  }

  if (!parent.children) {
    parent.children = []
  }
  parent.children.push(newChapter)
  expandedKeys.value.push(parent.id)
}

const duplicateChapter = (chapter: Chapter) => {
  const duplicated: Chapter = {
    ...chapter,
    id: Date.now().toString(),
    title: `${chapter.title} (副本)`,
    children: chapter.children ? chapter.children.map(child => ({ ...child, id: Date.now().toString() })) : undefined
  }

  const parent = findParentChapter(chapters.value, chapter.id)
  if (parent) {
    parent.children!.push(duplicated)
  } else {
    chapters.value.push(duplicated)
  }
}

const deleteChapter = async (chapter: Chapter) => {
  try {
    await ElMessageBox.confirm('确定要删除这个章节吗？', '确认删除', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'error'
    })

    const parent = findParentChapter(chapters.value, chapter.id)
    if (parent && parent.children) {
      const index = parent.children.findIndex(c => c.id === chapter.id)
      parent.children.splice(index, 1)
    } else {
      const index = chapters.value.findIndex(c => c.id === chapter.id)
      chapters.value.splice(index, 1)
    }

    if (selectedChapterId.value === chapter.id) {
      currentChapter.value = null
      selectedChapterId.value = ''
    }

    ElMessage.success('章节删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const findParentChapter = (chapters: Chapter[], chapterId: string): Chapter | null => {
  for (const chapter of chapters) {
    if (chapter.children) {
      const found = chapter.children.find(c => c.id === chapterId)
      if (found) return chapter
      const foundInChildren = findParentChapter(chapter.children, chapterId)
      if (foundInChildren) return foundInChildren
    }
  }
  return null
}

const handleNodeDrop = (draggingNode: any, dropNode: any, dropType: string) => {
  ElMessage.success('章节顺序已更新')
}

const allowDrop = (draggingNode: any, dropNode: any, type: string) => {
  return type !== 'inner'
}

const getChapterIcon = (type: string): string => {
  const icons: Record<string, string> = {
    intro: 'Document',
    knowledge: 'Reading',
    activity: 'Grid',
    assignment: 'Edit'
  }
  return icons[type] || 'Document'
}

const getChapterTypeName = (type: string): string => {
  const types: Record<string, string> = {
    intro: '课程介绍',
    knowledge: '知识讲解',
    activity: '活动环节',
    assignment: '作业任务'
  }
  return types[type] || type
}

const useTool = (tool: Tool) => {
  ElMessage.info(`使用工具: ${tool.name}`)
}

const insertElement = (type: string) => {
  ElMessage.info(`插入${type}元素`)
}

const toggleAIAssistant = () => {
  rightSidebarCollapsed.value = false
}

const generateAIContent = async () => {
  if (!aiPrompt.value.trim()) return

  try {
    aiGenerating.value = true
    // 模拟AI生成
    await new Promise(resolve => setTimeout(resolve, 2000))

    if (currentChapter.value) {
      currentChapter.value.content += `<p>AI生成的内容：${aiPrompt.value}</p>`
    }

    ElMessage.success('AI内容生成成功')
    aiPrompt.value = ''
  } catch (error) {
    ElMessage.error('AI生成失败，请重试')
  } finally {
    aiGenerating.value = false
  }
}

const applyAISuggestion = (suggestion: AISuggestion) => {
  ElMessage.success(`应用建议: ${suggestion.text}`)
}

const insertResource = (resource: Resource) => {
  if (currentChapter.value) {
    currentChapter.value.content += `\n<p>插入资源: ${resource.name}</p>`
  }
  ElMessage.info(`插入资源: ${resource.name}`)
}

const applyTemplate = (template: Template) => {
  const newChapter: Chapter = {
    id: Date.now().toString(),
    title: template.name,
    type: 'knowledge',
    content: `<p>${template.description}</p>`,
    duration: 30,
    difficulty: 'medium',
    objectives: ''
  }
  chapters.value.push(newChapter)
  showTemplateDialog.value = false

  nextTick(() => {
    selectChapter(newChapter)
  })
}

// 标签管理
const removeTag = (tag: string) => {
  const index = courseForm.tags.indexOf(tag)
  if (index > -1) {
    courseForm.tags.splice(index, 1)
  }
}

const showTagInput = () => {
  tagInputVisible.value = true
  nextTick(() => {
    tagInputRef.value?.focus()
  })
}

const handleInputConfirm = () => {
  if (tagInputValue.value) {
    courseForm.tags.push(tagInputValue.value)
  }
  tagInputVisible.value = false
  tagInputValue.value = ''
}

// 封面上传处理
const handleCoverSuccess = (response: any) => {
  courseForm.cover = response.url
  ElMessage.success('封面上传成功')
}

const beforeCoverUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
  }
  return isImage && isLt2M
}

const backToDetail = () => {
  if (courseId.value) {
    router.push({ name: 'CourseDetail', params: { id: courseId.value } })
  } else {
    router.push({ name: 'Courses' })
  }
}

// 生命周期
// 初始化逻辑可以在这里添加
</script>

<style scoped lang="scss">
.editor-actions {
  display: flex;
  gap: 12px;
}

.summary-card {
  width: 100%;
  :deep(.edu-card__body-content) {
    padding: 16px;
  }
}

.summary-card__content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.summary-card__icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.summary-card__text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-card__value {
  font-size: 22px;
  font-weight: 700;
  color: var(--edu-text-primary);
}

.summary-card__label {
  font-size: 13px;
  color: var(--edu-text-secondary);
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--edu-text-secondary);
  letter-spacing: 0.02em;
}

.chapter-tree {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chapter-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background-color 0.2s ease;
  cursor: pointer;

  &:hover {
    background-color: var(--edu-color-gray-50);
  }

  &.is-current {
    background-color: var(--edu-primary-50);
    color: var(--edu-primary-600);
  }
}

.node-icon {
  margin-right: 8px;
  color: var(--edu-color-gray-500);
}

.node-title {
  flex: 1;
  font-weight: 500;
}

.node-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;

  .chapter-node:hover & {
    opacity: 1;
  }
}

.tree-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.quick-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preview-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--edu-color-gray-200);
}

.preview-title {
  font-weight: 600;
  color: var(--edu-text-primary);
}

.preview-content {
  min-height: 300px;
  padding: 16px;
  border: 1px solid var(--edu-color-gray-200);
  border-radius: 8px;
  background: var(--edu-color-white);

  &.preview-desktop {
    max-width: 100%;
  }

  &.preview-tablet {
    max-width: 768px;
    margin: 0 auto;
    border: 2px solid var(--edu-color-gray-300);
  }

  &.preview-mobile {
    max-width: 375px;
    margin: 0 auto;
    border: 2px solid var(--edu-color-gray-300);
  }
}

.chapter-preview {
  color: var(--edu-text-primary);
  line-height: 1.6;
}

.empty-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: var(--edu-text-secondary);
}

.ai-assistant {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ai-suggestions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid var(--edu-color-gray-200);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--edu-primary-50);
    border-color: var(--edu-primary-200);
  }
}

.resource-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border: 1px solid var(--edu-color-gray-200);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--edu-color-gray-50);
  }
}

.resource-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.resource-info {
  flex: 1;
}

.resource-name {
  font-weight: 500;
  color: var(--edu-text-primary);
  font-size: 13px;
}

.resource-type {
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.editor-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.editor-section {
  width: 100%;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.section-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin: 0;
}

.section-description {
  margin: 0;
  color: var(--edu-text-secondary);
  font-size: 14px;
}

.section-actions {
  display: flex;
  gap: 12px;
}

.cover-uploader {
  border: 2px dashed var(--edu-color-gray-300);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: var(--edu-primary-400);
  }
}

.cover-image {
  width: 200px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
}

.cover-uploader-icon {
  font-size: 32px;
  color: var(--edu-color-gray-400);
}

.course-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

.chapter-editor-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--edu-color-gray-50);
  border-radius: 8px;
  border: 1px solid var(--edu-color-gray-200);
}

.editor-area {
  flex: 1;
}

.content-editor {
  width: 100%;
  min-height: 400px;
}

.chapter-settings {
  padding: 16px;
  background: var(--edu-color-gray-50);
  border-radius: 8px;
  border: 1px solid var(--edu-color-gray-200);
}

.empty-editor {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: var(--edu-text-secondary);
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.template-card {
  padding: 16px;
  border: 1px solid var(--edu-color-gray-200);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--edu-primary-50);
    border-color: var(--edu-primary-200);
  }
}

.template-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: var(--edu-primary-100);
  color: var(--edu-primary-600);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.template-title {
  font-weight: 600;
  color: var(--edu-text-primary);
  margin-bottom: 8px;
}

.template-description {
  font-size: 13px;
  color: var(--edu-text-secondary);
  line-height: 1.4;
}

// 响应式设计
@media (max-width: 1200px) {
  .section-actions {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .editor-actions {
    flex-direction: column;
  }

  .preview-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .tree-actions {
    flex-direction: column;
  }

  .quick-tools {
    flex-direction: column;
  }

  .template-grid {
    grid-template-columns: 1fr;
  }
}

// 深色模式适配
[data-theme="dark"] {
  .preview-content {
    background-color: var(--edu-color-gray-800);
    border-color: var(--edu-color-gray-600);
  }

  .ai-suggestions .suggestion-item:hover {
    background-color: var(--edu-primary-900);
  }

  .editor-toolbar,
  .chapter-settings {
    background-color: var(--edu-color-gray-800);
    border-color: var(--edu-color-gray-600);
  }
}

// 动画效果
.chapter-node {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.suggestion-item,
.resource-item,
.template-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.suggestion-item:hover,
.resource-item:hover,
.template-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
