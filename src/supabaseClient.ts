import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://uoufbcvvxvpetubvyeyw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvdWZiY3Z2eHZwZXR1YnZ5ZXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4Mzk0ODIsImV4cCI6MjA5NzQxNTQ4Mn0.q08w5HEpSiNrY5xSdAA-sWAH6mcwdUU6wlw0L0fO5_U";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);