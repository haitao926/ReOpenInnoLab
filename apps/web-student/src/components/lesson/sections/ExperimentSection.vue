<template>
  <div class="experiment-section">
    <div class="section-header">
      <h2>{{ section.title }}</h2>
      <div class="section-meta">
        <el-tag :type="getExperimentType(section.data?.experimentType)">
          {{ getExperimentTypeText(section.data?.experimentType) }}
        </el-tag>
        <el-tag :type="getDifficultyType(section.data?.difficulty)">
          {{ getDifficultyText(section.data?.difficulty) }}
        </el-tag>
        <span class="duration">{{ formatDuration(section.duration) }}</span>
      </div>
    </div>

    <div class="content-container">
      <div class="main-content">
        <!-- 实验介绍 -->
        <el-card class="experiment-intro glass-card">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><SetUp /></el-icon>
              <span>实验介绍</span>
            </div>
          </template>

          <div class="intro-content">
            <h3>{{ section.data?.experimentTitle || '实验活动' }}</h3>
            <p class="experiment-description">{{ section.data?.description || '通过动手实验加深对知识的理解' }}</p>

            <div class="experiment-objectives" v-if="section.data?.objectives?.length">
              <h4>实验目标</h4>
              <ul>
                <li v-for="objective in section.data.objectives" :key="objective.id">
                  <el-icon class="objective-icon"><Target /></el-icon>
                  {{ objective.text }}
                </li>
              </ul>
            </div>

            <div class="safety-warning" v-if="section.data?.safetyNotes">
              <el-alert
                title="安全提示"
                type="warning"
                :description="section.data.safetyNotes"
                show-icon
                :closable="false"
              />
            </div>
          </div>
        </el-card>

        <!-- 实验环境 -->
        <div class="experiment-environment">
          <el-card class="glass-card">
            <template #header>
              <div class="card-header">
                <el-icon class="header-icon"><Monitor /></el-icon>
                <span>实验环境</span>
                <el-button size="small" type="primary" @click="startExperiment">
                  开始实验
                </el-button>
              </div>
            </template>

            <div class="environment-content">
              <!-- 虚拟实验室 -->
              <div v-if="section.data?.experimentType === 'virtual'" class="virtual-lab">
                <div class="lab-workspace" ref="labWorkspace">
                  <div class="lab-equipment">
                    <div class="equipment-panel">
                      <h4>实验器材</h4>
                      <div class="equipment-list">
                        <div
                          v-for="equipment in labEquipments"
                          :key="equipment.id"
                          :class="['equipment-item', { selected: equipment.selected }]"
                          @click="selectEquipment(equipment)"
                        >
                          <div class="equipment-icon">
                            <el-icon>
                              <component :is="equipment.icon" />
                            </el-icon>
                          </div>
                          <div class="equipment-info">
                            <div class="equipment-name">{{ equipment.name }}</div>
                            <div class="equipment-desc">{{ equipment.description }}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="experiment-area">
                      <div class="experiment-canvas" ref="experimentCanvas">
                        <!-- 实验操作区域 -->
                        <div class="canvas-placeholder">
                          <el-icon class="canvas-icon"><Beaker /></el-icon>
                          <p>实验操作区</p>
                          <p>点击左侧器材开始实验</p>
                        </div>
                      </div>

                      <div class="experiment-controls">
                        <div class="control-group">
                          <h5>实验控制</h5>
                          <el-button-group>
                            <el-button @click="resetExperiment" :icon="RefreshLeft">重置</el-button>
                            <el-button @click="pauseExperiment" :icon="VideoPause">暂停</el-button>
                            <el-button @click="recordData" :icon="Document">记录</el-button>
                          </el-button-group>
                        </div>

                        <div class="experiment-status">
                          <div class="status-item">
                            <span class="status-label">实验进度</span>
                            <el-progress :percentage="experimentProgress" :stroke-width="8" />
                          </div>
                          <div class="status-item">
                            <span class="status-label">当前步骤</span>
                            <span class="status-value">{{ currentStep }} / {{ totalSteps }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Jupyter Notebook -->
              <div v-else-if="section.data?.experimentType === 'notebook'" class="notebook-lab">
                <div class="notebook-workspace">
                  <div class="notebook-toolbar">
                    <div class="toolbar-left">
                      <el-button-group>
                        <el-button @click="runCell" :icon="VideoPlay" size="small">运行</el-button>
                        <el-button @click="runAll" size="small">运行全部</el-button>
                        <el-button @click="clearOutput" size="small">清除输出</el-button>
                      </el-button-group>
                    </div>
                    <div class="toolbar-right">
                      <el-tag type="success" v-if="kernelConnected">
                        <el-icon><CircleCheck /></el-icon>
                        内核已连接
                      </el-tag>
                      <el-tag type="danger" v-else>
                        <el-icon><CircleClose /></el-icon>
                        内核未连接
                      </el-tag>
                    </div>
                  </div>

                  <div class="notebook-cells" ref="notebookCells">
                    <div
                      v-for="(cell, index) in notebookCells"
                      :key="cell.id"
                      :class="['notebook-cell', `cell-${cell.type}`]"
                    >
                      <div class="cell-header">
                        <span class="cell-number">[{{ index + 1 }}]</span>
                        <el-select v-model="cell.type" size="small">
                          <el-option label="代码" value="code" />
                          <el-option label="文本" value="markdown" />
                        </el-select>
                        <div class="cell-actions">
                          <el-button size="small" text @click="runCell(index)">
                            <el-icon><VideoPlay /></el-icon>
                          </el-button>
                          <el-button size="small" text @click="deleteCell(index)">
                            <el-icon><Delete /></el-icon>
                          </el-button>
                        </div>
                      </div>

                      <div class="cell-content">
                        <div v-if="cell.type === 'code'" class="code-cell">
                          <el-input
                            v-model="cell.content"
                            type="textarea"
                            :rows="4"
                            placeholder="输入Python代码..."
                            class="code-editor"
                          />
                          <div v-if="cell.output" class="cell-output">
                            <pre>{{ cell.output }}</pre>
                          </div>
                        </div>

                        <div v-else class="markdown-cell">
                          <el-input
                            v-model="cell.content"
                            type="textarea"
                            :rows="4"
                            placeholder="输入Markdown文本..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="notebook-footer">
                    <el-button @click="addCell" type="primary" text>
                      <el-icon><Plus /></el-icon>
                      添加单元格
                    </el-button>
                  </div>
                </div>
              </div>

              <!-- 数据分析实验 -->
              <div v-else-if="section.data?.experimentType === 'analysis'" class="analysis-lab">
                <div class="analysis-workspace">
                  <div class="data-panel">
                    <h4>数据集</h4>
                    <div class="dataset-list">
                      <div
                        v-for="dataset in datasets"
                        :key="dataset.id"
                        :class="['dataset-item', { active: dataset.active }]"
                        @click="selectDataset(dataset)"
                      >
                        <div class="dataset-info">
                          <div class="dataset-name">{{ dataset.name }}</div>
                          <div class="dataset-meta">
                            <span>{{ dataset.rows }} 行</span>
                            <span>{{ dataset.columns }} 列</span>
                          </div>
                        </div>
                        <el-icon class="dataset-icon"><Folder /></el-icon>
                      </div>
                    </div>
                  </div>

                  <div class="analysis-area">
                    <div class="analysis-tabs">
                      <el-tabs v-model="activeAnalysisTab">
                        <el-tab-pane label="数据预览" name="preview">
                          <div class="data-preview">
                            <el-table :data="previewData" stripe height="300">
                              <el-table-column
                                v-for="column in previewColumns"
                                :key="column.prop"
                                :prop="column.prop"
                                :label="column.label"
                              />
                            </el-table>
                          </div>
                        </el-tab-pane>

                        <el-tab-pane label="统计分析" name="statistics">
                          <div class="statistics-panel">
                            <div class="stat-cards">
                              <div
                                v-for="stat in statisticsData"
                                :key="stat.name"
                                class="stat-card"
                              >
                                <div class="stat-name">{{ stat.name }}</div>
                                <div class="stat-value">{{ stat.value }}</div>
                              </div>
                            </div>
                          </div>
                        </el-tab-pane>

                        <el-tab-pane label="可视化" name="visualization">
                          <div class="visualization-panel">
                            <div class="chart-controls">
                              <el-select v-model="selectedChartType" placeholder="选择图表类型">
                                <el-option label="散点图" value="scatter" />
                                <el-option label="折线图" value="line" />
                                <el-option label="柱状图" value="bar" />
                                <el-option label="热力图" value="heatmap" />
                              </el-select>
                              <el-button @click="generateChart" type="primary">生成图表</el-button>
                            </div>
                            <div class="chart-container">
                              <div class="chart-placeholder">
                                <el-icon class="chart-icon"><TrendCharts /></el-icon>
                                <p>选择图表类型并生成可视化</p>
                              </div>
                            </div>
                          </div>
                        </el-tab-pane>
                      </el-tabs>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 实验记录 -->
        <el-card class="experiment-record glass-card">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><Document /></el-icon>
              <span>实验记录</span>
              <el-button size="small" @click="exportRecord">导出记录</el-button>
            </div>
          </template>

          <div class="record-content">
            <div class="record-timeline">
              <div
                v-for="record in experimentRecords"
                :key="record.id"
                class="timeline-item"
              >
                <div class="timeline-time">{{ formatTime(record.timestamp) }}</div>
                <div class="timeline-content">
                  <div class="timeline-title">{{ record.title }}</div>
                  <div class="timeline-description">{{ record.description }}</div>
                  <div class="timeline-data" v-if="record.data">
                    <pre>{{ JSON.stringify(record.data, null, 2) }}</pre>
                  </div>
                </div>
              </div>
            </div>

            <div class="record-actions">
              <el-button @click="addManualRecord">手动记录</el-button>
              <el-button @click="clearRecords">清空记录</el-button>
            </div>
          </div>
        </el-card>

        <!-- 实验报告 -->
        <el-card class="experiment-report glass-card">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><Document /></el-icon>
              <span>实验报告</span>
            </div>
          </template>

          <div class="report-content">
            <el-form :model="reportForm" label-width="100px">
              <el-form-item label="实验目的">
                <el-input
                  v-model="reportForm.purpose"
                  type="textarea"
                  :rows="3"
                  placeholder="描述实验的主要目的..."
                />
              </el-form-item>

              <el-form-item label="实验步骤">
                <el-input
                  v-model="reportForm.procedure"
                  type="textarea"
                  :rows="4"
                  placeholder="描述实验的主要步骤..."
                />
              </el-form-item>

              <el-form-item label="实验结果">
                <el-input
                  v-model="reportForm.results"
                  type="textarea"
                  :rows="4"
                  placeholder="描述实验获得的结果..."
                />
              </el-form-item>

              <el-form-item label="结论分析">
                <el-input
                  v-model="reportForm.conclusion"
                  type="textarea"
                  :rows="3"
                  placeholder="分析实验结果并得出结论..."
                />
              </el-form-item>

              <el-form-item>
                <el-button type="primary" @click="submitReport">提交报告</el-button>
                <el-button @click="saveDraft">保存草稿</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-card>
      </div>

      <div class="sidebar-content">
        <!-- 实验进度 -->
        <el-card class="progress-card glass-card">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><TrendCharts /></el-icon>
              <span>实验进度</span>
            </div>
          </template>

          <div class="progress-overview">
            <el-progress
              type="circle"
              :percentage="overallProgress"
              :width="100"
              :stroke-width="8"
            >
              <template #default="{ percentage }">
                <span class="progress-text">{{ percentage }}%</span>
              </template>
            </el-progress>

            <div class="progress-details">
              <div class="detail-item">
                <span class="label">已完成步骤</span>
                <span class="value">{{ completedSteps }}/{{ totalSteps }}</span>
              </div>
              <div class="detail-item">
                <span class="label">实验时长</span>
                <span class="value">{{ formatDuration(experimentTime) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">数据记录</span>
                <span class="value">{{ experimentRecords.length }} 条</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 实验工具 -->
        <el-card class="tools-card glass-card">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><Tools /></el-icon>
              <span>实验工具</span>
            </div>
          </template>

          <div class="experiment-tools">
            <div
              v-for="tool in experimentTools"
              :key="tool.id"
              :class="['tool-item', { active: tool.active }]"
              @click="toggleTool(tool)"
            >
              <div class="tool-icon">
                <el-icon>
                  <component :is="tool.icon" />
                </el-icon>
              </div>
              <div class="tool-name">{{ tool.name }}</div>
            </div>
          </div>
        </el-card>

        <!-- 快速操作 -->
        <el-card class="actions-card glass-card">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><Operation /></el-icon>
              <span>快速操作</span>
            </div>
          </template>

          <div class="action-buttons">
            <el-button
              type="primary"
              @click="askForHelp"
              class="action-btn"
            >
              <el-icon><QuestionFilled /></el-icon>
              寻求帮助
            </el-button>

            <el-button
              type="info"
              @click="viewTutorial"
              class="action-btn"
            >
              <el-icon><VideoPlay /></el-icon>
              查看教程
            </el-button>

            <el-button
              type="success"
              @click="shareResults"
              class="action-btn"
            >
              <el-icon><Share /></el-icon>
              分享结果
            </el-button>

            <el-button
              type="warning"
              @click="saveExperiment"
              class="action-btn"
            >
              <el-icon><Download /></el-icon>
              保存实验
            </el-button>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  SetUp, Monitor, Target, Beaker, RefreshLeft, VideoPause, Document,
  CircleCheck, CircleClose, Delete, Plus, Folder, TrendCharts, Tools,
  Operation, QuestionFilled, VideoPlay, Share, Download, VideoCamera
} from '@element-plus/icons-vue'
import type { LessonSection, SectionProgress, StudentData } from '@/types/lesson'

interface Props {
  section: LessonSection
  progress: SectionProgress
  studentData: StudentData
}

interface Emits {
  (e: 'interaction', interaction: any): void
  (e: 'progress-update', progress: SectionProgress): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 状态
const experimentTime = ref(0)
const currentStep = ref(1)
const totalSteps = ref(5)
const experimentProgress = ref(0)
const completedSteps = ref(0)
const kernelConnected = ref(false)
const activeAnalysisTab = ref('preview')
const selectedChartType = ref('')

// 实验器材
const labEquipments = ref([
  {
    id: '1',
    name: '烧杯',
    description: '玻璃容器',
    icon: 'Beaker',
    selected: false
  },
  {
    id: '2',
    name: '试管',
    description: '小型玻璃管',
    icon: 'TestTube',
    selected: false
  },
  {
    id: '3',
    name: '酒精灯',
    description: '加热设备',
    icon: 'MilkTea',
    selected: false
  }
])

// Notebook单元格
const notebookCells = ref([
  {
    id: 'cell1',
    type: 'code',
    content: '# 在这里输入你的Python代码\nprint("Hello, Experiment!")',
    output: ''
  }
])

// 数据集
const datasets = ref([
  {
    id: '1',
    name: '实验数据集A',
    rows: 100,
    columns: 5,
    active: false
  }
])

// 实验记录
const experimentRecords = ref([
  {
    id: '1',
    title: '实验开始',
    description: '开始进行实验操作',
    timestamp: new Date(),
    data: null
  }
])

// 实验工具
const experimentTools = ref([
  { id: '1', name: '计算器', icon: 'Calculator', active: false },
  { id: '2', name: '计时器', icon: 'Timer', active: false },
  { id: '3', name: '测量器', icon: 'Ruler', active: false }
])

// 报告表单
const reportForm = ref({
  purpose: '',
  procedure: '',
  results: '',
  conclusion: ''
})

// 模拟数据
const previewData = ref([
  { id: 1, name: '样本1', value: 25.5, category: 'A' },
  { id: 2, name: '样本2', value: 30.2, category: 'B' }
])

const previewColumns = ref([
  { prop: 'id', label: 'ID' },
  { prop: 'name', label: '名称' },
  { prop: 'value', label: '数值' },
  { prop: 'category', label: '分类' }
])

const statisticsData = ref([
  { name: '平均值', value: '27.85' },
  { name: '标准差', value: '3.32' },
  { name: '最大值', value: '30.2' },
  { name: '最小值', value: '25.5' }
])

// 计算属性
const overallProgress = computed(() => {
  return Math.round((completedSteps.value / totalSteps.value) * 100)
})

// 方法
const getExperimentType = (type: string) => {
  const typeMap: Record<string, string> = {
    'virtual': 'primary',
    'notebook': 'success',
    'analysis': 'warning',
    'physical': 'info'
  }
  return typeMap[type] || 'default'
}

const getExperimentTypeText = (type: string) => {
  const textMap: Record<string, string> = {
    'virtual': '虚拟实验',
    'notebook': '编程实验',
    'analysis': '数据分析',
    'physical': '物理实验'
  }
  return textMap[type] || '其他'
}

const getDifficultyType = (difficulty: string) => {
  const typeMap: Record<string, string> = {
    'beginner': 'success',
    'intermediate': 'warning',
    'advanced': 'danger'
  }
  return typeMap[difficulty] || 'info'
}

const getDifficultyText = (difficulty: string) => {
  const textMap: Record<string, string> = {
    'beginner': '初级',
    'intermediate': '中级',
    'advanced': '高级'
  }
  return textMap[difficulty] || '未知'
}

const formatDuration = (duration: number) => {
  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 实验操作方法
const startExperiment = () => {
  emit('interaction', {
    type: 'experiment_start',
    data: {
      sectionId: props.section.id,
      startTime: new Date()
    }
  })

  experimentProgress.value = 10
  updateProgress()
  ElMessage.success('实验已开始')
}

const selectEquipment = (equipment: any) => {
  labEquipments.value.forEach(eq => eq.selected = false)
  equipment.selected = true

  emit('interaction', {
    type: 'equipment_select',
    data: {
      sectionId: props.section.id,
      equipmentId: equipment.id,
      equipmentName: equipment.name
    }
  })
}

const resetExperiment = () => {
  currentStep.value = 1
  experimentProgress.value = 0
  emit('interaction', {
    type: 'experiment_reset',
    data: {
      sectionId: props.section.id
    }
  })
}

const pauseExperiment = () => {
  emit('interaction', {
    type: 'experiment_pause',
    data: {
      sectionId: props.section.id,
      currentStep: currentStep.value,
      progress: experimentProgress.value
    }
  })
}

const recordData = () => {
  const record = {
    id: `record_${Date.now()}`,
    title: '数据记录',
    description: '手动记录实验数据',
    timestamp: new Date(),
    data: {
      step: currentStep.value,
      progress: experimentProgress.value
    }
  }

  experimentRecords.value.push(record)

  emit('interaction', {
    type: 'experiment_record',
    data: {
      sectionId: props.section.id,
      record
    }
  })

  ElMessage.success('数据已记录')
}

// Notebook相关方法
const runCell = (index?: number) => {
  const cellIndex = index !== undefined ? index : notebookCells.value.length - 1
  const cell = notebookCells.value[cellIndex]

  if (cell.type === 'code') {
    // 模拟代码执行
    setTimeout(() => {
      cell.output = 'Hello, Experiment!\n执行成功'
    }, 1000)

    emit('interaction', {
      type: 'notebook_run_cell',
      data: {
        sectionId: props.section.id,
        cellIndex,
        code: cell.content
      }
    })
  }
}

const runAll = () => {
  notebookCells.value.forEach((cell, index) => {
    if (cell.type === 'code') {
      runCell(index)
    }
  })
}

const clearOutput = () => {
  notebookCells.value.forEach(cell => {
    cell.output = ''
  })

  emit('interaction', {
    type: 'notebook_clear_output',
    data: {
      sectionId: props.section.id
    }
  })
}

const addCell = () => {
  const newCell = {
    id: `cell_${Date.now()}`,
    type: 'code',
    content: '',
    output: ''
  }

  notebookCells.value.push(newCell)
}

const deleteCell = (index: number) => {
  if (notebookCells.value.length > 1) {
    notebookCells.value.splice(index, 1)
  }
}

// 数据分析相关方法
const selectDataset = (dataset: any) => {
  datasets.value.forEach(ds => ds.active = false)
  dataset.active = true

  emit('interaction', {
    type: 'dataset_select',
    data: {
      sectionId: props.section.id,
      datasetId: dataset.id
    }
  })
}

const generateChart = () => {
  if (!selectedChartType.value) {
    ElMessage.warning('请选择图表类型')
    return
  }

  emit('interaction', {
    type: 'chart_generate',
    data: {
      sectionId: props.section.id,
      chartType: selectedChartType.value
    }
  })

  ElMessage.success(`${selectedChartType.value}图表已生成`)
}

// 工具相关方法
const toggleTool = (tool: any) => {
  tool.active = !tool.active

  emit('interaction', {
    type: 'tool_toggle',
    data: {
      sectionId: props.section.id,
      toolId: tool.id,
      toolName: tool.name,
      active: tool.active
    }
  })
}

// 报告相关方法
const submitReport = () => {
  emit('interaction', {
    type: 'report_submit',
    data: {
      sectionId: props.section.id,
      report: reportForm.value
    }
  })

  completedSteps.value = totalSteps.value
  updateProgress()
  ElMessage.success('实验报告已提交')
}

const saveDraft = () => {
  emit('interaction', {
    type: 'report_save_draft',
    data: {
      sectionId: props.section.id,
      report: reportForm.value
    }
  })

  ElMessage.success('草稿已保存')
}

const exportRecord = () => {
  emit('interaction', {
    type: 'record_export',
    data: {
      sectionId: props.section.id,
      records: experimentRecords.value
    }
  })

  ElMessage.success('实验记录已导出')
}

const addManualRecord = () => {
  const record = {
    id: `manual_${Date.now()}`,
    title: '手动记录',
    description: '用户手动添加的记录',
    timestamp: new Date(),
    data: {}
  }

  experimentRecords.value.push(record)
}

const clearRecords = () => {
  experimentRecords.value = []
  ElMessage.success('记录已清空')
}

// 其他操作方法
const askForHelp = () => {
  emit('interaction', {
    type: 'ask_help',
    data: {
      sectionId: props.section.id
    }
  })

  ElMessage.info('帮助请求已发送给老师')
}

const viewTutorial = () => {
  emit('interaction', {
    type: 'view_tutorial',
    data: {
      sectionId: props.section.id
    }
  })
}

const shareResults = () => {
  emit('interaction', {
    type: 'share_results',
    data: {
      sectionId: props.section.id,
      progress: experimentProgress.value
    }
  })

  ElMessage.success('实验结果已分享')
}

const saveExperiment = () => {
  emit('interaction', {
    type: 'experiment_save',
    data: {
      sectionId: props.section.id,
      progress: experimentProgress.value,
      time: experimentTime.value,
      records: experimentRecords.value
    }
  })

  ElMessage.success('实验状态已保存')
}

const updateProgress = () => {
  emit('progress-update', {
    ...props.progress,
    completionRate: overallProgress.value,
    timeSpent: experimentTime.value
  })
}

const startExperimentTimer = () => {
  setInterval(() => {
    experimentTime.value++
    if (experimentTime.value % 15 === 0) { // 每15秒更新一次进度
      updateProgress()
    }
  }, 1000)
}

// 生命周期
onMounted(() => {
  startExperimentTimer()
})
</script>

<style scoped lang="scss">
.experiment-section {
  padding: 24px;
  height: 100%;
  overflow-y: auto;

  .section-header {
    margin-bottom: 24px;

    h2 {
      margin: 0 0 12px 0;
      font-size: 32px;
      font-weight: 700;
      color: #1f2937;
    }

    .section-meta {
      display: flex;
      align-items: center;
      gap: 12px;

      .duration {
        color: #6b7280;
        font-size: 14px;
      }
    }
  }

  .content-container {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 24px;

    .main-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .sidebar-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
  }
}

.glass-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;

    .header-icon {
      color: #3b82f6;
    }
  }
}

.experiment-intro {
  .intro-content {
    h3 {
      margin: 0 0 16px 0;
      font-size: 20px;
      color: #1f2937;
    }

    .experiment-description {
      color: #4b5563;
      line-height: 1.6;
      margin-bottom: 20px;
    }

    .experiment-objectives {
      margin-bottom: 20px;

      h4 {
        margin: 0 0 12px 0;
        font-size: 16px;
        color: #374151;
      }

      ul {
        margin: 0;
        padding: 0;
        list-style: none;

        li {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          padding: 8px;
          background: #f9fafb;
          border-radius: 6px;

          .objective-icon {
            color: #10b981;
            font-size: 16px;
          }
        }
      }
    }

    .safety-warning {
      margin-top: 16px;
    }
  }
}

.environment-content {
  .lab-workspace {
    .lab-equipment {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 20px;

      .equipment-panel {
        h4 {
          margin: 0 0 16px 0;
          font-size: 16px;
          color: #374151;
        }

        .equipment-list {
          .equipment-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            margin-bottom: 8px;
            cursor: pointer;
            transition: all 0.2s ease;

            &:hover {
              border-color: #3b82f6;
              background: #eff6ff;
            }

            &.selected {
              border-color: #3b82f6;
              background: #3b82f6;
              color: white;

              .equipment-info {
                .equipment-name,
                .equipment-desc {
                  color: white;
                }
              }
            }

            .equipment-icon {
              width: 32px;
              height: 32px;
              background: #f3f4f6;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #6b7280;

              .selected & {
                background: rgba(255, 255, 255, 0.2);
                color: white;
              }
            }

            .equipment-info {
              .equipment-name {
                font-weight: 500;
                color: #374151;
                margin-bottom: 2px;
              }

              .equipment-desc {
                font-size: 12px;
                color: #6b7280;
              }
            }
          }
        }
      }

      .experiment-area {
        .experiment-canvas {
          height: 400px;
          background: #f9fafb;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;

          .canvas-placeholder {
            text-align: center;

            .canvas-icon {
              font-size: 64px;
              color: #9ca3af;
              margin-bottom: 16px;
            }

            p {
              color: #6b7280;
              margin-bottom: 8px;
            }
          }
        }

        .experiment-controls {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;

          .control-group {
            h5 {
              margin: 0 0 12px 0;
              font-size: 14px;
              color: #374151;
            }
          }

          .experiment-status {
            .status-item {
              margin-bottom: 12px;

              .status-label {
                display: block;
                color: #6b7280;
                font-size: 14px;
                margin-bottom: 4px;
              }

              .status-value {
                font-weight: 600;
                color: #374151;
              }
            }
          }
        }
      }
    }
  }

  .notebook-workspace {
    .notebook-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: #f9fafb;
      border-radius: 6px;
      margin-bottom: 16px;
    }

    .notebook-cells {
      .notebook-cell {
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        margin-bottom: 16px;

        .cell-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;

          .cell-number {
            font-family: monospace;
            color: #6b7280;
          }

          .cell-actions {
            margin-left: auto;
          }
        }

        .cell-content {
          padding: 12px;

          .code-cell {
            .code-editor {
              margin-bottom: 12px;
            }

            .cell-output {
              background: #1f2937;
              color: #f9fafb;
              padding: 12px;
              border-radius: 4px;
              font-family: monospace;
              font-size: 14px;
              white-space: pre-wrap;
            }
          }
        }
      }
    }

    .notebook-footer {
      padding: 16px;
      text-align: center;
    }
  }

  .analysis-workspace {
    display: grid;
    grid-template-columns: 250px 1fr;
    gap: 20px;

    .data-panel {
      h4 {
        margin: 0 0 16px 0;
        font-size: 16px;
        color: #374151;
      }

      .dataset-list {
        .dataset-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.2s ease;

          &:hover {
            border-color: #3b82f6;
            background: #eff6ff;
          }

          &.active {
            border-color: #3b82f6;
            background: #3b82f6;
            color: white;

            .dataset-info .dataset-name,
            .dataset-info .dataset-meta span {
              color: white;
            }
          }

          .dataset-info {
            .dataset-name {
              font-weight: 500;
              color: #374151;
              margin-bottom: 4px;
            }

            .dataset-meta {
              font-size: 12px;
              color: #6b7280;

              span {
                margin-right: 8px;
              }
            }
          }

          .dataset-icon {
            color: #6b7280;
          }
        }
      }
    }

    .analysis-area {
      .analysis-tabs {
        .chart-controls {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .chart-container {
          height: 300px;
          background: #f9fafb;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;

          .chart-placeholder {
            text-align: center;

            .chart-icon {
              font-size: 48px;
              color: #9ca3af;
              margin-bottom: 12px;
            }

            p {
              color: #6b7280;
            }
          }
        }

        .stat-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;

          .stat-card {
            padding: 16px;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            text-align: center;

            .stat-name {
              font-size: 14px;
              color: #6b7280;
              margin-bottom: 4px;
            }

            .stat-value {
              font-size: 18px;
              font-weight: 600;
              color: #374151;
            }
          }
        }
      }
    }
  }
}

.record-content {
  .record-timeline {
    max-height: 300px;
    overflow-y: auto;
    margin-bottom: 16px;

    .timeline-item {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .timeline-time {
        min-width: 80px;
        color: #6b7280;
        font-size: 12px;
        font-family: monospace;
      }

      .timeline-content {
        flex: 1;

        .timeline-title {
          font-weight: 500;
          color: #374151;
          margin-bottom: 4px;
        }

        .timeline-description {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .timeline-data {
          background: #f9fafb;
          padding: 8px;
          border-radius: 4px;
          font-size: 12px;
          color: #4b5563;

          pre {
            margin: 0;
            white-space: pre-wrap;
          }
        }
      }
    }
  }

  .record-actions {
    text-align: center;
  }
}

.progress-card {
  .progress-overview {
    text-align: center;

    .progress-text {
      font-size: 16px;
      font-weight: 600;
      color: #3b82f6;
    }

    .progress-details {
      margin-top: 20px;

      .detail-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;

        .label {
          color: #6b7280;
          font-size: 14px;
        }

        .value {
          font-weight: 600;
          color: #374151;
          font-size: 14px;
        }
      }
    }
  }
}

.tools-card {
  .experiment-tools {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;

    .tool-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        border-color: #3b82f6;
        background: #eff6ff;
      }

      &.active {
        border-color: #3b82f6;
        background: #3b82f6;
        color: white;

        .tool-icon {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .tool-name {
          color: white;
        }
      }

      .tool-icon {
        width: 32px;
        height: 32px;
        background: #f3f4f6;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #6b7280;
        margin-bottom: 8px;
      }

      .tool-name {
        font-size: 12px;
        color: #374151;
        text-align: center;
      }
    }
  }
}

.actions-card {
  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .action-btn {
      width: 100%;
      justify-content: flex-start;

      .el-icon {
        margin-right: 8px;
      }
    }
  }
}

// 响应式设计
@media (max-width: 1024px) {
  .experiment-section {
    .content-container {
      grid-template-columns: 1fr;

      .sidebar-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
    }

    .environment-content {
      .lab-workspace {
        .lab-equipment {
          grid-template-columns: 1fr;
        }
      }

      .analysis-workspace {
        grid-template-columns: 1fr;
      }
    }
  }
}

@media (max-width: 768px) {
  .experiment-section {
    padding: 16px;

    .section-header {
      h2 {
        font-size: 24px;
      }
    }

    .content-container {
      gap: 16px;

      .sidebar-content {
        grid-template-columns: 1fr;
      }
    }

    .tools-card {
      .experiment-tools {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  }
}
</style>