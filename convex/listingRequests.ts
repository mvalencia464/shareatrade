import { v } from "convex/values";
import { mutation } from "./_generated/server";

function optionalTrimmed(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export const submit = mutation({
  args: {
    kind: v.union(v.literal("add"), v.literal("update")),
    businessName: v.string(),
    category: v.optional(v.string()),
    city: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    gbpUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    /** Honeypot — leave blank. */
    companyWebsite: v.optional(v.string()),
  },
  returns: v.object({
    ok: v.boolean(),
  }),
  handler: async (ctx, args) => {
    // Silent success for bots that fill the honeypot.
    if (args.companyWebsite?.trim()) {
      return { ok: true };
    }

    const businessName = args.businessName.trim();
    if (businessName.length < 2) {
      throw new Error("Business name is required");
    }
    if (businessName.length > 120) {
      throw new Error("Business name is too long");
    }

    const notes = optionalTrimmed(args.notes);
    if (notes && notes.length > 1000) {
      throw new Error("Notes are too long");
    }

    await ctx.db.insert("listingRequests", {
      kind: args.kind,
      businessName,
      category: optionalTrimmed(args.category),
      city: optionalTrimmed(args.city),
      phone: optionalTrimmed(args.phone),
      email: optionalTrimmed(args.email),
      website: optionalTrimmed(args.website),
      gbpUrl: optionalTrimmed(args.gbpUrl),
      notes,
      status: "new",
      submittedAt: Date.now(),
    });

    return { ok: true };
  },
});
