# Mail du 4 juin 2026 — OpenSankey devient une application complète (v1.1.5)

> **Statut : brouillon.** Mail de release préparé pour la prochaine vague
> d'envois. À relire / amender (et dater le jour de l'envoi) avant diffusion.

---

Bonjour,

Voici les évolutions livrées sur OpenSankey, OpenSankey+ et SankeySuite avec la
version 1.1.5.

## Le game changer : tableur et documentation intégrés au diagramme

Jusqu'ici, OpenSankey était un excellent éditeur de diagrammes, mais la
**saisie et la correction des données** se faisaient ailleurs : on ouvrait le
fichier Excel, on modifiait, on rechargeait. Et la **documentation** d'un
diagramme (hypothèses, sources, méthodo) vivait dans un document à part, vite
désynchronisé.

Avec la 1.1.5, **OpenSankey devient une application complète** : le tableur et
la documentation sont désormais *dans* l'application, affichables à côté du
diagramme.

- **Un tableur intégré.** Un classeur à onglets — Flux, Nœuds, Données,
  Étiquettes, Stocks, Ratios, Chaînage des stocks — calqué sur le format Excel
  habituel, mais éditable directement dans l'application. On corrige une valeur,
  on ajoute un flux, on ajuste une contrainte, et le diagramme se met à jour.
  Sélecteur de colonnes façon filtre Excel, largeur de colonnes automatique,
  modale dédiée pour ajouter une contrainte de ratio. Fini l'aller-retour avec
  un tableur externe pour le moindre ajustement.
- **Une documentation embarquée.** Un onglet *Doc* propose un éditeur Markdown
  avec aperçu (édition / aperçu / côte à côte), le support des **équations
  LaTeX** et l'insertion d'images. Surtout, cette documentation est enregistrée
  **dans le fichier du diagramme** : elle voyage avec lui, et reste à jour
  parce qu'elle est au même endroit que le travail.
- **Tout côte à côte.** Diagramme, tableur et documentation s'affichent
  simultanément, avec des séparateurs déplaçables et plusieurs dispositions. On
  passe d'une vue plein écran du diagramme à un mode « cockpit » données +
  diagramme + notes en deux clics.

C'est, concrètement, le passage d'un outil de visualisation à un **atelier
complet** d'analyse de flux : on saisit, on visualise et on documente sans
jamais quitter OpenSankey.

## Lire les données derrière chaque flux

Dans le prolongement, l'exploration des données franchit elle aussi un cap.
**Survoler un flux agrégé** ouvre désormais un onglet *Données* qui déplie les
flux sous-jacents jusqu'aux feuilles, organisés par axe d'agrégation (un tableau
par dimension), avec la part de chacun dans le total. Et quand un flux porte
plusieurs années ou territoires, des onglets *Séries* alignent les valeurs en
colonnes pour comparer d'un coup d'œil. Les tooltips deviennent de vraies
fenêtres : déplaçables, épinglables et redimensionnables.

## Réconciliation : les territoires, et des bornes enfin honnêtes

- **Échanges produit/secteur dans les territoires** : un nœud d'échange peut
  être typé produit *ou* secteur selon son rôle dans la matrice
  emplois/ressources, et n'apparaître que dans l'une des deux matrices sans
  bloquer le chargement. Les flux d'import/export sont reconstruits
  automatiquement à la réconciliation, et une valeur sans en-tête est désormais
  signalée plutôt qu'ignorée.
- **Les bornes « illimitées » s'affichent comme illimitées** : fin du plafond
  fantôme à 500 000 000 sur les flux libres, qui pouvait fausser un résultat.
  Les anciens fichiers sont nettoyés automatiquement à l'ouverture.
- **« Compléter le diagramme » sans écraser les mesures** : une nouvelle colonne
  *Valeur complétée* affiche, à côté de la valeur réconciliée, le résultat d'une
  passe qui préserve les mesures et ne calcule que les flux inconnus.

## Essai gratuit OpenSankey+ : 30 jours (rappel)

Pour ceux qui n'auraient pas testé : un clic sur la bannière en bas à droite
active 30 jours d'OpenSankey+ sans création de compte ni carte bancaire. À
l'expiration, retour automatique à la version gratuite.

## Version précédente toujours disponible

En cas de problème de compatibilité, la version précédente reste accessible sur
https://backup.open-sankey.fr. Merci de nous remonter le problème en parallèle,
nous corrigeons rapidement.

---

## Détail par produit

### OpenSankey (base)

- **Tableur intégré** : classeur à onglets (Flux, Nœuds, Données, Étiquettes,
  Stocks, Ratios, Chaînage des stocks) calqué sur le format Excel, édition
  répercutée sur le diagramme, sélecteur de colonnes, modale « Ajouter une
  contrainte ». Remplace l'ancien tableur, plus complet et plus rapide.
- **Documentation Markdown** embarquée dans le fichier du diagramme : éditeur +
  aperçu, équations LaTeX (KaTeX), insertion d'images.
- **Grande zone en split-view** : diagramme / tableur / documentation
  affichables ensemble, séparateurs déplaçables, dispositions multiples,
  recadrage automatique du diagramme.
- **Tooltips de flux enrichis** : onglet *Données* (flux enfants par dimension),
  onglets *Séries* (par année / région), tooltips déplaçables, épinglables et
  redimensionnables ; noms longs de tags non tronqués.
- **Verrou de taille** : fige hauteur, largeur et zoom pour garder le même
  cadrage en parcourant les dataTags.
- **Verrou « tracé en trait » sur un flux** et meilleur rendu des flux très
  inclinés.
- **Excel** : case *Onglet mise en page* à l'ouverture (ignorer la mise en page
  sauvegardée), sélecteur de format des feuilles de nœuds à l'export, import
  dans la seule vue courante.
- **Échanges produit/secteur** : rendu et placement des import/export, ré-split
  correct à la réconciliation.
- **Corrections** : bandeau de log contextuel et localisé (Ouvrir / Éditer /
  Réconcilier / Compléter), détection fin/échec fiabilisée, panneau de
  configuration lisible sur les petites fenêtres, menu d'apparence des flux
  homogénéisé, barre de séquence des dataTags plus discrète.

### OpenSankey+ (premium)

- **Génération de vues unitaires repensée** : dialogue déplaçable (on garde la
  main sur le canvas), import multi-fichiers Excel avec accumulation des
  sources.
- **« Compléter le diagramme »** s'appuie désormais sur la passe de complétion
  *sans redondance* (mesures préservées).

### SankeySuite — MFA, réconciliation, conversion Excel

- **Échanges produit/secteur dans les matrices TER** : cumul du tag d'échange et
  de l'axe produit/secteur, asymétrie autorisée entre les deux matrices,
  avertissement « donnée orpheline », type de nœud renseigné dans l'Index.
- **Bornes ∞ honnêtes** : le sentinel d'« infini » du solveur n'est plus
  propagé comme une contrainte ; bornes non renseignées ressorties vides,
  migration automatique des fichiers anciens.
- **Colonne *Valeur complétée*** dans la feuille *Analyse des résultats*.

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

**Pièce jointe suggérée** : une capture en split-view montrant le diagramme à
gauche, le tableur (onglet Données) à droite et l'onglet *Doc* — pour illustrer
en une image qu'OpenSankey est devenu une application complète (saisir,
visualiser, documenter). À placer en tête de mail, sous la phrase d'intro.
