# Comparatif e!Sankey 5 ↔ OpenSankey+ / SankeyApplication — et jalon « Parité & déplacement e!Sankey »

Source e!Sankey : manuel utilisateur v5.2 (114 p., iPoint-systems, sept. 2022).
Repérage de notre existant : exploration du code `packages/opensankey*`, `packages/sankeyapplication` (juillet 2026).
Cadre stratégique : voir la stratégie de déplacement de niche (STAN / e!Sankey / SankeyMATIC), déjà marquée prioritaire.

---

## 1. Deux paradigmes différents

| | e!Sankey 5 | OpenSankey+ / SankeyApplication |
|---|---|---|
| Nature | Logiciel **desktop Windows** (.NET 4.8), licence poste | **App web SaaS** (React + D3 + Flask), rien à installer |
| Philosophie | **Outil de dessin** : on place, on tire une flèche, on tape une valeur | **Outil de modèle + calcul** : structure, tags, dimensions, réconciliation MFA |
| Calcul | Aucun (basic/pro) ou « Process Operations » simples (calc) | **Solveur MFA** complet (contraintes, faisabilité, réconciliation) |
| Données | Valeurs saisies à la main, ou **Live Link** vers cellules Excel | **Round-trip Excel structuré** (SEP), tableur embarqué (Univer) |
| Collaboration / diffusion | Fichier `.sankey` local, export image/SVG | **Publication de site statique interactif**, multi-vues, licences |

Conséquence : e!Sankey gagne sur l'**immédiateté du dessin manuel** et le **contrôle graphique fin** ;
nous gagnons sur le **calcul, la structure de données, le web et la diffusion**. Le plan ci-dessous vise
à combler l'écart de dessin/labellisation **sans renier notre socle modèle/MFA**, car c'est là que se
gagnent les utilisateurs e!Sankey qui migrent.

---

## 2. Différences fonctionnelles détaillées

Statut chez nous : **OK** = présent · **~** = partiel · **✗** = absent. Références de code dans le repérage (non recopiées ici).

### 2.1 Flèches / liens
| Fonction e!Sankey | Chez nous | Écart |
|---|---|---|
| Routage orthogonal (coudes 90°) | OK (`shape_orientation` hv/vh) | — |
| **Waypoints manuels multiples** (points de pliage libres, nombre illimité) | ~ | On n'a qu'un jeu **fixe** de poignées (courbure/tangente + 1 point recyclage). e!Sankey ajoute autant de coudes qu'on veut. |
| Flèches arrondies + courbure réglable | OK (Bézier) | — |
| Pointe / base activables par flèche | OK (`shape_is_arrow`, `shape_arrow_at_source`) | — |
| **Arrow spikes** (pointe accentuée sur flux fins) | ✗ | Absent. Astuce e!Sankey pour rendre visibles les tout petits flux. |
| Bordure de flux | OK | — |
| **Dégradé de couleur source→destination** | ✗ | Absent (listé hors périmètre de l'importeur). |

### 2.2 Labels de flux
| Fonction e!Sankey | Chez nous | Écart |
|---|---|---|
| Label auto (nom + valeur + unité), composants activables | OK | — |
| **Format string personnalisé** (`{EntryName} {Quantity} {UnitName}`, opérations `setPrefix/setPostfix/replace/setMaximumEntryNameLength/setSeparator/groupByUnitType`…) | ~ | On a une composition **structurée** (source de nom, séparateurs, unité) mais **pas de gabarit libre à mots-clés**. C'est une des forces les plus appréciées d'e!Sankey. |
| Pourcentages (flux multi / modèle / entrée-sortie de nœud) | OK (`%IS/%OS/%PS/%ID/%OD/%PD`) | Présent côté données ; vérifier l'exposition UI complète. |
| Rotation, fixe au segment, suit la largeur/courbe | OK (`textPath`, angle) | — |

### 2.3 Nœuds / process
| Fonction e!Sankey | Chez nous | Écart |
|---|---|---|
| Images / icônes dans les nœuds, bibliothèque de cliparts | OK (`icon_catalog`) | e!Sankey fournit ~100 cliparts prêts ; à voir si on veut une banque intégrée. |
| Image de fond du diagramme | OK (`background_image`) | — |
| Formes (rect, rect arrondi, ellipse/cercle, capsule) | OK (`shape_type`) | On a même plus (capsule). |
| Masquage nœud / label | OK | — |
| Auto-adaptation taille nœud ↔ largeur des flux | OK (bande dérivée des flux) | — |
| **Alignement / distribution** de nœuds sélectionnés | ✗ | Pas d'outils « aligner en haut / répartir à distance égale ». On a auto-layout + magnétisme, mais pas ces commandes ponctuelles. |
| Snap sur grille | OK | — |
| **Balance check visuel** : marqueur d'avertissement rouge sur le nœud + **balance label** (entrée / sortie / différence) | ~ | On a la **contrainte** d'équilibre matière (MFA), mais **pas l'affichage léger** « ⚠ + libellé de bilan » à côté du nœud. Or c'est l'UX centrale d'e!Sankey pour vérifier un diagramme sans solveur. |

### 2.4 Unités & échelle
| Fonction e!Sankey | Chez nous | Écart |
|---|---|---|
| Types d'unités multiples, facteur de conversion, format de nombre par type | OK (`is_unit`, `unit_factor`, notation…) | — |
| Échelle par unité, mode max vs quantité absolue, seuil mini, cut-off gros flux | OK (`minimum_flux`/`maximum_flux`, scale par tag) | — |
| Plusieurs unités/dimensions dans un flux | OK (arbre de valeurs multi-tags) | Bien au-delà d'e!Sankey. |

### 2.5 Éléments additionnels & divers
| Fonction e!Sankey | Chez nous | Écart |
|---|---|---|
| Rectangle / ellipse / **ligne libre**, zones de texte, image | ~ | Texte/image/rect OK via containers ; **ligne libre** absente. |
| Légende, élément « échelle » (3 magnitudes) | OK (légende + `display_legend_scale`) | — |
| Templates de diagramme réutilisables | OK (galeries, styles, views, SankeyThèque) | — |
| **Live Link Excel** (cellules liées dynamiquement, cellules nommées, cloud) | ✗ | Absent. On importe/exporte ponctuellement (SEP) et on a Univer, mais pas de liaison **live** vers un classeur externe. |
| **Process Operations** (Merge/Sum/Difference/Split/Transform/Ignore) | ~ | Remplacé par la **réconciliation MFA** (plus puissant mais UX différente). Pas d'opérations unitaires « fusion/somme » façon e!Sankey. |
| Export PNG / PDF / SVG | OK | — |
| **SVG interactif** : highlight au clic (dim des autres), tooltips, zoom/pan navigateur | ~ | On publie l'**app interactive** (tooltips + zoom/pan + plein écran) ; il manque le **highlight-au-clic avec estompage** du reste du diagramme. |
| Publication / diffusion | OK (site statique) | Bien au-delà (SVG figé chez eux). |
| **Suppléments** derrière un élément : URL / **fichier** / **texte markdown** | ~ | On a le champ **URL** (`hyperlink`) ; pas de supplément **fichier** ni **bloc texte** attaché. |
| Recherche d'élément dans le diagramme | ✗ | Absent. Utile sur gros diagrammes. |
| Mode présentation plein écran | OK | — |
| Copier/coller, multi-édition par type, annuler/refaire | OK | — |
| Import `.sankey` (fichiers e!Sankey) | OK (SA#264) | **Nous** avons un importeur ; e!Sankey n'importe pas nos formats. Atout de migration. |

---

## 3. Nos forces — à ne PAS reconstruire (et à mettre en avant côté marketing)

- **Web / SaaS / zéro install / collaboratif / multiplateforme** — e!Sankey est mono-poste Windows.
- **Solveur MFA réel** (contraintes, réconciliation, faisabilité) — leur « calc » se limite à Merge/Sum/Difference/Split.
- **Dimensions de nœud + tags multiples** (data/flux/vue/niveau) et **agrégation hiérarchique**.
- **Multi-vues** d'un même modèle (OSP).
- **Round-trip Excel structuré** (SEP) + **tableur embarqué** (Univer).
- **Auto-layout** (computeAutoSankey, positionnement de référence/échelle adaptée).
- **Publication de sites interactifs** et export animé (GIF).
- **Importeur e!Sankey** déjà fonctionnel et testé.

---

## 4. Jalon « Parité & déplacement e!Sankey »

Objectif : rendre la migration depuis e!Sankey **sans perte** et atteindre la **parité de dessin/labellisation**
qui retient encore certains utilisateurs, en capitalisant sur notre socle modèle/MFA.

Lots ordonnés par ratio valeur-migration / effort. Chaque ligne = 1 issue candidate (à créer dans SA / OS).

### Lot A — Fidélité de migration (priorité 1, effort faible-moyen)
Combler les « hors périmètre » de l'importeur `esankeyParser.ts` — chaque écart est une perte visible à l'import.
- **A1** — Dégradé de couleur le long du flux (rendu + import). *(lié à B/2.1)*
- **A2** — Labels en pourcentage à l'import (mapper vers `%IS/%OS/%PD…`). Données déjà là, surtout du mapping.
- **A3** — Balance labels à l'import → dépend de **D1** (affichage de bilan). Sinon importer en zone de texte figée.
- **A4** — Formes de process alternatives (shapeType 1/2 e!Sankey) → mapper vers nos `shape_type`.
- **A5** — Échelles indépendantes par unitType à l'import.
- **A6** — Lignes libres → dépend de **E4** (élément ligne).

### Lot B — Parité des labels (priorité 1, effort moyen)
- **B1** — **Gabarit de label à mots-clés** : `{EntryName} {Quantity} {UnitName} {GroupName} {Percent…}` + opérations `setPrefix/setPostfix/replace/setMaximumEntryNameLength(n)/setSeparator/groupByUnitType`. Champ « format personnalisé » dans l'inspecteur de flux, avec autocomplétion des mots-clés. **C'est le rattrapage le plus visible.**
- **B2** — Exposer proprement dans l'UI les pourcentages entrée/sortie de nœud (`%PD/%PS`) déjà présents en données.

### Lot C — Contrôle géométrique des flèches (priorité 2, effort moyen-élevé)
- **C1** — **Waypoints manuels multiples** sur un lien : ajouter/supprimer/déplacer un nombre libre de points de pliage (menu contextuel « Ajouter un point / Supprimer / Supprimer tous les points »). C'est le geste e!Sankey le plus réclamé pour router à la main.
- **C2** — **Arrow spikes** : option document « pointe accentuée pour flux jusqu'à N px » / « toujours ». Petit effort, effet fort sur les diagrammes à flux très contrastés.

### Lot D — Bilan léger « à la e!Sankey » (priorité 2, effort moyen)
Complémentaire de notre MFA : offrir le contrôle visuel **sans lancer le solveur**.
- **D1** — **Balance label** par nœud : libellé configurable (entrée / sortie / différence, par unité) + **format string** (`{SumIn} {SumOut} {DiffAbs} {BalanceState}`, opérations `replace/negativeColor/balanceWarningColor/showOnlyForBalanceWarning`).
- **D2** — **Marqueur d'avertissement** (⚠) sur le nœud quand entrée ≠ sortie selon une **stratégie** (exact / tolérance absolue / tolérance relative). Réutilise les sommes déjà calculées pour l'échelle.

### Lot E — Confort de dessin (priorité 3, effort faible chacun)
- **E1** — **Recherche d'élément** dans le diagramme (nœud / flux / texte), focus + surbrillance.
- **E2** — **Alignement / distribution** de nœuds sélectionnés (aligner haut/bas/gauche/droite/centre, répartir à distance égale, « caler sur la taille de cet élément »).
- **E3** — **Suppléments** enrichis derrière un élément : type **texte (markdown)** et type **fichier**, en plus de l'URL existante ; inclus dans la publication.
- **E4** — **Ligne libre** comme élément graphique (débloque A6).
- **E5** — **Highlight-au-clic** dans la publication : cliquer un flux/nœud estompe le reste (mode « focus »).

### Lot F — Passerelles données (priorité à arbitrer, effort élevé)
- **F1** — **Live Link Excel** dynamique (liaison à des cellules/cellules nommées, rafraîchissement). Lourd ; à mettre en balance avec l'idée de synchro Excel Office-JS déjà notée et avec notre round-trip SEP existant. **Décision produit requise** avant d'engager.
- **F2** — **Process Operations** discrètes (Merge/Sum/Difference/Split/Transform) comme surcouche « légère » optionnelle au solveur, pour les utilisateurs qui ne veulent pas de réconciliation complète. À arbitrer (risque de doublon avec MFA).

---

## 5. Séquencement proposé

1. **A + B** en premier : ce sont les pertes les plus visibles à l'import et le manque de parité le plus cité. Fort impact, effort raisonnable.
2. **D** ensuite : différencie peu vs notre MFA mais rassure les migrants habitués au « balance warning ». D1 débloque A3.
3. **C** puis **E** : finition du dessin manuel.
4. **F** : uniquement après décision produit explicite (Live Link vs synchro Office-JS vs SEP).

Quick wins isolés (effort minime, à caser tôt) : **C2** (spikes), **E1** (recherche), **E2** (alignement), **A2** (import %).

---

*Note de travail — ne modifie aucun code. Prochaine étape possible : créer le jalon GitLab et les issues A1…F2.*
