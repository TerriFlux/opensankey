Export animé des vues (GIF / WebM / séquence PNG)
====================================================

Fonctionnalité OpenSankey+ permettant d'exporter les vues d'un diagramme
en animation, soit comme GIF, soit comme vidéo WebM, soit comme archive
ZIP de PNG numérotés.

Accès
-----

Menu **Exporter** → section **Toutes les vues** → **Animation...**.

L'entrée n'est active que si le diagramme contient au moins une vue
OpenSankey+ (la maître seul ne suffit pas).

Paramètres de la modale
-----------------------

La modale est déplaçable (poignée sur la barre de titre) et propose :

- **Format** : GIF animé, WebM (vidéo) ou Séquence PNG (zip).
- **Vues à inclure** : liste des vues du diagramme avec
  - case à cocher pour inclure/exclure une vue ;
  - flèches haut / bas pour changer l'ordre dans l'animation.
- **Durée par vue** en millisecondes (défaut 1500 ms, plage 100–10000).
- **DPI** : 150 ou 300 — même résolution que l'export PNG / PDF simple.
- **Boucle** :

  - *Une fois* — l'animation joue puis s'arrête (GIF uniquement) ;
  - *Boucle infinie* — répétition sans fin (défaut, GIF uniquement) ;
  - *Aller-retour* — la séquence rebondit (V1→V2→V3→V2) avant de
    reprendre.

Le master n'est jamais inclus dans l'animation : ce n'est pas une vue
narrative mais le canevas d'édition.

Comment l'animation est produite
--------------------------------

Pour chaque vue sélectionnée, la modale :

1. bascule l'application sur la vue (``setCurrentView``),
2. attend deux frames d'animation pour laisser le rendu D3 se stabiliser,
3. récupère un PNG via le point de service ``/opensankey/save/png`` du
   serveur Flask (même rendu que l'export PNG simple — fonts, légende,
   gradients fidèles),
4. décode le PNG côté navigateur en ``ImageData`` ;

puis selon le format :

- **GIF** — encodage avec `gifenc <https://github.com/mattdesl/gifenc>`_ ;
  quantification 256 couleurs par frame, délai par frame configurable,
  paramètre ``repeat`` réglé selon le mode de boucle.
- **WebM** — capture d'un canvas via ``MediaRecorder`` (vp9 si supporté,
  vp8 sinon), affichage de chaque frame pendant la durée demandée.
- **PNG zip** — chaque frame est ajoutée à une archive ``JSZip`` avec un
  préfixe numérique pour préserver l'ordre.

Le fichier est nommé ``<nom_du_fichier>_animation.gif`` (ou
``.webm`` / ``.zip``) et téléchargé via ``FileSaver``.

Limitations connues
-------------------

- **Toutes les vues sélectionnées doivent partager les mêmes dimensions
  d'export** (largeur × hauteur). Sinon ``gifenc`` ou ``MediaRecorder``
  refuse les frames de taille variable. En pratique, les vues d'un même
  diagramme partagent la zone de dessin du master, donc OK ; le piège
  est si certaines vues sont passées en mode papier (paper mode) avec un
  format différent.
- **GIF** : palette 256 couleurs ; les dégradés des flux peuvent
  présenter des bandes visibles. Préférer **WebM** pour la qualité
  visuelle, **GIF** pour la compatibilité universelle (mail, tickets,
  réseaux sociaux).
- **WebM en temps réel** : l'enregistrement se fait pendant la
  visualisation des frames sur un canvas hors écran, donc le timing peut
  varier de quelques pourcents si l'onglet est en arrière-plan. Pour un
  rendu strictement constant, exporter en GIF.
- **Aller-retour** ne donne un effet visible qu'à partir de 3 vues (sur
  2 vues, l'animation revient à la première et c'est équivalent à une
  boucle simple).

Licence
-------

L'export animé fait partie d'OpenSankey+. Sans licence active, l'entrée
de menu apparaît grisée avec le tooltip *Cette fonctionnalité nécessite
OpenSankey+*. Les exports PNG / PDF simples (vue courante uniquement)
restent accessibles à tous, avec ajout d'un watermark *« réalisé avec
OpenSankey.fr »* si la licence n'est pas active.
