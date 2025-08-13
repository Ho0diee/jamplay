"use server";

// Public demo: short-circuit any server action; client handles publishing to localStorage
export async function createGameAction(_prevState: any, _formData: FormData) {
  return { ok: true } as const;
}
