import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  query,
  type QueryCtx,
} from "./_generated/server";

const socialLinkValidator = v.object({
  platform: v.string(),
  url: v.string(),
});

const licenseFields = {
  licenseNumber: v.optional(v.string()),
  licenseStatus: v.optional(v.string()),
  licenseType: v.optional(v.string()),
  licenseState: v.optional(v.string()),
  licenseExpiresAt: v.optional(v.string()),
  licenseMatchedBy: v.optional(v.string()),
  licenseUpdatedAt: v.optional(v.number()),
};

const contractorCardValidator = v.object({
  _id: v.id("contractors"),
  slug: v.string(),
  name: v.string(),
  category: v.string(),
  city: v.optional(v.string()),
  rating: v.optional(v.number()),
  reviewCount: v.optional(v.number()),
  phone: v.optional(v.string()),
  email: v.optional(v.string()),
  logoUrl: v.optional(v.string()),
  website: v.optional(v.string()),
  gbpUrl: v.string(),
  socials: v.array(socialLinkValidator),
});

const contractorDetailValidator = v.object({
  _id: v.id("contractors"),
  _creationTime: v.number(),
  slug: v.string(),
  name: v.string(),
  googleCid: v.string(),
  googleMapsRank: v.number(),
  category: v.string(),
  city: v.optional(v.string()),
  state: v.optional(v.string()),
  website: v.optional(v.string()),
  gbpUrl: v.string(),
  phone: v.optional(v.string()),
  email: v.optional(v.string()),
  address: v.optional(v.string()),
  rating: v.optional(v.number()),
  reviewCount: v.optional(v.number()),
  claimed: v.boolean(),
  logoUrl: v.optional(v.string()),
  mainImageUrl: v.optional(v.string()),
  socials: v.array(socialLinkValidator),
  sourceUpdatedAt: v.number(),
  ...licenseFields,
});

const contractorInputValidator = v.object({
  slug: v.string(),
  name: v.string(),
  googleCid: v.string(),
  googleMapsRank: v.number(),
  category: v.string(),
  city: v.optional(v.string()),
  state: v.optional(v.string()),
  website: v.optional(v.string()),
  gbpUrl: v.string(),
  phone: v.optional(v.string()),
  email: v.optional(v.string()),
  address: v.optional(v.string()),
  rating: v.optional(v.number()),
  reviewCount: v.optional(v.number()),
  claimed: v.boolean(),
  logoUrl: v.optional(v.string()),
  mainImageUrl: v.optional(v.string()),
  socials: v.array(socialLinkValidator),
  sourceUpdatedAt: v.number(),
});

async function loadAllContractors(ctx: QueryCtx) {
  // Directory is ~1k filtered rows; full collect is intentional for client-side filters.
  return await ctx.db.query("contractors").collect();
}

function sortByRatingThenName<T extends { rating?: number; name: string }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    const rankA = a.rating ?? 0;
    const rankB = b.rating ?? 0;
    if (rankB !== rankA) return rankB - rankA;
    return a.name.localeCompare(b.name);
  });
}

export const list = query({
  args: {},
  returns: v.array(contractorCardValidator),
  handler: async (ctx) => {
    const contractors = await loadAllContractors(ctx);
    return sortByRatingThenName(
      contractors.map((c) => ({
        _id: c._id,
        slug: c.slug,
        name: c.name,
        category: c.category,
        city: c.city,
        rating: c.rating,
        reviewCount: c.reviewCount,
        phone: c.phone,
        email: c.email,
        logoUrl: c.logoUrl,
        website: c.website,
        gbpUrl: c.gbpUrl,
        socials: c.socials,
      })),
    );
  },
});

/** Slim ordered index for detail prev/next (~70KB vs full list ~776KB). */
export const listNav = query({
  args: {},
  returns: v.array(
    v.object({
      slug: v.string(),
      name: v.string(),
    }),
  ),
  handler: async (ctx) => {
    const contractors = await loadAllContractors(ctx);
    return sortByRatingThenName(
      contractors.map((c) => ({
        slug: c.slug,
        name: c.name,
        rating: c.rating,
      })),
    ).map(({ slug, name }) => ({ slug, name }));
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(contractorDetailValidator, v.null()),
  handler: async (ctx, args) => {
    const contractor = await ctx.db
      .query("contractors")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    return contractor;
  },
});

export const listForEnrichment = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("contractors"),
      name: v.string(),
      phone: v.optional(v.string()),
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      licenseNumber: v.optional(v.string()),
    }),
  ),
  handler: async (ctx) => {
    const contractors = await loadAllContractors(ctx);
    return contractors.map((c) => ({
      _id: c._id,
      name: c.name,
      phone: c.phone,
      city: c.city,
      state: c.state,
      licenseNumber: c.licenseNumber,
    }));
  },
});

export const upsertBatch = internalMutation({
  args: {
    contractors: v.array(contractorInputValidator),
  },
  returns: v.object({
    inserted: v.number(),
    updated: v.number(),
  }),
  handler: async (ctx, args) => {
    let inserted = 0;
    let updated = 0;

    for (const contractor of args.contractors) {
      const existing = await ctx.db
        .query("contractors")
        .withIndex("by_google_cid", (q) =>
          q.eq("googleCid", contractor.googleCid),
        )
        .unique();

      if (existing) {
        // Preserve license enrichment across CSV re-imports.
        await ctx.db.patch(existing._id, {
          ...contractor,
          licenseNumber: existing.licenseNumber,
          licenseStatus: existing.licenseStatus,
          licenseType: existing.licenseType,
          licenseState: existing.licenseState,
          licenseExpiresAt: existing.licenseExpiresAt,
          licenseMatchedBy: existing.licenseMatchedBy,
          licenseUpdatedAt: existing.licenseUpdatedAt,
        });
        updated += 1;
      } else {
        await ctx.db.insert("contractors", contractor);
        inserted += 1;
      }
    }

    return { inserted, updated };
  },
});

export const patchLicenses = internalMutation({
  args: {
    updates: v.array(
      v.object({
        id: v.id("contractors"),
        licenseNumber: v.string(),
        licenseStatus: v.optional(v.string()),
        licenseType: v.optional(v.string()),
        licenseState: v.string(),
        licenseExpiresAt: v.optional(v.string()),
        licenseMatchedBy: v.string(),
        licenseUpdatedAt: v.number(),
      }),
    ),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    for (const update of args.updates) {
      const { id, ...fields } = update;
      await ctx.db.patch(id, fields);
    }
    return args.updates.length;
  },
});

export const clearAll = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const all = await ctx.db.query("contractors").collect();
    for (const doc of all) {
      await ctx.db.delete(doc._id);
    }
    return all.length;
  },
});
