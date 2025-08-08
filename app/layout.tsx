import "./globals.css"
import Image from "next/image"
import Link from "next/link"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export const metadata = {
  title: "JamPlay",
  description: "AI Prompt Game hub",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies()
  const cookieNames = cookieStore.getAll().map(c => c.name) // <— add this

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,

@@ -19,7 +13,7 @@ export default async function RootLayout({ children }: { children: React.ReactNo
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {}, // no-op in server component
      },
    }
  )

@@ -30,9 +24,25 @@ export default async function RootLayout({ children }: { children: React.ReactNo
    <html lang="en">
      <body className="min-h-screen">
        <pre id="whoami" style={{ padding: 8, fontSize: 12, background: "#111", color: "#0f0" }}>
          {JSON.stringify({ user, error, cookieNames }, null, 2)}
        </pre>
        {/* rest of your layout unchanged */}
