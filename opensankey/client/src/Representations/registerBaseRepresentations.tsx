// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction.
// ==================================================================================================
// Author        : TerriFlux
// ==================================================================================================

// OS#1361 (D0) — Représentations de BASE, échelle DIAGRAMME.
//
// Les trois que la grande zone montait déjà (Sankey, Tableur, Doc) plus le
// Sankey unitaire d'OS+ : elles existaient, câblées une par une dans
// `TopBarStateButtons` (MenuTop). Les enregistrer ici ne change RIEN à leur
// rendu — elles gardent leur hôte — mais les fait exister comme entrées de
// l'axe « représentation », donc comme quelque chose qu'une publication peut
// offrir ou retirer, et qu'un sélecteur peut énumérer sans les connaître.
//
// os#1355 — D'où la forme `host` : le registre les NOMME, la grande zone les
// cadre comme n'importe quel occupant (cf. `menu_configuration.main_zone_*`).
// La règle « garder au moins un occupant » vit dans le modèle de la grande
// zone, pas ici : c'est une contrainte d'espace, pas de représentation.

import React from 'react'
import { FaProjectDiagram, FaTable, FaFileAlt, FaCode, FaInfoCircle, FaEye } from 'react-icons/fa'
// os#1473 — la couronne et les barres sont des natures d'OpenSankey, comme le sunburst.
import { registerAnalysisRepresentations } from './registerAnalysisRepresentations'
// os#1418 — une nature DÉCLARE ses réglages (défaut, sorte, libellés des 7 langues), et c'est
// cette déclaration qui lui donne la cascade des styles des nœuds et des flux.
import { figureAttribute } from './figureAttribute'

import type { Class_ApplicationData } from '../types/ApplicationData'
import {
  MAIN_ZONE_CANVAS_ID, MAIN_ZONE_SPREADSHEET_ID, MAIN_ZONE_DOC_ID, MAIN_ZONE_JSON_ID
} from '../types/MenuConfig'
import { representation_registry } from './RepresentationRegistry'
// sa#563 — la vue d'un groupe d'étiquettes : un document copié, mis en forme par le seul groupe.
import {
  mountTagGroupView, tagGroupsOf, tagGroupOfContext, TAG_GROUP_VIEW_OPTION_KEY
} from './TagGroupViewRepresentation'
// Les identifiants des deux natures de sa#563, dans leur module feuille : ils se citent depuis
// des modules qui ne peuvent pas tirer le registre (cf. son en-tête).
import {
  ELEMENT_INFO_REPRESENTATION_ID, TAG_GROUP_VIEW_REPRESENTATION_ID
} from './representationIds'
// os#1409 - le zoom est une capacite declaree par la nature (cf. Type_RepresentationZoom).
import { DIAGRAM_ZOOM } from './RepresentationZoom'
import { spreadsheetZoomHandle } from './SpreadsheetZoomBridge'

export const registerBaseRepresentations = (): void => {
  representation_registry.register({
    id: MAIN_ZONE_CANVAS_ID,
    scale: 'diagram',
    order: 10,
    label: (a) => a.t('Spreadsheet.zone.diagram'),
    icon: <FaProjectDiagram />,
    // Le SVG sous tout le reste : la grande zone lui réserve ce que les autres
    // occupants ne prennent pas, et c'est tout ce qu'il lui faut.
    host: 'canvas',
    // os#1409 — la transformation d3 existante, DÉCLARÉE et non plus câblée dans le contrôle.
    // Rien ne change pour le diagramme : c'est le cas de non-régression du lot.
    zoom: DIAGRAM_ZOOM
    // os#1418 — PAS D'`attributes`, et ce n'est pas un oubli : ce que le canevas montre se règle
    // sur le diagramme lui-même (l'inspecteur, les vues, les tags), pas sur la figure qui le
    // cadre. Une figure de canevas n'a donc rien en propre à porter.
  })

  representation_registry.register({
    id: MAIN_ZONE_SPREADSHEET_ID,
    scale: 'diagram',
    order: 20,
    label: (a) => a.t('Spreadsheet.zone.spreadsheet'),
    icon: <FaTable />,
    // os#1356 — PAS DE VERROU EN LECTURE, ET C'EST VOULU (arbitrage Julien).
    // Univer n'a pas de mode lecture seule ici : le visiteur d'une page publiée
    // peut donc éditer des cellules. Ce qu'il change vit dans SON navigateur —
    // ni le bundle servi ni les données n'en savent rien : c'est explorer, pas
    // altérer. Et plomber Univer interdirait du même coup les gestes qui font
    // l'intérêt du tableur pour un lecteur : trier une colonne, copier une
    // plage. Le trou n'est pas un oubli, ne le bouchez pas.
    //
    // PAS DE `renderOptions`, ET C'EST UN RETOUR ASSUMÉ. os#1405 avait donné au tableur un
    // réglage — l'écriture des matrices TES/TER, croix ou valeur — et l'avait posé ici, au motif
    // que les mêmes cellules restent à l'écran, écrites autrement. L'usage a tranché autrement :
    // on cherche les nombres de la matrice devant la matrice, dans le panneau qui porte déjà ce
    // que le tableur montre (onglets, colonnes, lignes). La commande vit donc dans la section
    // « tableur » de Filtres et coordonnées (cf. `SpreadsheetNavigationControls`), et nulle part
    // ailleurs. Conséquence attendue : la nature « tableur » ne compte plus pour
    // `activeRepresentation`, et le volet de représentation de l'inspecteur reste vide sur elle.
    //
    // os#1418 — pas d'`attributes` non plus, pour la même raison de fond : ce réglage n'est pas
    // celui d'une figure, il vit sur le document. Deux tableurs côte à côte montrent les mêmes
    // matrices, et c'est voulu — c'est une propriété du classeur, pas une façon de le regarder.
    // Le jour où un réglage PAR FIGURE apparaît (une feuille épinglée, par exemple), il se
    // déclare sur cette ligne.
    // os#1409 — LE ZOOM D'UNIVER, pilote par le controle de la colonne. Son API l'expose
    // vraiment (`FWorksheet.zoom` / `getZoom`, ratio 0,1 a 4) : c'est un zoom du MOTEUR de la
    // grille, qui recalcule ses cellules — et non une transformation posee par-dessus, qui
    // aurait fausse ses mesures. Conséquence assumée et voulue par l'issue : le curseur de zoom
    // du pied de la grille DISPARAIT (`footer.zoomSlider: false`, cf. UniverSpreadSheet) — deux
    // commandes pour un même geste sont exactement ce que ce chantier défait.
    //
    // Le pas n'est PAS celui du diagramme : racine de deux double l'échelle en deux crans, ce
    // qui est brutal sur des cellules dont on veut lire le texte. Un quart de plus par cran.
    zoom: {
      // La grille prête ses deux gestes en se montant (cf. SpreadsheetZoomBridge) ; hors
      // montage il n'y a personne à qui parler, et 1 est ce que montrerait une grille neuve.
      getScale: () => spreadsheetZoomHandle()?.getZoom() ?? 1,
      setScale: (ratio) => spreadsheetZoomHandle()?.setZoom(ratio),
      step: 1.25,
      min: 0.1,
      max: 4,
      neutral: 1,
      // Pas de grille montée = pas de zoom : le contrôle se grise en le disant, plutôt que
      // d'avaler les clics.
      isAvailable: () => spreadsheetZoomHandle() !== null
    },
    host: 'component'
  })

  // La vue JSON du format natif, au MÊME niveau que le tableur (cf. MAIN_ZONE_JSON_ID) : le
  // document entier, rendu comme le fichier qu'on enregistrerait. Elle était un sous-onglet du
  // tableur, ce qui lui coûtait une ligne d'en-tête et interdisait de la voir à côté de la
  // grille. Pas de `publish_option` propre : comme le tableur, elle est offerte au lecteur sauf
  // si la liste blanche `PublishOptions.representations` la retire — c'est exactement ce que
  // valait le sous-onglet, atteignable dès que le tableur l'était.
  // os#1409 — la vue JSON et la documentation NE DÉCLARENT PAS de zoom, et c'est un constat
  // daté, pas une propriété : leur zoom légitime serait la taille du texte, et rien n'existe
  // aujourd'hui pour la régler. Le contrôle de la colonne se grise donc en le disant. Le jour
  // où ce réglage sera écrit, il s'ajoute ici, sur la ligne de sa nature, et nulle part ailleurs.
  representation_registry.register({
    id: MAIN_ZONE_JSON_ID,
    scale: 'diagram',
    order: 25,
    label: (a) => a.t('Spreadsheet.zone.json'),
    icon: <FaCode />,
    // os#1418 — LA CLÉ RACINE REGARDÉE, déclarée ici bien que l'onglet vive dans l'éditeur.
    //
    // Elle est de sorte 'navigation' et pas 'style' : changer de clé racine ne change pas la
    // façon de lire le document, il change CE QU'ON LIT — `nodes` puis `links` ne sont pas deux
    // apparences du même texte. Deux fenêtres JSON côte à côte sur deux clés sont exactement
    // l'usage (cf. `describeContent`), et un style qui les alignerait le détruirait.
    //
    // LA CHAÎNE EST ÉCRITE EN DUR, et c'est la seule entorse du fichier : la constante est
    // `JSON_TAB_OPTION_KEY` de `packages/opensankey-editor/.../spreadsheet/jsonDocumentTabs.ts`,
    // et OS base ne remonte pas vers l'éditeur. Les deux doivent rester d'accord ; le jour où la
    // déclaration descend avec le reste, c'est l'import qui reprend sa place.
    attributes: {
      json_tab: figureAttribute<string | undefined>(undefined, 'navigation', {
        en: 'Root key shown',
        fr: 'Clé racine affichée',
        es: 'Clave raíz mostrada',
        de: 'Angezeigter Wurzelschlüssel',
        it: 'Chiave radice mostrata',
        'zh-CN': '显示的根键',
        ja: '表示するルートキー'
      })
    },
    host: 'component'
  })

  representation_registry.register({
    id: MAIN_ZONE_DOC_ID,
    scale: 'diagram',
    order: 30,
    label: (a) => a.t('Spreadsheet.zone.doc'),
    icon: <FaFileAlt />,
    publish_option: 'doc',
    // Même critère que `hasDocToShow` (publishedDoc, couche éditeur) : la doc
    // embarquée dans le diagramme, ou le document prêté par la page publiée.
    // Recopié plutôt qu'importé — OS base ne remonte pas vers l'éditeur.
    //
    // os#1356 — le critère ne vaut QU'EN LECTURE. En édition, l'onglet est le seul
    // endroit d'où l'on ÉCRIT la documentation : l'exiger déjà écrite le rendrait
    // inatteignable sur tout diagramme qui n'en a pas encore.
    isAvailable: ({ app_data }: { app_data: Class_ApplicationData }) =>
      !app_data.is_static ||
      app_data.documentation_markdown !== '' ||
      app_data.menu_configuration.doc_external !== null,
    // os#1418 — la documentation montre le document entier ; la taille du texte (cf. la note sur
    // le zoom plus haut) n'existe toujours pas et s'écrirait ici, et nulle part ailleurs.
    //
    // 19/09/2026 — LE MODE DE LECTURE, déclaré ici bien que le choix vive dans l'éditeur (la
    // section de navigation du panneau « Filtres et coordonnées », cf. docPanelMode.ts). De sorte
    // 'navigation' et pas 'style', comme la clé racine du JSON juste au-dessus : édition, côte à
    // côte ou aperçu ne sont pas trois apparences du même texte, ce sont trois choses différentes
    // sous les yeux — les sources, le rendu, les deux.
    //
    // LA CHAÎNE EST ÉCRITE EN DUR, même entorse et même raison que `json_tab` : la constante est
    // `DOC_MODE_OPTION_KEY` de `packages/opensankey-editor/.../spreadsheet/docPanelMode.ts`, et OS
    // base ne remonte pas vers l'éditeur. Les deux doivent rester d'accord.
    attributes: {
      doc_mode: figureAttribute<string | undefined>(undefined, 'navigation', {
        en: 'Display mode',
        fr: 'Mode d\'affichage',
        es: 'Modo de visualización',
        de: 'Anzeigemodus',
        it: 'Modalità di visualizzazione',
        'zh-CN': '显示模式',
        ja: '表示モード'
      })
    },
    host: 'component'
  })

  // os#1387 — Le panneau unitaire OS+ (`os.repr.unitary`, hôte externe) n'est PLUS offert à
  // l'échelle diagramme : le Sankey unitaire est une représentation d'UN NŒUD, et c'est la
  // fenêtre d'élément « Unit. » (`osp.repr.unit`) qui le porte, avec ses réglages et le choix
  // des nœuds. Deux interfaces pour le même objet, c'était une de trop (arbitrage Julien).
  // Les fichiers qui portent encore `os.repr.unitary` dans leur grande zone se relisent en
  // fenêtre « Unit. » sur la sélection (cf. mainZoneStateFromJSON).

  // ── 24/09/2026 — LE DISQUE N'EST PLUS UNE NATURE, C'EST UN MODE DE LA COURONNE ─────────────
  //
  // Julien : « tu peux enlever le sunburst maintenant je pense ». La couronne sait tout ce que le
  // disque savait — la descente, ses quatre réglages de lecture, ses anneaux
  // (`levels_display: 'rings'`), son zoom, ses parts réglables — et le geste de désagrégation est
  // le MÊME appel des deux côtés (`disaggregateAlong`). Deux entrées pour une figure, c'était une
  // de trop : on n'ajoutait plus rien à l'une sans devoir y penser pour l'autre.
  //
  // Son identifiant, lui, est dans des fichiers. Il se relit comme la couronne, avec le mode
  // anneaux posé pour que le dessin soit le même (cf. `retiredRepresentations`) : un classeur
  // enregistré avec un disque s'ouvre donc sur le dessin qu'il portait, indéfiniment.
  //
  // Le TRACÉ reste — c'est lui qui dessine les anneaux (`drawSunburstChart`), appelé désormais par
  // la couronne. Ce qui s'en va est l'entrée du sélecteur, et elle seule.


  // sa#563 (lot 1) — « INFOS » : CE QUE LA POP-UP DE PRÉSENTATION MONTRAIT DANS SA COLONNE
  // GAUCHE, devenu une nature comme les autres.
  //
  // C'est la pièce qui manquait pour que la pop-up d'un élément DEVIENNE un volet. Un volet est
  // un couple (sujet, nature) : le sujet était déjà là (le nœud, le flux), la nature non — les
  // blocs de présentation n'étaient atteignables que par la pop-up, qui les câblait elle-même.
  // Déclarés ici, ils prennent leur place dans le sélecteur de nature à côté d'« Unit. », de la
  // couronne et des barres, c'est-à-dire exactement là où l'issue les attend.
  //
  // `host: 'component'` et non `draw` : ces blocs sont du React — du texte libre, un bilan de
  // flux, des étiquettes —, et la couche éditeur les monte (cf. `elementComponentFor`,
  // MainZoneTabs). Les dessiner dans un conteneur aurait demandé une seconde racine React, donc
  // un arbre sans contexte : sans le thème Chakra dont ces blocs se servent à chaque ligne.
  //
  // PAS D'`attributes` : « Infos » ne règle rien. Ce qu'elle montre se règle sur l'ÉLÉMENT (le
  // sous-menu Info-bulle décide des blocs, la description est un attribut du nœud), pas sur la
  // figure qui l'affiche. La colonne d'outils reste donc vide sur elle, et c'est exact.
  representation_registry.register({
    id: ELEMENT_INFO_REPRESENTATION_ID,
    scale: 'element',
    order: 5,
    // La clé vit avec les autres natures de fenêtre (`Spreadsheet.zone.diagram`, `.spreadsheet`,
    // `.json`, `.doc`, `.unit`) et non sous `presentation.*`, qui n'a aucun catalogue : la
    // colonne de la pop-up se contentait d'un `defaultValue`, donc d'un libellé français pour
    // les sept langues. Une nature qui paraît dans le sélecteur de la barre du haut se traduit.
    label: (a) => a.t('Spreadsheet.zone.infos'),
    icon: <FaInfoCircle />,
    host: 'component'
  })

  // sa#563 (lot 4) — LA « VUE » D'UN GROUPE D'ÉTIQUETTES : le diagramme, mis en forme par le
  // seul groupe désigné. Le pourquoi et le comment sont dans `TagGroupViewRepresentation`.
  //
  // À L'ÉCHELLE DIAGRAMME, donc une fenêtre par document et non une par groupe : le groupe est
  // un RÉGLAGE, et changer de groupe se fait dans la colonne d'outils sans ouvrir de fenêtre de
  // plus. C'est aussi ce qui fait que son identifiant de fenêtre est son identifiant de nature,
  // l'invariant que lisent la barre du haut et le paramètre d'URL (cf.
  // `mainZoneSubjectUsesOwnWindowId`) — la nature n'avait donc rien à demander au modèle.
  representation_registry.register({
    id: TAG_GROUP_VIEW_REPRESENTATION_ID,
    scale: 'diagram',
    order: 35,
    // « SANKEY », le MÊME libellé que le canevas, et c'est délibéré (arbitrage d'Alexandre,
    // 22/09) : ces deux natures montrent la même chose — un Sankey —, l'une le document qu'on
    // édite, l'autre ce même document vu au travers d'un seul groupe d'étiquettes. Leur donner
    // deux noms aurait fait croire à deux espèces de dessin là où il n'y en a qu'une.
    //
    // CE QUI LES DISTINGUE EST ÉCRIT AILLEURS, et c'est le bon endroit : le nom du groupe, que
    // l'en-tête pose à côté du libellé (`describeContent`, juste dessous). Une fenêtre dit donc
    // « Sankey · Origine » là où le canevas dit « Sankey » tout court.
    label: (a) => a.t('Spreadsheet.zone.diagram'),
    icon: <FaEye />,
    // Un diagramme SANS aucun groupe d'étiquettes n'a rien à mettre en forme : la nature ne se
    // propose pas, plutôt que d'offrir une vue qui serait la copie conforme du diagramme.
    isAvailable: (ctx) => tagGroupsOf(ctx.app_data).length > 0,
    // CE QUE CE VOLET MONTRE, dans son en-tête : le NOM DU GROUPE. C'est le cas d'école du
    // contrat (cf. `describeContent`) — la nature montre une partie CHOISIE de son sujet, et
    // rien d'autre à l'écran ne la nomme. Sans lui, un volet « Vue » ne dirait pas de quel
    // groupe il parle, et le seul moyen de le savoir serait d'ouvrir la colonne d'outils.
    describeContent: (ctx) => tagGroupOfContext(ctx)?.name ?? '',
    attributes: {
      // De sorte 'identity' : ce réglage nomme un OBJET du document, pas une façon de dessiner.
      // Il ne part donc ni sur une figure voisine ni dans un style — la vue du groupe « Origine »
      // et celle du groupe « Usage » ne sont pas deux apparences de la même chose.
      [TAG_GROUP_VIEW_OPTION_KEY]: figureAttribute<string | undefined>(undefined, 'identity', {
        en: 'Tag group shown',
        fr: 'Groupe d\'étiquettes montré',
        es: 'Grupo de etiquetas mostrado',
        de: 'Angezeigte Etikettengruppe',
        it: 'Gruppo di etichette mostrato',
        'zh-CN': '显示的标签组',
        ja: '表示するタググループ'
      }, undefined, {
        kind: 'select',
        choicesOf: (ctx) => tagGroupsOf(ctx.app_data as unknown as Class_ApplicationData)
          .map(g => ({ value: g.id, label: g.name }))
      })
    },
    draw: mountTagGroupView
  })

  // os#1473 — LA COURONNE ET LES BARRES, ici et non plus en OS+ : elles n'ont rien de
  // particulier, et leurs tracés ont toujours vécu dans ce paquet.
  registerAnalysisRepresentations()
}
