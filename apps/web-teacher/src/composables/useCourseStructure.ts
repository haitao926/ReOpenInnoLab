import { ref } from 'vue'

export interface ChapterInfo {
  id: string
  title: string
  description: string
  type: 'content' | 'experiment' | 'interactive' | 'assessment'
  duration: number
  goals: string[]
  resource?: string
}

export function useCourseStructure() {
  const chapters = ref<ChapterInfo[]>([])

  // 根据模块类型获取章节类型
  const getModuleTypeFromType = (moduleType: string): ChapterInfo['type'] => {
    const typeMap: Record<string, ChapterInfo['type']> = {
      'INTRODUCTION': 'content',
      'KNOWLEDGE': 'content',
      'EXPERIENCE': 'interactive',
      'EXPERIMENT': 'experiment',
      'ASSIGNMENT': 'assessment'
    }
    return typeMap[moduleType] || 'content'
  }

  // 解析课程结构生成章节
  const parseCourseStructure = (version: any) => {
    chapters.value = []

    try {
      // 如果有ACL内容，解析ACL
      if (version?.aclJsonb) {
        const aclContent = typeof version.aclJsonb === 'string' 
          ? JSON.parse(version.aclJsonb) 
          : version.aclJsonb

        if (aclContent.structure?.modules) {
          aclContent.structure.modules.forEach((module: any, index: number) => {
            chapters.value.push({
              id: module.id || `module-${index}`,
              title: module.title,
              description: module.description || `${module.title}内容`,
              type: getModuleTypeFromType(module.type),
              duration: module.duration || module.estimatedMinutes || 30,
              goals: module.objectives || module.learningGoals || []
            })
          })
          return
        }
      }
    } catch (error) {
      console.error('解析课程结构失败:', error)
    }

    // 解析失败或无数据时提供默认章节 (仅在需要默认值时)
    if (chapters.value.length === 0) {
      chapters.value = [
        {
          id: 'default-chapter',
          title: '课程内容',
          description: '课程主要内容章节',
          type: 'content',
          duration: 45,
          goals: ['完成课程学习']
        }
      ]
    }
  }

  return {
    chapters,
    parseCourseStructure,
    getModuleTypeFromType
  }
}
