# Exemple viewer OpenSankey — React + TypeScript

L'exemple canonique d'integration : une app React autonome qui embarque le viewer
`@terriflux/opensankey` (MIT) et affiche un diagramme multi-vues, dans le meme esprit que
l'application reelle [cartofob-sankey/viewer](https://github.com/IGNF/cartofob-sankey)
dont ce dossier reprend la structure.

## Ce que ca montre

- `ViewerOpenSankeyApp` (import profond `@terriflux/opensankey/src/ViewApp`) monte dans une
  page React, sous une barre fournie par l'hote.
- **Selecteur de diagramme** : deux modeles embarques, « Simple business accounting » (sans
  vues) et « Transport flows with views » (deux vues).
- **Selecteur de vue** : les vues d'un fichier sont ecrites en clair dans son JSON (cle
  `views`, `{ id : { name, ... } }`) et la vue ouverte est memorisee dans `current_view` —
  l'hote construit donc sa liste sans rien demander au viewer, et change de vue en
  redonnant le meme JSON avec `current_view` positionne (remontage via la prop `key`).
  Le paquet MIT n'expose pas de commande imperative « aller a la vue X » ; en revanche
  `data_tag_selection`, `view_tag_selection` et `position_mode` sont REACTIFS et se
  changent sans rechargement.
- **Toutes les options de `ViewerOpenSankeyApp`**, documentees dans `src/index.tsx` : ce qui
  agit reellement dans le paquet MIT (`embedded`, `topbar`, `lock_zoom`, `editable`, `logo`,
  `position_mode`, `data_tag_selection`, `view_tag_selection`), ce qui n'est lu que par le
  viewer de l'application complete (tout le chrome : barres, filtres, pied de page…) et ce
  qui est devenu sans effet.

Les diagrammes sont EMBARQUES : ni requete reseau, ni CORS, ni attente. Un exemple doit
demarrer.

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

- `src/index.tsx` — l'app : selecteurs de diagramme et de vue, `ViewerOpenSankeyApp` et la
  documentation complete de ses options.
- `src/business_simple.json`, `src/transport_dispatch_with_views.json` — les deux modeles,
  repris des templates livres avec OpenSankey.
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
