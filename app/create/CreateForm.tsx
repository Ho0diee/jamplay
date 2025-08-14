"use client";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import WizardShell from "./_components/WizardShell";
import StepBasics from "./_components/StepBasics";
import StepMedia from "./_components/StepMedia";
import StepGameplay from "./_components/StepGameplay";
import StepBuild from "./_components/StepBuild";
import StepCommunity from "./_components/StepCommunity";
import StepSafety from "./_components/StepSafety";
import StepReview from "./_components/StepReview";
import { BasicsSchema, MediaSchema, GameplaySchema, BuildSchema, SafetySchema, type CreateDraft } from "@/lib/create-schema";
import { slugify } from "@/lib/slug";
import { createGameAction } from "./actions";

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
    thumb: undefined,
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

  const patch = (p: Partial<CreateDraft>) => setDraft((d) => ({ ...d, ...p }));

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
      setDraft((d) => ({ ...d, ...next }));
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
    thumb: draft.thumb,
    gallery: draft.gallery,
    trailerUrl: draft.trailerUrl || undefined,
  }), [draft.cover, draft.thumb, draft.gallery, draft.trailerUrl]);

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

  const onTryContinue = () => setAttempted((prev) => new Set(prev).add(step));

  async function onPublish() {
    // validate required steps
    const req = [basicsRes, mediaRes, gameplayRes, buildRes, safetyRes];
    for (let i = 0; i < req.length; i++) {
      if (!req[i].success) { setAttempted((p) => new Set(p).add(i)); setStep(i); return; }
    }
    const res = await createGameAction({ title: (draft.title || "").trim(), description: (draft.description || "").trim() });
    if (!res.ok) { setAttempted((p) => new Set(p).add(6)); return; }
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

  return (
    <WizardShell step={step} setStep={setStep} canContinue={canContinue} onTryContinue={onTryContinue}>
      {step === 0 && (
        <StepBasics value={draft} onChange={patch} errors={basicsErrors as any} />
      )}
      {step === 1 && (
        <StepMedia value={draft as any} onChange={patch as any} errors={mediaErrors as any} />
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
