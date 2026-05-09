# OpenSankey Viewer — version 1.1.0

Minimal React + TypeScript viewer pinned against the published `open-sankey@1.1.0` npm package. Suitable as a CodeSandbox template for external developers.

## What it does

- Instantiates `Class_ApplicationData` in published (read-only) mode.
- Loads a Sankey diagram from `src/example.json` via `fromJSON(...)`, which auto-draws.

## Run

```
pnpm install
pnpm start
```

Open http://localhost:3000.

## Files

- `src/index.tsx` — entry point.
- `src/example.json` — Sankey diagram loaded as initial data. Drop in any other valid OpenSankey JSON.
- `public/index.html` — host page with `<div id="root">`.

## CodeSandbox

This folder is meant to be uploaded as-is to https://codesandbox.io to provide an online playground frozen against `open-sankey@1.1.0`.
