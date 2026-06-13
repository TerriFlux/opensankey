Couleurs des flux
=================

Résumé
------

La couleur d'un flux peut être fixée directement, ou pilotée par une
**règle** : couleur héritée du nœud source ou cible, couleur d'une
étiquette (tag), ou couleur unique. C'est ce qui permet, par exemple,
de colorer tous les flux d'énergie en orange et tous les flux de
matière en bleu sans les régler un par un.

Prérequis
---------

- Avoir sélectionné un ou plusieurs flux dans l'onglet **Édition des
  flux**.
- Pour une coloration par étiquette : avoir défini un **groupe
  d'étiquettes de flux** et affecté les flux (voir
  :doc:`/user/concepts/tags_dimensions`).

Accès
-----

1. Menu de configuration, onglet **Édition des flux**.
2. Sélectionner les flux.
3. Sous-partie **Apparence**.

Options
-------

- **Couleur** et **opacité** du flux.
- **Règle de couleur** : selon le réglage, la couleur affichée provient
  du flux lui-même, du nœud à l'une de ses extrémités, ou de
  l'étiquette de flux active. L'ordre de résolution fait qu'une
  étiquette sélectionnée peut prendre le pas sur la couleur propre du
  flux.
- Coloration **par étiquette** : depuis la barre de navigation
  **Filtres > Flux**, activer le bouton bascule d'un groupe applique la
  palette de ce groupe à tous les flux concernés.

La forme du flux (orientation, courbure, flèche, position du centre)
relève de la présentation, pas de la couleur :
voir :doc:`/user/guides/presentation/flux_ancrage_ordre`.

Voir aussi
----------

- :doc:`/user/concepts/tags_dimensions` — différence tag / dimension et
  modes de filtrage
- :doc:`style_noeuds` — couleur des nœuds et option « garder la couleur »
- :doc:`styles_utilisateur` — figer une apparence dans un style
