import { games, type Game } from "@/lib/demo-data"
import { trendingScore } from "@/lib/rankers"
import Link from "next/link"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"

function byTrending(a: Game, b: Game) {
  return trendingScore(b) - trendingScore(a)
}

export default function TrendingPage() {
  const items = [...games].sort(byTrending)
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Trending</h1>
        <p className="text-neutral-600 text-sm">What players are enjoying right now.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((g) => (
          <Card key={g.id} className="overflow-hidden">
            <div className="h-28 w-full bg-gradient-to-br from-neutral-100 to-neutral-200" aria-hidden />
            <div className="p-4 space-y-1">
              <CardTitle className="line-clamp-1">{g.title}</CardTitle>
              <CardDescription className="line-clamp-2">{g.description}</CardDescription>
              <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
                <span>{g.tags[0] ?? ""}</span>
                <Link className="underline" href={`/game/${g.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`}>
                  Open
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
