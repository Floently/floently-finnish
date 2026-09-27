(() => {
  const languages = [
    ['en','English'],['fi','Suomi'],['sv','Svenska'],['et','Eesti'],['es','Español'],['tr','Türkçe'],['ru','Русский'],['uk','Українська'],['ar','العربية'],['zh','中文'],['ku','Kurdî'],['vi','Tiếng Việt'],['bn','বাংলা'],['sq','Shqip'],['tl','Tagalog'],['th','ไทย'],['so','Soomaali'],['ne','नेपाली'],['fa','فارسی'],['ur','اردو']
  ];
  const supported = new Set(languages.map(([code]) => code));
  const rtl = new Set(['ar','fa','ur']);
  const page = document.body.dataset.page || 'privacy';
  const select = document.getElementById('localeSelect');
  const copy = window.KIELIVALMIS_PAGE_COPY || {};

  function getAt(source, path) {
    return path.split('.').reduce((value, part) => value && value[part], source);
  }

  function browserLanguage() {
    const raw = (navigator.language || 'en').toLowerCase();
    const exact = raw.replace('_','-');
    if (supported.has(exact)) return exact;
    const short = exact.split('-')[0];
    return supported.has(short) ? short : 'en';
  }

  function initialLanguage() {
    const query = new URLSearchParams(location.search).get('lang');
    if (query && supported.has(query)) return query;
    const saved = localStorage.getItem('kielivalmis-public-language');
    if (saved && supported.has(saved)) return saved;
    return browserLanguage();
  }

  function fillSelect(code) {
    if (!select) return;
    select.innerHTML = '';
    for (const [value, label] of languages) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      option.selected = value === code;
      select.appendChild(option);
    }
  }

  function apply(code) {
    const locale = copy[code] || copy.en;
    if (!locale) return;
    document.documentElement.lang = code;
    document.documentElement.dir = rtl.has(code) ? 'rtl' : 'ltr';

    document.querySelectorAll('[data-i18n]').forEach((node) => {
      const key = node.dataset.i18n;
      const value = getAt(locale, key) ?? getAt(copy.en, key);
      if (typeof value === 'string') node.textContent = value;
    });

    document.querySelectorAll('[data-i18n-html]').forEach((node) => {
      const key = node.dataset.i18nHtml;
      const value = getAt(locale, key) ?? getAt(copy.en, key);
      if (typeof value === 'string') node.innerHTML = value;
    });

    const title = getAt(locale, `${page}.metaTitle`) ?? getAt(copy.en, `${page}.metaTitle`);
    const description = getAt(locale, `${page}.metaDescription`) ?? getAt(copy.en, `${page}.metaDescription`);
    if (title) document.title = title;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && description) metaDescription.setAttribute('content', description);

    fillSelect(code);
    localStorage.setItem('kielivalmis-public-language', code);
    const url = new URL(location.href);
    if (code === 'en') url.searchParams.delete('lang'); else url.searchParams.set('lang', code);
    history.replaceState({}, '', url.pathname + url.search + url.hash);
  }

  if (select) select.addEventListener('change', (event) => apply(event.target.value));
  apply(initialLanguage());
})();