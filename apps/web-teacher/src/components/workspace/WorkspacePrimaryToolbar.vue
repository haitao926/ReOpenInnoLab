<template>
  <div class="workspace-primary-toolbar">
    <div class="toolbar-right">
      <!-- 主要操作按钮组 -->
      <div class="primary-actions">
        <EduButton
          v-if="showCreateButton"
          variant="primary"
          @click="handleCreate"
          :loading="creating"
        >
          <el-icon><Plus /></el-icon>
          {{ createButtonText }}
        </EduButton>

        <EduButton
          v-if="showImportButton"
          variant="secondary"
          @click="handleImport"
          :loading="importing"
        >
          <el-icon><Upload /></el-icon>
          {{ importButtonText }}
        </EduButton>
      </div>

      <!-- 次要操作按钮组 -->
      <div class="secondary-actions">
        <el-button
          v-if="showAIButton"
          type="default"
          class="ai-trigger"
          :class="{ active: aiActive }"
          @click="handleAI"
        >
          <el-icon><MagicStick /></el-icon>
          AI 助手
        </el-button>

        <el-button
          v-if="showRefreshButton"
          type="default"
          @click="handleRefresh"
          :loading="refreshing"
        >
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Plus, Upload, MagicStick, Refresh } from '@element-plus/icons-vue'
import { EduButton } from '@reopeninnolab/ui-kit'

interface Props {
  // 主要操作按钮
  showCreateButton?: boolean
  createButtonText?: string
  showImportButton?: boolean
  importButtonText?: string

  // 次要操作按钮
  showAIButton?: boolean
  aiActive?: boolean
  showRefreshButton?: boolean

  // 加载状态
  creating?: boolean
  importing?: boolean
  refreshing?: boolean
}

interface Emits {
  (e: 'create'): void
  (e: 'import'): void
  (e: 'ai'): void
  (e: 'refresh'): void
}

const props = withDefaults(defineProps<Props>(), {
  showCreateButton: true,
  createButtonText: '创建',
  showImportButton: true,
  importButtonText: '导入',
  showAIButton: false,
  aiActive: false,
  showRefreshButton: false,
  creating: false,
  importing: false,
  refreshing: false
})

const emit = defineEmits<Emits>()

// 事件处理
const handleCreate = () => {
  emit('create')
}

const handleImport = () => {
  emit('import')
}

const handleAI = () => {
  emit('ai')
}

const handleRefresh = () => {
  emit('refresh')
}
</script>

<style scoped lang="scss">
.workspace-primary-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  width: 100%;
  flex-wrap: wrap;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.primary-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.secondary-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.view-toggle {
  flex-shrink: 0;
}

.ai-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;

  &.active {
    background: linear-gradient(135deg, #7f5eff 0%, #45a3ff 100%);
    border-color: transparent;
    color: white;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .workspace-primary-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .toolbar-left,
  .toolbar-right {
    justify-content: center;
  }

  .primary-actions {
    flex-wrap: wrap;
    justify-content: center;
  }

  .secondary-actions {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .primary-actions {
    flex-direction: column;
    width: 100%;

    .edu-button,
    .el-button {
      width: 100%;
    }
  }
}

// 减少动画偏好
@media (prefers-reduced-motion: reduce) {
  .ai-trigger {
    transition: none;
  }
}
</style>