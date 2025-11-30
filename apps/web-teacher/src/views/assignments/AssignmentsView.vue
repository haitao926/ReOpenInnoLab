<template>
  <CanvasWorkspaceLayout
    title="作业管理"
    subtitle="统一作业管理流程，包含创建、批改、反馈、数据分析"
    v-model:leftCollapsed="leftSidebarCollapsed"
    v-model:rightCollapsed="rightSidebarCollapsed"
  >
    <template #header-controls>
      <WorkspacePrimaryToolbar
        :create-button-text="'布置作业'"
        :import-button-text="'导入作业'"
        :show-ai-button="false"
        @create="createAssignment"
        @import="importAssignments"
      />
    </template>

    <template #summary>
      <EduCard
        v-for="card in summaryCards"
        :key="card.id"
        variant="glass"
        size="sm"
        class="summary-card"
        :hoverable="true"
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
        <h4 class="sidebar-title">筛选</h4>
        <div class="filter-stack">
          <el-select v-model="selectedStatus" placeholder="作业状态" clearable class="w-full mb-2">
            <el-option value="" label="全部" />
            <el-option value="pending" label="待批改" />
            <el-option value="graded" label="已批改" />
            <el-option value="overdue" label="逾期未交" />
          </el-select>
          <el-select v-model="selectedCourse" placeholder="所属课程" clearable class="w-full mb-2">
            <el-option value="" label="全部课程" />
            <el-option v-for="course in courses" :key="course.id" :label="course.name" :value="course.id" />
          </el-select>
          <el-select v-model="selectedClass" placeholder="班级" clearable class="w-full mb-2">
            <el-option value="" label="全部班级" />
            <el-option v-for="classItem in classes" :key="classItem.id" :label="classItem.name" :value="classItem.id" />
          </el-select>
        </div>

        <h4 class="sidebar-title mt-4">快捷标签</h4>
        <div class="filter-tags">
          <el-tag
            v-for="tag in quickFilters"
            :key="tag.key"
            :effect="activeQuickFilters.includes(tag.key) ? 'dark' : 'plain'"
            :type="activeQuickFilters.includes(tag.key) ? 'primary' : 'info'"
            class="filter-tag mb-2 mr-2 cursor-pointer"
            @click="toggleQuickFilter(tag.key)"
          >
            {{ tag.label }}
          </el-tag>
        </div>
      </div>

      <div class="sidebar-section mt-6">
        <h4 class="sidebar-title">快捷操作</h4>
        <div class="action-list">
          <el-button type="primary" size="small" class="w-full mb-2" @click="createAssignment">
            <el-icon class="mr-1"><EditPen /></el-icon> 布置作业
          </el-button>
          <el-button size="small" class="w-full mb-2" @click="importAssignments">
            <el-icon class="mr-1"><Upload /></el-icon> 导入作业
          </el-button>
          <el-button size="small" class="w-full mb-2" @click="openFeedbackTemplates">
            <el-icon class="mr-1"><Document /></el-icon> 常用评语
          </el-button>
          <el-button size="small" class="w-full" @click="generateFeedback">
            <el-icon class="mr-1"><MagicStick /></el-icon> AI 生成反馈
          </el-button>
        </div>
      </div>
      
      <div class="sidebar-section mt-6">
         <h4 class="sidebar-title">近期提醒</h4>
         <div class="reminder-list">
            <div v-for="reminder in reminders" :key="reminder.id" class="reminder-item text-xs text-gray-400 mb-1">
              <span class="reminder-label block text-gray-300">{{ reminder.label }}</span>
              <span class="reminder-time">{{ reminder.time }}</span>
            </div>
         </div>
      </div>
    </template>

    <template #right>
      <div class="sidebar-section">
        <h4 class="sidebar-title">数据概览</h4>
        <div class="insights-overview grid grid-cols-3 gap-2 text-center">
          <div class="insight-item bg-gray-800 p-2 rounded">
            <div class="insight-label text-xs text-gray-400">待批改</div>
            <div class="insight-value text-lg font-bold text-blue-400">{{ pendingCount }}</div>
          </div>
          <div class="insight-item bg-gray-800 p-2 rounded">
            <div class="insight-label text-xs text-gray-400">已批改</div>
            <div class="insight-value text-lg font-bold text-green-400">{{ gradedCount }}</div>
          </div>
          <div class="insight-item bg-gray-800 p-2 rounded">
            <div class="insight-label text-xs text-gray-400">完成率</div>
            <div class="insight-value text-lg font-bold text-purple-400">{{ completionRate }}%</div>
          </div>
        </div>
      </div>

      <div class="sidebar-section mt-6">
        <h4 class="sidebar-title">教学资源</h4>
        <div class="resource-list space-y-2">
          <div v-for="resource in assignmentResources" :key="resource.id" class="resource-item flex items-center bg-gray-800 p-2 rounded hover:bg-gray-700 transition-colors">
            <div class="resource-icon w-8 h-8 rounded flex items-center justify-center mr-2 text-white" :style="{ backgroundColor: resource.color }">
              <el-icon><component :is="resource.icon" /></el-icon>
            </div>
            <div class="resource-content flex-1 min-w-0">
              <div class="resource-title text-sm font-medium text-gray-200 truncate">{{ resource.title }}</div>
              <div class="resource-desc text-xs text-gray-400 truncate">{{ resource.description }}</div>
            </div>
            <el-button text size="small" @click="openResource(resource)">查看</el-button>
          </div>
        </div>
      </div>

      <div class="sidebar-section mt-6">
        <h4 class="sidebar-title">批改协作</h4>
        <div class="collaboration-list space-y-2">
          <div v-for="item in gradingBacklog" :key="item.id" class="collaboration-item text-xs bg-gray-800 p-2 rounded border-l-2 border-blue-500">
            <div class="collaboration-text text-gray-300 mb-1">{{ item.text }}</div>
            <div class="collaboration-time text-gray-500">{{ item.time }}</div>
          </div>
        </div>
      </div>
    </template>

    <!-- 作业管理标签页 -->
    <el-tabs v-model="activeTab" class="main-tabs">
      <!-- 作业列表 -->
      <el-tab-pane label="作业列表" name="assignments">
        <div class="tab-content">
          <EduCard variant="elevated" class="assignments-header-card">
            <template #header>
              <div class="assignments-header">
                <div class="assignments-info">
                  <h3 class="assignments-title">作业管理</h3>
                  <p class="assignments-subtitle">统一作业管理流程，包含创建、批改、反馈、数据分析</p>
                </div>
                <div class="assignments-actions">
                  <el-input
                    v-model="searchKeyword"
                    placeholder="搜索作业或学生..."
                    style="width: 300px;"
                    :prefix-icon="Search"
                    clearable
                    @clear="handleSearch"
                    @keyup.enter="handleSearch"
                  />
                  <el-button type="primary" @click="handleSearch">搜索</el-button>
                  <el-button @click="refreshList">
                    <el-icon><Refresh /></el-icon>
                  </el-button>
                </div>
              </div>
            </template>

            <!-- 作业列表表格 -->
            <el-table
              v-loading="loading"
              :data="filteredAssignments"
              style="width: 100%"
              row-key="id"
              stripe
            >
              <el-table-column prop="title" label="作业标题" min-width="200">
                <template #default="{ row }">
                  <div class="assignment-title-cell">
                    <span class="assignment-icon">
                      <el-icon><component :is="getAssignmentIcon(row.type)" /></el-icon>
                    </span>
                    <div class="assignment-info">
                      <div class="title-text">{{ row.title }}</div>
                      <div class="tags">
                        <el-tag size="small" effect="plain">{{ getAssignmentTypeLabel(row.type) }}</el-tag>
                        <el-tag v-if="row.isGroup" size="small" type="warning" effect="plain">小组作业</el-tag>
                      </div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column prop="courseName" label="所属课程" width="150" />
              <el-table-column prop="className" label="班级" width="120" />
              
              <el-table-column prop="deadline" label="截止时间" width="160">
                <template #default="{ row }">
                  <span :class="{ 'text-red-500': isOverdue(row.deadline) }">
                    {{ formatDate(row.deadline) }}
                  </span>
                </template>
              </el-table-column>
              
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getStatusType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
                </template>
              </el-table-column>
              
              <el-table-column label="提交进度" width="180">
                <template #default="{ row }">
                  <div class="progress-cell">
                    <el-progress 
                      :percentage="calculateProgress(row.submittedCount, row.totalCount)" 
                      :status="getProgressStatus(row.submittedCount, row.totalCount)"
                    />
                    <span class="progress-text">{{ row.submittedCount }}/{{ row.totalCount }}</span>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="操作" width="200" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="viewAssignment(row)">详情</el-button>
                  <el-button link type="primary" size="small" @click="gradeAssignment(row)">批改</el-button>
                  <el-button link type="primary" size="small" @click="editAssignment(row)">编辑</el-button>
                  <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, row)">
                    <el-button link type="info" size="small">
                      更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="publish" v-if="row.status === 'draft'">发布</el-dropdown-item>
                        <el-dropdown-item command="stats">统计分析</el-dropdown-item>
                        <el-dropdown-item command="export">导出成绩</el-dropdown-item>
                        <el-dropdown-item command="delete" divided class="text-red-500">删除</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </template>
              </el-table-column>
            </el-table>

            <div class="pagination-container">
              <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                :total="total"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
              />
            </div>
          </EduCard>
        </div>
      </el-tab-pane>

      <!-- 批改工作台 -->
      <el-tab-pane label="批改工作台" name="grading">
        <div class="tab-content empty-placeholder">
          <el-empty description="批改工作台功能开发中..." />
        </div>
      </el-tab-pane>

      <!-- 成绩分析 -->
      <el-tab-pane label="成绩分析" name="analytics">
        <div class="tab-content empty-placeholder">
          <el-empty description="成绩分析功能开发中..." />
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 弹窗组件 -->
    <AssignmentCreateDialog v-model="createDialogVisible" @success="handleCreateSuccess" />
    <AssignmentImportDialog v-model="importDialogVisible" @success="handleImportSuccess" />
    
  </CanvasWorkspaceLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  EditPen, Upload, Document, MagicStick, Search, Refresh, 
  ArrowDown, Timer, Collection, DataAnalysis, Notebook 
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import CanvasWorkspaceLayout from '@/components/layout/CanvasWorkspaceLayout.vue'
import WorkspacePrimaryToolbar from '@/components/layout/WorkspacePrimaryToolbar.vue'
import { EduCard } from '@reopeninnolab/ui-kit'

// 侧边栏状态
const leftSidebarCollapsed = ref(false)
const rightSidebarCollapsed = ref(false)

// 标签页状态
const activeTab = ref('assignments')

// 搜索和筛选
const searchKeyword = ref('')
const selectedStatus = ref('')
const selectedCourse = ref('')
const selectedClass = ref('')
const activeQuickFilters = ref<string[]>([])

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(100)
const loading = ref(false)

// 弹窗状态
const createDialogVisible = ref(false)
const importDialogVisible = ref(false)

// 模拟数据 - 摘要卡片
const summaryCards = [
  { id: 1, label: '待批改作业', value: '24', icon: 'Timer', gradient: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)' },
  { id: 2, label: '今日截止', value: '3', icon: 'Timer', gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
  { id: 3, label: '平均分', value: '85.4', icon: 'DataAnalysis', gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)' },
  { id: 4, label: '提交率', value: '92%', icon: 'Collection', gradient: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)' }
]

// 模拟数据 - 课程和班级
const courses = [
  { id: 'c1', name: 'Python 基础入门' },
  { id: 'c2', name: 'Web 前端开发' },
  { id: 'c3', name: '人工智能导论' }
]

const classes = [
  { id: 'cl1', name: '高一(1)班' },
  { id: 'cl2', name: '高一(2)班' },
  { id: 'cl3', name: '高二(1)班' }
]

// 模拟数据 - 快捷标签
const quickFilters = [
  { key: 'urgent', label: '急需批改' },
  { key: 'recent', label: '最近提交' },
  { key: 'low_score', label: '低分预警' }
]

// 模拟数据 - 提醒
const reminders = [
  { id: 1, label: 'Python 作业截止提醒', time: '2小时后' },
  { id: 2, label: 'Web 开发作业待批改', time: '5份待批' }
]

// 模拟数据 - 统计
const pendingCount = ref(24)
const gradedCount = ref(156)
const completionRate = ref(92)

// 模拟数据 - 资源
const assignmentResources = [
  { id: 1, title: 'Python 编程规范', description: '作业评分标准参考', icon: 'Notebook', color: '#409EFF' },
  { id: 2, title: 'Web 项目评分表', description: '前端大作业评分细则', icon: 'Document', color: '#67C23A' }
]

// 模拟数据 - 协作
const gradingBacklog = [
  { id: 1, text: '张老师批改了 5 份作业', time: '10分钟前' },
  { id: 2, text: '李老师发布了新作业', time: '30分钟前' }
]

// 模拟数据 - 作业列表
const assignments = ref([
  {
    id: 'a1',
    title: 'Python 基础语法练习',
    type: 'coding',
    courseName: 'Python 基础入门',
    className: '高一(1)班',
    deadline: '2025-12-01T23:59:59',
    status: 'published',
    submittedCount: 42,
    totalCount: 45,
    isGroup: false
  },
  {
    id: 'a2',
    title: '个人博客网站设计',
    type: 'project',
    courseName: 'Web 前端开发',
    className: '高一(2)班',
    deadline: '2025-12-05T23:59:59',
    status: 'published',
    submittedCount: 15,
    totalCount: 40,
    isGroup: true
  },
  {
    id: 'a3',
    title: 'AI 伦理探讨',
    type: 'essay',
    courseName: '人工智能导论',
    className: '高二(1)班',
    deadline: '2025-11-28T23:59:59',
    status: 'graded',
    submittedCount: 38,
    totalCount: 38,
    isGroup: false
  }
])

// 计算属性 - 过滤后的作业
const filteredAssignments = computed(() => {
  return assignments.value.filter(item => {
    if (searchKeyword.value && !item.title.includes(searchKeyword.value)) return false
    if (selectedStatus.value && getStatusCategory(item.status) !== selectedStatus.value) return false
    // 更多过滤逻辑...
    return true
  })
})

// 方法
const toggleQuickFilter = (key: string) => {
  const index = activeQuickFilters.value.indexOf(key)
  if (index > -1) {
    activeQuickFilters.value.splice(index, 1)
  } else {
    activeQuickFilters.value.push(key)
  }
}

const createAssignment = () => {
  createDialogVisible.value = true
}

const importAssignments = () => {
  importDialogVisible.value = true
}

const openFeedbackTemplates = () => {
  ElMessage.info('打开常用评语模板')
}

const generateFeedback = () => {
  ElMessage.success('AI 正在生成反馈建议...')
}

const openResource = (resource: any) => {
  ElMessage.info(`查看资源: ${resource.title}`)
}

const handleSearch = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 500)
}

const refreshList = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('列表已刷新')
  }, 500)
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  refreshList()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  refreshList()
}

const handleCreateSuccess = () => {
  createDialogVisible.value = false
  refreshList()
  ElMessage.success('作业布置成功')
}

const handleImportSuccess = () => {
  importDialogVisible.value = false
  refreshList()
  ElMessage.success('作业导入成功')
}

// 辅助方法
const getAssignmentIcon = (type: string) => {
  switch (type) {
    case 'coding': return 'Monitor'
    case 'project': return 'Collection'
    case 'essay': return 'Document'
    default: return 'Notebook'
  }
}

const getAssignmentTypeLabel = (type: string) => {
  switch (type) {
    case 'coding': return '编程练习'
    case 'project': return '项目实战'
    case 'essay': return '论文写作'
    default: return '普通作业'
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString()
}

const isOverdue = (dateStr: string) => {
  return new Date(dateStr) < new Date()
}

const getStatusCategory = (status: string) => {
  if (status === 'published') return 'pending'
  if (status === 'graded') return 'graded'
  return status
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'draft': return '草稿'
    case 'published': return '进行中'
    case 'graded': return '已结束'
    default: return status
  }
}

const getStatusType = (status: string) => {
  switch (status) {
    case 'draft': return 'info'
    case 'published': return 'primary'
    case 'graded': return 'success'
    default: return ''
  }
}

const calculateProgress = (submitted: number, total: number) => {
  if (total === 0) return 0
  return Math.round((submitted / total) * 100)
}

const getProgressStatus = (submitted: number, total: number) => {
  const percentage = calculateProgress(submitted, total)
  if (percentage >= 100) return 'success'
  if (percentage >= 60) return 'warning'
  return 'exception'
}

const viewAssignment = (row: any) => {
  ElMessage.info(`查看作业: ${row.title}`)
}

const gradeAssignment = (row: any) => {
  ElMessage.info(`批改作业: ${row.title}`)
}

const editAssignment = (row: any) => {
  ElMessage.info(`编辑作业: ${row.title}`)
}

const handleCommand = (command: string, row: any) => {
  ElMessage.info(`执行操作: ${command} - ${row.title}`)
}

onMounted(() => {
  refreshList()
})
</script>

<style scoped lang="scss">
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

.summary-card {
  height: 100%;
  
  &__content {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  &__icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 24px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  &__text {
    display: flex;
    flex-direction: column;
  }
  
  &__value {
    font-size: 24px;
    font-weight: 700;
    color: var(--edu-text-primary);
    line-height: 1.2;
  }
  
  &__label {
    font-size: 12px;
    color: var(--edu-text-secondary);
  }
}

.assignments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  
  .assignments-info {
    .assignments-title {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 4px 0;
    }
    
    .assignments-subtitle {
      font-size: 13px;
      color: var(--edu-text-secondary);
      margin: 0;
    }
  }
  
  .assignments-actions {
    display: flex;
    gap: 12px;
  }
}

.assignment-title-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  
  .assignment-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background-color: var(--edu-bg-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--edu-primary-500);
  }
  
  .assignment-info {
    .title-text {
      font-weight: 500;
      margin-bottom: 4px;
    }
    
    .tags {
      display: flex;
      gap: 4px;
    }
  }
}

.progress-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .el-progress {
    flex: 1;
  }
  
  .progress-text {
    font-size: 12px;
    color: var(--edu-text-secondary);
    width: 60px;
    text-align: right;
  }
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.empty-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
}
</style>
