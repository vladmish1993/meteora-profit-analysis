// next.config.js
const nextConfig = {
  output: 'export',
  productionBrowserSourceMaps: true,
  experimental: { asyncWebAssembly: true, topLevelAwait: true },
  webpack: (config) => {
    config.resolve.fallback = { fs: false };

    /* 1.  **Remove** the existing alias that points 'sql.js' → 'sql-wasm.js' */
    delete config.resolve.alias?.['sql.js'];

    /* 2.  **OPTION A (recommended)** – send everyone the ESM factory build */
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'sql.js/dist/sql-wasm.js': 'sql.js/dist/sql-wasm.mjs'
      //              ^ what packages ask for      ^ actual factory
    };

    /*  -- or --
       **OPTION B** – just stop aliasing altogether; let packages import 'sql.js'
       directly, which gives them the factory function they expect.               */

    return config;
  },
};

module.exports = nextConfig;
