import designTokens from './tokens.json'

// 导出设计令牌
export { designTokens }

// 主题类型定义
export interface Theme {
  colors: ColorPalette
  typography: TypographySystem
  spacing: SpacingSystem
  borderRadius: BorderRadiusSystem
  shadows: ShadowSystem
  zIndex: ZIndexSystem
  motion: MotionSystem
  breakpoints: BreakpointSystem
}

export interface ColorPalette {
  primary: ColorScale
  secondary: ColorScale
  subject: SubjectColors
  neutral: NeutralColors
  semantic: SemanticColors
}

export interface ColorScale {
  50: string
  100: string
  200: string
  300: string
  400: string
  500: string
  600: string
  700: string
  800: string
  900: string
  950?: string
}

export interface SubjectColors {
  [key: string]: {
    name: string
    color: string
    light: string
    dark: string
  }
}

export interface NeutralColors {
  white: string
  gray: Record<string, string>
  black: string
}

export interface SemanticColors {
  success: { light: string; default: string; dark: string }
  warning: { light: string; default: string; dark: string }
  error: { light: string; default: string; dark: string }
  info: { light: string; default: string; dark: string }
  cta: { light: string; default: string; dark: string }
}

export interface TypographySystem {
  fontFamily: {
    sans: string[]
    serif: string[]
    mono: string[]
  }
  fontSize: Record<string, string>
  fontWeight: Record<string, number>
  lineHeight: Record<string, number>
  letterSpacing: Record<string, string>
}

export interface SpacingSystem {
  [key: string]: string
}

export interface BorderRadiusSystem {
  [key: string]: string
}

export interface ShadowSystem {
  [key: string]: string
}

export interface ZIndexSystem {
  [key: string]: number | string
}

export interface MotionSystem {
  easing: Record<string, string>
  duration: Record<string, string>
  delay: Record<string, string>
}

export interface BreakpointSystem {
  [key: string]: string
}

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const deepMerge = <T>(base: T, overrides?: Partial<T>): T => {
  if (overrides === undefined) {
    if (Array.isArray(base)) {
      return [...base] as T
    }

    if (isPlainObject(base)) {
      return { ...base } as T
    }

    return base
  }

  if (Array.isArray(overrides)) {
    return [...overrides] as unknown as T
  }

  if (isPlainObject(overrides)) {
    const baseObject = isPlainObject(base) ? base : {}
    const result: Record<string, unknown> = { ...baseObject }

    Object.entries(overrides).forEach(([key, value]) => {
      if (value === undefined) {
        return
      }

      const baseValue = (baseObject as Record<string, unknown>)[key]

      result[key] = deepMerge(baseValue, value as any)
    })

    return result as T
  }

  return (overrides as T) ?? base
}

const mergeTheme = (base: Theme, overrides: Partial<Theme>): Theme => {
  return deepMerge(base, overrides)
}

const safeEntries = <T>(obj: Record<string, T> | undefined | null): [string, T][] => {
  return Object.entries(obj ?? {}) as [string, T][]
}

const ensureArray = <T>(value: unknown, fallback: T[]): T[] => {
  return Array.isArray(value) ? value : fallback
}

// 辅助函数：提取 tokens 值
const extractColorValues = (colorObj: any): ColorPalette => {
  const result: any = {}

  Object.entries(colorObj).forEach(([key, value]: [string, any]) => {
    if (key === 'neutral') {
      // 特殊处理中性色，提取 gray 对象
      const neutralData = value.value || value
      const grayObj: Record<string, string> = {}
      const neutralResult: any = {
        white: neutralData.white || '#FFFFFF',
        black: neutralData.black || '#000000',
        gray: grayObj
      }

      // 提取灰色色阶
      Object.entries(neutralData).forEach(([grayKey, grayValue]: [string, any]) => {
        if (grayKey.startsWith('gray-')) {
          const shade = grayKey.replace('gray-', '')
          grayObj[shade] = typeof grayValue === 'string' ? grayValue : grayValue.value || grayValue
        } else if (grayKey !== 'white' && grayKey !== 'black') {
          // 其他中性色直接复制
          neutralResult[grayKey] = typeof grayValue === 'string' ? grayValue : grayValue.value || grayValue
        }
      })

      result[key] = neutralResult
    } else if (value && typeof value === 'object' && 'value' in value) {
      result[key] = value.value
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      // 处理其他嵌套对象（如 primary, secondary）
      const nestedResult: any = {}
      Object.entries(value).forEach(([nestedKey, nestedValue]: [string, any]) => {
        if (typeof nestedValue === 'string') {
          nestedResult[nestedKey] = nestedValue
        } else if (nestedValue && typeof nestedValue === 'object' && 'value' in nestedValue) {
          nestedResult[nestedKey] = nestedValue.value
        } else {
          nestedResult[nestedKey] = nestedValue
        }
      })
      result[key] = nestedResult
    } else {
      result[key] = value
    }
  })

  return result as ColorPalette
}

const extractTypographyValues = (typoObj: any): TypographySystem => {
  if (!typoObj || typeof typoObj !== 'object') {
    return {} as TypographySystem
  }
  const result: any = {}

  Object.entries(typoObj).forEach(([key, value]: [string, any]) => {
    if (value && typeof value === 'object' && 'value' in value) {
      result[key] = value.value
    } else {
      result[key] = value
    }
  })

  return result as TypographySystem
}

const extractSimpleValues = (obj: any): Record<string, any> => {
  const result: any = {}
  if (!obj) return result

  // Handle wrapped token objects (like shadow)
  const data = obj.value || obj

  Object.entries(data).forEach(([key, value]: [string, any]) => {
    if (value && typeof value === 'object' && 'value' in value) {
      result[key] = value.value
    } else {
      result[key] = value
    }
  })

  return result
}

const extractMotionValues = (motionObj: any): MotionSystem => {
  if (!motionObj || typeof motionObj !== 'object') {
    return {} as MotionSystem
  }
  const result: any = {}

  // motion 对象有一个 value 属性包含实际的动效数据
  const motionData = motionObj.value || motionObj

  Object.entries(motionData).forEach(([key, value]: [string, any]) => {
    if (typeof value === 'string') {
      result[key] = value
    } else if (value && typeof value === 'object' && 'value' in value) {
      result[key] = value.value
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      // 处理嵌套对象（如 easing, duration, delay）
      const nestedResult: any = {}
      Object.entries(value).forEach(([nestedKey, nestedValue]: [string, any]) => {
        if (typeof nestedValue === 'string') {
          nestedResult[nestedKey] = nestedValue
        } else if (nestedValue && typeof nestedValue === 'object' && 'value' in nestedValue) {
          nestedResult[nestedKey] = nestedValue.value
        } else {
          nestedResult[nestedKey] = nestedValue
        }
      })
      result[key] = nestedResult
    } else {
      result[key] = value
    }
  })

  return result as MotionSystem
}

// 默认主题实例
export const defaultTheme: Theme = {
  colors: extractColorValues(designTokens.tokens.color),
  typography: extractTypographyValues(designTokens.tokens.typography),
  spacing: extractSimpleValues(designTokens.tokens.spacing),
  borderRadius: extractSimpleValues(designTokens.tokens.borderRadius),
  shadows: extractSimpleValues(designTokens.tokens.shadow),
  zIndex: extractSimpleValues(designTokens.tokens.zIndex),
  motion: extractMotionValues(designTokens.tokens.motion),
  breakpoints: extractSimpleValues(designTokens.tokens.breakpoint)
}

// 高对比模式主题
export const highContrastTheme: Theme = {
  ...defaultTheme,
  colors: {
    ...defaultTheme.colors,
    primary: {
      ...defaultTheme.colors.primary,
      '500': '#0066CC',
      '600': '#0052A3',
      '400': '#1A75FF'
    },
    semantic: {
      ...defaultTheme.colors.semantic,
      success: {
        default: '#006600',
        light: '#E6FFE6',
        dark: '#004400'
      },
      warning: {
        default: '#CC6600',
        light: '#FFF9E6',
        dark: '#994D00'
      },
      error: {
        default: '#CC0000',
        light: '#FFE6E6',
        dark: '#990000'
      },
      info: {
        default: '#0066CC',
        light: '#E6F3FF',
        dark: '#004C99'
      }
    },
    neutral: {
      ...defaultTheme.colors.neutral,
      gray: {
        ...defaultTheme.colors.neutral.gray,
        '50': '#FFFFFF',
        '100': '#F0F0F0',
        '200': '#D0D0D0',
        '300': '#B0B0B0',
        '400': '#808080',
        '500': '#606060',
        '600': '#404040',
        '700': '#202020',
        '800': '#101010',
        '900': '#000000'
      }
    }
  }
}

// 主题工具函数
export class ThemeManager {
  private currentTheme: Theme = defaultTheme
  private currentMode: 'default' | 'high-contrast' = 'default'

  // 获取当前主题
  getTheme(): Theme {
    return this.currentTheme
  }

  // 设置主题
  setTheme(theme: Partial<Theme>): void {
    this.currentTheme = mergeTheme(this.currentTheme, theme)
  }

  // 切换到高对比模式
  setHighContrastMode(enabled: boolean): void {
    if (enabled) {
      this.currentMode = 'high-contrast'
      this.currentTheme = highContrastTheme
    } else {
      this.currentMode = 'default'
      this.currentTheme = defaultTheme
    }
  }

  // 获取当前模式
  getMode(): 'default' | 'high-contrast' {
    return this.currentMode
  }

  // 获取颜色
  getColor(path: string): string {
    const keys = path.split('.')
    let value: any = this.currentTheme.colors

    for (const key of keys) {
      value = value[key]
    }

    return value || ''
  }

  // 获取字体
  getFont(path: string): string | number | string[] {
    const keys = path.split('.')
    let value: any = this.currentTheme.typography

    for (const key of keys) {
      value = value[key]
    }

    return value || ''
  }

  // 获取间距
  getSpacing(key: string): string {
    return this.currentTheme.spacing[key] || '0'
  }

  // 获取圆角
  getBorderRadius(key: string): string {
    return this.currentTheme.borderRadius[key] || '0'
  }

  // 获取阴影
  getShadow(key: string): string {
    return this.currentTheme.shadows[key] || 'none'
  }

  // 获取层级
  getZIndex(key: string): number | string {
    return this.currentTheme.zIndex[key] || 'auto'
  }

  // 获取动效
  getMotion(type: 'easing' | 'duration' | 'delay', key: string): string {
    return this.currentTheme.motion[type]?.[key] || ''
  }

  // 获取断点
  getBreakpoint(key: string): string {
    return this.currentTheme.breakpoints[key] || ''
  }

  // 获取学科颜色
  getSubjectColor(subject: string, variant: 'light' | 'color' | 'dark' = 'color'): string {
    const subjectData = this.currentTheme.colors.subject[subject]
    return subjectData ? subjectData[variant] : ''
  }

  // 生成CSS变量
  generateCSSVariables(): Record<string, string> {
    const variables: Record<string, string> = {}
    const theme = this.currentTheme

    // 颜色变量
    safeEntries(theme.colors?.primary ?? defaultTheme.colors.primary).forEach(([key, value]) => {
      variables[`--edu-color-primary-${key}`] = value
    })

    safeEntries(theme.colors?.secondary ?? defaultTheme.colors.secondary).forEach(([key, value]) => {
      variables[`--edu-color-secondary-${key}`] = value
    })

    safeEntries(theme.colors?.semantic ?? defaultTheme.colors.semantic).forEach(([key, value]) => {
      const fallback = (defaultTheme.colors.semantic as Record<string, any>)[key] || {}
      const semanticValue = value || fallback
      variables[`--edu-color-${key}-light`] = semanticValue.light ?? fallback.light ?? ''
      variables[`--edu-color-${key}-default`] = semanticValue.default ?? fallback.default ?? ''
      variables[`--edu-color-${key}-dark`] = semanticValue.dark ?? fallback.dark ?? ''
    })

    // 学科颜色变量
    safeEntries(theme.colors?.subject ?? defaultTheme.colors.subject).forEach(([key, value]) => {
      const fallback = (defaultTheme.colors.subject as Record<string, any>)[key] || {}
      const subjectValue = value || fallback
      variables[`--edu-color-subject-${key}`] = subjectValue?.color ?? fallback.color ?? ''
      variables[`--edu-color-subject-${key}-light`] = subjectValue?.light ?? fallback.light ?? ''
      variables[`--edu-color-subject-${key}-dark`] = subjectValue?.dark ?? fallback.dark ?? ''
    })

    // 中性色变量
    const neutral = theme.colors?.neutral ?? defaultTheme.colors.neutral
    variables['--edu-color-white'] = neutral.white ?? defaultTheme.colors.neutral.white
    variables['--edu-color-black'] = neutral.black ?? defaultTheme.colors.neutral.black
    safeEntries(neutral.gray ?? defaultTheme.colors.neutral.gray).forEach(([key, value]) => {
      variables[`--edu-color-gray-${key}`] = value
    })

    // 间距变量
    safeEntries(theme.spacing ?? defaultTheme.spacing).forEach(([key, value]) => {
      variables[`--edu-spacing-${key}`] = value
    })

    // 圆角变量
    safeEntries(theme.borderRadius ?? defaultTheme.borderRadius).forEach(([key, value]) => {
      variables[`--edu-border-radius-${key}`] = value
    })

    // 阴影变量
    safeEntries(theme.shadows ?? defaultTheme.shadows).forEach(([key, value]) => {
      variables[`--edu-shadow-${key}`] = value
    })

    // 字体变量
    const fontFamily = theme.typography?.fontFamily ?? defaultTheme.typography.fontFamily
    const sansFonts = ensureArray(fontFamily?.sans, defaultTheme.typography.fontFamily?.sans || ['sans-serif'])
    const serifFonts = ensureArray(fontFamily?.serif, defaultTheme.typography.fontFamily?.serif || ['serif'])
    const monoFonts = ensureArray(fontFamily?.mono, defaultTheme.typography.fontFamily?.mono || ['monospace'])
    variables['--edu-font-sans'] = sansFonts.join(', ')
    variables['--edu-font-serif'] = serifFonts.join(', ')
    variables['--edu-font-mono'] = monoFonts.join(', ')

    // 字体大小
    safeEntries(theme.typography?.fontSize ?? defaultTheme.typography.fontSize).forEach(([key, value]) => {
      variables[`--edu-font-size-${key}`] = value
    })

    // 字体粗细
    safeEntries(theme.typography?.fontWeight ?? defaultTheme.typography.fontWeight).forEach(([key, value]) => {
      variables[`--edu-font-weight-${key}`] = value.toString()
    })

    // 行高
    safeEntries(theme.typography?.lineHeight ?? defaultTheme.typography.lineHeight).forEach(([key, value]) => {
      variables[`--edu-line-height-${key}`] = value.toString()
    })

    // 动效变量
    safeEntries(theme.motion?.easing ?? defaultTheme.motion.easing).forEach(([key, value]) => {
      variables[`--edu-easing-${key}`] = value
    })

    safeEntries(theme.motion?.duration ?? defaultTheme.motion.duration).forEach(([key, value]) => {
      variables[`--edu-duration-${key}`] = value
    })

    // 断点变量
    safeEntries(theme.breakpoints ?? defaultTheme.breakpoints).forEach(([key, value]) => {
      variables[`--edu-breakpoint-${key}`] = value
    })

    // 层级变量
    safeEntries(theme.zIndex ?? defaultTheme.zIndex).forEach(([key, value]) => {
      variables[`--edu-z-index-${key}`] = value.toString()
    })

    // 边框颜色变量（Element Plus 兼容）
    variables['--edu-border-color'] = variables['--edu-color-gray-200'] || '#e5e7eb'
    variables['--edu-border-color-light'] = variables['--edu-color-gray-100'] || '#f5f5f5'

    return variables
  }

  // 应用CSS变量到DOM
  applyCSSVariables(): void {
    const root = document.documentElement
    const variables = this.generateCSSVariables()

    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
  }

  // 应用Element Plus主题映射
  applyElementPlusTheme(): void {
    const root = document.documentElement
    const theme = this.currentTheme

    // Element Plus主色调映射
    root.style.setProperty('--el-color-primary', theme.colors.primary['500'])
    root.style.setProperty('--el-color-primary-light-3', theme.colors.primary['300'])
    root.style.setProperty('--el-color-primary-light-5', theme.colors.primary['400'])
    root.style.setProperty('--el-color-primary-light-7', theme.colors.primary['200'])
    root.style.setProperty('--el-color-primary-light-8', theme.colors.primary['100'])
    root.style.setProperty('--el-color-primary-light-9', theme.colors.primary['50'])
    root.style.setProperty('--el-color-primary-dark-2', theme.colors.primary['600'])

    // Element Plus语义色映射
    root.style.setProperty('--el-color-success', theme.colors.semantic.success.default)
    root.style.setProperty('--el-color-success-light-3', theme.colors.semantic.success.light)
    root.style.setProperty('--el-color-success-light-5', theme.colors.semantic.success.light)
    root.style.setProperty('--el-color-success-light-7', theme.colors.semantic.success.light)
    root.style.setProperty('--el-color-success-light-8', theme.colors.semantic.success.light)
    root.style.setProperty('--el-color-success-light-9', theme.colors.semantic.success.light)
    root.style.setProperty('--el-color-success-dark-2', theme.colors.semantic.success.dark)

    root.style.setProperty('--el-color-warning', theme.colors.semantic.warning.default)
    root.style.setProperty('--el-color-warning-light-3', theme.colors.semantic.warning.light)
    root.style.setProperty('--el-color-warning-light-5', theme.colors.semantic.warning.light)
    root.style.setProperty('--el-color-warning-light-7', theme.colors.semantic.warning.light)
    root.style.setProperty('--el-color-warning-light-8', theme.colors.semantic.warning.light)
    root.style.setProperty('--el-color-warning-light-9', theme.colors.semantic.warning.light)
    root.style.setProperty('--el-color-warning-dark-2', theme.colors.semantic.warning.dark)

    root.style.setProperty('--el-color-error', theme.colors.semantic.error.default)
    root.style.setProperty('--el-color-error-light-3', theme.colors.semantic.error.light)
    root.style.setProperty('--el-color-error-light-5', theme.colors.semantic.error.light)
    root.style.setProperty('--el-color-error-light-7', theme.colors.semantic.error.light)
    root.style.setProperty('--el-color-error-light-8', theme.colors.semantic.error.light)
    root.style.setProperty('--el-color-error-light-9', theme.colors.semantic.error.light)
    root.style.setProperty('--el-color-error-dark-2', theme.colors.semantic.error.dark)

    root.style.setProperty('--el-color-info', theme.colors.semantic.info.default)
    root.style.setProperty('--el-color-info-light-3', theme.colors.semantic.info.light)
    root.style.setProperty('--el-color-info-light-5', theme.colors.semantic.info.light)
    root.style.setProperty('--el-color-info-light-7', theme.colors.semantic.info.light)
    root.style.setProperty('--el-color-info-light-8', theme.colors.semantic.info.light)
    root.style.setProperty('--el-color-info-light-9', theme.colors.semantic.info.light)
    root.style.setProperty('--el-color-info-dark-2', theme.colors.semantic.info.dark)

    // Element Plus中性色映射
    root.style.setProperty('--el-color-white', theme.colors.neutral.white)
    root.style.setProperty('--el-color-black', theme.colors.neutral.black)

    // 中性灰色系映射到Element Plus变量
    const grayColors = {
      'el-gray-1': theme.colors.neutral.gray['50'] || '#f7f8fa',
      'el-gray-2': theme.colors.neutral.gray['100'] || '#f2f3f5',
      'el-gray-3': theme.colors.neutral.gray['200'] || '#e5e7eb',
      'el-gray-4': theme.colors.neutral.gray['300'] || '#d9d9d9',
      'el-gray-5': theme.colors.neutral.gray['400'] || '#c8c9cc',
      'el-gray-6': theme.colors.neutral.gray['500'] || '#909399',
      'el-gray-7': theme.colors.neutral.gray['600'] || '#606266',
      'el-gray-8': theme.colors.neutral.gray['700'] || '#3a3a3c',
      'el-gray-9': theme.colors.neutral.gray['800'] || '#262729'
    }

    Object.entries(grayColors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value)
    })

    // Element Plus边框圆角映射
    root.style.setProperty('--el-border-radius-base', theme.borderRadius.base || '4px')
    root.style.setProperty('--el-border-radius-small', theme.borderRadius.sm || '2px')
    root.style.setProperty('--el-border-radius-round', theme.borderRadius.full || '9999px')

    // Element Plus字体映射
    root.style.setProperty('--el-font-family', theme.typography.fontFamily?.sans?.join(', ') || 'system-ui, sans-serif')
    root.style.setProperty('--el-font-size-base', theme.typography.fontSize?.sm || '14px')
    root.style.setProperty('--el-font-size-small', theme.typography.fontSize?.xs || '12px')
    root.style.setProperty('--el-font-size-large', theme.typography.fontSize?.base || '16px')
    root.style.setProperty('--el-font-size-extra-large', theme.typography.fontSize?.lg || '18px')
    root.style.setProperty('--el-font-weight-primary', theme.typography.fontWeight?.medium?.toString() || '500')

    // Element Plus阴影映射
    root.style.setProperty('--el-box-shadow', theme.shadows.base || '0 1px 3px 0 rgba(0, 0, 0, 0.1)')
    root.style.setProperty('--el-box-shadow-light', theme.shadows.sm || '0 1px 2px 0 rgba(0, 0, 0, 0.05)')
    root.style.setProperty('--el-box-shadow-dark', theme.shadows.lg || '0 10px 15px -3px rgba(0, 0, 0, 0.1)')

    // Element Plus动效映射
    root.style.setProperty('--el-transition-duration', theme.motion.duration.normal || '0.3s')
    root.style.setProperty('--el-transition-duration-fast', theme.motion.duration.fast || '0.15s')

    // Element Plus组件尺寸映射
    root.style.setProperty('--el-component-size-large', '40px')
    root.style.setProperty('--el-component-size', '32px')
    root.style.setProperty('--el-component-size-small', '24px')
  }

  // 同时应用UI Kit和Element Plus主题
  applyFullTheme(): void {
    this.applyCSSVariables()
    this.applyElementPlusTheme()
  }
}

// 导出主题管理器实例
export const themeManager = new ThemeManager()

// 导出常用工具函数
export const themeUtils = {
  // 获取学科颜色
  getSubjectColor: (subject: string, variant: 'light' | 'color' | 'dark' = 'color') => {
    return themeManager.getSubjectColor(subject, variant)
  },

  // 获取语义化颜色
  getSemanticColor: (type: 'success' | 'warning' | 'error' | 'info', variant: 'light' | 'default' | 'dark' = 'default') => {
    return themeManager.getColor(`semantic.${type}.${variant}`)
  },

  // 响应式断点工具
  mediaQuery: {
    up: (breakpoint: string) => `@media (min-width: ${themeManager.getBreakpoint(breakpoint)})`,
    down: (breakpoint: string) => `@media (max-width: ${themeManager.getBreakpoint(breakpoint)})`,
    between: (start: string, end: string) =>
      `@media (min-width: ${themeManager.getBreakpoint(start)}) and (max-width: ${themeManager.getBreakpoint(end)})`,
  },

  // 动效工具
  transition: (properties: string[], duration: string = 'normal', easing: string = 'smooth') => {
    return {
      transition: `${properties.join(', ')} ${themeManager.getMotion('duration', duration)} ${themeManager.getMotion('easing', easing)}`
    }
  }
}

// 导出默认CSS类
export const themeClasses = {
  // 间距类
  spacing: Object.fromEntries(
    Object.entries(themeManager.getTheme().spacing).map(([key, value]) => [
      `spacing-${key}`,
      { margin: value }
    ])
  ),

  // 文本类
  text: {
    'text-sans': { fontFamily: themeManager.getFont('sans') as string },
    'text-serif': { fontFamily: themeManager.getFont('serif') as string },
    'text-mono': { fontFamily: themeManager.getFont('mono') as string },
  }
}
