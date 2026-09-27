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

const A22_SEEDS: LessonSeed[] = [
  ['Kerro muutoksesta elämässä','Kuvaile viimeaikaista muutosta ja sen vaikutusta.','Aloitin uuden kurssin viime kuussa. Aluksi se oli vaikea, mutta nyt rytmi tuntuu hyvältä.','Kerro yhdestä viimeaikaisesta muutoksesta elämässäsi ja miten se vaikutti sinuun.',undefined,['aloitin','aluksi','mutta nyt'],14,32],
  ['Selitä tavoite','Kerro tavoitteesi ja miten aiot saavuttaa sen.','Haluan parantaa suomeani, joten harjoittelen puhumista joka päivä ja kuuntelen uutisia.','Kerro yksi tavoitteesi ja kaksi asiaa, joita teet sen saavuttamiseksi.',undefined,['haluan','joten','harjoittelen'],14,32],
  ['Kerro oppimisesta','Kuvaile mikä auttaa sinua oppimaan.','Opin parhaiten, kun käytän uutta asiaa heti käytännössä ja palaan siihen myöhemmin.','Kerro mikä auttaa sinua oppimaan uuden asian.',undefined,['opin parhaiten','kun','myöhemmin'],14,32],
  ['Pyydä palautetta','Pyydä palautetta ja tarkennusta.','Voisitko kertoa, mikä tässä oli hyvää ja mitä minun kannattaisi vielä harjoitella?','Pyydä palautetta tekemästäsi työstä ja kysy mitä voisit parantaa.',undefined,['voisitko kertoa','mitä','kannattaisi'],14,32],
  ['Reagoi palautteeseen','Vastaa palautteeseen rakentavasti.','Kiitos palautteesta. Ymmärrän asian ja yritän kiinnittää siihen enemmän huomiota ensi kerralla.','Saat korjaavaa palautetta. Kiitä, osoita ymmärtäneesi ja kerro mitä teet seuraavaksi.',undefined,['kiitos palautteesta','ymmärrän','ensi kerralla'],15,34],
  ['Selitä palveluongelma','Kuvaile palvelussa tapahtunut ongelma selkeästi.','Tilasin tuotteen viikko sitten, mutta sitä ei ole vielä toimitettu eikä seurannassa näy muutosta.','Selitä asiakaspalvelulle toimitusongelma ja kerro mitä tietoa sinulla on.',undefined,['tilasin','ei ole vielä','seurannassa'],15,34],
  ['Pyydä ratkaisua palvelussa','Kerro toivomasi ratkaisu kohteliaasti.','Jos toimitus ei onnistu tällä viikolla, haluaisin perua tilauksen ja saada rahat takaisin.','Kerro asiakaspalvelulle millaisen ratkaisun haluat ja millä ehdolla.',undefined,['jos','haluaisin','rahat takaisin'],15,34],
  ['Tee reklamaatio','Yhdistä tapahtuma, ongelma ja ratkaisu.','Ostin laitteen kolme päivää sitten. Se sammuu jatkuvasti, joten haluaisin vaihtaa sen toimivaan tuotteeseen.','Tee lyhyt suullinen reklamaatio viallisesta laitteesta.',undefined,['ostin','sammuu','joten haluaisin'],16,36],
  ['Kuvaile naapurustoa','Kerro alueen hyvistä ja huonoista puolista.','Alue on rauhallinen ja palvelut ovat lähellä, mutta iltaisin bussit kulkevat harvoin.','Kuvaile asuinaluettasi ja mainitse yksi hyvä ja yksi huono puoli.',undefined,['rauhallinen','mutta','harvoin'],15,34],
  ['Keskustele asumistoiveesta','Kerro millaista asuntoa etsit ja miksi.','Etsin kaksioita hyvien yhteyksien varrelta, koska kuljen töihin julkisilla joka päivä.','Kerro millaista asuntoa etsit ja perustele kaksi tärkeää ominaisuutta.',undefined,['etsin','koska','minulle on tärkeää'],16,36],
  ['Ilmoita häiriöstä','Kuvaile asumiseen liittyvä häiriö asiallisesti.','Naapurista kuuluu öisin kovaa musiikkia, ja se on jatkunut useana yönä. Haluaisin kysyä, miten asiassa pitäisi toimia.','Ilmoita toistuvasta meluhäiriöstä ja kysy mitä voit tehdä.',undefined,['öisin','on jatkunut','miten pitäisi toimia'],16,36],
  ['Suunnittele matkaa yhdessä','Ehdota vaihtoehtoa ja huomioi toisen toive.','Voisimme mennä junalla aamulla. Jos haluat lähteä myöhemmin, myös iltapäivällä on hyvä yhteys.','Suunnittele ystävän kanssa matkaa ja tarjoa kaksi vaihtoehtoa.',undefined,['voisimme','jos haluat','myös'],16,36],
  ['Kerro matkakokemuksesta','Kuvaile matkan onnistumista ja yhtä ongelmaa.','Matka onnistui muuten hyvin, mutta paluujuna oli niin täynnä, ettemme saaneet istumapaikkoja.','Kerro matkasta: mikä onnistui ja mikä ei.',undefined,['muuten hyvin','mutta','emme saaneet'],16,36],
  ['Selvitä väärinkäsitys','Kerro mitä ymmärsit ja pyydä vahvistus.','Luulin, että tapaaminen alkaa kahdelta. Ymmärsinkö viestin väärin vai muuttuiko aika?','Olet eri aikaan paikalla kuin muut. Selvitä kohteliaasti mitä tapahtui.',undefined,['luulin että','ymmärsinkö','vai'],16,36],
  ['Korjaa oma virhe','Myönnä virhe ja ehdota korjausta.','Huomasin, että lähetin sinulle vanhan tiedoston. Pahoittelen virhettä. Lähetän oikean version heti.','Kerro tekemästäsi pienestä virheestä, pyydä anteeksi ja korjaa tilanne.',undefined,['huomasin että','pahoittelen','heti'],16,36],
  ['Kerro työtilanteen etenemisestä','Anna lyhyt tilannepäivitys.','Ensimmäinen osa on valmis, mutta tarvitsen vielä yhden tiedon ennen kuin voin viimeistellä työn.','Anna työstä tilannepäivitys: mikä on valmis ja mikä vielä puuttuu.',undefined,['on valmis','tarvitsen vielä','ennen kuin'],16,36],
  ['Pyydä lisäaikaa','Perustele miksi tarvitset lisää aikaa.','Tarvitsisin yhden lisäpäivän, koska odotan vielä asiakkaan vastausta enkä halua tehdä oletuksia.','Pyydä tehtävälle yksi lisäpäivä ja perustele pyyntö.',undefined,['tarvitsisin','koska','en halua'],16,36],
  ['Ehdota parannusta','Tee rakentava ehdotus arjen tai työn käytäntöön.','Voisimme sopia tehtävät jo viikon alussa, jotta kaikille olisi selvää, kuka tekee mitä.','Ehdota yhtä parannusta tiimin tai ryhmän työskentelyyn ja kerro hyöty.',undefined,['voisimme','jotta','olisi selvää'],17,38],
  ['Kysy toisen näkemystä','Esitä oma ajatus ja pyydä mielipidettä.','Minusta tämä vaihtoehto on selkeämpi, mutta haluaisin kuulla, mitä sinä ajattelet.','Kerro oma näkemyksesi ja pyydä toisen mielipidettä.',undefined,['minusta','mutta','mitä sinä ajattelet'],16,36],
  ['Ole eri mieltä kohteliaasti','Ilmaise eriävä mielipide ja perustele.','Ymmärrän ajatuksesi, mutta näen asian hieman eri tavalla, koska tämä ratkaisu vie enemmän aikaa.','Ole kohteliaasti eri mieltä ja anna yksi syy.',undefined,['ymmärrän','mutta','koska'],17,38],
  ['Tee kompromissiehdotus','Yhdistä kaksi erilaista toivetta ratkaisuksi.','Voisimme aloittaa sinun ehdotuksellasi ja tarkistaa viikon päästä, tarvitseeko suunnitelmaa muuttaa.','Kaksi ihmistä haluaa eri ratkaisut. Ehdota kompromissia.',undefined,['voisimme','ja','tarvitseeko'],17,38],
  ['Kerro uutisesta tai tapahtumasta','Tiivistä kuulemasi asia omin sanoin.','Kuulin, että alueelle avataan uusi kirjasto ensi vuonna. Se voisi helpottaa opiskelua, koska nykyinen kirjasto on kaukana.','Kerro lyhyesti jostakin kuulemastasi paikallisesta uutisesta tai muutoksesta ja sen mahdollisesta vaikutuksesta.',undefined,['kuulin että','voisi','koska'],18,40],
  ['Vertaa ennen ja nyt','Kuvaile miten jokin asia on muuttunut.','Kun muutin tänne, en tuntenut aluetta hyvin. Nyt osaan liikkua helposti ja tiedän, mistä saan apua.','Vertaa jotakin asiaa elämässäsi ennen ja nyt.',undefined,['kun','nyt','osaan'],18,40],
  ['Perustele päätös','Kuvaile vaihtoehdot ja perustele tekemäsi päätös.','Harkitsin kahta kurssia. Valitsin tämän, koska aikataulu sopii paremmin ja sisältö tukee tavoitteitani.','Kerro päätöksestä, jossa vertailit vähintään kahta vaihtoehtoa.',undefined,['harkitsin','valitsin','koska'],18,40],
  ['Itsenäinen ongelmanratkaisu','Selitä monivaiheinen arkitilanne ja neuvottele ratkaisu.','Tilaukseni piti saapua maanantaina, mutta sitä ei näy seurannassa. Tarvitsen tuotteen perjantaihin mennessä. Jos toimitus ei ehdi, haluaisin noutaa vastaavan tuotteen myymälästä.','Ota yhteyttä asiakaspalveluun: selitä toimitusongelma, määräaika ja ehdota vaihtoehtoista ratkaisua.',undefined,['piti saapua','tarvitsen','jos','haluaisin'],20,45],
].map(([titleFi,goalFi,modelFi,promptFi,responseFrameFi,supportFi,expectedMinWords,expectedMaxWords]) => ({
  titleFi: titleFi as string, goalFi: goalFi as string, modelFi: modelFi as string, promptFi: promptFi as string,
  responseFrameFi: responseFrameFi as string | undefined, supportFi: supportFi as string[],
  expectedMinWords: expectedMinWords as number, expectedMaxWords: expectedMaxWords as number,
}));

const B11_SEEDS: LessonSeed[] = [
  ['Kerro kokemuksesta johdonmukaisesti','Kerro tapahtuma selkeässä aikajärjestyksessä.','Viime viikolla osallistuin koulutukseen. Ensin tutustuimme aiheeseen, sitten teimme harjoituksen ja lopuksi keskustelimme siitä, mitä olimme oppineet.','Kerro yhdestä viimeaikaisesta kokemuksesta niin, että kuulija ymmärtää tapahtumien järjestyksen.',undefined,['ensin','sitten','lopuksi'],20,45],
  ['Kuvaile yllättävä tilanne','Kerro mitä odotit, mitä tapahtui ja miten reagoit.','Luulin, että kokous olisi tavallinen, mutta paikan päällä selvisi, että minun piti esitellä työni koko ryhmälle. Olin aluksi hermostunut, mutta esitys meni hyvin.','Kerro tilanteesta, joka ei mennyt niin kuin odotit.',undefined,['luulin että','mutta','aluksi'],20,45],
  ['Selitä syy ja seuraus','Yhdistä tapahtuman syyt ja seuraukset.','Nukuin huonosti, minkä vuoksi keskittyminen oli aamulla vaikeaa. Päätin pitää lyhyen tauon, ja sen jälkeen työ sujui paremmin.','Kerro tilanteesta, jossa yksi asia johti toiseen.',undefined,['minkä vuoksi','sen jälkeen','johti'],20,45],
  ['Kerro onnistumisesta','Kuvaile onnistuminen ja siihen vaikuttaneet tekijät.','Sain tehtävän valmiiksi ennen määräaikaa, koska suunnittelin työn etukäteen ja pyysin ajoissa apua kohdassa, jota en ymmärtänyt.','Kerro yhdestä onnistumisestasi ja siitä, mikä auttoi sinua onnistumaan.',undefined,['onnistuin','koska','etukäteen'],20,45],
  ['Kerro epäonnistumisesta rakentavasti','Kuvaile mikä meni pieleen ja mitä opit.','Arvioin tehtävään tarvittavan ajan väärin, joten jouduin tekemään viimeisen osan kiireessä. Opin, että minun kannattaa jakaa työ pienempiin vaiheisiin.','Kerro tilanteesta, joka ei onnistunut, ja mitä tekisit ensi kerralla toisin.',undefined,['arvioin väärin','opin että','ensi kerralla'],22,48],
  ['Selitä monimutkaisempi ongelma','Kuvaile ongelman tausta, nykytilanne ja vaikutus.','Järjestelmä toimii normaalisti useimmilla käyttäjillä, mutta minun tunnuksellani yksi toiminto puuttuu. Ongelma alkoi päivityksen jälkeen ja estää minua viimeistelemästä tehtävää.','Selitä työssä tai arjessa ongelma niin, että toinen ymmärtää taustan ja vaikutuksen.',undefined,['useimmilla','päivityksen jälkeen','estää'],22,48],
  ['Rajaa ongelmaa kysymällä','Kysy tarkentavia kysymyksiä ennen ratkaisua.','Tapahtuuko virhe joka kerta vai vain tietyssä tilanteessa? Milloin huomasit sen ensimmäisen kerran?','Toinen kertoo epäselvästä ongelmasta. Esitä kaksi kysymystä, joilla saat tilanteesta tarkemman kuvan.',undefined,['joka kerta','vai','ensimmäisen kerran'],20,44],
  ['Ehdota ratkaisuvaihtoehtoja','Tarjoa kaksi ratkaisua ja arvioi niitä.','Voimme joko korjata nykyisen suunnitelman tai aloittaa kyseisen osan uudelleen. Ensimmäinen vaihtoehto on nopeampi, mutta toinen voi olla varmempi.','Esitä ongelmaan kaksi ratkaisua ja kerro kummankin yksi etu tai haitta.',undefined,['joko','tai','vaihtoehto'],22,50],
  ['Neuvottele aikataulusta','Kerro rajoite ja ehdota realistista aikataulua.','Perjantaihin mennessä ehdin tehdä ensimmäisen version, mutta perusteellinen tarkistus vaatii vielä maanantain. Sopisiko, että lähetän luonnoksen perjantaina ja lopullisen version maanantaina?','Neuvottele tehtävälle aikataulu, kun alkuperäinen määräaika on liian tiukka.',undefined,['ehdin','vaatii','sopisiko että'],22,50],
  ['Priorisoi tehtäviä','Selitä mikä pitää tehdä ensin ja miksi.','Tekisin ensin asiakkaalle lähtevän korjauksen, koska se vaikuttaa tämän päivän toimitukseen. Raportin voimme viimeistellä sen jälkeen.','Sinulla on kaksi kiireellistä tehtävää. Kerro kumpi pitäisi tehdä ensin ja perustele.',undefined,['ensin','koska','sen jälkeen'],22,50],
  ['Anna rakentavaa palautetta','Kerro vahvuus ja yksi konkreettinen kehitysehdotus.','Esityksen rakenne oli selkeä ja esimerkit auttoivat ymmärtämään aiheen. Seuraavalla kerralla tiivistäisin loppuosaa, jotta tärkein viesti erottuu paremmin.','Anna työkaverille palautetta: yksi vahvuus ja yksi kehitysehdotus.',undefined,['oli selkeä','seuraavalla kerralla','jotta'],22,50],
  ['Vastaa eriävään näkemykseen','Osoita kuunnelleesi ja perustele oma kanta.','Ymmärrän, miksi pidät tätä vaihtoehtoa turvallisempana. Minusta toinen ratkaisu olisi kuitenkin käytännöllisempi, koska se voidaan toteuttaa ilman pitkää käyttökatkoa.','Vastaa henkilölle, joka on kanssasi eri mieltä. Tunnista hänen perustelunsa ja kerro oma näkemyksesi.',undefined,['ymmärrän miksi','kuitenkin','koska'],22,50],
  ['Selvennä väärinymmärrys','Korjaa tulkinta syyttämättä toista.','Taisin ilmaista asian epäselvästi. En tarkoittanut, että tehtävä pitäisi lopettaa, vaan että sen aikataulua kannattaa muuttaa.','Korjaa väärinymmärrys kohteliaasti ja kerro mitä tarkoitit.',undefined,['taisin','en tarkoittanut','vaan'],22,50],
  ['Pyydä perustelua','Kysy päätöksen tai mielipiteen taustaa neutraalisti.','Voisitko avata hieman, mihin tämä päätös perustuu? Haluaisin ymmärtää, mitkä asiat vaikuttivat siihen eniten.','Pyydä toista selittämään päätöksensä perusteet ilman että kuulostat hyökkäävältä.',undefined,['voisitko avata','perustuu','haluaisin ymmärtää'],22,50],
  ['Kerro mielipide esimerkillä','Perustele näkemys konkreettisella esimerkillä.','Minusta selkeät kirjalliset ohjeet helpottavat yhteistyötä. Esimerkiksi viime projektissa yhteinen ohje vähensi samoja kysymyksiä huomattavasti.','Kerro mielipiteesi jostakin työ- tai arjen käytännöstä ja tue sitä esimerkillä.',undefined,['minusta','esimerkiksi','vähensi'],22,50],
  ['Vertaa toimintatapoja','Kuvaile kahden tavan eroja ja käyttötarkoitusta.','Kasvokkainen tapaaminen sopii hyvin vaikeisiin keskusteluihin, kun taas lyhyt verkkopalaveri on tehokas silloin, kun asia on selkeä ja rajattu.','Vertaa kahta tapaa hoitaa sama asia ja kerro milloin käyttäisit kumpaakin.',undefined,['kun taas','sopii','silloin kun'],24,52],
  ['Kerro epävarmuudesta','Ilmaise mitä tiedät ja mitä et vielä tiedä.','Tämänhetkisten tietojen perusteella toimitus näyttää valmistuvan ajoissa, mutta en vielä tiedä, vaikuttaako huominen huolto aikatauluun.','Anna tilannepäivitys, jossa osa tiedoista on vielä epävarmoja.',undefined,['tietojen perusteella','mutta','en vielä tiedä'],24,52],
  ['Tee varovainen arvio','Arvioi tilannetta ilman liian varmaa väitettä.','Luultavasti saamme työn valmiiksi tällä viikolla, jos viimeinen tarkistus ei tuo esiin uusia ongelmia.','Tee realistinen arvio jonkin tehtävän valmistumisesta ja kerro mikä voi vaikuttaa siihen.',undefined,['luultavasti','jos','voi vaikuttaa'],24,52],
  ['Kerro suunnitelma ja varasuunnitelma','Kuvaile ensisijainen suunnitelma ja vaihtoehto.','Tarkoitus on pitää tapahtuma ulkona. Jos sää huononee, siirrämme ohjelman sisälle ja ilmoitamme muutoksesta osallistujille aamulla.','Kerro suunnitelmasta ja siitä, mitä teet jos se ei onnistu.',undefined,['tarkoitus on','jos','siirrämme'],24,52],
  ['Tiivistä keskustelu','Kokoa keskustelun tärkeimmät päätökset.','Sovimme siis, että minä teen luonnoksen torstaihin mennessä, sinä tarkistat sen perjantaina ja palaamme avoimiin kysymyksiin maanantaina.','Kuvittele, että tapaaminen päättyy. Tiivistä kolme asiaa, joista sovittiin.',undefined,['sovimme että','mennessä','palaamme'],24,54],
  ['Kerro pidempi tarina','Rakenna alku, käänne ja lopputulos.','Olin matkalla haastatteluun, kun juna pysähtyi kesken matkan. Aluksi ajattelin myöhästyväni varmasti, mutta soitin heti haastattelijalle ja sain ajan siirrettyä. Lopulta ehdin paikalle rauhassa.','Kerro lyhyt tarina tilanteesta, jossa suunnitelma muuttui yllättäen.',undefined,['kun','aluksi','mutta','lopulta'],26,58],
  ['Kuvaile vuorovaikutustilanne','Kerro mitä ihmiset sanoivat tai tekivät ja miten tilanne muuttui.','Asiakas oli aluksi tyytymätön, koska toimitus oli myöhässä. Kun selitin tilanteen ja tarjosin kaksi vaihtoehtoa, keskustelu rauhoittui ja löysimme ratkaisun.','Kerro tilanteesta, jossa keskustelu alkoi vaikeasti mutta päättyi ratkaisuun.',undefined,['aluksi','kun','löysimme ratkaisun'],26,58],
  ['Puolusta ehdotusta asiallisesti','Perustele ehdotus hyödyillä ja huomioi haitta.','Ehdotan, että kokeilemme uutta käytäntöä kuukauden ajan. Se vaatii alussa hieman enemmän työtä, mutta sen avulla näemme käytännössä, vähenevätkö virheet.','Esitä muutosidea ja perustele miksi sitä kannattaisi kokeilla, vaikka siinä on myös haitta.',undefined,['ehdotan että','vaatii','mutta','sen avulla'],26,58],
  ['Ratkaise ristiriitainen tarve','Etsi ratkaisu kahden vaatimuksen välille.','Tarvitsemme tuloksen nopeasti, mutta tarkistusta ei kannata ohittaa. Voisimme julkaista ensin tarkistetun perusversion ja täydentää sitä myöhemmin.','Tilanteessa tarvitaan sekä nopeutta että laatua. Ehdota ratkaisu, joka huomioi molemmat.',undefined,['mutta','ei kannata','voisimme'],26,58],
  ['Itsenäinen B1-keskustelu','Yhdistä tapahtumat, perustelut, epävarmuus ja ratkaisuehdotus.','Projektin ensimmäinen vaihe valmistui suunnitellusti, mutta testauksessa löytyi ongelma, joka voi siirtää seuraavaa vaihetta. Emme vielä tiedä tarkkaa vaikutusta. Ehdotan, että korjaamme kriittisen kohdan ensin ja arvioimme aikataulun uudelleen huomenna.','Anna suullinen tilannepäivitys: kerro mitä tapahtui, mikä on epävarmaa, mitä siitä voi seurata ja mitä ehdotat seuraavaksi.',undefined,['valmistui','mutta','emme vielä tiedä','ehdotan että'],30,65],
].map(([titleFi,goalFi,modelFi,promptFi,responseFrameFi,supportFi,expectedMinWords,expectedMaxWords]) => ({
  titleFi: titleFi as string, goalFi: goalFi as string, modelFi: modelFi as string, promptFi: promptFi as string,
  responseFrameFi: responseFrameFi as string | undefined, supportFi: supportFi as string[],
  expectedMinWords: expectedMinWords as number, expectedMaxWords: expectedMaxWords as number,
}));

const B12_SEEDS: LessonSeed[] = [
  ['Selitä kaksi näkökulmaa','Esittele saman asian kaksi perusteltua näkökulmaa.','Etätyö säästää matkustamiseen kuluvaa aikaa, mutta toimistolla yhteistyö voi olla helpompaa. Siksi paras ratkaisu riippuu tehtävästä ja tiimin tarpeista.','Valitse tuttu aihe ja esittele siitä kaksi erilaista mutta perusteltua näkökulmaa.',undefined,['toisaalta','mutta','riippuu'],28,62],
  ['Punnitse hyötyjä ja haittoja','Arvioi vaihtoehtoa tasapainoisesti.','Uusi järjestelmä automatisoisi osan työstä ja vähentäisi virheitä. Käyttöönotto vaatii kuitenkin koulutusta ja aikaa, joten muutos kannattaa tehdä vaiheittain.','Arvioi yhden muutoksen kaksi hyötyä ja yksi haitta sekä tee johtopäätös.',undefined,['hyöty','kuitenkin','joten'],28,62],
  ['Perustele poikkeus','Selitä miksi tavallisesta käytännöstä pitäisi poiketa.','Yleensä pyynnöt käsitellään saapumisjärjestyksessä, mutta tässä tapauksessa viivästys estää asiakkaan palvelun kokonaan. Siksi ehdotan, että asia käsitellään kiireellisenä.','Pyydä perusteltua poikkeusta tavalliseen käytäntöön.',undefined,['yleensä','tässä tapauksessa','siksi ehdotan'],28,62],
  ['Kieltäydy ja tarjoa vaihtoehto','Sano ei selkeästi säilyttäen yhteistyö.','En valitettavasti pysty ottamaan koko tehtävää vastuulleni tällä viikolla. Voin kuitenkin tarkistaa ensimmäisen version tai auttaa tärkeimmän osan kanssa.','Kieltäydy pyynnöstä, jota et pysty toteuttamaan, ja tarjoa realistinen vaihtoehto.',undefined,['en valitettavasti pysty','kuitenkin','voin auttaa'],28,62],
  ['Ota vaikea asia puheeksi','Aloita herkkä keskustelu neutraalisti.','Haluaisin puhua yhdestä asiasta, joka on vaikeuttanut yhteistyötä viime aikoina. Tarkoitukseni ei ole syyttää ketään, vaan löytää tapa, jolla tilanne toimisi paremmin.','Aloita rakentavasti keskustelu toistuvasta yhteistyöongelmasta.',undefined,['haluaisin puhua','tarkoitukseni ei ole','vaan'],30,66],
  ['Kuvaile vaikutusta ilman syyttelyä','Kerro toisen toiminnan vaikutus minä-muodossa.','Kun muutoksista ilmoitetaan vasta viime hetkellä, minun on vaikea järjestää omaa työtäni. Toivoisin, että saisin tiedon hieman aikaisemmin.','Kerro hankalan toimintatavan vaikutuksesta ja esitä toive ilman syytöstä.',undefined,['kun','minun on vaikea','toivoisin että'],30,66],
  ['Selvitä ristiriita','Tunnista eri tulkinnat ja etsi yhteinen fakta.','Näyttää siltä, että olemme ymmärtäneet vastuun eri tavalla. Minä luulin hoitavani vain ensimmäisen vaiheen. Käydäänkö tehtävänjako yhdessä läpi, jotta tiedämme mitä sovittiin?','Kaksi ihmistä muistaa sopimuksen eri tavalla. Selvitä asia rakentavasti.',undefined,['näyttää siltä','minä luulin','käydäänkö läpi'],30,66],
  ['Rauhoita hankala palvelutilanne','Tunnista turhautuminen ja vie keskustelu ratkaisuun.','Ymmärrän, että viivästys on ollut turhauttava. Selvitän ensin, missä tilaus on, ja sen jälkeen katsomme, mikä ratkaisu olisi tässä tilanteessa nopein.','Asiakas on ärtynyt viivästyksestä. Vastaa rauhallisesti ja kerro mitä teet seuraavaksi.',undefined,['ymmärrän että','selvitän ensin','sen jälkeen'],30,66],
  ['Pyydä päätöstä','Tiivistä vaihtoehdot ja pyydä valinta.','Meillä on käytännössä kaksi vaihtoehtoa: siirrämme julkaisua päivällä tai julkaisemme nyt ilman viimeistä lisäosaa. Tarvitsen päätöksen tänään, jotta tiimi tietää miten jatkaa.','Esittele kaksi vaihtoehtoa ja pyydä vastuuhenkilöltä päätös.',undefined,['kaksi vaihtoehtoa','tai','tarvitsen päätöksen'],30,66],
  ['Suosittele ratkaisua','Tee suositus vertailemiesi vaihtoehtojen pohjalta.','Suosittelen ensimmäistä vaihtoehtoa, vaikka se maksaa hieman enemmän. Se on helpompi ylläpitää ja vähentää myöhempien korjausten tarvetta.','Suosittele yhtä kahdesta vaihtoehdosta ja perustele valinta vähintään kahdella syyllä.',undefined,['suosittelen','vaikka','lisäksi'],30,66],
  ['Vakuuta epäilevä kuulija','Vastaa huoleen ja perustele ehdotuksen arvo.','Ymmärrän huolen siitä, että muutos vie aikaa. Voimme kuitenkin aloittaa pienellä kokeilulla, jolloin riski pysyy rajattuna ja saamme tietoa ennen laajempaa päätöstä.','Toinen epäilee ehdotustasi. Tunnista hänen huolensa ja yritä vakuuttaa hänet kokeilun hyödyistä.',undefined,['ymmärrän huolen','kuitenkin','jolloin'],30,68],
  ['Muuta ehdotusta palautteen perusteella','Osoita joustavuutta säilyttäen tavoite.','Alkuperäinen ehdotukseni oli tehdä muutos kerralla. Palautteen perusteella vaiheittainen käyttöönotto vaikuttaa järkevämmältä, koska se antaa enemmän aikaa testaukseen.','Kerro miten muuttaisit ehdotustasi saamasi palautteen jälkeen ja miksi.',undefined,['alkuperäinen','palautteen perusteella','koska'],30,68],
  ['Selitä prosessi selkeästi','Kuvaile usean vaiheen toimintatapa ymmärrettävästi.','Ensin tarkistamme, että tiedot ovat oikein. Sen jälkeen lähetämme pyynnön hyväksyttäväksi. Kun hyväksyntä on saatu, päivitämme järjestelmän ja ilmoitamme muutoksesta käyttäjälle.','Selitä jokin tuttu työ- tai arkinen prosessi vähintään neljänä vaiheena.',undefined,['ensin','sen jälkeen','kun','lopuksi'],30,68],
  ['Ohjeista ongelmatilanteessa','Anna järjestelmälliset toimintaohjeet.','Jos sovellus ei avaudu, tarkista ensin verkkoyhteys. Jos yhteys toimii, käynnistä sovellus uudelleen. Mikäli ongelma jatkuu, ota kuvakaappaus virheilmoituksesta ja lähetä se tukeen.','Anna vaiheittaiset ohjeet henkilölle, jolla on tekninen tai käytännön ongelma.',undefined,['jos','mikäli','ota'],30,68],
  ['Mukauta selitys aloittelijalle','Selitä tuttu asia ilman turhaa ammattikieltä.','Pilvipalvelu tarkoittaa yksinkertaisesti sitä, että tiedosto tai ohjelma ei ole vain omalla laitteellasi, vaan sitä käytetään internetin kautta palvelimelta.','Selitä jokin tuntemasi tekninen tai ammatillinen asia henkilölle, joka ei tunne aihetta.',undefined,['tarkoittaa','yksinkertaisesti','esimerkiksi'],30,68],
  ['Mukauta viesti asiantuntijalle','Kerro samasta asiasta täsmällisemmin.','Ongelma näyttää liittyvän käyttöoikeuksiin: autentikointi onnistuu, mutta käyttäjä ei saa kyseiseen toimintoon tarvittavaa roolia.','Selitä tuttu ongelma henkilölle, joka tuntee alan peruskäsitteet. Ole täsmällinen mutta ytimekäs.',undefined,['liittyy','onnistuu','tarvittava'],30,68],
  ['Tiivistä pitkä selitys','Poimi olennaiset asiat ja jätä sivuseikat pois.','Tiivistettynä ongelma alkoi päivityksen jälkeen, se koskee vain osaa käyttäjistä ja estää yhden tärkeän toiminnon. Seuraavaksi tarkistamme käyttöoikeudet.','Kuvittele kuulleesi pitkän ongelmakuvauksen. Tiivistä se kolmeen olennaiseen kohtaan.',undefined,['tiivistettynä','koskee','seuraavaksi'],30,68],
  ['Yhdistä eri lähteiden tieto','Muodosta kokonaiskuva osittaisista tiedoista.','Asiakaspalvelun mukaan ongelma alkoi aamulla, ja tekninen tiimi havaitsi samaan aikaan palvelukatkon. Näiden tietojen perusteella vaikuttaa todennäköiseltä, että tapaukset liittyvät toisiinsa.','Yhdistä kaksi saamaasi tietoa ja kerro millaisen johtopäätöksen niistä voi varovasti tehdä.',undefined,['mukaan','samaan aikaan','näiden perusteella'],32,72],
  ['Erota fakta ja oletus','Kerro mikä tiedetään ja mikä on vielä tulkintaa.','Tiedämme varmasti, että palvelu hidastui kello kymmenen jälkeen. Emme vielä tiedä syytä. On mahdollista, että päivitys vaikutti tilanteeseen, mutta sitä ei ole vahvistettu.','Kuvaile ongelmatilanne erottaen vahvistetut tiedot ja omat oletuksesi.',undefined,['tiedämme varmasti','emme vielä tiedä','on mahdollista'],32,72],
  ['Korjaa huhu tai virheellinen tieto','Oikaise tieto rauhallisesti ja täsmällisesti.','Haluan korjata yhden asian: projektia ei ole peruttu. Aikataulua tarkistetaan parhaillaan, mutta päätöstä siirtämisestä ei ole tehty.','Oikaise ryhmässä levinnyt virheellinen tieto syyttämättä ketään.',undefined,['haluan korjata','ei ole','päätöstä ei ole tehty'],32,72],
  ['Johda lyhyt keskustelu','Avaa aihe, rajaa tavoite ja kutsu muita osallistumaan.','Käydään seuraavaksi läpi kaksi asiaa: mikä nykyisessä käytännössä toimii ja mitä pitäisi muuttaa. Tavoitteena on löytää yksi konkreettinen parannus. Kuka haluaisi aloittaa?','Avaa lyhyt ryhmäkeskustelu ja tee sen tavoite selväksi.',undefined,['käydään läpi','tavoitteena on','kuka haluaisi'],32,72],
  ['Palauta keskustelu aiheeseen','Keskeytä sivupolku kohteliaasti ja palauta tavoite.','Tuo on tärkeä kysymys, mutta se vie meidät hieman sivuun tämän keskustelun tavoitteesta. Voimmeko kirjata sen ylös ja palata nyt aikatauluun?','Keskustelu on ajautunut sivuun. Palauta ryhmä kohteliaasti pääaiheeseen.',undefined,['tärkeä kysymys','mutta','palata nyt'],32,72],
  ['Tee yhteenveto eri mielipiteistä','Kuvaa erimielisyys neutraalisti ja tunnista yhteinen kohta.','Osa ryhmästä haluaa edetä nopeasti, kun taas osa painottaa lisätestausta. Kaikki näyttävät kuitenkin olevan samaa mieltä siitä, että nykyinen ongelma pitää ratkaista ennen laajempaa käyttöönottoa.','Tiivistä kaksi eri mielipidettä ja kerro mistä osapuolet ovat samaa mieltä.',undefined,['osa','kun taas','kuitenkin samaa mieltä'],32,72],
  ['Neuvottele yhteinen ratkaisu','Rakenna kompromissi eri tavoitteiden pohjalta.','Voisimme aloittaa rajatulla käyttäjäryhmällä ensi viikolla. Näin etenemme ilman pitkää viivettä, mutta saamme samalla lisää testituloksia ennen laajempaa käyttöönottoa.','Ehdota kompromissia tilanteessa, jossa toinen osapuoli haluaa nopeutta ja toinen lisää varmuutta.',undefined,['näin','mutta samalla','ennen'],34,76],
  ['Itsenäinen B1.2-keskustelu','Pidä pidempi, jäsennelty puheenvuoro ja vie ongelma kohti päätöstä.','Tilanne on tällä hetkellä tämä: uusi toimintatapa säästäisi aikaa, mutta testauksessa on löytynyt kaksi epäselvää kohtaa. Osa tiimistä haluaisi ottaa sen käyttöön heti, kun taas osa haluaa odottaa. Ehdotan rajattua kokeilua kahdeksi viikoksi. Sen jälkeen voimme arvioida tulokset ja tehdä päätöksen laajemmasta käytöstä.','Pidä jäsennelty puheenvuoro muutoksesta: kuvaa tilanne, kaksi näkökulmaa, oma suosituksesi, sen perustelut ja seuraava päätöskohta.',undefined,['tilanne on','kun taas','ehdotan','sen jälkeen'],38,85],
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
  const seed = number <= A1_SEEDS.length ? A1_SEEDS[index] : number <= 50 ? A12_SEEDS[number - 26] : number <= 75 ? A21_SEEDS[number - 51] : number <= 100 ? A22_SEEDS[number - 76] : number <= 125 ? B11_SEEDS[number - 101] : number <= 150 ? B12_SEEDS[number - 126] : generatedSeed(number);
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

export function guidedSpeakingLessonById(id: GuidedSpeakingStageId): GuidedSpeakingLesson | undefined {
  return GUIDED_SPEAKING_CURRICULUM.find((lesson) => lesson.id === id);
}

export function guidedSpeakingRetrievalLessons(number: number): GuidedSpeakingLesson[] {
  const lesson = guidedSpeakingLesson(number);
  if (!lesson) return [];
  return lesson.retrievalStageIds
    .map(guidedSpeakingLessonById)
    .filter((item): item is GuidedSpeakingLesson => Boolean(item));
}
