# Third-party notices

Ce fichier recense les composants tiers dont du **code source a été porté ou
adapté** dans ce dépôt (par opposition aux dépendances simplement installées via
npm ou pip, dont les licences accompagnent les paquets).

---

## SankeyMATIC

- Source : https://github.com/nowthis/sankeymatic
- Licence : ISC
- Copyright (c) 2014-2024, Steve Bogart, <sbogart@sankeymatic.com>

Fichiers de ce dépôt dérivés de SankeyMATIC :

| Fichier | Origine |
|---|---|
| `packages/opensankey/opensankey/client/src/Persistence/sankeymaticLayout.ts` | `build/sankey.js` (algorithme de placement) |
| `packages/opensankey/opensankey/client/src/Persistence/sankeymaticThemes.ts` | `build/sankeymatic.js` (section « Color Theme handling ») |
| `packages/opensankey/opensankey/client/src/Persistence/sankeymaticParser.ts` | `build/constants.js` et `build/sankeymatic.js` (syntaxe, expressions régulières, réglages et valeurs par défaut) |
| `packages/opensankey/opensankey/server/sankey_layout.py` | `build/sankey.js` (portage Python historique, aujourd'hui limité à l'import STAN) |

Texte de la licence :

```
Copyright (c) 2014-2024, Steve Bogart, <sbogart@sankeymatic.com>

ISC (Internet Software Consortium) License:

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS.

IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING
FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT,
NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION
WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

L'ISC est une licence permissive, compatible avec la licence MIT de ce projet.
Elle n'impose que la reproduction du copyright et de l'avis ci-dessus.
