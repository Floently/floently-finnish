import type { ReadingLevel, ReadingScope, ReadingTask } from './readingEngine';

const ORIGINAL_PROVENANCE = {
  author: 'KieliValmis / Agent C',
  authoredAt: '2026-08-16',
  license: 'KieliValmis-original',
  sourceNote:
    'Original Finnish learning content. Not adapted from YKI questions, textbooks, or paid course material.',
} as const;

const EVERYDAY_A1: ReadingTask = {
  taskId: 'reading.everyday.a1.library-hours',
  contentVersion: '2026-08-16.1',
  pathway: 'everyday',
  level: 'A1',
  title: 'Milloin kirjasto on auki?',
  context: 'Haluat käydä kirjastossa töiden jälkeen.',
  readingGoal: 'Etsi päivät ja kellonajat.',
  estimatedMinutes: 4,
  document: {
    type: 'notice',
    title: 'Koivulan kirjasto',
    metadata: 'Aukioloajat tällä viikolla',
    segments: [
      { id: 'a1-heading', text: 'Aukioloajat', emphasis: 'heading' },
      { id: 'a1-mon', text: 'Maanantai: kiinni', emphasis: 'body' },
      { id: 'a1-tue', text: 'Tiistai: klo 10–18', emphasis: 'body' },
      { id: 'a1-wed', text: 'Keskiviikko: klo 12–19', emphasis: 'body' },
      {
        id: 'a1-service',
        text: 'Asiakaspalvelu päättyy puoli tuntia ennen kirjaston sulkemista.',
        emphasis: 'body',
      },
    ],
  },
  vocabulary: [
    {
      id: 'a1-vocab-kiinni',
      term: 'kiinni',
      meaning: 'ei auki',
      contextNote: 'Maanantaina kirjastoon ei voi mennä.',
    },
    {
      id: 'a1-vocab-paattyy',
      term: 'päättyy',
      meaning: 'loppuu',
      contextNote: 'Asiakaspalvelu loppuu ennen kuin kirjasto suljetaan.',
    },
  ],
  questions: [
    {
      id: 'a1-q-day',
      type: 'detail',
      prompt: 'Minä päivänä kirjasto on kiinni?',
      strategyHint: 'Etsi tekstistä sana “kiinni”.',
      options: [
        { id: 'a1-q-day-mon', label: 'Maanantaina' },
        { id: 'a1-q-day-tue', label: 'Tiistaina' },
        { id: 'a1-q-day-wed', label: 'Keskiviikkona' },
      ],
      correctOptionId: 'a1-q-day-mon',
      feedback: {
        correct: 'Oikein. Maanantain kohdalla lukee “kiinni”.',
        incorrect: 'Katso jokaisen päivän jälkeen oleva tieto. Yhden päivän kohdalla ei ole kellonaikaa.',
      },
    },
    {
      id: 'a1-q-service',
      type: 'detail',
      prompt: 'Mihin aikaan asiakaspalvelu päättyy tiistaina?',
      strategyHint: 'Kirjasto suljetaan klo 18. Vähennä siitä puoli tuntia.',
      options: [
        { id: 'a1-q-service-17', label: 'Klo 17.00' },
        { id: 'a1-q-service-1730', label: 'Klo 17.30' },
        { id: 'a1-q-service-18', label: 'Klo 18.00' },
      ],
      correctOptionId: 'a1-q-service-1730',
      feedback: {
        correct: 'Oikein. Puoli tuntia ennen kello 18:aa on kello 17.30.',
        incorrect: 'Tiistain sulkemisaika on klo 18. Asiakaspalvelu päättyy 30 minuuttia sitä ennen.',
      },
    },
    {
      id: 'a1-q-word',
      type: 'contextual_vocabulary',
      prompt: 'Mitä “kiinni” tarkoittaa tässä ilmoituksessa?',
      strategyHint: 'Vertaa maanantain tietoa muihin päiviin.',
      options: [
        { id: 'a1-q-word-closed', label: 'Kirjasto ei ole auki.' },
        { id: 'a1-q-word-busy', label: 'Kirjastossa on paljon ihmisiä.' },
        { id: 'a1-q-word-early', label: 'Kirjasto avataan aikaisin.' },
      ],
      correctOptionId: 'a1-q-word-closed',
      feedback: {
        correct: 'Oikein. “Kiinni” tarkoittaa, että paikka ei ole auki.',
        incorrect: 'Muiden päivien kohdalla on aukioloajat. Maanantain kohdalla on vain sana “kiinni”.',
      },
    },
  ],
  tags: ['palvelut', 'aukioloajat'],
  provenance: ORIGINAL_PROVENANCE,
};

const EVERYDAY_A2: ReadingTask = {
  taskId: 'reading.everyday.a2.water-outage',
  contentVersion: '2026-08-16.1',
  pathway: 'everyday',
  level: 'A2',
  title: 'Vesikatko kotitalossa',
  context: 'Taloyhtiö lähettää asukkaille viestin huoltotyöstä.',
  readingGoal: 'Selvitä, milloin katko on ja miten siihen valmistaudutaan.',
  estimatedMinutes: 5,
  document: {
    type: 'message',
    title: 'Tiedote asukkaille: vesikatko',
    metadata: 'Lähettäjä: Koivukuja 8:n huolto',
    segments: [
      {
        id: 'a2-when',
        text: 'Talossa on vesikatko keskiviikkona 20.8. klo 9–12 putkien huoltotyön vuoksi.',
        emphasis: 'body',
      },
      {
        id: 'a2-before',
        text: 'Varaa juomavettä etukäteen. Sulje kaikki vesihanat ennen kuin katko alkaa.',
        emphasis: 'body',
      },
      {
        id: 'a2-during',
        text: 'Älä käytä astian- tai pyykinpesukonetta katkon aikana.',
        emphasis: 'body',
      },
      {
        id: 'a2-after',
        text: 'Kun vesi palaa, juoksuta kylmää vettä hetki. Vesi voi olla aluksi sameaa.',
        emphasis: 'body',
      },
    ],
  },
  vocabulary: [
    {
      id: 'a2-vocab-katko',
      term: 'katko',
      meaning: 'aika, jolloin palvelu ei toimi',
      contextNote: 'Vesikatkon aikana hanasta ei tule vettä normaalisti.',
    },
    {
      id: 'a2-vocab-samea',
      term: 'samea',
      meaning: 'ei kirkas',
      contextNote: 'Huollon jälkeen vedessä voi näkyä hetken pieniä ilmakuplia.',
    },
  ],
  questions: [
    {
      id: 'a2-q-main',
      type: 'main_idea',
      prompt: 'Mikä on viestin tärkein tarkoitus?',
      strategyHint: 'Katso otsikkoa ja sitä, mitä asukkaan pitää tehdä.',
      options: [
        { id: 'a2-q-main-instructions', label: 'Kertoa vesikatkosta ja antaa toimintaohjeet' },
        { id: 'a2-q-main-bill', label: 'Ilmoittaa veden hinnan noususta' },
        { id: 'a2-q-main-machine', label: 'Mainostaa uutta pesukonetta' },
      ],
      correctOptionId: 'a2-q-main-instructions',
      feedback: {
        correct: 'Oikein. Viesti kertoo sekä katkon ajan että ohjeet ennen katkoa ja sen jälkeen.',
        incorrect: 'Yhdistä otsikko, kellonaika ja useat asukkaalle annetut ohjeet.',
      },
    },
    {
      id: 'a2-q-order',
      type: 'sequencing',
      prompt: 'Laita asukkaan toimet oikeaan järjestykseen.',
      strategyHint: 'Etsi tekstistä ilmaukset “etukäteen”, “katkon aikana” ja “kun vesi palaa”.',
      items: [
        { id: 'a2-order-run', label: 'Juoksuta kylmää vettä.' },
        { id: 'a2-order-reserve', label: 'Varaa juomavettä.' },
        { id: 'a2-order-avoid', label: 'Pidä pesukoneet pois käytöstä.' },
      ],
      correctOrder: ['a2-order-reserve', 'a2-order-avoid', 'a2-order-run'],
      feedback: {
        correct: 'Oikein. Ensin valmistaudutaan, sitten odotetaan katkon ajan ja lopuksi vesi juoksutetaan.',
        incorrect: 'Tarkista, mikä tehdään ennen katkoa, sen aikana ja vasta veden palattua.',
      },
    },
    {
      id: 'a2-q-word',
      type: 'contextual_vocabulary',
      prompt: 'Mitä “vesikatko” tarkoittaa viestin perusteella?',
      strategyHint: 'Katso ohjeita: miksi vettä pitää varata etukäteen?',
      options: [
        { id: 'a2-q-word-break', label: 'Vettä ei saa tavalliseen tapaan tietyn ajan.' },
        { id: 'a2-q-word-leak', label: 'Asunnon lattialla on vettä.' },
        { id: 'a2-q-word-clean', label: 'Vesi on tavallista puhtaampaa.' },
      ],
      correctOptionId: 'a2-q-word-break',
      feedback: {
        correct: 'Oikein. Katko on rajattu aika, jolloin vedenjakelu ei toimi normaalisti.',
        incorrect: 'Tekstissä kerrotaan katkon alkamis- ja päättymisaika sekä pyydetään varaamaan vettä.',
      },
    },
  ],
  tags: ['asuminen', 'huoltotiedote'],
  provenance: ORIGINAL_PROVENANCE,
};

const EVERYDAY_B1: ReadingTask = {
  taskId: 'reading.everyday.b1.city-bike-station',
  contentVersion: '2026-08-16.1',
  pathway: 'everyday',
  level: 'B1',
  title: 'Kaupunkipyöräasema siirtyy',
  context: 'Käytät pyöräasemaa työmatkalla.',
  readingGoal: 'Tunnista muutoksen syy, uusi paikka ja käytännön vaikutus.',
  estimatedMinutes: 6,
  document: {
    type: 'announcement',
    title: 'Rautatieaseman pyöräpiste väliaikaisesti uuteen paikkaan',
    metadata: 'Kaupungin liikennepalvelut · 18.8.',
    segments: [
      {
        id: 'b1-move',
        text: 'Rautatieaseman kaupunkipyöräpiste siirretään maanantaista alkaen torin katutöiden vuoksi. Uusi väliaikainen piste sijaitsee kirjaston pysäköintialueella noin 200 metrin päässä nykyisestä paikasta.',
        emphasis: 'body',
      },
      {
        id: 'b1-app',
        text: 'Uusi sijainti näkyy pyöräsovelluksen kartalla maanantaina puoleenpäivään mennessä. Aamulla kartta saattaa siis vielä ohjata vanhalle pisteelle.',
        emphasis: 'body',
      },
      {
        id: 'b1-duration',
        text: 'Järjestely kestää arviolta kolme viikkoa. Työmatkalaisia pyydetään varaamaan vaihtoon muutama minuutti tavallista enemmän.',
        emphasis: 'body',
      },
    ],
  },
  vocabulary: [
    {
      id: 'b1-vocab-valiaikainen',
      term: 'väliaikainen',
      meaning: 'vain määräajan kestävä',
      contextNote: 'Pyöräpiste palaa myöhemmin pois kirjaston pysäköintialueelta.',
    },
    {
      id: 'b1-vocab-arviolta',
      term: 'arviolta',
      meaning: 'tämänhetkisen arvion mukaan',
      contextNote: 'Kolmen viikon kesto voi vielä hieman muuttua.',
    },
  ],
  questions: [
    {
      id: 'b1-q-main',
      type: 'main_idea',
      prompt: 'Mikä tiedotteen pääasia on?',
      strategyHint: 'Tiivistä otsikko ja ensimmäinen virke yhdeksi ajatukseksi.',
      options: [
        { id: 'b1-q-main-temp', label: 'Pyöräpiste vaihtaa tilapäisesti paikkaa katutöiden ajaksi.' },
        { id: 'b1-q-main-close', label: 'Kaupunkipyöräpalvelu lopetetaan kolmeksi viikoksi.' },
        { id: 'b1-q-main-app', label: 'Pyöräsovellus poistetaan käytöstä maanantaina.' },
      ],
      correctOptionId: 'b1-q-main-temp',
      feedback: {
        correct: 'Oikein. Palvelu jatkuu, mutta piste toimii väliaikaisesti kirjaston luona.',
        incorrect: 'Huomaa ero palvelun lopettamisen ja yhden pisteen siirtämisen välillä.',
      },
    },
    {
      id: 'b1-q-detail',
      type: 'detail',
      prompt: 'Mistä uuden pisteen löytää?',
      strategyHint: 'Paikka mainitaan heti siirron syyn jälkeen.',
      options: [
        { id: 'b1-q-detail-library', label: 'Kirjaston pysäköintialueelta' },
        { id: 'b1-q-detail-platform', label: 'Rautatieaseman laiturilta' },
        { id: 'b1-q-detail-square', label: 'Torin keskeltä' },
      ],
      correctOptionId: 'b1-q-detail-library',
      feedback: {
        correct: 'Oikein. Väliaikainen piste on kirjaston pysäköintialueella.',
        incorrect: 'Katutöitä tehdään torilla, mutta uusi piste sijoitetaan toisen rakennuksen luo.',
      },
    },
    {
      id: 'b1-q-inference',
      type: 'inference',
      prompt: 'Miksi maanantaiaamun käyttäjän kannattaa lukea tiedote eikä luottaa vain sovelluksen karttaan?',
      strategyHint: 'Yhdistä siirron alkamisaika ja kartan päivitysaika.',
      options: [
        { id: 'b1-q-inference-late', label: 'Kartta voi päivittyä vasta aamun jälkeen.' },
        { id: 'b1-q-inference-paid', label: 'Kartta toimii maanantaina vain maksullisena.' },
        { id: 'b1-q-inference-distance', label: 'Kartta ei koskaan näytä alle 200 metrin matkoja.' },
      ],
      correctOptionId: 'b1-q-inference-late',
      feedback: {
        correct: 'Oikein. Siirto alkaa maanantaina, mutta uusi sijainti luvataan kartalle vasta puoleenpäivään mennessä.',
        incorrect: 'Vertaa sanaa “aamulla” ilmaukseen “puoleenpäivään mennessä”.',
      },
    },
  ],
  tags: ['liikkuminen', 'kaupunkipalvelut'],
  provenance: ORIGINAL_PROVENANCE,
};

const EVERYDAY_B2: ReadingTask = {
  taskId: 'reading.everyday.b2.energy-pilot',
  contentVersion: '2026-08-16.1',
  pathway: 'everyday',
  level: 'B2',
  title: 'Taloyhtiön energiakokeilu',
  context: 'Arvioit, miten taloyhtiön kokeilu vaikuttaa arkeesi.',
  readingGoal: 'Erota kokeilun perustelut, rajaukset ja asukkailta odotetut toimet.',
  estimatedMinutes: 8,
  document: {
    type: 'policy',
    title: 'Kuuden viikon energiakokeilu yhteisissä tiloissa',
    metadata: 'Hallituksen tiedote 3/2026',
    segments: [
      {
        id: 'b2-background',
        text: 'Taloyhtiön yhteisten tilojen sähkönkulutus kasvoi viime talvena 18 prosenttia, vaikka asuntojen kokonaiskulutus pysyi lähes ennallaan. Hallitus käynnistää siksi kuuden viikon kokeilun, jonka vaikutukset arvioidaan ennen pysyviä päätöksiä.',
        emphasis: 'body',
      },
      {
        id: 'b2-measures',
        text: 'Kokeilun aikana varastokäytävien lämpötilaa lasketaan kaksi astetta ja kellarin valaistus muutetaan liiketunnistimilla toimivaksi. Muutokset eivät koske asuntojen lämpötilaa, saunavuoroja eivätkä pesutupaa.',
        emphasis: 'body',
      },
      {
        id: 'b2-report',
        text: 'Asukkaita pyydetään ilmoittamaan huollolle, jos valo ei syty liikkeestä tai sammuu kesken tilan käytön. Näin tunnistimien asetuksia voidaan korjata jo kokeilun aikana.',
        emphasis: 'body',
      },
      {
        id: 'b2-review',
        text: 'Kokeilun päätyttyä hallitus vertaa kulutustietoja edellisvuoden vastaavaan ajanjaksoon ja lähettää asukkaille kyselyn tilojen toimivuudesta. Jatkoa käsitellään vasta, kun molemmat tulokset ovat käytettävissä.',
        emphasis: 'body',
      },
    ],
  },
  vocabulary: [
    {
      id: 'b2-vocab-rajata',
      term: 'rajata',
      meaning: 'määritellä, mitä jokin koskee ja mitä ei',
      contextNote: 'Kokeilu on rajattu yhteisiin tiloihin eikä muuta asuntojen lämpötilaa.',
    },
    {
      id: 'b2-vocab-vastaava',
      term: 'vastaava ajanjakso',
      meaning: 'vertailukelpoinen aika toisena vuonna',
      contextNote: 'Talven kulutusta verrataan samaan vuodenaikaan, ei esimerkiksi kesään.',
    },
  ],
  questions: [
    {
      id: 'b2-q-main',
      type: 'main_idea',
      prompt: 'Miten hallitus etenee energiaratkaisussa?',
      options: [
        { id: 'b2-q-main-evidence', label: 'Se kokeilee rajattuja muutoksia ja arvioi sekä kulutuksen että käytettävyyden ennen jatkoa.' },
        { id: 'b2-q-main-permanent', label: 'Se tekee heti pysyvät muutokset kaikkiin asuntoihin ja yhteisiin tiloihin.' },
        { id: 'b2-q-main-survey', label: 'Se päättää jatkosta vain asukaskyselyn enemmistön perusteella.' },
      ],
      correctOptionId: 'b2-q-main-evidence',
      feedback: {
        correct: 'Oikein. Menettely on määräaikainen ja jatko perustuu kahteen erilaiseen tulokseen.',
        incorrect: 'Kiinnitä huomiota sanoihin “kokeilu”, “ennen pysyviä päätöksiä” ja “molemmat tulokset”.',
      },
    },
    {
      id: 'b2-q-match',
      type: 'matching',
      prompt: 'Yhdistä kukin toimi sen tarkoitukseen.',
      prompts: [
        { id: 'b2-match-temp', label: 'Varastokäytävien lämpötilan lasku' },
        { id: 'b2-match-report', label: 'Tunnistinvikojen ilmoittaminen' },
        { id: 'b2-match-compare', label: 'Vertailu edellisvuoden samaan ajankohtaan' },
      ],
      matches: [
        { id: 'b2-match-purpose-fix', label: 'Asetuksia voidaan korjata kokeilun aikana.' },
        { id: 'b2-match-purpose-context', label: 'Kulutusmuutosta arvioidaan vertailukelpoisessa tilanteessa.' },
        { id: 'b2-match-purpose-save', label: 'Yhteisten tilojen energiankulutusta pyritään vähentämään.' },
      ],
      correctPairs: {
        'b2-match-temp': 'b2-match-purpose-save',
        'b2-match-report': 'b2-match-purpose-fix',
        'b2-match-compare': 'b2-match-purpose-context',
      },
      feedback: {
        correct: 'Oikein. Toimet liittyvät säästöön, käytännön korjauksiin ja luotettavaan vertailuun.',
        incorrect: 'Palaa siihen kappaleeseen, jossa kukin toimi mainitaan, ja kysy: mitä tällä toimella saadaan selville tai aikaan?',
      },
    },
    {
      id: 'b2-q-inference',
      type: 'inference',
      prompt: 'Miksi hallitus kerää kulutustiedon lisäksi käyttäjäkokemuksia?',
      options: [
        { id: 'b2-q-inference-function', label: 'Pienempi kulutus ei yksin osoita, toimivatko tilat asukkaiden arjessa.' },
        { id: 'b2-q-inference-no-data', label: 'Taloyhtiö ei pysty mittaamaan sähkönkulutusta lainkaan.' },
        { id: 'b2-q-inference-vote', label: 'Kysely korvaa kaikki hallituksen päätökset sitovalla äänestyksellä.' },
      ],
      correctOptionId: 'b2-q-inference-function',
      feedback: {
        correct: 'Oikein. Päätöksessä arvioidaan yhtä aikaa energiatulos ja tilojen toimivuus.',
        incorrect: 'Teksti sanoo, että jatkoa käsitellään vasta kahden tuloksen jälkeen. Mieti, mitä kumpikin tulos mittaa.',
      },
    },
  ],
  tags: ['asuminen', 'päätöksenteko', 'energia'],
  provenance: ORIGINAL_PROVENANCE,
};

const PROFESSIONAL_B2: ReadingTask = {
  taskId: 'reading.professional.b2.shift-swap',
  contentVersion: '2026-08-16.1',
  pathway: 'professional',
  level: 'B2',
  title: 'Työvuoron vaihtaminen',
  context: 'Tarvitset työvuoron vaihdon ja tarkistat uuden hyväksymismenettelyn.',
  readingGoal: 'Tunnista prosessin vastuut, poikkeus ja hyväksynnän ehdot.',
  estimatedMinutes: 8,
  document: {
    type: 'workplace_procedure',
    title: 'Ohje: työvuorojen vaihtopyynnöt 1.9. alkaen',
    metadata: 'Henkilöstöhallinto · päivitetty 14.8.2026',
    segments: [
      {
        id: 'pro-request',
        text: 'Työvuoron vaihtoa pyytävä työntekijä tekee 1.9. alkaen pyynnön työvuorojärjestelmässä. Pyyntöön merkitään molemmat työntekijät, vaihdettavat vuorot ja lyhyt perustelu.',
        emphasis: 'body',
      },
      {
        id: 'pro-confirm',
        text: 'Vaihtoon osallistuva kollega vahvistaa pyynnön järjestelmässä. Tämän jälkeen esihenkilö tarkistaa, että yksikön vähimmäismiehitys toteutuu ja kummankin työntekijän lepoaika säilyy riittävänä.',
        emphasis: 'body',
      },
      {
        id: 'pro-approval',
        text: 'Vaihto tulee voimaan vasta esihenkilön hyväksynnästä. Pikaviestisovelluksessa sovittu vaihto ei ole hyväksyntä: ennen järjestelmän vahvistusta kumpikin vastaa alkuperäisestä vuorostaan.',
        emphasis: 'body',
      },
      {
        id: 'pro-exception',
        text: 'Äkillisessä sairastumisessa työntekijä soittaa edelleen heti yksikön päivystävälle esihenkilölle. Sairastumisesta ei tehdä tavallista vaihtopyyntöä.',
        emphasis: 'body',
      },
      {
        id: 'pro-purpose',
        text: 'Yhtenäisen menettelyn tavoitteena on vähentää palkanlaskennan korjauksia ja ehkäistä tilanteita, joissa lepoaikasäännöt jäävät epähuomiossa täyttymättä.',
        emphasis: 'body',
      },
    ],
  },
  vocabulary: [
    {
      id: 'pro-vocab-miehitys',
      term: 'vähimmäismiehitys',
      meaning: 'pienin työssä tarvittava henkilöstömäärä',
      contextNote: 'Esihenkilö tarkistaa, että vuorossa on vaihdon jälkeenkin tarpeeksi työntekijöitä.',
    },
    {
      id: 'pro-vocab-astua-voimaan',
      term: 'tulla voimaan',
      meaning: 'alkaa olla hyväksytty ja noudatettava',
      contextNote: 'Kollegan suostumus ei vielä riitä, vaan esihenkilön on hyväksyttävä vaihto.',
    },
  ],
  questions: [
    {
      id: 'pro-q-detail',
      type: 'detail',
      prompt: 'Mitkä kaksi asiaa esihenkilö tarkistaa ennen hyväksyntää?',
      options: [
        { id: 'pro-q-detail-staff-rest', label: 'Vähimmäismiehityksen ja riittävän lepoajan' },
        { id: 'pro-q-detail-reason-pay', label: 'Perustelun pituuden ja seuraavan palkan määrän' },
        { id: 'pro-q-detail-chat-date', label: 'Pikaviestikeskustelun ja työntekijöiden työsuhteen alkamispäivän' },
      ],
      correctOptionId: 'pro-q-detail-staff-rest',
      feedback: {
        correct: 'Oikein. Hyväksyntä suojaa sekä toiminnan henkilöstömäärää että työntekijöiden lepoaikaa.',
        incorrect: 'Etsi toisesta kappaleesta kaksi ehtoa, jotka esihenkilö tarkistaa.',
      },
    },
    {
      id: 'pro-q-order',
      type: 'sequencing',
      prompt: 'Laita tavallisen vaihtopyynnön vaiheet oikeaan järjestykseen.',
      items: [
        { id: 'pro-order-approve', label: 'Esihenkilö tarkistaa ehdot ja hyväksyy.' },
        { id: 'pro-order-request', label: 'Pyytäjä kirjaa vaihdon tiedot järjestelmään.' },
        { id: 'pro-order-confirm', label: 'Kollega vahvistaa osallistumisensa.' },
      ],
      correctOrder: ['pro-order-request', 'pro-order-confirm', 'pro-order-approve'],
      feedback: {
        correct: 'Oikein. Pyyntö, kollegan vahvistus ja esihenkilön hyväksyntä muodostavat ketjun.',
        incorrect: 'Seuraa tekstin toimijoita: kuka aloittaa, kuka vahvistaa ja kuka tekee lopullisen päätöksen?',
      },
    },
    {
      id: 'pro-q-inference',
      type: 'inference',
      prompt: 'Kollega suostuu vaihtoon pikaviestillä, mutta järjestelmässä ei ole hyväksyntää. Kenen pitää tulla alkuperäiseen vuoroon?',
      options: [
        { id: 'pro-q-inference-original', label: 'Sen työntekijän, jolle alkuperäinen vuoro kuuluu' },
        { id: 'pro-q-inference-colleague', label: 'Pikaviestissä suostuneen kollegan' },
        { id: 'pro-q-inference-supervisor', label: 'Päivystävän esihenkilön' },
      ],
      correctOptionId: 'pro-q-inference-original',
      feedback: {
        correct: 'Oikein. Vastuu siirtyy vasta, kun vaihto on hyväksytty järjestelmässä.',
        incorrect: 'Erota kollegan epävirallinen suostumus ja esihenkilön järjestelmässä antama hyväksyntä.',
      },
    },
    {
      id: 'pro-q-exception',
      type: 'detail',
      prompt: 'Miten työntekijä toimii, jos hän sairastuu äkillisesti?',
      options: [
        { id: 'pro-q-exception-call', label: 'Hän soittaa heti päivystävälle esihenkilölle.' },
        { id: 'pro-q-exception-swap', label: 'Hän aloittaa tavallisen vaihtopyynnön ja odottaa kollegan vahvistusta.' },
        { id: 'pro-q-exception-chat', label: 'Hän ilmoittaa asiasta vain työryhmän pikaviestikanavalla.' },
      ],
      correctOptionId: 'pro-q-exception-call',
      feedback: {
        correct: 'Oikein. Äkillinen sairastuminen on ohjeessa erikseen rajattu poikkeus.',
        incorrect: 'Viimeistä edeltävä kappale kertoo, mitä tavallisen vaihtoprosessin sijasta tehdään.',
      },
    },
  ],
  tags: ['työvuorot', 'toimintaohje', 'työelämä'],
  provenance: ORIGINAL_PROVENANCE,
};

export const READING_TASKS: readonly ReadingTask[] = [
  EVERYDAY_A1,
  EVERYDAY_A2,
  EVERYDAY_B1,
  EVERYDAY_B2,
  PROFESSIONAL_B2,
];

export function getReadingTasks(scope: ReadingScope): ReadingTask[] {
  return READING_TASKS.filter((task) => task.pathway === scope);
}

export function findReadingTaskById(taskId: string): ReadingTask | undefined {
  return READING_TASKS.find((task) => task.taskId === taskId);
}

export type ReadingTaskResolution =
  | { status: 'ready'; task: ReadingTask }
  | { status: 'not_found' }
  | { status: 'invalid_level' }
  | { status: 'empty' };

export function resolveReadingTask(args: {
  scope: ReadingScope;
  taskId?: string;
  level?: string;
}): ReadingTaskResolution {
  const scoped = getReadingTasks(args.scope);
  if (args.taskId) {
    const task = scoped.find((candidate) => candidate.taskId === args.taskId);
    return task ? { status: 'ready', task } : { status: 'not_found' };
  }

  if (args.level) {
    if (!isReadingLevel(args.level)) return { status: 'invalid_level' };
    const task = scoped.find((candidate) => candidate.level === args.level);
    return task ? { status: 'ready', task } : { status: 'empty' };
  }

  const task = scoped[0];
  return task ? { status: 'ready', task } : { status: 'empty' };
}

export function isReadingLevel(value: string): value is ReadingLevel {
  return value === 'A1' || value === 'A2' || value === 'B1' || value === 'B2';
}
