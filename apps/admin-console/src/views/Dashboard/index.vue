<template>
  <div class="dashboard">
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">
        {{ t('dashboard.title') }}
      </h1>
      <p class="text-gray-600">欢迎回来，{{ user?.name }}！</p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <el-card class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">{{ t('dashboard.totalTenants') }}</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.totalTenants }}</p>
            <p class="text-xs text-green-600 mt-1">+12% 本月</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <el-icon size="24" color="#3b82f6"><OfficeBuilding /></el-icon>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">{{ t('dashboard.activeUsers') }}</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.activeUsers }}</p>
            <p class="text-xs text-green-600 mt-1">+8% 本月</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <el-icon size="24" color="#10b981"><User /></el-icon>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">{{ t('dashboard.totalCourses') }}</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.totalCourses }}</p>
            <p class="text-xs text-orange-600 mt-1">+3% 本月</p>
          </div>
          <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <el-icon size="24" color="#8b5cf6"><Reading /></el-icon>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">{{ t('dashboard.systemLoad') }}</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.systemLoad }}%</p>
            <p class="text-xs text-gray-600 mt-1">正常</p>
          </div>
          <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <el-icon size="24" color="#f59e0b"><DataAnalysis /></el-icon>
          </div>
        </div>
      </el-card>
    </div>

    <!-- Charts and Tables -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- User Growth Chart -->
      <el-card>
        <template #header>
          <h3 class="text-lg font-semibold">用户增长趋势</h3>
        </template>
        <div class="h-64">
          <v-chart class="w-full h-full" :option="userGrowthChartOption" />
        </div>
      </el-card>

      <!-- System Status -->
      <el-card>
        <template #header>
          <h3 class="text-lg font-semibold">系统状态</h3>
        </template>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">API 响应时间</span>
            <span class="text-sm font-medium">120ms</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">数据库连接</span>
            <el-tag type="success" size="small">正常</el-tag>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">缓存服务</span>
            <el-tag type="success" size="small">正常</el-tag>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">消息队列</span>
            <el-tag type="warning" size="small">延迟</el-tag>
          </div>
        </div>
      </el-card>
    </div>

    <!-- Recent Activities -->
    <el-card>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">最近活动</h3>
          <el-button text type="primary">查看全部</el-button>
        </div>
      </template>

      <el-table :data="recentActivities" style="width: 100%">
        <el-table-column prop="user" label="用户" width="200">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <el-avatar :size="32">{{ row.user.charAt(0) }}</el-avatar>
              <span>{{ row.user }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="action" label="操作" />
        <el-table-column prop="target" label="目标对象" />
        <el-table-column prop="timestamp" label="时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.timestamp) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">
              {{ row.status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import {
  OfficeBuilding,
  User,
  Reading,
  DataAnalysis
} from '@element-plus/icons-vue'
import { format } from 'date-fns'

// Register ECharts components
use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const { t } = useI18n()
const authStore = useAuthStore()

// State
const stats = ref({
  totalTenants: 156,
  activeUsers: 2847,
  totalCourses: 1234,
  systemLoad: 68
})

const recentActivities = ref([
  {
    user: '张三',
    action: '创建租户',
    target: '新公司',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    status: 'success'
  },
  {
    user: '李四',
    action: '更新用户权限',
    target: 'admin@company.com',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    status: 'success'
  },
  {
    user: '王五',
    action: '删除课程',
    target: '旧课程ID',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    status: 'failed'
  }
])

// Computed
const user = computed(() => authStore.user)

// ECharts option
const userGrowthChartOption = ref({
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['新增用户', '活跃用户']
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['1月', '2月', '3月', '4月', '5月', '6月']
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: '新增用户',
      type: 'line',
      stack: 'Total',
      data: [120, 132, 101, 134, 90, 230]
    },
    {
      name: '活跃用户',
      type: 'line',
      stack: 'Total',
      data: [220, 182, 191, 234, 290, 330]
    }
  ]
})

// Methods
const formatTime = (date: Date) => {
  return format(date, 'yyyy-MM-dd HH:mm:ss')
}

const loadDashboardData = async () => {
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    // In real implementation, fetch from API
    // const response = await dashboardApi.getStats()
    // stats.value = response
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

.stat-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

:deep(.el-card__body) {
  padding: 24px;
}

:deep(.el-table) {
  font-size: 14px;
}
</style>