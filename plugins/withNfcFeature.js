const { withAndroidManifest } = require("expo/config-plugins");

function upsertFeature(manifest, name, required) {
  if (!manifest["uses-feature"]) {
    manifest["uses-feature"] = [];
  }
  const features = manifest["uses-feature"];
  const existing = features.find((f) => f.$["android:name"] === name);
  if (existing) {
    existing.$["android:required"] = required;
    return;
  }
  features.push({
    $: {
      "android:name": name,
      "android:required": required,
    },
  });
}

function upsertPermission(manifest, name) {
  if (!manifest["uses-permission"]) {
    manifest["uses-permission"] = [];
  }
  const perms = manifest["uses-permission"];
  const exists = perms.some((p) => p.$["android:name"] === name);
  if (!exists) {
    perms.push({ $: { "android:name": name } });
  }
}

module.exports = function withNfcFeature(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    upsertPermission(manifest, "android.permission.NFC");
    upsertFeature(manifest, "android.hardware.nfc", "true");
    return config;
  });
};
