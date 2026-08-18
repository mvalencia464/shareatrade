export function isGoogleCid(cid: string): boolean {
  return /^\d+$/.test(cid.trim());
}

export function keywordForCid(cid: string): string {
  return `cid:${cid.trim()}`;
}

export function dataforseoBaseUrl(): string {
  const sandbox = process.env.DATAFORSEO_SANDBOX === "1";
  return sandbox
    ? "https://sandbox.dataforseo.com"
    : "https://api.dataforseo.com";
}

export function dataforseoLocationName(): string {
  return (
    process.env.DATAFORSEO_LOCATION?.trim() ||
    "Spokane,Washington,United States"
  );
}

function authHeader(): string {
  const login = process.env.DATAFORSEO_LOGIN?.trim();
  const password = process.env.DATAFORSEO_PASSWORD?.trim();
  if (!login || !password) {
    throw new Error(
      "Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD in Convex env",
    );
  }
  return `Basic ${btoa(`${login}:${password}`)}`;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function dataforseoRequest(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${dataforseoBaseUrl()}${path}`, {
    method,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new Error(`DataForSEO ${path} returned non-JSON (${res.status})`);
  }
  if (!res.ok) {
    throw new Error(`DataForSEO ${path} failed ${res.status}: ${text.slice(0, 500)}`);
  }
  if (!isRecord(parsed)) {
    throw new Error(`DataForSEO ${path} returned unexpected payload`);
  }
  const statusCode = parsed.status_code;
  if (typeof statusCode === "number" && statusCode >= 40000) {
    const message =
      typeof parsed.status_message === "string"
        ? parsed.status_message
        : "error";
    throw new Error(`DataForSEO ${path}: ${statusCode} ${message}`);
  }
  return parsed;
}

export type GbpSnapshot = {
  rating?: number;
  reviewCount?: number;
  phone?: string;
  website?: string;
  gbpUrl?: string;
  claimed?: boolean;
};

function optionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

export function snapshotFromItem(item: Record<string, unknown>): GbpSnapshot {
  const ratingObj = isRecord(item.rating) ? item.rating : undefined;
  const rating = ratingObj ? optionalNumber(ratingObj.value) : undefined;
  const reviewCount = ratingObj
    ? optionalNumber(ratingObj.votes_count)
    : undefined;
  const website = optionalString(item.url);
  const checkUrl = optionalString(item.check_url);
  return {
    rating,
    reviewCount,
    phone: optionalString(item.phone),
    website,
    gbpUrl: checkUrl,
    claimed: typeof item.is_claimed === "boolean" ? item.is_claimed : undefined,
  };
}

export function firstBusinessItem(
  payload: Record<string, unknown>,
): Record<string, unknown> | null {
  const tasks = payload.tasks;
  if (!Array.isArray(tasks) || tasks.length === 0) return null;
  const task = tasks[0];
  if (!isRecord(task)) return null;
  const result = task.result;
  if (!Array.isArray(result) || result.length === 0) return null;
  const first = result[0];
  if (!isRecord(first)) return null;
  const items = first.items;
  if (!Array.isArray(items) || items.length === 0) return null;
  const item = items[0];
  if (!isRecord(item)) return null;
  if (typeof first.check_url === "string" && !item.check_url) {
    return { ...item, check_url: first.check_url };
  }
  return item;
}

export function taskTag(payload: Record<string, unknown>): string | undefined {
  const tasks = payload.tasks;
  if (!Array.isArray(tasks) || tasks.length === 0) return undefined;
  const task = tasks[0];
  if (!isRecord(task)) return undefined;
  const data = task.data;
  if (isRecord(data) && typeof data.tag === "string" && data.tag.trim()) {
    return data.tag.trim();
  }
  return undefined;
}

export function readyTaskIds(payload: Record<string, unknown>): string[] {
  const tasks = payload.tasks;
  if (!Array.isArray(tasks) || tasks.length === 0) return [];
  const ids: string[] = [];
  for (const task of tasks) {
    if (!isRecord(task) || !Array.isArray(task.result)) continue;
    for (const row of task.result) {
      if (isRecord(row) && typeof row.id === "string" && row.id.trim()) {
        ids.push(row.id.trim());
      }
    }
  }
  return ids;
}
