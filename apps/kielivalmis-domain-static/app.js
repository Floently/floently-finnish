(()=>{
  const I=window.KIELIVALMIS_I18N;
  const select=document.getElementById('localeSelect');
  const rtl=new Set(I.rtl);
  const supported=Object.keys(I.languages);
  const pathCode=location.pathname.split('/').filter(Boolean)[0]||'';
  const initial=(()=>{
    if(supported.includes(pathCode)) return pathCode;
    const q=new URLSearchParams(location.search).get('lang');
    if(supported.includes(q)) return q;
    const saved=localStorage.getItem('kv-locale');
    if(supported.includes(saved)) return saved;
    const browser=(navigator.language||'en').toLowerCase().split('-')[0];
    return supported.includes(browser)?browser:'en';
  })();
  for(const code of supported){
    const option=document.createElement('option');
    option.value=code;
    option.textContent=I.languages[code];
    select.append(option);
  }
  async function apply(code){
    let copy;
    try { copy=await I.load(code); }
    catch(error){ console.error(error); code='en'; copy=await I.load('en'); }
    document.documentElement.lang=code;
    document.documentElement.dir=rtl.has(code)?'rtl':'ltr';
    select.value=code;
    select.setAttribute('aria-label',copy.chooseLanguage);
    document.querySelectorAll('[data-i18n]').forEach((node)=>{
      const key=node.dataset.i18n;
      if(copy[key]!=null) node.textContent=copy[key];
    });
    document.title=`KieliValmis | ${copy.heroTitleA.replace(/[.!؟。]+$/u,'')} ${copy.heroTitleB.replace(/[.!؟。]+$/u,'')}`;
    document.querySelector('meta[name="description"]').setAttribute('content',copy.heroLead);
    localStorage.setItem('kv-locale',code);
  }
  select.addEventListener('change',()=>{
    const code=select.value;
    const target=code==='en'?'/' : `/${code}/`;
    if(location.pathname!==target) location.assign(target);
    else void apply(code);
  });
  const chips=document.getElementById('languageChips');
  for(const code of supported){
    const chip=document.createElement('span');
    chip.className='lang-chip';
    chip.textContent=I.languages[code];
    chips.append(chip);
  }
  void apply(initial);
})();
