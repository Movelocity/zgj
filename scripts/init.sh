#!/bin/bash

# 简历润色工具 - 密码管理脚本

set -e

PROJECT_ROOT=$(pwd)
CONFIG_EXAMPLE="${PROJECT_ROOT}/server/config.example.yaml"
CONFIG_FILE="${PROJECT_ROOT}/server/config.yaml"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函数：显示菜单
show_menu() {
    echo ""
    echo -e "${BLUE}🔐 简历润色工具密码管理${NC}"
    echo "================================"
    
    if [ -f "${CONFIG_FILE}" ]; then
        echo -e "${GREEN}✅ 密码已初始化${NC}"
        echo ""
        echo "请选择操作:"
        echo "1. 修改密码"
        echo "2. 检查数据库状态"
        echo "3. 导出数据库到文件"
        echo "4. 从文件导入数据库"
        echo "5. 退出"
        echo ""
        echo -n "请输入选择 (1-5): "
    else
        echo -e "${YELLOW}⚠️  密码未初始化${NC}"
        echo ""
        echo "检测到系统尚未初始化，是否进行密码初始化？"
        echo "1. 是，初始化密码和配置"
        echo "2. 否，退出"
        echo ""
        echo -n "请输入选择 (1-2): "
    fi
}

# 函数：检查项目根目录
check_project_root() {
    if [ ! -f "server/main.go" ] || [ ! -f "web/package.json" ]; then
        echo -e "${RED}❌ 请在项目根目录运行此脚本${NC}"
        exit 1
    fi
}

# 函数：检查配置文件模板
check_config_example() {
    if [ ! -f "${CONFIG_EXAMPLE}" ]; then
        echo -e "${RED}❌ 配置模板文件 server/config.example.yaml 不存在${NC}"
        exit 1
    fi
}

# 函数：初始化密码
init_password() {
    echo ""
    echo -e "${BLUE}📋 创建新配置文件${NC}"
    
    echo -n "请输入数据库密码: "
    read -s db_password
    echo
    echo -n "请再次输入数据库密码: "
    read -s db_password_confirm
    echo
    
    if [ "$db_password" != "$db_password_confirm" ]; then
        echo -e "${RED}❌ 两次输入的数据库密码不一致${NC}"
        exit 1
    fi

    echo ""
    echo -e "${BLUE}📄 创建配置文件...${NC}"
    
    # 复制配置模板
    cp "${CONFIG_EXAMPLE}" "${CONFIG_FILE}"
    
    # 替换密码
    sed -i.tmp "s/password: \"admin123\\\*\"/password: \"${db_password}\"/g" "${CONFIG_FILE}"
    sed -i.tmp "/admin:/,/^[[:space:]]*$/{s/password: \"admin123\\\*\"/password: \"${admin_password}\"/g;}" "${CONFIG_FILE}"
    
    # 清理临时文件
    rm -f "${CONFIG_FILE}.tmp"
    
    echo -e "${GREEN}✅ 配置文件创建完成${NC}"
}

# 函数：修改密码
change_password() {
    echo ""
    echo -e "${BLUE}📋 修改密码${NC}"
    
    # 输入现有密码
    echo -n "请输入当前数据库密码: "
    read -s current_db_password
    echo
    
    # 验证当前数据库密码是否正确
    if ! grep -A10 "pgsql:" "${CONFIG_FILE}" | grep -q "password: \"${current_db_password}\""; then
        echo -e "${RED}❌ 当前数据库密码不正确${NC}"
        exit 1
    fi
    
    # 输入新密码
    echo -n "请输入新的数据库密码: "
    read -s new_db_password
    echo
    echo -n "请再次输入新的数据库密码: "
    read -s new_db_password_confirm
    echo
    
    if [ "$new_db_password" != "$new_db_password_confirm" ]; then
        echo -e "${RED}❌ 两次输入的数据库密码不一致${NC}"
        exit 1
    fi
    
    echo ""
    echo -e "${BLUE}🔄 更新密码中...${NC}"
    
    # 创建备份
    backup_file="${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    cp "${CONFIG_FILE}" "${backup_file}"
    echo -e "${GREEN}✅ 已创建配置文件备份: ${backup_file}${NC}"
    
    # 替换数据库密码
    sed -i.tmp "/pgsql:/,/^[[:space:]]*$/{s/password: \"${current_db_password}\"/password: \"${new_db_password}\"/g;}" "${CONFIG_FILE}"
    
    # 清理临时文件
    rm -f "${CONFIG_FILE}.tmp"
    
    echo -e "${GREEN}✅ 密码更新完成${NC}"
}

# 函数：检查数据库状态
check_database() {
    echo ""
    echo -e "${BLUE}🔍 检查数据库状态...${NC}"
    
    # 检查 Docker 容器 pgsql：docker ps 在无匹配时仍返回 0，须按容器名判断状态
    PG_RUNNING=$(docker inspect -f '{{.State.Running}}' pgsql 2>/dev/null || true)
    if [ "${PG_RUNNING}" = "true" ]; then
        echo -e "${GREEN}✅ 数据库容器已在运行${NC}"
    elif docker inspect pgsql >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  数据库容器已存在但未运行，正在启动...${NC}"
        docker start pgsql
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ 数据库容器启动成功${NC}"
        else
            echo -e "${RED}❌ 数据库容器启动失败${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}📦 数据库容器不存在${NC}"
        return 1
    fi
    
    # 测试数据库连接
    echo -e "${BLUE}🔗 测试数据库连接...${NC}"
    DB_PASSWORD=$(grep -A10 "pgsql:" "${CONFIG_FILE}" | grep "password:" | sed 's/.*password: "\(.*\)".*/\1/')
    
    # 等待数据库完全启动
    for i in {1..30}; do
        if docker exec pgsql pg_isready -U postgres > /dev/null 2>&1; then
            echo -e "${GREEN}✅ 数据库连接正常${NC}"
            return 0
        fi
        if [ $i -eq 30 ]; then
            echo -e "${RED}❌ 数据库连接超时，请检查容器状态${NC}"
            echo -e "${BLUE}💡 可以运行 'docker logs pgsql' 查看日志${NC}"
            return 1
        fi
        echo "⏳ 等待数据库启动... ($i/30)"
        sleep 2
    done
}

# 函数：导出数据库
export_database() {
    echo ""
    echo -e "${BLUE}📦 导出数据库${NC}"
    
    if ! check_database; then
        echo -e "${RED}❌ 数据库不可用，无法导出${NC}"
        return 1
    fi
    
    # 获取数据库密码
    DB_PASSWORD=$(grep -A10 "pgsql:" "${CONFIG_FILE}" | grep "password:" | sed 's/.*password: "\(.*\)".*/\1/')
    
    # 创建备份目录
    BACKUP_DIR="${PROJECT_ROOT}/backups"
    mkdir -p "${BACKUP_DIR}"
    
    # 生成备份文件名
    BACKUP_FILE="${BACKUP_DIR}/db_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    echo -e "${BLUE}📁 导出文件: ${BACKUP_FILE}${NC}"
    
    # 执行导出
    if docker exec pgsql pg_dump -U postgres -d postgres > "${BACKUP_FILE}"; then
        echo -e "${GREEN}✅ 数据库导出成功${NC}"
        echo -e "${BLUE}💡 备份文件保存在: ${BACKUP_FILE}${NC}"
    else
        echo -e "${RED}❌ 数据库导出失败${NC}"
        return 1
    fi
}

# 函数：导入数据库
import_database() {
    echo ""
    echo -e "${BLUE}📥 导入数据库${NC}"
    
    if ! check_database; then
        echo -e "${RED}❌ 数据库不可用，无法导入${NC}"
        return 1
    fi
    
    # 显示备份文件
    BACKUP_DIR="${PROJECT_ROOT}/backups"
    if [ ! -d "${BACKUP_DIR}" ] || [ -z "$(ls -A ${BACKUP_DIR}/*.sql 2>/dev/null)" ]; then
        echo -e "${YELLOW}⚠️  没有找到备份文件${NC}"
        echo -e "${BLUE}💡 请先将备份文件放在 ${BACKUP_DIR}/ 目录下${NC}"
        return 1
    fi
    
    echo "可用的备份文件:"
    echo "--------------------------------"
    ls -l ${BACKUP_DIR}/*.sql | awk '{print NR ". " $9}'
    echo "--------------------------------"
    
    echo -n "请选择要导入的文件编号: "
    read file_num
    
    # 获取选择的文件
    selected_file=$(ls -1 ${BACKUP_DIR}/*.sql | sed -n "${file_num}p")
    
    if [ -z "$selected_file" ] || [ ! -f "$selected_file" ]; then
        echo -e "${RED}❌ 无效的文件选择${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}⚠️  警告：这将覆盖现有数据库数据！${NC}"
    echo -n "确认导入？(y/N): "
    read confirm
    
    if [ "${confirm}" != "y" ] && [ "${confirm}" != "Y" ]; then
        echo -e "${YELLOW}❌ 导入已取消${NC}"
        return 1
    fi
    
    # 执行导入
    if docker exec -i pgsql psql -U postgres -d postgres < "${selected_file}"; then
        echo -e "${GREEN}✅ 数据库导入成功${NC}"
    else
        echo -e "${RED}❌ 数据库导入失败${NC}"
        return 1
    fi
}

# 函数：创建数据库容器
create_database() {
    echo ""
    echo -e "${BLUE}📦 创建数据库容器${NC}"
    
    # 从配置文件读取数据库密码
    DB_PASSWORD=$(grep -A10 "pgsql:" "${CONFIG_FILE}" | grep "password:" | sed 's/.*password: "\(.*\)".*/\1/')
    
    if [ -z "${DB_PASSWORD}" ]; then
        echo -e "${RED}❌ 无法从配置文件读取数据库密码${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}⚠️  确认创建数据库容器？(y/N): ${NC}"
    read confirm
    
    if [ "${confirm}" != "y" ] && [ "${confirm}" != "Y" ]; then
        echo -e "${YELLOW}❌ 操作已取消${NC}"
        return 1
    fi
    
    # 创建数据卷目录
    PGDATA_DIR="${PROJECT_ROOT}/docker/pgdata"
    mkdir -p "${PGDATA_DIR}"
    
    # 启动数据库容器
    if docker run -d -p 5666:5432 \
      --name pgsql \
      -v "${PGDATA_DIR}:/var/lib/postgresql/data" \
      -e POSTGRES_PASSWORD="${DB_PASSWORD}" \
      postgres; then
        echo -e "${GREEN}✅ 数据库容器创建并启动成功${NC}"
        echo -e "${BLUE}📁 数据存储位置: ${PGDATA_DIR}${NC}"
        echo -e "${BLUE}⏳ 等待数据库初始化完成...${NC}"
        sleep 5
        check_database
    else
        echo -e "${RED}❌ 数据库容器创建失败${NC}"
        return 1
    fi
}

# 主程序
main() {
    check_project_root
    check_config_example
    
    while true; do
        show_menu
        read choice
        
        if [ -f "${CONFIG_FILE}" ]; then
            # 已初始化的情况
            case $choice in
                1)
                    change_password
                    ;;
                2)
                    if ! check_database; then
                        create_database
                    fi
                    ;;
                3)
                    export_database
                    ;;
                4)
                    import_database
                    ;;
                5)
                    echo -e "${GREEN}👋 再见！${NC}"
                    exit 0
                    ;;
                *)
                    echo -e "${RED}❌ 无效的选择，请重新输入${NC}"
                    ;;
            esac
        else
            # 未初始化的情况
            case $choice in
                1)
                    init_password
                    echo -e "${GREEN}🎉 密码初始化完成！${NC}"
                    # 自动尝试创建数据库
                    create_database
                    break
                    ;;
                2)
                    echo -e "${GREEN}👋 再见！${NC}"
                    exit 0
                    ;;
                *)
                    echo -e "${RED}❌ 无效的选择，请重新输入${NC}"
                    ;;
            esac
        fi
        
        echo ""
        echo -n "按回车键继续..."
        read
    done
}

# 运行主程序
main