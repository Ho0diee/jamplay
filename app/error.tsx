"use client"

import Link from "next/link"

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body>
        <div className="mx-auto max-w-xl py-16 text-center">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="mt-2 text-sm text-neutral-600">{error?.message || "An unexpected error occurred."}</p>
          {error?.digest && <p className="mt-1 text-xs text-neutral-500">Ref: {error.digest}</p>}
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={reset} className="rounded bg-black px-4 py-2 text-white">Try again</button>
            <Link href="/" className="rounded border px-4 py-2">Go to Discover</Link>
          </div>
        </div>
      </body>
    </html>
  )
}
