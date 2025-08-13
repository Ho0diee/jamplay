"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type LocalGame = {
  slug?: string;
  title: string;
  description?: string;
  tags?: string[];
  category?: string;
  cover?: string;
  publishedAt: string;
  updatedAt: string;
  plays48h: number;
  likes7d: { up: number; total: number };
  likesAll: { up: number; total: number };
  editorsPick?: boolean;
  origin?: "local" | "demo";
};

function readMyGames(): LocalGame[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("myGames");
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? (arr as LocalGame[]) : [];
  } catch {
    return [];
  }
}

function readDraft(): any | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("createDraft");
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (obj && typeof obj === "object") return obj;
    return null;
  } catch {
    return null;
  }
}

export default function ProfilePanel() {
  const [games, setGames] = React.useState<LocalGame[]>([]);
  const [draft, setDraft] = React.useState<any | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    setGames(readMyGames());
    setDraft(readDraft());
  }, []);

  const publishedCount = games.length;
  const draftsCount = draft ? 1 : 0;

  const refresh = React.useCallback(() => {
    setGames(readMyGames());
    setDraft(readDraft());
  }, []);

  const onDelete = (slug: string) => {
    if (typeof window === "undefined") return;
    if (!confirm("Delete this game? This cannot be undone.")) return;
    try {
      const raw = localStorage.getItem("myGames");
      const arr = raw ? (JSON.parse(raw) as any[]) : [];
      const next = (Array.isArray(arr) ? arr : []).filter((g) => (g?.slug || "").toLowerCase() !== slug.toLowerCase());
      localStorage.setItem("myGames", JSON.stringify(next));
      refresh();
    } catch {}
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Demo Creator</h3>
            <p className="text-sm text-muted-foreground">Your profile (local)</p>
          </div>
          <Badge variant="secondary">Public</Badge>
        </div>
        <div className="flex gap-6 text-sm">
          <div>
            <div className="font-medium">{publishedCount}</div>
            <div className="text-muted-foreground">Published</div>
          </div>
          <div>
            <div className="font-medium">{draftsCount}</div>
            <div className="text-muted-foreground">Drafts</div>
          </div>
        </div>
      </Card>

      {games.length > 0 && (
        <Card className="p-4">
          <h4 className="text-sm font-semibold mb-2">Your games</h4>
          <ul className="space-y-2">
            {games.map((g) => {
              const slug = (g.slug || g.title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
              return (
                <li key={`${slug}`} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/game/${slug}`} className="text-sm hover:underline truncate">
                      {g.title || slug}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">local</Badge>
                    <button className="text-xs underline" onClick={() => router.push(`/create?edit=${slug}`)}>Edit</button>
                    <button className="text-xs text-red-600 underline" onClick={() => onDelete(slug)}>Delete</button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {draft && (
        <Card className="p-4">
          <h4 className="text-sm font-semibold mb-2">Drafts</h4>
          <div className="text-sm flex items-center justify-between">
            <div>
              <div>{draft.title || "Untitled draft"}</div>
              <div className="text-muted-foreground">Not published</div>
            </div>
            <Link href="/create" className="text-sm hover:underline">Edit</Link>
          </div>
        </Card>
      )}

      <Card className="p-4 space-y-2">
        <h4 className="text-sm font-semibold">Before you publish</h4>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li>Title set and descriptive</li>
          <li>Slug is clean and unique</li>
          <li>Cover image chosen</li>
          <li>Rights and policies confirmed</li>
        </ul>
      </Card>
    </div>
  );
}
