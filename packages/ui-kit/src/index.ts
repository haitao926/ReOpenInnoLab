// 开源浦育 ReOpenInnoLab - UI Kit 主入口文件
export { defaultTheme, themeManager, themeUtils, ThemeManager } from './theme/index.js'
export type { Theme, ThemeManager as IThemeManager } from './theme/index.js'

// 导出样式文件
import './index.scss'

// 导出主题工具函数
export const useTheme = () => {
  return {
    theme: themeManager.getTheme(),
    setTheme: themeManager.setTheme.bind(themeManager),
    getColor: themeManager.getColor.bind(themeManager),
    getSubjectColor: themeManager.getSubjectColor.bind(themeManager),
    applyCSSVariables: themeManager.applyCSSVariables.bind(themeManager),
    ...themeUtils
  }
}

// 导出主题 Hook (Vue Composable)
export const useThemeComposable = () => {
  const theme = themeManager.getTheme()

  const setTheme = (newTheme: Partial<Theme>) => {
    themeManager.setTheme(newTheme)
    themeManager.applyCSSVariables()
  }

  const toggleDarkMode = () => {
    const currentTheme = themeManager.getTheme()
    const newMode = currentTheme.colors.primary === 'dark' ? 'light' : 'dark'
    setTheme({ colors: { ...currentTheme.colors, primary: newMode } })
  }

  return {
    theme,
    setTheme,
    toggleDarkMode,
    ...themeUtils
  }
}

// 版本信息
export const version = '1.0.0'