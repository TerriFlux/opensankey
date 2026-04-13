# Changelog — OpenSankey

Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [Non publié] — Avril 2026

### Ajouts
- **Noms de styles par défaut traduisibles (FR/EN)** : les `name` des entrées de `elementStyleConfigs` ([ElementStyle.tsx](opensankey/client/src/Elements/ElementStyle.tsx)) sont désormais des clés i18n (`ElementStyle.NodeStyle`, `ElementStyle.LinkStyle`, ..., `ElementStyle.LinkOutUnitaryStyle`) au lieu de chaînes FR en dur. Traductions FR/EN ajoutées dans [traduction_nodes.tsx](opensankey/client/src/traductions/traduction_nodes.tsx) sous la clé `ElementStyle`. Les points d'affichage du nom de style dans [SankeyStyle.tsx](opensankey/client/src/components/dialogs/SankeyStyle.tsx) (bouton dropdown, items de liste déroulante, input de renommage, multi-select, liste d'ordre drag-and-drop) sont wrappés avec `t()`. Les styles renommés manuellement par l'utilisateur restent affichés tels quels (i18next retourne la clé inconnue comme chaîne). Renommage : `NodeProductStyle` / `NodeSectorStyle` passent de « Noeud produit/secteur » à « Style étiquette produit/secteur ».
- **Sous-menu « Réinitialiser les intervalles verticaux »** (mode parametric uniquement) : l'entrée bouton du sous-menu Positionnement devient un sous-menu avec champ d'écart vertical (initialisé depuis le style), bouton « Réinitialiser au défaut » et bouton « Appliquer ». `resetAllVerticalIntervals` accepte désormais un paramètre optionnel `v_spacing` qui met à jour `styles_dict['default'].shape_position_dy` avant de purger les overrides locaux. Nouveau widget `MenuContextResetVerticalIntervals`.
- **Persistance de session des écarts de mise en page** : les valeurs d'écart horizontal/vertical des widgets de centrage, minimisation des croisements et réinitialisation des intervalles verticaux sont partagées via une variable module-level `session_layout_spacing` (non persistée en JSON, survit aux re-montages des widgets). Bouton « Réinitialiser au défaut » ajouté aux widgets de centrage et minimisation.
- **Ecarts horizontaux/verticaux configurables pour la mise en page automatique** : les commandes « Option centrage des noeuds » et « Option minimisation des croisements » du menu contextuel sont désormais des sous-menus avec champs d'écart horizontal et vertical (en px) et un bouton de lancement. Le dialogue d'import Excel affiche également ces champs dans la section « Mise en page ». Si non renseignés, les valeurs par défaut du style (`position_dx` / `position_dy`) sont utilisées comme avant. Paramètres optionnels `h_spacing` / `v_spacing` ajoutés à `computeAutoSankey` et `computeAutoSankeyWithToast`. Nouveau widget `MenuContextAutoLayout` enregistré dans le `WidgetRegistry`.
- **Intervalles, incertitude, min/max sur les flux (AFM)** : nouveau type de donnée `intervals` dans `value_option`, champs `data_min`, `data_max`, `data_uncertainty` (incertitude relative en %) persistés en JSON et synchronisés avec l'export/import Excel (feuille Min Max). Panneau de configuration flux restructuré en deux onglets Basique/AFM avec sélecteur de type de données inline. Affichage `[min - max]` sur le diagramme pour les flux de type intervalle (pointillé).
- **Séparation type de données / affichage des intervalles** : `type_data` scindé en deux attributs indépendants `data_source` (structure/collectées/calculées+label/calculées) et `interval_display` (structure/intervalles/valeurs possibles). Les deux sélecteurs de la barre d'outils écrivent chacun dans leur attribut. Le getter `type_data` dérive les deux pour la rétrocompatibilité. « Valeurs possibles » n'est disponible que pour les données calculées. Type d'affichage affiché dans la légende. Libellé du sélecteur 2 renommé « Affichage des intervalles ».
- **Tooltip « Facteur d'échelle » sur les flux** : ajout du tooltip manquant sur le champ « Facteur d'échelle » dans le menu d'apparence des flux. Traductions FR/EN ajoutées (`Flux.apparence.tooltips.local_scale`). Correction du wrapper (fragment `<>` remplacé par `<Box>`) pour que le tooltip Chakra fonctionne.
- **Unification de l'UI de mise en page automatique** entre le menu contextuel clic-droit (`MenuContextAutoLayout`) et le dialogue d'import Excel (`UniversalFileConverter`) via un composant partagé `AutoLayoutSpacingInputs` (props `show_horizontal` / `show_extremities` / `show_optimize_mode`). L'état de session (`layout_h_spacing`, `layout_v_spacing`, `layout_sources_mode`, `layout_sinks_mode`, `layout_optimize_crossing`) est désormais porté par `Class_ApplicationData` au lieu d'une variable module-level + `useState` locaux. Le widget clic-droit est élargi (`minW='280px'`), sa paire de boutons « Centrer » / « Minimiser » est remplacée par un sélecteur Mode + un unique bouton « Mise en page ».
- **Options de placement des nœuds d'extrémité** dans `computeAutoSankey` / `computeAutoSankeyWithToast` : nouveaux paramètres `sources_mode` (`before_neighbor` par défaut, ou `left_extremity` pour épingler les nœuds sans entrée à la colonne 0) et `sinks_mode` (`after_neighbor` par défaut, ou `right_extremity` pour épingler les nœuds sans sortie à `max_horizontal_index`). Exposés dans les widgets de mise en page via deux selects « Nœuds sans entrée » / « Nœuds sans sortie ». Défauts préservent strictement le comportement antérieur ; les call-sites non touchés (`ApplicationData`, `UnitaryBoard`, `SpreadSheet`) en bénéficient automatiquement.
- **Traductions FR/EN complètes de la section Mise en page** (libellés + tooltips) pour le dialogue d'import Excel et le widget contextuel, via de nouvelles clés `ProcessDialog.layout_*` dans `PersistenceProcessDialogConfigs`.
- **Verrou de ligne (v) sur les nœuds** : nouveau champ `shape_position_v_locked` miroir de `shape_position_u_locked`, exposé dans le menu d'apparence du nœud ([MenuElementsAppearance.tsx](opensankey/client/src/components/configmenus/MenuElementsAppearance.tsx)) sous la ligne « Colonne » via un champ numérique « Ligne » + bouton cadenas. Quand verrouillé, `computeFinalPositions` réordonne les nœuds de chaque colonne pour placer les verrouillés dans l'ordre croissant de leur `position_v` (clamp sur les bornes de la colonne, collisions résolues en préservant l'ordre relatif) ; les nœuds non verrouillés remplissent les créneaux restants dans leur ordre issu du tri par sortcoef. `optimizeCrossingsPositioning` n'ajuste plus la position Y des nœuds V-verrouillés, et `computeParametricV` / `applyVForLevelTag` préservent leur `position_v` au lieu de le réécrire depuis la position Y courante. Entrée `position_v_locked` ajoutée à `NODE_SHAPE_SPECIFIC_CONFIG` avec labels « Verrouiller la ligne » / « Lock row » et traductions FR/EN `Noeud.apparence.position_v` / `row_v` / `tooltips.shape_position_v_locked`.

### Corrections
- **fix(import Excel)** : les styles `node_exchanges_style` (import/export, nœuds et flux collés/dessus-dessous) ne sont plus créés automatiquement à l'import d'un fichier Excel contenant les onglets Produits/Secteurs s'il n'y a pas d'onglet Échange. La création est désormais conditionnée à la présence du tag `'echange'` dans le groupe d'étiquettes `'type de noeud'` ([SankeyPersistence.tsx](opensankey/client/src/Persistence/SankeyPersistence.tsx):1558), au lieu de se déclencher systématiquement lorsque le groupe existe.
- **fix(légende)** : taille de police incorrecte lorsque la légende est détachée (`stick_to_drawing = false`) et que le diagramme est zoomé. `applyPosition` appliquait inconditionnellement `scale(1/scale_da)`, alors que la légende détachée est placée dans `d3_selection_zoom_area` (non affecté par le zoom) et n'a pas besoin de compensation. Résultat : au zoom out, le texte s'agrandissait (inverse du zoom) et ne respectait plus `legend_police`. Le scale n'est désormais appliqué que lorsque `stick_to_drawing` est vrai, alignant `applyPosition` sur `_initDraw`.

## [Non publié] — Mars 2026

### Ajouts
- **Mode pinceau de style (style paint)** : sélection d'un élément source puis clic sur une cible pour recopier son style. Méthodes `enterStylePaintMode` / `exitStylePaintMode` / `applyStyleFromPaintSource` sur `Class_DrawingArea`, intégration dans `MenuBottom` et les menus contextuels nœud / lien, nouvelles icônes (18a376ea, da7c1103).
- **Forme de nœud `capsule_h`** (capsule horizontale) dans `NodeDrawShape` avec gestion dédiée des marges de label (da7c1103).
- **Copie d'éléments en lot** : `copyNodes` centralisé sur `DrawingArea` avec `bypass_redraws`, préservation de l'ordre des liens entre copies, sélection automatique des copies. Entrée « Copier les éléments » dans le menu contextuel nœud, copie des flux entre mêmes source/cible depuis le menu lien (d1f05f07, 3100745a, 18a376ea).
- **Mode positionnement paramétrique / absolu** : remplacement, dans la barre du bas, des boutons Undo/Redo par un commutateur dédié (icônes `faArrowsUpDown` / `faLocationDot`). Suppression du bouton « Transposer » (d68987b8).
- **Chargement séparé d'un fichier de mise en page** : `window.sankey.diagram_layout` permet de charger un diagramme puis d'y surimprimer une mise en page via `updateFromJSON`. Nouveau style de bouton bandeau abonnement, libellé « Échelle » (cc1d387f).
- **`UpdateModeGrid`** : extraction d'un composant de grille partagé (réutilisé par OpenSankey+ pour `ModalTransparentViewAttrOSP`) avec nouveau mode `styleDA` (sync des styles add/remove/update) et lignes expertes optionnelles (Ajouts/Suppressions/Values/Tags) (d1f05f07).
- **`matchAndModifyJSONIds`** gère désormais `matching_containers_id` pour que `updateFrom` remappe aussi les containers dans `list_g_element` (d1f05f07).

### Modifications
- **Règle de couleur automatique des flux** (`shape_color_rule == 'auto'`) entièrement revue : priorité (1) tag couleur commun source/cible, (2) côté unique porteur, (3) si les deux en ont préférence au nœud « produit », (4) sinon nœud produit par défaut, (5) fallback source. Tooltip de sélection contextualisé selon la valeur (9fb82ee8, f18d214d).
- **Menu contextuel nœud** : réorganisation du `NODE_MENU_CONFIG`, libellés généralisés « éléments », copies restant sélectionnées (3100745a).
- **`createTiedZdt`** : attache désormais descendants ET ancêtres des nœuds sélectionnés, recalcul automatique taille/position (8a33aa0f).
- **Menu contextuel lien** : « Mettre au premier plan / à l'arrière-plan » (au lieu de « Premier plan / Arrière-plan »), libellés « Masquer libellé / Afficher libellé » raccourcis. Correction de l'inversion `moveToFirstPlan` / `moveToLastPlan` (18a376ea).
- **Menu de configuration des flux** : déplacement des sélecteurs de tags data hors de la Box grid pour permettre leur affichage en-dessous (6ab6c9b4, 62ce8323).
- **Filtres de tags groupe** : suppression de `bypass_compute_positions` lors du redraw en mode `element` (rendu plus cohérent) (1ee50064).
- Tooltips ajoutés sur le verrou de couleur d'icône, traductions enrichies (5e279ee3, f18d214d).
- Retouches `MenuTop` / `SankeyMenus` (516587cf, bbd9ccf0, dce6b6f7).

### Corrections
- **fix(flux config)** : les composants « Value input » et « Text display » étaient enfants de la Box grid source/cible, ce qui empêchait leur affichage en-dessous. Fermeture de la grid après les data tags (62ce8323).
- **fix(légende)** : en mode statique, `eventMaintainedClick` sur la légende est désormais inhibé (plus d'interaction de drag en lecture seule) (0207020d).
- **fix(DrawLabel)** : `max-width` du label basé sur `max(box_width, shape_min_width)` au lieu du seul `shape_min_width` (libellés tronqués) (da7c1103).
- **fix(DrawLabel)** : labels de flux verticaux — rotation +90° (sens naturel top→bottom) et remappage correct des axes horiz/vert (da7c1103).
- **fix(DrawLabel capsule_h)** : marges gauche/droite dédiées à la capsule horizontale (da7c1103).
- Retouches `TextZone`, `UnitaryBoard`, `ContextZDDConfig`, `Link.tsx`, `PersistenceProcessDialog` (47142bdf, fbc57a65, 5fe71f41, af5b0363, f275a308, 90c3d418).

---

## [Non publié] — Avril 2026

### Ajouts
- `feat` : valeurs duales source / destination pour les flux dégradés (tapered links) (b47840a5).
- `feat(ui)` : filtre « visibles / tous » dans le `NodeIOReorganizer` (d78e4149).
- `feat(ui)` : barres de défilement SVG sur la zone de dessin en cas de débordement de zoom (08ddfa73).
- `feat(ui)` : bascule du mode de positionnement pour les tables de tags ; correction des colonnes de la grille (3895d147).
- `feat(ui)` : `groups` de layout exposés en getter, améliorations `UpdateModeGrid`, fix `LinkValueTree.extend` pour enfants vides (82ec8113).
- `feat(ui)` : lignes grisées sans licence OSP, fix des libellés de tag, ajout des styles au profil par défaut (ce6d54e7).
- `feat(ui)` : contrôles granulaires ajout / suppression / mise à jour pour les groupes de tags dans `UpdateModeGrid` (68ac08fe).
- `feat(ui)` : onglet « Vues » absent en mode basique, grisé sans licence ; correction des attributs par défaut (a6051340).
- `feat(ui)` : case à cocher `error_on_new_flux` pour validation des feuilles secondaires (476c7adb).
- `feat(ui/server)` : case à cocher `error_on_new_nodes`, nettoyage du bruit de debug (37ec8a51, 1215e20c).
- `refactor(ui)` : fusion des boutons « Texte simple » / « Rich Text » en un seul bouton « Éditeur » ; toolbar Quill masquée sans licence OSP (texte brut uniquement) ; contenu riche chargé sans licence : édition désactivée ; synchronisation bidirectionnelle `fo_content` ↔ `name_label` (nœuds) / `text_value` (liens).

### Corrections
- `fix(mac)` : compatibilité macOS des raccourcis clavier et interactions souris :
  - touche `Backspace` acceptée en plus de `Delete` pour la suppression d'éléments (`ApplicationData.tsx`) ;
  - `Cmd+Click` (metaKey) pris en charge pour la multi-sélection de nœuds (`NodeEventsHandler.tsx`), liens (`Link.tsx`) et le zoom molette (`DrawingArea.tsx`) ;
  - purge de sélection inhibée lorsque `Cmd` est maintenu (`DrawingArea.tsx`) ;
  - documentation des raccourcis mise à jour (EN+FR) : mention des équivalents Mac (Cmd, Backspace, Fn+F-keys) dans `traduction_rcc_shortcuts.tsx`.
- `fix(node)` : affichage du libellé `in→out` quand la somme des flux entrants diffère de la somme des sortants (0b47be14).
- `fix` : inversion `moveToFirstPlan` / `moveToLastPlan` pour les nœuds (d779c643).
- `fix` : séparateur de libellé par défaut désormais vide (libellé complet affiché par défaut) (2e675423).
- `fix` : correctif issue [su-model/sankeyapplication#130](https://gitlab.com/su-model/sankeyapplication/-/work_items/130) (d353d626).
- `fix(legend)` : offset des libellés de tag proportionnel à la taille de police (185f9ee7).
- `fix(ui)` : libellé et tooltip de `error_on_new_nodes` mis à jour pour refléter le comportement bloquant (9b47d316).

### Modifications
- `chore` : mises à jour du submodule SankeyExcelParser (8a929eac, cc1d86cf, 7e3721ae).
- `major` : mise à jour majeure du positionnement et du rendu des nœuds (057d8789).
- Travaux en cours sur les stocks (b3da6716) et mises à jour générales (67aaf4f3, 7372d8fb).
