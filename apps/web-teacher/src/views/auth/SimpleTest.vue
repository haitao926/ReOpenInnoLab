<template>
  <div style="padding: 20px; background: red; color: white; height: 100vh;">
    <h1>简单测试页面</h1>
    <p>如果你能看到这个页面，说明路由和基础渲染正常</p>
    <button @click="testClick">点击测试</button>
    <p v-if="clicked">按钮被点击了！</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const clicked = ref(false)

const testClick = () => {
  clicked.value = true
  console.log('测试按钮被点击')
}
</script>