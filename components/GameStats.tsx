"use client"
import * as React from "react"

export default function GameStats({ age, likes, isLocal }: { age: "E" | "Teen" | "Mature"; likes: number; isLocal?: boolean }) {
  return (
    <div className="mt-2 flex items-center gap-2 text-xs text-neutral-600">
      <span className="inline-flex items-center gap-1 rounded bg-neutral-100 px-1.5 py-0.5">{age}</span>
      <span className="inline-flex items-center gap-1">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.74 0 3.41 1.01 4.13 2.44C11.09 5.01 12.76 4 14.5 4 17 4 19 6 19 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
  <span suppressHydrationWarning>{likes}</span>
      </span>
      {isLocal ? <span className="ml-auto rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">Your game</span> : null}
    </div>
  )
}
