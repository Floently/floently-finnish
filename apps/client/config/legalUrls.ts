import { getCanonicalLegalPath, resolvePublicLearnUrl } from './legalRoutes';

export const LEGAL_URLS = {
  privacyPolicy: resolvePublicLearnUrl(process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL, getCanonicalLegalPath('privacy-policy')),
  termsOfUse: resolvePublicLearnUrl(process.env.EXPO_PUBLIC_TERMS_URL, getCanonicalLegalPath('terms-of-use')),
  support: resolvePublicLearnUrl(process.env.EXPO_PUBLIC_SUPPORT_URL, getCanonicalLegalPath('support')),
  accountDeletion: resolvePublicLearnUrl(process.env.EXPO_PUBLIC_ACCOUNT_DELETION_URL, getCanonicalLegalPath('account-deletion')),
} as const;
