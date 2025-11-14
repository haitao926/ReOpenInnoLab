<template>
  <div class="classroom-monitoring">
    <div class="page-header">
      <el-row :gutter="16" justify="space-between">
        <el-col :span="8">
          <el-input
            v-model="searchQuery"
            placeholder="搜索课堂..."
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="statusFilter" placeholder="课堂状态" clearable @change="handleFilter">
            <el-option label="全部" value="" />
            <el-option label="进行中" value="active" />
            <el-option label="已结束" value="ended" />
            <el-option label="未开始" value="scheduled" />
          </el-select>
        </el-col>
        <el-col :span="12" style="text-align: right;">
          <el-button type="primary" @click="refreshData">
            <el-icon><Refresh /></el-icon>
            刷新数据
          </el-button>
        </el-col>
      </el-row>
    </div>

    <el-row :gutter="24" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ stats.active }}</div>
            <div class="stat-label">进行中的课堂</div>
          </div>
          <el-icon class="stat-icon active"><Monitor /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ stats.totalStudents }}</div>
            <div class="stat-label">在线学生</div>
          </div>
          <el-icon class="stat-icon students"><User /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ stats.today }}</div>
            <div class="stat-label">今日课堂</div>
          </div>
          <el-icon class="stat-icon today"><Calendar /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ stats.avgDuration }}min</div>
            <div class="stat-label">平均时长</div>
          </div>
          <el-icon class="stat-icon duration"><Timer /></el-icon>
        </el-card>
      </el-col>
    </el-row>

    <el-table
      v-loading="loading"
      :data="filteredClassrooms"
      style="width: 100%"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="title" label="课堂名称" min-width="200" />
      <el-table-column prop="instructor" label="讲师" width="120" />
      <el-table-column prop="course" label="课程" width="150" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="participants" label="参与人数" width="100">
        <template #default="{ row }">
          {{ row.participants }}/{{ row.maxParticipants }}
        </template>
      </el-table-column>
      <el-table-column prop="startTime" label="开始时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.startTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="duration" label="时长" width="100">
        <template #default="{ row }">
          {{ formatDuration(row.duration) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="handleMonitor(row)">
            监控
          </el-button>
          <el-button type="info" size="small" @click="handleDetails(row)">
            详情
          </el-button>
          <el-button v-if="row.status === 'active'" type="danger" size="small" @click="handleEnd(row)">
            结束
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Monitor, User, Calendar, Timer } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/date'

interface Classroom {
  id: string
  title: string
  instructor: string
  course: string
  status: 'active' | 'ended' | 'scheduled'
  participants: number
  maxParticipants: number
  startTime: string
  endTime?: string
  duration: number
}

interface Stats {
  active: number
  totalStudents: number
  today: number
  avgDuration: number
}

const searchQuery = ref('')
const statusFilter = ref('')
const loading = ref(false)
const classrooms = ref<Classroom[]>([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const stats = ref<Stats>({
  active: 0,
  totalStudents: 0,
  today: 0,
  avgDuration: 0
})

const filteredClassrooms = computed(() => {
  let filtered = classrooms.value

  if (searchQuery.value) {
    filtered = filtered.filter(classroom =>
      classroom.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      classroom.instructor.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  if (statusFilter.value) {
    filtered = filtered.filter(classroom => classroom.status === statusFilter.value)
  }

  return filtered
})

const getStatusType = (status: string) => {
  switch (status) {
    case 'active': return 'success'
    case 'ended': return 'info'
    case 'scheduled': return 'warning'
    default: return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'active': return '进行中'
    case 'ended': return '已结束'
    case 'scheduled': return '未开始'
    default: return '未知'
  }
}

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

const loadData = async () => {
  loading.value = true
  try {
    // Mock data - replace with actual API call
    classrooms.value = [
      {
        id: '1',
        title: '计算机科学基础 - 第3章',
        instructor: '张老师',
        course: '计算机科学基础',
        status: 'active',
        participants: 45,
        maxParticipants: 50,
        startTime: '2024-01-15T10:00:00Z',
        duration: 65
      },
      {
        id: '2',
        title: '数据结构与算法实践',
        instructor: '李老师',
        course: '数据结构与算法',
        status: 'scheduled',
        participants: 0,
        maxParticipants: 30,
        startTime: '2024-01-15T14:00:00Z',
        duration: 0
      }
    ]
    total.value = classrooms.value.length

    // Update stats
    stats.value = {
      active: classrooms.value.filter(c => c.status === 'active').length,
      totalStudents: classrooms.value.reduce((sum, c) => sum + c.participants, 0),
      today: classrooms.value.length,
      avgDuration: Math.round(classrooms.value.reduce((sum, c) => sum + c.duration, 0) / classrooms.value.length)
    }
  } catch (error) {
    ElMessage.error('加载课堂数据失败')
    console.error('Failed to load classroom data:', error)
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  loadData()
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleFilter = () => {
  currentPage.value = 1
}

const handleMonitor = (classroom: Classroom) => {
  ElMessage.info(`开始监控课堂: ${classroom.title}`)
  // Implement monitoring logic
}

const handleDetails = (classroom: Classroom) => {
  ElMessage.info(`查看课堂详情: ${classroom.title}`)
  // Implement details view
}

const handleEnd = async (classroom: Classroom) => {
  try {
    await ElMessageBox.confirm(
      `确定要结束课堂 "${classroom.title}" 吗？`,
      '结束确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    // Mock end classroom - replace with actual API call
    classroom.status = 'ended'
    classroom.endTime = new Date().toISOString()

    ElMessage.success('课堂已结束')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('结束课堂失败')
    }
  }
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  loadData()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  loadData()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.classroom-monitoring {
  .page-header {
    margin-bottom: 24px;
  }

  .stats-row {
    margin-bottom: 24px;

    .stat-card {
      position: relative;
      overflow: hidden;

      .stat-content {
        position: relative;
        z-index: 2;

        .stat-number {
          font-size: 32px;
          font-weight: bold;
          color: #303133;
          line-height: 1;
        }

        .stat-label {
          font-size: 14px;
          color: #909399;
          margin-top: 8px;
        }
      }

      .stat-icon {
        position: absolute;
        right: 16px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 48px;
        opacity: 0.1;

        &.active { color: #67c23a; }
        &.students { color: #409eff; }
        &.today { color: #e6a23c; }
        &.duration { color: #f56c6c; }
      }
    }
  }

  .pagination {
    margin-top: 24px;
    text-align: right;
  }
}
</style>