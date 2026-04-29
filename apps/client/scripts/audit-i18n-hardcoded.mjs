import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('apps/client');

const INCLUDE_DIRS = [
  'app',
  'state',
  'features',
  'components',
  'config',
];

const IGNORE_PARTS = [
  '/dist/',
  '/node_modules/',
  '.backup',
  '.bak',
  '.test.',
  '.spec.',
];

const FILE_EXTENSIONS = new Set(['.tsx', '.ts']);

const STRING_PROPS = [
  'title',
  'subtitle',
  'detail',
  'meta',
  'actionLabel',
  'label',
  'hint',
  'eyebrow',
  'placeholder',
  'primaryLabel',
  'secondaryLabel',
  'emptyTitle',
  'emptyMessage',
  'description',
];

const ALLOW_TEXT = [
  'KieliTaika',
  'Floently',
  'YKI',
  'B1-B2',
  'A1-A2',
  'C1-C2',
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'PATCH',
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      walk(full, files);
    } else {
      files.push(full);
    }
  }

  return files;
}

function shouldScan(file) {
  const normalized = file.replaceAll(path.sep, '/');
  if (![...FILE_EXTENSIONS].includes(path.extname(file))) return false;
  if (IGNORE_PARTS.some((part) => normalized.includes(part))) return false;
  return true;
}

function looksLikeUiText(value) {
  const text = value.trim();

  if (!text) return false;
  if (ALLOW_TEXT.includes(text)) return false;
  if (/^[{}()[\].,;:=+\-*/<>|&!?%$#@]+$/.test(text)) return false;
  if (/^[a-zA-Z0-9_.:/?&=-]+$/.test(text) && !text.includes(' ')) return false;
  if (/^https?:\/\//.test(text)) return false;
  if (/^[A-Z0-9_]+$/.test(text)) return false;

  // English/Finnish/Swedish-ish UI text signal.
  return /[A-Za-zÅÄÖåäö]/.test(text) && (
    text.includes(' ') ||
    /[.!?…:]$/.test(text) ||
    text.length > 12
  );
}

function lineNumber(content, index) {
  return content.slice(0, index).split('\n').length;
}

const findings = [];

for (const dir of INCLUDE_DIRS) {
  const fullDir = path.join(ROOT, dir);
  for (const file of walk(fullDir)) {
    if (!shouldScan(file)) continue;

    const content = fs.readFileSync(file, 'utf8');
    const rel = path.relative(process.cwd(), file);

    // JSX text between tags: <Text>Hello world</Text>
    const jsxTextRegex = />\s*([^<>{}\n][^<>{}]*[A-Za-zÅÄÖåäö][^<>{}]*)\s*</g;
    for (const match of content.matchAll(jsxTextRegex)) {
      const value = match[1].replace(/\s+/g, ' ').trim();
      if (looksLikeUiText(value)) {
        findings.push({
          file: rel,
          line: lineNumber(content, match.index),
          kind: 'jsx-text',
          text: value,
        });
      }
    }

    // Common UI props: title="...", subtitle="...", actionLabel="..."
    for (const prop of STRING_PROPS) {
      const propRegex = new RegExp(`${prop}\\s*=\\s*["'\`]([^"'\`]+)["'\`]`, 'g');
      for (const match of content.matchAll(propRegex)) {
        const value = match[1].replace(/\s+/g, ' ').trim();
        if (looksLikeUiText(value)) {
          findings.push({
            file: rel,
            line: lineNumber(content, match.index),
            kind: `prop:${prop}`,
            text: value,
          });
        }
      }
    }

    // Alert / logger / thrown user-facing messages.
    const messageRegex = /(Alert\.alert|message|errorMessage|successMessage|detail)\s*[:=]\s*["'\`]([^"'\`]+)["'\`]/g;
    for (const match of content.matchAll(messageRegex)) {
      const value = match[2].replace(/\s+/g, ' ').trim();
      if (looksLikeUiText(value)) {
        findings.push({
          file: rel,
          line: lineNumber(content, match.index),
          kind: 'message',
          text: value,
        });
      }
    }
  }
}

findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);

console.log(`Hardcoded UI text findings: ${findings.length}\n`);

let currentFile = '';
for (const item of findings) {
  if (item.file !== currentFile) {
    currentFile = item.file;
    console.log(`\n${currentFile}`);
  }
  console.log(`  ${item.line}: [${item.kind}] ${item.text}`);
}

const grouped = new Map();
for (const item of findings) {
  grouped.set(item.file, (grouped.get(item.file) ?? 0) + 1);
}

console.log('\n=== Summary by file ===');
for (const [file, count] of [...grouped.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`${String(count).padStart(4)}  ${file}`);
}
