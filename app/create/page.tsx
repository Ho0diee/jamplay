import { supabaseServer } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { PromptEditor } from "@/components/editor/PromptEditor"
import { Button } from "@/components/ui/button"
import { createGame } from "@/app/server-actions"

const starter = {
  meta: { title: "New Game", ageRating: "E", tags: ["starter"] },
  inputs: [],
  flow: [ { id: "start", type: "scene", prompt: "Welcome to JamPlay!", maxOutTokens: 24 } ],
  model: { name: "stub-model", temperature: 0.7 },
  budget: { maxCallsTotal: 4, maxTokensTotal: 800 }
}

export default async function CreatePage() {
  const sb = supabaseServer()
  const { data: { session } } = await sb.auth.getSession()
  if (!session) redirect("/auth")

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Creator Dashboard</h1>
      <PromptEditor initial={starter}/>
      <div className="flex gap-3">
        <form action={createGame}>
          <input type="hidden" name="title" value="Untitled Game"/>
          <input type="hidden" name="summary" value="A new prompt game."/>
          <input type="hidden" name="age_rating" value="E"/>
          <input type="hidden" name="tags" value='["starter"]'/>
          <Button type="submit">Create Game</Button>
        </form>
      </div>
    </div>
  )
}
