import { createClient } from "@supabase/supabase-js"

export function supabaseServer() {
  // Use service role on the server if available (bypasses RLS for server actions),
  // otherwise fall back to anon for public reads.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createClient(url, key, {
    auth: { persistSession: false }
  })
}
