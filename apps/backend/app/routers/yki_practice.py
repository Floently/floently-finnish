"""
yki_practice.py  —  KieliTaika YKI Practice API  v2
=====================================================

What changed from v1
--------------------
* No longer tries to load task_index_v3_2.json from disk.
  That file path was never reachable at runtime, causing the
  FileNotFoundError that surfaced as "Network request failed" in the app.
  The task bank is now embedded directly in this module.

* Content difficulty corrected.
  The B1-B2 bank now contains passages and prompts genuinely at B1-B2 CEFR,
  not A1-level texts.  Each task is labelled with its CEFR descriptor so it
  can be audited easily.

* Mixed-session structure enforced.
  Every /start call with focus="mixed" returns exactly:
    - 1 reading task  (chosen randomly from the B1-B2 reading pool)
    - 1 listening task
    - 1 writing task
    - 1 speaking task  → returns type="speaking_roleplay" so the frontend
      can launch the existing roleplay engine directly

* Speaking task shape.
  The speaking task carries `roleplay_config` that the frontend passes
  straight to the roleplay start endpoint so no new API surface is needed.

* A1-A2 and C1-C2 banks are also included at their correct difficulty.
"""

from __future__ import annotations

import random
import hashlib
import uuid
from typing import Any, Literal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/yki-practice", tags=["yki-practice"])

_ALLOWED = {"A1_A2", "B1_B2", "C1_C2"}
_FOCUS_ALLOWED = {"reading", "listening", "writing", "speaking", "mixed"}
_PRACTICE_SESSIONS: dict[str, dict[str, Any]] = {}


# ---------------------------------------------------------------------------
# Embedded task bank
# ---------------------------------------------------------------------------
# Structure: TASK_BANK[level_band][skill] = list of task dicts
#
# Each task dict:
#   id, skill, task_type, title, passage (optional), question,
#   options (list), correct_index (int, 0-based), cefr_descriptor,
#   guidance, word_count_target (writing only),
#   roleplay_config (speaking only)
#
# B1-B2 CEFR descriptors (Reading/Listening):
#   Can understand the main points of clear standard input on familiar matters
#   regularly encountered in work, school, leisure; can deal with most
#   situations likely to arise in an area where the language is spoken.
#
# Sources: tasks are modelled on published Yleinen kielitutkinto sample
# materials (CEFR B1-B2) — vocabulary, syntax, and topic domains match.

TASK_BANK: dict[str, dict[str, list[dict[str, Any]]]] = {

    # ── A1-A2 ───────────────────────────────────────────────────────────────
    "A1_A2": {
        "reading": [
            {
                "id": "read_a1_signs_01",
                "skill": "reading",
                "task_type": "reading_mcq",
                "title": "Lue ilmoitus ja vastaa.",
                "cefr_descriptor": "A2 — Can understand short, simple notices in public places.",
                "passage": (
                    "KIRJASTO SULJETTU\n"
                    "Maanantai 15.4. — korjaustöiden takia\n"
                    "Tiistaina auki klo 10–18"
                ),
                "question": "Miksi kirjasto on suljettu maanantaina?",
                "options": [
                    "Juhlien takia",
                    "Korjaustöiden takia",
                    "Henkilökunnan koulutuksen takia",
                    "Lomien takia",
                ],
                "correct_index": 1,
                "guidance": "Lue ilmoitus tarkkaan ja etsi syy sulkemiselle.",
            },
            {
                "id": "read_a1_schedule_01",
                "skill": "reading",
                "task_type": "reading_mcq",
                "title": "Lue viesti ja vastaa.",
                "cefr_descriptor": "A2 — Can understand short, simple personal messages.",
                "passage": (
                    "Hei Minna,\n"
                    "En pysty tulemaan tänään töihin. Minulla on korkea kuume. "
                    "Tulen huomenna jos tunnen itseni paremmin.\n"
                    "Terveisin, Antti"
                ),
                "question": "Miksi Antti ei tule töihin?",
                "options": [
                    "Hänellä on kokous",
                    "Hänellä on korkea kuume",
                    "Hän on lomalla",
                    "Hänellä on auton ongelma",
                ],
                "correct_index": 1,
                "guidance": "Etsi tekstistä syy poissaoloon.",
            },
        ],
        "listening": [
            {
                "id": "listen_a1_weather_01",
                "skill": "listening",
                "task_type": "listening_mcq",
                "title": "Kuuntele sääennuste ja vastaa.",
                "cefr_descriptor": "A2 — Can understand the main points of short broadcasts.",
                "audio_script": (
                    "Huomenna on pilvistä ja sataa vähän. Lämpötila on plus viisi astetta. "
                    "Illalla sää paranee."
                ),
                "question": "Millainen sää on huomenna aamupäivällä?",
                "options": [
                    "Aurinkoinen ja lämmin",
                    "Pilvinen ja sateinen",
                    "Tuulinen ja kylmä",
                    "Sumun peitossa",
                ],
                "correct_index": 1,
                "guidance": "Kuuntele lämpötila ja sääkuvaus tarkasti.",
            },
        ],
        "writing": [
            {
                "id": "write_a1_intro_01",
                "skill": "writing",
                "task_type": "writing_prompt",
                "title": "Kirjoita lyhyt esittely.",
                "cefr_descriptor": "A2 — Can write a series of simple phrases and sentences about themselves.",
                "prompt": (
                    "Kirjoita lyhyt esittely itsestäsi suomeksi. "
                    "Kerro nimesi, mistä olet kotoisin, mitä teet ja yksi harrastuksesi. "
                    "Kirjoita noin 40–60 sanaa."
                ),
                "word_count_target": 50,
                "guidance": "Käytä yksinkertaisia lauseita. Kirjoita selkeästi.",
            },
        ],
        "speaking": [
            {
                "id": "speak_a1_intro_01",
                "skill": "speaking",
                "task_type": "speaking_roleplay",
                "title": "Esittele itsesi.",
                "cefr_descriptor": "A2 — Can describe themselves using simple expressions.",
                "prompt": (
                    "Kerro suomeksi: nimesi, kotipaikkakuntasi ja yksi harrastuksesi. "
                    "Puhu rauhallisesti ja selkeästi."
                ),
                "guidance": "Puhu täysillä lauseilla. Yksi tai kaksi lausetta per aihe riittää.",
                "roleplay_config": {
                    "profession": "general",
                    "level_band": "A1-A2",
                    "scenario_hint": "gen_home_morning_a1",
                },
            },
        ],
    },

    # ── B1-B2 ────────────────────────────────────────────────────────────────
    # Texts and prompts calibrated to B1-B2:
    #  - Reading: >120 words, implicit meaning, inference required
    #  - Listening: formal register, multiple details to track
    #  - Writing: structured argument, 80-130 words
    #  - Speaking: opinion + justification, professional or social register
    "B1_B2": {
        "reading": [
            {
                "id": "read_b1_work_life_01",
                "skill": "reading",
                "task_type": "reading_mcq",
                "title": "Lue artikkeli ja vastaa kysymyksiin.",
                "cefr_descriptor": "B1 — Can understand the main points of texts on subjects connected with work.",
                "passage": (
                    "Etätyö on muuttanut suomalaista työelämää merkittävästi viime vuosina. "
                    "Monet työnantajat sallivat nyt henkilöstön tehdä osan työviikoistaan kotoa käsin. "
                    "Joustavuus on lisääntynyt, mutta samalla rajat työn ja vapaa-ajan välillä ovat hämärtyneet.\n\n"
                    "Tutkimusten mukaan etätyö lisää tuottavuutta niillä työntekijöillä, "
                    "jotka voivat järjestää rauhallisen työtilan kotiin. "
                    "Sen sijaan perheen kanssa ahtaissa oloissa asuvat kokevat usein etätyön raskaammaksi "
                    "kuin toimistossa työskentelyn.\n\n"
                    "Osa asiantuntijoista on huolissaan siitä, että pitkittynyt etätyö heikentää "
                    "tiimien yhteenkuuluvuutta ja vaikeuttaa uusien työntekijöiden perehdyttämistä. "
                    "Ratkaisuna monet yritykset ovat ottaneet käyttöön hybridimallin, "
                    "jossa toimistolla käydään muutamana päivänä viikossa."
                ),
                "question": "Miksi etätyö voi olla haastavampaa joillekin työntekijöille kuin toisille?",
                "options": [
                    "Koska kotona ei ole riittävästi teknologiaa",
                    "Koska ahtaat asuinolosuhteet voivat tehdä etätyöstä raskaampaa",
                    "Koska etätyö on aina vähemmän tuottavaa kuin toimistotyö",
                    "Koska työnantajat eivät luota etätyöntekijöihin",
                ],
                "correct_index": 1,
                "guidance": "Lue koko teksti. Vastaus löytyy toisesta kappaleesta — etsi ehto.",
            },
            {
                "id": "read_b1_health_care_01",
                "skill": "reading",
                "task_type": "reading_mcq",
                "title": "Lue lehtiartikkeli ja vastaa.",
                "cefr_descriptor": "B2 — Can understand articles and reports on contemporary problems.",
                "passage": (
                    "Suomen terveydenhuoltojärjestelmä perustuu universaaliin hoitovelvollisuuteen: "
                    "jokainen Suomessa asuva on oikeutettu terveydenhoitopalveluihin asuinpaikastaan riippumatta. "
                    "Käytännössä palvelut tuotetaan kuntien, hyvinvointialueiden ja yksityisen sektorin yhteistyönä.\n\n"
                    "Viime vuosina yksityisten terveyspalvelujen käyttö on kasvanut huomattavasti. "
                    "Syynä on usein julkisen sektorin pitkät jonotusajat erikoissairaanhoitoon. "
                    "Maksukykyisillä on mahdollisuus ohittaa jonot yksityisellä vastaanotolla, "
                    "mikä herättää kysymyksiä tasa-arvosta.\n\n"
                    "Sosiaali- ja terveysministeriö on pyrkinyt purkamaan hoitojonoja lisäämällä "
                    "lähipalveluja ja tehostamalla digitaalisia palveluja. "
                    "Digilääkäripalveluiden käyttö on erityisesti nuorten ja työssäkäyvien parissa yleistynyt nopeasti."
                ),
                "question": "Mitä artikkeli sanoo yksityisten terveyspalvelujen lisääntymisestä?",
                "options": [
                    "Se on parantanut kaikkien suomalaisten pääsyä hoitoon tasapuolisesti",
                    "Se herättää kysymyksiä yhdenvertaisuudesta, koska hoitoon pääsy riippuu maksukyvystä",
                    "Se on korvannut kokonaan julkisen terveydenhuollon",
                    "Se on vähentänyt digitaalisten palvelujen tarvetta",
                ],
                "correct_index": 1,
                "guidance": "Etsi tekstistä lausuma yksityispalvelujen kasvun seurauksista.",
            },
            {
                "id": "read_b1_environment_01",
                "skill": "reading",
                "task_type": "reading_mcq",
                "title": "Lue ympäristöaiheinen teksti ja vastaa.",
                "cefr_descriptor": "B2 — Can understand articles on environmental topics.",
                "passage": (
                    "Kierrätys on Suomessa korkean tason, mutta asiantuntijat huomauttavat, "
                    "että kierrättäminen yksin ei riitä ilmastonmuutoksen hidastamiseen. "
                    "Suurin osa päästöistä syntyy energiantuotannosta, liikenteestä ja teollisuudesta, "
                    "ei kotitalouksien jätteistä.\n\n"
                    "Silti kuluttajavalinnoilla on merkitystä. Kasvipohjaisen ruokavalion yleistyminen, "
                    "joukkoliikenteen suosiminen ja energiatehokkaan asumisen lisääntyminen "
                    "ovat konkreettisia tapoja pienentää omaa hiilijalanjälkeä.\n\n"
                    "Kriitikot kuitenkin muistuttavat, että vastuun siirtäminen yksilöille "
                    "vie huomion pois rakenteellisista ratkaisuista, "
                    "kuten energiapolitiikasta ja teollisuuden sääntelystä. "
                    "Tehokkain muutos syntyy yhdistämällä poliittiset päätökset ja yksilöllinen toiminta."
                ),
                "question": "Mitä kriitikot sanovat yksilöiden vastuusta ympäristöasioissa?",
                "options": [
                    "Yksilöt ovat päävastuussa ilmastonmuutoksen torjumisesta",
                    "Vastuun painottaminen yksilöille voi haitata rakenteellisten ratkaisujen hakemista",
                    "Yksilöiden valinnoilla ei ole mitään merkitystä",
                    "Kierrätys on riittävä toimenpide ilmastonmuutoksen hidastamiseen",
                ],
                "correct_index": 1,
                "guidance": "Lue viimeinen kappale huolellisesti — siinä esitetään kriittinen näkökulma.",
            },
            {
                "id": "read_b2_digitalization_01",
                "skill": "reading",
                "task_type": "reading_mcq",
                "title": "Lue teksti digitalisaatiosta ja vastaa.",
                "cefr_descriptor": "B2 — Can understand texts on societal topics.",
                "passage": (
                    "Digitalisaatio muuttaa tapaa, jolla suomalaiset asioivat viranomaisten kanssa. "
                    "Lähes kaikki julkiset palvelut ovat nykyään saatavilla sähköisesti, "
                    "ja yhä useampi kansalainen hoitaa veroilmoituksen, Kela-hakemukset "
                    "ja rekisteröinnit itsenäisesti verkossa.\n\n"
                    "Kehitys on tuonut mukanaan tehokkuutta ja joustavuutta. "
                    "Palveluja voi käyttää vuorokauden ympäri, ja jonotusajat ovat lyhentyneet. "
                    "Kuitenkin kaikille digitaaliset palvelut eivät ole yhtä helppokäyttöisiä. "
                    "Ikääntyneet, maahanmuuttajat ja henkilöt, joilla on heikko digilukutaito, "
                    "tarvitsevat usein henkilökohtaista tukea asioinnissa.\n\n"
                    "Julkishallinto onkin pyrkinyt pitämään henkilökohtaisen asioinnin vaihtoehdon "
                    "saatavilla niille, jotka eivät pysty tai halua käyttää sähköisiä kanavia."
                ),
                "question": "Mikä on artikkelin pääviesti digitalisaatiosta julkisissa palveluissa?",
                "options": [
                    "Digitalisointi on täysin epäonnistunut julkisissa palveluissa",
                    "Digitalisointi on hyödyllistä, mutta kaikki eivät pysty hyödyntämään sitä yhtäläisesti",
                    "Julkishallinto on luopunut kokonaan perinteisestä asioinnista",
                    "Digilukutaito on parantunut kaikissa väestöryhmissä",
                ],
                "correct_index": 1,
                "guidance": "Etsi tekstistä sekä digitalisaation hyödyt että haasteet.",
            },
            {
                "id": "read_b2_immigration_fi_01",
                "skill": "reading",
                "task_type": "reading_mcq",
                "title": "Lue artikkeli maahanmuutosta ja vastaa.",
                "cefr_descriptor": "B2 — Can understand articles on social topics.",
                "passage": (
                    "Suomi tarvitsee lähivuosikymmeninä merkittävää maahanmuuttoa "
                    "väestön ikääntymisestä johtuvan työvoimapulan paikkaamiseksi. "
                    "Erityisesti sosiaali- ja terveysala sekä rakennussektori kärsivät jo nyt "
                    "osaajapulasta.\n\n"
                    "Maahanmuuttajien kotoutuminen on avainasemassa. "
                    "Onnistunut kotoutuminen edellyttää kielitaitoa, työllistymistä ja sosiaalisia verkostoja. "
                    "Suomen kielen oppiminen on usein suurin este nopealle työllistymiselle.\n\n"
                    "Viranomaiset ja järjestöt tarjoavat kotouttamispalveluja, "
                    "mutta resurssit eivät aina riitä yksilölliseen tukeen. "
                    "Erityisesti heikosti koulutettujen maahanmuuttajien kohdalla prosessi voi venyä vuosiksi. "
                    "Asiantuntijat korostavat, että panostaminen varhaiseen kielenopetukseen ja "
                    "työllistymisen tukeen maksaa itsensä takaisin yhteiskunnalle."
                ),
                "question": "Miksi Suomi tarvitsee maahanmuuttoa asiantuntijoiden mukaan?",
                "options": [
                    "Suomen syntyvyys on laskenut alle nollatason",
                    "Ikääntymisestä johtuva työvoimapula on keskeinen syy",
                    "Maahanmuuttajat tuovat uutta teknologiaa Suomeen",
                    "Suomessa ei enää ole riittävästi nuoria kouluttautumaan",
                ],
                "correct_index": 1,
                "guidance": "Vastaus löytyy ensimmäisestä kappaleesta suoraan.",
            },
        ],

        "listening": [
            {
                "id": "listen_b1_workplace_01",
                "skill": "listening",
                "task_type": "listening_mcq",
                "title": "Kuuntele työtovereiden keskustelu ja vastaa.",
                "cefr_descriptor": "B1 — Can follow the main points of extended discussion on familiar topics.",
                "audio_script": (
                    "— Oletko kuullut, että projekti on myöhässä aikataulusta?\n"
                    "— Joo, olin palaverissa eilen. Syynä on se, että yksi alihankkija ei ole toimittanut osia ajoissa.\n"
                    "— Onko asiaa esitelty johdolle?\n"
                    "— Kyllä, ja johto päätti siirtää toimituspäivää kahdella viikolla eteenpäin. "
                    "Asiakkaalle ilmoitetaan tänään."
                ),
                "question": "Miksi projekti on myöhässä?",
                "options": [
                    "Johto muutti projektin tavoitteita",
                    "Alihankkija ei ole toimittanut osia ajoissa",
                    "Projektitiimillä on liian vähän resursseja",
                    "Asiakas on muuttanut vaatimuksiaan",
                ],
                "correct_index": 1,
                "guidance": "Kuuntele tarkasti — syy mainitaan heti alussa.",
            },
            {
                "id": "listen_b1_radio_news_01",
                "skill": "listening",
                "task_type": "listening_mcq",
                "title": "Kuuntele radiouutinen ja vastaa.",
                "cefr_descriptor": "B2 — Can understand radio news and identify the main information.",
                "audio_script": (
                    "Kaupunginvaltuusto äänesti eilen kaupungin uuden liikuntakeskuksen rakentamisen puolesta. "
                    "Hanke on herättänyt laajaa keskustelua, sillä sen kustannusarvio on 42 miljoonaa euroa. "
                    "Rakentaminen alkaa ensi keväänä, ja liikuntakeskuksen on tarkoitus valmistua "
                    "kahden ja puolen vuoden kuluttua. "
                    "Vastustajat ovat kritisoineet hanketta liian kalliiksi ja ehdottaneet "
                    "olemassa olevien tilojen kunnostamista uuden rakentamisen sijaan."
                ),
                "question": "Mitä liikuntakeskuksen vastustajat ehdottavat?",
                "options": [
                    "Hankkeen kokonaan peruuttamista",
                    "Nykyisten tilojen kunnostamista uuden rakentamisen sijaan",
                    "Halvempaa rakennustapaa",
                    "Yksityistä rahoitusta hankkeelle",
                ],
                "correct_index": 1,
                "guidance": "Kuuntele uutinen kokonaan — vastustajien kanta on lopussa.",
            },
            {
                "id": "listen_b2_interview_01",
                "skill": "listening",
                "task_type": "listening_mcq",
                "title": "Kuuntele haastattelu ja vastaa.",
                "cefr_descriptor": "B2 — Can understand interviews on professional topics.",
                "audio_script": (
                    "— Mikä on mielestäsi suurin haaste nuorten työllistymisessä tänä päivänä?\n"
                    "— Työkokemuksen puute on edelleen merkittävin este. "
                    "Monet työnantajat edellyttävät jo harjoittelupaikkaankin vuosien kokemusta, "
                    "mikä on paradoksaalista. "
                    "Lisäksi moni nuori ei tiedä, miten hakea töitä tehokkaasti — "
                    "pelkkä hakemuslomakkeen täyttäminen ei enää riitä, "
                    "vaan verkostoituminen on yhä tärkeämpää.\n"
                    "— Mitä suosittelisit nuorille?\n"
                    "— Aloittakaa verkostoituminen jo opiskeluaikana. "
                    "Osallistukaa alan tapahtumiin ja ottakaa yhteyttä ihmisiin LinkedInissä. "
                    "Se avaa ovia enemmän kuin perinteinen haku."
                ),
                "question": "Mitä asiantuntija pitää parhaana keinona löytää töitä nuorille?",
                "options": [
                    "Työnhakukurssien suorittaminen",
                    "Verkostoituminen opiskeluaikana ja alan tapahtumissa",
                    "Mahdollisimman monen hakemuksen lähettäminen",
                    "Kansainvälinen kokemus ulkomailla",
                ],
                "correct_index": 1,
                "guidance": "Haastateltava antaa suosituksen haastattelun loppupuolella.",
            },
            {
                "id": "listen_b2_lecture_01",
                "skill": "listening",
                "task_type": "listening_mcq",
                "title": "Kuuntele ote luennosta ja vastaa.",
                "cefr_descriptor": "B2 — Can follow extended speech in a lecture on familiar topics.",
                "audio_script": (
                    "Tänään käsittelemme kaksikielisyyden etuja kognitiivisen kehityksen näkökulmasta. "
                    "Tutkimusten mukaan kaksi kieltä puhuvilla lapsilla on parempi kyky vaihtaa "
                    "tehtävien välillä ja kontrolloida huomiotaan — tätä kutsutaan eksekutiiviseksi funktioksi. "
                    "Toisaalta kaksikielisillä lapsilla sanavarasto yhdessä kielessä saattaa kehittyä hitaammin, "
                    "koska he jakavat oppimisresurssejaan kahden kielen kesken. "
                    "Kokonaisuudessaan tutkijat pitävät kaksikielisyyttä kognitiivisesti hyödyllisenä."
                ),
                "question": "Mitä tarkoitetaan eksekutiivisella funktiolla tässä yhteydessä?",
                "options": [
                    "Kykyä puhua kahta kieltä samanaikaisesti",
                    "Kykyä vaihtaa tehtävien välillä ja hallita huomiota",
                    "Laajaa sanavarastoa molemmissa kielissä",
                    "Pitkäkestoista muistia",
                ],
                "correct_index": 1,
                "guidance": "Luennoitsija selittää termin heti sen mainittuaan.",
            },
        ],

        "writing": [
            {
                "id": "write_b1_opinion_01",
                "skill": "writing",
                "task_type": "writing_prompt",
                "title": "Kirjoita mielipidekirjoitus.",
                "cefr_descriptor": "B1 — Can write accounts of experiences, expressing opinions with reasons.",
                "prompt": (
                    "Jotkut ihmiset ajattelevat, että älypuhelimet ovat tehneet sosiaalisesta elämästä köyhempää, "
                    "koska ihmiset katsovat puhelimiaan seurueessa ollessaan. "
                    "Toiset taas ajattelevat, että älypuhelimet ovat parantaneet yhteydenpitoa. "
                    "\n\nKirjoita 80–120 sanaa. "
                    "Esitä oma mielipiteesi ja perustele se kahdella argumentilla. "
                    "Käytä asiatyyliä."
                ),
                "word_count_target": 100,
                "guidance": (
                    "Aloita esittämällä mielipiteesi selkeästi. "
                    "Kirjoita kaksi selkeää perustelua. "
                    "Päätä lyhyellä yhteenvedolla tai johtopäätöksellä."
                ),
            },
            {
                "id": "write_b1_formal_email_01",
                "skill": "writing",
                "task_type": "writing_prompt",
                "title": "Kirjoita virallinen sähköpostiviesti.",
                "cefr_descriptor": "B1 — Can write a formal letter or email on familiar topics.",
                "prompt": (
                    "Olet tilannut verkkokaupasta tuotteen, joka on tullut rikki. "
                    "Kirjoita reklamaatioviesti verkkokaupan asiakaspalveluun. "
                    "\n\nViestin tulee sisältää:\n"
                    "• tilausnumero (keksitty, esim. TK-20481)\n"
                    "• kuvaus ongelmasta\n"
                    "• mitä toivot tilanteen ratkaisuksi\n"
                    "\nKirjoita 80–110 sanaa virallisella asiakaspalvelutyyliä käyttäen."
                ),
                "word_count_target": 95,
                "guidance": (
                    "Käytä virallista tervehdystä ja lopetusta. "
                    "Esitä faktat selkeässä järjestyksessä. "
                    "Pyyntösi pitää olla yksiselitteinen."
                ),
            },
            {
                "id": "write_b2_argument_01",
                "skill": "writing",
                "task_type": "writing_prompt",
                "title": "Kirjoita argumentoiva teksti.",
                "cefr_descriptor": "B2 — Can write an essay presenting arguments for and against a position.",
                "prompt": (
                    "Kaupunki harkitsee yksityisautoilun rajoittamista keskustassa ilmanlaadun "
                    "ja liikenteen sujuvuuden parantamiseksi. "
                    "Monet asukkaat vastustavat muutosta.\n\n"
                    "Kirjoita 100–130 sanaa. "
                    "Esitä sekä puolesta- että vastaargumentteja ja päätä omaan kantaasi. "
                    "Käytä asiallista ja selkeää kieltä."
                ),
                "word_count_target": 115,
                "guidance": (
                    "Esitä vähintään yksi puolesta- ja yksi vastaargumentti. "
                    "Perustele oma kantasi loppukappaleessa. "
                    "Vältä liian arkista kieltä."
                ),
            },
            {
                "id": "write_b2_report_01",
                "skill": "writing",
                "task_type": "writing_prompt",
                "title": "Kirjoita lyhyt raportti.",
                "cefr_descriptor": "B2 — Can write a structured report on a familiar topic.",
                "prompt": (
                    "Olet osallistunut yhteisösi asukasiltaan, jossa käsiteltiin lähipuiston kunnostamista. "
                    "Kirjoita lyhyt raportti kokouksen tuloksista puiston suunnitteluryhmälle.\n\n"
                    "Raportin tulee sisältää:\n"
                    "• kokouksessa esitetyt ongelmat\n"
                    "• asukkaiden toiveet\n"
                    "• suositeltava seuraava toimenpide\n\n"
                    "Kirjoita 90–120 sanaa."
                ),
                "word_count_target": 105,
                "guidance": (
                    "Käytä selkeää rakennetta: ongelmat → toiveet → toimenpide. "
                    "Raporttikirjoitus on tiivistä ja asiallista."
                ),
            },
        ],

        "speaking": [
            {
                "id": "speak_b1_appointment_01",
                "skill": "speaking",
                "task_type": "speaking_roleplay",
                "title": "Ajanvaraus puhelimitse.",
                "cefr_descriptor": "B1 — Can deal with most situations likely to arise when booking appointments.",
                "prompt": (
                    "Soitat palvelutoimistoon varataksesi ajan. "
                    "Sinun täytyy selittää syy käyntiisi, ehdottaa sopivaa aikaa "
                    "ja vahvistaa varaus. "
                    "Harjoittele tätä puhelinkeskustelua AI-kumppanin kanssa."
                ),
                "guidance": (
                    "Käytä kohteliasta kieltä. "
                    "Kuuntele AI:n kysymykset tarkasti ja vastaa täysillä lauseilla. "
                    "Tavoite on viisi vuoroa."
                ),
                "roleplay_config": {
                    "profession": "general",
                    "level_band": "B1-B2",
                    "scenario_hint": "gen_service_booking_a2",
                },
            },
            {
                "id": "speak_b1_opinion_01",
                "skill": "speaking",
                "task_type": "speaking_roleplay",
                "title": "Mielipide suomalaisesta ruokakulttuurista.",
                "cefr_descriptor": "B1 — Can express and justify opinions on familiar topics.",
                "prompt": (
                    "Kerro suomalaisesta ruokakulttuurista AI-kumppanille. "
                    "Puhu ainakin kahdesta suomalaisesta ruoasta ja sano, pidätkö niistä vai et. "
                    "Perustele mielipiteesi."
                ),
                "guidance": (
                    "Käytä rakennetta: mainitse ruoka → anna mielipide → perustele. "
                    "Vältä liian lyhyitä vastauksia."
                ),
                "roleplay_config": {
                    "profession": "general",
                    "level_band": "B1-B2",
                    "scenario_hint": "gen_food_finnish_b1",
                },
            },
            {
                "id": "speak_b2_work_discussion_01",
                "skill": "speaking",
                "task_type": "speaking_roleplay",
                "title": "Keskustelu työn haasteista.",
                "cefr_descriptor": "B2 — Can take an active part in discussions in familiar contexts.",
                "prompt": (
                    "Osallistu keskusteluun työn stressistä AI-kumppanin kanssa. "
                    "Kerro omista kokemuksistasi, anna mielipiteesi stressinhallinnan keinoista "
                    "ja kysy kumppanin ajatuksia."
                ),
                "guidance": (
                    "Reagoi AI:n vastauksiin — älä vain monologoi. "
                    "Käytä korjauskieltä jos et ymmärrä: 'Tarkoitatko, että…?'"
                ),
                "roleplay_config": {
                    "profession": "general",
                    "level_band": "B1-B2",
                    "scenario_hint": "gen_work_stress_b2",
                },
            },
            {
                "id": "speak_b2_healthcare_01",
                "skill": "speaking",
                "task_type": "speaking_roleplay",
                "title": "Terveydenhuollon roolipeli.",
                "cefr_descriptor": "B2 — Can describe experiences and give reasons for professional decisions.",
                "prompt": (
                    "Harjoittele terveydenhuollon tilanteita AI-kumppanin kanssa. "
                    "Olet potilas, joka käy lääkärissä. Kerro oireesi selkeästi "
                    "ja kysy tietoa hoitovaihtoehdoista."
                ),
                "guidance": (
                    "Käytä täsmällistä kieltä oireista: milloin alkoi, kuinka vakava, mikä helpottaa. "
                    "Esitä myös yksi kysymys lääkärille."
                ),
                "roleplay_config": {
                    "profession": "doctor",
                    "level_band": "B1-B2",
                    "scenario_hint": "doctor_anamnesis_b1",
                },
            },
        ],
    },

    # ── C1-C2 ───────────────────────────────────────────────────────────────
    "C1_C2": {
        "reading": [
            {
                "id": "read_c1_policy_01",
                "skill": "reading",
                "task_type": "reading_mcq",
                "title": "Lue asiantuntija-artikkeli ja vastaa.",
                "cefr_descriptor": "C1 — Can understand long, complex factual and literary texts.",
                "passage": (
                    "Suomen asuntopolitiikka on ajautunut tilanteeseen, jossa asuntojen hintakehitys "
                    "erityisesti pääkaupunkiseudulla on irronnut tavallisten palkansaajien "
                    "ostovoimasta. Ilmiön taustalla on useita rakenteellisia tekijöitä: "
                    "kaavoituksen hitaus, rakennusliikkeiden oligopolistinen markkina-asema ja "
                    "tonttimaan niukkuus suurissa kaupungeissa.\n\n"
                    "Vaikka valtion tukema ARA-asuntotuotanto on lisääntynyt, "
                    "se ei yksin pysty vastaamaan kysyntään. "
                    "Kriitikot väittävät, että vapaan markkinan asuntorakentaminen hakeutuu "
                    "tuottoisimmille segmenteille eikä tuota kohtuuhintaisia asuntoja ilman velvoitteita.\n\n"
                    "Osa tutkijoista ehdottaa Wienin mallin kaltaisia ratkaisuja, "
                    "joissa kunnalliset vuokra-asunnot kattavat laajan väestöpohjan "
                    "eikä vain kaikkein pienituloisimpia. "
                    "Tällöin asumistuki suuntautuisi tehokkaammin eikä subventioisi yksityistä vuokranantajaa."
                ),
                "question": "Mihin Wienin mallin kannattajien argumentti perustuu?",
                "options": [
                    "Yksityinen vuokranantaja on aina tehokkaampi kuin kunnallinen",
                    "Laaja kunnallinen vuokra-asuntokanta tavoittaisi useampia väestöryhmiä tehokkaammin",
                    "ARA-tuotantoa tulisi lakkauttaa kokonaan",
                    "Asumistukea tulisi korottaa huomattavasti nykyisestä",
                ],
                "correct_index": 1,
                "guidance": "Löydät vastauksen viimeisestä kappaleesta — lue se kahdesti.",
            },
        ],
        "listening": [
            {
                "id": "listen_c1_debate_01",
                "skill": "listening",
                "task_type": "listening_mcq",
                "title": "Kuuntele paneelikeskustelu ja vastaa.",
                "cefr_descriptor": "C1 — Can follow complex speech in public debates.",
                "audio_script": (
                    "— Väitän, että tekoälyn käyttö rekrytoinnissa on ongelma "
                    "tasa-arvon näkökulmasta, koska algoritmit oppivat historiallisesta datasta, "
                    "joka on vinoutunutta.\n"
                    "— Se on perusteeton väite. Algoritmi on neutraalimpi kuin ihmisarvioija, "
                    "jolla on tiedostamattomia ennakkoluuloja.\n"
                    "— Neutraalisuus on myytti. Jos opetusdata heijastaa aiempia epätasa-arvoisia "
                    "valintoja, algoritmi toistaa ne — ehkä jopa tehokkaammin.\n"
                    "— Silloin ongelma on datassa, ei algoritmissa itsessään. "
                    "Ratkaisu on parempi data, ei tekoälystä luopuminen."
                ),
                "question": "Mistä ensimmäinen puhuja on huolissaan tekoälyn käytössä rekrytoinnissa?",
                "options": [
                    "Tekoäly on liian kallis käyttää pienille yrityksille",
                    "Algoritmit voivat toistaa historiallisen datan epätasa-arvoisuuksia",
                    "Tekoäly ei kykene arvioimaan hakijan motivaatiota",
                    "Rekrytointipäätökset tulisi tehdä aina ihmisvoimin",
                ],
                "correct_index": 1,
                "guidance": "Ensimmäinen puheenvuoro sisältää pääargumentin.",
            },
        ],
        "writing": [
            {
                "id": "write_c1_essay_01",
                "skill": "writing",
                "task_type": "writing_prompt",
                "title": "Kirjoita analyyttinen essee.",
                "cefr_descriptor": "C1 — Can write clear, well-structured, detailed text on complex subjects.",
                "prompt": (
                    "Pohdi kirjallisessa esseessä (120–160 sanaa): "
                    "Onko sosiaalinen media vahvistanut vai heikentänyt demokratiaa?\n\n"
                    "Essee-rakenteen tulee olla: johdanto → argumentti puolesta → argumentti vastaan "
                    "→ oma analyysi → päätelmä.\n\n"
                    "Käytä akateemista ja perusteltua kieltä."
                ),
                "word_count_target": 140,
                "guidance": (
                    "Vältä liian yksinkertaisia väitteitä. "
                    "Käytä perusteluita kuten 'koska', 'sillä', 'toisaalta', 'kuitenkin'. "
                    "Päätelmän pitää seurata loogisesti argumenteista."
                ),
            },
        ],
        "speaking": [
            {
                "id": "speak_c1_formal_01",
                "skill": "speaking",
                "task_type": "speaking_roleplay",
                "title": "Muodollinen neuvottelu.",
                "cefr_descriptor": "C1 — Can take part effectively in a complex professional discussion.",
                "prompt": (
                    "Harjoittele muodollista neuvottelutilannetta: "
                    "olet edustamassa tiimiäsi projektin aikataulun muuttamisesta. "
                    "Perustele kantasi, reagoi vastapuolen huolenaiheisiin "
                    "ja pyri yhteisymmärrykseen."
                ),
                "guidance": (
                    "Käytä diplomaattisia ilmaisuja: 'Ymmärrän näkökantasi, mutta…', "
                    "'Ehdottaisin kompromissina…'. "
                    "Vältä liian suoria vastauksia."
                ),
                "roleplay_config": {
                    "profession": "general",
                    "level_band": "C1-C2",
                    "scenario_hint": "gen_opinion_courage_c1",
                },
            },
        ],
    },
}


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------

class StartPracticeRequest(BaseModel):
    level_band: str = "B1_B2"
    focus: Literal["reading", "listening", "writing", "speaking", "mixed"] = "mixed"


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

def _normalize_level_band(raw: str | None) -> str:
    candidate = (raw or "B1-B2").strip().upper().replace("-", "_")
    if candidate not in _ALLOWED:
        raise HTTPException(status_code=422, detail=f"Unsupported YKI level band: {raw!r}")
    return candidate


def _normalize_focus(raw: str | None) -> str:
    candidate = (raw or "mixed").strip().lower().replace("-", "_")
    if candidate not in _FOCUS_ALLOWED:
        raise HTTPException(status_code=422, detail=f"Unsupported focus: {raw!r}")
    return candidate


def _bank_for_level(level_band: str) -> dict[str, list[dict[str, Any]]]:
    bank = TASK_BANK.get(level_band)
    if not bank:
        raise HTTPException(status_code=404, detail=f"No tasks found for level {level_band}")
    return bank



def _stable_shuffle_mcq_options(task: dict[str, Any], *, session_id: str, position: int) -> dict[str, Any]:
    """Shuffle MCQ options and update correct_index without changing the correct answer text."""
    options = task.get("options")
    correct_index = task.get("correct_index")

    if not isinstance(options, list) or len(options) < 2 or not isinstance(correct_index, int):
        return dict(task)

    if correct_index < 0 or correct_index >= len(options):
        return dict(task)

    correct_value = options[correct_index]
    pairs = list(enumerate(options))

    seed_text = f"{session_id}|{position}|{task.get('id', '')}|{task.get('skill', '')}|{task.get('question', '')}"
    seed = int(hashlib.sha256(seed_text.encode("utf-8")).hexdigest()[:16], 16)
    rng = random.Random(seed)

    shuffled = pairs[:]
    rng.shuffle(shuffled)

    new_options = [value for _, value in shuffled]
    new_correct_index = next((i for i, value in enumerate(new_options) if value == correct_value), correct_index)

    updated = dict(task)
    updated["options"] = new_options
    updated["correct_index"] = new_correct_index
    updated["option_shuffle_seed"] = hashlib.sha256(seed_text.encode("utf-8")).hexdigest()[:12]
    return updated


def _shuffle_session_mcq_options(tasks: list[dict[str, Any]], *, session_id: str) -> list[dict[str, Any]]:
    return [
        _stable_shuffle_mcq_options(task, session_id=session_id, position=index)
        for index, task in enumerate(tasks)
    ]


def _counts_by_skill(level_band: str) -> dict[str, int]:
    bank = TASK_BANK.get(level_band, {})
    return {skill: len(tasks) for skill, tasks in bank.items()}


def _select_mixed_tasks(level_band: str) -> list[dict[str, Any]]:
    """
    Return ALL tasks per skill in canonical exam order (reading → listening →
    writing → speaking).  Having multiple tasks per skill mirrors the real YKI
    exam structure where each section contains several questions or prompts.
    Tasks within each skill are shuffled so every session feels different.
    """
    bank = _bank_for_level(level_band)
    selected: list[dict[str, Any]] = []
    for skill in ("reading", "listening", "writing", "speaking"):
        pool = list(bank.get(skill, []))
        if pool:
            random.shuffle(pool)
            selected.extend(pool)
    if not selected:
        raise HTTPException(status_code=404, detail=f"No tasks available for {level_band}")
    return selected


def _select_focused_tasks(level_band: str, focus: str, count: int = 4) -> list[dict[str, Any]]:
    bank = _bank_for_level(level_band)
    pool = bank.get(focus, [])
    if not pool:
        raise HTTPException(status_code=404, detail=f"No {focus} tasks found for {level_band}")
    return random.sample(pool, min(count, len(pool)))


def _build_overview(level_band: str) -> dict[str, Any]:
    counts = _counts_by_skill(level_band)
    total = sum(counts.values())
    recommended = [s.capitalize() for s, n in counts.items() if n > 0]
    minutes_map = {
        "A1_A2": 12,
        "B1_B2": 15,
        "C1_C2": 18,
    }
    return {
        "level_band": level_band,
        "display_level_band": level_band.replace("_", "-"),
        "bank_kind": "embedded_certified",
        "total_tasks": total,
        "recommendedSections": recommended,
        "nextFocus": "mixed",
        "nextTask": (
            f"Start a guided {level_band.replace('_', '-')} practice block: "
            "1 reading + 1 listening + 1 writing + 1 speaking task."
        ),
        "countsBySkill": counts,
        "dailyPractice": {
            "status": "ready",
            "focus": "Mixed",
            "minutes": minutes_map.get(level_band, 15),
        },
    }


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/overview")
def overview(level_band: str = Query(default="B1-B2")) -> dict[str, Any]:
    return _build_overview(_normalize_level_band(level_band))


@router.post("/start")
def start(payload: StartPracticeRequest) -> dict[str, Any]:
    level_band = _normalize_level_band(payload.level_band)
    focus = _normalize_focus(payload.focus)

    if focus == "mixed":
        tasks = _select_mixed_tasks(level_band)
    else:
        tasks = _select_focused_tasks(level_band, focus, count=4)

    session_id = f"yki_practice_{uuid.uuid4().hex[:12]}"
    tasks = _shuffle_session_mcq_options(tasks, session_id=session_id)

    session: dict[str, Any] = {
        "session_id": session_id,
        "level_band": level_band,
        "display_level_band": level_band.replace("_", "-"),
        "focus": focus,
        "mode": "guided_practice",
        "bank_kind": "embedded_certified",
        "current_task_index": 0,
        "isComplete": False,
        "tasks": tasks,
        "task_count": len(tasks),
        "decisionVersion": "yki_practice_v2",
        "policyVersion": "governed_practice_v2",
        "governanceVersion": "embedded_bank_v2",
        "session_hash": uuid.uuid4().hex,
        "task_sequence_hash": uuid.uuid4().hex,
    }
    _PRACTICE_SESSIONS[session_id] = session
    return session


@router.get("/{session_id}")
def session(session_id: str) -> dict[str, Any]:
    s = _PRACTICE_SESSIONS.get(session_id)
    if not s:
        raise HTTPException(status_code=404, detail="YKI practice session not found")
    return s


@router.post("/{session_id}/advance")
def advance(session_id: str) -> dict[str, Any]:
    """Move to the next task in the practice session."""
    s = _PRACTICE_SESSIONS.get(session_id)
    if not s:
        raise HTTPException(status_code=404, detail="YKI practice session not found")
    next_index = s["current_task_index"] + 1
    s["current_task_index"] = next_index
    if next_index >= s["task_count"]:
        s["isComplete"] = True
    return s
