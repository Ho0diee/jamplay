function titleCaseFromSlug(slug: string) {
  return slug
    .split("-")
    .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : s))
    .join(" ")
}

export default async function GamePage({ params }: { params: { slug: string } }) {
  const title = titleCaseFromSlug(params.slug)
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-neutral-600">Coming soon. This game page will be playable once published.</p>
      </div>
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
