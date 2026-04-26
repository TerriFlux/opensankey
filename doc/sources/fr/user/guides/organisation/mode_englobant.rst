Mode englobant (affichage simultané parent/enfants)
=====================================================

Résumé
------

Le mode englobant permet d'afficher en même temps un nœud agrégé
(parent) et ses nœuds désagrégés (enfants). Le parent apparaît comme
une enveloppe qui entoure visuellement ses enfants, et les flux sont
répartis entre parent et enfants selon la variante choisie.

C'est un troisième mode d'affichage, en plus de l'agrégation classique
(seul le parent est visible) et de la désagrégation classique (seuls
les enfants sont visibles).

Prérequis
---------

Le nœud doit appartenir à une dimension parent/enfant — c'est-à-dire
qu'une hiérarchie d'agrégation doit avoir été configurée préalablement
sur le diagramme, avec un nœud parent et un ou plusieurs enfants.

Accès
-----

1. Faire un clic droit sur un nœud parent ou sur l'un de ses enfants.
2. Ouvrir le sous-menu **Navigation hiérarchie**.
3. Ouvrir le sous-menu de la dimension concernée (un sous-menu par
   dimension existante).
4. Choisir l'une des deux entrées « Englober ».

Variantes
---------

Deux variantes sont disponibles selon la façon dont les flux doivent
être répartis entre parent et enfants :

**Englober (entrées → enfants, sorties ← parent)**
    Les flux entrants se connectent sur chaque enfant individuellement.
    Les flux sortants, eux, quittent le parent englobant d'un seul bloc.
    Utile quand on veut montrer la provenance détaillée des flux mais
    leur agrégation en sortie.

**Englober (entrées → parent, sorties ← enfants)**
    Variante symétrique : les flux entrants convergent vers le parent,
    et les flux sortants partent de chaque enfant individuellement.
    Utile pour l'usage inverse : agrégation en entrée, détail en sortie.

Dans les deux variantes, les **flux internes au groupe** (enfant vers
enfant de la même dimension) restent visibles à l'intérieur de
l'enveloppe.

Interactions
------------

- **Déplacer le parent englobant** : les enfants contenus suivent en
  bloc, comme lorsqu'on déplace un cadre géométrique contenant des
  nœuds.
- **Déplacer un enfant** : l'enveloppe du parent s'ajuste automatiquement
  pour continuer à l'inclure.

Sortir du mode
--------------

Depuis le même sous-menu **Navigation hiérarchie**, choisir
**Quitter mode englobant** (l'entrée n'apparaît que si le mode est
actif sur la dimension).

Il est également possible de basculer directement vers un autre mode
d'affichage (agrégation classique, désagrégation classique, ou l'autre
variante englobante) sans passer par le bouton « Quitter » : le nouveau
mode remplace automatiquement l'ancien.

Limitations connues
-------------------

- Le layout du parent est piloté par la géométrie des enfants (le
  parent est l'enveloppe calculée autour d'eux). Une variante où le
  parent serait pré-positionné par le layout Sankey comme un nœud
  normal et où les enfants seraient forcés à l'intérieur est prévue
  dans une évolution ultérieure.
- Les cas de dimensions multiples en conflit (un même nœud enfant dans
  plusieurs dimensions dont certaines en mode englobant et d'autres en
  forçage parent/enfant) n'ont pas été spécifiquement validés.
- L'undo / redo sur l'activation et la désactivation du mode englobant
  est partiel dans cette version initiale.

Voir aussi
----------

- :doc:`/dev/features/mode_englobant` — description technique du mode
  englobant
