<template>
  <div class="student-management">
    <!-- 学生管理工具栏 -->
    <div class="management-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="showAddStudentModal = true">
          <el-icon><Plus /></el-icon>
          添加学生
        </el-button>
        <el-button @click="showImportModal = true">
          <el-icon><Upload /></el-icon>
          批量导入
        </el-button>
        <el-button @click="exportStudents">
          <el-icon><Download /></el-icon>
          导出学生
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索学生姓名、学号..."
          :prefix-icon="Search"
          clearable
          style="width: 300px"
        />
      </div>
    </div>

    <!-- 筛选器 -->
    <div class="filters-section">
      <el-row :gutter="16">
        <el-col :span="4">
          <el-select v-model="filterClass" placeholder="选择班级" clearable>
            <el-option
              v-for="cls in availableClasses"
              :key="cls.id"
              :label="cls.name"
              :value="cls.id"
            />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="filterGrade" placeholder="选择年级" clearable>
            <el-option
              v-for="grade in grades"
              :key="grade.value"
              :label="grade.label"
              :value="grade.value"
            />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="filterStatus" placeholder="学生状态" clearable>
            <el-option label="在读" value="active" />
            <el-option label="休学" value="suspended" />
            <el-option label="毕业" value="graduated" />
            <el-option label="转出" value="transferred" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="filterGender" placeholder="性别" clearable>
            <el-option label="男" value="male" />
            <el-option label="女" value="female" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button @click="resetFilters">
            <el-icon><RefreshLeft /></el-icon>
            重置筛选
          </el-button>
        </el-col>
        <el-col :span="4">
          <el-button-group>
            <el-button :type="viewMode === 'table' ? 'primary' : 'default'" @click="viewMode = 'table'">
              <el-icon><Grid /></el-icon>
            </el-button>
            <el-button :type="viewMode === 'card' ? 'primary' : 'default'" @click="viewMode = 'card'">
              <el-icon><List /></el-icon>
            </el-button>
          </el-button-group>
        </el-col>
      </el-row>
    </div>

    <!-- 学生统计 -->
    <div class="student-stats">
      <div class="stat-item">
        <div class="stat-number">{{ totalStudents }}</div>
        <div class="stat-label">学生总数</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ activeStudents }}</div>
        <div class="stat-label">在读学生</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ maleStudents }}</div>
        <div class="stat-label">男生</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ femaleStudents }}</div>
        <div class="stat-label">女生</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ averageAge }}</div>
        <div class="stat-label">平均年龄</div>
      </div>
    </div>

    <!-- 学生列表 - 表格视图 -->
    <div v-if="viewMode === 'table'" class="students-table">
      <el-table
        :data="paginatedStudents"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="头像" width="80">
          <template #default="{ row }">
            <el-avatar :size="40" :src="row.avatar">
              {{ row.name.charAt(0) }}
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column prop="studentId" label="学号" width="120" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="gender" label="性别" width="60">
          <template #default="{ row }">
            {{ row.gender === 'male' ? '男' : '女' }}
          </template>
        </el-table-column>
        <el-table-column prop="age" label="年龄" width="60" />
        <el-table-column prop="className" label="班级" width="120" />
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column prop="phone" label="电话" width="120" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="getStatusColor(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="enrollmentDate" label="入学日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.enrollmentDate) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewStudentDetail(row)">详情</el-button>
            <el-button size="small" type="primary" @click="editStudent(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteStudent(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredStudents.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 学生列表 - 卡片视图 -->
    <div v-else class="students-grid">
      <div
        v-for="student in paginatedStudents"
        :key="student.id"
        class="student-card"
      >
        <div class="card-header">
          <el-avatar :size="60" :src="student.avatar">
            {{ student.name.charAt(0) }}
          </el-avatar>
          <div class="student-info">
            <h4>{{ student.name }}</h4>
            <p class="student-id">{{ student.studentId }}</p>
            <el-tag :type="getStatusColor(student.status)" size="small">
              {{ getStatusLabel(student.status) }}
            </el-tag>
          </div>
          <div class="card-actions">
            <el-dropdown @command="(command) => handleStudentAction(command, student)">
              <el-button size="small" text>
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">
                    <el-icon><Edit /></el-icon>
                    编辑信息
                  </el-dropdown-item>
                  <el-dropdown-item command="courses">
                    <el-icon><Reading /></el-icon>
                    查看课程
                  </el-dropdown-item>
                  <el-dropdown-item command="progress">
                    <el-icon><TrendCharts /></el-icon>
                    学习进度
                  </el-dropdown-item>
                  <el-dropdown-item command="message">
                    <el-icon><Message /></el-icon>
                    发送消息
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    <el-icon><Delete /></el-icon>
                    删除学生
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <div class="card-content">
          <div class="info-grid">
            <div class="info-item">
              <span class="label">班级:</span>
              <span class="value">{{ student.className }}</span>
            </div>
            <div class="info-item">
              <span class="label">性别:</span>
              <span class="value">{{ student.gender === 'male' ? '男' : '女' }}</span>
            </div>
            <div class="info-item">
              <span class="label">年龄:</span>
              <span class="value">{{ student.age }}岁</span>
            </div>
            <div class="info-item">
              <span class="label">入学:</span>
              <span class="value">{{ formatDate(student.enrollmentDate) }}</span>
            </div>
          </div>

          <div class="contact-info">
            <div class="contact-item">
              <el-icon><Message /></el-icon>
              <span>{{ student.email }}</span>
            </div>
            <div class="contact-item">
              <el-icon><Phone /></el-icon>
              <span>{{ student.phone }}</span>
            </div>
          </div>

          <div class="performance-summary">
            <h5>学习概览</h5>
            <div class="performance-stats">
              <div class="perf-item">
                <div class="perf-label">平均成绩</div>
                <div class="perf-value">{{ student.averageScore || 85 }}分</div>
              </div>
              <div class="perf-item">
                <div class="perf-label">出勤率</div>
                <div class="perf-value">{{ student.attendanceRate || 95 }}%</div>
              </div>
              <div class="perf-item">
                <div class="perf-label">完成作业</div>
                <div class="perf-value">{{ student.completedAssignments || 12 }}/15</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card-footer">
          <el-button size="small" @click="viewStudentDetail(student)">
            <el-icon><View /></el-icon>
            查看详情
          </el-button>
          <el-button size="small" type="primary" @click="editStudent(student)">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
        </div>
      </div>
    </div>

    <!-- 批量操作工具栏 -->
    <div v-if="selectedStudents.length > 0" class="batch-actions">
      <div class="batch-info">
        已选择 {{ selectedStudents.length }} 名学生
      </div>
      <div class="batch-buttons">
        <el-button @click="batchAssignClass">分配班级</el-button>
        <el-button @click="batchSendMessage">发送消息</el-button>
        <el-button @click="batchExport">导出选中</el-button>
        <el-button type="danger" @click="batchDelete">批量删除</el-button>
      </div>
    </div>

    <!-- 添加学生对话框 -->
    <el-dialog
      v-model="showAddStudentModal"
      title="添加学生"
      width="600px"
      :before-close="handleCloseAddStudent"
    >
      <el-form :model="studentForm" :rules="studentRules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="studentForm.name" placeholder="请输入学生姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学号" prop="studentId">
              <el-input v-model="studentForm.studentId" placeholder="请输入学号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="性别" prop="gender">
              <el-select v-model="studentForm.gender" placeholder="选择性别">
                <el-option label="男" value="male" />
                <el-option label="女" value="female" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="年龄" prop="age">
              <el-input-number
                v-model="studentForm.age"
                :min="6"
                :max="25"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="班级" prop="classId">
              <el-select v-model="studentForm.classId" placeholder="选择班级">
                <el-option
                  v-for="cls in availableClasses"
                  :key="cls.id"
                  :label="cls.name"
                  :value="cls.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="studentForm.status" placeholder="选择状态">
                <el-option label="在读" value="active" />
                <el-option label="休学" value="suspended" />
                <el-option label="毕业" value="graduated" />
                <el-option label="转出" value="transferred" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="studentForm.email" placeholder="请输入邮箱地址" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="studentForm.phone" placeholder="请输入电话号码" />
        </el-form-item>
        <el-form-item label="入学日期" prop="enrollmentDate">
          <el-date-picker
            v-model="studentForm.enrollmentDate"
            type="date"
            placeholder="选择入学日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="studentForm.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showAddStudentModal = false">取消</el-button>
        <el-button type="primary" :loading="addingStudent" @click="addStudent">
          添加学生
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog
      v-model="showImportModal"
      title="批量导入学生"
      width="600px"
    >
      <div class="import-content">
        <el-alert
          title="导入说明"
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            <p>支持导入 Excel (.xlsx) 和 CSV (.csv) 格式文件</p>
            <p>文件必须包含以下列：姓名、学号、性别、年龄、班级、邮箱、电话</p>
          </template>
        </el-alert>

        <div class="import-area">
          <el-upload
            drag
            :file-list="importFiles"
            :before-upload="beforeImport"
            :http-request="handleImport"
            accept=".xlsx,.csv"
          >
            <el-icon class="el-icon--upload"><Upload /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 .xlsx, .csv 格式，文件大小不超过 10MB
              </div>
            </template>
          </el-upload>
        </div>

        <div v-if="importPreview.length > 0" class="import-preview">
          <h4>导入预览</h4>
          <el-table :data="importPreview" max-height="300">
            <el-table-column prop="name" label="姓名" />
            <el-table-column prop="studentId" label="学号" />
            <el-table-column prop="className" label="班级" />
            <el-table-column prop="status" label="状态">
              <template #default="{ row }">
                <el-tag :type="row.valid ? 'success' : 'danger'" size="small">
                  {{ row.valid ? '有效' : '错误' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <template #footer>
        <el-button @click="showImportModal = false">取消</el-button>
        <el-button
          type="primary"
          :loading="importing"
          :disabled="importPreview.length === 0"
          @click="confirmImport"
        >
          确认导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Upload, Download, Search, RefreshLeft, Grid, List, MoreFilled,
  Edit, Reading, TrendCharts, Message, Delete, View, Phone
} from '@element-plus/icons-vue'
import { grades } from '@/config/courseData'

interface Student {
  id: string
  name: string
  studentId: string
  gender: 'male' | 'female'
  age: number
  classId: string
  className: string
  email: string
  phone: string
  status: 'active' | 'suspended' | 'graduated' | 'transferred'
  enrollmentDate: Date
  avatar?: string
  averageScore?: number
  attendanceRate?: number
  completedAssignments?: number
}

interface Class {
  id: string
  name: string
  grade: string
}

// 响应式数据
const searchKeyword = ref('')
const filterClass = ref('')
const filterGrade = ref('')
const filterStatus = ref('')
const filterGender = ref('')
const viewMode = ref<'table' | 'card'>('table')
const selectedStudents = ref<Student[]>([])
const currentPage = ref(1)
const pageSize = ref(20)

// 模态框状态
const showAddStudentModal = ref(false)
const showImportModal = ref(false)
const addingStudent = ref(false)
const importing = ref(false)

// 数据
const studentList = ref<Student[]>([])
const availableClasses = ref<Class[]>([])
const importFiles = ref<any[]>([])
const importPreview = ref<any[]>([])

// 表单数据
const studentForm = ref({
  name: '',
  studentId: '',
  gender: 'male' as 'male' | 'female',
  age: 16,
  classId: '',
  status: 'active' as 'active' | 'suspended' | 'graduated' | 'transferred',
  email: '',
  phone: '',
  enrollmentDate: new Date(),
  notes: ''
})

const studentRules = {
  name: [
    { required: true, message: '请输入学生姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度在2到20个字符之间', trigger: 'blur' }
  ],
  studentId: [
    { required: true, message: '请输入学号', trigger: 'blur' },
    { pattern: /^\d{8,12}$/, message: '学号应为8-12位数字', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ],
  age: [
    { required: true, message: '请输入年龄', trigger: 'blur' },
    { type: 'number', min: 6, max: 25, message: '年龄应在6-25岁之间', trigger: 'blur' }
  ],
  classId: [
    { required: true, message: '请选择班级', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ]
}

// 计算属性
const filteredStudents = computed(() => {
  let filtered = studentList.value

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(student =>
      student.name.toLowerCase().includes(keyword) ||
      student.studentId.toLowerCase().includes(keyword) ||
      student.email.toLowerCase().includes(keyword)
    )
  }

  if (filterClass.value) {
    filtered = filtered.filter(student => student.classId === filterClass.value)
  }

  if (filterGrade.value) {
    const gradeClasses = availableClasses.value
      .filter(cls => cls.grade === filterGrade.value)
      .map(cls => cls.id)
    filtered = filtered.filter(student => gradeClasses.includes(student.classId))
  }

  if (filterStatus.value) {
    filtered = filtered.filter(student => student.status === filterStatus.value)
  }

  if (filterGender.value) {
    filtered = filtered.filter(student => student.gender === filterGender.value)
  }

  return filtered
})

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredStudents.value.slice(start, end)
})

const totalStudents = computed(() => studentList.value.length)

const activeStudents = computed(() =>
  studentList.value.filter(student => student.status === 'active').length
)

const maleStudents = computed(() =>
  studentList.value.filter(student => student.gender === 'male').length
)

const femaleStudents = computed(() =>
  studentList.value.filter(student => student.gender === 'female').length
)

const averageAge = computed(() => {
  if (studentList.value.length === 0) return 0
  const total = studentList.value.reduce((sum, student) => sum + student.age, 0)
  return Math.round(total / studentList.value.length)
})

// 方法
const loadStudents = async () => {
  try {
    // 模拟加载学生数据
    await new Promise(resolve => setTimeout(resolve, 500))

    studentList.value = [
      {
        id: '1',
        name: '张三',
        studentId: '202410001',
        gender: 'male',
        age: 16,
        classId: 'class1',
        className: '高一(1)班',
        email: 'zhangsan@student.edu',
        phone: '13800138001',
        status: 'active',
        enrollmentDate: new Date('2024-09-01'),
        averageScore: 85,
        attendanceRate: 95,
        completedAssignments: 12
      },
      {
        id: '2',
        name: '李四',
        studentId: '202410002',
        gender: 'female',
        age: 16,
        classId: 'class1',
        className: '高一(1)班',
        email: 'lisi@student.edu',
        phone: '13800138002',
        status: 'active',
        enrollmentDate: new Date('2024-09-01'),
        averageScore: 92,
        attendanceRate: 98,
        completedAssignments: 15
      },
      {
        id: '3',
        name: '王五',
        studentId: '202410003',
        gender: 'male',
        age: 17,
        classId: 'class2',
        className: '高一(2)班',
        email: 'wangwu@student.edu',
        phone: '13800138003',
        status: 'active',
        enrollmentDate: new Date('2024-09-01'),
        averageScore: 78,
        attendanceRate: 88,
        completedAssignments: 10
      }
    ]
  } catch (error) {
    console.error('加载学生列表失败:', error)
    ElMessage.error('加载学生列表失败')
  }
}

const loadAvailableClasses = async () => {
  try {
    // 模拟加载班级数据
    availableClasses.value = [
      { id: 'class1', name: '高一(1)班', grade: 'grade10' },
      { id: 'class2', name: '高一(2)班', grade: 'grade10' },
      { id: 'class3', name: '高一(3)班', grade: 'grade10' },
      { id: 'class4', name: '高二(1)班', grade: 'grade11' },
      { id: 'class5', name: '高二(2)班', grade: 'grade11' }
    ]
  } catch (error) {
    console.error('加载班级列表失败:', error)
  }
}

const resetFilters = () => {
  searchKeyword.value = ''
  filterClass.value = ''
  filterGrade.value = ''
  filterStatus.value = ''
  filterGender.value = ''
  currentPage.value = 1
}

const handleSelectionChange = (selection: Student[]) => {
  selectedStudents.value = selection
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'active': 'success',
    'suspended': 'warning',
    'graduated': 'info',
    'transferred': 'danger'
  }
  return colors[status] || ''
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'active': '在读',
    'suspended': '休学',
    'graduated': '毕业',
    'transferred': '转出'
  }
  return labels[status] || status
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN')
}

const handleStudentAction = (command: string, student: Student) => {
  switch (command) {
    case 'edit':
      editStudent(student)
      break
    case 'courses':
      viewStudentCourses(student)
      break
    case 'progress':
      viewStudentProgress(student)
      break
    case 'message':
      sendMessageToStudent(student)
      break
    case 'delete':
      deleteStudent(student)
      break
  }
}

const viewStudentDetail = (student: Student) => {
  ElMessage.info(`查看学生详情: ${student.name}`)
}

const editStudent = (student: Student) => {
  // 填充表单数据
  studentForm.value = {
    name: student.name,
    studentId: student.studentId,
    gender: student.gender,
    age: student.age,
    classId: student.classId,
    status: student.status,
    email: student.email,
    phone: student.phone,
    enrollmentDate: student.enrollmentDate,
    notes: ''
  }
  showAddStudentModal.value = true
}

const deleteStudent = async (student: Student) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除学生 "${student.name}" 吗？此操作不可撤销。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const index = studentList.value.findIndex(s => s.id === student.id)
    if (index > -1) {
      studentList.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  } catch {
    // 用户取消删除
  }
}

const addStudent = async () => {
  try {
    addingStudent.value = true

    // 模拟添加学生
    await new Promise(resolve => setTimeout(resolve, 1000))

    const className = availableClasses.value.find(cls => cls.id === studentForm.value.classId)?.name || '未知班级'

    const newStudent: Student = {
      id: `student_${Date.now()}`,
      name: studentForm.value.name,
      studentId: studentForm.value.studentId,
      gender: studentForm.value.gender,
      age: studentForm.value.age,
      classId: studentForm.value.classId,
      className,
      email: studentForm.value.email,
      phone: studentForm.value.phone,
      status: studentForm.value.status,
      enrollmentDate: studentForm.value.enrollmentDate
    }

    studentList.value.unshift(newStudent)
    ElMessage.success('学生添加成功')
    showAddStudentModal.value = false
    resetStudentForm()
  } catch (error) {
    console.error('添加学生失败:', error)
    ElMessage.error('添加学生失败')
  } finally {
    addingStudent.value = false
  }
}

const resetStudentForm = () => {
  studentForm.value = {
    name: '',
    studentId: '',
    gender: 'male',
    age: 16,
    classId: '',
    status: 'active',
    email: '',
    phone: '',
    enrollmentDate: new Date(),
    notes: ''
  }
}

const handleCloseAddStudent = () => {
  showAddStudentModal.value = false
  resetStudentForm()
}

const beforeImport = (file: File) => {
  const isValidType = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                   file.type === 'text/csv' ||
                   file.name.toLowerCase().endsWith('.xlsx') ||
                   file.name.toLowerCase().endsWith('.csv')

  if (!isValidType) {
    ElMessage.error('只支持 Excel (.xlsx) 和 CSV (.csv) 格式文件')
    return false
  }

  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB')
    return false
  }

  return false // 阻止自动上传
}

const handleImport = async (options: any) => {
  const file = options.file
  try {
    // 模拟文件解析
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 模拟导入预览数据
    importPreview.value = [
      {
        name: '测试学生1',
        studentId: '202410010',
        className: '高一(1)班',
        valid: true
      },
      {
        name: '测试学生2',
        studentId: '202410011',
        className: '高一(2)班',
        valid: true
      },
      {
        name: '测试学生3',
        studentId: 'INVALID_ID',
        className: '未知班级',
        valid: false
      }
    ]

    ElMessage.success('文件解析成功，请确认导入数据')
  } catch (error) {
    console.error('文件解析失败:', error)
    ElMessage.error('文件解析失败')
  }
}

const confirmImport = async () => {
  try {
    importing.value = true

    // 模拟导入过程
    await new Promise(resolve => setTimeout(resolve, 2000))

    const validCount = importPreview.value.filter(item => item.valid).length
    ElMessage.success(`成功导入 ${validCount} 名学生`)
    showImportModal.value = false
    importPreview.value = []
    importFiles.value = []

    // 重新加载学生列表
    await loadStudents()
  } catch (error) {
    console.error('导入失败:', error)
    ElMessage.error('导入失败')
  } finally {
    importing.value = false
  }
}

const exportStudents = () => {
  ElMessage.info('学生导出功能开发中...')
}

const batchAssignClass = () => {
  ElMessage.info(`批量分配班级: ${selectedStudents.value.length} 名学生`)
}

const batchSendMessage = () => {
  ElMessage.info(`批量发送消息: ${selectedStudents.value.length} 名学生`)
}

const batchExport = () => {
  ElMessage.info(`批量导出: ${selectedStudents.value.length} 名学生`)
}

const batchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedStudents.value.length} 名学生吗？此操作不可撤销。`,
      '确认批量删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 模拟批量删除
    selectedStudents.value.forEach(student => {
      const index = studentList.value.findIndex(s => s.id === student.id)
      if (index > -1) {
        studentList.value.splice(index, 1)
      }
    })

    selectedStudents.value = []
    ElMessage.success('批量删除成功')
  } catch {
    // 用户取消删除
  }
}

const viewStudentCourses = (student: Student) => {
  ElMessage.info(`查看学生课程: ${student.name}`)
}

const viewStudentProgress = (student: Student) => {
  ElMessage.info(`查看学习进度: ${student.name}`)
}

const sendMessageToStudent = (student: Student) => {
  ElMessage.info(`发送消息给学生: ${student.name}`)
}

// 生命周期
onMounted(() => {
  loadStudents()
  loadAvailableClasses()
})
</script>

<style lang="scss" scoped>
.student-management {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.management-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.filters-section {
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-base);
  background: var(--edu-bg-secondary);
  border-radius: var(--edu-radius-lg);
  border: 1px solid var(--edu-border-light);
}

.student-stats {
  display: flex;
  gap: var(--spacing-base);
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-base);
  background: var(--edu-bg-secondary);
  border-radius: var(--edu-radius-lg);
  border: 1px solid var(--edu-border-light);
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: var(--spacing-sm);
  background: var(--edu-bg-primary);
  border-radius: var(--edu-radius-base);

  .stat-number {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--edu-primary-600);
    margin-bottom: var(--spacing-xs);
  }

  .stat-label {
    font-size: var(--font-size-sm);
    color: var(--edu-text-secondary);
  }
}

.students-table {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--edu-bg-primary);
  border-radius: var(--edu-radius-lg);
  border: 1px solid var(--edu-border-light);
  overflow: hidden;
}

.pagination-wrapper {
  padding: var(--spacing-base);
  border-top: 1px solid var(--edu-border-light);
  background: var(--edu-bg-secondary);
  display: flex;
  justify-content: center;
}

.students-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-lg);
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-base);
}

.student-card {
  background: var(--edu-bg-primary);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--edu-radius-lg);
  overflow: hidden;
  transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

  &:hover {
    box-shadow: var(--edu-shadow-md);
    transform: translateY(-2px);
  }
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-base);
  padding: var(--spacing-lg);
  background: var(--edu-bg-secondary);
  border-bottom: 1px solid var(--edu-border-light);

  .student-info {
    flex: 1;

    h4 {
      margin: 0 0 var(--spacing-xs) 0;
      color: var(--edu-text-primary);
    }

    .student-id {
      margin: 0 0 var(--spacing-xs) 0;
      color: var(--edu-text-secondary);
      font-size: var(--font-size-sm);
    }
  }
}

.card-content {
  padding: var(--spacing-lg);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-base);

  .info-item {
    display: flex;
    justify-content: space-between;

    .label {
      color: var(--edu-text-tertiary);
      font-size: var(--font-size-sm);
    }

    .value {
      color: var(--edu-text-primary);
      font-weight: var(--font-weight-medium);
    }
  }
}

.contact-info {
  margin-bottom: var(--spacing-base);

  .contact-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    margin-bottom: var(--spacing-xs);
    font-size: var(--font-size-sm);
    color: var(--edu-text-secondary);

    .el-icon {
      color: var(--edu-primary-500);
    }
  }
}

.performance-summary {
  h5 {
    margin: 0 0 var(--spacing-sm) 0;
    color: var(--edu-text-primary);
    font-size: var(--font-size-sm);
  }

  .performance-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-sm);

    .perf-item {
      text-align: center;
      padding: var(--spacing-xs);
      background: var(--edu-bg-secondary);
      border-radius: var(--edu-radius-base);

      .perf-label {
        font-size: var(--font-size-xs);
        color: var(--edu-text-tertiary);
        margin-bottom: 2px;
      }

      .perf-value {
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-semibold);
        color: var(--edu-primary-600);
      }
    }
  }
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-base) var(--spacing-lg);
  background: var(--edu-bg-secondary);
  border-top: 1px solid var(--edu-border-light);
}

.batch-actions {
  position: fixed;
  bottom: var(--spacing-lg);
  left: 50%;
  transform: translateX(-50%);
  background: var(--edu-bg-primary);
  border: 1px solid var(--edu-border-light);
  border-radius: var(--edu-radius-lg);
  padding: var(--spacing-base) var(--spacing-lg);
  box-shadow: var(--edu-shadow-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
  z-index: 1000;

  .batch-info {
    font-weight: var(--font-weight-medium);
    color: var(--edu-text-primary);
  }

  .batch-buttons {
    display: flex;
    gap: var(--spacing-sm);
  }
}

.import-content {
  .import-area {
    margin: var(--spacing-lg) 0;
  }

  .import-preview {
    margin-top: var(--spacing-lg);

    h4 {
      margin: 0 0 var(--spacing-base) 0;
      color: var(--edu-text-primary);
    }
  }
}

/* 深色模式适配 */
[data-theme="dark"] {
  .filters-section,
  .student-stats,
  .students-table,
  .student-card {
    background: var(--edu-bg-primary);
    border-color: var(--edu-border-dark);
  }

  .card-header,
  .card-footer {
    background: var(--edu-bg-secondary);
    border-color: var(--edu-border-dark);
  }

  .performance-summary .performance-stats .perf-item {
    background: var(--edu-bg-secondary);
  }

  .batch-actions {
    background: var(--edu-bg-primary);
    border-color: var(--edu-border-dark);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .management-toolbar {
    flex-direction: column;
    gap: var(--spacing-base);
    align-items: stretch;
  }

  .filters-section .el-row {
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .student-stats {
    flex-wrap: wrap;
  }

  .students-grid {
    grid-template-columns: 1fr;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .performance-stats {
    grid-template-columns: 1fr;
  }

  .card-footer {
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .batch-actions {
    flex-direction: column;
    gap: var(--spacing-sm);
    width: 90%;
  }
}
</style>