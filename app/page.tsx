"use client"

import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { boostedTrendingScore, trendingScore } from "@/lib/rankers"
import { games as DEMO, type Game as DemoGame } from "@/lib/demo-data"
import { sanitizeForDisplay } from "@/lib/sanitize"
import { dedupeBySlug } from "@/lib/filters"
import SortSelect, { type SortValue } from "@/components/SortSelect"
import { getCatalog, slugify } from "@/lib/catalog"
import GameCard from "@/components/GameCard"
import { getLocalLikes } from "@/lib/likes"

function byTrending(a: any, b: any) {
  return trendingScore(b) - trendingScore(a)
}
function byNewAndRising(a: any, b: any) {
  const pa = Date.parse(a.publishedAt)
  const pb = Date.parse(b.publishedAt)
  if (pb !== pa) return pb - pa // newer first
  // tiebreaker by trending
  return trendingScore(b) - trendingScore(a)
}

export default function DiscoverPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [q, setQ] = useState<string>(() => searchParams.get("q") || "")
  const selectedCategory = null as string | null
  const sort = ((searchParams.get("sort") as SortValue) || "trending") as SortValue

  // Server-safe initial catalog (demo only); merge locals after mount to avoid hydration mismatch
  const [catalog, setCatalog] = useState<any[]>(() => DEMO.map((g) => ({ ...g, slug: slugify(g.title) })))
  const [likesTick, setLikesTick] = useState<number>(0)

  useEffect(() => {
    // Enhance on client with local games
    setCatalog(getCatalog() as any)
  }, [])

  useEffect(() => {
    const onLikes = () => setLikesTick((n: number) => n + 1)
    window.addEventListener("likes:changed" as any, onLikes)
    return () => window.removeEventListener("likes:changed" as any, onLikes)
  }, [])

  // q is initialized from searchParams; subsequent changes sync URL in onChange

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
  const byCategory = catalog as any
    const bySearch = !needle
      ? byCategory
      : byCategory.filter((g: any) =>
          (g.title || "").toLowerCase().includes(needle) ||
          (g.description || "").toLowerCase().includes(needle)
        )
    return dedupeBySlug(bySearch as any)
  }, [q, selectedCategory, catalog])

  const trending = useMemo(() => {
    // On client, apply local likes boost; on server, fall back to base sort
    if (typeof window === "undefined") return [...filtered].sort(byTrending).slice(0, 6)
    return [...filtered]
      .sort((a: any, b: any) => {
        const la = getLocalLikes((a?.slug ?? "").toString())
        const lb = getLocalLikes((b?.slug ?? "").toString())
        return boostedTrendingScore(b as any, lb) - boostedTrendingScore(a as any, la)
      })
      .slice(0, 6)
  }, [filtered, likesTick])
  const newRising = useMemo(() => [...filtered].sort(byNewAndRising).slice(0, 6), [filtered])
  const editors = useMemo(() => filtered.filter((g: any) => g.editorsPick).slice(0, 6), [filtered])

  // Build category list from all games (not filtered by search), sorted by count desc
  const categories: string[] = []

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
            placeholder="Search by title or description…"
            aria-label="Search"
          />
        </div>
      </section>

      {/* Categories pills */}
  {/* Category pills removed as tags/categories are no longer used */}

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
            {applySort(filtered as any, sort, likesTick).map((g: any) => (
              <GameCard key={(g as any).slug} game={g as any} onClick={() => router.push(`/game/${(g as any).slug}`)} />
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
              {editors.map((g: any) => (
                <GameCard key={(g as any).slug} game={g as any} onClick={() => router.push(`/game/${(g as any).slug}`)} />
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
  <CardTitle className="line-clamp-1">{sanitizeForDisplay(game.title || "")}</CardTitle>
  <CardDescription className="line-clamp-2">{sanitizeForDisplay(game.description || "")}</CardDescription>
  <div className="mt-2 text-xs text-neutral-500">&nbsp;</div>
        {(game as any).origin === "local" && (
          <div className="mt-2 text-[10px] uppercase tracking-wide text-neutral-500">Your game</div>
        )}
      </div>
    </Card>
  )
}

function applySort(items: any[], sort: SortValue, likesTick?: number): any[] {
  if (sort === "trending") {
    if (typeof window === "undefined") return [...items].sort(byTrending)
    return [...items].sort((a: any, b: any) => {
      const la = getLocalLikes((a?.slug ?? "").toString())
      const lb = getLocalLikes((b?.slug ?? "").toString())
      return boostedTrendingScore(b as any, lb) - boostedTrendingScore(a as any, la)
    })
  }
  if (sort === "new") return [...items].sort((a,b)=> Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
  if (sort === "updated") return [...items].sort((a,b)=> Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
  if (sort === "editors") return items.filter((g)=> g.editorsPick)
  return items
}
