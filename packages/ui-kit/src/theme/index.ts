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

// 默认主题实例
export const defaultTheme: Theme = {
  colors: designTokens.tokens.color,
  typography: designTokens.tokens.typography,
  spacing: designTokens.tokens.spacing,
  borderRadius: designTokens.tokens.borderRadius,
  shadows: designTokens.tokens.shadow,
  zIndex: designTokens.tokens.zIndex,
  motion: designTokens.tokens.motion,
  breakpoints: designTokens.tokens.breakpoint
}

// 主题工具函数
export class ThemeManager {
  private currentTheme: Theme = defaultTheme

  // 获取当前主题
  getTheme(): Theme {
    return this.currentTheme
  }

  // 设置主题
  setTheme(theme: Partial<Theme>): void {
    this.currentTheme = { ...this.currentTheme, ...theme }
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
  getSubjectColor(subject: string, variant: 'light' | 'default' | 'dark' = 'default'): string {
    const subjectData = this.currentTheme.colors.subject[subject]
    return subjectData ? subjectData[variant] : ''
  }

  // 生成CSS变量
  generateCSSVariables(): Record<string, string> {
    const variables: Record<string, string> = {}

    // 颜色变量
    Object.entries(this.currentTheme.colors.primary).forEach(([key, value]) => {
      variables[`--color-primary-${key}`] = value
    })

    Object.entries(this.currentTheme.colors.semantic).forEach(([key, value]) => {
      variables[`--color-${key}-light`] = value.light
      variables[`--color-${key}-default`] = value.default
      variables[`--color-${key}-dark`] = value.dark
    })

    // 学科颜色变量
    Object.entries(this.currentTheme.colors.subject).forEach(([key, value]) => {
      variables[`--color-subject-${key}`] = value.color
      variables[`--color-subject-${key}-light`] = value.light
      variables[`--color-subject-${key}-dark`] = value.dark
    })

    // 间距变量
    Object.entries(this.currentTheme.spacing).forEach(([key, value]) => {
      variables[`--spacing-${key}`] = value
    })

    // 圆角变量
    Object.entries(this.currentTheme.borderRadius).forEach(([key, value]) => {
      variables[`--border-radius-${key}`] = value
    })

    // 阴影变量
    Object.entries(this.currentTheme.shadows).forEach(([key, value]) => {
      variables[`--shadow-${key}`] = value
    })

    // 字体变量
    variables['--font-sans'] = this.currentTheme.typography.fontFamily.sans.join(', ')
    variables['--font-serif'] = this.currentTheme.typography.fontFamily.serif.join(', ')
    variables['--font-mono'] = this.currentTheme.typography.fontFamily.mono.join(', ')

    // 动效变量
    Object.entries(this.currentTheme.motion.easing).forEach(([key, value]) => {
      variables[`--easing-${key}`] = value
    })

    Object.entries(this.currentTheme.motion.duration).forEach(([key, value]) => {
      variables[`--duration-${key}`] = value
    })

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
}

// 导出主题管理器实例
export const themeManager = new ThemeManager()

// 导出常用工具函数
export const themeUtils = {
  // 获取学科颜色
  getSubjectColor: (subject: string, variant: 'light' | 'default' | 'dark' = 'default') => {
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