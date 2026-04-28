export const typography = {
  hero: { fontSize: 28, fontWeight: '700' as const },
  h1: { fontSize: 24, fontWeight: '700' as const },
  h2: { fontSize: 20, fontWeight: '600' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  bodySm: { fontSize: 14, fontWeight: '400' as const },
  label: { fontSize: 12, fontWeight: '600' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
} as const;

export const legacyTypography = { h1: 28, h2: 22, h3: 18, body: 16, caption: 13 } as const;
