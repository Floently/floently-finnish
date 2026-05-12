import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

type LegalPageKind = 'privacy-policy' | 'terms-of-use' | 'support' | 'account-deletion';

type Section = {
  title: string;
  body?: string;
  bullets?: string[];
};

const PAGE_CONTENT: Record<LegalPageKind, { title: string; updatedAt: string; sections: Section[] }> = {
  'privacy-policy': {
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
    title: 'Floently Finnish Support',
    updatedAt: 'Last updated: 2026-04-24',
    sections: [
      {
        title: 'Support URL for store listings',
        body: 'https://learn.floently.com/support',
      },
      {
        title: 'Support Scope',
        bullets: [
          'Account and login issues',
          'Subscription access issues',
          'Speaking/recording issues',
          'Account deletion confirmation and status',
        ],
      },
      {
        title: 'Contact',
        bullets: [
          'Support email (owner fill): [OWNER_FILL_SUPPORT_EMAIL]',
          'Response target (owner fill): [OWNER_FILL_SUPPORT_SLA]',
        ],
      },
      {
        title: 'Account Deletion',
        body: 'Deletion can be initiated directly inside the app at Settings -> Delete Account.',
      },
    ],
  },
  'account-deletion': {
    title: 'Account Deletion Information',
    updatedAt: 'Last updated: 2026-04-24',
    sections: [
      {
        title: 'How to delete your account',
        bullets: ['Open the app.', 'Go to Settings.', 'Tap Delete Account.', 'Confirm deletion.'],
      },
      {
        title: 'What happens after deletion',
        bullets: [
          'Account access tokens and sessions are invalidated.',
          'Account-linked personal data is removed from active application stores and linked tables where applicable.',
          'Some records may be retained when required by law, fraud prevention, or accounting obligations.',
        ],
      },
      {
        title: 'Timeline',
        body: 'Deletion requests are normally completed within 24 hours.',
      },
      {
        title: 'Subscriptions',
        bullets: [
          'Deleting your account does not automatically cancel an active store subscription.',
          'Manage cancellations in Apple App Store subscriptions (iOS) or Google Play subscriptions (Android).',
        ],
      },
      {
        title: 'Contact',
        body: 'Support: https://learn.floently.com/support',
      },
    ],
  },
};

type Props = {
  page: LegalPageKind;
};

const LOGO = require('../../components/public/logo.png');

export default function LegalPage({ page }: Props) {
  const content = PAGE_CONTENT[page];

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.shell}>
        <View style={styles.header}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" accessibilityIgnoresInvertColors />
          <Text style={styles.eyebrow}>LEGAL</Text>
          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.updatedAt}>{content.updatedAt}</Text>
        </View>

        <View style={styles.card}>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#050811',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 40,
  },
  shell: {
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
    gap: 20,
  },
  header: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
  },
  logo: {
    width: 220,
    height: 146,
  },
  eyebrow: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '800',
    color: '#5A85FF',
    letterSpacing: 1.6,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: '#F3F7FF',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#0A0F1C',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#182235',
    gap: 18,
  },
  updatedAt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#95A7C6',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    textAlign: 'center',
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
