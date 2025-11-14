<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

// 应用初始化
onMounted(() => {
  // 设置应用的初始配置
  document.documentElement.setAttribute('data-theme', 'light')

  // 监听网络状态 (全局级别，不影响组件级别的事件处理)
  window.addEventListener('online', () => {
    console.log('网络已连接')
  })

  window.addEventListener('offline', () => {
    console.log('网络已断开')
  })
})
</script>

<style>
/* 全局样式重置由 futureschool.scss 处理 */
</style>