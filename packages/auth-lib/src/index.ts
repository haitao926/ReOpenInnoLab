import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 核心组件
import AuthLayout from './components/AuthLayout.vue'
import AuthCard from './components/AuthCard.vue'
import LoginForm from './components/LoginForm.vue'
import BiometricAuth from './components/BiometricAuth.vue'
import SecurityIndicator from './components/SecurityIndicator.vue'
import PersonalizedWelcome from './components/PersonalizedWelcome.vue'

// Composables
import { useAdaptiveAuth } from './composables/useAdaptiveAuth'
import { useSecurityMonitor } from './composables/useSecurityMonitor'
import { useBiometricAuth } from './composables/useBiometricAuth'

// 样式
import './styles/index.scss'

// 类型定义
export * from './types'

const components = {
  AuthLayout,
  AuthCard,
  LoginForm,
  BiometricAuth,
  SecurityIndicator,
  PersonalizedWelcome
}

// 插件安装
export const AuthLib = {
  install(app: any) {
    // 注册组件
    Object.entries(components).forEach(([name, component]) => {
      app.component(name, component)
    })

    // 注册Element Plus图标
    for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
      app.component(key, component)
    }
  }
}

// 导出所有内容
export {
  components,
  useAdaptiveAuth,
  useSecurityMonitor,
  useBiometricAuth
}

export default AuthLib