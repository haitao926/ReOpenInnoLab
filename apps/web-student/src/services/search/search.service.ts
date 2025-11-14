import { ref, computed } from 'vue'
import { useCourseStore } from '@/stores/course'
import { useLabStore } from '@/stores/lab'
import { useDashboardStore } from '@/stores/dashboard'

/**
 * 搜索结果类型定义
 */
export interface SearchResult {
  id: string
  type: 'course' | 'chapter' | 'activity' | 'lab' | 'assignment' | 'announcement'
  title: string
  description: string
  url: string
  relevance: number
  metadata: {
    courseTitle?: string
    chapterTitle?: string
    activityType?: string
    labType?: string
    dueDate?: Date
    progress?: number
    tags?: string[]
  }
}

/**
 * 搜索配置
 */
export interface SearchConfig {
  maxResults: number
  minRelevance: number
  includeCompleted: boolean
  searchIn: {
    courses: boolean
    chapters: boolean
    activities: boolean
    labs: boolean
    assignments: boolean
    announcements: boolean
  }
}

/**
 * 全局搜索服务
 */
class SearchService {
  private static instance: SearchService
  private searchIndex = new Map<string, SearchResult[]>()
  private isIndexing = false

  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService()
    }
    return SearchService.instance
  }

  /**
   * 初始化搜索索引
   */
  async initializeSearchIndex(): Promise<void> {
    if (this.isIndexing) return

    this.isIndexing = true
    try {
      await this.buildSearchIndex()
    } finally {
      this.isIndexing = false
    }
  }

  /**
   * 构建搜索索引
   */
  private async buildSearchIndex(): Promise<void> {
    const courseStore = useCourseStore()
    const labStore = useLabStore()
    const dashboardStore = useDashboardStore()

    // 索引课程数据
    const courseResults: SearchResult[] = []

    // 课程
    if (courseStore.enrolledCourses?.length) {
      courseStore.enrolledCourses.forEach(course => {
        courseResults.push({
          id: `course-${course.id}`,
          type: 'course',
          title: course.title,
          description: course.description || '',
          url: `/courses/${course.id}`,
          relevance: 1.0,
          metadata: {
            courseTitle: course.title,
            tags: course.tags || [],
            progress: course.progress
          }
        })
      })
    }

    // 章节
    if (courseStore.currentCourse?.chapters?.length) {
      courseStore.currentCourse.chapters.forEach(chapter => {
        courseResults.push({
          id: `chapter-${chapter.id}`,
          type: 'chapter',
          title: chapter.title,
          description: chapter.description || '',
          url: `/courses/${courseStore.currentCourse?.id}/chapters/${chapter.id}`,
          relevance: 0.9,
          metadata: {
            courseTitle: courseStore.currentCourse?.title,
            tags: chapter.tags || [],
            progress: chapter.progress
          }
        })

        // 活动
        if (chapter.activities?.length) {
          chapter.activities.forEach(activity => {
            courseResults.push({
              id: `activity-${activity.id}`,
              type: 'activity',
              title: activity.title,
              description: activity.description || '',
              url: `/courses/${courseStore.currentCourse?.id}/chapters/${chapter.id}/activities/${activity.id}`,
              relevance: 0.8,
              metadata: {
                courseTitle: courseStore.currentCourse?.title,
                chapterTitle: chapter.title,
                activityType: activity.type,
                tags: activity.tags || []
              }
            })
          })
        }
      })
    }

    // 实验室
    if (labStore.availableLabs?.length) {
      labStore.availableLabs.forEach(lab => {
        courseResults.push({
          id: `lab-${lab.id}`,
          type: 'lab',
          title: lab.title,
          description: lab.description || '',
          url: `/lab/${lab.id}`,
          relevance: 0.85,
          metadata: {
            labType: lab.type,
            tags: lab.tags || []
          }
        })
      })
    }

    // 作业（从Dashboard获取）
    if (dashboardStore.upcomingDeadlines?.length) {
      dashboardStore.upcomingDeadlines.forEach(assignment => {
        courseResults.push({
          id: `assignment-${assignment.id}`,
          type: 'assignment',
          title: assignment.title,
          description: `作业 - ${assignment.courseTitle}`,
          url: `/assignments/${assignment.id}`,
          relevance: 0.95,
          metadata: {
            courseTitle: assignment.courseTitle,
            dueDate: assignment.deadline,
            tags: ['assignment', 'deadline']
          }
        })
      })
    }

    // 更新索引
    this.searchIndex.set('default', courseResults)
  }

  /**
   * 执行搜索
   */
  async search(query: string, config: Partial<SearchConfig> = {}): Promise<SearchResult[]> {
    const defaultConfig: SearchConfig = {
      maxResults: 20,
      minRelevance: 0.3,
      includeCompleted: true,
      searchIn: {
        courses: true,
        chapters: true,
        activities: true,
        labs: true,
        assignments: true,
        announcements: false
      },
      ...config
    }

    if (!query.trim()) {
      return []
    }

    // 确保索引已初始化
    if (this.searchIndex.size === 0) {
      await this.initializeSearchIndex()
    }

    const allResults = this.searchIndex.get('default') || []
    const queryLower = query.toLowerCase()
    const queryTerms = queryLower.split(/\s+/).filter(term => term.length > 0)

    // 计算相关性分数
    const scoredResults = allResults.map(result => {
      let relevance = 0
      const titleLower = result.title.toLowerCase()
      const descriptionLower = result.description.toLowerCase()
      const tags = result.metadata.tags?.map(tag => tag.toLowerCase()) || []

      // 标题匹配权重最高
      if (titleLower.includes(queryLower)) {
        relevance += 2.0
      }

      // 完全匹配
      if (titleLower === queryLower) {
        relevance += 3.0
      }

      // 词语匹配
      queryTerms.forEach(term => {
        if (titleLower.includes(term)) {
          relevance += 1.5
        }
        if (descriptionLower.includes(term)) {
          relevance += 1.0
        }
        if (tags.some(tag => tag.includes(term))) {
          relevance += 0.8
        }
      })

      // 类型权重调整
      const typeWeights = {
        course: 1.2,
        assignment: 1.1,
        chapter: 1.0,
        activity: 0.9,
        lab: 0.85,
        announcement: 0.7
      }

      relevance *= (typeWeights[result.type] || 1.0)

      // 应用元数据权重
      if (result.metadata.progress !== undefined) {
        // 进行中的项目权重略高
        if (result.metadata.progress > 0 && result.metadata.progress < 100) {
          relevance *= 1.1
        }
      }

      if (result.metadata.dueDate) {
        const now = new Date()
        const daysUntilDue = (result.metadata.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)

        // 即将到期的作业权重更高
        if (daysUntilDue <= 3 && daysUntilDue >= 0) {
          relevance *= 1.3
        }
      }

      return {
        ...result,
        relevance: relevance * result.relevance // 基础相关性 * 计算相关性
      }
    })

    // 过滤和排序
    return scoredResults
      .filter(result => {
        // 过滤低相关性结果
        if (result.relevance < defaultConfig.minRelevance) {
          return false
        }

        // 类型过滤
        return defaultConfig.searchIn[result.type as keyof typeof defaultConfig.searchIn]
      })
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, defaultConfig.maxResults)
  }

  /**
   * 获取搜索建议
   */
  async getSuggestions(query: string, limit: number = 5): Promise<string[]> {
    if (!query.trim()) {
      return []
    }

    const results = await this.search(query, { maxResults: limit * 3 })
    const suggestions = new Set<string>()

    // 从标题中提取建议
    results.forEach(result => {
      const titleWords = result.title.split(/\s+/)
      titleWords.forEach(word => {
        if (word.toLowerCase().includes(query.toLowerCase()) && word.length > 2) {
          suggestions.add(word)
        }
      })
    })

    // 添加常见搜索词
    const commonTerms = ['python', 'javascript', '机器学习', '数据结构', '算法', '实验', '作业', '课程']
    commonTerms.forEach(term => {
      if (term.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(term)
      }
    })

    return Array.from(suggestions).slice(0, limit)
  }

  /**
   * 重新构建索引
   */
  async rebuildIndex(): Promise<void> {
    this.searchIndex.clear()
    await this.initializeSearchIndex()
  }

  /**
   * 获取热门搜索
   */
  getPopularSearches(): string[] {
    return [
      'Python编程',
      '机器学习',
      '数据科学',
      'Jupyter实验',
      '作业提交',
      '算法练习',
      '深度学习',
      'Web开发'
    ]
  }

  /**
   * 获取搜索历史
   */
  getSearchHistory(): string[] {
    const history = localStorage.getItem('search_history')
    return history ? JSON.parse(history) : []
  }

  /**
   * 保存搜索历史
   */
  saveSearchHistory(query: string): void {
    if (!query.trim()) return

    const history = this.getSearchHistory()
    const newHistory = [query, ...history.filter(item => item !== query)].slice(0, 10)
    localStorage.setItem('search_history', JSON.stringify(newHistory))
  }

  /**
   * 清除搜索历史
   */
  clearSearchHistory(): void {
    localStorage.removeItem('search_history')
  }
}

/**
 * 搜索组合式API
 */
export function useSearch() {
  const searchService = SearchService.getInstance()

  const searchQuery = ref('')
  const searchResults = ref<SearchResult[]>([])
  const isSearching = ref(false)
  const searchSuggestions = ref<string[]>([])
  const showSuggestions = ref(false)

  const searchHistory = computed(() => searchService.getSearchHistory())
  const popularSearches = computed(() => searchService.getPopularSearches())

  /**
   * 执行搜索
   */
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      searchResults.value = []
      showSuggestions.value = false
      return
    }

    isSearching.value = true
    searchQuery.value = query

    try {
      searchResults.value = await searchService.search(query)
      searchService.saveSearchHistory(query)
      showSuggestions.value = false
    } catch (error) {
      console.error('搜索失败:', error)
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }

  /**
   * 获取建议
   */
  const fetchSuggestions = async (query: string) => {
    if (!query.trim()) {
      searchSuggestions.value = []
      showSuggestions.value = false
      return
    }

    try {
      searchSuggestions.value = await searchService.getSuggestions(query)
      showSuggestions.value = true
    } catch (error) {
      console.error('获取建议失败:', error)
      searchSuggestions.value = []
    }
  }

  /**
   * 选择建议
   */
  const selectSuggestion = (suggestion: string) => {
    performSearch(suggestion)
  }

  /**
   * 清除搜索
   */
  const clearSearch = () => {
    searchQuery.value = ''
    searchResults.value = []
    searchSuggestions.value = []
    showSuggestions.value = false
  }

  /**
   * 初始化搜索
   */
  const initializeSearch = async () => {
    await searchService.initializeSearchIndex()
  }

  return {
    // 状态
    searchQuery,
    searchResults,
    isSearching,
    searchSuggestions,
    showSuggestions,
    searchHistory,
    popularSearches,

    // 方法
    performSearch,
    fetchSuggestions,
    selectSuggestion,
    clearSearch,
    initializeSearch,
    clearHistory: () => searchService.clearSearchHistory(),
    rebuildIndex: () => searchService.rebuildIndex()
  }
}

export { SearchService }