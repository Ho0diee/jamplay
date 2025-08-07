import { createUploadthing, type FileRouter } from "uploadthing/next"
import { createRouteHandler } from "uploadthing/next"
import { auth } from "@supabase/auth-helpers-nextjs"
import { NextRequest } from "next/server"

const f = createUploadthing()

export const ourFileRouter = {
  gameZip: f({ "application/zip": { maxFileSize: "256MB" } })
    .middleware(async ({ req }) => {
      // Basic auth gate – if needed, validate via Supabase session cookie
      return { userId: "anon" }
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url }
    }),
  imageThumb: f({ image: { maxFileSize: "8MB" } })
    .middleware(async () => ({ userId: "anon" }))
    .onUploadComplete(async ({ file }) => ({ url: file.url })),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
export const { GET, POST } = createRouteHandler({ router: ourFileRouter })
