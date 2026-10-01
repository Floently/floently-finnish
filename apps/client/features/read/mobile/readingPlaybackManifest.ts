export type ReadingPlaybackSegment = {
  index: number;
  text: string;
  charStart: number;
  charEnd: number;
  wordStart: number;
  wordEnd: number;
  wordCount: number;
  estimatedSourceDurationSeconds: number;
  estimatedPlaybackDurationSeconds: number;
};

export type ReadingPlaybackManifest = {
  textLength: number;
  wordCount: number;
  playbackSpeed: number;
  estimatedSourceDurationSeconds: number;
  estimatedPlaybackDurationSeconds: number;
  segments: ReadingPlaybackSegment[];
};

const BASE_WORDS_PER_MINUTE = 170;
const WORD_PATTERN = /[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu;

function boundedSpeed(value: number): number {
  return Math.max(0.1, Math.min(2, Number.isFinite(value) ? value : 1));
}

function countWords(value: string): number {
  return value.match(WORD_PATTERN)?.length ?? 0;
}

function splitReadingSegments(
  text: string,
  maxChars: number,
  startupMaxChars = maxChars,
): string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const units = normalized
    .split(/(?<=[.!?])\s+|\n{2,}/)
    .map((value) => value.trim())
    .filter(Boolean);

  const segments: string[] = [];
  let current = '';

  const flush = () => {
    const value = current.trim();
    if (value) segments.push(value);
    current = '';
  };

  for (const unit of units) {
    if (unit.length > maxChars) {
      flush();
      let remaining = unit;
      while (remaining.length > maxChars) {
        let cut = remaining.lastIndexOf(' ', maxChars);
        if (cut < Math.floor(maxChars * 0.6)) cut = maxChars;
        segments.push(remaining.slice(0, cut).trim());
        remaining = remaining.slice(cut).trim();
      }
      if (remaining) current = remaining;
      continue;
    }

    const candidate = current ? `${current} ${unit}` : unit;
    if (candidate.length > maxChars) {
      flush();
      current = unit;
    } else {
      current = candidate;
    }
  }

  flush();

  // The first narration request controls perceived start latency. Keep only
  // that first hidden segment small, then return to long segments so a long
  // book/page does not degrade into a visible stream of tiny media clips.
  const startupLimit = Math.max(180, Math.min(maxChars, startupMaxChars));
  if (segments[0] && segments[0].length > startupLimit) {
    const first = segments.shift()!;
    const prefix = first.slice(0, startupLimit);
    const punctuationCandidates = [
      prefix.lastIndexOf('. '),
      prefix.lastIndexOf('? '),
      prefix.lastIndexOf('! '),
    ];
    const punctuationCut = Math.max(...punctuationCandidates);
    let cut = punctuationCut >= Math.floor(startupLimit * 0.45)
      ? punctuationCut + 1
      : first.lastIndexOf(' ', startupLimit);

    if (cut < Math.floor(startupLimit * 0.6)) cut = startupLimit;

    const startup = first.slice(0, cut).trim();
    const remainder = first.slice(cut).trim();
    if (startup) segments.unshift(startup);
    if (remainder) segments.splice(1, 0, remainder);
  }

  return segments;
}

export function createReadingPlaybackManifest(
  text: string,
  playbackSpeed = 1,
  maxChars = 3600,
  startupMaxChars = maxChars,
): ReadingPlaybackManifest {
  const speed = boundedSpeed(playbackSpeed);
  const segmentLimit = Math.max(600, maxChars);
  const pieces = splitReadingSegments(
    text,
    segmentLimit,
    Math.max(180, Math.min(segmentLimit, startupMaxChars)),
  );
  const segments: ReadingPlaybackSegment[] = [];

  let charCursor = 0;
  let wordCursor = 0;
  let sourceDuration = 0;

  for (let index = 0; index < pieces.length; index += 1) {
    const segmentText = pieces[index];
    const wordCount = countWords(segmentText);
    const estimatedSourceDurationSeconds = Math.max(
      0.6,
      (Math.max(1, wordCount) / BASE_WORDS_PER_MINUTE) * 60,
    );
    const estimatedPlaybackDurationSeconds = estimatedSourceDurationSeconds / speed;
    const charStart = charCursor;
    const wordStart = wordCursor;

    charCursor += segmentText.length;
    wordCursor += wordCount;
    sourceDuration += estimatedSourceDurationSeconds;

    segments.push({
      index,
      text: segmentText,
      charStart,
      charEnd: charCursor,
      wordStart,
      wordEnd: wordCursor,
      wordCount,
      estimatedSourceDurationSeconds,
      estimatedPlaybackDurationSeconds,
    });
  }

  return {
    textLength: charCursor,
    wordCount: wordCursor,
    playbackSpeed: speed,
    estimatedSourceDurationSeconds: sourceDuration,
    estimatedPlaybackDurationSeconds: sourceDuration / speed,
    segments,
  };
}

export function readingPositionForProgress(
  manifest: ReadingPlaybackManifest,
  progress: number,
): { index: number; fraction: number } {
  if (!manifest.segments.length || manifest.textLength <= 0) {
    return { index: 0, fraction: 0 };
  }

  const boundedProgress = Math.max(0, Math.min(1, progress));
  const target = boundedProgress * manifest.textLength;

  for (const segment of manifest.segments) {
    const length = Math.max(1, segment.charEnd - segment.charStart);
    if (target < segment.charEnd || segment.index === manifest.segments.length - 1) {
      return {
        index: segment.index,
        fraction: Math.max(0, Math.min(1, (target - segment.charStart) / length)),
      };
    }
  }

  return { index: manifest.segments.length - 1, fraction: 1 };
}

export function readingProgressForSegment(
  manifest: ReadingPlaybackManifest,
  index: number,
  fraction: number,
): number {
  const segment = manifest.segments[index];
  if (!segment || manifest.textLength <= 0) return 0;
  const length = Math.max(1, segment.charEnd - segment.charStart);
  const logicalChars = segment.charStart + length * Math.max(0, Math.min(1, fraction));
  return Math.max(0, Math.min(1, logicalChars / manifest.textLength));
}

export function readingPrefetchIndexes(
  manifest: ReadingPlaybackManifest,
  activeIndex: number,
  horizonSeconds = 120,
  maxSegments = 4,
): number[] {
  const indexes: number[] = [];
  let bufferedSeconds = 0;
  const horizon = Math.max(30, horizonSeconds);

  for (
    let index = Math.max(0, activeIndex + 1);
    index < manifest.segments.length && indexes.length < Math.max(2, maxSegments);
    index += 1
  ) {
    indexes.push(index);
    bufferedSeconds += manifest.segments[index].estimatedPlaybackDurationSeconds;
    if (bufferedSeconds >= horizon && indexes.length >= 2) break;
  }

  return indexes;
}

export function formatReadingClock(seconds: number): string {
  const value = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const secs = value % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
