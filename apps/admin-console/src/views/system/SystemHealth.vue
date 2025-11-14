<template>
  <div class="system-health">
    <div class="page-header">
      <el-row :gutter="16" justify="space-between">
        <el-col :span="12">
          <h2>系统健康监控</h2>
        </el-col>
        <el-col :span="12" style="text-align: right;">
          <el-button type="primary" @click="refreshData">
            <el-icon><Refresh /></el-icon>
            刷新数据
          </el-button>
        </el-col>
      </el-row>
    </div>

    <el-row :gutter="24" class="health-overview">
      <el-col :span="6">
        <el-card class="health-card">
          <div class="health-indicator">
            <el-progress
              type="circle"
              :percentage="systemHealth.cpu"
              :status="getHealthStatus(systemHealth.cpu)"
              :width="120"
            />
            <div class="health-label">CPU使用率</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="health-card">
          <div class="health-indicator">
            <el-progress
              type="circle"
              :percentage="systemHealth.memory"
              :status="getHealthStatus(systemHealth.memory)"
              :width="120"
            />
            <div class="health-label">内存使用率</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="health-card">
          <div class="health-indicator">
            <el-progress
              type="circle"
              :percentage="systemHealth.disk"
              :status="getHealthStatus(systemHealth.disk)"
              :width="120"
            />
            <div class="health-label">磁盘使用率</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="health-card">
          <div class="health-indicator">
            <el-progress
              type="circle"
              :percentage="systemHealth.network"
              :status="getHealthStatus(systemHealth.network)"
              :width="120"
            />
            <div class="health-label">网络延迟</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="24" class="service-status">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>服务状态</span>
          </template>
          <el-table :data="services" style="width: 100%">
            <el-table-column prop="name" label="服务名称" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'healthy' ? 'success' : 'danger'">
                  {{ row.status === 'healthy' ? '正常' : '异常' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="responseTime" label="响应时间" width="120">
              <template #default="{ row }">
                {{ row.responseTime }}ms
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>最近告警</span>
          </template>
          <el-table :data="alerts" style="width: 100%">
            <el-table-column prop="level" label="级别" width="80">
              <template #default="{ row }">
                <el-tag :type="getAlertType(row.level)" size="small">
                  {{ getAlertText(row.level) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="message" label="消息" show-overflow-tooltip />
            <el-table-column prop="time" label="时间" width="120">
              <template #default="{ row }">
                {{ formatTime(row.time) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/date'

interface SystemHealth {
  cpu: number
  memory: number
  disk: number
  network: number
}

interface Service {
  name: string
  status: 'healthy' | 'unhealthy'
  responseTime: number
}

interface Alert {
  level: 'error' | 'warning' | 'info'
  message: string
  time: string
}

const systemHealth = ref<SystemHealth>({
  cpu: 45,
  memory: 68,
  disk: 72,
  network: 15
})

const services = ref<Service[]>([
  { name: 'API网关', status: 'healthy', responseTime: 45 },
  { name: '认证服务', status: 'healthy', responseTime: 32 },
  { name: '数据库', status: 'healthy', responseTime: 12 },
  { name: 'Redis缓存', status: 'healthy', responseTime: 8 },
  { name: 'AI服务', status: 'unhealthy', responseTime: 5000 }
])

const alerts = ref<Alert[]>([
  { level: 'error', message: 'AI服务响应超时', time: '2024-01-15T10:30:00Z' },
  { level: 'warning', message: 'CPU使用率超过80%', time: '2024-01-15T10:15:00Z' },
  { level: 'info', message: '系统自动备份完成', time: '2024-01-15T09:00:00Z' }
])

const getHealthStatus = (percentage: number) => {
  if (percentage >= 90) return 'exception'
  if (percentage >= 70) return 'warning'
  return 'success'
}

const getAlertType = (level: string) => {
  switch (level) {
    case 'error': return 'danger'
    case 'warning': return 'warning'
    case 'info': return 'info'
    default: return 'info'
  }
}

const getAlertText = (level: string) => {
  switch (level) {
    case 'error': return '错误'
    case 'warning': return '警告'
    case 'info': return '信息'
    default: return '未知'
  }
}

const formatTime = (timestamp: string) => {
  return formatDate(timestamp, 'HH:mm')
}

const refreshData = async () => {
  try {
    // Mock data refresh - replace with actual API calls
    systemHealth.value = {
      cpu: Math.floor(Math.random() * 100),
      memory: Math.floor(Math.random() * 100),
      disk: Math.floor(Math.random() * 100),
      network: Math.floor(Math.random() * 100)
    }

    ElMessage.success('数据刷新成功')
  } catch (error) {
    ElMessage.error('数据刷新失败')
    console.error('Failed to refresh system health data:', error)
  }
}

onMounted(() => {
  refreshData()
})
</script>

<style scoped lang="scss">
.system-health {
  .page-header {
    margin-bottom: 24px;
  }

  .health-overview {
    margin-bottom: 24px;

    .health-card {
      .health-indicator {
        text-align: center;

        .health-label {
          margin-top: 16px;
          font-weight: 500;
          color: #303133;
        }
      }
    }
  }

  .service-status {
    .el-card {
      height: 400px;
    }
  }
}
</style>