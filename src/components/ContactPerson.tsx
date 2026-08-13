import {
  CONTACT_EMAIL,
  CONTACT_NAME,
  CONTACT_PHOTO,
  contractorHelpMailto,
} from "../lib/site";

export function ContactPerson({ compact = false }: { compact?: boolean }) {
  return (
    <a
      className={`contact-person${compact ? " is-compact" : ""}`}
      href={contractorHelpMailto()}
    >
      <img
        className="contact-person-photo"
        src={CONTACT_PHOTO}
        alt=""
        width={compact ? 28 : 40}
        height={compact ? 28 : 40}
      />
      <span className="contact-person-copy">
        <span className="contact-person-name">{CONTACT_NAME}</span>
        <span className="contact-person-email">{CONTACT_EMAIL}</span>
      </span>
    </a>
  );
}
