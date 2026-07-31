import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
  "Floently Learn",
  "Floently Read",
  "Floently Create",
  "Available now",
  "Coming soon",
  "YKI preparation",
  "Grammar in context",
  "Speaking and role-play",
  "Finnish for work",
]) {
  if (!home.includes(marker)) throw new Error(`Missing suite marker: ${marker}`);
}

for (const [name, page] of [["read", readPage], ["create", createPage]]) {
  if (!page.includes("Coming soon")) throw new Error(`${name} page lost Coming soon`);
  if (!page.includes("Explore Floently Learn")) throw new Error(`${name} page lost Learn link`);
}

for (const marker of ["Practice YKI Finnish", "Improve Finnish speaking", "Build Finnish for work"]) {
  if (!learn.includes(marker)) throw new Error(`Learn content regressed: ${marker}`);
}

if (!privacy.includes("Floently Finnish Privacy Policy")) {
  throw new Error("Privacy page identity marker is missing");
}
if (!deletion.includes("Delete Your Floently Finnish Account")) {
  throw new Error("Deletion page identity marker is missing");
}

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
  if (actual.get(source) !== destination) {
    throw new Error(`Missing redirect lock: ${source} -> ${destination}`);
  }
}

console.log("FLOENTLY_MASTER_ROOT_SUITE=PASS");
console.log("FLOENTLY_MASTER_LEARN_CONTENT=PASS");
console.log("FLOENTLY_MASTER_READ_COMING_SOON=PASS");
console.log("FLOENTLY_MASTER_CREATE_COMING_SOON=PASS");
console.log("FLOENTLY_MASTER_LEGAL_FILES=PASS");
console.log("FLOENTLY_MASTER_LEGAL_ALIASES=PASS");
console.log("FLOENTLY_MASTER_DOMAIN_REGRESSION_LOCK=PASS");
