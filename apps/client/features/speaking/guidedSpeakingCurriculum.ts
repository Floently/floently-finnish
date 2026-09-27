import type { GuidedSpeakingLevel, GuidedSpeakingStageId } from './guidedSpeakingStages';

export type GuidedSpeakingLesson = {
  id: GuidedSpeakingStageId;
  version: 1;
  number: number;
  level: GuidedSpeakingLevel;
  unit: number;
  titleFi: string;
  goalFi: string;
  modelFi: string;
  promptFi: string;
  responseFrameFi?: string;
  supportFi: string[];
  retrievalStageIds: GuidedSpeakingStageId[];
  expectedMinWords: number;
  expectedMaxWords: number;
};

type LessonSeed = Omit<GuidedSpeakingLesson, 'id' | 'version' | 'number' | 'level' | 'unit' | 'retrievalStageIds'>;

const LEVEL_PLAN: Array<{ level: GuidedSpeakingLevel; count: number }> = [
  { level: 'A1.1', count: 25 }, { level: 'A1.2', count: 25 },
  { level: 'A2.1', count: 25 }, { level: 'A2.2', count: 25 },
  { level: 'B1.1', count: 25 }, { level: 'B1.2', count: 25 },
  { level: 'B2.1', count: 25 }, { level: 'B2.2', count: 25 },
  { level: 'C1', count: 50 }, { level: 'C2', count: 50 },
];

const A1_SEEDS: LessonSeed[] = [
  ['Tervehdi', 'Tervehdi toista ihmistä.', 'Hei!', 'Sano: Hei!', 'Hei!', ['hei'], 1, 1],
  ['Kerro nimesi', 'Tervehdi ja kerro nimesi.', 'Hei! Minun nimeni on Aino.', 'Tervehdi ja kerro oma nimesi.', 'Hei! Minun nimeni on ____.', ['hei','minun nimeni on'], 4, 8],
  ['Kysy nimi', 'Kysy toisen ihmisen nimeä.', 'Mikä sinun nimesi on?', 'Kysy toisen ihmisen nimeä.', 'Mikä sinun nimesi on?', ['mikä','sinun nimesi'], 4, 6],
  ['Kerro missä asut', 'Kerro missä asut.', 'Asun Helsingissä.', 'Vastaa: Missä asut?', 'Asun ____.', ['asun','Helsingissä','Vantaalla','Espoossa'], 2, 5],
  ['Kysy asuinpaikka', 'Kysy missä toinen asuu.', 'Missä sinä asut?', 'Kysy missä toinen ihminen asuu.', 'Missä sinä asut?', ['missä','asut'], 3, 5],
  ['Kysy kuulumisia', 'Kysy kuulumisia.', 'Mitä kuuluu?', 'Kysy: Mitä kuuluu?', 'Mitä kuuluu?', ['mitä kuuluu'], 2, 3],
  ['Vastaa kuulumisiin', 'Vastaa lyhyesti kuulumisiin.', 'Hyvää, kiitos.', 'Vastaa kysymykseen: Mitä kuuluu?', '____, kiitos.', ['hyvää','ihan hyvää','kiitos'], 2, 5],
  ['Kiitä', 'Kiitä kohteliaasti.', 'Kiitos paljon.', 'Kiitä toista ihmistä.', undefined, ['kiitos','paljon'], 1, 4],
  ['Sano kyllä ja ei', 'Vastaa myöntävästi tai kieltävästi.', 'Kyllä. / Ei.', 'Sano ensin kyllä ja sitten ei.', undefined, ['kyllä','ei'], 2, 4],
  ['Pyydä anteeksi', 'Pyydä anteeksi kohteliaasti.', 'Anteeksi.', 'Sano: Anteeksi.', 'Anteeksi.', ['anteeksi'], 1, 2],
  ['Pyydä apua', 'Kerro että tarvitset apua.', 'Tarvitsen apua.', 'Pyydä apua.', 'Tarvitsen apua.', ['tarvitsen','apua'], 2, 5],
  ['Kysy suomeksi', 'Kysy puhuuko toinen suomea.', 'Puhutko suomea?', 'Kysy puhuuko toinen suomea.', 'Puhutko ____?', ['puhutko','suomea'], 2, 4],
  ['Kerro kielestä', 'Kerro että puhut vähän suomea.', 'Puhun vähän suomea.', 'Kerro että puhut vähän suomea.', 'Puhun vähän ____.', ['puhun','vähän','suomea'], 3, 5],
  ['Pyydä hitaammin', 'Pyydä toista puhumaan hitaammin.', 'Voitko puhua hitaammin?', 'Pyydä puhumaan hitaammin.', 'Voitko puhua ____?', ['voitko','puhua','hitaammin'], 3, 6],
  ['Pyydä toistamaan', 'Pyydä toistamaan asia.', 'Voitko sanoa uudelleen?', 'Pyydä toista sanomaan uudelleen.', 'Voitko sanoa ____?', ['voitko','sanoa','uudelleen'], 3, 6],
  ['Sano mitä haluat', 'Tilaa yksi asia kohteliaasti.', 'Haluaisin kahvin, kiitos.', 'Tilaa kahvi.', 'Haluaisin ____, kiitos.', ['haluaisin','kahvin','kiitos'], 3, 6],
  ['Kysy hintaa', 'Kysy tuotteen hintaa.', 'Paljonko tämä maksaa?', 'Kysy paljonko tämä maksaa.', 'Paljonko tämä maksaa?', ['paljonko','tämä','maksaa'], 3, 5],
  ['Maksa kortilla', 'Kysy voitko maksaa kortilla.', 'Voinko maksaa kortilla?', 'Kysy voitko maksaa kortilla.', 'Voinko maksaa ____?', ['voinko','maksaa','kortilla'], 3, 5],
  ['Kysy missä', 'Kysy missä jokin paikka on.', 'Missä wc on?', 'Kysy missä wc on.', 'Missä ____ on?', ['missä','on'], 3, 5],
  ['Kysy suuntaa', 'Kysy miten pääset asemalle.', 'Miten pääsen asemalle?', 'Kysy miten pääset asemalle.', 'Miten pääsen ____?', ['miten','pääsen','asemalle'], 3, 5],
  ['Kerro aika', 'Kerro yksinkertainen kellonaika.', 'Kello on kaksi.', 'Sano että kello on kaksi.', 'Kello on ____.', ['kello','on','kaksi'], 3, 5],
  ['Ehdota päivää', 'Ehdota päivää tapaamiselle.', 'Sopisiko tiistai?', 'Ehdota tiistaita.', 'Sopisiko ____?', ['sopisiko','tiistai'], 2, 4],
  ['Varaa aika', 'Pyydä aikaa kohteliaasti.', 'Haluaisin varata ajan.', 'Kerro että haluat varata ajan.', 'Haluaisin varata ____.', ['haluaisin','varata','ajan'], 3, 6],
  ['Kerro työstä', 'Kerro lyhyesti mitä teet.', 'Olen opiskelija.', 'Kerro että olet opiskelija.', 'Olen ____.', ['olen','opiskelija'], 2, 5],
  ['Ensimmäinen keskustelu', 'Yhdistä tervehdys, esittely ja kuulumiset.', 'Hei! Minun nimeni on Aino. Mitä kuuluu?', 'Tapaat uuden ihmisen. Tervehdi, kerro nimesi ja kysy kuulumisia.', 'Hei! Minun nimeni on ____. Mitä kuuluu?', ['hei','minun nimeni on','mitä kuuluu'], 7, 14],
].map(([titleFi,goalFi,modelFi,promptFi,responseFrameFi,supportFi,expectedMinWords,expectedMaxWords]) => ({
  titleFi: titleFi as string, goalFi: goalFi as string, modelFi: modelFi as string, promptFi: promptFi as string,
  responseFrameFi: responseFrameFi as string | undefined, supportFi: supportFi as string[],
  expectedMinWords: expectedMinWords as number, expectedMaxWords: expectedMaxWords as number,
}));

const THEMES = [
  ['Arki', 'Kerro yhdestä arjen asiasta.', 'Tänään menen kauppaan.', 'Kerro yhdestä asiasta, jonka teet tänään.'],
  ['Koti', 'Kuvaile kotiasi lyhyesti.', 'Asun pienessä asunnossa lähellä keskustaa.', 'Kerro missä ja millaisessa kodissa asut.'],
  ['Ruoka', 'Kerro mitä haluat syödä.', 'Haluaisin keittoa ja leipää.', 'Kerro mitä haluaisit syödä.'],
  ['Kauppa', 'Pyydä tuotetta ja kysy hintaa.', 'Anteeksi, missä maito on ja paljonko se maksaa?', 'Olet kaupassa. Kysy tuotteen paikkaa ja hintaa.'],
  ['Liikkuminen', 'Kysy reittiä ja varmista suunta.', 'Miten pääsen asemalle? Menenkö tästä suoraan?', 'Kysy tietä asemalle ja varmista suunta.'],
  ['Aika', 'Sovi yksinkertainen tapaamisaika.', 'Sopisiko keskiviikkona kello kolme?', 'Ehdota tapaamiselle päivää ja aikaa.'],
  ['Työ ja opiskelu', 'Kerro työstäsi tai opiskelustasi.', 'Opiskelen tietotekniikkaa ja teen töitä osa-aikaisesti.', 'Kerro lyhyesti mitä opiskelet tai mitä työtä teet.'],
  ['Terveys', 'Kerro yksinkertaisesta oireesta.', 'Minulla on kurkku kipeä ja tarvitsen apua.', 'Kerro yhdestä oireesta ja että tarvitset apua.'],
  ['Palvelu', 'Selitä lyhyesti mitä tarvitset.', 'Tarvitsen uuden ajan ensi viikolle.', 'Kerro palvelutilanteessa mitä tarvitset.'],
  ['Mielipide', 'Kerro mielipiteesi ja yksi syy.', 'Minusta tämä on hyvä vaihtoehto, koska se on helppo.', 'Kerro mielipiteesi ja yksi syy.'],
] as const;

function levelFor(number: number): GuidedSpeakingLevel {
  let cursor = 0;
  for (const item of LEVEL_PLAN) {
    cursor += item.count;
    if (number <= cursor) return item.level;
  }
  return 'C2';
}

function idFor(number: number): GuidedSpeakingStageId {
  return `GS-${String(number).padStart(3, '0')}`;
}

function retrievalFor(number: number): GuidedSpeakingStageId[] {
  const offsets = number < 8 ? [1, 3] : number < 30 ? [2, 7, 12] : [3, 10, 25];
  return [...new Set(offsets.map((offset) => number - offset).filter((n) => n > 0).map(idFor))];
}

function generatedSeed(number: number): LessonSeed {
  const level = levelFor(number);
  const theme = THEMES[(number - 26) % THEMES.length];
  const [themeName, baseGoal, baseModel, basePrompt] = theme;
  const advanced = ['B2.1','B2.2','C1','C2'].includes(level);
  const upper = ['B1.1','B1.2','B2.1','B2.2','C1','C2'].includes(level);
  const goalFi = advanced ? `${baseGoal} Perustele ja reagoi mahdolliseen jatkokysymykseen.` : upper ? `${baseGoal} Lisää yksi perustelu tai tarkennus.` : baseGoal;
  const modelFi = advanced ? `${baseModel} Perustelen valintani ja tarkennan tarvittaessa.` : upper ? `${baseModel} Voin myös kertoa siitä lisää.` : baseModel;
  const promptFi = advanced ? `${basePrompt} Perustele vastaus ja lisää yksi tarkennus.` : upper ? `${basePrompt} Lisää yksi syy tai yksityiskohta.` : basePrompt;
  const baseWords = level.startsWith('A1') ? 5 : level.startsWith('A2') ? 8 : level.startsWith('B1') ? 14 : level.startsWith('B2') ? 22 : level === 'C1' ? 32 : 42;
  return {
    titleFi: `${themeName}: vaihe ${number}`,
    goalFi,
    modelFi,
    promptFi,
    supportFi: level.startsWith('A') ? ['aloita rauhassa', 'käytä tuttua rakennetta'] : [],
    expectedMinWords: baseWords,
    expectedMaxWords: baseWords + (advanced ? 35 : upper ? 22 : 12),
  };
}

export const GUIDED_SPEAKING_CURRICULUM: GuidedSpeakingLesson[] = Array.from({ length: 300 }, (_, index) => {
  const number = index + 1;
  const seed = number <= A1_SEEDS.length ? A1_SEEDS[index] : generatedSeed(number);
  return {
    ...seed,
    id: idFor(number),
    version: 1,
    number,
    level: levelFor(number),
    unit: Math.ceil(number / 5),
    retrievalStageIds: retrievalFor(number),
  };
});

export function guidedSpeakingLesson(number: number): GuidedSpeakingLesson | undefined {
  return GUIDED_SPEAKING_CURRICULUM[number - 1];
}
