Viewers React — options d'intégration (embed)
================================================

Les composants ``ViewerOpenSankeyApp`` (paquet ``@terriflux/opensankey``) et
``ViewerSankeyApplication`` (paquet ``@terriflux/sankeyapplication``) permettent
d'embarquer un diagramme Sankey en lecture seule dans une page React. Ils
acceptent en props l'intégralité des options jusque-là réservées à l'objet
global ``window.sankey`` du mode *publish*.

Source de vérité : ``opensankey/client/src/types/PublishOptions.tsx``.

Précédence et mode static
-------------------------

- Les Viewers forcent toujours ``publish: true`` (mode static / lecture seule).
- Les **props passées au composant** ont priorité sur ``window.sankey``.
- Une clé non passée en prop garde la valeur déjà présente dans ``window.sankey``
  (ou son défaut si absente).
- Le merge a lieu pendant l'initialisation (``useState`` initialiseur), avant
  l'appel à ``getPublishOptions()``.

Liste des options
-----------------

Toutes les options sont optionnelles.

Données
~~~~~~~

.. list-table::
   :header-rows: 1
   :widths: 25 15 60

   * - Option
     - Type
     - Effet
   * - ``initial_data``
     - ``Type_AnyJSON``
     - Données du diagramme, chargées via ``fromJSON()`` au montage. ``Type_AnyJSON``
       (= ``Record<string, unknown>``) est permissif et accepte n'importe quel
       JSON parsé ; le Viewer cast vers ``Type_JSON`` en interne.
   * - ``diagram``
     - ``string``
     - URL d'un JSON à charger (alternative à ``initial_data``).
   * - ``diagram_layout``
     - ``string``
     - URL d'un layout à surimprimer sur le diagramme.
   * - ``diagram_layout_options``
     - ``string[]``
     - Liste de clés du layout à appliquer.

Mode édition
~~~~~~~~~~~~

.. list-table::
   :header-rows: 1
   :widths: 25 15 60

   * - Option
     - Défaut
     - Effet
   * - ``editable``
     - ``false``
     - ``true`` réactive l'édition et les menus de configuration même en publish.

Chrome / layout
~~~~~~~~~~~~~~~

.. list-table::
   :header-rows: 1
   :widths: 25 15 60

   * - Option
     - Défaut
     - Effet
   * - ``topbar``
     - ``true``
     - Affiche la barre supérieure (menus, dropdowns, branding).
   * - ``footer``
     - ``false``
     - Affiche le pied de page.
   * - ``toolbar``
     - ``false``
     - Affiche la barre d'outils latérale.
   * - ``embedded``
     - ``false``
     - ``true`` impose ``height: 100%`` (sinon hauteur = ``window.innerHeight``).
   * - ``recenter``
     - ``true``
     - Auto-recentre le diagramme à l'ouverture.

Branding
~~~~~~~~

.. list-table::
   :header-rows: 1
   :widths: 25 15 60

   * - Option
     - Type
     - Effet
   * - ``logo``
     - ``string``
     - Chemin/URL d'un logo à afficher dans la topbar.
   * - ``header``
     - ``string``
     - HTML brut injecté en haut de la topbar.

Filtres topbar
~~~~~~~~~~~~~~

.. list-table::
   :header-rows: 1
   :widths: 25 15 60

   * - Option
     - Défaut
     - Effet
   * - ``data_type``
     - ``true``
     - Affiche le filtre de type de données.
   * - ``data_type_intervals``
     - ``true``
     - Affiche le filtre d'intervalles temporels.
   * - ``value_filter``
     - ``true``
     - Affiche le filtre par valeur.

État initial
~~~~~~~~~~~

.. list-table::
   :header-rows: 1
   :widths: 25 20 55

   * - Option
     - Type
     - Effet
   * - ``position_mode``
     - ``'absolute' | 'proportional' | 'scale_adapted'``
     - Impose le mode de navigation/positionnement à l'ouverture (équivalent d'un
       clic dans la barre du bas : absolu, proportionnel/pourcentage, ou échelle
       adaptée). Valeur invalide ignorée.
   * - ``data_tag_selection``
     - ``Record<string, string>``
     - Présélectionne un data tag par groupe de data tags :
       ``{ groupe : tag }``. Le groupe et le tag se résolvent par **id ou par nom**.
       Un groupe ou tag introuvable est ignoré (``console.warn``).

Ces options sont appliquées après le chargement du diagramme (et de l'éventuel
``diagram_layout``) via ``Class_ApplicationData.applyPublishStateOptions()`` ; la
sélection des data tags est appliquée avant le mode de positionnement car les
modes proportionnel/échelle capturent leur référence sur le data tag courant.

Exemple :

.. code-block:: tsx

   position_mode="proportional"
   data_tag_selection={{
     "Année":  "2030",
     "Scénario": "tendanciel",
   }}

Multi-diagrammes
~~~~~~~~~~~~~~~~

``diagrams_list`` (anciennement ``sous_filieres`` — alias toujours accepté avec
warning console déprécié) ajoute un dropdown dans la topbar pour basculer entre
plusieurs diagrammes.

- Type : ``Record<string, string>``.
- Clé = libellé affiché dans le dropdown.
- Valeur = nom de base du fichier ; le viewer charge ``<valeur>.gz``.
- Si toutes les clés contiennent un ``/`` (ex. ``"Climat/CO2"``), un second
  dropdown apparaît, groupé par premier segment.

Exemple :

.. code-block:: tsx

   diagrams_list={{
     "Energie":    "diagram_energie",
     "Eau":        "diagram_eau",
     "Climat/CO2": "diagram_co2",
     "Climat/CH4": "diagram_ch4",
   }}

``diagrams_config`` — configuration par diagramme
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

- Type : ``Record<string, Record<string, unknown>>``.
- Clé = même libellé que dans ``diagrams_list``.
- Valeur = configuration appliquée au moment du changement de diagramme.

Clés actuellement consommées dans ``diagrams_config[name]`` :

.. list-table::
   :header-rows: 1
   :widths: 25 15 60

   * - Clé
     - Type
     - Effet
   * - ``data_type``
     - ``boolean``
     - Surcharge l'option globale ``data_type`` lors du chargement de ce diagramme.

Toute autre clé est stockée dans ``window.sankey[<name>]`` sans effet runtime
(extension future possible).

Exemple :

.. code-block:: tsx

   diagrams_config={{
     "Energie": { data_type: true },
     "Eau":     { data_type: false },
   }}

Rétrocompatibilité ``sous_filieres``
------------------------------------

L'ancienne clé ``window.sankey.sous_filieres`` (et la prop ``sous_filieres``)
restent acceptées : la première lecture déclenche un ``console.warn`` de
dépréciation, mais le contenu est utilisé exactement comme ``diagrams_list``.
La prop ``diagrams_list`` a priorité si les deux sont définies.

Exemple complet
---------------

.. code-block:: tsx

   import { createRoot } from "react-dom/client";
   import { ViewerSankeyApplication } from "@terriflux/sankeyapplication/dist/ViewAppSA";
   import { Type_AnyJSON } from "@terriflux/sankeyapplication/dist/deps/OpenSankey+/deps/OpenSankey/types/Utils";
   import initial_data from "./example.json";

   const root = createRoot(document.getElementById("root") as HTMLElement);
   root.render(
     <ViewerSankeyApplication
       initial_data={initial_data as Type_AnyJSON}
       topbar={true}
       toolbar={false}
       recenter={true}
       embedded={false}
       logo="logo-socle.png"
       header="<h1>Mon diagramme</h1>"
       data_type={true}
       data_type_intervals={true}
       value_filter={true}
       diagrams_list={{
         "Energie": "diagram_energie",
         "Eau":     "diagram_eau",
       }}
       diagrams_config={{
         "Energie": { data_type: true },
         "Eau":     { data_type: false },
       }}
     />,
   );

Équivalence ``window.sankey``
-----------------------------

Le même résultat peut s'obtenir en injectant ``window.sankey`` avant le rendu :

.. code-block:: html

   <script>
     window.sankey = {
       publish: true,
       topbar: true,
       toolbar: false,
       logo: "logo-socle.png",
       header: "<h1>Mon diagramme</h1>",
       diagrams_list: { "Energie": "diagram_energie", "Eau": "diagram_eau" },
       Energie: { data_type: true },
       Eau:     { data_type: false },
     };
   </script>

Les props sont la voie recommandée pour les intégrations React contrôlées ;
``window.sankey`` reste utile pour les pages HTML statiques générées par le
backend en mode publish.
