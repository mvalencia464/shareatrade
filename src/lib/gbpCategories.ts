import gbp from "../resources/gbp-categories.json";

export type GbpCategoryData = {
  popular: string[];
  all: string[];
};

const data = gbp as GbpCategoryData;

const popularSet = new Set(data.popular);

/** Official popular GBP names, in file order. */
export const POPULAR_GBP_CATEGORIES: string[] = data.popular;

/** Full official list minus names already in popular. */
export const OTHER_GBP_CATEGORIES: string[] = data.all.filter(
  (name) => !popularSet.has(name),
);

/** Popular first (file order), then remaining official names. */
export const GBP_CATEGORIES_POPULAR_FIRST: string[] = [
  ...POPULAR_GBP_CATEGORIES,
  ...OTHER_GBP_CATEGORIES,
];

const popularRank = new Map(
  POPULAR_GBP_CATEGORIES.map((name, index) => [name, index]),
);

/** Sort dataset categories: popular (file order) first, then A–Z. */
export function sortCategoriesPopularFirst(categories: string[]): string[] {
  return [...categories].sort((a, b) => {
    const rankA = popularRank.get(a);
    const rankB = popularRank.get(b);
    const popularA = rankA !== undefined;
    const popularB = rankB !== undefined;
    if (popularA && popularB) return rankA - rankB;
    if (popularA) return -1;
    if (popularB) return 1;
    return a.localeCompare(b);
  });
}
