import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://uoufbcvvxvpetubvyeyw.supabase.co";
// publishable key（新版 API key 系統，設計為公開；舊 legacy anon key 已停用）
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_GF0TVSeWJwnSEFm8hI509A_bCAC1hae";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);