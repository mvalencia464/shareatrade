import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "company-site");

const packs = [
  {
    id: "hvac",
    prompt:
      "Photorealistic photo of an HVAC technician in a residential backyard working on an outdoor heat pump, inland northwest suburban house, natural daylight, no text, no logo",
  },
  {
    id: "roofing",
    prompt:
      "Photorealistic photo of roofers installing architectural shingles on a two-story house, snow-ready roof, suburban Pacific Northwest, natural daylight, no text, no logo",
  },
  {
    id: "pest",
    prompt:
      "Photorealistic photo of a pest control technician in a work uniform inspecting the foundation of a suburban house, spray tank nearby, natural daylight, no text, no logo",
  },
  {
    id: "plumbing",
    prompt:
      "Photorealistic photo of a plumber under a kitchen sink repairing a pipe, realistic tools, residential kitchen, natural indoor light, no text, no logo",
  },
  {
    id: "electrical",
    prompt:
      "Photorealistic photo of an electrician at a home breaker panel, careful work, residential garage, natural light, no text, no logo",
  },
  {
    id: "garage",
    prompt:
      "Photorealistic photo of a technician repairing a residential garage door opener on a raised door, suburban driveway, daylight, no text, no logo",
  },
  {
    id: "landscape",
    prompt:
      "Photorealistic photo of a landscaper mowing and edging a tidy suburban lawn, Pacific Northwest greenery, daylight, no text, no logo",
  },
  {
    id: "paint",
    prompt:
      "Photorealistic photo of a painter rolling a living room wall, drop cloths on the floor, residential interior, natural light, no text, no logo",
  },
  {
    id: "tree",
    prompt:
      "Photorealistic photo of a tree-service crew trimming a large tree beside a house, safety gear, suburban lot, daylight, no text, no logo",
  },
  {
    id: "fence",
    prompt:
      "Photorealistic photo of fence contractors setting a wood privacy fence in a backyard, posts and level, daylight, no text, no logo",
  },
  {
    id: "concrete",
    prompt:
      "Photorealistic photo of concrete workers finishing a residential driveway slab, trowels, suburban house in background, daylight, no text, no logo",
  },
  {
    id: "cleaning",
    prompt:
      "Photorealistic photo of a house cleaner wiping a bright kitchen counter, realistic residential interior, natural light, no text, no logo",
  },
  {
    id: "gutter",
    prompt:
      "Photorealistic photo of a technician on a ladder cleaning rain gutters on a suburban house, daylight, no text, no logo",
  },
  {
    id: "siding",
    prompt:
      "Photorealistic photo of contractors installing vinyl siding and a new window on a house exterior, daylight, no text, no logo",
  },
  {
    id: "handyman",
    prompt:
      "Photorealistic photo of a handyman assembling a bathroom vanity in a residential remodel, tools on the floor, natural light, no text, no logo",
  },
  {
    id: "default",
    prompt:
      "Photorealistic photo of a local home-service contractor talking with a homeowner on a suburban porch, Pacific Northwest, daylight, no text, no logo",
  },
];

function imageUrl(prompt, seed) {
  const params = new URLSearchParams({
    width: "1200",
    height: "720",
    nologo: "true",
    model: "flux",
    seed: String(seed),
  });
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params}`;
}

async function download(pack, index) {
  const dest = join(outDir, `${pack.id}.jpg`);
  const url = imageUrl(pack.prompt, 1500 + index);
  console.log(`Generating ${pack.id}…`);
  const response = await fetch(url, {
    headers: { Accept: "image/*" },
  });
  if (!response.ok) {
    throw new Error(`${pack.id}: HTTP ${response.status}`);
  }
  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("image") && !type.includes("octet-stream")) {
    const body = await response.text();
    throw new Error(`${pack.id}: unexpected type ${type} ${body.slice(0, 120)}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 8_000) {
    throw new Error(`${pack.id}: file too small (${bytes.length} bytes)`);
  }
  await writeFile(dest, bytes);
  console.log(`  wrote ${dest} (${Math.round(bytes.length / 1024)} KB)`);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  for (const [index, pack] of packs.entries()) {
    await download(pack, index);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
