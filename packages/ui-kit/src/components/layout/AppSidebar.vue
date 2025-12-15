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
          <div class="app-sidebar__version">ReOpen InnoLab v{{ version }}</div>
        </slot>
      </div>
    </div>

    <!-- Tooltip (仅在折叠状态显示) -->
    <transition name="fade">
      <div v-if="collapsed && hoveredItem" class="app-sidebar__tooltip" :style="tooltipStyle">
        {{ hoveredItem.label }}
      </div>
    </transition>
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

    return {
      left: '80px', // 略大于折叠宽度
      top: '50%', // 简化垂直居中
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
    /* Premium Glassmorphism Background */
    background: linear-gradient(
      165deg,
      rgba(15, 23, 42, 0.95) 0%,
      rgba(30, 41, 59, 0.98) 100%
    );
    backdrop-filter: blur(20px);
    border-right: none; // Removing standard border for gradient border
    display: flex;
    flex-direction: column;
    height: 100vh;
    position: relative;
    width: 260px; /* Slightly wider for better readability */
    transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: var(--edu-z-docked);
    box-shadow: 12px 0 32px rgba(0, 0, 0, 0.25); /* Deeper shadow */

    /* Premium Gradient Border on Right */
    &::after {
      content: "";
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      width: 1px;
      /* Subtle, sophisticated gradient */
      background: linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.05) 0%,
        rgba(99, 102, 241, 0.4) 40%, /* Indigo hint */
        rgba(139, 92, 246, 0.4) 60%, /* Violet hint */
        rgba(255, 255, 255, 0.05) 100%
      );
      box-shadow: -1px 0 2px rgba(99, 102, 241, 0.1);
    }

    &--collapsed {
      width: var(--sidebar-collapsed-width, 76px); /* Wider collapsed state */

      .app-sidebar__logo-text,
      .app-sidebar__nav-text,
      .app-sidebar__nav-badge,
      .app-sidebar__nav-arrow,
      .app-sidebar__version,
      .app-sidebar__footer-content {
        opacity: 0;
        visibility: hidden;
        width: 0;
        padding: 0;
        margin: 0;
        pointer-events: none;
      }
      
      .app-sidebar__logo-link {
        justify-content: center;
        padding: 0;
      }
      
      .app-sidebar__nav-link, .app-sidebar__nav-group-btn {
        justify-content: center;
        padding: 12px 0;
        width: 48px; // Fixed square for icons
        margin: 0 auto; // Center in collapsed
      }
      
      .app-sidebar__nav-icon {
        margin: 0;
        width: 24px;
        height: 24px;
      }
      
      .app-sidebar__nav-group-btn {
        pointer-events: none; // Disable expanding groups in collapsed mode usually, but here just hide logic
      }
    }
  }

  .app-sidebar__logo {
    display: flex;
    align-items: center;
    justify-content: center; // Center logo area
    height: auto;
    padding: 24px 16px;
    flex-shrink: 0;
    position: relative;
    
    /* Logo Glow Effect */
    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 80%;
      height: 60%;
      background: radial-gradient(
        circle,
        rgba(99, 102, 241, 0.15) 0%,
        transparent 70%
      );
      filter: blur(20px);
      z-index: 0;
      pointer-events: none;
    }
  }

  .app-sidebar__logo-link {
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    position: relative;
    z-index: 1;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    
    &:hover {
      transform: scale(1.05);
      
      .app-sidebar__logo-image {
        filter: drop-shadow(0 0 12px rgba(139, 92, 246, 0.5));
      }
    }
  }

  .app-sidebar__logo-image {
    width: auto;
    max-width: 100%;
    height: 48px; // Slightly larger
    object-fit: contain;
    transition: all 0.4s ease;
    filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.3));
  }

  .app-sidebar__nav {
    flex: 1;
    padding: 8px 16px;
    overflow-y: auto;
    overflow-x: hidden;
    
    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
      
      &:hover {
         background: rgba(255, 255, 255, 0.2);
      }
    }
  }

  .app-sidebar__bottom-nav {
    flex-shrink: 0;
    padding: 16px;
    margin-top: auto;
    position: relative;
    
    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 24px;
      right: 24px;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.1), transparent);
    }
  }

  .app-sidebar__nav-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px; // Space between items
  }
  
  .app-sidebar__nav-item {
     position: relative;
  }

  .app-sidebar__nav-link, .app-sidebar__nav-group-btn {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 16px;
    color: #94a3b8; /* Slate-400 */
    text-decoration: none;
    border-radius: 12px;
    transition: all 0.3s cubic-bezier(0.2, 0, 0, 1);
    width: 100%;
    cursor: pointer;
    background: transparent;
    border: 1px solid transparent; // Reserve space for border
    font-size: 14px;
    font-weight: 500;
    position: relative;
    overflow: hidden;

    &:hover {
      background-color: rgba(255, 255, 255, 0.06);
      color: #f1f5f9;
      transform: translateX(4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    &:active {
      transform: translateX(2px) scale(0.98);
    }

    &.app-sidebar__nav-link--active {
      background: rgba(99, 102, 241, 0.15); // Indigo Tint
      color: #ffffff;
      font-weight: 600;
      border-color: rgba(99, 102, 241, 0.3);
      box-shadow: 
        0 4px 20px rgba(99, 102, 241, 0.25),
        inset 0 0 0 1px rgba(255, 255, 255, 0.05);
      
      /* Glowing Accent Bar */
      &::before {
        content: "";
        position: absolute;
        left: 0;
        top: 15%;
        bottom: 15%;
        width: 3px;
        background: linear-gradient(180deg, #6366f1, #8b5cf6);
        border-radius: 0 4px 4px 0;
        box-shadow: 0 0 12px rgba(139, 92, 246, 0.8);
      }
      
      .app-sidebar__nav-icon {
        color: #818cf8; // Indigo-400
        filter: drop-shadow(0 0 8px rgba(129, 140, 248, 0.5));
        transform: scale(1.1);
      }
    }
  }

  .app-sidebar__nav-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    opacity: 0.8;
  }

  .app-sidebar__nav-text {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    letter-spacing: 0.3px;
  }

  .app-sidebar__nav-badge {
    background: linear-gradient(135deg, #ef4444, #f87171);
    color: white;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 99px;
    font-weight: 700;
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
    min-width: 18px;
    text-align: center;
  }
  
  .app-sidebar__nav-arrow {
    width: 16px;
    height: 16px;
    opacity: 0.5;
    transition: transform 0.3s;
  }
  
  .app-sidebar__nav-group--expanded .app-sidebar__nav-arrow {
    transform: rotate(180deg);
    opacity: 0.9;
  }

  .app-sidebar__footer {
    padding: 16px 24px 24px;
    flex-shrink: 0;
  }

  .app-sidebar__version {
    font-size: 10px;
    color: #64748b; /* Slate-500 */
    text-align: center;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    opacity: 0.7;
  }
  
  /* Submenu Styles */
  .app-sidebar__nav-sublist {
    list-style: none;
    padding: 0;
    margin: 4px 0 8px 16px; // Indent
    position: relative;
    
    /* Guide Line */
    &::before {
       content: "";
       position: absolute;
       left: 6px;
       top: 0;
       bottom: 0;
       width: 1px;
       background: rgba(255, 255, 255, 0.1);
    }
  }
  
  .app-sidebar__nav-subitem {
     margin-bottom: 2px;
     
     .app-sidebar__nav-link {
        padding: 8px 12px 8px 20px;
        font-size: 13px;
        background: transparent !important; // override default
        border: none;
        box-shadow: none;
        
        &::before { display: none; } // removing accent bar for subitems
        
        &:hover {
           color: #fff;
           transform: translateX(4px);
        }
        
        &.app-sidebar__nav-link--active .app-sidebar__nav-text {
            color: #818cf8;
            font-weight: 600;
        }
     }
  }
  
  /* Tooltip */
  .app-sidebar__tooltip {
    position: fixed;
    background-color: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(8px);
    color: white;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    pointer-events: none;
    z-index: 9999;
    box-shadow: 
      0 4px 12px rgba(0, 0, 0, 0.2),
      0 0 0 1px rgba(255, 255, 255, 0.1);
    white-space: nowrap;
    
    &::before {
       content: ""; // Arrow
       position: absolute;
       left: -4px;
       top: 50%;
       transform: translateY(-50%) rotate(45deg);
       width: 8px;
       height: 8px;
       background-color: inherit;
       border-left: 1px solid rgba(255, 255, 255, 0.1);
       border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
  }
  
  /* Transitions */
  .sidebar-slide-enter-active,
  .sidebar-slide-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    max-height: 500px;
    opacity: 1;
    overflow: hidden;
  }

  .sidebar-slide-enter-from,
  .sidebar-slide-leave-to {
    max-height: 0;
    opacity: 0;
  }
  
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s;
  }
  
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>

