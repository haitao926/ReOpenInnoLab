/**
 * 管理页面侧边栏配置常量
 * 统一左侧栏和右侧栏的区块类型、标题和默认内容
 */

// 左侧栏区块类型枚举
export enum LeftSidebarSection {
  FILTERS = 'filters',           // 筛选器：搜索+分类筛选
  QUICK_ACTIONS = 'quickActions', // 快捷操作：按钮区
  ACTIVITY = 'activity',         // 教学动态：时间线/提醒动态
  RESOURCES = 'resources'        // 模板资源：模板/资源列表
}

// 右侧栏区块类型枚举
export enum RightSidebarSection {
  INSIGHTS = 'insights',          // 数据洞察：统计/分析
  COLLABORATION = 'collaboration', // 协作动态：协作记录
  RESOURCES = 'resources'         // 资源参考：资源/链接
}

// 左侧栏区块配置接口
export interface LeftSidebarSectionConfig {
  type: LeftSidebarSection
  title: string
  icon?: string
  visible?: boolean
  collapsible?: boolean
  defaultCollapsed?: boolean
  data?: any
}

// 右侧栏区块配置接口
export interface RightSidebarSectionConfig {
  type: RightSidebarSection
  title: string
  icon?: string
  visible?: boolean
  collapsible?: boolean
  defaultCollapsed?: boolean
  data?: any
}

// 左侧栏区块默认配置
export const LEFT_SIDEBAR_DEFAULTS: Record<LeftSidebarSection, Omit<LeftSidebarSectionConfig, 'type'>> = {
  [LeftSidebarSection.FILTERS]: {
    title: '筛选条件',
    icon: 'Filter',
    visible: true,
    collapsible: true,
    defaultCollapsed: false
  },
  [LeftSidebarSection.QUICK_ACTIONS]: {
    title: '快捷操作',
    icon: 'Lightning',
    visible: true,
    collapsible: true,
    defaultCollapsed: false
  },
  [LeftSidebarSection.ACTIVITY]: {
    title: '教学动态',
    icon: 'Bell',
    visible: true,
    collapsible: true,
    defaultCollapsed: false
  },
  [LeftSidebarSection.RESOURCES]: {
    title: '模板资源',
    icon: 'FolderOpened',
    visible: true,
    collapsible: true,
    defaultCollapsed: false
  }
}

// 右侧栏区块默认配置
export const RIGHT_SIDEBAR_DEFAULTS: Record<RightSidebarSection, Omit<RightSidebarSectionConfig, 'type'>> = {
  [RightSidebarSection.INSIGHTS]: {
    title: '数据洞察',
    icon: 'TrendCharts',
    visible: true,
    collapsible: true,
    defaultCollapsed: false
  },
  [RightSidebarSection.COLLABORATION]: {
    title: '协作动态',
    icon: 'User',
    visible: true,
    collapsible: true,
    defaultCollapsed: false
  },
  [RightSidebarSection.RESOURCES]: {
    title: '资源参考',
    icon: 'Collection',
    visible: true,
    collapsible: true,
    defaultCollapsed: false
  }
}

// 默认左侧栏配置（用于大多数管理页面）
export const DEFAULT_LEFT_SIDEBAR_SECTIONS: LeftSidebarSectionConfig[] = [
  {
    type: LeftSidebarSection.FILTERS,
    ...LEFT_SIDEBAR_DEFAULTS[LeftSidebarSection.FILTERS]
  },
  {
    type: LeftSidebarSection.QUICK_ACTIONS,
    ...LEFT_SIDEBAR_DEFAULTS[LeftSidebarSection.QUICK_ACTIONS]
  },
  {
    type: LeftSidebarSection.ACTIVITY,
    ...LEFT_SIDEBAR_DEFAULTS[LeftSidebarSection.ACTIVITY]
  }
]

// 默认右侧栏配置（用于大多数管理页面）
export const DEFAULT_RIGHT_SIDEBAR_SECTIONS: RightSidebarSectionConfig[] = [
  {
    type: RightSidebarSection.INSIGHTS,
    ...RIGHT_SIDEBAR_DEFAULTS[RightSidebarSection.INSIGHTS]
  },
  {
    type: RightSidebarSection.RESOURCES,
    ...RIGHT_SIDEBAR_DEFAULTS[RightSidebarSection.RESOURCES]
  },
  {
    type: RightSidebarSection.COLLABORATION,
    ...RIGHT_SIDEBAR_DEFAULTS[RightSidebarSection.COLLABORATION]
  }
]

// 页面特定的侧边栏配置
export const PAGE_SIDEBAR_CONFIGS = {
  courses: {
    left: DEFAULT_LEFT_SIDEBAR_SECTIONS,
    right: DEFAULT_RIGHT_SIDEBAR_SECTIONS
  },
  labs: {
    left: [
      ...DEFAULT_LEFT_SIDEBAR_SECTIONS,
      {
        type: LeftSidebarSection.RESOURCES,
        ...LEFT_SIDEBAR_DEFAULTS[LeftSidebarSection.RESOURCES]
      }
    ],
    right: [
      {
        type: RightSidebarSection.INSIGHTS,
        ...RIGHT_SIDEBAR_DEFAULTS[RightSidebarSection.INSIGHTS]
      },
      {
        type: RightSidebarSection.RESOURCES,
        ...RIGHT_SIDEBAR_DEFAULTS[RightSidebarSection.RESOURCES]
      }
    ]
  },
  experiences: {
    left: [
      {
        type: LeftSidebarSection.FILTERS,
        ...LEFT_SIDEBAR_DEFAULTS[LeftSidebarSection.FILTERS]
      },
      {
        type: LeftSidebarSection.QUICK_ACTIONS,
        ...LEFT_SIDEBAR_DEFAULTS[LeftSidebarSection.QUICK_ACTIONS]
      },
      {
        type: LeftSidebarSection.ACTIVITY,
        ...LEFT_SIDEBAR_DEFAULTS[LeftSidebarSection.ACTIVITY]
      },
      {
        type: LeftSidebarSection.RESOURCES,
        ...LEFT_SIDEBAR_DEFAULTS[LeftSidebarSection.RESOURCES]
      }
    ],
    right: [
      {
        type: RightSidebarSection.INSIGHTS,
        ...RIGHT_SIDEBAR_DEFAULTS[RightSidebarSection.INSIGHTS]
      },
      {
        type: RightSidebarSection.COLLABORATION,
        ...RIGHT_SIDEBAR_DEFAULTS[RightSidebarSection.COLLABORATION]
      },
      {
        type: RightSidebarSection.RESOURCES,
        ...RIGHT_SIDEBAR_DEFAULTS[RightSidebarSection.RESOURCES]
      }
    ]
  },
  assignments: {
    left: DEFAULT_LEFT_SIDEBAR_SECTIONS,
    right: [
      {
        type: RightSidebarSection.INSIGHTS,
        ...RIGHT_SIDEBAR_DEFAULTS[RightSidebarSection.INSIGHTS]
      },
      {
        type: RightSidebarSection.RESOURCES,
        ...RIGHT_SIDEBAR_DEFAULTS[RightSidebarSection.RESOURCES]
      }
    ]
  },
  classrooms: {
    left: [
      {
        type: LeftSidebarSection.FILTERS,
        ...LEFT_SIDEBAR_DEFAULTS[LeftSidebarSection.FILTERS]
      },
      {
        type: LeftSidebarSection.QUICK_ACTIONS,
        ...LEFT_SIDEBAR_DEFAULTS[LeftSidebarSection.QUICK_ACTIONS]
      },
      {
        type: LeftSidebarSection.ACTIVITY,
        ...LEFT_SIDEBAR_DEFAULTS[LeftSidebarSection.ACTIVITY]
      },
      {
        type: LeftSidebarSection.RESOURCES,
        ...LEFT_SIDEBAR_DEFAULTS[LeftSidebarSection.RESOURCES]
      }
    ],
    right: [
      {
        type: RightSidebarSection.INSIGHTS,
        ...RIGHT_SIDEBAR_DEFAULTS[RightSidebarSection.INSIGHTS]
      },
      {
        type: RightSidebarSection.COLLABORATION,
        ...RIGHT_SIDEBAR_DEFAULTS[RightSidebarSection.COLLABORATION]
      },
      {
        type: RightSidebarSection.RESOURCES,
        ...RIGHT_SIDEBAR_DEFAULTS[RightSidebarSection.RESOURCES]
      }
    ]
  },
  resources: {
    left: [
      {
        type: LeftSidebarSection.FILTERS,
        ...LEFT_SIDEBAR_DEFAULTS[LeftSidebarSection.FILTERS]
      }
    ],
    right: [
      {
        type: RightSidebarSection.INSIGHTS,
        ...RIGHT_SIDEBAR_DEFAULTS[RightSidebarSection.INSIGHTS]
      },
      {
        type: RightSidebarSection.RESOURCES,
        ...RIGHT_SIDEBAR_DEFAULTS[RightSidebarSection.RESOURCES]
      }
    ]
  },
  dashboard: {
    left: [
      {
        type: LeftSidebarSection.FILTERS,
        ...LEFT_SIDEBAR_DEFAULTS[LeftSidebarSection.FILTERS]
      },
      {
        type: LeftSidebarSection.QUICK_ACTIONS,
        ...LEFT_SIDEBAR_DEFAULTS[LeftSidebarSection.QUICK_ACTIONS]
      },
      {
        type: LeftSidebarSection.RESOURCES,
        ...LEFT_SIDEBAR_DEFAULTS[LeftSidebarSection.RESOURCES]
      }
    ],
    right: [
      {
        type: RightSidebarSection.INSIGHTS,
        ...RIGHT_SIDEBAR_DEFAULTS[RightSidebarSection.INSIGHTS]
      },
      {
        type: RightSidebarSection.COLLABORATION,
        ...RIGHT_SIDEBAR_DEFAULTS[RightSidebarSection.COLLABORATION]
      }
    ]
  },
  analytics: {
    left: [
      {
        type: LeftSidebarSection.FILTERS,
        ...LEFT_SIDEBAR_DEFAULTS[LeftSidebarSection.FILTERS]
      }
    ],
    right: [
      {
        type: RightSidebarSection.INSIGHTS,
        ...RIGHT_SIDEBAR_DEFAULTS[RightSidebarSection.INSIGHTS]
      }
    ]
  }
} as const