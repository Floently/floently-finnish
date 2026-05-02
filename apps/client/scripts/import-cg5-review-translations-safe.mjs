#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const INDEX_PATH = path.join(ROOT, 'apps/client/features/i18n/index.ts');
const LANGUAGES_PATH = path.join(ROOT, 'apps/client/features/i18n/languages.ts');
const CG5_DIR = path.join(ROOT, 'docs/CG5');
const REPORT_PATH = path.join(CG5_DIR, 'CG5_SAFE_IMPORT_REPORT.txt');

const WRITE = process.argv.includes('--write');

const ARTIFACTS = [
  'Floently Finnish UI Translation Review',
  'Language:',
  'Direction:',
  'Enabled:',
  'Translation status:',
  'Generated:',
  'Source:',
  'Key prefix:',
  'LANDING PAGE',
  'AUTH / SIGN-IN / ACCOUNT CREATION',
  'COMMON ACTIONS',
  'APP SHELL',
  'HOME DASHBOARD',
  'SETTINGS',
  'BILLING',
  'YKI PRACTICE',
  'YKI EXAM',
  'PROGRESS',
  'ONBOARDING',
  'HELP / SUPPORT',
  'OTHER / UNGROUPED KEYS',
  '============================================================',
];

function die(messages) {
  const list = Array.isArray(messages) ? messages : [messages];
  console.error('\nCG5 safe import failed:\n');
  for (const message of list) {
    console.error(`- ${message}`);
  }
  process.exit(1);
}

function readRequired(filePath) {
  if (!fs.existsSync(filePath)) {
    die(`Missing required file: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function findMatchingBrace(text, openIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let i = openIndex; i < text.length; i += 1) {
    const ch = text[i];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }

    if (ch === '\'' || ch === '"' || ch === '`') {
      quote = ch;
      continue;
    }

    if (ch === '{') {
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
  }

  die(`Could not find matching closing brace after index ${openIndex}`);
}

function extractPropertyObject(text, propertyName, startIndex = 0, endIndex = text.length) {
  const re = new RegExp(`\\b${propertyName}\\s*:\\s*\\{`, 'g');
  re.lastIndex = startIndex;

  const match = re.exec(text);
  if (!match || match.index > endIndex) {
    die(`Could not find object property "${propertyName}"`);
  }

  const openIndex = text.indexOf('{', match.index);
  const closeIndex = findMatchingBrace(text, openIndex);

  return {
    openIndex,
    closeIndex,
    body: text.slice(openIndex + 1, closeIndex),
  };
}

function findStringLiteralEnd(text, valueStart, quote) {
  let escaped = false;

  for (let i = valueStart; i < text.length; i += 1) {
    const ch = text[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (ch === '\\') {
      escaped = true;
      continue;
    }

    if (ch === quote) {
      return i;
    }
  }

  return -1;
}

function parseStringObjectValues(objectBody, label) {
  const values = new Map();
  const order = [];
  const propRe = /(?:"([A-Za-z][A-Za-z0-9]*)"|([A-Za-z][A-Za-z0-9]*))\s*:\s*(['"])/g;

  let match;
  while ((match = propRe.exec(objectBody))) {
    const key = match[1] ?? match[2];
    const quote = match[3];
    const valueStart = propRe.lastIndex;
    const valueEnd = findStringLiteralEnd(objectBody, valueStart, quote);

    if (valueEnd === -1) {
      die(`Unterminated string for key "${key}" in ${label}`);
    }

    if (values.has(key)) {
      die(`Duplicate key "${key}" in ${label}`);
    }

    const rawValue = objectBody.slice(valueStart, valueEnd);
    values.set(key, rawValue);
    order.push(key);
    propRe.lastIndex = valueEnd + 1;
  }

  return { values, order };
}

function extractReviewLanguageCodes(languagesText) {
  const match = languagesText.match(/export const REVIEW_LANGUAGE_CODES\s*=\s*\[([\s\S]*?)\]\s*as const/);
  if (!match) {
    die('Could not find REVIEW_LANGUAGE_CODES in languages.ts');
  }

  const codes = [...match[1].matchAll(/'([^']+)'/g)].map((item) => item[1]);

  if (codes.length === 0) {
    die('REVIEW_LANGUAGE_CODES is empty');
  }

  return codes;
}

function artifactInValue(value) {
  return ARTIFACTS.find((artifact) => value.includes(artifact));
}

function placeholders(value) {
  return [...value.matchAll(/\{[A-Za-z0-9_]+\}/g)].map((match) => match[0]).sort();
}

function sameList(a, b) {
  return a.length === b.length && a.every((item, index) => item === b[index]);
}

function findCg5File(languageCode) {
  const matches = fs
    .readdirSync(CG5_DIR)
    .filter((name) => name.startsWith(`${languageCode}-`) && name.endsWith('_cg5.txt'));

  if (matches.length !== 1) {
    die(`Expected exactly one CG5 file for "${languageCode}", found ${matches.length}: ${matches.join(', ') || '(none)'}`);
  }

  return path.join(CG5_DIR, matches[0]);
}

function isArtifactLine(lines, index, trimmed) {
  if (!trimmed) {
    return false;
  }

  if (ARTIFACTS.some((artifact) => trimmed === artifact || trimmed.startsWith(artifact))) {
    return true;
  }

  if (trimmed.includes(':')) {
    return false;
  }

  for (let nextIndex = index + 1; nextIndex < lines.length; nextIndex += 1) {
    const nextTrimmed = lines[nextIndex].trim();
    if (!nextTrimmed) {
      continue;
    }

    return nextTrimmed.startsWith('Source:');
  }

  return false;
}

function parseCg5ReviewFile(filePath, languageCode, keyOrder, englishValues) {
  const knownKeys = new Set(keyOrder);
  const lines = readRequired(filePath).replace(/\r\n/g, '\n').split('\n');

  const values = new Map();
  const errors = [];
  let currentKey = null;
  let buffer = [];

  function finishCurrent(lineNumber) {
    if (!currentKey) {
      return;
    }

    const value = buffer.join('\n').trim();

    if (!value) {
      errors.push(`${languageCode}:${currentKey} has an empty value before line ${lineNumber}`);
    }

    const artifact = artifactInValue(value);
    if (artifact) {
      errors.push(`${languageCode}:${currentKey} contains review-document artifact "${artifact}"`);
    }

    const expectedPlaceholders = placeholders(englishValues.get(currentKey) ?? '');
    const actualPlaceholders = placeholders(value);
    if (!sameList(expectedPlaceholders, actualPlaceholders)) {
      errors.push(
        `${languageCode}:${currentKey} placeholder mismatch. Expected [${expectedPlaceholders.join(', ')}], got [${actualPlaceholders.join(', ')}]`,
      );
    }

    values.set(currentKey, value);
    currentKey = null;
    buffer = [];
  }

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const trimmed = rawLine.trim();
    const keyLine = trimmed.match(/^([A-Za-z][A-Za-z0-9]*):\s*$/);

    if (keyLine && knownKeys.has(keyLine[1])) {
      finishCurrent(lineNumber);

      const key = keyLine[1];
      if (values.has(key)) {
        errors.push(`${languageCode}:${key} appears more than once`);
      }

      currentKey = key;
      buffer = [];
      return;
    }

    if (isArtifactLine(lines, index, trimmed)) {
      finishCurrent(lineNumber);
      return;
    }

    if (!currentKey) {
      return;
    }

    buffer.push(rawLine.trimEnd());
  });

  finishCurrent(lines.length + 1);

  const missingKeys = keyOrder.filter((key) => !values.has(key));
  if (missingKeys.length > 0) {
    errors.push(`${languageCode} is missing ${missingKeys.length} keys: ${missingKeys.slice(0, 20).join(', ')}`);
  }

  const extraKeys = [...values.keys()].filter((key) => !knownKeys.has(key));
  if (extraKeys.length > 0) {
    errors.push(`${languageCode} has ${extraKeys.length} extra keys: ${extraKeys.slice(0, 20).join(', ')}`);
  }

  if (values.size !== keyOrder.length) {
    errors.push(`${languageCode} has ${values.size} keys, expected ${keyOrder.length}`);
  }

  for (const [key, value] of values) {
    if (value.includes('Source:')) {
      errors.push(`${languageCode}:${key} contains forbidden "Source:" text`);
    }

    if (value.includes('============================================================')) {
      errors.push(`${languageCode}:${key} contains forbidden separator line`);
    }
  }

  if (errors.length > 0) {
    return { values, errors };
  }

  return { values, errors: [] };
}

function buildReviewTranslationsBlock(reviewCodes, keyOrder, translationsByLanguage) {
  const lines = [
    'const REVIEW_TRANSLATIONS = {',
  ];

  reviewCodes.forEach((languageCode) => {
    lines.push(`  ${JSON.stringify(languageCode)}: {`);

    keyOrder.forEach((key) => {
      lines.push(`    ${JSON.stringify(key)}: ${JSON.stringify(translationsByLanguage.get(languageCode).get(key))},`);
    });

    lines.push('  },');
  });

  lines.push('} as const satisfies Record<(typeof REVIEW_LANGUAGE_CODES)[number], Record<keyof typeof BASE_TRANSLATIONS.en, string>>;');

  return lines.join('\n');
}

const indexText = readRequired(INDEX_PATH);
const languagesText = readRequired(LANGUAGES_PATH);

const reviewStart = indexText.indexOf('const REVIEW_TRANSLATIONS = {');
if (reviewStart === -1) {
  die('Could not find const REVIEW_TRANSLATIONS block in index.ts');
}

const reviewEndMarker = '} as const satisfies Record<(typeof REVIEW_LANGUAGE_CODES)[number], Record<keyof typeof BASE_TRANSLATIONS.en, string>>;';
const reviewEnd = indexText.indexOf(reviewEndMarker, reviewStart);
if (reviewEnd === -1) {
  die('Could not find REVIEW_TRANSLATIONS end marker in index.ts');
}

const enObject = extractPropertyObject(indexText, 'en', 0, reviewStart);
const { values: englishValues, order: keyOrder } = parseStringObjectValues(enObject.body, 'BASE_TRANSLATIONS.en');

const errors = [];

if (keyOrder.length !== 807) {
  errors.push(`BASE_TRANSLATIONS.en has ${keyOrder.length} keys, expected 807`);
}

const reviewCodes = extractReviewLanguageCodes(languagesText);
const translationsByLanguage = new Map();
const importedFiles = [];

for (const languageCode of reviewCodes) {
  const filePath = findCg5File(languageCode);
  importedFiles.push(path.relative(ROOT, filePath));

  const result = parseCg5ReviewFile(filePath, languageCode, keyOrder, englishValues);

  if (result.errors.length > 0) {
    errors.push(...result.errors);
  }

  translationsByLanguage.set(languageCode, result.values);
}

if (errors.length > 0) {
  die(errors.slice(0, 80));
}

const newReviewBlock = buildReviewTranslationsBlock(reviewCodes, keyOrder, translationsByLanguage);
const newIndexText =
  indexText.slice(0, reviewStart) +
  newReviewBlock +
  indexText.slice(reviewEnd + reviewEndMarker.length);

const report = [
  'CG5 SAFE IMPORT REPORT',
  `Mode: ${WRITE ? 'write' : 'dry-run'}`,
  `Generated: ${new Date().toISOString()}`,
  '',
  `English key count: ${keyOrder.length}`,
  `Review language count: ${reviewCodes.length}`,
  `Review languages: ${reviewCodes.join(', ')}`,
  '',
  'Imported files:',
  ...importedFiles.map((file) => `- ${file}`),
  '',
  'Validation:',
  `- Every review language has exactly ${keyOrder.length} keys`,
  '- No missing keys',
  '- No extra keys',
  '- No empty values',
  '- Placeholders match English',
  '- No review headings inside values',
  '- No Source: strings inside values',
  '- No separator lines inside values',
  '- languages.ts was not changed by this script',
  '',
  WRITE
    ? 'Result: apps/client/features/i18n/index.ts was updated safely.'
    : 'Result: dry-run only. apps/client/features/i18n/index.ts was not changed.',
  '',
].join('\n');

fs.writeFileSync(REPORT_PATH, report);

if (WRITE) {
  fs.writeFileSync(INDEX_PATH, newIndexText);
  console.log('SAFE CG5 IMPORT WRITTEN');
} else {
  console.log('SAFE CG5 DRY RUN PASSED');
}

console.log(report);
