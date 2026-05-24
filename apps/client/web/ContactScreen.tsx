import React, { useMemo, useState } from 'react';
import { usePublicPageI18n } from './i18n/publicMarketingCopy';

const CONTACT_EMAIL = 'pilots@floently.com';
const LOGO_SRC = '/images/new_ui/logo_landing_page.png';

type FormState = {
  name: string;
  organization: string;
  role: string;
  email: string;
  phone: string;
  organizationType: string;
  learners: string;
  message: string;
};

const initialForm: FormState = {
  name: '',
  organization: '',
  role: '',
  email: '',
  phone: '',
  organizationType: 'employer',
  learners: '',
  message: '',
};

export default function ContactScreen() {
  const { copy, language, setLanguage, languages, dir } = usePublicPageI18n();
  const common = copy.common;
  const contact = copy.contact;
  const [form, setForm] = useState<FormState>(initialForm);

  const selectedOrganizationTypeLabel =
    contact.organizationTypes.find((item) => item.value === form.organizationType)?.label ?? form.organizationType;

  const mailtoUrl = useMemo(() => {
    const subject = `${contact.mailtoSubjectPrefix} ${form.organization || contact.mailtoFallbackOrganization}`;

    const body = [
      contact.mailtoGreeting,
      '',
      contact.mailtoIntro,
      '',
      `${contact.mailtoName}: ${form.name || '-'}`,
      `${contact.mailtoOrganization}: ${form.organization || '-'}`,
      `${contact.mailtoRole}: ${form.role || '-'}`,
      `${contact.mailtoWorkEmail}: ${form.email || '-'}`,
      `${contact.mailtoPhone}: ${form.phone || '-'}`,
      `${contact.mailtoOrganizationType}: ${selectedOrganizationTypeLabel || '-'}`,
      `${contact.mailtoLearners}: ${form.learners || '-'}`,
      '',
      contact.mailtoNeedHelp,
      form.message || '-',
      '',
      contact.mailtoRegards,
      form.name || '',
    ].join('\n');

    return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [contact, form, selectedOrganizationTypeLabel]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openPreparedEmail() {
    window.location.href = mailtoUrl;
  }

  return (
    <main className="fc-page" lang={language} dir={dir}>
      <style>{`
        html, body, #root {
          min-height: 100%;
          overflow-x: hidden;
          overflow-y: auto;
        }

        .fc-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 20% 10%, rgba(54, 103, 246, 0.12), transparent 32%),
            radial-gradient(circle at 80% 8%, rgba(69, 204, 184, 0.13), transparent 30%),
            #f6f8fc;
          color: #071638;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .fc-shell {
          width: min(1120px, calc(100% - 40px));
          margin: 0 auto;
          padding: 32px 0 72px;
        }

        .fc-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          margin-bottom: 72px;
        }

        .fc-brand {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: #071638;
          font-weight: 900;
          font-size: 2.4rem;
          letter-spacing: -0.02em;
        }

        .fc-brand img {
          height: 105px;
          width: auto;
          display: block;
          object-fit: contain;
        }

        .fc-nav-links {
          display: flex;
          align-items: center;
          gap: 22px;
          font-weight: 800;
          font-size: 0.95rem;
        }

        .fc-nav-links a {
          color: #071638;
          text-decoration: none;
        }

        .fc-lang-select {
          appearance: none;
          border: 1px solid rgba(7, 22, 56, 0.12);
          border-radius: 999px;
          background: #ffffff;
          color: #071638;
          font: inherit;
          font-weight: 900;
          padding: 12px 14px;
          outline: none;
        }

        .fc-signin {
          padding: 12px 18px;
          border-radius: 999px;
          border: 1px solid rgba(7, 22, 56, 0.12);
          background: #ffffff;
        }

        .fc-hero {
          display: grid;
          grid-template-columns: 0.9fr 1.1fr;
          gap: 48px;
          align-items: start;
        }

        .fc-eyebrow {
          color: #2f61e8;
          font-weight: 900;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          font-size: 0.78rem;
          margin: 0 0 16px;
        }

        .fc-title {
          margin: 0;
          font-size: clamp(3rem, 6vw, 5.8rem);
          line-height: 0.92;
          letter-spacing: -0.08em;
        }

        .fc-copy {
          margin: 26px 0 0;
          color: #435577;
          font-size: 1.15rem;
          line-height: 1.7;
          max-width: 560px;
        }

        .fc-email-card {
          margin-top: 32px;
          padding: 22px;
          border-radius: 26px;
          background: #ffffff;
          border: 1px solid rgba(7, 22, 56, 0.08);
          box-shadow: 0 24px 70px rgba(7, 22, 56, 0.08);
        }

        .fc-email-card p {
          margin: 0 0 8px;
          color: #64708a;
          font-weight: 800;
          font-size: 0.9rem;
        }

        .fc-email-card a {
          color: #225be8;
          font-weight: 900;
          font-size: 1.2rem;
          text-decoration: none;
        }

        .fc-form {
          background: #ffffff;
          border-radius: 34px;
          padding: 34px;
          border: 1px solid rgba(7, 22, 56, 0.08);
          box-shadow: 0 34px 100px rgba(7, 22, 56, 0.12);
        }

        .fc-form h2 {
          margin: 0 0 8px;
          font-size: 2rem;
          letter-spacing: -0.04em;
        }

        .fc-form-intro {
          margin: 0 0 26px;
          color: #64708a;
          line-height: 1.6;
        }

        .fc-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .fc-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .fc-field-full {
          grid-column: 1 / -1;
        }

        .fc-field label {
          font-weight: 900;
          font-size: 0.86rem;
          color: #1a2c55;
        }

        .fc-field input,
        .fc-field select,
        .fc-field textarea {
          border: 1px solid rgba(7, 22, 56, 0.14);
          border-radius: 18px;
          padding: 15px 16px;
          font: inherit;
          color: #071638;
          background: #f8faff;
          outline: none;
        }

        .fc-field textarea {
          min-height: 130px;
          resize: vertical;
        }

        .fc-actions {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 24px;
          flex-wrap: wrap;
        }

        .fc-primary {
          border: 0;
          border-radius: 999px;
          cursor: pointer;
          font: inherit;
          background: #245be8;
          color: #ffffff;
          padding: 16px 24px;
          text-decoration: none;
          font-weight: 900;
          box-shadow: 0 18px 44px rgba(36, 91, 232, 0.25);
        }

        .fc-note {
          color: #64708a;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        @media (max-width: 900px) {
          .fc-hero {
            grid-template-columns: 1fr;
          }

          .fc-nav {
            margin-bottom: 44px;
          }

          .fc-brand {
            font-size: 2rem;
          }

          .fc-brand img {
            height: 90px;
          }
        }

        @media (max-width: 640px) {
          .fc-shell {
            width: min(100% - 28px, 1120px);
            padding-top: 20px;
          }

          .fc-nav {
            align-items: flex-start;
            flex-direction: column;
          }

          .fc-nav-links {
            width: 100%;
            justify-content: space-between;
            gap: 12px;
            font-size: 0.85rem;
          }

          .fc-grid {
            grid-template-columns: 1fr;
          }

          .fc-form {
            padding: 24px;
            border-radius: 26px;
          }
        }

      /* Neo-tactile contact button polish */
      .fc-primary,
      .fc-signin,
      .fc-nav-links a,
      .fc-form button {
        border-radius: 999px !important;
        border: 1px solid rgba(10, 24, 56, 0.12) !important;
        background:
          radial-gradient(circle at 25% 18%, rgba(255,255,255,0.86), transparent 32%),
          linear-gradient(135deg, rgba(255,255,255,0.94), rgba(237,243,255,0.78)) !important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.95),
          0 16px 42px rgba(10, 24, 56, 0.12) !important;
        backdrop-filter: blur(18px) saturate(140%);
        transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, background 160ms ease;
      }

      .fc-primary {
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

      .fc-primary:hover,
      .fc-signin:hover,
      .fc-nav-links a:hover {
        transform: translateY(-2px);
        border-color: rgba(58, 118, 255, 0.34) !important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.95),
          0 22px 58px rgba(10, 24, 56, 0.18),
          0 0 30px rgba(36, 91, 232, 0.12) !important;
      }

      .fc-primary:active,
      .fc-signin:active,
      .fc-nav-links a:active {
        transform: translateY(1px) scale(0.99);
      }

      `}</style>

      <section className="fc-shell">
        <nav className="fc-nav" aria-label="Contact navigation">
          <a href="/" className="fc-brand" aria-label={common.floentlyHome}>
            <img src={LOGO_SRC} alt="" />
            <span>Floently</span>
          </a>

          <div className="fc-nav-links">
            <a href="/">{common.learnerPage}</a>
            <a href="/for-organizations">{common.forOrganizations}</a>
            <select
              className="fc-lang-select"
              aria-label={common.language}
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
            >
              {languages.map((item) => (
                <option key={item.code} value={item.code}>{item.label}</option>
              ))}
            </select>
            <a href="/auth/login" className="fc-signin">{common.signIn}</a>
          </div>
        </nav>

        <div className="fc-hero">
          <section>
            <p className="fc-eyebrow">{contact.eyebrow}</p>
            <h1 className="fc-title">{contact.title}</h1>
            <p className="fc-copy">{contact.copy}</p>

            <div className="fc-email-card">
              <p>{contact.directEmail}</p>
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </div>
          </section>

          <form className="fc-form" onSubmit={(event) => { event.preventDefault(); openPreparedEmail(); }}>
            <h2>{contact.formTitle}</h2>
            <p className="fc-form-intro">{contact.formIntro}</p>

            <div className="fc-grid">
              <div className="fc-field">
                <label htmlFor="name">{contact.name}</label>
                <input id="name" value={form.name} onChange={(event) => update('name', event.target.value)} placeholder={contact.namePlaceholder} />
              </div>

              <div className="fc-field">
                <label htmlFor="email">{contact.email}</label>
                <input id="email" type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder={contact.emailPlaceholder} />
              </div>

              <div className="fc-field">
                <label htmlFor="organization">{contact.organization}</label>
                <input id="organization" value={form.organization} onChange={(event) => update('organization', event.target.value)} placeholder={contact.organizationPlaceholder} />
              </div>

              <div className="fc-field">
                <label htmlFor="role">{contact.role}</label>
                <input id="role" value={form.role} onChange={(event) => update('role', event.target.value)} placeholder={contact.rolePlaceholder} />
              </div>

              <div className="fc-field">
                <label htmlFor="organizationType">{contact.organizationType}</label>
                <select id="organizationType" value={form.organizationType} onChange={(event) => update('organizationType', event.target.value)}>
                  {contact.organizationTypes.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>

              <div className="fc-field">
                <label htmlFor="learners">{contact.learners}</label>
                <input id="learners" value={form.learners} onChange={(event) => update('learners', event.target.value)} placeholder={contact.learnersPlaceholder} />
              </div>

              <div className="fc-field fc-field-full">
                <label htmlFor="phone">{contact.phone}</label>
                <input id="phone" value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder={contact.phonePlaceholder} />
              </div>

              <div className="fc-field fc-field-full">
                <label htmlFor="message">{contact.message}</label>
                <textarea id="message" value={form.message} onChange={(event) => update('message', event.target.value)} placeholder={contact.messagePlaceholder} />
              </div>
            </div>

            <div className="fc-actions">
              <button className="fc-primary" type="submit">{contact.sendDemoRequest}</button>
              <span className="fc-note">{contact.note}</span>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
