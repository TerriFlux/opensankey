const path = require('path');

module.exports = {
  webpack: {
    configure: (config) => {
      config.module.rules.unshift(
        { test: /\.m?js$/, resolve: { fullySpecified: false } },
        { test: /\.cjs$/, type: 'javascript/auto' },
      );
      config.resolve.extensions = [
        ...(config.resolve.extensions || []),
        '.cjs',
      ];
      // Force une seule copie de React/React-DOM : le `file:` link vers
      // ../../client copie node_modules verbatim, ce qui peut entrainer
      // 2 copies de React (hooks dispatcher casse → "M.current is null"
      // au premier useToast/useContext). Idem aussi pour les @chakra-ui/*
      // qui utilisent useContext pour leur color-mode-context.
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        react: path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime.js'),
      };
      config.resolve.plugins = (config.resolve.plugins || []).filter(
        (p) => p.constructor.name !== 'ModuleScopePlugin'
      );
      return config;
    },
  },
};
