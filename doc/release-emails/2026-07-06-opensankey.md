# Mail du 6 juillet 2026 — Imports SankeyMATIC & STAN, mise en page, fiabilité (v1.2.0)

> **Statut : brouillon.** Couvre tout ce qui a été livré depuis la v1.1.7
> (dernier mail envoyé, 26 juin) : versions 1.1.8, 1.1.9 et 1.2.0. À relire /
> amender (et dater le jour de l'envoi) avant diffusion.

---

Bonjour,

Beaucoup de nouveautés depuis le dernier mail : la version 1.2.0 (et les
versions intermédiaires 1.1.8 et 1.1.9) ouvre l'application aux **diagrammes
venus d'autres outils** — SankeyMATIC et STAN s'importent désormais
nativement — et apporte de nouveaux réglages de mise en page ainsi qu'un
travail de fond sur la **fiabilité de vos fichiers**.

## Importer depuis SankeyMATIC et STAN

Vos diagrammes existants n'ont plus besoin d'être ressaisis :

- **SankeyMATIC** : ouvrez directement un fichier texte SankeyMATIC depuis le
  menu Ouvrir. Flux, couleurs et réglages sont repris, et la mise en page
  d'origine est reconstituée. Des modèles SankeyMATIC sont aussi proposés dans
  la bibliothèque.
- **STAN** : les fichiers `.smfa` du logiciel STAN s'ouvrent désormais
  directement — nœuds, flux et valeurs sont importés, prêts à être mis en
  forme et réconciliés.

## Éditer son diagramme en mode texte

Le panneau Tableur propose un nouveau mode **Texte** : le diagramme s'écrit et
se modifie au format texte SankeyMATIC (une ligne par flux), et chaque
application met à jour le dessin. Idéal pour saisir rapidement une structure,
ou copier-coller depuis un autre outil.

## Un tracé des flux plus fidèle

Nouvelle forme de flux « **Contour exact** » : les flux qui partent d'un même
nœud s'affichent en faisceaux parallèles et jointifs, sans chevauchement ni
interstice. Pendant les déplacements, le tracé reste fluide et se réajuste en
fin de geste.

## Mise en page : plus de contrôle sur l'échelle et les épaisseurs

- **Taille verrouillée intelligente** : quand le diagramme est en taille fixe
  et qu'un jeu de données déborde, le dessin se réduit automatiquement pour
  tout garder visible, puis reprend sa taille dès que possible.
- **Épaisseur maximale par vue** : chaque vue peut plafonner l'épaisseur
  d'échelle des flux — pratique quand des ordres de grandeur très différents
  cohabitent dans un même fichier.
- **Flux fins jusqu'à zéro** : le plancher d'épaisseur des flux peut descendre
  à 0 pour laisser les petits flux disparaître visuellement au lieu d'être
  grossis artificiellement.
- **Positionnement automatique plus juste** des entrées/sorties : l'algorithme
  tient compte des colonnes pour placer les flux d'import/export.
- **Élément de référence généralisé** : l'échelle du diagramme peut désormais
  se caler sur un nœud-stock, pas seulement sur un flux.

## Vues, étiquettes et publication

- **Générateur de vues** accessible depuis la barre du haut : déclinez un
  diagramme en une série de vues en quelques clics.
- **Jetons dynamiques dans les textes** : `{Scale}` insère l'échelle courante
  dans une étiquette ou un titre, et le jeton de view tag affiche la valeur du
  tag actif de la vue.
- **Exclure un nœud d'une vue** via l'anti-tag « 0 » — sans toucher à la
  structure.
- **Portfolio de publication** : titre personnalisable et logo, bouton plein
  écran dans la barre du haut, correctif du menu de téléchargement.

## Application multilingue

La documentation et les tutoriels sont désormais disponibles en **français,
anglais, espagnol, allemand et italien**, la langue choisie est mémorisée d'une
session à l'autre, et le tableur est intégralement traduit.

## Vos fichiers, plus fiables — et une plateforme durcie

Un important travail de fond sur l'enregistrement :

- des fichiers très anciens (2022) qui ne se chargeaient plus s'ouvrent de
  nouveau ;
- des réglages d'apparence qui pouvaient se perdre d'une sauvegarde à l'autre
  (tailles de police, bordures, position des étiquettes, ordre de
  superposition) sont désormais conservés à l'identique ;
- chaque évolution du logiciel est maintenant vérifiée automatiquement contre
  une collection de fichiers réels de toutes les époques : vos diagrammes
  restent rechargeables à l'identique, version après version.

Côté plateforme, la version 1.1.9 a apporté un durcissement complet de la
sécurité côté serveur (authentification des services, sauvegardes quotidiennes
hors site, supervision des trois environnements).

---

Comme toujours, vos retours orientent directement les priorités : répondez à ce
mail ou écrivez-nous.

Bonne exploration,

L'équipe TerriFlux — [open-sankey.fr](https://open-sankey.fr)
