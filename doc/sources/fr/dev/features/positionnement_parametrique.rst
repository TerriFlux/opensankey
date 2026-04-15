Refonte du mode de positionnement paramétrique (PR 1 + PR 2 + PR 3)
====================================================================

Contexte
--------

Le mode paramétrique empile les nœuds d'une colonne (``position_u``)
verticalement dans l'ordre ``position_v``, avec un espacement porté par
``shape_position_dy``. En pratique, plusieurs sources de vérité
concurrentes écrivaient ``position_y``, et l'espacement entre nœuds
était porté tantôt par ``shape_position_dy``, tantôt par un
``gap = 10`` en dur selon le chemin d'exécution. Les containers
(``dimension.container_mode``) ne lisaient pas ``shape_position_dy`` du
tout, ce qui empêchait le mode paramétrique de piloter leur layout
interne.

Cette fiche documente les trois PR de refonte. Les deux premières
préparent le terrain (suppression des chemins buggés, unification de
``shape_position_dy`` comme seule source de vérité pour l'espacement).
La troisième centralise effectivement le recompute dans un point
d'entrée unique et transforme ``Node.applyPosition`` en pass-through.
Aucune des trois n'introduit de comportement utilisateur nouveau
« visible » dans le cas nominal : l'objectif est de fermer des bugs
silencieux et de rendre le mode paramétrique pilotable depuis un seul
endroit.

Le code vit dans le submodule imbriqué
``submodules/OpenSankey+/submodules/OpenSankey`` (niveau OpenSankey
base).

PR 1 — Fixes ponctuels et découplage ``u``/``x``
-------------------------------------------------

Prédicat de ``Node.applyPosition`` (mode parametric)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

``Elements/Node.tsx`` — la branche ``parametric`` d'``applyPosition``
cherche un nœud ``nodeAbove`` dans la même colonne pour empiler
dessus. La condition de sélection était malformée :

.. code-block:: typescript

   // avant : && lie plus fort que ||, et nodeAbove != this
   //          lisait un local undefined → toujours vrai
   (same_container || (no_container && !has_container) && nodeAbove != this)

Les parenthèses ont été corrigées pour donner la sémantique attendue
« même container OU aucun container des deux côtés », et la
comparaison ``nodeAbove != this`` a été retirée (inutile : la boucle
qui remplit ``nodeAbove`` ne passe de toute façon pas sur le nœud
courant).

Rappel de ``computeParametrization`` au changement de data tag
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

``components/topmenus/Toolbar.tsx`` — le handler
``handleDataTagSelection`` changeait la valeur active d'un data tag
(donc, potentiellement, la hauteur des nœuds via
``getShapeHeightToUse``) sans demander au layout paramétrique de se
recalculer. Résultat : en mode parametric, les hauteurs changeaient
mais l'espacement entre nœuds restait figé. Le handler appelle
désormais ``drawing_area.nodePositioning.computeParametrization(false)``
à la fin quand le style par défaut est en ``parametric``, avant de
déclencher le redraw.

Back-calcul de ``shape_position_dy`` à la bascule absolu → paramétrique
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

``types/DrawingArea.tsx`` — ``setParametricMode`` basculait le style
vers ``parametric`` puis appelait ``computeParametrization``, ce qui
ré-empilait les nœuds en ignorant leurs positions absolues
précédentes : saut visuel systématique à la bascule.

La méthode fait maintenant, dans l'ordre :

1. ``inferPositionUFromX()`` pour initialiser ``position_u`` depuis la
   position absolue (nœuds non verrouillés uniquement) ;
2. un back-calcul : chaque colonne est triée par ``position_y`` courant,
   puis ``shape_position_dy`` de chaque nœud (sauf le premier) est
   recalculé par ``y_i - (y_{i-1} + h_{i-1})`` ; les valeurs négatives
   (overlap préexistant) sont *clampées à 0* avec un ``console.warn``
   listant le nombre de nœuds concernés — le design PR 2+ interdit les
   dy négatifs ;
3. bascule vers ``parametric`` puis recompute V via
   ``computeParametrization(false)``.

Résultat : sur un diagramme sans overlap absolu, la bascule est
visuellement stable. Sur un diagramme avec overlaps, les nœuds
concernés sont remontés (dy ramené à 0) avec un avertissement en
console.

Suppression du ``delete_attribute('position_dy')`` dans ``finalizeOperation``
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

``Algorithms/Hierarchies.tsx`` — ``finalizeOperation`` (utilisé en fin
de désagrégation) purgeait ``position_dy`` sur chaque nouveau nœud,
après que le helper de positionnement l'avait justement posé. Toute
personnalisation locale du dy était perdue à chaque désagrégation. La
purge est supprimée.

Découplage ``position_u`` / ``position_x``
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

``Algorithms/NodePositioning.tsx`` — ``computeParametrization``
re-dérivait inconditionnellement ``position_u`` depuis ``position_x``
en tête de fonction :

.. code-block:: typescript

   node.position_u = Math.round(node.position_x / dx)

Couplage bidirectionnel ``u ↔ x`` : quand un container modifiait
``position_x`` (via l'envelope bbox), son ``position_u`` dérivait aussi
au prochain recompute, qui recalculait alors ``position_x``, etc.
Dérives silencieuses à chaque recompute.

Le calcul est désormais dans une nouvelle méthode publique
``inferPositionUFromX()`` que les callers appellent explicitement
quand ils viennent de modifier une position absolue :

- ``setParametricMode`` (bascule abs → param, cf. supra) ;
- ``NodeEventsHandler.handleMouseDragEnd`` (fin de drag en mode
  absolu) ;
- ``Hierarchies`` (création d'un nœud lors d'une désagrégation
  latérale).

``computeParametrization`` ne touche plus à ``position_u`` sauf quand
``use_horizontal_index=true`` (analyse topologique explicite).

PR 2 — ``shape_position_dy`` comme seule source de vérité pour l'espacement
----------------------------------------------------------------------------

Helper ``stackNodesVertically`` / ``totalStackHeight``
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

``Algorithms/NodePositioning.tsx`` — deux nouvelles méthodes statiques
sur ``Class_NodePositioning`` :

.. code-block:: typescript

   public static stackNodesVertically(
     nodes: Class_NodeElement[],
     anchor_y: number
   )

   public static totalStackHeight(nodes: Class_NodeElement[]): number

``stackNodesVertically`` empile les nœuds dans l'ordre passé en
argument, en partant de ``anchor_y``, selon l'invariant canonique :

.. code-block:: text

   n_0.y = anchor_y
   n_{i+1}.y = n_i.y + n_i.height + n_{i+1}.shape_position_dy

Le ``shape_position_dy`` du premier nœud est ignoré (il n'a pas de
prédécesseur). Chaque nœud reçoit son ``applyPosition()`` en passant.

``totalStackHeight`` retourne la hauteur totale de la pile équivalente
(somme des hauteurs + somme des dy des nœuds sauf le premier), utile
aux callers qui veulent centrer la pile autour d'un point.

L'ordre des nœuds est celui de la liste — à trier par le caller selon
son critère métier (``position_v``, ``position_y`` courant, etc.).

Call sites migrés
~~~~~~~~~~~~~~~~~

Tous les sites qui empilaient avec un ``gap = 10`` en dur ont été
migrés sur le helper. La signature des méthodes publiques
concernées perd son paramètre ``gap``.

``Elements/Node.tsx`` :

- ``restackContainerChildren()`` — ordre préservé
  (tri par ``position_y`` courant), ancre = ``y`` du premier enfant,
  espacement lu sur ``shape_position_dy`` de chaque enfant. Plus de
  paramètre ``gap``.
- ``restackAncestorContainers()`` — idem, ne transmet plus de gap.

``Elements/NodeDimension.tsx`` :

- ``setContainerMode`` (bloc de stack initial, ``entering &&
  !fromJSON``) — délègue à ``stackNodesVertically`` en positionnant
  d'abord ``position_x`` sur chaque enfant, anchor ``y`` =
  ``parent.position_y``.

``Algorithms/Hierarchies.tsx`` :

- ``computeEffectiveBlockHeight`` — la hauteur effective d'un sous-arbre
  (descendants récursifs) est calculée en lisant ``shape_position_dy``
  de chaque descendant (sauf le premier) au lieu d'un paramètre
  ``vertical_gap`` scalaire. Param supprimé.
- ``rebalanceAncestorColumns`` — les frères du nœud expandé sont
  replacés autour du parent visuel en accumulant
  ``shape_position_dy`` de chaque frère (sauf le premier). Param
  ``vertical_gap`` supprimé.
- ``updateNodePositioning`` (helper de ``disaggregationExpansion``) —
  positionnement symétrique des enfants autour du centre du parent :
  la hauteur totale de la pile vient de ``totalStackHeight``, et
  l'empilement effectif délègue à ``stackNodesVertically``.
- ``disaggregate`` (bloc ``Do`` de la désagrégation classique) — même
  pattern : ``totalStackHeight`` pour calculer l'ancre, puis
  ``stackNodesVertically``.

À noter : ``updateAggregationExpansionPositioning`` utilisait déjà
``aggregateNode.shape_position_dy`` comme ``vertical_spacing`` avant
cette PR, aucun changement nécessaire.

Conséquences visuelles
~~~~~~~~~~~~~~~~~~~~~~~

Le ``shape_position_dy`` par défaut, porté par ``elementStyleConfigs``
dans ``Elements/ElementStyle.tsx``, est ``20`` pour le style par
défaut des nœuds (contre ``10`` en dur dans l'ancien code). À l'entrée
en mode container ou à la désagrégation, l'espacement initial des
enfants est donc désormais de 20 px au lieu de 10 px. Si le besoin
d'un défaut à 10 px réapparaît, il faut modifier la valeur dans le
style plutôt que de la remettre en dur.

Invariants maintenant vérifiés
------------------------------

À l'issue de ces deux PR :

- ``shape_position_dy`` est la seule source de vérité pour l'espacement
  vertical entre nœuds d'une même colonne / sous-colonne container
  (aucun ``gap`` en dur dans les chemins de stacking) ;
- la bascule absolu → paramétrique préserve les ``position_y`` actuels,
  sauf pour les overlaps préexistants (clampés à 0 avec warning) ;
- un changement de data tag rafraîchit bien l'espacement paramétrique ;
- ``position_u`` n'est plus dérivé implicitement de ``position_x`` à
  chaque recompute : seuls les call sites qui viennent de modifier une
  position absolue appellent ``inferPositionUFromX`` explicitement.

PR 3 — ``recomputeParametricLayout`` centralisé
------------------------------------------------

Troisième et dernière passe. Le recompute du layout paramétrique est
rassemblé en une seule méthode publique
``Class_NodePositioning.recomputeParametricLayout(scope)``, appelée une
fois par cycle de dessin depuis ``Class_DrawingArea.drawElements``.
``Node.applyPosition`` en branche parametric devient un pass-through
qui n'émet plus que le ``transform`` SVG depuis des
``position_x``/``position_y`` déjà calculés.

Point d'entrée unique dans ``drawElements``
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

``types/DrawingArea.tsx`` — en tête de ``drawElements``, après le
garde ``bypass_redraws``, quand le style par défaut est en
``parametric``, on appelle :

.. code-block:: typescript

   this.nodePositioning.recomputeParametricLayout({ type: 'all' })

Cela garantit que toutes les ``position_y`` sont fraîches avant que
chaque nœud ne soit effectivement dessiné. Les call sites qui
mutaient auparavant ``position_y`` via leurs propres appels à
``applyPosition`` (set*Mode, data tag change, désagrégation, fin de
drag…) n'ont rien à changer : ils terminent déjà par
``drawing_area.draw()`` qui passe par ``drawElements``.

``Node.applyPosition`` en pass-through
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

``Elements/Node.tsx`` — la branche ``parametric`` d'``applyPosition``
est réduite à sa plus simple expression. L'ancien walk
« ``nodeAbove`` → ``y = nodeAbove.y + nodeAbove.h + dy`` » avec sa
clause de sortie « nested container bypass » (nœud à la fois parent
d'un container et enfant d'un autre → calcul paramétrique skippé) est
supprimé. La méthode ne fait plus que :

1. le cas ``relative`` (import/export collés à un source/target),
   inchangé — c'est un codepath séparé ;
2. l'appel récursif ``applyPosition`` sur les voisins ``relative`` ;
3. ``super.applyPosition()`` qui pose le ``transform`` SVG depuis
   ``this.position_x`` / ``this.position_y`` courants.

Trois phases dans ``recomputeParametricLayout``
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

``Algorithms/NodePositioning.tsx`` — la méthode traite les containers
comme des sous-colonnes récursives. L'algorithme se divise en trois
phases :

**Phase A — sizing bottom-up.** Pour chaque container top-level, on
descend récursivement en post-order. Pour chaque container visité, on
trie ses enfants par ``position_v`` (tie-break sur ``position_y``),
et on fixe ``shape_min_height`` à la hauteur totale de la pile
(``totalStackHeight(children) + margin_top + margin_bottom``) et
``shape_min_width`` à ``max(child width) + margin_left + margin_right``.
Aucune position n'est écrite à cette phase — seules les tailles des
containers sont mises à jour. Les containers sans enfants visibles
sont ignorés (leur taille intrinsèque est conservée).

**Phase B — stacking des colonnes top-level.** On collecte tous les
nœuds visibles non échange qui ne sont pas enfants d'un container
(``dimensions_as_child.some(d => d.container_mode)``). Groupe par
``position_u``. Pour chaque colonne, on trie par ``position_v`` et on
appelle ``stackNodesVertically`` avec pour ancre le ``position_y``
courant du nœud de plus petit V. Les containers top-level participent
comme des nœuds normaux avec leur hauteur déjà correcte (phase A).

**Phase C — positionnement top-down des descendants de containers.**
Chaque container top-level est redescendu récursivement. Pour chaque
container visité, on restacke ses enfants à l'ancre
``container.position_y + container.shape_margin_top``. La récursion
descend dans les containers imbriqués. Après phase B, ``container.y``
peut avoir changé — phase C propage le changement à tous les
descendants.

Les scopes ``'column'`` et ``'subtree'`` sont également disponibles :
le premier restreint phase B + C à une seule colonne, le second est
réservé aux traitements ciblés (drag local, cf. infra — il est
implémenté via phase C d'un container unique).

Drag en mode paramétrique
~~~~~~~~~~~~~~~~~~~~~~~~~~

``Elements/NodeEventsHandler.tsx`` — ``handleMouseDragEnd`` est
désormais explicite en mode parametric. Le settle de fin de drag se
décompose en cinq étapes :

1. ``inferPositionUFromX()`` pour réinférer ``position_u`` depuis
   ``position_x`` sur les nœuds dont la position horizontale a pu
   changer. La version PR 3 de cette méthode *clusterise* les nœuds par
   proximité en x avant de calculer le ``u`` (cf. section suivante),
   évitant les sauts de colonne à 1-2 px près.
2. Reset de ``position_v`` à ``-1`` pour les nœuds non
   ``v_locked`` — la correction d'un bug préexistant qui ignorait le
   verrou est incluse ici.
3. ``computeParametrization(false)`` qui trie chaque colonne par
   ``position_y`` et réassigne ``position_v``. **C'est à cet endroit
   que le swap implicite sur croisement de voisin se produit** : si
   le drag a fait passer le nœud au-dessus ou en-dessous d'un voisin,
   le sort-by-y donne un nouvel ordre, et les ``V`` sont réassignés
   dans le nouvel ordre. Pas besoin de détection explicite de
   croisement : le tri fait tout.
4. ``backCalculateShapePositionDyFromY`` qui, pour chaque colonne
   triée par y, recalcule ``shape_position_dy`` de chaque nœud depuis
   le précédent (``dy_i = y_i - (y_{i-1} + h_{i-1})``), clampé à 0
   en cas d'overlap. L'invariant canonique du stack est ainsi
   cohérent avec les positions post-drag.
5. ``drawing_area.drawElements()`` explicite — déclenche
   immédiatement ``recomputeParametricLayout`` (phases A/B/C) qui
   restacke tout proprement, y compris les descendants de containers
   si le drag a agi sur un enfant de container.

**Limitation connue** : dragger l'enfant de plus petit V d'un
container le fait revenir à l'ancre du container
(``container.position_y + shape_margin_top``) au re-stack de phase C.
La phase C utilise cette ancre fixe et n'a aucune façon de savoir que
le premier-V child a été bougé. Dragger un enfant non-premier-V
fonctionne sans accroc. La réparation propre demanderait soit de
dériver l'ancre de phase C depuis le premier enfant courant (en
propageant à ``container.y``), soit de déplacer le container
lui-même. Hors scope tant qu'un flux utilisateur réel ne le
réclame pas.

Clustering dans ``inferPositionUFromX``
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

``Algorithms/NodePositioning.tsx`` — l'ancienne implémentation
arrondissait chaque nœud indépendamment :

.. code-block:: typescript

   node.position_u = Math.round(node.position_x / dx)

Deux nœuds visuellement alignés (à 1-2 px près) tombaient parfois de
part et d'autre de la frontière de rounding à ``x = (u + 0.5) * dx``
et finissaient dans des colonnes différentes sans que l'utilisateur
ait l'impression d'avoir fait quoi que ce soit. Observé en vrai sur
un diagramme avec ``dx = 200`` et quatre nœuds à ``x ≈ 1898.88 /
1900.18 / 1901.47`` : deux côtés de 1900, deux u différents (9 et 10).

La nouvelle implémentation regroupe d'abord les nœuds en **clusters**
par proximité en x, puis calcule un ``u`` par cluster :

1. Tri des nœuds éligibles (visibles, non-échange) par
   ``position_x`` croissant.
2. Parcours glissant : un nœud rejoint le cluster courant si son
   ``position_x`` est à moins de ``tolerance`` du max-x du cluster,
   sinon il démarre un nouveau cluster. ``tolerance = max(10, dx *
   0.05)`` — assez grand pour absorber le bruit pixel / les dérives
   d'envelope, assez petit pour ne jamais fusionner deux colonnes
   voisines (5 % d'un ``dx``).
3. Pour chaque cluster : si un nœud ``u_locked`` en fait partie, le
   cluster hérite de son ``u`` (le verrou définit la colonne
   d'autorité). Sinon, ``u = round(mean_x / dx)``.
4. Le ``u`` du cluster est assigné à tous ses membres non
   verrouillés.

Utiliser le **max-x courant** du cluster comme référence (et non le
premier x) est important : une chaîne de nœuds chacun à ``tolerance``
du précédent forme un seul cluster, même si la distance head-to-tail
dépasse ``tolerance``.

Nettoyage des chemins container obsolètes
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

PR 3 supprime les helpers qui étaient utilisés avant pour gérer les
containers :

- ``Class_NodeElement.restackContainerChildren`` — re-stackait les
  enfants directs d'un container. Remplacé par phase C.
- ``Class_NodEelement.restackAncestorContainers`` — remontait la
  chaîne des containers en re-stackant chaque ancêtre. Remplacé par
  phase A (sizing récursif bottom-up des containers).
- Le ``setTimeout(0)`` dans ``NodeDimension.setContainerMode`` — il
  existait pour différer le recalcul d'envelope du parent jusqu'à ce
  que le navigateur ait flushé le SVG des enfants, pour que
  ``getBBox`` renvoie leurs vraies extents. Phase A lit la géométrie
  **logique** (``position + shape size + margins``), sans appel à
  ``getBBox``, ce qui élimine la race qui motivait ce hack.
  ``setContainerMode`` termine désormais par un simple
  ``drawing_area.drawElements()``.

Conservés :

- ``propagateContainerEnvelopeToAncestors`` — encore utilisé par
  ``Class_NodeElement.eventMouseDrag`` pour le drag en mode absolu,
  où le recompute paramétrique ne s'exécute pas.
- ``setContainerModeQuiet`` — utilisé par ``Algorithms/UpdateFrom``
  lors des changements de vue.

Invariants maintenant vérifiés (tous confondus)
------------------------------------------------

À l'issue des trois PR :

- ``shape_position_dy`` est la seule source de vérité pour l'espacement
  vertical entre nœuds d'une même colonne / sous-colonne container
  (aucun ``gap`` en dur dans les chemins de stacking) ;
- ``recomputeParametricLayout`` est le seul chemin qui écrit
  ``position_y`` en mode parametric, appelé une fois par cycle de
  dessin depuis ``drawElements`` ;
- ``Node.applyPosition`` parametric est un pass-through qui n'émet
  plus que le ``transform`` SVG depuis des positions déjà calculées ;
- les containers sont traités comme des sous-colonnes récursives, à
  n'importe quelle profondeur d'imbrication ;
- la bascule absolu → paramétrique préserve les ``position_y`` actuels
  (sauf overlaps, clampés) ;
- un changement de data tag rafraîchit bien l'espacement paramétrique,
  y compris dans les containers imbriqués ;
- le drag parametric fin de gestion est explicite, avec un redraw
  immédiat post-drag ;
- ``position_u`` est dérivé de ``position_x`` par clustering et non
  plus par arrondi indépendant, éliminant les sauts de colonne à 1-2
  px près ;
- aucune méthode héritée du vieux chemin container ne survit, sauf
  celles justifiées par d'autres codepaths (drag absolu, view
  switch).

Limitations documentées
------------------------

- Drag du premier-V child d'un container : snap à l'ancre du
  container (cf. section drag).
- ``shape_position_dy`` par défaut vaut 20 px dans
  ``elementStyleConfigs``, contre 10 px hardcodés avant PR 2 : à
  l'entrée en mode container ou à la désagrégation, l'espacement
  initial des enfants est donc 20 px. Pour un défaut à 10 px,
  modifier le style plutôt que réintroduire du hardcoded.

Voir aussi
----------

- Issue de suivi PR 3 : ``su-model/opensankey#1210``.
