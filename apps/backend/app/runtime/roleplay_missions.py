from __future__ import annotations

import hashlib
import random
from dataclasses import dataclass
from typing import Any

from app.core.state_store import STORE


LEVEL_BANDS = ("A1-A2", "B1-B2", "C1-C2")


@dataclass(frozen=True)
class RoleplayMission:
    mission_id: str
    scenario_id: str
    title: str
    setting: str
    counterpart_role: str
    learner_goal: str
    complication: str
    useful_phrases: tuple[str, ...]
    required_actions: tuple[str, ...]
    question_intents: tuple[str, ...]
    opening_a1: str
    opening_b1: str

    def opening_for_level(self, level_band: str) -> str:
        normalized = str(level_band or "B1-B2").upper().replace("_", "-")

        if "A1" in normalized or "A2" in normalized:
            return self.opening_a1

        if "C1" in normalized or "C2" in normalized:
            return (
                f"{self.opening_b1} "
                "Käydään asia läpi niin, että perusteet, vaihtoehdot, "
                "vastuut ja seuraavat vaiheet tulevat yksiselitteisiksi."
            )

        return self.opening_b1


def _family(
    *,
    family_id: str,
    scenario_id: str,
    family_title: str,
    setting: str,
    counterpart_role: str,
    learner_goal: str,
    useful_phrases: tuple[str, ...],
    required_actions: tuple[str, ...],
    question_intents: tuple[str, ...],
    variants: tuple[
        tuple[
            str,
            str,
            str,
            str,
            str,
            tuple[str, ...],
        ],
        ...,
    ],
) -> tuple[RoleplayMission, ...]:
    missions: list[RoleplayMission] = []

    for (
        variant_id,
        variant_title,
        complication,
        opening_a1,
        opening_b1,
        variant_intents,
    ) in variants:
        missions.append(
            RoleplayMission(
                mission_id=f"{family_id}_{variant_id}",
                scenario_id=scenario_id,
                title=f"{family_title}: {variant_title}",
                setting=setting,
                counterpart_role=counterpart_role,
                learner_goal=learner_goal,
                complication=complication,
                useful_phrases=useful_phrases,
                required_actions=required_actions,
                question_intents=tuple(
                    dict.fromkeys(
                        (*question_intents, *variant_intents)
                    )
                ),
                opening_a1=opening_a1,
                opening_b1=opening_b1,
            )
        )

    return tuple(missions)


_ALL_MISSIONS: tuple[RoleplayMission, ...] = (
    *_family(
        family_id="shop_return",
        scenario_id="general_everyday_conversation",
        family_title="Shop return",
        setting="myymälän asiakaspalvelu",
        counterpart_role="asiakaspalvelija",
        learner_goal="selvittää palautusehdot ja sopia hyväksyttävä ratkaisu",
        useful_phrases=("haluaisin palauttaa", "ostin tämän", "vaihto", "hyvitys"),
        required_actions=(
            "explain what was purchased",
            "state why the item is being returned",
            "respond to the return condition",
            "confirm the agreed resolution",
        ),
        question_intents=(
            "ask when and where the item was purchased",
            "request proof connected to the purchase",
            "clarify the preferred resolution",
            "compare refund and exchange options",
            "confirm the condition of the item",
            "summarize the agreed return process",
        ),
        variants=(
            (
                "no_receipt",
                "receipt is missing",
                "Ostokuitti on kadonnut, mutta maksutapahtuma näkyy pankkisovelluksessa.",
                "Hei. Sinulla ei ole kuittia. Milloin ostit tuotteen?",
                "Hei. Ymmärsin, että haluat palauttaa tuotteen, mutta kuittia ei löydy. Mitä tietoja ostoksesta pystyt näyttämään?",
                ("ask for alternative proof of purchase", "negotiate store credit"),
            ),
            (
                "wrong_size",
                "wrong size",
                "Tuote on käyttämätön, mutta oikeaa kokoa ei ehkä ole varastossa.",
                "Hei. Koko on väärä. Haluatko vaihtaa tuotteen?",
                "Hei. Tuote on käyttämätön, mutta koko ei sovi. Haluatko ensisijaisesti vaihdon vai muun ratkaisun?",
                ("check availability of another size", "offer an alternative product"),
            ),
            (
                "defective_item",
                "defective product",
                "Tuote lakkasi toimimasta kahden päivän käytön jälkeen.",
                "Hei. Tuote ei toimi. Mitä tapahtui?",
                "Hei. Kerroit, että tuote lakkasi toimimasta lähes heti. Voitko kuvata tarkasti, mitä tapahtui?",
                ("clarify the defect timeline", "decide between repair and replacement"),
            ),
        ),
    ),
    *_family(
        family_id="parcel_service",
        scenario_id="general_everyday_conversation",
        family_title="Parcel service",
        setting="pakettipalvelun asiakaspalvelu",
        counterpart_role="pakettipalvelun työntekijä",
        learner_goal="selvittää paketin sijainti tai kunto ja sopia jatkotoimi",
        useful_phrases=("seurantakoodi", "noutopiste", "paketti", "selvityspyyntö"),
        required_actions=(
            "identify the parcel",
            "explain the problem",
            "provide relevant evidence",
            "confirm the next tracking action",
        ),
        question_intents=(
            "request the tracking identifier",
            "clarify the latest tracking event",
            "check recipient details",
            "determine whether an investigation is needed",
            "confirm the preferred contact method",
            "state the expected next update",
        ),
        variants=(
            (
                "wrong_pickup_point",
                "wrong pickup point",
                "Paketti on ohjattu kauas sijaitsevaan noutopisteeseen.",
                "Hei. Paketti on väärässä paikassa. Mikä on seurantakoodi?",
                "Hei. Pakettisi on ohjattu eri noutopisteeseen kuin odotit. Mikä noutopaikka olisi sinulle mahdollinen?",
                ("request rerouting", "compare pickup and home-delivery options"),
            ),
            (
                "damaged_parcel",
                "damaged parcel",
                "Paketin ulkopakkaus ja sisältö ovat vaurioituneet.",
                "Hei. Paketti on rikki. Onko sinulla kuva?",
                "Hei. Ymmärsin, että sekä pakkaus että sisältö vaurioituivat. Millaisia kuvia tai muuta selvitystä sinulla on?",
                ("document visible damage", "start a compensation claim"),
            ),
            (
                "missing_code",
                "pickup code missing",
                "Seuranta näyttää paketin saapuneen, mutta noutokoodia ei tullut.",
                "Hei. Paketti on perillä, mutta koodi puuttuu. Mikä on nimesi?",
                "Hei. Seurannan mukaan paketti on noudettavissa, mutta et saanut koodia. Tarkistetaan ensin vastaanottajan tiedot.",
                ("verify recipient identity", "issue a replacement pickup code"),
            ),
        ),
    ),
    *_family(
        family_id="appointment_change",
        scenario_id="general_everyday_conversation",
        family_title="Appointment change",
        setting="ajanvarauspalvelu",
        counterpart_role="ajanvarauksen työntekijä",
        learner_goal="muuttaa ajanvaraus ja varmistaa uuden ajan ehdot",
        useful_phrases=("ajanvaraus", "perua", "siirtää", "sopiva aika"),
        required_actions=(
            "identify the appointment",
            "explain why it must change",
            "propose suitable times",
            "confirm the new appointment",
        ),
        question_intents=(
            "verify the existing appointment",
            "ask which times are possible",
            "clarify cancellation conditions",
            "compare available alternatives",
            "confirm the service location",
            "repeat the final appointment details",
        ),
        variants=(
            (
                "schedule_conflict",
                "schedule conflict",
                "Työvuoro muuttui ja osuu päällekkäin varatun ajan kanssa.",
                "Hei. Et pääse varattuun aikaan. Milloin voit tulla?",
                "Hei. Työvuorosi muuttui, joten nykyinen aika ei enää sovi. Mitkä päivät sopisivat sinulle paremmin?",
                ("explain the scheduling conflict", "negotiate an evening appointment"),
            ),
            (
                "wrong_service",
                "wrong service booked",
                "Varaus on tehty väärälle palvelulle tai väärälle ammattilaiselle.",
                "Hei. Varaus on väärä. Mitä palvelua tarvitset?",
                "Hei. Varaus näyttää olevan väärälle palvelulle. Kerro, mitä asiaa varten ajan oikeastaan tarvitset.",
                ("identify the correct service", "transfer the booking without losing priority"),
            ),
            (
                "short_notice",
                "late cancellation",
                "Aika pitää perua samana päivänä ja mahdollinen maksu huolestuttaa.",
                "Hei. Haluat perua ajan tänään. Miksi et pääse?",
                "Hei. Haluat perua tämän päivän ajan ja kysyt mahdollisesta maksusta. Käydään tilanne ja perumisehdot läpi.",
                ("explain the urgent reason", "clarify whether a cancellation fee applies"),
            ),
        ),
    ),
    *_family(
        family_id="housing_service",
        scenario_id="general_everyday_conversation",
        family_title="Housing maintenance",
        setting="taloyhtiön tai vuokranantajan huoltopalvelu",
        counterpart_role="huollon asiakaspalvelija",
        learner_goal="ilmoittaa asunnon ongelmasta ja sopia tarkastuksesta",
        useful_phrases=("huolto", "asunto", "korjaus", "kiireellinen"),
        required_actions=(
            "describe the defect",
            "explain its practical impact",
            "assess urgency",
            "arrange access for repair",
        ),
        question_intents=(
            "ask when the problem began",
            "clarify the extent of the defect",
            "check whether immediate damage is occurring",
            "arrange permission to enter the apartment",
            "confirm the repair window",
            "state what to do if the problem worsens",
        ),
        variants=(
            (
                "heating_problem",
                "heating failure",
                "Asunto on ollut kylmä kaksi päivää, vaikka patterit ovat täysin auki.",
                "Hei. Asunnossa on kylmä. Kuinka kylmä siellä on?",
                "Hei. Kerroit, että asunto on ollut kylmä jo kaksi päivää. Mitä olet havainnut pattereista ja huonelämpötilasta?",
                ("request a temperature measurement", "prioritize an inspection"),
            ),
            (
                "water_leak",
                "water leak",
                "Keittiön allaskaapissa näkyy jatkuvaa kosteutta.",
                "Hei. Keittiössä vuotaa vettä. Vuotaako se nyt?",
                "Hei. Allaskaapissa on jatkuvaa kosteutta. Tarvitsen tarkennuksen siitä, vuotaako vettä parhaillaan ja kuinka paljon.",
                ("assess immediate water damage", "give access instructions for urgent maintenance"),
            ),
            (
                "broken_appliance",
                "included appliance broken",
                "Vuokra-asuntoon kuuluva jääkaappi ei enää jäähdytä.",
                "Hei. Jääkaappi ei toimi. Milloin se hajosi?",
                "Hei. Asuntoon kuuluva jääkaappi ei enää jäähdytä. Milloin huomasit vian ja mitä olet jo kokeillut?",
                ("clarify responsibility for the appliance", "arrange temporary food-storage advice"),
            ),
        ),
    ),
    *_family(
        family_id="transport_service",
        scenario_id="general_everyday_conversation",
        family_title="Public transport",
        setting="joukkoliikenteen asiakaspalvelu",
        counterpart_role="joukkoliikenteen asiakaspalvelija",
        learner_goal="selvittää lippuun tai matkaan liittyvä ongelma",
        useful_phrases=("matkalippu", "vyöhyke", "hyvitys", "matkakortti"),
        required_actions=(
            "identify the journey or ticket",
            "explain the discrepancy",
            "ask about available correction",
            "confirm the final decision",
        ),
        question_intents=(
            "request ticket or journey details",
            "clarify where the ticket was purchased",
            "check applicable zones",
            "explain the compensation rule",
            "compare correction options",
            "confirm what evidence must be retained",
        ),
        variants=(
            (
                "wrong_ticket",
                "wrong ticket type",
                "Sovellus osti vahingossa väärän vyöhykkeen lipun juuri ennen matkaa.",
                "Hei. Lippu on väärälle alueelle. Mihin olet matkalla?",
                "Hei. Ostit vahingossa väärän vyöhykkeen lipun. Kerro lähtöpaikka, määränpää ja lipun ostohetki.",
                ("determine whether the ticket can be corrected", "explain zone selection"),
            ),
            (
                "delay_refund",
                "major delay",
                "Pitkä viivästys aiheutti jatkoyhteyden menettämisen.",
                "Hei. Matka myöhästyi paljon. Kuinka kauan?",
                "Hei. Viivästys oli niin pitkä, että menetit jatkoyhteyden. Käydään matkan aikataulu ja kulut läpi.",
                ("establish the delay duration", "assess compensation for extra travel cost"),
            ),
            (
                "lost_card",
                "lost travel card",
                "Henkilökohtainen matkakortti katosi, mutta sillä on voimassa oleva kausilippu.",
                "Hei. Matkakortti on kadonnut. Onko se henkilökohtainen?",
                "Hei. Matkakorttisi katosi ja sillä on voimassa oleva kausi. Tarkistetaan henkilöllisyys ja kortin sulkeminen.",
                ("block the lost card", "transfer the season ticket"),
            ),
        ),
    ),
    *_family(
        family_id="billing_service",
        scenario_id="general_everyday_conversation",
        family_title="Service invoice",
        setting="palveluyrityksen laskutus",
        counterpart_role="laskutusneuvoja",
        learner_goal="selvittää laskun virhe ja sopia korjauksesta",
        useful_phrases=("lasku", "veloitus", "eräpäivä", "korjaus"),
        required_actions=(
            "identify the invoice",
            "point out the disputed charge",
            "explain the expected amount",
            "confirm correction and payment timing",
        ),
        question_intents=(
            "request the invoice number",
            "compare the invoice with the agreement",
            "clarify when the charge arose",
            "determine whether payment should be paused",
            "confirm the correction method",
            "repeat the revised due date",
        ),
        variants=(
            (
                "duplicate_charge",
                "duplicate charge",
                "Sama palvelu näkyy laskulla kahteen kertaan.",
                "Hei. Sama maksu on laskussa kaksi kertaa. Mikä on laskun numero?",
                "Hei. Kerroit, että sama palvelu on veloitettu kahdesti. Katsotaan laskurivit ja sopimus yhdessä.",
                ("identify both duplicate rows", "request a credit invoice"),
            ),
            (
                "wrong_period",
                "wrong billing period",
                "Lasku sisältää ajanjakson, jolloin palvelu ei ollut käytössä.",
                "Hei. Laskussa on väärä aika. Milloin palvelu oli pois käytöstä?",
                "Hei. Laskulla on ajanjakso, jolloin palvelu ei ollut käytössä. Mitkä päivämäärät pitäisi poistaa?",
                ("establish the unused period", "calculate the corrected period"),
            ),
            (
                "cancellation_fee",
                "unexpected cancellation fee",
                "Laskulla on peruutusmaksu, vaikka peruutus tehtiin ilmoitetussa ajassa.",
                "Hei. Laskussa on peruutusmaksu. Milloin peruit palvelun?",
                "Hei. Laskulla näkyy peruutusmaksu, vaikka peruit mielestäsi ajoissa. Tarkistetaan peruutushetki ja ehdot.",
                ("verify the cancellation timestamp", "challenge the fee politely"),
            ),
        ),
    ),
    *_family(
        family_id="neighbour_discussion",
        scenario_id="general_everyday_conversation",
        family_title="Neighbour discussion",
        setting="taloyhtiön yhteinen arki",
        counterpart_role="naapuri",
        learner_goal="ottaa arkinen ongelma puheeksi kohteliaasti ja sopia ratkaisu",
        useful_phrases=("voisimmeko sopia", "häiritsee", "yhteinen tila", "kiitos"),
        required_actions=(
            "describe the issue without accusation",
            "explain its effect",
            "listen to the neighbour's explanation",
            "agree on a practical change",
        ),
        question_intents=(
            "clarify when the disturbance occurs",
            "ask for the neighbour's perspective",
            "propose a specific compromise",
            "define a trial arrangement",
            "confirm shared-space rules",
            "close the discussion politely",
        ),
        variants=(
            (
                "late_noise",
                "late-night noise",
                "Musiikki kuuluu useana yönä seinän läpi.",
                "Hei. Musiikki kuuluu yöllä. Voimmeko puhua siitä?",
                "Hei. Musiikki on kuulunut asuntooni useana yönä. Voisimmeko sopia, miten ääntä voisi vähentää myöhään illalla?",
                ("name the most difficult time window", "agree on quiet hours"),
            ),
            (
                "laundry_room",
                "laundry-room booking",
                "Naapuri käyttää pesutupaa toistuvasti sinun varauksesi aikana.",
                "Hei. Pesutupa on minun vuorollani käytössä. Voimmeko sopia asiasta?",
                "Hei. Pesutupa on ollut muutaman kerran käytössä minun varaukseni aikana. Haluaisin tarkistaa, miten varausjärjestelmä ymmärretään.",
                ("compare booking information", "agree on handling overlapping reservations"),
            ),
            (
                "bicycle_storage",
                "bicycle storage",
                "Naapurin tavarat estävät pääsyn yhteiseen pyörävarastoon.",
                "Hei. Pyörävarastoon ei pääse hyvin. Voimmeko siirtää tavaroita?",
                "Hei. Yhteisen pyörävaraston kulkuväylä on tukossa. Voisimmeko järjestää tavarat niin, että kaikki pääsevät käyttämään tilaa?",
                ("identify which items block access", "agree on a deadline for clearing the route"),
            ),
        ),
    ),
    *_family(
        family_id="shift_schedule",
        scenario_id="general_supervisor_instruction",
        family_title="Shift schedule",
        setting="työvuorosuunnittelu",
        counterpart_role="esihenkilö",
        learner_goal="tarkentaa työvuoro ja sopia mahdollinen muutos",
        useful_phrases=("työvuoro", "muutos", "sopia", "vahvistaa"),
        required_actions=(
            "identify the disputed shift",
            "explain the practical constraint",
            "suggest a workable alternative",
            "confirm the updated schedule",
        ),
        question_intents=(
            "ask which shift is affected",
            "clarify availability",
            "check whether a swap is possible",
            "compare staffing alternatives",
            "confirm approval responsibility",
            "repeat the final schedule",
        ),
        variants=(
            (
                "unavailable_shift",
                "unexpected unavailable shift",
                "Listaan on ilmestynyt vuoro aikana, jonka ilmoitit esteelliseksi.",
                "Hei. Listassa on vuoro, johon et pääse. Mikä aika on ongelma?",
                "Hei. Työvuorolistassa on vuoro aikana, jonka ilmoitit esteelliseksi. Kerro tarkasti, mikä vuoro ja millainen vaihtoehto sopisi.",
                ("refer to the earlier availability notice", "request a specific replacement shift"),
            ),
            (
                "missing_break",
                "missing break",
                "Pitkässä vuorossa ei näy sovittua ruokataukoa.",
                "Hei. Vuorossa ei näy taukoa. Kuinka pitkä vuoro on?",
                "Hei. Huomasit, ettei pitkään vuoroon ole merkitty sovittua ruokataukoa. Käydään vuoron rakenne läpi.",
                ("clarify break entitlement", "agree when the break can occur"),
            ),
            (
                "location_change",
                "work location changed",
                "Työpaikka vaihtui toiseen toimipisteeseen ilman selvää ohjetta.",
                "Hei. Työpaikka on vaihtunut. Tiedätkö uuden osoitteen?",
                "Hei. Vuorosi on siirretty toiseen toimipisteeseen, mutta käytännön ohjeet puuttuvat. Mitä tietoja tarvitset ennen vuoroa?",
                ("request travel and access instructions", "confirm who receives the arrival notice"),
            ),
        ),
    ),
    *_family(
        family_id="task_priority",
        scenario_id="general_supervisor_instruction",
        family_title="Task priorities",
        setting="työpäivän tehtävien priorisointi",
        counterpart_role="esihenkilö",
        learner_goal="selvittää tehtävien tärkeysjärjestys",
        useful_phrases=("ensisijainen", "kiireellinen", "järjestys", "valmis"),
        required_actions=(
            "list competing tasks",
            "explain time or resource limits",
            "ask for a priority decision",
            "confirm the chosen order",
        ),
        question_intents=(
            "compare urgency and importance",
            "clarify the consequence of delay",
            "identify dependencies",
            "estimate available time",
            "decide what can be postponed",
            "confirm the first concrete action",
        ),
        variants=(
            (
                "two_urgent_tasks",
                "two urgent tasks",
                "Kaksi esihenkilöä on antanut samalle ajalle kiireellisen tehtävän.",
                "Hei. Sinulla on kaksi kiireistä tehtävää. Kumpi vie enemmän aikaa?",
                "Hei. Sinulla on kaksi samaan aikaan kiireelliseksi merkittyä tehtävää. Kuvaa molempien määräaika ja vaikutus.",
                ("identify conflicting owners", "request one authoritative priority decision"),
            ),
            (
                "changed_order",
                "priority changed",
                "Aamulla sovittu järjestys muuttui, mutta kaikki eivät tiedä muutoksesta.",
                "Hei. Tehtävien järjestys muuttui. Kuka tietää muutoksesta?",
                "Hei. Aamulla sovittu työjärjestys on muuttunut, mutta tieto ei ole mennyt kaikille. Mitä pitää päivittää ensin?",
                ("map who needs the update", "confirm the new sequence in writing"),
            ),
            (
                "missing_dependency",
                "missing dependency",
                "Ensisijainen tehtävä ei voi alkaa ennen kuin toinen tiimi toimittaa aineiston.",
                "Hei. Et voi aloittaa, koska aineisto puuttuu. Milloin se tulee?",
                "Hei. Ensisijainen tehtäväsi on riippuvainen aineistosta, jota toinen tiimi ei ole vielä toimittanut. Miten tilanne vaikuttaa aikatauluun?",
                ("clarify ownership of the dependency", "choose useful work while waiting"),
            ),
        ),
    ),
    *_family(
        family_id="deadline_scope",
        scenario_id="general_supervisor_instruction",
        family_title="Deadline and scope",
        setting="tehtävän laajuuden ja määräajan tarkennus",
        counterpart_role="esihenkilö",
        learner_goal="varmistaa mitä pitää valmistua ja millä laatutasolla",
        useful_phrases=("määräaika", "laajuus", "tavoite", "hyväksyä"),
        required_actions=(
            "state the current understanding",
            "identify ambiguity",
            "negotiate scope or time",
            "confirm acceptance criteria",
        ),
        question_intents=(
            "define what counts as complete",
            "separate mandatory and optional work",
            "clarify the review process",
            "estimate effort",
            "negotiate scope against time",
            "confirm who approves the result",
        ),
        variants=(
            (
                "definition_done",
                "unclear definition of done",
                "Ohje kertoo määräajan, mutta ei sitä, millainen lopputulos hyväksytään.",
                "Hei. Tehtävän lopputulos ei ole selvä. Mitä olet tekemässä?",
                "Hei. Määräaika on selvä, mutta hyväksyttävä lopputulos ei. Kerro, miten olet tähän asti ymmärtänyt tehtävän.",
                ("request measurable acceptance criteria", "confirm the review checkpoint"),
            ),
            (
                "shorter_deadline",
                "deadline moved earlier",
                "Määräaikaa aikaistettiin kahdella päivällä, mutta laajuus pysyi samana.",
                "Hei. Määräaika tuli aikaisemmaksi. Mitä ehdit tehdä?",
                "Hei. Määräaikaa aikaistettiin kahdella päivällä ilman että työn laajuus muuttui. Mitkä osat ovat realistisesti valmistettavissa?",
                ("identify the minimum viable result", "request either more time or reduced scope"),
            ),
            (
                "added_requirement",
                "new requirement added",
                "Tehtävään lisättiin uusi vaatimus loppuvaiheessa.",
                "Hei. Tehtävään tuli uusi vaatimus. Kuinka paljon lisätyötä se tekee?",
                "Hei. Tehtävään lisättiin uusi vaatimus juuri ennen valmistumista. Miten se vaikuttaa työmäärään ja jo sovittuun lopputulokseen?",
                ("assess change impact", "renegotiate deadline and approval"),
            ),
        ),
    ),
    *_family(
        family_id="equipment_training",
        scenario_id="general_supervisor_instruction",
        family_title="Equipment instructions",
        setting="uuden työvälineen käyttöönotto",
        counterpart_role="perehdyttäjä",
        learner_goal="varmistaa turvallinen ja oikea käyttötapa",
        useful_phrases=("käyttöohje", "käyttöoikeus", "turvallinen", "näyttää"),
        required_actions=(
            "identify the unclear step",
            "explain current access or knowledge",
            "request demonstration",
            "repeat the safe process",
        ),
        question_intents=(
            "check prior experience",
            "identify the exact blocked step",
            "clarify access requirements",
            "request a practical demonstration",
            "confirm the safety check",
            "summarize the operating sequence",
        ),
        variants=(
            (
                "new_device",
                "new device",
                "Laite on uusi eikä kirjallinen ohje vastaa sen valikkoja.",
                "Hei. Laite on uusi. Mikä kohta on vaikea?",
                "Hei. Uuden laitteen valikot eivät vastaa kirjallista ohjetta. Näytä, missä vaiheessa eteneminen pysähtyy.",
                ("compare the device with the written guide", "request supervised practice"),
            ),
            (
                "access_missing",
                "access rights missing",
                "Koulutus on pidetty, mutta käyttäjätunnuksella ei pääse järjestelmään.",
                "Hei. Et pääse järjestelmään. Mitä virhettä näet?",
                "Hei. Olet saanut koulutuksen, mutta tunnuksellasi ei ole tarvittavaa käyttöoikeutta. Mitä ilmoitusta järjestelmä näyttää?",
                ("identify the missing permission", "confirm who submits the access request"),
            ),
            (
                "conflicting_instruction",
                "conflicting instructions",
                "Kaksi perehdyttäjää neuvoi saman työvaiheen eri tavalla.",
                "Hei. Sait kaksi eri ohjetta. Mitkä ne ovat?",
                "Hei. Olet saanut samasta työvaiheesta kaksi ristiriitaista ohjetta. Kuvaa erot, jotta voimme vahvistaa oikean tavan.",
                ("compare both procedures", "document the approved instruction"),
            ),
        ),
    ),
    *_family(
        family_id="customer_request",
        scenario_id="general_supervisor_instruction",
        family_title="Customer request",
        setting="asiakastyön tehtävänanto",
        counterpart_role="esihenkilö",
        learner_goal="tarkentaa asiakkaan pyyntö ennen toteutusta",
        useful_phrases=("asiakas pyysi", "tarkentaa", "toive", "vahvistus"),
        required_actions=(
            "summarize the request",
            "identify missing information",
            "check feasibility",
            "confirm what will be promised",
        ),
        question_intents=(
            "separate the customer's stated and implied needs",
            "clarify missing specifications",
            "check the promised deadline",
            "identify decision authority",
            "propose a confirmation message",
            "define the next customer contact",
        ),
        variants=(
            (
                "unclear_request",
                "unclear request",
                "Asiakkaan viesti kertoo tavoitteen, mutta ei tarvittavia yksityiskohtia.",
                "Hei. Asiakkaan pyyntö ei ole selvä. Mitä tietoa puuttuu?",
                "Hei. Asiakkaan tavoite on ymmärrettävä, mutta toteutuksen yksityiskohdat puuttuvat. Mitä sinun pitää kysyä ennen työn aloittamista?",
                ("list essential clarification questions", "avoid making an unsupported promise"),
            ),
            (
                "unrealistic_deadline",
                "unrealistic deadline",
                "Asiakas odottaa työn valmistuvan ennen kuin tarvittavat resurssit ovat saatavilla.",
                "Hei. Asiakkaan aika on liian lyhyt. Milloin työ voisi valmistua?",
                "Hei. Asiakkaan toivoma määräaika ei vastaa käytettävissä olevia resursseja. Miten perustelisit realistisen aikataulun?",
                ("explain resource constraints", "offer a staged delivery"),
            ),
            (
                "language_misunderstanding",
                "language misunderstanding",
                "Asiakas ja työntekijä ovat ymmärtäneet yhden keskeisen termin eri tavalla.",
                "Hei. Yksi sana on ymmärretty eri tavalla. Mitä asiakas tarkoitti?",
                "Hei. Huomasit, että asiakas ja tiimi tarkoittavat samalla termillä eri asioita. Miten varmistaisit yhteisen tulkinnan?",
                ("define the disputed term", "confirm understanding with an example"),
            ),
        ),
    ),
    *_family(
        family_id="remote_meeting",
        scenario_id="general_supervisor_instruction",
        family_title="Remote meeting",
        setting="etäkokouksen valmistelu",
        counterpart_role="kokouksen järjestäjä",
        learner_goal="selvittää osallistumisen käytännöt ja oma tehtävä",
        useful_phrases=("kokouskutsu", "linkki", "aikavyöhyke", "mikrofoni"),
        required_actions=(
            "identify the meeting",
            "describe the access problem",
            "clarify the learner's responsibility",
            "confirm the backup arrangement",
        ),
        question_intents=(
            "verify meeting time and platform",
            "clarify the expected contribution",
            "check access to materials",
            "establish a technical backup",
            "confirm who to contact",
            "repeat the joining instructions",
        ),
        variants=(
            (
                "missing_invite",
                "invitation missing",
                "Kokous näkyy kalenterissa, mutta liittymislinkkiä ei ole.",
                "Hei. Kokouslinkki puuttuu. Mikä kokous on kyseessä?",
                "Hei. Kokous näkyy kalenterissasi, mutta liittymislinkkiä ei ole. Tarkistetaan kokouksen nimi ja järjestäjä.",
                ("locate the correct invitation", "request the joining link"),
            ),
            (
                "timezone_conflict",
                "time-zone conflict",
                "Kutsu ja asiakkaan viesti näyttävät eri kellonajan.",
                "Hei. Kokouksessa on kaksi eri aikaa. Missä maassa asiakas on?",
                "Hei. Kalenterikutsu ja asiakkaan viesti näyttävät eri kellonajan. Selvitetään aikavyöhyke ennen vahvistamista.",
                ("identify both time zones", "send an unambiguous UTC-aware confirmation"),
            ),
            (
                "audio_problem",
                "audio problem",
                "Mikrofoni ei toiminut edellisessä kokouksessa ja esitys on sinun vastuullasi.",
                "Hei. Mikrofoni ei toimi hyvin. Mikä on varasuunnitelma?",
                "Hei. Mikrofonisi ei toiminut edellisessä kokouksessa, mutta sinun pitää esitellä asia. Millainen varayhteys voidaan järjestää?",
                ("test audio before the meeting", "agree on phone or chat backup"),
            ),
        ),
    ),
    *_family(
        family_id="safety_instruction",
        scenario_id="general_supervisor_instruction",
        family_title="Safety instruction",
        setting="työpaikan turvallisuusohje",
        counterpart_role="turvallisuusvastaava",
        learner_goal="varmistaa, että turvallinen toimintatapa on täysin selvä",
        useful_phrases=("suojavaruste", "turvallisuus", "hätätilanne", "ohje"),
        required_actions=(
            "identify the hazardous step",
            "ask for the applicable rule",
            "repeat the safe procedure",
            "confirm reporting responsibility",
        ),
        question_intents=(
            "identify the relevant hazard",
            "clarify mandatory protective equipment",
            "check the emergency response",
            "locate the written instruction",
            "confirm who must be notified",
            "summarize the safe sequence",
        ),
        variants=(
            (
                "ppe_unclear",
                "protective equipment unclear",
                "Työohjeessa ei sanota, tarvitaanko hengityssuojainta.",
                "Hei. Suojavaruste ei ole selvä. Mitä työssä käsitellään?",
                "Hei. Työohjeesta ei käy ilmi, tarvitaanko hengityssuojainta. Kuvaa työvaihe ja aine, jota käsittelet.",
                ("determine the required protection level", "pause work until the rule is confirmed"),
            ),
            (
                "emergency_route",
                "emergency route changed",
                "Tavallinen poistumisreitti on suljettu remontin vuoksi.",
                "Hei. Vanha poistumisreitti on kiinni. Missä uusi reitti on?",
                "Hei. Tavallinen poistumisreitti on suljettu remontin vuoksi. Tarvitset selkeän väliaikaisen reitin ja kokoontumispaikan.",
                ("identify the temporary exit", "confirm how staff are informed"),
            ),
            (
                "chemical_label",
                "chemical label unclear",
                "Kemikaalin etiketti on osittain vaurioitunut.",
                "Hei. Kemikaalin etiketti ei näy hyvin. Älä käytä sitä vielä.",
                "Hei. Kemikaalin etiketti on vaurioitunut, eikä sisältöä voi varmistaa. Miten eristät tuotteen ja ilmoitat siitä?",
                ("identify the product without guessing", "arrange safe quarantine and replacement"),
            ),
        ),
    ),
    *_family(
        family_id="broken_equipment",
        scenario_id="general_issue_report",
        family_title="Broken equipment report",
        setting="työpaikan laitevikailmoitus",
        counterpart_role="esihenkilö",
        learner_goal="raportoida laitevika, vaikutus ja tarvittava toimi",
        useful_phrases=("laite", "vika", "turvallisuusriski", "poissa käytöstä"),
        required_actions=(
            "describe the observed defect",
            "state when it occurs",
            "explain operational impact",
            "propose immediate containment",
        ),
        question_intents=(
            "ask for observable symptoms",
            "clarify whether the failure is repeatable",
            "assess safety impact",
            "identify affected work",
            "decide whether to remove the equipment from use",
            "confirm repair escalation",
        ),
        variants=(
            (
                "intermittent",
                "intermittent failure",
                "Laite toimii välillä normaalisti ja pysähtyy ilman varoitusta.",
                "Hei. Laite pysähtyy joskus. Milloin vika näkyy?",
                "Hei. Kerroit laitteen pysähtyvän satunnaisesti ilman varoitusta. Missä työvaiheessa vika on ilmennyt?",
                ("collect the failure pattern", "request diagnostic logging"),
            ),
            (
                "safety_hazard",
                "possible safety hazard",
                "Laitteesta kuuluu poikkeava ääni ja se kuumenee.",
                "Hei. Laite kuumenee ja pitää ääntä. Onko se nyt käytössä?",
                "Hei. Laitteesta kuuluu poikkeava ääni ja se kuumenee. Varmistetaan ensin, onko se poistettu käytöstä.",
                ("verify immediate shutdown", "escalate as a safety incident"),
            ),
            (
                "no_replacement",
                "no replacement available",
                "Viallinen laite on työn kannalta välttämätön eikä varalaitetta ole.",
                "Hei. Laite on rikki eikä varalaitetta ole. Mitä työtä se estää?",
                "Hei. Laite on välttämätön eikä korvaavaa laitetta ole. Mitkä tehtävät pysähtyvät ja mikä väliaikainen ratkaisu on mahdollinen?",
                ("map blocked operations", "prioritize repair or rental"),
            ),
        ),
    ),
    *_family(
        family_id="missing_stock",
        scenario_id="general_issue_report",
        family_title="Missing stock report",
        setting="varaston tai työpisteen materiaalitilanne",
        counterpart_role="varastovastaava",
        learner_goal="raportoida puute ja estää työn keskeytyminen",
        useful_phrases=("varasto", "puuttuu", "määrä", "täydennys"),
        required_actions=(
            "name the missing item",
            "state current quantity",
            "explain urgency",
            "confirm replenishment action",
        ),
        question_intents=(
            "verify the expected stock level",
            "count the actual quantity",
            "identify upcoming demand",
            "check alternative stock locations",
            "confirm purchase responsibility",
            "state the replenishment deadline",
        ),
        variants=(
            (
                "critical_item",
                "critical item unavailable",
                "Päivittäisessä työssä tarvittava tuote on kokonaan loppu.",
                "Hei. Tärkeä tuote on loppu. Mikä tuote se on?",
                "Hei. Päivittäiseen työhön tarvittava tuote on kokonaan loppu. Kuinka nopeasti sitä tarvitaan seuraavan kerran?",
                ("identify the next blocked task", "request emergency procurement"),
            ),
            (
                "wrong_quantity",
                "delivered quantity is wrong",
                "Toimituksessa tuli huomattavasti vähemmän tuotteita kuin tilattiin.",
                "Hei. Toimituksessa on liian vähän tuotteita. Kuinka monta tuli?",
                "Hei. Toimitettu määrä on selvästi pienempi kuin tilauksessa. Verrataan tilausvahvistusta ja vastaanotettua määrää.",
                ("document ordered versus received quantity", "request missing units"),
            ),
            (
                "delayed_restock",
                "restock delayed",
                "Toimittajan uusi toimituspäivä on liian myöhäinen työtilanteeseen nähden.",
                "Hei. Uusi toimitus tulee liian myöhään. Milloin tuotetta tarvitaan?",
                "Hei. Toimittaja siirsi toimituspäivää, mutta varasto ei riitä siihen asti. Kuinka monta päivää nykyinen määrä kestää?",
                ("calculate remaining coverage", "find an alternative supplier or substitute"),
            ),
        ),
    ),
    *_family(
        family_id="delivery_error",
        scenario_id="general_issue_report",
        family_title="Delivery error report",
        setting="työpaikan vastaanottama toimitus",
        counterpart_role="toimitusvastaava",
        learner_goal="dokumentoida toimitusvirhe ja sopia korjaava toimi",
        useful_phrases=("toimitus", "puuttuu", "vaurioitunut", "reklamaatio"),
        required_actions=(
            "identify the delivery",
            "describe the discrepancy",
            "preserve evidence",
            "confirm replacement or correction",
        ),
        question_intents=(
            "request delivery reference",
            "compare packing list and contents",
            "document condition on arrival",
            "assess whether goods can be used",
            "choose replacement or credit",
            "confirm collection arrangements",
        ),
        variants=(
            (
                "wrong_address",
                "delivered to wrong address",
                "Toimitus päätyi toiseen toimipisteeseen.",
                "Hei. Toimitus meni väärään paikkaan. Missä se on nyt?",
                "Hei. Toimitus on päätynyt toiseen toimipisteeseen. Selvitetään nykyinen sijainti ja kuljetus oikeaan paikkaan.",
                ("verify both addresses", "arrange internal or supplier transport"),
            ),
            (
                "missing_items",
                "items missing",
                "Pakkauslista sisältää tuotteita, joita laatikossa ei ole.",
                "Hei. Laatikosta puuttuu tuotteita. Mitä puuttuu?",
                "Hei. Pakkauslistan ja laatikon sisältö eivät täsmää. Mitkä nimikkeet ja määrät puuttuvat?",
                ("produce an exact shortage list", "request partial replacement"),
            ),
            (
                "damaged_goods",
                "goods damaged",
                "Osa toimituksesta vaurioitui kuljetuksessa.",
                "Hei. Tuotteita on rikki. Kuinka monta?",
                "Hei. Osa tuotteista on vaurioitunut kuljetuksessa. Onko vaurio kuvattu ennen tavaroiden siirtämistä?",
                ("separate usable and unusable goods", "arrange damage claim and replacement"),
            ),
        ),
    ),
    *_family(
        family_id="access_problem",
        scenario_id="general_issue_report",
        family_title="Access problem report",
        setting="työpaikan fyysinen tai digitaalinen käyttöoikeus",
        counterpart_role="tuki- tai turvallisuusvastaava",
        learner_goal="raportoida käyttöeste ja palauttaa tarvittava pääsy",
        useful_phrases=("käyttöoikeus", "kulku", "tunnus", "estää työn"),
        required_actions=(
            "identify the blocked resource",
            "describe the error or denial",
            "explain business impact",
            "confirm access restoration",
        ),
        question_intents=(
            "verify identity and role",
            "clarify the exact access point",
            "request the error message",
            "check previous access",
            "identify the approval owner",
            "confirm temporary access arrangements",
        ),
        variants=(
            (
                "badge_denied",
                "entry badge denied",
                "Kulkukortti ei avaa ovea toimipisteeseen.",
                "Hei. Kulkukortti ei toimi. Mikä ovi ei aukea?",
                "Hei. Kulkukorttisi ei avaa toimipisteen ovea. Toimiiko kortti muualla ja milloin ongelma alkoi?",
                ("check badge scope and expiry", "arrange temporary physical entry"),
            ),
            (
                "permissions_missing",
                "system permission missing",
                "Järjestelmä avautuu, mutta työssä tarvittava toiminto puuttuu.",
                "Hei. Järjestelmä toimii, mutta yksi toiminto puuttuu. Mikä toiminto?",
                "Hei. Pääset järjestelmään, mutta tehtävässä tarvittava toiminto ei ole käytettävissä. Mikä rooli tai näkymä puuttuu?",
                ("compare assigned and required roles", "request manager approval"),
            ),
            (
                "locked_room",
                "required room locked",
                "Työssä tarvittava tila on lukittu eikä vastuuhenkilöä tavoiteta.",
                "Hei. Tarvittava huone on lukossa. Mitä siellä tarvitaan?",
                "Hei. Työssä tarvittava tila on lukittu, eikä vastuuhenkilö vastaa. Kuinka kiireellinen pääsy on ja mitä vaihtoehtoja on?",
                ("establish urgency and authorization", "contact an alternate key holder"),
            ),
        ),
    ),
    *_family(
        family_id="quality_defect",
        scenario_id="general_issue_report",
        family_title="Quality defect report",
        setting="työn laadun seuranta",
        counterpart_role="laatuvastaava",
        learner_goal="kuvata laatupoikkeama objektiivisesti ja käynnistää korjaus",
        useful_phrases=("poikkeama", "laatu", "toistuu", "korjaava toimi"),
        required_actions=(
            "describe the expected standard",
            "show the observed difference",
            "state scope and frequency",
            "propose containment and review",
        ),
        question_intents=(
            "compare expected and actual result",
            "quantify affected items",
            "identify when the defect began",
            "check whether the process changed",
            "decide immediate containment",
            "assign root-cause follow-up",
        ),
        variants=(
            (
                "repeated_defect",
                "repeated defect",
                "Sama poikkeama on ilmestynyt useassa peräkkäisessä työssä.",
                "Hei. Sama virhe toistuu. Kuinka monta kertaa?",
                "Hei. Sama laatupoikkeama on toistunut useassa peräkkäisessä työssä. Milloin havaitsit ensimmäisen tapauksen?",
                ("identify common conditions", "pause the affected process"),
            ),
            (
                "customer_complaint",
                "customer complaint",
                "Asiakas ilmoitti virheestä, jota sisäinen tarkastus ei huomannut.",
                "Hei. Asiakas löysi virheen. Mitä hän ilmoitti?",
                "Hei. Asiakas raportoi virheen, joka jäi sisäisessä tarkastuksessa huomaamatta. Mitä näyttöä asiakkaalta saatiin?",
                ("validate the complaint", "review the inspection gap"),
            ),
            (
                "document_mismatch",
                "documentation mismatch",
                "Valmis työ ja siihen liittyvä dokumentti sisältävät eri tiedot.",
                "Hei. Työ ja dokumentti eivät ole samat. Mikä tieto eroaa?",
                "Hei. Valmis työ ja sen dokumentaatio sisältävät ristiriitaisia tietoja. Mitkä kentät tai arvot eivät täsmää?",
                ("identify the authoritative source", "correct records before release"),
            ),
        ),
    ),
    *_family(
        family_id="workload_risk",
        scenario_id="general_issue_report",
        family_title="Workload risk report",
        setting="työvuoron kuormitus- ja turvallisuustilanne",
        counterpart_role="esihenkilö",
        learner_goal="raportoida kuormitusriski ajoissa ja ehdottaa turvallista järjestelyä",
        useful_phrases=("työmäärä", "riski", "resurssi", "priorisoida"),
        required_actions=(
            "describe current staffing or workload",
            "identify concrete risk",
            "state what cannot be completed safely",
            "request prioritization or support",
        ),
        question_intents=(
            "quantify available staff and tasks",
            "identify the highest-risk work",
            "estimate time pressure",
            "separate deferrable work",
            "request additional support",
            "confirm the escalation threshold",
        ),
        variants=(
            (
                "understaffed",
                "understaffed shift",
                "Vuorosta puuttuu kaksi työntekijää eikä tehtäviä ole vähennetty.",
                "Hei. Vuorosta puuttuu työntekijöitä. Mitkä tehtävät ovat tärkeimmät?",
                "Hei. Vuorosta puuttuu kaksi työntekijää, mutta työmäärä on ennallaan. Mitkä tehtävät ovat turvallisuuden kannalta välttämättömiä?",
                ("request explicit reprioritization", "identify available backup staff"),
            ),
            (
                "unsafe_pace",
                "unsafe pace",
                "Aikataulu edellyttää työvaiheiden tekemistä nopeammin kuin turvallisesti on mahdollista.",
                "Hei. Työtahti on liian nopea. Missä kohdassa tulee riski?",
                "Hei. Nykyinen aikataulu edellyttää työvaiheiden nopeuttamista tavalla, joka lisää virheriskiä. Missä vaiheessa riski on suurin?",
                ("explain the specific safety tradeoff", "negotiate a realistic pace"),
            ),
            (
                "handover_gap",
                "handover gap",
                "Edellisen vuoron tärkeät tiedot puuttuvat ja työ pitäisi aloittaa heti.",
                "Hei. Vuororaportista puuttuu tietoja. Mitä tietoa tarvitset ensin?",
                "Hei. Edellisen vuoron olennaiset tiedot puuttuvat, mutta työ pitäisi aloittaa heti. Mitkä tiedot on varmistettava ennen etenemistä?",
                ("identify minimum safe handover information", "contact the previous shift or supervisor"),
            ),
        ),
    ),
)


MISSIONS_BY_SCENARIO: dict[str, tuple[RoleplayMission, ...]] = {}

for mission in _ALL_MISSIONS:
    MISSIONS_BY_SCENARIO.setdefault(
        mission.scenario_id,
        tuple(),
    )
    MISSIONS_BY_SCENARIO[mission.scenario_id] = (
        *MISSIONS_BY_SCENARIO[mission.scenario_id],
        mission,
    )


MISSION_BY_ID = {
    mission.mission_id: mission
    for mission in _ALL_MISSIONS
}


def all_roleplay_missions() -> tuple[RoleplayMission, ...]:
    return _ALL_MISSIONS


def missions_for_scenario(
    scenario_id: str,
) -> tuple[RoleplayMission, ...]:
    return MISSIONS_BY_SCENARIO.get(
        str(scenario_id or "").strip(),
        tuple(),
    )


def _seed_int(value: str) -> int:
    return int(
        hashlib.sha256(
            value.encode("utf-8")
        ).hexdigest(),
        16,
    )


def _dedupe(values: list[str] | tuple[str, ...]) -> list[str]:
    return list(
        dict.fromkeys(
            str(value).strip()
            for value in values
            if str(value).strip()
        )
    )


def _choose_intents(
    mission: RoleplayMission,
    recent_intents: list[str],
    seed: str,
) -> list[str]:
    candidates = _dedupe(
        list(mission.question_intents)
    )

    rng = random.Random(
        _seed_int(f"{seed}:intents")
    )
    rng.shuffle(candidates)

    recent_position = {
        intent: index
        for index, intent in enumerate(recent_intents)
    }

    candidates.sort(
        key=lambda intent: (
            intent in recent_position,
            -recent_position.get(intent, -1),
        )
    )

    return candidates[:4]


def select_mission_from_state(
    *,
    scenario_id: str,
    level_band: str,
    session_seed: str,
    previous_state: dict[str, Any] | None,
) -> tuple[dict[str, Any] | None, dict[str, Any]]:
    missions = missions_for_scenario(
        scenario_id
    )

    if not missions:
        return None, {
            "catalog": [],
            "remaining": [],
            "last_mission_id": None,
            "recent_question_intents": [],
            "cycle": 0,
        }

    catalog = [
        mission.mission_id
        for mission in missions
    ]

    state = (
        dict(previous_state)
        if isinstance(previous_state, dict)
        else {}
    )

    stored_catalog = _dedupe(
        state.get("catalog") or []
    )

    remaining = _dedupe(
        state.get("remaining") or []
    )

    remaining = [
        mission_id
        for mission_id in remaining
        if mission_id in catalog
    ]

    last_mission_id = str(
        state.get("last_mission_id") or ""
    ).strip() or None

    recent_intents = _dedupe(
        state.get("recent_question_intents") or []
    )[-24:]

    cycle = int(state.get("cycle") or 0)

    if stored_catalog != catalog:
        remaining = []

    if not remaining:
        cycle += 1
        remaining = list(catalog)

        random.Random(
            _seed_int(
                f"{session_seed}:{scenario_id}:{level_band}:{cycle}"
            )
        ).shuffle(remaining)

    if (
        len(remaining) > 1
        and remaining[0] == last_mission_id
    ):
        alternative_index = next(
            (
                index
                for index, mission_id
                in enumerate(remaining)
                if mission_id != last_mission_id
            ),
            0,
        )

        remaining[0], remaining[alternative_index] = (
            remaining[alternative_index],
            remaining[0],
        )

    scored: list[tuple[int, int, str]] = []

    for index, mission_id in enumerate(remaining):
        mission = MISSION_BY_ID[mission_id]
        overlap = len(
            set(mission.question_intents)
            & set(recent_intents)
        )
        scored.append(
            (overlap, index, mission_id)
        )

    minimum_overlap = min(
        item[0]
        for item in scored
    )

    best = [
        item
        for item in scored
        if item[0] == minimum_overlap
    ]

    best.sort(
        key=lambda item: _seed_int(
            f"{session_seed}:{item[2]}"
        )
    )

    selected_id = best[0][2]

    if (
        selected_id == last_mission_id
        and len(remaining) > 1
    ):
        selected_id = next(
            mission_id
            for mission_id in remaining
            if mission_id != last_mission_id
        )

    remaining.remove(selected_id)

    mission = MISSION_BY_ID[selected_id]

    selected_intents = _choose_intents(
        mission,
        recent_intents,
        session_seed,
    )

    next_recent_intents = (
        recent_intents
        + selected_intents
    )[-24:]

    payload = {
        "missionId": mission.mission_id,
        "scenarioId": mission.scenario_id,
        "title": mission.title,
        "setting": mission.setting,
        "counterpartRole": mission.counterpart_role,
        "learnerGoal": mission.learner_goal,
        "complication": mission.complication,
        "usefulPhrases": list(
            mission.useful_phrases
        ),
        "requiredActions": list(
            mission.required_actions
        ),
        "questionIntents": selected_intents,
        "openingText": mission.opening_for_level(
            level_band
        ),
        "learnerBrief": (
            f"Tilanne: {mission.setting}. "
            f"Tavoitteesi: {mission.learner_goal}. "
            f"Haaste: {mission.complication}"
        ),
        "prompt": (
            f"Setting: {mission.setting}. "
            f"AI counterpart: {mission.counterpart_role}. "
            f"Learner goal: {mission.learner_goal}. "
            f"Complication: {mission.complication}. "
            f"Required communicative actions: "
            f"{'; '.join(mission.required_actions)}."
        ),
    }

    next_state = {
        "catalog": catalog,
        "remaining": remaining,
        "last_mission_id": selected_id,
        "recent_question_intents": next_recent_intents,
        "cycle": cycle,
    }

    return payload, next_state


def select_roleplay_mission(
    *,
    user_key: str,
    scenario_id: str,
    level_band: str,
    session_seed: str,
) -> dict[str, Any] | None:
    missions = missions_for_scenario(
        scenario_id
    )

    if not missions:
        return None

    private_user_key = hashlib.sha256(
        str(user_key or "preview").encode("utf-8")
    ).hexdigest()[:24]

    state_key = (
        "roleplay_mission_rotation:"
        f"{private_user_key}:"
        f"{scenario_id}:"
        f"{level_band}"
    )

    with STORE.locked(
        ("user_content_history", state_key)
    ):
        previous_state = STORE.get(
            "user_content_history",
            state_key,
            default=None,
        )

        payload, next_state = (
            select_mission_from_state(
                scenario_id=scenario_id,
                level_band=level_band,
                session_seed=session_seed,
                previous_state=previous_state,
            )
        )

        STORE.set(
            "user_content_history",
            state_key,
            next_state,
        )

    try:
        STORE.write_snapshot()
    except Exception:
        # The selected mission remains valid in memory even if a
        # transient filesystem problem prevents persistence.
        pass

    return payload
