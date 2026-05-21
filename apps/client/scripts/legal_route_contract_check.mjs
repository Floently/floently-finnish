#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const scriptDir = path.dirname(new URL(import.meta.url).pathname);
const clientDir = path.resolve(scriptDir, '..');
const legalRoutesPath = path.resolve(clientDir, 'config/legalRoutes.ts');
const distDir = path.resolve(clientDir, 'dist');

const args = new Set(process.argv.slice(2));
const printHttpRoutes = args.has('--print-http-routes');
const checkDist = args.has('--check-dist');
const EXCLUDED_PUBLIC_ROUTES = new Set(['/teams', '/learn/teams']);

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function extractObjectBlock(source, objectName) {
  const startToken = `const ${objectName}`;
  const start = source.indexOf(startToken);
  if (start === -1) throw new Error(`Could not find ${objectName} in legalRoutes.ts`);
  const open = source.indexOf('{', start);
  if (open === -1) throw new Error(`Could not parse ${objectName} opening brace`);

  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(open, i + 1);
      }
    }
  }

  throw new Error(`Could not parse ${objectName} block`);
}

function extractCanonicalPaths(block) {
  const result = [];
  const re = /(?:'[^']+'|[A-Za-z_][A-Za-z0-9_]*)\s*:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(block)) !== null) {
    result.push(m[1]);
  }
  return result;
}

function extractAliasPaths(block) {
  const result = [];
  const arrRe = /(?:'[^']+'|[A-Za-z_][A-Za-z0-9_]*)\s*:\s*\[(.*?)\]/gs;
  let arr;
  while ((arr = arrRe.exec(block)) !== null) {
    const part = arr[1];
    const strRe = /'([^']+)'/g;
    let s;
    while ((s = strRe.exec(part)) !== null) {
      result.push(s[1]);
    }
  }
  return result;
}

function toDistHtmlPath(routePath) {
  if (routePath === '/') return path.resolve(distDir, 'index.html');
  const normalized = routePath.startsWith('/') ? routePath.slice(1) : routePath;
  return path.resolve(distDir, `${normalized}.html`);
}

const source = readFile(legalRoutesPath);
const canonicalBlock = extractObjectBlock(source, 'LEGAL_PATHS');
const aliasBlock = extractObjectBlock(source, 'LEGAL_ALIASES');
const canonicalRoutes = extractCanonicalPaths(canonicalBlock);
const aliasRoutes = extractAliasPaths(aliasBlock);

const staticRoutes = ['/', ...canonicalRoutes, ...aliasRoutes, '/auth/login', '/auth/register'];
const routeSet = new Set();
for (const route of staticRoutes) {
  if (!route.startsWith('/')) {
    throw new Error(`Invalid legal route '${route}' (must start with /)`);
  }
  routeSet.add(route.replace(/\/+$/, '') || '/');
}
const allRoutes = [...routeSet].filter((route) => !EXCLUDED_PUBLIC_ROUTES.has(route));

if (printHttpRoutes) {
  process.stdout.write(`${allRoutes.join('\n')}\n`);
  process.exit(0);
}

if (checkDist) {
  if (!fs.existsSync(distDir)) {
    throw new Error(`dist directory not found: ${distDir}`);
  }

  const missing = [];
  for (const route of allRoutes) {
    const htmlPath = toDistHtmlPath(route);
    if (!fs.existsSync(htmlPath)) {
      missing.push(`${route} -> ${path.relative(clientDir, htmlPath)}`);
    }
  }

  if (missing.length > 0) {
    process.stderr.write('Legal route contract failed. Missing exported HTML files:\n');
    for (const item of missing) process.stderr.write(`- ${item}\n`);
    process.exit(1);
  }

  process.stdout.write(`Legal route contract OK (${allRoutes.length} routes).\n`);
  process.exit(0);
}

process.stdout.write([
  'Usage:',
  '  node scripts/legal_route_contract_check.mjs --print-http-routes',
  '  node scripts/legal_route_contract_check.mjs --check-dist',
].join('\n') + '\n');
