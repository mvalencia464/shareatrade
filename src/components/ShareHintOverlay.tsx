import { useState } from "react";
import { SHARE_HINT_STORAGE_KEY } from "../lib/shareExample";
import { ShareExampleSheet } from "./ShareExampleSheet";

export function ShareHintOverlay() {
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(SHARE_HINT_STORAGE_KEY) !== "1";
    } catch {
      return true;
    }
  });

  function dismiss() {
    setOpen(false);
    try {
      window.localStorage.setItem(SHARE_HINT_STORAGE_KEY, "1");
    } catch {
      // Ignore
    }
  }

  if (!open) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : undefined;

  return (
    <div className="share-hint" role="dialog" aria-label="How to share a listing">
      <button type="button" className="share-hint-dismiss" onClick={dismiss}>
        Got it
      </button>
      <p className="share-hint-copy">
        Tap the share icon on a listing. Phones open a share sheet; other browsers
        copy the details below.
      </p>
      <ShareExampleSheet origin={origin} compact />
    </div>
  );
}
