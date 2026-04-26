Récapitulatif des fonctionnalités par licence
==============================================

Résumé
------

SankeyApplication regroupe trois ensembles de fonctionnalités qui
s'activent indépendamment selon la licence détenue par l'utilisateur
connecté :

- **OpenSankey+** : enrichissements visuels et productifs (vues
  multiples, export animé, image de fond, icônes personnalisées,
  étiquettes en texte enrichi, valeur cible sur les liens).
- **SankeySuite** : analyse de flux de matières (onglet AFM, équilibre
  matière sur les nœuds, colonnes calculées, résolution/réconciliation).
- **Dev** : fonctionnalités avancées réservées aux comptes développeur
  (stocks, agrégation/désagrégation multi-niveaux via *level tags*,
  expansion/contraction des nœuds).

Ces trois licences sont **indépendantes** : posséder SankeySuite
n'active pas automatiquement OpenSankey+, et inversement.

Accès au tableau dans l'application
-----------------------------------

1. Ouvrir le **modal d'accueil** de l'application.
2. Sélectionner l'onglet **Récap licences** dans la barre de
   navigation latérale.

L'onglet affiche la matrice complète des fonctionnalités gardées par
chacun des trois indicateurs internes (``has_sankey_plus``,
``has_sankey_afm``, ``has_sankey_dev``).

Matrice des fonctionnalités
---------------------------

.. list-table::
   :header-rows: 1
   :widths: 50 15 15 15

   * - Fonctionnalité
     - OpenSankey+
     - SankeySuite
     - Dev
   * - Catalogue de vues multiples
     - ✓
     -
     -
   * - Export animé (modale dédiée)
     - ✓
     -
     -
   * - Image de fond du diagramme
     - ✓
     -
     -
   * - Icônes personnalisées sur les nœuds
     - ✓
     -
     -
   * - Étiquettes en texte enrichi (rich text)
     - ✓
     -
     -
   * - Valeur cible sur les liens
     - ✓
     -
     -
   * - Onglet AFM (analyse de flux de matières)
     -
     - ✓
     -
   * - Colonnes calculées dans la feuille de calcul
     -
     - ✓
     -
   * - Équilibre matière sur les nœuds
     -
     - ✓
     -
   * - Résolution / réconciliation des flux (MFA)
     -
     - ✓
     -
   * - Stocks sur les nœuds
     -
     -
     - ✓
   * - Agrégation/désagrégation multi-niveaux (level tags)
     -
     -
     - ✓
   * - Expansion/contraction des nœuds (gauche/droite)
     -
     -
     - ✓

Maintenance
-----------

La matrice affichée dans l'application est définie en dur dans le
composant ``client/src/components/FeaturesMatrixSA.tsx``. Cette
documentation et ce composant doivent être mis à jour ensemble lorsque
de nouvelles fonctionnalités sont gardées par l'un des trois flags
``has_sankey_plus`` / ``has_sankey_afm`` / ``has_sankey_dev``.

La liste a été dérivée d'un balayage des points de garde (gates) dans
le client TypeScript des trois couches OS / OSP / SA. Pour retrouver
les sites concernés, ``grep`` les flags sur ``client/src``,
``submodules/OpenSankey+/client/src`` et
``submodules/OpenSankey+/submodules/OpenSankey/opensankey/client/src``.
