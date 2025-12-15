<template>
  <div class="crud-timeline" v-loading="loading">
    <el-timeline>
      <el-timeline-item
        v-for="item in items"
        :key="item.id"
        :timestamp="item[dateField]"
        placement="top"
      >
        <el-card>
          <h4>{{ item.title || item.name || 'Untitled' }}</h4>
          <p v-if="item.description">{{ item.description }}</p>
          <div v-if="rowActions && rowActions.length > 0" class="timeline-actions">
              <el-button
                v-for="action in rowActions"
                :key="action.key"
                size="small"
                :type="action.type || 'primary'"
                link
                @click="handleAction(action, item)"
              >
                {{ action.label }}
              </el-button>
          </div>
        </el-card>
      </el-timeline-item>
    </el-timeline>
  </div>
</template>

<script setup lang="ts">
import type { CrudItem, ActionDefinition } from '@/shared/types/crud'

defineProps<{
  items: CrudItem[]
  loading?: boolean
  dateField: string
  rowActions?: ActionDefinition[]
}>()

const emit = defineEmits<{
  (e: 'action', action: ActionDefinition, item: CrudItem): void
}>()

const handleAction = (action: ActionDefinition, item: CrudItem) => {
  emit('action', action, item)
}
</script>
<style scoped>
.crud-timeline {
    padding: 20px;
}
.timeline-actions {
    margin-top: 10px;
}
</style>
