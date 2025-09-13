import { createSupabaseServerClient } from "@/lib/supabase";

export async function getServerSession() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}
