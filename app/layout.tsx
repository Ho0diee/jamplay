import "./globals.css"
import Image from "next/image"
import Link from "next/link"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import AuthListener from "./auth-listener"

export const metadata = {
  title: "JamPlay",
  description: "AI Prompt Game hub",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies()
  const cookieNames = cookieStore.getAll().map(c => c.name)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Next 14 + @supabase/ssr new API
        getAll() { return cookieStore.getAll() },
        setAll() {}, // no-op in a server component
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  return (
    <html lang="en">
      <body className="min-h-screen">
        {/* TEMP DEBUG — remove once Create Game works */}
        <pre id="whoami" style={{ padding: 8, fontSize: 12, background: "#111", color: "#0f0" }}>
          {JSON.stringify({ user, error, cookieNames }, null, 2)}
        </pre>

        <AuthListener />

        <header className="border-b">
          <div className=
