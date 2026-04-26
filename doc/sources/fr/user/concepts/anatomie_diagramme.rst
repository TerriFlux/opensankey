Anatomie d'un diagramme
=======================

Avant de manipuler l'éditeur, il faut savoir ce qu'est un diagramme
Sankey du point de vue de SankeyApplication : quels objets le
composent, quel est leur rôle, et comment ils s'articulent entre
eux.

Vue d'ensemble
--------------

Un diagramme Sankey représente des **flux** entre des **nœuds**.
L'épaisseur de chaque flux est proportionnelle à une **valeur**, et
chaque valeur est exprimée dans une **unité** (par exemple ``tCO₂eq``,
``kWh``, ``t``, ``M€``).

C'est tout. Le reste du vocabulaire de l'application n'est qu'une
déclinaison de ces quatre notions de base.

Nœuds
-----

Un **nœud** est un rectangle qui représente une entité du système
analysé : un secteur, un procédé, un produit, un poste de
consommation, un acteur, etc. Selon le contexte d'analyse, un nœud
peut être :

- **source** ou **puits** (uniquement des flux sortants ou entrants),
- **intermédiaire** (à la fois entrant et sortant),
- **agrégé** ou **désagrégé** s'il appartient à une hiérarchie
  parent/enfant (voir :doc:`tags_dimensions`).

Chaque nœud porte un libellé textuel et peut porter d'autres
métadonnées (tags, position verrouillée, style, …).

Flux
----

Un **flux** (ou « lien ») est une bande courbe qui relie un nœud
source à un nœud cible. Il est orienté : il a toujours un sens
de circulation.

L'épaisseur du flux à l'écran est calculée à partir de sa valeur,
de sorte qu'à unité constante les épaisseurs se comparent
visuellement.

Valeurs et unités
-----------------

La **valeur** d'un flux est la quantité qui circule. Elle peut être
saisie directement, importée depuis un fichier Excel, ou calculée
par un solveur (voir :doc:`/user/guides/mfa/index`).

L'**unité** est rattachée au diagramme entier : tous les flux d'un
même diagramme sont supposés homogènes en unité. Si plusieurs unités
coexistent dans une même analyse, on les sépare en plusieurs vues
(voir :doc:`vues_multiples`).

Objets secondaires
------------------

En plus des nœuds et flux, un diagramme peut contenir :

**Libellés (containers)**
    Zones de texte annotant le diagramme. Elles peuvent flotter
    librement ou être rattachées à un nœud.

**Étiquettes de valeur**
    Affichage du chiffre porté par un flux ou un nœud, à proximité
    de l'objet. Elles sont activables/désactivables globalement ou
    individuellement.

**Légendes**
    Élément informatif récapitulant les codes de couleur et les
    échelles utilisées dans le diagramme.

**Styles**
    Des configurations visuelles nommées (épaisseur, couleur,
    bordure, police, …) que l'on peut appliquer en bloc à un nœud,
    un flux ou une légende, et réutiliser ailleurs.

Ce qui n'existe pas (volontairement)
------------------------------------

Pour éviter les confusions courantes :

- pas de « free labels » indépendants au sens d'un calque texte
  séparé : les annotations passent par les libellés (containers) ;
- pas d'images de fond ni de cadres géométriques libres ;
- pas d'axes : un Sankey n'est pas un graphe X/Y.

Voir aussi
----------

- :doc:`editeur` — comment ces objets sont manipulés dans
  l'interface
- :doc:`tags_dimensions` — comment ils sont organisés à grande
  échelle
- :doc:`glossaire` — définitions courtes
