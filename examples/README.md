# OpenSankey examples

Self-contained React + TypeScript apps embedding `open-sankey`. Each example has the standard CRA layout: `public/index.html`, `src/index.tsx`, `src/example.js` (the input Sankey JSON), `package.json`, `tsconfig.json`.

## Layout

```
examples/
├── current/                     # consumes the local OpenSankey build (file: link)
│   ├── viewer/
│   └── editor/
├── 1.1.1/                       # frozen on open-sankey@1.1.1
│   ├── viewer/
│   └── editor/
└── 1.0.7/                       # frozen on open-sankey@1.0.7 (legacy)
    ├── viewer/
    └── editor/
```

- `current/<example>/` — `package.json` resolves `open-sankey` via `file:../../../opensankey/client`. Build the client first (`pnpm dist` in `opensankey/client`) before `pnpm install` here. Use this to validate examples against the work-in-progress code.
- `<version>/<example>/` — frozen folder pinned to a specific published `open-sankey` version. Each new release gets its own copy so external devs can fork it on https://codesandbox.io and stay reproducible.

## Available examples

| Example | What it shows |
|---|---|
| `viewer` | Minimal read-only viewer: `Class_ApplicationData(true)` + `fromJSON` + `draw`, with `window.sankey.publish = true`. |

> Multi-views and other OSP-only features are not in this folder — they belong to the `opensankey-plus` package and should be added under its own `examples/` directory.

## Adding a new published version

When a new `open-sankey` version ships:

1. Copy `current/viewer/` to `<new-version>/viewer/`.
2. In the new folder's `package.json`, replace `"open-sankey": "file:../../../opensankey/client"` with `"open-sankey": "<new-version>"`.
3. Bump the example's own `version` and `name` (`open-sankey-viewer-example-<new-version>`).
4. Upload the folder to CodeSandbox and link it from the project README.

## Running an example

```
cd examples/<folder>/<example>
pnpm install
pnpm start
```

Open http://localhost:3000.
