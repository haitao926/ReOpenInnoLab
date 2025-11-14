#!/bin/bash

# ReOpenInnoLab 停止脚本
# 停止所有服务

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

echo "🛑 停止 ReOpenInnoLab 服务..."
echo "==============================="

# 停止教师端应用
if [ -f /tmp/reopenlab-web-teacher.pid ]; then
    TEACHER_PID=$(cat /tmp/reopenlab-web-teacher.pid)
    if kill -0 $TEACHER_PID 2>/dev/null; then
        log_info "停止教师端应用 (PID: $TEACHER_PID)..."
        kill $TEACHER_PID
        sleep 2
        if kill -0 $TEACHER_PID 2>/dev/null; then
            log_warning "强制停止教师端应用..."
            kill -9 $TEACHER_PID
        fi
        log_success "教师端应用已停止"
    else
        log_info "教师端应用未运行"
    fi
    rm -f /tmp/reopenlab-web-teacher.pid
else
    log_info "教师端应用 PID 文件不存在"
fi

# 停止学生端应用
if [ -f /tmp/reopenlab-web-student.pid ]; then
    STUDENT_PID=$(cat /tmp/reopenlab-web-student.pid)
    if kill -0 $STUDENT_PID 2>/dev/null; then
        log_info "停止学生端应用 (PID: $STUDENT_PID)..."
        kill $STUDENT_PID
        sleep 2
        if kill -0 $STUDENT_PID 2>/dev/null; then
            log_warning "强制停止学生端应用..."
            kill -9 $STUDENT_PID
        fi
        log_success "学生端应用已停止"
    else
        log_info "学生端应用未运行"
    fi
    rm -f /tmp/reopenlab-web-student.pid
else
    log_info "学生端应用 PID 文件不存在"
fi

# 停止API服务器
if [ -f /tmp/reopenlab-api-server.pid ]; then
    API_PID=$(cat /tmp/reopenlab-api-server.pid)
    if kill -0 $API_PID 2>/dev/null; then
        log_info "停止API服务器 (PID: $API_PID)..."
        kill $API_PID
        sleep 2
        if kill -0 $API_PID 2>/dev/null; then
            log_warning "强制停止API服务器..."
            kill -9 $API_PID
        fi
        log_success "API服务器已停止"
    else
        log_info "API服务器未运行"
    fi
    rm -f /tmp/reopenlab-api-server.pid
else
    log_info "API服务器 PID 文件不存在"
fi

# 额外清理：停止所有可能的相关进程
log_info "清理可能残留的进程..."
pkill -f "vite.*3000" 2>/dev/null || true
pkill -f "vite.*3001" 2>/dev/null || true
pkill -f "vite.*3002" 2>/dev/null || true
pkill -f "vite.*3003" 2>/dev/null || true
pkill -f "turbo.*dev" 2>/dev/null || true

# 清理临时文件
log_info "清理临时文件..."
rm -f /tmp/reopenlab-*.pid

log_success "所有 ReOpenInnoLab 服务已停止"
echo ""
echo "✅ 服务已完全停止"
echo "💡 如需重新启动，请运行: ./start-app.sh"