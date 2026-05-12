function trimUrl(value: string | undefined, fallback: string): string {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

export const LEGAL_URLS = {
  privacyPolicy: trimUrl(process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL, "/learn/privacy"),
  termsOfUse: trimUrl(process.env.EXPO_PUBLIC_TERMS_URL, "/learn/terms"),
  support: trimUrl(process.env.EXPO_PUBLIC_SUPPORT_URL, "/learn/support"),
  accountDeletion: trimUrl(process.env.EXPO_PUBLIC_ACCOUNT_DELETION_URL, "/learn/delete-account"),
} as const;
