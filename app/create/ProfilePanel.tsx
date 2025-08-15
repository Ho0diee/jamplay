"use client";
import * as React from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type GameLite = { slug: string; title: string; publishedAt?: string; updatedAt?: string; visibility?: string };

export default function ProfilePanel() {
  const router = useRouter();
  const [published, setPublished] = React.useState<GameLite[]>([]);
  const [drafts, setDrafts] = React.useState<GameLite[]>([]);
  const [lastUpdated, setLastUpdated] = React.useState<string | null>(null);

  const refresh = React.useCallback(() => {
    try {
      const raw = localStorage.getItem("myGames");
      const arr = raw ? (JSON.parse(raw) as any[]) : [];
      const pub: GameLite[] = [];
      const dr: GameLite[] = [];
      for (const g of Array.isArray(arr) ? arr : []) {
        const lite: GameLite = { slug: g.slug, title: g.title, publishedAt: g.publishedAt, updatedAt: g.updatedAt, visibility: g.visibility };
        if (g.visibility === "public" || g.publishedAt) pub.push(lite); else dr.push(lite);
      }
      setPublished(pub);
      setDrafts(dr);
    } catch {}
    try {
      const d = localStorage.getItem("createDraft");
      if (d) setLastUpdated(new Date().toLocaleString());
    } catch {}
  }, [])

  React.useEffect(() => {
    refresh()
    const onCatalog = () => refresh()
    const onStorage = (e: StorageEvent) => {
      if (!e || e.key === null || e.key === "myGames" || e.key === "createDraft") refresh()
    }
    window.addEventListener("catalog:changed" as any, onCatalog)
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener("catalog:changed" as any, onCatalog)
      window.removeEventListener("storage", onStorage)
    }
  }, [refresh])

  const del = (slug: string) => {
    if (!confirm("Delete this entry?")) return;
    try {
      const raw = localStorage.getItem("myGames");
      const arr = raw ? (JSON.parse(raw) as any[]) : [];
      const next = (Array.isArray(arr) ? arr : []).filter((g) => (g?.slug || "") !== slug);
      localStorage.setItem("myGames", JSON.stringify(next));
  setPublished((l: GameLite[]) => l.filter((g: GameLite) => g.slug !== slug));
  setDrafts((l: GameLite[]) => l.filter((g: GameLite) => g.slug !== slug));
  try { window.dispatchEvent(new CustomEvent("catalog:changed", { detail: { slug } })) } catch {}
    } catch {}
  };

  return (
    <div className="sticky top-4">
      <Card className="p-4">
        <div className="mb-2">
          <div className="text-sm text-neutral-600">Profile</div>
          <div className="text-lg font-semibold">Demo Creator</div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div><div className="text-xl font-bold">{published.length}</div><div className="text-neutral-500">Published</div></div>
          <div><div className="text-xl font-bold">{drafts.length}</div><div className="text-neutral-500">Drafts</div></div>
          <div><div className="text-xl font-bold">{lastUpdated ? "Now" : "—"}</div><div className="text-neutral-500">Last updated</div></div>
        </div>
      </Card>

      <div className="mt-4 space-y-4">
        <Card className="p-4">
          <CardTitle className="text-base">Before you publish</CardTitle>
          <CardDescription>Quick checklist</CardDescription>
          <ul className="mt-2 list-disc pl-5 text-sm">
            <li>Title OK</li>
            <li>Description length OK</li>
            <li>Cover uploaded</li>
            <li>Rights confirmed</li>
          </ul>
        </Card>

        <Card className="p-4">
          <CardTitle className="text-base">Your games</CardTitle>
          <CardDescription>Published</CardDescription>
          <div className="mt-2 space-y-2">
            {published.length === 0 && <div className="text-sm text-neutral-500">No published games yet.</div>}
            {published.map((g) => (
              <div key={g.slug} className="flex items-center justify-between gap-2 text-sm">
                <div className="truncate"><span className="font-medium">{g.title}</span> <span className="text-neutral-500">/game/{g.slug}</span></div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={()=>router.push(`/game/${g.slug}`)}>View</Button>
                  <Button size="sm" variant="outline" onClick={()=>router.push(`/create?edit=${g.slug}`)}>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={()=>del(g.slug)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <CardDescription>Drafts</CardDescription>
          <div className="mt-2 space-y-2">
            {drafts.length === 0 && <div className="text-sm text-neutral-500">No drafts yet.</div>}
            {drafts.map((g) => (
              <div key={g.slug} className="flex items-center justify-between gap-2 text-sm">
                <div className="truncate"><span className="font-medium">{g.title}</span> <span className="text-neutral-500">/game/{g.slug}</span></div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={()=>router.push(`/create?edit=${g.slug}`)}>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={()=>del(g.slug)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
