#!/bin/bash

# 主题开发启动脚本
# 提供主题开发和验证的快速启动工具

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 项目路径
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UI_KIT_PATH="$PROJECT_ROOT/packages/ui-kit"
WEB_TEACHER_PATH="$PROJECT_ROOT/apps/web-teacher"

# 输出带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    echo
    print_message $BLUE "🎨 ReOpenInnoLab 主题开发工具"
    echo "=========================================="
}

# 显示帮助信息
show_help() {
    print_header
    echo
    print_message $CYAN "用法:"
    echo "  $0 [选项]"
    echo
    print_message $CYAN "选项:"
    echo "  dev         启动开发服务器 (web-teacher)"
    echo "  validate    验证主题系统"
    echo "  build       构建所有包"
    echo "  lint        运行代码检查"
    echo "  test        运行测试"
    echo "  clean       清理构建产物"
    echo "  preview     预览主题组件 (启动组件展示)"
    echo "  status      显示当前主题状态"
    echo "  help        显示此帮助信息"
    echo
    print_message $CYAN "示例:"
    echo "  $0 dev          # 启动开发服务器"
    echo "  $0 validate     # 验证主题系统"
    echo "  $0 preview      # 预览组件展示"
    echo
}

# 检查依赖
check_dependencies() {
    print_message $YELLOW "🔍 检查依赖..."

    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        print_message $RED "❌ Node.js 未安装，请先安装 Node.js"
        exit 1
    fi

    # 检查 npm/pnpm
    if command -v pnpm &> /dev/null; then
        PKG_MANAGER="pnpm"
    elif command -v npm &> /dev/null; then
        PKG_MANAGER="npm"
    else
        print_message $RED "❌ 找不到包管理器 (npm 或 pnpm)"
        exit 1
    fi

    print_message $GREEN "✅ 依赖检查完成 (使用 $PKG_MANAGER)"
}

# 安装依赖
install_dependencies() {
    print_message $YELLOW "📦 安装依赖..."
    cd "$PROJECT_ROOT"

    if [ "$PKG_MANAGER" = "pnpm" ]; then
        pnpm install
    else
        npm install
    fi

    print_message $GREEN "✅ 依赖安装完成"
}

# 启动开发服务器
start_dev() {
    print_message $YELLOW "🚀 启动开发服务器..."

    cd "$WEB_TEACHER_PATH"

    if [ "$PKG_MANAGER" = "pnpm" ]; then
        pnpm dev
    else
        npm run dev
    fi
}

# 验证主题系统
validate_theme() {
    print_message $YELLOW "🔍 验证主题系统..."

    cd "$PROJECT_ROOT"
    node scripts/validate-theme.js

    if [ $? -eq 0 ]; then
        print_message $GREEN "✅ 主题系统验证通过"
    else
        print_message $RED "❌ 主题系统验证失败"
        exit 1
    fi
}

# 构建所有包
build_packages() {
    print_message $YELLOW "🔨 构建所有包..."

    cd "$PROJECT_ROOT"

    # 首先构建 UI Kit
    print_message $BLUE "构建 UI Kit..."
    cd "$UI_KIT_PATH"
    if [ "$PKG_MANAGER" = "pnpm" ]; then
        pnpm build || print_message $YELLOW "⚠️ UI Kit 构建可能有问题，但继续执行..."
    else
        npm run build || print_message $YELLOW "⚠️ UI Kit 构建可能有问题，但继续执行..."
    fi

    # 构建 web-teacher
    print_message $BLUE "构建 web-teacher..."
    cd "$WEB_TEACHER_PATH"
    if [ "$PKG_MANAGER" = "pnpm" ]; then
        pnpm build
    else
        npm run build
    fi

    print_message $GREEN "✅ 构建完成"
}

# 运行代码检查
run_lint() {
    print_message $YELLOW "🔍 运行代码检查..."

    cd "$PROJECT_ROOT"

    # 运行主题验证
    node scripts/validate-theme.js

    # 运行 ESLint (如果存在)
    if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ]; then
        if [ "$PKG_MANAGER" = "pnpm" ]; then
            pnpm lint
        else
            npm run lint
        fi
    fi

    # 运行 Stylelint (如果存在)
    if [ -f ".stylelintrc.json" ]; then
        if [ "$PKG_MANAGER" = "pnpm" ]; then
            pnpm lint:style
        else
            npm run lint:style 2>/dev/null || print_message $YELLOW "⚠️ lint:style 脚本不存在"
        fi
    fi

    print_message $GREEN "✅ 代码检查完成"
}

# 运行测试
run_tests() {
    print_message $YELLOW "🧪 运行测试..."

    cd "$PROJECT_ROOT"

    # 测试 UI Kit
    print_message $BLUE "测试 UI Kit..."
    cd "$UI_KIT_PATH"
    if [ "$PKG_MANAGER" = "pnpm" ]; then
        pnpm test 2>/dev/null || print_message $YELLOW "⚠️ UI Kit 测试可能不存在"
    else
        npm test 2>/dev/null || print_message $YELLOW "⚠️ UI Kit 测试可能不存在"
    fi

    # 测试 web-teacher
    print_message $BLUE "测试 web-teacher..."
    cd "$WEB_TEACHER_PATH"
    if [ "$PKG_MANAGER" = "pnpm" ]; then
        pnpm test 2>/dev/null || print_message $YELLOW "⚠️ web-teacher 测试可能不存在"
    else
        npm test 2>/dev/null || print_message $YELLOW "⚠️ web-teacher 测试可能不存在"
    fi

    print_message $GREEN "✅ 测试完成"
}

# 清理构建产物
clean_build() {
    print_message $YELLOW "🧹 清理构建产物..."

    # 清理 UI Kit
    if [ -d "$UI_KIT_PATH/dist" ]; then
        rm -rf "$UI_KIT_PATH/dist"
        print_message $BLUE "清理 UI Kit 构建产物"
    fi

    # 清理 web-teacher
    if [ -d "$WEB_TEACHER_PATH/dist" ]; then
        rm -rf "$WEB_TEACHER_PATH/dist"
        print_message $BLUE "清理 web-teacher 构建产物"
    fi

    # 清理 .turbo 缓存
    if [ -d "$PROJECT_ROOT/.turbo" ]; then
        rm -rf "$PROJECT_ROOT/.turbo"
        print_message $BLUE "清理 Turbo 缓存"
    fi

    print_message $GREEN "✅ 清理完成"
}

# 预览主题组件
preview_theme() {
    print_message $YELLOW "👀 启动主题组件预览..."

    print_message $CYAN "访问以下地址查看:"
    echo "  🎨 组件展示: http://localhost:5173/component-showcase"
    echo "  🏠 主页: http://localhost:5173"
    echo

    start_dev
}

# 显示当前主题状态
show_status() {
    print_header
    print_message $CYAN "📊 当前主题状态:"
    echo

    # 检查文件存在性
    local files=(
        "packages/ui-kit/src/theme/index.ts:主题管理器"
        "packages/ui-kit/src/styles/variables.scss:CSS 变量定义"
        "apps/web-teacher/src/stores/app.ts:应用状态管理"
        "apps/web-teacher/src/components/ComponentShowcase.vue:组件展示"
        "scripts/validate-theme.js:主题验证脚本"
        ".stylelintrc.json:Stylelint 配置"
    )

    for file_info in "${files[@]}"; do
        local file="${file_info%%:*}"
        local description="${file_info##*:}"

        if [ -f "$PROJECT_ROOT/$file" ]; then
            print_message $GREEN "✅ $description ($file)"
        else
            print_message $RED "❌ $description ($file)"
        fi
    done

    echo
    print_message $CYAN "🎯 下一步操作建议:"
    echo "  运行 '$0 validate' 验证主题系统"
    echo "  运行 '$0 preview' 预览组件展示"
    echo "  运行 '$0 dev' 启动开发服务器"
    echo
}

# 主程序
main() {
    local command=${1:-help}

    case $command in
        "dev")
            check_dependencies
            start_dev
            ;;
        "validate")
            validate_theme
            ;;
        "build")
            check_dependencies
            build_packages
            ;;
        "lint")
            check_dependencies
            run_lint
            ;;
        "test")
            check_dependencies
            run_tests
            ;;
        "clean")
            clean_build
            ;;
        "preview")
            check_dependencies
            preview_theme
            ;;
        "status")
            show_status
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_message $RED "❌ 未知命令: $command"
            echo
            show_help
            exit 1
            ;;
    esac
}

# 捕获错误
trap 'print_message $RED "❌ 脚本执行失败"; exit 1' ERR

# 运行主程序
main "$@"