# Exemples OpenSankey

Un seul exemple, maintenu et testé : [`viewer/`](./viewer) — une application React
autonome qui consomme le paquet npm public
[`@terriflux/opensankey`](https://www.npmjs.com/package/@terriflux/opensankey).

## Lancer en ligne, sans rien installer

[Ouvrir sur CodeSandbox](https://codesandbox.io/p/devbox/github/TerriFlux/opensankey/tree/main/examples/viewer)

## Lancer en local

```bash
cd examples/viewer
npm install
npm start
```

Aucun jeton n'est nécessaire : le paquet est sur npmjs public. Le `.npmrc` du
dossier ne contient qu'un `legacy-peer-deps=true`, indispensable parce que
`react-scripts@5` déclare `typescript@^3 || ^4` en peer alors que l'exemple
compile en TypeScript 5 — sans lui, `npm install` échoue avant la compilation.

## Ce que l'exemple montre

- l'intégration de `ViewerOpenSankeyApp` dans une application React ;
- le chargement d'un diagramme distant servi en gzip brut (sans en-tête
  `Content-Encoding`), décompressé à la volée ;
- un diagramme **multi-vues** : chaque entrée de la clé `views` est un JSON
  autonome, et le sélecteur remonte un viewer neuf par vue.

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
