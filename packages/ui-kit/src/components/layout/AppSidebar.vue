<template>
  <aside
    class="app-sidebar"
    :class="sidebarClasses"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Logo区域 -->
    <div class="app-sidebar__logo">
      <router-link v-if="logoLink" :to="logoLink" class="app-sidebar__logo-link">
        <img v-if="logo && !collapsed" :src="logo" :alt="title" class="app-sidebar__logo-image" />
        <span v-if="!collapsed" class="app-sidebar__logo-text">{{ title }}</span>
        <img v-else-if="logo" :src="logo" :alt="title" class="app-sidebar__logo-image-collapsed" />
      </router-link>
      <div v-else class="app-sidebar__logo-content">
        <img v-if="logo && !collapsed" :src="logo" :alt="title" class="app-sidebar__logo-image" />
        <span v-if="!collapsed" class="app-sidebar__logo-text">{{ title }}</span>
        <img v-else-if="logo" :src="logo" :alt="title" class="app-sidebar__logo-image-collapsed" />
      </div>
    </div>

    <!-- 折叠按钮 -->
    <button type="button" class="app-sidebar__toggle" @click="toggleCollapse">
      <svg
        class="app-sidebar__toggle-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <polyline :points="collapsed ? '13 19 7 12 13 5' : '11 19 17 12 11 5'" />
      </svg>
    </button>

    <!-- 导航菜单 -->
    <nav class="app-sidebar__nav">
      <ul class="app-sidebar__nav-list">
        <li v-for="item in menuItems" :key="item.key" class="app-sidebar__nav-item">
          <!-- 有子菜单的项 -->
          <div
            v-if="item.children && item.children.length > 0"
            class="app-sidebar__nav-group"
            :class="{ 'app-sidebar__nav-group--expanded': expandedItems.includes(item.key) }"
          >
            <button type="button" class="app-sidebar__nav-group-btn" @click="toggleGroup(item.key)">
              <component v-if="item.icon" :is="item.icon" class="app-sidebar__nav-icon" />
              <span v-if="!collapsed" class="app-sidebar__nav-text">{{ item.label }}</span>
              <span v-if="!collapsed" class="app-sidebar__nav-badge" v-if="item.badge">
                {{ item.badge }}
              </span>
              <svg
                v-if="!collapsed"
                class="app-sidebar__nav-arrow"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            <!-- 子菜单 -->
            <transition name="sidebar-slide">
              <ul
                v-if="!collapsed && expandedItems.includes(item.key)"
                class="app-sidebar__nav-sublist"
              >
                <li
                  v-for="child in item.children"
                  :key="child.key"
                  class="app-sidebar__nav-subitem"
                >
                  <router-link
                    v-if="child.to"
                    :to="child.to"
                    class="app-sidebar__nav-link"
                    :class="{ 'app-sidebar__nav-link--active': isActive(child) }"
                  >
                    <component v-if="child.icon" :is="child.icon" class="app-sidebar__nav-icon" />
                    <span class="app-sidebar__nav-text">{{ child.label }}</span>
                    <span v-if="child.badge" class="app-sidebar__nav-badge">
                      {{ child.badge }}
                    </span>
                  </router-link>
                  <button
                    v-else-if="child.onClick"
                    type="button"
                    class="app-sidebar__nav-link"
                    @click="handleMenuClick(child)"
                  >
                    <component v-if="child.icon" :is="child.icon" class="app-sidebar__nav-icon" />
                    <span class="app-sidebar__nav-text">{{ child.label }}</span>
                    <span v-if="child.badge" class="app-sidebar__nav-badge">
                      {{ child.badge }}
                    </span>
                  </button>
                </li>
              </ul>
            </transition>
          </div>

          <!-- 普通菜单项 -->
          <router-link
            v-else-if="item.to"
            :to="item.to"
            class="app-sidebar__nav-link"
            :class="{ 'app-sidebar__nav-link--active': isActive(item) }"
          >
            <component v-if="item.icon" :is="item.icon" class="app-sidebar__nav-icon" />
            <span v-if="!collapsed" class="app-sidebar__nav-text">{{ item.label }}</span>
            <span v-if="!collapsed && item.badge" class="app-sidebar__nav-badge">
              {{ item.badge }}
            </span>
          </router-link>
          <button
            v-else-if="item.onClick"
            type="button"
            class="app-sidebar__nav-link"
            @click="handleMenuClick(item)"
          >
            <component v-if="item.icon" :is="item.icon" class="app-sidebar__nav-icon" />
            <span v-if="!collapsed" class="app-sidebar__nav-text">{{ item.label }}</span>
            <span v-if="!collapsed && item.badge" class="app-sidebar__nav-badge">
              {{ item.badge }}
            </span>
          </button>
        </li>
      </ul>
    </nav>

    <!-- 底部区域 -->
    <div class="app-sidebar__footer">
      <div v-if="!collapsed" class="app-sidebar__footer-content">
        <slot name="footer">
          <div class="app-sidebar__version">版本 {{ version }}</div>
        </slot>
      </div>
    </div>

    <!-- Tooltip (仅在折叠状态显示) -->
    <div v-if="collapsed && hoveredItem" class="app-sidebar__tooltip" :style="tooltipStyle">
      {{ hoveredItem.label }}
    </div>
  </aside>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'

  interface MenuItem {
    key: string
    label: string
    to?: string
    icon?: any
    badge?: string | number
    children?: MenuItem[]
    onClick?: () => void
  }

  interface Props {
    title?: string
    logo?: string
    logoLink?: string
    menuItems?: MenuItem[]
    collapsed?: boolean
    width?: number
    collapsedWidth?: number
    version?: string
    hoverable?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    title: '控制台',
    collapsed: false,
    width: 240,
    collapsedWidth: 64,
    version: '1.0.0',
    hoverable: true
  })

  const emit = defineEmits<{
    toggleCollapse: [collapsed: boolean]
    menuClick: [item: MenuItem]
  }>()

  const route = useRoute()
  const router = useRouter()

  // 响应式状态
  const isCollapsed = ref(props.collapsed)
  const expandedItems = ref<string[]>([])
  const hoveredItem = ref<MenuItem | null>(null)
  const isHovered = ref(false)

  // 计算属性
  const sidebarClasses = computed(() => [
    'app-sidebar',
    {
      'app-sidebar--collapsed': isCollapsed.value,
      'app-sidebar--hovered': isHovered.value && props.hoverable && !isCollapsed.value
    }
  ])

  const tooltipStyle = computed(() => {
    if (!hoveredItem.value) return {}

    return {
      left: `${props.collapsedWidth + 8}px`,
      top: '50%',
      transform: 'translateY(-50%)'
    }
  })

  // 方法
  const isActive = (item: MenuItem) => {
    if (item.to) {
      return route.path === item.to || route.path.startsWith(item.to + '/')
    }
    return false
  }

  const toggleCollapse = () => {
    isCollapsed.value = !isCollapsed.value
    emit('toggleCollapse', isCollapsed.value)
  }

  const toggleGroup = (key: string) => {
    const index = expandedItems.value.indexOf(key)
    if (index > -1) {
      expandedItems.value.splice(index, 1)
    } else {
      expandedItems.value.push(key)
    }
  }

  const handleMenuClick = (item: MenuItem) => {
    if (item.onClick) {
      item.onClick()
    }
    emit('menuClick', item)
  }

  const handleMouseEnter = () => {
    if (props.hoverable) {
      isHovered.value = true
    }
  }

  const handleMouseLeave = () => {
    isHovered.value = false
    hoveredItem.value = null
  }

  const handleMenuItemHover = (item: MenuItem) => {
    if (isCollapsed.value) {
      hoveredItem.value = item
    }
  }

  const handleMenuItemLeave = () => {
    hoveredItem.value = null
  }

  // 监听 props 变化
  watch(
    () => props.collapsed,
    newValue => {
      isCollapsed.value = newValue
    }
  )

  // 自动展开当前激活的菜单组
  watch(
    () => route.path,
    () => {
      if (props.menuItems) {
        expandedItems.value = []

        const findExpandedKeys = (items: MenuItem[]) => {
          for (const item of items) {
            if (item.children && item.children.length > 0) {
              if (item.children.some(child => isActive(child))) {
                expandedItems.value.push(item.key)
              }
              findExpandedKeys(item.children)
            }
          }
        }

        findExpandedKeys(props.menuItems)
      }
    },
    { immediate: true }
  )

  // 暴露方法
  defineExpose({
    toggleCollapse,
    expandItem: (key: string) => {
      if (!expandedItems.value.includes(key)) {
        expandedItems.value.push(key)
      }
    },
    collapseItem: (key: string) => {
      const index = expandedItems.value.indexOf(key)
      if (index > -1) {
        expandedItems.value.splice(index, 1)
      }
    }
  })
</script>

<style lang="scss" scoped>
  .app-sidebar {
    background-color: #1e293b; /* Dark background */
    border-right: none;
    display: flex;
    flex-direction: column;
    height: 100vh;
    position: relative;
    transition: width var(--edu-duration-normal) var(--edu-easing-in-out);
    width: #{props.width}px;
    z-index: var(--edu-z-docked);

    /* Brand Gradient Border/Glow */
    &::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      width: 1px;
      background: linear-gradient(
        180deg,
        var(--brand-primary) 0%,
        var(--brand-secondary) 50%,
        var(--brand-accent) 100%
      );
      opacity: 0.5;
      box-shadow: -1px 0 8px rgba(91, 143, 249, 0.2);
    }

    &--collapsed {
      width: #{props.collapsedWidth}px;
    }
  }

  .app-sidebar__logo {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 64px;
    padding: 0 var(--spacing-base);
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
  }

  .app-sidebar__logo-link,
  .app-sidebar__logo-content {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    text-decoration: none;
    color: var(--text-primary);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-lg);
    width: 100%;
    justify-content: center;
  }

  .app-sidebar__logo-image {
    height: 32px;
    width: auto;
  }

  .app-sidebar__logo-image-collapsed {
    height: 32px;
    width: auto;
  }

  .app-sidebar__logo-text {
    color: inherit;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .app-sidebar__toggle {
    position: absolute;
    top: 50%;
    right: -12px;
    transform: translateY(-50%);
    width: 24px;
    height: 24px;
    background-color: var(--bg-elevated);
    border: 1px solid var(--border-color);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 1;
    transition: all var(--edu-duration-fast) var(--edu-easing-in-out);
    box-shadow: var(--edu-shadow-sm);

    &:hover {
      background-color: var(--edu-primary-500);
      border-color: var(--edu-primary-500);
      color: var(--text-on-primary);
    }

    &:focus-visible {
      outline: 2px solid var(--edu-primary-500);
      outline-offset: 2px;
    }
  }

  .app-sidebar__toggle-icon {
    width: 12px;
    height: 12px;
    color: var(--text-secondary);
  }

  .app-sidebar__nav {
    flex: 1;
    padding: var(--spacing-sm) 0;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .app-sidebar__nav-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .app-sidebar__nav-item {
    margin-bottom: 2px;
  }

  .app-sidebar__nav-link,
  .app-sidebar__nav-group-btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-base);
    color: var(--text-secondary);
    text-decoration: none;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    border: none;
    background: none;
    cursor: pointer;
    transition: all var(--edu-duration-fast) var(--edu-easing-in-out);
    position: relative;

    &:hover {
      color: var(--text-primary);
      background-color: var(--edu-color-gray-100);
    }

    &--active {
      color: var(--edu-primary-500);
      background-color: var(--edu-primary-50);

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background-color: var(--edu-primary-500);
      }
    }
  }

  .app-sidebar__nav-group {
    &--expanded {
      .app-sidebar__nav-arrow {
        transform: rotate(180deg);
      }
    }
  }

  .app-sidebar__nav-group-btn {
    justify-content: space-between;
  }

  .app-sidebar__nav-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  .app-sidebar__nav-text {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .app-sidebar__nav-badge {
    background-color: var(--edu-color-error-default);
    color: var(--text-on-primary);
    font-size: 10px;
    font-weight: var(--font-weight-medium);
    line-height: 1;
    padding: 2px 6px;
    border-radius: var(--radius-full);
    min-width: 18px;
    text-align: center;
    margin-left: auto;
  }

  .app-sidebar__nav-arrow {
    width: 16px;
    height: 16px;
    color: var(--text-tertiary);
    transition: transform var(--edu-duration-fast) var(--edu-easing-in-out);
  }

  .app-sidebar__nav-sublist {
    list-style: none;
    margin: 0;
    padding: 0;
    background-color: var(--bg-elevated);
  }

  .app-sidebar__nav-subitem {
    .app-sidebar__nav-link {
      padding-left: calc(var(--spacing-base) + 20px + var(--spacing-sm));
      font-size: var(--font-size-xs);
    }
  }

  .app-sidebar__footer {
    padding: var(--spacing-base);
    border-top: 1px solid var(--border-color);
    flex-shrink: 0;
  }

  .app-sidebar__footer-content {
    text-align: center;
  }

  .app-sidebar__version {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
  }

  .app-sidebar__tooltip {
    position: absolute;
    background-color: var(--bg-elevated);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-base);
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-size-xs);
    color: var(--text-primary);
    white-space: nowrap;
    z-index: var(--edu-z-tooltip);
    box-shadow: var(--edu-shadow-lg);
    pointer-events: none;
  }

  // 过渡动画
  .sidebar-slide-enter-active,
  .sidebar-slide-leave-active {
    transition: all var(--edu-duration-normal) var(--edu-easing-in-out);
    overflow: hidden;
  }

  .sidebar-slide-enter-from,
  .sidebar-slide-leave-to {
    max-height: 0;
    opacity: 0;
  }

  .sidebar-slide-enter-to,
  .sidebar-slide-leave-from {
    max-height: 500px;
    opacity: 1;
  }

  // 响应式设计
  @media (max-width: 768px) {
    .app-sidebar {
      position: fixed;
      left: 0;
      top: 0;
      transform: translateX(-100%);
      transition: transform var(--edu-duration-normal) var(--edu-easing-in-out);
      z-index: var(--edu-z-modal);
      box-shadow: var(--edu-shadow-xl);

      &:not(.app-sidebar--collapsed) {
        transform: translateX(0);
      }
    }

    .app-sidebar__toggle {
      display: none;
    }
  }

  // 深色模式适配
  [data-theme='dark'] {
    .app-sidebar {
      background-color: var(--bg-secondary);
      border-right-color: var(--border-color);
    }

    .app-sidebar__logo {
      border-bottom-color: var(--border-color);
    }

    .app-sidebar__toggle {
      background-color: var(--bg-elevated);
      border-color: var(--border-color);
    }

    .app-sidebar__nav-link:hover,
    .app-sidebar__nav-group-btn:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .app-sidebar__nav-link--active {
      background-color: rgba(33, 150, 243, 0.1);
    }

    .app-sidebar__nav-sublist {
      background-color: var(--bg-elevated);
    }

    .app-sidebar__footer {
      border-top-color: var(--border-color);
    }

    .app-sidebar__tooltip {
      background-color: var(--bg-elevated);
      border-color: var(--border-color-strong);
    }
  }
</style>
