<template>
  <div class="tenant-configuration">
    <div class="section-header">
      <h4>配置信息</h4>
      <el-button type="primary" size="small" @click="handleSave">
        保存配置
      </el-button>
    </div>
    <el-form :model="config" label-width="120px">
      <el-form-item label="租户名称">
        <el-input v-model="config.name" />
      </el-form-item>
      <el-form-item label="域名">
        <el-input v-model="config.domain" />
      </el-form-item>
      <el-form-item label="Logo URL">
        <el-input v-model="config.logoUrl" />
      </el-form-item>
      <el-form-item label="主题色">
        <el-color-picker v-model="config.themeColor" />
      </el-form-item>
      <el-form-item label="功能开关">
        <el-checkbox-group v-model="config.features">
          <el-checkbox label="courses">课程管理</el-checkbox>
          <el-checkbox label="resources">资源管理</el-checkbox>
          <el-checkbox label="ai">AI功能</el-checkbox>
          <el-checkbox label="classrooms">课堂功能</el-checkbox>
        </el-checkbox-group>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Configuration {
  name: string
  domain: string
  logoUrl: string
  themeColor: string
  features: string[]
}

defineProps<{
  tenantId: string
}>()

const config = ref<Configuration>({
  name: '',
  domain: '',
  logoUrl: '',
  themeColor: '#409eff',
  features: []
})

const loadConfiguration = () => {
  // Mock data
  config.value = {
    name: '示例租户',
    domain: 'example.com',
    logoUrl: 'https://via.placeholder.com/100x50',
    themeColor: '#409eff',
    features: ['courses', 'resources']
  }
}

const handleSave = () => {
  // Handle save configuration
}

onMounted(() => {
  loadConfiguration()
})
</script>

<style scoped lang="scss">
.tenant-configuration {
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
}
</style>