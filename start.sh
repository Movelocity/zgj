#!/bin/bash
# ==============================================
# 职管加 - 一键启动脚本（演示用）
# ==============================================
# 启动顺序：PostgreSQL → LangChain → Go后端 → 前端
# 服务列表：
#   PostgreSQL  : localhost:5432
#   LangChain   : localhost:8890
#   Go 后端     : localhost:8888 （含 API + 前端 SPA）
# ==============================================

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PG_BIN="C:/Program Files/PostgreSQL/17/bin"

echo "=============================================="
echo "  职管加 (ZGJ) - 一键启动"
echo "=============================================="

# ---------- 1. PostgreSQL ----------
echo ""
echo "[1/4] 检查 PostgreSQL..."
if "$PG_BIN/pg_isready" -q 2>/dev/null; then
    echo "  ✓ PostgreSQL 已在运行"
else
    echo "  → 启动 PostgreSQL..."
    "$PG_BIN/pg_ctl" -D "C:/Program Files/PostgreSQL/17/data" start 2>/dev/null || {
        echo "  ⚠ 无法自动启动 PostgreSQL，请手动启动后重试"
        echo "  端口: 5432"
    }
fi

# ---------- 2. LangChain 服务 ----------
echo ""
echo "[2/4] 启动 LangChain 服务 (port 8890)..."
cd "$ROOT_DIR/langchain-service"
npm run dev &
LANGCHAIN_PID=$!
echo "  ✓ LangChain PID: $LANGCHAIN_PID"

# ---------- 3. Go 后端 ----------
echo ""
echo "[3/4] 启动 Go 后端 (port 8888)..."
cd "$ROOT_DIR/server"
go run main.go &
BACKEND_PID=$!
echo "  ✓ Backend PID: $BACKEND_PID"

# ---------- 4. 前端（Vite） ----------
echo ""
echo "[4/4] 启动前端开发服务器 (port 8080)..."
cd "$ROOT_DIR/web"
pnpm dev &
FRONTEND_PID=$!
echo "  ✓ Frontend PID: $FRONTEND_PID"

# ---------- 汇总 ----------
echo ""
echo "=============================================="
echo "  所有服务已启动"
echo "=============================================="
echo "  前端:      http://localhost:8080"
echo "  API:       http://localhost:8888/api"
echo "  LangChain: http://localhost:8890"
echo ""
echo "  按 Ctrl+C 停止所有服务"
echo "=============================================="

# 捕获退出信号，清理子进程
cleanup() {
    echo ""
    echo "正在停止所有服务..."
    kill $LANGCHAIN_PID 2>/dev/null
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "已停止。"
    exit 0
}
trap cleanup SIGINT SIGTERM

# 等待任意子进程结束
wait
