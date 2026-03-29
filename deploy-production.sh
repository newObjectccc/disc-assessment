#!/bin/bash
set -e

# =============================================================================
# DISC 测评平台 - 生产环境部署脚本（交互式）
# =============================================================================

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 配置
REMOTE_HOST="qyqm"
REMOTE_DIR="deploy/disc-assessment"
SERVICE_NAME="disc-assessment"

# SSH 隧道配置（用于本地连接远程数据库）
LOCAL_DB_PORT=54322
REMOTE_DB_PORT=5432

# 清理函数
cleanup() {
  if [ -n "$TUNNEL_PID" ]; then
    echo -e "\n${YELLOW}关闭 SSH 隧道...${NC}"
    kill $TUNNEL_PID 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  生产环境部署 - DISC 测评平台${NC}"
echo -e "${GREEN}========================================${NC}"

# 交互式询问
echo ""
echo -e "${CYAN}请选择部署选项:${NC}"
echo ""

read -p "是否运行数据库迁移？(y/N): " run_migrate
RUN_MIGRATE=false
if [[ "$run_migrate" =~ ^[Yy]$ ]]; then
  RUN_MIGRATE=true
fi

read -p "是否运行数据库种子（首次部署创建 admin 账号）？(y/N): " run_seed
RUN_SEED=false
if [[ "$run_seed" =~ ^[Yy]$ ]]; then
  RUN_SEED=true
fi

read -p "是否构建并部署服务？(Y/n): " run_deploy
RUN_DEPLOY=true
if [[ "$run_deploy" =~ ^[Nn]$ ]]; then
  RUN_DEPLOY=false
fi

# 仅在部署时询问是否跳过 Git 检查
SKIP_GIT_CHECK=false
if [ "$RUN_DEPLOY" = true ]; then
  read -p "是否跳过 Git 未提交检查？(y/N): " skip_git
  if [[ "$skip_git" =~ ^[Yy]$ ]]; then
    SKIP_GIT_CHECK=true
  fi
fi

echo ""
echo -e "${YELLOW}部署配置:${NC}"
echo -e "  - 数据库迁移: $([ "$RUN_MIGRATE" = true ] && echo -e "${GREEN}是${NC}" || echo -e "${RED}否${NC}")"
echo -e "  - 数据库种子: $([ "$RUN_SEED" = true ] && echo -e "${GREEN}是${NC}" || echo -e "${RED}否${NC}")"
echo -e "  - 构建并部署: $([ "$RUN_DEPLOY" = true ] && echo -e "${GREEN}是${NC}" || echo -e "${RED}否${NC}")"
if [ "$RUN_DEPLOY" = true ]; then
  echo -e "  - 跳过Git检查: $([ "$SKIP_GIT_CHECK" = true ] && echo -e "${YELLOW}是${NC}" || echo -e "${GREEN}否${NC}")"
fi
echo ""

read -p "确认开始？(Y/n): " confirm
if [[ "$confirm" =~ ^[Nn]$ ]]; then
  echo -e "${RED}已取消${NC}"
  exit 0
fi

echo ""

# Step 1: 本地提交检查（仅部署时需要，可跳过）
if [ "$RUN_DEPLOY" = true ]; then
  echo -e "${YELLOW}[1/5] 检查本地 Git 状态...${NC}"
  if [ "$SKIP_GIT_CHECK" = true ]; then
    echo -e "${YELLOW}⚠ 已跳过 Git 检查${NC}"
  elif [[ -n $(git status --porcelain) ]]; then
    echo -e "${RED}错误: 有未提交的更改，请先提交${NC}"
    git status --short
    exit 1
  else
    echo -e "${GREEN}✓ 工作目录干净${NC}"
  fi
else
  echo -e "${YELLOW}[1/5] 跳过 Git 检查${NC}"
fi

# Step 2: 推送到远程（仅部署时需要）
if [ "$RUN_DEPLOY" = true ]; then
  echo -e "\n${YELLOW}[2/5] 推送到远程仓库...${NC}"
  git push origin main
  echo -e "${GREEN}✓ 已推送到 origin/main${NC}"
else
  echo -e "\n${YELLOW}[2/5] 跳过推送${NC}"
fi

# Step 3: 远程拉取代码 + 同步 .env.production
if [ "$RUN_DEPLOY" = true ]; then
  echo -e "\n${YELLOW}[3/5] 远程服务器拉取代码...${NC}"
  ssh $REMOTE_HOST "cd $REMOTE_DIR && git pull origin main"

  # 复制本地 .env.production 到服务器，替换 .env
  if [ ! -f ".env.production" ]; then
    echo -e "${RED}错误: 本地 .env.production 不存在，请先创建${NC}"
    exit 1
  fi
  echo "同步 .env.production 到服务器..."
  scp .env.production $REMOTE_HOST:$REMOTE_DIR/.env
  echo -e "${GREEN}✓ 远程代码和配置已更新${NC}"
else
  echo -e "\n${YELLOW}[3/5] 跳过拉取${NC}"
fi

# Step 3.5: 自动建库（库已存在时静默跳过）
if [ "$RUN_MIGRATE" = true ] || [ "$RUN_DEPLOY" = true ]; then
  echo -e "\n${YELLOW}[3.5] 确保数据库存在...${NC}"
  DB_NAME=$(ssh $REMOTE_HOST "cd $REMOTE_DIR && grep '^DATABASE_URL=' .env | sed 's|.*postgresql://[^/]*/||' | cut -d'?' -f1")
  DB_USER=$(ssh $REMOTE_HOST "cd $REMOTE_DIR && grep '^DATABASE_URL=' .env | sed 's|.*://||' | cut -d':' -f1")
  ssh $REMOTE_HOST "docker exec postgresql psql -U $DB_USER -tc \"SELECT 1 FROM pg_database WHERE datname='$DB_NAME'\" | grep -q 1 || docker exec postgresql psql -U $DB_USER -c \"CREATE DATABASE $DB_NAME;\""
  echo -e "${GREEN}✓ 数据库 $DB_NAME 已就绪${NC}"
fi

# Step 4: 运行数据库迁移（通过 SSH 隧道在本地执行）
if [ "$RUN_MIGRATE" = true ]; then
  echo -e "\n${YELLOW}[4/5] 运行数据库迁移...${NC}"

  # 获取远程数据库配置
  echo "获取远程数据库配置..."
  REMOTE_DB_URL=$(ssh $REMOTE_HOST "cd $REMOTE_DIR && grep '^DATABASE_URL=' .env | cut -d'=' -f2- | tr -d '\"'")

  # 获取 PostgreSQL 容器的实际 IP
  echo "获取数据库容器 IP..."
  DB_CONTAINER_IP="127.0.0.1"

  # 解析数据库 URL 并替换 host 为本地隧道
  LOCAL_DB_URL=$(echo "$REMOTE_DB_URL" | sed "s|@[^/]*|@localhost:$LOCAL_DB_PORT|")

  echo "建立 SSH 隧道 (localhost:$LOCAL_DB_PORT -> $DB_CONTAINER_IP:$REMOTE_DB_PORT)..."
  ssh -f -N -L $LOCAL_DB_PORT:$DB_CONTAINER_IP:$REMOTE_DB_PORT $REMOTE_HOST
  TUNNEL_PID=$(lsof -ti:$LOCAL_DB_PORT | head -1)
  sleep 2

  echo "执行迁移..."
  DATABASE_URL="$LOCAL_DB_URL" pnpm exec prisma migrate deploy

  echo -e "${GREEN}✓ 数据库迁移完成${NC}"
else
  echo -e "\n${YELLOW}[4/5] 跳过数据库迁移${NC}"
fi

# Step 5: 运行种子（可选，首次部署创建 admin 账号）
if [ "$RUN_SEED" = true ]; then
  echo -e "\n${YELLOW}[5/5] 运行数据库种子...${NC}"

  # 如果没有迁移，需要重新建立隧道
  if [ "$RUN_MIGRATE" = false ]; then
    REMOTE_DB_URL=$(ssh $REMOTE_HOST "cd $REMOTE_DIR && grep '^DATABASE_URL=' .env | cut -d'=' -f2- | tr -d '\"'")
    LOCAL_DB_URL=$(echo "$REMOTE_DB_URL" | sed "s|@[^/]*|@localhost:$LOCAL_DB_PORT|")
    DB_CONTAINER_IP="127.0.0.1"
    echo "建立 SSH 隧道 (localhost:$LOCAL_DB_PORT -> $DB_CONTAINER_IP:$REMOTE_DB_PORT)..."
    ssh -f -N -L $LOCAL_DB_PORT:$DB_CONTAINER_IP:$REMOTE_DB_PORT $REMOTE_HOST
    TUNNEL_PID=$(lsof -ti:$LOCAL_DB_PORT | head -1)
    sleep 2
  fi

  echo "执行种子..."
  DATABASE_URL="$LOCAL_DB_URL" pnpm exec prisma db seed

  echo -e "${GREEN}✓ 数据库种子完成（admin/admin123）${NC}"
else
  echo -e "\n${YELLOW}[5/5] 跳过数据库种子${NC}"
fi

# Step 5b: 构建并重启服务
if [ "$RUN_DEPLOY" = true ]; then
  echo -e "\n${YELLOW}[5b] 构建 Docker 镜像并重启服务...${NC}"
  ssh $REMOTE_HOST "cd $REMOTE_DIR && docker compose build && docker compose up -d"
  echo -e "${GREEN}✓ 服务已重启${NC}"

  # 等待服务启动
  echo -e "\n${YELLOW}等待服务启动...${NC}"
  sleep 5

  # 检查服务状态
  echo -e "\n${YELLOW}检查服务状态...${NC}"
  ssh $REMOTE_HOST "cd $REMOTE_DIR && docker compose ps"
fi

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  完成！${NC}"
echo -e "${GREEN}========================================${NC}"
