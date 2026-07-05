module.exports = {
  webpack: {
    configure: (config) => {
      config.module.rules.unshift({
        test: /\.m?js$/,
        resolve: { fullySpecified: false },
      });
      return config;
    },
  },
};
