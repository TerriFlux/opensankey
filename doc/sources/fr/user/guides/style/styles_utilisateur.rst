Styles utilisateur
==================

Résumé
------

Un **style** regroupe sous un nom un jeu d'attributs d'apparence
(couleur, forme, police, position de libellé…). Chaque nœud et chaque
flux est rattaché à un style ; modifier le style change d'un coup tous
les objets qui l'utilisent. On peut créer plusieurs styles et les
combiner pour obtenir une mise en forme cohérente sans réglage objet
par objet.

Style et surcharge
------------------

Deux niveaux cohabitent :

- **Le style** (effet global) : tous les objets rattachés au style
  partagent ses valeurs. Édition dans la barre de navigation
  **Édition > Styles > Éditer le style des nœuds** (ou *des flux*).
- **La surcharge** (effet local) : dans l'onglet **Apparence** du menu
  de configuration, modifier un attribut le détache du style pour cet
  objet seul. Dans l'éditeur de style, les attributs qui diffèrent du
  style par défaut sont **surlignés** pour repérer ce qui a été
  personnalisé.

On peut **réinitialiser** les surcharges d'un objet pour qu'il reprenne
les valeurs de son style.

Accès
-----

1. Barre de navigation **Édition > Styles**.
2. Choisir **Éditer le style des nœuds** ou **Éditer le style des
   flux**.
3. Créer / renommer un style, régler ses attributs.
4. Rattacher des objets au style depuis l'onglet **Apparence** de leur
   menu d'édition.

Combiner plusieurs styles
-------------------------

En affectant différents groupes d'objets à différents styles, on
obtient plusieurs « familles » d'apparence dans le même diagramme (par
exemple un style « entrée » et un style « sortie »). C'est l'approche
recommandée pour des diagrammes cohérents et faciles à retoucher.

Voir aussi
----------

- :doc:`style_noeuds` — attributs d'apparence des nœuds
- :doc:`couleurs_flux` — apparence des flux
