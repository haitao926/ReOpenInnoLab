#!/bin/bash

# 开发环境快速设置脚本

echo "🚀 开始设置 ReOpenInnoLab 开发环境..."

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js >= 18.0.0"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"

# 检查并安装 pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 安装 pnpm..."
    curl -fsSL https://get.pnpm.io/install.sh | sh -

    # 重新加载环境变量
    export PNPM_HOME="$HOME/.local/share/pnpm"
    case ":$PATH:" in
        *":$PNPM_HOME:"*) ;;
        *) export PATH="$PNPM_HOME:$PATH" ;;
    esac
fi

if command -v pnpm &> /dev/null; then
    echo "✅ pnpm 版本: $(pnpm --version)"
else
    echo "⚠️  使用 npx pnpm 作为备选方案"
    PNPM_CMD="npx pnpm@latest"
fi

# 复制环境配置
if [ ! -f .env.local ]; then
    echo "📝 复制环境配置文件..."
    cp .env.example .env.local
    echo "✅ 已创建 .env.local 文件，请根据需要修改配置"
else
    echo "✅ .env.local 文件已存在"
fi

# 安装依赖
echo "📦 安装项目依赖..."
if [ -n "$PNPM_CMD" ]; then
    $PNPM_CMD install
else
    pnpm install
fi

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p logs
mkdir -p uploads
mkdir -p temp

echo ""
echo "🎉 开发环境设置完成！"
echo ""
echo "📋 下一步操作："
echo "1. 编辑 .env.local 文件，配置必要的环境变量"
echo "2. 启动开发服务:"
echo ""
if [ -n "$PNPM_CMD" ]; then
    echo "   $PNPM_CMD dev"
else
    echo "   pnpm dev"
fi
echo ""
echo "3. 访问应用:"
echo "   教师端: http://localhost:5173"
echo "   API文档: http://localhost:8080/docs"
echo ""
echo "📚 更多信息请查看 QUICK_START.md"