import { useMemo, useState } from 'react';

export const PUBLIC_LANGUAGES = [
  {
    "code": "en",
    "label": "English"
  },
  {
    "code": "fi",
    "label": "Suomi"
  },
  {
    "code": "sv",
    "label": "Svenska"
  },
  {
    "code": "et",
    "label": "Eesti"
  },
  {
    "code": "es",
    "label": "Español"
  },
  {
    "code": "tr",
    "label": "Türkçe"
  },
  {
    "code": "ru",
    "label": "Русский"
  },
  {
    "code": "uk",
    "label": "Українська"
  },
  {
    "code": "ar",
    "label": "العربية"
  },
  {
    "code": "zh",
    "label": "中文"
  },
  {
    "code": "ku",
    "label": "Kurdî"
  },
  {
    "code": "vi",
    "label": "Tiếng Việt"
  },
  {
    "code": "bn",
    "label": "বাংলা"
  },
  {
    "code": "sq",
    "label": "Shqip"
  },
  {
    "code": "tl",
    "label": "Tagalog"
  },
  {
    "code": "th",
    "label": "ไทย"
  },
  {
    "code": "so",
    "label": "Soomaali"
  },
  {
    "code": "ne",
    "label": "नेपाली"
  },
  {
    "code": "fa",
    "label": "فارسی"
  },
  {
    "code": "ur",
    "label": "اردو"
  }
] as const;

export type PublicPageLanguage = (typeof PUBLIC_LANGUAGES)[number]['code'];

export const PUBLIC_LANGUAGE_FLAGS: Record<string, string> = {
  "en": "🇬🇧",
  "fi": "🇫🇮",
  "sv": "🇸🇪",
  "et": "🇪🇪",
  "es": "🇪🇸",
  "tr": "🇹🇷",
  "ru": "🇷🇺",
  "uk": "🇺🇦",
  "ar": "🌍",
  "zh": "🇨🇳",
  "ku": "☀️",
  "vi": "🇻🇳",
  "bn": "🇧🇩",
  "sq": "🇦🇱",
  "tl": "🇵🇭",
  "th": "🇹🇭",
  "so": "🇸🇴",
  "ne": "🇳🇵",
  "fa": "🇮🇷",
  "ur": "🇵🇰"
};

type LocalizedCard = {
  id: string;
  label?: string;
  eyebrow?: string;
  title: string;
  body: string;
  link?: string;
};

type PublicMarketingCopy = {
  dir: 'ltr' | 'rtl';
  common: {
    language: string;
    floentlyHome: string;
    signIn: string;
    forOrganizations: string;
    forOrganizationsArrow: string;
    bookDemo: string;
    contact: string;
    learnerPage: string;
    startLearning: string;
    backToFloently: string;
    openContactForm: string;
  };
  landing: {
    eyebrow: string;
    h1Line1: string;
    h1Line2: string;
    heroSub: string;
    alreadyHaveAccount: string;
    demoCaption: string;
    trustBuiltForYki: string;
    trustForProfessionals: string;
    trustFreeToStart: string;
    pathwaysEyebrow: string;
    pathwaysTitle: string;
    pathwaysSub: string;
    learnerPath: LocalizedCard;
    employerPath: LocalizedCard;
    cityPath: LocalizedCard;
    footerMade: string;
  };
  demo: {
    label: string;
    prompt: string;
    sentence: string;
    wrongWord: string;
    rightWord: string;
    tooltipTitle: string;
    tooltipBody: string;
    success: string;
  };
  organizations: {
    navEmployers: string;
    navCities: string;
    heroEyebrow: string;
    heroTitle: string;
    heroLede: string;
    viewLearnerPage: string;
    valueSummaryLabel: string;
    cardKicker: string;
    whyTitle: string;
    whyBody: string;
    metricYki: string;
    metricWorkplace: string;
    metricSpeaking: string;
    readiness: string;
    scenarios: string;
    practice: string;
    whoEyebrow: string;
    whoTitle: string;
    whoBody: string;
    audiences: LocalizedCard[];
    platformEyebrow: string;
    platformTitle: string;
    platformBody: string;
    pillars: LocalizedCard[];
    pilotEyebrow: string;
    pilotTitle: string;
    pilotBody: string;
    pilotSteps: string[];
    demoEyebrow: string;
    demoTitle: string;
    demoBody: string;
    demoNote: string;
    footerBuilt: string;
  };
  contact: {
    directEmail: string;
    eyebrow: string;
    title: string;
    copy: string;
    formTitle: string;
    formIntro: string;
    name: string;
    namePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    organization: string;
    organizationPlaceholder: string;
    role: string;
    rolePlaceholder: string;
    organizationType: string;
    learners: string;
    learnersPlaceholder: string;
    phone: string;
    phonePlaceholder: string;
    message: string;
    messagePlaceholder: string;
    sendDemoRequest: string;
    note: string;
    organizationTypes: Array<{ value: string; label: string }>;
    mailtoSubjectPrefix: string;
    mailtoFallbackOrganization: string;
    mailtoGreeting: string;
    mailtoIntro: string;
    mailtoName: string;
    mailtoOrganization: string;
    mailtoRole: string;
    mailtoWorkEmail: string;
    mailtoPhone: string;
    mailtoOrganizationType: string;
    mailtoLearners: string;
    mailtoNeedHelp: string;
    mailtoRegards: string;
  };
};

const PUBLIC_MARKETING_COPY: Record<PublicPageLanguage, PublicMarketingCopy> = {
  "en": {
    "dir": "ltr",
    "common": {
      "language": "Language",
      "floentlyHome": "Floently home",
      "signIn": "Sign in",
      "forOrganizations": "For organizations",
      "forOrganizationsArrow": "For organizations →",
      "bookDemo": "Book demo",
      "contact": "Contact",
      "learnerPage": "Learner page",
      "startLearning": "Start learning",
      "backToFloently": "Back to Floently",
      "openContactForm": "Open contact form"
    },
    "landing": {
      "eyebrow": "PASS YKI, SUCCEED AT WORK, LOVE FINLAND!",
      "h1Line1": "Pass YKI.",
      "h1Line2": "Speak Finnish at work.",
      "heroSub": "Real Finnish for YKI and work — built for professionals preparing to live and work in Finland.",
      "alreadyHaveAccount": "Already have an account?",
      "demoCaption": "Practice Finnish → get corrected → learn the rule. Loops to show you how it works.",
      "trustBuiltForYki": "Built for YKI",
      "trustForProfessionals": "For professionals",
      "trustFreeToStart": "Free to start",
      "pathwaysEyebrow": "Three pathways",
      "pathwaysTitle": "YKI, workplace, and life in Finland.",
      "pathwaysSub": "Pick the pathway that matches your goal. Or send your team — Floently works at scale for individuals, companies and cities.",
      "learnerPath": {
        "id": "learners",
        "label": "For learners",
        "title": "Pass YKI and start your profession.",
        "body": "Reading, listening, writing and speaking — built around YKI and the Finnish you need at work.",
        "link": "Start learning →"
      },
      "employerPath": {
        "id": "employers",
        "label": "For employers",
        "title": "Onboard and retain international staff.",
        "body": "Finnish sa trabaho for safer communication, faster onboarding and stronger retention.",
        "link": "Book a pilot →"
      },
      "cityPath": {
        "id": "cities",
        "label": "For cities",
        "title": "A scalable language pathway.",
        "body": "Connect language learning to employability and long-term participation in Finnish society.",
        "link": "Talk to us →"
      },
      "footerMade": "Made for Finland."
    },
    "demo": {
      "label": "Floently · Live correction",
      "prompt": "Your answer in Finnish",
      "sentence": "Kävin apteekkiin eilen.",
      "wrongWord": "apteekkiin",
      "rightWord": "apteekissa",
      "tooltipTitle": "Use the inessive case",
      "tooltipBody": "After käydä, use -ssa/-ssä to say where you visited: apteekissa, kaupassa, töissä.",
      "success": "Now it sounds Finnish. One step closer to YKI."
    },
    "organizations": {
      "navEmployers": "Employers",
      "navCities": "Cities",
      "heroEyebrow": "For organizations",
      "heroTitle": "Finnish language support for work, integration and retention.",
      "heroLede": "Floently helps organizations support international talent with practical Finnish: YKI readiness, workplace communication, professional scenarios and speaking confidence.",
      "viewLearnerPage": "View learner page",
      "valueSummaryLabel": "Organization value summary",
      "cardKicker": "Why it matters",
      "whyTitle": "Language is not only an exam problem.",
      "whyBody": "It affects onboarding, safety, confidence, customer communication, study progress and whether people feel they can build a future in Finland.",
      "metricYki": "YKI",
      "metricWorkplace": "Workplace",
      "metricSpeaking": "Speaking",
      "readiness": "readiness",
      "scenarios": "scenarios",
      "practice": "practice",
      "whoEyebrow": "Who it serves",
      "whoTitle": "Built for the organizations helping people succeed in Finland.",
      "whoBody": "This page explains why an organization would use Floently, what kind of pilot makes sense, and how to start the conversation.",
      "audiences": [
        {
          "id": "employers",
          "label": "Employers",
          "title": "Onboard international staff with safer Finnish communication.",
          "body": "Give employees a structured path from everyday Finnish to role-specific workplace situations: reporting, asking for help, explaining problems and speaking with colleagues or clients."
        },
        {
          "id": "cities",
          "label": "Cities and municipalities",
          "title": "Connect language learning to integration and employment.",
          "body": "Support newcomers with Finnish practice tied to YKI readiness, work life and long-term participation in Finnish society."
        },
        {
          "id": "training",
          "label": "Tagapagbigay ng pagsasanay",
          "title": "Add AI-supported speaking practice around your programme.",
          "body": "Use Floently as a practice layer between lessons: learners repeat, receive correction and build confidence before real conversations."
        }
      ],
      "platformEyebrow": "What Floently provides",
      "platformTitle": "A learning layer for YKI, work and real conversations.",
      "platformBody": "Floently is not just a static course page. It gives learners repeated practice and gives organizations a clearer way to support language development between lessons, shifts and appointments.",
      "pillars": [
        {
          "id": "yki",
          "eyebrow": "YKI pathway",
          "title": "Exam readiness with real skill practice",
          "body": "Reading, listening, writing and speaking practice are structured around the skills learners need for YKI, not just vocabulary memorisation."
        },
        {
          "id": "professional",
          "eyebrow": "Professional Finnish",
          "title": "Role-specific communication",
          "body": "Profession tracks help learners practise the phrases, decisions and misunderstandings they meet in real workplaces."
        },
        {
          "id": "speaking",
          "eyebrow": "Speaking and roleplay",
          "title": "Confidence before real conversations",
          "body": "Learners practise with AI roleplay, correction loops and realistic prompts so they can speak more naturally under pressure."
        },
        {
          "id": "visibility",
          "eyebrow": "Programme visibility",
          "title": "A clearer view of learner progress",
          "body": "For pilots, Floently can support cohort-level feedback: what learners practise, where they struggle and what support they need next."
        }
      ],
      "pilotEyebrow": "Modelo ng pagsubok",
      "pilotTitle": "Start small, measure usefulness, then scale.",
      "pilotBody": "A good organization pilot should be concrete. It should focus on one audience, one language goal and one measurable improvement: confidence, YKI readiness, onboarding communication or professional fluency.",
      "pilotSteps": [
        "Choose the target group: staff, jobseekers, students, integration clients or a specific profession.",
        "Pick the training goal: YKI, workplace communication, professional onboarding or combined support.",
        "Run a small pilot and collect feedback on language confidence, usability and learning gaps.",
        "Decide whether Floently should become part of your language, onboarding or integration pathway."
      ],
      "demoEyebrow": "Book demo",
      "demoTitle": "Talk to us about your organization.",
      "demoBody": "Use the contact form to send your organization demo request. You can also email us directly if preferred.",
      "demoNote": "Suggested message: organization name, target group, number of learners, goal and preferred demo time.",
      "footerBuilt": "Built for Finland."
    },
    "contact": {
      "directEmail": "Direct email",
      "eyebrow": "Book demo",
      "title": "Tell us about your organization.",
      "copy": "Use this page to request a Floently demo for employers, cities, municipalities, training providers or integration programmes. We will reply by email.",
      "formTitle": "Organization demo request",
      "formIntro": "Fill the details below. The button opens your email app with the message prepared.",
      "name": "Your name",
      "namePlaceholder": "Full name",
      "email": "Email sa trabaho",
      "emailPlaceholder": "name@organization.fi",
      "organization": "Organization",
      "organizationPlaceholder": "Organization name",
      "role": "Your role",
      "rolePlaceholder": "HR, coordinator, teacher...",
      "organizationType": "Organization type",
      "learners": "Estimated learners",
      "learnersPlaceholder": "e.g. 20 nurses, 80 jobseekers",
      "phone": "Phone, optional",
      "phonePlaceholder": "+358 ...",
      "message": "What would you like to solve?",
      "messagePlaceholder": "Tell us about your learners, workplace Finnish needs, YKI preparation, onboarding or pilot idea.",
      "sendDemoRequest": "Send demo request →",
      "note": "This uses your email app. Backend form sending can be added later.",
      "organizationTypes": [
        {
          "value": "employer",
          "label": "Employer"
        },
        {
          "value": "city",
          "label": "City or municipality"
        },
        {
          "value": "training",
          "label": "Tagapagbigay ng pagsasanay"
        },
        {
          "value": "integration",
          "label": "Integration programme"
        },
        {
          "value": "healthcare",
          "label": "Healthcare organization"
        },
        {
          "value": "other",
          "label": "Other"
        }
      ],
      "mailtoSubjectPrefix": "Floently demo request from",
      "mailtoFallbackOrganization": "an organization",
      "mailtoGreeting": "Hello Floently team,",
      "mailtoIntro": "We would like to book a demo for our organization.",
      "mailtoName": "Name",
      "mailtoOrganization": "Organization",
      "mailtoRole": "Role",
      "mailtoWorkEmail": "Email sa trabaho",
      "mailtoPhone": "Phone",
      "mailtoOrganizationType": "Organization type",
      "mailtoLearners": "Estimated number of learners",
      "mailtoNeedHelp": "What we need help with:",
      "mailtoRegards": "Best regards,"
    }
  },
  "fi": {
    "dir": "ltr",
    "common": {
      "language": "Kieli",
      "floentlyHome": "Floentlyn etusivu",
      "signIn": "Kirjaudu sisään",
      "forOrganizations": "Organisaatioille",
      "forOrganizationsArrow": "Organisaatioille →",
      "bookDemo": "Varaa demo",
      "contact": "Yhteystiedot",
      "learnerPage": "Oppijan sivu",
      "startLearning": "Aloita opiskelu",
      "backToFloently": "Takaisin Floentlyyn",
      "openContactForm": "Avaa yhteydenottolomake"
    },
    "landing": {
      "eyebrow": "LÄPÄISE YKI, ONNISTU TYÖSSÄ, VIIHDY SUOMESSA!",
      "h1Line1": "Läpäise YKI.",
      "h1Line2": "Puhu suomea työssä.",
      "heroSub": "Käytännön suomea YKIin ja työelämään — ammattilaisille, jotka valmistautuvat asumaan ja työskentelemään Suomessa.",
      "alreadyHaveAccount": "Onko sinulla jo tili?",
      "demoCaption": "Harjoittele suomea → saat korjauksen → opit säännön. Näin Floently toimii.",
      "trustBuiltForYki": "Rakennettu YKIä varten",
      "trustForProfessionals": "Ammattilaisille",
      "trustFreeToStart": "Maksuton aloitus",
      "pathwaysEyebrow": "Kolme polkua",
      "pathwaysTitle": "YKI, työelämä ja elämä Suomessa.",
      "pathwaysSub": "Valitse tavoitettasi vastaava polku. Tai tuo mukaan tiimisi — Floently toimii yksilöille, yrityksille ja kunnille.",
      "learnerPath": {
        "id": "learners",
        "label": "Oppijoille",
        "title": "Läpäise YKI ja aloita ammattipolku.",
        "body": "Lukeminen, kuuntelu, kirjoittaminen ja puhuminen — YKIin ja työssä tarvittavaan suomeen perustuen.",
        "link": "Aloita opiskelu →"
      },
      "employerPath": {
        "id": "employers",
        "label": "Työnantajille",
        "title": "Perehdytä ja sitouta kansainvälistä henkilöstöä.",
        "body": "Työpaikkasuomea turvallisempaan viestintään, nopeampaan perehdytykseen ja parempaan pysyvyyteen.",
        "link": "Varaa pilotti →"
      },
      "cityPath": {
        "id": "cities",
        "label": "Kunnille",
        "title": "Skaalautuva kielipolku.",
        "body": "Yhdistä kielenoppiminen työllistymiseen ja pitkäaikaiseen osallistumiseen suomalaisessa yhteiskunnassa.",
        "link": "Ota yhteyttä →"
      },
      "footerMade": "Tehty Suomea varten."
    },
    "demo": {
      "label": "Floently · Reaaliaikainen korjaus",
      "prompt": "Vastauksesi suomeksi",
      "sentence": "Kävin apteekkiin eilen.",
      "wrongWord": "apteekkiin",
      "rightWord": "apteekissa",
      "tooltipTitle": "Käytä inessiiviä",
      "tooltipBody": "Käydä-verbin jälkeen käytetään -ssa/-ssä-muotoa: apteekissa, kaupassa, töissä.",
      "success": "Nyt se kuulostaa suomelta. Askel lähemmäs YKIä."
    },
    "organizations": {
      "navEmployers": "Työnantajat",
      "navCities": "Kunnat",
      "heroEyebrow": "Organisaatioille",
      "heroTitle": "Suomen kielen tuki työhön, kotoutumiseen ja pysyvyyteen.",
      "heroLede": "Floently auttaa organisaatioita tukemaan kansainvälisiä osaajia käytännön suomella: YKI-valmius, työpaikkaviestintä, ammattitilanteet ja puhevarmuus.",
      "viewLearnerPage": "Katso oppijan sivu",
      "valueSummaryLabel": "Organisaatioarvon yhteenveto",
      "cardKicker": "Miksi tällä on merkitystä",
      "whyTitle": "Kieli ei ole vain koepulma.",
      "whyBody": "Se vaikuttaa perehdytykseen, turvallisuuteen, itsevarmuuteen, asiakasviestintään, opintojen etenemiseen ja siihen, kokevatko ihmiset voivansa rakentaa tulevaisuuden Suomessa.",
      "metricYki": "YKI",
      "metricWorkplace": "Työpaikka",
      "metricSpeaking": "Puhuminen",
      "readiness": "valmius",
      "scenarios": "tilanteet",
      "practice": "harjoittelu",
      "whoEyebrow": "Kenelle tämä sopii",
      "whoTitle": "Organisaatioille, jotka auttavat ihmisiä onnistumaan Suomessa.",
      "whoBody": "Tämä sivu kertoo, miksi organisaatio käyttäisi Floentlyä, millainen pilotti on järkevä ja miten keskustelu voidaan aloittaa.",
      "audiences": [
        {
          "id": "employers",
          "label": "Työnantajat",
          "title": "Perehdytä kansainvälistä henkilöstöä turvallisempaan suomenkieliseen viestintään.",
          "body": "Anna työntekijöille selkeä polku arjen suomesta ammattikohtaisiin työtilanteisiin: raportointi, avun pyytäminen, ongelmien selittäminen ja keskustelu kollegoiden tai asiakkaiden kanssa."
        },
        {
          "id": "cities",
          "label": "Kaupungit ja kunnat",
          "title": "Yhdistä kielenoppiminen kotoutumiseen ja työllistymiseen.",
          "body": "Tue uusia tulijoita suomen harjoittelulla, joka liittyy YKI-valmiuteen, työelämään ja pitkäaikaiseen osallistumiseen Suomessa."
        },
        {
          "id": "training",
          "label": "Koulutuksen järjestäjät",
          "title": "Lisää ohjelman ympärille tekoälytuettua puheharjoittelua.",
          "body": "Käytä Floentlyä harjoittelukerroksena oppituntien välissä: oppijat toistavat, saavat korjausta ja kasvattavat varmuutta ennen oikeita keskusteluja."
        }
      ],
      "platformEyebrow": "Mitä Floently tarjoaa",
      "platformTitle": "Oppimiskerros YKIin, työhön ja oikeisiin keskusteluihin.",
      "platformBody": "Floently ei ole pelkkä staattinen kurssisivu. Se antaa oppijoille toistuvaa harjoittelua ja organisaatioille selkeämmän tavan tukea kielen kehittymistä oppituntien, työvuorojen ja tapaamisten välillä.",
      "pillars": [
        {
          "id": "yki",
          "eyebrow": "YKI-polku",
          "title": "Koetta varten valmiutta oikeilla taidoilla",
          "body": "Lukemisen, kuuntelun, kirjoittamisen ja puhumisen harjoittelu rakentuu YKIssä tarvittavien taitojen ympärille, ei pelkän sanaston ulkoa opetteluun."
        },
        {
          "id": "professional",
          "eyebrow": "Ammatillinen suomi",
          "title": "Roolikohtainen viestintä",
          "body": "Ammattipolut auttavat oppijoita harjoittelemaan ilmauksia, päätöksiä ja väärinymmärryksiä, joita he kohtaavat oikeissa työpaikoissa."
        },
        {
          "id": "speaking",
          "eyebrow": "Puhuminen ja roolipelit",
          "title": "Varmuutta ennen oikeita keskusteluja",
          "body": "Oppijat harjoittelevat tekoälyroolipeleillä, korjaussilmukoilla ja realistisilla tehtävillä, jotta puhuminen sujuu luonnollisemmin paineen alla."
        },
        {
          "id": "visibility",
          "eyebrow": "Ohjelman näkyvyys",
          "title": "Selkeämpi kuva oppijoiden etenemisestä",
          "body": "Piloteissa Floently voi tukea ryhmätason palautetta: mitä oppijat harjoittelevat, missä heillä on vaikeuksia ja millaista tukea he tarvitsevat seuraavaksi."
        }
      ],
      "pilotEyebrow": "Pilottimalli",
      "pilotTitle": "Aloita pienesti, mittaa hyöty ja skaalaa.",
      "pilotBody": "Hyvä organisaatiopilotti on konkreettinen. Se keskittyy yhteen kohderyhmään, yhteen kielitavoitteeseen ja yhteen mitattavaan parannukseen: itsevarmuuteen, YKI-valmiuteen, perehdytysviestintään tai ammatilliseen sujuvuuteen.",
      "pilotSteps": [
        "Valitse kohderyhmä: henkilöstö, työnhakijat, opiskelijat, kotoutuja-asiakkaat tai tietty ammatti.",
        "Valitse koulutustavoite: YKI, työpaikkaviestintä, ammatillinen perehdytys tai yhdistetty tuki.",
        "Toteuta pieni pilotti ja kerää palautetta kielivarmuudesta, käytettävyydestä ja oppimisaukoista.",
        "Päätä, tuleeko Floentlystä osa kieli-, perehdytys- tai kotoutumispolkua."
      ],
      "demoEyebrow": "Varaa demo",
      "demoTitle": "Kerro meille organisaatiostasi.",
      "demoBody": "Lähetä organisaation demopyyntö yhteydenottolomakkeella. Voit myös lähettää meille sähköpostia.",
      "demoNote": "Ehdotettu viesti: organisaation nimi, kohderyhmä, oppijoiden määrä, tavoite ja sopiva demoaika.",
      "footerBuilt": "Tehty Suomea varten."
    },
    "contact": {
      "directEmail": "Suora sähköposti",
      "eyebrow": "Varaa demo",
      "title": "Kerro meille organisaatiostasi.",
      "copy": "Pyydä Floently-demo työnantajille, kaupungeille, kunnille, koulutuksen järjestäjille tai kotoutumisohjelmille. Vastaamme sähköpostitse.",
      "formTitle": "Organisaation demopyyntö",
      "formIntro": "Täytä tiedot alle. Painike avaa sähköpostiohjelmasi valmiiksi laaditulla viestillä.",
      "name": "Nimesi",
      "namePlaceholder": "Koko nimi",
      "email": "Työsähköposti",
      "emailPlaceholder": "nimi@organisaatio.fi",
      "organization": "Organisaatio",
      "organizationPlaceholder": "Organisaation nimi",
      "role": "Roolisi",
      "rolePlaceholder": "HR, koordinaattori, opettaja...",
      "organizationType": "Organisaation tyyppi",
      "learners": "Arvioitu oppijamäärä",
      "learnersPlaceholder": "esim. 20 hoitajaa, 80 työnhakijaa",
      "phone": "Puhelin, valinnainen",
      "phonePlaceholder": "+358 ...",
      "message": "Mitä haluatte ratkaista?",
      "messagePlaceholder": "Kerro oppijoista, työpaikkasuomen tarpeista, YKI-valmistautumisesta, perehdytyksestä tai pilotti-ideasta.",
      "sendDemoRequest": "Lähetä demopyyntö →",
      "note": "Tämä käyttää sähköpostiohjelmaasi. Taustajärjestelmän lomakelähetys voidaan lisätä myöhemmin.",
      "organizationTypes": [
        {
          "value": "employer",
          "label": "Työnantaja"
        },
        {
          "value": "city",
          "label": "Kaupunki tai kunta"
        },
        {
          "value": "training",
          "label": "Koulutuksen järjestäjä"
        },
        {
          "value": "integration",
          "label": "Kotoutumisohjelma"
        },
        {
          "value": "healthcare",
          "label": "Sote-organisaatio"
        },
        {
          "value": "other",
          "label": "Muu"
        }
      ],
      "mailtoSubjectPrefix": "Floently-demopyyntö organisaatiolta",
      "mailtoFallbackOrganization": "organisaatio",
      "mailtoGreeting": "Hei Floently-tiimi,",
      "mailtoIntro": "Haluaisimme varata demon organisaatiollemme.",
      "mailtoName": "Nimi",
      "mailtoOrganization": "Organisaatio",
      "mailtoRole": "Rooli",
      "mailtoWorkEmail": "Työsähköposti",
      "mailtoPhone": "Puhelin",
      "mailtoOrganizationType": "Organisaation tyyppi",
      "mailtoLearners": "Arvioitu oppijamäärä",
      "mailtoNeedHelp": "Missä tarvitsemme apua:",
      "mailtoRegards": "Ystävällisin terveisin,"
    }
  },
  "sv": {
    "dir": "ltr",
    "common": {
      "language": "Språk",
      "floentlyHome": "Floently startsida",
      "signIn": "Logga in",
      "forOrganizations": "För organisationer",
      "forOrganizationsArrow": "För organisationer →",
      "bookDemo": "Boka demo",
      "contact": "Kontakt",
      "learnerPage": "Lärandesida",
      "startLearning": "Börja lära dig",
      "backToFloently": "Tillbaka till Floently",
      "openContactForm": "Öppna kontaktformulär"
    },
    "landing": {
      "eyebrow": "KLARA YKI, LYCKAS PÅ JOBBET, TRIVS I FINLAND!",
      "h1Line1": "Klara YKI.",
      "h1Line2": "Tala finska på jobbet.",
      "heroSub": "Praktisk finska för YKI och arbete — för yrkespersoner som förbereder sig för livet och arbetet i Finland.",
      "alreadyHaveAccount": "Har du redan ett konto?",
      "demoCaption": "Öva finska → få korrigering → lär dig regeln. Så fungerar Floently.",
      "trustBuiltForYki": "Byggt för YKI",
      "trustForProfessionals": "För yrkespersoner",
      "trustFreeToStart": "Gratis att börja",
      "pathwaysEyebrow": "Tre vägar",
      "pathwaysTitle": "YKI, arbetsliv och livet i Finland.",
      "pathwaysSub": "Välj vägen som passar ditt mål. Eller ta med ditt team — Floently fungerar för individer, företag och kommuner.",
      "learnerPath": {
        "id": "learners",
        "label": "För lärande",
        "title": "Klara YKI och starta din yrkesväg.",
        "body": "Läsning, hörförståelse, skrivning och tal — byggt kring YKI och den finska du behöver på jobbet.",
        "link": "Börja lära dig →"
      },
      "employerPath": {
        "id": "employers",
        "label": "För arbetsgivare",
        "title": "Introducera och behåll internationell personal.",
        "body": "Arbetsplatsfinska för tryggare kommunikation, snabbare introduktion och starkare personalretention.",
        "link": "Boka pilot →"
      },
      "cityPath": {
        "id": "cities",
        "label": "För kommuner",
        "title": "En skalbar språkväg.",
        "body": "Koppla språkinlärning till sysselsättning och långsiktigt deltagande i det finländska samhället.",
        "link": "Kontakta oss →"
      },
      "footerMade": "Byggt för Finland."
    },
    "demo": {
      "label": "Floently · Direktkorrigering",
      "prompt": "Ditt svar på finska",
      "sentence": "Kävin apteekkiin eilen.",
      "wrongWord": "apteekkiin",
      "rightWord": "apteekissa",
      "tooltipTitle": "Använd inessiv",
      "tooltipBody": "Efter käydä används -ssa/-ssä för platsen du besökte: apteekissa, kaupassa, töissä.",
      "success": "Nu låter det finskt. Ett steg närmare YKI."
    },
    "organizations": {
      "navEmployers": "Arbetsgivare",
      "navCities": "Kommuner",
      "heroEyebrow": "För organisationer",
      "heroTitle": "Finskt språkstöd för arbete, integration och kvarhållning.",
      "heroLede": "Floently hjälper organisationer att stötta internationella talanger med praktisk finska: YKI-beredskap, arbetsplatskommunikation, yrkesscenarier och taltrygghet.",
      "viewLearnerPage": "Visa lärandesidan",
      "valueSummaryLabel": "Värdesammanfattning för organisationer",
      "cardKicker": "Varför det är viktigt",
      "whyTitle": "Språk är inte bara ett examensproblem.",
      "whyBody": "Det påverkar introduktion, säkerhet, självförtroende, kundkommunikation, studieframsteg och om människor känner att de kan bygga en framtid i Finland.",
      "metricYki": "YKI",
      "metricWorkplace": "Arbetsplats",
      "metricSpeaking": "Tal",
      "readiness": "beredskap",
      "scenarios": "situationer",
      "practice": "övning",
      "whoEyebrow": "Vem det hjälper",
      "whoTitle": "Byggt för organisationer som hjälper människor att lyckas i Finland.",
      "whoBody": "Den här sidan förklarar varför en organisation skulle använda Floently, vilken pilot som är rimlig och hur samtalet kan börja.",
      "audiences": [
        {
          "id": "employers",
          "label": "Arbetsgivare",
          "title": "Introducera internationell personal med tryggare finsk kommunikation.",
          "body": "Ge medarbetare en tydlig väg från vardagsfinska till yrkesspecifika situationer: rapportering, att be om hjälp, förklara problem och tala med kollegor eller kunder."
        },
        {
          "id": "cities",
          "label": "Städer och kommuner",
          "title": "Koppla språkinlärning till integration och arbete.",
          "body": "Stöd nyanlända med finskövning som hänger ihop med YKI-beredskap, arbetsliv och långsiktigt deltagande i Finland."
        },
        {
          "id": "training",
          "label": "Utbildningsanordnare",
          "title": "Lägg till AI-stödd talövning runt ert program.",
          "body": "Använd Floently som ett övningslager mellan lektionerna: deltagare repeterar, får korrigering och bygger trygghet före riktiga samtal."
        }
      ],
      "platformEyebrow": "Vad Floently ger",
      "platformTitle": "Ett lärandelager för YKI, arbete och riktiga samtal.",
      "platformBody": "Floently är inte bara en statisk kurssida. Det ger upprepad övning och hjälper organisationer att följa språkutveckling mellan lektioner, arbetspass och möten.",
      "pillars": [
        {
          "id": "yki",
          "label": "YKI-väg",
          "title": "Examensberedskap med verklig färdighetsträning",
          "body": "Läsning, lyssnande, skrivning och tal struktureras kring de färdigheter som behövs för YKI, inte bara ordmemorering.",
          "eyebrow": "YKI-väg"
        },
        {
          "id": "professional",
          "label": "Yrkesfinska",
          "title": "Rollspecifik kommunikation",
          "body": "Yrkesvägar hjälper deltagare att öva fraser, beslut och missförstånd från riktiga arbetsplatser.",
          "eyebrow": "Yrkesfinska"
        },
        {
          "id": "speaking",
          "label": "Tal och rollspel",
          "title": "Trygghet före riktiga samtal",
          "body": "Deltagare övar med AI-rollspel, korrigeringsloopar och realistiska uppgifter för att tala naturligare under press.",
          "eyebrow": "Tal och rollspel"
        },
        {
          "id": "visibility",
          "label": "Programsynlighet",
          "title": "Tydligare bild av utvecklingen",
          "body": "I piloter kan Floently stödja återkoppling på gruppnivå: vad som övas, var svårigheterna finns och vilket stöd som behövs.",
          "eyebrow": "Programsynlighet"
        }
      ],
      "pilotEyebrow": "Pilotmodell",
      "pilotTitle": "Börja smått, mät nyttan och skala upp.",
      "pilotBody": "En bra organisationspilot är konkret: en målgrupp, ett språkmål och en mätbar förbättring som självförtroende, YKI-beredskap, introduktionskommunikation eller yrkesflyt.",
      "pilotSteps": [
        "Välj målgruppen: personal, arbetssökande, studerande, integrationskunder eller ett visst yrke.",
        "Välj utbildningsmålet: YKI, arbetsplatskommunikation, yrkesintroduktion eller kombinerat stöd.",
        "Kör en liten pilot och samla respons om språktrygghet, användbarhet och lärandeluckor.",
        "Bestäm om Floently ska bli en del av språk-, introduktions- eller integrationsvägen."
      ],
      "demoEyebrow": "Boka demo",
      "demoTitle": "Berätta om er organisation.",
      "demoBody": "Använd kontaktformuläret för att skicka en demoförfrågan. Du kan också mejla oss direkt.",
      "demoNote": "Föreslaget meddelande: organisationens namn, målgrupp, antal deltagare, mål och önskad demotid.",
      "footerBuilt": "Byggt för Finland."
    },
    "contact": {
      "directEmail": "Direkt e-post",
      "eyebrow": "Boka demo",
      "title": "Berätta om er organisation.",
      "copy": "Begär en Floently-demo för arbetsgivare, kommuner, utbildningsanordnare eller integrationsprogram. Vi svarar via e-post.",
      "formTitle": "Demoförfrågan för organisation",
      "formIntro": "Fyll i uppgifterna nedan. Knappen öppnar din e-postapp med ett färdigt meddelande.",
      "name": "Ditt namn",
      "namePlaceholder": "Fullständigt namn",
      "email": "Arbets-e-post",
      "emailPlaceholder": "namn@organisation.fi",
      "organization": "Organisation",
      "organizationPlaceholder": "Organisationens namn",
      "role": "Din roll",
      "rolePlaceholder": "HR, koordinator, lärare...",
      "organizationType": "Organisationstyp",
      "learners": "Uppskattat antal deltagare",
      "learnersPlaceholder": "t.ex. 20 sjukskötare, 80 arbetssökande",
      "phone": "Telefon, valfritt",
      "phonePlaceholder": "+358 ...",
      "message": "Vad vill ni lösa?",
      "messagePlaceholder": "Berätta om deltagarna, behov av finska på jobbet, YKI-förberedelse, introduktion eller pilotidé.",
      "sendDemoRequest": "Skicka demoförfrågan →",
      "note": "Detta använder din e-postapp. Backend-formulär kan läggas till senare.",
      "organizationTypes": [
        {
          "value": "employer",
          "label": "Arbetsgivare"
        },
        {
          "value": "city",
          "label": "Stad eller kommun"
        },
        {
          "value": "training",
          "label": "Utbildningsanordnare"
        },
        {
          "value": "integration",
          "label": "Integrationsprogram"
        },
        {
          "value": "healthcare",
          "label": "Vårdorganisation"
        },
        {
          "value": "other",
          "label": "Annat"
        }
      ],
      "mailtoSubjectPrefix": "Floently-demoförfrågan från",
      "mailtoFallbackOrganization": "en organisation",
      "mailtoGreeting": "Hej Floently-teamet,",
      "mailtoIntro": "Vi vill boka en demo för vår organisation.",
      "mailtoName": "Namn",
      "mailtoOrganization": "Organisation",
      "mailtoRole": "Roll",
      "mailtoWorkEmail": "Arbets-e-post",
      "mailtoPhone": "Telefon",
      "mailtoOrganizationType": "Organisationstyp",
      "mailtoLearners": "Uppskattat antal deltagare",
      "mailtoNeedHelp": "Det vi behöver hjälp med:",
      "mailtoRegards": "Vänliga hälsningar,"
    }
  },
  "et": {
    "dir": "ltr",
    "common": {
      "language": "Keel",
      "floentlyHome": "Floently avaleht",
      "signIn": "Logi sisse",
      "forOrganizations": "Organisatsioonidele",
      "forOrganizationsArrow": "Organisatsioonidele →",
      "bookDemo": "Broneeri demo",
      "contact": "Kontakt",
      "learnerPage": "Õppija leht",
      "startLearning": "Alusta õppimist",
      "backToFloently": "Tagasi Floentlysse",
      "openContactForm": "Ava kontaktivorm"
    },
    "landing": {
      "eyebrow": "LÄBI YKI, TULE TÖÖL TOIME, ARMASTA SOOMET!",
      "h1Line1": "Läbi YKI.",
      "h1Line2": "Räägi tööl soome keelt.",
      "heroSub": "Praktiline soome keel YKIks ja tööks — spetsialistidele, kes valmistuvad Soomes elama ja töötama.",
      "alreadyHaveAccount": "Kas sul on juba konto?",
      "demoCaption": "Harjuta soome keelt → saa parandusi → õpi reegel. Nii Floently töötab.",
      "trustBuiltForYki": "Loodud YKI jaoks",
      "trustForProfessionals": "Professionaalidele",
      "trustFreeToStart": "Tasuta alustada",
      "pathwaysEyebrow": "Kolm teed",
      "pathwaysTitle": "YKI, tööelu ja elu Soomes.",
      "pathwaysSub": "Vali eesmärgile sobiv tee. Või too kaasa oma meeskond — Floently sobib üksikisikutele, ettevõtetele ja omavalitsustele.",
      "learnerPath": {
        "id": "learners",
        "label": "Õppijatele",
        "title": "Läbi YKI ja alusta oma ametiteed.",
        "body": "Lugemine, kuulamine, kirjutamine ja rääkimine — YKI ning tööl vajaliku soome keele ümber.",
        "link": "Alusta õppimist →"
      },
      "employerPath": {
        "id": "employers",
        "label": "Tööandjatele",
        "title": "Toeta ja hoia rahvusvahelist personali.",
        "body": "Töösoome keel turvalisemaks suhtluseks, kiiremaks sisseelamiseks ja tugevamaks püsimiseks.",
        "link": "Broneeri piloot →"
      },
      "cityPath": {
        "id": "cities",
        "label": "Omavalitsustele",
        "title": "Skaleeritav keeletee.",
        "body": "Seo keeleõpe tööalase konkurentsivõime ja pikaajalise osalemisega Soome ühiskonnas.",
        "link": "Võta ühendust →"
      },
      "footerMade": "Loodud Soome jaoks."
    },
    "demo": {
      "label": "Floently · Reaalajas parandus",
      "prompt": "Sinu vastus soome keeles",
      "sentence": "Kävin apteekkiin eilen.",
      "wrongWord": "apteekkiin",
      "rightWord": "apteekissa",
      "tooltipTitle": "Kasuta inessiivi",
      "tooltipBody": "Pärast käydä-verbi kasutatakse koha märkimiseks -ssa/-ssä: apteekissa, kaupassa, töissä.",
      "success": "Nüüd kõlab see soomepäraselt. Üks samm YKI-le lähemal."
    },
    "organizations": {
      "navEmployers": "Tööandjad",
      "navCities": "Omavalitsused",
      "heroEyebrow": "Organisatsioonidele",
      "heroTitle": "Soome keele tugi tööks, lõimumiseks ja püsimiseks.",
      "heroLede": "Floently aitab organisatsioonidel toetada rahvusvahelist talenti praktilise soome keelega: YKI-valmidus, töökoha suhtlus, ametialased olukorrad ja kõnejulgus.",
      "viewLearnerPage": "Vaata õppija lehte",
      "valueSummaryLabel": "Organisatsiooni väärtuse kokkuvõte",
      "cardKicker": "Miks see on tähtis",
      "whyTitle": "Keel ei ole ainult eksamiprobleem.",
      "whyBody": "See mõjutab sisseelamist, ohutust, enesekindlust, kliendisuhtlust, õpingute edenemist ja seda, kas inimesed näevad tulevikku Soomes.",
      "metricYki": "YKI",
      "metricWorkplace": "Töökoht",
      "metricSpeaking": "Rääkimine",
      "readiness": "valmidus",
      "scenarios": "olukorrad",
      "practice": "harjutus",
      "whoEyebrow": "Kellele see sobib",
      "whoTitle": "Organisatsioonidele, kes aitavad inimestel Soomes õnnestuda.",
      "whoBody": "See leht selgitab, miks organisatsioon kasutaks Floentlyt, milline piloot on mõistlik ja kuidas vestlust alustada.",
      "audiences": [
        {
          "id": "employers",
          "label": "Tööandjad",
          "title": "Sisseelamine turvalisema soomekeelse suhtlusega.",
          "body": "Anna töötajatele selge tee igapäevasest soome keelest ametialaste olukordadeni: raporteerimine, abi küsimine, probleemide selgitamine ja suhtlus kolleegide või klientidega."
        },
        {
          "id": "cities",
          "label": "Linnad ja omavalitsused",
          "title": "Seo keeleõpe lõimumise ja töötamisega.",
          "body": "Toeta uustulijaid soome keele praktikaga, mis on seotud YKI-valmiduse, tööelu ja pikaajalise osalemisega Soomes."
        },
        {
          "id": "training",
          "label": "Koolitajad",
          "title": "Lisa programmi juurde AI-toega kõneharjutus.",
          "body": "Kasuta Floentlyt tundidevahelise harjutuskihina: õppijad kordavad, saavad parandusi ja koguvad enesekindlust enne päris vestlusi."
        }
      ],
      "platformEyebrow": "Mida Floently pakub",
      "platformTitle": "Õppimiskiht YKI, töö ja päris vestluste jaoks.",
      "platformBody": "Floently ei ole staatiline kursusleht. See annab korduvat harjutamist ja organisatsioonidele selgema viisi toetada keelearengut tundide, vahetuste ja kohtumiste vahel.",
      "pillars": [
        {
          "id": "yki",
          "label": "YKI tee",
          "title": "Eksami valmidus päris oskuste harjutamisega",
          "body": "Lugemine, kuulamine, kirjutamine ja rääkimine on üles ehitatud YKIks vajalike oskuste ümber, mitte ainult sõnade päheõppimiseks.",
          "eyebrow": "YKI tee"
        },
        {
          "id": "professional",
          "label": "Ametialane soome keel",
          "title": "Rollipõhine suhtlus",
          "body": "Ametiteed aitavad õppijatel harjutada fraase, otsuseid ja arusaamatusi, mida nad päris töökohtadel kohtavad.",
          "eyebrow": "Ametialane soome"
        },
        {
          "id": "speaking",
          "label": "Rääkimine ja rollimäng",
          "title": "Enesekindlus enne päris vestlusi",
          "body": "Õppijad harjutavad AI-rollimängude, paranduste ja realistlike ülesannetega, et pinges olukorras loomulikumalt rääkida.",
          "eyebrow": "Rääkimine"
        },
        {
          "id": "visibility",
          "label": "Programmi nähtavus",
          "title": "Selgem ülevaade edasiminekust",
          "body": "Pilootides saab Floently toetada rühma tagasisidet: mida harjutatakse, kus on raskused ja millist tuge järgmiseks vajatakse.",
          "eyebrow": "Nähtavus"
        }
      ],
      "pilotEyebrow": "Piloodimudel",
      "pilotTitle": "Alusta väikeselt, mõõda kasu ja skaleeri.",
      "pilotBody": "Hea organisatsioonipiloot on konkreetne: üks sihtrühm, üks keeleeesmärk ja üks mõõdetav paranemine, näiteks enesekindlus, YKI-valmidus, sisseelamissuhtlus või ametialane ladusus.",
      "pilotSteps": [
        "Vali sihtrühm: personal, tööotsijad, õppijad, lõimumiskliendid või kindel amet.",
        "Vali koolituse eesmärk: YKI, töökoha suhtlus, ametialane sisseelamine või kombineeritud tugi.",
        "Tee väike piloot ja kogu tagasisidet keelekindluse, kasutatavuse ja õpilünkade kohta.",
        "Otsusta, kas Floently saab osaks keele-, sisseelamis- või lõimumisteest."
      ],
      "demoEyebrow": "Broneeri demo",
      "demoTitle": "Rääkige meile oma organisatsioonist.",
      "demoBody": "Kasutage kontaktivormi, et saata oma organisatsiooni demosoov. Võite ka otse e-posti saata.",
      "demoNote": "Soovituslik teade: organisatsiooni nimi, sihtrühm, õppijate arv, eesmärk ja sobiv demo aeg.",
      "footerBuilt": "Loodud Soome jaoks."
    },
    "contact": {
      "directEmail": "Otse e-post",
      "eyebrow": "Broneeri demo",
      "title": "Rääkige meile oma organisatsioonist.",
      "copy": "Küsi Floently demot tööandjatele, linnadele, koolitajatele või lõimumisprogrammidele. Vastame e-posti teel.",
      "formTitle": "Organisatsiooni demopäring",
      "formIntro": "Täida allolevad andmed. Nupp avab sinu e-posti rakenduse valmis sõnumiga.",
      "name": "Sinu nimi",
      "namePlaceholder": "Täisnimi",
      "email": "Töö e-post",
      "emailPlaceholder": "nimi@organisatsioon.fi",
      "organization": "Organisatsioon",
      "organizationPlaceholder": "Organisatsiooni nimi",
      "role": "Sinu roll",
      "rolePlaceholder": "HR, koordinaator, õpetaja...",
      "organizationType": "Organisatsiooni tüüp",
      "learners": "Hinnanguline õppijate arv",
      "learnersPlaceholder": "nt 20 õde, 80 tööotsijat",
      "phone": "Telefon, valikuline",
      "phonePlaceholder": "+358 ...",
      "message": "Mida soovite lahendada?",
      "messagePlaceholder": "Räägi õppijatest, töösoome vajadustest, YKI ettevalmistusest, sisseelamisest või piloodi ideest.",
      "sendDemoRequest": "Saada demopäring →",
      "note": "See kasutab sinu e-posti rakendust. Backend-vormi saatmise saab lisada hiljem.",
      "organizationTypes": [
        {
          "value": "employer",
          "label": "Tööandja"
        },
        {
          "value": "city",
          "label": "Linn või omavalitsus"
        },
        {
          "value": "training",
          "label": "Koolitaja"
        },
        {
          "value": "integration",
          "label": "Lõimumisprogramm"
        },
        {
          "value": "healthcare",
          "label": "Tervishoiuorganisatsioon"
        },
        {
          "value": "other",
          "label": "Muu"
        }
      ],
      "mailtoSubjectPrefix": "Floently demo päring organisatsioonilt",
      "mailtoFallbackOrganization": "organisatsioon",
      "mailtoGreeting": "Tere Floently tiim,",
      "mailtoIntro": "Soovime broneerida demo oma organisatsioonile.",
      "mailtoName": "Nimi",
      "mailtoOrganization": "Organisatsioon",
      "mailtoRole": "Roll",
      "mailtoWorkEmail": "Töö e-post",
      "mailtoPhone": "Telefon",
      "mailtoOrganizationType": "Organisatsiooni tüüp",
      "mailtoLearners": "Hinnanguline õppijate arv",
      "mailtoNeedHelp": "Milles vajame abi:",
      "mailtoRegards": "Parimate soovidega,"
    }
  },
  "es": {
    "dir": "ltr",
    "common": {
      "language": "Idioma",
      "floentlyHome": "Inicio de Floently",
      "signIn": "Iniciar sesión",
      "forOrganizations": "Para organizaciones",
      "forOrganizationsArrow": "Para organizaciones →",
      "bookDemo": "Reservar demo",
      "contact": "Contacto",
      "learnerPage": "Página del estudiante",
      "startLearning": "Empezar a aprender",
      "backToFloently": "Volver a Floently",
      "openContactForm": "Abrir formulario de contacto"
    },
    "landing": {
      "eyebrow": "APRUEBA YKI, TRIUNFA EN EL TRABAJO, AMA FINLANDIA!",
      "h1Line1": "Aprueba YKI.",
      "h1Line2": "Habla finés en el trabajo.",
      "heroSub": "Finés práctico para YKI y el trabajo, creado para profesionales que se preparan para vivir y trabajar en Finlandia.",
      "alreadyHaveAccount": "¿Ya tienes una cuenta?",
      "demoCaption": "Practica finés → recibe correcciones → aprende la regla. Así funciona Floently.",
      "trustBuiltForYki": "Creado para YKI",
      "trustForProfessionals": "Para profesionales",
      "trustFreeToStart": "Gratis para empezar",
      "pathwaysEyebrow": "Tres caminos",
      "pathwaysTitle": "YKI, trabajo y vida en Finlandia.",
      "pathwaysSub": "Elige el camino que encaja con tu objetivo. O trae a tu equipo: Floently funciona para personas, empresas y ciudades.",
      "learnerPath": {
        "id": "learners",
        "label": "Para estudiantes",
        "title": "Aprueba YKI y empieza tu camino profesional.",
        "body": "Lectura, comprensión oral, escritura y habla, todo alrededor de YKI y del finés que necesitas en el trabajo.",
        "link": "Empezar a aprender →"
      },
      "employerPath": {
        "id": "employers",
        "label": "Para empleadores",
        "title": "Integra y retén personal internacional.",
        "body": "Finés laboral para comunicación más segura, onboarding más rápido y mayor retención.",
        "link": "Reservar piloto →"
      },
      "cityPath": {
        "id": "cities",
        "label": "Para ciudades",
        "title": "Una ruta lingüística escalable.",
        "body": "Conecta el aprendizaje del idioma con la empleabilidad y la participación a largo plazo en la sociedad finlandesa.",
        "link": "Habla con nosotros →"
      },
      "footerMade": "Hecho para Finlandia."
    },
    "demo": {
      "label": "Floently · Corrección en directo",
      "prompt": "Tu respuesta en finés",
      "sentence": "Kävin apteekkiin eilen.",
      "wrongWord": "apteekkiin",
      "rightWord": "apteekissa",
      "tooltipTitle": "Usa el caso inessivo",
      "tooltipBody": "Después de käydä, usa -ssa/-ssä para indicar dónde estuviste: apteekissa, kaupassa, töissä.",
      "success": "Ahora suena finés. Un paso más cerca de YKI."
    },
    "organizations": {
      "navEmployers": "Empleadores",
      "navCities": "Ciudades",
      "heroEyebrow": "Para organizaciones",
      "heroTitle": "Apoyo de finés para trabajo, integración y retención.",
      "heroLede": "Floently ayuda a las organizaciones a apoyar talento internacional con finés práctico: preparación YKI, comunicación laboral, situaciones profesionales y confianza al hablar.",
      "viewLearnerPage": "Ver página del estudiante",
      "valueSummaryLabel": "Resumen de valor para organizaciones",
      "cardKicker": "Por qué importa",
      "whyTitle": "El idioma no es solo un problema de examen.",
      "whyBody": "Afecta al onboarding, la seguridad, la confianza, la comunicación con clientes, el progreso de estudios y la posibilidad de construir futuro en Finlandia.",
      "metricYki": "YKI",
      "metricWorkplace": "Trabajo",
      "metricSpeaking": "Habla",
      "readiness": "preparación",
      "scenarios": "situaciones",
      "practice": "práctica",
      "whoEyebrow": "A quién sirve",
      "whoTitle": "Creado para organizaciones que ayudan a las personas a tener éxito en Finlandia.",
      "whoBody": "Esta página explica por qué una organización usaría Floently, qué piloto tiene sentido y cómo iniciar la conversación.",
      "audiences": [
        {
          "id": "employers",
          "label": "Empleadores",
          "title": "Integra personal internacional con comunicación en finés más segura.",
          "body": "Da a los empleados un camino claro desde el finés cotidiano hasta situaciones laborales específicas: informar, pedir ayuda, explicar problemas y hablar con colegas o clientes."
        },
        {
          "id": "cities",
          "label": "Ciudades y municipios",
          "title": "Conecta el aprendizaje del idioma con integración y empleo.",
          "body": "Apoya a recién llegados con práctica de finés ligada a YKI, vida laboral y participación duradera en Finlandia."
        },
        {
          "id": "training",
          "label": "Proveedores de formación",
          "title": "Añade práctica oral con AI alrededor del programa.",
          "body": "Usa Floently como capa de práctica entre clases: los estudiantes repiten, reciben correcciones y ganan confianza antes de conversaciones reales."
        }
      ],
      "platformEyebrow": "Qué ofrece Floently",
      "platformTitle": "Una capa de aprendizaje para YKI, trabajo y conversaciones reales.",
      "platformBody": "Floently no es una página de curso estática. Da práctica repetida y ayuda a las organizaciones a apoyar el desarrollo lingüístico entre clases, turnos y citas.",
      "pillars": [
        {
          "id": "yki",
          "label": "Ruta YKI",
          "title": "Preparación del examen con práctica real",
          "body": "La lectura, escucha, escritura y habla se estructuran alrededor de habilidades necesarias para YKI, no solo memorización.",
          "eyebrow": "Ruta YKI"
        },
        {
          "id": "professional",
          "label": "Finés profesional",
          "title": "Comunicación por rol",
          "body": "Las rutas profesionales ayudan a practicar frases, decisiones y malentendidos de lugares de trabajo reales.",
          "eyebrow": "Finés profesional"
        },
        {
          "id": "speaking",
          "label": "Habla y roleplay",
          "title": "Confianza antes de conversaciones reales",
          "body": "Los estudiantes practican con roleplay de AI, ciclos de corrección y tareas realistas para hablar con más naturalidad.",
          "eyebrow": "Habla"
        },
        {
          "id": "visibility",
          "label": "Visibilidad del programa",
          "title": "Una vista más clara del progreso",
          "body": "En pilotos, Floently puede apoyar feedback por grupo: qué practican, dónde tienen dificultades y qué apoyo necesitan.",
          "eyebrow": "Visibilidad"
        }
      ],
      "pilotEyebrow": "Modelo piloto",
      "pilotTitle": "Empieza pequeño, mide la utilidad y escala.",
      "pilotBody": "Un buen piloto organizacional debe ser concreto: un público, un objetivo lingüístico y una mejora medible como confianza, preparación YKI, onboarding o fluidez profesional.",
      "pilotSteps": [
        "Elige el grupo objetivo: personal, buscadores de empleo, estudiantes, clientes de integración o una profesión específica.",
        "Elige el objetivo: YKI, comunicación laboral, onboarding profesional o apoyo combinado.",
        "Ejecuta un piloto pequeño y recoge feedback sobre confianza lingüística, usabilidad y brechas de aprendizaje.",
        "Decide si Floently debe formar parte de la ruta de idioma, onboarding o integración."
      ],
      "demoEyebrow": "Reservar demo",
      "demoTitle": "Cuéntanos sobre tu organización.",
      "demoBody": "Usa el formulario de contacto para enviar la solicitud de demo de tu organización. También puedes escribirnos directamente.",
      "demoNote": "Mensaje sugerido: nombre de la organización, grupo objetivo, número de estudiantes, objetivo y horario preferido.",
      "footerBuilt": "Hecho para Finlandia."
    },
    "contact": {
      "directEmail": "Correo directo",
      "eyebrow": "Reservar demo",
      "title": "Cuéntanos sobre tu organización.",
      "copy": "Solicita una demo de Floently para empleadores, ciudades, municipios, entidades de formación o programas de integración. Responderemos por correo.",
      "formTitle": "Solicitud de demo para organización",
      "formIntro": "Completa los datos. El botón abrirá tu aplicación de correo con el mensaje preparado.",
      "name": "Tu nombre",
      "namePlaceholder": "Nombre completo",
      "email": "Correo laboral",
      "emailPlaceholder": "nombre@organizacion.fi",
      "organization": "Organización",
      "organizationPlaceholder": "Nombre de la organización",
      "role": "Tu función",
      "rolePlaceholder": "RR. HH., coordinador, docente...",
      "organizationType": "Tipo de organización",
      "learners": "Número estimado de estudiantes",
      "learnersPlaceholder": "p. ej. 20 enfermeros, 80 buscadores de empleo",
      "phone": "Teléfono, opcional",
      "phonePlaceholder": "+358 ...",
      "message": "¿Qué quieren resolver?",
      "messagePlaceholder": "Cuéntanos sobre estudiantes, necesidades de finés laboral, preparación YKI, onboarding o idea piloto.",
      "sendDemoRequest": "Enviar solicitud de demo →",
      "note": "Esto usa tu aplicación de correo. El envío por backend puede añadirse más adelante.",
      "organizationTypes": [
        {
          "value": "employer",
          "label": "Empleador"
        },
        {
          "value": "city",
          "label": "Ciudad o municipio"
        },
        {
          "value": "training",
          "label": "Proveedor de formación"
        },
        {
          "value": "integration",
          "label": "Programa de integración"
        },
        {
          "value": "healthcare",
          "label": "Organización sanitaria"
        },
        {
          "value": "other",
          "label": "Otro"
        }
      ],
      "mailtoSubjectPrefix": "Solicitud de demo Floently de",
      "mailtoFallbackOrganization": "una organización",
      "mailtoGreeting": "Hola equipo de Floently,",
      "mailtoIntro": "Queremos reservar una demo para nuestra organización.",
      "mailtoName": "Nombre",
      "mailtoOrganization": "Organización",
      "mailtoRole": "Función",
      "mailtoWorkEmail": "Correo laboral",
      "mailtoPhone": "Teléfono",
      "mailtoOrganizationType": "Tipo de organización",
      "mailtoLearners": "Número estimado de estudiantes",
      "mailtoNeedHelp": "En qué necesitamos ayuda:",
      "mailtoRegards": "Saludos,"
    }
  },
  "tr": {
    "dir": "ltr",
    "common": {
      "language": "Dil",
      "floentlyHome": "Floently ana sayfası",
      "signIn": "Giriş yap",
      "forOrganizations": "Kurumlar için",
      "forOrganizationsArrow": "Kurumlar için →",
      "bookDemo": "Demo ayırt",
      "contact": "İletişim",
      "learnerPage": "Öğrenci sayfası",
      "startLearning": "Öğrenmeye başla",
      "backToFloently": "Floently’ye dön",
      "openContactForm": "İletişim formunu aç"
    },
    "landing": {
      "eyebrow": "YKI’Yİ GEÇ, İŞTE BAŞARILI OL, FİNLANDİYA’YI SEV!",
      "h1Line1": "YKI’yi geç.",
      "h1Line2": "İşte Fince konuş.",
      "heroSub": "YKI ve iş için pratik Fince — Finlandiya’da yaşamaya ve çalışmaya hazırlanan profesyoneller için.",
      "alreadyHaveAccount": "Zaten hesabın var mı?",
      "demoCaption": "Fince pratik yap → düzeltme al → kuralı öğren. Floently böyle çalışır.",
      "trustBuiltForYki": "YKI için tasarlandı",
      "trustForProfessionals": "Profesyoneller için",
      "trustFreeToStart": "Başlamak ücretsiz",
      "pathwaysEyebrow": "Üç yol",
      "pathwaysTitle": "YKI, iş hayatı ve Finlandiya’da yaşam.",
      "pathwaysSub": "Hedefine uyan yolu seç. Ya da ekibini getir — Floently bireyler, şirketler ve şehirler için ölçeklenir.",
      "learnerPath": {
        "id": "learners",
        "label": "Öğrenciler için",
        "title": "YKI’yi geç ve meslek yoluna başla.",
        "body": "Okuma, dinleme, yazma ve konuşma — YKI ve işte gereken Fince etrafında.",
        "link": "Öğrenmeye başla →"
      },
      "employerPath": {
        "id": "employers",
        "label": "İşverenler için",
        "title": "Uluslararası personeli işe alıştır ve elde tut.",
        "body": "Daha güvenli iletişim, daha hızlı onboarding ve daha güçlü bağlılık için işyeri Fincesi.",
        "link": "Pilot ayırt →"
      },
      "cityPath": {
        "id": "cities",
        "label": "Şehirler için",
        "title": "Ölçeklenebilir bir dil yolu.",
        "body": "Dil öğrenimini istihdam edilebilirlik ve Finlandiya toplumuna uzun vadeli katılımla bağla.",
        "link": "Bizimle konuş →"
      },
      "footerMade": "Finlandiya için yapıldı."
    },
    "demo": {
      "label": "Floently · Canlı düzeltme",
      "prompt": "Fince cevabın",
      "sentence": "Kävin apteekkiin eilen.",
      "wrongWord": "apteekkiin",
      "rightWord": "apteekissa",
      "tooltipTitle": "İnessif hâli kullan",
      "tooltipBody": "Käydä fiilinden sonra ziyaret edilen yer için -ssa/-ssä kullanılır: apteekissa, kaupassa, töissä.",
      "success": "Artık Fince gibi geliyor. YKI’ye bir adım daha yakın."
    },
    "organizations": {
      "navEmployers": "İşverenler",
      "navCities": "Şehirler",
      "heroEyebrow": "Kurumlar için",
      "heroTitle": "İş, entegrasyon ve personel bağlılığı için Fince desteği.",
      "heroLede": "Floently kurumların uluslararası yetenekleri pratik Finceyle desteklemesine yardım eder: YKI hazırlığı, işyeri iletişimi, mesleki durumlar ve konuşma güveni.",
      "viewLearnerPage": "Öğrenci sayfasını gör",
      "valueSummaryLabel": "Kurum değeri özeti",
      "cardKicker": "Neden önemli",
      "whyTitle": "Dil yalnızca sınav sorunu değildir.",
      "whyBody": "Onboarding, güvenlik, özgüven, müşteri iletişimi, eğitim ilerlemesi ve insanların Finlandiya’da gelecek kurma duygusunu etkiler.",
      "metricYki": "YKI",
      "metricWorkplace": "İşyeri",
      "metricSpeaking": "Konuşma",
      "readiness": "hazırlık",
      "scenarios": "senaryolar",
      "practice": "pratik",
      "whoEyebrow": "Kime hizmet eder",
      "whoTitle": "İnsanların Finlandiya’da başarılı olmasına yardım eden kurumlar için.",
      "whoBody": "Bu sayfa kurumların Floently’yi neden kullanacağını, hangi pilotun mantıklı olduğunu ve konuşmanın nasıl başlayacağını açıklar.",
      "audiences": [
        {
          "id": "employers",
          "label": "İşverenler",
          "title": "Uluslararası personeli daha güvenli Fince iletişimle işe alıştır.",
          "body": "Çalışanlara günlük Finceden role özel iş durumlarına net bir yol ver: raporlama, yardım isteme, sorun açıklama, meslektaş ve müşteriyle konuşma."
        },
        {
          "id": "cities",
          "label": "Şehirler ve belediyeler",
          "title": "Dil öğrenimini entegrasyon ve istihdamla bağla.",
          "body": "Yeni gelenleri YKI hazırlığı, iş hayatı ve Finlandiya’ya uzun vadeli katılımla ilişkili Fince pratiğiyle destekle."
        },
        {
          "id": "training",
          "label": "Eğitim sağlayıcıları",
          "title": "Programınıza AI destekli konuşma pratiği ekleyin.",
          "body": "Floently’yi dersler arasında pratik katmanı olarak kullanın: öğrenciler tekrar eder, düzeltme alır ve gerçek konuşmadan önce güven kazanır."
        }
      ],
      "platformEyebrow": "Floently ne sağlar",
      "platformTitle": "YKI, iş ve gerçek konuşmalar için öğrenme katmanı.",
      "platformBody": "Floently statik bir kurs sayfası değildir. Tekrarlı pratik sağlar ve kurumlara dersler, vardiyalar ve görüşmeler arasında dil gelişimini desteklemek için net bir yol verir.",
      "pillars": [
        {
          "id": "yki",
          "label": "YKI yolu",
          "title": "Gerçek beceri pratiğiyle sınav hazırlığı",
          "body": "Okuma, dinleme, yazma ve konuşma YKI için gereken beceriler etrafında yapılandırılır; sadece kelime ezberi değildir.",
          "eyebrow": "YKI yolu"
        },
        {
          "id": "professional",
          "label": "Mesleki Fince",
          "title": "Role özel iletişim",
          "body": "Meslek yolları öğrencilerin gerçek işyerlerinde karşılaştıkları ifadeleri, kararları ve yanlış anlamaları çalışmasına yardım eder.",
          "eyebrow": "Mesleki Fince"
        },
        {
          "id": "speaking",
          "label": "Konuşma ve rol oyunu",
          "title": "Gerçek konuşmalardan önce özgüven",
          "body": "Öğrenciler AI rol oyunu, düzeltme döngüleri ve gerçekçi görevlerle baskı altında daha doğal konuşmayı çalışır.",
          "eyebrow": "Konuşma"
        },
        {
          "id": "visibility",
          "label": "Program görünürlüğü",
          "title": "İlerleme için daha net görünüm",
          "body": "Pilotlarda Floently grup düzeyinde geri bildirimi destekleyebilir: ne çalışılıyor, nerede zorlanılıyor ve hangi destek gerekli.",
          "eyebrow": "Görünürlük"
        }
      ],
      "pilotEyebrow": "Deneme modeli",
      "pilotTitle": "Küçük başla, faydayı ölç, sonra ölçekle.",
      "pilotBody": "İyi bir kurum pilotu somut olmalıdır: bir hedef grup, bir dil hedefi ve özgüven, YKI hazırlığı, onboarding iletişimi veya mesleki akıcılık gibi ölçülebilir bir iyileşme.",
      "pilotSteps": [
        "Hedef grubu seç: personel, iş arayanlar, öğrenciler, entegrasyon müşterileri veya belirli bir meslek.",
        "Eğitim hedefini seç: YKI, işyeri iletişimi, mesleki onboarding veya birleşik destek.",
        "Küçük bir pilot yürüt ve dil özgüveni, kullanılabilirlik ve öğrenme boşlukları hakkında geri bildirim topla.",
        "Floently’nin dil, onboarding veya entegrasyon yolunun parçası olup olmayacağına karar ver."
      ],
      "demoEyebrow": "Demo ayırt",
      "demoTitle": "Kurumunuzu bize anlatın.",
      "demoBody": "Kurumunuz için demo talebini iletişim formuyla gönderin. İsterseniz doğrudan e-posta da gönderebilirsiniz.",
      "demoNote": "Önerilen mesaj: kurum adı, hedef grup, öğrenci sayısı, hedef ve tercih edilen demo zamanı.",
      "footerBuilt": "Finlandiya için yapıldı."
    },
    "contact": {
      "directEmail": "Doğrudan e-posta",
      "eyebrow": "Demo ayırt",
      "title": "Kurumunuzu bize anlatın.",
      "copy": "İşverenler, şehirler, eğitim sağlayıcıları veya entegrasyon programları için Floently demosu isteyin. E-posta ile yanıt vereceğiz.",
      "formTitle": "Kurum demo talebi",
      "formIntro": "Aşağıdaki bilgileri doldurun. Düğme hazırlanmış mesajla e-posta uygulamanızı açar.",
      "name": "Adınız",
      "namePlaceholder": "Ad soyad",
      "email": "İş e-postası",
      "emailPlaceholder": "ad@kurum.fi",
      "organization": "Kurum",
      "organizationPlaceholder": "Kurum adı",
      "role": "Göreviniz",
      "rolePlaceholder": "İK, koordinatör, öğretmen...",
      "organizationType": "Kurum türü",
      "learners": "Tahmini öğrenci sayısı",
      "learnersPlaceholder": "örn. 20 hemşire, 80 iş arayan",
      "phone": "Telefon, isteğe bağlı",
      "phonePlaceholder": "+358 ...",
      "message": "Neyi çözmek istiyorsunuz?",
      "messagePlaceholder": "Öğrencileriniz, işyeri Fince ihtiyaçları, YKI hazırlığı, onboarding veya pilot fikri hakkında bilgi verin.",
      "sendDemoRequest": "Demo talebi gönder →",
      "note": "Bu, e-posta uygulamanızı kullanır. Backend form gönderimi daha sonra eklenebilir.",
      "organizationTypes": [
        {
          "value": "employer",
          "label": "İşveren"
        },
        {
          "value": "city",
          "label": "Şehir veya belediye"
        },
        {
          "value": "training",
          "label": "Eğitim sağlayıcı"
        },
        {
          "value": "integration",
          "label": "Entegrasyon programı"
        },
        {
          "value": "healthcare",
          "label": "Sağlık kuruluşu"
        },
        {
          "value": "other",
          "label": "Diğer"
        }
      ],
      "mailtoSubjectPrefix": "Floently demo talebi",
      "mailtoFallbackOrganization": "bir kurum",
      "mailtoGreeting": "Merhaba Floently ekibi,",
      "mailtoIntro": "Kurumumuz için demo ayırtmak istiyoruz.",
      "mailtoName": "Ad",
      "mailtoOrganization": "Kurum",
      "mailtoRole": "Görev",
      "mailtoWorkEmail": "İş e-postası",
      "mailtoPhone": "Telefon",
      "mailtoOrganizationType": "Kurum türü",
      "mailtoLearners": "Tahmini öğrenci sayısı",
      "mailtoNeedHelp": "Yardıma ihtiyaç duyduğumuz konu:",
      "mailtoRegards": "Saygılar,"
    }
  },
  "ru": {
    "dir": "ltr",
    "common": {
      "language": "Язык",
      "floentlyHome": "Главная Floently",
      "signIn": "Войти",
      "forOrganizations": "Для организаций",
      "forOrganizationsArrow": "Для организаций →",
      "bookDemo": "Заказать демо",
      "contact": "Контакт",
      "learnerPage": "Страница учащегося",
      "startLearning": "Начать обучение",
      "backToFloently": "Назад во Floently",
      "openContactForm": "Открыть форму контакта"
    },
    "landing": {
      "eyebrow": "СДАЙТЕ YKI, УСПЕВАЙТЕ НА РАБОТЕ, ЛЮБИТЕ ФИНЛЯНДИЮ!",
      "h1Line1": "Сдайте YKI.",
      "h1Line2": "Говорите по-фински на работе.",
      "heroSub": "Практический финский для YKI и работы — для специалистов, готовящихся жить и работать в Финляндии.",
      "alreadyHaveAccount": "Уже есть аккаунт?",
      "demoCaption": "Практикуйте финский → получайте исправления → изучайте правило. Так работает Floently.",
      "trustBuiltForYki": "Создано для YKI",
      "trustForProfessionals": "Для специалистов",
      "trustFreeToStart": "Начать бесплатно",
      "pathwaysEyebrow": "Три пути",
      "pathwaysTitle": "YKI, работа и жизнь в Финляндии.",
      "pathwaysSub": "Выберите путь под свою цель. Или подключите команду — Floently подходит для людей, компаний и городов.",
      "learnerPath": {
        "id": "learners",
        "label": "Для учащихся",
        "title": "Сдайте YKI и начните профессиональный путь.",
        "body": "Чтение, аудирование, письмо и говорение — вокруг YKI и финского, нужного на работе.",
        "link": "Начать обучение →"
      },
      "employerPath": {
        "id": "employers",
        "label": "Для работодателей",
        "title": "Адаптируйте и удерживайте международных сотрудников.",
        "body": "Рабочий финский для более безопасной коммуникации, быстрой адаптации и сильного удержания.",
        "link": "Заказать пилот →"
      },
      "cityPath": {
        "id": "cities",
        "label": "Для городов",
        "title": "Масштабируемый языковой путь.",
        "body": "Свяжите изучение языка с трудоустройством и долгосрочным участием в финском обществе.",
        "link": "Связаться →"
      },
      "footerMade": "Создано для Финляндии."
    },
    "demo": {
      "label": "Floently · Исправление в реальном времени",
      "prompt": "Ваш ответ по-фински",
      "sentence": "Kävin apteekkiin eilen.",
      "wrongWord": "apteekkiin",
      "rightWord": "apteekissa",
      "tooltipTitle": "Используйте инессив",
      "tooltipBody": "После käydä используйте -ssa/-ssä для места посещения: apteekissa, kaupassa, töissä.",
      "success": "Теперь звучит по-фински. Еще один шаг к YKI."
    },
    "organizations": {
      "navEmployers": "Работодатели",
      "navCities": "Города",
      "heroEyebrow": "Для организаций",
      "heroTitle": "Поддержка финского языка для работы, интеграции и удержания.",
      "heroLede": "Floently помогает организациям поддерживать международные таланты практическим финским: готовность к YKI, рабочая коммуникация, профессиональные ситуации и уверенность речи.",
      "viewLearnerPage": "Страница учащегося",
      "valueSummaryLabel": "Ценность для организации",
      "cardKicker": "Почему это важно",
      "whyTitle": "Язык — не только экзаменационная проблема.",
      "whyBody": "Он влияет на адаптацию, безопасность, уверенность, общение с клиентами, учебный прогресс и возможность строить будущее в Финляндии.",
      "metricYki": "YKI",
      "metricWorkplace": "Работа",
      "metricSpeaking": "Говорение",
      "readiness": "готовность",
      "scenarios": "сценарии",
      "practice": "практика",
      "whoEyebrow": "Для кого это",
      "whoTitle": "Для организаций, которые помогают людям добиться успеха в Финляндии.",
      "whoBody": "Эта страница объясняет, зачем организации использовать Floently, какой пилот имеет смысл и как начать разговор.",
      "audiences": [
        {
          "id": "employers",
          "label": "Работодатели",
          "title": "Адаптируйте международных сотрудников к более безопасному финскому общению.",
          "body": "Дайте сотрудникам понятный путь от бытового финского к рабочим ситуациям: отчеты, просьбы о помощи, объяснение проблем и разговоры с коллегами или клиентами."
        },
        {
          "id": "cities",
          "label": "Города и муниципалитеты",
          "title": "Свяжите изучение языка с интеграцией и работой.",
          "body": "Поддерживайте новичков практикой финского, связанной с YKI, трудовой жизнью и долгосрочным участием в Финляндии."
        },
        {
          "id": "training",
          "label": "Учебные организации",
          "title": "Добавьте AI-практику речи вокруг программы.",
          "body": "Используйте Floently как слой практики между занятиями: учащиеся повторяют, получают исправления и набирают уверенность перед реальными разговорами."
        }
      ],
      "platformEyebrow": "Что дает Floently",
      "platformTitle": "Учебный слой для YKI, работы и реальных разговоров.",
      "platformBody": "Floently — не статическая страница курса. Он дает повторную практику и помогает организациям поддерживать развитие языка между уроками, сменами и встречами.",
      "pillars": [
        {
          "id": "yki",
          "label": "Путь YKI",
          "title": "Готовность к экзамену через реальные навыки",
          "body": "Чтение, аудирование, письмо и говорение строятся вокруг навыков YKI, а не только запоминания слов.",
          "eyebrow": "Путь YKI"
        },
        {
          "id": "professional",
          "label": "Профессиональный финский",
          "title": "Коммуникация по ролям",
          "body": "Профессиональные треки помогают тренировать фразы, решения и недопонимания из реальных рабочих мест.",
          "eyebrow": "Проф. финский"
        },
        {
          "id": "speaking",
          "label": "Речь и роли",
          "title": "Уверенность перед реальными разговорами",
          "body": "Учащиеся практикуют AI-ролевые игры, циклы исправлений и реалистичные задания, чтобы говорить естественнее.",
          "eyebrow": "Говорение"
        },
        {
          "id": "visibility",
          "label": "Видимость программы",
          "title": "Более ясная картина прогресса",
          "body": "В пилотах Floently может поддерживать групповую обратную связь: что практикуют, где трудности и какая помощь нужна.",
          "eyebrow": "Видимость"
        }
      ],
      "pilotEyebrow": "Модель пилота",
      "pilotTitle": "Начните с малого, измерьте пользу и масштабируйте.",
      "pilotBody": "Хороший пилот конкретен: одна аудитория, одна языковая цель и одно измеримое улучшение — уверенность, готовность к YKI, коммуникация при адаптации или профессиональная беглость.",
      "pilotSteps": [
        "Выберите группу: персонал, соискатели, студенты, клиенты интеграции или конкретная профессия.",
        "Выберите цель: YKI, рабочая коммуникация, профессиональная адаптация или комбинированная поддержка.",
        "Запустите небольшой пилот и соберите отзывы об уверенности, удобстве и пробелах обучения.",
        "Решите, должен ли Floently стать частью языкового, адаптационного или интеграционного пути."
      ],
      "demoEyebrow": "Заказать демо",
      "demoTitle": "Расскажите нам о вашей организации.",
      "demoBody": "Используйте контактную форму для запроса демо вашей организации. Вы также можете написать нам напрямую.",
      "demoNote": "Рекомендуемое сообщение: название организации, целевая группа, число учащихся, цель и удобное время демо.",
      "footerBuilt": "Создано для Финляндии."
    },
    "contact": {
      "directEmail": "Прямой email",
      "eyebrow": "Заказать демо",
      "title": "Расскажите нам о вашей организации.",
      "copy": "Запросите демо Floently для работодателей, городов, учебных организаций или интеграционных программ. Мы ответим по электронной почте.",
      "formTitle": "Запрос демо для организации",
      "formIntro": "Заполните данные ниже. Кнопка откроет почтовое приложение с подготовленным сообщением.",
      "name": "Ваше имя",
      "namePlaceholder": "Полное имя",
      "email": "Рабочая почта",
      "emailPlaceholder": "name@organization.fi",
      "organization": "Организация",
      "organizationPlaceholder": "Название организации",
      "role": "Ваша роль",
      "rolePlaceholder": "HR, координатор, преподаватель...",
      "organizationType": "Тип организации",
      "learners": "Примерное число учащихся",
      "learnersPlaceholder": "например, 20 медсестер, 80 соискателей",
      "phone": "Телефон, необязательно",
      "phonePlaceholder": "+358 ...",
      "message": "Что вы хотите решить?",
      "messagePlaceholder": "Расскажите об учащихся, потребностях в финском на работе, подготовке к YKI, адаптации или идее пилота.",
      "sendDemoRequest": "Отправить запрос демо →",
      "note": "Используется ваше почтовое приложение. Отправку формы через backend можно добавить позже.",
      "organizationTypes": [
        {
          "value": "employer",
          "label": "Работодатель"
        },
        {
          "value": "city",
          "label": "Город или муниципалитет"
        },
        {
          "value": "training",
          "label": "Учебная организация"
        },
        {
          "value": "integration",
          "label": "Интеграционная программа"
        },
        {
          "value": "healthcare",
          "label": "Медицинская организация"
        },
        {
          "value": "other",
          "label": "Другое"
        }
      ],
      "mailtoSubjectPrefix": "Запрос демо Floently от",
      "mailtoFallbackOrganization": "организации",
      "mailtoGreeting": "Здравствуйте, команда Floently,",
      "mailtoIntro": "Мы хотели бы заказать демо для нашей организации.",
      "mailtoName": "Имя",
      "mailtoOrganization": "Организация",
      "mailtoRole": "Роль",
      "mailtoWorkEmail": "Рабочая почта",
      "mailtoPhone": "Телефон",
      "mailtoOrganizationType": "Тип организации",
      "mailtoLearners": "Примерное число учащихся",
      "mailtoNeedHelp": "В чем нужна помощь:",
      "mailtoRegards": "С уважением,"
    }
  },
  "uk": {
    "dir": "ltr",
    "common": {
      "language": "Мова",
      "floentlyHome": "Головна Floently",
      "signIn": "Увійти",
      "forOrganizations": "Для організацій",
      "forOrganizationsArrow": "Для організацій →",
      "bookDemo": "Замовити демо",
      "contact": "Контакт",
      "learnerPage": "Сторінка учня",
      "startLearning": "Почати навчання",
      "backToFloently": "Назад до Floently",
      "openContactForm": "Відкрити контактну форму"
    },
    "landing": {
      "eyebrow": "СКЛАДІТЬ YKI, ДОСЯГАЙТЕ УСПІХУ НА РОБОТІ, ЛЮБІТЬ ФІНЛЯНДІЮ!",
      "h1Line1": "Складіть YKI.",
      "h1Line2": "Говоріть фінською на роботі.",
      "heroSub": "Практична фінська для YKI та роботи — для фахівців, які готуються жити й працювати у Фінляндії.",
      "alreadyHaveAccount": "Уже маєте акаунт?",
      "demoCaption": "Практикуйте фінську → отримуйте виправлення → вивчайте правило. Так працює Floently.",
      "trustBuiltForYki": "Створено для YKI",
      "trustForProfessionals": "Для фахівців",
      "trustFreeToStart": "Почати безкоштовно",
      "pathwaysEyebrow": "Три шляхи",
      "pathwaysTitle": "YKI, робота і життя у Фінляндії.",
      "pathwaysSub": "Оберіть шлях під свою мету. Або запросіть команду — Floently працює для людей, компаній і міст.",
      "learnerPath": {
        "id": "learners",
        "label": "Для учнів",
        "title": "Складіть YKI і почніть професійний шлях.",
        "body": "Читання, слухання, письмо і мовлення — навколо YKI та фінської, потрібної на роботі.",
        "link": "Почати навчання →"
      },
      "employerPath": {
        "id": "employers",
        "label": "Для роботодавців",
        "title": "Адаптуйте й утримуйте міжнародний персонал.",
        "body": "Робоча фінська для безпечнішої комунікації, швидшої адаптації та сильнішого утримання.",
        "link": "Замовити пілот →"
      },
      "cityPath": {
        "id": "cities",
        "label": "Для міст",
        "title": "Масштабований мовний шлях.",
        "body": "Пов’яжіть вивчення мови з працевлаштуванням і довгостроковою участю у фінському суспільстві.",
        "link": "Зв’язатися →"
      },
      "footerMade": "Створено для Фінляндії."
    },
    "demo": {
      "label": "Floently · Живе виправлення",
      "prompt": "Ваша відповідь фінською",
      "sentence": "Kävin apteekkiin eilen.",
      "wrongWord": "apteekkiin",
      "rightWord": "apteekissa",
      "tooltipTitle": "Використовуйте інесив",
      "tooltipBody": "Після käydä використовуйте -ssa/-ssä для місця відвідування: apteekissa, kaupassa, töissä.",
      "success": "Тепер звучить по-фінськи. Ще крок до YKI."
    },
    "organizations": {
      "navEmployers": "Роботодавці",
      "navCities": "Міста",
      "heroEyebrow": "Для організацій",
      "heroTitle": "Підтримка фінської мови для роботи, інтеграції та утримання.",
      "heroLede": "Floently допомагає організаціям підтримувати міжнародні таланти практичною фінською: готовність до YKI, робоча комунікація, професійні ситуації і впевнене мовлення.",
      "viewLearnerPage": "Сторінка учня",
      "valueSummaryLabel": "Цінність для організації",
      "cardKicker": "Чому це важливо",
      "whyTitle": "Мова — не лише екзаменаційна проблема.",
      "whyBody": "Вона впливає на адаптацію, безпеку, впевненість, спілкування з клієнтами, навчальний прогрес і майбутнє у Фінляндії.",
      "metricYki": "YKI",
      "metricWorkplace": "Робота",
      "metricSpeaking": "Мовлення",
      "readiness": "готовність",
      "scenarios": "сценарії",
      "practice": "практика",
      "whoEyebrow": "Кому це служить",
      "whoTitle": "Для організацій, які допомагають людям досягати успіху у Фінляндії.",
      "whoBody": "Ця сторінка пояснює, навіщо організації використовувати Floently, який пілот має сенс і як почати розмову.",
      "audiences": [
        {
          "id": "employers",
          "label": "Роботодавці",
          "title": "Адаптуйте міжнародний персонал до безпечнішої фінської комунікації.",
          "body": "Дайте працівникам чіткий шлях від побутової фінської до робочих ситуацій: звітування, прохання про допомогу, пояснення проблем і розмови з колегами чи клієнтами."
        },
        {
          "id": "cities",
          "label": "Міста і муніципалітети",
          "title": "Пов’яжіть мову з інтеграцією та роботою.",
          "body": "Підтримуйте новоприбулих практикою фінської, пов’язаною з YKI, робочим життям і довгостроковою участю у Фінляндії."
        },
        {
          "id": "training",
          "label": "Навчальні організації",
          "title": "Додайте AI-практику мовлення до програми.",
          "body": "Використовуйте Floently як шар практики між заняттями: учні повторюють, отримують виправлення і набувають впевненості."
        }
      ],
      "platformEyebrow": "Що дає Floently",
      "platformTitle": "Навчальний шар для YKI, роботи і реальних розмов.",
      "platformBody": "Floently не є статичною сторінкою курсу. Він дає повторну практику і допомагає організаціям підтримувати розвиток мови між уроками, змінами та зустрічами.",
      "pillars": [
        {
          "id": "yki",
          "label": "Шлях YKI",
          "title": "Готовність до іспиту через справжні навички",
          "body": "Читання, слухання, письмо і мовлення побудовані навколо навичок для YKI, не лише запам’ятовування слів.",
          "eyebrow": "Шлях YKI"
        },
        {
          "id": "professional",
          "label": "Професійна фінська",
          "title": "Комунікація за роллю",
          "body": "Професійні треки допомагають практикувати фрази, рішення і непорозуміння з реальних робочих місць.",
          "eyebrow": "Проф. фінська"
        },
        {
          "id": "speaking",
          "label": "Мовлення і ролі",
          "title": "Впевненість перед реальними розмовами",
          "body": "Учні практикують AI-рольові ігри, цикли виправлення і реалістичні завдання, щоб говорити природніше.",
          "eyebrow": "Мовлення"
        },
        {
          "id": "visibility",
          "label": "Видимість програми",
          "title": "Чіткіший прогрес учнів",
          "body": "У пілотах Floently може підтримувати груповий зворотний зв’язок: що практикують, де складно і яка підтримка потрібна.",
          "eyebrow": "Видимість"
        }
      ],
      "pilotEyebrow": "Модель пілоту",
      "pilotTitle": "Почніть з малого, виміряйте користь і масштабуйте.",
      "pilotBody": "Добрий пілот конкретний: одна аудиторія, одна мовна мета і одне вимірюване покращення — впевненість, готовність до YKI, адаптаційна комунікація або професійна плавність.",
      "pilotSteps": [
        "Оберіть групу: персонал, шукачі роботи, студенти, клієнти інтеграції або конкретна професія.",
        "Оберіть мету: YKI, робоча комунікація, професійна адаптація або комбінована підтримка.",
        "Запустіть малий пілот і зберіть відгуки про мовну впевненість, зручність і прогалини навчання.",
        "Вирішіть, чи має Floently стати частиною мовного, адаптаційного або інтеграційного шляху."
      ],
      "demoEyebrow": "Замовити демо",
      "demoTitle": "Розкажіть нам про вашу організацію.",
      "demoBody": "Скористайтеся контактною формою, щоб надіслати запит демо. Також можна написати нам напряму.",
      "demoNote": "Рекомендоване повідомлення: назва організації, цільова група, кількість учнів, мета і бажаний час демо.",
      "footerBuilt": "Створено для Фінляндії."
    },
    "contact": {
      "directEmail": "Пряма електронна пошта",
      "eyebrow": "Замовити демо",
      "title": "Розкажіть нам про вашу організацію.",
      "copy": "Запросіть демо Floently для роботодавців, міст, навчальних організацій або інтеграційних програм. Ми відповімо електронною поштою.",
      "formTitle": "Запит демо для організації",
      "formIntro": "Заповніть дані нижче. Кнопка відкриє поштову програму з підготовленим повідомленням.",
      "name": "Ваше ім’я",
      "namePlaceholder": "Повне ім’я",
      "email": "Робоча електронна пошта",
      "emailPlaceholder": "name@organization.fi",
      "organization": "Організація",
      "organizationPlaceholder": "Назва організації",
      "role": "Ваша роль",
      "rolePlaceholder": "HR, координатор, викладач...",
      "organizationType": "Тип організації",
      "learners": "Орієнтовна кількість учнів",
      "learnersPlaceholder": "напр. 20 медсестер, 80 шукачів роботи",
      "phone": "Телефон, необов’язково",
      "phonePlaceholder": "+358 ...",
      "message": "Що ви хочете вирішити?",
      "messagePlaceholder": "Розкажіть про учнів, потреби фінської на роботі, підготовку до YKI, адаптацію або ідею пілоту.",
      "sendDemoRequest": "Надіслати запит демо →",
      "note": "Це використовує вашу поштову програму. Backend-відправку форми можна додати пізніше.",
      "organizationTypes": [
        {
          "value": "employer",
          "label": "Роботодавець"
        },
        {
          "value": "city",
          "label": "Місто або муніципалітет"
        },
        {
          "value": "training",
          "label": "Навчальна організація"
        },
        {
          "value": "integration",
          "label": "Інтеграційна програма"
        },
        {
          "value": "healthcare",
          "label": "Медична організація"
        },
        {
          "value": "other",
          "label": "Інше"
        }
      ],
      "mailtoSubjectPrefix": "Запит демо Floently від",
      "mailtoFallbackOrganization": "організації",
      "mailtoGreeting": "Вітаємо, команда Floently,",
      "mailtoIntro": "Ми хотіли б замовити демо для нашої організації.",
      "mailtoName": "Ім’я",
      "mailtoOrganization": "Організація",
      "mailtoRole": "Роль",
      "mailtoWorkEmail": "Робоча пошта",
      "mailtoPhone": "Телефон",
      "mailtoOrganizationType": "Тип організації",
      "mailtoLearners": "Орієнтовна кількість учнів",
      "mailtoNeedHelp": "У чому нам потрібна допомога:",
      "mailtoRegards": "З повагою,"
    }
  },
  "ar": {
    "dir": "rtl",
    "common": {
      "language": "اللغة",
      "floentlyHome": "صفحة Floently الرئيسية",
      "signIn": "تسجيل الدخول",
      "forOrganizations": "للمنظمات",
      "forOrganizationsArrow": "للمنظمات ←",
      "bookDemo": "احجز عرضًا",
      "contact": "تواصل",
      "learnerPage": "صفحة المتعلم",
      "startLearning": "ابدأ التعلم",
      "backToFloently": "العودة إلى Floently",
      "openContactForm": "افتح نموذج التواصل"
    },
    "landing": {
      "eyebrow": "اجتز YKI، انجح في العمل، وازدهر في فنلندا!",
      "h1Line1": "اجتز YKI.",
      "h1Line2": "تحدث الفنلندية في العمل.",
      "heroSub": "فنلندية عملية لاختبار YKI والعمل — للمهنيين الذين يستعدون للعيش والعمل في فنلندا.",
      "alreadyHaveAccount": "هل لديك حساب بالفعل؟",
      "demoCaption": "تدرّب على الفنلندية → احصل على تصحيح → تعلّم القاعدة. هكذا يعمل Floently.",
      "trustBuiltForYki": "مصمم لاختبار YKI",
      "trustForProfessionals": "للمهنيين",
      "trustFreeToStart": "البدء مجاني",
      "pathwaysEyebrow": "ثلاثة مسارات",
      "pathwaysTitle": "YKI والعمل والحياة في فنلندا.",
      "pathwaysSub": "اختر المسار المناسب لهدفك. أو اجلب فريقك — Floently مناسب للأفراد والشركات والمدن.",
      "learnerPath": {
        "id": "learners",
        "label": "للمتعلمين",
        "title": "اجتز YKI وابدأ مسارك المهني.",
        "body": "قراءة واستماع وكتابة ومحادثة حول YKI والفنلندية التي تحتاجها في العمل.",
        "link": "ابدأ التعلم ←"
      },
      "employerPath": {
        "id": "employers",
        "label": "لأصحاب العمل",
        "title": "أدمج الموظفين الدوليين واحتفظ بهم.",
        "body": "فنلندية العمل لتواصل أكثر أمانًا وتهيئة أسرع واحتفاظ أقوى.",
        "link": "احجز تجربة ←"
      },
      "cityPath": {
        "id": "cities",
        "label": "للمدن",
        "title": "مسار لغوي قابل للتوسع.",
        "body": "اربط تعلم اللغة بالتوظيف والمشاركة الطويلة في المجتمع الفنلندي.",
        "link": "تحدث معنا ←"
      },
      "footerMade": "مصمم من أجل فنلندا."
    },
    "demo": {
      "label": "Floently · تصحيح مباشر",
      "prompt": "إجابتك بالفنلندية",
      "sentence": "Kävin apteekkiin eilen.",
      "wrongWord": "apteekkiin",
      "rightWord": "apteekissa",
      "tooltipTitle": "استخدم حالة inessiivi",
      "tooltipBody": "بعد käydä تُستخدم -ssa/-ssä للمكان: apteekissa, kaupassa, töissä.",
      "success": "الآن تبدو الجملة فنلندية. خطوة أقرب إلى YKI."
    },
    "organizations": {
      "navEmployers": "أصحاب العمل",
      "navCities": "المدن",
      "heroEyebrow": "للمنظمات",
      "heroTitle": "دعم الفنلندية للعمل والاندماج والاستقرار.",
      "heroLede": "يساعد Floently المنظمات على دعم المواهب الدولية بفنلندية عملية: استعداد YKI، تواصل العمل، مواقف مهنية وثقة في الحديث.",
      "viewLearnerPage": "عرض صفحة المتعلم",
      "valueSummaryLabel": "ملخص قيمة المنظمة",
      "cardKicker": "لماذا يهم",
      "whyTitle": "اللغة ليست مشكلة امتحان فقط.",
      "whyBody": "تؤثر في التهيئة والسلامة والثقة والتواصل مع العملاء والتقدم الدراسي وبناء مستقبل في فنلندا.",
      "metricYki": "YKI",
      "metricWorkplace": "مكان العمل",
      "metricSpeaking": "المحادثة",
      "readiness": "استعداد",
      "scenarios": "مواقف",
      "practice": "تدريب",
      "whoEyebrow": "لمن يخدم",
      "whoTitle": "للمنظمات التي تساعد الناس على النجاح في فنلندا.",
      "whoBody": "تشرح هذه الصفحة لماذا تستخدم المنظمة Floently، وما نوع التجربة المناسب، وكيف تبدأ المحادثة.",
      "audiences": [
        {
          "id": "employers",
          "label": "أصحاب العمل",
          "title": "هيّئ الموظفين الدوليين لتواصل فنلندي أكثر أمانًا.",
          "body": "امنح الموظفين طريقًا واضحًا من الفنلندية اليومية إلى مواقف العمل: التقارير وطلب المساعدة وشرح المشكلات والحديث مع الزملاء أو العملاء."
        },
        {
          "id": "cities",
          "label": "المدن والبلديات",
          "title": "اربط تعلم اللغة بالاندماج والعمل.",
          "body": "ادعم القادمين الجدد بتدريب فنلندي مرتبط بـ YKI والحياة العملية والمشاركة الطويلة في فنلندا."
        },
        {
          "id": "training",
          "label": "مزودو التدريب",
          "title": "أضف تدريب محادثة مدعومًا بالذكاء الاصطناعي.",
          "body": "استخدم Floently كطبقة تدريب بين الدروس: يكرر المتعلمون ويتلقون التصحيح ويبنون الثقة."
        }
      ],
      "platformEyebrow": "ما الذي يقدمه Floently",
      "platformTitle": "طبقة تعلم لـ YKI والعمل والمحادثات الحقيقية.",
      "platformBody": "Floently ليس صفحة دورة ثابتة. يمنح تدريبًا متكررًا ويساعد المنظمات على دعم تطور اللغة بين الدروس والورديات والمواعيد.",
      "pillars": [
        {
          "id": "yki",
          "label": "مسار YKI",
          "title": "استعداد للامتحان بمهارات حقيقية",
          "body": "القراءة والاستماع والكتابة والمحادثة منظمة حول مهارات YKI، لا حفظ الكلمات فقط.",
          "eyebrow": "مسار YKI"
        },
        {
          "id": "professional",
          "label": "فنلندية مهنية",
          "title": "تواصل حسب الدور",
          "body": "تساعد المسارات المهنية المتعلمين على تدريب العبارات والقرارات وسوء الفهم في العمل الحقيقي.",
          "eyebrow": "فنلندية مهنية"
        },
        {
          "id": "speaking",
          "label": "محادثة وتمثيل أدوار",
          "title": "ثقة قبل المحادثات الحقيقية",
          "body": "يتدرب المتعلمون مع تمثيل أدوار AI وتصحيح ومهام واقعية ليتحدثوا بطبيعية أكبر.",
          "eyebrow": "محادثة وتمثيل أدوار"
        },
        {
          "id": "visibility",
          "label": "وضوح البرنامج",
          "title": "رؤية أوضح لتقدم المتعلم",
          "body": "في التجارب يمكن أن يدعم Floently تغذية راجعة للمجموعة: ماذا يتدربون وأين يتعثرون وما الدعم التالي.",
          "eyebrow": "وضوح البرنامج"
        }
      ],
      "pilotEyebrow": "نموذج التجربة",
      "pilotTitle": "ابدأ صغيرًا، قِس الفائدة، ثم وسّع.",
      "pilotBody": "التجربة الجيدة محددة: جمهور واحد وهدف لغوي واحد وتحسن قابل للقياس مثل الثقة أو YKI أو تواصل التهيئة أو الطلاقة المهنية.",
      "pilotSteps": [
        "اختر المجموعة المستهدفة: موظفون أو باحثون عن عمل أو طلاب أو عملاء اندماج أو مهنة محددة.",
        "اختر هدف التدريب: YKI أو تواصل العمل أو التهيئة المهنية أو دعمًا مشتركًا.",
        "نفّذ تجربة صغيرة واجمع ملاحظات عن الثقة اللغوية وسهولة الاستخدام وفجوات التعلم.",
        "قرر هل يصبح Floently جزءًا من مسار اللغة أو التهيئة أو الاندماج."
      ],
      "demoEyebrow": "احجز عرضًا",
      "demoTitle": "أخبرنا عن منظمتك.",
      "demoBody": "استخدم نموذج التواصل لإرسال طلب عرض لمنظمتك. يمكنك أيضًا مراسلتنا مباشرة.",
      "demoNote": "رسالة مقترحة: اسم المنظمة، الفئة المستهدفة، عدد المتعلمين، الهدف والوقت المفضل.",
      "footerBuilt": "مصمم من أجل فنلندا."
    },
    "contact": {
      "directEmail": "البريد المباشر",
      "eyebrow": "احجز عرضًا",
      "title": "أخبرنا عن منظمتك.",
      "copy": "اطلب عرض Floently لأصحاب العمل والمدن والبلديات ومزودي التدريب وبرامج الاندماج. سنرد عبر البريد الإلكتروني.",
      "formTitle": "طلب عرض للمنظمة",
      "formIntro": "املأ البيانات أدناه. يفتح الزر تطبيق البريد برسالة جاهزة.",
      "name": "اسمك",
      "namePlaceholder": "الاسم الكامل",
      "email": "بريد العمل",
      "emailPlaceholder": "name@organization.fi",
      "organization": "المنظمة",
      "organizationPlaceholder": "اسم المنظمة",
      "role": "دورك",
      "rolePlaceholder": "الموارد البشرية، منسق، معلم...",
      "organizationType": "نوع المنظمة",
      "learners": "عدد المتعلمين المتوقع",
      "learnersPlaceholder": "مثلاً 20 ممرضًا، 80 باحثًا عن عمل",
      "phone": "الهاتف، اختياري",
      "phonePlaceholder": "+358 ...",
      "message": "ما الذي تريدون حله؟",
      "messagePlaceholder": "أخبرنا عن المتعلمين واحتياجات الفنلندية في العمل والتحضير لـ YKI أو فكرة التجربة.",
      "sendDemoRequest": "إرسال طلب العرض ←",
      "note": "يستخدم هذا تطبيق البريد لديك. يمكن إضافة إرسال النموذج من الخادم لاحقًا.",
      "organizationTypes": [
        {
          "value": "employer",
          "label": "صاحب عمل"
        },
        {
          "value": "city",
          "label": "مدينة أو بلدية"
        },
        {
          "value": "training",
          "label": "مزود تدريب"
        },
        {
          "value": "integration",
          "label": "برنامج اندماج"
        },
        {
          "value": "healthcare",
          "label": "منظمة صحية"
        },
        {
          "value": "other",
          "label": "أخرى"
        }
      ],
      "mailtoSubjectPrefix": "طلب عرض Floently من",
      "mailtoFallbackOrganization": "منظمة",
      "mailtoGreeting": "مرحبًا فريق Floently،",
      "mailtoIntro": "نرغب في حجز عرض لمنظمتنا.",
      "mailtoName": "الاسم",
      "mailtoOrganization": "المنظمة",
      "mailtoRole": "الدور",
      "mailtoWorkEmail": "بريد العمل",
      "mailtoPhone": "الهاتف",
      "mailtoOrganizationType": "نوع المنظمة",
      "mailtoLearners": "عدد المتعلمين المتوقع",
      "mailtoNeedHelp": "ما نحتاج المساعدة فيه:",
      "mailtoRegards": "مع التحية،"
    }
  },
  "zh": {
    "dir": "ltr",
    "common": {
      "language": "语言",
      "floentlyHome": "Floently 首页",
      "signIn": "登录",
      "forOrganizations": "面向组织",
      "forOrganizationsArrow": "面向组织 →",
      "bookDemo": "预约演示",
      "contact": "联系",
      "learnerPage": "学习者页面",
      "startLearning": "开始学习",
      "backToFloently": "返回 Floently",
      "openContactForm": "打开联系表单"
    },
    "landing": {
      "eyebrow": "通过 YKI，在工作中成功，热爱芬兰！",
      "h1Line1": "通过 YKI。",
      "h1Line2": "在工作中说芬兰语。",
      "heroSub": "面向 YKI 和工作的实用芬兰语，适合准备在芬兰生活和工作的专业人士。",
      "alreadyHaveAccount": "已经有账号？",
      "demoCaption": "练习芬兰语 → 获得纠正 → 学会规则。这就是 Floently 的工作方式。",
      "trustBuiltForYki": "为 YKI 打造",
      "trustForProfessionals": "面向专业人士",
      "trustFreeToStart": "免费开始",
      "pathwaysEyebrow": "三条路径",
      "pathwaysTitle": "YKI、工作和芬兰生活。",
      "pathwaysSub": "选择符合目标的路径。也可以带上团队 — Floently 适合个人、公司和城市。",
      "learnerPath": {
        "id": "learners",
        "label": "面向学习者",
        "title": "通过 YKI，开始职业道路。",
        "body": "阅读、听力、写作和口语，围绕 YKI 和工作所需芬兰语设计。",
        "link": "开始学习 →"
      },
      "employerPath": {
        "id": "employers",
        "label": "面向雇主",
        "title": "帮助国际员工入职并留下来。",
        "body": "职场芬兰语让沟通更安全、入职更快、留任更强。",
        "link": "预约试点 →"
      },
      "cityPath": {
        "id": "cities",
        "label": "面向城市",
        "title": "可扩展的语言路径。",
        "body": "把语言学习与就业能力和长期参与芬兰社会连接起来。",
        "link": "联系我们 →"
      },
      "footerMade": "为芬兰而打造。"
    },
    "demo": {
      "label": "Floently · 实时纠正",
      "prompt": "你的芬兰语回答",
      "sentence": "Kävin apteekkiin eilen.",
      "wrongWord": "apteekkiin",
      "rightWord": "apteekissa",
      "tooltipTitle": "使用内格形式",
      "tooltipBody": "käydä 后用 -ssa/-ssä 表示去过的地点：apteekissa, kaupassa, töissä。",
      "success": "现在听起来像芬兰语。离 YKI 更近一步。"
    },
    "organizations": {
      "navEmployers": "雇主",
      "navCities": "城市",
      "heroEyebrow": "面向组织",
      "heroTitle": "面向工作、融入和留任的芬兰语支持。",
      "heroLede": "Floently 用实用芬兰语帮助组织支持国际人才：YKI 准备、职场沟通、专业场景和口语信心。",
      "viewLearnerPage": "查看学习者页面",
      "valueSummaryLabel": "组织价值摘要",
      "cardKicker": "为什么重要",
      "whyTitle": "语言不只是考试问题。",
      "whyBody": "它影响入职、安全、信心、客户沟通、学习进展，以及人们是否能在芬兰建立未来。",
      "metricYki": "YKI",
      "metricWorkplace": "职场",
      "metricSpeaking": "口语",
      "readiness": "准备",
      "scenarios": "场景",
      "practice": "练习",
      "whoEyebrow": "服务对象",
      "whoTitle": "为帮助人们在芬兰成功的组织而建。",
      "whoBody": "本页说明组织为什么使用 Floently、什么样的试点合理，以及如何开始沟通。",
      "audiences": [
        {
          "id": "employers",
          "label": "雇主",
          "title": "让国际员工更安全地用芬兰语沟通。",
          "body": "给员工从日常芬兰语到岗位场景的清晰路径：汇报、求助、解释问题、与同事或客户交流。"
        },
        {
          "id": "cities",
          "label": "城市和市政机构",
          "title": "把语言学习连接到融入和就业。",
          "body": "用与 YKI、工作生活和长期参与相关的芬兰语练习支持新来者。"
        },
        {
          "id": "training",
          "label": "培训机构",
          "title": "在项目周围加入 AI 口语练习。",
          "body": "把 Floently 作为课间练习层：学习者重复、获得纠正，并在真实对话前建立信心。"
        }
      ],
      "platformEyebrow": "Floently 提供什么",
      "platformTitle": "面向 YKI、工作和真实对话的学习层。",
      "platformBody": "Floently 不是静态课程页。它提供重复练习，并帮助组织在课程、班次和会面之间支持语言发展。",
      "pillars": [
        {
          "id": "yki",
          "label": "YKI 路径",
          "title": "通过真实技能练习准备考试",
          "body": "阅读、听力、写作和口语围绕 YKI 所需技能，而不只是记单词。",
          "eyebrow": "YKI 路径"
        },
        {
          "id": "professional",
          "label": "专业芬兰语",
          "title": "按角色沟通",
          "body": "职业路径帮助学习者练习真实工作中的表达、决定和误解。",
          "eyebrow": "专业芬兰语"
        },
        {
          "id": "speaking",
          "label": "口语和角色扮演",
          "title": "真实对话前的信心",
          "body": "学习者通过 AI 角色扮演、纠正循环和真实提示练习，在压力下更自然地说话。",
          "eyebrow": "口语和角色扮演"
        },
        {
          "id": "visibility",
          "label": "项目可见性",
          "title": "更清晰地看到进展",
          "body": "试点中，Floently 可以支持群体反馈：练习什么、哪里困难、下一步需要什么支持。",
          "eyebrow": "项目可见性"
        }
      ],
      "pilotEyebrow": "试点模式",
      "pilotTitle": "从小开始，衡量价值，再扩展。",
      "pilotBody": "好的组织试点应当具体：一个对象、一个语言目标和一个可衡量的改进，如信心、YKI 准备、入职沟通或专业流利度。",
      "pilotSteps": [
        "选择目标群体：员工、求职者、学生、融入客户或特定职业。",
        "选择培训目标：YKI、职场沟通、专业入职或组合支持。",
        "运行小型试点，收集语言信心、可用性和学习差距反馈。",
        "决定 Floently 是否成为语言、入职或融入路径的一部分。"
      ],
      "demoEyebrow": "预约演示",
      "demoTitle": "告诉我们你的组织情况。",
      "demoBody": "使用联系表单发送组织演示申请。你也可以直接给我们发邮件。",
      "demoNote": "建议内容：组织名称、目标群体、学习人数、目标和偏好的演示时间。",
      "footerBuilt": "为芬兰而打造。"
    },
    "contact": {
      "directEmail": "直接邮件",
      "eyebrow": "预约演示",
      "title": "告诉我们你的组织情况。",
      "copy": "为雇主、城市、市政机构、培训机构或融入项目申请 Floently 演示。我们会通过电子邮件回复。",
      "formTitle": "组织演示申请",
      "formIntro": "填写以下信息。按钮会打开你的邮件应用并准备好邮件内容。",
      "name": "你的姓名",
      "namePlaceholder": "全名",
      "email": "工作邮箱",
      "emailPlaceholder": "name@organization.fi",
      "organization": "组织",
      "organizationPlaceholder": "组织名称",
      "role": "你的角色",
      "rolePlaceholder": "HR、协调员、教师...",
      "organizationType": "组织类型",
      "learners": "预计学习人数",
      "learnersPlaceholder": "例如 20 名护士、80 名求职者",
      "phone": "电话，可选",
      "phonePlaceholder": "+358 ...",
      "message": "你们想解决什么？",
      "messagePlaceholder": "请说明学习者、职场芬兰语需求、YKI 准备、入职或试点想法。",
      "sendDemoRequest": "发送演示申请 →",
      "note": "这会使用你的邮件应用。之后可以添加后台表单发送功能。",
      "organizationTypes": [
        {
          "value": "employer",
          "label": "雇主"
        },
        {
          "value": "city",
          "label": "城市或市政机构"
        },
        {
          "value": "training",
          "label": "培训机构"
        },
        {
          "value": "integration",
          "label": "融入项目"
        },
        {
          "value": "healthcare",
          "label": "医疗机构"
        },
        {
          "value": "other",
          "label": "其他"
        }
      ],
      "mailtoSubjectPrefix": "Floently 演示申请来自",
      "mailtoFallbackOrganization": "一个组织",
      "mailtoGreeting": "Floently 团队你好，",
      "mailtoIntro": "我们想为组织预约演示。",
      "mailtoName": "姓名",
      "mailtoOrganization": "组织",
      "mailtoRole": "角色",
      "mailtoWorkEmail": "工作邮箱",
      "mailtoPhone": "电话",
      "mailtoOrganizationType": "组织类型",
      "mailtoLearners": "预计学习人数",
      "mailtoNeedHelp": "我们需要帮助的内容：",
      "mailtoRegards": "此致，"
    }
  },
  "vi": {
    "dir": "ltr",
    "common": {
      "language": "Ngôn ngữ",
      "floentlyHome": "Trang chủ Floently",
      "signIn": "Đăng nhập",
      "forOrganizations": "Cho tổ chức",
      "forOrganizationsArrow": "Cho tổ chức →",
      "bookDemo": "Đặt demo",
      "contact": "Liên hệ",
      "learnerPage": "Trang học viên",
      "startLearning": "Bắt đầu học",
      "backToFloently": "Quay lại Floently",
      "openContactForm": "Mở biểu mẫu liên hệ"
    },
    "landing": {
      "eyebrow": "ĐẬU YKI, THÀNH CÔNG TRONG CÔNG VIỆC, YÊU PHẦN LAN!",
      "h1Line1": "Đậu YKI.",
      "h1Line2": "Nói tiếng Phần Lan tại nơi làm việc.",
      "heroSub": "Tiếng Phần Lan thực tế cho YKI và công việc — dành cho người chuẩn bị sống và làm việc tại Phần Lan.",
      "alreadyHaveAccount": "Bạn đã có tài khoản?",
      "demoCaption": "Luyện tiếng Phần Lan → được sửa lỗi → học quy tắc. Floently hoạt động như vậy.",
      "trustBuiltForYki": "Xây cho YKI",
      "trustForProfessionals": "Cho người đi làm",
      "trustFreeToStart": "Bắt đầu miễn phí",
      "pathwaysEyebrow": "Ba lộ trình",
      "pathwaysTitle": "YKI, công việc và cuộc sống ở Phần Lan.",
      "pathwaysSub": "Chọn lộ trình phù hợp mục tiêu. Hoặc đưa cả đội vào — Floently dùng được cho cá nhân, công ty và thành phố.",
      "learnerPath": {
        "id": "learners",
        "label": "Cho học viên",
        "title": "Đậu YKI và bắt đầu con đường nghề nghiệp.",
        "body": "Đọc, nghe, viết và nói — xoay quanh YKI và tiếng Phần Lan cần trong công việc.",
        "link": "Bắt đầu học →"
      },
      "employerPath": {
        "id": "employers",
        "label": "Cho nhà tuyển dụng",
        "title": "Hỗ trợ và giữ chân nhân sự quốc tế.",
        "body": "Tiếng Phần Lan nơi làm việc để giao tiếp an toàn hơn, hội nhập nhanh hơn và giữ chân tốt hơn.",
        "link": "Đặt pilot →"
      },
      "cityPath": {
        "id": "cities",
        "label": "Cho thành phố",
        "title": "Một lộ trình ngôn ngữ có thể mở rộng.",
        "body": "Kết nối học ngôn ngữ với khả năng có việc làm và tham gia lâu dài vào xã hội Phần Lan.",
        "link": "Trao đổi với chúng tôi →"
      },
      "footerMade": "Được xây dựng cho Phần Lan."
    },
    "demo": {
      "label": "Floently · Sửa lỗi trực tiếp",
      "prompt": "Câu trả lời của bạn bằng tiếng Phần Lan",
      "sentence": "Kävin apteekkiin eilen.",
      "wrongWord": "apteekkiin",
      "rightWord": "apteekissa",
      "tooltipTitle": "Dùng cách inessive",
      "tooltipBody": "Sau käydä, dùng -ssa/-ssä để nói nơi đã đến: apteekissa, kaupassa, töissä.",
      "success": "Bây giờ nghe tự nhiên hơn bằng tiếng Phần Lan. Gần YKI thêm một bước."
    },
    "organizations": {
      "navEmployers": "Nhà tuyển dụng",
      "navCities": "Thành phố",
      "heroEyebrow": "Cho tổ chức",
      "heroTitle": "Hỗ trợ tiếng Phần Lan cho công việc, hội nhập và giữ chân.",
      "heroLede": "Floently giúp tổ chức hỗ trợ nhân tài quốc tế bằng tiếng Phần Lan thực tế: sẵn sàng YKI, giao tiếp nơi làm việc, tình huống nghề nghiệp và tự tin nói.",
      "viewLearnerPage": "Xem trang học viên",
      "valueSummaryLabel": "Tóm tắt giá trị cho tổ chức",
      "cardKicker": "Vì sao quan trọng",
      "whyTitle": "Ngôn ngữ không chỉ là vấn đề kỳ thi.",
      "whyBody": "Nó ảnh hưởng đến onboarding, an toàn, tự tin, giao tiếp khách hàng, tiến độ học và khả năng xây dựng tương lai ở Phần Lan.",
      "metricYki": "YKI",
      "metricWorkplace": "Nơi làm việc",
      "metricSpeaking": "Nói",
      "readiness": "sẵn sàng",
      "scenarios": "tình huống",
      "practice": "luyện tập",
      "whoEyebrow": "Dành cho ai",
      "whoTitle": "Dành cho tổ chức giúp mọi người thành công ở Phần Lan.",
      "whoBody": "Trang này giải thích vì sao tổ chức dùng Floently, pilot nào hợp lý và cách bắt đầu trao đổi.",
      "audiences": [
        {
          "id": "employers",
          "label": "Nhà tuyển dụng",
          "title": "Hỗ trợ nhân sự quốc tế giao tiếp tiếng Phần Lan an toàn hơn.",
          "body": "Tạo lộ trình từ tiếng Phần Lan hằng ngày đến tình huống công việc: báo cáo, hỏi giúp đỡ, giải thích vấn đề và nói với đồng nghiệp hoặc khách hàng."
        },
        {
          "id": "cities",
          "label": "Thành phố và đô thị",
          "title": "Kết nối học ngôn ngữ với hội nhập và việc làm.",
          "body": "Hỗ trợ người mới bằng luyện tiếng Phần Lan gắn với YKI, đời sống việc làm và tham gia lâu dài."
        },
        {
          "id": "training",
          "label": "Đơn vị đào tạo",
          "title": "Thêm luyện nói có AI quanh chương trình.",
          "body": "Dùng Floently như lớp luyện tập giữa các buổi học: học viên lặp lại, được sửa lỗi và tự tin hơn."
        }
      ],
      "platformEyebrow": "Floently cung cấp gì",
      "platformTitle": "Một lớp học cho YKI, công việc và hội thoại thật.",
      "platformBody": "Floently không phải trang khóa học tĩnh. Nó cho luyện tập lặp lại và giúp tổ chức hỗ trợ phát triển ngôn ngữ giữa bài học, ca làm và cuộc hẹn.",
      "pillars": [
        {
          "id": "yki",
          "label": "Lộ trình YKI",
          "title": "Sẵn sàng thi bằng kỹ năng thật",
          "body": "Đọc, nghe, viết và nói được cấu trúc theo kỹ năng cần cho YKI, không chỉ học thuộc từ vựng.",
          "eyebrow": "Lộ trình YKI"
        },
        {
          "id": "professional",
          "label": "Tiếng Phần Lan nghề nghiệp",
          "title": "Giao tiếp theo vai trò",
          "body": "Lộ trình nghề giúp học viên luyện cụm từ, quyết định và hiểu lầm gặp ở nơi làm việc thật.",
          "eyebrow": "Tiếng Phần Lan nghề nghiệp"
        },
        {
          "id": "speaking",
          "label": "Nói và roleplay",
          "title": "Tự tin trước hội thoại thật",
          "body": "Học viên luyện với roleplay AI, vòng sửa lỗi và tình huống thực tế để nói tự nhiên hơn.",
          "eyebrow": "Nói và roleplay"
        },
        {
          "id": "visibility",
          "label": "Theo dõi chương trình",
          "title": "Thấy rõ tiến độ học viên",
          "body": "Trong pilot, Floently hỗ trợ phản hồi theo nhóm: luyện gì, khó ở đâu và cần hỗ trợ gì tiếp theo.",
          "eyebrow": "Theo dõi chương trình"
        }
      ],
      "pilotEyebrow": "Mô hình pilot",
      "pilotTitle": "Bắt đầu nhỏ, đo hiệu quả, rồi mở rộng.",
      "pilotBody": "Pilot tốt cần cụ thể: một nhóm, một mục tiêu ngôn ngữ và một cải thiện đo được như tự tin, sẵn sàng YKI, giao tiếp onboarding hoặc lưu loát nghề nghiệp.",
      "pilotSteps": [
        "Chọn nhóm mục tiêu: nhân viên, người tìm việc, sinh viên, khách hàng hội nhập hoặc một nghề cụ thể.",
        "Chọn mục tiêu đào tạo: YKI, giao tiếp nơi làm việc, onboarding nghề nghiệp hoặc hỗ trợ kết hợp.",
        "Chạy pilot nhỏ và thu phản hồi về tự tin ngôn ngữ, tính dễ dùng và khoảng trống học tập.",
        "Quyết định Floently có trở thành một phần của lộ trình ngôn ngữ, onboarding hoặc hội nhập không."
      ],
      "demoEyebrow": "Đặt demo",
      "demoTitle": "Hãy cho chúng tôi biết về tổ chức của bạn.",
      "demoBody": "Dùng biểu mẫu liên hệ để gửi yêu cầu demo. Bạn cũng có thể gửi email trực tiếp.",
      "demoNote": "Gợi ý: tên tổ chức, nhóm mục tiêu, số học viên, mục tiêu và thời gian demo mong muốn.",
      "footerBuilt": "Được xây dựng cho Phần Lan."
    },
    "contact": {
      "directEmail": "Email trực tiếp",
      "eyebrow": "Đặt demo",
      "title": "Hãy cho chúng tôi biết về tổ chức của bạn.",
      "copy": "Yêu cầu demo Floently cho nhà tuyển dụng, thành phố, đơn vị đào tạo hoặc chương trình hội nhập. Chúng tôi sẽ trả lời qua email.",
      "formTitle": "Yêu cầu demo cho tổ chức",
      "formIntro": "Điền thông tin bên dưới. Nút này mở ứng dụng email với nội dung đã chuẩn bị.",
      "name": "Tên của bạn",
      "namePlaceholder": "Họ và tên",
      "email": "Email công việc",
      "emailPlaceholder": "ten@tochuc.fi",
      "organization": "Tổ chức",
      "organizationPlaceholder": "Tên tổ chức",
      "role": "Vai trò của bạn",
      "rolePlaceholder": "Nhân sự, điều phối viên, giáo viên...",
      "organizationType": "Loại tổ chức",
      "learners": "Số học viên ước tính",
      "learnersPlaceholder": "ví dụ 20 y tá, 80 người tìm việc",
      "phone": "Điện thoại, tùy chọn",
      "phonePlaceholder": "+358 ...",
      "message": "Bạn muốn giải quyết điều gì?",
      "messagePlaceholder": "Cho chúng tôi biết về học viên, nhu cầu tiếng Phần Lan nơi làm việc, luyện YKI, onboarding hoặc ý tưởng pilot.",
      "sendDemoRequest": "Gửi yêu cầu demo →",
      "note": "Việc này dùng ứng dụng email của bạn. Gửi qua backend có thể thêm sau.",
      "organizationTypes": [
        {
          "value": "employer",
          "label": "Nhà tuyển dụng"
        },
        {
          "value": "city",
          "label": "Thành phố hoặc đô thị"
        },
        {
          "value": "training",
          "label": "Đơn vị đào tạo"
        },
        {
          "value": "integration",
          "label": "Chương trình hội nhập"
        },
        {
          "value": "healthcare",
          "label": "Tổ chức y tế"
        },
        {
          "value": "other",
          "label": "Khác"
        }
      ],
      "mailtoSubjectPrefix": "Yêu cầu demo Floently từ",
      "mailtoFallbackOrganization": "một tổ chức",
      "mailtoGreeting": "Xin chào đội ngũ Floently,",
      "mailtoIntro": "Chúng tôi muốn đặt demo cho tổ chức của mình.",
      "mailtoName": "Tên",
      "mailtoOrganization": "Tổ chức",
      "mailtoRole": "Vai trò",
      "mailtoWorkEmail": "Email công việc",
      "mailtoPhone": "Điện thoại",
      "mailtoOrganizationType": "Loại tổ chức",
      "mailtoLearners": "Số học viên ước tính",
      "mailtoNeedHelp": "Chúng tôi cần hỗ trợ về:",
      "mailtoRegards": "Trân trọng,"
    }
  },
  "bn": {
    "dir": "ltr",
    "common": {
      "language": "ভাষা",
      "floentlyHome": "Floently হোম",
      "signIn": "সাইন ইন",
      "forOrganizations": "সংস্থার জন্য",
      "forOrganizationsArrow": "সংস্থার জন্য →",
      "bookDemo": "ডেমো বুক করুন",
      "contact": "যোগাযোগ",
      "learnerPage": "শিক্ষার্থীর পেজ",
      "startLearning": "শেখা শুরু করুন",
      "backToFloently": "Floently-তে ফিরে যান",
      "openContactForm": "যোগাযোগ ফর্ম খুলুন"
    },
    "landing": {
      "eyebrow": "YKI পাস করুন, কাজে সফল হন, ফিনল্যান্ডকে ভালোবাসুন!",
      "h1Line1": "YKI পাস করুন।",
      "h1Line2": "কাজে ফিনিশ বলুন।",
      "heroSub": "YKI ও কাজের জন্য ব্যবহারিক ফিনিশ — ফিনল্যান্ডে থাকা ও কাজের প্রস্তুতি নেওয়া পেশাজীবীদের জন্য।",
      "alreadyHaveAccount": "আগেই অ্যাকাউন্ট আছে?",
      "demoCaption": "ফিনিশ অনুশীলন করুন → সংশোধন পান → নিয়ম শিখুন। Floently এভাবেই কাজ করে।",
      "trustBuiltForYki": "YKI-এর জন্য তৈরি",
      "trustForProfessionals": "পেশাজীবীদের জন্য",
      "trustFreeToStart": "শুরু করা ফ্রি",
      "pathwaysEyebrow": "তিনটি পথ",
      "pathwaysTitle": "YKI, কাজ এবং ফিনল্যান্ডের জীবন।",
      "pathwaysSub": "আপনার লক্ষ্য অনুযায়ী পথ বেছে নিন। দল নিয়েও আসতে পারেন — Floently ব্যক্তি, প্রতিষ্ঠান ও শহরের জন্য কাজ করে।",
      "learnerPath": {
        "id": "learners",
        "label": "শিক্ষার্থীদের জন্য",
        "title": "YKI পাস করে পেশাগত পথ শুরু করুন।",
        "body": "পড়া, শোনা, লেখা ও বলা — YKI এবং কাজে দরকারি ফিনিশকে কেন্দ্র করে।",
        "link": "শেখা শুরু করুন →"
      },
      "employerPath": {
        "id": "employers",
        "label": "নিয়োগকর্তাদের জন্য",
        "title": "আন্তর্জাতিক কর্মীদের অন্তর্ভুক্ত করুন ও ধরে রাখুন।",
        "body": "নিরাপদ যোগাযোগ, দ্রুত onboarding এবং ভালো ধরে রাখার জন্য কর্মক্ষেত্রের ফিনিশ।",
        "link": "পাইলট বুক করুন →"
      },
      "cityPath": {
        "id": "cities",
        "label": "শহরের জন্য",
        "title": "বিস্তৃত করা যায় এমন ভাষা পথ।",
        "body": "ভাষা শেখাকে কর্মসংস্থান ও ফিনল্যান্ডের সমাজে দীর্ঘমেয়াদি অংশগ্রহণের সঙ্গে যুক্ত করুন।",
        "link": "আমাদের সঙ্গে কথা বলুন →"
      },
      "footerMade": "ফিনল্যান্ডের জন্য তৈরি।"
    },
    "demo": {
      "label": "Floently · লাইভ সংশোধন",
      "prompt": "ফিনিশে আপনার উত্তর",
      "sentence": "Kävin apteekkiin eilen.",
      "wrongWord": "apteekkiin",
      "rightWord": "apteekissa",
      "tooltipTitle": "inessive রূপ ব্যবহার করুন",
      "tooltipBody": "käydä-এর পরে কোথায় গিয়েছেন বলতে -ssa/-ssä ব্যবহার করুন: apteekissa, kaupassa, töissä.",
      "success": "এখন এটি ফিনিশের মতো শোনায়। YKI-এর আরও কাছে।"
    },
    "organizations": {
      "navEmployers": "নিয়োগকর্তা",
      "navCities": "শহর",
      "heroEyebrow": "সংস্থার জন্য",
      "heroTitle": "কাজ, একীভূতকরণ ও ধরে রাখার জন্য ফিনিশ ভাষা সহায়তা।",
      "heroLede": "Floently সংস্থাকে ব্যবহারিক ফিনিশ দিয়ে আন্তর্জাতিক প্রতিভা সহায়তা করতে সাহায্য করে: YKI প্রস্তুতি, কর্মক্ষেত্র যোগাযোগ, পেশাগত পরিস্থিতি ও বলার আত্মবিশ্বাস।",
      "viewLearnerPage": "শিক্ষার্থীর পেজ দেখুন",
      "valueSummaryLabel": "সংস্থার মূল্য সারাংশ",
      "cardKicker": "কেন গুরুত্বপূর্ণ",
      "whyTitle": "ভাষা শুধু পরীক্ষার সমস্যা নয়।",
      "whyBody": "এটি onboarding, নিরাপত্তা, আত্মবিশ্বাস, গ্রাহক যোগাযোগ, পড়াশোনার অগ্রগতি এবং ফিনল্যান্ডে ভবিষ্যৎ গড়ার অনুভূতিকে প্রভাবিত করে।",
      "metricYki": "YKI",
      "metricWorkplace": "কর্মক্ষেত্র",
      "metricSpeaking": "বলা",
      "readiness": "প্রস্তুতি",
      "scenarios": "পরিস্থিতি",
      "practice": "অনুশীলন",
      "whoEyebrow": "কার জন্য",
      "whoTitle": "ফিনল্যান্ডে মানুষকে সফল হতে সাহায্য করা সংস্থার জন্য।",
      "whoBody": "এই পেজটি বোঝায় কেন একটি সংস্থা Floently ব্যবহার করবে, কোন পাইলট যুক্তিযুক্ত এবং কীভাবে আলোচনা শুরু করা যায়।",
      "audiences": [
        {
          "id": "employers",
          "label": "নিয়োগকর্তা",
          "title": "নিরাপদ ফিনিশ যোগাযোগে আন্তর্জাতিক কর্মীদের onboarding করুন।",
          "body": "কর্মীদের দৈনন্দিন ফিনিশ থেকে কাজের নির্দিষ্ট পরিস্থিতিতে পরিষ্কার পথ দিন: রিপোর্ট করা, সাহায্য চাওয়া, সমস্যা ব্যাখ্যা করা ও সহকর্মী বা গ্রাহকের সঙ্গে কথা বলা।"
        },
        {
          "id": "cities",
          "label": "শহর ও পৌরসভা",
          "title": "ভাষা শেখাকে একীভূতকরণ ও কাজের সঙ্গে যুক্ত করুন।",
          "body": "YKI, কর্মজীবন ও দীর্ঘমেয়াদি অংশগ্রহণের সঙ্গে যুক্ত ফিনিশ অনুশীলন দিয়ে নতুনদের সহায়তা করুন।"
        },
        {
          "id": "training",
          "label": "প্রশিক্ষণ প্রদানকারী",
          "title": "প্রোগ্রামের চারপাশে AI-সহায়ক কথা বলার অনুশীলন যোগ করুন।",
          "body": "পাঠের মাঝে Floently-কে অনুশীলন স্তর হিসেবে ব্যবহার করুন: শিক্ষার্থীরা পুনরাবৃত্তি করে, সংশোধন পায় ও আত্মবিশ্বাস গড়ে।"
        }
      ],
      "platformEyebrow": "Floently কী দেয়",
      "platformTitle": "YKI, কাজ ও বাস্তব কথোপকথনের জন্য শেখার স্তর।",
      "platformBody": "Floently শুধু স্থির কোর্স পেজ নয়। এটি পুনরাবৃত্ত অনুশীলন দেয় এবং সংস্থাকে পাঠ, শিফট ও সাক্ষাতের মাঝে ভাষা উন্নয়ন সহায়তা করতে সাহায্য করে।",
      "pillars": [
        {
          "id": "yki",
          "label": "YKI পথ",
          "title": "বাস্তব দক্ষতা দিয়ে পরীক্ষার প্রস্তুতি",
          "body": "পড়া, শোনা, লেখা ও বলা YKI-র দরকারি দক্ষতার চারপাশে সাজানো, শুধু শব্দ মুখস্থ নয়।",
          "eyebrow": "YKI পথ"
        },
        {
          "id": "professional",
          "label": "পেশাগত ফিনিশ",
          "title": "ভূমিকা অনুযায়ী যোগাযোগ",
          "body": "পেশাগত পথ শিক্ষার্থীদের বাস্তব কর্মক্ষেত্রের বাক্য, সিদ্ধান্ত ও ভুল বোঝাবুঝি অনুশীলনে সাহায্য করে।",
          "eyebrow": "পেশাগত ফিনিশ"
        },
        {
          "id": "speaking",
          "label": "কথা বলা ও roleplay",
          "title": "বাস্তব কথার আগে আত্মবিশ্বাস",
          "body": "শিক্ষার্থীরা AI roleplay, সংশোধন চক্র ও বাস্তব prompt দিয়ে চাপের মধ্যে স্বাভাবিকভাবে কথা বলা অনুশীলন করে।",
          "eyebrow": "কথা বলা ও roleplay"
        },
        {
          "id": "visibility",
          "label": "প্রোগ্রাম দৃশ্যমানতা",
          "title": "অগ্রগতি আরও পরিষ্কার দেখা",
          "body": "পাইলটে Floently গ্রুপ-স্তরের feedback সহায়তা করতে পারে: কী অনুশীলন হয়, কোথায় সমস্যা, পরের সহায়তা কী।",
          "eyebrow": "প্রোগ্রাম দৃশ্যমানতা"
        }
      ],
      "pilotEyebrow": "পাইলট মডেল",
      "pilotTitle": "ছোট করে শুরু করুন, উপকার মাপুন, তারপর বাড়ান।",
      "pilotBody": "ভালো পাইলট নির্দিষ্ট: এক দল, এক ভাষা লক্ষ্য এবং আত্মবিশ্বাস, YKI প্রস্তুতি, onboarding যোগাযোগ বা পেশাগত সাবলীলতার মতো মাপযোগ্য উন্নতি।",
      "pilotSteps": [
        "লক্ষ্য দল বেছে নিন: কর্মী, চাকরিপ্রার্থী, শিক্ষার্থী, integration ক্লায়েন্ট বা নির্দিষ্ট পেশা।",
        "প্রশিক্ষণ লক্ষ্য বেছে নিন: YKI, কর্মক্ষেত্র যোগাযোগ, পেশাগত onboarding বা সম্মিলিত সহায়তা।",
        "ছোট পাইলট চালান এবং ভাষা আত্মবিশ্বাস, ব্যবহারযোগ্যতা ও শেখার ফাঁক নিয়ে feedback নিন।",
        "Floently ভাষা, onboarding বা integration পথের অংশ হবে কি না সিদ্ধান্ত নিন।"
      ],
      "demoEyebrow": "ডেমো বুক করুন",
      "demoTitle": "আপনার সংস্থা সম্পর্কে বলুন।",
      "demoBody": "আপনার সংস্থার ডেমো অনুরোধ পাঠাতে যোগাযোগ ফর্ম ব্যবহার করুন। সরাসরি ইমেলও করতে পারেন।",
      "demoNote": "প্রস্তাবিত বার্তা: সংস্থার নাম, লক্ষ্যগোষ্ঠী, শিক্ষার্থীর সংখ্যা, লক্ষ্য ও পছন্দের ডেমো সময়।",
      "footerBuilt": "ফিনল্যান্ডের জন্য তৈরি।"
    },
    "contact": {
      "directEmail": "সরাসরি ইমেল",
      "eyebrow": "ডেমো বুক করুন",
      "title": "আপনার সংস্থা সম্পর্কে বলুন।",
      "copy": "নিয়োগকর্তা, শহর, প্রশিক্ষণ প্রদানকারী বা integration প্রোগ্রামের জন্য Floently ডেমো অনুরোধ করুন। আমরা ইমেলে উত্তর দেব।",
      "formTitle": "সংস্থার ডেমো অনুরোধ",
      "formIntro": "নিচের তথ্য পূরণ করুন। বোতামটি প্রস্তুত বার্তাসহ আপনার ইমেল অ্যাপ খুলবে।",
      "name": "আপনার নাম",
      "namePlaceholder": "পুরো নাম",
      "email": "কাজের ইমেল",
      "emailPlaceholder": "name@organization.fi",
      "organization": "সংস্থা",
      "organizationPlaceholder": "সংস্থার নাম",
      "role": "আপনার ভূমিকা",
      "rolePlaceholder": "HR, সমন্বয়কারী, শিক্ষক...",
      "organizationType": "সংস্থার ধরন",
      "learners": "আনুমানিক শিক্ষার্থী",
      "learnersPlaceholder": "যেমন ২০ জন নার্স, ৮০ জন চাকরিপ্রার্থী",
      "phone": "ফোন, ঐচ্ছিক",
      "phonePlaceholder": "+358 ...",
      "message": "আপনারা কী সমাধান করতে চান?",
      "messagePlaceholder": "শিক্ষার্থী, কর্মক্ষেত্রের ফিনিশ, YKI প্রস্তুতি, onboarding বা pilot ধারণা সম্পর্কে বলুন।",
      "sendDemoRequest": "ডেমো অনুরোধ পাঠান →",
      "note": "এটি আপনার ইমেল অ্যাপ ব্যবহার করে। Backend ফর্ম পাঠানো পরে যোগ করা যাবে।",
      "organizationTypes": [
        {
          "value": "employer",
          "label": "নিয়োগকর্তা"
        },
        {
          "value": "city",
          "label": "শহর বা পৌরসভা"
        },
        {
          "value": "training",
          "label": "প্রশিক্ষণ প্রদানকারী"
        },
        {
          "value": "integration",
          "label": "একীভূতকরণ প্রোগ্রাম"
        },
        {
          "value": "healthcare",
          "label": "স্বাস্থ্যসেবা সংস্থা"
        },
        {
          "value": "other",
          "label": "অন্যান্য"
        }
      ],
      "mailtoSubjectPrefix": "Floently ডেমো অনুরোধ",
      "mailtoFallbackOrganization": "একটি সংস্থা",
      "mailtoGreeting": "হ্যালো Floently টিম,",
      "mailtoIntro": "আমরা আমাদের সংস্থার জন্য একটি ডেমো বুক করতে চাই।",
      "mailtoName": "নাম",
      "mailtoOrganization": "সংস্থা",
      "mailtoRole": "ভূমিকা",
      "mailtoWorkEmail": "কাজের ইমেল",
      "mailtoPhone": "ফোন",
      "mailtoOrganizationType": "সংস্থার ধরন",
      "mailtoLearners": "আনুমানিক শিক্ষার্থী",
      "mailtoNeedHelp": "যে বিষয়ে সাহায্য চাই:",
      "mailtoRegards": "শুভেচ্ছা,"
    }
  },
  "sq": {
    "dir": "ltr",
    "common": {
      "language": "Gjuha",
      "floentlyHome": "Faqja kryesore e Floently",
      "signIn": "Hyr",
      "forOrganizations": "Për organizata",
      "forOrganizationsArrow": "Për organizata →",
      "bookDemo": "Rezervo demo",
      "contact": "Kontakt",
      "learnerPage": "Faqja e nxënësit",
      "startLearning": "Fillo mësimin",
      "backToFloently": "Kthehu te Floently",
      "openContactForm": "Hap formularin e kontaktit"
    },
    "landing": {
      "eyebrow": "KALO YKI, SUKSESO NË PUNË, DUJE FINLANDËN!",
      "h1Line1": "Kalo YKI.",
      "h1Line2": "Fol finlandisht në punë.",
      "heroSub": "Finlandisht praktike për YKI dhe punë — për profesionistë që përgatiten të jetojnë dhe punojnë në Finlandë.",
      "alreadyHaveAccount": "Ke tashmë llogari?",
      "demoCaption": "Praktiko finlandisht → merr korrigjim → mëso rregullin. Kështu funksionon Floently.",
      "trustBuiltForYki": "Ndërtuar për YKI",
      "trustForProfessionals": "Për profesionistë",
      "trustFreeToStart": "Fillo falas",
      "pathwaysEyebrow": "Tre rrugë",
      "pathwaysTitle": "YKI, puna dhe jeta në Finlandë.",
      "pathwaysSub": "Zgjidh rrugën që i përshtatet qëllimit tënd. Floently punon edhe për ekipe, kompani dhe qytete.",
      "learnerPath": {
        "id": "learners",
        "label": "Për nxënës",
        "title": "Kalo YKI dhe fillo rrugën profesionale.",
        "body": "Lexim, dëgjim, shkrim dhe të folur rreth YKI dhe finlandishtes së punës.",
        "link": "Fillo mësimin →"
      },
      "employerPath": {
        "id": "employers",
        "label": "Punëdhënës",
        "title": "Integro dhe mbaj staf ndërkombëtar.",
        "body": "Finlandisht pune për komunikim më të sigurt, hyrje më të shpejtë dhe qëndrueshmëri më të fortë.",
        "link": "Rezervo pilot →"
      },
      "cityPath": {
        "id": "cities",
        "label": "Qytete",
        "title": "Rrugë gjuhësore e shkallëzueshme.",
        "body": "Lidhe mësimin e gjuhës me punësimin dhe pjesëmarrjen afatgjatë në shoqërinë finlandeze.",
        "link": "Na kontakto →"
      },
      "footerMade": "Ndërtuar për Finlandën."
    },
    "demo": {
      "label": "Floently · Korrigjim i drejtpërdrejtë",
      "prompt": "Përgjigjja jote në finlandisht",
      "sentence": "Kävin apteekkiin eilen.",
      "wrongWord": "apteekkiin",
      "rightWord": "apteekissa",
      "tooltipTitle": "Përdor rasën inessive",
      "tooltipBody": "Pas käydä përdoret -ssa/-ssä për vendin: apteekissa, kaupassa, töissä.",
      "success": "Tani tingëllon finlandisht. Një hap më afër YKI."
    },
    "organizations": {
      "navEmployers": "Punëdhënës",
      "navCities": "Qytete",
      "heroEyebrow": "Për organizata",
      "heroTitle": "Mbështetje e finlandishtes për punë, integrim dhe qëndrueshmëri.",
      "heroLede": "Floently ndihmon organizatat të mbështesin talentin ndërkombëtar me finlandisht praktike: YKI, komunikim pune, situata profesionale dhe siguri në të folur.",
      "viewLearnerPage": "Shiko faqen e nxënësit",
      "valueSummaryLabel": "Përmbledhje vlere për organizatën",
      "cardKicker": "Pse ka rëndësi",
      "whyTitle": "Gjuha nuk është vetëm problem provimi.",
      "whyBody": "Ajo ndikon në hyrje në punë, siguri, vetëbesim, komunikim me klientë, përparim në studime dhe të ardhmen në Finlandë.",
      "metricYki": "YKI",
      "metricWorkplace": "Puna",
      "metricSpeaking": "Të folurit",
      "readiness": "gatishmëri",
      "scenarios": "situata",
      "practice": "praktikë",
      "whoEyebrow": "Kujt i shërben",
      "whoTitle": "Për organizata që ndihmojnë njerëzit të kenë sukses në Finlandë.",
      "whoBody": "Kjo faqe shpjegon pse një organizatë përdor Floently, çfarë piloti ka kuptim dhe si nis biseda.",
      "audiences": [
        {
          "id": "employers",
          "label": "Punëdhënës",
          "title": "Integro staf ndërkombëtar me komunikim më të sigurt në finlandisht.",
          "body": "Jepu punonjësve rrugë nga finlandishtja e përditshme te situatat e punës: raportim, kërkim ndihme, shpjegim problemesh dhe biseda me kolegë ose klientë."
        },
        {
          "id": "cities",
          "label": "Qytete",
          "title": "Lidhe mësimin e gjuhës me integrimin dhe punësimin.",
          "body": "Mbështet të sapoardhurit me praktikë finlandishteje të lidhur me YKI, jetën e punës dhe pjesëmarrjen në Finlandë."
        },
        {
          "id": "training",
          "label": "Ofrues trajnimi",
          "title": "Shto praktikë të foluri me AI rreth programit.",
          "body": "Përdor Floently si shtresë praktike mes mësimeve: nxënësit përsërisin, korrigjohen dhe fitojnë vetëbesim."
        }
      ],
      "platformEyebrow": "Çfarë ofron Floently",
      "platformTitle": "Shtresë mësimi për YKI, punë dhe biseda reale.",
      "platformBody": "Floently nuk është faqe statike kursi. Ai jep praktikë të përsëritur dhe ndihmon organizatat të mbështesin zhvillimin gjuhësor.",
      "pillars": [
        {
          "id": "yki",
          "label": "Rruga YKI",
          "title": "Gatishmëri provimi me aftësi reale",
          "body": "Leximi, dëgjimi, shkrimi dhe të folurit strukturohen rreth aftësive YKI.",
          "eyebrow": "Rruga YKI"
        },
        {
          "id": "professional",
          "label": "Finlandisht profesionale",
          "title": "Komunikim sipas rolit",
          "body": "Rrugët profesionale ndihmojnë të praktikohen fraza dhe situata të punës.",
          "eyebrow": "Finlandisht profesionale"
        },
        {
          "id": "speaking",
          "label": "Të folur dhe roleplay",
          "title": "Vetëbesim para bisedave reale",
          "body": "Nxënësit praktikojnë me roleplay AI, korrigjime dhe detyra realiste.",
          "eyebrow": "Të folur dhe roleplay"
        },
        {
          "id": "visibility",
          "label": "Dukshmëri programi",
          "title": "Pamje më e qartë e përparimit",
          "body": "Floently ndihmon të shihet çfarë praktikohet, ku ka vështirësi dhe çfarë mbështetje duhet.",
          "eyebrow": "Dukshmëri programi"
        }
      ],
      "pilotEyebrow": "Model pilot",
      "pilotTitle": "Fillo vogël, mat dobinë, pastaj zgjero.",
      "pilotBody": "Një pilot i mirë ka një grup, një qëllim gjuhësor dhe një përmirësim të matshëm.",
      "pilotSteps": [
        "Zgjidh grupin: staf, punëkërkues, studentë, klientë integrimi ose profesion.",
        "Zgjidh qëllimin: YKI, komunikim pune, hyrje profesionale ose mbështetje e kombinuar.",
        "Bëj pilot të vogël dhe mblidh reagime për vetëbesim, përdorim dhe boshllëqe mësimi.",
        "Vendos nëse Floently bëhet pjesë e rrugës së gjuhës, hyrjes ose integrimit."
      ],
      "demoEyebrow": "Rezervo demo",
      "demoTitle": "Na tregoni për organizatën tuaj.",
      "demoBody": "Përdorni formularin e kontaktit për të dërguar kërkesën e demos. Mund të na shkruani edhe drejtpërdrejt.",
      "demoNote": "Mesazh i sugjeruar: emri i organizatës, grupi, numri i nxënësve, qëllimi dhe koha.",
      "footerBuilt": "Ndërtuar për Finlandën."
    },
    "contact": {
      "directEmail": "Email direkt",
      "eyebrow": "Rezervo demo",
      "title": "Na tregoni për organizatën tuaj.",
      "copy": "Kërkoni demo Floently për punëdhënës, qytete, ofrues trajnimi ose programe integrimi. Do të përgjigjemi me email.",
      "formTitle": "Kërkesë demo për organizatë",
      "formIntro": "Plotësoni të dhënat. Butoni hap aplikacionin e emailit me mesazh të përgatitur.",
      "name": "Emri juaj",
      "namePlaceholder": "Emri i plotë",
      "email": "Email pune",
      "emailPlaceholder": "emri@organizata.fi",
      "organization": "Organizata",
      "organizationPlaceholder": "Emri i organizatës",
      "role": "Roli juaj",
      "rolePlaceholder": "HR, koordinator, mësues...",
      "organizationType": "Lloji i organizatës",
      "learners": "Numri i përafërt i nxënësve",
      "learnersPlaceholder": "p.sh. 20 infermierë, 80 punëkërkues",
      "phone": "Telefon, opsional",
      "phonePlaceholder": "+358 ...",
      "message": "Çfarë doni të zgjidhni?",
      "messagePlaceholder": "Na tregoni për nxënësit, nevojat e finlandishtes në punë, YKI, onboarding ose ide pilot.",
      "sendDemoRequest": "Dërgo kërkesën →",
      "note": "Kjo përdor aplikacionin tuaj të emailit. Dërgimi nga backend mund të shtohet më vonë.",
      "organizationTypes": [
        {
          "value": "employer",
          "label": "Punëdhënës"
        },
        {
          "value": "city",
          "label": "Qytet ose komunë"
        },
        {
          "value": "training",
          "label": "Ofrues trajnimi"
        },
        {
          "value": "integration",
          "label": "Program integrimi"
        },
        {
          "value": "healthcare",
          "label": "Organizatë shëndetësore"
        },
        {
          "value": "other",
          "label": "Tjetër"
        }
      ],
      "mailtoSubjectPrefix": "Kërkesë demo Floently nga",
      "mailtoFallbackOrganization": "një organizatë",
      "mailtoGreeting": "Përshëndetje ekipi Floently,",
      "mailtoIntro": "Duam të rezervojmë një demo për organizatën tonë.",
      "mailtoName": "Emri",
      "mailtoOrganization": "Organizata",
      "mailtoRole": "Roli",
      "mailtoWorkEmail": "Email pune",
      "mailtoPhone": "Telefon",
      "mailtoOrganizationType": "Lloji i organizatës",
      "mailtoLearners": "Numri i përafërt i nxënësve",
      "mailtoNeedHelp": "Ku na duhet ndihmë:",
      "mailtoRegards": "Me respekt,"
    }
  },
  "ku": {
    "dir": "ltr",
    "common": {
      "language": "Ziman",
      "floentlyHome": "Destpêka Floently",
      "signIn": "Têkeve",
      "forOrganizations": "Ji bo rêxistinan",
      "forOrganizationsArrow": "Ji bo rêxistinan →",
      "bookDemo": "Demo veqetîne",
      "contact": "Têkilî",
      "learnerPage": "Rûpela fêrbûnê",
      "startLearning": "Dest bi fêrbûnê bike",
      "backToFloently": "Vegere Floently",
      "openContactForm": "Forma têkilîyê veke"
    },
    "landing": {
      "eyebrow": "YKI DERBAS BIKE, LI KAR SERKEFTÎ BE, FINLANDÊ HEZ BIKE!",
      "h1Line1": "YKI derbas bike.",
      "h1Line2": "Li kar bi finî biaxive.",
      "heroSub": "Finîya pratîk ji bo YKI û kar — ji bo kesên pispor ku amade dibin li Finlandê bijîn û bixebitin.",
      "alreadyHaveAccount": "Hesabê te heye?",
      "demoCaption": "Bi finî praktîk bike → rastkirin bistîne → qaîdeyê fêr bibe. Floently wisa dixebite.",
      "trustBuiltForYki": "Ji bo YKI hatî çêkirin",
      "trustForProfessionals": "Ji bo pisporan",
      "trustFreeToStart": "Destpêk belaş e",
      "pathwaysEyebrow": "Sê rê",
      "pathwaysTitle": "YKI, kar û jiyan li Finlandê.",
      "pathwaysSub": "Rêya ku bi armanca te re tê hilbijêre. Floently ji bo kesan, şirketan û bajaran dixebite.",
      "learnerPath": {
        "id": "learners",
        "label": "Ji bo fêrbûnan",
        "title": "YKI derbas bike û rêya pîşeyî dest pê bike.",
        "body": "Xwendin, guhdarî, nivîsandin û axaftin li dor YKI û finîya karê tê avakirin.",
        "link": "Dest bi fêrbûnê bike →"
      },
      "employerPath": {
        "id": "employers",
        "label": "Karbidest",
        "title": "Karmendên navneteweyî nas bike û bihêle.",
        "body": "Finîya kar ji bo têkilîya ewletir, danasîna zûtir û mayîna xurtir.",
        "link": "Pilot veqetîne →"
      },
      "cityPath": {
        "id": "cities",
        "label": "Bajar",
        "title": "Rêya zimanê ku dikare mezin bibe.",
        "body": "Fêrbûna zimanê bi kar û beşdarbûna dirêj li civaka Finlandê ve girê bide.",
        "link": "Bi me re biaxive →"
      },
      "footerMade": "Ji bo Finlandê hatî çêkirin."
    },
    "demo": {
      "label": "Floently · Rastkirina zindî",
      "prompt": "Bersiva te bi finî",
      "sentence": "Kävin apteekkiin eilen.",
      "wrongWord": "apteekkiin",
      "rightWord": "apteekissa",
      "tooltipTitle": "Forma inessive bikar bîne",
      "tooltipBody": "Piştî käydä, ji bo cihê ku çûyî -ssa/-ssä tê bikaranîn: apteekissa, kaupassa, töissä.",
      "success": "Niha wek finî tê guhdarî. Qedemek nêzîktir bi YKI."
    },
    "organizations": {
      "navEmployers": "Karbidest",
      "navCities": "Bajar",
      "heroEyebrow": "Ji bo rêxistinan",
      "heroTitle": "Piştgiriya finî ji bo kar, yekbûn û mayînê.",
      "heroLede": "Floently rêxistinan alîkarî dike ku talentên navneteweyî bi finîya pratîk piştgirî bikin: YKI, têkilîya kar, rewşên pîşeyî û baweriya axaftinê.",
      "viewLearnerPage": "Rûpela fêrbûnê bibîne",
      "valueSummaryLabel": "Kurteya nirxa rêxistinê",
      "cardKicker": "Çima girîng e",
      "whyTitle": "Ziman tenê pirsgirêka îmtîhanê nîne.",
      "whyBody": "Ew li danasîn, ewlehî, bawerî, têkilîya xerîdar, pêşkeftina xwendinê û dahatûya li Finlandê bandor dike.",
      "metricYki": "YKI",
      "metricWorkplace": "Cihê kar",
      "metricSpeaking": "Axaftin",
      "readiness": "amadebûn",
      "scenarios": "rewş",
      "practice": "praktîk",
      "whoEyebrow": "Ji bo kê ye",
      "whoTitle": "Ji bo rêxistinên ku kesan li Finlandê serkeftî dikin.",
      "whoBody": "Ev rûpel rave dike çima rêxistin Floently bikar tîne, kîjan pilot baş e û çawa gotûbêj dest pê dike.",
      "audiences": [
        {
          "id": "employers",
          "label": "Karbidest",
          "title": "Karmendên navneteweyî bi têkilîya finî ya ewletir nas bike.",
          "body": "Rêyek zelal bide karmendan ji finîya rojane heta rewşên kar: rapor, alîkarî xwestin, pirsgirêk şîrove kirin û axaftina bi hevkar an xerîdar."
        },
        {
          "id": "cities",
          "label": "Bajar",
          "title": "Fêrbûna zimanê bi yekbûn û kar ve girê bide.",
          "body": "Kesên nû bi pratîka finî ya girêdayî YKI, jiyana kar û beşdarbûna dirêj piştgirî bike."
        },
        {
          "id": "training",
          "label": "Peydakêrên perwerdehiyê",
          "title": "Pratîka axaftinê ya AI li dor bernameyê zêde bike.",
          "body": "Floently wek astek pratîkê di navbera dersan de bikar bîne: fêrbûn dubare dikin, rastkirin digirin û bawerî çêdikin."
        }
      ],
      "platformEyebrow": "Floently çi dide",
      "platformTitle": "Astê fêrbûnê ji bo YKI, kar û gotûbêjên rast.",
      "platformBody": "Floently tenê rûpela kursê ya sabît nîne. Ew pratîka dubare dide û pêşveçûna zimanî piştgirî dike.",
      "pillars": [
        {
          "id": "yki",
          "label": "Rêya YKI",
          "title": "Amadebûna îmtîhanê bi şarezayiyên rast",
          "body": "Xwendin, guhdarî, nivîsandin û axaftin li gorî şarezayiyên YKI tên avakirin.",
          "eyebrow": "Rêya YKI"
        },
        {
          "id": "professional",
          "label": "Finîya pîşeyî",
          "title": "Têkilî li gorî rolê",
          "body": "Rêyên pîşeyî gotin, biryar û şaşfêmkirinên karê rast pratîk dikin.",
          "eyebrow": "Finîya pîşeyî"
        },
        {
          "id": "speaking",
          "label": "Axaftin û roleplay",
          "title": "Bawerî berî gotûbêjên rast",
          "body": "Fêrbûn bi AI roleplay û rastkirinên dubare pratîk dikin.",
          "eyebrow": "Axaftin û roleplay"
        },
        {
          "id": "visibility",
          "label": "Dîtina bernameyê",
          "title": "Dîtina zelaltir a pêşketinê",
          "body": "Floently nîşan dide çi tê pratîk kirin, li ku astengî heye û piştgiriya paşê çi ye.",
          "eyebrow": "Dîtina bernameyê"
        }
      ],
      "pilotEyebrow": "Modela pilotê",
      "pilotTitle": "Bi biçûk dest pê bike, sûdê bipîve, paşê mezin bike.",
      "pilotBody": "Pilotek baş divê zehfî be: komek, armancek zimanî û pêşketinek ku tê pîvandin.",
      "pilotSteps": [
        "Koma armanc hilbijêre: karmend, lêgerên kar, xwendekar, mişteriyên yekbûnê an pîşeyek.",
        "Armanca perwerdehiyê hilbijêre: YKI, têkilîya kar, danasîna pîşeyî an piştgiriya hevbeş.",
        "Pilotek biçûk bimeşîne û derbarê baweriya zimanî û valahiyên fêrbûnê de bersiv bigire.",
        "Biryar bide gelo Floently dibe beşek ji rêya ziman, danasîn an yekbûnê."
      ],
      "demoEyebrow": "Demo veqetîne",
      "demoTitle": "Derbarê rêxistina xwe de ji me re bibêje.",
      "demoBody": "Forma têkilîyê bikar bîne da daxwaza demoyê bişînî. Her wiha dikarî rasterast e-name bişînî.",
      "demoNote": "Peyama pêşniyarî: navê rêxistinê, koma armanc, hejmara fêrbûnan, armanc û dema demo.",
      "footerBuilt": "Ji bo Finlandê hatî çêkirin."
    },
    "contact": {
      "directEmail": "E-nameya rasterast",
      "eyebrow": "Demo veqetîne",
      "title": "Derbarê rêxistina xwe de ji me re bibêje.",
      "copy": "Ji bo karbidestan, bajaran, perwerdekaran an bernameyên yekbûnê demoya Floently bixwaze. Em bi e-nameyê bersiv didin.",
      "formTitle": "Daxwaza demoyê ji bo rêxistinê",
      "formIntro": "Agahiyan dagire. Bişkoka e-nameya amade vedike.",
      "name": "Navê te",
      "namePlaceholder": "Navê tevahî",
      "email": "E-nameya karê",
      "emailPlaceholder": "nav@rexistin.fi",
      "organization": "Rêxistin",
      "organizationPlaceholder": "Navê rêxistinê",
      "role": "Rolê te",
      "rolePlaceholder": "HR, koordînator, mamoste...",
      "organizationType": "Cureya rêxistinê",
      "learners": "Hejmara fêrbûnan",
      "learnersPlaceholder": "mînak 20 hemşîre, 80 lêgerên kar",
      "phone": "Telefon, ne mecbûrî",
      "phonePlaceholder": "+358 ...",
      "message": "Hûn dixwazin çi çareser bikin?",
      "messagePlaceholder": "Derbarê fêrbûnan, pêdiviyên finî yên kar, YKI, danasîn an fikra pilotê de binivîse.",
      "sendDemoRequest": "Daxwaza demoyê bişîne →",
      "note": "Ev sepana e-nameya te bikar tîne. Şandina backendê paşê dikare were zêdekirin.",
      "organizationTypes": [
        {
          "value": "employer",
          "label": "Karbidest"
        },
        {
          "value": "city",
          "label": "Bajar an şaredarî"
        },
        {
          "value": "training",
          "label": "Peydakera perwerdehiyê"
        },
        {
          "value": "integration",
          "label": "Bernameya yekbûnê"
        },
        {
          "value": "healthcare",
          "label": "Rêxistina tenduristiyê"
        },
        {
          "value": "other",
          "label": "Yên din"
        }
      ],
      "mailtoSubjectPrefix": "Daxwaza demoya Floently ji",
      "mailtoFallbackOrganization": "rêxistinek",
      "mailtoGreeting": "Silav tîmê Floently,",
      "mailtoIntro": "Em dixwazin ji bo rêxistina xwe demo veqetînin.",
      "mailtoName": "Nav",
      "mailtoOrganization": "Rêxistin",
      "mailtoRole": "Rol",
      "mailtoWorkEmail": "E-nameya karê",
      "mailtoPhone": "Telefon",
      "mailtoOrganizationType": "Cureya rêxistinê",
      "mailtoLearners": "Hejmara fêrbûnan",
      "mailtoNeedHelp": "Em di vê de alîkarî dixwazin:",
      "mailtoRegards": "Bi rêz,"
    }
  },
  "tl": {
    "dir": "ltr",
    "common": {
      "language": "Wika",
      "floentlyHome": "Floently home",
      "signIn": "Mag-sign in",
      "forOrganizations": "Para sa organisasyon",
      "forOrganizationsArrow": "Para sa organisasyon →",
      "bookDemo": "Mag-book ng demo",
      "contact": "Makipag-ugnayan",
      "learnerPage": "Pahina ng mag-aaral",
      "startLearning": "Simulan ang pag-aaral",
      "backToFloently": "Bumalik sa Floently",
      "openContactForm": "Buksan ang contact form"
    },
    "landing": {
      "eyebrow": "PUMASA SA YKI, MAGTAGUMPAY SA TRABAHO, MAHALIN ANG FINLAND!",
      "h1Line1": "Pumasa sa YKI.",
      "h1Line2": "Magsalita ng Finnish sa trabaho.",
      "heroSub": "Praktikal na Finnish para sa YKI at trabaho — para sa propesyonal na naghahanda mamuhay at magtrabaho sa Finland.",
      "alreadyHaveAccount": "May account ka na?",
      "demoCaption": "Magpraktis ng Finnish → makatanggap ng pagwawasto → matutunan ang tuntunin. Ganito gumagana ang Floently.",
      "trustBuiltForYki": "Ginawa para sa YKI",
      "trustForProfessionals": "Para sa propesyonal",
      "trustFreeToStart": "Libreng magsimula",
      "pathwaysEyebrow": "Tatlong landas",
      "pathwaysTitle": "YKI, trabaho at buhay sa Finland.",
      "pathwaysSub": "Piliin ang landas para sa iyong layunin. Maaari ring isama ang iyong team — gumagana ang Floently para sa tao, kumpanya at lungsod.",
      "learnerPath": {
        "id": "learners",
        "label": "Para sa mag-aaral",
        "title": "Pumasa sa YKI at simulan ang propesyon.",
        "body": "Pagbasa, pakikinig, pagsulat at pagsasalita sa paligid ng YKI at Finnish na kailangan sa trabaho.",
        "link": "Simulan ang pag-aaral →"
      },
      "employerPath": {
        "id": "employers",
        "label": "Mga employer",
        "title": "I-onboard at panatilihin ang international staff.",
        "body": "Finnish sa trabaho para sa mas ligtas na komunikasyon, mas mabilis na onboarding at mas malakas na retention.",
        "link": "Mag-book ng pilot →"
      },
      "cityPath": {
        "id": "cities",
        "label": "Mga lungsod",
        "title": "Language path na puwedeng palakihin.",
        "body": "Ikonekta ang pag-aaral ng wika sa trabaho at pangmatagalang pakikilahok sa lipunang Finnish.",
        "link": "Makipag-usap sa amin →"
      },
      "footerMade": "Ginawa para sa Finland."
    },
    "demo": {
      "label": "Floently · Live na pagwawasto",
      "prompt": "Sagot mo sa Finnish",
      "sentence": "Kävin apteekkiin eilen.",
      "wrongWord": "apteekkiin",
      "rightWord": "apteekissa",
      "tooltipTitle": "Gamitin ang inessive case",
      "tooltipBody": "Pagkatapos ng käydä, gamitin ang -ssa/-ssä para sa lugar: apteekissa, kaupassa, töissä.",
      "success": "Mas tunog Finnish na ito. Isang hakbang palapit sa YKI."
    },
    "organizations": {
      "navEmployers": "Mga employer",
      "navCities": "Mga lungsod",
      "heroEyebrow": "Para sa organisasyon",
      "heroTitle": "Suporta sa Finnish para sa trabaho, integrasyon at retention.",
      "heroLede": "Tinutulungan ng Floently ang mga organisasyon na suportahan ang international talent gamit ang praktikal na Finnish: YKI, komunikasyon sa trabaho, propesyonal na sitwasyon at kumpiyansa sa pagsasalita.",
      "viewLearnerPage": "Tingnan ang pahina ng mag-aaral",
      "valueSummaryLabel": "Buod ng halaga para sa organisasyon",
      "cardKicker": "Bakit mahalaga",
      "whyTitle": "Ang wika ay hindi lang problema sa pagsusulit.",
      "whyBody": "Nakaaapekto ito sa onboarding, kaligtasan, kumpiyansa, komunikasyon sa customer, pag-aaral at kinabukasan sa Finland.",
      "metricYki": "YKI",
      "metricWorkplace": "Trabaho",
      "metricSpeaking": "Pagsasalita",
      "readiness": "kahandaan",
      "scenarios": "sitwasyon",
      "practice": "praktis",
      "whoEyebrow": "Para kanino",
      "whoTitle": "Para sa organisasyong tumutulong sa tao na magtagumpay sa Finland.",
      "whoBody": "Ipinapaliwanag ng pahinang ito kung bakit gagamit ng Floently, anong pilot ang bagay, at paano magsisimula ang usapan.",
      "audiences": [
        {
          "id": "employers",
          "label": "Mga employer",
          "title": "I-onboard ang international staff gamit ang mas ligtas na Finnish communication.",
          "body": "Bigyan ang empleyado ng malinaw na daan mula pang-araw-araw na Finnish hanggang sitwasyon sa trabaho: pag-uulat, paghingi ng tulong, pagpapaliwanag at pakikipag-usap."
        },
        {
          "id": "cities",
          "label": "Mga lungsod",
          "title": "Ikonekta ang wika sa integrasyon at trabaho.",
          "body": "Suportahan ang bagong dating gamit ang Finnish practice na konektado sa YKI, trabaho at pakikilahok sa Finland."
        },
        {
          "id": "training",
          "label": "Tagapagbigay ng pagsasanay",
          "title": "Magdagdag ng AI speaking practice sa programa.",
          "body": "Gamitin ang Floently bilang practice layer sa pagitan ng lessons: umuulit, naitatama at nagkakaroon ng kumpiyansa ang learners."
        }
      ],
      "platformEyebrow": "Ano ang ibinibigay ng Floently",
      "platformTitle": "Learning layer para sa YKI, trabaho at totoong usapan.",
      "platformBody": "Hindi static course page ang Floently. Nagbibigay ito ng paulit-ulit na praktis at suporta sa language development.",
      "pillars": [
        {
          "id": "yki",
          "label": "YKI path",
          "title": "Paghahanda sa exam gamit ang totoong kasanayan",
          "body": "Pagbasa, pakikinig, pagsulat at pagsasalita ay nakaayos ayon sa kasanayan sa YKI.",
          "eyebrow": "YKI path"
        },
        {
          "id": "professional",
          "label": "Propesyonal na Finnish",
          "title": "Komunikasyon ayon sa role",
          "body": "Tumutulong ang profession tracks na praktisin ang mga parirala at sitwasyon sa totoong trabaho.",
          "eyebrow": "Propesyonal na Finnish"
        },
        {
          "id": "speaking",
          "label": "Speaking at roleplay",
          "title": "Kumpiyansa bago ang totoong usapan",
          "body": "Nagpapraktis ang learners gamit ang AI roleplay, corrections at realistic prompts.",
          "eyebrow": "Speaking at roleplay"
        },
        {
          "id": "visibility",
          "label": "Visibility ng programa",
          "title": "Mas malinaw na progreso",
          "body": "Nakikita kung ano ang pinapraktis, saan nahihirapan at anong suporta ang kailangan.",
          "eyebrow": "Visibility ng programa"
        }
      ],
      "pilotEyebrow": "Modelo ng pagsubok",
      "pilotTitle": "Magsimula nang maliit, sukatin ang pakinabang, saka palakihin.",
      "pilotBody": "Ang magandang pilot ay may isang grupo, isang language goal at isang nasusukat na improvement.",
      "pilotSteps": [
        "Piliin ang target group: staff, jobseekers, students, integration clients o isang propesyon.",
        "Piliin ang goal: YKI, workplace communication, professional onboarding o combined support.",
        "Magpatakbo ng maliit na pilot at kumuha ng feedback sa confidence, usability at learning gaps.",
        "Magpasya kung magiging bahagi ang Floently ng language, onboarding o integration path."
      ],
      "demoEyebrow": "Mag-book ng demo",
      "demoTitle": "Ikuwento ang inyong organisasyon.",
      "demoBody": "Gamitin ang contact form para ipadala ang demo request. Maaari rin kayong direktang mag-email.",
      "demoNote": "Iminungkahing mensahe: pangalan ng organisasyon, target group, bilang ng learners, goal at oras.",
      "footerBuilt": "Ginawa para sa Finland."
    },
    "contact": {
      "directEmail": "Direktang email",
      "eyebrow": "Mag-book ng demo",
      "title": "Ikuwento ang inyong organisasyon.",
      "copy": "Humiling ng Floently demo para sa employers, cities, training providers o integration programmes. Sasagot kami sa email.",
      "formTitle": "Demo request ng organisasyon",
      "formIntro": "Punan ang detalye. Bubuksan ng button ang email app na may nakahandang mensahe.",
      "name": "Pangalan mo",
      "namePlaceholder": "Buong pangalan",
      "email": "Email sa trabaho",
      "emailPlaceholder": "name@organization.fi",
      "organization": "Organisasyon",
      "organizationPlaceholder": "Pangalan ng organisasyon",
      "role": "Tungkulin mo",
      "rolePlaceholder": "HR, coordinator, teacher...",
      "organizationType": "Uri ng organisasyon",
      "learners": "Tinatayang bilang ng learners",
      "learnersPlaceholder": "hal. 20 nurses, 80 jobseekers",
      "phone": "Telepono, opsyonal",
      "phonePlaceholder": "+358 ...",
      "message": "Ano ang gusto ninyong solusyunan?",
      "messagePlaceholder": "Ikuwento ang learners, Finnish sa trabaho, YKI preparation, onboarding o pilot idea.",
      "sendDemoRequest": "Ipadala ang demo request →",
      "note": "Gagamitin nito ang iyong email app. Maaaring idagdag ang backend form sending mamaya.",
      "organizationTypes": [
        {
          "value": "employer",
          "label": "Employer"
        },
        {
          "value": "city",
          "label": "Lungsod o munisipyo"
        },
        {
          "value": "training",
          "label": "Tagapagbigay ng pagsasanay"
        },
        {
          "value": "integration",
          "label": "Integration programme"
        },
        {
          "value": "healthcare",
          "label": "Healthcare organization"
        },
        {
          "value": "other",
          "label": "Iba pa"
        }
      ],
      "mailtoSubjectPrefix": "Floently demo request mula sa",
      "mailtoFallbackOrganization": "isang organisasyon",
      "mailtoGreeting": "Kumusta Floently team,",
      "mailtoIntro": "Gusto naming mag-book ng demo para sa aming organisasyon.",
      "mailtoName": "Pangalan",
      "mailtoOrganization": "Organisasyon",
      "mailtoRole": "Tungkulin",
      "mailtoWorkEmail": "Email sa trabaho",
      "mailtoPhone": "Telepono",
      "mailtoOrganizationType": "Uri ng organisasyon",
      "mailtoLearners": "Tinatayang bilang ng learners",
      "mailtoNeedHelp": "Kailangan namin ng tulong sa:",
      "mailtoRegards": "Lubos na gumagalang,"
    }
  },
  "th": {
    "dir": "ltr",
    "common": {
      "language": "ภาษา",
      "floentlyHome": "หน้าแรก Floently",
      "signIn": "เข้าสู่ระบบ",
      "forOrganizations": "สำหรับองค์กร",
      "forOrganizationsArrow": "สำหรับองค์กร →",
      "bookDemo": "จองเดโม",
      "contact": "ติดต่อ",
      "learnerPage": "หน้าผู้เรียน",
      "startLearning": "เริ่มเรียน",
      "backToFloently": "กลับไปที่ Floently",
      "openContactForm": "เปิดแบบฟอร์มติดต่อ"
    },
    "landing": {
      "eyebrow": "ผ่าน YKI สำเร็จในงาน และรักฟินแลนด์!",
      "h1Line1": "ผ่าน YKI",
      "h1Line2": "พูดฟินแลนด์ในที่ทำงาน",
      "heroSub": "ภาษาฟินแลนด์ที่ใช้จริงสำหรับ YKI และการทำงาน สำหรับมืออาชีพที่เตรียมใช้ชีวิตและทำงานในฟินแลนด์",
      "alreadyHaveAccount": "มีบัญชีแล้วหรือยัง?",
      "demoCaption": "ฝึกฟินแลนด์ → ได้รับการแก้ไข → เรียนรู้กฎ นี่คือวิธีทำงานของ Floently",
      "trustBuiltForYki": "สร้างมาเพื่อ YKI",
      "trustForProfessionals": "สำหรับมืออาชีพ",
      "trustFreeToStart": "เริ่มฟรี",
      "pathwaysEyebrow": "สามเส้นทาง",
      "pathwaysTitle": "YKI งาน และชีวิตในฟินแลนด์",
      "pathwaysSub": "เลือกเส้นทางที่เหมาะกับเป้าหมาย หรือพาทีมของคุณมาใช้ Floently ได้ทั้งบุคคล บริษัท และเมือง",
      "learnerPath": {
        "id": "learners",
        "label": "สำหรับผู้เรียน",
        "title": "ผ่าน YKI และเริ่มเส้นทางอาชีพ",
        "body": "การอ่าน ฟัง เขียน และพูด โดยอิง YKI และภาษาฟินแลนด์ที่ต้องใช้ในงาน",
        "link": "เริ่มเรียน →"
      },
      "employerPath": {
        "id": "employers",
        "label": "นายจ้าง",
        "title": "เริ่มงานและรักษาบุคลากรต่างชาติ",
        "body": "ภาษาฟินแลนด์ในที่ทำงานเพื่อการสื่อสารที่ปลอดภัยขึ้น onboarding เร็วขึ้น และรักษาบุคลากรดีขึ้น",
        "link": "จอง pilot →"
      },
      "cityPath": {
        "id": "cities",
        "label": "เมือง",
        "title": "เส้นทางภาษาที่ขยายได้",
        "body": "เชื่อมการเรียนภาษากับการจ้างงานและการมีส่วนร่วมระยะยาวในสังคมฟินแลนด์",
        "link": "คุยกับเรา →"
      },
      "footerMade": "สร้างมาเพื่อฟินแลนด์"
    },
    "demo": {
      "label": "Floently · แก้ไขแบบสด",
      "prompt": "คำตอบของคุณเป็นภาษาฟินแลนด์",
      "sentence": "Kävin apteekkiin eilen.",
      "wrongWord": "apteekkiin",
      "rightWord": "apteekissa",
      "tooltipTitle": "ใช้รูป inessive",
      "tooltipBody": "หลัง käydä ใช้ -ssa/-ssä เพื่อบอกสถานที่: apteekissa, kaupassa, töissä.",
      "success": "ตอนนี้ฟังเป็นฟินแลนด์มากขึ้น อีกก้าวใกล้ YKI"
    },
    "organizations": {
      "navEmployers": "นายจ้าง",
      "navCities": "เมือง",
      "heroEyebrow": "สำหรับองค์กร",
      "heroTitle": "การสนับสนุนภาษาฟินแลนด์สำหรับงาน การปรับตัว และการรักษาบุคลากร",
      "heroLede": "Floently ช่วยองค์กรสนับสนุน talent ต่างชาติด้วยภาษาฟินแลนด์ที่ใช้จริง: YKI การสื่อสารในงาน สถานการณ์อาชีพ และความมั่นใจในการพูด",
      "viewLearnerPage": "ดูหน้าผู้เรียน",
      "valueSummaryLabel": "สรุปคุณค่าองค์กร",
      "cardKicker": "ทำไมสำคัญ",
      "whyTitle": "ภาษาไม่ใช่แค่ปัญหาการสอบ",
      "whyBody": "มีผลต่อ onboarding ความปลอดภัย ความมั่นใจ การสื่อสารกับลูกค้า ความก้าวหน้า และอนาคตในฟินแลนด์",
      "metricYki": "YKI",
      "metricWorkplace": "ที่ทำงาน",
      "metricSpeaking": "การพูด",
      "readiness": "ความพร้อม",
      "scenarios": "สถานการณ์",
      "practice": "ฝึก",
      "whoEyebrow": "เหมาะกับใคร",
      "whoTitle": "สำหรับองค์กรที่ช่วยให้คนประสบความสำเร็จในฟินแลนด์",
      "whoBody": "หน้านี้อธิบายว่าทำไมองค์กรใช้ Floently pilot แบบใดเหมาะสม และเริ่มคุยอย่างไร",
      "audiences": [
        {
          "id": "employers",
          "label": "นายจ้าง",
          "title": "เริ่มงานให้บุคลากรต่างชาติด้วยการสื่อสารฟินแลนด์ที่ปลอดภัยขึ้น",
          "body": "ให้เส้นทางจากฟินแลนด์ทั่วไปสู่สถานการณ์งาน เช่น รายงาน ขอความช่วยเหลือ อธิบายปัญหา และคุยกับเพื่อนร่วมงานหรือลูกค้า"
        },
        {
          "id": "cities",
          "label": "เมือง",
          "title": "เชื่อมภาษาเข้ากับการปรับตัวและงาน",
          "body": "สนับสนุนผู้มาใหม่ด้วยการฝึกฟินแลนด์ที่เกี่ยวกับ YKI ชีวิตทำงาน และการมีส่วนร่วมในฟินแลนด์"
        },
        {
          "id": "training",
          "label": "ผู้ให้บริการฝึกอบรม",
          "title": "เพิ่มการฝึกพูดด้วย AI รอบโปรแกรม",
          "body": "ใช้ Floently เป็นชั้นฝึกระหว่างบทเรียน ผู้เรียนทำซ้ำ ได้รับการแก้ไข และสร้างความมั่นใจ"
        }
      ],
      "platformEyebrow": "Floently ให้อะไร",
      "platformTitle": "ชั้นการเรียนรู้สำหรับ YKI งาน และบทสนทนาจริง",
      "platformBody": "Floently ไม่ใช่หน้าคอร์สแบบนิ่ง แต่ให้การฝึกซ้ำและช่วยองค์กรสนับสนุนพัฒนาภาษา",
      "pillars": [
        {
          "id": "yki",
          "label": "เส้นทาง YKI",
          "title": "พร้อมสอบด้วยทักษะจริง",
          "body": "อ่าน ฟัง เขียน และพูด ถูกจัดตามทักษะที่ต้องใช้ใน YKI",
          "eyebrow": "เส้นทาง YKI"
        },
        {
          "id": "professional",
          "label": "ฟินแลนด์เชิงอาชีพ",
          "title": "สื่อสารตามบทบาท",
          "body": "เส้นทางอาชีพช่วยฝึกวลีและสถานการณ์ในงานจริง",
          "eyebrow": "ฟินแลนด์เชิงอาชีพ"
        },
        {
          "id": "speaking",
          "label": "พูดและ roleplay",
          "title": "มั่นใจก่อนคุยจริง",
          "body": "ผู้เรียนฝึกด้วย AI roleplay การแก้ไข และโจทย์สมจริง",
          "eyebrow": "พูดและ roleplay"
        },
        {
          "id": "visibility",
          "label": "มองเห็นโปรแกรม",
          "title": "เห็นความก้าวหน้าชัดขึ้น",
          "body": "เห็นว่าฝึกอะไร ติดตรงไหน และต้องการการสนับสนุนอะไรต่อไป",
          "eyebrow": "มองเห็นโปรแกรม"
        }
      ],
      "pilotEyebrow": "โมเดล pilot",
      "pilotTitle": "เริ่มเล็ก วัดผล แล้วขยาย",
      "pilotBody": "pilot ที่ดีมีหนึ่งกลุ่ม หนึ่งเป้าหมายภาษา และผลลัพธ์ที่วัดได้",
      "pilotSteps": [
        "เลือกกลุ่มเป้าหมาย: staff ผู้หางาน นักเรียน ลูกค้าการปรับตัว หรืออาชีพเฉพาะ",
        "เลือกเป้าหมาย: YKI การสื่อสารในงาน onboarding อาชีพ หรือการสนับสนุนรวม",
        "ทำ pilot เล็กและเก็บ feedback เรื่องความมั่นใจ การใช้งาน และช่องว่างการเรียน",
        "ตัดสินใจว่า Floently จะเป็นส่วนหนึ่งของเส้นทางภาษา onboarding หรือการปรับตัวหรือไม่"
      ],
      "demoEyebrow": "จองเดโม",
      "demoTitle": "บอกเราเกี่ยวกับองค์กรของคุณ",
      "demoBody": "ใช้แบบฟอร์มติดต่อเพื่อส่งคำขอเดโม หรือส่งอีเมลถึงเราโดยตรงก็ได้",
      "demoNote": "ข้อความแนะนำ: ชื่อองค์กร กลุ่มเป้าหมาย จำนวนผู้เรียน เป้าหมาย และเวลาเดโม",
      "footerBuilt": "สร้างมาเพื่อฟินแลนด์"
    },
    "contact": {
      "directEmail": "อีเมลโดยตรง",
      "eyebrow": "จองเดโม",
      "title": "บอกเราเกี่ยวกับองค์กรของคุณ",
      "copy": "ขอเดโม Floently สำหรับนายจ้าง เมือง ผู้ให้บริการฝึกอบรม หรือโปรแกรมการปรับตัว เราจะตอบทางอีเมล",
      "formTitle": "คำขอเดโมขององค์กร",
      "formIntro": "กรอกข้อมูลด้านล่าง ปุ่มจะเปิดแอปอีเมลพร้อมข้อความที่เตรียมไว้",
      "name": "ชื่อของคุณ",
      "namePlaceholder": "ชื่อเต็ม",
      "email": "อีเมลงาน",
      "emailPlaceholder": "name@organization.fi",
      "organization": "องค์กร",
      "organizationPlaceholder": "ชื่อองค์กร",
      "role": "บทบาทของคุณ",
      "rolePlaceholder": "HR, ผู้ประสานงาน, ครู...",
      "organizationType": "ประเภทองค์กร",
      "learners": "จำนวนผู้เรียนโดยประมาณ",
      "learnersPlaceholder": "เช่น พยาบาล 20 คน ผู้หางาน 80 คน",
      "phone": "โทรศัพท์ ไม่บังคับ",
      "phonePlaceholder": "+358 ...",
      "message": "คุณต้องการแก้ปัญหาอะไร?",
      "messagePlaceholder": "บอกเราเกี่ยวกับผู้เรียน ความต้องการฟินแลนด์ในงาน YKI onboarding หรือไอเดีย pilot",
      "sendDemoRequest": "ส่งคำขอเดโม →",
      "note": "สิ่งนี้ใช้แอปอีเมลของคุณ สามารถเพิ่มการส่งผ่าน backend ได้ภายหลัง",
      "organizationTypes": [
        {
          "value": "employer",
          "label": "นายจ้าง"
        },
        {
          "value": "city",
          "label": "เมืองหรือเทศบาล"
        },
        {
          "value": "training",
          "label": "ผู้ให้บริการฝึกอบรม"
        },
        {
          "value": "integration",
          "label": "โปรแกรมการปรับตัว"
        },
        {
          "value": "healthcare",
          "label": "องค์กรสุขภาพ"
        },
        {
          "value": "other",
          "label": "อื่น ๆ"
        }
      ],
      "mailtoSubjectPrefix": "คำขอเดโม Floently จาก",
      "mailtoFallbackOrganization": "องค์กร",
      "mailtoGreeting": "สวัสดีทีม Floently,",
      "mailtoIntro": "เราต้องการจองเดโมสำหรับองค์กรของเรา",
      "mailtoName": "ชื่อ",
      "mailtoOrganization": "องค์กร",
      "mailtoRole": "บทบาท",
      "mailtoWorkEmail": "อีเมลงาน",
      "mailtoPhone": "โทรศัพท์",
      "mailtoOrganizationType": "ประเภทองค์กร",
      "mailtoLearners": "จำนวนผู้เรียนโดยประมาณ",
      "mailtoNeedHelp": "สิ่งที่ต้องการความช่วยเหลือ:",
      "mailtoRegards": "ขอแสดงความนับถือ,"
    }
  },
  "so": {
    "dir": "ltr",
    "common": {
      "language": "Luuqad",
      "floentlyHome": "Bogga hore ee Floently",
      "signIn": "Gal",
      "forOrganizations": "Ururrada",
      "forOrganizationsArrow": "Ururrada →",
      "bookDemo": "Qabso demo",
      "contact": "Xiriir",
      "learnerPage": "Bogga ardayga",
      "startLearning": "Bilow barashada",
      "backToFloently": "Ku noqo Floently",
      "openContactForm": "Fur foomka xiriirka"
    },
    "landing": {
      "eyebrow": "KA GUDB YKI, SHAQADA KU GUULAYSO, FINLAND JECLAADO!",
      "h1Line1": "Ka gudub YKI.",
      "h1Line2": "Shaqada Finnish ku hadal.",
      "heroSub": "Finnish la taaban karo oo loogu talagalay YKI iyo shaqo — xirfadlayaasha isu diyaarinaya nolosha iyo shaqada Finland.",
      "alreadyHaveAccount": "Akoon hore ma leedahay?",
      "demoCaption": "Finnish ku tababar → saxid hel → xeerka baro. Sidaas ayuu Floently u shaqeeyaa.",
      "trustBuiltForYki": "YKI loo dhisay",
      "trustForProfessionals": "Xirfadlayaal",
      "trustFreeToStart": "Bilaash ku bilow",
      "pathwaysEyebrow": "Saddex waddo",
      "pathwaysTitle": "YKI, shaqo iyo nolosha Finland.",
      "pathwaysSub": "Dooro waddada ku habboon hadafkaaga. Floently wuxuu u shaqeeyaa qof, shirkad iyo magaalo.",
      "learnerPath": {
        "id": "learners",
        "label": "Ardayda",
        "title": "Ka gudub YKI oo bilow jidka xirfadda.",
        "body": "Akhris, dhegeysi, qoraal iyo hadal oo ku wareegsan YKI iyo Finnish-ka shaqada.",
        "link": "Bilow barashada →"
      },
      "employerPath": {
        "id": "employers",
        "label": "Shaqo-bixiyeyaal",
        "title": "Soo dhawee oo hay shaqaalaha caalamiga ah.",
        "body": "Finnish-ka shaqada si xiriirku u noqdo ammaan, onboarding degdeg ah iyo hayn xooggan.",
        "link": "Qabso pilot →"
      },
      "cityPath": {
        "id": "cities",
        "label": "Magaalooyin",
        "title": "Waddo luqadeed oo la ballaarin karo.",
        "body": "Ku xir barashada luqadda shaqo helid iyo ka-qaybgal dheer oo bulshada Finland ah.",
        "link": "Nala hadal →"
      },
      "footerMade": "Loogu talagalay Finland."
    },
    "demo": {
      "label": "Floently · Saxid toos ah",
      "prompt": "Jawaabtaada Finnish",
      "sentence": "Kävin apteekkiin eilen.",
      "wrongWord": "apteekkiin",
      "rightWord": "apteekissa",
      "tooltipTitle": "Isticmaal qaabka inessive",
      "tooltipBody": "Kadib käydä, isticmaal -ssa/-ssä si aad u sheegto meesha: apteekissa, kaupassa, töissä.",
      "success": "Hadda waxay u dhawaaqaysaa Finnish. Tallaabo u dhow YKI."
    },
    "organizations": {
      "navEmployers": "Shaqo-bixiyeyaal",
      "navCities": "Magaalooyin",
      "heroEyebrow": "Ururrada",
      "heroTitle": "Taageerada Finnish-ka ee shaqada, isdhexgalka iyo haynta.",
      "heroLede": "Floently wuxuu ururrada ka caawiyaa taageeridda hibada caalamiga ah: YKI, xiriirka shaqada, xaalado xirfadeed iyo kalsooni hadal.",
      "viewLearnerPage": "Eeg bogga ardayga",
      "valueSummaryLabel": "Qiimaha ururka oo kooban",
      "cardKicker": "Sababta ay muhiim u tahay",
      "whyTitle": "Luqaddu ma aha kaliya imtixaan.",
      "whyBody": "Waxay saameysaa onboarding, amniga, kalsoonida, xiriirka macaamiisha, horumarka waxbarashada iyo mustaqbalka Finland.",
      "metricYki": "YKI",
      "metricWorkplace": "Shaqo",
      "metricSpeaking": "Hadal",
      "readiness": "diyaargarow",
      "scenarios": "xaalado",
      "practice": "tababar",
      "whoEyebrow": "Cidda loogu talagalay",
      "whoTitle": "Ururrada dadka ka caawiya guusha Finland.",
      "whoBody": "Boggan wuxuu sharxayaa sababta urur u isticmaalo Floently, pilot-ka ku habboon iyo sida wada hadalka loo bilaabo.",
      "audiences": [
        {
          "id": "employers",
          "label": "Shaqo-bixiyeyaal",
          "title": "Soo dhawee shaqaale caalami ah oo leh xiriir Finnish ammaan ah.",
          "body": "Sii shaqaalaha waddo cad oo ka socota Finnish maalinle ah ilaa xaalado shaqo: warbixin, caawimaad dalab, sharaxid dhibaato iyo la hadal saaxiib ama macmiil."
        },
        {
          "id": "cities",
          "label": "Magaalooyin",
          "title": "Ku xir luqadda isdhexgal iyo shaqo.",
          "body": "Taageer dadka cusub tababar Finnish oo la xiriira YKI, nolosha shaqada iyo ka-qaybgalka Finland."
        },
        {
          "id": "training",
          "label": "Bixiyeyaasha tababarka",
          "title": "Ku dar tababar hadal oo AI ah barnaamijka.",
          "body": "U isticmaal Floently lakab tababar: ardaydu way celceliyaan, saxid bay helaan, kalsoonina way dhistaan."
        }
      ],
      "platformEyebrow": "Waxa Floently bixiyo",
      "platformTitle": "Lakab waxbarasho oo YKI, shaqo iyo wada hadal dhab ah.",
      "platformBody": "Floently ma aha bog koorso oo taagan. Wuxuu bixiyaa tababar soo noqnoqda wuxuuna taageeraa horumarinta luqadda.",
      "pillars": [
        {
          "id": "yki",
          "label": "Waddada YKI",
          "title": "Diyaargarow imtixaan oo leh xirfado dhab ah",
          "body": "Akhris, dhegeysi, qoraal iyo hadal waxaa loo habeeyey xirfadaha YKI.",
          "eyebrow": "Waddada YKI"
        },
        {
          "id": "professional",
          "label": "Finnish xirfadeed",
          "title": "Xiriir ku salaysan doorka",
          "body": "Waddooyinka xirfadeed waxay tababaraan weedho iyo xaalado shaqo oo dhab ah.",
          "eyebrow": "Finnish xirfadeed"
        },
        {
          "id": "speaking",
          "label": "Hadal iyo roleplay",
          "title": "Kalsooni ka hor wada hadalka dhabta ah",
          "body": "Ardaydu waxay ku tababartaan AI roleplay, saxid iyo xaalado dhab ah.",
          "eyebrow": "Hadal iyo roleplay"
        },
        {
          "id": "visibility",
          "label": "Muuqaalka barnaamijka",
          "title": "Aragti cad oo horumar ah",
          "body": "Waxaa la arkaa waxa la tababarto, meelaha adag iyo taageerada xigta.",
          "eyebrow": "Muuqaalka barnaamijka"
        }
      ],
      "pilotEyebrow": "Qaabka pilot",
      "pilotTitle": "Yar ku bilow, faa’iidada cabbir, ka dibna ballaari.",
      "pilotBody": "Pilot wanaagsan wuxuu leeyahay hal koox, hal hadaf luqadeed iyo hal horumar la cabbiri karo.",
      "pilotSteps": [
        "Dooro kooxda: shaqaale, shaqo-doon, arday, macaamiil isdhexgal ama xirfad gaar ah.",
        "Dooro hadafka: YKI, xiriirka shaqada, onboarding xirfadeed ama taageero isku dhafan.",
        "Samee pilot yar oo ururi feedback ku saabsan kalsooni, isticmaal iyo farqiga waxbarasho.",
        "Go’aami haddii Floently noqdo qayb ka mid ah waddada luqadda, onboarding ama isdhexgalka."
      ],
      "demoEyebrow": "Qabso demo",
      "demoTitle": "Noo sheeg ururkaaga.",
      "demoBody": "Isticmaal foomka xiriirka si aad u dirto codsiga demo. Sidoo kale email toos ah waad diri kartaa.",
      "demoNote": "Fariin lagu taliyay: magaca ururka, kooxda, tirada ardayda, hadafka iyo waqtiga demo.",
      "footerBuilt": "Loogu talagalay Finland."
    },
    "contact": {
      "directEmail": "Email toos ah",
      "eyebrow": "Qabso demo",
      "title": "Noo sheeg ururkaaga.",
      "copy": "Codso demo Floently ah oo loogu talagalay shaqo-bixiyeyaal, magaalooyin, tababbarayaal ama barnaamijyo isdhexgal. Email ayaan kuugu jawaabi doonaa.",
      "formTitle": "Codsi demo urur",
      "formIntro": "Buuxi faahfaahinta. Badhanku wuxuu furayaa app-ka emailka oo fariin diyaar ah wata.",
      "name": "Magacaaga",
      "namePlaceholder": "Magaca buuxa",
      "email": "Emailka shaqada",
      "emailPlaceholder": "name@organization.fi",
      "organization": "Urur",
      "organizationPlaceholder": "Magaca ururka",
      "role": "Doorkaaga",
      "rolePlaceholder": "HR, isku-duwe, macallin...",
      "organizationType": "Nooca ururka",
      "learners": "Tirada ardayda la qiyaasay",
      "learnersPlaceholder": "tusaale 20 kalkaaliye, 80 shaqo-doon",
      "phone": "Telefoon, ikhtiyaari",
      "phonePlaceholder": "+358 ...",
      "message": "Maxaad rabtaan inaad xaliso?",
      "messagePlaceholder": "Noo sheeg ardayda, baahida Finnish-ka shaqada, YKI, onboarding ama fikrad pilot.",
      "sendDemoRequest": "Dir codsiga demo →",
      "note": "Tani waxay isticmaashaa app-ka emailkaaga. Dirista backend waa lagu dari karaa mar dambe.",
      "organizationTypes": [
        {
          "value": "employer",
          "label": "Shaqo-bixiye"
        },
        {
          "value": "city",
          "label": "Magaalo ama degmo"
        },
        {
          "value": "training",
          "label": "Bixiye tababar"
        },
        {
          "value": "integration",
          "label": "Barnaamij isdhexgal"
        },
        {
          "value": "healthcare",
          "label": "Urur caafimaad"
        },
        {
          "value": "other",
          "label": "Kale"
        }
      ],
      "mailtoSubjectPrefix": "Codsi demo Floently oo ka yimid",
      "mailtoFallbackOrganization": "urur",
      "mailtoGreeting": "Salaan kooxda Floently,",
      "mailtoIntro": "Waxaan rabnaa inaan demo u qabanno ururkayaga.",
      "mailtoName": "Magac",
      "mailtoOrganization": "Urur",
      "mailtoRole": "Door",
      "mailtoWorkEmail": "Email shaqo",
      "mailtoPhone": "Telefoon",
      "mailtoOrganizationType": "Nooca ururka",
      "mailtoLearners": "Tirada ardayda la qiyaasay",
      "mailtoNeedHelp": "Waxaan caawimaad uga baahanahay:",
      "mailtoRegards": "Mahadsanid,"
    }
  },
  "ne": {
    "dir": "ltr",
    "common": {
      "language": "भाषा",
      "floentlyHome": "Floently गृहपृष्ठ",
      "signIn": "साइन इन",
      "forOrganizations": "संस्थाका लागि",
      "forOrganizationsArrow": "संस्थाका लागि →",
      "bookDemo": "डेमो बुक गर्नुहोस्",
      "contact": "सम्पर्क",
      "learnerPage": "सिक्ने पृष्ठ",
      "startLearning": "सिक्न सुरु गर्नुहोस्",
      "backToFloently": "Floently मा फर्कनुहोस्",
      "openContactForm": "सम्पर्क फारम खोल्नुहोस्"
    },
    "landing": {
      "eyebrow": "YKI पास गर्नुहोस्, काममा सफल हुनुहोस्, फिनल्याण्डलाई माया गर्नुहोस्!",
      "h1Line1": "YKI पास गर्नुहोस्।",
      "h1Line2": "काममा फिनिश बोल्नुहोस्।",
      "heroSub": "YKI र कामका लागि व्यवहारिक फिनिश — फिनल्याण्डमा बस्न र काम गर्न तयारी गर्ने पेशेवरका लागि।",
      "alreadyHaveAccount": "पहिले नै खाता छ?",
      "demoCaption": "फिनिश अभ्यास गर्नुहोस् → सुधार पाउनुहोस् → नियम सिक्नुहोस्। Floently यसरी काम गर्छ।",
      "trustBuiltForYki": "YKI का लागि बनाइएको",
      "trustForProfessionals": "पेशेवरका लागि",
      "trustFreeToStart": "निःशुल्क सुरु",
      "pathwaysEyebrow": "तीन बाटा",
      "pathwaysTitle": "YKI, काम र फिनल्याण्डको जीवन।",
      "pathwaysSub": "आफ्नो लक्ष्य मिल्ने बाटो छान्नुहोस्। Floently व्यक्ति, संस्था र सहरका लागि काम गर्छ।",
      "learnerPath": {
        "id": "learners",
        "label": "सिक्नेहरू",
        "title": "YKI पास गरेर पेशागत बाटो सुरु गर्नुहोस्।",
        "body": "पढाइ, सुनाइ, लेखाइ र बोलाइ — YKI र काममा चाहिने फिनिश वरिपरि।",
        "link": "सिक्न सुरु गर्नुहोस् →"
      },
      "employerPath": {
        "id": "employers",
        "label": "रोजगारदाता",
        "title": "अन्तर्राष्ट्रिय कर्मचारीलाई onboarding गरी टिकाउनुहोस्।",
        "body": "सुरक्षित सञ्चार, छिटो onboarding र बलियो टिकाइका लागि कार्यस्थल फिनिश।",
        "link": "Pilot बुक गर्नुहोस् →"
      },
      "cityPath": {
        "id": "cities",
        "label": "सहरहरू",
        "title": "विस्तार गर्न मिल्ने भाषा बाटो।",
        "body": "भाषा सिकाइलाई रोजगारी र फिनल्याण्ड समाजमा दीर्घकालीन सहभागितासँग जोड्नुहोस्।",
        "link": "हामीसँग कुरा गर्नुहोस् →"
      },
      "footerMade": "फिनल्याण्डका लागि बनाइएको।"
    },
    "demo": {
      "label": "Floently · प्रत्यक्ष सुधार",
      "prompt": "फिनिशमा तपाईंको उत्तर",
      "sentence": "Kävin apteekkiin eilen.",
      "wrongWord": "apteekkiin",
      "rightWord": "apteekissa",
      "tooltipTitle": "inessive रूप प्रयोग गर्नुहोस्",
      "tooltipBody": "käydä पछि स्थान बताउन -ssa/-ssä प्रयोग हुन्छ: apteekissa, kaupassa, töissä.",
      "success": "अब यो फिनिशजस्तो सुनिन्छ। YKI नजिक एक कदम।"
    },
    "organizations": {
      "navEmployers": "रोजगारदाता",
      "navCities": "सहरहरू",
      "heroEyebrow": "संस्थाका लागि",
      "heroTitle": "काम, एकीकरण र टिकाइका लागि फिनिश भाषा सहयोग।",
      "heroLede": "Floently ले संस्थालाई व्यवहारिक फिनिशमार्फत अन्तर्राष्ट्रिय प्रतिभा सहयोग गर्न मद्दत गर्छ: YKI, कार्यस्थल सञ्चार, पेशागत अवस्था र बोल्ने आत्मविश्वास।",
      "viewLearnerPage": "सिक्ने पृष्ठ हेर्नुहोस्",
      "valueSummaryLabel": "संस्थाको मूल्य सारांश",
      "cardKicker": "किन महत्त्वपूर्ण",
      "whyTitle": "भाषा परीक्षा समस्या मात्र होइन।",
      "whyBody": "यसले onboarding, सुरक्षा, आत्मविश्वास, ग्राहक सञ्चार, अध्ययन प्रगति र फिनल्याण्डमा भविष्यलाई असर गर्छ।",
      "metricYki": "YKI",
      "metricWorkplace": "कार्यस्थल",
      "metricSpeaking": "बोलाइ",
      "readiness": "तयारी",
      "scenarios": "अवस्था",
      "practice": "अभ्यास",
      "whoEyebrow": "कसका लागि",
      "whoTitle": "फिनल्याण्डमा सफल हुन मानिसलाई सहयोग गर्ने संस्थाका लागि।",
      "whoBody": "यो पृष्ठले किन संस्था Floently प्रयोग गर्छ, कस्तो pilot उपयुक्त हुन्छ र कुराकानी कसरी सुरु गर्ने बताउँछ।",
      "audiences": [
        {
          "id": "employers",
          "label": "रोजगारदाता",
          "title": "सुरक्षित फिनिश सञ्चारसहित अन्तर्राष्ट्रिय कर्मचारी onboarding गर्नुहोस्।",
          "body": "कर्मचारीलाई दैनिक फिनिशबाट कार्यस्थल अवस्थासम्म स्पष्ट बाटो दिनुहोस्: रिपोर्टिङ, सहयोग माग्ने, समस्या बुझाउने र सहकर्मी वा ग्राहकसँग कुरा गर्ने।"
        },
        {
          "id": "cities",
          "label": "सहरहरू",
          "title": "भाषा सिकाइलाई एकीकरण र कामसँग जोड्नुहोस्।",
          "body": "YKI, काम जीवन र फिनल्याण्डमा सहभागितासँग जोडिएको फिनिश अभ्यासले नयाँ आगन्तुकलाई सहयोग गर्नुहोस्।"
        },
        {
          "id": "training",
          "label": "तालिम प्रदायक",
          "title": "कार्यक्रम वरिपरि AI बोल्ने अभ्यास थप्नुहोस्।",
          "body": "Floently लाई पाठबीच अभ्यास तहका रूपमा प्रयोग गर्नुहोस्: विद्यार्थी दोहोर्‍याउँछन्, सुधार पाउँछन् र आत्मविश्वास बनाउँछन्।"
        }
      ],
      "platformEyebrow": "Floently ले के दिन्छ",
      "platformTitle": "YKI, काम र वास्तविक कुराकानीका लागि सिकाइ तह।",
      "platformBody": "Floently स्थिर कोर्स पृष्ठ होइन। यसले दोहोरिने अभ्यास दिन्छ र भाषा विकासलाई समर्थन गर्छ।",
      "pillars": [
        {
          "id": "yki",
          "label": "YKI बाटो",
          "title": "वास्तविक सीपसँग परीक्षा तयारी",
          "body": "पढाइ, सुनाइ, लेखाइ र बोलाइ YKI का सीप वरिपरि बनाइन्छ।",
          "eyebrow": "YKI बाटो"
        },
        {
          "id": "professional",
          "label": "पेशागत फिनिश",
          "title": "भूमिका अनुसार सञ्चार",
          "body": "पेशागत बाटाले वास्तविक कार्यस्थलका वाक्यांश र अवस्थाको अभ्यास गराउँछ।",
          "eyebrow": "पेशागत फिनिश"
        },
        {
          "id": "speaking",
          "label": "बोलाइ र roleplay",
          "title": "वास्तविक कुराकानीअघि आत्मविश्वास",
          "body": "विद्यार्थीले AI roleplay, सुधार र वास्तविक prompt सँग अभ्यास गर्छन्।",
          "eyebrow": "बोलाइ र roleplay"
        },
        {
          "id": "visibility",
          "label": "कार्यक्रम दृश्यता",
          "title": "प्रगतिको स्पष्ट दृश्य",
          "body": "के अभ्यास भइरहेको छ, कहाँ कठिन छ र अर्को सहयोग के चाहिन्छ देखिन्छ।",
          "eyebrow": "कार्यक्रम दृश्यता"
        }
      ],
      "pilotEyebrow": "Pilot मोडेल",
      "pilotTitle": "सानो सुरु गर्नुहोस्, उपयोगिता मापन गर्नुहोस्, त्यसपछि विस्तार गर्नुहोस्।",
      "pilotBody": "राम्रो pilot मा एक समूह, एक भाषा लक्ष्य र एक मापनयोग्य सुधार हुन्छ।",
      "pilotSteps": [
        "लक्षित समूह छान्नुहोस्: कर्मचारी, रोजगार खोज्ने, विद्यार्थी, integration ग्राहक वा पेशा।",
        "लक्ष्य छान्नुहोस्: YKI, कार्यस्थल सञ्चार, पेशागत onboarding वा संयुक्त सहयोग।",
        "सानो pilot चलाएर आत्मविश्वास, प्रयोगयोग्यता र सिकाइ अन्तरबारे feedback लिनुहोस्।",
        "Floently भाषा, onboarding वा integration बाटोको भाग बन्ने कि नबन्ने निर्णय गर्नुहोस्।"
      ],
      "demoEyebrow": "डेमो बुक गर्नुहोस्",
      "demoTitle": "आफ्नो संस्थाबारे बताउनुहोस्।",
      "demoBody": "डेमो अनुरोध पठाउन सम्पर्क फारम प्रयोग गर्नुहोस्। सिधै इमेल पनि गर्न सक्नुहुन्छ।",
      "demoNote": "सुझाव: संस्थाको नाम, लक्षित समूह, विद्यार्थी संख्या, लक्ष्य र चाहिएको डेमो समय।",
      "footerBuilt": "फिनल्याण्डका लागि बनाइएको।"
    },
    "contact": {
      "directEmail": "प्रत्यक्ष इमेल",
      "eyebrow": "डेमो बुक गर्नुहोस्",
      "title": "आफ्नो संस्थाबारे बताउनुहोस्।",
      "copy": "रोजगारदाता, सहर, तालिम प्रदायक वा integration कार्यक्रमका लागि Floently डेमो अनुरोध गर्नुहोस्। हामी इमेलबाट जवाफ दिनेछौं।",
      "formTitle": "संस्थाको डेमो अनुरोध",
      "formIntro": "तलका विवरण भर्नुहोस्। बटनले तयार सन्देशसहित इमेल एप खोल्छ।",
      "name": "तपाईंको नाम",
      "namePlaceholder": "पूरा नाम",
      "email": "कामको इमेल",
      "emailPlaceholder": "name@organization.fi",
      "organization": "संस्था",
      "organizationPlaceholder": "संस्थाको नाम",
      "role": "तपाईंको भूमिका",
      "rolePlaceholder": "HR, संयोजक, शिक्षक...",
      "organizationType": "संस्थाको प्रकार",
      "learners": "अनुमानित विद्यार्थी संख्या",
      "learnersPlaceholder": "जस्तै २० नर्स, ८० रोजगार खोज्ने",
      "phone": "फोन, वैकल्पिक",
      "phonePlaceholder": "+358 ...",
      "message": "तपाईंहरू के समाधान गर्न चाहनुहुन्छ?",
      "messagePlaceholder": "विद्यार्थी, कार्यस्थल फिनिश, YKI, onboarding वा pilot विचारबारे बताउनुहोस्।",
      "sendDemoRequest": "डेमो अनुरोध पठाउनुहोस् →",
      "note": "यसले तपाईंको इमेल एप प्रयोग गर्छ। Backend form sending पछि थप्न सकिन्छ।",
      "organizationTypes": [
        {
          "value": "employer",
          "label": "रोजगारदाता"
        },
        {
          "value": "city",
          "label": "सहर वा नगरपालिका"
        },
        {
          "value": "training",
          "label": "तालिम प्रदायक"
        },
        {
          "value": "integration",
          "label": "एकीकरण कार्यक्रम"
        },
        {
          "value": "healthcare",
          "label": "स्वास्थ्य संस्था"
        },
        {
          "value": "other",
          "label": "अन्य"
        }
      ],
      "mailtoSubjectPrefix": "Floently डेमो अनुरोध",
      "mailtoFallbackOrganization": "संस्था",
      "mailtoGreeting": "नमस्ते Floently टोली,",
      "mailtoIntro": "हामी हाम्रो संस्थाका लागि डेमो बुक गर्न चाहन्छौं।",
      "mailtoName": "नाम",
      "mailtoOrganization": "संस्था",
      "mailtoRole": "भूमिका",
      "mailtoWorkEmail": "कामको इमेल",
      "mailtoPhone": "फोन",
      "mailtoOrganizationType": "संस्थाको प्रकार",
      "mailtoLearners": "अनुमानित विद्यार्थी संख्या",
      "mailtoNeedHelp": "हामीलाई सहयोग चाहिएको विषय:",
      "mailtoRegards": "सादर,"
    }
  },
  "fa": {
    "dir": "rtl",
    "common": {
      "language": "زبان",
      "floentlyHome": "خانه Floently",
      "signIn": "ورود",
      "forOrganizations": "برای سازمان‌ها",
      "forOrganizationsArrow": "برای سازمان‌ها ←",
      "bookDemo": "رزرو دمو",
      "contact": "تماس",
      "learnerPage": "صفحه زبان‌آموز",
      "startLearning": "شروع یادگیری",
      "backToFloently": "بازگشت به Floently",
      "openContactForm": "باز کردن فرم تماس"
    },
    "landing": {
      "eyebrow": "YKI را قبول شوید، در کار موفق شوید و فنلاند را دوست داشته باشید!",
      "h1Line1": "YKI را قبول شوید.",
      "h1Line2": "در محل کار فنلاندی صحبت کنید.",
      "heroSub": "فنلاندی کاربردی برای YKI و کار — برای متخصصانی که برای زندگی و کار در فنلاند آماده می‌شوند.",
      "alreadyHaveAccount": "حساب دارید؟",
      "demoCaption": "فنلاندی تمرین کنید → اصلاح بگیرید → قانون را یاد بگیرید. Floently این‌گونه کار می‌کند.",
      "trustBuiltForYki": "ساخته‌شده برای YKI",
      "trustForProfessionals": "برای متخصصان",
      "trustFreeToStart": "شروع رایگان",
      "pathwaysEyebrow": "سه مسیر",
      "pathwaysTitle": "YKI، کار و زندگی در فنلاند.",
      "pathwaysSub": "مسیر مناسب هدف خود را انتخاب کنید. Floently برای افراد، شرکت‌ها و شهرها کار می‌کند.",
      "learnerPath": {
        "id": "learners",
        "label": "زبان‌آموزان",
        "title": "YKI را قبول شوید و مسیر حرفه‌ای را شروع کنید.",
        "body": "خواندن، شنیدن، نوشتن و صحبت کردن بر اساس YKI و فنلاندی مورد نیاز کار.",
        "link": "شروع یادگیری →"
      },
      "employerPath": {
        "id": "employers",
        "label": "کارفرمایان",
        "title": "کارکنان بین‌المللی را وارد و حفظ کنید.",
        "body": "فنلاندی محل کار برای ارتباط امن‌تر، onboarding سریع‌تر و ماندگاری قوی‌تر.",
        "link": "رزرو pilot →"
      },
      "cityPath": {
        "id": "cities",
        "label": "شهرها",
        "title": "مسیر زبانی قابل گسترش.",
        "body": "یادگیری زبان را به اشتغال و مشارکت بلندمدت در جامعه فنلاند پیوند دهید.",
        "link": "با ما صحبت کنید →"
      },
      "footerMade": "ساخته‌شده برای فنلاند."
    },
    "demo": {
      "label": "Floently · اصلاح زنده",
      "prompt": "پاسخ شما به فنلاندی",
      "sentence": "Kävin apteekkiin eilen.",
      "wrongWord": "apteekkiin",
      "rightWord": "apteekissa",
      "tooltipTitle": "حالت inessive را به‌کار ببرید",
      "tooltipBody": "پس از käydä برای مکان از -ssa/-ssä استفاده می‌شود: apteekissa, kaupassa, töissä.",
      "success": "اکنون فنلاندی‌تر به گوش می‌رسد. یک قدم نزدیک‌تر به YKI."
    },
    "organizations": {
      "navEmployers": "کارفرمایان",
      "navCities": "شهرها",
      "heroEyebrow": "برای سازمان‌ها",
      "heroTitle": "پشتیبانی فنلاندی برای کار، ادغام و ماندگاری.",
      "heroLede": "Floently به سازمان‌ها کمک می‌کند استعداد بین‌المللی را با فنلاندی کاربردی پشتیبانی کنند: YKI، ارتباط کاری، موقعیت‌های حرفه‌ای و اعتماد در صحبت.",
      "viewLearnerPage": "صفحه زبان‌آموز را ببینید",
      "valueSummaryLabel": "خلاصه ارزش سازمان",
      "cardKicker": "چرا مهم است",
      "whyTitle": "زبان فقط مشکل امتحان نیست.",
      "whyBody": "بر onboarding، ایمنی، اعتماد، ارتباط با مشتری، پیشرفت آموزشی و آینده در فنلاند اثر می‌گذارد.",
      "metricYki": "YKI",
      "metricWorkplace": "محل کار",
      "metricSpeaking": "صحبت",
      "readiness": "آمادگی",
      "scenarios": "موقعیت‌ها",
      "practice": "تمرین",
      "whoEyebrow": "برای چه کسانی",
      "whoTitle": "برای سازمان‌هایی که به موفقیت افراد در فنلاند کمک می‌کنند.",
      "whoBody": "این صفحه توضیح می‌دهد چرا سازمان از Floently استفاده می‌کند، چه pilot مناسب است و گفتگو چگونه آغاز می‌شود.",
      "audiences": [
        {
          "id": "employers",
          "label": "کارفرمایان",
          "title": "کارکنان بین‌المللی را با ارتباط امن‌تر فنلاندی آماده کار کنید.",
          "body": "برای کارکنان مسیر روشنی از فنلاندی روزمره تا موقعیت‌های کاری بسازید: گزارش دادن، درخواست کمک، توضیح مشکل و گفتگو با همکار یا مشتری."
        },
        {
          "id": "cities",
          "label": "شهرها و شهرداری‌ها",
          "title": "یادگیری زبان را به ادغام و کار پیوند دهید.",
          "body": "از تازه‌واردان با تمرین فنلاندی مرتبط با YKI، زندگی کاری و مشارکت بلندمدت در فنلاند پشتیبانی کنید."
        },
        {
          "id": "training",
          "label": "ارائه‌دهندگان آموزش",
          "title": "تمرین گفتاری با AI را به برنامه اضافه کنید.",
          "body": "Floently را به‌عنوان لایه تمرین بین درس‌ها به‌کار ببرید: زبان‌آموزان تکرار می‌کنند، اصلاح می‌گیرند و اعتماد می‌سازند."
        }
      ],
      "platformEyebrow": "آنچه Floently ارائه می‌دهد",
      "platformTitle": "لایه یادگیری برای YKI، کار و گفتگوهای واقعی.",
      "platformBody": "Floently صفحه دوره ثابت نیست. تمرین تکراری می‌دهد و به سازمان‌ها کمک می‌کند رشد زبان را بین درس‌ها، شیفت‌ها و قرارها پشتیبانی کنند.",
      "pillars": [
        {
          "id": "yki",
          "label": "مسیر YKI",
          "eyebrow": "مسیر YKI",
          "title": "آمادگی آزمون با مهارت واقعی",
          "body": "خواندن، شنیدن، نوشتن و صحبت کردن بر اساس مهارت‌های لازم برای YKI ساخته شده است، نه فقط حفظ واژه."
        },
        {
          "id": "professional",
          "label": "فنلاندی حرفه‌ای",
          "eyebrow": "فنلاندی حرفه‌ای",
          "title": "ارتباط بر اساس نقش",
          "body": "مسیرهای حرفه‌ای کمک می‌کنند عبارت‌ها، تصمیم‌ها و سوءتفاهم‌های محیط کار واقعی تمرین شوند."
        },
        {
          "id": "speaking",
          "label": "صحبت و نقش‌آفرینی",
          "eyebrow": "صحبت و نقش‌آفرینی",
          "title": "اعتماد پیش از گفتگوهای واقعی",
          "body": "زبان‌آموزان با roleplay هوش مصنوعی، چرخه‌های اصلاح و موقعیت‌های واقعی تمرین می‌کنند تا طبیعی‌تر صحبت کنند."
        },
        {
          "id": "visibility",
          "label": "دید برنامه",
          "eyebrow": "دید برنامه",
          "title": "نمای روشن‌تر از پیشرفت",
          "body": "در pilotها، Floently می‌تواند بازخورد گروهی بدهد: چه چیزی تمرین می‌شود، کجا دشواری هست و چه پشتیبانی لازم است."
        }
      ],
      "pilotEyebrow": "مدل pilot",
      "pilotTitle": "کوچک شروع کنید، سودمندی را بسنجید، سپس گسترش دهید.",
      "pilotBody": "pilot خوب باید مشخص باشد: یک گروه، یک هدف زبانی و یک بهبود قابل اندازه‌گیری مانند اعتماد، آمادگی YKI، ارتباط onboarding یا روانی حرفه‌ای.",
      "pilotSteps": [
        "گروه هدف را انتخاب کنید: کارکنان، جویندگان کار، دانشجویان، مشتریان ادغام یا یک حرفه خاص.",
        "هدف آموزش را انتخاب کنید: YKI، ارتباط محل کار، onboarding حرفه‌ای یا پشتیبانی ترکیبی.",
        "یک pilot کوچک اجرا کنید و درباره اعتماد زبانی، کاربردپذیری و شکاف‌های یادگیری بازخورد بگیرید.",
        "تصمیم بگیرید آیا Floently بخشی از مسیر زبان، onboarding یا ادغام می‌شود."
      ],
      "demoEyebrow": "رزرو دمو",
      "demoTitle": "درباره سازمان خود به ما بگویید.",
      "demoBody": "برای ارسال درخواست دمو از فرم تماس استفاده کنید. همچنین می‌توانید مستقیم ایمیل بفرستید.",
      "demoNote": "پیام پیشنهادی: نام سازمان، گروه هدف، تعداد زبان‌آموزان، هدف و زمان دمو.",
      "footerBuilt": "ساخته‌شده برای فنلاند."
    },
    "contact": {
      "directEmail": "ایمیل مستقیم",
      "eyebrow": "رزرو دمو",
      "title": "درباره سازمان خود به ما بگویید.",
      "copy": "برای کارفرمایان، شهرها، ارائه‌دهندگان آموزش یا برنامه‌های ادغام، دموی Floently درخواست کنید. با ایمیل پاسخ می‌دهیم.",
      "formTitle": "درخواست دمو برای سازمان",
      "formIntro": "اطلاعات زیر را پر کنید. دکمه برنامه ایمیل را با پیام آماده باز می‌کند.",
      "name": "نام شما",
      "namePlaceholder": "نام کامل",
      "email": "ایمیل کاری",
      "emailPlaceholder": "name@organization.fi",
      "organization": "سازمان",
      "organizationPlaceholder": "نام سازمان",
      "role": "نقش شما",
      "rolePlaceholder": "HR، هماهنگ‌کننده، معلم...",
      "organizationType": "نوع سازمان",
      "learners": "تعداد تقریبی زبان‌آموزان",
      "learnersPlaceholder": "مثلاً ۲۰ پرستار، ۸۰ جویای کار",
      "phone": "تلفن، اختیاری",
      "phonePlaceholder": "+358 ...",
      "message": "چه چیزی را می‌خواهید حل کنید؟",
      "messagePlaceholder": "درباره زبان‌آموزان، نیاز فنلاندی محل کار، YKI، onboarding یا ایده pilot بگویید.",
      "sendDemoRequest": "ارسال درخواست دمو ←",
      "note": "این از برنامه ایمیل شما استفاده می‌کند. ارسال فرم از backend بعداً قابل افزودن است.",
      "organizationTypes": [
        {
          "value": "employer",
          "label": "کارفرما"
        },
        {
          "value": "city",
          "label": "شهر یا شهرداری"
        },
        {
          "value": "training",
          "label": "ارائه‌دهنده آموزش"
        },
        {
          "value": "integration",
          "label": "برنامه ادغام"
        },
        {
          "value": "healthcare",
          "label": "سازمان سلامت"
        },
        {
          "value": "other",
          "label": "دیگر"
        }
      ],
      "mailtoSubjectPrefix": "درخواست دموی Floently از",
      "mailtoFallbackOrganization": "یک سازمان",
      "mailtoGreeting": "سلام تیم Floently،",
      "mailtoIntro": "می‌خواهیم برای سازمان خود دمو رزرو کنیم.",
      "mailtoName": "نام",
      "mailtoOrganization": "سازمان",
      "mailtoRole": "نقش",
      "mailtoWorkEmail": "ایمیل کاری",
      "mailtoPhone": "تلفن",
      "mailtoOrganizationType": "نوع سازمان",
      "mailtoLearners": "تعداد تقریبی زبان‌آموزان",
      "mailtoNeedHelp": "در این زمینه کمک می‌خواهیم:",
      "mailtoRegards": "با احترام،"
    }
  },
  "ur": {
    "dir": "rtl",
    "common": {
      "language": "زبان",
      "floentlyHome": "Floently ہوم",
      "signIn": "سائن اِن",
      "forOrganizations": "تنظیموں کے لیے",
      "forOrganizationsArrow": "تنظیموں کے لیے ←",
      "bookDemo": "ڈیمو بک کریں",
      "contact": "رابطہ",
      "learnerPage": "لرنر صفحہ",
      "startLearning": "سیکھنا شروع کریں",
      "backToFloently": "Floently پر واپس جائیں",
      "openContactForm": "رابطہ فارم کھولیں"
    },
    "landing": {
      "eyebrow": "YKI پاس کریں، کام میں کامیاب ہوں، فن لینڈ سے محبت کریں!",
      "h1Line1": "YKI پاس کریں۔",
      "h1Line2": "کام پر فِنش بولیں۔",
      "heroSub": "YKI اور کام کے لیے عملی فِنش — فن لینڈ میں رہنے اور کام کرنے کی تیاری کرنے والے پیشہ ور افراد کے لیے۔",
      "alreadyHaveAccount": "کیا آپ کا اکاؤنٹ ہے؟",
      "demoCaption": "فِنش کی مشق کریں → اصلاح پائیں → قاعدہ سیکھیں۔ Floently اسی طرح کام کرتا ہے۔",
      "trustBuiltForYki": "YKI کے لیے بنایا گیا",
      "trustForProfessionals": "پیشہ ور افراد کے لیے",
      "trustFreeToStart": "مفت شروع کریں",
      "pathwaysEyebrow": "تین راستے",
      "pathwaysTitle": "YKI، کام اور فن لینڈ کی زندگی۔",
      "pathwaysSub": "اپنے مقصد کے مطابق راستہ منتخب کریں۔ Floently افراد، کمپنیوں اور شہروں کے لیے کام کرتا ہے۔",
      "learnerPath": {
        "id": "learners",
        "label": "سیکھنے والے",
        "title": "YKI پاس کریں اور پیشہ ورانہ راستہ شروع کریں۔",
        "body": "پڑھنا، سننا، لکھنا اور بولنا YKI اور کام کی فِنش کے گرد بنایا گیا ہے۔",
        "link": "سیکھنا شروع کریں →"
      },
      "employerPath": {
        "id": "employers",
        "label": "آجر",
        "title": "بین الاقوامی عملے کو شامل اور برقرار رکھیں۔",
        "body": "محفوظ رابطے، تیز onboarding اور بہتر برقرار رکھنے کے لیے کام کی فِنش۔",
        "link": "pilot بک کریں →"
      },
      "cityPath": {
        "id": "cities",
        "label": "شہر",
        "title": "قابلِ توسیع زبان کا راستہ۔",
        "body": "زبان سیکھنے کو روزگار اور فن لینڈ کے معاشرے میں طویل شرکت سے جوڑیں۔",
        "link": "ہم سے بات کریں →"
      },
      "footerMade": "فن لینڈ کے لیے بنایا گیا۔"
    },
    "demo": {
      "label": "Floently · براہ راست اصلاح",
      "prompt": "آپ کا جواب فِنش میں",
      "sentence": "Kävin apteekkiin eilen.",
      "wrongWord": "apteekkiin",
      "rightWord": "apteekissa",
      "tooltipTitle": "inessive صورت استعمال کریں",
      "tooltipBody": "käydä کے بعد جگہ کے لیے -ssa/-ssä استعمال ہوتا ہے: apteekissa, kaupassa, töissä.",
      "success": "اب یہ فِنش جیسا لگتا ہے۔ YKI کے ایک قدم قریب۔"
    },
    "organizations": {
      "navEmployers": "آجر",
      "navCities": "شہر",
      "heroEyebrow": "تنظیموں کے لیے",
      "heroTitle": "کام، انضمام اور برقرار رکھنے کے لیے فِنش مدد۔",
      "heroLede": "Floently تنظیموں کو عملی فِنش کے ذریعے بین الاقوامی talent کی مدد کرنے دیتا ہے: YKI، کام کی گفتگو، پیشہ ورانہ حالات اور بولنے کا اعتماد۔",
      "viewLearnerPage": "لرنر صفحہ دیکھیں",
      "valueSummaryLabel": "تنظیم کی قدر کا خلاصہ",
      "cardKicker": "یہ کیوں اہم ہے",
      "whyTitle": "زبان صرف امتحان کا مسئلہ نہیں۔",
      "whyBody": "یہ onboarding، حفاظت، اعتماد، کسٹمر گفتگو، تعلیمی پیش رفت اور فن لینڈ میں مستقبل پر اثر ڈالتی ہے۔",
      "metricYki": "YKI",
      "metricWorkplace": "کام کی جگہ",
      "metricSpeaking": "بولنا",
      "readiness": "تیاری",
      "scenarios": "حالات",
      "practice": "مشق",
      "whoEyebrow": "کن کے لیے",
      "whoTitle": "ان تنظیموں کے لیے جو لوگوں کو فن لینڈ میں کامیاب بناتی ہیں۔",
      "whoBody": "یہ صفحہ بتاتا ہے کہ تنظیم Floently کیوں استعمال کرے، کون سا pilot مناسب ہے اور بات کیسے شروع ہو۔",
      "audiences": [
        {
          "id": "employers",
          "label": "آجر",
          "title": "بین الاقوامی عملے کو محفوظ فِنش رابطے کے ساتھ onboarding کریں۔",
          "body": "عملے کو روزمرہ فِنش سے کام کے حالات تک واضح راستہ دیں: رپورٹنگ، مدد مانگنا، مسئلہ سمجھانا اور ساتھیوں یا گاہکوں سے بات کرنا۔"
        },
        {
          "id": "cities",
          "label": "شہر اور بلدیات",
          "title": "زبان سیکھنے کو انضمام اور روزگار سے جوڑیں۔",
          "body": "نئے آنے والوں کو YKI، کام کی زندگی اور فن لینڈ میں طویل شرکت سے جڑی فِنش مشق کے ذریعے سہارا دیں۔"
        },
        {
          "id": "training",
          "label": "تربیتی ادارے",
          "title": "پروگرام کے ساتھ AI بولنے کی مشق شامل کریں۔",
          "body": "Floently کو اسباق کے درمیان مشق کی تہہ کے طور پر استعمال کریں: سیکھنے والے دہراتے ہیں، اصلاح پاتے ہیں اور اعتماد بناتے ہیں۔"
        }
      ],
      "platformEyebrow": "Floently کیا فراہم کرتا ہے",
      "platformTitle": "YKI، کام اور حقیقی گفتگو کے لیے سیکھنے کی تہہ۔",
      "platformBody": "Floently کوئی جامد کورس صفحہ نہیں۔ یہ بار بار مشق دیتا ہے اور تنظیموں کو اسباق، شفٹوں اور ملاقاتوں کے درمیان زبان کی ترقی میں مدد دیتا ہے۔",
      "pillars": [
        {
          "id": "yki",
          "label": "YKI راستہ",
          "eyebrow": "YKI راستہ",
          "title": "حقیقی مہارت کے ساتھ امتحان کی تیاری",
          "body": "پڑھنا، سننا، لکھنا اور بولنا YKI کی ضروری مہارتوں کے مطابق بنایا جاتا ہے، صرف الفاظ یاد کرنے کے لیے نہیں۔"
        },
        {
          "id": "professional",
          "label": "پیشہ ور فِنش",
          "eyebrow": "پیشہ ور فِنش",
          "title": "کردار کے مطابق رابطہ",
          "body": "پیشہ ور راستے حقیقی کام کی جگہ کے جملے، فیصلے اور غلط فہمیاں مشق کراتے ہیں۔"
        },
        {
          "id": "speaking",
          "label": "بولنا اور roleplay",
          "eyebrow": "بولنا اور roleplay",
          "title": "حقیقی گفتگو سے پہلے اعتماد",
          "body": "سیکھنے والے AI roleplay، اصلاحی چکروں اور حقیقت پسندانہ prompts سے زیادہ فطری بولنا سیکھتے ہیں۔"
        },
        {
          "id": "visibility",
          "label": "پروگرام کی نمائش",
          "eyebrow": "پروگرام کی نمائش",
          "title": "پیش رفت کا صاف منظر",
          "body": "pilot میں Floently گروہی feedback دے سکتا ہے: کیا مشق ہو رہی ہے، کہاں مشکل ہے اور اگلی مدد کیا ہے۔"
        }
      ],
      "pilotEyebrow": "pilot ماڈل",
      "pilotTitle": "چھوٹا شروع کریں، فائدہ ناپیں، پھر بڑھائیں۔",
      "pilotBody": "اچھا pilot واضح ہوتا ہے: ایک گروپ، ایک زبان کا مقصد اور ایک قابل پیمائش بہتری جیسے اعتماد، YKI تیاری، onboarding گفتگو یا پیشہ ور روانی۔",
      "pilotSteps": [
        "ہدف گروپ منتخب کریں: عملہ، ملازمت کے متلاشی، طلبہ، integration کلائنٹس یا خاص پیشہ۔",
        "تربیتی مقصد منتخب کریں: YKI، کام کی گفتگو، پیشہ ور onboarding یا مشترکہ مدد۔",
        "چھوٹا pilot چلائیں اور زبان کے اعتماد، استعمال اور سیکھنے کے خلا پر feedback لیں۔",
        "فیصلہ کریں کہ Floently زبان، onboarding یا integration راستے کا حصہ بنے گا یا نہیں۔"
      ],
      "demoEyebrow": "ڈیمو بک کریں",
      "demoTitle": "ہمیں اپنی تنظیم کے بارے میں بتائیں۔",
      "demoBody": "ڈیمو درخواست بھیجنے کے لیے رابطہ فارم استعمال کریں۔ آپ براہ راست ای میل بھی کر سکتے ہیں۔",
      "demoNote": "تجویز کردہ پیغام: تنظیم کا نام، ہدف گروپ، سیکھنے والوں کی تعداد، مقصد اور ڈیمو وقت۔",
      "footerBuilt": "فن لینڈ کے لیے بنایا گیا۔"
    },
    "contact": {
      "directEmail": "براہ راست ای میل",
      "eyebrow": "ڈیمو بک کریں",
      "title": "ہمیں اپنی تنظیم کے بارے میں بتائیں۔",
      "copy": "آجروں، شہروں، تربیتی اداروں یا integration پروگراموں کے لیے Floently demo کی درخواست کریں۔ ہم ای میل سے جواب دیں گے۔",
      "formTitle": "تنظیم ڈیمو درخواست",
      "formIntro": "نیچے تفصیلات پُر کریں۔ بٹن تیار پیغام کے ساتھ ای میل ایپ کھولتا ہے۔",
      "name": "آپ کا نام",
      "namePlaceholder": "پورا نام",
      "email": "کام کا ای میل",
      "emailPlaceholder": "name@organization.fi",
      "organization": "تنظیم",
      "organizationPlaceholder": "تنظیم کا نام",
      "role": "آپ کا کردار",
      "rolePlaceholder": "HR، کوآرڈینیٹر، استاد...",
      "organizationType": "تنظیم کی قسم",
      "learners": "متوقع سیکھنے والوں کی تعداد",
      "learnersPlaceholder": "مثلاً 20 نرسیں، 80 ملازمت کے متلاشی",
      "phone": "فون، اختیاری",
      "phonePlaceholder": "+358 ...",
      "message": "آپ کیا حل کرنا چاہتے ہیں؟",
      "messagePlaceholder": "سیکھنے والوں، کام کی فِنش، YKI، onboarding یا pilot خیال کے بارے میں بتائیں۔",
      "sendDemoRequest": "ڈیمو درخواست بھیجیں ←",
      "note": "یہ آپ کی ای میل ایپ استعمال کرتا ہے۔ backend form sending بعد میں شامل کیا جا سکتا ہے۔",
      "organizationTypes": [
        {
          "value": "employer",
          "label": "آجر"
        },
        {
          "value": "city",
          "label": "شہر یا بلدیہ"
        },
        {
          "value": "training",
          "label": "تربیتی ادارہ"
        },
        {
          "value": "integration",
          "label": "انضمامی پروگرام"
        },
        {
          "value": "healthcare",
          "label": "صحت کی تنظیم"
        },
        {
          "value": "other",
          "label": "دیگر"
        }
      ],
      "mailtoSubjectPrefix": "Floently demo درخواست از",
      "mailtoFallbackOrganization": "ایک تنظیم",
      "mailtoGreeting": "سلام Floently ٹیم،",
      "mailtoIntro": "ہم اپنی تنظیم کے لیے demo بک کرنا چاہتے ہیں۔",
      "mailtoName": "نام",
      "mailtoOrganization": "تنظیم",
      "mailtoRole": "کردار",
      "mailtoWorkEmail": "کام کا ای میل",
      "mailtoPhone": "فون",
      "mailtoOrganizationType": "تنظیم کی قسم",
      "mailtoLearners": "متوقع سیکھنے والوں کی تعداد",
      "mailtoNeedHelp": "ہمیں اس میں مدد چاہیے:",
      "mailtoRegards": "نیک تمنائیں،"
    }
  }
};

export function normalizePublicLanguage(input: string | null | undefined): PublicPageLanguage {
  const raw = (input ?? '').toLowerCase().replace('_', '-');
  const short = raw.split('-')[0];
  const match = PUBLIC_LANGUAGES.find((item) => item.code === short);
  return match?.code ?? 'en';
}

function detectInitialLanguage(): PublicPageLanguage {
  if (typeof window === 'undefined') return 'en';

  const params = new URLSearchParams(window.location.search);
  const urlLang = params.get('lang') || params.get('ui_language') || params.get('language');
  if (urlLang) return normalizePublicLanguage(urlLang);

  for (const key of ['floently_public_language', 'floently-ui-language', 'floently_ui_language', 'uiLanguage', 'language', 'i18nextLng']) {
    const value = window.localStorage.getItem(key);
    if (value) return normalizePublicLanguage(value);
  }

  return normalizePublicLanguage(window.navigator.language);
}

export function getPublicMarketingCopy(language: PublicPageLanguage): PublicMarketingCopy {
  return PUBLIC_MARKETING_COPY[language] ?? PUBLIC_MARKETING_COPY.en;
}

export function usePublicPageI18n() {
  const [language, setLanguageState] = useState<PublicPageLanguage>(() => detectInitialLanguage());
  const copy = useMemo(() => getPublicMarketingCopy(language), [language]);

  const setLanguage = (next: string) => {
    const normalized = normalizePublicLanguage(next);
    setLanguageState(normalized);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('floently_public_language', normalized);
    }
  };

  return {
    language,
    setLanguage,
    copy,
    languages: PUBLIC_LANGUAGES,
    dir: copy.dir,
  };
}
