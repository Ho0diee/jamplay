"use client"

import { useMemo, useState, type ChangeEvent } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { trendingScore } from "@/lib/rankers"
import { games as GAMES, type Game } from "@/lib/demo-data"

function byTrending(a: Game, b: Game) {
  return trendingScore(b) - trendingScore(a)
}
function byNewAndRising(a: Game, b: Game) {
  const pa = Date.parse(a.publishedAt)
  const pb = Date.parse(b.publishedAt)
  if (pb !== pa) return pb - pa // newer first
  // tiebreaker by trending
  return trendingScore(b) - trendingScore(a)
}

export default function DiscoverPage() {
  const [q, setQ] = useState<string>("")

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return GAMES
    return GAMES.filter((g: Game) =>
      g.title.toLowerCase().includes(needle) ||
      g.tags.some((t: string) => t.toLowerCase().includes(needle))
    )
  }, [q])

  const trending = useMemo(() => [...filtered].sort(byTrending).slice(0, 6), [filtered])
  const newRising = useMemo(() => [...filtered].sort(byNewAndRising).slice(0, 6), [filtered])
  const editors = useMemo(() => filtered.filter((g: Game) => g.editorsPick).slice(0, 6), [filtered])
  const categories = useMemo(() => {
    const counts: Record<string, number> = {}
    filtered.forEach((g: Game) => g.tags.forEach((t: string) => { counts[t] = (counts[t] ?? 0) + 1 }))
    return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0, 8)
  }, [filtered])

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Hero */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Discover</h1>
          <p className="text-sm text-neutral-600">Play AI-made mini games. Quick sessions, big fun.</p>
        </div>
        <div className="sm:w-80">
          <Input
            value={q}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
            placeholder="Search by title or tag…"
            aria-label="Search"
          />
        </div>
      </section>

  <Section title="Trending now" items={trending} seeAllHref="/trending" />
  <Section title="New & Rising" items={newRising} />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium">Editor’s Picks</h2>
          <Link className="text-sm underline" href="/editors-picks">See all</Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {editors.map(g => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium">Categories</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(([tag, count]) => (
            <Button key={tag} variant="outline" size="sm" className="rounded-full">
              {tag} <span className="ml-2 text-neutral-500">{count}</span>
            </Button>
          ))}
        </div>
      </section>
    </div>
  )
}

function Section({ title, items, seeAllHref }: { title: string; items: Game[]; seeAllHref?: string }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium">{title}</h2>
  {seeAllHref ? <Link className="text-sm underline" href={seeAllHref}>See all</Link> : <span />}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((g) => (
          <GameCard key={g.id} game={g} />
        ))}
      </div>
    </section>
  )
}

function GameCard({ game }: { game: Game }) {
  return (
    <Card className="overflow-hidden">
      <div className="h-28 w-full bg-gradient-to-br from-neutral-100 to-neutral-200" aria-hidden />
      <div className="p-4 space-y-1">
        <CardTitle className="line-clamp-1">{game.title}</CardTitle>
        <CardDescription className="line-clamp-2">{game.description}</CardDescription>
        <div className="mt-2 flex flex-wrap gap-1 text-xs text-neutral-500">
          {game.tags.map(t => (
            <span key={t} className="rounded border px-1.5 py-0.5">{t}</span>
          ))}
        </div>
      </div>
    </Card>
  )
}
