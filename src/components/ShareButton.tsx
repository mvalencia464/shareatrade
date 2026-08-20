import { useState, type MouseEvent } from "react";
import {
  buildShareText,
  type ShareContractor,
} from "../lib/shareListing";

export function ShareButton({
  contractor,
  variant = "icon",
}: {
  contractor: ShareContractor;
  variant?: "icon" | "bar";
}) {
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
        : variant === "bar"
          ? "Share"
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
      <img
        className="share-button-mark"
        src="/favicon.svg"
        alt=""
        width={20}
        height={20}
        aria-hidden="true"
      />
      {variant === "bar" ? <span>{label}</span> : null}
    </button>
  );
}
