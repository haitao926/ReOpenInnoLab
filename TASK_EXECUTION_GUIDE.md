# 任务执行快速指南

## 🚀 立即开始执行

### 当前可以执行的任务 (按优先级排序)

#### 1. 完成 UI 主题资源整合 (0.5 天)
```bash
# 在 apps/web-teacher/src/main.ts 中添加导入
import '@ui-kit/index.scss'

# 检查样式是否正确加载
pnpm dev:web-teacher
```

#### 2. 创建教师端页面骨架 (2 天)
```bash
# 创建页面目录
mkdir -p apps/web-teacher/src/views/{Dashboard,Courses,Classrooms,Assignments,Settings}

# 快速创建基础页面模板
pnpm run create:page Dashboard
pnpm run create:page Courses/List
pnpm run create:page Courses/Detail
```

#### 3. 构建 ACL SDK MVP (3 天)
```bash
# 进入 ACL SDK 目录
cd packages/acl-sdk

# 安装依赖
pnpm install ajv yaml

# 运行测试
pnpm test

# 构建 SDK
pnpm build
```

#### 4. 启动本地开发环境 (1 天)
```bash
# 启动 Docker 服务
./scripts/dev-up.sh

# 等待服务启动后运行开发服务
pnpm dev
```

## 📋 每日任务检查清单

### 开发前检查
- [ ] 运行 `pnpm type-check` 确保无类型错误
- [ ] 运行 `pnpm lint:all` 确保代码规范
- [ ] 检查 `pnpm test` 测试是否通过

### 开发后检查
- [ ] 新增代码是否有对应的测试
- [ ] 是否更新了相关文档
- [ ] 是否提交前通过了所有检查

## 🔧 常用命令速查

### 开发相关
```bash
# 启动所有服务
pnpm dev

# 启动特定服务
pnpm dev:web-teacher
pnpm dev:identity-service

# 类型检查
pnpm type-check

# 代码检查和格式化
pnpm lint:all
pnpm format

# 运行测试
pnpm test
pnpm test:coverage
```

### 构建相关
```bash
# 构建所有包
pnpm build

# 构建特定包
pnpm build --filter=web-teacher
pnpm build --filter=acl-sdk

# 清理构建产物
pnpm clean
```

### Docker 相关
```bash
# 启动开发环境
./scripts/dev-up.sh

# 停止开发环境
./scripts/dev-down.sh

# 查看服务状态
docker-compose -f docker-compose.dev.yml ps

# 查看日志
docker-compose -f docker-compose.dev.yml logs -f
```

## 🐛 常见问题解决

### TypeScript 路径别名问题
```bash
# 检查 tsconfig.json 配置
cat tsconfig.base.json

# 重新生成类型声明
pnpm build --filter=ui-kit
```

### 样式不生效问题
```bash
# 检查样式文件导入顺序
# 确保 @ui-kit/index.scss 在 main.scss 之前导入

# 检查 CSS 变量是否正确定义
grep "var(--color-" apps/web-teacher/src/assets/styles/main.scss
```

### 开发服务启动失败
```bash
# 检查端口占用
lsof -i :5173
lsof -i :8080

# 清理缓存
rm -rf node_modules
rm -rf .turbo
pnpm install
```

## 📝 提交规范

### 提交信息格式
```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### 类型说明
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式化
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建工具或辅助工具的变动

### 示例
```
feat(teacher): add course creation dialog

- Implement course creation form with validation
- Add ACL file upload functionality
- Integrate with course service API

Closes #123
```

## 🎯 快速验证方法

### 前端功能验证
```bash
# 1. 启动开发服务
pnpm dev:web-teacher

# 2. 访问 http://localhost:5173

# 3. 检查以下功能：
# - 路由跳转正常
# - 侧边栏折叠/展开
# - 主题切换生效
# - 用户认证流程
# - AI助手响应
```

### 后端服务验证
```bash
# 1. 启动 Docker 服务
./scripts/dev-up.sh

# 2. 启动身份认证服务
pnpm dev:identity-service

# 3. 测试 API 端点
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 集成测试
```bash
# 运行端到端测试
pnpm test:e2e

# 运行集成测试
pnpm test:integration

# 检查测试覆盖率
pnpm test:coverage
```

---

## 📞 获取帮助

### 查看项目结构
```bash
# 查看完整目录结构
find . -type d -name "node_modules" -prune -o -type d -print | sort

# 查看特定文件
find . -name "*.vue" -o -name "*.ts" | head -20
```

### 查看日志
```bash
# 查看构建日志
pnpm build --verbose

# 查看 Turbo 日志
pnpm dev --filter=web-teacher --log-level=debug
```

### 性能分析
```bash
# 前端构建分析
pnpm build --filter=web-teacher --analyze

# 运行性能测试
k6 run tests/load/smoke-test.js
```

---

**快速开始**: 运行 `./scripts/dev-setup.sh` 立即开始开发！