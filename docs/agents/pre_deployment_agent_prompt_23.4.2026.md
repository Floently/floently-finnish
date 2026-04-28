You are redesigning the Floently website information architecture and landing pages.

Repo root:
/home/vitus/speech_chrome/

This is now a structural redesign task, not a small page edit.

==================================================
NEW SITE ARCHITECTURE
==================================================

We want the website structured like this:

- floently.com            -> new main Floently landing page / product gateway
- floently.com/learn      -> Floently Finnish landing page
- floently.com/read       -> current Floently read/text-to-speech landing page

The current floently.com homepage should no longer stay at root.
It should be moved/adapted to:

- floently.com/read

Then build a new root landing page for:

- floently.com

==================================================
PRODUCT MODEL
==================================================

Floently is the parent product/brand.

It has two services/products:

1. Learn
- Floently Finnish
- YKI readiness
- preparation for working life in Finland
- speaking practice
- roleplay
- flashcards
- level placement

2. Read
- Floently text-to-speech / reading product
- current main floently.com landing page content belongs here

The root homepage should help the user choose:
- Learn
- Read

==================================================
IMPORTANT BRANDING CORRECTION
==================================================

The `/learn` page must be repositioned.

It must NOT be framed mainly as:
- Finnish for daily life

It SHOULD be framed mainly as:
- getting ready for the YKI test
- preparing for working life in Finland
- speaking confidence for Finland-focused communication
- practical guided Finnish progression

You may still mention everyday Finnish lightly as a supporting capability,
but the main branding must NOT be “daily life first.”

==================================================
ROOT PAGE REQUIREMENTS
==================================================

Build a new main landing page at:
- floently.com

This page should look conceptually similar to the second reference image the user shared:
- equal split layout
- one side for one product
- one side for the other product
- premium modern design
- visually beautiful
- symmetrical and intentional

But:
- the left half should NOT be white
- both halves should fit Floently’s dark/premium visual identity
- both halves should feel related, but each side must have its own theme

The page should feel like a premium gateway / product selection screen.

==================================================
ROOT PAGE DESIGN DIRECTION
==================================================

Root page should have:
- the Floently logo/brand
- a short parent-brand headline/subcopy
- two equal product panels or equal split sections
- one side for Learn
- one side for Read
- each side with:
  - product label
  - short explanation
  - themed visual treatment
  - CTA button

Suggested structure:
- global brand header/top area
- equal two-column hero split
- Learn side
- Read side
- maybe a small brand explanation below
- footer

The two halves must:
- look almost alike structurally
- have distinct themed content/visual styling
- both remain beautiful
- both remain clearly separate

Example content direction:
- Learn side theme:
  - Finnish readiness
  - YKI
  - workplace speaking
  - roleplay/cards/placement
- Read side theme:
  - text to speech
  - reading productivity
  - listening to text
  - audio voice product

The user should be able to clearly choose:
- Go to Learn
- Go to Read

==================================================
/READ PAGE REQUIREMENTS
==================================================

The current main Floently landing page should be moved/adapted to:
- floently.com/read

This page should become the home of the existing read-aloud / text-to-speech product.

You must:
- preserve the strong parts of the existing design
- ensure internal navigation and CTA behavior make sense under /read
- update any paths/links that assume it lives at /
- avoid breaking the current product content

==================================================
/LEARN PAGE REQUIREMENTS
==================================================

The `/learn` page must be improved further.

It already moved in the right direction, but now it must be refined.

Required changes:
1. Reposition the messaging
   Main emphasis:
   - YKI readiness
   - preparing for working life in Finland
   - practical speaking confidence
   - guided progression

2. Reduce “daily life” prominence
   It can remain as a secondary support idea, not the core brand promise.

3. Make the page look better than it does now
   Improve polish, hierarchy, and visual confidence where appropriate.

4. Add a privacy/legal/support structure
   Add visible footer or footer links for:
   - Privacy
   - Terms
   - Support
   - Delete Account

If these routes/pages do not exist yet, create them in a clean structure for `/learn`, such as:
- /learn/privacy
- /learn/terms
- /learn/support
- /learn/delete-account

5. Improve the /learn landing page content so it feels more premium and product-ready.

==================================================
/LEARN COPY DIRECTION
==================================================

The `/learn` page should sound like a serious Finnish readiness product for adults.

Preferred emphasis:
- Prepare for the YKI test
- Build confidence for working life in Finland
- Practice real speaking, not only passive study
- Train with roleplay, flashcards, and guided placement

Avoid making it sound like:
- a casual tourist phrase app
- a generic “learn a language fast” site
- a daily-life-only service

==================================================
LEGAL / PRIVACY / SUPPORT STRUCTURE
==================================================

You must create a clean public structure that prepares the site for app/store release needs.

At minimum create pages/routes/placeholders for:
- /learn/privacy
- /learn/terms
- /learn/support
- /learn/delete-account

These should be clean, brand-consistent, and ready to hold final content.
If needed, create placeholder content that is clearly structured and publishable.

Also ensure the main root site/footer structure can later accommodate:
- overall privacy
- overall terms
- support routing if needed

==================================================
IMPLEMENTATION RULES
==================================================

1. Do NOT break the existing site.
2. Root `/` must become the new product gateway page.
3. Existing homepage content must move to `/read`.
4. `/learn` must remain the Floently Finnish page, but improved.
5. Preserve brand consistency across all pages.
6. Do not make the pages feel like unrelated products.
7. Do not use random stock people images for Learn.
8. Do not create fake pricing or fake backend functionality.
9. Do not create misleading claims.
10. Keep the design premium, modern, and polished.

==================================================
TECHNICAL EXPECTATIONS
==================================================

You must inspect the repo’s routing structure and implement the new information architecture correctly.

You must:
- identify where root page currently lives
- move/adapt the current landing page to `/read`
- build a new `/` root landing page
- improve `/learn`
- create supporting `/learn/privacy`, `/learn/terms`, `/learn/support`, `/learn/delete-account`
- ensure links/CTAs route correctly
- ensure pages are responsive
- ensure shared styling/components are reused intelligently

==================================================
DELIVERABLES
==================================================

Implement all changes in code.

Also write:
- /home/vitus/speech_chrome/docs/floently_site_restructure_report.md

That report must include:
- which files were changed
- how `/` now works
- how `/read` now works
- how `/learn` was improved
- what legal/support routes were added
- any future follow-up items

==================================================
SUCCESS CRITERIA
==================================================

The task is complete only if:
- floently.com is now a new main gateway page
- floently.com/read contains the current read/text-to-speech landing page
- floently.com/learn is clearly about Floently Finnish
- /learn now emphasizes YKI readiness and working life in Finland
- /learn looks better than before
- legal/support/delete-account/terms structure exists on /learn
- the root page uses a beautiful equal split design for Learn and Read
- the whole site still feels like one brand family

Proceed with the restructure and redesign.
