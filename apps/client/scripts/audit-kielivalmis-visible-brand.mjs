import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const read = (relative) =>
  fs.readFileSync(path.join(root, relative), 'utf8');
const extensions = new Set(['.ts','.tsx','.js','.mjs','.json']);
const ignoredDirs = new Set(['node_modules','.expo','dist','build','coverage','.git']);
const ignoredPathPrefixes = ['scripts/'];
const needles = ['Floently Finnish','Floently Learn'];
const queue = [];
let dirsScanned = 0;
let filesScanned = 0;
let bytesScanned = 0;

function walk(dir) {
  dirsScanned += 1;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.well-known') {
      if (entry.isDirectory()) continue;
    }
    if (entry.isDirectory() && ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!extensions.has(path.extname(entry.name))) continue;
    const relative = path.relative(root, full).replaceAll(path.sep, '/');
    if (ignoredPathPrefixes.some((prefix) => relative.startsWith(prefix))) continue;
    const text = fs.readFileSync(full, 'utf8');
    filesScanned += 1;
    bytesScanned += Buffer.byteLength(text);
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('*') || trimmed.startsWith('//')) return;
      for (const needle of needles) {
        if (line.includes(needle)) {
          queue.push({ path: relative, line: index + 1, needle, snippet: trimmed.slice(0, 240) });
        }
      }
    });
    if (filesScanned % 100 === 0) {
      console.log(`progress files_scanned=${filesScanned} hits=${queue.length} mb_scanned=${(bytesScanned/1024/1024).toFixed(2)}`);
    }
  }
}

console.log('=== KIELIVALMIS VISIBLE BRAND AUDIT ===');
console.log(`root=${root}`);
walk(root);

console.log(`dirs_scanned=${dirsScanned}`);
console.log(`files_scanned=${filesScanned}`);
console.log(`bytes_scanned=${bytesScanned}`);
console.log(`legacy_visible_brand_hits=${queue.length}`);

for (const item of queue) {
  console.log(`HIT ${item.needle} ${item.path}:${item.line} :: ${item.snippet}`);
}

const activeLearnHits = queue.filter((item) =>
  item.path.startsWith('features/kielivalmis/') ||
  item.path.startsWith('state/LandingRoute') ||
  item.path === 'state/AppShell.tsx' ||
  item.path === 'state/SettingsRoute.tsx' ||
  item.path === 'state/subscriptionStore.ts' ||
  item.path.startsWith('features/auth/') ||
  item.path.startsWith('config/navigation/') ||
  item.path.startsWith('app/') ||
  item.path === 'app.config.ts' ||
  item.path === 'app.base.json'
);

const legacyGatewayHits = queue.filter((item) =>
  item.path === 'features/publicMarketing/screens/NativePublicMarketingScreens.tsx'
);

const signedInBrandViolations = [];

const signedInCatalog = read(
  'features/i18n/index.ts'
);

const signedInHeader = fs.readFileSync(
  path.resolve(
    root,
    '../../packages/ui/components/PageHeader.tsx'
  ),
  'utf8'
);

const errorBoundary = read(
  'components/diagnostics/FloentlyErrorBoundary.tsx'
);

if (/floently/i.test(signedInCatalog)) {
  signedInBrandViolations.push(
    'main translation catalog contains Floently'
  );
}

if (
  signedInHeader.includes('components/public/logo.png')
) {
  signedInBrandViolations.push(
    'signed-in header uses legacy logo'
  );
}

if (
  signedInHeader.includes('>Floently</Text>')
) {
  signedInBrandViolations.push(
    'signed-in header fallback displays Floently'
  );
}

if (
  !signedInHeader.includes(
    'kielivalmis-domain-static/assets/kielivalmis-mark.png'
  )
) {
  signedInBrandViolations.push(
    'signed-in header lacks approved KieliValmis mark'
  );
}

if (
  errorBoundary.includes(
    'Floently encountered an app error'
  )
) {
  signedInBrandViolations.push(
    'user-visible error boundary displays Floently'
  );
}

console.log(`active_kielivalmis_surface_hits=${activeLearnHits.length}`);
console.log(`legacy_gateway_hits=${legacyGatewayHits.length}`);
console.log(
  `signed_in_brand_violations=${
    signedInBrandViolations.length
  }`
);

for (const violation of signedInBrandViolations) {
  console.log(`SIGNED_IN_VIOLATION ${violation}`);
}

if (
  activeLearnHits.length ||
  signedInBrandViolations.length
) {
  console.log('RESULT: KIELIVALMIS VISIBLE BRAND AUDIT NEEDS REMEDIATION');
  process.exitCode = 2;
} else {
  console.log('RESULT: KIELIVALMIS ACTIVE SURFACES CLEAN; REVIEW REMAINING LEGACY/PARENT CONTEXT HITS');
}
