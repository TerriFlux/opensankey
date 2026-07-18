# Note de design — Groupes façon PowerPoint (unification du « cadre géométrique »)

Statut : design validé sur le principe, non implémenté. Rédigée le 2026-07-17.

## Constat

Le concept de « groupe d'éléments » existe aujourd'hui sous plusieurs formes partiellement
redondantes, chacune avec sa propre UI :

- **ZDT liée aux nœuds** : `tied_to_nodes` + `attached_node` sur la zone de texte
  (section « Cadre géométrique » de l'inspecteur, `MenuElementsAppearance.tsx` ~l.2392).
- **Nœud englobant** : même mécanique `attached_node`/`attached_container` portée par un
  nœud (`NodeActions.setTiedFrame`, section « Cadre géométrique » ~l.2466 — d'où les
  DEUX sections identiques visibles dans l'inspecteur quand la sélection s'y prête).
- **Englobement par dimension** : le parent d'une dimension englobe ses enfants
  (NodeContainerStyle, modes d'englobement des flux, surcharge par flux OS#1240).
- **Blocs de légende** (OS#1254) : groupes de zones de texte générés, avec sélection
  remontante Alt+clic.

Résultat : deux interfaces pour le même concept, et pas de geste générique
« grouper / dissocier ».

## Concept cible

Un **groupe** est un objet de premier rang, au sens PowerPoint :

- liste de membres arbitraire et hétérogène (nœuds, zones de texte, à terme images,
  blocs de légende…) ;
- cadre d'enveloppe avec l'UI standard (sélection, déplacement d'ensemble, dissocier) ;
- **imbriquable** : un groupe peut contenir des groupes (décision actée).

### Décision structurante : géométrie ≠ données

Le groupe est **purement géométrique**. La sémantique de données reste sur la dimension :

- agrégation parent/enfants, modes d'englobement des flux (in/out, masquage),
  surcharge par flux (OS#1240) → **inchangés, portés par la dimension** ;
- le groupe ne pilote que : enveloppe, déplacement d'ensemble, appartenance visuelle.

Conséquence : un ZDT membre d'un groupe n'a aucun effet sur les flux — c'est cohérent.
Si le groupe diverge de la dimension (membres ajoutés/retirés), les flux continuent de
suivre la dimension.

### Initialisation par le modèle, puis liberté

- L'activation d'un englobement (ou une action explicite « Créer les groupes depuis la
  dimension X ») **initialise** des groupes à partir de la hiérarchie de la dimension —
  une dimension multi-niveaux produit naturellement des groupes imbriqués.
- Ensuite le groupe vit sa vie : on ajoute un ZDT, on retire un nœud, on regroupe
  autrement. Le modèle n'est plus propriétaire.
- **Divergence assumée** : un changement de niveau d'agrégation / dataTag / vue ne
  reconstruit PAS les groupes. Action manuelle « Réinitialiser depuis la dimension »
  disponible.

## Grammaire d'interaction (standard PowerPoint)

| Geste | Effet |
|---|---|
| Multi-sélection + Ctrl+G (ou clic droit → Grouper) | crée un groupe avec les éléments sélectionnés |
| Clic droit → Dissocier | supprime le groupe, les membres restent en place |
| Clic sur un membre | sélectionne le groupe le plus externe (cadre affiché) |
| Double-clic (ou Alt+clic) | entre d'un niveau, sélectionne le membre / sous-groupe |
| Échap | remonte d'un niveau de groupe |
| Glisser le cadre | déplace tout le groupe, écarts internes conservés (mécanique OS#1239 `anchorAbsoluteContainerGroups` / `followAttachedEnvelopeLogical`) |
| Poignées du cadre | étirent les POSITIONS des membres et la taille des éléments libres (ZDT) ; **jamais** la hauteur des nœuds (pilotée par les données). Alternative simple en v1 : poignées absentes sur les groupes contenant des nœuds |

La sélection remontante existe déjà pour les blocs de légende (OS#1254) : la généraliser
au lieu de la dupliquer.

## Modèle de données

Nouvel objet persisté `group` (format_version à bumper) :

```
{
  id, name?,
  members: [element_id...],        // nœuds, ZDT, sous-groupes
  origin?: { dimension_id, level } // trace d'init, pour « Réinitialiser »
}
```

Pistes d'implémentation (à trancher au moment du code) :

- **Option 1 — généraliser l'existant** : `attached_node`/`attached_container` de
  `Class_NodeBase` fait déjà 80 % du travail (lien bidirectionnel, enveloppe,
  `computeSizeAndPositionFromAttachedNodes`). Le groupe devient un `Class_NodeBase`
  invisible-sauf-sélection (ou un ZDT sans texte) dont les membres sont les attachés.
  Avantage : réutilise enveloppe + suivi + persistance existants. Inconvénient : un
  « groupe » qui EST un nœud, sémantique à assainir.
- **Option 2 — objet dédié `Class_Group`** : plus propre, mais réimplémente
  enveloppe/suivi/undo. À réserver si l'option 1 fuit de partout.

Recommandation : commencer par l'option 1 (le mécanisme tied existe et est éprouvé),
en isolant l'API groupe (`group.members`, `group.add/remove`) pour pouvoir migrer vers
l'option 2 sans toucher les appelants.

## Inspecteur

- **Une seule** section « Groupe » (remplace les deux sections « Cadre géométrique »
  de `MenuElementsAppearance.tsx` ~l.2392 et ~l.2466) : liste des membres, ajouter/retirer,
  dissocier, réinitialiser depuis la dimension.
- Enregistrée via l'inspector_registry (OS#1243), affichée pour toute sélection
  contenant un groupe ou un membre de groupe.

## Phasage proposé

1. **P1 — Unification UI** : fusionner les deux sections « Cadre géométrique » en une
   section « Groupe » ; renommer le vocabulaire (traductions `tiedToNodes` → groupe).
   Aucun changement de modèle.
2. **P2 — Grammaire de sélection** : sélection remontante généralisée (clic = groupe,
   double-clic = entrer, Échap = sortir), Ctrl+G / Dissocier sur multi-sélection.
3. **P3 — Groupes persistés + imbrication** : objet `group` au format (format_version),
   migration des `tied_to_nodes` existants en groupes, imbrication.
4. **P4 — Init par dimension** : « Créer les groupes depuis la dimension X »,
   `origin`, « Réinitialiser depuis la dimension ».

## Points ouverts

- Comportement des poignées de redimensionnement sur groupe mixte (étirement des
  positions vs poignées désactivées) — trancher en P2 sur maquette.
- Migration des diagrammes existants : un nœud `tied_to_nodes` devient-il un groupe
  nommé d'après le nœud, ou garde-t-il sa double nature nœud+cadre ?
- Interaction avec l'auto-layout (jalon groupe #56) : les groupes contraignent-ils
  `computeAutoSankey` (garder les membres contigus) ? Hors périmètre v1, à noter.
