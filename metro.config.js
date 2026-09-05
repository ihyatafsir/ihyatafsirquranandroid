const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Register binary and data asset extensions so they are treated as static assets,
// NOT inlined into the JavaScript AST bundle
config.resolver.assetExts.push('dat', 'db');

module.exports = config;
