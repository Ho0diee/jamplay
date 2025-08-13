"use client"

import { useMemo, useState, type ChangeEvent } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { trendingScore } from "@/lib/rankers"
import { games as GAMES, type Game } from "@/lib/demo-data"
import { filterByCategory } from "@/lib/filters"
import { CategoryPills } from "@/components/CategoryPills"

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
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedCategory = (searchParams.get("category") || undefined) as string | undefined

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const byCategory = filterByCategory(GAMES, selectedCategory)
    if (!needle) return byCategory
    return byCategory.filter((g: Game) =>
      g.title.toLowerCase().includes(needle) ||
      g.tags.some((t: string) => t.toLowerCase().includes(needle))
    )
  }, [q, selectedCategory])

  const trending = useMemo(() => [...filtered].sort(byTrending).slice(0, 6), [filtered])
  const newRising = useMemo(() => [...filtered].sort(byNewAndRising).slice(0, 6), [filtered])
  const editors = useMemo(() => filtered.filter((g: Game) => g.editorsPick).slice(0, 6), [filtered])

  // Build category list from all games (not filtered by search), sorted by count desc
  const categories = useMemo(() => {
    const counts: Record<string, number> = {}
    GAMES.forEach((g: Game) => g.tags.forEach((t: string) => { const k=t.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,""); counts[k] = (counts[k] ?? 0) + 1 }))
    return Object.keys(counts).sort((a,b)=>counts[b]-counts[a])
  }, [])

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

      {/* Categories pills */}
      <CategoryPills
        categories={categories}
        selected={selectedCategory}
        onSelect={(slug: string | null) => {
          const params = new URLSearchParams(searchParams.toString())
          if (!slug) params.delete("category"); else params.set("category", slug)
          const qs = params.toString()
          router.push(qs ? `/?${qs}` : "/")
        }}
      />

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

  {/* Bottom categories removed per requirements */}
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
