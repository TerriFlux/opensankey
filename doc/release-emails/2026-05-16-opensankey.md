# Mail du 16 mai 2026 — OpenSankey passe un cap graphique

> **Statut : brouillon.** Mail de release préparé pour la prochaine vague
> d'envois. À relire / amender avant envoi.

---

Bonjour,

Voici les évolutions livrées sur OpenSankey, OpenSankey+ et SankeySuite depuis
notre dernière communication mi-avril.

## Un saut sur la qualité graphique

Jusqu'ici, OpenSankey servait surtout à visualiser nos analyses de flux de
matière — c'était un outil d'exploration, et la sortie restait perfectible si
on voulait s'en servir comme illustration finale. Avec cette vague de
versions, nous franchissons un cap : **les diagrammes produits avec OpenSankey
atteignent désormais un niveau graphique compatible avec une publication ou
une infographie**, sans repasse externe sous Illustrator ou Inkscape.

Trois axes ont rendu ça possible :

- **Contrôle fin de la mise en page des labels et des valeurs.** Le bloc nom +
  valeur d'un nœud peut maintenant être verrouillé comme une unité visuelle
  (le fond du libellé englobe les deux, alignement commun), et l'édition se
  fait directement sur le diagramme — double-cliquer sur un libellé ou taper
  une touche quand un nœud est sélectionné ouvre l'éditeur. Les textes
  verticaux acceptent désormais le rich text complet (gras, italique,
  souligné, multi-ligne, couleurs par span).
- **Maîtrise de l'épaisseur et de la courbure des flux.** Le nouveau mode
  *Structure* impose une épaisseur minimale lisible aux flux tout en laissant
  les flux structurels assumer le chevauchement contrôlé — fini les flux
  invisibles à 0,5 px à côté de flux à 80 px. Les flux verticaux/horizontaux
  exposent enfin leurs poignées et leur courbure, et leur dégradé suit la
  diagonale réelle départ → arrivée. Une icône permet d'inverser
  graphiquement le sens d'une flèche sans toucher à source/cible.
- **Mode d'affichage englobant entièrement refondu.** Les nœuds parents
  apparaissent comme des cadres pointillés autour de leurs enfants, avec
  quatre variantes de répartition des flux, un sizing dynamique qui suit en
  temps réel les épaisseurs, et un emboîtement correct (parent qui englobe
  des parents qui englobent…). Le cadre géométrique est unifié avec celui des
  zones de dessin, le drag du parent embarque toute l'arborescence.

Le diagramme du Pays Voironnais que nous joignons à ce mail (flux déchets,
17 000 t) est intégralement sorti d'OpenSankey, sans retouche. C'est ce niveau
de finition qui devient atteignable par défaut.

## Essai gratuit OpenSankey+ : 30 jours (rappel)

Pour ceux qui n'auraient pas testé : un clic sur la bannière en bas à droite
active 30 jours d'OpenSankey+ sans création de compte ni carte bancaire. À
l'expiration, retour automatique à la version gratuite.

## Version précédente toujours disponible

En cas de problème de compatibilité, la version précédente reste accessible
sur https://backup.open-sankey.fr. Merci de nous remonter le problème en
parallèle, nous corrigeons rapidement.

## OpenSankey (base) — détail des nouveautés

### Édition et lisibilité du diagramme

- **Édition inline des labels** : double-cliquer sur le nom d'un nœud, sur la
  valeur d'un flux ou sur le label d'une zone de texte ouvre directement
  l'éditeur, sans passer par le panneau de configuration. Sélectionner un seul
  élément puis taper au clavier ouvre aussi l'éditeur pré-rempli avec ce
  caractère. Le menu contextuel expose également une entrée *Éditer le nom*.
- **Texte vertical en rich text** : les zones de texte et les libellés
  verticaux acceptent gras, italique, souligné, multi-ligne, taille / police
  / couleur par span.
- **Bloc nom + valeur unifié sur les nœuds** : nouveau bouton cadenas à droite
  des huit boutons d'alignement du label. Quand activé, la valeur s'ancre sur
  la BBox du libellé (au lieu de la forme du nœud) et le fond du libellé
  englobe label + valeur.
- **Inversion graphique d'un flux** : nouveau bouton dans le panneau Apparence
  des flux pour inverser le sens visuel d'une flèche sans réorganiser
  source / cible.
- **Poignées Bézier et courbure éditables sur les flux vh/hv** ; le gradient
  d'un flux suit désormais la diagonale réelle départ → arrivée.

### Mise en page

- **Mode d'affichage englobant — refonte complète.** Sizing dynamique du
  parent et des enfants à la volée, emboîtement correct (englobants
  d'englobants), quatre variantes de répartition des flux
  (`in_children_out_parent`, `in_parent_out_children`,
  `in_children_out_children`, `in_parent_out_parent`), propagation aux
  ancêtres à chaque drag / désagrégation / agrégation / expansion. Cadre
  géométrique unifié avec celui des zones de dessin.
- **Mode Structure — épaisseur minimale forcée** : les flux structurels
  reçoivent une épaisseur minimale lisible et peuvent se chevaucher de manière
  contrôlée plutôt que de disparaître à côté de flux dominants.
- **Cadenas et delta d'espacement par ancre** dans l'ordre des flux E/S d'un
  nœud : on peut épingler la position d'un flux donné dans la pile entrante
  ou sortante et imposer un écart fixe avec ses voisins.
- **Bug de coloration multi-tags corrigé** sur `shape_color_rule='auto'` : la
  règle « un seul tag visible → couleur du tag » fonctionne désormais aussi
  quand plusieurs tag groups sont actifs simultanément (le premier tag
  sélectionné prenait silencieusement la main).

### Réorganisation du menu

- **Menu *Fichier* consolidé.** Les quatre dropdowns *Nouveau* / *Ouvrir* /
  *Enregistrer* / *Exporter* sont fusionnés en un unique dropdown
  *Fichier ▾* structuré en sections. *Exporter* reste accessible à côté en
  bouton de premier niveau.
- **Nouveau menu *Édition ▾*** qui regroupe *Mise en page*, *Éditeur de
  tableur* (ex-*Convertisseur de format*) et deux raccourcis d'enrichissement
  de classeur Excel : **Créer l'Index** et **Créer TER/TES**.

### Export

- **Export animé des vues** (OpenSankey+) : nouvelle entrée *Animation…* dans
  *Exporter → Toutes les vues*. Modale draggable pour choisir les vues à
  inclure et leur ordre, la durée par vue, le DPI et le mode de boucle
  (une fois / infinie / aller-retour). Trois formats au choix : **GIF animé**
  (compatibilité universelle), **WebM** (vidéo, meilleure qualité que le GIF)
  et **séquence PNG zippée** (frames numérotées).
- **Refonte du sous-menu *Toutes les vues*** : les exports multi-vues
  (PNG zip, PDF fusionné, Animation) sont regroupés sous une section nommée
  dans le menu Exporter. Les exports PNG / PDF simples restent libres avec
  watermark *« réalisé avec OpenSankey.fr »* ; les exports multi-vues
  nécessitent OpenSankey+.
- **Fidélité des labels rich text à l'export PNG / PDF** : la conversion
  `<foreignObject>` → `<text>` SVG préserve désormais gras, italique,
  souligné, couleurs par span, multi-ligne et alignement par paragraphe.

### Intégration dans des sites tiers

- **OpenSankey publié sur npm** sous le nom `open-sankey`. Un composant
  React `<ViewerOpenSankeyApp>` (ou `<ViewerSankeyApplication>` côté
  SankeyApplication) accepte un JSON de diagramme ou une URL, et toutes les
  options de `window.sankey` sont exposées en props : `editable`, `topbar`,
  `footer`, `toolbar`, `diagram`, `diagrams_list`, etc. Démos versionnées,
  exemples Vite / CRA / HTML standalone fournis. Voir
  https://opensankey.fr/examples/.

## OpenSankey+ (premium) — détail des nouveautés

- **Export animé des vues** (cf. ci-dessus).
- **Édition inline des zones de texte** : l'entrée *Éditer le nom* est
  également disponible dans le menu contextuel des zones de texte.
- **Cadre géométrique unifié** : les zones de dessin et les nœuds englobants
  partagent le même comportement de cadre (drag, redimensionnement,
  rattachement enfants).

## SankeySuite — MFA, réconciliation, conversion Excel

### Conversion et auto-correction

- **Refonte du dialogue d'ouverture / enregistrement / conversion de
  fichiers.** Sélecteurs d'entrée et de sortie côte-à-côte, options regroupées
  dans un bloc repliable avec trois onglets *Options d'entrée*, *Options
  d'enregistrement* et *Mise en page*.
- **Auto-correction des incohérences Sankey** à la conversion comme à la
  réconciliation. Quand les options *Créer les nœuds / flux …* et *Propager
  les flux aux enfants / parents* sont activées, le fichier Excel renvoyé
  comporte un onglet par onglet d'origine avec les cellules ajoutées et leurs
  triggers **surlignés en rouge** — vous voyez immédiatement ce qui a été
  changé et pouvez accepter / refuser avant de relancer.
- **Raccourcis *Créer l'Index* et *Créer TER/TES*** : ajoutent l'onglet
  manquant à un classeur existant sans toucher au reste. Plus besoin d'ouvrir
  le convertisseur universel et de décocher manuellement les autres onglets.
- **Index Excel localisé** : la feuille *Index* (et *Lisez-moi*, qui remplace
  *Description*) est écrite avec des libellés français quand la langue de
  l'interface est en FR.
- **Préservation des onglets utilisateur à l'enregistrement** : option pour
  conserver les onglets personnalisés du classeur d'entrée, option pour
  réécrire uniquement les onglets au format SankeyExcelParser, option pour
  préserver les colonnes additionnelles (déplacée vers les options de sortie,
  où elle est sémantiquement attendue).
- **Export des matrices restreint aux nœuds feuilles** : nouvelle option pour
  ne garder dans le tableau de données et la matrice IO/TER que les flux
  entre nœuds sans enfants.

### Réconciliation

- **« Ajuster et compléter le diagramme » respecte la vue active** : lancée
  depuis une vue, la réconciliation ne reconstruit plus tout le diagramme —
  elle met à jour uniquement la vue courante, en préservant le diagramme
  maître et les autres vues.
- **Options solveur exposées** dans un onglet *Solveur* dédié : toggle
  d'auto-correction, toggle `skip_rref` (utile sur les gros problèmes mal
  conditionnés), toggle de génération du zip de debug en cas d'échec, options
  d'incertitude.
- **Mot-clé `TOUT` dans les contraintes ratio_flux** : les colonnes
  *Origine* / *Destination* d'une contrainte ratio_flux acceptent désormais
  `TOUT` pour désigner l'ensemble des nœuds sources ou cibles, sans avoir à
  les énumérer.
- **Stocks (Δstock) — refacto de la feuille d'analyse** et alignement avec
  les flux : les sorties `stocks_results` / `stocks_analysis` introduites dans
  la vague précédente ont reçu une mise à plat de leur structure pour rester
  homogènes avec `results` / `analysis`.

### Recyclage

- **Sémantique simplifiée** : un flux marqué « recyclage » est forcé recyclé
  point — il survit au calcul automatique du Sankey. Le cadenas séparé qui
  existait avant disparaît, la sémantique passe de *verrouillé / non
  verrouillé* à *recyclage = oui/non*, plus simple.

## Modale d'accueil — onglet *Récap licences*

Nouvel onglet (entre *Interactions souris* et *Nouveautés*) qui affiche, sous
forme de tableau, ce que chacune des trois licences applicatives
(OpenSankey+, SankeySuite / AFM, accès développeur) débloque concrètement. 13
fonctionnalités × 3 colonnes, traduit dans les 5 langues de l'interface.

## Infrastructure (information)

- Migration de l'environnement `dev` vers Ubuntu 24.04 / Python 3.12. Aucun
  impact utilisateur attendu ; la migration de `test` puis `prod` suivra dans
  les semaines à venir.

---

N'hésitez pas à nous remonter vos retours ou à signaler tout comportement
inattendu — vos remarques orientent les prochaines versions.

Bonne exploration,

L'équipe Terriflux

---

**Pièce jointe suggérée** : `pays-voironnais-dechets-17700t.png` (diagramme du
Pays Voironnais, flux déchets), pour illustrer le niveau de finition
atteignable. À placer en tête de mail, juste sous la phrase d'intro, ou en
encart à droite du paragraphe « Un saut sur la qualité graphique ».
