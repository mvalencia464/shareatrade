import { useQuery } from "convex/react";
import { Phone } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../convex/_generated/api";
import { useFavorites } from "../hooks/useFavorites";
import { formatPhone, phoneTelHref } from "../lib/phone";
import { listingPath } from "../lib/site";
import { ConvexProvider } from "./ConvexProvider";
import { CoverImage } from "./CoverImage";
import { ContractorHelpNote } from "./ContractorHelpNote";
import { FavoriteButton } from "./FavoriteButton";
import { LicenseBadge } from "./LicenseBadge";
import { LogoMark } from "./LogoMark";
import { QuickLinks } from "./QuickLinks";
import { ShareButton } from "./ShareButton";
import { StarRating } from "./StarRating";

type Neighbor = {
  slug: string;
  name: string;
};

const NAV_CACHE_KEY = "spokane-contractors-listNav-v1";

function readNavCache(currentSlug: string): Neighbor[] | null {
  try {
    const raw = sessionStorage.getItem(NAV_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Neighbor[];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    if (!parsed.some((n) => n.slug === currentSlug)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeNavCache(neighbors: Neighbor[]) {
  try {
    sessionStorage.setItem(NAV_CACHE_KEY, JSON.stringify(neighbors));
  } catch {
    // Ignore quota / private-mode failures.
  }
}

function ContractorPager({
  currentSlug,
  neighbors,
}: {
  currentSlug: string;
  neighbors: Neighbor[] | undefined;
}) {
  const { prev, next, index, total } = useMemo(() => {
    if (!neighbors?.length) {
      return { prev: null, next: null, index: -1, total: 0 };
    }
    const i = neighbors.findIndex((n) => n.slug === currentSlug);
    if (i < 0) {
      return { prev: null, next: null, index: -1, total: neighbors.length };
    }
    return {
      prev: i > 0 ? neighbors[i - 1]! : null,
      next: i < neighbors.length - 1 ? neighbors[i + 1]! : null,
      index: i,
      total: neighbors.length,
    };
  }, [neighbors, currentSlug]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }

      if (event.key === "ArrowLeft" && prev) {
        event.preventDefault();
        window.location.assign(listingPath(prev.slug));
      } else if (event.key === "ArrowRight" && next) {
        event.preventDefault();
        window.location.assign(listingPath(next.slug));
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [prev, next]);

  if (!neighbors) {
    return <div className="pager pager-loading" aria-hidden />;
  }

  return (
    <nav className="pager" aria-label="Contractor results">
      {prev ? (
        <a
          className="pager-link pager-prev"
          href={listingPath(prev.slug)}
          title={`${prev.name} (←)`}
        >
          <span className="pager-arrow" aria-hidden>
            ←
          </span>
          <span className="pager-copy">
            <span className="pager-label">Previous</span>
            <span className="pager-name">{prev.name}</span>
          </span>
        </a>
      ) : (
        <span className="pager-link is-disabled" aria-disabled="true">
          <span className="pager-arrow" aria-hidden>
            ←
          </span>
          <span className="pager-copy">
            <span className="pager-label">Previous</span>
            <span className="pager-name">Start of list</span>
          </span>
        </span>
      )}

      <p className="pager-position">
        {index >= 0 ? (
          <>
            {index + 1} / {total}
          </>
        ) : (
          <>{total} listings</>
        )}
      </p>

      {next ? (
        <a
          className="pager-link pager-next"
          href={listingPath(next.slug)}
          title={`${next.name} (→)`}
        >
          <span className="pager-copy">
            <span className="pager-label">Next</span>
            <span className="pager-name">{next.name}</span>
          </span>
          <span className="pager-arrow" aria-hidden>
            →
          </span>
        </a>
      ) : (
        <span className="pager-link pager-next is-disabled" aria-disabled="true">
          <span className="pager-copy">
            <span className="pager-label">Next</span>
            <span className="pager-name">End of list</span>
          </span>
          <span className="pager-arrow" aria-hidden>
            →
          </span>
        </span>
      )}
    </nav>
  );
}

function DetailInner({ slug }: { slug: string }) {
  const contractor = useQuery(api.contractors.getBySlug, { slug });
  const { isFavorite, toggleFavorite } = useFavorites();

  const [cachedNav] = useState(() =>
    typeof sessionStorage === "undefined" ? null : readNavCache(slug),
  );
  // Re-validate cache when slug changes within the same mounted component.
  const cachedForSlug = useMemo(() => {
    if (cachedNav?.some((n) => n.slug === slug)) return cachedNav;
    return typeof sessionStorage === "undefined" ? null : readNavCache(slug);
  }, [cachedNav, slug]);

  const liveNav = useQuery(
    api.contractors.listNav,
    cachedForSlug ? "skip" : {},
  );

  useEffect(() => {
    if (liveNav) writeNavCache(liveNav);
  }, [liveNav]);

  const neighbors = liveNav ?? cachedForSlug ?? undefined;

  if (contractor === undefined) {
    return <p className="loading">Loading listing…</p>;
  }

  if (contractor === null) {
    return (
      <div className="not-found">
        <h1>Contractor not found</h1>
        <p>
          <a className="button button-primary" href="/">
            Back to directory
          </a>
        </p>
      </div>
    );
  }

  const shareContractor = {
    slug: contractor.slug,
    name: contractor.name,
    category: contractor.category,
    city: contractor.city,
    phone: contractor.phone,
    website: contractor.website,
    rating: contractor.rating,
    reviewCount: contractor.reviewCount,
  };

  return (
    <>
    <article className="detail">
      <div className="detail-topbar">
        <a className="back-link" href="/">
          ← All contractors
        </a>
      </div>

      <div className="detail-hero">
        <div>
          <div className="detail-brand-row">
            <LogoMark
              name={contractor.name}
              logoUrl={contractor.logoUrl}
              className="detail-logo"
            />
            <div>
              <p className="detail-kicker">{contractor.category}</p>
              <h1>{contractor.name}</h1>
              <LicenseBadge
                number={contractor.licenseNumber}
                status={contractor.licenseStatus}
                state={contractor.licenseState}
                updatedAt={contractor.licenseUpdatedAt}
              />
            </div>
          </div>

          <div className="detail-rating-row">
            <StarRating
              rating={contractor.rating}
              reviewCount={contractor.reviewCount}
              size="md"
            />
          </div>

          <p className="detail-summary">
            {contractor.city
              ? `Serving ${contractor.city}${contractor.state ? `, ${contractor.state}` : ""}.`
              : "Spokane-area contractor listing."}
          </p>

          <div className="detail-actions">
            {contractor.website ? (
              <a
                className="button button-primary"
                href={contractor.website}
                target="_blank"
                rel="noreferrer"
              >
                Visit website
              </a>
            ) : null}
            {contractor.gbpUrl ? (
              <a
                className="button button-secondary"
                href={contractor.gbpUrl}
                target="_blank"
                rel="noreferrer"
              >
                Google Business
              </a>
            ) : null}
            {contractor.phone ? (
              <a
                className="button button-secondary"
                href={phoneTelHref(contractor.phone) ?? `tel:${contractor.phone}`}
              >
                Call {formatPhone(contractor.phone)}
              </a>
            ) : null}
            <ShareButton contractor={shareContractor} />
            <FavoriteButton
              slug={contractor.slug}
              saved={isFavorite(contractor.slug)}
              onToggle={toggleFavorite}
              size="lg"
            />
          </div>

          <QuickLinks
            website={contractor.website}
            gbpUrl={contractor.gbpUrl}
            socials={contractor.socials}
            email={contractor.email}
          />
        </div>

        <CoverImage name={contractor.name} imageUrl={contractor.mainImageUrl} />
      </div>

      <div className="detail-grid">
        <section className="detail-block">
          <h2>Contact</h2>
          {contractor.phone ? (
            <p>
              <a
                href={
                  phoneTelHref(contractor.phone) ?? `tel:${contractor.phone}`
                }
              >
                {formatPhone(contractor.phone)}
              </a>
            </p>
          ) : (
            <p>No phone listed</p>
          )}
          {contractor.email ? (
            <p>
              <a href={`mailto:${contractor.email}`}>{contractor.email}</a>
            </p>
          ) : null}
          {contractor.address ? <p>{contractor.address}</p> : null}
          {contractor.city || contractor.state ? (
            <p>
              {[contractor.city, contractor.state].filter(Boolean).join(", ")}
            </p>
          ) : null}
        </section>

        <section className="detail-block">
          <h2>Listing details</h2>
          <p>Category: {contractor.category}</p>
          {contractor.source ? <p>Source: {contractor.source}</p> : null}
          {contractor.gbpUrl ? (
            <>
              <p>Google Maps rank: #{contractor.googleMapsRank}</p>
              <div className="detail-block-stars">
                <StarRating
                  rating={contractor.rating}
                  reviewCount={contractor.reviewCount}
                />
              </div>
              <p>
                Google Business Profile:{" "}
                {contractor.claimed ? "Claimed" : "Unclaimed"}
              </p>
            </>
          ) : (
            <div className="detail-block-stars">
              <StarRating
                rating={contractor.rating}
                reviewCount={contractor.reviewCount}
              />
            </div>
          )}
        </section>

        {contractor.licenseNumber ? (
          <section className="detail-block">
            <h2>Contractor license</h2>
            <p className="license-number">
              <span className="license-label">{contractor.licenseState || "WA"}</span>{" "}
              {contractor.licenseNumber}
            </p>
            {contractor.licenseStatus ? (
              <p>
                Status:{" "}
                <span
                  className={`license-status ${(contractor.licenseStatus || "")
                    .toLowerCase()
                    .includes("active")
                    ? "is-active"
                    : ""}`}
                >
                  {contractor.licenseStatus}
                </span>
              </p>
            ) : null}
            {contractor.licenseType ? <p>Type: {contractor.licenseType}</p> : null}
            {contractor.licenseExpiresAt ? (
              <p>Expires: {contractor.licenseExpiresAt}</p>
            ) : null}
            {contractor.licenseUpdatedAt ? (
              <p>
                Last checked:{" "}
                {new Date(contractor.licenseUpdatedAt).toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric", year: "numeric" },
                )}
              </p>
            ) : null}
            <p>
              {contractor.licenseState === "ID" ||
              contractor.licenseState === "Idaho" ? (
                <a
                  href="https://edopl.idaho.gov/OnlineServices/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Verify on Idaho DOPL
                </a>
              ) : (
                <a
                  href="https://secure.lni.wa.gov/verify/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Verify on WA L&amp;I
                </a>
              )}
            </p>
            <p className="license-note">
              Snapshot from public records, not a license guarantee. Confirm on
              L&amp;I (or Idaho DOPL) before you hire. Matching can be wrong or
              stale.
            </p>
          </section>
        ) : null}
      </div>

      <ContractorHelpNote />

      <ContractorPager currentSlug={slug} neighbors={neighbors} />
    </article>
      <div className="listing-bar">
        <ShareButton contractor={shareContractor} variant="bar" />
        {contractor.phone ? (
          <a
            className="listing-bar-call"
            href={phoneTelHref(contractor.phone) ?? `tel:${contractor.phone}`}
            aria-label={`Call ${contractor.name}`}
          >
            <Phone size={26} weight="duotone" aria-hidden />
            <span className="listing-bar-name">{contractor.name}</span>
          </a>
        ) : null}
      </div>
    </>
  );
}

export function ContractorDetailApp({
  convexUrl,
  slug,
}: {
  convexUrl: string;
  slug: string;
}) {
  return (
    <ConvexProvider url={convexUrl}>
      <DetailInner slug={slug} />
    </ConvexProvider>
  );
}
