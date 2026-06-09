import { create } from 'zustand';

export type ReadLanguage = 'auto' | 'en' | 'fi' | 'sv' | 'de' | 'fr' | 'es' | 'other';

export type ReadDocument = {
  id: string;
  title: string;
  language: ReadLanguage;
  detectedLanguageLabel: string;
  sourceText: string;
  generatedText: string;
  createdAtIso: string;
  readingProgress: number;
  playbackSpeed: number;
};

type ReadMobileState = {
  readAutomatically: boolean;
  documents: ReadDocument[];
  activeDocumentId: string | null;
  setReadAutomatically: (enabled: boolean) => void;
  createFromText: (input: { title?: string; text: string; language?: ReadLanguage }) => ReadDocument;
  openDocument: (id: string) => void;
  updateProgress: (id: string, progress: number) => void;
  setPlaybackSpeed: (id: string, speed: number) => void;
};

const LANGUAGE_LABELS: Record<ReadLanguage, string> = {
  auto: 'Auto-detected',
  en: 'English',
  fi: 'Finnish',
  sv: 'Swedish',
  de: 'German',
  fr: 'French',
  es: 'Spanish',
  other: 'Other',
};

function detectLanguage(text: string): ReadLanguage {
  const lower = text.toLowerCase();
  const finnishSignals = [' ja ', ' että ', ' minä ', ' sinä ', ' tämä ', ' koska ', ' suomi', ' hän '];
  const swedishSignals = [' och ', ' att ', ' inte ', ' jag ', ' du ', ' svenska'];
  const spanishSignals = [' el ', ' la ', ' que ', ' una ', ' para ', ' español'];
  const frenchSignals = [' le ', ' la ', ' que ', ' une ', ' pour ', ' français'];
  const germanSignals = [' der ', ' die ', ' und ', ' nicht ', ' ich ', ' deutsch'];

  const score = (signals: string[]) => signals.reduce((total, signal) => total + (lower.includes(signal) ? 1 : 0), 0);
  const candidates: Array<[ReadLanguage, number]> = [
    ['fi', score(finnishSignals)],
    ['sv', score(swedishSignals)],
    ['es', score(spanishSignals)],
    ['fr', score(frenchSignals)],
    ['de', score(germanSignals)],
  ];
  const [best, bestScore] = candidates.sort((a, b) => b[1] - a[1])[0];
  return bestScore > 0 ? best : 'en';
}

function cleanForReading(text: string) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[\t ]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function makeId() {
  return `read-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useReadMobileStore = create<ReadMobileState>((set, get) => ({
  readAutomatically: true,
  documents: [],
  activeDocumentId: null,
  setReadAutomatically: (enabled) => set({ readAutomatically: enabled }),
  createFromText: ({ title, text, language = 'auto' }) => {
    const sourceText = cleanForReading(text);
    const detected = language === 'auto' ? detectLanguage(sourceText) : language;
    const generatedText = sourceText || 'No readable text was found yet.';
    const document: ReadDocument = {
      id: makeId(),
      title: title?.trim() || 'Untitled reading',
      language: detected,
      detectedLanguageLabel: LANGUAGE_LABELS[detected] ?? LANGUAGE_LABELS.other,
      sourceText,
      generatedText,
      createdAtIso: new Date().toISOString(),
      readingProgress: 0,
      playbackSpeed: 1,
    };

    set((state) => ({
      documents: [document, ...state.documents],
      activeDocumentId: document.id,
    }));

    return document;
  },
  openDocument: (id) => set({ activeDocumentId: id }),
  updateProgress: (id, progress) => {
    const safeProgress = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
    set((state) => ({
      documents: state.documents.map((document) =>
        document.id === id ? { ...document, readingProgress: safeProgress } : document,
      ),
    }));
  },
  setPlaybackSpeed: (id, speed) => {
    const safeSpeed = Math.max(0.5, Math.min(2, Number.isFinite(speed) ? speed : 1));
    set((state) => ({
      documents: state.documents.map((document) =>
        document.id === id ? { ...document, playbackSpeed: safeSpeed } : document,
      ),
    }));
  },
}));

export function useActiveReadDocument() {
  return useReadMobileStore((state) => {
    const activeId = state.activeDocumentId;
    return state.documents.find((document) => document.id === activeId) ?? state.documents[0] ?? null;
  });
}
