import Link from "next/link"
import { supabaseServer } from "@/lib/supabase-server"
import { Card, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

async function getHomepageData() {
  const supabase = supabaseServer()
  const [{ data: promo }, { data: trending }, { data: newest }, { data: lowToken }] = await Promise.all([
    supabase.from("promotions_view").select("*").eq("placement","homepage_hero").gte("ends_at", new Date().toISOString()).limit(1).maybeSingle(),
    supabase.from("trending_games").select("*").order("score", { ascending: false }).limit(6),
    supabase.from("games").select("*").eq("status","public").order("created_at", { ascending: false }).limit(6),
    supabase.from("trending_games").select("*").order("avg_cost_per_min", { ascending: true }).limit(6),
  ])
  return { promo, trending, newest, lowToken }
}

export default async function HomePage() {
  const { promo, trending, newest, lowToken } = await getHomepageData()
  return (
    <div className="space-y-10">
      <section className="rounded-xl bg-neutral-950 text-white p-6">
        <h1 className="text-2xl font-semibold">Join the current Jam</h1>
        <p className="text-neutral-300 mt-1">Build a low‑token game and ship it.</p>
        <div className="mt-4">
          <Button asChild><Link href="/browse">Explore Games</Link></Button>
        </div>
      </section>

      <Section title="Trending">
        <GridGames rows={trending ?? []} />
      </Section>

      <Section title="New">
        <GridGames rows={newest ?? []} />
      </Section>

      <Section title="Low‑Token Hits">
        <GridGames rows={lowToken ?? []} />
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function GridGames({ rows }: { rows: any[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {rows.map((r) => (
        <Card key={r.game_id ?? r.id}>
          <CardTitle className="line-clamp-1">{r.title}</CardTitle>
          <CardDescription className="line-clamp-2">{r.summary}</CardDescription>
          <Link className="mt-2 inline-block text-sm underline" href={`/game/${r.slug}`}>Open</Link>
        </Card>
      ))}
    </div>
  )
}
