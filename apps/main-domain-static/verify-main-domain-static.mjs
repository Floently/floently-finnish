import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Deployment trigger after reconnecting the Vercel Git integration on 2026-08-31.
const root = path.dirname(fileURLToPath(import.meta.url));
const required = [
  "index.html",
  "learn/index.html",
  "read/index.html",
  "create/index.html",
  "learn/privacy/index.html",
  "learn/terms/index.html",
  "learn/support/index.html",
  "learn/delete-account/index.html",
  "vercel.json",
  "sitemap.xml",
  "floently-finnish-icon.png",
];

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) {
    throw new Error(`Missing required main-domain file: ${file}`);
  }
}

const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const home = read("index.html");
const learn = read("learn/index.html");
const readPage = read("read/index.html");
const createPage = read("create/index.html");
const privacy = read("learn/privacy/index.html");
const deletion = read("learn/delete-account/index.html");
const config = JSON.parse(read("vercel.json"));

for (const marker of [
  "Floently product gateway",
  "Choose your Floently product",
  "Floently Learn",
  "Floently Read",
  "Floently Create",
  "Go to Learn",
  "Go to Read",
  "Go to Create",
  "Prepare for YKI and workplace Finnish",
  "Listen to text in natural AI voices",
  "Repurpose one source into posts, captions, scripts, and newsletters",
]) {
  if (!home.includes(marker)) throw new Error(`Restored Floently gateway marker missing: ${marker}`);
}
if (/coming soon/i.test(home)) throw new Error("Floently home regressed to Coming Soon product messaging");
if (home.includes("Learn Finnish for YKI, work and everyday life")) {
  throw new Error("Floently home regressed to the Learn-only master landing");
}

for (const marker of [
  "AI-Powered Text to Speech",
  "Listen to any text",
  "anytime, anywhere",
  "Join thousands already listening",
  "Lifelike Voices",
  "Easy Import",
  "Customizable",
  "People are listening",
  "Start listening today",
]) {
  if (!readPage.includes(marker)) throw new Error(`Restored Read marker missing: ${marker}`);
}
if (/coming soon/i.test(readPage)) throw new Error("Floently Read regressed to the Coming Soon placeholder");
for (let index = 1; index <= 8; index += 1) {
  const asset = `landing_page_picture_${index}.png`;
  if (!readPage.includes(asset)) throw new Error(`Floently Read carousel lost ${asset}`);
}

// Create remains a separate product surface; this restoration intentionally
// changes only the master home and Read landing.
if (!createPage.includes("Floently Create")) throw new Error("Create page identity was lost");

for (const marker of ["Practice YKI Finnish", "Improve Finnish speaking", "Build Finnish for work"]) {
  if (!learn.includes(marker)) throw new Error(`Learn content regressed: ${marker}`);
}
if (!privacy.includes("Floently Finnish Privacy Policy")) throw new Error("Privacy page identity marker is missing");
if (!deletion.includes("Delete Your Floently Finnish Account")) throw new Error("Deletion page identity marker is missing");

const expected = new Map([
  ["/privacy", "/learn/privacy"],
  ["/privacy-policy", "/learn/privacy"],
  ["/learn/privacy-policy", "/learn/privacy"],
  ["/legal/privacy-policy", "/learn/privacy"],
  ["/delete-account", "/learn/delete-account"],
  ["/account-deletion", "/learn/delete-account"],
  ["/learn/account-deletion", "/learn/delete-account"],
  ["/legal/account-deletion", "/learn/delete-account"],
  ["/terms", "/learn/terms"],
  ["/support", "/learn/support"],
]);
const actual = new Map((config.redirects ?? []).map((item) => [item.source, item.destination]));
for (const [source, destination] of expected) {
  if (actual.get(source) !== destination) throw new Error(`Missing redirect lock: ${source} -> ${destination}`);
}

console.log("FLOENTLY_MASTER_ORIGINAL_GATEWAY=PASS");
console.log("FLOENTLY_MASTER_READ_FULL_LANDING=PASS");
console.log("FLOENTLY_MASTER_READ_EIGHT_PHOTOS=PASS");
console.log("FLOENTLY_MASTER_LEARN_CONTENT=PASS");
console.log("FLOENTLY_MASTER_LEGAL_FILES=PASS");
console.log("FLOENTLY_MASTER_LEGAL_ALIASES=PASS");
console.log("FLOENTLY_MASTER_DOMAIN_REGRESSION_LOCK=PASS");
