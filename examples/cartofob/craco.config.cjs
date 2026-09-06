const path = require('path');
const fs = require('fs');

// ============================================================================
// MODE « SOURCES LOCALES » — OS_LOCAL=1
//
// Par defaut cet exemple consomme le paquet PUBLIE (@terriflux/opensankey depuis
// npmjs) : c'est ce qui garantit qu'il s'installe sans jeton, chez un
// integrateur comme sur CodeSandbox.
//
// Le revers, c'est la boucle d'essai : pour voir l'effet d'un changement de la
// bibliotheque, il fallait le faire fusionner, publier une version, jouer le
// miroir, et attendre CodeSandbox. Des heures pour verifier une ligne.
//
// Avec OS_LOCAL=1, `@terriflux/opensankey/src/...` pointe sur les SOURCES de
// l'espace de travail (`opensankey/client/src`) au lieu du paquet installe :
//
//     OS_LOCAL=1 npm start     -> rechargement a chaud sur le code local
//     OS_LOCAL=1 npm run build -> build de verification
//
// Le drapeau est INERTE par defaut : ni CodeSandbox ni la CI ne le posent, et
// le paquet publie reste seul maitre de ce qui est servi au public.
// ============================================================================
const OS_LOCAL = process.env.OS_LOCAL === '1';
const OS_SRC = path.resolve(__dirname, '../../opensankey/client/src');

if (OS_LOCAL && !fs.existsSync(OS_SRC)) {
  throw new Error(
    `OS_LOCAL=1 mais les sources sont introuvables : ${OS_SRC}\n` +
    "Ce mode n'a de sens que dans le monorepo, pas dans une copie isolee de l'exemple."
  );
}

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

      if (OS_LOCAL) {
        // L'exemple importe par sous-chemins (`@terriflux/opensankey/src/ViewApp`).
        // Rerouter le PREFIXE suffit donc, et garde les imports du code inchanges :
        // les fichiers portent les memes noms sous `src/`, en .tsx au lieu de .js.
        config.resolve.alias['@terriflux/opensankey/src'] = OS_SRC;

        // CRA ne transpile que le `src/` de l'application : sans ca, les .tsx de la
        // bibliotheque arrivent bruts jusqu'au bundler et tout casse. C'est le meme
        // piege que dans SankeyApplication, ou babel s'arrete a `appSrc`.
        const oneOf = (config.module.rules.find((r) => Array.isArray(r.oneOf)) || {}).oneOf || [];
        const compiles = oneOf.filter(
          (r) => r.include && String(r.loader || '').includes('babel-loader')
        );
        if (compiles.length === 0) {
          throw new Error(
            "OS_LOCAL=1 : aucune regle babel-loader avec `include` trouvee dans la config CRA. " +
            'Elle a du changer de forme — a reprendre avant de se fier a ce mode.'
          );
        }
        compiles.forEach((r) => {
          r.include = [].concat(r.include, OS_SRC);
        });
        console.log(`[OS_LOCAL] @terriflux/opensankey/src -> ${OS_SRC}`);
      }
      // Pas de source maps : gros gain de temps et de memoire au build. Le
      // reglage vivait dans un .env, que le .gitignore du monorepo excluait —
      // il ne serait donc jamais arrive sur CodeSandbox, ou le build tombait
      // en depassement de tas.
      config.devtool = false;
      return config;
    },
  },
};
