import React from 'react';
import { Asset } from 'expo-asset';
import { Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LEGAL_URLS } from '../../config/legalUrls';

type LegalPageKind = 'privacy-policy' | 'terms-of-use' | 'support' | 'account-deletion';

type Section = {
  title: string;
  body?: string;
  bullets?: string[];
};

type DocumentPageContent = {
  variant: 'document';
  title: string;
  updatedAt: string;
  sections: Section[];
};

type SpotlightPageContent = {
  variant: 'spotlight';
  title: string;
  badge: string;
  subtitle: string;
  rows: string[];
  primaryLabel: string;
  primaryHref: string;
};

type PageContent = DocumentPageContent | SpotlightPageContent;

const LOGO = require('../../components/public/logo.png');
const LOGO_ASSET = Asset.fromModule(LOGO);
const FLOENTLY_HOME_URL = 'https://floently.com/';
const LEARN_HOME_URL = 'https://learn.floently.com/';
const SUPPORT_CONTACT_URL = 'mailto:pilots@floently.com?subject=Floently%20support%20request';
const ACCOUNT_DELETION_CONTACT_URL = 'mailto:pilots@floently.com?subject=Floently%20account%20deletion%20request';

const PAGE_CONTENT: Record<LegalPageKind, PageContent> = {
  'privacy-policy': {
    variant: 'document',
    title: 'Floently Finnish Privacy Policy',
    updatedAt: 'Last updated: 2026-04-24',
    sections: [
      {
        title: '1. Scope',
        body: 'Floently Finnish processes account data and learning activity to provide speaking, roleplay, YKI, and pathway features.',
      },
      {
        title: '2. Data We Process',
        bullets: [
          'Account data: email, authentication metadata, optional display name.',
          'Voice and transcript data: short speaking recordings/references and transcriptions used for feedback and progression.',
          'Learning usage data: session, pathway, entitlement, and feature-usage events.',
          'Device/app telemetry required for security, reliability, and abuse prevention.',
        ],
      },
      {
        title: '3. Purposes',
        bullets: [
          'Authenticate users and secure sessions.',
          'Deliver speaking and pathway functionality.',
          'Apply subscription/entitlement access controls.',
          'Support reliability, debugging, and incident response.',
        ],
      },
      {
        title: '4. Processors and Infrastructure',
        bullets: [
          'Hosting: Hetzner-based backend infrastructure.',
          'Additional processor details (owner fill): [OWNER_FILL_PROCESSOR_LIST].',
        ],
      },
      {
        title: '5. Retention',
        bullets: [
          'Operational records are retained only as long as needed for service delivery, security, billing, or legal obligations.',
          'Account deletion requests are initiated in-app and processed with target completion within 24 hours, subject to legal retention obligations.',
        ],
      },
      {
        title: '6. User Rights',
        body: 'Users can request account deletion in-app through Settings -> Delete Account. Public account deletion information is available at https://learn.floently.com/account-deletion',
      },
      {
        title: '7. Contact',
        bullets: [
          'Support: https://learn.floently.com/support',
          'Privacy contact (owner fill): [OWNER_FILL_PRIVACY_CONTACT_EMAIL]',
        ],
      },
      {
        title: '8. Policy Updates',
        body: 'This policy may be updated as product, legal, or processor requirements change.',
      },
    ],
  },
  'terms-of-use': {
    variant: 'document',
    title: 'Floently Finnish Terms of Use',
    updatedAt: 'Last updated: 2026-04-24',
    sections: [
      { title: '1. Service', body: 'Floently Finnish provides language learning pathways including YKI-focused and profession-focused speaking practice.' },
      { title: '2. Accounts', body: 'Users are responsible for maintaining account credentials and lawful use of the service.' },
      {
        title: '3. Subscriptions and Billing',
        bullets: [
          'iOS app builds use Apple In-App Purchase for digital access.',
          'Android app builds use Google Play Billing for digital access.',
          'Web checkout flows are web-only and are not presented as mobile in-app digital checkout.',
        ],
      },
      {
        title: '4. Cancellation and Renewal',
        body: 'Subscription renewal and cancellation are managed through the relevant store account (Apple App Store or Google Play) for mobile-origin purchases.',
      },
      {
        title: '5. Account Deletion',
        body: 'Users can initiate permanent account deletion inside the app from Settings -> Delete Account. Processing target is up to 24 hours, subject to legal retention obligations.',
      },
      { title: '6. Acceptable Use', body: 'Do not abuse, reverse engineer, or misuse the platform.' },
      {
        title: '7. Warranty and Liability',
        body: 'Service is provided as available, subject to applicable law. Add jurisdiction-specific clauses before production publication.',
      },
      {
        title: '8. Company Details (Owner Fill)',
        bullets: [
          'Legal entity: [OWNER_FILL_COMPANY_LEGAL_NAME]',
          'Address: [OWNER_FILL_COMPANY_ADDRESS]',
          'Contact: [OWNER_FILL_COMPANY_CONTACT]',
        ],
      },
    ],
  },
  support: {
    variant: 'spotlight',
    badge: 'FLOENTLY FINNISH • LEGAL READINESS',
    title: 'Floently Finnish Support',
    subtitle: 'Support for YKI readiness, workplace Finnish pathways, and account access issues.',
    rows: [
      'Use this route as the public support destination for product and account questions.',
      'Support scope includes sign-in issues, billing access questions, and guidance for learn pathways.',
      'Final support email and response-time commitments will be published here before launch.',
    ],
    primaryLabel: 'Contact Floently',
    primaryHref: SUPPORT_CONTACT_URL,
  },
  'account-deletion': {
    variant: 'spotlight',
    badge: 'FLOENTLY FINNISH • LEGAL READINESS',
    title: 'Floently Finnish Account Deletion',
    subtitle: 'Account deletion details for learners who need the same public legal surface and support path as the support page.',
    rows: [
      'Open the Floently app, go to Settings, tap Delete Account, and confirm the deletion request.',
      'Active sessions and account-linked access are invalidated, and personal data is removed from active application stores where applicable.',
      'Deletion requests are normally completed within 24 hours, subject to legal retention, fraud prevention, and accounting obligations.',
      'Deleting your account does not cancel an active App Store or Google Play subscription. Store subscription management must be handled separately.',
    ],
    primaryLabel: 'Contact Floently',
    primaryHref: ACCOUNT_DELETION_CONTACT_URL,
  },
};

type Props = {
  page: LegalPageKind;
};

function FooterLinks() {
  return (
    <View style={styles.footerLinks}>
      <FooterLink label="Privacy" href={LEGAL_URLS.privacyPolicy} />
      <FooterLink label="Terms" href={LEGAL_URLS.termsOfUse} />
      <FooterLink label="Support" href={LEGAL_URLS.support} />
      <FooterLink label="Account Deletion" href={LEGAL_URLS.accountDeletion} />
    </View>
  );
}

function FooterLink({ label, href }: { label: string; href: string }) {
  return (
    <Pressable onPress={() => { void Linking.openURL(href); }} style={styles.footerLinkButton}>
      <Text style={styles.footerLinkText}>{label}</Text>
    </Pressable>
  );
}

function TopBar() {
  return (
    <View style={styles.topBar}>
      <Pressable onPress={() => { void Linking.openURL(LEARN_HOME_URL); }} style={styles.logoButton}>
        {Platform.OS === 'web'
          ? React.createElement('img', {
              src: LOGO_ASSET.uri,
              alt: 'Floently',
              style: styles.webLogo as unknown as React.CSSProperties,
            })
          : <Image source={LOGO} style={styles.topLogo} resizeMode="contain" accessibilityIgnoresInvertColors />}
      </Pressable>
      <View style={styles.topActions}>
        <Pressable onPress={() => { void Linking.openURL(LEARN_HOME_URL); }} style={styles.ghostButton}>
          <Text style={styles.ghostButtonText}>Back to Learn</Text>
        </Pressable>
        <Pressable onPress={() => { void Linking.openURL(FLOENTLY_HOME_URL); }} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Floently Home</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function LegalPage({ page }: Props) {
  const content = PAGE_CONTENT[page];

  if (content.variant === 'spotlight') {
    return (
      <ScrollView style={styles.page} contentContainerStyle={styles.spotlightContent}>
        <View style={styles.spotlightShell}>
          <TopBar />

          <View style={styles.heroCard}>
            <Text style={styles.heroBadge}>{content.badge}</Text>
            <Text style={styles.heroTitle}>{content.title}</Text>
            <Text style={styles.heroSubtitle}>{content.subtitle}</Text>

            <View style={styles.heroRows}>
              {content.rows.map((row) => (
                <View key={row} style={styles.heroRow}>
                  <Text style={styles.heroRowText}>{row}</Text>
                </View>
              ))}
            </View>

            <Pressable onPress={() => { void Linking.openURL(content.primaryHref); }} style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>{content.primaryLabel}</Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerCopy}>© 2026 Floently · Floently Finnish</Text>
            <FooterLinks />
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.spotlightContent}>
      <View style={styles.spotlightShell}>
        <TopBar />

        <View style={styles.heroCard}>
          <Text style={styles.heroBadge}>FLOENTLY FINNISH • LEGAL READINESS</Text>
          <View style={styles.documentHeader}>
            <Text style={styles.documentTitle}>{content.title}</Text>
            <Text style={styles.documentUpdatedAt}>{content.updatedAt}</Text>
          </View>

          <View style={styles.documentPanel}>
            {content.sections.map((section) => (
              <View key={section.title} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.body ? <Text style={styles.body}>{section.body}</Text> : null}
                {section.bullets ? (
                  <View style={styles.bullets}>
                    {section.bullets.map((bullet) => (
                      <Text key={bullet} style={styles.bullet}>• {bullet}</Text>
                    ))}
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerCopy}>© 2026 Floently · Floently Finnish</Text>
          <FooterLinks />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#050811',
  },
  spotlightContent: {
    flexGrow: 1,
    paddingHorizontal: 36,
    paddingTop: 48,
    paddingBottom: 64,
  },
  spotlightShell: {
    flex: 1,
    width: '100%',
    maxWidth: 1500,
    alignSelf: 'center',
    minHeight: 920,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 96,
  },
  topLogo: {
    width: 128,
    height: 84,
  },
  webLogo: {
    width: 128,
    height: 84,
    objectFit: 'contain',
    display: 'block',
  },
  logoButton: {
    borderRadius: 12,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 14,
  },
  ghostButton: {
    minHeight: 46,
    paddingHorizontal: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#111A33',
    backgroundColor: '#060B1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostButtonText: {
    color: '#E5ECFF',
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButton: {
    minHeight: 46,
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: '#2A1CE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#F7F8FF',
    fontSize: 14,
    fontWeight: '700',
  },
  heroCard: {
    width: '100%',
    maxWidth: 980,
    alignSelf: 'center',
    backgroundColor: '#070C20',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#0D1530',
    paddingHorizontal: 36,
    paddingVertical: 34,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#07144A',
    borderWidth: 1,
    borderColor: '#11236D',
    color: '#7EA7FF',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 18,
  },
  heroTitle: {
    color: '#F5F7FF',
    fontSize: 42,
    lineHeight: 50,
    fontWeight: '800',
    marginBottom: 18,
  },
  heroSubtitle: {
    color: '#93A0C3',
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 28,
    maxWidth: 760,
  },
  heroRows: {
    gap: 14,
    marginBottom: 24,
  },
  heroRow: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#0C1636',
    backgroundColor: '#081028',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  heroRowText: {
    color: '#A9B4CF',
    fontSize: 15,
    lineHeight: 24,
  },
  ctaButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingHorizontal: 26,
    borderRadius: 999,
    backgroundColor: '#2A1CE6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2A1CE6',
    shadowOpacity: 0.25,
    shadowRadius: 18,
  },
  ctaButtonText: {
    color: '#F7F8FF',
    fontSize: 14,
    fontWeight: '800',
  },
  footer: {
    paddingTop: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 20,
  },
  footerCopy: {
    color: '#59627D',
    fontSize: 13,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  footerLinkButton: {
    paddingVertical: 4,
  },
  footerLinkText: {
    color: '#7D86A2',
    fontSize: 13,
  },
  documentContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 40,
  },
  documentShell: {
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
    gap: 20,
  },
  documentHeader: {
    gap: 6,
    marginBottom: 20,
  },
  documentTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: '#F5F7FF',
  },
  documentPanel: {
    backgroundColor: '#081028',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#0C1636',
    gap: 18,
  },
  documentUpdatedAt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#95A7C6',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  section: {
    gap: 8,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    color: '#F3F7FF',
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    color: '#C4D1E8',
  },
  bullets: {
    gap: 6,
  },
  bullet: {
    fontSize: 15,
    lineHeight: 23,
    color: '#C4D1E8',
  },
});
