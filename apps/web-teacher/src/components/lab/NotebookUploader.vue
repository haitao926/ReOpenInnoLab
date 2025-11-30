<template>
  <div class="notebook-uploader">
    <div
      class="upload-area"
      :class="{ 'upload-area--dragging': isDragging, 'upload-area--error': uploadError }"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
    >
      <input
        ref="fileInput"
        type="file"
        accept=".ipynb"
        @change="handleFileSelect"
        style="display: none"
      />

      <!-- 上传区域 -->
      <div v-if="!notebookFile && !uploadProgress" class="upload-placeholder">
        <div class="upload-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="12" y2="12" />
            <line x1="15" y1="15" x2="12" y2="12" />
          </svg>
        </div>
        <div class="upload-text">
          <h3>拖拽或上传 Jupyter Notebook</h3>
          <p>支持 .ipynb 格式，最大 50MB</p>
          <EduButton variant="outline" @click="selectFile">选择文件</EduButton>
        </div>
      </div>

      <!-- 上传进度 -->
      <div v-if="uploadProgress" class="upload-progress">
        <div class="progress-info">
          <h4>正在上传 {{ notebookFile?.name }}</h4>
          <span>{{ uploadProgress }}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${uploadProgress}%` }"></div>
        </div>
      </div>

      <!-- 文件信息 -->
      <div v-if="notebookFile && !uploadProgress" class="file-info">
        <div class="file-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <div class="file-details">
          <h4>{{ notebookFile.name }}</h4>
          <p>{{ formatFileSize(notebookFile.size) }}</p>
          <div v-if="notebookMetadata" class="metadata">
            <span>{{ notebookMetadata.cellCount }} 个单元格</span>
            <span>{{ notebookMetadata.codeCells }} 个代码单元格</span>
          </div>
        </div>
        <div class="file-actions">
          <EduButton variant="text" size="sm" @click="selectFile">替换</EduButton>
          <EduButton variant="text" size="sm" @click="removeFile">删除</EduButton>
        </div>
      </div>

      <!-- 错误信息 -->
      <div v-if="uploadError" class="error-message">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <span>{{ uploadError }}</span>
      </div>
    </div>

    <!-- 依赖配置 -->
    <div v-if="notebookFile && notebookMetadata" class="dependencies-section">
      <h3 class="section-title">依赖配置</h3>
      <div class="dependency-tabs">
        <button
          v-for="tab in dependencyTabs"
          :key="tab.key"
          class="tab-button"
          :class="{ 'tab-button--active': activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Pip 依赖 -->
      <div v-if="activeTab === 'pip'" class="tab-content">
        <div class="form-group">
          <label>Python 包依赖</label>
          <div class="dependency-inputs">
            <div v-for="(pkg, index) in dependencies.pip" :key="index" class="dependency-input">
              <EduInput v-model="dependencies.pip[index]" placeholder="例如: numpy>=1.20.0" />
              <EduButton variant="text" size="sm" @click="removeDependency('pip', index)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </EduButton>
            </div>
            <EduButton variant="outline" size="sm" @click="addDependency('pip')">
              + 添加包
            </EduButton>
          </div>
        </div>

        <div class="form-group">
          <label>可选依赖</label>
          <div class="dependency-inputs">
            <div
              v-for="(pkg, index) in dependencies.pip_optional"
              :key="index"
              class="dependency-input"
            >
              <EduInput
                v-model="dependencies.pip_optional[index]"
                placeholder="例如: matplotlib>=3.3.0"
              />
              <EduButton variant="text" size="sm" @click="removeDependency('pip_optional', index)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </EduButton>
            </div>
            <EduButton variant="outline" size="sm" @click="addDependency('pip_optional')">
              + 添加可选包
            </EduButton>
          </div>
        </div>
      </div>

      <!-- Conda 依赖 -->
      <div v-if="activeTab === 'conda'" class="tab-content">
        <div class="form-group">
          <label>Conda 包依赖</label>
          <div class="dependency-inputs">
            <div v-for="(pkg, index) in dependencies.conda" :key="index" class="dependency-input">
              <EduInput v-model="dependencies.conda[index]" placeholder="例如: python=3.9" />
              <EduButton variant="text" size="sm" @click="removeDependency('conda', index)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </EduButton>
            </div>
            <EduButton variant="outline" size="sm" @click="addDependency('conda')">
              + 添加包
            </EduButton>
          </div>
        </div>
      </div>

      <!-- 运行策略 -->
      <div v-if="activeTab === 'runtime'" class="tab-content">
        <div class="form-group">
          <label>超时时间（分钟）</label>
          <EduInput
            v-model.number="runtimePolicy.timeoutMinutes"
            type="number"
            :min="1"
            :max="120"
          />
        </div>

        <div class="form-group">
          <label>最大重试次数</label>
          <EduInput v-model.number="runtimePolicy.maxRetries" type="number" :min="0" :max="5" />
        </div>

        <div class="form-group">
          <label>资源限制</label>
          <div class="resource-limits">
            <div class="limit-input">
              <label>CPU 核心</label>
              <EduInput
                v-model.number="runtimePolicy.cpuLimit"
                type="number"
                :min="0.5"
                :max="4"
                :step="0.5"
              />
            </div>
            <div class="limit-input">
              <label>内存 (MB)</label>
              <EduInput
                v-model.number="runtimePolicy.memoryLimit"
                type="number"
                :min="128"
                :max="2048"
                :step="128"
              />
            </div>
            <div class="limit-input">
              <label>磁盘 (MB)</label>
              <EduInput
                v-model.number="runtimePolicy.diskLimit"
                type="number"
                :min="512"
                :max="10240"
                :step="512"
              />
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>
            <input v-model="runtimePolicy.allowFileUpload" type="checkbox" />
            允许上传文件
          </label>
        </div>

        <div class="form-group">
          <label>
            <input v-model="runtimePolicy.networkAccess" type="checkbox" />
            允许网络访问
          </label>
        </div>
      </div>
    </div>

    <!-- AI 辅助 -->
    <div v-if="notebookFile && notebookMetadata" class="ai-assistant-section">
      <h3 class="section-title">
        AI 实验说明
        <EduButton
          v-if="!aiDescription"
          variant="text"
          size="sm"
          :loading="generatingDescription"
          @click="generateAIDescription"
        >
          生成说明
        </EduButton>
      </h3>
      <div v-if="aiDescription" class="ai-description">
        <div class="description-text">{{ aiDescription }}</div>
        <div class="description-actions">
          <EduButton variant="text" size="sm" @click="generateAIDescription">重新生成</EduButton>
          <EduButton variant="text" size="sm" @click="aiDescription = ''">清除</EduButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { EduButton, EduInput } from '@reopeninnolab/ui-kit'
import { LabApiService } from '@/api/lab'
import type { LabPackageSpec, LabRuntimePolicy } from '@/types/experiment'
import type { LabMetadata } from '@/types/experiment'

const emit = defineEmits<{
    fileSelected: [file: File, metadata: LabMetadata]
    dependenciesChanged: [dependencies: LabPackageSpec]
    runtimePolicyChanged: [policy: LabRuntimePolicy]
    aiDescriptionChanged: [description: string]
  }>()

// 文件相关
const fileInput = ref<HTMLInputElement>()
const notebookFile = ref<File>()
const isDragging = ref(false)
const uploadProgress = ref(0)
const uploadError = ref('')
const notebookMetadata = ref<LabMetadata>()

// 依赖配置
const activeTab = ref('pip')
const dependencies = reactive<LabPackageSpec>({
  pip: [],
  pip_optional: [],
  conda: [],
  npm: [],
  system: []
})

// 运行策略
const runtimePolicy = reactive<LabRuntimePolicy>({
  name: 'Default',
  timeoutMinutes: 30,
  maxRetries: 3,
  cpuLimit: 1,
  memoryLimit: 512,
  diskLimit: 1024,
  allowedPackages: [],
  blockedCommands: [],
  networkAccess: false,
  allowFileUpload: false,
  allowFileDownload: false,
  createdBy: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
})

// AI 辅助
const aiDescription = ref('')
const generatingDescription = ref(false)

const dependencyTabs = [
  { key: 'pip', label: 'Python 包' },
  { key: 'conda', label: 'Conda 环境' },
  { key: 'runtime', label: '运行策略' }
]

// 方法
const selectFile = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    processFile(target.files[0])
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false

  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    processFile(event.dataTransfer.files[0])
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = true
}

const handleDragEnter = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = true
}

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false
}

const processFile = async (file: File) => {
  // 验证文件
  const validation = LabApiService.validateNotebookFile(file)
  if (!validation.isValid) {
    uploadError.value = validation.errors.join(', ')
    return
  }

  notebookFile.value = file
  uploadError.value = ''

  // 读取文件内容
  try {
    const notebook = await LabApiService.readNotebookFile(file)
    notebookMetadata.value = LabApiService.extractNotebookMetadata(notebook)

    // 自动检测依赖
    autoDetectDependencies(notebook)

    emit('fileSelected', file, notebookMetadata.value!)
  } catch (error) {
    uploadError.value = '文件解析失败：' + (error as Error).message
  }
}

const autoDetectDependencies = (notebook: any) => {
  const imports = new Set<string>()

  // 扫描代码单元格的 import 语句
  notebook.cells?.forEach((cell: any) => {
    if (cell.cell_type === 'code' && cell.source) {
      const code = Array.isArray(cell.source) ? cell.source.join('') : cell.source
      const importRegex = /(?:import\s+(\w+)|from\s+(\w+)\s+import)/g
      let match
      while ((match = importRegex.exec(code)) !== null) {
        imports.add(match[1] || match[2])
      }
    }
  })

  // 常见包映射
  const commonPackages: Record<string, string> = {
    numpy: 'numpy',
    pandas: 'pandas',
    matplotlib: 'matplotlib',
    plt: 'matplotlib',
    seaborn: 'seaborn',
    sklearn: 'scikit-learn',
    tensorflow: 'tensorflow',
    torch: 'torch',
    cv2: 'opencv-python',
    PIL: 'Pillow',
    requests: 'requests',
    bs4: 'beautifulsoup4',
    scipy: 'scipy',
    sympy: 'sympy',
    plotly: 'plotly',
    dash: 'dash',
    fastapi: 'fastapi',
    sqlalchemy: 'SQLAlchemy'
  }

  // 添加检测到的依赖
  const detectedPackages: string[] = []
  imports.forEach(pkg => {
    const packageName = commonPackages[pkg]
    if (packageName && !detectedPackages.includes(packageName)) {
      detectedPackages.push(packageName)
    }
  })

  dependencies.pip = [...new Set([...dependencies.pip, ...detectedPackages])]
  emit('dependenciesChanged', dependencies)
}

const removeFile = () => {
  notebookFile.value = null
  notebookMetadata.value = undefined
  uploadError.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const addDependency = (type: keyof LabPackageSpec) => {
  dependencies[type].push('')
}

const removeDependency = (type: keyof LabPackageSpec, index: number) => {
  dependencies[type].splice(index, 1)
}

const generateAIDescription = async () => {
  if (!notebookMetadata.value) return

  generatingDescription.value = true
  try {
    // TODO: 调用 AI 服务生成说明
    // const response = await aiService.generateLabDescription({
    //   cellCount: notebookMetadata.value.cellCount,
    //   codeCells: notebookMetadata.value.codeCells,
    //   dependencies: dependencies.pip
    // })
    // aiDescription.value = response.description

    // 模拟生成
    await new Promise(resolve => setTimeout(resolve, 2000))
    aiDescription.value = `这是一个包含 ${notebookMetadata.value.cellCount} 个单元格的 Jupyter Notebook 实验，其中 ${notebookMetadata.value.codeCells} 个是代码单元格。学生将通过实践操作加深对相关概念的理解。`

    emit('aiDescriptionChanged', aiDescription.value)
  } catch (error) {
    console.error('生成 AI 说明失败:', error)
  } finally {
    generatingDescription.value = false
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 监听变化
watch(
  dependencies,
  () => {
    emit('dependenciesChanged', dependencies)
  },
  { deep: true }
)

watch(
  runtimePolicy,
  () => {
    emit('runtimePolicyChanged', runtimePolicy)
  },
  { deep: true }
)

watch(aiDescription, () => {
  emit('aiDescriptionChanged', aiDescription.value)
})
</script>

<style lang="scss" scoped>
  .notebook-uploader {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .upload-area {
    border: 2px dashed var(--edu-color-gray-300);
    border-radius: var(--radius-lg);
    padding: var(--spacing-xl);
    background-color: var(--edu-color-gray-50);
    transition: all 0.3s ease;
    position: relative;

    &--dragging {
      border-color: var(--edu-primary-500);
      background-color: var(--edu-primary-50);
    }

    &--error {
      border-color: var(--edu-color-error-default);
      background-color: var(--edu-color-error-light);
    }
  }

  .upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-base);
    text-align: center;
  }

  .upload-icon {
    width: 64px;
    height: 64px;
    color: var(--edu-color-gray-400);

    svg {
      width: 100%;
      height: 100%;
    }
  }

  .upload-text h3 {
    margin: 0;
    color: var(--text-primary);
  }

  .upload-text p {
    margin: var(--spacing-xs) 0;
    color: var(--text-secondary);
  }

  .upload-progress {
    .progress-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-sm);
    }

    .progress-bar {
      height: 8px;
      background-color: var(--edu-color-gray-200);
      border-radius: var(--radius-full);
      overflow: hidden;

      .progress-fill {
        height: 100%;
        background-color: var(--edu-primary-500);
        transition: width 0.3s ease;
      }
    }
  }

  .file-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-base);
  }

  .file-icon {
    width: 48px;
    height: 48px;
    color: var(--edu-primary-500);

    svg {
      width: 100%;
      height: 100%;
    }
  }

  .file-details {
    flex: 1;

    h4 {
      margin: 0;
      color: var(--text-primary);
    }

    p {
      margin: var(--spacing-xs) 0;
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
    }

    .metadata {
      display: flex;
      gap: var(--spacing-base);
      margin-top: var(--spacing-xs);

      span {
        font-size: var(--font-size-xs);
        color: var(--text-tertiary);
      }
    }
  }

  .file-actions {
    display: flex;
    gap: var(--spacing-sm);
  }

  .error-message {
    position: absolute;
    bottom: var(--spacing-base);
    left: var(--spacing-base);
    right: var(--spacing-base);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--edu-color-error-default);

    svg {
      width: 20px;
      height: 20px;
    }
  }

  .dependencies-section {
    border: 1px solid var(--edu-color-gray-200);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    background-color: var(--bg-elevated);
  }

  .section-title {
    margin: 0 0 var(--spacing-base) 0;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .dependency-tabs {
    display: flex;
    gap: var(--spacing-sm);
    border-bottom: 1px solid var(--edu-color-gray-200);
    margin-bottom: var(--spacing-lg);
  }

  .tab-button {
    padding: var(--spacing-sm) var(--spacing-base);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      color: var(--text-primary);
    }

    &--active {
      color: var(--edu-primary-500);
      border-bottom-color: var(--edu-primary-500);
    }
  }

  .tab-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-base);
  }

  .dependency-inputs {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .dependency-input {
    display: flex;
    gap: var(--spacing-sm);
    align-items: center;
  }

  .resource-limits {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--spacing-base);
  }

  .limit-input {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);

    label {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }
  }

  .ai-assistant-section {
    border: 1px solid var(--edu-color-gray-200);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    background-color: var(--bg-elevated);
  }

  .ai-description {
    background-color: var(--edu-color-blue-50);
    border-radius: var(--radius-base);
    padding: var(--spacing-base);

    .description-text {
      color: var(--text-primary);
      line-height: var(--line-height-relaxed);
    }

    .description-actions {
      display: flex;
      gap: var(--spacing-sm);
      margin-top: var(--spacing-base);
    }
  }
</style>
