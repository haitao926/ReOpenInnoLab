# 学生端架构问题分析报告

**生成时间**: 2025-11-08
**分析范围**: 学生端整体架构和功能完整性
**当前版本**: v0.1-alpha

---

## 🎯 核心架构问题

### 1. 布局与路由结构混乱

**问题描述**:
- `apps/web-student/src/router/index.ts:24-105` 把 `/` 路径指向 `StudentCourseLayout.vue`
- `StudentCourseLayout.vue` 既是完整页面，又是布局组件，缺少 `<router-view>/<slot>`
- 子路由都写成绝对路径（/assignments 等），导致任何子页面都不会出现在课程框架中
- 课程页面孤立存在，实验/作业页既访问不到课程上下文，也看不到主布局

**影响**: 学生体验割裂，无法在课程场景内无缝切换活动

**解决方案**:
- 创建 `StudentShell.vue` 作为全站布局
- 将 `StudentCourseLayout` 改名为 `CourseWorkspace.vue`，只负责课程主流程
- 路由调整为嵌套结构: `/courses/:courseId/*`，活动永远跟课程挂钩

### 2. 课程视图对活动承载能力缺失

**问题描述**:
- `components/course/ChapterFlow.vue:1-220` 只处理三种类型 (introduction/knowledge/activity)
- activities 只渲染 `ActivityCard` 并抛出事件，无法区分实验/HTML/作业类型
- `ActivityDrawer.vue:1-450` 试图把三类活动塞在一起，但缺少必要上下文
- 关键方法调用会直接报错: `startActivity(session.id, props.chapterId..., props.activity?.id)` (332-335行)
- `currentSession`、`uploadFileToLab`、`downloadFileFromLab` 等状态未定义

**影响**: 学生只能"看卡片"，无法真正启动实验、体验或提交作业

**解决方案**:
- 统一定义 `ActivityContext = { courseId, chapterId, type, payload }`
- `ChapterFlow` 把完整上下文传给 `ActivityDrawer`
- 根据 type 分别调用对应 API: lab.ts、experience.ts、assignments.ts
- 实现活动完成回调，更新课程 store 状态

### 3. Store 设计与真实数据脱节

**问题描述**:
- `stores/course.ts` 的 `Course` 接口只有基础字段，缺少 `aclData`、`chapters`、`activities`
- `loadCourseChapters` 访问 `course.aclData` (176-195行) 会导致 TS 报错
- chapter.status 只有简单状态，缺少活动级别的进度追踪
- Activity 结构不完整，没有实验环境、体验资源或作业题目结构
- `SyncManager` (services/sync-manager.ts:32-413) 完整但未被使用
- 缺少 WebSocket/SSE 订阅，无法接收教师端指令

**影响**: 数据链路断开，状态无法同步，功能无法正常运行

**解决方案**:
- 引入完整的 `.acl` 结构定义
- 扩展 Activity 包含 `labConfig`/`experienceConfig`/`assignmentConfig` 子结构
- 集成 `SyncManager` 到课程 store
- 实现WebSocket监听教师端广播

### 4. 本地实验代理与设备状态虚假

**问题描述**:
- `StudentCourseLayout.vue:91-125` 右侧面板包含状态监控组件
- `DeviceStatusMonitor.vue:1-190` 纯随机数，没有真实 ping 本地 agent
- `LocalAgentStatus.vue:1-210` 内部 `agent ref` 自己创建，状态逻辑错误
- 违背项目原则: "学生端使用本地算力，平台负责指令下发"

**影响**: 无法实现真实的本地实验功能，违背核心设计原则

**解决方案**:
- 创建独立的 `labStore` 管理实验代理状态
- `LocalAgentStatus` 改为接收 props + 事件，不自己创建状态
- 通过 `lab.ts` 实现真实的 `getLocalAgentStatus`/`pingAgent`/`startLocalAgent`

### 5. AI 助手缺乏上下文

**问题描述**:
- `AILearningGuide.vue:134-220` 的 AI 建议/对话全部硬编码
- `suggestion.type` 使用中文字符串，与需求文档不一致
- `startAIConversation`、`sendAIMessage` 缺少课程上下文
- AI 功能独立存在，无法与课程活动联动

**影响**: AI 功能无法体现"AI赋能课程全流程"的价值

**解决方案**:
- AI 建议改为实时调用 API，传入完整上下文
- 根据当前活动类型给出相关提示/问答
- 考虑将 AI 助手嵌入到 `ActivityDrawer` 中

### 6. 页面孤立状态严重

**问题描述**:
- `assignments/List.vue`、`assignments/Submission.vue`、`lab/Agent.vue` 等页面各自独立
- 都自己 import `StudentCourseLayout`，造成布局重复
- 不读取 `courseStore`，数据硬编码
- 跳转后丢失课程/章节上下文

**影响**: 违背"课程是核心、活动挂在课程下"的设计原则

**解决方案**:
- 所有活动页面都应该在课程上下文中运行
- 统一从 courseStore 获取数据
- 实现状态同步机制

### 7. 基础可用性问题

**问题描述**:
- `App.vue:11-38` 全局监听没有清理，热更新时会残留
- Ctrl+K 搜索、ESC 关闭 modal 只是 console.log
- `ActivityDrawer` 缺少 loading skeleton/错误上报
- 存在重复的 Dashboard 文件和硬编码数据

**影响**: 用户体验差，功能不完整

**解决方案**:
- 修复事件监听清理
- 实现真实的搜索和模态框功能
- 添加合适的加载和错误状态

---

## 🛠️ 建议的改造路径

### 阶段一: 修复路由和布局架构 (2-3天)
1. **创建 StudentShell.vue** 作为全站布局
2. **重命名 StudentCourseLayout → CourseWorkspace.vue**
3. **调整路由结构** 为嵌套模式
4. **确保活动永远在课程上下文中**

### 阶段二: 统一活动模型和抽屉逻辑 (3-4天)
1. **重新定义 Activity 数据结构**
2. **修复 ActivityDrawer 上下文传递**
3. **实现不同类型活动的分发逻辑**
4. **集成真实的 API 调用**

### 阶段三: 修复 Store 数据结构 (2-3天)
1. **引入完整 ACL 结构定义**
2. **修复 courseStore 数据流**
3. **集成 SyncManager**
4. **实现 WebSocket 监听**

### 阶段四: 建立本地实验代理管理 (3-4天)
1. **创建 labStore**
2. **修复状态监控组件**
3. **实现真实的 agent 通信**
4. **完善实验启动流程**

### 阶段五: AI 助手上下文化 (2-3天)
1. **修复 AI 建议数据结构**
2. **实现上下文感知的 AI 对话**
3. **集成到活动流程中**
4. **添加实时 AI 辅助功能**

### 阶段六: 修复孤立页面和基础功能 (2-3天)
1. **统一页面布局和状态管理**
2. **修复 Dashboard 数据源**
3. **实现真实的搜索功能**
4. **添加错误处理和加载状态**

---

## 📊 影响评估

### 当前状态
- **功能完整性**: 30% (大部分功能无法正常使用)
- **架构合理性**: 40% (存在根本性设计问题)
- **用户体验**: 35% (功能割裂，交互不完整)
- **代码质量**: 50% (存在大量硬编码和错误调用)

### 预期改进
完成改造后:
- **功能完整性**: 85% (核心功能可正常使用)
- **架构合理性**: 90% (符合项目设计原则)
- **用户体验**: 80% (流程顺畅，交互完整)
- **代码质量**: 85% (数据流清晰，状态管理规范)

---

## 🎯 成功标准

### 技术标准
- [ ] 所有路由导航正常，状态保持一致
- [ ] 课程 → 活动 → 作业流程完整可用
- [ ] 本地实验代理真实连接和状态反馈
- [ ] AI 助手提供上下文相关的建议
- [ ] 所有 Mock 数据替换为真实 API

### 用户体验标准
- [ ] 学生可以在单一页面完成课程所有活动
- [ ] 活动状态实时同步，进度准确追踪
- [ ] 界面响应流畅，加载状态明确
- [ ] 错误处理完善，用户反馈及时

---

**文档维护**: 此分析报告应随架构改进进度定期更新
**下次评估**: 完成每个阶段后重新评估