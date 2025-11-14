<template>
  <div class="biometric-auth">
    <div class="biometric-message">
      <el-icon size="32"><Fingerprint /></el-icon>
      <h3>生物识别登录</h3>
      <p>请使用您的指纹或面部识别进行登录</p>
    </div>
    <div class="biometric-button">
      <el-button
        type="primary"
        size="large"
        :loading="loading"
        @click="startBiometricAuth"
      >
        <el-icon><Fingerprint /></el-icon>
        开始生物识别
      </el-button>
    </div>
    <div class="biometric-fallback">
      <el-button link @click="$emit('fallbackRequested', 'password')">
        使用密码登录
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Fingerprint } from '@element-plus/icons-vue'

interface Props {
  autoAuthenticate?: boolean
  showSettings?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoAuthenticate: false,
  showSettings: false
})

const emit = defineEmits<{
  success: [result: any]
  error: [error: any]
  fallbackRequested: [method: string]
}>()

const loading = ref(false)

const startBiometricAuth = async () => {
  loading.value = true

  try {
    // 模拟生物识别过程
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 模拟成功
    emit('success', { method: 'biometric', timestamp: new Date() })
  } catch (error) {
    emit('error', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.biometric-auth {
  text-align: center;
  padding: 2rem 0;
}

.biometric-message {
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

.biometric-button {
  margin-bottom: 1.5rem;
}

.biometric-fallback {
  .el-button {
    color: #64748b;

    &:hover {
      color: #667eea;
    }
  }
}
</style>