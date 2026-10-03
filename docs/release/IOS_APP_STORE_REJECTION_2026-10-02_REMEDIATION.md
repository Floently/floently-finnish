# KieliValmis iOS App Review Rejection — 2026-10-02 Remediation and Resubmission Gate

Date opened: 2026-10-03  
Submission ID: `cc16af90-8fce-4651-ae20-08c85d204a8d`  
Review date: 2026-10-02  
Review device: iPad Air (5th generation)  
Version reviewed: `1.0 (47)`  
Active React Native release PR: #75  
Active release branch: `agent/build-48-native-read-release-20260929`

## Executive finding

Apple identified two narrow, actionable submission defects:

1. **Guideline 2.3.10 — Accurate Metadata:** at least one App Store screenshot contains non-iOS status-bar imagery.
2. **Guideline 2.1(b) — App Completeness:** the app references subscriptions, but one or more associated In-App Purchase products were not submitted for review.

The current repository already contains a substantive StoreKit/RevenueCat purchase implementation and the expected subscription/product mapping. Nothing in this rejection establishes a new billing-runtime code failure. The immediate repair is primarily an **App Store Connect submission-package repair**, followed by the **new binary Apple explicitly requested**.

No new iOS build is authorized by this document alone. The repository's scarce-build/zero-known-blocker gate remains in force.

## 1. Screenshot finding — what Apple is actually objecting to

The screenshot supplied with the rejection is a KieliValmis marketing composition with an iPhone-style frame. Inside that frame, the status area contains Android-style notification/status symbols, including a Messenger-like notification icon and other Android status glyphs.

Those references to Messenger/other apps are **not something to reproduce**. They are evidence that the embedded screen image came from, or visually represents, a non-iOS status bar.

### Required repair

- Capture the relevant KieliValmis screen on a genuine iOS installation.
- Replace the embedded app-screen portion of the marketing composition with that genuine iOS capture.
- Keep the marketing headline/background/device treatment only if the app screen itself remains an accurate representation of the iOS app.
- Do not recreate Android notification icons, Android Wi-Fi/battery chrome, or Android status-bar presentation in an iPhone frame.
- Open **View All Sizes in Media Manager** and audit every applicable size.
- Repeat the audit for every localization.
- Verify the majority of screenshots show the app's main functions.

A screenshot dimension being valid does not make its platform imagery valid.

The app source currently sets `ios.supportsTablet=false`. The fact that Apple reviewed the binary on an iPad Air does not by itself mean an iPad-native listing is enabled, but every media slot App Store Connect actually exposes for this version must still be checked.

## 2. Subscription submission finding

The current source expects the following KieliValmis Apple Product IDs:

| Product family | Apple Product ID |
|---|---|
| YKI monthly | `floently_yki_monthly` |
| YKI 3 months | `floently_yki_3months` |
| YKI yearly | `floently_yki_yearly` |
| Professional monthly | `floently_prof_monthly` |
| Professional 3 months | `floently_prof_3months` |
| Professional yearly | `floently_prof_yearly` |
| Combined monthly | `floently_combo_monthly` |
| Combined 3 months | `floently_combo_3months` |
| Combined yearly | `floently_combo_yearly` |

Repository history records the KieliValmis Premium subscription group as group ID `22077944`, but that is historical evidence. Current status must be reverified in App Store Connect.

### Required App Store Connect sequence

1. Open **Monetization -> Subscriptions**.
2. Open the KieliValmis Premium group and inspect each subscription.
3. For every subscription used by the submitted app, complete localization, pricing/availability, Review Information, and the required **App Review screenshot**.
4. Add every required subscription for review.
5. If the subscription group is not already approved, include the group in the submission.
6. Create/use the draft App Review submission for the replacement iOS app version.
7. Add the replacement app version/build.
8. Before submitting, verify the draft visibly contains:
   - the iOS app version;
   - the subscription group when required;
   - all nine subscriptions exposed by the app.
9. Only then click **Submit for Review**.

For a first auto-renewable subscription submission, Apple requires the new subscription(s), group when applicable, and app version to be in the same draft submission.

## 3. Why the repository did not prevent this rejection

The repository already said subscriptions should be added to the review submission, but the operative submission checklist was stale:

- it still contained the obsolete bundle identifier `com.vitusidi.floentlyfinnish`;
- it still described account deletion and external checkout as current blockers even though those were already remediated;
- it did not enumerate all nine subscription Product IDs as a required same-submission gate;
- it did not require auditing all Media Manager sizes/localizations for non-iOS status imagery;
- App Store listing screenshots are not currently versioned as release artifacts, so CI could not inspect the rejected image.

This remediation updates the checklist, reviewer-note draft, and screenshot rules so the same packaging omission is less likely to recur.

## 4. Binary/source state

The rejected App Store binary `1.0 (47)` is recorded in repository history as pinned to client source commit:

`63073fd9cef57f0dc5e703386d346043b19fabc0`

The active next React Native release lane is PR #75. At the beginning of this remediation, its source head was:

`af09e8ac8ca16c5e7a8d503a31924e218b471f20`

That head contains the later Reader/browser/media-session stabilization work and had green GitHub source checks, including the iOS native-source gate. The branch's iOS release workflow is manual and requires explicit build approval plus the zero-known-blocker confirmation.

Because Apple specifically asked for a new binary, the final resubmission needs a replacement build. However, do not spend that scarce build merely to repair metadata. First make the screenshot and IAP submission package ready; then build the exact approved release SHA once.

## 5. Current gate state

```text
REJECTION_2026_10_02_RECORDED=PASS
SCREENSHOT_ROOT_CAUSE_IDENTIFIED=PASS
SOURCE_IAP_PRODUCT_MATRIX_IDENTIFIED=PASS
REPOSITORY_SUBMISSION_CHECKLIST_REFRESHED=PASS
NON_IOS_SCREENSHOTS_REPLACED_IN_APP_STORE_CONNECT=PENDING
ALL_MEDIA_MANAGER_SIZES_AUDITED=PENDING
ALL_LOCALIZATIONS_AUDITED=PENDING
ALL_NINE_SUBSCRIPTION_REVIEW_SCREENSHOTS=PENDING
ALL_NINE_SUBSCRIPTIONS_ADDED_FOR_REVIEW=PENDING
SUBSCRIPTION_GROUP_CURRENT_STATUS_REVERIFIED=PENDING
DRAFT_SUBMISSION_PACKAGE_COMPLETE=PENDING
REPLACEMENT_IOS_BINARY_BUILT=PENDING
REPLACEMENT_BINARY_PHYSICAL_ACCEPTANCE=PENDING
REPLACEMENT_BUILD_SELECTED_IN_APP_STORE_CONNECT=PENDING
APP_REVIEW_REPLY_SENT=PENDING
RESUBMISSION_AUTHORIZED=NO
```

## 6. Definition of done

Resubmission is authorized only when:

- every affected App Store screenshot uses a genuine iOS app capture;
- no Android/non-iOS status-bar image survives in any applicable Media Manager slot/localization;
- all nine required subscriptions have complete review information and App Review screenshots;
- all required subscriptions (and the group if required) are present in the same draft submission as the replacement app version;
- the exact replacement source SHA has green release gates and no known blocking defect;
- one new iOS binary has been produced from that SHA;
- the exact new binary passes physical iPhone smoke/acceptance;
- the new build is selected in App Store Connect;
- reviewer notes accurately describe only completed work;
- the final draft is checked item-by-item before Submit for Review.

## 7. Reviewer reply template

Send only after the Definition of Done is true:

```text
Hello App Review,

Thank you for the review.

We have addressed both issues reported for submission cc16af90-8fce-4651-ae20-08c85d204a8d.

Guideline 2.3.10:
We replaced the affected App Store screenshots with genuine iOS app captures and removed the non-iOS/Android status-bar and notification imagery. We also reviewed the screenshot sets in Media Manager across the applicable device sizes and localizations.

Guideline 2.1(b):
We completed the App Review information for the subscriptions used by the app, including the required review screenshots, and added the associated subscriptions to the same App Review submission as the replacement app version. A new iOS binary, build <NEW_BUILD_NUMBER>, has been uploaded and selected for review.

The iOS app uses Apple's in-app purchase flow for these digital subscriptions and provides Restore Purchases.

Thank you.
```

## 8. Official Apple references

- Submit an In-App Purchase: https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-in-app-purchase
- In-App Purchase information / App Review screenshot: https://developer.apple.com/help/app-store-connect/reference/in-app-purchases-and-subscriptions/in-app-purchase-information
- Upload app previews and screenshots: https://developer.apple.com/help/app-store-connect/manage-app-information/upload-app-previews-and-screenshots
- Screenshot specifications: https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications
