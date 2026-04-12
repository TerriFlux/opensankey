# Changelog — OpenSankey

Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [Non publié] — Avril 2026

### Ajouts
- **Intervalles, incertitude, min/max sur les flux (AFM)** : nouveau type de donnée `intervals` dans `value_option`, champs `data_min`, `data_max`, `data_uncertainty` (incertitude relative en %) persistés en JSON et synchronisés avec l'export/import Excel (feuille Min Max). Panneau de configuration flux restructuré en deux onglets Basique/AFM avec sélecteur de type de données inline. Affichage `[min - max]` sur le diagramme pour les flux de type intervalle (pointillé).

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
