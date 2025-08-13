export type Game = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  cover: string;
  plays48h: number;
  likes7d: { up: number; total: number };
  likesAll: { up: number; total: number };
  publishedAt: string;
  updatedAt: string;
  editorsPick?: boolean;
};

const now = Date.now();

export const games: Game[] = [
  {
    id: "g1",
    title: "Starfall Racing",
    description: "Drift through nebulas in a fast, friendly space racer.",
    tags: ["racing", "space", "casual"],
    cover: "/logo.svg",
    plays48h: 1240,
    likes7d: { up: 380, total: 450 },
    likesAll: { up: 2100, total: 2600 },
    publishedAt: new Date(now - 20 * 24 * 36e5).toISOString(),
    updatedAt: new Date(now - 3 * 36e5).toISOString(),
    editorsPick: true,
  },
  {
    id: "g2",
    title: "Mystery Manor Mini",
    description: "Short-session whodunit puzzles with cozy vibes.",
    tags: ["puzzle", "mystery"],
    cover: "/logo.svg",
    plays48h: 860,
    likes7d: { up: 220, total: 270 },
    likesAll: { up: 900, total: 1100 },
    publishedAt: new Date(now - 5 * 24 * 36e5).toISOString(),
    updatedAt: new Date(now - 10 * 36e5).toISOString(),
    editorsPick: false,
  },
  {
    id: "g3",
    title: "City Lights Stories",
    description: "Micro narrative adventures from a neon downtown.",
    tags: ["narrative", "story"],
    cover: "/logo.svg",
    plays48h: 540,
    likes7d: { up: 180, total: 220 },
    likesAll: { up: 1400, total: 1800 },
    publishedAt: new Date(now - 2 * 24 * 36e5).toISOString(),
    updatedAt: new Date(now - 4 * 36e5).toISOString(),
    editorsPick: true,
  },
  {
    id: "g4",
    title: "Forest Song",
    description: "Guide spirits with rhythm-based puzzles.",
    tags: ["music", "puzzle"],
    cover: "/logo.svg",
    plays48h: 300,
    likes7d: { up: 160, total: 210 },
    likesAll: { up: 2500, total: 3000 },
    publishedAt: new Date(now - 40 * 24 * 36e5).toISOString(),
    updatedAt: new Date(now - 30 * 36e5).toISOString(),
  },
  {
    id: "g5",
    title: "Codebreakers Arena",
    description: "Crack ciphers and outsmart rivals in quick rounds.",
    tags: ["strategy", "logic"],
    cover: "/logo.svg",
    plays48h: 980,
    likes7d: { up: 300, total: 400 },
    likesAll: { up: 1200, total: 1500 },
    publishedAt: new Date(now - 12 * 24 * 36e5).toISOString(),
    updatedAt: new Date(now - 1 * 36e5).toISOString(),
    editorsPick: false,
  },
  {
    id: "g6",
    title: "Island Sketches",
    description: "Sail a friendly archipelago and collect moments.",
    tags: ["casual", "adventure"],
    cover: "/logo.svg",
    plays48h: 420,
    likes7d: { up: 150, total: 190 },
    likesAll: { up: 900, total: 1200 },
    publishedAt: new Date(now - 8 * 24 * 36e5).toISOString(),
    updatedAt: new Date(now - 7 * 36e5).toISOString(),
    editorsPick: true,
  },
  {
    id: "g7",
    title: "Dungeon Draw",
    description: "Sketch spells to solve tactical puzzles.",
    tags: ["puzzle", "strategy"],
    cover: "/logo.svg",
    plays48h: 610,
    likes7d: { up: 210, total: 260 },
    likesAll: { up: 1600, total: 2000 },
    publishedAt: new Date(now - 15 * 24 * 36e5).toISOString(),
    updatedAt: new Date(now - 2 * 36e5).toISOString(),
  },
  {
    id: "g8",
    title: "Nebula Notes",
    description: "Compose melodies in a zero-g studio.",
    tags: ["music", "creative"],
    cover: "/logo.svg",
    plays48h: 275,
    likes7d: { up: 120, total: 150 },
    likesAll: { up: 700, total: 900 },
    publishedAt: new Date(now - 1 * 24 * 36e5).toISOString(),
    updatedAt: new Date(now - 1 * 36e5).toISOString(),
    editorsPick: false,
  },
];
