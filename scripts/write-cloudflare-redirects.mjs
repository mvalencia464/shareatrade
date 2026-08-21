import {
  cp,
  mkdir,
  readFile,
  readdir,
  writeFile,
} from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(root, "dist");
const clientDir = join(distDir, "client");
const serverDir = join(distDir, "server");

await mkdir(clientDir, { recursive: true });

const skipDirs = new Set(["_astro", "chunks"]);
const prerenderDirs = (await readdir(clientDir, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && !skipDirs.has(entry.name))
  .map((entry) => entry.name);

const redirectLines = ["/contractors/:slug /spokane/:slug/ 301"];
for (const name of prerenderDirs) {
  redirectLines.push(`/${name}/:slug /${name}/:slug/ 301`);
}
redirectLines.push("/go/:market/:slug /go/:market/:slug/ 301");
await writeFile(join(clientDir, "_redirects"), `${redirectLines.join("\n")}\n`);

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
  exclude.push(`/${name}/`, `/${name}/index.html`);
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

const clientEntries = await readdir(clientDir);
for (const name of clientEntries) {
  await cp(join(clientDir, name), join(distDir, name), { recursive: true });
}
await writeFile(join(distDir, ".assetsignore"), "server\nclient\n");

async function patchWrangler(path) {
  let raw;
  try {
    raw = await readFile(path, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return;
    }
    throw error;
  }
  const config = JSON.parse(raw);
  config.assets = {
    ...config.assets,
    html_handling: "force-trailing-slash",
    not_found_handling: "none",
    run_worker_first: ["/go/*", "/*/*", "!/_astro/*"],
  };
  config.compatibility_flags = [
    ...new Set([
      ...(Array.isArray(config.compatibility_flags) ? config.compatibility_flags : []),
      "nodejs_compat",
      "assets_navigation_has_no_effect",
    ]),
  ];
  await writeFile(path, `${JSON.stringify(config, null, 2)}\n`);
}

await patchWrangler(join(serverDir, "wrangler.json"));
await patchWrangler(join(distDir, "wrangler.json"));
