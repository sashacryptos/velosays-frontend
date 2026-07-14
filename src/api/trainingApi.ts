/**
 * trainingApi.ts
 * 前端 API 層：處理與後端 GAS/Vercel Function 的通信
 */

const SYNC_ENDPOINT = import.meta.env.VITE_SYNC_ENDPOINT;

interface SyncPayload {
  action: "sync_activities" | "generate_ai_plan" | "start_training";
  user_id: string;
  metadata?: Record<string, any>;
}

interface SyncResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

/**
 * 核心同步函數 - 調用後端 endpoint
 */
export async function callSyncEndpoint(payload: SyncPayload): Promise<SyncResponse> {
  if (!SYNC_ENDPOINT) {
    console.error("❌ VITE_SYNC_ENDPOINT 未設定");
    throw new Error("同步端點未配置。請檢查環境變數設定。");
  }

  try {
    console.log("📡 Calling sync endpoint:", payload);

    const response = await fetch(SYNC_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      mode: "cors",
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data: SyncResponse = await response.json();
    console.log("✅ Sync successful:", data);

    // 延遲 2-3 秒再刷新，讓後端寫入完成
    setTimeout(() => {
      console.log("🔄 重新整理頁面...");
      window.location.reload();
    }, 2500);

    return data;
  } catch (error) {
    console.error("❌ Sync failed:", error);
    const errorMessage = error instanceof Error ? error.message : "未知錯誤";
    alert(`同步失敗：${errorMessage}\n\n請稍後重試或檢查後端連線。`);
    throw error;
  }
}

/**
 * 從 Garmin 同步活動
 * - 呼叫後端讀取 Garmin API
 * - 寫入 Supabase activities table
 * - 回傳最新活動數據
 */
export async function syncActivitiesFromGarmin(userId: string): Promise<SyncResponse> {
  console.log("🔄 開始同步 Garmin 活動...");
  return callSyncEndpoint({
    action: "sync_activities",
    user_id: userId,
  });
}

/**
 * 產生 AI 日課表
 * - 讀取最近 7 天的訓練數據
 * - 讀取用戶目標賽事
 * - 呼叫 Claude API 產生今日建議
 * - 寫入 ai_daily_reports + planned_workouts table
 */
export async function generateAIDailyPlan(userId: string): Promise<SyncResponse> {
  console.log("🤖 開始產生 AI 課表...");
  return callSyncEndpoint({
    action: "generate_ai_plan",
    user_id: userId,
  });
}

/**
 * 開始訓練
 * - 記錄訓練開始時間
 * - 寫入 training_sessions table
 * - 前端跳轉到訓練頁面（可選）
 */
export async function startTraining(userId: string, workoutId?: string): Promise<SyncResponse> {
  console.log("▶️ 開始訓練...");
  return callSyncEndpoint({
    action: "start_training",
    user_id: userId,
    metadata: { workout_id: workoutId },
  });
}

/**
 * 驗證後端連線
 * 用於初始化時檢查配置是否正確
 */
export async function verifyBackendConnection(): Promise<boolean> {
  try {
    console.log("🔗 檢查後端連線...");
    const response = await fetch(SYNC_ENDPOINT || "", {
      method: "OPTIONS",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.ok || response.status === 405; // 405 Method Not Allowed 表示後端存在
  } catch (error) {
    console.warn("⚠️ 後端連線檢查失敗:", error);
    return false;
  }
}

/**
 * 取得 Vercel 環境信息（開發用）
 */
export function getEnvironmentInfo() {
  return {
    endpoint: SYNC_ENDPOINT,
    isProduction: import.meta.env.PROD,
    environment: import.meta.env.MODE,
  };
}

export default {
  callSyncEndpoint,
  syncActivitiesFromGarmin,
  generateAIDailyPlan,
  startTraining,
  verifyBackendConnection,
  getEnvironmentInfo,
};
