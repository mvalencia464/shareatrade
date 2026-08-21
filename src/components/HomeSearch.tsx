import { useQuery } from "convex/react";
import { useDeferredValue, useId, useState } from "react";
import { api } from "../../convex/_generated/api";
import { getMarket } from "../lib/markets";
import { listingPath } from "../lib/site";
import { ConvexProvider } from "./ConvexProvider";
import { LogoMark } from "./LogoMark";
import { StarRating } from "./StarRating";

function placeLine(hit: {
  marketSlug: string;
  city?: string;
  state?: string;
}) {
  const market = getMarket(hit.marketSlug);
  const metro = market?.name ?? hit.marketSlug;
  const state = hit.state || market?.state;
  const city = hit.city?.trim();
  const cityLooksLikeMetro =
    city && city.toLowerCase() === metro.toLowerCase();

  if (city && !cityLooksLikeMetro) {
    return state ? `${city}, ${state} · ${metro}` : `${city} · ${metro}`;
  }
  return state ? `${metro}, ${state}` : metro;
}

function HomeSearchInner() {
  const listId = useId();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const q = deferredSearch.length >= 2 ? deferredSearch : "";
  const results = useQuery(
    api.contractors.searchNationwide,
    q ? { q } : "skip",
  );

  const waiting = q.length >= 2 && results === undefined;

  return (
    <div className="home-search">
      <label htmlFor="nationwide-search">Search every market</label>
      <input
        id="nationwide-search"
        type="search"
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={Boolean(q)}
        placeholder="Name or trade"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        autoComplete="off"
      />
      {q ? (
        <div className="home-search-panel" id={listId} role="listbox">
          {waiting ? (
            <p className="home-search-status">Searching…</p>
          ) : results && results.length === 0 ? (
            <p className="home-search-status">
              No listings matched. Browse a market below, or try another name.
            </p>
          ) : (
            <ul className="home-search-results">
              {results?.map((hit) => {
                const place = placeLine(hit);
                return (
                  <li key={hit._id}>
                    <a
                      className="home-search-hit"
                      href={listingPath(hit.marketSlug, hit.slug)}
                      role="option"
                    >
                      <LogoMark name={hit.name} logoUrl={hit.logoUrl} />
                      <span className="home-search-hit-copy">
                        <span className="home-search-hit-name">{hit.name}</span>
                        <span className="home-search-hit-meta">
                          {hit.category}
                        </span>
                        <span className="home-search-hit-place">{place}</span>
                        <StarRating
                          rating={hit.rating}
                          reviewCount={hit.reviewCount}
                        />
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function HomeSearch({ convexUrl }: { convexUrl: string }) {
  return (
    <ConvexProvider url={convexUrl}>
      <HomeSearchInner />
    </ConvexProvider>
  );
}
