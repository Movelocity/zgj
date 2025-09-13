#!/bin/bash

# API测试运行脚本
echo "==================================="
echo "Resume Polisher API 测试套件"
echo "==================================="

# 检查Go环境
if ! command -v go &> /dev/null; then
    echo "错误: Go未安装或不在PATH中"
    exit 1
fi

# 检查当前目录
if [ ! -f "test_utils.go" ]; then
    echo "错误: 请在test目录下运行此脚本"
    exit 1
fi

# 检查依赖
echo "检查依赖..."
cd .. && go mod tidy
if [ $? -ne 0 ]; then
    echo "错误: 依赖安装失败"
    exit 1
fi

cd test

# 设置测试环境变量
export GIN_MODE=test

echo ""
echo "开始运行测试..."
echo "-----------------------------------"

# 运行所有测试
go test -v -timeout=30s

TEST_EXIT_CODE=$?

echo ""
echo "-----------------------------------"

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ 所有测试通过!"
    
    echo ""
    echo "生成覆盖率报告..."
    go test -cover -coverprofile=coverage.out
    
    if [ -f "coverage.out" ]; then
        echo "📊 覆盖率报告已生成: coverage.out"
        echo "使用以下命令查看详细报告:"
        echo "go tool cover -html=coverage.out"
    fi
    
    echo ""
    echo "运行基准测试..."
    go test -bench=. -benchmem
    
else
    echo "❌ 测试失败 (退出码: $TEST_EXIT_CODE)"
fi

echo ""
echo "==================================="
echo "测试完成"
echo "==================================="

exit $TEST_EXIT_CODE
