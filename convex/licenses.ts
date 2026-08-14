import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { matchLicenses, type LiRecord } from "./lib/liMatch";

const DATASET = "https://data.wa.gov/resource/m8qx-ubtq.json";
const PAGE_SIZE = 1000;
const BATCH_SIZE = 50;
const PHONE_WHERE = "phonenumber >= 5090000000 and phonenumber < 5100000000";
const CITY_WHERE =
  "upper(city) in('SPOKANE','SPOKANE VALLEY','LIBERTY LAKE','MEAD','CHENEY','AIRWAY HEIGHTS','VERADALE','COLBERT','NINE MILE FALLS','MEDICAL LAKE','OTIS ORCHARDS','GREENACRES','HAUSER','NEWMAN LAKE','DEER PARK','TUMTUM','ELK','ROCKFORD')";

async function fetchPage(where: string, offset: number): Promise<LiRecord[]> {
  const url = new URL(DATASET);
  url.searchParams.set(
    "$select",
    [
      "businessname",
      "contractorlicensenumber",
      "phonenumber",
      "city",
      "state",
      "contractorlicensestatus",
      "licenseexpirationdate",
      "contractorlicensetypecodedesc",
    ].join(","),
  );
  url.searchParams.set("$where", where);
  url.searchParams.set("$limit", String(PAGE_SIZE));
  url.searchParams.set("$offset", String(offset));
  url.searchParams.set("$order", "contractorlicensenumber");

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`L&I fetch failed ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as LiRecord[];
}

async function fetchAll(where: string): Promise<LiRecord[]> {
  const rows: LiRecord[] = [];
  let offset = 0;
  for (;;) {
    const page = await fetchPage(where, offset);
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return rows;
}

export const enrichWa = internalAction({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  returns: v.object({
    eligible: v.number(),
    matched: v.number(),
    ambiguous: v.number(),
    unmatched: v.number(),
    patched: v.number(),
    matchedBy: v.record(v.string(), v.number()),
  }),
  handler: async (ctx, args) => {
    const contractors = await ctx.runQuery(
      internal.contractors.listForEnrichment,
      {},
    );
    const phoneRecords = await fetchAll(PHONE_WHERE);
    const cityRecords = await fetchAll(CITY_WHERE);
    const byLicense = new Map<string, LiRecord>();
    for (const r of [...phoneRecords, ...cityRecords]) {
      if (r.contractorlicensenumber) {
        byLicense.set(r.contractorlicensenumber, r);
      }
    }
    const liRecords = [...byLicense.values()];
    const eligible = contractors.filter(
      (c) => (c.state || "").toLowerCase() !== "idaho",
    );
    const result = matchLicenses(eligible, liRecords, Date.now());

    let patched = 0;
    if (!args.dryRun) {
      for (let i = 0; i < result.updates.length; i += BATCH_SIZE) {
        const batch = result.updates.slice(i, i + BATCH_SIZE);
        patched += await ctx.runMutation(internal.contractors.patchLicenses, {
          updates: batch,
        });
      }
    }

    console.log("WA L&I enrich", {
      eligible: eligible.length,
      matched: result.updates.length,
      ambiguous: result.ambiguous,
      unmatched: result.unmatched,
      patched,
    });

    return {
      eligible: eligible.length,
      matched: result.updates.length,
      ambiguous: result.ambiguous,
      unmatched: result.unmatched,
      patched,
      matchedBy: result.matchedBy,
    };
  },
});
