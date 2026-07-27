# OpenSankey

Bibliothèque de diagrammes de Sankey interactifs, en React et D3.js.
Publiée sur npm sous [`@terriflux/opensankey`](https://www.npmjs.com/package/@terriflux/opensankey),
sous licence **MIT**.

Maintenue par [TerriFlux](https://terriflux.fr).

> **Miroir en lecture seule.** Ce dépôt est généré automatiquement à partir du
> monorepo privé de TerriFlux. Les issues et merge requests ouvertes ici ne sont
> pas suivies — écrivez à <julien.alapetite@terriflux.fr>.

## Essayer sans rien installer

[Ouvrir l'exemple sur CodeSandbox](https://codesandbox.io/p/devbox/github/TerriFlux/opensankey/tree/main/examples/viewer)

## Installer

```bash
npm install @terriflux/opensankey
```

```tsx
import { ViewerOpenSankeyApp } from "@terriflux/opensankey/src/ViewApp";
import type { Type_AnyJSON } from "@terriflux/opensankey/src/types/Utils";
import diagram from "./diagram.json";

export default function App() {
  return <ViewerOpenSankeyApp initial_data={diagram as Type_AnyJSON} embedded />;
}
```

Les chemins d'import passent par `src/` : le paquet publié expose ses fichiers
compilés sous ce préfixe, et son point d'entrée ne réexporte rien (il ne porte
que les effets de bord CSS et traductions).

Exemple complet et commenté : [`examples/viewer/`](./examples/viewer) — chargement
d'un diagramme distant, gestion du gzip brut, sélecteur de vues.

Si `npm install` échoue sur un conflit de peer dependencies avec
`react-scripts@5`, ajoutez un `.npmrc` contenant `legacy-peer-deps=true` : cette
version déclare `typescript@^3 || ^4` en peer, ce qui bloque tout projet en
TypeScript 5.

## Ce que contient ce dépôt

| Chemin | Contenu |
|---|---|
| [`opensankey/client/`](./opensankey/client) | les sources de la bibliothèque, publiées comme `@terriflux/opensankey` |
| [`opensankey/server/`](./opensankey/server) | le serveur Flask de démonstration |
| [`examples/viewer/`](./examples/viewer) | l'exemple d'intégration React |

## Viewer et éditeur

Depuis la version 1.2.0, OpenSankey est scindé en deux paquets :

| Paquet | Rôle | Licence |
|---|---|---|
| `@terriflux/opensankey` | lire, embarquer, dessiner | **MIT** |
| `@terriflux/opensankey-editor` | l'interface d'édition complète | **AGPL-3.0-or-later**, ou licence commerciale |

Le second vit dans son propre dépôt :
<https://gitlab.com/su-model/opensankey-editor>. L'AGPL le rend libre d'usage et
auto-hébergeable, mais son intégration dans un produit propriétaire demande une
licence commerciale — écrivez-nous.

Au-dessus de ces deux couches, TerriFlux édite **MFASankey**, en deux éditions
propriétaires (Production, Analyse) : production de diagrammes en série et
réconciliation de flux de matières. [Tarifs](https://terriflux.fr/fr/tarifs/).

## Licence

MIT — voir [LICENSE](./LICENSE).

## Auteurs

Vincent LE DOZE, Vincent CLAVEL, Julien Alapetite — [TerriFlux](https://terriflux.fr).
