const { withAppBuildGradle } = require('@expo/config-plugins');

const RELEASE_BLOCK_PATTERN = /release\s*\{\s*if\s*\(!signingConfigs\.release\.storeFile\)\s*\{\s*throw new GradleException\("Release signing is not configured\.[\s\S]*?\)\s*\}\s*signingConfig signingConfigs\.release/s;

const REPLACEMENT_RELEASE_BLOCK = `release {
            def requestedTasks = gradle.startParameter.taskNames.collect { (it ?: "").toLowerCase() }
            def runningReleaseBuild = requestedTasks.any { task ->
                task.contains("release") || task.contains("bundle") || task.contains("publish")
            }
            if (runningReleaseBuild && !signingConfigs.release.storeFile) {
                throw new GradleException("Release signing is not configured. Set FLOENTLY_UPLOAD_STORE_FILE, FLOENTLY_UPLOAD_STORE_PASSWORD, FLOENTLY_UPLOAD_KEY_ALIAS, and FLOENTLY_UPLOAD_KEY_PASSWORD in gradle.properties or CI secrets.")
            }
            signingConfig signingConfigs.release.storeFile ? signingConfigs.release : signingConfigs.debug`;

module.exports = function withReleaseSigningGuard(config) {
  return withAppBuildGradle(config, (mod) => {
    if (mod.modResults.contents.includes('def runningReleaseBuild = requestedTasks.any')) {
      return mod;
    }

    if (RELEASE_BLOCK_PATTERN.test(mod.modResults.contents)) {
      mod.modResults.contents = mod.modResults.contents.replace(
        RELEASE_BLOCK_PATTERN,
        REPLACEMENT_RELEASE_BLOCK
      );
    }

    return mod;
  });
};
