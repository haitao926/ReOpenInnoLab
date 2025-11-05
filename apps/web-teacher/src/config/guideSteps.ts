import { ref } from 'vue'

export interface GuideStep {
  id: string
  title: string
  description: string
  target?: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  offset?: { x: number; y: number }
  content?: any
  interactive?: any
  action?: string
  beforeShow?: () => Promise<void>
  afterShow?: () => void
}

// 基础功能引导步骤
export const basicGuideSteps: GuideStep[] = [
  {
    id: 'welcome',
    title: '欢迎使用ReOpenInnoLab',
    description: '这是一个面向教育创新的综合性平台，让我们快速了解主要功能。',
    position: 'center',
    afterShow: () => {
      // 可以在这里添加欢迎动画
    }
  },
  {
    id: 'sidebar',
    title: '侧边导航栏',
    description: '这里是您的主要导航区域，可以快速访问各个功能模块。',
    target: '.app-sidebar',
    position: 'right',
    offset: { x: 20, y: 0 }
  },
  {
    id: 'dashboard',
    title: '教师控制台',
    description: '这里展示了您需要关注的重要信息，包括待办事项、教学数据统计等。',
    target: '.dashboard-overview',
    position: 'bottom',
    offset: { x: 0, y: 10 }
  },
  {
    id: 'ai-assistant',
    title: 'AI教学助手',
    description: '您的智能教学助手，可以为您解答教学问题、提供教学建议、批改作业等。',
    target: '.ai-assistant-btn',
    position: 'top',
    offset: { x: 0, y: -10 }
  },
  {
    id: 'notifications',
    title: '通知中心',
    description: '接收系统通知、学生消息、作业提醒等重要信息。',
    target: '.notification-btn',
    position: 'left',
    offset: { x: -20, y: 0 }
  },
  {
    id: 'theme-switcher',
    title: '主题切换',
    description: '可以切换明暗主题，保护您的视力，也可以自定义主题颜色。',
    target: '.theme-switcher',
    position: 'left',
    offset: { x: -20, y: 0 }
  },
  {
    id: 'quick-actions',
    title: '快捷操作',
    description: '快速创建课程、布置作业、发起实验等常用操作。',
    target: '.quick-actions-grid',
    position: 'top',
    offset: { x: 0, y: -10 }
  }
]

// 作业管理引导步骤
export const assignmentGuideSteps: GuideStep[] = [
  {
    id: 'assignment-overview',
    title: '作业管理概览',
    description: '这里展示了所有作业的统计信息，包括待批改、已批改、逾期未交等。',
    target: '.assignments-stats',
    position: 'bottom',
    offset: { x: 0, y: 10 }
  },
  {
    id: 'assignment-filters',
    title: '筛选和搜索',
    description: '使用筛选器快速找到特定作业，支持按状态、课程、班级进行筛选。',
    target: '.assignments-filters',
    position: 'bottom',
    offset: { x: 0, y: 10 }
  },
  {
    id: 'assignment-list',
    title: '作业列表',
    description: '这里显示所有作业的详细信息，包括学生、提交时间、评分等。',
    target: '.assignments-list',
    position: 'top',
    offset: { x: 0, y: -10 }
  },
  {
    id: 'view-toggle',
    title: '视图切换',
    description: '可以在列表视图和网格视图之间切换，选择您喜欢的查看方式。',
    target: '.view-toggle',
    position: 'bottom',
    offset: { x: 0, y: 10 }
  },
  {
    id: 'create-assignment',
    title: '创建作业',
    description: '点击这里可以快速创建新的作业。',
    target: '.create-assignment-btn',
    position: 'left',
    offset: { x: -20, y: 0 }
  }
]

// 虚拟实验引导步骤
export const labGuideSteps: GuideStep[] = [
  {
    id: 'lab-categories',
    title: '实验分类',
    description: '按学科分类浏览虚拟实验，快速找到您需要的实验资源。',
    target: '.lab-categories',
    position: 'right',
    offset: { x: 20, y: 0 }
  },
  {
    id: 'lab-search',
    title: '实验搜索',
    description: '通过关键词搜索实验，支持按名称、描述、标签进行搜索。',
    target: '.lab-search',
    position: 'bottom',
    offset: { x: 0, y: 10 }
  },
  {
    id: 'lab-filters',
    title: '实验筛选',
    description: '按难度等级、学科类型、实验时长等条件筛选实验。',
    target: '.lab-filters',
    position: 'bottom',
    offset: { x: 0, y: 10 }
  },
  {
    id: 'lab-cards',
    title: '实验卡片',
    description: '每个实验卡片显示实验的基本信息，包括标题、描述、难度等级等。',
    target: '.lab-cards',
    position: 'top',
    offset: { x: 0, y: -10 }
  },
  {
    id: 'start-experiment',
    title: '开始实验',
    description: '点击开始按钮进入虚拟实验环境。',
    target: '.start-experiment-btn',
    position: 'top',
    offset: { x: 0, y: -10 }
  }
]

// 数据分析引导步骤
export const analyticsGuideSteps: GuideStep[] = [
  {
    id: 'charts-overview',
    title: '数据图表',
    description: '通过可视化图表了解学生的学习情况和教学效果。',
    target: '.charts-overview',
    position: 'bottom',
    offset: { x: 0, y: 10 }
  },
  {
    id: 'score-trend',
    title: '成绩趋势',
    description: '查看学生成绩的变化趋势，了解学习进步情况。',
    target: '.score-trend-chart',
    position: 'right',
    offset: { x: 20, y: 0 }
  },
  {
    id: 'score-distribution',
    title: '成绩分布',
    description: '了解学生成绩的分布情况，识别学习困难群体。',
    target: '.score-distribution-chart',
    position: 'left',
    offset: { x: -20, y: 0 }
  },
  {
    id: 'learning-progress',
    title: '学习进度',
    description: '跟踪学生的学习进度，及时发现学习问题。',
    target: '.learning-progress-chart',
    position: 'top',
    offset: { x: 0, y: -10 }
  }
]

// 设置引导步骤
export const settingsGuideSteps: GuideStep[] = [
  {
    id: 'profile-settings',
    title: '个人信息',
    description: '管理您的个人资料、头像、联系方式等信息。',
    target: '.profile-settings',
    position: 'right',
    offset: { x: 20, y: 0 }
  },
  {
    id: 'notification-settings',
    title: '通知设置',
    description: '配置通知偏好，选择您希望接收的通知类型。',
    target: '.notification-settings',
    position: 'left',
    offset: { x: -20, y: 0 }
  },
  {
    id: 'theme-settings',
    title: '主题设置',
    description: '自定义界面主题，包括颜色、字体大小等。',
    target: '.theme-settings',
    position: 'top',
    offset: { x: 0, y: -10 }
  },
  {
    id: 'language-settings',
    title: '语言设置',
    description: '选择界面语言（功能开发中）。',
    target: '.language-settings',
    position: 'bottom',
    offset: { x: 0, y: 10 }
  }
]

// 导出所有引导配置
export const guideConfigs = {
  basic: basicGuideSteps,
  assignment: assignmentGuideSteps,
  lab: labGuideSteps,
  analytics: analyticsGuideSteps,
  settings: settingsGuideSteps
}

// 获取当前页面的引导步骤
export const getCurrentPageGuideSteps = (route: string): GuideStep[] => {
  const pageGuideMap: Record<string, keyof typeof guideConfigs> = {
    '/dashboard': 'basic',
    '/assignments': 'assignment',
    '/virtual-lab': 'lab',
    '/analytics': 'analytics',
    '/settings': 'settings'
  }

  const guideType = pageGuideMap[route] || 'basic'
  return guideConfigs[guideType]
}

// 检查是否需要显示引导
export const shouldShowGuide = (route: string): boolean => {
  const steps = getCurrentPageGuideSteps(route)
  const storageKey = `guide-${route}-completed`

  return steps.length > 0 && localStorage.getItem(storageKey) !== 'true'
}

// 标记引导已完成
export const markGuideCompleted = (route: string): void => {
  const storageKey = `guide-${route}-completed`
  localStorage.setItem(storageKey, 'true')
}

// 重置引导状态
export const resetGuideStatus = (route?: string): void => {
  if (route) {
    const storageKey = `guide-${route}-completed`
    localStorage.removeItem(storageKey)
  } else {
    // 重置所有引导状态
    Object.keys(guideConfigs).forEach(config => {
      const storageKey = `guide-${config}-completed`
      localStorage.removeItem(storageKey)
    })
    localStorage.removeItem('user-guide-completed')
  }
}

// 交互组件示例
export const InteractiveComponents = {
  // 实验交互按钮
  LabInteractionButton: {
    template: `
      <div class="guide-interaction">
        <button
          class="guide-action-btn"
          @click="$emit('action', 'start-lab-demo')"
        >
          开始实验演示
        </button>
        <p class="guide-action-hint">体验虚拟实验的基本操作</p>
      </div>
    `,
    emits: ['action']
  },

  // 作业创建交互
  AssignmentInteraction: {
    template: `
      <div class="guide-interaction">
        <div class="guide-action-demo">
          <div class="demo-field">
            <label>作业标题</label>
            <input placeholder="输入作业标题..." />
          </div>
          <div class="demo-field">
            <label>截止日期</label>
            <input type="date" />
          </div>
        </div>
        <button
          class="guide-action-btn"
          @click="$emit('action', 'create-demo-assignment')"
        >
          创建示例作业
        </button>
      </div>
    `,
    emits: ['action']
  }
}

// 内容组件示例
export const ContentComponents = {
  // 功能特性展示
  FeatureShowcase: {
    template: `
      <div class="guide-content-showcase">
        <h4>主要功能特性</h4>
        <ul>
          <li>✨ 智能教学助手</li>
          <li>📊 数据可视化分析</li>
          <li>🔬 虚拟实验环境</li>
          <li>📝 作业管理系统</li>
        </ul>
      </div>
    `
  },

  // 快捷键提示
  KeyboardShortcuts: {
    template: `
      <div class="guide-keyboard-shortcuts">
        <h4>常用快捷键</h4>
        <div class="shortcut-list">
          <div class="shortcut-item">
            <kbd>Ctrl</kbd> + <kbd>K</kbd>
            <span>快速搜索</span>
          </div>
          <div class="shortcut-item">
            <kbd>Ctrl</kbd> + <kbd>/</kbd>
            <span>显示帮助</span>
          </div>
          <div class="shortcut-item">
            <kbd>Esc</kbd>
            <span>关闭弹窗</span>
          </div>
        </div>
      </div>
    `
  }
}