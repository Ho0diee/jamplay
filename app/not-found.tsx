import Link from "next/link"

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="mt-2 text-neutral-600">We couldn’t find what you’re looking for.</p>
      <div className="mt-6">
        <Link href="/" className="inline-block rounded bg-black px-4 py-2 text-white">Go to Discover</Link>
      </div>
    </div>
  )
}
