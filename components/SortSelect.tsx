"use client"
import * as React from "react"
import { Select, SelectItem } from "@/components/ui/select"

export type SortValue = "trending" | "new" | "updated" | "editors"

export default function SortSelect({ value, onChange }: { value: SortValue; onChange: (v: SortValue)=>void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-neutral-600">Sort</span>
      <Select value={value} onValueChange={(v)=> onChange(v as SortValue)}>
        <SelectItem value="trending">Trending</SelectItem>
        <SelectItem value="new">New</SelectItem>
        <SelectItem value="updated">Recently Updated</SelectItem>
        <SelectItem value="editors">Editor’s Picks</SelectItem>
      </Select>
    </div>
  )
}
