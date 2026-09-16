# Floently Create — Web Intelligence Strategy

**Status:** product strategy / research-backed direction  
**Research refresh:** 2026-09-16

## Purpose

Floently Create should become more than a blank editor with AI assistance. It should eventually use the shared iLoadi Web Intelligence Runtime so users can research, collect source-backed material, transform it into new work, and later publish or transfer it into external tools with explicit confirmation.

The key idea is:

> **Research where the information already lives, then create from selected evidence without forcing users to copy and paste everything into Floently.**

## Core user workflow

```text
open real sources
→ inspect/search/select
→ save evidence + provenance
→ organize notes
→ create outline
→ draft/transform
→ review sources
→ export or permissioned publish
```

The original website remains the source of truth. Floently Create operates around it.

## High-value Create use cases

### 1. Source-backed research workspace

A user can browse multiple sources in the remote browser and deliberately capture:

- selected passages
- source URL
- page title
- access date/time
- author/publisher metadata when available
- notes tied to a source anchor
- screenshots only when necessary for visual evidence

Create then uses the selected evidence to generate:

- reports
- articles
- newsletters
- briefs
- proposals
- presentations
- emails
- social posts
- study material

The default should be transformation/synthesis, not reproducing source text at length.

### 2. Multi-source comparison

Create can support tasks such as:

- compare how three sources describe the same issue
- identify overlapping claims
- flag contradictions for user review
- build a source matrix
- extract dates, requirements, prices or named entities into structured notes
- preserve which source supports which statement

This is especially useful for research-heavy writing where provenance matters.

### 3. Website-to-content workflows

For a user’s own website or authorized company site:

- identify stale terminology
- find references to an old product/brand
- detect inconsistent tone
- create replacement copy
- turn a product page into email/social/brochure variants
- build FAQ drafts from existing pages
- extract reusable product facts into a content library

### 4. Research-to-presentation pipeline

A user can collect evidence in the browser, then Create can generate:

- outline
- slide structure
- speaker notes
- source appendix
- claims/evidence map

The browser runtime gives Create a direct research surface instead of depending on manual uploads and pasted snippets.

### 5. Content QA and brand governance

For company-owned web properties, Create can become a continuous brand/compliance assistant:

- terminology consistency checks
- outdated legal/footer text detection
- broken or stale CTA copy
- accessibility-content review
- readability checks
- localization gaps
- brand voice checks

This can eventually run as an authorized monitoring workflow rather than a one-time manual review.

### 6. CMS and publishing assistance

Later, after agent controls are mature, Create can work with real publishing systems:

- draft in Floently
- open WordPress/CMS/social platform in the remote browser
- prepare fields
- show a preview/diff
- require explicit user confirmation
- submit/publish only after approval

Read-only research and write/submit actions must remain separate permission levels.

### 7. Authenticated research

Because the browser can preserve a user’s real session, Create could eventually work with sources behind the user’s own login where terms/policy allow it:

- subscription research tools
- internal knowledge bases
- project portals
- learning platforms
- company CMSs

The runtime must never expose login tokens to the Create model or public client.

## Shared platform architecture

Create should not own Chromium/session/CDP infrastructure. It consumes the same iLoadi primitives as Read and Learn:

- create/stop session
- navigate/search
- DOM/semantic extraction
- selection capture
- page metadata
- accessibility tree
- screenshot/PDF where appropriate
- later permissioned click/fill/upload/submit

Create-specific services should own:

- notebook/evidence model
- provenance/citation model
- outlining
- drafting
- transformation templates
- brand/style rules
- export/publish workflows

## Provenance model recommendation

Every captured research item should be able to store:

```text
sourceUrl
sourceTitle
publisher/author (if available)
accessedAt
selectionText or derived summary
sourceAnchor
pageFingerprint/version hint
userNote
captureType
```

For sensitive/private sources, store only what the user explicitly saves or what the workflow requires; avoid silently archiving entire authenticated pages.

## Copyright/product rule

Create should help users transform, summarize, compare and cite. It should not become a tool for cloning protected articles or reproducing large amounts of copyrighted material. Source selection and provenance make it easier to create useful original work while keeping source boundaries visible.

## Security requirements for future action-taking

Any future web agent must assume websites may contain malicious instructions designed to hijack an AI agent.

Required controls:

- treat page content as untrusted data
- least-privilege tools
- explicit separation of read and write actions
- per-domain/per-action permissions
- confirmation for publish/send/purchase/delete/submit actions
- never let page text override system/tool policy
- strip secrets from model-visible context
- keep browser credentials server-side
- user-scoped memory
- auditable action intent + result
- safe failure if page ownership/target is ambiguous

NIST’s 2026 agent-security work highlights indirect prompt injection / agent hijacking when agents consume websites and other external data. OWASP guidance also calls out prompt injection, tool abuse, data exfiltration and memory poisoning. These risks should shape Create before it gets autonomous publishing abilities.

## Research and market validation

Remote browser infrastructure is increasingly treated as a reusable platform primitive:

- Cloudflare Browser Run supports browser sessions through Playwright/Puppeteer/CDP and can produce screenshots, PDFs, markdown, links, HTML elements and structured data.
- Chrome DevTools Protocol exposes DOM, DOMSnapshot, Accessibility, Runtime, Network, Input, Storage and Target domains, enabling semantic interaction rather than screenshot-only automation.
- Playwright formalizes isolated browser contexts and warns that authenticated state contains sensitive cookies/headers and must be protected.

References:

- https://developers.cloudflare.com/browser-run/
- https://developers.cloudflare.com/agents/tools/browser/
- https://chromedevtools.github.io/devtools-protocol/1-3/DOM/
- https://chromedevtools.github.io/devtools-protocol/tot/DOMSnapshot/
- https://playwright.dev/docs/browser-contexts
- https://playwright.dev/docs/auth
- https://www.nist.gov/blogs/caisi-research-blog/insights-ai-agent-security-large-scale-red-teaming-competition
- https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html
- https://genai.owasp.org/resource/agent-control-standard-acs/

## Recommended Create roadmap

### Phase CREAT-1 — Research notebook

- browse live sources
- save selection + provenance
- source list
- notes
- multi-source comparison
- export selected evidence into a draft

### Phase CREAT-2 — Source-grounded creation

- outline from selected evidence
- draft with source mapping
- claim/source checker
- transform into different formats

### Phase CREAT-3 — User-owned site intelligence

- content QA
- brand consistency
- stale copy detection
- localization/readability checks

### Phase CREAT-4 — Permissioned web actions

Only after shared browser-agent security gates are mature:

- fill CMS fields
- upload assets
- preview changes
- explicit approval
- publish/submit

## Near-term dependency

Create should not receive a separate browser implementation now. The current engineering priority is to make Floently Read’s browser actually work end-to-end. Once the shared path is proven in production, Create can add research/evidence workflows on top of the same runtime.
