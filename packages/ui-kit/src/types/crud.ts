// 通用 CRUD 类型定义
export interface FieldDefinition {
  key: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'select' | 'date' | 'checkbox' | 'image' | 'file' | 'rich-editor'
  required?: boolean
  placeholder?: string
  options?: Array<{ label: string; value: any }>
  validation?: ValidationRule[]
  defaultValue?: any
  component?: string // 自定义组件名
  props?: Record<string, any> // 传递给组件的属性
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'email' | 'pattern' | 'custom'
  value?: any
  message: string
  trigger?: 'blur' | 'change'
}

export interface ActionDefinition {
  key: string
  label: string
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  icon?: string
  handler?: (item: any, action: ActionDefinition) => void | Promise<void>
  permission?: string
  disabled?: boolean | ((item: any) => boolean)
  visible?: boolean | ((item: any) => boolean)
}

export interface FilterDefinition {
  key: string
  label: string
  type: 'select' | 'date-range' | 'text' | 'checkbox-group'
  options?: Array<{ label: string; value: any }>
  defaultValue?: any
  props?: Record<string, any>
}

export interface ColumnDefinition {
  key: string
  label: string
  type?: 'text' | 'image' | 'date' | 'status' | 'actions'
  sortable?: boolean
  width?: string | number
  fixed?: 'left' | 'right'
  formatter?: (value: any, row: any) => string
  component?: string
  props?: Record<string, any>
}

export interface CrudConfig {
  // 基本配置
  resource: string // 资源名称，如 'course', 'lab'
  title?: string // 页面标题
  api: {
    list: string
    create: string
    update: string
    delete: string
    batch?: {
      delete: string
      update: string
    }
  }

  // 字段定义
  fields: FieldDefinition[]

  // 列表配置
  list?: {
    columns?: ColumnDefinition[]
    filters?: FilterDefinition[]
    viewModes?: ('table' | 'grid' | 'timeline')[]
    defaultViewMode?: string
    searchable?: boolean
    searchPlaceholder?: string
    sortable?: boolean
    pagination?: {
      enabled: boolean
      defaultPageSize: number
      pageSizes: number[]
    }
    actions?: ActionDefinition[]
    rowActions?: ActionDefinition[]
    batchActions?: ActionDefinition[]
  }

  // 表单配置
  form?: {
    layout?: 'horizontal' | 'vertical' | 'inline'
    labelWidth?: string
    colon?: boolean
    disabled?: boolean
    steps?: FormStep[] // 用于多步骤表单
  }

  // 权限
  permissions?: {
    create?: string
    read?: string
    update?: string
    delete?: string
    [key: string]: string | undefined
  }

  // 自定义
  hooks?: {
    beforeCreate?: (data: any) => any | Promise<any>
    afterCreate?: (result: any) => void | Promise<void>
    beforeUpdate?: (id: string, data: any) => any | Promise<any>
    afterUpdate?: (result: any) => void | Promise<void>
    beforeDelete?: (id: string | string[]) => void | Promise<void>
    afterDelete?: () => void | Promise<void>
  }
}

export interface FormStep {
  title: string
  description?: string
  fields: string[] // field keys
  validation?: (data: any) => boolean | Promise<boolean>
}

export interface CrudItem {
  id: string | number
  [key: string]: any
}

export interface ListResponse<T = any> {
  items: T[]
  total: number
  page: number
  pageSize: number
  [key: string]: any
}

export interface CrudState<T = any> {
  items: T[]
  loading: boolean
  total: number
  page: number
  pageSize: number
  filters: Record<string, any>
  searchKeyword: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  selectedItems: T[]
  viewMode: 'table' | 'grid' | 'timeline'
}

// CRUD 组件 Props
export interface CrudListProps {
  config: CrudConfig
  data?: CrudItem[]
  loading?: boolean
  height?: string | number
  showHeader?: boolean
  showFooter?: boolean
}

export interface CrudFormProps {
  config: CrudConfig
  mode: 'create' | 'edit'
  data?: CrudItem
  visible?: boolean
  loading?: boolean
  step?: number
}

// CRUD 事件
export interface CrudEvents {
  'create': (data: CrudItem) => void
  'update': (id: string | number, data: Partial<CrudItem>) => void
  'delete': (id: string | number) => void
  'batch-delete': (ids: (string | number)[]) => void
  'view': (item: CrudItem) => void
  'edit': (item: CrudItem) => void
  'select': (items: CrudItem[]) => void
  'filter-change': (filters: Record<string, any>) => void
  'search': (keyword: string) => void
  'sort-change': (sortBy: string, sortOrder: 'asc' | 'desc') => void
  'page-change': (page: number, pageSize: number) => void
}