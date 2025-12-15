<template>
  <div class="crud-filters">
     <!-- Filters implementation placeholder -->
     <div v-for="filter in filters" :key="filter.key" class="filter-item">
        <label v-if="filter.label">{{ filter.label }}</label>
        <el-input
          v-if="filter.type === 'input'"
          v-model="modelValue[filter.key]"
          :placeholder="filter.placeholder"
          @input="handleChange"
        />
        <el-select
          v-else-if="filter.type === 'select'"
          v-model="modelValue[filter.key]"
          :placeholder="filter.placeholder"
          @change="handleChange"
        >
          <el-option
            v-for="opt in filter.options"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
     </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  filters: any[]
  value: Record<string, any>
}>()

const emit = defineEmits<{
  (e: 'change', filters: Record<string, any>): void
  (e: 'update:value', filters: Record<string, any>): void
}>()

const modelValue = computed({
  get: () => props.value,
  set: (val) => {
    emit('update:value', val)
    emit('change', val)
  }
})

const handleChange = () => {
    emit('change', modelValue.value)
}
</script>

<style scoped>
.crud-filters {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
