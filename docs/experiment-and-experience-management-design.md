# 实验管理（实验管理）与体验管理（体验管理）功能设计方案

## 一、总体架构概览

### 1.1 功能定位

- **实验管理**：Jupyter Notebook 实验的完整生命周期管理，从模板创建到课堂派发、学生执行、结果回收
- **体验管理**：HTML/小游戏类互动体验的管理，支持 Quiz、Poll、互动视频等多种形式

### 1.2 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Vue 3)                        │
├─────────────────────────────────────────────────────────────┤
│  LabEditor    │  ExperienceEditor  │  CourseEditor  │  Presenter  │
├─────────────────────────────────────────────────────────────┤
│                   API Gateway                                │
├─────────────────────────────────────────────────────────────┤
│  lab-service    │  experience-service  │  classroom-service │
├─────────────────────────────────────────────────────────────┤
│  Database (PostgreSQL)  │  File Storage (MinIO/S3)          │
└─────────────────────────────────────────────────────────────┘
```

## 二、实验管理（实验管理）详细设计

### 2.1 核心流程

#### 2.1.1 教师端流程

```
1. 上传 Notebook 模板 (LabEditor)
   ↓
2. 配置实验信息（目标/策略/AI 说明）
   ↓
3. 生成 resource://lab/{templateId} 引用
   ↓
4. 课程编辑器中挂载到"实验活动"环节
   ↓
5. 排课时绑定 labTemplateId
   ↓
6. 课堂派发（Presenter 一键启动）
   ↓
7. 实时监控与结果查看
```

#### 2.1.2 学生端流程

```
1. 接收实验派发通知
   ↓
2. Agent 下载 Notebook 到本地
   ↓
3. 启动本地 Jupyter 环境
   ↓
4. 学生完成实验操作
   ↓
5. 心跳与日志实时上报
   ↓
6. 上传实验成果与 diff
```

### 2.2 组件设计

#### 2.2.1 LabEditor 组件（已存在，需增强）

```typescript
// 位置：/views/VirtualLab/LabEditor.vue
// 需要增强的功能：
// 1. Notebook 上传进度条与实时校验
// 2. nbconvert 渲染状态展示
// 3. AI 实验说明生成
// 4. 依赖包自动检测与建议
// 5. 运行策略配置（超时、重试、资源限制）
```

#### 2.2.2 新增组件

##### NotebookUploader 组件

```typescript
// 位置：/components/lab/NotebookUploader.vue
interface Props {
  accept: string // '.ipynb'
  maxSize: number // 50MB
  autoValidate: boolean
}

interface Emits {
  upload: [file: File]
  progress: [percent: number]
  validate: [result: ValidationResult]
  error: [error: string]
}
```

##### LabTemplateSelector 组件

```typescript
// 位置：/components/lab/LabTemplateSelector.vue
// 用于课程编辑器中选择实验模板
interface LabTemplate {
  id: string
  title: string
  description: string
  previewUrl: string
  difficulty: 'easy' | 'medium' | 'hard'
  estimatedDuration: number
  resourceRef: string // resource://lab/{id}
}
```

##### LabMonitoringPanel 组件

```typescript
// 位置：/components/presenter/LabMonitoringPanel.vue
// Presenter 模式下的实验监控面板
interface LabRuntime {
  id: string
  studentId: string
  status: 'running' | 'completed' | 'error' | 'offline'
  progress: number
  startTime: Date
  lastHeartbeat: Date
  errors?: string[]
}
```

### 2.3 API 设计

#### 2.3.1 实验模板 API（部分已实现）

```typescript
// POST /api/v1/labs/templates
// 增强版创建接口，支持更多元数据
interface CreateLabTemplateDto {
  // 原有字段...
  aiDescription?: string // AI 生成的实验说明
  runtimePolicy: {
    timeoutMinutes: number
    maxRetries: number
    resourceLimits: {
      cpu: number
      memory: number
      disk: number
    }
  }
  gradingCriteria?: {
    codeExecution: boolean
    outputValidation: boolean
    cellCompletion: boolean
  }
}

// POST /api/v1/labs/templates/{id}/render
// 触发 nbconvert 渲染
interface RenderResponse {
  previewUrl: string
  cellMapUrl: string
  thumbnailUrl: string
  renderStatus: 'processing' | 'completed' | 'failed'
}
```

#### 2.3.2 实验运行时 API（新增）

```typescript
// POST /api/v1/labs/runs
// 课堂派发实验
interface CreateLabRunDto {
  labTemplateId: string
  lessonId: string
  classId: string
  scheduledTime: Date
  endTime?: Date
  runtimePolicyId: string
}

// GET /api/v1/labs/runs/{id}/status
// 获取实验运行状态
interface LabRunStatus {
  id: string
  status: 'preparing' | 'running' | 'completed' | 'terminated'
  participantCount: number
  completedCount: number
  errorCount: number
  averageProgress: number
}

// POST /api/v1/labs/runs/{id}/artifacts
// 学生上传实验成果
interface ArtifactUploadDto {
  studentId: string
  artifactType: 'notebook' | 'output' | 'log' | 'diff'
  file: File
  metadata?: Record<string, any>
}
```

### 2.4 数据模型扩展

#### 2.4.1 实验运行时表

```sql
CREATE TABLE lab_runs (
  id UUID PRIMARY KEY,
  lab_template_id UUID REFERENCES lab_templates(id),
  lesson_id UUID REFERENCES lesson_instances(id),
  class_id UUID REFERENCES classrooms(id),
  status VARCHAR(20) DEFAULT 'preparing',
  runtime_policy_id UUID,
  scheduled_at TIMESTAMP NOT NULL,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE lab_participants (
  id UUID PRIMARY KEY,
  lab_run_id UUID REFERENCES lab_runs(id),
  student_id UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  notebook_url VARCHAR(500),
  artifacts_url TEXT[],
  last_heartbeat TIMESTAMP,
  error_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE lab_runtime_policies (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  timeout_minutes INTEGER DEFAULT 30,
  max_retries INTEGER DEFAULT 3,
  cpu_limit INTEGER DEFAULT 1,
  memory_limit INTEGER DEFAULT 512,
  disk_limit INTEGER DEFAULT 1024,
  allowed_packages TEXT[],
  blocked_commands TEXT[],
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 三、体验管理（体验管理）详细设计

### 3.1 核心流程

#### 3.1.1 教师端流程

```
1. 创建体验模板（ExperienceEditor）
   ↓
2. 选择类型：Quiz/Poll/互动视频/自定义 HTML
   ↓
3. 配置互动节点与 postMessage 协议
   ↓
4. 设置运行策略（时长/重试/实名等）
   ↓
5. 生成 resource://experience/{id} 引用
   ↓
6. 课程编辑器挂载到"体验理解"环节
   ↓
7. 课堂发起（Presenter 推送）
   ↓
8. 实时查看参与数据
```

#### 3.1.2 学生端流程

```
1. 接收体验推送（WebSocket）
   ↓
2. HTMLExperience 容器加载 iframe
   ↓
3. 完成交互（答题/操作）
   ↓
4. postMessage 回传数据
   ↓
5. 教师端实时统计
```

### 3.2 组件设计

#### 3.2.1 ExperienceEditor 组件（新增）

```typescript
// 位置：/views/experiences/ExperienceEditor.vue
interface ExperienceData {
  type: 'quiz' | 'poll' | 'video' | 'custom'
  title: string
  description: string
  content: {
    html?: string
    questions?: Question[]
    videoUrl?: string
    interactions?: Interaction[]
  }
  config: {
    duration: number
    allowRetries: boolean
    requireRealName: boolean
    showResult: boolean
    collectAnalytics: boolean
  }
  postMessageSchema: MessageSchema
}
```

#### 3.2.2 HTMLExperience 组件（已存在，需增强）

```typescript
// 位置：/components/resources/HTMLExperience.vue
// 增强功能：
// 1. CSP 和 sandbox 安全配置
// 2. postMessage 通信层
// 3. 断网重连机制
// 4. 本地数据缓存
// 5. 体验进度追踪
```

#### 3.2.3 新增组件

##### QuizBuilder 组件

```typescript
// 位置：/components/experiences/QuizBuilder.vue
interface Question {
  id: string
  type: 'single' | 'multiple' | 'true-false' | 'fill' | 'essay'
  question: string
  options?: string[]
  answer: string | string[]
  explanation?: string
  points: number
  timeLimit?: number
}
```

##### ExperienceMonitoringPanel 组件

```typescript
// 位置：/components/presenter/ExperienceMonitoringPanel.vue
interface ExperienceStats {
  totalParticipants: number
  completedCount: number
  averageScore?: number
  progressDistribution: Record<string, number>
  questionStats: QuestionStats[]
  realtimeFeed: StudentAction[]
}
```

### 3.3 API 设计

#### 3.3.1 体验模板 API（新增）

```typescript
// POST /api/v1/experiences/templates
interface CreateExperienceTemplateDto {
  type: 'quiz' | 'poll' | 'video' | 'custom'
  title: string
  description: string
  content: any
  config: ExperienceConfig
  securityPolicy: {
    csp: string
    sandboxFlags: string[]
    allowedOrigins: string[]
  }
  postMessageSchema: MessageSchema
}

// PUT /api/v1/experiences/templates/{id}
// GET /api/v1/experiences/templates/{id}
// DELETE /api/v1/experiences/templates/{id}
// GET /api/v1/experiences/templates (列表与筛选)
```

#### 3.3.2 体验运行时 API（新增）

```typescript
// POST /api/v1/experiences/runs
interface CreateExperienceRunDto {
  experienceTemplateId: string
  lessonId: string
  classId: string
  config: {
    duration: number
    startTime: Date
    endTime?: Date
    allowRetries: boolean
    requireRealName: boolean
  }
}

// POST /api/v1/experiences/runs/{id}/events
// 学生提交事件
interface ExperienceEventDto {
  studentId: string
  eventType: 'start' | 'answer' | 'complete' | 'exit' | 'error'
  timestamp: Date
  data: any
  metadata?: Record<string, any>
}

// GET /api/v1/experiences/runs/{id}/analytics
// 获取实时统计数据
interface ExperienceAnalytics {
  participantCount: number
  completionRate: number
  averageScore: number
  questionAnalytics: QuestionAnalytics[]
  timelineData: TimelinePoint[]
}
```

### 3.4 数据模型

#### 3.4.1 体验表结构

```sql
CREATE TABLE experience_templates (
  id UUID PRIMARY KEY,
  type VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content JSONB NOT NULL,
  config JSONB NOT NULL,
  security_policy JSONB,
  postmessage_schema JSONB,
  status VARCHAR(20) DEFAULT 'draft',
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE experience_runs (
  id UUID PRIMARY KEY,
  experience_template_id UUID REFERENCES experience_templates(id),
  lesson_id UUID REFERENCES lesson_instances(id),
  class_id UUID REFERENCES classrooms(id),
  status VARCHAR(20) DEFAULT 'preparing',
  config JSONB,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE experience_events (
  id UUID PRIMARY KEY,
  experience_run_id UUID REFERENCES experience_runs(id),
  student_id UUID REFERENCES users(id),
  event_type VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  data JSONB,
  metadata JSONB
);

CREATE TABLE experience_responses (
  id UUID PRIMARY KEY,
  experience_run_id UUID REFERENCES experience_runs(id),
  student_id UUID REFERENCES users(id),
  question_id VARCHAR(100),
  answer JSONB,
  score DECIMAL(5,2),
  time_spent INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 四、课程编辑器集成

### 4.1 五环节编辑器增强

#### 4.1.1 实验活动环节编辑器

```typescript
// 位置：/components/course/sections/ExperimentSectionEditor.vue
interface ExperimentSection {
  type: 'experiment'
  labTemplateId: string
  resourceRef: string
  objectives: string[]
  duration: number
  hints: AIHint[]
  runtimePolicyId: string
  aiInstructions?: string
}
```

#### 4.1.2 体验理解环节编辑器

```typescript
// 位置：/components/course/sections/ExperienceSectionEditor.vue
interface ExperienceSection {
  type: 'experience'
  experienceTemplateId: string
  resourceRef: string
  objectives: string[]
  duration: number
  hints: string[]
  config: {
    showTimer: boolean
    allowRetry: boolean
    showLeaderboard: boolean
  }
}
```

### 4.2 资源选择器增强

#### 4.2.1 实验模板选择器

```typescript
// 位置：/components/course/resource-selectors/LabTemplateSelector.vue
// 支持搜索、预览、AI 推荐
```

#### 4.2.2 体验模板选择器

```typescript
// 位置：/components/course/resource-selectors/ExperienceTemplateSelector.vue
// 支持类型筛选、预览试玩
```

## 五、Presenter 模式集成

### 5.1 环节渲染器增强

#### 5.1.1 实验环节渲染

```typescript
// 位置：/components/presenter/section-renderers/ExperimentRenderer.vue
// 功能：
// 1. 显示实验预览
// 2. 一键启动/暂停/延长
// 3. 实时监控面板
// 4. 异常提醒
```

#### 5.2.2 体验环节渲染

```typescript
// 位置：/components/presenter/section-renderers/ExperienceRenderer.vue
// 功能：
// 1. 倒计时显示
// 2. 实时统计面板
// 3. 重发/结束控件
// 4. 排行榜展示
```

### 5.2 WebSocket 事件扩展

```typescript
// 实验相关事件
interface ExperimentEvents {
  'experiment:start': { runId: string; url: string; duration: number }
  'experiment:heartbeat': { studentId: string; progress: number; status: string }
  'experiment:complete': { studentId: string; artifacts: Artifact[] }
  'experiment:error': { studentId: string; error: string }
}

// 体验相关事件
interface ExperienceEvents {
  'experience:start': { runId: string; url: string; duration: number }
  'experience:progress': { studentId: string; progress: number; answers: any[] }
  'experience:complete': { studentId: string; score: number; responses: Response[] }
}
```

## 六、学生端集成

### 6.1 实验执行器（Agent）

```typescript
// 学生端 Agent 功能
interface LabAgent {
  // 接收实验派发
  receiveAssignment(runId: string): Promise<void>

  // 下载 Notebook
  downloadNotebook(url: string): Promise<string>

  // 启动 Jupyter
  startJupyter(notebookPath: string): Promise<JupyterInstance>

  // 监控执行
  monitorExecution(): Promise<void>

  // 上传结果
  uploadArtifacts(artifacts: Artifact[]): Promise<void>
}
```

### 6.2 体验容器增强

```typescript
// HTMLExperience 组件增强
interface HTMLExperience {
  // 安全配置
  securityConfig: {
    csp: string
    sandbox: string[]
    allowedOrigins: string[]
  }

  // 消息通信
  postMessageHandler: (event: MessageEvent) => void

  // 离线缓存
  cacheManager: CacheManager

  // 进度上报
  progressTracker: ProgressTracker
}
```

## 七、实施步骤

### Phase 1: 基础架构（2周）

1. 数据库表结构创建
2. 基础 API 框架搭建
3. 组件目录结构规划
4. 路由和权限配置

### Phase 2: 实验管理核心功能（3周）

1. LabEditor 功能增强
2. 实验模板管理
3. 运行策略配置
4. 基础监控面板

### Phase 3: 体验管理核心功能（3周）

1. ExperienceEditor 开发
2. Quiz/Poll 构建器
3. HTML 容器安全增强
4. postMessage 通信层

### Phase 4: 课程编辑器集成（2周）

1. 五环节编辑器增强
2. 资源选择器集成
3. AI 辅助功能集成
4. 预览功能完善

### Phase 5: Presenter 集成（2周）

1. 环节渲染器开发
2. 实时监控面板
3. WebSocket 事件处理
4. 控制功能实现

### Phase 6: 学生端集成（2周）

1. Agent 功能开发
2. 实验执行器实现
3. 体验容器增强
4. 离线支持

### Phase 7: 报告与分析（2周）

1. 实验报告生成
2. 体验数据分析
3. AI 洞察集成
4. 导出功能

### Phase 8: 测试与优化（1周）

1. 端到端测试
2. 性能优化
3. 安全测试
4. 文档完善

## 八、关键技术点

### 8.1 安全考虑

1. **沙箱隔离**：iframe sandbox、CSP 策略
2. **代码执行**：Jupyter 容器隔离、资源限制
3. **数据验证**：postMessage 来源验证、输入校验
4. **权限控制**：细粒度权限管理

### 8.2 性能优化

1. **资源预加载**：智能预加载策略
2. **实时通信**：WebSocket 连接池管理
3. **文件传输**：断点续传、压缩
4. **缓存策略**：多级缓存机制

### 8.3 用户体验

1. **进度反馈**：实时进度显示
2. **错误处理**：友好的错误提示
3. **离线支持**：本地缓存、断网重连
4. **无障碍**：键盘导航、屏幕阅读器支持

## 九、监控指标

### 9.1 实验指标

- 实验启动成功率
- 学生完成率
- 平均完成时间
- 错误率统计
- 资源使用情况

### 9.2 体验指标

- 参与率
- 完成率
- 平均得分
- 互动次数
- 热力图数据

## 十、API 总结

### 10.1 实验管理 API

```
POST   /api/v1/labs/templates              # 创建实验模板
GET    /api/v1/labs/templates/{id}         # 获取模板详情
PUT    /api/v1/labs/templates/{id}         # 更新模板
POST   /api/v1/labs/templates/{id}/render  # 渲染预览
POST   /api/v1/labs/runs                   # 创建实验运行
GET    /api/v1/labs/runs/{id}              # 获取运行状态
POST   /api/v1/labs/runs/{id}/artifacts    # 上传成果
GET    /api/v1/labs/runs/{id}/artifacts    # 获取成果
```

### 10.2 体验管理 API

```
POST   /api/v1/experiences/templates       # 创建体验模板
GET    /api/v1/experiences/templates/{id}  # 获取模板详情
PUT    /api/v1/experiences/templates/{id}  # 更新模板
POST   /api/v1/experiences/runs            # 创建体验运行
GET    /api/v1/experiences/runs/{id}       # 获取运行状态
POST   /api/v1/experiences/runs/{id}/events # 提交事件
GET    /api/v1/experiences/runs/{id}/analytics # 获取分析
```

这个设计方案提供了完整的实验管理和体验管理功能架构，涵盖了从创建、编辑、派发到监控、分析的全流程。重点是确保与现有系统的无缝集成，同时提供丰富的教学互动功能。
