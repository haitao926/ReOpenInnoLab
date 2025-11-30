<template>
  <CanvasWorkspaceLayout
    title="实验管理"
    subtitle="构建 AI 赋能实验流程，管理资源与监控执行"
    v-model:leftCollapsed="leftSidebarCollapsed"
    v-model:rightCollapsed="rightSidebarCollapsed"
  >
    <template #header-controls>
      <WorkspacePrimaryToolbar
        :create-button-text="'创建实验'"
        :import-button-text="'导入模板'"
        :show-ai-button="false"
        @create="createNewLab"
        @import="importLab"
      />
    </template>

  
    <template #left>
      <ManagementSidebarLeft
        :sections="leftSidebarSections"
        @quick-action="handleQuickAction"
        @filter-change="handleFilterChange"
      >
        <!-- 自定义筛选器插槽 -->
        <template #filters="{ data }">
          <div class="lab-filters">
            <el-select v-model="storeSubject" placeholder="学科" disabled>
              <el-option :label="subjectDisplayName" :value="teacherSubject" />
            </el-select>
            <el-select v-model="selectedGrade" placeholder="年级" clearable>
              <el-option value="" label="全部年级" />
              <el-option v-for="grade in grades" :key="grade.value" :label="grade.label" :value="grade.value" />
            </el-select>
            <el-select v-model="selectedDuration" placeholder="时长" clearable>
              <el-option value="" label="全部时长" />
              <el-option value="short" label="30 分钟内" />
              <el-option value="medium" label="30-60 分钟" />
              <el-option value="long" label="60 分钟以上" />
            </el-select>
            <el-select v-model="selectedType" placeholder="实验类型" clearable>
              <el-option value="" label="全部类型" />
              <el-option value="playground" label="编程练习" />
              <el-option value="data-lab" label="数据实验" />
              <el-option value="robotics" label="机器人" />
              <el-option value="model-training" label="模型训练" />
            </el-select>
          </div>
        </template>

        <!-- 自定义快捷操作插槽 -->
        <template #quick-actions="{ data }">
          <div class="lab-quick-actions">
            <el-button type="primary" size="small" style="width: 100%; margin-bottom: 8px;" @click="createNewLab">
              <el-icon><Plus /></el-icon>
              创建实验
            </el-button>
            <el-button type="default" size="small" style="width: 100%; margin-bottom: 8px;" @click="importLab">
              <el-icon><Upload /></el-icon>
              导入模板
            </el-button>
            <el-button type="default" size="small" style="width: 100%;" @click="exportLab">
              <el-icon><Download /></el-icon>
              导出实验
            </el-button>
          </div>
        </template>

        <!-- 自定义教学动态插槽 -->
        <template #activity="{ data }">
          <div class="lab-activity">
            <div v-for="activity in recentLabActivities" :key="activity.id" class="activity-item">
              <span class="activity-icon" :class="`activity-icon--${activity.type}`">
                <el-icon><component :is="activity.icon" /></el-icon>
              </span>
              <div class="activity-content">
                <div class="activity-text">{{ activity.text }}</div>
                <div class="activity-time">{{ formatTime(activity.timestamp) }}</div>
              </div>
            </div>
          </div>
        </template>

        <!-- 自定义模板资源插槽 -->
        <template #resources="{ data }">
          <div class="lab-resources">
            <div v-for="template in labTemplates" :key="template.id" class="resource-item" @click="applyTemplate(template)">
              <div class="resource-icon" :style="{ background: template.color }">
                <el-icon><component :is="template.icon" /></el-icon>
              </div>
              <div class="resource-content">
                <span class="resource-title">{{ template.name }}</span>
                <span class="resource-desc">{{ template.description }}</span>
              </div>
            </div>
          </div>
        </template>
      </ManagementSidebarLeft>
    </template>

    <template #right>
      <ManagementSidebarRight
        :sections="rightSidebarSections"
        @resource-action="handleResourceAction"
        @collaboration-action="handleCollaborationAction"
      >
        <!-- 自定义数据洞察插槽 -->
        <template #insights="{ data }">
          <div class="lab-insights">
            <div v-for="insight in labInsights" :key="insight.id" class="insight-item">
              <div class="insight-icon" :style="{ backgroundColor: insight.color }">
                <el-icon><component :is="insight.icon" /></el-icon>
              </div>
              <div class="insight-content">
                <div class="insight-title">{{ insight.title }}</div>
                <div class="insight-value">{{ insight.value }}</div>
                <div class="insight-change" :class="insight.trend">
                  <el-icon><component :is="insight.trend === 'up' ? 'CaretTop' : 'CaretBottom'" /></el-icon>
                  {{ insight.change }}
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 自定义资源参考插槽 -->
        <template #resources="{ data }">
          <div class="lab-resources">
            <div v-for="resource in labResources" :key="resource.id" class="resource-item">
              <div class="resource-icon" :style="{ backgroundColor: resource.color }">
                <el-icon><component :is="resource.icon" /></el-icon>
              </div>
              <div class="resource-content">
                <div class="resource-title">{{ resource.title }}</div>
                <div class="resource-desc">{{ resource.description }}</div>
                <el-progress :percentage="resource.usage" :color="resource.color" :stroke-width="4" />
              </div>
              <el-button text size="small" @click="openResource(resource)">查看</el-button>
            </div>
          </div>
        </template>
        <!-- 自定义实验监控插槽 -->
        <template #monitoring="{ data }">
          <div class="lab-monitoring">
            <div class="monitoring-overview">
              <div class="monitor-item">
                <div class="monitor-label">运行中</div>
                <div class="monitor-value success">{{ activeLabsCount }}</div>
              </div>
              <div class="monitor-item">
                <div class="monitor-label">异常</div>
                <div class="monitor-value danger">{{ errorLabsCount }}</div>
              </div>
              <div class="monitor-item">
                <div class="monitor-label">资源占用</div>
                <div class="monitor-value warning">{{ resourceUsage }}%</div>
              </div>
            </div>
          </div>
        </template>

        <!-- 自定义设备状态插槽 -->
        <template #devices="{ data }">
          <div class="device-status-list">
            <div v-for="device in connectedDevices" :key="device.id" class="device-item">
              <div class="device-icon" :class="{ active: device.status === 'online' }">
                <el-icon><component :is="device.icon" /></el-icon>
              </div>
              <div class="device-info">
                <div class="device-name">{{ device.name }}</div>
                <div class="device-status">
                  <span class="status-dot" :class="device.status"></span>
                  {{ device.status === 'online' ? '在线' : '离线' }}
                </div>
              </div>
            </div>
          </div>
        </template>
      </ManagementSidebarRight>
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

    <div class="lab-library-content">
      <!-- 视图切换和工具栏 -->
      <div class="content-toolbar">
        <div class="toolbar-left">
          <el-radio-group v-model="viewMode" size="large">
            <el-radio-button label="grid">
              <el-icon><Grid /></el-icon>
              网格视图
            </el-radio-button>
            <el-radio-button label="list">
              <el-icon><List /></el-icon>
              列表视图
            </el-radio-button>
          </el-radio-group>
          <el-divider direction="vertical" />
          <span class="lab-count">共 {{ filteredLabs.length }} 个实验</span>
        </div>
        <div class="toolbar-right">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索实验名称..."
            clearable
            style="width: 240px"
            @change="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-select v-model="sortBy" placeholder="排序方式" style="width: 140px; margin-left: 12px;">
            <el-option label="最近更新" value="updated" />
            <el-option label="创建时间" value="created" />
            <el-option label="名称 A-Z" value="name" />
          </el-select>
        </div>
      </div>

      <!-- 实验列表内容 -->
      <div v-if="loading" class="loading-state">
        <el-skeleton :rows="3" animated />
      </div>
      
      <div v-else-if="filteredLabs.length === 0" class="empty-state">
        <el-empty description="暂无实验，开始创建您的第一个实验吧" />
        <el-button type="primary" @click="createNewLab">创建实验</el-button>
      </div>

      <div v-else :class="['lab-grid', { 'is-list': viewMode === 'list' }]">
        <div
          v-for="lab in filteredLabs"
          :key="lab.id"
          class="lab-card-wrapper"
        >
          <EduCard
            class="lab-card"
            :variant="viewMode === 'list' ? 'bordered' : 'elevated'"
            :hoverable="true"
            :body-style="{ padding: '0' }"
          >
            <div class="lab-card__inner">
              <!-- 封面图 -->
              <div class="lab-cover" :style="{ backgroundImage: `url(${lab.cover || defaultCover})` }">
                <div class="lab-badges">
                  <el-tag :type="getTypeTag(lab.type)" effect="dark" size="small">
                    {{ getTypeLabel(lab.type) }}
                  </el-tag>
                  <el-tag v-if="lab.aiEnabled" type="success" effect="light" size="small" class="ai-badge">
                    <el-icon><MagicStick /></el-icon> AI 辅助
                  </el-tag>
                </div>
                <div class="lab-actions-overlay">
                  <el-button type="primary" circle @click="editLab(lab)">
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button type="success" circle @click="runLab(lab)">
                    <el-icon><VideoPlay /></el-icon>
                  </el-button>
                  <el-button circle @click="viewLabAnalytics(lab)">
                    <el-icon><TrendCharts /></el-icon>
                  </el-button>
                </div>
              </div>

              <!-- 实验信息 -->
              <div class="lab-info">
                <div class="lab-header">
                  <h3 class="lab-title" @click="viewLabDetail(lab)">{{ lab.title }}</h3>
                  <el-dropdown trigger="click" @command="(cmd) => handleLabCommand(cmd, lab)">
                    <span class="lab-more">
                      <el-icon><MoreFilled /></el-icon>
                    </span>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="edit">编辑实验</el-dropdown-item>
                        <el-dropdown-item command="duplicate">复制实验</el-dropdown-item>
                        <el-dropdown-item command="assign">分配给班级</el-dropdown-item>
                        <el-dropdown-item command="delete" divided style="color: var(--el-color-danger)">删除</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-label">预计时长</div>
                    <div class="stat-value">{{ getDurationName(lab.duration) }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 底部操作区域 -->
            <footer class="lab-card__footer">
              <div class="lab-card__actions">
                <el-button size="small" @click="previewLab(lab)">
                  <el-icon><Monitor /></el-icon>
                  预览
                </el-button>
                <el-button size="small" type="primary" @click="publishLab(lab)">
                  <el-icon><Upload /></el-icon>
                  分配班级
                </el-button>
              </div>
            </footer>
          </div>
        </div>

        <el-table v-else :data="filteredLabs" style="width: 100%" border>
          <el-table-column label="实验" min-width="220">
            <template #default="{ row }">
              <div class="lab-row">
                <div class="lab-row__title">{{ row.title }}</div>
                <div class="lab-row__meta">
                  <el-tag :type="getSubjectVariant(row.subject)" size="small">
                    {{ getSubjectName(row.subject) }}
                  </el-tag>
                  <span>{{ getGradeName(row.grade) }}</span>
                  <span>{{ getTypeName(row.type) }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="usage" label="使用次数" width="120" align="center" />
          <el-table-column label="状态" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="row.published ? 'success' : 'info'">
                {{ row.published ? '已发布' : '草稿' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="240" align="center">
            <template #default="{ row }">
              <el-button text size="small" @click="editLab(row)">编辑</el-button>
              <el-button text size="small" @click="duplicateLab(row)">复制</el-button>
              <el-button text size="small" @click="publishLab(row)">发布</el-button>
              <el-button text size="small" @click="viewAnalytics(row)">数据</el-button>
            </template>
          </el-table-column>
        </el-table>
      </EduCard>
    </div>
  </TeacherWorkspaceLayout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus,
  Upload,
  Search,
  Grid,
  MoreFilled,
  Monitor,
  Collection,
  TrendCharts,
  MagicStick,
  Timer,
  DataAnalysis,
  Warning,
  Cpu,
  Document,
  ChatLineRound,
  Histogram,
  Link,
  List,
  Menu,
  Edit,
  CopyDocument,
  User
} from '@element-plus/icons-vue'

import TeacherWorkspaceLayout from '@/components/layout/TeacherWorkspaceLayout.vue'
import ManagementSidebarLeft from '@/components/layout/ManagementSidebarLeft.vue'
import ManagementSidebarRight from '@/components/layout/ManagementSidebarRight.vue'
import WorkspacePrimaryToolbar from '@/components/workspace/WorkspacePrimaryToolbar.vue'
import TimelineSectionCard from '@/components/lab/TimelineSectionCard.vue'
import { EduButton, EduCard } from '@reopeninnolab/ui-kit'
import { useAppStore } from '@/stores/app'
import { storeToRefs } from 'pinia'
import { PAGE_SIDEBAR_CONFIGS } from '@/constants/managementSidebar'

interface Lab {
  id: string
  title: string
  description: string
  subject: string
  grade: number
  duration: 'short' | 'medium' | 'long'
  type: 'playground' | 'data-lab' | 'robotics' | 'model-training'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  usage: number
  published: boolean
}

const router = useRouter()
const appStore = useAppStore()
const { selectedSubject: storeSubject } = storeToRefs(appStore)

const SUBJECT_LABELS: Record<string, string> = {
  ai: '人工智能'
}

const teacherSubject = computed(() => {
  const subject = storeSubject.value
  if (subject && subject !== 'all' && subject !== 'my-subjects') {
    return subject
  }
  return 'ai'
})

const subjectDisplayName = computed(() => SUBJECT_LABELS[teacherSubject.value] || '人工智能')

const leftSidebarCollapsed = ref(false)
const rightSidebarCollapsed = ref(false)

// 侧边栏配置
const leftSidebarSections = computed(() => PAGE_SIDEBAR_CONFIGS.labs.left)
const rightSidebarSections = computed(() => PAGE_SIDEBAR_CONFIGS.labs.right)
const viewMode = ref<'grid' | 'list' | 'timeline'>('timeline')
const viewModeSegments = [
  { label: '时间线', value: 'timeline' },
  { label: '网格', value: 'grid' },
  { label: '列表', value: 'list' }
]
const searchQuery = ref('')
// 直接使用全局状态，不需要本地同步
const selectedGrade = ref('')
const selectedDuration = ref('')
const selectedType = ref('')

const grades = [
  { label: '初一', value: '7' },
  { label: '初二', value: '8' },
  { label: '初三', value: '9' },
  { label: '高一', value: '10' },
  { label: '高二', value: '11' },
  { label: '高三', value: '12' }
]

const labs = ref<Lab[]>([
  {
    id: 'lab-ai-prompts',
    title: '智能提示词调优实验',
    description: '通过多轮提示词对比与评分，优化生成式 AI 在课堂中的输出质量。',
    subject: 'ai',
    grade: 10,
    duration: 'medium',
    type: 'playground',
    difficulty: 'intermediate',
    tags: ['Prompt Engineering', 'AI 助手'],
    usage: 118,
    published: true
  },
  {
    id: 'lab-ai-vision',
    title: 'AI 视觉巡线实训',
    description: '利用视觉识别模型，让机器人完成自主巡线并记录调试数据。',
    subject: 'ai',
    grade: 10,
    duration: 'long',
    type: 'robotics',
    difficulty: 'advanced',
    tags: ['OpenCV', '硬件调试'],
    usage: 134,
    published: true
  },
  {
    id: 'lab-ai-cloud',
    title: 'AI 应用云端部署演练',
    description: '在沙箱环境中练习部署 AI 服务，并配置推理接口监控。',
    subject: 'ai',
    grade: 12,
    duration: 'medium',
    type: 'model-training',
    difficulty: 'intermediate',
    tags: ['DevOps', 'Serverless'],
    usage: 74,
    published: true
  }
])

const filteredLabs = computed(() => {
  return labs.value.filter(lab => {
    const subjectFilter = teacherSubject.value
    const matchesSearch = !searchQuery.value ||
      lab.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      lab.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesSubject = !subjectFilter || lab.subject === subjectFilter
    const matchesGrade = !selectedGrade.value || lab.grade === parseInt(selectedGrade.value, 10)
    const matchesDuration = !selectedDuration.value || lab.duration === selectedDuration.value
    const matchesType = !selectedType.value || lab.type === selectedType.value
    return matchesSearch && matchesSubject && matchesGrade && matchesDuration && matchesType
  })
})

// 时间线实验数据
// TODO: Restore full implementation after fixing compilation issue
const baseTimelineLabs = ref([
  {
    id: "ai-courseflow",
    title: "AI 课堂共创流程",
    subtitle: "围绕提示词设计、代码演练与课堂执行的三阶段实验流程",
    status: "active" as const,
    tag: "进行中",
    tagVariant: "success" as const,
    subject: "ai",
    sections: []
  },
  {
    id: "ai-insight-pipeline",
    title: "AI 数据洞察流程",
    subtitle: "通过数据采集、特征建模与可视化三步构建教学洞察。",
    status: "planning" as const,
    tag: "筹备中",
    tagVariant: "info" as const,
    subject: "ai",
    sections: []
  }
])

const timelineLabs = computed(() => {
  const subject = teacherSubject.value
  if (!subject) {
    return baseTimelineLabs.value
  }
  return baseTimelineLabs.value.filter(lab => lab.subject === subject)
})

const summaryCards = computed(() => [
  {
    id: 'labs',
    label: '实验总数',
    value: `${filteredLabs.value.length}`,
    icon: Collection,
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  },
  {
    id: 'published',
    label: '已发布',
    value: `${filteredLabs.value.filter(lab => lab.published).length}`,
    icon: TrendCharts,
    gradient: 'linear-gradient(135deg, #96fbc4 0%, #f9f586 100%)'
  },
  {
    id: 'usage',
    label: '累计使用',
    value: `${filteredLabs.value.reduce((sum, lab) => sum + lab.usage, 0)}`,
    icon: DataAnalysis,
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  }
])

const baseLabTemplates = ref([
  {
    id: 'template-ai',
    name: 'AI 课堂快速共创',
    description: '涵盖提示词、素材生成与讲稿输出的完整流程',
    icon: MagicStick,
    color: 'linear-gradient(135deg, #7f5eff 0%, #45a3ff 100%)',
    subject: 'ai'
  },
  {
    id: 'template-data',
    name: 'AI 数据洞察',
    description: '预置数据清洗脚本与可视化仪表盘模板，结合 AI 提示辅助分析。',
    icon: DataAnalysis,
    color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    subject: 'ai'
  },
  {
    id: 'template-robotics',
    name: 'AI 视觉巡线',
    description: '提供硬件调试清单与视觉模型训练流程',
    icon: Monitor,
    color: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
    subject: 'ai'
  },
  {
    id: 'template-it',
    name: '云端部署自动化',
    description: '包含容器化步骤与 Serverless 发布指引',
    icon: Cpu,
    color: 'linear-gradient(135deg, #60efff 0%, #0061ff 100%)',
    subject: 'ai'
  }
])

const labTemplates = computed(() => {
  const subject = teacherSubject.value
  if (!subject) {
    return baseLabTemplates.value
  }
  return baseLabTemplates.value.filter(template => template.subject === subject)
})

const baseAISuggestions = ref([
  {
    id: 'suggest-1',
    title: '提升共创效率',
    text: '为提示词调优实验添加“优秀示例”对照，AI 可自动推荐更优模板。',
    icon: MagicStick,
    color: 'rgba(99, 102, 241, 0.18)',
    subject: 'ai'
  },
  {
    id: 'suggest-1b',
    title: '优化数据清洗流程',
    text: '建议为数据科学实验添加数据质量检查清单，减少手动排错时间。',
    icon: DataAnalysis,
    color: 'rgba(14, 165, 233, 0.18)',
    subject: 'ai'
  },
  {
    id: 'suggest-2',
    title: '自动检测资源占用',
    text: '建议开启云端实验的资源阈值提醒，防止 GPU 峰值导致实验中断。',
    icon: Timer,
    color: 'rgba(234, 179, 8, 0.18)',
    subject: 'ai'
  },
  {
    id: 'suggest-3',
    title: '提前发布调试清单',
    text: '为机器人巡线实验推送硬件调试步骤，减少开场故障。',
    icon: Monitor,
    color: 'rgba(249, 115, 22, 0.18)',
    subject: 'ai'
  }
])

const aiSuggestions = computed(() => {
  const subject = teacherSubject.value
  if (!subject) {
    return baseAISuggestions.value
  }
  return baseAISuggestions.value.filter(item => item.subject === subject)
})

const resourceUsage = ref([
  { id: 'cpu', name: 'CPU 资源', description: 'AI 共创实验当前占用 45%', usage: 45, color: '#4f46e5' },
  { id: 'gpu', name: 'GPU 资源', description: '模型训练实验占用 30%', usage: 30, color: '#f97316' },
  { id: 'network', name: '网络带宽', description: '实时数据同步占用 60%', usage: 60, color: '#0ea5e9' }
])

const baseReminders = ref([
  { id: 'reminder-1', text: '“AI 应用部署演练” 需补充安全检查项', icon: Warning, color: '#f97316', subject: 'ai' },
  { id: 'reminder-2', text: '下午 14:00 开启 AI 视觉巡线实验，请提前预热设备', icon: Timer, color: '#4f46e5', subject: 'ai' },
  { id: 'reminder-3', text: 'AI 提示词实验需要上传新的优秀案例', icon: MagicStick, color: '#6366f1', subject: 'ai' }
])

const reminders = computed(() => {
  const subject = teacherSubject.value
  if (!subject) {
    return baseReminders.value
  }
  return baseReminders.value.filter(item => item.subject === subject)
})

const previewSuggestion = (suggestion: any) => {
  router.push('/analytics')
}

const applyTemplate = (template: { id: string; name: string }) => {
  router.push('/labs/create')
}

const createNewLab = () => {
  router.push('/labs/create')
}

const importLab = () => {
  router.push('/labs/import')
}

// 时间线事件处理函数
const handleSectionToggle = (sectionId: string, expanded: boolean) => {
  console.log('Section toggled:', sectionId, expanded)
}

const handleSectionConfigure = (sectionId: string) => {
  ElMessage.info(`配置实验部分: ${sectionId}`)
  router.push(`/labs/configure/${sectionId}`)
}

const handleJupyterLaunch = (sectionId: string) => {
  ElMessage.success('正在启动 Jupyter 环境...')
  // 模拟启动过程
  setTimeout(() => {
    ElMessage.success('Jupyter 环境已启动，正在打开新窗口...')
    window.open('/jupyter/lab', '_blank')
  }, 2000)
}

const handleTrainingStart = (sectionId: string) => {
  ElMessage.success('正在启动模型训练任务...')
  // 模拟训练过程
  setTimeout(() => {
    ElMessage.info('训练任务已开始，预计耗时 15-30 分钟')
  }, 1500)
}

const handleSectionEdit = (sectionId: string) => {
  ElMessage.info(`编辑实验部分: ${sectionId}`)
  router.push(`/labs/section/${sectionId}/edit`)
}

const editLab = (lab: Lab) => {
  router.push(`/labs/${lab.id}/edit`)
}

const duplicateLab = (lab: Lab) => {
  labs.value.push({ ...lab, id: `${lab.id}-copy`, title: `${lab.title}（副本）`, published: false })
}

const publishLab = (lab: Lab) => {
  lab.published = true
}

const previewLab = (lab: Lab) => {
  router.push(`/labs/${lab.id}`)
}

const viewAnalytics = (lab: Lab) => {
  router.push('/analytics')
}

const handleLabAction = (command: string, lab: Lab) => {
  switch (command) {
    case 'edit':
      editLab(lab)
      break
    case 'duplicate':
      duplicateLab(lab)
      break
    case 'publish':
      publishLab(lab)
      break
    case 'analytics':
      viewAnalytics(lab)
      break
  }
}

const openResourceCenter = () => {
  router.push('/resources')
}

const viewLabAnalytics = () => {
  router.push('/analytics')
}

const getSubjectVariant = () => 'primary'

const getSubjectName = () => subjectDisplayName.value

const getGradeVariant = (grade: number): 'primary' | 'success' | 'warning' | 'info' => {
  if (grade <= 9) return 'info'
  if (grade === 10) return 'primary'
  if (grade === 11) return 'success'
  return 'warning'
}

const getGradeName = (grade: number): string => {
  const map: Record<number, string> = {
    7: '初一',
    8: '初二',
    9: '初三',
    10: '高一',
    11: '高二',
    12: '高三'
  }
  return map[grade] || '综合年级'
}

const getTypeName = (type: Lab['type']): string => {
  const map: Record<Lab['type'], string> = {
    playground: '编程练习',
    'data-lab': '数据实验',
    robotics: '机器人',
    'model-training': '模型训练'
  }
  return map[type]
}

const getDifficultyName = (difficulty: Lab['difficulty']) => {
  const map: Record<Lab['difficulty'], string> = {
    beginner: '入门',
    intermediate: '进阶',
    advanced: '挑战'
  }
  return map[difficulty]
}

const getStatusClass = (lab: Lab) => (lab.published ? 'published' : 'draft')
const getStatusText = (lab: Lab) => (lab.published ? '已发布' : '草稿')

// 侧边栏相关数据和方法
const recentLabActivities = [
  {
    id: 1,
    text: '李明完成了"智能提示词调优实验"',
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    type: 'success',
    icon: 'CircleCheck'
  },
  {
    id: 2,
    text: '新实验模板"AI视觉巡线"已发布',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    type: 'info',
    icon: 'Bell'
  },
  {
    id: 3,
    text: '3个实验运行实例需要关注',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    type: 'warning',
    icon: 'Warning'
  }
]

const labInsights = [
  {
    id: 1,
    title: '本周实验',
    value: '8',
    change: '+2',
    trend: 'up',
    icon: 'Monitor',
    color: '#1890ff'
  },
  {
    id: 2,
    title: '参与学生',
    value: '45',
    change: '+12',
    trend: 'up',
    icon: 'User',
    color: '#52c41a'
  },
  {
    id: 3,
    title: '完成率',
    value: '78%',
    change: '+5%',
    trend: 'up',
    icon: 'TrendCharts',
    color: '#722ed1'
  }
]

const labResources = [
  {
    id: 1,
    title: 'CPU使用率',
    description: '实验环境服务器负载',
    usage: 65,
    color: '#1890ff',
    icon: 'Cpu'
  },
  {
    id: 2,
    title: '内存占用',
    description: 'Jupyter环境内存使用',
    usage: 78,
    color: '#52c41a',
    icon: 'Histogram'
  },
  {
    id: 3,
    title: '存储空间',
    description: '实验数据存储使用情况',
    usage: 45,
    color: '#722ed1',
    icon: 'Document'
  }
]

// 侧边栏事件处理
const handleQuickAction = (action: string) => {
  switch (action) {
    case 'create':
      createNewLab()
      break
    case 'import':
      importLab()
      break
    case 'export':
      exportLab()
      break
  }
}

const handleFilterChange = (filters: any) => {
  console.log('Lab filters changed:', filters)
  // 应用筛选逻辑
}

const handleResourceAction = (action: string, id: string | number) => {
  console.log('Resource action:', action, id)
  if (action === 'open') {
    openResource(labResources.find(r => r.id === id))
  }
}

const handleCollaborationAction = (action: string, data: any) => {
  console.log('Collaboration action:', action, data)
}


const exportLab = () => {
  ElMessage.info('导出实验功能开发中...')
}

const formatTime = (timestamp: Date) => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 60) {
    return `${minutes}分钟前`
  } else if (hours < 24) {
    return `${hours}小时前`
  } else {
    return `${days}天前`
  }
}

const openResource = (resource: any) => {
  if (resource) {
    ElMessage.info(`查看资源: ${resource.title}`)
  }
}

// 新增实验卡片相关函数
const getLabTypeIcon = (type: Lab['type']) => {
  const iconMap: Record<Lab['type'], string> = {
    'playground': 'Monitor',
    'data-lab': 'DataAnalysis',
    'robotics': 'Cpu',
    'model-training': 'TrendCharts'
  }
  return iconMap[type] || 'Monitor'
}

const getLabTypeVariant = (type: Lab['type']): 'primary' | 'success' | 'warning' | 'info' | 'danger' => {
  const variantMap: Record<Lab['type'], 'primary' | 'success' | 'warning' | 'info' | 'danger'> = {
    'playground': 'primary',
    'data-lab': 'success',
    'robotics': 'warning',
    'model-training': 'info'
  }
  return variantMap[type] || 'primary'
}

const getDurationName = (duration: Lab['duration']): string => {
  const durationMap: Record<Lab['duration'], string> = {
    'short': '30分钟内',
    'medium': '30-60分钟',
    'long': '60分钟以上'
  }
  return durationMap[duration] || '未知时长'
}
</script>

<style scoped lang="scss">

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

// 时间线视图样式
.timeline-view {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-base);
}

.timeline-sections {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.timeline-card {
  transition: all var(--edu-duration-smooth) var(--edu-easing-in-out);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--edu-shadow-lg);
  }
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

.lab-summary-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
}

.lab-summary-primary {
  display: flex;
  flex: 1 1 auto;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.lab-summary-search {
  flex: 1 1 260px;
}

.lab-summary-select {
  flex: 0 0 180px;
}

.lab-view-toggle {
  flex: 0 0 auto;
}

.view-switcher {
  display: flex;
  align-items: center;
}


.filter-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.template-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.template-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 14px;
  border: none;
  background: rgba(15, 23, 42, 0.04);
  cursor: pointer;
  text-align: left;
}

.template-item:hover {
  background: rgba(99, 102, 241, 0.12);
}

.template-icon {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.template-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.template-title {
  font-weight: 600;
  color: var(--edu-text-primary);
}

.template-desc {
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.04);
}

.suggestion-icon {
  width: 32px;
  height: 32px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #1f2937;
}

.suggestion-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.suggestion-title {
  font-weight: 600;
}

.resource-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.resource-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.resource-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.reminder-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.reminder-item {
  display: flex;
  gap: 10px;
  font-size: 13px;
  color: var(--edu-text-primary);
}

.lab-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.lab-card-panel {
  :deep(.edu-card__body-content) {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
}

.lab-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.lab-panel__info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
}

.lab-panel__filters {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.lab-panel__title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.lab-panel__subtitle {
  margin: 0;
  color: var(--edu-text-secondary);
}

.lab-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.lab-tile {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  border-radius: var(--edu-radius-xl);
  border: 1px solid var(--edu-border-light);
  background: var(--edu-bg-primary);
  box-shadow: var(--edu-shadow-sm);
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    box-shadow: var(--edu-shadow-md);
    transform: translateY(-2px);
  }
}

.lab-tile__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.lab-tile__badge {
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: var(--edu-primary-100);
  color: var(--edu-primary-600);
}

.lab-tile__badge--draft {
  background: var(--edu-gray-100);
  color: var(--edu-gray-600);
}

.lab-tile__more {
  color: var(--edu-text-secondary);
  cursor: pointer;
  transition: color var(--edu-duration-fast);

  &:hover {
    color: var(--edu-primary-600);
  }
}

.lab-tile__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.lab-tile__title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--edu-text-primary);
}

.lab-tile__description {
  margin: 0;
  color: var(--edu-text-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--edu-leading-normal);
}

.lab-tile__meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.lab-tile__stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--edu-bg-secondary);
  border-radius: var(--edu-radius-base);
  font-size: var(--font-size-xs);
  color: var(--edu-text-tertiary);
}

.lab-tile__footer {
  display: flex;
  justify-content: space-between;
}

.lab-row {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);

  &__title {
    font-weight: var(--font-weight-semibold);
    color: var(--edu-text-primary);
  }

  &__meta {
    display: flex;
    gap: var(--spacing-xs);
    align-items: center;
    font-size: var(--font-size-xs);
    color: var(--edu-text-secondary);
  }
}

@media (max-width: 1200px) {
  .lab-panel__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .lab-panel__filters {
    justify-content: flex-start;
    width: 100%;
  }
}

@media (max-width: 768px) {
  .lab-panel__filters {
    flex-direction: column;
    align-items: stretch;
  }

  .lab-search-input {
    min-width: auto;
  }

  .lab-filter-select {
    flex: 1;
  }
}

// 增强实验卡片样式
.lab-card {
  display: flex;
  flex-direction: column;
  background: var(--edu-bg-primary);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--edu-radius-lg);
  overflow: hidden;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);
  cursor: pointer;
  box-shadow: var(--edu-shadow-sm);

  &:hover {
    box-shadow: var(--edu-shadow-md);
    transform: translateY(-2px);
  }

  &--draft {
    border-left: 4px solid var(--edu-color-gray-300);
  }
}

.lab-card__cover {
  position: relative;
  height: 120px;
  background: linear-gradient(135deg, var(--edu-bg-secondary) 0%, var(--edu-bg-tertiary) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.lab-type-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &--playground {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  }

  &--data-lab {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  }

  &--robotics {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  }

  &--model-training {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  }
}

.lab-card:hover .lab-type-icon {
  transform: scale(1.1);
}

.lab-cover__overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.6) 100%);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px;
}

.lab-cover__badge,
.lab-cover__status {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lab-card__content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  flex: 1;
}

.lab-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.lab-card__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--edu-text-primary);
  line-height: 1.4;
}

.lab-card__description {
  color: var(--edu-text-secondary);
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.lab-card__meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--edu-text-secondary);

  .el-icon {
    font-size: 16px;
    color: var(--edu-primary-500);
  }
}

.lab-card__stats {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-group {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
  flex: 1;
  padding: 8px;
  background: var(--edu-bg-secondary);
  border-radius: var(--edu-radius-base);
}

.stat-label {
  font-size: 12px;
  color: var(--edu-text-tertiary);
  font-weight: 500;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--edu-text-primary);

  &--beginner {
    color: var(--edu-success-600);
  }

  &--intermediate {
    color: var(--edu-warning-600);
  }

  &--advanced {
    color: var(--edu-danger-600);
  }
}

.lab-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--edu-border-light);
  background: var(--edu-bg-secondary);
}

.lab-card__actions {
  display: flex;
  gap: 8px;
}

// 兼容旧的 lab-tile 样式
.lab-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.lab-tile {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  border-radius: var(--edu-radius-xl);
  border: 1px solid var(--edu-border-light);
  background: var(--edu-bg-primary);
  box-shadow: var(--edu-shadow-sm);
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    box-shadow: var(--edu-shadow-md);
    transform: translateY(-2px);
  }

  &--draft {
    border-left: 4px solid var(--edu-color-gray-300);
  }
}

@media (prefers-reduced-motion: reduce) {
  .summary-card,
  .template-item,
  .lab-tile,
  .lab-card,
  .suggestion-item {
    transition: none !important;
  }
}
</style>
