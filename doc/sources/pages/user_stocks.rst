Stocks et bilan matière
=======================

Cette page décrit comment déclarer des **variations de stock** sur un nœud
dans le format Excel SankeyApplication, comment elles sont prises en compte
par le solveur de réconciliation MFAProblem, et où retrouver les résultats
réconciliés.

Vue d'ensemble
--------------

Un stock représente une accumulation (ou un puisage) de matière sur un nœud
qui n'apparaît pas comme un flux entrant ou sortant. Par défaut, le bilan
matière classique impose ::

    Σ(flux entrants) = Σ(flux sortants)

Avec la prise en compte des stocks, le bilan devient ::

    Σ(flux entrants) − Σ(flux sortants) − Δstock = 0

ce qui équivaut à dire qu'un Δstock positif (matière qui s'accumule dans un
réservoir sur le nœud) est traité comme un flux sortant supplémentaire, et
un Δstock négatif (puisage) comme un flux entrant supplémentaire.

Convention de signe
~~~~~~~~~~~~~~~~~~~

* ``stock_variation > 0`` : la matière s'accumule sur le nœud (stockage).
  Coefficient ``-1.0`` dans la ligne de bilan matière.
* ``stock_variation < 0`` : la matière est puisée du stock (déstockage).
  Le solveur peut réconcilier la valeur dans des bornes négatives sans
  intervention de l'utilisateur (voir :ref:`stocks-default-bounds`).

Le solveur traite ``stock_variation`` comme une **variable réconciliable**
au même titre que les flux : si une mesure et une incertitude sont fournies,
elle est ajustée à l'intérieur de ses bornes ; sinon elle est libre.

Format Excel — feuille ``stocks``
---------------------------------

La feuille ``stocks`` (alias acceptés : ``Stocks``, ``Stock``) déclare les
variations de stock sur les nœuds. Une ligne par couple (nœud, combinaison
de datatags).

.. list-table::
   :header-rows: 1
   :widths: 15 15 15 15 15 15 10

   * - node
     - [datatag1]
     - stock_initial
     - stock_variation
     - uncert
     - min
     - max
   * - Stock_FrA
     - acier
     - 100
     - 5
     - 0.1
     - -50
     - 200
   * - Stock_FrB
     -
     -
     - -3
     -
     -
     -

Détail des colonnes :

.. list-table::
   :header-rows: 1
   :widths: 25 75

   * - Colonne
     - Description
   * - ``node``
     - Nom du nœud sur lequel le stock est attaché. **Obligatoire.** Le
       nœud doit déjà exister (déclaré dans une feuille ``nodes`` ou
       implicitement par les flux).
   * - ``stock_initial``
     - Valeur du stock initial. **Informationnel uniquement** : non
       consommé par le solveur, conservé pour traçabilité et export.
       Optionnel.
   * - ``stock_variation``
     - Variation de stock observée (Δ). Positif = accumulation ; négatif =
       puisage. Optionnel : si vide, le solveur traitera la variable comme
       libre et fournira une valeur réconciliée.
       Alias acceptés : ``Variation de stock``, ``Stock variation``,
       ``delta stock``, ``stocks variations``.
   * - ``uncert``
     - Incertitude relative sur ``stock_variation`` (par exemple ``0.1``
       pour 10 %). Convertie en sigma absolu via
       ``σ = |stock_variation| × uncert``. Mêmes alias que pour la feuille
       ``data``. Optionnel.
   * - ``min``
     - Borne inférieure imposée au solveur. Optionnel — voir bornes par
       défaut ci-dessous.
   * - ``max``
     - Borne supérieure imposée au solveur. Optionnel — voir bornes par
       défaut ci-dessous.

Les colonnes datatags sont supportées exactement comme sur la feuille
``data`` : un même nœud peut avoir plusieurs lignes ``stocks`` avec des
combinaisons de tags différentes (par produit, par année, etc.). Le
solveur applique alors le bilan matière par combinaison de datatags.

.. _stocks-default-bounds:

Bornes par défaut
~~~~~~~~~~~~~~~~~

Si ``min`` est absent, le solveur utilise ``-MAX_VALUE`` comme borne
inférieure (au lieu de ``0`` qui est le défaut pour les flux). Cela permet
au solveur de réconcilier une variation de stock vers une valeur négative
(puisage) sans intervention de l'utilisateur. Si ``max`` est absent,
``+MAX_VALUE`` est utilisé.

Sortie du solveur — feuilles ``stocks_results`` et ``stocks_analysis``
----------------------------------------------------------------------

À la sortie de la réconciliation, MFAProblem produit deux feuilles
parallèles aux feuilles ``results`` et ``analysis`` qui existent pour les
flux :

Feuille ``stocks_results``
~~~~~~~~~~~~~~~~~~~~~~~~~~

Contient la valeur réconciliée de ``stock_variation`` pour chaque
StockData, plus les bornes de l'intervalle libre lorsque le solveur n'a
pas pu déterminer une valeur unique.

.. list-table::
   :header-rows: 1
   :widths: 20 20 20 20 20

   * - node
     - [datatag1]
     - stock_variation
     - free min
     - free max
   * - Stock_FrA
     - acier
     - 4.7
     -
     -

Feuille ``stocks_analysis``
~~~~~~~~~~~~~~~~~~~~~~~~~~~

Contient les mêmes colonnes que ``stocks_results`` plus la valeur d'entrée,
le sigma d'entrée, les bornes d'entrée, le ``nb_sigmas`` (distance entre
valeur réconciliée et valeur d'entrée en unités de sigma) et la
classification de la variable (mesurée, déterminable, libre, redondante).

C'est l'équivalent direct de la feuille ``analysis`` pour les flux.

Lecture côté front
~~~~~~~~~~~~~~~~~~

Les deux nouvelles feuilles sont enregistrées dans le pipeline de lecture
de SankeyExcelParser (``xl_read_stocks_results_sheet`` et
``xl_read_stocks_analysis_sheet``). Elles peuplent ``node._stock_results``
avec une instance ``StockData`` reconciled, dont :

* ``stock_variation`` contient la valeur réconciliée ;
* ``min_val`` / ``max_val`` contiennent les bornes du free interval ;
* ``analysis_vector`` contient ``[value_in, sigma_in, sigma_in%, lb_in,
  ub_in, nb_sigmas, classif]`` lorsqu'elles viennent de la feuille
  ``stocks_analysis`` ;
* ``alterego`` pointe vers la ``StockData`` d'entrée (et vice-versa) pour
  permettre au front de naviguer entre input et output.

Le front peut donc lire le résultat réconcilié via ::

    for node in sankey.nodes.values():
        for sr in node.stock_results:
            print(node.name, sr.stock_variation, sr.alterego.stock_variation)

Implémentation interne (référence)
----------------------------------

Pour les développeurs qui veulent comprendre où vit la logique :

.. list-table::
   :header-rows: 1
   :widths: 50 50

   * - Fichier
     - Rôle
   * - ``SankeyExcelParser/io_excel_constants.py``
     - Constantes ``STOCKS_SHEET``, ``STOCKS_RESULTS_SHEET``,
       ``STOCKS_ANALYSIS_SHEET`` et leurs alias FR/EN.
   * - ``SankeyExcelParser/classes/sankey_utils/data.py``
     - Classe ``StockData``. Hérite de ``ProtoData``. Expose
       ``data_value`` (alias de ``stock_variation``), ``sigma``,
       ``min_val``, ``max_val``, ``alterego``, ``analysis_vector`` —
       même interface que ``Data`` pour permettre au solveur de les
       traiter de manière uniforme.
   * - ``SankeyExcelParser/classes/sankey_utils/protos/node.py``
     - Attributs ``_stock_datas`` (entrée) et ``_stock_results`` (sortie).
   * - ``SankeyExcelParser/classes/sankey_pandas.py``
     - Lecteurs ``xl_read_stocks_sheet``, ``xl_read_stocks_results_sheet``,
       ``xl_read_stocks_analysis_sheet`` et écrivains symétriques.
   * - ``MFAProblem/mfa_problem/mfa_problem_main.py``
     - Indexation des ``StockData`` dans ``data2index`` après les flux.
   * - ``MFAProblem/mfa_problem/mfa_problem_format_io.py``
     - ``build_nodes_constraints()`` ajoute le terme ``-1.0`` sur la ligne
       de bilan matière du nœud porteur du stock. ``mfa_problem_output()``
       crée une ``StockData`` reconciled distincte attachée au nœud via
       ``add_stock_result()``.

Cas non gérés (limitations connues)
-----------------------------------

* **Stocks sur nœud parent (PR)** : ``build_nodes_constraints`` n'itère
  que sur les nœuds de type Base Child (BC) et Single Root (SR). Un stock
  attaché à un nœud parent (regroupement) n'est jamais visité par la
  contrainte de bilan matière. En pratique, les stocks doivent être placés
  sur les nœuds feuilles.
* **Stocks et contraintes ratio** : la prise en compte des stocks dans les
  contraintes ratio (ex. : « X % du flux entrant est stocké ») n'est pas
  implémentée. Les contraintes ratio ne voient pas les variables stock.
