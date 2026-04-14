# Changelog — OpenSankey+

Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

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
