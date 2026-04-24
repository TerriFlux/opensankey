<!-- Release notes orientées utilisateur de SankeyApplication.
     Servi tel quel à /WHATSNEW.md et rendu dans l'onglet « Nouveautés » de la modale d'accueil.
     Format : chaque bloc de langue commence par un marqueur de la forme <!- -LANG:xx-  -> (sans espaces),
     avec xx = code ISO 639-1 (fr, en). À chaque release, ajouter en tête de chaque bloc une section
     `## <date> — <titre>` rédigée pour l'utilisateur final (pas de chemin de fichier, pas de #issue,
     pas de jargon interne). Le changelog technique complet reste dans CHANGELOG.md à la racine. -->

<!-- LANG:fr -->

## Avril 2026

### Lecture et écriture de fichiers Excel

- **Refonte du dialogue d'ouverture / enregistrement / conversion de fichiers** : sélecteurs d'entrée et de sortie côte-à-côte, options regroupées dans un bloc repliable avec trois onglets *Options d'entrée*, *Options d'enregistrement* et *Mise en page*.
- **Nouvelles options de lecture** : possibilité d'ignorer à la lecture les onglets nœuds, l'onglet données ou les onglets TER/TES d'un fichier Excel.
- **Plus de « Dimension 1 » / « Dimension 2 » générés par défaut** : l'ouverture d'un fichier Excel ne crée plus automatiquement de groupes de tags de niveau à partir de la hiérarchie des nœuds. La hiérarchie parent-enfant reste en place, donc l'agrégation/désagrégation locale fonctionne toujours. Une nouvelle case à cocher « Générer les tags de niveau automatiques » dans les options d'entrée permet de rétablir l'ancien comportement au cas par cas.
- **Préservation des onglets utilisateur à l'enregistrement** : option pour conserver les onglets personnalisés du fichier d'entrée, et option pour réécrire uniquement les onglets au format SankeyExcelParser.
- **Export des matrices restreint aux nœuds feuilles** : nouvelle option pour ne garder dans le tableau de données et la matrice IO/TER que les flux entre nœuds sans enfants.

### Visualisation

- **Visite guidée enrichie (≈ 21 étapes)** : le bouton « Visite guidée » parcourt désormais l'ensemble de l'interface — chaque bouton du bandeau top individuellement, chaque groupe de la toolbar bas, le panneau de filtres et la séquence complète du menu de configuration droit. Si le diagramme est vide, la visite crée puis supprime automatiquement quelques nœuds/flux de démonstration.
- **Mode d'affichage englobant** : un nœud parent peut désormais être affiché comme un rectangle pointillé englobant ses enfants, avec deux variantes de répartition des flux. Accessible par clic-droit → *Navigation hiérarchie*.
- **Flux dégradés** : prise en charge de valeurs distinctes côté source et côté destination pour représenter des pertes ou des gains le long d'un flux.
- **Stocks et flux de recyclage** : un nœud dont les flux entrants et sortants diffèrent affiche désormais un libellé `entrée → sortie` explicitant l'écart.
- **Mode d'affichage configurable des totaux** : trois boutons (Σin / Σin→Σout / Σout) sur le libellé de valeur d'un nœud pour choisir ce qui est affiché.
- **Barres de défilement sur la zone de dessin** lorsque le zoom fait déborder le diagramme.

### Mise en page

- **Verrouillage de l'axe au drag d'un nœud** : maintenir **Shift** pendant le glissement contraint le mouvement à un seul axe (horizontal ou vertical), choisi automatiquement selon la direction initiale du drag. Relâcher Shift en cours de drag libère le verrou.
- **Verrouillage colonne/ligne d'un nœud** : deux champs « Colonne » et « Ligne » avec cadenas dans le menu d'apparence permettent d'épingler la position d'un nœud lors du recalcul automatique.
- **Persistance Excel de la colonne u et de la ligne v** : deux colonnes optionnelles « Colonne u » / « Ligne v » acceptées à l'import dans les onglets Noeuds, Produits et Secteurs.
- **Mise en page automatique unifiée** : même interface dans le menu contextuel et le dialogue d'import Excel, avec sélecteur *Centrer les nœuds* / *Minimiser les croisements*, champs d'écart horizontal/vertical, et options pour épingler les extrémités.
- **Réorganisation automatique des E/S à la fin d'un drag** : l'ordre des flux entrants/sortants d'un nœud déplacé (et de ses voisins) est recalculé selon leur nouvelle disposition spatiale. Un seul Ctrl+Z restaure l'ensemble.

### AFM et réconciliation

- **Intervalles, incertitude, min/max sur les flux** : nouveau type de donnée *intervalles*, champs min/max/incertitude relative persistés en JSON et synchronisés avec Excel. Panneau flux restructuré en onglets *Basique* / *AFM*.
- **Séparation type de données / affichage des intervalles** : les deux sélecteurs de la barre d'outils sont désormais indépendants. Le type d'affichage est rappelé dans la légende.
- **Stocks intégrés au bilan matière** : une variation de stock déclarée sur un nœud est traitée comme une variable réconciliable supplémentaire par le solveur, selon `Σ(entrants) − Σ(sortants) − Δstock = 0`. Deux nouvelles feuilles Excel de résultats (`stocks_results`, `stocks_analysis`) sont produites.

### Internationalisation

- **3 nouvelles langues** : espagnol, allemand et italien sur l'ensemble de l'interface (menus, modales, tooltips, raccourcis, carousel d'accueil, visite guidée, dialogues d'import/export).
- **Détection automatique de la langue du navigateur** parmi les 5 langues supportées (FR, EN, ES, DE, IT), avec fallback sur l'anglais.
- **Noms de styles par défaut traduisibles** : les styles créés automatiquement à l'import suivent la langue de l'interface. Les styles renommés manuellement sont préservés.

<!-- LANG:en -->

## April 2026

### Excel file read and write

- **Redesigned open / save / convert file dialog**: input and output selectors side by side, options grouped in a collapsible block with three tabs *Input options*, *Save options* and *Layout*.
- **New read options**: ability to skip node sheets, the data sheet, or TER/TES sheets when reading an Excel file.
- **No more "Dimension 1" / "Dimension 2" generated by default**: opening an Excel file no longer automatically creates level-tag groups from the node hierarchy. The parent-child hierarchy is still preserved, so local aggregation/disaggregation still works. A new "Auto-generate level tags" checkbox in the input options brings the old behavior back on demand.
- **Preserve user sheets on save**: option to keep custom sheets from the input file, and option to rewrite only SankeyExcelParser-formatted sheets.
- **Restrict matrix export to leaf nodes**: new option to keep only flows between leaf nodes in the data table and IO/TER matrix.

### Visualization

- **Richer guided tour (~21 steps)**: the "Guided tour" button now walks through the whole interface — each top-bar button individually, each bottom-toolbar group, the filters panel and the full right configuration menu sequence. If the diagram is empty, the tour creates and then removes a few demo nodes and flows automatically.
- **Container display mode**: a parent node can now be rendered as a dashed rectangle enclosing its children, with two flow-routing variants. Accessible via right-click → *Hierarchy navigation*.
- **Tapered flows**: support for distinct source and target values to represent losses or gains along a flow.
- **Stocks and recycling flows**: a node whose incoming and outgoing totals differ now shows an `input → output` label that makes the gap explicit.
- **Configurable total display mode**: three buttons (Σin / Σin→Σout / Σout) on a node's value label to choose what is shown.
- **Scrollbars on the drawing area** when the zoom pushes the diagram outside the visible frame.

### Layout

- **Axis lock while dragging a node**: holding **Shift** during drag constrains movement to a single axis (horizontal or vertical), chosen automatically from the initial drag direction. Releasing Shift mid-drag releases the lock.
- **Column/row lock on a node**: two "Column" and "Row" fields with padlock buttons in the appearance menu let you pin a node's position during automatic recomputation.
- **Excel persistence of column u and row v**: two optional columns "Column u" / "Row v" accepted on import in the Nodes, Products and Sectors sheets.
- **Unified automatic layout**: same interface in the context menu and the Excel import dialog, with a *Center nodes* / *Minimize crossings* selector, horizontal/vertical gap fields, and options to pin endpoints.
- **Automatic I/O reordering at drag end**: incoming/outgoing flow order of a dragged node (and its neighbors) is recomputed from the new spatial layout. A single Ctrl+Z restores everything.

### AFM and reconciliation

- **Intervals, uncertainty, min/max on flows**: new *intervals* data type, min/max/relative-uncertainty fields persisted in JSON and synced with Excel. Flow panel split into *Basic* / *AFM* tabs.
- **Separation of data type and interval display**: the two toolbar selectors are now independent. The display type is recalled in the legend.
- **Stocks integrated into mass balance**: a stock change declared on a node is treated as an extra reconciliation variable by the solver, following `Σ(inputs) − Σ(outputs) − Δstock = 0`. Two new Excel result sheets (`stocks_results`, `stocks_analysis`) are produced.

### Internationalization

- **3 new languages**: Spanish, German and Italian across the whole UI (menus, modals, tooltips, shortcuts, welcome carousel, guided tour, import/export dialogs).
- **Automatic browser language detection** among the 5 supported languages (FR, EN, ES, DE, IT), with English fallback.
- **Translatable default style names**: styles created automatically on import follow the current UI language. Manually renamed styles are preserved.
