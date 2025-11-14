<template>
  <div class="theme-switcher">
    <el-tooltip :content="getTooltipText()" placement="bottom">
      <el-button
        type="link"
        class="theme-toggle-btn"
        @click="toggleTheme"
      >
        <el-icon size="18">
          <Sunny v-if="currentTheme === 'dark'" />
          <Moon v-else />
        </el-icon>
      </el-button>
    </el-tooltip>

    <!-- 主题选择面板 -->
    <el-popover
      v-model:visible="popoverVisible"
      placement="bottom-end"
      :width="320"
      trigger="click"
      class="theme-popover"
    >
      <template #reference>
        <el-button type="link" class="theme-settings-btn" @click="openThemeSettings">
          <el-icon size="16">
            <Setting />
          </el-icon>
        </el-button>
      </template>

      <div class="theme-panel">
        <div class="theme-panel__header">
          <h3>主题设置</h3>
        </div>

        <div class="theme-panel__content">
          <!-- 预设主题 -->
          <div class="theme-section">
            <h4>预设主题</h4>
            <div class="theme-presets">
              <div
                v-for="preset in themePresets"
                :key="preset.id"
                class="theme-preset"
                :class="{ 'is-active': currentTheme === preset.id }"
                @click="applyTheme(preset.id)"
              >
                <div class="preset-preview" :style="getPreviewStyle(preset)"></div>
                <div class="preset-info">
                  <div class="preset-name">{{ preset.name }}</div>
                  <div class="preset-desc">{{ preset.description }}</div>
                </div>
                <div v-if="currentTheme === preset.id" class="preset-check">
                  <el-icon><Check /></el-icon>
                </div>
              </div>
            </div>
          </div>

          <!-- 自动切换 -->
          <div class="theme-section">
            <h4>自动切换</h4>
            <div class="auto-switch-options">
              <el-switch
                v-model="autoSwitch"
                active-text="跟随系统"
                @change="handleAutoSwitchChange"
              />
              <p class="switch-desc">根据系统设置自动切换明暗主题</p>
            </div>
          </div>

          <!-- 主题自定义 -->
          <div class="theme-section">
            <h4>自定义设置</h4>
            <div class="custom-settings">
              <div class="setting-item">
                <label>主题色</label>
                <div class="color-picker-wrapper">
                  <el-color-picker
                    v-model="customSettings.primaryColor"
                    size="small"
                    @change="updateCustomTheme"
                  />
                  <span class="color-value">{{ customSettings.primaryColor }}</span>
                </div>
              </div>

              <div class="setting-item">
                <label>强调色</label>
                <div class="color-picker-wrapper">
                  <el-color-picker
                    v-model="customSettings.accentColor"
                    size="small"
                    @change="updateCustomTheme"
                  />
                  <span class="color-value">{{ customSettings.accentColor }}</span>
                </div>
              </div>

              <div class="setting-item">
                <label>字体大小</label>
                <el-slider
                  v-model="customSettings.fontSize"
                  :min="12"
                  :max="20"
                  :step="1"
                  show-input
                  @change="updateCustomTheme"
                />
              </div>

              <div class="setting-item">
                <label>边框圆角</label>
                <el-slider
                  v-model="customSettings.borderRadius"
                  :min="0"
                  :max="16"
                  :step="1"
                  show-input
                  @change="updateCustomTheme"
                />
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="theme-actions">
            <el-button size="small" @click="resetToDefault">恢复默认</el-button>
            <el-button size="small" type="primary" @click="saveSettings">保存设置</el-button>
          </div>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Sunny, Moon, Setting, Check } from '@element-plus/icons-vue'

interface ThemePreset {
  id: string
  name: string
  description: string
  colors: {
    primary: string
    background: string
    surface: string
    text: string
  }
}

interface CustomSettings {
  primaryColor: string
  accentColor: string
  fontSize: number
  borderRadius: number
}

const emit = defineEmits<{
  themeChanged: [theme: string]
}>()

// 响应式数据
const currentTheme = ref<'light' | 'dark' | 'auto'>('light')
const popoverVisible = ref(false)
const autoSwitch = ref(false)

const customSettings = ref<CustomSettings>({
  primaryColor: '#5B8FF9',
  accentColor: '#52C41A',
  fontSize: 16,
  borderRadius: 8
})

// 预设主题
const themePresets = ref<ThemePreset[]>([
  {
    id: 'light',
    name: '浅色主题',
    description: '清新明亮的默认主题',
    colors: {
      primary: '#5B8FF9',
      background: '#FFFFFF',
      surface: '#F5F5F5',
      text: '#262626'
    }
  },
  {
    id: 'dark',
    name: '深色主题',
    description: '护眼的深色主题',
    colors: {
      primary: '#85BEFF',
      background: '#141414',
      surface: '#1F1F1F',
      text: '#FFFFFF'
    }
  },
  {
    id: 'blue',
    name: '海洋蓝',
    description: '专业的蓝色主题',
    colors: {
      primary: '#1890FF',
      background: '#F0F8FF',
      surface: '#E6F7FF',
      text: '#003A8C'
    }
  },
  {
    id: 'green',
    name: '自然绿',
    description: '护眼的绿色主题',
    colors: {
      primary: '#52C41A',
      background: '#F6FFED',
      surface: '#F0FFF4',
      text: '#135200'
    }
  },
  {
    id: 'purple',
    name: '优雅紫',
    description: '高贵的紫色主题',
    colors: {
      primary: '#722ED1',
      background: '#F9F0FF',
      surface: '#F3E8FF',
      text: '#391085'
    }
  }
])

// 计算属性
const effectiveTheme = computed(() => {
  if (autoSwitch.value) {
    return 'auto'
  }
  return currentTheme.value
})

// 方法
const getTooltipText = () => {
  if (currentTheme.value === 'dark') {
    return '切换到浅色主题'
  }
  return '切换到深色主题'
}

const toggleTheme = () => {
  const newTheme = currentTheme.value === 'dark' ? 'light' : 'dark'
  applyTheme(newTheme)
}

const applyTheme = (theme: string, showMessage: boolean = true) => {
  currentTheme.value = theme as 'light' | 'dark'

  // 应用主题到DOM
  const html = document.documentElement
  const body = document.body

  if (theme === 'dark') {
    html.setAttribute('data-theme', 'dark')
    body.classList.add('dark-theme')
  } else {
    html.removeAttribute('data-theme')
    body.classList.remove('dark-theme')
  }

  // 应用自定义设置
  applyCustomSettings()

  // 保存到本地存储
  localStorage.setItem('theme', theme)
  localStorage.setItem('theme-settings', JSON.stringify(customSettings.value))

  // 通知父组件
  emit('themeChanged', theme)

  // 显示提示（仅在手动切换时）
  if (showMessage) {
    const themeName = themePresets.value.find(p => p.id === theme)?.name || theme
    ElMessage.success(`已切换到${themeName}`)
  }
}

const applyCustomSettings = () => {
  const root = document.documentElement

  // 应用自定义颜色
  root.style.setProperty('--edu-primary-custom', customSettings.value.primaryColor)
  root.style.setProperty('--edu-accent-custom', customSettings.value.accentColor)

  // 应用字体大小
  root.style.setProperty('--edu-font-size-custom', `${customSettings.value.fontSize}px`)

  // 应用圆角
  root.style.setProperty('--edu-radius-custom', `${customSettings.value.borderRadius}px`)

  // 如果是自定义主题，使用自定义颜色作为主色
  if (currentTheme.value === 'custom') {
    root.style.setProperty('--edu-primary-500', customSettings.value.primaryColor)
    root.style.setProperty('--edu-secondary-500', customSettings.value.accentColor)
  }
}

const getPreviewStyle = (preset: ThemePreset) => {
  return {
    background: preset.colors.background,
    borderTop: `3px solid ${preset.colors.primary}`,
    borderBottom: `3px solid ${preset.colors.surface}`,
    color: preset.colors.text
  }
}

const openThemeSettings = () => {
  popoverVisible.value = !popoverVisible.value
}

const handleAutoSwitchChange = (value: boolean) => {
  if (value) {
    // 检测系统主题
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const systemTheme = prefersDark ? 'dark' : 'light'
    applyTheme(systemTheme)

    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', handleSystemThemeChange)
  } else {
    // 移除系统主题监听
    window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', handleSystemThemeChange)
  }

  localStorage.setItem('auto-switch', value.toString())
}

const handleSystemThemeChange = (e: MediaQueryListEvent) => {
  if (autoSwitch.value) {
    const systemTheme = e.matches ? 'dark' : 'light'
    applyTheme(systemTheme)
  }
}

const updateCustomTheme = () => {
  if (currentTheme.value === 'custom') {
    applyCustomSettings()
  }
}

const resetToDefault = () => {
  customSettings.value = {
    primaryColor: '#5B8FF9',
    accentColor: '#52C41A',
    fontSize: 16,
    borderRadius: 8
  }

  currentTheme.value = 'light'
  autoSwitch.value = false

  applyTheme('light')
  localStorage.removeItem('theme-settings')
  ElMessage.success('已恢复默认设置')
}

const saveSettings = () => {
  localStorage.setItem('theme-settings', JSON.stringify(customSettings.value))
  localStorage.setItem('auto-switch', autoSwitch.toString())
  popoverVisible.value = false
  ElMessage.success('设置已保存')
}

const loadSettings = () => {
  // 加载主题
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto' | null
  if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
    currentTheme.value = savedTheme
  }

  // 加载自动切换设置
  const savedAutoSwitch = localStorage.getItem('auto-switch')
  if (savedAutoSwitch) {
    autoSwitch.value = savedAutoSwitch === 'true'
    if (autoSwitch.value) {
      // 在初始化时直接应用系统主题，不显示消息
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const systemTheme = prefersDark ? 'dark' : 'light'
      applyTheme(systemTheme, false)

      // 监听系统主题变化
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', handleSystemThemeChange)
    }
  }

  // 加载自定义设置
  const savedSettings = localStorage.getItem('theme-settings')
  if (savedSettings) {
    try {
      customSettings.value = { ...customSettings.value, ...JSON.parse(savedSettings) }
    } catch (error) {
      console.error('加载主题设置失败:', error)
    }
  }

  // 应用初始主题（仅在没有自动切换时应用，不显示消息）
  if (!autoSwitch.value) {
    applyTheme(currentTheme.value, false)
  }
}

// 生命周期
onMounted(() => {
  loadSettings()
})

// 监听自定义设置变化
watch(customSettings, () => {
  if (currentTheme.value === 'custom') {
    updateCustomTheme()
  }
}, { deep: true })
</script>

<style lang="scss" scoped>
.theme-switcher {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.theme-toggle-btn {
  padding: var(--spacing-xs);
  border-radius: var(--radius-full);
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    background-color: var(--edu-color-gray-100);
  }

  .dark-theme &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
}

.theme-settings-btn {
  padding: var(--spacing-xs);
  border-radius: var(--radius-full);
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    background-color: var(--edu-color-gray-100);
  }

  .dark-theme &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
}

.theme-panel {
  padding: 0;
}

.theme-panel__header {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--edu-border-light);

  h3 {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--edu-text-primary);
  }
}

.theme-panel__content {
  padding: var(--spacing-lg);
}

.theme-section {
  margin-bottom: var(--spacing-xl);

  &:last-child {
    margin-bottom: 0;
  }

  h4 {
    margin: 0 0 var(--spacing-base) 0;
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--edu-text-primary);
  }
}

.theme-presets {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.theme-preset {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
  padding: var(--spacing-base);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    border-color: var(--edu-primary-300);
    background-color: var(--edu-primary-50);
  }

  &.is-active {
    border-color: var(--edu-primary-500);
    background-color: var(--edu-primary-100);
  }
}

.preset-preview {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.preset-info {
  flex: 1;
  min-width: 0;
}

.preset-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--edu-text-primary);
  margin-bottom: 2px;
}

.preset-desc {
  font-size: var(--font-size-xs);
  color: var(--edu-text-secondary);
  line-height: 1.4;
}

.preset-check {
  color: var(--edu-primary-500);
  flex-shrink: 0;
}

.auto-switch-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.switch-desc {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--edu-text-secondary);
  line-height: 1.4;
}

.custom-settings {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);

  label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--edu-text-primary);
  }
}

.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.color-value {
  font-size: var(--font-size-xs);
  color: var(--edu-text-secondary);
  font-family: monospace;
  background: var(--edu-bg-tertiary);
  padding: 2px var(--spacing-xs);
  border-radius: var(--radius-sm);
}

.theme-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--edu-border-light);
  margin-top: var(--spacing-lg);
}

/* 深色模式适配 */
[data-theme="dark"] {
  .theme-panel {
    background: var(--edu-bg-primary);
    color: var(--edu-text-primary);
  }

  .theme-preset {
    border-color: var(--edu-border-dark);
    background: var(--edu-bg-secondary);

    &:hover {
      border-color: var(--edu-primary-600);
      background: rgba(91, 143, 249, 0.1);
    }

    &.is-active {
      border-color: var(--edu-primary-500);
      background: rgba(91, 143, 249, 0.15);
    }
  }

  .preset-desc {
    color: var(--edu-text-secondary);
  }

  .color-value {
    background: rgba(255, 255, 255, 0.1);
    color: var(--edu-text-secondary);
  }
}

/* 响应式设计 */
@media (max-width: 480px) {
  .theme-preset {
    padding: var(--spacing-sm);
  }

  .preset-preview {
    width: 32px;
    height: 32px;
  }

  .preset-name {
    font-size: var(--font-size-xs);
  }

  .preset-desc {
    display: none;
  }
}
</style>