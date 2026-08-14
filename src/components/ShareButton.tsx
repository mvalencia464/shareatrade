import { useState, type MouseEvent } from "react";
import {
  buildShareText,
  type ShareContractor,
} from "../lib/shareListing";

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

export function ShareButton({ contractor }: { contractor: ShareContractor }) {
  const [status, setStatus] = useState<"idle" | "shared" | "copied">("idle");

  async function onShare(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const text = buildShareText(contractor);

    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        // Text-only so the name is not duplicated as a share-sheet title.
        await navigator.share({ text });
        setStatus("shared");
        window.setTimeout(() => setStatus("idle"), 1600);
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(text);
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
