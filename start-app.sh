#!/bin/bash

echo "🚀 启动 ReOpenInnoLab 智能教育平台..."
echo "=================================="

# 检查当前目录
cd /home/wht/reopeninnolab
echo "📍 当前目录: $(pwd)"

# 停止可能运行的进程
echo "🛑 停止可能运行的进程..."
pkill -f "vite.*3002" 2>/dev/null || true
pkill -f "turbo.*dev" 2>/dev/null || true

# 等待端口释放
sleep 2

# 启动应用
echo "🚀 启动 web-teacher 应用..."
cd apps/web-teacher

# 检查必要文件
if [ ! -f "index.html" ]; then
    echo "❌ 缺少 index.html 文件"
    exit 1
fi

if [ ! -f "src/main.ts" ]; then
    echo "❌ 缺少 src/main.ts 文件"
    exit 1
fi

# 启动开发服务器
echo "📦 启动开发服务器..."
npm run dev &

# 等待应用启动
echo "⏳ 等待应用启动..."
sleep 5

# 检查应用是否启动成功
for i in {1..10}; do
    if curl -s http://localhost:3002/ >/dev/null 2>&1; then
        echo "✅ 应用启动成功！"
        echo "🌐 请在浏览器中访问: http://localhost:3002/"
        echo ""
        echo "🎨 主题系统特色:"
        echo "   • 4种主题模式: 浅色、深色、自动、高对比"
        echo "   • 动态渐变背景动画"
        echo "   • 现代化玻璃质感效果"
        echo "   • 学科专属色彩系统"
        echo "   • 完整的 Element Plus 集成"
        echo ""
        echo "🚀 按 Ctrl+C 停止服务器"
        break
    else
        echo "⏳ 等待应用启动... ($i/10)"
        sleep 3
    fi

    if [ $i -eq 10 ]; then
        echo "❌ 应用启动超时，请检查错误日志"
        echo "📋 可以尝试手动启动: cd apps/web-teacher && npm run dev"
    fi
done

# 保持脚本运行
wait