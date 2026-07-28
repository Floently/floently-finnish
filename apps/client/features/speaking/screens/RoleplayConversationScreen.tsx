import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  finishRoleplaySession,
  listRoleplayScenarios,
  startRoleplaySession,
  submitRoleplayTurn,
  type RoleplayLevelBand,
  type RoleplayFinishResponse,
  type RoleplayProfession,
  type RoleplayScenarioSummary,
} from '@core/api/roleplay';
import { colors, spacing, typography } from '@ui/theme';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import { usePreferencesStore } from '../../../state/preferencesStore';
import { WaveformMicRing } from '../components/WaveformMicRing';
import RoleplayScenarioHeader from '../components/RoleplayScenarioHeader';
import RoleplayTranscriptList from '../components/RoleplayTranscriptList';
import { primeRoleplayAudioPlayback, speakRoleplayText, stopRoleplayAudioPlayback, uiSounds } from '../services/roleplayAudio';
import { pickRotatingRoleplayScenario } from '../services/roleplayScenarioRotation';
import { useRoleplayRecorder } from '../hooks/useRoleplayRecorder';
import { SessionCompletion } from '../components/SessionCompletion';
import type { TranscriptMessage } from '../types';

const AUTO_PLAY_ROLEPLAY_OPENING_AUDIO = true;

function messageId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function scenarioIdForContext(
  profession: RoleplayProfession,
  contextLabel?: string,
): string | undefined {
  const normalized = String(
    contextLabel || '',
  ).toLowerCase();

  // Explicit interview and strongly contextual launches remain
  // deterministic. Ordinary roleplay launches are intentionally left
  // unresolved so the persistent shuffled rotation can choose them.
  if (normalized.includes('interview')) {
    if (profession === 'doctor') {
      return 'doctor_patient_interview';
    }

    if (profession === 'nurse') {
      return 'nurse_interview_beta';
    }

    if (profession === 'practical_nurse') {
      return 'practical_nurse_interview';
    }
  }

  if (
    profession === 'general' &&
    (
      normalized.includes('issue') ||
      normalized.includes('problem') ||
      normalized.includes('report')
    )
  ) {
    return 'general_issue_report';
  }

  return undefined;
}

/**
 * Defensive sanity check for #9.
 *
 * If a profession-mismatched scenarioId is propagated in (e.g. a doctor scenario
 * id while the user's profession is 'general'), drop it and let the resolver
 * pick a profession-appropriate one. This prevents the regression where a stale
 * scenarioId from a previous session causes "general" roleplay to behave as
 * profession-specific.
 */
function isScenarioIdValidForProfession(scenarioId: string | undefined, profession: RoleplayProfession): boolean {
  if (!scenarioId) return false;
  const id = scenarioId.toLowerCase();
  // The naming convention in the registry is "<profession>_<scenario_name>".
  // general_*    → general
  // nurse_*      → nurse
  // doctor_*     → doctor
  // practical_*  → practical_nurse
  if (profession === 'general') return id.startsWith('general_');
  if (profession === 'nurse') return id.startsWith('nurse_');
  if (profession === 'doctor') return id.startsWith('doctor_');
  if (profession === 'practical_nurse') return id.startsWith('practical_');
  return true; // unknown profession → trust the scenarioId
}

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

type FeedbackReport = RoleplayFinishResponse;

function roleplayEvaluation(
  report: FeedbackReport,
) {
  return (
    report.evaluationReport
    ?? report.evaluation
    ?? null
  );
}

function displayRoleplayLevel(
  value: string | null | undefined,
) {
  if (
    !value
    || value === 'insufficient_evidence'
  ) {
    return 'Ei riittävästi näyttöä';
  }

  return value;
}

function displayRoleplayScore(
  value: number | null | undefined,
) {
  if (typeof value !== 'number') {
    return 'Ei pisteytetty';
  }

  const formatted = Number.isInteger(value)
    ? String(value)
    : value.toFixed(1);

  return `${formatted}/100`;
}

function buildRoleplayEvaluationMarkdown(
  report: FeedbackReport,
): string[] {
  const evaluation =
    roleplayEvaluation(report);

  if (!evaluation) {
    return [];
  }

  const lines: string[] = [
    `## AI-arvioitu harjoittelutaso`,
    ``,
    `**Arvioitu taso:** ${displayRoleplayLevel(evaluation.estimatedLevel)}  `,
    `**Luottamus:** ${Math.round(evaluation.confidence * 100)} %  `,
    `**Raportin tila:** ${evaluation.status === 'ready' ? 'AI-arvio valmis' : 'Rajoitettu vararaportti'}  `,
    ``,
    evaluation.overallSummary,
    ``,
    `> ${evaluation.disclaimer}`,
    ``,
    `> Ääntämistä, aksenttia tai äänen laatua ei arvioitu.`,
    ``,
    `### Arviointikriteerit`,
    ``,
  ];

  for (const criterion of evaluation.criteria) {
    lines.push(
      `#### ${criterion.name}`,
      ``,
      `**Pisteet:** ${displayRoleplayScore(criterion.score)} · **Taso:** ${displayRoleplayLevel(criterion.level)}`,
      ``,
      criterion.rationale,
      ``,
    );

    if (criterion.evidence.length) {
      lines.push(
        `**Näyttö:**`,
        ...criterion.evidence.map(
          (item) => `- “${item}”`,
        ),
        ``,
      );
    }
  }

  if (evaluation.strengths.length) {
    lines.push(
      `### Vahvuudet`,
      ``,
      ...evaluation.strengths.map(
        (item) => `- ${item}`,
      ),
      ``,
    );
  }

  if (evaluation.improvements.length) {
    lines.push(
      `### Tärkeimmät kehityskohteet`,
      ``,
      ...evaluation.improvements.map(
        (item) => `- ${item}`,
      ),
      ``,
    );
  }

  if (evaluation.corrections.length) {
    lines.push(
      `### Korjaukset`,
      ``,
    );

    for (
      const correction
      of evaluation.corrections
    ) {
      lines.push(
        `- **Alkuperäinen:** ${correction.original}`,
        `  **Korjattu:** ${correction.corrected}`,
        `  **Miksi:** ${correction.explanation}`,
      );
    }

    lines.push(``);
  }

  lines.push(
    `### Kolmen vaiheen harjoitussuunnitelma`,
    ``,
    ...evaluation.actionPlan.map(
      (item, index) =>
        `${index + 1}. ${item}`,
    ),
    ``,
  );

  return lines;
}

function buildRoleplayEvaluationPlainText(
  report: FeedbackReport,
): string[] {
  const evaluation =
    roleplayEvaluation(report);

  if (!evaluation) {
    return [];
  }

  const lines: string[] = [
    `AI-ARVIOITU HARJOITTELUTASO`,
    ``,
    `Arvioitu taso: ${displayRoleplayLevel(evaluation.estimatedLevel)}`,
    `Luottamus: ${Math.round(evaluation.confidence * 100)} %`,
    `Raportin tila: ${evaluation.status}`,
    ``,
    evaluation.overallSummary,
    ``,
    evaluation.disclaimer,
    `Ääntämistä, aksenttia tai äänen laatua ei arvioitu.`,
    ``,
    `Arviointikriteerit`,
    ``,
  ];

  for (const criterion of evaluation.criteria) {
    lines.push(
      `${criterion.name}`,
      `  Pisteet: ${displayRoleplayScore(criterion.score)}`,
      `  Taso: ${displayRoleplayLevel(criterion.level)}`,
      `  Arvio: ${criterion.rationale}`,
    );

    for (
      const evidence
      of criterion.evidence
    ) {
      lines.push(
        `  Näyttö: "${evidence}"`,
      );
    }

    lines.push(``);
  }

  if (evaluation.strengths.length) {
    lines.push(
      `Vahvuudet`,
      ...evaluation.strengths.map(
        (item) => `  - ${item}`,
      ),
      ``,
    );
  }

  if (evaluation.improvements.length) {
    lines.push(
      `Tärkeimmät kehityskohteet`,
      ...evaluation.improvements.map(
        (item) => `  - ${item}`,
      ),
      ``,
    );
  }

  if (evaluation.corrections.length) {
    lines.push(
      `Korjaukset`,
    );

    for (
      const correction
      of evaluation.corrections
    ) {
      lines.push(
        `  Alkuperäinen: ${correction.original}`,
        `  Korjattu: ${correction.corrected}`,
        `  Miksi: ${correction.explanation}`,
        ``,
      );
    }
  }

  lines.push(
    `Kolmen vaiheen harjoitussuunnitelma`,
    ...evaluation.actionPlan.map(
      (item, index) =>
        `  ${index + 1}. ${item}`,
    ),
    ``,
  );

  return lines;
}

function buildRoleplayEvaluationHtml(
  report: FeedbackReport,
) {
  const evaluation =
    roleplayEvaluation(report);

  if (!evaluation) {
    return `
      <div style="
        padding: 12pt;
        border: 1px solid #E1E8F5;
        border-radius: 8pt;
        margin-bottom: 14pt;
      ">
        <strong>
          Yksityiskohtainen AI-arvio ei ollut
          saatavilla tälle vanhemmalle raportille.
        </strong>
      </div>
    `;
  }

  const criteriaHtml =
    evaluation.criteria.map(
      (criterion) => `
        <div style="
          margin: 0 0 10pt;
          padding: 9pt 10pt;
          background: #F2F5FB;
          border-left: 3pt solid #1F47E8;
          page-break-inside: avoid;
        ">
          <div style="
            font-weight: 800;
            margin-bottom: 4pt;
          ">
            ${escapeHtml(criterion.name)}
            ·
            ${escapeHtml(
              displayRoleplayScore(
                criterion.score,
              ),
            )}
            ·
            ${escapeHtml(
              displayRoleplayLevel(
                criterion.level,
              ),
            )}
          </div>

          <div>
            ${escapeHtml(
              criterion.rationale,
            )}
          </div>

          ${
            criterion.evidence.length
              ? `
                <ul>
                  ${criterion.evidence.map(
                    (item) =>
                      `<li>“${escapeHtml(item)}”</li>`,
                  ).join('')}
                </ul>
              `
              : ''
          }
        </div>
      `,
    ).join('');

  const correctionsHtml =
    evaluation.corrections.length
      ? `
        <h2>Korjaukset</h2>

        ${evaluation.corrections.map(
          (correction) => `
            <div style="
              margin-bottom: 9pt;
              padding: 9pt;
              background: #FFF8E5;
              border-radius: 7pt;
              page-break-inside: avoid;
            ">
              <div>
                <strong>Alkuperäinen:</strong>
                ${escapeHtml(correction.original)}
              </div>
              <div>
                <strong>Korjattu:</strong>
                ${escapeHtml(correction.corrected)}
              </div>
              <div>
                <strong>Miksi:</strong>
                ${escapeHtml(correction.explanation)}
              </div>
            </div>
          `,
        ).join('')}
      `
      : '';

  return `
    <section style="
      margin-bottom: 16pt;
      padding: 13pt;
      border-radius: 9pt;
      border: 1px solid #C9D9FF;
      background: #EEF4FF;
    ">
      <div style="
        color: #1F47E8;
        font-size: 9pt;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.5pt;
      ">
        AI-arvioitu harjoittelutaso
      </div>

      <div style="
        font-size: 24pt;
        font-weight: 900;
        margin-top: 3pt;
      ">
        ${escapeHtml(
          displayRoleplayLevel(
            evaluation.estimatedLevel,
          ),
        )}
      </div>

      <div style="
        color: #5C7299;
        font-weight: 700;
      ">
        Luottamus:
        ${Math.round(
          evaluation.confidence * 100,
        )} %
      </div>

      <p>
        ${escapeHtml(
          evaluation.overallSummary,
        )}
      </p>
    </section>

    <section style="
      margin-bottom: 16pt;
      padding: 11pt;
      border-radius: 8pt;
      border: 1px solid #E8CB76;
      background: #FFF8E5;
    ">
      <strong>
        Ei virallinen YKI-tulos
      </strong>

      <p>
        ${escapeHtml(
          evaluation.disclaimer,
        )}
      </p>

      <p>
        Ääntämistä, aksenttia tai
        äänen laatua ei arvioitu.
      </p>
    </section>

    <h2>Arviointikriteerit</h2>
    ${criteriaHtml}

    ${
      evaluation.strengths.length
        ? `
          <h2>Vahvuudet</h2>
          <ul>
            ${evaluation.strengths.map(
              (item) =>
                `<li>${escapeHtml(item)}</li>`,
            ).join('')}
          </ul>
        `
        : ''
    }

    ${
      evaluation.improvements.length
        ? `
          <h2>Tärkeimmät kehityskohteet</h2>
          <ul>
            ${evaluation.improvements.map(
              (item) =>
                `<li>${escapeHtml(item)}</li>`,
            ).join('')}
          </ul>
        `
        : ''
    }

    ${correctionsHtml}

    <h2>
      Kolmen vaiheen harjoitussuunnitelma
    </h2>

    <ol>
      ${evaluation.actionPlan.map(
        (item) =>
          `<li>${escapeHtml(item)}</li>`,
      ).join('')}
    </ol>
  `;
}

// --------------------------------------------------------------------------
// Download helper (web only — React Native would use Share API)
// --------------------------------------------------------------------------

function buildMarkdownReport(report: FeedbackReport): string {
  const lines: string[] = [
    `# Floently – Roleplaysessio`,
    ``,
    `**Skenaario:** ${report.scenario.title}  `,
    `**Taso:** ${report.levelBand}  `,
    `**Harjoittelutyyppi:** ${report.trackLabel}  `,
    `**AI-hahmo:** ${report.personaName}  `,
    ``,
    `---`,
    ``,
    `## Kokonaisarvio`,
    ``,
    report.summary,
    ``,
    ...buildRoleplayEvaluationMarkdown(report),
    `---`,
    ``,
    `## Pisteet`,
    ``,
    `| Mittari | Tulos |`,
    `|---|---|`,
    `| Avainsanojen käyttö (ka) | ${report.scores.avgPhrasesCoverage} / 3 |`,
    `| Sanojen määrä per vuoro (ka) | ${report.scores.avgWordCount} |`,
    `| Korjauskielen käyttö | ${report.scores.repairLanguageUsed ? '✓ Kyllä' : '– Ei'} |`,
    `| Harjoitusvuorot | ${report.scores.totalTurns} |`,
    ``,
    `---`,
    ``,
    `## Kommentoitu litteraatio`,
    ``,
  ];

  for (const turn of report.transcriptAnnotated) {
    const speakerLabel = turn.speaker === 'AI' ? report.personaName : turn.speaker === 'USER' ? 'Sinä' : turn.speaker;
    lines.push(`**${speakerLabel}:** ${turn.text}`);
    if (turn.comment) {
      lines.push(`> 💬 ${turn.comment}`);
    }
    lines.push(``);
  }

  lines.push(`---`, ``);
  lines.push(`## Vahvat ilmaisut`);
  lines.push(``);
  if (report.strongPhrases.length) {
    lines.push(report.strongPhrases.map((p) => `- ${p}`).join('\n'));
  } else {
    lines.push(`_Ei vielä merkittäviä_`);
  }
  lines.push(``);
  lines.push(`## Harjoiteltavat ilmaisut`);
  lines.push(``);
  if (report.difficultPhrases.length) {
    lines.push(report.difficultPhrases.map((p) => `- ${p}`).join('\n'));
  } else {
    lines.push(`_Erinomainen kattavuus!_`);
  }
  lines.push(``);
  lines.push(`## Kielioppihuomiot`);
  lines.push(``);
  for (const obs of report.grammarObservations) {
    lines.push(`- ${obs}`);
  }
  lines.push(``);
  lines.push(`## Seuraavat askeleet`);
  lines.push(``);
  for (const step of report.nextSteps) {
    lines.push(`1. ${step}`);
  }
  lines.push(``, `---`, `_Floently – suomen kielen harjoittelu_`);

  return lines.join('\n');
}

function downloadMarkdown(content: string, filename: string) {
  // Kept for backwards compatibility in case any other code path calls it.
  // Internally delegates to downloadOnWeb (defined below).
  if (typeof Blob === 'undefined' || typeof document === 'undefined') return;
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Issue #5: TXT + PDF export support ─────────────────────────────────────
// Previously the share/download flow only produced .md. Users wanted plain
// text (no markdown markup) and PDF (for sharing with employers, language
// teachers, etc.). The functions below build plaintext and HTML
// representations of the same content; PDF is generated via expo-print's
// printToFileAsync from the HTML.

/** Strip markdown so output reads naturally as plain text. */
function buildPlainTextReport(report: FeedbackReport): string {
  const lines: string[] = [
    `Floently - Harjoittelun yhteenveto`,
    ``,
    `Skenaario:           ${report.scenario?.title ?? 'Roleplay'}`,
    `Taso:                ${report.levelBand}`,
    `Keskustelukumppani:  ${report.personaName}`,
    ``,
    ...buildRoleplayEvaluationPlainText(report),
    `------------------------------------------------------------`,
    ``,
    `Pisteet`,
    `  Avainsanojen kaytto (ka):    ${report.scores.avgPhrasesCoverage} / 3`,
    `  Sanojen maara per vuoro:     ${report.scores.avgWordCount}`,
    `  Korjauskielen kaytto:        ${report.scores.repairLanguageUsed ? 'Kylla' : 'Ei'}`,
    `  Harjoitusvuorot:             ${report.scores.totalTurns}`,
    ``,
    `------------------------------------------------------------`,
    ``,
    `Kommentoitu litteraatio`,
    ``,
  ];
  for (const turn of report.transcriptAnnotated) {
    const speakerLabel = turn.speaker === 'AI' ? report.personaName : turn.speaker === 'USER' ? 'Sina' : turn.speaker;
    lines.push(`${speakerLabel}: ${turn.text}`);
    if (turn.comment) {
      lines.push(`   --> ${turn.comment}`);
    }
    lines.push(``);
  }
  lines.push(`------------------------------------------------------------`);
  lines.push(``);
  lines.push(`Vahvat ilmaisut`);
  lines.push(report.strongPhrases.length ? report.strongPhrases.map((p) => `  - ${p}`).join('\n') : `  Ei viela merkittavia`);
  lines.push(``);
  lines.push(`Harjoiteltavat ilmaisut`);
  lines.push(report.difficultPhrases.length ? report.difficultPhrases.map((p) => `  - ${p}`).join('\n') : `  Erinomainen kattavuus!`);
  lines.push(``);
  if (report.grammarObservations.length) {
    lines.push(`Kielioppihuomiot`);
    for (const obs of report.grammarObservations) {
      lines.push(`  - ${obs}`);
    }
    lines.push(``);
  }
  if (report.nextSteps.length) {
    lines.push(`Seuraavat askeleet`);
    report.nextSteps.forEach((step, i) => lines.push(`  ${i + 1}. ${step}`));
    lines.push(``);
  }
  lines.push(`------------------------------------------------------------`);
  lines.push(`Floently - suomen kielen harjoittelu`);
  return lines.join('\n');
}

/** Plain text variant for live (incomplete) sessions. */
function buildPlainTextLive(messages: TranscriptMessage[], scenarioTitle: string, levelBand: string, personaNameStr: string): string {
  const out: string[] = [
    `Floently - Keskustelun litteraatio`,
    ``,
    `Skenaario:           ${scenarioTitle}`,
    `Taso:                ${levelBand}`,
    `Keskustelukumppani:  ${personaNameStr}`,
    ``,
    `------------------------------------------------------------`,
    ``,
  ];
  for (const m of messages) {
    const label = m.speaker === 'assistant' ? personaNameStr : m.speaker === 'user' ? 'Sina' : 'Jarjestelma';
    out.push(`${label}: ${m.text}`);
  }
  out.push(``);
  out.push(`------------------------------------------------------------`);
  out.push(`Floently - suomen kielen harjoittelu`);
  return out.join('\n');
}

/** Escape HTML-significant characters. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Build a print-ready HTML document for PDF export. */
function buildHtmlReport(report: FeedbackReport): string {
  const turns = report.transcriptAnnotated.map((t) => {
    const label = t.speaker === 'AI' ? report.personaName : t.speaker === 'USER' ? 'Sinä' : t.speaker;
    const isAi = t.speaker === 'AI';
    return `
      <div class="turn ${isAi ? 'turn-ai' : 'turn-user'}">
        <div class="speaker">${escapeHtml(label)}</div>
        <div class="text">${escapeHtml(t.text)}</div>
        ${t.comment ? `<div class="comment">💬 ${escapeHtml(t.comment)}</div>` : ''}
      </div>
    `;
  }).join('\n');
  return `<!doctype html>
<html lang="fi">
<head>
<meta charset="utf-8" />
<title>Floently — ${escapeHtml(report.scenario?.title ?? 'Roleplay')}</title>
<style>
  @page { margin: 24mm 18mm; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
         font-size: 11pt; color: #0A1838; line-height: 1.5; -webkit-print-color-adjust: exact; }
  h1 { font-size: 20pt; margin: 0 0 4pt; letter-spacing: -0.5px; }
  .meta { color: #5C7299; font-size: 10pt; margin-bottom: 18pt; }
  .meta strong { color: #0A1838; font-weight: 700; }
  hr { border: 0; border-top: 1px solid #E1E8F5; margin: 16pt 0; }
  h2 { font-size: 13pt; margin: 18pt 0 8pt; color: #1F47E8; letter-spacing: 0.2px; }
  table.scores { border-collapse: collapse; width: 100%; }
  table.scores td { padding: 6pt 4pt; border-bottom: 1px solid #E1E8F5; font-size: 10.5pt; }
  table.scores td:first-child { color: #5C7299; }
  table.scores td:last-child { text-align: right; font-weight: 700; }
  .turn { margin: 0 0 11pt; padding: 8pt 10pt; border-radius: 8pt; page-break-inside: avoid; }
  .turn-ai { background: #F2F5FB; }
  .turn-user { background: #1F47E81A; }
  .speaker { font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #5C7299; margin-bottom: 4pt; }
  .turn-user .speaker { color: #1F47E8; }
  .text { font-size: 11pt; }
  .comment { margin-top: 6pt; font-style: italic; font-size: 10pt; color: #5C7299; border-left: 2pt solid #3EC5A8; padding-left: 8pt; }
  ul.phrases { margin: 0; padding-left: 18pt; }
  ul.phrases li { margin-bottom: 3pt; }
  .footer { margin-top: 28pt; font-size: 9pt; color: #5C7299; text-align: center; }
</style>
</head>
<body>
  <h1>Floently — Harjoittelun yhteenveto</h1>
  <div class="meta">
    <strong>Skenaario:</strong> ${escapeHtml(report.scenario?.title ?? 'Roleplay')} ·
    <strong>Taso:</strong> ${escapeHtml(report.levelBand)} ·
    <strong>Keskustelukumppani:</strong> ${escapeHtml(report.personaName)}
  </div>
  <hr/>
  ${buildRoleplayEvaluationHtml(report)}
  <h2>Pisteet</h2>
  <table class="scores">
    <tr><td>Avainsanojen käyttö (keskimäärin)</td><td>${report.scores.avgPhrasesCoverage} / 3</td></tr>
    <tr><td>Sanojen määrä per vuoro (keskimäärin)</td><td>${report.scores.avgWordCount}</td></tr>
    <tr><td>Korjauskielen käyttö</td><td>${report.scores.repairLanguageUsed ? '✓ Kyllä' : '– Ei'}</td></tr>
    <tr><td>Harjoitusvuorot</td><td>${report.scores.totalTurns}</td></tr>
  </table>

  <h2>Kommentoitu litteraatio</h2>
  ${turns}

  ${report.strongPhrases.length ? `
    <h2>Vahvat ilmaisut ✓</h2>
    <ul class="phrases">${report.strongPhrases.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}</ul>
  ` : ''}

  ${report.difficultPhrases.length ? `
    <h2>Harjoiteltavat ilmaisut</h2>
    <ul class="phrases">${report.difficultPhrases.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}</ul>
  ` : ''}

  ${report.grammarObservations.length ? `
    <h2>Kielioppihuomiot</h2>
    <ul class="phrases">${report.grammarObservations.map((g) => `<li>${escapeHtml(g)}</li>`).join('')}</ul>
  ` : ''}

  ${report.nextSteps.length ? `
    <h2>Seuraavat askeleet</h2>
    <ol class="phrases">${report.nextSteps.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ol>
  ` : ''}

  <div class="footer">Floently — suomen kielen harjoittelu · YKI · työelämä · integraatio</div>
</body>
</html>`;
}

/** HTML variant for live (incomplete) sessions. */
function buildHtmlLive(messages: TranscriptMessage[], scenarioTitle: string, levelBand: string, personaNameStr: string): string {
  const turns = messages.map((m) => {
    const label = m.speaker === 'assistant' ? personaNameStr : m.speaker === 'user' ? 'Sinä' : 'Järjestelmä';
    const isAi = m.speaker === 'assistant';
    const isSystem = m.speaker === 'system';
    const cls = isSystem ? 'turn turn-system' : isAi ? 'turn turn-ai' : 'turn turn-user';
    return `<div class="${cls}">
      <div class="speaker">${escapeHtml(label)}</div>
      <div class="text">${escapeHtml(m.text)}</div>
    </div>`;
  }).join('\n');
  return `<!doctype html>
<html lang="fi">
<head>
<meta charset="utf-8" />
<title>Floently — ${escapeHtml(scenarioTitle)}</title>
<style>
  @page { margin: 24mm 18mm; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
         font-size: 11pt; color: #0A1838; line-height: 1.5; -webkit-print-color-adjust: exact; }
  h1 { font-size: 20pt; margin: 0 0 4pt; letter-spacing: -0.5px; }
  .meta { color: #5C7299; font-size: 10pt; margin-bottom: 18pt; }
  .meta strong { color: #0A1838; font-weight: 700; }
  hr { border: 0; border-top: 1px solid #E1E8F5; margin: 16pt 0; }
  .turn { margin: 0 0 11pt; padding: 8pt 10pt; border-radius: 8pt; page-break-inside: avoid; }
  .turn-ai { background: #F2F5FB; }
  .turn-user { background: #1F47E81A; }
  .turn-system { background: #FFF8E5; font-style: italic; }
  .speaker { font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #5C7299; margin-bottom: 4pt; }
  .turn-user .speaker { color: #1F47E8; }
  .text { font-size: 11pt; }
  .footer { margin-top: 28pt; font-size: 9pt; color: #5C7299; text-align: center; }
</style>
</head>
<body>
  <h1>Floently — Keskustelun litteraatio</h1>
  <div class="meta">
    <strong>Skenaario:</strong> ${escapeHtml(scenarioTitle)} ·
    <strong>Taso:</strong> ${escapeHtml(levelBand)} ·
    <strong>Keskustelukumppani:</strong> ${escapeHtml(personaNameStr)}
  </div>
  <hr/>
  ${turns}
  <div class="footer">Floently — suomen kielen harjoittelu · YKI · työelämä · integraatio</div>
</body>
</html>`;
}

type ExportFormat = 'md' | 'txt' | 'pdf';

/** Generic web download (any text format). */
function downloadOnWeb(content: string, filename: string, mimeType: string) {
  if (Platform.OS !== 'web' || typeof document === 'undefined' || typeof URL === 'undefined') {
    throw new Error('Web download is only available in the browser.');
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function resolvePersonaName(input: {
  explicit?: string | null;
  scenarioPersona?: string | null;
  fallback?: string;
}): string {
  const explicit = String(input.explicit ?? '').trim();
  if (explicit && explicit.toLowerCase() !== 'ai' && explicit.toLowerCase() !== 'assistant') return explicit;
  const scenarioPersona = String(input.scenarioPersona ?? '').trim();
  if (scenarioPersona && scenarioPersona.toLowerCase() !== 'ai' && scenarioPersona.toLowerCase() !== 'assistant') return scenarioPersona;
  return input.fallback ?? 'AI';
}

// --------------------------------------------------------------------------
// Component
// --------------------------------------------------------------------------

export default function RoleplayConversationScreen({
  levelBand,
  onBack,
  profession,
  contextLabel,
  scenarioId,
  entryMode = 'workplace',
}: {
  levelBand: RoleplayLevelBand;
  onBack: () => void;
  profession: RoleplayProfession;
  contextLabel?: string;
  scenarioId?: string | null;
  entryMode?: 'workplace' | 'interview';
}) {
  const recorder = useRoleplayRecorder('fi-FI');
  const themeMode = usePreferencesStore((state) => state.themeMode);
  const palette = getFloentlyPalette(themeMode);
  const isLight = themeMode === 'light';

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [scenario, setScenario] = useState<RoleplayScenarioSummary | null>(null);
  const [personaName, setPersonaName] = useState<string>('AI');
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [voiceProfile, setVoiceProfile] = useState('yki_standard_female');
  const [loading, setLoading] = useState(true);
  const [pendingOpeningAudio, setPendingOpeningAudio] = useState<{
    sessionId: string;
    text: string;
    voiceProfile?: string;
  } | null>(null);
  const openingAudioPlayedRef = useRef<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [maxTurns, setMaxTurns] = useState(5);
  const [manualText, setManualText] = useState('');
  const [feedbackReport, setFeedbackReport] = useState<FeedbackReport | null>(null);
  const [feedbackLine, setFeedbackLine] = useState<string | null>(null);
  const [missingPhrases, setMissingPhrases] = useState<string[]>([]);
  const [remoteAudioAvailable, setRemoteAudioAvailable] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTranscriptReport, setShowTranscriptReport] = useState(false);
  const [micBusy, setMicBusy] = useState(false);

  // ---- colour tokens ----
  // All tokens resolve through the canonical palette which supports both modes.
  // textOnPrimary differs by mode: dark → navy background (deep text on lighter blue);
  // light → white (on deep blue). Computed once here, passed to children.
  const bgColor = palette.background;
  const cardBg = palette.surface;
  const cardBorder = palette.border;
  const primaryColor = palette.primary;
  const textColor = palette.text;
  const mutedColor = palette.textMuted;
  const accentColor = palette.accent;
  const textOnPrimary = isLight ? '#FFFFFF' : palette.background;

  const detailedEvaluation =
    feedbackReport
      ? roleplayEvaluation(feedbackReport)
      : null;

  // ---- session start ----
  const startSession = useCallback(async (overrideScenarioId?: string) => {
    await stopRoleplayAudioPlayback();

    setLoading(true);
    setError(null);
    setFeedbackReport(null);
    setFeedbackLine(null);
    setMissingPhrases([]);
    setCurrentTurn(0);
    setManualText('');
    setMessages([]);
    setPendingOpeningAudio(null);
    openingAudioPlayedRef.current = null;
    setShowTranscriptReport(false);
    try {
      // Explicit scenario launches keep priority. Ordinary roleplay
      // launches use a persistent shuffled bag so every available scenario
      // appears before the cycle repeats.
      const candidateIds: (string | undefined)[] = [
        overrideScenarioId ?? undefined,
        scenarioId ?? undefined,
        scenarioIdForContext(
          profession,
          contextLabel ??
            (
              entryMode === 'interview'
                ? 'interview'
                : undefined
            ),
        ),
      ];

      const validIds = candidateIds.filter(
        (id) =>
          isScenarioIdValidForProfession(
            id,
            profession,
          ),
      );

      let resolvedScenarioId =
        validIds[0];

      if (!resolvedScenarioId) {
        try {
          const availableScenarios =
            await listRoleplayScenarios(
              profession,
              levelBand,
            );

          resolvedScenarioId =
            await pickRotatingRoleplayScenario({
              profession,
              scenarios: availableScenarios,
              scope: entryMode,
            });
        } catch {
          // Starting the roleplay remains available if the scenario-list
          // request fails. The backend will apply its compatible fallback.
          resolvedScenarioId = undefined;
        }
      }

      const payload = await startRoleplaySession({
        profession,
        levelBand,
        scenarioId: resolvedScenarioId,
        contextLabel:
          contextLabel ??
          (
            entryMode === 'interview'
              ? 'interview'
              : undefined
          ),
      });
      setSessionId(payload.sessionId);
      setScenario(payload.scenario);
      setVoiceProfile(payload.voiceProfile);
      setMaxTurns(payload.maxUserTurns);
      // Use persona name from backend (fallback to 'AI' for old server versions)
      const name = resolvePersonaName({
        explicit: (payload as any).personaName,
        scenarioPersona: (payload as any).scenario?.personaName,
        fallback: personaName,
      });
      setPersonaName(name);

      const openingMessages: TranscriptMessage[] = [
        { id: messageId('system'), speaker: 'system', text: payload.introText },
        { id: messageId('assistant'), speaker: 'assistant', text: payload.openingText },
      ];
      setMessages(openingMessages);
      setPendingOpeningAudio({
        sessionId: payload.sessionId,
        text: payload.openingText,
        voiceProfile: payload.voiceProfile,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start roleplay');
      await uiSounds.error();
    } finally {
      setLoading(false);
    }
  }, [contextLabel, entryMode, levelBand, profession, scenarioId]);

  useEffect(() => {
    if (!AUTO_PLAY_ROLEPLAY_OPENING_AUDIO) return;
    if (loading) return;
    if (!pendingOpeningAudio) return;
    if (feedbackReport) return;

    const key = `${pendingOpeningAudio.sessionId}:${pendingOpeningAudio.text}`;
    if (openingAudioPlayedRef.current === key) return;
    openingAudioPlayedRef.current = key;

    const timer = setTimeout(() => {
      void speakRoleplayText({
        text: pendingOpeningAudio.text,
        voiceProfile: pendingOpeningAudio.voiceProfile,
        onUnavailable: () => setRemoteAudioAvailable(false),
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [feedbackReport, loading, pendingOpeningAudio]);


  useEffect(() => {
    void startSession();
    return () => { void stopRoleplayAudioPlayback(); };
  }, [startSession]);

  // ---- submit transcript ----
  const submitTranscript = useCallback(async (transcript: string) => {
    if (!sessionId || !transcript.trim() || feedbackReport) return;
    setSubmitting(true);
    setError(null);
    try {
      const userMessage: TranscriptMessage = {
        id: messageId('user'),
        speaker: 'user',
        text: transcript.trim(),
      };
      setMessages((cur) => [...cur, userMessage]);

      const response = await submitRoleplayTurn({ sessionId, transcript: transcript.trim() });
      setPersonaName((current) =>
        resolvePersonaName({
          explicit: (response as any).personaName,
          scenarioPersona: scenario?.personaName,
          fallback: current,
        }),
      );
      setCurrentTurn(response.currentUserTurn);
      setFeedbackLine(response.feedbackLine ?? null);
      setMissingPhrases(response.missingPhrases ?? []);

      const aiMessage: TranscriptMessage = {
        id: messageId('assistant'),
        speaker: 'assistant',
        text: response.aiText,
      };
      setMessages((cur) => [...cur, aiMessage]);

      setRemoteAudioAvailable(true);
      await stopRoleplayAudioPlayback();
      await new Promise((resolve) => setTimeout(resolve, 120));
      let ttsCreated = true;
      const playedReplyAudio = await speakRoleplayText({
        text: response.aiText,
        voiceProfile: response.voiceProfile,
        onUnavailable: () => {
          ttsCreated = false;
          setRemoteAudioAvailable(false);
          setFeedbackLine((current) => current ?? 'TTS audio could not be created. Text reply is still shown.');
        },
      });

      if (!playedReplyAudio && ttsCreated) {
        setFeedbackLine((current) => current ?? 'Audio playback was blocked by iOS browser audio rules. Continuing with text.');
      }

      if (response.completed) {
        const finished = await finishRoleplaySession(sessionId);
        // v2 backend returns the full report; v1 returned just summary string
        if (typeof finished === 'object' && 'transcriptAnnotated' in finished) {
          const fullReport = finished as unknown as FeedbackReport;
          setPersonaName((current) =>
            resolvePersonaName({
              explicit: (fullReport as any).personaName,
              scenarioPersona: (fullReport as any).scenario?.personaName,
              fallback: current,
            }),
          );
          setFeedbackReport(fullReport);
        } else {
          // Graceful degradation for old backend
          setFeedbackReport({
            sessionId: sessionId,
            completed: true,
            personaName,
            track: 'general',
            trackLabel: 'Suomen kielen harjoittelu',
            levelBand,
            scenario: scenario!,
            summary: (finished as any).summary ?? '',
            scores: { avgPhrasesCoverage: 0, avgWordCount: 0, repairLanguageUsed: false, totalTurns: currentTurn + 1 },
            transcriptAnnotated: [],
            strongPhrases: (finished as any).strongPhrases ?? [],
            difficultPhrases: (finished as any).difficultPhrases ?? [],
            grammarObservations: [],
            nextSteps: [(finished as any).nextAction ?? ''],
          });
        }
        await uiSounds.success();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit turn');
      await uiSounds.error();
    } finally {
      setSubmitting(false);
      setManualText('');
    }
  }, [sessionId, feedbackReport, personaName, levelBand, scenario, currentTurn]);

  const canSendManual = useMemo(
    () => Boolean(manualText.trim()) && !submitting && !feedbackReport,
    [manualText, submitting, feedbackReport],
  );

  const handleMicTap = useCallback(() => {
    void primeRoleplayAudioPlayback();
    if (submitting || feedbackReport || micBusy || recorder.phase === 'uploading') return;
    void (async () => {
      setMicBusy(true);
      try {
        if (recorder.phase === 'recording') {
          const transcript = await recorder.stopRecording();
          if (transcript) {
              await submitTranscript(transcript);
            }
        } else {
          await stopRoleplayAudioPlayback();

          // The native app previously started tap_soft.wav and mic_on.wav
          // immediately before recording. Their shared iOS audio players
          // interrupted the recorder. Retain the cue only on the web path.
          if (Platform.OS === 'web') {
            await uiSounds.tap();
          }

          await recorder.startRecording();
        }
      } finally {
        setMicBusy(false);
      }
    })();
  }, [feedbackReport, micBusy, recorder, submitTranscript, submitting]);

  // ── Issue #5: Export with format selection ───────────────────────────────
  // Previously this only produced .md. Now the user picks markdown, plain
  // text, or PDF. PDF is generated via expo-print's printToFileAsync from an
  // HTML report. On web we trigger a download; on native we share the file.
  const exportInFormat = useCallback(async (format: ExportFormat) => {
    const reportPersonaName = resolvePersonaName({
      explicit: feedbackReport?.personaName,
      scenarioPersona: feedbackReport?.scenario?.personaName ?? scenario?.personaName,
      fallback: personaName,
    });
    const sid = feedbackReport?.sessionId ?? sessionId ?? 'local';
    const baseFilename = `floently-harjoittelu-${sid.slice(0, 8)}`;

    let content = '';
    let filename = '';
    let mimeType = '';

    if (format === 'md') {
      content = feedbackReport
        ? buildMarkdownReport({ ...feedbackReport, personaName: reportPersonaName })
        : [
            `# Floently – Keskustelun litteraatio`, ``,
            `**Skenaario:** ${scenario?.title ?? 'Roleplay'}  `,
            `**Taso:** ${levelBand}  `,
            `**Keskustelukumppani:** ${reportPersonaName}  `,
            ``, `---`, ``,
            ...messages.map((m) => {
              const label = m.speaker === 'assistant' ? reportPersonaName : m.speaker === 'user' ? 'Sinä' : 'Järjestelmä';
              return `**${label}:** ${m.text}`;
            }),
            ``, `---`, `_Floently – suomen kielen harjoittelu_`,
          ].join('\n');
      filename = `${baseFilename}.md`;
      mimeType = 'text/markdown;charset=utf-8';
    } else if (format === 'txt') {
      content = feedbackReport
        ? buildPlainTextReport({ ...feedbackReport, personaName: reportPersonaName })
        : buildPlainTextLive(messages, scenario?.title ?? 'Roleplay', levelBand, reportPersonaName);
      filename = `${baseFilename}.txt`;
      mimeType = 'text/plain;charset=utf-8';
    } else {
      // PDF — generate via expo-print
      const html = feedbackReport
        ? buildHtmlReport({ ...feedbackReport, personaName: reportPersonaName })
        : buildHtmlLive(messages, scenario?.title ?? 'Roleplay', levelBand, reportPersonaName);

      try {
        if (Platform.OS === 'web' && typeof document !== 'undefined') {
          // expo-print on web isn't reliable across browsers; open a print dialog
          // with the rendered HTML instead. The user can save as PDF from there.
          const w = window.open('', '_blank');
          if (w) {
            w.document.write(html);
            w.document.close();
            // Give layout a tick before triggering print
            setTimeout(() => { try { w.print(); } catch { /* ignore */ } }, 300);
          }
          return;
        }
        // Native: render to a PDF file and share
        const { uri } = await Print.printToFileAsync({ html });
        await Share.share({ title: `${baseFilename}.pdf`, url: uri });
      } catch (err) {
        Alert.alert('Vienti epäonnistui', 'PDF-tiedoston luominen ei onnistunut. Yritä uudelleen tai käytä toista muotoa.');
      }
      return;
    }

    // md / txt path — common file-write + share or web download
    try {
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        downloadOnWeb(content, filename, mimeType);
        return;
      }
      const file = new FileSystem.File(FileSystem.Paths.cache, filename);
      file.create({ intermediates: true, overwrite: true });
      file.write(content);
      await Share.share({ title: filename, message: `Transcript saved: ${file.uri}`, url: file.uri });
    } catch {
      // Last-resort fallback: share as plain message body
      void Share.share({ message: content, title: filename });
    }
  }, [feedbackReport, levelBand, messages, personaName, scenario?.personaName, scenario?.title, sessionId]);

  // Public entry point — show a format picker then call exportInFormat
  const handleDownload = useCallback(() => {
    Alert.alert(
      'Tallenna keskustelu',
      'Valitse tiedostomuoto.',
      [
        { text: 'PDF',         onPress: () => { void exportInFormat('pdf'); } },
        { text: 'Teksti (.txt)', onPress: () => { void exportInFormat('txt'); } },
        { text: 'Markdown (.md)', onPress: () => { void exportInFormat('md'); } },
        { text: 'Peruuta', style: 'cancel' },
      ],
      { cancelable: true },
    );
  }, [exportInFormat]);

  // ---- loading screen ----
  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
        <View style={[styles.loadingWrap, { backgroundColor: bgColor }]}>
          <ActivityIndicator color={primaryColor} size="large" />
          <Text style={[styles.loadingText, { color: mutedColor }]}>Valmistellaan harjoittelua…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <ScrollView
        style={styles.screenScroll}
        contentContainerStyle={styles.screenContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <RoleplayScenarioHeader
          currentTurn={currentTurn}
          levelBand={levelBand}
          maxTurns={maxTurns}
          onBack={onBack}
          profession={profession}
          scenario={scenario}
          personaName={personaName}
        />

        {/* Key phrase pills */}
        <View style={styles.keyPhraseRow}>
          {(scenario?.keyPhrases ?? []).slice(0, 5).map((phrase) => (
            <View
              key={phrase}
              style={[
                styles.keyPhrasePill,
                isLight && { backgroundColor: palette.primarySurface, borderColor: palette.border },
              ]}
            >
              <Text style={[styles.keyPhraseText, isLight && { color: primaryColor }]}>{phrase}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.sessionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          {/* Persona label */}
          <View style={styles.personaRow}>
            <View style={[styles.personaBadge, { backgroundColor: primaryColor + '22' }]}>
              <Text style={[styles.personaText, { color: primaryColor }]}>
                Keskustelukumppani: {personaName}
              </Text>
            </View>
          </View>

          {/* ── Issue #4 fix ───────────────────────────────────────────────
              The live transcript was sometimes collapsing to ~0 height because
              the ScrollView's flex:1 was competing with siblings (manual input,
              action row, mic panel, retention surface) inside a single
              sessionCard. Wrapping in a flex:1 View with a minHeight floor
              guarantees the transcript is always visible during the active
              conversation. We also hide the live transcript once feedbackReport
              is present, since the annotated transcript replaces it at that
              point — showing both was confusing.
          */}
          {!feedbackReport ? (
            <View style={styles.transcriptListWrap}>
              <RoleplayTranscriptList messages={messages} personaName={personaName} />
            </View>
          ) : null}

          {/* Inline status rows */}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {!remoteAudioAvailable ? (
            <Text style={styles.warningText}>TTS ei saatavilla — teksti näkyy silti.</Text>
          ) : null}
          {feedbackLine ? (
            <Text style={[styles.feedbackLine, isLight && { color: palette.text }]}>
              💬 {feedbackLine}
            </Text>
          ) : null}
          {missingPhrases.length ? (
            <Text style={styles.warningText}>
              Kokeile vielä: {missingPhrases.join(', ')}
            </Text>
          ) : null}
          {recorder.error ? <Text style={styles.errorText}>{recorder.error}</Text> : null}

          {/* Manual text input */}
          {!feedbackReport ? (
            <>
              <View style={styles.manualRow}>
                <TextInput
                  placeholder="Kirjoita vastaus tarvittaessa…"
                  placeholderTextColor={isLight ? palette.textSoft : '#7F8BA5'}
                  value={manualText}
                  onChangeText={setManualText}
                  editable={!submitting}
                  style={[
                    styles.input,
                    isLight && {
                      backgroundColor: palette.surfaceMuted,
                      borderColor: palette.border,
                      color: palette.text,
                    },
                  ]}
                  multiline
                />
                <Pressable
                  onPress={() => void submitTranscript(manualText)}
                  disabled={!canSendManual}
                  style={[
                    styles.sendButton,
                    { backgroundColor: primaryColor },
                    !canSendManual && styles.disabledButton,
                  ]}
                >
                  <Text style={styles.sendButtonText}>Lähetä</Text>
                </Pressable>
              </View>

              <View style={styles.actionRow}>
                <View style={[styles.micPanel, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                  <WaveformMicRing
                    phase={recorder.phase}
                    amplitude={recorder.amplitude}
                    themeMode={themeMode}
                    size={260}
                    onPress={handleMicTap}
                    disabled={recorder.phase === 'uploading' || submitting || micBusy || !!feedbackReport}
                  />
                </View>
                <Pressable
                  onPress={() => void stopRoleplayAudioPlayback()}
                  disabled={
                    recorder.phase === 'recording' ||
                    recorder.phase === 'uploading'
                  }
                  style={[
                    styles.secondaryButton,
                    isLight && {
                      backgroundColor: palette.surfaceMuted,
                      borderColor: palette.border,
                    },
                    (
                      recorder.phase === 'recording' ||
                      recorder.phase === 'uploading'
                    ) && styles.disabledButton,
                  ]}
                >
                  <Text
                    style={[
                      styles.secondaryButtonText,
                      { color: mutedColor },
                    ]}
                  >
                    Pysäytä toisto
                  </Text>
                </Pressable>
              </View>
              <Pressable
                onPress={handleDownload}
                style={[
                  styles.secondaryButton,
                  isLight && { backgroundColor: palette.surfaceMuted, borderColor: palette.border },
                ]}
              >
                <Text style={[styles.secondaryButtonText, { color: mutedColor }]}>Lataa litteraatio</Text>
              </Pressable>
            </>
          ) : null}

          {/* ---- FEEDBACK REPORT ---- */}
          {feedbackReport ? (
            <ScrollView style={styles.reportScroll} showsVerticalScrollIndicator={false}>
              <View style={[styles.reportCard, isLight && { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
                <Text style={[styles.reportTitle, { color: textColor }]}>
                  Sessioanalyysi
                </Text>
                <Text style={[styles.reportSummary, { color: mutedColor }]}>
                  {feedbackReport.summary}
                </Text>

                {detailedEvaluation ? (
                  <View
                    style={[
                      styles.deepEvaluationCard,
                      {
                        backgroundColor: cardBg,
                        borderColor: cardBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.deepEyebrow,
                        {
                          color: primaryColor,
                        },
                      ]}
                    >
                      AI-arvioitu harjoittelutaso
                    </Text>

                    <View style={styles.deepLevelRow}>
                      <Text
                        style={[
                          styles.deepLevel,
                          {
                            color: textColor,
                          },
                        ]}
                      >
                        {displayRoleplayLevel(
                          detailedEvaluation.estimatedLevel,
                        )}
                      </Text>

                      <View
                        style={[
                          styles.deepStatusBadge,
                          {
                            backgroundColor:
                              detailedEvaluation.status === 'ready'
                                ? palette.primarySurface
                                : palette.surfaceMuted,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.deepStatusText,
                            {
                              color: primaryColor,
                            },
                          ]}
                        >
                          {detailedEvaluation.status === 'ready'
                            ? 'AI-arvio valmis'
                            : 'Rajoitettu vararaportti'}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={[
                        styles.deepConfidence,
                        {
                          color: primaryColor,
                        },
                      ]}
                    >
                      Luottamus:{' '}
                      {Math.round(
                        detailedEvaluation.confidence
                        * 100,
                      )} %
                    </Text>

                    <Text
                      style={[
                        styles.reportSummary,
                        {
                          color: mutedColor,
                        },
                      ]}
                    >
                      {detailedEvaluation.overallSummary}
                    </Text>

                    <View
                      style={[
                        styles.deepDisclaimer,
                        {
                          borderColor: palette.warning,
                          backgroundColor:
                            isLight
                              ? '#FFF8E5'
                              : palette.surfaceMuted,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.deepDisclaimerTitle,
                          {
                            color: textColor,
                          },
                        ]}
                      >
                        Ei virallinen YKI-tulos
                      </Text>

                      <Text
                        style={[
                          styles.deepDisclaimerText,
                          {
                            color: mutedColor,
                          },
                        ]}
                      >
                        {detailedEvaluation.disclaimer}
                      </Text>

                      <Text
                        style={[
                          styles.deepDisclaimerText,
                          {
                            color: mutedColor,
                          },
                        ]}
                      >
                        Ääntämistä ei arvioitu.
                        Aksenttia, äänen laatua tai
                        akustista sujuvuutta ei pisteytetty.
                      </Text>
                    </View>

                    <View style={styles.deepSection}>
                      <Text
                        style={[
                          styles.deepSectionTitle,
                          {
                            color: textColor,
                          },
                        ]}
                      >
                        Arviointikriteerit
                      </Text>

                      {detailedEvaluation.criteria.map(
                        (criterion) => (
                          <View
                            key={criterion.id}
                            style={[
                              styles.deepCriterionCard,
                              {
                                borderColor: cardBorder,
                                backgroundColor:
                                  isLight
                                    ? palette.surfaceMuted
                                    : palette.surface,
                              },
                            ]}
                          >
                            <View
                              style={styles.deepCriterionHeader}
                            >
                              <Text
                                style={[
                                  styles.deepCriterionName,
                                  {
                                    color: textColor,
                                  },
                                ]}
                              >
                                {criterion.name}
                              </Text>

                              <Text
                                style={[
                                  styles.deepCriterionScore,
                                  {
                                    color: primaryColor,
                                  },
                                ]}
                              >
                                {displayRoleplayScore(
                                  criterion.score,
                                )}
                              </Text>
                            </View>

                            <Text
                              style={[
                                styles.deepCriterionLevel,
                                {
                                  color: primaryColor,
                                },
                              ]}
                            >
                              Taso:{' '}
                              {displayRoleplayLevel(
                                criterion.level,
                              )}
                            </Text>

                            <Text
                              style={[
                                styles.obsLine,
                                {
                                  color: mutedColor,
                                },
                              ]}
                            >
                              {criterion.rationale}
                            </Text>

                            {criterion.evidence.map(
                              (evidence, index) => (
                                <View
                                  key={`${criterion.id}-${index}`}
                                  style={[
                                    styles.deepEvidence,
                                    {
                                      borderLeftColor:
                                        accentColor,
                                      backgroundColor:
                                        isLight
                                          ? '#F2FBF8'
                                          : palette.surfaceMuted,
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.deepEvidenceText,
                                      {
                                        color: mutedColor,
                                      },
                                    ]}
                                  >
                                    “{evidence}”
                                  </Text>
                                </View>
                              ),
                            )}
                          </View>
                        ),
                      )}
                    </View>

                    {detailedEvaluation.strengths.length ? (
                      <View style={styles.deepSection}>
                        <Text
                          style={[
                            styles.deepSectionTitle,
                            {
                              color: textColor,
                            },
                          ]}
                        >
                          Vahvuudet
                        </Text>

                        {detailedEvaluation.strengths.map(
                          (item, index) => (
                            <Text
                              key={`${index}-${item}`}
                              style={[
                                styles.obsLine,
                                {
                                  color: mutedColor,
                                },
                              ]}
                            >
                              • {item}
                            </Text>
                          ),
                        )}
                      </View>
                    ) : null}

                    {detailedEvaluation.improvements.length ? (
                      <View style={styles.deepSection}>
                        <Text
                          style={[
                            styles.deepSectionTitle,
                            {
                              color: textColor,
                            },
                          ]}
                        >
                          Tärkeimmät kehityskohteet
                        </Text>

                        {detailedEvaluation.improvements.map(
                          (item, index) => (
                            <Text
                              key={`${index}-${item}`}
                              style={[
                                styles.obsLine,
                                {
                                  color: mutedColor,
                                },
                              ]}
                            >
                              • {item}
                            </Text>
                          ),
                        )}
                      </View>
                    ) : null}

                    {detailedEvaluation.corrections.length ? (
                      <View style={styles.deepSection}>
                        <Text
                          style={[
                            styles.deepSectionTitle,
                            {
                              color: textColor,
                            },
                          ]}
                        >
                          Korjaukset
                        </Text>

                        {detailedEvaluation.corrections.map(
                          (correction, index) => (
                            <View
                              key={`${index}-${correction.original}`}
                              style={[
                                styles.deepCorrectionCard,
                                {
                                  borderColor: cardBorder,
                                  backgroundColor:
                                    isLight
                                      ? '#FFF8E5'
                                      : palette.surfaceMuted,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.deepCorrectionOriginal,
                                  {
                                    color: mutedColor,
                                  },
                                ]}
                              >
                                {correction.original}
                              </Text>

                              <Text
                                style={[
                                  styles.deepCorrectionArrow,
                                  {
                                    color: primaryColor,
                                  },
                                ]}
                              >
                                →
                              </Text>

                              <Text
                                style={[
                                  styles.deepCorrectionFixed,
                                  {
                                    color: textColor,
                                  },
                                ]}
                              >
                                {correction.corrected}
                              </Text>

                              <Text
                                style={[
                                  styles.obsLine,
                                  {
                                    color: mutedColor,
                                  },
                                ]}
                              >
                                {correction.explanation}
                              </Text>
                            </View>
                          ),
                        )}
                      </View>
                    ) : null}

                    <View style={styles.deepSection}>
                      <Text
                        style={[
                          styles.deepSectionTitle,
                          {
                            color: textColor,
                          },
                        ]}
                      >
                        Kolmen vaiheen harjoitussuunnitelma
                      </Text>

                      {detailedEvaluation.actionPlan.map(
                        (step, index) => (
                          <View
                            key={`${index}-${step}`}
                            style={styles.deepActionRow}
                          >
                            <View
                              style={[
                                styles.deepActionNumber,
                                {
                                  backgroundColor:
                                    primaryColor,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.deepActionNumberText,
                                  {
                                    color: textOnPrimary,
                                  },
                                ]}
                              >
                                {index + 1}
                              </Text>
                            </View>

                            <Text
                              style={[
                                styles.deepActionText,
                                {
                                  color: mutedColor,
                                },
                              ]}
                            >
                              {step}
                            </Text>
                          </View>
                        ),
                      )}
                    </View>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.deepLegacyNotice,
                      {
                        borderColor: cardBorder,
                        backgroundColor:
                          palette.surfaceMuted,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.obsLine,
                        {
                          color: mutedColor,
                        },
                      ]}
                    >
                      Yksityiskohtainen AI-arvio ei ollut
                      saatavilla tälle vanhemmalle raportille.
                    </Text>
                  </View>
                )}

                {/* Score chips */}
                <View style={styles.scoreRow}>
                  <ScoreChip label="Avainsanat" value={`${feedbackReport.scores.avgPhrasesCoverage}/3`} color={primaryColor} />
                  <ScoreChip label="Sanat/vuoro" value={`${feedbackReport.scores.avgWordCount}`} color={primaryColor} />
                  <ScoreChip label="Korjauskieli" value={feedbackReport.scores.repairLanguageUsed ? '✓' : '–'} color={primaryColor} />
                </View>

                {/* Annotated transcript toggle */}
                <Pressable
                  onPress={() => setShowTranscriptReport((v) => !v)}
                  style={[styles.toggleButton, { borderColor: cardBorder }]}
                >
                  <Text style={[styles.toggleButtonText, { color: primaryColor }]}>
                    {showTranscriptReport ? 'Piilota litterointi' : 'Näytä kommentoitu litterointi'}
                  </Text>
                </Pressable>

                {showTranscriptReport && (
                  <View style={styles.transcriptReport}>
                    {feedbackReport.transcriptAnnotated.map((turn, idx) => (
                      <View key={idx} style={styles.annotatedTurn}>
                        <Text style={[styles.annotatedSpeaker, { color: primaryColor }]}>
                          {turn.speaker === 'AI' ? personaName : turn.speaker === 'USER' ? 'Sinä' : turn.speaker}
                        </Text>
                        <Text style={[styles.annotatedText, { color: textColor }]}>{turn.text}</Text>
                        {turn.comment ? (
                          <Text style={[styles.annotatedComment, { color: mutedColor }]}>
                            💬 {turn.comment}
                          </Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                )}

                {/* Strong / difficult phrases */}
                {feedbackReport.strongPhrases.length ? (
                  <View style={styles.phraseSection}>
                    <Text style={[styles.phraseSectionTitle, { color: textColor }]}>Vahvat ilmaisut ✓</Text>
                    <Text style={[styles.phraseList, { color: mutedColor }]}>
                      {feedbackReport.strongPhrases.join(' · ')}
                    </Text>
                  </View>
                ) : null}
                {feedbackReport.difficultPhrases.length ? (
                  <View style={styles.phraseSection}>
                    <Text style={[styles.phraseSectionTitle, { color: textColor }]}>Harjoiteltavat ilmaisut</Text>
                    <Text style={[styles.phraseList, { color: mutedColor }]}>
                      {feedbackReport.difficultPhrases.join(' · ')}
                    </Text>
                  </View>
                ) : null}

                {/* Grammar observations */}
                {feedbackReport.grammarObservations.length ? (
                  <View style={styles.phraseSection}>
                    <Text style={[styles.phraseSectionTitle, { color: textColor }]}>Kielioppihuomiot</Text>
                    {feedbackReport.grammarObservations.map((obs, i) => (
                      <Text key={i} style={[styles.obsLine, { color: mutedColor }]}>• {obs}</Text>
                    ))}
                  </View>
                ) : null}

                {/* Next steps */}
                {feedbackReport.nextSteps.length ? (
                  <View style={styles.phraseSection}>
                    <Text style={[styles.phraseSectionTitle, { color: textColor }]}>Seuraavat askeleet</Text>
                    {feedbackReport.nextSteps.map((step, i) => (
                      <Text key={i} style={[styles.obsLine, { color: mutedColor }]}>{i + 1}. {step}</Text>
                    ))}
                  </View>
                ) : null}

                {/* Retention surface — streak, next-scenario CTA, share, secondaries */}
                <SessionCompletion
                  personaName={personaName}
                  profession={profession}
                  completedScenarioId={feedbackReport.scenario?.id ?? scenario?.id ?? null}
                  completedScenarioTitle={feedbackReport.scenario?.title ?? scenario?.title ?? null}
                  onStartSession={(id) => { void startSession(id); }}
                  onDownloadReport={handleDownload}
                  palette={{
                    text: textColor,
                    muted: mutedColor,
                    primary: primaryColor,
                    border: cardBorder,
                    surface: cardBg,
                    success: palette.success,
                    textOnPrimary,
                  }}
                />
              </View>
            </ScrollView>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --------------------------------------------------------------------------
// Sub-component
// --------------------------------------------------------------------------

function ScoreChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[scoreChipStyles.chip, { borderColor: color + '44' }]}>
      <Text style={[scoreChipStyles.value, { color }]}>{value}</Text>
      <Text style={scoreChipStyles.label}>{label}</Text>
    </View>
  );
}

const scoreChipStyles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 72,
  },
  value: { fontSize: 18, fontWeight: '800' },
  label: { fontSize: 10, color: '#7F8BA5', marginTop: 2, fontWeight: '600' },
});

// --------------------------------------------------------------------------
// Styles
// --------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  screenScroll: { flex: 1 },
  screenContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 120,
    gap: spacing.md,
  },
  container: { flex: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, gap: spacing.md },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { color: colors.textMuted, ...typography.body },

  keyPhraseRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  keyPhrasePill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#101C35',
    borderWidth: 1,
    borderColor: '#223352',
  },
  keyPhraseText: { color: '#D9E4FF', fontSize: 12, fontWeight: '700' },

  sessionCard: {
    borderRadius: 28,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },

  personaRow: { flexDirection: 'row' },
  personaBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  personaText: { fontSize: 12, fontWeight: '700' },

  // ── Issue #4 fix — guarantee transcript visibility during active session ──
  // flex: 1 lets the transcript take all available vertical space inside the
  // sessionCard, while minHeight protects against collapse if siblings grow.
  transcriptListWrap: {
    minHeight: 180,
    maxHeight: 260,
  },

  manualRow: { gap: 10 },
  input: {
    minHeight: 92,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    backgroundColor: '#0D1529',
    textAlignVertical: 'top',
  },
  sendButton: {
    alignSelf: 'flex-end',
    minHeight: 40,
    borderRadius: 999,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  disabledButton: { opacity: 0.45 },
  sendButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },

  actionRow: { alignItems: 'center', gap: 14 },
  micPanel: {
    width: '100%',
    minHeight: 280,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  secondaryButton: {
    minHeight: 38,
    borderRadius: 999,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: '#0F1A31',
    borderWidth: 1,
    borderColor: '#223252',
  },
  secondaryButtonText: { fontSize: 13, fontWeight: '800' },

  errorText: { color: colors.danger, ...typography.bodySm },
  warningText: { color: colors.warning, ...typography.bodySm },
  feedbackLine: { color: '#D6E2FF', ...typography.bodySm, fontWeight: '700' },

  // Report
  reportScroll: { flex: 1 },
  reportCard: {
    gap: 14,
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#101A30',
    borderWidth: 1,
    borderColor: '#223252',
  },
  reportTitle: { ...typography.h3, color: colors.text },
  reportSummary: { ...typography.bodySm, lineHeight: 20 },

  deepEvaluationCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 15,
    gap: 12,
  },

  deepEyebrow: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  deepLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },

  deepLevel: {
    flexGrow: 1,
    fontSize: 30,
    fontWeight: '900',
  },

  deepStatusBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  deepStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },

  deepConfidence: {
    fontSize: 13,
    fontWeight: '800',
  },

  deepDisclaimer: {
    borderRadius: 13,
    borderWidth: 1,
    padding: 12,
    gap: 5,
  },

  deepDisclaimerTitle: {
    fontSize: 13,
    fontWeight: '900',
  },

  deepDisclaimerText: {
    fontSize: 12,
    lineHeight: 18,
  },

  deepSection: {
    gap: 8,
  },

  deepSectionTitle: {
    fontSize: 14,
    fontWeight: '900',
  },

  deepCriterionCard: {
    borderRadius: 13,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },

  deepCriterionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  deepCriterionName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
  },

  deepCriterionScore: {
    fontSize: 13,
    fontWeight: '900',
  },

  deepCriterionLevel: {
    fontSize: 11,
    fontWeight: '800',
  },

  deepEvidence: {
    borderLeftWidth: 3,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  deepEvidenceText: {
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
  },

  deepCorrectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 11,
    gap: 4,
  },

  deepCorrectionOriginal: {
    fontSize: 12,
    textDecorationLine: 'line-through',
  },

  deepCorrectionArrow: {
    fontSize: 14,
    fontWeight: '900',
  },

  deepCorrectionFixed: {
    fontSize: 13,
    fontWeight: '800',
  },

  deepActionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },

  deepActionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  deepActionNumberText: {
    fontSize: 11,
    fontWeight: '900',
  },

  deepActionText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },

  deepLegacyNotice: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 11,
  },

  scoreRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },

  toggleButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignSelf: 'flex-start',
  },
  toggleButtonText: { fontSize: 13, fontWeight: '700' },

  transcriptReport: { gap: 12, marginTop: 4 },
  annotatedTurn: { gap: 3 },
  annotatedSpeaker: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  annotatedText: { ...typography.bodySm, lineHeight: 18 },
  annotatedComment: { fontSize: 11, fontStyle: 'italic', lineHeight: 16, marginTop: 2 },

  phraseSection: { gap: 4 },
  phraseSectionTitle: { ...typography.bodySm, fontWeight: '800' },
  phraseList: { ...typography.bodySm, lineHeight: 20 },
  obsLine: { ...typography.bodySm, lineHeight: 19 },

  reportActions: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 4 },
  downloadButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    minHeight: 40,
    justifyContent: 'center',
  },
  downloadButtonText: { fontSize: 13, fontWeight: '800' },
  restartButton: {
    borderRadius: 999,
    paddingHorizontal: 16,
    minHeight: 40,
    justifyContent: 'center',
  },
  restartButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
