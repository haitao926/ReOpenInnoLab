<template>
  <div class="global-search" :class="{ 'search-expanded': isExpanded }">
    <!-- 搜索输入框 -->
    <div class="search-input-container">
      <el-input
        ref="searchInput"
        v-model="searchQuery"
        :placeholder="placeholder"
        :prefix-icon="Search"
        clearable
        size="large"
        class="search-input"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keyup.enter="handleEnter"
        @keyup.down="handleKeyDown"
        @keyup.up="handleKeyUp"
        @keyup.escape="handleEscape"
      />

      <!-- 搜索按钮 -->
      <el-button
        v-if="!searchQuery"
        :icon="Search"
        size="large"
        class="search-button"
        @click="toggleSearch"
      />

      <!-- 搜索中状态 -->
      <el-icon v-else-if="isSearching" class="search-loading">
        <Loading />
      </el-icon>
    </div>

    <!-- 搜索下拉面板 -->
    <transition name="search-dropdown">
      <div
        v-show="showDropdown"
        class="search-dropdown"
        @mouseenter="handleDropdownMouseEnter"
        @mouseleave="handleDropdownMouseLeave"
      >
        <!-- 搜索建议 -->
        <div v-if="showSuggestions && searchSuggestions.length > 0" class="search-suggestions">
          <div class="search-section-header">
            <span>搜索建议</span>
          </div>
          <div class="suggestions-list">
            <div
              v-for="(suggestion, index) in searchSuggestions"
              :key="suggestion"
              class="suggestion-item"
              :class="{ active: selectedIndex === index }"
              @click="selectSuggestion(suggestion)"
            >
              <el-icon class="suggestion-icon"><Search /></el-icon>
              <span class="suggestion-text" v-html="highlightMatch(suggestion, searchQuery)"></span>
            </div>
          </div>
        </div>

        <!-- 搜索结果 -->
        <div v-if="searchResults.length > 0" class="search-results">
          <div class="search-section-header">
            <span>搜索结果 ({{ searchResults.length }})</span>
          </div>
          <div class="results-list">
            <div
              v-for="(result, index) in searchResults"
              :key="result.id"
              class="result-item"
              :class="{ active: selectedIndex === getSuggestionOffset() + index }"
              @click="navigateToResult(result)"
            >
              <div class="result-icon">
                <component :is="getResultIcon(result.type)" />
              </div>
              <div class="result-content">
                <div class="result-title" v-html="highlightMatch(result.title, searchQuery)"></div>
                <div class="result-description" v-html="highlightMatch(result.description, searchQuery)"></div>
                <div class="result-meta">
                  <el-tag :type="getTagType(result.type)" size="small">
                    {{ getResultTypeLabel(result.type) }}
                  </el-tag>
                  <span v-if="result.metadata.courseTitle" class="meta-course">
                    {{ result.metadata.courseTitle }}
                  </span>
                  <span v-if="result.metadata.progress !== undefined" class="meta-progress">
                    进度: {{ result.metadata.progress }}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 无结果提示 -->
        <div v-else-if="searchQuery && !isSearching && !showSuggestions" class="search-empty">
          <el-empty
            :image-size="80"
            description="未找到相关内容"
          >
            <template #description>
              <p>未找到与 "{{ searchQuery }}" 相关的内容</p>
              <p class="empty-tips">试试搜索热门关键词或检查拼写</p>
            </template>
          </el-empty>
        </div>

        <!-- 热门搜索 -->
        <div v-if="!searchQuery && !showSuggestions" class="popular-searches">
          <div class="search-section-header">
            <span>热门搜索</span>
          </div>
          <div class="popular-tags">
            <el-tag
              v-for="term in popularSearches"
              :key="term"
              class="popular-tag"
              @click="searchPopularTerm(term)"
            >
              {{ term }}
            </el-tag>
          </div>
        </div>

        <!-- 搜索历史 -->
        <div v-if="!searchQuery && searchHistory.length > 0 && !showSuggestions" class="search-history">
          <div class="search-section-header">
            <span>搜索历史</span>
            <el-button
              text
              type="info"
              size="small"
              @click="clearHistory"
            >
              清除
            </el-button>
          </div>
          <div class="history-list">
            <div
              v-for="term in searchHistory"
              :key="term"
              class="history-item"
              @click="searchHistoryTerm(term)"
            >
              <el-icon class="history-icon"><Clock /></el-icon>
              <span class="history-text">{{ term }}</span>
              <el-icon class="history-remove" @click.stop="removeHistoryItem(term)">
                <Close />
              </el-icon>
            </div>
          </div>
        </div>

        <!-- 搜索快捷键提示 -->
        <div class="search-shortcuts">
          <div class="shortcut-item">
            <kbd>↑</kbd><kbd>↓</kbd> 导航
          </div>
          <div class="shortcut-item">
            <kbd>Enter</kbd> 选择
          </div>
          <div class="shortcut-item">
            <kbd>Esc</kbd> 关闭
          </div>
        </div>
      </div>
    </transition>

    <!-- 移动端遮罩 -->
    <div
      v-if="isMobile && showDropdown"
      class="search-overlay"
      @click="closeSearch"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Search, Loading, Clock, Close, Reading, Document,
  View, Trophy, Bell, FolderOpened
} from '@element-plus/icons-vue'
import { useSearch } from '@/services/search/search.service'
import type { SearchResult } from '@/services/search/search.service'

interface Props {
  placeholder?: string
  expandable?: boolean
  autoFocus?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '搜索课程、作业、实验...',
  expandable: true,
  autoFocus: false
})

const emit = defineEmits<{
  search: [query: string]
  resultClick: [result: SearchResult]
  close: []
}>()

const router = useRouter()

// 搜索相关
const {
  searchQuery,
  searchResults,
  isSearching,
  searchSuggestions,
  showSuggestions,
  searchHistory,
  popularSearches,
  performSearch,
  fetchSuggestions,
  selectSuggestion,
  clearSearch,
  initializeSearch,
  clearHistory: clearSearchHistory
} = useSearch()

// 组件状态
const searchInput = ref()
const isExpanded = ref(false)
const showDropdown = ref(false)
const selectedIndex = ref(-1)
const isMobile = ref(false)
const searchDebounceTimer = ref()
const dropdownHover = ref(false)

// 计算属性
const placeholder = computed(() => {
  if (isMobile.value) {
    return '搜索...'
  }
  return props.placeholder
})

// 方法
const toggleSearch = () => {
  if (props.expandable) {
    isExpanded.value = !isExpanded.value
    if (isExpanded.value) {
      nextTick(() => {
        searchInput.value?.focus()
      })
    }
  } else {
    searchInput.value?.focus()
  }
}

const handleInput = (value: string) => {
  selectedIndex.value = -1

  // 防抖搜索建议
  clearTimeout(searchDebounceTimer.value)
  searchDebounceTimer.value = setTimeout(() => {
    if (value.trim()) {
      fetchSuggestions(value.trim())
    } else {
      showDropdown.value = true
    }
  }, 300)
}

const handleFocus = () => {
  showDropdown.value = true
  if (!searchQuery.value) {
    selectedIndex.value = -1
  }
}

const handleBlur = () => {
  // 延迟关闭，允许点击结果
  setTimeout(() => {
    if (!dropdownHover.value) {
      closeSearch()
    }
  }, 150)
}

const handleEnter = () => {
  if (selectedIndex.value >= 0) {
    const suggestionOffset = getSuggestionOffset()
    if (selectedIndex.value < suggestionOffset) {
      // 选择建议
      const suggestion = searchSuggestions.value[selectedIndex.value]
      if (suggestion) {
        selectSuggestion(suggestion)
      }
    } else {
      // 选择搜索结果
      const resultIndex = selectedIndex.value - suggestionOffset
      const result = searchResults.value[resultIndex]
      if (result) {
        navigateToResult(result)
      }
    }
  } else if (searchQuery.value.trim()) {
    // 执行搜索
    performSearch(searchQuery.value.trim())
  }
}

const handleKeyDown = () => {
  const maxIndex = getMaxSelectableIndex()
  if (selectedIndex.value < maxIndex) {
    selectedIndex.value++
  } else {
    selectedIndex.value = 0
  }
}

const handleKeyUp = () => {
  const maxIndex = getMaxSelectableIndex()
  if (selectedIndex.value > 0) {
    selectedIndex.value--
  } else {
    selectedIndex.value = maxIndex
  }
}

const handleEscape = () => {
  closeSearch()
  searchInput.value?.blur()
}

const handleDropdownMouseEnter = () => {
  dropdownHover.value = true
}

const handleDropdownMouseLeave = () => {
  dropdownHover.value = false
}

const closeSearch = () => {
  showDropdown.value = false
  selectedIndex.value = -1
  if (props.expandable) {
    isExpanded.value = false
  }
}

const navigateToResult = (result: SearchResult) => {
  router.push(result.url)
  emit('resultClick', result)
  closeSearch()
  ElMessage.success(`正在跳转到: ${result.title}`)
}

const searchPopularTerm = (term: string) => {
  performSearch(term)
}

const searchHistoryTerm = (term: string) => {
  performSearch(term)
}

const removeHistoryItem = (term: string) => {
  const history = searchHistory.value
  const newHistory = history.filter(item => item !== term)
  localStorage.setItem('search_history', JSON.stringify(newHistory))
}

const clearHistory = () => {
  clearSearchHistory()
  ElMessage.success('搜索历史已清除')
}

const getSuggestionOffset = () => {
  return showSuggestions.value ? searchSuggestions.value.length : 0
}

const getMaxSelectableIndex = () => {
  let count = 0
  if (showSuggestions.value) {
    count += searchSuggestions.value.length
  }
  count += searchResults.value.length
  return Math.max(0, count - 1)
}

const getResultIcon = (type: string) => {
  const iconMap = {
    course: Reading,
    chapter: FolderOpened,
    activity: Document,
    lab: View,
    assignment: Document,
    announcement: Bell
  }
  return iconMap[type as keyof typeof iconMap] || Document
}

const getResultTypeLabel = (type: string) => {
  const labelMap = {
    course: '课程',
    chapter: '章节',
    activity: '活动',
    lab: '实验',
    assignment: '作业',
    announcement: '公告'
  }
  return labelMap[type as keyof typeof labelMap] || type
}

const getTagType = (type: string) => {
  const typeMap = {
    course: 'primary',
    chapter: 'info',
    activity: 'success',
    lab: 'warning',
    assignment: 'danger',
    announcement: 'info'
  }
  return typeMap[type as keyof typeof typeMap] || 'info'
}

const highlightMatch = (text: string, query: string) => {
  if (!query.trim()) return text

  const regex = new RegExp(`(${query.trim()})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

const handleGlobalClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.global-search')) {
    closeSearch()
  }
}

// 监听搜索结果变化
watch(searchResults, (results) => {
  if (results.length > 0) {
    showDropdown.value = true
  }
})

// 监听搜索建议变化
watch(searchSuggestions, (suggestions) => {
  if (suggestions.length > 0) {
    showDropdown.value = true
  }
})

// 生命周期
onMounted(async () => {
  await initializeSearch()
  checkMobile()
  window.addEventListener('resize', checkMobile)
  document.addEventListener('click', handleGlobalClick)

  if (props.autoFocus) {
    nextTick(() => {
      searchInput.value?.focus()
    })
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  document.removeEventListener('click', handleGlobalClick)
  clearTimeout(searchDebounceTimer.value)
})
</script>

<style scoped lang="scss">
.global-search {
  position: relative;
  width: 100%;
  max-width: 500px;
  transition: all 0.3s ease;

  &.search-expanded {
    .search-input-container {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }
}

.search-input-container {
  position: relative;
  display: flex;
  align-items: center;
  background: white;
  border-radius: 24px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  overflow: hidden;

  &:focus-within {
    border-color: var(--edu-primary-500);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  .search-input {
    flex: 1;

    :deep(.el-input__wrapper) {
      border: none;
      box-shadow: none;
      background: transparent;
      padding: 8px 16px;
    }

    :deep(.el-input__inner) {
      font-size: 14px;
      color: var(--edu-text-primary);
    }
  }

  .search-button {
    margin-right: 4px;
    border: none;
    background: transparent;
    color: var(--edu-text-secondary);

    &:hover {
      color: var(--edu-primary-500);
      background: var(--edu-primary-50);
    }
  }

  .search-loading {
    margin-right: 12px;
    color: var(--edu-primary-500);
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.search-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid var(--edu-border-color);
  max-height: 480px;
  overflow-y: auto;
  z-index: 1000;
}

.search-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--edu-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

// 搜索建议
.search-suggestions {
  .suggestions-list {
    padding: 0 12px 8px;
  }

  .suggestion-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover,
    &.active {
      background: var(--edu-primary-50);
    }

    .suggestion-icon {
      color: var(--edu-text-tertiary);
      font-size: 14px;
    }

    .suggestion-text {
      flex: 1;
      font-size: 14px;
      color: var(--edu-text-primary);

      :deep(mark) {
        background: rgba(99, 102, 241, 0.2);
        color: var(--edu-primary-700);
        padding: 0 2px;
        border-radius: 2px;
      }
    }
  }
}

// 搜索结果
.search-results {
  .results-list {
    padding: 0 12px 8px;
  }

  .result-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover,
    &.active {
      background: var(--edu-primary-50);
      transform: translateX(2px);
    }

    .result-icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--edu-primary-100);
      color: var(--edu-primary-600);
      border-radius: 6px;
      font-size: 16px;
      flex-shrink: 0;
    }

    .result-content {
      flex: 1;
      min-width: 0;

      .result-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--edu-text-primary);
        margin-bottom: 4px;
        line-height: 1.4;

        :deep(mark) {
          background: rgba(99, 102, 241, 0.2);
          color: var(--edu-primary-700);
          padding: 0 2px;
          border-radius: 2px;
        }
      }

      .result-description {
        font-size: 12px;
        color: var(--edu-text-secondary);
        margin-bottom: 8px;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;

        :deep(mark) {
          background: rgba(99, 102, 241, 0.15);
          color: var(--edu-primary-600);
          padding: 0 1px;
          border-radius: 1px;
        }
      }

      .result-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;

        .meta-course,
        .meta-progress {
          font-size: 11px;
          color: var(--edu-text-tertiary);
        }
      }
    }
  }
}

// 无结果提示
.search-empty {
  padding: 40px 20px;
  text-align: center;

  .empty-tips {
    font-size: 12px;
    color: var(--edu-text-tertiary);
    margin-top: 8px;
  }
}

// 热门搜索
.popular-searches {
  .popular-tags {
    padding: 8px 20px 16px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .popular-tag {
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: var(--edu-primary-100);
      border-color: var(--edu-primary-300);
      color: var(--edu-primary-700);
    }
  }
}

// 搜索历史
.search-history {
  .history-list {
    padding: 0 12px 8px;
  }

  .history-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background: var(--edu-bg-color);

      .history-remove {
        opacity: 1;
      }
    }

    .history-icon {
      color: var(--edu-text-tertiary);
      font-size: 14px;
    }

    .history-text {
      flex: 1;
      font-size: 14px;
      color: var(--edu-text-primary);
    }

    .history-remove {
      color: var(--edu-text-tertiary);
      font-size: 12px;
      opacity: 0;
      transition: opacity 0.2s ease;
      padding: 4px;

      &:hover {
        color: var(--edu-danger-500);
        background: rgba(239, 68, 68, 0.1);
        border-radius: 4px;
      }
    }
  }
}

// 快捷键提示
.search-shortcuts {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 12px 20px 16px;
  border-top: 1px solid var(--edu-border-color);
  background: var(--edu-bg-color);

  .shortcut-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--edu-text-tertiary);

    kbd {
      display: inline-block;
      padding: 2px 6px;
      background: white;
      border: 1px solid var(--edu-border-color);
      border-radius: 3px;
      font-family: monospace;
      font-size: 10px;
      color: var(--edu-text-secondary);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }
  }
}

// 移动端遮罩
.search-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 999;
}

// 过渡动画
.search-dropdown-enter-active,
.search-dropdown-leave-active {
  transition: all 0.3s ease;
}

.search-dropdown-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.search-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

// 响应式设计
@media (max-width: 768px) {
  .global-search {
    max-width: none;
  }

  .search-dropdown {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    max-height: 100vh;
    border-radius: 0;
    box-shadow: none;
  }

  .search-input-container {
    border-radius: 12px;
  }

  .result-item {
    padding: 16px;
  }

  .search-shortcuts {
    display: none;
  }
}
</style>