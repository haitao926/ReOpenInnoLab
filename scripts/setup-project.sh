#!/usr/bin/env bash
set -euo pipefail

root="reopeninnolab"

echo "🚀 开始创建智能教育基础设施项目结构..."

# 创建所有必要的目录
dirs=(
  # 前端应用目录
  "$root/apps/web-teacher/src/assets"
  "$root/apps/web-teacher/src/components/ui"
  "$root/apps/web-teacher/src/components/business"
  "$root/apps/web-teacher/src/components/layout"
  "$root/apps/web-teacher/src/components/common"
  "$root/apps/web-teacher/src/components/ai"
  "$root/apps/web-teacher/src/composables"
  "$root/apps/web-teacher/src/layouts"
  "$root/apps/web-teacher/src/pages/course"
  "$root/apps/web-teacher/src/pages/classroom"
  "$root/apps/web-teacher/src/pages/lab"
  "$root/apps/web-teacher/src/pages/assignment"
  "$root/apps/web-teacher/src/pages/analytics"
  "$root/apps/web-teacher/src/pages/profile"
  "$root/apps/web-teacher/src/router"
  "$root/apps/web-teacher/src/stores/modules"
  "$root/apps/web-teacher/src/services/api"
  "$root/apps/web-teacher/src/services/ai"
  "$root/apps/web-teacher/src/services/websocket"
  "$root/apps/web-teacher/src/utils"
  "$root/apps/web-teacher/src/types"
  "$root/apps/web-teacher/src/assets/styles"
  "$root/apps/web-teacher/src/assets/images"
  "$root/apps/web-teacher/src/assets/icons"
  "$root/apps/web-teacher/public"
  "$root/apps/web-teacher/tests/unit"
  "$root/apps/web-teacher/tests/e2e"

  "$root/apps/web-student/src"
  "$root/apps/web-student/public"
  "$root/apps/web-student/tests"

  "$root/apps/admin-console/src"
  "$root/apps/admin-console/public"
  "$root/apps/admin-console/tests"

  # 后端服务目录
  "$root/services/gateway/src"
  "$root/services/identity-service/src"
  "$root/services/course-service/src"
  "$root/services/classroom-service/src"
  "$root/services/lab-service/src"
  "$root/services/experience-service/src"
  "$root/services/assignment-service/src"
  "$root/services/insight-service/src"
  "$root/services/ai-service/src/prompts"
  "$root/services/ai-service/src/pipelines"
  "$root/services/ai-service/src/models"

  # 共享包目录
  "$root/packages/acl-sdk/src"
  "$root/packages/acl-sdk/schema"
  "$root/packages/acl-sdk/tests"
  "$root/packages/ui-kit/src/components"
  "$root/packages/ui-kit/src/theme"
  "$root/packages/ui-kit/src/composables"
  "$root/packages/ui-kit/stories"
  "$root/packages/shared-utils/src"
  "$root/packages/shared-utils/src/types"
  "$root/packages/shared-utils/src/constants"
  "$root/packages/shared-utils/src/helpers"
  "$root/packages/shared-utils/src/validators"
  "$root/packages/eslint-config/rules"

  # 基础设施目录
  "$root/infra/k8s/helm"
  "$root/infra/k8s/manifests"
  "$root/infra/terraform/modules"
  "$root/infra/terraform/environments"
  "$root/infra/docker/images"
  "$root/infra/ci/scripts"
  "$root/infra/monitoring"

  # 文档目录
  "$root/docs/architecture"
  "$root/docs/product/requirements"
  "$root/docs/product/mocks"
  "$root/docs/api/openapi"
  "$root/docs/api/graphql"
  "$root/docs/operations/deployment"
  "$root/docs/operations/security"
  "$root/docs/development/guides"

  # 测试目录
  "$root/tests/e2e"
  "$root/tests/load"
  "$root/tests/integration"

  # 脚本目录
  "$root/scripts/deployment"
  "$root/scripts/development"
  "$root/scripts/migration"
)

echo "📁 创建目录结构..."
for d in "${dirs[@]}"; do
  mkdir -p "$d"
  echo "  ✓ $d"
done

# 创建基础文件
echo "📄 创建基础文件..."

# 根目录文件
touch "$root/.gitignore"
touch "$root/.env.example"
touch "$root/.env.local"
touch "$root/.editorconfig"
touch "$root/.prettierrc"
touch "$root/LICENSE"
touch "$root/CHANGELOG.md"

# 配置文件
touch "$root/turbo.json"
touch "$root/docker-compose.yml"
touch "$root/docker-compose.dev.yml"
touch "$root/docker-compose.prod.yml"

# Kubernetes配置
touch "$root/infra/k8s/namespace.yaml"
touch "$root/infra/k8s/configmap.yaml"
touch "$root/infra/k8s/secret.yaml"

# Terraform配置
touch "$root/infra/terraform/main.tf"
touch "$root/infra/terraform/variables.tf"
touch "$root/infra/terraform/outputs.tf"

# 监控配置
touch "$root/infra/monitoring/prometheus.yml"
touch "$root/infra/monitoring/grafana.json"

# 文档配置
touch "$root/docs/product/README.md"
touch "$root/docs/api/README.md"
touch "$root/docs/operations/README.md"

echo "✅ 项目结构创建完成！"
echo ""
echo "🎯 下一步操作："
echo "1. cd $root"
echo "2. pnpm install"
echo "3. pnpm dev"
echo ""
echo "📚 查看文档："
echo "- 架构设计: docs/architecture/"
echo "- API文档: docs/api/"
echo "- 运维指南: docs/operations/"
echo ""
echo "🚀 开始开发吧！"