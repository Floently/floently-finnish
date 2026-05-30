from __future__ import annotations

import hashlib
from dataclasses import dataclass, field
from datetime import timedelta
from typing import Any

from app.core.config import SETTINGS
from app.core.errors import AppError
from app.core.state_store import STORE
from app.core.utils import iso_now, new_id, parse_iso, utc_now
from app.runtime.finnish_personas import pick_persona
from app.services.roleplay_ai_service import generate_ai_roleplay_reply, _violates_role_contract

ROLEPLAY_STAGE_BY_TURN = {0: "OPENING", 1: "ACTIVE_1", 2: "ACTIVE_2", 3: "ACTIVE_3", 4: "ACTIVE_4", 5: "COMPLETE"}

# Three CEFR-grouped buckets the system supports. Used as keys in per-level scenario
# variants. Anything not in this set is normalized to "B1-B2" by _normalize_level.
LEVEL_BANDS: tuple[str, ...] = ("A1-A2", "B1-B2", "C1-C2")


def _seed_int(seed: str) -> int:
    """Stable non-negative integer hash — picks variant indices reproducibly per session."""
    return int(hashlib.sha256(seed.encode("utf-8")).hexdigest(), 16)


@dataclass(frozen=True)
class LevelVariant:
    """A complete set of AI-spoken lines for one scenario at one CEFR level.

    `openers` is a tuple of alternative opening lines — one is picked per session
    (deterministic by session seed) so users see different openings on repeat visits.

    `assistant_turns` is a tuple of turn-slots; each slot is itself a tuple of
    alternative lines for that slot. So `assistant_turns[0]` lists alternatives for
    the AI's first response after the user's first message; one is picked at session
    creation time. This produces variability without breaking the scripted nature of
    the runtime.

    `closing_texts` is similarly a tuple of alternatives, picked once per session.

    All language inside a LevelVariant should be at-or-below the named CEFR band.
    A1-A2 variants use short sentences and limited vocabulary. C1-C2 variants use
    professional register, idiom, and more nuance.
    """
    openers: tuple[str, ...]
    assistant_turns: tuple[tuple[str, ...], ...]
    closing_texts: tuple[str, ...]


@dataclass(frozen=True)
class ScenarioSpec:
    scenario_id: str
    profession: str
    track: str
    title: str
    persona_name: str
    intro: str
    key_phrases: tuple[str, ...]
    grammar_tip: str
    voice_profile: str
    # Per-CEFR-band variants. Should contain every band in LEVEL_BANDS.
    levels: dict[str, LevelVariant] = field(default_factory=dict)
    interview_mode: bool = False

    # ── Legacy compatibility fields ──────────────────────────────────────────
    # These are populated post-init from levels["B1-B2"]'s first variant so that
    # older code paths reading spec.opener / spec.assistant_turns / spec.closing_text
    # keep working unchanged. New code paths should call select_for_session() instead.
    opener: str = ""
    assistant_turns: tuple[str, ...] = ()
    closing_text: str = ""

    def select_for_session(self, *, level_band: str, seed: str) -> dict[str, Any]:
        """Return a concrete (opener, turns, closing) tuple deterministically chosen
        for this session.

        Picks variants by hashing the seed plus the level band. Same (seed, level)
        always returns the same selection — a user reloading their session
        mid-conversation must see the same opener and turn lines they already saw,
        not a fresh randomization.
        """
        variant = self.levels.get(level_band) or self.levels.get("B1-B2")
        if variant is None or not variant.openers or not variant.closing_texts:
            # Fall back to legacy fields. Should not happen if scenarios are well-formed.
            return {
                "opener": self.opener,
                "turns": list(self.assistant_turns),
                "closing": self.closing_text,
                "level_band": level_band,
            }
        h = _seed_int(seed)
        opener = variant.openers[h % len(variant.openers)]
        turns: list[str] = []
        for slot_idx, slot in enumerate(variant.assistant_turns):
            if not slot:
                turns.append("")
                continue
            slot_h = _seed_int(f"{seed}::{slot_idx}")
            turns.append(slot[slot_h % len(slot)])
        closing = variant.closing_texts[(h >> 8) % len(variant.closing_texts)]
        return {
            "opener": opener,
            "turns": turns,
            "closing": closing,
            "level_band": level_band,
        }


def _spec(
    *,
    scenario_id: str,
    profession: str,
    track: str,
    title: str,
    persona_name: str,
    intro: str,
    key_phrases: tuple[str, ...],
    grammar_tip: str,
    voice_profile: str,
    levels: dict[str, LevelVariant],
    interview_mode: bool = False,
) -> ScenarioSpec:
    """Construct a ScenarioSpec and auto-fill legacy fields from the B1-B2 variant.

    Use this helper instead of constructing ScenarioSpec directly so that legacy
    consumers reading `spec.opener` / `spec.assistant_turns` / `spec.closing_text`
    always see something sensible, even though the new system varies per session.
    """
    base = levels.get("B1-B2") or levels.get("A1-A2") or levels.get("C1-C2")
    if base is None:
        raise ValueError(f"ScenarioSpec {scenario_id} must define at least one level variant")
    legacy_opener = base.openers[0] if base.openers else ""
    legacy_turns = tuple(slot[0] if slot else "" for slot in base.assistant_turns)
    legacy_closing = base.closing_texts[0] if base.closing_texts else ""
    return ScenarioSpec(
        scenario_id=scenario_id,
        profession=profession,
        track=track,
        title=title,
        persona_name=persona_name,
        intro=intro,
        key_phrases=key_phrases,
        grammar_tip=grammar_tip,
        voice_profile=voice_profile,
        levels=levels,
        interview_mode=interview_mode,
        opener=legacy_opener,
        assistant_turns=legacy_turns,
        closing_text=legacy_closing,
    )

_ROLEPLAY_REGISTRY: dict[str, tuple[ScenarioSpec, ...]] = {
    # ───────────────────────────────────────────────────────────────────────────
    # GENERAL — non-medical workplace context. AI is a supervisor or team lead;
    # user is a generic worker. No clinical vocabulary.
    # ───────────────────────────────────────────────────────────────────────────
    "general": (
        _spec(
            scenario_id="general_supervisor_instruction",
            profession="general",
            track="general",
            title="Clarify a work task",
            persona_name="Supervisor",
            intro="Harjoittelet työohjeen tarkentamista. Pidä kieli selkeänä, rauhallisena ja työtilanteeseen sopivana.",
            key_phrases=("tehtävä", "aikataulu", "selvennys", "valmis"),
            grammar_tip="Käytä tarkentavia kysymyksiä ja aikamuotoja, jotka pitävät työnkulun selkeänä.",
            voice_profile="yki_standard_female",
            levels={
                "A1-A2": LevelVariant(
                    openers=(
                        "Hei! Mikä on sinun tehtävä tänään? Kerro lyhyesti.",
                        "Hyvää huomenta. Mitä työtä teet tänään? Kerro minulle.",
                        "Tervetuloa. Mikä on sinun ensimmäinen tehtävä?",
                        "Hei. Kerro, mitä teet tänään ensin.",
                    ),
                    assistant_turns=(
                        ("Hyvä. Mitä teet ensin?", "Selvä. Mikä on sinun ensimmäinen asia?", "Hyvä alku. Mistä aloitat?"),
                        ("Selvä. Milloin tehtävä on valmis?", "Hyvä. Mihin aikaan lopetat?", "Selvä. Onko aikataulu selvä?"),
                        ("Hyvä. Tarvitsetko apua?", "Selvä. Onko jokin vaikea?", "Hyvä. Onko kaikki selvää?"),
                        ("Kiitos. Kerro vielä lyhyesti, miten teit työn.", "Hyvä. Sano lyhyesti, mitä teit.", "Kiitos. Kerro tulos lyhyesti."),
                    ),
                    closing_texts=(
                        "Hyvä työ. Kerroit selvästi.",
                        "Kiitos. Tehtävä on selvä.",
                        "Hyvä. Ymmärsin hyvin.",
                    ),
                ),
                "B1-B2": LevelVariant(
                    openers=(
                        "Hei, olen työvuoron vastuuhenkilö. Voisitko kertoa omin sanoin, miten ymmärsit tämän päivän tehtävän?",
                        "Hyvää huomenta. Käydään lyhyesti läpi, mitä sinulle on annettu tehtäväksi tälle päivälle.",
                        "Hei. Aloitetaan sillä, että kerrot omin sanoin, mistä työstä on kyse.",
                        "Tervetuloa. Kerro ensin, mitä työstä jo tiedät ja missä kaipaat selvennystä.",
                    ),
                    assistant_turns=(
                        (
                            "Hyvä alku. Mitä teet ensin, jotta työ etenee oikeassa järjestyksessä?",
                            "Selvä. Missä järjestyksessä etenet ja mistä aloitat?",
                            "Hyvä. Mikä on tärkeintä saada tehtyä ensin?",
                        ),
                        (
                            "Selvä. Jos aikataulu muuttuu, miten ilmoitat siitä esimiehelle?",
                            "Hyvä. Miten varmistat, että aikataulussa pysytään?",
                            "Selvä. Mitä teet, jos huomaat että aikataulu ei pidä?",
                        ),
                        (
                            "Hyvä. Kerro vielä, miten varmistat, että tehtävä on varmasti valmis oikein.",
                            "Selvä. Miten tarkistat, että työ on tehty kunnolla?",
                            "Hyvä. Miten tiedät, milloin tehtävä on todella valmis?",
                        ),
                        (
                            "Kiitos. Tee lopuksi lyhyt yhteenveto koko suunnitelmastasi yhdellä selkeällä työraportilla.",
                            "Hyvä. Tee tästä vielä tiivis yhteenveto, joka kelpaa raportiksi.",
                            "Kiitos. Kerro lopuksi koko suunnitelma lyhyesti yhteen koottuna.",
                        ),
                    ),
                    closing_texts=(
                        "Hyvä. Pystyit pitämään tilanteen rakenteisena ja työtehtävän kannalta hyödyllisenä.",
                        "Kiitos. Kerroit asiat järjestyksessä ja työn kulku tuli selkeästi esiin.",
                        "Hyvä. Suunnitelma on jäsennelty ja työn kannalta käytännöllinen.",
                    ),
                ),
                "C1-C2": LevelVariant(
                    openers=(
                        "Hei. Käydään läpi tämän päivän tehtäväkenttä — kuvaile omin sanoin, miten olet tilanteen jäsentänyt ja mitkä ovat sen kriittiset vaiheet.",
                        "Hei. Mietitään yhdessä työnkulkua: kerro, mitkä ovat keskeiset välitavoitteet ja missä näet riskipisteet.",
                        "Hyvää huomenta. Avaa lyhyesti tämän päivän tehtäväkokonaisuus ja perustele, miksi olet jäsentänyt sen juuri tähän järjestykseen.",
                    ),
                    assistant_turns=(
                        (
                            "Hyvä jäsennys. Miten priorisoit, jos resurssit muuttuvat kesken työn?",
                            "Selkeä avaus. Mitkä ovat ne kohdat, joissa pieni virhe kasvaa nopeasti isoksi ongelmaksi?",
                            "Hyvä lähtökohta. Miten varmistat, että priorisointi pysyy linjassa kokonaistavoitteen kanssa?",
                        ),
                        (
                            "Selvä. Millaisin viestintätavoin pidät esimiehen tilanteen tasalla, jos suunnitelma joutuu muuttumaan kesken päivän?",
                            "Hyvä. Mihin merkkeihin reagoit, jotta poikkeama tulee ilmi ennen kuin se ehtii eskaloitua?",
                            "Selvä. Miten dokumentoit muutokset niin, että työ pysyy jäljitettävänä ja päätökset perusteltuina?",
                        ),
                        (
                            "Hyvä. Miten varmistat lopputuloksen laadun ilman, että tarkastusvaihe pitkittyy tarpeettomasti?",
                            "Selvä. Mistä konkreettisista signaaleista tunnistat, että työ on tehty halutulla tasolla?",
                            "Hyvä. Miten erotat sen, mikä on viilattavaa, siitä, mikä on jo riittävän hyvää?",
                        ),
                        (
                            "Kiitos. Tee lopuksi lyhyt, johdolle välitettävä yhteenveto: tilanne, päätökset, jatkotoimet.",
                            "Hyvä. Vedä koko prosessi yhteen tiiviiksi raportiksi, joka kelpaa esimiestasolle sellaisenaan.",
                            "Kiitos. Kerro lopuksi suunnitelma niin, että siitä käy ilmi sekä eteneminen että keskeiset päätöksentekokohdat.",
                        ),
                    ),
                    closing_texts=(
                        "Hyvä. Suunnitelma oli rakenteellisesti vahva ja perustelut kestivät tarkennukset.",
                        "Kiitos. Tilanteen hallinta välittyi selkeänä ja päätöksenteko jäljitettävänä.",
                        "Hyvä työ. Kokonaisuus oli ammatillisesti uskottava ja viestintä jäsennelty.",
                    ),
                ),
            },
        ),
        _spec(
            scenario_id="general_issue_report",
            profession="general",
            track="general",
            title="Report a workplace issue",
            persona_name="Team Lead",
            intro="Harjoittelet ongelman raportointia niin, että kuulija ymmärtää tilanteen, riskin ja seuraavan tarpeen.",
            key_phrases=("ongelma", "syy", "vaikutus", "apu"),
            grammar_tip="Rakenna raportti muodossa: mitä tapahtui, mikä vaikutus sillä on, mitä tarvitset seuraavaksi.",
            voice_profile="yki_standard_female",
            levels={
                "A1-A2": LevelVariant(
                    openers=(
                        "Hei. Kerro lyhyesti, mikä on ongelma.",
                        "Hei. Mitä tapahtui? Kerro rauhallisesti.",
                        "Hyvää päivää. Sano lyhyesti, missä on vika.",
                        "Hei. Mikä meni pieleen? Kerro minulle.",
                    ),
                    assistant_turns=(
                        ("Selvä. Onko se vakava?", "Hyvä. Onko ongelma iso vai pieni?", "Selvä. Onko nyt vaaraa?"),
                        ("Hyvä. Mitä jo teit?", "Selvä. Yrititkö korjata?", "Hyvä. Mitä testasit?"),
                        ("Selvä. Mitä apua tarvitset?", "Hyvä. Mitä pitää tehdä seuraavaksi?", "Selvä. Mitä toivot minulta?"),
                        ("Kiitos. Sano lopuksi lyhyt yhteenveto.", "Hyvä. Kerro nyt vielä lyhyt tiivistelmä.", "Kiitos. Sano kaikki lyhyesti."),
                    ),
                    closing_texts=(
                        "Hyvä. Ongelma on selvä.",
                        "Kiitos. Ymmärsin asian.",
                        "Hyvä. Hoidamme tämän yhdessä.",
                    ),
                ),
                "B1-B2": LevelVariant(
                    openers=(
                        "Hei, kerro minulle rauhallisesti mikä ongelma tuli vastaan ja mitä olet jo tehnyt sen ratkaisemiseksi.",
                        "Hei. Käydään tilanne läpi: kuvaile, mitä on tapahtunut ja millaista apua tarvitset.",
                        "Hyvää päivää. Mistä on kyse? Kerro tilanne lyhyesti ja missä järjestyksessä se eteni.",
                        "Hei. Aloita kuvaamalla itse ongelma ja se, miten huomasit sen.",
                    ),
                    assistant_turns=(
                        (
                            "Hyvä. Mikä tämän ongelman vaikutus on työhön tai asiakkaaseen juuri nyt?",
                            "Selvä. Miten ongelma näkyy käytännössä juuri tällä hetkellä?",
                            "Hyvä. Onko tilanne vakaa vai pahentumassa?",
                        ),
                        (
                            "Selvä. Mitä olet jo ehtinyt tarkistaa ennen kuin otit yhteyttä?",
                            "Hyvä. Mitä toimia olet jo tehnyt itse?",
                            "Selvä. Oletko jo testannut jotain ratkaisua?",
                        ),
                        (
                            "Hyvä. Minkälaista apua tai päätöstä tarvitset seuraavaksi?",
                            "Selvä. Mitä toivot, että teen seuraavaksi?",
                            "Hyvä. Mitä pitäisi tapahtua ennen kuin tilanne on hallinnassa?",
                        ),
                        (
                            "Kiitos. Kokoa raportti niin, että kuka tahansa pystyy ottamaan tilanteen haltuun lukemalla sen.",
                            "Hyvä. Tee tästä lyhyt mutta kattava yhteenveto eteenpäin vietäväksi.",
                            "Kiitos. Tiivistä tilanne ja seuraavat askeleet yhteen selkeään raporttiin.",
                        ),
                    ),
                    closing_texts=(
                        "Hyvä. Raportti antoi tilanteesta selkeän kuvan ja seuraavat askeleet ovat tiedossa.",
                        "Kiitos. Tilanne on jäsennelty ja siihen on helppo tarttua.",
                        "Hyvä. Kerroit asiat järjestyksessä ja jatkotoimet ovat selvät.",
                    ),
                ),
                "C1-C2": LevelVariant(
                    openers=(
                        "Hei. Kuvaile tilanne kolmessa tasossa: mitä tapahtui, mikä on sen välitön vaikutus, ja mikä on todennäköisin juurisyy.",
                        "Hei. Käydään ongelma läpi siten, että erottelet havainnon, tulkinnan ja tarvittavan päätöksen.",
                        "Hyvää päivää. Avaa lyhyesti, mistä tilanteessa on kyse ja mitä kohtia siinä joudut painottamaan eteenpäin.",
                    ),
                    assistant_turns=(
                        (
                            "Selvä. Erottele lyhyesti välittömät seuraukset siitä, mikä saattaa kärjistyä viiveellä.",
                            "Hyvä. Mikä tästä on hallinnassa ilman lisätoimia ja mikä vaatii reagointia tunnin sisällä?",
                            "Selvä. Mihin osa-alueisiin vaikutus kohdistuu vakavimmin ja millä aikavälillä?",
                        ),
                        (
                            "Hyvä. Mitkä rajatut toimenpiteet olet jo tehnyt ja millä logiikalla valitsit juuri ne?",
                            "Selvä. Kuvaa, mitä rajoitteita kohtasit omassa ratkaisuyrityksessäsi ennen avunpyyntöä.",
                            "Hyvä. Missä kohdassa tunnistit, että et voi viedä tilannetta yksin loppuun?",
                        ),
                        (
                            "Selvä. Millainen päätös tai resurssi puuttuu juuri nyt, jotta tilanteeseen saadaan piste?",
                            "Hyvä. Tarvitsetko valtuutuksen, lisätietoa, vai ulkopuolisen ratkaisun?",
                            "Selvä. Erittele lyhyesti, mikä on minun roolini tässä ja mikä jää sinun vastuullesi.",
                        ),
                        (
                            "Kiitos. Tee tilannekuva, joka antaa päätöksentekijälle riittävän pohjan toimia heti.",
                            "Hyvä. Vedä raportti yhteen niin, että ratkaiseva tieto on heti löydettävissä.",
                            "Kiitos. Yhdistä kuvaus, vaikutus ja pyyntö yhteen tiiviiseen muotoon.",
                        ),
                    ),
                    closing_texts=(
                        "Hyvä. Raportti oli ammatillisesti uskottava ja päätöksenteon tueksi käyttökelpoinen.",
                        "Kiitos. Esitys oli rakenteellisesti selkeä ja painotukset osuivat oleelliseen.",
                        "Hyvä työ. Tilanne oli hallittu ja viesti välitettävissä eteenpäin sellaisenaan.",
                    ),
                ),
            },
        ),
    ),

    # ───────────────────────────────────────────────────────────────────────────
    # NURSE — user is the nurse. AI plays a senior nurse colleague (handover),
    # a patient (patient_update), or a recruiter (interview).
    # ───────────────────────────────────────────────────────────────────────────
    "nurse": (
        _spec(
            scenario_id="nurse_shift_handover",
            profession="nurse",
            track="professional",
            title="Shift handover",
            persona_name="Senior Nurse",
            intro="Harjoittelet sairaanhoitajan vuororaporttia. Pidä järjestys turvallisena: vointi, havainnot, toimenpiteet, seuraavat asiat.",
            key_phrases=("vointi", "havainto", "lääke", "seuranta"),
            grammar_tip="Käytä lyhyitä mutta täsmällisiä lauseita, jotta raportti tukee potilasturvallisuutta.",
            voice_profile="yki_standard_female",
            levels={
                "A1-A2": LevelVariant(
                    openers=(
                        "Hei. Kerro lyhyesti, miten potilas voi nyt.",
                        "Hei. Miten yö meni? Kerro tärkein asia ensin.",
                        "Hyvää huomenta. Kerro potilaan vointi.",
                        "Hei. Onko jotain uutta? Kerro lyhyesti.",
                    ),
                    assistant_turns=(
                        ("Selvä. Mitä lääkkeitä annoit?", "Hyvä. Annoitko kipulääkettä?", "Selvä. Mitkä lääkkeet annettiin?"),
                        ("Hyvä. Mitä pitää seurata tarkasti?", "Selvä. Mihin seuraava vuoro kiinnittää huomiota?", "Hyvä. Mikä on tärkein asia?"),
                        ("Selvä. Pitääkö soittaa lääkärille?", "Hyvä. Kirjasitko kaiken?", "Selvä. Mitä kirjasit?"),
                        ("Kiitos. Kerro vielä kolme tärkeintä asiaa.", "Hyvä. Sano lopuksi tärkeät kohdat.", "Kiitos. Tee lyhyt yhteenveto."),
                    ),
                    closing_texts=(
                        "Hyvä raportti. Asiat ovat selvät.",
                        "Kiitos. Vuoro on selkeästi raportoitu.",
                        "Hyvä. Seuraava vuoro tietää, mitä tehdä.",
                    ),
                ),
                "B1-B2": LevelVariant(
                    openers=(
                        "Hei, aloitetaan vuororaportti. Kerro minulle ensin potilaan tämänhetkisestä voinnista ja tärkeimmistä muutoksista.",
                        "Hei. Käydään läpi yön kulku — kerro alkuun, miten potilaan tilanne on kehittynyt.",
                        "Hyvää huomenta. Anna kuva potilaan voinnista ja siitä, mikä yön aikana on muuttunut.",
                        "Hei. Aloita raportti tärkeimmistä havainnoista, jotta saan tilannekuvan nopeasti.",
                    ),
                    assistant_turns=(
                        (
                            "Hyvä. Mitä lääkkeitä annettiin tai mitä hoitotoimia tehtiin viimeksi?",
                            "Selvä. Käydään läpi annetut lääkkeet ja toimenpiteet.",
                            "Hyvä. Kerro, mitä konkreettisia hoitotoimia on tehty.",
                        ),
                        (
                            "Selvä. Mistä asiasta seuraavan vuoron pitää olla erityisen tarkkana?",
                            "Hyvä. Mihin haluat, että seuraava hoitaja kiinnittää erityistä huomiota?",
                            "Selvä. Mikä on se asia, jota seuraavan vuoron ei missään tapauksessa pidä missata?",
                        ),
                        (
                            "Hyvä. Onko jotain, mikä pitää raportoida lääkärille tai kirjata heti?",
                            "Selvä. Tarvitseeko jotain viedä lääkärin tietoon nyt heti?",
                            "Hyvä. Onko jotain sellaista, mikä ei voi odottaa kierrolle?",
                        ),
                        (
                            "Kiitos. Tee vielä lopuksi tiivis koko vuoron yhteenveto kolmella tärkeällä kohdalla.",
                            "Hyvä. Vedä yhteen vuoron tärkein anti kolmessa kohdassa.",
                            "Kiitos. Yhdistä raportti tiiviiseen muotoon, jonka voi luovuttaa eteenpäin.",
                        ),
                    ),
                    closing_texts=(
                        "Hyvä. Vuororaportti pysyi turvallisena, selkeänä ja käyttökelpoisena seuraavalle hoitajalle.",
                        "Kiitos. Tärkeimmät asiat välittyivät jäsenneltynä ja potilasturvallisuutta tukevana.",
                        "Hyvä. Raportti oli rakenteinen ja seuraavalle vuorolle on selkeät askeleet.",
                    ),
                ),
                "C1-C2": LevelVariant(
                    openers=(
                        "Hei. Aloitetaan raportti tärkeimmistä kliinisistä muutoksista — pidä rakenne tilanne, päätökset, seuranta.",
                        "Hei. Tehdään täsmällinen luovutus: kuvaile potilaan tilanne ja perustele tehdyt valinnat.",
                        "Hyvää huomenta. Ota raportti johdonmukaisesti vointi → toimenpiteet → riskit → seuraava vuoro.",
                    ),
                    assistant_turns=(
                        (
                            "Hyvä. Erottele rutiinihoito siitä, mikä on tämän potilaan kohdalla erityistä juuri nyt.",
                            "Selvä. Mikä lääkityksessä tai hoitolinjassa on muuttunut, ja millä perusteella?",
                            "Hyvä. Mitä havaintoja teit, jotka muuttivat suunnitelmaa kesken vuoron?",
                        ),
                        (
                            "Selvä. Mitkä ovat ne riskikohdat, joissa potilaan tilanne voi muuttua nopeasti, ja mihin merkkeihin pitää reagoida?",
                            "Hyvä. Erittele kliiniset varoitusmerkit, joita seuraavan vuoron tulee aktiivisesti seurata.",
                            "Selvä. Mihin parametreihin sidotaan päätös konsultaatiosta tai hoitolinjan muutoksesta?",
                        ),
                        (
                            "Hyvä. Mitkä asiat vaativat välitöntä lääkärin reagointia ja mitkä voivat odottaa kiertoa?",
                            "Selvä. Onko sellaisia kirjauksia, jotka on tehtävä ennen seuraavaa vuoroa potilasturvallisuuden vuoksi?",
                            "Hyvä. Mitkä asiat dokumentoit niin, että hoitolinjan jatkuvuus säilyy katkeamattomana?",
                        ),
                        (
                            "Kiitos. Tee tiivistelmä, joka kestää myös sen, että vastaanottaja tulee paineen alta.",
                            "Hyvä. Vedä raportti yhteen niin, että priorisointi on heti luettavissa.",
                            "Kiitos. Kokoa luovutus muotoon, joka ohjaa seuraavan vuoron toiminnan ensimmäisen tunnin aikana.",
                        ),
                    ),
                    closing_texts=(
                        "Hyvä. Luovutus oli kliinisesti täsmällinen ja päätökset olivat hyvin perusteltuja.",
                        "Kiitos. Raportti tukee potilasturvallisuutta ja antaa selkeän toimintapohjan.",
                        "Hyvä. Esitys oli ammatillisesti vahva ja painotus osui oikeaan.",
                    ),
                ),
            },
        ),
        # ── nurse_patient_update — FIXED. AI now plays the patient. ─────────────
        # Previously: AI was supposed to be patient (persona=Patient) but spoke in
        # nurse-voice ("Mikä pahentaa oloa?"). User playing the nurse ended up
        # answering as the patient. Now the AI describes symptoms and the user, as
        # the nurse, asks the clarifying questions.
        _spec(
            scenario_id="nurse_patient_update",
            profession="nurse",
            track="professional",
            title="Patient update",
            persona_name="Patient",
            intro="Olet vuorossa ja potilas haluaa kertoa, miten vointi on muuttunut. Kysy yksi tarkentava kysymys kerrallaan ja varmista ymmärtäminen ennen seuraavaa vaihetta.",
            key_phrases=("kipu", "voimakkuus", "muutos", "helpottaa"),
            grammar_tip="Etene yhdellä kysymyksellä kerrallaan ja varmista ymmärtäminen ennen seuraavaa vaihetta.",
            voice_profile="yki_standard_female",
            levels={
                "A1-A2": LevelVariant(
                    openers=(
                        "Hei hoitaja. Minulla on kipu vatsassa. Se sattuu paljon.",
                        "Hei. Olen huonossa kunnossa tänään. Pää on kipeä.",
                        "Anteeksi. Voitko auttaa? Tunnen oloni huonoksi.",
                        "Hei hoitaja. Kipu on pahempi kuin eilen.",
                    ),
                    assistant_turns=(
                        (
                            "Kipu alkoi aamulla. Se on koko ajan.",
                            "Vatsa kipeä. Ei mene pois.",
                            "Pää on kipeä. Ei voi nukkua.",
                        ),
                        (
                            "Lepo auttaa vähän. Liike pahentaa.",
                            "Lääke ei auta tänään.",
                            "Vesi auttaa vähän. Mutta ei kauan.",
                        ),
                        (
                            "Olen myös väsynyt. En syö paljon.",
                            "Pahoinvointi on uusi. Ei ollut eilen.",
                            "Lämpö nousee illalla. Aamulla on parempi.",
                        ),
                        (
                            "Selvä. Kiitos, hoitaja.",
                            "Hyvä. Odotan apua.",
                            "Kiitos. Toivottavasti se auttaa.",
                        ),
                    ),
                    closing_texts=(
                        "Kiitos. Kysyit tärkeät asiat selvästi.",
                        "Hyvä. Nyt minulla on parempi olo, koska kerroin asiat.",
                        "Kiitos hoitaja. Sinä kuuntelit hyvin.",
                    ),
                ),
                "B1-B2": LevelVariant(
                    openers=(
                        "Hei, hoitaja. Kipu on muuttunut aamusta lähtien — se tuntuu nyt erilaiselta kuin eilen.",
                        "Anteeksi, hoitaja. En ole varma mistä alkaisin, mutta vointi ei ole sama kuin eilen.",
                        "Voitko katsoa minua hetken? Olen huolissani siitä, että tilanne on pahentunut yön aikana.",
                        "Hei. Yritin kestää aamuun, mutta nyt on pakko sanoa, että kipu vaivaa kunnolla.",
                    ),
                    assistant_turns=(
                        (
                            "Kipu tuntuu vatsan oikealla puolella. Se on ollut siinä noin kuusi tuntia ja menee aaltoina.",
                            "Tuntuu kuin pää sykkisi koko ajan. Se alkoi heräämisen jälkeen eikä ole helpottanut.",
                            "Selässä on terävä kipu, joka säteilee jalkaan asti. Eilen sitä ei ollut.",
                        ),
                        (
                            "Liike pahentaa kipua selvästi. Lepo auttaa hetkeksi, mutta ei pitkään.",
                            "Eilinen lääke auttoi paremmin. Tänään se ei tunnu vaikuttavan ollenkaan.",
                            "Lämmin tyyny helpottaa hieman, mutta kipu palaa heti kun otan sen pois.",
                        ),
                        (
                            "Pahoinvointi on uusi asia. Sitä ei ollut eilen ja se haittaa syömistä tänään.",
                            "Olen huomannut, että väsymys on lisääntynyt nopeasti — eilen jaksoin paremmin.",
                            "Iho tuntuu kuumalta otsalta, ja lämpö on noussut iltaisin pari päivää peräkkäin.",
                        ),
                        (
                            "Kiitos, että kysyit tarkkaan. Toivottavasti tästä on hyötyä lääkärin kierrolla.",
                            "Hyvä. Olo helpotti jo siitä, että sain kerrottua asiat järjestyksessä.",
                            "Kiitos. Odotan, mitä päätätte tehdä seuraavaksi.",
                        ),
                    ),
                    closing_texts=(
                        "Kiitos. Kysymykset etenivät rauhallisesti ja sain kerrottua kaiken oleellisen.",
                        "Hyvä. Tunnen, että minua kuunneltiin ja tilanne otettiin tosissaan.",
                        "Kiitos hoitaja. Olo on nyt parempi, kun tärkeät asiat on käyty läpi.",
                    ),
                ),
                "C1-C2": LevelVariant(
                    openers=(
                        "Hei. Kipu on muuttunut luonteeltaan yön aikana — ei pelkästään pahentunut, vaan se tuntuu nyt erilaiselta, ja se huolestuttaa minua.",
                        "Anteeksi häiriö. En ole varma, onko tämä merkityksellistä, mutta haluan kertoa muutamasta yhtäaikaisesta muutoksesta.",
                        "Hei, hoitaja. Käyn lyhyesti läpi sen, mitä on tapahtunut sitten eilisen — koetan kuvata tarkasti, jotta saatte kunnon kuvan.",
                    ),
                    assistant_turns=(
                        (
                            "Kipu paikantuu oikeaan alavatsaan ja säteilee selkään asti. Luonteeltaan se on aaltomaisesti voimistuva, ei tasainen.",
                            "Tuntemus on lähinnä pulsoiva otsan alueella, ja siihen liittyy valoarkuus, jota ei aikaisemmin ole ollut.",
                            "Kipu on luonteeltaan terävä ja paikantuu selkeästi tähän kohtaan — se eroaa aikaisemmasta tylpästä, kestävästä kivusta.",
                        ),
                        (
                            "Liike pahentaa selvästi, lepo lievittää, mutta vaikutus on lyhytaikainen. Tavanomainen lääkitys ei tällä kertaa tuota odotettua vastetta.",
                            "Lämmin tyyny tuottaa hetkellistä helpotusta, mutta se ei kestä. Aiemmin samasta auttoi paljon pidempään.",
                            "Lääke vaikuttaa tällä kertaa hitaammin ja heikommin kuin viimeksi — vaikutusaika on lyhentynyt arviolta puolella.",
                        ),
                        (
                            "Liitännäisoireina on tullut pahoinvointia ja lievä lämmönnousu, joka painottuu iltaan. Nämä ovat uusia eivätkä kuuluneet aiempaan oireenkuvaan.",
                            "Olen huomannut, että ruokahalu on kadonnut käytännössä kokonaan, ja nestemääräkin on jäänyt vajaaksi viime tunteina.",
                            "Kuume nousee iltaa kohti hieman, ja siihen liittyy hikoilua öisin — eilen oireet olivat selvästi lievemmät.",
                        ),
                        (
                            "Kiitos, että kävitte oireet läpi tällä tarkkuudella. Se helpottaa myös omaa olotilaani, kun tilanne tulee dokumentoiduksi.",
                            "Hyvä. Toivon, että tämä taso riittää lääkärin arviolle ja että saamme nopeasti suuntaa siitä, miten edetään.",
                            "Kiitos huolellisesta kuuntelusta. Tunne, että minua otetaan vakavasti, lievittää itsessään tilannetta.",
                        ),
                    ),
                    closing_texts=(
                        "Kiitos. Haastattelu eteni kliinisesti loogisesti ja sain kuvan siitä, että tilanne otetaan vakavasti.",
                        "Hyvä. Kysymyksenne tarkensivat juuri niitä kohtia, jotka itse koin oleellisiksi.",
                        "Kiitos hoitaja. Esitys oli ammatillinen ja samalla potilaslähtöinen.",
                    ),
                ),
            },
        ),
        _spec(
            scenario_id="nurse_interview_beta",
            profession="nurse",
            track="professional",
            title="Nurse interview",
            persona_name="Recruiter",
            intro="Tämä on sairaanhoitajan haastattelutilanne. Vastaa jäsennellysti ja käytä ammatillista, luonnollista suomea.",
            key_phrases=("kokemus", "vastuu", "potilasturvallisuus", "yhteistyö"),
            grammar_tip="Rakenna vastaukset muodossa tausta, esimerkki, oppi, vaikutus työssä.",
            voice_profile="yki_standard_female",
            interview_mode=True,
            levels={
                "A1-A2": LevelVariant(
                    openers=(
                        "Hei. Tervetuloa. Kerro lyhyesti, missä olet ollut töissä.",
                        "Hei. Mistä sinä olet kotoisin? Ja missä olet ollut sairaanhoitaja?",
                        "Hyvää päivää. Kerro työsi lyhyesti.",
                        "Hei. Kuinka kauan olet sairaanhoitaja?",
                    ),
                    assistant_turns=(
                        ("Hyvä. Kerro yksi vaikea tilanne työssä.", "Selvä. Onko ollut kiire vuoro? Kerro siitä.", "Hyvä. Kerro yksi tärkeä esimerkki."),
                        ("Selvä. Mitä teet, jos potilas on huonossa kunnossa?", "Hyvä. Miten autat, jos joku tarvitsee apua heti?", "Selvä. Mitä teet, jos näet ongelman?"),
                        ("Hyvä. Toimitko hyvin tiimissä?", "Selvä. Kerro vuororaportista lyhyesti.", "Hyvä. Onko helppo tehdä yhteistyötä?"),
                        ("Kiitos. Miksi tämä työ on sinulle hyvä?", "Selvä. Miksi haluat tämän työn?", "Hyvä. Kerro, miksi sopisit tähän."),
                    ),
                    closing_texts=(
                        "Kiitos. Vastauksesi olivat selviä.",
                        "Hyvä. Kerroit asiat hyvin.",
                        "Kiitos haastattelusta. Sait pääasiat sanottua.",
                    ),
                ),
                "B1-B2": LevelVariant(
                    openers=(
                        "Hei, tervetuloa haastatteluun. Aloitetaan lyhyesti: kerro minulle omasta sairaanhoitajan työkokemuksestasi Suomessa tai muualla.",
                        "Hei. Käydään lyhyesti läpi tausta — kerro, missä olet työskennellyt ja millaisissa tehtävissä.",
                        "Hyvää päivää. Aloitetaan kokemuksestasi: kuvaa, mitä työtehtäviä olet hoitanut ja millaisessa ympäristössä.",
                        "Hei. Kerro alkuun lyhyt yhteenveto työkokemuksestasi sairaanhoitajana.",
                    ),
                    assistant_turns=(
                        (
                            "Kiitos. Kerro esimerkki tilanteesta, jossa jouduit priorisoimaan potilaita kiireisessä vuorossa.",
                            "Hyvä. Anna konkreettinen esimerkki tilanteesta, jossa jouduit tekemään nopean kliinisen päätöksen.",
                            "Selvä. Kerro, milloin viimeksi jouduit tasapainoilemaan kiireen ja potilasturvallisuuden välillä.",
                        ),
                        (
                            "Hyvä. Miten toimit, jos huomaat potilasturvallisuuteen liittyvän riskin tai epäselvyyden?",
                            "Selvä. Mitä teet, jos hoitolinjassa on jotain, mistä et ole täysin varma?",
                            "Hyvä. Kerro, miten varmistat, että havaitsemasi riski tulee dokumentoitua ja viestittyä eteenpäin.",
                        ),
                        (
                            "Selvä. Millainen rooli sinulla on tiimityössä ja vuororaportoinnissa?",
                            "Hyvä. Miten kuvailet itseäsi vuororaportoijana ja tiimin jäsenenä?",
                            "Selvä. Mitä luulet kollegoidesi sanovan sinusta yhteistyökumppanina?",
                        ),
                        (
                            "Kiitos. Lopuksi: miksi juuri tämä tehtävä sopii sinulle sairaanhoitajana?",
                            "Hyvä. Miksi haet juuri tähän tehtävään juuri nyt?",
                            "Kiitos. Mistä syystä uskot, että sinä olet hyvä ehdokas tähän paikkaan?",
                        ),
                    ),
                    closing_texts=(
                        "Kiitos haastattelusta. Vastaukset antoivat hyvän kuvan ammattitaidostasi ja työotteestasi.",
                        "Hyvä. Esimerkkisi olivat konkreettisia ja näyttivät tilannetajun.",
                        "Kiitos. Kerroit kokemuksesta jäsennellysti ja vastasit kysymyksiin selkeästi.",
                    ),
                ),
                "C1-C2": LevelVariant(
                    openers=(
                        "Hei, tervetuloa. Avaa lyhyesti urapolkuasi ja kerro, missä vaiheessa kliininen vastuu on ollut keskeisintä.",
                        "Hei. Kerro tausta tiivistettynä — keskity rooleihin, joissa olet kantanut itsenäistä kliinistä vastuuta.",
                        "Hyvää päivää. Aloitetaan ammatillisesta kehityksestäsi: kerro merkittävimmät vaiheet ja niiden vaikutus työotteeseesi.",
                    ),
                    assistant_turns=(
                        (
                            "Hyvä. Kuvaile tilanne, jossa priorisointi joutui koetukselle ja jonka jälkeen muutit työtapaasi pysyvästi.",
                            "Selvä. Kerro hetki, jossa kliininen päätös oli sinun, et tehnyt sitä yksin, ja mitä siitä jäi käteen.",
                            "Hyvä. Anna esimerkki tilanteesta, jossa jouduit perustelemaan päätöksen lääkärille tai esimiehelle ja millä tavalla rakensit perustelusi.",
                        ),
                        (
                            "Selvä. Kuvaa tilanne, jossa havaitsit riskin, jota muut eivät vielä tunnistaneet, ja miten veit asian eteenpäin.",
                            "Hyvä. Miten erotat tilanteen, jossa pitää nostaa hälytys, siitä, jossa ammattitaito riittää sisäiseen ratkaisuun?",
                            "Selvä. Anna esimerkki, jossa jouduit haastamaan vakiintuneen käytännön potilasturvallisuuden vuoksi.",
                        ),
                        (
                            "Hyvä. Miten kuvailisit itseäsi tiimin jäsenenä konfliktitilanteessa, ei rauhallisina päivinä?",
                            "Selvä. Kerro, miten rakennat luottamusta uudessa tiimissä ensimmäisten viikkojen aikana.",
                            "Hyvä. Kerro tilanne, jossa tiimi epäonnistui, ja oma roolisi siinä — sekä se, mitä opit jälkikäteen.",
                        ),
                        (
                            "Kiitos. Lopuksi: miten tämä tehtävä sopii pidemmän aikavälin urasuunnitelmaasi, ja mitä haluat tästä paikasta enemmän kuin toisesta?",
                            "Hyvä. Kerro vielä, mistä syystä juuri me olemme sinulle relevantti työnantaja juuri nyt.",
                            "Kiitos. Mikä on se, mistä uskot, että jätät tähän organisaatioon jäljen, jos sinut palkataan?",
                        ),
                    ),
                    closing_texts=(
                        "Kiitos haastattelusta. Vastaukset olivat ammatillisesti syvällisiä ja itsereflektiosi oli aitoa.",
                        "Hyvä. Esimerkkisi olivat konkreettisia ja niistä välittyi laaja kliininen näkemys.",
                        "Kiitos. Kokonaisuus oli vakuuttava ja kuva itseohjautuvuudestasi oli selkeä.",
                    ),
                ),
            },
        ),
    ),

    # ───────────────────────────────────────────────────────────────────────────
    # DOCTOR — user is the doctor. AI plays a patient (or, in the second scenario,
    # a patient who needs the doctor's explanation). Previously these scenarios
    # had the AI speaking as the doctor, which inverted the paying user's role.
    # FIXED in this revision.
    # ───────────────────────────────────────────────────────────────────────────
    "doctor": (
        # ── doctor_patient_interview — FIXED. AI plays the patient. ─────────────
        # Was: AI persona=Patient but spoke as doctor ("Mikä toi sinut vastaanotolle?").
        # Now: AI presents as a patient with a complaint, and the user (the doctor)
        # asks the diagnostic questions.
        _spec(
            scenario_id="doctor_patient_interview",
            profession="doctor",
            track="professional",
            title="Patient interview",
            persona_name="Patient",
            intro="Olet vastaanotolla. Potilas on tullut kertomaan oireistaan. Etene yksi kliinisesti hyödyllinen kysymys kerrallaan: oire, kesto, vaikutus, tausta.",
            key_phrases=("oire", "kesto", "pahentaa", "lääkitys"),
            grammar_tip="Etene oireesta kestoon, vaikutukseen ja aiempaan taustaan ilman että menetät keskustelun rakennetta.",
            voice_profile="yki_standard_male",
            interview_mode=True,
            levels={
                "A1-A2": LevelVariant(
                    openers=(
                        "Hei lääkäri. Minulla on kipu rinnassa.",
                        "Hyvää päivää. Yskä ei mene pois. Olen huolissani.",
                        "Hei. Pää on ollut kipeä monta päivää.",
                        "Anteeksi. En voi nukkua hyvin. Olen väsynyt.",
                    ),
                    assistant_turns=(
                        (
                            "Kipu alkoi viikko sitten. Se on koko ajan.",
                            "Yskä alkoi maanantaina. Se ei mene pois.",
                            "Pää on ollut kipeä viisi päivää.",
                        ),
                        (
                            "Liike pahentaa. Lepo helpottaa vähän.",
                            "Yöllä on pahempi. Aamulla parempi.",
                            "Tupakka pahentaa. En voi syödä paljon.",
                        ),
                        (
                            "Käytän verenpainelääkettä. Ei muuta.",
                            "Ei muita lääkkeitä. Ei sairauksia.",
                            "Olen ollut sydänlääkäri. Yksi lääke aamulla.",
                        ),
                        (
                            "Selvä. Kiitos, lääkäri.",
                            "Hyvä. Toivottavasti tutkimus auttaa.",
                            "Kiitos. Odotan tuloksia.",
                        ),
                    ),
                    closing_texts=(
                        "Kiitos lääkäri. Sinä kuuntelit hyvin.",
                        "Hyvä. Nyt minulla on parempi olo.",
                        "Kiitos. Sinä kysyit tärkeät asiat.",
                    ),
                ),
                "B1-B2": LevelVariant(
                    openers=(
                        "Hyvää päivää, lääkäri. Minulla on ollut rinnassa puristava tunne reilun viikon ajan, ja se huolestuttaa minua.",
                        "Hei. Yskä ei ole mennyt ohi kahteen viikkoon, ja viime päivinä siihen on tullut hengenahdistusta.",
                        "Anteeksi. Päätin tulla, koska päänsärky on ollut päivittäin nyt jo neljä päivää, eikä tavallinen lääke auta.",
                        "Hyvää päivää. Vointini on muuttunut ja olen huolissani — haluaisin käydä asioita läpi kanssanne.",
                    ),
                    assistant_turns=(
                        (
                            "Kipu alkoi noin viikko sitten ja on muuttunut sittemmin tasaisemmaksi. Se tuntuu lähinnä rasituksessa.",
                            "Yskä on jatkunut yli kaksi viikkoa. Aluksi se oli kuiva, mutta nyt siihen tulee limaa.",
                            "Päänsärky alkoi maanantaina. Se on koko päivän tasainen, mutta voimistuu illalla.",
                        ),
                        (
                            "Rasitus pahentaa selvästi, lepo helpottaa noin puolessa tunnissa. Yöllä se on harvemmin.",
                            "Tupakointi tuntuu pahentavan, ja kylmä ulkoilma laukaisee sen helpommin.",
                            "Stressi näyttää voimistavan kipua, ja viimeisellä viikolla työ on ollut tavallista raskaampaa.",
                        ),
                        (
                            "Käytän verenpainelääkettä joka aamu. Muita säännöllisiä lääkityksiä ei ole.",
                            "Suvussa on ollut sydänsairauksia — isäni sairastui kolmenkymmenen vuoden iässä.",
                            "Olen aiemmin ollut sydänlääkärin seurannassa pari vuotta, mutta seuranta päättyi hyvään tilanteeseen.",
                        ),
                        (
                            "Kiitos. Olen helpottuneempi, kun tilanne on käyty läpi.",
                            "Hyvä. Toivon, että tutkimukset selvittävät, mistä on kyse.",
                            "Kiitos. Odotan, mihin suuntaan päätätte tästä viedä.",
                        ),
                    ),
                    closing_texts=(
                        "Kiitos lääkäri. Tunsin, että tilanne otettiin tosissaan ja kysymykset olivat oleellisia.",
                        "Hyvä. Käyntinne tuntui jäsennellyltä ja olo on rauhallisempi.",
                        "Kiitos. Sain selkeämmän kuvan siitä, mitä tästä eteenpäin tapahtuu.",
                    ),
                ),
                "C1-C2": LevelVariant(
                    openers=(
                        "Hyvää päivää, lääkäri. Tulin, koska oirekuva on muuttunut tavalla, jota en osaa enää kotioloissa rauhoittaa, ja huoleni alkaa olla perusteltu.",
                        "Hei. Olen seurannut oiretta itse pari viikkoa ja päätin tulla, koska tavanomaiset selitykset eivät enää kata sitä, mitä koen.",
                        "Hyvää päivää. Tulin pyytämään näkökulmaa, koska oma tulkintani tilanteesta on epävarma ja haluan, että sen taustaa avataan kunnolla.",
                    ),
                    assistant_turns=(
                        (
                            "Kipu paikantuu rintalastan taakse, säteilee vasempaan käteen rasituksessa ja muistuttaa luonteeltaan puristavaa, ei pistävää.",
                            "Yskä on muuttunut viimeisten päivien aikana — alun kuivasta limaiseksi, ja siihen on liittynyt yötä kohti pahentuvaa hengenahdistusta.",
                            "Päänsärky on luonteeltaan jomottava ja painottuu otsalle, ja siihen on tullut viime päivinä uusi valoarkuuden komponentti, jota ei aiemmin ollut.",
                        ),
                        (
                            "Voimistuminen on selvästi rasitussidonnaista — viiden minuutin kävely riittää sen laukaisemaan, ja lepo lievittää alle kymmenessä minuutissa.",
                            "Pahentavia tekijöitä ovat kylmä ulkoilma ja ponnistelu, ja olen huomannut, että aikaisempi lääkitys ei tuota enää aiempaa vaikutusta.",
                            "Stressi vaikuttaa selkeästi, ja olen pannut merkille, että viimeaikaiset työpaineet ovat osuneet samaan jaksoon kuin oireenkuvan paheneminen.",
                        ),
                        (
                            "Käytän verenpainelääkettä päivittäin. Suvussa on varhaista sepelvaltimotautia — isälläni se diagnosoitiin alle neljäkymppisenä.",
                            "Aiempaa kardiologista seurantaa on ollut, ja silloiset löydökset olivat lieviä, mutta tilanteen luonteen muutos on tehnyt minut levottomaksi.",
                            "Lääkityksessä on viimeisen vuoden aikana tehty muutoksia, ja epäilen itse, että nykyinen vaste ei ole enää sama kuin alkuvaiheessa.",
                        ),
                        (
                            "Kiitos. Tunnen, että tilanne sai sen rakenteellisen arvion, jota tulin hakemaan.",
                            "Hyvä. Käyntinne tarjosi sen kliinisen näkökulman, jota minulta itseltäni puuttui.",
                            "Kiitos. Odotan, mihin suuntaan tutkimukset viittaavat ja millaista seurantasuunnitelmaa ehdotatte.",
                        ),
                    ),
                    closing_texts=(
                        "Kiitos lääkäri. Haastattelu eteni kliinisesti loogisesti ja tuotti tilanteesta käyttökelpoisen kuvan.",
                        "Hyvä. Kysymyksenne nostivat juuri ne kohdat, jotka itse koin oleellisiksi, ja se vahvisti luottamusta käyntiin.",
                        "Kiitos. Esitys oli ammatillisesti vahva ja samalla potilaslähtöinen.",
                    ),
                ),
            },
        ),
        # ── doctor_follow_up_explanation — FIXED. AI plays the patient. ────────
        # Was: AI persona=Patient but spoke as doctor explaining next steps.
        # Now: AI is the patient who has heard the diagnosis and asks clarifying
        # questions; the user (doctor) practices explaining next steps clearly.
        _spec(
            scenario_id="doctor_follow_up_explanation",
            profession="doctor",
            track="professional",
            title="Explain next steps",
            persona_name="Patient",
            intro="Olet kertomassa potilaalle seuraavia tutkimuksia tai hoitovaiheita. Pidä ohjeet tarkkoina ja samalla potilaalle ymmärrettävinä; tarkista ymmärtäminen ennen seuraavaa kohtaa.",
            key_phrases=("seuraava vaihe", "tutkimus", "seuranta", "ohje"),
            grammar_tip="Jaa ohjeet pieniin osiin ja tarkista ymmärtäminen ennen seuraavaa kohtaa.",
            voice_profile="yki_standard_male",
            levels={
                "A1-A2": LevelVariant(
                    openers=(
                        "Hei lääkäri. Mitä tapahtuu nyt? Olen vähän peloissani.",
                        "Hei. Mitä tämä tarkoittaa? En ymmärrä vielä.",
                        "Anteeksi lääkäri. Mitä pitää tehdä seuraavaksi?",
                        "Hei. Mikä on suunnitelma? Kerro hitaasti.",
                    ),
                    assistant_turns=(
                        (
                            "Selvä. Onko se vaarallista?",
                            "Ymmärrän. Onko tämä iso ongelma?",
                            "Selvä. Pitääkö olla peloissani?",
                        ),
                        (
                            "Mitä minun pitää tehdä kotona?",
                            "Voinko mennä töihin?",
                            "Voiko syödä normaalisti?",
                        ),
                        (
                            "Milloin tulen takaisin?",
                            "Kuinka pian saan tulokset?",
                            "Pitääkö soittaa, jos paha?",
                        ),
                        (
                            "Selvä. Kiitos lääkäri.",
                            "Hyvä. Nyt ymmärrän paremmin.",
                            "Kiitos. Yritän muistaa.",
                        ),
                    ),
                    closing_texts=(
                        "Kiitos. Selitit hyvin.",
                        "Hyvä lääkäri. Ymmärsin.",
                        "Kiitos. Nyt on rauhallisempi olo.",
                    ),
                ),
                "B1-B2": LevelVariant(
                    openers=(
                        "Hyvää päivää, lääkäri. Olen yrittänyt ymmärtää tilanteen, mutta haluaisin käydä seuraavat askeleet kanssanne läpi rauhassa.",
                        "Hei. Sain edellisellä käynnillä paljon tietoa, mutta jotain jäi epäselväksi — voisitteko selittää, mitä nyt tarkalleen tapahtuu?",
                        "Anteeksi. Olen huolestunut, koska en ole varma, mitä tämä tarkoittaa pidemmällä aikavälillä.",
                        "Hyvää päivää. Haluaisin varmistaa, että ymmärrän oikein, mitä seuraavaksi suunnitellaan ja miksi.",
                    ),
                    assistant_turns=(
                        (
                            "Selvä. Voitteko selittää vielä, mitä tutkimuksessa varsinaisesti katsotaan ja miksi se on tärkeä?",
                            "Hyvä. Tarkoittaako tämä, että tilanne on vakavampi kuin alussa luulin, vai onko tämä rutiinia?",
                            "Selvä. Mitä riskejä tähän tutkimukseen liittyy, jos jokin menee toisin kuin odotetaan?",
                        ),
                        (
                            "Hyvä. Mitä minun pitää tehdä kotona seuraavien päivien aikana, ja onko jotain mitä on syytä välttää?",
                            "Selvä. Voinko jatkaa työtä normaalisti, vai onko jotain rajoitteita, jotka pitää ottaa huomioon?",
                            "Hyvä. Mitä minun pitää muistaa ruokailussa ja lääkityksessä ennen seuraavaa käyntiä?",
                        ),
                        (
                            "Selvä. Milloin minun pitäisi tulla takaisin, ja kenelle ilmoitan, jos tilanne muuttuu äkillisesti?",
                            "Hyvä. Mihin merkkeihin pitää reagoida niin, että tulen aikaisemmin uudelleen?",
                            "Selvä. Jos tunnen, että vointi pahenee selvästi, tuleeko soittaa teille vai mennä päivystykseen?",
                        ),
                        (
                            "Kiitos. Olo on selkeämpi, kun tiedän, mitä seuraavaksi tapahtuu.",
                            "Hyvä. Toivon, että pystyn muistamaan tämän kaiken — saanko vielä lyhyen kirjallisen yhteenvedon?",
                            "Kiitos. Tämä antoi sen rauhan, jota tarvitsin lähteäkseni kotiin.",
                        ),
                    ),
                    closing_texts=(
                        "Kiitos lääkäri. Selittelitte rauhallisesti ja sain käytännön toimet selkeiksi.",
                        "Hyvä. Tunsin, että ehdin kysyä kaiken oleellisen ja ymmärsin vastaukset.",
                        "Kiitos. Lähden täältä paljon rauhallisempana kuin tulin.",
                    ),
                ),
                "C1-C2": LevelVariant(
                    openers=(
                        "Hyvää päivää, lääkäri. Edellisellä käynnillä saatu tieto on osin sulanut, mutta osasta haluaisin tarkennusta — etenkin siitä, mitä tämä tarkoittaa pidemmällä aikavälillä.",
                        "Hei. Olen lukenut taustaa itsekin, ja se on osin lisännyt epävarmuutta. Voisimmeko käydä asiat järjestyksessä niin, että keskinäinen ymmärrys varmistuu kohta kohdalta?",
                        "Hyvää päivää. Tulin pyytämään selkeän etenemissuunnitelman, jossa erotellaan välittömät askeleet, seuranta ja se, mitä itse voin tehdä siinä välissä.",
                    ),
                    assistant_turns=(
                        (
                            "Selvä. Voisitteko erotella, mikä tutkimuksen tavoitteena on diagnostisesti varmistaa ja mikä on poissulkemista varten?",
                            "Hyvä. Mitä epävarmuus liittyy tähän tutkimukseen — kuinka todennäköistä on, että tulos on yksiselitteinen?",
                            "Selvä. Mitkä ovat tutkimuksen rajoitteet eli ne kohdat, joista se ei vielä anna vastausta?",
                        ),
                        (
                            "Hyvä. Mitä rajoitteita arkeen liittyy, ja missä kohdin voin elää käytännössä normaalia elämää tutkimusta odotellessa?",
                            "Selvä. Mitkä signaalit ovat sellaisia, joiden pitäisi muuttaa käyttäytymistäni välittömästi, eikä odottaa seuraavaa käyntiä?",
                            "Hyvä. Onko itsehoidossa jotain, mitä voin tehdä aktiivisesti edesauttaakseni tilannetta, vai onko paras strategia rauhallinen seuranta?",
                        ),
                        (
                            "Selvä. Miten seuranta käytännössä järjestetään — kuka koordinoi ja mihin minä otan yhteyttä, jos jokin tuntuu poikkeavalta?",
                            "Hyvä. Millä aikavälillä päätökset hoitolinjasta tehdään, ja missä kohdin minä olen mukana niissä keskusteluissa?",
                            "Selvä. Onko realistista, että tilanne kehittyy nopeasti, ja jos on, mistä merkeistä se voi näkyä ennen seuraavaa käyntiä?",
                        ),
                        (
                            "Kiitos. Tunnen, että keskinäinen kuva on nyt linjassa ja päätöksenteko on jaettu selvästi.",
                            "Hyvä. Selitys oli ammatillisesti tarkka ja samalla inhimillisesti rauhoittava — se yhdistelmä on harvinainen.",
                            "Kiitos. Lähden täältä luottavaisempana siihen, että minä ja te puhumme samasta asiasta.",
                        ),
                    ),
                    closing_texts=(
                        "Kiitos lääkäri. Selostuksenne yhdisti kliinisen tarkkuuden ja potilaan näkökulman uskottavasti.",
                        "Hyvä. Sain käyntiltä juuri sen rakenteellisen kuvan, jota olin etsimässä.",
                        "Kiitos. Tämä keskustelu oli ammatillisesti vakuuttava ja inhimillisesti läsnäoleva.",
                    ),
                ),
            },
        ),
    ),

    # ───────────────────────────────────────────────────────────────────────────
    # PRACTICAL NURSE — user is the practical nurse. AI plays a supervisor
    # (daily care report) or recruiter (interview). Both already had correct
    # role assignments in the previous version — only adding level variants.
    # ───────────────────────────────────────────────────────────────────────────
    "practical_nurse": (
        _spec(
            scenario_id="practical_nurse_daily_care",
            profession="practical_nurse",
            track="professional",
            title="Daily care update",
            persona_name="Supervisor",
            intro="Harjoittelet lähihoitajan arjen raportointia. Etene havainnoista toimintaan ja jatkoseurantaan.",
            key_phrases=("arki", "liikkuminen", "ruokailu", "havainto"),
            grammar_tip="Pidä raportti konkreettisena: mitä tapahtui, mitä huomasit, mitä teit, mitä seuraavaksi seurataan.",
            voice_profile="yki_standard_female",
            levels={
                "A1-A2": LevelVariant(
                    openers=(
                        "Hei. Kerro, miten asiakas voi tänään.",
                        "Hei. Mikä on tilanne tänään? Lyhyesti.",
                        "Hyvää päivää. Miten päivä meni?",
                        "Hei. Onko asiakkaalla jotain uutta?",
                    ),
                    assistant_turns=(
                        ("Hyvä. Söikö hän hyvin?", "Selvä. Liikkuiko hän paljon?", "Hyvä. Oliko ruokailu helppo?"),
                        ("Selvä. Oliko hän iloinen vai surullinen?", "Hyvä. Onko mieliala muuttunut?", "Selvä. Jaksaako hän tehdä asioita?"),
                        ("Hyvä. Mitä sinä autoit?", "Selvä. Mitä teit hänen kanssaan?", "Hyvä. Miten autoit tänään?"),
                        ("Kiitos. Sano lyhyesti tärkein asia.", "Hyvä. Tee lyhyt yhteenveto.", "Kiitos. Mikä oli tärkein huomio?"),
                    ),
                    closing_texts=(
                        "Hyvä. Raportti oli selvä.",
                        "Kiitos. Tärkeät asiat tulivat esiin.",
                        "Hyvä. Hoito on hyvällä mallilla.",
                    ),
                ),
                "B1-B2": LevelVariant(
                    openers=(
                        "Hei, aloitetaan päivän raportti. Kerro minulle ensin, miten asiakkaan arki ja vointi ovat sujuneet tänään.",
                        "Hei. Käydään päivä lyhyesti läpi — kerro, mikä sujui hyvin ja missä oli haasteita.",
                        "Hyvää päivää. Anna kuva päivän kulusta keskeisten arjen toimintojen näkökulmasta.",
                        "Hei. Aloita raportti tärkeimmistä huomioista, jotta saan tilannekuvan nopeasti.",
                    ),
                    assistant_turns=(
                        (
                            "Hyvä. Miten liikkuminen, ruokailu tai hygienia sujuivat päivän aikana?",
                            "Selvä. Käydään läpi arjen perustoiminnot — miten ne onnistuivat?",
                            "Hyvä. Olivatko päivittäiset toimet sujuvia, vai oliko jossakin hankaluutta?",
                        ),
                        (
                            "Selvä. Huomasitko muutoksia mielialassa, jaksamisessa tai yhteistyössä?",
                            "Hyvä. Oliko asiakkaan oma vire samanlainen kuin eilen, vai poikkeaako se?",
                            "Selvä. Mitä huomioita teit asiakkaan henkisestä voinnista?",
                        ),
                        (
                            "Hyvä. Mitä teit itse tilanteen tukemiseksi tai helpottamiseksi?",
                            "Selvä. Millaisia konkreettisia tukitoimia tarjosit päivän aikana?",
                            "Hyvä. Miten reagoit, kun huomasit, että jokin ei sujunut?",
                        ),
                        (
                            "Kiitos. Tee vielä lopuksi lyhyt työvuoroon sopiva yhteenveto tärkeimmistä havainnoista.",
                            "Hyvä. Vedä päivä yhteen niin, että iltavuoro saa tärkeimmät asiat heti haltuun.",
                            "Kiitos. Yhdistä havainnot ja toimet yhteen raporttiin, joka kelpaa luovutukseen.",
                        ),
                    ),
                    closing_texts=(
                        "Hyvä. Raportti oli käytännöllinen ja sopi hyvin päivittäisen hoivatyön tarpeisiin.",
                        "Kiitos. Päivän kulku ja huomiot välittyivät selkeästi.",
                        "Hyvä. Yhteenveto antoi seuraavalle vuorolle hyvän pohjan jatkaa.",
                    ),
                ),
                "C1-C2": LevelVariant(
                    openers=(
                        "Hei. Käydään päivä läpi systemaattisesti — paina niihin kohtiin, jotka poikkeavat asiakkaan tavanomaisesta arjesta.",
                        "Hei. Mietitään tämän päivän raportti niin, että erottelet havainnot, niistä tehdyt tulkinnat ja niiden pohjalta valitut toimet.",
                        "Hyvää päivää. Aloita arjen toimintakyvyn kokonaiskuvasta ja siirry sitten yksittäisiin huomioihin, jotka muuttavat hoidon suuntaa.",
                    ),
                    assistant_turns=(
                        (
                            "Hyvä. Mitkä arjen toiminnoissa havaitut muutokset ovat sellaisia, jotka voivat ennakoida toimintakyvyn pidempiaikaista muutosta?",
                            "Selvä. Miten erotat ohimenevän hankaluuden siitä, mikä alkaa muodostaa pysyvää kuviota?",
                            "Hyvä. Mistä konkreettisista signaaleista päättelet, että tukea tulisi lisätä, ennen kuin tilanne kärjistyy?",
                        ),
                        (
                            "Selvä. Miten kuvailet asiakkaan itsemääräämisoikeuden ja turvallisuuden välistä tasapainoa tänään?",
                            "Hyvä. Olivatko vuorovaikutustilanteet sellaisia, jotka tukevat asiakkaan toimijuutta, vai oliko niissä jotain, mistä haluat keskustella?",
                            "Selvä. Mitkä asiakkaan vahvuudet pääsivät tänään esille, ja miten huomasit ne käytännössä?",
                        ),
                        (
                            "Hyvä. Mitkä omat valintasi tänään olivat sellaisia, joista et ollut alussa varma, mutta jotka osoittautuivat oikeiksi?",
                            "Selvä. Onko tilanteita, joissa nyt jälkikäteen toimisit toisin, ja mitä se kertoo seuraavasta vuorosta?",
                            "Hyvä. Mitä työvälineitä tai tukitoimia olisit kaivannut tilanteissa, joissa jouduit improvisoimaan?",
                        ),
                        (
                            "Kiitos. Tee raportti niin, että se ohjaa iltavuoroa konkreettisesti — ei vain selkeyttä, vaan suunnan.",
                            "Hyvä. Vedä päivä yhteen siten, että jatkosuunnitelma on heti luettavissa rivien välistä.",
                            "Kiitos. Kokoa havainnot ja toimet muotoon, joka kelpaa myös pidemmän aikavälin seurantapohjaksi.",
                        ),
                    ),
                    closing_texts=(
                        "Hyvä. Raportti oli ammatillisesti tarkka ja näytti kykyä erottaa olennainen.",
                        "Kiitos. Hoivatyön rakenne tuli näkyväksi ja päätöksenteko oli jäljitettävissä.",
                        "Hyvä. Esitys yhdisti käytännön havainnot ja pidemmän aikavälin näkökulman vakuuttavasti.",
                    ),
                ),
            },
        ),
        _spec(
            scenario_id="practical_nurse_interview",
            profession="practical_nurse",
            track="professional",
            title="Practical nurse interview",
            persona_name="Recruiter",
            intro="Tämä on lähihoitajan haastattelutilanne. Vastaa selkeästi ja näytä, miten toimit arjen hoivatyössä.",
            key_phrases=("kokemus", "asiakas", "arki", "yhteistyö"),
            grammar_tip="Käytä konkreettisia esimerkkejä asiakkaan kohtaamisesta, päivittäisestä tuesta ja havainnoista.",
            voice_profile="yki_standard_female",
            interview_mode=True,
            levels={
                "A1-A2": LevelVariant(
                    openers=(
                        "Hei. Tervetuloa. Kerro työsi lyhyesti.",
                        "Hei. Missä olet ollut töissä? Kerro vähän.",
                        "Hyvää päivää. Mitä työtä olet tehnyt?",
                        "Hei. Kuinka kauan olet ollut lähihoitaja?",
                    ),
                    assistant_turns=(
                        ("Selvä. Kerro yksi tilanne. Autoit asiakasta. Miten?", "Hyvä. Mikä on hyvä esimerkki työstäsi?", "Selvä. Anna esimerkki, miten autat."),
                        ("Hyvä. Mitä teet, jos asiakas voi huonosti?", "Selvä. Miten autat, jos joku tarvitsee apua?", "Hyvä. Mitä teet, jos näet ongelman?"),
                        ("Selvä. Toimitko hyvin tiimissä?", "Hyvä. Onko helppo tehdä yhteistyötä?", "Selvä. Kerro raportista lyhyesti."),
                        ("Kiitos. Miksi tämä työ sopii sinulle?", "Hyvä. Miksi haluat tämän työn?", "Kiitos. Miksi sopisit tähän?"),
                    ),
                    closing_texts=(
                        "Kiitos. Vastauksesi olivat selvät.",
                        "Hyvä. Kerroit asiat hyvin.",
                        "Kiitos haastattelusta.",
                    ),
                ),
                "B1-B2": LevelVariant(
                    openers=(
                        "Hei, tervetuloa haastatteluun. Kerro aluksi lyhyesti omasta lähihoitajan tai hoiva-alan kokemuksestasi.",
                        "Hei. Käydään lyhyesti läpi tausta — kerro, missä olet työskennellyt ja millaisten asiakkaiden kanssa.",
                        "Hyvää päivää. Aloitetaan kokemuksestasi: kuvaa, mitä työtehtäviä olet tehnyt ja millaisessa ympäristössä.",
                        "Hei. Kerro alkuun lyhyt yhteenveto työkokemuksestasi lähihoitajana.",
                    ),
                    assistant_turns=(
                        (
                            "Kiitos. Kerro esimerkki tilanteesta, jossa autoit asiakasta arjessa kiireen keskellä.",
                            "Hyvä. Anna konkreettinen esimerkki tilanteesta, jossa jouduit priorisoimaan asiakkaita.",
                            "Selvä. Kerro tilanne, jossa pieni huomio teki asiakkaan päivästä paremman.",
                        ),
                        (
                            "Hyvä. Miten toimit, jos huomaat muutoksen asiakkaan voinnissa tai toimintakyvyssä?",
                            "Selvä. Mitä teet, jos asiakas vaikuttaa olevan tavanomaista huonommassa kunnossa?",
                            "Hyvä. Kerro, miten varmistat, että havaitsemasi muutos tulee dokumentoitua ja viestittyä.",
                        ),
                        (
                            "Selvä. Millainen työntekijä olet tiimissä ja vuororaportoinnissa?",
                            "Hyvä. Miten kuvailet itseäsi tiimin jäsenenä?",
                            "Selvä. Mitä luulet kollegoidesi sanovan sinusta yhteistyökumppanina?",
                        ),
                        (
                            "Kiitos. Miksi juuri tämä työ sopii sinulle lähihoitajana?",
                            "Hyvä. Miksi haet juuri tähän tehtävään juuri nyt?",
                            "Kiitos. Mistä syystä uskot, että sinä olet hyvä ehdokas tähän paikkaan?",
                        ),
                    ),
                    closing_texts=(
                        "Kiitos haastattelusta. Vastauksista välittyi selkeä käytännön hoivatyön ote.",
                        "Hyvä. Esimerkkisi olivat konkreettisia ja näyttivät tilannetajun.",
                        "Kiitos. Kerroit kokemuksesta jäsennellysti ja vastasit kysymyksiin selkeästi.",
                    ),
                ),
                "C1-C2": LevelVariant(
                    openers=(
                        "Hei, tervetuloa. Avaa lyhyesti urapolkuasi ja kerro, missä vaiheessa hoivatyön ammattitaitosi on syventynyt selvimmin.",
                        "Hei. Kerro tausta tiivistettynä — keskity tilanteisiin, joissa olet kasvanut työssäsi.",
                        "Hyvää päivää. Aloitetaan ammatillisesta polustasi: mitä vaiheita on ollut ja mitä niistä jäi käteen.",
                    ),
                    assistant_turns=(
                        (
                            "Hyvä. Kuvaile tilanne, jossa kiireen keskellä jouduit tekemään valinnan, ja miten perustelit sen jälkikäteen kollegoille.",
                            "Selvä. Kerro tilanne, jossa pieni ammatillinen havainto teki ratkaisevan eron asiakkaan arjessa.",
                            "Hyvä. Anna esimerkki, jossa jouduit asettumaan asiakkaan puolelle, vaikka se vaati ottamaan kantaa kollegan toimintaan.",
                        ),
                        (
                            "Selvä. Kuvaa tilanne, jossa havaitsit muutoksen ennen muita ja miten veit asian eteenpäin.",
                            "Hyvä. Miten erotat asiakkaan tilapäisen huonon päivän siitä, mikä on signaali pidemmän aikavälin muutoksesta?",
                            "Selvä. Kerro, miten toimit, jos havaitsemasi huoli ei aluksi saa tiimissä vastakaikua.",
                        ),
                        (
                            "Hyvä. Miten kuvailisit itseäsi tiimin jäsenenä konfliktitilanteessa, et rauhallisina päivinä?",
                            "Selvä. Kerro, miten rakennat luottamusta uudessa tiimissä ensimmäisten viikkojen aikana.",
                            "Hyvä. Anna esimerkki tilanteesta, jossa tiimi epäonnistui, ja kerro oma roolisi sekä se, mitä opit.",
                        ),
                        (
                            "Kiitos. Lopuksi: mitä haluat tästä tehtävästä enemmän kuin toisesta vastaavasta?",
                            "Hyvä. Kerro, miksi juuri me olemme sinulle relevantti työnantaja juuri nyt.",
                            "Kiitos. Mikä on se, mistä uskot, että jätät tähän organisaatioon jäljen, jos sinut palkataan?",
                        ),
                    ),
                    closing_texts=(
                        "Kiitos haastattelusta. Vastaukset olivat ammatillisesti syvällisiä ja itsereflektiosi oli aitoa.",
                        "Hyvä. Esimerkkisi olivat konkreettisia ja niistä välittyi laaja hoivanäkemys.",
                        "Kiitos. Kokonaisuus oli vakuuttava ja kuva itseohjautuvuudestasi oli selkeä.",
                    ),
                ),
            },
        ),
    ),
}

_SCENARIO_BY_ID = {spec.scenario_id: spec for specs in _ROLEPLAY_REGISTRY.values() for spec in specs}


def _external_status(status: str) -> str:
    return {"ACTIVE": "active", "COMPLETE": "completed", "EXPIRED": "expired"}.get(str(status or "").upper(), "active")


def _normalize_profession(value: str | None) -> str:
    raw = str(value or "general").strip().lower()
    if raw in {"doctor", "nurse", "practical_nurse", "general"}:
        return raw
    if raw in {"lähihoitaja", "lahioitaja"}:
        return "practical_nurse"
    return "general"


def _normalize_level(value: str | None) -> str:
    raw = str(value or "B1-B2").strip().upper().replace("_", "-")
    aliases = {"A1": "A1-A2", "A2": "A1-A2", "B1": "B1-B2", "B2": "B1-B2", "C1": "C1-C2", "C2": "C1-C2"}
    return aliases.get(raw, raw if raw in {"A1-A2", "B1-B2", "C1-C2"} else "B1-B2")


def _is_expired(session: dict[str, Any]) -> bool:
    expires_at = parse_iso(session.get("expires_at"))
    return bool(expires_at and expires_at <= utc_now())


def _assert_session_access(*, session: dict[str, Any] | None, user_id: str) -> dict[str, Any]:
    if not session:
        raise AppError(404, "ROLEPLAY_NOT_FOUND", "Roleplay session was not found.", False, {"classification": "terminal"})
    if session.get("user_id") != user_id:
        raise AppError(403, "ROLEPLAY_FORBIDDEN", "Roleplay session is not available for this user.", False, {"classification": "non_retryable"})
    if _is_expired(session):
        session["status"] = "EXPIRED"
        raise AppError(410, "SESSION_EXPIRED", "Roleplay session has expired.", False, {"classification": "terminal", "session_type": "roleplay"})
    return session


def _scenario_payload(spec: ScenarioSpec, level_band: str) -> dict[str, Any]:
    return {
        "scenario_id": spec.scenario_id,
        "id": spec.scenario_id,
        "family": "professional_healthcare" if spec.track == "professional" else "general_finnish",
        "title": spec.title,
        "prompt": spec.title,
        "keyPhrases": list(spec.key_phrases),
        "grammarTip": spec.grammar_tip,
        "levelBand": level_band,
        "profession": spec.profession,
        "track": spec.track,
        "personaName": spec.persona_name,
        "interviewMode": spec.interview_mode,
    }


def _default_scenario_for_profession(profession: str, context_label: str | None = None) -> ScenarioSpec:
    context = str(context_label or "").lower()
    specs = _ROLEPLAY_REGISTRY.get(profession) or _ROLEPLAY_REGISTRY["general"]
    if "interview" in context:
        for spec in specs:
            if spec.interview_mode:
                return spec
    return specs[0]


def _resolve_scenario(*, profession: str, scenario_id: str | None = None, context_label: str | None = None) -> ScenarioSpec:
    profession = _normalize_profession(profession)
    if scenario_id:
        spec = _SCENARIO_BY_ID.get(str(scenario_id).strip())
        if spec:
            return spec
    return _default_scenario_for_profession(profession, context_label)


def _serialize_session(session: dict[str, Any]) -> dict[str, Any]:
    return {
        "session_id": session["session_id"],
        "created_at": session["created_at"],
        "expires_at": session["expires_at"],
        "status": _external_status(session["status"]),
        "scenario": session["scenario"],
        "level": session["level"],
        "progress": session["progress"],
        "messages": session["messages"],
        "ui": session["ui"],
        "profession": session.get("profession", "general"),
        "persona_name": session.get("persona_name", "AI"),
        "persona_id": session.get("persona_id"),
        "persona_gender": session.get("persona_gender"),
        "voice_profile": session.get("voice_profile", "yki_standard_female"),
    }


def _missing_key_phrases(spec: ScenarioSpec, transcript: str) -> list[str]:
    lowered = transcript.lower()
    return [phrase for phrase in spec.key_phrases if phrase.lower() not in lowered][:3]


def _feedback_line(spec: ScenarioSpec, transcript: str, missing: list[str], turn_index: int) -> str:
    words = len([part for part in transcript.strip().split() if part])
    if words < 4:
        return "Vastaa hieman pidemmin ja nimeä tilanne mahdollisimman konkreettisesti."
    if missing:
        return f"Hyvä suunta. Lisää vielä mukaan esimerkiksi: {', '.join(missing)}."
    if turn_index == 1:
        return "Hyvä alku. Pidä rakenne rauhallisena ja jatka samalla selkeällä tyylillä."
    return "Hyvä. Jatka samalla työelämään sopivalla, täsmällisellä suomella."


def _build_session(*, user_id: str, spec: ScenarioSpec, level_band: str, display_preferences: dict[str, Any] | None = None) -> dict[str, Any]:
    session_id = new_id("rp")
    transcript_id = new_id("tr")
    review_id = new_id("rv")
    created_at = utc_now().replace(microsecond=0).isoformat()
    expires_at = (parse_iso(created_at) + timedelta(minutes=SETTINGS.roleplay_session_ttl_minutes)).replace(microsecond=0).isoformat()

    # Resolve a Finnish persona for this session. Deterministic per (user, session) so
    # a mid-session reload keeps the same name.
    # Do not infer persona gender from spec.voice_profile here.
    # Most scenario specs use yki_standard_female as a safe default, and using
    # that as a gender preference forced nearly every roleplay to female.
    # Persona selection should choose the speaker first; the selected persona
    # then supplies the matching voice_profile.
    prefer_gender = None
    explicit_persona_gender = getattr(spec, "persona_gender", None)
    if isinstance(explicit_persona_gender, str) and explicit_persona_gender.lower() in {"male", "female"}:
        prefer_gender = explicit_persona_gender.lower()
    persona = pick_persona(
        scenario_id=spec.scenario_id,
        profession=spec.profession,
        prefer_gender=prefer_gender,
        seed=f"{user_id}:{session_id}",
    )
    persona_display = persona.display_name
    persona_voice = persona.voice_profile or spec.voice_profile

    # Pick this session's level-appropriate opener / turn-slot lines / closing.
    # Deterministic by session seed so reloads see the same selection. Fixes:
    #   - #6 (per-level speed and complexity) — A1-A2/B1-B2/C1-C2 each have their own lines
    #   - #7 (repetitive openings) — multiple alternative openers per level
    selection = spec.select_for_session(level_band=level_band, seed=f"{user_id}:{session_id}")
    chosen_opener = selection["opener"]
    chosen_turns = selection["turns"]
    chosen_closing = selection["closing"]

    opening = {
        "message_id": new_id("msg"),
        "speaker": "AI",
        "text": chosen_opener,
        "translation": None,
        "emotion": "professional" if spec.track == "professional" else "supportive",
        "timestamp": iso_now(),
    }
    scenario = _scenario_payload(spec, level_band)
    # Override the generic persona_name from the spec with the resolved Finnish persona
    scenario["personaName"] = persona_display
    scenario["personaId"] = persona.id
    scenario["personaGender"] = persona.gender
    return {
        "session_id": session_id,
        "user_id": user_id,
        "status": "ACTIVE",
        "created_at": created_at,
        "expires_at": expires_at,
        "scenario": scenario,
        "level": level_band,
        "profession": spec.profession,
        "persona_name": persona_display,
        "persona_id": persona.id,
        "persona_gender": persona.gender,
        "voice_profile": persona_voice,
        "progress": {"user_turns_completed": 0, "user_turns_total": len(chosen_turns), "stage": "OPENING"},
        "messages": [opening],
        "turns": [{"turn_index": 0, "stage": "OPENING", "speaker": "AI", "text": chosen_opener, "emotion": opening["emotion"], "timestamp": opening["timestamp"]}],
        "ui": {"show_input": True, "allow_submit": True, "allow_restart": False, "show_review": False},
        "transcript_id": transcript_id,
        "review_id": review_id,
        "display_preferences": display_preferences or {},
        "feedback_lines": [],
        # Persist the chosen variants so _submit_session_turn returns the lines the
        # user already saw at the start of the session, even after a reload.
        "scripted": {
            "opener": chosen_opener,
            "turns": list(chosen_turns),
            "closing": chosen_closing,
            "level_band": level_band,
        },
    }


def _create_session(*, user_id: str, scenario_id: str, level: str, display_preferences: dict[str, Any] | None) -> dict[str, Any]:
    profession = _normalize_profession((display_preferences or {}).get("profession") or scenario_id.split("_", 1)[0])
    spec = _resolve_scenario(profession=profession, scenario_id=scenario_id, context_label=(display_preferences or {}).get("context_label"))
    session = _build_session(user_id=user_id, spec=spec, level_band=_normalize_level(level), display_preferences=display_preferences)
    with STORE.locked(("roleplay_sessions", session["session_id"])):
        STORE.set("roleplay_sessions", session["session_id"], session)
    return _serialize_session(session)


def _append_turn(session: dict[str, Any], *, speaker: str, text: str, stage: str, extra: dict[str, Any] | None = None) -> dict[str, Any]:
    entry = {"message_id": new_id("msg"), "speaker": speaker, "text": text, "timestamp": iso_now()}
    if speaker == "AI":
        entry["translation"] = None
        entry["emotion"] = "professional" if session.get("scenario", {}).get("track") == "professional" else "supportive"
    session["messages"].append(entry)
    turn = {"turn_index": len(session["turns"]), "stage": stage, "speaker": speaker, "text": text, "timestamp": entry["timestamp"]}
    if extra:
        turn.update(extra)
    session["turns"].append(turn)
    return entry


def _safe_professional_counterpart_fallback(*, session: dict[str, Any], spec: ScenarioSpec, user_message: str, terminal_turn: bool) -> str:
    """Safe in-character fallback when generated/scripted text would flip roles.

    In professional tracks the learner is the doctor/nurse/practical nurse.
    The fallback must therefore speak as patient/resident/client/counterpart,
    never as the professional.
    """
    profession = str(session.get("profession") or _scenario_value(spec, "profession", "general")).strip().lower()
    message = " ".join(str(user_message or "").strip().lower().split())

    if terminal_turn:
        if profession == "practical_nurse":
            return "Kiitos avusta. Minusta tuntuu nyt rauhallisemmalta."
        if profession in {"doctor", "nurse"}:
            return "Kiitos. Tämä keskustelu auttoi minua kertomaan tilanteestani paremmin."
        return "Kiitos keskustelusta. Tämä oli hyvä harjoitus."

    if profession == "doctor":
        if message in {"i don't know", "i dont know", "en tiedä", "mä en tiedä", "mina en tieda", "minä en tiedä"}:
            return "Ymmärrän. Minua huolestuttaa tämä oire, koska se alkoi eilen illalla."
        return "Minua huolestuttaa tämä vaiva. Voinko kertoa tarkemmin, miltä se tuntuu?"

    if profession == "nurse":
        if message in {"i don't know", "i dont know", "en tiedä", "mä en tiedä", "mina en tieda", "minä en tiedä"}:
            return "Ymmärrän. Vointini on vähän epävarma, ja haluaisin kertoa siitä rauhassa."
        return "Minulla on vähän huono olo. Voinko kertoa, mitä tunnen juuri nyt?"

    if profession == "practical_nurse":
        if message in {"i don't know", "i dont know", "en tiedä", "mä en tiedä", "mina en tieda", "minä en tiedä"}:
            return "Ymmärrän. Tarvitsen hetken aikaa, mutta voin yrittää kertoa, mitä tarvitsen."
        return "Voisitko auttaa minua hetken? Haluaisin kertoa, mikä minua vaivaa."

    return "Ymmärrän. Voit jatkaa lyhyesti suomeksi, ja minä vastaan tilanteen mukaan."

def _submit_session_turn(*, user_id: str, session_id: str, user_message: str) -> dict[str, Any]:
    message = str(user_message or "").strip()
    if not message:
        raise AppError(400, "VALIDATION_ERROR", "User message is required.", False, {"classification": "non_retryable"})
    with STORE.locked(("roleplay_sessions", session_id)):
        session = _assert_session_access(session=STORE.get_ref("roleplay_sessions", session_id), user_id=user_id)
        if session["status"] == "COMPLETE":
            raise AppError(409, "ROLEPLAY_COMPLETE", "Roleplay session is already complete.", False, {"classification": "terminal"})
        spec = _SCENARIO_BY_ID.get(session.get("scenario", {}).get("scenario_id", "")) or _default_scenario_for_profession(session.get("profession", "general"))

        # Prefer the per-session selected variants stored at session creation. This
        # ensures the user sees the same level-appropriate lines they started with
        # even if the registry variants change between sessions. Falls back to the
        # spec's legacy (B1-B2 first-variant) fields for sessions created before
        # this change rolled out.
        scripted = session.get("scripted") or {}
        scripted_turns = scripted.get("turns") or list(spec.assistant_turns)
        scripted_closing = scripted.get("closing") or spec.closing_text

        completed = int(session["progress"]["user_turns_completed"]) + 1
        terminal_turn = completed >= len(scripted_turns)
        stage = "COMPLETE" if terminal_turn else f"ACTIVE_{completed}"
        missing = _missing_key_phrases(spec, message)
        feedback_line = _feedback_line(spec, message, missing, completed)
        _append_turn(session, speaker="USER", text=message, stage=stage if not terminal_turn else "FINAL_USER_TURN", extra={"evaluation": {"intent": "response", "grammar_signals": [], "fluency_signal": "stable", "missing_phrases": missing}})
        scripted_fallback_text = scripted_closing if terminal_turn else scripted_turns[completed - 1]
        engine_mode = "scripted_fallback"

        ai_result = generate_ai_roleplay_reply(
            session=session,
            spec=spec,
            user_message=message,
            missing_phrases=missing,
            fallback_text=scripted_fallback_text,
            feedback_fallback=feedback_line,
            terminal_turn=terminal_turn,
        )

        if ai_result and ai_result.get("ai_text"):
            ai_text = str(ai_result["ai_text"]).strip()
            feedback_line = str(ai_result.get("feedback_line") or feedback_line).strip()
            returned_missing = ai_result.get("missing_phrases")
            if isinstance(returned_missing, list):
                missing = [str(item).strip() for item in returned_missing if str(item).strip()]
            engine_mode = str(ai_result.get("engine_mode") or "openai_b_lite")
        else:
            ai_text = scripted_fallback_text

        profession = str(session.get("profession") or _scenario_value(spec, "profession", "general")).strip().lower()
        scenario_id = str((session.get("scenario") or {}).get("scenario_id") or _scenario_value(spec, "scenario_id", ""))
        if _violates_role_contract(ai_text, profession=profession, scenario_id=scenario_id):
            ai_text = _safe_professional_counterpart_fallback(
                session=session,
                spec=spec,
                user_message=message,
                terminal_turn=terminal_turn,
            )
            engine_mode = f"{engine_mode}_role_guard"

        ai_entry = _append_turn(
            session,
            speaker="AI",
            text=ai_text,
            stage="COMPLETE" if terminal_turn else stage,
            extra={"engine_mode": engine_mode},
        )
        session["feedback_lines"].append(feedback_line)
        session["last_engine_mode"] = engine_mode
        session["progress"] = {"user_turns_completed": completed, "user_turns_total": len(scripted_turns), "stage": "COMPLETE" if terminal_turn else stage}
        session["status"] = "COMPLETE" if terminal_turn else "ACTIVE"
        session["ui"] = {"show_input": not terminal_turn, "allow_submit": not terminal_turn, "allow_restart": terminal_turn, "show_review": terminal_turn}
        return {"session_id": session["session_id"], "created_at": session["created_at"], "expires_at": session["expires_at"], "status": _external_status(session["status"]), "progress": session["progress"], "appended_messages": [session["messages"][-2], ai_entry], "ui": session["ui"], "feedback_line": feedback_line, "missing_phrases": missing, "engine_mode": engine_mode}


def _get_session(*, user_id: str, session_id: str) -> dict[str, Any]:
    with STORE.locked(("roleplay_sessions", session_id)):
        return _serialize_session(_assert_session_access(session=STORE.get_ref("roleplay_sessions", session_id), user_id=user_id))


def _build_review(*, user_id: str, session_id: str) -> dict[str, Any]:
    with STORE.locked(("roleplay_sessions", session_id)):
        session = _assert_session_access(session=STORE.get_ref("roleplay_sessions", session_id), user_id=user_id)
        if session["status"] != "COMPLETE":
            raise AppError(409, "ROLEPLAY_REVIEW_UNAVAILABLE", "Roleplay review is available only after completion.", False, {"classification": "terminal"})
        spec = _SCENARIO_BY_ID.get(session.get("scenario", {}).get("scenario_id", "")) or _default_scenario_for_profession(session.get("profession", "general"))
        user_turns = [t for t in session.get("turns", []) if t.get("speaker") == "USER"]
        texts = [str(t.get("text") or "") for t in user_turns]
        all_text = " ".join(texts).lower()
        strong_phrases = [phrase for phrase in spec.key_phrases if phrase.lower() in all_text]
        difficult_phrases = [phrase for phrase in spec.key_phrases if phrase.lower() not in all_text]
        avg_word_count = round(sum(len(t.split()) for t in texts) / max(1, len(texts))) if texts else 0
        transcript_annotated = []
        for turn in session.get("turns", []):
            comment = None
            if turn.get("speaker") == "USER":
                missing = (turn.get("evaluation") or {}).get("missing_phrases") or []
                if missing:
                    comment = f"Voit vahvistaa vastausta lisäämällä esimerkiksi: {', '.join(missing[:2])}."
            transcript_annotated.append({"speaker": str(turn.get("speaker", "")), "text": str(turn.get("text", "")), "comment": comment})
        track_label = "Professional Finnish" if spec.track == "professional" else "General Finnish"
        # Read the resolved Finnish persona from the session, falling back to the spec's
        # generic role label only if an older session pre-dates this feature.
        session_scenario = session.get("scenario") or {}
        persona_name_display = (
            session.get("persona_name")
            or session_scenario.get("personaName")
            or spec.persona_name
        )
        scenario_payload_out = _scenario_payload(spec, session["level"])
        scenario_payload_out["personaName"] = persona_name_display
        if session_scenario.get("personaId"):
            scenario_payload_out["personaId"] = session_scenario["personaId"]
        if session_scenario.get("personaGender"):
            scenario_payload_out["personaGender"] = session_scenario["personaGender"]
        return {
            "session_id": session["session_id"],
            "sessionId": session["session_id"],
            "created_at": session["created_at"],
            "expires_at": session["expires_at"],
            "status": _external_status(session["status"]),
            "completed": True,
            "personaName": persona_name_display,
            "personaId": session.get("persona_id"),
            "personaGender": session.get("persona_gender"),
            "track": spec.track,
            "trackLabel": track_label,
            "levelBand": session["level"],
            "scenario": scenario_payload_out,
            "summary": "Harjoittelu pysyi valitussa ammattiskenaariossa ja eteni ilman geneeristä placeholder-fallbackia.",
            "scores": {"avgPhrasesCoverage": min(3, len(strong_phrases)), "avgWordCount": avg_word_count, "repairLanguageUsed": any("voisitko" in t.lower() or "tarkentaa" in t.lower() for t in texts), "totalTurns": len(user_turns)},
            "transcriptAnnotated": transcript_annotated,
            "strongPhrases": strong_phrases,
            "difficultPhrases": difficult_phrases,
            "grammarObservations": [spec.grammar_tip],
            "nextSteps": [f"Toista skenaario {spec.title.lower()} ja käytä vielä täsmällisemmin avainsanoja.", "Pidä vastaukset työelämään sopivina: yksi tavoite, yksi seuraava askel, yksi yhteenveto."],
            "nextAction": f"Toista skenaario {spec.title.lower()} seuraavalla kierroksella.",
            "overall": {"task_completion": "successful", "interaction_quality": "good", "level_estimate": session["level"]},
        }


def list_scenarios(*, profession: str = "general", level_band: str = "B1-B2") -> list[dict[str, Any]]:
    profession = _normalize_profession(profession)
    band = _normalize_level(level_band)
    return [_scenario_payload(spec, band) for spec in (_ROLEPLAY_REGISTRY.get(profession) or _ROLEPLAY_REGISTRY["general"])]



def _is_a1_a2_level(level_band: str | None) -> bool:
    normalized = str(level_band or "").upper().replace("_", "-")
    return "A1" in normalized or "A2" in normalized


def _a1_beginner_phrase_from_opening(opening_text: str, profession: str) -> str:
    text = str(opening_text or "").strip()
    low = text.lower()
    profession = str(profession or "").strip().lower()

    if "väsynyt" in low or "väsym" in low or "nukkua" in low:
        phrase = "Minulla on väsymystä."
    elif "rinnassa" in low:
        phrase = "Minulla on kipu rinnassa."
    elif "pään" in low or "pää" in low:
        phrase = "Minulla on päänsärky."
    elif "yskä" in low:
        phrase = "Minulla on yskä."
    elif "kuume" in low:
        phrase = "Minulla on kuumetta."
    elif "kipu" in low or "kipua" in low:
        phrase = "Minulla on kipua."
    elif profession == "practical_nurse":
        if "ruoka" in low or "söi" in low or "syö" in low:
            phrase = "Asiakas söi hyvin."
        elif "liikku" in low:
            phrase = "Asiakas liikkui vähän."
        elif "aamu" in low:
            phrase = "Aamu meni hyvin."
        else:
            phrase = "Asiakas voi hyvin."
    elif profession == "nurse":
        if "lääke" in low:
            phrase = "Annoin lääkkeen."
        elif "yö" in low:
            phrase = "Yö meni rauhallisesti."
        elif "potilas" in low:
            phrase = "Potilas voi paremmin."
        else:
            phrase = "Potilas voi hyvin."
    elif profession == "general":
        if "ongelma" in low or "vika" in low or "pieleen" in low:
            phrase = "Tässä on ongelma."
        elif "tehtävä" in low or "työ" in low:
            phrase = "Teen tämän tehtävän."
        else:
            phrase = "Kerron lyhyesti."
    else:
        phrase = "Kerron lyhyesti."

    return f"Kuuntele ensin. {phrase} Sano perässä: {phrase}"


def _doctor_a1_beginner_opening(opening_text: str) -> str:
    return _a1_beginner_phrase_from_opening(opening_text, "doctor")


def _a1_beginner_opening(opening_text: str, profession: str) -> str:
    return _a1_beginner_phrase_from_opening(opening_text, profession)


def start_session(*, profession: str, level_band: str, scenario_id: str | None = None, context_label: str | None = None) -> dict[str, Any]:
    normalized_profession = _normalize_profession(profession)
    band = _normalize_level(level_band)
    spec = _resolve_scenario(profession=normalized_profession, scenario_id=scenario_id, context_label=context_label)
    created = _create_session(user_id="preview", scenario_id=spec.scenario_id, level=band, display_preferences={"context_label": context_label, "profession": normalized_profession})
    # Pull the resolved Finnish persona (and any resolver-adjusted voice profile) from the
    # created session, rather than echoing back the spec's generic role label.
    created_scenario = created.get("scenario") or {}
    persona_name_display = (
        created.get("persona_name")
        or created_scenario.get("personaName")
        or spec.persona_name
    )
    voice_profile_display = created.get("voice_profile") or spec.voice_profile
    # Pull the actual opener that was chosen for THIS session — not the legacy
    # spec.opener default. The first message in the created session is always the
    # opener selected by spec.select_for_session().
    chosen_opening_text = ""
    created_messages = created.get("messages") or []
    if created_messages:
        chosen_opening_text = str(created_messages[0].get("text") or "")
    if not chosen_opening_text:
        chosen_opening_text = spec.opener  # safety fallback

    if _is_a1_a2_level(level_band):
        chosen_opening_text = _a1_beginner_opening(chosen_opening_text, spec.profession)
    # Same for max user turns — read from the session's progress total which was
    # populated from the chosen variant, not from the spec's legacy length.
    chosen_max_turns = int(((created.get("progress") or {}).get("user_turns_total")) or len(spec.assistant_turns))

    return {
        "sessionId": created["session_id"],
        "session_id": created["session_id"],
        "profession": normalized_profession,
        "levelBand": band,
        "track": spec.track,
        "scenarioId": spec.scenario_id,
        "scenario": created_scenario or _scenario_payload(spec, band),
        "introText": spec.intro,
        "openingText": chosen_opening_text,
        "voiceProfile": voice_profile_display,
        "personaName": persona_name_display,
        "personaId": created.get("persona_id") or created_scenario.get("personaId"),
        "personaGender": created.get("persona_gender") or created_scenario.get("personaGender"),
        "maxUserTurns": chosen_max_turns,
    }


def submit_turn(*, session_id: str, transcript: str) -> dict[str, Any]:
    result = _submit_session_turn(user_id="preview", session_id=session_id, user_message=transcript)
    session = _get_session(user_id="preview", session_id=session_id)
    ai_text = str((result.get("appended_messages") or [{}, {}])[-1].get("text") or "")
    return {
        "sessionId": session_id,
        "session_id": session_id,
        "aiText": ai_text,
        "aiReply": ai_text,
        "voiceProfile": session.get("voice_profile", "yki_standard_female"),
        "personaName": session.get("persona_name", "AI"),
        "personaId": session.get("persona_id"),
        "personaGender": session.get("persona_gender"),
        "completed": result.get("status") == "completed",
        "currentUserTurn": result.get("progress", {}).get("user_turns_completed", 0),
        "feedbackLine": result.get("feedback_line"),
        "missingPhrases": result.get("missing_phrases") or [],
        "engineMode": result.get("engine_mode") or session.get("last_engine_mode") or "unknown",
    }


def finish_session(*, session_id: str) -> dict[str, Any]:
    session = _get_session(user_id="preview", session_id=session_id)
    if session.get("status") != "completed":
        return {"session_id": session_id, "status": session.get("status"), "completed": False, "message": "Session is still in progress."}
    review = _build_review(user_id="preview", session_id=session_id)
    return {**review, "completed": True}
