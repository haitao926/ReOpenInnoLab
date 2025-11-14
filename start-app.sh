#!/bin/bash

# ReOpenInnoLab 启动脚本
# 启动所有必要的服务和应用

set -e

# 默认参数
START_TEACHER=true
START_STUDENT=false
START_BACKEND=true

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

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

log_service() {
    echo -e "${CYAN}[SERVICE]${NC} $1"
}

# 检查依赖
check_dependencies() {
    log_step "检查系统依赖..."

    # 检查 pnpm
    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm 未安装，请先安装 pnpm"
        exit 1
    fi

    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先安装 Node.js >= 18.0.0"
        exit 1
    fi

    log_success "所有依赖检查通过"
}

# 安装依赖
install_dependencies() {
    log_step "安装前端应用依赖..."

    cd /home/wht/reopeninnolab

    # 安装教师端应用依赖
    if [ "$START_TEACHER" = "true" ]; then
        log_info "安装教师端应用依赖..."
        cd apps/web-teacher
        pnpm install
        cd /home/wht/reopeninnolab
    fi

    # 安装学生端应用依赖
    if [ "$START_STUDENT" = "true" ]; then
        log_info "安装学生端应用依赖..."
        cd apps/web-student
        pnpm install
        cd /home/wht/reopeninnolab
    fi

    log_success "前端依赖安装完成"
}

# 启动后端服务（可选）
start_backend_services() {
    log_step "检查后端服务..."

    cd /home/wht/reopeninnolab

    # 检查是否有后端服务目录
    if [ -d "services/identity-service" ]; then
        log_service "启动身份认证服务..."
        cd services/identity-service

        # 检查是否存在开发服务器
        if [ -f "dev-server.js" ]; then
            log_info "启动开发API服务器..."
            node dev-server.js &
            API_PID=$!
            echo $API_PID > /tmp/reopenlab-api-server.pid
            log_success "API服务器已启动 (PID: $API_PID, Port: 8080)"
        else
            log_warning "未找到dev-server.js，跳过API服务器启动"
        fi

        cd /home/wht/reopeninnolab

        # 等待API服务器启动
        log_info "等待API服务器启动..."
        sleep 3

        if kill -0 $API_PID 2>/dev/null; then
            log_success "API服务器启动成功"
        else
            log_error "API服务器启动失败"
        fi

    elif [ -d "services/course-service" ] || [ -d "services/lab-service" ]; then
        log_info "发现其他后端服务，但未配置启动方式"
        log_info "如需启动后端服务，请手动运行相应的启动命令"
    else
        log_info "未发现后端服务目录，仅启动前端应用"
    fi
}

# 启动前端应用
start_frontend_applications() {
    log_step "启动前端应用..."

    cd /home/wht/reopeninnolab

    # 启动教师端应用
    if [ "$START_TEACHER" = "true" ]; then
        log_service "启动教师端应用..."
        cd apps/web-teacher
        pnpm run dev &
        TEACHER_PID=$!
        cd /home/wht/reopeninnolab

        # 等待教师端应用启动
        log_info "等待教师端应用启动..."
        sleep 5

        if kill -0 $TEACHER_PID 2>/dev/null; then
            log_success "教师端应用启动成功 (PID: $TEACHER_PID)"
            echo $TEACHER_PID > /tmp/reopenlab-web-teacher.pid
        else
            log_error "教师端应用启动失败"
        fi
    fi

    # 启动学生端应用
    if [ "$START_STUDENT" = "true" ]; then
        log_service "启动学生端应用..."
        cd apps/web-student
        pnpm run dev &
        STUDENT_PID=$!
        cd /home/wht/reopeninnolab

        # 等待学生端应用启动
        log_info "等待学生端应用启动..."
        sleep 5

        if kill -0 $STUDENT_PID 2>/dev/null; then
            log_success "学生端应用启动成功 (PID: $STUDENT_PID)"
            echo $STUDENT_PID > /tmp/reopenlab-web-student.pid
        else
            log_error "学生端应用启动失败"
        fi
    fi
}

# 显示访问信息
show_access_info() {
    echo ""
    echo "🎉 ReOpenInnoLab 应用启动完成!"
    echo ""
    echo "🌐 服务地址:"

    if [ "$START_TEACHER" = "true" ]; then
        echo "  👨‍🏫 教师端: http://localhost:3000"
    fi

    if [ "$START_STUDENT" = "true" ]; then
        echo "  🎓 学生端: http://localhost:3003"
    fi

    if [ "$START_BACKEND" = "true" ]; then
        echo "  🔗 API服务: http://localhost:8080"
    fi

    echo ""
    echo "👤 测试账号:"
    echo "  📧 teacher@reopenlab.dev | 🔑 密码: test"
    echo "  📧 admin@reopenlab.dev | 🔑 密码: test"
    echo "  📧 student@reopenlab.dev | 🔑 密码: test"
    echo ""
    echo "🎨 系统特色:"
    echo "   • 智能教育平台，支持教师端和学生端"
    echo "   • AI学习助手和虚拟实验室"
    echo "   • 完整的课程管理和进度追踪"
    echo "   • 现代化响应式设计"
    echo ""
    echo "📋 管理命令:"
    echo "  停止服务: ./stop-app.sh"
    echo "  重启服务: ./restart-app.sh"
    echo "  仅启动学生端: ./start-app.sh --student"
    echo "  仅启动教师端: ./start-app.sh --teacher"
    echo "  启动所有应用: ./start-app.sh --all"
    echo ""
    echo "💡 提示: 按 Ctrl+C 停止所有服务"
}

# 清理函数
cleanup() {
    echo ""
    log_warning "正在停止所有服务..."

    # 停止教师端应用
    if [ -f /tmp/reopenlab-web-teacher.pid ]; then
        TEACHER_PID=$(cat /tmp/reopenlab-web-teacher.pid)
        if kill -0 $TEACHER_PID 2>/dev/null; then
            kill $TEACHER_PID
            log_info "教师端应用已停止"
        fi
        rm -f /tmp/reopenlab-web-teacher.pid
    fi

    # 停止学生端应用
    if [ -f /tmp/reopenlab-web-student.pid ]; then
        STUDENT_PID=$(cat /tmp/reopenlab-web-student.pid)
        if kill -0 $STUDENT_PID 2>/dev/null; then
            kill $STUDENT_PID
            log_info "学生端应用已停止"
        fi
        rm -f /tmp/reopenlab-web-student.pid
    fi

    # 停止API服务器
    if [ -f /tmp/reopenlab-api-server.pid ]; then
        API_PID=$(cat /tmp/reopenlab-api-server.pid)
        if kill -0 $API_PID 2>/dev/null; then
            kill $API_PID
            log_info "API服务器已停止"
        fi
        rm -f /tmp/reopenlab-api-server.pid
    fi

    # 额外清理：停止可能的相关进程
    log_info "清理可能残留的进程..."
    pkill -f "vite.*3000" 2>/dev/null || true
    pkill -f "vite.*3003" 2>/dev/null || true
    pkill -f "turbo.*dev" 2>/dev/null || true
    pkill -f "node.*dev-server.js" 2>/dev/null || true

    log_success "所有服务已停止"
    exit 0
}

# 设置信号处理
trap cleanup SIGINT SIGTERM

# 主函数
main() {
    echo "🚀 ReOpenInnoLab 启动脚本"
    echo "================================"

    # 检查是否在项目根目录
    if [ ! -f "/home/wht/reopeninnolab/package.json" ]; then
        log_error "请在项目根目录运行此脚本"
        exit 1
    fi

    # 检查是否已经有服务在运行
    if ([ "$START_TEACHER" = "true" ] && [ -f "/tmp/reopenlab-web-teacher.pid" ] && kill -0 $(cat /tmp/reopenlab-web-teacher.pid) 2>/dev/null) || \
       ([ "$START_STUDENT" = "true" ] && [ -f "/tmp/reopenlab-web-student.pid" ] && kill -0 $(cat /tmp/reopenlab-web-student.pid) 2>/dev/null) || \
       ([ "$START_BACKEND" = "true" ] && [ -f "/tmp/reopenlab-api-server.pid" ] && kill -0 $(cat /tmp/reopenlab-api-server.pid) 2>/dev/null); then
        log_warning "检测到已有服务在运行，请先运行 ./stop-app.sh 停止现有服务"
        exit 1
    fi

    # 执行启动步骤
    check_dependencies
    install_dependencies

    if [ "$START_BACKEND" = "true" ]; then
        start_backend_services
    fi

    start_frontend_applications
    show_access_info

    # 保持脚本运行
    log_info "所有服务已启动，按 Ctrl+C 停止..."
    while true; do
        sleep 1
    done
}

# 显示帮助信息
show_help() {
    echo "ReOpenInnoLab 启动脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help      显示帮助信息"
    echo "  -t, --teacher   仅启动教师端应用 (默认)"
    echo "  -s, --student   仅启动学生端应用"
    echo "  -b, --backend   启动后端服务 (默认包含)"
    echo "  -a, --all       启动所有应用 (教师端 + 学生端 + 后端)"
    echo "  --no-backend    不启动后端服务"
    echo ""
    echo "示例:"
    echo "  $0                    # 启动教师端应用 (默认行为)"
    echo "  $0 --student          # 仅启动学生端应用"
    echo "  $0 --all              # 启动所有应用"
    echo "  $0 --teacher --no-backend  # 仅启动教师端，不启动后端"
    echo ""
    echo "服务地址:"
    echo "  👨‍🏫 教师端: http://localhost:3000"
    echo "  🎓 学生端: http://localhost:3003"
    echo "  🔗 API服务: http://localhost:8080"
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -t|--teacher)
            START_TEACHER=true
            START_STUDENT=false
            shift
            ;;
        -s|--student)
            START_TEACHER=false
            START_STUDENT=true
            shift
            ;;
        -b|--backend)
            START_BACKEND=true
            shift
            ;;
        -a|--all)
            START_TEACHER=true
            START_STUDENT=true
            START_BACKEND=true
            shift
            ;;
        --no-backend)
            START_BACKEND=false
            shift
            ;;
        *)
            log_error "未知参数: $1"
            show_help
            exit 1
            ;;
    esac
done

# 运行主函数
main "$@"