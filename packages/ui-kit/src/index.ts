// 开源浦育 ReOpenInnoLab - UI Kit 主入口文件
import { App } from 'vue'
import { defaultTheme, themeManager, themeUtils, ThemeManager } from './theme/index'
import type { Theme } from './theme/index'
import { accessibility, createAccessibleButton, createAccessibleLink } from './utils/accessibility'
import { registerKeyboardNavigationDirectives } from './directives/keyboardNavigation'

// 导入组件
import EduButton from './components/base/EduButton.vue'
import EduCard from './components/base/EduCard.vue'
import EduModal from './components/base/EduModal.vue'
import EduTag from './components/base/EduTag.vue'
import EduInput from './components/base/EduInput.vue'
import EduAccordion from './components/base/EduAccordion.vue'
import EduTabs from './components/base/EduTabs.vue'
import EduCourseCard from './components/base/EduCourseCard.vue'
import EduSummaryCard from './components/base/EduSummaryCard.vue'

// 导出样式文件
import './index.scss'
import './styles/responsive.scss'

// 导出主题管理器
export { defaultTheme, themeManager, themeUtils, ThemeManager }
export type { Theme }

// 导出无障碍工具
export { accessibility, createAccessibleButton, createAccessibleLink }
export type { KeyboardNavigationOptions, FocusableElement } from './utils/accessibility'

// 导出指令
export { registerKeyboardNavigationDirectives }
export { vKeyboardNavigation, vAutoFocus, vFocusTrap, vAriaLabel, vAriaDescribedBy, vSkipLink } from './directives/keyboardNavigation'

// 导出组件
export { EduButton, EduCard, EduModal, EduTag, EduInput, EduAccordion, EduTabs, EduCourseCard, EduSummaryCard }

// 导出主题工具函数
export const useTheme = () => {
  return {
    theme: themeManager.getTheme(),
    setTheme: themeManager.setTheme.bind(themeManager),
    getColor: themeManager.getColor.bind(themeManager),
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
    // 简单的明暗切换逻辑，这里可以扩展
    console.log('Toggle dark mode - implementation needed')
  }

  return {
    theme,
    setTheme,
    toggleDarkMode,
    ...themeUtils
  }
}

// 安装函数
export const install = (app: App) => {
  // 注册组件
  app.component('EduButton', EduButton)
  app.component('EduCard', EduCard)
  app.component('EduModal', EduModal)
  app.component('EduTag', EduTag)
  app.component('EduInput', EduInput)
  app.component('EduAccordion', EduAccordion)
  app.component('EduTabs', EduTabs)
  app.component('EduCourseCard', EduCourseCard)
  app.component('EduSummaryCard', EduSummaryCard)

  // 注册无障碍指令
  registerKeyboardNavigationDirectives(app)

  // 初始化跳过链接
  accessibility.createSkipLinks()
}

// 默认导出
export default {
  install,
  version: '1.0.0'
}

// 版本信息
export const version = '1.0.0'
