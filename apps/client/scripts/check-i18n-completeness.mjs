import fs from 'node:fs';
import path from 'node:path';
import Module from 'node:module';
import { createRequire } from 'node:module';
import ts from 'typescript';

const ROOT = path.resolve(process.cwd(), 'apps/client');
const require = createRequire(import.meta.url);

function installTsRequireHook() {
  const compile = (filename) => {
    const source = fs.readFileSync(filename, 'utf8');
    return ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
      fileName: filename,
    }).outputText;
  };

  Module._extensions['.ts'] = function loadTs(module, filename) {
    module._compile(compile(filename), filename);
  };

  Module._extensions['.tsx'] = function loadTsx(module, filename) {
    module._compile(compile(filename), filename);
  };
}

installTsRequireHook();

const { TRANSLATIONS } = require(path.join(ROOT, 'features/i18n/index.ts'));
const { ALL_LANGUAGE_CODES, ENABLED_LANGUAGE_CODES, LANGUAGE_META } = require(path.join(ROOT, 'features/i18n/languages.ts'));

const baseKeys = Object.keys(TRANSLATIONS.en);
const baseKeySet = new Set(baseKeys);
const issues = [];

for (const language of ALL_LANGUAGE_CODES) {
  const translation = TRANSLATIONS[language];
  const keys = Object.keys(translation);
  const keySet = new Set(keys);
  const missing = baseKeys.filter((key) => !keySet.has(key));
  const extra = keys.filter((key) => !baseKeySet.has(key));

  if (missing.length || extra.length) {
    issues.push({
      language,
      missing,
      extra,
    });
  }
}

const enabledLanguages = ENABLED_LANGUAGE_CODES.filter((language) => LANGUAGE_META[language].enabled);
const disabledLanguages = ALL_LANGUAGE_CODES.filter((language) => !LANGUAGE_META[language].enabled);
const reviewLanguages = ALL_LANGUAGE_CODES.filter((language) => LANGUAGE_META[language].translationStatus === 'in_progress');
const enabledStatusErrors = enabledLanguages.filter((language) => LANGUAGE_META[language].translationStatus !== 'complete');
const disabledStatusErrors = disabledLanguages.filter((language) => LANGUAGE_META[language].translationStatus === 'complete');
const reviewEnabledErrors = reviewLanguages.filter((language) => LANGUAGE_META[language].enabled);
const placeholderPattern = /\bTODO\b|\bFIXME\b|\bTRANSLATE\b|translation missing|MISSING|undefined|null/;
const hasBadValue = (translation) =>
  Object.values(translation).some((value) => typeof value !== 'string' || value.trim().length === 0 || placeholderPattern.test(value));
const reviewValueErrors = reviewLanguages.filter((language) => hasBadValue(TRANSLATIONS[language]));
const rtlLanguages = ALL_LANGUAGE_CODES.filter((language) => LANGUAGE_META[language].direction === 'rtl');
const expectedRtlLanguages = ['ar', 'fa', 'ur'];
const rtlMismatch = rtlLanguages.length !== expectedRtlLanguages.length || expectedRtlLanguages.some((language) => !rtlLanguages.includes(language));
const fallbackEnglishLanguages = disabledLanguages.filter((language) => JSON.stringify(TRANSLATIONS[language]) === JSON.stringify(TRANSLATIONS.en));

console.log(
  `i18n completeness: ${issues.length === 0 && enabledStatusErrors.length === 0 && disabledStatusErrors.length === 0 && reviewEnabledErrors.length === 0 && reviewValueErrors.length === 0 && !rtlMismatch ? 'passed' : 'failed'}`,
);
console.log(`enabled languages: ${enabledLanguages.join(', ')}`);
console.log(`review languages: ${reviewLanguages.join(', ')}`);
console.log(`hidden fallback languages: ${disabledLanguages.join(', ')}`);
console.log(`english fallback languages: ${fallbackEnglishLanguages.join(', ')}`);

if (issues.length) {
  console.log('\nMissing or extra keys:');
  for (const issue of issues) {
    console.log(`- ${issue.language}: missing [${issue.missing.join(', ')}], extra [${issue.extra.join(', ')}]`);
  }
}

if (enabledStatusErrors.length) {
  console.log(`\nEnabled languages with non-complete status: ${enabledStatusErrors.join(', ')}`);
}

if (disabledStatusErrors.length) {
  console.log(`\nDisabled languages incorrectly marked complete: ${disabledStatusErrors.join(', ')}`);
}

if (reviewEnabledErrors.length) {
  console.log(`\nReview languages incorrectly enabled: ${reviewEnabledErrors.join(', ')}`);
}

if (reviewValueErrors.length) {
  console.log(`\nReview languages with missing/placeholder values: ${reviewValueErrors.join(', ')}`);
}

if (rtlMismatch) {
  console.log(`\nRTL metadata mismatch: expected [${expectedRtlLanguages.join(', ')}], got [${rtlLanguages.join(', ')}]`);
}

if (issues.length || enabledStatusErrors.length || disabledStatusErrors.length || reviewEnabledErrors.length || reviewValueErrors.length || rtlMismatch) {
  process.exitCode = 1;
}
