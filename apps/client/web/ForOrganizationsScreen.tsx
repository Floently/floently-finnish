/**
 * ForOrganizationsScreen — localized organization page.
 *
 * Public-page i18n is intentionally kept page-local in web/i18n so the
 * production app i18n bundle is not changed during this public marketing pass.
 */

import React, { useState } from 'react';
import { PUBLIC_LANGUAGE_FLAGS, usePublicPageI18n } from './i18n/publicMarketingCopy';

const HOME_URL = '/';
const LOGIN_URL = '/auth/login';
const LOGO_SRC = '/images/new_ui/logo_landing_page.png';

export default function ForOrganizationsScreen() {
  const { copy, language, setLanguage, languages, dir } = usePublicPageI18n();
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);
  const selectedLanguage = languages.find((item) => item.code === language) ?? languages[0];
  const common = copy.common;
  const org = copy.organizations;
  const audiences = org.audiences;
  const pillars = org.pillars;
  const pilotSteps = org.pilotSteps;

  return (
    <main className="flo-org-page" lang={language} dir={dir}>
      <OrgStyles />

      <nav className="fo-nav" aria-label={org.heroEyebrow}>
        <a href={HOME_URL} className="fo-logo" aria-label={common.floentlyHome}>
          <img src={LOGO_SRC} alt="" className="fo-logo-img" />
          <span className="fo-logo-text">Floently</span>
        </a>
        <div className="fo-nav-links">
          <a href="#employers">{org.navEmployers}</a>
          <a href="#cities">{org.navCities}</a>
          <a href="/contact">{common.bookDemo}</a>
          <a href={LOGIN_URL} className="fo-signin">{common.signIn}</a>
        </div>
      </nav>

      <section className="fo-hero">
        <div className="fo-hero-copy">
          <p className="fo-eyebrow">{org.heroEyebrow}</p>
          <h1>{org.heroTitle}</h1>
          <p className="fo-lede">{org.heroLede}</p>
          <div className="fo-actions">
            <a href="/contact" className="fo-primary">{common.bookDemo} <span>→</span></a>
            <a href={HOME_URL} className="fo-secondary">{org.viewLearnerPage}</a>
          </div>
        </div>

        <aside className="fo-hero-card" aria-label={org.valueSummaryLabel}>
          <div className="fo-card-kicker">{org.cardKicker}</div>
          <h2>{org.whyTitle}</h2>
          <p>{org.whyBody}</p>
          <div className="fo-metrics">
            <span><strong>{org.metricYki}</strong> {org.readiness}</span>
            <span><strong>{org.metricWorkplace}</strong> {org.scenarios}</span>
            <span><strong>{org.metricSpeaking}</strong> {org.practice}</span>
          </div>
        </aside>
      </section>

      <section className="fo-section fo-light" id="who">
        <div className="fo-section-head">
          <p className="fo-section-eyebrow">{org.whoEyebrow}</p>
          <h2>{org.whoTitle}</h2>
          <p>{org.whoBody}</p>
        </div>
        <div className="fo-audience-grid">
          {audiences.map((item) => (
            <article className="fo-audience-card" key={item.id} id={item.id}>
              <span>{item.label}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="fo-section fo-dark" id="platform">
        <div className="fo-section-head fo-section-head-dark">
          <p className="fo-section-eyebrow">{org.platformEyebrow}</p>
          <h2>{org.platformTitle}</h2>
          <p>{org.platformBody}</p>
        </div>
        <div className="fo-pillar-grid">
          {pillars.map((pillar) => (
            <article className="fo-pillar-card" key={pillar.id}>
              <div className="fo-pillar-eyebrow">{pillar.eyebrow}</div>
              <h3>{pillar.title}</h3>
              <p>{pillar.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="fo-section fo-light" id="pilot">
        <div className="fo-two-col">
          <div>
            <p className="fo-section-eyebrow">{org.pilotEyebrow}</p>
            <h2>{org.pilotTitle}</h2>
            <p>{org.pilotBody}</p>
          </div>
          <ol className="fo-steps">
            {pilotSteps.map((step, index) => (
              <li key={step}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="fo-demo" id="book-demo">
        <div className="fo-demo-inner">
          <p className="fo-eyebrow">{org.demoEyebrow}</p>
          <h2>{org.demoTitle}</h2>
          <p>{org.demoBody}</p>
          <div className="fo-demo-actions">
            <a href="/contact" className="fo-primary fo-primary-light">{common.openContactForm}</a>
            <a href={HOME_URL} className="fo-demo-muted">{common.backToFloently}</a>
          </div>
          <div className="fo-demo-note">{org.demoNote}</div>
        </div>
      </section>


      <section className="fo-language-footer" aria-label={common.language}>

        <div className="fo-language-picker">
          <button
            type="button"
            className="fo-language-current"
            onClick={() => setLanguagePickerOpen((open) => !open)}
            aria-expanded={languagePickerOpen}
          >
            <span className="fo-language-flag" aria-hidden="true">
              {PUBLIC_LANGUAGE_FLAGS[selectedLanguage.code] ?? '🌐'}
            </span>
            <span className="fo-language-current-text">
              {selectedLanguage.label}
            </span>
            <span className="fo-language-chevron" aria-hidden="true">
              {languagePickerOpen ? '▲' : '▼'}
            </span>
          </button>

          {languagePickerOpen ? (
            <div className="fo-language-list" role="listbox">
              {languages.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  className={`fo-language-option ${item.code === language ? 'fo-language-option-active' : ''}`}
                  onClick={() => {
                    setLanguage(item.code);
                    setLanguagePickerOpen(false);
                  }}
                  aria-selected={item.code === language}
                  role="option"
                >
                  <span className="fo-language-flag" aria-hidden="true">
                    {PUBLIC_LANGUAGE_FLAGS[item.code] ?? '🌐'}
                  </span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <footer className="fo-footer">
        <span>© {new Date().getFullYear()} Floently. {org.footerBuilt}</span>
        <div>
          <a href={HOME_URL}>{common.learnerPage}</a>
          <a href="/contact">{common.contact}</a>
          <a href={LOGIN_URL}>{common.signIn}</a>
        </div>
      </footer>
    </main>
  );
}

function OrgStyles() {
  return (
    <style>{`
      .flo-org-page, .flo-org-page * { box-sizing: border-box; }
      .flo-org-page {
        min-height: 100vh;
        background: #F6F8FD;
        color: #0A1838;
        font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
        line-height: 1.5;
        -webkit-font-smoothing: antialiased;
        overflow-x: hidden;
      }
      .flo-org-page a { color: inherit; text-decoration: none; }
      .fo-nav {
        max-width: 1220px;
        margin: 0 auto;
        padding: 22px 28px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
      }
      .fo-logo {
        display: inline-flex;
        align-items: center;
        height: 48px;
        padding: 0 12px;
        background: #FFFFFF;
        border: 1px solid rgba(10, 24, 56, 0.08);
        border-radius: 14px;
        box-shadow: 0 10px 30px rgba(10, 24, 56, 0.08);
      }
      .fo-logo-img { height: 30px; width: auto; object-fit: contain; display: block; }
      .fo-logo-text { margin-left: 6px; font-size: 17px; font-weight: 850; letter-spacing: -0.03em; }
      .fo-nav-links { display: flex; align-items: center; gap: 18px; font-size: 14px; font-weight: 700; color: #42526E; }
      .fo-nav-links a:hover { color: #2453D4; }
      .fo-signin { padding: 9px 16px; border: 1px solid rgba(10, 24, 56, 0.12); border-radius: 999px; background: #FFFFFF; }

      .fo-hero {
        max-width: 1220px;
        margin: 0 auto;
        padding: 78px 28px 96px;
        display: grid;
        grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.8fr);
        gap: 46px;
        align-items: center;
      }
      .fo-eyebrow, .fo-section-eyebrow {
        margin: 0 0 14px;
        color: #2453D4;
        font-size: 12px;
        font-weight: 850;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }
      .fo-hero h1 {
        max-width: 820px;
        margin: 0;
        font-size: clamp(42px, 6.2vw, 76px);
        line-height: 0.96;
        letter-spacing: -0.065em;
      }
      .fo-lede {
        max-width: 690px;
        margin: 28px 0 0;
        color: #52627A;
        font-size: 20px;
        line-height: 1.65;
      }
      .fo-actions, .fo-demo-actions { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 32px; align-items: center; }
      .fo-primary, .fo-secondary {
        min-height: 48px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        padding: 0 22px;
        font-weight: 850;
        transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
      }
      .fo-primary { background: #2453D4; color: #FFFFFF; box-shadow: 0 18px 42px rgba(36, 83, 212, 0.24); }
      .fo-primary:hover { transform: translateY(-2px); box-shadow: 0 22px 50px rgba(36, 83, 212, 0.30); }
      .fo-secondary { background: #FFFFFF; border: 1px solid rgba(10, 24, 56, 0.10); color: #0A1838; }
      .fo-primary span { margin-left: 8px; }
      .fo-hero-card {
        background: #0A1838;
        color: #F5F9FF;
        border-radius: 30px;
        padding: 34px;
        box-shadow: 0 34px 90px rgba(10, 24, 56, 0.22);
        position: relative;
        overflow: hidden;
      }
      .fo-hero-card::before {
        content: '';
        position: absolute;
        inset: -80px -80px auto auto;
        width: 220px;
        height: 220px;
        background: radial-gradient(circle, rgba(62,197,168,0.26), transparent 65%);
      }
      .fo-card-kicker { color: #3EC5A8; font-weight: 850; font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; }
      .fo-hero-card h2 { margin: 20px 0 12px; font-size: 32px; line-height: 1.08; letter-spacing: -0.035em; }
      .fo-hero-card p { color: #B8C6DD; font-size: 16px; line-height: 1.7; margin: 0; }
      .fo-metrics { display: grid; gap: 10px; margin-top: 28px; }
      .fo-metrics span { display: flex; justify-content: space-between; gap: 12px; padding: 13px 14px; border-radius: 16px; background: rgba(255,255,255,0.06); color: #DDE7F7; }
      .fo-metrics strong { color: #FFFFFF; }

      .fo-section { padding: 92px 28px; }
      .fo-light { background: #FFFFFF; }
      .fo-dark { background: #0A1838; color: #F5F9FF; }
      .fo-section-head, .fo-two-col, .fo-audience-grid, .fo-pillar-grid { max-width: 1160px; margin: 0 auto; }
      .fo-section-head { max-width: 780px; margin-bottom: 44px; }
      .fo-section-head h2, .fo-two-col h2, .fo-demo h2 {
        margin: 0;
        font-size: clamp(32px, 4.2vw, 52px);
        line-height: 1.03;
        letter-spacing: -0.052em;
      }
      .fo-section-head p, .fo-two-col p, .fo-demo p { color: #52627A; font-size: 18px; line-height: 1.68; margin: 18px 0 0; }
      .fo-section-head-dark p { color: #A8BAD6; }
      .fo-audience-grid, .fo-pillar-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
      .fo-audience-card, .fo-pillar-card {
        border-radius: 24px;
        padding: 28px;
        border: 1px solid rgba(10, 24, 56, 0.08);
        background: #F6F8FD;
        min-height: 255px;
      }
      .fo-audience-card span, .fo-pillar-eyebrow { color: #2453D4; font-weight: 850; font-size: 12px; text-transform: uppercase; letter-spacing: 0.11em; }
      .fo-audience-card h3, .fo-pillar-card h3 { font-size: 23px; line-height: 1.16; letter-spacing: -0.03em; margin: 18px 0 12px; }
      .fo-audience-card p, .fo-pillar-card p { color: #52627A; margin: 0; line-height: 1.65; }
      .fo-pillar-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .fo-pillar-card { background: rgba(255,255,255,0.055); border-color: rgba(255,255,255,0.10); }
      .fo-pillar-card h3 { color: #FFFFFF; }
      .fo-pillar-card p { color: #A8BAD6; }
      .fo-pillar-eyebrow { color: #3EC5A8; }

      .fo-two-col { display: grid; grid-template-columns: minmax(0, 0.85fr) minmax(360px, 1fr); gap: 54px; align-items: start; }
      .fo-steps { list-style: none; padding: 0; margin: 0; display: grid; gap: 14px; }
      .fo-steps li { display: grid; grid-template-columns: 54px 1fr; gap: 16px; background: #F6F8FD; border: 1px solid rgba(10,24,56,0.08); border-radius: 22px; padding: 18px; }
      .fo-steps span { width: 42px; height: 42px; display: inline-flex; align-items: center; justify-content: center; background: #0A1838; color: #FFFFFF; border-radius: 999px; font-weight: 850; font-size: 13px; }
      .fo-steps p { margin: 0; color: #42526E; font-size: 15px; line-height: 1.55; }

      .fo-demo { padding: 96px 28px; background: linear-gradient(135deg, #2453D4 0%, #0A1838 72%); color: #FFFFFF; }
      .fo-demo-inner { max-width: 880px; margin: 0 auto; text-align: center; }
      .fo-demo .fo-eyebrow { color: #8EDFCC; }
      .fo-demo p { color: #DDE7F7; max-width: 680px; margin-left: auto; margin-right: auto; }
      .fo-demo-actions { justify-content: center; }
      .fo-primary-light { background: #FFFFFF; color: #0A1838; box-shadow: 0 18px 42px rgba(0,0,0,0.18); }
      .fo-demo-muted { color: #DDE7F7; font-weight: 800; padding: 12px 8px; }
      .fo-demo-note { margin: 22px auto 0; max-width: 620px; color: #A8BAD6; font-size: 14px; }

      .fo-footer { max-width: 1220px; margin: 0 auto; padding: 30px 28px; display: flex; justify-content: space-between; gap: 20px; flex-wrap: wrap; color: #52627A; font-size: 14px; }
      .fo-footer div { display: flex; gap: 18px; flex-wrap: wrap; font-weight: 750; }
      .fo-footer a:hover { color: #2453D4; }

      @media (max-width: 980px) {
        .fo-hero, .fo-two-col { grid-template-columns: 1fr; }
        .fo-audience-grid, .fo-pillar-grid { grid-template-columns: 1fr 1fr; }
      }
      @media (max-width: 720px) {
        .fo-nav { padding: 16px 20px; align-items: flex-start; }
        .fo-nav-links { gap: 10px; flex-wrap: wrap; justify-content: flex-end; font-size: 12px; }
        .fo-nav-links a:not(.fo-signin):nth-child(1), .fo-nav-links a:not(.fo-signin):nth-child(2) { display: none; }
        .fo-hero { padding: 42px 20px 62px; }
        .fo-lede { font-size: 17px; }
        .fo-hero-card { padding: 24px; border-radius: 24px; }
        .fo-section, .fo-demo { padding: 62px 20px; }
        .fo-audience-grid, .fo-pillar-grid { grid-template-columns: 1fr; }
        .fo-audience-card, .fo-pillar-card { min-height: auto; }
        .fo-footer { padding: 24px 20px; flex-direction: column; }
      }

        /* Floently web logo pill: intentional header brand treatment */
        .fo-logo,
        .fo-brand,
        .fo-nav-logo,
        .fo-navbar-brand,
        .fo-logo-card,
        .fo-brand-card {
          background: #ffffff !important;
          border: 1px solid rgba(7, 22, 56, 0.08) !important;
          box-shadow: 0 18px 45px rgba(7, 22, 56, 0.16) !important;
          padding: 10px 18px !important;
          border-radius: 14px !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 10px !important;
        }

        .fo-logo img,
        .fo-brand img,
        .fo-nav-logo img,
        .fo-navbar-brand img {
          height: 28px !important;
          width: auto !important;
          max-height: 28px !important;
          object-fit: contain !important;
          display: block !important;
        }

        .fo-logo span,
        .fo-brand span,
        .fo-nav-logo span,
        .fo-navbar-brand span {
          color: #071638 !important;
          font-weight: 900 !important;
          letter-spacing: -0.02em !important;
          line-height: 1 !important;
        }

        @media (max-width: 640px) {
          .fo-logo,
          .fo-brand,
          .fo-nav-logo,
          .fo-navbar-brand,
          .fo-logo-card,
          .fo-brand-card {
            padding: 8px 12px !important;
            border-radius: 12px !important;
          }

          .fo-logo img,
          .fo-brand img,
          .fo-nav-logo img,
          .fo-navbar-brand img {
            height: 24px !important;
            max-height: 24px !important;
          }
        }

        /* Floently web header logo: no white pill, slightly larger */
        .fo-logo,
        .fo-brand,
        .fo-nav-logo,
        .fo-navbar-brand,
        .fo-logo-card,
        .fo-brand-card {
          background: transparent !important;
          border: 0 !important;
          box-shadow: none !important;
          padding: 0 !important;
          border-radius: 0 !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 12px !important;
        }

        .fo-logo img,
        .fo-brand img,
        .fo-nav-logo img,
        .fo-navbar-brand img {
          height: 105px !important;
          width: auto !important;
          max-height: 105px !important;
          object-fit: contain !important;
          display: block !important;
          background: transparent !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }

        .fo-logo span,
        .fo-brand span,
        .fo-nav-logo span,
        .fo-navbar-brand span {
          color: #071638 !important;
          font-weight: 900 !important;
          letter-spacing: -0.02em !important;
          line-height: 1 !important;
          font-size: 2.4rem !important;
        }

        @media (max-width: 640px) {
          .fo-logo,
          .fo-brand,
          .fo-nav-logo,
          .fo-navbar-brand,
          .fo-logo-card,
          .fo-brand-card {
            gap: 10px !important;
          }

          .fo-logo img,
          .fo-brand img,
          .fo-nav-logo img,
          .fo-navbar-brand img {
            height: 90px !important;
            max-height: 90px !important;
          }

          .fo-logo span,
          .fo-brand span,
          .fo-nav-logo span,
          .fo-navbar-brand span {
            font-size: 2rem !important;
          }
        }

      .fo-language-footer {
        width: min(360px, calc(100% - 48px));
        margin: 28px auto 0;
        padding: 0 0 28px;
        position: relative;
      }
      .fo-language-picker {
        position: relative;
        width: 100%;
      }
      .fo-language-current {
        width: 100%;
        min-height: 48px;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 10px;
        padding: 0 14px;
        border-radius: 18px;
        border: 1px solid rgba(10, 24, 56, 0.12);
        background: #FFFFFF;
        color: #0A1838;
        font-size: 14px;
        font-weight: 900;
        cursor: pointer;
        text-align: left;
      }
      .fo-language-current-text {
        flex: 1;
      }
      .fo-language-chevron {
        font-size: 11px;
        opacity: 0.75;
      }
      .fo-language-list {
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
        border: 1px solid rgba(10, 24, 56, 0.12);
        background: #FFFFFF;
        backdrop-filter: blur(18px);
        box-shadow: 0 24px 80px rgba(10, 24, 56, 0.16);
        z-index: 20;
        scrollbar-width: thin;
      }
      .fo-language-option {
        width: 100%;
        min-height: 42px;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 12px;
        border-radius: 14px;
        border: 1px solid transparent;
        background: transparent;
        color: #0A1838;
        font-size: 13px;
        font-weight: 850;
        cursor: pointer;
        text-align: left;
      }
      .fo-language-option-active {
        background: #0A1838;
        color: #FFFFFF;
        border-color: #0A1838;
      }
      .fo-language-flag {
        width: 26px;
        font-size: 18px;
        line-height: 1;
        text-align: center;
        flex: 0 0 auto;
      }

      /* Neo-tactile public button polish */
      .fo-primary,
      .fo-secondary,
      .fo-signin,
      .fo-demo-muted,
      .fo-nav a[href*="login"],
      .fo-nav a[href*="contact"],
      .fo-nav a[href*="book"],
      .fo-language-current {
        border-radius: 999px !important;
        border: 1px solid rgba(10, 24, 56, 0.12) !important;
        background:
          radial-gradient(circle at 25% 18%, rgba(255,255,255,0.86), transparent 32%),
          linear-gradient(135deg, rgba(255,255,255,0.92), rgba(237,243,255,0.78)) !important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.95),
          0 16px 42px rgba(10, 24, 56, 0.12) !important;
        backdrop-filter: blur(18px) saturate(140%);
        transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, background 160ms ease;
      }

      .fo-primary,
      .fo-primary-light {
        background:
          radial-gradient(circle at 28% 20%, rgba(255,255,255,0.36), transparent 28%),
          linear-gradient(135deg, #2F6BFF, #1650D8) !important;
        color: #FFFFFF !important;
        border-color: rgba(80, 145, 255, 0.40) !important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.30),
          0 18px 50px rgba(36, 91, 232, 0.30),
          0 0 30px rgba(36, 91, 232, 0.16) !important;
      }

      .fo-primary:hover,
      .fo-secondary:hover,
      .fo-signin:hover,
      .fo-demo-muted:hover,
      .fo-language-current:hover {
        transform: translateY(-2px);
        border-color: rgba(58, 118, 255, 0.34) !important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.95),
          0 22px 58px rgba(10, 24, 56, 0.18),
          0 0 30px rgba(36, 91, 232, 0.12) !important;
      }

      .fo-primary:active,
      .fo-secondary:active,
      .fo-signin:active,
      .fo-demo-muted:active,
      .fo-language-current:active {
        transform: translateY(1px) scale(0.99);
      }







    `}</style>
  );
}

