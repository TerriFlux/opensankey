const path = require('path');

const chakraCjs = path.join(
  path.dirname(require.resolve('@chakra-ui/react/package.json')),
  'dist/cjs/index.cjs'
);

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
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        '@chakra-ui/react$': chakraCjs,
      };
      return config;
    },
  },
};
