"use client"

import Link from "next/link"
import { useMemo, useState, type ChangeEvent } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"

type GameItem = {
  id: string
  slug: string
  title: string
  summary: string
  meta: string
}

// Public, in-memory sample data so /browse is always viewable without auth
const GAMES: GameItem[] = [
  {
    id: "1",
    slug: "mystery-manor",
    title: "Mystery Manor",
    summary: "Unravel the secrets of an old estate in this cozy mystery adventure.",
    meta: "Puzzle • E10+",
  },
  {
    id: "2",
    slug: "starfall",
    title: "Starfall",
    summary: "A space-faring tale of exploration, trade, and tiny tough choices.",
    meta: "Adventure • Everyone",
  },
  {
    id: "3",
    slug: "codebreakers",
    title: "Codebreakers",
    summary: "Crack ciphers and outsmart rivals in a fast-paced deduction game.",
    meta: "Strategy • Teen",
  },
  {
    id: "4",
    slug: "forest-song",
    title: "Forest Song",
    summary: "Guide spirits through a musical grove with rhythm-based puzzles.",
    meta: "Music • Everyone",
  },
  {
    id: "5",
    slug: "city-lights",
    title: "City Lights",
    summary: "Stories from a neon downtown—short sessions, big feelings.",
    meta: "Narrative • Teen",
  },
  {
    id: "6",
    slug: "island-sketches",
    title: "Island Sketches",
    summary: "Collect moments and sketches while sailing a friendly archipelago.",
    meta: "Casual • Everyone",
  },
]

export default function BrowsePage() {
  const [query, setQuery] = useState<string>("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return GAMES
    return GAMES.filter((g) =>
      g.title.toLowerCase().includes(q) || g.summary.toLowerCase().includes(q)
    )
  }, [query])

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Browse</h1>
        <div className="sm:w-80">
          <Input
            value={query}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            placeholder="Search games…"
            aria-label="Search"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((g: GameItem) => (
          <Card key={g.id} className="flex flex-col gap-2">
            <CardTitle className="line-clamp-1">{g.title}</CardTitle>
            <CardDescription className="line-clamp-2">{g.summary}</CardDescription>
            <div className="mt-auto flex items-center justify-between text-xs text-neutral-500">
              <span>{g.meta}</span>
              <Link className="underline" href={`/game/${g.slug}`}>
                Open
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
