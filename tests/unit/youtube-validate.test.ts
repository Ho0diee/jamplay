import { describe, it, expect } from "vitest";
import { isYouTubeUrl } from "@/lib/youtube";

describe("isYouTubeUrl", () => {
  it("accepts watch?v format", () => {
    expect(isYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(true);
  });
  it("accepts youtu.be format", () => {
    expect(isYouTubeUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(true);
  });
  it("rejects non-youtube", () => {
    expect(isYouTubeUrl("https://example.com/video")).toBe(false);
  });
});
