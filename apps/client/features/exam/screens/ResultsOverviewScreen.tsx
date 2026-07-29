import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import {
  loadExamResults,
  saveExamResults,
  type StoredExamResults,
} from '../state/examResultsPersistence';
import {
  getYkiExamSession,
  type YkiEvaluationReport,
  type YkiEvaluationSection,
  type YkiPersistedSessionResult,
} from '@core/api/ykiExam';

const SECTION_KEYS = [
  'reading',
  'listening',
  'writing',
  'speaking',
] as const;

type SectionKey = typeof SECTION_KEYS[number];

const SECTION_LABELS: Record<SectionKey, string> = {
  reading: 'Reading',
  listening: 'Listening',
  writing: 'Writing',
  speaking: 'Speaking',
};

function getEvaluation(
  results: StoredExamResults,
): YkiEvaluationReport | null {
  return (
    results.evaluationReport
    ?? results.submission?.evaluationReport
    ?? results.submission?.evaluation
    ?? null
  );
}

function evaluationUnavailableMessage(
  results: StoredExamResults,
) {
  if (results.backendSubmitted === false) {
    return (
      'Evaluation failed: this attempt was not connected '
      + 'to the YKI evaluator. Start a new mock exam after '
      + 'updating the app.'
    );
  }

  return (
    'Detailed AI evaluation was not available '
    + 'for this historical result.'
  );
}

function displayLevel(value: string | null | undefined) {
  if (
    !value
    || value === 'insufficient_evidence'
  ) {
    return 'Not enough evidence';
  }

  return value;
}

function displayStatus(
  value: YkiEvaluationSection['status'],
) {
  if (value === 'assessed') {
    return 'Assessed';
  }

  if (value === 'limited') {
    return 'Limited evidence';
  }

  return 'Not enough evidence';
}

function displayNumber(value: number | null | undefined) {
  if (typeof value !== 'number') {
    return '—';
  }

  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(1);
}

function displayConfidence(value: number) {
  return `${Math.round(value * 100)}%`;
}

function exactObjectiveScore(
  report: YkiEvaluationReport,
  section: 'reading' | 'listening',
) {
  const score = report.objectiveScores[section];

  if (
    score.score === null
    || score.maximum === null
  ) {
    return 'Not available';
  }

  const percentage =
    score.percentage === null
      ? ''
      : ` · ${displayNumber(score.percentage)}%`;

  return (
    `${displayNumber(score.score)}`
    + ` / ${displayNumber(score.maximum)}`
    + percentage
  );
}

function sectionPracticeScore(
  report: YkiEvaluationReport,
  sectionKey: SectionKey,
) {
  if (
    sectionKey === 'reading'
    || sectionKey === 'listening'
  ) {
    const percentage =
      report.objectiveScores[
        sectionKey
      ].percentage;

    return (
      typeof percentage === 'number'
        ? `${displayNumber(percentage)}%`
        : null
    );
  }

  const section =
    report.sections[sectionKey];

  return (
    section.scoreAvailable
      ? `${displayNumber(section.score)}%`
      : null
  );
}

function displayCriterionScore(
  score: number,
  scoreMax: number | undefined,
) {
  const maximum =
    typeof scoreMax === 'number'
    && scoreMax > 0
      ? scoreMax
      : 5;

  return (
    `${displayNumber(score)}`
    + `/${displayNumber(maximum)}`
  );
}

function persistedEvaluation(
  value: YkiPersistedSessionResult,
): YkiEvaluationReport | null {
  return (
    value.evaluationReport
    ?? value.evaluation
    ?? value.submission?.evaluationReport
    ?? value.submission?.evaluation
    ?? null
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildPlainTextReport(
  results: StoredExamResults,
) {
  const evaluation = getEvaluation(results);

  const lines: string[] = [
    'Floently — Detailed YKI practice report',
    '',
    `Completed: ${results.completedAt}`,
    `Target band: ${results.levelBand}`,
    `Tasks completed: ${results.totalTasks}`,
    '',
  ];

  if (!evaluation) {
    lines.push(
      evaluationUnavailableMessage(results),
      '',
      `Objective score: ${results.objectiveCorrect}/${results.objectiveTasks}`,
      `Objective incorrect: ${results.objectiveIncorrect}`,
      '',
      'Section breakdown:',
      ...results.sectionBreakdown.map(
        (section) =>
          `${section.sectionTitle}: `
          + `${section.objectiveCorrect}`
          + `/${section.objectiveTasks}`,
      ),
    );

    return lines.join('\n');
  }

  lines.push(
    'AI-estimated practice level',
    `Overall estimate: ${displayLevel(evaluation.overallEstimatedLevel)}`,
    `Confidence: ${displayConfidence(evaluation.confidence)}`,
    `Report status: ${evaluation.status}`,
    `Evaluation provider: ${evaluation.provider}`,
    '',
    evaluation.disclaimer,
    '',
    'Pronunciation was not assessed.',
    (
      evaluation.audioEvidenceAvailable
        ? 'Speaking audio evidence was saved, but no acoustic pronunciation analysis was performed.'
        : 'No acoustic speech evidence was used.'
    ),
    '',
    'Exact objective scores',
    `Reading: ${exactObjectiveScore(evaluation, 'reading')}`,
    `Listening: ${exactObjectiveScore(evaluation, 'listening')}`,
    '',
    'Overall summary',
    evaluation.overallSummary,
    '',
  );

  for (const key of SECTION_KEYS) {
    const section = evaluation.sections[key];
    const practiceScore = sectionPracticeScore(
      evaluation,
      key,
    );

    lines.push(
      SECTION_LABELS[key],
      `Status: ${displayStatus(section.status)}`,
      `Estimated level: ${displayLevel(section.estimatedLevel)}`,
      (
        practiceScore
          ? `Practice score: ${practiceScore}`
          : 'Practice score: not provided'
      ),
      section.summary,
    );

    if (section.evidence.length) {
      lines.push(
        'Evidence:',
        ...section.evidence.map(
          (item) => `- ${item}`,
        ),
      );
    }

    if (section.criteria.length) {
      lines.push('Criteria:');

      for (const criterion of section.criteria) {
        lines.push(
          `- ${criterion.name}: ${displayCriterionScore(
            criterion.score,
            criterion.scoreMax,
          )}`,
          `  ${criterion.rationale}`,
          ...criterion.evidence.map(
            (item) => `  Evidence: ${item}`,
          ),
        );
      }
    }

    if ((section.corrections ?? []).length) {
      lines.push('Corrections:');

      for (
        const correction
        of section.corrections ?? []
      ) {
        lines.push(
          `- Original: ${correction.original}`,
          `  Improved Finnish: ${correction.corrected}`,
          `  Why: ${correction.explanation}`,
        );
      }
    }

    if (section.improvements.length) {
      lines.push(
        'Improvements:',
        ...section.improvements.map(
          (item) => `- ${item}`,
        ),
      );
    }

    lines.push('');
  }

  if (evaluation.strengths.length) {
    lines.push(
      'Strengths',
      ...evaluation.strengths.map(
        (item) => `- ${item}`,
      ),
      '',
    );
  }

  if (evaluation.improvements.length) {
    lines.push(
      'Priority improvements',
      ...evaluation.improvements.map(
        (item) => `- ${item}`,
      ),
      '',
    );
  }

  lines.push(
    'Three-step action plan',
    ...evaluation.actionPlan.map(
      (item, index) =>
        `${index + 1}. ${item}`,
    ),
    '',
    'Floently — AI-estimated practice feedback',
  );

  return lines.join('\n');
}

function buildHtmlReport(
  results: StoredExamResults,
) {
  const evaluation = getEvaluation(results);

  const legacyHtml = `
    <section class="card">
      <h2>Basic result</h2>
      <p>
        Objective score:
        <strong>
          ${results.objectiveCorrect}/${results.objectiveTasks}
        </strong>
      </p>
      <p>
        ${escapeHtml(
          evaluationUnavailableMessage(results),
        )}
      </p>
    </section>
  `;

  const detailedHtml = evaluation
    ? `
      <section class="hero">
        <div class="eyebrow">
          AI-estimated practice level
        </div>
        <div class="level">
          ${escapeHtml(
            displayLevel(
              evaluation.overallEstimatedLevel,
            ),
          )}
        </div>
        <div class="confidence">
          Confidence:
          ${escapeHtml(
            displayConfidence(
              evaluation.confidence,
            ),
          )}
        </div>
        <p>
          ${escapeHtml(
            evaluation.overallSummary,
          )}
        </p>
      </section>

      <section class="warning">
        <strong>Not an official YKI result</strong>
        <p>
          ${escapeHtml(
            evaluation.disclaimer,
          )}
        </p>
        <p>
          Pronunciation, accent and acoustic voice quality
          were not assessed.
        </p>
      </section>

      <section class="card">
        <h2>Exact objective scores</h2>
        <table>
          <tr>
            <td>Reading</td>
            <td>
              ${escapeHtml(
                exactObjectiveScore(
                  evaluation,
                  'reading',
                ),
              )}
            </td>
          </tr>
          <tr>
            <td>Listening</td>
            <td>
              ${escapeHtml(
                exactObjectiveScore(
                  evaluation,
                  'listening',
                ),
              )}
            </td>
          </tr>
        </table>
      </section>

      ${SECTION_KEYS.map((key) => {
        const section =
          evaluation.sections[key];
        const practiceScore =
          sectionPracticeScore(
            evaluation,
            key,
          );

        return `
          <section class="card">
            <div class="section-heading">
              <h2>
                ${escapeHtml(
                  SECTION_LABELS[key],
                )}
              </h2>
              <span class="status">
                ${escapeHtml(
                  displayStatus(
                    section.status,
                  ),
                )}
              </span>
            </div>

            <p>
              <strong>Estimated level:</strong>
              ${escapeHtml(
                displayLevel(
                  section.estimatedLevel,
                ),
              )}
            </p>

            ${
              practiceScore
                ? `
                  <p>
                    <strong>Practice score:</strong>
                    ${escapeHtml(practiceScore)}
                  </p>
                `
                : ''
            }

            <p>
              ${escapeHtml(section.summary)}
            </p>

            ${
              section.evidence.length
                ? `
                  <h3>Evidence</h3>
                  <ul>
                    ${section.evidence.map(
                      (item) =>
                        `<li>${escapeHtml(item)}</li>`,
                    ).join('')}
                  </ul>
                `
                : ''
            }

            ${
              section.criteria.length
                ? `
                  <h3>Criteria</h3>
                  ${section.criteria.map(
                    (criterion) => `
                      <div class="criterion">
                        <strong>
                          ${escapeHtml(
                            criterion.name,
                          )}
                          ·
                          ${displayCriterionScore(
                             criterion.score,
                             criterion.scoreMax,
                           )}
                        </strong>
                        <p>
                          ${escapeHtml(
                            criterion.rationale,
                          )}
                        </p>
                        ${
                          criterion.evidence.length
                            ? `
                              <ul>
                                ${criterion.evidence.map(
                                  (item) =>
                                    `<li>${escapeHtml(item)}</li>`,
                                ).join('')}
                              </ul>
                            `
                            : ''
                        }
                      </div>
                    `,
                  ).join('')}
                `
                : ''
            }

            ${
              (section.corrections ?? []).length
                ? `
                  <h3>Corrections</h3>
                  ${(
                    section.corrections ?? []
                  ).map(
                    (correction) => `
                      <div class="criterion">
                        <strong>Original</strong>
                        <p>
                          ${escapeHtml(
                            correction.original,
                          )}
                        </p>

                        <strong>
                          Improved Finnish
                        </strong>
                        <p>
                          ${escapeHtml(
                            correction.corrected,
                          )}
                        </p>

                        <strong>Why</strong>
                        <p>
                          ${escapeHtml(
                            correction.explanation,
                          )}
                        </p>
                      </div>
                    `,
                  ).join('')}
                `
                : ''
            }

            ${
              section.improvements.length
                ? `
                  <h3>Improvements</h3>
                  <ul>
                    ${section.improvements.map(
                      (item) =>
                        `<li>${escapeHtml(item)}</li>`,
                    ).join('')}
                  </ul>
                `
                : ''
            }
          </section>
        `;
      }).join('')}

      <section class="card">
        <h2>Strengths</h2>
        <ul>
          ${evaluation.strengths.map(
            (item) =>
              `<li>${escapeHtml(item)}</li>`,
          ).join('')}
        </ul>

        <h2>Priority improvements</h2>
        <ul>
          ${evaluation.improvements.map(
            (item) =>
              `<li>${escapeHtml(item)}</li>`,
          ).join('')}
        </ul>

        <h2>Three-step action plan</h2>
        <ol>
          ${evaluation.actionPlan.map(
            (item) =>
              `<li>${escapeHtml(item)}</li>`,
          ).join('')}
        </ol>
      </section>
    `
    : legacyHtml;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Floently — Detailed YKI practice report</title>
<style>
  @page {
    margin: 20mm 16mm;
  }

  body {
    font-family:
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
    color: #111827;
    line-height: 1.5;
    font-size: 10.5pt;
    -webkit-print-color-adjust: exact;
  }

  h1 {
    margin: 0 0 4pt;
    font-size: 21pt;
  }

  h2 {
    color: #2453D4;
    font-size: 13pt;
    margin: 0 0 8pt;
  }

  h3 {
    font-size: 11pt;
    margin: 12pt 0 5pt;
  }

  p {
    margin: 5pt 0;
  }

  ul,
  ol {
    margin-top: 5pt;
    padding-left: 18pt;
  }

  li {
    margin-bottom: 4pt;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  td {
    border-bottom: 1px solid #E5ECF8;
    padding: 7pt 4pt;
  }

  td:last-child {
    text-align: right;
    font-weight: 700;
  }

  .meta {
    color: #6B7280;
    margin-bottom: 16pt;
  }

  .hero,
  .card,
  .warning {
    border: 1px solid #D8E3F2;
    border-radius: 10pt;
    padding: 13pt;
    margin-bottom: 12pt;
    page-break-inside: avoid;
  }

  .hero {
    background: #F4F8FF;
  }

  .warning {
    background: #FFF8E5;
    border-color: #E8CB76;
  }

  .eyebrow {
    color: #2453D4;
    font-size: 9pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5pt;
  }

  .level {
    font-size: 26pt;
    font-weight: 850;
    margin-top: 3pt;
  }

  .confidence {
    color: #4B5563;
    font-weight: 700;
  }

  .section-heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .status {
    color: #2453D4;
    background: #E8F0FF;
    border-radius: 999px;
    padding: 3pt 7pt;
    font-size: 8.5pt;
    font-weight: 700;
  }

  .criterion {
    background: #F8FBFF;
    border-left: 3px solid #2453D4;
    padding: 8pt 10pt;
    margin-bottom: 7pt;
    page-break-inside: avoid;
  }

  .footer {
    margin-top: 20pt;
    color: #6B7280;
    font-size: 8.5pt;
    text-align: center;
  }
</style>
</head>
<body>
  <h1>Detailed YKI practice report</h1>

  <div class="meta">
    Target band:
    <strong>
      ${escapeHtml(results.levelBand)}
    </strong>
    · Completed:
    ${escapeHtml(results.completedAt)}
  </div>

  ${detailedHtml}

  <div class="footer">
    Floently — Finnish-language practice feedback
  </div>
</body>
</html>`;
}

function downloadOnWeb(
  content: string,
  filename: string,
  mimeType: string,
) {
  if (
    Platform.OS !== 'web'
    || typeof document === 'undefined'
    || typeof URL === 'undefined'
  ) {
    throw new Error(
      'Web download is unavailable.',
    );
  }

  const blob = new Blob(
    [content],
    {
      type: mimeType,
    },
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

function BulletList({
  values,
}: {
  values: string[];
}) {
  if (!values.length) {
    return null;
  }

  return (
    <View style={styles.list}>
      {values.map((value, index) => (
        <Text
          key={`${index}-${value}`}
          style={styles.listItem}
        >
          • {value}
        </Text>
      ))}
    </View>
  );
}

function SectionReport({
  sectionKey,
  report,
}: {
  sectionKey: SectionKey;
  report: YkiEvaluationReport;
}) {
  const section = report.sections[sectionKey];
  const practiceScore = sectionPracticeScore(
    report,
    sectionKey,
  );

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeadingText}>
          <Text style={styles.sectionTitle}>
            {SECTION_LABELS[sectionKey]}
          </Text>

          <Text style={styles.sectionLevel}>
            Estimated level:{' '}
            {displayLevel(
              section.estimatedLevel,
            )}
          </Text>
        </View>

        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>
            {displayStatus(section.status)}
          </Text>
        </View>
      </View>

      {practiceScore ? (
        <Text style={styles.sectionScore}>
          Practice score:{' '}
          {practiceScore}
        </Text>
      ) : null}

      <Text style={styles.body}>
        {section.summary}
      </Text>

      {section.evidence.length ? (
        <View style={styles.subsection}>
          <Text style={styles.subheading}>
            Evidence
          </Text>

          {section.evidence.map(
            (evidence, index) => (
              <View
                key={`${index}-${evidence}`}
                style={styles.evidenceBox}
              >
                <Text style={styles.evidenceText}>
                  “{evidence}”
                </Text>
              </View>
            ),
          )}
        </View>
      ) : null}

      {section.criteria.length ? (
        <View style={styles.subsection}>
          <Text style={styles.subheading}>
            Criteria
          </Text>

          {section.criteria.map(
            (criterion, index) => (
              <View
                key={`${index}-${criterion.name}`}
                style={styles.criterionCard}
              >
                <View style={styles.criterionHeader}>
                  <Text style={styles.criterionName}>
                    {criterion.name}
                  </Text>

                  <Text style={styles.criterionScore}>
                    {displayCriterionScore(
                      criterion.score,
                      criterion.scoreMax,
                    )}
                  </Text>
                </View>

                <Text style={styles.body}>
                  {criterion.rationale}
                </Text>

                <BulletList
                  values={criterion.evidence}
                />
              </View>
            ),
          )}
        </View>
      ) : null}

      {(section.corrections ?? []).length ? (
        <View style={styles.subsection}>
          <Text style={styles.subheading}>
            Corrections
          </Text>

          {(section.corrections ?? []).map(
            (correction, index) => (
              <View
                key={`${index}-${correction.original}`}
                style={styles.criterionCard}
              >
                <Text style={styles.criterionName}>
                  Original
                </Text>

                <Text style={styles.body}>
                  {correction.original}
                </Text>

                <Text style={styles.criterionName}>
                  Improved Finnish
                </Text>

                <Text style={styles.body}>
                  {correction.corrected}
                </Text>

                <Text style={styles.criterionName}>
                  Why
                </Text>

                <Text style={styles.body}>
                  {correction.explanation}
                </Text>
              </View>
            ),
          )}
        </View>
      ) : null}

      {section.improvements.length ? (
        <View style={styles.subsection}>
          <Text style={styles.subheading}>
            How to improve
          </Text>

          <BulletList
            values={section.improvements}
          />
        </View>
      ) : null}
    </View>
  );
}

export default function ResultsOverviewScreen() {
  const [results, setResults] =
    useState<StoredExamResults | null>(null);

  useEffect(() => {
    let active = true;

    void (async () => {
      const stored =
        await loadExamResults();

      if (!active) {
        return;
      }

      setResults(stored);

      if (!stored?.sessionId) {
        return;
      }

      try {
        const persisted =
          await getYkiExamSession<
            YkiPersistedSessionResult
          >(stored.sessionId);

        const recoveredEvaluation =
          persistedEvaluation(persisted);

        if (!recoveredEvaluation) {
          return;
        }

        const refreshed: StoredExamResults = {
          ...stored,
          completedAt:
            persisted.submittedAt
            ?? stored.completedAt,
          submission:
            persisted.submission
            ?? stored.submission,
          evaluationReport:
            recoveredEvaluation,
        };

        await saveExamResults(refreshed);

        if (active) {
          setResults(refreshed);
        }
      } catch {
        // Keep the locally saved report when
        // backend recovery is temporarily offline.
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const evaluation = useMemo(
    () =>
      results
        ? getEvaluation(results)
        : null,
    [results],
  );

  const exportText = useMemo(
    () =>
      results
        ? buildPlainTextReport(results)
        : '',
    [results],
  );

  const exportHtml = useMemo(
    () =>
      results
        ? buildHtmlReport(results)
        : '',
    [results],
  );

  async function exportTextReport() {
    if (!results || !exportText) {
      return;
    }

    const filename =
      `floently-yki-report-${Date.now()}.txt`;

    try {
      if (
        Platform.OS === 'web'
        && typeof document !== 'undefined'
      ) {
        downloadOnWeb(
          exportText,
          filename,
          'text/plain;charset=utf-8',
        );

        return;
      }

      const file = new FileSystem.File(
        FileSystem.Paths.cache,
        filename,
      );

      file.create({
        intermediates: true,
        overwrite: true,
      });

      file.write(exportText);

      await Share.share({
        title: filename,
        message: exportText,
        url: file.uri,
      });
    } catch {
      await Share.share({
        title: filename,
        message: exportText,
      });
    }
  }

  async function exportPdfReport() {
    if (!results || !exportHtml) {
      return;
    }

    try {
      if (
        Platform.OS === 'web'
        && typeof document !== 'undefined'
      ) {
        const popup = window.open(
          '',
          '_blank',
        );

        if (!popup) {
          throw new Error(
            'The browser blocked the report window.',
          );
        }

        popup.document.write(exportHtml);
        popup.document.close();

        setTimeout(() => {
          try {
            popup.print();
          } catch {
            // Browser print remains user-controlled.
          }
        }, 300);

        return;
      }

      const { uri } =
        await Print.printToFileAsync({
          html: exportHtml,
        });

      await Share.share({
        title: 'Floently YKI practice report.pdf',
        url: uri,
      });
    } catch {
      Alert.alert(
        'PDF export failed',
        'The detailed PDF could not be created. The plain-text report remains available.',
      );
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backBar}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>
            ← Back
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          Detailed YKI practice report
        </Text>

        {results ? (
          <>
            {evaluation ? (
              <>
                <View style={styles.heroCard}>
                  <Text style={styles.eyebrow}>
                    AI-estimated practice level
                  </Text>

                  <Text style={styles.heroLevel}>
                    {displayLevel(
                      evaluation.overallEstimatedLevel,
                    )}
                  </Text>

                  <Text style={styles.heroConfidence}>
                    Confidence:{' '}
                    {displayConfidence(
                      evaluation.confidence,
                    )}
                  </Text>

                  <Text style={styles.heroSummary}>
                    {evaluation.overallSummary}
                  </Text>

                  {evaluation.status === 'fallback' ? (
                    <View style={styles.fallbackBadge}>
                      <Text style={styles.fallbackText}>
                        Limited fallback report
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.disclaimerCard}>
                  <Text style={styles.disclaimerTitle}>
                    Not an official YKI result
                  </Text>

                  <Text style={styles.disclaimerText}>
                    {evaluation.disclaimer}
                  </Text>

                  <Text style={styles.disclaimerText}>
                    Pronunciation was not assessed.
                    Audio may have been saved as evidence,
                    but accent, voice quality and acoustic
                    fluency were not scored.
                  </Text>
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>
                    Exact objective scores
                  </Text>

                  <View style={styles.metricGrid}>
                    <View style={styles.metric}>
                      <Text style={styles.metricValue}>
                        {exactObjectiveScore(
                          evaluation,
                          'reading',
                        )}
                      </Text>

                      <Text style={styles.metricLabel}>
                        Reading
                      </Text>
                    </View>

                    <View style={styles.metric}>
                      <Text style={styles.metricValue}>
                        {exactObjectiveScore(
                          evaluation,
                          'listening',
                        )}
                      </Text>

                      <Text style={styles.metricLabel}>
                        Listening
                      </Text>
                    </View>
                  </View>
                </View>

                {SECTION_KEYS.map((key) => (
                  <SectionReport
                    key={key}
                    sectionKey={key}
                    report={evaluation}
                  />
                ))}

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>
                    Strengths
                  </Text>

                  <BulletList
                    values={evaluation.strengths}
                  />

                  <Text style={styles.cardTitle}>
                    Priority improvements
                  </Text>

                  <BulletList
                    values={evaluation.improvements}
                  />

                  <Text style={styles.cardTitle}>
                    Three-step action plan
                  </Text>

                  {evaluation.actionPlan.map(
                    (step, index) => (
                      <View
                        key={`${index}-${step}`}
                        style={styles.actionStep}
                      >
                        <View style={styles.actionNumber}>
                          <Text style={styles.actionNumberText}>
                            {index + 1}
                          </Text>
                        </View>

                        <Text style={styles.actionText}>
                          {step}
                        </Text>
                      </View>
                    ),
                  )}
                </View>
              </>
            ) : (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  Basic result
                </Text>

                <Text style={styles.body}>
                  {evaluationUnavailableMessage(results)}
                </Text>

                <Text style={styles.body}>
                  Objective score:{' '}
                  {results.objectiveCorrect}
                  {' / '}
                  {results.objectiveTasks}
                </Text>

                <Text style={styles.body}>
                  Incorrect objective answers:{' '}
                  {results.objectiveIncorrect}
                </Text>
              </View>
            )}

            <View style={styles.exportRow}>
              <Pressable
                onPress={() =>
                  void exportPdfReport()
                }
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>
                  Export detailed PDF
                </Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  void exportTextReport()
                }
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>
                  Export text report
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              No completed exam result
            </Text>

            <Text style={styles.body}>
              Finish a YKI practice exam first.
              Its detailed result will then appear here.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FBFF',
  },

  backBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8FBFF',
  },

  backButton: {
    minHeight: 36,
    borderRadius: 999,
    paddingHorizontal: 14,
    justifyContent: 'center',
    backgroundColor: '#E8F0FF',
  },

  backButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2453D4',
  },

  container: {
    padding: 20,
    paddingBottom: 52,
    gap: 14,
    backgroundColor: '#F8FBFF',
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },

  heroCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#C9D9FF',
    backgroundColor: '#EEF4FF',
    padding: 18,
    gap: 7,
  },

  eyebrow: {
    color: '#2453D4',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  heroLevel: {
    color: '#111827',
    fontSize: 38,
    fontWeight: '900',
  },

  heroConfidence: {
    color: '#2453D4',
    fontSize: 14,
    fontWeight: '800',
  },

  heroSummary: {
    color: '#374151',
    fontSize: 14,
    lineHeight: 22,
  },

  fallbackBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#FFF2C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  fallbackText: {
    color: '#7A5510',
    fontSize: 11,
    fontWeight: '800',
  },

  disclaimerCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8CB76',
    backgroundColor: '#FFF8E5',
    padding: 16,
    gap: 7,
  },

  disclaimerTitle: {
    color: '#6C4B0B',
    fontSize: 15,
    fontWeight: '800',
  },

  disclaimerText: {
    color: '#6C5727',
    fontSize: 13,
    lineHeight: 20,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D8E3F2',
    padding: 16,
    gap: 12,
  },

  cardTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },

  body: {
    color: '#4B5563',
    fontSize: 14,
    lineHeight: 21,
  },

  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  metric: {
    flexGrow: 1,
    minWidth: 130,
    borderRadius: 14,
    backgroundColor: '#F4F8FF',
    borderWidth: 1,
    borderColor: '#D8E3F2',
    padding: 13,
    gap: 3,
  },

  metricValue: {
    color: '#2453D4',
    fontSize: 18,
    fontWeight: '900',
  },

  metricLabel: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
  },

  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D8E3F2',
    padding: 16,
    gap: 11,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },

  sectionHeadingText: {
    flex: 1,
    gap: 3,
  },

  sectionTitle: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '900',
  },

  sectionLevel: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '700',
  },

  statusBadge: {
    borderRadius: 999,
    backgroundColor: '#E8F0FF',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  statusBadgeText: {
    color: '#2453D4',
    fontSize: 10,
    fontWeight: '800',
  },

  sectionScore: {
    color: '#2453D4',
    fontSize: 14,
    fontWeight: '800',
  },

  subsection: {
    gap: 8,
  },

  subheading: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
  },

  evidenceBox: {
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#4E8F6A',
    backgroundColor: '#F3FAF5',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  evidenceText: {
    color: '#355B42',
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
  },

  criterionCard: {
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E1E8F5',
    backgroundColor: '#F8FBFF',
    padding: 12,
    gap: 6,
  },

  criterionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  criterionName: {
    flex: 1,
    color: '#111827',
    fontSize: 13,
    fontWeight: '800',
  },

  criterionScore: {
    color: '#2453D4',
    fontSize: 13,
    fontWeight: '900',
  },

  list: {
    gap: 5,
  },

  listItem: {
    color: '#4B5563',
    fontSize: 13,
    lineHeight: 19,
  },

  actionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },

  actionNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2453D4',
  },

  actionNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },

  actionText: {
    flex: 1,
    color: '#374151',
    fontSize: 14,
    lineHeight: 21,
  },

  exportRow: {
    gap: 10,
  },

  primaryButton: {
    minHeight: 46,
    borderRadius: 999,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2453D4',
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  secondaryButton: {
    minHeight: 44,
    borderRadius: 999,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F0FF',
    borderWidth: 1,
    borderColor: '#C9D9FF',
  },

  secondaryButtonText: {
    color: '#2453D4',
    fontSize: 14,
    fontWeight: '800',
  },
});
