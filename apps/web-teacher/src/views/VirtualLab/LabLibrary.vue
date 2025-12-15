<template>
  <TeacherWorkspaceLayout
    title="实验管理"
    subtitle="构建 AI 赋能实验流程，管理资源与监控执行"
    v-model:leftCollapsed="leftSidebarCollapsed"
    :rightCollapsible="false"
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
      <div class="sidebar-section">
        <h4 class="sidebar-title">筛选</h4>
        <div class="filter-stack">
          <el-select v-model="storeSubject" placeholder="学科" disabled class="w-full mb-2">
            <el-option :label="subjectDisplayName" :value="teacherSubject" />
          </el-select>
          <el-select v-model="selectedGrade" placeholder="年级" clearable class="w-full mb-2">
            <el-option value="" label="全部年级" />
            <el-option v-for="grade in grades" :key="grade.value" :label="grade.label" :value="grade.value" />
          </el-select>
          <el-select v-model="selectedDuration" placeholder="时长" clearable class="w-full mb-2">
            <el-option value="" label="全部时长" />
            <el-option value="short" label="30 分钟内" />
            <el-option value="medium" label="30-60 分钟" />
            <el-option value="long" label="60 分钟以上" />
          </el-select>
          <el-select v-model="selectedType" placeholder="实验类型" clearable class="w-full mb-2">
            <el-option value="" label="全部类型" />
            <el-option value="playground" label="编程练习" />
            <el-option value="data-lab" label="数据实验" />
            <el-option value="robotics" label="机器人" />
            <el-option value="model-training" label="模型训练" />
          </el-select>
        </div>

        <h4 class="sidebar-title mt-4">快捷操作</h4>
        <div class="lab-quick-actions">
           <el-button type="primary" size="small" style="width: 100%; margin-bottom: 8px;" @click="createNewLab">
              <el-icon class="mr-1"><Plus /></el-icon> 创建实验
           </el-button>
           <el-button type="default" size="small" style="width: 100%; margin-bottom: 8px;" @click="importLab">
              <el-icon class="mr-1"><Upload /></el-icon> 导入模板
           </el-button>
        </div>
      </div>
    </template>

    <div class="lab-library-content page-surface">
      <!-- 视图切换和工具栏 -->
      <div class="content-toolbar">
        <div class="toolbar-left">
          <el-radio-group v-model="viewMode" size="default">
            <el-radio-button label="grid">
              <el-icon><Grid /></el-icon> 网格
            </el-radio-button>
            <el-radio-button label="list">
              <el-icon><List /></el-icon> 列表
            </el-radio-button>
          </el-radio-group>
          <span class="lab-count">共 {{ filteredLabs.length }} 个实验</span>
        </div>
        <div class="toolbar-right">
          <el-input
            v-model="searchQuery"
            placeholder="搜索实验名称..."
            clearable
            style="width: 240px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </div>

      <!-- 实验列表内容 -->
      <div v-if="filteredLabs.length === 0" class="empty-state">
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
              <!-- Grid View Cover / List View Icon -->
              <div class="lab-cover" v-if="viewMode === 'grid'" :style="{ backgroundImage: `url(${lab.cover || defaultCover})` }">
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
                </div>
              </div>

              <!-- 实验信息 -->
              <div class="lab-info">
                <div class="lab-header">
                  <div class="flex items-center gap-2"> 
                      <el-tag v-if="viewMode === 'list'" :type="getTypeTag(lab.type)" size="small">{{ getTypeLabel(lab.type) }}</el-tag>
                      <h3 class="lab-title" @click="viewLabDetail(lab)">{{ lab.title }}</h3>
                  </div>
                  
                  <el-dropdown trigger="click" @command="(cmd) => handleLabCommand(cmd, lab)">
                    <span class="lab-more">
                      <el-icon><MoreFilled /></el-icon>
                    </span>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="edit">编辑实验</el-dropdown-item>
                        <el-dropdown-item command="duplicate">复制实验</el-dropdown-item>
                        <el-dropdown-item command="delete" divided style="color: var(--el-color-danger)">删除</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
                
                <p class="lab-desc" v-if="viewMode === 'list'">{{ lab.description }}</p>

                <div class="lab-stats">
                  <div class="stat-item">
                    <el-icon><Timer /></el-icon>
                    <span class="stat-value">{{ getDurationName(lab.duration) }}</span>
                  </div>
                  <div class="stat-item">
                     <el-icon><User /></el-icon>
                     <span class="stat-value">{{ lab.usage }} 次使用</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Footer Actions for Grid View -->
            <footer class="lab-card__footer" v-if="viewMode === 'grid'">
              <div class="lab-card__actions">
                <el-button size="small" @click="previewLab(lab)">
                  <el-icon class="mr-1"><Monitor /></el-icon> 预览
                </el-button>
                <el-button size="small" type="primary" @click="publishLab(lab)">
                  <el-icon class="mr-1"><Upload /></el-icon> 分配
                </el-button>
              </div>
            </footer>
          </EduCard>
        </div>
      </div>
    </div>
  </TeacherWorkspaceLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus, Upload, Search, Grid, List, MoreFilled, Monitor,
  MagicStick, Timer, User, VideoPlay, Edit
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

import TeacherWorkspaceLayout from '@/components/layout/TeacherWorkspaceLayout.vue'
import WorkspacePrimaryToolbar from '@/components/workspace/WorkspacePrimaryToolbar.vue' // Assuming existed
import { EduCard } from '@reopeninnolab/ui-kit'
import { useAppStore } from '@/stores/app'
import { storeToRefs } from 'pinia'

// Types
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
  aiEnabled?: boolean
  cover?: string
}

const router = useRouter()
const appStore = useAppStore()
const { selectedSubject: storeSubject } = storeToRefs(appStore)

// State
const leftSidebarCollapsed = ref(false)
const viewMode = ref<'grid' | 'list'>('grid')
const searchQuery = ref('')
const selectedGrade = ref('')
const selectedDuration = ref('')
const selectedType = ref('')

// Constants / Mocks
const defaultCover = 'https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'

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
    published: true,
    aiEnabled: true,
    cover: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80'
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
    published: true,
    aiEnabled: true,
    cover: 'https://images.unsplash.com/photo-1535378437327-10eff3b3ee38?auto=format&fit=crop&w=800&q=80'
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
    published: true,
    aiEnabled: false,
    cover: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80'
  }
])

// Computed
const teacherSubject = computed(() => {
  const subject = storeSubject.value
  if (subject && subject !== 'all' && subject !== 'my-subjects') {
    return subject
  }
  return 'ai'
})

const subjectDisplayName = computed(() => {
    const map: any = { ai: '人工智能' }
    return map[teacherSubject.value] || '人工智能'
})

const filteredLabs = computed(() => {
  return labs.value.filter(lab => {
    // Basic filtering logic
    const matchesSearch = !searchQuery.value || lab.title.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesGrade = !selectedGrade.value || lab.grade.toString() === selectedGrade.value
    const matchesDuration = !selectedDuration.value || lab.duration === selectedDuration.value
    const matchesType = !selectedType.value || lab.type === selectedType.value
    return matchesSearch && matchesGrade && matchesDuration && matchesType
  })
})

// Methods
const createNewLab = () => router.push('/labs/create')
const importLab = () => router.push('/labs/import')
const editLab = (lab: Lab) => router.push(`/labs/${lab.id}/edit`)
const viewLabDetail = (lab: Lab) => router.push(`/labs/${lab.id}`)
const runLab = (lab: Lab) => window.open(`/lab/run/${lab.id}`, '_blank')
const previewLab = (lab: Lab) => router.push(`/labs/${lab.id}/preview`)
const publishLab = (lab: Lab) => ElMessage.success('分配班级功能开发中')

const handleLabCommand = (cmd: string, lab: Lab) => {
    if (cmd === 'edit') editLab(lab)
    else if (cmd === 'delete') ElMessage.success('删除成功')
}

// Helpers
const getTypeTag = (type: string) => {
    const map: any = { playground: 'success', 'data-lab': 'warning', robotics: 'danger', 'model-training': 'primary' }
    return map[type] || ''
}

const getTypeLabel = (type: string) => {
    const map: any = { playground: '编程', 'data-lab': '数据', robotics: '机器人', 'model-training': '模型' }
    return map[type] || type
}

const getDurationName = (d: string) => {
    const map: any = { short: '< 30min', medium: '30-60min', long: '> 60min' }
    return map[d] || d
}

</script>

<style scoped lang="scss">
.lab-library-content {
  display: flex;
  flex-direction: column;
  gap: var(--edu-space-section);
}

.sidebar-section {
  margin-bottom: 24px;
}

.sidebar-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--edu-text-secondary);
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.content-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  .toolbar-left {
     display: flex;
     align-items: center;
     gap: 16px;
  }
  
  .lab-count {
     color: var(--edu-text-secondary);
     font-size: 14px;
  }
}

.lab-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  
  &.is-list {
     grid-template-columns: 1fr;
  }
}

.lab-card {
   height: 100%;
   display: flex;
   flex-direction: column;
   transition: transform 0.2s;
   
   &:hover {
      transform: translateY(-4px);
      
      .lab-actions-overlay {
         opacity: 1;
      }
   }
}

.lab-card__inner {
   flex: 1;
   display: flex;
   flex-direction: column;
}

.is-list .lab-card__inner {
   flex-direction: row;
   align-items: center;
   padding: 16px;
   gap: 24px;
}

.lab-cover {
   height: 180px;
   background-size: cover;
   background-position: center;
   position: relative;
   
   .lab-badges {
      position: absolute;
      top: 12px;
      left: 12px;
      display: flex;
      gap: 8px;
   }
}

.lab-actions-overlay {
   position: absolute;
   inset: 0;
   background: rgba(0,0,0,0.4);
   display: flex;
   align-items: center;
   justify-content: center;
   gap: 12px;
   opacity: 0;
   transition: opacity 0.2s;
   backdrop-filter: blur(2px);
}

.lab-info {
   padding: 16px;
   flex: 1;
   display: flex;
   flex-direction: column;
   gap: 8px;
}

.lab-header {
   display: flex;
   justify-content: space-between;
   align-items: flex-start;
}

.lab-title {
   margin: 0;
   font-size: 16px;
   font-weight: 600;
   color: var(--edu-text-primary);
   cursor: pointer;
   
   &:hover {
      color: var(--edu-primary-500);
   }
}

.lab-more {
   cursor: pointer;
   color: var(--edu-text-tertiary);
   
   &:hover {
      color: var(--edu-text-primary);
   }
}

.lab-desc {
   font-size: 14px;
   color: var(--edu-text-secondary);
   flex: 1;
}

.lab-stats {
   display: flex;
   gap: 16px;
   margin-top: auto;
   padding-top: 12px;
   
   .stat-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--edu-text-secondary);
   }
}

.lab-card__footer {
   padding: 12px 16px;
   border-top: 1px solid var(--edu-border-base);
   display: flex;
   justify-content: flex-end;
}
</style>
