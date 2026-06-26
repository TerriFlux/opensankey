# Mail du 26 juin 2026 — Panneaux détachables + fiabilité (v1.1.7)

> **Statut : brouillon.** Mail de release préparé pour la prochaine vague
> d'envois. À relire / amender (et dater le jour de l'envoi) avant diffusion.

---

Bonjour,

Voici les évolutions livrées sur OpenSankey, OpenSankey+ et SankeySuite avec la
version 1.1.7. Cette version consolide surtout l'**espace de travail** —
panneaux détachables, accès plus direct aux données — et apporte un lot
important de **corrections de fiabilité**.

## Détacher les panneaux dans des fenêtres séparées

Depuis la 1.1.5, le diagramme, le tableur et la documentation cohabitent dans
une grande zone partagée. La 1.1.7 va plus loin : plusieurs panneaux peuvent
désormais être **détachés dans des fenêtres indépendantes**.

- **Le panneau de configuration** (apparence des nœuds, flux, étiquettes) peut
  s'ouvrir dans sa propre fenêtre, à côté du diagramme — pratique sur un second
  écran, pour garder les réglages sous les yeux sans rogner la zone de dessin.
- **La documentation** se détache de la même façon : on lit ou on rédige ses
  notes dans une fenêtre dédiée pendant qu'on travaille sur le diagramme.
- **Le Sankey unitaire** (le focus sur un nœud) s'affiche au choix dans la
  grande zone à côté du diagramme **ou** détaché en fenêtre, avec un nœud
  central de taille homogène d'un focus à l'autre et des libellés mieux mis en
  page.

L'idée : laisser chacun **organiser son espace de travail** selon ses écrans et
ses habitudes, au lieu de tout empiler dans une seule fenêtre.

## Accès plus direct aux données

- **Sélecteur de data tag en barre du haut** : le choix de l'année / du
  territoire / de la donnée est désormais accessible directement en haut de
  l'écran, en tout contexte.
- **Versions et nouveautés dans l'application** : un accès aux **versions
  archivées** et une page **changelog** intégrée permettent de retrouver
  l'historique et de pointer une version précise ; l'info-bulle de version
  indique la date et le repère de build.

## Fiabilité : un lot important de corrections

- **Plus de flux fantômes en changeant d'année** : les flux qui apparaissaient
  ou disparaissaient indûment en parcourant les dataTags ont été éliminés, et la
  structure d'un diagramme ne « déteint » plus d'une année sur l'autre.
- **Stocks multi-données fiabilisés** : un diagramme dont les stocks portent
  plusieurs familles de données est relu fidèlement après enregistrement (plus
  de perte ni d'incohérence au rechargement).
- **Cadenas des flux d'entrée/sortie préservé** au déplacement d'un nœud, et
  **échelle des flux conservée** après une complétion ou une réconciliation.
- **Ouverture plus robuste** : nœuds parents absents qui n'étaient plus recréés
  à tort, import de fichiers SankeyMATIC accentués corrigé sous Windows, et
  divers ajustements d'affichage (menus, toolbars, légendes).

## Version précédente toujours disponible

En cas de problème de compatibilité, la version précédente reste accessible sur
https://backup.open-sankey.fr. Merci de nous remonter le problème en parallèle,
nous corrigeons rapidement.

---

## Détail par produit

### OpenSankey (base)

- **Panneaux détachables** : panneau de configuration et documentation
  ouvrables en fenêtres séparées ; Sankey unitaire docké dans la grande zone ou
  détaché en fenêtre, nœud central homogène, libellés mis en page.
- **Sélecteur de data tag en barre du haut**, accessible en tout contexte.
- **Versions & changelog dans l'app** : versions archivées, page changelog,
  info commit/date dans l'info-bulle de version.
- **Corrections** : flux fantômes entre dataTags éliminés, round-trip JSON des
  stocks multi-données, cadenas E/S préservé au drag, échelle des flux préservée
  à la complétion/réconciliation, orphelins `parent_name` à l'ouverture, import
  SankeyMATIC en UTF-8 sous Windows, ajustements d'affichage divers.

### OpenSankey+ (premium)

- Sankey unitaire détaché et navigation entre vues améliorés.

### SankeySuite — MFA, réconciliation, conversion Excel

- **Fiabilité multi-dataTags** : stocks à plusieurs familles de données relus
  sans perte, échelle des flux préservée à la complétion et à la réconciliation.

---

N'hésitez pas à nous remonter vos retours ou à signaler tout comportement
inattendu — vos remarques orientent les prochaines versions.

Bonne exploration,

L'équipe Terriflux

---

**Pièce jointe suggérée** : une capture montrant le panneau de configuration (ou
la documentation) détaché dans une fenêtre à côté du diagramme — pour illustrer
en une image l'espace de travail multi-fenêtres.
