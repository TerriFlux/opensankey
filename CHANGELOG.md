# Changelog — SankeyApplication

Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).
Ce fichier agrège les changements visibles pour les utilisateurs de SankeyApplication, avec un récapitulatif consolidé en tête. Les changelogs détaillés par module sont disponibles dans :

- [submodules/OpenSankey+/CHANGELOG.md](submodules/OpenSankey+/CHANGELOG.md)
- [submodules/OpenSankey+/submodules/OpenSankey/CHANGELOG.md](submodules/OpenSankey+/submodules/OpenSankey/CHANGELOG.md)
- [submodules/OpenSankey+/submodules/OpenSankey/submodules/SankeyExcelParser/CHANGELOG.md](submodules/OpenSankey+/submodules/OpenSankey/submodules/SankeyExcelParser/CHANGELOG.md)
- [submodules/LoginComponent/CHANGELOG.md](submodules/LoginComponent/CHANGELOG.md)

---

## Récapitulatif — Mars 2026

### Ajouts
- **Mode pinceau de style** : sélectionner un élément source puis cliquer sur une cible pour recopier son style (intégré dans la barre du bas et les menus contextuels).
- **Nouvelle forme de nœud** : capsule horizontale (`capsule_h`) avec gestion dédiée des marges de label.
- **Copie d'éléments en lot** : nouvelle entrée « Copier les éléments » dans les menus contextuels nœud, lien et zones de dessin ; copies en lot avec préservation de l'ordre des liens et sélection automatique.
- **Mode positionnement paramétrique / absolu** : nouveau commutateur dédié dans la barre du bas (remplace les boutons Undo/Redo et le bouton « Transposer »).
- **Chargement séparé d'un fichier de mise en page** : possibilité de charger un diagramme puis d'y surimprimer une mise en page externe.
- **Vues OpenSankey+ — héritage multi-sources** : refonte complète du modal « Attributs hérités » qui devient draggable et permet à chaque vue d'hériter d'attributs depuis le sankey maître **et/ou** depuis d'autres vues, avec une grille d'attributs unifiée et des raccourcis Aucun / Basiques / Tout par source.
- **CTA premium** : nouveau bouton « Débloquer OpenSankey+ » dans la barre de navigation pour les utilisateurs sans licence, redirigeant vers `/license/checkout`. Bannière premium équivalente côté SankeyApplication.
- **Distribution binaire de SankeyExcelParser** : compilation Cython, génération de wheels `.pyd/.so` sans exposer les sources Python ; nouveau job CI `build_wheel`. Passage en version `1.1.2`.
- **Déploiement multi-environnements** : nouveau script `update_opensankey.sh` unifiant le déploiement `dev` / `test` / `prod`.

### Modifications
- **Règle de couleur automatique des flux** entièrement revue : priorité aux tags couleur communs source/cible, puis au côté unique porteur, puis au nœud « produit ».
- **Menu de configuration des flux** : sélecteurs de tags data déplacés hors de la grille source/cible pour un affichage correct en-dessous.
- **Menus contextuels** : libellés clarifiés et raccourcis ; `createTiedZdt` attache désormais descendants ET ancêtres.
- **Filtres de tags groupe** : rendu plus cohérent en mode `element`.
- **Écriture Excel** : si le fichier cible n'existe pas, le mode passe automatiquement en écriture (au lieu d'échouer en mode ajout).
- **Feuille contraintes ratio flux** : colonnes de tags ajoutées dynamiquement en fonction de leur présence réelle.
- Feuille `CONSTRAINTS_F2F_SHEET` déclassée.
- Logs `su_trace` épurés (suppression des emojis pour compatibilité Cython / terminaux).

### Corrections
- **fix(flux config)** : correction du layout du menu de configuration des flux (composants enfants de la grid empêchant l'affichage en-dessous).
- **fix(légende)** : drag inhibé en mode statique.
- **fix(DrawLabel)** : correction du `max-width` (libellés tronqués) et de la rotation des labels de flux verticaux.
- **fix(JSON parser)** : correction du flot de contrôle lors du parsing de `value_option` — évite l'écrasement de valeurs existantes.
- **fix(deploy)** : chemin du venv corrigé dans `update_opensankey.sh`.

---

## Récapitulatif — Avril 2026

Cette section consolide les évolutions livrées en avril 2026, tous modules confondus, et sert de base à la génération des notes de version.

### Ajouts
- **Stocks et flux de recyclage** : un nœud dont la somme des flux entrants diffère de la somme des sortants affiche désormais un libellé `entrée → sortie` permettant de visualiser explicitement l'écart (stock).
- **Flux dégradés (tapered)** : prise en charge de valeurs distinctes côté source et côté destination (`data_value` / `data_value_target`), permettant de représenter des pertes ou gains le long du flux.
- **Réorganisation des E/S de nœud** : nouveau filtre « visibles / tous » dans le `NodeIOReorganizer`.
- **Zone de dessin** : ajout de barres de défilement SVG lorsque le zoom déborde de la zone visible.
- **Gestion des tags** : nouveau bouton de bascule du mode de positionnement dans les tables de configuration de tags ; contrôles granulaires ajout / suppression / mise à jour dans `UpdateModeGrid`.
- **Import Excel** :
  - nouvelle option `error_on_new_nodes` (case à cocher UI + serveur) pour bloquer l'import en cas de nouveau nœud non attendu ;
  - nouvelle option `error_on_new_flux` pour les feuilles secondaires ;
  - acceptation de « Valeur » comme synonyme de la colonne valeur réconciliée dans les feuilles Résultats / Analyse ;
  - hiérarchie Résultats pour les feuilles primaires / secondaires et comptage matriciel exact des flux.
- **Licences OSP** :
  - onglet « Vues » désactivé sans licence OSP (absent en mode basique) ;
  - lignes grisées dans les grilles pour les fonctionnalités sans licence ;
  - styles ajoutés au profil par défaut.
- **Essai gratuit OpenSankey+ — 30 jours opt-in** : nouveau mécanisme de période d'essai entièrement client-side (`localStorage`), sans login, sans empreinte numérique. Au premier chargement, une fenêtre d'accueil propose à l'utilisateur d'activer 30 jours d'OpenSankey+ d'un clic ; une bannière permanente en bas de page reflète l'état (« Démarrer l'essai » / « N jours restants » / « Débloquer »). À l'expiration, les fonctionnalités OS+ se reverrouillent automatiquement et une fenêtre invite à souscrire ou à continuer en gratuit. Mécanisme analytics anonymes côté serveur via deux endpoints `POST /api/trial/started` et `POST /api/trial/converted` (UUID anonyme uniquement, aucune PII), compteur fichier sous `cache/`, CLI de lecture `python scripts/trial_stats.py`. Notification email à `julien.alapetite@terriflux.fr` à chaque démarrage d'essai. Documentation utilisateur complète : 7 scénarios couverts dans [doc/sources/pages/user_trial.rst](doc/sources/pages/user_trial.rst).
- **Changelogs par module** : adoption du format [Keep a Changelog](https://keepachangelog.com/) avec un fichier `CHANGELOG.md` par module (sankeyapplication, OpenSankey+, OpenSankey, SankeyExcelParser, LoginComponent) et un récapitulatif consolidé en tête du changelog racine, conçu pour générer les release notes.

### Modifications
- **Mise en page** : amélioration des groupes de layout (`groups` exposés en getter), améliorations diverses de `UpdateModeGrid`.
- **Légende** : l'offset des libellés de tag est désormais proportionnel à la taille de police.
- **Libellés** : le séparateur de libellé par défaut est vide (le libellé complet est affiché par défaut).
- **Import Excel — messages** : affichage des 10 premiers nœuds/flux manquants en aperçu d'erreur ; détails déplacés vers le log debug pour garder le `warn_msg` court.
- **Submodule OpenSankey+** : mises à jour majeures du positionnement et du rendu des nœuds.

### Corrections
- **Libellé `in→out`** : affiché uniquement quand la somme des flux entrants diffère de la somme des sortants ([9863ad5](https://gitlab.com/su-model/sankeyapplication/-/commit/9863ad5)).
- **Plan Z des nœuds** : `moveToFirstPlan` / `moveToLastPlan` étaient inversés.
- **Tags** : correction des libellés de tag.
- **Import Excel** : restauration du comportement bloquant pour `error_on_new_nodes` ; libellé et tooltip mis à jour pour refléter ce blocage.
- **Issue [#130](https://gitlab.com/su-model/sankeyapplication/-/work_items/130)** : correctif intégré côté OpenSankey.
- **Self-loops (flux d'un nœud sur lui-même)** : un flux dont source et cible sont identiques s'affichait à (0,0) au lieu de boucler sur le nœud — `updateLinksPositions` ne calculait que le point de départ et jamais le point d'arrivée pour ce cas. Les deux extrémités sont maintenant calculées dans la même itération ([opensankey#800](https://gitlab.com/su-model/opensankey/-/issues/800)).

---

## [Non publié] — Mars 2026

### Ajouts
- **Bannière premium `BannerSubscriptionSA`** dans la barre latérale : bouton « Get Premium » injecté dans `additional_bottom_item`, masqué si `has_sankey_plus` ou `is_static`, redirigeant vers `/license/checkout` (7b3691a, c52a033, efea389).
- **Script de déploiement multi-environnements `update_opensankey.sh`** prenant un argument `dev|test|prod`, activant le venv correspondant, exportant `EIGEN_INCLUDE`, enchaînant `git pull`, `git submodule update --recursive`, `deploy_SankeyApp.sh` puis `restart_site.sh ${ENV}` (3f4115b).

### Corrections
- **fix(deploy)** : chemin du venv corrigé dans `update_opensankey.sh` (`${ENV_DIR}/${ENV}_opensankey/bin/activate`) (989b8a2).

### Modifications
- `.gitignore` : ajout de `.claude/settings.local.json` et `dbg_constraints__summary_txt_filename` (7b3691a).
- `chore` : nombreux bumps de pointeurs des submodules `OpenSankey+`, `MFAProblem`, `LoginComponent` (8656466, 975acc7, 1681f33, 1555686, fcbf51b, 0a53454, 0a70bb4, c077e15, ba31f05, d2e5ab6, 9ffed08, 5bd392a, 24bb60d, 65d8fe1, db82b8b, 88bd05c, 595fe98, 128daae, 0459a8f, 46f2a67, c122ce2, ef16cf5, bdef946, 6bdd795, b563a6c, cb70fe1).

---

## [Non publié] — Avril 2026

### Corrections
- `fix(node)` : affichage du libellé `in→out` quand la somme des flux entrants diffère de la somme des sortants (9863ad5).
- `fix(link)` : self-loops affichés correctement — les flux dont source et cible sont identiques calculaient uniquement leur point de départ, le point d'arrivée restant à (0,0). `updateLinksPositions` exécute désormais les branches source et cible dans la même itération pour ce cas ([opensankey#800](https://gitlab.com/su-model/opensankey/-/issues/800)).

### Ajouts
- `feat(ui/server)` : case à cocher `error_on_new_nodes` côté UI et serveur, suppression du bruit de debug (4296a91).
- **`feat(trial)` : essai gratuit OpenSankey+ de 30 jours, opt-in, sans login.** Le serveur expose deux routes anonymes `POST /api/trial/started` et `POST /api/trial/converted`, avec un compteur fichier (`cache/trial_counter.txt`) et un journal d'événements append-only (`cache/trial_events.jsonl`). Aucune donnée personnelle n'est journalisée, seul un UUID anonyme généré côté client. Une notification email est envoyée à `julien.alapetite@terriflux.fr` à chaque démarrage d'essai (best-effort, en thread daemon). CLI de lecture des compteurs : `python scripts/trial_stats.py [--by-day | --raw]`. La bannière `BannerSubscriptionSA` est retirée de `AppSA.tsx` au profit de `BannerTrialOSP` exposée par OpenSankey+, qui couvre les deux entrées (SA et OS+ standalone). Documentation utilisateur complète dans [doc/sources/pages/user_trial.rst](doc/sources/pages/user_trial.rst).
- **`docs` : changelogs par module + récapitulatif consolidé** au format [Keep a Changelog](https://keepachangelog.com/), couvrant mars et avril 2026 (847e8af).

### Modifications
- `chore` : mises à jour répétées du submodule OpenSankey+ pour intégrer les évolutions d'avril (94efb62, a531608, 897eddf, 0c312de, 1a96eb8, 3bb4d1b, 985ee42, 19107b0, 68e8b7a, 32fe1fa).
- `major` : intégration de la mise à jour majeure d'OpenSankey+ (positionnement et rendu des nœuds) (4157172).
- Travaux en cours sur les stocks (41fb7d3) et mises à jour générales (d4c75ff, 7183426).
