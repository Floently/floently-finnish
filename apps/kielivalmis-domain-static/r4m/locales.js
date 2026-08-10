window.KIELIVALMIS_I18N = {
  languages: {
  "en": "English",
  "fi": "Suomi",
  "sv": "Svenska",
  "et": "Eesti",
  "es": "Español",
  "tr": "Türkçe",
  "ru": "Русский",
  "uk": "Українська",
  "ar": "العربية",
  "zh": "中文",
  "ku": "Kurdî",
  "vi": "Tiếng Việt",
  "bn": "বাংলা",
  "sq": "Shqip",
  "tl": "Filipino",
  "th": "ไทย",
  "so": "Soomaali",
  "ne": "नेपाली",
  "fa": "فارسی",
  "ur": "اردو"
},
  rtl: ["ar","fa","ur"],
  locales: {},
  async load(code) {
    if (this.locales[code]) return this.locales[code];
    const response = await fetch(`./locales/${code}.json`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Locale ${code} failed: HTTP ${response.status}`);
    const value = await response.json();
    this.locales[code] = value;
    return value;
  }
};
