# 快速启动指南

## 🚀 立即开始

### 1. 环境准备

确保你的系统已安装：
- Node.js >= 18.0.0 ✅ (当前: v22.19.0)
- Docker >= 20.0.0
- pnpm >= 8.0.0

### 2. 安装 pnpm (如果尚未安装)

```bash
# 方法1: 使用官方安装器
curl -fsSL https://get.pnpm.io/install.sh | sh -

# 方法2: 使用 corepack (Node.js 16.10+)
corepack enable && corepack prepare pnpm@latest --activate

# 方法3: 使用 npx (临时使用)
npx pnpm@latest --version
```

### 3. 安装项目依赖

```bash
# 使用 pnpm
pnpm install

# 或者使用 npx (如果没有全局安装 pnpm)
npx pnpm@latest install
```

### 4. 环境配置

```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑环境变量文件，配置必要的服务
nano .env.local
```

**最少需要配置的变量：**
```env
# 数据库 (如果本地没有 PostgreSQL，可以暂时跳过)
DATABASE_URL=postgresql://username:password@localhost:5432/reopeninnolab

# Redis (如果本地没有 Redis，可以暂时跳过)
REDIS_URL=redis://localhost:6379

# AI 服务 (使用提供的 DeepSeek API Key)
DEEPSEEK_API_KEY=sk-5544d60887e1411b9100119f8e439b99
AI_DEFAULT_PROVIDER=deepseek
```

### 5. 启动开发服务

```bash
# 启动所有服务
pnpm dev

# 或者启动特定服务
pnpm dev:web-teacher          # 教师端前端
pnpm dev:course-service       # 课程管理服务
pnpm dev:ai-service          # AI 服务
```

### 6. 访问应用

- 教师端: http://localhost:5173
- 学生端: http://localhost:5174
- 管理控制台: http://localhost:5175
- API网关: http://localhost:8080
- API文档: http://localhost:8080/docs

## 🔧 如果遇到问题

### 依赖安装失败
```bash
# 清理缓存重试
rm -rf node_modules
pnpm install
```

### 端口冲突
```bash
# 查看端口占用
lsof -i :8080
lsof -i :5173

# 修改 .env.local 中的端口配置
PORT=8081
```

### 数据库连接失败
可以暂时跳过数据库相关功能，先体验前端界面和AI服务。

## 📚 可用命令

```bash
# 开发相关
pnpm dev                    # 启动所有服务
pnpm dev:service-name      # 启动特定服务
pnpm build                 # 构建所有包
pnpm test                  # 运行测试

# 代码质量
pnpm lint                  # 代码检查
pnpm lint:fix              # 自动修复
pnpm format               # 代码格式化

# 数据库操作 (需要数据库服务)
pnpm db:migrate           # 运行迁移
pnpm db:seed              # 填充测试数据
```

## 🎯 下一步

1. 查看 [架构文档](./docs/architecture/)
2. 了解 [API文档](./docs/api/)
3. 阅读 [开发指南](./docs/development/)

---

**提示**: 项目支持部分功能运行，即使没有完整的基础设施也可以体验核心功能。