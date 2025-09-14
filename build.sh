#!/bin/bash

# 简历润色工具 - 构建和部署脚本

set -e

echo "🚀 开始构建简历润色工具..."

# 检查是否在项目根目录
if [ ! -f "server/main.go" ] || [ ! -f "web/package.json" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

# 构建前端
echo "📦 构建前端..."
cd web
npm run build:prod
echo "✅ 前端构建完成"
cd ..

# 构建后端
echo "🔧 构建后端..."
cd server
go mod tidy
go build -o resume-polisher main.go
echo "✅ 后端构建完成"
cd ..

echo "🎉 构建完成！"
echo ""
echo "📋 部署说明："
echo "1. 前端静态文件已生成到: web/dist/"
echo "2. 后端可执行文件已生成到: server/resume-polisher"
echo "3. 启动服务器: cd server && ./resume-polisher"
echo "4. 访问应用: http://localhost:8888"
echo ""
echo "💡 提示："
echo "- 前端路由 (/, /profile, /resume/* 等) 将由 SPA 处理"
echo "- API 路由 (/api/*) 将由后端处理"
echo "- 静态资源 (/assets/*) 将由后端提供服务"
