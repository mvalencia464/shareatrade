import { appendFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dest = join(dirname(fileURLToPath(import.meta.url)), "..", "dist", "_redirects");
await appendFile(dest, "/contractors/:slug /spokane/:slug 301\n");
