import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'
import { useUserStore } from './stores/user'

// UI Kit 主题导入 - 必须在最前面
import '@reopeninnolab/ui-kit/styles'
import { themeManager } from '@reopeninnolab/ui-kit/theme'

// 样式导入
import 'element-plus/dist/index.css'
import './assets/styles/main.scss'
// import './assets/styles/element-plus-theme.scss' // Deprecated: Moved to UI Kit

// AI服务导入
import { AIService } from './services/ai'
import { WebSocketService } from './services/websocket'

// 创建应用实例
const app = createApp(App)

// 注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 安装插件
app.use(createPinia())
app.use(router)
app.use(ElementPlus, {
  // Element Plus配置
  size: 'default',
  zIndex: 3000,
})

// 初始化AI服务 - 在开发环境使用mock模式
const isDevelopment = import.meta.env.DEV
const aiService = new AIService({
  providers: isDevelopment ? {
    mock: {
      apiKey: 'mock-key',
      baseUrl: '/ai/v1',
      model: 'mock-model',
    }
  } : {
    deepseek: {
      apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY,
      baseUrl: import.meta.env.VITE_DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
      model: import.meta.env.VITE_DEEPSEEK_MODEL || 'deepseek-chat',
    },
    openai: {
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      baseUrl: import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1',
      model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4',
    }
  },
  defaultProvider: isDevelopment ? 'mock' : 'deepseek'
})

// 初始化WebSocket服务
const wsUrl = import.meta.env.VITE_WS_URL
const wsService = wsUrl ? new WebSocketService({
  url: wsUrl,
  reconnectAttempts: 3,
  reconnectInterval: 2000
}) : null

// 全局属性注入
app.provide('aiService', aiService)
app.provide('wsService', wsService)
app.provide('themeManager', themeManager)

// 应用UI Kit主题到DOM
themeManager.applyFullTheme()

// 全局错误处理
app.config.errorHandler = (error, instance, info) => {
  console.error('全局错误:', error)
  console.error('组件实例:', instance)
  console.error('错误信息:', info)

  // 发送错误到监控系统
  if (import.meta.env.PROD) {
    // 这里可以集成Sentry等错误监控服务
  }
}

// 全局警告处理
app.config.warnHandler = (msg, instance, trace) => {
  console.warn('全局警告:', msg)
  console.warn('组件实例:', instance)
  console.warn('组件追踪:', trace)
}

// 初始化认证状态并挂载应用
const initializeApp = async () => {
  const userStore = useUserStore()
  try {
    await userStore.initializeAuth()
  } catch (error) {
    console.warn('应用启动时认证初始化失败:', error)
  }

  app.mount('#app')
}

initializeApp()

// 开发环境下的热重载支持
if (import.meta.hot) {
  import.meta.hot.accept()
}

// PWA支持
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration)
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError)
      })
  })
}