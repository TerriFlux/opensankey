# Viewer SankeyApplication 1.1.4 — exemple d'intégration

Exemple minimal React + TypeScript du composant `<ViewerSankeyApplication>`
du paquet **`@terriflux/sankeyapplication`** (v1.1.4). Illustre l'intégration
du Viewer dans une page React avec toutes les options exposées.

## Pré-requis

- Node 18+ et `pnpm` (ou `npm`)
- Accès au GitLab Package Registry de `su-model/sankeyapplication` (le paquet
  n'est pas publié sur npmjs.org)

## Configuration de la registry

Créer un fichier `.npmrc` à la racine de ce dossier `viewer/` :

```
@terriflux:registry=https://gitlab.com/api/v4/projects/61711916/packages/npm/
//gitlab.com/api/v4/projects/61711916/packages/npm/:_authToken=<TOKEN>
```

Le `<TOKEN>` (deploy token GitLab en lecture seule) est fourni séparément.

## Installation et build

```sh
pnpm install
pnpm run build
# ou : npm install --legacy-peer-deps && npm run build
```

Le build produit `build/index.html` + `build/static/`, prêts à être servis.

## Lancement

Les diagrammes (`*.json.gz`) sont chargés via `fetch()` au runtime : il faut
**servir le dossier `build/` en HTTP**, pas l'ouvrir en `file://` (bloqué CORS).

- **Windows** : double-clic sur `serve.bat` (utilise Python `http.server`)
- **Linux / Mac** : `./serve.sh` (utilise Python `http.server`)
- **Alternative npm** : `npx serve build -p 8000`

Puis ouvrir [http://localhost:8000/](http://localhost:8000/).

## Personnalisation

Toutes les options du Viewer sont documentées et commentées dans
[`src/index.tsx`](src/index.tsx) :

- **Affichage** : `topbar`, `footer`, `toolbar`, `embedded`, `recenter`
- **Branding** : `logo`, `header` (HTML brut injecté en haut)
- **Données** :
  - `initial_data` (JSON inline importé en build) — exemple : `import data from "./example.json"`
  - **OU** `diagram="exemple1.json.gz"` (URL complète, chargement runtime, gzip auto-détecté)
- **Multi-diagrammes** : `diagrams_list={{ "Libellé": "nom_base.json", ... }}`
  ajoute un dropdown dans la topbar ; le Viewer fetch `<nom_base.json>.gz`
- **Configs par diagramme** : `diagrams_config` permet d'overrider certaines
  options lors du changement de diagramme via le dropdown
- **Filtres topbar** : `data_type`, `data_type_intervals`, `value_filter`

Les fichiers `.json.gz` doivent être servis à la racine du site (placés
dans `public/` côté source — copiés dans `build/` au build). Le format
attendu est un JSON Sankey standard compressé en gzip.

## Structure des fichiers

```
viewer/
  src/
    index.tsx            # entrée React + toutes les options commentées
    example.json         # données du diagramme 1
    example2.json        # données du diagramme 2
    example3.json        # données du diagramme 3
  public/
    index.html           # host page
    exemple1.json.gz     # diagrammes servis à la racine (diagrams_list)
    exemple2.json.gz
    exemple3.json.gz
    logo_terriflux.png   # logos exposés en publish_mode
    logos/               # idem en sous-dossier (utilisé en edit_mode)
  package.json
  tsconfig.json
  craco.config.cjs       # config React + webpack
  serve.bat / serve.sh   # serveur HTTP local pour tester build/
```

## Support

En cas de blocage à l'install, au build, ou pour toute question sur les
options : contacter Julien Alapetite — TerriFlux.
