"use client"
import { useEffect, useMemo, useState } from "react"
import { boostedTrendingScore } from "@/lib/rankers"
import { getCatalog } from "@/lib/catalog"
import { getLocalLikes } from "@/lib/likes"
import GameCard from "@/components/GameCard"

export default function TrendingPage() {
  const [likesTick, setLikesTick] = useState(0)
  useEffect(() => {
    const onLikes = () => setLikesTick((n) => n + 1)
    window.addEventListener("likes:changed" as any, onLikes)
    return () => window.removeEventListener("likes:changed" as any, onLikes)
  }, [])

  const items = useMemo(() => {
    const list = getCatalog()
    return list
      .slice()
      .sort((a: any, b: any) => {
        const la = getLocalLikes((a?.slug ?? "").toString())
        const lb = getLocalLikes((b?.slug ?? "").toString())
        return boostedTrendingScore(b as any, lb) - boostedTrendingScore(a as any, la)
      })
  }, [likesTick])
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Trending</h1>
        <p className="text-neutral-600 text-sm">What players are enjoying right now.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((g) => {
          const k = (g as any).slug ?? (g as any).id ?? g.title
          return (
            <React.Fragment key={k}>
              <GameCard game={g as any} />
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
