import { ref, onMounted, onUnmounted } from 'vue'

export interface NavigationItem {
  id: string
  element: HTMLElement
  label?: string
  disabled?: boolean
  onSelect?: () => void
}

export interface KeyboardNavigationOptions {
  items: NavigationItem[]
  loop?: boolean
  orientation?: 'horizontal' | 'vertical'
  activateOnEnter?: boolean
  activateOnSpace?: boolean
  escapeHandler?: () => void
}

export function useKeyboardNavigation(options: KeyboardNavigationOptions) {
  const {
    items,
    loop = true,
    orientation = 'vertical',
    activateOnEnter = true,
    activateOnSpace = true,
    escapeHandler
  } = options

  const currentIndex = ref(0)
  const isActive = ref(false)

  // 键盘事件处理
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isActive.value || items.length === 0) return

    let handled = false

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        if (orientation === 'vertical' && event.key === 'ArrowDown') {
          navigateNext()
          handled = true
        } else if (orientation === 'horizontal' && event.key === 'ArrowRight') {
          navigateNext()
          handled = true
        }
        break

      case 'ArrowUp':
      case 'ArrowLeft':
        if (orientation === 'vertical' && event.key === 'ArrowUp') {
          navigatePrevious()
          handled = true
        } else if (orientation === 'horizontal' && event.key === 'ArrowLeft') {
          navigatePrevious()
          handled = true
        }
        break

      case 'Home':
        navigateFirst()
        handled = true
        break

      case 'End':
        navigateLast()
        handled = true
        break

      case 'Enter':
        if (activateOnEnter) {
          activateCurrent()
          handled = true
        }
        break

      case ' ':
        if (activateOnSpace) {
          event.preventDefault()
          activateCurrent()
          handled = true
        }
        break

      case 'Escape':
        if (escapeHandler) {
          escapeHandler()
          handled = true
        }
        break
    }

    if (handled) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  // 导航方法
  const navigateNext = () => {
    if (items.length === 0) return

    let nextIndex = currentIndex.value + 1

    if (nextIndex >= items.length) {
      if (loop) {
        nextIndex = 0
      } else {
        nextIndex = items.length - 1
      }
    }

    setCurrentIndex(nextIndex)
  }

  const navigatePrevious = () => {
    if (items.length === 0) return

    let prevIndex = currentIndex.value - 1

    if (prevIndex < 0) {
      if (loop) {
        prevIndex = items.length - 1
      } else {
        prevIndex = 0
      }
    }

    setCurrentIndex(prevIndex)
  }

  const navigateFirst = () => {
    if (items.length > 0) {
      setCurrentIndex(0)
    }
  }

  const navigateLast = () => {
    if (items.length > 0) {
      setCurrentIndex(items.length - 1)
    }
  }

  const setCurrentIndex = (index: number) => {
    // 跳过禁用的项目
    if (items[index]?.disabled) {
      let newIndex = index
      let attempts = 0
      const maxAttempts = items.length

      while (items[newIndex]?.disabled && attempts < maxAttempts) {
        if (newIndex < items.length - 1) {
          newIndex++
        } else {
          newIndex = 0
        }
        attempts++
      }

      if (!items[newIndex]?.disabled) {
        currentIndex.value = newIndex
      }
    } else {
      currentIndex.value = index
    }

    // 确保当前项目在视图中可见
    ensureItemVisible()
  }

  const activateCurrent = () => {
    const currentItem = items[currentIndex.value]
    if (currentItem && !currentItem.disabled && currentItem.onSelect) {
      currentItem.onSelect()
    }
  }

  const ensureItemVisible = () => {
    const currentItem = items[currentIndex.value]
    if (currentItem?.element) {
      currentItem.element.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      })
    }
  }

  const activate = () => {
    isActive.value = true
    if (items[currentIndex.value]?.element) {
      items[currentIndex.value].element.focus()
    }
  }

  const deactivate = () => {
    isActive.value = false
  }

  const focusItem = (index: number) => {
    setCurrentIndex(index)
    if (items[index]?.element) {
      items[index].element.focus()
    }
  }

  // 添加 ARIA 属性
  const setupAriaAttributes = () => {
    items.forEach((item, index) => {
      if (item.element) {
        item.element.setAttribute('role', 'option')
        item.element.setAttribute('aria-selected', index === currentIndex.value ? 'true' : 'false')
        item.element.setAttribute('aria-disabled', item.disabled ? 'true' : 'false')
        if (item.label) {
          item.element.setAttribute('aria-label', item.label)
        }
      }
    })
  }

  const updateItems = (newItems: NavigationItem[]) => {
    items.splice(0, items.length, ...newItems)
    setupAriaAttributes()
  }

  // 生命周期
  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown)
    setupAriaAttributes()
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })

  return {
    currentIndex,
    isActive,
    navigateNext,
    navigatePrevious,
    navigateFirst,
    navigateLast,
    setCurrentIndex,
    activateCurrent,
    activate,
    deactivate,
    focusItem,
    updateItems,
    setupAriaAttributes
  }
}

// 焦点管理工具
export function useFocusManagement() {
  const previousFocusElement = ref<HTMLElement | null>(null)

  const trapFocus = (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>

    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus()
            e.preventDefault()
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus()
            e.preventDefault()
          }
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)
    firstElement.focus()

    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }

  const saveFocus = () => {
    previousFocusElement.value = document.activeElement as HTMLElement
  }

  const restoreFocus = () => {
    if (previousFocusElement.value && typeof previousFocusElement.value.focus === 'function') {
      previousFocusElement.value.focus()
    }
  }

  return {
    trapFocus,
    saveFocus,
    restoreFocus,
    previousFocusElement
  }
}

// 跳过链接导航
export function useSkipLinks() {
  const skipLinks = ref<{ href: string; text: string }[]>([])

  const addSkipLink = (href: string, text: string) => {
    skipLinks.value.push({ href, text })
  }

  const removeSkipLink = (href: string) => {
    skipLinks.value = skipLinks.value.filter(link => link.href !== href)
  }

  return {
    skipLinks,
    addSkipLink,
    removeSkipLink
  }
}

// 实时区域通知
export function useLiveRegion() {
  const announcement = ref('')

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announcement.value = message

    // 创建临时的 live region 元素
    const liveRegion = document.createElement('div')
    liveRegion.setAttribute('aria-live', priority)
    liveRegion.setAttribute('aria-atomic', 'true')
    liveRegion.style.position = 'absolute'
    liveRegion.style.left = '-10000px'
    liveRegion.style.width = '1px'
    liveRegion.style.height = '1px'
    liveRegion.style.overflow = 'hidden'

    document.body.appendChild(liveRegion)
    liveRegion.textContent = message

    // 清理
    setTimeout(() => {
      document.body.removeChild(liveRegion)
    }, 1000)
  }

  return {
    announcement,
    announce
  }
}