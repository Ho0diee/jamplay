"use client"
import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { sanitizeForDisplay } from "@/lib/sanitize"
import GameStats from "@/components/GameStats"
import { getDisplayLikes } from "@/lib/likes"
import { visibleTags } from "@/lib/catalog"

export default function GameCard({ game }: { game: any }) {
  const slug: string = (game?.slug ?? "").toString()
  const baseLikes: number = (game?.likesAll?.total ?? 0)
  // Render baseLikes during SSR/first paint to match server HTML, then update on client
  const [likes, setLikes] = React.useState<number>(baseLikes)
  React.useEffect(() => {
    setLikes(getDisplayLikes(baseLikes, slug))
    const onLikes = () => setLikes(getDisplayLikes(baseLikes, slug))
    window.addEventListener("likes:changed" as any, onLikes)
    return () => window.removeEventListener("likes:changed" as any, onLikes)
  }, [baseLikes, slug])
  const ageGuidance: string = (game?.ageGuidance ?? "everyone").toString()
  const age = ageGuidance === "teen" ? "Teen" : ageGuidance === "mature" ? "Mature" : "E"
  const cover = game?.cover || "/logo.svg"
  const tags: string[] = visibleTags(game)
  const shown = tags.slice(0, 3)
  const remaining = Math.max(0, tags.length - shown.length)

  return (
    <Link href={`/game/${slug}`} className="block">
      <Card className="overflow-hidden cursor-pointer">
        <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
          <Image src={cover} alt="cover" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
        </div>
        <div className="p-4 space-y-1">
          <CardTitle className="line-clamp-1">{sanitizeForDisplay(game.title || "")}</CardTitle>
          <CardDescription className="line-clamp-1">{sanitizeForDisplay(game.description || "")}</CardDescription>
          {(shown.length > 0 || remaining > 0) && (
            <div className="mt-1 flex flex-wrap gap-1">
              {shown.map((t, i) => (
                <span key={`${t}-${i}`} className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] capitalize text-neutral-700">
                  {t.replace(/-/g, " ")}
                </span>
              ))}
              {remaining > 0 && (
                <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] text-neutral-700">+{remaining}</span>
              )}
            </div>
          )}
          <GameStats age={age as any} likes={likes} isLocal={game.origin === "local"} />
        </div>
      </Card>
    </Link>
  )
}
