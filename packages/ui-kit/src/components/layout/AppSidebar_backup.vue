<template>
  <aside
    class="app-sidebar"
    :class="{ 'app-sidebar--collapsed': collapsed }"
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

    <!-- 导航菜单 -->
    <nav class="app-sidebar__nav">
      <ul class="app-sidebar__nav-list">
        <li v-for="item in props.menuItems || []" :key="item.key" class="app-sidebar__nav-item">
          <!-- 有子菜单的项 -->
          <div
            v-if="item.children && item.children.length > 0"
            class="app-sidebar__nav-group"
            :class="{ 'app-sidebar__nav-group--expanded': expandedItems.includes(item.key) }"
          >
            <button type="button" class="app-sidebar__nav-group-btn" @click="toggleGroup(item.key)">
              <component v-if="item.icon" :is="item.icon" class="app-sidebar__nav-icon" />
              <span v-if="!collapsed" class="app-sidebar__nav-text">{{ item.label }}</span>
              <span v-if="!collapsed && item.badge" class="app-sidebar__nav-badge">
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

  </aside>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
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
    version?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    title: '控制台',
    collapsed: false,
    version: '1.0.0'
  })

  const emit = defineEmits<{
    menuClick: [item: MenuItem]
  }>()

  const route = useRoute()
  const router = useRouter()

  // 响应式状态（仅保留必要的）
  const expandedItems = ref<string[]>([])

  // 方法
  const isActive = (item: MenuItem) => {
    if (item.to) {
      return route.path === item.to || route.path.startsWith(item.to + '/')
    }
    return false
  }

  const handleMenuClick = (item: MenuItem) => {
    if (item.to) {
      router.push(item.to)
    }
    if (item.onClick) {
      item.onClick()
    }
    emit('menuClick', item)
  }

  const toggleGroup = (key: string) => {
    const index = expandedItems.value.indexOf(key)
    if (index > -1) {
      expandedItems.value.splice(index, 1)
    } else {
      expandedItems.value.push(key)
    }
  }
</script>

<style lang="scss" scoped>
  .app-sidebar {
    background-color: #1e293b; /* Dark background */
    border-right: none;
    display: flex;
    flex-direction: column;
    height: 100vh;
    position: relative;
    width: 100%;
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
  }
</style>
