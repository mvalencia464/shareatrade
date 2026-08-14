type LicenseBadgeProps = {
  number?: string;
  status?: string;
  state?: string;
  updatedAt?: number;
};

function isActiveStatus(status?: string) {
  return (status ?? "").toLowerCase().includes("active");
}

function formatChecked(updatedAt?: number) {
  if (!updatedAt) return null;
  return new Date(updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function LicenseBadge({
  number,
  status,
  state,
  updatedAt,
}: LicenseBadgeProps) {
  if (!number) return null;
  const region = (state || "WA").toUpperCase().slice(0, 2);
  const verified = isActiveStatus(status) && region === "WA";
  const label = verified ? "Verified" : status?.trim() || "Licensed";
  const checked = formatChecked(updatedAt);
  const agency = region === "ID" ? "Idaho DOPL" : "WA L&I";
  const title = [
    [region, number, status].filter(Boolean).join(" · "),
    checked ? `Last checked: ${checked}` : null,
    `Confirm on ${agency} before hiring. We match public data; it can be wrong or out of date.`,
  ]
    .filter(Boolean)
    .join("\n");

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
