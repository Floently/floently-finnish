import React from "react";

const LOGIN_URL = '/auth/login';

const heroVisualStyle: React.CSSProperties = {
  borderRadius: 28,
  border: '1px solid rgba(31,71,232,0.14)',
  background: 'linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%)',
  minHeight: 420,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  gap: 18,
  padding: 24,
  boxShadow: '0 20px 60px rgba(15,23,42,0.08)',
};

const trustPoints = [
  'YKI-aligned preparation',
  'Profession-specific learning paths',
  'Workplace communication practice',
  'Supports integration and settlement goals',
  'Scalable for employers and city programmes',
];

const audienceCards = [
  {
    title: 'For Learners',
    body: 'Prepare for YKI, improve your Finnish for work, and build confidence for everyday life in Finland.',
    cta: 'Start learning',
  },
  {
    title: 'For Employers',
    body: 'Support international employees with practical Finnish for onboarding, teamwork, and workplace communication.',
    cta: 'Book employer demo',
  },
  {
    title: 'For Cities and Municipalities',
    body: 'Offer residents a scalable pathway from language learning to work, integration, and long-term participation in Finland.',
    cta: 'Talk to us',
  },
];

const pathways = [
  {
    title: 'YKI Preparation',
    body: 'Prepare for speaking, writing, reading, and listening with guided practice built around YKI goals for work, citizenship, and permanent residence.',
  },
  {
    title: 'Professional Finnish',
    body: 'Build profession-specific Finnish for healthcare and other work pathways, with language for real job situations and daily teamwork.',
  },
  {
    title: 'Life in Finland Readiness',
    body: 'Strengthen the Finnish needed for work, services, official communication, and long-term goals such as citizenship and permanent residence.',
  },
];

const professionCards = [
  {
    title: 'YKI Pathway',
    body: 'Guided practice for reading, listening, writing, and speaking with clear progress toward test readiness and long-term life in Finland.',
  },
  {
    title: 'Doctor Finnish',
    body: 'Patient interaction, explanations, documentation, teamwork, and communication in real healthcare settings.',
  },
  {
    title: 'Nurse Finnish',
    body: 'Patient care, handovers, reporting, medication language, and practical communication for everyday nursing work.',
  },
  {
    title: 'Practical Nurse Finnish',
    body: 'Care work routines, resident interaction, relatives, teamwork, and practical language for real care environments.',
  },
  {
    title: 'Workplace Communication',
    body: 'Supervisor conversations, issue reporting, clarifying instructions, and language that supports employability and retention.',
  },
  {
    title: 'Life in Finland Pathway',
    body: 'Useful Finnish for daily services, official communication, and the language confidence needed for long-term life in Finland.',
  },
];

export default function LearnLandingPage() {
  const continueToLogin = () => {
    if (typeof window !== 'undefined') {
      window.location.assign(LOGIN_URL);
    }
  };

  return (
    <main style={{ background: '#ffffff', minHeight: '100vh', color: '#0e1628' }}>
      <section style={{ maxWidth: 1260, margin: '0 auto', padding: '36px 28px 72px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48, gap: 20, flexWrap: 'wrap' }}>
          <img alt="Floently" src="/images/new_ui/use_this_app_logo_no_background.png" style={{ height: 62, objectFit: 'contain' }} />
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <button style={{ border: 'none', background: 'transparent', color: '#44536c', fontWeight: 700 }}>For Learners</button>
            <button style={{ border: 'none', background: 'transparent', color: '#44536c', fontWeight: 700 }}>For Employers</button>
            <button style={{ border: 'none', background: 'transparent', color: '#44536c', fontWeight: 700 }}>For Cities</button>
            <button type="button" onClick={continueToLogin} style={{ minHeight: 42, borderRadius: 999, border: '1px solid #d9e3f3', padding: '0 18px', background: '#ffffff', color: '#0e1628', fontWeight: 700 }}>Continue to sign in</button>
            <button style={{ minHeight: 42, borderRadius: 999, border: 'none', padding: '0 18px', background: '#1F47E8', color: '#ffffff', fontWeight: 800 }}>Book a demo</button>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1.08fr 0.92fr', gap: 28, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', borderRadius: 999, background: '#EAF0FF', color: '#1F47E8', padding: '7px 12px', fontSize: 12, fontWeight: 800, marginBottom: 18 }}>
              FINNISH FOR WORK, SETTLEMENT, AND REAL OUTCOMES
            </div>
            <h1 style={{ fontSize: 64, lineHeight: 1.02, letterSpacing: '-0.04em', margin: '0 0 18px' }}>
              Pass YKI.
              <span style={{ color: '#1F47E8' }}> Succeed in work and life </span>
              in Finland.
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.7, color: '#53627C', maxWidth: 640, margin: '0 0 26px' }}>
              A Finnish language platform for YKI preparation, workplace communication, citizenship, and permanent residence goals — built for learners, employers, and cities.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
              <button style={{ minHeight: 46, borderRadius: 999, border: 'none', padding: '0 20px', background: '#1F47E8', color: '#ffffff', fontWeight: 800 }}>Book a demo</button>
              <button type="button" onClick={continueToLogin} style={{ minHeight: 46, borderRadius: 999, border: '1px solid #d9e3f3', padding: '0 18px', background: '#ffffff', color: '#0e1628', fontWeight: 700 }}>Continue to sign in</button>
              <button style={{ minHeight: 46, borderRadius: 999, border: '1px dashed rgba(31,71,232,0.28)', padding: '0 18px', background: '#f8fbff', color: '#1F47E8', fontWeight: 700 }}>For employers and cities</button>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {['YKI', 'Workplace Finnish', 'Citizenship', 'Permanent residence'].map((item) => (
                <span key={item} style={{ borderRadius: 999, background: item === 'Permanent residence' ? '#FFF5DA' : '#F4F7FC', color: '#33445c', padding: '8px 12px', fontSize: 12, fontWeight: 700 }}>{item}</span>
              ))}
            </div>
          </div>

          <div style={heroVisualStyle}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#1F47E8', marginBottom: 12 }}>ONE PLATFORM, THREE PATHWAYS</div>
              <h2 style={{ fontSize: 28, lineHeight: 1.15, margin: '0 0 10px' }}>YKI, workplace communication, and life in Finland readiness.</h2>
              <p style={{ margin: 0, color: '#59708f', fontSize: 15, lineHeight: 1.7 }}>
                The platform helps people prepare for the YKI exam, use Finnish at work, and build the language confidence needed for citizenship, permanent residence, and everyday life in Finland.
              </p>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ borderRadius: 18, background: '#ffffff', padding: 16, border: '1px solid rgba(31,71,232,0.08)' }}>
                <strong style={{ display: 'block', marginBottom: 6 }}>For learners</strong>
                <span style={{ color: '#59708f', fontSize: 14 }}>Pass YKI, prepare for work, and build long-term Finnish confidence.</span>
              </div>
              <div style={{ borderRadius: 18, background: '#ffffff', padding: 16, border: '1px solid rgba(31,71,232,0.08)' }}>
                <strong style={{ display: 'block', marginBottom: 6 }}>For employers</strong>
                <span style={{ color: '#59708f', fontSize: 14 }}>Support onboarding, communication, safety, and retention for international staff.</span>
              </div>
              <div style={{ borderRadius: 18, background: '#ffffff', padding: 16, border: '1px solid rgba(31,71,232,0.08)' }}>
                <strong style={{ display: 'block', marginBottom: 6 }}>For cities</strong>
                <span style={{ color: '#59708f', fontSize: 14 }}>Offer scalable pathways for integration, work, and long-term participation in Finland.</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginTop: 44 }}>
          {trustPoints.map((item) => (
            <div key={item} style={{ borderRadius: 16, border: '1px solid #e2e8f2', padding: 14, fontSize: 13, fontWeight: 700, color: '#2c4060', background: '#fbfdff' }}>{item}</div>
          ))}
        </div>

        <section style={{ marginTop: 56 }}>
          <h2 style={{ fontSize: 36, lineHeight: 1.1, marginBottom: 20 }}>General Finnish study is not enough for real outcomes in Finland</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              ['For learners', 'Many learners need more than general language lessons. They need Finnish for YKI, work, everyday communication, and long-term life in Finland.'],
              ['For employers', 'International employees need practical Finnish for safer communication, smoother onboarding, and stronger long-term retention.'],
              ['For cities and municipalities', 'Residents need language support that connects learning with employability, inclusion, settlement, and participation in Finnish society.'],
            ].map(([title, body]) => (
              <article key={title} style={{ borderRadius: 24, border: '1px solid #e2e8f2', background: '#ffffff', padding: 20, boxShadow: '0 14px 40px rgba(15,23,42,0.04)' }}>
                <h3 style={{ margin: '0 0 10px', fontSize: 20 }}>{title}</h3>
                <p style={{ margin: 0, color: '#58667E', lineHeight: 1.7 }}>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 56 }}>
          <h2 style={{ fontSize: 36, lineHeight: 1.1, marginBottom: 20 }}>One platform connecting YKI, work, and settlement outcomes</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {pathways.map((item, index) => (
              <article key={item.title} style={{ borderRadius: 24, border: '1px solid #e2e8f2', background: '#ffffff', padding: 20, boxShadow: '0 14px 40px rgba(15,23,42,0.04)' }}>
                <div style={{ width: 34, height: 34, borderRadius: 12, background: index === 2 ? '#FFF5DA' : '#EAF0FF', marginBottom: 16 }} />
                <h3 style={{ margin: '0 0 8px', fontSize: 20 }}>{item.title}</h3>
                <p style={{ margin: 0, color: '#58667E', lineHeight: 1.7 }}>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 56 }}>
          <h2 style={{ fontSize: 36, lineHeight: 1.1, marginBottom: 20 }}>Built for every pathway into work and life in Finland</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {audienceCards.map((item) => (
              <article key={item.title} style={{ borderRadius: 24, border: '1px solid #e2e8f2', background: '#ffffff', padding: 22, display: 'grid', gap: 12, boxShadow: '0 14px 40px rgba(15,23,42,0.04)' }}>
                <h3 style={{ margin: 0, fontSize: 22 }}>{item.title}</h3>
                <p style={{ margin: 0, color: '#58667E', lineHeight: 1.7 }}>{item.body}</p>
                <button style={{ justifySelf: 'start', minHeight: 42, borderRadius: 999, border: '1px solid #d9e3f3', padding: '0 18px', background: '#ffffff', color: '#1F47E8', fontWeight: 800 }}>{item.cta}</button>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 56 }}>
          <h2 style={{ fontSize: 36, lineHeight: 1.1, marginBottom: 20 }}>Built around real outcomes, not generic textbook Finnish</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {professionCards.map((item) => (
              <article key={item.title} style={{ borderRadius: 22, border: '1px solid #e2e8f2', background: '#ffffff', padding: 18, boxShadow: '0 14px 40px rgba(15,23,42,0.04)' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>{item.title}</h3>
                <p style={{ margin: 0, color: '#58667E', lineHeight: 1.65 }}>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 64, borderRadius: 32, background: 'linear-gradient(135deg, #0f1f4b 0%, #1F47E8 100%)', color: '#ffffff', padding: '34px 32px' }}>
          <h2 style={{ fontSize: 38, lineHeight: 1.1, margin: '0 0 14px' }}>Bring Finnish learning closer to work, settlement, and opportunity</h2>
          <p style={{ fontSize: 17, lineHeight: 1.7, maxWidth: 860, color: 'rgba(255,255,255,0.88)', margin: '0 0 20px' }}>
            Whether you are preparing for YKI, supporting international employees, or helping residents build a future in Finland, Floently Learn offers a practical language pathway built for real outcomes.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button type="button" onClick={continueToLogin} style={{ minHeight: 46, borderRadius: 999, border: 'none', padding: '0 20px', background: '#ffffff', color: '#0f1f4b', fontWeight: 800 }}>Continue to sign in</button>
            <button style={{ minHeight: 46, borderRadius: 999, border: '1px solid rgba(255,255,255,0.28)', padding: '0 20px', background: 'transparent', color: '#ffffff', fontWeight: 800 }}>Book a demo</button>
            <button style={{ minHeight: 46, borderRadius: 999, border: '1px solid rgba(255,255,255,0.28)', padding: '0 20px', background: 'transparent', color: '#ffffff', fontWeight: 800 }}>Talk to us about programme access</button>
          </div>
        </section>
      </section>
    </main>
  );
}
