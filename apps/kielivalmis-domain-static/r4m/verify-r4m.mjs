import fs from 'node:fs';
import vm from 'node:vm';

const here = new URL('./', import.meta.url);
const readText = (name) => fs.readFileSync(new URL(name, here), 'utf8');
const exists = (name) => fs.existsSync(new URL(name, here));

const home = readText('index.html');
const styles = readText('styles.css');
const app = readText('app.js');
const surface = `${home}\n${styles}\n${app}`;
const localeSource = readText('locales.js');
const provenance = JSON.parse(readText('assets/kielivalmis-hero-ai.provenance.json'));
const vercelConfig = JSON.parse(readText('../vercel.json'));
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(localeSource.replace(/async load\(code\) \{[\s\S]*?\n  \}/, 'async load(code) { return this.locales[code]; }'), sandbox);
const I = sandbox.window.KIELIVALMIS_I18N;

const supported = ['en','fi','sv','et','es','tr','ru','uk','ar','zh','ku','vi','bn','sq','tl','th','so','ne','fa','ur'];
if (JSON.stringify(Object.keys(I.languages)) !== JSON.stringify(supported)) throw new Error('Supported locale order/set mismatch');
const dictionaries = Object.fromEntries(supported.map((code) => [code, JSON.parse(readText(`locales/${code}.json`))]));
const keys = Object.keys(dictionaries.en);
for (const code of supported) {
  const dict = dictionaries[code];
  if (!dict) throw new Error(`Missing locale ${code}`);
  if (JSON.stringify(Object.keys(dict).sort()) !== JSON.stringify([...keys].sort())) throw new Error(`Locale key-set mismatch: ${code}`);
  for (const key of keys) if (typeof dict[key] !== 'string' || !dict[key].trim()) throw new Error(`Missing ${code}.${key}`);
}
for (const code of ['ar','fa','ur']) if (!I.rtl.includes(code)) throw new Error(`RTL locale missing: ${code}`);
if (I.rtl.includes('ku')) throw new Error('Kurdish is currently expected as Kurmanji Latin/LTR in R4M pending app-locale audit');

for (const asset of ['assets/kielivalmis-mark.png','assets/kielivalmis-hero-ai.webp','assets/kielivalmis-hero-ai.provenance.json']) if (!exists(asset)) throw new Error(`R4M asset missing: ${asset}`);
for (const marker of ['<base href="/r4m/">','KieliValmis','by Floently','data-ai-generated="true"','AI-generated image','ImageObject','prefers-reduced-motion','./assets/kielivalmis-mark.png','./assets/kielivalmis-hero-ai.webp','heroTitleA','localeSelect','https://learn.floently.com/','play.google.com/store/apps/details?id=com.vitusidi.floently']) if (!surface.includes(marker)) throw new Error(`R4M marker missing: ${marker}`);
if (!surface.includes('I.load(code)') || !localeSource.includes('./locales/${code}.json')) throw new Error('R4M locale loader contract missing');
if (surface.includes('data:image/png') || surface.includes('data:image/jpeg')) throw new Error('R4M must ship optimized raster asset files, not embedded raster data URIs');

const heroBytes = fs.readFileSync(new URL('assets/kielivalmis-hero-ai.webp', here));
for (const marker of ['OpenAI ChatGPT','aiGenerated','KieliValmis website hero','AI-generated image']) if (!heroBytes.includes(Buffer.from(marker))) throw new Error(`Hero embedded XMP metadata missing: ${marker}`);
if (provenance.aiGenerated !== true) throw new Error('Hero provenance lost aiGenerated=true');
if (!String(provenance.creator || '').includes('OpenAI')) throw new Error('Hero provenance lost creator');
if (!provenance.created || !provenance.purpose || !provenance.promptSummary) throw new Error('Hero provenance incomplete');
if (!styles.includes('font-size:clamp(25.5px,6.8vw,28px)')) throw new Error('Mobile hero typography contract missing');
if (!styles.includes('font-size:clamp(39px,3.75vw,48px)')) throw new Error('Desktop hero typography contract missing');

const r4mNoindexRules = (vercelConfig.headers || []).filter((rule) => ['/r4m','/r4m/(.*)'].includes(rule.source));
if (r4mNoindexRules.length !== 2) throw new Error('R4M noindex header rules missing');
for (const rule of r4mNoindexRules) {
  const robots = (rule.headers || []).find((header) => String(header.key).toLowerCase() === 'x-robots-tag');
  if (!robots || !String(robots.value).toLowerCase().includes('noindex')) throw new Error(`R4M noindex header missing for ${rule.source}`);
}

console.log('KIELIVALMIS_R4M_20_LOCALES=PASS');
console.log('KIELIVALMIS_R4M_LOCALE_FILES=PASS');
console.log('KIELIVALMIS_R4M_RTL=PASS');
console.log('KIELIVALMIS_R4M_LOGO=PASS');
console.log('KIELIVALMIS_R4M_AI_HERO=PASS');
console.log('KIELIVALMIS_R4M_AI_PROVENANCE=PASS');
console.log('KIELIVALMIS_R4M_MOTION=PASS');
console.log('KIELIVALMIS_R4M_TYPOGRAPHY=PASS');
console.log('KIELIVALMIS_R4M_EXTERNAL_ASSETS=PASS');
console.log('KIELIVALMIS_R4M_NOINDEX=PASS');
console.log('RESULT: KIELIVALMIS R4M PREVIEW CONTRACT PASS');
