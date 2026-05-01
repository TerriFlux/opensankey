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
4. Choisir l'action **Englober** dans le sélecteur, puis la variante
   souhaitée.

Lorsqu'un nœud est déjà englobé par un parent, le sous-menu de cette
dimension est seul affiché — les autres dimensions sont masquées tant
que le mode englobant est actif (les actions sur d'autres dimensions
deviendraient imprévisibles).

Variantes
---------

Quatre variantes sont disponibles selon la façon dont les flux doivent
être répartis entre parent et enfants :

**Englober (entrées enfants → sortie parent)** — ``in_children_out_parent``
    Les flux entrants se connectent sur chaque enfant individuellement.
    Les flux sortants quittent le parent englobant d'un seul bloc.
    Utile pour montrer la provenance détaillée puis l'agrégation en
    sortie.

**Englober (entrée parent → sorties enfants)** — ``in_parent_out_children``
    Variante symétrique : les flux entrants convergent vers le parent,
    les flux sortants partent de chaque enfant individuellement.

**Englober (entrées + sorties enfants)** — ``in_children_out_children``
    Toutes les connexions externes passent par les enfants. Le parent
    n'est qu'une enveloppe visuelle, sans flux propre.

**Englober (entrées + sorties parent)** — ``in_parent_out_parent``
    Toutes les connexions externes passent par le parent. Les enfants
    n'ont aucun flux visible — ils restent des boîtes internes pour
    illustrer la composition.

Dans toutes les variantes, les **flux internes au groupe** (enfant
vers enfant de la même dimension) restent visibles à l'intérieur de
l'enveloppe.

Englobement emboîté
-------------------

Un nœud lui-même englobé peut à son tour être englobé sur ses propres
enfants. Quand on ouvre le sélecteur d'englobement sur un tel nœud :

- Le défaut du dropdown reprend automatiquement la variante du parent
  englobant.
- Les autres variantes sont **grisées et non sélectionnables** : le
  contrat visuel hérité (par exemple « entrées + sorties parent »)
  doit être respecté à tous les niveaux pour rester cohérent.

Lorsqu'on applique un englobement sur un sous-niveau, tous les
ancêtres englobants sont automatiquement re-empilés et leur enveloppe
re-calculée pour intégrer les nouveaux nœuds visibles.

Interactions avec désagrégation et expansion
--------------------------------------------

**Désagréger un nœud englobé**
    Le nœud désagrégé disparaît visuellement, ses sous-enfants
    apparaissent à sa place dans la pile englobante. Le cadre
    géométrique de l'ancêtre se redimensionne automatiquement et les
    flux des sous-enfants héritent du contrat container_mode du
    parent englobant (ex. en ``in_parent_out_parent`` ils restent
    masqués au profit du parent).

**Expansion latérale (gauche/droite) sur un nœud englobé**
    Les clones d'expansion latérale apparaissent à droite ou à
    gauche du master, à un tiers de l'espacement de colonne pour
    rester compacts. Ils s'intègrent au cadre géométrique de
    l'ancêtre (l'enveloppe les inclut, le drag les emporte).
    Contrairement aux sous-enfants désagrégés, **les flux des clones
    d'expansion restent visibles** dans toutes les variantes
    container_mode — l'expansion étant une demande explicite de
    l'utilisateur de voir le détail.

Interactions générales
----------------------

- **Déplacer le parent englobant** : les enfants suivent en bloc.
- **Déplacer un enfant** : l'enveloppe s'ajuste automatiquement et
  la propagation se fait sur tous les ancêtres englobants emboîtés.
- **Modifier la valeur d'un flux** : la taille des nœuds (parent
  englobant comme enfants masqués) suit dynamiquement, sans
  redimensionnement figé.

Sortir du mode
--------------

Depuis le même sous-menu **Navigation hiérarchie**, choisir
**Quitter mode englobant** (l'entrée n'apparaît que si le mode est
actif sur la dimension).

À la sortie, le parent retrouve sa taille naturelle calée sur ses
flux propres — le redimensionnement est dynamique, pas piloté par
une hauteur minimale persistante.

Il est également possible de basculer directement vers un autre mode
d'affichage (agrégation classique, désagrégation classique, ou autre
variante englobante) sans passer par le bouton « Quitter » : le
nouveau mode remplace automatiquement l'ancien.

Limitations connues
-------------------

- Les cas de dimensions multiples en conflit (un même nœud enfant
  dans plusieurs dimensions dont certaines en mode englobant et
  d'autres en forçage parent/enfant) n'ont pas été spécifiquement
  validés.
- L'undo de désagrégation/expansion utilise un snapshot full-JSON
  pour ces opérations complexes ; les performances peuvent être
  perceptibles sur de gros diagrammes.

Voir aussi
----------

- :doc:`/dev/features/mode_englobant` — description technique du mode
  englobant
