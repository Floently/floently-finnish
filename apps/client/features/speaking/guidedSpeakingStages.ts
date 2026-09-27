import type { RoleplayLevelBand, RoleplayProfession } from '@core/api/roleplay';

export type GuidedSpeakingStageId = `GS-${string}`;
export type GuidedSpeakingStageKind =
  | 'basic_chunk'
  | 'listen_respond'
  | 'controlled_qa'
  | 'sentence_frame'
  | 'two_turn_exchange'
  | 'short_situation'
  | 'guided_conversation';

export type GuidedSpeakingStage = {
  id: GuidedSpeakingStageKind;
  /** Permanent curriculum identity. Never reuse for different learning content. */
  curriculumId: GuidedSpeakingStageId;
  /** Content version keeps historical attempts tied to the material practised. */
  version: 1;
  order: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  titleFi: string;
  goalFi: string;
  modelFi: string;
  promptFi: string;
  responseFrameFi?: string;
  supportFi: string[];
  expectedMinWords: number;
  expectedMaxWords: number;
  productionBurden: 1 | 2 | 3 | 4 | 5 | 6 | 7;
};

type StageVariant = Omit<GuidedSpeakingStage, 'id' | 'curriculumId' | 'version' | 'order' | 'productionBurden'>;

const STAGE_IDS: GuidedSpeakingStageKind[] = [
  'basic_chunk',
  'listen_respond',
  'controlled_qa',
  'sentence_frame',
  'two_turn_exchange',
  'short_situation',
  'guided_conversation',
];

export const GUIDED_SPEAKING_STAGE_COUNT = STAGE_IDS.length;

const GENERAL_STAGES: Record<RoleplayLevelBand, StageVariant[]> = {
  'A1-A2': [
    {
      titleFi: 'Esittäydy',
      goalFi: 'Sano yksi turvallinen peruslause itsestäsi.',
      modelFi: 'Hei! Minun nimeni on Anna.',
      promptFi: 'Sano tervehdys ja oma nimesi.',
      responseFrameFi: 'Hei! Minun nimeni on ____.',
      supportFi: ['hei', 'minun nimeni on'],
      expectedMinWords: 3,
      expectedMaxWords: 8,
    },
    {
      titleFi: 'Kuuntele ja vastaa',
      goalFi: 'Vastaa yhteen tuttuun kysymykseen lyhyesti.',
      modelFi: 'Mitä kuuluu? Hyvää, kiitos.',
      promptFi: 'Vastaa kysymykseen: Mitä kuuluu?',
      responseFrameFi: '____, kiitos.',
      supportFi: ['hyvää', 'ihan hyvää', 'kiitos'],
      expectedMinWords: 2,
      expectedMaxWords: 6,
    },
    {
      titleFi: 'Kysymys ja vastaus',
      goalFi: 'Vastaa tuttuun kysymykseen kokonaisella lauseella.',
      modelFi: 'Missä asut? Asun Helsingissä.',
      promptFi: 'Vastaa: Missä asut?',
      responseFrameFi: 'Asun ____.',
      supportFi: ['asun', 'Helsingissä', 'Vantaalla', 'Espoossa'],
      expectedMinWords: 2,
      expectedMaxWords: 7,
    },
    {
      titleFi: 'Täydennä lause',
      goalFi: 'Pyydä apua yksinkertaisella lauseella.',
      modelFi: 'Tarvitsen apua lipun ostamiseen.',
      promptFi: 'Pyydä apua johonkin arjen asiaan.',
      responseFrameFi: 'Tarvitsen apua ____.',
      supportFi: ['tarvitsen apua', 'lipun', 'ajan', 'osoitteen'],
      expectedMinWords: 3,
      expectedMaxWords: 9,
    },
    {
      titleFi: 'Kahden vuoron vaihto',
      goalFi: 'Tee pyyntö ja lisää lyhyt jatkovastaus.',
      modelFi: 'Voinko maksaa kortilla? Kyllä. Kiitos.',
      promptFi: 'Kysy, voitko maksaa kortilla. Lisää lopuksi kiitos.',
      responseFrameFi: 'Voinko ____? Kiitos.',
      supportFi: ['voinko', 'maksaa', 'kortilla', 'kiitos'],
      expectedMinWords: 4,
      expectedMaxWords: 10,
    },
    {
      titleFi: 'Lyhyt arkitilanne',
      goalFi: 'Selviä yhdestä pienestä palvelutilanteesta.',
      modelFi: 'Anteeksi, missä maito on? Se on tuolla. Kiitos.',
      promptFi: 'Olet kaupassa. Kysy kohteliaasti, missä jokin tuote on.',
      responseFrameFi: 'Anteeksi, missä ____ on?',
      supportFi: ['anteeksi', 'missä', 'on', 'kiitos'],
      expectedMinWords: 4,
      expectedMaxWords: 12,
    },
    {
      titleFi: 'Ohjattu keskustelu',
      goalFi: 'Yhdistä tervehdys, kysymys ja oma vastaus.',
      modelFi: 'Hei! Haluaisin varata ajan. Sopisiko tiistai? Tiistai sopii hyvin.',
      promptFi: 'Aloita tervehtimällä, kerro mitä tarvitset ja ehdota yhtä aikaa tai päivää.',
      responseFrameFi: 'Hei! Haluaisin ____. Sopisiko ____?',
      supportFi: ['haluaisin', 'varata ajan', 'sopisiko', 'minulle sopii'],
      expectedMinWords: 7,
      expectedMaxWords: 18,
    },
  ],
  'B1-B2': [
    {
      titleFi: 'Esittele itsesi tilanteeseen sopivasti',
      goalFi: 'Kerro lyhyesti kuka olet ja miksi olet paikalla.',
      modelFi: 'Hei, olen Anna. Olen uusi täällä ja tulin tutustumaan palveluun.',
      promptFi: 'Esittele itsesi ja kerro yhdellä syyllä, miksi olet paikalla.',
      supportFi: ['olen', 'tulin', 'koska', 'haluaisin'],
      expectedMinWords: 8,
      expectedMaxWords: 20,
    },
    {
      titleFi: 'Vastaa ja lisää tieto',
      goalFi: 'Vastaa kysymykseen ja lisää yksi selventävä tieto.',
      modelFi: 'Mitä kuuluu? Ihan hyvää, kiitos. Viikko on ollut kiireinen, mutta kaikki on kunnossa.',
      promptFi: 'Vastaa kysymykseen Mitä kuuluu? Lisää yksi syy tai taustatieto.',
      supportFi: ['koska', 'mutta', 'viime aikoina', 'tällä viikolla'],
      expectedMinWords: 10,
      expectedMaxWords: 25,
    },
    {
      titleFi: 'Kysy tarkennus',
      goalFi: 'Pyydä lisätietoa ja varmista, että ymmärsit oikein.',
      modelFi: 'Voisitko tarkentaa, mihin aikaan tapaaminen alkaa? Ymmärsinkö oikein, että se alkaa puoli kolmelta?',
      promptFi: 'Pyydä tarkennus ajasta tai paikasta ja varmista saamasi tieto.',
      supportFi: ['voisitko tarkentaa', 'ymmärsinkö oikein', 'tarkoitatko että'],
      expectedMinWords: 10,
      expectedMaxWords: 28,
    },
    {
      titleFi: 'Rakenna perusteltu lause',
      goalFi: 'Kerro tarve ja perustele se lyhyesti.',
      modelFi: 'Tarvitsen uuden ajan, koska en pääse paikalle maanantaina.',
      promptFi: 'Kerro mitä tarvitset ja anna yksi syy.',
      responseFrameFi: 'Tarvitsen ____, koska ____.',
      supportFi: ['tarvitsen', 'koska', 'siksi että'],
      expectedMinWords: 8,
      expectedMaxWords: 24,
    },
    {
      titleFi: 'Kahden vuoron neuvottelu',
      goalFi: 'Tee ehdotus, reagoi vaihtoehtoon ja vahvista lopputulos.',
      modelFi: 'Sopisiko keskiviikko iltapäivällä? Aamu olisi minulle parempi. Selvä, sovitaan keskiviikko kello yhdeksän.',
      promptFi: 'Ehdota aikaa, reagoi toiseen vaihtoehtoon ja vahvista sopimus.',
      supportFi: ['sopisiko', 'minulle sopisi paremmin', 'sovitaan'],
      expectedMinWords: 14,
      expectedMaxWords: 35,
    },
    {
      titleFi: 'Ratkaise arjen ongelma',
      goalFi: 'Kuvaa ongelma, kerro vaikutus ja pyydä ratkaisua.',
      modelFi: 'Tilauksestani puuttuu yksi tuote, vaikka se näkyy kuitissa. Voisitteko tarkistaa asian ja kertoa, miten tämä korjataan?',
      promptFi: 'Kerro palvelutilanteessa ongelmasta ja pyydä selkeä seuraava toimi.',
      supportFi: ['ongelma on', 'vaikka', 'voisitteko', 'miten tämä korjataan'],
      expectedMinWords: 18,
      expectedMaxWords: 45,
    },
    {
      titleFi: 'Ohjattu pidempi keskustelu',
      goalFi: 'Yhdistä tilanne, tavoite, perustelu ja seuraava askel.',
      modelFi: 'Hei, haluaisin muuttaa varaustani. Nykyinen aika ei enää sovi työvuoroni vuoksi. Kävisikö torstai-iltapäivä? Jos se sopii, vahvistetaan uusi aika.',
      promptFi: 'Hoida tuttu asia: kerro tavoite, perustele, ehdota ratkaisua ja vahvista seuraava askel.',
      supportFi: ['haluaisin', 'sen vuoksi', 'kävisikö', 'vahvistetaan'],
      expectedMinWords: 24,
      expectedMaxWords: 60,
    },
  ],
  'C1-C2': [
    {
      titleFi: 'Aseta konteksti nopeasti',
      goalFi: 'Esittele roolisi ja tavoite luontevasti ilman valmista kehystä.',
      modelFi: 'Hei, olen Anna. Vastaan tämän asian koordinoinnista ja haluaisin ensin varmistaa, että meillä on sama käsitys tilanteesta.',
      promptFi: 'Esittele itsesi tilanteeseen sopivalla rekisterillä ja kerro keskustelun tavoite.',
      supportFi: ['haluaisin varmistaa', 'vastaan', 'tavoitteena on'],
      expectedMinWords: 16,
      expectedMaxWords: 40,
    },
    {
      titleFi: 'Reagoi ja rajaa näkökulma',
      goalFi: 'Vastaa spontaanisti ja lisää olennainen rajaus tai täsmennys.',
      modelFi: 'Pääosin hyvin. Aikataulu on kuitenkin kiristynyt, joten meidän kannattaa erottaa kiireelliset asiat niistä, jotka voivat odottaa.',
      promptFi: 'Vastaa tilanteen etenemistä koskevaan kysymykseen ja lisää yksi olennainen rajaus.',
      supportFi: ['pääosin', 'kuitenkin', 'olennaista on', 'toisaalta'],
      expectedMinWords: 22,
      expectedMaxWords: 55,
    },
    {
      titleFi: 'Korjaa mahdollinen väärinymmärrys',
      goalFi: 'Pyydä täsmennys diplomaattisesti ja sano omin sanoin, mitä ymmärsit.',
      modelFi: 'Tarkentaisitko vielä, tarkoitatko muutosta aikatauluun vai myös sisältöön? Ymmärsin tähän asti, että vain aikataulu muuttuu.',
      promptFi: 'Tarkenna epäselvä kohta ja tee oma tulkintasi näkyväksi.',
      supportFi: ['tarkentaisitko', 'ymmärsin että', 'jos tulkitsen oikein'],
      expectedMinWords: 24,
      expectedMaxWords: 60,
    },
    {
      titleFi: 'Perustele ja suhteuta',
      goalFi: 'Esitä tarve, peruste ja mahdollinen poikkeus tai rajoite.',
      modelFi: 'Ehdotan, että siirrämme määräaikaa kahdella päivällä, koska tarvitsemme vielä vahvistuksen. Jos vahvistus saadaan tänään, alkuperäinen aikataulu voi silti onnistua.',
      promptFi: 'Esitä ratkaisu perusteluineen ja kerro, millä ehdolla toinen vaihtoehto olisi mahdollinen.',
      supportFi: ['ehdotan että', 'koska', 'jos', 'siinä tapauksessa'],
      expectedMinWords: 28,
      expectedMaxWords: 70,
    },
    {
      titleFi: 'Neuvottele rakentavasti',
      goalFi: 'Tee ehdotus, käsittele vastaväite ja kokoa kompromissi.',
      modelFi: 'Ymmärrän huolen kustannuksista. Voisimme rajata ensimmäisen vaiheen pienemmäksi ja arvioida vaikutukset ennen jatkoa. Näin riski pysyy hallittavana.',
      promptFi: 'Reagoi vastaväitteeseen, ehdota kompromissia ja perustele se.',
      supportFi: ['ymmärrän huolen', 'voisimme', 'toisaalta', 'näin'],
      expectedMinWords: 32,
      expectedMaxWords: 80,
    },
    {
      titleFi: 'Hoida vaativa palvelutilanne',
      goalFi: 'Kuvaa ongelma täsmällisesti, säilytä rakentava sävy ja ehdota etenemistä.',
      modelFi: 'Palvelussa on ollut toistuva häiriö, joka on viivästyttänyt asian käsittelyä. Haluaisin selvittää, mistä viive johtuu ja mikä olisi realistinen aikataulu sen korjaamiselle.',
      promptFi: 'Nosta esiin toistuva ongelma asiallisesti ja pyydä konkreettinen etenemissuunnitelma.',
      supportFi: ['toistuva', 'haluaisin selvittää', 'realistinen', 'eteneminen'],
      expectedMinWords: 35,
      expectedMaxWords: 90,
    },
    {
      titleFi: 'Ohjaa pidempi keskustelu',
      goalFi: 'Rakenna johdonmukainen puheenvuoro ja jätä tilaa vastaukselle.',
      modelFi: 'Jos kokoan tilanteen lyhyesti, meillä on kaksi vaihtoehtoa. Ensimmäinen on nopeampi mutta sisältää enemmän epävarmuutta. Toinen vie hieman kauemmin, mutta antaa meille paremman tietopohjan. Kumpaa pidät tässä tilanteessa perustellumpana?',
      promptFi: 'Kokoa kaksi vaihtoehtoa, vertaile niiden seurauksia ja kutsu toinen osapuoli mukaan päätökseen.',
      supportFi: ['jos kokoan', 'ensimmäinen', 'toinen', 'toisaalta', 'kumpaa'],
      expectedMinWords: 45,
      expectedMaxWords: 110,
    },
  ],
};

function professionalRole(profession: RoleplayProfession): string {
  if (profession === 'doctor') return 'lääkäri';
  if (profession === 'practical_nurse') return 'lähihoitaja';
  if (profession === 'nurse') return 'sairaanhoitaja';
  return 'työntekijä';
}

function professionalStages(
  profession: RoleplayProfession,
  levelBand: RoleplayLevelBand,
): StageVariant[] {
  const role = professionalRole(profession);

  if (levelBand === 'A1-A2') {
    return [
      {
        titleFi: 'Kerro roolisi',
        goalFi: 'Sano lyhyesti kuka olet työtilanteessa.',
        modelFi: `Hei. Olen ${role}.`,
        promptFi: 'Tervehdi ja kerro työroolisi.',
        responseFrameFi: `Hei. Olen ${role}.`,
        supportFi: ['hei', 'olen', role],
        expectedMinWords: 2,
        expectedMaxWords: 7,
      },
      {
        titleFi: 'Tervehdi ja kysy vointia',
        goalFi: 'Aloita rauhallinen ammatillinen kohtaaminen.',
        modelFi: 'Hyvää huomenta. Miten voitte?',
        promptFi: 'Tervehdi ja kysy lyhyesti vointia.',
        responseFrameFi: 'Hyvää ____. Miten voitte?',
        supportFi: ['hyvää huomenta', 'miten voitte'],
        expectedMinWords: 3,
        expectedMaxWords: 8,
      },
      {
        titleFi: 'Kysy yksi selkeä kysymys',
        goalFi: 'Kysy yksi tilanteeseen liittyvä perustieto.',
        modelFi: 'Onko teillä kipua?',
        promptFi: 'Kysy yksi selkeä vointiin tai tilanteeseen liittyvä kysymys.',
        responseFrameFi: 'Onko teillä ____?',
        supportFi: ['onko teillä', 'kipua', 'huimausta', 'kysyttävää'],
        expectedMinWords: 3,
        expectedMaxWords: 9,
      },
      {
        titleFi: 'Kerro seuraava askel',
        goalFi: 'Kerro yksinkertaisesti mitä tapahtuu seuraavaksi.',
        modelFi: 'Seuraavaksi käymme asian yhdessä läpi.',
        promptFi: 'Kerro yksi turvallinen seuraava askel ilman lääketieteellistä päätöstä.',
        responseFrameFi: 'Seuraavaksi ____.',
        supportFi: ['seuraavaksi', 'käymme läpi', 'keskustelemme'],
        expectedMinWords: 4,
        expectedMaxWords: 10,
      },
      {
        titleFi: 'Kysy ja varmista',
        goalFi: 'Kysy tarvitaanko apua ja reagoi vastaukseen.',
        modelFi: 'Tarvitsetteko apua? Selvä, autan teitä.',
        promptFi: 'Kysy avun tarpeesta ja lisää lyhyt jatkovastaus.',
        responseFrameFi: 'Tarvitsetteko ____? Selvä, ____.',
        supportFi: ['tarvitsetteko', 'apua', 'selvä', 'autan'],
        expectedMinWords: 5,
        expectedMaxWords: 12,
      },
      {
        titleFi: 'Lyhyt työtilanne',
        goalFi: 'Kerro kollegalle yksi havainto ja yksi seuraava tehtävä.',
        modelFi: 'Asiakas odottaa. Hän tarvitsee apua. Käyn tilanteen nyt läpi.',
        promptFi: 'Kerro kollegalle lyhyesti mitä tapahtuu ja mitä teet seuraavaksi.',
        responseFrameFi: '____ odottaa. Seuraavaksi ____.',
        supportFi: ['odottaa', 'tarvitsee', 'seuraavaksi', 'käyn läpi'],
        expectedMinWords: 7,
        expectedMaxWords: 18,
      },
      {
        titleFi: 'Ohjattu työvuoropuhelu',
        goalFi: 'Yhdistä tilanne, oma tehtävä ja varmistava kysymys.',
        modelFi: 'Hei. Olen tässä vuorossa vastuussa tästä asiasta. Käyn tilanteen ensin läpi. Onko jotain tärkeää, joka minun pitää tietää?',
        promptFi: 'Kerro roolisi, mitä teet ensin ja kysy yksi varmistava kysymys.',
        responseFrameFi: 'Olen ____. Ensin ____. Onko ____?',
        supportFi: ['olen', 'ensin', 'seuraavaksi', 'onko jotain'],
        expectedMinWords: 10,
        expectedMaxWords: 24,
      },
    ];
  }

  if (levelBand === 'B1-B2') {
    return [
      {
        titleFi: 'Aseta työtilanteen konteksti',
        goalFi: 'Kerro roolisi ja tämänhetkinen tehtäväsi.',
        modelFi: `Hei, olen ${role}. Vastaan tästä tilanteesta tämän vuoron ajan.`,
        promptFi: 'Esittele roolisi ja kerro mistä vastaat juuri nyt.',
        supportFi: ['vastaan', 'tämän vuoron ajan', 'tehtäväni on'],
        expectedMinWords: 9,
        expectedMaxWords: 24,
      },
      {
        titleFi: 'Vastaa ja tarkenna',
        goalFi: 'Reagoi tilanteeseen ja lisää yksi olennainen taustatieto.',
        modelFi: 'Tilanne on tällä hetkellä rauhallinen, mutta oireita on seurattu tavallista tarkemmin aamusta lähtien.',
        promptFi: 'Kuvaa tilanne lyhyesti ja lisää yksi olennainen taustatieto.',
        supportFi: ['tällä hetkellä', 'mutta', 'aamusta lähtien', 'sen vuoksi'],
        expectedMinWords: 12,
        expectedMaxWords: 30,
      },
      {
        titleFi: 'Tarkenna turvallisesti',
        goalFi: 'Pyydä täsmennys, kun tieto ei ole riittävä.',
        modelFi: 'Voisitko tarkentaa, milloin muutos huomattiin ja mitä sen jälkeen tapahtui?',
        promptFi: 'Pyydä kaksi tilanteen ymmärtämiseen liittyvää täsmennystä ilman diagnoosia.',
        supportFi: ['voisitko tarkentaa', 'milloin', 'mitä sen jälkeen'],
        expectedMinWords: 10,
        expectedMaxWords: 28,
      },
      {
        titleFi: 'Selitä seuraava viestinnällinen askel',
        goalFi: 'Kerro mitä aiot tehdä ja miksi.',
        modelFi: 'Käyn tiedot vielä läpi kollegan kanssa, jotta voimme varmistaa, että kaikki olennainen on huomioitu.',
        promptFi: 'Kerro seuraava viestinnällinen tai koordinointiin liittyvä askel ja perustele se.',
        responseFrameFi: 'Seuraavaksi ____, jotta ____.',
        supportFi: ['seuraavaksi', 'jotta', 'varmistamme', 'käyn läpi'],
        expectedMinWords: 12,
        expectedMaxWords: 32,
      },
      {
        titleFi: 'Kahden vuoron ammatillinen vaihto',
        goalFi: 'Tee ehdotus, reagoi tietoon ja vahvista yhteinen suunnitelma.',
        modelFi: 'Voimmeko käydä tämän läpi ennen vuoronvaihtoa? Sopii. Otetaan ensin tärkeimmät havainnot ja sovitaan lopuksi, kuka tekee mitä.',
        promptFi: 'Ehdota lyhyttä yhteistä läpikäyntiä ja vahvista, miten etenette.',
        supportFi: ['voimmeko', 'sopii', 'käydään läpi', 'sovitaan'],
        expectedMinWords: 16,
        expectedMaxWords: 40,
      },
      {
        titleFi: 'Raportoi poikkeama selkeästi',
        goalFi: 'Kerro havainto, vaikutus ja mitä tietoa vielä tarvitaan.',
        modelFi: 'Huomasin muutoksen tilanteessa noin tunti sitten. Se vaikuttaa päivän suunnitelmaan, joten haluan varmistaa vielä kaksi asiaa ennen kuin etenemme.',
        promptFi: 'Raportoi työtilanteen muutos: mitä havaitsit, mihin se vaikuttaa ja mitä pitää vielä selvittää.',
        supportFi: ['huomasin', 'vaikuttaa', 'haluan varmistaa', 'ennen kuin'],
        expectedMinWords: 20,
        expectedMaxWords: 50,
      },
      {
        titleFi: 'Ohjattu ammatillinen keskustelu',
        goalFi: 'Yhdistä tilannekuva, perustelu, ehdotus ja varmistus.',
        modelFi: 'Tilanne on muuttunut aamun jälkeen. Ehdotan, että käymme olennaiset tiedot yhdessä läpi ennen seuraavaa vaihetta, koska näin vältämme väärinymmärrykset. Sopisiko, että aloitan yhteenvedolla?',
        promptFi: 'Anna lyhyt tilannekuva, perustele seuraava askel, tee ehdotus ja varmista yhteistyö.',
        supportFi: ['tilanne on', 'ehdotan että', 'koska', 'sopisiko'],
        expectedMinWords: 26,
        expectedMaxWords: 65,
      },
    ];
  }

  return [
    {
      titleFi: 'Määritä roolisi ja tavoite',
      goalFi: 'Aseta ammatillinen konteksti täsmällisesti ja tarkoituksenmukaisella rekisterillä.',
      modelFi: `Hei, olen ${role} ja koordinoin tämän tilanteen viestintää. Haluaisin ensin varmistaa yhteisen tilannekuvan.`,
      promptFi: 'Aseta roolisi ja keskustelun tavoite ilman tarpeetonta yksityiskohtaisuutta.',
      supportFi: ['koordinoin', 'yhteinen tilannekuva', 'tavoitteena on'],
      expectedMinWords: 18,
      expectedMaxWords: 45,
    },
    {
      titleFi: 'Tiivistä ja rajaa',
      goalFi: 'Kuvaa tilanne ja erottele olennainen epävarmuus.',
      modelFi: 'Kokonaisuus on vakaa, mutta kahdessa kohdassa tieto on vielä puutteellinen. Ne kannattaa erottaa varmistetuista havainnoista ennen jatkopäätelmiä.',
      promptFi: 'Tiivistä tilanne ja nimeä yksi epävarmuus ilman perusteetonta varmuutta.',
      supportFi: ['kokonaisuus', 'puutteellinen tieto', 'varmistettu', 'epävarmuus'],
      expectedMinWords: 26,
      expectedMaxWords: 65,
    },
    {
      titleFi: 'Tarkenna diplomaattisesti',
      goalFi: 'Pyydä täsmennys ja tee oma tulkintasi näkyväksi.',
      modelFi: 'Tarkentaisitko vielä, perustuuko tämä tieto suoraan havaintoon vai myöhempään arvioon? Jos ymmärsin oikein, aikajärjestys ei ole vielä täysin varma.',
      promptFi: 'Pyydä lähteeseen tai aikajärjestykseen liittyvä täsmennys ja sano, mitä olet tähän asti ymmärtänyt.',
      supportFi: ['tarkentaisitko', 'perustuuko', 'jos ymmärsin oikein', 'ei ole vielä varma'],
      expectedMinWords: 28,
      expectedMaxWords: 70,
    },
    {
      titleFi: 'Perustele eteneminen',
      goalFi: 'Ehdota turvallista viestinnällistä seuraavaa askelta ja suhteuta se epävarmuuteen.',
      modelFi: 'Ehdotan, että varmistamme puuttuvat tiedot ennen lopullista yhteenvetoa. Jos niitä ei saada nopeasti, voimme kirjata epävarmuuden näkyvästi ja edetä sen pohjalta.',
      promptFi: 'Ehdota etenemistä niin, että epävarmuus tulee selvästi näkyviin.',
      supportFi: ['ehdotan että', 'ennen', 'jos', 'epävarmuus'],
      expectedMinWords: 30,
      expectedMaxWords: 75,
    },
    {
      titleFi: 'Neuvottele työnjaosta',
      goalFi: 'Käsittele toinen näkökulma ja kokoa toimiva yhteinen ratkaisu.',
      modelFi: 'Ymmärrän, että aikataulu on tiukka. Voisimme jakaa työn niin, että toinen tarkistaa taustatiedot ja toinen valmistelee yhteenvedon. Näin etenemme rinnakkain ilman, että tarkistus jää tekemättä.',
      promptFi: 'Reagoi aikataulupaineeseen, ehdota työnjakoa ja perustele hyöty.',
      supportFi: ['ymmärrän', 'voisimme jakaa', 'näin', 'ilman että'],
      expectedMinWords: 34,
      expectedMaxWords: 85,
    },
    {
      titleFi: 'Raportoi vaativa poikkeama',
      goalFi: 'Erota fakta, tulkinta ja ehdotettu seuraava askel.',
      modelFi: 'Varmistettu havainto on, että aikataulu viivästyi. Syystä meillä on vasta alustava arvio. Ehdotan, että kerromme nämä erikseen ja sovimme, milloin syy vahvistetaan.',
      promptFi: 'Raportoi poikkeama niin, että fakta, epävarma tulkinta ja ehdotus erottuvat toisistaan.',
      supportFi: ['varmistettu havainto', 'alustava arvio', 'ehdotan', 'erikseen'],
      expectedMinWords: 38,
      expectedMaxWords: 95,
    },
    {
      titleFi: 'Ohjaa moniaskelinen keskustelu',
      goalFi: 'Kokoa tilanne, vaihtoehdot, riskit ja yhteinen seuraava päätös.',
      modelFi: 'Jos kokoan tilanteen, meillä on kaksi realistista etenemistapaa. Nopeampi vaihtoehto säästää aikaa, mutta jättää yhden tiedon varmistamatta. Hitaampi vaihtoehto vähentää epävarmuutta. Ehdotan, että sovimme ensin, kumpi riski on tässä hyväksyttävämpi.',
      promptFi: 'Kokoa kaksi vaihtoehtoa, vertaile niiden seurauksia ja ohjaa keskustelu yhteiseen päätökseen.',
      supportFi: ['jos kokoan', 'vaihtoehto', 'epävarmuus', 'ehdotan että'],
      expectedMinWords: 48,
      expectedMaxWords: 120,
    },
  ];
}

function buildStages(variants: StageVariant[]): GuidedSpeakingStage[] {
  if (variants.length !== STAGE_IDS.length) {
    throw new Error('GUIDED_SPEAKING_STAGE_COUNT_MISMATCH');
  }

  return variants.map((variant, index) => ({
    ...variant,
    id: STAGE_IDS[index],
    curriculumId: `GS-${String(index + 1).padStart(3, '0')}`,
    version: 1,
    order: (index + 1) as GuidedSpeakingStage['order'],
    productionBurden: (index + 1) as GuidedSpeakingStage['productionBurden'],
  }));
}

export function getGuidedSpeakingStages(
  profession: RoleplayProfession,
  levelBand: RoleplayLevelBand,
): GuidedSpeakingStage[] {
  const variants =
    profession === 'general'
      ? GENERAL_STAGES[levelBand]
      : professionalStages(profession, levelBand);

  return buildStages(variants);
}

export function guidedSpeakingTtsSpeed(levelBand: RoleplayLevelBand): number {
  if (levelBand === 'A1-A2') return 0.86;
  if (levelBand === 'B1-B2') return 0.94;
  return 1;
}

export function guidedSpeakingVoiceProfile(
  profession: RoleplayProfession,
): string {
  if (profession === 'doctor') return 'yki_standard_male';
  return 'yki_standard_female';
}

export function guidedSpeakingExpectedResponseRange(
  stage: GuidedSpeakingStage,
): string {
  return `${stage.expectedMinWords}–${stage.expectedMaxWords}`;
}
