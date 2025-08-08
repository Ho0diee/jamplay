import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

// ...

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies()
  const cookieNames = cookieStore.getAll().map(c => c.name) // <-- add this

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  return (
    <html lang="en">
      <body className="min-h-screen">
        <pre id="whoami" style={{ padding: 8, fontSize: 12, background: "#111", color: "#0f0" }}>
          {JSON.stringify({ user, error, cookieNames }, null, 2)}  {/* <-- replace */}
        </pre>

        <header className="border-b">
          <div className="container flex h-14 items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.svg" width={120} height={28} alt="JamPlay"/>
            </Link>
            <nav className="ml-auto flex items-center gap-4">
              <Link href="/browse" className="text-sm">Browse</Link>
              <Link href="/create" className="text-sm">Create</Link>
              <Link href="/admin" className="text-sm">Admin</Link>
            </nav>
          </div>
        </header>
        <main className="container py-6">{children}</main>
        <footer className="border-t mt-10">
          <div className="container py-6 text-sm text-neutral-600">© {new Date().getFullYear()} JamPlay</div>
        </footer>
      </body>
    </html>
  )
}
