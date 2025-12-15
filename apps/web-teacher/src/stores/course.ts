import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { courseApi, type CourseResponse, type CourseVersionResponse } from '@/api/course'
import type { AiCourseLayout } from '@reopeninnolab/acl-sdk'
import { aclRenderer } from '@reopeninnolab/acl-sdk'

export interface GradeBandOption {
  label: string
  value: string
}

export const gradeBandOptions: GradeBandOption[] = [
  { value: 'k1', label: '幼儿园小班' },
  { value: 'k2', label: '幼儿园中班' },
  { value: 'k3', label: '幼儿园大班' },
  { value: 'g1', label: '小学1年级' },
  { value: 'g2', label: '小学2年级' },
  { value: 'g3', label: '小学3年级' },
  { value: 'g4', label: '小学4年级' },
  { value: 'g5', label: '小学5年级' },
  { value: 'g6', label: '小学6年级' },
  { value: 'g7', label: '初中1年级' },
  { value: 'g8', label: '初中2年级' },
  { value: 'g9', label: '初中3年级' },
  { value: 'g10', label: '高中1年级' },
  { value: 'g11', label: '高中2年级' },
  { value: 'g12', label: '高中3年级' },
  { value: 'higher_ed', label: '高等教育' },
  { value: 'adult', label: '成人教育' }
]

const gradeCodeToLabel = gradeBandOptions.reduce<Record<string, string>>((acc, option) => {
  acc[option.value] = option.label
  return acc
}, {})

const gradeLabelToCode = gradeBandOptions.reduce<Record<string, string>>((acc, option) => {
  acc[option.label] = option.value
  return acc
}, {})

export function getGradeLabel(value?: string): string {
  if (!value) return ''
  return gradeCodeToLabel[value] ?? value
}

export function normalizeGradeBand(input?: string): string {
  if (!input) return ''
  if (gradeCodeToLabel[input]) {
    return input
  }
  return gradeLabelToCode[input] ?? ''
}

/**
 * 五环节模块配置
 */
export interface ModuleConfig {
  id: string
  title: string
  type: 'introduction' | 'knowledge' | 'experience' | 'experiment' | 'assignment'
  duration: number
  objectives: string[]
  resources: ResourceRef[]
  aiHints: string[]
  classroomActions: string[]
  content?: any
  // 用于表单绑定的文本字段
  objectivesText?: string
  aiHintsText?: string
  classroomActionsText?: string
}

export interface ResourceRef {
  id: string
  type: string
  title: string
  url?: string
  metadata?: any
}

export interface CourseEditor {
  basicInfo: {
    title: string
    description: string
    code: string
    subject: string
    gradeBand: string
    thumbnail?: string
  }
  fiveModules: {
    introduction: ModuleConfig
    knowledge: ModuleConfig
    experience: ModuleConfig
    experiment: ModuleConfig
    assignment: ModuleConfig
  }
  version: {
    current: string
    status: 'draft' | 'published'
    metadata: any
  }
  aclContent?: AiCourseLayout
}

export const useCourseStore = defineStore('course', () => {
  // 状态
  const courses = ref<CourseResponse[]>([])
  const currentCourse = ref<CourseResponse | null>(null)
  const currentVersion = ref<CourseVersionResponse | null>(null)
  const editor = ref<CourseEditor | null>(null)
  const loading = ref(false)
  const listLoading = ref(false)

  // 计算属性
  const hasUnsavedChanges = computed(() => {
    // TODO: 实现未保存变化的检测逻辑
    return false
  })

  const isDraftMode = computed(() => {
    return editor.value?.version.status === 'draft'
  })

  const publishedCourses = computed(() => {
    return courses.value.filter(course => course.status === 'PUBLISHED')
  })

  const draftCourses = computed(() => {
    return courses.value.filter(course => course.status === 'DRAFT')
  })

  /**
   * 初始化编辑器
   */
  function initializeEditor(course?: CourseResponse) {
    editor.value = {
      basicInfo: {
        title: course?.title || '',
        description: course?.description || '',
        code: course?.code || '',
        subject: course?.subject || '',
        gradeBand: course?.gradeBand || '',
        thumbnail: course?.thumbnail
      },
      fiveModules: {
        introduction: {
          id: 'intro-module',
          title: '课程引入',
          type: 'introduction',
          duration: 5,
          objectives: [],
          resources: [],
          aiHints: [],
          classroomActions: [],
          objectivesText: '',
          aiHintsText: '',
          classroomActionsText: ''
        },
        knowledge: {
          id: 'knowledge-module',
          title: '新知讲解',
          type: 'knowledge',
          duration: 15,
          objectives: [],
          resources: [],
          aiHints: [],
          classroomActions: [],
          objectivesText: '',
          aiHintsText: '',
          classroomActionsText: ''
        },
        experience: {
          id: 'experience-module',
          title: '体验理解',
          type: 'experience',
          duration: 10,
          objectives: [],
          resources: [],
          aiHints: [],
          classroomActions: [],
          objectivesText: '',
          aiHintsText: '',
          classroomActionsText: ''
        },
        experiment: {
          id: 'experiment-module',
          title: '实验活动',
          type: 'experiment',
          duration: 10,
          objectives: [],
          resources: [],
          aiHints: [],
          classroomActions: [],
          objectivesText: '',
          aiHintsText: '',
          classroomActionsText: ''
        },
        assignment: {
          id: 'assignment-module',
          title: '作业测试',
          type: 'assignment',
          duration: 5,
          objectives: [],
          resources: [],
          aiHints: [],
          classroomActions: [],
          objectivesText: '',
          aiHintsText: '',
          classroomActionsText: ''
        }
      },
      version: {
        current: course?.versions?.[0]?.version || '1.0.0',
        status: (course?.status === 'PUBLISHED' ? 'published' : 'draft') as 'draft' | 'published',
        metadata: course?.metadata || {}
      }
    }

    if (course) {
      currentCourse.value = course
      loadVersionContent(course)
    }
  }

  /**
   * 加载版本内容
   */
  async function loadVersionContent(course: CourseResponse) {
    try {
      const version = await courseApi.getLatestVersion(course.id)
      currentVersion.value = version

      if (version.aclJsonb) {
        const aclContent = JSON.parse(version.aclJsonb) as AiCourseLayout
        editor.value!.aclContent = aclContent

        // 将ACL内容映射到编辑器数据结构
        mapAclToEditor(aclContent)
      }
    } catch (error) {
      console.error('Failed to load version content:', error)
      ElMessage.error('加载课程内容失败')
    }
  }

  /**
   * 将ACL内容映射到编辑器
   */
  function mapAclToEditor(aclContent: AiCourseLayout) {
    if (!editor.value || !aclContent.structure) return

    // 映射基本信息
    editor.value.basicInfo.title = aclContent.courseInfo.title
    editor.value.basicInfo.description = aclContent.courseInfo.description || ''
    editor.value.basicInfo.subject = aclContent.courseInfo.subject
    const normalizedGradeBand = normalizeGradeBand(aclContent.courseInfo.grade)
    if (normalizedGradeBand) {
      editor.value.basicInfo.gradeBand = normalizedGradeBand
    }

    // 映射五环节结构
    aclContent.structure.forEach(node => {
      if (node.type in editor.value!.fiveModules) {
        const moduleType = node.type as keyof typeof editor.value.fiveModules
        editor.value!.fiveModules[moduleType] = {
          ...editor.value!.fiveModules[moduleType],
          id: node.id,
          title: node.title,
          duration: node.duration,
          objectives: node.learningGoals || [],
          objectivesText: (node.learningGoals || []).join('\n'),
          aiHints: node.aiStrategy?.dataSources || [],
          aiHintsText: (node.aiStrategy?.dataSources || []).join('\n'),
          classroomActions: [],
          classroomActionsText: '',
          resources: node.resourceRefs.map(ref => ({
            id: ref,
            type: 'unknown',
            title: ref
          })),
          content: node.content
        }
      }
    })
  }

  /**
   * 从编辑器生成ACL内容
   */
  function generateAclFromEditor(): AiCourseLayout | null {
    if (!editor.value) return null

    const structure = Object.values(editor.value.fiveModules).map(module => ({
      id: module.id,
      title: module.title,
      type: module.type,
      duration: module.duration,
      learningGoals: module.objectives,
      resourceRefs: module.resources.map(ref => ref.id),
      content: module.content,
      aiStrategy: module.aiHints.length > 0 ? {
        type: 'hint-driven',
        dataSources: module.aiHints
      } : undefined
    }))

    return {
      meta: {
        id: currentCourse.value?.id || '',
        version: editor.value.version.current,
        tenant: 'default',
        tags: [],
        contributors: [],
        lastModified: new Date().toISOString(),
        createdAt: new Date().toISOString()
      },
      courseInfo: {
        title: editor.value.basicInfo.title,
        description: editor.value.basicInfo.description,
        subject: editor.value.basicInfo.subject,
        grade: getGradeLabel(editor.value.basicInfo.gradeBand) || editor.value.basicInfo.gradeBand,
        learningObjectives: [],
        targetAudience: {
          grade: getGradeLabel(editor.value.basicInfo.gradeBand) || editor.value.basicInfo.gradeBand,
          learningStyles: ['visual', 'auditory']
        },
        estimatedDuration: Object.values(editor.value.fiveModules)
          .reduce((total, module) => total + module.duration, 0),
        aiPrompts: {
          generation: '生成适应性学习内容',
          assessment: '评估学习效果'
        }
      },
      structure,
      resourceRefs: []
    }
  }

  /**
   * 获取课程列表
   */
  async function fetchCourses(options: Parameters<typeof courseApi.getCourses>[0] = {}) {
    listLoading.value = true
    try {
      const response = await courseApi.getCourses(options)
      courses.value = response.courses
      return response
    } catch (error) {
      console.error('Failed to fetch courses:', error)
      ElMessage.error('获取课程列表失败')
      throw error
    } finally {
      listLoading.value = false
    }
  }

  /**
   * 获取课程详情
   */
  async function fetchCourseById(id: string) {
    loading.value = true
    try {
      const course = await courseApi.getCourseById(id)
      currentCourse.value = course
      return course
    } catch (error) {
      console.error('Failed to fetch course:', error)
      ElMessage.error('获取课程详情失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建课程
   */
  async function createCourse(withContent = false) {
    if (!editor.value) {
      ElMessage.error('编辑器未初始化')
      return
    }

    loading.value = true
    try {
      if (withContent) {
        const aclContent = generateAclFromEditor()
        const response = await courseApi.createCourseWithContent({
          ...editor.value.basicInfo,
          aclContent,
          version: editor.value.version.current,
          versionMetadata: editor.value.version.metadata
        })

        currentCourse.value = response.course
        ElMessage.success('课程创建成功')
        return response
      } else {
        const course = await courseApi.createCourse(editor.value.basicInfo)
        currentCourse.value = course
        ElMessage.success('课程创建成功')
        return course
      }
    } catch (error) {
      console.error('Failed to create course:', error)
      ElMessage.error('创建课程失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新课程
   */
  async function updateCourse() {
    if (!currentCourse.value || !editor.value) return

    loading.value = true
    try {
      const updatedCourse = await courseApi.updateCourse(
        currentCourse.value.id,
        editor.value.basicInfo
      )
      currentCourse.value = updatedCourse
      ElMessage.success('课程更新成功')
      return updatedCourse
    } catch (error) {
      console.error('Failed to update course:', error)
      ElMessage.error('更新课程失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 保存版本
   */
  async function saveVersion() {
    if (!currentCourse.value || !editor.value) return

    loading.value = true
    try {
      const aclContent = generateAclFromEditor()
      if (!aclContent) {
        throw new Error('无法生成ACL内容')
      }

      const version = await courseApi.createVersion(currentCourse.value.id, {
        aclContent,
        versionMetadata: editor.value.version.metadata
      })

      currentVersion.value = version
      editor.value.version.current = version.version
      ElMessage.success('版本保存成功')
      return version
    } catch (error) {
      console.error('Failed to save version:', error)
      ElMessage.error('保存版本失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 发布课程
   */
  async function publishCourse() {
    if (!currentCourse.value) return

    loading.value = true
    try {
      const updatedCourse = await courseApi.publishCourse(currentCourse.value.id)
      currentCourse.value = updatedCourse
      if (editor.value) {
        editor.value.version.status = 'published'
      }
      ElMessage.success('课程发布成功')
      return updatedCourse
    } catch (error) {
      console.error('Failed to publish course:', error)
      ElMessage.error('发布课程失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 归档课程
   */
  async function archiveCourse() {
    if (!currentCourse.value) return

    loading.value = true
    try {
      const updatedCourse = await courseApi.archiveCourse(currentCourse.value.id)
      currentCourse.value = updatedCourse
      ElMessage.success('课程归档成功')
      return updatedCourse
    } catch (error) {
      console.error('Failed to archive course:', error)
      ElMessage.error('归档课程失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除课程
   */
  async function deleteCourse(id: string) {
    loading.value = true
    try {
      await courseApi.deleteCourse(id)
      courses.value = courses.value.filter(course => course.id !== id)
      if (currentCourse.value?.id === id) {
        currentCourse.value = null
        currentVersion.value = null
        editor.value = null
      }
      ElMessage.success('课程删除成功')
    } catch (error) {
      console.error('Failed to delete course:', error)
      ElMessage.error('删除课程失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 重置状态
   */
  function reset() {
    courses.value = []
    currentCourse.value = null
    currentVersion.value = null
    editor.value = null
    loading.value = false
    listLoading.value = false
  }

  // Resource Management Actions
  function addResourceToModule(moduleType: keyof CourseEditor['fiveModules'], resource: ResourceRef) {
    if (!editor.value) return
    editor.value.fiveModules[moduleType].resources.push(resource)
  }

  function removeResourceFromModule(moduleType: keyof CourseEditor['fiveModules'], resourceId: string) {
    if (!editor.value) return
    editor.value.fiveModules[moduleType].resources =
      editor.value.fiveModules[moduleType].resources.filter(r => r.id !== resourceId)
  }

  function reorderResourcesInModule(moduleType: keyof CourseEditor['fiveModules'], newOrder: ResourceRef[]) {
    if (!editor.value) return
    editor.value.fiveModules[moduleType].resources = newOrder
  }

  return {
    // 状态
    courses,
    currentCourse,
    currentVersion,
    editor,
    loading,
    listLoading,

    // 计算属性
    hasUnsavedChanges,
    isDraftMode,
    publishedCourses,
    draftCourses,

    // 方法
    initializeEditor,
    fetchCourses,
    fetchCourseById,
    createCourse,
    updateCourse,
    saveVersion,
    publishCourse,
    archiveCourse,
    deleteCourse,
    reset,
    generateAclFromEditor,
    addResourceToModule,
    removeResourceFromModule,
    reorderResourcesInModule
  }
})
