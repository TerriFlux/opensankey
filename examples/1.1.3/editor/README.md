# OpenSankey Editor — current build

Sankey en mode édition (`Class_ApplicationData(false)`), avec `SpreadSheet` pour éditer les valeurs des flux et un bouton "Remplir" qui pré-remplit les valeurs et rafraîchit la spreadsheet.

> **Statut : non fonctionnel actuellement.** Le packaging d'`open-sankey` casse pour les consommateurs externes (interop ESM/CJS avec Chakra). Voir le ticket de packaging avant utilisation.

## Run (théorique)

```
pnpm install
pnpm start
```

## Files

- `src/index.tsx` — entry point, monte un éditeur avec spreadsheet.
- `src/example.json` — Sankey de départ.
- `public/index.html` — host page.
