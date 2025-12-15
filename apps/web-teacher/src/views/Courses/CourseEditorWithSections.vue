<template>
  <div class="course-editor-with-sections">
    <!-- 课程基本信息 -->
    <el-card class="course-info-card">
      <template #header>
        <h3>课程基本信息</h3>
      </template>

      <el-form
        ref="courseFormRef"
        :model="courseInfo"
        :rules="courseRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="课程名称" prop="title">
              <el-input v-model="courseInfo.title" placeholder="请输入课程名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学科" prop="subject">
              <el-select v-model="courseInfo.subject" placeholder="请选择学科">
                <el-option
                  v-for="opt in subjectOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="适用年级" prop="grade">
              <el-select v-model="courseInfo.grade" placeholder="请选择年级">
                <el-option
                  v-for="grade in 9"
                  :key="grade"
                  :label="`${grade}年级`"
                  :value="grade"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="课程状态" prop="status">
              <el-select v-model="courseInfo.status" placeholder="请选择状态">
                <el-option label="草稿" value="draft" />
                <el-option label="已发布" value="published" />
                <el-option label="进行中" value="in_progress" />
                <el-option label="已完成" value="completed" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="课程描述" prop="description">
          <el-input
            v-model="courseInfo.description"
            type="textarea"
            :rows="3"
            placeholder="请输入课程描述..."
          />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 五环节内容 -->
    <el-card class="sections-card">
      <template #header>
        <div class="sections-header">
          <h3>课程内容设计</h3>
          <div class="sections-stats">
            <el-tag>总时长：{{ totalDuration }}分钟</el-tag>
            <el-tag :type="validationResult.valid ? 'success' : 'warning'">
              {{ validationResult.valid ? '环节完整' : '缺少必需环节' }}
            </el-tag>
          </div>
        </div>
      </template>

      <SectionRenderer
        :sections="courseSections"
        :readonly="readonly"
        :editable="editable"
        @section-added="handleSectionAdded"
        @section-updated="handleSectionUpdated"
        @section-deleted="handleSectionDeleted"
        @section-moved="handleSectionMoved"
      />

      <!-- 缺失环节提示 -->
      <div v-if="!validationResult.valid" class="validation-warning">
        <el-alert
          title="课程结构不完整"
          type="warning"
          :description="`缺少必需环节：${validationResult.missing.join('、')}`"
          show-icon
          :closable="false"
        />
      </div>
    </el-card>

    <!-- 操作栏 -->
    <div class="editor-actions">
      <el-button @click="handleCancel">取消</el-button>
      <el-button @click="handleSaveDraft">保存草稿</el-button>
      <el-button type="primary" @click="handlePublish">发布课程</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { SectionRenderer, sectionFactory } from '@/shared/components/learning/SectionFactory'
import type { CourseData, CourseSectionData } from '@/shared/types/course'

// 路由
const router = useRouter()

// Props
const props = defineProps<{
  courseId?: string | number
  readonly?: boolean
}>()

// 表单引用
const courseFormRef = ref()

// 课程基本信息
const courseInfo = reactive<Partial<CourseData>>({
  title: '',
  description: '',
  subject: '',
  grade: undefined,
  status: 'draft',
  sections: []
})

// 课程环节
const courseSections = ref<CourseSectionData[]>([])

// 是否可编辑
const editable = computed(() => !props.readonly)

// 学科选项
const subjectOptions = [
  { label: '语文', value: 'chinese' },
  { label: '数学', value: 'math' },
  { label: '英语', value: 'english' },
  { label: '物理', value: 'physics' },
  { label: '化学', value: 'chemistry' },
  { label: '生物', value: 'biology' },
  { label: '地理', value: 'geography' },
  { label: '历史', value: 'history' }
]

// 表单验证规则
const courseRules = {
  title: [
    { required: true, message: '请输入课程名称', trigger: 'blur' }
  ],
  subject: [
    { required: true, message: '请选择学科', trigger: 'change' }
  ],
  grade: [
    { required: true, message: '请选择年级', trigger: 'change' }
  ]
}

// 计算总时长
const totalDuration = computed(() => {
  return sectionFactory.configManager.calculateTotalDuration(courseSections.value)
})

// 验证课程结构
const validationResult = computed(() => {
  return sectionFactory.configManager.validateCourseSections(courseSections.value)
})

// 环节操作处理
const handleSectionAdded = (section: CourseSectionData) => {
  courseSections.value.push(section)
  saveSectionsOrder()
}

const handleSectionUpdated = (sectionId: string, data: any) => {
  const section = courseSections.value.find(s => s.id === sectionId)
  if (section) {
    section.data = data
  }
}

const handleSectionDeleted = (sectionId: string) => {
  const index = courseSections.value.findIndex(s => s.id === sectionId)
  if (index > -1) {
    courseSections.value.splice(index, 1)
    saveSectionsOrder()
  }
}

const handleSectionMoved = ({ id, direction }: { id: string; direction: 'up' | 'down' }) => {
  const index = courseSections.value.findIndex(s => s.id === id)
  if (index === -1) return

  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= courseSections.value.length) return

  // 交换位置
  ;[courseSections.value[index], courseSections.value[targetIndex]] =
    [courseSections.value[targetIndex], courseSections.value[index]]

  saveSectionsOrder()
}

const saveSectionsOrder = () => {
  courseSections.value.forEach((section, index) => {
    section.order = index + 1
  })
}

// 保存操作
const handleSaveDraft = async () => {
  try {
    await saveCourse('draft')
    ElMessage.success('草稿保存成功')
  } catch (error) {
    console.error('Failed to save draft:', error)
  }
}

const handlePublish = async () => {
  // 验证基本信息
  try {
    await courseFormRef.value?.validate()
  } catch {
    ElMessage.error('请完善课程基本信息')
    return
  }

  // 验证课程结构
  if (!validationResult.valid) {
    ElMessage.error('请完善课程必需环节')
    return
  }

  try {
    await ElMessageBox.confirm(
      '确定要发布此课程吗？发布后学生即可学习。',
      '确认发布',
      {
        confirmButtonText: '发布',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await saveCourse('published')
    ElMessage.success('课程发布成功')
    router.push('/courses')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Failed to publish course:', error)
    }
  }
}

const saveCourse = async (status: string) => {
  const courseData: CourseData = {
    id: props.courseId || Date.now(),
    title: courseInfo.title!,
    description: courseInfo.description,
    subject: courseInfo.subject!,
    grade: courseInfo.grade!,
    status: status as any,
    sections: courseSections.value,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  // 这里调用 API 保存课程
  console.log('Saving course:', courseData)

  // 模拟 API 调用
  await new Promise(resolve => setTimeout(resolve, 500))
}

const handleCancel = () => {
  router.back()
}

// 加载课程数据
const loadCourse = async () => {
  if (!props.courseId) return

  try {
    // 这里调用 API 加载课程
    console.log('Loading course:', props.courseId)

    // 模拟数据
    const mockCourse: CourseData = {
      id: props.courseId,
      title: '示例课程',
      description: '这是一个示例课程',
      subject: 'math',
      grade: 5,
      status: 'draft',
      sections: [
        {
          id: 'section_1',
          type: 'introduction',
          title: '课程引入',
          order: 1,
          data: {
            text: '今天我们来学习分数的概念...',
            objectives: ['理解分数的含义', '掌握分数的表示方法'],
            keyQuestions: ['什么是分数？', '分数如何表示？']
          }
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    Object.assign(courseInfo, mockCourse)
    courseSections.value = mockCourse.sections
  } catch (error) {
    console.error('Failed to load course:', error)
  }
}

// 初始化
onMounted(() => {
  loadCourse()
})
</script>

<style scoped lang="scss">
.course-editor-with-sections {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  max-width: 1200px;
  margin: 0 auto;

  .course-info-card {
    h3 {
      margin: 0;
    }
  }

  .sections-card {
    .sections-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 {
        margin: 0;
      }

      .sections-stats {
        display: flex;
        gap: var(--spacing-sm);
      }
    }

    .validation-warning {
      margin-top: var(--spacing-lg);
    }
  }

  .editor-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-sm);
    padding-top: var(--spacing-lg);
    border-top: 1px solid var(--border-color-light);
  }
}

// 五环节组件样式
:deep(.section-renderer) {
  .section-wrapper {
    margin-bottom: var(--spacing-xl);

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-md);
      background-color: var(--color-primary-light-9);
      border-radius: var(--border-radius-base) var(--border-radius-base) 0 0;

      .section-title {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        margin: 0;
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-semibold);
      }

      .section-duration {
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
      }

      .section-actions {
        display: flex;
        gap: var(--spacing-xs);
      }
    }

    .section-content {
      padding: var(--spacing-lg);
      background-color: var(--bg-color-page);
      border: 1px solid var(--border-color-light);
      border-top: none;
      border-radius: 0 0 var(--border-radius-base) var(--border-radius-base);
    }
  }

  .section-add {
    display: flex;
    justify-content: center;
    padding: var(--spacing-lg);
    border: 2px dashed var(--border-color);
    border-radius: var(--border-radius-base);
  }
}
</style>