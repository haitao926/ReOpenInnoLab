import { ref, readonly, nextTick } from 'vue'

export type SceneType = 'reading' | 'coding' | 'quiz' | 'feedback'

export function useSceneTransition() {
  const currentScene = ref<SceneType>('reading')
  const isTransitioning = ref(false)

  // 模拟场景预加载
  const preloadSceneResources = async (scene: SceneType) => {
    // 实际项目中这里可以加载特定的资源、组件或数据
    return new Promise(resolve => setTimeout(resolve, 50))
  }

  const transitionTo = async (newScene: SceneType) => {
    if (currentScene.value === newScene) return

    isTransitioning.value = true

    try {
      // 1. 预加载新场景
      await preloadSceneResources(newScene)

      // 2. 执行切换 (可以配合 CSS 动画)
      currentScene.value = newScene

      // 3. 动画结束后的清理工作
      await nextTick()
    } finally {
      // 稍微延迟以展示过渡动画
      setTimeout(() => {
        isTransitioning.value = false
      }, 300)
    }
  }

  return {
    currentScene: readonly(currentScene),
    isTransitioning: readonly(isTransitioning),
    transitionTo
  }
}
