import type { CardDomain, CardProfession, RuntimeCard, RuntimeCardState } from '@core/api/cards';

export type CardMode = 'vocabulary' | 'grammar' | 'phrases';

export type CardDeckScope = {
  domain?: CardDomain;
  profession?: CardProfession | null;
  level?: string | null;
  adaptive?: boolean;
  source?: string | null;
};

export type CardFeedback = {
  correct: boolean;
  explanation?: string | null;
  correctAnswer: string;
  acceptedVariants: string[];
};

export type CardBankBuckets = {
  difficult: RuntimeCard[];
  learned: RuntimeCard[];
  learning: RuntimeCard[];
};

export type { RuntimeCard, RuntimeCardState };
