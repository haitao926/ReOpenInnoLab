import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'

// UI Kit 主题导入 - 必须在最前面
import '@reopeninnolab/ui-kit/styles'
import { themeManager } from '@reopeninnolab/ui-kit/theme'

// 样式导入
import 'element-plus/dist/index.css'
import './assets/styles/main.scss'

// UI Kit 导入
import EduKit from '@reopeninnolab/ui-kit'

// 数据持久化服务
import { useOfflineData } from './services/persistence/offline-data.service'

const app = createApp(App)
const pinia = createPinia()

// 应用UI Kit主题到DOM
themeManager.applyFullTheme()

// 注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 使用插件
app.use(pinia)
app.use(router)
app.use(ElementPlus)
app.use(EduKit)

// 全局错误处理
app.config.errorHandler = (error, vm, info) => {
  console.error('Vue Error:', error)
  console.error('Error Info:', info)
  // 这里可以添加错误报告服务
}

// 全局警告处理
app.config.warnHandler = (msg, vm, trace) => {
  console.warn('Vue Warning:', msg)
  console.warn('Warning Trace:', trace)
}

// 初始化数据持久化服务
const offlineData = useOfflineData()

// 初始化数据清理（可选）
if (import.meta.env.DEV) {
  // 开发环境下定期清理过期数据
  setInterval(() => {
    offlineData.cleanup().catch(console.error)
  }, 5 * 60 * 1000) // 每5分钟清理一次
}

// 挂载应用
app.mount('#app')

// 应用启动信息
if (import.meta.env.DEV) {
  console.log('🚀 ReOpenInnoLab Student App Started')
  console.log('📦 Environment:', import.meta.env.MODE)
  console.log('🔗 API Base URL:', import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000')
  console.log('💾 Data Persistence: Enabled with offline support')
}