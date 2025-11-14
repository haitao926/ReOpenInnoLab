<template>
  <el-dialog
    :model-value="modelValue"
    :title="isEdit ? '编辑租户' : '创建租户'"
    width="800px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
      @submit.prevent="handleSubmit"
    >
      <!-- 基本信息 -->
      <div class="form-section">
        <h3 class="section-title">基本信息</h3>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="租户代码" prop="code">
              <el-input
                v-model="formData.code"
                placeholder="请输入租户代码"
                :disabled="isEdit"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="租户名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入租户名称" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="显示名称">
              <el-input v-model="formData.displayName" placeholder="可选，用于界面显示" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属行业">
              <el-select v-model="formData.industry" placeholder="请选择行业" filterable>
                <el-option
                  v-for="industry in industryOptions"
                  :key="industry"
                  :label="industry"
                  :value="industry"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="描述信息">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入租户描述"
          />
        </el-form-item>
      </div>

      <!-- 联系信息 -->
      <div class="form-section">
        <h3 class="section-title">联系信息</h3>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系邮箱" prop="contactEmail">
              <el-input v-model="formData.contactEmail" placeholder="请输入联系邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系人">
              <el-input v-model="formData.contactPerson" placeholder="请输入联系人姓名" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input v-model="formData.contactPhone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="员工数量">
              <el-input-number
                v-model="formData.employeeCount"
                :min="1"
                :max="999999"
                placeholder="员工数量"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="详细地址">
          <el-input v-model="formData.address" placeholder="请输入详细地址" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="国家/地区">
              <el-select v-model="formData.country" placeholder="请选择国家" filterable>
                <el-option
                  v-for="country in countryOptions"
                  :key="country"
                  :label="country"
                  :value="country"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="域名">
              <el-input v-model="formData.domain" placeholder="example.com" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 套餐配置 -->
      <div class="form-section">
        <h3 class="section-title">套餐配置</h3>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="套餐类型" prop="plan">
              <el-select v-model="formData.plan" placeholder="请选择套餐" @change="handlePlanChange">
                <el-option
                  v-for="plan in planOptions"
                  :key="plan.value"
                  :label="plan.label"
                  :value="plan.value"
                >
                  <div>
                    <div class="font-medium">{{ plan.label }}</div>
                    <div class="text-xs text-gray-500">{{ plan.description }}</div>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="!isEdit">
            <el-form-item label="试用期限">
              <el-date-picker
                v-model="formData.trialEndsAt"
                type="date"
                placeholder="选择试用结束日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="月费价格">
          <el-input-number
            v-model="formData.monthlyPrice"
            :min="0"
            :precision="2"
            placeholder="0.00"
            style="width: 200px"
          />
          <span class="ml-2 text-gray-500">元/月</span>
        </el-form-item>
      </div>

      <!-- 品牌配置 -->
      <div class="form-section">
        <h3 class="section-title">品牌配置</h3>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Logo URL">
              <el-input v-model="formData.logo" placeholder="请输入Logo图片URL" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主色调">
              <el-color-picker v-model="formData.primaryColor" />
              <span class="ml-2 text-gray-500">{{ formData.primaryColor }}</span>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="辅助色调">
          <el-color-picker v-model="formData.secondaryColor" />
          <span class="ml-2 text-gray-500">{{ formData.secondaryColor }}</span>
        </el-form-item>
      </div>

      <!-- 功能配置 -->
      <div class="form-section">
        <h3 class="section-title">功能配置</h3>
        <el-form-item label="功能开关">
          <div class="feature-grid">
            <el-checkbox
              v-for="feature in featureOptions"
              :key="feature.key"
              v-model="formData.features[feature.key]"
              :label="feature.label"
            >
              {{ feature.label }}
            </el-checkbox>
          </div>
        </el-form-item>
      </div>

      <!-- 配额设置 -->
      <div class="form-section">
        <h3 class="section-title">配额设置</h3>
        <div class="quota-grid">
          <div v-for="quota in quotaOptions" :key="quota.key" class="quota-item">
            <el-form-item :label="quota.label">
              <el-input-number
                v-model="formData.quotas[quota.key]"
                :min="quota.min"
                :max="quota.max"
                :placeholder="quota.placeholder"
                style="width: 100%"
              />
              <span class="ml-2 text-gray-500 text-sm">{{ quota.unit }}</span>
            </el-form-item>
          </div>
        </div>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="$emit('update:modelValue', false)">取消</el-button>
        <el-button type="primary" :loading="isSubmitting" @click="handleSubmit">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { tenantApi } from '@/api/tenant'
import type { Tenant, CreateTenantRequest, UpdateTenantRequest, TenantPlan } from '@/types/tenant'

interface Props {
  modelValue: boolean
  tenant?: Tenant | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const formRef = ref<FormInstance>()
const isSubmitting = ref(false)

const isEdit = computed(() => !!props.tenant)

// Form data
const formData = reactive<CreateTenantRequest>({
  code: '',
  name: '',
  displayName: '',
  description: '',
  domain: '',
  logo: '',
  primaryColor: '#4F46E5',
  secondaryColor: '#10B981',
  contactEmail: '',
  contactPhone: '',
  contactPerson: '',
  address: '',
  country: '',
  industry: '',
  employeeCount: 0,
  plan: 'basic',
  trialEndsAt: undefined,
  monthlyPrice: 0,
  features: {},
  quotas: {},
  metadata: {}
})

// Options
const industryOptions = [
  '教育', '科技', '金融', '医疗', '制造', '零售', '政府', '非营利组织', '其他'
]

const countryOptions = [
  '中国', '美国', '日本', '韩国', '新加坡', '英国', '德国', '法国', '加拿大', '澳大利亚'
]

const planOptions = [
  { value: 'starter', label: '入门版', description: '适合小型团队，包含基础功能' },
  { value: 'basic', label: '基础版', description: '适合成长型团队，包含AI助手和分析功能' },
  { value: 'pro', label: '专业版', description: '适合中大型企业，包含完整功能套件' },
  { value: 'enterprise', label: '企业版', description: '适合大型企业，无限制使用所有功能' },
  { value: 'custom', label: '定制版', description: '根据需求定制的专属方案' }
]

const featureOptions = [
  { key: 'ai_assistant', label: 'AI助手' },
  { key: 'virtual_lab', label: '虚拟实验' },
  { key: 'analytics', label: '数据分析' },
  { key: 'sso_integration', label: 'SSO集成' },
  { key: 'api_access', label: 'API访问' },
  { key: 'custom_branding', label: '自定义品牌' },
  { key: 'priority_support', label: '优先支持' },
  { key: 'data_export', label: '数据导出' }
]

const quotaOptions = [
  { key: 'max_users', label: '最大用户数', min: 1, max: 10000, unit: '人', placeholder: '用户数量限制' },
  { key: 'max_courses', label: '最大课程数', min: 1, max: 1000, unit: '门', placeholder: '课程数量限制' },
  { key: 'max_students', label: '最大学生数', min: 1, max: 50000, unit: '人', placeholder: '学生数量限制' },
  { key: 'storage_gb', label: '存储空间', min: 1, max: 1000, unit: 'GB', placeholder: '存储空间限制' },
  { key: 'api_calls_per_month', label: 'API调用', min: 1000, max: 1000000, unit: '次/月', placeholder: '月API调用限制' },
  { key: 'ai_tokens_per_month', label: 'AI Token', min: 10000, max: 10000000, unit: '个/月', placeholder: '月AI Token限制' }
]

// Form rules
const rules: FormRules = {
  code: [
    { required: true, message: '请输入租户代码', trigger: 'blur' },
    { min: 2, max: 50, message: '租户代码长度为2-50个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]+$/, message: '租户代码只能包含字母、数字、下划线和连字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入租户名称', trigger: 'blur' },
    { min: 2, max: 255, message: '租户名称长度为2-255个字符', trigger: 'blur' }
  ],
  contactEmail: [
    { required: true, message: '请输入联系邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  plan: [
    { required: true, message: '请选择套餐类型', trigger: 'change' }
  ]
}

// Watch for tenant prop changes
watch(() => props.tenant, (tenant) => {
  if (tenant) {
    // Edit mode - populate form with tenant data
    Object.assign(formData, {
      ...tenant,
      trialEndsAt: tenant.trialEndsAt ? new Date(tenant.trialEndsAt) : undefined
    })
  } else {
    // Create mode - reset form
    resetForm()
  }
}, { immediate: true })

// Watch for model value changes
watch(() => props.modelValue, (visible) => {
  if (!visible) {
    formRef.value?.resetFields()
  }
})

// Methods
const resetForm = () => {
  Object.assign(formData, {
    code: '',
    name: '',
    displayName: '',
    description: '',
    domain: '',
    logo: '',
    primaryColor: '#4F46E5',
    secondaryColor: '#10B981',
    contactEmail: '',
    contactPhone: '',
    contactPerson: '',
    address: '',
    country: '',
    industry: '',
    employeeCount: 0,
    plan: 'basic',
    trialEndsAt: undefined,
    monthlyPrice: 0,
    features: {},
    quotas: {},
    metadata: {}
  })
}

const handlePlanChange = (plan: TenantPlan) => {
  // Set default quotas based on plan
  const defaultQuotas = getDefaultQuotas(plan)
  Object.assign(formData.quotas, defaultQuotas)

  // Set default features based on plan
  const defaultFeatures = getDefaultFeatures(plan)
  Object.assign(formData.features, defaultFeatures)
}

const getDefaultQuotas = (plan: TenantPlan): Record<string, number> => {
  const quotas: Record<string, number> = {}

  switch (plan) {
    case 'starter':
      return {
        max_users: 25,
        max_courses: 10,
        max_students: 100,
        storage_gb: 10,
        api_calls_per_month: 5000,
        ai_tokens_per_month: 50000
      }
    case 'basic':
      return {
        max_users: 100,
        max_courses: 50,
        max_students: 1000,
        storage_gb: 50,
        api_calls_per_month: 25000,
        ai_tokens_per_month: 250000
      }
    case 'pro':
      return {
        max_users: 500,
        max_courses: 200,
        max_students: 5000,
        storage_gb: 200,
        api_calls_per_month: 100000,
        ai_tokens_per_month: 1000000
      }
    case 'enterprise':
      return {
        max_users: -1,
        max_courses: -1,
        max_students: -1,
        storage_gb: 1000,
        api_calls_per_month: -1,
        ai_tokens_per_month: -1
      }
    default:
      return {}
  }
}

const getDefaultFeatures = (plan: TenantPlan): Record<string, boolean> => {
  const baseFeatures = {
    data_export: true,
    user_management: true,
    course_management: true
  }

  switch (plan) {
    case 'starter':
      return baseFeatures
    case 'basic':
      return {
        ...baseFeatures,
        ai_assistant: true,
        analytics: true,
        api_access: true
      }
    case 'pro':
      return {
        ...baseFeatures,
        ai_assistant: true,
        virtual_lab: true,
        analytics: true,
        sso_integration: true,
        api_access: true,
        custom_branding: true
      }
    case 'enterprise':
    case 'custom':
      return {
        ...baseFeatures,
        ai_assistant: true,
        virtual_lab: true,
        analytics: true,
        sso_integration: true,
        api_access: true,
        custom_branding: true,
        priority_support: true
      }
    default:
      return baseFeatures
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    const valid = await formRef.value.validate()
    if (!valid) return

    isSubmitting.value = true

    const data = {
      ...formData,
      trialEndsAt: formData.trialEndsAt?.toISOString()
    }

    if (isEdit.value && props.tenant) {
      await tenantApi.updateTenant(props.tenant.id, data as UpdateTenantRequest)
      ElMessage.success('租户更新成功')
    } else {
      await tenantApi.createTenant(data)
      ElMessage.success('租户创建成功')
    }

    emit('success')
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.form-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.quota-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.quota-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background-color: #f9fafb;
}

:deep(.el-checkbox) {
  margin-right: 16px;
  margin-bottom: 8px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

.dialog-footer {
  text-align: right;
}
</style>