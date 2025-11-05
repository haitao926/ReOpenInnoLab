import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { subjectService, type Subject } from '@/api/subjects'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'

export interface UseSubjectsOptions {
  teacherId?: string
  includeInactive?: boolean
  autoLoad?: boolean
  localStorageKey?: string
}

export interface SubjectStats {
  courseCount: number
  studentCount: number
  avgCompletion: number
  recentActivity: number
}

export function useSubjects(options: UseSubjectsOptions = {}) {
  const {
    teacherId,
    includeInactive = false,
    autoLoad = true,
    localStorageKey = 'teacher-subject-preferences'
  } = options

  const appStore = useAppStore()
  const userStore = useUserStore()

  // 从 appStore 获取响应式数据
  const {
    subjectsLoading,
    availableSubjects,
    selectedSubject,
    recommendedSubjects,
    currentSubjectInfo,
    filteredSubjects,
    hasSubjectData
  } = storeToRefs(appStore)

  // 本地状态
  const subjectStats = ref<Record<string, SubjectStats>>({})
  const error = ref<string | null>(null)

  // 计算属性
  const activeSubjects = computed(() =>
    availableSubjects.value.filter(subject => subject.isActive)
  )

  const hasSubjects = computed(() => availableSubjects.value.length > 0)

  const defaultSubject = computed(() => {
    const saved = getSavedPreference()
    if (saved && availableSubjects.value.find(s => s.id === saved)) {
      return saved
    }
    return availableSubjects.value.find(s => s.id === 'my-subjects')?.id || availableSubjects.value[0]?.id || ''
  })

  // 兼容原有的 selectedSubjectId 属性
  const selectedSubjectId = computed({
    get: () => selectedSubject.value,
    set: (value: string) => appStore.setSelectedSubject(value)
  })

  // 加载学科列表
  const loadSubjects = async (forceRefresh = false) => {
    try {
      error.value = null

      const teacherIdToUse = teacherId || userStore.userInfo?.id
      if (!teacherIdToUse) {
        throw new Error('教师ID不存在')
      }

      await appStore.loadSubjects(teacherIdToUse, forceRefresh)

      // 保存偏好到本地存储
      if (selectedSubject.value) {
        savePreference(selectedSubject.value)
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载学科列表失败'
      error.value = errorMessage
      ElMessage.error(errorMessage)
      console.error('加载学科列表失败:', err)
    }
  }

  // 加载学科统计数据
  const loadSubjectStats = async (subjectId?: string) => {
    const targetSubjectId = subjectId || selectedSubject.value
    if (!targetSubjectId || targetSubjectId === 'all' || targetSubjectId === 'my-subjects') {
      return
    }

    try {
      const teacherIdToUse = teacherId || userStore.userInfo?.id
      const stats = await subjectService.getSubjectStats(targetSubjectId, teacherIdToUse)
      subjectStats.value[targetSubjectId] = stats
    } catch (err) {
      console.error(`加载学科 ${targetSubjectId} 统计数据失败:`, err)
    }
  }

  // 选择学科
  const selectSubject = async (subjectId: string) => {
    if (subjectId === selectedSubject.value) {
      return
    }

    appStore.setSelectedSubject(subjectId)
    savePreference(subjectId)

    // 加载该学科的统计数据
    await loadSubjectStats(subjectId)

    // 同步偏好到后端
    try {
      const teacherIdToUse = teacherId || userStore.userInfo?.id
      if (teacherIdToUse) {
        await subjectService.setTeacherSubjectPreference(teacherIdToUse, [subjectId])
      }
    } catch (err) {
      console.error('同步学科偏好失败:', err)
    }
  }

  // 搜索学科
  const searchSubjects = async (query: string): Promise<Subject[]> => {
    if (!query.trim()) {
      return activeSubjects.value
    }

    try {
      return await subjectService.searchSubjects(query)
    } catch (err) {
      console.error('搜索学科失败:', err)
      return []
    }
  }

  // 刷新学科列表
  const refreshSubjects = () => {
    const teacherIdToUse = teacherId || userStore.userInfo?.id
    return appStore.refreshSubjects(teacherIdToUse)
  }

  // 获取学科的统计数据
  const getSubjectStats = (subjectId?: string): SubjectStats => {
    const targetId = subjectId || selectedSubject.value
    return subjectStats.value[targetId] || {
      courseCount: 0,
      studentCount: 0,
      avgCompletion: 0,
      recentActivity: 0
    }
  }

  // 批量获取学科信息
  const getBatchSubjects = async (subjectIds: string[]) => {
    return await subjectService.getBatchSubjects(subjectIds)
  }

  // 获取推荐学科
  const getRecommendedSubjects = async () => {
    const teacherIdToUse = teacherId || userStore.userInfo?.id
    return await appStore.loadRecommendedSubjects(teacherIdToUse)
  }

  // 本地存储管理
  const getSavedPreference = (): string | null => {
    try {
      return localStorage.getItem(localStorageKey)
    } catch {
      return null
    }
  }

  const savePreference = (subjectId: string) => {
    try {
      localStorage.setItem(localStorageKey, subjectId)
    } catch (err) {
      console.error('保存学科偏好失败:', err)
    }
  }

  const clearPreference = () => {
    try {
      localStorage.removeItem(localStorageKey)
    } catch (err) {
      console.error('清除学科偏好失败:', err)
    }
  }

  // 组件挂载时自动加载
  if (autoLoad && !hasSubjectData.value) {
    const teacherIdToUse = teacherId || userStore.userInfo?.id
    appStore.preloadSubjectData(teacherIdToUse).catch(err => {
      console.error('预加载学科数据失败:', err)
    })
  }

  return {
    // 状态（从 appStore 获取）
    loading: subjectsLoading,
    subjects: availableSubjects,
    selectedSubject: currentSubjectInfo,
    selectedSubjectId,
    subjectStats,
    error,
    recommendedSubjects,
    currentSubjectInfo,

    // 计算属性
    activeSubjects: filteredSubjects,
    hasSubjects,
    defaultSubject,
    hasSubjectData,

    // 方法
    loadSubjects,
    loadSubjectStats,
    selectSubject,
    searchSubjects,
    refreshSubjects,
    getSubjectStats,
    getBatchSubjects,
    getRecommendedSubjects,
    clearPreference,

    // 工具方法
    getSavedPreference,
    savePreference,

    // 直接访问 appStore 方法
    getSubjectById: appStore.getSubjectById,
    getSubjectColor: appStore.getSubjectColor,
    getSubjectIcon: appStore.getSubjectIcon,
    validateSubjectSelection: appStore.validateSubjectSelection,
    clearSubjectCache: appStore.clearSubjectCache
  }
}

export default useSubjects
