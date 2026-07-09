# Note de conception — la notion de thème

Statut : rédigée le 2026-07-09 en conception pure. **Étapes 1 à 5 codées le même jour**, avec une
correction de fond : le point d'insertion recommandé (voie (b)) était inatteignable, remplacé par
la voie (c) ci-dessous. Restent l'étape 6 (`stan`, `esankey`) et la disparition des dicts 0.9
`style_node` / `style_link` au profit du seul patch `theme.styles`.

Code : `types/Theme.ts`, `types/ThemeRegistry.ts`, `Class_Sankey.applyTheme` / `themeNodeColor`,
`Node.getShapeColorToUse`, `Persistence/sankeymaticParser.ts`, sélecteur dans
`components/configmenus/SankeyMenuConfigurationLayout.tsx`.

## Contexte pour qui reprend ce dossier

Dépôt : `sankeyapplication`, monorepo. Tous les chemins de cette note sont relatifs à la racine
du dépôt, et le code concerné est presque entièrement dans
`packages/opensankey/opensankey/client/src/`.

Deux fichiers cités ici — `Persistence/sankeymaticThemes.ts` et `Persistence/sankeymaticLayout.ts` —
étaient **non commités** au moment de la rédaction (import SankeyMATIC en cours de travail).
Vérifier leur état avant de s'appuyer dessus.

Tous les `fichier:ligne` sont des **instantanés** du 2026-07-09 : les relire avant d'agir.

Conventions du projet qui s'appliquent à ce chantier : ne jamais bumper la version sans demande
explicite ; toute variable nouvellement persistée impose un bump de `SankeyPersistence` **et** un
`fromJSON_X_YY` ; vérifier lint et tests unitaires avant de pousser. Cf. `CLAUDE.md`.

## Le problème

OpenSankey sait déjà produire l'apparence de SankeyMATIC : c'est ce que fait
[`sankeymaticParser.ts`](packages/opensankey/opensankey/client/src/Persistence/sankeymaticParser.ts)
à l'import. Mais cette apparence n'est **pas un objet** : elle est fabriquée à la volée
par `defaultNodeStyle(setting)` / `defaultLinkStyle(setting)`, versée dans le JSON de sortie
(`sankeymaticParser.ts:713-719`), et perdue comme identité. On ne peut ni la nommer,
ni la réappliquer, ni en changer.

L'objectif est de faire de cette apparence une entité de premier ordre — un **thème** —
et d'en avoir quatre : `opensankey`, `sankeymatic`, `stan`, `esankey`.

Valeur : « importez votre STAN, il ressemble encore à du STAN » supprime la friction de
migration ; « un clic pour le passer en thème e!Sankey » démontre en une seconde qu'on est
le sur-ensemble des trois. Cf. [stratégie de déplacement de niche](ARCHITECTURE.md).

## Ce qui existe déjà

Beaucoup plus qu'il n'y paraît. L'inventaire honnête :

**La collection de styles.** `Class_Sankey._styles` (`types/Sankey.tsx:114`) est déjà une
bibliothèque de styles par diagramme, avec un style `default` parent, un CRUD complet
(`Sankey.tsx:682-834`) et une sérialisation propre (`StylePersistence.toJSON`,
`Persistence/SankeyPersistence.tsx:1264`).

**La cascade de résolution.** `Class_ProtoElement.getElementProperty` (`Elements/Element.tsx:444-449`)
puis `getStyleProperty` (`:437-443`) : override local de l'instance, puis le dernier style de
la chaîne qui définit l'attribut, puis le défaut usine de `ALL_ATTRIBUTES_CONFIG`.

**Les règles de palette — déjà là, sous un autre nom.** C'est la découverte importante.
- Les flux ont `shape_color_rule` (`Elements/ElementsAttributesConfig.tsx:3140`), qui vaut
  `flow | source | target | gradient | auto`. C'est *exactement* le `flow_inheritfrom` de
  SankeyMATIC, déjà implémenté et persisté. `Link.getShapeColorToUse()` (`Elements/Link.tsx:618`)
  l'applique.
- Les nœuds ont une règle implicite dans `Node.getShapeColorToUse()` (`Elements/Node.tsx:192`) :
  si `shape_color_sustainable` est faux, la couleur vient de la colormap du premier groupe de
  tags actif ; sinon de `shape_color`.

**Les presets d'éléments.** `elementStyleConfigs` (`Elements/ElementStyle.tsx:66`) et les
groupes `base_styles` / `structural_styles` (`:405-422`).

Ce qui **manque** se réduit donc à trois choses :

1. Une règle de nœud « dériver d'une palette indexée par le nom » (le `node theme a|b|c|d`
   de SankeyMATIC, porté par `makeNodeColorPicker`, `Persistence/sankeymaticThemes.ts:58`).
2. Un objet qui regroupe palette + règles + patch de styles + patch de globaux, et qui porte
   un nom.
3. Un maillon « thème » dans la cascade de résolution.

## Qu'est-ce qu'une « règle de palette »

Le terme est employé partout dans cette note ; il désigne un concept précis, et c'est le seul
qui soit vraiment neuf.

Une palette, c'est une liste de couleurs. Mais une liste de couleurs ne suffit jamais à colorer
un diagramme : il faut aussi dire **quelle couleur va sur quel élément**. Cette fonction de
correspondance, c'est la règle. Formellement, elle prend un élément et rend une couleur, ou bien
rend « je ne me prononce pas » et laisse la cascade de résolution continuer sans elle.

Les quatre logiciels visés se distinguent autant par leur règle que par leur palette :

- **SankeyMATIC** dit : « la clé, c'est le premier mot du nom du nœud ; j'attribue les teintes
  dans l'ordre où on me les demande, puis je recycle ». D'où le fait, contre-intuitif mais
  volontaire, que « Player 1 » et « Player 1: » partagent leur couleur. Pour les flux : « hérite
  de la source », ou de la cible, ou du plus extérieur des deux (`outside-in`).
- **STAN** dit, en substance : « pas de palette ». Tout est gris ; la couleur, quand il y en a,
  est posée à la main parce qu'elle porte un sens métier.
- **e!Sankey** dit : « colore par produit » — donc par une propriété du modèle, pas par le nom.

Trois règles différentes appliquées à trois palettes différentes. **Changer l'une sans l'autre ne
donne aucun des trois rendus** : c'est la raison pour laquelle le thème doit embarquer le couple,
et non une simple liste de couleurs.

La bonne nouvelle, développée ci-dessus : OpenSankey implémente déjà deux règles
(`shape_color_rule` pour les flux, la colormap des tags pour les nœuds), il ne les nomme
simplement pas ainsi. Il n'en manque **qu'une seule**, `by-name-first-word`.

## Modèle de données

```ts
interface Type_Theme {
  id: 'opensankey' | 'sankeymatic' | 'stan' | 'esankey' | string
  name: string                       // libellé i18n

  /** Patch appliqué sur sankey.styles_dict. Même format que StylePersistence.toJSON. */
  styles: { [style_id: string]: Partial<StyleJSON> }

  /** Patch appliqué sur la DrawingArea : fond, grille, format papier. */
  globals: {
    couleur_fond_sankey?: string
    grid_visible?: boolean
    grid_color?: string
    // paper_format volontairement exclu — voir « Portée » ci-dessous.
  }

  /** La palette et sa règle d'affectation. */
  palette: {
    colors: readonly string[]        // [] pour STAN (pas de palette)
    offset: number                   // rotation, cf. themeoffset de SankeyMATIC
    node_rule: 'none' | 'by-name-first-word' | 'by-tag'
    link_rule: 'flow' | 'source' | 'target' | 'gradient' | 'auto'
  }
}
```

`node_rule` est le seul vocabulaire neuf. `link_rule` réutilise tel quel le type de
`shape_color_rule`, ce qui garantit qu'un thème ne peut pas demander aux flux quelque chose
que le moteur ne sait pas déjà faire.

`by-name-first-word` encapsule la sémantique de `makeNodeColorPicker` : clé = premier mot du
nom du nœud (sensible à la casse), teintes distribuées dans l'ordre de première demande, puis
cyclage. C'est pour ça que « Player 1 » et « Player 1: » partagent leur couleur — comportement
volontairement conservé pour la fidélité d'import.

## Portée : la frontière exacte

La bonne frontière n'est pas « apparence contre géométrie » — elle est mécanique et
vérifiable : **un thème peut poser tout attribut déclaré sur `Class_ElementStyle`
(`Elements/Element.tsx:1042-1254`), et rien d'autre.**

Ce critère répond directement aux deux cas soulevés, et la réponse est oui dans les deux :

- **Flux droits de STAN** : `shape_must_stay_straight`, `shape_straight_mode`,
  `shape_straight_offset`, `shape_straight_include_children` sont sur `Class_ElementStyle`
  (`Element.tsx:1196-1199`). Un thème `stan` pose `shape_must_stay_straight: true` dans son
  patch `LinkStyle`. Rien à construire.
- **Fond de label en ellipse** : `name_label_background_type` et `value_label_background_type`
  y sont aussi (`Element.tsx:1101` / `:1146`), et `DrawLabel` sait déjà rendre
  `'ellipse' | 'rect' | path` avec `border_radius` (`Elements/DrawLabel.tsx:273-297`).

Autrement dit, l'immense majorité de ce qui fait l'identité visuelle des quatre logiciels est
**déjà exprimable** dans le patch `styles` du thème. C'est ce qui rend le chantier raisonnable.

Ce qu'un thème **ne** fait **pas** : les coordonnées des nœuds. `node.x` / `node.y`, la largeur
de nœud, l'espacement, la justification des extrémités, le format papier — un utilisateur qui a
placé ses nœuds à la main ne doit pas les voir bouger en changeant de thème. Un changement de
thème doit être **non destructif et réversible**. La fidélité d'import du placement reste la
responsabilité de `sankeymaticLayout.ts`, appelé une fois à l'import, jamais par un thème.

Conséquence assumée : appliquer `sankeymatic` sur un diagramme existant lui donne les couleurs
et les styles de SankeyMATIC, pas son placement.

*Réserve à lever* : `shape_must_stay_straight` est le seul attribut de style qui a un effet de
bord géométrique (il contraint les ancrages du flux, cf. `straight_mode` aligné sur source ou
cible). Vérifier qu'il déplace bien les ancrages et non les nœuds avant de l'inclure dans le
thème `stan` — sinon il retombe du mauvais côté de la frontière.

## Point d'insertion dans la cascade

Le thème s'insère **entre le style `default` et le défaut usine** :

```
_storage local de l'élément          (choix explicite de l'utilisateur)
  > dernier style de la chaîne portant l'attribut
  > … > style 'default'
  > THÈME                            ← nouveau maillon
  > défaut usine (ALL_ATTRIBUTES_CONFIG[k].default)
```

Cette position est le cœur de la conception, et elle découle d'une seule exigence : **un choix
de l'utilisateur doit toujours battre le thème.** Si le thème était au-dessus du storage local,
changer de thème écraserait le travail de l'utilisateur ; s'il était sous le défaut usine, il
ne servirait à rien.

Deux voies d'implémentation étaient envisagées :

- **(a) Thème = un `Class_ElementStyle` synthétique** inséré en `_style[0]`, avant le `default`.
  Coût quasi nul : la cascade fonctionne déjà. Mais le style `default` est aujourd'hui
  pré-rempli avec *tous* les défauts usine à la construction (`Element.tsx:1279-1283`), donc il
  masquerait systématiquement le thème. Il faudrait cesser de pré-remplir, ce qui touche
  `isAttributeOverloaded` et `StylePersistence.toJSON` (`:1264-1285`). Risque de régression sur
  la persistance.
- **(b) Thème = source de défauts, consulté par `getStyleProperty`.** On modifie le seul point
  de repli (`Element.tsx:437-443`) pour interroger `sankey.theme` avant `_config[k].default`.

> **Correction du 2026-07-09 (vérifiée sur le code) : (a) et (b) sont mortes toutes les deux,
> pour la même raison.** Le pré-remplissage de `Element.tsx:1279-1283` s'applique à tout style
> `!is_deletable`, ce qui inclut `default`, `NodeStyle`, `LinkStyle`. Donc `getStyleWithAttr(k)`
> trouve **toujours** `k`, `getStyleProperty` ne retombe **jamais** sur `_config[k].default`, et
> le maillon de la voie (b) n'est jamais atteint. La voie (b) n'était pas « plus chirurgicale » :
> elle exigeait exactement la même dé-pré-remplissage que la voie (a).

**(c) Thème = le contenu des styles de base + une règle de palette. Retenu.**

Appliquer un thème, c'est ramener `NodeStyle` et `LinkStyle` à leur **amorce**, y écrire le patch
du thème, poser ses globaux sur la `DrawingArea`, et enregistrer sa palette sur le `Sankey`. Aucune
modification de la cascade de résolution.

> **Correction du 2026-07-09 (constatée à l'écran).** La valeur de repli n'est pas le vide, ni les
> défauts usine : c'est l'**amorce** de `elementStyleConfigs` (`Sankey.create_internal_style`).
> Vider `LinkStyle` ne restitue pas l'apparence OpenSankey. Cas d'espèce :
> `value_label_is_visible` vaut `false` en défaut usine (`createLabelConfig` :
> `prefix === 'name_label' ? true : false`) et les valeurs de flux ne s'affichent que parce que
> `elementStyleConfigs[LinkStyle]` le remet à `true`. Une bascule `sankeymatic → opensankey` qui
> vidait les styles faisait donc disparaître les valeurs de flux. `applyTheme` repart de l'amorce.
>
> Cela confirme au passage le diagnostic de la section « opensankey mérite d'exister » : l'identité
> visuelle d'OpenSankey vit aujourd'hui dans `elementStyleConfigs`, et le thème `opensankey` restera
> un patch vide tant que cette amorce ne sera pas migrée dans le thème lui-même.

Cette voie tient l'exigence « un choix de l'utilisateur bat le thème » là où elle est
*observable* : un override posé sur un **élément** (`element._storage`) bat les styles, donc bat
le thème. Un « choix de l'utilisateur » posé sur le style `default` lui-même est, lui,
indiscernable d'un défaut usine — les deux vivent dans le même `_storage` pré-rempli — donc
aucune conception ne peut le préserver. Changer de thème change les défauts : c'est le
comportement attendu, pas une perte.

Deux dividendes inattendus :

- **Le snapshot de l'étape 4 est presque gratuit.** `StylePersistence.toJSON`
  (`SankeyPersistence.tsx:1264-1285`) ne persiste du style `default` que ce qui diffère du défaut
  usine, et l'intégralité du storage explicite des autres. Un thème écrit dans les styles de base
  est donc déjà sérialisé par le format actuel. Ne reste à persister que `theme_id` et la palette.
- **La règle de flux existe déjà et est vivante.** `shape_color_rule == 'source'` renvoie
  `this.source.getShapeColorToUse()` (`Elements/Link.tsx:694-699`). Le thème n'a qu'à poser
  `shape_color_rule` dans son patch `LinkStyle`.

*Piège à connaître* : cette règle est évaluée **avant** `shape_color`. Un flux portant une couleur
explicite (le `#606` de `Budget [160] Other Necessities #606`) est donc ignoré sous la règle
`source`. Il faut lui poser `shape_color_rule: 'flow'` en local, en plus de sa couleur.

*Limite assumée* : `outside-in` (le défaut de SankeyMATIC) n'a pas d'équivalent dans
`shape_color_rule` et dépend des étages, que le modèle ne stocke pas. Le parseur continue donc de
le cuire en couleurs de flux locales (+ `shape_color_rule: 'flow'`). C'est défendable : contrairement
à `source`, `outside-in` est une fonction du *placement à l'import*, pas une règle vivante.

Pour la couleur de nœud spécifiquement, la règle de palette ne peut de toute façon pas passer par
les styles (elle dépend du nom du nœud, pas seulement de l'attribut). Elle s'insère dans
`Node.getShapeColorToUse()` (`Elements/Node.tsx:192`), en dernier recours avant `shape_color` :

```
shape_color_sustainable        →  shape_color
sinon colormap des tags        →  couleur du tag              (= node_rule 'by-tag')
sinon couleur posée sur le nœud →  shape_color                (element._storage, choix explicite)
sinon règle du thème           →  palette[premier mot du nom]  ← nouveau
sinon                          →  shape_color  (style, puis défaut usine #a9a9a9)
```

Le test « couleur posée sur le nœud » interroge `element._storage['shape_color']`, **pas** la
chaîne de styles : celle-ci définit toujours `shape_color` (pré-remplissage), donc la consulter
rendrait la règle inatteignable. Conséquence : sous un thème à palette, la teinte dérivée bat le
`shape_color` du style mais perd contre une couleur posée sur le nœud. C'est exactement la
sémantique voulue — et elle est inoffensive pour le thème `opensankey`, dont `node_rule` vaut
`by-tag` et qui n'a donc pas de palette par nom.

Le picker doit être **mémoïsé par diagramme** (l'ordre d'attribution des teintes dépend de
l'ordre des demandes) et **invalidé** au changement de thème, à l'ajout/suppression de nœud, et
au renommage. C'est le principal piège d'implémentation : un picker à état, appelé depuis une
fonction de rendu qui peut tourner des milliers de fois par frame.

## Le verrou : les couleurs cuites à l'import

`sankeymaticParser.ts:677` fait :

```ts
node.local.color = declared ?? pickNodeColor(node.name)
```

Autrement dit, il écrit la couleur dérivée du thème dans le **storage local**, c'est-à-dire au
niveau de priorité le plus élevé de la cascade. Trois conséquences, toutes mauvaises :

1. Un diagramme importé a des couleurs qui écrasent tout thème appliqué ensuite. Basculer sur
   `stan` ne changerait rien aux nœuds.
2. On ne peut plus distinguer une couleur *choisie par l'utilisateur* d'une couleur *dérivée du
   thème* : les deux sont dans `_storage`, indiscernables.
3. Le round-trip JSON grossit inutilement (une couleur par nœud, toutes dérivables).

Le correctif est net et c'est le vrai contenu du chantier : **seules les couleurs explicitement
déclarées dans la source descendent dans `node.local`** ; les autres sont laissées vides et
calculées à la volée par la règle du thème. Le parser conserve donc `declared`, et jette
`pickNodeColor` — qui remonte dans le thème.

Même raisonnement pour les flux : `flow_inheritfrom` doit devenir `theme.palette.link_rule`
plutôt qu'une couleur écrite dans `link.local.color` (`sankeymaticParser.ts:690-707`). Les
peintures explicites `<<` / `>>` restent locales, elles.

## Table de correspondance des quatre thèmes

| | `opensankey` | `sankeymatic` | `stan` | `esankey` |
|---|---|---|---|---|
| palette | tags | `schemeCategory10` (a–d) | ∅ | par produit |
| `node_rule` | `by-tag` | `by-name-first-word` | `none` | `by-tag` |
| `link_rule` | `source` | `source` (défaut SM) | `source` | `gradient` |
| fond | `#f2f2f2` | `#ffffff` (`bg_color`) | blanc + grille | blanc |
| nœud | rectangle | rectangle plein | rectangle bordé | rectangle + flèche |
| flux | courbe | courbe, opacité 0.45 | **droit** | flèche terminale |
| fond de label | aucun | aucun | **ellipse** | rect arrondi |

Traduction en attributs de style, pour montrer qu'aucun n'est neuf :

| trait | attribut | style patché |
|---|---|---|
| flux droits (STAN) | `shape_must_stay_straight: true` | `LinkStyle` |
| label ellipse (STAN) | `name_label_background_type: 'ellipse'` + `…_visible: true` | `NodeStyle` |
| flèche terminale (e!Sankey) | `shape_is_arrow: true` | `LinkStyle` |
| dégradé (e!Sankey) | `shape_color_rule: 'gradient'` | `LinkStyle` |
| opacité 0.45 (SankeyMATIC) | `shape_opacity` | `LinkStyle` |

Les valeurs `stan` et `esankey` sont à confirmer sur pièce — je ne les ai pas vérifiées contre
les logiciels, contrairement à `sankeymatic` qui est porté depuis la source. La colonne `stan`
reflète l'observation de l'utilisateur (flux droits, fond de label elliptique), pas une capture
de référence.

`opensankey` mérite d'exister ne serait-ce que pour lui-même : son identité visuelle est
aujourd'hui éparpillée entre `elementStyleConfigs` et des constantes libres
(`default_element_color = '#a9a9a9'`, `default_background_color = '#f2f2f2'`,
`default_font = 'Arial,sans-serif'`, `Elements/ElementsAttributesConfig.tsx:68-72`). La nommer,
c'est pouvoir la modifier sans chirurgie.

## Persistance

`sankey.theme_id: string` + le thème résolu. Deux options :

- **Référence seule** (`theme_id: 'stan'`). Fichier léger, mais un diagramme ouvert dans une
  version future où le thème a changé ne se ressemble plus.
- **Référence + snapshot** du thème dans le JSON. Fichier auto-portant, apparence stable dans le
  temps, au prix de quelques Ko.

Recommandation : **snapshot**, parce que le format de fichier d'OpenSankey est aussi un format
d'archive et qu'un diagramme publié ne doit jamais changer d'aspect tout seul. Cf. le
raisonnement identique qui a conduit à figer les bundles des diagrammes publiés.

Cela introduit une variable persistée nouvelle : **bump de `SankeyPersistence` obligatoire**, avec
son `fromJSON_X_YY` (convention du projet). La migration des fichiers existants est triviale et
sans perte : absence de `theme_id` → `opensankey`, et les couleurs déjà cuites dans `node.local`
restent cuites, donc l'apparence est strictement conservée. Les anciens fichiers ne bénéficient
pas de la commutabilité, mais ne régressent pas.

## Découpage proposé

1. **`Class_Theme` + thème `opensankey`.** Extraction des constantes existantes, aucun changement
   d'apparence. Le test de non-régression est visuel et doit être exactement nul.
2. **Maillon dans la cascade** (voie (b)) + `node_rule` dans `getShapeColorToUse`. Toujours aucun
   changement d'apparence tant que `opensankey` est le seul thème.
3. **Thème `sankeymatic`** extrait du parser, et **dé-cuisson des couleurs** à l'import. Premier
   moment où quelque chose de visible se produit ; les tests d'import SankeyMATIC existants
   (`sankeymaticParser.test.ts`) sont le filet.
4. **Persistance** : `theme_id` + snapshot, bump, `fromJSON_X_YY`.
5. **UI** : sélecteur de thème. Le point délicat est de dire à l'utilisateur ce qu'un changement
   de thème va écraser — c'est-à-dire rien, si les étapes 2 et 3 sont correctes.
6. **`stan` et `esankey`**, une fois les valeurs vérifiées sur pièce.

Les étapes 1 et 2 sont à apparence constante, donc mergeable sans risque et vérifiables
mécaniquement. La 3 est celle qui porte le risque.

## Questions ouvertes

- **Thème et vues (OS+).** Une vue peut-elle surcharger le thème du diagramme parent ? Le
  mécanisme `heredited_attr` (`packages/opensankey-plus/client/src/types/hereditedAttrMigration.ts`)
  est attribut-par-attribut ; un thème est un bloc. Les deux ne composent pas naturellement.
  À creuser avant l'étape 4, parce que ça peut changer le format persisté.
- **Le style unitaire** force `shape_color_sustainable = true` pour ignorer la colormap des tags
  (`Elements/ElementStyle.tsx:265-276`). Il ignorera donc aussi la règle du thème, ce qui est
  probablement le comportement voulu — à confirmer.
- **Coût du picker mémoïsé** dans le chemin de rendu. À mesurer sur un gros diagramme avant de
  s'engager sur la voie (b).
