<template>
  <GlassSurface variant="panel" class="resource-dock">
    <div class="dock-header">
      <h3>资源库</h3>
      <el-button size="small" circle>
        <el-icon><Plus /></el-icon>
      </el-button>
    </div>
    
    <div class="dock-content">
      <div class="empty-state">
        <el-icon :size="32"><Files /></el-icon>
        <p>暂无资源</p>
        <p class="sub-text">拖拽文件上传</p>
      </div>
    </div>
  </GlassSurface>
</template>

<script setup lang="ts">
import { GlassSurface } from '@reopeninnolab/ui-kit'
import { Plus, Files } from '@element-plus/icons-vue'
</script>

<style scoped lang="scss">
.resource-dock {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: var(--edu-spacing-md);
  background: rgba(255, 255, 255, 0.5);
}

.dock-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--edu-spacing-md);
  
  h3 {
    margin: 0;
    font-size: var(--edu-text-lg);
  }
}

.dock-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed var(--edu-border-base);
  border-radius: var(--edu-radius-base);
  background: rgba(255, 255, 255, 0.3);
}

.empty-state {
  text-align: center;
  color: var(--edu-text-secondary);
  
  .sub-text {
    font-size: var(--edu-text-xs);
    margin-top: 4px;
  }
}
</style>
