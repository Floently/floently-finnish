import type {
  ReadingLevel,
  ReadingQuestionFamily,
  ReadingScope,
  ReadingTask,
} from './readingEngine';

const EXPANSION_PROVENANCE = {
  author: 'KieliValmis',
  authoredAt: '2026-09-27',
  license: 'KieliValmis-original',
  sourceNote:
    'Original KieliValmis Finnish learning content authored for deterministic Reading progression. Not adapted from YKI, textbooks, or paid course material.',
} as const;

type ChoiceQuestionType = Extract<
  ReadingQuestionFamily,
  'detail' | 'main_idea' | 'contextual_vocabulary' | 'inference'
>;

type AuthoredQuestion = {
  type: ChoiceQuestionType;
  prompt: string;
  options: readonly [string, string, string];
  correct: 0 | 1 | 2;
  hint?: string;
};

type AuthoredReading = {
  id: string;
  pathway: ReadingScope;
  level: ReadingLevel;
  title: string;
  context: string;
  readingGoal: string;
  estimatedMinutes: number;
  documentType: ReadingTask['document']['type'];
  documentTitle: string;
  metadata: string;
  segments: readonly string[];
  questions: readonly AuthoredQuestion[];
  vocabulary?: readonly {
    term: string;
    meaning: string;
    contextNote: string;
  }[];
  tags: readonly string[];
};

function makeReadingTask(input: AuthoredReading): ReadingTask {
  return {
    taskId: input.id,
    contentVersion: '2026-09-27.1',
    pathway: input.pathway,
    level: input.level,
    title: input.title,
    context: input.context,
    readingGoal: input.readingGoal,
    estimatedMinutes: input.estimatedMinutes,
    document: {
      type: input.documentType,
      title: input.documentTitle,
      metadata: input.metadata,
      segments: input.segments.map((text, index) => ({
        id: `${input.id}.segment-${index + 1}`,
        text,
        emphasis: index === 0 ? 'body' : 'body',
      })),
    },
    vocabulary: (input.vocabulary ?? []).map((item, index) => ({
      id: `${input.id}.vocab-${index + 1}`,
      ...item,
    })),
    questions: input.questions.map((question, index) => {
      const questionId = `${input.id}.q-${index + 1}`;
      const options = question.options.map((label, optionIndex) => ({
        id: `${questionId}.o-${optionIndex + 1}`,
        label,
      }));
      return {
        id: questionId,
        type: question.type,
        prompt: question.prompt,
        ...(question.hint ? { strategyHint: question.hint } : {}),
        options,
        correctOptionId: options[question.correct].id,
        feedback: {
          correct: 'Oikein. Vastaus perustuu tekstissä annettuun tietoon.',
          incorrect: 'Lue kohta uudelleen ja vertaa vaihtoehtoja tekstin täsmälliseen sanamuotoon.',
        },
      };
    }),
    tags: [...input.tags],
    provenance: EXPANSION_PROVENANCE,
  };
}

export const EVERYDAY_READING_EXPANSION: readonly ReadingTask[] = [
  makeReadingTask({
    id: 'reading.everyday.a1.bus-stop-change',
    pathway: 'everyday',
    level: 'A1',
    title: 'Bussipysäkki on eri paikassa',
    context: 'Olet menossa bussilla kotiin.',
    readingGoal: 'Etsi uusi pysäkki ja kellonaika.',
    estimatedMinutes: 4,
    documentType: 'notice',
    documentTitle: 'Pysäkki siirtyy tänään',
    metadata: 'Linja 52 · keskiviikko',
    segments: [
      'Linja 52 ei pysähdy tänään Kauppatorin pysäkillä klo 14 jälkeen.',
      'Käytä Kirjastokadun pysäkkiä. Se on noin 150 metriä torilta.',
      'Bussit kulkevat normaalin aikataulun mukaan.',
    ],
    vocabulary: [
      {
        term: 'pysäkki',
        meaning: 'paikka, jossa bussi pysähtyy',
        contextNote: 'Tänään käytetään eri pysäkkiä kuin tavallisesti.',
      },
    ],
    questions: [
      {
        type: 'detail',
        prompt: 'Mitä linjaa ilmoitus koskee?',
        options: ['Linjaa 25', 'Linjaa 52', 'Linjaa 72'],
        correct: 1,
        hint: 'Katso ilmoituksen ensimmäistä riviä.',
      },
      {
        type: 'detail',
        prompt: 'Mitä pysäkkiä käytät klo 15?',
        options: ['Kauppatoria', 'Kirjastokatua', 'Rautatieasemaa'],
        correct: 1,
      },
      {
        type: 'main_idea',
        prompt: 'Mikä muuttuu?',
        options: ['Bussin hinta', 'Bussin pysäkki', 'Bussin numero'],
        correct: 1,
      },
    ],
    tags: ['liikkuminen', 'pysäkki'],
  }),
  makeReadingTask({
    id: 'reading.everyday.a2.package-pickup',
    pathway: 'everyday',
    level: 'A2',
    title: 'Paketti odottaa noutoa',
    context: 'Saat viestin paketista.',
    readingGoal: 'Selvitä, mistä ja milloin paketti pitää hakea.',
    estimatedMinutes: 5,
    documentType: 'message',
    documentTitle: 'Noutoilmoitus',
    metadata: 'Pakettipalvelu',
    segments: [
      'Pakettisi on saapunut Kallion Marketin noutopisteeseen, osoite Pihlajatie 4.',
      'Paketti on noudettavissa perjantaihin 2.10. klo 20 asti. Ota mukaan henkilöllisyystodistus tai sovelluksen noutokoodi.',
      'Jos et nouda pakettia määräaikaan mennessä, se palautetaan lähettäjälle seuraavana arkipäivänä.',
    ],
    vocabulary: [
      {
        term: 'määräaika',
        meaning: 'viimeinen aika, jolloin asia pitää tehdä',
        contextNote: 'Paketti pitää hakea ennen perjantaita klo 20.',
      },
    ],
    questions: [
      {
        type: 'detail',
        prompt: 'Missä paketti on?',
        options: ['Pihlajatie 4:ssä', 'Postikatu 2:ssa', 'Rautatieasemalla'],
        correct: 0,
      },
      {
        type: 'detail',
        prompt: 'Mitä tarvitset noutoon?',
        options: ['Vain pankkikortin', 'Henkilöllisyystodistuksen tai noutokoodin', 'Lähettäjän puhelinnumeron'],
        correct: 1,
      },
      {
        type: 'inference',
        prompt: 'Mitä tapahtuu, jos haet pakettia vasta maanantaina?',
        options: ['Paketti on todennäköisesti palautettu', 'Paketti odottaa ilman aikarajaa', 'Paketti siirtyy kotiovelle'],
        correct: 0,
      },
    ],
    tags: ['asiointi', 'paketti'],
  }),
  makeReadingTask({
    id: 'reading.everyday.b1.rent-renovation',
    pathway: 'everyday',
    level: 'B1',
    title: 'Remontti vaikuttaa asumiseen',
    context: 'Taloyhtiössä alkaa porraskäytävän remontti.',
    readingGoal: 'Tunnista aikataulu, haitat ja asukkaan vastuulla olevat asiat.',
    estimatedMinutes: 6,
    documentType: 'announcement',
    documentTitle: 'Porraskäytävän maalaus alkaa maanantaina',
    metadata: 'Taloyhtiön tiedote',
    segments: [
      'Porraskäytävän seinien maalaus alkaa maanantaina 5.10. ja kestää arviolta kaksi viikkoa. Työtä tehdään arkisin klo 8–16.',
      'Kulkeminen asuntoihin on mahdollista koko remontin ajan, mutta käytävät voivat olla ajoittain tavallista kapeampia. Lastenvaunut ja muut irtotavarat pitää siirtää pois käytävältä ennen maanantaiaamua.',
      'Voimakkainta maalin hajua voi esiintyä ensimmäisinä päivinä. Ilmanvaihtoa tehostetaan työn aikana, mutta asukkaita pyydetään pitämään asuntojen ovet suljettuina.',
    ],
    questions: [
      {
        type: 'main_idea',
        prompt: 'Mikä tiedotteen tarkoitus on?',
        options: ['Ilmoittaa remontista ja antaa asukkaille ohjeita', 'Pyytää asukkaita maalaamaan itse', 'Ilmoittaa vuokran noususta'],
        correct: 0,
      },
      {
        type: 'detail',
        prompt: 'Mitä asukkaan pitää tehdä ennen maanantaiaamua?',
        options: ['Sulkea ilmanvaihto', 'Siirtää tavarat käytävältä', 'Poistua asunnosta kahdeksi viikoksi'],
        correct: 1,
      },
      {
        type: 'inference',
        prompt: 'Voiko asuntoon kulkea remontin aikana?',
        options: ['Ei lainkaan', 'Kyllä, vaikka käytävä voi olla ahtaampi', 'Vain viikonloppuisin'],
        correct: 1,
      },
    ],
    tags: ['asuminen', 'remontti'],
  }),
  makeReadingTask({
    id: 'reading.everyday.b2.insurance-decision',
    pathway: 'everyday',
    level: 'B2',
    title: 'Vakuutuskorvauksen päätös',
    context: 'Luet vakuutusyhtiön päätöstä rikkoutuneesta puhelimesta.',
    readingGoal: 'Erota päätös, perustelu, omavastuu ja muutoksenhaku.',
    estimatedMinutes: 8,
    documentType: 'policy',
    documentTitle: 'Korvauspäätös',
    metadata: 'Kodin irtaimistovakuutus · fiktiivinen päätös',
    segments: [
      'Ilmoituksesi mukaan puhelin putosi 12.9. ja näyttö rikkoutui. Vahinko kuuluu irtaimistovakuutuksen rikkoutumisturvan piiriin.',
      'Korvauksen perusteena käytetään vastaavan laitteen tämänhetkistä arvoa. Laitteen iän vuoksi arvosta vähennetään ehtojen mukainen ikävähennys, minkä jälkeen summasta vähennetään 150 euron omavastuu.',
      'Jos olet eri mieltä päätöksestä, voit toimittaa 30 päivän kuluessa kirjallisen oikaisupyynnön ja liittää mukaan mahdolliset uudet selvitykset. Pelkkä tyytymättömyys ei muuta laskentaperustetta, mutta puuttuva tai virheellinen tieto voidaan arvioida uudelleen.',
    ],
    questions: [
      {
        type: 'detail',
        prompt: 'Miksi korvaus ei vastaa uuden puhelimen täyttä hintaa?',
        options: ['Ikävähennys ja omavastuu pienentävät summaa', 'Vahinko ei kuulu vakuutukseen', 'Puhelimen merkkiä ei hyväksytä'],
        correct: 0,
      },
      {
        type: 'main_idea',
        prompt: 'Mitä viimeinen kappale käsittelee?',
        options: ['Muutoksenhakua', 'Uuden vakuutuksen ostamista', 'Puhelimen huolto-ohjetta'],
        correct: 0,
      },
      {
        type: 'inference',
        prompt: 'Milloin päätös voidaan arvioida uudelleen?',
        options: ['Kun asiakas toimittaa olennaista uutta tai korjaavaa tietoa', 'Aina kun asiakas ilmoittaa olevansa pettynyt', 'Vasta vuoden kuluttua'],
        correct: 0,
      },
    ],
    tags: ['asiointi', 'vakuutus'],
  }),
  makeReadingTask({
    id: 'reading.everyday.c1.city-plan-comment',
    pathway: 'everyday',
    level: 'C1',
    title: 'Kaupungin suunnitelman perustelut',
    context: 'Haluat muodostaa mielipiteen lähialueen liikennesuunnitelmasta.',
    readingGoal: 'Tunnista tavoitteet, varaukset ja eri ryhmien kannalta olennaiset vaikutukset.',
    estimatedMinutes: 10,
    documentType: 'policy',
    documentTitle: 'Luonnos keskustan liikennejärjestelyksi',
    metadata: 'Kaupungin osallistumis- ja arviointiaineisto · tiivistelmä',
    segments: [
      'Luonnoksen tavoitteena on vähentää keskustan läpiajoa ja parantaa kävelyn sekä joukkoliikenteen sujuvuutta. Esitys ei poista autoliikennettä keskustasta, vaan ohjaa osan läpiajosta kehäkaduille.',
      'Huoltoliikenteelle ja liikuntarajoitteisten saattoliikenteelle jäisi erikseen määritellyt reitit. Kaupunki arvioi kuitenkin, että ensimmäisen vuoden aikana osa asiointiliikenteestä voi siirtyä viereisille kaduille, minkä vuoksi vaikutuksia seurattaisiin ennen pysyviä ratkaisuja.',
      'Yrittäjäjärjestöt ovat pitäneet saavutettavuutta koskevia selvityksiä riittämättöminä, kun taas joukkoliikenteen käyttäjäryhmät korostavat nykyisten ruuhkien heikentävän keskustan ennakoitavuutta. Lausuntokierroksen jälkeen suunnitelmaa voidaan vielä muuttaa.',
    ],
    questions: [
      {
        type: 'main_idea',
        prompt: 'Mikä kuvaa parhaiten luonnoksen perusratkaisua?',
        options: ['Läpiajoliikennettä ohjataan muualle, mutta tarpeellista asiointi- ja huoltoliikennettä ei kielletä kokonaan', 'Kaikki autoliikenne kielletään keskustassa', 'Nykyiset järjestelyt säilytetään ilman seurantaa'],
        correct: 0,
      },
      {
        type: 'inference',
        prompt: 'Miksi ensimmäisen vuoden vaikutuksia seurataan?',
        options: ['Koska liikenne voi siirtyä odottamattomasti lähikaduille', 'Koska joukkoliikenne lopetetaan vuodeksi', 'Koska yrittäjäjärjestöt ovat jo hyväksyneet suunnitelman'],
        correct: 0,
      },
      {
        type: 'inference',
        prompt: 'Mitä kolmas kappale osoittaa päätöksenteosta?',
        options: ['Eri ryhmät painottavat eri vaikutuksia ja luonnos voi vielä muuttua', 'Kaikki osapuolet ovat jo samaa mieltä', 'Lausuntokierros on vain tiedoksi eikä vaikuta suunnitelmaan'],
        correct: 0,
      },
    ],
    tags: ['yhteiskunta', 'kaupunki'],
  }),
  makeReadingTask({
    id: 'reading.everyday.c1.subscription-terms',
    pathway: 'everyday',
    level: 'C1',
    title: 'Määräaikaisen palvelun ehdot',
    context: 'Vertaat digitaalisen palvelun tilausehtoja ennen ostopäätöstä.',
    readingGoal: 'Erota automaattinen jatkuminen, irtisanominen ja poikkeustilanteet.',
    estimatedMinutes: 10,
    documentType: 'policy',
    documentTitle: 'Tilauksen keskeiset ehdot',
    metadata: 'Fiktiivinen digitaalinen palvelu',
    segments: [
      'Kahdentoista kuukauden määräaikainen tilaus muuttuu kauden päättyessä toistaiseksi voimassa olevaksi, ellei asiakas peru jatkumista viimeistään seitsemän päivää ennen kauden päättymistä.',
      'Määräaikaista kautta ei voi tavallisesti irtisanoa kesken sopimuskauden. Jos palvelun keskeisiä ominaisuuksia poistetaan olennaisesti tai hinta muuttuu kesken määräajan muusta kuin veromuutoksesta johtuen, asiakkaalla on kuitenkin oikeus päättää tilaus muutoksen voimaantuloon.',
      'Toistaiseksi voimassa olevan tilauksen voi irtisanoa milloin tahansa. Päättyminen tapahtuu kuluvan laskutuskauden lopussa, eikä jo maksettua kautta hyvitetä osittain, ellei pakottavasta lainsäädännöstä muuta johdu.',
    ],
    questions: [
      {
        type: 'detail',
        prompt: 'Milloin määräaikainen tilaus jatkuu automaattisesti?',
        options: ['Jos asiakas ei peru jatkumista ajoissa', 'Vain jos asiakas vahvistaa jatkon erikseen', 'Se ei koskaan jatku automaattisesti'],
        correct: 0,
      },
      {
        type: 'inference',
        prompt: 'Missä tilanteessa määräaikaisen tilauksen voi päättää kesken kauden?',
        options: ['Kun palveluun tehdään olennainen ehtojen mukainen muutos', 'Kun asiakas ei enää käytä palvelua', 'Aina kuukauden lopussa'],
        correct: 0,
      },
      {
        type: 'inference',
        prompt: 'Mitä ilmaus “ellei pakottavasta lainsäädännöstä muuta johdu” tekee tekstissä?',
        options: ['Rajaa ehdon niin, että laki voi joissain tilanteissa syrjäyttää sen', 'Takaa aina täyden hyvityksen', 'Poistaa asiakkaan kaikki oikeudet'],
        correct: 0,
      },
    ],
    tags: ['asiointi', 'sopimusehdot'],
  }),
  makeReadingTask({
    id: 'reading.everyday.c2.editorial-nuance',
    pathway: 'everyday',
    level: 'C2',
    title: 'Mielipidetekstin hienovarainen kanta',
    context: 'Luet lehden kolumnia, jossa kirjoittaja suhtautuu varauksella suosittuun ratkaisuun.',
    readingGoal: 'Tunnista implisiittinen kanta, myönnytys ja retorinen rajaus.',
    estimatedMinutes: 12,
    documentType: 'announcement',
    documentTitle: 'Kun nopea ratkaisu ei ole sama kuin helppo ratkaisu',
    metadata: 'Fiktiivinen kolumni',
    segments: [
      'On ymmärrettävää, että ruuhkien keskellä kaivataan yhtä näkyvää toimenpidettä, jonka vaikutuksen voisi huomata jo seuraavana aamuna. Juuri siksi keskustelu maksuttomasta joukkoliikenteestä palaa säännöllisesti otsikoihin: ehdotus on helposti selitettävä ja sen tavoite houkutteleva.',
      'Silti hinnan poistaminen ei itsessään lisää vuoroja, korjaa vaihtoyhteyksiä tai ratkaise sitä, että osa matkoista alkaa ja päättyy alueilla, joilla palvelua on vähän. Maksuttomuus voi olla perusteltu osa kokonaisuutta, mutta jos siitä tehdään kokonaisuus, näkyvä ele uhkaa korvata vähemmän näyttävän kapasiteettityön.',
      'Kysymys ei siis ole siitä, pitäisikö lippujen olla halvempia, vaan siitä, missä järjestyksessä rajalliset eurot muuttuvat luotettaviksi matkoiksi. Poliittisesti vaikea vastaus saattaa olla, että paras ensimmäinen parannus ei ole se, jonka käyttäjä huomaa kassalla.',
    ],
    questions: [
      {
        type: 'inference',
        prompt: 'Mikä on kirjoittajan varsinainen kanta maksuttomuuteen?',
        options: ['Se voi olla osa ratkaisua, mutta ei korvaa palvelun kapasiteetin ja yhteyksien parantamista', 'Se on aina väärä ratkaisu', 'Se ratkaisee ruuhkat yksinään'],
        correct: 0,
      },
      {
        type: 'inference',
        prompt: 'Mitä ensimmäisen kappaleen myönnytys tekee argumentille?',
        options: ['Se tunnustaa ehdotuksen vetovoiman ennen sen rajausten käsittelyä', 'Se peruu koko myöhemmän kritiikin', 'Se todistaa hinnan olevan ainoa ongelma'],
        correct: 0,
      },
      {
        type: 'main_idea',
        prompt: 'Mikä vastakkainasettelu kantaa tekstiä?',
        options: ['Näkyvä hintatoimi vastaan vähemmän näkyvä palvelukyvyn parantaminen', 'Kaupunki vastaan maaseutu', 'Autoilu vastaan pyöräily'],
        correct: 0,
      },
    ],
    tags: ['mielipide', 'argumentaatio'],
  }),
  makeReadingTask({
    id: 'reading.everyday.c2.public-response',
    pathway: 'everyday',
    level: 'C2',
    title: 'Viranomaisen vastauksen rajaukset',
    context: 'Luet vastauksen, jossa oikaistaan väite mutta myönnetään epäselvä viestintä.',
    readingGoal: 'Erota faktan oikaisu, vastuun rajaus ja institutionaalinen myönnytys.',
    estimatedMinutes: 12,
    documentType: 'policy',
    documentTitle: 'Vastaus palvelumuutosta koskevaan palautteeseen',
    metadata: 'Fiktiivinen kaupungin vastaus',
    segments: [
      'Palautteessa todetaan, että asiointipiste olisi suljettu ilman ennakkoilmoitusta. Pisteen vakituista toimintaa ei kuitenkaan ole lopetettu, vaan se on ollut kolmena perjantaina suljettuna henkilöstökoulutuksen vuoksi. Sulkemisista päätettiin kaksi viikkoa etukäteen.',
      'On silti perusteltua huomauttaa, ettei verkkosivun poikkeusaukioloa koskeva tieto päivittynyt kaikille kieliversioille samanaikaisesti. Suomenkielinen tieto julkaistiin ajoissa, mutta englanninkielisen sivun päivitys viivästyi teknisen virheen vuoksi seuraavaan arkipäivään.',
      'Kaupunki ei näin ollen pidä väitettä pysyvästä tai ilmoittamattomasta sulkemisesta täsmällisenä. Samalla se katsoo, että tiedon eriaikainen julkaiseminen saattoi perustellusti synnyttää osalle asiakkaista vaikutelman puutteellisesta ennakkoviestinnästä.',
    ],
    questions: [
      {
        type: 'detail',
        prompt: 'Minkä väitteen vastaus kiistää?',
        options: ['Pisteen pysyvän tai täysin ilmoittamattoman sulkemisen', 'Englanninkielisen sivun päivitysviiveen', 'Henkilöstökoulutuksen järjestämisen'],
        correct: 0,
      },
      {
        type: 'inference',
        prompt: 'Mitä organisaatio samalla myöntää?',
        options: ['Eri kieliversioiden tiedotus ei ollut yhdenaikaista ja saattoi johtaa harhaan', 'Sulkemisesta ei tehty mitään päätöstä', 'Piste lopetetaan seuraavaksi pysyvästi'],
        correct: 0,
      },
      {
        type: 'inference',
        prompt: 'Miksi ilmaus “saattoi perustellusti synnyttää” on merkityksellinen?',
        options: ['Se tunnustaa asiakkaan kokemuksen mahdollisen perusteen hyväksymättä alkuperäistä väitettä kokonaan', 'Se osoittaa, että kaikki palaute oli virheellistä', 'Se siirtää vastuun kokonaan asiakkaalle'],
        correct: 0,
      },
    ],
    tags: ['viranomaisviestintä', 'sävy'],
  }),
];

export const PROFESSIONAL_READING_EXPANSION: readonly ReadingTask[] = [
  makeReadingTask({
    id: 'reading.professional.b1.meeting-followup',
    pathway: 'professional',
    level: 'B1',
    title: 'Kokouksen jatkotoimet',
    context: 'Luet tiimin kokousmuistiota ennen seuraavaa työpäivää.',
    readingGoal: 'Tunnista päätökset, vastuuhenkilöt ja määräajat.',
    estimatedMinutes: 6,
    documentType: 'workplace_procedure',
    documentTitle: 'Tiimipalaveri: sovitut jatkotoimet',
    metadata: 'Fiktiivinen työpaikkamuistio',
    segments: [
      'Tiimi sopi, että asiakaspalautteiden yhteenveto valmistellaan torstaihin mennessä. Anna kokoaa palautteet ja Mika tarkistaa luvut ennen lähettämistä.',
      'Uusi perehdytysohje käsitellään ensi maanantain kokouksessa. Jokainen lukee luonnoksen etukäteen ja merkitsee epäselvät kohdat kommentteihin.',
      'Perjantain asiakastilaisuudesta ei vielä tehty lopullista työnjakoa, koska osallistujamäärä vahvistuu vasta keskiviikkona.',
    ],
    questions: [
      {
        type: 'detail',
        prompt: 'Kuka tarkistaa palauteyhteenvedon luvut?',
        options: ['Anna', 'Mika', 'Jokainen tiimiläinen'],
        correct: 1,
      },
      {
        type: 'detail',
        prompt: 'Mitä kaikkien pitää tehdä ennen maanantain kokousta?',
        options: ['Lukea perehdytysohjeen luonnos', 'Laatia uusi asiakaskysely', 'Vahvistaa asiakastilaisuuden työnjako'],
        correct: 0,
      },
      {
        type: 'inference',
        prompt: 'Miksi perjantain työnjako on vielä avoin?',
        options: ['Osallistujamäärä ei ole vielä tiedossa', 'Kokous peruttiin', 'Mika on lomalla'],
        correct: 0,
      },
    ],
    tags: ['kokous', 'jatkotoimet', 'työelämä'],
  }),
  makeReadingTask({
    id: 'reading.professional.b1.customer-escalation',
    pathway: 'professional',
    level: 'B1',
    title: 'Asiakaspalautteen siirtäminen eteenpäin',
    context: 'Luet sisäistä ohjetta tilanteesta, jota et ratkaise itse.',
    readingGoal: 'Tunnista, milloin asia siirretään ja mitä tietoja mukaan tarvitaan.',
    estimatedMinutes: 7,
    documentType: 'workplace_procedure',
    documentTitle: 'Ohje: asiakkaan asian siirtäminen vastuuhenkilölle',
    metadata: 'Fiktiivinen työpaikkaohje',
    segments: [
      'Jos asiakas pyytää asiaa, jota et voi ratkaista omalla käyttöoikeudellasi, kerro rauhallisesti, että siirrät asian vastuuhenkilölle.',
      'Kirjaa siirtoon asiakkaan yhteydenottotapa, asian lyhyt kuvaus ja se, mitä asiakkaalle on jo luvattu. Älä lupaa käsittelyaikaa, jos sitä ei ole vahvistettu.',
      'Kiireelliseksi merkitään vain tilanne, joka täyttää yksikön erikseen määritellyt kiireellisyyskriteerit. Epävarmassa tilanteessa kysy vastuuhenkilöltä ennen merkintää.',
    ],
    questions: [
      {
        type: 'detail',
        prompt: 'Mitä siirtoon pitää kirjata?',
        options: ['Yhteydenottotapa, asian kuvaus ja jo luvatut asiat', 'Vain asiakkaan nimi', 'Työntekijän oma arvio asiakkaan luonteesta'],
        correct: 0,
      },
      {
        type: 'inference',
        prompt: 'Miksi käsittelyaikaa ei pidä luvata ilman vahvistusta?',
        options: ['Jotta asiakkaalle ei anneta varmistamatonta tietoa', 'Koska asiakkaalle ei saa kertoa mitään', 'Koska vastuuhenkilö ei käsittele kirjallisia siirtoja'],
        correct: 0,
      },
      {
        type: 'detail',
        prompt: 'Mitä teet, jos et tiedä onko asia kiireellinen?',
        options: ['Kysyt vastuuhenkilöltä', 'Merkitset aina kiireelliseksi', 'Jätät asian kirjaamatta'],
        correct: 0,
      },
    ],
    tags: ['asiakaspalvelu', 'eskalointi', 'työelämä'],
  }),
  makeReadingTask({
    id: 'reading.professional.b2.remote-work-policy',
    pathway: 'professional',
    level: 'B2',
    title: 'Etätyöohjeen poikkeukset',
    context: 'Tarkistat, milloin etätyöstä voi sopia ja milloin läsnäolo on pakollista.',
    readingGoal: 'Erota pääsääntö, poikkeukset ja hyväksymisvastuu.',
    estimatedMinutes: 8,
    documentType: 'policy',
    documentTitle: 'Etätyön periaatteet',
    metadata: 'Fiktiivinen henkilöstöohje',
    segments: [
      'Tehtävissä, joissa työ voidaan suorittaa tietoturvallisesti etänä, työntekijä voi sopia enintään kahdesta säännöllisestä etäpäivästä viikossa esihenkilön kanssa.',
      'Läsnäolo on kuitenkin tarpeen tehtävissä, joissa käsitellään vain työpaikan tiloissa käytettävää aineistoa, osallistutaan paikan päällä toteutettavaan palveluun tai perehdytetään uutta työntekijää sovitusti.',
      'Tilapäisestä lisäetäpäivästä voidaan sopia perustellusta syystä, jos työn jatkuvuus ei vaarannu. Ratkaisu tehdään tapauskohtaisesti eikä yksittäinen hyväksyntä muuta pysyvää viikkorytmiä.',
    ],
    questions: [
      {
        type: 'main_idea',
        prompt: 'Mikä on ohjeen perusmalli?',
        options: ['Säännöllisestä etätyöstä sovitaan esihenkilön kanssa, mutta tehtäväkohtaiset läsnäolotarpeet rajaavat sitä', 'Kaikki saavat automaattisesti kaksi etäpäivää', 'Etätyö on kokonaan kielletty'],
        correct: 0,
      },
      {
        type: 'detail',
        prompt: 'Milloin läsnäolo voi olla pakollista?',
        options: ['Kun tehtävä edellyttää paikan päällä olevaa aineistoa, palvelua tai perehdytystä', 'Aina maanantaisin', 'Vain jos työntekijä itse haluaa'],
        correct: 0,
      },
      {
        type: 'inference',
        prompt: 'Mitä yksi hyväksytty lisäetäpäivä merkitsee jatkoa varten?',
        options: ['Se ei automaattisesti muuta pysyvää viikkorytmiä', 'Se lisää pysyvän kolmannen etäpäivän', 'Se poistaa esihenkilön hyväksynnän tarpeen'],
        correct: 0,
      },
    ],
    tags: ['etätyö', 'henkilöstöohje', 'työelämä'],
  }),
  makeReadingTask({
    id: 'reading.professional.c1.change-brief',
    pathway: 'professional',
    level: 'C1',
    title: 'Toimintatapamuutoksen perustelumuistio',
    context: 'Valmistaudut keskusteluun prosessimuutoksesta.',
    readingGoal: 'Tunnista tavoite, riskit, siirtymävaiheen poikkeukset ja seurannan perusteet.',
    estimatedMinutes: 10,
    documentType: 'policy',
    documentTitle: 'Muistio: yhtenäisen käsittelyjonon käyttöönotto',
    metadata: 'Fiktiivinen organisaatiomuistio',
    segments: [
      'Nykyisessä mallissa yksiköt ylläpitävät omia käsittelyjonojaan, mikä on mahdollistanut paikallisen joustavuuden mutta vaikeuttanut kokonaiskuvan muodostamista. Ehdotettu yhteinen jono ei poista yksiköiden vastuuta, vaan tekee kuormituksen näkyväksi samassa näkymässä.',
      'Siirtymävaiheessa nopeus voi tilapäisesti heikentyä, koska luokittelukäytännöt yhdenmukaistetaan. Tämän vuoksi ensimmäisen kuukauden tavoitetta ei sidota käsittelymäärään vaan siihen, kuinka suuri osa asioista luokitellaan yhteisten määritelmien mukaisesti.',
      'Kriittiset asiakastilanteet säilyvät erillisessä kiireellisessä jonossa. Muutoksen onnistumista arvioidaan kolmen kuukauden kuluttua sekä läpimenoajan että uudelleenohjausten määrän perusteella.',
    ],
    questions: [
      {
        type: 'inference',
        prompt: 'Miksi ensimmäisen kuukauden mittari ei ole käsittelymäärä?',
        options: ['Koska alussa painotetaan yhteisen luokittelun omaksumista eikä nopeutta', 'Koska käsittely lopetetaan kuukaudeksi', 'Koska kiireellisiä asioita ei enää käsitellä'],
        correct: 0,
      },
      {
        type: 'detail',
        prompt: 'Mikä säilyy erillisenä yhteisestä jonosta?',
        options: ['Kriittisten tilanteiden kiireellinen jono', 'Kaikki yksiköiden vanhat jonot', 'Perehdytyksen kommenttilista'],
        correct: 0,
      },
      {
        type: 'main_idea',
        prompt: 'Mikä on muutoksen keskeinen tavoite?',
        options: ['Lisätä yhteistä näkyvyyttä kuormitukseen samalla kun vastuut säilyvät', 'Poistaa kaikki paikalliset vastuut', 'Maksimoida ensimmäisen viikon käsittelymäärä'],
        correct: 0,
      },
    ],
    tags: ['muutos', 'prosessi', 'työelämä'],
  }),
  makeReadingTask({
    id: 'reading.professional.c1.stakeholder-email',
    pathway: 'professional',
    level: 'C1',
    title: 'Sidosryhmäviestin ehdollinen sitoumus',
    context: 'Luet yhteistyökumppanin viestin ennen vastaamista.',
    readingGoal: 'Tunnista, mihin kumppani sitoutuu, mitä se ehdollistaa ja mitä se pyytää vahvistamaan.',
    estimatedMinutes: 10,
    documentType: 'message',
    documentTitle: 'Yhteistyön seuraava vaihe',
    metadata: 'Fiktiivinen kumppaniviesti',
    segments: [
      'Voimme varata asiantuntijamme marraskuun työpajoihin sillä oletuksella, että lopullinen sisältörunko valmistuu viimeistään 20.10. Tämän jälkeen tehtävät muutokset ovat mahdollisia, mutta niiden vaikutus aikatauluun arvioidaan erikseen.',
      'Budjettiraami vastaa alustavaa tarjoustamme, jos osallistujamäärä pysyy sovitussa haarukassa. Mikäli ryhmä kasvaa olennaisesti, tarvitsemme vahvistuksen lisäresursoinnista ennen kuin voimme luvata saman toteutusmallin.',
      'Pyydämme teiltä ensi viikkoon mennessä vahvistuksen sekä sisältörungon vastuuhenkilöstä että siitä, kuka hyväksyy mahdolliset aikatauluun vaikuttavat muutokset.',
    ],
    questions: [
      {
        type: 'detail',
        prompt: 'Mihin asiantuntijaresursointi on sidottu?',
        options: ['Sisältörungon valmistumiseen määräpäivään mennessä', 'Siihen, ettei sisältö koskaan muutu', 'Vain osallistujien palautteeseen'],
        correct: 0,
      },
      {
        type: 'inference',
        prompt: 'Milloin alustava budjettiraami ei välttämättä enää riitä?',
        options: ['Jos osallistujamäärä kasvaa olennaisesti', 'Jos vastuuhenkilö nimetään ajoissa', 'Jos sisältörunko valmistuu 20.10.'],
        correct: 0,
      },
      {
        type: 'main_idea',
        prompt: 'Mitä kumppani pyytää seuraavaksi?',
        options: ['Kahta vastuuvahvistusta ennen etenemistä', 'Koko projektin peruuttamista', 'Uutta tarjousta ilman ehtoja'],
        correct: 0,
      },
    ],
    tags: ['sidosryhmät', 'sähköposti', 'työelämä'],
  }),
  makeReadingTask({
    id: 'reading.professional.c2.board-summary',
    pathway: 'professional',
    level: 'C2',
    title: 'Johtoryhmäyhteenvedon painotukset',
    context: 'Luet tiiviin päätösvalmistelun, jossa vaihtoehtoja ei aseteta yksinkertaiseen paremmuusjärjestykseen.',
    readingGoal: 'Tunnista eksplisiittinen suositus, implisiittiset varaukset ja päätöksenteon epävarmuus.',
    estimatedMinutes: 12,
    documentType: 'policy',
    documentTitle: 'Päätösvalmistelu: palvelukanavien uudelleenpainotus',
    metadata: 'Fiktiivinen johtoryhmämuistio',
    segments: [
      'Aineisto tukee digitaalisen asioinnin osuuden kasvattamista tilanteissa, joissa asiakkaan tarve on ennakoitava ja palvelupolku vakio. Samaa johtopäätöstä ei voida sellaisenaan ulottaa tapauksiin, joissa asian arviointi edellyttää usean tiedonlähteen yhdistämistä tai merkittävää harkintaa.',
      'Kustannusvertailu suosii digitaalista kanavaa yksittäisen kontaktin hinnalla mitattuna, mutta laskelma ei sisällä niitä uusintayhteydenottoja, jotka voivat johtua epäonnistuneesta itsepalvelusta. Nykyinen aineisto ei riitä tämän vaikutuksen luotettavaan kvantifiointiin.',
      'Suositus on siksi vaiheittainen: vakioitavat palvelut siirretään ensisijaisesti digitaaliseen kanavaan, kun taas harkintaa vaativissa palveluissa digitaalista osuutta kasvatetaan vasta, jos seurantatieto osoittaa kokonaiskontaktien eikä vain ensikontaktien vähenevän.',
    ],
    questions: [
      {
        type: 'main_idea',
        prompt: 'Mikä on muistion varsinainen suositus?',
        options: ['Eri palvelut digitalisoidaan eri tahdissa niiden luonteen ja seurantatiedon perusteella', 'Kaikki palvelut siirretään kerralla verkkoon', 'Digitaalista asiointia vähennetään kaikissa palveluissa'],
        correct: 0,
      },
      {
        type: 'inference',
        prompt: 'Mikä rajoittaa kustannusvertailun tulkintaa?',
        options: ['Se ei sisällä mahdollisia epäonnistuneen itsepalvelun uusintakontakteja', 'Se käyttää liian korkeaa henkilöstöhintaa', 'Se mittaa vain puhelinpalvelua'],
        correct: 0,
      },
      {
        type: 'inference',
        prompt: 'Miksi tekstissä erotetaan ensikontaktit ja kokonaiskontaktit?',
        options: ['Koska halpa ensikontakti ei osoita tehokkuutta, jos sama asia synnyttää myöhemmin lisää kontakteja', 'Koska ensikontakteja ei lasketa kustannuksiin', 'Koska kokonaiskontakteja ei voida mitata'],
        correct: 0,
      },
    ],
    tags: ['päätösvalmistelu', 'analyysi', 'työelämä'],
  }),
  makeReadingTask({
    id: 'reading.professional.c2.policy-wording',
    pathway: 'professional',
    level: 'C2',
    title: 'Ohjetekstin vastuunrajaukset',
    context: 'Vertaat ohjeen pääsääntöä ja sen tarkoituksellisesti kapeaa poikkeusta.',
    readingGoal: 'Tunnista normatiivinen pääsääntö, harkintavara ja poikkeuksen soveltamisraja.',
    estimatedMinutes: 12,
    documentType: 'workplace_procedure',
    documentTitle: 'Ohje: poikkeaminen määräajasta',
    metadata: 'Fiktiivinen sisäinen ohje',
    segments: [
      'Määräaikaa noudatetaan lähtökohtaisesti myös silloin, kun asian ratkaiseminen edellyttää lisäselvitystä. Lisäselvityksen tarve ei yksin muodosta perustetta siirtää asiaa seuraavaan käsittelyjaksoon.',
      'Jos ratkaisu olisi kuitenkin olennaisesti epäluotettava ilman sellaista tietoa, jota yksikkö ei voi kohtuudella hankkia määräajassa, vastuuhenkilö voi kirjallisesti perustellen hyväksyä rajatun määräajan ylityksen. Hyväksyntä koskee kyseistä asiaa eikä muuta muiden asioiden käsittelyjärjestystä.',
      'Poikkeusta ei tule käyttää ennakoitavissa olevan resurssivajeen yleisenä tasauskeinona. Toistuvat poikkeuspyynnöt käsitellään erikseen prosessin kapasiteettikysymyksenä, eivät yksittäisinä määräaikaratkaisuina.',
    ],
    questions: [
      {
        type: 'detail',
        prompt: 'Mikä ei yksin riitä poikkeuksen perusteeksi?',
        options: ['Lisäselvityksen tarve', 'Olennaisesti epäluotettavan ratkaisun riski', 'Vastuuhenkilön kirjallinen hyväksyntä'],
        correct: 0,
      },
      {
        type: 'inference',
        prompt: 'Miksi hyväksynnän sanotaan koskevan vain kyseistä asiaa?',
        options: ['Jotta yksittäinen poikkeus ei muutu yleiseksi käytännöksi', 'Jotta kaikki muut asiat siirtyvät automaattisesti', 'Jotta hyväksyntää ei tarvitse perustella'],
        correct: 0,
      },
      {
        type: 'inference',
        prompt: 'Miten ohje käsittelee toistuvia poikkeuspyyntöjä?',
        options: ['Merkkinä laajemmasta kapasiteettiongelmasta', 'Todisteena siitä, että määräajat voidaan poistaa', 'Yksittäisinä tapauksina ilman seurantaa'],
        correct: 0,
      },
    ],
    tags: ['ohje', 'vastuunrajaus', 'työelämä'],
  }),
];
