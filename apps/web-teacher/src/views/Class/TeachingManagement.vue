<template>
  <div class="teaching-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1>
          <el-icon><VideoPlay /></el-icon>
          开课管理
        </h1>
        <p>管理课程安排、教学进度和课堂活动</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showScheduleModal = true">
          <el-icon><Plus /></el-icon>
          安排课程
        </el-button>
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 教学统计 -->
    <div class="teaching-stats">
      <div class="stat-card">
        <div class="stat-icon active">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ activeClasses }}</div>
          <div class="stat-label">正在上课</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon scheduled">
          <el-icon><Calendar /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ scheduledClasses }}</div>
          <div class="stat-label">今日安排</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon completed">
          <el-icon><Check /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ completedClasses }}</div>
          <div class="stat-label">已完成课程</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon total">
          <el-icon><DataAnalysis /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ totalStudents }}</div>
          <div class="stat-label">参与学生</div>
        </div>
      </div>
    </div>

    <!-- 标签页 -->
    <el-tabs v-model="activeTab" class="teaching-tabs">
      <!-- 今日课程 -->
      <el-tab-pane label="今日课程" name="today">
        <div class="tab-content">
          <div class="schedule-toolbar">
            <el-row :gutter="16">
              <el-col :span="6">
                <el-select v-model="statusFilter" placeholder="课程状态" clearable>
                  <el-option label="全部" value="" />
                  <el-option label="未开始" value="pending" />
                  <el-option label="进行中" value="active" />
                  <el-option label="已结束" value="completed" />
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-select v-model="classFilter" placeholder="选择班级" clearable>
                  <el-option label="全部班级" value="" />
                  <el-option
                    v-for="cls in classList"
                    :key="cls.id"
                    :label="cls.name"
                    :value="cls.id"
                  />
                </el-select>
              </el-col>
              <el-col :span="8">
                <el-input
                  v-model="searchKeyword"
                  placeholder="搜索课程名称..."
                  :prefix-icon="Search"
                  clearable
                />
              </el-col>
            </el-row>
          </div>

          <div class="schedule-list">
            <div
              v-for="schedule in filteredSchedules"
              :key="schedule.id"
              class="schedule-item"
              :class="getScheduleStatusClass(schedule.status)"
            >
              <div class="schedule-time">
                <div class="time-range">
                  {{ schedule.startTime }} - {{ schedule.endTime }}
                </div>
                <div class="duration">{{ schedule.duration }}分钟</div>
              </div>

              <div class="schedule-content">
                <div class="course-info">
                  <h4>{{ schedule.courseTitle }}</h4>
                  <div class="course-meta">
                    <el-tag :type="getSubjectColor(schedule.subject)" size="small">
                      {{ getSubjectLabel(schedule.subject) }}
                    </el-tag>
                    <span class="class-name">{{ schedule.className }}</span>
                    <span class="teacher-name">{{ schedule.teacherName }}</span>
                  </div>
                  <div class="chapter-info" v-if="schedule.chapter">
                    章节：{{ schedule.chapter }}
                  </div>
                </div>
              </div>

              <div class="schedule-actions">
                <el-button
                  v-if="schedule.status === 'pending'"
                  type="primary"
                  size="small"
                  @click="startClass(schedule)"
                >
                  <el-icon><VideoPlay /></el-icon>
                  开始上课
                </el-button>
                <el-button
                  v-if="schedule.status === 'active'"
                  type="success"
                  size="small"
                  @click="manageClass(schedule)"
                >
                  <el-icon><Monitor /></el-icon>
                  进入课堂
                </el-button>
                <el-button
                  v-if="schedule.status === 'completed'"
                  size="small"
                  @click="viewReport(schedule)"
                >
                  <el-icon><Document /></el-icon>
                  查看报告
                </el-button>
                <el-dropdown @command="(command) => handleScheduleAction(command, schedule)">
                  <el-button size="small" text>
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="edit">
                        <el-icon><Edit /></el-icon>
                        编辑安排
                      </el-dropdown-item>
                      <el-dropdown-item command="copy">
                        <el-icon><CopyDocument /></el-icon>
                        复制安排
                      </el-dropdown-item>
                      <el-dropdown-item command="cancel" divided>
                        <el-icon><Close /></el-icon>
                        取消课程
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 课程安排 -->
      <el-tab-pane label="课程安排" name="schedule">
        <div class="tab-content">
          <div class="schedule-header">
            <div class="week-navigation">
              <el-button @click="previousWeek" :disabled="isLoading">
                <el-icon><ArrowLeft /></el-icon>
              </el-button>
              <span class="week-range">{{ weekRange }}</span>
              <el-button @click="nextWeek" :disabled="isLoading">
                <el-icon><ArrowRight /></el-icon>
              </el-button>
            </div>
            <div class="view-toggle">
              <el-button-group>
                <el-button :type="viewMode === 'week' ? 'primary' : 'default'" @click="viewMode = 'week'">
                  周视图
                </el-button>
                <el-button :type="viewMode === 'month' ? 'primary' : 'default'" @click="viewMode = 'month'">
                  月视图
                </el-button>
              </el-button-group>
            </div>
          </div>

          <!-- 周视图日历 -->
          <div v-if="viewMode === 'week'" class="week-calendar">
            <div class="calendar-header">
              <div class="time-column">时间</div>
              <div
                v-for="day in weekDays"
                :key="day.date"
                class="day-column"
                :class="{ 'today': day.isToday }"
              >
                <div class="day-header">
                  <div class="day-name">{{ day.name }}</div>
                  <div class="day-date">{{ day.date }}</div>
                </div>
              </div>
            </div>
            <div class="calendar-body">
              <div
                v-for="timeSlot in timeSlots"
                :key="timeSlot.time"
                class="time-row"
              >
                <div class="time-cell">{{ timeSlot.time }}</div>
                <div
                  v-for="day in weekDays"
                  :key="`${day.date}-${timeSlot.time}`"
                  class="schedule-cell"
                  @click="scheduleClass(day.date, timeSlot.time)"
                >
                  <div
                    v-for="schedule in getSchedulesForSlot(day.date, timeSlot.time)"
                    :key="schedule.id"
                    class="schedule-block"
                    :class="getScheduleStatusClass(schedule.status)"
                    @click.stop="viewScheduleDetail(schedule)"
                  >
                    <div class="schedule-title">{{ schedule.courseTitle }}</div>
                    <div class="schedule-class">{{ schedule.className }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 月视图占位符 -->
          <div v-else class="month-calendar-placeholder">
            <el-empty description="月视图功能开发中...">
              <el-button type="primary">切换到周视图</el-button>
            </el-empty>
          </div>
        </div>
      </el-tab-pane>

      <!-- 历史记录 -->
      <el-tab-pane label="历史记录" name="history">
        <div class="tab-content">
          <div class="history-filters">
            <el-row :gutter="16">
              <el-col :span="6">
                <el-date-picker
                  v-model="dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                />
              </el-col>
              <el-col :span="4">
                <el-select v-model="historyClassFilter" placeholder="选择班级" clearable>
                  <el-option label="全部班级" value="" />
                  <el-option
                    v-for="cls in classList"
                    :key="cls.id"
                    :label="cls.name"
                    :value="cls.id"
                  />
                </el-select>
              </el-col>
              <el-col :span="4">
                <el-button @click="exportHistory">
                  <el-icon><Download /></el-icon>
                  导出记录
                </el-button>
              </el-col>
            </el-row>
          </div>

          <div class="history-table">
            <el-table :data="filteredHistory" stripe>
              <el-table-column prop="date" label="日期" width="120" />
              <el-table-column prop="time" label="时间" width="120" />
              <el-table-column prop="courseTitle" label="课程名称" />
              <el-table-column prop="className" label="班级" width="120" />
              <el-table-column prop="teacherName" label="教师" width="100" />
              <el-table-column prop="duration" label="时长" width="80" />
              <el-table-column prop="studentCount" label="参与学生" width="100" align="center" />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getStatusColor(row.status)" size="small">
                    {{ getStatusLabel(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120">
                <template #default="{ row }">
                  <el-button size="small" @click="viewHistoryDetail(row)">
                    查看详情
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 安排课程对话框 -->
    <el-dialog v-model="showScheduleModal" title="安排课程" width="600px">
      <el-form :model="scheduleForm" :rules="scheduleRules" label-width="100px">
        <el-form-item label="课程" prop="courseId">
          <el-select v-model="scheduleForm.courseId" placeholder="选择课程" style="width: 100%">
            <el-option
              v-for="course in courseList"
              :key="course.id"
              :label="course.title"
              :value="course.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="班级" prop="classId">
          <el-select v-model="scheduleForm.classId" placeholder="选择班级" style="width: 100%">
            <el-option
              v-for="cls in classList"
              :key="cls.id"
              :label="cls.name"
              :value="cls.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="日期" prop="date">
          <el-date-picker
            v-model="scheduleForm.date"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="时间" prop="time">
          <el-time-picker
            v-model="scheduleForm.startTime"
            placeholder="开始时间"
            format="HH:mm"
            value-format="HH:mm"
            style="width: 48%; margin-right: 4%"
          />
          <el-time-picker
            v-model="scheduleForm.endTime"
            placeholder="结束时间"
            format="HH:mm"
            value-format="HH:mm"
            style="width: 48%"
          />
        </el-form-item>
        <el-form-item label="教室" prop="classroom">
          <el-input v-model="scheduleForm.classroom" placeholder="请输入教室" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="scheduleForm.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showScheduleModal = false">取消</el-button>
        <el-button type="primary" :loading="scheduling" @click="saveSchedule">
          确认安排
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  VideoPlay, Plus, Refresh, Clock, Calendar, Check, DataAnalysis,
  Search, Monitor, Document, MoreFilled, Edit, CopyDocument, Close,
  ArrowLeft, ArrowRight, Download
} from '@element-plus/icons-vue'

interface Schedule {
  id: string
  courseId: string
  courseTitle: string
  classId: string
  className: string
  teacherId: string
  teacherName: string
  date: string
  startTime: string
  endTime: string
  duration: number
  status: 'pending' | 'active' | 'completed' | 'cancelled'
  subject?: string
  chapter?: string
  classroom?: string
  notes?: string
  studentCount?: number
}

interface ClassInfo {
  id: string
  name: string
}

interface CourseInfo {
  id: string
  title: string
  subject: string
}

// 响应式数据
const activeTab = ref('today')
const statusFilter = ref('')
const classFilter = ref('')
const searchKeyword = ref('')
const viewMode = ref<'week' | 'month'>('week')
const dateRange = ref([])
const historyClassFilter = ref('')
const showScheduleModal = ref(false)
const scheduling = ref(false)
const isLoading = ref(false)

const activeClasses = ref(3)
const scheduledClasses = ref(8)
const completedClasses = ref(25)
const totalStudents = ref(156)

const scheduleForm = ref({
  courseId: '',
  classId: '',
  date: '',
  startTime: '',
  endTime: '',
  classroom: '',
  notes: ''
})

const scheduleRules = {
  courseId: [{ required: true, message: '请选择课程', trigger: 'change' }],
  classId: [{ required: true, message: '请选择班级', trigger: 'change' }],
  date: [{ required: true, message: '请选择日期', trigger: 'change' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
  classroom: [{ required: true, message: '请输入教室', trigger: 'blur' }]
}

// 模拟数据
const scheduleList = ref<Schedule[]>([
  {
    id: '1',
    courseId: 'c1',
    courseTitle: '数学基础概念',
    classId: 'cl1',
    className: '高一(1)班',
    teacherId: 't1',
    teacherName: '张老师',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:30',
    duration: 90,
    status: 'pending',
    subject: 'math',
    chapter: '第一章：基础概念',
    classroom: 'A101',
    studentCount: 45
  },
  {
    id: '2',
    courseId: 'c2',
    courseTitle: '物理实验',
    classId: 'cl2',
    className: '高一(2)班',
    teacherId: 't2',
    teacherName: '李老师',
    date: new Date().toISOString().split('T')[0],
    startTime: '14:00',
    endTime: '15:30',
    duration: 90,
    status: 'active',
    subject: 'physics',
    chapter: '实验一：力学基础',
    classroom: '实验室B201',
    studentCount: 42
  }
])

const classList = ref<ClassInfo[]>([
  { id: 'cl1', name: '高一(1)班' },
  { id: 'cl2', name: '高一(2)班' },
  { id: 'cl3', name: '高二(1)班' }
])

const courseList = ref<CourseInfo[]>([
  { id: 'c1', title: '数学基础概念', subject: 'math' },
  { id: 'c2', title: '物理实验', subject: 'physics' },
  { id: 'c3', title: '化学原理', subject: 'chemistry' }
])

const historyList = ref([
  {
    id: 'h1',
    date: '2024-01-15',
    time: '09:00-10:30',
    courseTitle: '数学基础概念',
    className: '高一(1)班',
    teacherName: '张老师',
    duration: 90,
    studentCount: 44,
    status: 'completed'
  }
])

// 计算属性
const filteredSchedules = computed(() => {
  let filtered = scheduleList.value

  if (statusFilter.value) {
    filtered = filtered.filter(s => s.status === statusFilter.value)
  }

  if (classFilter.value) {
    filtered = filtered.filter(s => s.classId === classFilter.value)
  }

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(s =>
      s.courseTitle.toLowerCase().includes(keyword) ||
      s.className.toLowerCase().includes(keyword)
    )
  }

  return filtered
})

const filteredHistory = computed(() => {
  let filtered = historyList.value

  if (historyClassFilter.value) {
    filtered = filtered.filter(h => {
      // 这里需要实际的班级名称匹配逻辑
      return h.className.includes(historyClassFilter.value)
    })
  }

  return filtered
})

const weekRange = computed(() => {
  const today = new Date()
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1))
  const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 7))

  return `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`
})

const weekDays = computed(() => {
  const days = []
  const today = new Date()
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1))

  const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + i)
    days.push({
      name: dayNames[i],
      date: date.toLocaleDateString(),
      isToday: date.toDateString() === new Date().toDateString()
    })
  }

  return days
})

const timeSlots = computed(() => {
  const slots = []
  for (let hour = 8; hour <= 20; hour++) {
    slots.push({
      time: `${hour.toString().padStart(2, '0')}:00`
    })
  }
  return slots
})

// 方法
const getScheduleStatusClass = (status: string) => {
  return {
    'status-pending': status === 'pending',
    'status-active': status === 'active',
    'status-completed': status === 'completed',
    'status-cancelled': status === 'cancelled'
  }
}

const getSubjectColor = (subject: string) => {
  const colors = {
    'math': 'primary',
    'physics': 'success',
    'chemistry': 'warning',
    'biology': 'info'
  }
  return colors[subject as keyof typeof colors] || ''
}

const getSubjectLabel = (subject: string) => {
  const labels = {
    'math': '数学',
    'physics': '物理',
    'chemistry': '化学',
    'biology': '生物'
  }
  return labels[subject as keyof typeof labels] || subject
}

const getStatusColor = (status: string) => {
  const colors = {
    'pending': 'info',
    'active': 'success',
    'completed': '',
    'cancelled': 'danger'
  }
  return colors[status as keyof typeof colors] || ''
}

const getStatusLabel = (status: string) => {
  const labels = {
    'pending': '未开始',
    'active': '进行中',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return labels[status as keyof typeof labels] || status
}

const getSchedulesForSlot = (date: string, time: string) => {
  return scheduleList.value.filter(schedule => {
    const scheduleTime = schedule.startTime
    return schedule.date === date && scheduleTime.startsWith(time.split(':')[0])
  })
}

const startClass = (schedule: Schedule) => {
  ElMessage.success(`开始上课: ${schedule.courseTitle}`)
  schedule.status = 'active'
}

const manageClass = (schedule: Schedule) => {
  ElMessage.info(`进入课堂: ${schedule.courseTitle}`)
}

const viewReport = (schedule: Schedule) => {
  ElMessage.info(`查看课程报告: ${schedule.courseTitle}`)
}

const viewScheduleDetail = (schedule: Schedule) => {
  ElMessage.info(`查看课程详情: ${schedule.courseTitle}`)
}

const handleScheduleAction = (command: string, schedule: Schedule) => {
  switch (command) {
    case 'edit':
      ElMessage.info(`编辑安排: ${schedule.courseTitle}`)
      break
    case 'copy':
      ElMessage.info(`复制安排: ${schedule.courseTitle}`)
      break
    case 'cancel':
      ElMessage.warning(`取消课程: ${schedule.courseTitle}`)
      break
  }
}

const scheduleClass = (date: string, time: string) => {
  scheduleForm.value.date = date
  scheduleForm.value.startTime = time
  showScheduleModal.value = true
}

const previousWeek = () => {
  ElMessage.info('切换到上一周')
}

const nextWeek = () => {
  ElMessage.info('切换到下一周')
}

const exportHistory = () => {
  ElMessage.success('历史记录导出成功')
}

const viewHistoryDetail = (history: any) => {
  ElMessage.info(`查看历史详情: ${history.courseTitle}`)
}

const refreshData = () => {
  ElMessage.success('数据刷新成功')
}

const saveSchedule = async () => {
  try {
    scheduling.value = true
    await new Promise(resolve => setTimeout(resolve, 1000))

    ElMessage.success('课程安排成功')
    showScheduleModal.value = false

    // 重置表单
    scheduleForm.value = {
      courseId: '',
      classId: '',
      date: '',
      startTime: '',
      endTime: '',
      classroom: '',
      notes: ''
    }
  } catch (error) {
    ElMessage.error('课程安排失败')
  } finally {
    scheduling.value = false
  }
}

onMounted(() => {
  // 初始化数据
})
</script>

<style lang="scss" scoped>
.teaching-management {
  padding: var(--spacing-lg);
  min-height: 100vh;
  background: var(--edu-bg-primary);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-xl);

  .header-content {
    h1 {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-size: var(--font-size-2xl);
      color: var(--edu-text-primary);
      margin: 0 0 var(--spacing-xs) 0;
    }

    p {
      margin: 0;
      color: var(--edu-text-secondary);
      font-size: var(--font-size-sm);
    }
  }

  .header-actions {
    display: flex;
    gap: var(--spacing-sm);
  }
}

.teaching-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.stat-card {
  background: var(--edu-bg-secondary);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--edu-radius-lg);
  padding: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    box-shadow: var(--edu-shadow-md);
    transform: translateY(-2px);
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--edu-radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;

    &.active {
      background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
    }

    &.scheduled {
      background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
    }

    &.completed {
      background: linear-gradient(135deg, #909399 0%, #b1b3b8 100%);
    }

    &.total {
      background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
    }

    .el-icon {
      font-size: 24px;
    }
  }

  .stat-content {
    flex: 1;

    .stat-value {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--edu-text-primary);
      line-height: var(--edu-leading-tight);
    }

    .stat-label {
      font-size: var(--font-size-sm);
      color: var(--edu-text-secondary);
      margin-top: var(--spacing-xs);
    }
  }
}

.teaching-tabs {
  background: var(--edu-bg-primary);
  border-radius: var(--edu-radius-lg);
  border: 1px solid var(--edu-border-light);
  overflow: hidden;

  :deep(.el-tabs__header) {
    margin: 0;
    background: var(--edu-bg-secondary);
    border-bottom: 1px solid var(--edu-border-light);
  }

  :deep(.el-tabs__content) {
    padding: 0;
  }
}

.tab-content {
  padding: var(--spacing-lg);
}

.schedule-toolbar {
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-base);
  background: var(--edu-bg-secondary);
  border-radius: var(--edu-radius-lg);
  border: 1px solid var(--edu-border-light);
}

.schedule-list {
  .schedule-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);
    padding: var(--spacing-lg);
    background: var(--edu-bg-primary);
    border: 1px solid var(--edu-border-light);
    border-radius: var(--edu-radius-lg);
    margin-bottom: var(--spacing-base);
    transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

    &:hover {
      box-shadow: var(--edu-shadow-md);
    }

    &.status-pending {
      border-left: 4px solid var(--edu-info-500);
    }

    &.status-active {
      border-left: 4px solid var(--edu-success-500);
    }

    &.status-completed {
      border-left: 4px solid var(--edu-text-tertiary);
    }

    .schedule-time {
      flex-shrink: 0;
      text-align: center;
      min-width: 100px;

      .time-range {
        font-weight: var(--font-weight-semibold);
        color: var(--edu-text-primary);
        margin-bottom: var(--spacing-xs);
      }

      .duration {
        font-size: var(--font-size-sm);
        color: var(--edu-text-secondary);
      }
    }

    .schedule-content {
      flex: 1;

      .course-info {
        h4 {
          margin: 0 0 var(--spacing-sm) 0;
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--edu-text-primary);
        }

        .course-meta {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-xs);

          .class-name, .teacher-name {
            font-size: var(--font-size-sm);
            color: var(--edu-text-secondary);
          }
        }

        .chapter-info {
          font-size: var(--font-size-sm);
          color: var(--edu-text-tertiary);
        }
      }
    }

    .schedule-actions {
      flex-shrink: 0;
      display: flex;
      gap: var(--spacing-xs);
    }
  }
}

.schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-base);
  background: var(--edu-bg-secondary);
  border-radius: var(--edu-radius-lg);
  border: 1px solid var(--edu-border-light);

  .week-navigation {
    display: flex;
    align-items: center;
    gap: var(--spacing-base);

    .week-range {
      font-weight: var(--font-weight-semibold);
      color: var(--edu-text-primary);
      min-width: 200px;
      text-align: center;
    }
  }
}

.week-calendar {
  background: var(--edu-bg-primary);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--edu-radius-lg);
  overflow: hidden;

  .calendar-header {
    display: grid;
    grid-template-columns: 80px repeat(7, 1fr);
    background: var(--edu-bg-secondary);
    border-bottom: 1px solid var(--edu-border-light);

    .time-column {
      padding: var(--spacing-base);
      font-weight: var(--font-weight-semibold);
      color: var(--edu-text-primary);
      border-right: 1px solid var(--edu-border-light);
    }

    .day-column {
      padding: var(--spacing-base);
      text-align: center;
      border-right: 1px solid var(--edu-border-light);

      &:last-child {
        border-right: none;
      }

      &.today {
        background: var(--edu-primary-50);
      }

      .day-header {
        .day-name {
          font-weight: var(--font-weight-semibold);
          color: var(--edu-text-primary);
          margin-bottom: var(--spacing-xs);
        }

        .day-date {
          font-size: var(--font-size-sm);
          color: var(--edu-text-secondary);
        }
      }
    }
  }

  .calendar-body {
    .time-row {
      display: grid;
      grid-template-columns: 80px repeat(7, 1fr);
      border-bottom: 1px solid var(--edu-border-light);

      &:last-child {
        border-bottom: none;
      }

      .time-cell {
        padding: var(--spacing-base);
        font-size: var(--font-size-sm);
        color: var(--edu-text-secondary);
        border-right: 1px solid var(--edu-border-light);
        background: var(--edu-bg-secondary);
      }

      .schedule-cell {
        padding: var(--spacing-xs);
        border-right: 1px solid var(--edu-border-light);
        min-height: 60px;
        cursor: pointer;
        transition: background-color var(--edu-duration-fast);

        &:hover {
          background: var(--edu-bg-secondary);
        }

        &:last-child {
          border-right: none;
        }

        .schedule-block {
          background: var(--edu-primary-500);
          color: white;
          padding: var(--spacing-xs);
          border-radius: var(--edu-radius-base);
          margin-bottom: var(--spacing-xs);
          cursor: pointer;
          transition: all var(--edu-duration-fast);

          &:hover {
            transform: translateY(-1px);
            box-shadow: var(--edu-shadow-sm);
          }

          .schedule-title {
            font-size: var(--font-size-xs);
            font-weight: var(--font-weight-medium);
            margin-bottom: 2px;
          }

          .schedule-class {
            font-size: 10px;
            opacity: 0.8;
          }
        }
      }
    }
  }
}

.history-filters {
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-base);
  background: var(--edu-bg-secondary);
  border-radius: var(--edu-radius-lg);
  border: 1px solid var(--edu-border-light);
}

.history-table {
  background: var(--edu-bg-primary);
  border-radius: var(--edu-radius-lg);
  border: 1px solid var(--edu-border-light);
  overflow: hidden;
}

.month-calendar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: var(--edu-bg-primary);
  border-radius: var(--edu-radius-lg);
  border: 1px solid var(--edu-border-light);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: var(--spacing-base);
    align-items: stretch;
  }

  .teaching-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .schedule-item {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-base);
  }

  .schedule-header {
    flex-direction: column;
    gap: var(--spacing-base);
    align-items: stretch;
  }

  .week-calendar {
    overflow-x: auto;
  }
}
</style>