# OpenSankey HTML Viewer — version 1.1.1

Embed OpenSankey directly in a static HTML page, no build step required. The page loads a pre-built bundle from GitLab Pages and configures the viewer via `window.sankey`.

## Run

Serve the folder over HTTP:

```
npx serve .
```

## Files

- `index.html` — host page, configures `window.sankey` and includes the OpenSankey bundle.
- `example.json` / `example2colonnes.json` — Sankey data sources.
- `logo-socle.png`, `logo_terriflux.png`, `logos/logo_opensankey.png` — assets.

## Configuration

`window.sankey` keys: `publish`, `header`, `footer`, `topbar`, `toolbar`, `logo`, `recenter`, `diagram`.
