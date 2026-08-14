import type { Id } from "../_generated/dataModel";

export type LiRecord = {
  businessname?: string;
  contractorlicensenumber?: string;
  phonenumber?: string;
  city?: string;
  contractorlicensestatus?: string;
  licenseexpirationdate?: string;
  contractorlicensetypecodedesc?: string;
};

export type EnrichContractor = {
  _id: Id<"contractors">;
  name: string;
  phone?: string;
  city?: string;
  state?: string;
};

export type LicenseUpdate = {
  id: Id<"contractors">;
  licenseNumber: string;
  licenseStatus?: string;
  licenseType?: string;
  licenseState: string;
  licenseExpiresAt?: string;
  licenseMatchedBy: string;
  licenseUpdatedAt: number;
};

const LEGAL_SUFFIXES = new Set([
  "llc",
  "inc",
  "incorporated",
  "corp",
  "corporation",
  "co",
  "company",
  "ltd",
  "limited",
  "pllc",
  "lp",
  "llp",
  "pc",
  "the",
  "dba",
  "and",
]);

export function digitsPhone(value: string | undefined | null): string {
  if (value === undefined || value === null) return "";
  let d = String(value).replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
  return d.length === 10 ? d : "";
}

export function normalizeName(name: string | undefined | null): string {
  return String(name || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !LEGAL_SUFFIXES.has(w))
    .join(" ")
    .trim();
}

function statusRank(status: string | undefined): number {
  const s = (status || "").toUpperCase();
  if (s === "ACTIVE") return 0;
  if (s.includes("ACTIVE") || s === "RE-LICENSED") return 1;
  return 2;
}

function pickBest(records: LiRecord[]): LiRecord | null {
  if (!records.length) return null;
  return [...records].sort((a, b) => {
    const sr =
      statusRank(a.contractorlicensestatus) -
      statusRank(b.contractorlicensestatus);
    if (sr !== 0) return sr;
    return String(b.licenseexpirationdate || "").localeCompare(
      String(a.licenseexpirationdate || ""),
    );
  })[0] ?? null;
}

function namesSimilar(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  const ta = new Set(a.split(" "));
  const tb = new Set(b.split(" "));
  let overlap = 0;
  for (const t of ta) if (tb.has(t)) overlap += 1;
  const minSize = Math.min(ta.size, tb.size);
  return minSize > 0 && overlap / minSize >= 0.7;
}

function toLicenseUpdate(
  id: Id<"contractors">,
  record: LiRecord,
  matchedBy: string,
  now: number,
): LicenseUpdate {
  const expires = record.licenseexpirationdate
    ? String(record.licenseexpirationdate).slice(0, 10)
    : undefined;
  return {
    id,
    licenseNumber: record.contractorlicensenumber ?? "",
    licenseStatus: record.contractorlicensestatus || undefined,
    licenseType: record.contractorlicensetypecodedesc || undefined,
    licenseState: "WA",
    licenseExpiresAt: expires,
    licenseMatchedBy: matchedBy,
    licenseUpdatedAt: now,
  };
}

export function matchLicenses(
  contractors: EnrichContractor[],
  liRecords: LiRecord[],
  now: number,
): {
  updates: LicenseUpdate[];
  ambiguous: number;
  unmatched: number;
  matchedBy: Record<string, number>;
} {
  const eligible = contractors.filter(
    (c) => (c.state || "").toLowerCase() !== "idaho",
  );

  const byPhone = new Map<string, LiRecord[]>();
  const byName = new Map<string, LiRecord[]>();
  for (const r of liRecords) {
    const phone = digitsPhone(r.phonenumber);
    if (phone) {
      const list = byPhone.get(phone) ?? [];
      list.push(r);
      byPhone.set(phone, list);
    }
    const n = normalizeName(r.businessname);
    if (n) {
      const list = byName.get(n) ?? [];
      list.push(r);
      byName.set(n, list);
    }
  }

  const updates: LicenseUpdate[] = [];
  let ambiguous = 0;
  let unmatched = 0;

  for (const c of eligible) {
    const phone = digitsPhone(c.phone);
    const name = normalizeName(c.name);
    let match: LiRecord | null = null;
    let matchedBy = "";

    if (phone && byPhone.has(phone)) {
      const candidates = byPhone.get(phone) ?? [];
      const nameFiltered = candidates.filter((r) =>
        namesSimilar(normalizeName(r.businessname), name),
      );
      const pool = nameFiltered.length ? nameFiltered : candidates;
      if (pool.length === 1 || nameFiltered.length === 1) {
        match = pickBest(nameFiltered.length === 1 ? nameFiltered : pool);
        matchedBy = nameFiltered.length ? "phone+name" : "phone";
      } else if (pool.length > 1) {
        const active = pool.filter(
          (r) => (r.contractorlicensestatus || "").toUpperCase() === "ACTIVE",
        );
        if (active.length === 1) {
          match = active[0] ?? null;
          matchedBy = "phone+unique-active";
        } else {
          const named = (active.length ? active : pool).filter((r) =>
            namesSimilar(normalizeName(r.businessname), name),
          );
          const sameName = new Set(
            named.map((r) => normalizeName(r.businessname)),
          );
          if (named.length >= 1 && sameName.size === 1) {
            match = pickBest(named);
            matchedBy = "phone+same-name";
          } else {
            ambiguous += 1;
            continue;
          }
        }
      }
    }

    if (!match && name && byName.has(name)) {
      const candidates = byName.get(name) ?? [];
      const active = candidates.filter(
        (r) => (r.contractorlicensestatus || "").toUpperCase() === "ACTIVE",
      );
      const pool = active.length ? active : candidates;
      if (pool.length === 1) {
        match = pool[0] ?? null;
        matchedBy = "exact-name";
      } else {
        const city = (c.city || "").toLowerCase();
        const cityHits = pool.filter(
          (r) => (r.city || "").toLowerCase() === city && city,
        );
        if (cityHits.length === 1) {
          match = cityHits[0] ?? null;
          matchedBy = "exact-name+city";
        } else if (cityHits.length > 1) {
          match = pickBest(cityHits);
          matchedBy = "exact-name+city-best";
        } else {
          ambiguous += 1;
          continue;
        }
      }
    }

    if (match?.contractorlicensenumber) {
      updates.push(toLicenseUpdate(c._id, match, matchedBy, now));
    } else {
      unmatched += 1;
    }
  }

  const matchedBy: Record<string, number> = {};
  for (const u of updates) {
    matchedBy[u.licenseMatchedBy] = (matchedBy[u.licenseMatchedBy] ?? 0) + 1;
  }

  return { updates, ambiguous, unmatched, matchedBy };
}
