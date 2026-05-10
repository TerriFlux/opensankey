# OpenSankey HTML Viewer — current build

Static HTML page embedding OpenSankey via the **local** build of `opensankey/client`. No npm install needed in this folder, just a build step in the client and a static file server here.

## Run

1. Build the OpenSankey client:
   ```
   cd ../../../opensankey/client
   npm run build
   ```
2. Stage the bundle locally:
   ```
   cd ../../../examples/current/html-viewer
   node ./prepare-local.cjs
   ```
   This copies `build/static/js/main.<hash>.js` → `bundle.js` and the matching CSS / media assets.
3. Serve the folder:
   ```
   npx serve .
   ```

## Files

- `index.html` — points to `./bundle.js` and `./bundle.css` (both produced by `prepare-local.cjs`).
- `prepare-local.cjs` — copies the latest local build into the folder.
- `example.json` / `example2colonnes.json` — Sankey data sources.
- Logos and assets.
- `bundle.js`, `bundle.css`, `static/` — generated, gitignored.

## Promoting to a versioned example

When deploying a new OpenSankey version to GitLab Pages, copy this folder to `examples/<version>/html-viewer/` and replace the `<script>` and `<link>` tags with the GitLab Pages URL:

```html
<link rel="stylesheet" href="https://su-model.gitlab.io/opensankey/<version>/static/css/main.<hash>.css" />
<script defer="defer" src="https://su-model.gitlab.io/opensankey/<version>/static/js/opensankey-v1.0.0.js"></script>
```
