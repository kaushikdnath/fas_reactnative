const {
  withMainApplication,
  withProjectBuildGradle,
  withAppBuildGradle,
  withAndroidManifest,
} = require("@expo/config-plugins");

module.exports = function withNative(config) {
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    if (!manifest["uses-permission"]) {
      manifest["uses-permission"] = [];
    }
    const permissions = manifest["uses-permission"];
    const addPermission = (permission) => {
      if (!permissions.some((p) => p.$?.["android:name"] === permission)) {
        permissions.push({
          $: {
            "android:name": permission,
          },
        });
      }
    };
    addPermission("android.permission.READ_PHONE_STATE");
    addPermission("android.permission.SEND_SMS");

    return config;
  });

  config = withMainApplication(config, (config) => {
    const p = config.modResults.contents;
    let out = p;
    if (!out.includes("com.as608.reactnative.AS608Package"))
      out = out.replace(
        /(package\s+[^\n]+\n)/,
        "$1import com.as608.reactnative.AS608Package\n",
      );

    if (!out.includes("AS608Package()"))
      out = out.replace(
        /(PackageList\(this\)\.packages)/,
        "$1.apply { add(AS608Package()) }",
      );

    if (!out.includes("com.as608.reactnative.SimInfoPackage"))
      out = out.replace(
        /(package\s+[^\n]+\n)/,
        "$1import com.as608.reactnative.SimInfoPackage\n",
      );

    if (!out.includes("SimInfoPackage()"))
      out = out.replace(
        /(PackageList\(this\)\.packages)/,
        "$1.apply { add(SimInfoPackage()) }",
      );

    config.modResults.contents = out;
    return config;
  });

  config = withProjectBuildGradle(config, (config) => {
    let c = config.modResults.contents;
    if (!c.includes("mavenCentral()"))
      c = c.replace(
        /repositories\s*\{/,
        "repositories {\n        mavenCentral()",
      );
    config.modResults.contents = c;
    return config;
  });
  config = withAppBuildGradle(config, (config) => {
    let c = config.modResults.contents;
    if (!c.includes("sourceSets.main.java.srcDirs"))
      c += `\nandroid {\n    sourceSets { main { java.srcDirs += ['../../native/android'] } }\n}\n`;
    config.modResults.contents = c;
    return config;
  });
  return config;
};
