"use client"

import { useMemo, useState, type ChangeEvent } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { trendingScore, topRatedThisWeekScore } from "@/lib/rankers"

type Game = {
  id: string
  title: string
  description: string
  tags: string[]
  cover: string
  plays48h: number
  likes7d: { up: number; total: number }
  likesAll: { up: number; total: number }
  publishedAt: string // ISO
  updatedAt: string // ISO
}

// Placeholder dataset for Discover hub
const GAMES: Game[] = [
  {
    id: "g1",
    title: "Starfall Racing",
    description: "Drift through nebulas in a fast, friendly space racer.",
    tags: ["racing", "space", "casual"],
    cover: "/logo.svg",
    plays48h: 1240,
    likes7d: { up: 380, total: 450 },
    likesAll: { up: 2100, total: 2600 },
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: "g2",
    title: "Mystery Manor Mini",
    description: "Short-session whodunit puzzles with cozy vibes.",
    tags: ["puzzle", "mystery"],
    cover: "/logo.svg",
    plays48h: 860,
    likes7d: { up: 220, total: 270 },
    likesAll: { up: 900, total: 1100 },
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
  },
  {
    id: "g3",
    title: "City Lights Stories",
    description: "Micro narrative adventures from a neon downtown.",
    tags: ["narrative", "story"],
    cover: "/logo.svg",
    plays48h: 540,
    likes7d: { up: 180, total: 220 },
    likesAll: { up: 1400, total: 1800 },
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    id: "g4",
    title: "Forest Song",
    description: "Guide spirits with rhythm-based puzzles.",
    tags: ["music", "puzzle"],
    cover: "/logo.svg",
    plays48h: 300,
    likes7d: { up: 160, total: 210 },
    likesAll: { up: 2500, total: 3000 },
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
  },
  {
    id: "g5",
    title: "Codebreakers Arena",
    description: "Crack ciphers and outsmart rivals in quick rounds.",
    tags: ["strategy", "logic"],
    cover: "/logo.svg",
    plays48h: 980,
    likes7d: { up: 300, total: 400 },
    likesAll: { up: 1200, total: 1500 },
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
  },
]

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
function byTopRated(a: Game, b: Game) {
  return topRatedThisWeekScore(b) - topRatedThisWeekScore(a)
}

export default function DiscoverPage() {
  const [q, setQ] = useState<string>("")

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return GAMES
    return GAMES.filter(g =>
      g.title.toLowerCase().includes(needle) ||
      g.tags.some(t => t.toLowerCase().includes(needle))
    )
  }, [q])

  const trending = useMemo(() => [...filtered].sort(byTrending).slice(0, 6), [filtered])
  const newRising = useMemo(() => [...filtered].sort(byNewAndRising).slice(0, 6), [filtered])
  const topRated = useMemo(() => [...filtered].sort(byTopRated).slice(0, 6), [filtered])
  const editors = useMemo(() => trending.slice(0, 4), [trending])
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

      <Section title="Trending now" items={trending} />
      <Section title="New & Rising" items={newRising} />
      <Section title="Top Rated (This Week)" items={topRated} />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium">Editor’s Picks</h2>
          <Link className="text-sm underline" href="#">See all</Link>
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

function Section({ title, items }: { title: string; items: Game[] }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium">{title}</h2>
        <Link className="text-sm underline" href="#">See all</Link>
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
