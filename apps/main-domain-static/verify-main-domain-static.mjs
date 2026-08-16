import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.dirname(fileURLToPath(import.meta.url));
const read=(f)=>fs.readFileSync(path.join(root,f),"utf8");
for(const f of ["index.html","read/index.html","create/index.html","vercel.json","sitemap.xml","robots.txt"]){
  if(!fs.existsSync(path.join(root,f))) throw new Error(`Missing ${f}`);
}
const home=read("index.html");
const readPage=read("read/index.html");
const createPage=read("create/index.html");
const config=JSON.parse(read("vercel.json"));
const sitemap=read("sitemap.xml");
const robots=read("robots.txt");
if(robots.includes("learn.floently.com/sitemap.xml")) throw new Error("Floently robots still advertises legacy Learn sitemap");

for(const marker of ["KieliValmis","Floently Read","Floently Create","Available now","Coming soon"]){
  if(!home.includes(marker)) throw new Error(`Missing parent marker ${marker}`);
}
if(home.includes("Floently Learn")) throw new Error("Floently root still presents Floently Learn");
if(home.includes("learn.floently.com")) throw new Error("Floently root still links the legacy Learn host");
if(!home.includes("https://kielivalmis.com/")) throw new Error("Floently root lost KieliValmis gateway");
for(const [name,page] of [["read",readPage],["create",createPage]]){
  if(!page.includes("Coming soon")) throw new Error(`${name} lost Coming soon`);
  if(!page.includes("Explore KieliValmis")) throw new Error(`${name} lost KieliValmis link`);
}
const expected=new Map([
 ["/learn","https://kielivalmis.com/"],
 ["/privacy","https://kielivalmis.com/privacy"],
 ["/privacy-policy","https://kielivalmis.com/privacy"],
 ["/learn/privacy","https://kielivalmis.com/privacy"],
 ["/learn/privacy-policy","https://kielivalmis.com/privacy"],
 ["/legal/privacy-policy","https://kielivalmis.com/privacy"],
 ["/terms","https://kielivalmis.com/terms"],
 ["/learn/terms","https://kielivalmis.com/terms"],
 ["/support","https://kielivalmis.com/support"],
 ["/learn/support","https://kielivalmis.com/support"],
 ["/delete-account","https://kielivalmis.com/delete-account"],
 ["/account-deletion","https://kielivalmis.com/delete-account"],
 ["/learn/delete-account","https://kielivalmis.com/delete-account"],
 ["/learn/account-deletion","https://kielivalmis.com/delete-account"],
 ["/legal/account-deletion","https://kielivalmis.com/delete-account"]
]);
const actual=new Map((config.redirects??[]).map((x)=>[x.source,x.destination]));
for(const [source,dest] of expected){
  if(actual.get(source)!==dest) throw new Error(`Redirect mismatch ${source}`);
}
if(!sitemap.includes("<loc>https://www.floently.com/</loc>")) throw new Error("Floently root missing from sitemap");
if(sitemap.includes("/learn")) throw new Error("Redirected Learn URLs remain in sitemap");

console.log("FLOENTLY_PARENT_BRAND=PASS");
console.log("FLOENTLY_KIELIVALMIS_GATEWAY=PASS");
console.log("FLOENTLY_READ_CREATE_PRESERVED=PASS");
console.log("FLOENTLY_LEARN_REDIRECTS=PASS");
console.log("FLOENTLY_SITEMAP=PASS");
console.log("RESULT: FLOENTLY MASTER DOMAIN KIELIVALMIS GATEWAY PASS");
