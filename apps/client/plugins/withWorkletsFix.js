const { withAppBuildGradle } = require('@expo/config-plugins');

// react-native-reanimated 4.x and expo-modules-core both ship libworklets.so.
// Without pickFirsts the mergeDebugNativeLibs Gradle task fails with a duplicate-file error.
const PICK_FIRST_BLOCK = `
    packagingOptions {
        jniLibs {
            pickFirsts += [
                'lib/arm64-v8a/libworklets.so',
                'lib/armeabi-v7a/libworklets.so',
                'lib/x86/libworklets.so',
                'lib/x86_64/libworklets.so',
            ]
        }
    }`;

module.exports = function withWorkletsFix(config) {
  return withAppBuildGradle(config, (mod) => {
    if (mod.modResults.contents.includes('libworklets.so')) {
      // Already applied.
      return mod;
    }
    mod.modResults.contents = mod.modResults.contents.replace(
      /android\s*\{/,
      `android {${PICK_FIRST_BLOCK}`
    );
    return mod;
  });
};
