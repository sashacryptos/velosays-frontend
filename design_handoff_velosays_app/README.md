# Handoff: Velosays App UI Redesign（藍 × 橘 漸層）

## Overview
Velosays 跑步 app 的全面 UI 重新設計：柔和漸層視覺、冷藍（#2563EB）× 活力橘（#F97316）配色。涵蓋五個分頁（看板／歷史／教練／體能／設定）＋跑步詳情頁。目標 codebase 為 `velosays-frontend`（React + TypeScript + Vite + Tailwind CSS 4，部署於 Vercel）。

## About the Design Files
本包內的 `Velosays App.dc.html`（搭配 `support.js` 開啟）是 **HTML 設計參考稿**，展示預期的外觀與互動，不是可直接搬用的production code。任務是在現有 React codebase 中**重現這份設計**：改寫 `src/components/` 下的 `Dashboard.tsx`、`HistoryList.tsx`、`RunDetail.tsx`、`Coach.tsx`、`FitnessStatus.tsx`、`BottomNav.tsx` 及 `App.tsx` 的 settings 區塊，沿用既有的 Tailwind 4、資料層（`src/api/activities.ts`、Supabase）與 state 架構。

## Fidelity
**High-fidelity**：色彩、字體、間距、圓角、陰影皆為最終值，請照 hex 值與尺寸實作。設計稿以 390–430px 行動版寬度為準（`max-width: 430px; margin: 0 auto`），內容區各自捲動、底部導覽固定。

## Design Tokens
- 主藍 `#2563EB`、亮藍 `#60A5FA`、淺藍 `#93B8F8` / `#BFD7FB` / `#DBEAFE`
- 活力橘 `#F97316`、深橘 `#EA5B23` / `#C2570F`、淺橘 `#FFE9D6` / `#FFE4CC` / `#FDBA74`
- 文字：標題 `#1C2430`、正文 `#6A7482`、次要 `#9AA3B0`、失效 `#D5DAE1`、導覽未選 `#B4BAC4`
- App 背景漸層：`linear-gradient(170deg, #E8F1FF 0%, #F7F9FF 45%, #FFF0E2 100%)`
- Hero 卡漸層：`radial-gradient(120% 140% at 8% 0%, #93B8F8 0%, #4C82F0 34%, #2563EB 62%, #F97316 130%)`＋右下角橘色光暈 `radial-gradient(circle, rgba(253,186,116,0.55) 0%, transparent 70%)`
- 詳情 hero：`radial-gradient(130% 150% at 10% 0%, #93B8F8 0%, #2563EB 58%, #8C6F5A 135%)`
- 字體：中文 `Noto Sans TC`（400/500/700）、數字 `Outfit`（300–600）
- 圓角：卡片 20–28px、按鈕/膠囊 999px、圖示圓 50%
- 陰影：hero `0 16px 36px rgba(37,99,235,0.32)`、白卡 `0 4px 14px rgba(28,36,48,0.06)`
- 圖示：Tabler Icons（ti-run / ti-bolt / ti-mountain / ti-heartbeat / ti-message-circle / ti-refresh / ti-sparkles / ti-send / ti-chevron-*）

## Screens / Views

### 1. 看板 Dashboard
- 頂：日期（13px `#9AA3B0`）＋「早安，Sasha」（24px/700）；右側「同步 Garmin」膠囊鈕（`#FFE9D6` 底、`#C2570F` 字、ti-refresh，點擊顯示「同步中...」1.2s）
- **週曆列（可點擊）**：一～日 7 格，等寬 flex、圓角 16px；今日 = 藍漸層 `linear-gradient(160deg,#60A5FA,#2563EB)` 白字＋陰影；有跑步紀錄的日期下方橘點 `#F97316`，**點擊跳轉該筆跑步詳情**（等同歷史→詳情）；有課表的日期淺藍點 `#BFD7FB`
- **Hero 卡（本週跑量進度）**：藍→橘 radial 漸層、圓角 28px；「本週跑量」13px、大數字 44px Outfit「36.1 / 40 km」；右上兩顆半透明圓鈕（ti-heartbeat→體能、ti-message-circle→教練）；白色進度條（8px、圓角）；下行「還差 X km・下一課：明天 輕鬆跑 5K」
- 三張統計小卡（白底圓角 20）：最近配速 5'45"、平均心率 148、VO2max 52（藍字）
- **近期訓練課表**（未來課表時間軸，標題 16px/700，右側「歷史數據 →」連結）：3 列（今天 輕鬆跑 5K／7/17 間歇 6×400m／7/19 長距離跑 14K），各列：日期＋色點＋icon 圓底＋標題/副文

### 2. 歷史 History（分頁列表）
- 頂：返回圓鈕＋「歷史數據」（20px/700）＋副標「已同步 Garmin」
- **固定三張統計卡**（一列 flex gap 8）：
  1. 本月累積里程（藍漸層卡 `#DBEAFE→#BFD7FB`）— 由當月紀錄加總
  2. 本月 __ 次跑步（橘漸層卡 `#FFE9D6→#FDBA74`）
  3. 累積 __ 次跑步（白卡）
- **列表：每頁 6 列**，每列白卡（圓角 20、icon 圓底依類型配色、標題「日期・類型」、meta「配速/km・心率・分鐘」、右側 km ＋ chevron），**點擊進入詳情**
- **換頁控制**：置中「‹  1 / 2  ›」，白色圓鈕 36px，第一/最末頁時箭頭 `#D5DAE1` 失效色
- 類型配色：輕鬆/恢復跑 `#DBEAFE`/`#2563EB`；間歇/配速跑 `#FFE9D6`/`#F97316`；長距離跑 `#FFE4CC`/`#EA5B23`

### 3. 跑步詳情 RunDetail
- 返回鈕＋類型標題＋日期副標
- 漸層 hero：距離／配速／時間 三欄（26px Outfit）
- 2×2 白卡：平均心率、最大心率、步頻、步幅
- 心率區間 Z1–Z5 橫條（色：`#BFD7FB` `#60A5FA` `#2563EB` `#F97316` `#C2570F`，右側「X分・X%」）
- 每公里配速直條圖＋AI 回饋卡（淺色底、13px/1.7 行高）

### 4. AI 教練 Coach
- 頭像圓（藍 radial 漸層＋ti-sparkles）＋標題＋副標「根據 Garmin 數據即時分析」
- 訊息區 `flex:1; min-height:0; overflow-y:auto`：教練 = 白泡泡左對齊（左下角 6px）；使用者 = 藍漸層 `linear-gradient(135deg,#60A5FA,#2563EB)` 白字右對齊（右下角 6px）；14px/1.7
- 快捷 chips：「訓練負荷分析」（橘框橘字）「心率區間」（藍框藍字）
- 輸入列：白色膠囊＋藍色圓形送出鈕（ti-send），Enter 送出

### 5. 體能 FitnessStatus
- 標題＋副標；兩張環形卡（SVG 圓環：VO2max 52 藍環、7 天負荷 251 橘環）
- 靜止心率/睡眠分數等白卡＋7 天負荷直條圖（最高値橘 `#F97316`、其餘 `#93B8F8`）

### 6. 設定 Settings — **保留現有 layout**
沿用現有 App.tsx 的實作：白卡＋「設定」標題＋「此頁面尚未實作」。僅套用新視覺（圓角 24 白卡、新字色），不新增功能列。

### BottomNav（5 分頁）
看板 ti-layout-dashboard／歷史 ti-history／教練 ti-message-circle／體能 ti-heartbeat／設定 ti-settings。固定底部、白底（或毛玻璃 `backdrop-filter`）、選中 `#2563EB`/700、未選 `#B4BAC4`。詳情頁時「歷史」保持選中。

## Interactions & Behavior
- 分頁切換清除 selectedRunId；歷史列表→詳情→返回維持原分頁頁碼
- 週曆點擊：有 runId 的日期 → `setActiveTab('history') + setSelectedRunId(id)`；其餘日期無動作
- 歷史分頁：`page` state（0 起算），`slice(page*6, page*6+6)`，上一/下一頁鈕 clamp 邊界並在邊界時失效
- 同步鈕：syncing 時顯示「同步中...」並 disable
- Hover：列表卡 `#FBFAF8`；所有可點擊元素 cursor pointer；行動端 hit target ≥ 44px

## State Management
沿用現有：`activeTab`、`selectedRunId`、`messages`、`syncing`、`rows`（Supabase 資料）。新增：`historyPage: number`。統計卡數值由 `rows` 計算（本月里程/次數、總次數），對應現有 `monthlyKm()` 等 helper。

## Assets
- Google Fonts：Noto Sans TC、Outfit
- Tabler Icons webfont（建議 React 專案改用 `@tabler/icons-react`）
- 無圖片資產

## Files
- `Velosays App.dc.html` — 完整互動設計稿（五分頁＋詳情，含所有樣式與假資料）
- `support.js` — 設計稿執行環境（與 HTML 同資料夾即可在瀏覽器開啟）
