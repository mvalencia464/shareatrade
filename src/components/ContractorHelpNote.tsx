import { ContactPerson } from "./ContactPerson";

export function ContractorHelpNote() {
  return (
    <aside className="quiet-note">
      <p>
        This listing is free. If you ever want help with Google reviews, your
        Business Profile, or a simple website that matches this page, you’re
        welcome to write.
      </p>
      <ContactPerson compact />
    </aside>
  );
}
