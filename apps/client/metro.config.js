const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const repoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [repoRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(repoRoot, 'node_modules'),
];

config.resolver.extraNodeModules = {
  '@': projectRoot,
  '@core': path.resolve(repoRoot, 'packages/core'),
  '@ui': path.resolve(repoRoot, 'packages/ui'),
};

module.exports = config;
