import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getFloentlyPalette, type FloentlyThemeMode } from '@ui/theme/floentlyPalette';

// ─── Types ────────────────────────────────────────────────────────────────────

type DrawerItem = {
  label: string;
  hint?: string;
  icon?: string;
  accentColor?: string;
  onPress: () => void;
};

type DrawerSection = {
  label: string;
  items: DrawerItem[];
};

type Props = {
  visible: boolean;
  onClose: () => void;
  /**
   * Structured sections (new API).  Each section has a heading + items.
   * Replaces the flat `items` array from v1.
   */
  sections?: DrawerSection[];
  /**
   * Flat items list kept for backward compatibility.
   * If `sections` is provided it takes priority.
   */
  items?: DrawerItem[];
  themeMode?: FloentlyThemeMode;
  onToggleTheme?: () => void;
  isAuthenticated?: boolean;
  userName?: string;
  userEmail?: string;
  /** User avatar URL.  Falls back to initials when absent. */
  avatarUri?: string | null;
  /** Displayed in the profile hero area (e.g. "12:27"). */
  clockLabel?: string;
  /** Badge label shown next to the user's name (e.g. "B1–B2 · YKI prep"). */
  levelLabel?: string;
  /** Streak day count.  Hidden when 0. */
  streakDays?: number;
  onAuthAction?: () => void;
  languageLabel?: string;
  languageControl?: React.ReactNode;
  themeLabel?: string;
  sessionLabel?: string;
  signInLabel?: string;
  signOutLabel?: string;
  darkModeLabel?: string;
  lightModeLabel?: string;
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function UtilityDrawer({
  visible,
  onClose,
  sections: sectionsProp,
  items: itemsProp,
  themeMode = 'dark',
  onToggleTheme,
  isAuthenticated = false,
  userName = 'Learner',
  userEmail = '',
  avatarUri,
  clockLabel,
  levelLabel,
  streakDays = 0,
  onAuthAction,
  languageLabel = 'Language',
  languageControl,
  themeLabel = 'Theme',
  sessionLabel = 'Session',
  signInLabel = 'Log in',
  signOutLabel = 'Log out',
  darkModeLabel = 'Dark mode',
  lightModeLabel = 'Light mode',
}: Props) {
  const palette = getFloentlyPalette(themeMode);
  const isDark = themeMode === 'dark';

  // Resolve sections: prefer explicit sections, fall back to wrapping flat items
  const sections: DrawerSection[] = sectionsProp && sectionsProp.length > 0
    ? sectionsProp
    : itemsProp && itemsProp.length > 0
      ? [{ label: 'Main paths', items: itemsProp }]
      : [];

  const initials = userName.trim().slice(0, 1).toUpperCase() || 'K';

  // Colour tokens — works for both themes
  const bg        = isDark ? '#111B30' : palette.surface;
  const borderCol = isDark ? '#1E2E47' : palette.border;
  const textCol   = isDark ? '#F0F5FF' : palette.text;
  const mutedCol  = isDark ? '#8EA3C3' : palette.textMuted;
  const softCol   = isDark ? '#5C7299' : palette.textSoft;
  const raisedBg  = isDark ? '#16233E' : palette.surfaceMuted;
  const primary   = isDark ? '#4F7FFF' : palette.primary;
  const primaryDim = isDark ? 'rgba(79,127,255,0.15)' : palette.primarySurface;
  const overlayBg = isDark ? 'rgba(2,8,20,0.62)' : palette.overlay;

  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay]}>
        <Pressable
          style={[styles.backdrop, { backgroundColor: overlayBg }]}
          onPress={onClose}
        />

        <View style={[styles.drawer, { backgroundColor: bg, borderLeftColor: borderCol }]}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Hero / profile ────────────────────────────────────────── */}
            <View style={[styles.hero, { backgroundColor: primary }]}>
              <View style={styles.heroTopRow}>
                {clockLabel ? (
                  <View style={styles.clockPill}>
                    <Text style={styles.clockText}>{clockLabel}</Text>
                  </View>
                ) : <View />}
                <Pressable onPress={onClose} style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.profileRow}>
                {/* Avatar: image if provided, else initials */}
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={[styles.avatarInitial, { color: primary }]}>{initials}</Text>
                  </View>
                )}

                <View style={styles.profileText}>
                  <Text style={styles.profileName}>{userName}</Text>
                  {userEmail ? <Text style={styles.profileEmail}>{userEmail}</Text> : null}
                  {levelLabel ? (
                    <View style={styles.levelBadge}>
                      <View style={styles.levelDot} />
                      <Text style={styles.levelText}>{levelLabel}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            {/* ── Streak ────────────────────────────────────────────────── */}
            {streakDays > 0 && (
              <View style={[styles.streakRow, {
                backgroundColor: isDark ? '#3A2E12' : '#FFF5DA',
                borderColor: isDark ? 'rgba(240,200,109,0.2)' : '#F0C86D',
              }]}>
                <Text style={styles.streakFire}>🔥</Text>
                <Text style={[styles.streakLabel, { color: isDark ? '#F0C86D' : '#8A5A00' }]}>
                  Day streak
                </Text>
                <Text style={[styles.streakNum, { color: isDark ? '#F0C86D' : '#8A5A00' }]}>
                  {streakDays}
                </Text>
              </View>
            )}

            {/* ── Navigation sections ───────────────────────────────────── */}
            {sections.map((section) => (
              <View key={section.label} style={styles.navSection}>
                <Text style={[styles.sectionLabel, { color: softCol }]}>{section.label}</Text>
                {section.items.map((item) => (
                  <Pressable
                    key={item.label}
                    onPress={() => { onClose(); item.onPress(); }}
                    style={({ pressed }) => [
                      styles.navItem,
                      { borderColor: borderCol },
                      pressed && { backgroundColor: raisedBg },
                    ]}
                  >
                    <View style={[
                      styles.navIcon,
                      { backgroundColor: item.accentColor ? `${item.accentColor}20` : raisedBg },
                    ]}>
                      <Text style={styles.navIconText}>{item.icon ?? '•'}</Text>
                    </View>
                    <View style={styles.navItemContent}>
                      <Text style={[styles.navLabel, { color: textCol }]}>{item.label}</Text>
                      {item.hint ? (
                        <Text style={[styles.navHint, { color: mutedCol }]}>{item.hint}</Text>
                      ) : null}
                    </View>
                  </Pressable>
                ))}
              </View>
            ))}

            {/* ── Theme + Auth utility row ──────────────────────────────── */}
            {languageControl ? (
              <View style={[styles.utilCard, { backgroundColor: raisedBg, borderColor: borderCol, marginBottom: 12 }]}>
                <Text style={[styles.utilTitle, { color: textCol }]}>{languageLabel}</Text>
                {languageControl}
              </View>
            ) : null}

            <View style={[styles.utilRow, { borderTopColor: borderCol }]}>
              <View style={[styles.utilCard, { backgroundColor: raisedBg, borderColor: borderCol }]}>
                <Text style={[styles.utilTitle, { color: textCol }]}>{themeLabel}</Text>
                <View style={styles.themeRow}>
                  <Text style={[styles.utilHint, { color: mutedCol }]}>
                    {isDark ? darkModeLabel : lightModeLabel}
                  </Text>
                  <Pressable
                    onPress={() => onToggleTheme?.()}
                    style={[styles.toggleTrack, { backgroundColor: isDark ? primary : borderCol }]}
                  >
                    <View style={[styles.toggleThumb, { transform: [{ translateX: isDark ? 18 : 2 }] }]} />
                  </Pressable>
                </View>
              </View>

              <View style={[styles.utilCard, {
                backgroundColor: isDark ? '#3A2E12' : palette.accentSoft,
                borderColor: borderCol,
              }]}>
                <Text style={[styles.utilTitle, { color: textCol }]}>{sessionLabel}</Text>
                <Pressable
                  onPress={() => { onClose(); onAuthAction?.(); }}
                  style={[styles.authBtn, { backgroundColor: bg }]}
                >
                  <Text style={[styles.authBtnText, {
                    color: isAuthenticated ? '#FF6B6B' : primary,
                  }]}>
                    {isAuthenticated ? signOutLabel : signInLabel}
                  </Text>
                </Pressable>
              </View>
            </View>

          </ScrollView>
        </View>
      </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: { flexDirection: 'row', zIndex: 1000 },
  backdrop: { flex: 1 },
  drawer: {
    width: '82%',
    minHeight: '100%',
    borderTopLeftRadius: 26,
    borderBottomLeftRadius: 26,
    borderLeftWidth: 1,
    overflow: 'hidden',
  },
  scrollContent: { paddingBottom: 28 },

  // Hero
  hero: { paddingHorizontal: 18, paddingTop: 28, paddingBottom: 20, gap: 16 },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clockPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  clockText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarImage: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF' },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 22, fontWeight: '800' },
  profileText: { flex: 1, gap: 3 },
  profileName: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  profileEmail: { color: 'rgba(255,255,255,0.78)', fontSize: 12 },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginTop: 2,
  },
  levelDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3EC58A' },
  levelText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  // Streak
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 14,
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  streakFire: { fontSize: 16 },
  streakLabel: { flex: 1, fontSize: 13, fontWeight: '600' },
  streakNum: { fontSize: 20, fontWeight: '800' },

  // Nav sections
  navSection: { paddingHorizontal: 12, paddingTop: 16, gap: 2 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 4,
    paddingHorizontal: 6,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
  },
  navIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  navIconText: { fontSize: 14 },
  navItemContent: { flex: 1, gap: 1 },
  navLabel: { fontSize: 14, fontWeight: '700' },
  navHint: { fontSize: 11, lineHeight: 15 },

  // Utility row
  utilRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 16,
    borderTopWidth: 1,
    marginTop: 8,
  },
  utilCard: { flex: 1, borderRadius: 16, padding: 13, borderWidth: 1, gap: 9 },
  utilTitle: { fontSize: 13, fontWeight: '800' },
  utilHint: { fontSize: 12 },
  themeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleTrack: { width: 44, height: 26, borderRadius: 13, justifyContent: 'center' },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF', position: 'absolute' },
  authBtn: {
    alignSelf: 'flex-start',
    minHeight: 32,
    borderRadius: 999,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authBtnText: { fontSize: 12, fontWeight: '800' },
});
