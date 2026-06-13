Vues multiples
==============

Une **vue** est un autre diagramme Sankey présent dans les mêmes
données : généralement une copie du diagramme principal dont on a
modifié quelques variables pour le présenter sous un autre angle
(un scénario, un sous-périmètre, une mise en forme différente). Les
vues sont au cœur de la **narration** (*storytelling*) : on fait
défiler plusieurs vues pour raconter une analyse.

Maître et vues
--------------

Le diagramme de base est le **maître**. Chaque vue dérive du maître.
Par défaut, une vue est un diagramme **à part entière** : la modifier
n'affecte pas le maître. On peut toutefois choisir que certains
attributs soient **hérités du maître** — voir plus bas.

Créer et naviguer
-----------------

- Créer une vue : raccourci **Ctrl+X**, ou bouton *ajout* dans le menu
  de navigation des vues.
- Naviguer : boutons **Suivant**, **Précédent**, **Maître** (retour au
  diagramme de base), ou le **sélecteur** de vue.
- **Cloner** une vue, **éditer son nom**, **modifier son ordre** dans
  la liste, la **supprimer** (menu de configuration des vues).
- **Mettre à jour** : quand on modifie une vue, sauvegarder par
  **Ctrl+S** ou le bouton *M-à-J* ; sinon, changer de vue demande
  confirmation avant d'abandonner les modifications.

Héritage d'attributs
--------------------

Dans la modale *Choisir les variables héritées du Sankey maître*, on
sélectionne les attributs dont la valeur doit provenir du maître. Une
modification de cet attribut dans le maître se répercute alors dans la
vue. Exemple : si les attributs des nœuds sont hérités, changer la
couleur d'un nœud dans le maître change la couleur du nœud de même
identifiant dans la vue.

C'est ce mécanisme qui permet, à partir de quelques vues de base, d'en
**combiner** ou d'en **croiser** plusieurs (union, intersection de
périmètres) tout en gardant une mise en forme cohérente héritée du
maître.

Cas d'usage typiques
--------------------

- **Comparer des scénarios** : une vue par scénario, valeurs
  différentes, même structure.
- **Sous-périmètres** : une vue restreinte à une partie du diagramme.
- **Présentations** : même données, mise en forme adaptée (style rond,
  image de fond…).

Les vues peuvent aussi servir de **source d'import** pour la
transformation d'un diagramme.

Voir aussi
----------

- :doc:`tags_dimensions` — les étiquettes de vue (``view_taggs``)
- :doc:`/user/guides/style/styles_utilisateur` — partager une apparence
  entre vues via les styles
