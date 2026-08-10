import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image as RNImage,
  type ImageStyle,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PUBLIC_LANGUAGE_FLAGS, PUBLIC_LANGUAGES } from '../../web/i18n/publicMarketingCopy';
import { usePreferencesStore } from '../../state/preferencesStore';
import {
  asKieliValmisLanguage,
  getKieliValmisCopy,
  isKieliValmisRtl,
  type KieliValmisLanguage,
} from './kielivalmisCopy';

const KIELIVALMIS_MARK = require('../../../kielivalmis-domain-static/r4m/assets/kielivalmis-mark.png');
const KIELIVALMIS_HERO = require('../../../kielivalmis-domain-static/r4m/assets/kielivalmis-hero-ai.webp');

export default function KieliValmisLandingScreen() {
  const language = usePreferencesStore((state) => state.language);
  const setLanguage = usePreferencesStore((state) => state.setLanguage);
  const code = asKieliValmisLanguage(language);
  const copy = useMemo(() => getKieliValmisCopy(code), [code]);
  const rtl = isKieliValmisRtl(code);
  const { width } = useWindowDimensions();
  const compact = width < 720;
  const twoColumn = width >= 900;
  const [languageOpen, setLanguageOpen] = useState(false);
  const heroMotion = useRef(new Animated.Value(0)).current;
  const waveMotion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const heroLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(heroMotion, { toValue: 1, duration: 4200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(heroMotion, { toValue: 0, duration: 4200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    const waveLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(waveMotion, { toValue: 1, duration: 760, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(waveMotion, { toValue: 0, duration: 760, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    heroLoop.start();
    waveLoop.start();
    return () => { heroLoop.stop(); waveLoop.stop(); };
  }, [heroMotion, waveMotion]);

  const textDirection = rtl ? styles.rtlText : styles.ltrText;
  const selectedLanguage = PUBLIC_LANGUAGES.find((item) => item.code === code) ?? PUBLIC_LANGUAGES[0];
  const imageMotion = {
    transform: [
      { translateY: heroMotion.interpolate({ inputRange: [0, 1], outputRange: [0, compact ? -2 : -6] }) },
      { scale: heroMotion.interpolate({ inputRange: [0, 1], outputRange: [1, compact ? 1.006 : 1.014] }) },
    ],
  };

  const titleSize = compact ? 25 : 40;
  const lineHeight = compact ? 29 : 45;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.nav, rtl && styles.rowReverse]}>
          <View style={[styles.brand, rtl && styles.rowReverse]}>
            <RNImage source={KIELIVALMIS_MARK} style={styles.brandMark as ImageStyle} resizeMode="contain" />
            <View style={rtl ? styles.brandCopyRtl : undefined}>
              <Text style={styles.brandName}>KieliValmis</Text>
              <Text style={styles.brandBy}>BY FLOENTLY</Text>
            </View>
          </View>
          <Pressable style={[styles.languageButton, rtl && styles.rowReverse]} onPress={() => setLanguageOpen(true)} accessibilityRole="button" accessibilityLabel={copy.chooseLanguage}>
            <Text style={styles.languageFlag}>{PUBLIC_LANGUAGE_FLAGS[selectedLanguage.code] ?? '🌐'}</Text>
            <Text style={styles.languageLabel}>{selectedLanguage.label}</Text>
            <Text style={styles.chevron}>▾</Text>
          </Pressable>
        </View>

        <View style={[styles.heroGrid, twoColumn && styles.heroGridWide, rtl && twoColumn && styles.rowReverse]}>
          <View style={styles.heroCopy}>
            <Text style={[styles.kicker, textDirection]}>{copy.heroKicker}</Text>
            <View style={styles.titleWrap}>
              <Text style={[styles.heroTitle, textDirection, { fontSize: titleSize, lineHeight }]}>{copy.heroTitleA}</Text>
              <Text style={[styles.heroTitle, textDirection, { fontSize: titleSize, lineHeight }]}>{copy.heroTitleB}</Text>
              <Text style={[styles.heroAccent, textDirection, { fontSize: titleSize, lineHeight }]}>{copy.heroTitleC}</Text>
            </View>

            {!compact && <Text style={[styles.lead, textDirection]}>{copy.heroLead}</Text>}
          </View>

          <Animated.View style={[styles.photoShell, imageMotion]}>
            <ExpoImage source={KIELIVALMIS_HERO} style={styles.heroImage as ImageStyle} contentFit="cover" transition={180} accessibilityLabel={copy.aiLabel} />
            <View style={[styles.feedbackPill, rtl ? styles.feedbackPillRtl : styles.feedbackPillLtr, rtl && styles.rowReverse]}>
              <View style={styles.readyDot}><Text style={styles.readyCheck}>✓</Text></View>
              <Text style={styles.feedbackText}>{copy.overlayFeedback} · {copy.overlayReady}</Text>
            </View>
            <View style={[styles.speakOverlay, rtl ? styles.speakRtl : styles.speakLtr]}>
              <Text style={[styles.speakLabel, textDirection]}>{copy.overlaySpeak}</Text>
              <View style={[styles.waveRow, rtl && styles.rowReverse]}>
                {[0,1,2,3,4,5,6,7,8,9,10,11].map((index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.waveBar,
                      { transform: [{ scaleY: waveMotion.interpolate({ inputRange: [0,1], outputRange: [index % 3 === 0 ? .45 : .75, index % 2 === 0 ? 1.55 : 1.15] }) }] },
                    ]}
                  />
                ))}
              </View>
            </View>
            <Text style={[styles.aiBadge, rtl ? styles.aiBadgeRtl : styles.aiBadgeLtr]}>{copy.aiLabel}</Text>
          </Animated.View>

          {compact && <Text style={[styles.lead, textDirection]}>{copy.heroLead}</Text>}
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.primaryButton} onPress={() => router.push('/auth/register' as never)}><Text style={styles.primaryText}>{copy.start}</Text></Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => router.push('/auth/login' as never)}><Text style={styles.secondaryText}>{getPublicSignIn(code)}</Text></Pressable>
        </View>
        <Text style={[styles.transitionNote, textDirection]}>{copy.transition}</Text>

        <View style={styles.divider} />

        <Text style={[styles.sectionKicker, textDirection]}>{copy.pathKicker}</Text>
        <Text style={[styles.sectionTitle, textDirection]}>{copy.pathTitle}</Text>
        <Text style={[styles.sectionBody, textDirection]}>{copy.pathBody}</Text>

        <View style={styles.cards}>
          {[
            [copy.card1Title, copy.card1Body],
            [copy.card2Title, copy.card2Body],
            [copy.card3Title, copy.card3Body],
          ].map(([title, body], index) => (
            <View key={title} style={styles.card}>
              <Text style={styles.cardNumber}>0{index + 1}</Text>
              <Text style={[styles.cardTitle, textDirection]}>{title}</Text>
              <Text style={[styles.cardBody, textDirection]}>{body}</Text>
            </View>
          ))}
        </View>

        <View style={styles.splitRow}>
          <View style={[styles.splitCard, styles.ykiCard]}><Text style={styles.splitTag}>YKI</Text><Text style={[styles.splitTitleLight, textDirection]}>{copy.ykiTitle}</Text><Text style={[styles.splitBodyLight, textDirection]}>{copy.ykiBody}</Text></View>
          <View style={[styles.splitCard, styles.workCard]}><Text style={styles.splitTagDark}>{copy.navWork}</Text><Text style={[styles.splitTitleDark, textDirection]}>{copy.workTitle}</Text><Text style={[styles.splitBodyDark, textDirection]}>{copy.workBody}</Text></View>
        </View>

        <View style={styles.languageSection}>
          <Text style={[styles.sectionKickerDark, textDirection]}>{copy.langKicker}</Text>
          <Text style={[styles.sectionTitleDark, textDirection]}>{copy.langTitle}</Text>
          <Text style={[styles.sectionBodyDark, textDirection]}>{copy.langBody}</Text>
          <View style={[styles.languageChips, rtl && styles.rowReverse]}>
            {PUBLIC_LANGUAGES.map((item) => <Text key={item.code} style={styles.languageChip}>{PUBLIC_LANGUAGE_FLAGS[item.code] ?? '🌐'} {item.label}</Text>)}
          </View>
          <Text style={[styles.languageNote, textDirection]}>{copy.langNote}</Text>
        </View>

        <View style={styles.finalCard}>
          <Text style={[styles.finalTitle, textDirection]}>{copy.finalTitle}</Text>
          <Text style={[styles.finalBody, textDirection]}>{copy.finalBody}</Text>
          <Pressable style={styles.finalButton} onPress={() => router.push('/auth/register' as never)}><Text style={styles.finalButtonText}>{copy.start}</Text></Pressable>
          <Text style={[styles.footerCopy, textDirection]}>{copy.footerCopy}</Text>
        </View>
      </ScrollView>

      <Modal visible={languageOpen} transparent animationType="fade" onRequestClose={() => setLanguageOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setLanguageOpen(false)}>
          <Pressable style={styles.languageModal} onPress={() => {}}>
            <Text style={[styles.modalTitle, textDirection]}>{copy.chooseLanguage}</Text>
            <ScrollView style={styles.languageList}>
              {PUBLIC_LANGUAGES.map((item) => {
                const active = item.code === code;
                return <Pressable key={item.code} style={[styles.languageOption, active && styles.languageOptionActive, rtl && styles.rowReverse]} onPress={async () => { await setLanguage(item.code as any); setLanguageOpen(false); }}><Text style={styles.languageFlag}>{PUBLIC_LANGUAGE_FLAGS[item.code] ?? '🌐'}</Text><Text style={[styles.languageOptionText, active && styles.languageOptionTextActive]}>{item.label}</Text></Pressable>;
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function getPublicSignIn(code: KieliValmisLanguage): string {
  const labels: Record<KieliValmisLanguage,string> = {
    en:'Sign in',fi:'Kirjaudu',sv:'Logga in',et:'Logi sisse',es:'Iniciar sesión',tr:'Giriş yap',ru:'Войти',uk:'Увійти',ar:'تسجيل الدخول',zh:'登录',ku:'Têkeve',vi:'Đăng nhập',bn:'সাইন ইন',sq:'Hyr',tl:'Mag-sign in',th:'เข้าสู่ระบบ',so:'Gal',ne:'साइन इन',fa:'ورود',ur:'سائن اِن',
  };
  return labels[code];
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#06172f'},scroll:{paddingHorizontal:20,paddingTop:10,paddingBottom:38},nav:{minHeight:58,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,borderBottomWidth:1,borderBottomColor:'rgba(255,255,255,.09)',marginBottom:26},brand:{flexDirection:'row',alignItems:'center',gap:8,flexShrink:1},brandMark:{width:34,height:34},brandName:{color:'#F9FCFF',fontSize:15,fontWeight:'700',letterSpacing:-.3},brandBy:{marginTop:3,color:'#73E1DB',fontSize:6.5,fontWeight:'900',letterSpacing:1.2},brandCopyRtl:{alignItems:'flex-end'},languageButton:{minHeight:36,maxWidth:138,flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:9,borderRadius:11,borderWidth:1,borderColor:'rgba(255,255,255,.16)',backgroundColor:'rgba(255,255,255,.07)'},languageFlag:{fontSize:15},languageLabel:{flexShrink:1,color:'#F5F9FF',fontSize:10,fontWeight:'800'},chevron:{color:'#C7D6EC',fontSize:10},rowReverse:{flexDirection:'row-reverse'},heroGrid:{gap:18},heroGridWide:{flexDirection:'row',alignItems:'center',gap:34},heroCopy:{flex:1,minWidth:0},kicker:{color:'#70E3DC',fontSize:9,fontWeight:'900',letterSpacing:1.1,textTransform:'uppercase',marginBottom:11},titleWrap:{gap:1},heroTitle:{color:'#F9FCFF',fontWeight:'600',letterSpacing:-.8},heroAccent:{alignSelf:'flex-start',color:'#70E3DC',fontWeight:'700',letterSpacing:-.7,backgroundColor:'rgba(100,226,218,.10)',paddingHorizontal:5,borderRadius:8,overflow:'hidden'},lead:{color:'#C7D4E7',fontSize:13.5,lineHeight:21,marginTop:12},photoShell:{flex:1,minWidth:0,position:'relative',borderRadius:20,borderWidth:1,borderColor:'rgba(255,255,255,.14)',backgroundColor:'rgba(255,255,255,.05)',padding:6,overflow:'visible'},heroImage:{width:'100%',aspectRatio:640/350,borderRadius:14,backgroundColor:'#0B1C38'},feedbackPill:{position:'absolute',top:15,flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:9,paddingVertical:7,borderRadius:13,borderWidth:1,borderColor:'rgba(133,205,234,.24)',backgroundColor:'rgba(5,24,51,.88)'},feedbackPillLtr:{right:11},feedbackPillRtl:{left:11},readyDot:{width:20,height:20,borderRadius:10,backgroundColor:'#23C6AA',alignItems:'center',justifyContent:'center'},readyCheck:{color:'#fff',fontSize:11,fontWeight:'900'},feedbackText:{color:'#fff',fontSize:8,fontWeight:'800'},speakOverlay:{position:'absolute',bottom:17,width:178,paddingHorizontal:10,paddingVertical:9,borderRadius:12,borderWidth:1,borderColor:'rgba(133,205,234,.22)',backgroundColor:'rgba(5,24,51,.88)'},speakLtr:{left:12},speakRtl:{right:12},speakLabel:{color:'#B9CBEA',fontSize:8,fontWeight:'800',marginBottom:5},waveRow:{height:17,flexDirection:'row',alignItems:'center',gap:3},waveBar:{width:2,height:9,borderRadius:2,backgroundColor:'#61DDD5'},aiBadge:{position:'absolute',bottom:10,color:'#E5EDF8',fontSize:6.5,backgroundColor:'rgba(4,13,29,.70)',paddingHorizontal:6,paddingVertical:4,borderRadius:8,overflow:'hidden'},aiBadgeLtr:{right:11},aiBadgeRtl:{left:11},actions:{marginTop:20,gap:8},primaryButton:{minHeight:45,borderRadius:13,backgroundColor:'#4F79F2',alignItems:'center',justifyContent:'center'},primaryText:{color:'#fff',fontSize:13,fontWeight:'900'},secondaryButton:{minHeight:43,borderRadius:13,borderWidth:1,borderColor:'rgba(255,255,255,.17)',backgroundColor:'rgba(255,255,255,.04)',alignItems:'center',justifyContent:'center'},secondaryText:{color:'#D4DEED',fontSize:12.5,fontWeight:'800'},transitionNote:{marginTop:12,color:'#9FB0C9',fontSize:9.5,lineHeight:15},divider:{height:1,backgroundColor:'rgba(255,255,255,.09)',marginVertical:31},sectionKicker:{color:'#70E3DC',fontSize:9,fontWeight:'900',textTransform:'uppercase',letterSpacing:1.1},sectionTitle:{color:'#fff',fontSize:24,lineHeight:29,fontWeight:'700',letterSpacing:-.6,marginTop:7},sectionBody:{color:'#B8C7DB',fontSize:12.5,lineHeight:20,marginTop:8},cards:{gap:10,marginTop:18},card:{borderRadius:16,borderWidth:1,borderColor:'rgba(255,255,255,.11)',backgroundColor:'rgba(255,255,255,.055)',padding:16},cardNumber:{width:29,height:29,borderRadius:9,overflow:'hidden',backgroundColor:'rgba(79,121,242,.20)',color:'#8EABFF',textAlign:'center',paddingTop:7,fontSize:10,fontWeight:'900'},cardTitle:{color:'#fff',fontSize:16,fontWeight:'800',marginTop:11},cardBody:{color:'#BAC8DB',fontSize:12,lineHeight:19,marginTop:6},splitRow:{gap:10,marginTop:22},splitCard:{borderRadius:17,padding:17},ykiCard:{backgroundColor:'#123A72'},workCard:{backgroundColor:'#E5F3F0'},splitTag:{color:'#71E2D8',fontSize:9,fontWeight:'900',letterSpacing:1},splitTagDark:{color:'#198A82',fontSize:9,fontWeight:'900',letterSpacing:1},splitTitleLight:{color:'#fff',fontSize:19,lineHeight:24,fontWeight:'800',marginTop:8},splitBodyLight:{color:'#C4D1E4',fontSize:12,lineHeight:19,marginTop:7},splitTitleDark:{color:'#153147',fontSize:19,lineHeight:24,fontWeight:'800',marginTop:8},splitBodyDark:{color:'#597181',fontSize:12,lineHeight:19,marginTop:7},languageSection:{marginTop:22,borderRadius:18,backgroundColor:'#F0F5FA',padding:17},sectionKickerDark:{color:'#2F68D7',fontSize:9,fontWeight:'900',textTransform:'uppercase',letterSpacing:1},sectionTitleDark:{color:'#12213B',fontSize:23,lineHeight:28,fontWeight:'700',marginTop:7},sectionBodyDark:{color:'#60738E',fontSize:12,lineHeight:19,marginTop:7},languageChips:{flexDirection:'row',flexWrap:'wrap',gap:6,marginTop:14},languageChip:{color:'#31445E',backgroundColor:'#fff',borderWidth:1,borderColor:'#D2DCE8',borderRadius:999,paddingHorizontal:8,paddingVertical:5,fontSize:9.2,fontWeight:'700'},languageNote:{color:'#50677B',fontSize:10,lineHeight:16,marginTop:13,borderLeftWidth:3,borderLeftColor:'#48CFC5',paddingLeft:9},finalCard:{marginTop:22,borderRadius:18,backgroundColor:'#0B254C',padding:18},finalTitle:{color:'#fff',fontSize:23,lineHeight:28,fontWeight:'800'},finalBody:{color:'#C3D1E5',fontSize:12,lineHeight:19,marginTop:7},finalButton:{minHeight:43,marginTop:14,borderRadius:12,backgroundColor:'#4F79F2',alignItems:'center',justifyContent:'center'},finalButtonText:{color:'#fff',fontSize:12.5,fontWeight:'900'},footerCopy:{color:'#8FA3C2',fontSize:9.5,marginTop:12},modalBackdrop:{flex:1,backgroundColor:'rgba(3,9,22,.60)',justifyContent:'center',paddingHorizontal:25},languageModal:{maxHeight:'76%',borderRadius:23,backgroundColor:'#fff',padding:12},modalTitle:{color:'#12213B',fontSize:17,fontWeight:'800',paddingHorizontal:7,paddingVertical:8},languageList:{maxHeight:480},languageOption:{minHeight:45,flexDirection:'row',alignItems:'center',gap:10,borderRadius:13,paddingHorizontal:10},languageOptionActive:{backgroundColor:'#0B254C'},languageOptionText:{color:'#1B2B44',fontSize:13,fontWeight:'700'},languageOptionTextActive:{color:'#fff'},ltrText:{textAlign:'left',writingDirection:'ltr'},rtlText:{textAlign:'right',writingDirection:'rtl'},
});
