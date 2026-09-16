# Floently Learn — Web Intelligence Strategy

**Status:** product strategy / research-backed direction  
**Research refresh:** 2026-09-16

## Purpose

Floently Learn should eventually consume the same shared iLoadi remote-browser runtime being built for Floently Read. The browser/session/security/CDP stack should remain a company platform; Learn adds a language-learning experience on top.

The opportunity is to move from “learn Finnish inside our course” to **“learn Finnish inside the real Finnish-speaking world.”**

## Core product idea

A learner opens a real website inside an iLoadi-controlled browser session. The original site remains live and authoritative. Floently adds optional learning assistance around it.

Examples:

- Yle article → vocabulary, pronunciation, grammar, comprehension
- Finnish job advert → workplace language lesson
- Kela/Migri/public-service page → practical comprehension task
- apartment listing → housing vocabulary and phrase practice
- restaurant menu → vocabulary + pronunciation
- university page → academic vocabulary
- healthcare/public-service information → domain-specific language support
- workplace site or intranet → organization-specific Finnish where policy permits

## Learn capabilities to build on top of the shared runtime

### 1. Click-to-learn

- click word → lemma, meaning, translation, pronunciation, inflection
- click phrase → idiom/collocation explanation
- click sentence → grammar explanation, TTS, simpler paraphrase
- show CEFR-aware explanations without altering the source page

### 2. Contextual vocabulary memory

With explicit user consent, record only the learning signals needed for personalization:

- words repeatedly requested
- grammar structures repeatedly misunderstood
- phrases the learner saves
- pronunciation items needing review
- domains where comprehension is weak (work, housing, public services, academic, etc.)

Use this to create deterministic spaced review and targeted lessons. Avoid storing unnecessary full-page content.

### 3. Real-life task lessons

Turn browsing into action-oriented learning scenarios:

- “Understand this job advert and tell me the requirements.”
- “Find the rent, deposit and location in this apartment listing.”
- “Understand what documents this public-service page asks for.”
- “Read this timetable and answer three questions.”
- “Explain this workplace message at A2/B1 level.”

The Council of Europe CEFR explicitly frames language learning around real-life use, learner agency, mediation, online interaction and public/personal/educational/professional domains. This browser approach can make those ideas concrete.

### 4. Automatic micro-lessons from authentic content

From a page the user is already reading, Learn can generate:

- 5 key words
- 3 useful phrases
- one grammar pattern
- one pronunciation focus
- 3 comprehension questions
- one production task
- one speaking prompt

The source remains the real page; Floently creates learning around it.

### 5. YKI preparation from authentic tasks

Use suitable real-world material to generate YKI-style practice around:

- reading for gist
- reading for detail
- extracting practical information
- mediation/summarization
- responding to notices/messages
- speaking about everyday/professional situations

Generated tasks should remain mapped to Floently’s existing deterministic level/content standards rather than allowing an LLM to redefine the curriculum ad hoc.

### 6. Workplace Finnish mode

For professions already represented in Floently content, the browser runtime can bridge course learning and real workplace language:

- learner encounters a real term → explain it using known course vocabulary
- learner saves a workplace phrase → add to review queue
- repeated terminology becomes a personalized vocabulary pack
- teacher/admin dashboards can show aggregated skill categories without exposing private browsing details

### 7. Guided web missions

Create safe, goal-based missions:

- find a train departure
- identify the deadline on a public page
- find a job’s qualification requirements
- compare two apartment listings
- locate a university application requirement

Floently evaluates the language task, not merely whether the learner clicked the right button.

## Product differentiation

This direction differentiates Learn from generic chat tutors because the learner is not practicing only simulated dialogue. They are using authentic Finnish websites and solving authentic tasks while receiving level-aware support.

The strongest long-term loop is:

```text
real-life encounter
→ assistance
→ learning signal
→ personalized review
→ course reinforcement
→ next real-life encounter with less help
```

## Shared architecture rule

Do not build a separate browser runtime for Learn.

Learn should consume common iLoadi primitives such as:

- create/stop browser session
- navigate
- extract document/selection
- resolve clicked word/sentence
- search page
- highlight sentence/word
- semantic/accessibility metadata
- screenshot only when necessary
- later permissioned actions

Product-specific logic stays in Learn: CEFR level, explanations, exercises, spaced review, YKI mapping, workplace content and progress tracking.

## Privacy and safety rules

- browser history/learning memory must be user-scoped
- default to storing derived learning signals rather than complete pages
- never store passwords or authentication tokens in learning data
- do not send arbitrary private page content to third-party models without a defined policy/consent path
- separate read-only learning assistance from actions that submit forms or change external systems
- treat webpage text as untrusted content, not agent instructions
- use explicit confirmation before any consequential browser action

## Research basis

### CEFR alignment

The Council of Europe CEFR Companion Volume emphasizes:

- learner as social agent
- action-oriented learning
- mediation
- online interaction
- language use across public, personal, educational and professional domains
- “can do” outcomes

This supports prioritizing authentic tasks over isolated vocabulary drills.

References:

- https://www.coe.int/en/web/common-european-framework-reference-languages/key-concepts
- https://www.coe.int/en/web/portfolio/the-common-european-framework-of-reference-for-languages-learning-teaching-assessment-cefr-
- https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-in-the-classroom

### Technical basis

- Chrome DevTools Protocol DOM: https://chromedevtools.github.io/devtools-protocol/1-3/DOM/
- Playwright isolation model: https://playwright.dev/docs/browser-contexts
- W3C WAI-ARIA semantic structure: https://www.w3.org/WAI/standards-guidelines/aria/
- Cloudflare Browser Run as evidence of remote browser sessions becoming a reusable platform primitive: https://developers.cloudflare.com/browser-run/

## Recommended Learn roadmap

### Phase L1 — Read-only contextual learning

- open a permitted real website
- click word/sentence
- vocabulary/grammar/TTS
- save word/phrase
- create mini lesson

### Phase L2 — Personal language memory

- recurring unknown-word detection
- grammar-pattern tracking
- personalized review queue
- CEFR-aware assistance intensity

### Phase L3 — Action-oriented missions

- guided tasks across real websites
- comprehension evaluation
- YKI-style transformations
- workplace missions

### Phase L4 — Permissioned interaction

Only after the shared runtime’s browser-agent security controls mature:

- guided form practice
- safe rehearsal modes
- explicit-confirmation actions on external systems

## Near-term requirement

Do not divert current engineering capacity from fixing Floently Read’s end-to-end Live Browser. Learn should consume the platform after Read proves the production path:

`Floently auth → trusted edge → Cloudflare Access → Oracle gateway → isolated Chromium → streamed view → semantic bridge`.
