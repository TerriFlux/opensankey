# Viewer CARTOFOB — current build

Reprise du viewer de [cartofob-sankey](https://github.com/IGNF/cartofob-sankey) (`viewer/`),
mais câblé sur le build **local** du client via `file:../../../client` au lieu du paquet
publié. Permet de tester la cartographie forêt-bois contre le code en cours **sans publier**
de nouvelle version de `@terriflux/sankeyapplication`.

Topbar personnalisée à 2 sélecteurs (Région = data tag, Essence = view tag) lus
dynamiquement depuis `public/CARTOFOB.json` — voir `src/index.tsx`.

## Prérequis

Le client local doit être buildé (c'est le `dist/` qui est importé) :

```
cd ../../../client
pnpm install
pnpm dist
```

Les données ne sont pas versionnées (`public/*.json`/`*.json.gz` gitignoré). Déposer le
diagramme (gzippé pour rester léger — 7,7 Mo → ~650 Ko) :

```
gzip -9 -c <chemin>/cartofob-sankey/viewer/public/CARTOFOB.json > public/CARTOFOB.json.gz
```

Le viewer décompresse le `.gz` nativement ; la topbar aussi (voir `fetchJson` dans
`src/index.tsx`). Pour repasser au `.json` non compressé, changer `DIAGRAM` en tête de fichier.

## Lancer (dev)

```
pnpm install
pnpm start
```

Le `.npmrc` local (`public-hoist-pattern[]=*`, comme `client/.npmrc`) aplatit les deps
transitives : sans lui, pnpm laisse `@icons/material`, `@fortawesome`, etc. dans son store
virtuel, inaccessibles depuis le `dist/` injecté (« Module not found »).

**Workflow itératif — IMPORTANT.** Le `client/dist/` est copié (injecté) dans le store pnpm
au moment du `pnpm install`. Après chaque rebuild du client, il faut resynchroniser cette
copie, sinon l'exemple tourne sur un `dist` figé (fichiers manquants / ancien comportement) :

```
cd ../../../client && pnpm dist          # recompile le client
cd -                                     # retour dans l'exemple
pnpm install                             # resync la copie injectée (au besoin : rm -rf node_modules pnpm-lock.yaml)
```

## Build + servir en statique

```
pnpm run build
./serve.ps1        # ou ./serve.sh / serve.bat — sert build/ sur http://localhost:8000
```

## Passage en exemple versionné

Copier ce dossier vers `examples/<version>/cartofob/` et remplacer la dépendance
`file:../../../client` par le numéro de version publié.
