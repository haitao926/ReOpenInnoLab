#!/bin/bash

# ReOpenInnoLab 前端启动脚本 - 简化版
# 仅启动前端应用，不安装全局依赖

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

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🚀 启动 ReOpenInnoLab 前端应用..."
echo "=================================="

# 检查当前目录
cd /home/wht/reopeninnolab
echo "📍 当前目录: $(pwd)"

# 停止可能运行的进程
echo "🛑 停止可能运行的进程..."
pkill -f "vite.*3000" 2>/dev/null || true
pkill -f "vite.*3001" 2>/dev/null || true
pkill -f "vite.*3002" 2>/dev/null || true

# 等待端口释放
sleep 2

# 进入前端目录
echo "📂 进入前端应用目录..."
cd apps/web-teacher

# 检查必要文件
if [ ! -f "package.json" ]; then
    log_error "❌ 缺少 package.json 文件"
    exit 1
fi

# 检查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
    log_info "📦 首次运行，安装依赖..."
    npm install
else
    log_info "✅ 依赖已存在，跳过安装"
fi

# 启动开发服务器
echo "🚀 启动开发服务器..."
npm run dev &
TEACHER_PID=$!

# 保存 PID
echo $TEACHER_PID > /tmp/reopenlab-web-teacher.pid

# 等待应用启动
echo "⏳ 等待应用启动..."
sleep 8

# 检查应用是否启动成功
for i in {1..15}; do
    if kill -0 $TEACHER_PID 2>/dev/null; then
        # 尝试检查端口是否开放
        if curl -s http://localhost:3000/ >/dev/null 2>&1 || curl -s http://localhost:3001/ >/dev/null 2>&1 || curl -s http://localhost:3002/ >/dev/null 2>&1; then
            echo ""
            echo "🎉 前端应用启动成功！"

            # 找到实际运行的端口
            for port in 3000 3001 3002 3003; do
                if curl -s http://localhost:$port/ >/dev/null 2>&1; then
                    echo "🌐 请在浏览器中访问: http://localhost:$port/"
                    echo ""
                    echo "🎨 主题系统特色:"
                    echo "   • 4种主题模式: 浅色、深色、自动、高对比"
                    echo "   • 动态渐变背景动画"
                    echo "   • 现代化玻璃质感效果"
                    echo "   • 学科专属色彩系统"
                    echo "   • 完整的 Element Plus 集成"
                    echo ""
                    echo "💡 按 Ctrl+C 停止服务器"
                    break
                fi
            done
            break
        else
            if [ $i -lt 15 ]; then
                echo "⏳ 等待应用启动... ($i/15)"
                sleep 2
            fi
        fi
    else
        echo "❌ 应用进程意外退出"
        exit 1
    fi

    if [ $i -eq 15 ]; then
        echo ""
        echo "⚠️  应用启动中，可能需要更多时间..."
        echo "🌐 请稍后尝试访问以下端口:"
        echo "   http://localhost:3000/"
        echo "   http://localhost:3001/"
        echo "   http://localhost:3002/"
        echo ""
        echo "💡 按 Ctrl+C 停止服务器"
    fi
done

# 清理函数
cleanup() {
    echo ""
    echo "🛑 正在停止前端应用..."
    if [ -f /tmp/reopenlab-web-teacher.pid ]; then
        PID=$(cat /tmp/reopenlab-web-teacher.pid)
        if kill -0 $PID 2>/dev/null; then
            kill $PID 2>/dev/null || true
            sleep 1
            kill -9 $PID 2>/dev/null || true
        fi
        rm -f /tmp/reopenlab-web-teacher.pid
    fi

    # 额外清理
    pkill -f "vite.*3000" 2>/dev/null || true
    pkill -f "vite.*3001" 2>/dev/null || true
    pkill -f "vite.*3002" 2>/dev/null || true

    echo "✅ 前端应用已停止"
    exit 0
}

# 设置信号处理
trap cleanup SIGINT SIGTERM

# 保持脚本运行
log_info "前端应用正在运行，按 Ctrl+C 停止..."
while true; do
    if ! kill -0 $TEACHER_PID 2>/dev/null; then
        echo "❌ 应用进程已停止"
        exit 1
    fi
    sleep 1
done