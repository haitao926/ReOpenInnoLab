<template>
  <div class="test-login">
    <h1>测试登录页面</h1>
    <EnhancedAuthLayout user-type="teacher">
      <template #form>
        <div class="test-form">
          <p>这是测试表单内容</p>
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
.test-login {
  width: 100%;
  height: 100vh;
}

.test-form {
  padding: 20px;
  text-align: center;
}
</style>