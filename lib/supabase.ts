import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.CALLIESPORT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.CALLIESPORT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
