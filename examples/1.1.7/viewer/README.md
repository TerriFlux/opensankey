# OpenSankey Viewer — current build

Minimal React + TypeScript viewer for `open-sankey`, consuming the **local** build of the package via `file:../../../opensankey/client`. Use this folder to validate examples against the work-in-progress code before publishing a new version.

## What it does

- Instantiates `Class_ApplicationData` in published (read-only) mode.
- Loads a Sankey diagram from `src/example.json` via `fromJSON(...)`, which auto-draws.

## Prerequisite

The local client must be built first (the `dist/` folder is what gets imported):

```
cd ../../../opensankey/client
pnpm install
pnpm dist
```

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

## Promoting to a versioned example

When publishing a new `open-sankey` version, copy this folder to `examples/<version>/viewer/` and replace the `file:` dependency with the released version number.
