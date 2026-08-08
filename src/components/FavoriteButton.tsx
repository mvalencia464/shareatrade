type FavoriteButtonProps = {
  slug: string;
  saved: boolean;
  onToggle: (slug: string) => void;
  size?: "md" | "lg";
};

function IconHeart({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 20.2 10.7 19c-4.4-4-7.2-6.5-7.2-9.7A4.3 4.3 0 0 1 7.8 5c1.5 0 2.9.7 3.7 1.8h.9A4.5 4.5 0 0 1 16.2 5a4.3 4.3 0 0 1 4.3 4.3c0 3.2-2.8 5.7-7.2 9.7L12 20.2z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FavoriteButton({
  slug,
  saved,
  onToggle,
  size = "md",
}: FavoriteButtonProps) {
  return (
    <button
      type="button"
      className={`favorite-button favorite-button-${size}${saved ? " is-saved" : ""}`}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save to this device"}
      title={saved ? "Saved on this device" : "Save on this device"}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle(slug);
      }}
    >
      <IconHeart filled={saved} />
    </button>
  );
}
