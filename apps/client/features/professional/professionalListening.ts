import {
  PROFESSIONAL_MISSIONS,
  type ProfessionalMission,
  type ProfessionalProfession,
} from '@core/professional/missions.mjs';

export const PROFESSIONAL_LISTENING_RUNTIME_VERSION = 'professional-listening.2026-09-27.v1' as const;

export type ProfessionalListeningDeliveryMode = 'audio' | 'transcript-fallback';

export type ProfessionalListeningOption = {
  id: string;
  label: string;
};

export type ProfessionalListeningQuestion = {
  id: string;
  prompt: string;
  options: readonly ProfessionalListeningOption[];
  correctOptionId: string;
  feedback: {
    correct: string;
    incorrect: string;
  };
};

export type ProfessionalListeningTask = {
  taskId: string;
  missionId: string;
  contextId: string;
  profession: ProfessionalProfession;
  levelBand: ProfessionalMission['levelBand'];
  title: string;
  situation: string;
  objective: string;
  scriptFi: string;
  questions: readonly [ProfessionalListeningQuestion, ProfessionalListeningQuestion];
  safetyNotice: string;
  authorityBoundary: string;
  originalContent: true;
  contentVersion: string;
};

export type ProfessionalListeningAttempt = {
  questionId: string;
  selectedOptionId: string;
  correct: boolean;
};

export type ProfessionalListeningSession = {
  taskId: string;
  phase: 'listen' | 'question' | 'feedback' | 'complete';
  deliveryMode: ProfessionalListeningDeliveryMode | null;
  listenCount: number;
  transcriptVisible: boolean;
  currentQuestionIndex: number;
  lastAttempt: ProfessionalListeningAttempt | null;
  attempts: readonly ProfessionalListeningAttempt[];
};

export type ProfessionalListeningResult = {
  runtimeVersion: typeof PROFESSIONAL_LISTENING_RUNTIME_VERSION;
  taskId: string;
  missionId: string;
  contextId: string;
  profession: ProfessionalProfession;
  deliveryMode: ProfessionalListeningDeliveryMode;
  audioListeningCompleted: boolean;
  questionCount: 2;
  correctCount: number;
};

const QUESTION_BANK: Readonly<Record<string, readonly [ProfessionalListeningQuestion, ProfessionalListeningQuestion]>> = Object.freeze({
  'nurse-shift-handover': [
    {
      id: 'nurse-shift-handover.uncertain-detail',
      prompt: 'Mikä tieto on viestissä vielä epäselvä?',
      options: [
        { id: 'exact-time', label: 'Tarkka kellonaika' },
        { id: 'room-number', label: 'Huoneen numero' },
        { id: 'patient-report', label: 'Se, että potilas kertoi kivun voimistuneen' },
      ],
      correctOptionId: 'exact-time',
      feedback: {
        correct: 'Oikein. Muistiinpanossa tarkka kellonaika ei ole selvä.',
        incorrect: 'Kuuntele, mikä yksityiskohta pyydetään tarkistamaan ennen seuraavaa merkintää.',
      },
    },
    {
      id: 'nurse-shift-handover.follow-up',
      prompt: 'Mitä kollegalle on pyydetty tekemään?',
      options: [
        { id: 'confirm-detail', label: 'Tarkistamaan epäselvä tieto ennen seuraavaa merkintää' },
        { id: 'change-room', label: 'Vaihtamaan potilaan huone' },
        { id: 'remove-note', label: 'Poistamaan koko yövuoron viesti' },
      ],
      correctOptionId: 'confirm-detail',
      feedback: {
        correct: 'Oikein. Viestissä pyydetään tarkistamaan tieto ennen seuraavaa merkintää.',
        incorrect: 'Keskity viestin viimeiseen virkkeeseen ja siihen, mitä pyydetään tarkistamaan.',
      },
    },
  ],
  'doctor-follow-up-explanation': [
    {
      id: 'doctor-follow-up-explanation.patient-uncertainty',
      prompt: 'Mistä kahdesta asiasta potilas on epävarma?',
      options: [
        { id: 'appointment-and-action', label: 'Saako hän uuden ajan myöhemmin ja pitääkö hänen tehdä nyt itse jotain' },
        { id: 'diagnosis-and-medicine', label: 'Mikä diagnoosi on ja mitä lääkettä pitää ottaa' },
        { id: 'address-and-payment', label: 'Mihin rakennukseen mennään ja paljonko käynti maksaa' },
      ],
      correctOptionId: 'appointment-and-action',
      feedback: {
        correct: 'Oikein. Potilas kysyy sekä uudesta ajasta että omasta mahdollisesta toiminnastaan.',
        incorrect: 'Kuuntele potilaan kaksi kysymystä ennen harjoitustiedon viimeistä virkettä.',
      },
    },
    {
      id: 'doctor-follow-up-explanation.confirmed-fact',
      prompt: 'Mikä hallinnollinen tieto on harjoitustiedossa vahvistettu?',
      options: [
        { id: 'booking-contacts', label: 'Ajanvaraus ottaa yhteyttä myöhemmin' },
        { id: 'exact-time-set', label: 'Uuden ajan tarkka kellonaika on jo sovittu' },
        { id: 'patient-must-call', label: 'Potilaan pitää soittaa itse heti tänään' },
      ],
      correctOptionId: 'booking-contacts',
      feedback: {
        correct: 'Oikein. Ainoa vahvistettu jatkotieto on, että ajanvaraus ottaa yhteyttä myöhemmin.',
        incorrect: 'Erota viestissä varma tieto potilaan vielä avoimista kysymyksistä.',
      },
    },
  ],
  'practical-nurse-daily-care-update': [
    {
      id: 'practical-nurse-daily-care-update.times',
      prompt: 'Mitkä ajat viestissä mainitaan?',
      options: [
        { id: 'nine-nine-thirty', label: 'Alkuperäinen aika 9.00 ja ehdotettu uusi aika noin 9.30' },
        { id: 'eight-nine', label: 'Alkuperäinen aika 8.00 ja uusi aika 9.00' },
        { id: 'nine-ten', label: 'Alkuperäinen aika 9.00 ja uusi aika 10.00' },
      ],
      correctOptionId: 'nine-nine-thirty',
      feedback: {
        correct: 'Oikein. Lähtö oli merkitty yhdeksäksi, ja asukas sanoi olevansa valmis noin puoli kymmeneltä.',
        incorrect: 'Kuuntele alkuperäinen kellonaika ja ilmaus “puoli kymmeneltä”.',
      },
    },
    {
      id: 'practical-nurse-daily-care-update.confirmation',
      prompt: 'Mikä asia pitää vielä varmistaa?',
      options: [
        { id: 'confirm-resident', label: 'Uusi aika pitää vielä varmistaa asukkaan kanssa' },
        { id: 'confirm-original', label: 'Alkuperäinen aika pitää kysyä toiselta osastolta' },
        { id: 'confirm-transport', label: 'Kuljetusyhtiön nimi pitää varmistaa' },
      ],
      correctOptionId: 'confirm-resident',
      feedback: {
        correct: 'Oikein. Uusi aika merkitään, mutta se varmistetaan vielä asukkaan kanssa.',
        incorrect: 'Kuuntele viestin viimeinen osa: kenen kanssa aika vielä varmistetaan?',
      },
    },
  ],
});

function receiveStep(mission: ProfessionalMission) {
  const step = mission.steps.find((candidate) => candidate.stage === 'receive');
  if (!step || step.content.kind !== 'audio-script') {
    throw new Error(`PROFESSIONAL_LISTENING_STEP_MISSING:${mission.missionId}`);
  }
  return step;
}

function buildTask(mission: ProfessionalMission): ProfessionalListeningTask {
  const step = receiveStep(mission);
  const questions = QUESTION_BANK[mission.missionId];
  if (!questions || questions.length !== 2) {
    throw new Error(`PROFESSIONAL_LISTENING_QUESTIONS_MISSING:${mission.missionId}`);
  }
  return {
    taskId: `mission.${mission.missionId}.listening`,
    missionId: mission.missionId,
    contextId: mission.contextId,
    profession: mission.profession,
    levelBand: mission.levelBand,
    title: step.content.title,
    situation: mission.situation,
    objective: step.objective,
    scriptFi: step.content.finnish,
    questions,
    safetyNotice: mission.safetyFrame.notice,
    authorityBoundary: mission.safetyFrame.authorityBoundary,
    originalContent: true,
    contentVersion: mission.contentVersion,
  };
}

export const PROFESSIONAL_LISTENING_TASKS: readonly ProfessionalListeningTask[] = Object.freeze(
  PROFESSIONAL_MISSIONS.map(buildTask),
);

export function getProfessionalMissionListeningTasks(
  profession?: ProfessionalProfession,
): ProfessionalListeningTask[] {
  if (!profession) return [];
  return PROFESSIONAL_LISTENING_TASKS.filter((task) => task.profession === profession);
}

export function findProfessionalMissionListeningTask(
  taskId: string | null | undefined,
  profession?: ProfessionalProfession,
): ProfessionalListeningTask | undefined {
  if (!taskId || !profession) return undefined;
  return PROFESSIONAL_LISTENING_TASKS.find(
    (task) => task.taskId === taskId && task.profession === profession,
  );
}

export function createProfessionalListeningSession(
  task: ProfessionalListeningTask,
): ProfessionalListeningSession {
  return {
    taskId: task.taskId,
    phase: 'listen',
    deliveryMode: null,
    listenCount: 0,
    transcriptVisible: false,
    currentQuestionIndex: 0,
    lastAttempt: null,
    attempts: [],
  };
}

export function markProfessionalAudioCompleted(
  session: ProfessionalListeningSession,
): ProfessionalListeningSession {
  if (session.phase !== 'listen') return session;
  return {
    ...session,
    deliveryMode: session.transcriptVisible ? 'transcript-fallback' : 'audio',
    listenCount: session.listenCount + 1,
  };
}

export function useProfessionalTranscriptFallback(
  session: ProfessionalListeningSession,
): ProfessionalListeningSession {
  if (session.phase !== 'listen') return session;
  return {
    ...session,
    deliveryMode: 'transcript-fallback',
    transcriptVisible: true,
  };
}

export function beginProfessionalListeningQuestions(
  session: ProfessionalListeningSession,
): ProfessionalListeningSession {
  if (session.phase !== 'listen' || !session.deliveryMode) return session;
  return {
    ...session,
    phase: 'question',
    currentQuestionIndex: 0,
    lastAttempt: null,
  };
}

export function submitProfessionalListeningAnswer(
  session: ProfessionalListeningSession,
  task: ProfessionalListeningTask,
  optionId: string,
): ProfessionalListeningSession {
  if (session.phase !== 'question') return session;
  const question = task.questions[session.currentQuestionIndex];
  if (!question || !question.options.some((option) => option.id === optionId)) return session;
  const attempt: ProfessionalListeningAttempt = {
    questionId: question.id,
    selectedOptionId: optionId,
    correct: optionId === question.correctOptionId,
  };
  return {
    ...session,
    phase: 'feedback',
    lastAttempt: attempt,
    attempts: [...session.attempts, attempt],
  };
}

export function continueProfessionalListening(
  session: ProfessionalListeningSession,
  task: ProfessionalListeningTask,
): ProfessionalListeningSession {
  if (session.phase !== 'feedback') return session;
  const nextQuestionIndex = session.currentQuestionIndex + 1;
  if (nextQuestionIndex >= task.questions.length) {
    return {
      ...session,
      phase: 'complete',
      lastAttempt: null,
    };
  }
  return {
    ...session,
    phase: 'question',
    currentQuestionIndex: nextQuestionIndex,
    lastAttempt: null,
  };
}

export function toProfessionalListeningResult(
  session: ProfessionalListeningSession,
  task: ProfessionalListeningTask,
): ProfessionalListeningResult | null {
  if (session.phase !== 'complete' || !session.deliveryMode) return null;
  return {
    runtimeVersion: PROFESSIONAL_LISTENING_RUNTIME_VERSION,
    taskId: task.taskId,
    missionId: task.missionId,
    contextId: task.contextId,
    profession: task.profession,
    deliveryMode: session.deliveryMode,
    audioListeningCompleted: session.deliveryMode === 'audio',
    questionCount: 2,
    correctCount: session.attempts.filter((attempt) => attempt.correct).length,
  };
}
