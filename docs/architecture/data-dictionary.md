# ReOpenInnoLab 数据字典

## 概述

本文档定义了 ReOpenInnoLab 平台的数据字典和命名规范，确保整个系统的一致性和可维护性。

## 命名规范

### 通用命名规则

#### 字段命名规范
- **主键**: 统一使用 `id`，类型为 UUID
- **外键**: `{table}_id` 格式，如 `user_id`, `course_id`
- **时间戳**: `{action}_at` 格式，如 `created_at`, `updated_at`, `deleted_at`
- **布尔值**: `is_{property}` 格式，如 `is_active`, `is_verified`
- **JSON 字段**: `{field}_json` 格式，如 `metadata_json`, `schedule_json`
- **哈希字段**: `{field}_hash` 格式，如 `password_hash`, `token_hash`

#### 表命名规范
- **单数形式**: 所有表名使用单数形式，如 `user`, `course`, `classroom`
- **小写字母**: 全部使用小写字母
- **下划线分隔**: 多词使用下划线分隔，如 `user_sessions`, `course_versions`
- **关联表**: `{table1}_{table2}` 格式，如 `user_roles`, `role_permissions`

#### 枚举命名规范
- **PascalCase**: 枚举类型使用 PascalCase
- **描述性名称**: 枚举值使用小写字母和下划线，如 `ACTIVE`, `IN_PROGRESS`

## 核心实体数据字典

### 1. 租户管理 (Tenants)

#### `tenants` 表
| 字段名 | 类型 | 约束 | 描述 | 示例值 |
|--------|------|------|------|--------|
| id | UUID | PRIMARY KEY | 租户唯一标识 | `123e4567-e89b-12d3-a456-426614174000` |
| code | VARCHAR(50) | UNIQUE NOT NULL | 租户代码 | `school001` |
| name | VARCHAR(255) | NOT NULL | 租户名称 | `实验小学` |
| status | VARCHAR(20) | NOT NULL | 状态: `active`, `inactive`, `suspended` | `active` |
| plan | VARCHAR(50) | NOT NULL | 套餐: `basic`, `pro`, `enterprise` | `pro` |
| metadata | JSONB | DEFAULT '{}' | 扩展元数据 | `{"theme": "blue", "logo": "url"}` |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 创建时间 | `2024-01-01T10:00:00Z` |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 更新时间 | `2024-01-01T10:00:00Z` |

### 2. 用户管理 (Users)

#### `users` 表
| 字段名 | 类型 | 约束 | 描述 | 示例值 |
|--------|------|------|------|--------|
| id | UUID | PRIMARY KEY | 用户唯一标识 | `123e4567-e89b-12d3-a456-426614174001` |
| tenant_id | UUID | NOT NULL, FK | 所属租户 | `123e4567-e89b-12d3-a456-426614174000` |
| email | VARCHAR(255) | UNIQUE NOT NULL | 邮箱地址 | `teacher@school.com` |
| phone | VARCHAR(20) | NULLABLE | 手机号码 | `13800138000` |
| name | VARCHAR(255) | NOT NULL | 用户姓名 | `张老师` |
| password_hash | VARCHAR(255) | NOT NULL | 密码哈希 | `$2b$10$...` |
| role_type | VARCHAR(50) | NOT NULL | 角色: `student`, `teacher`, `admin`, `parent`, `researcher` | `teacher` |
| status | VARCHAR(20) | NOT NULL | 状态: `active`, `inactive`, `pending`, `suspended` | `active` |
| last_login_at | TIMESTAMPTZ | NULLABLE | 最后登录时间 | `2024-01-01T09:30:00Z` |
| profile_json | JSONB | DEFAULT '{}' | 个人资料JSON | `{"avatar": "url", "timezone": "Asia/Shanghai"}` |
| email_verified_at | TIMESTAMPTZ | NULLABLE | 邮箱验证时间 | `2024-01-01T08:00:00Z` |
| phone_verified_at | TIMESTAMPTZ | NULLABLE | 手机验证时间 | NULL |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 创建时间 | `2024-01-01T07:00:00Z` |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 更新时间 | `2024-01-01T07:00:00Z` |

### 3. 权限管理 (RBAC)

#### `roles` 表
| 字段名 | 类型 | 约束 | 描述 | 示例值 |
|--------|------|------|------|--------|
| id | UUID | PRIMARY KEY | 角色唯一标识 | `123e4567-e89b-12d3-a456-426614174002` |
| tenant_id | UUID | NULLABLE, FK | 所属租户 | `123e4567-e89b-12d3-a456-426614174000` |
| name | VARCHAR(100) | NOT NULL | 角色名称 | `数学老师` |
| description | TEXT | NULLABLE | 角色描述 | `负责数学课程教学` |
| is_system | BOOLEAN | DEFAULT FALSE | 是否系统角色 | `false` |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 创建时间 | `2024-01-01T07:00:00Z` |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 更新时间 | `2024-01-01T07:00:00Z` |

#### `permissions` 表
| 字段名 | 类型 | 约束 | 描述 | 示例值 |
|--------|------|------|------|--------|
| id | UUID | PRIMARY KEY | 权限唯一标识 | `123e4567-e89b-12d3-a456-426614174003` |
| name | VARCHAR(100) | UNIQUE NOT NULL | 权限名称 | `course:create` |
| resource | VARCHAR(100) | NOT NULL | 资源类型 | `course` |
| action | VARCHAR(50) | NOT NULL | 操作类型 | `create` |
| description | TEXT | NULLABLE | 权限描述 | `创建课程权限` |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 创建时间 | `2024-01-01T07:00:00Z` |

#### `user_roles` 关联表
| 字段名 | 类型 | 约束 | 描述 | 示例值 |
|--------|------|------|------|--------|
| user_id | UUID | PRIMARY KEY, FK | 用户ID | `123e4567-e89b-12d3-a456-426614174001` |
| role_id | UUID | PRIMARY KEY, FK | 角色ID | `123e4567-e89b-12d3-a456-426614174002` |
| assigned_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 分配时间 | `2024-01-01T08:00:00Z` |
| assigned_by | UUID | NULLABLE, FK | 分配人ID | `123e4567-e89b-12d3-a456-426614174004` |

### 4. 课程管理 (Courses)

#### `courses` 表
| 字段名 | 类型 | 约束 | 描述 | 示例值 |
|--------|------|------|------|--------|
| id | UUID | PRIMARY KEY | 课程唯一标识 | `123e4567-e89b-12d3-a456-426614174005` |
| tenant_id | UUID | NOT NULL, FK | 所属租户 | `123e4567-e89b-12d3-a456-426614174000` |
| code | VARCHAR(50) | NOT NULL | 课程代码 | `MATH101` |
| title | VARCHAR(255) | NOT NULL | 课程标题 | `小学数学基础` |
| description | TEXT | NULLABLE | 课程描述 | `适合小学1-3年级的数学基础课程` |
| grade_band | VARCHAR(20) | NOT NULL | 年级段: `k1`-`k3`, `g1`-`g12` | `g1` |
| subject | VARCHAR(100) | NOT NULL | 学科 | `数学` |
| delivery_mode | VARCHAR(20) | NOT NULL | 授课模式: `online`, `offline`, `hybrid`, `blended` | `hybrid` |
| status | VARCHAR(20) | NOT NULL | 状态: `draft`, `published`, `archived`, `deprecated` | `published` |
| estimated_hours | INTEGER | NULLABLE | 预计学时 | `48` |
| credit_hours | INTEGER | NULLABLE | 学分 | `3` |
| thumbnail | VARCHAR(500) | NULLABLE | 缩略图URL | `https://cdn.example.com/thumb.jpg` |
| metadata | JSONB | DEFAULT '{}' | 扩展元数据 | `{"difficulty": "easy", "prerequisites": []}` |
| created_by | UUID | NULLABLE, FK | 创建人ID | `123e4567-e89b-12d3-a456-426614174001` |
| updated_by | UUID | NULLABLE, FK | 更新人ID | `123e4567-e89b-12d3-a456-426614174001` |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 创建时间 | `2024-01-01T07:00:00Z` |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 更新时间 | `2024-01-01T07:00:00Z` |

#### `course_versions` 表
| 字段名 | 类型 | 约束 | 描述 | 示例值 |
|--------|------|------|------|--------|
| id | UUID | PRIMARY KEY | 版本唯一标识 | `123e4567-e89b-12d3-a456-426614174006` |
| course_id | UUID | NOT NULL, FK | 课程ID | `123e4567-e89b-12d3-a456-426614174005` |
| version | VARCHAR(20) | NOT NULL | 版本号 | `1.0.0` |
| content | JSONB | NOT NULL | 课程内容 | `{"modules": [], "resources": []}` |
| is_published | BOOLEAN | DEFAULT FALSE | 是否已发布 | `true` |
| published_at | TIMESTAMPTZ | NULLABLE | 发布时间 | `2024-01-01T08:00:00Z` |
| created_by | UUID | NULLABLE, FK | 创建人ID | `123e4567-e89b-12d3-a456-426614174001` |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 创建时间 | `2024-01-01T07:00:00Z` |

### 5. 班级管理 (Classrooms)

#### `classrooms` 表
| 字段名 | 类型 | 约束 | 描述 | 示例值 |
|--------|------|------|------|--------|
| id | UUID | PRIMARY KEY | 班级唯一标识 | `123e4567-e89b-12d3-a456-426614174007` |
| tenant_id | UUID | NOT NULL, FK | 所属租户 | `123e4567-e89b-12d3-a456-426614174000` |
| name | VARCHAR(255) | NOT NULL | 班级名称 | `三年级1班` |
| school_id | VARCHAR(100) | NULLABLE | 学校代码 | `SCH001` |
| schedule_json | JSONB | NULLABLE | 课程表JSON | `{"daysOfWeek": [1,3,5], "startTime": "09:00", "endTime": "10:30"}` |
| homeroom_teacher_id | UUID | NULLABLE, FK | 班主任ID | `123e4567-e89b-12d3-a456-426614174001` |
| status | VARCHAR(20) | NOT NULL | 状态: `active`, `inactive`, `archived` | `active` |
| type | VARCHAR(20) | NOT NULL | 类型: `regular`, `lab`, `online`, `hybrid` | `regular` |
| max_students | INTEGER | NULLABLE | 最大学生数 | `40` |
| description | VARCHAR(500) | NULLABLE | 班级描述 | `重点班级，数学特长` |
| metadata | JSONB | DEFAULT '{}' | 扩展元数据 | `{"grade": "3", "building": "A栋", "room": "301"}` |
| created_by | UUID | NULLABLE, FK | 创建人ID | `123e4567-e89b-12d3-a456-426614174001` |
| updated_by | UUID | NULLABLE, FK | 更新人ID | `123e4567-e89b-12d3-a456-426614174001` |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 创建时间 | `2024-01-01T07:00:00Z` |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 更新时间 | `2024-01-01T07:00:00Z` |

#### `class_members` 表
| 字段名 | 类型 | 约束 | 描述 | 示例值 |
|--------|------|------|------|--------|
| classroom_id | UUID | PRIMARY KEY, FK | 班级ID | `123e4567-e89b-12d3-a456-426614174007` |
| user_id | UUID | PRIMARY KEY, FK | 用户ID | `123e4567-e89b-12d3-a456-426614174008` |
| role | VARCHAR(20) | NOT NULL | 角色: `teacher`, `student`, `assistant` | `student` |
| status | VARCHAR(20) | NOT NULL | 状态: `active`, `inactive`, `transferred` | `active` |
| joined_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 加入时间 | `2024-01-01T08:00:00Z` |
| left_at | TIMESTAMPTZ | NULLABLE | 离开时间 | NULL |
| notes | TEXT | NULLABLE | 备注 | `数学成绩优秀` |

### 6. 作业管理 (Assignments)

#### `assignments` 表
| 字段名 | 类型 | 约束 | 描述 | 示例值 |
|--------|------|------|------|--------|
| id | UUID | PRIMARY KEY | 作业唯一标识 | `123e4567-e89b-12d3-a456-426614174009` |
| classroom_id | UUID | NOT NULL, FK | 班级ID | `123e4567-e89b-12d3-a456-426614174007` |
| course_id | UUID | NULLABLE, FK | 关联课程ID | `123e4567-e89b-12d3-a456-426614174005` |
| title | VARCHAR(255) | NOT NULL | 作业标题 | `第一章练习题` |
| description | TEXT | NULLABLE | 作业描述 | `完成课本第1-10页的练习题` |
| type | VARCHAR(50) | NOT NULL | 类型: `homework`, `quiz`, `project`, `lab` | `homework` |
| content | JSONB | NOT NULL | 作业内容 | `{"questions": [], "resources": []}` |
| max_score | DECIMAL(5,2) | NULLABLE | 满分 | `100.00` |
| due_at | TIMESTAMPTZ | NULLABLE | 截止时间 | `2024-01-15T23:59:59Z` |
| status | VARCHAR(20) | NOT NULL | 状态: `draft`, `published`, `closed`, `archived` | `published` |
| published_at | TIMESTAMPTZ | NULLABLE | 发布时间 | `2024-01-01T08:00:00Z` |
| created_by | UUID | NULLABLE, FK | 创建人ID | `123e4567-e89b-12d3-a456-426614174001` |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 创建时间 | `2024-01-01T07:00:00Z` |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 更新时间 | `2024-01-01T07:00:00Z` |

#### `assignment_submissions` 表
| 字段名 | 类型 | 约束 | 描述 | 示例值 |
|--------|------|------|------|--------|
| id | UUID | PRIMARY KEY | 提交唯一标识 | `123e4567-e89b-12d3-a456-426614174010` |
| assignment_id | UUID | NOT NULL, FK | 作业ID | `123e4567-e89b-12d3-a456-426614174009` |
| student_id | UUID | NOT NULL, FK | 学生ID | `123e4567-e89b-12d3-a456-426614174008` |
| content | JSONB | NULLABLE | 提交内容 | `{"answers": [], "files": []}` |
| score | DECIMAL(5,2) | NULLABLE | 得分 | `85.50` |
| feedback | TEXT | NULLABLE | 反馈 | `答案正确，但需要详细步骤` |
| status | VARCHAR(20) | NOT NULL | 状态: `draft`, `submitted`, `graded`, `returned` | `graded` |
| submitted_at | TIMESTAMPTZ | NULLABLE | 提交时间 | `2024-01-10T15:30:00Z` |
| graded_at | TIMESTAMPTZ | NULLABLE | 评分时间 | `2024-01-11T09:00:00Z` |
| graded_by | UUID | NULLABLE, FK | 评分人ID | `123e4567-e89b-12d3-a456-426614174001` |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 创建时间 | `2024-01-01T07:00:00Z` |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 更新时间 | `2024-01-01T07:00:00Z` |

### 7. 会话管理 (Sessions)

#### `user_sessions` 表
| 字段名 | 类型 | 约束 | 描述 | 示例值 |
|--------|------|------|------|--------|
| id | UUID | PRIMARY KEY | 会话唯一标识 | `123e4567-e89b-12d3-a456-426614174011` |
| user_id | UUID | NOT NULL, FK | 用户ID | `123e4567-e89b-12d3-a456-426614174001` |
| token_hash | VARCHAR(255) | NOT NULL | 访问令牌哈希 | `$2b$10$...` |
| refresh_token_hash | VARCHAR(255) | NULLABLE | 刷新令牌哈希 | `$2b$10$...` |
| expires_at | TIMESTAMPTZ | NOT NULL | 过期时间 | `2024-01-02T07:00:00Z` |
| ip_address | INET | NULLABLE | IP地址 | `192.168.1.100` |
| user_agent | TEXT | NULLABLE | 用户代理 | `Mozilla/5.0...` |
| is_active | BOOLEAN | DEFAULT TRUE | 是否活跃 | `true` |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 创建时间 | `2024-01-01T07:00:00Z` |

### 8. 安全管理 (Security)

#### `login_attempts` 表
| 字段名 | 类型 | 约束 | 描述 | 示例值 |
|--------|------|------|------|--------|
| id | UUID | PRIMARY KEY | 尝试记录ID | `123e4567-e89b-12d3-a456-426614174012` |
| email | VARCHAR(255) | NOT NULL | 邮箱地址 | `teacher@school.com` |
| ip_address | INET | NULLABLE | IP地址 | `192.168.1.100` |
| status | VARCHAR(20) | NOT NULL | 状态: `success`, `failed`, `blocked` | `success` |
| failure_reason | VARCHAR(100) | NULLABLE | 失败原因 | `password_incorrect` |
| user_id | UUID | NULLABLE, FK | 用户ID | `123e4567-e89b-12d3-a456-426614174001` |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 创建时间 | `2024-01-01T07:00:00Z` |

#### `two_factor_auth` 表
| 字段名 | 类型 | 约束 | 描述 | 示例值 |
|--------|------|------|------|--------|
| id | UUID | PRIMARY KEY | 2FA唯一标识 | `123e4567-e89b-12d3-a456-426614174013` |
| user_id | UUID | NOT NULL, FK | 用户ID | `123e4567-e89b-12d3-a456-426614174001` |
| secret | VARCHAR(255) | NOT NULL | TOTP密钥 | `JBSWY3DPEHPK3PXP` |
| backup_codes | TEXT[] | NULLABLE | 备份码数组 | `["123456", "789012"]` |
| is_enabled | BOOLEAN | DEFAULT FALSE | 是否启用 | `true` |
| verified_at | TIMESTAMPTZ | NULLABLE | 验证时间 | `2024-01-01T08:00:00Z` |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 创建时间 | `2024-01-01T07:00:00Z` |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 更新时间 | `2024-01-01T07:00:00Z` |

### 9. 审计日志 (Audit Logs)

#### `audit_logs` 表
| 字段名 | 类型 | 约束 | 描述 | 示例值 |
|--------|------|------|------|--------|
| id | UUID | PRIMARY KEY | 日志唯一标识 | `123e4567-e89b-12d3-a456-426614174014` |
| tenant_id | UUID | NOT NULL | 租户ID | `123e4567-e89b-12d3-a456-426614174000` |
| user_id | UUID | NULLABLE, FK | 用户ID | `123e4567-e89b-12d3-a456-426614174001` |
| action | VARCHAR(100) | NOT NULL | 操作类型 | `CREATE`, `UPDATE`, `DELETE` |
| resource_type | VARCHAR(100) | NOT NULL | 资源类型 | `user`, `course`, `classroom` |
| resource_id | UUID | NULLABLE | 资源ID | `123e4567-e89b-12d3-a456-426614174001` |
| old_values | JSONB | NULLABLE | 旧值 | `{"name": "旧名称"}` |
| new_values | JSONB | NULLABLE | 新值 | `{"name": "新名称"}` |
| ip_address | INET | NULLABLE | IP地址 | `192.168.1.100` |
| user_agent | TEXT | NULLABLE | 用户代理 | `Mozilla/5.0...` |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 创建时间 | `2024-01-01T07:00:00Z` |

## 枚举值定义

### 用户角色 (UserType)
- `student`: 学生
- `teacher`: 教师
- `admin`: 管理员
- `parent`: 家长
- `researcher`: 研究员

### 课程状态 (CourseStatus)
- `draft`: 草稿
- `published`: 已发布
- `archived`: 已归档
- `deprecated`: 已废弃

### 授课模式 (DeliveryMode)
- `online`: 在线
- `offline`: 线下
- `hybrid`: 混合
- `blended`: 融合

### 年级段 (GradeBand)
- `k1`-`k3`: 幼儿园小班-大班
- `g1`-`g12`: 小学1年级-高中3年级
- `higher_ed`: 高等教育
- `adult`: 成人教育

### 班级类型 (ClassroomType)
- `regular`: 常规班级
- `lab`: 实验室班级
- `online`: 在线班级
- `hybrid`: 混合班级

### 班级状态 (ClassroomStatus)
- `active`: 活跃
- `inactive`: 非活跃
- `archived`: 已归档

### 作业类型 (AssignmentType)
- `homework`: 家庭作业
- `quiz`: 测验
- `project`: 项目
- `lab`: 实验报告

### 提交状态 (SubmissionStatus)
- `draft`: 草稿
- `submitted`: 已提交
- `graded`: 已评分
- `returned`: 已返回

## 数据完整性约束

### 外键约束
- 所有外键字段必须引用有效的主键
- 级联删除策略根据业务关系定义
- 重要数据使用 RESTRICT 防止误删

### 唯一性约束
- 租户内用户邮箱唯一
- 租户内角色名称唯一
- 权限名称全局唯一
- 租户内课程代码唯一

### 检查约束
- 时间字段逻辑检查 (开始时间 < 结束时间)
- 数值字段范围检查 (分数 0-100)
- 状态字段枚举值检查

## 索引策略

### 主要索引
- 主键自动创建聚簇索引
- 外键字段创建索引
- 查询频繁字段创建复合索引

### 复合索引示例
```sql
-- 用户登录查询
CREATE INDEX idx_users_tenant_email ON users(tenant_id, email);

-- 会话查询
CREATE INDEX idx_user_sessions_user_active ON user_sessions(user_id, is_active);

-- 班级成员查询
CREATE INDEX idx_class_members_classroom_role ON class_members(classroom_id, role);

-- 作业提交查询
CREATE INDEX idx_assignment_submissions_assignment_student ON assignment_submissions(assignment_id, student_id);
```

## 数据归档策略

### 短期数据 (保留1年)
- 登录尝试记录
- 会话记录
- 临时文件

### 中期数据 (保留3年)
- 审计日志
- 作业提交记录
- 课程版本历史

### 长期数据 (永久保留)
- 用户基础信息
- 课程信息
- 班级信息

## 数据迁移规范

### 版本控制
- 所有数据库结构变更通过 TypeORM Migration 管理
- 迁移脚本必须包含升级和降级逻辑
- 生产环境迁移需要完整备份

### 命名规范
- 迁移文件: `{timestamp}_{description}.ts`
- 按时间顺序执行
- 支持回滚操作