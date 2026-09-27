export const KIELIVALMIS_LANGUAGE_CODES = [
  'en','fi','sv','et','es','tr','ru','uk','ar','zh','ku','vi','bn','sq','tl','th','so','ne','fa','ur',
] as const;

export type KieliValmisLanguage = (typeof KIELIVALMIS_LANGUAGE_CODES)[number];

export type KieliValmisLandingCopy = {
  chooseLanguage: string;
  navYki: string;
  navWork: string;
  navLanguages: string;
  openApp: string;
  heroKicker: string;
  heroTitleA: string;
  heroTitleB: string;
  heroTitleC: string;
  heroLead: string;
  start: string;
  android: string;
  transition: string;
  overlaySpeak: string;
  overlayFeedback: string;
  overlayReady: string;
  aiLabel: string;
  pathKicker: string;
  pathTitle: string;
  pathBody: string;
  card1Title: string;
  card1Body: string;
  card2Title: string;
  card2Body: string;
  card3Title: string;
  card3Body: string;
  ykiTitle: string;
  ykiBody: string;
  workTitle: string;
  workBody: string;
  langKicker: string;
  langTitle: string;
  langBody: string;
  langNote: string;
  finalTitle: string;
  finalBody: string;
  privacy: string;
  terms: string;
  support: string;
  deleteAccount: string;
  footerCopy: string;
};

const copies: Record<KieliValmisLanguage, KieliValmisLandingCopy> = {
  en: require('../../../kielivalmis-domain-static/locales/en.json'),
  fi: require('../../../kielivalmis-domain-static/locales/fi.json'),
  sv: require('../../../kielivalmis-domain-static/locales/sv.json'),
  et: require('../../../kielivalmis-domain-static/locales/et.json'),
  es: require('../../../kielivalmis-domain-static/locales/es.json'),
  tr: require('../../../kielivalmis-domain-static/locales/tr.json'),
  ru: require('../../../kielivalmis-domain-static/locales/ru.json'),
  uk: require('../../../kielivalmis-domain-static/locales/uk.json'),
  ar: require('../../../kielivalmis-domain-static/locales/ar.json'),
  zh: require('../../../kielivalmis-domain-static/locales/zh.json'),
  ku: require('../../../kielivalmis-domain-static/locales/ku.json'),
  vi: require('../../../kielivalmis-domain-static/locales/vi.json'),
  bn: require('../../../kielivalmis-domain-static/locales/bn.json'),
  sq: require('../../../kielivalmis-domain-static/locales/sq.json'),
  tl: require('../../../kielivalmis-domain-static/locales/tl.json'),
  th: require('../../../kielivalmis-domain-static/locales/th.json'),
  so: require('../../../kielivalmis-domain-static/locales/so.json'),
  ne: require('../../../kielivalmis-domain-static/locales/ne.json'),
  fa: require('../../../kielivalmis-domain-static/locales/fa.json'),
  ur: require('../../../kielivalmis-domain-static/locales/ur.json'),
};

const supported = new Set<string>(KIELIVALMIS_LANGUAGE_CODES);

export function asKieliValmisLanguage(value: string | undefined): KieliValmisLanguage {
  return supported.has(value ?? '') ? (value as KieliValmisLanguage) : 'en';
}

export function getKieliValmisCopy(value: string | undefined): KieliValmisLandingCopy {
  return copies[asKieliValmisLanguage(value)];
}

export function isKieliValmisRtl(value: string | undefined): boolean {
  return ['ar','fa','ur'].includes(asKieliValmisLanguage(value));
}
