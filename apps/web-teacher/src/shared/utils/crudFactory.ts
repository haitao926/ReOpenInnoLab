import type { CrudConfig } from '@/shared/types/crud'
import { ElMessage, ElMessageBox } from 'element-plus'

export interface CrudFactoryOptions {
  resource: string
  title?: string
  fields: Array<{
    key: string
    label: string
    type: string
    required?: boolean
    options?: Array<{ label: string; value: any }>
    [key: string]: any
  }>
  apiEndpoints?: {
    list?: string
    create?: string
    update?: string
    delete?: string
  }
  customActions?: Array<{
    key: string
    label: string
    type?: string
    icon?: string
    handler: (item: any) => void
  }>
}

/**
 * 创建通用CRUD配置
 */
export function createCrudConfig(options: CrudFactoryOptions): CrudConfig {
  const { resource, title, fields, apiEndpoints, customActions } = options

  // 生成列定义
  const columns = fields
    .filter(field => !field.hideInList)
    .map(field => ({
      key: field.key,
      label: field.label,
      type: field.listType || 'text',
      sortable: field.sortable !== false,
      width: field.width,
      formatter: field.formatter,
      component: field.component,
      props: field.props
    }))

  // 添加操作列
  columns.push({
    key: 'actions',
    label: '操作',
    type: 'actions',
    width: 150,
    fixed: 'right'
  })

  // 生成默认操作
  const defaultActions = [
    {
      key: 'create',
      label: `新建${title}`,
      type: 'primary' as const,
      icon: 'Plus',
      handler: () => {
        // 触发创建表单
      }
    }
  ]

  const defaultRowActions = [
    {
      key: 'view',
      label: '查看',
      type: 'info' as const,
      handler: (item: any) => {
        // 触发查看
      }
    },
    {
      key: 'edit',
      label: '编辑',
      type: 'primary' as const,
      handler: (item: any) => {
        // 触发编辑
      }
    },
    {
      key: 'delete',
      label: '删除',
      type: 'danger' as const,
      handler: async (item: any) => {
        try {
          await ElMessageBox.confirm(
            `确定要删除 "${item.name || item.title}" 吗？`,
            '确认删除',
            {
              confirmButtonText: '删除',
              cancelButtonText: '取消',
              type: 'warning'
            }
          )
          // 执行删除
          ElMessage.success('删除成功')
        } catch {
          // 用户取消
        }
      }
    }
  ]

  const defaultBatchActions = [
    {
      key: 'delete',
      label: '批量删除',
      type: 'danger' as const,
      handler: async (items: any[]) => {
        try {
          await ElMessageBox.confirm(
            `确定要删除选中的 ${items.length} 项吗？`,
            '批量删除',
            {
              confirmButtonText: '删除',
              cancelButtonText: '取消',
              type: 'warning'
            }
          )
          // 执行批量删除
          ElMessage.success(`成功删除 ${items.length} 项`)
        } catch {
          // 用户取消
        }
      }
    }
  ]

  return {
    resource,
    title,
    api: {
      list: apiEndpoints?.list || `/api/${resource}`,
      create: apiEndpoints?.create || `/api/${resource}`,
      update: apiEndpoints?.update || `/api/${resource}/:id`,
      delete: apiEndpoints?.delete || `/api/${resource}/:id`,
      batch: {
        delete: `/api/${resource}/batch`,
        update: `/api/${resource}/batch`
      }
    },
    fields,
    list: {
      columns,
      searchable: true,
      searchPlaceholder: `搜索${title}...`,
      viewModes: ['table', 'grid'],
      defaultViewMode: 'table',
      sortable: true,
      pagination: {
        enabled: true,
        defaultPageSize: 20,
        pageSizes: [10, 20, 50, 100]
      },
      actions: [...defaultActions, ...(customActions || [])],
      rowActions: defaultRowActions,
      batchActions: defaultBatchActions,
      filters: generateFilters(fields)
    },
    form: {
      layout: 'vertical',
      labelWidth: '100px'
    },
    hooks: {
      beforeCreate: (data) => {
        console.log(`Creating ${resource}:`, data)
        return data
      },
      afterCreate: (result) => {
        ElMessage.success(`${title}创建成功`)
        console.log(`${resource} created:`, result)
      },
      beforeUpdate: (id, data) => {
        console.log(`Updating ${resource} ${id}:`, data)
        return data
      },
      afterUpdate: (result) => {
        ElMessage.success(`${title}更新成功`)
        console.log(`${resource} updated:`, result)
      },
      afterDelete: () => {
        ElMessage.success(`${title}删除成功`)
      }
    }
  }
}

/**
 * 生成过滤器配置
 */
function generateFilters(fields: CrudFactoryOptions['fields']) {
  return fields
    .filter(field => field.filterable)
    .map(field => {
      switch (field.type) {
        case 'select':
          return {
            key: field.key,
            label: field.label,
            type: 'select' as const,
            options: field.options || []
          }
        case 'date':
          return {
            key: field.key,
            label: field.label,
            type: 'date-range' as const
          }
        case 'checkbox':
          return {
            key: field.key,
            label: field.label,
            type: 'checkbox-group' as const,
            options: field.options || []
          }
        default:
          return {
            key: field.key,
            label: field.label,
            type: 'text' as const
          }
      }
    })
}

/**
 * 预定义的配置生成器
 */
export const CrudConfigs = {
  // 课程配置
  Course: (overrides?: Partial<CrudFactoryOptions>): CrudConfig => {
    return createCrudConfig({
      resource: 'courses',
      title: '课程',
      fields: [
        {
          key: 'title',
          label: '课程名称',
          type: 'text',
          required: true,
          sortable: true
        },
        {
          key: 'description',
          label: '课程描述',
          type: 'textarea',
          width: 300
        },
        {
          key: 'subject',
          label: '学科',
          type: 'select',
          filterable: true,
          options: [
            { label: '语文', value: 'chinese' },
            { label: '数学', value: 'math' },
            { label: '英语', value: 'english' },
            { label: '物理', value: 'physics' },
            { label: '化学', value: 'chemistry' },
            { label: '生物', value: 'biology' }
          ]
        },
        {
          key: 'grade',
          label: '年级',
          type: 'select',
          filterable: true,
          options: [
            { label: '一年级', value: 1 },
            { label: '二年级', value: 2 },
            { label: '三年级', value: 3 },
            { label: '四年级', value: 4 },
            { label: '五年级', value: 5 },
            { label: '六年级', value: 6 }
          ]
        },
        {
          key: 'status',
          label: '状态',
          type: 'select',
          filterable: true,
          defaultValue: 'draft',
          options: [
            { label: '草稿', value: 'draft' },
            { label: '已发布', value: 'published' },
            { label: '已下架', value: 'unpublished' }
          ],
          listType: 'status'
        },
        {
          key: 'createdAt',
          label: '创建时间',
          type: 'date',
          sortable: true,
          listType: 'date'
        },
        {
          key: 'cover',
          label: '封面',
          type: 'image',
          hideInList: true
        }
      ],
      ...overrides
    })
  },

  // 实验配置
  Lab: (overrides?: Partial<CrudFactoryOptions>): CrudConfig => {
    return createCrudConfig({
      resource: 'labs',
      title: '实验',
      fields: [
        {
          key: 'name',
          label: '实验名称',
          type: 'text',
          required: true,
          sortable: true
        },
        {
          key: 'description',
          label: '实验描述',
          type: 'textarea'
        },
        {
          key: 'type',
          label: '实验类型',
          type: 'select',
          filterable: true,
          options: [
            { label: '物理实验', value: 'physics' },
            { label: '化学实验', value: 'chemistry' },
            { label: '生物实验', value: 'biology' },
            { label: '虚拟实验', value: 'virtual' }
          ]
        },
        {
          key: 'difficulty',
          label: '难度',
          type: 'select',
          filterable: true,
          options: [
            { label: '简单', value: 'easy' },
            { label: '中等', value: 'medium' },
            { label: '困难', value: 'hard' }
          ]
        },
        {
          key: 'duration',
          label: '预计时长',
          type: 'number',
          props: {
            min: 0,
            max: 999,
            suffix: '分钟'
          }
        },
        {
          key: 'status',
          label: '状态',
          type: 'select',
          filterable: true,
          defaultValue: 'draft',
          options: [
            { label: '草稿', value: 'draft' },
            { label: '已发布', value: 'published' }
          ],
          listType: 'status'
        }
      ],
      ...overrides
    })
  },

  // 班级配置
  Class: (overrides?: Partial<CrudFactoryOptions>): CrudConfig => {
    return createCrudConfig({
      resource: 'classes',
      title: '班级',
      fields: [
        {
          key: 'name',
          label: '班级名称',
          type: 'text',
          required: true,
          sortable: true
        },
        {
          key: 'grade',
          label: '年级',
          type: 'select',
          filterable: true,
          options: [
            { label: '一年级', value: 1 },
            { label: '二年级', value: 2 },
            { label: '三年级', value: 3 },
            { label: '四年级', value: 4 },
            { label: '五年级', value: 5 },
            { label: '六年级', value: 6 }
          ]
        },
        {
          key: 'teacher',
          label: '班主任',
          type: 'text'
        },
        {
          key: 'studentCount',
          label: '学生人数',
          type: 'number',
          sortable: true
        },
        {
          key: 'status',
          label: '状态',
          type: 'select',
          filterable: true,
          defaultValue: 'active',
          options: [
            { label: '活跃', value: 'active' },
            { label: '休眠', value: 'inactive' },
            { label: '已毕业', value: 'graduated' }
          ],
          listType: 'status'
        }
      ],
      ...overrides
    })
  }
}

/**
 * 创建CRUD页面组件
 */
export function createCrudPage(config: CrudConfig) {
  return defineComponent({
    name: `${config.resource}CrudPage`,
    setup() {
      const {
        state,
        filteredItems,
        paginatedItems,
        loadItems,
        openCreateForm,
        openEditForm,
        deleteItem,
        batchDelete,
        setFilters,
        setSearch,
        setSorting,
        setPage,
        setViewMode
      } = useCrudOperations(config)

      // 加载数据
      loadItems()

      // 处理动作
      const handleAction = (action: any, item?: any) => {
        switch (action.key) {
          case 'create':
            openCreateForm()
            break
          case 'edit':
            if (item) openEditForm(item)
            break
          case 'view':
            // 跳转到详情页
            router.push(`/${config.resource}/${item?.id}`)
            break
          case 'delete':
            if (item) deleteItem(item.id)
            break
          default:
            if (action.handler) action.handler(item)
        }
      }

      const handleBatchAction = async (action: any, items: any[]) => {
        if (action.key === 'delete') {
          const ids = items.map(item => item.id)
          await batchDelete(ids)
        }
      }

      return () => h(CrudList, {
        config,
        items: paginatedItems.value,
        loading: state.loading,
        total: state.total,
        currentPage: state.page,
        pageSize: state.pageSize,
        selectedItems: state.selectedItems,
        filters: state.filters,
        searchKeyword: state.searchKeyword,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        viewMode: state.viewMode,
        onAction: handleAction,
        onBatchAction: handleBatchAction,
        onFilterChange: setFilters,
        onSearch: setSearch,
        onSortChange: setSorting,
        onPageChange: setPage,
        onViewModeChange: setViewMode
      })
    }
  })
}