Assainissement du mode de positionnement paramétrique (PR 1 + PR 2)
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

Cette fiche documente les deux premières PR d'assainissement. Elles
n'introduisent pas de nouveau comportement utilisateur : elles
préparent le terrain pour la refonte centralisée du recompute
paramétrique (PR 3 à venir) en supprimant les chemins buggés et en
unifiant l'espacement sur une seule variable.

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

Ce qui reste cassé (à traiter en PR 3)
---------------------------------------

La clause de sortie « nested container bypass » dans
``Node.applyPosition`` (mode parametric) est toujours en place : un
nœud qui est à la fois parent d'un container et enfant d'un autre
container skippe entièrement son calcul paramétrique. C'est l'un des
motifs de la refonte ``recomputeParametricLayout`` (PR 3), qui
transformera ``Node.applyPosition`` en simple « pose du transform SVG
depuis ``position_x``/``position_y`` déjà calculés » et descendra
récursivement dans les containers depuis un seul point d'entrée.

Voir aussi
----------

- PR 3 (à venir) : ``recomputeParametricLayout(scope)``, containers
  récursifs, algorithme de drag par réarrangement local.
