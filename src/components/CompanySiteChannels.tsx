import {
  EnvelopeSimple,
  FacebookLogo,
  Globe,
  InstagramLogo,
  Link as LinkIcon,
  LinkedinLogo,
  MapPin,
  TiktokLogo,
  YoutubeLogo,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";

export type SiteChannel = {
  key: string;
  href: string;
  label: string;
  kind: string;
};

function iconFor(kind: string): ReactNode {
  const p = kind.toLowerCase();
  if (p === "website") return <Globe size={18} weight="duotone" aria-hidden />;
  if (p === "gbp") return <MapPin size={18} weight="duotone" aria-hidden />;
  if (p === "email") return <EnvelopeSimple size={18} weight="duotone" aria-hidden />;
  if (p.includes("facebook")) return <FacebookLogo size={18} weight="duotone" aria-hidden />;
  if (p.includes("instagram")) return <InstagramLogo size={18} weight="duotone" aria-hidden />;
  if (p.includes("linkedin")) return <LinkedinLogo size={18} weight="duotone" aria-hidden />;
  if (p.includes("youtube") || p.includes("youtu")) {
    return <YoutubeLogo size={18} weight="duotone" aria-hidden />;
  }
  if (p.includes("tiktok")) return <TiktokLogo size={18} weight="duotone" aria-hidden />;
  return <LinkIcon size={18} weight="duotone" aria-hidden />;
}

export function CompanySiteChannels({ channels }: { channels: SiteChannel[] }) {
  if (channels.length === 0) return null;

  return (
    <nav className="cs-socials" aria-label="Website and social">
      {channels.map((channel) => (
        <a
          key={channel.key}
          className="cs-social"
          href={channel.href}
          target={channel.href.startsWith("mailto:") ? undefined : "_blank"}
          rel={
            channel.href.startsWith("mailto:")
              ? undefined
              : "noopener noreferrer nofollow"
          }
        >
          <span className="cs-social-icon">{iconFor(channel.kind)}</span>
          <span>{channel.label}</span>
        </a>
      ))}
    </nav>
  );
}
