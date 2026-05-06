Expansion latérale (issue #1225)
=================================

Vue d'ensemble
--------------

L'**expansion latérale** est l'un des trois modes d'affichage hiérarchique
d'une ``Class_NodeDimension``, aux côtés du **mode englobant** (``container_mode``)
et de la **désagrégation** (``force_show_children``). Elle fait apparaître les
enfants d'un nœud parent à gauche ou à droite de celui-ci, avec des liens
explicites parent↔enfant et des valeurs redistribuées depuis les flux du
parent agrégé.

Avant la refonte de mai 2026, l'expansion était implémentée via des
**clones** : on créait des nouveaux ``Class_NodeElement`` avec id suffixé
``expandleft``/``expandright`` et un champ ``master_node`` pointant vers
l'original. Ce mécanisme parallèle au système de dimensions standardes a
été remplacé par un **flag unifié** sur la dimension elle-même.

États mutuellement exclusifs d'une dim
---------------------------------------

Une dimension porte exactement un des états suivants :

* **neutre** — pas de forçage, visibilité décidée par les level tags actifs
* **force_show_parent** — agrégation forcée (parent visible, enfants cachés)
* **force_show_children** — désagrégation forcée (parent caché, enfants visibles)
* **container_mode** (4 sous-modes) — englobant : parent + enfants visibles
  avec filtrage des flux selon le sous-mode
* **expanded_left** — expansion gauche : parent + enfants visibles à gauche
  du parent, avec liens d'expansion parent↔enfants
* **expanded_right** — expansion droite : symétrique

Les setters de ``Class_NodeDimension`` (``setForceToShowParent``,
``setForceToShowChildren``, ``setContainerMode``, ``setExpandedSide``,
``unsetExpansion``) maintiennent l'exclusivité en remettant à zéro les
autres flags.

Invariant central
-----------------

À tout moment, l'ensemble des ``Class_LinkElement`` marqués
``is_expansion_link === true`` doit correspondre **exactement** à
l'ensemble des liens parent↔enfant des dimensions actuellement
``is_expanded``, en tenant compte de la **transitivité** via
``force_show_children``.

Concrètement, pour chaque dim ``P → {c1, c2, ...}`` avec
``is_expanded=true``, il existe un lien d'expansion P↔c (orienté selon
``expanded_left/right``) pour chaque ``c`` enfant. Si un ``c`` est
lui-même désagrégé (sa ``dim_as_parent`` a ``force_show_children=true``),
alors les liens d'expansion vont à ses petits-enfants à la place de ``c``.

Toute opération qui modifie l'état d'expansion
(``disaggregationExpansion``, ``contract``, ``disaggregate``, ``aggregate``)
doit **maintenir** cet invariant en créant et détruisant les liens
d'expansion en synchro avec les flags des dims.

Sites de consommation
---------------------

L'invariant est lu (sans modification) à plusieurs endroits :

* ``Class_NodeDimension.checkIfRelatedDimensionsAreSelected`` — visibilité du nœud :
  un nœud enfant ou parent d'une dim ``is_expanded`` est visible (au même
  titre que ``container_mode``).
* ``Class_LinkElement.is_allowed_by_container_modes`` — visibilité du lien :
  règles directionnelles A à E qui filtrent les flux externes des
  enfants/parent en mode expansion.
* ``Class_LinkElement._computeExpansionValue`` — valeur dynamique du lien
  d'expansion : ``valueCurrent`` n'est pas stockée mais recalculée à
  partir des inputs/outputs de l'enfant.
* ``NodeActions._collectVisibleEnglobedNodes`` /
  ``NodeActions._restackEnglobingDim`` — positionnement : les enfants
  expansés ne sont pas ré-empilés dans la colonne du parent englobant.

Helper partagé : ``Class_NodeElement.findExpandedAncestor()`` qui remonte
la chaîne ``dim_as_child`` via les dims désagrégées jusqu'à trouver une
dim ``is_expanded``.

Persistance et migration
------------------------

* Version JSON courante : **0.94** (bump au moment de la refonte).
* Sérialisation : les flags ``expanded_left`` / ``expanded_right`` sont
  persistés dans la section ``dimensions`` de chaque nœud (à côté de
  ``container_mode`` et ``force_show_children``). Le marker
  ``is_expansion_link`` est sérialisé sur chaque lien concerné.
* Migration legacy ``fromJSON_pre_0_94`` : les fichiers ``< 0.94`` peuvent
  contenir des nœuds-clones suffixés ``expandleft`` / ``expandright``.
  La migration :

  1. identifie le ``master`` (id sans suffixe) et le côté d'expansion
  2. identifie le parent expansé via les liens du clone
  3. pose ``expanded_left|right: true`` sur la dim correspondante du master
  4. réécrit les flux du clone vers le master (avec dédup des doublons)
  5. supprime le nœud clone

Pistes d'amélioration (à approfondir)
--------------------------------------

L'archi actuelle est fonctionnelle mais accumule de la dette :

1. **Logique éparpillée sur 5 fichiers** sans abstraction centrale —
   l'ajout d'un mode similaire à expansion impliquerait des modifications
   coordonnées dans NodeDimension, Link, Hierarchies, NodeActions et la
   persistance. Une classe-helper ``ExpansionContext`` qui exposerait
   ``isExpansionLink``, ``computeValue``, ``side``, ``parentNode``,
   ``childNode`` permettrait de centraliser.

2. **Transitivité gérée séparément dans ``disaggregate`` (création) et
   ``aggregate`` (destruction)**. Les deux blocs doivent rester en synchro
   manuellement. Si on touche l'un sans l'autre, dérive silencieuse de
   l'invariant. Un mécanisme observateur (au moment où ``setExpandedSide``
   ou ``unsetExpansion`` est appelé, déclencher la création/destruction
   des liens) serait plus robuste.

3. **Combinaisons profondes** : 2 niveaux de transitivité (désagréger un
   petit-enfant déjà transitif), expansion sur expansion, etc. — pas
   testées, probablement fragiles. Cas d'usage : à valider/raffiner sur
   des Sankeys réels avant d'étendre.

4. **Tests unitaires manquants** sur les cycles complets (expand →
   disaggregate → aggregate → contract). Actuellement on découvre les
   bugs uniquement en testant à la main.

5. **Performance** : ``findExpandedAncestor`` + fallback structurel à
   chaque check de visibilité de lien. Sur un Sankey à plusieurs milliers
   de liens × draws fréquents, ça peut coûter. Memoization possible
   par ``visibility_fingerprint``.

Ces points sont consignés dans une issue OpenSankey de second tour
(à créer après stabilisation du MVP).
