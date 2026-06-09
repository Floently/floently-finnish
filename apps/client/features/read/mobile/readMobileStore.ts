import { create } from 'zustand';

import { readRenderApi, type ReadRenderDocument } from './readRenderApi';

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
  syncStatus: 'idle' | 'loading' | 'syncing' | 'offline' | 'error';
  syncError: string | null;
  refreshLibrary: () => Promise<void>;
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

function normalizeReadLanguage(value: unknown): ReadLanguage {
  const normalized = String(value || 'auto').trim().toLowerCase();
  if (
    normalized === 'auto' ||
    normalized === 'en' ||
    normalized === 'fi' ||
    normalized === 'sv' ||
    normalized === 'de' ||
    normalized === 'fr' ||
    normalized === 'es'
  ) {
    return normalized;
  }
  return 'other';
}

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

function progressToRatio(value: unknown): number {
  const numberValue = Number(value ?? 0);
  if (!Number.isFinite(numberValue)) return 0;
  if (numberValue > 1) return Math.max(0, Math.min(1, numberValue / 100));
  return Math.max(0, Math.min(1, numberValue));
}

function toLocalDocument(remote: ReadRenderDocument): ReadDocument {
  const language = normalizeReadLanguage(remote.language);
  const sourceText = cleanForReading(String(remote.text ?? remote.content ?? ''));
  return {
    id: String(remote.id || makeId()),
    title: String(remote.title || 'Untitled reading'),
    language,
    detectedLanguageLabel: LANGUAGE_LABELS[language] ?? LANGUAGE_LABELS.other,
    sourceText,
    generatedText: sourceText || 'No readable text was found yet.',
    createdAtIso: String(remote.createdAt ?? remote.created_at ?? new Date().toISOString()),
    readingProgress: progressToRatio(remote.progress ?? remote.progressPercent ?? remote.progress_percent),
    playbackSpeed: Number(remote.playbackSpeed ?? remote.playback_speed ?? 1) || 1,
  };
}

export const useReadMobileStore = create<ReadMobileState>((set, get) => ({
  syncStatus: 'idle',
  syncError: null,
  readAutomatically: true,
  documents: [],
  activeDocumentId: null,

  async refreshLibrary() {
    set({ syncStatus: 'loading', syncError: null });
    try {
      const remoteDocuments = await readRenderApi.listDocuments();
      const documents = remoteDocuments.map(toLocalDocument);
      set({ documents, syncStatus: 'idle', syncError: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ syncStatus: 'offline', syncError: message });
    }
  },

  setReadAutomatically: (enabled) => set({ readAutomatically: enabled }),

  createFromText: ({ title, text, language = 'auto' }) => {
    const sourceText = cleanForReading(text);
    const detected = language === 'auto' ? detectLanguage(sourceText) : language;
    const generatedText = sourceText || 'No readable text was found yet.';
    const localDocument: ReadDocument = {
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
      documents: [localDocument, ...state.documents],
      activeDocumentId: localDocument.id,
      syncStatus: 'syncing',
      syncError: null,
    }));

    void readRenderApi.createFromText({
      title: localDocument.title,
      text: localDocument.sourceText,
      language: localDocument.language,
    }).then((remoteDocument) => {
      const syncedDocument = toLocalDocument(remoteDocument);
      set((state) => ({
        documents: [
          syncedDocument,
          ...state.documents.filter((item) => item.id !== localDocument.id && item.id !== syncedDocument.id),
        ],
        activeDocumentId: syncedDocument.id,
        syncStatus: 'idle',
        syncError: null,
      }));
    }).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      set({ syncStatus: 'offline', syncError: message });
    });

    return localDocument;
  },

  openDocument: (id) => set({ activeDocumentId: id }),

  updateProgress: (id, progress) => {
    const nextProgress = Math.max(0, Math.min(1, progress));
    const document = get().documents.find((item) => item.id === id);

    set((state) => ({
      documents: state.documents.map((item) =>
        item.id === id ? { ...item, readingProgress: nextProgress } : item,
      ),
    }));

    void readRenderApi.updateProgress(id, {
      progress: nextProgress,
      playbackSpeed: document?.playbackSpeed,
    }).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      set({ syncStatus: 'offline', syncError: message });
    });
  },

  setPlaybackSpeed: (id, speed) => {
    const nextSpeed = Math.max(0.5, Math.min(2, speed));
    set((state) => ({
      documents: state.documents.map((document) =>
        document.id === id ? { ...document, playbackSpeed: nextSpeed } : document,
      ),
    }));
  },
}));

export function useActiveReadDocument() {
  return useReadMobileStore((state) => {
    if (!state.activeDocumentId) return state.documents[0] ?? null;
    return state.documents.find((document) => document.id === state.activeDocumentId) ?? state.documents[0] ?? null;
  });
}
