import { useQuery } from "convex/react";
import { EnvelopeSimple, Phone } from "@phosphor-icons/react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { api } from "../../convex/_generated/api";
import { useFavorites } from "../hooks/useFavorites";
import { formatPhone, phoneTelHref } from "../lib/phone";
import { ConvexProvider } from "./ConvexProvider";
import { FavoriteButton } from "./FavoriteButton";
import { LogoMark } from "./LogoMark";
import { QuickLinks } from "./QuickLinks";
import { ShareButton } from "./ShareButton";
import { StarRating } from "./StarRating";

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
  gbpUrl?: string;
  socials: SocialLink[];
};

type SortKey = "rating" | "reviews" | "name-asc" | "name-desc";
type ListView = "all" | "saved";

function IconSort() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 7h10M4 12h7M4 17h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M16 6v12M16 18l-2.4-2.4M16 18l2.4-2.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function sortContractors(list: ContractorCard[], sort: SortKey): ContractorCard[] {
  const items = [...list];
  switch (sort) {
    case "reviews":
      return items.sort((a, b) => {
        const diff = (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
        if (diff !== 0) return diff;
        return a.name.localeCompare(b.name);
      });
    case "name-asc":
      return items.sort((a, b) => a.name.localeCompare(b.name));
    case "name-desc":
      return items.sort((a, b) => b.name.localeCompare(a.name));
    case "rating":
    default:
      return items.sort((a, b) => {
        const diff = (b.rating ?? 0) - (a.rating ?? 0);
        if (diff !== 0) return diff;
        const reviews = (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
        if (reviews !== 0) return reviews;
        return a.name.localeCompare(b.name);
      });
  }
}

function readViewFromLocation(): ListView {
  if (typeof window === "undefined") return "all";
  return new URLSearchParams(window.location.search).get("view") === "saved"
    ? "saved"
    : "all";
}

function DirectoryInner() {
  const contractors = useQuery(api.contractors.list);
  const { favorites, favoriteCount, isFavorite, toggleFavorite, ready } =
    useFavorites();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [minRating, setMinRating] = useState("");
  const [sort, setSort] = useState<SortKey>("rating");
  const [view, setView] = useState<ListView>("all");

  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    setView(readViewFromLocation());
    const onPopState = () => setView(readViewFromLocation());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function setListView(next: ListView) {
    setView(next);
    const url = new URL(window.location.href);
    if (next === "saved") url.searchParams.set("view", "saved");
    else url.searchParams.delete("view");
    window.history.replaceState({}, "", url);
  }

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
    const favoriteSet = new Set(favorites);

    const matched = contractors.filter((c: ContractorCard) => {
      if (view === "saved" && !favoriteSet.has(c.slug)) return false;
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

    return sortContractors(matched, sort);
  }, [
    contractors,
    deferredSearch,
    category,
    city,
    minRating,
    sort,
    view,
    favorites,
  ]);

  if (contractors === undefined) {
    return <p className="loading">Loading Spokane contractors…</p>;
  }

  const hasFilters = Boolean(search || category || city || minRating);

  return (
    <div className="directory">
      <section className="hero">
        <p className="hero-eyebrow">Spokane &amp; Inland Northwest</p>
        <h1>Find a contractor for your next project</h1>
        <p>
          Free to browse—no account, no sign-in. Filter by trade, city, and
          rating, save listings on this device, then open a profile to call or
          email.
        </p>
        <p className="hero-note">
          <a href="/how-it-works">How it works</a>
          {" · "}
          Hearts save to this browser only
        </p>
      </section>

      <div className="view-tabs" role="tablist" aria-label="Directory views">
        <button
          type="button"
          role="tab"
          aria-selected={view === "all"}
          className={`view-tab${view === "all" ? " is-active" : ""}`}
          onClick={() => setListView("all")}
        >
          All listings
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "saved"}
          className={`view-tab${view === "saved" ? " is-active" : ""}`}
          onClick={() => setListView("saved")}
        >
          Saved{ready && favoriteCount > 0 ? ` (${favoriteCount})` : ""}
        </button>
      </div>

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
          {view === "saved" ? (
            <>
              {filtered.length}{" "}
              {filtered.length === 1 ? "saved contractor" : "saved contractors"}
            </>
          ) : (
            <>
              {filtered.length}{" "}
              {filtered.length === 1 ? "contractor" : "contractors"} found
            </>
          )}
        </span>
        <div className="results-actions">
          <label className="sort-control">
            <span className="sort-icon" aria-hidden>
              <IconSort />
            </span>
            <span className="sort-label">Sort by</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Sort listings"
            >
              <option value="rating">Top rated</option>
              <option value="reviews">Most reviews</option>
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
            </select>
          </label>
          {hasFilters && (
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
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          {view === "saved" ? (
            <>
              <p>No saved contractors on this device yet.</p>
              <p className="empty-hint">
                Tap the heart on any listing to save it here. Saves stay in this
                browser—no account needed.
              </p>
              <button
                type="button"
                className="button button-primary"
                onClick={() => setListView("all")}
              >
                Browse all listings
              </button>
            </>
          ) : (
            <p>No contractors match these filters.</p>
          )}
        </div>
      ) : (
        <ul className="contractor-list">
          {filtered.map((c, index) => {
            const tel = phoneTelHref(c.phone);
            const saved = isFavorite(c.slug);
            return (
              <li
                key={c._id}
                className="contractor-card"
                style={{ animationDelay: `${Math.min(index, 12) * 0.03}s` }}
              >
                <div className="contractor-main">
                  <a
                    className="contractor-identity"
                    href={`/contractors/${c.slug}`}
                  >
                    <LogoMark name={c.name} logoUrl={c.logoUrl} />
                    <div className="contractor-copy">
                      <h2 title={c.name}>{c.name}</h2>
                      <p className="contractor-sub">
                        {c.category}
                        {c.city ? ` · ${c.city}` : ""}
                      </p>
                      <div className="contractor-rating">
                        <StarRating
                          rating={c.rating}
                          reviewCount={c.reviewCount}
                        />
                      </div>
                    </div>
                  </a>
                </div>

                <div className="contractor-aside">
                  <div className="contractor-cta-row">
                    <a
                      className="button button-secondary button-card-cta"
                      href={`/contractors/${c.slug}`}
                    >
                      View profile
                    </a>
                    {tel ? (
                      <a
                        className="button button-primary button-card-cta"
                        href={tel}
                        title={`Call ${formatPhone(c.phone)}`}
                      >
                        <Phone size={16} weight="duotone" aria-hidden />
                        <span>{formatPhone(c.phone)}</span>
                      </a>
                    ) : c.phone ? (
                      <span
                        className="button button-primary button-card-cta is-disabled"
                        title={formatPhone(c.phone)}
                      >
                        <Phone size={16} weight="duotone" aria-hidden />
                        <span>{formatPhone(c.phone)}</span>
                      </span>
                    ) : null}
                  </div>

                  {c.email ? (
                    <a
                      className="contact-line contact-email"
                      href={`mailto:${c.email}`}
                      title={c.email}
                    >
                      <span className="contact-icon" aria-hidden>
                        <EnvelopeSimple size={16} weight="duotone" />
                      </span>
                      <span>{c.email}</span>
                    </a>
                  ) : null}

                  <div className="contractor-toolbar">
                    <QuickLinks
                      website={c.website}
                      gbpUrl={c.gbpUrl}
                      socials={c.socials}
                    />
                    <ShareButton
                      contractor={{
                        slug: c.slug,
                        name: c.name,
                        category: c.category,
                        city: c.city,
                        phone: c.phone,
                        website: c.website,
                      }}
                    />
                    <FavoriteButton
                      slug={c.slug}
                      saved={saved}
                      onToggle={toggleFavorite}
                    />
                  </div>
                </div>
              </li>
            );
          })}
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
