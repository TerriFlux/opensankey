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

## Versions

| Version | npm | CDN bundle (gitlab.io) | Sandbox (codesandbox.io) |
|---|---|---|---|
| **1.1.3** *(latest)* | [open-sankey@1.1.3](https://www.npmjs.com/package/open-sankey/v/1.1.3) | [opensankey-v1.1.3.js](https://su-model.gitlab.io/opensankey/1.1.3/static/js/opensankey-v1.1.3.js) | [open in CodeSandbox](https://codesandbox.io/p/github/TerriFlux/opensankey/main?file=examples/1.1.3/viewer/src/index.tsx) |
| **1.0.7** | [open-sankey@1.0.7](https://www.npmjs.com/package/open-sankey/v/1.0.7) | [opensankey-v1.0.7.js](https://su-model.gitlab.io/opensankey/1.0.7/static/js/opensankey-v1.0.7.js) | [open in CodeSandbox](https://codesandbox.io/p/github/TerriFlux/opensankey/main?file=examples/1.0.7/viewer/src/index.tsx) |
| `current` (dev) | — (uses `file:` link to the source) | — | [open in CodeSandbox](https://codesandbox.io/p/github/TerriFlux/opensankey/main?file=examples/current/viewer/src/index.tsx) |

> Versions `1.1.0`, `1.1.1` and `1.1.2` were weekend iterations and are
> deprecated on npm. Use `1.1.3` or higher.

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
