export function isYouTubeUrl(u: string): boolean {
  if (!u) return false;
  try {
    const url = new URL(u);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtube.com") {
      return url.pathname === "/watch" && url.searchParams.has("v");
    }
    if (host === "youtu.be") {
      const id = url.pathname.slice(1);
      return !!id;
    }
    return false;
  } catch {
    return false;
  }
}
