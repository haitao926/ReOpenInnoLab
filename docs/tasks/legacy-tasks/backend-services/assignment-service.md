# Assignment Service 开发任务

**优先级**: 🟡 中
**预估工作量**: 4-5周
**负责模块**: services/assignment-service/
**当前状态**: 空目录

---

## 📋 任务描述

实现作业管理服务，涵盖作业创建、分发、提交、批改、评分、反馈等完整作业生命周期管理，集成AI辅助功能提升批改效率。

## 🎯 验收标准

### 核心功能验收
- [ ] 作业模板和创建向导
- [ ] 多种题型支持 (选择、填空、编程、文档)
- [ ] 作业分发和截止时间管理
- [ ] 学生提交和版本控制
- [ ] 批改工作流和评分标准
- [ ] 成绩统计和分析
- [ ] 作业反馈和通知

### AI 辅助功能
- [ ] AI 自动出题功能
- [ ] 客观题自动批改
- [ ] 主观题 AI 辅助批改
- [ ] 作文 AI 评分和建议
- [ ] 编程作业代码检查
- [ ] 个性化学习建议生成

### 高级功能
- [ ] 作业模板库
- [ ] 批量导入导出
- [ ] 协作批改功能
- [ ] 作弊检测机制
- [ ] 作业难度自适应

## 🔧 技术实现要点

### 1. 数据模型设计
```typescript
@Entity('assignments')
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column()
  type: 'quiz' | 'essay' | 'programming' | 'document';

  @ManyToOne(() => Course)
  course: Course;

  @ManyToOne(() => User)
  createdBy: User;

  @Column()
  dueDate: Date;

  @Column('jsonb')
  questions: Question[];

  @Column('jsonb', { nullable: true })
  rubric: GradingRubric;

  @Column({ default: 'draft' })
  status: 'draft' | 'published' | 'closed' | 'archived';
}

@Entity('submissions')
export class Submission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Assignment)
  assignment: Assignment;

  @ManyToOne(() => User)
  student: User;

  @Column('jsonb')
  answers: Answer[];

  @Column({ nullable: true })
  submittedAt: Date;

  @Column('jsonb', { nullable: true })
  aiFeedback: AIFeedback;

  @Column({ nullable: true })
  finalScore: number;
}
```

### 2. AI 集成服务
```typescript
@Injectable()
export class AssignmentAIService {
  constructor(
    @Inject('AI_SERVICE') private aiService: AIService,
  ) {}

  async generateQuestions(topic: string, difficulty: string, count: number): Promise<Question[]> {
    // 调用 AI 服务生成题目
    // 题目质量检查
    // 知识点匹配
  }

  async gradeSubmission(submission: Submission, rubric: GradingRubric): Promise<GradingResult> {
    // 客观题自动评分
    // 主观题 AI 辅助评分
    // 生成反馈建议
  }

  async detectPlagiarism(submissions: Submission[]): Promise<PlagiarismReport> {
    // 文本相似度检测
    // 代码抄袭检测
    // 生成抄袭报告
  }
}
```

### 3. 批改工作流
```typescript
@Injectable()
export class GradingWorkflowService {
  async startGradingSession(assignmentId: string): Promise<GradingSession> {
    // 创建批改会话
    // 分配批改任务
    // 设置批改标准
  }

  async submitGrade(submissionId: string, grade: Grade, feedback: string): Promise<void> {
    // 保存评分结果
    // 更新成绩统计
    // 发送学生通知
  }

  async getGradingAnalytics(assignmentId: string): Promise<GradingAnalytics> {
    // 成绩分布统计
    // 题目难度分析
    // 学生掌握情况
  }
}
```

## 📁 文件结构规划

```
services/assignment-service/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── modules/
│   │   ├── assignment/
│   │   │   ├── assignment.module.ts
│   │   │   ├── assignment.controller.ts
│   │   │   ├── assignment.service.ts
│   │   │   └── dto/
│   │   ├── submission/
│   │   │   ├── submission.module.ts
│   │   │   ├── submission.controller.ts
│   │   │   ├── submission.service.ts
│   │   │   └── dto/
│   │   ├── grading/
│   │   │   ├── grading.module.ts
│   │   │   ├── grading.controller.ts
│   │   │   ├── grading.service.ts
│   │   │   └── dto/
│   │   ├── ai/
│   │   │   ├── ai.module.ts
│   │   │   ├── ai-grading.service.ts
│   │   │   ├── question-generation.service.ts
│   │   │   └── plagiarism.service.ts
│   │   └── analytics/
│   │       ├── analytics.module.ts
│   │       ├── analytics.controller.ts
│   │       └── analytics.service.ts
│   ├── database/
│   │   ├── entities/
│   │   │   ├── assignment.entity.ts
│   │   │   ├── submission.entity.ts
│   │   │   ├── question.entity.ts
│   │   │   ├── grade.entity.ts
│   │   │   └── rubric.entity.ts
│   │   └── migrations/
│   ├── types/
│   │   ├── assignment.types.ts
│   │   ├── question.types.ts
│   │   └── grading.types.ts
│   └── config/
│       └── assignment.config.ts
├── package.json
├── tsconfig.json
└── nest-cli.json
```

## 🔗 依赖关系

**前置依赖**:
- [ ] course-service 课程信息
- [ ] identity-service 用户信息
- [ ] ai-service AI 能力接口

**外部集成**:
- [ ] MinIO/S3 (文件存储)
- [ ] Redis (缓存和队列)
- [ ] PostgreSQL (数据持久化)

## 🧪 测试要求

### 单元测试
- [ ] 作业创建逻辑测试
- [ ] 评分算法测试
- [ ] AI 集成服务测试

### 集成测试
- [ ] 完整提交流程测试
- [ ] 批改工作流测试
- [ ] AI 批改准确性测试

### 性能测试
- [ ] 大量提交处理测试
- [ ] AI 服务并发调用测试
- [ ] 文件上传下载测试

## 📝 开发步骤

### Week 1: 基础框架
1. 项目初始化和数据库设计
2. 作业基础 CRUD 功能
3. 题目类型定义和验证
4. 学生提交功能

### Week 2: 批改系统
1. 评分标准和 Rubric
2. 批改工作流实现
3. 成绩统计功能
4. 批改界面 API

### Week 3: AI 集成
1. AI 服务集成和配置
2. 自动出题功能
3. AI 辅助批改
4. 作弊检测机制

### Week 4: 高级功能
1. 作业模板库
2. 批量操作功能
3. 通知系统集成
4. 数据分析报表

### Week 5: 优化和测试
1. 性能优化
2. 完整测试覆盖
3. 安全性检查
4. 文档和部署

## 🚨 风险与注意事项

1. **AI 服务依赖**: AI 服务的稳定性和成本控制
2. **评分准确性**: AI 批改结果的可靠性验证
3. **隐私保护**: 学生作业数据的安全处理
4. **性能压力**: 大量同时提交的处理能力

## 📚 参考资料

- [NestJS 文件上传文档](https://docs.nestjs.com/techniques/file-upload)
- [AI 服务集成最佳实践](https://docs.anthropic.com/claude)
- [教育评估标准](https://www.education.gov/assessment-principles)

---

**任务创建**: 2025-11-08
**预计完成**: 2025-12-13
**当前状态**: 🔄 未开始