L'éditeur en un coup d'œil
==========================

Cette page décrit la disposition de l'écran d'édition et les modes
de travail. Elle ne détaille pas chaque commande — ce rôle revient
aux :doc:`/user/guides/index`.

Disposition de l'écran
----------------------

L'éditeur est organisé autour de quatre zones :

**Barre du haut (menu principal)**
    Ouvrir, enregistrer, exporter (image, PDF, JSON), annuler /
    refaire, accès aux modals d'aide et de configuration globale.

**Canvas central**
    Zone SVG où le diagramme est dessiné. Zoomable à la molette,
    déplaçable au clic-glissé sur un espace vide, et où les nœuds
    et flux se manipulent directement à la souris.

**Menu latéral à onglets**
    Trois onglets de configuration :

    - ``data`` — les données du diagramme : nœuds, flux, valeurs,
      unités, imports.
    - ``style`` — l'apparence : couleurs, épaisseurs, styles
      réutilisables, légende, tags de couleur.
    - ``presentation`` — les structures transverses : tags de
      nœuds, tags de flux, tags de données, vues.

    Chaque onglet contient des sous-sections dépliables qui agissent
    soit sur la sélection courante, soit sur le diagramme entier.

**Barre du bas (modes et outils)**
    Sélection du **mode souris** courant (sélection / édition /
    peinture de style), boutons de positionnement et d'étirement
    des nœuds, raccourcis fréquents.

Un **tiroir de filtres** est accessible depuis le coin haut-gauche
du canvas. Il affiche les filtres disponibles sur les tags et les
valeurs — on l'utilise pour restreindre ce qui est visible sans
modifier le diagramme.

Modes de travail
----------------

L'éditeur a plusieurs modes, qui changent la façon dont le clic
souris est interprété :

**Mode sélection**
    Mode par défaut. Cliquer sélectionne, glisser déplace,
    Maj+clic ajoute à la sélection. C'est le mode pour réorganiser
    un diagramme existant.

**Mode édition**
    Activé via la barre du bas (raccourci ``F``). Cliquer sur le
    canvas crée un nœud ; glisser d'un nœud à un autre crée un
    flux. C'est le mode pour construire ou compléter un diagramme.

**Mode peinture de style**
    Permet de copier le style d'un élément vers un autre par clic
    successif. Pratique pour homogénéiser visuellement un
    diagramme déjà construit.

**Mode présentation (lecture seule)**
    Affichage sans menus de configuration : seul le canvas est
    visible. Pensé pour l'export et le partage en lecture, pas pour
    l'édition.

Modals fréquents
----------------

Plusieurs actions ouvrent une fenêtre modale dédiée plutôt qu'un
panneau dans le menu latéral, parce qu'elles demandent un peu plus
de place ou une saisie focalisée :

- import / export de fichiers (Excel, JSON, image, PDF) ;
- éditeur de texte enrichi pour les libellés ;
- gestionnaire de légendes ;
- assistants de configuration (vues, dimensions, tags).

Voir aussi
----------

- :doc:`anatomie_diagramme` — les objets que l'éditeur manipule
- :doc:`tags_dimensions` — les structures transverses pilotées
  depuis l'onglet ``presentation``
- :doc:`/user/guides/index` — chaque action de l'éditeur en
  détail
