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
    id: 'nurse_shift_handover_post_op_pain',
    profession: 'nurse',
    reportType: 'shift_handover',
    title: 'Vuoronvaihtoraportti leikkauksen jälkeisestä kivusta',
    workplaceContext:
      'Olet sairaanhoitaja kirurgisella osastolla. Potilas on palannut leikkauksesta ja kipua on seurattu iltavuoron aikana. Sinun pitää kirjoittaa vuoronvaihtoraportti yövuorolle.',
    taskInstruction:
      'Kirjoita lyhyt vuoronvaihtoraportti. Kerro potilaan tämänhetkinen vointi, kiputilanne, annettu lääkitys ja mitä yövuoron pitää seurata.',
    keyFacts: [
      'Potilas palasi osastolle leikkauksen jälkeen iltapäivällä.',
      'Kipu oli aluksi 7/10, lääkityksen jälkeen 3/10.',
      'Haavasidos on siisti ja kuiva.',
      'Potilas on käynyt avustettuna wc:ssä.',
      'Yövuorossa seurataan kipua, haavaa, virtsaamista ja yleisvointia.',
    ],
    checklist: [
      'Kerrottinko miksi raportti annetaan seuraavalle vuorolle?',
      'Mainitsitko kiputilanteen ja lääkityksen vaikutuksen?',
      'Kirjoititko haavan tai muun olennaisen havainnon?',
      'Annoitko yövuorolle selkeät seuranta-asiat?',
      'Onko teksti lyhyt, neutraali ja hyödyllinen seuraavalle työntekijälle?',
    ],
    usefulPhrases: [
      'Vuoron aikana kipu oli aluksi ...',
      'Lääkityksen jälkeen kipu helpottui.',
      'Haavasidos on siisti ja kuiva.',
      'Potilas liikkui avustettuna.',
      'Yövuorossa seurataan kipua, haavaa ja yleisvointia.',
    ],
    modelAnswer:
      'Potilas palasi osastolle leikkauksen jälkeen iltapäivällä. Kipu oli aluksi 7/10, mutta lääkityksen jälkeen kipu helpottui tasolle 3/10. Haavasidos on siisti ja kuiva. Potilas on käynyt avustettuna wc:ssä. Yövuorossa seurataan kipua, haavaa, virtsaamista ja yleisvointia.',
    commonMistakes: [
      'Älä kirjoita vain “kaikki ok”, vaan kerro mikä on seurattu ja mitä pitää seurata seuraavaksi.',
      'Älä jätä lääkityksen vaikutusta pois, jos kipu on keskeinen asia.',
      'Pidä raportti hyödyllisenä seuraavalle vuorolle: nykytilanne + riskit + seuranta.',
    ],
  },
  {
    id: 'practical_nurse_shift_handover_evening_care',
    profession: 'practical_nurse',
    reportType: 'shift_handover',
    title: 'Vuoronvaihtoraportti iltavuoron hoivasta',
    workplaceContext:
      'Työskentelet lähihoitajana palveluasumisessa. Asukkaalla on ollut iltavuorossa väsymystä ja liikkuminen on ollut tavallista hitaampaa.',
    taskInstruction:
      'Kirjoita raportti seuraavalle vuorolle. Kerro arjen havainnot, avun tarve, ruokailu ja mitä pitää seurata.',
    keyFacts: [
      'Asukas oli iltavuorossa tavallista väsyneempi.',
      'Liikkuminen rollaattorin kanssa oli hitaampaa kuin yleensä.',
      'Iltapala maistui huonosti.',
      'Lääkkeet otettu ohjatusti.',
      'Yövuorossa seurataan vireystilaa, liikkumista ja mahdollista avuntarvetta.',
    ],
    checklist: [
      'Kerrottinko konkreettinen muutos arjessa?',
      'Mainitsitko liikkumisen ja turvallisuuden?',
      'Kirjoititko ruokailusta tai lääkkeistä, jos ne ovat olennaisia?',
      'Annoitko seuraavalle vuorolle seurantaohjeen?',
      'Onko teksti kunnioittava ja havaintoihin perustuva?',
    ],
    usefulPhrases: [
      'Asukas oli tavallista väsyneempi.',
      'Liikkuminen oli hitaampaa kuin yleensä.',
      'Lääkkeet otettu ohjatusti.',
      'Seurataan vointia ja avuntarvetta.',
      'Tarvittaessa avustetaan siirtymisissä.',
    ],
    modelAnswer:
      'Asukas oli iltavuorossa tavallista väsyneempi. Liikkuminen rollaattorin kanssa oli hitaampaa kuin yleensä, ja siirtymisissä tarvittiin rauhallista ohjausta. Iltapala maistui huonosti. Lääkkeet otettu ohjatusti. Yövuorossa seurataan vireystilaa, liikkumista ja mahdollista lisäavun tarvetta.',
    commonMistakes: [
      'Älä kirjoita arvottavia kuvauksia, vaan konkreettisia havaintoja.',
      'Älä jätä seuraavan vuoron tehtävää epäselväksi.',
      'Kirjaa tieto ajoissa, jos muutos vaikuttaa turvallisuuteen.',
    ],
  },
  {
    id: 'doctor_shift_handover_observation_plan',
    profession: 'doctor',
    reportType: 'shift_handover',
    title: 'Lääkärin vuoronvaihtoraportti seurannassa olevasta potilaasta',
    workplaceContext:
      'Olet lääkäri osastolla ja annat raporttia päivystävälle lääkärille potilaasta, joka on seurannassa voinnin muutoksen vuoksi.',
    taskInstruction:
      'Kirjoita tiivis lääkärin vuoronvaihtoraportti. Kerro tulosyy, nykytila, suunnitelma ja milloin pitää reagoida.',
    keyFacts: [
      'Potilas on seurannassa voinnin muutoksen vuoksi.',
      'Vitaalit ovat tällä hetkellä vakaat.',
      'Laboratoriokokeiden vastauksia odotetaan.',
      'Jatketaan seurantaa osastolla.',
      'Päivystävää lääkäriä konsultoidaan, jos vointi heikkenee tai vitaalit muuttuvat.',
    ],
    checklist: [
      'Mainitsitko miksi potilas on seurannassa?',
      'Kerrottinko nykytila lyhyesti?',
      'Kirjoititko jatkosuunnitelman?',
      'Mainitsitko milloin pitää konsultoida tai reagoida?',
      'Onko raportti riittävän tiivis päivystävälle lääkärille?',
    ],
    usefulPhrases: [
      'Potilas on seurannassa ... vuoksi.',
      'Vitaalit ovat tällä hetkellä vakaat.',
      'Laboratoriovastauksia odotetaan.',
      'Jatketaan osastoseurantaa.',
      'Konsultoidaan päivystävää lääkäriä, jos vointi heikkenee.',
    ],
    modelAnswer:
      'Potilas on seurannassa voinnin muutoksen vuoksi. Vitaalit ovat tällä hetkellä vakaat ja laboratoriovastauksia odotetaan. Jatketaan osastoseurantaa. Päivystävää lääkäriä konsultoidaan, jos vointi heikkenee, kipu lisääntyy tai vitaaleissa ilmenee muutoksia.',
    commonMistakes: [
      'Älä jätä reagointirajaa epäselväksi.',
      'Älä kirjoita liian pitkästi vuoronvaihtoraporttiin.',
      'Erota nykytila, suunnitelma ja konsultointitarve selkeästi.',
    ],
  },
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
