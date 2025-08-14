"use client";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import WizardShell from "./_components/WizardShell";
import StepBasics from "./_components/StepBasics";
// We'll inline Media UI logic here to support files-only gallery and cover-only crop
// Keep other steps as components
import StepGameplay from "./_components/StepGameplay";
import StepBuild from "./_components/StepBuild";
import StepCommunity from "./_components/StepCommunity";
import StepSafety from "./_components/StepSafety";
import StepReview from "./_components/StepReview";
import { BasicsSchema, MediaSchema, GameplaySchema, BuildSchema, SafetySchema, type CreateDraft } from "@/lib/create-schema";
import { slugify } from "@/lib/slug";
import { createGameAction } from "./actions";
import { BANNED_TITLE, BANNED_TAGS, checkBanned } from "@/lib/banlist";
import { CATEGORY_SUGGESTIONS, normalizeTag, dedupeTags } from "@/lib/tags";
import ImageCropper from "./_components/ImageCropper";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";

export default function CreateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const originalSlugRef = React.useRef<string | null>(null);
  const [step, setStep] = React.useState(0); // 0..6
  const [attempted, setAttempted] = React.useState<Set<number>>(() => new Set());
  const [draft, setDraft] = React.useState<CreateDraft>({
    title: "",
    category: "",
    tags: [],
    cover: undefined,
    gallery: [],
    trailerUrl: "",
    description: "",
    controls: "",
    sessionLength: "",
    launchType: undefined,
    playUrlOrTemplateId: "",
    version: "1",
    changelog: "",
    links: undefined,
    rightsConfirmed: false,
    policyConfirmed: false,
    ageGuidance: undefined,
    visibility: "draft",
    slug: "",
  } as any);
  // Media step local state for files-only workflow
  const [coverFile, setCoverFile] = React.useState<File | null>(null);
  const [galleryQueue, setGalleryQueue] = React.useState<File[]>([]);
  const [galleryWorking, setGalleryWorking] = React.useState<File | null>(null);
  const [pendingGallery, setPendingGallery] = React.useState<string | null>(null);

  const patch = (p: Partial<CreateDraft>) => setDraft((d: CreateDraft) => ({ ...d, ...p }));

  // Edit mode from local storage
  React.useEffect(() => {
    const edit = searchParams.get("edit");
    if (!edit || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("myGames");
      if (!raw) return;
      const arr = JSON.parse(raw) as any[];
      const item = (arr || []).find((g) => (g?.slug || "").toLowerCase() === edit.toLowerCase());
      if (!item) return;
      const next: Partial<CreateDraft> = {
        title: item.title || "",
        category: item.category || "",
        tags: Array.isArray(item.tags) ? item.tags : [],
        cover: item.cover || undefined,
        thumb: item.thumb || undefined,
        gallery: Array.isArray(item.gallery) ? item.gallery : [],
        trailerUrl: item.trailer || "",
        description: item.description || "",
        controls: item.controls || "",
        sessionLength: typeof item.sessionLength === "string"
          ? item.sessionLength
          : item.sessionLength?.type === "single"
          ? String(item.sessionLength.minutes)
          : item.sessionLength?.type === "range"
          ? `${item.sessionLength.min}-${item.sessionLength.max}`
          : "",
        launchType: item.launchType || undefined,
        playUrlOrTemplateId: item.playUrlOrTemplateId || "",
        rightsConfirmed: !!item.rightsConfirmed,
        policyConfirmed: !!item.policyConfirmed,
        ageGuidance: item.ageGuidance || undefined,
        visibility: item.visibility || "draft",
      } as any;
  setDraft((d: CreateDraft) => ({ ...d, ...next }));
      originalSlugRef.current = item.slug || null;
    } catch {}
  }, [searchParams]);

  // Validation helpers
  const basicsRes = React.useMemo(() => BasicsSchema.safeParse({
    title: draft.title,
    category: draft.category,
    tags: draft.tags,
    slug: slugify(draft.title || ""),
  }), [draft.title, draft.category, draft.tags]);

  const mediaRes = React.useMemo(() => MediaSchema.safeParse({
    cover: draft.cover,
    gallery: draft.gallery,
    trailerUrl: draft.trailerUrl || undefined,
  }), [draft.cover, draft.gallery, draft.trailerUrl]);

  const gameplayRes = React.useMemo(() => GameplaySchema.safeParse({
    description: draft.description,
    sessionLength: draft.sessionLength,
  }), [draft.description, draft.sessionLength]);

  const buildRes = React.useMemo(() => BuildSchema.safeParse({
    launchType: draft.launchType,
    playUrlOrTemplateId: draft.playUrlOrTemplateId,
    version: draft.version || "1",
  }), [draft.launchType, draft.playUrlOrTemplateId, draft.version]);

  const safetyRes = React.useMemo(() => SafetySchema.safeParse({
    rightsConfirmed: !!draft.rightsConfirmed,
    policyConfirmed: !!draft.policyConfirmed,
    ageGuidance: draft.ageGuidance,
  }), [draft.rightsConfirmed, draft.policyConfirmed, draft.ageGuidance]);

  const canContinue = step === 0 ? basicsRes.success
    : step === 1 ? mediaRes.success
    : step === 2 ? gameplayRes.success
    : step === 3 ? buildRes.success
    : step === 5 ? safetyRes.success
    : true;

  const onTryContinue = () => setAttempted((prev: Set<number>) => new Set(prev).add(step));

  async function onPublish() {
    // validate required steps
    const req = [basicsRes, mediaRes, gameplayRes, buildRes, safetyRes];
    for (let i = 0; i < req.length; i++) {
  if (!req[i].success) { setAttempted((p: Set<number>) => new Set(p).add(i)); setStep(i); return; }
    }
    const res = await createGameAction({ title: (draft.title || "").trim(), description: (draft.description || "").trim() });
  if (!res.ok) { setAttempted((p: Set<number>) => new Set(p).add(6)); return; }
    const slug = res.slug;
    const nowIso = new Date().toISOString();
    const game: any = {
      slug,
      title: (draft.title || "").trim(),
      description: (draft.description || "").trim(),
      tags: draft.tags,
      category: draft.category || undefined,
      cover: draft.cover || "/logo.svg",
      thumb: draft.thumb || "/logo.svg",
      gallery: draft.gallery,
      trailer: draft.trailerUrl || undefined,
      publishedAt: nowIso,
      updatedAt: nowIso,
      plays48h: 0,
      likes7d: { up: 0, total: 0 },
      likesAll: { up: 0, total: 0 },
      editorsPick: false,
      version: 1,
      origin: "local" as const,
    };
    try {
      const raw = localStorage.getItem("myGames");
      const arr = raw ? (JSON.parse(raw) as any[]) : [];
      const bySlug = new Map<string, any>();
      for (const g of Array.isArray(arr) ? arr : []) {
        const gs = (g?.slug || "").toString().toLowerCase();
        if (gs) bySlug.set(gs, g);
      }
      const original = originalSlugRef.current?.toLowerCase() || null;
      if (original && original !== slug.toLowerCase()) bySlug.delete(original);
      bySlug.set(slug.toLowerCase(), game);
      localStorage.setItem("myGames", JSON.stringify(Array.from(bySlug.values())));
    } catch {}
    router.push(`/game/${slug}`);
  }

  function onSaveDraft() {
    try {
      localStorage.setItem("createDraft", JSON.stringify(draft));
    } catch {}
  }

  const basicsErrors = !attempted.has(0) || basicsRes.success ? undefined : basicsRes.error.flatten();
  const mediaErrors = !attempted.has(1) || mediaRes.success ? undefined : mediaRes.error.flatten();
  const gameplayErrors = !attempted.has(2) || gameplayRes.success ? undefined : gameplayRes.error.flatten();
  const buildErrors = !attempted.has(3) || buildRes.success ? undefined : buildRes.error.flatten();
  const safetyErrors = !attempted.has(5) || safetyRes.success ? undefined : safetyRes.error.flatten();

  const bannedTitle = checkBanned(draft.title || "", BANNED_TITLE);
  const bannedTags = (draft.tags ?? []).some((t: string) => !checkBanned(t, BANNED_TAGS).ok);
  const finalCanContinue = canContinue && !(step === 0 && (bannedTags || !bannedTitle.ok));

  return (
    <WizardShell step={step} setStep={setStep} canContinue={finalCanContinue} onTryContinue={onTryContinue}>
      {step === 0 && (
        <>
        {(step===0 && (!bannedTitle.ok || bannedTags)) && (
          <div className="rounded border border-amber-300 bg-amber-50 p-2 text-sm text-amber-800">Please fix mistakes: banned words detected.</div>
        )}
        <StepBasics value={draft} onChange={(p)=>{
          // immediate banned check for title and tags
          if (p.title !== undefined) {
            const { ok } = checkBanned(p.title, BANNED_TITLE)
            // store anyway; Continue button disabled via canContinue + additional gate below
          }
          if (p.tags) {
            const cleaned = dedupeTags(p.tags)
            patch({ ...p, tags: cleaned })
          } else {
            patch(p)
          }
        }} errors={basicsErrors as any} />
        {!!draft.category && CATEGORY_SUGGESTIONS[draft.category] && (
          <div className="-mt-4">
            <Card>
              <CardTitle className="px-4 pt-3 text-base">Suggested tags</CardTitle>
              <CardDescription className="px-4">Toggle to add or remove</CardDescription>
              <div className="flex flex-wrap gap-2 p-4">
                {CATEGORY_SUGGESTIONS[draft.category].map((t) => {
                  const slug = normalizeTag(t)
                  const active = (draft.tags ?? []).includes(slug)
                  return (
                    <button
                      key={slug}
                      className={"rounded-full border px-2 py-1 text-xs " + (active ? "bg-black text-white" : "hover:bg-neutral-50")}
                      onClick={() => {
                        const next = active ? (draft.tags ?? []).filter(x => x !== slug) : dedupeTags([...(draft.tags ?? []), slug])
                        patch({ tags: next })
                      }}
                      type="button"
                    >
                      {slug}
                    </button>
                  )
                })}
              </div>
            </Card>
          </div>
        )}
        </>
      )}
      {step === 1 && (
        <div className="space-y-6">
          {mediaErrors && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">Please fix the highlighted errors.</div>
          )}
          <Card>
            <CardTitle>Cover image</CardTitle>
            <CardDescription>16:9 crop at 1280×720. Preview is scaled down.</CardDescription>
            <div className="mt-3 space-y-3">
              <Input type="file" accept="image/*" onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const f = e.target.files?.[0] ?? null
                patch({})
                setCoverFile(f)
              }} />
              {coverFile && (
                <ImageCropper file={coverFile} preset={{ width: 1280, height: 720 }} previewWidth={480} onChange={(d)=>patch({ cover: d || undefined })} />
              )}
              {!coverFile && draft.cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.cover} alt="Cover preview" className="h-auto w-[480px] rounded border object-cover" />
              )}
            </div>
          </Card>

          <Card>
            <CardTitle>Gallery (up to 5)</CardTitle>
            <CardDescription>Each image must be cropped to 16:9 before adding.</CardDescription>
            <div className="mt-3 space-y-3">
              <Input type="file" accept="image/*" multiple onChange={(e: React.ChangeEvent<HTMLInputElement>)=>{
                const files = Array.from(e.target.files ?? [])
                if (!files.length) return
                // Take one at a time to crop
                setGalleryQueue(files)
                setGalleryWorking(files[0] || null)
              }} />
              {galleryWorking && (
                <div>
                  <ImageCropper file={galleryWorking} preset={{ width: 1280, height: 720 }} previewWidth={360} onChange={(data)=>setPendingGallery(data)} />
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" onClick={()=>{
                      if (pendingGallery) patch({ gallery: [...(draft.gallery ?? []), pendingGallery].slice(0,5) })
                      const rest = galleryQueue.slice(1)
                      setGalleryQueue(rest)
                      setGalleryWorking(rest[0] || null)
                      setPendingGallery(null)
                    }}>Add to gallery</Button>
                    <Button size="sm" variant="outline" onClick={()=>{
                      const rest = galleryQueue.slice(1)
                      setGalleryQueue(rest)
                      setGalleryWorking(rest[0] || null)
                      setPendingGallery(null)
                    }}>Skip</Button>
                  </div>
                </div>
              )}
              {!!(draft.gallery?.length) && (
                <div className="grid grid-cols-3 gap-2">
                  {draft.gallery!.map((g, i) => (
                    <div key={i} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={g} className="aspect-video w-full rounded border object-cover" />
                      <button className="absolute right-1 top-1 rounded bg-white/80 px-1 text-xs" onClick={()=>patch({ gallery: draft.gallery!.filter((_, idx)=>idx!==i) })}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
      {step === 2 && (
        <StepGameplay value={draft} onChange={patch} errors={gameplayErrors as any} />
      )}
      {step === 3 && (
        <StepBuild value={draft} onChange={patch} errors={buildErrors as any} />
      )}
      {step === 4 && (
        <StepCommunity value={draft} onChange={patch} />
      )}
      {step === 5 && (
        <StepSafety value={draft} onChange={patch} errors={safetyErrors as any} />
      )}
      {step === 6 && (
        <StepReview value={draft} onPublish={onPublish} onSaveDraft={onSaveDraft} onEditStep={setStep} />
      )}
    </WizardShell>
  );
}
