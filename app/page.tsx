"use client"

import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { trendingScore } from "@/lib/rankers"
import { type Game as DemoGame } from "@/lib/demo-data"
import { filterByCategory, dedupeBySlug } from "@/lib/filters"
import { CategoryPills } from "@/components/CategoryPills"
import SortSelect, { type SortValue } from "@/components/SortSelect"
import { getCatalog, slugify } from "@/lib/catalog"

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
  const selectedCategory = (searchParams.get("category") || null) as string | null
  const sort = ((searchParams.get("sort") as SortValue) || "trending") as SortValue

  // Merge demo catalog with any locally published games (client only)
  const catalog = useMemo(() => getCatalog(), [])

  // hydrate q from URL
  useEffect(() => {
    const urlQ = searchParams.get("q") || ""
    setQ(urlQ)
  }, [searchParams])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const byCategory = filterByCategory(catalog as any, selectedCategory)
    const bySearch = !needle
      ? byCategory
      : byCategory.filter((g: any) =>
          g.title.toLowerCase().includes(needle) ||
          (g.tags ?? []).some((t: string) => t.toLowerCase().includes(needle))
        )
    return dedupeBySlug(bySearch as any)
  }, [q, selectedCategory, catalog])

  const trending = useMemo(() => [...filtered].sort(byTrending).slice(0, 6), [filtered])
  const newRising = useMemo(() => [...filtered].sort(byNewAndRising).slice(0, 6), [filtered])
  const editors = useMemo(() => filtered.filter((g: any) => g.editorsPick).slice(0, 6), [filtered])

  // Build category list from all games (not filtered by search), sorted by count desc
  const categories = useMemo(() => {
    const counts: Record<string, number> = {}
    ;(catalog as any[]).forEach((g: any) => (g.tags ?? []).forEach((t: string) => { const k=slugify(t); counts[k] = (counts[k] ?? 0) + 1 }))
    return Object.keys(counts).sort((a,b)=>counts[b]-counts[a])
  }, [catalog])

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
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const val = e.target.value
              setQ(val)
              const params = new URLSearchParams(searchParams.toString())
              if (val) params.set("q", val); else params.delete("q")
              const qs = params.toString()
              router.push(qs ? `/?${qs}` : "/")
            }}
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
          if (!slug) {
            params.delete("category");
            params.delete("sort");
          } else {
            params.set("category", slug)
            if (!params.get("sort")) params.set("sort", "trending")
          }
          const qs = params.toString()
          router.push(qs ? `/?${qs}` : "/")
        }}
      />

      {selectedCategory || (q && q.trim().length > 0) ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium capitalize">{(selectedCategory ?? "Results").replace(/-/g, " ")}</h2>
            <SortSelect
              value={sort}
              onChange={(v) => {
                const params = new URLSearchParams(searchParams.toString())
                params.set("sort", v)
                if (selectedCategory) params.set("category", selectedCategory)
                router.push(`/?${params.toString()}`)
              }}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {applySort(filtered as any, sort).map((g: any) => (
              <GameCard key={(g as any).slug ?? (g as any).id ?? g.title} game={g as any} />
            ))}
          </div>
        </section>
      ) : (
        <>
          <Section title="Trending now" items={trending} seeAllHref="/trending" />
          <Section title="New & Rising" items={newRising} />
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium">Editor’s Picks</h2>
              <Link className="text-sm underline" href="/editors-picks">See all</Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {editors.map(g => (
                <GameCard key={(g as any).slug ?? g.id} game={g as any} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function Section({ title, items, seeAllHref }: { title: string; items: DemoGame[]; seeAllHref?: string }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium">{title}</h2>
  {seeAllHref ? <Link className="text-sm underline" href={seeAllHref}>See all</Link> : <span />}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((g) => (
          <GameCard key={(g as any).id ?? (g as any).slug ?? g.title} game={g as any} />
        ))}
      </div>
    </section>
  )
}

function GameCard({ game }: { game: any }) {
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
        {(game as any).origin === "local" && (
          <div className="mt-2 text-[10px] uppercase tracking-wide text-neutral-500">Your game</div>
        )}
      </div>
    </Card>
  )
}

function applySort(items: Game[], sort: SortValue): Game[] {
  if (sort === "trending") return [...items].sort(byTrending)
  if (sort === "new") return [...items].sort((a,b)=> Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
  if (sort === "updated") return [...items].sort((a,b)=> Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
  if (sort === "editors") return items.filter((g)=> g.editorsPick)
  return items
}
