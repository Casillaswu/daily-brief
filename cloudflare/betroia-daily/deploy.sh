#!/bin/bash
# 部署到 Cloudflare Pages：https://betroia-daily.pages.dev/（照游戏盈亏分析台做法：页面 + functions/，数据只存 R2）
# 用法：bash deploy.sh   （token 用 ~/.cloudflare/game-pnl.env：Pages + R2；团队通行码在 ~/.cloudflare/betroia-daily-team-code.txt）
set -euo pipefail
cd "$(dirname "$0")"
set -a; source ~/.cloudflare/game-pnl.env >/dev/null 2>&1; set +a
export CLOUDFLARE_ACCOUNT_ID=0b01ecfddc37c9dc08e614a87e2337ce
W="npx --yes wrangler@4"
CODE_FILE=~/.cloudflare/betroia-daily-team-code.txt

$W r2 bucket list | grep -q 'betroia-daily-raw' || $W r2 bucket create betroia-daily-raw
$W pages project list | grep -q 'betroia-daily' || $W pages project create betroia-daily --production-branch=main
if [ "${1:-}" = "--set-code" ]; then
  [ -s "$CODE_FILE" ] || { echo "✖ 找不到 $CODE_FILE"; exit 1; }
  tr -d '\n' < "$CODE_FILE" | $W pages secret put APP_PASSWORD --project-name=betroia-daily
fi
$W pages deploy --project-name=betroia-daily --branch=main --commit-dirty=true
