import { getCatalog } from "@/lib/catalog"
import GameCard from "@/components/GameCard"

function byPublishedDesc(a: any, b: any) {
  const pa = Date.parse(a?.publishedAt ?? 0)
  const pb = Date.parse(b?.publishedAt ?? 0)
  return pb - pa
}

export default function NewAndRisingPage() {
  const all = getCatalog()
  const now = Date.now()
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000
  const recent = all.filter((g: any) => {
    const t = Date.parse(g?.publishedAt ?? 0)
    return Number.isFinite(t) && now - t <= fourteenDaysMs
  })
  const items = (recent.length > 0 ? recent : all).slice().sort(byPublishedDesc)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New & Rising</h1>
        <p className="text-neutral-600 text-sm">Fresh games published in the last two weeks.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((g: any) => (
          <div key={(g?.slug ?? g?.id ?? g?.title) as string}>
            <GameCard game={g} />
          </div>
        ))}
      </div>
    </div>
  )
}
