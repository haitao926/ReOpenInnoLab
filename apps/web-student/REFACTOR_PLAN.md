# 学生端重构实施计划

**创建时间**: 2025-11-08
**基于分析**: ARCHITECTURE_ANALYSIS.md
**预计工期**: 14-18天

---

## 🚀 重构目标

1. **架构合理化**: 建立清晰的布局层次和路由结构
2. **功能完整性**: 实现课程 → 实验 → 作业的完整学习流程
3. **数据一致性**: 统一状态管理，消除孤立页面
4. **用户体验**: 提供流畅的学习交互和实时反馈

---

## 📋 详细任务清单

### 阶段一: 布局与路由重构 (2-3天)

#### 任务1.1: 创建全站Shell布局
**文件**: `src/components/layout/StudentShell.vue`
**描述**: 创建统一的学生端布局组件，包含导航、搜索、通知、用户菜单
**依赖**: 无
**验收标准**:
- [ ] 响应式顶部导航栏
- [ ] 全局搜索功能 (Ctrl+K)
- [ ] 通知中心抽屉
- [ ] 用户菜单和退出登录
- [ ] 键盘快捷键支持

#### 任务1.2: 重构课程工作区
**文件**: `src/components/layout/StudentCourseLayout.vue` → `src/views/Course/CourseWorkspace.vue`
**描述**: 将原有的布局组件改为真正的课程工作区页面
**依赖**: 任务1.1
**验收标准**:
- [ ] 专注课程内容展示
- [ ] 章节导航和活动展示
- [ ] 右侧状态面板
- [ ] 响应式布局适配

#### 任务1.3: 调整路由结构
**文件**: `src/router/index.ts`
**描述**: 重构路由配置，建立正确的嵌套关系
**依赖**: 任务1.1, 任务1.2
**验收标准**:
- [ ] `/` → `/dashboard` 重定向
- [ ] `/courses/:id` 课程工作区
- [ ] `/courses/:id/activity/:activityId` 活动详情 (通过drawer/modal)
- [ ] 所有页面都在StudentShell下渲染
- [ ] 导航守卫和权限控制

#### 任务1.4: 修复导航状态
**文件**: 各页面组件
**描述**: 确保导航状态正确反映当前页面
**依赖**: 任务1.3
**验收标准**:
- [ ] 导航高亮正确
- [ ] 面包屑导航准确
- [ ] 页面标题自动更新

### 阶段二: 活动模型统一 (3-4天)

#### 任务2.1: 重新定义活动数据结构
**文件**: `src/types/course.ts`, `src/stores/course.ts`
**描述**: 扩展Activity类型定义，支持不同类型的活动配置
**依赖**: 无
**验收标准**:
```typescript
interface Activity {
  id: string
  type: 'knowledge' | 'experiment' | 'experience' | 'assignment'
  title: string
  objectives: string[]
  resourceRefs: ResourceRef[]
  labConfig?: LabConfig      // 实验配置
  experienceConfig?: ExperienceConfig  // 体验配置
  assignmentConfig?: AssignmentConfig  // 作业配置
  status: 'locked' | 'available' | 'in_progress' | 'completed'
  progress?: number
}
```

#### 任务2.2: 修复ChapterFlow组件
**文件**: `src/components/course/ChapterFlow.vue`
**描述**: 重构章节流程组件，正确处理不同类型活动
**依赖**: 任务2.1
**验收标准**:
- [ ] 支持所有活动类型渲染
- [ ] 传递完整活动上下文
- [ ] 正确显示活动状态和进度
- [ ] 活动点击事件携带必要参数

#### 任务2.3: 重构ActivityDrawer组件
**文件**: `src/components/course/ActivityDrawer.vue`
**描述**: 重构活动抽屉，根据活动类型分发到不同处理器
**依赖**: 任务2.1, 任务2.2
**验收标准**:
- [ ] 接收完整ActivityContext: { courseId, chapterId, activity }
- [ ] 根据activity.type显示对应界面
- [ ] 实验活动: LabRunner组件
- [ ] 体验活动: ExperiencePreviewer组件
- [ ] 作业活动: AssignmentPanel组件
- [ ] 统一的加载、错误、完成状态处理

#### 任务2.4: 创建活动处理器组件
**文件**:
- `src/components/activity/LabRunner.vue`
- `src/components/activity/ExperiencePreviewer.vue`
- `src/components/activity/AssignmentPanel.vue`
**描述**: 为不同类型活动创建专门的处理器组件
**依赖**: 任务2.3
**验收标准**:
- [ ] LabRunner: 启动本地实验、显示连接状态
- [ ] ExperiencePreviewer: iframe沙箱、交互数据收集
- [ ] AssignmentPanel: 作业展示、提交表单、文件上传

### 阶段三: Store和数据流修复 (2-3天)

#### 任务3.1: 引入ACL结构
**文件**: `src/types/acl.ts`, `src/stores/course.ts`
**描述**: 完整引入.acl文件结构定义，支持课程数据解析
**依赖**: 任务2.1
**验收标准**:
- [ ] 完整的ACL类型定义
- [ ] ACL解析器集成
- [ ] 课程数据从.acl文件正确加载
- [ ] 章节和活动结构正确解析

#### 任务3.2: 修复courseStore数据流
**文件**: `src/stores/course.ts`
**描述**: 重构课程store，实现完整的数据加载和状态管理
**依赖**: 任务3.1
**验收标准**:
- [ ] selectCourse加载完整课程数据
- [ ] loadCourseChapters正确解析章节
- [ ] 活动状态实时更新
- [ ] 章节完成状态计算
- [ ] 错误处理和重试机制

#### 任务3.3: 集成SyncManager
**文件**: `src/stores/course.ts`, `src/services/sync-manager.ts`
**描述**: 将SyncManager集成到课程store，实现数据同步
**依赖**: 任务3.2
**验收标准**:
- [ ] 活动完成自动上报
- [ ] 网络状态监听和离线缓存
- [ ] 数据冲突解决
- [ ] 同步状态显示

#### 任务3.4: 实现WebSocket通信
**文件**: `src/services/websocket.ts`, `src/stores/course.ts`
**描述**: 实现WebSocket连接，接收教师端实时指令
**依赖**: 任务3.3
**验收标准**:
- [ ] 自动连接和重连
- [ ] 教师指令监听 (开始实验、切换章节等)
- [ ] 实时状态同步
- [ ] 连接状态管理

### 阶段四: 本地实验代理管理 (3-4天)

#### 任务4.1: 创建labStore
**文件**: `src/stores/lab.ts`
**描述**: 创建独立的实验store，管理本地代理状态
**依赖**: 无
**验收标准**:
```typescript
interface LabStore {
  agentStatus: AgentStatus
  sessions: LabSession[]
  currentLab?: LabSession
  startLab(config: LabConfig): Promise<string>
  stopLab(sessionId: string): Promise<void>
  pingAgent(): Promise<boolean>
}
```

#### 任务4.2: 修复状态监控组件
**文件**:
- `src/components/lab/DeviceStatusMonitor.vue`
- `src/components/lab/LocalAgentStatus.vue`
**描述**: 重构状态监控组件，从labStore获取真实数据
**依赖**: 任务4.1
**验收标准**:
- [ ] DeviceStatusMonitor显示真实设备状态
- [ ] LocalAgentStatus显示代理连接状态
- [ ] 启动/停止/重启代理操作
- [ ] 状态变化实时更新

#### 任务4.3: 实现agent通信
**文件**: `src/api/lab.ts`
**描述**: 实现与本地实验代理的真实通信
**依赖**: 任务4.1
**验收标准**:
- [ ] getLocalAgentStatus() 获取代理状态
- [ ] pingAgent() 检查代理连接
- [ ] startLocalAgent() 启动本地代理
- [ ] createLabSession() 创建实验会话

---

## 📡 实时课堂实现方案 (新增：2025-11-12)

### 背景与目标
- 教师端 Presenter 已具备完整能力，但学生端缺少课堂加入、实时同步与互动链路 (`0.需求说明.md`, `1. 设计与规划.md`).
- 需要建立“加入 → 同步 → 参与 → 提交”的闭环，保证课堂状态 <500ms 延迟、算力落在学生端代理 (`0.需求说明.md`, `1. 设计与规划.md`).
- 方案在不引入 Mock 的前提下复用真实 classroom/course/assignment 服务，UI 复用 `packages/ui-kit` 主题组件 (`2.项目原则.md`).

### 设计约束
1. **真实数据源**：所有课堂、环节、互动数据来自后端 API + WebSocket，禁止写临时 Mock。
2. **文件聚合**：优先在既有 `router`, `stores`, `components/lesson` 等目录内实现逻辑，不再额外扩散文件夹。
3. **算力隔离**：实验/Notebook 运行只在学生端代理执行，教师端仅消费状态。
4. **可追踪性**：课堂事件需要写入 Pinia 状态并可落地 IndexedDB 以支持断线续播。

### 模块拆解
- `src/router/index.ts`
  - 新增 `/lesson/:lessonId`、`/lesson/:lessonId/experiment` 路由，进入前调用 classroom-service 校验班级 + 课次授权。
- `src/stores/lesson.ts`
  - 管理 LessonState: 课次 meta、当前环节、计时、互动/作业流水、WebSocket 连接状态。
  - 提供 `initLesson`, `advanceWithTeacher`, `submitActivityPayload`, `setConnectionState` 等 action。
- `src/services/websocket/lessonSocket.ts`
  - 封装 Socket.IO 客户端，管理鉴权、心跳、重连、事件 → store action 的分发。
  - 统一订阅 `lesson.state`, `lesson.section`, `lesson.activity`, `lesson.assignment` 事件。
- `src/components/lesson/*`
  - `RealtimeLessonView.vue`: 三栏布局（内容区 + 进度/连接状态 + 互动 feed），消费 store。
  - `LessonSectionRenderer.vue`: 根据 `section.type` 映射 introduction/knowledge/experience/experiment/assignment 子组件。
  - `ConnectionStatus.vue` & `ProgressPanel.vue`: 提示网络、课堂心跳、计时状态。
- `src/views/lesson/RealtimeLessonView.vue`
  - 页面级容器，负责调用 `initLesson`, 监听路由变化，驱动所有 lesson 组件。

### 流程设计
1. **课堂进入**
   - Router guard 校验 lessonId → 拉取课堂/课程结构 → 初始化 lesson store。
   - store 写入 ACL 解析的数据，渲染空状态。
2. **实时同步**
   - `lessonSocket.connect(lessonId, token)` 建立连接，接收教师端状态广播。
   - 所有事件落入 Pinia，并追加到本地时间线（必要时 IndexedDB 缓存）。
3. **环节渲染**
   - `LessonSectionRenderer` 映射 section 类型：体验走 iframe sandbox，实验唤起 Virtual Lab Agent，作业拉 assignment-service。
   - 每个环节向 `lessonStore` 上报本地进度、剩余时长。
4. **互动/作业提交**
   - 通过 `submitLessonEvent(eventType, payload)` 将课堂互动写回 classroom 或 assignment 服务。
   - 回传后的确认事件由 WebSocket 广播给所有学生，保证 UI 状态一致。
5. **状态保障**
   - `ConnectionStatus` 统一监听 HTTP、WebSocket、Lab Agent 心跳，给出“同步正常/延迟/重连”提示。
   - `ProgressPanel` 结合教师端节奏提示 + 本地计时器输出环节剩余时间。

### 推进节奏
1. **阶段A – 骨架**：补齐路由、Pinia store、lesson types、`RealtimeLessonView` 布局与 UI-kit 主题接入。
2. **阶段B – 实时状态**：实现 `lessonSocket`、连接管理、事件分发、断线重连与状态提示。
3. **阶段C – 环节交互**：完成体验/实验/作业组件，串联 Virtual Lab Agent 调用链和 assignment 提交。
4. **阶段D – 互动与埋点**：写 `submitLessonEvent`、行为埋点、课堂数据缓存，确保数据可追溯。
5. **阶段E – 测试**：在 `test-system.js` 等集成脚本中补充课堂场景 + WebSocket 断连重连测试。

### 交付标准
- 课堂状态、环节切换能在 <500ms 内同步并正确渲染。
- 学生端可在断网后恢复课堂并追上最新环节。
- 实验/作业提交走真实 API，教师端可看到状态更新。
- UI 使用 `packages/ui-kit` token，保持与教师端一致的玻璃风格。

- [ ] 错误处理和超时机制

#### 任务4.4: 完善实验启动流程
**文件**: `src/components/activity/LabRunner.vue`
**描述**: 完善实验启动和运行流程
**依赖**: 任务4.1, 任务4.3
**验收标准**:
- [ ] 自动检查代理状态
- [ ] 一键启动实验环境
- [ ] 显示实验URL和连接信息
- [ ] 实验状态监控和日志显示

### 阶段五: AI助手上下文集成 (2-3天)

#### 任务5.1: 修复AI数据结构
**文件**: `src/types/ai.ts`, `src/components/ai/AILearningGuide.vue`
**描述**: 重构AI建议类型定义，符合需求文档规范
**依赖**: 任务3.1
**验收标准**:
```typescript
interface AISuggestion {
  id: string
  type: 'study' | 'content' | 'activity' | 'resource'
  title: string
  description: string
  action?: {
    type: 'navigate' | 'open' | 'start'
    target: string
  }
}
```

#### 任务5.2: 实现上下文感知AI
**文件**: `src/services/ai.ts`, `src/components/ai/AILearningGuide.vue`
**描述**: 实现基于课程上下文的AI建议和对话
**依赖**: 任务5.1
**验收标准**:
- [ ] getAISuggestions({courseId, chapterId, activityId}) API调用
- [ ] 根据当前活动类型给出相关建议
- [ ] AI对话理解课程上下文
- [ ] 建议与实际功能联动

#### 任务5.3: 集成AI到活动流程
**文件**: `src/components/course/ActivityDrawer.vue`
**描述**: 将AI助手嵌入到活动抽屉中
**依赖**: 任务5.2
**验收标准**:
- [ ] 活动进行时显示相关AI建议
- [ ] 实时AI问答支持
- [ ] AI辅助完成活动
- [ ] 活动完成后AI总结和下一步建议

### 阶段六: 基础功能完善 (2-3天)

#### 任务6.1: 统一页面布局
**文件**: `src/views/assignments/`, `src/views/profile/`, `src/views/settings/`
**描述**: 确保所有页面都在StudentShell下，使用一致布局
**依赖**: 任务1.1
**验收标准**:
- [ ] 移除重复的布局组件引用
- [ ] 统一从对应store获取数据
- [ ] 页面间状态保持一致
- [ ] 导航和面包屑正确

#### 任务6.2: 修复Dashboard
**文件**: `src/views/Dashboard/`, `src/views/Dashboard.vue`
**描述**: 统一Dashboard实现，从真实数据源获取信息
**依赖**: 任务3.2, 任务4.1
**验收标准**:
- [ ] 删除重复的Dashboard文件
- [ ] 显示今日课程和学习进度
- [ ] 待完成作业和实验状态
- [ ] 学习成就和统计信息
- [ ] 卡片点击跳转到对应功能

#### 任务6.3: 实现全局搜索
**文件**: `src/components/layout/StudentShell.vue`, `src/services/search.ts`
**描述**: 实现真实的全局搜索功能
**依赖**: 任务3.1
**验收标准**:
- [ ] 搜索课程、章节、活动
- [ ] 搜索结果分类显示
- [ ] 搜索历史记录
- [ ] 快捷键支持 (Ctrl+K)

#### 任务6.4: 完善错误处理和加载状态
**文件**: 全局组件
**描述**: 添加统一的错误处理和加载状态
**依赖**: 前面所有任务
**验收标准**:
- [ ] 全局错误边界
- [ ] Loading skeleton组件
- [ ] 错误提示和重试机制
- [ ] 网络异常处理
- [ ] 操作反馈机制

---

## 🎯 关键依赖关系

```
阶段一 (布局路由) → 阶段二 (活动模型) → 阶段三 (数据流) → 阶段四 (实验代理)
                    ↓                         ↓                    ↓
                   阶段五 (AI集成) ←←←←←←←←←←←←←←←←←←←←←←←
                    ↓
                   阶段六 (基础功能)
```

---

## 📊 风险评估和应对

### 高风险项
1. **ACL结构复杂性** (阶段三)
   - 风险: 数据结构复杂，解析困难
   - 应对: 分步实现，先支持基础结构

2. **本地代理通信** (阶段四)
   - 风险: 跨平台兼容性问题
   - 应对: 提前测试，准备降级方案

3. **WebSocket稳定性** (阶段三)
   - 风险: 网络环境复杂，连接不稳定
   - 应对: 完善重连机制，离线缓存

### 中风险项
1. **AI API集成** (阶段五)
   - 风险: API响应时间，服务稳定性
   - 应对: 本地缓存，异步处理

2. **状态管理复杂性** (阶段三)
   - 风险: 状态同步复杂，容易出现不一致
   - 应对: 详细测试，状态机设计

---

## ✅ 验收标准总结

### 功能完整性
- [ ] 学生可以从课程列表 → 课程详情 → 具体活动 → 完成提交的完整流程
- [ ] 所有类型活动 (知识/实验/体验/作业) 都可以正常进行
- [ ] 本地实验代理可以正常启动和连接
- [ ] AI助手提供上下文相关的建议和帮助

### 技术质量
- [ ] 所有Mock数据替换为真实API调用
- [ ] 状态管理清晰，数据流一致
- [ ] 错误处理完善，用户体验良好
- [ ] 代码结构清晰，组件职责单一

### 性能和体验
- [ ] 页面加载速度合理 (<3秒)
- [ ] 交互响应流畅 (<500ms)
- [ ] 移动端适配良好
- [ ] 键盘快捷键和辅助功能支持

---

**计划制定**: Claude Code
**开始时间**: 待定
**预计完成**: 14-18个工作日
