import type { ReactNode } from "react";

type SocialLink = { platform: string; url: string };

type QuickLinksProps = {
  liveSiteHref?: string;
  website?: string;
  gbpUrl?: string;
  socials?: SocialLink[];
  email?: string;
};

function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M3 12h18M12 3c2.5 2.8 3.8 5.8 3.8 9s-1.3 6.2-3.8 9c-2.5-2.8-3.8-5.8-3.8-9S9.5 5.8 12 3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function IconMapPin() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="10" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M14 8h2V5h-2c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.2l.8-3H13V9c0-.6.4-1 1-1z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
    </svg>
  );
}

function IconLinkedIn() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6.5 9.5H9v9H6.5v-9zM7.7 5.2a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM11 9.5h2.4v1.2h.05c.3-.6 1.2-1.4 2.6-1.4 2.8 0 3.3 1.8 3.3 4.2v5H17v-4.4c0-1-.02-2.3-1.4-2.3-1.4 0-1.6 1.1-1.6 2.2V18.5H11v-9z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconYouTube() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M21 8.5s-.2-1.4-.8-2c-.7-.8-1.5-.8-1.9-.9C16.2 5.3 12 5.3 12 5.3h0s-4.2 0-6.3.3c-.4.1-1.2.1-1.9.9-.6.6-.8 2-.8 2S3 10.1 3 11.8v1.5c0 1.7.2 3.3.2 3.3s.2 1.4.8 2c.7.8 1.7.8 2.1.9 1.5.1 6.9.3 6.9.3s4.2 0 6.3-.3c.4-.1 1.2-.1 1.9-.9.6-.6.8-2 .8-2s.2-1.6.2-3.3v-1.5c0-1.7-.2-3.3-.2-3.3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path d="M10.5 9.8v5.4l4.6-2.7-4.6-2.7z" fill="currentColor" />
    </svg>
  );
}

function IconLink() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10 13a5 5 0 0 0 7.1.1l1.8-1.8a5 5 0 0 0-7.1-7.1L10.5 5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M14 11a5 5 0 0 0-7.1-.1L5.1 12.7a5 5 0 0 0 7.1 7.1l1.3-1.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="3.5"
        y="5.5"
        width="17"
        height="13"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M4.5 7.5 12 13l7.5-5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function socialIcon(platform: string) {
  const p = platform.toLowerCase();
  if (p.includes("facebook")) return <IconFacebook />;
  if (p.includes("instagram")) return <IconInstagram />;
  if (p.includes("linkedin")) return <IconLinkedIn />;
  if (p.includes("youtube") || p.includes("youtu")) return <IconYouTube />;
  return <IconLink />;
}

function socialLabel(platform: string) {
  const p = platform.trim();
  return p ? p.charAt(0).toUpperCase() + p.slice(1) : "Social";
}

export function QuickLinks({
  liveSiteHref,
  website,
  gbpUrl,
  socials = [],
  email,
}: QuickLinksProps) {
  const links: Array<{
    key: string;
    href: string;
    label: string;
    icon: ReactNode;
    hidden?: boolean;
  }> = [];

  if (liveSiteHref) {
    links.push({
      key: "live-site",
      href: liveSiteHref,
      label: "Live site",
      icon: <IconGlobe />,
      hidden: true,
    });
  }
  if (website) {
    links.push({ key: "website", href: website, label: "Website", icon: <IconGlobe /> });
  }
  if (gbpUrl) {
    links.push({
      key: "gbp",
      href: gbpUrl,
      label: "Google Business Profile",
      icon: <IconMapPin />,
    });
  }
  if (email) {
    links.push({
      key: "email",
      href: `mailto:${email}`,
      label: email,
      icon: <IconMail />,
    });
  }
  for (const social of socials) {
    links.push({
      key: `${social.platform}-${social.url}`,
      href: social.url,
      label: socialLabel(social.platform),
      icon: socialIcon(social.platform),
    });
  }

  if (links.length === 0) return null;

  return (
    <div className="quick-links" onClick={(e) => e.stopPropagation()}>
      {links.map((link) => (
        <a
          key={link.key}
          className={link.hidden ? "quick-link quick-link-dev" : "quick-link"}
          href={link.href}
          target={link.href.startsWith("mailto:") ? undefined : "_blank"}
          rel={link.href.startsWith("mailto:") ? undefined : "noreferrer"}
          aria-hidden={link.hidden ? true : undefined}
          tabIndex={link.hidden ? -1 : undefined}
          aria-label={link.hidden ? undefined : link.label}
          data-tooltip={link.hidden ? undefined : link.label}
          onClick={(e) => e.stopPropagation()}
        >
          {link.icon}
        </a>
      ))}
    </div>
  );
}

export function wordmark(name: string): string {
  const parts = name
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).toUpperCase() || "SC";
}
