<template>
  <div class="passkey-auth">
    <div class="passkey-message">
      <el-icon size="32"><Key /></el-icon>
      <h3>Passkey 登录</h3>
      <p>使用您的设备进行快速、安全的登录</p>
    </div>
    <div class="passkey-button">
      <el-button
        type="primary"
        size="large"
        :loading="loading"
        @click="startPasskeyAuth"
      >
        <el-icon><Key /></el-icon>
        使用 Passkey 登录
      </el-button>
    </div>
    <div class="passkey-fallback">
      <el-button link @click="$emit('fallbackRequested', 'password')">
        使用其他方式登录
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Key } from '@element-plus/icons-vue'

interface Props {
  autoAuthenticate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoAuthenticate: false
})

const emit = defineEmits<{
  success: [result: any]
  error: [error: any]
  fallbackRequested: [method: string]
}>()

const loading = ref(false)

const startPasskeyAuth = async () => {
  loading.value = true

  try {
    // 模拟 Passkey 认证过程
    await new Promise(resolve => setTimeout(resolve, 1500))

    // 模拟成功
    emit('success', { method: 'passkey', timestamp: new Date() })
  } catch (error) {
    emit('error', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.passkey-auth {
  text-align: center;
  padding: 2rem 0;
}

.passkey-message {
  margin-bottom: 2rem;

  .el-icon {
    color: #667eea;
    margin-bottom: 1rem;
  }

  h3 {
    margin: 0 0 0.5rem 0;
    color: #1e293b;
  }

  p {
    margin: 0;
    color: #64748b;
  }
}

.passkey-button {
  margin-bottom: 1.5rem;
}

.passkey-fallback {
  .el-button {
    color: #64748b;

    &:hover {
      color: #667eea;
    }
  }
}
</style>