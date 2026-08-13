import { useState, type MouseEvent } from "react";
import { formatPhone } from "../lib/phone";
import { listingUrl } from "../lib/site";

type ShareContractor = {
  slug: string;
  name: string;
  category: string;
  city?: string;
  phone?: string;
  website?: string;
};

function IconShare() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="18" cy="5" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="6" cy="12" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="18" cy="19" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M8.2 10.8 15.7 6.4M8.2 13.2l7.5 4.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function buildSharePayload(contractor: ShareContractor) {
  const url = listingUrl(contractor.slug);
  const lines = [
    contractor.name,
    [contractor.category, contractor.city].filter(Boolean).join(" · "),
    contractor.phone ? formatPhone(contractor.phone) : null,
    contractor.website ?? null,
    url,
  ].filter(Boolean);
  const clipboard = lines.join("\n");
  return {
    title: contractor.name,
    // Full body with the listing URL last so Facebook/etc. unfurl Spokane List.
    text: clipboard,
    url,
    clipboard,
  };
}

export function ShareButton({ contractor }: { contractor: ShareContractor }) {
  const [status, setStatus] = useState<"idle" | "shared" | "copied">("idle");

  async function onShare(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const payload = buildSharePayload(contractor);

    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({
          title: payload.title,
          text: payload.text,
        });
        setStatus("shared");
        window.setTimeout(() => setStatus("idle"), 1600);
        return;
      }
    } catch (error) {
      // User cancel — don't fall through to clipboard.
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(payload.clipboard);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 1600);
    } catch {
      // Last resort: noop
    }
  }

  const label =
    status === "copied"
      ? "Copied"
      : status === "shared"
        ? "Shared"
        : `Share ${contractor.name}`;

  return (
    <button
      type="button"
      className={`share-button${status !== "idle" ? " is-done" : ""}`}
      aria-label={label}
      title={status === "copied" ? "Copied to clipboard" : "Share listing"}
      data-tooltip={status === "copied" ? "Copied!" : status === "shared" ? "Shared" : "Share"}
      onClick={onShare}
    >
      <IconShare />
    </button>
  );
}
