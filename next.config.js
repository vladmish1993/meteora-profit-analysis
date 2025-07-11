// next.config.js
const nextConfig = {
  output: 'export',
  productionBrowserSourceMaps: true,

  // 1)  remove the obsolete experimental flags  ──────────────
  // experimental: { asyncWebAssembly: true, topLevelAwait: true },

  webpack: (config) => {
    config.resolve.fallback = { fs: false };

    // keep your sql.js alias exactly as you had it
    delete config.resolve.alias?.['sql.js'];
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'sql.js/dist/sql-wasm.js': 'sql.js/dist/sql-wasm.mjs',
    };

    // 2)  tell webpack to ignore .d.ts and .map it might encounter ─────
    config.module.rules.push(
      { test: /\.d\.ts$/,  loader: 'ignore-loader' },
      { test: /\.js\.map$/, loader: 'ignore-loader' },
    );

    return config;
  },
};

module.exports = nextConfig;
