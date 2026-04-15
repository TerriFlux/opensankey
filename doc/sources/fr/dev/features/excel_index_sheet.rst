Feuille Index des fichiers Excel — principe de parsing
========================================================

SankeyExcelParser (le package Python d'I/O Excel utilisé par OpenSankey
et MFAProblem) supporte deux modes de localisation des onglets d'un
classeur d'entrée. Cette fiche explique les deux modes et la règle qui
garantit le round-trip (lecture → écriture → relecture) quand un
fichier utilise le mode *Index-driven*.

Deux modes de parsing
---------------------

Mode implicite
~~~~~~~~~~~~~~

Quand le classeur d'entrée ne contient pas de feuille ``Index``, le
parser cherche les onglets par leurs noms canoniques ou leurs synonymes
regex. Les patterns reconnus sont définis dans
``DICT_OF_SHEET_NAMES__RE`` (fichier
``SankeyExcelParser/io_excel_constants.py``).

Exemples de correspondances :

- ``Nodes``, ``Noeuds``, ``noeud`` → feuille de type ``nodes``
- ``Tags``, ``Etiquettes``, ``etiquette`` → feuille de type ``tags``
- ``Table emplois ressources``, ``TER``, ``Supply-use table`` →
  feuille de type ``ter``

L'inconvénient de ce mode : les noms d'onglets doivent suivre les
patterns connus, sinon le parser ne les trouve pas.

Mode Index-driven (explicite)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Quand le classeur d'entrée contient une feuille nommée ``Index`` (ou
un synonyme reconnu comme ``Indexe``, ``Indexation``, etc.), le parser
lit cette feuille en premier et l'utilise comme **table des matières**
du classeur : elle déclare pour chaque onglet présent son type
canonique.

L'utilisateur est alors libre de nommer ses onglets comme il veut
(``Mes données``, ``Flux pour le modèle``, etc.) : le parser les
retrouve grâce à l'Index sans avoir à deviner.

Schéma de la feuille Index
--------------------------

La feuille Index contient quatre colonnes — deux obligatoires et deux
facultatives.

.. list-table::
   :header-rows: 1
   :widths: 25 20 15 40

   * - Colonne (en-tête)
     - Clé interne
     - Obligatoire
     - Description
   * - ``Nom de la feuille``
     - ``sheet_name``
     - oui
     - Nom de la feuille tel qu'il apparaît dans le classeur Excel.
   * - ``Type de feuille``
     - ``sheet_type``
     - oui
     - Type canonique de la feuille : ``nodes``, ``data``, ``ter``,
       ``tags``, ``input_output``, ``constraints``, etc.
   * - ``Options de feuille``
     - ``sheet_options``
     - non
     - Options supplémentaires (ex : ``With-values`` sur une feuille
       TER pour demander la lecture des valeurs de flux).
   * - ``Description de la feuille``
     - ``sheet_description``
     - non
     - Texte libre expliquant le contenu de la feuille.

Les en-têtes français et anglais sont reconnus via le mapping regex
``DICT_OF_COLS_NAMES__RE[INDEX_SHEET]``.

Comportement à l'écriture
-------------------------

Écriture automatique quand l'entrée était Index-driven
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Quand le parser a lu un classeur d'entrée en mode Index-driven, le
writer **émet automatiquement une feuille Index dans le classeur de
sortie**. Cette règle garantit que le fichier reconcilié peut être
rechargé dans le même mode que le fichier d'entrée — sans quoi, les
flux utilisateur disparaîtraient du diagramme au rechargement.

Elle s'applique y compris après une réconciliation MFA : les nouvelles
feuilles générées par le solver (typiquement ``Résultats`` et
``Analyses des résultats``, et selon le cas ``Stocks Résultats`` /
``Stocks Analyses``) sont automatiquement ajoutées à l'Index en
sortie.

À l'inverse, si le classeur d'entrée n'avait pas de feuille Index, le
writer n'en émet pas — sauf si un kwarg spécifique est passé au
writer pour le demander explicitement (``separated_nodes_sheets``,
``flux_matrix_with_data`` combiné à des data tags).

Pas d'entrées fantômes
~~~~~~~~~~~~~~~~~~~~~~

L'Index de sortie ne liste **que les feuilles effectivement écrites**
dans le classeur. Aucune entrée ne pointe vers une feuille qui
n'existerait pas physiquement dans le fichier (ce qui était un bug
historique : une ligne ``Echanges`` apparaissait dans l'Index sans que
la feuille correspondante soit présente quand aucun nœud d'échange
n'existait dans le modèle).

Round-trip canonique
--------------------

Le round-trip lecture → écriture → relecture garantit que les
**valeurs** stockées dans l'Index (noms de feuilles, types
canoniques) sont préservées. Les noms de colonnes de l'Index peuvent
être normalisés à leur forme canonique anglaise (``sheet_name``,
``sheet_type``...) même si l'entrée utilisait des en-têtes français
(``Nom``, ``Type``...). Les en-têtes sont reconnus à la lecture
suivante via le mapping regex, donc le fichier reste lisible dans les
deux modes.

La préservation exacte du schéma d'en-têtes d'entrée (français,
anglais, mixtes, personnalisés) et des options de feuilles est une
évolution qui fait l'objet d'un ticket de suivi sur SankeyExcelParser,
à traiter ultérieurement.

Références
----------

- Spécification complète du format Excel et des feuilles :
  ``FormatExcel.md`` dans le submodule SankeyExcelParser.
- Constantes et patterns regex :
  ``SankeyExcelParser/io_excel_constants.py`` (variables
  ``INDEX_SHEET``, ``INDEX_SHEET_COLS``,
  ``DICT_OF_SHEET_NAMES__RE``, ``DICT_OF_COLS_NAMES__RE``).
- Code du parser/writer de l'Index :
  ``SankeyExcelParser/classes/sankey_pandas.py`` — méthodes
  ``xl_read_index_sheet``, ``create_blank_index_sheet``,
  ``add_to_index_sheet``, et ``write_sankey_as_data_frame_list``.
