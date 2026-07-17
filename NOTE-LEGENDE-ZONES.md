# NOTE — Légende en zones de texte (fin de l'objet spécial)

Statut : DESIGN — aucune implémentation. Rédigé le 2026-07-16.

## 1. Vision

La légende n'est plus un objet spécial dessiné par un moteur dédié : c'est un
**cadre géométrique** (`Class_ContainerElement` avec `tied_to_nodes`) contenant
des **zones de texte** ordinaires, produit par un **générateur de légende**.

- Le générateur applique une mise en forme par défaut, pilotée par le menu
  config (panneau « Légende ») comme aujourd'hui.
- L'utilisateur peut **casser** cette mise en forme : désolidariser une zone du
  cadre, la déplacer, la restyler, la supprimer, en ajouter — ce sont des zones
  de texte comme les autres.

Décisions prises (2026-07-16) :

1. **Snapshot + Régénérer** : dès que l'utilisateur casse la légende, elle
   devient statique (les tags qui changent ensuite ne la mettent plus à jour).
   Le menu propose « Régénérer la légende », qui reconstruit tout depuis les
   paramètres en écrasant les modifications.
2. **Abandon du mode « fixe à l'écran »** (`stick_to_drawing=false`) : la
   légende vit dans le monde et zoome avec le dessin, cohérent avec la caméra
   sur monde immuable (OS#1250).
3. Note de design validée avant tout code.

## 2. État des lieux

### 2.1 La légende, objet spécial

`ClassTemplate_Legend` (Legend.tsx:43) hérite de `Class_NodeBase`, instance
unique portée par la DrawingArea (`_legend`, DrawingArea.tsx:249). Traitements
spéciaux qui disparaîtraient :

- **Hors data-join keyé** (OS#1246) : dessinée à part (`this._legend.draw()`,
  DrawingArea.tsx:824), dans son propre groupe `#grp_legend` créé **hors de
  `g_drawing`** pour permettre le mode non-zoomé (DrawingArea.tsx:880, 915-918).
- **Moteur de dessin dédié** (~800 lignes, Legend.tsx) : `drawLegendBg`,
  `drawDataTypeLabel`, `drawTagDisplayed`, `drawInfoDataType`,
  `drawInfoDashedLink`, `drawSankeyScale`, `drawInfoConstraintLink`, avec
  gestion manuelle de `_dx`/`_dy` et `updateDragZone` en rAF (Legend.tsx:729).
- **Drag propre** avec contre-scale `font_compensation` en police verrouillée
  (Legend.tsx:118, 220-225, issue #165).
- **Cas particuliers bbox/fit** : la légende est intégrée manuellement aux
  calculs d'enveloppe (NodeEventsHandler.tsx:254-271, DrawingArea.tsx:1506-1533)
  parce qu'elle vit hors du groupe d'éléments.
- **Persistance dédiée** : `LegendPersistence` (SankeyPersistence.tsx:958),
  sous-objet `json_object['legend']` (~17 clés).

Contenu calculé dans `drawTagDisplayed()` (Legend.tsx:289-425) : groupes
`node_taggs`/`flux_taggs`/`data_taggs` filtrés par `use_colors` puis par
présence d'au moins un élément **visible** portant le tag ; pastille
`tag.color` + libellé `tag.display_name` ; titre de groupe en gras ;
survol d'une entrée → surbrillance des éléments portant le tag
(Legend.tsx:335-369).

### 2.2 Les briques déjà disponibles

- **Zones de texte** : `Class_ContainerElement` (TextZone.tsx:7), registre
  `Sankey._containers`, création `addNewContainer` (Sankey.tsx:641), **déjà
  dans le data-join keyé** (`_drawContainersJoin`, Sankey.tsx:465-484), clé
  JSON `'labels'` (`ContainerPersistence`, SankeyPersistence.tsx:335).
- **Cadre géométrique** : mécanisme `tied_to_nodes` / `_attached_node` /
  `_attached_container` dans `Class_NodeBase` (NodeBase.tsx:89-93) —
  bidirectionnel, sérialisé (`attachedNodes`), avec drag entraînant
  (NodeBase.tsx:500-521), auto-grow en cascade (526-549), calcul d'enveloppe
  (919-954), rendu « frame » (NodeDrawShape.tsx:146-163), UI d'attache/détache
  (MenuElementsAppearance.tsx:2212-2321, NodeActions.tsx).
- **Précédent d'interpolation** : la zone-titre interpole des jetons
  `{NomDuGroupe}` à chaque dessin (`name_label_effective`, TextZone.tsx:42-71) —
  précédent utile pour l'échelle de la légende.

## 3. Modèle cible

### 3.1 Structure générée

```
cadre "legend"  (Class_ContainerElement, tied_to_nodes=true)
 ├─ zone titre de groupe (texte gras)            × par groupe de tags
 ├─ zone entrée  (forme = pastille couleur,      × par tag affiché
 │                label à droite = display_name)
 ├─ zone échelle (texte "N unité / px")           si display_legend_scale
 ├─ zone info données collectées/calculées        si legend_show_data_type
 ├─ zone info flux pointillés / intervalles       si applicable
 └─ zone contraintes (symbole + description)      si legend_show_constraints
```

- La pastille de couleur d'une entrée est la **forme** du conteneur (petit
  rect coloré), le libellé est le **label** positionné à droite — aucun
  nouveau type d'élément.
- Le fond/bordure de la légende = le rendu frame du cadre englobant
  (`legend_bg_*` → style du cadre).
- Ids réservés préfixés (`legend`, `legend-entry-<group>-<tag>`,
  `legend-scale`, …) pour que le générateur retrouve/écrase ses productions et
  que le menu config retrouve le cadre.

### 3.2 État « géré » vs « cassé »

Nouveau flag sur la DrawingArea (ou sur le cadre) : `legend_managed: boolean`.

- **Géré (défaut)** : tout changement pertinent (tags, couleurs, visibilité,
  paramètres du menu) → le générateur **détruit et reconstruit** les zones
  préfixées `legend-*`. L'utilisateur peut déplacer le cadre entier (drag
  entraînant standard) sans casser.
- **Cassure** : toute action qui modifie une zone enfant individuellement
  (désolidarisation, déplacement d'une zone seule, édition de texte/style,
  suppression) bascule `legend_managed=false`. La légende devient un snapshot
  statique : plus aucune régénération automatique.
- **« Régénérer la légende »** (bouton du menu) : repasse en géré et
  reconstruit tout, en écrasant les zones `legend-*` restantes (y compris
  désolidarisées).

Détection de la cassure : au plus simple, les points d'entrée existants
(détache dans `dettachNodeFromCont`, drag d'un enfant seul, setters de style
via le menu zones de texte) posent le flag quand l'élément a un id `legend-*`.

### 3.3 Ce que le survol devient

L'interaction survol-entrée → surbrillance des éléments taggés est conservée
en mode géré : chaque zone entrée garde une référence `(tag_group, tag)` posée
par le générateur (attribut runtime, non persisté). Après cassure elle
subsiste tant que la zone existe, sans garantie si le tag est supprimé
(dégradation acceptée : le survol ne fait alors rien).

## 4. Menu config (lien conservé)

Le panneau « Légende » (SankeyMenuConfigurationLayout.tsx:650-952) est
conservé mais pilote désormais **les paramètres du générateur**, stockés sur
la DrawingArea (plus sur un objet légende) :

| Paramètre actuel | Devenir |
|---|---|
| `masked` | conservé : masque/supprime les zones générées |
| `legend_police` | paramètre générateur (taille des labels générés) |
| `legend_bg_border/color/opacity` | style du cadre englobant |
| `legend_horizontal` | paramètre de layout du générateur |
| `display_legend_scale`, `scale_legend_unit/ratio` | zone échelle on/off + contenu |
| `legend_show_dataTags`, `legend_show_constraints`, `legend_show_data_type`, `info_link_value_void` | zones optionnelles on/off |
| `legend_width` | largeur d'enveloppement du texte des zones générées |
| `stick_to_drawing` | **supprimé** (décision 2) |

Comportement du panneau selon l'état :

- **Géré** : chaque changement régénère (comportement identique à
  aujourd'hui du point de vue utilisateur).
- **Cassé** : le panneau affiche un bandeau « Légende personnalisée — les
  paramètres ne s'appliquent plus » + bouton **Régénérer** (avec confirmation,
  car destructif pour les modifs).

## 5. Persistance et migration

Conformément à la règle « nouvelle variable persistée → bump
SankeyPersistence + fromJSON_X_YY » :

- **Nouveau format** : les zones de légende sont des conteneurs ordinaires
  dans `'labels'` (rien de spécial) ; les paramètres du générateur +
  `legend_managed` remplacent le sous-objet `legend` (mêmes clés reprises
  autant que possible pour limiter la migration).
- **Migration des anciens fichiers** : `fromJSON` lit l'ancien sous-objet
  `legend` (LegendPersistence), en extrait les paramètres, pose
  `legend_managed=true` et laisse le générateur reconstruire au premier
  dessin. `legend_dx/dy` → position du cadre. `legend_stick_to_drawing` est
  ignoré (mode supprimé) : une légende anciennement fixe à l'écran est
  replacée dans le monde près du coin haut-gauche de la vue courante.
- `LegendPersistence` reste en lecture seule (migration), plus jamais en
  écriture.
- Filet : les goldens de SA#246 doivent passer (une légende ancienne doit
  produire un rendu équivalent après migration + régénération).

## 6. Ce qu'on gagne / ce qu'on perd

Gains :

- Suppression du dernier objet spécial du pipeline : la légende entre dans le
  data-join keyé (fin de l'exception OS#1246), plus de `#grp_legend` hors
  `g_drawing`, plus de cas particuliers bbox/fit ni de `font_compensation`
  dédiée.
- ~800 lignes de moteur de dessin dédié remplacées par un générateur qui
  produit des éléments standard.
- Toute la mise en forme devient éditable par l'utilisateur (demande d'origine).

Pertes assumées :

- **Mode fixe à l'écran** (décision 2). Si le besoin revient, il se traitera
  comme une capacité générique des conteneurs, pas comme un cas légende.
- Mise à jour automatique après cassure (décision 1 : snapshot + Régénérer).
- Le rendu généré peut différer marginalement du rendu actuel (espacements) —
  à valider visuellement sur les exemples.

## 7. Plan de mise en œuvre (phases)

1. **Générateur pur + paramètres** : module `LegendGenerator` (création/
   destruction des zones `legend-*` depuis l'état du Sankey + paramètres),
   testable unitairement sans DOM (liste des zones attendues pour un jeu de
   tags donné).
2. **Branchement** : régénération sur les événements pertinents en mode géré ;
   détection de cassure ; survol → surbrillance.
3. **Menu config** : re-câblage du panneau sur les paramètres + bandeau/bouton
   Régénérer.
4. **Persistance** : bump + migration `legend` → conteneurs + paramètres ;
   goldens.
5. **Démontage** : suppression de `ClassTemplate_Legend`, `#grp_legend`, cas
   particuliers bbox/fit, écriture `LegendPersistence`.

## 8. Questions ouvertes

- Où poser les paramètres du générateur : DrawingArea (comme `_legend`
  aujourd'hui) ou objet dédié léger ? (proposition : DrawingArea, champ
  `legend_config`).
- Le tableau des contraintes (`drawInfoConstraintLink`, symboles alignés) se
  transpose-t-il bien en zones de texte, ou faut-il une zone unique
  multi-lignes ?
- Vues OSP (`heredited_attr`) : la légende actuelle est par-DrawingArea et les
  vues remplacent l'instance de DrawingArea — vérifier ce que deviennent les
  zones `legend-*` et le flag `legend_managed` par vue.
- Comportement de `masked` après cassure : masquer quoi (le cadre seul ou
  toutes les zones ex-légende, y compris désolidarisées) ?
