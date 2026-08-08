import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const socialLink = v.object({
  platform: v.string(),
  url: v.string(),
});

export default defineSchema({
  contractors: defineTable({
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
    socials: v.array(socialLink),
    sourceUpdatedAt: v.number(),
    licenseNumber: v.optional(v.string()),
    licenseStatus: v.optional(v.string()),
    licenseType: v.optional(v.string()),
    licenseState: v.optional(v.string()),
    licenseExpiresAt: v.optional(v.string()),
    licenseMatchedBy: v.optional(v.string()),
    licenseUpdatedAt: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["category"])
    .index("by_city", ["city"])
    .index("by_category_and_city", ["category", "city"])
    .index("by_google_cid", ["googleCid"])
    .index("by_rating", ["rating"]),

  listingRequests: defineTable({
    kind: v.union(v.literal("add"), v.literal("update")),
    businessName: v.string(),
    category: v.optional(v.string()),
    city: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    gbpUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.union(
      v.literal("new"),
      v.literal("reviewed"),
      v.literal("closed"),
    ),
    submittedAt: v.number(),
  }).index("by_status", ["status"]),
});
