PersistenceProcessDialog — convertisseur et chargeurs de fichiers
==================================================================

``PersistenceProcessDialog`` est le composant React unique qui pilote
toutes les interactions de chargement / sauvegarde / conversion de
fichiers : *Ouvrir Excel*, *Ouvrir JSON*, *Enregistrer Excel*,
*Enregistrer JSON*, *Charger un exemple*, *Convertisseur universel*.

Le composant vit dans :
``submodules/OpenSankey+/submodules/OpenSankey/opensankey/client/src/components/dialogs/PersistenceProcessDialog.tsx``.

Modes (``CONVERTER_CONFIGS``)
------------------------------

Le même composant ``UniversalFileConverter`` est instancié sous
plusieurs configurations, déclarées dans
``PersistenceProcessDialogConfigs.tsx`` → ``CONVERTER_CONFIGS`` :

.. list-table::
   :header-rows: 1
   :widths: 25 15 15 45

   * - Clé de config
     - Input
     - Output
     - Usage
   * - ``universal``
     - excel/json/blob
     - excel/json
     - Convertisseur de fichiers (les deux côtés requis)
   * - ``load_excel``
     - excel
     - json (non requis)
     - Ouvrir un fichier Excel dans le sankey
   * - ``load_json``
     - json
     - blob (non requis)
     - Ouvrir un fichier JSON dans le sankey
   * - ``save_json``
     - blob (non requis)
     - json
     - Enregistrer le sankey courant en JSON
   * - ``load_example_json``
     - example_json
     - json
     - Charger un exemple

Les attributs ``input.required`` / ``output.required`` pilotent
l'affichage des sélecteurs et le routage côté backend (un blob
correspond au sankey en mémoire — pas de fichier réel).

Layout
------

Le dialogue est structuré ainsi :

#. **Sélecteurs** (en haut, côte-à-côte si les deux sont requis) — un
   ``FileFormatSection`` par côté : choix de format + sélecteur de
   fichier (côté input).
#. **Bloc "Options"** — ``WrapperBoxSubSectionMenu`` collapsible
   (fermé par défaut). Contient des **tabs** (variant
   ``tabs_variant_preference_tags`` pour l'affichage horizontal).
#. **Bouton de lancement** + zone de statut / terminal.

Onglets dans "Options" (jusqu'à 3, conditionnels)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

- *Options d'entrée* — visible si ``input.required`` ET au moins une
  option dans ``INPUT_ATTRIBUTES_CONFIG[base]`` ou ``[input_format]``.
- *Options d'enregistrement* — symétrique côté output.
- *Mise en page* — visible quand on charge un fichier dans le sankey
  affiché (input excel ou output blob), masqué dans le mode
  *Convertisseur de fichiers* universel.

Chaque onglet rend un ``FileFormatSection`` en mode ``show_selector=false``,
qui présente une grille à 2 colonnes : *Base* (options communes à
tous les formats) + colonne format-spécifique (*Excel* ou
*Diagramme/JSON*).

Configuration des options (``*_ATTRIBUTES_CONFIG``)
----------------------------------------------------

Les options sont déclarées dans ``PersistenceProcessDialogConfigs.tsx``
sous deux dictionnaires : ``INPUT_ATTRIBUTES_CONFIG`` et
``OUTPUT_ATTRIBUTES_CONFIG``. Chaque dictionnaire est indexé par
``FormatType`` (``base``, ``excel``, ``json``, ``blob``,
``example_excel``, ``example_json``) et chaque option suit le schéma :

.. code-block:: typescript

   {
     default: <T>,
     type: () => <T>,
     labels: { en, fr, es?, de?, it? },
     tooltips: { en, fr, ... },
     visibilityConditions?: MenuCondition[]  // dépendance entre options
   }

Les ``visibilityConditions`` permettent de masquer une option enfant
tant qu'une parent n'est pas activée (ex : ``flux_matrix_with_data``
n'apparaît que si ``activate_flux_matrix=true``).

Options actuellement supportées
-------------------------------

Entrée — ``base`` (communes à tous les formats d'entrée)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Les huit options d'auto-correction suivent toutes le **même contrat
symétrique** (cf. ``SankeyExcelParser/classes/sankey_base.py`` →
``_symmetric_check_mat_balance`` et ``_symmetric_check_structure``) :

- ``<option>=false`` (défaut) + problème détecté → le chargement
  **abandonne** avec un message d'erreur nommant l'option à cocher.
- ``<option>=true`` + problème détecté → l'**autofix** est appliqué,
  l'accumulateur ``_auto_corrected_*`` correspondant est peuplé, et
  les cellules concernées sont surlignées en rouge dans le fichier
  corrigé écrit via ``IOExcel.write_sankey(highlight_autocorrect=
  True)``.

.. list-table::
   :header-rows: 1
   :widths: 10 30 60

   * - ID
     - Option
     - Description
   * - E1
     - ``create_new_nodes``
     - Nœud référencé dans les flux mais absent de l'onglet Noeuds.
   * - E2
     - ``create_new_flux``
     - Flux référencé dans un onglet secondaire (Données, Contraintes,
       Min-Max) mais absent des onglets de base (IO/TER, Résultats).
   * - E3
     - ``propagate_flux_to_children``
     - Flux existant sur un nœud parent mais sur aucun de ses enfants.
   * - E4
     - ``propagate_flux_to_parent``
     - Flux existant sur un nœud enfant mais pas sur son parent.
   * - E5
     - ``autofix_parenthood_mat_balance``
     - Parent ``mat_balance=1`` mais enfant à une autre valeur — les
       enfants sont alignés à 1 (stratégie *lift*).
   * - E6
     - ``autofix_constraint_redundancies``
     - Id de contrainte référençant plusieurs fois le même flux/data —
       seule la première occurrence est conservée.
   * - E7
     - ``allow_flux_to_descendant``
     - Flux reliant un nœud à un de ses descendants hiérarchiques
       (ou inversement) — autorisé et flaggé sur la sortie corrigée.
   * - E8
     - ``autonormalize_ratio_constraints``
     - Σα des contraintes ``ratio_flux`` de répartition d'un nœud
       proche de 1 (à ±1e-3 près) mais non égale — chaque ratio est
       rééchelonné par ``1/Σα``. Les sommes plus éloignées de 1
       déclenchent toujours un *warning* mais ne sont jamais
       auto-corrigées (cf. MFAProblem #220).

Entrée — ``excel`` (skipping de catégories d'onglets)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

- ``with_nodes_sheets`` (def. true) — désactiver pour ne pas charger
  ``NODES_SHEET``, ``NODES_AGG_SHEET``, ``PRODUCTS_SHEET``,
  ``PRODUCTS_AGG_SHEET``, ``SECTORS_SHEET``, ``SECTORS_AGG_SHEET``,
  ``EXCHANGES_SHEET``.
- ``activate_data_table`` (def. true) — désactiver pour ne pas
  charger ``DATA_SHEET``.
- ``activate_flux_matrix`` (def. true) — désactiver pour ne pas
  charger ``IO_SHEET`` / ``TER_SHEET``.

Le filtrage est appliqué dans
``SankeyExcelParser/classes/sankey_pandas.py`` →
``read_sankey_from_data_frame_list`` (suppression des clés du dict
``sheets_to_parse`` avant boucle).

Sortie — ``base``
~~~~~~~~~~~~~~~~~

- ``with_values`` — inclure les valeurs des flux dans l'export.
- ``save_only_visible_elements`` — exporter uniquement les éléments
  visibles dans le diagramme.

Sortie — ``excel``
~~~~~~~~~~~~~~~~~~

- ``keep_other_sheets`` (def. false) — copier l'input Excel vers
  l'output avant écriture pour préserver les onglets non-format
  (ajoutés par l'utilisateur). Uniquement effectif si l'input est
  Excel.
- ``rewrite_format_sheets`` (def. true) — pilote
  ``if_sheet_exists`` côté writer :

  - ``true`` → ``replace`` : les onglets format SankeyExcelParser
    déjà présents sont écrasés.
  - ``false`` → ``new`` (avec skip côté boucle) : les onglets
    présents sont laissés intacts ; seuls les nouveaux onglets
    (typiquement ``Résultats`` / ``Analyses`` post-solveur) sont
    ajoutés. Comportement par défaut historique de
    ``run_reconciliation.py``.
- ``with_sheet_formating``, ``with_nodes_sheets``,
  ``activate_data_table``, ``activate_flux_matrix`` — gating des
  catégories d'onglets côté écriture (existait déjà avant).
- ``data_table_with_all_flux``, ``flux_matrix_with_data`` — sous-options.
- ``data_table_only_leaf_flux`` (def. false) — sous-option de
  ``activate_data_table``. Restreint les lignes du ``DATA_SHEET``
  aux flux dont l'origine **et** la destination sont des nœuds
  feuilles (sans enfants dans aucune dimension d'agrégation).
  Filtre appliqué uniquement à l'écriture du ``DATA_SHEET`` ; les
  tables ``min_max`` / ``constraints`` / ``results`` / ``analysis``
  conservent l'intégralité de la hiérarchie.
- ``flux_matrix_only_leaf_flux`` (def. false) — sous-option de
  ``activate_flux_matrix``. Restreint les axes (lignes + colonnes)
  des matrices ``IO`` / ``TER`` aux nœuds feuilles. Pour le mode
  TER, les listes products/sectors dérivées de ``nodes_entries``
  héritent automatiquement du filtre.
- ``layout`` — émission de l'onglet ``layout``.

Sortie — ``json``
~~~~~~~~~~~~~~~~~

- ``keep_siblings`` — conserver les nœuds frères dans l'export.
- ``mode_compressed`` — produire un ``.zip`` au lieu d'un ``.json``.

Pipeline frontend → backend
----------------------------

Frontend (``UniversalFileConverter.generic_process``) :

#. Construit ``input_options`` et ``output_options`` (dicts JSON) à
   partir des états React liés aux options.
#. ``POST`` sur ``config.server_endpoint`` (par défaut
   ``/opensankey/convert/launch``) en ``multipart/form-data`` avec :

   - ``file`` (Blob) ou ``data`` (JSON inline pour input blob) ou
     ``file_name`` (pour les exemples).
   - ``input_format``, ``output_format`` (clés FormatType).
   - ``input_options``, ``output_options`` (deux JSON séparés).

Backend (``opensankey/server/views.py`` → ``launch_conversion`` puis
``conversion_thread``) :

#. **Toujours garder ``input_options`` et ``output_options`` séparés**
   — ils partagent des clés (ex. ``activate_data_table``,
   ``activate_flux_matrix``, ``with_nodes_sheets``) avec des sens
   opposés selon le côté. Un merge écraserait silencieusement la
   valeur input avec le default output.
#. ``io_input.load_sankey(input_file_name, **input_options)`` →
   transmet à ``read_sankey_from_data_frame_list`` qui filtre
   ``sheets_to_parse`` selon les flags.
#. Si ``output_format='excel'`` et ``keep_other_sheets`` (popé hors
   de ``output_options`` car non compris par ``write_sankey``) :
   ``shutil.copyfile(input → output)`` avant l'appel writer. Le
   writer détecte le fichier existant et passe en mode ``"a"``.
#. ``io_output.write_sankey(output_file_name, **output_options)``.

Pour les détails du writer Excel et la sémantique de
``rewrite_format_sheets`` côté SankeyExcelParser, voir
``io_base.py`` → ``write_in_excel_file`` /
``_write_in_excel_file`` / ``_create_formatting_metadata``.

Pièges connus
-------------

- **Ne pas merger input et output options dans la route Flask.** Bug
  historique fixé : ``options = {**input, **output}`` faisait que
  ``activate_data_table=false`` côté input était écrasé par la
  valeur défaut ``true`` côté output, et le parser tentait quand
  même de lire la feuille données.
- **Le tab "Mise en page" est masqué en mode universel** (``input.required &&
  output.required``) — il n'a pas de sens pour une conversion
  fichier-à-fichier sans rendu de sankey.
- **Le variant Chakra ``tabs_variant_preference_tags``** (défini
  dans ``client/src/chakra/TabStyle.tsx``) est obligatoire pour
  forcer ``tablist: { display: 'flex' }``. Le baseStyle Tabs
  d'OpenSankey met ``display: 'inherit'`` qui empile les onglets
  verticalement.
- **``mode_write`` (legacy SankeyExcelParser)** est conservé pour
  backward-compat (tests, ``run_reconciliation.py`` historique).
  Quand explicitement ``True``, supprime le fichier existant avant
  d'écrire pour reproduire l'ancien comportement "fresh write".
  Code nouveau doit utiliser ``rewrite_format_sheets``.

Références
----------

- Composant principal :
  ``opensankey/client/src/components/dialogs/PersistenceProcessDialog.tsx``
- Configurations & traductions :
  ``opensankey/client/src/components/dialogs/PersistenceProcessDialogConfigs.tsx``
- Rendu d'options auto-généré :
  ``opensankey/client/src/components/dialogs/PersistenceProcessDialogOptions.tsx``
- Endpoint Flask : ``opensankey/server/views.py`` →
  ``launch_conversion`` (ligne ~320) et ``conversion_thread``.
- Parser Excel : ``SankeyExcelParser/classes/sankey_pandas.py`` →
  ``read_sankey_from_data_frame_list``,
  ``write_sankey_as_data_frame_list``.
- Writer Excel : ``SankeyExcelParser/io_base.py`` →
  ``write_in_excel_file``, ``_write_in_excel_file``,
  ``_create_formatting_metadata``.
