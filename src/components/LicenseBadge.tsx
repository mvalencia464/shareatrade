type LicenseBadgeProps = {
  number?: string;
  status?: string;
  state?: string;
};

function isActiveStatus(status?: string) {
  return (status ?? "").toLowerCase().includes("active");
}

export function LicenseBadge({ number, status, state }: LicenseBadgeProps) {
  if (!number) return null;
  const region = (state || "WA").toUpperCase().slice(0, 2);
  const verified = isActiveStatus(status);
  const label = verified ? "Verified" : status?.trim() || "Licensed";
  const title = [region, number, status].filter(Boolean).join(" · ");

  return (
    <span
      className={`license-badge${verified ? " is-verified" : ""}`}
      title={title}
    >
      {label}
      <span className="license-badge-state">{region}</span>
    </span>
  );
}
