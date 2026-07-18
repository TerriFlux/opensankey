# Comparatif STAN 2.7 ↔ OpenSankey+ / SankeyApplication — et plan « Déplacement STAN »

Sources STAN : aide intégrée STAN 2.7.101 (CHM anglais, 68 pages, TU Wien / inka software),
installation locale `C:\Program Files (x86)\inka software\STAN 2.7.101\`, exemples `.zmfa` décodés
(gzip + XML, schéma `MfaSystemData.xsd`).
Repérage de notre existant : mémoire du code `packages/*`, `submodules/MFAProblem`, `submodules/.../SankeyExcelParser` (juillet 2026).
Cadre stratégique : stratégie de déplacement de niche (STAN / e!Sankey / SankeyMATIC), prioritaire.
Complément du comparatif e!Sankey : `NOTE-ESANKEY-COMPARATIF.md` (e!Sankey = dessin ; STAN = calcul).

---

## 1. Ce qu'est STAN

STAN (« subSTance flow ANalysis », TU Wien, Oliver Cencic / Helmut Rechberger) est le **standard
académique de la MFA** selon la norme autrichienne ÖNORM S 2096. C'est un **freeware desktop
Windows** (.NET 3.5, WinForms) : on dessine un modèle (processus, flux, frontière système), on
saisit des données avec incertitudes, et STAN calcule les inconnues par **réconciliation de
données** (moindres carrés pondérés), **propagation d'erreur** et **détection d'erreurs
grossières**. Dernière version 2.7.101 ; développement dormant depuis ~2022 ; communauté = recherche,
enseignement MFA, gestion des déchets. Portail d'échange de fichiers : stan2web.net.

| | STAN 2.7 | OpenSankey+ / SankeyApplication |
|---|---|---|
| Nature | **Desktop Windows** freeware (.NET WinForms) | **App web SaaS** (React + D3 + Flask) |
| Philosophie | **Outil de calcul MFA** : le diagramme sert le modèle mathématique | Modèle + calcul + **visualisation soignée** + diffusion web |
| Calcul | Réconciliation WLS, propagation d'erreur analytique, erreurs grossières, non-linéaire (TC, concentrations) | Solveur MFAProblem (CVXPY/OSQP), contraintes min/max, réconciliation, **Monte-Carlo** |
| Rendu Sankey | Basique (largeur proportionnelle, un slider) | Cœur de métier : styles, tags, vues, légendes, autolayout, publication |
| Données | Data Explorer (grille), Excel via presse-papiers | Round-trip Excel structuré (SEP) + tableur embarqué (Univer) |
| Diffusion | stan2web (dépôt de fichiers .zmfa) | Publication de sites statiques interactifs |

Conséquence : STAN gagne (encore) sur la **rigueur statistique affichée** et sa **légitimité
académique normée** ; nous gagnons sur tout le reste (web, visualisation, données multi-dimensions,
diffusion). Le plan vise deux choses : (1) offrir une **voie de migration sans perte** aux
utilisateurs STAN, (2) atteindre la **parité de vocabulaire statistique** qui fait référence dans
les publications MFA (les papiers citent « degree of over-determination », « gross error
detection », « standard scores »…).

---

## 2. Le modèle STAN en détail (ce que la doc décrit)

### 2.1 Structure du modèle
- **Frontière système** (spatiale + temporelle) explicite, dessinée ; les processus sont dedans ou
  dehors (les processus hors frontière ne sont pas équilibrés). Textes auto : somme des imports,
  exports, stocks, variations de stock, nom + période.
- **Processus** : boîte noire, avec ou sans **stock**, ou **sous-système** (imbrication
  jusqu'à **6 niveaux**, zone de dessin dédiée ; les flux d'import/export du sous-système sont
  verrouillés à l'intérieur).
- **Flux** : internes, imports, exports (symboles I/E). Pas de flux qui se divise (processus de
  séparation obligatoire). Un flux mal connecté est affiché en pointillés et traité comme
  import/export.
- **Balancing désactivable par processus** (sur la couche des biens) quand on ne modélise que les
  flux porteurs d'une substance — le nom s'affiche alors entre parenthèses.

### 2.2 Couches (layers) et périodes
- **Couche des biens** (toujours présente), + couches de **substances** (tableau périodique +
  composés personnalisés), + couche **énergie**, + mode **sous-biens** (subgoods).
- **Équations de concentration** entre couches : `masse_substance = masse_bien × concentration`,
  `masse_bien = volume_bien × densité` — le lien biens ↔ substances est résolu par le solveur
  (bilinéaire).
- **Sous-biens** : la somme des couches de sous-biens doit égaler la couche des biens (contrainte
  supplémentaire, contrairement aux substances où la somme est ≤).
- **Périodes** : suite contiguë de périodes de même durée (ex. 2000–2005). **Équation de stock
  inter-périodes** : `stock_i = stock_{i-1} + Δstock_{i-1}`. Série temporelle d'un flux affichable
  en graphique (clic droit).
- Saisie par couche : biens = masse et/ou volume + densité ; substances = masse et/ou
  concentration ; énergie = énergie et/ou concentration énergétique.

### 2.3 Données, incertitudes, réconciliation
- Toute valeur = **moyenne ± incertitude-type** (normale), saisie absolue ou en % ; l'incertitude
  est optionnelle (valeur alors considérée exacte... ou inconnue si « ? »).
- **Coefficients de transfert** par processus : matrice entrées × sorties, relatifs à la somme des
  entrées ou à une entrée seule, incertitude possible, « ? » pour les faire calculer. Somme des TC
  de sortie = 1 (stock compté comme sortie).
- **Relations linéaires additionnelles** : `flux_x = facteur × flux_y` entre types de valeurs
  (masses, volumes, concentrations, TC), y compris **entre couches et périodes différentes**.
- **Calcul** : vérification de plausibilité → réconciliation (si sur-détermination) → calcul des
  inconnues → propagation d'erreur → **tests statistiques** finaux. Sorties affichées dans le
  diagramme (bascule données saisies / calculées).
- **Diagnostics** (Trace Output, cliquable → objet mis en surbrillance) :
  - **degré de sur-détermination** (nb d'équations sans inconnues après transformation) ;
  - **valeur de la fonction objectif** (WLS) ;
  - **qualité de la réconciliation** ∈ [0,1] (si pas d'erreur grossière) ;
  - **détection d'erreurs grossières** : test sur les ajustements (hors intervalle de confiance
    95 % → suspicion), histogramme des **standard scores**
    (`(mesuré − réconcilié) / incertitude-type`) ;
  - contrôle de contradictions.
- Deux **modules de calcul** interchangeables (architecture à plugins .dll) : **Cencic 2012**
  (dense, réconciliation non linéaire — successive linéarisation) et **IAL-IMPL 2013** (Kelly,
  matrices creuses, 10–50× plus rapide au-delà de ~4000 équations+variables ; licence séparée
  ~100 $ académique — la version d'essai est limitée à 200 équations+variables).
- Aides numériques : **scaling automatique** des matrices (conditionnement ; coupé avec les
  sous-biens), graine du générateur aléatoire pour les **valeurs initiales** des itérations
  non linéaires (tester la stabilité en changeant la graine).
- **Base d'échelle** (scaling basis) : les données peuvent être rapportées à une entité (ex.
  100 000 habitants) et affichées ainsi.

### 2.4 Saisie, import/export, documentation
- **Data Explorer** : grille type tableur (groupage hiérarchique par colonnes, tri, sélection par
  blocs), édition directe, **validation d'unités**, copier/coller **bidirectionnel avec Excel**
  (pas de liaison live), export CSV/TXT (système, flux, processus, valeurs, TC, stocks, Δstocks).
- **Unités** : définitions personnalisées (masse, volume, énergie, temps) avec facteur de
  conversion ; **unité saisie librement derrière le nombre** (« 100 kg/a ») ; **unités d'affichage
  par couche** ; bascule unités saisies / unités d'affichage.
- **Formats de nombre pilotés par la métrologie** : arrondi à N **chiffres significatifs selon le
  chiffre de tête de l'incertitude** (la position du dernier chiffre significatif de l'incertitude
  détermine l'arrondi de la moyenne), ou chiffres significatifs indépendants, ou décimales fixes ;
  affichage des incertitudes en % ou absolu ; seuils zéro et notation exponentielle.
- **Documentation par valeur** : chaque valeur de flux / stock / TC porte, **par couche et par
  période**, une **référence bibliographique** (réutilisable via liste déroulante) et des
  remarques. Métriques de « niveau de documentation » du fichier (critères d'upload stan2web).
- **Catalogue de flux** : nommage assisté depuis un fichier Excel (par défaut le **Catalogue
  européen des déchets, EWC**) avec recherche/filtre.
- **Liste des processus** (entrées/sorties par processus), exportable Excel.
- **Bilan grossier affiché dans l'icône du processus** (Σ entrées connues − Σ sorties connues)
  **avant tout calcul** — détection visuelle des flux manquants / erreurs de saisie.
- Recherche d'objets (CTRL+F) avec liste de résultats cliquable.

### 2.5 Diagramme et diffusion
- Affichage Sankey **optionnel** (bascule), largeur max réglable au slider, portée de l'échelle
  (couche courante / toutes couches × période courante / toutes périodes), masquage des flux à
  zéro, texte alternatif pour valeurs inconnues.
- Ovales de valeur sur les flux (position réglable le long du tracé), styles de flux à coudes,
  points d'ancrage sur grille, undo/redo **limité aux déplacements/redimensionnements** (!).
- Export image (formats, résolution, niveaux de gris, anti-aliasing), impression.
- **stan2web** : portail d'upload/recherche/publication de fichiers STAN (fichier publié =
  lecture seule, copie obligatoire).
- Fichiers : `.zmfa` (**gzip + XML**, schéma propre), `.smfa` (**SQLite**, pour interop
  multi-outils), anciens `.mfa`/`.xmfa` (ouverture en 32 bits uniquement). `stancmd.exe` (CLI)
  présent dans l'installation.

---

## 3. Comparatif fonctionnel

Statut chez nous : **OK** = présent · **~** = partiel · **✗** = absent · **(V)** = à vérifier dans le code avant d'engager.

### 3.1 Modèle & structure
| Fonction STAN | Chez nous | Écart |
|---|---|---|
| Processus / flux / imports / exports | OK | Nos nœuds/flux couvrent ; pas de distinction formelle import/export (symboles I/E) mais équivalent par structure. |
| **Frontière système** dessinée + textes auto (Σ imports/exports/stocks) | ✗ | Nos zones/containers peuvent la dessiner, mais rien ne **calcule** les sommes de frontière ni ne marque dedans/dehors. Concept identitaire MFA. |
| Sous-systèmes hiérarchiques (6 niveaux) | OK | Dimensions de nœud + agrégation : plus général (multi-axes antagonistes). |
| Processus avec stock | OK | Stocks présents (S variable, Ratio Stock, forme stock node-like #1229). |
| Balancing désactivable par processus | (V) | À vérifier côté SEP/MFAProblem (exclusion d'un nœud des contraintes de conservation). |
| Flux qui ne se divisent pas (processus de séparation) | OK | Même modèle. |

### 3.2 Couches, périodes, stocks
| Fonction STAN | Chez nous | Écart |
|---|---|---|
| Couches biens / substances / énergie | ~ | Nos **fluxTags** portent des dimensions multiples (au-delà de STAN), mais chaque tag est résolu **indépendamment** : pas d'**équations de concentration** couplant biens ↔ substances dans le solveur. |
| Équations de concentration (bilinéaires) + densité masse/volume | ✗ | Absent. C'est le cœur « SFA » de STAN (résolution non linéaire couplée). Gros chantier solveur. |
| Sous-biens (Σ sous-couches = couche biens) | ~ | On a la somme des feuilles via dimension pour les **nœuds** ; pas de contrainte d'égalité entre **couches de valeurs** d'un même flux. À rapprocher de la fusion tags/modèle (SA#283, partitions). |
| Périodes contiguës + équation de stock inter-périodes | ~ | dataTags années + **chaînage de stocks #156 en cours** (feuille de chaînage non commitée) — c'est exactement l'équation de stock STAN. mfa_problem#249 (lissage temporel) va **au-delà** de STAN. |
| Série temporelle d'un flux (graphique) | ~ | OS#1278 (graphiques d'analyse) : la grammaire décomposer×comparer couvre ce cas ; parqué. |
| Base d'échelle (per capita) | OK | Échelles/unités par tag, facteurs d'unité. |

### 3.3 Incertitudes & réconciliation
| Fonction STAN | Chez nous | Écart |
|---|---|---|
| Valeur = moyenne ± incertitude-type, saisie % ou absolue | OK | Sigmas SEP ; vérifier la saisie « % » directe dans l'UI. |
| Réconciliation WLS | OK | MFAProblem (CVXPY/OSQP) ; mfa#250 prépare des backends configurables (Clarabel/HiGHS). |
| Propagation d'erreur | ~ | Chez nous **Monte-Carlo** (`uncertainty_analysis`, nb_realisations, classification préalable des variables libres) ; STAN fait de l'**analytique** (plus rapide, référencé dans les papiers). Les deux se valent scientifiquement ; l'écart est un écart d'**affichage/diagnostic**, pas de fond. |
| **Détection d'erreurs grossières** (test IC 95 %, standard scores) | ~ | `mfa_problem_check_io` flagge les réconciliations hors incertitude ; pas de **test statistique formalisé** ni d'histogramme des standard scores exposé. |
| **Degré de sur-détermination** affiché | ✗ | Notion présente implicitement (redondance) ; non calculée/affichée. |
| **Qualité de réconciliation** ∈ [0,1] | ✗ | Absent. Indicateur simple, très parlant, cité dans les publis. |
| Coefficients de transfert (matrice par processus, « ? » calculable, incertitude) | ~ | Ratios SEP (#116 unification ratio-flux) couvrent le fond ; pas d'**éditeur matriciel par nœud** ni de TC « à calculer » exposé comme résultat. |
| Relations linéaires additionnelles (inter-couches, inter-périodes) | ~ | Contraintes SEP (ratios, min/max) ; les relations **inter-tags** arbitraires sont à vérifier (V). |
| Modules de calcul interchangeables | ~ | mfa#250 (OSQP/Clarabel/HiGHS) = même idée, en mieux (pas de licence tierce à 100 $). |
| Scaling matriciel, graine RNG pour valeurs initiales | OK/na | OSQP gère le conditionnement ; pas de systèmes bilinéaires chez nous (pour l'instant). |
| Bascule affichage données saisies / calculées | ~ | On affiche les résultats réconciliés ; la **bascule explicite** saisie/calculé dans le diagramme est à vérifier (V). |

### 3.4 Saisie, données, documentation
| Fonction STAN | Chez nous | Écart |
|---|---|---|
| Data Explorer (grille, groupage, validation) | OK | Tableur Univer (SA#163 en cours) + round-trip SEP : au-delà. |
| Copier/coller Excel | OK | Et mieux : fichier Excel structuré complet (SEP). |
| Export CSV des données | OK | Exports SEP/JSON ; vérifier un export CSV « plat » simple (V). |
| Unités personnalisées + conversion + unité tapée derrière le nombre | ~ | `is_unit`/`unit_factor` OK ; la saisie « 100 kg/a » inline et la conversion automatique à la volée, non. |
| Unités d'affichage par couche | OK | Échelles/unités par tag. |
| **Formats de nombre pilotés par l'incertitude** (chiffres significatifs selon l'incertitude) | ✗ | On a des formats de nombre, pas ce mode métrologique. Peu coûteux, très « pro » pour le public MFA. |
| **Référence bibliographique + remarques par valeur** (par couche et période) | ~ | Faisable en générique : fluxTag « Source » (filtrable, colorable, visible en vues/tooltips — plus que STAN) ou colonnes libres SEP. Mais un tag est une **dimension** (partitionne les valeurs), pas une **métadonnée** : pas de liste de références réutilisable ni de niveau de documentation. À formaliser → S-C2. |
| Catalogue de flux (EWC, Excel) | ✗ | Absent (notre `icon_catalog` = icônes, pas nomenclatures). |
| Liste des processus (I/O par processus) | OK | Vues TER / tableur. |
| **Bilan grossier avant calcul** affiché sur le processus | ✗ | Recoupe exactement le lot D du jalon e!Sankey (balance label + marqueur). Un seul développement sert les deux migrations. |
| Recherche d'objets dans le modèle | ✗ | = E1 du jalon e!Sankey. |

### 3.5 Diagramme & diffusion
| Fonction STAN | Chez nous | Écart |
|---|---|---|
| Affichage Sankey proportionnel, largeur max, masquage flux nuls | OK | Bien au-delà (styles, tags, vues, thèmes, autolayout…). |
| Ovales de valeur positionnables sur le flux | OK | Labels de flux positionnables. |
| Export image / impression | OK | PNG/PDF/SVG/GIF. |
| Undo/redo complet | OK | STAN : uniquement déplacements/redimensionnements. Argument de bascule. |
| stan2web (partage de fichiers) | OK | Publication de sites interactifs + SankeyThèque : très au-delà. |
| Format de fichier ouvert (.zmfa gzip+XML, .smfa SQLite) | OK | JSON versionné (format_version). |
| CLI (`stancmd.exe`) | OK | API Python (SEP/MFAProblem) + endpoints Flask. |
| Import de fichiers STAN | ~ | **Nous** importons `.smfa`/`.zmfa` (`server/stan_smfa.py` : structure, géométrie, périodes→dataTags, stocks) ; STAN n'importe rien de nous. Restent incertitudes/TC/multi-couches → lot S-A. |
| Bilingue DE/EN | ~ | FR/EN chez nous ; **pas de DE** — le cœur historique de la communauté STAN est germanophone. |

---

## 4. Nos forces — déjà au-delà de STAN (à marteler côté marketing)

- **Web, zéro install, multiplateforme** — STAN est Windows-only, .NET 3.5, WinForms vieillissant.
- **Visualisation** : STAN produit des diagrammes fonctionnels mais rustiques ; nous avons styles,
  tags, vues multiples, légendes, thèmes, publication interactive, exports soignés.
- **Dimensions multiples** : STAN = couches × périodes ; nous = tags arbitraires croisés
  (data/flux/vue/niveau) + agrégation hiérarchique multi-axes.
- **Excel structuré round-trip** (SEP) vs presse-papiers.
- **Monte-Carlo** natif (STAN n'en fait pas) et lissage temporel multi-années (mfa#249) inconnu de STAN.
- **Solveur libre** (OSQP), pas de module payant pour les gros systèmes (IMPL : licence séparée).
- **Undo/redo complet**, autolayout, importeur e!Sankey.
- **Développement actif** vs STAN dormant depuis ~2022 (dernier runtime .NET 3.5 ; risque
  d'obsolescence perçu par les labos).

---

## 5. Plan « Déplacement STAN »

Objectif : que tout utilisateur STAN puisse **ouvrir son fichier chez nous et retrouver son
vocabulaire** (réconciliation, erreurs grossières, TC, couches, documentation). Ordonné par
ratio valeur / effort. Chaque ligne = issue candidate.

### Lot S-A — Importeur STAN : compléter l'existant (priorité 1, effort faible-moyen)
**L'importeur existe déjà** : `packages/opensankey/opensankey/server/stan_smfa.py` (~64 Ko, testé),
`.smfa` (SQLite) et `.zmfa` (gzip+XML) détectés par magic number. Couvert : structure
(processus → nœuds, I/E → nœuds externes), géométrie (Shape/Anchor → positions, polylignes,
orientation), valeurs par période (**périodes → groupe de dataTags**), stocks (niveau + variation),
unités d'affichage, couleurs, zones de texte, thème STAN dédié. Reste à couvrir (absent du code) :
- **S-A1** — **Incertitudes** ± → sigmas SEP (colonnes `MFInputSigma`/uncert du schéma STAN),
  pour que la réconciliation reparte chez nous. Prérequis de S-B.
- **S-A2** — Données de calcul : **TC → ratios SEP** (`TransCoeff`/`ProcessInput`/`ProcessOutput`),
  relations additionnelles → contraintes, exclusion de balancing (`Balance`). Sans équivalent :
  import documentaire + rapport d'import (comme e!Sankey).
- **S-A3** — **Multi-couches** : aujourd'hui une seule couche importée (`layer_id`) ; mapper les
  couches → fluxTags pour tout ramener en un document. Sous-systèmes → dimension de niveau (V :
  couverture actuelle partielle via `_connector_to_leaf_process`).
- **S-A4** — Références bibliographiques/remarques par valeur → dépend de S-C2 ; en attendant,
  les préserver dans le rapport d'import.

### Lot S-B — Parité du vocabulaire statistique (priorité 1, effort faible-moyen)
Le solveur fait déjà l'essentiel ; il manque **l'affichage des diagnostics de référence**.
S'insère dans l'onglet AFM (ambre) de l'inspecteur (OS#1258) et dans mfa#250.
- **S-B1** — Rapport de réconciliation : degré de sur-détermination, valeur de la fonction
  objectif, **indice de qualité [0,1]**, liste des ajustements.
- **S-B2** — **Détection d'erreurs grossières** formalisée : standard scores
  `(mesuré − réconcilié)/σ`, seuil IC 95 %, histogramme, lien cliquable diagnostic → élément
  (nous avons déjà le flaggage hors-incertitude dans `mfa_problem_check_io` — le formaliser).
- **S-B3** — Bascule « données saisies / valeurs réconciliées » dans le diagramme (si absente).

### Lot S-C — Métrologie & documentation (priorité 2, effort faible chacun, forte crédibilité académique)
- **S-C1** — Format de nombre « chiffres significatifs pilotés par l'incertitude » + affichage ± / %.
- **S-C2** — **Formaliser la provenance des valeurs**. Aujourd'hui possible en générique (fluxTag
  « Source » — filtrable/colorable, ou colonnes libres SEP), mais un tag est une dimension qui
  partitionne les valeurs, pas une métadonnée. Formalisation légère : **liste de références au
  niveau document** + champ `source_ref` (+ remarque) porté par la **valeur** (donc par combinaison
  de tags = granularité STAN couche×période, gratuitement), édité dans l'inspecteur/tableur,
  tooltip, colonne SEP dédiée, publication. Le tag « Source » reste un usage complémentaire
  (visuel). Ne pas interférer avec la sémantique partition/`is_dimension` de SA#283. Décisif pour
  les papiers scientifiques (traçabilité de chaque nombre, « niveau de documentation »).
- **S-C3** — Saisie d'unité inline (« 100 kg/a ») avec conversion vers l'unité d'affichage.
- **S-C4** — Catalogues de nomenclature (EWC…) pour le nommage assisté des flux/nœuds — fichier
  Excel utilisateur, comme STAN.

### Lot S-D — Bilan visuel avant calcul (priorité 2 — déjà planifié côté e!Sankey)
- **S-D1** = D1/D2 du jalon e!Sankey (balance label + marqueur d'avertissement) **+** le « bilan
  grossier » STAN (Σ entrées connues − Σ sorties connues affiché avant tout calcul). Un seul
  développement, deux migrations servies. Y ajouter les **textes de frontière système**
  (Σ imports/exports/Δstocks) comme placeholders de zone de texte (la mécanique de zones de texte
  générées d'OS#1254 s'y prête).

### Lot S-E — Couches couplées / SFA (priorité 3, effort élevé — décision produit requise)
- **S-E1** — Équations de concentration biens ↔ substances (bilinéaire) dans MFAProblem :
  linéarisation successive ou produit de variables via solveur adapté (lien mfa#250). À arbitrer
  contre la valeur réelle : nos utilisateurs SFA sont-ils demandeurs, ou le découplage par tags
  suffit-il ? Prototype possible : concentrations **fixes** (connues) d'abord — le système reste
  linéaire et couvre l'usage majoritaire.
- **S-E2** — Contrainte « partition » : Σ sous-couches = couche mère (recoupe le modèle de
  partition de la fusion tags SA#283).
- **S-E3** — TC : éditeur matriciel par nœud (entrées × sorties) + TC calculés affichés en résultat.

### Lot S-F — Visibilité (marketing/SEO, parallèle au code)
- **S-F1** — Page « Alternative à STAN » (terriflux-site) : comparatif honnête, import .zmfa en
  ligne, EN + **DE**. STAN est freeware : l'argument n'est pas le prix mais **web, activité du
  projet, visualisation, Monte-Carlo, Excel structuré**.
- **S-F2** — Tutoriel « reproduire l'exemple ÖNORM S 2096 » (l'exemple est livré avec STAN) et les
  exemples du Handbook of MFA (Brunner & Rechberger) — c'est la porte d'entrée de tous les cours MFA.
- **S-F3** — DE dans les traductions (la stack i18n existe ; effort = volume de chaînes).

---

## 6. Séquencement proposé

1. **S-A (compléter l'importeur)** d'abord : la base existe (`stan_smfa.py`) ; S-A1 (incertitudes)
   et S-A2 (TC/contraintes) transforment un import « dessin » en import « modèle recalculable » —
   c'est là que la migration devient sans perte.
2. **S-B + S-D** ensuite : peu d'effort (le solveur sait déjà), gros gain de crédibilité ; S-D
   mutualisé avec le jalon e!Sankey.
3. **S-C** au fil de l'eau (indépendants, petits).
4. **S-E** seulement après décision produit explicite (le bilinéaire est le seul vrai chantier
   solveur ; commencer par concentrations fixes si on y va).
5. **S-F** en parallèle, dès que l'importeur tourne.

Quick wins isolés : **S-C1** (formats), **S-B1** (rapport — les chiffres existent déjà),
**S-A1** (incertitudes — le pipeline d'import est déjà en place).

---

*Note de travail — ne modifie aucun code.*

**Jalon GitLab** (groupe su-model, jalon 61) : « Déplacement STAN (parité MFA) »
— https://gitlab.com/groups/su-model/-/milestones/61
Issues créées (priorité 1) :
- **S-A** → os#1279 (compléter l'importeur `stan_smfa.py`)
- **S-B calcul** → mfa_problem#251 (diagnostics statistiques de réconciliation)
- **S-B affichage** → sa#286 (rapport dans l'onglet AFM + bascule saisi/réconcilié)

Lots S-C…S-F : issues à créer plus tard, à partir des sections ci-dessus.
