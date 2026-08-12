import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root=path.dirname(fileURLToPath(import.meta.url));
const read=(f)=>fs.readFileSync(path.join(root,f),"utf8");
const exists=(f)=>fs.existsSync(path.join(root,f));
const langs=["en","fi","sv","et","es","tr","ru","uk","ar","zh","ku","vi","bn","sq","tl","th","so","ne","fa","ur"];
const rtl=new Set(["ar","fa","ur"]);

for(const f of ["index.html","styles.css","app.js","locales.js","assets/kielivalmis-mark.png","assets/kielivalmis-hero-ai.webp","privacy/index.html","terms/index.html","support/index.html","delete-account/index.html","vercel.json","robots.txt","sitemap.xml"]){
  if(!exists(f)) throw new Error(`Missing public KieliValmis file ${f}`);
}
const home=read("index.html");
if(home.includes('<base href="/r4m/">')) throw new Error("Preview base leaked to root");
if(home.includes('noindex,nofollow')) throw new Error("Public root remains noindex");
if(!home.includes('/assets/kielivalmis-mark.png')) throw new Error("Approved mark missing");
if(!home.includes('/assets/kielivalmis-hero-ai.webp')) throw new Error("Approved hero missing");
if(!home.includes('https://app.kielivalmis.com/')) throw new Error("Primary app CTA missing");
if(home.includes('https://learn.floently.com/')) throw new Error("Legacy Learn link remains in public root");
if(!home.includes('data-ai-generated="true"')) throw new Error("AI disclosure marker lost");

for(const code of langs){
  const locale=JSON.parse(read(`locales/${code}.json`));
  if(Object.keys(locale).length!==41) throw new Error(`Landing key count ${code}`);
  const route=code==="en"?"index.html":`${code}/index.html`;
  if(!exists(route)) throw new Error(`Localized route missing ${route}`);
  const body=read(route);
  const dir=rtl.has(code)?"rtl":"ltr";
  if(!body.includes(`<html lang="${code}" dir="${dir}">`)) throw new Error(`lang/dir mismatch ${code}`);
  const canonical=code==="en"?"https://www.kielivalmis.com/":`https://www.kielivalmis.com/${code}/`;
  if(!body.includes(`<link rel="canonical" href="${canonical}">`)) throw new Error(`canonical mismatch ${code}`);
  for(const alt of langs){
    const href=alt==="en"?"https://www.kielivalmis.com/":`https://www.kielivalmis.com/${alt}/`;
    if(!body.includes(`hreflang="${alt}" href="${href}"`)) throw new Error(`hreflang ${alt} missing on ${code}`);
  }
  if(!body.includes('hreflang="x-default" href="https://www.kielivalmis.com/"')) throw new Error(`x-default missing ${code}`);
}
console.log("KIELIVALMIS_STATIC_LOCALIZED_SEO_20=PASS");

const sandbox={window:{}};
vm.createContext(sandbox);
for(const mod of ["shared/page-locales-1.js","shared/page-locales-2.js","shared/page-locales-3.js","shared/page-locales-4.js"]){
  vm.runInContext(read(mod),sandbox,{filename:mod});
}
const copy=sandbox.window.KIELIVALMIS_PAGE_COPY;
if(Object.keys(copy).length!==20) throw new Error("Public locale count mismatch");
function flat(v,p="",o={}){
  if(v&&typeof v==="object"&&!Array.isArray(v)){for(const [k,x] of Object.entries(v)) flat(x,p?`${p}.${k}`:k,o);}
  else o[p]=v;
  return o;
}
for(const code of langs){
  if(Object.keys(flat(copy[code])).length!==70) throw new Error(`Public path count ${code}`);
  if(copy[code].dir!==(rtl.has(code)?"rtl":"ltr")) throw new Error(`Public dir ${code}`);
}
console.log("KIELIVALMIS_STATIC_PUBLIC_PAGE_20_LOCALES=PASS");

for(const page of ["privacy","terms","support","delete-account"]){
  const body=read(`${page}/index.html`);
  if(body.includes("/r4m/assets/")) throw new Error(`${page} uses preview asset path`);
  if(!body.includes("/assets/kielivalmis-mark.png")) throw new Error(`${page} permanent logo missing`);
}
if(read("support/index.html").includes("learn.floently.com")) throw new Error("Support still links legacy host");
for(const mod of ["shared/page-locales-1.js","shared/page-locales-2.js","shared/page-locales-3.js","shared/page-locales-4.js"]){
  if(read(mod).includes("learn.floently.com")) throw new Error(`${mod} contains legacy app host`);
}
const sitemap=read("sitemap.xml");
for(const code of langs){
  const url=code==="en"?"https://www.kielivalmis.com/":`https://www.kielivalmis.com/${code}/`;
  if(!sitemap.includes(`<loc>${url}</loc>`)) throw new Error(`Sitemap missing ${code}`);
}
for(const url of ["https://www.kielivalmis.com/privacy","https://www.kielivalmis.com/terms","https://www.kielivalmis.com/support","https://www.kielivalmis.com/delete-account"]){
  if(!sitemap.includes(`<loc>${url}</loc>`)) throw new Error(`Sitemap missing ${url}`);
}
const config=JSON.parse(read("vercel.json"));
const redirects=new Map((config.redirects??[]).map((x)=>[x.source,x.destination]));
for(const [source,dest] of [["/privacy-policy","/privacy"],["/legal/privacy-policy","/privacy"],["/account-deletion","/delete-account"],["/legal/account-deletion","/delete-account"]]){
  if(redirects.get(source)!==dest) throw new Error(`Redirect lock lost ${source}`);
}
const r4mHeader=(config.headers??[]).find((x)=>x.source==="/r4m/(.*)");
if(!r4mHeader||!JSON.stringify(r4mHeader).includes("noindex, nofollow")) throw new Error("R4M noindex lock lost");

console.log("KIELIVALMIS_STATIC_IDENTITY=PASS");
console.log("KIELIVALMIS_STATIC_20_LANGUAGES=PASS");
console.log("KIELIVALMIS_STATIC_LEGAL_PAGES=PASS");
console.log("KIELIVALMIS_STATIC_CANONICALS=PASS");
console.log("KIELIVALMIS_STATIC_SITEMAP=PASS");
console.log("KIELIVALMIS_STATIC_REDIRECT_LOCKS=PASS");
console.log("KIELIVALMIS_STATIC_R4M_PREVIEW_LOCK=PASS");
console.log("RESULT: KIELIVALMIS STATIC SITE REGRESSION CONTRACT PASS");
