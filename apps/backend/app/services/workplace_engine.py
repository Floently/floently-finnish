"""Workplace-specific Finnish practice helpers."""

from __future__ import annotations

from dataclasses import dataclass
import random
from typing import Dict, List, Optional, Tuple


@dataclass
class WorkplaceScenario:
    title: str
    prompt: str
    key_phrases: List[str]
    grammar_tip: str
    writing_task: str


PERSONA_BY_FIELD: Dict[str, str] = {
    "sairaanhoitaja": "Lisa",
    "laakari": "Matti",
    "hoiva-avustaja": "Aino",
    "ict": "Janne",
    "sahkoinsinoori": "Kari",
    "rakennus": "Sami",
    "siivous": "Leena",
    "logistiikka": "Petri",
    "ravintola": "Ella",
    "myynti": "Mikko",
    "varhaiskasvatus": "Sofia",
}


HOSPITAL_OPENING_PATTERNS: Tuple[str, ...] = (
    "Hei, olen {assistant_name}. Vuoro vaihtuu juuri nyt. Voitko kertoa minulle nopeasti potilaan tilanteen ennen kuin otat seuraavan vastuun?",
    "Hei, täällä {assistant_name}. Potilas tarvitsee apua juuri nyt. Mitä sanot minulle ensimmäiseksi tilanteesta?",
    "Huomenta, olen {assistant_name}. Aloitetaan raportti rauhallisesti: mikä on tärkein tieto tästä potilaasta juuri nyt?",
    "Hei, olen {assistant_name}. Tulen huoneesta 12 ja tarvitsen sinulta lyhyen tilannekuvan ennen seuraavaa toimenpidettä.",
    "Hei, täällä {assistant_name}. Vastaanotan vuoron. Kerro minulle heti aluksi, mitä potilaan voinnista pitää tietää.",
)

GENERAL_OPENING_PATTERNS: Tuple[str, ...] = (
    "Hei, olen {assistant_name}. Aloitetaan tästä tilanteesta: {scenario_prompt}",
    "Hei, täällä {assistant_name}. Kerro minulle ensin, miten etenisit tässä tilanteessa: {scenario_prompt}",
    "Hei, olen {assistant_name}. Kuvitellaan tämä työtilanne yhdessä. Mitä sanoisit ensimmäiseksi: {scenario_prompt}",
)


WORKPLACE_TEMPLATES: Dict[str, dict] = {
    "sairaanhoitaja": {
        "label": "Sairaanhoitaja",
        "vocabulary": [
            "hoitaja",
            "potilas",
            "elintoiminnot",
            "kirjaaminen",
            "lääkehoito",
            "mittaukset",
            "vuororaportti",
        ],
        "scenarios": [
            WorkplaceScenario(
                title="Hoidon aloitus",
                prompt="Kerro kollegalle potilaan tämänhetkinen tila ja mitä tapahtui viime yönä.",
                key_phrases=["potilas", "tila", "viime yö", "lääke", "mittaukset"],
                grammar_tip="Harjoittele partitiivia potilaan tilan kuvaukseen.",
                writing_task="Kirjoita lyhyt raportti: potilaan vointi + annetut lääkkeet + suunnitelma.",
            ),
            WorkplaceScenario(
                title="Vuororaportti",
                prompt="Anna selkeä vuororaportti uudelle hoitajalle kolmessa kohdassa.",
                key_phrases=["raportti", "kolme kohtaa", "suunnitelma", "turvallisuus"],
                grammar_tip="Käytä imperfektiä edellisten tapahtumien kuvauksessa.",
                writing_task="Kirjaa potilaan yöstä kolme päähuomiota.",
            ),
        ],
    },
    "laakari": {
        "label": "Lääkäri",
        "vocabulary": [
            "diagnoosi",
            "oireet",
            "lähete",
            "hoitosuunnitelma",
            "konsultaatio",
            "potilastiedot",
        ],
        "scenarios": [
            WorkplaceScenario(
                title="Potilaan haastattelu",
                prompt="Kysy potilaalta oireet, kesto ja pahentavat tekijät. Tee lyhyt yhteenveto.",
                key_phrases=["oire", "kesto", "pahentaa", "helpottaa"],
                grammar_tip="Muista illatiivi: 'mene lääkäriin', 'tuo resepti apteekkiin'.",
                writing_task="Laadi lähete tekstissä mainituista oireista.",
            )
        ],
    },
    "ict": {
        "label": "ICT / Software",
        "vocabulary": [
            "palaveri",
            "bugi",
            "korjaus",
            "julkaisu",
            "versio",
            "asiakas",
            "tiketti",
        ],
        "scenarios": [
            WorkplaceScenario(
                title="Standup",
                prompt="Pidä standup-päivitys: mitä teit eilen, mitä teet tänään, mikä estää etenemistä.",
                key_phrases=["tehty", "tänään", "este", "apu"],
                grammar_tip="Käytä perfektiä menneistä töistä: 'olen korjannut bugit'.",
                writing_task="Kirjoita lyhyt tiketti, jossa kuvaat virheen ja korjauksen.",
            ),
            WorkplaceScenario(
                title="Asiakaspalaveri",
                prompt="Selitä asiakkaalle mitä on korjattu ja mitä seuraavaksi toimitetaan.",
                key_phrases=["korjaus", "toimitus", "aikataulu", "testaus"],
                grammar_tip="Harjoittele futuurin ilmaisua: 'tulemme julkaisemaan'.",
                writing_task="Laadi statusviesti asiakkaalle korjauksen etenemisestä.",
            ),
        ],
    },
    "sahkoinsinoori": {
        "label": "Sähköinsinööri",
        "vocabulary": [
            "jännite",
            "kaapeli",
            "kytkentä",
            "turvallisuus",
            "mittaus",
            "asennus",
            "vika",
            "korjaus",
        ],
        "scenarios": [
            WorkplaceScenario(
                title="Turvallisuusohje",
                prompt="Anna turvallisuusohje uudelle työntekijälle sähkötyön aloittamiseen.",
                key_phrases=["turvallisuus", "jännite", "sammuta", "tarkista"],
                grammar_tip="Käytä imperatiiviä ohjeissa: 'sammuta virta', 'tarkista jännite'.",
                writing_task="Kirjoita lyhyt turvallisuusohje sähkötyön aloittamiseen.",
            ),
            WorkplaceScenario(
                title="Vianetsintä",
                prompt="Kuvaile asiakkaalle mitä vikaa löysit ja miten korjaat sen.",
                key_phrases=["vika", "syy", "korjaus", "aikataulu"],
                grammar_tip="Harjoittele konditionaalia: 'jos johdin on rikki, vaihdamme sen'.",
                writing_task="Laadi lyhyt raportti löydetystä viasta ja korjaussuunnitelmasta.",
            ),
        ],
    },
    "hoiva-avustaja": {
        "label": "Hoiva-avustaja",
        "vocabulary": [
            "asiakas",
            "päiväohjelma",
            "ruoka",
            "hygienia",
            "liikkuminen",
            "lääkitys",
            "havainto",
            "raportti",
        ],
        "scenarios": [
            WorkplaceScenario(
                title="Päiväohjelman selitys",
                prompt="Selitä asiakkaalle mitä tehdään tänään ja milloin.",
                key_phrases=["päiväohjelma", "aika", "ruoka", "aktiviteetti"],
                grammar_tip="Käytä temporaalisia adverbeja: 'ensin', 'sitten', 'lopuksi'.",
                writing_task="Kirjoita lyhyt päiväohjelma asiakkaalle.",
            ),
            WorkplaceScenario(
                title="Havaintojen raportointi",
                prompt="Raportoi kollegalle mitä huomasit asiakkaassa tänään.",
                key_phrases=["havainto", "muutos", "huoli", "hyvä"],
                grammar_tip="Harjoittele objektin sijoja: 'huomasin muutoksen', 'kerroin huolen'.",
                writing_task="Kirjoita lyhyt havaintoraportti asiakkaan tilasta.",
            ),
        ],
    },
    "rakennus": {
        "label": "Rakennusala",
        "vocabulary": [
            "työmaa",
            "työkalu",
            "materiaali",
            "turvallisuus",
            "ohje",
            "mittaus",
            "asennus",
            "tarkistus",
        ],
        "scenarios": [
            WorkplaceScenario(
                title="Työmaan turvallisuus",
                prompt="Anna turvallisuusohje uudelle työntekijälle työmaalla.",
                key_phrases=["turvallisuus", "kypärä", "varovainen", "sääntö"],
                grammar_tip="Käytä imperatiiviä: 'käytä kypärää', 'ole varovainen'.",
                writing_task="Kirjoita lyhyt turvallisuusohje työmaalle.",
            ),
            WorkplaceScenario(
                title="Työn ohjaus",
                prompt="Selitä työntekijälle miten asennetaan komponentti.",
                key_phrases=["asennus", "vaihe", "tarkista", "kiinnitä"],
                grammar_tip="Käytä partitiivia materiaaleista: 'tarvitset nauloja', 'käytä lautaa'.",
                writing_task="Laadi lyhyt asennusohje.",
            ),
        ],
    },
    "siivous": {
        "label": "Siivousala",
        "vocabulary": [
            "siivous",
            "väline",
            "puhdistusaine",
            "alue",
            "tarkistus",
            "raportti",
            "tilaus",
            "aikataulu",
        ],
        "scenarios": [
            WorkplaceScenario(
                title="Päivittäinen siivous",
                prompt="Selitä asiakkaalle mitä siivotaan tänään ja missä järjestyksessä.",
                key_phrases=["siivous", "alue", "järjestys", "valmis"],
                grammar_tip="Käytä temporaalisia ilmaisuja: 'ensin', 'sitten', 'lopuksi'.",
                writing_task="Kirjoita lyhyt siivouslista päivälle.",
            ),
            WorkplaceScenario(
                title="Vahingon raportointi",
                prompt="Raportoi esimiehelle jos löysit vahingon siivousaikana.",
                key_phrases=["vahinko", "löysin", "syy", "raportti"],
                grammar_tip="Harjoittele partitiivia: 'löysin vahingon', 'kerroin asiasta'.",
                writing_task="Laadi lyhyt vahinkoraportti.",
            ),
        ],
    },
    "logistiikka": {
        "label": "Logistiikka / Varasto",
        "vocabulary": [
            "varasto",
            "tavara",
            "trukki",
            "hylly",
            "lähetys",
            "vastaanotto",
            "inventaario",
            "tarkistus",
        ],
        "scenarios": [
            WorkplaceScenario(
                title="Tavaroiden vastaanotto",
                prompt="Selitä kollegalle miten vastaanotat uudet tavarat ja missä ne sijoitetaan.",
                key_phrases=["vastaanotto", "tarkista", "sijainti", "kirjaa"],
                grammar_tip="Käytä illatiiviä sijainteihin: 'tavara menee hyllyyn', 'kirjaa järjestelmään'.",
                writing_task="Kirjoita lyhyt ohje tavaroiden vastaanotosta.",
            ),
            WorkplaceScenario(
                title="Inventaarioraportti",
                prompt="Raportoi esimiehelle inventaariotilanteesta ja puuttuvista tavaroista.",
                key_phrases=["inventaario", "puuttuu", "määrä", "tilaus"],
                grammar_tip="Harjoittele partitiivia määristä: 'puuttuu tavaroita', 'tarvitsemme lisää'.",
                writing_task="Laadi lyhyt inventaarioraportti.",
            ),
        ],
    },
    "ravintola": {
        "label": "Ravintola / Hotelli",
        "vocabulary": [
            "asiakas",
            "tilaus",
            "ruoka",
            "palvelu",
            "pöytä",
            "lasku",
            "allergia",
            "suositus",
        ],
        "scenarios": [
            WorkplaceScenario(
                title="Asiakaspalvelu",
                prompt="Tervehdi asiakasta ja ota tilaus suomeksi.",
                key_phrases=["tervehdys", "tilaus", "ruoka", "juoma"],
                grammar_tip="Käytä kohteliasta kieltä: 'haluaisitteko', 'voisitteko'.",
                writing_task="Kirjoita lyhyt dialogi asiakkaan kanssa.",
            ),
            WorkplaceScenario(
                title="Allergiaohje",
                prompt="Selitä asiakkaalle ruoan sisältö ja mahdolliset allergeenit.",
                key_phrases=["allergia", "sisältää", "ei sisällä", "voiko"],
                grammar_tip="Harjoittele partitiivia: 'ruoka sisältää pähkinöitä', 'voiko olla maitoa'.",
                writing_task="Laadi lyhyt ohje allergeenien kertomisesta.",
            ),
        ],
    },
    "myynti": {
        "label": "Myynti / Asiakaspalvelu",
        "vocabulary": [
            "asiakas",
            "tuote",
            "hinta",
            "tarjous",
            "maksu",
            "palautus",
            "takuu",
            "suositus",
        ],
        "scenarios": [
            WorkplaceScenario(
                title="Tuotteen esittely",
                prompt="Esittele tuote asiakkaalle ja vastaa kysymyksiin.",
                key_phrases=["tuote", "ominaisuus", "hinta", "sopii"],
                grammar_tip="Käytä partitiivia: 'tuotteessa on ominaisuuksia', 'sopii käyttöön'.",
                writing_task="Kirjoita lyhyt tuoteesittely.",
            ),
            WorkplaceScenario(
                title="Palautus",
                prompt="Selitä asiakkaalle palautusprosessi ja ehdot.",
                key_phrases=["palautus", "ehdot", "kuitti", "hyvitys"],
                grammar_tip="Harjoittele konditionaalia: 'jos tuote on rikki, saat hyvityksen'.",
                writing_task="Laadi lyhyt ohje palautusprosessista.",
            ),
        ],
    },
    "varhaiskasvatus": {
        "label": "Varhaiskasvatus",
        "vocabulary": [
            "lapsi",
            "aktiviteetti",
            "ruoka",
            "nukkuminen",
            "havainto",
            "vanhempi",
            "raportti",
            "päiväohjelma",
        ],
        "scenarios": [
            WorkplaceScenario(
                title="Päivän raportti vanhemmille",
                prompt="Kerro vanhemmille mitä lapsi teki tänään ja miten päivä meni.",
                key_phrases=["päivä", "aktiviteetti", "ruoka", "hyvä"],
                grammar_tip="Käytä partitiivia: 'lapsi leikki', 'söi ruokaa', 'nukkui hyvin'.",
                writing_task="Kirjoita lyhyt päiväraportti vanhemmille.",
            ),
            WorkplaceScenario(
                title="Havaintojen jakaminen",
                prompt="Jaa havaintoja lapsen kehityksestä kollegalle.",
                key_phrases=["havainto", "kehitys", "muutos", "huoli"],
                grammar_tip="Harjoittele objektin sijoja: 'huomasin muutoksen', 'kerroin huolen'.",
                writing_task="Laadi lyhyt havaintoraportti lapsen kehityksestä.",
            ),
        ],
    },
}


def list_fields() -> List[dict]:
    """Return available workplace fields."""
    return [{"id": key, "label": value["label"]} for key, value in WORKPLACE_TEMPLATES.items()]


def get_field_lesson(field: str, level: str = "B1") -> dict:
    """Return a combined lesson package for a given field and level."""
    key = _normalize_field(field)
    template = WORKPLACE_TEMPLATES.get(key)
    if not template:
        return {"field": field, "error": "unknown field"}
    scenario = template["scenarios"][0]
    vocab = template["vocabulary"]
    return {
        "field": key,
        "level": level,
        "title": scenario.title,
        "prompt": scenario.prompt,
        "vocabulary": vocab,
        "grammar_tip": scenario.grammar_tip,
        "writing_task": scenario.writing_task,
    }


def generate_field_dialogue(field: str, scenario_title: Optional[str] = None, level: str = "B1") -> dict:
    """Generate a roleplay scenario payload."""
    key = _normalize_field(field)
    template = WORKPLACE_TEMPLATES.get(key)
    if not template:
        return {"field": field, "error": "unknown field"}
    scenario = _select_scenario(template["scenarios"], scenario_title)
    assistant_name = PERSONA_BY_FIELD.get(key, "Anna")
    opener = _build_roleplay_opening(
        field=key,
        assistant_name=assistant_name,
        scenario_title=scenario.title,
        scenario_prompt=scenario.prompt,
    )
    return {
        "field": key,
        "level": level,
        "title": scenario.title,
        "assistant_name": assistant_name,
        "roleplay_prompt": opener,
        "key_phrases": scenario.key_phrases,
        "grammar_tip": scenario.grammar_tip,
    }


def generate_roleplay_reply(
    field: str,
    user_text: str,
    scenario_title: Optional[str] = None,
    level: str = "B1",
    turn_index: int = 1,
) -> dict:
    """Generate the next deterministic backend-driven roleplay turn."""
    payload = generate_field_dialogue(field, scenario_title=scenario_title, level=level)
    if payload.get("error"):
        return payload

    key_phrases = list(payload.get("key_phrases") or [])
    missing = _missing_phrases(user_text, key_phrases)
    assistant_name = str(payload.get("assistant_name") or "Anna")
    completed = turn_index >= 5
    scenario_title_value = str(payload.get("title") or "")
    field_key = str(payload.get("field") or field)

    if completed:
        reply = (
            "Kiitos, tämä riittää. Yhteenvetona tärkeintä on kertoa tilanne selkeästi, "
            "mainita tehdyt toimet ja sanoa seuraava vaihe. Hyvä työ."
        )
    elif missing:
        reply = _build_missing_detail_reply(
            field=field_key,
            scenario_title=scenario_title_value,
            missing_focus=missing[0],
            turn_index=turn_index,
        )
    else:
        reply = _build_contextual_followup(
            field=field_key,
            scenario_title=scenario_title_value,
            turn_index=turn_index,
        )

    return {
        "field": payload["field"],
        "level": payload["level"],
        "title": payload["title"],
        "assistant_name": assistant_name,
        "roleplay_reply": reply,
        "key_phrases": key_phrases,
        "grammar_tip": payload["grammar_tip"],
        "missing_phrases": missing,
        "completed": completed,
    }


def evaluate_response(field: str, user_text: str) -> dict:
    """Score a user's response for coverage and clarity."""
    key = _normalize_field(field)
    template = WORKPLACE_TEMPLATES.get(key)
    if not template:
        return {"field": field, "error": "unknown field"}
    scenario = _select_scenario(template["scenarios"])
    coverage = _coverage_score(user_text, scenario.key_phrases)
    clarity = 3 if len(user_text.split()) > 40 else 2 if len(user_text.split()) > 15 else 1
    politeness = 1 if any(word in user_text.lower() for word in ("kiitos", "ole hyvä")) else 0
    score = min(5, coverage + clarity + politeness)
    feedback = []
    if coverage < 2:
        feedback.append("Lisää avainsanoja: " + ", ".join(scenario.key_phrases[:3]))
    if politeness == 0:
        feedback.append("Lisää kohteliaisuutta: 'kiitos', 'ole hyvä'.")
    if clarity == 1:
        feedback.append("Laajenna vastausta 2–3 kokonaisella lauseella.")
    return {
        "field": key,
        "scores": {
            "coverage": coverage,
            "clarity": clarity,
            "politeness": politeness,
            "total": score,
        },
        "missing_phrases": _missing_phrases(user_text, scenario.key_phrases),
        "feedback": feedback,
    }


def _normalize_field(value: str) -> str:
    normalized = (value or "").strip().lower()
    aliases = {
        "doctor": "laakari",
        "lääkäri": "laakari",
        "lahioitaja": "sairaanhoitaja",
        "lähihoitaja": "sairaanhoitaja",
        "practical nurse": "sairaanhoitaja",
        "nurse": "sairaanhoitaja",
    }
    return aliases.get(normalized, normalized)


def _is_hospital_field(field: str) -> bool:
    return field in {"sairaanhoitaja", "laakari"}


def _build_roleplay_opening(*, field: str, assistant_name: str, scenario_title: str, scenario_prompt: str) -> str:
    patterns = HOSPITAL_OPENING_PATTERNS if _is_hospital_field(field) else GENERAL_OPENING_PATTERNS
    template = random.choice(patterns)
    opening = template.format(
        assistant_name=assistant_name,
        scenario_title=scenario_title,
        scenario_prompt=scenario_prompt,
    )
    return f"{opening} Tilanne on \"{scenario_title}\"."


def _build_missing_detail_reply(*, field: str, scenario_title: str, missing_focus: str, turn_index: int) -> str:
    if _is_hospital_field(field):
        prompts = [
            f"Selvä. Kerro vielä lyhyesti, miten \"{missing_focus}\" näkyi potilaan voinnissa.",
            f"Hyvä. Miltä potilas vaikutti silloin, kun \"{missing_focus}\" tuli esiin?",
            f"Ymmärrän. Mitä teit heti sen jälkeen, kun huomasit asian \"{missing_focus}\"?",
            f"Selvä. Mitä tästä pitäisi vielä kirjata tai varmistaa ennen kuin vuoro jatkuu?",
        ]
        return prompts[min(max(turn_index - 1, 0), len(prompts) - 1)]

    prompts = [
        f"Selvä. Avaa vielä rauhassa, mitä \"{missing_focus}\" tarkoittaa tässä tilanteessa.",
        f"Hyvä. Miten etenisit käytännössä siitä eteenpäin, kun \"{missing_focus}\" on huomioitu?",
        f"Ymmärrän. Mitä tästä pitäisi vielä kertoa asiakkaalle tai kollegalle?",
        f"Selvä. Mikä on seuraava konkreettinen toimenpide tämän kohdan jälkeen?",
    ]
    return prompts[min(max(turn_index - 1, 0), len(prompts) - 1)]


def _build_contextual_followup(*, field: str, scenario_title: str, turn_index: int) -> str:
    title = scenario_title.lower()
    if _is_hospital_field(field):
        if "vuoro" in title or "raportti" in title:
            prompts = [
                "Hyvä, sain tästä kiinni. Mikä on ensimmäinen asia, jonka sanot seuraavalle hoitajalle?",
                "Selvä. Mitä kirjaat heti raportin jälkeen, jotta tieto ei katkea?",
                "Hyvä. Miten varmistat vielä, että seuraava hoitaja ymmärsi tilanteen oikein?",
                "Selvä. Mikä on seuraava käytännön toimenpide tämän raportin jälkeen?",
            ]
        elif "haastattelu" in title:
            prompts = [
                "Hyvä. Mitkä oireet kysyt potilaalta ensimmäiseksi?",
                "Selvä. Miten tarkennat vielä oireiden kestoa ja pahentavia tekijöitä?",
                "Ymmärrän. Millaisen yhteenvedon annat potilaalle ennen seuraavaa vaihetta?",
                "Hyvä. Mikä tutkimus tai toimenpide seuraa tämän keskustelun jälkeen?",
            ]
        else:
            prompts = [
                "Selvä. Mikä oli ensimmäinen havainto potilaan tilanteesta?",
                "Hyvä. Mitä sanot seuraavaksi potilaalle tai kollegalle?",
                "Ymmärrän. Miten varmistat turvallisuuden ennen seuraavaa vaihetta?",
                "Selvä. Mikä toimenpide tehdään tämän jälkeen heti?",
            ]
        return prompts[min(max(turn_index - 1, 0), len(prompts) - 1)]

    prompts = [
        "Hyvä, tämä kuulostaa luontevalta. Mikä on ensimmäinen käytännön toimenpide tässä tilanteessa?",
        "Selvä. Mitä tietoa kerrot seuraavaksi toiselle työntekijälle tai asiakkaalle?",
        "Ymmärrän. Miten varmistat vielä, että ohje meni perille?",
        "Hyvä. Mikä on tämän tilanteen tärkein seuraava vaihe?",
    ]
    return prompts[min(max(turn_index - 1, 0), len(prompts) - 1)]


def _select_scenario(scenarios: List[WorkplaceScenario], title: Optional[str] = None) -> WorkplaceScenario:
    if title:
        for item in scenarios:
            if item.title.lower() == title.lower():
                return item
    return scenarios[0]


def _coverage_score(user_text: str, key_phrases: List[str]) -> int:
    """Return 0–3 based on presence of key phrases."""
    text = user_text.lower()
    hits = sum(1 for phrase in key_phrases if phrase.lower() in text)
    if hits == 0:
        return 0
    if hits == 1:
        return 1
    if hits <= 3:
        return 2
    return 3


def _missing_phrases(user_text: str, key_phrases: List[str]) -> List[str]:
    """Return phrases not yet covered by the user_text."""
    text = user_text.lower()
    return [phrase for phrase in key_phrases if phrase.lower() not in text]
