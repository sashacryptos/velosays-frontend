"""
garmin_login.py — 在「本機」執行一次，用帳密登入 Garmin 並印出 token 字串。

用法（在自己電腦的終端機執行，不要在 CI 跑）：

    pip3 install garminconnect requests
    GARMIN_EMAIL='你的email' GARMIN_PASSWORD='你的密碼' python3 scripts/garmin_login.py

登入成功後會印出一長串 token，把它整串複製到 GitHub repo secret `GARMINTOKENS`。
之後排程同步只用 token，不需要帳密；token 效期約一年，過期再跑一次本腳本。
若帳號有兩步驟驗證（MFA），過程中會提示輸入驗證碼。
"""

import os
import sys

from garminconnect import Garmin


def main() -> None:
    email = os.environ.get("GARMIN_EMAIL")
    password = os.environ.get("GARMIN_PASSWORD")
    if not email or not password:
        print("請設定 GARMIN_EMAIL 與 GARMIN_PASSWORD 環境變數", file=sys.stderr)
        sys.exit(1)

    client = Garmin(email, password)
    client.login()

    # garminconnect 0.2.x 的 garth client 叫 .garth，0.3.x 改叫 .client
    garth_client = getattr(client, "garth", None) or client.client
    tokens = garth_client.dumps()

    # 同時存一份到本機 token 目錄，讓 sync_garmin.py 可以直接在本機 resume 執行
    token_dir = os.path.expanduser("~/.garminconnect")
    try:
        garth_client.dump(token_dir)
        print(f"token 已存到 {token_dir}（本機執行 sync_garmin.py 會自動使用）")
    except Exception as e:
        print(f"本機 token 目錄寫入失敗（不影響下方字串）: {e}")

    print("\n登入成功！把下面整串貼到 GitHub secret `GARMINTOKENS`：\n")
    print(tokens)


if __name__ == "__main__":
    main()
