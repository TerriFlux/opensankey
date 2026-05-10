# OpenSankey

> **⚠️ This is a read-only mirror.**
> All development, issues and merge requests happen on GitLab:
> **https://gitlab.com/su-model/opensankey**
>
> Issues and pull requests opened here will not be reviewed.
> Please use the GitLab project instead.

Interactive Sankey diagram library (viewer + editor) built with React and D3.js.
Distributed as an embeddable CDN bundle, an npm package, and ready-to-run HTML examples.

Maintained by [TerriFlux](https://terriflux.fr).

## Live demos

A version-by-version showcase is available at **https://terriflux.github.io**.

You can also run any example locally — see [`examples/`](./examples).

## Versions

| Version | CDN bundle | Examples |
|---|---|---|
| `current` (dev) | — | [`examples/current/`](./examples/current) |
| `1.1.2` | https://su-model.gitlab.io/opensankey/1.1.2/static/js/opensankey-v1.1.2.js | [`examples/1.1.2/`](./examples/1.1.2) |
| `1.1.1` | https://su-model.gitlab.io/opensankey/1.1.1/static/js/opensankey-v1.1.1.js | [`examples/1.1.1/`](./examples/1.1.1) |
| `1.0.7` | https://su-model.gitlab.io/opensankey/1.0.7/static/js/opensankey-v1.0.7.js | [`examples/1.0.7/`](./examples/1.0.7) |

## Quick start (HTML, no build)

```html
<!DOCTYPE html>
<html>
  <head>
    <title>OpenSankey</title>
    <script
      defer
      src="https://su-model.gitlab.io/opensankey/1.1.2/static/js/opensankey-v1.1.2.js"
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

A working version of this snippet is in [`examples/1.1.2/html-viewer/`](./examples/1.1.2/html-viewer)
(double-click `serve.bat` on Windows, or run `./serve.sh` on Linux/Mac, then open the served page).

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

A complete, runnable example is in [`examples/1.1.2/viewer/`](./examples/1.1.2/viewer).

## License

MIT — see [LICENSE](./LICENSE).

## Authors

Vincent LE DOZE, Vincent CLAVEL, Julien Alapetite — [TerriFlux](https://terriflux.fr).
