Mon premier diagramme Sankey (10 min)
=====================================

Bienvenue. Ce tutoriel guide la construction d'un petit diagramme
Sankey depuis zéro, sans aucun prérequis. À la fin, vous aurez un
diagramme à vous, sauvegardé et exporté.

Ce qu'on va construire
----------------------

On va modéliser la consommation électrique simplifiée d'une maison
sur un mois :

- une **production** électrique totale de 1000 kWh ;
- distribuée à la **maison** ;
- répartie entre **chauffage** (700 kWh) et **électroménager**
  (300 kWh).

C'est minimaliste, mais ça permet de toucher à tout : créer des
nœuds, tracer des flux, saisir des valeurs, choisir une unité,
sauvegarder, exporter.

.. TODO: capture du résultat final attendu (3 nœuds, 3 flux,
   valeurs et unité visibles)

Avant de commencer
------------------

- Ouvrir SankeyApplication dans un navigateur récent (Chrome,
  Firefox, Edge).
- Se connecter avec un compte disposant d'au moins une licence
  d'essai active. Si ce n'est pas le cas, voir
  :doc:`/user/guides/compte_licences/recap_licences`.

Étape 1 — Créer un diagramme vierge
-----------------------------------

Depuis l'écran d'accueil de l'application, choisir **Nouveau
diagramme** (ou équivalent — selon la licence, l'entrée peut
s'appeler « Nouveau Sankey » ou « Créer »).

Un canvas blanc s'ouvre, avec :

- la **barre du haut** (menu principal),
- la **barre du bas** (modes et outils),
- le **menu latéral à onglets** (data / style / presentation),
- le **canvas central**, vide pour l'instant.

.. TODO: capture du canvas vierge avec annotation des 4 zones

Étape 2 — Passer en mode édition
--------------------------------

Par défaut, l'éditeur est en **mode sélection** (qui ne permet pas
de créer des objets). On bascule en **mode édition** :

- soit en cliquant sur l'icône d'édition dans la barre du bas,
- soit avec le raccourci clavier ``F``.

L'icône change d'aspect pour indiquer le mode actif.

.. TODO: capture barre du bas, mode édition activé entouré

Étape 3 — Créer les trois nœuds
-------------------------------

En mode édition, **un clic sur le canvas crée un nœud**. On va en
créer trois, alignés horizontalement de gauche à droite.

1. Cliquer dans la partie gauche du canvas → un premier nœud
   apparaît. Renommer en ``Production``.
2. Cliquer plus à droite → un deuxième nœud. Renommer en
   ``Maison``.
3. Cliquer encore plus à droite, légèrement plus haut → un
   troisième nœud. Renommer en ``Chauffage``.
4. Cliquer un peu en dessous du précédent → un quatrième nœud.
   Renommer en ``Électroménager``.

Pour renommer un nœud, double-cliquer dessus (ou utiliser le menu
latéral ``data`` après l'avoir sélectionné).

.. TODO: capture des 4 nœuds positionnés et nommés, mode édition
   toujours actif

Étape 4 — Tracer les flux
-------------------------

Toujours en mode édition, **un cliquer-glisser d'un nœud vers un
autre crée un flux**.

1. Glisser de ``Production`` vers ``Maison``.
2. Glisser de ``Maison`` vers ``Chauffage``.
3. Glisser de ``Maison`` vers ``Électroménager``.

À ce stade, le diagramme a la bonne topologie mais les flux ont
tous la même épaisseur — on n'a pas encore saisi de valeurs.

.. TODO: capture des 3 flux tracés, sans valeurs

Étape 5 — Saisir les valeurs et l'unité
----------------------------------------

Repasser en **mode sélection** (cliquer sur l'icône sélection ou
appuyer à nouveau sur ``F``). On va maintenant configurer les
valeurs depuis l'onglet ``data`` du menu latéral.

**Définir l'unité du diagramme** :

1. Ouvrir l'onglet ``data``.
2. Trouver la section concernant les unités du diagramme.
3. Saisir ``kWh``.

**Saisir les valeurs des flux** :

1. Sélectionner le flux ``Production → Maison`` en cliquant
   dessus.
2. Dans le menu latéral, saisir la valeur ``1000``.
3. Répéter pour ``Maison → Chauffage`` (``700``) et
   ``Maison → Électroménager`` (``300``).

Au fur et à mesure, les épaisseurs s'ajustent automatiquement :
le flux entrant dans ``Maison`` est plus épais que chacun des
deux flux sortants, et la somme des deux sortants égale l'entrant.

.. TODO: capture du diagramme avec épaisseurs et étiquettes de
   valeur affichées

Étape 6 — Soigner le rendu
--------------------------

Deux ajustements rapides pour rendre le résultat lisible :

- **Activer l'affichage des valeurs sur les flux** depuis l'onglet
  ``style`` (ou ``data``, selon la version). Chaque flux porte
  alors son chiffre.
- **Repositionner les nœuds** par cliquer-glisser sur le canvas
  pour aérer la mise en page si nécessaire.

.. TODO: capture du diagramme propre, valeurs visibles

Étape 7 — Sauvegarder
---------------------

Dans la **barre du haut**, cliquer sur **Enregistrer**. Donner un
nom au diagramme, par exemple ``Conso maison — premier essai``.

Le diagramme est maintenant stocké côté serveur et accessible
depuis l'écran d'accueil au prochain démarrage.

.. TODO: capture de la modale d'enregistrement

Étape 8 — Exporter une image
----------------------------

Toujours dans la barre du haut, ouvrir le menu **Exporter** et
choisir **PNG** (ou **PDF** si on prévoit une impression).

Le fichier est téléchargé localement.

.. TODO: capture du menu d'export ouvert

Et après ?
----------

Vous avez un Sankey complet. À partir de là, plusieurs directions :

- **Comprendre le vocabulaire** que vous venez d'utiliser : voir
  :doc:`/user/concepts/anatomie_diagramme`.
- **Apprendre l'éditeur en détail** :
  :doc:`/user/concepts/editeur`.
- **Importer vos vraies données depuis Excel** :
  :doc:`depuis_excel`.
- **Aller vers de l'analyse de flux de matière** :
  :doc:`premiere_mfa`.

Voir aussi
----------

- :doc:`/user/concepts/index` — les concepts fondamentaux
- :doc:`/user/guides/index` — chaque action de l'éditeur en
  détail
