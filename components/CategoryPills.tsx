"use client"
import { Button } from "@/components/ui/button"

export function CategoryPills({ categories, selected, onSelect }: { categories: string[]; selected?: string; onSelect: (slug: string|null)=>void }) {
  const sel = (selected ?? "").toLowerCase()
  return (
    <div className="-mx-2 flex gap-2 overflow-x-auto pb-2">
      <Button
        variant={sel ? "outline" : "default"}
        size="sm"
        className="shrink-0 rounded-full"
        onClick={() => onSelect(null)}
      >
        All
      </Button>
      {categories.map((c)=>{
        const isSel = sel === c
        return (
          <Button
            key={c}
            variant={isSel ? "default" : "outline"}
            size="sm"
            className="shrink-0 rounded-full capitalize"
            onClick={() => onSelect(c)}
          >
            {c.replace(/-/g, " ")}
          </Button>
        )
      })}
    </div>
  )
}
