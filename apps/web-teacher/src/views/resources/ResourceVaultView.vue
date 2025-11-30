<template>
  <CanvasWorkspaceLayout
    title="资源中心"
    subtitle="管理和发现优质教学资源，AI智能推荐匹配教学内容"
    v-model:leftCollapsed="leftSidebarCollapsed"
    v-model:rightCollapsed="rightSidebarCollapsed"
  >
    <template #header-controls>
      <div class="workspace-actions">
        <el-button type="primary" @click="showUploadModal = true">
          <el-icon><Upload /></el-icon>
          上传资源
        </el-button>
        <el-button @click="showImportModal = true">
          <el-icon><Download /></el-icon>
          批量导入
        </el-button>
        <el-dropdown @command="handleMoreAction">
          <el-button>
            更多<el-icon><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="export">导出资源</el-dropdown-item>
              <el-dropdown-item command="sync">同步云端</el-dropdown-item>
              <el-dropdown-item command="settings">资源设置</el-dropdown-item>
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
        <h4 class="section-title">资源来源</h4>
        <div class="source-filter">
          <div
            v-for="source in sourceTypes"
            :key="source.value"
            class="source-item"
            :class="{ active: selectedSource === source.value }"
            @click="filterBySource(source.value)"
          >
            <span class="source-icon" :style="{ backgroundColor: source.color }">
              <el-icon><component :is="source.icon" /></el-icon>
            </span>
            <div class="source-info">
              <span class="source-name">{{ source.name }}</span>
              <span class="source-count">{{ source.count }} 个</span>
            </div>
          </div>
        </div>
      </div>

      <div class="sidebar-section">
        <h4 class="section-title">授权状态</h4>
        <div class="license-filter">
          <div
            v-for="license in licenseTypes"
            :key="license.value"
            class="license-item"
            :class="{ active: selectedLicense === license.value }"
            @click="filterByLicense(license.value)"
          >
            <EduTag :variant="license.variant" size="sm">
              {{ license.name }}
            </EduTag>
            <span class="license-count">{{ license.count }}</span>
          </div>
        </div>
      </div>

      <div class="sidebar-section">
        <h4 class="section-title">热门标签</h4>
        <div class="tag-filter">
          <div class="tag-cloud">
            <span
              v-for="tag in popularTags"
              :key="tag.name"
              class="tag-item"
              :class="{ active: selectedTags.includes(tag.name) }"
              @click="toggleTag(tag.name)"
            >
              #{{ tag.name }}
            </span>
          </div>
        </div>
      </div>

      <div class="sidebar-section">
        <h4 class="section-title">学科分类</h4>
        <div class="subject-filter">
          <div
            v-for="subject in subjects"
            :key="subject.value"
            class="subject-item"
            :class="{ active: selectedSubject === subject.value }"
            @click="filterBySubject(subject.value)"
          >
            <span class="subject-color" :style="{ backgroundColor: subject.color }"></span>
            <span class="subject-name">{{ subject.name }}</span>
            <span class="subject-count">{{ subject.count }}</span>
          </div>
        </div>
      </div>
    </template>

    <template #right>
      <div class="sidebar-section">
        <h4 class="section-title">AI 智能推荐</h4>
        <div class="ai-recommendations">
          <div v-for="rec in aiRecommendations" :key="rec.id" class="recommendation-card">
            <div class="rec-header">
              <span class="rec-reason">
                <el-icon><MagicStick /></el-icon> {{ rec.reason }}
              </span>
            </div>
            <div class="rec-content">
              <div class="rec-icon">
                <el-icon><component :is="getResourceIcon(rec.type)" /></el-icon>
              </div>
              <div class="rec-info">
                <div class="rec-title">{{ rec.title }}</div>
                <div class="rec-meta">{{ rec.type }} · {{ rec.size }}</div>
              </div>
            </div>
            <el-button size="small" text bg type="primary" class="rec-action">查看详情</el-button>
          </div>
        </div>
      </div>

      <div class="sidebar-section">
        <h4 class="section-title">我的收藏</h4>
        <div class="favorites-list">
          <div v-for="fav in favorites" :key="fav.id" class="favorite-item">
            <div class="fav-icon">
              <el-icon><StarFilled /></el-icon>
            </div>
            <div class="fav-info">
              <div class="fav-title">{{ fav.title }}</div>
              <div class="fav-date">{{ fav.date }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="sidebar-section">
        <h4 class="section-title">引用统计</h4>
        <div class="usage-stats">
          <div class="stat-item">
            <div class="stat-label">今日引用</div>
            <div class="stat-value">{{ todayUsage }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">本周引用</div>
            <div class="stat-value">{{ weekUsage }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">总引用数</div>
            <div class="stat-value">{{ totalUsage }}</div>
          </div>
          <div class="usage-chart">
            <div class="chart-placeholder">
              <el-icon><TrendCharts /></el-icon>
              <span>引用趋势图</span>
            </div>
          </div>
        </div>
      </div>

      <div class="sidebar-section">
        <h4 class="section-title">版权信息</h4>
        <div class="copyright-info">
          <div class="copyright-item">
            <span class="copyright-label">授权类型</span>
            <span class="copyright-value">Creative Commons</span>
          </div>
          <div class="copyright-item">
            <span class="copyright-label">使用条款</span>
            <span class="copyright-value">教育用途</span>
          </div>
          <div class="copyright-item">
            <span class="copyright-label">归属要求</span>
            <span class="copyright-value">需要署名</span>
          </div>
        </div>
      </div>
    </template>

        <div class="resources-container">
          <!-- 网格视图 -->
          <div v-if="viewMode === 'grid'" class="resources-grid">
            <div
              v-for="resource in filteredResources"
              :key="resource.id"
              class="resource-card"
              :class="{
                'resource-card--selected': selectedResources.includes(resource.id),
                'resource-card--featured': resource.featured
              }"
              @click="toggleResourceSelection(resource.id)"
            >
              <div class="resource-thumbnail">
                <div class="thumbnail-container">
                  <img
                    v-if="resource.thumbnail"
                    :src="resource.thumbnail"
                    :alt="resource.title"
                    class="thumbnail-image"
                    @error="handleImageError"
                  />
                  <div v-else class="thumbnail-placeholder">
                    <el-icon><component :is="getResourceIcon(resource.type)" /></el-icon>
                  </div>
                  <div class="thumbnail-overlay">
                    <el-checkbox
                      :model-value="selectedResources.includes(resource.id)"
                      @change="toggleResourceSelection(resource.id)"
                      @click.stop
                    />
                    <div class="thumbnail-actions">
                      <el-button
                        type="primary"
                        size="small"
                        @click.stop="previewResource(resource)"
                      >
                        <el-icon><View /></el-icon>
                        预览
                      </el-button>
                    </div>
                  </div>
                </div>
                <div class="resource-badges">
                  <EduTag v-if="resource.source === 'ai'" variant="ai" size="xs">
                    AI生成
                  </EduTag>
                  <EduTag v-if="resource.featured" variant="warning" size="xs">
                    精选
                  </EduTag>
                  <EduTag :variant="getSubjectVariant(resource.subject)" size="xs">
                    {{ getSubjectName(resource.subject) }}
                  </EduTag>
                </div>
              </div>

              <div class="resource-content">
                <div class="resource-header">
                  <h4 class="resource-title">{{ resource.title }}</h4>
                  <div class="resource-rating">
                    <el-icon
                      v-for="i in 5"
                      :key="i"
                      :class="{ 'is-active': i <= resource.rating }"
                    >
                      <Star />
                    </el-icon>
                    <span class="rating-value">{{ resource.rating }}/5</span>
                  </div>
                </div>

                <p class="resource-description">{{ resource.description }}</p>

                <div class="resource-meta">
                  <div class="meta-item">
                    <el-icon><User /></el-icon>
                    <span>{{ resource.author }}</span>
                  </div>
                  <div class="meta-item">
                    <el-icon><Clock /></el-icon>
                    <span>{{ formatDate(resource.createdAt) }}</span>
                  </div>
                  <div class="meta-item">
                    <el-icon><DataAnalysis /></el-icon>
                    <span>{{ resource.usageCount }} 次引用</span>
                  </div>
                </div>

                <div class="resource-tags">
                  <EduTag
                    v-for="tag in resource.tags.slice(0, 3)"
                    :key="tag"
                    size="xs"
                    class="resource-tag"
                  >
                    {{ tag }}
                  </EduTag>
                  <span v-if="resource.tags.length > 3" class="more-tags">
                    +{{ resource.tags.length - 3 }}
                  </span>
                </div>

                <div class="resource-footer">
                  <div class="resource-license">
                    <EduTag :variant="getLicenseVariant(resource.license)" size="xs">
                      {{ getLicenseText(resource.license) }}
                    </EduTag>
                  </div>
                  <div class="resource-actions">
                    <el-button size="small" @click.stop="useResource(resource)">
                      <el-icon><Plus /></el-icon>
                      使用
                    </el-button>
                    <el-dropdown trigger="click" @command="(cmd) => handleResourceAction(cmd, resource)">
                      <el-button size="small" text @click.stop>
                        <el-icon><MoreFilled /></el-icon>
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item command="edit">编辑</el-dropdown-item>
                          <el-dropdown-item command="share">分享</el-dropdown-item>
                          <el-dropdown-item command="duplicate">复制</el-dropdown-item>
                          <el-dropdown-item command="export">导出</el-dropdown-item>
                          <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 列表视图 -->
          <div v-else class="resources-list">
            <el-table
              :data="filteredResources"
              style="width: 100%"
              v-loading="loading"
              @selection-change="handleSelectionChange"
            >
              <el-table-column type="selection" width="55" />
              <el-table-column label="资源信息" min-width="300">
                <template #default="{ row }">
                  <div class="resource-info">
                    <div class="resource-info-main">
                      <h4 class="resource-title">{{ row.title }}</h4>
                      <p class="resource-description">{{ row.description }}</p>
                      <div class="resource-meta">
                        <EduTag :variant="getSubjectVariant(row.subject)" size="sm">
                          {{ getSubjectName(row.subject) }}
                        </EduTag>
                        <EduTag v-if="row.source === 'ai'" variant="ai" size="sm">
                          AI生成
                        </EduTag>
                        <span class="resource-author">{{ row.author }}</span>
                      </div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="type" label="类型" width="120">
                <template #default="{ row }">
                  <EduTag :variant="getTypeVariant(row.type)" size="sm">
                    {{ getTypeText(row.type) }}
                  </EduTag>
                </template>
              </el-table-column>
              <el-table-column prop="rating" label="评分" width="100">
                <template #default="{ row }">
                  <div class="rating-display">
                    <span class="rating-value">{{ row.rating }}</span>
                    <span class="rating-total">/5</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="usageCount" label="引用次数" width="120" />
              <el-table-column prop="createdAt" label="创建时间" width="160">
                <template #default="{ row }">
                  {{ formatDate(row.createdAt) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="200" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" size="small" @click="previewResource(row)">
                    预览
                  </el-button>
                  <el-button size="small" @click="useResource(row)">
                    使用
                  </el-button>
                  <el-dropdown trigger="click" @command="(cmd) => handleResourceAction(cmd, row)">
                    <el-button size="small" text>
                      <el-icon><MoreFilled /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="edit">编辑</el-dropdown-item>
                        <el-dropdown-item command="share">分享</el-dropdown-item>
                        <el-dropdown-item command="duplicate">复制</el-dropdown-item>
                        <el-dropdown-item command="export">导出</el-dropdown-item>
                        <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 空状态 -->
          <div v-if="filteredResources.length === 0" class="empty-state">
            <el-empty description="暂无资源">
              <el-button type="primary" @click="showUploadModal = true">
                <el-icon><Upload /></el-icon>
                上传资源
              </el-button>
            </el-empty>
          </div>
        </div>

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="filteredResources.length"
            :page-sizes="[12, 24, 48, 96]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </EduCard>
    </div>

    <!-- 上传模态框 -->
    <el-dialog
      v-model="showUploadModal"
      title="上传资源"
      width="600px"
      :before-close="handleCloseUpload"
    >
      <div class="upload-content">
        <el-upload
          drag
          multiple
          :file-list="uploadFiles"
          :before-upload="beforeUpload"
          :http-request="handleFileUpload"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
          accept="*"
        >
          <el-icon class="el-icon--upload"><Upload /></el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持各种教学资源格式，单个文件不超过 100MB
            </div>
          </template>
        </el-upload>

        <el-form :model="resourceForm" :rules="resourceRules" label-width="100px">
          <el-form-item label="资源标题" prop="title">
            <el-input v-model="resourceForm.title" placeholder="请输入资源标题" />
          </el-form-item>
          <el-form-item label="资源描述" prop="description">
            <el-input
              v-model="resourceForm.description"
              type="textarea"
              :rows="3"
              placeholder="请描述资源内容和用途"
            />
          </el-form-item>
          <el-form-item label="学科分类" prop="subject">
            <el-select v-model="resourceForm.subject" placeholder="选择学科">
              <el-option
                v-for="subject in subjects"
                :key="subject.value"
                :label="subject.name"
                :value="subject.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="资源标签">
            <el-select
              v-model="resourceForm.tags"
              multiple
              filterable
              allow-create
              placeholder="添加标签"
            >
              <el-option
                v-for="tag in suggestedTags"
                :key="tag"
                :label="tag"
                :value="tag"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCloseUpload">取消</el-button>
          <el-button type="primary" :loading="uploading" @click="completeUpload">
            确认上传
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 预览模态框 -->
    <el-dialog
      v-model="showPreviewModal"
      :title="currentPreviewResource?.title"
      width="80%"
      fullscreen
      :before-close="handleClosePreview"
    >
      <div class="preview-content">
        <div class="preview-toolbar">
          <div class="toolbar-left">
            <el-button-group>
              <el-button @click="reloadPreview">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </el-button-group>
          </div>
          <div class="toolbar-right">
            <el-button type="primary" @click="useResource(currentPreviewResource)">
              <el-icon><Plus /></el-icon>
              使用资源
            </el-button>
          </div>
        </div>
        <div class="preview-frame">
          <div v-if="currentPreviewResource" class="resource-preview">
            <div class="preview-header">
              <h3>{{ currentPreviewResource.title }}</h3>
              <div class="preview-meta">
                <EduTag :variant="getSubjectVariant(currentPreviewResource.subject)">
                  {{ getSubjectName(currentPreviewResource.subject) }}
                </EduTag>
                <span>作者：{{ currentPreviewResource.author }}</span>
                <span>评分：{{ currentPreviewResource.rating }}/5</span>
              </div>
            </div>
            <div class="preview-body">
              <p>{{ currentPreviewResource.description }}</p>
              <div class="preview-content">
                <!-- 根据资源类型显示不同的预览内容 -->
                <div v-if="currentPreviewResource.type === 'document'" class="document-preview">
                  <el-icon><Document /></el-icon>
                  <p>文档预览功能</p>
                </div>
                <div v-else-if="currentPreviewResource.type === 'image'" class="image-preview">
                  <img :src="currentPreviewResource.content" :alt="currentPreviewResource.title" />
                </div>
                <div v-else-if="currentPreviewResource.type === 'video'" class="video-preview">
                  <video :src="currentPreviewResource.content" controls />
                </div>
                <div v-else class="file-preview">
                  <el-icon><Document /></el-icon>
                  <p>文件预览功能</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
    </el-dialog>
  </CanvasWorkspaceLayout>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  Upload, Download, ArrowDown, Search, Grid, List, MagicStick,
  TrendCharts, User, Clock, DataAnalysis, Star, FolderOpened,
  Share, View, MoreFilled, Plus, Refresh, Document, Warning
} from '@element-plus/icons-vue'

import CanvasWorkspaceLayout from '@/components/layout/CanvasWorkspaceLayout.vue'
import { EduCard, EduTag } from '@reopeninnolab/ui-kit'
import { formatDate } from '@/utils/date'

interface Resource {
  id: string
  title: string
  description: string
  type: 'document' | 'image' | 'video' | 'audio' | 'interactive' | 'template'
  subject: string
  author: string
  thumbnail?: string
  content?: string
  tags: string[]
  rating: number
  usageCount: number
  source: 'self' | 'school' | 'market' | 'ai'
  license: 'cc' | 'commercial' | 'educational' | 'custom'
  createdAt: Date
  updatedAt: Date
  featured: boolean
  aiRecommended?: boolean
  matchScore?: number
}

interface AIRecommendation {
  id: string
  title: string
  description: string
  matchType: 'high' | 'medium' | 'low'
  score: number
  resourceId: string
}

// 响应式数据
const leftSidebarCollapsed = ref(false)
const rightSidebarCollapsed = ref(false)
const searchKeyword = ref('')
const selectedSource = ref('')
const selectedLicense = ref('')
const selectedSubject = ref('')
const selectedTags = ref<string[]>([])
const viewMode = ref<'grid' | 'list'>('grid')
const sortBy = ref('newest')
const loading = ref(false)
const showUploadModal = ref(false)
const showPreviewModal = ref(false)
const showImportModal = ref(false)
const currentPreviewResource = ref<Resource | null>(null)
const uploading = ref(false)
const selectedResources = ref<string[]>([])
const uploadFiles = ref<any[]>([])

const resourceForm = reactive({
  title: '',
  description: '',
  subject: '',
  tags: [] as string[]
})

const resourceRules: FormRules = {
  title: [
    { required: true, message: '请输入资源标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在2到100个字符之间', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入资源描述', trigger: 'blur' },
    { min: 10, max: 500, message: '描述长度在10到500个字符之间', trigger: 'blur' }
  ],
  subject: [
    { required: true, message: '请选择学科', trigger: 'change' }
  ]
}

const pagination = reactive({
  page: 1,
  pageSize: 12
})

// 数据源
const sourceTypes = ref([
  { name: '自建资源', value: 'self', icon: 'User', color: '#4ecdc4', count: 156 },
  { name: '校级资源', value: 'school', icon: 'School', color: '#45b7d1', count: 89 },
  { name: '市场资源', value: 'market', icon: 'ShoppingCart', color: '#96ceb4', count: 234 },
  { name: 'AI生成', value: 'ai', icon: 'MagicStick', color: '#ffb347', count: 67 }
])

const licenseTypes = ref([
  { name: 'Creative Commons', value: 'cc', variant: 'info', count: 198 },
  { name: '商业授权', value: 'commercial', variant: 'warning', count: 145 },
  { name: '教育用途', value: 'educational', variant: 'success', count: 167 },
  { name: '自定义', value: 'custom', variant: 'default', count: 36 }
])

const subjects = ref([
  { name: '语文', value: 'language', color: '#ef4444' },
  { name: '数学', value: 'math', color: '#f59e0b' },
  { name: '英语', value: 'english', color: '#10b981' },
  { name: '物理', value: 'physics', color: '#3b82f6' },
  { name: '化学', value: 'chemistry', color: '#8b5cf6' },
  { name: '生物', value: 'biology', color: '#06b6d4' },
  { name: '历史', value: 'history', color: '#84cc16' },
  { name: '地理', value: 'geography', color: '#f97316' },
  { name: '美术', value: 'art', color: '#ec4899' },
  { name: '音乐', value: 'music', color: '#14b8a6' }
])

const popularTags = ref([
  { name: 'PPT模板', weight: 2 },
  { name: '教学视频', weight: 3 },
  { name: '习题集', weight: 2 },
  { name: '实验指导', weight: 1 },
  { name: '课程设计', weight: 2 },
  { name: '互动课件', weight: 3 },
  { name: '素材库', weight: 1 },
  { name: '教学案例', weight: 2 }
])

const suggestedTags = [
  'PPT模板', '教学视频', '习题集', '实验指导', '课程设计', '互动课件',
  '素材库', '教学案例', '思维导图', '学习工具', '评估量表', '参考资料'
]

const resources = ref<Resource[]>([
  {
    id: '1',
    title: '高中物理力学实验指导手册',
    description: '包含16个经典力学实验的详细操作步骤、安全注意事项和数据分析方法，适合高中物理实验教学使用。',
    type: 'document',
    subject: 'physics',
    author: '王老师',
    thumbnail: '/thumbnails/physics-lab.jpg',
    tags: ['实验指导', '高中物理', '力学', '教学资源'],
    rating: 5,
    usageCount: 289,
    source: 'school',
    license: 'educational',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    featured: true,
    aiRecommended: true,
    matchScore: 95
  },
  {
    id: '2',
    title: '数学函数图像生成器',
    description: 'AI智能生成各类数学函数图像，支持参数调节和实时预览，帮助老师快速制作函数教学素材。',
    type: 'interactive',
    subject: 'math',
    author: 'AI助手',
    thumbnail: '/thumbnails/math-generator.jpg',
    tags: ['AI生成', '数学工具', '函数图像', '互动课件'],
    rating: 4,
    usageCount: 156,
    source: 'ai',
    license: 'cc',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
    featured: false,
    aiRecommended: true,
    matchScore: 88
  },
  {
    id: '3',
    title: '英语单词记忆卡片套装',
    description: '包含3000个高频英语单词的记忆卡片，配有图片、例句和音频，支持多种记忆模式。',
    type: 'template',
    subject: 'english',
    author: '李老师',
    thumbnail: '/thumbnails/english-cards.jpg',
    tags: ['英语词汇', '记忆卡片', '学习工具', '音频资源'],
    rating: 4,
    usageCount: 234,
    source: 'market',
    license: 'commercial',
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-16'),
    featured: true,
    aiRecommended: false,
    matchScore: 76
  },
  {
    id: '4',
    title: '化学分子结构3D模型库',
    description: '包含200+个常见化学分子的3D结构模型，支持旋转、缩放查看，适合化学教学演示。',
    type: 'interactive',
    subject: 'chemistry',
    author: '张老师',
    thumbnail: '/thumbnails/chemistry-3d.jpg',
    tags: ['化学模型', '3D演示', '分子结构', '互动教学'],
    rating: 5,
    usageCount: 412,
    source: 'self',
    license: 'cc',
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-22'),
    featured: true,
    aiRecommended: true,
    matchScore: 92
  }
])

const aiRecommendations = ref<AIRecommendation[]>([
  {
    id: 'ai-1',
    title: '电磁感应实验动画',
    description: '基于您的物理课程推荐，包含完整的实验演示动画和数据分析工具。',
    matchType: 'high',
    score: 95,
    resourceId: '5'
  },
  {
    id: 'ai-2',
    title: '生物细胞分裂过程',
    description: '与您的生物教学进度匹配的细胞分裂全过程动画演示。',
    matchType: 'medium',
    score: 82,
    resourceId: '6'
  },
  {
    id: 'ai-3',
    title: '历史时间轴模板',
    description: '适合历史课程的时间轴展示模板，帮助梳理历史事件脉络。',
    matchType: 'low',
    score: 68,
    resourceId: '7'
  }
])

// 计算属性
const summaryCards = computed(() => [
  {
    id: 'total',
    label: '资源总量',
    value: `${resources.value.length}`,
    icon: FolderOpened,
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    id: 'ai',
    label: 'AI推荐权重',
    value: '78%',
    icon: MagicStick,
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  {
    id: 'recent',
    label: '本周新增',
    value: '12',
    icon: TrendCharts,
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  }
])

const filteredResources = computed(() => {
  let filtered = resources.value

  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(resource =>
      resource.title.toLowerCase().includes(keyword) ||
      resource.description.toLowerCase().includes(keyword) ||
      resource.tags.some(tag => tag.toLowerCase().includes(keyword)) ||
      resource.author.toLowerCase().includes(keyword)
    )
  }

  // 来源过滤
  if (selectedSource.value) {
    filtered = filtered.filter(resource => resource.source === selectedSource.value)
  }

  // 授权过滤
  if (selectedLicense.value) {
    filtered = filtered.filter(resource => resource.license === selectedLicense.value)
  }

  // 学科过滤
  if (selectedSubject.value) {
    filtered = filtered.filter(resource => resource.subject === selectedSubject.value)
  }

  // 标签过滤
  if (selectedTags.value.length > 0) {
    filtered = filtered.filter(resource =>
      selectedTags.value.some(tag => resource.tags.includes(tag))
    )
  }

  // 排序
  switch (sortBy.value) {
    case 'newest':
      filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      break
    case 'popular':
      filtered.sort((a, b) => b.usageCount - a.usageCount)
      break
    case 'rating':
      filtered.sort((a, b) => b.rating - a.rating)
      break
    case 'aiRecommended':
      filtered.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      break
  }

  return filtered
})

const todayUsage = computed(() => 45)
const weekUsage = computed(() => 238)
const totalUsage = computed(() => resources.value.reduce((sum, resource) => sum + resource.usageCount, 0))

// 方法
const filterBySource = (source: string) => {
  selectedSource.value = source === selectedSource.value ? '' : source
}

const filterByLicense = (license: string) => {
  selectedLicense.value = license === selectedLicense.value ? '' : license
}

const filterBySubject = (subject: string) => {
  selectedSubject.value = subject === selectedSubject.value ? '' : subject
}

const toggleTag = (tag: string) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
  }
}

const getSubjectVariant = (subject: string): string => {
  const variants: Record<string, string> = {
    physics: 'primary',
    chemistry: 'success',
    math: 'warning',
    biology: 'info',
    language: 'danger',
    english: 'success',
    history: 'warning',
    geography: 'info',
    art: 'danger',
    music: 'info'
  }
  return variants[subject] || 'default'
}

const getSubjectName = (subject: string): string => {
  const subjectObj = subjects.value.find(s => s.value === subject)
  return subjectObj?.name || subject
}

const getTypeVariant = (type: string): string => {
  const variants: Record<string, string> = {
    document: 'info',
    image: 'success',
    video: 'warning',
    audio: 'primary',
    interactive: 'danger',
    template: 'default'
  }
  return variants[type] || 'default'
}

const getTypeText = (type: string): string => {
  const types: Record<string, string> = {
    document: '文档',
    image: '图片',
    video: '视频',
    audio: '音频',
    interactive: '互动',
    template: '模板'
  }
  return types[type] || type
}

const getLicenseVariant = (license: string): string => {
  const variants: Record<string, string> = {
    cc: 'info',
    commercial: 'warning',
    educational: 'success',
    custom: 'default'
  }
  return variants[license] || 'default'
}

const getLicenseText = (license: string): string => {
  const licenses: Record<string, string> = {
    cc: 'CC协议',
    commercial: '商业',
    educational: '教育',
    custom: '自定义'
  }
  return licenses[license] || license
}

const getMatchTypeText = (type: string): string => {
  const types: Record<string, string> = {
    high: '高匹配',
    medium: '中匹配',
    low: '低匹配'
  }
  return types[type] || type
}

const getResourceIcon = (type: string): string => {
  const icons: Record<string, string> = {
    document: 'Document',
    image: 'Picture',
    video: 'VideoCamera',
    audio: 'Microphone',
    interactive: 'Grid',
    template: 'FolderOpened'
  }
  return icons[type] || 'Document'
}

const toggleResourceSelection = (resourceId: string) => {
  const index = selectedResources.value.indexOf(resourceId)
  if (index > -1) {
    selectedResources.value.splice(index, 1)
  } else {
    selectedResources.value.push(resourceId)
  }
}

const handleSelectionChange = (selection: any[]) => {
  selectedResources.value = selection.map(item => item.id)
}

const previewResource = (resource: Resource) => {
  currentPreviewResource.value = resource
  showPreviewModal.value = true
}

const useResource = (resource: Resource) => {
  ElMessage.success(`已使用资源：${resource.title}`)
  // 增加引用次数
  const resourceIndex = resources.value.findIndex(r => r.id === resource.id)
  if (resourceIndex > -1) {
    resources.value[resourceIndex].usageCount++
  }
}

const handleResourceAction = async ({ action, resource }: { action: string; resource: Resource }) => {
  switch (action) {
    case 'edit':
      ElMessage.info(`编辑功能开发中: ${resource.title}`)
      break
    case 'share':
      ElMessage.success(`分享成功: ${resource.title}`)
      break
    case 'duplicate':
      ElMessage.success(`复制成功: ${resource.title}`)
      break
    case 'export':
      ElMessage.info(`导出功能开发中: ${resource.title}`)
      break
    case 'delete':
      await deleteResource(resource)
      break
  }
}

const deleteResource = async (resource: Resource) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除资源 "${resource.title}" 吗？此操作不可撤销。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const index = resources.value.findIndex(item => item.id === resource.id)
    if (index > -1) {
      resources.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  } catch {
    // 用户取消删除
  }
}

const addToCollection = () => {
  ElMessage.success(`已将 ${selectedResources.value.length} 个资源添加到收藏`)
  selectedResources.value = []
}

const batchShare = () => {
  ElMessage.success(`批量分享 ${selectedResources.value.length} 个资源`)
  selectedResources.value = []
}

const batchExport = () => {
  ElMessage({ type: 'info', message: '批量导出功能开发中' })
}

const applyRecommendation = (recommendation: AIRecommendation) => {
  ElMessage({ type: 'success', message: `已应用AI推荐：${recommendation.title}` })
}

const beforeUpload = (file: File) => {
  const isLt100M = file.size / 1024 / 1024 < 100
  if (!isLt100M) {
    ElMessage({ type: 'error', message: '文件大小不能超过 100MB' })
    return false
  }
  return false
}

const handleFileUpload = async (options: any) => {
  const file = options.file
  await new Promise(resolve => setTimeout(resolve, 1000))
  ElMessage({ type: 'success', message: `文件 ${file.name} 上传成功` })
}

const handleFileChange = (_file: any, fileList: any[]) => {
  uploadFiles.value = fileList
}

const handleFileRemove = (_file: any, fileList: any[]) => {
  uploadFiles.value = fileList
}

const handleCloseUpload = () => {
  showUploadModal.value = false
  resetUploadForm()
}

const resetUploadForm = () => {
  Object.assign(resourceForm, {
    title: '',
    description: '',
    subject: '',
    tags: []
  })
  uploadFiles.value = []
}

const completeUpload = async () => {
  try {
    uploading.value = true
    await new Promise(resolve => setTimeout(resolve, 2000))

    const newResource: Resource = {
      id: `resource_${Date.now()}`,
      title: resourceForm.title,
      description: resourceForm.description,
      type: 'document',
      subject: resourceForm.subject,
      author: '当前用户',
      tags: resourceForm.tags,
      rating: 0,
      usageCount: 0,
      source: 'self',
      license: 'cc',
      createdAt: new Date(),
      updatedAt: new Date(),
      featured: false
    }

    resources.value.unshift(newResource)
    ElMessage({ type: 'success', message: '资源上传成功' })
    showUploadModal.value = false
    resetUploadForm()
  } catch (error) {
    console.error('上传失败:', error)
    ElMessage({ type: 'error', message: '上传失败' })
  } finally {
    uploading.value = false
  }
}

const handleMoreAction = (command: string) => {
  switch (command) {
    case 'export':
      ElMessage({ type: 'info', message: '导出功能开发中...' })
      break
    case 'sync':
      ElMessage({ type: 'info', message: '同步云端功能开发中...' })
      break
    case 'settings':
      ElMessage({ type: 'info', message: '资源设置功能开发中...' })
      break
  }
}

const handleClosePreview = () => {
  showPreviewModal.value = false
  currentPreviewResource.value = null
}

const reloadPreview = () => {
  ElMessage({ type: 'success', message: '预览已刷新' })
}

const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.src = ''
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
}

const handlePageChange = (page: number) => {
  pagination.page = page
}

// 生命周期
onMounted(() => {
  // 初始化逻辑
})
</script>

<style scoped lang="scss">
.workspace-actions {
  display: flex;
  align-items: center;
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

.source-filter,
.license-filter,
.tag-filter,
.subject-filter {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.source-item,
.license-item,
.subject-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.04);
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;
  color: inherit;

  &:hover {
    transform: translateX(4px);
    background: rgba(99, 102, 241, 0.12);
  }

  &.active {
    background: rgba(99, 102, 241, 0.12);
    color: var(--edu-primary-600);
  }
}

.source-icon,
.subject-color {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.source-info,
.subject-info {
  flex: 1;
  margin-left: 12px;
}

.source-name,
.subject-name {
  font-weight: 600;
  color: var(--edu-text-primary);
}

.source-count,
.subject-count,
.license-count {
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-cloud-item {
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba(99, 102, 241, 0.08);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--edu-text-primary);
  font-weight: 500;

  &:hover {
    background: rgba(99, 102, 241, 0.16);
  }

  &.active {
    background: var(--edu-primary-500);
    color: #fff;
  }
}

.ai-recommendations {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ai-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: rgba(99, 102, 241, 0.08);
  border-radius: 8px;
  font-size: 13px;
  color: var(--edu-text-secondary);
}

.ai-icon {
  color: var(--edu-primary-500);
}

.recommendation-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recommendation-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--edu-color-gray-200);
  border-radius: 12px;
  background: var(--edu-color-white);
}

.recommendation-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin: 0;
}

.recommendation-desc {
  font-size: 12px;
  color: var(--edu-text-secondary);
  margin: 0;
  line-height: 1.4;
}

.recommendation-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.recommendation-score {
  font-size: 11px;
  color: var(--edu-text-secondary);
}

.usage-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.stat-label {
  font-size: 13px;
  color: var(--edu-text-secondary);
}

.stat-value {
  font-weight: 600;
  color: var(--edu-text-primary);
}

.usage-chart {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--edu-color-gray-200);
  border-radius: 8px;
  background: var(--edu-color-gray-50);
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--edu-text-secondary);
  font-size: 12px;
}

.copyright-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.copyright-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.copyright-label {
  color: var(--edu-text-secondary);
}

.copyright-value {
  color: var(--edu-text-primary);
  font-weight: 500;
}

.resources-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.resources-section {
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
  align-items: center;
}

:deep(.resources-section__body) {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.bulk-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--edu-primary-50);
  border-radius: 8px;
  margin-bottom: 16px;
}

.bulk-info {
  font-size: 14px;
  color: var(--edu-primary-600);
}

.bulk-controls {
  display: flex;
  gap: 8px;
}

.resources-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.resources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.resource-card {
  background: var(--edu-color-white);
  border: 1px solid var(--edu-color-gray-200);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  display: flex;
  flex-direction: column;

  &:hover {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    transform: translateY(-4px);
  }

  &--selected {
    border-color: var(--edu-primary-500);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
  }

  &--featured {
    border-left: 4px solid var(--edu-warning-500);
  }
}

.resource-thumbnail {
  position: relative;
  height: 180px;
  background: var(--edu-color-gray-100);
}

.thumbnail-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--edu-color-gray-400);
  font-size: 48px;
}

.thumbnail-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.resource-card:hover .thumbnail-overlay,
.resource-card--selected .thumbnail-overlay {
  opacity: 1;
}

.thumbnail-actions {
  display: flex;
  gap: 8px;
}

.resource-badges {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 6px;
}

.resource-content {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.resource-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.resource-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin: 0;
  line-height: 1.4;
}

.resource-rating {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rating .is-active {
  color: #f39c12;
}

.rating-value {
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.resource-description {
  font-size: 13px;
  color: var(--edu-text-secondary);
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.resource-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.resource-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.resource-tag {
  font-size: 11px;
}

.more-tags {
  font-size: 11px;
  color: var(--edu-text-secondary);
}

.resource-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid var(--edu-color-gray-100);
}

.resource-license {
  display: flex;
  gap: 8px;
}

.resource-actions {
  display: flex;
  gap: 8px;
}

.resources-list {
  width: 100%;
}

.resource-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.resource-info-main {
  flex: 1;
}

.resource-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin: 0;
  line-height: 1.4;
}

.resource-description {
  font-size: 13px;
  color: var(--edu-text-secondary);
  margin: 0;
  line-height: 1.4;
}

.resource-meta {
  display: flex;
  gap: 8px;
  align-items: center;
}

.resource-author {
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.rating-display {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.rating-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--edu-text-primary);
}

.rating-total {
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
}

.upload-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--edu-color-gray-50);
  border-radius: 8px;
}

.toolbar-left {
  display: flex;
  gap: 8px;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

.preview-frame {
  border: 1px solid var(--edu-color-gray-200);
  border-radius: 8px;
  overflow: hidden;
}

.resource-preview {
  padding: 20px;
}

.preview-header {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--edu-color-gray-200);
}

.preview-header h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--edu-text-primary);
}

.preview-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: var(--edu-text-secondary);
}

.preview-body {
  color: var(--edu-text-primary);
  line-height: 1.6;
}

.preview-content {
  margin-top: 16px;
  padding: 20px;
  background: var(--edu-color-gray-50);
  border-radius: 8px;
  text-align: center;
}

.document-preview,
.image-preview,
.video-preview,
.file-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
  color: var(--edu-text-secondary);
}

.image-preview img {
  max-width: 100%;
  max-height: 400px;
  border-radius: 8px;
}

.video-preview video {
  max-width: 100%;
  border-radius: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

// 响应式设计
@media (max-width: 1200px) {
  .section-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .workspace-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .resources-grid {
    grid-template-columns: 1fr;
  }

  .bulk-actions {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .bulk-controls {
    width: 100%;
    justify-content: flex-end;
  }

  .resource-footer {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .resource-actions {
    justify-content: flex-end;
  }
}

// 深色模式适配
[data-theme="dark"] {
  .source-item,
  .license-item,
  .subject-item {
    background: rgba(255, 255, 255, 0.05);

    &:hover {
      background: rgba(99, 102, 241, 0.2);
    }

    &.active {
      background: rgba(99, 102, 241, 0.2);
    }
  }

  .tag-cloud-item {
    background: rgba(255, 255, 255, 0.05);

    &:hover {
      background: rgba(99, 102, 241, 0.2);
    }

    &.active {
      background: var(--edu-primary-600);
    }
  }

  .resource-card {
    background: var(--edu-color-gray-800);
    border-color: var(--edu-color-gray-600);
  }

  .recommendation-item {
    background: var(--edu-color-gray-800);
    border-color: var(--edu-color-gray-600);
  }

  .chart-placeholder {
    background: rgba(255, 255, 255, 0.02);
    border-color: var(--edu-color-gray-600);
  }
}

// 动画效果
.resource-card,
.recommendation-item,
.source-item,
.tag-cloud-item {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.resource-card:hover,
.recommendation-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>