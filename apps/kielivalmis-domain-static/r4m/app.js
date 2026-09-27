(()=>{
    const I=window.KIELIVALMIS_I18N; const select=document.getElementById('localeSelect'); const rtl=new Set(I.rtl);
    const supported=Object.keys(I.languages);
    const initial=(()=>{const q=new URLSearchParams(location.search).get('lang'); if(supported.includes(q))return q; const saved=localStorage.getItem('kv-locale'); if(supported.includes(saved))return saved; const b=(navigator.language||'en').toLowerCase().split('-')[0]; return supported.includes(b)?b:'en';})();
    for(const code of supported){const o=document.createElement('option');o.value=code;o.textContent=I.languages[code];select.append(o)}
    async function apply(code){
      let t;
      try { t=await I.load(code); }
      catch (error) { console.error(error); code='en'; t=await I.load('en'); }
      document.documentElement.lang=code;document.documentElement.dir=rtl.has(code)?'rtl':'ltr';select.value=code;select.setAttribute('aria-label',t.chooseLanguage);document.querySelectorAll('[data-i18n]').forEach(el=>{const k=el.dataset.i18n;if(t[k]!=null)el.textContent=t[k]});document.title=`KieliValmis | ${t.heroTitleA.replace(/[.!؟。]+$/u,'')} ${t.heroTitleB.replace(/[.!؟。]+$/u,'')}`;document.querySelector('meta[name="description"]').setAttribute('content',t.heroLead);localStorage.setItem('kv-locale',code);const u=new URL(location.href);u.searchParams.set('lang',code);history.replaceState(null,'',u);
    }
    select.addEventListener('change',()=>{void apply(select.value)});
    const chips=document.getElementById('languageChips');for(const code of supported){const s=document.createElement('span');s.className='lang-chip';s.textContent=I.languages[code];chips.append(s)}
    void apply(initial);
  })();
