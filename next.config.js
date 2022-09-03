const runtimeCaching = require("next-pwa/cache");
const withPWA = require("next-pwa")({
  dest: "public",
  runtimeCaching,
});

/** @type {import('next').NextConfig} */
module.exports = withPWA({
  webpack: (config, {}) => {
    config.experiments.topLevelAwait = true;
    return config;
  },
  output: "standalone",
});
