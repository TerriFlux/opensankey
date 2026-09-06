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

## Filtrer une vue, ou en ouvrir une : deux props, deux choses

Le selecteur « Essence » melange trois familles, et elles ne se pilotent pas pareil.

| choix | prop utilisee | effet |
|---|---|---|
| « Agregees » (le nom vient du fichier) | `view_tag_selection` = `all` | eteint le filtre : on voit la vue **maitre** |
| une essence (Hetre, Douglas…) | `view_tag_selection` = l'etiquette | **filtre** la vue courante par cette etiquette |
| « Toutes essences » | `view` = l'identifiant de la vue | **ouvre** une vue autonome |

La distinction n'est pas cosmetique. `view_tag_selection` filtre la vue **courante** ;
`view` (sa#397, id **ou** nom) en **ouvre** une autre. Les 11 vues d'essence sont des
vues « light » engendrees depuis le meme groupe d'etiquettes : filtrer sur l'etiquette
donne exactement le meme dessin qu'ouvrir la vue. Mais « Toutes essences » est une vue
**autonome**, avec sa geometrie propre — les onze essences cote a cote — qu'aucun filtre
ne reconstitue. Confondre les deux fait afficher une vue en croyant en afficher une autre.

Les deux props sont **reactives** : le viewer les reapplique en place, sans remontage.

Le selecteur ne code aucun identifiant en dur. Une vue est reputee autonome quand
`generated_from_group_id` lui manque, et son nom se lit soit a plat, soit dans le delta
de vue (`__patch.name.$set`, encodage arrive avec `format_version: 3`). Une vue autonome
ajoutee au classeur apparaitra donc d'elle-meme.

Le troisieme selecteur pilote `position_mode` : echelle adaptee a la selection courante,
ou absolue — auquel cas les regions se comparent entre elles.

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

### Essayer un changement de la bibliotheque, sans publier

```bash
OS_LOCAL=1 npm start        # rechargement a chaud sur les sources du depot
OS_LOCAL=1 npm run build    # build de verification
```

Par defaut l'exemple consomme le paquet **publie** — c'est ce qui garantit qu'il
s'installe sans jeton, chez un integrateur comme sur CodeSandbox. Le revers etait la
boucle d'essai : pour voir l'effet d'une modification de la bibliotheque, il fallait la
faire fusionner, publier une version, jouer le miroir, puis attendre CodeSandbox.

`OS_LOCAL=1` reroute `@terriflux/opensankey/src` vers `opensankey/client/src` et ajoute
ces fichiers au perimetre de transpilation — sans quoi les `.tsx` de la bibliotheque
arrivent bruts au bundler, CRA ne compilant que le `src/` de l'application.

Le drapeau est **inerte par defaut** : ni CodeSandbox ni la CI ne le posent. Il n'a de
sens que dans le monorepo ; dans une copie isolee de l'exemple, la configuration s'arrete
avec un message explicite plutot que de compiler autre chose que ce qu'on croit.

## En ligne

**Il faut un Devbox, pas un Sandbox** — le Sandbox resout les dependances via son
propre CDN, qui ignore le `.npmrc` et echoue sur ce paquet.

[Ouvrir en Devbox](https://codesandbox.io/p/devbox/github/TerriFlux/opensankey/tree/main/examples/cartofob)

Le premier affichage demande de telecharger 646 Ko puis de parser 7,7 Mo de JSON :
comptez quelques secondes de plus que sur l'exemple `viewer`.

## Donnees

`public/CARTOFOB.json.gz` provient du projet CARTOFOB (IGN). Les valeurs sont des flux
de matiere de la filiere foret-bois par region et par essence, en Mm3.
