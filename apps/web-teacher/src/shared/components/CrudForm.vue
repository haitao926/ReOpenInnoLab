<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    :width="width"
    :close-on-click-modal="false"
    append-to-body
    @close="handleClose"
  >
    <el-form
      v-if="formData"
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      label-position="right"
    >
      <template v-for="field in formFields" :key="field.key">
        <el-form-item
          v-if="!field.hideInForm"
          :label="field.label"
          :prop="field.key"
        >
          <!-- 文本输入 -->
          <el-input
            v-if="field.type === 'text' || field.type === 'email' || field.type === 'url' || field.type === 'password'"
            v-model="formData[field.key]"
            :type="field.type"
            :placeholder="field.placeholder"
            :disabled="isFieldDisabled(field)"
          />

          <!-- 多行文本 -->
          <el-input
            v-else-if="field.type === 'textarea'"
            v-model="formData[field.key]"
            type="textarea"
            :rows="4"
            :placeholder="field.placeholder"
            :disabled="isFieldDisabled(field)"
          />

          <!-- 数字输入 -->
          <el-input-number
            v-else-if="field.type === 'number'"
            v-model="formData[field.key]"
            :min="field.props?.min"
            :max="field.props?.max"
            :step="field.props?.step"
            :disabled="isFieldDisabled(field)"
          />

          <!-- 选择器 -->
          <el-select
            v-else-if="field.type === 'select'"
            v-model="formData[field.key]"
            :placeholder="field.placeholder"
            :multiple="field.props?.multiple"
            :disabled="isFieldDisabled(field)"
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="opt in field.options"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>

          <!-- 日期选择 -->
          <el-date-picker
            v-else-if="field.type === 'date' || field.type === 'datetime'"
            v-model="formData[field.key]"
            :type="field.type"
            :placeholder="field.placeholder"
            style="width: 100%"
            :disabled="isFieldDisabled(field)"
          />

          <!-- 开关 -->
          <el-switch
            v-else-if="field.type === 'boolean'"
            v-model="formData[field.key]"
            :disabled="isFieldDisabled(field)"
          />

          <!-- 默认输入 (fallback) -->
          <el-input
            v-else
            v-model="formData[field.key]"
            :placeholder="field.placeholder"
            :disabled="isFieldDisabled(field)"
          />
        </el-form-item>
      </template>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button
          v-if="mode !== 'view'"
          type="primary"
          :loading="submitting"
          @click="handleSubmit"
        >
          确定
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { FormInstance } from 'element-plus'
import type { CrudConfig, CrudField } from '@/shared/types/crud'

const props = defineProps<{
  visible: boolean
  config: CrudConfig
  mode: 'create' | 'edit' | 'view'
  data: Record<string, any>
  width?: string | number
  submitting?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  'submit': [data: Record<string, any>]
  'cancel': []
}>()

const formRef = ref<FormInstance>()
const internalFormData = ref<Record<string, any>>({})

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const dialogTitle = computed(() => {
  const title = props.config.title || '记录'
  switch (props.mode) {
    case 'create':
      return `新建${title}`
    case 'edit':
      return `编辑${title}`
    case 'view':
      return `查看${title}`
    default:
      return title
  }
})

const formFields = computed(() => {
  return props.config.fields || []
})

// 生成表单验证规则
const formRules = computed(() => {
  const rules: Record<string, any[]> = {}
  
  formFields.value.forEach(field => {
    const fieldRules = []
    
    if (field.required) {
      fieldRules.push({
        required: true,
        message: `${field.label}是必填项`,
        trigger: field.type === 'select' || field.type === 'date' ? 'change' : 'blur'
      })
    }
    
    if (field.rules) {
      fieldRules.push(...field.rules)
    }
    
    if (fieldRules.length > 0) {
      rules[field.key] = fieldRules
    }
  })
  
  return rules
})

// 监听数据变化，同步到内部表单数据
watch(() => props.data, (newData) => {
  internalFormData.value = { ...newData }
}, { deep: true, immediate: true })

// 暴露为 formData 给模板使用
const formData = computed({
  get: () => internalFormData.value,
  set: (val) => internalFormData.value = val
})

const isFieldDisabled = (field: CrudField) => {
  if (props.mode === 'view') return true
  if (field.editable === false) return true
  if (props.mode === 'edit' && field.editable === 'create-only') return true
  return false
}

const handleClose = () => {
  emit('update:visible', false)
  emit('cancel')
}

const handleCancel = () => {
  dialogVisible.value = false
  emit('cancel')
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate((valid, fields) => {
    if (valid) {
      emit('submit', { ...internalFormData.value })
    } else {
      console.log('Validation failed', fields)
    }
  })
}
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
