import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { audioPlayer } from '../services/audioPlayer';
import { saveExamResults, type StoredExamResults, type StoredExamTaskResult } from '../state/examResultsPersistence';
import { getYkiExamSession } from '@core/api/ykiExam';
import { startYkiPracticeSession } from '@core/api/ykiPractice';
import { getStoredExamSessionId } from '../../yki-exam/services/ykiExamService';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import ExamTimer from '../components/ExamTimer';

// ─── Speaking phase constants ─────────────────────────────────────────────────

const SPEAKING_READ_SEC = 10;
const SPEAKING_PREP_SEC = 30;

// ─── Types ────────────────────────────────────────────────────────────────────

type MCQTask = {
  type: 'multiple_choice';
  question: string;
  passage?: string;
  options: string[];
  correct: number;
};

type WritingTask = {
  type: 'writing';
  prompt: string;
  wordTarget?: number;
};

type SpeakingTask = {
  type: 'speaking';
  prompt: string;
  minDurationSec: number;
  maxDurationSec: number;
  // ── Speaking router (#7.4) ──────────────────────────────────────────
  // 'monologue' = record-and-score (existing flow). User reads the prompt,
  //               prepares, records 45-60s, gets STT-based scoring.
  // 'conversation' = should be done with the roleplay engine. Currently
  //               shown as a "Coming soon" surface that explains this is
  //               a conversation task and offers to open the roleplay engine
  //               at the user's level. The full conversational evaluation
  //               with grammar feedback is part of Engine B (Beta), which
  //               is locked at this stage.
  interactionMode?: 'monologue' | 'conversation';
  // Optional: when interactionMode === 'conversation', this names a roleplay
  // scenario to open. If omitted, generic conversation is used.
  conversationScenarioId?: string | null;
};

type ListeningTask = {
  type: 'listening';
  question: string;
  audioText: string;
  audioUrl?: string;
  options: string[];
  correct: number;
};

type SectionTask = MCQTask | WritingTask | SpeakingTask | ListeningTask;

type Section = {
  title: string;
  duration: string;
  instruction: string;
  skill: string;
  tasks: SectionTask[];
};

type RuntimeTask = {
  skill: string;
  task_type: string;
  title: string;
  guidance: string;
  prompt?: string;
  question?: string;
  options?: string[];
  correct_index?: number;
  passage?: string;
  audio_script?: string;
  word_count_target?: number;
};

type RuntimeQuestion = {
  id?: string;
  prompt?: string;
  options?: string[];
  correct_index?: number;
};

type RuntimeEngineItem = {
  item_id?: string;
  index?: number;
  speaking_mode?: string;
  prompt?: {
    audio_url?: string;
    instructions?: string;
    title?: string;
    text?: string;
  };
  recording?: {
    min_duration_sec?: number;
    max_duration_sec?: number;
  };
  questions?: Array<{
    id?: string;
    answer_id?: string;
    index?: number;
    question?: string;
    options?: string[];
    correct_index?: number;
  }>;
};

type RuntimeEngineSection = {
  section_type: string;
  index?: number;
  items?: RuntimeEngineItem[];
};

type RuntimeExamPayload = {
  sections?: RuntimeEngineSection[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSectionsFromTasks(tasks: RuntimeTask[], levelBand: string): Section[] {
  const durationMap: Record<string, string> = {
    'A1-A2': '20',
    'B1-B2': '25',
    'C1-C2': '30',
  };
  const dur = parseInt(durationMap[levelBand] ?? '25', 10);

  // Group all tasks by skill (preserve order within skill)
  const bySkill: Record<string, RuntimeTask[]> = {};
  for (const t of tasks) {
    if (!bySkill[t.skill]) bySkill[t.skill] = [];
    bySkill[t.skill].push(t);
  }

  const sections: Section[] = [];

  const readingTasks = bySkill['reading'] ?? [];
  if (readingTasks.length > 0) {
    sections.push({
      title: 'Reading comprehension',
      duration: `${dur} min`,
      instruction: 'Read each text carefully and choose the best answer.',
      skill: 'reading',
      tasks: readingTasks.map((t) => ({
        type: 'multiple_choice' as const,
        passage: t.passage,
        question: [t.passage, t.question].filter(Boolean).join('\n\n') || t.prompt || t.title,
        options: t.options ?? ['A', 'B', 'C', 'D'],
        correct: t.correct_index ?? 0,
      })),
    });
  }

  const listeningTasks = bySkill['listening'] ?? [];
  if (listeningTasks.length > 0) {
    sections.push({
      title: 'Listening comprehension',
      duration: `${dur - 5} min`,
      instruction: 'Listen to each audio clip and answer the question.',
      skill: 'listening',
      tasks: listeningTasks.map((t) => ({
        type: 'listening' as const,
        question: t.question || t.prompt || t.title,
        audioText: t.audio_script || t.guidance,
        options: t.options ?? ['A', 'B', 'C', 'D'],
        correct: t.correct_index ?? 0,
      })),
    });
  }

  const writingTasks = bySkill['writing'] ?? [];
  if (writingTasks.length > 0) {
    sections.push({
      title: 'Writing tasks',
      duration: `${dur + 10} min`,
      instruction: 'Write your responses in Finnish. Use complete sentences.',
      skill: 'writing',
      tasks: writingTasks.map((t) => ({
        type: 'writing' as const,
        prompt: t.prompt || t.title,
        wordTarget: t.word_count_target,
      })),
    });
  }

  const speakingTasks = bySkill['speaking'] ?? [];
  if (speakingTasks.length > 0) {
    sections.push({
      title: 'Speaking tasks',
      duration: '15 min',
      instruction: 'Read each prompt, prepare for 30 seconds, then speak for 45–60 seconds.',
      skill: 'speaking',
      tasks: speakingTasks.map((t) => ({
        type: 'speaking' as const,
        prompt: t.prompt || t.title,
        minDurationSec: 30,
        maxDurationSec: 60,
        interactionMode: (t.interaction_mode === 'conversation' ? 'conversation' : 'monologue') as 'monologue' | 'conversation',
        conversationScenarioId: t.conversation_scenario_id ?? null,
      })),
    });
  }

  return sections;
}

function buildSectionsFromRuntimeExam(runtime: RuntimeExamPayload, levelBand: string): Section[] {
  const durationMap: Record<string, string> = {
    'A1-A2': '20',
    'B1-B2': '25',
    'C1-C2': '30',
  };
  const dur = parseInt(durationMap[levelBand] ?? '25', 10);
  const sections: Section[] = [];

  // Index engine sections by section_type
  const byType: Record<string, RuntimeEngineItem[]> = {};
  for (const sec of runtime.sections ?? []) {
    if (sec.section_type && Array.isArray(sec.items)) {
      byType[sec.section_type] = sec.items;
    }
  }

  const readingItems = byType['reading'] ?? [];
  if (readingItems.length > 0) {
    sections.push({
      title: 'Reading comprehension',
      duration: `${dur} min`,
      instruction: 'Read each text carefully and choose the best answer.',
      skill: 'reading',
      tasks: readingItems.flatMap((item) =>
        (item.questions ?? []).map((q) => ({
          type: 'multiple_choice' as const,
          passage: item.prompt?.text,
          question: q.question || item.prompt?.title || 'Read and answer.',
          options: q.options ?? ['A', 'B', 'C', 'D'],
          correct: q.correct_index ?? 0,
        })),
      ),
    });
  }

  const listeningItems = byType['listening'] ?? [];
  if (listeningItems.length > 0) {
    sections.push({
      title: 'Listening comprehension',
      duration: `${dur - 5} min`,
      instruction: 'Listen to each audio clip and answer the question.',
      skill: 'listening',
      tasks: listeningItems.flatMap((item) => {
        const audioUrl = item.prompt?.audio_url || undefined;
        const audioText = item.prompt?.instructions || '';
        return (item.questions ?? []).map((q) => ({
          type: 'listening' as const,
          question: q.question || item.prompt?.instructions || 'Listen and answer.',
          audioUrl,
          audioText,
          options: q.options ?? ['A', 'B', 'C', 'D'],
          correct: q.correct_index ?? 0,
        }));
      }),
    });
  }

  const writingItems = byType['writing'] ?? [];
  if (writingItems.length > 0) {
    sections.push({
      title: 'Writing tasks',
      duration: `${dur + 10} min`,
      instruction: 'Write your responses in Finnish. Use complete sentences.',
      skill: 'writing',
      tasks: writingItems.map((item) => ({
        type: 'writing' as const,
        prompt: item.prompt?.instructions || 'Write your response.',
      })),
    });
  }

  const speakingItems = byType['speaking'] ?? [];
  if (speakingItems.length > 0) {
    sections.push({
      title: 'Speaking tasks',
      duration: '15 min',
      instruction: 'Read each prompt, prepare for 30 seconds, then speak.',
      skill: 'speaking',
      tasks: speakingItems.map((item) => ({
        type: 'speaking' as const,
        prompt: item.prompt?.instructions || 'Prepare and speak.',
        minDurationSec: item.recording?.min_duration_sec ?? 30,
        maxDurationSec: item.recording?.max_duration_sec ?? 60,
      })),
    });
  }

  return sections;
}

// ─── B1-B2 fallback sections (shown when backend unreachable) ─────────────────

const FALLBACK_SECTIONS: Section[] = [
  {
    title: 'Reading comprehension',
    duration: '25 min',
    instruction: 'Read each text carefully and choose the best answer.',
    skill: 'reading',
    tasks: [
      {
        type: 'multiple_choice',
        passage:
          'Etätyö on muuttanut suomalaista työelämää merkittävästi viime vuosina. Monet työnantajat ' +
          'sallivat nyt henkilöstön tehdä osan työviikoistaan kotoa käsin. Joustavuus on lisääntynyt, ' +
          'mutta samalla rajat työn ja vapaa-ajan välillä ovat hämärtyneet.\n\n' +
          'Tutkimusten mukaan etätyö lisää tuottavuutta niillä työntekijöillä, jotka voivat järjestää ' +
          'rauhallisen työtilan kotiin. Sen sijaan perheen kanssa ahtaissa oloissa asuvat kokevat usein ' +
          'etätyön raskaammaksi kuin toimistossa työskentelyn.',
        question: 'Miksi etätyö voi olla haastavampaa joillekin työntekijöille?',
        options: [
          'Koska kotona ei ole riittävästi teknologiaa',
          'Koska ahtaat asuinolosuhteet voivat tehdä etätyöstä raskaampaa',
          'Koska etätyö on aina vähemmän tuottavaa kuin toimistotyö',
          'Koska työnantajat eivät luota etätyöntekijöihin',
        ],
        correct: 1,
      },
      {
        type: 'multiple_choice',
        passage:
          'Suomen terveydenhuoltojärjestelmä perustuu universaaliin hoitovelvollisuuteen: jokainen ' +
          'Suomessa asuva on oikeutettu terveydenhoitopalveluihin asuinpaikastaan riippumatta. ' +
          'Viime vuosina yksityisten terveyspalvelujen käyttö on kasvanut huomattavasti. ' +
          'Syynä on usein julkisen sektorin pitkät jonotusajat erikoissairaanhoitoon. ' +
          'Maksukykyisillä on mahdollisuus ohittaa jonot yksityisellä vastaanotolla, ' +
          'mikä herättää kysymyksiä tasa-arvosta.',
        question: 'Mitä artikkeli sanoo yksityisten terveyspalvelujen lisääntymisestä?',
        options: [
          'Se on parantanut kaikkien suomalaisten pääsyä hoitoon tasapuolisesti',
          'Se herättää kysymyksiä yhdenvertaisuudesta, koska hoitoon pääsy riippuu maksukyvystä',
          'Se on korvannut kokonaan julkisen terveydenhuollon',
          'Se on vähentänyt digitaalisten palvelujen tarvetta',
        ],
        correct: 1,
      },
    ],
  },
  {
    title: 'Listening comprehension',
    duration: '20 min',
    instruction: 'Listen to each audio clip and answer the question.',
    skill: 'listening',
    tasks: [
      {
        type: 'listening',
        question: 'Mitä neuvoa haastateltava antaa työnhakijoille?',
        audioText:
          'Minulta kysytään usein, miten saada ensimmäinen työpaikka Suomessa. ' +
          'Tärkein neuvo on verkostoituminen — sekä opiskeluaikana että alan tapahtumissa. ' +
          'Suomalaiset rekrytoijat arvostavat oma-aloitteisuutta. ' +
          'On parempi ottaa yhteyttä suoraan kuin odottaa avointa hakua.',
        options: [
          'Lähettää mahdollisimman monta hakemusta',
          'Verkostoitua opiskeluaikana ja alan tapahtumissa',
          'Hankkia kansainvälistä työkokemusta ulkomailla',
          'Odottaa sopivia avoimia paikkoja',
        ],
        correct: 1,
      },
      {
        type: 'listening',
        question: 'Mitä tarkoitetaan eksekutiivisella funktiolla tässä yhteydessä?',
        audioText:
          'Tänään käsittelemme kaksikielisyyden etuja kognitiivisen kehityksen näkökulmasta. ' +
          'Tutkimusten mukaan kaksi kieltä puhuvilla lapsilla on parempi kyky vaihtaa ' +
          'tehtävien välillä ja kontrolloida huomiotaan — tätä kutsutaan eksekutiiviseksi funktioksi.',
        options: [
          'Kykyä puhua kahta kieltä samanaikaisesti',
          'Kykyä vaihtaa tehtävien välillä ja hallita huomiota',
          'Laajaa sanavarastoa molemmissa kielissä',
          'Pitkäkestoista muistia',
        ],
        correct: 1,
      },
    ],
  },
  {
    title: 'Writing tasks',
    duration: '35 min',
    instruction: 'Write your response in Finnish. Use complete sentences.',
    skill: 'writing',
    tasks: [
      {
        type: 'writing',
        prompt:
          'Jotkut ihmiset ajattelevat, että älypuhelimet ovat tehneet sosiaalisesta elämästä köyhempää, ' +
          'koska ihmiset katsovat puhelimiaan seurueessa ollessaan. Toiset taas ajattelevat, että ' +
          'älypuhelimet ovat parantaneet yhteydenpitoa.\n\n' +
          'Kirjoita 80–120 sanaa. Esitä oma mielipiteesi ja perustele se kahdella argumentilla.',
        wordTarget: 100,
      },
      {
        type: 'writing',
        prompt:
          'Olet tilannut verkkokaupasta tuotteen, joka on tullut rikki. ' +
          'Kirjoita reklamaatioviesti verkkokaupan asiakaspalveluun (80–110 sanaa). ' +
          'Mainitse tilausnumero (esim. TK-20481), kuvaa ongelma ja kerro, mitä toivot ratkaisuksi.',
        wordTarget: 95,
      },
    ],
  },
  {
    title: 'Speaking tasks',
    duration: '15 min',
    instruction: 'Read the prompt, prepare for 30 seconds, then speak for 45–60 seconds.',
    skill: 'speaking',
    tasks: [
      {
        type: 'speaking' as const,
        prompt:
          'Soitat palvelutoimistoon varataksesi ajan. Sinun täytyy selittää syy käyntiisi, ' +
          'ehdottaa sopivaa aikaa ja vahvistaa varaus. Käytä kohteliasta kieltä.',
        minDurationSec: 30,
        maxDurationSec: 60,
      },
      {
        type: 'speaking' as const,
        prompt:
          'Kerro suomalaisesta ruokakulttuurista. Puhu ainakin kahdesta suomalaisesta ruoasta ' +
          'ja sano, pidätkö niistä vai et. Perustele mielipiteesi.',
        minDurationSec: 30,
        maxDurationSec: 60,
      },
    ],
  },
];

// ─── Per-task state ───────────────────────────────────────────────────────────

type SpeakingPhase = 'reading' | 'prep' | 'recording' | 'done';

type TaskState = {
  selectedOption: number | null;
  writingAnswer: string;
  audioPlaying: boolean;
  audioUnavailable: boolean;
  speakingPhase: SpeakingPhase;
  speakingCountdown: number;
  speakingElapsed: number;
  speakingRecordedUri: string | null;
};

function defaultTaskState(): TaskState {
  return {
    selectedOption: null,
    writingAnswer: '',
    audioPlaying: false,
    audioUnavailable: false,
    speakingPhase: 'reading',
    speakingCountdown: SPEAKING_READ_SEC,
    speakingElapsed: 0,
    speakingRecordedUri: null,
  };
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ExamRuntimeScreen() {
  const [started, setStarted] = useState(false);
  const [sections, setSections] = useState<Section[]>(FALLBACK_SECTIONS);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [levelBand, setLevelBand] = useState('B1-B2');
  const [sectionIndex, setSectionIndex] = useState(0);
  const recorder = useAudioRecorder();
  const [taskIndexInSection, setTaskIndexInSection] = useState(0);
  const [taskState, setTaskState] = useState<TaskState>(defaultTaskState());
  const [results, setResults] = useState<StoredExamTaskResult[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const storedBand = await AsyncStorage.getItem('floently:yki_exam_level_band') ?? 'B1-B2';
        if (!cancelled) setLevelBand(storedBand);

        const sessionId = await getStoredExamSessionId();
        if (sessionId) {
          try {
            const payload = await getYkiExamSession<{ runtime?: RuntimeExamPayload }>(sessionId);
            const runtime = payload.runtime;
            if (!cancelled && Array.isArray(runtime?.sections) && runtime.sections.length > 0) {
              const nextSections = buildSectionsFromRuntimeExam(runtime, storedBand);
              if (nextSections.length > 0) {
                setSections(nextSections);
                return;
              }
            }
          } catch {
            // fall back to guided practice tasks below
          }
        }

        const practiceSession = await startYkiPracticeSession(storedBand, 'mixed');
        const tasks = practiceSession.tasks ?? [];
        if (!cancelled && tasks.length > 0) {
          setSections(buildSectionsFromTasks(tasks, storedBand));
        }
      } catch {
        // keep fallback sections
      } finally {
        if (!cancelled) setLoadingTasks(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const section = sections[sectionIndex];
  const task = section?.tasks[taskIndexInSection];
  const totalTasksInSection = section?.tasks.length ?? 1;

  // ─── Speaking: start recording when phase enters 'recording' ───────────────
  useEffect(() => {
    if (task?.type !== 'speaking' || taskState.speakingPhase !== 'recording') return;
    void recorder.start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.type, taskState.speakingPhase]);

  // ─── Speaking: countdown timer ─────────────────────────────────────────────
  useEffect(() => {
    if (task?.type !== 'speaking') return;
    const phase = taskState.speakingPhase;
    if (phase === 'done') return;

    const maxRec = task.type === 'speaking' ? task.maxDurationSec : 60;

    const timer = setInterval(() => {
      setTaskState((s) => {
        if (s.speakingPhase !== phase) return s; // phase already changed
        const nextCountdown = s.speakingCountdown - 1;

        if (phase === 'recording') {
          const nextElapsed = s.speakingElapsed + 1;
          if (nextCountdown <= 0) {
            // Time's up — stop recording async, transition to done
            void recorder.stop().then((uri) => {
              if (uri) setTaskState((prev) => ({ ...prev, speakingRecordedUri: uri }));
            });
            return { ...s, speakingPhase: 'done', speakingCountdown: 0, speakingElapsed: nextElapsed };
          }
          return { ...s, speakingCountdown: nextCountdown, speakingElapsed: nextElapsed };
        }

        if (nextCountdown <= 0) {
          if (phase === 'reading') return { ...s, speakingPhase: 'prep', speakingCountdown: SPEAKING_PREP_SEC };
          // prep → recording
          return { ...s, speakingPhase: 'recording', speakingCountdown: maxRec, speakingElapsed: 0 };
        }
        return { ...s, speakingCountdown: nextCountdown };
      });
    }, 1000);

    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task, taskState.speakingPhase]);

  const isLastTaskInSection = taskIndexInSection >= totalTasksInSection - 1;
  const isLastSection = sectionIndex >= sections.length - 1;

  const totalTasks = sections.reduce((sum, s) => sum + s.tasks.length, 0);
  const completedTasks = sections
    .slice(0, sectionIndex)
    .reduce((sum, s) => sum + s.tasks.length, 0) + taskIndexInSection;

  async function finishExam(finalResults: StoredExamTaskResult[]) {
    const completedAt = new Date().toISOString();
    const objectiveResults = finalResults.filter((item) => typeof item.correctOption === 'number');
    const objectiveCorrect = objectiveResults.filter((item) => item.selectedOption === item.correctOption).length;
    const sectionBreakdown = sections.map((section) => {
      const sectionTasks = finalResults.filter((item) => item.sectionTitle === section.title);
      const objectiveSectionTasks = sectionTasks.filter((item) => typeof item.correctOption === 'number');
      return {
        sectionTitle: section.title,
        totalTasks: sectionTasks.length,
        objectiveTasks: objectiveSectionTasks.length,
        objectiveCorrect: objectiveSectionTasks.filter((item) => item.selectedOption === item.correctOption).length,
      };
    });

    const payload: StoredExamResults = {
      completedAt,
      levelBand,
      totalTasks,
      objectiveTasks: objectiveResults.length,
      objectiveCorrect,
      objectiveIncorrect: objectiveResults.length - objectiveCorrect,
      sectionBreakdown,
      tasks: finalResults,
    };
    await saveExamResults(payload);
    router.push('/yki-exam/results' as never);
  }

  async function advanceTask() {
    if (!task || !section) return;
    const nextResult: StoredExamTaskResult = {
      sectionTitle: section.title,
      taskType: task.type,
      prompt: task.type === 'writing' || task.type === 'speaking' ? task.prompt : task.question,
      selectedOption: task.type === 'multiple_choice' || task.type === 'listening' ? taskState.selectedOption : null,
      correctOption: task.type === 'multiple_choice' || task.type === 'listening' ? task.correct : null,
      options: task.type === 'multiple_choice' || task.type === 'listening' ? task.options : undefined,
      writingAnswer: task.type === 'writing' || task.type === 'speaking' ? taskState.writingAnswer : undefined,
    };
    const finalResults = [...results, nextResult];
    setResults(finalResults);
    setTaskState(defaultTaskState());
    if (!isLastTaskInSection) {
      setTaskIndexInSection((i) => i + 1);
    } else if (!isLastSection) {
      setSectionIndex((i) => i + 1);
      setTaskIndexInSection(0);
    } else {
      await finishExam(finalResults);
    }
  }

  const isObjectiveTask = task?.type === 'multiple_choice' || task?.type === 'listening';
  const isSpeakingTask = task?.type === 'speaking';
  const isConversationSpeaking = task?.type === 'speaking' && task.interactionMode === 'conversation';
  const canAdvance =
    (!isObjectiveTask || taskState.selectedOption !== null) &&
    // Speaking router (#7.4): conversation tasks have no recording flow,
    // so they're always advanceable.
    (!isSpeakingTask || isConversationSpeaking || taskState.speakingPhase === 'done');

  if (!started) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.backBar}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>YKI {levelBand} exam</Text>
          <Text style={styles.subtitle}>
            Practice exam with real-format questions at {levelBand} level. Work through each section in order.
          </Text>
          {loadingTasks ? (
            <ActivityIndicator color="#2453D4" style={{ marginVertical: 16 }} />
          ) : (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Exam sections</Text>
              {sections.map((s, i) => (
                <View key={i} style={styles.sectionRow}>
                  <Text style={styles.sectionNumber}>{i + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionName}>{s.title}</Text>
                    <Text style={styles.sectionDur}>{s.duration} · {s.tasks.length} {s.tasks.length === 1 ? 'task' : 'tasks'}</Text>
                  </View>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalText}>
                  {totalTasks} tasks total · approx. {sections.reduce((sum, s) => sum + parseInt(s.duration, 10), 0)} min
                </Text>
              </View>
            </View>
          )}
          <Pressable
            onPress={() => setStarted(true)}
            disabled={loadingTasks}
            style={[styles.primaryButton, loadingTasks && { opacity: 0.5 }]}
          >
            <Text style={styles.primaryButtonText}>Start YKI exam</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
        <View style={styles.progressRow}>
          {sections.map((s, si) =>
            s.tasks.map((_, ti) => {
              const isPast = si < sectionIndex || (si === sectionIndex && ti < taskIndexInSection);
              const isActive = si === sectionIndex && ti === taskIndexInSection;
              return (
                <View
                  key={`${si}-${ti}`}
                  style={[
                    styles.progressDot,
                    isActive && styles.progressDotActive,
                    isPast && styles.progressDotDone,
                  ]}
                />
              );
            })
          )}
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>
            {section.title} · Task {taskIndexInSection + 1} of {totalTasksInSection}
          </Text>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionDuration}>{section.duration}</Text>
        </View>
        <Text style={styles.instruction}>{section.instruction}</Text>

        {/* Multiple choice (reading) */}
        {task?.type === 'multiple_choice' && (() => {
          const t = task;
          return (
            <View style={styles.taskCard}>
              {t.passage ? (
                <View style={styles.passageBox}>
                  <Text style={styles.passageLabel}>Teksti</Text>
                  <Text style={styles.passageText}>{t.passage}</Text>
                </View>
              ) : null}
              <Text style={styles.questionText}>{t.question}</Text>
              <View style={styles.optionList}>
                {t.options.map((opt, i) => {
                  const isSelected = taskState.selectedOption === i;
                  return (
                    <Pressable
                      key={i}
                      onPress={() => setTaskState((s) => ({ ...s, selectedOption: i }))}
                      style={[styles.option, isSelected && styles.optionSelected]}
                    >
                      <Text style={styles.optionText}>
                        {String.fromCharCode(65 + i)}. {opt}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })()}

        {/* Listening */}
        {task?.type === 'listening' && (() => {
          const t = task;
          return (
            <View style={styles.taskCard}>
              <Text style={styles.questionText}>{t.question}</Text>

              <Pressable
                onPress={() => {
                  if (taskState.audioPlaying) return;
                  setTaskState((s) => ({ ...s, audioPlaying: true, audioUnavailable: false }));
                  if (t.audioUrl) {
                    void audioPlayer.playAsync(t.audioUrl, {
                      onStart: () => setTaskState((s) => ({ ...s, audioPlaying: true })),
                      onEnd: () => setTaskState((s) => ({ ...s, audioPlaying: false })),
                      onFail: () => setTaskState((s) => ({ ...s, audioPlaying: false, audioUnavailable: true })),
                    }).catch(() => {
                      setTaskState((s) => ({ ...s, audioPlaying: false, audioUnavailable: true }));
                    });
                    return;
                  }
                  void audioPlayer.playTextAsync(t.audioText, {
                    onStart: () => setTaskState((s) => ({ ...s, audioPlaying: true })),
                    onEnd: () => setTaskState((s) => ({ ...s, audioPlaying: false })),
                    onFail: () => setTaskState((s) => ({ ...s, audioPlaying: false, audioUnavailable: true })),
                  });
                }}
                style={[styles.playButton, taskState.audioPlaying && styles.playButtonActive]}
              >
                <Text style={styles.playButtonText}>
                  {taskState.audioPlaying ? '▶ Playing…' : '▶ Play audio'}
                </Text>
              </Pressable>

              {taskState.audioUnavailable ? (
                <View style={styles.audioTranscriptBox}>
                  <Text style={styles.audioTranscriptLabel}>Audio transcript</Text>
                  <Text style={styles.audioTranscriptText}>{t.audioText}</Text>
                </View>
              ) : null}

              <View style={styles.optionList}>
                {t.options.map((opt, i) => {
                  const isSelected = taskState.selectedOption === i;
                  return (
                    <Pressable
                      key={i}
                      onPress={() => setTaskState((s) => ({ ...s, selectedOption: i }))}
                      style={[styles.option, isSelected && styles.optionSelected]}
                    >
                      <Text style={styles.optionText}>
                        {String.fromCharCode(65 + i)}. {opt}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })()}

        {/* Writing */}
        {task?.type === 'writing' && (
          <View style={styles.taskCard}>
            <Text style={styles.questionText}>{task.prompt}</Text>
            <TextInput
              multiline
              style={styles.writingInput}
              placeholder="Kirjoita vastauksesi tähän..."
              placeholderTextColor="#9CA3AF"
              value={taskState.writingAnswer}
              onChangeText={(v) => setTaskState((s) => ({ ...s, writingAnswer: v }))}
              textAlignVertical="top"
            />
            <Text style={styles.wordCount}>
              {taskState.writingAnswer.trim().split(/\s+/).filter(Boolean).length}
              {task.wordTarget ? ` / ${task.wordTarget}` : ''} words
            </Text>
          </View>
        )}

        {/* Speaking */}
        {task?.type === 'speaking' && (() => {
          const t = task;

          // ── Speaking router (#7.4) ───────────────────────────────────
          // If this task is flagged as a conversation task (rather than a
          // monologue), the recording flow doesn't fit. The right behavior
          // is a back-and-forth dialogue with the AI, evaluated at each turn.
          // That requires the conversational evaluation engine (Engine B,
          // Beta), which is locked at this stage. Surface a clear
          // explanation rather than dropping the user into a monologue
          // recording that doesn't match the task intent.
          if (t.interactionMode === 'conversation') {
            return (
              <View style={styles.taskCard}>
                <Text style={styles.questionText}>{t.prompt}</Text>
                <View style={[styles.speakingPhaseBox, styles.betaLockedBox]}>
                  <Text style={styles.betaLockedTitle}>Conversation task — Beta · Coming soon</Text>
                  <Text style={styles.betaLockedBody}>
                    This is a conversation task. Doing it justice requires the
                    AI to listen to what you say, follow up, and give you
                    grammar feedback per turn. That capability is in our
                    context-aware Beta engine — currently in development and
                    not yet open to general practice.{'\n\n'}
                    For now: read the prompt, plan what you'd say in Finnish,
                    and tap Skip to continue. When the Beta engine launches,
                    these tasks will open the conversational practice surface
                    automatically.
                  </Text>
                </View>
              </View>
            );
          }

          const phase = taskState.speakingPhase;
          const countdown = taskState.speakingCountdown;
          const elapsed = taskState.speakingElapsed;
          const canStopEarly = elapsed >= t.minDurationSec;

          return (
            <View style={styles.taskCard}>
              {/* Prompt — full opacity during reading, dimmed otherwise */}
              <Text style={[styles.questionText, phase !== 'reading' && { opacity: phase === 'recording' ? 0.35 : 0.6 }]}>
                {t.prompt}
              </Text>

              {/* Reading phase */}
              {phase === 'reading' && (
                <View style={styles.speakingPhaseBox}>
                  <Text style={styles.speakingPhaseLabel}>Read the prompt</Text>
                  <View style={styles.speakingTimerRow}>
                    <ExamTimer seconds={countdown} />
                  </View>
                </View>
              )}

              {/* Prep phase */}
              {phase === 'prep' && (
                <View style={styles.speakingPhaseBox}>
                  <Text style={styles.speakingPhaseLabel}>Prepare to speak…</Text>
                  <View style={styles.speakingTimerRow}>
                    <ExamTimer seconds={countdown} />
                  </View>
                </View>
              )}

              {/* Recording phase */}
              {phase === 'recording' && (
                <View style={styles.speakingPhaseBox}>
                  <View style={styles.recRow}>
                    <View style={styles.recDot} />
                    <Text style={styles.recLabel}>REC  {elapsed}s</Text>
                  </View>
                  <Text style={styles.speakingTimerHint}>Time remaining</Text>
                  <View style={styles.speakingTimerRow}>
                    <ExamTimer seconds={countdown} />
                  </View>
                  <Pressable
                    onPress={() => {
                      void recorder.stop().then((uri) => {
                        setTaskState((s) => ({
                          ...s,
                          speakingPhase: 'done',
                          speakingRecordedUri: uri ?? null,
                        }));
                      });
                    }}
                    disabled={!canStopEarly}
                    style={[styles.stopRecordingButton, !canStopEarly && styles.stopRecordingButtonDisabled]}
                  >
                    <Text style={styles.stopRecordingButtonText}>Stop recording</Text>
                  </Pressable>
                  {!canStopEarly && (
                    <Text style={styles.speakingMinHint}>
                      Speak for at least {t.minDurationSec}s before stopping
                    </Text>
                  )}
                </View>
              )}

              {/* Done phase */}
              {phase === 'done' && (
                <View style={styles.speakingPhaseBox}>
                  <Text style={styles.speakingDoneText}>Recording complete</Text>
                  <Text style={styles.speakingDoneSubtext}>Recorded: {elapsed}s</Text>
                </View>
              )}
            </View>
          );
        })()}

        <Pressable
          onPress={() => void advanceTask()}
          style={[styles.nextButton, !canAdvance && styles.nextButtonDisabled]}
          disabled={!canAdvance}
        >
          <Text style={styles.nextButtonText}>
            {!isLastTaskInSection
              ? 'Next question'
              : isLastSection
              ? 'Submit exam'
              : 'Complete section and continue'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FBFF' },
  backBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#F8FBFF', gap: 12 },
  backButton: { minHeight: 36, borderRadius: 999, paddingHorizontal: 14, justifyContent: 'center', backgroundColor: '#E8F0FF' },
  backButtonText: { fontSize: 13, fontWeight: '700', color: '#2453D4' },
  progressRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, flex: 1, justifyContent: 'flex-end' },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#D8E3F2' },
  progressDotActive: { backgroundColor: '#2453D4' },
  progressDotDone: { backgroundColor: '#4E8F6A' },
  container: { padding: 20, gap: 14, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 14, lineHeight: 21, color: '#4B5563' },
  infoCard: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#D8E3F2', padding: 16, gap: 10 },
  infoTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 4 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionNumber: { fontSize: 13, fontWeight: '800', color: '#2453D4', width: 20 },
  sectionName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  sectionDur: { fontSize: 12, color: '#6B7280' },
  totalRow: { marginTop: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E5ECF8' },
  totalText: { fontSize: 12, color: '#6B7280', textAlign: 'center' },
  primaryButton: { alignSelf: 'flex-start', minHeight: 46, borderRadius: 999, paddingHorizontal: 22, justifyContent: 'center', backgroundColor: '#2453D4' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  sectionHeader: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#D8E3F2', padding: 16, gap: 4 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#2453D4', textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  sectionDuration: { fontSize: 12, color: '#6B7280' },
  instruction: { fontSize: 14, lineHeight: 21, color: '#4B5563', fontStyle: 'italic' },
  taskCard: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#D8E3F2', padding: 16, gap: 12 },
  passageBox: { backgroundColor: '#F4F8FF', borderRadius: 12, padding: 14, gap: 6, borderLeftWidth: 3, borderLeftColor: '#2453D4' },
  passageLabel: { fontSize: 10, fontWeight: '800', color: '#2453D4', textTransform: 'uppercase', letterSpacing: 0.8 },
  passageText: { fontSize: 14, lineHeight: 22, color: '#1E2D3D' },
  questionText: { fontSize: 15, lineHeight: 23, color: '#111827', fontWeight: '600' },
  playButton: { alignSelf: 'flex-start', minHeight: 40, borderRadius: 999, paddingHorizontal: 18, justifyContent: 'center', backgroundColor: '#2453D4' },
  playButtonActive: { backgroundColor: '#4E8F6A' },
  playButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  audioTranscriptBox: { backgroundColor: '#F0F4FF', borderRadius: 12, padding: 12, gap: 4 },
  audioTranscriptLabel: { fontSize: 11, fontWeight: '800', color: '#2453D4', textTransform: 'uppercase' },
  audioTranscriptText: { fontSize: 13, lineHeight: 20, color: '#374151', fontStyle: 'italic' },
  optionList: { gap: 8 },
  option: { minHeight: 44, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#D8E3F2', backgroundColor: '#F8FBFF', justifyContent: 'center' },
  optionSelected: { borderColor: '#2453D4', backgroundColor: '#EEF3FF' },
  optionCorrect: { borderColor: '#4E8F6A', backgroundColor: '#F0FFF4' },
  optionWrong: { borderColor: '#D64545', backgroundColor: '#FFF5F5' },
  optionText: { fontSize: 14, color: '#111827' },
  optionTextBold: { fontWeight: '700' },
  checkButton: { alignSelf: 'flex-start', minHeight: 38, borderRadius: 999, paddingHorizontal: 16, justifyContent: 'center', backgroundColor: '#2453D4' },
  checkButtonDisabled: { opacity: 0.4 },
  checkButtonText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  feedbackBox: { borderRadius: 12, padding: 12 },
  feedbackCorrect: { backgroundColor: '#F0FFF4' },
  feedbackWrong: { backgroundColor: '#FFF5F5' },
  feedbackText: { fontSize: 14, fontWeight: '700', color: '#111827' },
  writingInput: { borderWidth: 1, borderColor: '#D8E3F2', borderRadius: 12, padding: 12, minHeight: 160, color: '#111827', fontSize: 15, lineHeight: 22, backgroundColor: '#FAFCFF' },
  wordCount: { fontSize: 11, color: '#9CA3AF', textAlign: 'right' },
  speakingHint: { backgroundColor: '#F0F4FF', borderRadius: 12, padding: 12 },
  speakingHintText: { fontSize: 13, lineHeight: 20, color: '#4B5573' },
  speakingPhaseBox: { marginTop: 20, backgroundColor: '#F0F4FF', borderRadius: 12, padding: 16, alignItems: 'center', gap: 10 },
  // ── Speaking router (#7.4): conversation-task locked surface ──
  betaLockedBox: {
    marginTop: 16,
    backgroundColor: '#F4F8FF',
    borderRadius: 14,
    padding: 18,
    alignItems: 'flex-start',
    gap: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#1F47E8',
  },
  betaLockedTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1F47E8',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  betaLockedBody: {
    fontSize: 13,
    lineHeight: 20,
    color: '#1E2D3D',
  },
  speakingPhaseLabel: { fontSize: 15, fontWeight: '600', color: '#374151' },
  speakingTimerRow: { alignItems: 'center' },
  speakingTimerHint: { fontSize: 12, color: '#6B7280' },
  recRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' },
  recLabel: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
  stopRecordingButton: { marginTop: 8, backgroundColor: '#EF4444', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 28 },
  stopRecordingButtonDisabled: { backgroundColor: '#D1D5DB' },
  stopRecordingButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  speakingMinHint: { fontSize: 12, color: '#9CA3AF', textAlign: 'center' },
  speakingDoneText: { fontSize: 16, fontWeight: '700', color: '#10B981' },
  speakingDoneSubtext: { fontSize: 13, color: '#6B7280' },
  nextButton: { minHeight: 46, borderRadius: 999, paddingHorizontal: 22, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2453D4' },
  nextButtonDisabled: { opacity: 0.4 },
  nextButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
