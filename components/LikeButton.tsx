"use client"
import * as React from "react"
import { addLike, getLocalLikes } from "@/lib/likes"

export default function LikeButton({ slug, baseLikes = 0 }: { slug: string; baseLikes?: number }) {
  const [localCount, setLocalCount] = React.useState<number>(0)
  React.useEffect(() => {
    setLocalCount(getLocalLikes(slug))
  }, [slug])

  const total = baseLikes + localCount

  return (
    <button
      className="inline-flex items-center gap-2 rounded border border-neutral-300 bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-neutral-50"
      onClick={() => setLocalCount(addLike(slug, 1))}
      aria-label="Like game"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.74 0 3.41 1.01 4.13 2.44C11.09 5.01 12.76 4 14.5 4 17 4 19 6 19 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
      Like ({total})
    </button>
  )
}
