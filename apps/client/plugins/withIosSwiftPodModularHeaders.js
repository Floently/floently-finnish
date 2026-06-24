const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('@expo/config-plugins');

const REQUIRED_PODS = ['GoogleUtilities', 'RecaptchaInterop'];

function podLine(name) {
  return `  pod '${name}', :modular_headers => true`;
}

function ensurePodLines(contents) {
  let updated = contents;

  for (const podName of REQUIRED_PODS) {
    if (updated.includes(`pod '${podName}'`) || updated.includes(`pod "${podName}"`)) {
      continue;
    }

    const targetMatch = updated.match(/target\s+['"][^'"]+['"]\s+do\s*\n/);
    if (!targetMatch || typeof targetMatch.index !== 'number') {
      throw new Error(`Could not find iOS target block in Podfile while adding ${podName}`);
    }

    const insertAt = targetMatch.index + targetMatch[0].length;
    updated = `${updated.slice(0, insertAt)}${podLine(podName)}\n${updated.slice(insertAt)}`;
  }

  return updated;
}

module.exports = function withIosSwiftPodModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');

      if (!fs.existsSync(podfilePath)) {
        return config;
      }

      const before = fs.readFileSync(podfilePath, 'utf8');
      const after = ensurePodLines(before);

      if (after !== before) {
        fs.writeFileSync(podfilePath, after);
      }

      return config;
    },
  ]);
};
