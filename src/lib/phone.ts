/** Format US phone numbers as (509) 768-5469. Returns original string if unparseable. */
export function formatPhone(value: string | undefined | null): string {
  if (!value) return "";
  let digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    digits = digits.slice(1);
  }
  if (digits.length !== 10) {
    return value.trim();
  }
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** Digits-only for tel: links (E.164-style without +). */
export function phoneTelHref(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  let digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    digits = digits.slice(1);
  }
  if (digits.length !== 10) return undefined;
  return `tel:+1${digits}`;
}
