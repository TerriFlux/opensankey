# OpenSankey

> **⚠️ Read-only mirror.**
> Active development happens on GitLab : **https://gitlab.com/su-model/opensankey**.
> Issues and merge requests opened on GitHub will not be reviewed — please use the GitLab project.

Interactive Sankey diagram library (viewer + editor) built with React and D3.js.
Distributed as :

- a self-contained **CDN bundle** you embed with a single `<script>` tag,
- an **npm package** for React/TypeScript projects,
- a set of **ready-to-run examples** (zero install for the HTML variants).

Maintained by [TerriFlux](https://terriflux.fr).

## Live demos

A version-by-version showcase is live at **https://terriflux.github.io**.

To run any example locally, see [`examples/`](./examples) and double-click
`examples/serve.bat` (Windows) or `./examples/serve.sh` (Linux/Mac).

## Versions & démos

> Versions `1.1.0`, `1.1.1` and `1.1.2` are deprecated on npm (weekend iterations). Use `1.1.3` or higher.

### 1.1.3 *(latest)*

[npm](https://www.npmjs.com/package/open-sankey/v/1.1.3) ·
[CDN bundle](https://su-model.gitlab.io/opensankey/1.1.3/static/js/opensankey-v1.1.3.js) ·
[code source GitHub](https://github.com/TerriFlux/opensankey/tree/main/examples/1.1.3)

| Démo | Live (terriflux.github.io) | Éditer (CodeSandbox) |
|---|---|---|
| viewer (React, lecture seule) | [open ↗](https://terriflux.github.io/1.1.3/viewer/) | [open ↗](https://codesandbox.io/p/sandbox/github/TerriFlux/opensankey/tree/main/examples/1.1.3/viewer) |
| editor (React, édition) | [open ↗](https://terriflux.github.io/1.1.3/editor/) | [open ↗](https://codesandbox.io/p/sandbox/github/TerriFlux/opensankey/tree/main/examples/1.1.3/editor) |
| html-viewer (HTML pur, bundle CDN) | [open ↗](https://terriflux.github.io/1.1.3/html-viewer/) | [open ↗](https://codesandbox.io/p/sandbox/github/TerriFlux/opensankey/tree/main/examples/1.1.3/html-viewer) |

### 1.0.7

[npm](https://www.npmjs.com/package/open-sankey/v/1.0.7) ·
[CDN bundle](https://su-model.gitlab.io/opensankey/1.0.7/static/js/opensankey-v1.0.7.js) ·
[code source GitHub](https://github.com/TerriFlux/opensankey/tree/main/examples/1.0.7)

| Démo | Live | Éditer (CodeSandbox) |
|---|---|---|
| viewer | [open ↗](https://terriflux.github.io/1.0.7/viewer/) | [open ↗](https://codesandbox.io/p/sandbox/github/TerriFlux/opensankey/tree/main/examples/1.0.7/viewer) |
| editor | [open ↗](https://terriflux.github.io/1.0.7/editor/) | [open ↗](https://codesandbox.io/p/sandbox/github/TerriFlux/opensankey/tree/main/examples/1.0.7/editor) |
| html-viewer | [open ↗](https://terriflux.github.io/1.0.7/html-viewer/) | [open ↗](https://codesandbox.io/p/sandbox/github/TerriFlux/opensankey/tree/main/examples/1.0.7/html-viewer) |

### current (dev)

`open-sankey` y est référencé via `file:../../../opensankey/client` pour bosser
sur la source en direct. Pas de bundle CDN, pas de version npm, mais utilisable
en clonant le repo.

| Démo | Éditer (CodeSandbox) |
|---|---|
| viewer | [open ↗](https://codesandbox.io/p/sandbox/github/TerriFlux/opensankey/tree/main/examples/current/viewer) |
| editor | [open ↗](https://codesandbox.io/p/sandbox/github/TerriFlux/opensankey/tree/main/examples/current/editor) |
| html-viewer | [open ↗](https://codesandbox.io/p/sandbox/github/TerriFlux/opensankey/tree/main/examples/current/html-viewer) |

## Quick start (HTML, no build)

```html
<!DOCTYPE html>
<html>
  <head>
    <title>OpenSankey</title>
    <script
      defer
      src="https://su-model.gitlab.io/opensankey/1.1.3/static/js/opensankey-v1.1.3.js"
    ></script>
  </head>
  <body>
    <div id="react-container"></div>
    <script>
      window.sankey = {
        publish: true,
        diagram: "example.json",
      };
    </script>
  </body>
</html>
```

A working version of this snippet is in [`examples/1.1.3/html-viewer/`](./examples/1.1.3/html-viewer)
(double-click `serve.bat` then open the served page).

## Quick start (React + npm)

```bash
npm install open-sankey
```

```tsx
import { ViewerOpenSankeyApp } from "open-sankey/dist/ViewApp";
import { Type_JSON } from "open-sankey/dist/types/Utils";
import initial_data from "./example.json";

export default function App() {
  return <ViewerOpenSankeyApp initial_data={initial_data as Type_JSON} />;
}
```

A complete, runnable example is in [`examples/1.1.3/viewer/`](./examples/1.1.3/viewer).

## License

MIT — see [LICENSE](./LICENSE).

## Authors

Vincent LE DOZE, Vincent CLAVEL, Julien Alapetite — [TerriFlux](https://terriflux.fr).
