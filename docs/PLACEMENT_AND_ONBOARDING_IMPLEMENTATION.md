# Placement and onboarding implementation

This patch adds a voluntary placement flow intended to run after the user has access to the learning routes and before the first study session.

## Design goals
- quick and skippable
- skill-profile result instead of one blind number
- stronger emphasis on Everyday Finnish / YKI placement
- lighter, non-blocking recommendation for Workplace Finnish
- retakeable later

## Flow
1. Intro screen with skip option
2. Goal choice: Everyday Finnish / YKI, Workplace Finnish, or Both
3. Quick self-assessment using can-do statements
4. Short adaptive-style diagnostic
5. Recommendation with start track and level band

## Current output
- reading estimate
- listening estimate
- vocabulary estimate
- grammar estimate
- speaking confidence estimate
- recommended track and start band

## Product rule
- Placement is recommended, not forced
- Professional learners keep access to their paid route even when the recommendation suggests starting with Everyday Finnish first
- Result should personalise starting content, review defaults, and guidance copy
