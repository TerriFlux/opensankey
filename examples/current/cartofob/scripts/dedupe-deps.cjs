// Workaround for `file:` link to a local SankeyApplication build:
// npm copies the linked package's node_modules verbatim, which duplicates
// React. Two copies of React break the hooks dispatcher. We strip only
// React (+ jsx-runtime path) from the embedded folder so module resolution
// falls back to the example's own copies. The other modules (Chakra,
// i18next, etc.) are left in place: the example does not declare them all,
// and webpack must be able to resolve them from inside the SA build.
// Not needed when consuming the package from the GitLab registry.
const fs = require('fs');
const path = require('path');

const dupes = [
  'react',
  'react-dom',
];

const target = path.join(__dirname, '..', 'node_modules', '@terriflux', 'sankeyapplication', 'node_modules');
if (!fs.existsSync(target)) process.exit(0);

for (const p of dupes) {
  const full = path.join(target, p);
  try {
    fs.rmSync(full, { recursive: true, force: true });
  } catch {
    // ignore
  }
}
