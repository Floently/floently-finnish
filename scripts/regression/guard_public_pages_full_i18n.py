#!/usr/bin/env python3
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[2]
I18N = ROOT / 'apps/client/web/i18n/publicMarketingCopy.ts'
text = I18N.read_text(encoding='utf-8')

marker = 'const PUBLIC_MARKETING_COPY'
try:
    start = text.index(marker)
    brace = text.index('{', start)
except ValueError:
    raise SystemExit('FAIL: PUBLIC_MARKETING_COPY object not found')

level = 0
end = None
in_string = False
escape = False
for i in range(brace, len(text)):
    ch = text[i]
    if in_string:
        if escape:
            escape = False
        elif ch == '\\':
            escape = True
        elif ch == '"':
            in_string = False
        continue
    if ch == '"':
        in_string = True
    elif ch == '{':
        level += 1
    elif ch == '}':
        level -= 1
        if level == 0:
            end = i + 1
            break
if end is None:
    raise SystemExit('FAIL: could not parse PUBLIC_MARKETING_COPY')

copy = json.loads(text[brace:end])
expected = {'en','fi','sv','et','es','tr','ru','uk','ar','zh','ku','vi','bn','sq','tl','th','so','ne','fa','ur'}
actual = set(copy)
if actual != expected:
    raise SystemExit(f'FAIL: language set mismatch. missing={sorted(expected-actual)} extra={sorted(actual-expected)}')

required_paths = [
  'common.signIn','common.forOrganizations','common.bookDemo','common.learnerPage','common.startLearning','common.backToFloently','common.openContactForm',
  'landing.eyebrow','landing.h1Line1','landing.h1Line2','landing.heroSub','landing.demoCaption','landing.pathwaysTitle','landing.pathwaysSub','landing.learnerPath.title','landing.employerPath.title','landing.cityPath.title','landing.footerMade',
  'demo.label','demo.prompt','demo.tooltipTitle','demo.tooltipBody','demo.success',
  'organizations.heroTitle','organizations.heroLede','organizations.whyTitle','organizations.whyBody','organizations.whoTitle','organizations.whoBody','organizations.platformTitle','organizations.platformBody','organizations.pilotTitle','organizations.pilotBody','organizations.demoTitle','organizations.demoBody','organizations.demoNote','organizations.footerBuilt',
  'contact.title','contact.copy','contact.formTitle','contact.formIntro','contact.name','contact.email','contact.organization','contact.role','contact.organizationType','contact.learners','contact.phone','contact.message','contact.sendDemoRequest','contact.note','contact.mailtoIntro','contact.mailtoNeedHelp',
]

def get_path(obj, path):
    cur = obj
    for part in path.split('.'):
        cur = cur[part]
    return cur

for code, data in copy.items():
    for path in required_paths:
        value = get_path(data, path)
        if not isinstance(value, str) or not value.strip():
            raise SystemExit(f'FAIL: empty required string {code}.{path}')
    for arr_path, expected_len in [('organizations.audiences',3), ('organizations.pillars',4), ('organizations.pilotSteps',4), ('contact.organizationTypes',6)]:
        arr = get_path(data, arr_path)
        if not isinstance(arr, list) or len(arr) != expected_len:
            raise SystemExit(f'FAIL: bad array length {code}.{arr_path}: {len(arr) if isinstance(arr, list) else type(arr)}')

english_markers = [
  'For organizations','Book demo','Sign in','Learner page','Start learning','Language is not only an exam problem',
  'What Floently provides','Talk to us about','Built for Finland','Made for Finland','Start small',
  'Organization demo request','Your name','Work email','Employers','Cities and municipalities','Training providers',
  'A learning layer','Pilot model','Who it serves','Why it matters'
]

def walk_strings(value):
    if isinstance(value, dict):
        for item in value.values():
            yield from walk_strings(item)
    elif isinstance(value, list):
        for item in value:
            yield from walk_strings(item)
    elif isinstance(value, str):
        yield value

bad = []
for code, data in copy.items():
    if code == 'en':
        continue
    blob = '\n'.join(walk_strings(data))
    for phrase in english_markers:
        if phrase in blob:
            bad.append((code, phrase))
if bad:
    raise SystemExit('FAIL: English fallback markers remain: ' + repr(bad[:50]))

for code in ['fa','ur']:
    blob = '\n'.join(walk_strings(copy[code]))
    if re.search(r'[\u0900-\u097F]', blob):
        raise SystemExit(f'FAIL: Devanagari text leaked into {code}')

print('PASS: public-page i18n covers 20 languages with required landing/org/contact strings and no audited English fallback markers')
