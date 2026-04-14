# Changelog — SankeyApplication

Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).
Ce fichier agrège les changements visibles pour les utilisateurs de SankeyApplication, avec un récapitulatif consolidé en tête. Les changelogs détaillés par module sont disponibles dans :

- [submodules/OpenSankey+/CHANGELOG.md](submodules/OpenSankey+/CHANGELOG.md)
- [submodules/OpenSankey+/submodules/OpenSankey/CHANGELOG.md](submodules/OpenSankey+/submodules/OpenSankey/CHANGELOG.md)
- [submodules/OpenSankey+/submodules/OpenSankey/submodules/SankeyExcelParser/CHANGELOG.md](submodules/OpenSankey+/submodules/OpenSankey/submodules/SankeyExcelParser/CHANGELOG.md)
- [submodules/LoginComponent/CHANGELOG.md](submodules/LoginComponent/CHANGELOG.md)
- [submodules/MFAProblem/CHANGELOG.md](submodules/MFAProblem/CHANGELOG.md)

---

## Récapitulatif — Avril 2026

Cette section consolide les évolutions livrées en avril 2026, tous modules confondus, et sert de base à la génération des notes de version.

### Ajouts
- **Noms de styles par défaut traduisibles (FR/EN)** : les styles créés automatiquement à l'import (style de nœud/flux/container par défaut, étiquettes produit/secteur, import-export collés et dessus/dessous, styles unitaires) suivent désormais la langue de l'interface. Les styles renommés manuellement par l'utilisateur sont préservés.
- **Document d'architecture** : nouveau fichier [ARCHITECTURE.md](ARCHITECTURE.md) décrivant la stack 3 couches (OpenSankey → OpenSankey+ → SankeyApplication), le data model, le pipeline de rendu D3, le pattern ref-based des menus, le système de vues, la persistance, et les submodules Python (SankeyExcelParser, MFAProblem, LoginComponent). Inclut 17 pistes d'amélioration identifiées lors de la revue de code.
- **Sous-menu « Réinitialiser les intervalles verticaux »** (mode parametric) : champ d'écart vertical, bouton reset au défaut, bouton appliquer. L'écart vertical est partagé en session avec les sous-menus de centrage et minimisation des croisements.
- **Persistance de session des écarts de mise en page** : les valeurs des champs d'écart horizontal/vertical sont conservées entre ouvertures de menu pendant la session (pas sauvées en JSON). Bouton « Réinitialiser au défaut » ajouté aux sous-menus de centrage et minimisation.
- **Ecarts horizontaux/verticaux configurables pour la mise en page automatique** : les commandes de centrage et minimisation des croisements (menu contextuel) proposent désormais des champs d'écart horizontal/vertical. Idem dans le dialogue d'import Excel (section Mise en page).
- **Mise en page automatique unifiée et enrichie** : même interface Mise en page dans le menu contextuel clic-droit et le dialogue d'import Excel (section élargie, sélecteur Mode « Centrer les nœuds » / « Minimiser les croisements », bouton unique de lancement). Nouvelles options pour épingler les nœuds sans flux entrant à l'extrémité gauche et les nœuds sans flux sortant à l'extrémité droite. Traductions FR/EN complètes avec tooltips. Écarts, modes d'extrémité et mode de calcul sont partagés en session entre les deux interfaces.
- **Verrouillage colonne (u) et ligne (v) sur les nœuds** : le menu d'apparence d'un nœud expose deux champs « Colonne » et « Ligne » assortis chacun d'un bouton cadenas. Quand verrouillé, le recalcul automatique conserve la colonne et/ou la position verticale relative du nœud dans sa colonne, en préservant l'ordre entre les nœuds verrouillés. Les nœuds non verrouillés continuent d'être placés librement autour. Permet d'épingler manuellement certains nœuds tout en laissant l'algo optimiser les autres.
- **Persistance Excel de la colonne u et de la ligne v** : deux nouvelles colonnes entières optionnelles « Colonne u » / « Ligne v » (EN « Column u » / « Row v ») acceptées à l'import dans les onglets « Noeuds », « Produits » et « Secteurs ». Quand une valeur est renseignée, le nœud est automatiquement verrouillé sur cette position (sémantique : valeur fournie = épinglée). À l'export Excel, ces colonnes sont ajoutées quand au moins un nœud porte une valeur, sinon elles sont omises — aucune rupture pour les fichiers existants.
- **Intervalles, incertitude, min/max sur les flux (AFM)** : nouveau type de donnée `intervals`, champs min/max/incertitude relative (%) persistés en JSON et synchronisés avec l'export/import Excel. Panneau de configuration flux restructuré en onglets Basique/AFM. Affichage `[min - max]` sur le diagramme pour les flux intervalle.
- **Séparation type de données / affichage des intervalles** : les deux sélecteurs de la barre d'outils sont désormais indépendants (`data_source` + `interval_display`). On peut voir les intervalles données ou résultats selon la source sélectionnée. « Valeurs possibles » réservé aux données calculées. Type d'affichage affiché dans la légende.
- **Stocks et flux de recyclage** : un nœud dont la somme des flux entrants diffère de la somme des sortants affiche désormais un libellé `entrée → sortie` permettant de visualiser explicitement l'écart (stock).
- **Stocks (Δstock) intégrés au bilan matière MFA**. Une variation de stock déclarée sur un nœud (feuille Excel `stocks`) est désormais traitée par le solveur MFAProblem comme une variable réconciliable supplémentaire dans la contrainte de bilan matière, selon la convention `Σ(entrants) − Σ(sortants) − Δstock = 0`. La feuille `stocks` accepte trois nouvelles colonnes optionnelles `uncert`, `min`, `max` qui pilotent la réconciliation. Deux nouvelles feuilles Excel **`stocks_results`** et **`stocks_analysis`** (parallèles à `results` / `analysis` pour les flux) sont produites en sortie : valeur réconciliée, intervalle libre, valeur d'entrée, sigma, nb_sigmas, classification. Ces feuilles sont à la fois écrites par le pipeline de réconciliation et lues par le pipeline d'import, ce qui permet au front de récupérer les résultats stocks via `node.stock_results`. Cross-link `alterego` entre input et output. Documentation utilisateur complète dans [doc/sources/pages/user_stocks.rst](doc/sources/pages/user_stocks.rst), tests unitaires dans `submodules/MFAProblem/mfa_problem/tests/unit/test_mfa_problem_stocks.py`.
- **Flux dégradés (tapered)** : prise en charge de valeurs distinctes côté source et côté destination (`data_value` / `data_value_target`), permettant de représenter des pertes ou gains le long du flux.
- **Réorganisation des E/S de nœud** : nouveau filtre « visibles / tous » dans le `NodeIOReorganizer`. L'ordre des flux entrants/sortants est désormais aussi recalculé automatiquement à la fin d'un drag de nœud — sur le nœud déplacé et sur tous ses voisins connectés — selon la nouvelle disposition spatiale. L'annulation (Ctrl+Z) restaure d'un seul coup la position et l'ordre des flux antérieurs.
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
- **fix(import Excel)** : les styles import/export ne sont plus créés automatiquement à l'import d'un fichier Excel contenant les onglets Produits/Secteurs mais sans onglet Échange.
- **fix(import Excel)** : les styles produit/secteur créés automatiquement à l'import apparaissaient avec retard dans le dialogue « Édition des styles » (il fallait cliquer sur « + » pour forcer le rafraîchissement). Le dialogue est désormais mis à jour à la fin de l'import.
- **fix(légende)** : taille de police incorrecte quand la légende est détachée de la zone de dessin et que le diagramme est zoomé out. La compensation de zoom était appliquée à tort sur la légende détachée, ce qui agrandissait le texte au lieu de respecter la police configurée.
- **Libellé `in→out`** : affiché uniquement quand la somme des flux entrants diffère de la somme des sortants ([9863ad5](https://gitlab.com/su-model/sankeyapplication/-/commit/9863ad5)).
- **Plan Z des nœuds** : `moveToFirstPlan` / `moveToLastPlan` étaient inversés.
- **Tags** : correction des libellés de tag.
- **Import Excel** : restauration du comportement bloquant pour `error_on_new_nodes` ; libellé et tooltip mis à jour pour refléter ce blocage.
- **Issue [#130](https://gitlab.com/su-model/sankeyapplication/-/work_items/130)** : correctif intégré côté OpenSankey.
- **Self-loops (flux d'un nœud sur lui-même)** : un flux dont source et cible sont identiques s'affichait à (0,0) au lieu de boucler sur le nœud — `updateLinksPositions` ne calculait que le point de départ et jamais le point d'arrivée pour ce cas. Les deux extrémités sont maintenant calculées dans la même itération ([opensankey#800](https://gitlab.com/su-model/opensankey/-/issues/800)).
- **Contraintes ratio_flux avec Min (≥) ou Max (≤)** : les contraintes d'inégalité sans Coef produisaient des résultats faux — `coef_eq` par défaut à 1.0 créait une contrainte d'égalité parasite forçant le flux de référence à zéro, les types `ineq_inf`/`ineq_sup` étaient inversés et les coefficients non normalisés (ratio perdu dans le solveur).

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
