/**
 * LearnLandingPage — rebuilt 2026-04.
 *
 * Replaces the all-white "newspaper" landing page with a premium dark-hero
 * design anchored by an animated Finnish text correction demo.
 *
 * Design system:
 *   • Dark hero (#0A1838 / Floently navy) → light section → dark section →
 *     light section → deep navy footer. Alternating tones give the page rhythm.
 *   • Single primary CTA per section (Book a demo). Sign-in is a small text link.
 *   • Three pathway cards differentiated by accent color, icon, and emphasis,
 *     not just by copy. Carousel on mobile, 3-up grid at desktop.
 *   • Mobile-first: 375px base, breaks at 768 / 1024 / 1440.
 *   • Typography: system sans (Inter / SF / Segoe) with weight contrast doing
 *     the visual hierarchy. No serifs.
 *
 * Notes for future passes:
 *   • The animation component (FinnishCorrectionDemo) is reused on the auth
 *     page split-screen. Don't duplicate; import from the same path.
 *   • Copy is preserved from the original — user explicitly said the words
 *     are not the problem. Only structure and visuals were redesigned.
 *   • The project logo is the bundled asset at apps/client/components/public/logo.png
 *     so the web export can resolve it reliably on both mobile and desktop.
 */

import React from 'react';
import FinnishCorrectionDemo from './components/FinnishCorrectionDemo';
import LanguageSelector from '../features/i18n/LanguageSelector';
import { usePreferencesStore } from '../state/preferencesStore';
import { useTranslator } from '../features/i18n';

const LOGIN_URL = '/auth/login';
const DEMO_URL = 'mailto:pilots@floently.com?subject=Floently%20demo%20request';
const LOGO_SRC = require('../components/public/logo.png');

type Translator = ReturnType<typeof useTranslator>;

function getPathwayCards(t: Translator['t']) {
  return [
    {
      id: 'learners',
      eyebrow: t('landingPathwayLearnersEyebrow'),
      title: t('landingPathwayLearnersTitle'),
      body: t('landingPathwayLearnersBody'),
      accent: '#5A85FF',
      accentSoft: 'rgba(90, 133, 255, 0.10)',
      icon: '👤',
      cta: t('landingPathwayLearnersCta'),
      href: LOGIN_URL,
    },
    {
      id: 'employers',
      eyebrow: t('landingPathwayEmployersEyebrow'),
      title: t('landingPathwayEmployersTitle'),
      body: t('landingPathwayEmployersBody'),
      accent: '#3EC5A8',
      accentSoft: 'rgba(62, 197, 168, 0.10)',
      icon: '🏢',
      cta: t('landingPathwayEmployersCta'),
      href: DEMO_URL,
    },
    {
      id: 'cities',
      eyebrow: t('landingPathwayCitiesEyebrow'),
      title: t('landingPathwayCitiesTitle'),
      body: t('landingPathwayCitiesBody'),
      accent: '#7A9FFF',
      accentSoft: 'rgba(122, 159, 255, 0.10)',
      icon: '🏛️',
      cta: t('landingPathwayCitiesCta'),
      href: DEMO_URL,
    },
  ];
}

function getOutcomeCards(t: Translator['t']) {
  return [
    {
      title: t('landingOutcomeWallTitle'),
      body: t('landingOutcomeWallBody'),
    },
    {
      title: t('landingOutcomeWorkplaceTitle'),
      body: t('landingOutcomeWorkplaceBody'),
    },
    {
      title: t('landingOutcomeCitiesTitle'),
      body: t('landingOutcomeCitiesBody'),
    },
  ];
}

function getPlatformPathways(t: Translator['t']) {
  return [
    {
      eyebrow: t('landingPlatformYkiEyebrow'),
      title: t('landingPlatformYkiTitle'),
      body: t('landingPlatformYkiBody'),
      accent: '#5A85FF',
    },
    {
      eyebrow: t('landingPlatformProfessionalEyebrow'),
      title: t('landingPlatformProfessionalTitle'),
      body: t('landingPlatformProfessionalBody'),
      accent: '#3EC5A8',
    },
    {
      eyebrow: t('landingPlatformLifeEyebrow'),
      title: t('landingPlatformLifeTitle'),
      body: t('landingPlatformLifeBody'),
      accent: '#7A9FFF',
    },
  ];
}

function getTrustPoints(t: Translator['t']) {
  return [
    t('landingTrustYkiAligned'),
    t('landingTrustProfessionSpecific'),
    t('landingTrustWorkplaceCommunication'),
    t('landingTrustSettlementSupport'),
    t('landingTrustProgrammeScalable'),
  ];
}

// ── Component ─────────────────────────────────────────────────────────────
export default function LearnLandingPage() {
  const { t } = useTranslator();
  const language = usePreferencesStore((state) => state.language);
  const setLanguage = usePreferencesStore((state) => state.setLanguage);
  const goToLogin = () => {
    if (typeof window !== 'undefined') window.location.assign(LOGIN_URL);
  };
  const goToDemo = () => {
    if (typeof window !== 'undefined') window.location.assign(DEMO_URL);
  };
  const pathwayCards = getPathwayCards(t);
  const outcomeCards = getOutcomeCards(t);
  const platformPathways = getPlatformPathways(t);
  const trustPoints = getTrustPoints(t);

  return (
    <div className="floently-landing-shell">
      <div className="floently-landing">
        <PageStyles />

      {/* ═══════════════ HERO (dark) ═══════════════ */}
      <header className="fl-hero">
        {/* Subtle starfield/grid bg ornamentation */}
        <div className="fl-hero-bg" aria-hidden />

        <nav className="fl-nav">
          <div className="fl-nav-actions fl-nav-actions-left">
            <button type="button" onClick={goToDemo} className="fl-nav-cta">
              {t('landingNavBookDemo')}
            </button>
          </div>
          <div className="fl-nav-links">
            <a href="#learners" className="fl-nav-link">{t('landingNavForLearners')}</a>
            <a href="#employers" className="fl-nav-link">{t('landingNavForEmployers')}</a>
            <a href="#cities" className="fl-nav-link">{t('landingNavForCities')}</a>
          </div>
          <div className="fl-nav-actions">
            <LanguageSelector language={language} onChange={(next) => void setLanguage(next)} mode="pills" compact />
            <button type="button" onClick={goToLogin} className="fl-nav-signin">
              {t('landingNavSignIn')}
            </button>
          </div>
        </nav>

        <div className="fl-brand-hero">
          <img src={LOGO_SRC} alt="" className="fl-brand-hero-logo" />
        </div>

        <div className="fl-hero-grid">
          <div className="fl-hero-text">
            <div className="fl-eyebrow">
              <span className="fl-eyebrow-dot" />
              {t('landingHeroEyebrow')}
            </div>
            <h1 className="fl-h1">
              {t('landingHeroPassYki')}
              <br />
              <span className="fl-h1-accent">{t('landingHeroSucceedInWorkAndLife')} </span>
              {t('landingHeroInFinland')}
            </h1>
            <p className="fl-hero-lede">
              {t('landingHeroLede')}
            </p>
            <div className="fl-hero-actions">
              <button type="button" onClick={goToDemo} className="fl-cta-primary">
                {t('landingNavBookDemo')}
                <span className="fl-cta-arrow">→</span>
              </button>
              <button type="button" onClick={goToLogin} className="fl-cta-link">
                {t('landingAlreadyHaveAccount')} <span className="fl-cta-link-emphasis">{t('landingNavSignIn')}</span>
              </button>
            </div>
            <div className="fl-trust-row">
              {trustPoints.map((point) => (
                <span key={point} className="fl-trust-pill">{point}</span>
              ))}
            </div>
          </div>

          <div className="fl-hero-demo">
            <FinnishCorrectionDemo theme="dark" />
            <div className="fl-hero-demo-caption">
              {t('landingHeroDemoCaption')}
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════ OUTCOMES (light) ═══════════════ */}
      <section className="fl-section fl-section-light" id="outcomes">
        <div className="fl-section-inner">
          <div className="fl-section-head">
            <div className="fl-section-eyebrow">{t('landingProblemEyebrow')}</div>
            <h2 className="fl-h2">
              {t('landingProblemTitleLine1')}<br />{t('landingProblemTitleLine2')}
            </h2>
            <p className="fl-section-lede">
              {t('landingProblemBody')}
            </p>
          </div>

          <div className="fl-outcome-grid">
            {outcomeCards.map((card, i) => (
              <article key={card.title} className="fl-outcome-card">
                <div className="fl-outcome-num">0{i + 1}</div>
                <h3 className="fl-outcome-title">{card.title}</h3>
                <p className="fl-outcome-body">{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ PATHWAYS (dark) ═══════════════ */}
      <section className="fl-section fl-section-dark" id="pathways">
        <div className="fl-section-inner">
          <div className="fl-section-head fl-section-head-dark">
            <div className="fl-section-eyebrow fl-section-eyebrow-dark">{t('landingPlatformEyebrow')}</div>
            <h2 className="fl-h2 fl-h2-dark">
              {t('landingPlatformTitleLine1')}<br />
              <span className="fl-h2-accent">{t('landingPlatformTitleHighlight')}</span>
            </h2>
            <p className="fl-section-lede fl-section-lede-dark">
              {t('landingPlatformBody')}
            </p>
          </div>

          <div className="fl-pathway-grid">
            {pathwayCards.map((card) => (
              <article
                key={card.id}
                id={card.id}
                className="fl-pathway-card"
                style={{
                  ['--card-accent' as string]: card.accent,
                  ['--card-accent-soft' as string]: card.accentSoft,
                }}
              >
                <div className="fl-pathway-icon">{card.icon}</div>
                <div className="fl-pathway-eyebrow">{card.eyebrow}</div>
                <h3 className="fl-pathway-title">{card.title}</h3>
                <p className="fl-pathway-body">{card.body}</p>
                <a href={card.href} className="fl-pathway-cta">
                  {card.cta} <span className="fl-pathway-cta-arrow">→</span>
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ PLATFORM PATHWAYS (light) ═══════════════ */}
      <section className="fl-section fl-section-light">
        <div className="fl-section-inner">
          <div className="fl-section-head">
            <div className="fl-section-eyebrow">{t('landingInsideEyebrow')}</div>
            <h2 className="fl-h2">
              {t('landingInsideTitleLine1')}<br />{t('landingInsideTitleLine2')}
            </h2>
            <p className="fl-section-lede">
              {t('landingInsideBody')}
            </p>
          </div>

          <div className="fl-platform-grid">
            {platformPathways.map((p) => (
              <article
                key={p.eyebrow}
                className="fl-platform-card"
                style={{ ['--card-accent' as string]: p.accent }}
              >
                <div className="fl-platform-bar" />
                <div className="fl-platform-eyebrow">{p.eyebrow}</div>
                <h3 className="fl-platform-title">{p.title}</h3>
                <p className="fl-platform-body">{p.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FINAL CTA (deep navy) ═══════════════ */}
      <section className="fl-section fl-section-final">
        <div className="fl-section-inner">
          <div className="fl-final-grid">
            <div>
              <div className="fl-section-eyebrow fl-section-eyebrow-dark">{t('landingFinalEyebrow')}</div>
              <h2 className="fl-h2 fl-h2-dark">
                {t('landingFinalTitleLine1')}<br />{t('landingFinalTitleLine2')}
              </h2>
              <p className="fl-section-lede fl-section-lede-dark">
                {t('landingFinalBody')}
              </p>
            </div>
            <div className="fl-final-actions">
              <button type="button" onClick={goToDemo} className="fl-cta-primary fl-cta-primary-large">
                {t('landingNavBookDemo')} <span className="fl-cta-arrow">→</span>
              </button>
              <button type="button" onClick={goToLogin} className="fl-cta-secondary-dark">
                {t('landingFinalSignIn')}
              </button>
              <a href={DEMO_URL} className="fl-cta-link fl-cta-link-dark">
                {t('landingFinalContact')} →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="fl-footer">
        <div className="fl-footer-inner">
            <div className="fl-footer-brand">
              <p className="fl-footer-tag">
                {t('landingFooterBrand')}
              </p>
            </div>
          <div className="fl-footer-cols">
            <div className="fl-footer-col">
              <div className="fl-footer-col-title">{t('landingFooterProduct')}</div>
              <a href={LOGIN_URL} className="fl-footer-link">{t('landingFooterSignIn')}</a>
              <a href="#learners" className="fl-footer-link">{t('landingFooterForLearners')}</a>
              <a href="#employers" className="fl-footer-link">{t('landingFooterForEmployers')}</a>
              <a href="#cities" className="fl-footer-link">{t('landingFooterForCities')}</a>
            </div>
            <div className="fl-footer-col">
              <div className="fl-footer-col-title">{t('landingFooterCompany')}</div>
              <a href={DEMO_URL} className="fl-footer-link">{t('landingNavBookDemo')}</a>
              <a href={DEMO_URL} className="fl-footer-link">{t('landingFooterContact')}</a>
            </div>
          </div>
        </div>
        <div className="fl-footer-bottom">
          <span>{t('landingFooterCopyright').replace('{year}', String(new Date().getFullYear()))}</span>
        </div>
      </footer>
      </div>
    </div>
  );
}

// ── Stylesheet ──────────────────────────────────────────────────────────────
function PageStyles() {
  return (
    <style>{`
      /* ──── Reset + base ──── */
      .floently-landing-shell {
        min-height: 100dvh;
        overflow-x: hidden;
        overflow-y: auto;
        background: #FFFFFF;
        position: relative;
      }
      .floently-landing,
      .floently-landing * {
        box-sizing: border-box;
      }
      .floently-landing {
        min-height: 100%;
        font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
        color: #0A1838;
        background: #FFFFFF;
        line-height: 1.5;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      .floently-landing button { font-family: inherit; cursor: pointer; }
      .floently-landing a { color: inherit; text-decoration: none; }

      /* ──── HERO ──── */
      .fl-hero {
        position: relative;
        background: #0A1838;
        color: #F5F9FF;
        padding: 32px 0 96px;
        overflow: hidden;
      }
      .fl-hero-bg {
        position: absolute;
        inset: 0;
        background:
          radial-gradient(ellipse 60% 40% at 80% 10%, rgba(90, 133, 255, 0.18) 0%, transparent 60%),
          radial-gradient(ellipse 40% 30% at 10% 100%, rgba(62, 197, 168, 0.10) 0%, transparent 60%);
        pointer-events: none;
      }
      .fl-nav {
        position: relative;
        z-index: 2;
        max-width: 1280px;
        margin: 0 auto;
        padding: 0 28px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 64px;
      }
      .fl-nav-logo { display: flex; align-items: center; }
      .fl-logo-img {
        height: 62px;
        width: auto;
        object-fit: contain;
        /* The bounding logo is preserved as-is; no filters or color overrides */
      }
      .fl-brand-hero {
        position: relative;
        z-index: 2;
        display: flex;
        justify-content: center;
        padding: 0 28px 28px;
      }
      .fl-brand-hero-logo {
        width: min(420px, 72vw);
        max-height: 140px;
        height: auto;
        object-fit: contain;
        filter: drop-shadow(0 18px 40px rgba(31, 71, 232, 0.22));
      }
      .fl-nav-links {
        display: flex;
        gap: 28px;
      }
      .fl-nav-link {
        font-size: 14px;
        font-weight: 600;
        color: #A8BAD6;
        transition: color 180ms ease;
      }
      .fl-nav-link:hover { color: #F5F9FF; }
      .fl-nav-actions {
        display: flex;
        gap: 12px;
        align-items: center;
      }
      .fl-nav-signin {
        background: transparent;
        border: none;
        color: #A8BAD6;
        font-size: 14px;
        font-weight: 600;
        padding: 8px 12px;
        transition: color 180ms ease;
      }
      .fl-nav-signin:hover { color: #F5F9FF; }
      .fl-nav-cta {
        background: #1F47E8;
        color: #FFFFFF;
        border: none;
        font-size: 14px;
        font-weight: 700;
        padding: 10px 18px;
        border-radius: 999px;
        box-shadow: 0 8px 24px rgba(31, 71, 232, 0.32);
        transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
      }
      .fl-nav-cta:hover {
        background: #2D5BFF;
        transform: translateY(-1px);
        box-shadow: 0 12px 32px rgba(31, 71, 232, 0.45);
      }

      .fl-hero-grid {
        position: relative;
        z-index: 2;
        max-width: 1280px;
        margin: 0 auto;
        padding: 0 28px;
        display: grid;
        grid-template-columns: 1fr;
        gap: 56px;
        align-items: center;
      }

      .fl-eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 1.2px;
        color: #5A85FF;
        text-transform: uppercase;
        margin-bottom: 24px;
        padding: 8px 14px;
        border-radius: 999px;
        background: rgba(90, 133, 255, 0.10);
        border: 1px solid rgba(90, 133, 255, 0.20);
      }
      .fl-eyebrow-dot {
        width: 6px;
        height: 6px;
        border-radius: 999px;
        background: #3EC5A8;
        animation: fl-pulse-soft 2.4s ease-in-out infinite;
      }
      @keyframes fl-pulse-soft {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
      .fl-h1 {
        font-size: 48px;
        line-height: 1.05;
        letter-spacing: -0.03em;
        font-weight: 800;
        color: #F5F9FF;
        margin: 0 0 24px;
      }
      .fl-h1-accent {
        color: #5A85FF;
        background: linear-gradient(120deg, #5A85FF 0%, #7A9FFF 100%);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .fl-hero-lede {
        font-size: 18px;
        line-height: 1.6;
        color: #A8BAD6;
        max-width: 560px;
        margin: 0 0 32px;
      }
      .fl-hero-actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 20px;
        margin-bottom: 32px;
      }
      .fl-cta-primary {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: #1F47E8;
        color: #FFFFFF;
        border: none;
        font-size: 16px;
        font-weight: 700;
        padding: 16px 28px;
        border-radius: 999px;
        box-shadow: 0 12px 32px rgba(31, 71, 232, 0.40);
        transition: transform 200ms ease, box-shadow 200ms ease, background 200ms ease;
      }
      .fl-cta-primary:hover {
        background: #2D5BFF;
        transform: translateY(-2px);
        box-shadow: 0 16px 40px rgba(31, 71, 232, 0.55);
      }
      .fl-cta-arrow {
        display: inline-block;
        transition: transform 200ms ease;
      }
      .fl-cta-primary:hover .fl-cta-arrow {
        transform: translateX(3px);
      }
      .fl-cta-primary-large {
        font-size: 17px;
        padding: 18px 32px;
      }
      .fl-cta-link {
        background: transparent;
        border: none;
        color: #A8BAD6;
        font-size: 14px;
        font-weight: 500;
        padding: 0;
      }
      .fl-cta-link-emphasis {
        color: #F5F9FF;
        font-weight: 700;
        text-decoration: underline;
        text-underline-offset: 3px;
        text-decoration-color: rgba(245, 249, 255, 0.4);
        transition: text-decoration-color 200ms ease;
      }
      .fl-cta-link:hover .fl-cta-link-emphasis {
        text-decoration-color: #F5F9FF;
      }
      .fl-cta-link-dark { color: #A8BAD6; font-size: 14px; }
      .fl-cta-link-dark:hover { color: #F5F9FF; }
      .fl-cta-secondary-dark {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        color: #F5F9FF;
        border: 1px solid rgba(245, 249, 255, 0.28);
        font-size: 15px;
        font-weight: 700;
        padding: 14px 24px;
        border-radius: 999px;
        transition: background 200ms ease, border-color 200ms ease;
      }
      .fl-cta-secondary-dark:hover {
        background: rgba(245, 249, 255, 0.06);
        border-color: rgba(245, 249, 255, 0.45);
      }

      .fl-trust-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .fl-trust-pill {
        font-size: 12px;
        font-weight: 600;
        color: #A8BAD6;
        padding: 6px 12px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(245, 249, 255, 0.10);
      }

      .fl-hero-demo {
        position: relative;
      }
      .fl-hero-demo-caption {
        margin-top: 12px;
        font-size: 12px;
        color: #7A8CAE;
        text-align: center;
        letter-spacing: 0.2px;
      }

      /* ──── Sections ──── */
      .fl-section { padding: 96px 0; }
      .fl-section-light { background: #F6F8FD; color: #0A1838; }
      .fl-section-dark { background: #0A1838; color: #F5F9FF; }
      .fl-section-final {
        background: #06112A;
        color: #F5F9FF;
        padding: 96px 0;
      }
      .fl-section-inner {
        max-width: 1280px;
        margin: 0 auto;
        padding: 0 28px;
      }
      .fl-section-head { max-width: 720px; margin-bottom: 56px; }
      .fl-section-head-dark { /* same layout, dark colors via h2/lede modifiers */ }
      .fl-section-eyebrow {
        display: inline-block;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 1.2px;
        color: #1F47E8;
        text-transform: uppercase;
        margin-bottom: 16px;
        padding: 6px 12px;
        border-radius: 999px;
        background: rgba(31, 71, 232, 0.08);
      }
      .fl-section-eyebrow-dark {
        color: #5A85FF;
        background: rgba(90, 133, 255, 0.12);
      }
      .fl-h2 {
        font-size: 40px;
        line-height: 1.1;
        letter-spacing: -0.02em;
        font-weight: 800;
        color: #0A1838;
        margin: 0 0 20px;
      }
      .fl-h2-dark { color: #F5F9FF; }
      .fl-h2-accent {
        background: linear-gradient(120deg, #5A85FF 0%, #3EC5A8 100%);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .fl-section-lede {
        font-size: 17px;
        line-height: 1.65;
        color: #5C7299;
        max-width: 600px;
        margin: 0;
      }
      .fl-section-lede-dark { color: #A8BAD6; }

      /* ──── Outcome cards (light section) ──── */
      .fl-outcome-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
      }
      .fl-outcome-card {
        background: #FFFFFF;
        border-radius: 24px;
        padding: 32px;
        border: 1px solid rgba(31, 71, 232, 0.08);
        position: relative;
        overflow: hidden;
        transition: transform 220ms ease, box-shadow 220ms ease;
      }
      .fl-outcome-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 20px 48px rgba(10, 24, 56, 0.10);
      }
      .fl-outcome-num {
        font-size: 14px;
        font-weight: 800;
        color: #1F47E8;
        letter-spacing: 1.5px;
        margin-bottom: 16px;
      }
      .fl-outcome-title {
        font-size: 22px;
        line-height: 1.25;
        font-weight: 700;
        color: #0A1838;
        margin: 0 0 12px;
      }
      .fl-outcome-body {
        font-size: 15px;
        line-height: 1.7;
        color: #5C7299;
        margin: 0;
      }

      /* ──── Pathway cards (dark section) — the differentiated three ──── */
      .fl-pathway-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
      }
      .fl-pathway-card {
        background: #112346;
        border: 1px solid #263B6B;
        border-radius: 28px;
        padding: 32px;
        position: relative;
        overflow: hidden;
        transition: transform 240ms ease, border-color 240ms ease, background 240ms ease;
      }
      .fl-pathway-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--card-accent);
        opacity: 0.6;
      }
      .fl-pathway-card:hover {
        background: #17306A;
        border-color: var(--card-accent);
        transform: translateY(-4px);
      }
      .fl-pathway-icon {
        font-size: 28px;
        margin-bottom: 24px;
        width: 56px;
        height: 56px;
        border-radius: 16px;
        background: var(--card-accent-soft);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--card-accent);
        line-height: 1;
      }
      .fl-pathway-eyebrow {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 1.2px;
        color: var(--card-accent);
        text-transform: uppercase;
        margin-bottom: 12px;
      }
      .fl-pathway-title {
        font-size: 22px;
        line-height: 1.3;
        font-weight: 700;
        color: #F5F9FF;
        margin: 0 0 14px;
        letter-spacing: -0.01em;
      }
      .fl-pathway-body {
        font-size: 15px;
        line-height: 1.65;
        color: #A8BAD6;
        margin: 0 0 24px;
      }
      .fl-pathway-cta {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        font-weight: 700;
        color: var(--card-accent);
        transition: gap 180ms ease;
      }
      .fl-pathway-cta:hover {
        gap: 10px;
      }
      .fl-pathway-cta-arrow {
        transition: transform 180ms ease;
      }

      /* ──── Platform cards (light) ──── */
      .fl-platform-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
      }
      .fl-platform-card {
        background: #FFFFFF;
        border-radius: 22px;
        padding: 32px;
        border: 1px solid rgba(31, 71, 232, 0.08);
        position: relative;
        transition: transform 220ms ease, box-shadow 220ms ease;
      }
      .fl-platform-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 16px 40px rgba(10, 24, 56, 0.08);
      }
      .fl-platform-bar {
        height: 4px;
        width: 36px;
        background: var(--card-accent);
        border-radius: 999px;
        margin-bottom: 20px;
      }
      .fl-platform-eyebrow {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 1.2px;
        color: var(--card-accent);
        text-transform: uppercase;
        margin-bottom: 10px;
      }
      .fl-platform-title {
        font-size: 20px;
        line-height: 1.3;
        font-weight: 700;
        color: #0A1838;
        margin: 0 0 12px;
        letter-spacing: -0.01em;
      }
      .fl-platform-body {
        font-size: 14.5px;
        line-height: 1.7;
        color: #5C7299;
        margin: 0;
      }

      /* ──── Final CTA ──── */
      .fl-final-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 32px;
        align-items: center;
      }
      .fl-final-actions {
        display: flex;
        flex-direction: column;
        gap: 12px;
        align-items: flex-start;
      }

      /* ──── Footer ──── */
      .fl-footer {
        background: #06112A;
        color: #A8BAD6;
        padding: 64px 0 32px;
      }
      .fl-footer-inner {
        max-width: 1280px;
        margin: 0 auto;
        padding: 0 28px;
        display: grid;
        grid-template-columns: 1fr;
        gap: 40px;
      }
      .fl-footer-brand { max-width: 320px; }
      .fl-footer-logo {
        height: 44px;
        width: auto;
        object-fit: contain;
        margin-bottom: 12px;
      }
      .fl-footer-tag {
        font-size: 13px;
        line-height: 1.6;
        color: #7A8CAE;
        margin: 0;
      }
      .fl-footer-cols {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 32px;
      }
      .fl-footer-col-title {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 1.2px;
        color: #F5F9FF;
        text-transform: uppercase;
        margin-bottom: 14px;
      }
      .fl-footer-col {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .fl-footer-link {
        font-size: 14px;
        color: #A8BAD6;
        transition: color 180ms ease;
      }
      .fl-footer-link:hover { color: #F5F9FF; }
      .fl-footer-bottom {
        max-width: 1280px;
        margin: 32px auto 0;
        padding: 24px 28px 0;
        border-top: 1px solid rgba(245, 249, 255, 0.06);
        font-size: 12px;
        color: #7A8CAE;
      }

      /* ════════ RESPONSIVE BREAKPOINTS ════════ */

      /* Tablet — 768px+ */
      @media (min-width: 768px) {
        .fl-h1 { font-size: 64px; }
        .fl-h2 { font-size: 48px; }
        .fl-section { padding: 112px 0; }

        .fl-outcome-grid { grid-template-columns: repeat(3, 1fr); }
        .fl-pathway-grid { grid-template-columns: repeat(3, 1fr); }
        .fl-platform-grid { grid-template-columns: repeat(3, 1fr); }
        .fl-footer-inner { grid-template-columns: 1.2fr 1fr; align-items: start; }
        .fl-footer-cols { grid-template-columns: repeat(2, 1fr); }
        .fl-final-grid { grid-template-columns: 1.4fr 1fr; gap: 48px; }
      }

      /* Desktop — 1024px+ */
      @media (min-width: 1024px) {
        .fl-hero { padding: 32px 0 128px; }
        .fl-hero-grid {
          grid-template-columns: 1.05fr 0.95fr;
          gap: 64px;
        }
        .fl-h1 { font-size: 72px; }
        .fl-section-head { margin-bottom: 64px; }
        .fl-final-actions { flex-direction: column; }
      }

      /* Mobile-specific overrides — under 768 */
      @media (max-width: 767px) {
        .fl-nav { padding: 0 20px; margin-bottom: 28px; flex-wrap: wrap; }
        .fl-nav-links { display: none; }
        .fl-hero-grid { padding: 0 20px; gap: 40px; }
        .fl-section-inner { padding: 0 20px; }
        .fl-h1 { font-size: 36px; line-height: 1.1; }
        .fl-h2 { font-size: 28px; }
        .fl-hero-lede { font-size: 16px; }
        .fl-hero { padding: 72px 0 64px; }
        .fl-brand-hero { padding: 0 20px 24px; }
        .fl-brand-hero-logo { width: min(320px, 84vw); max-height: 108px; }
        .fl-section { padding: 64px 0; }
        .fl-cta-primary { padding: 14px 22px; font-size: 15px; }
        .fl-outcome-card { padding: 24px; }
        .fl-pathway-card { padding: 24px; }
        .fl-platform-card { padding: 24px; }
        .fl-section-head { margin-bottom: 36px; }
        .fl-hero-actions { gap: 14px; }
        .fl-trust-row { gap: 6px; }
        .fl-trust-pill { font-size: 11px; padding: 5px 10px; }
        .fl-footer-cols { grid-template-columns: 1fr; gap: 24px; }
      }

      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .floently-landing *,
        .floently-landing *::before,
        .floently-landing *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `}</style>
  );
}
