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

`@terriflux/opensankey` est publie sur **npmjs public** : aucun jeton, aucun registre a
declarer.

```
npm install
npm run build      # ou npm start pour le dev server (http://localhost:3000)
```

Note : `npm`, pas `pnpm` — ce dossier est volontairement hors du workspace pnpm du repo
(un `pnpm install` ici serait happe par le workspace racine).

## Fichiers

- `src/index.tsx` — l'app : fetch du diagramme, selecteur de vues, `ViewerOpenSankeyApp`.
- `craco.config.cjs` — les amenagements webpack necessaires au paquet (ESM sans extensions,
  alias react/react-dom dedupliques, retrait du ModuleScopePlugin) et `devtool = false`,
  qui evite le depassement de tas au build.
- `.npmrc` — `legacy-peer-deps` uniquement : `react-scripts@5` declare `typescript ^3 || ^4`
  en peer alors que cet exemple compile en TypeScript 5, ce qui bloque `npm install` depuis
  npm 7.
- `package-lock.json` — versionne, pour qu'une derive de dependance transitive ne casse pas
  la demo sans que personne n'y ait touche.

## Bacs a sable en ligne

**Il faut un Devbox, pas un Sandbox.** Le Sandbox (bac a sable historique, accessible sans
compte) ne lance pas `npm install` : il resout les dependances via son propre CDN,
`sandpack-cdn-v2.codesandbox.io`, qui ignore le `.npmrc` et echoue sur ce paquet
(1,1 Mo, 266 fichiers, imports par sous-chemins) — l'erreur affichee est alors
« Could not fetch dependencies ». Le Devbox, lui, tourne dans un vrai conteneur avec npm ;
il demande d'etre connecte a CodeSandbox.

[Ouvrir en Devbox](https://codesandbox.io/p/devbox/github/TerriFlux/opensankey/tree/main/examples/viewer)

Le fichier `.codesandbox/tasks.json` de ce dossier decrit l'installation et le demarrage.
