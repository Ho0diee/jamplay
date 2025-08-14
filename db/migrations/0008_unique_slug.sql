-- Ensure slug is always unique
create unique index if not exists games_slug_unique on public.games (slug);
