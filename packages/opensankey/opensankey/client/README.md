# open-sankey

Interactive Sankey diagram library (viewer + editor) for React / TypeScript,
built on D3.js. Maintained by [TerriFlux](https://terriflux.fr).

- **Source (active development)** : https://gitlab.com/su-model/opensankey
- **GitHub mirror (read-only)** : https://github.com/TerriFlux/opensankey
- **Live demos, version by version** : https://terriflux.github.io

> The full mono-repo (React client + optional Python/Flask server, Docker,
> CLI tools, examples) lives in the GitLab project above. This npm package
> ships only the React client.

## Install

```bash
npm install open-sankey
# or
pnpm add open-sankey
```

Peer requirements : React 18.

## Minimal usage (viewer)

```tsx
import { ViewerOpenSankeyApp } from "open-sankey/dist/ViewApp";
import { Type_JSON } from "open-sankey/dist/types/Utils";
import initial_data from "./example.json";

export default function App() {
  return <ViewerOpenSankeyApp initial_data={initial_data as Type_JSON} />;
}
```

Complete runnable example :
[examples/1.1.4/viewer](https://github.com/TerriFlux/opensankey/tree/main/examples/1.1.4/viewer) ·
[open in CodeSandbox](https://codesandbox.io/p/devbox/github/TerriFlux/opensankey/tree/main/examples/1.1.4/viewer)

## Editor

For a fully-featured editor (drag, style, spreadsheet, import/export), the
ready-to-run starter is the recommended entry point — it wires the
`Class_ApplicationData` model, the `SpreadSheet` panel and i18n resources
together :

[examples/1.1.4/editor](https://github.com/TerriFlux/opensankey/tree/main/examples/1.1.4/editor) ·
[open in CodeSandbox](https://codesandbox.io/p/devbox/github/TerriFlux/opensankey/tree/main/examples/1.1.4/editor)

A bare-bones editor shell is also exported as `DefaultOpenSankeyApp` from
`open-sankey/dist/DefaultApp`, and the underlying configurable shell as
`OpenSankeyApp` from `open-sankey/dist/App`.

## No-build alternative (CDN)

If you don't want to set up a React project, a self-contained bundle is
available and embeds with a single `<script>` tag :

```html
<script
  defer
  src="https://su-model.gitlab.io/opensankey/1.1.4/static/js/opensankey-v1.1.4.js"
></script>
<div id="react-container"></div>
<script>
  window.sankey = { publish: true, diagram: "example.json" };
</script>
```

Working sample :
[examples/1.1.4/html-viewer](https://github.com/TerriFlux/opensankey/tree/main/examples/1.1.4/html-viewer).

## Versions

> `1.1.0` → `1.1.2` are deprecated (weekend iterations). Use `1.1.3` or higher.

Browse the per-version showcase at https://terriflux.github.io.

## License

MIT — see [LICENSE](./LICENSE).

## Authors

Vincent Le Doze, Vincent Clavel, Julien Alapetite — [TerriFlux](https://terriflux.fr).
