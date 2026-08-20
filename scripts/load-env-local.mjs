import { readFileSync } from "node:fs";
import path from "node:path";

export function loadEnvFiles(root) {
  for (const name of [".env.local", ".env"]) {
    const envPath = path.join(root, name);
    let text;
    try {
      text = readFileSync(envPath, "utf8");
    } catch {
      continue;
    }
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      const comment = value.indexOf(" #");
      if (comment !== -1) value = value.slice(0, comment).trim();
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}
