Tags et dimensions
==================

C'est le concept transverse le plus important de l'application :
beaucoup de fonctionnalités avancées (filtrage, coloration, modes
d'affichage hiérarchiques, vues multiples) reposent dessus. Comprendre
la différence entre **tag** et **dimension** débloque la majorité de
ce qui suit dans la documentation.

L'idée en une phrase
--------------------

Les **tags** servent à *catégoriser* les objets pour les colorer ou
les filtrer. Les **dimensions** servent à *structurer* les objets en
hiérarchie pour les agréger ou les désagréger.

Tags
----

Un tag est une étiquette nommée et colorée qu'on attache à des
objets du diagramme. Les tags sont regroupés en **groupes de tags**
(``tag groups``) ; chaque groupe couvre une famille d'usages.

L'application distingue cinq familles :

**Tags de nœuds (``node_taggs``)**
    Catégorisation des nœuds — par exemple « secteur d'activité »,
    « localisation », « type d'acteur ».

**Tags de flux (``flux_taggs``)**
    Catégorisation des flux — par exemple « énergie » vs
    « matière », ou « primaire » vs « secondaire ».

**Tags de données (``data_taggs``)**
    Catégorisation des valeurs portées par les flux — typiquement
    pour distinguer plusieurs scénarios, plusieurs années, plusieurs
    sources de données.

**Tags de niveau (``level_taggs``)**
    Cas particulier : ils servent à matérialiser une hiérarchie
    parent/enfant. C'est par eux qu'on construit une **dimension**
    (voir plus bas).

**Tags de vue (``view_taggs``)**
    Catégorisation des vues du diagramme (voir
    :doc:`vues_multiples`).

Chaque groupe de tags partage une palette de couleurs, générée
automatiquement et personnalisable. Un même objet peut porter
plusieurs tags issus de groupes différents (par exemple un nœud
peut être à la fois « secteur industrie » *et* « localisation
France »).

Modes de filtrage
~~~~~~~~~~~~~~~~~

Pour chaque groupe de tags, on choisit comment l'utilisateur peut
filtrer le diagramme depuis le tiroir de filtres :

- ``none`` : filtre masqué ;
- ``one`` : un seul tag actif à la fois (radio) ;
- ``multi`` : plusieurs tags activables (cases à cocher) ;
- ``sequence`` : un seul tag actif, navigable par une progression
  (utile pour scénariser des années ou des étapes).

Dimensions
----------

Une dimension est une **hiérarchie parent/enfant** entre nœuds.
Concrètement : un nœud parent agrège plusieurs nœuds enfants, et
les flux se répartissent entre les deux niveaux.

Une dimension est construite par les tags de niveau
(``level_taggs``) : on déclare quels nœuds sont au niveau « parent »
et quels nœuds sont au niveau « enfant », et l'application en
déduit la hiérarchie. Un même diagramme peut porter **plusieurs
dimensions** — par exemple une dimension « géographique »
(Pays → Régions) et une dimension « sectorielle » (Économie →
Industrie / Services).

Modes d'affichage d'une dimension
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Sur une dimension donnée, l'utilisateur peut basculer entre :

- **agrégation classique** : seul le parent est visible, les
  enfants sont masqués ;
- **désagrégation classique** : seuls les enfants sont visibles,
  le parent est masqué ;
- **mode englobant** : parent et enfants sont visibles
  simultanément, le parent dessiné comme une enveloppe autour des
  enfants (voir
  :doc:`/user/guides/organisation/mode_englobant`).

Tag ou dimension : comment choisir
----------------------------------

- Si on veut juste **changer la couleur** ou **filtrer
  l'affichage**, c'est un tag.
- Si on veut **changer le niveau de granularité** du diagramme
  (zoomer sur un groupe, dézoomer sur un agrégat), c'est une
  dimension.

Les deux mécanismes coexistent et se combinent. Par exemple : une
dimension « secteur » avec un mode englobant pour montrer
l'agrégation, et un tag de nœud « localisation » pour colorer en
plus selon la région.

Voir aussi
----------

- :doc:`anatomie_diagramme` — les objets sur lesquels portent tags
  et dimensions
- :doc:`vues_multiples` — comment les tags de vue construisent
  plusieurs représentations d'un même diagramme
- :doc:`/user/guides/organisation/mode_englobant` — un mode
  d'affichage propre aux dimensions
