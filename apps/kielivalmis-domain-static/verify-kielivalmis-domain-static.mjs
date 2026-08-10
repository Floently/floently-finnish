import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

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
  pageCss: read('shared/page-shell.css'),
  pageRuntime: read('shared/page-shell.js'),
  locale1: read('shared/page-locales-1.js'),
  locale2: read('shared/page-locales-2.js'),
  locale3: read('shared/page-locales-3.js'),
  locale4: read('shared/page-locales-4.js'),
};

for (const [name, page] of Object.entries({home:files.home,privacy:files.privacy,terms:files.terms,support:files.support,deletion:files.deletion})) {
  if (!page.includes('KieliValmis')) throw new Error(`${name} lost KieliValmis identity`);
}

for (const marker of [
  'Prepare for YKI. Prepare for work in Finland.',
  'guidance in 20 languages',
  'KieliValmis is the new customer-facing name for Floently Finnish',
  'https://learn.floently.com/',
  'play.google.com/store/apps/details?id=com.vitusidi.floently',
  'KieliValmis is an independent Finnish-learning product',
]) if (!files.home.includes(marker)) throw new Error(`Home marker missing: ${marker}`);

for (const marker of [
  'data-ai-generated="true"','AI-generated illustration','ai-content-disclosure','<svg class="hero-art"',
  '<metadata id="ai-generation-metadata">','"aiGenerated": true','"creator": "OpenAI ChatGPT (GPT-5.6 Sol)"',
  '"generationMethod": "Procedural vector illustration generated from AI-authored SVG"','"created": "2026-08-08"',
  '"purpose": "KieliValmis website hero illustration"','"disclosure": "AI-generated illustration"','>AI-generated illustration</text>',
]) if (!files.home.includes(marker)) throw new Error(`Inline AI hero metadata/disclosure missing: ${marker}`);

if (!/"@type"\s*:\s*"ImageObject"/.test(files.home)) throw new Error('Inline AI hero metadata/disclosure missing: Schema.org ImageObject');
if (files.home.includes('/assets/kielivalmis-hero-ai.svg')) throw new Error('Home must not depend on external hero SVG after the Vercel asset 404 incident');

const languageMarkers = ['English','Finnish','Swedish','Estonian','Spanish','Turkish','Russian','Ukrainian','Arabic','Chinese','Kurdish','Vietnamese','Bengali','Albanian','Tagalog','Thai','Somali','Nepali','Persian','Urdu'];
for (const language of languageMarkers) if (!files.home.includes(`>${language}<`)) throw new Error(`Supported language missing: ${language}`);

const canonicalExpectations = [
  ['home','https://www.kielivalmis.com/'],['privacy','https://www.kielivalmis.com/privacy'],['terms','https://www.kielivalmis.com/terms'],['support','https://www.kielivalmis.com/support'],['deletion','https://www.kielivalmis.com/delete-account'],
];
for (const [name,url] of canonicalExpectations) {
  if (!files[name].includes(`<link rel="canonical" href="${url}">`)) throw new Error(`${name} canonical mismatch: ${url}`);
  if (!files.sitemap.includes(`<loc>${url}</loc>`)) throw new Error(`Sitemap missing canonical URL: ${url}`);
}

const publicPages = {privacy:files.privacy,terms:files.terms,support:files.support,deletion:files.deletion};
for (const [name,page] of Object.entries(publicPages)) {
  for (const marker of ['/shared/page-shell.css','/shared/page-locales-1.js','/shared/page-locales-2.js','/shared/page-locales-3.js','/shared/page-locales-4.js','/shared/page-shell.js','/r4m/assets/kielivalmis-mark.png','id="localeSelect"','by Floently']) {
    if (!page.includes(marker)) throw new Error(`${name} lost shared KieliValmis page shell marker: ${marker}`);
  }
  if (page.includes('<span class="mark">KV</span>')) throw new Error(`${name} reintroduced fake KV mark`);
  if (page.includes('clamp(36px,6vw,58px)')) throw new Error(`${name} reintroduced oversized legacy page heading`);
}

for (const marker of ['font-size:clamp(34px,4vw,43px)','font-size:clamp(25px,6.4vw,29px)','[dir="rtl"]','.brand-copy span']) {
  if (!files.pageCss.includes(marker)) throw new Error(`Shared page visual/RTL contract missing: ${marker}`);
}
for (const marker of ["new Set(['ar','fa','ur'])",'kielivalmis-public-language','document.documentElement.dir','history.replaceState']) {
  if (!files.pageRuntime.includes(marker)) throw new Error(`Shared page localization runtime missing: ${marker}`);
}

const sandbox = {window:{}};
vm.createContext(sandbox);
for (const source of [files.locale1,files.locale2,files.locale3,files.locale4]) vm.runInContext(source,sandbox);
const copy = sandbox.window.KIELIVALMIS_PAGE_COPY;
const supported = ['en','fi','sv','et','es','tr','ru','uk','ar','zh','ku','vi','bn','sq','tl','th','so','ne','fa','ur'];
if (!copy || JSON.stringify(Object.keys(copy)) !== JSON.stringify(supported)) throw new Error('Public legal/support locale set/order mismatch');

const requiredKeys = {
  common:['language','productKicker','lastUpdated','home','privacy','terms','support','deleteAccount','floently','contactSupport','openApp'],
  privacy:['metaTitle','metaDescription','title','intro','collectTitle','collectBody','useTitle','useBody','thirdTitle','thirdBody','retentionTitle','retentionBody','transitionTitle','transitionBody','contactTitle','contactBody'],
  terms:['metaTitle','metaDescription','title','intro','learningTitle','learningBody','accountsTitle','accountsBody','paymentsTitle','paymentsBody','acceptableTitle','acceptableBody','limitationsTitle','limitationsBody','contactTitle','contactBody'],
  support:['metaTitle','metaDescription','title','intro','includeTitle','includeBody','topicsTitle','topicsBody','existingTitle','existingBody','openTitle','openBody'],
  delete:['metaTitle','metaDescription','title','intro','howTitle','howBody','deletedTitle','deletedBody','retainedTitle','retainedBody','subscriptionsTitle','subscriptionsBody','uninstallTitle','uninstallBody'],
};
for (const code of supported) {
  const locale = copy[code];
  if (!locale) throw new Error(`Missing public page locale: ${code}`);
  for (const [section,keys] of Object.entries(requiredKeys)) {
    for (const key of keys) if (typeof locale[section]?.[key] !== 'string' || !locale[section][key].trim()) throw new Error(`Missing ${code}.${section}.${key}`);
  }
}
for (const code of ['ar','fa','ur']) if (copy[code].dir !== 'rtl') throw new Error(`RTL public page locale missing dir=rtl: ${code}`);
if (copy.ku.dir !== 'ltr') throw new Error('Kurdish public page locale must remain Kurmanji Latin/LTR pending app audit');

const english = copy.en;
for (const marker of ['support@floently.com','Data retention and deletion','Brand transition and account continuity']) {
  if (!JSON.stringify(english.privacy).includes(marker)) throw new Error(`Privacy translation/source marker missing: ${marker}`);
}
for (const marker of ['Delete Your Account','Delete my KieliValmis account','Deleting the app is not account deletion','support@floently.com']) {
  if (!JSON.stringify(english.delete).includes(marker)) throw new Error(`Deletion translation/source marker missing: ${marker}`);
}
for (const marker of ['Subscriptions and payments','not an official YKI test organizer','support@floently.com']) {
  if (!JSON.stringify(english.terms).includes(marker)) throw new Error(`Terms translation/source marker missing: ${marker}`);
}
for (const marker of ['KieliValmis Support','Existing users','learn.floently.com']) {
  if (!JSON.stringify(english.support).includes(marker)) throw new Error(`Support translation/source marker missing: ${marker}`);
}
if (!files.deletion.includes('Delete%20my%20KieliValmis%20account')) throw new Error('Deletion mailto subject contract missing');

if (!files.robots.includes('Sitemap: https://www.kielivalmis.com/sitemap.xml')) throw new Error('robots.txt lost KieliValmis sitemap reference');
const config = JSON.parse(files.config);
for (const destination of ['/privacy','/delete-account']) {
  const found = config.redirects?.some((item) => item.destination === destination && item.permanent === true);
  if (!found) throw new Error(`Permanent compatibility redirect missing for ${destination}`);
}
if (files.home.includes('canonical" href="https://www.floently.com')) throw new Error('KieliValmis home must not canonicalize to Floently');
if (files.sitemap.includes('floently.com')) throw new Error('KieliValmis sitemap must not emit Floently URLs');

console.log('KIELIVALMIS_STATIC_IDENTITY=PASS');
console.log('KIELIVALMIS_STATIC_20_LANGUAGES=PASS');
console.log('KIELIVALMIS_STATIC_LEGAL_PAGES=PASS');
console.log('KIELIVALMIS_STATIC_PUBLIC_PAGE_SHELL=PASS');
console.log('KIELIVALMIS_STATIC_PUBLIC_PAGE_20_LOCALES=PASS');
console.log('KIELIVALMIS_STATIC_PUBLIC_PAGE_RTL=PASS');
console.log('KIELIVALMIS_STATIC_CANONICALS=PASS');
console.log('KIELIVALMIS_STATIC_SITEMAP=PASS');
console.log('KIELIVALMIS_STATIC_REDIRECT_LOCKS=PASS');
console.log('KIELIVALMIS_STATIC_TRANSITION_LINKS=PASS');
console.log('KIELIVALMIS_STATIC_INLINE_AI_HERO_DISCLOSURE=PASS');
console.log('RESULT: KIELIVALMIS STATIC SITE REGRESSION CONTRACT PASS');
