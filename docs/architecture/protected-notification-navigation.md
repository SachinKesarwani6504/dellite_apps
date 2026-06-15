# Protected Notification Navigation

This guide documents how protected screens are opened globally from notifications without depending on the current tab stack.

## Architecture

Auth and onboarding remain separate root branches. Protected app screens live under the authenticated root branch:

- `MainTabsNavigator` owns only tab entry screens.
- Global detail flows, such as job details, booking details, and profile/document screens, are root-level protected routes.
- Notification navigation must not push protected screens into an active tab stack.

Do not change these existing flows for notification routing:

- Auth navigator
- Onboarding navigator
- Booking flow navigator
- Normal tab navigation
- Internal screen-to-screen flows that already work

## Global Opening Rule

When a notification targets a protected detail screen, open it through the app-specific protected navigation helper:

- Worker: `openWorkerProtectedRoot(...)`
- Customer: `openCustomerProtectedRoot(...)`

These helpers preserve the current `MainTabsNavigator` route and replace any existing protected overlay route with the new target. This avoids stale back stacks such as `EditProfile -> IdentityVerification` when the user tapped an Aadhaar notification from another screen.

Expected back behavior:

- If the app was already open, back returns to the previous tab state.
- If the app was cold-started from a notification, back returns to a safe main tab.
- Back should not pass through unrelated protected screens unless the user manually opened that flow.

## Notification Resolver

Notification payloads are normalized and resolved centrally in each app:

- Worker: `src/utils/notification-navigation.ts`
- Customer: `src/utils/notification-navigation.ts`

All entry points should call the same resolver:

- FCM notification response
- Cold-start notification response
- In-app notification press
- Notification-list item press

## Backend Payload Shape

Backend notifications should include:

```json
{
  "action": "OPEN_SCREEN",
  "screen": "AADHAAR_DOCUMENT",
  "targetId": "optional-id",
  "role": "WORKER"
}
```

Current apps also support existing screen keys such as:

- Worker: `JobDetails`, `IdentityVerification`, `PayoutDetails`, `ProfileCertificateAddAndEdit`, `ProfileSkillAddAndEdit`
- Customer: `BookingsDetails`, `Notifications`, `EditProfile`, `Referral`

Unknown or invalid payloads must not crash the app. In development, log a warning if useful, then fall back to a safe main/profile/notification screen.

## Adding A Screen Key

1. Add the backend screen key to the app notification screen constants in `src/types/notifications.ts`.
2. Map the key in `src/utils/notification-navigation.ts`.
3. If it is a global protected detail screen, route with the protected helper.
4. If it is a true tab home, route to `MainTabsNavigator`.
5. If it belongs to booking flow, do not move or rewrite booking flow. Use an existing safe root route, or add a wrapper root entry without changing booking flow behavior.
6. Run the relevant app typecheck and verification.

## Booking Screens

Booking flow screens must stay inside `BookingFlowNavigator`. Booking details may be opened globally only through the existing safe root booking details route. Do not route notification payloads directly into mid-flow booking screens unless a safe wrapper has been designed.
