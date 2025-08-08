// lib/supabase-server.ts
import { cookies } from "next/headers"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

export function supabaseServer() {
  const store = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return store.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          store.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          // Clearing cookie: set empty value with same options
          store.set({ name, value: "", ...options })
        }
      }
    }
  )
}
