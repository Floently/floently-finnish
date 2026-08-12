function trimUrl(value: string | undefined, fallback: string): string {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

export const LEGAL_URLS = {
  privacyPolicy: trimUrl(process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL, "https://www.kielivalmis.com/privacy"),
  termsOfUse: trimUrl(process.env.EXPO_PUBLIC_TERMS_URL, "https://www.kielivalmis.com/terms"),
  support: trimUrl(process.env.EXPO_PUBLIC_SUPPORT_URL, "https://www.kielivalmis.com/support"),
  accountDeletion: trimUrl(process.env.EXPO_PUBLIC_ACCOUNT_DELETION_URL, "https://www.kielivalmis.com/delete-account"),
} as const;
