import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const files = {
  home: read('index.html'),
  privacy: read('privacy/index.html'),
  terms: read('terms/index.html'),
  support: read('support/index.html'),
  deletion: read('delete-account/index.html'),
  robots: read('robots.txt'),
  sitemap: read('sitemap.xml'),
  config: read('vercel.json'),
};

for (const [name, page] of Object.entries({
  home: files.home,
  privacy: files.privacy,
  terms: files.terms,
  support: files.support,
  deletion: files.deletion,
})) {
  if (!page.includes('KieliValmis')) throw new Error(`${name} lost KieliValmis identity`);
  if (!page.includes('Komplyint Oy') && name !== 'support' && name !== 'deletion') {
    throw new Error(`${name} lost Komplyint Oy attribution`);
  }
}

for (const marker of [
  'Prepare for YKI. Prepare for work in Finland.',
  'guidance in 20 languages',
  'KieliValmis is the new customer-facing name for Floently Finnish',
  'https://learn.floently.com/',
  'play.google.com/store/apps/details?id=com.vitusidi.floently',
  'KieliValmis is an independent Finnish-learning product',
]) {
  if (!files.home.includes(marker)) throw new Error(`Home marker missing: ${marker}`);
}

for (const marker of [
  'data-ai-generated="true"',
  'AI-generated illustration',
  'ai-content-disclosure',
  '<svg class="hero-art"',
  '<metadata id="ai-generation-metadata">',
  '"aiGenerated": true',
  '"creator": "OpenAI ChatGPT (GPT-5.6 Sol)"',
  '"generationMethod": "Procedural vector illustration generated from AI-authored SVG"',
  '"created": "2026-08-08"',
  '"purpose": "KieliValmis website hero illustration"',
  '"disclosure": "AI-generated illustration"',
  '>AI-generated illustration</text>',
]) {
  if (!files.home.includes(marker)) throw new Error(`Inline AI hero metadata/disclosure missing: ${marker}`);
}

if (!/"@type"\s*:\s*"ImageObject"/.test(files.home)) {
  throw new Error('Inline AI hero metadata/disclosure missing: Schema.org ImageObject');
}

if (files.home.includes('/assets/kielivalmis-hero-ai.svg')) {
  throw new Error('Home must not depend on external hero SVG after the Vercel asset 404 incident');
}

const languageMarkers = [
  'English','Finnish','Swedish','Estonian','Spanish','Turkish','Russian','Ukrainian','Arabic','Chinese',
  'Kurdish','Vietnamese','Bengali','Albanian','Tagalog','Thai','Somali','Nepali','Persian','Urdu',
];
for (const language of languageMarkers) {
  if (!files.home.includes(`>${language}<`)) throw new Error(`Supported language missing: ${language}`);
}

const canonicalExpectations = [
  ['home', 'https://www.kielivalmis.com/'],
  ['privacy', 'https://www.kielivalmis.com/privacy'],
  ['terms', 'https://www.kielivalmis.com/terms'],
  ['support', 'https://www.kielivalmis.com/support'],
  ['deletion', 'https://www.kielivalmis.com/delete-account'],
];
for (const [name, url] of canonicalExpectations) {
  if (!files[name].includes(`<link rel="canonical" href="${url}">`)) {
    throw new Error(`${name} canonical mismatch: ${url}`);
  }
  if (!files.sitemap.includes(`<loc>${url}</loc>`)) {
    throw new Error(`Sitemap missing canonical URL: ${url}`);
  }
}

for (const marker of [
  'support@floently.com',
  'Data retention and deletion',
  'Brand transition and account continuity',
]) {
  if (!files.privacy.includes(marker)) throw new Error(`Privacy marker missing: ${marker}`);
}

for (const marker of [
  'Delete Your Account',
  'Delete my KieliValmis account',
  'Deleting the app is not account deletion',
  'support@floently.com',
]) {
  if (!files.deletion.includes(marker)) throw new Error(`Deletion marker missing: ${marker}`);
}

for (const marker of [
  'Subscription',
  'not an official YKI test organizer',
  'support@floently.com',
]) {
  if (!files.terms.includes(marker)) throw new Error(`Terms marker missing: ${marker}`);
}

for (const marker of [
  'KieliValmis Support',
  'support@floently.com',
  'Existing users',
  'https://learn.floently.com/',
]) {
  if (!files.support.includes(marker)) throw new Error(`Support marker missing: ${marker}`);
}

if (!files.robots.includes('Sitemap: https://www.kielivalmis.com/sitemap.xml')) {
  throw new Error('robots.txt lost KieliValmis sitemap reference');
}

const config = JSON.parse(files.config);
for (const destination of ['/privacy', '/delete-account']) {
  const found = config.redirects?.some((item) => item.destination === destination && item.permanent === true);
  if (!found) throw new Error(`Permanent compatibility redirect missing for ${destination}`);
}

if (files.home.includes('canonical" href="https://www.floently.com')) {
  throw new Error('KieliValmis home must not canonicalize to Floently');
}

if (files.sitemap.includes('floently.com')) {
  throw new Error('KieliValmis sitemap must not emit Floently URLs');
}

console.log('KIELIVALMIS_STATIC_IDENTITY=PASS');
console.log('KIELIVALMIS_STATIC_20_LANGUAGES=PASS');
console.log('KIELIVALMIS_STATIC_LEGAL_PAGES=PASS');
console.log('KIELIVALMIS_STATIC_CANONICALS=PASS');
console.log('KIELIVALMIS_STATIC_SITEMAP=PASS');
console.log('KIELIVALMIS_STATIC_REDIRECT_LOCKS=PASS');
console.log('KIELIVALMIS_STATIC_TRANSITION_LINKS=PASS');
console.log('KIELIVALMIS_STATIC_INLINE_AI_HERO_DISCLOSURE=PASS');
console.log('RESULT: KIELIVALMIS STATIC SITE REGRESSION CONTRACT PASS');
