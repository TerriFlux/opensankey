

Edition noeuds
==============

Icon
----

Dans cet onglet, on gère l'insertion d'icones dans les noeuds. Au préalable il faut avoir charger une liste d'icones provenant d'icomoon dans le menu préférence.
Les différents paramètres de cet onglet sont :

* Sa **visibilité**
* L'**icon** que l'on veut afficher
* Sa **couleur**
* Son **ratio** : sa taille par rapport au noeud

Images
------
Dans cet onglet, on gère l'insertion d'image et du html dans les noeuds. Cette onglet est souvent utilisé pour l'insertion d'image dans les noeuds (d'où son nom) via l'éditeur wysiwyg *(what you see is what you get)*

.. image:: _static/node_image.PNG
   :align: center

Les différents paramètres de cet onglet sont :

   * La **visibilité** de l'*image*
   * Transformer l'éditeur wysiwyg en champs de **texte brut** pour écrire du html brut est être plus précis dans ce que l'on fait.


Zone de textes
==============

Dans cet onglet on gère les zone de textes que l'on peut placer où l'on veut. On peut aussi les utlisé pour repésenter des groupes d'élements sur le diagramme.

.. image:: _static/label_libre_exemple.PNG
   :align: center

Les paramètres modifiables des zones de textes sont :

.. image:: _static/zdt_wysiwyg.PNG
   :align: center

* Son **Titre**
* Un **éditeur de texte** avec des options de formatage de texte intégré (couleur,taille police,...)
* Un **bonton pour mettre à jour** les zone de textes avec ce qui il y a dans l'éditeur
* La **hauteur** de la zone de texte
* La **largeur** de la zone de texte
* La **couleur de fond** de la zone de texte
* **L'opacité de la couleur de fond**
* La **couleur de la bordure**
* Si la **bordure est transparente**


Vues (*Storytelling*)
=====================

Les vues sont d'autres diagrammes de sankey présent dans les données, elles sont généralement une copie des données principales avec quelques variables modifiées pour visualiser le sankey sous un autre angle.
La création de vue ce fait soit via le raccourcis clavier **Ctrl+X** soit dans le menu de navigation

Menu de configuration
---------------------

Dans le **menu de configuration** ,nous pouvons simplement :

   * **Editer le nom** de la vue
   * **Modifier son ordre** dans la liste des Vues
   * **Supprimer** la vue

.. image:: _static/menu_conf_view.PNG
   :align: center

Menu de navigation
------------------

.. image:: _static/navbar_view.PNG
   :align: center

Dans le menu de navigation des vues, nous pouvons :

   * Naviguer entres les vues avec les boutons **Suivant**, **Précédent**, **Maître** (pour retourner sur les données principale)
   * Créer une vue avec le boutons **ajout**
   * **Mettre-à-jour** une vue (lorsque vous modifiez les données d'une vue, si vous voulez sauvegarder les modifications apportées il faut soit faire un **Ctrl+S** soit cliquer sur le bouton **M-à-J** car si vous changez de vues il vous sera demandé de confirmer que vous souhaité changer de vue sans mettre à jour celle actuelle)
   * Naviguer entres les vues avec le **selecteur** de vue
   * Choisir si certaines variables sont hérités du sankey principale : Par défaut les vues sont des diagramme à part entière, cependant on peut chosiir certains attributs des vues dont leur valeur proviennent directement du maître ce qui entrainera lors d'une modification de de l'attribut dans le maitre la même modifiaction dans la vue (exemple: si dans le modale *Choisir variables hérité du sankey maître* on choisis que les attributs des noeuds sont hérités du maître alors lorsque l'on modifiera la couleur d'un noeud dans le maître alors le noeud avec le même id dans la vue aura la même couleur)
   * **Cloner** la vue : fait un double de la vue actuel
   * **Editer le nom** de la vue

De plus il est maintenant possible d'utiliser les vues comme source d'import pour la transformation de diagramme :

.. image:: _static/transf_view.PNG
   :align: center