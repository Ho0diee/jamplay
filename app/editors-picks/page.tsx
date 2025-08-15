import { getCatalog } from "@/lib/catalog"
import GameCard from "@/components/GameCard"

export default function EditorsPicksPage() {
  const items = getCatalog().filter((g: any) => g.editorsPick)
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Editor’s Picks</h1>
        <p className="text-neutral-600 text-sm">Handpicked games to try first.</p>
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
