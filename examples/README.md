# Exemples OpenSankey

Deux exemples, maintenus et testés. Chacun est une application React autonome qui
consomme le paquet npm public
[`@terriflux/opensankey`](https://www.npmjs.com/package/@terriflux/opensankey).

| Dossier | Ce qu'il montre |
| --- | --- |
| [`viewer/`](./viewer) | L'exemple canonique : deux modèles **embarqués** dans le bundle, sélecteur de diagramme et sélecteur de vue, et la documentation exhaustive des options du viewer. |
| [`cartofob/`](./cartofob) | Le cas grandeur nature : un diagramme **téléchargé** en gzip brut (646 Ko compressés, 7,7 Mo de JSON, 1608 flux), piloté par deux sélecteurs réactifs — data tag et étiquette de vue. Reprend la structure de [cartofob-sankey](https://github.com/IGNF/cartofob-sankey). |

## Lancer en ligne, sans rien installer

- [`viewer/` sur CodeSandbox](https://codesandbox.io/p/devbox/github/TerriFlux/opensankey/tree/main/examples/viewer)
- [`cartofob/` sur CodeSandbox](https://codesandbox.io/p/devbox/github/TerriFlux/opensankey/tree/main/examples/cartofob)

Il faut un **Devbox**, pas un Sandbox : le Sandbox résout les dépendances via son
propre CDN, qui ignore le `.npmrc` et échoue sur ce paquet.

## Lancer en local

```bash
cd examples/viewer     # ou examples/cartofob
npm install
npm start
```

Aucun jeton n'est nécessaire : le paquet est sur npmjs public. Le `.npmrc` du
dossier ne contient qu'un `legacy-peer-deps=true`, indispensable parce que
`react-scripts@5` déclare `typescript@^3 || ^4` en peer alors que l'exemple
compile en TypeScript 5 — sans lui, `npm install` échoue avant la compilation.

## Ce que `viewer/` montre

- l'intégration de `ViewerOpenSankeyApp` dans une application React ;
- un **sélecteur de diagramme** (deux modèles embarqués) et un **sélecteur de
  vue** : les vues sont écrites en clair dans le JSON (clé `views`, vue courante
  dans `current_view`), l'hôte construit donc sa liste lui-même et rouvre le
  fichier sur la vue choisie ;
- la documentation, dans `viewer/src/index.tsx`, de **toutes** les options de
  `ViewerOpenSankeyApp` — celles qui agissent dans le paquet MIT, celles que
  seul le viewer de l'application complète lit, et celles devenues sans effet.

## Ce que `cartofob/` montre en plus

- le **chargement par URL** d'un `.gz` servi brut (sans `Content-Encoding: gzip`),
  décompressé côté hôte par `DecompressionStream` — aucune dépendance ajoutée ;
- le fait que le paquet MIT **n'a pas de chargeur** : `diagram` / `diagrams_list`
  ne sont lues que par l'application complète, l'hôte fetch lui-même et passe le
  JSON en `initial_data` — dont il tire au passage ses listes déroulantes ;
- des sélections **réactives** (`data_tag_selection`, `view_tag_selection`) : le
  viewer les ré-applique en place, sans prop `key` ni relecture du fichier, ce qui
  sur un diagramme de cette taille se compte en secondes.

## Ce qui a été retiré, et pourquoi

Les dossiers versionnés (`1.0.7/`, `1.1.4/`, `1.1.7/`, `1.2.0/`, `current/`) ne
s'installaient plus : ils référençaient soit une version npm jamais publiée
(`open-sankey` s'arrête à 1.1.4, donc `1.1.7` et `1.2.0` renvoyaient un 404),
soit un bundle CDN qui n'est plus produit. Ils restent dans l'historique git.

L'exemple **html-viewer** (bundle CDN, zéro installation) est suspendu pour la
même raison : plus aucune version ne publie de bundle autonome depuis 1.1.4. Il
reviendra le jour où la chaîne de build en produira un de nouveau.

Il n'y a pas d'exemple **éditeur** : depuis le découpage viewer/éditeur,
l'édition vit dans `@terriflux/opensankey-editor`, sous licence AGPL-3.0, qui
n'est pas publié sur npmjs public.
