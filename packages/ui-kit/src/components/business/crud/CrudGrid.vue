<template>
  <div class="crud-grid" v-loading="loading">
    <el-row :gutter="20">
      <el-col
        v-for="item in items"
        :key="item.id"
        :xs="24"
        :sm="12"
        :md="8"
        :lg="6"
        :xl="4"
        class="crud-grid-item"
      >
        <el-card shadow="hover">
          <div class="grid-card-content">
             <!-- Simplified grid content -->
             <div v-for="col in columns" :key="col.key">
                 <strong>{{ col.label }}:</strong> {{ item[col.key] }}
             </div>
          </div>
          <div v-if="rowActions && rowActions.length > 0" class="grid-card-actions">
             <el-button
                v-for="action in rowActions"
                :key="action.key"
                size="small"
                :type="action.type || 'default'"
                @click="handleAction(action, item)"
              >
                {{ action.label }}
              </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import type { CrudItem, ActionDefinition } from '@/shared/types/crud'

defineProps<{
  columns: any[]
  items: CrudItem[]
  loading?: boolean
  selection?: boolean
  selectedItems?: CrudItem[]
  rowActions?: ActionDefinition[]
}>()

const emit = defineEmits<{
  (e: 'selection-change', items: CrudItem[]): void
  (e: 'action', action: ActionDefinition, item: CrudItem): void
}>()

const handleAction = (action: ActionDefinition, item: CrudItem) => {
  emit('action', action, item)
}
</script>

<style scoped>
.crud-grid {
    padding: 10px;
}
.crud-grid-item {
    margin-bottom: 20px;
}
.grid-card-actions {
    margin-top: 10px;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}
</style>
