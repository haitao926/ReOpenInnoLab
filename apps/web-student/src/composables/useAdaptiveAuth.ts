import { ref, computed } from 'vue'

export function useAdaptiveAuth() {
  const userContext = ref<any>(null)
  const recommendedAuthMethod = ref('password')
  const isHighRisk = ref(false)

  const recordLoginAttempt = (attempt: any) => {
    // 简化的登录尝试记录
    console.log('Recording login attempt:', attempt)
  }

  return {
    userContext,
    recommendedAuthMethod,
    isHighRisk,
    recordLoginAttempt
  }
}