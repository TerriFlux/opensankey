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
la feuille porte une **liste de sous-valeurs**, chacune munie d'une
**coordonnée éparse** — au plus un tag par groupe optionnel, sur zéro ou
plusieurs groupes (précision utilisateur 2026-07-16 : multi-flux où chaque
ruban porte plusieurs tags, possiblement différents d'un ruban à l'autre ;
ex. flux A→B = 6 tagué {acier, route} + 4 tagué {cuivre, rail}). La
« partition par groupe » est une lecture dérivée : regrouper les sous-valeurs
par leur tag du groupe G. L'affichage simultané réutilise le mécanisme
multi-link existant (bannière `multi`), généralisé : un ruban par sous-valeur.
La différence obligatoire/optionnel devient alors :

| | dimension (obligatoire) | sous-valeurs (optionnel) |
|---|---|---|
| stockage | une feuille par tag, produit cartésien entre groupes | liste de sous-valeurs à coordonnée éparse (≤1 tag par groupe, groupes libres) |
| complétude | requise (modulo `propagate_structure`) | libre |
| affichage | une valeur sélectionnée (ou multi-banner) | un ruban par sous-valeur dont les tags passent le filtre |

Avantages : supprime le contournement « flux dupliqués », rend la conversion
optionnel→obligatoire presque triviale (compléter les feuilles manquantes),
unifie réellement le stockage (tout est feuille). Coûts : migration des
fluxTags existants (cf. §3.1 pour les valeurs multi-taguées) et UI d'édition
de la partition.

Subtilité assumée : le modèle ne garantit aucune complétude — la somme des
sous-valeurs peut différer de la valeur de la feuille (sous-valeurs = détail
facultatif), et un groupe donné peut ne taguer qu'une partie des sous-valeurs.
Une contrainte de cohérence (somme = valeur de la feuille) pourra être offerte
en option (contrôle type check MFA), pas imposée par le stockage.

### 3.0bis Clarification (2026-07-18) : des « valeurs », pas des « sous-valeurs »

Précision utilisateur : les valeurs multiples d'un flux ne sont **pas
additives** et il n'y a **pas de hiérarchie** entre elles. L'exemple type est
un jeu d'unités — le même flux vaut 120 kWh, 0,4 t et 300 € : ce ne sont pas
des parts d'un tout, ce sont des valeurs parallèles. « La » valeur du flux est
simplement la première de la liste (celle que voit le solveur). Le terme
« sous-valeur » est donc impropre — dire **« les valeurs du flux »**.

Confrontation au modèle d'e!Sankey (manuel 5, ch. 5/8/9), très proche :

- une **flèche** (arrow) ne porte pas une valeur mais une **liste de flows** =
  (entrée, quantité) — l'équivalent exact de nos valeurs coordonnées ;
- une **entrée** (entry) = matière/énergie/coût défini dans une liste globale,
  avec couleur — l'équivalent d'un tag libre ;
- les **Unit Types** (Masse, Énergie…) portent chacun : unités convertibles,
  format d'affichage, palette, bilan matière propre, **échelle propre**
  (slider px/quantité) et visibilité — c'est ce qui rend l'affichage simultané
  de kWh et de tonnes cohérent (chaque type proportionné à sa règle, et on
  masque un type d'un clic). Nos dataTags `is_unit` + ScaleOverrides jouent
  déjà ce rôle côté dimensions.

Conséquences actées (2026-07-18) :

1. **Éclatement en rubans = choix d'affichage**, pas un automatisme : porté
   par la **bannière `multi`** du groupe libre (cohérent avec les dataTags).
   `multi` (défaut des groupes libres) → un ruban par valeur ; `Unique` → le
   flux affiche sa valeur principale, les autres valeurs restant en
   tooltip/éditeur (cas unités).
2. **Conversion dimension→annotation** : la valeur principale devient celle de
   la **tranche sélectionnée** (plus de somme).
3. **Unités = groupes libres à échelle par tag** (validé user 2026-07-18) :
   le cas unitTag (un tag porteur d'une unité et d'une échelle) est couvert
   par ce modèle — mieux que les dataTags `is_unit` actuels qui forcent les
   unités en dimension (cartésien complet). Un groupe libre « Unité »
   {kWh, t, €} porte des valeurs éparses ; bannière `Unique` = bascule
   d'affichage par sélection ; `multi` + échelle PAR TAG = coexistence à la
   e!Sankey (Unit Types). Briques restantes : échelle par tag libre appliquée
   à la largeur des rubans (pendant de `Class_DataTag._scale`), unité dans
   labels/tooltips, migration des groupes `is_unit` via la bascule
   dimension→annotation + transfert des échelles. Réaligne avec le type
   `unitTags` natif de SEP.
4. Renommage « sous-valeurs » → « valeurs du flux » : à trancher (UI seule ou
   aussi code/JSON `sub_values`, encore possible tant que la branche n'est pas
   mergée).

### 3.1 Contrainte de cardinalité

Tranchée par l'adoption du modèle sous-valeurs (§3.0) : une sous-valeur porte
**au plus un tag par groupe optionnel**, sur autant de groupes qu'on veut
(coordonnée éparse). Deux tags de groupes différents sur la même sous-valeur :
normal ({acier, route}). Deux tags du même groupe sur la même sous-valeur :
interdit dans le modèle cible.

La question devient une question de **migration** : les fichiers existants où
une valeur porte plusieurs fluxTags du MÊME groupe (autorisé aujourd'hui,
`_flux_tags: Class_Tag[]`) doivent être convertis — soit en dupliquant la
valeur en une sous-valeur par tag (surestime les totaux), soit en créant un
tag combiné « acier+cuivre » à la volée (préserve les totaux, pollue le
groupe). **Recommandation : tag combiné**, avec avertissement listant les
flux concernés à la migration. Les tags de groupes différents migrent tels
quels vers une seule sous-valeur à coordonnée multiple.

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

## 5. Découpage — état d'avancement (2026-07-17)

Toutes les phases s'empilent sur la branche `284-fusion-tags-modele`
(décision 2026-07-17) ; merge sur main en fin de chantier.

1. **Phase 0 — FAIT.**
2. **Phase 1 — FAIT** (SA#284, tag `cp-284-fusion-tags-phase1`) : `is_dimension`
   sur les deux classes (pas de fusion de classes — la bascule est une
   conversion), sous-valeurs à coordonnée éparse (`sub_values`, clé additive,
   pas de bump de format), menu fusionné, éditeur, rendu multi-ruban, undo/redo.
   Écarts au plan initial : sections JSON `dataTags`/`fluxTags` conservées
   (contrainte SEP/solveur, cf. §3.5) — donc ni migration fromJSON ni bump.
3. **Phase 2 — bascule dimension↔annotation** (SA#285, EN COURS) :
   sens dimension→annotation FAIT (sans perte grâce aux sous-valeurs : feuilles
   par tag → sous-valeurs coordonnées, somme sur la feuille fusionnée — la
   question « somme ou tag sélectionné » du §3.3 se dissout) ; case « Dimension »
   dans l'éditeur de groupes ; tags/sous-valeurs des flux déplacés dans l'onglet
   Valeur de l'inspecteur (décision UX 2026-07-17). Sens annotation→dimension À
   FAIRE (débloqué par l'arbitrage §6.2 ci-dessous).
4. **Phase 3 — séparation géométrique** : `is_geometric`, positions par tag,
   data-join `node×tag`, drag par facette, layout auto des facettes. À FAIRE.
5. **Phase 4 (optionnelle, différée)** — unification du format Excel côté SEP.

## 6. Questions ouvertes

Tranchées le 2026-07-16 : le modèle partition est adopté (§3.0) ; la
cardinalité en découle (§3.1, exactement un tag par sous-valeur ; migration
des valeurs multi-taguées par tag combiné, à confirmer) ; option B (positions
par tag) pour la géométrie.

Tranchée le 2026-07-17 : §6.2 (ex-question 2) — à la promotion d'un groupe
libre en dimension, la quantité sans tag du groupe va sur un tag
**« non affecté » créé automatiquement** dans le groupe (totaux préservés,
réversible).

Restent ouvertes :

1. §3.1 : migration des valeurs multi-taguées — tag combiné (recommandé) ou
   duplication ? (Sans objet tant que les fichiers existants ne sont pas
   migrés vers des sous-valeurs — l'annotation de feuille reste supportée.)
2. §4.2 : nom et portée du flag séparant ; V1 limitée à un seul groupe séparant —
   acceptable ?
3. §4.4 : faut-il fusionner le stockage des overrides par tag avec le mécanisme
   heredited_attr des vues dès la phase 3, ou accepter deux mécanismes le temps de
   converger ?
4. Nommage utilisateur : comment appeler les deux modes dans l'UI ? (« étiquette de
   donnée » vs « étiquette libre » ? « dimension » est parlant pour un profil MFA,
   moins pour un utilisateur lambda.)
