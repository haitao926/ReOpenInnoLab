#!/bin/bash

# ReOpenInnoLab 学生端启动脚本
# 启动学生端应用和相关服务

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示学生端Logo
show_student_logo() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║  🎓 ReOpenInnoLab 学生端 - 智能教育平台                         ║"
    echo "║                                                              ║"
    echo "║  📚 课程学习  🤖 AI助手  🔬 虚拟实验  📊 数据分析                  ║"
    echo "║                                                              ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# 检查系统环境
check_environment() {
    log_info "检查系统环境..."

    # 检查 Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log_success "Node.js 已安装: $NODE_VERSION"
    else
        log_error "Node.js 未安装，请先安装 Node.js"
        exit 1
    fi

    # 检查 npm/pnpm
    if command -v pnpm &> /dev/null; then
        PKG_MANAGER="pnpm"
        PKG_VERSION=$(pnpm --version)
        log_success "包管理器: $PKG_MANAGER ($PKG_VERSION)"
    elif command -v npm &> /dev/null; then
        PKG_MANAGER="npm"
        PKG_VERSION=$(npm --version)
        log_success "包管理器: $PKG_MANAGER ($PKG_VERSION)"
    else
        log_error "npm 或 pnpm 未安装，请先安装包管理器"
        exit 1
    fi
}

# 检查项目结构
check_project_structure() {
    log_info "检查项目结构..."

    if [ ! -d "apps/web-student" ]; then
        log_error "学生端项目目录不存在: apps/web-student"
        exit 1
    fi

    if [ ! -f "apps/web-student/package.json" ]; then
        log_error "package.json 不存在，请检查项目初始化"
        exit 1
    fi

    log_success "项目结构检查通过"
}

# 安装依赖
install_dependencies() {
    log_info "安装学生端依赖..."

    cd apps/web-student

    if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules/package-lock.json" ]; then
        log_info "检测到依赖变更，正在安装..."
        if [ "$PKG_MANAGER" = "pnpm" ]; then
            pnpm install
        else
            npm install
        fi
    else
        log_info "依赖已是最新，跳过安装"
    fi

    log_success "依赖安装完成"
}

# 检查端口
check_port() {
    local port=${1:-3003}

    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warning "端口 $port 已被占用，尝试寻找可用端口..."

        for i in {3004..3010}; do
            if ! lsof -Pi :$i -sTCP:LISTEN -t >/dev/null 2>&1; then
                port=$i
                log_success "找到可用端口: $port"
                break
            fi
        done
    else
        log_success "端口 $port 可用"
    fi
}

# 检查后端服务
check_backend_services() {
    log_info "检查后端服务状态..."

    local services=("localhost:3000" "localhost:3001" "localhost:8000")
    local services_status=()

    for service in "${services[@]}; do
        if curl -s --connect-timeout 3 "$service/health" &>/dev/null; then
            log_success "后端服务可用: $service"
            services_status+=("$service: ✅")
        else
            log_warning "后端服务不可用: $service"
            services_status+=("$service: ❌")
        fi
    done

    echo -e "\n${BLUE}后端服务状态:${NC}"
    for status in "${services_status[@]}"; do
        echo "  $status"
    done
}

# 启动开发服务器
start_dev_server() {
    log_info "启动学生端开发服务器..."

    cd apps/web-student

    # 设置环境变量
    export VITE_API_BASE_URL=${VITE_API_BASE_URL:-"http://localhost:3000/api"}
    export VITE_APP_TITLE=${VITE_APP_TITLE:-"ReOpenInnoLab 学生端"}

    # 启动服务器
    log_info "服务器地址: http://localhost:$port"
    log_info "API 地址: $VITE_API_BASE_URL"

    if [ "$PKG_MANAGER" = "pnpm" ]; then
        pnpm dev --port=$port --host
    else
        npm run dev -- --port=$port --host
    fi
}

# 健止函数
cleanup() {
    log_info "正在停止服务..."

    # 查找并终止开发服务器进程
    if pgrep -f "vite.*web-student" > /dev/null; then
        log_info "找到开发服务器进程，正在终止..."
        pkill -f "vite.*web-student"
    fi

    log_success "服务已停止"
    exit 0
}

# 信号处理
trap cleanup SIGINT SIGTERM

# 主函数
main() {
    echo -e "${PURPLE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║           🎓 ReOpenInnoLab 学生端启动脚本                        ║${NC}"
    echo -e "${PURPLE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo

    show_student_logo

    # 执行启动步骤
    check_environment
    check_project_structure
    install_dependencies
    check_port
    check_backend_services

    echo -e "\n${GREEN}🚀 学生端应用即将启动...${NC}\n"

    # 启动开发服务器
    start_dev_server
}

# 显示帮助信息
show_help() {
    echo "ReOpenInnoLab 学生端启动脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help     显示帮助信息"
    echo "  -p, --port     指定端口号 (默认: 3003)"
    echo "  -d, --dev      开发模式 (默认)"
    echo "  --check         仅检查环境，不启动服务"
    echo "  --clean         清理缓存和依赖"
    echo ""
    echo "示例:"
    echo "  $0                # 使用默认配置启动"
    echo "  $0 --port 3004    # 使用端口 3004"
    echo "  $0 --check         # 仅检查环境"
    echo ""
    echo "环境变量:"
    echo "  VITE_API_BASE_URL  API服务器地址 (默认: http://localhost:3000/api)"
    echo "  VITE_APP_TITLE     应用标题 (默认: ReOpenInnoLab 学生端)"
}

# 清理函数
clean_project() {
    log_info "清理项目缓存和依赖..."

    cd apps/web-student

    # 清理缓存
    if [ -d "node_modules/.cache" ]; then
        rm -rf node_modules/.cache
        log_success "缓存已清理"
    fi

    # 清理依赖
    if [ "$PKG_MANAGER" = "pnpm" ]; then
        pnpm store prune
    else
        npm cache clean --force
    fi

    log_success "清理完成"
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -p|--port)
            port=$2
            shift 2
            ;;
        -d|--dev)
            DEV_MODE=true
            shift
            ;;
        --check)
            CHECK_ONLY=true
            shift
            ;;
        --clean)
            clean_project
            exit 0
            ;;
        *)
            log_error "未知参数: $1"
            show_help
            exit 1
            ;;
    esac
done

# 仅检查模式
if [ "$CHECK_ONLY" = "true" ]; then
    check_environment
    check_project_structure
    check_backend_services
    log_success "环境检查完成"
    exit 0
fi

# 执行主函数
main