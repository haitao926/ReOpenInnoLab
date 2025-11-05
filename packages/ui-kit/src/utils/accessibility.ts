/**
 * 无障碍工具类
 * 提供键盘导航、屏幕阅读器支持、焦点管理等无障碍功能
 */

export interface FocusableElement extends HTMLElement {
  focus(): void
  blur(): void
}

export interface KeyboardNavigationOptions {
  container: HTMLElement
  selectors?: string[]
  loop?: boolean
  orientation?: 'horizontal' | 'vertical' | 'both'
  wrap?: boolean
}

export class AccessibilityManager {
  private static instance: AccessibilityManager
  private currentFocusIndex = 0
  private focusableElements: FocusableElement[] = []
  private options: KeyboardNavigationOptions | null = null
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null

  static getInstance(): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager()
    }
    return AccessibilityManager.instance
  }

  /**
   * 设置键盘导航
   */
  public setupKeyboardNavigation(options: KeyboardNavigationOptions): void {
    this.cleanup() // 清理之前的设置

    this.options = {
      selectors: [
        'button:not([disabled])',
        'a[href]',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
        '[role="button"]:not([disabled])',
        '[role="link"]:not([disabled])'
      ],
      loop: true,
      orientation: 'both',
      wrap: false,
      ...options
    }

    this.updateFocusableElements()
    this.setupEventListeners()

    // 监听DOM变化
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(() => {
        this.updateFocusableElements()
      })

      observer.observe(options.container, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['disabled', 'tabindex', 'aria-hidden']
      })
    }
  }

  /**
   * 清理键盘导航
   */
  public cleanup(): void {
    if (this.keydownHandler && this.options?.container) {
      this.options.container.removeEventListener('keydown', this.keydownHandler)
    }
    this.keydownHandler = null
    this.options = null
    this.focusableElements = []
    this.currentFocusIndex = 0
  }

  /**
   * 更新可聚焦元素列表
   */
  private updateFocusableElements(): void {
    if (!this.options) return

    const selector = this.options.selectors!.join(', ')
    const elements = Array.from(
      this.options.container.querySelectorAll(selector)
    ) as FocusableElement[]

    // 过滤掉不可见和禁用的元素
    this.focusableElements = elements.filter(el => {
      const style = window.getComputedStyle(el)
      const isVisible = style.display !== 'none' &&
                     style.visibility !== 'hidden' &&
                     el.offsetWidth > 0 &&
                     el.offsetHeight > 0
      const isEnabled = !el.hasAttribute('disabled') &&
                      el.getAttribute('aria-hidden') !== 'true'
      return isVisible && isEnabled
    })
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    if (!this.options) return

    this.keydownHandler = (e: KeyboardEvent) => this.handleKeydown(e)
    this.options.container.addEventListener('keydown', this.keydownHandler)
  }

  /**
   * 处理键盘事件
   */
  private handleKeydown(e: KeyboardEvent): void {
    if (!this.options) return

    switch (e.key) {
      case 'Tab':
        this.handleTab(e)
        break
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        this.handleArrowKey(e)
        break
      case 'Home':
        this.handleHome(e)
        break
      case 'End':
        this.handleEnd(e)
        break
      case 'Enter':
      case ' ':
        this.handleActivation(e)
        break
      case 'Escape':
        this.handleEscape(e)
        break
    }
  }

  /**
   * 处理Tab键
   */
  private handleTab(e: KeyboardEvent): void {
    if (this.focusableElements.length === 0) return

    const isForward = !e.shiftKey
    let nextIndex = this.currentFocusIndex

    if (isForward) {
      nextIndex++
      if (nextIndex >= this.focusableElements.length) {
        if (this.options.loop) {
          nextIndex = 0
        } else {
          return // 允许默认Tab行为
        }
      }
    } else {
      nextIndex--
      if (nextIndex < 0) {
        if (this.options.loop) {
          nextIndex = this.focusableElements.length - 1
        } else {
          return // 允许默认Tab行为
        }
      }
    }

    e.preventDefault()
    this.focusElement(nextIndex)
  }

  /**
   * 处理方向键
   */
  private handleArrowKey(e: KeyboardEvent): void {
    if (!this.options || this.focusableElements.length === 0) return

    const { orientation, wrap } = this.options
    let nextIndex = this.currentFocusIndex

    switch (e.key) {
      case 'ArrowUp':
        if (orientation === 'horizontal') return
        nextIndex--
        break
      case 'ArrowDown':
        if (orientation === 'horizontal') return
        nextIndex++
        break
      case 'ArrowLeft':
        if (orientation === 'vertical') return
        nextIndex--
        break
      case 'ArrowRight':
        if (orientation === 'vertical') return
        nextIndex++
        break
    }

    if (wrap) {
      if (nextIndex < 0) nextIndex = this.focusableElements.length - 1
      if (nextIndex >= this.focusableElements.length) nextIndex = 0
    } else {
      if (nextIndex < 0 || nextIndex >= this.focusableElements.length) return
    }

    e.preventDefault()
    this.focusElement(nextIndex)
  }

  /**
   * 处理Home键
   */
  private handleHome(e: KeyboardEvent): void {
    if (this.focusableElements.length === 0) return
    e.preventDefault()
    this.focusElement(0)
  }

  /**
   * 处理End键
   */
  private handleEnd(e: KeyboardEvent): void {
    if (this.focusableElements.length === 0) return
    e.preventDefault()
    this.focusElement(this.focusableElements.length - 1)
  }

  /**
   * 处理激活键（Enter/Space）
   */
  private handleActivation(e: KeyboardEvent): void {
    const focusedElement = document.activeElement as FocusableElement
    if (!focusedElement || !this.focusableElements.includes(focusedElement)) return

    // 对于可激活的元素，触发点击事件
    if (focusedElement.tagName === 'BUTTON' ||
        focusedElement.getAttribute('role') === 'button' ||
        focusedElement.tagName === 'A') {
      e.preventDefault()
      focusedElement.click()
    }
  }

  /**
   * 处理Escape键
   */
  private handleEscape(e: KeyboardEvent): void {
    // 触发自定义事件，让组件处理Escape逻辑
    const escapeEvent = new CustomEvent('accessibility-escape', {
      bubbles: true,
      detail: { originalEvent: e }
    })
    this.options!.container.dispatchEvent(escapeEvent)
  }

  /**
   * 聚焦到指定元素
   */
  private focusElement(index: number): void {
    if (index < 0 || index >= this.focusableElements.length) return

    const element = this.focusableElements[index]
    element.focus()
    this.currentFocusIndex = index

    // 滚动到可见区域
    this.scrollIntoViewIfNeeded(element)
  }

  /**
   * 滚动到可见区域
   */
  private scrollIntoViewIfNeeded(element: HTMLElement): void {
    const rect = element.getBoundingClientRect()
    const containerRect = this.options!.container.getBoundingClientRect()

    if (rect.top < containerRect.top ||
        rect.bottom > containerRect.bottom ||
        rect.left < containerRect.left ||
        rect.right > containerRect.right) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      })
    }
  }

  /**
   * 设置焦点陷阱
   */
  public setFocusTrap(container: HTMLElement): () => void {
    const previousActiveElement = document.activeElement as HTMLElement
    const focusableElements = this.getFocusableElements(container)

    if (focusableElements.length === 0) {
      return () => previousActiveElement?.focus()
    }

    // 聚焦第一个元素
    focusableElements[0].focus()

    // 处理Tab键循环
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeydown)

    // 返回清理函数
    return () => {
      container.removeEventListener('keydown', handleKeydown)
      previousActiveElement?.focus()
    }
  }

  /**
   * 获取容器内的可聚焦元素
   */
  private getFocusableElements(container: HTMLElement): FocusableElement[] {
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

    return Array.from(container.querySelectorAll(selector)) as FocusableElement[]
  }

  /**
   * 宣告屏幕阅读器消息
   */
  public announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message

    document.body.appendChild(announcement)

    // 清理
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  /**
   * 添加ARIA标签
   */
  public addAriaLabel(element: HTMLElement, label: string): void {
    element.setAttribute('aria-label', label)
  }

  /**
   * 添加ARIA描述
   */
  public addAriaDescribedBy(element: HTMLElement, descriptionId: string): void {
    const currentDescribedBy = element.getAttribute('aria-describedby') || ''
    const ids = currentDescribedBy ? currentDescribedBy.split(' ') : []

    if (!ids.includes(descriptionId)) {
      ids.push(descriptionId)
      element.setAttribute('aria-describedby', ids.join(' '))
    }
  }

  /**
   * 设置ARIA选中状态
   */
  public setAriaSelected(element: HTMLElement, selected: boolean): void {
    element.setAttribute('aria-selected', selected.toString())
  }

  /**
   * 设置ARIA展开状态
   */
  public setAriaExpanded(element: HTMLElement, expanded: boolean): void {
    element.setAttribute('aria-expanded', expanded.toString())
  }

  /**
   * 设置ARIA禁用状态
   */
  public setAriaDisabled(element: HTMLElement, disabled: boolean): void {
    element.setAttribute('aria-disabled', disabled.toString())
    if (disabled) {
      element.setAttribute('tabindex', '-1')
    } else {
      element.removeAttribute('tabindex')
    }
  }

  /**
   * 设置ARIA忙碌状态
   */
  public setAriaBusy(element: HTMLElement, busy: boolean): void {
    element.setAttribute('aria-busy', busy.toString())
  }

  /**
   * 跳转到主要内容
   */
  public createSkipLinks(): void {
    const skipLink = document.createElement('a')
    skipLink.href = '#main-content'
    skipLink.textContent = '跳转到主要内容'
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
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 9999;
        transition: top 0.3s;
      }
      .skip-link:focus {
        top: 6px;
      }
    `

    document.head.appendChild(style)
    document.body.insertBefore(skipLink, document.body.firstChild)
  }
}

// 导出单例实例
export const accessibility = AccessibilityManager.getInstance()

// 工具函数
export const createAccessibleButton = (
  text: string,
  onClick: () => void,
  options: {
    ariaLabel?: string
    ariaDescribedBy?: string
    disabled?: boolean
  } = {}
): HTMLButtonElement => {
  const button = document.createElement('button')
  button.textContent = text
  button.type = 'button'

  if (options.ariaLabel) {
    accessibility.addAriaLabel(button, options.ariaLabel)
  }

  if (options.ariaDescribedBy) {
    accessibility.addAriaDescribedBy(button, options.ariaDescribedBy)
  }

  if (options.disabled) {
    button.disabled = true
    accessibility.setAriaDisabled(button, true)
  }

  button.addEventListener('click', onClick)
  return button
}

export const createAccessibleLink = (
  text: string,
  href: string,
  options: {
    ariaLabel?: string
    ariaDescribedBy?: string
    external?: boolean
  } = {}
): HTMLAnchorElement => {
  const link = document.createElement('a')
  link.href = href
  link.textContent = text

  if (options.ariaLabel) {
    accessibility.addAriaLabel(link, options.ariaLabel)
  }

  if (options.ariaDescribedBy) {
    accessibility.addAriaDescribedBy(link, options.ariaDescribedBy)
  }

  if (options.external) {
    link.setAttribute('target', '_blank')
    link.setAttribute('rel', 'noopener noreferrer')
    accessibility.addAriaLabel(link, `${text} (在新窗口中打开)`)
  }

  return link
}