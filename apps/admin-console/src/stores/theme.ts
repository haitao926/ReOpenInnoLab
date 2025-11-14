import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false)

  const toggleTheme = () => {
    isDark.value = !isDark.value
    updateTheme()
  }

  const setTheme = (dark: boolean) => {
    isDark.value = dark
    updateTheme()
  }

  const updateTheme = () => {
    if (isDark.value) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('admin-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('admin-theme', 'light')
    }
  }

  const initTheme = () => {
    const savedTheme = localStorage.getItem('admin-theme')
    if (savedTheme === 'dark') {
      isDark.value = true
    } else if (savedTheme === 'light') {
      isDark.value = false
    } else {
      // Use system preference as default
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    updateTheme()
  }

  return {
    isDark,
    toggleTheme,
    setTheme,
    initTheme
  }
})