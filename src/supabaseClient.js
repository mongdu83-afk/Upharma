import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Thiếu VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY. Xem README.md để cấu hình."
  );
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");
