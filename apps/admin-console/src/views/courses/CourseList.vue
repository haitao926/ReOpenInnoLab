<template>
  <div class="course-list">
    <div class="page-header">
      <el-row :gutter="16" justify="space-between">
        <el-col :span="16">
          <el-input
            v-model="searchQuery"
            placeholder="搜索课程..."
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="8" style="text-align: right;">
          <el-button type="primary" @click="handleAddCourse">
            <el-icon><Plus /></el-icon>
            新增课程
          </el-button>
        </el-col>
      </el-row>
    </div>

    <el-table
      v-loading="loading"
      :data="filteredCourses"
      style="width: 100%"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="title" label="课程名称" min-width="200" />
      <el-table-column prop="instructor" label="讲师" width="120" />
      <el-table-column prop="category" label="分类" width="100" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="学生数" width="100">
        <template #default="{ row }">
          {{ row.studentCount || 0 }}
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="handleView(row)">
            查看
          </el-button>
          <el-button type="warning" size="small" @click="handleEdit(row)">
            编辑
          </el-button>
          <el-button type="danger" size="small" @click="handleDelete(row)">
            删除
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

    <CourseFormDialog
      v-model="dialogVisible"
      :course="selectedCourse"
      @success="handleFormSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/date'
import CourseFormDialog from '@/components/course/CourseFormDialog.vue'

interface Course {
  id: string
  title: string
  instructor: string
  category: string
  status: 'active' | 'inactive' | 'archived'
  studentCount: number
  createdAt: string
  updatedAt: string
}

const searchQuery = ref('')
const loading = ref(false)
const courses = ref<Course[]>([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const dialogVisible = ref(false)
const selectedCourse = ref<Course | null>(null)

const filteredCourses = computed(() => {
  if (!searchQuery.value) return courses.value
  return courses.value.filter(course =>
    course.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    course.instructor.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    course.category.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const getStatusType = (status: string) => {
  switch (status) {
    case 'active': return 'success'
    case 'inactive': return 'warning'
    case 'archived': return 'info'
    default: return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'active': return '活跃'
    case 'inactive': return '未激活'
    case 'archived': return '已归档'
    default: return '未知'
  }
}

const loadCourses = async () => {
  loading.value = true
  try {
    // Mock data - replace with actual API call
    courses.value = [
      {
        id: '1',
        title: '计算机科学基础',
        instructor: '张老师',
        category: '计算机',
        status: 'active',
        studentCount: 45,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T15:30:00Z'
      },
      {
        id: '2',
        title: '数据结构与算法',
        instructor: '李老师',
        category: '计算机',
        status: 'active',
        studentCount: 32,
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-25T14:20:00Z'
      }
    ]
    total.value = courses.value.length
  } catch (error) {
    ElMessage.error('加载课程列表失败')
    console.error('Failed to load courses:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleAddCourse = () => {
  selectedCourse.value = null
  dialogVisible.value = true
}

const handleView = (course: Course) => {
  ElMessage.info(`查看课程: ${course.title}`)
}

const handleEdit = (course: Course) => {
  selectedCourse.value = course
  dialogVisible.value = true
}

const handleDelete = async (course: Course) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除课程 "${course.title}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    // Mock delete - replace with actual API call
    const index = courses.value.findIndex(c => c.id === course.id)
    if (index > -1) {
      courses.value.splice(index, 1)
      total.value--
    }

    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleFormSuccess = () => {
  dialogVisible.value = false
  loadCourses()
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  loadCourses()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  loadCourses()
}

onMounted(() => {
  loadCourses()
})
</script>

<style scoped lang="scss">
.course-list {
  .page-header {
    margin-bottom: 24px;
  }

  .pagination {
    margin-top: 24px;
    text-align: right;
  }
}
</style>