# OpenSankey HTML Viewer — version 1.0.7

Embed OpenSankey directly in a static HTML page, no build step required. The page loads a pre-built bundle from GitLab Pages and configures the viewer via `window.sankey`.

## Run

Serve the folder over HTTP (the JSON fetch needs CORS-friendly serving):

```
npx serve .
```

Then open the URL printed by `serve` (typically http://localhost:3000).

Opening `index.html` directly via `file://` will fail to load `example.json` due to browser fetch restrictions.

## Files

- `index.html` — host page, configures `window.sankey` and includes the OpenSankey bundle.
- `example.json` / `example2colonnes.json` — Sankey data sources. Switch via the `diagram` field in `index.html`.
- `logo-socle.png`, `logo_terriflux.png`, `logos/logo_opensankey.png` — assets referenced by the page.

## Configuration

`window.sankey` keys:

- `publish: true` — read-only mode.
- `header`, `footer` — optional banners.
- `topbar`, `toolbar` — show/hide UI chrome.
- `logo` — replace the default OpenSankey logo.
- `recenter` — auto-fit the diagram on load.
- `diagram` — JSON path to load.
