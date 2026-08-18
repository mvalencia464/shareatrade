import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import {
  dataforseoLocationName,
  dataforseoRequest,
  firstBusinessItem,
  isGoogleCid,
  keywordForCid,
  readyTaskIds,
  snapshotFromItem,
  taskTag,
} from "./lib/dataforseo";

const POST_BATCH = 100;
const PATCH_BATCH = 50;
const COLLECT_CAP = 400;

function isContractorId(value: string): value is Id<"contractors"> {
  return value.length > 0 && !value.includes(":");
}

export const postTasks = internalAction({
  args: {
    dryRun: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    eligible: v.number(),
    skipped: v.number(),
    posted: v.number(),
    cost: v.number(),
  }),
  handler: async (ctx, args) => {
    const contractors = await ctx.runQuery(
      internal.contractors.listForEnrichment,
      {},
    );
    const withGoogleCid = contractors.filter((c) => isGoogleCid(c.googleCid));
    const skipped = contractors.length - withGoogleCid.length;
    const limited =
      typeof args.limit === "number" && args.limit > 0
        ? withGoogleCid.slice(0, Math.floor(args.limit))
        : withGoogleCid;

    if (args.dryRun) {
      console.log("GBP refresh postTasks dry-run", {
        eligible: limited.length,
        skipped,
      });
      return {
        eligible: limited.length,
        skipped,
        posted: 0,
        cost: 0,
      };
    }

    const locationName = dataforseoLocationName();
    let posted = 0;
    let cost = 0;

    for (let i = 0; i < limited.length; i += POST_BATCH) {
      const batch = limited.slice(i, i + POST_BATCH);
      const payload = batch.map((c) => ({
        language_code: "en",
        location_name: locationName,
        keyword: keywordForCid(c.googleCid),
        tag: c._id,
      }));
      const response = await dataforseoRequest(
        "POST",
        "/v3/business_data/google/my_business_info/task_post",
        payload,
      );
      const batchCost =
        typeof response.cost === "number" ? response.cost : 0;
      const count =
        typeof response.tasks_count === "number"
          ? response.tasks_count
          : batch.length;
      cost += batchCost;
      posted += count;
    }

    console.log("GBP refresh postTasks", {
      eligible: limited.length,
      skipped,
      posted,
      cost,
    });

    return {
      eligible: limited.length,
      skipped,
      posted,
      cost,
    };
  },
});

export const collectReady = internalAction({
  args: {
    dryRun: v.optional(v.boolean()),
    maxTasks: v.optional(v.number()),
  },
  returns: v.object({
    ready: v.number(),
    collected: v.number(),
    patched: v.number(),
    empty: v.number(),
    unmatchedTag: v.number(),
  }),
  handler: async (ctx, args) => {
    const cap =
      typeof args.maxTasks === "number" && args.maxTasks > 0
        ? Math.floor(args.maxTasks)
        : COLLECT_CAP;

    const readyPayload = await dataforseoRequest(
      "GET",
      "/v3/business_data/google/my_business_info/tasks_ready",
    );
    const ids = readyTaskIds(readyPayload).slice(0, cap);

    let collected = 0;
    let empty = 0;
    let unmatchedTag = 0;
    const updates: Array<{
      id: Id<"contractors">;
      rating?: number;
      reviewCount?: number;
      phone?: string;
      website?: string;
      gbpUrl?: string;
      claimed?: boolean;
      sourceUpdatedAt: number;
    }> = [];
    const now = Date.now();

    for (const taskId of ids) {
      const payload = await dataforseoRequest(
        "GET",
        `/v3/business_data/google/my_business_info/task_get/${taskId}`,
      );
      collected += 1;
      const tag = taskTag(payload);
      const item = firstBusinessItem(payload);
      if (!item) {
        empty += 1;
        continue;
      }
      if (!tag || !isContractorId(tag)) {
        unmatchedTag += 1;
        continue;
      }
      const snap = snapshotFromItem(item);
      if (
        snap.rating === undefined &&
        snap.reviewCount === undefined &&
        !snap.phone &&
        !snap.website &&
        !snap.gbpUrl &&
        snap.claimed === undefined
      ) {
        empty += 1;
        continue;
      }
      updates.push({
        id: tag,
        ...snap,
        sourceUpdatedAt: now,
      });
    }

    let patched = 0;
    if (!args.dryRun) {
      for (let i = 0; i < updates.length; i += PATCH_BATCH) {
        const batch = updates.slice(i, i + PATCH_BATCH);
        patched += await ctx.runMutation(internal.contractors.patchGbpSnapshots, {
          updates: batch,
        });
      }
    }

    console.log("GBP refresh collectReady", {
      ready: ids.length,
      collected,
      patched: args.dryRun ? 0 : patched,
      empty,
      unmatchedTag,
    });

    return {
      ready: ids.length,
      collected,
      patched: args.dryRun ? 0 : patched,
      empty,
      unmatchedTag,
    };
  },
});
