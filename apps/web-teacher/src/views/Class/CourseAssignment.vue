<template>
  <div class="course-assignment">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1>
          <el-icon><Reading /></el-icon>
          课程分配
        </h1>
        <p>为班级分配课程，管理教学计划</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showAssignModal = true">
          <el-icon><Plus /></el-icon>
          分配课程
        </el-button>
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 分配统计 -->
    <div class="assignment-stats">
      <div class="stat-card">
        <div class="stat-icon total">
          <el-icon><Document /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ totalAssignments }}</div>
          <div class="stat-label">课程分配总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon active">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ activeAssignments }}</div>
          <div class="stat-label">进行中课程</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon completed">
          <el-icon><Check /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ completedAssignments }}</div>
          <div class="stat-label">已完成课程</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon students">
          <el-icon><User /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ totalAffectedStudents }}</div>
          <div class="stat-label">影响学生数</div>
        </div>
      </div>
    </div>

    <!-- 标签页 -->
    <el-tabs v-model="activeTab" class="assignment-tabs">
      <!-- 分配管理 -->
      <el-tab-pane label="分配管理" name="assignments">
        <div class="tab-content">
          <!-- 筛选工具栏 -->
          <div class="filter-toolbar">
            <el-row :gutter="16">
              <el-col :span="5">
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
              <el-col :span="5">
                <el-select v-model="subjectFilter" placeholder="选择学科" clearable>
                  <el-option label="全部学科" value="" />
                  <el-option label="数学" value="math" />
                  <el-option label="物理" value="physics" />
                  <el-option label="化学" value="chemistry" />
                  <el-option label="生物" value="biology" />
                </el-select>
              </el-col>
              <el-col :span="5">
                <el-select v-model="statusFilter" placeholder="分配状态" clearable>
                  <el-option label="全部状态" value="" />
                  <el-option label="未开始" value="pending" />
                  <el-option label="进行中" value="active" />
                  <el-option label="已完成" value="completed" />
                  <el-option label="已暂停" value="paused" />
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-input
                  v-model="searchKeyword"
                  placeholder="搜索课程名称..."
                  :prefix-icon="Search"
                  clearable
                />
              </el-col>
              <el-col :span="3">
                <el-button @click="resetFilters">
                  <el-icon><RefreshLeft /></el-icon>
                  重置
                </el-button>
              </el-col>
            </el-row>
          </div>

          <!-- 分配列表 -->
          <div class="assignment-list">
            <div
              v-for="assignment in filteredAssignments"
              :key="assignment.id"
              class="assignment-card"
            >
              <div class="assignment-header">
                <div class="assignment-info">
                  <h4>{{ assignment.courseTitle }}</h4>
                  <div class="assignment-meta">
                    <el-tag :type="getSubjectColor(assignment.subject)" size="small">
                      {{ getSubjectLabel(assignment.subject) }}
                    </el-tag>
                    <el-tag :type="getStatusColor(assignment.status)" size="small">
                      {{ getStatusLabel(assignment.status) }}
                    </el-tag>
                    <span class="class-name">{{ assignment.className }}</span>
                  </div>
                </div>
                <div class="assignment-actions">
                  <el-dropdown @command="(command) => handleAssignmentAction(command, assignment)">
                    <el-button size="small" text>
                      <el-icon><MoreFilled /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="edit">
                          <el-icon><Edit /></el-icon>
                          编辑分配
                        </el-dropdown-item>
                        <el-dropdown-item command="schedule">
                          <el-icon><Clock /></el-icon>
                          安排进度
                        </el-dropdown-item>
                        <el-dropdown-item command="report">
                          <el-icon><DataAnalysis /></el-icon>
                          查看报告
                        </el-dropdown-item>
                        <el-dropdown-item command="pause" divided v-if="assignment.status === 'active'">
                          <el-icon><VideoPause /></el-icon>
                          暂停课程
                        </el-dropdown-item>
                        <el-dropdown-item command="resume" v-if="assignment.status === 'paused'">
                          <el-icon><VideoPlay /></el-icon>
                          恢复课程
                        </el-dropdown-item>
                        <el-dropdown-item command="cancel" divided>
                          <el-icon><Close /></el-icon>
                          取消分配
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>

              <div class="assignment-content">
                <div class="assignment-details">
                  <div class="detail-item">
                    <div class="detail-label">授课教师</div>
                    <div class="detail-value">{{ assignment.teacherName }}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">分配时间</div>
                    <div class="detail-value">{{ assignment.assignedDate }}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">计划开始</div>
                    <div class="detail-value">{{ assignment.plannedStartDate }}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">预计完成</div>
                    <div class="detail-value">{{ assignment.plannedEndDate }}</div>
                  </div>
                </div>

                <div class="assignment-progress">
                  <div class="progress-header">
                    <span class="progress-label">完成进度</span>
                    <span class="progress-value">{{ assignment.progress }}%</span>
                  </div>
                  <el-progress :percentage="assignment.progress" :stroke-width="8" />
                  <div class="progress-details">
                    <span class="completed-chapters">已完成 {{ assignment.completedChapters }}/{{ assignment.totalChapters }} 章节</span>
                    <span class="student-progress">学生平均进度 {{ assignment.averageStudentProgress }}%</span>
                  </div>
                </div>

                <div class="assignment-students">
                  <div class="students-header">
                    <span class="students-label">学生情况</span>
                    <el-button size="small" text @click="viewStudentList(assignment)">
                      查看全部
                    </el-button>
                  </div>
                  <div class="students-stats">
                    <div class="stat-item">
                      <span class="stat-number">{{ assignment.totalStudents }}</span>
                      <span class="stat-text">总人数</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-number">{{ assignment.activeStudents }}</span>
                      <span class="stat-text">活跃</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-number">{{ assignment.completedStudents }}</span>
                      <span class="stat-text">已完成</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 课程库 -->
      <el-tab-pane label="课程库" name="courses">
        <div class="tab-content">
          <div class="courses-header">
            <div class="courses-title">
              <h3>可分配课程</h3>
              <p>选择课程并分配给相应的班级</p>
            </div>
            <div class="courses-actions">
              <el-button @click="importCourses">
                <el-icon><Upload /></el-icon>
                导入课程
              </el-button>
            </div>
          </div>

          <div class="courses-filter">
            <el-row :gutter="16">
              <el-col :span="6">
                <el-select v-model="courseSubjectFilter" placeholder="选择学科" clearable>
                  <el-option label="全部学科" value="" />
                  <el-option label="数学" value="math" />
                  <el-option label="物理" value="physics" />
                  <el-option label="化学" value="chemistry" />
                  <el-option label="生物" value="biology" />
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-select v-model="courseGradeFilter" placeholder="选择年级" clearable>
                  <el-option label="全部年级" value="" />
                  <el-option label="高一" value="grade10" />
                  <el-option label="高二" value="grade11" />
                  <el-option label="高三" value="grade12" />
                </el-select>
              </el-col>
              <el-col :span="8">
                <el-input
                  v-model="courseSearchKeyword"
                  placeholder="搜索课程..."
                  :prefix-icon="Search"
                  clearable
                />
              </el-col>
            </el-row>
          </div>

          <div class="courses-grid">
            <div
              v-for="course in filteredCourses"
              :key="course.id"
              class="course-card"
            >
              <div class="course-cover">
                <img v-if="course.coverImage" :src="course.coverImage" :alt="course.title" />
                <div v-else class="default-cover">
                  <el-icon><Reading /></el-icon>
                </div>
                <div class="course-duration">{{ course.duration }}课时</div>
              </div>

              <div class="course-info">
                <h4>{{ course.title }}</h4>
                <div class="course-meta">
                  <el-tag :type="getSubjectColor(course.subject)" size="small">
                    {{ getSubjectLabel(course.subject) }}
                  </el-tag>
                  <el-tag type="info" size="small">{{ course.grade }}</el-tag>
                  <el-tag :type="getDifficultyColor(course.difficulty)" size="small">
                    {{ getDifficultyLabel(course.difficulty) }}
                  </el-tag>
                </div>
                <p class="course-description">{{ course.description }}</p>
                <div class="course-stats">
                  <span class="chapters-count">{{ course.chapterCount }} 章节</span>
                  <span class="experiments-count">{{ course.experimentCount }} 实验</span>
                </div>
              </div>

              <div class="course-actions">
                <el-button size="small" @click="previewCourse(course)">
                  <el-icon><View /></el-icon>
                  预览
                </el-button>
                <el-button type="primary" size="small" @click="assignCourse(course)">
                  <el-icon><Plus /></el-icon>
                  分配
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 分配模板 -->
      <el-tab-pane label="分配模板" name="templates">
        <div class="tab-content">
          <div class="templates-header">
            <div class="templates-title">
              <h3>分配模板</h3>
              <p>创建和管理课程分配模板，提高分配效率</p>
            </div>
            <div class="templates-actions">
              <el-button type="primary" @click="showCreateTemplateModal = true">
                <el-icon><Plus /></el-icon>
                创建模板
              </el-button>
            </div>
          </div>

          <div class="templates-grid">
            <div
              v-for="template in templatesList"
              :key="template.id"
              class="template-card"
            >
              <div class="template-header">
                <div class="template-icon">
                  <el-icon><Document /></el-icon>
                </div>
                <div class="template-info">
                  <h4>{{ template.name }}</h4>
                  <p>{{ template.description }}</p>
                </div>
              </div>

              <div class="template-content">
                <div class="template-details">
                  <div class="detail-item">
                    <span class="detail-label">包含课程</span>
                    <span class="detail-value">{{ template.courseCount }} 门</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">适用年级</span>
                    <span class="detail-value">{{ template.targetGrade }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">使用次数</span>
                    <span class="detail-value">{{ template.usageCount }} 次</span>
                  </div>
                </div>

                <div class="template-courses">
                  <div class="courses-title">包含课程：</div>
                  <div class="courses-list">
                    <el-tag
                      v-for="course in template.courses.slice(0, 3)"
                      :key="course"
                      size="small"
                      class="course-tag"
                    >
                      {{ course }}
                    </el-tag>
                    <el-tag v-if="template.courses.length > 3" size="small" type="info">
                      +{{ template.courses.length - 3 }}
                    </el-tag>
                  </div>
                </div>
              </div>

              <div class="template-actions">
                <el-button size="small" @click="useTemplate(template)">
                  <el-icon><Check /></el-icon>
                  使用模板
                </el-button>
                <el-dropdown @command="(command) => handleTemplateAction(command, template)">
                  <el-button size="small" text>
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="edit">
                        <el-icon><Edit /></el-icon>
                        编辑模板
                      </el-dropdown-item>
                      <el-dropdown-item command="copy">
                        <el-icon><CopyDocument /></el-icon>
                        复制模板
                      </el-dropdown-item>
                      <el-dropdown-item command="delete" divided>
                        <el-icon><Delete /></el-icon>
                        删除模板
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 分配课程对话框 -->
    <el-dialog v-model="showAssignModal" title="分配课程" width="600px">
      <el-form :model="assignForm" :rules="assignRules" label-width="100px">
        <el-form-item label="选择课程" prop="courseId">
          <el-select v-model="assignForm.courseId" placeholder="请选择课程" style="width: 100%">
            <el-option
              v-for="course in availableCourses"
              :key="course.id"
              :label="course.title"
              :value="course.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="选择班级" prop="classId">
          <el-select v-model="assignForm.classId" placeholder="请选择班级" style="width: 100%">
            <el-option
              v-for="cls in classList"
              :key="cls.id"
              :label="cls.name"
              :value="cls.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="授课教师" prop="teacherId">
          <el-select v-model="assignForm.teacherId" placeholder="请选择教师" style="width: 100%">
            <el-option
              v-for="teacher in teacherList"
              :key="teacher.id"
              :label="teacher.name"
              :value="teacher.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="计划开始" prop="plannedStartDate">
          <el-date-picker
            v-model="assignForm.plannedStartDate"
            type="date"
            placeholder="选择开始日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="预计完成" prop="plannedEndDate">
          <el-date-picker
            v-model="assignForm.plannedEndDate"
            type="date"
            placeholder="选择完成日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="assignForm.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showAssignModal = false">取消</el-button>
        <el-button type="primary" :loading="assigning" @click="saveAssignment">
          确认分配
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Reading, Plus, Refresh, Document, Clock, Check, User, Search, RefreshLeft,
  MoreFilled, Edit, DataAnalysis, VideoPause, VideoPlay, Close, Upload,
  View, CopyDocument, Delete
} from '@element-plus/icons-vue'

interface Assignment {
  id: string
  courseId: string
  courseTitle: string
  classId: string
  className: string
  teacherId: string
  teacherName: string
  subject: string
  status: 'pending' | 'active' | 'completed' | 'paused'
  assignedDate: string
  plannedStartDate: string
  plannedEndDate: string
  progress: number
  completedChapters: number
  totalChapters: number
  averageStudentProgress: number
  totalStudents: number
  activeStudents: number
  completedStudents: number
}

interface Course {
  id: string
  title: string
  description: string
  subject: string
  grade: string
  difficulty: string
  duration: number
  chapterCount: number
  experimentCount: number
  coverImage?: string
}

interface Template {
  id: string
  name: string
  description: string
  targetGrade: string
  courseCount: number
  courses: string[]
  usageCount: number
}

// 响应式数据
const activeTab = ref('assignments')
const classFilter = ref('')
const subjectFilter = ref('')
const statusFilter = ref('')
const searchKeyword = ref('')
const courseSubjectFilter = ref('')
const courseGradeFilter = ref('')
const courseSearchKeyword = ref('')
const showAssignModal = ref(false)
const showCreateTemplateModal = ref(false)
const assigning = ref(false)

const totalAssignments = ref(24)
const activeAssignments = ref(8)
const completedAssignments = ref(12)
const totalAffectedStudents = ref(186)

const assignForm = ref({
  courseId: '',
  classId: '',
  teacherId: '',
  plannedStartDate: '',
  plannedEndDate: '',
  notes: ''
})

const assignRules = {
  courseId: [{ required: true, message: '请选择课程', trigger: 'change' }],
  classId: [{ required: true, message: '请选择班级', trigger: 'change' }],
  teacherId: [{ required: true, message: '请选择教师', trigger: 'change' }],
  plannedStartDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  plannedEndDate: [{ required: true, message: '请选择完成日期', trigger: 'change' }]
}

// 模拟数据
const assignmentList = ref<Assignment[]>([
  {
    id: '1',
    courseId: 'c1',
    courseTitle: '高中数学基础',
    classId: 'cl1',
    className: '高一(1)班',
    teacherId: 't1',
    teacherName: '张老师',
    subject: 'math',
    status: 'active',
    assignedDate: '2024-01-15',
    plannedStartDate: '2024-01-20',
    plannedEndDate: '2024-03-20',
    progress: 65,
    completedChapters: 8,
    totalChapters: 12,
    averageStudentProgress: 72,
    totalStudents: 45,
    activeStudents: 42,
    completedStudents: 5
  },
  {
    id: '2',
    courseId: 'c2',
    courseTitle: '物理实验入门',
    classId: 'cl2',
    className: '高一(2)班',
    teacherId: 't2',
    teacherName: '李老师',
    subject: 'physics',
    status: 'pending',
    assignedDate: '2024-01-18',
    plannedStartDate: '2024-02-01',
    plannedEndDate: '2024-04-01',
    progress: 0,
    completedChapters: 0,
    totalChapters: 8,
    averageStudentProgress: 0,
    totalStudents: 42,
    activeStudents: 0,
    completedStudents: 0
  }
])

const classList = ref([
  { id: 'cl1', name: '高一(1)班' },
  { id: 'cl2', name: '高一(2)班' },
  { id: 'cl3', name: '高二(1)班' }
])

const teacherList = ref([
  { id: 't1', name: '张老师' },
  { id: 't2', name: '李老师' },
  { id: 't3', name: '王老师' }
])

const availableCourses = ref<Course[]>([
  {
    id: 'c1',
    title: '高中数学基础',
    description: '涵盖高中数学基础知识点',
    subject: 'math',
    grade: 'grade10',
    difficulty: 'intermediate',
    duration: 48,
    chapterCount: 12,
    experimentCount: 4
  },
  {
    id: 'c2',
    title: '物理实验入门',
    description: '基础物理实验课程',
    subject: 'physics',
    grade: 'grade10',
    difficulty: 'beginner',
    duration: 32,
    chapterCount: 8,
    experimentCount: 12
  }
])

const coursesList = ref<Course[]>([
  ...availableCourses.value,
  {
    id: 'c3',
    title: '化学原理',
    description: '化学基础原理学习',
    subject: 'chemistry',
    grade: 'grade11',
    difficulty: 'intermediate',
    duration: 40,
    chapterCount: 10,
    experimentCount: 8
  }
])

const templatesList = ref<Template[]>([
  {
    id: 't1',
    name: '高一理科套餐',
    description: '适合高一理科班的标准课程组合',
    targetGrade: '高一',
    courseCount: 4,
    courses: ['高中数学基础', '物理实验入门', '化学原理', '生物基础'],
    usageCount: 12
  },
  {
    id: 't2',
    name: '进阶提升套餐',
    description: '为学习能力较强的学生设计的进阶课程',
    targetGrade: '高二',
    courseCount: 3,
    courses: ['高等数学', '进阶物理', '有机化学'],
    usageCount: 8
  }
])

// 计算属性
const filteredAssignments = computed(() => {
  let filtered = assignmentList.value

  if (classFilter.value) {
    filtered = filtered.filter(a => a.classId === classFilter.value)
  }

  if (subjectFilter.value) {
    filtered = filtered.filter(a => a.subject === subjectFilter.value)
  }

  if (statusFilter.value) {
    filtered = filtered.filter(a => a.status === statusFilter.value)
  }

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(a =>
      a.courseTitle.toLowerCase().includes(keyword) ||
      a.className.toLowerCase().includes(keyword)
    )
  }

  return filtered
})

const filteredCourses = computed(() => {
  let filtered = coursesList.value

  if (courseSubjectFilter.value) {
    filtered = filtered.filter(c => c.subject === courseSubjectFilter.value)
  }

  if (courseGradeFilter.value) {
    filtered = filtered.filter(c => c.grade === courseGradeFilter.value)
  }

  if (courseSearchKeyword.value) {
    const keyword = courseSearchKeyword.value.toLowerCase()
    filtered = filtered.filter(c =>
      c.title.toLowerCase().includes(keyword) ||
      c.description.toLowerCase().includes(keyword)
    )
  }

  return filtered
})

// 方法
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
    'paused': 'warning'
  }
  return colors[status as keyof typeof colors] || ''
}

const getStatusLabel = (status: string) => {
  const labels = {
    'pending': '未开始',
    'active': '进行中',
    'completed': '已完成',
    'paused': '已暂停'
  }
  return labels[status as keyof typeof labels] || status
}

const getDifficultyColor = (difficulty: string) => {
  const colors = {
    'beginner': 'success',
    'intermediate': 'warning',
    'advanced': 'danger'
  }
  return colors[difficulty as keyof typeof colors] || 'info'
}

const getDifficultyLabel = (difficulty: string) => {
  const labels = {
    'beginner': '入门',
    'intermediate': '进阶',
    'advanced': '高级'
  }
  return labels[difficulty as keyof typeof labels] || difficulty
}

const handleAssignmentAction = (command: string, assignment: Assignment) => {
  switch (command) {
    case 'edit':
      ElMessage.info(`编辑分配: ${assignment.courseTitle}`)
      break
    case 'schedule':
      ElMessage.info(`安排进度: ${assignment.courseTitle}`)
      break
    case 'report':
      ElMessage.info(`查看报告: ${assignment.courseTitle}`)
      break
    case 'pause':
      ElMessage.warning(`暂停课程: ${assignment.courseTitle}`)
      assignment.status = 'paused'
      break
    case 'resume':
      ElMessage.success(`恢复课程: ${assignment.courseTitle}`)
      assignment.status = 'active'
      break
    case 'cancel':
      ElMessage.warning(`取消分配: ${assignment.courseTitle}`)
      break
  }
}

const handleTemplateAction = (command: string, template: Template) => {
  switch (command) {
    case 'edit':
      ElMessage.info(`编辑模板: ${template.name}`)
      break
    case 'copy':
      ElMessage.success(`复制模板: ${template.name}`)
      break
    case 'delete':
      ElMessage.warning(`删除模板: ${template.name}`)
      break
  }
}

const viewStudentList = (assignment: Assignment) => {
  ElMessage.info(`查看学生列表: ${assignment.courseTitle}`)
}

const previewCourse = (course: Course) => {
  ElMessage.info(`预览课程: ${course.title}`)
}

const assignCourse = (course: Course) => {
  assignForm.value.courseId = course.id
  showAssignModal.value = true
}

const useTemplate = (template: Template) => {
  ElMessage.success(`使用模板: ${template.name}`)
}

const resetFilters = () => {
  classFilter.value = ''
  subjectFilter.value = ''
  statusFilter.value = ''
  searchKeyword.value = ''
}

const refreshData = () => {
  ElMessage.success('数据刷新成功')
}

const importCourses = () => {
  ElMessage.info('导入课程功能开发中...')
}

const saveAssignment = async () => {
  try {
    assigning.value = true
    await new Promise(resolve => setTimeout(resolve, 1000))

    const newAssignment: Assignment = {
      id: `assignment_${Date.now()}`,
      courseId: assignForm.value.courseId,
      courseTitle: availableCourses.value.find(c => c.id === assignForm.value.courseId)?.title || '',
      classId: assignForm.value.classId,
      className: classList.value.find(c => c.id === assignForm.value.classId)?.name || '',
      teacherId: assignForm.value.teacherId,
      teacherName: teacherList.value.find(t => t.id === assignForm.value.teacherId)?.name || '',
      subject: availableCourses.value.find(c => c.id === assignForm.value.courseId)?.subject || '',
      status: 'pending',
      assignedDate: new Date().toISOString().split('T')[0],
      plannedStartDate: assignForm.value.plannedStartDate,
      plannedEndDate: assignForm.value.plannedEndDate,
      progress: 0,
      completedChapters: 0,
      totalChapters: availableCourses.value.find(c => c.id === assignForm.value.courseId)?.chapterCount || 0,
      averageStudentProgress: 0,
      totalStudents: 0,
      activeStudents: 0,
      completedStudents: 0
    }

    assignmentList.value.unshift(newAssignment)
    ElMessage.success('课程分配成功')
    showAssignModal.value = false

    // 重置表单
    assignForm.value = {
      courseId: '',
      classId: '',
      teacherId: '',
      plannedStartDate: '',
      plannedEndDate: '',
      notes: ''
    }
  } catch (error) {
    ElMessage.error('课程分配失败')
  } finally {
    assigning.value = false
  }
}

onMounted(() => {
  // 初始化数据
})
</script>

<style lang="scss" scoped>
.course-assignment {
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

.assignment-stats {
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

    &.total {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    &.active {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    &.completed {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }

    &.students {
      background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
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

.assignment-tabs {
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

.filter-toolbar {
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-base);
  background: var(--edu-bg-secondary);
  border-radius: var(--edu-radius-lg);
  border: 1px solid var(--edu-border-light);
}

.assignment-list {
  .assignment-card {
    background: var(--edu-bg-primary);
    border: 1px solid var(--edu-border-light);
    border-radius: var(--edu-radius-lg);
    margin-bottom: var(--spacing-base);
    overflow: hidden;
    transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

    &:hover {
      box-shadow: var(--edu-shadow-md);
    }
  }

  .assignment-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: var(--spacing-lg);
    background: var(--edu-bg-secondary);
    border-bottom: 1px solid var(--edu-border-light);

    .assignment-info {
      flex: 1;

      h4 {
        margin: 0 0 var(--spacing-sm) 0;
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-semibold);
        color: var(--edu-text-primary);
      }

      .assignment-meta {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);

        .class-name {
          font-size: var(--font-size-sm);
          color: var(--edu-text-secondary);
        }
      }
    }
  }

  .assignment-content {
    padding: var(--spacing-lg);
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;
    gap: var(--spacing-lg);

    .assignment-details {
      .detail-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-sm);

        .detail-label {
          font-size: var(--font-size-sm);
          color: var(--edu-text-secondary);
        }

        .detail-value {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--edu-text-primary);
        }
      }
    }

    .assignment-progress {
      .progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-sm);

        .progress-label {
          font-size: var(--font-size-sm);
          color: var(--edu-text-secondary);
        }

        .progress-value {
          font-weight: var(--font-weight-semibold);
          color: var(--edu-primary-600);
        }
      }

      .progress-details {
        display: flex;
        justify-content: space-between;
        margin-top: var(--spacing-sm);
        font-size: var(--font-size-xs);
        color: var(--edu-text-tertiary);
      }
    }

    .assignment-students {
      .students-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-sm);

        .students-label {
          font-size: var(--font-size-sm);
          color: var(--edu-text-secondary);
        }
      }

      .students-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--spacing-sm);
        text-align: center;

        .stat-item {
          .stat-number {
            display: block;
            font-size: var(--font-size-lg);
            font-weight: var(--font-weight-bold);
            color: var(--edu-text-primary);
          }

          .stat-text {
            font-size: var(--font-size-xs);
            color: var(--edu-text-tertiary);
          }
        }
      }
    }
  }
}

.courses-header, .templates-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-lg);

  .courses-title, .templates-title {
    h3 {
      margin: 0 0 var(--spacing-xs) 0;
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--edu-text-primary);
    }

    p {
      margin: 0;
      color: var(--edu-text-secondary);
      font-size: var(--font-size-sm);
    }
  }
}

.courses-filter {
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-base);
  background: var(--edu-bg-secondary);
  border-radius: var(--edu-radius-lg);
  border: 1px solid var(--edu-border-light);
}

.courses-grid, .templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-lg);
}

.course-card, .template-card {
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

.course-cover {
  position: relative;
  height: 140px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .default-cover {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;

    .el-icon {
      font-size: 48px;
      color: white;
      opacity: 0.6;
    }
  }

  .course-duration {
    position: absolute;
    top: var(--spacing-sm);
    right: var(--spacing-sm);
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-full);
    font-size: var(--font-size-xs);
  }
}

.course-info {
  padding: var(--spacing-base);

  h4 {
    margin: 0 0 var(--spacing-sm) 0;
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--edu-text-primary);
  }

  .course-meta {
    display: flex;
    gap: var(--spacing-xs);
    margin-bottom: var(--spacing-sm);
  }

  .course-description {
    font-size: var(--font-size-sm);
    color: var(--edu-text-secondary);
    margin: 0 0 var(--spacing-sm) 0;
    line-height: var(--edu-leading-normal);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .course-stats {
    display: flex;
    gap: var(--spacing-sm);
    font-size: var(--font-size-xs);
    color: var(--edu-text-tertiary);
  }
}

.course-actions, .template-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-base);
  background: var(--edu-bg-secondary);
  border-top: 1px solid var(--edu-border-light);
}

.template-header {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-base);
  padding: var(--spacing-lg);

  .template-icon {
    width: 48px;
    height: 48px;
    background: var(--edu-primary-100);
    border-radius: var(--edu-radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--edu-primary-600);

    .el-icon {
      font-size: 24px;
    }
  }

  .template-info {
    flex: 1;

    h4 {
      margin: 0 0 var(--spacing-xs) 0;
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-semibold);
      color: var(--edu-text-primary);
    }

    p {
      margin: 0;
      font-size: var(--font-size-sm);
      color: var(--edu-text-secondary);
      line-height: var(--edu-leading-normal);
    }
  }
}

.template-content {
  padding: 0 var(--spacing-lg) var(--spacing-lg);

  .template-details {
    margin-bottom: var(--spacing-base);

    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-xs);

      .detail-label {
        font-size: var(--font-size-sm);
        color: var(--edu-text-secondary);
      }

      .detail-value {
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
        color: var(--edu-text-primary);
      }
    }
  }

  .template-courses {
    .courses-title {
      font-size: var(--font-size-sm);
      color: var(--edu-text-secondary);
      margin-bottom: var(--spacing-xs);
    }

    .courses-list {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-xs);

      .course-tag {
        margin: 0;
      }
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: var(--spacing-base);
    align-items: stretch;
  }

  .assignment-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .assignment-content {
    grid-template-columns: 1fr;
    gap: var(--spacing-base);
  }

  .courses-grid, .templates-grid {
    grid-template-columns: 1fr;
  }

  .courses-header, .templates-header {
    flex-direction: column;
    gap: var(--spacing-base);
    align-items: stretch;
  }
}
</style>