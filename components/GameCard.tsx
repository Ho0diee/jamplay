"use client"
import * as React from "react"
import Image from "next/image"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { sanitizeForDisplay } from "@/lib/sanitize"
import GameStats from "@/components/GameStats"
import { getDisplayLikes } from "@/lib/likes"

export default function GameCard({ game, onClick }: { game: any; onClick?: () => void }) {
  const slug: string = (game?.slug ?? "").toString()
  const baseLikes: number | undefined = (game?.likesAll?.total ?? 0)
  const likes = typeof window === "undefined" ? (baseLikes ?? 0) : getDisplayLikes(baseLikes, slug)
  const ageGuidance: string = (game?.ageGuidance ?? "everyone").toString()
  const age = ageGuidance === "teen" ? "Teen" : ageGuidance === "mature" ? "Mature" : "E"
  const cover = game?.cover || "/logo.svg"

  return (
    <Card className="overflow-hidden cursor-pointer" onClick={onClick} role={onClick ? "button" : undefined}>
      <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
        <Image src={cover} alt="cover" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
      </div>
      <div className="p-4 space-y-1">
        <CardTitle className="line-clamp-1">{sanitizeForDisplay(game.title || "")}</CardTitle>
        <CardDescription className="line-clamp-1">{sanitizeForDisplay(game.description || "")}</CardDescription>
        <GameStats age={age as any} likes={likes} isLocal={game.origin === "local"} />
      </div>
    </Card>
  )
}
