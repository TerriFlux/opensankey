Verrouillage de l'axe pendant le drag — description technique
==============================================================

Objectif
--------

Contraindre le déplacement d'un nœud à un seul axe (U ou V) lorsque la
touche **Shift** est maintenue pendant un drag souris, sur le modèle
du shift+drag de SankeyMatic. L'axe retenu est celui dont la composante
est dominante sur les premières frames du drag, avec un seuil minimal
d'engagement pour éviter que du jitter ne choisisse le mauvais axe.

Le code vit dans le submodule imbriqué
``submodules/OpenSankey+/submodules/OpenSankey`` — c'est-à-dire au
niveau OpenSankey base.

État interne du handler
-----------------------

``NodeEventsHandler`` — ``Elements/NodeEventsHandler.tsx``.

Trois nouveaux champs privés servent à suivre le verrou pendant la
durée d'un drag :

.. code-block:: typescript

   private _shift_lock_axis: 'x' | 'y' | null = null
   private _shift_acc_dx: number = 0
   private _shift_acc_dy: number = 0

- ``_shift_lock_axis`` : ``null`` tant que l'axe n'est pas figé, puis
  ``'x'`` ou ``'y'`` une fois le seuil franchi.
- ``_shift_acc_dx`` / ``_shift_acc_dy`` : mouvement cumulé depuis
  l'appui de Shift, utilisés à la fois pour franchir le seuil et pour
  choisir l'axe dominant.

``handleMouseDragStart``
------------------------

Réinitialise les trois champs à chaque début de drag, de sorte qu'un
nouveau geste démarre toujours en mode libre. Le reste de la logique
(snapshot des positions pour l'undo, calcul de la bounding box) est
exécuté comme avant, y compris quand Shift est enfoncée.

L'ancien court-circuit ``if (event.sourceEvent.shiftKey) return`` a été
supprimé : il cassait silencieusement l'undo pour tout shift+drag.

``handleMouseDrag``
-------------------

En tête de la méthode, avant toute logique de déplacement :

1. Si ``event.sourceEvent.shiftKey`` est vrai :

   - ``event.dx`` et ``event.dy`` sont accumulés dans
     ``_shift_acc_dx`` / ``_shift_acc_dy``.
   - Si ``_shift_lock_axis`` est ``null`` et que la norme au carré du
     cumul dépasse ``threshold_sq = 16`` (≈ 4 px), l'axe est figé :
     ``'x'`` si ``|acc_dx| >= |acc_dy|``, sinon ``'y'``.
   - ``new_dx`` / ``new_dy`` sont calculés :

     - axe ``'x'`` : ``new_dy = 0``
     - axe ``'y'`` : ``new_dx = 0``
     - axe ``null`` (seuil pas encore franchi) : les deux sont mis à
       ``0`` pour éviter que les premiers px ne fuient en diagonale.

2. Si ``shiftKey`` est faux et que l'état de verrou n'est pas vierge,
   les trois champs sont remis à zéro : relâcher Shift libère
   immédiatement le verrou.

3. Les ``new_dx`` / ``new_dy`` sont ensuite reportés sur l'objet
   ``event`` via ``Object.defineProperty`` :

   .. code-block:: typescript

      Object.defineProperty(event, 'dx', {
        value: new_dx, enumerable: true, configurable: true, writable: true
      })
      Object.defineProperty(event, 'dy', {
        value: new_dy, enumerable: true, configurable: true, writable: true
      })

   **Pourquoi pas une simple assignation ?** Dans ``d3-drag``, les
   propriétés ``dx`` / ``dy`` de ``DragEvent`` sont définies par
   ``Object.defineProperties`` **sans** ``writable: true`` (par défaut
   ``false``) mais avec ``configurable: true``. Une assignation directe
   lève ``TypeError: "dx" is read-only`` en mode strict. Comme les
   propriétés sont configurables, on peut en revanche les redéfinir
   via ``defineProperty``.

Propagation en aval
-------------------

Modifier ``event.dx`` / ``event.dy`` en tête de ``handleMouseDrag``
suffit à verrouiller tous les déplacements qui en dépendent :

- **Déplacement libre** des nœuds (selection-mode sans magnétisme) —
  la boucle ``nodes_selected.forEach(n => n.setPosXY(... + event.dx,
  ... + event.dy))`` prend automatiquement les valeurs modifiées.
- **Mode magnétique** — ``moveMagneticNode(event, ...)`` lit
  ``event.dx`` / ``event.dy`` ligne 597 pour mettre à jour
  ``_node_current_dx/dy`` avant la quantification sur la grille : le
  verrou est donc appliqué avant le snap.
- **Propagation conteneur** — ``Class_NodeElement.eventMouseDrag``
  (``Elements/Node.tsx``) appelle ``super.eventMouseDrag(event)`` (qui
  exécute ``handleMouseDrag`` et mute l'event) puis lit à son tour
  ``event.dx`` / ``event.dy`` pour déplacer les enfants contenus des
  dimensions en mode englobant. La mutation est en place sur la même
  référence, donc les enfants suivent aussi le verrou.

``handleMouseDragEnd``
----------------------

Le court-circuit ``if (event.sourceEvent.shiftKey) return`` a été
supprimé — l'étape d'undo et la ré-organisation automatique des I/O
s'exécutent désormais normalement pour un shift+drag. Les trois champs
de verrou sont remis à zéro en fin de drag pour ne pas polluer le
geste suivant.

Fichiers modifiés
-----------------

- ``opensankey/client/src/Elements/NodeEventsHandler.tsx`` — champs
  ``_shift_*``, logique de verrou dans ``handleMouseDrag``, suppression
  des court-circuits ``shiftKey`` dans ``handleMouseDragStart`` /
  ``handleMouseDragEnd``.

Décisions et alternatives écartées
----------------------------------

**Emplacement du verrou — handler vs. couche d3**
    Le verrou est implémenté dans ``NodeEventsHandler``, pas dans un
    wrapper au niveau de l'appel à ``d3.drag()`` dans
    ``Element.setEventsListeners``. Raison : le handler est le point
    unique par lequel passent tous les drags de nœuds et de
    conteneurs, et a déjà l'état nécessaire (référence au nœud,
    sélection courante). Un wrapper d3 aurait dû dupliquer la
    connaissance du mode sélection vs. édition.

**Seuil d'engagement — immédiat vs. différé**
    Une première version choisissait l'axe au tout premier event
    non-nul. Elle donnait parfois un verrou vertical sur un geste
    initialement horizontal à cause du jitter de la souris. Le seuil
    en norme au carré (``>= 16``, soit ~4 px) élimine ce problème au
    prix d'un délai négligeable ; pendant ce délai le nœud ne bouge
    pas du tout, ce qui donne un rendu plus propre qu'un nœud qui
    glisse en diagonale pendant 1 px puis se verrouille.

**Mutation de l'event vs. deltas locaux**
    Une alternative consistait à calculer ``effective_dx`` /
    ``effective_dy`` locaux et à les passer aux fonctions en aval.
    Elle aurait demandé de refactoriser ``moveMagneticNode`` et
    l'override ``Node.eventMouseDrag`` pour qu'ils acceptent des
    deltas explicites au lieu de lire l'event. La mutation via
    ``defineProperty`` est plus intrusive mais strictement locale et
    évite un refactor à risque.

Voir aussi
----------

- :doc:`/user/guides/presentation/verrouillage_position_uv` — documentation
  utilisateur
