export type HealthcareProfession = 'nurse' | 'doctor' | 'practical_nurse';

export type HealthcareReportType =
  | 'during_shift'
  | 'shift_handover'
  | 'interim_assessment'
  | 'final_assessment'
  | 'discharge'
  | 'ed_to_ward_transfer'
  | 'condition_change';

export type HealthcareReportScenario = {
  id: string;
  reportType: HealthcareReportType;
  profession: HealthcareProfession;
  title: string;
  workplaceContext: string;
  taskInstruction: string;
  keyFacts: string[];
  checklist: string[];
  usefulPhrases: string[];
  modelAnswer: string;
  commonMistakes: string[];
};

export const HEALTHCARE_REPORT_TYPES: Array<{
  id: HealthcareReportType;
  title: string;
  subtitle: string;
}> = [
  {
    id: 'during_shift',
    title: 'Vuoron aikainen kirjaaminen',
    subtitle: 'Kirjaa olennaiset havainnot ja toimenpiteet jo vuoron aikana.',
  },
  {
    id: 'shift_handover',
    title: 'Vuoronvaihtoraportti',
    subtitle: 'Anna seuraavalle työntekijälle tiivis ja turvallinen tilannekuva.',
  },
  {
    id: 'interim_assessment',
    title: 'Väliarviointi',
    subtitle: 'Kuvaa voinnin kehitys, vaste hoitoon ja jatkoseuranta.',
  },
  {
    id: 'final_assessment',
    title: 'Loppuarviointi',
    subtitle: 'Tiivistä hoitojakson keskeiset tapahtumat ja lopputilanne.',
  },
  {
    id: 'discharge',
    title: 'Kotiutus / kotiutuminen',
    subtitle: 'Kirjaa kotiutukseen liittyvät ohjeet, vointi ja jatkosuunnitelma.',
  },
  {
    id: 'ed_to_ward_transfer',
    title: 'Päivystyksestä osastolle siirto',
    subtitle: 'Raportoi siirron syy, tehdyt toimenpiteet ja seurannan tarve.',
  },
  {
    id: 'condition_change',
    title: 'Voinnin muutos',
    subtitle: 'Kerro selkeästi mikä muuttui, milloin ja mitä tehtiin.',
  },
];

export const HEALTHCARE_REPORT_SCENARIOS: HealthcareReportScenario[] = [
  {
    id: 'nurse_ed_to_ward_tachycardia',
    profession: 'nurse',
    reportType: 'ed_to_ward_transfer',
    title: 'Potilas siirtyy päivystyksestä osastolle takykardian vuoksi',
    workplaceContext:
      'Olet sairaanhoitaja vastaanottavalla osastolla. Potilas on siirtynyt aamulla päivystyksestä jatkohoitoon. Sinun pitää kirjoittaa selkeä kirjaus ja valmistautua antamaan raportti seuraavalle vuorolle.',
    taskInstruction:
      'Kirjoita lyhyt ammatillinen kirjaus suomeksi. Kerro siirron syy, mitä päivystyksessä tapahtui, tämänhetkinen vointi ja mitä pitää seurata.',
    keyFacts: [
      'Potilas siirrettiin aamulla päivystyksestä osastolle.',
      'Siirron syy oli takykardia.',
      'Potilasta elvytettiin päivystyksessä.',
      'Stabiloinnin jälkeen potilas siirrettiin jatkohoitoon.',
      'Osastolla seurataan sykettä, verenpainetta, hengitystä ja yleisvointia.',
    ],
    checklist: [
      'Kirjoititko miksi potilas siirtyi osastolle?',
      'Mainitsitko mitä päivystyksessä tehtiin?',
      'Kerrottinko nykyinen vointi tai tila?',
      'Kirjoititko mitä seurataan seuraavaksi?',
      'Onko teksti neutraali, selkeä ja aikajärjestyksessä?',
    ],
    usefulPhrases: [
      'Potilas siirrettiin osastolle ... vuoksi.',
      'Päivystyksessä potilasta hoidettiin / elvytettiin.',
      'Stabiloinnin jälkeen potilas siirrettiin jatkohoitoon.',
      'Vointia seurataan säännöllisesti.',
      'Tarvittaessa konsultoidaan lääkäriä.',
    ],
    modelAnswer:
      'Potilas siirrettiin aamulla päivystyksestä osastolle takykardian vuoksi. Potilasta elvytettiin päivystyksessä, ja stabiloinnin jälkeen hänet siirrettiin osastolle jatkohoitoon. Osastolla seurataan sykettä, verenpainetta, hengitystä ja yleisvointia. Tarvittaessa konsultoidaan lääkäriä voinnin muuttuessa.',
    commonMistakes: [
      'Älä kirjoita liian puhekielisesti, esimerkiksi “sirrettiin” → “siirrettiin”.',
      'Älä jätä seurannan tarvetta kokonaan pois.',
      'Älä kirjoita epävarmoja päätelmiä faktoina.',
    ],
  },
  {
    id: 'practical_nurse_during_shift_mobility',
    profession: 'practical_nurse',
    reportType: 'during_shift',
    title: 'Asukkaan liikkuminen ja voinnin seuranta vuoron aikana',
    workplaceContext:
      'Työskentelet lähihoitajana ympärivuorokautisessa palveluasumisessa. Asukas on ollut aamulla tavallista väsyneempi ja liikkunut epävarmasti.',
    taskInstruction:
      'Kirjoita vuoron aikainen kirjaus. Kerro havainto, mitä teit ja mitä seuraavan työntekijän pitää huomioida.',
    keyFacts: [
      'Asukas oli aamutoimien aikana tavallista väsyneempi.',
      'Kävely rollaattorin kanssa oli epävarmaa.',
      'Asukasta ohjattiin rauhallisesti ja varmistettiin turvallinen siirtyminen.',
      'Ruoka maistui kohtalaisesti.',
      'Seuraavassa vuorossa seurataan vireystilaa ja liikkumista.',
    ],
    checklist: [
      'Kirjoititko konkreettisen havainnon?',
      'Mainitsitko turvallisuuteen liittyvän toiminnan?',
      'Kerrottinko miten asukas pärjäsi ruokailussa tai arjessa?',
      'Annoitko seuraavalle vuorolle selkeän seurantaohjeen?',
      'Onko teksti kunnioittava ja neutraali?',
    ],
    usefulPhrases: [
      'Asukas vaikutti aamulla tavallista väsyneemmältä.',
      'Liikkuminen oli epävarmaa rollaattorin kanssa.',
      'Siirtymisissä avustettiin ja varmistettiin turvallisuus.',
      'Ruoka maistui kohtalaisesti.',
      'Seurataan vireystilaa ja liikkumista seuraavan vuoron aikana.',
    ],
    modelAnswer:
      'Asukas vaikutti aamutoimien aikana tavallista väsyneemmältä. Liikkuminen rollaattorin kanssa oli epävarmaa, joten siirtymisissä avustettiin ja varmistettiin turvallinen liikkuminen. Ruoka maistui kohtalaisesti. Seuraavassa vuorossa seurataan vireystilaa, liikkumista ja mahdollista lisäavun tarvetta.',
    commonMistakes: [
      'Älä kirjoita arvottavasti, esimerkiksi “hankala asukas”. Kirjoita havainto.',
      'Älä jätä omaa toimintaa pois: kerro mitä teit.',
      'Älä kirjoita vain vuoron lopussa, jos tieto on tärkeä jo vuoron aikana.',
    ],
  },
  {
    id: 'doctor_interim_assessment_chest_pain',
    profession: 'doctor',
    reportType: 'interim_assessment',
    title: 'Rintakipupotilaan väliarviointi',
    workplaceContext:
      'Olet lääkäri osastolla. Potilas on tullut rintakivun vuoksi seurantaan. Alkuvaiheen tutkimukset on tehty, ja sinun pitää kirjata väliarviointi.',
    taskInstruction:
      'Kirjoita lyhyt väliarviointi. Kerro oiretilanne, tutkimusten tämänhetkinen tulos, suunnitelma ja seurannan tarve.',
    keyFacts: [
      'Potilas tuli seurantaan rintakivun vuoksi.',
      'Tällä hetkellä rintakipu on helpottanut.',
      'Vitaalit ovat vakaat.',
      'Jatketaan seurantaa ja kontrolloidaan tarvittavat kokeet.',
      'Potilasta ohjeistetaan ilmoittamaan heti kivun uusiutuessa.',
    ],
    checklist: [
      'Mainitsitko tulosyyn ja tämänhetkisen oiretilanteen?',
      'Kirjoititko voinnin tai vitaalien nykytilan?',
      'Kerrottinko jatkosuunnitelma?',
      'Onko potilaan ohjeistus mukana?',
      'Onko teksti tiivis ja lääkärin kirjaamistyyliin sopiva?',
    ],
    usefulPhrases: [
      'Potilas on seurannassa ... vuoksi.',
      'Oire on tällä hetkellä helpottanut.',
      'Vitaalit ovat vakaat.',
      'Jatketaan seurantaa ja kontrolloidaan tarvittavat kokeet.',
      'Potilasta ohjeistettu ilmoittamaan oireen uusiutuessa.',
    ],
    modelAnswer:
      'Potilas on seurannassa rintakivun vuoksi. Rintakipu on tällä hetkellä helpottanut ja vitaalit ovat vakaat. Jatketaan osastoseurantaa ja kontrolloidaan tarvittavat kokeet suunnitelman mukaisesti. Potilasta ohjeistettu ilmoittamaan välittömästi, jos kipu uusiutuu tai vointi heikkenee.',
    commonMistakes: [
      'Älä jätä suunnitelmaa epäselväksi.',
      'Älä kirjoita liian pitkästi, jos kyse on väliarvioinnista.',
      'Älä sekoita potilaalle annettavaa ohjetta ja ammattilaisten jatkosuunnitelmaa.',
    ],
  },
];

export function scenariosForProfession(profession: HealthcareProfession): HealthcareReportScenario[] {
  return HEALTHCARE_REPORT_SCENARIOS.filter((scenario) => scenario.profession === profession);
}

export function firstScenarioForProfession(profession: HealthcareProfession): HealthcareReportScenario {
  return scenariosForProfession(profession)[0] ?? HEALTHCARE_REPORT_SCENARIOS[0];
}
