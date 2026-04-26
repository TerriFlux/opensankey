Verrouillage de l'axe pendant le drag (Shift + glisser)
========================================================

Résumé
------

Quand on déplace un nœud à la souris en maintenant la touche **Shift**
enfoncée, le déplacement est contraint à un seul axe — soit horizontal
(U), soit vertical (V). L'axe retenu est celui sur lequel le mouvement
initial est dominant.

C'est le comportement classique utilisé dans les outils de dessin type
SankeyMatic : utile pour aligner un nœud sans en perturber l'autre
coordonnée.

Prérequis
---------

- Être en **mode Sélection** dans la barre d'outils à gauche de la zone
  de dessin (les modes Édition et Peinture de style n'activent pas le
  drag de nœud).
- Avoir un (ou plusieurs) nœud(s) à déplacer.

Accès
-----

1. Passer en mode Sélection dans la barre d'outils.
2. Maintenir la touche **Shift** enfoncée.
3. Cliquer-glisser sur un nœud (ou sur un nœud de la sélection
   courante).

Utilisation
-----------

- Le verrouillage s'établit dès que le mouvement cumulé dépasse un
  petit seuil (~4 px). L'axe choisi est celui dont la composante est
  dominante à ce moment — si l'utilisateur part plutôt vers la droite,
  le verrou est horizontal ; plutôt vers le bas, il est vertical.
- Tant que Shift reste enfoncée, toute composante sur l'autre axe est
  annulée.
- **Relâcher Shift** en cours de drag libère le verrou et le
  déplacement libre reprend immédiatement.
- **Ré-appuyer Shift** en cours de drag réinitialise l'accumulation et
  laisse un nouvel axe être choisi à partir du mouvement suivant.

Interactions avec les autres fonctionnalités
---------------------------------------------

- **Sélection multiple** : quand plusieurs nœuds sont sélectionnés, le
  verrou s'applique à l'ensemble — tous les nœuds suivent le même axe.
- **Mode magnétique** (grille) : le verrou est appliqué *avant* la
  quantification sur la grille ; les nœuds avancent donc uniquement
  par crans sur l'axe verrouillé.
- **Mode conteneur** (mode englobant) : quand on déplace un nœud parent
  dont les enfants sont englobés, les enfants suivent le déplacement
  verrouillé sur le même axe.
- **Undo / Redo** : un drag verrouillé est enregistré comme une étape
  d'annulation normale (position initiale vs. finale), exactement comme
  un drag libre.

Limitations connues
-------------------

- Le verrouillage ne s'applique qu'au drag de **nœuds** et de
  **conteneurs** en mode Sélection. Le drag de labels libres, le drag
  du fond de la zone de dessin (pan) et les drags en mode Édition ne
  sont pas concernés.
- Le seuil de ~4 px n'est pas configurable dans cette version.

Voir aussi
----------

- :doc:`/dev/features/verrouillage_position_uv` — description technique
