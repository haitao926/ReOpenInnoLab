# Classroom Service 开发任务

**优先级**: 🔴 高
**预估工作量**: 3-4周
**负责模块**: services/classroom-service/
**当前状态**: 只有实体定义

---

## 📋 任务描述

实现班级管理服务，负责班级生命周期管理、学生分组、课堂实时控制、课程分配等核心教学场景功能。

## 🎯 验收标准

### 核心功能验收
- [ ] 班级 CRUD 操作完整实现
- [ ] 学生导入、分组、移除功能
- [ ] 课程与班级关联管理
- [ ] 课堂实时状态控制 (开始/暂停/结束)
- [ ] 学生在线状态和签到管理
- [ ] 课堂互动功能 (举手、答题、投票)
- [ ] 教师教学工具集成

### 实时功能验收
- [ ] WebSocket 连接稳定
- [ ] 课堂状态实时同步
- [ ] 学生屏幕共享控制
- [ ] 课堂录制功能
- [ ] 断线重连机制

## 🔧 技术实现要点

### 1. 数据模型设计
```typescript
@Entity('classrooms')
export class Classroom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @ManyToOne(() => User)
  teacher: User;

  @OneToMany(() => Student, student => student.classroom)
  students: Student[];

  @ManyToMany(() => Course)
  @JoinTable()
  courses: Course[];

  @Column({ default: 'inactive' })
  status: 'active' | 'inactive' | 'archived';
}

@Entity('classroom_sessions')
export class ClassroomSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Classroom)
  classroom: Classroom;

  @Column()
  startTime: Date;

  @Column({ nullable: true })
  endTime: Date;

  @Column({ default: 'preparing' })
  status: 'preparing' | 'active' | 'paused' | 'ended';
}
```

### 2. WebSocket 网关
```typescript
@WebSocketGateway({
  namespace: 'classroom',
  cors: true
})
export class ClassroomGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join-classroom')
  handleJoinClassroom(client: Socket, data: { classroomId: string, userId: string }) {
    // 加入教室房间
    // 更新在线状态
    // 广播加入消息
  }

  @SubscribeMessage('classroom-control')
  handleClassroomControl(client: Socket, data: ClassroomControlEvent) {
    // 处理教师控制命令
    // 同步到所有学生端
  }
}
```

### 3. 课堂状态管理
```typescript
@Injectable()
export class ClassroomStateManager {
  private sessions = new Map<string, ClassroomSession>();

  async startClassroom(classroomId: string, teacherId: string): Promise<ClassroomSession> {
    // 创建课堂会话
    // 初始化学生状态
    // 发送开始广播
  }

  async pauseClassroom(sessionId: string): Promise<void> {
    // 暂停课堂
    // 保存当前状态
    // 通知所有参与者
  }
}
```

## 📁 文件结构规划

```
services/classroom-service/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── modules/
│   │   ├── classroom/
│   │   │   ├── classroom.module.ts
│   │   │   ├── classroom.controller.ts
│   │   │   ├── classroom.service.ts
│   │   │   └── dto/
│   │   ├── student/
│   │   │   ├── student.module.ts
│   │   │   ├── student.controller.ts
│   │   │   ├── student.service.ts
│   │   │   └── dto/
│   │   ├── session/
│   │   │   ├── session.module.ts
│   │   │   ├── session.controller.ts
│   │   │   ├── session.service.ts
│   │   │   └── dto/
│   │   └── websocket/
│   │       ├── websocket.module.ts
│   │       ├── classroom.gateway.ts
│   │       └── session.gateway.ts
│   ├── database/
│   │   ├── entities/
│   │   │   ├── classroom.entity.ts
│   │   │   ├── student.entity.ts
│   │   │   ├── classroom-session.entity.ts
│   │   │   └── classroom-activity.entity.ts
│   │   └── migrations/
│   └── config/
│       └── classroom.config.ts
├── package.json
├── tsconfig.json
└── nest-cli.json
```

## 🔗 依赖关系

**前置依赖**:
- [ ] identity-service 用户认证完成
- [ ] course-service 课程基础接口
- [ ] gateway-service 路由配置

**集成依赖**:
- [ ] Redis (实时状态缓存)
- [ ] WebSocket (实时通信)
- [ ] PostgreSQL (持久化存储)

## 🧪 测试要求

### 单元测试
- [ ] 班级 CRUD 操作测试
- [ ] 学生分组逻辑测试
- [ ] 课堂状态转换测试

### 集成测试
- [ ] WebSocket 连接测试
- [ ] 实时状态同步测试
- [ ] 并发课堂处理测试

### E2E 测试
- [ ] 完整课堂流程测试
- [ ] 多用户并发测试
- [ ] 断线重连测试

## 📝 开发步骤

### Week 1: 基础 CRUD
1. 数据库实体设计和迁移
2. 班级基础 CRUD 接口
3. 学生管理功能
4. 课程关联功能

### Week 2: 课堂会话
1. 课堂会话生命周期管理
2. 基础 WebSocket 连接
3. 课堂状态同步
4. 学生在线状态管理

### Week 3: 实时功能
1. 课堂控制命令处理
2. 学生互动功能
3. 屏幕共享集成
4. 断线重连机制

### Week 4: 优化和测试
1. 性能优化
2. 完整测试覆盖
3. 错误处理完善
4. 文档编写

## 🚨 风险与注意事项

1. **WebSocket 稳定性**: 需要处理各种网络异常情况
2. **并发处理**: 多个课堂同时进行的资源竞争
3. **状态一致性**: 分布式环境下的状态同步问题
4. **性能压力**: 大量学生同时在线的并发处理

## 📚 参考资料

- [NestJS WebSocket 文档](https://docs.nestjs.com/websockets/gateways)
- [Socket.io 最佳实践](https://socket.io/docs/)
- [Redis 状态管理](https://redis.io/documentation)

---

**任务创建**: 2025-11-08
**预计完成**: 2025-12-06
**当前状态**: 🔄 未开始