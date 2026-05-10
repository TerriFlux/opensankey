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
      // Force la resolution de React vers UNE SEULE copie (celle de l'exemple).
      // Sans ca, opensankey link: file: a son propre node_modules/react, le
      // bundle contient deux Reacts et les hooks pètent ("useContext, N.current
      // is null"). Necessaire pour current/* qui utilise file: link.
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        react: path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime.js'),
      };
      // ModuleScopePlugin de CRA bloque les imports en dehors de src/ ; pour
      // un file: link sur opensankey/client il faut le retirer.
      config.resolve.plugins = (config.resolve.plugins || []).filter(
        (p) => p.constructor.name !== 'ModuleScopePlugin'
      );
      return config;
    },
  },
};
