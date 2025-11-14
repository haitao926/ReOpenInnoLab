# ReOpenInnoLab 命名规范

## 概述

本文档定义了 ReOpenInnoLab 项目中各组件的命名规范，确保代码的一致性、可读性和可维护性。

## 通用原则

### 1. 语言选择
- **英文命名**: 所有代码、数据库、API 均使用英文命名
- **避免拼音**: 禁止使用拼音或中英文混合
- **语义化**: 命名应该具有明确的业务含义

### 2. 大小写规范
- **小写开头**: 变量、函数使用小写开头
- **大写开头**: 类、接口、枚举使用大写开头
- **全大写**: 常量使用全大写
- **kebab-case**: URL、文件名使用短横线分隔

### 3. 长度控制
- **简洁明了**: 名称应简洁但足够描述性
- **避免过长**: 一般不超过 30 个字符
- **避免缩写**: 除非是广为人知的缩写

## 数据库命名规范

### 表命名 (Tables)
```sql
-- ✅ 正确: 单数形式，小写，下划线分隔
user
user_session
course_version
class_member

-- ❌ 错误: 复数形式，驼峰命名
users
userSessions
courseVersions
```

### 字段命名 (Columns)
```sql
-- ✅ 正确: 小写，下划线分隔，语义明确
id
user_id
first_name
created_at
is_active

-- ❌ 错误: 驼峰命名，无语义
ID
userId
firstName
createTime
active
```

#### 主键和外键
```sql
-- ✅ 正确
id              -- 主键
user_id         -- 外键指向 users.id
course_id       -- 外键指向 courses.id

-- ❌ 错误
uuid
userUuid
courseUUID
```

#### 时间字段
```sql
-- ✅ 正确
created_at
updated_at
deleted_at
published_at
expires_at

-- ❌ 错误
createTime
updateTime
deleteTime
publish_date
expire
```

#### 布尔字段
```sql
-- ✅ 正确
is_active
is_verified
is_published
has_permission

-- ❌ 错误
active
verified
published
permission
```

#### JSON 字段
```sql
-- ✅ 正确
metadata
profile_json
schedule_json
settings_json

-- ❌ 错误
json_data
profile
schedule
config
```

### 索引命名 (Indexes)
```sql
-- ✅ 正确: idx_{table}_{column(s)}
idx_users_email
idx_user_sessions_user_active
idx_class_members_classroom_role

-- ❌ 错误
users_email_index
user_sessions_index
ix_class_members
```

### 外键约束命名 (Foreign Keys)
```sql
-- ✅ 正确: fk_{table}_{column}
fk_users_tenant_id
fk_user_sessions_user_id

-- ❌ 错误
users_tenant_id_fkey
session_user_fk
```

## API 命名规范

### URL 路径
```typescript
// ✅ 正确: 小写，复数资源，短横线分隔
GET    /api/v1/users
GET    /api/v1/users/{id}
POST   /api/v1/users
PUT    /api/v1/users/{id}
DELETE /api/v1/users/{id}

GET    /api/v1/classrooms/{id}/members
POST   /api/v1/courses/{id}/versions

// ❌ 错误: 驼峰命名，单数资源
GET    /api/v1/user
GET    /api/v1/user/{id}
GET    /api/v1/classrooms/{id}/classMember
```

### HTTP 方法语义
```typescript
// ✅ 正确: RESTful 语义
GET    /api/v1/courses           // 获取课程列表
POST   /api/v1/courses           // 创建课程
GET    /api/v1/courses/{id}      // 获取特定课程
PUT    /api/v1/courses/{id}      // 更新课程
DELETE /api/v1/courses/{id}      // 删除课程

// ✅ 正确: 嵌套资源
GET    /api/v1/courses/{id}/modules
POST   /api/v1/courses/{id}/modules
GET    /api/v1/classrooms/{id}/members
POST   /api/v1/classrooms/{id}/members
```

### 查询参数
```typescript
// ✅ 正确: 小写，短横线分隔
GET /api/v1/users?page=1&limit=20&sort=created_at&order=desc
GET /api/v1/courses?status=published&grade-band=g1,g2
GET /api/v1/classrooms?search=math&type=regular

// ❌ 错误: 驼峰命名，不一致
GET /api/v1/users?pageNumber=1&pageSize=20&sortBy=createdAt
GET /api/v1/courses?Status=published&gradeBand=g1,g2
```

## 代码命名规范

### TypeScript/JavaScript

#### 变量和函数
```typescript
// ✅ 正确: camelCase，语义化
const userName = 'john_doe';
const isLoggedIn = true;
const getUserById = (id: string) => {};
const createCourse = (data: CourseData) => {};

// ❌ 错误: 无语义，不一致
const name = 'john_doe';
const flag = true;
const getUser = (id: string) => {};
const create = (data: CourseData) => {};
```

#### 类和接口
```typescript
// ✅ 正确: PascalCase，描述性
class UserService {}
interface CourseData {}
type UserRole = 'admin' | 'teacher';
enum CourseStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

// ❌ 错误: 无意义，不一致
class service {}
interface data {}
type role = 'admin' | 'teacher';
enum status {
  DRAFT = 'draft',
}
```

#### 常量
```typescript
// ✅ 正确: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const DEFAULT_PAGE_SIZE = 20;
const API_BASE_URL = 'https://api.example.com';

// ❌ 错误
const maxSize = 10 * 1024 * 1024;
const defaultPageSize = 20;
const apiUrl = 'https://api.example.com';
```

#### 枚举
```typescript
// ✅ 正确: PascalCase 类型，小写值
enum UserType {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin',
}

enum CourseStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

// ❌ 错误: 不一致的命名
enum userType {
  student = 'student',
  Teacher = 'teacher',
  ADMIN_USER = 'admin',
}
```

### React 组件

#### 组件文件名
```typescript
// ✅ 正确: PascalCase
// UserProfile.tsx
// CourseList.tsx
// ClassRoomCard.tsx
// AssignmentForm.tsx

// ❌ 错误
// userProfile.tsx
// course-list.tsx
// classroomcard.tsx
```

#### 组件名称
```typescript
// ✅ 正确: PascalCase，描述性
const UserProfile: React.FC<UserProfileProps> = () => {};
const CourseList: React.FC<CourseListProps> = () => {};
const ClassRoomCard: React.FC<ClassRoomCardProps> = () => {};

// ❌ 错误
const userprofile = () => {};
const Component1 = () => {};
const card = () => {};
```

#### Props 接口
```typescript
// ✅ 正确: 组件名 + Props
interface UserProfileProps {
  userId: string;
  onUpdate: (user: User) => void;
}

interface CourseListProps {
  courses: Course[];
  loading?: boolean;
  onCourseSelect: (courseId: string) => void;
}

// ❌ 错误
interface Props {
  userId: string;
  onUpdate: (user: User) => void;
}

interface CourseProps {
  items: Course[];
  flag?: boolean;
  click: (courseId: string) => void;
}
```

### 服务类命名

```typescript
// ✅ 正确: Entity + Service
class UserService {}
class CourseService {}
class ClassroomService {}
class AssignmentService {}
class NotificationService {}

// ✅ 正确: 功能描述 + Service
class AuthService {}
class FileUploadService {}
class EmailService {}
class CacheService {}

// ❌ 错误
class User {}
class CourseManager {}
class ClassroomHandler {}
class AssignmentHelper {}
```

### 存储命名 (Stores/Pinia)

```typescript
// ✅ 正确: use + Entity + Store
const useUserStore = defineStore('user', () => {});
const useCourseStore = defineStore('course', () => {});
const useClassroomStore = defineStore('classroom', () => {});

// ✅ 正确: 功能描述 + Store
const useAuthStore = defineStore('auth', () => {});
const useAppStore = defineStore('app', () => {});

// ❌ 错误
const user = defineStore('user', () => {});
const courseData = defineStore('course', () => {});
const classroomState = defineStore('classroom', () => {});
```

## 文件和目录命名

### 目录结构
```
src/
├── components/          # 可复用组件
│   ├── ui/             # UI 基础组件
│   ├── forms/          # 表单组件
│   └── common/         # 通用组件
├── views/              # 页面组件
│   ├── auth/           # 认证相关页面
│   ├── courses/        # 课程相关页面
│   └── classrooms/     # 班级相关页面
├── services/           # 业务服务
├── stores/             # 状态管理
├── utils/              # 工具函数
├── types/              # 类型定义
├── api/                # API 接口
└── assets/             # 静态资源
    ├── images/
    ├── styles/
    └── fonts/
```

### 文件命名
```typescript
// ✅ 正确
// components/UserProfile.tsx
// views/courses/CourseList.tsx
// services/UserService.ts
// stores/useUserStore.ts
// types/user.types.ts
// utils/validation.ts
// api/auth.ts

// ❌ 错误
// components/userprofile.tsx
// views/Courses/courselist.tsx
// services/userService.ts
// stores/user.ts
// types/UserTypes.ts
// utils/Validation.ts
// api/Authentication.ts
```

## 环境变量命名

### 环境变量前缀
```bash
# ✅ 正确: VITE_ + 功能模块 + 变量名
VITE_API_BASE_URL=http://localhost:3002
VITE_APP_TITLE=ReOpenInnoLab
VITE_ENABLE_MOCK_API=false
VITE_REDIS_URL=redis://localhost:6379
VITE_DATABASE_URL=postgresql://...

# ❌ 错误: 无前缀或不一致
API_BASE_URL=http://localhost:3002
APP_TITLE=ReOpenInnoLab
MOCK_API=false
REDIS=redis://localhost:6379
DATABASE=postgresql://...
```

### 分类命名
```bash
# API 配置
VITE_API_BASE_URL
VITE_API_TIMEOUT
VITE_API_VERSION

# 应用配置
VITE_APP_TITLE
VITE_APP_VERSION
VITE_APP_ENVIRONMENT

# 功能开关
VITE_ENABLE_MOCK_API
VITE_ENABLE_ANALYTICS
VITE_ENABLE_DEBUG_MODE

# 第三方服务
VITE_GOOGLE_CLIENT_ID
VITE_WECHAT_APP_ID
VITE_SENTRY_DSN

# 数据库配置
VITE_DATABASE_URL
VITE_REDIS_URL
VITE_MINIO_ENDPOINT
```

## Git 命名规范

### 分支命名
```bash
# ✅ 正确: 类型/描述
feature/user-authentication
feature/course-management
fix/login-validation-bug
hotfix/security-patch
refactor/database-schema
docs/api-documentation
release/v1.0.0

# ❌ 错误: 无意义或不一致
user-auth
feature1
bugfix
fix-stuff
temp-branch
```

### 提交信息
```bash
# ✅ 正确: 类型(范围): 描述
feat(auth): add user login functionality
fix(classroom): resolve member loading issue
docs(api): update authentication endpoints
refactor(database): optimize user queries
style(ui): improve button hover effects
test(user): add unit tests for registration
chore(deps): update typeorm to v0.3

# ❌ 错误: 无意义或不规范
add login
fix bug
update stuff
work in progress
temp commit
```

## 测试命名规范

### 测试文件命名
```typescript
// ✅ 正确: {name}.test.ts 或 {name}.spec.ts
// UserService.test.ts
// CourseController.spec.ts
// UserProfile.test.tsx
// validation.test.ts

// ❌ 错误
// UserService_tests.ts
// CourseControllerSpec.tsx
// test_UserService.ts
```

### 测试函数命名
```typescript
// ✅ 正确: should + 预期行为 + when + 条件
describe('UserService', () => {
  it('should create user when valid data provided', async () => {
    // test implementation
  });

  it('should throw error when email already exists', async () => {
    // test implementation
  });

  it('should return user by id when user exists', async () => {
    // test implementation
  });
});

// ❌ 错误: 无意义的测试名
describe('UserService', () => {
  it('test create user', async () => {});
  it('test duplicate email', async () => {});
  it('test get user', async () => {});
});
```

## 错误处理命名

### 错误类命名
```typescript
// ✅ 正确: Domain + Error
class AuthenticationError extends Error {}
class ValidationError extends Error {}
class NotFoundError extends Error {}
class DatabaseError extends Error {}
class PermissionError extends Error {}

// ❌ 错误: 不一致或无意义
class AuthErr extends Error {}
class ValidError extends Error {}
class Error404 extends Error {}
class DBError extends Error {}
class CustomError extends Error {}
```

### 错误代码命名
```typescript
// ✅ 正确: SERVICE_ERROR_CODE
const ERROR_CODES = {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_001',
  AUTH_TOKEN_EXPIRED: 'AUTH_002',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_003',

  // Validation errors
  VALIDATION_REQUIRED_FIELD: 'VAL_001',
  VALIDATION_INVALID_FORMAT: 'VAL_002',
  VALIDATION_DUPLICATE_VALUE: 'VAL_003',

  // Business logic errors
  COURSE_NOT_FOUND: 'COURSE_001',
  CLASSROOM_FULL: 'CLASSROOM_001',
  ASSIGNMENT_PAST_DUE: 'ASSIGNMENT_001',
} as const;

// ❌ 错误: 不一致或无意义
const ERRORS = {
  INVALID_CREDENTIALS: 'error_1',
  TOKEN_EXPIRED: 'token_expired_error',
  NO_PERMISSION: '403',
  REQUIRED: 'validation_error',
  DUPLICATE: 'duplicate_error',
};
```

## CSS/样式命名

### BEM 命名规范
```css
/* ✅ 正确: Block__Element--Modifier */
.user-card {}
.user-card__avatar {}
.user-card__name {}
.user-card__name--highlighted {}
.user-card--featured {}
.user-card--featured__avatar {}

/* ❌ 错误: 不一致的命名 */
.userCard {}
.user_card_avatar {}
.userNameHighlighted {}
.featuredUserCard {}
```

### CSS 类命名
```css
/* ✅ 正确: 功能导向，小写，短横线分隔 */
.btn-primary {}
.btn-secondary {}
.form-input {}
.form-label {}
.nav-item {}
.sidebar-container {}
.loading-spinner {}

/* ❌ 错误: 视觉导向或不一致 */
.blue-button {}
.red-text {}
.big-font {}
.div1 {}
.container2 {}
```

## 总结

### 检查清单
- [ ] 所有命名使用英文
- [ ] 名称具有明确的业务含义
- [ ] 遵循相应的大小写规范
- [ ] 保持命名风格一致性
- [ ] 避免使用无意义的缩写
- [ ] 文件名与内容匹配
- [ ] 避免命名冲突

### 工具推荐
- **ESLint**: 代码风格检查
- **Prettier**: 代码格式化
- **TypeScript**: 类型检查
- **Husky**: Git hooks 管理
- **Commitizen**: 标准化提交信息

遵循这些命名规范将大大提高代码的可读性、可维护性和团队协作效率。