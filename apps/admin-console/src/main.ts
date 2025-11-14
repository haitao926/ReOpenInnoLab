import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { createI18n } from 'vue-i18n'

import App from './App.vue'
import router from './router'
import { setupAuthGuard } from './composables/useAuth'
import { setupMonitoring } from './services/monitoring'

// Styles
import 'element-plus/dist/index.css'
import './assets/styles/main.scss'

// I18n setup
import zhCN from './i18n/zh-CN.json'
import enUS from './i18n/en-US.json'

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: 'en-US',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS
  }
})

const app = createApp(App)

// Register Element Plus icons
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus, {
  i18n: i18n.global
})
app.use(i18n)

// Setup monitoring and auth guard
setupMonitoring()
setupAuthGuard(router)

app.mount('#app')