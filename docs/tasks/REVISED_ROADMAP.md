# ReOpenInnoLab 修订版开发路线图

**基于真实代码库分析的可行性规划**
**项目实际完成度重新评估**: 45% (而非原估算60%)
**最后更新**: 2025-11-09

---

## 🚨 关键发现与调整

### ❌ 原路线图严重误判
1. **PresenterMode.vue已完整实现** (630行代码) - 文档却标记为"完全缺失"
2. **学生端RealtimeLessonView完全不存在** - 需要从零创建
3. **classroom-service仅有实体定义** - 缺少控制器、服务、WebSocket网关
4. **assignment-service目录为空** - 需要完整脚手架
5. **测试基础设施为零** - 与80%覆盖率目标严重不符

### ✅ 重新定义的任务优先级
1. **数据持久化** - 替换localStorage中的模拟数据
2. **缺失组件补全** - ExperienceSection.vue等关键组件
3. **后端服务构建** - 从实体定义到完整服务
4. **学生端实时同步** - 从路由到视图的完整实现

---

## 🔄 Phase 1: 基础架构补全 (2个月)

### Month 1: 数据层与缺失组件 (4-5周)

#### Week 1-2: 数据持久化重构
**实际状态**: Presenter UI使用localStorage模拟数据
**任务**:
- [ ] 替换presenter.ts中的模拟Lesson数据 (lines 134-210)
- [ ] 实现真实的课程/课堂API集成
- [ ] 建立数据库迁移和种子数据
- [ ] 移除所有localStorage依赖

**关键文件**:
- `apps/web-teacher/src/stores/presenter.ts:134-210` (模拟数据)
- `services/classroom-service/` (需要完整实现)

#### Week 3-4: 缺失组件开发
**实际状态**: PresenterMode导入的组件不存在
**任务**:
- [ ] 创建 `ExperienceSection.vue` (presenter模式导入但不存在)
- [ ] 创建 `ExperimentSection.vue` (presenter模式导入但不存在)
- [ ] 创建 `AssignmentSection.vue` (presenter模式导入但不存在)
- [ ] 创建 `ActivityFeed.vue` (右侧面板导入但不存在)
- [ ] 创建 `TeachingTips.vue` (右侧面板导入但不存在)

**关键文件**:
- `apps/web-teacher/src/views/presenter/PresenterMode.vue:296-305` (导入缺失组件)

#### Week 5: WebSocket接口实现
**实际状态**: presenter.ts调用不存在的WebSocket通道
**任务**:
- [ ] 实现classroom-service WebSocket网关
- [ ] 建立教师端到学生端的广播机制
- [ ] 实现实时状态同步
- [ ] 添加连接管理和错误处理

### Month 2: 学生端完整实现 (3-4周)

#### Week 6-7: 学生端基础架构
**实际状态**: `/lesson`路由和RealtimeLessonView完全不存在
**任务**:
- [ ] 创建学生端lesson路由 (`apps/web-student/src/router/index.ts`)
- [ ] 实现RealtimeLessonView主界面 (从零开始)
- [ ] 创建LessonSectionRenderer组件
- [ ] 建立学生端lesson store

**关键文件**:
- `apps/web-student/src/views/lesson/RealtimeLessonView.vue` (需要创建)
- `apps/web-student/src/stores/lesson.ts` (需要创建)

#### Week 8-9: 实时同步功能
**实际状态**: 依赖不存在的WebSocket服务
**任务**:
- [ ] 实现学生端WebSocket客户端
- [ ] 建立教师事件接收机制
- [ ] 实现离线缓存和断线重连
- [ ] 添加学习进度跟踪

#### Week 10: 集成测试与修复
**任务**:
- [ ] 端到端教师-学生流程测试
- [ ] WebSocket连接稳定性测试
- [ ] 数据同步一致性验证
- [ ] 错误处理和边缘情况修复

---

## 🏗️ Phase 2: 后端服务构建 (2个月)

### Month 3: classroom-service完整实现 (4-5周)

#### Week 11-12: NestJS脚手架和基础功能
**实际状态**: 仅有实体定义，缺少控制器和服务
**任务**:
- [ ] 建立classroom-service NestJS模块结构
- [ ] 实现课堂管理CRUD API
- [ ] 创建学生状态管理服务
- [ ] 添加Redis缓存支持

#### Week 13-14: WebSocket实时通信
**实际状态**: WebSocket网关完全缺失
**任务**:
- [ ] 实现NestJS WebSocket网关
- [ ] 建立房间管理和连接池
- [ ] 实现事件广播机制
- [ ] 添加连接认证和权限控制

#### Week 15: 性能和监控
**任务**:
- [ ] 添加性能监控和日志
- [ ] 实现连接数限制和负载均衡
- [ ] 压力测试和性能优化
- [ ] 健康检查和监控仪表板

### Month 4: assignment-service与测试 (3-4周)

#### Week 16-17: assignment-service从零实现
**实际状态**: 目录为空
**任务**:
- [ ] 建立assignment-service完整脚手架
- [ ] 实现作业模板管理
- [ ] 创建自动评分系统
- [ ] 集成AI辅助批改

#### Week 18-19: 测试基础设施
**实际状态**: 项目几乎无测试
**任务**:
- [ ] 建立Jest/Vitest测试框架
- [ ] 为核心组件编写单元测试
- [ ] 添加API集成测试
- [ ] 实现E2E测试流程

---

## 📊 Phase 3: 质量提升与优化 (1.5个月)

### Month 5: 性能优化与部署准备 (2-3周)

#### Week 20-21: 前端性能优化
**任务**:
- [ ] 组件懒加载和代码分割
- [ ] 资源预加载和缓存策略
- [ ] 移动端适配和响应式优化
- [ ] 包大小优化和加载性能

#### Week 22: 后端性能调优
**任务**:
- [ ] 数据库查询优化
- [ ] Redis缓存策略
- [ ] API响应时间优化
- [ ] 并发处理能力提升

### Month 5.5: 测试覆盖率提升 (1-2周)

#### Week 23: 测试覆盖冲刺
**目标**: 从当前15%提升到60%+
**任务**:
- [ ] 补全核心业务逻辑单元测试
- [ ] 添加WebSocket通信测试
- [ ] 完善错误处理测试用例
- [ ] 建立持续集成测试流水线

---

## 🎯 修订后的成功指标

### 技术指标 (更现实的预期)
- **代码覆盖率**: 15% → 60%+ (而非原80%)
- **API完整性**: 55% → 85%+ (而非95%)
- **功能完整度**: 45% → 75%+ (而非90%)

### 业务指标
- **教师端Presenter**: UI完成度100% → 数据连通100%
- **学生端实时同步**: 0% → 完整实现
- **后端服务**: 实体定义 → 生产就绪

### 时间线调整
- **原计划**: 6个月完成
- **修订计划**: 5.5个月核心功能 + 0.5个月缓冲
- **关键里程碑**:
  - Month 1: Presenter数据连通 + 缺失组件补全
  - Month 2: 学生端实时同步完整实现
  - Month 4: 后端服务生产就绪
  - Month 5.5: 测试达标，系统稳定

---

## ⚠️ 风险缓解策略

### 高风险项目重新评估
1. **实时同步复杂性** - 风险等级: 🔴→🟡
   - **缓解**: Presenter已实现WebSocket接口框架，只需后端支持

2. **后端服务缺失** - 风险等级: 🔴
   - **缓解**: 实体定义完整，明确实现路径，避免设计阶段风险

3. **测试覆盖率目标** - 风险等级: 🟡→🟢
   - **缓解**: 调整为现实可行的60%目标，优先核心功能测试

### 新增风险识别
1. **数据迁移风险** - localStorage → 数据库
   - **缓解**: 渐进式迁移，保留向后兼容

2. **组件依赖风险** - 缺失组件影响整体功能
   - **缓解**: 明确组件依赖关系，按优先级实现

---

## 📝 立即行动项 (本周)

### Day 1-2: 基础设施准备
1. 建立 `classroom-service` NestJS项目结构
2. 配置数据库连接和迁移
3. 实现基础的 `/health` 端点

### Day 3-4: 核心服务实现
1. 实现 `ClassroomController` 基础CRUD
2. 创建 `ClassroomService` 业务逻辑
3. 建立与前端presenter的API对接

### Day 5: WebSocket网关
1. 实现 `ClassroomGateway` WebSocket网关
2. 建立房间管理和连接处理
3. 与PresenterMode.vue的WebSocket调用对接

### 周末: 验证与规划
1. 验证Presenter-后端通信
2. 更新下阶段详细计划
3. 准备缺失组件开发任务

---

## 📞 决策建议

### 立即调整优先级
1. **停止** 将PresenterMode视为"缺失功能"的误判
2. **优先** 实现Presenter的数据层连接
3. **并行** 开发缺失的关键组件
4. **加速** 后端服务从0到1的建设

### 资源重新分配
- **前端**: 40% → 缺失组件补全 + 数据接入
- **后端**: 60% → 服务脚手架 + WebSocket实现
- **测试**: 融入各阶段，而非最后冲刺

**核心原则**: 先让已存在的UI真正工作，再新建缺失的功能。避免重复建设和资源浪费。

---

**修订人**: Claude (基于深度代码分析)
**有效期限**: 根据实际进展动态调整
**下一步**: 立即开始classroom-service基础实现