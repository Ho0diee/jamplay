import { trendingScore } from "@/lib/rankers"
import { getCatalog } from "@/lib/catalog"
import GameCard from "@/components/GameCard"

export default function TrendingPage() {
  const items = getCatalog().slice().sort((a: any, b: any) => trendingScore(b) - trendingScore(a))
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Trending</h1>
        <p className="text-neutral-600 text-sm">What players are enjoying right now.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((g: any) => {
          const k = (g as any).slug ?? (g as any).id ?? g.title
          return (
            <div key={k}>
              <GameCard game={g as any} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
