#!/usr/bin/env node
// =====================================================================
// os#1532 — Bundle AUTONOME du viewer OpenSankey (CDN, zéro build côté hôte).
//
// Produit, depuis `src/standalone.tsx`, un seul fichier JS (IIFE, minifié) et
// sa feuille de style, dans `build/` sous la forme qu'attend le job `pages`
// du dépôt public (su-model.gitlab.io/opensankey/<version>/) :
//
//   build/index.html                     page de démonstration (example.json)
//   build/example.json                   diagramme de démonstration
//   build/static/js/main.bundle.js       → renommé opensankey-v<version>.js par `pages`
//   build/static/css/main.bundle.css     → renommé opensankey-v<version>.css par `pages`
//   build/static/js/opensankey.js        copie au nom STABLE (latest/static/js/opensankey.js)
//   build/static/css/opensankey.css      idem
//
// Pourquoi esbuild et pas react-scripts : le paquet viewer n'a plus d'entrée
// CRA depuis la scission viewer/éditeur (OS#1331), et un build webpack de
// cette taille tombe en dépassement de tas sur le runner. esbuild bundle en
// quelques secondes, sans vérification de types (c'est `tsc -p .` qui la fait).
//
// Usage : `pnpm run bundle` (dans opensankey/client). En local sans
// node_modules, `NODE_PATH` désigne un node_modules donneur, pour `require`
// comme pour la résolution d'esbuild.
// =====================================================================
'use strict'

const fs = require('fs')
const path = require('path')
const esbuild = require('esbuild')

const client_dir = path.resolve(__dirname, '..')
const build_dir = path.join(client_dir, 'build')
const pkg = JSON.parse(fs.readFileSync(path.join(client_dir, 'package.json'), 'utf8'))
const version = pkg.version
const example_json = path.resolve(client_dir, '..', '..', 'examples', 'viewer', 'src', 'business_simple.json')

const node_paths = (process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean)

const main = async () => {
  fs.rmSync(build_dir, { recursive: true, force: true })
  fs.mkdirSync(path.join(build_dir, 'static', 'js'), { recursive: true })
  fs.mkdirSync(path.join(build_dir, 'static', 'css'), { recursive: true })

  const result = await esbuild.build({
    absWorkingDir: client_dir,
    entryPoints: { 'static/js/main.bundle': path.join(client_dir, 'src', 'standalone.tsx') },
    outdir: build_dir,
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['es2019'],
    minify: true,
    sourcemap: false,
    legalComments: 'none',
    jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"production"' },
    loader: {
      '.svg': 'dataurl', '.png': 'dataurl', '.jpg': 'dataurl', '.gif': 'dataurl',
      '.woff': 'dataurl', '.woff2': 'dataurl', '.ttf': 'dataurl', '.eot': 'dataurl',
    },
    nodePaths: node_paths,
    metafile: true,
    logLevel: 'info',
  })

  // esbuild pose le CSS à côté du JS ; le job `pages` l'attend sous static/css/.
  const css_src = path.join(build_dir, 'static', 'js', 'main.bundle.css')
  const css_dst = path.join(build_dir, 'static', 'css', 'main.bundle.css')
  if (fs.existsSync(css_src)) fs.renameSync(css_src, css_dst)
  else fs.writeFileSync(css_dst, '')

  const js_dst = path.join(build_dir, 'static', 'js', 'main.bundle.js')
  fs.copyFileSync(js_dst, path.join(build_dir, 'static', 'js', 'opensankey.js'))
  fs.copyFileSync(css_dst, path.join(build_dir, 'static', 'css', 'opensankey.css'))

  if (fs.existsSync(example_json)) {
    fs.copyFileSync(example_json, path.join(build_dir, 'example.json'))
  } else {
    console.warn(`[bundle] exemple absent : ${example_json}`)
  }

  // Chemins ABSOLUS `/static/...`, comme ceux que CRA écrivait : le job `pages`
  // les rend relatifs (`./static/...`) et y substitue les noms versionnés.
  fs.writeFileSync(path.join(build_dir, 'index.html'), `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>OpenSankey ${version} — viewer autonome</title>
    <link rel="stylesheet" href="/static/css/main.bundle.css" />
    <script defer="defer" src="/static/js/main.bundle.js"></script>
    <style>html, body { margin: 0; height: 100%; } #react-container { height: 100%; }</style>
  </head>
  <body>
    <div id="react-container"></div>
    <script>
      // Mêmes clés que les props de ViewerOpenSankeyApp et que les options d'une page publiée.
      window.sankey = {
        diagram: "example.json",   // URL (JSON, .gz brut, zip) ou objet JSON inline
        embedded: true,            // true : remplit son conteneur ; false : la hauteur de la fenêtre
        topbar: false,
        zoom_control: true,
      };
    </script>
  </body>
</html>
`)

  const js_size = fs.statSync(js_dst).size
  const css_size = fs.statSync(css_dst).size
  console.log(`[bundle] opensankey ${version} : ${(js_size / 1048576).toFixed(2)} Mo JS, ${(css_size / 1024).toFixed(0)} Ko CSS → ${build_dir}`)
  fs.writeFileSync(path.join(build_dir, 'meta.json'), JSON.stringify(result.metafile))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
