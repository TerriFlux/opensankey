Forme et libellés des nœuds
===========================

Résumé
------

L'apparence d'un nœud se règle dans l'onglet **Édition des nœuds** du
menu de configuration, après avoir sélectionné un ou plusieurs nœuds.
Trois familles de réglages : la **forme** du nœud, son **libellé** (le
nom) et son **libellé de valeur** (le chiffre affiché).

Prérequis
---------

- Être en **mode Sélection** dans la barre d'outils.
- Avoir sélectionné au moins un nœud (la sélection multiple applique
  les mêmes réglages à tout le groupe).

Accès
-----

1. Ouvrir le menu de configuration (panneau latéral).
2. Onglet **Édition des nœuds**.
3. Sélectionner le ou les nœuds à modifier.
4. Déplier la sous-partie voulue : **Apparence**, **Libellés** ou
   **Libellés de valeur**.

Forme (sous-partie Apparence)
-----------------------------

- **Visibilité** de la forme.
- **Couleur** du nœud, et option *garder la couleur* quand une
  étiquette est sélectionnée (sinon le nœud prend la couleur de
  l'étiquette active — voir :doc:`couleurs_flux` pour la logique de
  coloration par tag).
- **Forme** : ellipse ou rectangle.
- **Largeur** et **hauteur minimum** : la taille réelle peut être plus
  grande, car un nœud grandit avec la somme de ses flux entrants /
  sortants.

Libellé (le nom du nœud)
------------------------

- **Visibilité** du libellé.
- Texte en **blanc** (utile quand le libellé est posé sur le nœud).
- **Fond de libellé** : un cartouche derrière le texte pour le rendre
  lisible par-dessus d'autres éléments — voir aussi
  :doc:`/user/guides/donnees/valeurs_unites` pour le fond du libellé de
  valeur.
- **Position verticale** et **position horizontale** par rapport au
  nœud (au-dessus, en dessous, à gauche, à droite, centré…).
- **Police** : gras, majuscules, italique, famille, **taille**.
- **Longueur des libellés** : seuil de retour à la ligne pour les noms
  trop longs.

Libellé de valeur (le chiffre)
------------------------------

- **Afficher la valeur** du nœud : le maximum entre la somme des flux
  entrants et la somme des flux sortants.
- **Position verticale** et **horizontale** de la valeur.
- **Taille de police** de la valeur.

Le **format** du nombre lui-même (notation scientifique, décimales,
unité) est traité dans :doc:`/user/guides/donnees/valeurs_unites`.

Logos, images et texte riche
----------------------------

Pour insérer une icône, une image ou du texte mis en forme dans un
nœud, utiliser les onglets **Icône** et **Images** : l'onglet Icône
insère un pictogramme (chargé au préalable depuis une liste IcoMoon
dans les préférences) avec couleur et ratio de taille ; l'onglet Images
ouvre un éditeur de texte riche (*WYSIWYG*) où coller une image ou
écrire du HTML.

Voir aussi
----------

- :doc:`couleurs_flux` — colorer les flux et les nœuds par règle
- :doc:`styles_utilisateur` — réutiliser une apparence sur plusieurs
  objets
- :doc:`/user/concepts/anatomie_diagramme` — les objets manipulés
