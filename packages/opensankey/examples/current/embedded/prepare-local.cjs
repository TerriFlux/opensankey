// Copy the latest local OpenSankey build (main.<hash>.js / .css) into bundle.js
// / bundle.css next to index.html, so the HTML viewer can be served locally
// without depending on the GitLab Pages release.
//
// Usage:
//   1. Build the OpenSankey client first:
//        cd ../../../opensankey/client && npm run build
//   2. Run this script:
//        node ./prepare-local.cjs
//   3. Serve the folder:
//        npx serve .
const fs = require('fs');
const path = require('path');

const BUILD = path.resolve(
  __dirname,
  '..', '..', '..', 'opensankey', 'client', 'build', 'static'
);
const TARGET = __dirname;

function findHashed(dir, ext) {
  if (!fs.existsSync(dir)) return null;
  const matches = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith('main.') && f.endsWith(ext) && !f.endsWith('.map'));
  if (matches.length === 0) return null;
  return path.join(dir, matches[0]);
}

const jsSrc = findHashed(path.join(BUILD, 'js'), '.js');
const cssSrc = findHashed(path.join(BUILD, 'css'), '.css');

if (!jsSrc) {
  console.error(
    'No build/static/js/main.<hash>.js found. Run `npm run build` in opensankey/client first.'
  );
  process.exit(1);
}

fs.copyFileSync(jsSrc, path.join(TARGET, 'bundle.js'));
console.log('Copied', path.relative(TARGET, jsSrc), '→ bundle.js');

if (cssSrc) {
  fs.copyFileSync(cssSrc, path.join(TARGET, 'bundle.css'));
  console.log('Copied', path.relative(TARGET, cssSrc), '→ bundle.css');
}

// Copy the build/static/media/ assets that the JS bundle references via webpack
// asset-modules (cursors, fonts, etc.). Without them you get 404s in DevTools.
const mediaSrc = path.join(BUILD, 'media');
const mediaDst = path.join(TARGET, 'static', 'media');
if (fs.existsSync(mediaSrc)) {
  fs.mkdirSync(mediaDst, { recursive: true });
  for (const f of fs.readdirSync(mediaSrc)) {
    fs.copyFileSync(path.join(mediaSrc, f), path.join(mediaDst, f));
  }
  console.log('Copied static/media/ assets');
}
