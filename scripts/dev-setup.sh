#!/bin/bash

# ReOpenInnoLab 开发环境设置脚本
# 用于快速启动本地开发环境

set -e

echo "🚀 ReOpenInnoLab 开发环境设置"
echo "================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查 Docker 是否运行
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker 未运行，请先启动 Docker${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker 运行正常${NC}"
}

# 检查 Docker Compose
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}❌ Docker Compose 未安装${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker Compose 可用${NC}"
}

# 创建必要的目录
create_directories() {
    echo -e "${BLUE}📁 创建必要的目录...${NC}"
    mkdir -p logs
    mkdir -p data/postgres
    mkdir -p data/redis
    mkdir -p data/minio
    echo -e "${GREEN}✅ 目录创建完成${NC}"
}

# 启动基础设施服务
start_infrastructure() {
    echo -e "${BLUE}🐳 启动基础设施服务...${NC}"

    # 使用 docker-compose 或者 docker compose
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        COMPOSE_CMD="docker compose"
    fi

    # 启动基础服务
    $COMPOSE_CMD -f docker-compose.dev.yml up -d postgres redis minio

    echo -e "${GREEN}✅ 基础服务启动完成${NC}"
}

# 等待数据库就绪
wait_for_db() {
    echo -e "${BLUE}⏳ 等待数据库就绪...${NC}"

    # 使用 docker-compose 或者 docker compose
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        COMPOSE_CMD="docker compose"
    fi

    # 等待 PostgreSQL 就绪
    max_attempts=30
    attempt=1

    while [ $attempt -le $max_attempts ]; do
        if $COMPOSE_CMD -f docker-compose.dev.yml exec postgres pg_isready -U reopenlab -d reopenlab_dev > /dev/null 2>&1; then
            echo -e "${GREEN}✅ PostgreSQL 就绪${NC}"
            break
        fi

        if [ $attempt -eq $max_attempts ]; then
            echo -e "${RED}❌ PostgreSQL 启动超时${NC}"
            exit 1
        fi

        echo -e "${YELLOW}尝试 $attempt/$max_attempts: 等待 PostgreSQL...${NC}"
        sleep 2
        ((attempt++))
    done
}

# 初始化数据库连接信息
setup_env() {
    echo -e "${BLUE}🔧 设置环境变量...${NC}"

    # 创建 .env.development 文件
    cat > .env.development << EOF
# 数据库配置
DATABASE_URL=postgresql://reopenlab:reopenlab_dev_password@localhost:5432/reopenlab_dev
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=reopenlab_dev
DATABASE_USER=reopenlab
DATABASE_PASSWORD=reopenlab_dev_password

# Redis 配置
REDIS_URL=redis://:reopenlab_redis_password@localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=reopenlab_redis_password

# MinIO 配置
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=reopenlab
MINIO_SECRET_KEY=reopenlab_minio_password
MINIO_BUCKET=reopenlab-files
MINIO_USE_SSL=false

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# 应用配置
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:3000

# 日志配置
LOG_LEVEL=debug
LOG_FORMAT=dev

# 开发工具
ENABLE_PG_ADMIN=true
ENABLE_REDIS_COMMANDER=true
EOF

    echo -e "${GREEN}✅ 环境变量文件已创建${NC}"
}

# 创建数据库迁移脚本
create_migration_script() {
    echo -e "${BLUE}📜 创建数据库迁移脚本...${NC}"

    # 使用 docker-compose 或者 docker compose
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        COMPOSE_CMD="docker compose"
    fi

    # 运行初始化脚本
    $COMPOSE_CMD -f docker-compose.dev.yml exec -T postgres psql -U reopenlab -d reopenlab_dev < scripts/init-db.sql

    echo -e "${GREEN}✅ 数据库结构初始化完成${NC}"
}

# 插入种子数据
seed_data() {
    echo -e "${BLUE}🌱 插入种子数据...${NC}"

    # 使用 docker-compose 或者 docker compose
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        COMPOSE_CMD="docker compose"
    fi

    # 运行种子数据脚本
    $COMPOSE_CMD -f docker-compose.dev.yml exec -T postgres psql -U reopenlab -d reopenlab_dev < scripts/seed-data.sql

    echo -e "${GREEN}✅ 种子数据插入完成${NC}"
}

# 验证安装
verify_installation() {
    echo -e "${BLUE}🔍 验证安装...${NC}"

    # 使用 docker-compose 或者 docker compose
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        COMPOSE_CMD="docker compose"
    fi

    # 检查服务状态
    echo -e "${BLUE}服务状态:${NC}"
    $COMPOSE_CMD -f docker-compose.dev.yml ps

    # 检查数据库连接
    if $COMPOSE_CMD -f docker-compose.dev.yml exec postgres psql -U reopenlab -d reopenlab_dev -c "SELECT COUNT(*) as user_count FROM users;" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 数据库连接正常${NC}"
    else
        echo -e "${RED}❌ 数据库连接失败${NC}"
        exit 1
    fi

    # 显示可用用户
    echo -e "${BLUE}可用的测试账号:${NC}"
    $COMPOSE_CMD -f docker-compose.dev.yml exec postgres psql -U reopenlab -d reopenlab_dev -c "SELECT email, name, role_type FROM users ORDER BY role_type, name;"

    echo -e "${GREEN}✅ 安装验证完成${NC}"
}

# 显示有用信息
show_info() {
    echo -e "${BLUE}📋 开发环境信息:${NC}"
    echo ""
    echo "🔗 服务访问地址:"
    echo "  • PostgreSQL: localhost:5432"
    echo "  • Redis: localhost:6379"
    echo "  • MinIO Console: http://localhost:9001"
    echo "  • MinIO API: http://localhost:9000"
    echo "  • pgAdmin: http://localhost:5050"
    echo "  • Redis Commander: http://localhost:8081"
    echo ""
    echo "👤 测试账号:"
    echo "  • 管理员: admin@reopenlab.dev / admin123"
    echo "  • 教师: teacher@reopenlab.dev / teacher123"
    echo "  • 学生: student@reopenlab.dev / student123"
    echo ""
    echo "📝 下一步:"
    echo "  1. 启动 identity-service: cd services/identity-service && npm run dev"
    echo "  2. 启动前端: cd apps/web-teacher && npm run dev"
    echo "  3. 访问: http://localhost:3000"
    echo ""
    echo "🛠 管理命令:"
    echo "  • 查看日志: docker-compose -f docker-compose.dev.yml logs -f [service-name]"
    echo "  • 停止服务: docker-compose -f docker-compose.dev.yml down"
    echo "  • 重启服务: docker-compose -f docker-compose.dev.yml restart [service-name]"
    echo ""
}

# 主函数
main() {
    echo -e "${BLUE}开始设置开发环境...${NC}"
    echo ""

    check_docker
    check_docker_compose
    create_directories
    start_infrastructure
    wait_for_db
    setup_env
    create_migration_script
    seed_data
    verify_installation
    show_info

    echo -e "${GREEN}🎉 开发环境设置完成！${NC}"
}

# 错误处理
trap 'echo -e "${RED}❌ 设置过程中发生错误${NC}"; exit 1' ERR

# 执行主函数
main