# Exemple viewer OpenSankey — React + TypeScript

L'exemple canonique d'integration : une app React autonome qui embarque le viewer
`@terriflux/opensankey` (MIT) et affiche un diagramme multi-vues, exactement comme le fait
l'application reelle [cartofob-sankey/viewer](https://github.com/IGNF/cartofob-sankey)
dont ce dossier reprend la structure.

## Ce que ca montre

- `ViewerOpenSankeyApp` (import profond `@terriflux/opensankey/src/ViewApp`) monte dans une
  page React avec une topbar custom.
- Chargement d'un JSON d'exemple de SankeyData servi par
  `https://open-sankey.fr/opensankey/menus/templates_asset/...` (CORS ouvert, gzip brut
  decompresse cote navigateur).
- Selecteur de vues : le JSON embarque plusieurs vues, chaque selection remonte le viewer
  avec le JSON de la vue en `initial_data`.

## Installer et builder

Le paquet `@terriflux/opensankey` est publie sur le registre npm GitLab du groupe
`su-model` (projet prive : token requis, cf. `.npmrc`) :

```
export GITLAB_TOKEN=<personal/deploy token, scope read_api ou read_package_registry>
npm install
npm run build      # ou npm start pour le dev server (http://localhost:3000)
```

En CI GitLab : `export GITLAB_TOKEN="$CI_JOB_TOKEN"` suffit.

Note : `npm`, pas `pnpm` — ce dossier est volontairement hors du workspace pnpm du repo
(un `pnpm install` ici serait happe par le workspace racine).

## Fichiers

- `src/index.tsx` — l'app : fetch du diagramme, selecteur de vues, `ViewerOpenSankeyApp`.
- `craco.config.cjs` — les 3 amenagements webpack necessaires au paquet (ESM sans
  extensions, alias react/react-dom dedupliques, retrait du ModuleScopePlugin).
- `.npmrc` — registre GitLab groupe + `legacy-peer-deps`.
- `.env` — `GENERATE_SOURCEMAP=false` (indispensable : evite l'OOM au build).

## Bacs a sable en ligne (CodeSandbox / StackBlitz)

Ils ne resolvent pas ce paquet aujourd'hui : le registre GitLab est prive et les bacs a
sable n'injectent pas de token. La sortie est la publication du viewer MIT sur npmjs.org
public (cf. issue sankeyapplication#317) — l'exemple basculera alors sans autre changement
que la suppression du `.npmrc`.
