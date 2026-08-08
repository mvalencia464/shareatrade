import { useMutation } from "convex/react";
import { useState, type FormEvent } from "react";
import { api } from "../../convex/_generated/api";
import { ConvexProvider } from "./ConvexProvider";

type RequestKind = "add" | "update";

function ListingRequestFormInner() {
  const submit = useMutation(api.listingRequests.submit);
  const [kind, setKind] = useState<RequestKind>("add");
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [gbpUrl, setGbpUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("saving");
    setError("");
    try {
      await submit({
        kind,
        businessName,
        category: category || undefined,
        city: city || undefined,
        phone: phone || undefined,
        email: email || undefined,
        website: website || undefined,
        gbpUrl: gbpUrl || undefined,
        notes: notes || undefined,
        companyWebsite: honeypot || undefined,
      });
      setStatus("done");
      setBusinessName("");
      setCategory("");
      setCity("");
      setPhone("");
      setEmail("");
      setWebsite("");
      setGbpUrl("");
      setNotes("");
      setHoneypot("");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (status === "done") {
    return (
      <div className="request-success" role="status">
        <h2>Request received</h2>
        <p>
          Thanks. Google Business Profile is our source of truth, so make sure
          your GBP listing is accurate. We’ll review requests and refresh the
          directory as needed.
        </p>
        <button
          type="button"
          className="button button-secondary"
          onClick={() => setStatus("idle")}
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form className="request-form" onSubmit={onSubmit}>
      <fieldset className="request-kind">
        <legend>What do you need?</legend>
        <label className="request-choice">
          <input
            type="radio"
            name="kind"
            value="add"
            checked={kind === "add"}
            onChange={() => setKind("add")}
          />
          <span>
            <strong>Add my business</strong>
            <small>Not in the directory yet</small>
          </span>
        </label>
        <label className="request-choice">
          <input
            type="radio"
            name="kind"
            value="update"
            checked={kind === "update"}
            onChange={() => setKind("update")}
          />
          <span>
            <strong>Listing looks wrong</strong>
            <small>Update GBP first, then tell us</small>
          </span>
        </label>
      </fieldset>

      {kind === "update" ? (
        <p className="request-callout">
          Edit your{" "}
          <a
            href="https://business.google.com/"
            target="_blank"
            rel="noreferrer"
          >
            Google Business Profile
          </a>{" "}
          first (phone, address, website, hours, photos). This directory is not
          the source of truth—we sync from GBP when we refresh the directory.
        </p>
      ) : (
        <p className="request-callout">
          We primarily list Spokane-area contractors from public Google Business
          Profile data. Having an accurate GBP listing makes it much easier to
          include you.
        </p>
      )}

      <label>
        Business name
        <input
          required
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          maxLength={120}
          autoComplete="organization"
        />
      </label>

      <div className="request-grid">
        <label>
          Trade / category
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Plumber"
            maxLength={80}
          />
        </label>
        <label>
          City
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Spokane"
            maxLength={80}
            autoComplete="address-level2"
          />
        </label>
      </div>

      <div className="request-grid">
        <label>
          Phone
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            autoComplete="tel"
            maxLength={40}
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            maxLength={120}
          />
        </label>
      </div>

      <label>
        Website
        <input
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://"
          maxLength={300}
        />
      </label>

      <label>
        Google Business Profile link
        <input
          type="url"
          value={gbpUrl}
          onChange={(e) => setGbpUrl(e.target.value)}
          placeholder="https://maps.google.com/… or GBP share link"
          maxLength={500}
        />
      </label>

      <label>
        Notes
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder={
            kind === "update"
              ? "What changed on your GBP that we should pick up?"
              : "Anything else that helps us find the right listing?"
          }
        />
      </label>

      <label className="request-honeypot" aria-hidden="true">
        Company website
        <input
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </label>

      {status === "error" && error ? (
        <p className="request-error" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className="button button-primary"
        disabled={status === "saving"}
      >
        {status === "saving" ? "Sending…" : "Submit request"}
      </button>
    </form>
  );
}

export function ListingRequestForm({ convexUrl }: { convexUrl: string }) {
  return (
    <ConvexProvider url={convexUrl}>
      <ListingRequestFormInner />
    </ConvexProvider>
  );
}
