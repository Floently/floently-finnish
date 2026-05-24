/**
 * LearnLandingPage — localized public landing page.
 *
 * Public-page i18n is intentionally kept page-local in web/i18n so the
 * production app i18n bundle is not changed during this public marketing pass.
 */

import React, { useState } from 'react';
import FinnishCorrectionDemo from './components/FinnishCorrectionDemo';
import { PUBLIC_LANGUAGE_FLAGS, usePublicPageI18n } from './i18n/publicMarketingCopy';

const LOGO_SRC = '/images/new_ui/logo_landing_page.png';
const REGISTER_URL = '/auth/register';
const LOGIN_URL = '/auth/login';
const ORG_URL = '/for-organizations';
const CONTACT_EMAIL = 'pilots@floently.com';

export default function LearnLandingPage() {
  const { copy, language, setLanguage, languages, dir } = usePublicPageI18n();
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);
  const selectedLanguage = languages.find((item) => item.code === language) ?? languages[0];
  const landing = copy.landing;
  const common = copy.common;

  const go = (href: string) => () => {
    if (typeof window !== 'undefined') window.location.assign(href);
  };

  return (
    <div className="fl-page" lang={language} dir={dir}>
      <PageStyles />

      <nav className="fl-nav">
        <a href="/" className="fl-logo" aria-label={common.floentlyHome}>
          <img src={LOGO_SRC} alt="" className="fl-logo-img" />
          <span className="fl-logo-text">Floently</span>
        </a>
        <div className="fl-nav-right">
          <a href={ORG_URL} className="fl-nav-orgs">{common.forOrganizationsArrow}</a>
          <a href={LOGIN_URL} className="fl-nav-signin">{common.signIn}</a>
        </div>
      </nav>

      <section className="fl-hero">
        <div className="fl-eyebrow">
          <span className="fl-eyebrow-dot" />
          {landing.eyebrow}
        </div>
        <h1 className="fl-h1">
          {landing.h1Line1}
          <br />
          <span className="fl-h1-accent">{landing.h1Line2}</span>
        </h1>
        <p className="fl-hero-sub">{landing.heroSub}</p>
        <div className="fl-hero-cta-row">
          <button type="button" onClick={go(REGISTER_URL)} className="fl-cta-primary">
            {common.startLearning} <span className="fl-cta-arrow">→</span>
          </button>
          <span className="fl-cta-secondary-text">
            {landing.alreadyHaveAccount}{' '}
            <a href={LOGIN_URL} className="fl-cta-secondary-link">{common.signIn}</a>
          </span>
        </div>

        <div className="fl-demo-wrap">
          <FinnishCorrectionDemo theme="dark" />
          <div className="fl-demo-caption">{landing.demoCaption}</div>
        </div>
      </section>

      <div className="fl-trust">
        <span className="fl-trust-item"><span className="fl-trust-dot" />{landing.trustBuiltForYki}</span>
        <span className="fl-trust-sep">·</span>
        <span className="fl-trust-item"><span className="fl-trust-dot" />{landing.trustForProfessionals}</span>
        <span className="fl-trust-sep">·</span>
        <span className="fl-trust-item"><span className="fl-trust-dot" />{landing.trustFreeToStart}</span>
      </div>

      <section className="fl-paths">
        <div className="fl-paths-head">
          <div className="fl-paths-eyebrow">{landing.pathwaysEyebrow}</div>
          <h2 className="fl-paths-title">{landing.pathwaysTitle}</h2>
          <p className="fl-paths-sub">{landing.pathwaysSub}</p>
        </div>
        <div className="fl-paths-grid">
          <a href={REGISTER_URL} className="fl-path-card" style={{ ['--path-accent' as string]: '#5A85FF' }}>
            <div className="fl-path-name">{landing.learnerPath.label}</div>
            <h3 className="fl-path-title">{landing.learnerPath.title}</h3>
            <p className="fl-path-body">{landing.learnerPath.body}</p>
            <span className="fl-path-link">{landing.learnerPath.link}</span>
          </a>
          <a href={`${ORG_URL}#employers`} className="fl-path-card" style={{ ['--path-accent' as string]: '#3EC5A8' }}>
            <div className="fl-path-name">{landing.employerPath.label}</div>
            <h3 className="fl-path-title">{landing.employerPath.title}</h3>
            <p className="fl-path-body">{landing.employerPath.body}</p>
            <span className="fl-path-link">{landing.employerPath.link}</span>
          </a>
          <a href={`${ORG_URL}#cities`} className="fl-path-card" style={{ ['--path-accent' as string]: '#7A9FFF' }}>
            <div className="fl-path-name">{landing.cityPath.label}</div>
            <h3 className="fl-path-title">{landing.cityPath.title}</h3>
            <p className="fl-path-body">{landing.cityPath.body}</p>
            <span className="fl-path-link">{landing.cityPath.link}</span>
          </a>
        </div>
      </section>


      <section className="fl-language-footer" aria-label={common.language}>

        <div className="fl-language-picker">
          <button
            type="button"
            className="fl-language-current"
            onClick={() => setLanguagePickerOpen((open) => !open)}
            aria-expanded={languagePickerOpen}
          >
            <span className="fl-language-flag" aria-hidden="true">
              {PUBLIC_LANGUAGE_FLAGS[selectedLanguage.code] ?? '🌐'}
            </span>
            <span className="fl-language-current-text">
              {selectedLanguage.label}
            </span>
            <span className="fl-language-chevron" aria-hidden="true">
              {languagePickerOpen ? '▲' : '▼'}
            </span>
          </button>

          {languagePickerOpen ? (
            <div className="fl-language-list" role="listbox">
              {languages.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  className={`fl-language-option ${item.code === language ? 'fl-language-option-active' : ''}`}
                  onClick={() => {
                    setLanguage(item.code);
                    setLanguagePickerOpen(false);
                  }}
                  aria-selected={item.code === language}
                  role="option"
                >
                  <span className="fl-language-flag" aria-hidden="true">
                    {PUBLIC_LANGUAGE_FLAGS[item.code] ?? '🌐'}
                  </span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <footer className="fl-footer">
        <span>© {new Date().getFullYear()} Floently. {landing.footerMade}</span>
        <div className="fl-footer-links">
          <a href={ORG_URL} className="fl-footer-link">{common.forOrganizations}</a>
          <a href={LOGIN_URL} className="fl-footer-link">{common.signIn}</a>
          <a href={`mailto:${CONTACT_EMAIL}`} className="fl-footer-link">{common.contact}</a>
        </div>
      </footer>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
function PageStyles() {
  return (
    <style>{`
        html, body, #root {
          min-height: 100%;
          overflow-x: hidden;
          overflow-y: auto;
        }

      .fl-page, .fl-page * { box-sizing: border-box; }
      .fl-page {
        min-height: 100vh;
        background: #0A1838;
        color: #F5F9FF;
        font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
        line-height: 1.5;
        position: relative;
        overflow-x: hidden; overflow-y: auto;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      .fl-page::before {
        content: '';
        position: absolute;
        inset: 0;
        background:
          radial-gradient(ellipse 70% 50% at 50% 0%, rgba(90, 133, 255, 0.20) 0%, transparent 60%),
          radial-gradient(ellipse 50% 40% at 100% 100%, rgba(62, 197, 168, 0.08) 0%, transparent 65%);
        pointer-events: none;
        z-index: 0;
      }
      .fl-page > * { position: relative; z-index: 1; }
      .fl-page button { font-family: inherit; cursor: pointer; border: none; background: none; padding: 0; }
      .fl-page a { color: inherit; text-decoration: none; }

      /* Nav */
      .fl-nav {
        max-width: 1280px;
        margin: 0 auto;
        padding: 24px 32px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }
      .fl-logo {
        display: inline-flex;
        align-items: center;
        height: 52px;
        padding: 0 14px;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 14px;
        border: 0;
        box-shadow: none;
      }
      .fl-logo-img {
        height: 32px;
        width: auto;
        object-fit: contain;
        display: block;
      }
      .fl-logo-text {
        font-size: 18px;
        font-weight: 800;
        color: #0A1838;
        letter-spacing: -0.02em;
        margin-left: 6px;
      }
      .fl-nav-right { display: flex; align-items: center; gap: 20px; }
      .fl-nav-orgs { font-size: 13px; font-weight: 600; color: #A8BAD6; transition: color 180ms ease; }
      .fl-nav-orgs:hover { color: #F5F9FF; }
      .fl-nav-signin {
        font-size: 14px; font-weight: 700; color: #F5F9FF;
        padding: 8px 18px; border-radius: 999px;
        border: 1px solid rgba(245, 249, 255, 0.20);
        transition: background 200ms ease, border-color 200ms ease;
      }
      .fl-nav-signin:hover {
        background: rgba(245, 249, 255, 0.06);
        border-color: rgba(245, 249, 255, 0.35);
      }

      /* Hero */
      .fl-hero {
        max-width: 1080px;
        margin: 0 auto;
        padding: 64px 32px 80px;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .fl-eyebrow {
        display: inline-flex; align-items: center; gap: 8px;
        font-size: 11px; font-weight: 800; letter-spacing: 1.4px;
        color: #5A85FF; text-transform: uppercase;
        padding: 8px 14px; border-radius: 999px;
        background: rgba(90, 133, 255, 0.10);
        border: 1px solid rgba(90, 133, 255, 0.22);
        margin-bottom: 28px;
      }
      .fl-eyebrow-dot {
        width: 6px; height: 6px; border-radius: 999px;
        background: #3EC5A8;
        animation: fl-pulse 2.4s ease-in-out infinite;
      }
      @keyframes fl-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

      .fl-h1 {
        font-size: 72px; line-height: 1.02; letter-spacing: -0.035em;
        font-weight: 800; color: #F5F9FF;
        margin: 0 0 24px; max-width: 920px;
      }
      .fl-h1-accent {
        background: linear-gradient(120deg, #5A85FF 0%, #3EC5A8 100%);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        display: inline-block;
      }
      .fl-hero-sub {
        font-size: 19px; line-height: 1.55; color: #A8BAD6;
        max-width: 580px; margin: 0 0 40px; font-weight: 400;
      }
      .fl-hero-cta-row {
        display: flex; flex-direction: column; align-items: center;
        gap: 16px; margin-bottom: 56px;
      }
      .fl-cta-primary {
        display: inline-flex; align-items: center; gap: 10px;
        background: #1F47E8; color: #FFFFFF;
        font-size: 17px; font-weight: 700;
        padding: 18px 36px; border-radius: 999px;
        box-shadow: 0 16px 40px rgba(31, 71, 232, 0.45);
        transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 220ms ease, background 220ms ease;
      }
      .fl-cta-primary:hover {
        background: #2D5BFF;
        transform: translateY(-2px);
        box-shadow: 0 20px 48px rgba(31, 71, 232, 0.55);
      }
      .fl-cta-arrow { display: inline-block; transition: transform 220ms ease; }
      .fl-cta-primary:hover .fl-cta-arrow { transform: translateX(4px); }
      .fl-cta-secondary-text { font-size: 14px; color: #A8BAD6; font-weight: 500; }
      .fl-cta-secondary-link {
        color: #F5F9FF; font-weight: 700;
        text-decoration: underline; text-underline-offset: 3px;
        text-decoration-color: rgba(245, 249, 255, 0.4);
        transition: text-decoration-color 200ms ease;
      }
      .fl-cta-secondary-link:hover { text-decoration-color: #F5F9FF; }

      /* Demo wrap */
      .fl-demo-wrap { width: 100%; max-width: 720px; }
      .fl-demo-caption {
        margin-top: 14px; font-size: 12px; color: #7A8CAE;
        letter-spacing: 0.3px; text-align: center;
      }

      /* Trust strip */
      .fl-trust {
        max-width: 1080px; margin: 0 auto;
        padding: 0 32px 64px;
        display: flex; justify-content: center; align-items: center;
        gap: 32px; flex-wrap: wrap;
        border-bottom: 1px solid rgba(245, 249, 255, 0.06);
      }
      .fl-trust-item {
        display: inline-flex; align-items: center; gap: 8px;
        font-size: 13px; font-weight: 600; color: #7A8CAE;
        letter-spacing: 0.2px;
      }
      .fl-trust-dot {
        width: 4px; height: 4px; border-radius: 999px;
        background: #3EC5A8; flex-shrink: 0;
      }
      .fl-trust-sep { color: rgba(245, 249, 255, 0.12); font-weight: 400; }

      /* Pathways */
      .fl-paths { max-width: 1080px; margin: 0 auto; padding: 80px 32px 96px; }
      .fl-paths-head { text-align: center; margin-bottom: 48px; }
      .fl-paths-eyebrow {
        display: inline-block;
        font-size: 11px; font-weight: 800; letter-spacing: 1.4px;
        color: #5A85FF; text-transform: uppercase;
        margin-bottom: 12px;
      }
      .fl-paths-title {
        font-size: 28px; font-weight: 700; letter-spacing: -0.02em;
        color: #F5F9FF; margin: 0 0 12px;
      }
      .fl-paths-sub {
        font-size: 15px; color: #A8BAD6;
        max-width: 540px; margin: 0 auto;
      }
      .fl-paths-grid {
        display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
      }
      .fl-path-card {
        display: block;
        padding: 28px 24px; border-radius: 18px;
        border: 1px solid rgba(245, 249, 255, 0.08);
        background: rgba(17, 35, 70, 0.5);
        transition: border-color 240ms ease, background 240ms ease, transform 240ms ease;
      }
      .fl-path-card:hover {
        border-color: rgba(90, 133, 255, 0.4);
        background: rgba(17, 35, 70, 0.85);
        transform: translateY(-3px);
      }
      .fl-path-name {
        font-size: 11px; font-weight: 800; letter-spacing: 1.4px;
        color: var(--path-accent, #5A85FF); text-transform: uppercase;
        margin-bottom: 12px;
      }
      .fl-path-title {
        font-size: 18px; font-weight: 700; color: #F5F9FF;
        letter-spacing: -0.01em; margin: 0 0 8px; line-height: 1.3;
      }
      .fl-path-body {
        font-size: 13.5px; line-height: 1.6;
        color: #A8BAD6; margin: 0 0 16px;
      }
      .fl-path-link {
        font-size: 13px; font-weight: 700;
        color: var(--path-accent, #5A85FF);
        display: inline-flex; align-items: center; gap: 4px;
        transition: gap 180ms ease;
      }
      .fl-path-card:hover .fl-path-link { gap: 8px; }

      /* Footer */
      .fl-footer {
        max-width: 1080px; margin: 0 auto; padding: 32px;
        border-top: 1px solid rgba(245, 249, 255, 0.06);
        display: flex; justify-content: space-between; align-items: center;
        gap: 16px; flex-wrap: wrap;
        font-size: 12px; color: #7A8CAE;
      }
      .fl-footer-links { display: flex; gap: 20px; }
      .fl-footer-link { color: #A8BAD6; transition: color 180ms ease; }
      .fl-footer-link:hover { color: #F5F9FF; }

      /* Mobile */
      @media (max-width: 767px) {
        .fl-nav { padding: 16px 20px; }
        .fl-nav-orgs { display: none; }
        .fl-logo { height: 44px; padding: 0 10px; }
        .fl-logo-img { height: 26px; }
        .fl-logo-text { font-size: 15px; }
        .fl-hero { padding: 32px 20px 48px; }
        .fl-h1 { font-size: 40px; line-height: 1.05; }
        .fl-hero-sub { font-size: 16px; margin-bottom: 28px; }
        .fl-cta-primary { padding: 16px 28px; font-size: 16px; }
        .fl-trust { padding: 0 20px 48px; gap: 16px; }
        .fl-trust-sep { display: none; }
        .fl-paths { padding: 48px 20px 64px; }
        .fl-paths-title { font-size: 24px; }
        .fl-paths-grid { grid-template-columns: 1fr; gap: 12px; }
        .fl-path-card { padding: 20px; }
        .fl-footer { padding: 20px; flex-direction: column; align-items: flex-start; gap: 12px; }
        .fl-footer-links { flex-wrap: wrap; gap: 12px; }
      }

      @media (min-width: 768px) and (max-width: 1023px) {
        .fl-h1 { font-size: 56px; }
      }

      @media (prefers-reduced-motion: reduce) {
        .fl-page *, .fl-page *::before, .fl-page *::after {
          animation-duration: 0.01ms !important;
          transition-duration: 0.01ms !important;
        }
      }

        /* Floently web logo pill: intentional header brand treatment */
        .fl-logo,
        .fl-brand,
        .fl-nav-logo,
        .fl-navbar-brand,
        .fl-logo-card,
        .fl-brand-card {
          background: #ffffff !important;
          border: 1px solid rgba(7, 22, 56, 0.08) !important;
          box-shadow: 0 18px 45px rgba(7, 22, 56, 0.16) !important;
          padding: 10px 18px !important;
          border-radius: 14px !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 10px !important;
        }

        .fl-logo img,
        .fl-brand img,
        .fl-nav-logo img,
        .fl-navbar-brand img {
          height: 28px !important;
          width: auto !important;
          max-height: 28px !important;
          object-fit: contain !important;
          display: block !important;
        }

        .fl-logo span,
        .fl-brand span,
        .fl-nav-logo span,
        .fl-navbar-brand span {
          color: #071638 !important;
          font-weight: 900 !important;
          letter-spacing: -0.02em !important;
          line-height: 1 !important;
        }

        @media (max-width: 640px) {
          .fl-logo,
          .fl-brand,
          .fl-nav-logo,
          .fl-navbar-brand,
          .fl-logo-card,
          .fl-brand-card {
            padding: 8px 12px !important;
            border-radius: 12px !important;
          }

          .fl-logo img,
          .fl-brand img,
          .fl-nav-logo img,
          .fl-navbar-brand img {
            height: 24px !important;
            max-height: 24px !important;
          }
        }

        /* Floently web header logo: no white pill, slightly larger */
        .fl-logo,
        .fl-brand,
        .fl-nav-logo,
        .fl-navbar-brand,
        .fl-logo-card,
        .fl-brand-card {
          background: transparent !important;
          border: 0 !important;
          box-shadow: none !important;
          padding: 0 !important;
          border-radius: 0 !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 12px !important;
        }

        .fl-logo img,
        .fl-brand img,
        .fl-nav-logo img,
        .fl-navbar-brand img {
          height: 105px !important;
          width: auto !important;
          max-height: 105px !important;
          object-fit: contain !important;
          display: block !important;
          background: transparent !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }

        .fl-logo span,
        .fl-brand span,
        .fl-nav-logo span,
        .fl-navbar-brand span {
          color: #ffffff !important;
          font-weight: 900 !important;
          letter-spacing: -0.02em !important;
          line-height: 1 !important;
          font-size: 2.4rem !important;
        }

        @media (max-width: 640px) {
          .fl-logo,
          .fl-brand,
          .fl-nav-logo,
          .fl-navbar-brand,
          .fl-logo-card,
          .fl-brand-card {
            gap: 10px !important;
          }

          .fl-logo img,
          .fl-brand img,
          .fl-nav-logo img,
          .fl-navbar-brand img {
            height: 90px !important;
            max-height: 90px !important;
          }

          .fl-logo span,
          .fl-brand span,
          .fl-nav-logo span,
          .fl-navbar-brand span {
            font-size: 2rem !important;
          }
        }

      .fl-language-footer {
        width: min(360px, calc(100% - 48px));
        margin: 28px auto 0;
        padding: 0 0 28px;
        position: relative;
      }
      .fl-language-picker {
        position: relative;
        width: 100%;
      }
      .fl-language-current {
        width: 100%;
        min-height: 48px;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 10px;
        padding: 0 14px;
        border-radius: 18px;
        border: 1px solid rgba(245, 249, 255, 0.18);
        background: rgba(245, 249, 255, 0.08);
        color: #F5F9FF;
        font-size: 14px;
        font-weight: 900;
        cursor: pointer;
        text-align: left;
      }
      .fl-language-current-text {
        flex: 1;
      }
      .fl-language-chevron {
        font-size: 11px;
        opacity: 0.75;
      }
      .fl-language-list {
        position: absolute;
        left: 0;
        right: 0;
        bottom: calc(100% + 10px);
        max-height: 300px;
        overflow-y: auto;
        overflow-x: hidden;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 8px;
        border-radius: 20px;
        border: 1px solid rgba(245, 249, 255, 0.18);
        background: rgba(245, 249, 255, 0.08);
        backdrop-filter: blur(18px);
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
        z-index: 20;
        scrollbar-width: thin;
      }
      .fl-language-option {
        width: 100%;
        min-height: 42px;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 12px;
        border-radius: 14px;
        border: 1px solid transparent;
        background: transparent;
        color: #F5F9FF;
        font-size: 13px;
        font-weight: 850;
        cursor: pointer;
        text-align: left;
      }
      .fl-language-option-active {
        background: #FFFFFF;
        color: #0A1838;
        border-color: #FFFFFF;
      }
      .fl-language-flag {
        width: 26px;
        font-size: 18px;
        line-height: 1;
        text-align: center;
        flex: 0 0 auto;
      }

      /* Neo-tactile public button polish */
      .fl-button-polish,
      .fl-nav a[href*="login"],
      .fl-nav a[href*="auth"],
      .fl-hero a,
      .fl-cta,
      .fl-primary,
      .fl-secondary,
      .fl-path-link,
      .fl-language-current {
        border-radius: 999px !important;
        border: 1px solid rgba(255, 255, 255, 0.20) !important;
        background:
          linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.05)) !important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.22),
          0 16px 42px rgba(0, 0, 0, 0.28),
          0 0 0 1px rgba(77, 132, 255, 0.08) !important;
        backdrop-filter: blur(18px) saturate(140%);
        transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, background 160ms ease;
      }

      .fl-hero a:first-of-type,
      .fl-primary,
      .fl-path-card:nth-child(2) .fl-path-link {
        background:
          radial-gradient(circle at 28% 20%, rgba(255,255,255,0.36), transparent 28%),
          linear-gradient(135deg, #2F6BFF, #19C7B3) !important;
        color: #FFFFFF !important;
        border-color: rgba(120, 220, 255, 0.50) !important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.34),
          0 18px 50px rgba(39, 111, 255, 0.34),
          0 0 34px rgba(31, 205, 187, 0.16) !important;
      }

      .fl-nav a[href*="login"]:hover,
      .fl-hero a:hover,
      .fl-path-link:hover,
      .fl-language-current:hover {
        transform: translateY(-2px);
        border-color: rgba(128, 219, 255, 0.46) !important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.30),
          0 22px 56px rgba(0, 0, 0, 0.34),
          0 0 36px rgba(55, 151, 255, 0.18) !important;
      }

      .fl-nav a[href*="login"]:active,
      .fl-hero a:active,
      .fl-path-link:active,
      .fl-language-current:active {
        transform: translateY(1px) scale(0.99);
      }







    `}</style>
  );
}

