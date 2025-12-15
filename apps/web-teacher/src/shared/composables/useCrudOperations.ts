import { ref, computed, reactive, type Ref } from 'vue'
import type { CrudConfig, CrudState, CrudItem, ListResponse } from '@/shared/types/crud'

export function useCrudOperations<T extends CrudItem = CrudItem>(
  config: CrudConfig,
  initialData?: Partial<CrudState<T>>
) {
  // 状态管理
  const state = reactive<CrudState<T>>({
    items: [],
    loading: false,
    total: 0,
    page: 1,
    pageSize: config.list?.pagination?.defaultPageSize || 20,
    filters: {},
    searchKeyword: '',
    selectedItems: [],
    viewMode: config.list?.defaultViewMode || 'table',
    ...initialData
  })

  // 表单状态
  const formData = ref<Partial<T>>({})
  const formMode = ref<'create' | 'edit'>('create')
  const formVisible = ref(false)
  const currentStep = ref(0)

  // 计算属性
  const filteredItems = computed(() => {
    let items = state.items

    // 搜索过滤
    if (state.searchKeyword) {
      const keyword = state.searchKeyword.toLowerCase()
      items = items.filter(item => {
        // 在所有字段中搜索
        return Object.values(item).some(value =>
          String(value).toLowerCase().includes(keyword)
        )
      })
    }

    // 高级过滤
    Object.entries(state.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        items = items.filter(item => {
          if (Array.isArray(value)) {
            return value.includes(item[key])
          }
          return item[key] === value
        })
      }
    })

    // 排序
    if (state.sortBy) {
      items = [...items].sort((a, b) => {
        const aValue = a[state.sortBy!]
        const bValue = b[state.sortBy!]

        if (aValue < bValue) return state.sortOrder === 'asc' ? -1 : 1
        if (aValue > bValue) return state.sortOrder === 'asc' ? 1 : -1
        return 0
      })
    }

    return items
  })

  const paginatedItems = computed(() => {
    if (!config.list?.pagination?.enabled) {
      return filteredItems.value
    }

    const start = (state.page - 1) * state.pageSize
    const end = start + state.pageSize
    return filteredItems.value.slice(start, end)
  })

  // CRUD 操作
  const loadItems = async (params?: Record<string, any>) => {
    state.loading = true
    try {
      // 这里应该调用实际的 API
      // const response = await api.get(config.api.list, { params })

      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 500))

      // 模拟数据
      const mockData: ListResponse<T> = {
        items: [],
        total: 0,
        page: state.page,
        pageSize: state.pageSize
      }

      state.items = mockData.items
      state.total = mockData.total
    } catch (error) {
      console.error('Failed to load items:', error)
      // 这里可以添加错误处理逻辑
    } finally {
      state.loading = false
    }
  }

  const createItem = async (data: Partial<T>) => {
    try {
      // 执行前置钩子
      if (config.hooks?.beforeCreate) {
        data = await config.hooks.beforeCreate(data)
      }

      // 调用 API 创建
      // const response = await api.post(config.api.create, data)

      // 模拟创建
      const newItem: T = {
        id: Date.now(),
        ...data as T
      }

      state.items.unshift(newItem)
      state.total++

      // 执行后置钩子
      if (config.hooks?.afterCreate) {
        await config.hooks.afterCreate(newItem)
      }

      return newItem
    } catch (error) {
      console.error('Failed to create item:', error)
      throw error
    }
  }

  const updateItem = async (id: string | number, data: Partial<T>) => {
    try {
      // 执行前置钩子
      if (config.hooks?.beforeUpdate) {
        data = await config.hooks.beforeUpdate(String(id), data)
      }

      // 调用 API 更新
      // const response = await api.put(`${config.api.update}/${id}`, data)

      // 模拟更新
      const index = state.items.findIndex(item => item.id === id)
      if (index > -1) {
        state.items[index] = { ...state.items[index], ...data }
      }

      // 执行后置钩子
      if (config.hooks?.afterUpdate) {
        await config.hooks.afterUpdate(state.items[index])
      }

      return state.items[index]
    } catch (error) {
      console.error('Failed to update item:', error)
      throw error
    }
  }

  const deleteItem = async (id: string | number) => {
    try {
      // 执行前置钩子
      if (config.hooks?.beforeDelete) {
        await config.hooks.beforeDelete(String(id))
      }

      // 调用 API 删除
      // await api.delete(`${config.api.delete}/${id}`)

      // 模拟删除
      const index = state.items.findIndex(item => item.id === id)
      if (index > -1) {
        state.items.splice(index, 1)
        state.total--
      }

      // 执行后置钩子
      if (config.hooks?.afterDelete) {
        await config.hooks.afterDelete()
      }

      return true
    } catch (error) {
      console.error('Failed to delete item:', error)
      throw error
    }
  }

  const batchDelete = async (ids: (string | number)[]) => {
    try {
      // 执行前置钩子
      if (config.hooks?.beforeDelete) {
        await config.hooks.beforeDelete(ids.map(String))
      }

      // 调用 API 批量删除
      // await api.post(config.api.batch?.delete, { ids })

      // 模拟批量删除
      state.items = state.items.filter(item => !ids.includes(item.id))
      state.total -= ids.length
      state.selectedItems = []

      // 执行后置钩子
      if (config.hooks?.afterDelete) {
        await config.hooks.afterDelete()
      }

      return true
    } catch (error) {
      console.error('Failed to batch delete items:', error)
      throw error
    }
  }

  // 表单操作
  const openCreateForm = () => {
    formMode.value = 'create'
    formData.value = {}
    currentStep.value = 0
    formVisible.value = true
  }

  const openEditForm = (item: T) => {
    formMode.value = 'edit'
    formData.value = { ...item }
    currentStep.value = 0
    formVisible.value = true
  }

  const closeForm = () => {
    formVisible.value = false
    formData.value = {}
    currentStep.value = 0
  }

  const submitForm = async () => {
    try {
      if (formMode.value === 'create') {
        await createItem(formData.value)
      } else {
        await updateItem(formData.value.id!, formData.value)
      }
      closeForm()
      await loadItems()
    } catch (error) {
      console.error('Failed to submit form:', error)
    }
  }

  // 选择操作
  const toggleSelection = (item: T) => {
    const index = state.selectedItems.findIndex(selected => selected.id === item.id)
    if (index > -1) {
      state.selectedItems.splice(index, 1)
    } else {
      state.selectedItems.push(item)
    }
  }

  const selectAll = () => {
    if (state.selectedItems.length === paginatedItems.value.length) {
      state.selectedItems = []
    } else {
      state.selectedItems = [...paginatedItems.value]
    }
  }

  // 过滤和搜索
  const setFilters = (filters: Record<string, any>) => {
    state.filters = { ...filters }
    state.page = 1 // 重置页码
  }

  const setSearch = (keyword: string) => {
    state.searchKeyword = keyword
    state.page = 1 // 重置页码
  }

  const setSorting = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    state.sortBy = sortBy
    state.sortOrder = sortOrder
  }

  const setPage = (page: number, pageSize?: number) => {
    state.page = page
    if (pageSize) {
      state.pageSize = pageSize
    }
  }

  const setViewMode = (mode: 'table' | 'grid' | 'timeline') => {
    state.viewMode = mode
  }

  // 验证
  const validateField = (field: string, value: any) => {
    const fieldDef = config.fields.find(f => f.key === field)
    if (!fieldDef || !fieldDef.validation) return { valid: true }

    for (const rule of fieldDef.validation) {
      switch (rule.type) {
        case 'required':
          if (!value || (Array.isArray(value) && value.length === 0)) {
            return { valid: false, message: rule.message }
          }
          break
        case 'min':
          if (typeof value === 'string' && value.length < rule.value) {
            return { valid: false, message: rule.message }
          }
          break
        case 'max':
          if (typeof value === 'string' && value.length > rule.value) {
            return { valid: false, message: rule.message }
          }
          break
        case 'email':
          if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return { valid: false, message: rule.message }
          }
          break
        case 'pattern':
          if (value && !new RegExp(rule.value).test(value)) {
            return { valid: false, message: rule.message }
          }
          break
      }
    }

    return { valid: true }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    for (const field of config.fields) {
      if (field.required && !formData.value[field.key]) {
        errors[field.key] = `${field.label}是必填项`
        continue
      }

      const validation = validateField(field.key, formData.value[field.key])
      if (!validation.valid) {
        errors[field.key] = validation.message || ''
      }
    }

    return Object.keys(errors).length === 0 ? { valid: true } : { valid: false, errors }
  }

  return {
    // 状态
    state,
    formData,
    formMode,
    formVisible,
    currentStep,

    // 计算属性
    filteredItems,
    paginatedItems,

    // CRUD 操作
    loadItems,
    createItem,
    updateItem,
    deleteItem,
    batchDelete,

    // 表单操作
    openCreateForm,
    openEditForm,
    closeForm,
    submitForm,

    // 选择操作
    toggleSelection,
    selectAll,

    // 过滤和搜索
    setFilters,
    setSearch,
    setSorting,
    setPage,
    setViewMode,

    // 验证
    validateField,
    validateForm
  }
}