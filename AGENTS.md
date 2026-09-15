# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Cloud Agent development

- Install: `npm ci`
- Web dev server (local ledger + mock NFC, no Firebase): `CI=1 EXPO_NO_TELEMETRY=1 npx expo start --web --port 8081`
- Typecheck: `npm run typecheck`
- End-to-end web flow: User → Simulate bind → Load ₹500 → Merchant → Simulate tap
- Real NFC requires Android dev client (`npx expo run:android`); Expo Go cannot do NFC
