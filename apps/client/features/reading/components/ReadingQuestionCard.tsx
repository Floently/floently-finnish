import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { FloentlyPalette } from '@ui/theme/floentlyPalette';

import type {
  ReadingAnswerAttempt,
  ReadingQuestion,
  ReadingResponse,
  ReadingScaffolding,
} from '../readingEngine';

type ReadingQuestionCardProps = {
  palette: FloentlyPalette;
  question: ReadingQuestion;
  questionNumber: number;
  questionCount: number;
  scaffolding: ReadingScaffolding;
  lastAttempt: ReadingAnswerAttempt | null;
  acceptingAnswers: boolean;
  onSubmit: (response: ReadingResponse) => void;
  onRetry: () => void;
  onContinue: () => void;
};

function moveItem(order: string[], index: number, offset: -1 | 1) {
  const nextIndex = index + offset;
  if (nextIndex < 0 || nextIndex >= order.length) return order;
  const next = [...order];
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  return next;
}

export function ReadingQuestionCard({
  palette,
  question,
  questionNumber,
  questionCount,
  scaffolding,
  lastAttempt,
  acceptingAnswers,
  onSubmit,
  onRetry,
  onContinue,
}: ReadingQuestionCardProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [sequenceOrder, setSequenceOrder] = useState<string[]>(
    question.type === 'sequencing' ? question.items.map((item) => item.id) : [],
  );
  const [pairs, setPairs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!acceptingAnswers) return;
    setSelectedOptionId(null);
    setSequenceOrder(
      question.type === 'sequencing' ? question.items.map((item) => item.id) : [],
    );
    setPairs({});
  }, [acceptingAnswers, question]);

  const choiceQuestion =
    question.type === 'detail' ||
    question.type === 'main_idea' ||
    question.type === 'contextual_vocabulary' ||
    question.type === 'inference'
      ? question
      : null;

  const response = useMemo<ReadingResponse | null>(() => {
    if (
      question.type === 'detail' ||
      question.type === 'main_idea' ||
      question.type === 'contextual_vocabulary' ||
      question.type === 'inference'
    ) {
      return selectedOptionId ? { kind: 'choice', optionId: selectedOptionId } : null;
    }
    if (question.type === 'sequencing') {
      return { kind: 'sequence', order: sequenceOrder };
    }
    if (question.type === 'matching') {
      return Object.keys(pairs).length === question.prompts.length
        ? { kind: 'matching', pairs }
        : null;
    }
    return null;
  }, [pairs, question, selectedOptionId, sequenceOrder]);

  const chooseMatch = (promptId: string, matchId: string) => {
    setPairs((current) => {
      const next = Object.fromEntries(
        Object.entries(current).filter(
          ([existingPromptId, existingMatchId]) =>
            existingPromptId !== promptId && existingMatchId !== matchId,
        ),
      );
      return { ...next, [promptId]: matchId };
    });
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: palette.surface, borderColor: palette.border },
      ]}
    >
      <View style={styles.questionHeader}>
        <Text style={[styles.counter, { color: palette.accent }]}>
          Kysymys {questionNumber}/{questionCount}
        </Text>
        <Text
          accessibilityRole="header"
          accessibilityLiveRegion="polite"
          style={[styles.prompt, { color: palette.text }]}
        >
          {question.prompt}
        </Text>
        {scaffolding.showStrategyHints && question.strategyHint ? (
          <View style={[styles.hint, { backgroundColor: palette.primarySurface }]}>
            <Text style={[styles.hintLabel, { color: palette.primary }]}>Lukuvihje</Text>
            <Text style={[styles.hintText, { color: palette.text }]}>
              {question.strategyHint}
            </Text>
          </View>
        ) : null}
      </View>

      {choiceQuestion ? (
        <View accessibilityRole="radiogroup" style={styles.options}>
          {choiceQuestion.options.map((option) => {
            const selected = selectedOptionId === option.id;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="radio"
                accessibilityLabel={option.label}
                accessibilityState={{ checked: selected, disabled: !acceptingAnswers }}
                disabled={!acceptingAnswers}
                onPress={() => setSelectedOptionId(option.id)}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: selected
                      ? palette.primarySurfaceStrong
                      : pressed
                        ? palette.surfaceMuted
                        : palette.background,
                    borderColor: selected ? palette.primary : palette.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.radioDot,
                    {
                      backgroundColor: selected ? palette.primary : 'transparent',
                      borderColor: selected ? palette.primary : palette.borderStrong,
                    },
                  ]}
                />
                <Text style={[styles.optionText, { color: palette.text }]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {question.type === 'sequencing' ? (
        <View style={styles.options} accessibilityLabel="Järjestettävät vaiheet">
          {sequenceOrder.map((itemId, index) => {
            const item = question.items.find((candidate) => candidate.id === itemId);
            if (!item) return null;
            return (
              <View
                key={item.id}
                style={[
                  styles.sequenceRow,
                  { backgroundColor: palette.background, borderColor: palette.border },
                ]}
              >
                <View style={[styles.orderNumber, { backgroundColor: palette.primarySurface }]}>
                  <Text style={[styles.orderNumberText, { color: palette.primary }]}>{index + 1}</Text>
                </View>
                <Text style={[styles.sequenceText, { color: palette.text }]}>{item.label}</Text>
                <View style={styles.sequenceActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Siirrä vaihe ${index + 1} ylöspäin`}
                    accessibilityState={{ disabled: !acceptingAnswers || index === 0 }}
                    disabled={!acceptingAnswers || index === 0}
                    onPress={() => setSequenceOrder((order) => moveItem(order, index, -1))}
                    style={({ pressed }) => [
                      styles.moveButton,
                      {
                        backgroundColor: pressed ? palette.primarySurface : palette.surfaceMuted,
                        opacity: index === 0 ? 0.45 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.moveButtonText, { color: palette.text }]}>Ylös</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Siirrä vaihe ${index + 1} alaspäin`}
                    accessibilityState={{
                      disabled: !acceptingAnswers || index === sequenceOrder.length - 1,
                    }}
                    disabled={!acceptingAnswers || index === sequenceOrder.length - 1}
                    onPress={() => setSequenceOrder((order) => moveItem(order, index, 1))}
                    style={({ pressed }) => [
                      styles.moveButton,
                      {
                        backgroundColor: pressed ? palette.primarySurface : palette.surfaceMuted,
                        opacity: index === sequenceOrder.length - 1 ? 0.45 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.moveButtonText, { color: palette.text }]}>Alas</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {question.type === 'matching' ? (
        <View style={styles.matchingList}>
          {question.prompts.map((prompt) => (
            <View
              key={prompt.id}
              style={[
                styles.matchingGroup,
                { backgroundColor: palette.background, borderColor: palette.border },
              ]}
            >
              <Text style={[styles.matchingPrompt, { color: palette.text }]}>{prompt.label}</Text>
              <View accessibilityRole="radiogroup" style={styles.matchOptions}>
                {question.matches.map((match) => {
                  const selected = pairs[prompt.id] === match.id;
                  return (
                    <Pressable
                      key={match.id}
                      accessibilityRole="radio"
                      accessibilityLabel={`${prompt.label}: ${match.label}`}
                      accessibilityState={{ checked: selected, disabled: !acceptingAnswers }}
                      disabled={!acceptingAnswers}
                      onPress={() => chooseMatch(prompt.id, match.id)}
                      style={({ pressed }) => [
                        styles.matchOption,
                        {
                          backgroundColor: selected
                            ? palette.primarySurfaceStrong
                            : pressed
                              ? palette.surfaceMuted
                              : palette.surface,
                          borderColor: selected ? palette.primary : palette.border,
                        },
                      ]}
                    >
                      <Text style={[styles.matchOptionText, { color: palette.text }]}>
                        {match.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {lastAttempt ? (
        <View
          accessibilityLiveRegion="polite"
          style={[
            styles.feedback,
            {
              backgroundColor: lastAttempt.correct ? palette.accentSoft : palette.surfaceMuted,
              borderColor: lastAttempt.correct ? palette.success : palette.danger,
            },
          ]}
        >
          <Text
            style={[
              styles.feedbackHeading,
              { color: lastAttempt.correct ? palette.success : palette.danger },
            ]}
          >
            {lastAttempt.correct ? 'Oikein' : 'Ei vielä'}
          </Text>
          <Text style={[styles.feedbackText, { color: palette.text }]}>
            {lastAttempt.correct ? question.feedback.correct : question.feedback.incorrect}
          </Text>
        </View>
      ) : null}

      {acceptingAnswers ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tarkista vastaus"
          accessibilityState={{ disabled: !response }}
          disabled={!response}
          onPress={() => response && onSubmit(response)}
          style={({ pressed }) => [
            styles.primaryButton,
            {
              backgroundColor: pressed ? palette.primaryPressed : palette.primary,
              opacity: response ? 1 : 0.5,
            },
          ]}
        >
          <Text style={[styles.primaryButtonText, { color: palette.background }]}>Tarkista vastaus</Text>
        </Pressable>
      ) : lastAttempt?.correct ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={questionNumber === questionCount ? 'Näytä tulos' : 'Seuraava kysymys'}
          onPress={onContinue}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: pressed ? palette.primaryPressed : palette.primary },
          ]}
        >
          <Text style={[styles.primaryButtonText, { color: palette.background }]}>
            {questionNumber === questionCount ? 'Näytä tulos' : 'Seuraava kysymys'}
          </Text>
        </Pressable>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Korjaa vastaus"
          onPress={onRetry}
          style={({ pressed }) => [
            styles.secondaryButton,
            {
              backgroundColor: pressed ? palette.primarySurface : 'transparent',
              borderColor: palette.primary,
            },
          ]}
        >
          <Text style={[styles.secondaryButtonText, { color: palette.primary }]}>Korjaa vastaus</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    gap: 20,
  },
  questionHeader: {
    gap: 10,
  },
  counter: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  prompt: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '800',
  },
  hint: {
    borderRadius: 12,
    padding: 14,
    gap: 3,
  },
  hintLabel: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  hintText: {
    fontSize: 15,
    lineHeight: 23,
  },
  options: {
    gap: 11,
  },
  option: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  sequenceRow: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  orderNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderNumberText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },
  sequenceText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  sequenceActions: {
    flexDirection: 'row',
    gap: 10,
  },
  moveButton: {
    minHeight: 48,
    minWidth: 76,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  moveButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  matchingList: {
    gap: 14,
  },
  matchingGroup: {
    borderRadius: 15,
    borderWidth: 1,
    padding: 14,
    gap: 11,
  },
  matchingPrompt: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '800',
  },
  matchOptions: {
    gap: 8,
  },
  matchOption: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 11,
    justifyContent: 'center',
  },
  matchOptionText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  feedback: {
    borderRadius: 14,
    borderLeftWidth: 4,
    padding: 16,
    gap: 5,
  },
  feedbackHeading: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '900',
  },
  feedbackText: {
    fontSize: 16,
    lineHeight: 24,
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  primaryButtonText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  secondaryButton: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  secondaryButtonText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
});
