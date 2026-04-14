Mode englobant — description technique
========================================

Objectif
--------

Ajouter un mode d'affichage où un nœud parent d'une dimension
d'agrégation et ses enfants sont rendus simultanément, le parent
englobant visuellement ses enfants. Deux variantes de répartition des
flux sont proposées : entrées sur les enfants et sorties depuis le
parent, ou l'inverse. Les liens intra-groupe (enfant vers enfant de la
même dimension) restent visibles dans les deux variantes.

Tout ce code vit dans le submodule imbriqué
``submodules/OpenSankey+/submodules/OpenSankey`` — c'est-à-dire au
niveau OpenSankey base, et non dans OpenSankey+ ou SankeyApplication.

Modèle de données
-----------------

``Class_NodeDimension`` — ``Elements/NodeDimension.tsx``
    Nouveau champ privé ``_container_mode`` de type ``Type_ContainerMode``,
    mutuellement exclusif avec ``_force_show_parent`` et
    ``_force_show_children`` :

    .. code-block:: typescript

       export type Type_ContainerMode =
         | null
         | 'in_children_out_parent'
         | 'in_parent_out_children'

    Nouvelles méthodes publiques :

    - ``setContainerMode(mode)`` : active le mode englobant, efface les
      autres forçages, réorganise les liens entrants/sortants et
      redessine parent et enfants.
    - ``unsetContainerMode()`` : repasse en mode neutre.
    - Getter ``container_mode``.

    Les méthodes ``setForceToShowParent``, ``setForceToShowChildren`` et
    ``unsetForcingToShow`` ont été mises à jour pour remettre
    ``_container_mode`` à ``null`` — garantit l'exclusivité mutuelle.

Visibilité des nœuds
--------------------

``NodeDimensionsManager.checkIfRelatedDimensionsAreSelected`` — même
fichier.

Dès qu'une des dimensions impliquant le nœud est en ``container_mode``,
la méthode court-circuite et retourne ``true``. Parent et enfants sont
ainsi tous deux visibles simultanément, sans interaction avec les
autres flags de forçage présents sur d'autres dimensions.

Visibilité asymétrique des liens
---------------------------------

``Class_LinkElement`` — ``Elements/Link.tsx``.

Nouveau getter ``is_allowed_by_container_modes`` ajouté au calcul de
``is_visible``. Pour chaque dimension active en mode englobant qui
implique la source ou la cible du lien, la règle suivante est
appliquée :

=====================================  ==========================  ==========================
Cas                                    ``in_children_out_parent``  ``in_parent_out_children``
=====================================  ==========================  ==========================
Source = parent (sortant du parent)    visible                     masqué
Target = parent (entrant vers parent)  masqué                      visible
Source = enfant (sortant d'un enfant)  masqué                      visible
Target = enfant (entrant vers enfant)  visible                     masqué
Source et target enfants du groupe     visible                     visible
Parent ↔ son propre enfant             masqué                      masqué
=====================================  ==========================  ==========================

Si plusieurs dimensions en mode englobant impactent le même lien, la
règle la plus stricte l'emporte : un seul masquage suffit à rendre le
lien invisible.

Rendu du parent englobant
-------------------------

``Class_NodeElement`` — ``Elements/Node.tsx``.

Nouvelle méthode publique ``applyContainerEnvelopeIfNeeded()`` :

1. Filtre les dimensions dont ce nœud est parent et dont
   ``container_mode`` est non nul.
2. Agrège la liste des enfants concernés (déduplication).
3. Appelle l'utilitaire partagé ``_computeEnvelopeBBox`` pour obtenir
   la bounding box englobante.
4. Appelle ``_applyEnvelopeBBox`` pour la reporter sur ``position_x``,
   ``position_y``, ``shape_min_width`` et ``shape_min_height``.

La méthode est invoquée au tout début de ``_draw()``, de sorte que le
shape est dessiné avec la géométrie englobante dans le même draw — pas
de second passage nécessaire.

Utilitaire partagé dans ``Class_NodeBase``
-------------------------------------------

``Class_NodeBase`` — ``Elements/NodeBase.tsx``.

Deux nouvelles méthodes protégées :

- ``_computeEnvelopeBBox(nodes)`` : calcule la bounding box englobante
  d'une liste de ``Class_NodeBase``. Essaie d'abord ``getBBox()`` sur
  le DOM SVG, et retombe sur la géométrie logique (``position_x/y`` +
  ``getShapeWidthToUse/HeightToUse``) si le nœud n'est pas encore
  rendu. Cela permet un premier draw correct, avant même que les
  enfants soient dans le DOM.
- ``_applyEnvelopeBBox(bbox)`` : applique la bbox à ``position_x/y``
  et à ``shape_min_width/height`` en tenant compte des marges
  ``shape_margin_*``.

La méthode existante
``Class_ContainerElement.computeSizeAndPositionFromAttachedNodes`` a
été refactorisée pour déléguer à ces deux utilitaires.

Propagation du drag
-------------------

Override de ``eventMouseDrag`` dans ``Class_NodeElement`` :

- Si le nœud est **parent** d'une dimension en mode englobant et qu'il
  fait partie de la sélection en cours de drag, le delta ``dx/dy`` est
  propagé aux enfants contenus. Les enfants déjà présents dans la
  sélection sont sautés pour éviter le double déplacement (via un
  ``Set`` ``already_moved``).
- Si le nœud est **enfant** dans une dimension en mode englobant,
  l'enveloppe du parent est recalculée et son shape redessiné après
  chaque frame de drag.

Menu contextuel
---------------

Trois fichiers sont touchés pour ajouter les entrées au menu :

``NodeActions.tsx``
    Trois nouvelles méthodes ``containerInChildrenOutParent``,
    ``containerInParentOutChildren``, ``unsetContainerMode``.
    Enregistrées dans ``createModifier`` pour être accessibles via le
    dispatcher d'actions.

``ContextNodeConfig.tsx``
    Entrées ``actions`` avec libellés FR et EN, ``undoable: true``,
    ``closeMenuAfter: true``.

``SankeyMenuContext.tsx``
    Les trois entrées sont injectées dans les deux sous-menus
    dynamiques de ``navHierarchy`` (côté ``dimensions_as_child`` et
    côté ``dimensions_as_parent``), en cohabitation avec les boutons
    ``aggregate``, ``disaggregate`` et les variantes d'expansion
    gauche/droite existantes. L'entrée « Quitter mode englobant »
    utilise un ``customCheck`` pour n'apparaître que quand
    ``dim.container_mode`` est actif.

Persistance
-----------

- ``NodeDimensionsManager.toJSON`` sérialise ``container_mode`` quand
  il est non nul.
- ``fromJSON`` rejoue l'état via ``setContainerMode``, prioritaire sur
  les flags ``force_show_children`` / ``force_show_parent`` s'ils
  coexistaient dans un fichier legacy.
- Le type legacy ``SankeyNodeAttr.dimensions[*]`` dans
  ``Persistence/LegacyType.tsx`` inclut le champ optionnel
  ``container_mode``.

Fichiers modifiés
-----------------

============================================  ======================================
Fichier                                       Changement principal
============================================  ======================================
``Elements/NodeDimension.tsx``                ``_container_mode`` + setters + JSON
``Elements/NodeBase.tsx``                     utilitaires ``_computeEnvelopeBBox`` et ``_applyEnvelopeBBox``
``Elements/TextZone.tsx``                     délégation aux utilitaires
``Elements/Node.tsx``                         ``applyContainerEnvelopeIfNeeded`` + override ``eventMouseDrag``
``Elements/Link.tsx``                         ``is_allowed_by_container_modes``
``components/dialogs/NodeActions.tsx``        3 actions + ``createModifier``
``components/dialogs/ContextNodeConfig.tsx``  libellés FR/EN
``components/dialogs/SankeyMenuContext.tsx``  entrées dans les sous-menus dynamiques
``Persistence/LegacyType.tsx``                type ``container_mode``
============================================  ======================================

Décisions et alternatives écartées
-----------------------------------

**Approche du layout (enveloppe vs. parent pré-positionné)**
    Deux approches étaient envisageables :

    - **A** — le parent est calculé comme l'enveloppe de ses enfants
      (eux-mêmes positionnés par le layout Sankey normal) ;
    - **B** — le parent est laid out par Sankey comme s'il était seul,
      et les enfants sont comprimés à l'intérieur de son rectangle en
      post-pass.

    L'approche A a été retenue pour cette version initiale car elle
    réutilise directement le mécanisme déjà présent dans
    ``Class_ContainerElement`` (text zones), sans toucher au layout
    Sankey ni introduire de post-passe. L'approche B est ouverte pour
    une évolution ultérieure ; elle donnerait un meilleur résultat
    visuel quand la colonne naturelle du parent est différente de
    celle de ses enfants.

**Liens synthétiques côté parent**
    Une première idée envisageait de créer des liens synthétiques
    agrégés côté parent (de façon similaire à ce que fait
    ``aggregationExpansion``). Elle a été écartée : le parent a déjà
    ses propres liens dans le modèle de données, ils sont simplement
    invisibles en mode désagrégé classique. Le mode englobant les rend
    visibles de manière asymétrique sans créer de nouveaux liens, ce
    qui est à la fois plus simple et plus fidèle au modèle.

**Refactor de l'utilitaire d'enveloppe dans ``Class_NodeBase``**
    Plutôt que de dupliquer la logique de calcul de bbox entre
    ``Class_ContainerElement`` et ``Class_NodeElement``, elle a été
    remontée dans la classe de base commune ``Class_NodeBase``. Cela
    garde un seul endroit à maintenir et permet à d'autres futures
    fonctionnalités qui auraient besoin d'une enveloppe de la
    réutiliser.

Cas limites connus
------------------

- Un nœud impliqué dans plusieurs dimensions dont certaines en mode
  englobant et d'autres en forçage classique : le court-circuit de
  visibilité dans ``checkIfRelatedDimensionsAreSelected`` rend le nœud
  visible dès qu'une dimension est en mode englobant, sans évaluer les
  autres. Comportement simple mais non validé sur des cas réels.
- Un parent dont les enfants sont dans une colonne ``position_u``
  différente : l'enveloppe suit les enfants, le layout Sankey n'est
  pas recalculé. C'est exactement ce que prévoit l'approche A ; si ce
  n'est pas le comportement voulu, c'est l'approche B qu'il faut
  implémenter.
- Undo / redo : les trois actions sont marquées ``undoable: true``
  mais n'enregistrent pas encore d'entrée d'historique via
  ``executeWithUndo``. À consolider.

Pistes d'évolution
------------------

- Implémenter l'approche B du layout en tant que seconde variante,
  éventuellement contrôlée par un champ supplémentaire sur la
  dimension (``container_layout_strategy``).
- Undo / redo complet sur l'activation et la désactivation du mode.
- Styles dédiés pour l'enveloppe (bordure, fond semi-transparent,
  padding configurable).
- Tests unitaires sur la logique de visibilité des liens dans
  ``is_allowed_by_container_modes``.

Voir aussi
----------

- :doc:`/user/features/mode_englobant` — documentation utilisateur du
  mode englobant
