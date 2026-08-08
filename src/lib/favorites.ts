const STORAGE_KEY = "spokane-contractors-favorites-v1";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function readFavoriteSlugs(): string[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return [
      ...new Set(
        parsed.filter((value): value is string => typeof value === "string" && value.trim().length > 0),
      ),
    ];
  } catch {
    return [];
  }
}

export function writeFavoriteSlugs(slugs: string[]): void {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(slugs)]));
    window.dispatchEvent(new CustomEvent("spokane-favorites-changed"));
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function isFavoriteSlug(slug: string, slugs: string[] = readFavoriteSlugs()): boolean {
  return slugs.includes(slug);
}

export function toggleFavoriteSlug(slug: string): string[] {
  const current = readFavoriteSlugs();
  const next = current.includes(slug)
    ? current.filter((value) => value !== slug)
    : [...current, slug];
  writeFavoriteSlugs(next);
  return next;
}
