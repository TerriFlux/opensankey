# NOTE — Fusion dataTags / fluxTags et séparation géométrique par tag

Statut : DESIGN — aucune implémentation. Rédigé le 2026-07-16.

## 1. Vision

Deux évolutions liées :

1. **Fusion dataTags / fluxTags.** Intuition directrice : *un dataTag est un fluxTag
   obligatoire*. Chaque flux a obligatoirement une donnée pour chaque tag d'un groupe
   de dataTags, alors qu'un fluxTag est une annotation optionnelle. On veut un concept
   unique de « tag de flux » avec un attribut de groupe « obligatoire » (= dimension).
2. **dataTags applicables aux nœuds.** Une fois le concept unifié, permettre qu'en
   visualisation on obtienne des groupes nœuds+flux par dataTag **géométriquement
   séparés** dans le même dessin (petits multiples : 2020 à gauche, 2021 à droite).
   Décision prise : **option B — positions par tag stockées dans le modèle** (pas un
   simple facettage au rendu).

## 2. État des lieux

### 2.1 Front (OpenSankey)

Quatre familles de groupes dans `Class_Sankey` (`_node_taggs`, `_flux_taggs`,
`_data_taggs`, `_level_taggs`, Sankey.tsx:128-131), plus les viewTags côté OSP.

Rôles structurellement différents :

- **dataTags** (`Class_DataTagGroup`, TagGroup.tsx:593) : héritent de
  `Class_ProtoTagGroup` directement (pas de `Class_TagGroup`). Ce sont des
  **dimensions du stockage des valeurs** : chaque flux porte un arbre
  `Class_ElementValueTree` (LinkValues.tsx:38) avec un niveau par groupe de dataTags
  et une feuille `Class_ElementValue` par combinaison de tags. La sélection d'un
  dataTag choisit *quelle valeur* est affichée (`getValue` parcourt l'arbre avec
  `selected_tags_list[0]` de chaque groupe, Link.tsx:1844-1866). Attributs propres :
  `is_unit`, `banner: 'sequence'`, `propagate_structure` (#161).
- **fluxTags** (`Class_FluxTagGroup`) : **annotations qualitatives des feuilles**.
  Chaque `Class_ElementValue` porte `_flux_tags: Class_Tag[]` (LinkValues.tsx:500).
  La sélection filtre la visibilité, `use_colors` colore. Une feuille peut porter
  **plusieurs tags du même groupe** (liste, pas de contrainte d'unicité par groupe).
- **nodeTags / levelTags / viewTags** : hors périmètre de la fusion, mais les nœuds
  sont concernés par la partie 2.

Fait important (vérifié 2026-07-16) : un flux ne peut PAS porter deux valeurs
distinguées uniquement par fluxTags. La feuille est unique par combinaison de
dataTags (`link.value`, Link.tsx:1870) ; les fluxTags filtrent la visibilité
(`are_related_flux_tags_selected`, Link.tsx:2443) et colorent, sans créer de
valeur. L'affichage simultané de plusieurs valeurs d'un même flux n'existe que
via un groupe de dataTags en bannière `multi` (multi-link : un ruban parallèle
par tag, `_is_multi_link`, Link.tsx:176). Le contournement usuel avec des
fluxTags est de dupliquer le flux entre les mêmes nœuds (id ` (dup)`,
Sankey.tsx:762-777) — la « dimension » est alors aplatie en flux séparés. Côté
SEP un flux est keyé origine-destination ; une tentative de keyer par fluxTag
(#148/#110) a été annulée (code commenté, sankey_base.py:1105-1112).

Point favorable à la fusion : les fluxTags vivent déjà *sous* l'arbre des dataTags
(sur les feuilles). L'arbre de valeurs est par ailleurs déjà utilisé par les nœuds
pour les stocks (`ValueParentElement = Class_LinkElement | Class_NodeElement`,
LinkValues.tsx:14).

### 2.2 SEP / Excel

`io_excel_constants.py` distingue cinq types : `dataTags`, `unitTags`, `fluxTags`,
`nodeTags`, `levelTags` (le front replie `unitTags` dans dataTags via `is_unit`).
Le solveur MFAProblem résout **par combinaison de dataTags**
(`get_datatags_combinations`, `instanciate_all_datas`). Les fluxTags n'ont aucune
influence sur la résolution.

### 2.3 Différences sémantiques à réconcilier

| | dataTag (dimension) | fluxTag (annotation) |
|---|---|---|
| Valeur par tag | une par combinaison, obligatoire* | une seule valeur, tags posés dessus |
| Tags par groupe et par valeur | exactement 1 | 0..n |
| Sélection UI | choisit la valeur affichée (exclusif) | filtre la visibilité (multi) |
| Attributs propres | `is_unit`, `sequence`, `propagate_structure` | — |
| Rôle solveur | dimension de résolution | aucun |

\* `propagate_structure=false` (#161) a déjà introduit de l'optionalité côté
dataTags : un flux absent pour un tag n'existe pas pour ce tag. C'est un argument
fort pour la fusion — la frontière est déjà poreuse.

## 3. Modèle cible : groupe de tags de flux unifié

Un seul type `Class_FluxTagGroup` (nom à confirmer) avec un flag de groupe :

- **`is_dimension = true`** (ex-dataTag) : le groupe est un niveau de l'arbre de
  valeurs. Chaque flux a une feuille par tag. Sélection exclusive (une valeur
  affichée). `is_unit`, `sequence`, `propagate_structure` ne s'appliquent que dans
  ce mode.
- **`is_dimension = false`** (ex-fluxTag) : le groupe partitionne les feuilles
  en sous-valeurs éparses (modèle retenu, §3.0). Sélection multiple = filtre de
  visibilité des sous-valeurs.

`use_colors` existe déjà des deux côtés et reste commun.

### 3.0 Modèle retenu : l'annotation comme dimension dégénérée (partition)

**DÉCISION 2026-07-16 : variante adoptée.** Le besoin réel derrière les
fluxTags est « un dataTag sans la combinatoire » — plusieurs valeurs sur le
même flux (acier=6, cuivre=4), affichées *en même temps*, sans imposer le
produit cartésien ni la complétude. Aujourd'hui ça force la duplication du
flux (cf. §2.1).

Un groupe `is_dimension=false` ne se contente donc pas d'annoter la feuille :
il la **partitionne** en sous-valeurs (feuilles éparses, une par tag présent,
sans croisement avec les autres groupes optionnels). L'affichage simultané
réutilise le mécanisme multi-link existant (bannière `multi`), généralisé aux
groupes optionnels. La différence obligatoire/optionnel devient alors :

| | dimension (obligatoire) | partition (optionnel) |
|---|---|---|
| feuilles | une par tag, produit cartésien entre groupes | éparses, seulement les tags présents, à plat |
| complétude | requise (modulo `propagate_structure`) | libre |
| affichage | une valeur sélectionnée (ou multi-banner) | tous les tags cochés, rubans parallèles |

Avantages : supprime le contournement « flux dupliqués », rend la conversion
optionnel→obligatoire presque triviale (compléter les feuilles manquantes),
unifie réellement le stockage (tout est feuille). Coûts : migration des
fluxTags existants (cf. §3.1 pour les valeurs multi-taguées) et UI d'édition
de la partition.

Subtilité assumée : deux groupes optionnels partitionnant le même flux ne se
croisent pas (pas de produit cartésien entre eux). Leurs partitions sont
indépendantes et chacune doit sommer à la valeur de la feuille — la cohérence
inter-groupes n'est pas garantie par le modèle, seulement par groupe.

### 3.1 Contrainte de cardinalité

Tranchée par l'adoption du modèle partition (§3.0) : une **sous-valeur porte
exactement un tag** du groupe qui la partitionne (comme une feuille de
dimension), et un flux peut n'avoir aucune sous-valeur pour un tag donné
(éparse). Il n'y a plus de valeur « multi-taguée » dans le modèle cible.

La question devient une question de **migration** : les fichiers existants où
une valeur porte plusieurs fluxTags du même groupe (autorisé aujourd'hui,
`_flux_tags: Class_Tag[]`) doivent être convertis — soit en dupliquant la
valeur en une sous-valeur par tag (surestime les totaux), soit en créant un
tag combiné « acier+cuivre » à la volée (préserve les totaux, pollue le
groupe). **Recommandation : tag combiné**, avec avertissement listant les
flux concernés à la migration.

### 3.2 Persistance (JSON)

Aujourd'hui `flux_taggs` et `data_taggs` sont deux sections distinctes avec
`_taggs_order` par famille (Sankey.tsx:136-139). Cible : une seule famille
`flux_taggs` dont chaque groupe porte `is_dimension` (+ les attributs ex-dataTag).

- Migration montante (`fromJSON_X_YY`) : `data_taggs` → groupes `is_dimension=true`,
  `flux_taggs` → `is_dimension=false`. Ordre : concaténation `data_taggs` puis
  `flux_taggs` (ou l'inverse — à trancher, impact purement UI).
- **Bump de version de format obligatoire** (règle projet : nouvelle variable
  persistée → bump SankeyPersistence + fromJSON dédié). Dépend du filet golden de
  SA#246 — la fusion doit attendre que ce chantier soit stabilisé.
- L'arbre de valeurs ne change pas de forme : il reste keyé par les groupes
  `is_dimension=true` dans l'ordre des groupes.

### 3.3 Transitions d'état (question ouverte → recommandation)

Que faire quand on bascule le flag d'un groupe **qui a déjà des données** ?

- **dimension → annotation** : le flux avait une valeur par tag (2020=10, 2021=12),
  il ne doit plus en avoir qu'une.
  - Cas sans perte : une seule valeur non-vide → elle devient la valeur unique,
    annotée du tag porteur.
  - Cas général : proposer à l'utilisateur **somme** ou **valeur du tag
    sélectionné**, avec confirmation explicite (perte de données irréversible hors
    undo). Jamais de conversion silencieuse.
- **annotation → dimension** : le flux avait une valeur unique (10) annotée
  « acier », il lui faut une feuille par tag.
  - La valeur va sur la feuille du tag annoté ; les autres feuilles restent
    **vides** (pas 0 — vide = flux libre pour le solveur, cohérent avec
    `propagate_structure=false`).
  - Valeur sans annotation du groupe : va sur le premier tag (ou un tag
    « non affecté » créé à la volée — à trancher).
  - Valeur multi-taguée (cas (b) du §3.1) : dupliquer la valeur sur chaque tag
    annoté surestime le total ; la répartir équitablement est arbitraire.
    **Recommandation : dupliquer en marquant les feuilles comme libres/estimées**,
    avec avertissement listant les flux concernés.

L'historique undo/redo doit encapsuler la bascule comme une seule opération.

### 3.4 UI

- Menu Étiquettes : fusionner les onglets « Étiquettes de flux » et « Étiquettes de
  données » en un seul, avec la case « Dimension (donnée obligatoire par étiquette) »
  par groupe.
- La sélection change de comportement selon le mode (exclusif vs multi) — le
  composant existant des dataTags (bannière multi/sequence) est conservé pour les
  groupes dimension.
- Table des flux / éditeur de valeurs : inchangé sur le fond (l'arbre reste keyé
  par les dimensions).

### 3.5 SEP / MFAProblem (périmètre différé)

Le format Excel garde `dataTags` / `fluxTags` à court terme : mapping trivial à
l'import (`dataTags` → dimension, `fluxTags` → annotation) et à l'export (selon le
flag). MFAProblem continue de résoudre par combinaison de dimensions — aucune
modification requise tant que le mapping est fait à la frontière JSON (io_base.py
sérialise déjà les deux familles séparément). Unifier aussi le format Excel est un
chantier séparé, à ne lancer qu'une fois le front stabilisé.

## 4. Partie 2 — séparation géométrique par tag (option B retenue)

### 4.1 Objectif

Pour un groupe dimension marqué « séparant », afficher côte à côte dans le même
dessin une instance des nœuds/flux par tag : petits multiples éditables
individuellement.

### 4.2 Modèle

- Nouveau flag de groupe : `is_geometric` (nom à confirmer — « séparation
  géométrique »). N'a de sens que si `is_dimension=true`. Plusieurs groupes
  séparants simultanés = produit cartésien ; **limiter à un seul groupe séparant à
  la fois en V1** (verrou UI).
- `Class_NodeElement` : la position devient multi-instance. Plutôt qu'un
  remplacement de `_position`, ajouter un dictionnaire d'**overrides par tag** :
  `_position_per_tag: { [tag_id]: {x, y, u?} }`, la position actuelle restant la
  position de base (tag « courant » ou premier tag). C'est le pattern
  `heredited_attr` des vues (valeur héritée + override local), appliqué au tag.
- Persistance : nouvelle variable ⇒ même bump de format que la fusion (les deux
  chantiers doivent partager le bump si possible).

### 4.3 Rendu

- Le data-join keyé de `draw()` (#1246) est le point d'appui : la clé d'un nœud
  devient `node_id × tag_id` quand un groupe séparant est actif, idem pour les
  liens (le lien affiché pour le tag T prend la valeur de la feuille T).
- Quand un groupe séparant est actif, la sélection exclusive du groupe est
  remplacée par « tous les tags cochés sont affichés, chacun dans sa facette ».
- Layout initial d'une facette : position de base + offset automatique (bounding
  box de la facette précédente + marge). Le drag d'un nœud dans la facette T écrit
  `_position_per_tag[T]`.
- Points d'attention connus : autofit mesure le DOM (leçon de #1247), échelle
  adaptée / anti-chevauchement raisonnent par facette, la légende et les zones de
  texte ne se dupliquent pas.

### 4.4 Articulation avec les vues et le design « Fusion Vues+ViewTags »

Recouvrement réel : une vue par tag donne déjà des positions indépendantes, mais
pas côte à côte dans le même dessin. Position retenue ici : la séparation
géométrique est un mode d'affichage *dans* un dessin ; les vues restent un
mécanisme de *documents* multiples. Le design Vues+ViewTags (light=visibilité /
heavy=override) n'est pas contredit, mais les deux introduisent des overrides par
tag — il faudra unifier le vocabulaire et si possible le mécanisme de stockage
(`heredited_attr` par tag) pour ne pas avoir trois systèmes d'override (vues,
viewTags, tags séparants).

## 5. Découpage proposé

1. **Phase 0 — préalables** : décider les points ouverts restants (§6).
   Dépendance SA#246 nuancée : le filet golden (`corpusFirstLoad`) dont notre
   migration a besoin est déjà en place ; le reste de #246 (déplacement de
   `convert_data_legacy`, bloqué par #277) concerne le legacy pré-0.8,
   orthogonal. Seule contrainte : ne pas restructurer la même plomberie de
   migration en parallèle — se coordonner avec #246 au moment de la phase 1.
2. **Phase 1 — fusion du modèle** (OS) : classe unifiée + flag `is_dimension`,
   modèle partition (§3.0) inclus d'emblée (une seule migration de format),
   migration fromJSON, bump de format, menu Étiquettes fusionné. Pas de bascule
   dynamique du flag dans cette phase (le flag est fixé par la migration/l'import).
3. **Phase 2 — bascule dimension↔annotation** : transitions du §3.3 avec
   confirmations UI et undo.
4. **Phase 3 — séparation géométrique** : `is_geometric`, positions par tag,
   data-join `node×tag`, drag par facette, layout auto des facettes.
5. **Phase 4 (optionnelle, différée)** — unification du format Excel côté SEP.

Chaque phase = une issue GitLab SA + worktree dédié (workflow habituel).

## 6. Questions ouvertes

Tranchées le 2026-07-16 : le modèle partition est adopté (§3.0) ; la
cardinalité en découle (§3.1, exactement un tag par sous-valeur ; migration
des valeurs multi-taguées par tag combiné, à confirmer) ; option B (positions
par tag) pour la géométrie.

Restent ouvertes :

1. §3.1 : migration des valeurs multi-taguées — tag combiné (recommandé) ou
   duplication ?
2. §3.3 : valeur sans annotation lors d'annotation→dimension — premier tag ou tag
   « non affecté » auto-créé ?
3. §3.2 : ordre des groupes après migration (dataTags d'abord ?).
4. §4.2 : nom et portée du flag séparant ; V1 limitée à un seul groupe séparant —
   acceptable ?
5. §4.4 : faut-il fusionner le stockage des overrides par tag avec le mécanisme
   heredited_attr des vues dès la phase 3, ou accepter deux mécanismes le temps de
   converger ?
6. Nommage utilisateur : comment appeler les deux modes dans l'UI ? (« étiquette de
   donnée » vs « étiquette libre » ? « dimension » est parlant pour un profil MFA,
   moins pour un utilisateur lambda.)
