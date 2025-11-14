# 虚拟实验功能实现任务

**优先级**: 🔴 高
**预估工作量**: 3-4周
**影响范围**: apps/web-teacher/src/views/VirtualLab/
**当前状态**: 多处 TODO 标记，功能不完整

---

## 📋 任务描述

实现虚拟实验的完整功能，包括 Jupyter Notebook 上传、解析、预览、保存、发布、封面上传等核心功能，以及实验库的时间线视图恢复。

## 🎯 验收标准

### Notebook 处理验收
- [ ] 支持拖拽上传 .ipynb 文件
- [ ] 自动解析 notebook metadata 和 cell 结构
- [ ] 支持 .ipynb 和依赖压缩包同时上传
- [ ] 文件格式验证和安全检查
- [ ] 上传进度显示和错误处理

### 预览功能验收
- [ ] 静态预览渲染 (代码高亮、公式渲染)
- [ ] 支持 Markdown 和 Code cell 的不同显示模式
- [ ] 单元折叠和展开功能
- [ ] AI 批注锚点支持
- [ ] 预览主题与平台统一

### 管理功能验收
- [ ] 实验保存和草稿功能
- [ ] 实验发布和版本管理
- [ ] 封面图片上传和裁剪
- [ ] 实验标签和分类管理
- [ ] 实验与课程关联

### 实验库验收
- [ ] 时间线视图完整实现
- [ ] 实验搜索和筛选功能
- [ ] 实验预览和详情查看
- [ ] 批量操作功能

## 🔧 技术实现要点

### 1. Notebook 上传组件
```vue
<!-- apps/web-teacher/src/components/lab/NotebookUploader.vue -->
<template>
  <div class="notebook-uploader">
    <el-upload
      class="upload-area"
      drag
      :action="uploadUrl"
      :headers="uploadHeaders"
      :data="uploadData"
      :on-success="handleUploadSuccess"
      :on-error="handleUploadError"
      :before-upload="beforeUpload"
      :on-progress="handleProgress"
      accept=".ipynb,.zip"
      multiple
    >
      <div class="upload-content">
        <el-icon class="upload-icon"><Upload /></el-icon>
        <div class="upload-text">
          <p>拖拽 Jupyter Notebook 文件到此处</p>
          <p class="upload-hint">支持 .ipynb 和依赖压缩包</p>
        </div>
      </div>
    </el-upload>

    <div v-if="uploadProgress > 0" class="progress-bar">
      <el-progress :percentage="uploadProgress" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload } from '@element-plus/icons-vue'

const uploadProgress = ref(0)
const uploadUrl = '/api/lab/upload'

const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${userStore.token}`
}))

const uploadData = computed(() => ({
  courseId: props.courseId,
  classroomId: props.classroomId
}))

const beforeUpload = (file: File) => {
  const isValidType = file.name.endsWith('.ipynb') || file.name.endsWith('.zip')
  if (!isValidType) {
    ElMessage.error('只支持 .ipynb 和 .zip 格式文件')
    return false
  }

  const isLt100M = file.size / 1024 / 1024 < 100
  if (!isLt100M) {
    ElMessage.error('文件大小不能超过 100MB')
    return false
  }

  return true
}

const handleUploadSuccess = (response: any) => {
  ElMessage.success('上传成功')
  emit('uploaded', response.data)
}

const handleUploadError = (error: any) => {
  ElMessage.error('上传失败：' + error.message)
}

const handleProgress = (event: any) => {
  uploadProgress.value = Math.round(event.percent)
}
</script>
```

### 2. Notebook 解析器
```typescript
// apps/web-teacher/src/utils/notebook-parser.ts
import type { NotebookCell, NotebookMetadata } from '@/types/notebook'

export interface ParsedNotebook {
  metadata: NotebookMetadata
  cells: NotebookCell[]
  resources: ResourceRef[]
  dependencies: string[]
}

export class NotebookParser {
  static async parse(file: File): Promise<ParsedNotebook> {
    const content = await file.text()
    const notebook = JSON.parse(content)

    // 解析 metadata
    const metadata = this.parseMetadata(notebook.metadata)

    // 解析 cells
    const cells = notebook.cells.map((cell: any, index: number) =>
      this.parseCell(cell, index)
    )

    // 提取资源引用
    const resources = this.extractResources(notebook)

    // 提取依赖
    const dependencies = this.extractDependencies(notebook)

    return {
      metadata,
      cells,
      resources,
      dependencies
    }
  }

  private static parseMetadata(metadata: any): NotebookMetadata {
    return {
      title: metadata.title || metadata.kernelspec?.display_name || 'Untitled Notebook',
      author: metadata.author || '',
      created: metadata.created || new Date().toISOString(),
      modified: metadata.modified || new Date().toISOString(),
      language: metadata.kernelspec?.language || 'python',
      version: metadata.version || '1.0',
      tags: metadata.tags || [],
      description: metadata.description || ''
    }
  }

  private static parseCell(cell: any, index: number): NotebookCell {
    return {
      id: `cell-${index}`,
      type: cell.cell_type,
      source: Array.isArray(cell.source) ? cell.source.join('') : cell.source,
      metadata: cell.metadata || {},
      outputs: cell.outputs || [],
      execution_count: cell.execution_count
    }
  }

  private static extractResources(notebook: any): ResourceRef[] {
    const resources: ResourceRef[] = []

    // 扫描代码中的文件引用
    notebook.cells.forEach((cell: any) => {
      if (cell.cell_type === 'code') {
        const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source

        // 匹配文件路径引用
        const fileMatches = source.match(/['"]([^'"]+\.(csv|json|txt|png|jpg|jpeg))['"]/g)
        if (fileMatches) {
          fileMatches.forEach(match => {
            const filePath = match.slice(1, -1)
            resources.push({
              type: 'file',
              path: filePath,
              required: true
            })
          })
        }
      }
    })

    return resources
  }

  private static extractDependencies(notebook: any): string[] {
    const dependencies = new Set<string>()

    notebook.cells.forEach((cell: any) => {
      if (cell.cell_type === 'code') {
        const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source

        // 匹配 import 语句
        const importMatches = source.match(/import\s+(\w+)|from\s+(\w+)\s+import/g)
        if (importMatches) {
          importMatches.forEach(match => {
            const lib = match.split(/(\s+)/).pop()
            if (lib && !lib.startsWith('.')) {
              dependencies.add(lib)
            }
          })
        }

        // 匹配 requirements 格式
        const reqMatches = source.match(/(\w+)[<>=!]+([\d.]+)/g)
        if (reqMatches) {
          reqMatches.forEach(req => {
            dependencies.add(req)
          })
        }
      }
    })

    return Array.from(dependencies)
  }
}
```

### 3. 实验保存功能 (LabEditor.vue:754)
```typescript
// apps/web-teacher/src/views/VirtualLab/LabEditor.vue - 保存功能实现
const saveLab = async (saveAsDraft = false) => {
  try {
    loading.value = true

    const labData = {
      id: labId.value,
      title: labTitle.value,
      description: labDescription.value,
      notebook: parsedNotebook.value,
      coverImage: coverImageUrl.value,
      tags: selectedTags.value,
      gradeLevel: selectedGradeLevel.value,
      subject: selectedSubject.value,
      difficulty: selectedDifficulty.value,
      estimatedTime: estimatedTime.value,
      status: saveAsDraft ? 'draft' : 'published',
      resources: resourceFiles.value,
      aiSummary: aiSummary.value
    }

    if (labId.value) {
      // 更新现有实验
      await labApi.updateLab(labId.value, labData)
      ElMessage.success('实验更新成功')
    } else {
      // 创建新实验
      const response = await labApi.createLab(labData)
      labId.value = response.id
      ElMessage.success('实验创建成功')
    }

    // 更新保存状态
    lastSavedTime.value = new Date()
    hasUnsavedChanges.value = false

  } catch (error) {
    console.error('保存实验失败:', error)
    ElMessage.error('保存失败：' + error.message)
  } finally {
    loading.value = false
  }
}
```

### 4. 实验预览功能 (LabEditor.vue:764)
```typescript
// 预览功能实现
const showPreview = ref(false)
const previewUrl = ref('')

const generatePreview = async () => {
  try {
    loading.value = true

    if (!parsedNotebook.value) {
      ElMessage.warning('请先上传 Notebook 文件')
      return
    }

    // 调用后端预览生成接口
    const response = await labApi.generatePreview({
      notebookId: labId.value,
      notebookData: parsedNotebook.value,
      theme: 'light' // 或从用户设置获取
    })

    previewUrl.value = response.previewUrl
    showPreview.value = true

  } catch (error) {
    console.error('生成预览失败:', error)
    ElMessage.error('预览生成失败')
  } finally {
    loading.value = false
  }
}
```

### 5. 实验发布功能 (LabEditor.vue:779)
```typescript
// 发布功能实现
const publishLab = async () => {
  try {
    // 验证必填字段
    if (!labTitle.value) {
      ElMessage.warning('请填写实验标题')
      return
    }

    if (!parsedNotebook.value) {
      ElMessage.warning('请先上传 Notebook 文件')
      return
    }

    // 确认发布
    await ElMessageBox.confirm(
      '发布后学生将可以看到和使用这个实验，确定发布吗？',
      '确认发布',
      {
        confirmButtonText: '确定发布',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 调用发布接口
    await labApi.publishLab(labId.value, {
      publishTime: new Date().toISOString(),
      notifyStudents: notifyStudents.value
    })

    labStatus.value = 'published'
    ElMessage.success('实验发布成功')

  } catch (error) {
    if (error !== 'cancel') {
      console.error('发布失败:', error)
      ElMessage.error('发布失败：' + error.message)
    }
  }
}
```

### 6. 封面上传功能 (LabEditor.vue:839,867)
```vue
<!-- 封面上传组件 -->
<template>
  <div class="cover-upload-section">
    <div class="cover-preview" v-if="coverImageUrl">
      <img :src="coverImageUrl" alt="实验封面" />
      <div class="cover-actions">
        <el-button size="small" @click="changeCover">更换封面</el-button>
        <el-button size="small" type="danger" @click="removeCover">删除封面</el-button>
      </div>
    </div>

    <el-upload
      v-else
      class="cover-uploader"
      :action="coverUploadUrl"
      :show-file-list="false"
      :on-success="handleCoverSuccess"
      :before-upload="beforeCoverUpload"
      accept="image/*"
    >
      <el-icon class="cover-uploader-icon"><Plus /></el-icon>
      <div class="cover-upload-text">上传封面图片</div>
    </el-upload>
  </div>
</template>

<script setup lang="ts">
const coverImageUrl = ref('')
const coverUploadUrl = '/api/lab/upload-cover'

const beforeCoverUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }

  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }

  return true
}

const handleCoverSuccess = (response: any) => {
  coverImageUrl.value = response.url
  ElMessage.success('封面上传成功')
}

const changeCover = () => {
  // 触发文件选择
  document.querySelector('.cover-uploader input')?.click()
}

const removeCover = () => {
  coverImageUrl.value = ''
}
</script>
```

### 7. 时间线视图恢复 (LabLibrary.vue:508)
```vue
<!-- 时间线视图组件 -->
<template>
  <div class="lab-timeline">
    <el-timeline>
      <el-timeline-item
        v-for="lab in sortedLabs"
        :key="lab.id"
        :timestamp="formatDate(lab.createdAt)"
        :type="getTimelineType(lab.status)"
      >
        <div class="timeline-content">
          <div class="lab-header">
            <h4>{{ lab.title }}</h4>
            <el-tag :type="getStatusType(lab.status)">
              {{ getStatusText(lab.status) }}
            </el-tag>
          </div>

          <p class="lab-description">{{ lab.description }}</p>

          <div class="lab-meta">
            <span class="meta-item">
              <el-icon><User /></el-icon>
              {{ lab.createdBy.name }}
            </span>
            <span class="meta-item">
              <el-icon><Clock /></el-icon>
              {{ lab.estimatedTime }}分钟
            </span>
            <span class="meta-item">
              <el-icon><Collection /></el-icon>
              {{ lab.subject }}
            </span>
          </div>

          <div class="lab-actions">
            <el-button size="small" @click="previewLab(lab)">预览</el-button>
            <el-button size="small" type="primary" @click="editLab(lab)">编辑</el-button>
            <el-dropdown @command="handleCommand">
              <el-button size="small">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="{action: 'duplicate', lab}">复制</el-dropdown-item>
                  <el-dropdown-item :command="{action: 'assign', lab}">分配课程</el-dropdown-item>
                  <el-dropdown-item :command="{action: 'export', lab}">导出</el-dropdown-item>
                  <el-dropdown-item :command="{action: 'delete', lab}" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-timeline-item>
    </el-timeline>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Lab } from '@/types/lab'

const props = defineProps<{
  labs: Lab[]
}>()

const sortedLabs = computed(() => {
  return [...props.labs].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
})

const getTimelineType = (status: string) => {
  const typeMap = {
    'published': 'success',
    'draft': 'warning',
    'archived': 'info'
  }
  return typeMap[status] || 'primary'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
```

## 📁 新增文件结构

```
apps/web-teacher/src/
├── components/
│   └── lab/
│       ├── NotebookUploader.vue          # Notebook 上传组件
│       ├── LabPreview.vue               # 实验预览组件
│       ├── LabCoverUpload.vue           # 封面上传组件
│       └── LabTimeline.vue              # 时间线视图组件
├── utils/
│   ├── notebook-parser.ts               # Notebook 解析工具
│   └── lab-validation.ts                # 实验数据验证
├── types/
│   └── notebook.ts                      # Notebook 类型定义
└── api/
    └── lab.ts                           # 实验相关 API
```

## 🧪 测试要求

### 组件测试
- [ ] NotebookUploader 组件测试
- [ ] LabPreview 组件测试
- [ ] 上传进度和错误处理测试

### 功能测试
- [ ] Notebook 解析准确性测试
- [ ] 文件上传集成测试
- [ ] 预览生成功能测试

### E2E 测试
- [ ] 完整实验创建流程
- [ ] 实验发布和管理流程
- [ ] 批量操作功能测试

## 📝 开发步骤

### Week 1: 基础上传功能
1. NotebookUploader 组件开发
2. 文件格式验证和上传接口
3. Notebook 解析器实现
4. 基础错误处理

### Week 2: 预览和编辑
1. 静态预览生成功能
2. 实验编辑表单完善
3. 封面上传功能实现
4. 数据验证和保存

### Week 3: 发布和管理
1. 实验发布流程实现
2. 时间线视图恢复
3. 实验库搜索筛选
4. 批量操作功能

### Week 4: 优化和测试
1. 性能优化
2. 完整测试覆盖
3. 用户体验优化
4. 文档和部署

## 🚨 风险与注意事项

1. **文件安全**: Notebook 文件可能包含恶意代码，需要安全检查
2. **解析兼容性**: 不同版本的 Notebook 格式兼容性问题
3. **预览性能**: 大型 Notebook 的预览生成性能
4. **存储成本**: 文件和预览图的存储成本控制

## 📚 参考资料

- [Jupyter Notebook 格式文档](https://nbformat.readthedocs.io/en/latest/)
- [Element Plus Upload 组件](https://element-plus.org/zh-CN/component/upload.html)
- [File API 文档](https://developer.mozilla.org/en-US/docs/Web/API/File)

---

**任务创建**: 2025-11-08
**预计完成**: 2025-12-06
**当前状态**: 🔄 未开始