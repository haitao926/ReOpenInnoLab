import { defineAsyncComponent, defineComponent, h, type Component } from 'vue'
import type { CourseSectionData, SectionConfig } from '@/shared/types/course'

// 五环节组件配置
export interface FiveSectionConfig {
  type: 'introduction' | 'knowledge' | 'experience' | 'experiment' | 'assignment'
  title: string
  description?: string
  icon?: string
  duration?: number // 预计时长（分钟）
  required?: boolean
  order: number
}

// 五环节组件映射
const sectionComponents = {
  introduction: () => import('./IntroductionSection.vue'),
  knowledge: () => import('./KnowledgeSection.vue'),
  experience: () => import('./ExperienceSection.vue'),
  experiment: () => import('./ExperimentSection.vue'),
  assignment: () => import('./AssignmentSection.vue')
}

// 五环节组件配置
export const SECTION_CONFIGS: Record<string, FiveSectionConfig> = {
  introduction: {
    type: 'introduction',
    title: '课程引入',
    description: '通过情境创设，激发学生学习兴趣',
    icon: 'VideoPlay',
    duration: 10,
    required: true,
    order: 1
  },
  knowledge: {
    type: 'knowledge',
    title: '新知讲解',
    description: '系统讲解核心知识点，构建知识体系',
    icon: 'Reading',
    duration: 20,
    required: true,
    order: 2
  },
  experience: {
    type: 'experience',
    title: '体验理解',
    description: '通过互动体验，深化知识理解',
    icon: 'Monitor',
    duration: 15,
    required: true,
    order: 3
  },
  experiment: {
    type: 'experiment',
    title: '实验活动',
    description: '动手实践，验证理论，培养探究能力',
    icon: 'Science',
    duration: 25,
    required: false,
    order: 4
  },
  assignment: {
    type: 'assignment',
    title: '作业测试',
    description: '巩固所学，检验学习效果',
    icon: 'EditPen',
    duration: 15,
    required: true,
    order: 5
  }
}

/**
 * 创建五环节组件
 */
export function createSection(config: SectionConfig): Component {
  const AsyncComponent = defineAsyncComponent({
    loader: sectionComponents[config.type],
    loadingComponent: () => h('div', '加载中...'),
    errorComponent: () => h('div', '加载失败'),
    delay: 200,
    timeout: 3000
  })

  return defineComponent({
    name: `${config.type}SectionWrapper`,
    setup() {
      return () => h(AsyncComponent, {
        data: config.data,
        config: SECTION_CONFIGS[config.type],
        readonly: config.readonly,
        onSaved: config.onSaved,
        onChanged: config.onChanged
      })
    }
  })
}

/**
 * 五环节渲染器组件
 */
export const SectionRenderer = defineComponent({
  name: 'SectionRenderer',
  props: {
    sections: {
      type: Array as () => CourseSectionData[],
      required: true
    },
    readonly: {
      type: Boolean,
      default: false
    },
    editable: {
      type: Boolean,
      default: true
    }
  },
  emits: ['section-added', 'section-updated', 'section-deleted', 'section-moved'],
  setup(props, { emit }) {
    // 渲染单个环节
    const renderSection = (section: CourseSectionData) => {
      const sectionConfig = SECTION_CONFIGS[section.type]
      if (!sectionConfig) return null

      const SectionComponent = createSection({
        type: section.type,
        data: section.data,
        readonly: props.readonly,
        onSaved: (data) => {
          emit('section-updated', section.id, data)
        },
        onChanged: (data) => {
          // 实时保存或标记为已更改
          section.data = data
        }
      })

      return h('div', {
        class: 'section-wrapper',
        key: section.id,
        'data-section-type': section.type,
        'data-section-order': section.order
      }, [
        // 环节标题
        h('div', {
          class: 'section-header'
        }, [
          h('h3', {
            class: 'section-title'
          }, [
            h('el-icon', null, { default: () => sectionConfig.icon }),
            sectionConfig.title
          ]),
          h('span', {
            class: 'section-duration'
          }, `${sectionConfig.duration} 分钟`),
          props.editable && !props.readonly && h('div', {
            class: 'section-actions'
          }, [
            h('el-button', {
              type: 'text',
              size: 'small',
              onClick: () => moveSectionUp(section.id)
            }, { default: () => '上移' }),
            h('el-button', {
              type: 'text',
              size: 'small',
              onClick: () => moveSectionDown(section.id)
            }, { default: () => '下移' }),
            h('el-button', {
              type: 'text',
              size: 'small',
              onClick: () => deleteSection(section.id)
            }, { default: () => '删除' })
          ])
        ]),

        // 环节内容
        h('div', {
          class: 'section-content'
        }, [
          h(SectionComponent)
        ])
      ])
    }

    // 环节操作
    const addSection = (type: string) => {
      const config = SECTION_CONFIGS[type]
      if (!config) return

      const newSection: CourseSectionData = {
        id: `section_${Date.now()}`,
        type: type as any,
        title: config.title,
        order: props.sections.length + 1,
        data: {}
      }

      emit('section-added', newSection)
    }

    const deleteSection = (id: string) => {
      emit('section-deleted', id)
    }

    const moveSectionUp = (id: string) => {
      const index = props.sections.findIndex(s => s.id === id)
      if (index > 0) {
        emit('section-moved', { id, direction: 'up' })
      }
    }

    const moveSectionDown = (id: string) => {
      const index = props.sections.findIndex(s => s.id === id)
      if (index < props.sections.length - 1) {
        emit('section-moved', { id, direction: 'down' })
      }
    }

    // 获取可添加的环节类型
    const getAvailableSectionTypes = () => {
      const usedTypes = props.sections.map(s => s.type)
      return Object.entries(SECTION_CONFIGS)
        .filter(([type]) => !usedTypes.includes(type as any))
        .map(([type, config]) => ({
          type,
          ...config
        }))
    }

    return () => h('div', {
      class: 'section-renderer'
    }, [
      // 渲染现有环节
      props.sections
        .sort((a, b) => a.order - b.order)
        .map(section => renderSection(section)),

      // 添加新环节按钮
      props.editable && !props.readonly && getAvailableSectionTypes().length > 0 &&
      h('div', {
        class: 'section-add'
      }, [
        h('el-dropdown', {
          trigger: 'click'
        }, {
          default: () => h('el-button', {
            type: 'dashed',
            icon: 'Plus'
          }, { default: () => '添加环节' }),
          dropdown: () => h('el-dropdown-menu', {}, {
            default: () => getAvailableSectionTypes().map(config =>
              h('el-dropdown-item', {
                key: config.type,
                icon: config.icon,
                onClick: () => addSection(config.type)
              }, { default: () => config.title })
            )
          })
        })
      ])
    ])
  }
})

/**
 * 五环节配置管理器
 */
export class SectionConfigManager {
  private static instance: SectionConfigManager
  private configs: Map<string, FiveSectionConfig> = new Map()

  static getInstance(): SectionConfigManager {
    if (!this.instance) {
      this.instance = new SectionConfigManager()
    }
    return this.instance
  }

  constructor() {
    // 初始化默认配置
    Object.entries(SECTION_CONFIGS).forEach(([key, config]) => {
      this.configs.set(key, config)
    })
  }

  /**
   * 注册自定义环节配置
   */
  registerSection(key: string, config: FiveSectionConfig) {
    this.configs.set(key, config)
  }

  /**
   * 获取环节配置
   */
  getConfig(type: string): FiveSectionConfig | undefined {
    return this.configs.get(type)
  }

  /**
   * 获取所有配置
   */
  getAllConfigs(): Map<string, FiveSectionConfig> {
    return new Map(this.configs)
  }

  /**
   * 验证课程是否包含所有必需环节
   */
  validateCourseSections(sections: CourseSectionData[]): {
    valid: boolean
    missing: string[]
    warnings: string[]
  } {
    const requiredTypes = Array.from(this.configs.values())
      .filter(config => config.required)
      .map(config => config.type)

    const usedTypes = sections.map(s => s.type)
    const missing = requiredTypes.filter(type => !usedTypes.includes(type))

    const warnings: string[] = []
    if (sections.length === 0) {
      warnings.push('课程还没有添加任何环节')
    }

    return {
      valid: missing.length === 0,
      missing,
      warnings
    }
  }

  /**
   * 计算课程总时长
   */
  calculateTotalDuration(sections: CourseSectionData[]): number {
    return sections.reduce((total, section) => {
      const config = this.getConfig(section.type)
      return total + (config?.duration || 0)
    }, 0)
  }
}

/**
 * 获取五环节组件工厂实例
 */
export const sectionFactory = {
  create: createSection,
  Renderer: SectionRenderer,
  configManager: SectionConfigManager.getInstance(),
  configs: SECTION_CONFIGS
}