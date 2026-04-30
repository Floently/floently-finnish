export type AppLanguage =
  | 'fi'
  | 'sv'
  | 'ru'
  | 'et'
  | 'uk'
  | 'ar'
  | 'en'
  | 'so'
  | 'fa'
  | 'zh'
  | 'sq'
  | 'ku'
  | 'vi'
  | 'bn'
  | 'tr'
  | 'tl'
  | 'th'
  | 'ne'
  | 'es'
  | 'ur';

export type LanguageDirection = 'ltr' | 'rtl';
export type TranslationStatus = 'complete' | 'fallback' | 'in_progress';

export type LanguageMeta = {
  flag: string;
  label: string;
  nativeLabel: string;
  direction: LanguageDirection;
  enabled: boolean;
  translationStatus: TranslationStatus;
};

export const ALL_LANGUAGE_CODES = [
  'fi',
  'sv',
  'ru',
  'et',
  'uk',
  'ar',
  'en',
  'so',
  'fa',
  'zh',
  'sq',
  'ku',
  'vi',
  'bn',
  'tr',
  'tl',
  'th',
  'ne',
  'es',
  'ur',
] as const satisfies readonly AppLanguage[];

export const ENABLED_LANGUAGE_CODES = ['fi', 'sv', 'en'] as const satisfies readonly AppLanguage[];
export const REVIEW_LANGUAGE_CODES = ['et', 'es', 'tr', 'ru', 'uk'] as const satisfies readonly AppLanguage[];

export const LANGUAGE_META: Record<AppLanguage, LanguageMeta> = {
  fi: {
    flag: '🇫🇮',
    label: 'Finnish',
    nativeLabel: 'Suomi',
    direction: 'ltr',
    enabled: true,
    translationStatus: 'complete',
  },
  sv: {
    flag: '🇸🇪',
    label: 'Swedish',
    nativeLabel: 'Svenska',
    direction: 'ltr',
    enabled: true,
    translationStatus: 'complete',
  },
  ru: {
    flag: '🇷🇺',
    label: 'Russian',
    nativeLabel: 'Русский',
    direction: 'ltr',
    enabled: false,
    translationStatus: 'in_progress',
  },
  et: {
    flag: '🇪🇪',
    label: 'Estonian',
    nativeLabel: 'Eesti',
    direction: 'ltr',
    enabled: false,
    translationStatus: 'in_progress',
  },
  uk: {
    flag: '🇺🇦',
    label: 'Ukrainian',
    nativeLabel: 'Українська',
    direction: 'ltr',
    enabled: false,
    translationStatus: 'in_progress',
  },
  ar: {
    flag: '🇸🇦',
    label: 'Arabic',
    nativeLabel: 'العربية',
    direction: 'rtl',
    enabled: false,
    translationStatus: 'fallback',
  },
  en: {
    flag: '🇬🇧',
    label: 'English',
    nativeLabel: 'English',
    direction: 'ltr',
    enabled: true,
    translationStatus: 'complete',
  },
  so: {
    flag: '🇸🇴',
    label: 'Somali',
    nativeLabel: 'Soomaali',
    direction: 'ltr',
    enabled: false,
    translationStatus: 'fallback',
  },
  fa: {
    flag: '🇮🇷',
    label: 'Persian',
    nativeLabel: 'فارسی',
    direction: 'rtl',
    enabled: false,
    translationStatus: 'fallback',
  },
  zh: {
    flag: '🇨🇳',
    label: 'Chinese',
    nativeLabel: '中文',
    direction: 'ltr',
    enabled: false,
    translationStatus: 'fallback',
  },
  sq: {
    flag: '🇦🇱',
    label: 'Albanian',
    nativeLabel: 'Shqip',
    direction: 'ltr',
    enabled: false,
    translationStatus: 'fallback',
  },
  ku: {
    flag: '🔶',
    label: 'Kurdish',
    nativeLabel: 'Kurdî',
    direction: 'ltr',
    enabled: false,
    translationStatus: 'fallback',
  },
  vi: {
    flag: '🇻🇳',
    label: 'Vietnamese',
    nativeLabel: 'Tiếng Việt',
    direction: 'ltr',
    enabled: false,
    translationStatus: 'fallback',
  },
  bn: {
    flag: '🇧🇩',
    label: 'Bengali',
    nativeLabel: 'বাংলা',
    direction: 'ltr',
    enabled: false,
    translationStatus: 'fallback',
  },
  tr: {
    flag: '🇹🇷',
    label: 'Turkish',
    nativeLabel: 'Türkçe',
    direction: 'ltr',
    enabled: false,
    translationStatus: 'in_progress',
  },
  tl: {
    flag: '🇵🇭',
    label: 'Tagalog',
    nativeLabel: 'Tagalog',
    direction: 'ltr',
    enabled: false,
    translationStatus: 'fallback',
  },
  th: {
    flag: '🇹🇭',
    label: 'Thai',
    nativeLabel: 'ไทย',
    direction: 'ltr',
    enabled: false,
    translationStatus: 'fallback',
  },
  ne: {
    flag: '🇳🇵',
    label: 'Nepali',
    nativeLabel: 'नेपाली',
    direction: 'ltr',
    enabled: false,
    translationStatus: 'fallback',
  },
  es: {
    flag: '🇪🇸',
    label: 'Spanish',
    nativeLabel: 'Español',
    direction: 'ltr',
    enabled: false,
    translationStatus: 'in_progress',
  },
  ur: {
    flag: '🇵🇰',
    label: 'Urdu',
    nativeLabel: 'اردو',
    direction: 'rtl',
    enabled: false,
    translationStatus: 'fallback',
  },
};

export function isAppLanguage(value: unknown): value is AppLanguage {
  return typeof value === 'string' && (ALL_LANGUAGE_CODES as readonly string[]).includes(value);
}
