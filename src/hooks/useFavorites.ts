import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  readFavoriteSlugs,
  toggleFavoriteSlug,
  writeFavoriteSlugs,
} from "../lib/favorites";

const STORAGE_KEY = "spokane-contractors-favorites-v1";

let cachedSlugs: string[] = [];
let cachedKey = "";

function getSnapshot(): string[] {
  const next = readFavoriteSlugs();
  const key = next.join("\0");
  if (key === cachedKey) return cachedSlugs;
  cachedSlugs = next;
  cachedKey = key;
  return cachedSlugs;
}

function getServerSnapshot(): string[] {
  return cachedSlugs.length === 0 ? cachedSlugs : [];
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  const onCustom = () => onStoreChange();
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onStoreChange();
  };

  window.addEventListener("spokane-favorites-changed", onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("spokane-favorites-changed", onCustom);
    window.removeEventListener("storage", onStorage);
  };
}

export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const isFavorite = useCallback(
    (slug: string) => favorites.includes(slug),
    [favorites],
  );

  const toggleFavorite = useCallback((slug: string) => {
    return toggleFavoriteSlug(slug);
  }, []);

  const clearFavorites = useCallback(() => {
    writeFavoriteSlugs([]);
  }, []);

  return {
    favorites,
    favoriteCount: favorites.length,
    isFavorite,
    toggleFavorite,
    clearFavorites,
    ready,
  };
}
