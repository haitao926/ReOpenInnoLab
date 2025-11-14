<template>
  <router-view />
</template>

<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
import { useI18n } from 'vue-i18n'

const themeStore = useThemeStore()
const { locale } = useI18n()

// Initialize theme
themeStore.initTheme()

// Set locale from localStorage or browser
const savedLocale = localStorage.getItem('admin-locale') || 'zh-CN'
locale.value = savedLocale
</script>

<style>
#app {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100vh;
}
</style>