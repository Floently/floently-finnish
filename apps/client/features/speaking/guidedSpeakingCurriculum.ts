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

const A12_SEEDS: LessonSeed[] = [
  ['Esittele perheesi','Kerro lyhyesti perheestäsi.','Minulla on yksi veli ja yksi sisko.','Kerro kahdella lauseella perheestäsi.',undefined,['minulla on','veli','sisko'],5,12],
  ['Kerro aamustasi','Kerro mitä teet aamulla.','Herään seitsemältä ja syön aamupalaa.','Kerro mitä teet aamulla.',undefined,['herään','syön','aamulla'],5,12],
  ['Kerro päivästäsi','Kerro päivän tavallisista tekemisistä.','Päivällä opiskelen ja illalla olen kotona.','Kerro mitä teet päivällä ja illalla.',undefined,['päivällä','illalla','olen'],6,14],
  ['Sovi tapaaminen','Ehdota aikaa ja reagoi vastaukseen.','Sopisiko torstaina kello viisi?','Ehdota tapaamisaikaa torstaille.',undefined,['sopisiko','torstaina','kello'],5,12],
  ['Muuta aikaa','Pyydä muuttamaan sovittua aikaa.','Anteeksi, voimmeko tavata myöhemmin?','Pyydä siirtämään tapaaminen myöhemmäksi.',undefined,['anteeksi','voimmeko','myöhemmin'],5,12],
  ['Tilaa lounas','Tilaa ruoka ja juoma.','Haluaisin keiton ja vettä, kiitos.','Tilaa lounas ja juoma kohteliaasti.',undefined,['haluaisin','ja','kiitos'],5,12],
  ['Kysy vaihtoehtoa','Kysy onko jotain muuta saatavilla.','Onko teillä jotain muuta vaihtoehtoa?','Kysy ravintolassa toista vaihtoehtoa.',undefined,['onko teillä','muuta','vaihtoehtoa'],5,12],
  ['Kerro ruokavaliosta','Kerro yksinkertainen ruokarajoite.','En syö lihaa. Onko tämä kasvisruokaa?','Kerro ettet syö lihaa ja kysy sopiiko ruoka.',undefined,['en syö','lihaa','onko tämä'],6,14],
  ['Palauta tuote','Kerro kaupassa yksinkertainen ongelma.','Haluaisin palauttaa tämän. Se on liian pieni.','Pyydä palauttamaan vaate ja kerro miksi.',undefined,['haluaisin palauttaa','liian pieni'],6,14],
  ['Kysy kokoa','Pyydä eri kokoa.','Onko tätä isompaa kokoa?','Kysy onko tuotteesta isompaa kokoa.',undefined,['onko tätä','isompaa','kokoa'],4,10],
  ['Kysy bussista','Varmista meneekö bussi oikeaan paikkaan.','Meneekö tämä bussi keskustaan?','Kysy meneekö bussi keskustaan.',undefined,['meneekö','bussi','keskustaan'],4,10],
  ['Osta lippu','Pyydä matkalippu.','Yksi lippu Tampereelle, kiitos.','Osta yksi lippu Tampereelle.',undefined,['yksi lippu','Tampereelle','kiitos'],4,10],
  ['Kerro myöhästymisestä','Ilmoita että olet myöhässä.','Olen vähän myöhässä. Tulen noin kymmenen minuutin päästä.','Kerro että olet kymmenen minuuttia myöhässä.',undefined,['olen myöhässä','tulen','minuutin päästä'],7,16],
  ['Soita ajanvaraukseen','Kerro miksi soitat.','Hei, soitan ajanvarauksesta. Haluaisin uuden ajan.','Aloita puhelu ja pyydä uutta aikaa.',undefined,['soitan','ajanvarauksesta','uuden ajan'],6,14],
  ['Kerro oireesta','Kerro missä sinulla on kipua.','Minulla on ollut selkä kipeä kaksi päivää.','Kerro että selkäsi on ollut kipeä kaksi päivää.',undefined,['minulla on ollut','selkä','kaksi päivää'],6,14],
  ['Kysy lääkkeestä','Kysy miten lääkettä käytetään.','Kuinka usein tätä lääkettä otetaan?','Kysy kuinka usein lääke otetaan.',undefined,['kuinka usein','lääkettä','otetaan'],5,12],
  ['Kerro työpäivästä','Kerro milloin työpäiväsi alkaa ja loppuu.','Työpäiväni alkaa kahdeksalta ja loppuu neljältä.','Kerro työpäiväsi alkamis- ja loppumisaika.',undefined,['alkaa','loppuu','kahdeksalta'],6,14],
  ['Pyydä työssä apua','Pyydä työkaverilta apua tehtävään.','Voitko auttaa minua tämän tehtävän kanssa?','Pyydä työkaverilta apua.',undefined,['voitko auttaa','minua','tehtävän kanssa'],6,14],
  ['Kysy ohjetta','Pyydä selittämään mitä pitää tehdä.','Voitko näyttää, mitä minun pitää tehdä?','Pyydä työkaveria näyttämään tehtävä.',undefined,['voitko näyttää','minun pitää'],6,14],
  ['Kerro suunnitelmasta','Kerro mitä aiot tehdä viikonloppuna.','Viikonloppuna aion levätä ja tavata ystävän.','Kerro viikonlopun suunnitelmastasi.',undefined,['viikonloppuna','aion','tavata'],6,14],
  ['Kerro eilisestä','Kerro yksi asia jonka teit eilen.','Eilen kävin kaupassa ja tein ruokaa.','Kerro kaksi asiaa, jotka teit eilen.',undefined,['eilen','kävin','tein'],6,14],
  ['Kerro säästä','Kuvaile tämän päivän säätä.','Tänään on kylmä, mutta aurinko paistaa.','Kerro millainen sää tänään on.',undefined,['tänään','kylmä','aurinko paistaa'],6,14],
  ['Kutsu mukaan','Kutsu toinen ihminen tekemään jotain.','Haluatko lähteä kanssani kahville huomenna?','Kutsu ystävä kahville huomenna.',undefined,['haluatko lähteä','kanssani','huomenna'],6,14],
  ['Kieltäydy kohteliaasti','Kieltäydy ja anna lyhyt syy.','Kiitos kutsusta, mutta en pääse huomenna.','Kieltäydy kutsusta kohteliaasti ja kerro miksi.',undefined,['kiitos kutsusta','mutta','en pääse'],6,14],
  ['Arjen keskustelu','Yhdistä sopiminen, tarkennus ja kohtelias reagointi.','Hei! Sopisiko tapaaminen perjantaina? Jos se ei käy, voimme tavata maanantaina.','Sovi tapaaminen. Ehdota aikaa ja anna yksi vaihtoehto.',undefined,['sopisiko','jos','voimme'],10,22],
].map(([titleFi,goalFi,modelFi,promptFi,responseFrameFi,supportFi,expectedMinWords,expectedMaxWords]) => ({
  titleFi: titleFi as string, goalFi: goalFi as string, modelFi: modelFi as string, promptFi: promptFi as string,
  responseFrameFi: responseFrameFi as string | undefined, supportFi: supportFi as string[],
  expectedMinWords: expectedMinWords as number, expectedMaxWords: expectedMaxWords as number,
}));

const A21_SEEDS: LessonSeed[] = [
  ['Kerro tavallisesta viikosta','Kuvaile tavallisen viikon rytmiä.','Arkipäivisin opiskelen, ja viikonloppuna tapaan usein ystäviä.','Kerro mitä teet tavallisesti arkena ja viikonloppuna.',undefined,['arkipäivisin','viikonloppuna','usein'],8,18],
  ['Vertaa kahta päivää','Kerro miten kaksi päivää eroavat toisistaan.','Maanantai on kiireinen, mutta perjantai on yleensä rauhallisempi.','Vertaa maanantaita ja perjantaita.',undefined,['kiireinen','mutta','rauhallisempi'],8,18],
  ['Selitä myöhästyminen','Kerro syy ja mitä tapahtuu seuraavaksi.','Bussi oli myöhässä, joten saavun noin vartin myöhemmin.','Ilmoita myöhästymisestä, kerro syy ja arvioi saapumisaika.',undefined,['oli myöhässä','joten','saavun'],9,20],
  ['Vaihda varausta','Pyydä muuttamaan varausta ja ehdota uutta aikaa.','Minulla on aika keskiviikkona, mutta haluaisin siirtää sen perjantaille.','Pyydä siirtämään keskiviikon aika perjantaille.',undefined,['minulla on aika','haluaisin siirtää','perjantaille'],9,20],
  ['Selvitä vaihtoehdot','Kysy mitä vaihtoehtoja tilanteessa on.','Tämä aika ei sovi minulle. Onko ensi viikolla muita vapaita aikoja?','Kerro ettei aika sovi ja kysy vaihtoehtoja.',undefined,['ei sovi','onko','muita vapaita aikoja'],9,20],
  ['Kuvaile asuntoa','Kuvaile asuntoa useammalla yksityiskohdalla.','Asun kaksiossa. Asunto on valoisa, ja parvekkeelta näkyy puisto.','Kuvaile kotiasi vähintään kolmella tiedolla.',undefined,['asun','asunto on','näkyy'],10,22],
  ['Kerro asumisen ongelmasta','Selitä kodin ongelma ja pyydä toimintaa.','Keittiön hana vuotaa. Voisiko joku tulla katsomaan sitä tällä viikolla?','Ilmoita vuotavasta hanasta ja pyydä apua.',undefined,['hana vuotaa','voisiko joku','tulla katsomaan'],10,22],
  ['Sovi huoltokäynti','Sovi kotiin tehtävä käynti.','Torstai sopii, mutta olen kotona vasta kello neljän jälkeen.','Sovi huoltokäynti ja kerro milloin olet kotona.',undefined,['sopii','olen kotona','jälkeen'],10,22],
  ['Kerro ostosongelmasta','Selitä tuotteen ongelma ja toiveesi.','Ostin tämän eilen, mutta se ei toimi. Haluaisin vaihtaa sen uuteen.','Kerro viallisesta tuotteesta ja pyydä vaihtoa.',undefined,['ostin','ei toimi','haluaisin vaihtaa'],10,22],
  ['Vertaa tuotteita','Vertaa kahta vaihtoehtoa ja tee valinta.','Tämä on halvempi, mutta toinen vaikuttaa kestävämmältä. Valitsen toisen.','Vertaa kahta tuotetta ja kerro kumman valitset.',undefined,['halvempi','mutta','kestävämpi','valitsen'],10,24],
  ['Pyydä suositusta','Kerro tarpeesi ja pyydä ehdotusta.','Tarvitsen kengät talveksi. Mitä suosittelette, jos kävelen paljon?','Kerro mitä tarvitset ja pyydä suositusta.',undefined,['tarvitsen','mitä suosittelette','jos'],10,24],
  ['Kerro matkasta','Kuvaile tulevaa matkaa.','Lähden ensi kuussa Turkuun kahdeksi päiväksi ja aion matkustaa junalla.','Kerro minne matkustat, milloin ja kuinka pitkäksi aikaa.',undefined,['lähden','ensi kuussa','kahdeksi päiväksi'],10,24],
  ['Ratkaise matkustusongelma','Selitä ongelma ja kysy ratkaisu.','Junani peruttiin. Miten pääsen Tampereelle tänä iltana?','Kerro perutusta junasta ja kysy vaihtoehtoista reittiä.',undefined,['peruttiin','miten pääsen','tänä iltana'],10,24],
  ['Kysy vaihtoyhteydestä','Kysy tarkennuksia matkareitistä.','Missä vaihdan junaa, ja kuinka paljon vaihtoaikaa minulla on?','Kysy missä vaihdat ja paljonko aikaa vaihtoon on.',undefined,['missä vaihdan','kuinka paljon','vaihtoaikaa'],10,24],
  ['Kerro terveydestä tarkemmin','Kuvaile oiretta, kestoa ja vaikutusta.','Minulla on ollut päänsärkyä kolme päivää, ja se vaikeuttaa nukkumista.','Kerro oire, kuinka kauan se on kestänyt ja miten se vaikuttaa sinuun.',undefined,['on ollut','kolme päivää','vaikeuttaa'],11,25],
  ['Vastaa hoitokysymykseen','Kerro mitä olet jo tehnyt oireelle.','Olen levännyt ja ottanut särkylääkettä, mutta olo ei ole parantunut.','Kerro mitä olet kokeillut ja onko se auttanut.',undefined,['olen levännyt','ottanut','mutta'],11,25],
  ['Pyydä tarkennusta lääkkeeseen','Varmista lääkkeen käyttöohje.','Ymmärsinkö oikein, että otan tämän kaksi kertaa päivässä ruoan kanssa?','Toista lääkkeen käyttöohje omin sanoin ja varmista se.',undefined,['ymmärsinkö oikein','kaksi kertaa päivässä','ruoan kanssa'],11,25],
  ['Kuvaile työtehtävää','Selitä mitä teet työssä tai opinnoissa.','Työssäni päivitän verkkosisältöä ja autan tiimiä teknisissä tehtävissä.','Kuvaile kaksi tavallista työ- tai opiskelutehtävääsi.',undefined,['työssäni','päivitän','autan'],11,25],
  ['Kerro työongelmasta','Selitä ongelma ja pyydä yhteistyötä.','En pääse tähän järjestelmään. Voisitko tarkistaa, onko käyttöoikeuteni kunnossa?','Kerro työssä ilmenevästä käyttöongelmasta ja pyydä apua.',undefined,['en pääse','voisitko tarkistaa','käyttöoikeus'],11,25],
  ['Sovi työnjaosta','Ehdota miten tehtävät jaetaan.','Voin tehdä ensimmäisen osan tänään, jos sinä hoidat loput huomenna.','Ehdota yksinkertaista työnjakoa.',undefined,['voin tehdä','jos sinä','huomenna'],11,25],
  ['Kerro kokemuksesta','Kuvaile mennyt tapahtuma ja oma reaktiosi.','Viime viikonloppuna kävin konsertissa. Musiikki oli hyvä, mutta paikka oli liian täynnä.','Kerro viime viikonlopun tapahtumasta ja mielipiteesi siitä.',undefined,['viime viikonloppuna','oli','mutta'],12,28],
  ['Selitä valinta','Kerro mitä valitsit ja miksi.','Valitsin junan auton sijaan, koska halusin matkustaa rauhassa.','Kerro yksi tekemäsi valinta ja perustele se.',undefined,['valitsin','sijaan','koska'],12,28],
  ['Anna yksinkertainen neuvo','Reagoi ongelmaan ja ehdota ratkaisua.','Jos olet väsynyt, kannattaa ehkä levätä tänään ja jatkaa huomenna.','Ystävä on väsynyt. Anna hänelle neuvo.',undefined,['jos','kannattaa','ehkä'],12,28],
  ['Kerro suunnitelman muutoksesta','Selitä mikä muuttui ja mitä teet nyt.','Aioin lähteä ulos, mutta alkoi sataa, joten päätin jäädä kotiin.','Kerro suunnitelmasta, joka muuttui, ja miksi.',undefined,['aioin','mutta','joten päätin'],12,28],
  ['Itsenäinen arkitilanne','Yhdistä ongelman kuvaus, perustelu ja ratkaisuehdotus.','Minulla oli aika tänään, mutta bussini peruttiin enkä ehdi ajoissa. Voisimmeko siirtää ajan huomiselle?','Olet myöhästymässä tärkeästä tapaamisesta. Selitä tilanne ja ehdota ratkaisua.',undefined,['mutta','en ehdi','voisimmeko'],14,32],
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
  const seed = number <= A1_SEEDS.length ? A1_SEEDS[index] : number <= 50 ? A12_SEEDS[number - 26] : number <= 75 ? A21_SEEDS[number - 51] : generatedSeed(number);
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
