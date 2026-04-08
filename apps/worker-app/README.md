# Dellite Partner App

Cross-platform worker app (Android + iOS) built with Expo + React Native.

## What This App Includes

- Phone OTP authentication flow
- Worker onboarding flow
- Main tabs: `Home`, `Ongoing`, `Earnings`, `Profile`
- Profile sub-pages scaffold
- Centralized API action layer
- Secure token storage (`react-native-keychain` with `expo-secure-store` fallback)
- System light/dark mode support
- NativeWind (Tailwind-style classes) for styling

## Tech Stack

- Expo SDK 54
- React Native + TypeScript
- React Navigation (stack + tabs)
- Axios for API calls
- NativeWind + Tailwind
- Lottie support for scalable animations

## Project Structure

All app code is inside `src/`.

```text
src/
  actions/                    # API actions + HTTP helpers
  animations/                 # lottie registry
  assets/                     # local assets (includes lottie folder)
  components/common/          # reusable UI components (Button, Input, OTP input, etc.)
  contexts/                   # Context API providers (auth/session)
  hooks/                      # custom hooks (useAuth)
  icons/                      # centralized icon map
  navigation/                 # app, auth, onboarding, tabs, profile navigators
  screens/                    # feature screens
  types/                      # TS types/models
  utils/                      # theme, token utilities, key-chain-storage, helpers
```

## Prerequisites

- Node.js 18+ (recommended: Node 20 LTS)
- npm
- Expo Go app on mobile (or emulator)

## Environment Setup

Create `.env` in project root:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

Current expected backend: `localhost:3000`.

Note:
- `localhost` works for emulator/same machine.
- For physical phone testing, update to your PC LAN IP (example: `http://192.168.1.20:3000`).

## Install & Run

```bash
npm install
npm start -- --clear --lan
```

Other scripts:

```bash
npm run android
npm run ios
npm run web
```

## Development Flow (New Developer)

1. Clone repo and install dependencies.
2. Confirm `.env` is set.
3. Start backend on port `3000`.
4. Start app with Expo.
5. Scan QR from Expo terminal using Expo Go.
6. Test auth flow:
   - Send OTP
   - Verify OTP
   - Complete onboarding
   - Reach tab screens

## API Integration Pattern

- Keep all endpoint calls in `src/actions`.
- Use shared methods from `src/actions/http/httpClient.ts`:
  - `apiGet`
  - `apiPost`
  - `apiPatch`
  - `apiDelete`
- Do not call Axios directly inside screens.

## Auth & Token Storage

- Auth context/hook is the single source:
  - `src/contexts/AuthContext.tsx`
  - `src/hooks/useAuth.ts`
- Token storage layer:
  - `src/utils/key-chain-storage/*`
- Primary storage: `react-native-keychain`
- Fallback (Expo Go/non-native availability): `expo-secure-store`

## Theming

- App follows system theme (light/dark) automatically.
- Base page background is neutral:
  - light: white
  - dark: near-black
- Brand colors (orange/yellow/black) are used as accent colors for buttons/cards/highlights.

## UI Components

- `Button` with gradient style
- `AppInput`
- `OtpCodeInput` (4-digit, proper backspace/focus/paste behavior)
- `AppLottie`

## Lottie Usage

1. Put animation files in `src/assets/lottie/`
2. Register each animation in `src/animations/index.ts`
3. Use via `AppLottie` component

## Troubleshooting

### Babel / bundling errors

Run:

```bash
npm start -- --clear --lan
```

If it still fails:

```bash
rm -rf node_modules package-lock.json
npm install
npm start -- --clear --lan
```

### Secure storage errors in Expo Go

This project already includes SecureStore fallback, so ensure app is rebuilt/restarted after dependency updates.

### Backend not reachable from phone

Change `EXPO_PUBLIC_API_BASE_URL` from `localhost` to your machine LAN IP.

## Quality Checks

```bash
npx tsc --noEmit
npx expo-doctor
```

Both should pass before pushing code.
