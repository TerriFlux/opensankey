<!-- Release notes orientées utilisateur de SankeyApplication.
     Servi tel quel à /WHATSNEW.md et rendu dans l'onglet « Nouveautés » de la modale d'accueil.
     Format : chaque bloc de langue commence par un marqueur de la forme <!- -LANG:xx-  -> (sans espaces),
     avec xx = code ISO 639-1 (fr, en). À chaque release, ajouter en tête de chaque bloc une section
     `## <date> — <titre>` rédigée pour l'utilisateur final (pas de chemin de fichier, pas de #issue,
     pas de jargon interne). Le changelog technique complet reste dans CHANGELOG.md à la racine. -->

<!-- LANG:fr -->

## v1.1.7 — Juin 2026

### Détacher les panneaux dans des fenêtres séparées

Depuis la 1.1.5, diagramme, tableur et documentation cohabitent dans une grande zone partagée. La 1.1.7 va plus loin : plusieurs panneaux peuvent désormais être **détachés dans des fenêtres indépendantes**, pour organiser son espace de travail selon ses écrans.

- **Panneau de configuration détachable.** L'apparence des nœuds, flux et étiquettes peut s'éditer dans sa propre fenêtre, à côté du diagramme — idéal sur un second écran, sans rogner la zone de dessin.
- **Documentation détachable.** On lit ou rédige ses notes dans une fenêtre dédiée pendant qu'on travaille sur le diagramme.
- **Sankey unitaire docké ou détaché.** Le focus sur un nœud s'affiche au choix dans la grande zone à côté du diagramme ou détaché en fenêtre, avec un nœud central de taille homogène d'un focus à l'autre et des libellés mieux mis en page.

### Accès plus direct aux données

- **Sélecteur de data tag en barre du haut.** Le choix de l'année / du territoire / de la donnée est désormais accessible directement en haut de l'écran, en tout contexte.
- **Versions et nouveautés dans l'application.** Un accès aux **versions archivées** et une page **changelog** intégrée permettent de retrouver l'historique et de pointer une version précise ; l'info-bulle de version indique la date et le repère de build.

### Corrections de fiabilité

- **Plus de flux fantômes en changeant d'année.** Les flux qui apparaissaient ou disparaissaient indûment en parcourant les dataTags ont été éliminés, et la structure d'un diagramme ne « déteint » plus d'une année sur l'autre.
- **Stocks multi-données fiabilisés.** Un diagramme avec des stocks portant plusieurs familles de données est désormais relu fidèlement après enregistrement (plus de perte ni d'incohérence au rechargement).
- **Cadenas des flux d'entrée/sortie préservé** lors du déplacement d'un nœud, et **échelle des flux conservée** après une complétion ou une réconciliation.
- **Ouverture plus robuste** : nœuds parents absents qui n'étaient pas recréés à tort, import de fichiers SankeyMATIC accentués corrigé sous Windows, et divers ajustements d'affichage (menus, toolbars, légendes).

## v1.1.5 — Juin 2026

### Une application complètement intégrée : tableur + diagramme + documentation

C'est le grand changement de cette version. OpenSankey n'oblige plus à passer par Excel pour saisir ou corriger les données : un **tableur** et un **panneau de documentation** s'affichent désormais à côté du diagramme. On choisit ce que l'on veut voir — diagramme seul, tableur seul, documentation seule, ou tout côte à côte — avec des séparateurs déplaçables.

- **Tableur intégré.** Un classeur à onglets (Flux, Nœuds, Données, Étiquettes, Stocks, Ratios, Chaînage des stocks) calqué sur le format Excel habituel, éditable directement dans l'application : les modifications sont reportées sur le diagramme. Sélecteur de colonnes optionnelles façon filtre Excel, largeur de colonnes ajustée automatiquement, et modale « Ajouter une contrainte » pour les ratios de flux et de stock. Plus besoin d'ouvrir le fichier dans un tableur externe pour un simple ajustement.
- **Documentation du diagramme.** Un onglet « Doc » offre un éditeur Markdown avec aperçu (modes édition / aperçu / côte à côte), le support des équations LaTeX (rendu KaTeX) et l'insertion d'images. La documentation est enregistrée **dans le fichier du diagramme** : elle voyage avec lui et n'a plus à être maintenue à part.
- **Affichage côte à côte (split-view).** Diagramme, tableur et documentation peuvent être affichés en même temps, avec des séparateurs déplaçables et plusieurs dispositions (doc à droite, à gauche, au-dessus ou en dessous du tableur, ou en bandeau bas). Le diagramme se recadre automatiquement dans l'espace restant.

### Explorer les données derrière chaque flux

- **Détail des flux enfants dans le tooltip.** Survoler un flux qui relie des nœuds regroupés (par essences, par propriétés…) ouvre un onglet « Données » listant les flux sous-jacents jusqu'aux feuilles, **regroupés par axe d'agrégation** — un tableau par dimension, avec pour chaque flux enfant son origine, sa destination, sa valeur et sa part (%) dans le flux parent.
- **Séries par année / région.** Quand un flux porte plusieurs combinaisons de données (Année, région…), des onglets « Séries » donnent sa valeur — et celle de ses flux enfants — pour chaque combinaison, présentées en colonnes. Idéal pour comparer plusieurs années ou territoires d'un coup d'œil.
- **Tooltips épinglables, déplaçables et redimensionnables.** Tout tooltip (nœud ou flux) peut être déplacé en glissant son en-tête, épinglé d'un bouton punaise pour rester ouvert (lecture, comparaison, capture) et redimensionné. Les noms longs de tags ne sont plus tronqués.

### Réconciliation et bilan matière

- **Échanges produit/secteur dans les territoires.** Un nœud d'échange peut désormais être typé produit OU secteur selon son rôle dans la matrice emplois/ressources, et n'apparaître que dans une seule des deux matrices sans erreur de chargement. À la réconciliation, les flux d'import/export sont reconstruits et le diagramme se complète automatiquement. Une valeur saisie dans une colonne ou une ligne sans en-tête est désormais signalée (avertissement) au lieu d'être ignorée silencieusement.
- **Les bornes « illimitées » s'affichent comme telles.** Fini le plafond fantôme à 500 000 000 sur les flux libres : une borne non renseignée reste réellement illimitée, et les cellules correspondantes sont vides au lieu d'afficher un grand nombre. Les anciens fichiers portant cette valeur héritée sont nettoyés automatiquement après un aller-retour ouverture / enregistrement.
- **Compléter le diagramme — colonne « Valeur complétée ».** L'onglet *Solveur* du dialogue de réconciliation propose deux cases, « Réconcilier » et « Compléter (sans redondance) ». Activées ensemble, elles produisent côte à côte, dans la feuille d'analyse, la valeur réconciliée et une valeur complétée qui préserve les mesures et ne calcule que les flux inconnus.

### Lecture et écriture Excel

- **Ignorer la mise en page sauvegardée à l'ouverture.** Une nouvelle case « Onglet mise en page » (cochée par défaut) permet, décochée, de repartir d'une disposition propre recalculée automatiquement plutôt que des positions enregistrées dans le fichier.
- **Format des feuilles de nœuds à l'export.** Un sélecteur choisit la disposition des feuilles de nœuds à l'enregistrement : automatique, feuille unique, Produits / Secteurs / Échanges, ou nœuds agrégés.
- **Charger un fichier dans la seule vue courante.** Depuis une vue, l'import Excel peut ne remplir que la vue active, sans réinitialiser le diagramme maître ni les autres vues.

### Mise en page et confort

- **Verrou de taille.** Un bouton de la barre du bas fige hauteur, largeur et zoom : le cadrage ne change plus en parcourant les dataTags (années…), idéal pour comparer ou capturer des images homogènes.
- **Forcer le tracé d'un flux en trait** via un cadenas dans le panneau d'apparence, et meilleur rendu automatique des flux très inclinés (plus de chevauchement indu).
- **Barre de séquence des dataTags plus discrète** et **menu d'apparence des flux homogénéisé** (boutons de même taille, nouvelles icônes Structure / Courbe).
- **Génération de vues unitaires repensée** (OpenSankey+) : dialogue déplaçable que l'on peut garder ouvert en travaillant sur le diagramme, et import de plusieurs fichiers Excel à la suite (les sources s'accumulent).

### Corrections

- **Dialogues de traitement plus clairs** : le bandeau indique l'opération réellement en cours (Ouvrir / Éditer / Réconcilier / Compléter) dans votre langue, et la détection de fin / d'échec est fiabilisée.
- **Panneau de configuration lisible sur petites fenêtres** : la colonne de droite ne tronque plus ses contrôles en deçà d'une certaine largeur.

## v1.1.4 — Mai 2026

### Mode englobant — refonte

- **Sizing dynamique** : un nœud parent affiché comme cadre pointillé autour de ses enfants suit désormais leur taille en temps réel — plus de redimensionnement figé. À la sortie du mode, le parent retrouve aussitôt sa taille calée sur ses propres flux. Modifier la valeur d'un flux met l'enveloppe à jour à la volée.
- **Englobement emboîté** : un nœud déjà englobé peut être englobé à son tour sur ses propres enfants. Le mode du parent est repris automatiquement par défaut au sous-niveau, et les variantes incompatibles sont grisées pour garder une mise en scène cohérente.
- **Désagrégation et expansion latérale sous englobé** : désagréger un nœud englobé fait apparaître ses sous-enfants à sa place dans la pile englobante ; les clones d'expansion s'intègrent au même cadre géométrique sans déborder.
- **Drag transitif** : déplacer un enfant met à jour l'enveloppe de tous les ancêtres englobants à chaque cran de drag, plus seulement la boîte immédiate.

### Visualisation

- **Valeur ancrée au libellé d'un nœud** : un nouveau bouton cadenas, à droite des huit boutons d'alignement du panneau d'apparence, permet d'ancrer la valeur d'un nœud sur son libellé plutôt que sur sa forme. Lorsque le fond du libellé est visible, il englobe désormais libellé et valeur d'un seul tenant. Si le libellé n'est pas affiché, la valeur disparaît avec lui.

### Mise en page

- **Styles d'extrémité automatiques** : les nœuds sources et puits reçoivent des styles dédiés qui positionnent leur libellé à gauche ou à droite, sans plus écraser les réglages manuels du label.

### Corrections

- **Undo des expansions latérales** : Ctrl+Z restaure désormais proprement les opérations *Expansion à gauche / à droite*.
- **Redo cohérent sur agréger / désagréger** : le redo d'une agrégation puis désagrégation n'est plus perdu après un undo.
- Corrections internes de stabilité pour l'intégration du Viewer dans des applications tierces.

## v1.0.x — Avril 2026

### Export et communication

- **Export animé des vues** (OpenSankey+) : nouvelle entrée *Animation...* dans le menu **Exporter → Toutes les vues**. Modale déplaçable qui permet de choisir les vues à inclure et leur ordre, la durée par vue, le DPI et un mode de boucle (une fois / infinie / aller-retour). Trois formats au choix : **GIF animé** (compatibilité universelle), **WebM** (vidéo, meilleure qualité que le GIF) et **séquence PNG zippée** (frames numérotées). Le master n'est jamais inclus dans l'animation. Les exports PNG / PDF simples (vue courante) restent libres avec watermark *« réalisé avec OpenSankey.fr »* ; l'animation, comme les exports multi-vues PNG zip et PDF fusionné, nécessite la licence OpenSankey+.
- **Sous-menu Toutes les vues** : les exports multi-vues (PNG zip, PDF fusionné, Animation) sont désormais regroupés sous une section nommée dans le menu Exporter, séparée des exports vue courante (PNG, PDF, SVG).

### Lecture et écriture de fichiers Excel

- **Refonte du dialogue d'ouverture / enregistrement / conversion de fichiers** : sélecteurs d'entrée et de sortie côte-à-côte, options regroupées dans un bloc repliable avec trois onglets *Options d'entrée*, *Options d'enregistrement* et *Mise en page*.
- **Nouvelles options de lecture** : possibilité d'ignorer à la lecture les onglets nœuds, l'onglet données ou les onglets TER/TES d'un fichier Excel.
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
- **« Ajuster et compléter le diagramme » respecte la vue active** : lancée depuis une vue, la réconciliation ne reconstruit plus tout le diagramme — elle met à jour uniquement la vue courante, en préservant le diagramme maître et les autres vues.

### Internationalisation

- **3 nouvelles langues** : espagnol, allemand et italien sur l'ensemble de l'interface (menus, modales, tooltips, raccourcis, carousel d'accueil, visite guidée, dialogues d'import/export).
- **Détection automatique de la langue du navigateur** parmi les 5 langues supportées (FR, EN, ES, DE, IT), avec fallback sur l'anglais.
- **Noms de styles par défaut traduisibles** : les styles créés automatiquement à l'import suivent la langue de l'interface. Les styles renommés manuellement sont préservés.

<!-- LANG:en -->

## v1.1.7 — June 2026

### Detach panels into separate windows

Since 1.1.5, the diagram, spreadsheet and documentation share one large area. 1.1.7 goes further: several panels can now be **detached into independent windows**, so you can organise your workspace across screens.

- **Detachable configuration panel.** Node, flow and tag appearance can be edited in its own window, next to the diagram — ideal on a second screen, without shrinking the drawing area.
- **Detachable documentation.** Read or write your notes in a dedicated window while working on the diagram.
- **Docked or detached single-node Sankey.** The focus on one node can be shown in the main area next to the diagram or detached into its own window, with a central node of consistent size from one focus to the next and better-laid-out labels.

### More direct access to data

- **Data tag selector in the top bar.** Choosing the year / territory / dataset is now available directly at the top of the screen, in any context.
- **Versions and what's new inside the app.** Access to **archived versions** and a built-in **changelog** page let you browse history and point to a specific version; the version tooltip shows the build date and reference.

### Reliability fixes

- **No more phantom flows when switching year.** Flows that wrongly appeared or disappeared while browsing dataTags have been eliminated, and a diagram's structure no longer "bleeds" from one year to another.
- **Multi-data stocks made reliable.** A diagram with stocks carrying several data families is now read back faithfully after saving (no more loss or inconsistency on reload).
- **Input/output flow locks preserved** when moving a node, and **flow scale kept** after a completion or reconciliation.
- **More robust opening**: missing parent nodes that were wrongly recreated, import of accented SankeyMATIC files fixed on Windows, and various display tweaks (menus, toolbars, legends).

## v1.1.5 — June 2026

### A fully integrated application: spreadsheet + diagram + documentation

This is the big change in this version. OpenSankey no longer forces you through Excel to enter or fix data: a **spreadsheet** and a **documentation panel** now sit next to the diagram. You choose what to show — diagram only, spreadsheet only, documentation only, or all side by side — with draggable separators.

- **Built-in spreadsheet.** A tabbed workbook (Flows, Nodes, Data, Tags, Stocks, Ratios, Stock chaining) mirroring the usual Excel format, editable directly in the application: changes flow through to the diagram. Excel-style optional-column selector, auto-fitted column widths, and an "Add constraint" modal for flow and stock ratios. No more opening the file in an external spreadsheet just to make a quick adjustment.
- **Diagram documentation.** A "Doc" tab offers a Markdown editor with preview (edit / preview / side-by-side modes), LaTeX equation support (KaTeX rendering) and image insertion. The documentation is saved **inside the diagram file**: it travels with it and no longer has to be maintained separately.
- **Side-by-side (split view).** Diagram, spreadsheet and documentation can be shown at the same time, with draggable separators and several layouts (doc to the right, left, above or below the spreadsheet, or as a bottom band). The diagram re-fits automatically into the remaining space.

### Explore the data behind every flow

- **Child-flow breakdown in the tooltip.** Hovering a flow that connects grouped nodes (by species, by properties…) opens a "Data" tab listing the underlying flows down to the leaves, **grouped by aggregation axis** — one table per dimension, each child flow showing its origin, destination, value and share (%) of the parent flow.
- **Series by year / region.** When a flow carries several data combinations (Year, region…), "Series" tabs give its value — and that of its child flows — for each combination, laid out in columns. Ideal for comparing several years or territories at a glance.
- **Pinnable, movable and resizable tooltips.** Any tooltip (node or flow) can be moved by dragging its header, pinned with a pin button to stay open (reading, comparing, capturing) and resized. Long tag names are no longer truncated.

### Reconciliation and mass balance

- **Product/sector trade nodes in territories.** A trade node can now be typed as product OR sector depending on its role in the supply/use matrix, and appear in only one of the two matrices without a load error. On reconciliation, import/export flows are rebuilt and the diagram completes automatically. A value entered in a column or row with no header is now flagged (warning) instead of being silently dropped.
- **"Unbounded" bounds now display as such.** No more phantom 500,000,000 cap on free flows: an unset bound stays genuinely unlimited, and the matching cells are empty instead of showing a large number. Legacy files carrying that inherited value are cleaned up automatically after an open / save round-trip.
- **Complete the diagram — "Completed value" column.** The *Solver* tab of the reconciliation dialog offers two checkboxes, "Reconcile" and "Complete (no redundancy)". Enabled together, they produce side by side, in the analysis sheet, the reconciled value and a completed value that preserves measurements and only computes unknown flows.

### Excel read and write

- **Skip the saved layout on open.** A new "Layout sheet" checkbox (ticked by default) lets you, when unticked, start from a clean automatically recomputed layout rather than the positions stored in the file.
- **Node sheet format on export.** A selector chooses the node-sheet layout on save: automatic, single sheet, Products / Sectors / Trade, or aggregated nodes.
- **Load a file into the current view only.** From within a view, an Excel import can fill only the active view, without resetting the master diagram or the other views.

### Layout and comfort

- **Size lock.** A bottom-bar button freezes height, width and zoom: the framing no longer shifts as you step through dataTags (years…) — ideal for comparing or capturing consistent images.
- **Force a flow to render as a stroke** via a padlock in the appearance panel, plus better automatic rendering of steeply inclined flows (no more unwanted overlap).
- **Quieter dataTag sequence bar** and **harmonized flow appearance menu** (uniform button sizes, new Structure / Curve icons).
- **Redesigned unitary-view generation** (OpenSankey+): a draggable dialog you can keep open while working on the diagram, and import of several Excel files in a row (sources accumulate).

### Fixes

- **Clearer processing dialogs**: the banner shows the operation actually running (Open / Edit / Reconcile / Complete) in your language, and end / failure detection is more reliable.
- **Config panel readable on small windows**: the right-hand column no longer truncates its controls below a certain width.

## v1.1.4 — May 2026

### Container mode — overhaul

- **Dynamic sizing**: a parent node rendered as a dashed frame around its children now tracks their size in real time — no more frozen resize. On exiting container mode, the parent immediately reverts to its own flow-driven size. Editing a flow value updates the envelope on the fly.
- **Nested containers**: a node that is already contained can itself contain its own children. The sub-level inherits the parent's mode by default, and incompatible variants are greyed out to keep a consistent visual contract.
- **Disaggregation and lateral expansion under a container**: disaggregating a contained node now reveals its sub-children in place within the containing stack; expansion clones fit into the same geometric frame without overflowing.
- **Transitive drag**: moving a child updates the envelope of every enclosing ancestor at each drag tick, not just the immediate box.

### Visualization

- **Value anchored to a node's label**: a new padlock button, to the right of the eight alignment buttons in the appearance panel, lets you anchor a node's value to its label instead of its shape. When the label background is visible, it now wraps label and value as a single block. If the label is hidden, the value disappears with it.

### Layout

- **Automatic extremity styles**: source and sink nodes get dedicated styles that place their label on the left or right, without overwriting manual label tweaks.

### Fixes

- **Undo on lateral expansion / contraction**: Ctrl+Z now properly reverts *Expand left / right* operations.
- **Consistent redo on aggregate / disaggregate**: the redo of an aggregation followed by disaggregation is no longer lost after an undo.
- Internal stability fixes for embedding the Viewer in third-party applications.

## v1.0.x — April 2026

### Export and sharing

- **Animated export of views** (OpenSankey+): new *Animation...* entry in **Export → All views** menu. Draggable modal lets you pick which views to include and their order, the per-view duration, the DPI and a loop mode (once / infinite / ping-pong). Three output formats: **animated GIF** (universal compatibility), **WebM** (video, better quality than GIF) and **zipped PNG sequence** (numbered frames). The master is never included in the animation. Simple PNG / PDF exports of the current view remain free with a *"made with OpenSankey.fr"* watermark; animation, like multi-view PNG zip and merged PDF, requires an OpenSankey+ licence.
- **All views submenu**: multi-view exports (PNG zip, merged PDF, Animation) are now grouped under a named section in the Export menu, separate from current-view exports (PNG, PDF, SVG).

### Excel file read and write

- **Redesigned open / save / convert file dialog**: input and output selectors side by side, options grouped in a collapsible block with three tabs *Input options*, *Save options* and *Layout*.
- **New read options**: ability to skip node sheets, the data sheet, or TER/TES sheets when reading an Excel file.
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
- **"Adjust and complete the diagram" respects the active view**: when launched from a view, reconciliation no longer rebuilds the whole diagram — it now updates the current view only, preserving the master diagram and other views.

### Internationalization

- **3 new languages**: Spanish, German and Italian across the whole UI (menus, modals, tooltips, shortcuts, welcome carousel, guided tour, import/export dialogs).
- **Automatic browser language detection** among the 5 supported languages (FR, EN, ES, DE, IT), with English fallback.
- **Translatable default style names**: styles created automatically on import follow the current UI language. Manually renamed styles are preserved.
