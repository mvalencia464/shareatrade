type StarRatingProps = {
  rating?: number;
  reviewCount?: number;
  size?: "sm" | "md";
  showValue?: boolean;
};

function Star({ fill }: { fill: number }) {
  const clipped = Math.max(0, Math.min(1, fill));
  const pct = `${(1 - clipped) * 100}%`;

  return (
    <span className="star-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" className="star-icon-base">
        <path
          d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.27 6.2 20.37l1.11-6.47-4.7-4.58 6.49-.94L12 2.5z"
          fill="currentColor"
          opacity="0.18"
        />
      </svg>
      <svg
        viewBox="0 0 24 24"
        className="star-icon-fill"
        style={{ clipPath: `inset(0 ${pct} 0 0)` }}
      >
        <path
          d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.27 6.2 20.37l1.11-6.47-4.7-4.58 6.49-.94L12 2.5z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

export function StarRating({
  rating,
  reviewCount,
  size = "sm",
  showValue = true,
}: StarRatingProps) {
  if (rating === undefined) {
    return (
      <span className={`star-rating star-rating-${size} is-empty`}>No reviews</span>
    );
  }

  const label =
    reviewCount !== undefined
      ? `${rating.toFixed(1)} out of 5 from ${reviewCount} reviews`
      : `${rating.toFixed(1)} out of 5`;

  return (
    <span
      className={`star-rating star-rating-${size}`}
      title={label}
      aria-label={label}
    >
      <span className="star-rating-stars">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} fill={Math.max(0, Math.min(1, rating - i))} />
        ))}
      </span>
      {showValue ? (
        <span className="star-rating-value">
          <strong>{rating.toFixed(1)}</strong>
          {reviewCount !== undefined ? (
            <span className="star-rating-count">({reviewCount})</span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
