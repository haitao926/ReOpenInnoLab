<template>
  <div class="layout-test">
    <h1>测试EnhancedAuthLayout</h1>
    <EnhancedAuthLayout user-type="teacher">
      <template #form>
        <div style="padding: 20px; background: white; border-radius: 8px;">
          <h2>测试表单区域</h2>
          <p>这是表单插槽的内容</p>
          <el-button @click="testClick">测试按钮</el-button>
        </div>
      </template>
    </EnhancedAuthLayout>
  </div>
</template>

<script setup lang="ts">
import EnhancedAuthLayout from '@/components/auth/EnhancedAuthLayout.vue'

const testClick = () => {
  console.log('测试按钮点击')
}
</script>

<style scoped>
.layout-test {
  width: 100%;
  height: 100vh;
}
</style>