# OpenSankey Viewer — version 1.0.7

Minimal React + TypeScript example loading a Sankey JSON in read-only ("publish") mode using the published `open-sankey@1.0.7` npm package.

## Run

```
pnpm install
pnpm start
```

Then open http://localhost:3000.

## Files

- `src/index.tsx` — entry point, instantiates `Class_ApplicationData` and calls `fromJSON` then `draw`.
- `src/example.js` — Sankey JSON used as initial data.
- `public/index.html` — host page with `<div id="root">`.

## CodeSandbox

This folder is meant to be uploaded as-is to https://codesandbox.io to provide an online playground frozen against `open-sankey@1.0.7`.
