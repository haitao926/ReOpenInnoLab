# 学生端课程聚焦功能设计文档

## 1. 设计理念与定位

### 1.1 核心定位
- **聚焦课程**：学生端入口聚焦"今日课程"，避免全域控制台的复杂导航
- **课程核心化**：整个页面以课程为核心，所有功能围绕课程展开
- **简化旅程**：学生旅程强调"进入班级→参与课程→获得反馈"的闭环

### 1.2 设计原则
- **Plan First**：所有设计先规划后编码，避免随意创建文件
- **UI 复用优先**：优先使用 `packages/ui-kit` 组件，保持设计一致性
- **温暖科技**：延续玻璃质感设计，融入教育符号，克制动效
- **上下文保持**：作业与实验作为课程子模块，避免独立子系统干扰

## 2. 页面架构设计

### 2.1 整体布局
```
┌─────────────────────────────────────────────────────────────┐
│                    AppBar (顶部导航)                        │
├─────────────┬─────────────────────────┬─────────────────────┤
│             │                         │                     │
│   左侧      │        中央课程流       │      右侧工具栏      │
│   课程列表   │                         │                     │
│   + 进度    │     映射 .acl 章节树     │   AI Guide / 通知   │
│             │                         │   / 设备状态        │
│             │                         │                     │
│             │                         │                     │
└─────────────┴─────────────────────────┴─────────────────────┘
└─────────────────────── 底部课堂反馈条 ──────────────────────┘
```

### 2.2 AppBar 设计
```typescript
interface AppBarProps {
  leftContent: {
    currentClassroom: string;
    courseSwitcher: Course[];
  };
  rightContent: {
    studyPeriod: string;
    aiAssistantEntry: boolean;
  };
}
```

**左侧**：班级/课程切换器，显示当前课程和快速切换选项
**右侧**：学习时段标识 + AI助手入口按钮

### 2.3 三栏布局详细设计

#### 左栏：课程列表 + 进度
- 今日课程卡片（Course Entry Card）
- 课程完成度进度条
- 快速导航到特定章节

#### 中央：课程流主体
- 按 `.acl` 章节树垂直展开
- 支持 `introduction/knowledge/activity` 三种类型
- 实验和体验以嵌入卡片形式展示

#### 右栏：AI Guide + 工具
- AI 学习助手（仅限当前课程上下文）
- 通知中心
- 本地设备状态监控

## 3. 核心模块设计

### 3.1 Course Entry Card（课程入口卡片）
```vue
<template>
  <EduCard variant="glass" hoverable>
    <div class="course-entry">
      <div class="course-header">
        <h3>{{ todayCourse.title }}</h3>
        <span class="course-time">{{ todayCourse.schedule }}</span>
      </div>
      <div class="course-info">
        <p class="teacher-message">{{ todayCourse.teacherMessage }}</p>
        <div class="task-count">
          <span>今日任务：{{ todayCourse.taskCount }} 个</span>
        </div>
      </div>
      <div class="course-actions">
        <el-button
          type="primary"
          @click="enterCourse"
          :disabled="!courseActive"
        >
          {{ courseActive ? '进入课堂' : '等待开课' }}
        </el-button>
      </div>
    </div>
  </EduCard>
</template>
```

### 3.2 Chapter Flow（章节流）
```typescript
// 数据结构：直接映射 .acl.structure
interface Chapter {
  id: string;
  type: 'introduction' | 'knowledge' | 'activity';
  title: string;
  objectives: string[];
  knowledgePoints: string[];
  resources: ResourceRef[];
  status: 'locked' | 'available' | 'completed';
}

// 章节渲染组件
const ChapterComponent = {
  introduction: ChapterIntroduction,
  knowledge: ChapterKnowledge,
  activity: ChapterActivity
}
```

### 3.3 Activity Drawer（活动抽屉）
```vue
<template>
  <el-drawer
    v-model="drawerVisible"
    title="实验/体验活动"
    size="60%"
    direction="rtl"
  >
    <div class="activity-content">
      <!-- Notebook 实验预览 -->
      <div v-if="activity.type === 'lab'" class="lab-preview">
        <div class="nbconvert-preview">
          <iframe :src="labPreviewUrl" />
        </div>
        <div class="lab-status">
          <LocalAgentStatus :agent="localAgent" />
        </div>
      </div>

      <!-- HTML 体验预览 -->
      <div v-else-if="activity.type === 'experience'" class="exp-preview">
        <InteractivePreview
          :experience="activity.experience"
          @fullscreen="enterFullscreen"
        />
      </div>
    </div>
  </el-drawer>
</template>
```

### 3.4 AI Learning Guide（AI学习助手）
```vue
<template>
  <div class="ai-guide">
    <div class="guide-header">
      <h4>AI 学习助手</h4>
      <el-switch v-model="aiEnabled" />
    </div>

    <div v-if="aiEnabled" class="guide-content">
      <!-- AI 总结 -->
      <div class="ai-summary">
        <h5>课程要点总结</h5>
        <p>{{ aiSummary }}</p>
      </div>

      <!-- 知识点巩固 -->
      <div class="knowledge-reinforcement">
        <h5>知识点巩固建议</h5>
        <div class="suggestion-list">
          <div
            v-for="suggestion in aiSuggestions"
            :key="suggestion.id"
            class="suggestion-item"
            @click="applySuggestion(suggestion)"
          >
            {{ suggestion.text }}
          </div>
        </div>
      </div>

      <!-- AI 对话 -->
      <div class="ai-chat">
        <el-input
          v-model="userQuestion"
          placeholder="向AI提问..."
          @keyup.enter="askAI"
        />
        <div class="chat-history">
          <div v-for="msg in chatHistory" :key="msg.id" class="chat-message">
            <span :class="['message', msg.sender]">{{ msg.content }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```

### 3.5 底部课堂反馈条
```vue
<template>
  <div class="classroom-feedback-bar">
    <div class="feedback-item">
      <el-icon><User /></el-icon>
      <span>签到状态：{{ attendanceStatus }}</span>
    </div>

    <div class="feedback-item">
      <el-icon><Camera /></el-icon>
      <span>老师快照：{{ snapshotCount }} 张</span>
    </div>

    <div class="feedback-item ai-suggestion">
      <el-icon><MagicStick /></el-icon>
      <span>{{ aiSuggestion }}</span>
      <el-button size="small" @click="viewAIDetail">查看</el-button>
    </div>
  </div>
</template>
```

## 4. 数据模型与状态管理

### 4.1 Pinia Store 设计
```typescript
// useCourseStore - 课程管理
export const useCourseStore = defineStore('course', {
  state: () => ({
    todayCourses: [] as Course[],
    currentCourse: null as Course | null,
    currentChapter: null as Chapter | null,
    courseProgress: {} as Record<string, number>
  }),

  actions: {
    async loadTodayCourses() { /* ... */ },
    async enterCourse(courseId: string) { /* ... */ },
    async updateProgress(chapterId: string) { /* ... */ }
  }
})

// useActivityStore - 活动状态管理
export const useActivityStore = defineStore('activity', {
  state: () => ({
    currentActivity: null as Activity | null,
    localAgentStatus: 'offline' as AgentStatus,
    activityResources: [] as Resource[]
  }),

  actions: {
    async startActivity(activityId: string) { /* ... */ },
    async checkLocalAgent() { /* ... */ },
    async syncActivityData() { /* ... */ }
  }
})
```

### 4.2 ACL 数据映射
```typescript
// .acl → 前端视图映射
interface AclToViewMapping {
  courseInfo: {
    title: string;
    description: string;
    objectives: string[];
  };
  structure: Chapter[];
  resourceRefs: ResourceRef[];
}

// 解析 ACL 文件
export function parseAclToView(aclData: AclDocument): AclToViewMapping {
  return {
    courseInfo: aclData.courseInfo,
    structure: aclData.structure.map(item => ({
      id: item.id,
      type: item.type,
      title: item.title,
      objectives: item.objectives || [],
      knowledgePoints: item.knowledgePoints || [],
      resources: item.resources || [],
      status: getChapterStatus(item.id)
    })),
    resourceRefs: aclData.resourceRefs || []
  }
}
```

## 5. 实现要点

### 5.1 UI 组件复用策略
```typescript
// 优先从 ui-kit 复用的组件
import {
  EduCard,
  EduButton,
  EduTag,
  EduProgress,
  EduDrawer
} from '@reopeninnolab/ui-kit'

// 课程特化组件（设计完成后推回 ui-kit）
const CourseEntryCard = defineComponent({ /* ... */ })
const ChapterFlow = defineComponent({ /* ... */ })
const ActivityDrawer = defineComponent({ /* ... */ })
```

### 5.2 性能优化
- **懒加载**：章节流采用虚拟滚动 + 懒加载
- **骨架屏**：课程内容加载时显示骨架屏
- **缓存策略**：ACL 解析结果本地缓存

### 5.3 实时同步
```typescript
// WebSocket 连接
const classroomSocket = new WebSocket(`ws://api/classroom/${sessionId}/live`)

socket.onmessage = (event) => {
  const data = JSON.parse(event.data)
  switch (data.type) {
    case 'chapter_updated':
      updateChapterStatus(data.chapterId, data.status)
      break
    case 'activity_started':
      startActivity(data.activityId)
      break
    case 'ai_suggestion':
      showAISuggestion(data.suggestion)
      break
  }
}
```

### 5.4 本地 Agent 集成
```typescript
// 检测本地 Virtual Lab Agent
async function checkLocalAgent(): Promise<AgentStatus> {
  try {
    const response = await fetch('http://localhost:8888/status')
    return response.ok ? 'online' : 'offline'
  } catch {
    return 'offline'
  }
}

// Agent 心跳监控
function startAgentHeartbeat() {
  setInterval(async () => {
    const status = await checkLocalAgent()
    useActivityStore().localAgentStatus = status
  }, 5000)
}
```

## 6. 开发路线图

### 6.1 阶段一：基础架构（1-2周）
- [ ] 创建学生端基础路由和布局
- [ ] 实现 AppBar 和三栏布局组件
- [ ] 建立 Pinia store 基础结构
- [ ] 完成与 identity-service 的登录集成

### 6.2 阶段二：核心功能（2-3周）
- [ ] 实现 ACL 解析器和章节流渲染
- [ ] 开发 Course Entry Card 组件
- [ ] 完成课程切换和进度追踪
- [ ] 集成 course-service API

### 6.3 阶段三：活动系统（2-3周）
- [ ] 实现 Activity Drawer 和预览功能
- [ ] 集成本地 Virtual Lab Agent
- [ ] 完成 HTML 体验预览功能
- [ ] 联通 lab-service 和 experience-service

### 6.4 阶段四：AI集成（1-2周）
- [ ] 实现 AI Learning Guide 组件
- [ ] 集成 AI 助手对话功能
- [ ] 完成智能建议推送
- [ ] 添加学习反思生成

### 6.5 阶段五：优化完善（1周）
- [ ] 性能优化和缓存策略
- [ ] 响应式设计适配
- [ ] 错误处理和降级方案
- [ ] 用户体验细节打磨

## 7. 下一步行动

### 7.1 立即执行
1. **绘制低保真线框图**：验证三栏布局的信息密度与主次层级
2. **定义数据映射表**：明确 `.acl` → 前端视图的字段映射关系
3. **UI组件清单**：列出需要从 ui-kit 复用/扩展的组件清单

### 7.2 技术准备
1. **接口契约定义**：与后端确定课程相关 API 的数据格式
2. **本地Agent协议**：明确与 Virtual Lab Agent 的通信协议
3. **AI服务集成**：确定 AI 助手的 API 调用方式

### 7.3 团队协作
1. **Storybook 示例**：为新增组件创建 Storybook 示例
2. **代码规范**：制定学生端的命名规范和文件组织规则
3. **测试策略**：规划单元测试和集成测试的覆盖范围

---

*此设计文档遵循 "Plan First" 原则，所有实现需严格按照设计文档执行，确保代码质量和一致性。*