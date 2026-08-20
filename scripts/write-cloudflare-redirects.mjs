import {
  cp,
  mkdir,
  readdir,
  writeFile,
} from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = join(root, "dist", "client");
const serverDir = join(root, "dist", "server");

function debugLog(hypothesisId, message, data) {
  // #region agent log
  fetch("http://127.0.0.1:7590/ingest/c829cf03-ac4c-4454-87c8-a8439c4ca158", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "574066",
    },
    body: JSON.stringify({
      sessionId: "574066",
      runId: "postbuild",
      hypothesisId,
      location: "scripts/write-cloudflare-redirects.mjs",
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

await mkdir(clientDir, { recursive: true });
await writeFile(
  join(clientDir, "_redirects"),
  "/contractors/:slug /spokane/:slug 301\n",
);

const skipDirs = new Set(["_astro", "chunks"]);
const prerenderDirs = (await readdir(clientDir, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && !skipDirs.has(entry.name))
  .map((entry) => entry.name);

const exclude = [
  "/",
  "/_astro/*",
  "/favicon.ico",
  "/favicon.svg",
  "/logo.svg",
  "/robots.txt",
  "/mauricio.webp",
];
for (const name of prerenderDirs) {
  exclude.push(`/${name}`, `/${name}/`);
}

const routes = {
  version: 1,
  include: ["/*/*", "/go/*"],
  exclude,
};
await writeFile(join(clientDir, "_routes.json"), `${JSON.stringify(routes, null, 2)}\n`);

await cp(join(serverDir, "entry.mjs"), join(clientDir, "_worker.js"));
await cp(join(serverDir, "chunks"), join(clientDir, "chunks"), { recursive: true });
await cp(
  join(serverDir, "virtual_astro_middleware.mjs"),
  join(clientDir, "virtual_astro_middleware.mjs"),
);

debugLog("D", "prepared pages output", {
  prerenderDirs,
  hasBoise: prerenderDirs.includes("boise"),
  hasWhy: prerenderDirs.includes("why"),
  include: routes.include,
  excludeCount: exclude.length,
  workerCopied: true,
});
