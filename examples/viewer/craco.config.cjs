const path = require('path');

module.exports = {
  webpack: {
    configure: (config) => {
      config.module.rules.unshift({
        test: /\.m?js$/,
        resolve: { fullySpecified: false },
      });
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        react: path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime.js'),
      };
      config.resolve.plugins = (config.resolve.plugins || []).filter(
        (p) => p.constructor.name !== 'ModuleScopePlugin'
      );
      // Pas de source maps : gros gain de temps et de memoire au build. Le
      // reglage vivait dans un .env, que le .gitignore du monorepo excluait —
      // il ne serait donc jamais arrive sur CodeSandbox, ou le build tombait
      // en depassement de tas.
      config.devtool = false;
      return config;
    },
  },
};
