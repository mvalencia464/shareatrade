import { Phone } from "@phosphor-icons/react";

type Props = {
  href: string;
  label: string;
  phone?: string;
  variant: "bar" | "inline";
};

export function CompanySiteCallCta({ href, label, phone, variant }: Props) {
  if (variant === "bar") {
    return (
      <a className="cs-call" href={href}>
        <Phone size={26} weight="duotone" aria-hidden />
        <span className="cs-call-label">Call{phone ? ` ${phone}` : ""}</span>
      </a>
    );
  }

  return (
    <a className="cs-inline-cta" href={href}>
      <Phone size={18} weight="duotone" aria-hidden />
      {label}
    </a>
  );
}
