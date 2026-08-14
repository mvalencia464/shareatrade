import { shareExampleLines } from "../lib/shareExample";

export function ShareExampleSheet({
  origin,
  compact = false,
}: {
  origin?: string;
  compact?: boolean;
}) {
  const lines = shareExampleLines(origin);

  return (
    <div className={`share-sheet${compact ? " is-compact" : ""}`} role="img" aria-label="Example share message">
      <div className="share-sheet-handle" aria-hidden />
      <p className="share-sheet-kicker">Share listing</p>
      <pre className="share-sheet-body">{lines.join("\n")}</pre>
      <div className="share-sheet-actions" aria-hidden>
        <span>Messages</span>
        <span>Mail</span>
        <span>Copy</span>
      </div>
    </div>
  );
}
