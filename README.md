# TapPay — FinFlow edition

Closed-loop NFC tap-to-pay for the iQOO Hackathon, rebuilt with a **forest green + lime** FinFlow-style mobile UI.

One Android APK, three roles (User / Merchant / Admin). The tag is an ID. Balance is integer paise in a ledger.

Expo Go cannot do NFC. Use a **dev client** (`npx expo run:android`).

## Run without Firebase or a tag

```bash
npm install
npx expo start --web
```

Web shows a phone mockup on wide screens (toggle **Phone / Desktop**). Emulator and web use the **local ledger** + **mock NFC**.

Demo path: skip onboarding → **Cards** → Simulate bind → Load ₹500 → **Home** → Quick send → **Profile** → Merchant → Simulate tap.

## Android (real NFC)

```bash
npx expo prebuild --platform android
npx expo run:android
```

Needs JDK + Android SDK. Hold an NTAG213/215 to bind (user) and to pay (merchant). Do not store rupees on the tag.

## Firebase (optional)

1. Create a Firebase project, enable Anonymous auth and Firestore.
2. Copy `.env.example` to `.env.local` and fill `EXPO_PUBLIC_FIREBASE_*`.
3. Deploy [firestore.rules](firestore.rules). Rules require a `merchants/{uid}` doc for deduct (created when you enter the Merchant role).

Without env vars the app keeps using the on-device ledger.

## Layout

- `src/app` — onboarding, Home / Cards / Activity / Profile tabs, merchant POS, admin
- `src/nfc` — mock + Android `react-native-nfc-manager` (NDEF write, reader mode)
- `src/wallet` — local AsyncStorage ledger or Cloud Firestore transactions
- `src/fraud/scoreTap.ts` — stub (always 0)
