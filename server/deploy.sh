#!/bin/bash

# 服务器部署脚本

set -e

echo "🚀 启动简历润色工具服务器..."

# 检查是否在 server 目录
if [ ! -f "main.go" ]; then
    echo "❌ 请在 server 目录运行此脚本"
    exit 1
fi

# 检查前端构建文件是否存在
if [ ! -d "../web/dist" ]; then
    echo "⚠️  前端构建文件不存在，开始构建前端..."
    cd ../web
    npm run build:prod
    cd ../server
    echo "✅ 前端构建完成"
fi

# 检查配置文件
if [ ! -f "config.yaml" ]; then
    echo "❌ 配置文件 config.yaml 不存在"
    exit 1
fi

# 启动服务器
echo "🌟 启动服务器..."
echo "📍 静态文件路径: ../web/dist"
echo "🌐 服务地址: http://localhost:8888"
echo "📡 API 路径: http://localhost:8888/api"
echo ""

go run main.go
