// Workaround for `file:` link to a local OpenSankey build:
// npm copies the linked package's node_modules verbatim, which duplicates
// React, Chakra, i18next, etc. Two copies of React break the hooks dispatcher.
// We strip them from the embedded folder so module resolution falls back to
// the example's own copies. Not needed when consuming open-sankey from npm
// (registry installs are deduped automatically).
const fs = require('fs');
const path = require('path');

const dupes = [
  'react',
  'react-dom',
  '@chakra-ui',
  '@emotion',
  'framer-motion',
  'i18next',
  'react-i18next',
];

const target = path.join(__dirname, '..', 'node_modules', 'open-sankey', 'node_modules');
if (!fs.existsSync(target)) process.exit(0);

for (const p of dupes) {
  const full = path.join(target, p);
  try {
    fs.rmSync(full, { recursive: true, force: true });
  } catch {
    // ignore
  }
}
