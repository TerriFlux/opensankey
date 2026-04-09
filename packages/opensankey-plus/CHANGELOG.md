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

### Corrections
- `fix(node)` : affichage du libellé `in→out` quand la somme des flux entrants diffère de la somme des sortants (456d15b).

### Modifications
- `chore` : mises à jour multiples du submodule OpenSankey (8f880d0, 88b7f92, 5c01743, a41357d, f14d9eb, ad410c6, 982e278, 7b55875).
- `major` : intégration de la mise à jour majeure du positionnement et du rendu des nœuds d'OpenSankey (9eed43c).
- Travaux en cours sur les stocks (bc8dbba) et mises à jour générales (50cf30d).
