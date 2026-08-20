import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dest = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "dist",
  "client",
  "_redirects",
);
await mkdir(dirname(dest), { recursive: true });
await writeFile(dest, "/contractors/:slug /spokane/:slug 301\n");
