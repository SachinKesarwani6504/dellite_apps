# Dellite Android Setup (Customer + Worker)

This repo uses an Expo monorepo with separate apps:
- `apps/customer-app`
- `apps/worker-app`

iOS is intentionally not configured in this step.

## Android package names

- Customer app package: `com.dellite.customer`
- Worker app package: `com.dellite.partner`

## App identity

- Customer app name: `Dellite`
- Worker app name: `Dellite Partner`
- Existing slugs remain unchanged:
  - `dellite_customer_app`
  - `dellite_worker_app`

## Firebase config file locations

Place Firebase Android config files here:

- Customer: `apps/customer-app/google-services.json`
- Worker: `apps/worker-app/google-services.json`

These files are ignored by git and should not be committed.
Expo config includes `googleServicesFile` only when these files exist, so prebuild works even before adding Firebase files.

The generated `android/` folders stay inside each app folder and are ignored by git in this Expo setup:
- `apps/customer-app/android`
- `apps/worker-app/android`

## Android prebuild commands

From repo root:

```bash
npm run prebuild:customer:android
npm run prebuild:worker:android
```

Direct commands:

```bash
cd apps/customer-app
npx expo prebuild --platform android

cd apps/worker-app
npx expo prebuild --platform android
```

## Run Android apps

From repo root:

```bash
npm run android:customer
npm run android:worker
```

## Notification permission note

`POST_NOTIFICATIONS` is already declared in both Expo app configs under `android.permissions`.

After Android folders are generated, verify this exists in each generated manifest:

- `apps/customer-app/android/app/src/main/AndroidManifest.xml`
- `apps/worker-app/android/app/src/main/AndroidManifest.xml`

Expected manifest entry:

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

## Notes for later FCM setup

- This change only prepares Android app identity and native prebuild config.
- Firebase Messaging code is not added yet.
- Notification icons are not added yet.
