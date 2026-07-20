#!/bin/bash
# 本機每日 Garmin 同步（由 launchd 排程呼叫，見 docs/產品規格書.md 維運章節）。
# 秘鑰放在 ~/.velosays-sync.env（chmod 600，不進 git）：
#   SUPABASE_SERVICE_ROLE_KEY=...
#   GEMINI_API_KEY=...
# Garmin 登入用 ~/.garminconnect 的快取 token（oauth1 效期約一年，
# 過期時重跑 scripts/garmin_login.py 即可）。
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$HOME/.velosays-sync.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "找不到 $ENV_FILE，無法執行同步" >&2
  exit 1
fi

set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

echo "=== velosays sync $(date '+%Y-%m-%d %H:%M:%S') ==="
exec "$REPO_DIR/.venv/bin/python" "$REPO_DIR/scripts/sync_garmin.py"
