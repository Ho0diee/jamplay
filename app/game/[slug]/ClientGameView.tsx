"use client"
import * as React from "react"
import { sanitizeForDisplay } from "@/lib/sanitize"
import LikeButton from "@/components/LikeButton"
import { getCatalog } from "@/lib/catalog"
import { getLocalLikes } from "@/lib/likes"
import { visibleTags } from "@/lib/catalog"

function titleCaseFromSlug(slug: string) {
  return slug
    .split("-")
    .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : s))
    .join(" ")
}

export default function ClientGameView({ slug }: { slug: string }) {
  const [game, setGame] = React.useState<any | null>(null)
  const [baseLikes, setBaseLikes] = React.useState<number>(0)

  React.useEffect(() => {
    const list = getCatalog() as any[]
    const found = list.find((g) => (g?.slug ?? "").toString().toLowerCase() === slug.toLowerCase())
    setGame(found ?? null)
    setBaseLikes((found?.likesAll?.total ?? 0) as number)
    const onLikes = () => setBaseLikes((found?.likesAll?.total ?? 0) as number)
    window.addEventListener("likes:changed" as any, onLikes)
    return () => window.removeEventListener("likes:changed" as any, onLikes)
  }, [slug])

  const title = game?.title ? (game.title as string) : titleCaseFromSlug(slug)
  const totalLikes = (game?.likesAll?.total ?? 0) + (typeof window === "undefined" ? 0 : getLocalLikes(slug))
  const tags = visibleTags(game)
  const shown = tags.slice(0, 3)
  const remaining = Math.max(0, tags.length - shown.length)

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{sanitizeForDisplay(title)}</h1>
          <p className="text-neutral-600">{sanitizeForDisplay(game?.description ?? "Coming soon. This game page will be playable once published.")}</p>
          {(shown.length > 0 || remaining > 0) && (
            <div className="mt-2 flex flex-wrap gap-1">
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
        </div>
        <LikeButton slug={slug} baseLikes={baseLikes} />
      </div>
      <div className="text-sm text-neutral-600">Total likes: {totalLikes}</div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-neutral-600">Placeholder cover</div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-neutral-600">Details and versions will appear here.</div>
        </div>
      </div>
    </div>
  )
}
