"""
sync_garmin.py — 直接從 Garmin Connect 拉跑步活動寫入 Supabase activities 表。

由 GitHub Actions 排程執行（.github/workflows/garmin-sync.yml）。

需要的環境變數：
  GARMINTOKENS                    — Garmin token 字串（本機跑 scripts/garmin_login.py 產生）。
                                    CI 一律走 token：帳密登入會被 Garmin 對雲端 IP 回 429。
  GARMIN_EMAIL / GARMIN_PASSWORD  — 選填，沒有 token 時的本機備援登入
  SUPABASE_SERVICE_ROLE_KEY       — Supabase service role key（繞過 RLS 寫入）
  VELOSAYS_USER_ID                — 選填，預設 Sasha 的 user id
"""

import os
import sys
import uuid
from datetime import date, timedelta

import requests
from garminconnect import Garmin

SUPABASE_URL = "https://uoufbcvvxvpetubvyeyw.supabase.co"
USER_ID = os.environ.get("VELOSAYS_USER_ID", "c8f7c70c-7fbd-416d-8dbc-e817bf827e84")
SERVICE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
TOKEN_DIR = os.path.expanduser("~/.garminconnect")

# 只回補這個天數內的活動；搭配去重，重跑不會產生重複資料
LOOKBACK_DAYS = 60

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
}


def garmin_login() -> Garmin:
    """優先用 GARMINTOKENS token 字串登入（CI 唯一可靠路徑），否則本機帳密備援。"""
    tokens = os.environ.get("GARMINTOKENS")
    if tokens:
        client = Garmin()
        client.login(tokens)
        print("使用 GARMINTOKENS 登入成功")
        return client

    email = os.environ.get("GARMIN_EMAIL")
    password = os.environ.get("GARMIN_PASSWORD")
    if not email or not password:
        print(
            "缺少 GARMINTOKENS（請先在本機執行 scripts/garmin_login.py 產生並設為 secret）",
            file=sys.stderr,
        )
        sys.exit(1)

    client = Garmin(email, password)
    client.login(TOKEN_DIR)
    print("使用帳密登入成功，token 已存到", TOKEN_DIR)
    return client


def fetch_existing() -> list[dict]:
    res = requests.get(
        f"{SUPABASE_URL}/rest/v1/activities",
        params={"user_id": f"eq.{USER_ID}", "select": "date,duration,distance"},
        headers=HEADERS,
        timeout=30,
    )
    res.raise_for_status()
    return res.json()


def is_duplicate(row: dict, existing: list[dict]) -> bool:
    """同一天、時間差 <60 秒、距離差 <0.3 km 視為同一筆（涵蓋先前 Strava 同步的資料）。"""
    for old in existing:
        if (
            old["date"] == row["date"]
            and abs((old.get("duration") or 0) - row["duration"]) < 60
            and abs(float(old.get("distance") or 0) - row["distance"]) < 0.3
        ):
            return True
    return False


def to_row(activity: dict) -> dict | None:
    type_key = (activity.get("activityType") or {}).get("typeKey", "")
    if "running" not in type_key:
        return None

    distance_m = activity.get("distance") or 0
    duration_s = int(activity.get("duration") or 0)
    if distance_m <= 0 or duration_s <= 0:
        return None

    distance_km = round(distance_m / 1000, 2)
    sec_per_km = duration_s / distance_km
    pace = f"{int(sec_per_km // 60):02d}:{round(sec_per_km % 60):02d}"

    cadence = activity.get("averageRunningCadenceInStepsPerMinute")
    stride_cm = activity.get("avgStrideLength")  # Garmin 單位即公分

    return {
        # 以 Garmin activityId 產生固定 UUID，upsert 具冪等性
        "id": str(uuid.uuid5(uuid.NAMESPACE_URL, f"garmin-activity-{activity['activityId']}")),
        "user_id": USER_ID,
        "date": str(activity["startTimeLocal"])[:10],
        "distance": distance_km,
        "pace": pace,
        "duration": duration_s,
        "avg_hr": int(activity["averageHR"]) if activity.get("averageHR") else None,
        "max_hr": int(activity["maxHR"]) if activity.get("maxHR") else None,
        "avg_spm": int(cadence) if cadence else None,
        "avg_stride_length": int(stride_cm) if stride_cm else None,
        "source": "Garmin_Direct",
        "title": activity.get("activityName") or "Run",
    }


def main() -> None:
    client = garmin_login()

    start = (date.today() - timedelta(days=LOOKBACK_DAYS)).isoformat()
    end = date.today().isoformat()
    activities = client.get_activities_by_date(start, end)
    print(f"Garmin 回傳 {len(activities)} 筆活動（{start} ~ {end}）")

    existing = fetch_existing()
    rows = []
    for activity in activities:
        row = to_row(activity)
        if row and not is_duplicate(row, existing):
            rows.append(row)

    if not rows:
        print("沒有需要新增的跑步活動")
        return

    res = requests.post(
        f"{SUPABASE_URL}/rest/v1/activities",
        params={"on_conflict": "id"},
        headers={**HEADERS, "Prefer": "resolution=merge-duplicates"},
        json=rows,
        timeout=30,
    )
    if not res.ok:
        print(f"Supabase 寫入失敗 {res.status_code}: {res.text}", file=sys.stderr)
        sys.exit(1)

    for row in rows:
        print(f"  + {row['date']} {row['title']} {row['distance']} km")
    print(f"已寫入 {len(rows)} 筆新活動")


if __name__ == "__main__":
    main()
