import type { TaskDescriptor } from '@core/schemas/learning';
import {
  PROFESSIONAL_MISSIONS,
  PROFESSIONAL_PROFESSIONS,
} from '@core/professional/missions.mjs';

import {
  toReadingTaskDescriptor,
  validateReadingTask,
  type ReadingQuestion,
  type ReadingTask,
} from '../reading/readingEngine';
import { buildWritingTaskDescriptor } from '../writing/engine';
import type {
  WritingFeedbackCheck,
  WritingProfession,
  WritingTask,
} from '../writing/model';

type ProfessionalMission = (typeof PROFESSIONAL_MISSIONS)[number];
type ProfessionalMissionStep = ProfessionalMission['steps'][number];
type ProfessionalProfession = (typeof PROFESSIONAL_PROFESSIONS)[number];

export type MissionRuntimeProfession = Extract<ProfessionalProfession, WritingProfession>;

export type ProfessionalMissionRuntimeEntry = {
  descriptor: TaskDescriptor;
  title: string;
  summary: string;
  missionId: string;
  source: 'professional-mission-roleplay' | 'professional-mission-reading' | 'professional-mission-writing';
};

type MissionReadingQuestionFactory = (prefix: string) => ReadingQuestion[];

const READING_QUESTIONS: Readonly<Record<string, MissionReadingQuestionFactory>> = {
  'nurse-shift-handover': (prefix) => [
    {
      id: `${prefix}.missing-detail`,
      type: 'detail',
      prompt: 'Mikä tieto merkinnästä puuttuu?',
      options: [
        { id: `${prefix}.missing-time`, label: 'Tarkka kellonaika' },
        { id: `${prefix}.missing-room`, label: 'Huoneen numero' },
        { id: `${prefix}.missing-shift`, label: 'Seuraavan vuoron nimi' },
      ],
      correctOptionId: `${prefix}.missing-time`,
      feedback: {
        correct: 'Oikein. Teksti sanoo suoraan, että tarkka kellonaika puuttuu.',
        incorrect: 'Etsi virke, jossa kerrotaan, mitä tietoa ei vielä ole vahvistettu.',
      },
    },
    {
      id: `${prefix}.next-action`,
      type: 'detail',
      prompt: 'Mitä aamuvuoron pitää tehdä ennen jatkomerkintää?',
      options: [
        { id: `${prefix}.confirm-time`, label: 'Varmistaa ilmoituksen ajankohta' },
        { id: `${prefix}.remove-note`, label: 'Poistaa yövuoron merkintä' },
        { id: `${prefix}.change-room`, label: 'Vaihtaa potilaan huone' },
      ],
      correctOptionId: `${prefix}.confirm-time`,
      feedback: {
        correct: 'Oikein. Ajankohta pitää varmistaa ennen kuin siihen viitataan jatkomerkinnässä.',
        incorrect: 'Katso tekstin viimeistä virkettä ja etsi aamuvuorolle annettu tehtävä.',
      },
    },
  ],
  'doctor-follow-up-explanation': (prefix) => [
    {
      id: `${prefix}.confirmed`,
      type: 'detail',
      prompt: 'Mikä jatkoa koskeva tieto on jo vahvistettu?',
      options: [
        { id: `${prefix}.booking-contact`, label: 'Ajanvaraus ottaa yhteyttä myöhemmin.' },
        { id: `${prefix}.exact-time`, label: 'Tarkka uusi aika on jo sovittu.' },
        { id: `${prefix}.patient-calls`, label: 'Potilaan pitää itse soittaa samana päivänä.' },
      ],
      correctOptionId: `${prefix}.booking-contact`,
      feedback: {
        correct: 'Oikein. Yhteydenotto on vahvistettu, mutta tarkkaa aikaa ei vielä ole.',
        incorrect: 'Erota tekstissä vahvistettu yhteydenotto ja vielä avoin tarkka aika.',
      },
    },
    {
      id: `${prefix}.open-detail`,
      type: 'main_idea',
      prompt: 'Mikä tieto vahvistetaan vasta myöhemmin?',
      options: [
        { id: `${prefix}.new-time`, label: 'Uuden ajan tarkka ajankohta' },
        { id: `${prefix}.contact-owner`, label: 'Se, että ajanvaraus ottaa yhteyttä' },
        { id: `${prefix}.conversation`, label: 'Se, että potilaan kanssa keskusteltiin' },
      ],
      correctOptionId: `${prefix}.new-time`,
      feedback: {
        correct: 'Oikein. Teksti sanoo, että uusi aika vahvistetaan erikseen.',
        incorrect: 'Etsi kohta, jossa käytetään ilmausta “ei ole vielä sovittu”.',
      },
    },
  ],
  'practical-nurse-daily-care-update': (prefix) => [
    {
      id: `${prefix}.times`,
      type: 'detail',
      prompt: 'Mitkä ovat alkuperäinen ja ehdotettu uusi aika?',
      options: [
        { id: `${prefix}.nine-nine-thirty`, label: '9.00 ja 9.30' },
        { id: `${prefix}.eight-nine`, label: '8.00 ja 9.00' },
        { id: `${prefix}.nine-ten`, label: '9.00 ja 10.00' },
      ],
      correctOptionId: `${prefix}.nine-nine-thirty`,
      feedback: {
        correct: 'Oikein. Alkuperäinen aika on 9.00 ja ehdotettu uusi aika 9.30.',
        incorrect: 'Etsi tekstistä sanat “alkuperäinen aika” ja “ehdotettu uusi aika”.',
      },
    },
    {
      id: `${prefix}.status`,
      type: 'inference',
      prompt: 'Onko uusi aika jo lopullisesti vahvistettu?',
      options: [
        { id: `${prefix}.pending`, label: 'Ei. Vahvistus on vielä kesken.' },
        { id: `${prefix}.confirmed`, label: 'Kyllä. 9.30 on jo vahvistettu.' },
        { id: `${prefix}.cancelled`, label: 'Ei. Koko lähtö on peruttu.' },
      ],
      correctOptionId: `${prefix}.pending`,
      feedback: {
        correct: 'Oikein. Sana “vahvistus vielä kesken” kertoo tiedon tilan.',
        incorrect: 'Kiinnitä huomiota tekstin viimeiseen ilmaukseen.',
      },
    },
  ],
};

function missionStep(mission: ProfessionalMission, stage: ProfessionalMissionStep['stage']): ProfessionalMissionStep {
  const step = mission.steps.find((candidate: ProfessionalMissionStep) => candidate.stage === stage);
  if (!step) throw new Error(`MISSION_STEP_MISSING:${mission.missionId}:${stage}`);
  return step;
}

function isMissionProfession(value: ProfessionalProfession): value is MissionRuntimeProfession {
  return value === 'doctor' || value === 'nurse' || value === 'practical_nurse';
}

function missionForProfession(profession?: string): ProfessionalMission[] {
  if (!profession) return [];
  return PROFESSIONAL_MISSIONS.filter((mission: ProfessionalMission) => mission.profession === profession);
}

export function buildProfessionalMissionReadingTask(mission: ProfessionalMission): ReadingTask {
  if (!isMissionProfession(mission.profession)) throw new Error(`UNSUPPORTED_MISSION_PROFESSION:${mission.profession}`);
  const step = missionStep(mission, 'interpret');
  const questionFactory = READING_QUESTIONS[mission.missionId];
  if (!questionFactory) throw new Error(`MISSION_READING_QUESTIONS_MISSING:${mission.missionId}`);
  const prefix = `mission.${mission.missionId}.reading`;
  const task: ReadingTask = {
    taskId: prefix,
    contentVersion: `${mission.contentVersion}.reading-adapter.v1`,
    pathway: 'professional',
    level: 'B1',
    title: step.content.title,
    context: mission.situation,
    readingGoal: step.objective,
    estimatedMinutes: 5,
    profession: mission.profession,
    document: {
      type: 'workplace_procedure',
      title: step.content.title,
      metadata: `${mission.missionId} · ${mission.workDomain}`,
      segments: [
        {
          id: `${prefix}.document`,
          text: step.content.finnish,
          emphasis: 'body',
        },
      ],
    },
    vocabulary: [],
    questions: questionFactory(prefix),
    tags: ['professional-mission', mission.workDomain, mission.missionId],
    provenance: {
      author: 'KieliValmis',
      authoredAt: mission.provenance.authoredOn,
      license: 'KieliValmis-original',
      sourceNote: `Adapted from accepted Agent F mission provenance ${mission.provenance.provenanceId}; mission text is unchanged.`,
    },
  };
  const validation = validateReadingTask(task);
  if (!validation.ok) throw new Error(`INVALID_MISSION_READING_TASK:${mission.missionId}:${validation.errors.join('|')}`);
  return task;
}

function missionWritingChecks(mission: ProfessionalMission): WritingFeedbackCheck[] {
  const correction = missionStep(mission, 'correct');
  const missionTerms: Record<string, string[]> = {
    'nurse-shift-handover': ['vahvist', 'tarkist', 'kellonaika', 'ajankohta'],
    'doctor-follow-up-explanation': ['ajanvaraus', 'yhteyttä', 'vahvistetaan', 'myöhemmin'],
    'practical-nurse-daily-care-update': ['9.00', '9.30', 'vahvist', 'asukas'],
  };
  return [
    {
      id: `${mission.missionId}.communicative-detail`,
      area: 'communicative_goal',
      priority: 1,
      condition: { kind: 'includes_any', alternatives: missionTerms[mission.missionId] ?? ['vahvist', 'tieto'] },
      successMessage: 'Tehtävän olennainen tieto näkyy tekstissäsi.',
      title: 'Tee tiedon tila näkyväksi',
      explanation: correction.content.learnerTask,
      retryInstruction: correction.content.finnish,
    },
    {
      id: `${mission.missionId}.minimum-sentences`,
      area: 'organization',
      priority: 2,
      condition: { kind: 'minimum_sentences', minimum: 2 },
      successMessage: 'Tekstissä on riittävä rakenne lyhyelle työelämän viestille.',
      title: 'Kirjoita vähintään kaksi selkeää virkettä',
      explanation: 'Lyhytkin työelämän viesti tarvitsee tarpeeksi rakennetta, jotta lukija erottaa tilanteen ja seuraavan tiedon.',
      retryInstruction: 'Lisää yksi virke, joka täsmentää vahvistetun tai vielä avoimen tiedon.',
    },
    {
      id: `${mission.missionId}.minimum-words`,
      area: 'content',
      priority: 3,
      condition: { kind: 'minimum_words', minimum: 24 },
      successMessage: 'Tekstissä on riittävästi sisältöä tehtävän tavoitteen välittämiseen.',
      title: 'Täsmennä yhtä olennaista yksityiskohtaa',
      explanation: 'Hyvin lyhyt vastaus voi jättää tiedon tilan tai vastaanottajan epäselväksi.',
      retryInstruction: 'Lisää yksi konkreettinen yksityiskohta tehtävässä annetuista fiktiivisistä tiedoista.',
    },
  ];
}

export function buildProfessionalMissionWritingTask(mission: ProfessionalMission): WritingTask {
  if (!isMissionProfession(mission.profession)) throw new Error(`UNSUPPORTED_MISSION_PROFESSION:${mission.profession}`);
  const step = missionStep(mission, 'document');
  return {
    taskId: `mission.${mission.missionId}.writing`,
    contentVersion: `${mission.contentVersion}.writing-adapter.v1`,
    pathway: 'professional',
    level: 'B1',
    title: step.content.title,
    genre: 'professional_mission_note',
    register: 'professional_neutral',
    audience: mission.audience,
    situation: mission.situation,
    communicativeGoal: mission.communicativeGoal,
    prompt: step.content.finnish,
    estimatedMinutes: 7,
    wordTarget: { min: 24, max: 100 },
    requiredEntitlements: ['professionalAccess', `profession:${mission.profession}`],
    allowedProfessions: [mission.profession],
    topic: mission.missionId,
    scaffolding: {
      showPhraseBank: false,
      planPrompts: [
        {
          id: `${mission.missionId}.facts`,
          prompt: 'Mitkä tehtävässä annetut tiedot ovat varmoja?',
          placeholder: 'Kirjaa vain tehtävässä annetut fiktiiviset tiedot.',
        },
        {
          id: `${mission.missionId}.open`,
          prompt: 'Mikä tieto on vielä avoin tai pitää ilmaista varovasti?',
          placeholder: 'Merkitse tiedon tila selkeästi.',
        },
      ],
      phraseStarters: [],
    },
    feedbackChecks: missionWritingChecks(mission),
    successCopy: 'Viestisi välittää tehtävän olennaisen tiedon ja tiedon tilan selkeästi.',
    developingCopy: 'Viestissä on oikea aihe, mutta yksi olennainen tieto tai sen tila tarvitsee vielä täsmennystä.',
    privacyNotice: 'Käytä vain tämän fiktiivisen harjoituksen tietoja. Älä kirjoita oikeita henkilötietoja tai työpaikan luottamuksellisia tietoja.',
    originalContent: true,
  };
}

export function buildProfessionalMissionRoleplayDescriptor(mission: ProfessionalMission): TaskDescriptor {
  if (!isMissionProfession(mission.profession)) throw new Error(`UNSUPPORTED_MISSION_PROFESSION:${mission.profession}`);
  const original = missionStep(mission, 'produce').task;
  const { featureFlag: _featureFlag, ...task } = original;
  return {
    ...task,
    health: 'available',
    launch: {
      ...task.launch,
      params: {
        ...task.launch.params,
        missionId: mission.missionId,
        contextId: mission.contextId,
        profession: mission.profession,
      },
    },
  };
}

export function getProfessionalMissionReadingTasks(profession?: string): ReadingTask[] {
  return missionForProfession(profession).map(buildProfessionalMissionReadingTask);
}

export function findProfessionalMissionReadingTask(taskId: string | undefined, profession?: string): ReadingTask | undefined {
  if (!taskId) return undefined;
  return getProfessionalMissionReadingTasks(profession).find((task) => task.taskId === taskId);
}

export function getProfessionalMissionWritingTasks(profession?: string): WritingTask[] {
  return missionForProfession(profession).map(buildProfessionalMissionWritingTask);
}

export function findProfessionalMissionWritingTask(taskId: string | null | undefined, profession?: string): WritingTask | undefined {
  if (!taskId) return undefined;
  return getProfessionalMissionWritingTasks(profession).find((task) => task.taskId === taskId);
}

export function getProfessionalMissionRuntimeEntries(profession?: string): ProfessionalMissionRuntimeEntry[] {
  return missionForProfession(profession).flatMap((mission) => {
    const readingTask = buildProfessionalMissionReadingTask(mission);
    const writingTask = buildProfessionalMissionWritingTask(mission);
    return [
      {
        descriptor: buildProfessionalMissionRoleplayDescriptor(mission),
        title: missionStep(mission, 'produce').content.title,
        summary: missionStep(mission, 'produce').content.learnerTask,
        missionId: mission.missionId,
        source: 'professional-mission-roleplay' as const,
      },
      {
        descriptor: {
          ...toReadingTaskDescriptor(readingTask),
          requiredEntitlements: ['professionalAccess', `profession:${mission.profession}`],
          contextId: mission.contextId,
          topic: mission.missionId,
        },
        title: readingTask.title,
        summary: readingTask.readingGoal,
        missionId: mission.missionId,
        source: 'professional-mission-reading' as const,
      },
      {
        descriptor: {
          ...buildWritingTaskDescriptor(writingTask, mission.profession),
          contextId: mission.contextId,
          topic: mission.missionId,
        },
        title: writingTask.title,
        summary: writingTask.communicativeGoal,
        missionId: mission.missionId,
        source: 'professional-mission-writing' as const,
      },
    ];
  });
}
