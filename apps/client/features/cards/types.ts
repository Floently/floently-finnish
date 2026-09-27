import type { CardDomain, CardProfession, RuntimeCard, RuntimeCardState } from '@core/api/cards';

export type CardMode = 'vocabulary' | 'grammar' | 'phrases';
export type CardLevelBand = 'A1_A2' | 'B1_B2' | 'C1_C2';

export type CardDeckScope = {
  domain?: CardDomain;
  profession?: CardProfession | null;
  level?: CardLevelBand | string | null;
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
