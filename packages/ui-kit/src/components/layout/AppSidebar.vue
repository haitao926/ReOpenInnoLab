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

      <!-- Top Collapse Trigger (Visible only when expanded) -->
      <button 
        v-if="!collapsed"
        class="app-sidebar__collapse-btn app-sidebar__collapse-btn--top" 
        @click="$emit('toggleCollapse', !collapsed)"
        title="收起侧边栏"
      >
        <svg 
          viewBox="0 0 24 24" 
          width="16" 
          height="16" 
          stroke="currentColor" 
          stroke-width="2" 
          fill="none" 
          stroke-linecap="round" 
          stroke-linejoin="round"
        >
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
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
      
      <!-- Integrated Collapse Trigger (Visible ONLY when collapsed to expand back) -->
      <button 
        v-if="collapsed"
        class="app-sidebar__collapse-btn" 
        @click="$emit('toggleCollapse', !collapsed)"
        title="展开"
      >
        <svg 
          viewBox="0 0 24 24" 
          width="16" 
          height="16" 
          stroke="currentColor" 
          stroke-width="2" 
          fill="none" 
          stroke-linecap="round" 
          stroke-linejoin="round"
          class="rotated"
        >
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
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
    width?: number
    collapsedWidth?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    title: '控制台',
    collapsed: false,
    version: '1.0.0',
    hoverable: true,
    width: 240, // Slightly narrower, cleaner look
    collapsedWidth: 72 // Standard icon width
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
    /* Gaoding Style: Light, Airy, No heavy borders */
    background: #F9FAFB; /* Very light gray, almost white but distinctive */
    border-right: none; /* Remove harsh border */
    display: flex;
    flex-direction: column;
    height: 100vh;
    position: relative;
    width: v-bind('props.width + "px"');
    transition: width var(--edu-duration-normal) var(--edu-easing-smooth);
    z-index: var(--edu-z-index-50);
    
    /* Subtle separator only if needed, or rely on content background contrast */
    box-shadow: 1px 0 0 0 rgba(0,0,0,0.03); 

    &--collapsed {
      width: v-bind('props.collapsedWidth + "px"');

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
        padding: 10px 0;
        width: 40px; /* Compact square for icons */
        margin: 0 auto;
      }
      
      .app-sidebar__nav-icon {
        margin: 0;
        width: 20px;
        height: 20px;
      }
      
      .app-sidebar__nav-group-btn {
        pointer-events: none;
      }
    }
  }

  .app-sidebar__logo {
    display: flex;
    align-items: center;
    justify-content: space-between; /* Space between logo and toggle */
    height: 80px;
    padding: 0 16px;
    flex-shrink: 0;
    position: relative;
    margin-bottom: 8px;
    
    .app-sidebar--collapsed & {
      justify-content: center;
      padding: 0;
      height: 64px;
    }
  }

  .app-sidebar__logo-link {
    display: flex;
    align-items: center;
    justify-content: flex-start; /* Left align */
    gap: 12px;
    text-decoration: none;
    color: var(--edu-text-primary);
    font-weight: var(--edu-font-weight-bold);
    font-size: 18px;
    flex: 1; /* Take up space */
    min-width: 0; /* Allow shrinking */
    transition: opacity var(--edu-duration-fast);
    
    &:hover {
      opacity: 0.9;
    }
  }

  .app-sidebar__collapse-btn--top {
     flex-shrink: 0;
     margin-left: 8px;
     opacity: 0.6;
     
     &:hover { opacity: 1; }
  }

  .app-sidebar__logo-image {
    width: auto;      /* Auto width to maintain aspect ratio */
    height: 42px;     /* Increased from 32px */
    max-width: 180px; /* Ensure it fits in sidebar */
    object-fit: contain;
    
    .app-sidebar--collapsed & {
      height: 32px; /* Smaller in collapsed mode */
      width: 32px;
    }
  }

  /* Text fallback for logo */
  .app-sidebar__logo-content {
    font-size: 20px;
    font-weight: 700;
    color: var(--edu-color-primary-600);
  }

  .app-sidebar__nav {
    flex: 1;
    padding: var(--edu-spacing-4) var(--edu-spacing-3);
    overflow-y: auto;
    overflow-x: hidden;
    
    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--edu-color-gray-200);
      border-radius: 2px;
      
      &:hover {
         background: var(--edu-color-gray-300);
      }
    }
  }

  .app-sidebar__bottom-nav {
    flex-shrink: 0;
    padding: var(--edu-spacing-3);
    margin-top: auto;
    border-top: 1px solid var(--edu-border-color-light);
  }

  .app-sidebar__nav-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px; /* Relaxed spacing for premium feel */
  }
  
  .app-sidebar__nav-item {
     position: relative;
  }

  .app-sidebar__nav-link, .app-sidebar__nav-group-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    color: var(--edu-color-gray-600); /* Softer gray text */
    text-decoration: none;
    border-radius: 8px; /* Slightly more rounded */
    transition: all var(--edu-duration-fast) var(--edu-easing-smooth);
    width: 100%;
    cursor: pointer;
    background: transparent;
    border: none;
    font-size: 14px;
    font-weight: 500;
    position: relative;

    &:hover {
      background-color: rgba(0, 0, 0, 0.04);
      color: var(--edu-color-gray-900);
    }
    
    &:active {
      background-color: rgba(0, 0, 0, 0.08);
    }

    &.app-sidebar__nav-link--active {
      /* Subtle Brand Wash: Very faint Indigo-Purple gradient */
      background: linear-gradient(90deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%);
      color: #4F46E5; /* Indigo 600 - Brand Primary */
      font-weight: 600;
      
      /* The "Unintentional" Flow Bar */
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 10px;
        bottom: 10px;
        width: 3px;
        border-radius: 0 4px 4px 0;
        background: linear-gradient(180deg, #6366F1 0%, #8B5CF6 100%); /* Blue -> Purple */
        opacity: 0.8;
      }
      
      .app-sidebar__nav-icon {
        color: #4F46E5; /* Match text */
      }
    }
  }

  .app-sidebar__nav-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    color: var(--edu-color-gray-400);
    transition: color var(--edu-duration-fast);
    
    .app-sidebar__nav-link:hover & {
      color: var(--edu-color-gray-700);
    }
  }

  .app-sidebar__nav-text {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
  }

  .app-sidebar__nav-badge {
    /* Brand Accent: Hermès Orange */
    background: linear-gradient(135deg, #F97316 0%, #FB923C 100%);
    color: white;
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 10px;
    font-weight: 600;
    min-width: 18px;
    text-align: center;
    line-height: 1;
    box-shadow: 0 2px 4px rgba(249, 115, 22, 0.2); /* Soft orange glow */
  }
  
  .app-sidebar__nav-arrow {
    width: 16px;
    height: 16px;
    opacity: 0.4;
    transition: transform var(--edu-duration-normal);
  }
  
  .app-sidebar__nav-group--expanded .app-sidebar__nav-arrow {
    transform: rotate(180deg);
  }

  .app-sidebar__footer {
    padding: 12px 16px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between; /* Space between version and toggle */
    
    .app-sidebar--collapsed & {
      justify-content: center;
      padding: 12px 0;
    }
  }

  .app-sidebar__collapse-btn {
    background: transparent;
    border: none;
    color: var(--edu-color-gray-400);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    
    &:hover {
      color: var(--edu-color-gray-700);
      background: rgba(0,0,0,0.05);
    }
    
    svg {
      transition: transform 0.3s ease;
      &.rotated {
        transform: rotate(180deg);
      }
    }
  }

  .app-sidebar__version {
    font-size: 11px;
    color: var(--edu-text-tertiary);
    text-align: center;
    letter-spacing: 0.5px;
  }
  
  /* Submenu Styles */
  .app-sidebar__nav-sublist {
    list-style: none;
    padding: 0;
    margin: 2px 0 2px 0;
    position: relative;
  }
  
  .app-sidebar__nav-subitem {
     margin-bottom: 2px;
     
     .app-sidebar__nav-link {
        padding: 8px 12px 8px 44px; /* Indented padding for hierarchy */
        font-size: 13px;
        color: var(--edu-text-secondary);
        
        &:hover {
           background-color: transparent;
           color: var(--edu-text-primary);
        }
        
        &.app-sidebar__nav-link--active {
            background-color: transparent;
            color: var(--edu-color-primary-600);
            font-weight: 600;
            
            &::before {
               content: '';
               position: absolute;
               left: 26px; /* Dot indicator position */
               top: 50%;
               transform: translateY(-50%);
               width: 4px;
               height: 4px;
               border-radius: 50%;
               background-color: currentColor;
            }
        }
     }
  }
  
  /* Tooltip */
  .app-sidebar__tooltip {
    position: fixed;
    background-color: var(--edu-color-gray-900);
    color: white;
    padding: 6px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    pointer-events: none;
    z-index: var(--edu-z-index-tooltip);
    box-shadow: var(--edu-shadow-md);
    white-space: nowrap;
    
    &::before {
       content: "";
       position: absolute;
       left: -4px;
       top: 50%;
       transform: translateY(-50%) rotate(45deg);
       width: 8px;
       height: 8px;
       background-color: inherit;
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

  /* Dark Mode Overrides */
  [data-theme="dark"] .app-sidebar {
    background: var(--edu-bg-secondary); /* Slightly lighter than pure black bg */
    border-right-color: var(--edu-border-color);

    &::after { display: none; }

    .app-sidebar__nav-link:hover {
      background-color: rgba(255, 255, 255, 0.05);
      color: var(--edu-text-primary);
    }

    .app-sidebar__nav-link--active {
      background-color: rgba(99, 102, 241, 0.15);
      color: var(--edu-color-primary-400);
      
      .app-sidebar__nav-icon {
        color: var(--edu-color-primary-400);
      }
    }
    
    .app-sidebar__bottom-nav {
      border-top-color: var(--edu-border-color);
    }
    
    ::-webkit-scrollbar-thumb {
       background: rgba(255, 255, 255, 0.1);
       &:hover { background: rgba(255, 255, 255, 0.2); }
    }
  }
</style>