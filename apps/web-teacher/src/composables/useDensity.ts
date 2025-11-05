import { ref, computed, watch } from 'vue'

export type Density = 'comfortable' | 'compact'

export interface DensityConfig {
  spacing: {
    xs: string
    sm: string
    base: string
    lg: string
    xl: string
  }
  borderRadius: {
    sm: string
    base: string
    lg: string
    xl: string
  }
  fontSize: {
    xs: string
    sm: string
    base: string
    lg: string
    xl: string
  }
  lineHeight: {
    tight: string
    normal: string
    relaxed: string
  }
  padding: {
    xs: string
    sm: string
    base: string
    lg: string
    xl: string
  }
  card: {
    padding: string
    gap: string
  }
  table: {
    cellHeight: string
    cellPadding: string
  }
  gap: {
    xs: string
    sm: string
    base: string
    lg: string
    xl: string
  }
}

// 舒适模式配置
const comfortableConfig: DensityConfig = {
  spacing: {
    xs: '4px',
    sm: '8px',
    base: '16px',
    lg: '24px',
    xl: '32px'
  },
  borderRadius: {
    sm: '4px',
    base: '8px',
    lg: '12px',
    xl: '16px'
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px'
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.625'
  },
  padding: {
    xs: '8px',
    sm: '12px',
    base: '16px',
    lg: '24px',
    xl: '32px'
  },
  card: {
    padding: '24px',
    gap: '24px'
  },
  table: {
    cellHeight: '56px',
    cellPadding: '16px'
  },
  gap: {
    xs: '4px',
    sm: '8px',
    base: '16px',
    lg: '24px',
    xl: '32px'
  }
}

// 紧凑模式配置
const compactConfig: DensityConfig = {
  spacing: {
    xs: '2px',
    sm: '4px',
    base: '8px',
    lg: '12px',
    xl: '16px'
  },
  borderRadius: {
    sm: '2px',
    base: '4px',
    lg: '6px',
    xl: '8px'
  },
  fontSize: {
    xs: '11px',
    sm: '12px',
    base: '14px',
    lg: '16px',
    xl: '18px'
  },
  lineHeight: {
    tight: '1.2',
    normal: '1.4',
    relaxed: '1.5'
  },
  padding: {
    xs: '4px',
    sm: '6px',
    base: '8px',
    lg: '12px',
    xl: '16px'
  },
  card: {
    padding: '16px',
    gap: '16px'
  },
  table: {
    cellHeight: '40px',
    cellPadding: '8px'
  },
  gap: {
    xs: '2px',
    sm: '4px',
    base: '8px',
    lg: '12px',
    xl: '16px'
  }
}

// 密度配置映射
const densityConfigs = {
  comfortable: comfortableConfig,
  compact: compactConfig
}

export function useDensity(initialDensity: Density = 'comfortable') {
  // 当前密度
  const density = ref<Density>(initialDensity)

  // 从本地存储加载设置
  const loadFromStorage = () => {
    try {
      const saved = localStorage.getItem('edu-density-preference')
      if (saved && (saved === 'comfortable' || saved === 'compact')) {
        density.value = saved
      }
    } catch (error) {
      console.warn('Failed to load density preference:', error)
    }
  }

  // 保存到本地存储
  const saveToStorage = (newDensity: Density) => {
    try {
      localStorage.setItem('edu-density-preference', newDensity)
    } catch (error) {
      console.warn('Failed to save density preference:', error)
    }
  }

  // 切换密度
  const setDensity = (newDensity: Density) => {
    density.value = newDensity
    saveToStorage(newDensity)
    applyDensityToDOM(newDensity)
  }

  // 切换密度（快捷方法）
  const toggleDensity = () => {
    const newDensity = density.value === 'comfortable' ? 'compact' : 'comfortable'
    setDensity(newDensity)
  }

  // 应用密度到 DOM
  const applyDensityToDOM = (densityValue: Density) => {
    const config = densityConfigs[densityValue]
    const root = document.documentElement

    // 设置 CSS 自定义属性
    root.style.setProperty('--density-spacing-xs', config.spacing.xs)
    root.style.setProperty('--density-spacing-sm', config.spacing.sm)
    root.style.setProperty('--density-spacing-base', config.spacing.base)
    root.style.setProperty('--density-spacing-lg', config.spacing.lg)
    root.style.setProperty('--density-spacing-xl', config.spacing.xl)

    root.style.setProperty('--density-radius-sm', config.borderRadius.sm)
    root.style.setProperty('--density-radius-base', config.borderRadius.base)
    root.style.setProperty('--density-radius-lg', config.borderRadius.lg)
    root.style.setProperty('--density-radius-xl', config.borderRadius.xl)

    root.style.setProperty('--density-font-size-xs', config.fontSize.xs)
    root.style.setProperty('--density-font-size-sm', config.fontSize.sm)
    root.style.setProperty('--density-font-size-base', config.fontSize.base)
    root.style.setProperty('--density-font-size-lg', config.fontSize.lg)
    root.style.setProperty('--density-font-size-xl', config.fontSize.xl)

    root.style.setProperty('--density-line-height-tight', config.lineHeight.tight)
    root.style.setProperty('--density-line-height-normal', config.lineHeight.normal)
    root.style.setProperty('--density-line-height-relaxed', config.lineHeight.relaxed)

    root.style.setProperty('--density-padding-xs', config.padding.xs)
    root.style.setProperty('--density-padding-sm', config.padding.sm)
    root.style.setProperty('--density-padding-base', config.padding.base)
    root.style.setProperty('--density-padding-lg', config.padding.lg)
    root.style.setProperty('--density-padding-xl', config.padding.xl)

    root.style.setProperty('--density-card-padding', config.card.padding)
    root.style.setProperty('--density-card-gap', config.card.gap)

    root.style.setProperty('--density-table-cell-height', config.table.cellHeight)
    root.style.setProperty('--density-table-cell-padding', config.table.cellPadding)

    // 设置 data 属性用于 CSS 选择器
    root.setAttribute('data-density', densityValue)
  }

  // 计算属性：当前配置
  const currentConfig = computed(() => densityConfigs[density.value])

  // 计算属性：是否为紧凑模式
  const isCompact = computed(() => density.value === 'compact')

  // 计算属性：是否为舒适模式
  const isComfortable = computed(() => density.value === 'comfortable')

  // 计算属性：密度显示名称
  const densityLabel = computed(() => {
    return density.value === 'comfortable' ? '舒适模式' : '紧凑模式'
  })

  // 监听密度变化，自动应用到 DOM
  watch(density, (newDensity) => {
    applyDensityToDOM(newDensity)
  }, { immediate: true })

  // 初始化时加载存储设置
  loadFromStorage()

  // 初始应用到 DOM
  applyDensityToDOM(density.value)

  return {
    // 状态
    density,
    currentConfig,
    isCompact,
    isComfortable,
    densityLabel,

    // 方法
    setDensity,
    toggleDensity,
    applyDensityToDOM,

    // 配置常量
    comfortableConfig,
    compactConfig
  }
}