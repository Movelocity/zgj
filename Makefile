.PHONY: install build run dev clean help check-deps

# Project-level build and run targets for user management system
# Manages both backend (Go) and frontend (Vue + Vite)

# Default target: show help
.DEFAULT_GOAL := help

help: ## Show this help message
	@echo "职管加 - 简历润色工具"
	@echo ""
	@echo "命令列表:"
	@echo "  install  - 安装 Go 模块和 pnpm 依赖"
	@echo "  build    - 构建后端二进制文件和前端 SPA"
	@echo "  run      - 启动统一服务器 (生产模式, 先构建)"
	@echo "  dev      - 启动前端开发服务器 + 后端服务器 (开发模式)"
	@echo "  webdev   - 启动前端开发服务器"
	@echo "  clean    - 删除构建产物"
	@echo "  help     - 显示帮助信息"
	@echo ""

check-deps: ## Check if required tools are installed
	@echo "检查依赖..."
	@command -v go >/dev/null 2>&1 || { echo "Error: Go is not installed. Please install Go 1.22 or higher." >&2; exit 1; }
	@command -v pnpm >/dev/null 2>&1 || { echo "Error: pnpm is not installed. Install with: npm install -g pnpm" >&2; exit 1; }
	@echo "所有依赖都已安装."

install: check-deps ## Install Go modules and pnpm dependencies
	@echo "检查 git 状态..."
	git pull
	@echo "安装 Go 模块..."
	cd server && go mod download
	@echo "安装 pnpm 依赖..."
	cd web && pnpm install
	@echo "安装完成!"

proxy-install:  ## Install Go modules and pnpm dependencies with proxy
	@echo "设置代理中..."
	export https_proxy=http://127.0.0.1:7890
	export http_proxy=http://127.0.0.1:7890
	@echo "检查 git 状态..."
	git pull
	@echo "安装 Go 模块..."
	cd server && go mod download
	@echo "安装 pnpm 依赖..."
	export https_proxy=
	export http_proxy=
	cd web && pnpm install
	@echo "安装完成!"

build: ## Build backend binary and frontend SPA
	@echo "构建前端 SPA..."
	cd web && pnpm build
	@echo "构建后端二进制文件..."
	cd server && go build -o server main.go
	@echo "构建完成!"
	@echo "  - 后端二进制文件: server/server"
	@echo "  - 前端 SPA: web/dist/"

run: build ## Start unified server (production mode)
	@echo "启动统一服务器..."
	@echo "后端 API 服务地址: http://localhost:8080/api"
	@echo "后端 SPA 服务地址: http://localhost:8080/"
	cd server && ./server

dev: ## Start frontend dev server + backend server (development mode)
	@echo "启动开发服务器..."
	@echo "前端开发服务器: http://localhost:5173"
	@echo "后端 API 服务器: http://localhost:8080"
	@echo ""
	@echo "按 Ctrl+C 停止两个服务器"
	@echo ""
	@trap 'kill 0' EXIT; \
	(cd web && pnpm dev) & \
	(cd server && go run cmd/main.go)

webdev:
	@echo "启动前端开发服务器..."
	@echo "前端开发服务器: http://localhost:5173"
	@echo "按 Ctrl+C 停止服务器"
	@echo ""
	@trap 'kill 0' EXIT; \
	(cd web && pnpm dev)

clean: ## Remove build artifacts
	@echo "清理构建产物..."
	rm -f server/server
	rm -rf web/dist/
	@echo "清理完成!"

