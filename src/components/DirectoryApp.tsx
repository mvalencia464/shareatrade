import { useQuery } from "convex/react";
import { useDeferredValue, useMemo, useState } from "react";
import { api } from "../../convex/_generated/api";
import { ConvexProvider } from "./ConvexProvider";
import { LogoMark } from "./LogoMark";
import { QuickLinks } from "./QuickLinks";
import { StarRating } from "./StarRating";
import { formatPhone } from "../lib/phone";

type SocialLink = { platform: string; url: string };

type ContractorCard = {
  _id: string;
  slug: string;
  name: string;
  category: string;
  city?: string;
  rating?: number;
  reviewCount?: number;
  phone?: string;
  email?: string;
  logoUrl?: string;
  website?: string;
  gbpUrl: string;
  socials: SocialLink[];
};

function DirectoryInner() {
  const contractors = useQuery(api.contractors.list);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [minRating, setMinRating] = useState("");

  const deferredSearch = useDeferredValue(search);

  const facets = useMemo(() => {
    if (!contractors) return { categories: [] as string[], cities: [] as string[] };
    const categories = [
      ...new Set(contractors.map((c) => c.category)),
    ].sort((a, b) => a.localeCompare(b));
    const cities = [
      ...new Set(
        contractors
          .map((c) => c.city)
          .filter((value): value is string => Boolean(value && value.trim())),
      ),
    ].sort((a, b) => a.localeCompare(b));
    return { categories, cities };
  }, [contractors]);

  const filtered = useMemo(() => {
    if (!contractors) return [];
    const q = deferredSearch.trim().toLowerCase();
    const ratingFloor = minRating ? Number(minRating) : null;

    return contractors.filter((c: ContractorCard) => {
      if (category && c.category !== category) return false;
      if (city && c.city !== city) return false;
      if (ratingFloor !== null) {
        if (c.rating === undefined || c.rating < ratingFloor) return false;
      }
      if (!q) return true;
      const haystack = [c.name, c.category, c.city, c.phone, c.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [contractors, deferredSearch, category, city, minRating]);

  if (contractors === undefined) {
    return <p className="loading">Loading Spokane contractors…</p>;
  }

  return (
    <div className="directory">
      <section className="hero">
        <p className="hero-eyebrow">Spokane &amp; Inland Northwest</p>
        <h1>Find a contractor for your next project</h1>
        <p>
          Browse local listings by trade, city, and rating—then open a profile
          for contact details and Google Business links.
        </p>
      </section>

      <div className="filters">
        <label>
          Search
          <input
            type="search"
            placeholder="Name, trade, email, or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label>
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {facets.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          City
          <select value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="">All cities</option>
            {facets.cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          Min rating
          <select
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
          >
            <option value="">Any</option>
            <option value="4.5">4.5+</option>
            <option value="4">4.0+</option>
            <option value="3.5">3.5+</option>
            <option value="3">3.0+</option>
          </select>
        </label>
      </div>

      <div className="results-meta">
        <span>
          {filtered.length}{" "}
          {filtered.length === 1 ? "contractor" : "contractors"}
        </span>
        {(search || category || city || minRating) && (
          <button
            type="button"
            className="button button-ghost"
            onClick={() => {
              setSearch("");
              setCategory("");
              setCity("");
              setMinRating("");
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="empty">No contractors match these filters.</p>
      ) : (
        <ul className="contractor-list">
          {filtered.map((c, index) => (
            <li
              key={c._id}
              className="contractor-card"
              style={{ animationDelay: `${Math.min(index, 12) * 0.03}s` }}
            >
              <a className="contractor-main" href={`/contractors/${c.slug}`}>
                <LogoMark name={c.name} logoUrl={c.logoUrl} />
                <div className="contractor-copy">
                  <h2 title={c.name}>{c.name}</h2>
                  <p className="contractor-sub">
                    {c.category}
                    {c.city ? ` · ${c.city}` : ""}
                  </p>
                  {c.email ? (
                    <p className="contractor-email" title={c.email}>
                      {c.email}
                    </p>
                  ) : null}
                </div>
              </a>

              <div className="contractor-aside">
                <StarRating rating={c.rating} reviewCount={c.reviewCount} />
                {c.phone ? (
                  <p className="contractor-phone">{formatPhone(c.phone)}</p>
                ) : null}
                <QuickLinks
                  website={c.website}
                  gbpUrl={c.gbpUrl}
                  socials={c.socials}
                  email={c.email}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function DirectoryApp({ convexUrl }: { convexUrl: string }) {
  return (
    <ConvexProvider url={convexUrl}>
      <DirectoryInner />
    </ConvexProvider>
  );
}
