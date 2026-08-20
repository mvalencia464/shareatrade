import {
  cp,
  mkdir,
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

const clientEntries = await readdir(clientDir);
for (const name of clientEntries) {
  await cp(join(clientDir, name), join(distDir, name), { recursive: true });
}
await writeFile(join(distDir, ".assetsignore"), "server\nclient\n");
