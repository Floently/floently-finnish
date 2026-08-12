#!/usr/bin/env python3
from pathlib import Path
import json, re, subprocess, sys, time

repo=Path(sys.argv[1]).resolve()
site=repo/"apps/kielivalmis-domain-static"
client=repo/"apps/client"
langs=["en","fi","sv","et","es","tr","ru","uk","ar","zh","ku","vi","bn","sq","tl","th","so","ne","fa","ur"]
rtl={"ar","fa","ur"}
started=time.time()

def flat(obj,p=""):
    out={}
    if isinstance(obj,dict):
        for k,v in obj.items(): out.update(flat(v,f"{p}.{k}" if p else k))
    else: out[p]=obj
    return out

landing={}
for n,code in enumerate(langs,1):
    obj=json.loads((site/"locales"/f"{code}.json").read_text(encoding="utf-8"))
    if len(obj)!=41: raise SystemExit(f"FAIL landing key count {code}={len(obj)}")
    landing[code]=obj
    if n%5==0 or n==20: print(f"landing_checked={n}/20")

script="global.window={};require('./shared/page-locales-1.js');require('./shared/page-locales-2.js');require('./shared/page-locales-3.js');require('./shared/page-locales-4.js');process.stdout.write(JSON.stringify(window.KIELIVALMIS_PAGE_COPY));"
public=json.loads(subprocess.check_output(["node","-e",script],cwd=site,text=True))
if list(public.keys())!=langs: raise SystemExit(f"FAIL public language set/order={list(public.keys())}")
for n,code in enumerate(langs,1):
    if len(flat(public[code]))!=70: raise SystemExit(f"FAIL public path count {code}")
    if public[code].get("dir")!=("rtl" if code in rtl else "ltr"): raise SystemExit(f"FAIL direction {code}")
    if n%5==0 or n==20: print(f"public_checked={n}/20")
print("R4V_FINAL_KEY_PARITY=PASS")

whole={c:json.dumps({"landing":landing[c],"public":public[c]},ensure_ascii=False) for c in langs}
known_bad={
 "fi":["virallisia koetietoja"],
 "ur":["صارف-facing"],
 "bn":["ফিডব্যাক","রোলপ্লে"],
 "sq":["reverse engineering","roleplay"],
 "th":["reverse engineering","roleplay"],
 "sv":["kundnamnet","befintliga berättigade konton"],
 "et":["kliendinimi","olemasolevad sobivad kontod"],
 "tr":["müşteri adıdır","uygun mevcut hesaplar"],
 "zh":["新用户品牌","同一底层服务"],
 "vi":["tên mới hướng đến người dùng","cùng dịch vụ nền"],
}
for code,markers in known_bad.items():
    low=whole[code].lower()
    for marker in markers:
        if marker.lower() in low: raise SystemExit(f"FAIL known regression {code}: {marker}")
print("R4V_FINAL_KNOWN_REGRESSIONS=PASS")

def bidi_isolates_balanced(value):
    depth = 0
    openers = {"\u2066", "\u2067", "\u2068"}  # LRI, RLI, FSI
    pdi = "\u2069"

    for char in value:
        if char in openers:
            depth += 1
        elif char == pdi:
            depth -= 1
            if depth < 0:
                return False

    return depth == 0

for code in ["ar","fa","ur"]:
    surfaces = []

    surfaces.extend(
        (f"landing.{key}", value)
        for key, value in landing[code].items()
    )

    surfaces.extend(
        (f"public.{key}", value)
        for key, value in flat(public[code]).items()
    )

    checked = 0

    for key, value in surfaces:
        if not isinstance(value, str):
            continue

        checked += 1

        if not bidi_isolates_balanced(value):
            raise SystemExit(
                f"FAIL unbalanced bidi {code} path={key}"
            )

    print(
        f"{code}_bidi_strings_checked={checked}"
    )

    open_body=public[code]["support"]["openBody"]
    token="app.kielivalmis.com"
    if token not in open_body: raise SystemExit(f"FAIL app host missing {code}")
    pos=open_body.index(token)
    before = open_body[max(0, pos-4):pos]
    after = open_body[pos+len(token):pos+len(token)+4]

    valid_openers = {"\u2066", "\u2067", "\u2068"}  # LRI, RLI, FSI

    if not any(char in before for char in valid_openers) or "\u2069" not in after:
        raise SystemExit(f"FAIL app host not isolated {code}")
print("R4V_FINAL_RTL_BIDI=PASS")

if public["ku"]["dir"]!="ltr": raise SystemExit("FAIL Kurdish public direction")
helper=(client/"features/kielivalmis/kielivalmisCopy.ts").read_text(encoding="utf-8")
m=re.search(r"isKieliValmisRtl[\s\S]{0,220}",helper)
if not m or "['ar','fa','ur']" not in m.group(0) or "'ku'" in m.group(0): raise SystemExit("FAIL Kurdish/app RTL helper")
print("R4V_FINAL_KURMANJI_LTR=PASS")

pub=json.dumps(public,ensure_ascii=False)
for token in ["KieliValmis","Floently","Komplyint Oy","YKI","support@floently.com","Delete my KieliValmis account"]:
    if token not in pub: raise SystemExit(f"FAIL protected literal missing {token}")
print("R4V_FINAL_PROTECTED_LITERALS=PASS")
print(f"total_strings={20*(41+70)}")
print(f"elapsed_seconds={time.time()-started:.1f}")
print("RESULT: KIELIVALMIS R4V FINAL ALL-20 REGRESSION AUDIT PASS")
