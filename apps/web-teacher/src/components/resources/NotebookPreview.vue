<template>
  <div class="notebook-preview" :class="{ 'fullscreen-mode': isFullscreen }">
    <!-- 工具栏 -->
    <div class="notebook-toolbar" v-if="showControls">
      <div class="toolbar-left">
        <span class="notebook-title">{{ title }}</span>
        <el-tag size="small" type="info">Jupyter Notebook</el-tag>
        <el-tag v-if="kernelStatus" :type="getKernelStatusColor(kernelStatus)" size="small">
          {{ kernelStatus }}
        </el-tag>
      </div>

      <div class="toolbar-right">
        <el-button-group>
          <el-button
            size="small"
            @click="toggleEditMode"
            :type="editMode ? 'primary' : 'default'"
          >
            <el-icon><Edit /></el-icon>
            {{ editMode ? '预览' : '编辑' }}
          </el-button>
          <el-button size="small" @click="toggleLineNumbers" :type="showLineNumbers ? 'primary' : 'default'">
            <el-icon><List /></el-icon>
            行号
          </el-button>
          <el-button size="small" @click="toggleFullscreen">
            <el-icon><FullScreen /></el-icon>
            全屏
          </el-button>
          <el-dropdown @command="handleExport">
            <el-button size="small">
              导出<el-icon><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="html">HTML</el-dropdown-item>
                <el-dropdown-item command="pdf">PDF</el-dropdown-item>
                <el-dropdown-item command="markdown">Markdown</el-dropdown-item>
                <el-dropdown-item command="python">Python</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-button-group>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="notebook-content" ref="notebookContent">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-overlay">
        <el-icon class="loading-icon is-loading"><Loading /></el-icon>
        <div class="loading-text">{{ loadingText }}</div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-overlay">
        <el-icon><Warning /></el-icon>
        <div class="error-title">Notebook 加载失败</div>
        <div class="error-message">{{ errorMessage }}</div>
        <div class="error-actions">
          <el-button size="small" @click="retry">重新加载</el-button>
          <el-button size="small" type="primary" @click="openInJupyter">在 Jupyter 中打开</el-button>
        </div>
      </div>

      <!-- Notebook 内容 -->
      <div v-else class="notebook-container" :class="{ 'edit-mode': editMode }">
        <!-- 元数据信息 -->
        <div class="notebook-metadata" v-if="showMetadata">
          <el-collapse v-model="metadataExpanded">
            <el-collapse-item title="Notebook 信息" name="metadata">
              <div class="metadata-grid">
                <div class="metadata-item">
                  <label>创建时间:</label>
                  <span>{{ formatDate(notebookMetadata.created) }}</span>
                </div>
                <div class="metadata-item">
                  <label>修改时间:</label>
                  <span>{{ formatDate(notebookMetadata.modified) }}</span>
                </div>
                <div class="metadata-item">
                  <label>语言:</label>
                  <span>{{ notebookMetadata.language || 'Python' }}</span>
                </div>
                <div class="metadata-item">
                  <label>内核:</label>
                  <span>{{ notebookMetadata.kernelspec?.name || 'python3' }}</span>
                </div>
                <div class="metadata-item">
                  <label>单元格数:</label>
                  <span>{{ notebookCells.length }}</span>
                </div>
                <div class="metadata-item">
                  <label>作者:</label>
                  <span>{{ notebookMetadata.author || '未知' }}</span>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>

        <!-- 单元格列表 -->
        <div class="notebook-cells">
          <div
            v-for="(cell, index) in notebookCells"
            :key="cell.id"
            class="notebook-cell"
            :class="getCellClass(cell)"
            :data-cell-type="cell.cell_type"
            :data-cell-index="index"
          >
            <!-- 单元格工具栏 -->
            <div class="cell-toolbar" v-if="showCellToolbar">
              <div class="cell-info">
                <span class="cell-type">{{ getCellTypeLabel(cell.cell_type) }}</span>
                <span class="cell-number" v-if="showLineNumbers">[{{ index + 1 }}]</span>
              </div>

              <div class="cell-actions">
                <el-button
                  v-if="cell.cell_type === 'code'"
                  size="small"
                  text
                  @click="runCell(index)"
                  :loading="cellRunning[index]"
                >
                  <el-icon><VideoPlay /></el-icon>
                  运行
                </el-button>
                <el-button
                  v-if="cell.cell_type === 'code'"
                  size="small"
                  text
                  @click="runAllCells"
                >
                  <el-icon><CaretRight /></el-icon>
                  全部运行
                </el-button>
                <el-button
                  size="small"
                  text
                  @click="toggleCellOutput(index)"
                  v-if="hasOutput(cell)"
                >
                  <el-icon><View /></el-icon>
                  {{ cell.showOutput ? '隐藏' : '显示' }}
                </el-button>
                <el-button
                  size="small"
                  text
                  @click="toggleCellEdit(index)"
                  v-if="editMode"
                >
                  <el-icon><Edit /></el-icon>
                  {{ cell.editing ? '完成' : '编辑' }}
                </el-button>
              </div>
            </div>

            <!-- 单元格内容 -->
            <div class="cell-content">
              <!-- 代码单元格 -->
              <div v-if="cell.cell_type === 'code'" class="code-cell">
                <div v-if="!cell.editing" class="code-display">
                  <pre
                    class="code-content"
                    :class="{ 'show-line-numbers': showLineNumbers }"
                    :style="getCodeStyle(cell)"
                    v-html="highlightCode(cell.source)"
                  />
                </div>

                <div v-else class="code-editor">
                  <textarea
                    v-model="cell.source"
                    class="code-textarea"
                    :class="{ 'show-line-numbers': showLineNumbers }"
                    :placeholder="editMode ? '输入 Python 代码...' : ''"
                    @keydown="handleCodeKeydown($event, index)"
                    spellcheck="false"
                  />
                </div>
              </div>

              <!-- Markdown 单元格 -->
              <div v-else-if="cell.cell_type === 'markdown'" class="markdown-cell">
                <div v-if="!cell.editing" class="markdown-display" v-html="renderMarkdown(cell.source)"></div>
                <textarea
                  v-else
                  v-model="cell.source"
                  class="markdown-editor"
                  placeholder="输入 Markdown 内容..."
                  @keydown="handleMarkdownKeydown($event, index)"
                />
              </div>

              <!-- 原始单元格 -->
              <div v-else class="raw-cell">
                <pre class="raw-content">{{ cell.source }}</pre>
              </div>
            </div>

            <!-- 输出区域 -->
            <div v-if="hasOutput(cell) && cell.showOutput" class="cell-output">
              <div
                v-for="(output, outputIndex) in cell.outputs"
                :key="outputIndex"
                class="output-item"
                :class="getOutputClass(output)"
              >
                <!-- 文本输出 -->
                <pre v-if="output.output_type === 'stream'" class="text-output">{{ output.text }}</pre>

                <!-- 执行结果 -->
                <pre v-else-if="output.output_type === 'execute_result'" class="result-output">
                  {{ output.data?.['text/plain'] || output.text }}
                </pre>

                <!-- 错误输出 -->
                <div v-else-if="output.output_type === 'error'" class="error-output">
                  <div class="error-traceback" v-for="(trace, i) in output.traceback" :key="i">
                    {{ trace }}
                  </div>
                </div>

                <!-- 图像输出 -->
                <div v-else-if="output.output_type === 'display_data' && output.data?.['image/png']" class="image-output">
                  <img :src="`data:image/png;base64,${output.data['image/png']}`" alt="Output Image" />
                </div>

                <!-- HTML 输出 -->
                <div
                  v-else-if="output.output_type === 'display_data' && output.data?.['text/html']"
                  class="html-output"
                  v-html="output.data['text/html']"
                />

                <!-- 其他输出类型 -->
                <pre v-else class="unknown-output">{{ JSON.stringify(output, null, 2) }}</pre>
              </div>
            </div>

            <!-- 单元格状态指示器 -->
            <div class="cell-status" v-if="cellRunning[index]">
              <el-icon class="is-running"><Loading /></el-icon>
              <span>运行中...</span>
            </div>
          </div>
        </div>

        <!-- 新建单元格按钮 -->
        <div class="add-cell-actions" v-if="editMode">
          <el-button @click="addCell('code')">
            <el-icon><Plus /></el-icon>
            添加代码单元格
          </el-button>
          <el-button @click="addCell('markdown')">
            <el-icon><Document /></el-icon>
            添加 Markdown 单元格
          </el-button>
        </div>
      </div>
    </div>

    <!-- 导出对话框 -->
    <el-dialog
      v-model="showExportDialog"
      title="导出 Notebook"
      width="500px"
    >
      <el-form :model="exportOptions" label-width="100px">
        <el-form-item label="导出格式">
          <el-radio-group v-model="exportOptions.format">
            <el-radio label="html">HTML</el-radio>
            <el-radio label="pdf">PDF</el-radio>
            <el-radio label="markdown">Markdown</el-radio>
            <el-radio label="python">Python 脚本</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="包含输出">
          <el-switch v-model="exportOptions.includeOutput" />
        </el-form-item>
        <el-form-item label="模板">
          <el-select v-model="exportOptions.template" style="width: 100%">
            <el-option label="默认" value="default" />
            <el-option label="经典" value="classic" />
            <el-option label="简洁" value="minimal" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showExportDialog = false">取消</el-button>
        <el-button type="primary" @click="performExport" :loading="exporting">
          导出
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Loading,
  Warning,
  Edit,
  List,
  FullScreen,
  ArrowDown,
  VideoPlay,
  CaretRight,
  View,
  Plus,
  Document
} from '@element-plus/icons-vue'

interface NotebookCell {
  id: string
  cell_type: 'code' | 'markdown' | 'raw'
  source: string
  metadata?: Record<string, any>
  outputs?: NotebookOutput[]
  execution_count?: number
  editing?: boolean
  showOutput?: boolean
}

interface NotebookOutput {
  output_type: 'stream' | 'execute_result' | 'error' | 'display_data'
  name?: string
  text?: string
  data?: Record<string, any>
  metadata?: Record<string, any>
  traceback?: string[]
}

interface NotebookMetadata {
  created?: string
  modified?: string
  language?: string
  kernelspec?: {
    name: string
    display_name: string
  }
  author?: string
  title?: string
}

interface Props {
  url?: string
  content?: string
  title?: string
  editable?: boolean
  executable?: boolean
  showControls?: boolean
  showCellToolbar?: boolean
  showMetadata?: boolean
  showLineNumbers?: boolean
  theme?: 'light' | 'dark'
  initialEditMode?: boolean
  autoRun?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Jupyter Notebook',
  editable: false,
  executable: false,
  showControls: true,
  showCellToolbar: true,
  showMetadata: false,
  showLineNumbers: false,
  theme: 'light',
  initialEditMode: false,
  autoRun: false
})

// Emits
const emit = defineEmits<{
  load: [notebook: any]
  error: [error: Error]
  run: [cellIndex: number, code: string]
  output: [cellIndex: number, output: NotebookOutput[]]
  change: [notebook: any]
  export: [format: string, options: any]
}>()

// 响应式数据
const notebookContent = ref<HTMLElement>()
const loading = ref(false)
const error = ref(false)
const errorMessage = ref('')
const loadingText = ref('加载 Notebook 中...')

const notebookCells = ref<NotebookCell[]>([])
const notebookMetadata = ref<NotebookMetadata>({})
const kernelStatus = ref<string | null>(null)
const metadataExpanded = ref<string[]>([])

const isFullscreen = ref(false)
const editMode = ref(props.initialEditMode)
const showLineNumbers = ref(props.showLineNumbers)
const cellRunning = ref<Record<number, boolean>>({})

// 导出相关
const showExportDialog = ref(false)
const exporting = ref(false)
const exportOptions = ref({
  format: 'html',
  includeOutput: true,
  template: 'default'
})

// 方法
const formatDate = (dateString?: string): string => {
  if (!dateString) return '未知'
  try {
    return new Date(dateString).toLocaleString('zh-CN')
  } catch {
    return dateString
  }
}

const getCellClass = (cell: NotebookCell): string => {
  const classes = [`cell-${cell.cell_type}`]

  if (cell.editing) classes.push('cell-editing')
  if (cellRunning.value[notebookCells.value.indexOf(cell)]) classes.push('cell-running')
  if (cell.execution_count) classes.push('cell-executed')

  return classes.join(' ')
}

const getCellTypeLabel = (type: string): string => {
  const labels = {
    code: 'Code',
    markdown: 'Markdown',
    raw: 'Raw'
  }
  return labels[type as keyof typeof labels] || type
}

const getKernelStatusColor = (status: string): string => {
  const colors = {
    idle: 'success',
    busy: 'warning',
    dead: 'danger',
    starting: 'info'
  }
  return colors[status as keyof typeof colors] || 'info'
}

const getOutputClass = (output: NotebookOutput): string => {
  return `output-${output.output_type}`
}

const hasOutput = (cell: NotebookCell): boolean => {
  return !!(cell.outputs && cell.outputs.length > 0)
}

const highlightCode = (code: string): string => {
  // 简单的语法高亮（实际项目中建议使用专业的语法高亮库）
  return code
    .replace(/\b(def|class|if|else|elif|for|while|try|except|finally|import|from|as|return|yield|lambda|and|or|not|in|is|None|True|False)\b/g, '<span class="keyword">$1</span>')
    .replace(/\b(\d+)\b/g, '<span class="number">$1</span>')
    .replace(/(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g, '<span class="string">$&</span>')
    .replace(/(#.*$)/gm, '<span class="comment">$1</span>')
}

const renderMarkdown = (markdown: string): string => {
  // 简单的 Markdown 渲染（实际项目中建议使用专业的 Markdown 解析库）
  return markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*)\*/g, '<em>$1</em>')
    .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
}

const getCodeStyle = (cell: NotebookCell): Record<string, string> => {
  const lines = cell.source.split('\n').length
  return {
    '--line-count': lines.toString()
  }
}

const toggleEditMode = () => {
  editMode.value = !editMode.value
}

const toggleLineNumbers = () => {
  showLineNumbers.value = !showLineNumbers.value
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    notebookContent.value?.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

const toggleCellOutput = (index: number) => {
  const cell = notebookCells.value[index]
  if (cell) {
    cell.showOutput = !cell.showOutput
  }
}

const toggleCellEdit = (index: number) => {
  const cell = notebookCells.value[index]
  if (cell) {
    cell.editing = !cell.editing
  }
}

const runCell = async (index: number) => {
  if (!props.executable) return

  const cell = notebookCells.value[index]
  if (cell.cell_type !== 'code') return

  cellRunning.value[index] = true

  try {
    // 这里应该实际执行代码
    // const result = await executeCode(cell.source)

    // 模拟执行延迟
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 模拟输出
    const mockOutput: NotebookOutput[] = [
      {
        output_type: 'execute_result',
        data: {
          'text/plain': `执行结果: ${cell.source.slice(0, 50)}...`
        }
      }
    ]

    cell.outputs = mockOutput
    cell.execution_count = (cell.execution_count || 0) + 1
    cell.showOutput = true

    emit('output', index, mockOutput)
    emit('run', index, cell.source)

  } catch (error) {
    console.error('Cell execution error:', error)
    ElMessage.error('代码执行失败')
  } finally {
    cellRunning.value[index] = false
  }
}

const runAllCells = async () => {
  const codeCells = notebookCells.value
    .map((cell, index) => ({ cell, index }))
    .filter(({ cell }) => cell.cell_type === 'code')

  for (const { cell, index } of codeCells) {
    await runCell(index)
  }
}

const addCell = (type: 'code' | 'markdown') => {
  const newCell: NotebookCell = {
    id: `cell_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    cell_type: type,
    source: type === 'code' ? '# 在这里输入代码\n' : '# 在这里输入 Markdown\n\n',
    outputs: [],
    editing: true,
    showOutput: true
  }

  notebookCells.value.push(newCell)
  emit('change', getNotebookData())
}

const handleCodeKeydown = (event: KeyboardEvent, index: number) => {
  if (event.key === 'Tab') {
    event.preventDefault()
    const target = event.target as HTMLTextAreaElement
    const start = target.selectionStart
    const end = target.selectionEnd

    target.value = target.value.substring(0, start) + '    ' + target.value.substring(end)
    target.selectionStart = target.selectionEnd = start + 4
  } else if (event.key === 'Enter' && event.ctrlKey) {
    event.preventDefault()
    runCell(index)
  }
}

const handleMarkdownKeydown = (event: KeyboardEvent, index: number) => {
  if (event.key === 'Enter' && event.ctrlKey) {
    event.preventDefault()
    toggleCellEdit(index)
  }
}

const retry = () => {
  loadNotebook()
}

const openInJupyter = () => {
  if (props.url) {
    window.open(props.url, '_blank')
  } else {
    ElMessage.warning('没有可用的 Jupyter 链接')
  }
}

const handleExport = (command: string) => {
  exportOptions.value.format = command
  showExportDialog.value = true
}

const performExport = async () => {
  exporting.value = true

  try {
    // 这里应该实际执行导出逻辑
    await new Promise(resolve => setTimeout(resolve, 2000))

    ElMessage.success(`Notebook 已导出为 ${exportOptions.value.format.toUpperCase()} 格式`)
    showExportDialog.value = false
    emit('export', exportOptions.value.format, exportOptions.value)
  } catch (error) {
    console.error('Export error:', error)
    ElMessage.error('导出失败')
  } finally {
    exporting.value = false
  }
}

const getNotebookData = () => {
  return {
    cells: notebookCells.value,
    metadata: notebookMetadata.value,
    nbformat: 4,
    nbformat_minor: 4
  }
}

const loadNotebook = async () => {
  loading.value = true
  error.value = false

  try {
    if (props.content) {
      // 从内容加载
      const notebookData = JSON.parse(props.content)
      parseNotebookData(notebookData)
    } else if (props.url) {
      // 从URL加载
      loadingText.value = '从远程加载 Notebook...'
      const response = await fetch(props.url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const notebookData = await response.json()
      parseNotebookData(notebookData)
    } else {
      // 创建空 Notebook
      createEmptyNotebook()
    }

    emit('load', getNotebookData())

  } catch (error) {
    console.error('Failed to load notebook:', error)
    error.value = true
    errorMessage.value = error instanceof Error ? error.message : '未知错误'
    emit('error', error instanceof Error ? error : new Error('Unknown error'))
  } finally {
    loading.value = false
  }
}

const parseNotebookData = (data: any) => {
  notebookCells.value = (data.cells || []).map((cell: any) => ({
    id: cell.id || `cell_${Math.random().toString(36).substr(2, 9)}`,
    cell_type: cell.cell_type || 'code',
    source: typeof cell.source === 'string' ? cell.source : cell.source.join(''),
    metadata: cell.metadata || {},
    outputs: cell.outputs || [],
    execution_count: cell.execution_count,
    editing: false,
    showOutput: true
  }))

  notebookMetadata.value = data.metadata || {}
  kernelStatus.value = 'idle'
}

const createEmptyNotebook = () => {
  notebookCells.value = [
    {
      id: 'cell_1',
      cell_type: 'markdown',
      source: '# Jupyter Notebook\n\n这是一个空的 Jupyter Notebook。',
      editing: false,
      showOutput: false
    },
    {
      id: 'cell_2',
      cell_type: 'code',
      source: '# 在这里输入你的代码\nprint("Hello, Jupyter!")\n',
      outputs: [],
      editing: false,
      showOutput: true
    }
  ]

  notebookMetadata.value = {
    language: 'python',
    kernelspec: {
      name: 'python3',
      display_name: 'Python 3'
    }
  }

  kernelStatus.value = 'idle'
}

// 生命周期
onMounted(() => {
  loadNotebook()
})

// 监听属性变化
watch(() => props.content, () => {
  loadNotebook()
})

watch(() => props.url, () => {
  loadNotebook()
})
</script>

<style lang="scss" scoped>
.notebook-preview {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;

  &.fullscreen-mode {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
  }
}

.notebook-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.notebook-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.toolbar-right {
  display: flex;
  align-items: center;
}

.notebook-content {
  flex: 1;
  position: relative;
  overflow: auto;
}

.loading-overlay,
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: white;
  z-index: 5;
}

.loading-icon {
  font-size: 48px;
  color: #409eff;
}

.loading-text,
.error-title {
  font-size: 16px;
  color: #666;
  margin-top: 16px;
}

.error-title {
  color: #f56c6c;
  font-weight: bold;
}

.error-message {
  font-size: 14px;
  color: #999;
  text-align: center;
  max-width: 400px;
  margin: 8px 0;
}

.error-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.notebook-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;

  &.edit-mode {
    .notebook-cell {
      border: 2px solid transparent;

      &:hover {
        border-color: #409eff;
      }

      &.cell-editing {
        border-color: #409eff;
        background: #f0f9ff;
      }
    }
  }
}

.notebook-metadata {
  margin-bottom: 20px;
}

.metadata-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  padding: 16px;
}

.metadata-item {
  display: flex;
  gap: 8px;

  label {
    font-weight: 500;
    color: #606266;
  }

  span {
    color: #303133;
  }
}

.notebook-cells {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.notebook-cell {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  position: relative;

  &.cell-code {
    border-left: 4px solid #409eff;
  }

  &.cell-markdown {
    border-left: 4px solid #67c23a;
  }

  &.cell-raw {
    border-left: 4px solid #909399;
  }

  &.cell-running {
    background: #f0f9ff;
  }

  &.cell-executed {
    background: #f9f9f9;
  }
}

.cell-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: #fafafa;
  border-bottom: 1px solid #e4e7ed;
}

.cell-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cell-type {
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  color: #909399;
}

.cell-number {
  font-size: 12px;
  color: #c0c4cc;
}

.cell-actions {
  display: flex;
  gap: 8px;
}

.cell-content {
  padding: 16px;
}

.code-cell,
.markdown-cell,
.raw-cell {
  position: relative;
}

.code-display,
.markdown-display,
.raw-content {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.code-content {
  position: relative;
  padding-left: 0;

  &.show-line-numbers::before {
    content: attr(data-lines);
    position: absolute;
    left: -50px;
    top: 0;
    font-size: 12px;
    color: #c0c4cc;
    line-height: 1.5;
    text-align: right;
    white-space: pre-line;
  }
}

.code-editor {
  width: 100%;
}

.code-textarea {
  width: 100%;
  min-height: 60px;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  outline: none;

  &:focus {
    border-color: #409eff;
  }

  &.show-line-numbers {
    padding-left: 50px;
  }
}

.markdown-editor {
  width: 100%;
  min-height: 60px;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  outline: none;

  &:focus {
    border-color: #409eff;
  }
}

.cell-output {
  border-top: 1px solid #e4e7ed;
  background: #f9f9f9;
}

.output-item {
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;

  &:last-child {
    border-bottom: none;
  }
}

.text-output,
.result-output,
.error-output,
.unknown-output {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
}

.text-output {
  color: #303133;
}

.result-output {
  color: #67c23a;
  background: #f0f9ff;
  padding: 8px;
  border-radius: 4px;
}

.error-output {
  color: #f56c6c;
  background: #fef0f0;
  padding: 8px;
  border-radius: 4px;
}

.error-traceback {
  margin: 2px 0;
}

.image-output {
  text-align: center;

  img {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

.html-output {
  padding: 8px;
}

.cell-status {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(64, 158, 255, 0.1);
  color: #409eff;
  border-radius: 12px;
  font-size: 12px;

  .is-running {
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.add-cell-actions {
  display: flex;
  gap: 12px;
  padding: 20px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  justify-content: center;
  margin-top: 20px;
}

/* 语法高亮样式 */
:deep(.keyword) {
  color: #d73a49;
  font-weight: bold;
}

:deep(.number) {
  color: #005cc5;
}

:deep(.string) {
  color: #032f62;
}

:deep(.comment) {
  color: #6a737d;
  font-style: italic;
}

/* Markdown 渲染样式 */
:deep(h1), :deep(h2), :deep(h3) {
  color: #24292e;
  margin-top: 24px;
  margin-bottom: 16px;
}

:deep(h1) { font-size: 2em; border-bottom: 1px solid #eaecef; padding-bottom: 8px; }
:deep(h2) { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: 8px; }
:deep(h3) { font-size: 1.25em; }

:deep(strong) {
  font-weight: 600;
}

:deep(em) {
  font-style: italic;
}

:deep(code) {
  background: #f6f8fa;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 85%;
}

:deep(pre) {
  background: #f6f8fa;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
}

:deep(pre code) {
  background: none;
  padding: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .notebook-toolbar {
    flex-direction: column;
    gap: 12px;
    padding: 12px;
  }

  .toolbar-left,
  .toolbar-right {
    width: 100%;
    justify-content: center;
  }

  .notebook-container {
    padding: 12px;
  }

  .cell-toolbar {
    flex-direction: column;
    gap: 8px;
  }

  .cell-actions {
    flex-wrap: wrap;
    justify-content: center;
  }
}

/* 深色主题 */
.notebook-preview.dark-theme {
  background: #1a1a1a;
  color: #e0e0e0;

  .notebook-toolbar {
    background: #2d2d2d;
    border-color: #404040;
  }

  .notebook-title {
    color: #e0e0e0;
  }

  .notebook-cell {
    background: #2d2d2d;
    border-color: #404040;
  }

  .cell-toolbar {
    background: #333;
    border-color: #404040;
  }

  .code-display,
  .code-textarea,
  .markdown-editor {
    background: #1a1a1a;
    color: #e0e0e0;
    border-color: #404040;
  }

  .cell-output {
    background: #262626;
    border-color: #404040;
  }
}
</style>