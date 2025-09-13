# API 测试 Makefile

.PHONY: test test-user test-app test-admin test-cover test-bench clean help

# 默认目标
help:
	@echo "Resume Polisher API 测试工具"
	@echo ""
	@echo "可用命令:"
	@echo "  make test       - 运行所有测试"
	@echo "  make test-user  - 运行用户API测试"
	@echo "  make test-app   - 运行应用API测试"
	@echo "  make test-admin - 运行管理员API测试"
	@echo "  make test-cover - 运行测试并生成覆盖率报告"
	@echo "  make test-bench - 运行基准测试"
	@echo "  make clean      - 清理测试文件"
	@echo "  make deps       - 安装测试依赖"

# 安装依赖
deps:
	@echo "安装测试依赖..."
	cd .. && go mod tidy
	cd .. && go get github.com/stretchr/testify/assert

# 运行所有测试
test: deps
	@echo "运行所有API测试..."
	GIN_MODE=test go test -v -timeout=30s

# 运行用户API测试
test-user: deps
	@echo "运行用户API测试..."
	GIN_MODE=test go test -v -run TestUser -timeout=30s

# 运行应用API测试
test-app: deps
	@echo "运行应用API测试..."
	GIN_MODE=test go test -v -run "TestConversation|TestWorkflow" -timeout=30s

# 运行管理员API测试
test-admin: deps
	@echo "运行管理员API测试..."
	GIN_MODE=test go test -v -run TestAdmin -timeout=30s

# 运行测试并生成覆盖率报告
test-cover: deps
	@echo "运行测试并生成覆盖率报告..."
	GIN_MODE=test go test -cover -coverprofile=coverage.out -timeout=30s
	@if [ -f coverage.out ]; then \
		echo "覆盖率报告已生成: coverage.out"; \
		echo "查看详细报告: go tool cover -html=coverage.out"; \
		go tool cover -func=coverage.out | tail -1; \
	fi

# 运行基准测试
test-bench: deps
	@echo "运行基准测试..."
	GIN_MODE=test go test -bench=. -benchmem -timeout=60s

# 运行测试并生成HTML覆盖率报告
test-html: test-cover
	@if [ -f coverage.out ]; then \
		go tool cover -html=coverage.out -o coverage.html; \
		echo "HTML覆盖率报告已生成: coverage.html"; \
	fi

# 运行竞态检测测试
test-race: deps
	@echo "运行竞态检测测试..."
	GIN_MODE=test go test -race -timeout=60s

# 清理测试文件
clean:
	@echo "清理测试文件..."
	rm -f coverage.out coverage.html

# 运行完整的测试套件（包括覆盖率和基准测试）
test-full: test-cover test-bench
	@echo "完整测试套件运行完成"

# 持续运行测试（文件变化时自动重新运行）
test-watch:
	@echo "监控文件变化并自动运行测试..."
	@echo "需要安装 entr: brew install entr"
	find . -name "*.go" | entr -c make test
