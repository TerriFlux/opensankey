# Exemple CARTOFOB — diagramme charge par URL, deux selecteurs

Le pendant « grandeur nature » de [`../viewer`](../viewer) : la ou celui-ci embarque
deux petits modeles dans son bundle, celui-ci **telecharge** son diagramme, et ce
diagramme est gros — 7,7 Mo de JSON, 194 noeuds, 1608 flux, 646 Ko une fois gzippe.

Il reprend la structure de l'application [cartofob-sankey](https://github.com/IGNF/cartofob-sankey)
(cartographie des flux de la filiere foret-bois, realisee par TerriFlux pour l'IGN),
a ceci pres qu'elle utilise le paquet complet `@terriflux/sankeyapplication` la ou cet
exemple n'utilise que le viewer MIT `@terriflux/opensankey`.

## Ce que ca montre

1. **Un `.gz` servi brut, decompresse par l'hote.** `public/CARTOFOB.json.gz` est servi
   tel quel, **sans en-tete `Content-Encoding: gzip`** — c'est aussi la regle sur
   open-sankey.fr. L'hote le decompresse lui-meme avec `DecompressionStream('gzip')`
   (natif : Chrome 80+, Safari 16.4+, Firefox 113+), donc **sans aucune dependance
   ajoutee**. Si le serveur declarait l'en-tete, le navigateur decompresserait de son
   cote, on lirait du JSON en clair et la decompression echouerait sur
   « incorrect header check ».
2. **Le paquet MIT n'a pas de chargeur.** `ViewerOpenSankeyApp` prend un JSON deja lu
   (`initial_data`) ; les options `diagram` / `diagrams_list` ne sont honorees que par
   l'application complete. On fait donc le fetch soi-meme — et le meme JSON alimente
   les deux listes deroulantes, qui restent ainsi synchrones avec la donnee.
3. **Les selections sont reactives, sans remontage.** `data_tag_selection` (Region) et
   `view_tag_selection` (Essence) sont re-appliquees **en place** par le viewer quand
   les props changent : pas de prop `key`, pas de relecture du fichier. Sur un
   diagramme de cette taille, l'ecart avec un remontage se compte en secondes.

Pour pointer un fichier distant plutot que local, remplacer `DIAGRAM_URL` par une URL
absolue ; le serveur doit alors autoriser le CORS (open-sankey.fr renvoie
`Access-Control-Allow-Origin: *` sur ses modeles).

## Etiquette de vue, et non vue

Le selecteur « Essence » passe une **etiquette de vue** (`view_tag_selection`), pas un
identifiant de vue. C'est la difference notable avec cartofob-sankey : la resolution
« la valeur designe une VUE, ouvre-la comme le selecteur de vue » appartient a
`@terriflux/sankeyapplication`. Dans le paquet MIT, la valeur est une etiquette, plus
le mot-cle `all` qui eteint le filtre du groupe (retour a l'agrege).

Ici les deux reviennent au meme : les 11 vues du fichier sont des vues « light »
engendrees depuis ce meme groupe d'etiquettes, donc filtrer sur l'etiquette produit
exactement le dessin de la vue correspondante. Un fichier dont les vues portent une
geometrie propre (vues « heavy ») demanderait, lui, le paquet complet — ou un
remontage sur `current_view`, comme le fait [`../viewer`](../viewer).

## Lancer

```bash
npm install
npm start        # http://localhost:3000
npm run build    # build/ pret a servir
```

`npm`, pas `pnpm` : ce dossier est volontairement hors du workspace pnpm du depot.
Aucun jeton n'est necessaire, `@terriflux/opensankey` est sur npmjs public. Le `.npmrc`
ne contient qu'un `legacy-peer-deps=true`, indispensable parce que `react-scripts@5`
declare `typescript@^3 || ^4` en peer alors que l'exemple compile en TypeScript 5.

## En ligne

**Il faut un Devbox, pas un Sandbox** — le Sandbox resout les dependances via son
propre CDN, qui ignore le `.npmrc` et echoue sur ce paquet.

[Ouvrir en Devbox](https://codesandbox.io/p/devbox/github/TerriFlux/opensankey/tree/main/examples/cartofob)

Le premier affichage demande de telecharger 646 Ko puis de parser 7,7 Mo de JSON :
comptez quelques secondes de plus que sur l'exemple `viewer`.

## Donnees

`public/CARTOFOB.json.gz` provient du projet CARTOFOB (IGN). Les valeurs sont des flux
de matiere de la filiere foret-bois par region et par essence, en Mm3.
