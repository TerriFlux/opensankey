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
      return config;
    },
  },
};
