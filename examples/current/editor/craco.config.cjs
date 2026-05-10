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
      return config;
    },
  },
};
