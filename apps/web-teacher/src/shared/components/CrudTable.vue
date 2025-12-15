<template>
  <div class="crud-table">
    <el-table
      v-loading="loading"
      :data="items"
      style="width: 100%"
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
    >
      <el-table-column
        v-if="selection"
        type="selection"
        width="55"
      />
      
      <el-table-column
        v-for="col in columns"
        :key="col.key"
        :prop="col.key"
        :label="col.label"
        :width="col.width"
        :sortable="col.sortable ? 'custom' : false"
      >
        <template #default="scope">
            <slot :name="`col-${col.key}`" :row="scope.row">
                {{ scope.row[col.key] }}
            </slot>
        </template>
      </el-table-column>

      <el-table-column
        v-if="rowActions && rowActions.length > 0"
        label="操作"
        fixed="right"
        min-width="120"
      >
        <template #default="scope">
          <el-button
            v-for="action in rowActions"
            :key="action.key"
            size="small"
            :type="action.type || 'primary'"
            link
            @click="handleAction(action, scope.row)"
          >
            {{ action.label }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
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
  (e: 'sort-change', sortBy: string, sortOrder: 'asc' | 'desc'): void
}>()

const handleSelectionChange = (val: CrudItem[]) => {
  emit('selection-change', val)
}

const handleAction = (action: ActionDefinition, item: CrudItem) => {
  emit('action', action, item)
}

const handleSortChange = ({ prop, order }: any) => {
  if (!prop) return
  emit('sort-change', prop, order === 'ascending' ? 'asc' : 'desc')
}
</script>

<style scoped>
.crud-table {
    width: 100%;
}
</style>
