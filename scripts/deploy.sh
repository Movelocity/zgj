#!/bin/bash

# 服务器部署脚本

set -e

echo "🚀 启动简历润色工具服务器..."

PROJECT_ROOT=$(pwd)

# 检查是否在项目根目录
if [ ! -f "server/main.go" ] || [ ! -f "web/package.json" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

# 检查前端构建文件是否存在
if [ ! -d "${PROJECT_ROOT}/web/dist" ]; then
    echo "⚠️  前端构建文件不存在，开始构建前端..."
    cd ${PROJECT_ROOT}/web
    npm run build:prod
    echo "✅ 前端构建完成"
fi

cd ${PROJECT_ROOT}/server
# 检查配置文件
if [ ! -f "${PROJECT_ROOT}/server/config.yaml" ]; then
    echo "❌ 配置文件 config.yaml 不存在"
    exit 1
fi
# cd server && ./resume-polisher
if [ ! -f "${PROJECT_ROOT}/server/resume-polisher" ]; then
    echo "❌ 可执行文件 resume-polisher 不存在，请先执行 scripts/build.sh"
    exit 1
fi

# 启动服务器
echo "🌟 启动服务器..."
echo "📍 静态文件路径: ${PROJECT_ROOT}/web/dist"
echo "🌐 服务地址: http://localhost:8888"
echo "📡 API 路径: http://localhost:8888/api"
echo ""

${PROJECT_ROOT}/server/resume-polisher
