# TapPay FinFlow

A **separate** Expo app from the original hackathon TapPay UI. Same NFC + ledger idea, new forest-green / lime finance mockup (onboarding, VISA cards, tabs, phone/desktop chrome).

The original app stays at the **repo root**. This folder does not replace it.

## Run

```bash
cd finflow
npm install
npx expo start --web
```

Wide web shows a phone mockup with a Phone / Desktop toggle.

Demo: Get started → Cards → Simulate bind → Load ₹500 → Home → Quick send → Profile → Merchant → Simulate tap.

## Android

```bash
cd finflow
npx expo prebuild --platform android
npx expo run:android
```

Package id is `com.tappay.finflow` so it can sit next to the original `com.tappay.hackathon` APK.
