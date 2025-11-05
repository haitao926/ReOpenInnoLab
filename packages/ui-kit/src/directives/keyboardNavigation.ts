/**
 * 键盘导航指令
 * v-keyboard-navigation
 */

import type { App, Directive, DirectiveBinding } from 'vue'
import { accessibility } from '../utils/accessibility'

interface KeyboardNavigationBinding {
  value?: {
    selectors?: string[]
    loop?: boolean
    orientation?: 'horizontal' | 'vertical' | 'both'
    wrap?: boolean
  }
  modifiers?: {
    horizontal?: boolean
    vertical?: boolean
    loop?: boolean
    wrap?: boolean
  }
}

const keyboardNavigationDirective: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<KeyboardNavigationBinding>) {
    const options = parseBindingOptions(binding)

    accessibility.setupKeyboardNavigation({
      container: el,
      ...options
    })

    // 存储清理函数
    ;(el as any)._keyboardNavigationCleanup = () => {
      accessibility.cleanup()
    }
  },

  unmounted(el: HTMLElement) {
    // 清理键盘导航
    if ((el as any)._keyboardNavigationCleanup) {
      (el as any)._keyboardNavigationCleanup()
    }
  }
}

function parseBindingOptions(binding: DirectiveBinding<KeyboardNavigationBinding>) {
  const options: any = {}

  // 从value中获取配置
  if (binding.value) {
    Object.assign(options, binding.value)
  }

  // 从modifiers中获取配置
  if (binding.modifiers) {
    if (binding.modifiers.horizontal) {
      options.orientation = 'horizontal'
    }
    if (binding.modifiers.vertical) {
      options.orientation = 'vertical'
    }
    if (binding.modifiers.loop) {
      options.loop = true
    }
    if (binding.modifiers.wrap) {
      options.wrap = true
    }
  }

  return options
}

// 自动聚焦指令
const autoFocusDirective: Directive = {
  mounted(el: HTMLElement) {
    // 延迟聚焦，确保DOM完全渲染
    setTimeout(() => {
      const focusableElement = findFirstFocusableElement(el)
      if (focusableElement) {
        focusableElement.focus()
      }
    }, 100)
  }
}

// 焦点陷阱指令
const focusTrapDirective: Directive = {
  mounted(el: HTMLElement) {
    const cleanup = accessibility.setFocusTrap(el)
    ;(el as any)._focusTrapCleanup = cleanup
  },

  unmounted(el: HTMLElement) {
    if ((el as any)._focusTrapCleanup) {
      (el as any)._focusTrapCleanup()
    }
  }
}

// ARIA标签指令
const ariaLabelDirective: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string>) {
    if (binding.value) {
      accessibility.addAriaLabel(el, binding.value)
    }
  },

  updated(el: HTMLElement, binding: DirectiveBinding<string>) {
    if (binding.value) {
      accessibility.addAriaLabel(el, binding.value)
    }
  }
}

// ARIA描述指令
const ariaDescribedByDirective: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string>) {
    if (binding.value) {
      accessibility.addAriaDescribedBy(el, binding.value)
    }
  },

  updated(el: HTMLElement, binding: DirectiveBinding<string>) {
    if (binding.value) {
      accessibility.addAriaDescribedBy(el, binding.value)
    }
  }
}

// 跳过链接指令
const skipLinkDirective: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<{ href: string; text: string }>) {
    if (!binding.value) return

    const { href, text } = binding.value
    const skipLink = document.createElement('a')
    skipLink.href = href
    skipLink.textContent = text
    skipLink.className = 'skip-link'

    // 添加样式
    const style = document.createElement('style')
    style.textContent = `
      .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: var(--edu-primary-500);
        color: white;
        padding: 8px 12px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 9999;
        transition: top 0.3s;
        font-size: 14px;
        font-weight: 500;
      }
      .skip-link:focus {
        top: 6px;
        outline: 2px solid white;
        outline-offset: 2px;
      }
    `

    if (!document.querySelector('style[data-skip-link]')) {
      style.setAttribute('data-skip-link', 'true')
      document.head.appendChild(style)
    }

    document.body.insertBefore(skipLink, document.body.firstChild)
  }
}

// 实用工具函数
function findFirstFocusableElement(container: HTMLElement): HTMLElement | null {
  const selector = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[role="button"]:not([disabled])',
    '[role="link"]:not([disabled])'
  ].join(', ')

  const elements = Array.from(container.querySelectorAll(selector)) as HTMLElement[]

  return elements.find(el => {
    const style = window.getComputedStyle(el)
    return style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           el.offsetWidth > 0 &&
           el.offsetHeight > 0
  }) || null
}

// 注册所有指令
export function registerKeyboardNavigationDirectives(app: App) {
  app.directive('keyboard-navigation', keyboardNavigationDirective)
  app.directive('auto-focus', autoFocusDirective)
  app.directive('focus-trap', focusTrapDirective)
  app.directive('aria-label', ariaLabelDirective)
  app.directive('aria-described-by', ariaDescribedByDirective)
  app.directive('skip-link', skipLinkDirective)
}

// 导出单个指令
export {
  keyboardNavigationDirective as vKeyboardNavigation,
  autoFocusDirective as vAutoFocus,
  focusTrapDirective as vFocusTrap,
  ariaLabelDirective as vAriaLabel,
  ariaDescribedByDirective as vAriaDescribedBy,
  skipLinkDirective as vSkipLink
}
