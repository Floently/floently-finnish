# Floently Multi-Product Mobile Architecture

## Current state

Floently Learn is the ready production product for Finnish learning, YKI preparation, professional Finnish, cards, roleplay, placement, subscriptions, and mobile release work.

Floently Read is a separate product focused on reading and listening: text-to-speech, long-form reading, imported text, documents, articles, PDFs, voices, playback, and reading workflow.

The products may live inside one Floently mobile app experience later, but they must remain product-separated internally.

## Source-of-truth environments

Learn authoritative live working repo:
- Server: /root/floently-finnish
- GitHub: https://github.com/galapoto/floently-finnish.git
- Local mirror: /home/vitus/floently-finnish

Read authoritative working repo:
- Local: /home/vitus/speech_chrome
- Deployment: Render

Do not copy the Read repo into the Learn repo by default.

## Current mobile shell status

The Learn app already contains a public product gateway on the unauthenticated landing surface.

The public gateway currently offers:
- Floently Learn
- Floently Read

Read is currently preview-only / coming-soon inside the Learn mobile app. This is correct for now.

## Strategic target

Long term, Floently should have one user-facing mobile app shell that can expose multiple products:

- Floently Learn
- Floently Read
- possible future products

But each product must keep separate:
- entitlement logic
- payment products
- backend service ownership
- feature modules
- data storage assumptions
- release risk

## Recommended architecture

Preferred long-term structure:

floently-mobile-shell
- owns native Android/iOS app shell
- owns product chooser
- owns shared account/session surface
- owns shared navigation between products
- owns shared billing integration layer
- loads Learn product module
- loads Read product module

floently-finnish
- owns Learn product
- owns YKI engine
- owns professional Finnish
- owns roleplay
- owns cards
- owns Learn backend

speech_chrome or floently-read
- owns Read product
- owns TTS
- owns document/audio/reader workflow
- owns Read backend/deployment

## Near-term rule

Because Learn is ready, do not create a new mobile-shell repo yet unless Learn is safely tagged and backed up.

Near-term safe approach:
1. Keep Learn app stable.
2. Keep existing public product gateway.
3. Keep Read preview-only.
4. Add architecture docs and entitlement contract.
5. Later add authenticated product chooser only if needed.
6. Later create a dedicated shell repo when both products are stable enough.

## Do not do yet

Do not:
- merge Read source code into /root/floently-finnish
- connect Read to Learn entitlements
- make combined_access unlock Read
- change Android package name
- change iOS bundle ID
- increment app version for documentation-only work
- rebuild or publish because of this document
- touch apps/client/dist or apps/client/.expo unless intentionally exporting/building
