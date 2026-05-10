# SankeyApplication examples

Self-contained React + TypeScript apps embedding `@terriflux/sankeyapplication`. Each example has the standard CRA layout: `public/index.html`, `src/index.tsx`, `src/example.json` (the input Sankey JSON), `package.json`, `tsconfig.json`.

These examples mirror the upstream OpenSankey examples: same datasets, same shape of code, but consuming the SankeyApplication package and instantiating `Class_ApplicationDataSA` instead of `Class_ApplicationData`. Their main purpose is to verify that the SA chain (SA → OSP → OS) handles the same JSON correctly through the Viewer/Editor surface.

## Layout

```
examples/
└── current/                      # consumes the local SankeyApplication build (file: link)
    ├── viewer/                   # ViewerSankeyApplication (read-only)
    ├── editor/                   # SpreadSheet + Class_ApplicationDataSA
    └── html-viewer/              # pure HTML, loads the local main.<hash>.js bundle
```

- `current/<example>/` — `package.json` resolves `@terriflux/sankeyapplication` via `file:../../../client`. Build the client first (`npm run dist` in `client/`) before `npm install` here.
- New version folders (`<X.Y.Z>/`) will be added on each release as a frozen snapshot of `current/`.

## Available examples

| Example | What it shows |
|---|---|
| `viewer` | Minimal read-only React/TypeScript viewer: `Class_ApplicationDataSA(true)` + `fromJSON` + `draw`, with `window.sankey.publish = true`. |
| `editor` | Editable variant with `SpreadSheet` and a "Remplir" button to mutate link values. |
| `html-viewer` | Pure HTML / `<script>` tag — no build step, loads the SankeyApplication UMD bundle from local build or GitLab Pages and configures via `window.sankey`. |

## Running an example

```
cd examples/current/<example>
npm install
npm start
```

Open http://localhost:3000.

## Building all examples

```
./build-all.sh             # builds every example (skip if node_modules present)
./build-all.sh --force     # force npm install everywhere
./build-all.sh --only current
```
