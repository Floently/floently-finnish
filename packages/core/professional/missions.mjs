const SCHEMA_VERSION = 'learning.v1';
const CONTENT_VERSION = 'professional-missions.2026-08-16.v1';

export const PROFESSIONAL_PROFESSIONS = Object.freeze(['doctor', 'nurse', 'practical_nurse']);
export const PROFESSIONAL_WORK_DOMAINS = Object.freeze([
  'healthcare',
  'construction',
  'cleaning',
  'office',
  'hospitality',
  'retail',
]);

export const PROFESSION_WORK_DOMAIN = Object.freeze({
  doctor: 'healthcare',
  nurse: 'healthcare',
  practical_nurse: 'healthcare',
});

export const PROFESSIONAL_LISTENING_FEATURE_FLAG = 'professional-listening-runtime-v1';
export const PROFESSIONAL_READING_FEATURE_FLAG = 'wave1-professional-reading-runtime-v1';
export const PROFESSIONAL_WRITING_FEATURE_FLAG = 'wave1-professional-writing-runtime-v1';
export const PROFESSIONAL_ROLEPLAY_ADAPTER_FLAG = 'professional-mission-roleplay-adapter-v1';

export const CANONICAL_PROFESSIONAL_ROUTES = Object.freeze({
  listeningFallback: '/professional',
  roleplay: '/speaking',
  reading: '/professional/reading',
  writing: '/professional/writing',
});

export const INTERVIEW_SCENARIO_BY_PROFESSION = Object.freeze({
  nurse: 'nurse_interview_beta',
  doctor: 'doctor_patient_interview',
  practical_nurse: 'practical_nurse_interview',
});

const WORKPLACE_SCENARIO_BY_PROFESSION = Object.freeze({
  nurse: 'nurse_shift_handover',
  doctor: 'doctor_follow_up_explanation',
  practical_nurse: 'practical_nurse_daily_care',
});

const LEVEL_BANDS = new Set(['A1-A2', 'B1-B2', 'C1-C2']);
const STEP_RUNTIME_SKILL = Object.freeze({
  listening: 'listening',
  roleplay: 'speaking',
  reading: 'reading',
  writing: 'writing',
});
const REQUIRED_FOUR_SKILLS = Object.freeze(['listening', 'speaking', 'reading', 'writing']);

const LANGUAGE_ONLY_NOTICE =
  'This is Finnish-language communication practice. Follow your real workplace procedures, supervision and professional responsibilities in actual work.';

export class ProfessionalMissionValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ProfessionalMissionValidationError';
  }
}

function assert(condition, message) {
  if (!condition) throw new ProfessionalMissionValidationError(message);
}

function asString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isProfession(value) {
  return PROFESSIONAL_PROFESSIONS.includes(value);
}

function isWorkDomain(value) {
  return PROFESSIONAL_WORK_DOMAINS.includes(value);
}

function content(kind, title, finnish, learnerTask, languageFocus) {
  return Object.freeze({ kind, title, finnish, learnerTask, languageFocus: Object.freeze([...languageFocus]) });
}

function provenance(id, note) {
  return Object.freeze({
    provenanceId: id,
    origin: 'kielivalmis-original',
    contentVersion: CONTENT_VERSION,
    authoredOn: '2026-08-16',
    note,
    ykiOrigin: false,
    proprietaryOrigin: false,
  });
}

function safetyFrame(kind = 'regulated-language-practice') {
  return Object.freeze({
    kind,
    notice: LANGUAGE_ONLY_NOTICE,
    authorityBoundary:
      'Mission completion demonstrates language practice only; it does not certify professional competence, clinical judgement, legal authority or workplace safety competence.',
  });
}

function entitlementKeys(profession) {
  return Object.freeze(['professionalAccess', `profession:${profession}`]);
}

function stepDescriptor({
  missionId,
  contextId,
  profession,
  levelBand,
  order,
  runtime,
  title,
  estimatedMinutes,
  route,
  health,
  featureFlag,
  params,
  skills,
  modality,
  tags,
}) {
  return Object.freeze({
    schemaVersion: SCHEMA_VERSION,
    taskId: `${missionId}.step-${order}`,
    contentVersion: CONTENT_VERSION,
    runtime,
    pathway: 'professional',
    skills: Object.freeze([...skills]),
    levelBand,
    estimatedMinutes,
    modality: Object.freeze({ ...modality }),
    requiredEntitlements: entitlementKeys(profession),
    launch: Object.freeze({
      route,
      params: Object.freeze({
        missionId,
        contextId,
        profession,
        ...(params ?? {}),
      }),
    }),
    health,
    ...(featureFlag ? { featureFlag } : {}),
    profession,
    topic: title,
    contextId,
    tags: Object.freeze(['professional-mission', ...tags]),
  });
}

function listeningStep(base, learningContent) {
  const { missionId, contextId, profession, levelBand } = base;
  return Object.freeze({
    stepId: `${missionId}.listen`,
    order: 1,
    stage: 'receive',
    objective: learningContent.learnerTask,
    audience: base.audience,
    register: base.register,
    content: learningContent,
    task: stepDescriptor({
      missionId,
      contextId,
      profession,
      levelBand,
      order: 1,
      runtime: 'listening',
      title: learningContent.title,
      estimatedMinutes: 4,
      route: CANONICAL_PROFESSIONAL_ROUTES.listeningFallback,
      health: 'unavailable',
      featureFlag: PROFESSIONAL_LISTENING_FEATURE_FLAG,
      params: { unresolvedCapability: 'professional-listening', contentRef: `${missionId}.listen-content` },
      skills: ['listening'],
      modality: { audio: true },
      tags: ['listen', base.workDomain],
    }),
  });
}

function roleplayStep(base, learningContent, scenarioId) {
  const { missionId, contextId, profession, levelBand } = base;
  return Object.freeze({
    stepId: `${missionId}.speak`,
    order: 2,
    stage: 'produce',
    objective: learningContent.learnerTask,
    audience: base.audience,
    register: base.register,
    content: learningContent,
    task: stepDescriptor({
      missionId,
      contextId,
      profession,
      levelBand,
      order: 2,
      runtime: 'roleplay',
      title: learningContent.title,
      estimatedMinutes: 6,
      route: CANONICAL_PROFESSIONAL_ROUTES.roleplay,
      health: 'degraded',
      featureFlag: PROFESSIONAL_ROLEPLAY_ADAPTER_FLAG,
      params: { scenarioId, entryMode: 'workplace' },
      skills: ['speaking'],
      modality: { audio: true, microphone: true },
      tags: ['speak', base.workDomain],
    }),
  });
}

function readingStep(base, learningContent) {
  const { missionId, contextId, profession, levelBand } = base;
  return Object.freeze({
    stepId: `${missionId}.read`,
    order: 3,
    stage: 'interpret',
    objective: learningContent.learnerTask,
    audience: base.audience,
    register: base.register,
    content: learningContent,
    task: stepDescriptor({
      missionId,
      contextId,
      profession,
      levelBand,
      order: 3,
      runtime: 'reading',
      title: learningContent.title,
      estimatedMinutes: 5,
      route: CANONICAL_PROFESSIONAL_ROUTES.reading,
      health: 'unavailable',
      featureFlag: PROFESSIONAL_READING_FEATURE_FLAG,
      params: { contentRef: `${missionId}.read-content` },
      skills: ['reading'],
      modality: { visual: true },
      tags: ['read', base.workDomain],
    }),
  });
}

function writingStep(base, learningContent) {
  const { missionId, contextId, profession, levelBand } = base;
  return Object.freeze({
    stepId: `${missionId}.write`,
    order: 4,
    stage: 'document',
    objective: learningContent.learnerTask,
    audience: base.audience,
    register: base.register,
    content: learningContent,
    task: stepDescriptor({
      missionId,
      contextId,
      profession,
      levelBand,
      order: 4,
      runtime: 'writing',
      title: learningContent.title,
      estimatedMinutes: 7,
      route: CANONICAL_PROFESSIONAL_ROUTES.writing,
      health: 'unavailable',
      featureFlag: PROFESSIONAL_WRITING_FEATURE_FLAG,
      params: { contentRef: `${missionId}.write-content` },
      skills: ['writing'],
      modality: { keyboard: true },
      tags: ['write', base.workDomain],
    }),
  });
}

function correctionStep(base, learningContent) {
  const { missionId, contextId, profession, levelBand } = base;
  return Object.freeze({
    stepId: `${missionId}.correct`,
    order: 5,
    stage: 'correct',
    objective: learningContent.learnerTask,
    audience: base.audience,
    register: base.register,
    content: learningContent,
    task: stepDescriptor({
      missionId,
      contextId,
      profession,
      levelBand,
      order: 5,
      runtime: 'writing',
      title: learningContent.title,
      estimatedMinutes: 3,
      route: CANONICAL_PROFESSIONAL_ROUTES.writing,
      health: 'unavailable',
      featureFlag: PROFESSIONAL_WRITING_FEATURE_FLAG,
      params: { contentRef: `${missionId}.correction-content`, revisionMode: 'focused-correction' },
      skills: ['writing', 'grammar'],
      modality: { keyboard: true },
      tags: ['correct', base.workDomain],
    }),
  });
}

function createMission({
  missionId,
  profession,
  title,
  situation,
  communicativeGoal,
  audience,
  register,
  listening,
  speaking,
  reading,
  writing,
  correction,
}) {
  const workDomain = PROFESSION_WORK_DOMAIN[profession];
  const contextId = `professional:${profession}:${missionId}:v1`;
  const base = Object.freeze({
    missionId,
    profession,
    workDomain,
    levelBand: 'B1-B2',
    audience,
    register,
    contextId,
  });

  return Object.freeze({
    schemaVersion: 'professional-mission.v1',
    missionId,
    contentVersion: CONTENT_VERSION,
    profession,
    workDomain,
    levelBand: base.levelBand,
    title,
    situation,
    communicativeGoal,
    audience,
    register,
    contextId,
    safetyFrame: safetyFrame(),
    provenance: provenance(
      `${missionId}.provenance`,
      'Original KieliValmis synthetic workplace communication material authored for Wave 1. No official YKI item, textbook exercise or paid-course content was used.',
    ),
    steps: Object.freeze([
      listeningStep(base, listening),
      roleplayStep(base, speaking, WORKPLACE_SCENARIO_BY_PROFESSION[profession]),
      readingStep(base, reading),
      writingStep(base, writing),
      correctionStep(base, correction),
    ]),
  });
}

const NURSE_HANDOVER = createMission({
  missionId: 'nurse-shift-handover',
  profession: 'nurse',
  title: 'Clarify a shift handover before documenting it',
  situation:
    'A fictional ward handover contains one detail that is easy to miss. Your language goal is to identify the uncertainty, clarify it with a colleague and document only the confirmed information.',
  communicativeGoal: 'Receive, clarify and document a concise handover while marking uncertainty explicitly.',
  audience: 'colleague',
  register: 'neutral-professional-and-concise',
  listening: content(
    'audio-script',
    'Listen for the uncertain detail',
    'Yövuoron viesti aamuvuorolle: Huoneen kaksitoista potilas kertoi aamulla, että kipu tuntuu voimakkaammalta kuin eilen. Muistiinpanossa kellonaika ei ole selvä. Kollegalle on jätetty pyyntö tarkistaa tieto ennen seuraavaa merkintää.',
    'Identify what is confirmed and what still needs clarification. Do not infer a clinical action.',
    ['handover sequencing', 'reported information', 'marking uncertainty'],
  ),
  speaking: content(
    'roleplay-brief',
    'Clarify the handover with a colleague',
    'Aloita lyhyellä yhteenvedolla ja kysy sitten täsmällisesti epäselvästä kellonajasta. Varmista lopuksi, mikä tieto voidaan kirjata vahvistettuna.',
    'Give a short spoken handover, ask one precise clarification question and confirm the corrected fact.',
    ['polite clarification', 'confirmation', 'concise spoken summary'],
  ),
  reading: content(
    'workplace-note',
    'Read the related note',
    'Yövuoron merkintä: Potilas ilmoitti kivun voimistuneen. Tarkka kellonaika puuttuu. Aamuvuoro: varmista ilmoituksen ajankohta ennen kuin viittaat siihen jatkomerkinnässä.',
    'Separate the documented facts from the missing detail and connect them to the same handover context.',
    ['documentation language', 'time expressions', 'fact versus missing information'],
  ),
  writing: content(
    'writing-brief',
    'Write the confirmed handover note',
    'Kirjoita 2–3 virkkeen harjoitusmerkintä, jossa kerrot vahvistetut tiedot neutraalisti ja merkitset selvästi, jos jokin tieto on edelleen tarkistamatta.',
    'Write a concise fictional documentation note using only facts established in the mission.',
    ['neutral documentation', 'source attribution', 'uncertainty wording'],
  ),
  correction: content(
    'focused-correction',
    'Repair one high-value language issue',
    'Tarkista lopuksi yksi asia: erottele varma tieto ja tarkistamaton tieto kielessäsi. Muokkaa vain sitä virkettä, jossa ero ei vielä ole selvä.',
    'Revise one sentence so confirmed and unconfirmed information cannot be confused.',
    ['certainty marking', 'focused revision'],
  ),
});

const DOCTOR_FOLLOW_UP = createMission({
  missionId: 'doctor-follow-up-explanation',
  profession: 'doctor',
  title: 'Explain a follow-up plan in clear patient-facing Finnish',
  situation:
    'A fictional consultation is ending. The communication task is to understand the patient’s remaining question, explain the agreed next administrative step plainly and document the conversation without adding medical advice.',
  communicativeGoal: 'Move from a patient question to a clear explanation and neutral written summary.',
  audience: 'patient-and-colleague',
  register: 'plain-patient-facing-then-neutral-documentation',
  listening: content(
    'audio-script',
    'Listen to the patient’s final question',
    'Potilas sanoo: “Ymmärsinkö oikein, että saan uuden ajan myöhemmin? En ole varma, pitääkö minun tehdä nyt jotain itse.” Vastaanoton harjoitustiedossa lukee vain, että ajanvaraus ottaa yhteyttä myöhemmin.',
    'Identify the patient’s two uncertainties and the one administrative fact stated in the practice context.',
    ['question interpretation', 'plain-language confirmation', 'administrative vocabulary'],
  ),
  speaking: content(
    'roleplay-brief',
    'Explain the agreed next step',
    'Selitä rauhallisesti vain harjoitustilanteessa annettu tieto. Tarkista lopuksi yhdellä kysymyksellä, että potilas ymmärsi, kuka ottaa yhteyttä ja mitä tietoa ei vielä ole.',
    'Use plain Finnish to explain the stated administrative next step and check understanding without inventing clinical guidance.',
    ['plain Finnish', 'checking understanding', 'scope control'],
  ),
  reading: content(
    'workplace-note',
    'Read the consultation follow-up note',
    'Jatko: ajanvaraus ottaa yhteyttä myöhemmin. Tarkkaa aikaa ei ole vielä sovittu. Potilaalle kerrotaan, että uusi aika vahvistetaan erikseen.',
    'Find what has been agreed, what remains open and which sentence should be reflected in the written summary.',
    ['future reference', 'administrative register', 'open versus confirmed information'],
  ),
  writing: content(
    'writing-brief',
    'Write a neutral follow-up summary',
    'Kirjoita lyhyt harjoitusyhteenveto keskustelusta. Mainitse, mitä potilaalle selitettiin ja mikä tieto vahvistetaan myöhemmin. Älä lisää diagnoosia, hoito-ohjetta tai muuta tietoa, jota tehtävässä ei annettu.',
    'Document the communication outcome without adding facts outside the fictional task.',
    ['neutral reporting', 'reported speech', 'information boundaries'],
  ),
  correction: content(
    'focused-correction',
    'Make the register clearer',
    'Etsi yksi ilmaus, joka kuulostaa liian puhekieliseltä kirjallisessa yhteenvedossa, ja muuta vain se neutraaliksi dokumentointikieleksi.',
    'Revise one phrase to fit neutral professional documentation register.',
    ['register shift', 'focused revision'],
  ),
});

const PRACTICAL_NURSE_DAILY_CARE = createMission({
  missionId: 'practical-nurse-daily-care-update',
  profession: 'practical_nurse',
  title: 'Coordinate a daily-care update across colleague and resident communication',
  situation:
    'In a fictional residential-care shift, a routine plan has changed because a resident wants more time before a scheduled activity. The language task is to understand the update, clarify timing and record the change neutrally.',
  communicativeGoal: 'Coordinate a respectful daily-care update while keeping resident-facing and colleague-facing register distinct.',
  audience: 'resident-and-colleague',
  register: 'supportive-resident-facing-and-concise-colleague-facing',
  listening: content(
    'audio-script',
    'Listen to the shift update',
    'Kollega kertoo: “Aamun yhteinen lähtö oli merkitty kello yhdeksäksi, mutta asukas pyysi lisää aikaa. Hän sanoi olevansa valmis noin puoli kymmeneltä. Merkitään muutos ja varmistetaan aika vielä hänen kanssaan.”',
    'Identify the original time, the requested change and what still needs verbal confirmation.',
    ['time expressions', 'reported request', 'confirmation language'],
  ),
  speaking: content(
    'roleplay-brief',
    'Confirm the timing respectfully',
    'Puhu asukkaalle rauhallisesti. Kerro, minkä ajan kuulit kollegalta, ja pyydä vahvistamaan, sopiiko se edelleen. Älä painosta tai tee päätöksiä asukkaan puolesta.',
    'Confirm the fictional timing in respectful resident-facing Finnish and then summarize it to a colleague.',
    ['respectful confirmation', 'time language', 'register shift'],
  ),
  reading: content(
    'workplace-note',
    'Read the schedule note',
    'Aamun lähtö: alkuperäinen aika 9.00. Asukas pyysi myöhempää lähtöä. Ehdotettu uusi aika 9.30, vahvistus vielä kesken.',
    'Identify which time is original, which is proposed and which status word shows that confirmation is still pending.',
    ['schedule language', 'status vocabulary', 'information status'],
  ),
  writing: content(
    'writing-brief',
    'Write the updated shift message',
    'Kirjoita lyhyt harjoitusviesti kollegalle. Kerro alkuperäinen aika, asukkaan pyyntö ja vahvistettu tai vielä vahvistamaton uusi aika sen mukaan, mitä tehtävässä selvisi.',
    'Write a concise colleague update that preserves the resident’s request and the information status accurately.',
    ['concise shift message', 'reported request', 'confirmed versus pending'],
  ),
  correction: content(
    'focused-correction',
    'Repair one respectful phrasing issue',
    'Tarkista yksi virke: kuvaako se asukkaan pyyntöä neutraalisti vai kuulostaako se siltä, että päätös tehtiin hänen puolestaan? Muokkaa vain tätä kohtaa.',
    'Revise one sentence so agency and reported information are expressed accurately and respectfully.',
    ['agency wording', 'focused revision'],
  ),
});

export const PROFESSIONAL_MISSIONS = Object.freeze([
  NURSE_HANDOVER,
  DOCTOR_FOLLOW_UP,
  PRACTICAL_NURSE_DAILY_CARE,
]);

export const WORK_DOMAIN_COMMUNICATION_PROFILES = Object.freeze({
  healthcare: Object.freeze({
    domain: 'healthcare',
    goal: 'Receive a handover, clarify uncertain information, communicate it to the right person and document only what is confirmed.',
    audience: 'colleague-or-patient',
    register: 'clear-neutral-and-role-sensitive',
    fourSkillArc: Object.freeze(['listen to handover', 'clarify aloud', 'read related note', 'write a factual update']),
    safetyBoundary: LANGUAGE_ONLY_NOTICE,
  }),
  construction: Object.freeze({
    domain: 'construction',
    goal: 'Understand a site briefing, stop and clarify an unclear instruction, read the related notice and write a concise issue update.',
    audience: 'coworker-or-supervisor',
    register: 'direct-clear-and-confirming',
    fourSkillArc: Object.freeze(['listen to briefing', 'confirm aloud', 'read site notice', 'write issue update']),
    safetyBoundary: LANGUAGE_ONLY_NOTICE,
  }),
  cleaning: Object.freeze({
    domain: 'cleaning',
    goal: 'Understand a changed room priority, clarify access, read a maintenance note and report task status to a supervisor.',
    audience: 'supervisor-or-customer',
    register: 'polite-service-and-concise-status',
    fourSkillArc: Object.freeze(['listen to priorities', 'clarify access', 'read maintenance note', 'write status update']),
    safetyBoundary: LANGUAGE_ONLY_NOTICE,
  }),
  office: Object.freeze({
    domain: 'office',
    goal: 'Understand a schedule change, resolve conflicting meeting information, read the message thread and send one corrected follow-up.',
    audience: 'colleague-or-stakeholder',
    register: 'polite-concise-and-explicit',
    fourSkillArc: Object.freeze(['listen to update', 'clarify conflict', 'read message thread', 'write corrected follow-up']),
    safetyBoundary: LANGUAGE_ONLY_NOTICE,
  }),
  hospitality: Object.freeze({
    domain: 'hospitality',
    goal: 'Receive a service-delay update, explain the situation calmly, read the booking note and write a precise shift handover.',
    audience: 'guest-and-colleague',
    register: 'service-polite-then-concise-internal',
    fourSkillArc: Object.freeze(['listen to service update', 'respond to guest', 'read booking note', 'write shift handover']),
    safetyBoundary: LANGUAGE_ONLY_NOTICE,
  }),
  retail: Object.freeze({
    domain: 'retail',
    goal: 'Understand a return request, explain only the stated store information, read the transaction note and write a neutral customer follow-up.',
    audience: 'customer-and-colleague',
    register: 'service-polite-and-policy-bounded',
    fourSkillArc: Object.freeze(['listen to request', 'clarify options', 'read transaction note', 'write customer follow-up']),
    safetyBoundary: LANGUAGE_ONLY_NOTICE,
  }),
});

export function validateProfessionalMission(mission) {
  assert(mission && typeof mission === 'object' && !Array.isArray(mission), 'Mission must be an object.');
  assert(mission.schemaVersion === 'professional-mission.v1', 'Unsupported professional mission schema version.');
  assert(asString(mission.missionId), 'Mission requires missionId.');
  assert(asString(mission.contentVersion), 'Mission requires contentVersion.');
  assert(isProfession(mission.profession), `Unknown profession: ${String(mission.profession)}`);
  assert(isWorkDomain(mission.workDomain), `Unknown work domain: ${String(mission.workDomain)}`);
  assert(PROFESSION_WORK_DOMAIN[mission.profession] === mission.workDomain, 'Profession/work-domain mapping mismatch.');
  assert(LEVEL_BANDS.has(mission.levelBand), `Unsupported level band: ${String(mission.levelBand)}`);
  assert(asString(mission.contextId), 'Mission requires contextId.');
  assert(asString(mission.title) && asString(mission.situation) && asString(mission.communicativeGoal), 'Mission requires title, situation and communicativeGoal.');
  assert(asString(mission.audience) && asString(mission.register), 'Mission requires audience and register.');

  assert(mission.safetyFrame && mission.safetyFrame.kind === 'regulated-language-practice', 'Regulated profession mission requires language-practice safety framing.');
  assert(asString(mission.safetyFrame.notice), 'Mission safety notice is required.');
  assert(asString(mission.safetyFrame.authorityBoundary), 'Mission authority boundary is required.');

  const p = mission.provenance;
  assert(p && typeof p === 'object', 'Mission provenance is required.');
  assert(asString(p.provenanceId) && asString(p.contentVersion), 'Mission provenance identifiers are required.');
  assert(p.origin === 'kielivalmis-original' || p.origin === 'repository-adapter', 'Unsupported content provenance origin.');
  assert(p.ykiOrigin === false, 'Professional missions must not use YKI-origin content.');
  assert(p.proprietaryOrigin === false, 'Professional missions must not use proprietary instructional content.');

  assert(Array.isArray(mission.steps) && mission.steps.length >= 4, 'Mission requires a multi-skill step chain.');
  const seenIds = new Set();
  const seenSkills = new Set();

  mission.steps.forEach((step, index) => {
    assert(step && typeof step === 'object', `Step ${index + 1} must be an object.`);
    assert(step.order === index + 1, 'Mission step order must be sequential and deterministic.');
    assert(asString(step.stepId) && !seenIds.has(step.stepId), 'Mission step IDs must be non-empty and unique.');
    seenIds.add(step.stepId);
    assert(asString(step.objective) && asString(step.audience) && asString(step.register), `Step ${step.stepId} requires objective, audience and register.`);
    assert(step.content && asString(step.content.title) && asString(step.content.learnerTask), `Step ${step.stepId} requires authored learning content.`);

    const task = step.task;
    assert(task && typeof task === 'object', `Step ${step.stepId} requires a TaskDescriptor.`);
    assert(task.schemaVersion === SCHEMA_VERSION, `Step ${step.stepId} uses the wrong shared schema version.`);
    assert(task.pathway === 'professional', `Step ${step.stepId} must stay on the professional pathway.`);
    assert(task.profession === mission.profession, `Profession leakage in step ${step.stepId}.`);
    assert(task.contextId === mission.contextId, `Context continuity mismatch in step ${step.stepId}.`);
    assert(task.levelBand === mission.levelBand, `Level mismatch in step ${step.stepId}.`);
    assert(STEP_RUNTIME_SKILL[task.runtime], `Step ${step.stepId} references a non-canonical mission runtime.`);
    assert(Array.isArray(task.skills) && task.skills.includes(STEP_RUNTIME_SKILL[task.runtime]), `Step ${step.stepId} has invalid skill metadata for ${task.runtime}.`);
    task.skills.forEach((skill) => seenSkills.add(skill));
    assert(Number.isFinite(task.estimatedMinutes) && task.estimatedMinutes > 0, `Step ${step.stepId} requires a positive duration.`);
    assert(Array.isArray(task.requiredEntitlements), `Step ${step.stepId} requires entitlement declarations.`);
    assert(task.requiredEntitlements.includes('professionalAccess'), `Step ${step.stepId} must declare professional access.`);
    assert(task.requiredEntitlements.includes(`profession:${mission.profession}`), `Step ${step.stepId} must declare its exact profession.`);
    assert(task.launch && asString(task.launch.route), `Step ${step.stepId} requires a launch route.`);
    assert(task.launch.params?.profession === mission.profession, `Launch profession leakage in step ${step.stepId}.`);
    assert(task.launch.params?.contextId === mission.contextId, `Launch context mismatch in step ${step.stepId}.`);
    assert(task.ykiMode === undefined && task.runtime !== 'yki', `Professional mission step ${step.stepId} cannot use YKI runtime semantics.`);

    if (task.runtime === 'roleplay') {
      assert(task.launch.route === CANONICAL_PROFESSIONAL_ROUTES.roleplay, 'Roleplay must reference the canonical speaking route.');
      assert(task.health === 'degraded', 'Roleplay descriptor remains degraded until the protected preset adapter is integration-wired.');
      assert(task.featureFlag === PROFESSIONAL_ROLEPLAY_ADAPTER_FLAG, 'Roleplay integration flag is required.');
      assert(asString(task.launch.params?.scenarioId), 'Roleplay scenarioId is required.');
    }
    if (task.runtime === 'reading') {
      assert(task.launch.route === CANONICAL_PROFESSIONAL_ROUTES.reading, 'Reading must reference the reserved canonical Professional Reading route.');
      assert(task.health === 'unavailable', 'Reading stays unavailable on Agent F until the canonical Reading owner is integrated.');
      assert(task.featureFlag === PROFESSIONAL_READING_FEATURE_FLAG, 'Reading integration flag is required.');
    }
    if (task.runtime === 'writing') {
      assert(task.launch.route === CANONICAL_PROFESSIONAL_ROUTES.writing, 'Writing must reference the reserved canonical Professional Writing route.');
      assert(task.health === 'unavailable', 'Writing stays unavailable on Agent F until the canonical Writing owner is integrated.');
      assert(task.featureFlag === PROFESSIONAL_WRITING_FEATURE_FLAG, 'Writing integration flag is required.');
    }
    if (task.runtime === 'listening') {
      assert(task.launch.route === CANONICAL_PROFESSIONAL_ROUTES.listeningFallback, 'Unresolved Professional Listening must fail back to the Professional hub, not invent a route.');
      assert(task.health === 'unavailable', 'Professional Listening must remain unavailable until a canonical owner exists.');
      assert(task.featureFlag === PROFESSIONAL_LISTENING_FEATURE_FLAG, 'Listening integration flag is required.');
      assert(task.launch.params?.unresolvedCapability === 'professional-listening', 'Listening fallback must identify the unresolved capability explicitly.');
    }
  });

  REQUIRED_FOUR_SKILLS.forEach((skill) => {
    assert(seenSkills.has(skill), `Mission is missing required ${skill} coverage.`);
  });

  return mission;
}

export function validateProfessionalMissionCatalog(catalog = PROFESSIONAL_MISSIONS) {
  assert(Array.isArray(catalog) && catalog.length > 0, 'Professional mission catalog must not be empty.');
  const ids = new Set();
  catalog.forEach((mission) => {
    validateProfessionalMission(mission);
    assert(!ids.has(mission.missionId), `Duplicate missionId: ${mission.missionId}`);
    ids.add(mission.missionId);
  });
  return catalog;
}

export function listMissionsForProfession(profession) {
  assert(isProfession(profession), `Unknown profession: ${String(profession)}`);
  return PROFESSIONAL_MISSIONS.filter((mission) => mission.profession === profession);
}

export function getMissionById(missionId) {
  const mission = PROFESSIONAL_MISSIONS.find((candidate) => candidate.missionId === missionId);
  if (!mission) throw new ProfessionalMissionValidationError(`Unknown mission: ${String(missionId)}`);
  return mission;
}

export function getWorkDomainCommunicationProfile(domain) {
  assert(isWorkDomain(domain), `Unknown work domain: ${String(domain)}`);
  return WORK_DOMAIN_COMMUNICATION_PROFILES[domain];
}

export function adaptWorkTrackToMissionSeed(track) {
  assert(track && typeof track === 'object', 'Work track is required.');
  assert(isWorkDomain(track.domain), `Unknown work-track domain: ${String(track.domain)}`);
  const profile = getWorkDomainCommunicationProfile(track.domain);
  return Object.freeze({
    adapter: 'work-path.v1',
    workDomain: track.domain,
    title: asString(track.title) || `${track.domain} Finnish`,
    communicativeGoal: profile.goal,
    audience: profile.audience,
    register: profile.register,
    fourSkillArc: profile.fourSkillArc,
    repositorySignals: Object.freeze({
      coreTasks: Object.freeze(Array.isArray(track.core_tasks) ? track.core_tasks.filter((item) => asString(item)) : []),
      languageTargets: Object.freeze(Array.isArray(track.key_language_targets) ? track.key_language_targets.filter((item) => asString(item)) : []),
    }),
    safetyBoundary: profile.safetyBoundary,
  });
}

export function adaptIncidentScenarioToMissionSeed(scenario) {
  assert(scenario && typeof scenario === 'object', 'Incident scenario is required.');
  assert(isWorkDomain(scenario.track), `Unknown incident domain: ${String(scenario.track)}`);
  const profile = getWorkDomainCommunicationProfile(scenario.track);
  return Object.freeze({
    adapter: 'workplace-incident.v1',
    workDomain: scenario.track,
    title: asString(scenario.title) || 'Workplace communication incident',
    situation: asString(scenario.situation),
    communicativeGoal: profile.goal,
    languageTargets: Object.freeze(Array.isArray(scenario.language_targets) ? scenario.language_targets.filter((item) => asString(item)) : []),
    followUpTask: asString(scenario.follow_up_task),
    safetyBoundary: profile.safetyBoundary,
    provenance: Object.freeze({
      provenanceId: `repository-incident:${scenario.track}:${asString(scenario.title) || 'untitled'}`,
      origin: 'repository-adapter',
      contentVersion: CONTENT_VERSION,
      authoredOn: '2026-08-16',
      note: 'Adapter intentionally excludes response choices, best-response indices and operational decision guidance; it preserves communication context only.',
      ykiOrigin: false,
      proprietaryOrigin: false,
    }),
  });
}

export function buildInterviewRoleplayDescriptor(profession, { levelBand = 'B1-B2', contextId } = {}) {
  assert(isProfession(profession), `Unknown profession: ${String(profession)}`);
  assert(LEVEL_BANDS.has(levelBand), `Unsupported level band: ${String(levelBand)}`);
  const resolvedContextId = asString(contextId) || `professional:${profession}:interview:v1`;
  return Object.freeze({
    schemaVersion: SCHEMA_VERSION,
    taskId: `professional.${profession}.interview`,
    contentVersion: CONTENT_VERSION,
    runtime: 'roleplay',
    pathway: 'professional',
    skills: Object.freeze(['speaking', 'listening']),
    levelBand,
    estimatedMinutes: 8,
    modality: Object.freeze({ audio: true, microphone: true }),
    requiredEntitlements: entitlementKeys(profession),
    launch: Object.freeze({
      route: CANONICAL_PROFESSIONAL_ROUTES.roleplay,
      params: Object.freeze({
        profession,
        scenarioId: INTERVIEW_SCENARIO_BY_PROFESSION[profession],
        entryMode: 'interview',
        contextId: resolvedContextId,
      }),
    }),
    health: 'degraded',
    featureFlag: PROFESSIONAL_ROLEPLAY_ADAPTER_FLAG,
    profession,
    topic: 'structured workplace interview',
    contextId: resolvedContextId,
    tags: Object.freeze(['professional-mission', 'interview', PROFESSION_WORK_DOMAIN[profession]]),
  });
}

// Validate authored source data eagerly so malformed catalog changes fail close in every consumer.
validateProfessionalMissionCatalog(PROFESSIONAL_MISSIONS);
