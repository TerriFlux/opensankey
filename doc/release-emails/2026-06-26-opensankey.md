# Mail du 26 juin 2026 — Publier ses diagrammes en ligne (v1.1.7)

> **Statut : brouillon.** Mail de release préparé pour la prochaine vague
> d'envois. À relire / amender (et dater le jour de l'envoi) avant diffusion.

---

Bonjour,

Voici les évolutions livrées sur OpenSankey, OpenSankey+ et SankeySuite avec la
version 1.1.7. Le fil conducteur : **passer du diagramme au site publié**.

## Le game changer : publier ses diagrammes comme un site en ligne

Jusqu'ici, partager un diagramme avec un public large demandait de bricoler un
export ou un hébergement à part. La 1.1.7 introduit un véritable **mode
Publication** : on transforme un ou plusieurs diagrammes en un **site web
autonome**, prêt à mettre en ligne.

- **Un portfolio de diagrammes.** On rassemble plusieurs diagrammes dans un site
  à pages, avec des **en-têtes de sections** sur la page d'accueil pour
  organiser la présentation. Les dossiers de travail marqués *Partenaires* ou
  *Interne* sont automatiquement écartés du site publié — pas de fuite
  involontaire.
- **Une génération en un clic.** La publication produit une **archive autonome**
  que l'on déploie en ligne ou que l'on garde en local. Lors d'une mise à jour,
  le déploiement **complète l'existant** et **sauvegarde automatiquement** la
  version précédente (datée) : on ne risque pas d'écraser un site en place.
- **Une lecture soignée pour le public.** En mode publication, le diagramme et
  sa documentation sont en lecture seule, avec un **bouton plein écran** dédié,
  l'**aide à la navigation** et un **bouton Doc** à portée du lecteur. Les
  réglages de publication sont mémorisés avec le diagramme.

C'est, concrètement, le chaînon qui manquait entre l'atelier d'analyse (saisir,
visualiser, documenter — apporté par la 1.1.5) et la **diffusion** : on publie
le résultat sans quitter OpenSankey.

## Intégrer un diagramme : ouvrir directement sur la bonne vue

Pour embarquer un diagramme dans un autre site ou une autre application, deux
nouvelles options permettent d'**imposer l'état initial** à l'ouverture : le
**mode de navigation** (absolu / proportionnel / adapté à l'échelle) et le
**data tag présélectionné** (une année, un territoire…). Le diagramme embarqué
s'ouvre ainsi tout de suite dans la bonne configuration, sans manipulation
du lecteur — pratique pour les intégrations sur mesure.

## Confort de visualisation

- **Sélecteur de data tag en barre du haut** : le choix de l'année / du
  territoire / de la donnée est désormais accessible directement en haut, en
  tout contexte (y compris en publication).
- **Sankey unitaire docké ou détaché** : le focus sur un nœud s'affiche à côté
  du diagramme dans la grande zone, ou se détache en fenêtre indépendante, avec
  un nœud central de taille homogène et des libellés mieux mis en page.
- **Versions et nouveautés dans l'application** : accès aux **versions
  archivées** et **changelog intégré** pour retrouver l'historique et pointer
  une version précise ; l'info-bulle de version indique la date et le repère de
  build.

## Fiabilité

- **Plus de flux fantômes en changeant d'année** : les flux qui apparaissaient
  ou disparaissaient indûment en parcourant les dataTags ont été éliminés, et la
  structure d'un diagramme ne « déteint » plus d'une année sur l'autre.
- **Stocks multi-données fiabilisés** : un diagramme dont les stocks portent
  plusieurs familles de données est relu fidèlement après enregistrement.
- **Cadenas des flux d'entrée/sortie préservé** au déplacement d'un nœud, et
  **échelle des flux conservée** après une complétion ou une réconciliation.
- **Ouverture plus robuste** : nœuds parents absents qui n'étaient plus recréés à
  tort, import de fichiers SankeyMATIC accentués corrigé sous Windows.

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

- **Mode Publication / portfolio** : génération d'un site autonome multi-pages,
  en-têtes de sections sur la page d'accueil, exclusion des dossiers
  *Partenaires* / *Interne*, déploiement additif avec sauvegarde datée,
  mémorisation des réglages de publication, lecture seule + plein écran + aide à
  la navigation + bouton Doc côté lecteur.
- **Viewer embarqué paramétrable** : options `position_mode` (mode de
  navigation à l'ouverture) et `data_tag_selection` (data tag présélectionné),
  lues via `window.sankey` et en props des Viewers ; chargement unique du
  diagramme côté viewer.
- **Sélecteur de data tag en barre du haut**, accessible en tout contexte.
- **Sankey unitaire** : panneau docké dans la grande zone ou détaché en
  fenêtre, nœud central homogène, libellés mis en page.
- **Versions & changelog dans l'app** : versions archivées, page changelog,
  info commit/date dans l'info-bulle de version.
- **Corrections** : flux fantômes entre dataTags éliminés, round-trip JSON des
  stocks multi-données, cadenas E/S préservé au drag, échelle des flux préservée
  à la complétion/réconciliation, orphelins `parent_name` à l'ouverture, import
  SankeyMATIC en UTF-8 sous Windows.

### OpenSankey+ (premium)

- **Publication multi-diagrammes** et réglages de publication persistés au
  niveau du portfolio.
- Améliorations du **Sankey unitaire** détaché et de la navigation entre vues.

### SankeySuite — MFA, réconciliation, conversion Excel

- **Fiabilité multi-dataTags** : stocks à plusieurs familles de données relus
  sans perte, échelle des flux préservée à la complétion et à la réconciliation.

## Infrastructure (information)

- Versions intermédiaires diffusées à des intégrateurs (dont IGN) consolidées
  dans cette 1.1.7 publique. Aucun impact utilisateur attendu.

---

N'hésitez pas à nous remonter vos retours ou à signaler tout comportement
inattendu — vos remarques orientent les prochaines versions.

Bonne exploration,

L'équipe Terriflux

---

**Pièce jointe suggérée** : une capture du mode Publication — page d'accueil du
portfolio avec ses en-têtes de sections, ou un diagramme publié en plein écran
avec le bouton Doc — pour illustrer en une image qu'OpenSankey publie désormais
des sites complets. À placer en tête de mail, sous la phrase d'intro.
