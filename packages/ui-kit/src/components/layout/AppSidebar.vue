<template>
  <aside
    class="app-sidebar"
    :class="{ 'app-sidebar--collapsed': collapsed }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Logo区域 -->
    <div class="app-sidebar__logo">
      <router-link v-if="logoLink" :to="logoLink" class="app-sidebar__logo-link">
        <img v-if="logo" :src="logo" :alt="title" class="app-sidebar__logo-image" />
      </router-link>
      <div v-else class="app-sidebar__logo-content">
        <img v-if="logo" :src="logo" :alt="title" class="app-sidebar__logo-image" />
      </div>
    </div>

    <!-- 导航菜单 -->
    <nav class="app-sidebar__nav">
      <ul class="app-sidebar__nav-list">
        <li v-for="item in props.menuItems || []" :key="item.key" class="app-sidebar__nav-item"
            @mouseenter="handleMenuItemHover(item)"
            @mouseleave="handleMenuItemLeave">
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

    <!-- 底部菜单区域 -->
    <div class="app-sidebar__bottom-nav" v-if="props.bottomMenuItems && props.bottomMenuItems.length > 0">
      <ul class="app-sidebar__nav-list">
        <li v-for="item in props.bottomMenuItems" :key="item.key" class="app-sidebar__nav-item"
            @mouseenter="handleMenuItemHover(item)"
            @mouseleave="handleMenuItemLeave">
          <router-link
            v-if="item.to"
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
    </div>

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
    bottomMenuItems?: MenuItem[]
    collapsed?: boolean
    version?: string
    hoverable?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    title: '控制台',
    collapsed: false,
    version: '1.0.0',
    hoverable: true
  })

  const emit = defineEmits<{
    menuClick: [item: MenuItem]
    toggleCollapse: [collapsed: boolean]
  }>()

  const route = useRoute()
  const router = useRouter()

  // 响应式状态
  const expandedItems = ref<string[]>([])
  const hoveredItem = ref<MenuItem | null>(null)
  const isHovered = ref(false)

  // 计算属性
  const tooltipStyle = computed(() => {
    if (!hoveredItem.value) return {}

    // 简单定位，实际可能需要更复杂的计算
    return {
      left: '70px', // 略大于折叠宽度
      top: '50%', // 需要根据鼠标位置或item位置动态计算，这里简化处理
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
    if (props.collapsed) {
      hoveredItem.value = item
      // 在这里可以获取当前 target 的位置来设置 tooltipStyle
      // 简化起见，暂不实现复杂的 DOM 测量
    }
  }

  const handleMenuItemLeave = () => {
    hoveredItem.value = null
  }

  // 自动展开当前激活的菜单组
  watch(
    () => route.path,
    () => {
      if (props.menuItems) {
        // expandedItems.value = [] // 保持展开状态，不强制重置

        const findExpandedKeys = (items: MenuItem[]) => {
          for (const item of items) {
            if (item.children && item.children.length > 0) {
              if (item.children.some(child => isActive(child))) {
                if (!expandedItems.value.includes(item.key)) {
                  expandedItems.value.push(item.key)
                }
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
</script>


<style lang="scss" scoped>
  .app-sidebar {
    background-color: rgba(15, 23, 42, 0.9); /* Darker, more opaque for better contrast */
    backdrop-filter: blur(16px);
    border-right: none;
    display: flex;
    flex-direction: column;
    height: 100vh;
    position: relative;
    width: 240px;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: var(--edu-z-docked);
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.2); /* Enhanced depth */

    /* Brand Gradient Border */
    &::after {
      content: "";
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      width: 1px;
      background: linear-gradient(
        180deg,
        rgba(91, 143, 249, 0.6) 0%,
        rgba(139, 92, 246, 0.6) 50%,
        rgba(249, 115, 22, 0.6) 100%
      );
      box-shadow: -1px 0 8px rgba(91, 143, 249, 0.2);
    }

    &--collapsed {
      width: var(--sidebar-collapsed-width, 72px); /* Slightly wider collapsed state */

      .app-sidebar__logo-text,
      .app-sidebar__nav-text,
      .app-sidebar__nav-badge,
      .app-sidebar__nav-arrow,
      .app-sidebar__version {
        opacity: 0;
        visibility: hidden;
        width: 0;
        padding: 0;
        margin: 0;
      }
      
      .app-sidebar__logo-link {
        justify-content: center;
        padding: 0;
      }
      
      .app-sidebar__nav-link {
        justify-content: center;
        padding: 12px 0;
      }
      
      .app-sidebar__nav-icon {
        margin: 0;
        width: 24px;
        height: 24px;
      }
    }
  }

  .app-sidebar__logo {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    height: auto;
    padding: 16px 12px;
    margin-bottom: 16px;
    flex-shrink: 0;
    position: relative;
    
    /* Glassmorphism background like login page */
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 16px;
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.1),
        0 2px 8px rgba(0, 0, 0, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
      transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
    }
    
    /* Gradient glow border */
    &::after {
      content: '';
      position: absolute;
      inset: -2px;
      background: linear-gradient(135deg,
        rgba(59, 130, 246, 0.35) 0%,
        rgba(124, 58, 237, 0.3) 55%,
        rgba(251, 146, 60, 0.3) 100%
      );
      border-radius: 18px;
      z-index: -1;
      opacity: 0.8;
      transition: opacity 0.3s ease;
    }
    
    &:hover::before {
      background: rgba(255, 255, 255, 0.25);
      border-color: rgba(255, 255, 255, 0.4);
      transform: translateY(-1px);
      box-shadow:
        0 12px 40px rgba(0, 0, 0, 0.15),
        0 4px 16px rgba(0, 0, 0, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.4);
    }
    
    &:hover::after {
      opacity: 1;
    }
  }

  .app-sidebar__logo-link {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    text-decoration: none;
    position: relative;
    z-index: 1;
    padding: 8px 12px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover {
      .app-sidebar__logo-image {
        transform: scale(1.05);
        filter: brightness(1.2) contrast(1.1) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
      }
    }
  }

  .app-sidebar__logo-image {
    width: 140px;
    height: 70px;
    object-fit: contain;
    transition: all 0.3s ease;
    filter: brightness(1.1) contrast(1.05) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }
  
  .app-sidebar__logo-image-collapsed {
    height: 36px;
    width: auto;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
  }

  .app-sidebar__logo-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: opacity 0.2s, width 0.3s;
    background: linear-gradient(90deg, #fff, #e2e8f0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .app-sidebar__nav {
    flex: 1;
    padding: 0 12px;
    overflow-y: auto;
    overflow-x: hidden;
    
    /* Hide scrollbar */
    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
    }
  }

  .app-sidebar__bottom-nav {
    flex-shrink: 0;
    padding: 16px 12px;
    margin-top: auto;
    position: relative;
    
    /* Separator line */
    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 20px;
      right: 20px;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    }
  }

  .app-sidebar__nav-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  
  .app-sidebar__nav-item {
    margin-bottom: 4px;
  }

  .app-sidebar__nav-link, .app-sidebar__nav-group-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    color: #94a3b8; /* Slate-400 */
    text-decoration: none;
    border-radius: 12px; /* More rounded */
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    width: 100%;
    cursor: pointer;
    background: transparent;
    border: none;
    font-size: 14px;
    position: relative;
    overflow: hidden;

    &:hover {
      background-color: rgba(255, 255, 255, 0.08);
      color: #f1f5f9;
      transform: translateX(2px);
    }

    &.app-sidebar__nav-link--active {
      background: linear-gradient(90deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 51, 234, 0.15) 100%);
      color: #fff;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
      
      /* Active Indicator Bar */
      &::before {
        content: "";
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        height: 20px;
        width: 3px;
        background: #60a5fa;
        border-radius: 0 2px 2px 0;
        box-shadow: 0 0 8px rgba(96, 165, 250, 0.6);
      }
      
      .app-sidebar__nav-icon {
        color: #60a5fa;
        filter: drop-shadow(0 0 4px rgba(96, 165, 250, 0.4));
      }
    }
  }

  .app-sidebar__nav-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    transition: all 0.3s;
    opacity: 0.8;
  }

  .app-sidebar__nav-text {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    transition: opacity 0.2s;
  }

  .app-sidebar__nav-badge {
    background: linear-gradient(135deg, #ef4444, #f87171);
    color: white;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 10px;
    font-weight: 700;
    box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
  }
  
  .app-sidebar__nav-arrow {
    width: 16px;
    height: 16px;
    opacity: 0.6;
    transition: transform 0.3s, opacity 0.2s;
  }
  
  .app-sidebar__nav-group--expanded .app-sidebar__nav-arrow {
    transform: rotate(180deg);
  }

  .app-sidebar__footer {
    padding: 16px;
    margin-top: 0; /* Handled by bottom-nav */
    flex-shrink: 0;
  }

  .app-sidebar__version {
    font-size: 11px;
    color: #475569; /* Slate-600 */
    text-align: center;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  
  .app-sidebar__tooltip {
    position: fixed;
    background-color: #0f172a;
    color: white;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    pointer-events: none;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    white-space: nowrap;
    animation: fadeIn 0.2s ease;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateX(-4px); }
    to { opacity: 1; transform: translateX(0); }
  }
  
  /* Transitions */
  .sidebar-slide-enter-active,
  .sidebar-slide-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    max-height: 500px;
    overflow: hidden;
  }

  .sidebar-slide-enter-from,
  .sidebar-slide-leave-to {
    max-height: 0;
    opacity: 0;
  }
</style>
