# Changelog — OpenSankey+

Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [1.1.8] — 2026-06-30

### Vues

- **Générateur de vues en topbar** + libellé « vue complète » dans la configuration des vues.
- Documentation markdown multilingue (master / vues).

### Corrections

- Évite les clés dupliquées gradient/auto dans le sélecteur de règle de couleur.
- Correction du libellé EN du sélecteur d'éléments (« Eléments » → « Elements »).

### Bump du submodule OpenSankey

- Cascade complète de OpenSankey 1.1.8. Voir [submodules/OpenSankey/CHANGELOG.md](submodules/OpenSankey/CHANGELOG.md) pour le détail.

## [1.1.7] — 2026-06-26

### Publication : portfolio de diagrammes en site autonome

- **Mode Publication / portfolio** (`ModalPublishOSP`) : génération d'un site web autonome (archive déployable en ligne ou dossier local) regroupant un ou plusieurs diagrammes, avec en-têtes de sections sur la page d'accueil et exclusion automatique des dossiers *Partenaires* / *Interne* (su-model/sankeyapplication#194). Déploiement additif avec sauvegarde datée de la version précédente, réglages de publication persistés avec le diagramme. En lecture : diagramme et documentation en lecture seule, bouton plein écran isolé, aide à la navigation et bouton Doc côté lecteur, sélecteur de data tag en barre du haut. Viewers embarqués paramétrables (`position_mode`, `data_tag_selection`) et chargement unique du diagramme (su-model/sankeyapplication#196). Sankey unitaire docké dans la grande zone ou détaché en fenêtre. Voir [submodules/OpenSankey/CHANGELOG.md](submodules/OpenSankey/CHANGELOG.md) pour le détail côté base.

### Bump du submodule OpenSankey — verrou de taille (#1240), fixes & styles toolbar

- **Bump du submodule OpenSankey** : verrou de taille (cadrage figé entre dataTags, su-model/sankeyapplication#1240), fixes stock/vues (`updateFrom`/`copyAttrFrom`), tooltips (noms longs + fenêtres redimensionnables), rafraîchissement des menus après application du layout, seuil trait→forme relevé, et styles de la barre du bas (séquence dataTag plus discrète, toolbar verticale relevée). Voir [submodules/OpenSankey/CHANGELOG.md → Unreleased](submodules/OpenSankey/CHANGELOG.md).

### Statut de traitement structuré (fin/échec)

- **Poll de l'import Excel multi-fichiers piloté par `data.status`** ([client/src/components/SankeyPlusViews.tsx](client/src/components/SankeyPlusViews.tsx) `TabImportExcelDataForUnitary`) : le `processOneFile` arrêtait le polling en grepant le texte du log (`FINISHED`/`TERMINÉE`/`ÉCHOUÉ`…). Il s'arrête désormais sur le champ `status` (`finished`/`failed`) renvoyé par `check_process`, et envoie un `process_label` localisé pour contextualiser le bandeau serveur. S'appuie sur le fichier de statut `<logname>.status` introduit côté OpenSankey. Voir [submodules/OpenSankey/CHANGELOG.md → Unreleased](submodules/OpenSankey/CHANGELOG.md).
- **Bump du submodule OpenSankey** (statut de traitement + bandeau contextuel des dialogues Ouvrir/Éditer/Réconcilier).

### Refonte UI du dialogue *Générer des vues unitaires*

- **Dialogue draggable au lieu d'un Modal bloquant** ([client/src/components/SankeyPlusViews.tsx](client/src/components/SankeyPlusViews.tsx) `ModalCreateUnitaryViewOSP`) : passage du `Modal` + `ModalOverlay` à un `Draggable` (même pattern que `ModalTransparentViewAttrOSP`), avec barre de titre `.title_menu` comme handle. L'utilisateur peut désormais déplacer le panneau et interagir avec le canvas en parallèle.
- **Layout aligné sur `ApplyLayoutDialog`** : grammaire visuelle Chakra cohérente — `menuconfigpanel_grid` + `menuconfigpanel_row_2cols` (label gauche / contrôle droite) + `menuconfigpanel_option_button[_activated]` pour les toggles + `<hr>` séparateur identique. Les anciens `Tabs / TabList / TabPanel` sont remplacés par une ligne *Source* avec deux boutons toggle (`Sankey local` / `Fichier Excel`). Labels *Hiérarchie* (level taggs) et *Noeuds* ajoutés sur les contrôles `LevelTagFilter` et `OSMultiSelect` qui étaient auparavant nus. Le bouton *Créer des vues unitaires…* est aligné à droite au lieu de s'étirer sur toute la largeur.
- **Multi-fichier Excel avec accumulation** ([SankeyExcelParser #62](https://gitlab.com/su-model/sankeyexcelparser/-/work_items/62)) : l'input fichier accepte `multiple`, la queue est traitée séquentiellement (le serveur ne traite qu'un job à la fois) et les sources s'accumulent au lieu de s'écraser. Le bouton *Ouvrir* affiche `Ouvrir (N)` quand N fichiers sont sélectionnés et `i/N` pendant le traitement. Liste des sources chargées affichée comme tableau compact avec surlignage `openSankey.50` sur la source active et `CloseButton` natif par ligne pour supprimer une source. Remplacement du composant fantôme `CheckLoad` (qui avait un `setInterval` se relançant à chaque render) par une `Promise` séquentielle `processOneFile`. Le libellé brut `Menu.input_file_excel` (clé inexistante) est remplacé par les clés `Menu.Transformation.sourceFile` / `view.select_data_source` / `Menu.Config.element_level_tag` / `Menu.Config.title_node` qui existent déjà en 5 langues.

### POC dual-output

- **Action menu OSP `afmCompleteOnly`** ([client/src/components/ContextMenuConfigs.tsx](client/src/components/ContextMenuConfigs.tsx)) : « Compléter le diagramme » envoie désormais `{ with_reconciled: false, with_completed: true }` via `default_solver_options` au lieu du flag legacy `{ remove_redundancy: true }`. L'action reste single-pass (no-redundancy, mesures préservées).
- **Bump du submodule OpenSankey** pour les checkboxes `Réconcilier` / `Compléter` dans l'onglet *Solveur* du dialog de réconciliation. Voir [submodules/OpenSankey/CHANGELOG.md → Unreleased](submodules/OpenSankey/CHANGELOG.md).

## [1.1.4] — 2026-05-11

### Bump du submodule OpenSankey — Viewer props complets + `diagrams_list` + `diagram` inline

Voir [submodules/OpenSankey/CHANGELOG.md → 1.1.4](submodules/OpenSankey/CHANGELOG.md). Côté OSP propre : mise à jour du commentaire obsolète dans `SankeyPlusViews.tsx` (`sous_filieres` → `diagrams_list`).

## [1.1.3] — 2026-05-10

### Bump du submodule OpenSankey — `value_label_stick_to_label` + fix `ViewerOpenSankeyApp` + craco editor

Voir [submodules/OpenSankey/CHANGELOG.md → 1.1.3](submodules/OpenSankey/CHANGELOG.md) :

- Nouveau booléen `value_label_stick_to_label` sur les nœuds : la valeur s'ancre au libellé du nœud (au lieu de la forme), avec fond unifié englobant libellé + valeur. UI : bouton cadenas à droite des 8 boutons d'alignement.
- Bump de la version de persistance à `1.1.3` (`Class_ApplicationData.version`).
- Déplacement de `createNewMenuConfiguration` hors du `useEffect` (React error #321), suppression de l'alias forçant Chakra en CJS dans `examples/*/editor/craco.config.cjs`, suppression de `examples/1.1.2/`.

Aucun changement fonctionnel propre à OSP.

## [1.1.2] — Mai 2026

### Bump du submodule OpenSankey — refonte du mode englobant

Bump qui apporte la refonte complète du mode englobant : sizing dynamique du parent et des enfants masqués, container_mode transitif (les sous-nœuds d'un descendant désagrégé héritent du contrat du parent englobant), propagation aux ancêtres lors d'un drag / disaggregate / aggregate / expand, héritage du mode au sous-niveau dans le menu (autres options grisées), filtrage des dimensions non-actives, espacement compact des clones d'expansion (`shape_position_dx / 3`). Ajoute deux styles de label d'extrémité (`NodeLeftExtremityStyle` / `NodeRightExtremityStyle`) consommés par `setNodeLabelPositioning`. Corrige l'absence d'undo sur expand/contract (snapshot full-JSON) et le redo cassé sur aggregate/disaggregate (paramètre `register_history`). Voir le [changelog OpenSankey](submodules/OpenSankey/CHANGELOG.md) pour le détail technique fichier par fichier.

## [Non publié] — Avril 2026

### Ajouts
- **Export animé des vues — modale unifiée GIF / WebM / séquence PNG** ([sankeyanimation #76](https://gitlab.com/su-model/sankeyanimation/-/work_items/76)) : nouvelle entrée *Animation...* dans le sous-menu *Toutes les vues* du menu Exporter. Modale draggable ([ModalAnimatedExportOSP.tsx](client/src/components/ModalAnimatedExportOSP.tsx)) qui propose le choix du format (GIF / WebM / Séquence PNG zip), la sélection des vues à inclure avec ordre custom (boutons up/down), la durée par vue, le DPI et le mode de boucle (une fois / infinie / aller-retour). Le master n'est jamais inclus dans la séquence. Pipeline unifié dans [SankeyExportsOSP.tsx](client/src/components/SankeyExportsOSP.tsx) : `exportAnimatedSequence(app_data, opts)` capture chaque vue unique une seule fois via le point de service Flask `/opensankey/save/png` (même fidélité que l'export PNG simple — fonts, légende, watermark si pas de licence), puis dispatche selon le format — `gifenc` pour le GIF avec param `repeat` selon le mode de boucle, `MediaRecorder` sur canvas pour le WebM (vp9 si supporté), `JSZip` pour la séquence PNG avec préfixe numérique préservant l'ordre. L'aller-retour duplique les view_ids en miroir avant l'encodage (V1,V2,V3 → V1,V2,V3,V2). La modale réutilise `iterateAllViews` côté capture (refacto pour accepter une liste explicite de view_ids au lieu d'itérer en dur sur master + views_order). Helper `decodePNGToImageData` aplatit la transparence sur fond blanc avant encoding (GIF n'a pas d'alpha). Dépendance ajoutée côté SankeyApplication : `gifenc 1.0.3` (~10 ko gzippé). Type stub local pour gifenc dans [client/src/gifenc.d.ts](client/src/gifenc.d.ts) car le package ne publie pas de `@types`. Nouveau ref OSP `_ref_show_modal_animated_export` sur [Class_MenuConfigOSP](client/src/types/MenuConfigOSP.tsx) pour piloter l'ouverture depuis l'item de menu.

- **Sous-menu groupé *Toutes les vues* dans Exporter** : les exports multi-vues (PNG zip, PDF fusionné, Animation) sont désormais regroupés sous un titre de section nommé dans le dropdown Exporter, séparés par un `MenuDivider` des exports vue courante (PNG, PDF, SVG). Tooltip *« Cette fonctionnalité nécessite OpenSankey+ »* sur les items grisés quand la licence n'est pas active (au lieu d'un simple `disabled` muet). S'appuie sur l'extension du type `extra_export_menu_items` côté OpenSankey — voir le [changelog OpenSankey](submodules/OpenSankey/CHANGELOG.md) pour le support des `type: 'group'` et `tooltip?: () => string`.

- **Bump du submodule OpenSankey — édition inline des labels (#688)** : double-click sur le label d'un nœud, sur la valeur d'un flux ou sur le label d'une zone de texte ouvre l'éditeur inline ; entrée « Éditer le nom » réactivée dans le menu contextuel des nœuds ; raccourci typing : taper une touche quand un seul nœud ou une seule zone de texte est sélectionné ouvre l'éditeur pré-rempli avec le caractère. Côté OpenSankey+, ajout du bouton « Éditer le nom » dans le menu contextuel des zones de texte ([ContextZDTOSP.tsx](client/src/components/ContextZDTOSP.tsx)) — il appelle `setInputLabelVisible()` (hérité de `NodeBase`) après s'être assuré que le label est visible. Nouvelle clé i18n `Menu.editName` en 5 langues (en/fr/es/de/it). Voir le [changelog OpenSankey](submodules/OpenSankey/CHANGELOG.md) pour le détail technique (lifting de `drawLabelInput` + `attachDoubleClickEdit` dans `DrawLabelBase`, fix de `setInputLabelVisible` qui ne révélait pas le foreignObject, redraw source/target au blur d'une saisie de valeur de flux).

### Corrections
- **Bump du submodule OpenSankey — déplacement de `preserve_extra_columns` vers les options de sortie + fix racine du handoff IO-input → IO-output** ([OpenSankey #1220](https://gitlab.com/su-model/opensankey/-/issues/1220), [SankeyExcelParser #71](https://gitlab.com/su-model/sankeyexcelparser/-/issues/71)) : la case « Préserver les colonnes additionnelles » est désormais dans l'onglet *Options de sortie Excel* (groupe `merge`). Côté Flask, propagation server-side de `output_options.preserve_extra_columns → input_options` avant `load_sankey` pour armer le stash au bon moment. Voir le [changelog OpenSankey](submodules/OpenSankey/CHANGELOG.md) et le [changelog SankeyExcelParser](submodules/OpenSankey/submodules/SankeyExcelParser/CHANGELOG.md) pour le détail (notamment la copie des `_options` / stash dans `SankeyPandas.__init__` quand un `other` est fourni — bug latent identique pour `preserve_input_index`).
- **Réconciliation in-place dans une vue préservant master + autres vues** : l'action *Ajuster et compléter le diagramme* (menu contextuel ZDD, action `afmReconciliation`) lancée depuis une vue OSP recréait jusqu'ici un diagramme complet et perdait le master ainsi que les autres vues. La refonte est principalement portée par OpenSankey (cf. [changelog OpenSankey](submodules/OpenSankey/CHANGELOG.md)) qui introduit un mode `view_only` dans `retrieveJSONResults` traitant le DA directement via `DrawingAreaPersistence.fromJSON` au lieu de remplacer l'app_data entière. Côté OpenSankey+, override de la nouvelle méthode publique `saveCurrentViewToCache()` sur `Class_ApplicationDataOSP` ([ApplicationDataOSP.tsx](client/src/types/ApplicationDataOSP.tsx)) : recompresse `_views[current_view_id].json` via `DrawingAreaPersistenceOSP.toJSON` en utilisant le pattern existant des autres callsites (`saveBeforeChangingView`, `_toJSON`, `_updateFromJSON`). Sans cet override, le cache compressé restait sur l'état pré-réconciliation et le résultat de la réconciliation était silencieusement perdu au prochain switch de vue ou à la sauvegarde JSON. Guards : `has_views`, `!is_view_master`, et présence du cache de la vue.
- **Bump du submodule OpenSankey — facteur d'unité appliqué même sans unité visible/nommée** : dans `format_value` ([Utils.tsx](submodules/OpenSankey/opensankey/client/src/types/Utils.tsx)), la division par `unit_factor` était conditionnée à `unit_visible && unit != ''`. Conséquence : définir un facteur d'échelle (ex. 1000 g → kg) sans cocher « Unité » ou sans nommer l'unité laissait la valeur à l'échelle d'origine. Le facteur agit désormais comme une échelle de display pure, indépendamment de l'affichage du texte d'unité. Voir le [changelog OpenSankey](submodules/OpenSankey/CHANGELOG.md).

### Ajouts
- **Bump du submodule OpenSankey — refonte du dialogue de persistance** : le composant `PersistenceProcessDialog` (utilisé par toutes les variantes Ouvrir/Enregistrer/Convertisseur de fichiers) a été refondu — sélecteurs Entrée/Sortie côte-à-côte en haut, bloc collapsible « Options » contenant 3 onglets (Options d'entrée / d'enregistrement / Mise en page). De nouvelles options sont disponibles : skip de catégories d'onglets à la lecture (`with_nodes_sheets`/`activate_data_table`/`activate_flux_matrix`), préservation des onglets utilisateur à l'écriture (`keep_other_sheets`), réécriture optionnelle des onglets format SankeyExcelParser (`rewrite_format_sheets` qui remplace l'ancien `mode_write` non opérationnel), et restriction aux flux entre nœuds feuilles (`data_table_only_leaf_flux`/`flux_matrix_only_leaf_flux`). Bug critique fixé : `views.py` mergait silencieusement output_options par-dessus input_options, écrasant les options d'entrée partageant un nom avec la sortie. Voir le [changelog OpenSankey](submodules/OpenSankey/CHANGELOG.md) et le [changelog SankeyExcelParser](submodules/OpenSankey/submodules/SankeyExcelParser/CHANGELOG.md) pour le détail.

### Modifications
- **Bump du submodule OpenSankey — assainissement du mode paramétrique (PR 1 + PR 2)** : première passe de refonte, aucun changement utilisateur visible dans le cas nominal. Suppression de bugs silencieux (prédicat malformé dans `Node.applyPosition`, rafraîchissement manquant sur changement de data tag, saut visuel à la bascule absolu → paramétrique, purge indue de `position_dy` en fin de désagrégation) et unification de `shape_position_dy` comme seule source de vérité pour l'espacement vertical — les `gap = 10` hardcodés dans `restackContainerChildren`, `setContainerMode`, `updateNodePositioning`, `disaggregate`, `rebalanceAncestorColumns` et `computeEffectiveBlockHeight` sont remplacés par deux helpers statiques `Class_NodePositioning.stackNodesVertically` / `totalStackHeight`. Nouvelle méthode `inferPositionUFromX` qui remplace le recalcul implicite de `position_u` dans `computeParametrization` (évite le couplage bidirectionnel `u ↔ x` via l'envelope des containers). Conséquence visuelle à tester : l'espacement initial des enfants à l'entrée en mode container ou à la désagrégation passe de 10 à 20 px (valeur du default style `elementStyleConfigs`). Voir le [changelog OpenSankey](submodules/OpenSankey/CHANGELOG.md) pour le détail, et [doc/sources/fr/dev/features/positionnement_parametrique.rst](../../doc/sources/fr/dev/features/positionnement_parametrique.rst) pour la documentation technique complète.

### Ajouts
- **Bump du submodule OpenSankey — visite guidée enrichie avec auto-démo** : la visite guidée `@reactour/tour` (bouton « Visite guidée » du bandeau top) couvre désormais l'ensemble de l'UI en ~21 étapes (vs 6 avant) : chaque bouton du bandeau top pris individuellement, chaque groupe de la toolbar bas (mode souris, mode position, ajustement/plein écran, aide), le drawer de filtres latéral gauche (quand il est visible), et la séquence complète du panneau de configuration droit avec bascule automatique entre les onglets data et style pour que l'utilisateur voie les panneaux concrets et pas des zones vides. Si l'utilisateur lance la visite sur un diagramme vide, 2 nœuds + 1 flux (valeur 100) + trois tag groups démo (un nœud, un flux, un data) sont créés automatiquement au premier step et nettoyés à la fin par un step final dédié ; si le diagramme a déjà du contenu, rien n'est créé et rien n'est supprimé. Les transitions d'état (ouverture de drawers, changement d'onglet, sélection d'éléments configurables) sont pilotées par les callbacks `action` / `actionAfter` des steps. Voir le [changelog OpenSankey](submodules/OpenSankey/CHANGELOG.md) pour le détail technique (helpers `openConfigDrawer` / `switchConfigTab` / `ensureElementSelected` / `setFilterDrawer` / `ensureDemoContent` / `cleanupDemoContent`, closure `demoRefs`, classes CSS d'ancrage ajoutées sur `MenuTop.tsx` / `MenuBottom.tsx` / `SankeyMenus.tsx`, nouvelles clés de traduction `guide.*`).
- **Bump du submodule OpenSankey** : verrouillage de l'axe sur le drag de nœud en maintenant **Shift** (horizontal U ou vertical V, choisi sur la composante dominante après ~4 px), comportement SankeyMatic-style. Relâcher Shift libère immédiatement le verrou. Fonctionne avec la sélection multiple, le mode magnétique et la propagation conteneur (enfants englobés). Nouvelle entrée « Shift + Drag (noeuds) » dans le tableau du mode sélection de la modale d'accueil, avec traductions FR/EN. Par la même occasion, les court-circuits `shiftKey` qui cassaient silencieusement l'undo pour tout shift+drag ont été supprimés. Voir le [changelog OpenSankey](submodules/OpenSankey/CHANGELOG.md) pour le détail technique (mutation de `event.dx/dy` via `Object.defineProperty` contourne le fait que les propriétés d3 `DragEvent` sont `configurable` mais non `writable`).
- **Bump du submodule OpenSankey** : intégration du nouveau mode d'affichage englobant (container) sur les dimensions d'agrégation. Un nœud parent peut désormais être rendu simultanément avec ses enfants sous forme d'une enveloppe rectangulaire pointillée qui les entoure, avec deux variantes de répartition des flux (entrées sur les enfants / sorties du parent, ou l'inverse). Accessible depuis le sous-menu « Navigation hiérarchie » du clic droit sur un nœud impliqué dans une dimension parent/enfant. Voir le [changelog OpenSankey](submodules/OpenSankey/CHANGELOG.md) pour le détail technique (modèle de données, filtre de visibilité asymétrique des liens, rendu via `applyContainerEnvelopeIfNeeded`, propagation du drag aux ancêtres, style `NodeContainerStyle`, persistance, sync au changement de vue).

## [Non publié] — Mars 2026

### Ajouts
- **Bouton CTA « Débloquer OpenSankey+ »** dans la barre de navigation pour les utilisateurs sans licence (`BannerSubscriptionOSP`), avec tooltip et redirection vers `/license/checkout`. Nouvelles clés i18n `Menu.get_premium` / `Menu.get_premium_tooltip` (7ba8d54).
- **Copie de forme(s) depuis le menu contextuel des zones de dessin** : entrée « Copier la/les forme(s) » dans `ContextZDT` qui duplique chaque conteneur sélectionné avec un décalage de 50 px (a674b25).
- **Bouton « Assigner un style »** dans le menu contextuel des zones de dessin via `ButtonContainerContextAssignStyle` (22ee641).
- Condition de visibilité sur l'action « Assigner étiquette » du menu contextuel nœud : masquée lorsqu'aucun tag nœud n'est défini (cada956).

### Modifications
- **Refonte complète du modal « Attributs hérités » des vues** (`ModalTransparentViewAttrOSP`) (cada956, 22ee641, 836c218, d992d69, 93ae6bf) :
  - devient une fenêtre draggable (`react-draggable`) avec titre, bouton de fermeture et positionnement libre ;
  - **héritage multi-sources** : chaque vue peut désormais hériter d'attributs depuis le sankey maître **et/ou** depuis d'autres vues (précédemment héritage unique depuis le maître). Sélecteur de source avec indicateur `*` quand la source a des attributs actifs ;
  - raccourcis « Aucun / Basiques / Tout » qui s'appliquent à la source sélectionnée ;
  - grille d'attributs unifiée via le composant `UpdateModeGrid` (mutualisé avec OpenSankey), remplaçant l'ancienne série de boutons à bascule hardcodés ;
  - bouton « Mettre à jour » qui applique toutes les sources configurées en cascade.
- **Stockage des attributs hérités déplacé** du `Class_DrawingAreaOSP` vers `Class_ApplicationDataOSP.heredited_attr` (dict à deux niveaux `[target_view][source_view] = attrs[]`), avec persistance JSON au niveau des vues et migration automatique de l'ancien format tableau simple (22ee641, cada956).
- **Vues unitaires et persistance** : migration de `DrawingAreaPersistence` vers `DrawingAreaPersistenceOSP` dans `UnitaryBoard.tsx` et `ApplicationDataOSP.tsx` pour que le JSON embarque les champs spécifiques OpenSankey+ (notamment le nom de vue) (cada956).
- **Rafraîchissement automatique du modal des attributs hérités au changement de vue** via un nouveau ref `ref_to_modal_view_attr_updater` dans `MenuConfigOSP` (22ee641).
- **Libellés français raccourcis / clarifiés** (`traduction_app_elements.tsx`) :
  - « Choisir attributs hérités du sankey maître » → « Attributs hérités » ;
  - « Mettre à jour la vue actuelle avec les paramètres sélectionnés » → « Mettre à jour » ;
  - « Assigner une étiquette » → « Assigner étiquettes » (53f0586) ;
  - onglet de configuration scindé : « Formes » devient « Zones » + « Zones de texte et images » (cada956, 22ee641).

### Corrections
- **Détection des statuts de tâches asynchrones en français** dans `CheckLoad` : ajout de `ÉCHOUÉE` / `ÉCHOUÉ` en plus de `FAILED` pour qu'un échec de job côté serveur soit correctement reporté à l'utilisateur (cada956).
- Initialisation de l'entrée `heredited_attr` lors de la création d'une vue (normale ou unitaire), évitant des `undefined` lors du premier accès au modal (22ee641, cada956).
- Nettoyage du `heredited_attr` à la suppression d'une vue et au reset de l'application (22ee641).

---

## [Non publié] — Avril 2026

### Ajouts
- `feat(ui)` : bascule du mode de positionnement dans les tables de configuration des tags (f43e2c3).
- `feat(ui)` : améliorations des groupes de layout, de `UpdateModeGrid`, et correctif `LinkValueTree.extend` (71162ce).
- `feat(ui)` : injection de `is_row_disabled` pour les lignes de tags OSP (89a83bc).
- `feat(ui)` : onglet « Vues » désactivé en l'absence de licence OSP (87ca6b2).
- `feat(ui/server)` : case à cocher `error_on_new_nodes`, nettoyage du bruit de debug (bd28a6b).
- `feat(node)` : réorganisation automatique des E/S à la fin d'un drag de nœud, undoable en une étape (positions + ordres de liens). Le nœud déplacé et tous ses voisins connectés voient leur ordre de flux entrants/sortants recalculé selon la nouvelle disposition spatiale, et Ctrl+Z restaure les deux (via submodule OpenSankey).
- `feat(node label)` : mode d'affichage configurable des totaux entrants/sortants dans le libellé de valeur (Σin / Σin→Σout / Σout), avec comparaison des chaînes **après formatage** (chiffres significatifs, décimales, unités) — la flèche ne s'affiche plus quand les deux totaux rendent le même texte (via submodule OpenSankey).
- **`feat(trial)` : période d'essai OpenSankey+ de 30 jours, opt-in, sans login** :
  - nouveau module utilitaire `client/src/utils/trial.ts` (lecture/écriture `localStorage`, génération d'UUID anonyme v4, envoi des pings analytics en `keepalive`) avec API `markTrialOffered`, `startTrial`, `getTrialState`, `isTrialActive`, `isTrialExpired`, `markTrialConverted` ;
  - nouveau composant `client/src/components/ModalTrialOSP.tsx` qui exporte trois éléments :
    - `ModalTrialWelcomeOSP` : fenêtre d'accueil affichée une seule fois au premier chargement, avec boutons « Démarrer mon essai de 30 jours » et « Plus tard » ;
    - `ModalTrialExpiredOSP` : fenêtre d'expiration affichée à J+31 si l'essai avait été démarré, avec boutons « Continuer en gratuit » et « Souscrire » ;
    - `BannerTrialOSP` : bannière permanente du bas, automate à 4 états (offrir / N jours restants / expiré → débloquer / licence → masquée) ;
  - override du getter `Class_ApplicationDataOSP.has_sankey_plus` pour retourner `true` tant que l'essai est actif (le getter `has_real_sankey_plus_licence` permet de distinguer la licence réelle de l'essai côté UI) ;
  - injection des deux modales dans `moduleDialogsOSP` et de la bannière dans `additional_bottom_item` via `initializeAdditionalMenusOSP` (couvre à la fois `AppOSP` standalone et `AppSA` du shell SankeyApplication) ;
  - 11 clés de traduction FR/EN ajoutées sous le namespace `Trial` (welcome_*, banner_*, expired_*).

### Corrections
- `fix(mac)` : compatibilité macOS des raccourcis clavier (via submodule OpenSankey) et mise à jour de la documentation des raccourcis.
- `fix(node)` : affichage du libellé `in→out` quand la somme des flux entrants diffère de la somme des sortants (456d15b).
- `fix(draw)` : hauteur des nœuds et points d'ancrage des flux désormais proportionnels à la vraie valeur des flux (épaisseur brute non-clampée), pour que la somme des épaisseurs au niveau du nœud corresponde à la valeur réelle. Les flux très fins continuent d'être dessinés avec un minimum visuel de 2 px et peuvent se chevaucher dans leur slot. Corrige aussi l'explosion des coordonnées de flèches (~-9400 px) sur les nœuds dont le total brut est très petit (mélange clamped/raw dans `draw_arrow_part`) (via submodule OpenSankey).
- `fix(undo)` : le passage d'un nœud en mode `parametric` (ou `relative`) est maintenant correctement annulable. Auparavant le proxy `updateElements` ne capturait que `shape_position_type`, alors que `applyPosition()` (déclenché en effet de bord par `drawShape`) modifie aussi `position_x/y` ; Ctrl+Z restaurait le type mais laissait le nœud à sa nouvelle position, donnant l'impression que rien ne se passait. Le bouton `position_type` enregistre désormais un undo unique qui snapshotte le type et la position du nœud (via submodule OpenSankey).
- `feat(layout)` : l'index de colonne `u` d'un nœud est exposé dans l'UI sous la section « Positionnement » du menu d'apparence, avec un cadenas (`shape_position_u_locked`). Quand verrouillé, `computeAutoSankey` force l'index horizontal du nœud à `position_u - 1` avant le placement final, et `computeParametrization` ne recalcule plus son `position_u`. Permet d'épingler un nœud sur une colonne donnée malgré le recalcul automatique (via submodule OpenSankey).
- `fix(layout)` : `computeFinalPositions` ancre désormais la première colonne à `x = 200 px` indépendamment de `h_spacing` / `position_dx` — l'écart ne contrôle plus que l'espacement inter-colonnes, évitant le glissement horizontal du diagramme quand on règle l'espacement (via submodule OpenSankey).
- `fix(layout)` : `updateNodesPositionsY` : suppression du report cumulatif du décalage (`shift`) entre colonnes. Ce mécanisme était censé propager un alignement 1-vers-1 mais, faute de réinitialisation entre colonnes non liées et à cause du clamp `Math.max(0, …)`, finissait par coller le premier nœud de la colonne n+1 à `y = 0` (au-dessus du dernier nœud de la colonne n). Chaque colonne est maintenant centrée indépendamment via `v_margin_for_index` ; les ajustements `import_link` / `recycling_links` / alignement 1-vers-1 restent locaux au nœud (via submodule OpenSankey).
- `feat(ui)` : fusion des deux sous-menus « Option centrage des nœuds » et « Option minimisation des croisements » en un seul « Mise en page auto » qui contient les deux actions sous forme de boutons dans un unique widget, avec les mêmes réglages d'écart horizontal / vertical partagés. Suppression des actions `computeAutoPosition` / `computeAutoPositionOptim` devenues inutiles (via submodule OpenSankey).
- `feat(layout)` : verrou de ligne `v` sur les nœuds (miroir du verrou `u` colonne) exposé dans le menu d'apparence sous la ligne « Colonne ». Quand verrouillé, l'auto-layout (`computeFinalPositions`) place les nœuds verrouillés dans leur ordre de `position_v` dans chaque colonne et les non-verrouillés remplissent les créneaux restants ; l'optimisation anti-croisement et `computeParametricV` préservent également la valeur verrouillée. Permet d'épingler un nœud sur une ligne donnée malgré le recalcul automatique (via submodule OpenSankey).

### Modifications
- `chore` : mises à jour multiples du submodule OpenSankey (8f880d0, 88b7f92, 5c01743, a41357d, f14d9eb, ad410c6, 982e278, 7b55875).
- `major` : intégration de la mise à jour majeure du positionnement et du rendu des nœuds d'OpenSankey (9eed43c).
- Travaux en cours sur les stocks (bc8dbba) et mises à jour générales (50cf30d).
