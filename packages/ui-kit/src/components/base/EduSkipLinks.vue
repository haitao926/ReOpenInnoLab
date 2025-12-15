<template>
  <div ref="skipLinksContainer" class="skip-links">
    <a
      v-for="link in skipLinks"
      :key="link.href"
      :href="link.href"
      class="skip-link"
      @click="handleSkipLinkClick(link.href)"
    >
      {{ link.text }}
    </a>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useSkipLinks } from '@/composables/useKeyboardNavigation'

interface SkipLink {
  href: string
  text: string
}

const { skipLinks, addSkipLink, removeSkipLink } = useSkipLinks()
const skipLinksContainer = ref<HTMLElement>()

// 添加默认的跳过链接
onMounted(() => {
  addSkipLink('#main-content', '跳转到主要内容')

  // 监听侧边栏状态变化
  updateSkipLinksPosition()
  observeLayoutChanges()

  // 监听窗口大小变化
  window.addEventListener('resize', updateSkipLinksPosition)
  onUnmounted(() => {
    window.removeEventListener('resize', updateSkipLinksPosition)
  })
})

const updateSkipLinksPosition = () => {
  if (!skipLinksContainer.value) return

  const isMobile = window.innerWidth <= 960
  if (isMobile) {
    // 在移动端，侧边栏是隐藏的，所以跳转链接从左侧边缘开始
    skipLinksContainer.value.style.left = '0px'
    return
  }

  const mainLayout = document.querySelector('.main-layout')
  if (mainLayout) {
    const isCollapsed = mainLayout.classList.contains('is-collapsed')
    const sidebarWidth = isCollapsed
      ? getComputedStyle(document.documentElement).getPropertyValue('--edu-sidebar-collapsed-width') || '80px'
      : getComputedStyle(document.documentElement).getPropertyValue('--edu-sidebar-width') || '260px'

    skipLinksContainer.value.style.left = sidebarWidth
  }
}

const observeLayoutChanges = () => {
  // 监听类名变化
  const mainLayout = document.querySelector('.main-layout')
  if (mainLayout) {
    const observer = new MutationObserver(() => {
      updateSkipLinksPosition()
    })

    observer.observe(mainLayout, {
      attributes: true,
      attributeFilter: ['class']
    })

    // 清理观察器
    onUnmounted(() => {
      observer.disconnect()
    })
  }
}

const handleSkipLinkClick = (href: string) => {
  const target = document.querySelector(href) as HTMLElement
  if (target) {
    // 移除焦点样式延迟，以便用户看到跳转效果
    setTimeout(() => {
      target.focus()
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }, 100)
  }
}
</script>

<style scoped lang="scss">
.skip-links {
  position: fixed;
  top: -40px;
  left: 260px; /* Initial position, will be updated dynamically */
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: left var(--edu-duration-normal) var(--edu-easing-smooth);
}

.skip-link {
  display: block;
  padding: 8px 16px;
  background: var(--edu-primary-600);
  color: white;
  text-decoration: none;
  font-weight: 500;
  border-radius: 0 0 4px 0;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:focus {
    top: 20px; /* Position in the header area but not covering logo */
    outline: 2px solid var(--edu-primary-500);
    outline-offset: 2px;
  }

  &:hover {
    background: var(--edu-primary-700);
    text-decoration: underline;
  }
}

// 确保在高对比度模式下也可见
@media (prefers-contrast: high) {
  .skip-link {
    border: 2px solid currentColor;
  }
}

// 移动端适配 - 在移动端，侧边栏是隐藏的，所以跳转链接应该从左侧边缘开始
@media (max-width: 960px) {
  .skip-link:focus {
    top: 10px; /* Adjust for mobile header */
  }
}

// 减少动画
@media (prefers-reduced-motion: reduce) {
  .skip-link {
    transition: none;
  }
}
</style>