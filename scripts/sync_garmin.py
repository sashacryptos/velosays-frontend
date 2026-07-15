"""
sync_garmin.py — 直接從 Garmin Connect 拉跑步活動寫入 Supabase activities 表。

由 GitHub Actions 排程執行（.github/workflows/garmin-sync.yml）。

需要的環境變數：
  GARMINTOKENS                    — Garmin token 字串（本機跑 scripts/garmin_login.py 產生）。
                                    CI 一律走 token：帳密登入會被 Garmin 對雲端 IP 回 429。
  GARMIN_EMAIL / GARMIN_PASSWORD  — 選填，沒有 token 時的本機備援登入
  SUPABASE_SERVICE_ROLE_KEY       — Supabase service role key（繞過 RLS 寫入）
  VELOSAYS_USER_ID                — 選填，預設 Sasha 的 user id
  GEMINI_API_KEY                  — 選填，月底自動生成下月訓練目標用（沒有就跳過這步）
  FORCE_MONTHLY_GOAL              — 選填，設為 "1" 時無視「月底」限制強制生成當月目標（補跑用）
"""

import json
import os
import sys
import uuid
from datetime import date, datetime, timedelta, timezone

import requests
from garminconnect import Garmin

SUPABASE_URL = "https://uoufbcvvxvpetubvyeyw.supabase.co"
USER_ID = os.environ.get("VELOSAYS_USER_ID", "c8f7c70c-7fbd-416d-8dbc-e817bf827e84")
SERVICE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
TOKEN_DIR = os.path.expanduser("~/.garminconnect")

TAIPEI_TZ = timezone(timedelta(hours=8))


def today_taipei() -> date:
    """GitHub Actions runner 是 UTC；cron 特意排在 22:00 UTC(=台北 06:00) 觸發，
    若直接用 date.today() 會拿到 UTC 日期，比台北的「今天」晚一天算出來的所有
    日期（daily_metrics 的 date、Garmin 查詢的 today、月底判斷）都會整套錯一天。"""
    return datetime.now(TAIPEI_TZ).date()

# 只回補這個天數內的活動；搭配去重，重跑不會產生重複資料
LOOKBACK_DAYS = 60

# 使用者提供的真實目標賽事資訊（非推算值）
TARGET_RACE = {
    "name": "金澤全程馬拉松",
    "date": "2026-10-25",
    "goal_label": "Sub 4:00",
}

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
        garth_client = getattr(client, "garth", None)
        if garth_client is not None:
            # garminconnect 0.2.x：token 是 garth 的 base64 字串（scripts/garmin_login.py 產生）
            garth_client.loads(tokens)
        else:
            # garminconnect 0.3.x：token 是 di_token JSON，格式與 0.2.x 不相容
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


def ensure_profile(client: Garmin) -> None:
    """token 登入不會載入 profile；睡眠/安靜心率 API 需要 display_name。"""
    if getattr(client, "display_name", None):
        return
    try:
        garth_client = getattr(client, "garth", None) or client.client
        profile = garth_client.connectapi("/userprofile-service/socialProfile")
        client.display_name = profile.get("displayName")
    except Exception as e:
        print(f"讀取 profile 失敗（略過需要 display_name 的指標）: {e}")


def fetch_daily_metrics(client: Garmin) -> dict | None:
    """拉當日體能指標；個別失敗不影響其他項目。"""
    today = today_taipei().isoformat()
    metrics: dict = {"user_id": USER_ID, "date": today}

    try:
        # VO2max 只在有跑步的日子有值，往回抓 30 天取最近一筆
        start = (today_taipei() - timedelta(days=30)).isoformat()
        garth_client = getattr(client, "garth", None) or client.client
        mm = garth_client.connectapi(
            f"/metrics-service/metrics/maxmet/daily/{start}/{today}"
        )
        for entry in reversed(mm or []):
            generic = (entry or {}).get("generic") or {}
            vo2 = generic.get("vo2MaxPreciseValue") or generic.get("vo2MaxValue")
            if vo2:
                metrics["vo2max"] = float(vo2)
                break
    except Exception as e:
        print(f"VO2max 取得失敗: {e}")

    ensure_profile(client)
    if getattr(client, "display_name", None):
        try:
            rhr = client.get_rhr_day(today)
            values = (
                ((rhr or {}).get("allMetrics") or {}).get("metricsMap") or {}
            ).get("WELLNESS_RESTING_HEART_RATE") or []
            if values and values[0].get("value"):
                metrics["resting_hr"] = int(values[0]["value"])
        except Exception as e:
            print(f"安靜心率取得失敗: {e}")

        try:
            sleep = client.get_sleep_data(today)
            score = (
                (((sleep or {}).get("dailySleepDTO") or {}).get("sleepScores") or {})
                .get("overall") or {}
            ).get("value")
            if score:
                metrics["sleep_score"] = int(score)
        except Exception as e:
            print(f"睡眠分數取得失敗: {e}")

    return metrics if len(metrics) > 2 else None


def upsert_daily_metrics(metrics: dict) -> None:
    res = requests.post(
        f"{SUPABASE_URL}/rest/v1/daily_metrics",
        params={"on_conflict": "user_id,date"},
        headers={**HEADERS, "Prefer": "resolution=merge-duplicates"},
        json=[metrics],
        timeout=30,
    )
    if res.ok:
        shown = {k: v for k, v in metrics.items() if k not in ("user_id",)}
        print(f"體能指標已更新: {shown}")
    elif res.status_code == 404:
        print("daily_metrics 表不存在，略過體能指標（請在 Supabase SQL editor 建表）")
    else:
        print(f"體能指標寫入失敗 {res.status_code}: {res.text}", file=sys.stderr)


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


def fetch_weather(client: Garmin, activity_id: str) -> dict:
    """回傳 city/temperature_c/humidity_percent；抓不到就回空字典，不影響活動本身寫入。
    Garmin 回傳欄位名稱是依社群已知的 activity weather 端點形狀推測，
    第一次成功呼叫會印出完整原始回應，方便之後校正欄位對應。"""
    try:
        weather = client.get_activity_weather(activity_id)
        if not weather:
            return {}
        print(f"  (原始天氣資料，供欄位校正參考): {json.dumps(weather, ensure_ascii=False)[:500]}")

        result: dict = {}
        temp = weather.get("temp")
        if temp is not None:
            result["temperature_c"] = round(float(temp), 1)
        humidity = weather.get("relativeHumidity")
        if humidity is not None:
            result["humidity_percent"] = int(humidity)
        station = (weather.get("weatherStationDTO") or {}).get("name")
        if station:
            result["city"] = station
        return result
    except Exception as e:
        print(f"天氣資料取得失敗（activity {activity_id}）: {e}")
        return {}


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


def is_last_day_of_month(d: date) -> bool:
    return (d + timedelta(days=1)).day == 1


def fetch_month_rows(year_month: str) -> list[dict]:
    res = requests.get(
        f"{SUPABASE_URL}/rest/v1/activities",
        params={"user_id": f"eq.{USER_ID}", "date": f"gte.{year_month}-01", "select": "date,distance"},
        headers=HEADERS,
        timeout=30,
    )
    res.raise_for_status()
    return [r for r in res.json() if r["date"].startswith(year_month)]


def fetch_recent_daily_metrics(days: int = 35) -> list[dict]:
    start = (today_taipei() - timedelta(days=days)).isoformat()
    res = requests.get(
        f"{SUPABASE_URL}/rest/v1/daily_metrics",
        params={
            "user_id": f"eq.{USER_ID}",
            "date": f"gte.{start}",
            "select": "date,vo2max,resting_hr,sleep_score",
            "order": "date.asc",
        },
        headers=HEADERS,
        timeout=30,
    )
    res.raise_for_status()
    return res.json()


def generate_month_goal(year_month: str, rows_this_month: list[dict], recent_metrics: list[dict], context_note: str) -> dict | None:
    """呼叫 Gemini，依當月訓練數據 + 體能狀態 + 目標賽事，生成 year_month 的訓練目標。"""
    if not GEMINI_API_KEY:
        print("缺少 GEMINI_API_KEY，略過月目標生成")
        return None

    total_km = sum(float(r.get("distance") or 0) for r in rows_this_month)
    run_count = len(rows_this_month)
    latest_vo2 = next((m["vo2max"] for m in reversed(recent_metrics) if m.get("vo2max")), None)
    latest_sleep = next((m["sleep_score"] for m in reversed(recent_metrics) if m.get("sleep_score")), None)
    days_to_race = (date.fromisoformat(TARGET_RACE["date"]) - today_taipei()).days

    prompt = (
        f"你是 Sasha 的跑步教練，她正備戰 {TARGET_RACE['date']} 的{TARGET_RACE['name']}"
        f"（目標 {TARGET_RACE['goal_label']}），距離比賽還有 {days_to_race} 天。{context_note}"
        f"累積跑量 {total_km:.1f} km，共 {run_count} 次訓練。"
        f"最近的 VO2max 約 {latest_vo2 or '未知'}，睡眠分數約 {latest_sleep or '未知'}。"
        f"請根據這些數據與備賽時程，給她 {year_month} 的訓練目標，"
        '請只回傳 JSON（不要加 markdown code fence），格式：'
        '{"goal_km": 數字, "summary": "一句話說明這個月訓練重點", "focus": "本月重點關鍵字，例如：有氧基礎"}'
    )

    res = requests.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={GEMINI_API_KEY}",
        headers={"Content-Type": "application/json"},
        json={
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.6, "maxOutputTokens": 300, "thinkingConfig": {"thinkingBudget": 0}},
        },
        timeout=30,
    )
    if not res.ok:
        print(f"Gemini 月目標生成失敗 {res.status_code}: {res.text}", file=sys.stderr)
        return None

    try:
        text = res.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
        if text.startswith("```"):
            text = text.strip("`")
            if text.startswith("json"):
                text = text[4:]
        parsed = json.loads(text.strip())
        return {
            "user_id": USER_ID,
            "year_month": year_month,
            "goal_km": float(parsed["goal_km"]),
            "summary": parsed.get("summary"),
            "focus": parsed.get("focus"),
        }
    except Exception as e:
        print(f"解析 Gemini 月目標回覆失敗: {e}")
        return None


def upsert_monthly_goal(goal: dict) -> None:
    res = requests.post(
        f"{SUPABASE_URL}/rest/v1/monthly_goals",
        params={"on_conflict": "user_id,year_month"},
        headers={**HEADERS, "Prefer": "resolution=merge-duplicates"},
        json=[goal],
        timeout=30,
    )
    if res.ok:
        print(f"月目標已生成：{goal['year_month']} → {goal['goal_km']} km（{goal.get('summary')}）")
    elif res.status_code == 404:
        print("monthly_goals 表不存在，略過月目標（請在 Supabase SQL editor 建表）")
    else:
        print(f"月目標寫入失敗 {res.status_code}: {res.text}", file=sys.stderr)


def maybe_generate_monthly_goal() -> None:
    today = today_taipei()
    force = os.environ.get("FORCE_MONTHLY_GOAL") == "1"
    is_month_end = is_last_day_of_month(today)
    if not is_month_end and not force:
        return

    if is_month_end:
        target_month = (today + timedelta(days=1)).strftime("%Y-%m")
        note = f"這是她 {today.strftime('%Y-%m')} 完整一個月的訓練回顧，請生成下個月的目標。"
    else:
        # 月中手動補跑（例如剛上線這個功能時，幫當月補一個目標）
        target_month = today.strftime("%Y-%m")
        note = f"現在是 {today.isoformat()}，月中補生成本月目標，請根據近期訓練狀況估算合理目標。"

    rows_this_month = fetch_month_rows(today.strftime("%Y-%m"))
    recent_metrics = fetch_recent_daily_metrics()
    goal = generate_month_goal(target_month, rows_this_month, recent_metrics, note)
    if goal:
        upsert_monthly_goal(goal)


def main() -> None:
    client = garmin_login()

    metrics = fetch_daily_metrics(client)
    if metrics:
        upsert_daily_metrics(metrics)

    start = (today_taipei() - timedelta(days=LOOKBACK_DAYS)).isoformat()
    end = today_taipei().isoformat()
    activities = client.get_activities_by_date(start, end)
    print(f"Garmin 回傳 {len(activities)} 筆活動（{start} ~ {end}）")

    existing = fetch_existing()
    rows = []
    for activity in activities:
        row = to_row(activity)
        if row and not is_duplicate(row, existing):
            row.update(fetch_weather(client, activity["activityId"]))
            rows.append(row)

    if not rows:
        print("沒有需要新增的跑步活動")
    else:
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

    # 即使今天沒有新活動（例如休息日），月底/強制補跑仍要照常生成月目標
    maybe_generate_monthly_goal()


if __name__ == "__main__":
    main()
